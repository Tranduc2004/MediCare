import axios from "axios";

const BASE_URL = "https://server-medicare.onrender.com/api";

// Upload ID document (CCCD/CMND)
export const uploadIdDocument = async (file: File) => {
  const formData = new FormData();
  formData.append("idDocument", file);

  const token = localStorage.getItem("patient_token");
  if (!token) {
    throw new Error("Unauthorized - No token found");
  }

  const response = await axios.post(
    `${BASE_URL}/patient/upload/id-document`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// Upload BHYT card
export const uploadInsuranceCard = async (file: File) => {
  const formData = new FormData();
  formData.append("insuranceCard", file);

  const token = localStorage.getItem("patient_token");
  if (!token) {
    throw new Error("Unauthorized - No token found");
  }

  const response = await axios.post(
    `${BASE_URL}/patient/upload/insurance-card`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};
