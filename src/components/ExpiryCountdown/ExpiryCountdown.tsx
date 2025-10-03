import { useEffect, useMemo, useState } from "react";

type Props = {
  /** thời điểm hết hạn do server trả về (ISO / number / Date) */
  expiresAt: string | number | Date | undefined | null;
  /** thời gian hiện tại do server trả về để tránh lệch giờ (tùy chọn) */
  serverNow?: string | number | Date;
  /** callback khi về 0 */
  onExpire?: () => void;
  /** class bổ sung */
  className?: string;
  /** nhãn trước thời gian (VD: "Còn") */
  prefix?: string;
};

function fmt(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export default function ExpiryCountdown({
  expiresAt,
  serverNow,
  onExpire,
  className = "",
  prefix = "Còn",
}: Props) {
  const expiryMs = useMemo(
    () => (expiresAt ? +new Date(expiresAt) : NaN),
    [expiresAt]
  );
  const baseNow = useMemo(
    () => (serverNow ? +new Date(serverNow) : Date.now()),
    [serverNow]
  );
  const skew = useMemo(() => baseNow - Date.now(), [baseNow]);

  const [now, setNow] = useState(Date.now() + skew);

  useEffect(() => {
    if (!isFinite(expiryMs)) return;

    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      setNow(Date.now() + skew);
      id = setTimeout(tick, 1000 - ((Date.now() + skew) % 1000));
    };
    tick();
    return () => clearTimeout(id);
  }, [expiryMs, skew]);

  // luôn tính remaining, kể cả khi expiryMs không hợp lệ
  const remaining = isFinite(expiryMs) ? Math.max(0, expiryMs - now) : 0;

  useEffect(() => {
    if (remaining === 0) {
      onExpire?.();
    }
  }, [remaining, onExpire]);

  const expired = remaining <= 0;

  return (
    <span
      className={
        `inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ` +
        (expired ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900") +
        (className ? ` ${className}` : "")
      }
      aria-live="polite"
      title={expired ? "Hạn thanh toán đã hết" : "Thời gian còn lại"}
    >
      {expired ? "Đã hết hạn" : `${prefix} ${fmt(remaining)}`}
    </span>
  );
}
