// src/components/AppointmentSection.tsx
import React, { useEffect, useMemo, useState, useRef, JSX } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useAuth } from "../../../contexts/AuthContext";
import {
  createAppointment,
  getDoctorSchedules,
} from "../../../api/appointmentApi";
import { toast } from "react-toastify";
import { getDoctors } from "../../../api/doctorsApi";
import { specialtyApi } from "../../../api/specialtyApi";
import {
  FaHeartbeat,
  FaStethoscope,
  FaUserMd,
  FaNotesMedical,
  FaBrain,
} from "react-icons/fa";
import { motion } from "framer-motion";

// Small helper to extract error messages from different error shapes
function getErrMsg(err: unknown, fallback = "Lỗi xảy ra") {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  if (typeof err === "object" && err !== null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyErr = err as any;
    return anyErr?.response?.data?.message || anyErr?.message || fallback;
  }
  return fallback;
}

/* =================== Local Types =================== */
type Schedule = {
  _id: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status?: string;
  isBooked?: boolean;
};

type TimeSlot = {
  scheduleId: string;
  date: string;
  time: string;
  displayTime: string;
};

interface Specialty {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface Doctor {
  _id: string;
  name: string;
  specialty?: string;
  workplace?: string;
  experience?: number;
  description?: string;
  consultationFee?: number;
}

/* Small service type used by BookingForm elsewhere */
type ServiceType =
  | "KHAM_TONG_QUAT"
  | "KHAM_CHUYEN_KHOA"
  | "GOI_DINH_KY"
  | "TU_VAN_DINH_DUONG"
  | "TU_VAN_TAM_LY";

const SERVICE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: "KHAM_CHUYEN_KHOA", label: "Khám chuyên khoa" },
  { value: "KHAM_TONG_QUAT", label: "Khám tổng quát" },
  { value: "GOI_DINH_KY", label: "Gói định kỳ" },
  { value: "TU_VAN_DINH_DUONG", label: "Tư vấn dinh dưỡng" },
  { value: "TU_VAN_TAM_LY", label: "Tư vấn tâm lý" },
];

const serviceMeta: Record<
  ServiceType,
  { label: string; desc: string; icon: JSX.Element }
> = {
  KHAM_TONG_QUAT: {
    label: "Khám tổng quát (30' – 200k)",
    desc: "BS đa khoa/nội tổng quát. Không cần chọn khoa.",
    icon: <FaStethoscope className="text-xl" />,
  },
  KHAM_CHUYEN_KHOA: {
    label: "Khám chuyên khoa (45' – 300k)",
    desc: "Bắt buộc chọn chuyên khoa; có thể để hệ thống gợi ý bác sĩ.",
    icon: <FaUserMd className="text-xl" />,
  },
  GOI_DINH_KY: {
    label: "Khám sức khỏe định kỳ (gói) (60' – 500k)",
    desc: "Nhiều bước: điều dưỡng, KTV, BS tổng quát kết luận.",
    icon: <FaHeartbeat className="text-xl" />,
  },
  TU_VAN_DINH_DUONG: {
    label: "Tư vấn dinh dưỡng (30' – 150k)",
    desc: "Chuyên gia/bác sĩ dinh dưỡng. Không cần chọn khoa.",
    icon: <FaNotesMedical className="text-xl" />,
  },
  TU_VAN_TAM_LY: {
    label: "Tư vấn tâm lý (45' – 250k)",
    desc: "Nhà tâm lý hoặc bác sĩ tâm thần. Không cần chọn khoa.",
    icon: <FaBrain className="text-xl" />,
  },
};

/* =================== Driver Singleton =================== */
declare global {
  interface Window {
    __appointmentDriver?: Driver | null;
    __appointmentTourRunning?: boolean;
    gtag?: (...args: unknown[]) => void;
  }
}

const setDriverFlags = (running: boolean) => {
  window.__appointmentTourRunning = running;
};

const setDriverInstance = (inst: Driver | null) => {
  window.__appointmentDriver = inst;
};

