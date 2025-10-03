import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosConfig";

// Create socket at runtime to avoid Vite resolving socket.io-client at build time
async function createSocket(base: string, token: string | null) {
  try {
    const mod = await (new Function(
      'return import("socket.io-client")'
    )() as Promise<unknown>);
    const maybeIo = mod as unknown as Record<string, unknown>;
    const ioFn = (maybeIo.io || maybeIo.default || maybeIo) as unknown as (
      base?: string,
      opts?: Record<string, unknown>
    ) => unknown;
    return ioFn(base, { auth: { token }, transports: ["websocket"] });
  } catch {
    console.info("socket.io-client not available, skipping badge socket setup");
    return null;
  }
}

type Badge = { notifications: number; messages: number };

export function useBadgeCounts(token: string | null, userId: string | null) {
  const qc = useQueryClient();

  const query = useQuery<Badge>({
    queryKey: ["badge", userId],
    queryFn: async () => {
      const res = await api.get(`/notifications/unread-count`, {
        params: { userId },
      });
      return res.data as Badge;
    },
    enabled: !!userId,
    refetchOnWindowFocus: "always",
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!token || !userId) return;
    let mounted = true;
    (async () => {
      const s = await createSocket(import.meta.env.VITE_API_URL ?? "", token);
      if (!mounted || !s) return;

      const sock = s as unknown as {
        on: (e: string, cb: (...args: unknown[]) => void) => void;
        disconnect?: () => void;
      };
      sock.on("connect_error", () => {
        try {
          console.debug("[useBadgeCounts] socket connect_error");
        } catch {
          /* ignore */
        }
      });
      sock.on("notifications:new", (...args: unknown[]) => {
        try {
          console.debug("[useBadgeCounts] notifications:new", args[0]);
        } catch {
          /* ignore */
        }
        const payload =
          (args[0] as { count?: number } | undefined) ?? undefined;
        qc.setQueryData<Badge>(["badge", userId], (old) => ({
          notifications: payload?.count ?? (old?.notifications ?? 0) + 1,
          messages: old?.messages ?? 0,
        }));
      });
      sock.on("notifications:read", (...args: unknown[]) => {
        try {
          console.debug("[useBadgeCounts] notifications:read", args[0]);
        } catch {
          /* ignore */
        }
        const payload =
          (args[0] as { count?: number } | undefined) ?? undefined;
        qc.setQueryData<Badge>(["badge", userId], (old) => ({
          notifications: payload?.count ?? 0,
          messages: old?.messages ?? 0,
        }));
      });

      sock.on("messages:new", (...args: unknown[]) => {
        try {
          console.debug("[useBadgeCounts] messages:new", args[0]);
        } catch {
          /* ignore */
        }
        const payload =
          (args[0] as { delta?: number } | undefined) ?? undefined;
        qc.setQueryData<Badge>(["badge", userId], (old) => ({
          notifications: old?.notifications ?? 0,
          messages: (old?.messages ?? 0) + (payload?.delta ?? 1),
        }));
      });

      return () => {
        if (sock.disconnect) sock.disconnect();
      };
    })();

    return () => {
      mounted = false;
    };
  }, [token, userId, qc]);

  return query;
}
