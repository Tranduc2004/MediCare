import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Star,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  ThumbsUp,
} from "lucide-react";
import { getDoctorById, getDoctorSchedules } from "../../../api/doctorsApi";

/* ===== Types ===== */
type Doctor = {
  _id: string;
  name: string;
  avatar?: string;
  specialty?: { name?: string } | string;
  workplace?: string;
  experience?: number;
  description?: string;
  education?: string[];
  certifications?: string[];
  languages?: string[];
  rating?: number;
  totalReviews?: number;
  patientsTreated?: number;
  phone?: string;
  email?: string;
  address?: string;
};

type Schedule = {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "accepted";
  isBooked: boolean;
};

/* ===== Fallback static data ===== */
const FALLBACK = {
  phone: "(555) 123-4567",
  email: "amelia.chen@healthconnect.com",
  address: "123 Medical Center Drive, New York, NY 10001",
  rating: 4.8,
  reviewCount: 256,
  breakdownPct: { 5: 70, 4: 20, 3: 5, 2: 3, 1: 2 },
  reviews: [
    {
      name: "Sophia Lee",
      date: "June 15, 2024",
      rating: 5,
      text: "Dr. Chen is an excellent doctor. She is very thorough and takes the time to listen to my concerns. I highly recommend her.",
      likes: 12,
      replies: 2,
    },
    {
      name: "Ethan Clark",
      date: "May 22, 2024",
      rating: 4,
      text: "Dr. Chen is knowledgeable and professional. The appointment felt a bit rushed, but overall a good experience.",
      likes: 5,
      replies: 1,
    },
    {
      name: "Olivia Davis",
      date: "April 10, 2024",
      rating: 5,
      text: "Dr. Chen is amazing! She is caring, attentive, and made me feel comfortable. I'm so glad I found her.",
      likes: 8,
      replies: 0,
    },
  ],
};

/* ===== Helpers ===== */
function monthMatrix(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const startIdx = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(42).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells[startIdx + d - 1] = d;
  return cells;
}

function getAvailableDaysInMonth(
  schedules: Schedule[],
  year: number,
  month: number
): Set<number> {
  const availableDays = new Set<number>();

  schedules.forEach((schedule) => {
    const scheduleDate = new Date(schedule.date);
    if (
      scheduleDate.getFullYear() === year &&
      scheduleDate.getMonth() === month
    ) {
      availableDays.add(scheduleDate.getDate());
    }
  });

  return availableDays;
}

