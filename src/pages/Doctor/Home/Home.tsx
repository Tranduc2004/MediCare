import {
  Users,
  FileText,
  Plus,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Bell,
  Check,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { specialtyApi } from "../../../api/specialtyApi";
import useUnreadNotifications from "../../../components/Notifications/useUnreadNotifications";
import { useNotificationAlerts } from "../../Patient/Notifications/useNotificationAlerts";
import useNotifications from "../../../hooks/useNotifications";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../api/axiosConfig";
import {
  getDashboardStats,
  getTodayAppointments,
  getRecentActivities,
  type DoctorAppointment,
} from "../../../api/doctorApi";

interface Specialty {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
}

interface NotificationItem {
  _id: string;
  title: string;
  body?: string;
  read?: boolean;
  createdAt: string;
}

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [showAvatar, setShowAvatar] = useState(true);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Notification system
  const unreadCount = useUnreadNotifications();
  const { notify } = useNotificationAlerts({
    title: "Thông báo mới",
    soundUrl: "/sound/new-notification-010-352755.mp3",
  });

  // Socket realtime notifications
  const tokenKey = "doctor_token";
  const token =
    (typeof window !== "undefined" &&
      (window.sessionStorage.getItem(tokenKey) ??
        window.localStorage.getItem(tokenKey))) ||
    null;
  useNotifications(token, user?._id ?? null);

  // Notification alerts
  useEffect(() => {
    let prev = 0;
    try {
      prev = Number(sessionStorage.getItem("_nc_prev_doctor") || "0");
    } catch {
      prev = 0;
    }
    if (unreadCount > prev) {
      notify(unreadCount, "Bạn có thông báo mới");
    }
    try {
      sessionStorage.setItem("_nc_prev_doctor", String(unreadCount));
    } catch {
      // ignore
    }
  }, [unreadCount, notify]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!isNotificationOpen) return;
      const el = notificationRef.current;
      if (el && !el.contains(e.target as Node)) setIsNotificationOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsNotificationOpen(false);
    }
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [isNotificationOpen]);

  // Fetch notifications
  const { data: notificationData, refetch: refetchNotifications } = useQuery({
    queryKey: ["notifications", user?._id],
    queryFn: async () => {
      if (!token || !user?._id) {
        const res = await api.get("/notifications?limit=5&public=1");
        return res.data;
      }
      const res = await api.get(
        `/notifications?userId=${encodeURIComponent(String(user._id))}&limit=5`
      );
      return res.data;
    },
    staleTime: 30_000,
  });

  // Mark notifications as read
  const markRead = async (ids: string[]) => {
    try {
      if (!ids.length) return;
      await api.post("/notifications/mark-read", { ids, userId: user?._id });
      qc.invalidateQueries({ queryKey: ["notifications", user?._id] });
      qc.invalidateQueries({ queryKey: ["notifications", "unreadCount"] });
    } catch {
      // silent
    }
  };

  const notifications: NotificationItem[] = notificationData?.items ?? [];

  // Helper function for time formatting
  const timeAgo = (iso?: string) => {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s trước`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h trước`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d} ngày trước`;
    return new Date(iso).toLocaleString();
  };

  const getAvatarSrc = (avatar?: string) => {
    if (!avatar) return "";
    if (/^https?:\/\//i.test(avatar)) return encodeURI(avatar);
    try {
      const base = "https://server-medicare.onrender.com";
      const path = avatar.startsWith("/") ? avatar : `/${avatar}`;
      return base + encodeURI(path);
    } catch {
      return avatar;
    }
  };

  // Fetch specialties to get specialty names
  useEffect(() => {
    const loadSpecialties = async () => {
      try {
        const data = await specialtyApi.getActiveSpecialties();
        setSpecialties(data || []);
      } catch (error) {
        console.error("Error loading specialties:", error);
      }
    };
    loadSpecialties();
  }, []);

  // Get specialty name by ID
  const getSpecialtyName = (specialtyId: string) => {
    const specialty = specialties.find((s) => s._id === specialtyId);
    return specialty ? specialty.name : "Không xác định";
  };

  // Fetch dashboard statistics
  const {
    data: dashboardStats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["dashboardStats", user?._id],
    queryFn: () => getDashboardStats(user?._id || ""),
    enabled: !!user?._id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  });

  const stats = [
    {
      title: "Bệnh nhân hôm nay",
      value: statsLoading
        ? "..."
        : dashboardStats?.todayAppointments?.toString() || "0",
      icon: Users,
      color: "bg-blue-500",
      change: statsLoading
        ? "..."
        : `${(dashboardStats?.percentageChange?.patients ?? 0) > 0 ? "+" : ""}${
            dashboardStats?.percentageChange?.patients ?? 0
          }%`,
    },
    {
      title: "Cuộc hẹn đã xác nhận",
      value: statsLoading
        ? "..."
        : dashboardStats?.completedAppointments?.toString() || "0",
      icon: CheckCircle,
      color: "bg-green-500",
      change: statsLoading
        ? "..."
        : `${
            (dashboardStats?.percentageChange?.completed ?? 0) > 0 ? "+" : ""
          }${dashboardStats?.percentageChange?.completed ?? 0}%`,
    },
    {
      title: "Đang chờ khám",
      value: statsLoading
        ? "..."
        : dashboardStats?.pendingAppointments?.toString() || "0",
      icon: Clock,
      color: "bg-orange-500",
      change: statsLoading
        ? "..."
        : `${(dashboardStats?.percentageChange?.pending ?? 0) > 0 ? "+" : ""}${
            dashboardStats?.percentageChange?.pending ?? 0
          }%`,
    },
    {
      title: "Đã hủy",
      value: statsLoading
        ? "..."
        : dashboardStats?.cancelledAppointments?.toString() || "0",
      icon: AlertCircle,
      color: "bg-red-500",
      change: statsLoading
        ? "..."
        : `${
            (dashboardStats?.percentageChange?.cancelled ?? 0) > 0 ? "+" : ""
          }${dashboardStats?.percentageChange?.cancelled ?? 0}%`,
    },
  ];

  // Fetch today's appointments
  const {
    data: todayAppointments,
    isLoading: appointmentsLoading,
    error: appointmentsError,
  } = useQuery({
    queryKey: ["todayAppointments", user?._id],
    queryFn: () => {
      console.log("Fetching appointments for user:", user);
      return getTodayAppointments(user?._id || "");
    },
    enabled: !!user?._id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 60 * 1000, // Refresh every minute
  });

  console.log("Today appointments data:", todayAppointments);
  console.log("Appointments loading:", appointmentsLoading);
  console.log("Appointments error:", appointmentsError);

  // Process appointments data with better error handling
  const upcomingAppointments = (todayAppointments || []).map(
    (apt: DoctorAppointment) => {
      // Get status display info
      const getStatusInfo = (status: string) => {
        switch (status) {
          case "completed":
          case "prescription_issued":
          case "final":
          case "closed":
            return {
              text: "Hoàn thành",
              color: "bg-green-100 text-green-800",
              showCheck: true,
            };
          case "confirmed":
          case "paid":
            return {
              text: "Đã xác nhận",
              color: "bg-blue-100 text-blue-800",
              showCheck: false,
            };
          case "booked":
          case "await_payment":
            return {
              text: "Chờ xác nhận",
              color: "bg-yellow-100 text-yellow-800",
              showCheck: false,
            };
          case "waiting":
            return {
              text: "Đang chờ",
              color: "bg-orange-100 text-orange-800",
              showCheck: false,
            };
          case "cancelled":
            return {
              text: "Đã hủy",
              color: "bg-red-100 text-red-800",
              showCheck: false,
            };
          default:
            return {
              text: "Chờ xác nhận",
              color: "bg-gray-100 text-gray-800",
              showCheck: false,
            };
        }
      };

      const statusInfo = getStatusInfo(apt.status);

      return {
        id: apt._id,
        patient: apt.patientId?.name || "Không xác định",
        time:
          apt.scheduleId?.startTime || apt.appointmentTime || "Chưa xác định",
        type: apt.symptoms ? "Khám bệnh" : "Khám tổng quát",
        status: apt.status,
        statusInfo,
        symptoms: apt.symptoms,
      };
    }
  );

  // Fetch recent activities
  const {
    data: recentActivitiesData,
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useQuery({
    queryKey: ["recentActivities", user?._id],
    queryFn: () => getRecentActivities(user?._id || ""),
    enabled: !!user?._id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
  });

  const recentActivities = recentActivitiesData || [];

  return (
    <div className="p-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-teal-500 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-4">
            {user?.avatar && showAvatar ? (
              <img
                src={getAvatarSrc(user.avatar)}
                alt={user?.name}
                className="h-14 w-14 rounded-full object-cover"
                onError={() => setShowAvatar(false)}
              />
            ) : (
              <div className="h-14 w-14 bg-white/20 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                {user?.name?.[0] || "B"}
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold">
                Chào mừng trở lại, BS. {user?.name}
              </h2>
              <p className="text-blue-100">
                Chuyên khoa: {getSpecialtyName(user?.specialty || "")} •{" "}
                {user?.workplace || "Chưa cập nhật"}
              </p>
            </div>

            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Thông báo"
              >
                <Bell className="h-6 w-6 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium min-w-[18px] h-[18px] px-1">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Thông báo
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => refetchNotifications()}
                          className="p-1 rounded-lg hover:bg-gray-100"
                          title="Làm mới"
                        >
                          <RefreshCw className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => navigate("/doctor/notifications")}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Xem tất cả
                        </button>
                      </div>
                    </div>
                    {unreadCount > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        {unreadCount} thông báo chưa đọc
                      </p>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">Không có thông báo</p>
                      </div>
                    ) : (
                      <div className="p-2">
                        {notifications.map((notification) => (
                          <div
                            key={notification._id}
                            className={`p-3 rounded-lg mb-2 transition-colors ${
                              notification.read
                                ? "bg-gray-50"
                                : "bg-blue-50 border border-blue-200"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={`mt-1 h-2 w-2 rounded-full ${
                                  notification.read
                                    ? "bg-gray-300"
                                    : "bg-blue-500"
                                }`}
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">
                                  {notification.title}
                                </h4>
                                {notification.body && (
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {notification.body}
                                  </p>
                                )}
                                <div className="flex items-center justify-between mt-2">
                                  <time className="text-xs text-gray-500">
                                    {timeAgo(notification.createdAt)}
                                  </time>
                                  {!notification.read && (
                                    <button
                                      onClick={() =>
                                        markRead([notification._id])
                                      }
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs"
                                    >
                                      <Check className="h-3 w-3" />
                                      Đánh dấu đã đọc
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-gray-200">
                      <button
                        onClick={() =>
                          markRead(
                            notifications
                              .filter((n) => !n.read)
                              .map((n) => n._id)
                          )
                        }
                        className="w-full px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        Đánh dấu tất cả đã đọc
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                className="bg-white text-blue-600 px-5 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                onClick={() => navigate("/doctor/appointments")}
              >
                Bắt đầu khám bệnh
              </button>
              <button
                className="border border-white text-white px-5 py-2 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                onClick={() => navigate("/doctor/schedule")}
              >
                Xem ca làm việc
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsLoading ? (
          // Loading skeleton for stats
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ))
        ) : statsError ? (
          <div className="col-span-full bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">
                Không thể tải thống kê. Vui lòng thử lại sau.
              </p>
            </div>
          </div>
        ) : (
          stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                  <p
                    className={`text-sm mt-2 ${
                      stat.change.startsWith("+")
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {stat.change} so với hôm qua
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Appointments */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Lịch hẹn hôm nay
                </h3>
                <button
                  onClick={() => navigate("/doctor/appointments")}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Xem tất cả
                </button>
              </div>
            </div>
            <div className="p-6">
              {appointmentsLoading ? (
                // Loading skeleton for appointments
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg animate-pulse"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : appointmentsError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <p className="text-red-700">
                      Không thể tải lịch hẹn. Vui lòng thử lại sau.
                    </p>
                  </div>
                </div>
              ) : upcomingAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Không có lịch hẹn nào hôm nay</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Hãy kiểm tra lại lịch làm việc hoặc tạo lịch hẹn mới
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {appointment.patient}
                          </p>
                          <p className="text-sm text-gray-600">
                            {appointment.type}
                          </p>
                          {appointment.symptoms && (
                            <p className="text-xs text-gray-500 mt-1">
                              Triệu chứng: {appointment.symptoms}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {appointment.time}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${appointment.statusInfo.color}`}
                          >
                            {appointment.statusInfo.text}
                          </span>
                          {appointment.statusInfo.showCheck && (
                            <div className="flex items-center justify-center w-5 h-5 bg-green-500 rounded-full">
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activities */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Thao tác nhanh
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <button className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <Plus className="h-6 w-6 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-blue-600">
                    Tạo hồ sơ mới
                  </span>
                </button>
                <button
                  onClick={() => navigate("/doctor/medical-records")}
                  className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Eye className="h-6 w-6 text-green-600 mb-2" />
                  <span className="text-sm font-medium text-green-600">
                    Xem bệnh án
                  </span>
                </button>
                <button className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <FileText className="h-6 w-6 text-purple-600 mb-2" />
                  <span className="text-sm font-medium text-purple-600">
                    Đặt lịch hẹn
                  </span>
                </button>
                <button className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                  <FileText className="h-6 w-6 text-orange-600 mb-2" />
                  <span className="text-sm font-medium text-orange-600">
                    Viết đơn thuốc
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Hoạt động gần đây
              </h3>
            </div>
            <div className="p-6">
              {activitiesLoading ? (
                // Loading skeleton for activities
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 animate-pulse"
                    >
                      <div className="mt-1 h-2 w-2 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activitiesError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <p className="text-red-700">
                      Không thể tải hoạt động gần đây. Vui lòng thử lại sau.
                    </p>
                  </div>
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Chưa có hoạt động nào gần đây</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3"
                    >
                      <div
                        className={`mt-1 h-2 w-2 rounded-full ${activity.color}`}
                      ></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.action}
                        </p>
                        <p className="text-sm text-gray-600">
                          {activity.patient}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
