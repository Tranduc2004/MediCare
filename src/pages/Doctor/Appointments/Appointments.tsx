import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Stethoscope,
  Pill,
  FileText,
  Filter,
  Search,
  RefreshCw,
  Phone,
  Mail,
  Info,
  Send,
  Plus,
} from "lucide-react";
import ChatModal from "../../../components/Doctor/Chat/ChatModal";
import MedicalRecordForm from "../../../components/Doctor/MedicalRecord/MedicalRecordForm";
import { sendMessage } from "../../../api/chatApi";
import { getDoctorSchedules } from "../../../api/appointmentApi";
import { getMedicalRecordByAppointment } from "../../../api/medicalRecordApi";
import { Schedule } from "../../../types/api";

/** =========================
 *  Types & Status helpers
 *  ========================= */
export type StatusKey =
  | "booked"
  | "doctor_approved"
  | "doctor_reschedule"
  | "doctor_rejected"
  | "await_payment"
  | "paid"
  | "payment_overdue"
  | "confirmed"
  | "in_consult"
  | "prescription_issued"
  | "ready_to_discharge"
  | "completed"
  | "cancelled"
  | "closed";

type Appointment = {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  patientInfo?: {
    name: string;
    phone: string;
    email: string;
  };
  scheduleId: {
    _id: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string; // HH:mm
  };
  mode?: "online" | "offline" | string;
  status: StatusKey | string; // server có thể trả về enum cũ
  symptoms?: string;
  note?: string; // có thể chứa [Dịch vụ] ...
  createdAt: string;
};

const STATUS_META: Record<
  StatusKey,
  { label: string; chip: string; dot: string }
