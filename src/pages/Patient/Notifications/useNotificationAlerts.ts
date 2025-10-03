import { useEffect, useRef } from "react";

type Options = {
  soundUrl?: string;
  title?: string;
  showPopupWhenVisible?: boolean;
};

/**
 * Hook for notification alerts: plays audio (after first user interaction),
 * badges favicon with unread count, and shows system notifications when tab is hidden.
 */
export function useNotificationAlerts(opts?: Options) {
  const soundUrl = opts?.soundUrl || "/sound/new-notification-010-352755.mp3";
  const title = opts?.title || "Thông báo mới";
  const showPopupWhenVisible = Boolean(opts?.showPopupWhenVisible);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const originalFaviconHrefRef = useRef<string | null>(null);
  const originalTitleRef = useRef<string | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(soundUrl);
    audioRef.current.preload = "auto";
    audioRef.current.volume = 0.6;

    const unlock = () => {
      if (!audioRef.current) return;
      const el = audioRef.current;
      const prev = el.muted;
      el.muted = true;
      el.play().finally(() => {
        el.pause();
        el.currentTime = 0;
        el.muted = prev;
      });
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
    window.addEventListener("click", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true });
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, [soundUrl]);

  const getFaviconLink = () =>
    document.querySelector<HTMLLinkElement>("link[rel*='icon']");

  const drawBadgeOnFavicon = (count: number) => {
    const link = getFaviconLink();
    if (!link) return;
    if (!originalFaviconHrefRef.current)
      originalFaviconHrefRef.current = link.href;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const size = 64;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const r = 18;
      ctx.beginPath();
      ctx.fillStyle = "#ef4444";
      ctx.arc(size - r, r, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 22px system-ui, -apple-system, Segoe UI, Roboto";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const text = count > 99 ? "99+" : String(count);
      ctx.fillText(text, size - r, r + 1);
      link.href = canvas.toDataURL("image/png");
    };
    img.src = originalFaviconHrefRef.current || link.href;
  };

  const resetFavicon = () => {
    const link = getFaviconLink();
    if (!link || !originalFaviconHrefRef.current) return;
    link.href = originalFaviconHrefRef.current;
  };

  const badgeTitle = (count: number) => {
    if (originalTitleRef.current == null)
      originalTitleRef.current = document.title;
    const base = originalTitleRef.current || title;
    document.title = `(${count}) ${base}`;
  };

  const resetTitle = () => {
    if (originalTitleRef.current != null)
      document.title = originalTitleRef.current;
  };

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const notify = (count: number, body?: string) => {
    if (count > 0) drawBadgeOnFavicon(count);
    else resetFavicon();

    if (count > 0) audioRef.current?.play().catch(() => {});

    if (count > 0) badgeTitle(count);
    else resetTitle();

    if (count > 0 && "Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          if (document.hidden || showPopupWhenVisible) {
            new Notification(title, { body: body || "Bạn có thông báo mới" });
          }
        } catch (e) {
          // ignore notification display errors (best-effort)
          void e;
        }
      }
    }
  };

  return {
    notify,
    reset: () => {
      resetFavicon();
      resetTitle();
    },
    playSound: () => audioRef.current?.play().catch(() => {}),
  };
}
