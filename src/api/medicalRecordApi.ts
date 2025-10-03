import axios from "./axiosConfig";

export interface MedicalRecord {
  _id?: string;
  appointmentId: string;
  patient: string;
  doctor: string;
  appointmentCode: string;
  consultationType: "online" | "offline";

  // Ảnh chụp hành chính tối thiểu (snapshot từ hồ sơ dân số)
  patientInfo: {
    fullName: string;
    birthYear?: number;
    dateOfBirth?: string;
    gender?: string;
    phone?: string;
    insuranceNumber?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  };

  // Sàng lọc nhanh (≤30s)
  quickScreening?: {
    // Đối chiếu danh tính
    identityVerified?: boolean;

    // Vitals
    temperature?: number;
    bloodPressure?: string;
    heartRate?: number;
    weight?: number;
    height?: number;
    oxygenSaturation?: number;
    bmi?: number; // Tự động tính từ weight/height

    // Dị ứng
    allergies?: {
      hasAllergies: boolean;
      allergyList?: string; // Tên thuốc/chất
    };

    // Thuốc đang dùng
    currentMedications?: string;

    // Mang thai/cho bú (nếu phù hợp)
    pregnancyStatus?: {
      isPregnant?: boolean;
      isBreastfeeding?: boolean;
      gestationalWeeks?: number;
    };

    // Ghi chú tiếp nhận
    receptionNotes?: string;
  };

  // Lý do khám & Triệu chứng chính
  reasonForVisit: string; // prefill từ đặt lịch - bắt buộc
  chiefComplaint: string;

  // Symptoms object for structured access
  symptoms?: {
    chiefComplaint?: string;
  };

  // Mô tả triệu chứng chi tiết
  symptomDetails?: {
    location?: string; // vị trí
    onset?: string; // thời điểm khởi phát
    painScale?: number; // mức độ đau 0-10
    aggravatingFactors?: string; // yếu tố tăng
    relievingFactors?: string; // yếu tố giảm
    associatedSymptoms?: string;
    duration?: string;
  };

  // Ảnh/video (tùy chọn)
  attachments?: {
    images?: string[];
    videos?: string[];
  };

  // Tiền sử & Yếu tố liên quan
  medicalHistory?: {
    pastMedicalHistory?: string;
    surgicalHistory?: string;
    familyHistory?: string;
    socialHistory?: {
      smoking?: string;
      alcohol?: string;
      occupation?: string;
      other?: string;
    };
    syncFromPrevious?: boolean; // Đồng bộ nhanh từ lần trước
  };

  // Khám lâm sàng
  clinicalExamination?: {
    // Toàn thân
    generalAppearance?: string; // tỉnh táo, thể trạng, da/niêm
    consciousness?: string;
    nutrition?: string;
    skinMucosa?: string;

    // Theo hệ cơ quan
    cardiovascular?: string;
    respiratory?: string;
    gastrointestinal?: string;
    neurological?: string;
    musculoskeletal?: string;
    genitourinary?: string;
    endocrine?: string;

    // Ghi chú chung
    examinationNotes?: string;
  };

  // Chỉ định cận lâm sàng (nếu cần)
  paraclinicalIndications?: {
    laboratoryTests?: {
      tests?: string[];
      notes?: string; // ghi chú cho KTV
    };
    imagingStudies?: {
      studies?: string[];
      notes?: string;
    };
    procedures?: {
      procedures?: string[];
      notes?: string;
    };
    consultations?: string;
    resultLocation?: string; // nơi nhận kết quả
    attachedResults?: string[]; // đính kèm file kết quả
  };

  // Chẩn đoán
  preliminaryDiagnosis: string; // bắt buộc trước khi phát hành đơn
  differentialDiagnosis?: string;
  icdCodes?: string[]; // mã ICD-10 multi-select
  finalDiagnosis?: string; // khi kết thúc

  // Diagnosis object for structured access
  diagnosis?: {
    primaryDiagnosis?: string;
    icdCode?: string;
  };

