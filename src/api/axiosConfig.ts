import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

// Helper to choose the same storage strategy as AuthContext
function getAuthStorage(): Storage | null {
  try {
    const isProd =
      typeof import.meta !== "undefined" ? import.meta.env.PROD : false;
    if (isProd) return window.localStorage;
    const params = new URLSearchParams(window.location.search);
    const useTab = params.get("tabSession") === "1";
    return useTab ? window.sessionStorage : window.localStorage;
  } catch {
    return window.localStorage;
  }
}

const api = axios.create({
  baseURL: "https://server-medicare.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Check if we're on the doctor routes
    const isDoctorRoute = window.location.pathname.startsWith("/doctor");
    const tokenKey = isDoctorRoute ? "doctor_token" : "patient_token";
    const storage = getAuthStorage();
    const token =
      storage?.getItem(tokenKey) ?? window.localStorage.getItem(tokenKey);

    // Fallback to legacy key 'token' if present in session/local storage
    const legacyToken =
      storage?.getItem("token") ?? window.localStorage.getItem("token");
    const finalToken = token ?? legacyToken;

    if (finalToken) {
      config.headers.Authorization = `Bearer ${finalToken}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized error
    if (error.response?.status === 401) {
      // If we're already on a login page, don't redirect again.
      const pathname = window.location.pathname;
      if (
        !pathname.startsWith("/login") &&
        !pathname.startsWith("/doctor/login")
      ) {
        // Clear tokens from auth storage but DO NOT automatically redirect the whole app.
        // This prevents public pages from being forced to /login. Let components decide how to react.
        const storage = getAuthStorage();
        try {
          // Only clear the token for the current portal to keep doctor/patient sessions isolated
          const isDoctorRoute = window.location.pathname.startsWith("/doctor");
          if (isDoctorRoute) {
            storage?.removeItem("doctor_token");
            window.localStorage.removeItem("doctor_token");
          } else {
            storage?.removeItem("patient_token");
            window.localStorage.removeItem("patient_token");
          }
        } catch {
          // Best-effort fallback
          window.localStorage.removeItem("patient_token");
          window.localStorage.removeItem("doctor_token");
        }
        // Note: we intentionally don't call window.location.href here.
      }
    }
    return Promise.reject(error);
  }
);

export default api;
