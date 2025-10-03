import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { showOsNotification } from "../utils/osNotify";
// lazy import socket.io-client in runtime to avoid build-time type issues
let socket: unknown = null;

export async function connectNotifications(
  token: string | null,
  userId: string | null
) {
  if (!token || !userId) return null;
  if (socket) return socket;
  // Attempt a runtime import of socket.io-client. This may not be installed
  // in all environments (e.g., lightweight dev setups). We use a try/catch
  // and `/* @vite-ignore */` so the dev server won't fail to resolve the
  // module at build-time when it's intentionally absent.
  try {
    // Use a runtime-evaluated import to avoid Vite trying to resolve the
    // literal module at build/transform time. This will perform the import
    // at runtime only if the environment provides the package.
    const mod = await (new Function(
      'return import("socket.io-client")'
    )() as Promise<unknown>);
    const maybeIo = mod as unknown as Record<string, unknown>;
    const ioFn = (maybeIo.io || maybeIo.default || maybeIo) as unknown as (
      base?: string,
      opts?: Record<string, unknown>
    ) => unknown;
    const maybeBase = (globalThis as unknown as Record<string, unknown>)
      ?.VITE_API_URL;
    const base = typeof maybeBase === "string" ? maybeBase : "";
    socket = ioFn(base, { auth: { token }, query: { userId } });
  } catch {
    // Socket client not available; skip realtime features silently
    // This prevents hard failures in environments without the package.
    console.info("socket.io-client not available, skipping socket setup");
    return null;
  }
  return socket;
}

interface SocketLike {
  on: (event: string, cb: (...args: unknown[]) => void) => void;
  off?: (event: string, cb: (...args: unknown[]) => void) => void;
}

export default function useNotifications(
  token: string | null,
  userId: string | null
) {
  const qc = useQueryClient();
  useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await connectNotifications(token, userId);
      if (!mounted || !s) return;
      const onNew = (payload?: unknown) => {
        try {
          // debug visibility for incoming events
          console.debug("[useNotifications] event received:", payload);
        } catch {
          /* ignore debug errors */
        }
        // invalidate list + unread count
        qc.invalidateQueries({ queryKey: ["notifications", String(userId)] });
        qc.invalidateQueries({ queryKey: ["notifications", "unreadCount"] });
        // update badge cache if present
        try {
          const badge = qc.getQueryData<{
            notifications: number;
            messages?: number;
          }>(["badge", String(userId)]) || { notifications: 0, messages: 0 };
          const p = payload as Record<string, unknown> | undefined;
          const count =
            p && typeof p.count === "number" ? (p.count as number) : undefined;
          qc.setQueryData(["badge", String(userId)], {
            notifications: count ?? badge.notifications + 1,
            messages: badge.messages ?? 0,
          });
        } catch {
          /* ignore cache errors */
        }
        // bump unread count optimistically so header badge updates immediately
        try {
          const cur = (qc.getQueryData<number>([
            "notifications",
            "unreadCount",
          ]) ?? 0) as number;
          qc.setQueryData(["notifications", "unreadCount"], cur + 1);
        } catch {
          // ignore cache errors
        }
        try {
          const p = payload as Record<string, unknown> | undefined;
          const title =
            (p && String((p.title as unknown) ?? "")) || "Thông báo mới";
          const body =
            (p && String((p.body as unknown) ?? "")) || "Bạn có thông báo mới";
          const data =
            (p && (p.data as Record<string, unknown> | undefined)) || undefined;
          const url = data && data.url ? String(data.url) : null;
          // OS notification first (best-effort)
          void showOsNotification({
            title,
            body,
            onClick: () => {
              if (url) {
                try {
                  window.open(url, "_blank");
                } catch {
                  /* ignore open error */
                }
              }
            },
          });
          // Fallback to in-app toast
          toast.info(`${title}: ${body}`, {
            autoClose: 5000,
            onClick: url
              ? () => {
                  try {
                    window.open(url, "_blank");
                  } catch {
                    // ignore
                  }
                }
              : undefined,
          });
        } catch {
          // ignore toast errors
        }
      };
      const sock = s as unknown as SocketLike;
      // listen to both singular and plural forms (server may emit either)
      sock.on("notification:new", onNew);
      sock.on("notifications:new", onNew);
      // debug connect
      try {
        console.debug("[useNotifications] socket connected for user", userId);
      } catch {
        /* ignore debug errors */
      }
      return () => {
        if (sock.off) sock.off("notification:new", onNew);
      };
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, userId]);
}
