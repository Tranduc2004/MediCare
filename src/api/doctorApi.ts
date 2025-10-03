import axios from "axios";

const API_URL = "https://server-medicare.onrender.com/api";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token =
    sessionStorage.getItem("doctor_token") ||
    localStorage.getItem("doctor_token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

// Types for API responses
export interface DoctorAppointment {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  scheduleId: {
    _id: string;
    date: string;
    startTime: string;
    endTime: string;
  };
  status: string;
  symptoms?: string;
  diagnosis?: string;
  appointmentDate: string;
  appointmentTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentStats {
  total: number;
  completed: number;
  pending: number;
  cancelled: number;
  todayAppointments: number;
  thisWeekAppointments: number;
  thisMonthAppointments: number;
}

export interface DashboardStats {
  totalPatients: number;
  completedAppointments: number;
  pendingAppointments: number;
  cancelledAppointments: number;
  todayAppointments: number;
  percentageChange: {
    patients: number;
    completed: number;
    pending: number;
    cancelled: number;
  };
}

// API Functions

// Get doctor's appointments
export const getDoctorAppointments = async (
  doctorId: string
): Promise<DoctorAppointment[]> => {
  try {
    const response = await axios.get(
      `${API_URL}/doctor/appointments?doctorId=${doctorId}`,
      getAuthHeaders()
    );
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    throw error;
  }
};

// Get appointments by date
export const getAppointmentsByDate = async (
  doctorId: string,
  date: string
): Promise<DoctorAppointment[]> => {
  try {
    const response = await axios.get(
      `${API_URL}/doctor/appointments/by-date?doctorId=${doctorId}&date=${date}`,
      getAuthHeaders()
    );

    // Xử lý response mới từ server
    if (response.data.success) {
      return response.data.data;
    }

    // Fallback cho response cũ
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error fetching appointments by date:", error);
    throw error;
  }
};

// Get appointment statistics
export const getAppointmentStats = async (
  doctorId: string
): Promise<AppointmentStats> => {
  try {
    const response = await axios.get(
      `${API_URL}/doctor/appointments/stats?doctorId=${doctorId}`,
      getAuthHeaders()
    );
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error fetching appointment stats:", error);
    throw error;
  }
};

// Get today's appointments
export const getTodayAppointments = async (
  doctorId: string
): Promise<DoctorAppointment[]> => {
  // Use local timezone instead of UTC to get correct date
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
  console.log(
    "Getting today's appointments for doctor:",
    doctorId,
    "on date:",
    today
  );
  const result = await getAppointmentsByDate(doctorId, today);
  console.log("Today's appointments result:", result);
  return result;
};

// Get dashboard statistics (calculated from appointments)
export const getDashboardStats = async (
  doctorId: string
): Promise<DashboardStats> => {
  try {
    const appointments = await getDoctorAppointments(doctorId);
    // Use local timezone instead of UTC to get correct date
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}`;

    // Calculate stats from appointments
    const completedAppointments = appointments.filter((apt) =>
      ["completed", "prescription_issued", "final", "closed"].includes(
        apt.status
      )
    ).length;
    const pendingAppointments = appointments.filter((apt) =>
      ["booked", "confirmed", "await_payment", "paid"].includes(apt.status)
    ).length;
    const cancelledAppointments = appointments.filter(
      (apt) => apt.status === "cancelled"
    ).length;
    const todayAppointments = appointments.filter(
      (apt) => apt.scheduleId?.date === today
    ).length;

    // Get unique patients
    const uniquePatients = new Set(
      appointments.map((apt) => apt.patientId._id)
    );
    const totalPatients = uniquePatients.size;

    // Calculate percentage changes (mock data for now - would need historical data)
    const percentageChange = {
      patients: Math.floor(Math.random() * 20) - 10, // Random between -10 and 10
      completed: Math.floor(Math.random() * 30) - 15,
      pending: Math.floor(Math.random() * 25) - 12,
      cancelled: Math.floor(Math.random() * 15) - 7,
    };

    return {
      totalPatients,
      completedAppointments,
      pendingAppointments,
      cancelledAppointments,
      todayAppointments,
      percentageChange,
    };
  } catch (error) {
    console.error("Error calculating dashboard stats:", error);
    throw error;
  }
};

// Get recent activities (based on recent appointments and status changes)
export const getRecentActivities = async (doctorId: string) => {
  try {
    const appointments = await getDoctorAppointments(doctorId);

    // Sort by most recent and take last 10
    const recentAppointments = appointments
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, 10);

    // Transform to activity format
    const activities = recentAppointments.map((apt) => {
      let action = "Lịch hẹn mới";
      let color = "blue";

      switch (apt.status) {
        case "completed":
        case "prescription_issued":
        case "final":
        case "closed":
          action = "Hoàn thành khám";
          color = "green";
          break;
        case "cancelled":
          action = "Hủy lịch hẹn";
          color = "red";
          break;
        case "confirmed":
        case "paid":
          action = "Xác nhận lịch hẹn";
          color = "blue";
          break;
        default:
          action = "Cập nhật lịch hẹn";
          color = "orange";
      }

      return {
        id: apt._id,
        action,
        patient: apt.patientId.name,
        time: apt.updatedAt,
        color,
        details: apt.symptoms || "Không có triệu chứng cụ thể",
      };
    });

    return activities;
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    throw error;
  }
};

// Update appointment status
export const updateAppointmentStatus = async (
  appointmentId: string,
  status: string
) => {
  try {
    const response = await axios.put(
      `${API_URL}/doctor/appointments/${appointmentId}/status`,
      { status },
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error("Error updating appointment status:", error);
    throw error;
  }
};
