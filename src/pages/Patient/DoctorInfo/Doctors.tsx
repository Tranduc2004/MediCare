import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, ChevronDown, X, Star } from "lucide-react";
import { getDoctors } from "../../../api/doctorsApi";
import { specialtyApi } from "../../../api/specialtyApi";

type Specialty = { _id: string; name: string };
type Doctor = {
  _id: string;
  name: string;
  avatar?: string;
  workplace?: string;
  experience?: number;
  specialties?: string[]; // hoặc id -> map tên nếu cần
  rating?: number;
  consultationCount?: number;
};

const EXPERIENCE_RANGES = [
  { value: "", label: "Tất cả kinh nghiệm" },
  { value: "0-5", label: "0–5 năm" },
  { value: "6-10", label: "6–10 năm" },
  { value: "11-15", label: "11–15 năm" },
  { value: "16-20", label: "16–20 năm" },
  { value: "21", label: "Trên 20 năm" },
];

export default function DoctorsPage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [experience, setExperience] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "experience" | "rating">(
    "name"
  );

  const [params, setParams] = useSearchParams();
  const selectedSpec = params.get("specialty") || "";

  // load specialties
  useEffect(() => {
    specialtyApi
      .getActiveSpecialties()
      .then((data) => setSpecialties(data || []))
      .catch(() => {});
  }, []);

  // load doctors (có thể lọc theo specialty trên URL)
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getDoctors(selectedSpec || undefined);
        setDoctors(data || []);
      } catch {
        setError("Không tải được danh sách bác sĩ");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedSpec]);

  // lọc + search + sort
  const filtered = useMemo(() => {
    let list = [...doctors];

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.workplace || "").toLowerCase().includes(q) ||
          (d.specialties || []).join(" ").toLowerCase().includes(q)
      );
    }

    if (experience) {
      const [min, max] = experience.split("-").map(Number);
      list = list.filter((d) => {
        const exp = d.experience || 0;
        return Number.isNaN(min)
          ? true
          : max
          ? exp >= min && exp <= max
          : exp >= min;
      });
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case "experience":
          return (b.experience || 0) - (a.experience || 0);
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "name":
        default:
          return a.name.localeCompare(b.name, "vi");
      }
    });

    return list;
  }, [doctors, searchQuery, experience, sortBy]);

  const specName = specialties.find((s) => s._id === selectedSpec)?.name;

  return (
    <div className="min-h-screen">
      {/* Header nhỏ gọn */}
      <div className="mx-auto max-w-6xl px-6 pt-10 pb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
          Đội ngũ bác sĩ
        </h1>

        {/* thanh tìm kiếm + sắp xếp */}
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-xl">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, chuyên khoa, nơi làm việc…"
              className="w-full rounded-2xl bg-white/90 pl-10 pr-4 py-3 text-sm text-slate-800
                         ring-1 ring-slate-200 shadow-sm placeholder:text-slate-400
                         focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Sắp xếp</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setSortBy(e.target.value as "name" | "experience" | "rating")
                }
                className="appearance-none rounded-xl bg-white px-3 pr-8 py-2 text-sm text-slate-800
                           ring-1 ring-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
              >
                <option value="name">Tên A–Z</option>
                <option value="experience">Kinh nghiệm</option>
                <option value="rating">Đánh giá</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        {/* chip filter đang áp dụng */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {selectedSpec && (
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-teal-700 ring-1 ring-teal-200">
              {specName || "Chuyên khoa"}
              <button
                onClick={() => setParams({})}
                className="rounded-full p-0.5 hover:bg-teal-50"
                title="Xóa"
              >
                <X className="h-4 w-4" />
              </button>
            </span>
          )}
          {experience && (
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-teal-700 ring-1 ring-teal-200">
              {EXPERIENCE_RANGES.find((r) => r.value === experience)?.label}
              <button
                onClick={() => setExperience("")}
                className="rounded-full p-0.5 hover:bg-teal-50"
                title="Xóa"
              >
                <X className="h-4 w-4" />
              </button>
            </span>
          )}
          <span className="text-sm text-slate-600">
            Tìm thấy <b>{filtered.length}</b> bác sĩ
          </span>
        </div>
      </div>

      {/* Content: sidebar + list */}
      <div className="mx-auto max-w-6xl px-6 pb-16">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* SIDEBAR */}
          <aside className="lg:w-80 shrink-0">
            <div className="sticky top-6 rounded-2xl bg-white/80 backdrop-blur ring-1 ring-slate-200">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-base font-semibold text-slate-900">
                  Bộ lọc
                </h2>
              </div>

              <div className="p-5 space-y-6">
                {/* Chuyên khoa */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Chuyên khoa
                  </label>
                  <div className="max-h-56 overflow-y-auto pr-1">
                    <label className="mb-1 flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                      <input
                        type="radio"
                        name="specialty"
                        value=""
                        checked={!selectedSpec}
                        onChange={() => setParams({})}
                        className="h-4 w-4 accent-teal-600"
                      />
                      <span className="text-sm text-slate-700">
                        Tất cả chuyên khoa
                      </span>
                    </label>

                    {specialties.map((sp) => (
                      <label
                        key={sp._id}
                        className="mb-1 flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                      >
                        <input
                          type="radio"
                          name="specialty"
                          value={sp._id}
                          checked={selectedSpec === sp._id}
                          onChange={() => setParams({ specialty: sp._id })}
                          className="h-4 w-4 accent-teal-600"
                        />
                        <span className="text-sm text-slate-700">
                          {sp.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Kinh nghiệm */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Kinh nghiệm
                  </label>
                  <div className="space-y-1">
                    {EXPERIENCE_RANGES.map((r) => (
                      <label
                        key={r.value}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                      >
                        <input
                          type="radio"
                          name="exp"
                          value={r.value}
                          checked={experience === r.value}
                          onChange={(e) => setExperience(e.target.value)}
                          className="h-4 w-4 accent-teal-600"
                        />
                        <span className="text-sm text-slate-700">
                          {r.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Xóa bộ lọc */}
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setExperience("");
                    setParams({});
                    setSortBy("name");
                  }}
                  className="w-full rounded-xl bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          </aside>

          {/* LIST */}
          <main className="flex-1">
            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="rounded-xl bg-white/90 px-6 py-4 ring-1 ring-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                    <span className="text-slate-700">Đang tải…</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-xl bg-rose-50 p-4 text-rose-700 ring-1 ring-rose-200">
                {error}
              </div>
            )}

            {!loading && !error && (
              <>
                {filtered.length === 0 ? (
                  <div className="mx-auto max-w-md rounded-2xl bg-white/90 p-8 text-center text-slate-600 ring-1 ring-slate-200">
                    Không tìm thấy bác sĩ phù hợp tiêu chí.
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {filtered.map((d) => (
                      <li
                        key={d._id}
                        className="rounded-2xl bg-white/80 p-5 ring-1 ring-slate-200 transition hover:shadow-sm"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center">
                          {/* avatar */}
                          <div className="shrink-0">
                            {d.avatar ? (
                              <img
                                src={d.avatar}
                                alt={d.name}
                                className="h-16 w-16 rounded-full object-cover ring-2 ring-white shadow-sm"
                              />
                            ) : (
                              <div className="grid h-16 w-16 place-items-center rounded-full bg-teal-100 text-teal-700 ring-2 ring-white shadow-sm">
                                {getInitials(d.name)}
                              </div>
                            )}
                          </div>

                          {/* info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
                              <Link
                                to={`/alldoctors/${d._id}`}
                                className="truncate text-base font-semibold text-slate-900 hover:text-teal-700"
                              >
                                Dr. {d.name}
                              </Link>

                              {typeof d.rating === "number" && d.rating > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700 ring-1 ring-amber-200">
                                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                  {d.rating.toFixed(1)}
                                </span>
                              )}
                            </div>

                            <p className="text-sm text-slate-600">
                              {d.workplace ? `${d.workplace}. ` : ""}
                              {`Kinh nghiệm ${d.experience || 0} năm.`}
                              {typeof d.consultationCount === "number"
                                ? ` Đã khám ${d.consultationCount} lượt.`
                                : ""}
                            </p>

                            {d.specialties && d.specialties.length > 0 && (
                              <div className="mt-1 text-sm text-slate-700">
                                <span className="font-medium">
                                  Chuyên khoa:
                                </span>{" "}
                                <span className="text-slate-600">
                                  {d.specialties.slice(0, 3).join(", ")}
                                  {d.specialties.length > 3
                                    ? ` +${d.specialties.length - 3}`
                                    : ""}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* actions */}
                          <div className="flex w-full gap-2 md:w-auto md:justify-end">
                            <Link
                              to={`/alldoctors/${d._id}`}
                              className="inline-flex h-9 items-center justify-center rounded-full bg-white px-4 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                            >
                              Xem
                            </Link>
                            <Link
                              to={`/appointment?doctorId=${d._id}`}
                              className="inline-flex h-9 items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 px-4 text-sm font-medium text-white shadow hover:from-emerald-700 hover:to-teal-600"
                            >
                              Đặt lịch
                            </Link>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

/* helpers */
function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts[parts.length - 1]?.[0] || "";
  return (a + b).toUpperCase();
}
