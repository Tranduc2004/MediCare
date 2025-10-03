import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import {
  Home,
  Calendar,
  Users,
  FileText,
  Settings,
  LogOut,
  X,
  User as UserIcon,
} from "lucide-react";
import { specialtyApi } from "../../../api/specialtyApi";

interface Specialty {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

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

  const sidebarItems = [
    { icon: Home, label: "Trang chủ", path: "/doctor/home" },
    { icon: Calendar, label: "Lịch làm việc", path: "/doctor/schedule" },
    { icon: Users, label: "Bệnh nhân", path: "/doctor/patients" },
    { icon: FileText, label: "Hồ sơ bệnh án", path: "/doctor/medical-records" },
    { icon: Calendar, label: "Lịch hẹn", path: "/doctor/appointments" },
    { icon: Settings, label: "Cài đặt", path: "/doctor/settings" },
    { icon: UserIcon, label: "Hồ sơ", path: "/doctor/profile" },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    navigate("/doctor/login");
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-teal-500 rounded-xl">
              <Home className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">
              <span className="text-blue-600">Medi</span>
              <span className="text-teal-500">Care</span>
            </h1>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md lg:hidden hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {sidebarItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <div
                key={index}
                className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg"
                    : "text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-teal-50 hover:text-gray-900"
                }`}
                onClick={() => handleNavigation(item.path)}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
                {isActive && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.name?.[0] || "B"}
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-gray-900">BS. {user?.name}</p>
              <p className="text-sm text-gray-600">
                {getSpecialtyName(user?.specialty || "")}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full mt-3 flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default Sidebar;
