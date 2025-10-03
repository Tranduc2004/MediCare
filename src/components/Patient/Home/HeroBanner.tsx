import { Search, ChevronDown, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDoctors } from "../../../api/doctorsApi";
import { specialtyApi } from "../../../api/specialtyApi";
import { motion } from "framer-motion";

export default function HeroBanner() {
  const navigate = useNavigate();
  const [specialties, setSpecialties] = useState<
    Array<{ _id: string; name: string }>
  >([]);
  const [doctors, setDoctors] = useState<
    Array<{ _id: string; name: string; workplace?: string }>
  >([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  // trạng thái tải và lỗi để hiển thị placeholder hợp lý
  const [specLoading, setSpecLoading] = useState(true);
  const [specErr, setSpecErr] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docErr, setDocErr] = useState<string | null>(null);
  // Placeholder hiển thị cho select (đặt trước khi dùng ở specLabel/docLabel)
  const doctorPlaceholder = !selectedSpecialty
    ? "Chọn bác sĩ"
    : docLoading
    ? "Đang tải bác sĩ..."
    : docErr
    ? "Lỗi tải bác sĩ"
    : doctors.length === 0
    ? "Không có bác sĩ"
    : "Tên bác sĩ";

  const specialtyPlaceholder = specLoading
    ? "Đang tải chuyên khoa..."
    : specErr
    ? "Lỗi tải chuyên khoa"
    : "Chuyên khoa";
  // Dropdown states/refs and derived labels
  const [specOpen, setSpecOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  const specRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLDivElement>(null);

  const specLabel = selectedSpecialty
    ? specialties.find((s) => s._id === selectedSpecialty)?.name ||
      specialtyPlaceholder
    : specialtyPlaceholder;

  const docDisabled = !selectedSpecialty || docLoading || doctors.length === 0;
  const docLabel = selectedDoctor
    ? (() => {
        const d = doctors.find((dx) => dx._id === selectedDoctor);
        return d
          ? `${d.name}${d.workplace ? ` - ${d.workplace}` : ""}`
          : doctorPlaceholder;
      })()
    : doctorPlaceholder;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSpecOpen(false);
        setDocOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (specRef.current && !specRef.current.contains(t)) setSpecOpen(false);
      if (docRef.current && !docRef.current.contains(t)) setDocOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  // Placeholder hiển thị cho select
  // (ĐÃ DI CHUYỂN LÊN TRÊN để tránh lỗi "Cannot access before initialization")
  useEffect(() => {
    setSpecLoading(true);
    setSpecErr(null);
    specialtyApi
      .getActiveSpecialties()
      .then((data) => setSpecialties(data || []))
      .catch(() => {
        setSpecErr("Không thể tải chuyên khoa");
      })
      .finally(() => setSpecLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedSpecialty) {
      setDoctors([]);
      setSelectedDoctor("");
      setDocErr(null);
      setDocLoading(false);
      return;
    }
    setDocLoading(true);
    setDocErr(null);
    getDoctors(selectedSpecialty)
      .then((data) => setDoctors(data || []))
      .catch(() => {
        setDoctors([]);
        setDocErr("Không thể tải danh sách bác sĩ");
      })
      .finally(() => setDocLoading(false));
  }, [selectedSpecialty]);

  const handleSearch = () => {
    if (selectedDoctor) {
      navigate(`/alldoctors/${selectedDoctor}`);
      return;
    }
    if (selectedSpecialty) {
      navigate(`/alldoctors?specialty=${selectedSpecialty}`);
      return;
    }
    navigate("/alldoctors");
  };

  return (
    <div className="min-h-screen bg-[#E8F7F5] text-[#0f172a] relative overflow-hidden">
      {/* big mint arc background */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="pointer-events-none absolute right-[-20%] top-[20%] h-[800px] w-[800px] rounded-[9999px] bg-teal-500"
      />
      {/* Hero */}
      <section
        className="overflow-x-hidden relative pt-24 pb-16 md:pt-28 md:pb-24"
        aria-label="Phần banner"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-14 md:grid-cols-2 md:py-20">
          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative z-10"
          >
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-5xl font-extrabold leading-tight tracking-[-0.02em] text-slate-900 md:text-6xl"
            >
              Tìm kiếm bác sĩ
              <br />
              <span className="relative mt-2 inline-block">
                <span className="relative z-10 text-teal-500">Yêu thích</span>
                {/* underline swoosh */}
                <motion.svg
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 1.0 }}
                  className="absolute -bottom-2 left-0 h-4 w-[115%] -skew-x-6 text-teal-500"
                  viewBox="0 0 260 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <motion.path
                    d="M2 14 C 60 4, 200 4, 258 14"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                </motion.svg>
              </span>{" "}
              <span className="block">của bạn</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-5 max-w-xl text-slate-600"
            >
              Nền tảng giúp bạn tìm bác sĩ phù hợp và đặt lịch khám nhanh chóng,
              tiện lợi.
            </motion.p>

            {/* Search bar */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-8 rounded-full bg-white shadow-lg ring-1 ring-black/5"
            >
              <div className="flex items-center gap-4 px-5 py-3">
                {/* Specialty */}
                <div className="group flex min-w-0 flex-1 items-center gap-2 text-left">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-50">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div className="flex-1 relative min-w-0" ref={specRef}>
                    <button
                      type="button"
                      onClick={() => setSpecOpen((o) => !o)}
                      className="w-full rounded-full bg-teal-50 text-teal-700 px-3 py-2 pr-6 ring-1 ring-teal-300 hover:ring-teal-400 focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm transition-colors"
                      aria-haspopup="listbox"
                      aria-expanded={specOpen}
                      aria-label="Chọn chuyên khoa"
                      title={specLabel}
                    >
                      <span className="block truncate">{specLabel}</span>
                    </button>
                    {specOpen && (
                      <div
                        role="listbox"
                        aria-label="Danh sách chuyên khoa"
                        className="absolute left-0 right-0 top-full mt-2 max-h-64 overflow-auto rounded-xl bg-white ring-1 ring-teal-300 shadow-xl z-20"
                      >
                        {specLoading && (
                          <div className="px-3 py-2 text-sm text-teal-600">
                            Đang tải chuyên khoa...
                          </div>
                        )}
                        {specErr && !specLoading && (
                          <div className="px-3 py-2 text-sm text-red-600">
                            Không thể tải chuyên khoa
                          </div>
                        )}
                        {!specLoading &&
                          !specErr &&
                          specialties.map((s) => (
                            <button
                              key={s._id}
                              type="button"
                              onClick={() => {
                                setSelectedSpecialty(s._id);
                                setSelectedDoctor("");
                                setSpecOpen(false);
                              }}
                              className={`block w-full text-left px-3 py-2 text-sm ${
                                selectedSpecialty === s._id
                                  ? "bg-teal-50 text-teal-700"
                                  : "text-slate-700 hover:bg-teal-50"
                              }`}
                              title={s.name}
                            >
                              <span className="block truncate">{s.name}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                  <ChevronDown className="pointer-events-none ml-auto h-4 w-4 text-teal-500 group-hover:text-teal-600" />
                </div>

                <div className="h-6 w-px bg-slate-200" />

                {/* Doctor name */}
                <div className="group flex min-w-0 flex-1 items-center gap-2 text-left">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-50">
                    <Search className="h-4 w-4" />
                  </span>
                  <div className="flex-1 relative min-w-0" ref={docRef}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!docDisabled) setDocOpen((o) => !o);
                      }}
                      disabled={docDisabled}
                      className={`w-full rounded-full text-sm px-3 py-2 pr-6 ring-1 transition-colors focus:outline-none ${
                        docDisabled
                          ? "bg-teal-50 text-teal-400 ring-teal-200 cursor-not-allowed"
                          : "bg-teal-50 text-teal-700 ring-teal-300 hover:ring-teal-400 focus:ring-2 focus:ring-teal-500"
                      }`}
                      aria-haspopup="listbox"
                      aria-expanded={docOpen}
                      aria-label="Chọn bác sĩ"
                      title={docLabel}
                    >
                      <span className="block truncate">{docLabel}</span>
                    </button>
                    {docOpen && !docDisabled && (
                      <div
                        role="listbox"
                        aria-label="Danh sách bác sĩ"
                        className="absolute left-0 right-0 top-full mt-2 max-h-64 overflow-auto rounded-xl bg-white ring-1 ring-teal-300 shadow-xl z-20"
                      >
                        {docErr && (
                          <div className="px-3 py-2 text-sm text-red-600">
                            Không thể tải danh sách bác sĩ
                          </div>
                        )}
                        {!docErr &&
                          doctors.map((d) => (
                            <button
                              key={d._id}
                              type="button"
                              onClick={() => {
                                setSelectedDoctor(d._id);
                                setDocOpen(false);
                              }}
                              className={`block w-full text-left px-3 py-2 text-sm ${
                                selectedDoctor === d._id
                                  ? "bg-teal-50 text-teal-700"
                                  : "text-slate-700 hover:bg-teal-50"
                              }`}
                              title={`${d.name}${
                                d.workplace ? ` - ${d.workplace}` : ""
                              }`}
                            >
                              <span className="block truncate">
                                {d.name}
                                {d.workplace ? ` - ${d.workplace}` : ""}
                              </span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                  <ChevronDown className="pointer-events-none ml-auto h-4 w-4 text-teal-500 group-hover:text-teal-600" />
                </div>
                <button
                  onClick={handleSearch}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-teal-500 text-white hover:bg-teal-600 z-30"
                  aria-label="Tìm kiếm bác sĩ"
                  title="Tìm kiếm bác sĩ"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>

          {/* Doctor image */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="relative z-10 mx-auto w-[420px] max-w-full"
            >
              <img
                className="h-auto w-full rounded-3xl object-cover shadow-2xl"
                src="https://images.unsplash.com/photo-1604881991720-f91add269bed?q=80&w=1200&auto=format&fit=crop"
                alt="Bác sĩ"
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="bg-teal-500"
        >
          <div className="mx-auto max-w-7xl px-8 py-12">
            <div className="grid grid-cols-3 divide-x divide-white/30 text-white">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="text-center px-8"
              >
                <div className="text-6xl font-bold mb-2">24/7</div>
                <div className="text-base">Hỗ trợ trực tuyến</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.4 }}
                className="text-center px-8"
              >
                <div className="text-6xl font-bold mb-2">100+</div>
                <div className="text-base">Bác sĩ</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.6 }}
                className="text-center px-8"
              >
                <div className="text-6xl font-bold mb-2">1M+</div>
                <div className="text-base">Người dùng</div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
