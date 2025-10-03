import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download } from "lucide-react";
import { paymentApi } from "../../../api/paymentApi";
import PaymentDetailModal from "./PaymentDetailModal";

type PaymentStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "refunded"
  | "failed";

type PaymentRow = {
  _id: string;
  appointmentId?: { _id: string; doctorId?: unknown } | string | null;
  doctorId?: unknown;
  amount: number;
  description: string;
  status: PaymentStatus;
  createdAt: string;
};

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    n
  );

const StatusPill: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const map: Record<PaymentStatus, { text: string; cls: string }> = {
    captured: {
      text: "Đã thanh toán",
      cls: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    },
    pending: {
      text: "Chờ thanh toán",
      cls: "bg-amber-100 text-amber-900 border border-amber-200",
    },
    authorized: {
      text: "Đã ủy quyền",
      cls: "bg-blue-100 text-blue-800 border border-blue-200",
    },
    refunded: {
      text: "Đã hoàn tiền",
      cls: "bg-slate-100 text-slate-800 border border-slate-200",
    },
    failed: {
      text: "Thất bại",
      cls: "bg-rose-100 text-rose-800 border border-rose-200",
    },
  };

  return (
    <span
      className={
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium " +
        map[status].cls
      }
    >
      {map[status].text}
    </span>
  );
};

const RowSkeleton: React.FC = () => (
  <tr>
    <td className="px-6 py-4">
      <div className="h-4 w-24 bg-slate-200 rounded" />
    </td>
    <td className="px-6 py-4">
      <div className="h-5 w-48 bg-slate-200 rounded" />
      <div className="h-3 w-32 bg-slate-100 rounded mt-2" />
    </td>
    <td className="px-6 py-4">
      <div className="h-5 w-28 bg-slate-200 rounded" />
      <div className="h-3 w-20 bg-slate-100 rounded mt-2" />
    </td>
    <td className="px-6 py-4 text-right">
      <div className="h-4 w-24 bg-slate-200 rounded ml-auto" />
    </td>
    <td className="px-6 py-4">
      <div className="h-6 w-28 bg-slate-200 rounded-full" />
    </td>
    <td className="px-6 py-4">
      <div className="h-6 w-20 bg-slate-200 rounded" />
    </td>
  </tr>
);

const PaymentHistory: React.FC = () => {
  const { data: payments, isLoading } = useQuery<PaymentRow[]>({
    queryKey: ["payments"],
    queryFn: paymentApi.getHistory,
  });

  const [selectedAppointmentId, setSelectedAppointmentId] = React.useState<
    string | null
  >(null);
  const [selectedPaymentId, setSelectedPaymentId] = React.useState<
    string | null
  >(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  type DoctorShape = { name?: string; specialty?: string };

  const getDoctorInfo = (p: PaymentRow) => {
    const fromPayment =
      p.doctorId && typeof p.doctorId === "object"
        ? (p.doctorId as DoctorShape)
        : undefined;
    const appt =
      p.appointmentId && typeof p.appointmentId === "object"
        ? (p.appointmentId as { doctorId?: unknown })
        : undefined;
    const fromAppt =
      appt && appt.doctorId && typeof appt.doctorId === "object"
        ? (appt.doctorId as DoctorShape)
        : undefined;

    const doc: DoctorShape = { ...(fromPayment || {}), ...(fromAppt || {}) };
    return { name: doc?.name || "-", specialty: doc?.specialty || "" };
  };

  const rows = useMemo(() => payments || [], [payments]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-teal-500 p-6">
              <h2 className="text-2xl font-bold text-white">
                Lịch sử thanh toán
              </h2>
              <p className="text-white/80 mt-1">Xem tất cả giao dịch của bạn</p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-6 py-3 text-slate-600 font-semibold">
                      Mã GD
                    </th>
                    <th className="px-6 py-3 text-slate-600 font-semibold">
                      Thông tin
                    </th>
                    <th className="px-6 py-3 text-slate-600 font-semibold">
                      Bác sĩ
                    </th>
                    <th className="px-6 py-3 text-slate-600 font-semibold text-right">
                      Số tiền
                    </th>
                    <th className="px-6 py-3 text-slate-600 font-semibold">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-slate-600 font-semibold">
                      Thao tác
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {isLoading &&
                    Array.from({ length: 6 }).map((_, i) => (
                      <RowSkeleton key={i} />
                    ))}

                  {!isLoading &&
                    rows.map((p) => {
                      const doc = getDoctorInfo(p);
                      return (
                        <tr
                          key={p._id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                              {p._id.slice(-10).toUpperCase()}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-900">
                              {p.description}
                            </div>
                            <div className="text-xs text-slate-500">
                              {new Date(p.createdAt).toLocaleString()}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-900">
                              {doc.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {doc.specialty}
                            </div>
                          </td>

                          <td className="px-6 py-4 text-right font-semibold text-emerald-600">
                            {formatVND(p.amount)}
                          </td>

                          <td className="px-6 py-4">
                            <StatusPill status={p.status} />
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  // appointmentId can be either object or string
                                  const apptId =
                                    p.appointmentId &&
                                    typeof p.appointmentId === "object"
                                      ? (p.appointmentId as { _id: string })._id
                                      : (p.appointmentId as string | undefined);
                                  setSelectedAppointmentId(apptId || null);
                                  setSelectedPaymentId(
                                    p.status === "pending" ? null : p._id
                                  );
                                  setModalOpen(true);
                                }}
                                className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-teal-700 hover:bg-teal-50 hover:text-teal-800 transition-colors"
                                title={
                                  p.status === "pending"
                                    ? "Xem chi tiết"
                                    : "Xem biên lai"
                                }
                              >
                                <FileText className="h-5 w-5" />
                              </button>

                              {p.status === "captured" && (
                                <button
                                  className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-teal-700 hover:bg-teal-50 hover:text-teal-800 transition-colors"
                                  title="Tải hóa đơn"
                                >
                                  <Download className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Empty state */}
            {!isLoading && rows.length === 0 && (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-blue-100 p-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-teal-100 border border-blue-200 mx-auto flex items-center justify-center mb-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Chưa có giao dịch
                  </h3>
                  <p className="text-slate-600 mt-1">
                    Các giao dịch thanh toán của bạn sẽ hiển thị tại đây khi
                    hoàn tất.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <PaymentDetailModal
        appointmentId={selectedAppointmentId}
        paymentId={selectedPaymentId}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onPaid={() => setModalOpen(false)}
      />
    </>
  );
};

export default PaymentHistory;
