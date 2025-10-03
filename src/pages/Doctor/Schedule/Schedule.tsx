import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserCheck,
  MessageSquare,
  Filter,
  Search,
  Clock,
  CircleDot,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { getMySchedules } from "../../../api/scheduleApi";

type Shift = {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "pending" | "accepted" | "rejected" | "busy";
  rejectionReason?: string;
  busyReason?: string;
  adminNote?: string;
  isBooked?: boolean;
};

const DoctorSchedulePage: React.FC = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showBusyModal, setShowBusyModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [busyReason, setBusyReason] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const load = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const data = await getMySchedules(user._id);
      const normalized = (data || []).map((s: Shift) => ({
        ...s,
        date: (s.date || "").slice(0, 10),
        startTime: (s.startTime || "").slice(0, 5),
        endTime: (s.endTime || "").slice(0, 5),
      }));
      setShifts(normalized);
    } catch {
      setError("Không tải được ca làm việc");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?._id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "busy":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "busy":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <CircleDot className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "accepted":
        return "Đã chấp nhận";
      case "rejected":
        return "Đã từ chối";
      case "busy":
        return "Đã báo bận";
      default:
        return "Chờ xác nhận";
    }
  };

  const handleAccept = async (shift: Shift) => {
    try {
      const response = await fetch(
        `https://server-medicare.onrender.com/api/doctor/schedule/${shift._id}/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ doctorId: user?._id }),
        }
      );

      if (response.ok) {
        await load();
        setError("");
      } else {
        setError("Không thể chấp nhận ca làm việc");
      }
    } catch {
      setError("Lỗi kết nối");
    }
  };

  const handleReject = async () => {
    if (!selectedShift || !rejectionReason.trim()) return;

    try {
      const response = await fetch(
        `https://server-medicare.onrender.com/api/doctor/schedule/${selectedShift._id}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            doctorId: user?._id,
            rejectionReason: rejectionReason.trim(),
          }),
        }
      );

      if (response.ok) {
        await load();
        setShowRejectModal(false);
        setSelectedShift(null);
        setRejectionReason("");
        setError("");
      } else {
        setError("Không thể từ chối ca làm việc");
      }
    } catch {
      setError("Lỗi kết nối");
    }
  };

  const handleBusy = async () => {
    if (!selectedShift || !busyReason.trim()) return;

    try {
      const response = await fetch(
        `https://server-medicare.onrender.com/api/doctor/schedule/${selectedShift._id}/busy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            doctorId: user?._id,
            busyReason: busyReason.trim(),
          }),
        }
      );

      if (response.ok) {
        await load();
        setShowBusyModal(false);
        setSelectedShift(null);
        setBusyReason("");
        setError("");
      } else {
        setError("Không thể báo bận ca làm việc");
      }
    } catch {
      setError("Lỗi kết nối");
    }
  };

  // Filter shifts based on all filters
  const filteredShifts = shifts.filter((shift) => {
    const matchesDate = !selectedDate || shift.date === selectedDate;
    const matchesStatus = !statusFilter || shift.status === statusFilter;
    const matchesSearch =
      !searchTerm ||
      shift.date.includes(searchTerm) ||
      shift.startTime.includes(searchTerm) ||
      shift.endTime.includes(searchTerm);

    return matchesDate && matchesStatus && matchesSearch;
  });

  const groupedByDate = filteredShifts.reduce((acc, shift) => {
    const date = shift.date || "unknown";
    if (!acc[date]) acc[date] = [];
    acc[date].push(shift);
    return acc;
  }, {} as Record<string, Shift[]>);

  // Get unique dates and statuses for filter options
  const availableDates = [...new Set(shifts.map((shift) => shift.date))].sort();
  const availableStatuses = [...new Set(shifts.map((shift) => shift.status))];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-gradient-to-r from-blue-500 to-teal-400">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Ca làm việc của tôi
            </h1>
            <p className="text-white/90">
              Tổng cộng {shifts.length} ca làm việc
            </p>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto">
        {/* Filters */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-900">Bộ lọc</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Search className="h-4 w-4 inline mr-1" />
                  Tìm kiếm ca làm việc
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo ngày hoặc giờ..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Lọc theo ngày
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tất cả ngày</option>
                  {availableDates.map((date) => (
                    <option key={date} value={date}>
                      {new Date(date + "T00:00:00").toLocaleDateString("vi-VN")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Lọc theo trạng thái
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tất cả trạng thái</option>
                  {availableStatuses.map((status) => (
                    <option key={status} value={status}>
                      {getStatusText(status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {(selectedDate || statusFilter || searchTerm) && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200">
                <span className="text-sm text-slate-600">Đang lọc:</span>
                {searchTerm && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    "{searchTerm}"
                  </span>
                )}
                {selectedDate && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                      "vi-VN"
                    )}
                  </span>
                )}
                {statusFilter && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    {getStatusText(statusFilter)}
                  </span>
                )}
                <button
                  onClick={() => {
                    setSelectedDate("");
                    setStatusFilter("");
                    setSearchTerm("");
                  }}
                  className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm hover:bg-slate-200 transition-colors"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-rose-600" />
              <span className="text-rose-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-slate-700 font-medium">Đang tải...</span>
            </div>
          </div>
        )}

        {/* Results Summary */}
        {!loading && (
          <div className="mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <p className="text-slate-600">
                Hiển thị{" "}
                <span className="font-semibold text-slate-900">
                  {filteredShifts.length}
                </span>{" "}
                trong tổng số{" "}
                <span className="font-semibold text-slate-900">
                  {shifts.length}
                </span>{" "}
                ca làm việc
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {Object.keys(groupedByDate).length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Không có ca làm việc nào
            </h3>
            <p className="text-slate-600">
              {selectedDate || statusFilter || searchTerm
                ? "Không có ca làm việc nào phù hợp với bộ lọc hiện tại"
                : "Bạn chưa có ca làm việc nào"}
            </p>
          </div>
        )}

        {/* Shifts by Date */}
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([date, dateShifts]) => (
            <div key={date}>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Date Header */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-slate-600" />
                      <h2 className="text-lg font-semibold text-slate-900">
                        {new Date(date + "T00:00:00").toLocaleDateString(
                          "vi-VN",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {dateShifts.length} ca làm việc
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shifts */}
                <div className="divide-y divide-slate-100">
                  {dateShifts
                    .sort(
                      (a, b) =>
                        new Date(date + "T" + a.startTime + ":00").getTime() -
                        new Date(date + "T" + b.startTime + ":00").getTime()
                    )
                    .map((shift) => (
                      <div
                        key={shift._id}
                        className="px-6 py-6 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-6">
                          {/* Left: Shift Info */}
                          <div className="flex items-center gap-4 flex-1">
                            {/* Time Display */}
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                              <Clock className="h-4 w-4 text-emerald-600" />
                              <span className="font-mono font-medium text-emerald-700">
                                {shift.startTime} - {shift.endTime}
                              </span>
                            </div>

                            {/* Status Badge */}
                            <div
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor(
                                shift.status
                              )}`}
                            >
                              {getStatusIcon(shift.status)}
                              <span className="font-medium">
                                {getStatusText(shift.status)}
                              </span>
                            </div>

                            {/* Booking Badge */}
                            {shift.isBooked && (
                              <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-lg border border-orange-200">
                                <UserCheck className="h-4 w-4 text-orange-600" />
                                <span className="text-sm font-medium text-orange-700">
                                  Đã đặt
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Right: Actions & Notes */}
                          <div className="flex flex-col gap-4 items-end">
                            {/* Action Buttons */}
                            {shift.status === "pending" && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleAccept(shift)}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 shadow-sm"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Chấp nhận
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedShift(shift);
                                    setShowRejectModal(true);
                                  }}
                                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 shadow-sm"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Từ chối
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedShift(shift);
                                    setShowBusyModal(true);
                                  }}
                                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 shadow-sm"
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                  Báo bận
                                </button>
                              </div>
                            )}

                            {/* Reason/Note Display */}
                            <div className="flex flex-col gap-3 max-w-md">
                              {shift.rejectionReason && (
                                <div className="px-4 py-3 bg-rose-50 rounded-lg border border-rose-200">
                                  <div className="flex items-start gap-3">
                                    <MessageSquare className="h-4 w-4 text-rose-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-semibold text-rose-700 mb-1 uppercase tracking-wide">
                                        Lý do từ chối
                                      </p>
                                      <p className="text-sm text-rose-600 leading-relaxed">
                                        {shift.rejectionReason}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {shift.busyReason && (
                                <div className="px-4 py-3 bg-amber-50 rounded-lg border border-amber-200">
                                  <div className="flex items-start gap-3">
                                    <MessageSquare className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-semibold text-amber-700 mb-1 uppercase tracking-wide">
                                        Lý do bận
                                      </p>
                                      <p className="text-sm text-amber-600 leading-relaxed">
                                        {shift.busyReason}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {shift.adminNote && (
                                <div className="px-4 py-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <div className="flex items-start gap-3">
                                    <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wide">
                                        Ghi chú admin
                                      </p>
                                      <p className="text-sm text-blue-600 leading-relaxed">
                                        {shift.adminNote}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedShift && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-rose-600" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Từ chối ca làm việc
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedShift(null);
                    setRejectionReason("");
                  }}
                  className="text-slate-400 hover:text-slate-600 text-xl transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Lý do từ chối *
                  </label>
                  <textarea
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Vui lòng cung cấp lý do từ chối ca làm việc này..."
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setSelectedShift(null);
                      setRejectionReason("");
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={!rejectionReason.trim()}
                    className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Busy Modal */}
      {showBusyModal && selectedShift && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Báo bận ca làm việc
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowBusyModal(false);
                    setSelectedShift(null);
                    setBusyReason("");
                  }}
                  className="text-slate-400 hover:text-slate-600 text-xl transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Lý do bận *
                  </label>
                  <textarea
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                    rows={4}
                    value={busyReason}
                    onChange={(e) => setBusyReason(e.target.value)}
                    placeholder="Vui lòng cung cấp lý do bận không thể làm việc..."
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowBusyModal(false);
                      setSelectedShift(null);
                      setBusyReason("");
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleBusy}
                    disabled={!busyReason.trim()}
                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Báo bận
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorSchedulePage;
