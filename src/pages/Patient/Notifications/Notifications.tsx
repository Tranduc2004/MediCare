import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../api/axiosConfig";
import { useAuth } from "../../../contexts/AuthContext";
import useNotifications from "../../../hooks/useNotifications";
import {
  Bell,
  Check,
  CheckCheck,
  RefreshCw,
  Search as SearchIcon,
} from "lucide-react";

/* ===== Types ===== */
interface NotificationItem {
  _id: string;
  title: string;
  body?: string;
  read?: boolean;
  createdAt: string;
}

/* ===== Helpers ===== */
const timeAgo = (iso?: string) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s trước`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  return new Date(iso).toLocaleString();
};

const CardSkeleton: React.FC = () => (
  <div className="p-3 rounded-xl bg-white border border-blue-100 shadow-sm animate-pulse">
    <div className="flex items-start gap-3">
      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-slate-200" />
      <div className="min-w-0 flex-1">
        <div className="h-4 w-2/3 bg-slate-200 rounded" />
        <div className="h-3 w-5/6 bg-slate-100 rounded mt-2" />
        <div className="h-3 w-24 bg-slate-100 rounded mt-2" />
      </div>
      <div className="h-6 w-16 bg-slate-200 rounded" />
    </div>
  </div>
);

/* ===== Page ===== */
export default function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Socket realtime
  const tokenKey = window.location.pathname.startsWith("/doctor")
    ? "doctor_token"
    : "patient_token";
  const token =
    (typeof window !== "undefined" &&
      (window.sessionStorage.getItem(tokenKey) ??
        window.localStorage.getItem(tokenKey))) ||
    null;
  useNotifications(token, user?._id ?? null);

  // Tabs + Search
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["notifications", user?._id],
    queryFn: async () => {
      const isDoctor = window.location.pathname.startsWith("/doctor");
      const tkKey = isDoctor ? "doctor_token" : "patient_token";
      const tk =
        (typeof window !== "undefined" &&
          (window.sessionStorage.getItem(tkKey) ??
            window.localStorage.getItem(tkKey))) ||
        null;

      if (!tk || !user?._id) {
        const res = await api.get("/notifications?limit=1&public=1");
        return res.data;
      }
      const res = await api.get(
        `/notifications?userId=${encodeURIComponent(String(user._id))}`
      );
      return res.data;
    },
    staleTime: 30_000,
  });

  // Actions
  const markRead = async (ids: string[]) => {
    try {
      if (!ids.length) return;
      await api.post("/notifications/mark-read", { ids, userId: user?._id });
      qc.invalidateQueries({ queryKey: ["notifications", user?._id] });
    } catch {
      // silent
    }
  };

  // Data shaping
  const items: NotificationItem[] = data?.items ?? [];
  const unreadCount = items.filter((i) => !i.read).length;

  const filtered = useMemo(() => {
    let list = [...items];
    if (tab === "unread") list = list.filter((i) => !i.read);
    if (qDebounced) {
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(qDebounced) ||
          (i.body ?? "").toLowerCase().includes(qDebounced)
      );
    }
    return list;
  }, [items, tab, qDebounced]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Shell */}
        <div className="rounded-2xl overflow-hidden border border-blue-100 shadow-sm">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-teal-500 p-6 text-white flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6" />
              <div>
                <h1 className="text-2xl font-bold">Thông báo</h1>
                <p className="text-white/80 text-sm">
                  {unreadCount} thông báo chưa đọc
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  markRead(items.filter((i) => !i.read).map((i) => i._id))
                }
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                title="Đánh dấu tất cả đã đọc"
              >
                <CheckCheck className="h-4 w-4" />
                <span className="text-sm font-medium">Đánh dấu tất cả</span>
              </button>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                title="Làm mới"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-sm font-medium hidden sm:inline">
                  Làm mới
                </span>
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="bg-white px-4 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50">
              <button
                onClick={() => setTab("all")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  tab === "all"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setTab("unread")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  tab === "unread"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                Chưa đọc
                {unreadCount > 0 && (
                  <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-teal-500/10 text-teal-700 text-[11px] px-1">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            <div className="sm:ml-auto relative w-full sm:w-80">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm tiêu đề/nội dung…"
                className="w-full pl-10 pr-3 py-2 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
              <SearchIcon className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Content */}
          <div className="bg-white p-4 sm:p-6">
            {/* Loading */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Error */}
            {isError && (
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700">
                Không tải được thông báo.
              </div>
            )}

            {/* List / Empty */}
            {!isLoading && !isError && (
              <>
                {filtered.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-teal-100 border border-blue-200 mx-auto flex items-center justify-center mb-3">
                      <Bell className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Không có thông báo
                    </h3>
                    <p className="text-slate-600">
                      Khi có hoạt động mới, thông báo sẽ hiển thị ở đây.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filtered.map((it) => (
                      <div
                        key={it._id}
                        className={`p-3 rounded-xl border shadow-sm transition-colors ${
                          it.read
                            ? "bg-white border-blue-100"
                            : "bg-teal-50/50 border-teal-200"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-1 h-2.5 w-2.5 rounded-full ${
                              it.read ? "bg-slate-300" : "bg-teal-500"
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                                {it.title}
                              </h3>
                              <time className="text-[11px] text-slate-500 whitespace-nowrap">
                                {timeAgo(it.createdAt)}
                              </time>
                            </div>

                            {it.body && (
                              <p className="text-sm text-slate-700 mt-1 line-clamp-2">
                                {it.body}
                              </p>
                            )}

                            {!it.read && (
                              <button
                                onClick={() => markRead([it._id])}
                                className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                                           border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Đánh dấu đã đọc
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer actions */}
          {items.length > 0 && (
            <div className="bg-white px-4 sm:px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() =>
                  markRead(items.filter((i) => !i.read).map((i) => i._id))
                }
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <CheckCheck className="h-4 w-4" />
                <span className="text-sm font-medium">Đánh dấu tất cả</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
