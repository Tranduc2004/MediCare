import { useEffect, useRef } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useChatNotifications } from "../../../pages/Doctor/Messages/useChatNotifications";
import {
  getDoctorThreads,
  getThread,
  getLatestDoctorForPatient,
  ChatMessage,
  DoctorThread,
} from "../../../api/chatApi";
import { chatBadge } from "../../../store/chatBadge";

const POLL_MS = 5000;

export default function GlobalChatNotifier() {
  const { isAuthenticated, user } = useAuth();
  const { notifyNewMessages, playSoundOnly, setBadge } = useChatNotifications({
    showPopupWhenVisible: true,
  });

  // Persist last seen message id across pages/tabs for current user
  const lastIdRef = useRef<string | null>(null);
  const storageKey = user?._id ? `chat:lastId:${user._id}` : "";

  useEffect(() => {
    // keep store in sync with current user and load persisted badge
    chatBadge.setUser(user?._id || null);
    if (!storageKey) return;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) lastIdRef.current = saved;
    } catch {
      // ignore
    }
  }, [storageKey, user?._id]);

  useEffect(() => {
    if (!isAuthenticated || !user?._id) return;

    let timer: number | null = null;

    const tick = async () => {
      try {
        if (user.role === "patient") {
          // find latest doctor and pull last message in that thread
          const { doctorId } = await getLatestDoctorForPatient(user._id);
          if (!doctorId) return;
          const arr = (await getThread({ doctorId, patientId: user._id })) as
            | ChatMessage[]
            | undefined;
          const list = Array.isArray(arr) ? arr : [];
          const last = (list[list.length - 1] || null) as ChatMessage | null;
          if (!last) return;
          // compute unread for patient
          const unread = list.filter((m) => {
            const flag = (m as unknown as { isReadByPatient?: boolean })
              .isReadByPatient;
            return m.senderRole === "doctor" && flag === false;
          }).length;
          // always badge to reflect current unread (no sound)
          setBadge(unread);
          chatBadge.set(unread);
          // sound only on truly new incoming doctor message
          if (last._id !== lastIdRef.current && last.senderRole === "doctor") {
            playSoundOnly();
          }
          lastIdRef.current = last._id;
          if (storageKey) {
            try {
              window.localStorage.setItem(storageKey, last._id);
            } catch {
              // ignore
            }
          }
        } else if (user.role === "doctor") {
          // get all threads and detect newest last message from patients
          const list = (await getDoctorThreads(user._id)) as DoctorThread[];
          const arr = Array.isArray(list) ? list : [];
          if (!arr.length) return;
          // sum unread across threads
          const totalUnread = arr.reduce(
            (sum, t) => sum + (t.unreadCount || 0),
            0
          );
          // find most recent by lastMessage.createdAt fallback to 0
          const newest = arr
            .filter((t) => t.lastMessage)
            .sort((a, b) => {
              const ta = new Date(a.lastMessage!.createdAt).getTime() || 0;
              const tb = new Date(b.lastMessage!.createdAt).getTime() || 0;
              return tb - ta;
            })[0];
          const last = (newest?.lastMessage || null) as ChatMessage | null;
          if (!last) return;
          // always badge to reflect current unread (no sound)
          setBadge(totalUnread);
          chatBadge.set(totalUnread);
          // sound only on truly new incoming patient message
          if (last._id !== lastIdRef.current && last.senderRole === "patient") {
            playSoundOnly();
          }
          lastIdRef.current = last._id;
          if (storageKey) {
            try {
              window.localStorage.setItem(storageKey, last._id);
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // silent
      }
    };

    // initial and interval
    tick();
    timer = window.setInterval(tick, POLL_MS);
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [
    isAuthenticated,
    user?._id,
    user?.role,
    notifyNewMessages,
    playSoundOnly,
    setBadge,
    storageKey,
  ]);

  return null;
}
