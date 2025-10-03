import axios from "axios";

const BASE_URL = "https://server-medicare.onrender.com/api";

export const getMySchedules = async (doctorId: string) => {
  const res = await axios.get(`${BASE_URL}/doctor/schedule/my`, {
    params: { doctorId },
  });
  return res.data;
};
