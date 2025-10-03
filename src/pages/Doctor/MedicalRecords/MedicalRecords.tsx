import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Search,
  Filter,
  Calendar,
  User,
  Eye,
  Edit,
  CheckCircle,
  AlertCircle,
  Plus,
} from "lucide-react";
import MedicalRecordForm from "../../../components/Doctor/MedicalRecord/MedicalRecordForm";
import {
  MedicalRecord,
  getDoctorMedicalRecords,
} from "../../../api/medicalRecordApi";
import {
  getDoctorAppointments,
  DoctorAppointment,
} from "../../../api/doctorApi";
import { useAuth } from "../../../contexts/AuthContext";

const MedicalRecords: React.FC = () => {
  const { user } = useAuth();
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Load appointments and medical records
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const doctorId = user?._id;
      if (!doctorId) return;

      // Load appointments with status that can have medical records
      const appointmentsData = await getDoctorAppointments(doctorId);
      const relevantAppointments = appointmentsData.filter((apt) =>
        [
          "completed",
          "confirmed",
          "paid",
          "prescription_issued",
          "final",
          "closed",
        ].includes(apt.status)
      );
      setAppointments(relevantAppointments);

      // Load medical records
      try {
        const recordsData = await getDoctorMedicalRecords(doctorId);
        setMedicalRecords(recordsData || []);
      } catch (error) {
        console.error("Error loading medical records:", error);
        setMedicalRecords([]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    if (user?._id) {
      loadData();
    }
  }, [user?._id, loadData]);

  // Filter records based on search and status
  const filteredRecords = medicalRecords.filter((record) => {
    const matchesSearch =
      record.patientInfo?.fullName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      record.appointmentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.diagnosis?.primaryDiagnosis
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || record.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Get appointments that don't have medical records yet
  const appointmentsWithoutRecords = appointments.filter(
    (apt) => !medicalRecords.some((record) => record.appointmentId === apt._id)
  );

  const handleViewRecord = (recordId: string) => {
    setSelectedRecord(recordId);
    setIsFormOpen(true);
  };

  const handleCreateRecord = (appointmentId: string) => {
    setSelectedRecord(appointmentId);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedRecord(null);
    loadData(); // Reload data after form closes
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      {
        color: string;
        label: string;
        icon: React.ComponentType<{ className?: string }>;
      }
    > = {
      draft: {
        color: "bg-yellow-100 text-yellow-800",
        label: "Nháp",
        icon: Edit,
      },
      completed: {
        color: "bg-green-100 text-green-800",
        label: "Hoàn thành",
        icon: CheckCircle,
      },
      prescription_issued: {
        color: "bg-blue-100 text-blue-800",
        label: "Đã phát đơn",
        icon: FileText,
      },
    };

    const config = statusConfig[status] || {
      color: "bg-gray-100 text-gray-800",
      label: status,
      icon: AlertCircle,
    };
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải hồ sơ bệnh án...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                Hồ sơ bệnh án
              </h1>
              <p className="text-gray-600 mt-1">
                Quản lý hồ sơ bệnh án từ các lịch hẹn đã hoàn thành
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Tổng số: {medicalRecords.length} hồ sơ</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên bệnh nhân, mã lịch hẹn, chẩn đoán..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="draft">Nháp</option>
                <option value="completed">Hoàn thành</option>
                <option value="prescription_issued">Đã phát đơn</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appointments without medical records */}
        {appointmentsWithoutRecords.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              Lịch hẹn cần tạo hồ sơ bệnh án (
              {appointmentsWithoutRecords.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appointmentsWithoutRecords.map((appointment) => (
                <div
                  key={appointment._id}
                  className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 hover:bg-yellow-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {appointment.patientId.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(
                          appointment.scheduleId.date
                        ).toLocaleDateString("vi-VN")}{" "}
                        - {appointment.scheduleId.startTime}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {appointment.symptoms || "Không có triệu chứng"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCreateRecord(appointment._id)}
                      className="ml-2 p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      title="Tạo hồ sơ bệnh án"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medical Records List */}
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Danh sách hồ sơ bệnh án ({filteredRecords.length})
            </h2>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không có hồ sơ bệnh án
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== "all"
                  ? "Không tìm thấy hồ sơ phù hợp với bộ lọc"
                  : "Chưa có hồ sơ bệnh án nào"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <div
                  key={record._id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {record.patientInfo?.fullName || "Không rõ tên"}
                        </h3>
                        {getStatusBadge(record.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {record.createdAt
                              ? new Date(record.createdAt).toLocaleDateString(
                                  "vi-VN"
                                )
                              : "Không rõ ngày"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>
                            Tuổi:{" "}
                            {record.patientInfo?.birthYear
                              ? new Date().getFullYear() -
                                record.patientInfo.birthYear
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>
                            {record.diagnosis?.primaryDiagnosis ||
                              record.preliminaryDiagnosis ||
                              "Chưa có chẩn đoán"}
                          </span>
                        </div>
                      </div>

                      {record.symptoms?.chiefComplaint && (
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Triệu chứng:</strong>{" "}
                          {record.symptoms.chiefComplaint}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleViewRecord(record.appointmentId)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Xem/Chỉnh sửa hồ sơ"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Medical Record Form Modal */}
      {isFormOpen && selectedRecord && (
        <MedicalRecordForm
          appointmentId={selectedRecord}
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSave={() => {
            // Reload data after saving
            loadData();
          }}
        />
      )}
    </div>
  );
};

export default MedicalRecords;
