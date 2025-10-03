import { useEffect, useRef } from "react";

type Options = {
  soundUrl?: string; // e.g. "/sound/new-notification-010-352755.mp3"
  title?: string; // notification title
  showPopupWhenVisible?: boolean; // if true, show system notification even when tab is visible
};

/**
 * Hook for chat notifications: plays audio (after first user interaction),
 * badges favicon with unread count, and shows system notifications when tab is hidden.
 */
export function useChatNotifications(opts?: Options) {
  const soundUrl = opts?.soundUrl || "/sound/new-notification-010-352755.mp3";
  const title = opts?.title || "Tin nhắn mới";
  const showPopupWhenVisible = Boolean(opts?.showPopupWhenVisible);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const originalFaviconHrefRef = useRef<string | null>(null);
  const originalTitleRef = useRef<string | null>(null);

  // Install audio element lazily and unlock on first interaction
  useEffect(() => {
    audioRef.current = new Audio(soundUrl);
    audioRef.current.preload = "auto";
    audioRef.current.volume = 0.6;

    const unlock = () => {
      if (!audioRef.current) return;
      // Try to play muted to unlock gesture requirement
      const el = audioRef.current;
      const prev = el.muted;
      el.muted = true;
      el.play().finally(() => {
        el.pause();
        el.currentTime = 0;
        el.muted = prev;
        // unlocked
      });
      // Ask for notifications permission on first interaction if still default
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

  // Favicon helpers
  const getFaviconLink = () => {
    const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
    return link;
  };

  const drawBadgeOnFavicon = (count: number) => {
    const link = getFaviconLink();
    if (!link) return;
    if (!originalFaviconHrefRef.current) {
      originalFaviconHrefRef.current = link.href;
    }
    // Load image and draw badge
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
      // Draw base icon
      ctx.drawImage(img, 0, 0, size, size);
      // Draw red badge
      const r = 18;
      ctx.beginPath();
      ctx.fillStyle = "#ef4444"; // red-500
      ctx.arc(size - r, r, r, 0, Math.PI * 2);
      ctx.fill();
      // Text
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

  // Title helpers
  const badgeTitle = (count: number) => {
    if (originalTitleRef.current == null) {
      originalTitleRef.current = document.title;
    }
    const base = originalTitleRef.current || title;
    document.title = `(${count}) ${base}`;
  };

  const resetTitle = () => {
    if (originalTitleRef.current != null) {
      document.title = originalTitleRef.current;
    }
  };

  // System notifications permission
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Public API
  const notifyNewMessages = (unreadCount: number, body?: string) => {
    // Favicon badge
    if (unreadCount > 0) drawBadgeOnFavicon(unreadCount);
    else resetFavicon();

    // Audio
    if (unreadCount > 0) {
      // Best effort: try even before unlock; some browsers may allow
      audioRef.current?.play().catch(() => {});
    }

    // Title badge
    if (unreadCount > 0) badgeTitle(unreadCount);
    else resetTitle();

    // System notification
    if (unreadCount > 0 && "Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          if (document.hidden || showPopupWhenVisible) {
            new Notification(title, {
              body: body || "Bạn có tin nhắn mới",
            });
          }
        } catch {
          // ignore
        }
      }
    }
  };

  const playSoundOnly = () => {
    // Best effort play; unlock improves success rate but don't hard-block
    audioRef.current?.play().catch(() => {});
  };

  const clearIndicators = () => {
    resetFavicon();
    resetTitle();
  };

  const setBadge = (unreadCount: number) => {
    if (unreadCount > 0) {
      drawBadgeOnFavicon(unreadCount);
      badgeTitle(unreadCount);
    } else {
      resetFavicon();
      resetTitle();
    }
  };

  // Public: set ONLY the title badge (without touching favicon)
  const setTitleBadge = (unreadCount: number) => {
    if (unreadCount > 0) badgeTitle(unreadCount);
    else resetTitle();
  };
  const notifyOnNew = (body?: string) => {
    // âm thanh
    audioRef.current?.play().catch(() => {});
    // popup (ẩn tab hoặc cho phép hiển thị khi đang thấy)
    if ("Notification" in window && Notification.permission === "granted") {
      if (document.hidden || showPopupWhenVisible) {
        try {
          new Notification(title, { body: body || "Bạn có tin nhắn mới" });
        } catch {
          // ignore
        }
      }
    }
  };
  return {
    notifyNewMessages,
    playSoundOnly,
    clearIndicators,
    setBadge,
    notifyOnNew,
    setTitleBadge,
  };
}
