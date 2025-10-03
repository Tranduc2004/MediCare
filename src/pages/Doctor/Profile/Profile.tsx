import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { toast } from "react-toastify";
import {
  User,
  Phone,
  Briefcase,
  GraduationCap,
  Award,
  DollarSign,
  FileText,
  Camera,
  Save,
  AlertCircle,
  Stethoscope,
  XCircle,
  Calendar,
  Building,
  Globe,
} from "lucide-react";

export default function DoctorProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Helper to read auth token using same keys as AuthContext/axiosConfig
  const getAuthToken = () => {
    try {
      return (
        window.sessionStorage.getItem("doctor_token") ??
        window.localStorage.getItem("doctor_token") ??
        window.sessionStorage.getItem("token") ??
        window.localStorage.getItem("token")
      );
    } catch {
      return (
        window.localStorage.getItem("doctor_token") ??
        window.localStorage.getItem("token")
      );
    }
  };
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAvatar, setShowAvatar] = useState(true);

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
  const [specialties, setSpecialties] = useState<
    { _id: string; name: string }[]
  >([]);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    specialty: "",
    experience: "",
    workplace: "",
    description: "",
    education: "",
    certifications: "",
    languages: "",
    consultationFee: "",
    avatar: "",
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || "",
      phone: user.phone || "",
      specialty: user.specialty || "",
      experience: user.experience?.toString?.() || "",
      workplace: user.workplace || "",
      description: user.description || "",
      education: Array.isArray(user.education)
        ? user.education.join("\n")
        : user.education || "",
      certifications: Array.isArray(user.certifications)
        ? user.certifications.join("\n")
        : user.certifications || "",
      languages: Array.isArray(user.languages)
        ? user.languages.join(", ")
        : user.languages || "",
      consultationFee: user.consultationFee?.toString?.() || "",
      avatar: user.avatar || "",
    });

    // Load latest profile from server
    const loadProfile = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          // no token -> redirect to login
          navigate("/doctor/login");
          return;
        }

        const res = await fetch(
          "https://server-medicare.onrender.com/api/doctor/auth/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (res.status === 401) {
          // expired or invalid token
          localStorage.removeItem("token");
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          navigate("/doctor/login");
          return;
        }
        const data = await res.json();
        if (data?.success && data?.doctor) {
          const d = data.doctor;
          setForm({
            name: d.name || "",
            phone: d.phone || "",
            specialty: d.specialty || "",
            experience: d.experience?.toString?.() || "",
            workplace: d.workplace || "",
            description: d.description || "",
            education: Array.isArray(d.education)
              ? d.education.join("\n")
              : d.education || "",
            certifications: Array.isArray(d.certifications)
              ? d.certifications.join("\n")
              : d.certifications || "",
            languages: Array.isArray(d.languages)
              ? d.languages.join(", ")
              : d.languages || "",
            consultationFee: d.consultationFee?.toString?.() || "",
            avatar: d.avatar || "",
          });
        }
      } catch {
        // ignore
      }
    };
    loadProfile();
    // Load specialties for mapping id -> name
    import("../../../api/specialtyApi")
      .then((m: unknown) => {
        const mod = m as {
          specialtyApi?: {
            getActiveSpecialties: () => Promise<
              { _id: string; name: string }[]
            >;
          };
        };
        if (!mod.specialtyApi) throw new Error("specialtyApi missing");
        return mod.specialtyApi.getActiveSpecialties();
      })
      .then((data) => setSpecialties(data || []))
      .catch((err) => console.warn("Failed loading specialties", err));
  }, [user, navigate]);

  const uploadAvatar = async (file: File) => {
    try {
      setLoading(true);
      setError("");

      const data = new FormData();
      data.append("avatar", file);
      const token = getAuthToken();
      if (!token) {
        toast.error("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
        navigate("/doctor/login");
        return;
      }

      const res = await fetch(
        "https://server-medicare.onrender.com/api/doctor/auth/profile/avatar",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: data,
        }
      );
      const json = await res.json();

      if (res.status === 401) {
        localStorage.removeItem("token");
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        navigate("/doctor/login");
        return;
      }

      if (res.ok && json.url) {
        // Save avatar to database
        const saveRes = await fetch(
          "https://server-medicare.onrender.com/api/doctor/auth/profile",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify({ avatar: json.url }),
          }
        );

        if (saveRes.ok) {
          setForm((prev) => ({ ...prev, avatar: json.url }));
          // Update localStorage
          const raw = localStorage.getItem("user_doctor");
          if (raw) {
            try {
              const u = JSON.parse(raw);
              u.avatar = json.url;
              localStorage.setItem("user_doctor", JSON.stringify(u));
            } catch (err) {
              console.warn("Failed to update user_doctor in localStorage", err);
            }
          }
        } else {
          setError("Không thể lưu avatar");
        }
      } else {
        setError(json?.message || "Tải ảnh thất bại");
      }
    } catch (err) {
      console.warn("uploadAvatar error", err);
      setError("Không thể tải ảnh");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(
        "https://server-medicare.onrender.com/api/doctor/auth/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(form),
        }
      );

      if (res.status === 401) {
        localStorage.removeItem("token");
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        navigate("/doctor/login");
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Cập nhật thất bại");
      }

      toast.success("Cập nhật hồ sơ thành công");

      // Update localStorage
      const raw = localStorage.getItem("user_doctor");
      if (raw) {
        try {
          const u = JSON.parse(raw);
          const updated = { ...u };
          updated.name = form.name;
          updated.phone = form.phone;
          updated.specialty = form.specialty;
          updated.experience = Number(form.experience) || u.experience;
          updated.workplace = form.workplace;
          updated.description = form.description;
          updated.avatar = form.avatar || u.avatar;
          localStorage.setItem("user_doctor", JSON.stringify(updated));
        } catch (err) {
          console.warn("Failed to update localStorage user_doctor", err);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-teal-500 rounded-xl flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  Hồ sơ bác sĩ
                </h1>
                <p className="text-sm text-slate-600">
                  Quản lý thông tin cá nhân và chuyên môn
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all text-sm font-medium">
                Xem trước
              </button>
              <button
                onClick={onSubmit}
                disabled={saving || loading}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 text-sm font-medium flex items-center gap-2 shadow-lg"
              >
                {saving ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50 shadow-sm">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
              <span className="text-rose-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Profile Overview */}
          <div className="lg:col-span-4 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="relative h-32 bg-gradient-to-br from-blue-600 to-teal-500">
                <div className="absolute inset-0 bg-black/10"></div>
              </div>

              <div className="relative px-6 pb-6">
                {/* Avatar */}
                <div className="absolute -top-12 left-6">
                  <div className="relative group cursor-pointer">
                    {form.avatar && showAvatar ? (
                      <img
                        src={getAvatarSrc(form.avatar)}
                        alt="Avatar"
                        className="h-24 w-24 rounded-2xl object-cover border-4 border-white shadow-xl group-hover:shadow-2xl transition-all"
                        onError={() => setShowAvatar(false)}
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-2xl bg-slate-100 flex items-center justify-center border-4 border-white shadow-xl">
                        <User className="h-10 w-10 text-slate-400" />
                      </div>
                    )}

                    <label className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/20 flex items-center justify-center cursor-pointer transition-all">
                      <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-all" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={loading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadAvatar(file);
                        }}
                      />
                    </label>

                    {loading && (
                      <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                        <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Info */}
                <div className="pt-16">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold text-slate-900">
                      {form.name ? `BS. ${form.name}` : "Chưa cập nhật tên"}
                    </h2>
                  </div>

                  <p className="text-blue-600 font-medium mb-3">
                    {specialties.find((s) => s._id === form.specialty)?.name ||
                      (form.specialty
                        ? form.specialty
                        : "Chưa cập nhật chuyên khoa")}
                  </p>

                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900">
                        {form.experience || "0"}
                      </div>
                      <div className="text-sm text-slate-600">
                        Năm kinh nghiệm
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                        <span className="text-lg font-bold text-slate-900">
                          {form.consultationFee
                            ? `${parseInt(
                                form.consultationFee
                              ).toLocaleString()}k`
                            : "Chưa đặt"}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">Phí tư vấn</div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Building className="h-4 w-4 text-slate-500 flex-shrink-0" />
                      <span className="text-slate-700">
                        {form.workplace || "Chưa cập nhật nơi làm việc"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-slate-500 flex-shrink-0" />
                      <span className="text-slate-700">
                        {form.phone || "Chưa cập nhật số điện thoại"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                Thao tác nhanh
              </h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Quản lý lịch khám</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Xem báo cáo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Form Fields */}
          <div className="lg:col-span-8 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
              <div className="border-b border-slate-100 p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Thông tin cơ bản
                    </h3>
                    <p className="text-sm text-slate-600">
                      Cập nhật thông tin cá nhân và liên hệ
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Họ tên"
                    icon={<User className="h-4 w-4" />}
                    required
                  >
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Nhập họ tên đầy đủ"
                    />
                  </FormField>

                  <FormField
                    label="Số điện thoại"
                    icon={<Phone className="h-4 w-4" />}
                    required
                  >
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Nhập số điện thoại"
                    />
                  </FormField>

                  <FormField
                    label="Nơi làm việc"
                    icon={<Building className="h-4 w-4" />}
                  >
                    <input
                      type="text"
                      value={form.workplace}
                      onChange={(e) => updateField("workplace", e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Bệnh viện/Phòng khám"
                    />
                  </FormField>

                  <FormField
                    label="Phí tư vấn (VND)"
                    icon={<DollarSign className="h-4 w-4" />}
                  >
                    <input
                      type="number"
                      min="0"
                      value={form.consultationFee}
                      onChange={(e) =>
                        updateField("consultationFee", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="200000"
                    />
                  </FormField>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
              <div className="border-b border-slate-100 p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Stethoscope className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Thông tin chuyên môn
                    </h3>
                    <p className="text-sm text-slate-600">
                      Cập nhật chuyên khoa và kinh nghiệm
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Chuyên khoa"
                    icon={<Stethoscope className="h-4 w-4" />}
                    required
                  >
                    <select
                      value={form.specialty}
                      onChange={(e) => updateField("specialty", e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Chọn chuyên khoa</option>
                      {specialties.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField
                    label="Kinh nghiệm (năm)"
                    icon={<Briefcase className="h-4 w-4" />}
                    required
                  >
                    <input
                      type="number"
                      min="0"
                      value={form.experience}
                      onChange={(e) =>
                        updateField("experience", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Số năm kinh nghiệm"
                    />
                  </FormField>
                </div>

                <FormField
                  label="Giới thiệu bản thân"
                  icon={<FileText className="h-4 w-4" />}
                >
                  <textarea
                    rows={5}
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                    placeholder="Mô tả về bản thân, kinh nghiệm và chuyên môn của bạn..."
                  />
                </FormField>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
              <div className="border-b border-slate-100 p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Thông tin bổ sung
                    </h3>
                    <p className="text-sm text-slate-600">
                      Học vấn, chứng chỉ và ngôn ngữ
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <FormField
                  label="Học vấn"
                  icon={<GraduationCap className="h-4 w-4" />}
                  description="Mỗi bằng cấp trên một dòng"
                >
                  <textarea
                    rows={4}
                    value={form.education}
                    onChange={(e) => updateField("education", e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                    placeholder="Ví dụ:&#10;Bác sĩ Đại học Y Hà Nội&#10;Thạc sĩ Tim mạch - Đại học Y Dược TP.HCM"
                  />
                </FormField>

                <FormField
                  label="Chứng chỉ và bằng cấp"
                  icon={<Award className="h-4 w-4" />}
                  description="Mỗi chứng chỉ trên một dòng"
                >
                  <textarea
                    rows={4}
                    value={form.certifications}
                    onChange={(e) =>
                      updateField("certifications", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                    placeholder="Ví dụ:&#10;Chứng chỉ hành nghề số 12345&#10;Chứng chỉ chuyên khoa Tim mạch"
                  />
                </FormField>

                <FormField
                  label="Ngôn ngữ"
                  icon={<Globe className="h-4 w-4" />}
                  description="Phân cách bằng dấu phẩy"
                >
                  <input
                    type="text"
                    value={form.languages}
                    onChange={(e) => updateField("languages", e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Tiếng Việt, English, 日本語"
                  />
                </FormField>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-200 p-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Lưu ý quan trọng
                  </h4>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    Thông tin này sẽ được hiển thị công khai cho bệnh nhân. Vui
                    lòng đảm bảo thông tin chính xác, đầy đủ và tuân thủ quy
                    định của Bộ Y tế về hành nghề y.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  icon,
  children,
  required = false,
  description,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  required?: boolean;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        {icon && <span className="text-slate-500">{icon}</span>}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {description && (
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      )}
    </div>
  );
}