> = {
  booked: {
    label: "Chờ xác nhận",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  doctor_approved: {
    label: "Bác sĩ đã duyệt",
    chip: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  doctor_reschedule: {
    label: "Cần đổi lịch",
    chip: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
  doctor_rejected: {
    label: "Bác sĩ từ chối",
    chip: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  await_payment: {
    label: "Chờ thanh toán",
    chip: "bg-yellow-50 text-yellow-700 border-yellow-200",
    dot: "bg-yellow-500",
  },
  paid: {
    label: "Đã thanh toán",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  payment_overdue: {
    label: "Quá hạn thanh toán",
    chip: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  confirmed: {
    label: "Đã xác nhận",
    chip: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  in_consult: {
    label: "Đang khám",
    chip: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
  prescription_issued: {
    label: "Đã kê đơn",
    chip: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
  },
  ready_to_discharge: {
    label: "Sẵn sàng kết thúc",
    chip: "bg-teal-50 text-teal-700 border-teal-200",
    dot: "bg-teal-500",
  },
  completed: {
    label: "Hoàn thành",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Đã hủy",
    chip: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
  closed: {
    label: "Đã đóng",
    chip: "bg-slate-50 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
  },
};

const isValidStatus = (status: string): status is StatusKey =>
  status in STATUS_META;
const getSafeStatus = (status: string): StatusKey => {
  if (isValidStatus(status)) return status;
  switch (status) {
    case "pending":
      return "booked";
    case "examining":
      return "in_consult";
    case "prescribing":
      return "prescription_issued";
    case "done":
      return "completed";
    default:
      return "booked";
  }
};

function getStatusIcon(status: StatusKey) {
  switch (status) {
    case "booked":
    case "await_payment":
    case "doctor_reschedule":
      return <Clock className="h-4 w-4" />;
    case "doctor_approved":
    case "paid":
    case "confirmed":
    case "ready_to_discharge":
    case "completed":
      return <CheckCircle className="h-4 w-4" />;
    case "in_consult":
      return <Stethoscope className="h-4 w-4" />;
    case "prescription_issued":
      return <Pill className="h-4 w-4" />;
    case "doctor_rejected":
    case "payment_overdue":
    case "cancelled":
    case "closed":
      return <XCircle className="h-4 w-4" />;
  }
}

function getNextStatusOptions(current: StatusKey) {
  switch (current) {
    case "booked":
      return [
        {
          value: "doctor_approved",
          label: "Xác nhận",
          color: "bg-slate-900 hover:bg-black text-white",
        },
        {
          value: "doctor_reschedule",
          label: "Đổi lịch",
          color: "bg-orange-600 hover:bg-orange-700 text-white",
        },
        {
          value: "doctor_rejected",
          label: "Từ chối",
          color: "bg-rose-600 hover:bg-rose-700 text-white",
        },
      ] as const;
    case "doctor_approved":
      return [
        {
          value: "await_payment",
          label: "Yêu cầu thanh toán",
          color: "bg-amber-600 hover:bg-amber-700 text-white",
        },
        {
          value: "cancelled",
          label: "Hủy",
          color: "bg-rose-600 hover:bg-rose-700 text-white",
        },
      ] as const;
    case "paid":
      return [
        {
          value: "confirmed",
          label: "Xác nhận",
          color: "bg-slate-900 hover:bg-black text-white",
        },
        {
          value: "cancelled",
          label: "Hủy",
          color: "bg-rose-600 hover:bg-rose-700 text-white",
        },
      ] as const;
    case "confirmed":
      return [
        {
          value: "in_consult",
          label: "Bắt đầu khám",
          color: "bg-teal-600 hover:bg-teal-700 text-white",
        },
        {
          value: "cancelled",
          label: "Hủy",
          color: "bg-rose-600 hover:bg-rose-700 text-white",
        },
      ] as const;
    case "in_consult":
      return [
        {
          value: "prescription_issued",
          label: "Kê đơn",
          color: "bg-indigo-600 hover:bg-indigo-700 text-white",
        },
      ] as const;
    case "prescription_issued":
      return [
        {
          value: "ready_to_discharge",
          label: "Sẵn sàng kết thúc",
          color: "bg-teal-600 hover:bg-teal-700 text-white",
        },
      ] as const;
    case "ready_to_discharge":
      return [
        {
          value: "completed",
          label: "Hoàn thành",
          color: "bg-emerald-600 hover:bg-emerald-700 text-white",
        },
      ] as const;
    default:
      return [] as const;
  }
}

function parseService(note?: string) {
  if (!note) return "";
  const m = note.match(/\[Dịch vụ\]\s*([^|]+)/);
  return m?.[1]?.trim() || "";
}

/** =========================
 *  Main component
 *  ========================= */
const DoctorAppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"" | StatusKey>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Detail
  const [selected, setSelected] = useState<Appointment | null>(null);

  // Chat
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatAppointment, setChatAppointment] = useState<Appointment | null>(
    null
  );

  // Medical Record
  const [medicalRecordModalOpen, setMedicalRecordModalOpen] = useState(false);
  const [medicalRecordAppointment, setMedicalRecordAppointment] =
    useState<Appointment | null>(null);
  const [appointmentsWithMedicalRecord, setAppointmentsWithMedicalRecord] =
    useState<Set<string>>(new Set());

  // Reschedule
  const [reschedModalOpen, setReschedModalOpen] = useState(false);
  const [reschedAppointment, setReschedAppointment] =
    useState<Appointment | null>(null);
  const [availableSchedules, setAvailableSchedules] = useState<Schedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null
  );
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  /** Load data */
  const loadAppointments = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://server-medicare.onrender.com/api/doctor/appointments?doctorId=${user._id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.ok) {
        const data = (await response.json()) as Appointment[];
        setAppointments(data);
        setError("");
      } else {
        setError("Không tải được lịch hẹn");
      }
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    loadAppointments();
  }, [user?._id, loadAppointments]);

  /** Update status with guard */
  const updateAppointmentStatus = async (
    appointmentId: string,
    newStatus: StatusKey
  ) => {
    try {
      const appointment = appointments.find((a) => a._id === appointmentId);
      if (!appointment) return setError("Không tìm thấy lịch hẹn");

      const currentStatus = getSafeStatus(appointment.status as string);
      const safeNewStatus = getSafeStatus(newStatus);

      if (currentStatus === safeNewStatus) {
        setError(
          `Lịch hẹn đã ở trạng thái ${STATUS_META[currentStatus].label}`
        );
        return;
      }

      const allowedTransitions = getNextStatusOptions(currentStatus).map(
        (opt) => opt.value as string
      );
      if (!allowedTransitions.includes(safeNewStatus as string)) {
        setError(
          `Không thể chuyển từ ${STATUS_META[currentStatus].label} sang ${STATUS_META[safeNewStatus].label}`
        );
        return;
      }

      const response = await fetch(
        `https://server-medicare.onrender.com/api/doctor/appointments/${appointmentId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            id: appointmentId,
            status: safeNewStatus,
            doctorId: user?._id,
          }),
        }
      );

      if (response.ok) {
        await loadAppointments();
        setError("");
      } else {
        const errorData = await response.json();
        if (errorData?.error?.includes("Invoice validation failed")) {
          setError(
            "Cần tạo hóa đơn trước khi chuyển trạng thái này. Vui lòng kiểm tra phần thanh toán."
          );
        } else if (errorData?.message) {
          setError(errorData.message);
        } else {
          setError("Không thể cập nhật trạng thái");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi kết nối");
    }
  };

  /** Chat */
  const handleOpenChat = (appointment: Appointment) => {
    setChatAppointment(appointment);
    setChatModalOpen(true);
  };
  const handleSendMessage = async (message: string, appointmentId: string) => {
    try {
      const appointment = appointments.find((a) => a._id === appointmentId);
      if (!appointment || !user?._id) return;
      await sendMessage({
        appointmentId,
        doctorId: user._id,
        patientId: appointment.patientId._id,
        senderRole: "doctor",
        content: message,
      });
      alert("Gửi tin nhắn thành công");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gửi tin nhắn thất bại");
    }
  };

  /** Medical Record */
  const checkMedicalRecordExists = useCallback(
    async (appointmentId: string): Promise<boolean> => {
      try {
        const response = await getMedicalRecordByAppointment(appointmentId);
        // Kiểm tra xem response có record hay không
        return response && response._id ? true : false;
      } catch (error: unknown) {
        // Log các lỗi để debug
        console.error("Error checking medical record:", error);
        return false;
      }
    },
    []
  );

  const loadMedicalRecordStatus = useCallback(async () => {
    const recordSet = new Set<string>();
    for (const appointment of appointments) {
      const hasRecord = await checkMedicalRecordExists(appointment._id);
      if (hasRecord) {
        recordSet.add(appointment._id);
      }
    }
    setAppointmentsWithMedicalRecord(recordSet);
  }, [appointments, checkMedicalRecordExists]);

  const handleOpenMedicalRecord = (appointment: Appointment) => {
    setMedicalRecordAppointment(appointment);
    setMedicalRecordModalOpen(true);
  };

  // Helper function to determine which button to show
  const getMedicalRecordButtonType = (appointment: Appointment) => {
    const status = getSafeStatus(appointment.status as string);
    const hasRecord = appointmentsWithMedicalRecord.has(appointment._id);

    // Nếu đã có hồ sơ và đang khám trở lên -> hiển thị "Xem hồ sơ"
    if (
      hasRecord &&
      [
        "in_consult",
        "prescription_issued",
        "ready_to_discharge",
        "completed",
      ].includes(status)
    ) {
      return "view";
    }

    // Nếu chưa có hồ sơ và từ confirmed trở lên -> hiển thị "Tạo hồ sơ mới"
    if (
      !hasRecord &&
      [
        "confirmed",
        "paid",
        "doctor_approved",
        "in_consult",
        "prescription_issued",
        "ready_to_discharge",
        "completed",
      ].includes(status)
    ) {
      return "create";
    }

    return null;
  };

  // Load medical record status when appointments change
  useEffect(() => {
    if (appointments.length > 0) {
      loadMedicalRecordStatus();
    }
  }, [appointments, loadMedicalRecordStatus]);

  /** Derived data */
  const normalized = useMemo(
    () =>
      appointments.map((a) => ({
        ...a,
        status: getSafeStatus(a.status as string) as StatusKey,
      })),
    [appointments]
  );

  const filteredAppointments = useMemo(() => {
    const t = searchTerm.toLowerCase().trim();
    return normalized.filter((apt) => {
      const matchesDate =
        !selectedDate || apt.scheduleId?.date === selectedDate;
      const matchesStatus = !statusFilter || apt.status === statusFilter;
      const matchesSearch =
        !t ||
        apt.patientId.name.toLowerCase().includes(t) ||
        apt.patientId.phone.includes(t) ||
        (apt.patientId.email || "").toLowerCase().includes(t) ||
        (apt.symptoms || "").toLowerCase().includes(t) ||
        (apt.note || "").toLowerCase().includes(t);
      return matchesDate && matchesStatus && matchesSearch;
    });
  }, [normalized, selectedDate, statusFilter, searchTerm]);

  const groupedByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    filteredAppointments.forEach((apt) => {
      const d = apt.scheduleId?.date || "unknown";
      (map[d] ||= []).push(apt);
    });
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) =>
        (a.scheduleId?.startTime || "").localeCompare(
          b.scheduleId?.startTime || ""
        )
      )
    );
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredAppointments]);

  const availableDates = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return [...new Set(normalized.map((apt) => apt.scheduleId?.date))]
      .filter(Boolean)
      .filter((d) => (selectedDate ? true : (d as string) >= today))
      .sort() as string[];
  }, [normalized, selectedDate]);

  const availableStatuses = useMemo(
    () =>
      Array.from(new Set(normalized.map((apt) => apt.status))) as StatusKey[],
    [normalized]
  );

  /** UI */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-emerald-50">
      {/* Top bar */}
      <header className="border-b border-slate-200 bg-gradient-to-r from-blue-500 to-teal-400">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Quản lý lịch hẹn
            </h1>
            <p className="text-white/90">
              Xem theo ngày, thao tác nhanh theo ngữ cảnh
            </p>
          </div>
          <button
            onClick={loadAppointments}
            className="inline-flex items-center gap-2 rounded-lg border border-teal-300 bg-gradient-to-r from-teal-500 to-blue-500 px-4 py-2 text-sm font-medium text-white hover:from-teal-600 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <RefreshCw className="h-4 w-4" /> Tải lại
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-6">
        {/* Filters */}
        <section className="mb-6 rounded-xl border border-teal-200 bg-white p-5 shadow-lg backdrop-blur-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="relative">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                <Search className="mr-1 inline h-4 w-4 text-teal-500" />
                Tìm (tên/sđt/email/triệu chứng)
              </label>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="VD: Nguyễn A, 0909..., đau đầu"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-100 transition-all duration-200"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                <Calendar className="mr-1 inline h-4 w-4 text-teal-500" />
                Lọc theo ngày
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-100 transition-all duration-200"
              >
                <option value="">Tất cả ngày</option>
                {availableDates.map((d) => (
                  <option key={d} value={d}>
                    {new Date(d + "T00:00:00").toLocaleDateString("vi-VN")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusKey | "")
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-100 transition-all duration-200"
              >
                <option value="">Tất cả trạng thái</option>
                {availableStatuses.map((st) => (
                  <option key={st} value={st}>
                    {STATUS_META[st]?.label || st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(selectedDate || statusFilter || searchTerm) && (
            <div className="mt-4 flex items-center gap-2 border-t border-teal-200 pt-4">
              <Filter className="h-4 w-4 text-teal-600" />
              <span className="text-sm text-gray-600">Đang lọc:</span>
              {searchTerm && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 border border-gray-200">
                  "{searchTerm}"
                </span>
              )}
              {selectedDate && (
                <span className="rounded-full bg-teal-100 px-3 py-1 text-sm text-teal-700 border border-teal-200">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                    "vi-VN"
                  )}
                </span>
              )}
              {statusFilter && (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700 border border-blue-200">
                  {STATUS_META[statusFilter]?.label}
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedDate("");
                  setStatusFilter("");
                  setSearchTerm("");
                }}
                className="ml-auto rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 transition-colors duration-200 border border-gray-200"
              >
                Xóa lọc
              </button>
            </div>
          )}
        </section>

        {/* Summary */}
        {!loading && (
          <div className="mb-6 rounded-xl border border-teal-200 bg-gradient-to-r from-white to-teal-50 p-4 shadow-lg">
            <p className="text-gray-700">
              Hiển thị{" "}
              <span className="font-semibold text-teal-600">
                {filteredAppointments.length}
              </span>{" "}
              /{" "}
              <span className="font-semibold text-blue-600">
                {appointments.length}
              </span>{" "}
              lịch hẹn
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 p-4 shadow-lg">
            <div className="flex items-center gap-3 text-rose-700">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600"></div>
              <span className="font-medium text-gray-700">Đang tải...</span>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && groupedByDate.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Calendar className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">
              Không có lịch hẹn
            </h3>
            <p className="text-slate-600">
              {selectedDate || statusFilter || searchTerm
                ? "Không có lịch phù hợp bộ lọc hiện tại"
                : "Bạn chưa có lịch hẹn nào"}
            </p>
          </div>
        )}

        {/* List by date */}
        <div className="space-y-6">
          {groupedByDate.map(([date, list]) => (
            <section
              key={date}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              {/* Date header */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-slate-600" />
                  <h2 className="text-base font-semibold text-slate-900">
                    {new Date(date + "T00:00:00").toLocaleDateString("vi-VN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {list.length} lịch hẹn
                </span>
              </div>

              {/* Items */}
              <ul className="divide-y divide-slate-100">
                {list.map((appointment) => {
                  const safeStatus = getSafeStatus(
                    appointment.status as string
                  );
                  const meta = STATUS_META[safeStatus];
                  const service = parseService(appointment.note);

                  return (
                    <li
                      key={appointment._id}
                      className="px-6 py-5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        {/* Left cluster */}
                        <div className="flex flex-1 items-start gap-4">
                          {/* Time */}
                          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                            <Clock className="h-4 w-4 text-slate-600" />
                            <span className="font-mono text-sm text-slate-800">
                              {appointment.scheduleId?.startTime}–
                              {appointment.scheduleId?.endTime}
                            </span>
                          </div>

                          {/* Patient */}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => setSelected(appointment)}
                                className="group inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-left hover:bg-slate-100"
                                title="Xem chi tiết bệnh nhân"
                              >
                                <User className="h-4 w-4 text-slate-700" />
                                <span className="truncate font-semibold text-slate-900 group-hover:underline">
                                  {appointment.patientId.name}
                                </span>
                              </button>
                              <button
                                onClick={() => handleOpenChat(appointment)}
                                className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100"
                                title="Gửi tin nhắn"
                              >
                                <Send className="h-4 w-4" />
                                Chat
                              </button>
                              {/* Patient proposed reschedule quick peek */}
                              {(() => {
                                const res = (
                                  appointment as {
                                    meta?: {
                                      reschedule?: {
                                        proposedBy?: string;
                                        proposedSlots?: string[];
                                      };
                                    };
                                  }
                                )?.meta?.reschedule;
                                if (res?.proposedBy === "patient") {
                                  return (
                                    <button
                                      onClick={() => {
                                        const slots = res.proposedSlots || [];
                                        alert(
                                          `Bệnh nhân đề xuất khung:\n${
                                            (slots || []).join("\n") ||
                                            "Không có"
                                          }`
                                        );
                                        handleOpenChat(appointment);
                                      }}
                                      className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100"
                                    >
                                      Đề xuất đổi lịch
                                    </button>
                                  );
                                }
                                return null;
                              })()}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {/* Status chip */}
                              <span
                                className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs ${meta.chip}`}
                              >
                                {getStatusIcon(safeStatus)}
                                <span className="font-medium">
                                  {meta.label}
                                </span>
                              </span>

                              {/* Mode */}
                              <span
                                className={`px-2 py-1 text-[11px] rounded-full border ${
                                  appointment.mode === "online"
                                    ? "bg-teal-50 text-teal-700 border-teal-200"
                                    : "bg-gray-50 text-gray-700 border-gray-200"
                                }`}
                              >
                                {appointment.mode === "online"
                                  ? "Trực tuyến"
                                  : "Tại cơ sở"}
                              </span>

                              {/* Service */}
                              {service && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                                  <Info className="h-3.5 w-3.5" />
                                  {service}
                                </span>
                              )}
                            </div>

                            {/* Symptoms / notes */}
                            <div className="mt-3 grid gap-2">
                              {appointment.symptoms && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                  <span className="mr-1 font-semibold uppercase tracking-wide text-[11px]">
                                    Triệu chứng:
                                  </span>
                                  {appointment.symptoms}
                                </div>
                              )}
                              {appointment.note && (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                  <span className="mr-1 font-semibold uppercase tracking-wide text-[11px] text-slate-600">
                                    Ghi chú:
                                  </span>
                                  {appointment.note}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right actions */}
                        <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:items-end">
                          {/* Quick doctor check-in when confirmed */}
                          {safeStatus === "confirmed" && (
                            <button
                              onClick={async () => {
                                if (!confirm("Xác nhận: bạn đã sẵn sàng khám?"))
                                  return;
                                try {
                                  const r = await fetch(
                                    `https://server-medicare.onrender.com/api/patient/appointments/${appointment._id}/checkin`,
                                    {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${localStorage.getItem(
                                          "token"
                                        )}`,
                                      },
                                      body: JSON.stringify({ by: "doctor" }),
                                    }
                                  );
                                  if (!r.ok) throw new Error("Check-in failed");
                                  alert("Đã ghi nhận: Bạn đã sẵn sàng khám");
                                  await loadAppointments();
                                } catch (e) {
                                  alert(e instanceof Error ? e.message : "Lỗi");
                                }
                              }}
                              className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
                            >
                              Sẵn sàng khám
                            </button>
                          )}

                          {/* Status transitions */}
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {getNextStatusOptions(safeStatus).map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => {
                                  if (
                                    opt.value === "cancelled" &&
                                    !confirm("Bạn chắc muốn hủy lịch này?")
                                  )
                                    return;
                                  updateAppointmentStatus(
                                    appointment._id,
                                    opt.value
                                  );
                                }}
                                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition-colors ${opt.color}`}
                              >
                                {getStatusIcon(opt.value)}
                                {opt.label}
                              </button>
                            ))}

                            {/* Doctor-initiated reschedule for paid/confirmed */}
                            {(safeStatus === "paid" ||
                              safeStatus === "confirmed") && (
                              <button
                                onClick={async () => {
                                  setReschedAppointment(appointment);
                                  setReschedModalOpen(true);
                                  setLoadingSchedules(true);
                                  try {
                                    const doctorId = user?._id as string;
                                    const schedules = await getDoctorSchedules(
                                      doctorId
                                    );
                                    const today = new Date()
                                      .toISOString()
                                      .split("T")[0];
                                    const nowM = (() => {
                                      const d = new Date();
                                      return d.getHours() * 60 + d.getMinutes();
                                    })();

                                    const free = (
                                      Array.isArray(schedules) ? schedules : []
                                    )
                                      .filter((s) => {
                                        if (s.isBooked) return false;
                                        if (!s.date) return false;
                                        if (s.date < today) return false;
                                        if (s.date === today && s.startTime) {
                                          const [h, m] = s.startTime
                                            .split(":")
                                            .map(Number);
                                          if (h * 60 + m <= nowM) return false;
                                        }
                                        return true;
                                      })
                                      .sort((a, b) =>
                                        a.date !== b.date
                                          ? a.date.localeCompare(b.date)
                                          : (a.startTime || "").localeCompare(
                                              b.startTime || ""
                                            )
                                      );

                                    setAvailableSchedules(free as Schedule[]);
                                    setSelectedScheduleId(free[0]?._id || null);
                                  } catch (e) {
                                    console.error(e);
                                    setAvailableSchedules([]);
                                  } finally {
                                    setLoadingSchedules(false);
                                  }
                                }}
                                className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100"
                              >
                                Đổi lịch
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </main>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelected(null)}
          />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Chi tiết bệnh nhân
              </h3>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="mb-2 text-xs font-medium text-slate-500">
                  Thông tin
                </div>
                <div className="text-slate-900">
                  {selected.patientInfo?.name || selected.patientId.name}
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                  <Phone className="h-4 w-4" />
                  {selected.patientInfo?.phone ||
                    selected.patientId.phone ||
                    "—"}
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                  <Mail className="h-4 w-4" />
                  {selected.patientInfo?.email ||
                    selected.patientId.email ||
                    "—"}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="mb-2 text-xs font-medium text-slate-500">
                  Lịch khám
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-800">
                  <Calendar className="h-4 w-4" />
                  {new Date(
                    selected.scheduleId.date + "T00:00:00"
                  ).toLocaleDateString("vi-VN")}
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-800">
                  <Clock className="h-4 w-4" />
                  {selected.scheduleId.startTime} -{" "}
                  {selected.scheduleId.endTime}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Mã lịch: {selected._id}
                </div>
                <div className="mt-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full border ${
                      selected.mode === "online"
                        ? "bg-teal-50 text-teal-700 border-teal-200"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                    }`}
                  >
                    {selected.mode === "online" ? "Trực tuyến" : "Tại cơ sở"}
                  </span>
                </div>
              </div>
              {selected.symptoms && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 md:col-span-2">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                    Triệu chứng
                  </div>
                  <div className="whitespace-pre-wrap text-sm text-amber-800">
                    {selected.symptoms}
                  </div>
                </div>
              )}
              {selected.note && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Ghi chú
                  </div>
                  <div className="whitespace-pre-wrap text-sm text-slate-800">
                    {selected.note}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenChat(selected);
                    setSelected(null);
                  }}
                  className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-100"
                >
                  <Send className="h-4 w-4" />
                  Gửi tin nhắn
                </button>

                {/* Hiển thị nút medical record dựa trên trạng thái và sự tồn tại của hồ sơ */}
                {(() => {
                  const buttonType = getMedicalRecordButtonType(selected);
                  if (buttonType === "view") {
                    return (
                      <button
                        onClick={() => {
                          handleOpenMedicalRecord(selected);
                          setSelected(null);
                        }}
                        className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                      >
                        <FileText className="h-4 w-4" />
                        Xem hồ sơ
                      </button>
                    );
                  } else if (buttonType === "create") {
                    return (
                      <button
                        onClick={() => {
                          handleOpenMedicalRecord(selected);
                          setSelected(null);
                        }}
                        className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
                      >
                        <Plus className="h-4 w-4" />
                        Tạo hồ sơ mới
                      </button>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {getNextStatusOptions(
                  getSafeStatus(selected.status as string)
                ).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      if (
                        opt.value === "cancelled" &&
                        !confirm("Bạn chắc muốn hủy lịch này?")
                      )
                        return;
                      updateAppointmentStatus(selected._id, opt.value);
                      setSelected(null);
                    }}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors ${opt.color}`}
                  >
                    {getStatusIcon(opt.value)}
                    {opt.label}
                  </button>
                ))}
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      <ChatModal
        isOpen={chatModalOpen}
        onClose={() => {
          setChatModalOpen(false);
          setChatAppointment(null);
        }}
        appointment={chatAppointment}
        doctorName={user?.name || "Bác sĩ"}
        onSendMessage={handleSendMessage}
      />

      {/* Reschedule Modal */}
      {reschedModalOpen && reschedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setReschedModalOpen(false);
              setReschedAppointment(null);
            }}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-1 text-lg font-semibold">Đề xuất đổi lịch</h3>
            <p className="mb-4 text-sm text-slate-600">
              Chọn một khung rảnh trong ca làm của bạn để đề xuất cho bệnh nhân.
            </p>

            <div className="mb-4 max-h-60 overflow-auto rounded-lg border border-slate-200">
              {loadingSchedules && (
                <div className="p-4 text-sm text-slate-600">
                  Đang tải khung giờ trống…
                </div>
              )}
              {!loadingSchedules && availableSchedules.length === 0 && (
                <div className="p-4 text-sm text-slate-500">
                  Không có khung rảnh để đề xuất.
                </div>
              )}
              {!loadingSchedules &&
                availableSchedules.map((s) => (
                  <label
                    key={s._id}
                    className="flex cursor-pointer items-center gap-3 border-b border-slate-100 p-3 last:border-b-0 hover:bg-slate-50"
                  >
                    <input
                      type="radio"
                      name="resched"
                      checked={selectedScheduleId === s._id}
                      onChange={() => setSelectedScheduleId(s._id)}
                    />
                    <div className="text-sm">
                      <div className="font-medium text-slate-900">
                        {s.date} {s.startTime} - {s.endTime}
                      </div>
                      <div className="text-xs text-slate-500">
                        {s.isBooked ? "Đã đặt" : "Trống"}
                      </div>
                    </div>
                  </label>
                ))}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setReschedModalOpen(false);
                  setReschedAppointment(null);
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  if (!selectedScheduleId || !reschedAppointment)
                    return alert("Vui lòng chọn khung giờ");
                  try {
                    const r = await fetch(
                      `https://server-medicare.onrender.com/api/doctor/appointments/${reschedAppointment._id}/request-reschedule`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${localStorage.getItem(
                            "token"
                          )}`,
                        },
                        body: JSON.stringify({
                          doctorId: user?._id,
                          proposedScheduleId: selectedScheduleId,
                          message: "Bác sĩ đề xuất đổi lịch",
                        }),
                      }
                    );
                    if (!r.ok) throw new Error("Gửi đề xuất thất bại");
                    alert("Đề xuất đổi lịch đã gửi cho bệnh nhân");
                    setReschedModalOpen(false);
                    setReschedAppointment(null);
                    await loadAppointments();
                  } catch (e) {
                    alert(e instanceof Error ? e.message : String(e));
                  }
                }}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700"
              >
                Gửi đề xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Medical Record Modal */}
      {medicalRecordModalOpen && medicalRecordAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setMedicalRecordModalOpen(false);
              setMedicalRecordAppointment(null);
            }}
          />
          <div className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Hồ sơ bệnh án - {medicalRecordAppointment.patientId.name}
              </h3>
              <button
                onClick={() => {
                  setMedicalRecordModalOpen(false);
                  setMedicalRecordAppointment(null);
                }}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <MedicalRecordForm
                appointmentId={medicalRecordAppointment._id}
                isOpen={medicalRecordModalOpen}
                onClose={() => {
                  setMedicalRecordModalOpen(false);
                  setMedicalRecordAppointment(null);
                }}
                onSave={() => {
                  // Cập nhật lại danh sách appointments có medical record
                  setAppointmentsWithMedicalRecord(
                    (prev) => new Set([...prev, medicalRecordAppointment._id])
                  );
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointmentsPage;
