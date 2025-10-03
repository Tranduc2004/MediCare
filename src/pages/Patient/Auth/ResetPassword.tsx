import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { resetPassword } from "../../../api/authApi";
import { toast } from "react-toastify";
import { FaArrowLeftLong, FaKey, FaEye, FaEyeSlash } from "react-icons/fa6";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) setToken(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Thiếu token");
      return;
    }
    if (!password || password.length < 6) {
      toast.error("Mật khẩu tối thiểu 6 ký tự");
      return;
    }
    if (password !== confirm) {
      toast.error("Mật khẩu nhập lại không khớp");
      return;
    }

    try {
      setLoading(true);
      const res = await resetPassword({ token, password });
      toast.success(res.data?.message || "Đặt lại mật khẩu thành công");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Có lỗi xảy ra";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-10 px-4">
      {/* Card container */}
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
              Đặt lại mật khẩu
            </h2>
            <p className="text-gray-600 mb-8">
              Tạo mật khẩu mới cho tài khoản của bạn. Hãy chọn một mật khẩu mạnh
              và dễ nhớ.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Token */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="reset-token"
                  className="text-sm font-medium text-gray-700"
                >
                  Token xác thực
                </label>
                <input
                  id="reset-token"
                  value={token}
                  readOnly
                  tabIndex={-1} // không thể focus bằng bàn phím
                  onFocus={(e) => e.currentTarget.blur()} // lỡ focus thì blur ngay
                  onMouseDown={(e) => e.preventDefault()} // chặn click đặt caret
                  onKeyDown={(e) => e.preventDefault()} // chặn nhập từ bàn phím
                  className="
    w-full rounded-lg border border-gray-300 px-3 py-2
    bg-gray-100 text-gray-500 cursor-not-allowed
    select-none caret-transparent pointer-events-none
  "
                  aria-disabled="true"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="reset-password"
                  className="text-sm font-medium text-gray-700"
                >
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="reset-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-11 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-teal-200 focus:border-teal-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    disabled={loading}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Confirm */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="reset-confirm"
                  className="text-sm font-medium text-gray-700"
                >
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="reset-confirm"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-11 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-teal-200 focus:border-teal-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Nhập lại mật khẩu mới"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    disabled={loading}
                    aria-label={
                      showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                    }
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 px-4 py-3 text-white font-semibold shadow-sm transition-transform duration-150 hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <FaKey />
                {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
              </button>
            </form>

            {/* Secondary */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => navigate("/login")}
                disabled={loading}
                className="inline-flex items-center gap-2 w-full justify-center rounded-lg bg-gradient-to-r from-gray-600 to-gray-700 px-4 py-2.5 text-white font-medium shadow-sm transition-all duration-200 hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FaArrowLeftLong className="text-white" />
                Quay lại đăng nhập
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Gradient info panel */}
        <div className="relative hidden lg:flex items-center justify-center p-10 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-teal-500 to-emerald-500" />
          <div className="pointer-events-none absolute -inset-[12%] bg-[radial-gradient(circle,rgba(255,255,255,0.20)_0%,transparent_70%)] animate-pulse" />

          <div className="relative z-10 max-w-md text-center">
            <h3 className="text-2xl sm:text-3xl font-semibold mb-3">
              Tạo mật khẩu mới
            </h3>
            <p className="mb-8 text-white/90">
              Bảo vệ tài khoản của bạn với mật khẩu mạnh và an toàn.
            </p>

            <div className="mx-auto w-56 h-56 rounded-2xl shadow-xl backdrop-blur-md bg-white/10 flex items-center justify-center text-6xl">
              🔑
            </div>

            <ul className="mt-10 space-y-3 text-left inline-block text-white/95">
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 font-bold">
                  ✓
                </span>{" "}
                Mật khẩu tối thiểu 6 ký tự
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 font-bold">
                  ✓
                </span>{" "}
                Kết hợp chữ hoa, chữ thường và số
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 font-bold">
                  ✓
                </span>{" "}
                Tránh thông tin cá nhân dễ đoán
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
