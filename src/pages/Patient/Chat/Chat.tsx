import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  ChatMessage,
  getThread,
  markRead,
  getLatestDoctorForPatient,
  sendMessage,
} from "../../../api/chatApi";
import { getDoctorById } from "../../../api/doctorsApi";
import {
  getMyAppointments,
  getMyAppointmentHistory,
} from "../../../api/appointmentApi";
import { toast } from "react-toastify";
import { useChatNotifications } from "../../Doctor/Messages/useChatNotifications";
import {
  Paperclip,
  Send,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";

// ===== Constants =====
const STICKY_THRESHOLD = 140; // px – when < 140px from bottom, treat as "at bottom"

// ===== Types =====
type DoctorInfo = {
  _id: string;
  name?: string;
  specialty?: { name?: string } | string;
  workplace?: string;
  avatarUrl?: string;
};

type AppointmentLike = {
  doctorId?:
    | string
    | { _id: string; name?: string; specialty?: string; workplace?: string };
  updatedAt?: string;
  scheduleId?: { date?: string };
};

export default function PatientChatPage() {
  const { user, isAuthenticated } = useAuth();

  // Core chat states
  const [doctorId, setDoctorId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Doctor picker states
  const [pickerOpen, setPickerOpen] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [doctorList, setDoctorList] = useState<DoctorInfo[]>([]);
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);

  // UI helpers
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [justSent, setJustSent] = useState(false);
  // New message indicator
  const lastSeenMsgIdRef = useRef<string | null>(null);
  const [newCount, setNewCount] = useState(0);

  // Anti auto-scroll flags
  const initialLoadRef = useRef(true); // only show skeleton on first load per thread
  const atBottomRef = useRef(true);
  const pendingAutoScrollRef = useRef(false);
  const lastPolledLastMessageIdRef = useRef<string | null>(null);

  const canChat = isAuthenticated && user?.role === "patient";
  const { notifyNewMessages, playSoundOnly, clearIndicators } =
    useChatNotifications({
      title: "Tin nhắn từ bác sĩ",
    });

  // ===== Build doctor options from user's appointments (current + history) =====
  useEffect(() => {
    const loadDoctors = async () => {
      if (!canChat || !user?._id) return;
      try {
        const [curr, hist] = await Promise.all([
          getMyAppointments(user._id),
          getMyAppointmentHistory(user._id),
        ]);
        const merged: AppointmentLike[] = [
          ...(Array.isArray(curr) ? curr : []),
          ...(Array.isArray(hist) ? hist : []),
        ];
        // Sort by most recent encounter
        merged.sort((a, b) => {
          const ak = `${a.scheduleId?.date || a.updatedAt || ""}`;
          const bk = `${b.scheduleId?.date || b.updatedAt || ""}`;
          return bk.localeCompare(ak);
        });
        // Collect unique doctors
        const map = new Map<string, DoctorInfo & { lastSeen?: string }>();
        for (const ap of merged) {
          if (!ap.doctorId) continue;
          const id =
            typeof ap.doctorId === "string" ? ap.doctorId : ap.doctorId._id;
          if (!id) continue;
          if (!map.has(id)) {
            const docObj =
              typeof ap.doctorId === "string" ? undefined : ap.doctorId;
            map.set(id, {
              _id: id,
              name: docObj?.name,
              specialty: docObj?.specialty,
              workplace: docObj?.workplace,
              lastSeen: ap.scheduleId?.date || ap.updatedAt || "",
            });
          }
        }
        // Fetch missing doctor names in parallel (best effort)
        const missingIds = Array.from(map.values())
          .filter((d) => !d.name)
          .map((d) => d._id);
        if (missingIds.length) {
          await Promise.all(
            missingIds.map(async (id) => {
              try {
                const info = await getDoctorById(id);
                if (info) {
                  map.set(id, { ...map.get(id)!, ...info });
                }
              } catch {
                /* ignore */
              }
            })
          );
        }
        const list: DoctorInfo[] = Array.from(map.values())
          .sort((a, b) => {
            const la = (a as { lastSeen?: string }).lastSeen || "";
            const lb = (b as { lastSeen?: string }).lastSeen || "";
            return lb.localeCompare(la);
          })
          .map((it) => ({
            _id: it._id,
            name: it.name,
            specialty: it.specialty,
            workplace: (it as { workplace?: string }).workplace,
            avatarUrl: (it as { avatarUrl?: string }).avatarUrl,
          }));
        setDoctorList(list);
        // If no active doctor yet, pick the most recent
        if (!doctorId && list.length > 0) setDoctorId(list[0]._id);
      } catch {
        /* ignore silently */
      }
    };
    loadDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canChat, user?._id]);

  // ===== Get last doctor thread as a fallback =====
  useEffect(() => {
    const bootstrap = async () => {
      if (!canChat || !user?._id || doctorId) return;
      try {
        const { doctorId: latest } = await getLatestDoctorForPatient(user._id);
        if (latest) setDoctorId(latest);
      } catch {
        /* ignore */
      }
    };
    bootstrap();
  }, [canChat, user?._id, doctorId]);

  // ===== Load doctor header info =====
  useEffect(() => {
    const run = async () => {
      if (!doctorId) {
        setDoctorInfo(null);
        return;
      }
      try {
        const info = await getDoctorById(doctorId);
        setDoctorInfo(info || null);
      } catch {
        // Fallback from list if available
        const fromList = doctorList.find((d) => d._id === doctorId) || null;
        setDoctorInfo(fromList);
      }
    };
    run();
  }, [doctorId, doctorList]);

  // ===== Load messages (poll only when page visible) =====
  const load = async () => {
    if (!canChat || !doctorId || !user?._id) return;
    try {
      if (initialLoadRef.current) setLoading(true);
      const el = scrollRef.current;
      if (el) {
        const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
        pendingAutoScrollRef.current = dist < STICKY_THRESHOLD;
      }
      const data = await getThread({ doctorId, patientId: user._id });
      const prevLastId = lastPolledLastMessageIdRef.current;
      const nextArr = Array.isArray(data) ? data : [];
      const nextLast = nextArr[nextArr.length - 1];
      setMessages(nextArr);
      lastPolledLastMessageIdRef.current = nextLast?._id || null;

      // Unread computation relative to last seen anchor
      const idx = (data || []).findIndex(
        (m) => m._id === lastSeenMsgIdRef.current
      );
      const unreadNow = (() => {
        if (!data) return 0;
        if (idx >= 0) return data.length - 1 - idx;
        return data.length;
      })();

      // If at bottom: mark read and clear indicators
      const el2 = scrollRef.current;
      const atBottom = (() => {
        if (!el2) return true;
        const dist = el2.scrollHeight - el2.scrollTop - el2.clientHeight;
        return dist < STICKY_THRESHOLD;
      })();
      if (atBottom) {
        // If a new doctor message arrived while at bottom (and not first load), play sound only
        if (
          !initialLoadRef.current &&
          nextLast &&
          nextLast._id !== prevLastId &&
          nextLast.senderRole === "doctor"
        ) {
          playSoundOnly();
        }
        await markRead({ doctorId, patientId: user._id, role: "patient" });
        lastSeenMsgIdRef.current =
          (nextArr?.[nextArr.length - 1]?._id as string) || null;
        setNewCount(0);
        clearIndicators();
      } else {
        setNewCount(unreadNow);
        // Only notify when there is a new last message and it's from doctor, and not first load
        if (
          !initialLoadRef.current &&
          nextLast &&
          nextLast._id !== prevLastId &&
          nextLast.senderRole === "doctor"
        ) {
          notifyNewMessages(unreadNow, nextArr?.[nextArr.length - 1]?.content);
        }
      }
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e && "message" in e
          ? String((e as { message?: string }).message)
          : "Không tải được hội thoại";
      toast.error(msg);
    } finally {
      if (initialLoadRef.current) {
        setLoading(false);
        initialLoadRef.current = false;
      }
    }
  };

  useEffect(() => {
    load();
    if (!doctorId || !canChat) return;
    const tick = () => {
      if (!document.hidden) load();
    };
    const id = window.setInterval(tick, 5000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, canChat, justSent]);

  // ===== Scroll controls =====
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollButton(dist >= STICKY_THRESHOLD);
      atBottomRef.current = dist < STICKY_THRESHOLD;
      if (atBottomRef.current && messages.length) {
        lastSeenMsgIdRef.current = messages[messages.length - 1]._id;
        if (newCount) setNewCount(0);
        // mark read in background and clear favicon
        if (canChat && user?._id && doctorId) {
          markRead({ doctorId, patientId: user._id, role: "patient" })
            .then(() => clearIndicators())
            .catch(() => {});
        }
      }
    };
    el.addEventListener("scroll", onScroll);
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    if (justSent || pendingAutoScrollRef.current || atBottomRef.current) {
      requestAnimationFrame(() =>
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      );
    }
    pendingAutoScrollRef.current = false;
    if (justSent) setJustSent(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // ===== Send =====
  const handleSend = async () => {
    if (!content.trim() || !doctorId || !user?._id || sending) return;
    try {
      setSending(true);
      // Send (server will attach appointment context if any)
      await sendMessage({
        appointmentId: "", // backend resolves latest appointment for this doctor-patient pair
        doctorId,
        patientId: user._id,
        senderRole: "patient",
        content: content.trim(),
      });
      setContent("");
      setJustSent(true);
      await load();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e && "message" in e
          ? String((e as { message?: string }).message)
          : "Gửi tin nhắn thất bại";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  // ===== Helpers =====
  const dayBlocks = useMemo(() => {
    const blocks: Array<{ day: string; list: ChatMessage[] }> = [];
    let currentDay = "";
    for (const m of messages) {
      const d = new Date(m.createdAt);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
      if (key !== currentDay) {
        blocks.push({ day: key, list: [m] });
        currentDay = key;
      } else {
        blocks[blocks.length - 1].list.push(m);
      }
    }
    return blocks;
  }, [messages]);

  const formatDay = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const quickReplies = [
    "Tôi muốn đổi giờ khám",
    "Bác sĩ cho tôi hướng dẫn dùng thuốc",
    "Tôi đã đỡ hơn/không đỡ, cần làm gì?",
    "Tôi có dị ứng thuốc, cần tư vấn",
  ];

  const filteredDoctors = useMemo(() => {
    const q = doctorSearch.trim().toLowerCase();
    if (!q) return doctorList;
    return doctorList.filter(
      (d) =>
        (d.name || "").toLowerCase().includes(q) ||
        (typeof d.specialty === "string"
          ? d.specialty
          : d.specialty?.name || ""
        )
          .toLowerCase()
          .includes(q) ||
        (d.workplace || "").toLowerCase().includes(q)
    );
  }, [doctorSearch, doctorList]);

  // derived flag (not currently used)
  // const canUseChat = canChat && !!doctorId;

  // ===== Render =====
  return (
    <div className="min-h-[80vh] bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 text-white">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white p-0.5">
                {doctorInfo?.avatarUrl ? (
                  <img
                    src={doctorInfo.avatarUrl}
                    alt={doctorInfo?.name || "Doctor"}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">
                  {doctorInfo?.name || "Tin nhắn với bác sĩ"}
                </h1>
                <p className="text-white/90 text-sm">
                  {typeof doctorInfo?.specialty === "string"
                    ? doctorInfo?.specialty
                    : doctorInfo?.specialty?.name ||
                      (doctorId
                        ? `Mã bác sĩ: ${doctorId}`
                        : "Chưa có hội thoại")}
                </p>
              </div>
            </div>
            <button
              className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
              onClick={() => setPickerOpen((v) => !v)}
            >
              {pickerOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              Chọn bác sĩ
            </button>
          </div>

          {/* Doctor picker panel */}
          {pickerOpen && (
            <div className="mt-3 rounded-xl border border-white/30 bg-white/10 p-3">
              {doctorList.length === 0 ? (
                <div className="text-sm text-white/90">
                  Bạn chưa có bác sĩ nào trong lịch sử. Hãy đặt lịch khám để bắt
                  đầu trò chuyện.
                </div>
              ) : (
                <>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
                      <input
                        value={doctorSearch}
                        onChange={(e) => setDoctorSearch(e.target.value)}
                        placeholder="Tìm theo tên/chuyên khoa/cơ sở"
                        className="w-72 rounded-lg border border-white/40 bg-white/10 pl-9 pr-3 py-1.5 text-sm placeholder-white/70 focus:bg-white focus:text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {filteredDoctors.map((d) => (
                      <button
                        key={d._id}
                        onClick={() => {
                          setDoctorId(d._id);
                          setPickerOpen(false);
                          initialLoadRef.current = true; // show skeleton for new thread
                          setTimeout(load, 0);
                        }}
                        className={`text-left rounded-lg border px-3 py-2 backdrop-blur-sm transition ${
                          doctorId === d._id
                            ? "border-white bg-white/20"
                            : "border-white/30 hover:bg-white/10"
                        }`}
                      >
                        <div className="font-medium">
                          {d.name || `Bác sĩ ${d._id.slice(-4)}`}
                        </div>
                        <div className="text-xs text-white/80">
                          {(typeof d.specialty === "string"
                            ? d.specialty
                            : d.specialty?.name) || "—"}
                          {d.workplace ? ` • ${d.workplace}` : ""}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat Card */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        {!canChat && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700">
            Bạn cần đăng nhập bằng tài khoản <b>bệnh nhân</b> để sử dụng chat.
          </div>
        )}

        {canChat && !doctorId && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
            Chưa có hội thoại. Chọn một bác sĩ từ <b>Chọn bác sĩ</b> ở trên để
            bắt đầu.
          </div>
        )}

        {canChat && doctorId && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Messages */}
            <div
              ref={scrollRef}
              className="h-[62vh] overflow-y-auto p-4 sm:p-6"
            >
              {loading && (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-16 ${
                        i % 2 ? "ml-auto w-1/2" : "w-1/2"
                      } rounded-2xl bg-slate-100 animate-pulse`}
                    />
                  ))}
                </div>
              )}

              {!loading && messages.length === 0 && (
                <div className="flex h-full items-center justify-center text-slate-500">
                  Chưa có tin nhắn nào.
                </div>
              )}

              {!loading && messages.length > 0 && (
                <div className="space-y-6">
                  {dayBlocks.map(({ day, list }) => (
                    <div key={day}>
                      {/* Day separator */}
                      <div className="mb-3 text-center">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {formatDay(day)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {list.map((m) => {
                          const mine = m.senderRole === "patient";
                          return (
                            <div
                              key={m._id}
                              className={`flex ${
                                mine ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[78%] rounded-2xl border px-3 py-2 shadow ${
                                  mine
                                    ? "bg-teal-500 text-white border-teal-500"
                                    : "bg-white text-slate-800 border-slate-200"
                                }`}
                              >
                                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                                  {m.content}
                                </div>
                                <div
                                  className={`mt-1 text-[10px] ${
                                    mine ? "text-white/80" : "text-slate-500"
                                  }`}
                                >
                                  {formatTime(m.createdAt)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* Scroll to bottom */}
            {showScrollButton && (
              <div className="pointer-events-none -mt-10 flex justify-center">
                <button
                  onClick={() =>
                    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="pointer-events-auto rounded-full bg-slate-900/80 px-3 py-1 text-xs text-white hover:bg-slate-900"
                >
                  Cuộn xuống cuối
                </button>
              </div>
            )}

            {/* Quick replies + Composer */}
            <div className="border-t border-slate-200 px-4 py-2 sm:px-6">
              <div className="mb-2 flex flex-wrap gap-2">
                {quickReplies.map((q) => (
                  <button
                    key={q}
                    onClick={() =>
                      setContent((prev) => (prev ? prev + "\n" + q : q))
                    }
                    className="rounded-full border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <div className="flex items-end gap-2 pb-4">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                  title="Đính kèm (đang phát triển)"
                  disabled
                >
                  <Paperclip className="h-4 w-4" />
                </button>

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                  placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)"
                  className="min-h-[40px] max-h-36 flex-1 resize-y rounded-lg border border-slate-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-200"
                />

                <button
                  onClick={handleSend}
                  disabled={sending || !content.trim()}
                  className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium text-white shadow-sm ${
                    sending || !content.trim()
                      ? "bg-slate-400"
                      : "bg-gradient-to-r from-blue-600 to-teal-500 hover:brightness-110"
                  }`}
                >
                  <Send className="h-4 w-4" /> Gửi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
