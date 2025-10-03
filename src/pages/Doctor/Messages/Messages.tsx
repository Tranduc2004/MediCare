import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  ChatMessage,
  getThread,
  markRead,
  getDoctorThreads,
  DoctorThread,
  sendMessage,
} from "../../../api/chatApi";
import { toast } from "react-toastify";
import { useChatNotifications } from "./useChatNotifications";
import {
  MessageSquare,
  Search,
  Send,
  Loader2,
  ChevronDown,
} from "lucide-react";

const STICKY_THRESHOLD = 140; // px: coi như ở cuối khi cách đáy < 140

export default function DoctorMessagesPage() {
  const { user, isAuthenticated } = useAuth();

  // ===== Core =====
  const [patientId, setPatientId] = useState("");
  const [threads, setThreads] = useState<DoctorThread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // ===== UI =====
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false); // chỉ lần đầu mỗi thread
  const [qThread, setQThread] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  // Show-scroll button currently not rendered; keep state local to satisfy logic
  const [, setShowScrollBtn] = useState(false);

  // Anti auto-scroll flags
  const initialLoadRef = useRef(true);
  const atBottomRef = useRef(true);
  const pendingAutoScrollRef = useRef(false);
  const lastPolledLastMessageIdRef = useRef<string | null>(null);

  // New message indicator
  const lastSeenMsgIdRef = useRef<string | null>(null); // msg cuối cùng đã "thấy" (khi ở đáy)
  const [newCount, setNewCount] = useState(0);

  const canChat = isAuthenticated && user?.role === "doctor";
  const { notifyNewMessages, playSoundOnly, clearIndicators } =
    useChatNotifications({
      title: "Tin nhắn từ bệnh nhân",
    });

  // ===== Threads =====
  const loadThreads = async () => {
    if (!canChat || !user?._id) return;
    try {
      setLoadingThreads(true);
      const list = await getDoctorThreads(user._id);
      const arr = Array.isArray(list) ? list : [];
      setThreads(arr);
      // chọn thread đầu nếu chưa chọn
      if (!patientId && arr.length > 0) setPatientId(arr[0].patientId);
    } catch {
      // silent
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    loadThreads();
    const t = window.setInterval(() => {
      if (!document.hidden) loadThreads();
    }, 8000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canChat, user?._id]);

  // ===== Load messages for a selected patient =====
  const load = async () => {
    if (!canChat || !patientId || !user?._id) return;
    try {
      if (initialLoadRef.current) setLoadingMessages(true);

      // đo khoảng cách đến đáy trước khi cập nhật
      const el = scrollRef.current;
      if (el) {
        const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
        pendingAutoScrollRef.current = dist < STICKY_THRESHOLD;
      }

      const data = await getThread({ doctorId: user._id, patientId });
      const prevLastId = lastPolledLastMessageIdRef.current;

      const next = Array.isArray(data) ? data : [];
      const nextLast = (next[next.length - 1] || null) as ChatMessage | null;
      lastPolledLastMessageIdRef.current = nextLast?._id || null;
      setMessages((prev) => {
        // tránh re-render khi không đổi
        if (
          prev.length === next.length &&
          prev[prev.length - 1]?._id === next[next.length - 1]?._id
        ) {
          return prev;
        }
        return next;
      });

      // Nếu đang ở đáy, đánh dấu đã xem và cập nhật anchor
      if (atBottomRef.current) {
        if (
          !initialLoadRef.current &&
          nextLast &&
          nextLast._id !== prevLastId &&
          nextLast.senderRole === "patient"
        ) {
          playSoundOnly();
        }
        await markRead({ doctorId: user._id, patientId, role: "doctor" });
        lastSeenMsgIdRef.current =
          (data?.length ? data[data.length - 1]._id : null) ?? null;
        setNewCount(0);
        // clear favicon badge when read
        clearIndicators();
      } else {
        // Tính số tin mới dựa trên anchor
        const idx = (data || []).findIndex(
          (m) => m._id === lastSeenMsgIdRef.current
        );
        if (idx >= 0) setNewCount(data.length - 1 - idx);
        else if ((data || []).length) setNewCount(data.length); // chưa từng thấy
        const unreadNow = (() => {
          if (!data) return 0;
          if (idx >= 0) return data.length - 1 - idx;
          return data.length;
        })();
        const last = (data?.[data.length - 1] || null) as ChatMessage | null;
        if (
          !initialLoadRef.current &&
          last &&
          last._id !== prevLastId &&
          last.senderRole === "patient"
        ) {
          notifyNewMessages(unreadNow, (last?.content as string) || undefined);
        }
      }
    } catch (e) {
      const msg =
        typeof e === "object" && e && "message" in e
          ? String((e as { message?: string }).message)
          : "Không tải được hội thoại";
      toast.error(msg);
    } finally {
      if (initialLoadRef.current) {
        setLoadingMessages(false);
        initialLoadRef.current = false;
      }
    }
  };

  useEffect(() => {
    // khi đổi thread
    if (!patientId) return;
    initialLoadRef.current = true;
    lastSeenMsgIdRef.current = null;
    setNewCount(0);
    load();
    const id = window.setInterval(() => {
      if (!document.hidden) load();
    }, 5000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, canChat]);

  // auto-scroll khi messages đổi
  useEffect(() => {
    if (!scrollRef.current) return;
    if (pendingAutoScrollRef.current || atBottomRef.current) {
      requestAnimationFrame(() =>
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      );
    }
    pendingAutoScrollRef.current = false;
  }, [messages]);

  // scroll listener
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(dist >= STICKY_THRESHOLD);
      const atBottom = dist < STICKY_THRESHOLD;
      atBottomRef.current = atBottom;
      if (atBottom && messages.length) {
        // vừa chạm đáy: cập nhật anchor & clear newCount
        lastSeenMsgIdRef.current = messages[messages.length - 1]._id;
        if (newCount) setNewCount(0);
        // mark read nền (không cần await)
        if (canChat && user?._id && patientId) {
          markRead({ doctorId: user._id, patientId, role: "doctor" }).catch(
            () => {}
          );
        }
      }
    };
    el.addEventListener("scroll", onScroll);
    onScroll(); // init
    return () => el.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, canChat, user?._id, patientId, newCount]);

  // ===== Send =====
  const handleSend = async () => {
    if (!canChat || !user?._id || !patientId) return;
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput("");

    // optimistic append
    const optimistic: ChatMessage = {
      _id: `temp-${Date.now()}`,
      appointmentId: "", // server sẽ resolve
      doctorId: user._id,
      patientId,
      senderRole: "doctor",
      content,
      createdAt: new Date().toISOString(),
      isReadByDoctor: true,
      isReadByPatient: false,
    };
    setMessages((prev) => [...prev, optimistic]);
    pendingAutoScrollRef.current = true;

    try {
      const saved = await sendMessage({
        appointmentId: "",
        doctorId: user._id,
        patientId,
        senderRole: "doctor",
        content,
      });
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m._id === optimistic._id);
        if (idx === -1) return prev;
        const next = prev.slice();
        next[idx] = saved;
        return next;
      });
      // sau khi gửi, coi như đã thấy
      lastSeenMsgIdRef.current = saved._id;
      setNewCount(0);
      // mark read nhẹ
      markRead({ doctorId: user._id, patientId, role: "doctor" }).catch(
        () => {}
      );
    } catch (_e) {
      // rollback optimistic
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      const msg =
        typeof _e === "object" && _e && "message" in _e
          ? String((_e as { message?: string }).message)
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

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  // New-separator index
  const newStartIndex = useMemo(() => {
    if (!lastSeenMsgIdRef.current || !messages.length) return -1;
    const idx = messages.findIndex((m) => m._id === lastSeenMsgIdRef.current);
    if (idx === -1) return -1;
    if (idx < messages.length - 1) return idx + 1; // phần đầu tiên sau anchor
    return -1;
  }, [messages]);

  // Thread filtering
  const filteredThreads = useMemo(() => {
    const q = qThread.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(
      (t) =>
        (t.patient?.name || "").toLowerCase().includes(q) ||
        (t.lastMessage?.content || "").toLowerCase().includes(q)
    );
  }, [threads, qThread]);

  return (
    <div className="min-h-[80vh] bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-600 text-white">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Tin nhắn với bệnh nhân
            </h1>
            <p className="text-slate-600">
              Bác sĩ: <b>{user?.name || user?._id}</b>
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ==== LEFT: Threads ==== */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 md:col-span-1 flex flex-col">
          <div className="mb-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={qThread}
                onChange={(e) => setQThread(e.target.value)}
                placeholder="Tìm bệnh nhân hoặc nội dung..."
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y">
            {loadingThreads && (
              <div className="space-y-2 p-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-14 rounded-xl bg-slate-100 animate-pulse"
                  />
                ))}
              </div>
            )}

            {!loadingThreads && filteredThreads.length === 0 && (
              <div className="text-sm text-slate-500 p-3">
                Không có hội thoại
              </div>
            )}

            {!loadingThreads &&
              filteredThreads.map((th) => (
                <button
                  key={th.patientId}
                  className={`w-full text-left p-3 hover:bg-slate-50 transition ${
                    patientId === th.patientId ? "bg-slate-50" : "bg-white"
                  }`}
                  onClick={() => setPatientId(th.patientId)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 truncate">
                        {th.patient?.name || th.patientId}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {th.lastMessage?.content || "(Chưa có tin nhắn)"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {th.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs px-2 py-0.5">
                          {th.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </aside>

        {/* ==== RIGHT: Chat ==== */}
        <section className="rounded-2xl border border-slate-200 bg-white md:col-span-2 flex flex-col overflow-hidden">
          {/* Messages area */}
          <div ref={scrollRef} className="h-[65vh] overflow-y-auto p-4 sm:p-6">
            {/* Initial loading skeleton */}
            {loadingMessages && (
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

            {!loadingMessages && messages.length === 0 && (
              <div className="h-full flex items-center justify-center text-slate-500">
                Chưa có tin nhắn
              </div>
            )}

            {!loadingMessages && messages.length > 0 && (
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
                        const globalIndex = messages.findIndex(
                          (x) => x._id === m._id
                        );
                        const showNewSep =
                          newStartIndex >= 0 && globalIndex === newStartIndex;
                        const mine = m.senderRole === "doctor";
                        return (
                          <div key={m._id} className="space-y-2">
                            {showNewSep && (
                              <div className="flex items-center gap-2 my-2">
                                <div className="flex-1 h-px bg-blue-200" />
                                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 rounded-full px-2 py-0.5">
                                  Tin nhắn mới
                                </span>
                                <div className="flex-1 h-px bg-blue-200" />
                              </div>
                            )}
                            <div
                              className={`flex ${
                                mine ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[78%] rounded-2xl border px-3 py-2 shadow ${
                                  mine
                                    ? "bg-blue-600 text-white border-blue-600"
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

          {/* New messages floating pill */}
          {newCount > 0 && !atBottomRef.current && (
            <div className="pointer-events-none -mt-10 flex justify-center">
              <button
                className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-blue-600 text-white text-xs px-3 py-1 shadow hover:brightness-110"
                onClick={() =>
                  bottomRef.current?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <ChevronDown className="h-3 w-3" /> {newCount} tin mới
              </button>
            </div>
          )}

          {/* Composer */}
          <div className="border-t border-slate-200 p-3 flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!sending) handleSend();
                }
              }}
              rows={2}
              placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)"
              className="flex-1 resize-none rounded-lg border border-slate-300 p-2 text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600"
            />
            <button
              disabled={sending || !input.trim()}
              onClick={handleSend}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm ${
                sending || !input.trim()
                  ? "bg-blue-300"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Gửi
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
