import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import styles from "../../../styles/Auth.module.css";
import { FaArrowLeftLong } from "react-icons/fa6";
import { toast } from "react-toastify";

const RegisterForm: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      // Tạo object data cho patient register
      const userData = {
        name,
        email,
        password,
      };

      // Debug: log data gửi đi
      console.log("Sending registration data:", {
        name,
        email,
        password: "***",
      });

      await register(userData);
      toast.success("Đăng ký thành công!");
      navigate("/");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error("Registration error:", error);
      console.error("Response data:", error?.response?.data);
      setError(error?.response?.data?.message || "Đăng ký thất bại");
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
        <label htmlFor="register-name">Họ và tên</label>
        <input
          type="text"
          id="register-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.authFormControl}
          required
        />
      </div>
      <div className={styles.authFormGroup}>
        <label htmlFor="register-email">Email</label>
        <input
          type="email"
          id="register-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.authFormControl}
          required
        />
      </div>
      <div className={styles.authFormGroup}>
        <label htmlFor="register-password">Mật khẩu</label>
        <input
          type="password"
          id="register-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.authFormControl}
          required
        />
      </div>
      <div className={styles.authFormGroup}>
        <label htmlFor="register-confirm-password">Xác nhận mật khẩu</label>
        <input
          type="password"
          id="register-confirm-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={styles.authFormControl}
          required
        />
      </div>
      <button type="submit" className={styles.authSubmitBtn}>
        Đăng ký
      </button>
      <div className="mt-4">
        <button
          type="button"
          className="bg-gray-700 hover:bg-gray-600 text-white w-full py-2 rounded-full flex items-center justify-center transition-colors duration-300"
          onClick={handleBackToHome}
        >
          <FaArrowLeftLong className="mr-2" />
          Quay lại trang chủ
        </button>
      </div>
    </form>
  );
};

export default RegisterForm;
