import { useEffect, useMemo, useRef, useState } from "react";
import {
  getMyAppointmentHistory,
  getMyAppointments,
  getDoctorSchedules,
} from "../../../api/appointmentApi";
import { useAuth } from "../../../contexts/AuthContext";
import {
  FaCalendarAlt,
  FaClock,
  FaSearch,
  FaTimes,
  FaFileCsv,
  FaPrint,
  FaFilePdf,
  FaShareAlt,
  FaCalendarPlus,
  FaTag,
} from "react-icons/fa";
import ChatModal from "../../../components/Doctor/Chat/ChatModal";
import { sendMessage } from "../../../api/chatApi";

/* ================== Types & constants ================== */
type StatusKey =
  | "booked"
  | "doctor_approved"
  | "doctor_rejected"
  | "doctor_reschedule"
  | "pending_payment"
  | "await_payment"
  | "payment_overdue"
  | "paid"
  | "payment_failed"
  | "confirmed"
  | "in_consult"
  | "prescription_issued"
  | "ready_to_discharge"
  | "completed"
  | "cancelled"
  | "closed";

type AppointmentItem = {
  _id: string;
  status: StatusKey | string;
  symptoms?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  patientInfo?: {
    name: string;
    phone: string;
    email: string;
  };
  doctorId?: {
    _id: string;
    name: string;
    specialty?: string;
    workplace?: string;
  };
  scheduleId?: {
    _id: string;
    date?: string;
    startTime?: string;
    endTime?: string;
  };
  // When doctor proposes a concrete schedule this may be populated
  newScheduleId?:
    | {
        _id?: string;
        date?: string;
        startTime?: string;
        endTime?: string;
      }
    | string;
  mode?: "online" | "offline" | string;
};

type TabKey = StatusKey | "all";

const STATUS_META: Record<
  StatusKey,
  { label: string; badge: string; dot: string; colorHex: string }
> = {
  booked: {
    label: "Mới đặt lịch",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    dot: "bg-amber-400",
    colorHex: "#f59e0b",
  },
  doctor_approved: {
    label: "Bác sĩ đã duyệt",
    badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    dot: "bg-sky-500",
    colorHex: "#0284c7",
  },
  doctor_rejected: {
    label: "Bác sĩ từ chối",
    badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    dot: "bg-rose-500",
    colorHex: "#e11d48",
  },
  doctor_reschedule: {
    label: "Cần đổi lịch",
    badge: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
    dot: "bg-orange-500",
    colorHex: "#ea580c",
  },
  pending_payment: {
    label: "Chờ thanh toán",
    badge: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200",
    dot: "bg-yellow-400",
    colorHex: "#eab308",
  },
  await_payment: {
    label: "Chờ thanh toán",
    badge: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200",
    dot: "bg-yellow-400",
    colorHex: "#eab308",
  },
  payment_overdue: {
    label: "Đặt lịch thất bại",
    badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    dot: "bg-rose-500",
    colorHex: "#e11d48",
  },
  paid: {
    label: "Đã thanh toán",
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    dot: "bg-emerald-500",
    colorHex: "#10b981",
  },
  payment_failed: {
    label: "Thanh toán thất bại",
    badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    dot: "bg-rose-500",
    colorHex: "#e11d48",
  },
  confirmed: {
    label: "Đã xác nhận",
    badge: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
    dot: "bg-teal-500",
    colorHex: "#0d9488",
  },
  in_consult: {
    label: "Đang khám",
    badge: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    dot: "bg-violet-500",
    colorHex: "#7c3aed",
  },
  prescription_issued: {
    label: "Đã kê đơn",
    badge: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
    dot: "bg-indigo-500",
    colorHex: "#4f46e5",
  },
  ready_to_discharge: {
    label: "Sẵn sàng kết thúc",
    badge: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
    dot: "bg-teal-500",
    colorHex: "#0d9488",
  },
  completed: {
    label: "Hoàn thành",
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    dot: "bg-emerald-500",
    colorHex: "#10b981",
  },
  cancelled: {
    label: "Đã hủy",
    badge: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    dot: "bg-slate-400",
    colorHex: "#94a3b8",
  },
  closed: {
    label: "Đã đóng",
    badge: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    dot: "bg-slate-500",
    colorHex: "#64748b",
  },
};

const STATUS_ORDER: StatusKey[] = [
  "booked",
  "doctor_approved",
  "pending_payment",
  "payment_overdue",
  "paid",
  "confirmed",
  "in_consult",
  "prescription_issued",
  "completed",
];