/** Quét sạch mọi thứ còn sót của driver & khôi phục click */
const hardCleanupDriverDom = (): void => {
  try {
    // Hủy instance nếu còn
    window.__appointmentDriver?.destroy?.();
  } catch {
    /* empty */
  }

  // Gỡ overlay, popover, stage, wrapper...
  const leftovers = document.querySelectorAll(
    [
      ".driver-overlay",
      ".driver-popover",
      ".driver-stage",
      ".driver-stage-wrapper",
      ".driver-backdrop",
      ".driver-active-element",
      ".driver-highlighted-element",
    ].join(",")
  );
  leftovers.forEach((el) => el.remove());

  // Gỡ class driver-active trên html/body
  document.documentElement.classList.remove("driver-active");
  document.body.classList.remove("driver-active");

  // Khôi phục trỏ chuột / click
  const els = [document.documentElement, document.body] as HTMLElement[];
  els.forEach((el) => {
    el.style.removeProperty("pointer-events");
    el.style.removeProperty("overflow");
    el.style.removeProperty("position");
  });

  // Hạ cờ
  setDriverFlags(false);
  setDriverInstance(null);
};

/* =================== Component =================== */
export default function AppointmentSection(): JSX.Element {
  const { user, isAuthenticated } = useAuth();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2,
      },
    },
  };

  const slideInLeft = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6 },
    },
  };

  const slideInRight = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6 },
    },
  };

  const listItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4 },
    },
  };

  const formStepVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5 },
    },
  };

  // -------- States --------
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>("");
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState<string>("");

  // service & patient info (default to specialist visit)
  const [serviceType, setServiceType] =
    useState<ServiceType>("KHAM_CHUYEN_KHOA");
  const [fullName, setFullName] = useState<string>(user?.name || "");
  const [phone, setPhone] = useState<string>(user?.phone || "");
  const [email, setEmail] = useState<string>(user?.email || "");
  const [mode, setMode] = useState<"online" | "offline">("offline");
  const [date, setDate] = useState<string>("");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
  const [symptoms, setSymptoms] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [hasSeenTour, setHasSeenTour] = useState<boolean>(() => {
    try {
      return localStorage.getItem("hasSeenAppointmentTour") === "true";
    } catch {
      return false;
    }
  });

  // -------- Driver refs --------
  const driverRef = useRef<Driver | null>(null);
  const isTourRunningRef = useRef<boolean>(false);

  /* ===== Helpers ===== */

  const ensureDriver = (): Driver => {
    if (window.__appointmentDriver) {
      driverRef.current = window.__appointmentDriver;
      return window.__appointmentDriver;
    }

    const inst = driver({
      showProgress: true,
      allowClose: true, // Cho phép đóng bằng nút X
      animate: false,
      smoothScroll: false,
      stagePadding: 0,
      nextBtnText: "Tiếp tục",
      prevBtnText: "Quay lại",
      doneBtnText: "Hoàn tất",
      steps: [
        {
          element: "#specialty-select",
          popover: {
            title: "Chọn chuyên khoa",
            description: "Bước 1: Chọn chuyên khoa phù hợp với nhu cầu của bạn",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "#doctor-select",
          popover: {
            title: "Chọn bác sĩ",
            description: "Bước 2: Chọn bác sĩ muốn khám",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "#date-select",
          popover: {
            title: "Chọn ngày khám",
            description: "Bước 3: Chọn ngày bạn muốn đến khám",
            side: "bottom",
          },
        },
        {
          element: ".time-slots-container",
          popover: {
            title: "Chọn giờ khám",
            description: "Bước 4: Chọn khung giờ 30 phút phù hợp",
            side: "top",
          },
        },
        {
          element: "#symptoms",
          popover: {
            title: "Nhập triệu chứng",
            description: "Bước 5: Mô tả triệu chứng để bác sĩ nắm rõ",
            side: "top",
          },
        },
        {
          element: "#submit-btn",
          popover: {
            title: "Hoàn tất",
            description: "Bước cuối: Xác nhận đặt lịch",
            side: "top",
          },
        },
      ],
      onHighlightStarted: (element) => {
        const rect = (element as HTMLElement).getBoundingClientRect();
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const targetTop = rect.top + scrollTop - 100;
        window.scrollTo({ top: targetTop, left: 0 });
      },
      onDestroyStarted: () => {
        // Đóng/X hoặc hoàn tất — đánh dấu đã xem nếu tour chưa được đánh dấu
        if (!hasSeenTour) {
          try {
            localStorage.setItem("hasSeenAppointmentTour", "true");
          } catch {
            /* empty */
          }
          setHasSeenTour(true);
        }
        isTourRunningRef.current = false;
        setDriverFlags(false);
        // Hủy hoàn toàn overlay, lớp và style còn sót
        setTimeout(hardCleanupDriverDom, 0);
      },
    });

    driverRef.current = inst;
    setDriverInstance(inst);
    return inst;
  };

  const startTour = (): void => {
    const inst = ensureDriver();
    if (!isTourRunningRef.current && !window.__appointmentTourRunning) {
      isTourRunningRef.current = true;
      setDriverFlags(true);
      inst.drive();
    }
  };

  const forceCloseTour = (): void => {
    try {
      driverRef.current?.destroy?.();
    } catch {
      /* empty */
    }
    hardCleanupDriverDom();
  };

  // ESC = đóng khẩn cấp
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") forceCloseTour();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Tạo slot 30 phút
  const generateTimeSlots = (schedule: Schedule): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const [sh, sm] = schedule.startTime.split(":").map((n) => parseInt(n, 10));
    const [eh, em] = schedule.endTime.split(":").map((n) => parseInt(n, 10));
    const start = sh * 60 + sm;
    const end = eh * 60 + em;

    // Get current time for today's validation
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = now.getHours() * 60 + now.getMinutes();

    for (let m = start; m < end; m += 30) {
      const h1 = Math.floor(m / 60),
        m1 = m % 60;
      const h2 = Math.floor((m + 30) / 60),
        m2 = (m + 30) % 60;
      const t1 = `${h1.toString().padStart(2, "0")}:${m1
        .toString()
        .padStart(2, "0")}`;
      const t2 = `${h2.toString().padStart(2, "0")}:${m2
        .toString()
        .padStart(2, "0")}`;

      // Skip past time slots for today
      if (schedule.date === today && m < currentTime) {
        continue;
      }

      slots.push({
        scheduleId: schedule._id,
        date: schedule.date,
        time: t1,
        displayTime: `${t1} - ${t2}`,
      });
    }
    return slots;
  };

  const getSpecialtyName = (specialtyId: string): string => {
    if (!specialtyId) return "";
    const sp = specialties.find((s) => s._id === specialtyId);
    return sp ? sp.name : "Không xác định";
  };

  /* ===== Effects ===== */

  // Load specialties
  useEffect(() => {
    (async () => {
      try {
        const data = await specialtyApi.getActiveSpecialties();
        setSpecialties(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error loading specialties:", e);
        toast.error("Không thể tải danh sách chuyên khoa");
      }
    })();
  }, []);

  // Load doctors theo chuyên khoa
  useEffect(() => {
    (async () => {
      try {
        if (!selectedSpecialtyId) {
          setDoctors([]);
          return;
        }
        const data = await getDoctors(selectedSpecialtyId);
        setDoctors(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        toast.error(getErrMsg(err, "Không tải được bác sĩ"));
      }
    })();
  }, [selectedSpecialtyId]);

  // Auto-select specialty based on service type
  useEffect(() => {
    const findBy = (regex: RegExp) =>
      specialties.find((s) => regex.test(s.name));

    if (serviceType === "KHAM_TONG_QUAT") {
      const internal = findBy(/nội|đa khoa|internal|general/i);
      if (internal) {
        setSelectedSpecialtyId(internal._id);
        setDoctorId("");
        setSchedules([]);
        setSelectedTimeSlot(null);
      }
    } else if (serviceType === "TU_VAN_DINH_DUONG") {
      const nutri = findBy(/dinh dưỡng|nutrition/i);
      if (nutri) {
        setSelectedSpecialtyId(nutri._id);
        setDoctorId("");
        setSchedules([]);
        setSelectedTimeSlot(null);
      }
    } else if (serviceType === "TU_VAN_TAM_LY") {
      const psych = findBy(/tâm lý|tâm thần|psych/i);
      if (psych) {
        setSelectedSpecialtyId(psych._id);
        setDoctorId("");
        setSchedules([]);
        setSelectedTimeSlot(null);
      }
    } else if (serviceType === "GOI_DINH_KY") {
      const internal = findBy(/nội|đa khoa|internal|general/i);
      if (internal) {
        setSelectedSpecialtyId(internal._id);
        setDoctorId("");
        setSchedules([]);
        setSelectedTimeSlot(null);
      }
    } else {
      // For KHAM_CHUYEN_KHOA, reset to allow manual selection
      setSelectedSpecialtyId("");
      setDoctorId("");
      setSchedules([]);
      setSelectedTimeSlot(null);
    }
  }, [serviceType, specialties]);

  // For non-specialist services, auto-assign the first available doctor
  useEffect(() => {
    if (serviceType === "KHAM_CHUYEN_KHOA") return;
    if (!doctorId && doctors && doctors.length > 0) {
      setDoctorId(doctors[0]._id);
    }
  }, [serviceType, doctors, doctorId]);

  // Load schedules theo bác sĩ
  useEffect(() => {
    (async () => {
      if (!doctorId) {
        setSchedules([]);
        return;
      }
      try {
        setLoading(true);
        console.log("Loading schedules for doctor:", doctorId);
        const data = await getDoctorSchedules(doctorId);
        const today = new Date().toISOString().split("T")[0];
        const available = (data || []).filter(
          (s: Schedule) =>
            s.status === "accepted" &&
            !s.isBooked &&
            Boolean(s.date) &&
            s.date >= today
        );
        setSchedules(available);
      } catch (err: unknown) {
        console.error("Error loading schedules:", err);
        toast.error(getErrMsg(err, "Không tải được lịch bác sĩ"));
      } finally {
        setLoading(false);
      }
    })();
  }, [doctorId]);

  // Tạo nút "Xem hướng dẫn" & auto-start lần đầu
  useEffect(() => {
    // Auto-start một lần nếu chưa xem
    if (!hasSeenTour && !isTourRunningRef.current) {
      startTour();
    }

    // Nút trợ giúp
    const HELP_ID = "appointment-help-btn";
    if (!document.getElementById(HELP_ID)) {
      const helpBtn = document.createElement("button");
      helpBtn.id = HELP_ID;
      helpBtn.type = "button";
      helpBtn.setAttribute("aria-label", "Xem hướng dẫn đặt lịch");
      helpBtn.innerHTML = `<span class="flex items-center gap-2">
          <MdQuestionMark />
          Xem hướng dẫn
        </span>`;
      helpBtn.className =
        "fixed left-4 bottom-4 z-50 bg-white text-gray-700 px-4 py-2 rounded-full shadow-lg hover:bg-gray-50 flex items-center gap-2 border border-gray-200";
      helpBtn.onclick = () => {
        if (!isTourRunningRef.current) startTour();
        if (typeof window.gtag === "function") {
          window.gtag("event", "view_tutorial", {
            event_category: "Appointment",
            event_label: "Manual View",
          });
        }
      };
      document.body.appendChild(helpBtn);
    }

    return () => {
      // Cleanup tuyệt đối
      const btn = document.getElementById(HELP_ID);
      if (btn) btn.remove();
      forceCloseTour();
      hardCleanupDriverDom();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSeenTour]);

  // ===== Derived slots =====
  const availableTimeSlots = useMemo<TimeSlot[]>(() => {
    let all: TimeSlot[] = [];

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    for (const s of schedules) {
      // Only process schedules from today onwards
      if (s.date >= today) {
        const slots = generateTimeSlots(s);
        all = all.concat(slots);
      }
    }

    if (date) {
      console.log("Filtering by date:", date);
      all = all.filter((slot) => slot.date === date);
    }

    all.sort((a, b) =>
      a.date !== b.date
        ? a.date.localeCompare(b.date)
        : a.time.localeCompare(b.time)
    );
    return all;
  }, [date, schedules]);

  // ===== Submit =====
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      toast.info("Vui lòng đăng nhập để đặt lịch");
      return;
    }
    if (!doctorId || !selectedTimeSlot) {
      toast.warning("Hãy chọn bác sĩ và khung giờ");
      return;
    }
    try {
      setLoading(true);

      const finalNote = [
        `[Dịch vụ] ${serviceMeta[serviceType].label}`,
        serviceType === "GOI_DINH_KY"
          ? "Gợi ý: tạo nhiều sub-appointments (mock)"
          : undefined,
        note?.trim() || undefined,
      ]
        .filter(Boolean)
        .join(" | ");

      const payload: Parameters<typeof createAppointment>[0] = {
        patientId: user._id,
        doctorId,
        scheduleId: selectedTimeSlot!.scheduleId,
        symptoms,
        note: finalNote,
        appointmentTime: selectedTimeSlot!.time,
        mode,
      };
      // include optional patientInfo and serviceType when available
      (payload as unknown as Record<string, unknown>).patientInfo = {
        name: fullName,
        phone,
        email,
      };
      (payload as unknown as Record<string, unknown>).serviceType = serviceType;
      const resp = await createAppointment(payload);

      const appointment = resp?.data;
      const holdExpiresAt = resp?.holdExpiresAt;
      if (holdExpiresAt && appointment && appointment._id) {
        const holdMinutes = Math.max(
          1,
          Math.round((new Date(holdExpiresAt).getTime() - Date.now()) / 60000)
        );
        toast.success(
          `Đặt lịch giữ chỗ ${holdMinutes} phút. Chuyển tới thanh toán.`
        );
        window.location.href = `/payments/${appointment._id}`;
        return;
      }

      toast.success("Đặt lịch thành công! Đang chờ xác nhận");
      setSelectedTimeSlot(null);
      setSymptoms("");
      setNote("");
    } catch (err: unknown) {
      toast.error(getErrMsg(err, "Đặt lịch thất bại"));
    } finally {
      setLoading(false);
    }
  };

  /* =================== UI =================== */
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={containerVariants}
      className="overflow-x-hidden py-16 bg-teal-500 text-white"
      id="appointment"
      aria-label="Khu vực đặt lịch khám"
    >
      {/* Popover theme (inline, không cần file CSS) */}
      <style>{`
          .appointment-tour-popover {
            background: linear-gradient(to right, #3b82f6, #14b8a6);
            color: #fff;
            border-radius: 0.75rem;
            padding: 1rem;
            box-shadow: 0 10px 25px rgba(0,0,0,.15);
          }
          .appointment-tour-popover .driver-popover-title {
            font-size: 1.125rem;
            font-weight: 700;
            margin-bottom: .25rem;
          }
          .appointment-tour-popover .driver-popover-description { opacity: .95; }
          .appointment-tour-popover .driver-popover-footer { margin-top: .75rem; display: flex; gap: .5rem; }
          .appointment-tour-popover .driver-popover-close-btn,
          .appointment-tour-popover .driver-popover-btn { border-radius: .5rem; padding: .5rem .875rem; border: none; cursor: pointer; }
          .appointment-tour-popover .driver-popover-close-btn { background: rgba(255,255,255,.25); color: #fff; }
          .appointment-tour-popover .driver-popover-btn-next,
          .appointment-tour-popover .driver-popover-btn-done { background: linear-gradient(to right, #3b82f6, #14b8a6); color: #fff; }
          .appointment-tour-popover .driver-popover-btn-prev { background: rgba(255,255,255,.25); color: #fff; }

          /* Bảo đảm sau khi đóng vẫn click được: nếu vì lý do nào đó class còn lại */
          html.driver-active, body.driver-active { pointer-events: auto !important; overflow: auto !important; }
        `}</style>

      <div className="container mx-auto px-4">
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Intro */}
          <motion.aside
            variants={slideInLeft}
            className="md:sticky  md:top-24 md:self-start text-white "
          >
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-3xl font-bold text-white mb-4"
            >
              Đặt lịch khám ngay hôm nay
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-white-600 mb-6"
            >
              Đặt lịch khám trực tuyến nhanh chóng và tiện lợi. Chỉ cần vài bước
              đơn giản, bạn có thể lựa chọn bác sĩ và thời gian phù hợp nhất.
            </motion.p>
            <motion.ul
              variants={containerVariants}
              className="space-y-3 mb-8 text-white"
            >
              {[
                "Chọn chuyên khoa và bác sĩ phù hợp",
                "Lựa chọn ngày và giờ theo lịch trình của bạn",
                "Nhận xác nhận ngay lập tức qua email",
                "Thông báo nhắc lịch hẹn trước 24 giờ",
              ].map((text, index) => (
                <motion.li
                  key={index}
                  variants={listItemVariants}
                  className="flex items-center"
                >
                  <CheckCircle
                    size={20}
                    className="mr-2 text-teal-600"
                    aria-hidden
                  />
                  <span>{text}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.aside>

          {/* Form */}
          <motion.div
            variants={slideInRight}
            className="bg-white p-6 rounded-lg shadow-lg"
          >
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
                  Đặt lịch khám
                </h3>

                <p className="text-gray-600 text-sm">
                  Vui lòng điền thông tin để đặt lịch khám bệnh
                </p>
              </div>

              {/* Step 1: Service & Patient Info */}
              <motion.div
                variants={formStepVariants}
                className="bg-gradient-to-r from-teal-50 to-indigo-50 p-6 rounded-xl border border-teal-100"
              >
                <h4 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <span className="bg-teal-500  text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                    1
                  </span>
                  Thông tin cơ bản
                </h4>

                {/* Service Type */}
                <div className="mb-6">
                  <label
                    htmlFor="service-select"
                    className="block text-gray-700 mb-2 text-sm font-medium"
                  >
                    Dịch vụ khám
                  </label>
                  <select
                    id="service-select"
                    value={serviceType}
                    onChange={(e) =>
                      setServiceType(e.target.value as ServiceType)
                    }
                    className=" text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base bg-white shadow-sm transition-all duration-200"
                  >
                    {SERVICE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mode Selection */}
                <div className="flex items-center gap-8 text-slate-900 mb-3">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      value="offline"
                      checked={mode === "offline"}
                      onChange={() => setMode("offline")}
                      className="mr-2 h-4 w-4 accent-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm">Tại phòng khám</span>
                  </label>

                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      value="online"
                      checked={mode === "online"}
                      onChange={() => setMode("online")}
                      className="mr-2 h-4 w-4 accent-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm">Trực tuyến</span>
                  </label>
                </div>

                {/* Patient Information */}
                <div className="space-y-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-4">
                    Thông tin bệnh nhân
                  </h5>

                  <div className="grid grid-cols-2 gap-4 text-black">
                    {/* Patient name */}
                    <div>
                      <label
                        htmlFor="patient-name"
                        className="block text-gray-700 mb-2 text-sm "
                      >
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="patient-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white"
                        placeholder="Nhập họ và tên"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label
                        htmlFor="patient-phone"
                        className="block text-gray-700 mb-2 text-sm"
                      >
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="patient-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Nhập số điện thoại"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white"
                      />
                    </div>
                  </div>

                  {/* Email - Full width */}
                  <div>
                    <label
                      htmlFor="patient-email"
                      className="block text-gray-700 mb-2 text-sm"
                    >
                      Email
                    </label>
                    <input
                      id="patient-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white text-black"
                      placeholder="Nhập email"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Step 2: Doctor Selection */}
              <motion.div
                variants={formStepVariants}
                className="bg-gradient-to-r from-teal-50 to-indigo-50 p-4 rounded-lg"
              >
                <h4 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                  <span className="bg-teal-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                    2
                  </span>
                  Chọn bác sĩ
                </h4>

                {serviceType === "KHAM_CHUYEN_KHOA" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Chuyên khoa */}
                    <div>
                      <label
                        htmlFor="specialty-select"
                        className="block text-gray-700 mb-1 text-sm font-medium"
                      >
                        Chuyên khoa
                      </label>
                      <select
                        id="specialty-select"
                        value={selectedSpecialtyId}
                        onChange={(e) => {
                          const specialtyId = e.target.value;
                          setSelectedSpecialtyId(specialtyId);
                          setDoctorId("");
                          setSchedules([]);
                          setSelectedTimeSlot(null);
                        }}
                        className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                        aria-describedby="specialty-help"
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
                    </div>

                    {/* Bác sĩ */}
                    <div>
                      <label
                        htmlFor="doctor-select"
                        className="block text-gray-700 mb-1 text-sm font-medium"
                      >
                        Bác sĩ
                      </label>
                      <select
                        id="doctor-select"
                        value={doctorId}
                        onChange={(e) => setDoctorId(e.target.value)}
                        className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                        disabled={!selectedSpecialtyId}
                      >
                        <option value="">
                          {selectedSpecialtyId
                            ? "-- Chọn bác sĩ --"
                            : "Vui lòng chọn chuyên khoa trước"}
                        </option>
                        {doctors.map((d) => {
                          const specialtyName = getSpecialtyName(
                            d.specialty || ""
                          );
                          const doctorInfo = [
                            d.name,
                            specialtyName,
                            d.workplace,
                            d.experience
                              ? `${d.experience} năm kinh nghiệm`
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" - ");
                          return (
                            <option key={d._id} value={d._id}>
                              {doctorInfo}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                ) : (
                  /* Thông tin bác sĩ được chọn tự động cho các dịch vụ không phải chuyên khoa */
                  doctorId && (
                    <div className="p-3 bg-teal-50 border border-teal-200 rounded-md">
                      <div className="text-sm text-teal-800">
                        <strong>Bác sĩ được chọn:</strong>{" "}
                        {doctors.find((d) => d._id === doctorId)?.name ||
                          "Đang tải..."}
                      </div>
                      <div className="text-xs text-teal-600 mt-1">
                        Chuyên khoa: {getSpecialtyName(selectedSpecialtyId)}
                      </div>
                    </div>
                  )
                )}
              </motion.div>

              {/* Step 3: Schedule & Symptoms */}
              <motion.div
                variants={formStepVariants}
                className="bg-gradient-to-r from-teal-50 to-indigo-50 p-4 rounded-lg"
              >
                <h4 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                  <span className="bg-teal-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                    3
                  </span>
                  Lịch khám & triệu chứng
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Ngày khám */}
                  <div>
                    <label
                      htmlFor="date-select"
                      className="block text-gray-700 mb-1 text-sm font-medium"
                    >
                      Ngày khám
                    </label>
                    <input
                      id="date-select"
                      type="date"
                      value={date}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 text-black py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                    />
                  </div>

                  {/* Triệu chứng */}
                  <div>
                    <label
                      htmlFor="symptoms"
                      className="block text-gray-700 mb-1 text-sm font-medium"
                    >
                      Triệu chứng
                    </label>
                    <input
                      id="symptoms"
                      type="text"
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                      placeholder="Ví dụ: sốt, ho, đau đầu..."
                    />
                  </div>
                </div>

                {/* Khung giờ */}
                <div>
                  <label className="block text-gray-700 mb-2 text-sm font-medium">
                    Chọn khung giờ trống (mỗi slot 30 phút)
                  </label>
                  <div className="time-slots-container min-h-[80px] max-h-[150px] overflow-y-auto border border-gray-200 rounded-md p-3 bg-white">
                    {loading ? (
                      <div className="flex items-center justify-center py-6 text-gray-600">
                        <Loader2
                          size={16}
                          className="mr-2 animate-spin"
                          aria-hidden
                        />
                        <span className="text-sm">Đang tải lịch...</span>
                      </div>
                    ) : availableTimeSlots.length === 0 ? (
                      <div className="text-gray-500 text-sm text-center py-6">
                        {!doctorId
                          ? "Vui lòng chọn bác sĩ để xem lịch trống"
                          : "Không có khung giờ phù hợp."}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {availableTimeSlots.map((slot, index) => {
                          const isSelected =
                            selectedTimeSlot?.scheduleId === slot.scheduleId &&
                            selectedTimeSlot?.time === slot.time;
                          const displayLabel = date
                            ? slot.displayTime
                            : `${slot.date} - ${slot.displayTime}`;

                          return (
                            <button
                              type="button"
                              key={`${slot.scheduleId}-${slot.time}-${index}`}
                              onClick={() => setSelectedTimeSlot(slot)}
                              className={`px-2 py-1.5 rounded-md border text-xs transition text-center ${
                                isSelected
                                  ? "bg-teal-500 text-white border-teal-500"
                                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                              }`}
                              aria-pressed={isSelected}
                            >
                              {displayLabel}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {selectedTimeSlot && (
                    <div className="mt-2 text-sm text-gray-600 bg-green-50 p-2 rounded border border-green-200">
                      <strong>✓ Đã chọn:</strong> {selectedTimeSlot.date} -{" "}
                      {selectedTimeSlot.displayTime}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Step 4: Additional Notes */}
              <motion.div
                variants={formStepVariants}
                className="bg-gradient-to-r from-teal-50 to-indigo-50 p-4 rounded-lg"
              >
                <h4 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                  <span className="bg-teal-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                    4
                  </span>
                  Ghi chú thêm (tùy chọn)
                </h4>
                <div>
                  <label
                    htmlFor="note"
                    className="block text-gray-700 mb-1 text-sm font-medium"
                  >
                    Ghi chú
                  </label>
                  <textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                    rows={2}
                    placeholder="Ghi chú thêm (nếu có)"
                  />
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.div variants={formStepVariants} className="pt-4">
                <button
                  id="submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-teal-500 text-white font-medium rounded-md hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Đang xử lý...
                    </span>
                  ) : (
                    "Xác nhận đặt lịch"
                  )}
                </button>
              </motion.div>

              <button
                id="force-close-tour"
                type="button"
                onClick={forceCloseTour}
                className="hidden"
                aria-hidden
              />
            </form>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}
