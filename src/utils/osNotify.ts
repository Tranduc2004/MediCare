export type OsNotif = {
  title: string;
  body?: string;
  icon?: string;
  onClick?: () => void;
};

export async function showOsNotification({
  title,
  body,
  icon,
  onClick,
}: OsNotif) {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  const ensure = async () => {
    const n = new Notification(title, { body, icon });
    n.onclick = () => {
      try {
        window.focus();
      } catch {
        /* ignore focus errors */
      }
      onClick?.();
      n.close();
    };
  };

  if (Notification.permission === "granted") return ensure();
  if (Notification.permission !== "denied") {
    const p = await Notification.requestPermission();
    if (p === "granted") return ensure();
  }
}
