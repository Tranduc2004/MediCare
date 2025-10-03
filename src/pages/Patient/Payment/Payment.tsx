import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../../../api/axiosConfig";
import { paymentApi } from "../../../api/paymentApi";
import { specialtyApi, ISpecialty } from "../../../api/specialtyApi";
import ExpiryCountdown from "../../../components/ExpiryCountdown/ExpiryCountdown";
// NOTE: avoid importing shared types here to keep this component resilient in editor environments

type PaymentStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "refunded"
  | "failed";

type PaymentType =
  | "consultation_fee"
  | "deposit"
  | "additional_services"
  | "medication"
  | "final_settlement";

type PaymentItem = {
  type: PaymentType;
  description: string;
  amount: number;
  insuranceCoverage?: string;
  insuranceAmount?: number;
  patientAmount: number;
};

type Invoice = {
  _id: string;
  appointmentId: string;
  type: "consultation" | "final_settlement";
  items: PaymentItem[];
  subtotal: number;
  insuranceCoverage: number;
  patientAmount: number;
  status: PaymentStatus;
  dueDate?: string;
  paidAt?: string;
};

const PaymentPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  // Helper: appointment.doctorId can be either populated object or a string id.
  const getDoctorName = (appt: unknown) => {
    if (!appt || typeof appt !== "object") return "-";
    const ap = appt as Record<string, unknown>;
    const doc = ap["doctorId"];
    if (!doc || typeof doc === "string") return "-";
    const d = doc as Record<string, unknown>;
    return typeof d["name"] === "string" ? (d["name"] as string) : "-";
  };

  // Load specialties once so we can map specialty ids -> human names
  const [specialties, setSpecialties] = useState<ISpecialty[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const list = await specialtyApi.getActiveSpecialties();
        setSpecialties(list || []);
      } catch (err) {
        // non-critical UI enhancement, log but don't block
        console.error("Không thể tải chuyên khoa:", err);
      }
    })();
  }, []);

  // Small typing for the payment status API result
  interface AppointmentLite {
    holdExpiresAt?: string;
    patientId?: { name?: string } | string | null;
    status?: string | null;
    [key: string]: unknown;
  }
  interface PaymentFetchResult {
    appointment?: AppointmentLite;
    invoices?: Invoice[];
    payments?: unknown[];
  }

  // Hold countdown: update every second (hook must run unconditionally)
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

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
  // Fetch payment status and details
  const {
    data: paymentData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["paymentStatus", appointmentId],
    queryFn: async () => {
      try {
        console.log("Đang gọi API với appointmentId:", appointmentId);
        const response = await api.get(
          `/patient/payments/status/${appointmentId}`
        );
        console.log("Kết quả API:", response.data);
        return response.data;
      } catch (err) {
        const error = err as { response?: { data?: { message?: string } } };
        console.error("Lỗi API:", error.response?.data || err);
        throw new Error(
          error.response?.data?.message || "Lỗi tải thông tin thanh toán"
        );
      }
    },
    // disable automatic retry to avoid repeated error toasts in UI
    retry: 0,
  });

  type ProcessPaymentResponse = {
    success: boolean;
    message: string;
    transactionId: string;
  };

  type ProcessPaymentVariables = {
    invoiceId: string;
    paymentMethod: string;
  };

  // Process payment mutation
  const processPayment = useMutation<
    ProcessPaymentResponse,
    Error,
    ProcessPaymentVariables
  >({
    mutationFn: async ({ invoiceId, paymentMethod }) => {
      try {
        const response = await paymentApi.processPayment(
          invoiceId,
          paymentMethod,
          appointmentId
        );
        return response;
      } catch (error) {
        const e = error as unknown;
        const resp = (e as { response?: { data?: { message?: string } } })
          .response?.data;
        const msg = resp?.message || "Lỗi xử lý thanh toán";
        console.error("Payment error:", resp || e);
        throw new Error(msg);
      }
    },
  });

  const handlePayment = async (invoice: Invoice) => {
    // Block payment if hold expired
    if (holdRemainingMs !== null && holdRemainingMs <= 0) {
      // Attempt to refresh server state (server may mark appointment as overdue)
      try {
        await refetch?.();
      } catch {
        // ignore refresh errors
      }
      // Inform user and prevent payment
      // show friendly message and navigate away after short delay
      alert(
        "Bạn đã quá hạn thanh toán. Vui lòng đặt lại lịch hoặc liên hệ hỗ trợ."
      );
      // redirect to home (or appointment list) to avoid staying on payment page
      window.location.href = "/";
      // Optionally, if server updated status we still return to avoid calling payment API
      return;
    }
    try {
      const resp = await paymentApi.processPayment(
        invoice._id,
        "card",
        appointmentId
      );
      if (resp && resp.payment) {
        alert("Thanh toán thành công");
        // refresh to show updated status
        await refetch?.();
        try {
          // navigate to printable slip page
          window.location.href = `/appointments/${appointmentId}/slip`;
        } catch {
          // ignore
        }
      } else {
        throw new Error(resp?.message || "Thanh toán thất bại");
      }
    } catch (error) {
      // detect 400 Bad Request coming from server (hold expired)
      const e = error as unknown;
      const serverStatus = (e as { response?: { status?: number } })?.response
        ?.status;
      const serverMsg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      if (serverStatus === 400) {
        // treat as expired/invalid payment window
        alert(serverMsg || "Bạn đã quá hạn thanh toán. Vui lòng đặt lại lịch.");
        // redirect away to avoid retries
        window.location.href = "/";
        return;
      }

      alert(
        "Lỗi thanh toán: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  };
  // ----- derive appointment/invoice state early so hooks and effects below run consistently -----
  const { appointment, invoices } = (paymentData || {}) as PaymentFetchResult;

  // helpers to safely extract fields from loosely-typed appointment
  const getPatientName = (appt?: AppointmentLite) => {
    if (!appt) return "-";
    const p = appt.patientId;
    if (!p) return "-";
    if (typeof p === "string") return p;
    return p.name || "-";
  };

  const getApptStatus = (appt?: AppointmentLite) => {
    const s = appt?.status;
    return typeof s === "string" ? s : s ? String(s) : undefined;
  };

  // compute hold expiry info (used by effect below)
  const holdExpiresAt = appointment?.holdExpiresAt
    ? new Date(appointment.holdExpiresAt).getTime()
    : null;
  const holdRemainingMs = holdExpiresAt ? holdExpiresAt - now : null;

  // Consider appointment-level overdue as authoritative: either server set status
  // to payment_overdue or the local hold timer expired.
  const apptStatus = getApptStatus(appointment);
  const isOverdue =
    apptStatus === "payment_overdue" ||
    (holdExpiresAt && holdRemainingMs !== null && holdRemainingMs <= 0);

  // (formatting moved to ExpiryCountdown component)

  // If hold expired, refresh the page so server lazy cleanup runs and UI updates.
  useEffect(() => {
    if (holdExpiresAt && holdRemainingMs !== null && holdRemainingMs <= 0) {
      window.location.reload();
    }
    // we intentionally depend on holdRemainingMs and holdExpiresAt
  }, [holdRemainingMs, holdExpiresAt]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin thanh toán...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p>{error instanceof Error ? error.message : "Có lỗi xảy ra"}</p>
          </div>
        </div>
      </div>
    );
  }

  // Kiểm tra nếu không có hóa đơn hoặc hóa đơn rỗng
  if (!invoices || invoices.length === 0) {
    // Render appointment info so 'Xem chi tiết' shows a meaningful detail
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Appointment Info */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Thông tin lịch hẹn</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Bệnh nhân</p>
                <p className="font-medium">{getPatientName(appointment)}</p>
              </div>
              <div>
                <p className="text-gray-600">Bác sĩ</p>
                <p className="font-medium">{getDoctorName(appointment)}</p>
              </div>
              <div>
                <p className="text-gray-600">Chuyên khoa</p>
                <p className="font-medium">{getDoctorSpecialty(appointment)}</p>
              </div>
              <div>
                <p className="text-gray-600">Trạng thái</p>
                <p className="font-medium">
                  {statusLabel(getApptStatus(appointment))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Chưa có hóa đơn
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Không tìm thấy hóa đơn cần thanh toán cho cuộc hẹn này.
                {appointment?.status === "booked" &&
                  " Vui lòng đợi bác sĩ xác nhận cuộc hẹn."}
                {appointment?.status === "doctor_approved" &&
                  " Hệ thống đang tạo hóa đơn, vui lòng thử lại sau vài giây."}
                {appointment?.status === "paid" &&
                  " Cuộc hẹn này đã được thanh toán."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Appointment Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Thông tin lịch hẹn</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Bệnh nhân</p>
              <p className="font-medium">{getPatientName(appointment)}</p>
            </div>
            <div>
              <p className="text-gray-600">Bác sĩ</p>
              <p className="font-medium">{getDoctorName(appointment)}</p>
            </div>
            <div>
              <p className="text-gray-600">Chuyên khoa</p>
              <p className="font-medium">{getDoctorSpecialty(appointment)}</p>
            </div>
            <div>
              <p className="text-gray-600">Trạng thái</p>
              <p className="font-medium">
                {statusLabel(getApptStatus(appointment))}
              </p>
            </div>
          </div>
        </div>

        {/* Invoices */}
        <div className="space-y-6">
          {/* Prominent countdown: show while a hold exists and time remains */}
          {holdExpiresAt && holdRemainingMs !== null && holdRemainingMs > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-yellow-800 font-medium">
                  Vui lòng hoàn tất thanh toán trong
                </div>
                <div className="mt-1 text-2xl font-semibold text-yellow-900">
                  <ExpiryCountdown
                    expiresAt={appointment?.holdExpiresAt}
                    prefix="Còn"
                    onExpire={() => refetch?.()}
                  />
                </div>
              </div>
              <div className="text-sm text-yellow-700">
                Thời gian giữ chỗ còn lại
              </div>
            </div>
          )}
          {/* Overdue banner when server or local expiry indicates overdue */}
          {isOverdue && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-700 font-semibold">
                Hết thời gian thanh toán
              </div>
              <div className="text-sm text-red-600">
                Thời gian 10 phút để hoàn tất thanh toán đã kết thúc. Đơn đặt
                của bạn đã được đánh dấu là "Quá hạn thanh toán".
              </div>
            </div>
          )}

          {invoices?.map((invoice: Invoice) => (
            <div
              key={invoice._id}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {invoice.type === "consultation"
                      ? "Hóa đơn tạm ứng"
                      : "Hóa đơn quyết toán"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {invoice.dueDate &&
                      `Hạn thanh toán: ${new Date(
                        invoice.dueDate
                      ).toLocaleString()}`}
                    {/* show countdown if pending and we have a hold expiry */}
                    {invoice.status === "pending" &&
                      holdRemainingMs !== null &&
                      holdRemainingMs > 0 && (
                        <div className="mt-1 text-sm text-red-600 font-medium">
                          Thời gian thanh toán còn lại:{" "}
                          <ExpiryCountdown
                            expiresAt={appointment?.holdExpiresAt}
                            prefix=""
                            className="inline-block"
                          />
                        </div>
                      )}
                  </p>
                </div>
                <div className="text-right">
                  {(() => {
                    const mergedStatus = isOverdue
                      ? "payment_overdue"
                      : invoice.status;
                    const cls =
                      mergedStatus === "captured"
                        ? "bg-green-100 text-green-800"
                        : mergedStatus === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : mergedStatus === "authorized"
                        ? "bg-indigo-100 text-indigo-800"
                        : mergedStatus === "refunded"
                        ? "bg-blue-100 text-blue-800"
                        : mergedStatus === "failed"
                        ? "bg-red-100 text-red-800"
                        : mergedStatus === "payment_overdue"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800";
                    const label =
                      mergedStatus === "captured"
                        ? "Đã thanh toán"
                        : mergedStatus === "pending"
                        ? "Chờ thanh toán"
                        : mergedStatus === "authorized"
                        ? "Giữ tiền"
                        : mergedStatus === "refunded"
                        ? "Đã hoàn tiền"
                        : mergedStatus === "failed"
                        ? "Lỗi thanh toán"
                        : mergedStatus === "payment_overdue"
                        ? "Quá hạn thanh toán"
                        : "Trạng thái";
                    return (
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${cls}`}
                      >
                        {label}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Invoice Items */}
              <div className="border-t border-b border-gray-200 py-4 my-4">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="pb-2">Dịch vụ</th>
                      <th className="pb-2 text-right">Số tiền</th>
                      <th className="pb-2 text-right">Bảo hiểm</th>
                      <th className="pb-2 text-right">Phải trả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={index}>
                        <td className="py-2">{item.description}</td>
                        <td className="py-2 text-right">
                          {item.amount.toLocaleString()}đ
                        </td>
                        <td className="py-2 text-right">
                          {(item.insuranceAmount || 0).toLocaleString()}đ
                        </td>
                        <td className="py-2 text-right">
                          {item.patientAmount.toLocaleString()}đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Invoice Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Tổng cộng</span>
                  <span>{invoice.subtotal.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Bảo hiểm chi trả</span>
                  <span>{invoice.insuranceCoverage.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Số tiền phải trả</span>
                  <span>{invoice.patientAmount.toLocaleString()}đ</span>
                </div>
              </div>

              {/* Payment Actions (merged with appointment-level overdue) */}
              {(() => {
                const mergedStatus = isOverdue
                  ? "payment_overdue"
                  : invoice.status;
                if (mergedStatus !== "pending") return null;
                return (
                  <div className="mt-6">
                    {invoice.patientAmount > 0 ? (
                      // Only allow clicking while hold is active (or when server didn't provide holdExpiresAt)
                      holdRemainingMs === null || holdRemainingMs > 0 ? (
                        <button
                          onClick={() => handlePayment(invoice)}
                          disabled={processPayment.isPending || !!isOverdue}
                          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50"
                        >
                          {processPayment.isPending
                            ? "Đang xử lý..."
                            : "Thanh toán ngay"}
                        </button>
                      ) : (
                        <div className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-red-700">
                          Đã quá thời gian thanh toán
                        </div>
                      )
                    ) : (
                      <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-center text-gray-600">
                        Số tiền phải trả là 0đ — không cần thanh toán
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
