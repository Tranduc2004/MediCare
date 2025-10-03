import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://server-medicare.onrender.com/api";

export interface IService {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const serviceApi = {
  // Lấy danh sách dịch vụ đang hoạt động
  getActiveServices: async (): Promise<IService[]> => {
    try {
      const response = await axios.get<ApiResponse<IService[]>>(
        `${API_BASE_URL}/services/active`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching active services:", error);
      throw error;
    }
  },

  // Lấy dịch vụ theo ID
  getServiceById: async (id: string): Promise<IService> => {
    try {
      const response = await axios.get<ApiResponse<IService>>(
        `${API_BASE_URL}/services/${id}`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching service by id:", error);
      throw error;
    }
  },
};

export default serviceApi;
