import axios from "axios";

const BASE_URL = "https://server-medicare.onrender.com/api";

export const getDoctors = (specialty?: string) =>
  axios
    .get(`${BASE_URL}/doctor/doctors`, {
      params: {
        specialty: specialty ? decodeURIComponent(specialty) : undefined,
      },
    })
    .then((r) => r.data)
    .catch((error) => {
      console.error("Error fetching doctors:", error);
      throw error;
    });

export const getDoctorById = (id: string) =>
  axios.get(`${BASE_URL}/doctor/doctors/${id}`).then((r) => r.data);

export const getDoctorSchedules = (doctorId: string) =>
  axios
    .get(`${BASE_URL}/doctor/doctors/schedules/${doctorId}`)
    .then((r) => r.data);