  // Điều trị / Đơn thuốc
  treatment:
    | string
    | {
        medicationsList?: Array<{
          drugName: string;
          strength: string;
          form: string;
          dosage: string;
          frequency: number;
          duration: number;
          quantity: number;
          instructions: string;
        }>;
      };
  prescription?: {
    medications?: Array<{
      name: string;
      strength: string; // hàm lượng
      form: string; // dạng
      dosage: string; // liều dùng
      frequency: string; // số lần/ngày
      duration: number; // số ngày
      quantity: number; // số lượng
      instructions: string; // hướng dẫn
    }>;
    prescriptionIssued?: boolean;
    prescriptionPdfUrl?: string;
  };

  // Theo dõi & an toàn
  followUpCare?: {
    instructions?: string; // hướng dẫn
    warningSignsEducation?: string; // dấu hiệu báo động
    nextAppointment?: {
      date?: string;
      notes?: string;
    };
    emergencyContacts?: string;
  };

  // FollowUp object for structured access
  followUp?: {
    careInstructions?: {
      general?: string;
    };
  };

  // Tệp đính kèm & xuất bản
  documents?: {
    attachments?: string[]; // ảnh/clip/biểu mẫu
    visitSummaryPdfUrl?: string;
    prescriptionPdfUrl?: string;
  };

  // Nhật ký & kiểm soát
  audit?: Array<{
    action: string;
    userId: string;
    timestamp: string;
    changes?: Record<string, unknown>;
  }>;
  locked?: boolean; // khi đã "final"

  // Xác nhận từ admin
  confirmationAdmin?: {
    appointmentConfirmed?: boolean;
    identityVerified?: boolean;
    insuranceChecked?: boolean;
    consentSigned?: boolean;
  };

  // Trạng thái và metadata
  status:
    | "draft"
    | "in_progress"
    | "prescription_issued"
    | "completed"
    | "final";
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  lastModifiedBy?: string;
  prescriptionIssuedAt?: string;
  prescriptionIssuedBy?: string;
  completedAt?: string;
  completedBy?: string;
}

// API functions
export const createMedicalRecordFromAppointment = async (
  appointmentId: string,
  doctorId: string
): Promise<MedicalRecord> => {
  const response = await axios.post(
    `/doctor/medical-records/from-appointment/${appointmentId}`,
    {
      doctorId,
    }
  );
  return response.data;
};

export const getMedicalRecordByAppointment = async (
  appointmentId: string
): Promise<MedicalRecord> => {
  const response = await axios.get(
    `/doctor/medical-records/by-appointment/${appointmentId}`
  );
  return response.data;
};

export const updateMedicalRecord = async (
  recordId: string,
  data: Partial<MedicalRecord>,
  doctorId: string
): Promise<MedicalRecord> => {
  const response = await axios.put(`/doctor/medical-records/${recordId}`, {
    ...data,
    doctorId,
  });
  return response.data;
};

export const getDoctorMedicalRecords = async (
  doctorId: string
): Promise<MedicalRecord[]> => {
  const response = await axios.get(
    `/doctor/medical-records?doctorId=${doctorId}`
  );
  return response.data;
};

export const getMedicalRecordDetail = async (
  recordId: string,
  doctorId: string
): Promise<MedicalRecord> => {
  const response = await axios.get(
    `/doctor/medical-records/${recordId}?doctorId=${doctorId}`
  );
  return response.data.data;
};

export interface PatientWithCompletedAppointment {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
  completedAppointments: Array<{
    _id: string;
    appointmentTime: string;
    symptoms: string;
    status: string;
    medicalRecord?: {
      _id: string;
      status: string;
      preliminaryDiagnosis?: string;
      finalDiagnosis?: string;
      createdAt: string;
      updatedAt: string;
    };
  }>;
}

export const getPatientsWithCompletedAppointments = async (
  doctorId: string
): Promise<PatientWithCompletedAppointment[]> => {
  const response = await axios.get(
    `/doctor/medical-records/patients/completed?doctorId=${doctorId}`
  );
  return response.data.data;
};
