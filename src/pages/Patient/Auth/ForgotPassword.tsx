import { useState } from "react";
import { forgotPassword } from "../../../api/authApi";
import { toast } from "react-toastify";
import { FaArrowLeftLong } from "react-icons/fa6";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Vui lòng nhập email");
      return;
    }
    try {
      setLoading(true);
      const res = await forgotPassword({ email });
      toast.success(res.data?.message || "Nếu email tồn tại, liên kết đã gửi");
      // if (res.data?.token) setDevToken(res.data.token); // Removed due to undefined function
      // if (res.data?.token) setDevToken(res.data.token);
    } catch (err) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Có lỗi xảy ra";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-10 px-4">
      {/* Card container ~1000px, rounded, shadow */}
      <div className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden bg-white shadow-[0_15px_30px_rgba(0,0,0,0.1)]">
        {/* LEFT: Form */}
        <div className="flex items-center justify-center p-8 sm:p-10">
          <div className="w-full max-w-md">
            {/* Brand */}
            <div className="mb-6 text-3xl font-extrabold tracking-tight">
              <span className="text-gray-900">Medi</span>
              <span className="text-teal-500">Care</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
              Quên mật khẩu?
            </h2>
            <p className="text-gray-600 mb-8">
              Đừng lo lắng! Nhập email của bạn và chúng tôi sẽ gửi cho bạn liên
              kết để đặt lại mật khẩu.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="forgot-email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="forgot-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-teal-200 focus:border-teal-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 px-4 py-3 text-white font-semibold shadow-sm transition-transform duration-150 hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg
                      className="mr-2 h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Đang gửi...
                  </>
                ) : (
                  "Gửi liên kết đặt lại"
                )}
              </button>
            </form>

            {/* Secondary actions */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleBackToLogin}
                disabled={loading}
                className="inline-flex items-center gap-2 w-full justify-center rounded-lg bg-gradient-to-r from-gray-600 to-gray-700 px-4 py-2.5 text-white font-medium shadow-sm transition-all duration-200 hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FaArrowLeftLong className="text-white" />
                Quay lại đăng nhập
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Gradient info panel (hidden on small screens) */}
        <div className="relative hidden lg:flex items-center justify-center p-10 text-white overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-teal-500 to-emerald-500" />
          {/* Radial pulse overlay (replaces ::before) */}
          <div className="pointer-events-none absolute -inset-[12%] bg-[radial-gradient(circle,rgba(255,255,255,0.20)_0%,transparent_70%)] animate-pulse" />

          <div className="relative z-10 max-w-md text-center">
            <div className="mb-4 text-3xl font-extrabold">
              <span className="text-white">Medi</span>
              <span className="text-white/90">Care</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-semibold mb-3">
              Khôi phục tài khoản
            </h3>
            <p className="mb-8 text-white/90">
              Chúng tôi sẽ giúp bạn lấy lại quyền truy cập vào tài khoản một
              cách an toàn và nhanh chóng.
            </p>

            <div className="mx-auto w-56 h-56 rounded-2xl shadow-xl backdrop-blur-md bg-white/10 flex items-center justify-center text-6xl">
              🔐
            </div>

            <ul className="mt-10 space-y-3 text-left inline-block text-white/95">
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 font-bold">
                  ✓
                </span>{" "}
                Bảo mật cao với mã xác thực
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 font-bold">
                  ✓
                </span>{" "}
                Liên kết có thời hạn 1 giờ
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 font-bold">
                  ✓
                </span>{" "}
                Hỗ trợ 24/7
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
