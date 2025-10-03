import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { usePayment } from "../../../contexts/PaymentContext";
import { paymentApi } from "../../../api/paymentApi";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const PaymentPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const {
    currentInvoice,
    isLoading,
    error,
    loadPaymentDetails,
    processPayment,
  } = usePayment();

  useEffect(() => {
    if (appointmentId) {
      loadPaymentDetails(appointmentId);
    }
  }, [appointmentId, loadPaymentDetails]);

  // support receipt view: ?view=receipt&paymentId=...
  const location = useLocation();
  const q = new URLSearchParams(location.search);
  const view = q.get("view");
  const receiptPaymentId = q.get("paymentId");

  type PaymentRecord = {
    _id: string;
    amount?: number;
    paymentMethod?: string;
    capturedAt?: string;
    createdAt?: string;
  } | null;
  const [receiptPayment, setReceiptPayment] = useState<PaymentRecord>(null);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    const loadReceipt = async () => {
      if (view === "receipt" && appointmentId && receiptPaymentId) {
        try {
          const resp = await paymentApi.getDetails(appointmentId);
          const payments: PaymentRecord[] = Array.isArray(resp.payments)
            ? resp.payments
            : [];
          const found =
            payments.find((p) => p?._id === receiptPaymentId) || null;
          if (mounted) setReceiptPayment(found);
        } catch {
          if (mounted) setReceiptPayment(null);
        }
      }
    };
    loadReceipt();
    return () => {
      mounted = false;
    };
  }, [view, appointmentId, receiptPaymentId]);

  // Hold countdown: fetch appointment holdExpiresAt and tick every second
  const [now, setNow] = useState<number>(Date.now());
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadHold = async () => {
      if (!appointmentId) return;
      try {
        const resp = await paymentApi.getDetails(appointmentId);
        const h = resp?.appointment?.holdExpiresAt
          ? new Date(resp.appointment.holdExpiresAt).getTime()
          : null;
        if (mounted) setHoldExpiresAt(h);
      } catch (err) {
        // non-fatal: leave holdExpiresAt null
        console.error("Could not load holdExpiresAt:", err);
      }
    };
    loadHold();
    return () => {
      mounted = false;
    };
  }, [appointmentId]);

  const holdRemainingMs = holdExpiresAt ? holdExpiresAt - now : null;
  const formatMs = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  const handlePayment = async (invoiceId: string) => {
    try {
      await processPayment(invoiceId, "card", appointmentId); // include appointmentId so server can validate
      setShowSuccess(true);
      // Không điều hướng tự động nữa. Người dùng sẽ bấm nút OK trong modal để chuyển qua phiếu khám.
    } catch {
      // Error already handled by context
    }
  };

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
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentInvoice) {
    // If user asked to view a receipt, show receipt details instead of 'no invoice'
    if (view === "receipt") {
      if (!receiptPayment) {
        return (
          <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
                <p>Không tìm thấy biên lai thanh toán</p>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-gray-50 py-8">
          {showSuccess && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-48 h-48">
                    <DotLottieReact
                      src="https://lottie.host/69533610-ec9e-4652-a9e0-eec5b360f37b/YNNU0BrBD8.lottie"
                      loop
                      autoplay
                    />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-green-700">
                  Thanh toán thành công
                </h2>
                <p className="mt-2 text-gray-600">
                  Cảm ơn bạn đã hoàn tất thanh toán. Thông tin hóa đơn đã được
                  cập nhật.
                </p>
                <button
                  onClick={() => {
                    try {
                      window.location.href = appointmentId
                        ? `/appointments/${appointmentId}/slip`
                        : "/appointments";
                    } catch {
                      // ignore
                    }
                  }}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                >
                  OK
                </button>
              </div>
            </div>
          )}
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold">Biên lai thanh toán</h3>
              <div className="mt-4">
                <div className="text-sm text-gray-600">
                  Mã giao dịch: {receiptPayment._id}
                </div>
                <div className="text-sm text-gray-600">
                  Số tiền: {receiptPayment.amount?.toLocaleString()}đ
                </div>
                <div className="text-sm text-gray-600">
                  Phương thức: {receiptPayment.paymentMethod}
                </div>
                <div className="text-sm text-gray-600">
                  Thời gian:{" "}
                  {(() => {
                    const d =
                      receiptPayment.capturedAt || receiptPayment.createdAt;
                    return d ? new Date(d).toLocaleString() : "-";
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
            <p>Không tìm thấy hóa đơn cần thanh toán</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Invoice Details */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">
                {currentInvoice.type === "consultation"
                  ? "Hóa đơn tạm ứng"
                  : "Hóa đơn quyết toán"}
              </h3>
              <p className="text-sm text-gray-500">
                {currentInvoice.dueDate &&
                  `Hạn thanh toán: ${new Date(
                    currentInvoice.dueDate
                  ).toLocaleString()}`}
                {/* show countdown if pending and we have a hold expiry */}
                {currentInvoice.status === "pending" &&
                  holdRemainingMs !== null && (
                    <div
                      className="mt-1 text-sm text-red-600 font-medium"
                      aria-live="polite"
                    >
                      Đếm ngược hạn thanh toán:{" "}
                      {formatMs(Math.max(0, holdRemainingMs))}
                    </div>
                  )}
              </p>
            </div>
            <div className="text-right">
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                ${
                  currentInvoice.status === "captured"
                    ? "bg-green-100 text-green-800"
                    : currentInvoice.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {currentInvoice.status === "captured"
                  ? "Đã thanh toán"
                  : currentInvoice.status === "pending"
                  ? "Chờ thanh toán"
                  : "Đã hủy"}
              </div>
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
                {currentInvoice.items.map((item, index) => (
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
              <span>{currentInvoice.subtotal.toLocaleString()}đ</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Bảo hiểm chi trả</span>
              <span>{currentInvoice.insuranceCoverage.toLocaleString()}đ</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Số tiền phải trả</span>
              <span>{currentInvoice.patientAmount.toLocaleString()}đ</span>
            </div>
          </div>

          {/* Payment Actions */}
          {currentInvoice.status === "pending" && (
            <div className="mt-6">
              {currentInvoice.patientAmount > 0 ? (
                <button
                  onClick={() => handlePayment(currentInvoice._id)}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50"
                  disabled={holdRemainingMs !== null && holdRemainingMs <= 0}
                >
                  {holdRemainingMs !== null && holdRemainingMs <= 0
                    ? "Hết thời gian"
                    : "Thanh toán ngay"}
                </button>
              ) : (
                <div className="w-full bg-green-50 border border-green-100 rounded-lg p-4 text-green-700 text-center">
                  Số tiền phải trả là 0₫ — không cần thanh toán
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
