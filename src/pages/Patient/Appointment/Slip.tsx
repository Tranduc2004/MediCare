import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { paymentApi } from "../../../api/paymentApi";
import AppointmentSlipView from "../../../components/Patient/Appointment/AppointmentSlipView";
import { getMyAppointments } from "../../../api/appointmentApi";
import { useAuth } from "../../../contexts/AuthContext";
import { specialtyApi, ISpecialty } from "../../../api/specialtyApi";

export default function AppointmentSlipPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["appointmentSlip", appointmentId],
    queryFn: async () => {
      if (!appointmentId) return null;
      return await paymentApi.getDetails(appointmentId);
    },
    enabled: !!appointmentId,
  });

  const { user } = useAuth();

  // Load specialties for mapping specialty IDs to names
  const [specialties, setSpecialties] = useState<ISpecialty[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const list = await specialtyApi.getActiveSpecialties();
        setSpecialties(list || []);
      } catch (err) {
        console.error("Không thể tải chuyên khoa:", err);
      }
    })();
  }, []);
  const [overrideSchedule, setOverrideSchedule] = useState<{
    date?: string;
    startTime?: string;
    endTime?: string;
  } | null>(null);
  const [overridePatient, setOverridePatient] = useState<{
    name?: string;
    phone?: string;
    email?: string;
  } | null>(null);
  const [overrideServiceLabel, setOverrideServiceLabel] = useState<
    string | null
  >(null);

  type AppointmentObj = {
    _id?: string;
    doctorId?:
      | { name?: string; workplace?: string; workplaceAddress?: string }
      | string;
    patientId?: { name?: string; phone?: string; email?: string } | string;
    patientInfo?: { name?: string; phone?: string; email?: string } | null;
    serviceType?: string;
    service?: { type?: string; name?: string; label?: string } | string;
    serviceLabel?: string;
    mode?: string;
    appointmentTime?: string;
    appointmentDate?: string; // added to support HH:mm + date format
    schedule?: { date?: string; startTime?: string; endTime?: string } | string;
    slot?: { date?: string; startTime?: string; endTime?: string } | string;
    scheduleId?:
      | { date?: string; startTime?: string; endTime?: string }
      | string;
    newScheduleId?:
      | { date?: string; startTime?: string; endTime?: string }
      | string;
    note?: string;
    symptoms?: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  type InvoiceObj = { _id?: string; status?: string; patientAmount?: number };

  const ctx = (data || {}) as {
    appointment?: AppointmentObj;
    invoices?: InvoiceObj[];
  };
  const appointment = ctx.appointment;
  const invoices = Array.isArray(ctx.invoices) ? ctx.invoices : [];

  if (error) {
    console.error("API Error:", error);
  }
  // Prefer captured/captured-like invoice if present
  const invoice =
    invoices.find((i: InvoiceObj) => i.status === "captured") ||
    invoices[0] ||
    null;

  type DoctorLite = {
    name?: string;
    workplace?: string;
    workplaceAddress?: string;
  };
  type PatientLite = { name?: string; phone?: string; email?: string };

  const doctorObj = (
    typeof appointment?.doctorId === "string"
      ? ({} as DoctorLite)
      : appointment?.doctorId || {}
  ) as DoctorLite;
  const patientObj = (
    typeof appointment?.patientId === "string"
      ? ({} as PatientLite)
      : appointment?.patientId || {}
  ) as PatientLite;
  const patientInfoObj =
    appointment?.patientInfo ||
    ({} as {
      name?: string;
      phone?: string;
      email?: string;
    });

  // Resolve schedule: prefer a concrete newScheduleId object (doctor proposed
  // or patient accepted reschedule) when available, otherwise fall back to
  // the original scheduleId object. If the fields are only string IDs, the
  // objects won't provide date/time here.
  const scheduleObj = (() => {
    const ns = appointment?.newScheduleId;
    const s = appointment?.scheduleId;
    // If newScheduleId is an object with date/startTime, prefer it
    if (ns && typeof ns !== "string")
      return ns as { date?: string; startTime?: string; endTime?: string };
    if (s && typeof s !== "string")
      return s as { date?: string; startTime?: string; endTime?: string };
    return {} as { date?: string; startTime?: string; endTime?: string };
  })();

  // Helper functions from History.tsx for better data extraction
  function parseService(note?: string) {
    if (!note) return "";
    const m = note.match(/\[Dịch vụ\]\s*([^|]+)/);
    return m?.[1]?.trim() || "";
  }

  // Helper functions from payment pages for better data extraction
  const getDoctorName = (appt: unknown) => {
    if (!appt || typeof appt !== "object") return "-";
    const ap = appt as Record<string, unknown>;
    const doc = ap["doctorId"];
    if (!doc || typeof doc === "string") return "-";
    const d = doc as Record<string, unknown>;
    return typeof d["name"] === "string" ? (d["name"] as string) : "-";
  };

  const getDoctorSpecialty = (appt: unknown) => {
    if (!appt || typeof appt !== "object") return "-";
    const ap = appt as Record<string, unknown>;
    const doc = ap["doctorId"];

    // If doctor is populated and contains a specialty field
    if (doc && typeof doc !== "string") {
      const d = doc as Record<string, unknown>;
      const spec = d["specialty"];
      if (typeof spec === "string") {
        // try interpret as id first
        const found = specialties.find((s) => s._id === spec);
        return found ? found.name : spec;
      }
    }

    // appointment may carry specialty or specialtyId directly
    const apSpec = (ap["specialty"] || ap["specialtyId"]) as unknown;
    if (typeof apSpec === "string") {
      const found = specialties.find((s) => s._id === apSpec);
      return found ? found.name : apSpec;
    }

    return "-";
  };

  const statusLabel = (status?: string | null) => {
    if (!status) return "-";
    const map: Record<string, string> = {
      booked: "Đã đặt",
      doctor_approved: "Bác sĩ đã duyệt",
      doctor_rejected: "Bác sĩ từ chối",
      doctor_reschedule: "Bác sĩ yêu cầu dời lịch",
      await_payment: "Chờ thanh toán",
      paid: "Đã thanh toán",
      confirmed: "Đã xác nhận",
      in_consult: "Đang khám",
      prescription_issued: "Đã cấp đơn",
      ready_to_discharge: "Sẵn sàng xuất viện",
      completed: "Hoàn tất",
      cancelled: "Đã hủy",
      closed: "Đóng",
      payment_overdue: "Quá hạn thanh toán",
    };
    const key = String(status).toLowerCase();
    return map[key] || status;
  };

  const clinicName = doctorObj.workplace || "Phòng khám trực tuyến";
  const clinicAddress = doctorObj.workplaceAddress || "Địa chỉ phòng khám";

  // Enhanced patient name extraction with more fallbacks
  const patientName = (() => {
    if (patientInfoObj.name) return patientInfoObj.name;
    if (patientObj.name) return patientObj.name;
    if (
      typeof appointment?.patientId === "string" &&
      appointment.patientId !== ""
    ) {
      return appointment.patientId;
    }
    // Try to get from user context if available
    if (user?.name) return user.name;
    if (user?.email) return user.email.split("@")[0]; // Use email prefix as fallback
    return "-";
  })();

  // Enhanced doctor name extraction using helper function
  const doctorName = (() => {
    const helperResult = getDoctorName(appointment);
    if (helperResult !== "-") return helperResult;

    // Fallback to original logic
    if (doctorObj.name) return doctorObj.name;
    if (
      typeof appointment?.doctorId === "string" &&
      appointment.doctorId !== ""
    ) {
      return appointment.doctorId;
    }
    return "-";
  })();

  const schedule = scheduleObj;
  const mode = appointment?.mode || "offline";

  // Enhanced patient contact information extraction
  const patientObjTyped = (patientObj || {}) as PatientLite;
  const patientPhone = (() => {
    // Priority 1: Phone from appointment booking form (stored in appointment.patientInfo)
    if (appointment?.patientInfo?.phone) return appointment.patientInfo.phone;
    // Priority 2: Phone from legacy patientInfoObj (for backward compatibility)
    if (patientInfoObj.phone) return patientInfoObj.phone;
    // Priority 3: Phone from patient profile
    if (patientObjTyped.phone) return patientObjTyped.phone;
    // Priority 4: Phone from user context
    if (user?.phone) return user.phone;
    return "";
  })();

  const patientEmail = (() => {
    // Priority 1: Email from appointment booking form (stored in appointment.patientInfo)
    if (appointment?.patientInfo?.email) return appointment.patientInfo.email;
    // Priority 2: Email from legacy patientInfoObj (for backward compatibility)
    if (patientInfoObj.email) return patientInfoObj.email;
    // Priority 3: Email from patient profile
    if (patientObjTyped.email) return patientObjTyped.email;
    // Priority 4: Email from user context
    if (user?.email) return user.email;
    return "";
  })();
  const serviceType = appointment?.serviceType || "";
  function mapServiceLabel(s?: string) {
    if (!s) return "-";

    // Convert to uppercase for consistent matching
    const serviceType = String(s).toUpperCase();

    switch (serviceType) {
      case "KHAM_CHUYEN_KHOA":
        return "Khám chuyên khoa";
      case "KHAM_TONG_QUAT":
        return "Khám tổng quát";
      case "GOI_DINH_KY":
        return "Gói định kỳ";
      case "TU_VAN_DINH_DUONG":
        return "Tư vấn dinh dưỡng";
      case "TU_VAN_TAM_LY":
        return "Tư vấn tâm lý";
      case "KHAM_BENH":
        return "Khám bệnh";
      case "TU_VAN_TRUC_TUYEN":
        return "Tư vấn trực tuyến";
      case "KHAM_SIEU_AM":
        return "Khám siêu âm";
      case "XET_NGHIEM":
        return "Xét nghiệm";
      case "CHUP_X_QUANG":
        return "Chụp X-quang";
      default:
        // If it's already a readable label (contains Vietnamese characters or spaces), return as is
        if (
          /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]/.test(
            s
          )
        ) {
          return s;
        }
        // Otherwise, try to format the code into a readable label
        return s
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (l) => l.toUpperCase());
    }
  }

  // Enhanced service label extraction with multiple fallback sources (including note parsing like History.tsx)
  const extractedServiceRaw = (() => {
    // First try to parse service from note field (like History.tsx)
    const serviceFromNote = parseService((appointment as AppointmentObj)?.note);
    if (serviceFromNote) return serviceFromNote;

    // Try serviceType
    if (appointment?.serviceType) return appointment.serviceType;

    // Try serviceLabel
    if (appointment?.serviceLabel) return appointment.serviceLabel;

    // Try nested service object
    if (appointment?.service && typeof appointment.service !== "string") {
      const svc = appointment.service as {
        type?: string;
        name?: string;
        label?: string;
        title?: string;
      };
      if (svc.label) return svc.label;
      if (svc.name) return svc.name;
      if (svc.title) return svc.title;
      if (svc.type) return svc.type;
    }

    // Try service as string
    if (appointment?.service && typeof appointment.service === "string") {
      return appointment.service;
    }

    // Try any other service-related fields
    const serviceFields = ["serviceId", "serviceName", "serviceTitle"];
    for (const field of serviceFields) {
      const value = (appointment as AppointmentObj)?.[
        field as keyof AppointmentObj
      ];
      if (value && typeof value === "string") {
        return value;
      }
    }

    return "";
  })();

  const finalServiceLabel = (() => {
    if (!extractedServiceRaw) return "-";

    // Try to map the service code to a readable label
    const mapped = mapServiceLabel(String(extractedServiceRaw));

    // If mapping returned the same value and it looks like a code, try to format it
    if (
      mapped === extractedServiceRaw &&
      /^[A-Z_]+$/.test(extractedServiceRaw)
    ) {
      return extractedServiceRaw
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase());
    }

    return mapped || String(extractedServiceRaw);
  })();

  // Defensive schedule extraction: check a few common shapes. If appointment
  // contains an ISO datetime in appointmentTime, split it into date/time.
  const isScheduleObject = (
    v: unknown
  ): v is { date?: string; startTime?: string; endTime?: string } => {
    return (
      v !== null &&
      typeof v === "object" &&
      ("date" in (v as object) ||
        "startTime" in (v as object) ||
        "endTime" in (v as object))
    );
  };

  const extractScheduleFallback = () => {
    // Already have scheduleObj above; if it contains date, use it
    if (scheduleObj && (scheduleObj.date || scheduleObj.startTime))
      return scheduleObj;

    const maybe = appointment || ({} as AppointmentObj);

    // Try multiple schedule sources in order of preference (like History.tsx)
    const scheduleCandidates = [
      maybe.newScheduleId,
      maybe.scheduleId,
      maybe.schedule,
      maybe.slot,
    ];

    for (const candidate of scheduleCandidates) {
      if (isScheduleObject(candidate)) {
        const schedObj = candidate as {
          date?: string;
          startTime?: string;
          endTime?: string;
        };
        if (schedObj.date || schedObj.startTime) {
          return schedObj;
        }
      }
    }

    // Try to parse appointmentTime as ISO datetime
    if (maybe.appointmentTime && typeof maybe.appointmentTime === "string") {
      try {
        const d = new Date(maybe.appointmentTime);
        if (!isNaN(d.getTime())) {
          const date = d.toISOString().split("T")[0];
          const timeStr = d.toTimeString().split(" ")[0].slice(0, 5);
          return { date, startTime: timeStr, endTime: timeStr };
        }
      } catch {
        // ignore
      }
    }

    // Handle appointmentTime as HH:mm format with separate appointmentDate
    if (
      maybe.appointmentTime &&
      maybe.appointmentDate &&
      typeof maybe.appointmentTime === "string" &&
      typeof maybe.appointmentDate === "string"
    ) {
      // appointmentTime is likely in HH:mm format, appointmentDate is YYYY-MM-DD
      const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (timePattern.test(maybe.appointmentTime)) {
        return {
          date: maybe.appointmentDate,
          startTime: maybe.appointmentTime,
          endTime: maybe.appointmentTime,
        };
      }
    }

    // Try to extract from any date-like string fields (enhanced like History.tsx)
    const dateFields = [
      "date",
      "appointmentDate",
      "scheduleDate",
      "createdAt",
      "updatedAt",
    ];

    for (const field of dateFields) {
      const value = (maybe as AppointmentObj)[field as keyof AppointmentObj];
      if (value && typeof value === "string") {
        try {
          const d = new Date(value);
          if (!isNaN(d.getTime())) {
            const date = d.toISOString().split("T")[0];
            // If it's a full datetime, try to extract time too
            if (value.includes("T") || value.includes(" ")) {
              const timeStr = d.toTimeString().split(" ")[0].slice(0, 5);
              return { date, startTime: timeStr, endTime: timeStr };
            }
            return { date, startTime: undefined, endTime: undefined };
          }
        } catch {
          // ignore
        }
      }
    }

    // Try to extract from common time fields
    const timeFields = ["time", "startTime", "endTime"];
    const extractedTime: { startTime?: string; endTime?: string } = {};

    for (const field of timeFields) {
      const value = (maybe as AppointmentObj)[field as keyof AppointmentObj];
      if (value && typeof value === "string") {
        if (field === "startTime") extractedTime.startTime = value;
        if (field === "endTime") extractedTime.endTime = value;
        if (field === "time") {
          extractedTime.startTime = value;
          extractedTime.endTime = value;
        }
      }
    }

    // If we found time but no date, try to use today's date
    if (extractedTime.startTime || extractedTime.endTime) {
      const today = new Date().toISOString().split("T")[0];
      return { date: today, ...extractedTime };
    }

    return {} as { date?: string; startTime?: string; endTime?: string };
  };

  const finalSchedule = extractScheduleFallback();

  // If we still don't have a schedule (only string ids were returned), try
  // to fetch the appointment list/profile and find a populated appointment
  // object as a last-resort fallback (avoids changing backend).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (
          appointment?._id &&
          (!finalSchedule || !finalSchedule.date) &&
          user?._id
        ) {
          const list = (await getMyAppointments(
            String(user._id)
          )) as AppointmentObj[];
          if (Array.isArray(list)) {
            const found = list.find((a) => a._id === appointment._id);
            if (found && !cancelled) {
              const s =
                found.newScheduleId && typeof found.newScheduleId !== "string"
                  ? (found.newScheduleId as {
                      date?: string;
                      startTime?: string;
                      endTime?: string;
                    })
                  : found.scheduleId && typeof found.scheduleId !== "string"
                  ? (found.scheduleId as {
                      date?: string;
                      startTime?: string;
                      endTime?: string;
                    })
                  : found.schedule && typeof found.schedule !== "string"
                  ? (found.schedule as {
                      date?: string;
                      startTime?: string;
                      endTime?: string;
                    })
                  : found.slot && typeof found.slot !== "string"
                  ? (found.slot as {
                      date?: string;
                      startTime?: string;
                      endTime?: string;
                    })
                  : undefined;
              if (s && (s.date || s.startTime)) {
                setOverrideSchedule(s);
              }
              // also try to salvage patient contact and service label
              try {
                if (!overridePatient) {
                  const p = (
                    found.patientInfo && typeof found.patientInfo !== "string"
                      ? found.patientInfo
                      : typeof found.patientId !== "string"
                      ? found.patientId
                      : undefined
                  ) as
                    | { name?: string; phone?: string; email?: string }
                    | undefined;
                  if (p && (p.phone || p.email || p.name))
                    setOverridePatient(p);
                }
              } catch (err) {
                console.warn("Error extracting patient override:", err);
              }

              try {
                if (!overrideServiceLabel) {
                  let svc = null as string | null;

                  // First try to parse from note (like History.tsx)
                  const serviceFromNote = parseService(
                    (found as AppointmentObj)?.note
                  );
                  if (serviceFromNote) {
                    svc = serviceFromNote;
                  } else if (
                    found.service &&
                    typeof found.service !== "string"
                  ) {
                    const sObj = found.service as {
                      name?: string;
                      label?: string;
                      type?: string;
                    };
                    svc = sObj.label || sObj.name || sObj.type || null;
                  }
                  if (!svc && found.serviceLabel) svc = found.serviceLabel;
                  if (!svc && found.serviceType) svc = found.serviceType;
                  if (svc) setOverrideServiceLabel(svc);
                }
              } catch (err) {
                console.warn("Error extracting service override:", err);
              }
            }
          }
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    appointment?._id,
    user?._id,
    finalSchedule,
    overridePatient,
    overrideServiceLabel,
  ]);

  const renderSchedule =
    overrideSchedule ||
    (finalSchedule && Object.keys(finalSchedule).length
      ? finalSchedule
      : schedule);

  // Extract specialty and status information
  const doctorSpecialty = getDoctorSpecialty(appointment);
  const appointmentStatus = statusLabel(appointment?.status as string);

  // Format invoice status for display
  const formatInvoiceStatus = (status?: string | null) => {
    if (!status) return "Chưa có hóa đơn";
    const map: Record<string, string> = {
      pending: "Chờ thanh toán",
      authorized: "Đã ủy quyền",
      captured: "Đã thanh toán",
      refunded: "Đã hoàn tiền",
      failed: "Thanh toán thất bại",
    };
    return map[status] || status;
  };

  // Early-return UIs (placed after hooks/computations so hook order is stable)
  if (!appointmentId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded shadow">
          <h3 className="text-lg font-semibold">Không có mã lịch hẹn</h3>
          <p className="text-sm text-gray-600 mt-2">Vui lòng thử lại.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Đang tải phiếu khám...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded shadow">
          <h3 className="text-lg font-semibold">Lỗi khi tải phiếu khám</h3>
          <p className="text-sm text-gray-600 mt-2">
            {(error as Error).message || "Có lỗi xảy ra"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppointmentSlipView
        appointmentId={appointment?._id}
        clinicName={clinicName}
        clinicAddress={clinicAddress}
        patientName={overridePatient?.name ?? patientName}
        patientPhone={overridePatient?.phone ?? patientPhone}
        patientEmail={overridePatient?.email ?? patientEmail}
        doctorName={doctorName}
        doctorSpecialty={doctorSpecialty}
        appointmentStatus={appointmentStatus}
        schedule={renderSchedule}
        mode={mode}
        invoiceStatus={formatInvoiceStatus(invoice?.status)}
        invoiceAmount={invoice?.patientAmount ?? null}
        serviceLabel={
          overrideServiceLabel ??
          finalServiceLabel ??
          mapServiceLabel(serviceType)
        }
      />
      {/* Debug: show raw response when schedule or service missing */}
      {(!renderSchedule ||
        !renderSchedule.date ||
        finalServiceLabel === "-") && (
        <div className="container mx-auto px-4 mt-6">
          <details className="bg-white p-4 rounded shadow">
            <summary className="font-medium">
              Debug: Dữ liệu thô (mở để xem)
            </summary>
            <pre className="text-xs mt-3 max-h-80 overflow-auto">
              {JSON.stringify(ctx, null, 2)}
            </pre>
            <div className="text-xs text-gray-500 mt-2">
              Kiểm tra xem 'scheduleId'/'newScheduleId' có phải là object hay
              chỉ là id string, và trường 'service'/'serviceLabel' có tồn tại
              không.
            </div>
          </details>
        </div>
      )}
    </>
  );
}
