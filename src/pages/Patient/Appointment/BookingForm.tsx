import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../../contexts/AuthContext";
import { getDoctors } from "../../../api/doctorsApi";
import {
  getDoctorSchedules,
  createAppointment,
} from "../../../api/appointmentApi";
import { specialtyApi, ISpecialty } from "../../../api/specialtyApi";
import {
  FaHeartbeat,
  FaStethoscope,
  FaUserMd,
  FaNotesMedical,
  FaBrain,
  FaSearch,
} from "react-icons/fa";
import { driver, type Driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

/* =================== Types =================== */
type ServiceType =
  | "KHAM_TONG_QUAT"
  | "KHAM_CHUYEN_KHOA"
  | "GOI_DINH_KY"
  | "TU_VAN_DINH_DUONG"
  | "TU_VAN_TAM_LY";

type TimeFilter = "ALL" | "MORNING" | "AFTERNOON";

interface DoctorItem {
  _id: string;
  name: string;
  specialty?: string;
  workplace?: string;
  experience?: number;
}

interface ScheduleItem {
  _id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status?: string;
  isBooked?: boolean;
}

interface SuggestionItem {
  doctorId: string;
  doctorName: string;
  schedule: ScheduleItem;
}

/* =================== Small UI helpers =================== */
type CardProps = {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
  className?: string;
};
function Card({ title, children, right, id, className }: CardProps) {
  return (
    <div
      id={id}
      className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${
        className || ""
      }`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        )}
        {right}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const serviceMeta: Record<
  ServiceType,
  { label: string; desc: string; icon: React.ReactNode }
> = {
  KHAM_TONG_QUAT: {
    label: "Khám tổng quát (30’ – 200k)",
    desc: "BS đa khoa/nội tổng quát. Không cần chọn khoa.",
    icon: <FaStethoscope className="text-xl" />,
  },
  KHAM_CHUYEN_KHOA: {
    label: "Khám chuyên khoa (45’ – 300k)",
    desc: "Bắt buộc chọn chuyên khoa; có thể để hệ thống gợi ý bác sĩ.",
    icon: <FaUserMd className="text-xl" />,
  },
  GOI_DINH_KY: {
    label: "Khám sức khỏe định kỳ (gói) (60’ – 500k)",
    desc: "Nhiều bước: điều dưỡng, KTV, BS tổng quát kết luận.",
    icon: <FaHeartbeat className="text-xl" />,
  },
  TU_VAN_DINH_DUONG: {
    label: "Tư vấn dinh dưỡng (30’ – 150k)",
    desc: "Chuyên gia/bác sĩ dinh dưỡng. Không cần chọn khoa.",
    icon: <FaNotesMedical className="text-xl" />,
  },
  TU_VAN_TAM_LY: {
    label: "Tư vấn tâm lý (45’ – 250k)",
    desc: "Nhà tâm lý hoặc bác sĩ tâm thần. Không cần chọn khoa.",
    icon: <FaBrain className="text-xl" />,
  },
};

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return (
    (p[0]?.[0] || "").toUpperCase() + (p[p.length - 1]?.[0] || "").toUpperCase()
  );
}

/* =================== Driver helpers =================== */
declare global {
  interface Window {
    __bookingDriver?: Driver | null;
    __bookingTourRunning?: boolean;
  }
}

const hardCleanupDriverDom = () => {
  try {
    window.__bookingDriver?.destroy?.();
  } catch {}
  window.__bookingDriver = null;
  window.__bookingTourRunning = false;

  // Remove all driver DOM leftovers
  document
    .querySelectorAll(
      ".driver-overlay, .driver-popover, .driver-stage, .driver-stage-wrapper, .driver-backdrop, .driver-active-element, .driver-highlighted-element"
    )
    .forEach((el) => el.remove());

  document.documentElement.classList.remove("driver-active");
  document.body.classList.remove("driver-active");
  document.documentElement.style.removeProperty("pointer-events");
  document.body.style.removeProperty("pointer-events");
  document.documentElement.style.removeProperty("overflow");
  document.body.style.removeProperty("overflow");
};

/* =================== Component =================== */
export default function BookingFormRedesigned() {
  const { user, isAuthenticated } = useAuth();

  // Core form state
  const [serviceType, setServiceType] = useState<ServiceType>("KHAM_TONG_QUAT");
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [fullName, setFullName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [mode, setMode] = useState<"online" | "offline">("offline");

  // Specialty/Doctor
  const [specialties, setSpecialties] = useState<ISpecialty[]>([]);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>("");
  const [doctorFilter, setDoctorFilter] = useState<string>("");
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [doctorId, setDoctorId] = useState<string>("");
  const [autoAssign, setAutoAssign] = useState<boolean>(true);

  // Suggestions
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState<boolean>(false);
  const [selectedSuggestionKey, setSelectedSuggestionKey] =
    useState<string>("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("ALL");

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loadingDoctors, setLoadingDoctors] = useState<boolean>(false);
  const [hasSeenTour, setHasSeenTour] = useState<boolean>(() => {
    try {
      return localStorage.getItem("hasSeenBookingTour") === "true";
    } catch {
      return false;
    }
  });

  const isTourRunningRef = useRef(false);

  /* ===== Data loading ===== */
  useEffect(() => {
    (async () => {
      try {
        const list = await specialtyApi.getActiveSpecialties();
        setSpecialties(list || []);
      } catch {
        toast.error("Không thể tải danh sách chuyên khoa");
      }
    })();
  }, []);

  useEffect(() => {
    const findBy = (regex: RegExp) =>
      specialties.find((s) => regex.test(s.name));

    if (serviceType === "KHAM_TONG_QUAT") {
      const internal = findBy(/nội|đa khoa|internal|general/i);
      if (internal) setSelectedSpecialtyId(internal._id);
      setAutoAssign(true);
      setDoctorId("");
    } else if (serviceType === "TU_VAN_DINH_DUONG") {
      const nutri = findBy(/dinh dưỡng|nutrition/i);
      if (nutri) setSelectedSpecialtyId(nutri._id);
      setAutoAssign(true);
      setDoctorId("");
    } else if (serviceType === "TU_VAN_TAM_LY") {
      const psych = findBy(/tâm lý|tâm thần|psych/i);
      if (psych) setSelectedSpecialtyId(psych._id);
      setAutoAssign(true);
      setDoctorId("");
    } else if (serviceType === "GOI_DINH_KY") {
      const internal = findBy(/nội|đa khoa|internal|general/i);
      if (internal) setSelectedSpecialtyId(internal._id);
      setAutoAssign(true);
      setDoctorId("");
    }
    setSuggestions([]);
    setSelectedSuggestionKey("");
  }, [serviceType, specialties]);

  useEffect(() => {
    if (!selectedSpecialtyId) {
      setDoctors([]);
      setSuggestions([]);
      setSelectedSuggestionKey("");
      return;
    }
    (async () => {
      try {
        setLoadingDoctors(true);
        const list = await getDoctors(selectedSpecialtyId);
        setDoctors(list || []);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Không tải được bác sĩ";
        toast.error(message);
      } finally {
        setLoadingDoctors(false);
      }
    })();
  }, [selectedSpecialtyId]);

  // Build suggestions
  useEffect(() => {
    const build = async () => {
      if (!selectedSpecialtyId) {
        setSuggestions([]);
        setSelectedSuggestionKey("");
        return;
      }

      const passTime = (t: string) => {
        if (timeFilter === "ALL") return true;
        return timeFilter === "MORNING" ? t < "12:00" : t >= "12:00";
        // NOTE: simple string compare works with HH:mm
      };

      setSuggestionsLoading(true);

      // Choosing specific doctor
      if (!autoAssign && serviceType === "KHAM_CHUYEN_KHOA" && doctorId) {
        try {
          const sch: ScheduleItem[] = await getDoctorSchedules(doctorId);
          const available = (sch || [])
            .filter(
              (s) => (s.status === "accepted" || !s.status) && !s.isBooked
            )
            .filter((s) => (!date || s.date >= date) && passTime(s.startTime))
            .sort((a, b) =>
              (a.date + a.startTime).localeCompare(b.date + b.startTime)
            )
            .slice(0, 10)
            .map<SuggestionItem>((s) => ({
              doctorId,
              doctorName:
                doctors.find((d) => d._id === doctorId)?.name || "Bác sĩ",
              schedule: s,
            }));
          setSuggestions(available);
        } catch {
          setSuggestions([]);
        } finally {
          setSuggestionsLoading(false);
        }
        return;
      }

      // Auto-assign across doctors
      try {
        const ordered = doctors
          .filter((d) =>
            doctorFilter
              ? d.name.toLowerCase().includes(doctorFilter.toLowerCase())
              : true
          )
          .slice()
          .sort((a, b) => (b.experience || 0) - (a.experience || 0));

        const collected: SuggestionItem[] = [];
        for (const d of ordered) {
          if (collected.length >= 12) break;
          try {
            const sch: ScheduleItem[] = await getDoctorSchedules(d._id);
            const available = (sch || [])
              .filter(
                (s) => (s.status === "accepted" || !s.status) && !s.isBooked
              )
              .filter((s) => (!date || s.date >= date) && passTime(s.startTime))
              .sort((a, b) =>
                (a.date + a.startTime).localeCompare(b.date + b.startTime)
              )
              .slice(0, 3);
            for (const s of available) {
              collected.push({
                doctorId: d._id,
                doctorName: d.name,
                schedule: s,
              });
              if (collected.length >= 12) break;
            }
          } catch {
            /* ignore */
          }
        }
        setSuggestions(collected);
      } finally {
        setSuggestionsLoading(false);
      }
    };
    build();
  }, [
    selectedSpecialtyId,
    serviceType,
    autoAssign,
    doctorId,
    date,
    doctors,
    doctorFilter,
    timeFilter,
  ]);

  const selectedSpecialtyName = useMemo(
    () => specialties.find((s) => s._id === selectedSpecialtyId)?.name || "",
    [specialties, selectedSpecialtyId]
  );

  const requiresSpecialtySelection = serviceType === "KHAM_CHUYEN_KHOA";

  /* ===== Validation & submit ===== */
  function validate(): string | null {
    if (!isAuthenticated || !user) return "Vui lòng đăng nhập";
    if (!fullName.trim()) return "Vui lòng nhập họ tên";
    if (!phone.trim()) return "Vui lòng nhập số điện thoại";
    if (!date) return "Vui lòng chọn ngày";
    if (requiresSpecialtySelection) {
      if (!selectedSpecialtyId) return "Vui lòng chọn chuyên khoa";
      if (!autoAssign && !doctorId)
        return "Vui lòng chọn bác sĩ hoặc bật Tự gợi ý";
    }
    if (!selectedSuggestionKey) return "Vui lòng chọn một ca đề xuất";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) return toast.warning(err);

    try {
      setSubmitting(true);
      const chosen = suggestions.find(
        (s) => `${s.doctorId}-${s.schedule._id}` === selectedSuggestionKey
      );
      if (!chosen) return toast.error("Không thể xác định ca được chọn");

      const finalNote = [
        `[Dịch vụ] ${serviceMeta[serviceType].label}`,
        serviceType === "GOI_DINH_KY"
          ? "Gợi ý: tạo nhiều sub-appointments (mock)"
          : undefined,
        note?.trim() || undefined,
      ]
        .filter(Boolean)
        .join(" | ");

      const resp = await createAppointment({
        patientId: user!._id,
        doctorId: chosen.doctorId,
        scheduleId: chosen.schedule._id,
        note: finalNote,
        symptoms: "",
        mode,
      });

      // Server returns data + holdExpiresAt when appointment is a payment hold
      const appointment = resp?.data;
      const holdExpiresAt = resp?.holdExpiresAt;
      if (holdExpiresAt && appointment && appointment._id) {
        const holdMinutes = Math.max(
          1,
          Math.round((new Date(holdExpiresAt).getTime() - Date.now()) / 60000)
        );
        toast.success(
          `Đặt lịch thành công! Giữ chỗ ${holdMinutes} phút. Chuyển tới thanh toán.`
        );
        // Navigate to payment page so user can complete payment
        window.location.href = `/payments/${appointment._id}`;
        return;
      }
      toast.success("Đặt lịch thành công! Đang chờ xác nhận");
      setSelectedSuggestionKey("");
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Đặt lịch thất bại"
          : err instanceof Error
          ? err.message
          : "Đặt lịch thất bại";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  /* ===== Driver: start & help button ===== */
  const startTour = () => {
    if (isTourRunningRef.current || window.__bookingTourRunning) return;

    const steps: DriveStep[] = [];

    // helper: chỉ thêm step khi element thực sự tồn tại trong DOM
    const addStepIfExists = (
      selector: string,
      pop: DriveStep["popover"]
    ) => {
      const el = document.querySelector(selector);
      if (el) {
        steps.push({ element: selector, popover: pop });
      }
    };

    // 1) Thông tin bệnh nhân
    addStepIfExists("#patient-info", {
      title: "Thông tin bệnh nhân",
      description: "Điền thông tin cá nhân của bạn",
      side: "right",
      popoverClass: "booking-tour-popover",
    });

    // 2) Chọn dịch vụ
    addStepIfExists("#service-type", {
      title: "Chọn dịch vụ",
      description: "Chọn loại dịch vụ khám phù hợp",
      side: "bottom",
      popoverClass: "booking-tour-popover",
    });

    // 3) (Chỉ khi khám chuyên khoa) khu vực chuyên khoa/bác sĩ
    if (requiresSpecialtySelection) {
      addStepIfExists("#specialty-section", {
        title: "Chọn chuyên khoa / bác sĩ",
        description:
          "Chọn chuyên khoa phù hợp (có thể để hệ thống tự gợi ý bác sĩ).",
        side: "left",
        popoverClass: "booking-tour-popover",
      });

      // 4) (Chỉ khi chuyên khoa) danh sách ca trống
      addStepIfExists("#time-slots", {
        title: "Chọn lịch khám",
        description: "Chọn ca khám trống phù hợp với bạn.",
        side: "top",
        popoverClass: "booking-tour-popover",
      });
    }

    // 5) Tóm tắt
    addStepIfExists("#summary-card", {
      title: "Kiểm tra tóm tắt",
      description: "Xem lại thông tin trước khi gửi đăng ký.",
      side: "left",
      popoverClass: "booking-tour-popover",
    });

    // 6) Nút gửi
    addStepIfExists("#submit-booking", {
      title: "Gửi đăng ký",
      description: "Nhấn nút này để hoàn tất đặt lịch.",
      side: "top",
      popoverClass: "booking-tour-popover",
    });

    // Nếu vì lý do gì đó không có step nào -> thoát
    if (steps.length === 0) return;

    const inst = driver({
      showProgress: true,
      allowClose: true,
      // overlayClickNext: true, // Thuộc tính không hợp lệ đối với driver.js
      overlayClickBehavior: "nextStep",
      animate: false,
      smoothScroll: false,
      stagePadding: 0,
      nextBtnText: "Tiếp tục",
      prevBtnText: "Quay lại",
      doneBtnText: "Hoàn tất",
      steps,
      onHighlightStarted: (el) => {
        const rect = (el as HTMLElement).getBoundingClientRect();
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        window.scrollTo({ top: rect.top + scrollTop - 100, left: 0 });
      },
      onDestroyStarted: () => {
        isTourRunningRef.current = false;
        window.__bookingTourRunning = false;
        setTimeout(hardCleanupDriverDom, 0);
      },
      // driver.js Config does not include onComplete; use onDestroyed to emulate cleanup
      onDestroyed: () => {
        try {
          localStorage.setItem("hasSeenBookingTour", "true");
        } catch {
          /* empty */
        }
        setHasSeenTour(true);
        isTourRunningRef.current = false;
        window.__bookingTourRunning = false;
        setTimeout(hardCleanupDriverDom, 0);
      },
    });

    window.__bookingDriver = inst;
    isTourRunningRef.current = true;
    window.__bookingTourRunning = true;
    inst.drive();
  };

  // ESC để đóng khẩn cấp
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hardCleanupDriverDom();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Tự bật lần đầu + tạo nút “Xem hướng dẫn”
  useEffect(() => {
    if (!hasSeenTour && !isTourRunningRef.current) {
      // đợi 300ms cho DOM render ổn định
      const t = setTimeout(startTour, 300);
      return () => clearTimeout(t);
    }
  }, [hasSeenTour, requiresSpecialtySelection]);

  useEffect(() => {
    const HELP_ID = "booking-help-btn";
    if (!document.getElementById(HELP_ID)) {
      const helpBtn = document.createElement("button");
      helpBtn.id = HELP_ID;
      helpBtn.type = "button";
      helpBtn.setAttribute("aria-label", "Xem hướng dẫn đặt lịch");
      helpBtn.innerHTML = `<span class="flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        Xem hướng dẫn
      </span>`;
      helpBtn.className =
        "fixed left-4 bottom-20 z-50 bg-white text-gray-700 px-4 py-2 rounded-full shadow-lg hover:bg-gray-50 flex items-center gap-2 border border-gray-200";
      helpBtn.onclick = () => startTour();
      document.body.appendChild(helpBtn);
    }
    return () => {
      const btn = document.getElementById(HELP_ID);
      if (btn) btn.remove();
      hardCleanupDriverDom();
    };
  }, [startTour]);

  /* =================== UI =================== */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Theme for driver popover (không cần file CSS riêng) */}
      <style>{`
        .booking-tour-popover {
          background: linear-gradient(to right, #3b82f6, #14b8a6);
          color: #fff;
          border-radius: 0.75rem;
          padding: 1rem;
          box-shadow: 0 10px 25px rgba(0,0,0,.15);
        }
        .booking-tour-popover .driver-popover-title {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: .25rem;
        }
        .booking-tour-popover .driver-popover-description { opacity: .95; }
        .booking-tour-popover .driver-popover-footer { margin-top: .75rem; display: flex; gap: .5rem; }
        .booking-tour-popover .driver-popover-btn,
        .booking-tour-popover .driver-popover-close-btn {
          border-radius: .5rem;
          padding: .5rem .875rem;
          border: none;
          cursor: pointer;
        }
        .booking-tour-popover .driver-popover-btn-next,
        .booking-tour-popover .driver-popover-btn-done {
          background: linear-gradient(to right, #3b82f6, #14b8a6);
          color: #fff;
        }
        .booking-tour-popover .driver-popover-btn-prev,
        .booking-tour-popover .driver-popover-close-btn {
          background: rgba(255,255,255,.25);
          color: #fff;
        }
      `}</style>

      {/* Top hero bar */}
      <div className="bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 text-white">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Đăng ký lịch khám</h1>
          <p className="mt-1 text-white/90">
            Chọn dịch vụ và ca khám phù hợp. Chỉ khi khám chuyên khoa mới cần
            chọn chuyên khoa/bác sĩ.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          <Card
            title="1) Thông tin bệnh nhân"
            id="patient-info"
            className="booking-form-step1"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Họ và tên">
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-200"
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </Field>
              <Field label="Số điện thoại">
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-200"
                  placeholder="09xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>
              <Field label="Email (không bắt buộc)">
                <input
                  type="email"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-200"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label="Ngày khám">
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-200"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </Field>
            </div>
            <Field label="Ghi chú (không bắt buộc)">
              <textarea
                rows={3}
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-200"
                placeholder="Triệu chứng, tiền sử bệnh, bảo hiểm..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Field>
          </Card>

          <Card
            title="2) Chọn dịch vụ"
            id="service-type"
            className="service-selection"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(serviceMeta) as ServiceType[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setServiceType(key)}
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    serviceType === key
                      ? "border-teal-500 ring-2 ring-teal-200 bg-white"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`mt-1 rounded-full p-2 ${
                      serviceType === key
                        ? "bg-teal-50 text-teal-600"
                        : "bg-gray-50 text-gray-600"
                    }`}
                  >
                    {serviceMeta[key].icon}
                  </div>
                  <div>
                    <div className="font-semibold">
                      {serviceMeta[key].label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {serviceMeta[key].desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Specialty / doctor only for specialized exam */}
            <div id="specialty-section">
              {serviceType === "KHAM_CHUYEN_KHOA" && (
                <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-1">
                    <Field label="Chuyên khoa">
                      <select
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-200"
                        value={selectedSpecialtyId}
                        onChange={(e) => {
                          setSelectedSpecialtyId(e.target.value);
                          setDoctorId("");
                          setSuggestions([]);
                          setSelectedSuggestionKey("");
                        }}
                      >
                        <option value="">-- Chọn chuyên khoa --</option>
                        {specialties
                          .filter((sp) => sp.isActive)
                          .map((sp) => (
                            <option key={sp._id} value={sp._id}>
                              {sp.name}
                            </option>
                          ))}
                      </select>
                    </Field>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        Bác sĩ
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={autoAssign}
                          onChange={(e) => {
                            setAutoAssign(e.target.checked);
                            if (e.target.checked) setDoctorId("");
                            setSuggestions([]);
                            setSelectedSuggestionKey("");
                          }}
                        />
                        <span>Tự gợi ý bác sĩ đang rảnh</span>
                      </label>
                    </div>
                    {!autoAssign && (
                      <div className="mt-2">
                        <div className="relative mb-2">
                          <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            value={doctorFilter}
                            onChange={(e) => setDoctorFilter(e.target.value)}
                            placeholder="Tìm bác sĩ theo tên"
                            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-200"
                          />
                        </div>
                        <select
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-200"
                          value={doctorId}
                          onChange={(e) => {
                            setDoctorId(e.target.value);
                            setSuggestions([]);
                            setSelectedSuggestionKey("");
                          }}
                          disabled={loadingDoctors}
                        >
                          <option value="">-- Chọn bác sĩ --</option>
                          {doctors
                            .filter((d) =>
                              d.name
                                .toLowerCase()
                                .includes(doctorFilter.toLowerCase())
                            )
                            .map((d) => (
                              <option key={d._id} value={d._id}>
                                {d.name}
                                {selectedSpecialtyName
                                  ? ` - ${selectedSpecialtyName}`
                                  : ""}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Suggestions Panel */}
                  <div className="lg:col-span-2">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-700">
                        Đề xuất ca phù hợp
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500">Thời gian:</span>
                        {(["ALL", "MORNING", "AFTERNOON"] as TimeFilter[]).map(
                          (tf) => (
                            <button
                              key={tf}
                              type="button"
                              onClick={() => setTimeFilter(tf)}
                              className={`rounded-full px-3 py-1 border ${
                                timeFilter === tf
                                  ? "border-teal-500 text-teal-600 bg-teal-50"
                                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              {tf === "ALL"
                                ? "Tất cả"
                                : tf === "MORNING"
                                ? "Buổi sáng"
                                : "Buổi chiều"}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div
                      className="min-h-[120px] max-h-[320px] overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-3 suggestions-panel"
                      id="time-slots"
                    >
                      {suggestionsLoading ? (
                        <div className="p-3 text-sm text-gray-600">
                          Đang tải đề xuất...
                        </div>
                      ) : suggestions.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">
                          Chưa có ca trống phù hợp. Thử đổi bộ lọc thời gian
                          hoặc chuyển ngày.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {suggestions.map((s) => {
                            const key = `${s.doctorId}-${s.schedule._id}`;
                            const active = key === selectedSuggestionKey;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setSelectedSuggestionKey(key)}
                                className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition ${
                                  active
                                    ? "bg-teal-500 text-white border-teal-500"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                      active ? "bg-white/20" : "bg-gray-100"
                                    }`}
                                  >
                                    <span className="text-sm font-semibold">
                                      {initials(s.doctorName)}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="font-medium">
                                      {s.schedule.date} • {s.schedule.startTime}
                                      -{s.schedule.endTime}
                                    </div>
                                    <div
                                      className={`text-xs ${
                                        active
                                          ? "text-white/90"
                                          : "text-gray-600"
                                      }`}
                                    >
                                      {s.doctorName}
                                    </div>
                                  </div>
                                </div>
                                <div
                                  className={`text-xs ${
                                    active ? "text-white/90" : "text-gray-500"
                                  }`}
                                >
                                  Chọn
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="mt-1 text-xs text-gray-500">
                      Đề xuất dựa theo ngày đã chọn, bộ lọc thời gian và ca đang
                      rảnh.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Sticky summary */}
        <div>
          <Card
            id="summary-card"
            title="Tóm tắt"
            right={<span className="text-xs text-gray-400">Bước 3</span>}
          >
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Người khám</span>
                <span className="font-medium">{fullName || "--"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Điện thoại</span>
                <span className="font-medium">{phone || "--"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ngày</span>
                <span className="font-medium">{date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dịch vụ</span>
                <span className="font-medium">
                  {serviceMeta[serviceType].label}
                </span>
              </div>
              {requiresSpecialtySelection && selectedSpecialtyId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Chuyên khoa</span>
                  <span className="font-medium">{selectedSpecialtyName}</span>
                </div>
              )}
              {selectedSuggestionKey && (
                <div className="text-xs text-gray-600">
                  Đã chọn ca:{" "}
                  {(() => {
                    const s = suggestions.find(
                      (x) =>
                        `${x.doctorId}-${x.schedule._id}` ===
                        selectedSuggestionKey
                    );
                    return s
                      ? `${s.schedule.date} • ${s.schedule.startTime}-${s.schedule.endTime} (${s.doctorName})`
                      : "--";
                  })()}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="mt-5">
              <div className="mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Hình thức
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="mode"
                      value="offline"
                      checked={mode === "offline"}
                      onChange={() => setMode("offline")}
                    />
                    <span>Tại cơ sở</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="mode"
                      value="online"
                      checked={mode === "online"}
                      onChange={() => setMode("online")}
                    />
                    <span>Trực tuyến</span>
                  </label>
                </div>
              </div>
              <button
                id="submit-booking"
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 px-4 py-3 font-semibold text-white shadow-sm transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-60"
              >
                {submitting ? "Đang xử lý..." : "Gửi đăng ký"}
              </button>
            </form>
          </Card>

          <div className="sticky top-6"></div>
        </div>
      </div>

      <footer className="mt-2 pb-10 text-center text-xs text-gray-500">
        *Mẫu đã tối ưu bố cục: hero ở trên, thẻ nội dung gọn, tóm tắt cố định,
        đề xuất ca hiển thị dạng thẻ dễ bấm.
      </footer>
    </div>
  );
}
