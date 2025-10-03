import React, { useState, useEffect, useCallback } from "react";
import {
  Save,
  FileText,
  User,
  Heart,
  Stethoscope,
  Pill,
  Calendar,
  AlertCircle,
  CheckCircle,
  X,
  Activity,
  Clipboard,
  Camera,
  Shield,
  FileCheck,
  Edit3,
  Send,
  Download,
  CheckCircle2,
} from "lucide-react";
import {
  MedicalRecord,
  updateMedicalRecord,
  getMedicalRecordByAppointment,
  createMedicalRecordFromAppointment,
} from "../../../api/medicalRecordApi";
import { useAuth } from "../../../contexts/AuthContext";

// Define medication interface
interface MedicationItem {
  id: number;
  drugName: string;
  strength: string;
  form: string;
  dosage: string;
  frequency: number;
  duration: number;
  quantity: number;
  instructions: string;
}

// Define audit entry interface
interface AuditEntry {
  user: string;
  action: string;
  timestamp: string;
}

interface MedicalRecordFormProps {
  appointmentId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (record: MedicalRecord) => void;
}

const MedicalRecordForm: React.FC<MedicalRecordFormProps> = ({
  appointmentId,
  isOpen,
  onClose,
  onSave,
}) => {
  const { user } = useAuth();
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const [medicationsList, setMedicationsList] = useState<MedicationItem[]>([]);

  // Add medication to list
  const addMedication = () => {
    const newMedication: MedicationItem = {
      id: Date.now(),
      drugName: getValue("medications.drugName") || "",
      strength: getValue("medications.strength") || "",
      form: getValue("medications.form") || "",
      dosage: getValue("medications.dosage") || "",
      frequency: getNumberValue("medications.frequency") || 1,
      duration: getNumberValue("medications.duration") || 1,
      quantity: getNumberValue("medications.quantity") || 1,
      instructions: getValue("medications.instructions") || "",
    };

    if (newMedication.drugName.trim()) {
      setMedicationsList([...medicationsList, newMedication]);
      // Clear form
      updateRecord("medications.drugName", "");
      updateRecord("medications.strength", "");
      updateRecord("medications.form", "");
      updateRecord("medications.dosage", "");
      updateRecord("medications.frequency", 1);
      updateRecord("medications.duration", 1);
      updateRecord("medications.quantity", 1);
      updateRecord("medications.instructions", "");
    }
  };

  // Remove medication from list
  const removeMedication = (id: number) => {
    setMedicationsList(medicationsList.filter((med) => med.id !== id));
  };

  // Calculate total quantity for a medication
  const calculateTotalQuantity = (frequency: number, duration: number) => {
    return frequency * duration;
  };

  const loadMedicalRecord = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMedicalRecordByAppointment(appointmentId);
      if (data && data._id) {
        setRecord(data);
        // Load medications from record into medicationsList
        if (data.prescription?.medications) {
          const loadedMedications = data.prescription.medications.map(
            (med, index) => ({
              id: Date.now() + index,
              drugName: med.name,
              strength: med.strength,
              form: med.form,
              dosage: med.dosage,
              frequency: parseInt(med.frequency) || 1,
              duration: med.duration,
              quantity: med.quantity,
              instructions: med.instructions,
            })
          );
          setMedicationsList(loadedMedications);
        }
      } else {
        const doctorId = user?._id;
        if (!doctorId) {
          throw new Error("Không xác định được ID bác sĩ");
        }
        const newRecord = await createMedicalRecordFromAppointment(
          appointmentId,
          doctorId
        );
        setRecord(newRecord);
        setMedicationsList([]); // Reset medications list for new record
      }
    } catch (err) {
      setError("Không thể tải hoặc tạo hồ sơ bệnh án");
      console.error("Error loading/creating medical record:", err);
    } finally {
      setLoading(false);
    }
  }, [appointmentId, user?._id]);

  // Load medical record when modal opens
  useEffect(() => {
    if (isOpen && appointmentId) {
      loadMedicalRecord();
    }
  }, [isOpen, appointmentId, loadMedicalRecord]);

  const handleSave = async () => {
    if (!record?._id || !user?._id) return;

    setSaving(true);
    setError("");
    try {
      // Sync medications list with record before saving
      const recordToSave = {
        ...record,
        prescription: {
          ...record.prescription,
          medications: medicationsList.map((med) => ({
            name: med.drugName,
            strength: med.strength,
            form: med.form,
            dosage: med.dosage,
            frequency: med.frequency.toString(),
            duration: med.duration,
            quantity: med.quantity,
            instructions: med.instructions,
          })),
        },
      };

      const updatedRecord = await updateMedicalRecord(
        record._id,
        recordToSave,
        user._id
      );
      setRecord(updatedRecord);
      onSave?.(updatedRecord);
      alert("Đã lưu hồ sơ bệnh án thành công!");
    } catch (err) {
      setError("Không thể lưu hồ sơ bệnh án");
      console.error("Error saving medical record:", err);
    } finally {
      setSaving(false);
    }
  };

  // Handler for Save Draft action
  const handleSaveDraft = async () => {
    if (!record?._id || !user?._id) return;

    setSaving(true);
    setError("");
    try {
      // Sync medications list with record before saving
      const draftRecord: Partial<MedicalRecord> = {
        ...record,
        status: "draft" as const,
        prescription: {
          ...record.prescription,
          medications: medicationsList.map((med) => ({
            name: med.drugName,
            strength: med.strength,
            form: med.form,
            dosage: med.dosage,
            frequency: med.frequency.toString(),
            duration: med.duration,
            quantity: med.quantity,
            instructions: med.instructions,
          })),
        },
      };
      const updatedRecord = await updateMedicalRecord(
        record._id,
        draftRecord,
        user._id
      );
      setRecord(updatedRecord);
      onSave?.(updatedRecord);
      alert("Đã lưu nháp hồ sơ bệnh án!");
    } catch (err) {
      setError("Không thể lưu nháp hồ sơ bệnh án");
      console.error("Error saving draft:", err);
    } finally {
      setSaving(false);
    }
  };

  // Handler for Issue Prescription action
  const handleIssuePrescription = async () => {
    if (!record?._id || !user?._id) return;

    // Check if there are medications prescribed
    if (
      !record.prescription?.medications ||
      record.prescription.medications.length === 0
    ) {
      alert("Vui lòng thêm ít nhất một loại thuốc trước khi phát hành đơn!");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const prescriptionRecord: Partial<MedicalRecord> = {
        ...record,
        status: "prescription_issued" as const,
        prescriptionIssuedAt: new Date().toISOString(),
        prescriptionIssuedBy: user._id,
      };
      const updatedRecord = await updateMedicalRecord(
        record._id,
        prescriptionRecord,
        user._id
      );
      setRecord(updatedRecord);
      onSave?.(updatedRecord);
      alert("Đã phát hành đơn thuốc thành công!");
    } catch (err) {
      setError("Không thể phát hành đơn thuốc");
      console.error("Error issuing prescription:", err);
    } finally {
      setSaving(false);
    }
  };

  // Handler for Export Summary action
  const handleExportSummary = () => {
    if (!record) return;

    try {
      // Create summary content
      const summaryContent = `
PHIẾU TÓM TẮT HỒ SƠ BỆNH ÁN

Thông tin bệnh nhân:
- Họ tên: ${record.patientInfo?.fullName || "N/A"}
- Ngày sinh: ${record.patientInfo?.dateOfBirth || "N/A"}
- Giới tính: ${record.patientInfo?.gender || "N/A"}
- Số điện thoại: ${record.patientInfo?.phone || "N/A"}

Triệu chứng chính:
${record.symptoms?.chiefComplaint || "Không có"}

Chẩn đoán:
- Chẩn đoán chính: ${record.diagnosis?.primaryDiagnosis || "Chưa có"}
- Mã ICD-10: ${record.diagnosis?.icdCode || "Chưa có"}
Kế hoạch điều trị: ${record.treatment || "Chưa có kế hoạch điều trị"}

Danh sách thuốc:
${
  typeof record.treatment === "object" && record.treatment?.medicationsList
    ? record.treatment.medicationsList
        .map(
          (med, index: number) =>
            `${index + 1}. ${med.drugName} ${med.strength} ${med.form} - ${
              med.dosage
            } - ${med.frequency} - ${med.duration}`
        )
        .join("\n")
    : record.prescription?.medications
        ?.map(
          (med, index: number) =>
            `${index + 1}. ${med.name} ${med.strength} ${med.form} - ${
              med.dosage
            } - ${med.frequency} - ${med.duration}`
        )
        .join("\n") || "Không có thuốc"
}

Theo dõi:
${record.followUp?.careInstructions?.general || "Không có hướng dẫn"}

Ngày tạo: ${new Date().toLocaleDateString("vi-VN")}
Bác sĩ: ${user?.name || "N/A"}
      `;

      // Create and download file
      const blob = new Blob([summaryContent], {
        type: "text/plain;charset=utf-8",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tom-tat-ho-so-${
        record.patientInfo?.fullName || "benh-nhan"
      }-${new Date().toISOString().split("T")[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert("Đã xuất phiếu tóm tắt thành công!");
    } catch (err) {
      setError("Không thể xuất phiếu tóm tắt");
      console.error("Error exporting summary:", err);
    }
  };

  // Handler for Complete Record action
  const handleCompleteRecord = async () => {
    if (!record?._id || !user?._id) return;

    // Validation checks
    const validationErrors = [];

    if (!record.diagnosis?.primaryDiagnosis && !record.preliminaryDiagnosis) {
      validationErrors.push("Chẩn đoán chính");
    }
    if (!record.treatment) {
      validationErrors.push("Kế hoạch điều trị");
    }
    if (!record.symptoms?.chiefComplaint && !record.chiefComplaint) {
      validationErrors.push("Triệu chứng chính");
    }

    if (validationErrors.length > 0) {
      alert(
        `Vui lòng hoàn thành các thông tin sau trước khi hoàn thành hồ sơ:\n- ${validationErrors.join(
          "\n- "
        )}`
      );
      return;
    }

    const confirmComplete = window.confirm(
      "Bạn có chắc chắn muốn hoàn thành hồ sơ này? Sau khi hoàn thành, hồ sơ sẽ không thể chỉnh sửa."
    );

    if (!confirmComplete) return;

    setSaving(true);
    setError("");
    try {
      const completedRecord: Partial<MedicalRecord> = {
        ...record,
        status: "completed" as const,
        completedAt: new Date().toISOString(),
        completedBy: user._id,
        locked: true,
      };
      const updatedRecord = await updateMedicalRecord(
        record._id,
        completedRecord,
        user._id
      );
      setRecord(updatedRecord);
      onSave?.(updatedRecord);
      alert("Đã hoàn thành hồ sơ bệnh án!");
    } catch (err) {
      setError("Không thể hoàn thành hồ sơ bệnh án");
      console.error("Error completing record:", err);
    } finally {
      setSaving(false);
    }
  };

  const updateRecord = React.useCallback(
    (path: string, value: unknown) => {
      if (!record) return;

      const keys = path.split(".");
      const newRecord = { ...record };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let current: any = newRecord;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      setRecord(newRecord);
    },
    [record]
  );

  const getValue = useCallback(
    (path: string): string => {
      if (!record) return "";

      const keys = path.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let current: any = record;

      for (const key of keys) {
        if (current && typeof current === "object" && key in current) {
          current = current[key];
        } else {
          return "";
        }
      }

      return current || "";
    },
    [record]
  );

  // Helper functions for different data types
  const getNumberValue = useCallback(
    (path: string): number => {
      const value = getValue(path);
      return value ? Number(value) : 0;
    },
    [getValue]
  );

  const getBooleanValue = useCallback(
    (path: string): boolean => {
      const value = getValue(path);
      return value === "true" || value === "1";
    },
    [getValue]
  );

  const getArrayValue = useCallback(
    (path: string): string[] => {
      if (!record) return [];

      const keys = path.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let current: any = record;

      for (const key of keys) {
        if (current && typeof current === "object" && key in current) {
          current = current[key];
        } else {
          return [];
        }
      }

      return Array.isArray(current)
        ? current
        : current
        ? current
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [];
    },
    [record]
  );

  const getAttachmentsValue = useCallback(
    (path: string): { name: string }[] => {
      if (!record) return [];

      const keys = path.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let current: any = record;

      for (const key of keys) {
        if (current && typeof current === "object" && key in current) {
          current = current[key];
        } else {
          return [];
        }
      }

      if (Array.isArray(current)) {
        return current.map((item) =>
          typeof item === "string" ? { name: item } : item
        );
      }
      if (typeof current === "string" && current.trim()) {
        return current
          .split(",")
          .map((name: string) => ({ name: name.trim() }))
          .filter((item) => item.name);
      }
      return [];
    },
    [record]
  );

  const getAuditValue = useCallback(
    (path: string): AuditEntry[] => {
      if (!record) return [];

      const keys = path.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let current: any = record;

      for (const key of keys) {
        if (current && typeof current === "object" && key in current) {
          current = current[key];
        } else {
          return [];
        }
      }

      return Array.isArray(current) ? current : [];
    },
    [record]
  );

  // Auto calculate BMI when weight or height changes
  const calculateBMI = React.useCallback(() => {
    const weight = getNumberValue("quickScreening.weight");
    const height = getNumberValue("quickScreening.height");
    if (weight && height && height > 0) {
      const bmi = weight / (height / 100) ** 2;
      updateRecord("quickScreening.bmi", Math.round(bmi * 10) / 10);
    }
  }, [getNumberValue, updateRecord]);

  // Get BMI classification
  const getBMIClassification = (bmi: number) => {
    if (bmi < 18.5) return { text: "Thiếu cân", color: "text-blue-600" };
    if (bmi < 25) return { text: "Bình thường", color: "text-green-600" };
    if (bmi < 30) return { text: "Thừa cân", color: "text-yellow-600" };
    return { text: "Béo phì", color: "text-red-600" };
  };

  // Common ICD-10 codes for quick selection
  const commonIcdCodes = [
    { code: "J00", description: "Viêm mũi họng cấp" },
    { code: "J06.9", description: "Nhiễm trùng đường hô hấp trên cấp tính" },
    { code: "K59.0", description: "Táo bón" },
    { code: "R50.9", description: "Sốt không đặc hiệu" },
    { code: "M79.3", description: "Viêm mô mềm" },
    { code: "I10", description: "Tăng huyết áp nguyên phát" },
    { code: "E11.9", description: "Đái tháo đường type 2" },
    { code: "J44.1", description: "COPD cấp tính" },
    { code: "N39.0", description: "Nhiễm trùng đường tiết niệu" },
    { code: "K30", description: "Khó tiêu" },
  ];

  const [icdSearchTerm, setIcdSearchTerm] = useState("");
  const [showIcdSuggestions, setShowIcdSuggestions] = useState(false);

  useEffect(() => {
    calculateBMI();
  }, [calculateBMI]);

  if (!isOpen) return null;

  const tabs = [
    { id: "basic", label: "Thông tin cơ bản", icon: User },
    { id: "screening", label: "Sàng lọc nhanh", icon: Heart },
    { id: "symptoms", label: "Triệu chứng", icon: Activity },
    { id: "history", label: "Tiền sử", icon: Clipboard },
    { id: "examination", label: "Khám lâm sàng", icon: Stethoscope },
    { id: "paraclinical", label: "Cận lâm sàng", icon: FileCheck },
    { id: "diagnosis", label: "Chẩn đoán", icon: FileText },
    { id: "treatment", label: "Điều trị", icon: Pill },
    { id: "followup", label: "Theo dõi", icon: Calendar },
    { id: "documents", label: "Tài liệu", icon: Camera },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center bg-black/60 justify-center p-4 bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-teal-50">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Hồ sơ bệnh án</h2>
              <p className="text-sm text-gray-600">
                {record?.patientInfo?.fullName || "Đang tải..."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">
              Trạng thái:{" "}
              <span className="font-medium">{record?.status || "draft"}</span>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !record}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Đang tải hồ sơ...</p>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && record && (
          <div className="flex h-[calc(95vh-180px)]">
            {/* Sidebar tabs */}
            <div className="w-64 border-r border-gray-200 bg-gray-50">
              <nav className="p-4 space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors text-sm ${
                        activeTab === tab.id
                          ? "bg-blue-100 text-blue-700 border border-blue-200"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Basic Information Tab */}
              {activeTab === "basic" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Ảnh chụp hành chính tối thiểu (snapshot từ hồ sơ dân số)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Họ và tên *
                      </label>
                      <input
                        type="text"
                        value={getValue("patientInfo.fullName")}
                        onChange={(e) =>
                          updateRecord("patientInfo.fullName", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Năm sinh/Tuổi
                      </label>
                      <input
                        type="number"
                        value={getValue("patientInfo.birthYear")}
                        onChange={(e) =>
                          updateRecord(
                            "patientInfo.birthYear",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giới tính
                      </label>
                      <select
                        value={getValue("patientInfo.gender")}
                        onChange={(e) =>
                          updateRecord("patientInfo.gender", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mã BHYT (nếu có)
                      </label>
                      <input
                        type="text"
                        value={getValue("patientInfo.insuranceNumber")}
                        onChange={(e) =>
                          updateRecord(
                            "patientInfo.insuranceNumber",
                            e.target.value
                          )
                        }
                        placeholder="— chưa rõ —"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên người liên lạc khẩn cấp
                      </label>
                      <input
                        type="text"
                        value={getValue("patientInfo.emergencyContactName")}
                        onChange={(e) =>
                          updateRecord(
                            "patientInfo.emergencyContactName",
                            e.target.value
                          )
                        }
                        placeholder="— chưa rõ —"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số liên lạc khẩn cấp
                      </label>
                      <input
                        type="tel"
                        value={getValue("patientInfo.emergencyContactPhone")}
                        onChange={(e) =>
                          updateRecord(
                            "patientInfo.emergencyContactPhone",
                            e.target.value
                          )
                        }
                        placeholder="— chưa rõ —"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lý do khám (prefill từ đặt lịch) *
                      </label>
                      <textarea
                        value={getValue("reasonForVisit")}
                        onChange={(e) =>
                          updateRecord("reasonForVisit", e.target.value)
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Triệu chứng chính
                      </label>
                      <textarea
                        value={getValue("chiefComplaint")}
                        onChange={(e) =>
                          updateRecord("chiefComplaint", e.target.value)
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Screening Tab */}
              {activeTab === "screening" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Sàng lọc nhanh (≤30s)
                  </h3>

                  {/* Identity Verification */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="identityVerified"
                        checked={getBooleanValue(
                          "quickScreening.identityVerified"
                        )}
                        onChange={(e) =>
                          updateRecord(
                            "quickScreening.identityVerified",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="identityVerified"
                        className="text-sm font-medium text-gray-700"
                      >
                        ✔️ Đối chiếu danh tính
                      </label>
                    </div>
                  </div>

                  {/* Vitals */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                      Vitals
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nhiệt độ (°C)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={getValue("quickScreening.temperature")}
                          onChange={(e) =>
                            updateRecord(
                              "quickScreening.temperature",
                              parseFloat(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Huyết áp (mmHg)
                        </label>
                        <input
                          type="text"
                          value={getValue("quickScreening.bloodPressure")}
                          onChange={(e) =>
                            updateRecord(
                              "quickScreening.bloodPressure",
                              e.target.value
                            )
                          }
                          placeholder="120/80"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mạch (lần/phút)
                        </label>
                        <input
                          type="number"
                          value={getValue("quickScreening.heartRate")}
                          onChange={(e) =>
                            updateRecord(
                              "quickScreening.heartRate",
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          SpO₂ (%)
                        </label>
                        <input
                          type="number"
                          value={getValue("quickScreening.oxygenSaturation")}
                          onChange={(e) =>
                            updateRecord(
                              "quickScreening.oxygenSaturation",
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cân nặng (kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={getValue("quickScreening.weight")}
                          onChange={(e) =>
                            updateRecord(
                              "quickScreening.weight",
                              parseFloat(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Chiều cao (cm)
                        </label>
                        <input
                          type="number"
                          value={getValue("quickScreening.height")}
                          onChange={(e) =>
                            updateRecord(
                              "quickScreening.height",
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          BMI (tự động tính)
                        </label>
                        <div className="space-y-1">
                          <input
                            type="number"
                            step="0.1"
                            value={getValue("quickScreening.bmi")}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          />
                          {getNumberValue("quickScreening.bmi") > 0 && (
                            <div
                              className={`text-xs font-medium ${
                                getBMIClassification(
                                  getNumberValue("quickScreening.bmi")
                                ).color
                              }`}
                            >
                              {
                                getBMIClassification(
                                  getNumberValue("quickScreening.bmi")
                                ).text
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Allergies */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                      Dị ứng
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="allergies"
                            checked={
                              !getBooleanValue(
                                "quickScreening.allergies.hasAllergies"
                              )
                            }
                            onChange={() =>
                              updateRecord(
                                "quickScreening.allergies.hasAllergies",
                                false
                              )
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Không</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="allergies"
                            checked={getBooleanValue(
                              "quickScreening.allergies.hasAllergies"
                            )}
                            onChange={() =>
                              updateRecord(
                                "quickScreening.allergies.hasAllergies",
                                true
                              )
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Có</span>
                        </label>
                      </div>
                      {getValue("quickScreening.allergies.hasAllergies") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên thuốc/chất gây dị ứng
                          </label>
                          <textarea
                            value={getValue(
                              "quickScreening.allergies.allergyList"
                            )}
                            onChange={(e) =>
                              updateRecord(
                                "quickScreening.allergies.allergyList",
                                e.target.value
                              )
                            }
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Current Medications */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thuốc đang dùng (tùy chọn)
                    </label>
                    <textarea
                      value={getValue("quickScreening.currentMedications")}
                      onChange={(e) =>
                        updateRecord(
                          "quickScreening.currentMedications",
                          e.target.value
                        )
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Pregnancy/Breastfeeding */}
                  {getValue("patientInfo.gender") === "female" && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">
                        Mang thai/cho bú
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="isPregnant"
                            checked={getBooleanValue(
                              "quickScreening.pregnancyStatus.isPregnant"
                            )}
                            onChange={(e) =>
                              updateRecord(
                                "quickScreening.pregnancyStatus.isPregnant",
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="isPregnant"
                            className="text-sm text-gray-700"
                          >
                            Mang thai
                          </label>
                        </div>
                        {getValue(
                          "quickScreening.pregnancyStatus.isPregnant"
                        ) && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tuần thai
                            </label>
                            <input
                              type="number"
                              value={getValue(
                                "quickScreening.pregnancyStatus.gestationalWeeks"
                              )}
                              onChange={(e) =>
                                updateRecord(
                                  "quickScreening.pregnancyStatus.gestationalWeeks",
                                  parseInt(e.target.value)
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="isBreastfeeding"
                            checked={getBooleanValue(
                              "quickScreening.pregnancyStatus.isBreastfeeding"
                            )}
                            onChange={(e) =>
                              updateRecord(
                                "quickScreening.pregnancyStatus.isBreastfeeding",
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="isBreastfeeding"
                            className="text-sm text-gray-700"
                          >
                            Cho bú
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reception Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ghi chú tiếp nhận (ngắn)
                    </label>
                    <textarea
                      value={getValue("quickScreening.receptionNotes")}
                      onChange={(e) =>
                        updateRecord(
                          "quickScreening.receptionNotes",
                          e.target.value
                        )
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Symptoms Tab */}
              {activeTab === "symptoms" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Mô tả triệu chứng chi tiết
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vị trí
                      </label>
                      <input
                        type="text"
                        value={getValue("symptomDetails.location")}
                        onChange={(e) =>
                          updateRecord(
                            "symptomDetails.location",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thời điểm khởi phát
                      </label>
                      <input
                        type="text"
                        value={getValue("symptomDetails.onset")}
                        onChange={(e) =>
                          updateRecord("symptomDetails.onset", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mức độ đau (0-10)
                      </label>
                      <div className="space-y-3">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={getValue("symptomDetails.painScale") || 0}
                          onChange={(e) =>
                            updateRecord(
                              "symptomDetails.painScale",
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #10b981 0%, #f59e0b ${
                              getNumberValue("symptomDetails.painScale") * 5
                            }%, #ef4444 50%, #dc2626 100%)`,
                          }}
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>0</span>
                          <span>2</span>
                          <span>4</span>
                          <span>6</span>
                          <span>8</span>
                          <span>10</span>
                        </div>
                        <div className="text-center">
                          <span
                            className={`text-lg font-bold ${
                              getNumberValue("symptomDetails.painScale") <= 3
                                ? "text-green-600"
                                : getNumberValue("symptomDetails.painScale") <=
                                  6
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {getValue("symptomDetails.painScale") || 0}/10
                          </span>
                          <div className="text-sm text-gray-600 mt-1">
                            {(getValue("symptomDetails.painScale") || 0) ===
                              0 && "Không đau"}
                            {Number(
                              getValue("symptomDetails.painScale") || 0
                            ) >= 1 &&
                              Number(
                                getValue("symptomDetails.painScale") || 0
                              ) <= 3 &&
                              "Đau nhẹ"}
                            {Number(
                              getValue("symptomDetails.painScale") || 0
                            ) >= 4 &&
                              Number(
                                getValue("symptomDetails.painScale") || 0
                              ) <= 6 &&
                              "Đau vừa"}
                            {Number(
                              getValue("symptomDetails.painScale") || 0
                            ) >= 7 &&
                              Number(
                                getValue("symptomDetails.painScale") || 0
                              ) <= 8 &&
                              "Đau nặng"}
                            {Number(
                              getValue("symptomDetails.painScale") || 0
                            ) >= 9 && "Đau rất nặng"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thời gian kéo dài
                      </label>
                      <input
                        type="text"
                        value={getValue("symptomDetails.duration")}
                        onChange={(e) =>
                          updateRecord(
                            "symptomDetails.duration",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Yếu tố tăng
                      </label>
                      <textarea
                        value={getValue("symptomDetails.aggravatingFactors")}
                        onChange={(e) =>
                          updateRecord(
                            "symptomDetails.aggravatingFactors",
                            e.target.value
                          )
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Yếu tố giảm
                      </label>
                      <textarea
                        value={getValue("symptomDetails.relievingFactors")}
                        onChange={(e) =>
                          updateRecord(
                            "symptomDetails.relievingFactors",
                            e.target.value
                          )
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Triệu chứng kèm theo
                    </label>
                    <textarea
                      value={getValue("symptomDetails.associatedSymptoms")}
                      onChange={(e) =>
                        updateRecord(
                          "symptomDetails.associatedSymptoms",
                          e.target.value
                        )
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Attachments */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                      Ảnh/video (tùy chọn)
                    </h4>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Kéo thả hoặc click để tải lên ảnh/video
                      </p>
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(e) => {
                          // Handle file upload logic here
                          console.log("Files selected:", e.target.files);
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* History Tab */}
              {activeTab === "history" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Tiền sử & Yếu tố liên quan
                    </h3>
                    <button
                      onClick={() =>
                        updateRecord("medicalHistory.syncFromPrevious", true)
                      }
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Đồng bộ từ lần trước
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bệnh sử cũ
                      </label>
                      <textarea
                        value={getValue("medicalHistory.pastMedicalHistory")}
                        onChange={(e) =>
                          updateRecord(
                            "medicalHistory.pastMedicalHistory",
                            e.target.value
                          )
                        }
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tiền sử phẫu thuật
                      </label>
                      <textarea
                        value={getValue("medicalHistory.surgicalHistory")}
                        onChange={(e) =>
                          updateRecord(
                            "medicalHistory.surgicalHistory",
                            e.target.value
                          )
                        }
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tiền sử gia đình
                      </label>
                      <textarea
                        value={getValue("medicalHistory.familyHistory")}
                        onChange={(e) =>
                          updateRecord(
                            "medicalHistory.familyHistory",
                            e.target.value
                          )
                        }
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Thói quen
                      </label>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Thuốc lá
                          </label>
                          <input
                            type="text"
                            value={getValue(
                              "medicalHistory.socialHistory.smoking"
                            )}
                            onChange={(e) =>
                              updateRecord(
                                "medicalHistory.socialHistory.smoking",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Rượu
                          </label>
                          <input
                            type="text"
                            value={getValue(
                              "medicalHistory.socialHistory.alcohol"
                            )}
                            onChange={(e) =>
                              updateRecord(
                                "medicalHistory.socialHistory.alcohol",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Nghề nghiệp
                          </label>
                          <input
                            type="text"
                            value={getValue(
                              "medicalHistory.socialHistory.occupation"
                            )}
                            onChange={(e) =>
                              updateRecord(
                                "medicalHistory.socialHistory.occupation",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Khác
                          </label>
                          <input
                            type="text"
                            value={getValue(
                              "medicalHistory.socialHistory.other"
                            )}
                            onChange={(e) =>
                              updateRecord(
                                "medicalHistory.socialHistory.other",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Clinical Examination Tab */}
              {activeTab === "examination" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Khám lâm sàng
                  </h3>

                  {/* General Examination */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                      Toàn thân
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tỉnh táo, thể trạng
                        </label>
                        <input
                          type="text"
                          value={getValue(
                            "clinicalExamination.generalAppearance"
                          )}
                          onChange={(e) =>
                            updateRecord(
                              "clinicalExamination.generalAppearance",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ý thức
                        </label>
                        <input
                          type="text"
                          value={getValue("clinicalExamination.consciousness")}
                          onChange={(e) =>
                            updateRecord(
                              "clinicalExamination.consciousness",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dinh dưỡng
                        </label>
                        <input
                          type="text"
                          value={getValue("clinicalExamination.nutrition")}
                          onChange={(e) =>
                            updateRecord(
                              "clinicalExamination.nutrition",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Da/niêm mạc
                        </label>
                        <input
                          type="text"
                          value={getValue("clinicalExamination.skinMucosa")}
                          onChange={(e) =>
                            updateRecord(
                              "clinicalExamination.skinMucosa",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* System Examination */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                      Theo hệ cơ quan
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tim mạch
                        </label>
                        <textarea
                          value={getValue("clinicalExamination.cardiovascular")}
                          onChange={(e) =>
                            updateRecord(
                              "clinicalExamination.cardiovascular",
                              e.target.value
                            )
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hô hấp
                        </label>
                        <textarea
                          value={getValue("clinicalExamination.respiratory")}
                          onChange={(e) =>
                            updateRecord(
                              "clinicalExamination.respiratory",
                              e.target.value
                            )
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tiêu hóa
                        </label>
                        <textarea
                          value={getValue(
                            "clinicalExamination.gastrointestinal"
                          )}
                          onChange={(e) =>
                            updateRecord(
                              "clinicalExamination.gastrointestinal",
                              e.target.value
                            )
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Thần kinh
                        </label>
                        <textarea
                          value={getValue("clinicalExamination.neurological")}
                          onChange={(e) =>
                            updateRecord(
                              "clinicalExamination.neurological",
                              e.target.value
                            )
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cơ xương khớp
                        </label>
                        <textarea
                          value={getValue(
                            "clinicalExamination.musculoskeletal"
                          )}
                          onChange={(e) =>
                            updateRecord(
                              "clinicalExamination.musculoskeletal",
                              e.target.value
                            )
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tiết niệu sinh dục
                        </label>
                        <textarea
                          value={getValue("clinicalExamination.genitourinary")}
                          onChange={(e) =>
                            updateRecord(
                              "clinicalExamination.genitourinary",
                              e.target.value
                            )
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nội tiết
                        </label>
                        <textarea
                          value={getValue("clinicalExamination.endocrine")}
                          onChange={(e) =>
                            updateRecord(
                              "clinicalExamination.endocrine",
                              e.target.value
                            )
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Examination Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ghi chú khám lâm sàng
                    </label>
                    <textarea
                      value={getValue("clinicalExamination.examinationNotes")}
                      onChange={(e) =>
                        updateRecord(
                          "clinicalExamination.examinationNotes",
                          e.target.value
                        )
                      }
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Paraclinical Tab */}
              {activeTab === "paraclinical" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Chỉ định cận lâm sàng (nếu cần)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Laboratory Tests */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">
                        Xét nghiệm
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Danh sách xét nghiệm
                          </label>
                          <textarea
                            value={
                              Array.isArray(
                                getValue(
                                  "paraclinicalIndications.laboratoryTests.tests"
                                )
                              )
                                ? (
                                    getValue(
                                      "paraclinicalIndications.laboratoryTests.tests"
                                    ) as unknown as string[]
                                  ).join("\n")
                                : typeof getValue(
                                    "paraclinicalIndications.laboratoryTests.tests"
                                  ) === "string"
                                ? getValue(
                                    "paraclinicalIndications.laboratoryTests.tests"
                                  )
                                : ""
                            }
                            onChange={(e) =>
                              updateRecord(
                                "paraclinicalIndications.laboratoryTests.tests",
                                e.target.value
                                  .split("\n")
                                  .filter((t) => t.trim())
                              )
                            }
                            rows={4}
                            placeholder="Mỗi xét nghiệm một dòng"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ghi chú cho KTV
                          </label>
                          <textarea
                            value={getValue(
                              "paraclinicalIndications.laboratoryTests.notes"
                            )}
                            onChange={(e) =>
                              updateRecord(
                                "paraclinicalIndications.laboratoryTests.notes",
                                e.target.value
                              )
                            }
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Imaging Studies */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">
                        Chẩn đoán hình ảnh
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Danh sách chẩn đoán hình ảnh
                          </label>
                          <textarea
                            value={
                              Array.isArray(
                                getValue(
                                  "paraclinicalIndications.imagingStudies.studies"
                                )
                              )
                                ? (
                                    getValue(
                                      "paraclinicalIndications.imagingStudies.studies"
                                    ) as unknown as string[]
                                  ).join("\n")
                                : typeof getValue(
                                    "paraclinicalIndications.imagingStudies.studies"
                                  ) === "string"
                                ? getValue(
                                    "paraclinicalIndications.imagingStudies.studies"
                                  )
                                : ""
                            }
                            onChange={(e) =>
                              updateRecord(
                                "paraclinicalIndications.imagingStudies.studies",
                                e.target.value
                                  .split("\n")
                                  .filter((s) => s.trim())
                              )
                            }
                            rows={4}
                            placeholder="Mỗi chẩn đoán một dòng"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ghi chú cho KTV
                          </label>
                          <textarea
                            value={getValue(
                              "paraclinicalIndications.imagingStudies.notes"
                            )}
                            onChange={(e) =>
                              updateRecord(
                                "paraclinicalIndications.imagingStudies.notes",
                                e.target.value
                              )
                            }
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Procedures */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">
                        Thủ thuật
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Danh sách thủ thuật
                          </label>
                          <textarea
                            value={
                              Array.isArray(
                                getValue(
                                  "paraclinicalIndications.procedures.procedures"
                                )
                              )
                                ? (
                                    getValue(
                                      "paraclinicalIndications.procedures.procedures"
                                    ) as unknown as string[]
                                  ).join("\n")
                                : typeof getValue(
                                    "paraclinicalIndications.procedures.procedures"
                                  ) === "string"
                                ? getValue(
                                    "paraclinicalIndications.procedures.procedures"
                                  )
                                : ""
                            }
                            onChange={(e) =>
                              updateRecord(
                                "paraclinicalIndications.procedures.procedures",
                                e.target.value
                                  .split("\n")
                                  .filter((p) => p.trim())
                              )
                            }
                            rows={4}
                            placeholder="Mỗi thủ thuật một dòng"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ghi chú cho KTV
                          </label>
                          <textarea
                            value={getValue(
                              "paraclinicalIndications.procedures.notes"
                            )}
                            onChange={(e) =>
                              updateRecord(
                                "paraclinicalIndications.procedures.notes",
                                e.target.value
                              )
                            }
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Consultations */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">
                        Hội chẩn
                      </h4>
                      <textarea
                        value={getValue(
                          "paraclinicalIndications.consultations"
                        )}
                        onChange={(e) =>
                          updateRecord(
                            "paraclinicalIndications.consultations",
                            e.target.value
                          )
                        }
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nơi nhận kết quả
                      </label>
                      <input
                        type="text"
                        value={getValue(
                          "paraclinicalIndications.resultLocation"
                        )}
                        onChange={(e) =>
                          updateRecord(
                            "paraclinicalIndications.resultLocation",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        File kết quả đính kèm
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-600">
                          Kéo thả file kết quả
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Diagnosis Tab */}
              {activeTab === "diagnosis" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Chẩn đoán
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chẩn đoán sơ bộ (bắt buộc trước khi phát hành đơn) *
                      </label>
                      <textarea
                        value={getValue("preliminaryDiagnosis")}
                        onChange={(e) =>
                          updateRecord("preliminaryDiagnosis", e.target.value)
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chẩn đoán phân biệt (tùy chọn)
                      </label>
                      <textarea
                        value={getValue("differentialDiagnosis")}
                        onChange={(e) =>
                          updateRecord("differentialDiagnosis", e.target.value)
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mã ICD-10 (multi-select, tùy chọn)
                      </label>
                      <div className="space-y-3">
                        <div className="relative">
                          <input
                            type="text"
                            value={icdSearchTerm}
                            onChange={(e) => {
                              setIcdSearchTerm(e.target.value);
                              setShowIcdSuggestions(e.target.value.length > 0);
                            }}
                            onFocus={() => setShowIcdSuggestions(true)}
                            onBlur={() =>
                              setTimeout(
                                () => setShowIcdSuggestions(false),
                                200
                              )
                            }
                            placeholder="Tìm kiếm mã ICD-10..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {showIcdSuggestions && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {commonIcdCodes
                                .filter(
                                  (item) =>
                                    item.code
                                      .toLowerCase()
                                      .includes(icdSearchTerm.toLowerCase()) ||
                                    item.description
                                      .toLowerCase()
                                      .includes(icdSearchTerm.toLowerCase())
                                )
                                .map((item, index) => (
                                  <div
                                    key={index}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                    onClick={() => {
                                      const currentCodes = Array.isArray(
                                        getValue("icdCodes")
                                      )
                                        ? (getValue(
                                            "icdCodes"
                                          ) as unknown as string[])
                                        : [];
                                      if (!currentCodes.includes(item.code)) {
                                        updateRecord("icdCodes", [
                                          ...currentCodes,
                                          item.code,
                                        ]);
                                      }
                                      setIcdSearchTerm("");
                                      setShowIcdSuggestions(false);
                                    }}
                                  >
                                    <div className="font-medium text-blue-600">
                                      {item.code}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {item.description}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>

                        {/* Selected ICD codes */}
                        <div className="flex flex-wrap gap-2">
                          {getArrayValue("icdCodes").map(
                            (code: string, index: number) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                              >
                                {code}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentCodes = Array.isArray(
                                      getValue("icdCodes")
                                    )
                                      ? getValue("icdCodes")
                                      : typeof getValue("icdCodes") ===
                                          "string" &&
                                        getValue("icdCodes").trim()
                                      ? getValue("icdCodes")
                                          .split(",")
                                          .map((c: string) => c.trim())
                                          .filter((c: string) => c)
                                      : [];
                                    updateRecord(
                                      "icdCodes",
                                      (Array.isArray(currentCodes)
                                        ? currentCodes
                                        : typeof currentCodes === "string" &&
                                          currentCodes.trim()
                                        ? currentCodes
                                            .split(",")
                                            .map((c: string) => c.trim())
                                            .filter((c: string) => c)
                                        : []
                                      ).filter((c: string) => c !== code)
                                    );
                                  }}
                                  className="ml-2 text-blue-600 hover:text-blue-800"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            )
                          )}
                        </div>

                        {/* Manual input */}
                        <input
                          type="text"
                          value=""
                          onChange={(e) => {
                            if (e.target.value.trim()) {
                              const currentCodes = getValue("icdCodes") || [];
                              const newCodes = e.target.value
                                .split(",")
                                .map((code) => code.trim())
                                .filter((code) => code);
                              updateRecord("icdCodes", [
                                ...currentCodes,
                                ...newCodes,
                              ]);
                              e.target.value = "";
                            }
                          }}
                          onKeyPress={(e) => {
                            const target = e.target as HTMLInputElement;
                            if (e.key === "Enter" && target.value.trim()) {
                              const currentCodes = getArrayValue("icdCodes");
                              if (!currentCodes.includes(target.value.trim())) {
                                updateRecord("icdCodes", [
                                  ...currentCodes,
                                  target.value.trim(),
                                ]);
                              }
                              target.value = "";
                            }
                          }}
                          placeholder="Hoặc nhập mã ICD-10 thủ công (Enter để thêm)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chẩn đoán cuối cùng (khi kết thúc)
                      </label>
                      <textarea
                        value={getValue("finalDiagnosis")}
                        onChange={(e) =>
                          updateRecord("finalDiagnosis", e.target.value)
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Treatment Tab */}
              {activeTab === "treatment" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Điều trị / Đơn thuốc
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kế hoạch điều trị
                    </label>
                    <textarea
                      value={getValue("treatment")}
                      onChange={(e) =>
                        updateRecord("treatment", e.target.value)
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Medications */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                      Danh sách thuốc
                    </h4>

                    {/* Added Medications List */}
                    {medicationsList.length > 0 && (
                      <div className="mb-6">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">
                          Thuốc đã thêm:
                        </h5>
                        <div className="space-y-3">
                          {medicationsList.map((med) => (
                            <div
                              key={med.id}
                              className="bg-gray-50 p-4 rounded-lg border"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <span className="font-medium text-blue-600">
                                      {med.drugName}
                                    </span>
                                    <span className="text-gray-600 ml-2">
                                      ({med.strength})
                                    </span>
                                    <div className="text-sm text-gray-500">
                                      {med.form}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm">
                                      <span className="font-medium">Liều:</span>{" "}
                                      {med.dosage}
                                    </div>
                                    <div className="text-sm">
                                      <span className="font-medium">
                                        Tần suất:
                                      </span>{" "}
                                      {med.frequency} lần/ngày × {med.duration}{" "}
                                      ngày
                                    </div>
                                    <div className="text-sm">
                                      <span className="font-medium">
                                        Tổng số:
                                      </span>{" "}
                                      {calculateTotalQuantity(
                                        med.frequency,
                                        med.duration
                                      )}{" "}
                                      {med.form}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm">
                                      <span className="font-medium">
                                        Hướng dẫn:
                                      </span>
                                      <div className="text-gray-600 mt-1">
                                        {med.instructions ||
                                          "Theo chỉ định bác sĩ"}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeMedication(med.id)}
                                  className="ml-3 text-red-500 hover:text-red-700 p-1"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add New Medication Form */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">
                        Thêm thuốc mới:
                      </h5>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tên thuốc *
                            </label>
                            <input
                              type="text"
                              value={getValue("medications.drugName")}
                              onChange={(e) =>
                                updateRecord(
                                  "medications.drugName",
                                  e.target.value
                                )
                              }
                              placeholder="Ví dụ: Paracetamol"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Hàm lượng
                            </label>
                            <input
                              type="text"
                              value={getValue("medications.strength")}
                              onChange={(e) =>
                                updateRecord(
                                  "medications.strength",
                                  e.target.value
                                )
                              }
                              placeholder="Ví dụ: 500mg"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Dạng thuốc
                            </label>
                            <select
                              value={getValue("medications.form")}
                              onChange={(e) =>
                                updateRecord("medications.form", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Chọn dạng thuốc</option>
                              <option value="viên">Viên</option>
                              <option value="viên nang">Viên nang</option>
                              <option value="gói">Gói</option>
                              <option value="chai">Chai</option>
                              <option value="ống">Ống</option>
                              <option value="tuýp">Tuýp</option>
                              <option value="lọ">Lọ</option>
                              <option value="ml">ml</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Liều dùng
                            </label>
                            <input
                              type="text"
                              value={getValue("medications.dosage")}
                              onChange={(e) =>
                                updateRecord(
                                  "medications.dosage",
                                  e.target.value
                                )
                              }
                              placeholder="Ví dụ: 1 viên"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Số lần/ngày
                            </label>
                            <select
                              value={getValue("medications.frequency")}
                              onChange={(e) =>
                                updateRecord(
                                  "medications.frequency",
                                  parseInt(e.target.value)
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value={1}>1 lần/ngày</option>
                              <option value={2}>2 lần/ngày</option>
                              <option value={3}>3 lần/ngày</option>
                              <option value={4}>4 lần/ngày</option>
                              <option value={6}>6 lần/ngày</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Số ngày
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="30"
                              value={getValue("medications.duration")}
                              onChange={(e) =>
                                updateRecord(
                                  "medications.duration",
                                  parseInt(e.target.value)
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        {/* Auto-calculated quantity display */}
                        {getValue("medications.frequency") &&
                          getValue("medications.duration") && (
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <div className="text-sm text-blue-800">
                                <span className="font-medium">
                                  Tổng số lượng cần:
                                </span>{" "}
                                {calculateTotalQuantity(
                                  getNumberValue("medications.frequency"),
                                  getNumberValue("medications.duration")
                                )}{" "}
                                {getValue("medications.form") || "đơn vị"}
                              </div>
                            </div>
                          )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hướng dẫn sử dụng
                          </label>
                          <textarea
                            value={getValue("medications.instructions")}
                            onChange={(e) =>
                              updateRecord(
                                "medications.instructions",
                                e.target.value
                              )
                            }
                            rows={2}
                            placeholder="Ví dụ: Uống sau ăn, tránh ánh nắng..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <button
                          onClick={addMedication}
                          disabled={!getValue("medications.drugName")?.trim()}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <Pill size={16} />
                          Thêm thuốc vào đơn
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Prescription Action */}
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-md font-medium text-gray-900">
                          Phát hành đơn thuốc
                        </h4>
                        <p className="text-sm text-gray-600">
                          Tạo Prescription + PDF URL, cập nhật status:
                          "prescription_issued"
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          // Handle prescription issuance
                          updateRecord("status", "prescription_issued");
                          console.log("Issuing prescription...");
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                      >
                        <Pill className="h-4 w-4" />
                        Phát hành đơn
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Follow-up Tab */}
              {activeTab === "followup" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Theo dõi & an toàn
                  </h3>

                  {/* Care Instructions Section */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="text-md font-medium text-blue-900 mb-3 flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Hướng dẫn chăm sóc tại nhà
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-blue-800 mb-1">
                          Hướng dẫn chăm sóc tổng quát
                        </label>
                        <textarea
                          value={getValue("followUpCare.instructions")}
                          onChange={(e) =>
                            updateRecord(
                              "followUpCare.instructions",
                              e.target.value
                            )
                          }
                          rows={4}
                          placeholder="Ví dụ: Chế độ ăn uống, hoạt động, nghỉ ngơi, các lưu ý khác..."
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Warning Signs Section */}
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 className="text-md font-medium text-red-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Dấu hiệu báo động - Cần đến viện ngay
                    </h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-red-800 mb-1">
                            Triệu chứng nguy hiểm
                          </label>
                          <textarea
                            value={getValue(
                              "followUpCare.warningSignsEducation"
                            )}
                            onChange={(e) =>
                              updateRecord(
                                "followUpCare.warningSignsEducation",
                                e.target.value
                              )
                            }
                            rows={3}
                            placeholder="Ví dụ: Sốt cao trên 39°C, khó thở, đau ngực dữ dội..."
                            className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-red-800 mb-1">
                            Hành động cần làm
                          </label>
                          <textarea
                            value={getValue("followUpCare.emergencyContacts")}
                            onChange={(e) =>
                              updateRecord(
                                "followUpCare.emergencyContacts",
                                e.target.value
                              )
                            }
                            rows={3}
                            placeholder="Ví dụ: Gọi 115, đến cấp cứu ngay, liên hệ bác sĩ..."
                            className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                          />
                        </div>
                      </div>

                      {/* Emergency Contact */}
                      <div className="bg-red-100 p-3 rounded-lg">
                        <h5 className="text-sm font-medium text-red-900 mb-2">
                          Liên hệ khẩn cấp:
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Cấp cứu:</span> 115
                          </div>
                          <div>
                            <span className="font-medium">
                              Bác sĩ điều trị:
                            </span>{" "}
                            {user?.phone || "Chưa cập nhật"}
                          </div>
                          <div>
                            <span className="font-medium">Phòng khám:</span>{" "}
                            1900-xxxx
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Follow-up Schedule Section */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="text-md font-medium text-green-900 mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Lịch tái khám & theo dõi
                    </h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-green-800 mb-1">
                            Thời gian tái khám
                          </label>
                          <select
                            value={getValue(
                              "followUpCare.nextAppointment.notes"
                            )}
                            onChange={(e) =>
                              updateRecord(
                                "followUpCare.nextAppointment.notes",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                          >
                            <option value="">Chọn thời gian</option>
                            <option value="Sau 3 ngày">Sau 3 ngày</option>
                            <option value="Sau 1 tuần">Sau 1 tuần</option>
                            <option value="Sau 2 tuần">Sau 2 tuần</option>
                            <option value="Sau 1 tháng">Sau 1 tháng</option>
                            <option value="Sau 3 tháng">Sau 3 tháng</option>
                            <option value="Khi cần thiết">Khi cần thiết</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-green-800 mb-1">
                            Ngày tái khám cụ thể
                          </label>
                          <input
                            type="date"
                            value={getValue(
                              "followUpCare.nextAppointment.date"
                            )}
                            onChange={(e) =>
                              updateRecord(
                                "followUpCare.nextAppointment.date",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-green-800 mb-1">
                          Mục đích tái khám
                        </label>
                        <textarea
                          value={getValue("followUpCare.nextAppointment.notes")}
                          onChange={(e) =>
                            updateRecord(
                              "followUpCare.nextAppointment.notes",
                              e.target.value
                            )
                          }
                          rows={2}
                          placeholder="Ví dụ: Kiểm tra kết quả xét nghiệm, đánh giá hiệu quả điều trị..."
                          className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Medication Safety Section */}
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="text-md font-medium text-yellow-900 mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      An toàn thuốc & tương tác
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-yellow-800 mb-1">
                          Thuốc cần tránh
                        </label>
                        <textarea
                          value={getValue("followUpCare.instructions")}
                          onChange={(e) =>
                            updateRecord(
                              "followUpCare.instructions",
                              e.target.value
                            )
                          }
                          rows={2}
                          placeholder="Các loại thuốc bệnh nhân cần tránh..."
                          className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-yellow-800 mb-1">
                          Tác dụng phụ có thể gặp
                        </label>
                        <textarea
                          value={getValue("followUpCare.warningSignsEducation")}
                          onChange={(e) =>
                            updateRecord(
                              "followUpCare.warningSignsEducation",
                              e.target.value
                            )
                          }
                          rows={2}
                          placeholder="Các tác dụng phụ bệnh nhân có thể gặp và cách xử lý..."
                          className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Patient Education Section */}
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="text-md font-medium text-purple-900 mb-3 flex items-center gap-2">
                      <FileCheck className="h-4 w-4" />
                      Giáo dục bệnh nhân
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-purple-800 mb-1">
                          Hiểu biết về bệnh
                        </label>
                        <textarea
                          value={getValue("followUpCare.instructions")}
                          onChange={(e) =>
                            updateRecord(
                              "followUpCare.instructions",
                              e.target.value
                            )
                          }
                          rows={3}
                          placeholder="Giải thích về bệnh, nguyên nhân, diễn biến..."
                          className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-purple-800 mb-1">
                          Tài liệu tham khảo
                        </label>
                        <input
                          type="text"
                          value={getValue("followUpCare.emergencyContacts")}
                          onChange={(e) =>
                            updateRecord(
                              "followUpCare.emergencyContacts",
                              e.target.value
                            )
                          }
                          placeholder="Link website, brochure, video giáo dục..."
                          className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents Tab */}
              {activeTab === "documents" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Tệp đính kèm & xuất bản
                  </h3>

                  {/* Attachments */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                      Tệp đính kèm
                    </h4>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Kéo thả hoặc click để tải lên ảnh/clip/biểu mẫu
                      </p>
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*,.pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => {
                          // Handle file upload logic here
                          console.log("Files selected:", e.target.files);
                        }}
                      />
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Chọn tệp
                      </button>
                    </div>

                    {/* Display uploaded files */}
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        Tệp đã tải lên:
                      </h5>
                      <div className="space-y-2">
                        {getAttachmentsValue("attachments").map(
                          (file: { name: string }, index: number) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                            >
                              <span className="text-sm text-gray-700">
                                {file.name}
                              </span>
                              <button
                                onClick={() => {
                                  // Handle file removal
                                  const attachments =
                                    getAttachmentsValue("attachments");
                                  attachments.splice(index, 1);
                                  updateRecord("attachments", attachments);
                                }}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )
                        )}
                        {(Array.isArray(getValue("attachments"))
                          ? getValue("attachments")
                          : typeof getValue("attachments") === "string" &&
                            getValue("attachments").trim()
                          ? getValue("attachments")
                              .split(",")
                              .map((name: string) => ({ name }))
                          : []
                        ).length === 0 && (
                          <p className="text-sm text-gray-500">
                            Chưa có tệp nào được tải lên
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* PDF URLs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Visit Summary PDF URL
                      </label>
                      <input
                        type="url"
                        value={getValue("visitSummaryPdfUrl")}
                        onChange={(e) =>
                          updateRecord("visitSummaryPdfUrl", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prescription PDF URL
                      </label>
                      <input
                        type="url"
                        value={getValue("prescriptionPdfUrl")}
                        onChange={(e) =>
                          updateRecord("prescriptionPdfUrl", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        readOnly
                      />
                    </div>
                  </div>

                  {/* Audit Log */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                      Nhật ký & kiểm soát
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">
                          Trạng thái khóa:
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="locked"
                            checked={getBooleanValue("locked")}
                            onChange={(e) =>
                              updateRecord("locked", e.target.checked)
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="locked"
                            className="text-sm text-gray-700"
                          >
                            Khóa hồ sơ (final)
                          </label>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">
                          Lịch sử chỉnh sửa:
                        </h5>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {getAuditValue("audit").length > 0 ? (
                            getAuditValue("audit").map(
                              (entry: AuditEntry, index: number) => (
                                <div
                                  key={index}
                                  className="text-xs text-gray-600 p-2 bg-white rounded"
                                >
                                  <span className="font-medium">
                                    {entry.user}
                                  </span>{" "}
                                  - {entry.action} -{" "}
                                  {new Date(entry.timestamp).toLocaleString()}
                                </div>
                              )
                            )
                          ) : (
                            <p className="text-xs text-gray-500">
                              Chưa có lịch sử chỉnh sửa
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons Footer */}
        {!loading && record && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Trạng thái:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    record.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : record.status === "prescription_issued"
                      ? "bg-blue-100 text-blue-800"
                      : record.status === "draft"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {record.status === "completed"
                    ? "Hoàn thành"
                    : record.status === "prescription_issued"
                    ? "Đã phát hành đơn"
                    : record.status === "draft"
                    ? "Nháp"
                    : "Đang xử lý"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Save Draft Button */}
                <button
                  onClick={handleSaveDraft}
                  disabled={saving || !record || record.status === "completed"}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  Lưu nháp
                </button>

                {/* Issue Prescription Button */}
                <button
                  onClick={handleIssuePrescription}
                  disabled={
                    saving ||
                    !record ||
                    record.status === "completed" ||
                    (typeof record.treatment === "object"
                      ? !record.treatment?.medicationsList?.length
                      : true)
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4" />
                  Phát hành đơn
                </button>

                {/* Export Summary Button */}
                <button
                  onClick={handleExportSummary}
                  disabled={!record}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Xuất phiếu tóm tắt
                </button>

                {/* Complete Record Button */}
                <button
                  onClick={handleCompleteRecord}
                  disabled={saving || !record || record.status === "completed"}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Hoàn thành
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalRecordForm;
