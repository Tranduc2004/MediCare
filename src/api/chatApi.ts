const BASE_URL = "https://server-medicare.onrender.com/api/messages";

export type ChatMessage = {
  _id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  senderRole: "doctor" | "patient";
  content: string;
  createdAt: string;
  isReadByDoctor: boolean;
  isReadByPatient: boolean;
};

export async function sendMessage(input: {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  senderRole: "doctor" | "patient";
  content: string;
}) {
  const res = await fetch(`${BASE_URL}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await res.json();
  return (await res.json()) as ChatMessage;
}

export async function getThread(params: {
  doctorId: string;
  patientId: string;
  appointmentId?: string;
}) {
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    )
  ).toString();
  const res = await fetch(`${BASE_URL}/thread?${q}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  if (!res.ok) throw await res.json();
  return (await res.json()) as ChatMessage[];
}

export async function markRead(input: {
  doctorId: string;
  patientId: string;
  role: "doctor" | "patient";
}) {
  const res = await fetch(`${BASE_URL}/mark-read`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function getUnreadCount(params: {
  role: "doctor" | "patient";
  doctorId?: string;
  patientId?: string;
}) {
  const filteredParams: Record<string, string> = Object.fromEntries(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  );
  const q = new URLSearchParams(filteredParams).toString();
  const res = await fetch(`${BASE_URL}/unread-count?${q}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  if (!res.ok) throw await res.json();
  return (await res.json()) as { count: number };
}

export async function getLatestDoctorForPatient(patientId: string) {
  const res = await fetch(`${BASE_URL}/latest-doctor?patientId=${patientId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  if (!res.ok) throw await res.json();
  return (await res.json()) as { doctorId: string | null };
}

export type DoctorThread = {
  patientId: string;
  patient?: {
    name?: string;
    email?: string;
    phone?: string;
    avatar?: string;
  } | null;
  lastMessage?: ChatMessage | null;
  lastMessageAt?: string | null;
  unreadCount: number;
};

export async function getDoctorThreads(doctorId: string) {
  const res = await fetch(`${BASE_URL}/doctor-threads?doctorId=${doctorId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  if (!res.ok) throw await res.json();
  return (await res.json()) as DoctorThread[];
}
