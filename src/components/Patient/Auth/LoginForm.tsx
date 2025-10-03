import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import styles from "../../../styles/Auth.module.css";
import { FaArrowLeftLong, FaStethoscope } from "react-icons/fa6";
import { toast } from "react-toastify";

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDoctorLoading, setIsDoctorLoading] = useState(false);

  const navigate = useNavigate();
  const { login, user } = useAuth();

  // Kiểm tra role khi component mount
  useEffect(() => {
    if (user && user.role && user.role.toLowerCase() !== "patient") {
      console.error("Role không hợp lệ:", user.role);
      console.error("Expected: patient, Got:", user.role);
      toast.error(
        "Tài khoản không phải bệnh nhân! Vui lòng đăng nhập đúng trang."
      );
      setError(
        "Tài khoản không phải bệnh nhân! Vui lòng đăng nhập đúng trang."
      );
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password, navigate);
    } catch {
      setError("Đăng nhập thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoctorLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDoctorLoading(true);

    // Simulate doctor login logic
    try {
      // Add your doctor login logic here
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      toast.info("Chuyển hướng đến trang đăng nhập bác sĩ...");
      navigate("/doctor/login");
    } catch {
      toast.error("Có lỗi xảy ra khi chuyển hướng");
    } finally {
      setIsDoctorLoading(false);
    }
  };

  const handleBackToHome = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <form onSubmit={handleSubmit} className={styles.authForm}>
      {error && <div className={styles.authErrorMessage}>{error}</div>}

      <div className={styles.authFormGroup}>
        <label htmlFor="login-email">Email</label>
        <input
          type="email"
          id="login-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-11 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-teal-200 focus:border-teal-500 disabled:opacity-60 disabled:cursor-not-allowed"
          required
          disabled={isLoading}
        />
      </div>

      <div className={styles.authFormGroup}>
        <label htmlFor="login-password">Mật khẩu</label>
        <input
          type="password"
          id="login-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.authFormControl}
          required
          disabled={isLoading}
        />
      </div>

      <div className={styles.authRememberMe}>
        <input
          type="checkbox"
          id="login-remember"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          disabled={isLoading}
        />
        <label htmlFor="login-remember">Ghi nhớ đăng nhập</label>
      </div>

      <div className={styles.authForgotPassword}>
        <Link to="/forgot-password" className={styles.authForgotLink}>
          Quên mật khẩu?
        </Link>
      </div>

      {/* Primary Actions */}
      <div className={styles.authPrimaryActions}>
        <button
          type="submit"
          className={`w-full px-4 py-2 bg-teal-500 text-white rounded-md hover:opacity-90 transition duration-200 hover:bg-teal-600 ${
            isLoading ? "loading" : ""
          }`}
          disabled={isLoading}
        >
          {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </div>

      {/* Secondary Actions */}
      <div className={styles.authSecondaryActions}>
        <button
          type="button"
          className={`${styles.authDoctorBtn} ${
            isDoctorLoading ? "loading" : ""
          }`}
          onClick={handleDoctorLogin}
          disabled={isLoading || isDoctorLoading}
        >
          <FaStethoscope className={styles.authStethoscopeIcon} />
          {isDoctorLoading ? "Đang chuyển hướng..." : "Tôi là bác sĩ"}
        </button>

        <div className={styles.authButtonDivider}>
          <span>hoặc</span>
        </div>

        <button
          type="button"
          className={styles.authBackBtn}
          onClick={handleBackToHome}
          disabled={isLoading}
        >
          <FaArrowLeftLong className={styles.authBackIcon} />
          Quay lại trang chủ
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
