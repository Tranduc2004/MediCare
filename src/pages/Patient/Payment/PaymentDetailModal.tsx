import React, { useEffect, useState } from "react";
import { paymentApi } from "../../../api/paymentApi";
import { Download } from "lucide-react";

type Props = {
  appointmentId: string | null;
  paymentId?: string | null;
  open: boolean;
  onClose: () => void;
  onPaid?: () => void;
};

type Invoice = {
  _id: string;
  type?: string;
  patientAmount?: number;
  status?: string;
};

type PaymentRecord = {
  _id: string;
  description?: string;
  amount?: number;
  status?: string;
};

type DetailsResponse = {
  appointment?: { doctorId?: { name?: string }; status?: string } | null;
  invoices?: Invoice[];
  payments?: PaymentRecord[];
};

const PaymentDetailModal: React.FC<Props> = ({
  appointmentId,
  paymentId,
  open,
  onClose,
  onPaid,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DetailsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!open || !appointmentId) return;
    setLoading(true);
    setError(null);
    paymentApi
      .getDetails(appointmentId)
      .then((d) => setData(d as DetailsResponse))
      .catch((e: unknown) => {
        // safe error extraction without using `any`
        type AxLike = { response?: { data?: { message?: unknown } } };
        let msg = "Không tải được dữ liệu";
        if (e && typeof e === "object") {
          const ax = e as AxLike;
          if (
            ax.response &&
            ax.response.data &&
            typeof ax.response.data.message !== "undefined"
          ) {
            msg = String(ax.response.data.message);
          } else if (e instanceof Error && e.message) {
            msg = e.message;
          }
        } else if (e instanceof Error && e.message) {
          msg = e.message;
        }
        setError(String(msg));
      })
      .finally(() => setLoading(false));
  }, [open, appointmentId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold">Chi tiết thanh toán</h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
          >
            Đóng
          </button>
        </div>

        {loading && <div className="text-center py-8">Đang tải...</div>}

        {error && <div className="text-red-600">{error}</div>}

        {!loading && !error && data && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Thông tin lịch hẹn</h4>
              <div className="text-sm text-slate-600">
                Bác sĩ: {data.appointment?.doctorId?.name || "-"}
              </div>
              <div className="text-sm text-slate-600">
                Trạng thái: {data.appointment?.status || "-"}
              </div>
            </div>

            <div>
              <h4 className="font-medium">Hóa đơn</h4>
              {(!data.invoices || data.invoices.length === 0) && (
                <div className="text-sm text-slate-500">
                  Không tìm thấy hóa đơn
                </div>
              )}

              {data.invoices?.map((inv) => (
                <div key={inv._id} className="border rounded p-3 my-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{inv.type}</div>
                      <div className="text-sm text-slate-500">{inv._id}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {inv.patientAmount
                          ? inv.patientAmount.toLocaleString() + "đ"
                          : "-"}
                      </div>
                      <div className="text-xs text-slate-500">{inv.status}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    {inv.status === "pending" && (
                      <button
                        onClick={async () => {
                          setProcessing(true);
                          try {
                            await paymentApi.processPayment(
                              inv._id,
                              "card",
                              appointmentId || undefined
                            );
                            setTimeout(() => onPaid?.(), 200);
                          } catch (e: unknown) {
                            type AxLike = {
                              response?: { data?: { message?: unknown } };
                            };
                            let msg = "Thanh toán thất bại";
                            if (e && typeof e === "object") {
                              const ax = e as AxLike;
                              if (
                                ax.response &&
                                ax.response.data &&
                                typeof ax.response.data.message !== "undefined"
                              ) {
                                msg = String(ax.response.data.message);
                              } else if (e instanceof Error && e.message) {
                                msg = e.message;
                              }
                            } else if (e instanceof Error && e.message) {
                              msg = e.message;
                            }
                            alert("Thanh toán thất bại: " + String(msg));
                          } finally {
                            setProcessing(false);
                          }
                        }}
                        className="bg-teal-600 text-white px-4 py-2 rounded"
                        disabled={processing}
                      >
                        {processing ? "Đang xử lý..." : "Thanh toán"}
                      </button>
                    )}

                    {inv.status !== "pending" && (
                      <button className="inline-flex items-center gap-2 px-3 py-2 rounded border text-slate-700">
                        <Download className="h-4 w-4" /> Tải biên lai
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* show specific payment if paymentId given */}
            {paymentId && (
              <div>
                <h4 className="font-medium">Thanh toán</h4>
                {data.payments
                  ?.filter((p) => p._id === paymentId)
                  .map((p) => (
                    <div key={p._id} className="border rounded p-3 my-2">
                      <div className="flex justify-between">
                        <div>{p.description}</div>
                        <div className="font-semibold">
                          {p.amount ? p.amount.toLocaleString() + "đ" : "-"}
                        </div>
                      </div>
                      <div className="text-sm text-slate-500">{p.status}</div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 text-right">
          <button onClick={onClose} className="px-4 py-2 rounded border">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailModal;
