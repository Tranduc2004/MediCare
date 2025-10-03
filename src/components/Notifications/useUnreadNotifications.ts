import { useQuery } from "@tanstack/react-query";
import api from "../../api/axiosConfig";

async function fetchUnread() {
  try {
    const isDoctor =
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/doctor");
    const tokenKey = isDoctor ? "doctor_token" : "patient_token";
    let token: string | null = null;
    if (typeof window !== "undefined") {
      token =
        window.sessionStorage.getItem(tokenKey) ??
        window.localStorage.getItem(tokenKey) ??
        null;
      if (!token)
        token =
          window.sessionStorage.getItem("token") ??
          window.localStorage.getItem("token") ??
          null;
    }
    if (!token) {
      const res = await api.get("/notifications?limit=1&public=1");
      if (import.meta.env.DEV)
        console.debug("fetchUnread: no token, public badge response", res.data);
      return res.data.totalUnread || 0;
    }

    const res = await api.get("/notifications?limit=1");
    if (import.meta.env.DEV)
      console.debug("fetchUnread: token present, response", {
        tokenPreview: token?.slice?.(0, 8) || null,
        data: res.data,
      });
    return res.data.totalUnread || 0;
  } catch {
    return 0;
  }
}

export default function useUnreadNotifications() {
  const { data = 0 } = useQuery({
    queryKey: ["notifications", "unreadCount"],
    queryFn: fetchUnread,
    refetchInterval: 7000,
  });
  return data;
}
