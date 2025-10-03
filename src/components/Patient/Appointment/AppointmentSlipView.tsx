type Schedule = { date?: string; startTime?: string; endTime?: string } | null;

type Props = {
  appointmentId?: string | null;
  clinicName?: string;
  clinicAddress?: string;
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  appointmentStatus?: string;
  schedule?: Schedule;
  mode?: string;
  invoiceStatus?: string | null;
  invoiceAmount?: number | null;
  serviceLabel?: string | null;
};

export default function AppointmentSlipView({
  appointmentId,
  clinicName = "Phòng khám trực tuyến",
  clinicAddress = "Địa chỉ phòng khám",
  patientName = "-",
  patientPhone = "",
  patientEmail = "",
  doctorName = "-",
  doctorSpecialty = "-",
  appointmentStatus = "-",
  schedule = null,
  mode = "offline",
  invoiceStatus = null,
  invoiceAmount = null,
  serviceLabel = null,
}: Props) {
  const formatDate = (d?: string) => {
    if (!d) return "--";
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return d;
    }
  };

  const formatRange = (s?: string | undefined, e?: string | undefined) => {
    if (!s || !e) return "--";
    return `${s} – ${e}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 print:p-0">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded shadow print:shadow-none">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">Phiếu khám</h2>
            <div className="text-sm text-gray-600">{clinicName}</div>
            <div className="text-sm text-gray-500 mt-1">{clinicAddress}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Mã lịch hẹn</div>
            <div className="font-mono font-semibold text-lg">
              {appointmentId}
            </div>
          </div>
        </div>

        <div className="border-t border-b border-gray-200 py-6 my-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Bệnh nhân</p>
              <p className="font-medium">{patientName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bác sĩ</p>
              <p className="font-medium">{doctorName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Dịch vụ</p>
              <p className="font-medium">{serviceLabel ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Chuyên khoa</p>
              <p className="font-medium">{doctorSpecialty}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Liên hệ</p>
              <p className="font-medium">{patientPhone || "-"}</p>
              {patientEmail && (
                <div className="text-sm text-gray-500">{patientEmail}</div>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Trạng thái</p>
              <p className="font-medium">{appointmentStatus}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ngày khám</p>
              <p className="font-medium">
                {formatDate(schedule?.date || undefined)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Thời gian</p>
              <p className="font-medium">
                {formatRange(schedule?.startTime, schedule?.endTime)}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          {mode === "online" ? (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded text-sm text-blue-800">
              Cuộc khám sẽ diễn ra trực tuyến. Link họp sẽ được gửi tới bạn
              trước giờ khám.
            </div>
          ) : (
            <div className="bg-green-50 border border-green-100 p-4 rounded text-sm text-green-800">
              Vui lòng đến đúng giờ tại: <strong>{clinicAddress}</strong>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Trạng thái thanh toán</div>
          <div className="text-right">
            <div className="font-semibold">{invoiceStatus ?? "N/A"}</div>
            {invoiceAmount != null && (
              <div className="text-sm text-gray-500">
                Số tiền: {invoiceAmount.toLocaleString()}đ
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-3 print:hidden">
          <button
            onClick={() => window.print()}
            className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-4 py-2 rounded"
          >
            In phiếu khám
          </button>
          <button
            onClick={() => window.history.back()}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-4 py-2 rounded"
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}