export default function DoctorDetailPage() {
  const { id } = useParams();
  // const navigate = useNavigate(); // removed due to unused

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"overview" | "reviews" | "insurance">(
    "overview"
  );

  const [baseMonth, setBaseMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [doctorData, scheduleData] = await Promise.all([
          getDoctorById(id),
          getDoctorSchedules(id),
        ]);
        setDoctor(doctorData);
        setSchedules(scheduleData || []);
      } catch {
        // use fallback
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const specText = useMemo(() => {
    if (!doctor?.specialty) return "";
    return typeof doctor.specialty === "string"
      ? doctor.specialty
      : doctor.specialty.name || "";
  }, [doctor?.specialty]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
          <div className="mt-6 h-40 animate-pulse rounded-3xl bg-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-teal-50">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Profile Header */}
        <div className="mb-8 flex items-start justify-between rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex gap-6">
            {doctor?.avatar ? (
              <img
                src={doctor.avatar}
                className="h-24 w-24 rounded-full object-cover"
                alt={doctor.name}
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600">
                <span className="text-2xl font-semibold text-white">
                  {doctor?.name?.charAt(0) || "D"}
                </span>
              </div>
            )}

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {doctor ? `Dr. ${doctor.name}` : "Dr. —"}
              </h1>
              <p className="mt-1 text-gray-600">
                {specText || "Internal Medicine"}
              </p>
              <p className="mt-0.5 text-sm text-gray-500">
                {doctor?.workplace || "123 Medical Center, New York, NY"}
              </p>
            </div>
          </div>

          <button className="rounded-lg bg-teal-500 px-6 py-2.5 font-medium text-white hover:bg-teal-600">
            Book Appointment
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-teal-500">
          <div className="flex gap-8">
            {["overview", "reviews", "insurance"].map((t) => (
              <button
                key={t}
                onClick={() =>
                  setTab(t as "overview" | "reviews" | "insurance")
                }
                className={`relative pb-4 font-medium capitalize ${
                  tab === t
                    ? "text-teal-500"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "overview"
                  ? "Overview"
                  : t === "reviews"
                  ? "Reviews"
                  : "Insurance"}
                {tab === t && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {tab === "overview" && (
          <div className="space-y-8">
            {/* About */}
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-bold text-gray-900">
                About Dr. {doctor?.name?.split(" ").pop() || "Chen"}
              </h2>
              <p className="leading-7 text-gray-700">
                {doctor?.description ||
                  "Dr. Amelia Chen is a board-certified internist with over 15 years of experience. She specializes in preventive care, chronic disease management, and women's health. Dr. Chen is committed to providing personalized and compassionate care to her patients."}
              </p>
            </section>

            {/* Contact Information */}
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-gray-900">
                Contact Information
              </h3>
              <div className="space-y-4">
                <ContactRow
                  icon={<Phone className="h-5 w-5" />}
                  label="Phone"
                  value={doctor?.phone || FALLBACK.phone}
                />
                <ContactRow
                  icon={<Mail className="h-5 w-5" />}
                  label="Email"
                  value={doctor?.email || FALLBACK.email}
                />
                <ContactRow
                  icon={<MapPin className="h-5 w-5" />}
                  label="Address"
                  value={
                    doctor?.address || doctor?.workplace || FALLBACK.address
                  }
                />
              </div>
            </section>

            {/* Availability */}
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-gray-900">
                Availability
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                <CalendarMonth
                  date={baseMonth}
                  schedules={schedules}
                  onPrev={() => {
                    const d = new Date(baseMonth);
                    d.setMonth(d.getMonth() - 1);
                    setBaseMonth(d);
                  }}
                  side="left"
                />
                <CalendarMonth
                  date={
                    new Date(
                      baseMonth.getFullYear(),
                      baseMonth.getMonth() + 1,
                      1
                    )
                  }
                  schedules={schedules}
                  onNext={() => {
                    const d = new Date(baseMonth);
                    d.setMonth(d.getMonth() + 1);
                    setBaseMonth(d);
                  }}
                  side="right"
                />
              </div>
            </section>

            {/* Patient Reviews */}
            <ReviewsBlock
              avg={doctor?.rating ?? FALLBACK.rating}
              count={doctor?.totalReviews ?? FALLBACK.reviewCount}
              breakdownPct={FALLBACK.breakdownPct}
              reviews={FALLBACK.reviews}
            />
          </div>
        )}

        {tab === "reviews" && (
          <div>
            <ReviewsBlock
              avg={doctor?.rating ?? FALLBACK.rating}
              count={doctor?.totalReviews ?? FALLBACK.reviewCount}
              breakdownPct={FALLBACK.breakdownPct}
              reviews={FALLBACK.reviews}
            />
          </div>
        )}

        {tab === "insurance" && (
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-lg font-bold text-gray-900">Insurance</h3>
            <p className="leading-7 text-gray-700">
              We currently work with many health insurance providers: BaoViet,
              PTI, PVI, Bao Minh... Please bring your health insurance
              card/related documents when visiting or contact the hotline for
              support.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

/* ---------- Subcomponents ---------- */
function ContactRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div
        className="flex items-center gap-3 text-gray-600"
        style={{ minWidth: "100px" }}
      >
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      <div className="flex-1 text-gray-900">{value}</div>
    </div>
  );
}

function CalendarMonth({
  date,
  schedules,
  onPrev,
  onNext,
  side,
}: {
  date: Date;
  schedules: Schedule[];
  onPrev?: () => void;
  onNext?: () => void;
  side: "left" | "right";
}) {
  const title = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);

  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const cells = monthMatrix(date);

  // Get available days from actual schedules
  const availableDays = getAvailableDaysInMonth(
    schedules,
    date.getFullYear(),
    date.getMonth()
  );

  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <div className="mb-4 flex items-center justify-between">
        {side === "left" && onPrev ? (
          <button
            onClick={onPrev}
            className="rounded-lg p-1.5 hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
        ) : (
          <div className="w-8" />
        )}

        <div className="text-base font-semibold text-gray-900">{title}</div>

        {side === "right" && onNext ? (
          <button
            onClick={onNext}
            className="rounded-lg p-1.5 hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        ) : (
          <div className="w-8" />
        )}
      </div>

      <div className="grid grid-cols-7 gap-2 text-center">
        {days.map((d, index) => (
          <div key={index} className="py-2 text-sm font-medium text-gray-500">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 text-center">
        {cells.map((n, i) => (
          <div
            key={i}
            className={`flex h-10 items-center justify-center rounded-lg text-sm ${
              n
                ? availableDays.has(n)
                  ? "bg-teal-500 font-medium text-white"
                  : "text-gray-700 hover:bg-gray-50"
                : "text-transparent"
            }`}
          >
            {n ?? "-"}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsBlock({
  avg,
  count,
  breakdownPct,
  reviews,
}: {
  avg: number;
  count: number;
  breakdownPct: Record<1 | 2 | 3 | 4 | 5, number>;
  reviews: {
    name: string;
    date: string;
    rating: number;
    text: string;
    likes: number;
    replies: number;
  }[];
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="mb-6 text-lg font-bold text-gray-900">Patient Reviews</h3>

      <div className="mb-8 flex gap-8">
        {/* Rating Summary */}
        <div className="flex flex-col items-center">
          <div className="text-5xl font-bold text-gray-900">
            {avg.toFixed(1)}
          </div>
          <div className="mt-2 flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < Math.floor(avg)
                    ? "fill-gray-900 text-gray-900"
                    : i < avg
                    ? "fill-gray-300 text-gray-300"
                    : "fill-gray-200 text-gray-200"
                }`}
              />
            ))}
          </div>
          <div className="mt-1 text-sm text-gray-600">{count} reviews</div>
        </div>

        {/* Breakdown */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <span className="w-3 text-sm text-gray-700">{s}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full bg-gray-900"
                  style={{ width: `${breakdownPct[s as 1 | 2 | 3 | 4 | 5]}%` }}
                />
              </div>
              <span className="w-10 text-right text-sm text-gray-600">
                {breakdownPct[s as 1 | 2 | 3 | 4 | 5]}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.map((r, idx) => (
          <div key={idx} className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-400">
              <span className="font-semibold text-white">
                {r.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{r.name}</div>
                  <div className="text-sm text-gray-500">{r.date}</div>
                </div>
              </div>
              <div className="mt-2 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < r.rating
                        ? "fill-gray-900 text-gray-900"
                        : "fill-gray-200 text-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-3 leading-6 text-gray-700">{r.text}</p>
              <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                <button className="flex items-center gap-1.5 hover:text-gray-700">
                  <ThumbsUp className="h-4 w-4" />
                  {r.likes}
                </button>
                <button className="flex items-center gap-1.5 hover:text-gray-700">
                  <MessageSquare className="h-4 w-4" />
                  {r.replies}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
