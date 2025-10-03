import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://server-medicare.onrender.com/api";

export interface ISpecialty {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const specialtyApi = {
  // Lấy danh sách chuyên khoa đang hoạt động
  getActiveSpecialties: async (): Promise<ISpecialty[]> => {
    try {
      const response = await axios.get<ApiResponse<ISpecialty[]>>(
        `${API_BASE_URL}/specialties/active`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching active specialties:", error);
      throw error;
    }
  },

  // Lấy chuyên khoa theo ID
  getSpecialtyById: async (id: string): Promise<ISpecialty> => {
    try {
      const response = await axios.get<ApiResponse<ISpecialty>>(
        `${API_BASE_URL}/specialties/${id}`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching specialty by id:", error);
      throw error;
    }
  },
};

export default specialtyApi;
