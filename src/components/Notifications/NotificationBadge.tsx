// React import not required with new JSX transform
import useUnreadNotifications from "./useUnreadNotifications";

type Props = {
  // optional externally provided count; if omitted, the hook will be used
  count?: number | null;
};

export default function NotificationBadge({ count: propCount }: Props) {
  const hookCount = useUnreadNotifications();
  const count = typeof propCount === "number" ? propCount : hookCount;
  if (import.meta.env.DEV) {
    // quick dev-only visibility to help debugging in browser console
    console.debug("NotificationBadge unread count:", count);
  }
  // Always render the bell icon; show numeric badge only when count > 0
  return (
    <div
      className="relative inline-flex"
      title={count > 0 ? `${count} thông báo` : "Thông báo"}
      aria-label={count > 0 ? `Có ${count} thông báo` : "Không có thông báo"}
      data-unread={count}
    >
      <svg
        className="w-6 h-6 text-gray-700"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118.6 14.6V11a6 6 0 10-12 0v3.6c0 .538-.214 1.055-.595 1.395L4 17h5" />
      </svg>

      {count && count > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] leading-none px-1.5 py-0.5 min-w-[18px] h-[18px]">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  );
}

// (Hook moved to a dedicated file to keep Fast Refresh happy)
