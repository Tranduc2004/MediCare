import { useEffect, useState } from "react";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { getDoctors } from "../../../api/doctorsApi";
import { specialtyApi } from "../../../api/specialtyApi";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function DoctorSection() {
  const [doctors, setDoctors] = useState<
    {
      _id: string;
      name: string;
      avatar: string;
      email: string;
      phone: string;
      address: string;
      isActive: boolean;
      specialty: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [specialties, setSpecialties] = useState<
    { _id: string; name: string }[]
  >([]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 40,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
      },
    },
  };

  const skeletonVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
      },
    },
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const list = await getDoctors();
        setDoctors(Array.isArray(list) ? list.slice(0, 4) : []);
      } catch {
        setError("Không tải được danh sách bác sĩ");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    specialtyApi
      .getActiveSpecialties()
      .then((data) => setSpecialties(data || []))
      .catch(() => {});
  }, []);

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className="relative overflow-hidden bg-gradient-to-b from-white to-teal-50 py-16"
      aria-label="Phần bác sĩ"
    >
      {/* background nhấn nhẹ */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.3 }}
        className="pointer-events-none absolute -top-10 right-[-10%] h-72 w-72 rounded-full bg-teal-300/30 blur-2xl"
      />

      <div className="mx-auto max-w-6xl px-6 relative">
        {/* Heading theo style hệ thống */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            Đội ngũ bác sĩ
          </h2>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "4rem" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-2 h-1 rounded-full bg-teal-500"
          />
          <p className="mt-3 max-w-2xl text-slate-600">
            Các bác sĩ của MediCare đều có chuyên môn cao và nhiều năm kinh
            nghiệm trong lĩnh vực y tế.
          </p>
        </motion.div>

        {/* Alert lỗi */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700"
          >
            {error}
          </motion.div>
        )}

        {/* Skeleton loading */}
        {loading ? (
          <motion.div
            variants={containerVariants}
            className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={i}
                variants={skeletonVariants}
                className="animate-pulse overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm"
              >
                <div className="h-56 w-full bg-slate-200" />
                <div className="p-5">
                  <div className="h-5 w-3/4 rounded bg-slate-200" />
                  <div className="mt-3 h-4 w-1/2 rounded bg-slate-200" />
                  <div className="mt-5 h-8 w-28 rounded-full bg-slate-200" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {doctors.map((d) => {
              const specName =
                specialties.find((s) => s._id === d.specialty)?.name || "";

              return (
                <motion.div
                  key={d._id}
                  variants={cardVariants}
                  whileHover={{
                    y: -8,
                    scale: 1.02,
                    transition: { duration: 0.2 },
                  }}
                >
                  <Link
                    to={`/alldoctors/${d._id}`}
                    className="group block overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm transition-all hover:shadow-[0_16px_40px_rgba(20,184,166,0.18)]"
                  >
                    {/* Image block */}
                    <div className="relative overflow-hidden">
                      {d.avatar ? (
                        <img
                          src={d.avatar}
                          alt={d.name}
                          className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="aspect-[4/3] w-full bg-gradient-to-br from-sky-100 to-teal-100 grid place-items-center">
                          <motion.svg
                            initial={{ scale: 0, rotate: -180 }}
                            whileInView={{ scale: 1, rotate: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="h-16 w-16 text-teal-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                              clipRule="evenodd"
                            />
                          </motion.svg>
                        </div>
                      )}

                      {/* Chip chuyên khoa nổi góc trái */}
                      {specName && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0, x: -20 }}
                          whileInView={{ opacity: 1, scale: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: 0.2 }}
                          className="absolute left-4 top-4 inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-teal-700 ring-1 ring-teal-100 backdrop-blur"
                        >
                          {specName}
                        </motion.span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          BS. {d.name}
                        </h3>
                        {d.isActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                          >
                            <ShieldCheck
                              className="h-5 w-5 text-emerald-600"
                              aria-label="Đang hoạt động"
                            />
                          </motion.div>
                        )}
                      </div>

                      {/* CTA */}
                      <div className="mt-4 inline-flex items-center gap-1 font-medium text-teal-600">
                        <span className="transition-colors group-hover:text-teal-700">
                          Xem chi tiết
                        </span>
                        <ChevronRight className="h-4 w-4 -translate-x-0.5 transition-transform group-hover:translate-x-0" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Nút xem tất cả */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10"
        >
          <Link
            to="/doctors"
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white shadow-[0_10px_24px_rgba(16,185,129,0.25)] transition-colors hover:bg-emerald-700"
          >
            Xem tất cả bác sĩ
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}
