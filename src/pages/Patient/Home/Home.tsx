import HeroBanner from "../../../components/Patient/Home/HeroBanner";
import ServiceSection from "../../../components/Patient/Home/ServiceSection";
import DoctorSection from "../../../components/Patient/Home/DoctorSection";
import AppointmentSection from "../../../components/Patient/Home/AppointmentSection";
import TestimonialSection from "../../../components/Patient/Home/TestimonialSection";
import FaqSection from "../../../components/Patient/Home/FaqSection";
import FloatingChatWidget from "../../../components/Patient/Home/FloatingChatWidget";

// Component chính cho trang chủ
export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-grow">
        <HeroBanner />
        <ServiceSection />
        <DoctorSection />
        <AppointmentSection />
        <TestimonialSection />
        <FaqSection />
        {/* Gợi ý: thêm đường dẫn hồ sơ/BHYT tại đây hoặc trong Header */}
        <FloatingChatWidget />
      </main>
    </div>
  );
}
