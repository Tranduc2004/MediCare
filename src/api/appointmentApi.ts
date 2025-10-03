import axios from "axios";
import { Schedule, Appointment, ApiResponse } from "../types/api";

const BASE_URL = "https://server-medicare.onrender.com/api";

// Add error handling interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ERR_NETWORK") {
      console.error("Network error - Backend server may be down");
      // Optional: Show user-friendly message
      // toast.error("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
    }
    return Promise.reject(error);
  }
);

interface CreateAppointmentData {
  patientId: string;
  doctorId: string;
  scheduleId: string;
  symptoms?: string;
  note?: string;
  appointmentTime?: string;
  mode?: "online" | "offline";
}

interface CreateAppointmentResponse {
  success?: boolean;
  data?: Appointment;
  message?: string;
  holdExpiresAt?: string | Date;
}

export const getDoctorSchedules = (doctorId: string): Promise<Schedule[]> =>
  axios
    .get<Schedule[]>(`${BASE_URL}/doctor/schedule/${doctorId}/schedules`)
    .then((r) => r.data);

export const createAppointment = (
  data: CreateAppointmentData
): Promise<CreateAppointmentResponse> =>
  // Return the full server response so callers can access holdExpiresAt and message
  axios
    .post<CreateAppointmentResponse>(`${BASE_URL}/patient/appointments`, data)
    .then((r) => r.data);

export const getMyAppointments = async (
  patientId: string
): Promise<Appointment[]> => {
  if (!patientId) return [];

  try {
    const response = await axios.get<ApiResponse<Appointment[]>>(
      `${BASE_URL}/patient/appointments`,
      {
        params: { patientId },
        timeout: 5000,
      }
    );

    const appointments = response.data?.data || [];
    return appointments;
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }
};

export const getMyAppointmentHistory = (patientId: string) =>
  axios
    .get(`${BASE_URL}/patient/appointments/history`, { params: { patientId } })
    .then((r) => r.data);

// Profile APIs
export const getMyProfile = (patientId: string) =>
  axios
    .get(`${BASE_URL}/patient/profile/profile`, { params: { patientId } })
    .then((r) => r.data);

export const saveMyProfile = (
  patientId: string,
  profile: Record<string, unknown>
) =>
  axios
    .put(`${BASE_URL}/patient/profile/profile`, { patientId, profile })
    .then((r) => r.data);

export const saveMyInsurance = (
  patientId: string,
  insurance: Record<string, unknown>
) =>
  axios
    .put(`${BASE_URL}/patient/profile/insurance`, { patientId, insurance })
    .then((r) => r.data);

// Doctor APIs
export const getAppointmentsByDoctor = async (
  doctorId: string
): Promise<Appointment[]> => {
  if (!doctorId) return [];

  try {
    const response = await axios.get<Appointment[]>(
      `${BASE_URL}/doctor/appointments`,
      {
        params: { doctorId },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        timeout: 5000,
      }
    );

    return response.data || [];
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    return [];
  }
};
