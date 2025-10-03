import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import {
  FaArrowLeft,
  FaUserMd,
  FaStethoscope,
  FaHeartbeat,
  FaShieldAlt,
  FaUserPlus,
} from "react-icons/fa";

const LoginDoctor = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password, navigate);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/");
  };

  const handleRegister = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/doctor/register");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-cyan-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating medical icons */}
      <div className="absolute inset-0 pointer-events-none">
        <FaHeartbeat className="absolute top-20 left-20 text-emerald-200 text-2xl animate-pulse" />
        <FaStethoscope className="absolute bottom-32 right-32 text-teal-200 text-3xl animate-bounce" />
        <FaShieldAlt className="absolute top-1/3 right-20 text-cyan-200 text-xl animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-12 text-center relative overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-500/20 animate-pulse"></div>

            {/* Doctor Icon */}
            <div className="relative z-10 mb-6">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30 shadow-lg">
                <FaUserMd className="text-white text-3xl" />
              </div>

              <h1 className="text-3xl font-bold text-white mb-2">
                Cổng Bác Sĩ
              </h1>
              <p className="text-emerald-100 text-sm font-medium">
                Đăng nhập để truy cập hệ thống
              </p>
            </div>

            {/* Decorative wave */}
            <div className="absolute bottom-0 left-0 right-0">
              <svg
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
                className="relative block w-full h-8"
              >
                <path
                  d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                  fill="white"
                  fillOpacity="0.8"
                ></path>
              </svg>
            </div>
          </div>

          {/* Form Section */}
          <div className="px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800 font-medium">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 uppercase tracking-wide"
                >
                  Email Bác Sĩ
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none transition-all duration-300 ease-in-out hover:border-gray-300 text-gray-800 placeholder-gray-400"
                    placeholder="doctor@hospital.com"
                    required
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 uppercase tracking-wide"
                >
                  Mật Khẩu
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none transition-all duration-300 ease-in-out hover:border-gray-300 text-gray-800 placeholder-gray-400"
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-start">
                  <FaShieldAlt className="h-5 w-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-emerald-800 font-semibold text-sm">
                      Bảo Mật Cao
                    </h4>
                    <p className="text-emerald-700 text-xs mt-1">
                      Hệ thống sử dụng mã hóa SSL và xác thực 2 lớp để bảo vệ
                      thông tin y tế.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-4 px-6 rounded-xl hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none uppercase tracking-wide text-sm relative overflow-hidden"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Đang xử lý...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <FaStethoscope className="mr-2" />
                    Đăng Nhập Hệ Thống
                  </div>
                )}

                {/* Shine effect */}
                <div className="absolute inset-0 -top-px bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">
                    hoặc
                  </span>
                </div>
              </div>

              {/* Register Button */}
              <button
                type="button"
                onClick={handleRegister}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none uppercase tracking-wide text-sm relative overflow-hidden"
              >
                <div className="flex items-center justify-center">
                  <FaUserPlus className="mr-2" />
                  Đăng Ký Tài Khoản
                </div>

                {/* Shine effect */}
                <div className="absolute inset-0 -top-px bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>

              {/* Back Button */}
              <button
                type="button"
                onClick={handleBackToHome}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-gray-600 hover:to-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center uppercase tracking-wide text-sm"
              >
                <FaArrowLeft className="mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
                Quay Lại Trang Chủ
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500">
                © 2024 Hệ Thống Y Tế. Bảo mật thông tin bệnh nhân là ưu tiên
                hàng đầu.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info Card */}
        <div className="mt-6 bg-white/60 backdrop-blur-lg rounded-2xl p-6 border border-white/50">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Dành Cho Bác Sĩ
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <FaUserMd className="text-emerald-600 text-xl" />
                </div>
                <p className="text-xs text-gray-600 font-medium">
                  Quản Lý
                  <br />
                  Bệnh Nhân
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto">
                  <FaStethoscope className="text-teal-600 text-xl" />
                </div>
                <p className="text-xs text-gray-600 font-medium">
                  Chẩn Đoán
                  <br />
                  Điện Tử
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mx-auto">
                  <FaHeartbeat className="text-cyan-600 text-xl" />
                </div>
                <p className="text-xs text-gray-600 font-medium">
                  Theo Dõi
                  <br />
                  Sức Khỏe
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes blob {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            33% {
              transform: translate(30px, -50px) scale(1.1);
            }
            66% {
              transform: translate(-20px, 20px) scale(0.9);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}
      </style>
    </div>
  );
};

export default LoginDoctor;
