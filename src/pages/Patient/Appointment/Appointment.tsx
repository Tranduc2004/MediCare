import BookingForm from "./BookingForm.tsx";

export default function AppointmentPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-grow">
        <BookingForm />
      </main>
    </div>
  );
}
