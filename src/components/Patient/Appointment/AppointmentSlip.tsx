import ReactDOMServer from "react-dom/server";
import AppointmentSlipView from "./AppointmentSlipView";

type AppointmentShape = {
  _id: string;
  patientId?: { name?: string; phone?: string };
  doctorId?: { name?: string };
  scheduleId?: { date?: string; startTime?: string; endTime?: string } | null;
  schedule?: { date?: string; startTime?: string; endTime?: string } | null;
  slot?: { date?: string; startTime?: string; endTime?: string } | null;
  service?: { name?: string; label?: string } | string;
  clinicName?: string;
  clinicAddress?: string;
  serviceLabel?: string;
};

type Props = {
  appointment: AppointmentShape;
  clinicName?: string;
  clinicAddress?: string;
};

export default function AppointmentSlip({
  appointment,
  clinicName = "Phòng khám ABC",
  clinicAddress = "123 Đường XYZ, Quận 1, TP.HCM",
}: Props) {
  const print = () => {
    let serviceLabel: string | null = appointment.serviceLabel || null;
    if (
      !serviceLabel &&
      appointment.service &&
      typeof appointment.service !== "string"
    ) {
      const svc = appointment.service as { name?: string; label?: string };
      serviceLabel = svc.name || svc.label || null;
    }

    const schedule =
      appointment.scheduleId ||
      appointment.slot ||
      appointment.schedule ||
      null;

    const markup = ReactDOMServer.renderToStaticMarkup(
      <AppointmentSlipView
        appointmentId={appointment._id}
        clinicName={appointment.clinicName || clinicName}
        clinicAddress={appointment.clinicAddress || clinicAddress}
        patientName={appointment.patientId?.name}
        patientPhone={appointment.patientId?.phone}
        doctorName={appointment.doctorId?.name}
        schedule={schedule || null}
        serviceLabel={serviceLabel || null}
      />
    );

    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Phiếu khám - ${appointment._id}</title></head><body>${markup}</body></html>`;

    const w = window.open("", "_blank", "width=900,height=1000");
    if (!w)
      return alert(
        "Trình duyệt chặn pop-up. Vui lòng cho phép pop-up để in phiếu."
      );
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  return (
    <button
      onClick={print}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      In phiếu
    </button>
  );
}
