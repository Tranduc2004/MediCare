import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useEffect } from "react";
import { PaymentProvider } from "./contexts/PaymentContext";
import AuthContainer from "./components/Patient/Auth/AuthContainer";
import Home from "./pages/Patient/Home/Home";
import { Payment, PaymentHistory } from "./pages/Patient/Payment";
import Header from "./components/Patient/Header/Header";
import Footer from "./components/Patient/Footer/Footer";
import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AppointmentPage from "./pages/Patient/Appointment/Appointment";
import AppointmentHistoryPage from "./pages/Patient/Appointment/History";
import AppointmentSlipPage from "./pages/Patient/Appointment/Slip";
import DoctorsPage from "./pages/Patient/DoctorInfo/Doctors";
import DoctorDetailPage from "./pages/Patient/DoctorInfo/DoctorDetail";
import PatientChatPage from "./pages/Patient/Chat/Chat";
import PatientProfilePage from "./pages/Patient/Profile/Profile";
import NotificationsPage from "./pages/Patient/Notifications/Notifications";

//Doctor
import LoginDoctor from "./pages/Doctor/Login/Login";
import RegisterDoctor from "./pages/Doctor/Register/Register";
import DoctorDashboard from "./pages/Doctor/Home/Home";
import DoctorSchedulePage from "./pages/Doctor/Schedule/Schedule";
import DoctorAppointmentsPage from "./pages/Doctor/Appointments/Appointments";
import DoctorProfilePage from "./pages/Doctor/Profile/Profile";
import DoctorMessagesPage from "./pages/Doctor/Messages/Messages";
import MedicalRecordsPage from "./pages/Doctor/MedicalRecords/MedicalRecords";
import ProtectedRoute from "./components/Patient/Auth/ProtectedRoute";
import DoctorLayout from "./components/Doctor/Layout/DoctorLayout";
import GlobalChatNotifier from "./components/Doctor/Chat/GlobalChatNotifier";
import ErrorBoundary from "./components/ErrorBoundary";

//Patient
import ForgotPasswordPage from "./pages/Patient/Auth/ForgotPassword";
import ResetPasswordPage from "./pages/Patient/Auth/ResetPassword";

//Services and Specialties
import ServicesPage from "./pages/Patient/Services/ServicesPage";
import ServiceDetailPage from "./pages/Patient/Services/ServiceDetailPage";
import SpecialtiesPage from "./pages/Patient/Specialties/SpecialtiesPage";
import SpecialtyDetailPage from "./pages/Patient/Specialties/SpecialtyDetailPage";

function PrivateRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactElement;
  allowedRoles: string[];
}) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      // Lưu URL hiện tại để sau khi đăng nhập chuyển về
      localStorage.setItem("redirectAfterLogin", location.pathname);

      // Xác định trang đăng nhập dựa trên route
      const isDoctor = location.pathname.startsWith("/doctor");
      const loginPath = isDoctor ? "/doctor/login" : "/login";

      navigate(loginPath, { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  // Nếu chưa xác thực, return null để tránh flash content
  if (!isAuthenticated) {
    return null;
  }

  // Kiểm tra role và chuyển hướng nếu không có quyền truy cập
  if (!allowedRoles.includes(user?.role || "")) {
    // Chuyển hướng đến trang dashboard tương ứng với role
    if (user?.role === "doctor") {
      return <Navigate to="/doctor" replace />;
    } else if (user?.role === "patient") {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

function AppContent() {
  const location = useLocation();
  const isPatientPage =
    location.pathname === "/" ||
    location.pathname === "/appointment" ||
    location.pathname === "/appointments/my" ||
    location.pathname === "/chat" ||
    location.pathname === "/profile" ||
    location.pathname === "/payments/history" ||
    location.pathname.startsWith("/payments/") ||
    location.pathname === "/notifications" ||
    location.pathname.startsWith("/services") ||
    location.pathname.startsWith("/specialties") ||
    location.pathname.startsWith("/alldoctors");

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/doctor/login" ||
    location.pathname === "/doctor/register" ||
    location.pathname === "/forgot-password" ||
    location.pathname.startsWith("/reset-password");

  return (
    <div className="App">
      <ToastContainer position="top-right" autoClose={2500} />
      <GlobalChatNotifier />
      {isPatientPage && !isAuthPage && <Header />}
      <Routes>
        {/* Doctor Routes */}
        <Route path="/doctor/login" element={<LoginDoctor />} />
        <Route path="/doctor/register" element={<RegisterDoctor />} />
        <Route element={<ProtectedRoute />}>
          <Route
            path="/doctor"
            element={
              <PrivateRoute allowedRoles={["doctor"]}>
                <DoctorLayout>
                  <DoctorDashboard />
                </DoctorLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/doctor/home"
            element={
              <PrivateRoute allowedRoles={["doctor"]}>
                <DoctorLayout>
                  <DoctorDashboard />
                </DoctorLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/doctor/schedule"
            element={
              <PrivateRoute allowedRoles={["doctor"]}>
                <DoctorLayout>
                  <DoctorSchedulePage />
                </DoctorLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/doctor/patients"
            element={
              <PrivateRoute allowedRoles={["doctor"]}>
                <DoctorLayout>
                  <div className="p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">
                      Quản lý bệnh nhân
                    </h1>
                    <p className="text-gray-600">
                      Trang quản lý bệnh nhân đang được phát triển...
                    </p>
                  </div>
                </DoctorLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/doctor/medical-records"
            element={
              <PrivateRoute allowedRoles={["doctor"]}>
                <DoctorLayout>
                  <MedicalRecordsPage />
                </DoctorLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/doctor/appointments"
            element={
              <PrivateRoute allowedRoles={["doctor"]}>
                <DoctorLayout>
                  <DoctorAppointmentsPage />
                </DoctorLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/doctor/messages"
            element={
              <PrivateRoute allowedRoles={["doctor"]}>
                <DoctorLayout>
                  <DoctorMessagesPage />
                </DoctorLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/doctor/settings"
            element={
              <PrivateRoute allowedRoles={["doctor"]}>
                <DoctorLayout>
                  <div className="p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">
                      Cài đặt
                    </h1>
                    <p className="text-gray-600">
                      Trang cài đặt đang được phát triển...
                    </p>
                  </div>
                </DoctorLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/doctor/profile"
            element={
              <PrivateRoute allowedRoles={["doctor"]}>
                <DoctorLayout>
                  <DoctorProfilePage />
                </DoctorLayout>
              </PrivateRoute>
            }
          />
        </Route>

        {/* Patient Routes */}
        <Route path="/login" element={<AuthContainer />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/appointment"
          element={
            <PrivateRoute allowedRoles={["patient"]}>
              <AppointmentPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <PrivateRoute allowedRoles={["patient"]}>
              <NotificationsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/appointments/my"
          element={
            <PrivateRoute allowedRoles={["patient"]}>
              <AppointmentHistoryPage />
            </PrivateRoute>
          }
        />

        {/* Payment Routes */}
        <Route
          path="/payments/history"
          element={
            <PrivateRoute allowedRoles={["patient"]}>
              <PaymentHistory />
            </PrivateRoute>
          }
        />
        <Route
          path="/payments/:appointmentId"
          element={
            <PrivateRoute allowedRoles={["patient"]}>
              <Payment />
            </PrivateRoute>
          }
        />
        <Route
          path="/appointments/:appointmentId/slip"
          element={
            <PrivateRoute allowedRoles={["patient"]}>
              <AppointmentSlipPage />
            </PrivateRoute>
          }
        />

        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/alldoctors" element={<DoctorsPage />} />
        <Route path="/alldoctors/:id" element={<DoctorDetailPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/:id" element={<ServiceDetailPage />} />
        <Route path="/specialties" element={<SpecialtiesPage />} />
        <Route path="/specialties/:id" element={<SpecialtyDetailPage />} />
        <Route
          path="/chat"
          element={
            <PrivateRoute allowedRoles={["patient"]}>
              <PatientChatPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute allowedRoles={["patient"]}>
              <PatientProfilePage />
            </PrivateRoute>
          }
        />
      </Routes>
      {isPatientPage && !isAuthPage && <Footer />}
    </div>
  );
}

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PaymentProvider>
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </PaymentProvider>
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;
