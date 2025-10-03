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
import { Send, MessageSquare, X, ChevronDown } from "lucide-react";
import { chatBadge } from "../../../store/chatBadge";

const POLL_MS = 5000;
const STICKY_THRESHOLD = 140;

type DoctorInfo = {
  _id: string;
  name?: string;
  specialty?: { name?: string } | string;
  avatarUrl?: string;
};

export default function FloatingChatWidget() {
  const { user, isAuthenticated } = useAuth();
  const canChat = isAuthenticated && user?.role === "patient";

  // UI
  const [open, setOpen] = useState(false);
  const [badgeUnread, setBadgeUnread] = useState<number>(() => chatBadge.get());

  // Chat states
  const [doctorId, setDoctorId] = useState("");
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  // Scroll helpers
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const atBottomRef = useRef(true);
  const pendingAutoScrollRef = useRef(false);
  const initialLoadRef = useRef(true);
  const lastSeenMsgIdRef = useRef<string | null>(null);
  const lastPolledIdRef = useRef<string | null>(null);

  // sync unread badge from global store
  useEffect(() => {
    chatBadge.setUser(canChat && user?._id ? user._id : null);
    setBadgeUnread(chatBadge.get());
    const unsub = chatBadge.subscribe((n) => setBadgeUnread(n));
    return () => {
      unsub();
    };
  }, [canChat, user?._id]);

  // ===== bootstrap: pick latest doctor thread =====
  useEffect(() => {
    const run = async () => {
      if (!canChat || !user?._id) return;
      try {
        const { doctorId } = await getLatestDoctorForPatient(user._id);
        if (doctorId) setDoctorId(doctorId);
      } catch {
        // ignore
      }
    };
    run();
  }, [canChat, user?._id]);

  // load doctor header
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
        setDoctorInfo({ _id: doctorId });
      }
    };
    run();
  }, [doctorId]);

  // poll messages
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
      const arr = Array.isArray(data) ? data : [];
      const nextLast = arr[arr.length - 1];

      setMessages(arr);
      lastPolledIdRef.current = nextLast?._id || null;

      // If panel đang mở & ở đáy => mark read và về 0
      const atBottom = (() => {
        const el2 = scrollRef.current;
        if (!el2) return true;
        const dist = el2.scrollHeight - el2.scrollTop - el2.clientHeight;
        return dist < STICKY_THRESHOLD;
      })();

      if (open && atBottom) {
        await markRead({ doctorId, patientId: user._id, role: "patient" });
        lastSeenMsgIdRef.current = nextLast?._id || null;
        chatBadge.set(0);
      }
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
    const id = window.setInterval(() => {
      if (!document.hidden) load();
    }, POLL_MS);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, canChat, open]);

  // scroll listener: khi mở panel mới attach
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      atBottomRef.current = dist < STICKY_THRESHOLD;
    };
    el.addEventListener("scroll", onScroll);
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [open]);

  // auto-scroll khi messages đổi
  useEffect(() => {
    if (!open) return;
    if (!scrollRef.current) return;
    if (pendingAutoScrollRef.current || atBottomRef.current) {
      requestAnimationFrame(() =>
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      );
    }
    pendingAutoScrollRef.current = false;
  }, [messages, open]);

  // open => mark read & reset badge nếu đang ở đáy
  useEffect(() => {
    if (!open || !messages.length) return;
    if (atBottomRef.current) {
      lastSeenMsgIdRef.current = messages[messages.length - 1]._id;
      chatBadge.set(0);
      if (canChat && user?._id && doctorId) {
        markRead({ doctorId, patientId: user._id, role: "patient" }).catch(
          () => {}
        );
      }
    }
  }, [open, messages.length, canChat, user?._id, doctorId]);

  // send
  const handleSend = async () => {
    const content = input.trim();
    if (!content || !canChat || !user?._id || !doctorId || sending) return;
    setSending(true);
    setInput("");

    const optimistic: ChatMessage = {
      _id: `temp-${Date.now()}`,
      appointmentId: "",
      doctorId,
      patientId: user._id,
      senderRole: "patient",
      content,
      createdAt: new Date().toISOString(),
      isReadByDoctor: false,
      isReadByPatient: true,
    };
    setMessages((p) => [...p, optimistic]);
    pendingAutoScrollRef.current = true;

    try {
      const saved = await sendMessage({
        appointmentId: "",
        doctorId,
        patientId: user._id,
        senderRole: "patient",
        content,
      });
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m._id === optimistic._id);
        if (idx === -1) return prev;
        const next = prev.slice();
        next[idx] = saved;
        return next;
      });
      lastSeenMsgIdRef.current = saved._id;
    } finally {
      setSending(false);
    }
  };

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

  const fmtDay = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  // if chưa đăng nhập đúng vai trò → chỉ hiện nút disabled
  if (!isAuthenticated || user?.role !== "patient") {
    return (
      <button
        className="fixed bottom-5 right-5 rounded-full bg-slate-400 p-4 text-white shadow-lg"
        title="Đăng nhập bằng tài khoản bệnh nhân để chat"
        disabled
      >
        <MessageSquare className="h-5 w-5" />
      </button>
    );
  }

  // nếu chưa có thread bác sĩ → vẫn cho mở panel, hiển thị hướng dẫn
  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 rounded-full bg-teal-600 p-4 text-white shadow-xl hover:bg-teal-700 transition"
        aria-label="Mở chat"
      >
        {badgeUnread > 0 && (
          <span className="absolute -top-0 -right-1 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold px-1.5 py-0.5 min-w-[20px]">
            {badgeUnread > 99 ? "99+" : badgeUnread}
          </span>
        )}
        <div className="relative">
          <MessageSquare className="h-6 w-6" />
        </div>
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-5 w-[92vw] max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">
                {doctorInfo?.avatarUrl ? (
                  <img
                    src={doctorInfo.avatarUrl}
                    alt="Doctor"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <MessageSquare className="h-4 w-4 text-slate-500" />
                )}
              </div>
              <div>
                <div className="text-sm font-semibold">
                  {doctorInfo?.name || "Bác sĩ của bạn"}
                </div>
                <div className="text-[11px] text-slate-500">
                  {typeof doctorInfo?.specialty === "string"
                    ? doctorInfo?.specialty
                    : doctorInfo?.specialty?.name || "—"}
                </div>
              </div>
            </div>
            <button
              className="rounded-md p-1 hover:bg-slate-100"
              onClick={() => setOpen(false)}
              aria-label="Đóng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex h-96 flex-col">
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-3 py-2 space-y-4"
            >
              {loading && (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-14 ${
                        i % 2 ? "ml-auto w-2/3" : "w-2/3"
                      } rounded-2xl bg-slate-100 animate-pulse`}
                    />
                  ))}
                </div>
              )}

              {!loading && !doctorId && (
                <div className="text-center text-sm text-slate-500 py-8">
                  Bạn chưa có cuộc trò chuyện nào. Hãy đặt lịch khám để bắt đầu
                  chat với bác sĩ.
                </div>
              )}

              {!loading && doctorId && messages.length === 0 && (
                <div className="text-center text-sm text-slate-500 py-8">
                  Chưa có tin nhắn.
                </div>
              )}

              {!loading &&
                doctorId &&
                messages.length > 0 &&
                dayBlocks.map(({ day, list }) => (
                  <div key={day}>
                    <div className="mb-2 text-center">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                        {fmtDay(day)}
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
                              className={`max-w-[80%] rounded-2xl border px-3 py-2 shadow text-sm ${
                                mine
                                  ? "bg-teal-500 text-white border-teal-500"
                                  : "bg-white text-slate-800 border-slate-200"
                              }`}
                            >
                              <div className="whitespace-pre-wrap leading-relaxed">
                                {m.content}
                              </div>
                              <div
                                className={`mt-1 text-[10px] ${
                                  mine ? "text-white/80" : "text-slate-500"
                                }`}
                              >
                                {fmtTime(m.createdAt)}
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

            {/* “tin mới” pill khi không ở đáy */}
            {!atBottomRef.current && messages.length > 0 && (
              <div className="pointer-events-none -mt-6 flex justify-center px-3">
                <button
                  className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-teal-600 text-white text-[11px] px-3 py-1 shadow hover:brightness-110"
                  onClick={() =>
                    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  <ChevronDown className="h-3 w-3" /> Tin mới
                </button>
              </div>
            )}

            {/* Composer */}
            <div className="border-t px-3 py-2 flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!sending) handleSend();
                  }
                }}
                rows={1}
                placeholder="Nhập tin nhắn..."
                className="min-h-[38px] max-h-28 flex-1 resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-teal-100 focus:border-teal-600"
              />
              <button
                onClick={handleSend}
                disabled={sending || !input.trim() || !doctorId}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white shadow-sm ${
                  sending || !input.trim() || !doctorId
                    ? "bg-slate-300"
                    : "bg-teal-600 hover:bg-teal-700"
                }`}
              >
                <Send className="h-4 w-4" /> Gửi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
