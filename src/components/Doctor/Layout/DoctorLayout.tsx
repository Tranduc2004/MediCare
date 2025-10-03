import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import Sidebar from "./Sidebar";
import { Bell, Menu, Search } from "lucide-react";
import { BsChatDots } from "react-icons/bs";
import { getUnreadCount } from "../../../api/chatApi";
import { Link } from "react-router-dom";
import { specialtyApi } from "../../../api/specialtyApi";

interface Specialty {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
}

interface DoctorLayoutProps {
  children: React.ReactNode;
}

const DoctorLayout: React.FC<DoctorLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const { user } = useAuth();
  const [showAvatar, setShowAvatar] = useState(true);

  const getAvatarSrc = (avatar?: string) => {
    if (!avatar) return "";
    // If already an absolute URL, return encoded
    if (/^https?:\/\//i.test(avatar)) return encodeURI(avatar);
    // Otherwise prefix with backend origin and ensure proper encoding
    try {
      const base = "https://server-medicare.onrender.com";
      // Trim leading slashes to avoid double slashes
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
    if (!specialtyId) return "Bác sĩ";
    const specialty = specialties.find((s) => s._id === specialtyId);
    return specialty ? specialty.name : "Bác sĩ";
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-md lg:hidden hover:bg-gray-100"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">
                Doctor Dashboard
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm bệnh nhân..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full"></span>
              </button>
              <DoctorChatIcon />
              <div className="flex items-center space-x-3">
                {user?.avatar && showAvatar ? (
                  <img
                    src={getAvatarSrc(user.avatar)}
                    alt={user?.name}
                    className="h-8 w-8 rounded-full object-cover"
                    onError={() => setShowAvatar(false)}
                  />
                ) : (
                  <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user?.name?.[0] || "B"}
                    </span>
                  </div>
                )}
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    BS. {user?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getSpecialtyName(user?.specialty || "")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default DoctorLayout;

function DoctorChatIcon() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let timer: number | null = null;
    const load = async () => {
      if (user?._id) {
        try {
          const { count } = await getUnreadCount({
            role: "doctor",
            doctorId: user._id,
          });
          setUnread(count);
        } catch {
          // ignore
        }
      } else {
        setUnread(0);
      }
    };
    load();
    timer = window.setInterval(load, 7000) as unknown as number;
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [user?._id]);

  return (
    <Link
      to="/doctor/messages"
      className="relative p-2 text-gray-600 hover:text-gray-900"
    >
      <BsChatDots className="h-6 w-6" />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs px-1.5 py-0.5">
          {unread}
        </span>
      )}
    </Link>
  );
}