/* ================== Helpers ================== */
function initials(name?: string) {
  if (!name) return "BS";
  const p = name.trim().split(/\s+/);
  return `${(p[0]?.[0] || "").toUpperCase()}${(
    p[p.length - 1]?.[0] || ""
  ).toUpperCase()}`;
}
function formatDate(d?: string) {
  if (!d) return "--";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}
function formatRange(s?: string, e?: string) {
  if (!s || !e) return "--";
  return `${s} – ${e}`;
}
function parseService(note?: string) {
  if (!note) return "";
  const m = note.match(/\[Dịch vụ\]\s*([^|]+)/);
  return m?.[1]?.trim() || "";
}

/* ================== Modal ================== */
function Modal({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Đóng"
          >
            <FaTimes />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ================== Stepper (tiến trình) ================== */
function Stepper({
  current,
  cancelled,
}: {
  current: StatusKey;
  cancelled?: boolean;
}) {
  const idx = Math.max(STATUS_ORDER.indexOf(current), 0);
  return (
    <div className="flex items-center gap-2">
      {STATUS_ORDER.map((st, i) => {
        const active = i <= idx && !cancelled;
        return (
          <div key={st} className="flex items-center gap-2">
            <div
              className={`h-1.5 w-8 rounded ${
                i === 0 ? "hidden" : active ? "bg-teal-500" : "bg-slate-200"
              }`}
            />
            <div
              className={`h-6 w-6 shrink-0 rounded-full border text-[10px] font-semibold flex items-center justify-center ${
                cancelled
                  ? "border-rose-400 text-rose-600"
                  : active
                  ? "border-teal-500 text-teal-700"
                  : "border-slate-300 text-slate-400"
              }`}
              title={STATUS_META[st].label}
            >
              {i + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ================== Component ================== */
export default function AppointmentHistoryPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<AppointmentItem[]>([]);

  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const PAGE = 12;
  const [limit, setLimit] = useState(PAGE);
  useEffect(() => setLimit(PAGE), [activeTab, q, from, to]);

  // Tabs to show in the toolbar - include doctor_reschedule so patients can filter proposals

  const [detail, setDetail] = useState<AppointmentItem | null>(null);
  const printRef = useRef<HTMLDivElement | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatAppointment, setChatAppointment] =
    useState<AppointmentItem | null>(null);

  // derive chat modal payload matching ChatModal's Appointment interface
  const chatModalPayload = chatAppointment
    ? {
        _id: chatAppointment._id,
        patientId: {
          _id: user?._id || "",
          name: chatAppointment.patientInfo?.name || user?.name || "",
          email: chatAppointment.patientInfo?.email || user?.email || "",
          phone: chatAppointment.patientInfo?.phone || user?.phone || "",
        },
        scheduleId: {
          _id: chatAppointment.scheduleId?._id || "",
          date: chatAppointment.scheduleId?.date || chatAppointment.updatedAt,
          startTime: chatAppointment.scheduleId?.startTime || "00:00",
          endTime: chatAppointment.scheduleId?.endTime || "00:00",
        },
        status: chatAppointment.status || "booked",
        symptoms: chatAppointment.symptoms,
        note: chatAppointment.note,
        createdAt: chatAppointment.createdAt,
      }
    : null;

  /* -------- load data -------- */
  useEffect(() => {
    (async () => {
      if (!user?._id) return;
      setLoading(true);
      setError("");
      try {
        const [curr, hist] = await Promise.all([
          getMyAppointments(user._id),
          getMyAppointmentHistory(user._id),
        ]);
        const mergedArr: AppointmentItem[] = [
          ...(Array.isArray(curr) ? curr : []),
          ...(Array.isArray(hist) ? hist : []),
        ];
        // Deduplicate by _id robustly: stringify ids and keep the most recent entry per id
        const byId = new Map<string, AppointmentItem>();
        for (const ap of mergedArr) {
          const id = String(ap._id);
          if (!byId.has(id)) {
            byId.set(id, ap);
            continue;
          }
          const existing = byId.get(id)!;
          const existingKey =
            existing.scheduleId?.date || existing.updatedAt || "";
          const currentKey = ap.scheduleId?.date || ap.updatedAt || "";
          if (currentKey > existingKey) {
            byId.set(id, ap);
          }
        }
        const merged = Array.from(byId.values());
        // Final guard: ensure unique _id strings
        const uniq: AppointmentItem[] = [];
        const seen = new Set<string>();
        for (const a of merged) {
          const id = String(a._id);
          if (seen.has(id)) continue;
          seen.add(id);
          uniq.push(a);
        }
        const finalList = uniq;
        // sort by most recent date (schedule date or updatedAt)
        finalList.sort((a, b) => {
          const ak = `${a.scheduleId?.date || a.updatedAt || ""}`;
          const bk = `${b.scheduleId?.date || b.updatedAt || ""}`;
          return bk.localeCompare(ak);
        });
        setItems(finalList);
      } catch (e) {
        console.error(e);
        setError("Không tải được lịch sử lịch hẹn");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?._id]);

  /* -------- filters -------- */
  const filtered = useMemo(() => {
    const base =
      activeTab === "all"
        ? items
        : items.filter((it) => (it.status as StatusKey) === activeTab);
    const norm = (s: string) => s.toLowerCase();
    const inRange = (iso?: string) => {
      if (!iso) return true;
      const d = new Date(iso).toISOString().slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    };
    const today = new Date().toISOString().slice(0, 10);
    return base.filter((it) => {
      const hay = `${it.doctorId?.name || ""} ${it.symptoms || ""} ${
        it.note || ""
      }`;
      const okQ = q ? norm(hay).includes(norm(q)) : true;
      const dateKey = it.scheduleId?.date || it.updatedAt;
      // If appointment has a schedule date, only include today or future dates
      const scheduleDate = it.scheduleId?.date;
      const isNotPast = scheduleDate ? scheduleDate >= today : true;
      return okQ && inRange(dateKey) && isNotPast;
    });
  }, [items, activeTab, q, from, to]);

  const groups = useMemo(() => {
    const map: Record<string, AppointmentItem[]> = {};
    filtered.slice(0, limit).forEach((it) => {
      const key = (it.scheduleId?.date || it.updatedAt).slice(0, 10);
      (map[key] ||= []).push(it);
    });
    Object.values(map).forEach((list) =>
      list.sort((a, b) =>
        (a.scheduleId?.startTime ?? "").localeCompare(
          b.scheduleId?.startTime ?? ""
        )
      )
    );
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered, limit]);

  /* -------- export/print -------- */
  function exportCSV(rows: AppointmentItem[]) {
    const header = [
      "id",
      "status",
      "doctor",
      "specialty",
      "workplace",
      "date",
      "start",
      "end",
      "symptoms",
      "note",
    ];
    const body = rows.map((r) => [
      r._id,
      r.status,
      r.doctorId?.name || "",
      r.doctorId?.specialty || "",
      r.doctorId?.workplace || "",
      r.scheduleId?.date || "",
      r.scheduleId?.startTime || "",
      r.scheduleId?.endTime || "",
      (r.symptoms || "").replace(/\n|\r/g, " "),
      (r.note || "").replace(/\n|\r/g, " "),
    ]);
    const csv = [header, ...body]
      .map((arr) =>
        arr.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `appointments_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toDT(d: string, t = "00:00") {
    return `${d.replace(/-/g, "")}T${t.replace(":", "")}00`;
  }

  function downloadICS(appt: AppointmentItem) {
    const title = `Khám với ${appt.doctorId?.name || "Bác sĩ"}`;
    const date =
      appt.scheduleId?.date ||
      new Date(appt.updatedAt).toISOString().slice(0, 10);
    const dtStart = toDT(date, appt.scheduleId?.startTime || "08:00");
    const dtEnd = toDT(date, appt.scheduleId?.endTime || "09:00");
    const description = [parseService(appt.note), appt.symptoms, appt.note]
      .filter(Boolean)
      .join(" \n");
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MediCare//Appointments//VN
BEGIN:VEVENT
UID:${appt._id}@medicare
DTSTAMP:${toDT(new Date().toISOString().slice(0, 10), "00:00")}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${title}
DESCRIPTION:${description}
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `appointment_${appt._id}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function printList() {
    const node = printRef.current;
    if (!node) return window.print();
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8" />
<title>Lịch hẹn</title>
<style>
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:24px}
h2{margin:0 0 12px}
.card{border:1px solid #e5e7eb;border-radius:12px;padding:12px;margin-bottom:8px}
.muted{color:#6b7280;font-size:12px}
</style></head><body>`);
    w.document.write(`<h2>Danh sách lịch hẹn (${filtered.length})</h2>`);
    w.document.write(node.innerHTML);
    w.document.write("</body></html>");
    w.document.close();
    w.focus();
    w.print();
    w.close();
  }

  const handleSendMessage = async (message: string, appointmentId: string) => {
    try {
      if (!detail) return;
      await sendMessage({
        appointmentId,
        doctorId: detail.doctorId?._id || "",
        patientId: user?._id || "",
        senderRole: "patient",
        content: message,
      });
      alert("Tin nhắn đã gửi");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gửi tin nhắn thất bại");
    }
  };

  /* ================== UI ================== */
  return (
    <div className="min-h-[70vh] bg-slate-50">
      {/* Header brand gradient (giữ tông của hệ thống) */}
      <div className="bg-gradient-to-r from-blue-500 to-teal-400 text-white">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Lịch sử & tình trạng lịch hẹn
          </h1>
          <p className="text-white/90">
            Lịch sử đặt lịch khám với bác sĩ của bạn
          </p>
        </div>
      </div>

      {/* Toolbar dính trên (glass) */}
      {/* === Toolbar gọn gàng === */}
      <div className="sticky top-0 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4">
          <div className="py-3 flex flex-col gap-3">
            {/* Row 1: Tabs (cuộn ngang, ẩn scrollbar) */}
            <div
              className="flex items-center gap-2 overflow-x-auto -mx-1 px-1
                   [scrollbar-width:none] [-ms-overflow-style:none]
                   [&::-webkit-scrollbar]:hidden"
              aria-label="Bộ lọc trạng thái"
            >
              {(
                [
                  "all",
                  "booked",
                  "doctor_approved",
                  "pending_payment",
                  "payment_overdue",
                  "paid",
                  "confirmed",
                  "in_consult",
                  "prescription_issued",
                  "completed",
                  "payment_failed",
                  "cancelled",
                ] as TabKey[]
              ).map((t) => {
                const isActive = activeTab === t;
                const label =
                  t === "all" ? "Tất cả" : STATUS_META[t as StatusKey].label;
                return (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={[
                      "h-9 whitespace-nowrap rounded-full px-3 text-sm transition",
                      "ring-1 ring-slate-200",
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-teal-400 text-white ring-teal-600 shadow-sm"
                        : "bg-white text-slate-700 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Row 2: Tìm kiếm + khoảng ngày + Export */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              {/* Search */}
              <div className="sm:col-span-5 relative">
                <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm bác sĩ / ghi chú…"
                  aria-label="Tìm kiếm"
                  className="h-10 w-full rounded-lg bg-white pl-9 pr-3 ring-1 ring-slate-200
                       focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
              </div>

              {/* Date range (gộp trong một group) */}
              <div className="sm:col-span-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 items-center rounded-lg bg-white ring-1 ring-slate-200">
                    <label
                      className="px-2 text-sm text-slate-500"
                      htmlFor="from"
                    >
                      Từ
                    </label>
                    <input
                      id="from"
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      className="h-10 border-0 bg-transparent px-2 text-sm focus:outline-none focus:ring-0"
                    />
                    <div className="h-6 w-px bg-slate-200" />
                    <label className="px-2 text-sm text-slate-500" htmlFor="to">
                      đến
                    </label>
                    <input
                      id="to"
                      type="date"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className="h-10 border-0 bg-transparent px-2 text-sm focus:outline-none focus:ring-0"
                    />
                  </div>
                  {(from || to) && (
                    <button
                      onClick={() => {
                        setFrom("");
                        setTo("");
                      }}
                      className="h-10 rounded-lg bg-white px-3 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>

              {/* Export */}
              <div className="sm:col-span-2 flex items-center justify-start sm:justify-end gap-2">
                <button
                  onClick={() => exportCSV(filtered)}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-3 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                  aria-label="Xuất CSV"
                >
                  <FaFileCsv /> CSV
                </button>
                <button
                  onClick={printList}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-3 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                  aria-label="In hoặc lưu PDF"
                >
                  <FaPrint /> In / PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-slate-200/60 animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            {error}
          </div>
        )}

        {!loading && !error && groups.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            Chưa có lịch hẹn phù hợp bộ lọc.
          </div>
        )}

        {!loading && !error && groups.length > 0 && (
          <div className="space-y-10 print:space-y-4" ref={printRef}>
            {groups.map(([day, list]) => (
              <section key={day}>
                {/* sticky date chip */}
                <div className="sticky top-[64px] -ml-1 mb-3 w-max rounded-full bg-white/80 px-3 py-1 text-sm font-medium text-slate-700 ring-1 ring-slate-200 backdrop-blur">
                  {formatDate(day)}{" "}
                  <span className="text-xs text-slate-400">
                    • {list.length} lịch hẹn
                  </span>
                </div>

                <ol className="relative ml-3 border-l-2 border-slate-200">
                  {list.map((it) => {
                    const key =
                      (it.status as StatusKey) in STATUS_META
                        ? (it.status as StatusKey)
                        : "booked";
                    const meta = STATUS_META[key];
                    const service = parseService(it.note);

                    return (
                      <li key={it._id} className="mb-6 ml-4 print:mb-3">
                        {/* mốc thời gian */}
                        <span
                          className={`absolute -left-[9px] mt-1 h-4 w-4 rounded-full ${meta.dot}`}
                        />

                        {/* card nhẹ, có vạch màu trạng thái ở cạnh trái */}
                        <div
                          className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm hover:shadow transition"
                          style={{ borderLeft: `4px solid ${meta.colorHex}` }}
                        >
                          <div className="p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* bác sĩ */}
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                                  {initials(it.doctorId?.name)}
                                </div>
                                <div>
                                  <div className="font-medium text-slate-900">
                                    {it.doctorId?.name || "Bác sĩ"}
                                  </div>
                                  <div className="text-xs text-slate-600">
                                    {[
                                      it.doctorId?.specialty,
                                      it.doctorId?.workplace,
                                    ]
                                      .filter(Boolean)
                                      .join(" • ")}
                                  </div>
                                </div>
                              </div>

                              {/* trạng thái */}
                              <span
                                className={`ml-auto rounded-full px-2 py-1 text-xs font-medium ${meta.badge}`}
                              >
                                {meta.label}
                              </span>

                              {/* mode */}
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ring-1 ${
                                  it.mode === "online"
                                    ? "bg-teal-50 text-teal-700 ring-teal-200"
                                    : "bg-slate-50 text-slate-700 ring-slate-200"
                                }`}
                              >
                                {it.mode === "online"
                                  ? "Trực tuyến"
                                  : "Tại cơ sở"}
                              </span>
                            </div>

                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2 text-slate-700">
                                <FaCalendarAlt className="text-slate-400" />
                                {formatDate(
                                  it.scheduleId?.date || it.updatedAt
                                )}
                              </div>
                              {it.scheduleId?.startTime &&
                                it.scheduleId?.endTime && (
                                  <div className="flex items-center gap-2 text-slate-700">
                                    <FaClock className="text-slate-400" />
                                    {formatRange(
                                      it.scheduleId.startTime,
                                      it.scheduleId.endTime
                                    )}
                                  </div>
                                )}
                              {service && (
                                <div className="sm:col-span-2 flex items-center gap-2 text-slate-700">
                                  <FaTag className="text-slate-400" /> {service}
                                </div>
                              )}
                            </div>

                            {it.symptoms && (
                              <div className="mt-2 text-sm text-slate-700">
                                <span className="font-medium">
                                  Triệu chứng:{" "}
                                </span>
                                {it.symptoms}
                              </div>
                            )}
                            {it.note && (
                              <div className="mt-1 text-xs text-slate-500 line-clamp-2">
                                {it.note}
                              </div>
                            )}

                            {/* Show proposed new schedule when doctor proposed a reschedule */}
                            {it.status === "doctor_reschedule" &&
                              it.newScheduleId &&
                              (() => {
                                const ns =
                                  typeof it.newScheduleId === "string"
                                    ? null
                                    : it.newScheduleId;
                                return (
                                  <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-sm text-amber-700">
                                    <div className="font-medium">
                                      Bác sĩ đề xuất lịch mới
                                    </div>
                                    <div>
                                      {ns?.date ||
                                        (typeof it.newScheduleId === "string"
                                          ? it.newScheduleId
                                          : "—")}
                                      {ns
                                        ? ` • ${ns.startTime || ""} - ${
                                            ns.endTime || ""
                                          }`
                                        : ""}
                                    </div>
                                  </div>
                                );
                              })()}

                            {/* actions */}
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                              <button
                                onClick={() => setDetail(it)}
                                className="rounded-md bg-white px-2 py-1 ring-1 ring-slate-200 hover:bg-slate-50"
                              >
                                Chi tiết
                              </button>

                              {(it.status === "pending_payment" ||
                                it.status === "await_payment") && (
                                <a
                                  href={`/payments/${it._id}`}
                                  className="rounded-md bg-teal-600 px-2 py-1 text-white hover:bg-teal-700"
                                >
                                  Thanh toán
                                </a>
                              )}

                              <button
                                onClick={() => downloadICS(it)}
                                className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 ring-1 ring-slate-200 hover:bg-slate-50"
                              >
                                <FaCalendarPlus /> Thêm vào lịch
                              </button>

                              <button
                                onClick={() => {
                                  try {
                                    navigator.share?.({
                                      title: "Lịch khám",
                                      text: `${formatDate(
                                        it.scheduleId?.date
                                      )} ${formatRange(
                                        it.scheduleId?.startTime,
                                        it.scheduleId?.endTime
                                      )} - ${it.doctorId?.name}`,
                                    });
                                  } catch (e) {
                                    console.error("Share failed", e);
                                  }
                                }}
                                className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 ring-1 ring-slate-200 hover:bg-slate-50"
                              >
                                <FaShareAlt /> Chia sẻ
                              </button>

                              <a
                                href={`/appointment?doctorId=${
                                  it.doctorId?._id || ""
                                }`}
                                className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 ring-1 ring-slate-200 hover:bg-slate-50"
                              >
                                Đặt lại
                              </a>

                              {/* Patient quick reschedule request for confirmed but not started appointments */}
                              {it.status === "confirmed" && (
                                <button
                                  onClick={async () => {
                                    try {
                                      // fetch doctor's schedules (their working shifts)
                                      const doctorId = it.doctorId?._id;
                                      if (!doctorId) {
                                        alert("Không xác định được bác sĩ");
                                        return;
                                      }
                                      const schedules =
                                        await getDoctorSchedules(doctorId);
                                      const free = Array.isArray(schedules)
                                        ? schedules.filter((s) => !s.isBooked)
                                        : [];
                                      const slots = free.map(
                                        (s) =>
                                          `${s.date} ${s.startTime} - ${s.endTime}`
                                      );
                                      if (slots.length === 0) {
                                        alert(
                                          "Hiện bác sĩ không có khung giờ rảnh trong ca làm phù hợp. Bạn có thể gửi tin nhắn yêu cầu bác sĩ đề xuất khung khác."
                                        );
                                        // open chat so patient can message the doctor
                                        setChatAppointment(it);
                                        setChatOpen(true);
                                        return;
                                      }

                                      // Show available slots and ask user to confirm sending them as a proposal
                                      const confirmMsg =
                                        "Các khung giờ rảnh của bác sĩ:\n" +
                                        slots
                                          .map((s, i) => `${i + 1}. ${s}`)
                                          .join("\n") +
                                        "\n\nGửi toàn bộ danh sách này tới bác sĩ để yêu cầu đổi lịch?";
                                      if (!confirm(confirmMsg)) return;

                                      // Send REST proposal to server (server will notify the doctor)
                                      const resp = await fetch(
                                        `https://server-medicare.onrender.com/api/patient/appointments/${it._id}/reschedule-propose`,
                                        {
                                          method: "POST",
                                          headers: {
                                            "Content-Type": "application/json",
                                            Authorization: `Bearer ${localStorage.getItem(
                                              "token"
                                            )}`,
                                          },
                                          body: JSON.stringify({
                                            patientId: user?._id,
                                            proposedSlots: slots,
                                            message:
                                              "Bệnh nhân yêu cầu đổi lịch. Vui lòng xem các khung rảnh của bác sĩ.",
                                          }),
                                        }
                                      );
                                      if (!resp.ok)
                                        throw new Error("Gửi đề xuất thất bại");
                                      alert(
                                        "Đã gửi yêu cầu đổi lịch tới bác sĩ. Bác sĩ sẽ trả lời bằng tin nhắn hoặc đề xuất khung mới."
                                      );
                                      // open chat so patient can follow up
                                      setChatAppointment(it);
                                      setChatOpen(true);
                                    } catch (e) {
                                      console.error(e);
                                      alert(
                                        e instanceof Error ? e.message : "Lỗi"
                                      );
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 ring-1 ring-slate-200 hover:bg-slate-50"
                                >
                                  Đổi lịch
                                </button>
                              )}

                              {/* Inline accept button when doctor proposed a new schedule */}
                              {it.status === "doctor_reschedule" && (
                                <button
                                  onClick={async () => {
                                    try {
                                      if (!user?._id) {
                                        alert("Vui lòng đăng nhập");
                                        return;
                                      }
                                      if (
                                        !confirm(
                                          "Bạn chắc chắn muốn chấp nhận lịch mới do bác sĩ đề xuất?"
                                        )
                                      )
                                        return;
                                      const resp = await fetch(
                                        `https://server-medicare.onrender.com/api/doctor/appointments/${it._id}/accept-reschedule`,
                                        {
                                          method: "POST",
                                          headers: {
                                            "Content-Type": "application/json",
                                            Authorization: `Bearer ${localStorage.getItem(
                                              "token"
                                            )}`,
                                          },
                                          body: JSON.stringify({
                                            patientId: user._id,
                                          }),
                                        }
                                      );
                                      if (!resp.ok) {
                                        let msg =
                                          "Không thể chấp nhận lịch mới";
                                        try {
                                          const j = await resp.json();
                                          msg =
                                            j?.message ||
                                            JSON.stringify(j) ||
                                            msg;
                                        } catch {
                                          try {
                                            msg = await resp.text();
                                          } catch {
                                            /* ignore */
                                          }
                                        }
                                        throw new Error(msg);
                                      }
                                      alert(
                                        "Đã chấp nhận lịch mới. Danh sách sẽ được cập nhật."
                                      );
                                      window.location.reload();
                                    } catch (e) {
                                      console.error(e);
                                      alert(
                                        e instanceof Error ? e.message : "Lỗi"
                                      );
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 rounded-md bg-teal-600 px-2 py-1 text-white hover:bg-teal-700"
                                >
                                  Đồng ý lịch mới
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}

            {limit < filtered.length && (
              <div className="flex justify-center">
                <button
                  onClick={() => setLimit((l) => l + PAGE)}
                  className="rounded-lg bg-white px-4 py-2 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  Tải thêm
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============ Modal chi tiết ============ */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Chi tiết lịch hẹn"
      >
        {detail && (
          <div className="space-y-5 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-base font-semibold text-slate-700">
                  {initials(detail.doctorId?.name)}
                </div>
                <div>
                  <div className="text-base font-semibold text-slate-900">
                    {detail.doctorId?.name || "Bác sĩ"}
                  </div>
                  <div className="text-xs text-slate-600">
                    {[detail.doctorId?.specialty, detail.doctorId?.workplace]
                      .filter(Boolean)
                      .join(" • ")}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-500">Trạng thái</div>
                <div
                  className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                    STATUS_META[
                      (detail.status as StatusKey) in STATUS_META
                        ? (detail.status as StatusKey)
                        : "booked"
                    ].badge
                  }`}
                >
                  {
                    STATUS_META[
                      (detail.status as StatusKey) in STATUS_META
                        ? (detail.status as StatusKey)
                        : "booked"
                    ].label
                  }
                </div>
                <div className="mt-2">
                  <div className="text-xs text-slate-500">Hình thức</div>
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs ring-1 ${
                      detail.mode === "online"
                        ? "bg-teal-50 text-teal-700 ring-teal-200"
                        : "bg-slate-50 text-slate-700 ring-slate-200"
                    }`}
                  >
                    {detail.mode === "online" ? "Trực tuyến" : "Tại cơ sở"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl ring-1 ring-slate-200 p-3">
              <div className="mb-2 text-xs text-slate-500">Tiến trình</div>
              <Stepper
                current={
                  (detail.status as StatusKey) in STATUS_META
                    ? (detail.status as StatusKey)
                    : "booked"
                }
                cancelled={detail.status === "cancelled"}
              />
            </div>

            {/* If doctor proposed a new schedule, show it here */}
            {detail.status === "doctor_reschedule" &&
              detail.newScheduleId &&
              (() => {
                const ns =
                  typeof detail.newScheduleId === "string"
                    ? null
                    : detail.newScheduleId;
                return (
                  <div className="rounded-xl ring-1 ring-amber-200 bg-amber-50 p-3">
                    <div className="mb-2 text-xs text-amber-700">
                      Lịch đề xuất
                    </div>
                    <div className="text-amber-800">
                      {ns?.date ||
                        (typeof detail.newScheduleId === "string"
                          ? detail.newScheduleId
                          : "—")}{" "}
                      {ns
                        ? `• ${ns.startTime || ""} - ${ns.endTime || ""}`
                        : ""}
                    </div>
                  </div>
                );
              })()}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl ring-1 ring-slate-200 p-3">
                <div className="mb-2 text-xs text-slate-500">Lịch khám</div>
                <div className="flex items-center gap-2 text-slate-800">
                  <FaCalendarAlt className="text-slate-400" />
                  {formatDate(detail.scheduleId?.date || detail.updatedAt)}
                </div>
                <div className="mt-1 flex items-center gap-2 text-slate-800">
                  <FaClock className="text-slate-400" />
                  {formatRange(
                    detail.scheduleId?.startTime,
                    detail.scheduleId?.endTime
                  )}
                </div>
              </div>

              <div className="rounded-xl ring-1 ring-slate-200 p-3">
                <div className="mb-2 text-xs text-slate-500">Dịch vụ</div>
                <div className="text-slate-800">
                  {parseService(detail.note) || "—"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl ring-1 ring-slate-200 p-3">
                <div className="mb-2 text-xs text-slate-500">Triệu chứng</div>
                <div className="whitespace-pre-wrap text-slate-800">
                  {detail.symptoms || "—"}
                </div>
              </div>
              <div className="rounded-xl ring-1 ring-slate-200 p-3">
                <div className="mb-2 text-xs text-slate-500">Ghi chú</div>
                <div className="whitespace-pre-wrap text-slate-800">
                  {detail.note || "—"}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {/* View Appointment Slip button */}
              <a
                href={`/appointments/${detail._id}/slip`}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm text-white hover:bg-teal-700"
              >
                <FaFilePdf /> Xem giấy khám bệnh
              </a>

              {(detail.status === "paid" || detail.status === "confirmed") && (
                <button
                  onClick={async () => {
                    // Open chat modal prefilled
                    setChatAppointment(detail);
                    setChatOpen(true);

                    // Offer quick REST-based reschedule proposal as well
                    try {
                      const raw = window.prompt(
                        "Nhập các khung giờ đề xuất (tách bằng dấu phẩy) hoặc để trống để chỉ gửi tin nhắn:",
                        ""
                      );
                      if (raw === null) return; // cancelled
                      const slots = raw
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);
                      if (slots.length === 0) return; // user chose to only chat

                      // send REST proposal
                      const resp = await fetch(
                        `https://server-medicare.onrender.com/api/patient/appointments/${detail._id}/reschedule-propose`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localStorage.getItem(
                              "token"
                            )}`,
                          },
                          body: JSON.stringify({
                            patientId: user?._id,
                            proposedSlots: slots,
                            message: "Bệnh nhân đề nghị đổi lịch",
                          }),
                        }
                      );
                      if (!resp.ok) throw new Error("Gửi đề xuất thất bại");
                      alert("Đề xuất đổi lịch đã gửi tới bác sĩ");
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  Tôi muốn đổi lịch
                </button>
              )}

              {/* Patient accepts a doctor's reschedule proposal */}
              {detail.status === "doctor_reschedule" && (
                <button
                  onClick={async () => {
                    try {
                      if (!user?._id)
                        throw new Error("Người dùng chưa đăng nhập");
                      const resp = await fetch(
                        `https://server-medicare.onrender.com/api/doctor/appointments/${detail._id}/accept-reschedule`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localStorage.getItem(
                              "token"
                            )}`,
                          },
                          body: JSON.stringify({ patientId: user._id }),
                        }
                      );
                      if (!resp.ok) {
                        const text = await resp.text().catch(() => "");
                        throw new Error(text || "Không thể chấp nhận lịch mới");
                      }
                      alert(
                        "Bạn đã chấp nhận lịch mới. Hệ thống sẽ cập nhật lịch hẹn."
                      );
                      window.location.reload();
                    } catch (e) {
                      console.error(e);
                      alert(e instanceof Error ? e.message : "Lỗi");
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm text-white hover:bg-teal-700"
                >
                  Đồng ý lịch mới
                </button>
              )}

              {(detail.status === "pending_payment" ||
                detail.status === "await_payment") && (
                <a
                  href={`/payments/${detail._id}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm text-white hover:bg-teal-700"
                >
                  Thanh toán ngay
                </a>
              )}

              {/* Patient check-in button */}
              {detail.status !== "cancelled" && (
                <button
                  onClick={async () => {
                    try {
                      const resp = await fetch(
                        `https://server-medicare.onrender.com/api/patient/appointments/${detail._id}/checkin`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localStorage.getItem(
                              "token"
                            )}`,
                          },
                          body: JSON.stringify({ by: "patient" }),
                        }
                      );
                      if (!resp.ok) throw new Error("Check-in failed");
                      alert("Đã ghi nhận: Bạn đã đến");
                      window.location.reload();
                    } catch (e) {
                      alert(e instanceof Error ? e.message : "Lỗi check-in");
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  Tôi đã đến
                </button>
              )}
              <button
                onClick={() => downloadICS(detail)}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 hover:bg-slate-50"
              >
                <FaCalendarPlus /> Thêm vào lịch
              </button>
              <button
                onClick={() => {
                  try {
                    navigator.share?.({
                      title: "Lịch khám",
                      text: `${formatDate(
                        detail.scheduleId?.date
                      )} ${formatRange(
                        detail.scheduleId?.startTime,
                        detail.scheduleId?.endTime
                      )} - ${detail.doctorId?.name}`,
                    });
                  } catch (e) {
                    console.error("Share failed", e);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 hover:bg-slate-50"
              >
                <FaShareAlt /> Chia sẻ
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 hover:bg-slate-50"
              >
                <FaFilePdf /> In / Lưu PDF
              </button>
            </div>

            <div className="text-xs text-slate-500">
              Tạo lúc {formatDate(detail.createdAt)} • Cập nhật{" "}
              {formatDate(detail.updatedAt)} • Mã: {detail._id}
            </div>
          </div>
        )}
      </Modal>

      <ChatModal
        isOpen={chatOpen}
        onClose={() => {
          setChatOpen(false);
          setChatAppointment(null);
        }}
        appointment={chatModalPayload}
        doctorName={chatAppointment?.doctorId?.name || "Bác sĩ"}
        onSendMessage={handleSendMessage}
        initialTemplate={"reschedule_proposal"}
      />
    </div>
  );
}
