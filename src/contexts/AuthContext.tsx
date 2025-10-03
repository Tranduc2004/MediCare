/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  specialty?: string;
  experience?: number;
  license?: string;
  workplace?: string;
  description?: string;
  avatar?: string;
  education?: string[];
  certifications?: string[];
  languages?: string[];
  consultationFee?: number;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (
    email: string,
    password: string,
    navigate?: (path: string) => void
  ) => Promise<void>;
  register: (userData: FormData | object) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Xác định portal hiện tại để tách phiên: /doctor dùng khóa riêng
  const getCurrentPortal = React.useCallback(() => {
    if (typeof window === "undefined") return false;
    const pathname = window.location.pathname.toLowerCase();
    const isDoctor = pathname.startsWith("/doctor");
    return isDoctor;
  }, []);

  const getStorageKey = React.useCallback(() => {
    const key = getCurrentPortal() ? "user_doctor" : "user";
    return key;
  }, [getCurrentPortal]);

  // Production: luôn dùng localStorage; Dev: hỗ trợ ?tabSession=1 để dùng sessionStorage
  const getStorage = React.useCallback(() => {
    if (typeof window === "undefined") return null;
    const isProd =
      typeof import.meta !== "undefined" ? import.meta.env.PROD : false;
    if (isProd) return window.localStorage;

    // Dev: prefer sessionStorage if it already contains auth data so reloads
    // won't lose sessions when the URL query param is removed.
    try {
      const currentPortal = getCurrentPortal();
      const userKey = currentPortal ? "user_doctor" : "user";
      const tokenKey = currentPortal ? "doctor_token" : "patient_token";
      if (
        window.sessionStorage.getItem(tokenKey) ||
        window.sessionStorage.getItem(userKey)
      ) {
        return window.sessionStorage;
      }
    } catch {
      // ignore and fall back
    }

    const params = new URLSearchParams(window.location.search);
    const useTab = params.get("tabSession") === "1";
    return useTab ? window.sessionStorage : window.localStorage;
  }, [getCurrentPortal]);

  const [user, setUser] = useState<User | null>(() => {
    try {
      const storage = getStorage();
      const storageKey = getStorageKey();
      const raw = storage?.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      const storage = getStorage();
      const storageKey = getStorageKey();
      storage?.removeItem(storageKey);
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const storage = getStorage();
    const storageKey = getStorageKey();
    return !!storage?.getItem(storageKey);
  });

  // Theo dõi thay đổi của storage và token
  useEffect(() => {
    const handleStorageChange = (event?: StorageEvent) => {
      const storage = getStorage();
      const currentPortal = getCurrentPortal();
      const userKey = currentPortal ? "user_doctor" : "user";
      const tokenKey = currentPortal ? "doctor_token" : "patient_token";

      // Chỉ xử lý khi thay đổi liên quan đến portal hiện tại
      if (event && event.key && ![userKey, tokenKey].includes(event.key)) {
        return;
      }

      // Read token from the same storage mechanism as user (support sessionStorage in dev)
      const token =
        storage?.getItem(tokenKey) ?? window.localStorage.getItem(tokenKey);
      const raw = storage?.getItem(userKey);

      const isValid = !!(raw && token);
      let nextUser = null;

      if (isValid) {
        try {
          const userData = JSON.parse(raw);
          if (JSON.stringify(userData) !== JSON.stringify(user)) {
            nextUser = userData;
          } else {
            return; // Không cần cập nhật nếu user không thay đổi
          }
        } catch {
          // Lỗi parse JSON, reset state
        }
      }

      // Chỉ cập nhật state khi cần thiết
      if (nextUser !== user) {
        setUser(nextUser);
      }
      if (isValid !== isAuthenticated) {
        setIsAuthenticated(isValid);
      }
    };

    // Kiểm tra storage khi component mount
    handleStorageChange();

    // Lắng nghe sự kiện storage change (cho trường hợp multiple tabs)
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [getCurrentPortal, getStorage, user, isAuthenticated]);

  // Theo dõi thay đổi của pathname để cập nhật user state khi navigate
  // Use react-router's location for deterministic route changes instead of a MutationObserver.
  const location = useLocation();

  useEffect(() => {
    const storage = getStorage();
    const key = getStorageKey();
    const tokenKey = getCurrentPortal() ? "doctor_token" : "patient_token";

    const raw = storage?.getItem(key);
    const token =
      storage?.getItem(tokenKey) ?? window.localStorage.getItem(tokenKey);

    // Only clear auth when either the stored user or the token is truly missing.
    if (!raw || !token) {
      setUser(null);
      setIsAuthenticated(false);
    }
    // We intentionally depend on location.pathname so this runs on route changes.
  }, [location.pathname, getCurrentPortal, getStorage, getStorageKey]);

  const login = async (
    email: string,
    password: string,
    navigate?: (path: string) => void
  ) => {
    try {
      // Xác định API endpoint dựa trên portal hiện tại
      const isDoctorPortal = getCurrentPortal();
      const apiEndpoint = isDoctorPortal
        ? "https://server-medicare.onrender.com/api/doctor/auth/login"
        : "https://server-medicare.onrender.com/api/patient/auth/login";

      const response = await axios.post(apiEndpoint, {
        email,
        password,
      });

      const userData = response.data.user;

      setUser(userData);
      setIsAuthenticated(true);

      // Lưu vào storage với key phù hợp
      const storage = getStorage();
      const storageKey = getStorageKey();
      storage?.setItem(storageKey, JSON.stringify(userData));

      // Lưu token cho gọi API bảo vệ. Persist token into the same storage
      // object returned by getStorage() so user+token live together (avoids mismatch).
      const token = response.data?.token;
      if (token && typeof token === "string" && token.trim() !== "") {
        const tokenKey = isDoctorPortal ? "doctor_token" : "patient_token";
        const authStorage = getStorage();
        try {
          // Prefer the environment-specific storage (sessionStorage in dev when ?tabSession=1)
          if (authStorage) {
            authStorage.setItem(tokenKey, token);
          } else {
            // Fallback to localStorage if getStorage isn't available
            window.localStorage.setItem(tokenKey, token);
          }
        } catch {
          // In case storage is blocked, fallback to localStorage
          window.localStorage.setItem(tokenKey, token);
        }
      } else {
        console.error("Invalid token received:", token);
      }

      toast.success("Đăng nhập thành công!");

      // Validate user role trước khi chuyển hướng
      const userRole = userData.role?.toLowerCase();
      const expectedRole = isDoctorPortal ? "doctor" : "patient";

      if (userRole !== expectedRole) {
        throw new Error(
          `Tài khoản không phải ${expectedRole}! Vui lòng đăng nhập đúng trang.`
        );
      }

      // Xử lý chuyển hướng sau khi đăng nhập thành công
      if (navigate) {
        const redirectPath = localStorage.getItem("redirectAfterLogin");
        if (redirectPath) {
          // Kiểm tra xem redirectPath có phù hợp với role không
          const isValidRedirect =
            userRole === "doctor"
              ? redirectPath.startsWith("/doctor")
              : !redirectPath.startsWith("/doctor");

          if (isValidRedirect) {
            localStorage.removeItem("redirectAfterLogin");
            navigate(redirectPath);
          } else {
            // Nếu redirect path không phù hợp với role, chuyển về trang mặc định
            const defaultPath = isDoctorPortal ? "/doctor" : "/";
            navigate(defaultPath);
          }
        } else {
          // Chuyển hướng mặc định dựa vào role
          const defaultPath = isDoctorPortal ? "/doctor" : "/";
          navigate(defaultPath);
        }
      }
    } catch (error: unknown) {
      const errorData = error as { response?: { data?: { message?: string } } };
      toast.error(errorData.response?.data?.message || "Đăng nhập thất bại!");
      throw error;
    }
  };

  const register = async (userData: FormData | object) => {
    try {
      // Xác định API endpoint dựa trên portal hiện tại
      const isDoctorPortal = getCurrentPortal();
      const apiEndpoint = isDoctorPortal
        ? "https://server-medicare.onrender.com/api/doctor/auth/register"
        : "https://server-medicare.onrender.com/api/patient/auth/register";

      let response;

      if (isDoctorPortal) {
        // Doctor register - sử dụng FormData
        response = await axios.post(apiEndpoint, userData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        // Patient register - sử dụng JSON
        const jsonData =
          userData instanceof FormData
            ? Object.fromEntries(userData.entries())
            : userData;

        response = await axios.post(apiEndpoint, jsonData, {
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      const newUser = response.data.user;

      setUser(newUser);
      setIsAuthenticated(true);

      // Lưu vào storage với key phù hợp
      const storage = getStorage();
      const storageKey = getStorageKey();
      storage?.setItem(storageKey, JSON.stringify(newUser));
    } catch (error: unknown) {
      const errorData = error as { response?: { data?: { message?: string } } };
      toast.error(errorData.response?.data?.message || "Đăng ký thất bại!");
      throw error;
    }
  };

  const logout = () => {
    const currentPortal = getCurrentPortal();
    const storage = getStorage();
    const storageKey = currentPortal ? "user_doctor" : "user";
    const tokenKey = currentPortal ? "doctor_token" : "patient_token";

    // Chỉ xóa dữ liệu của portal hiện tại (user + token)
    storage?.removeItem(storageKey);
    try {
      const authStorage = getStorage();
      if (authStorage) {
        authStorage.removeItem(tokenKey);
      } else {
        window.localStorage.removeItem(tokenKey);
      }
    } catch {
      window.localStorage.removeItem(tokenKey);
    }

    // Lưu portal cuối để điều hướng login sau này
    window.sessionStorage.setItem(
      "lastPortal",
      currentPortal ? "doctor" : "patient"
    );

    setUser(null);
    setIsAuthenticated(false);
  };
  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
