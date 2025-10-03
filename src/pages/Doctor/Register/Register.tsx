import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import styles from "../../../styles/Auth.module.css";
import { FaArrowLeftLong } from "react-icons/fa6";
import { toast } from "react-toastify";
import specialtyApi, { ISpecialty } from "../../../api/specialtyApi";

const RegisterDoctor = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    specialty: "",
    experience: "",
    workplace: "",
    license: null as File | null,
  });
  const [specialties, setSpecialties] = useState<ISpecialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { register } = useAuth();

  // Lấy danh sách chuyên khoa khi component mount
  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const data = await specialtyApi.getActiveSpecialties();
        setSpecialties(data);
      } catch (error) {
        console.error("Error fetching specialties:", error);
        toast.error("Không thể tải danh sách chuyên khoa");
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialties();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({
        ...prev,
        license: e.target.files![0],
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) {
          formDataToSend.append(key, value);
        }
      });
      formDataToSend.append("role", "doctor");

      await register(formDataToSend);
      toast.success(
        "Đăng ký thành công! Vui lòng đợi admin duyệt tài khoản trước khi đăng nhập."
      );
      navigate("/doctor/login");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Đăng ký thất bại");
    }
  };

  const handleBackToHome = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Đăng ký tài khoản bác sĩ
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className={styles.authForm}>
            {error && <div className={styles.authErrorMessage}>{error}</div>}

            <div className={styles.authFormGroup}>
              <label htmlFor="name">Họ và tên</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={styles.authFormControl}
                required
              />
            </div>

            <div className={styles.authFormGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={styles.authFormControl}
                required
              />
            </div>

            <div className={styles.authFormGroup}>
              <label htmlFor="phone">Số điện thoại</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={styles.authFormControl}
                required
              />
            </div>

            <div className={styles.authFormGroup}>
              <label htmlFor="specialty">Chuyên khoa</label>
              <select
                id="specialty"
                name="specialty"
                value={formData.specialty}
                onChange={handleChange}
                className={styles.authFormControl}
                required
              >
                <option value="">Chọn chuyên khoa</option>
                {loading ? (
                  <option value="">Đang tải...</option>
                ) : (
                  specialties.map((specialty) => (
                    <option key={specialty._id} value={specialty._id}>
                      {specialty.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className={styles.authFormGroup}>
              <label htmlFor="experience">Kinh nghiệm (năm)</label>
              <input
                type="number"
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                className={styles.authFormControl}
                required
                min="0"
              />
            </div>

            <div className={styles.authFormGroup}>
              <label htmlFor="workplace">Nơi công tác</label>
              <input
                type="text"
                id="workplace"
                name="workplace"
                value={formData.workplace}
                onChange={handleChange}
                className={styles.authFormControl}
                required
              />
            </div>

            <div className={styles.authFormGroup}>
              <label htmlFor="license">Bằng cấp / Giấy phép hành nghề</label>
              <input
                type="file"
                id="license"
                name="license"
                onChange={handleFileChange}
                className={styles.authFormControl}
                accept=".pdf,.jpg,.jpeg,.png"
                required
              />
            </div>

            <div className={styles.authFormGroup}>
              <label htmlFor="password">Mật khẩu</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={styles.authFormControl}
                required
              />
            </div>

            <div className={styles.authFormGroup}>
              <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
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
        </div>
      </div>
    </div>
  );
};

export default RegisterDoctor;
