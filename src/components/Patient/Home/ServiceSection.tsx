import { CheckCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
    },
  },
};

const bulletVariants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
    },
  },
};

export default function ServiceSection() {
  const services = [
    {
      title: "Xét nghiệm Covid-19",
      desc: "Xét nghiệm nhanh, chính xác; trả kết quả trong ngày.",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
        </svg>
      ),
      active: false,
    },
    {
      title: "Tim mạch & Hô hấp",
      desc: "Khám và tư vấn các bệnh lý tim mạch, hô hấp chuyên sâu.",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 7v6a3 3 0 0 1-3 3M15 7v6a3 3 0 0 0 3 3" />
          <path d="M12 7V3m0 0c-2 0-4 2-4 4m4-4c2 0 4 2 4 4" />
        </svg>
      ),
      active: true,
    },
    {
      title: "Dinh dưỡng & Bổ sung",
      desc: "Tư vấn chế độ dinh dưỡng và bổ sung phù hợp với từng người.",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="8" width="18" height="8" rx="2" />
          <path d="M12 8v8" />
        </svg>
      ),
      active: false,
    },
    {
      title: "Sức khỏe tinh thần",
      desc: "Hỗ trợ tâm lý và chăm sóc sức khỏe tinh thần toàn diện.",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 3a6 6 0 0 0-6 6v2a4 4 0 0 0 4 4h1v3h3v-3h1a4 4 0 0 0 4-4V9a6 6 0 0 0-6-6Z" />
        </svg>
      ),
      active: false,
    },
  ];

  const bullets = [
    "Đội ngũ bác sĩ giàu kinh nghiệm, tận tâm.",
    "Đặt lịch khám nhanh chóng, linh hoạt theo thời gian của bạn.",
    "Hồ sơ bệnh án điện tử an toàn, bảo mật.",
    "Công nghệ chẩn đoán hiện đại, kết quả chính xác.",
    "Hỗ trợ 24/7 qua tổng đài và ứng dụng.",
  ];

  return (
    <>
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="relative py-16"
      >
        <div className="mx-auto max-w-6xl px-6">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl"
          >
            Các chuyên khoa tư vấn
          </motion.h2>

          <motion.div
            variants={containerVariants}
            className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {services.map((it, i) => (
              <motion.div
                key={i}
                variants={cardVariants}
                whileHover={{
                  scale: 1.05,
                  y: -5,
                  transition: { duration: 0.2 },
                }}
                className={
                  "rounded-2xl p-6 transition-all cursor-pointer " +
                  (it.active
                    ? "bg-teal-500 text-white shadow-xl"
                    : "bg-white text-slate-800 ring-1 ring-slate-200 shadow-sm hover:shadow-md")
                }
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 + 0.3 }}
                  className={
                    "mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full " +
                    (it.active ? "bg-white/20" : "bg-teal-50 text-teal-600")
                  }
                >
                  {it.icon}
                </motion.div>
                <h3
                  className={
                    "text-lg font-semibold " +
                    (it.active ? "text-white" : "text-slate-900")
                  }
                >
                  {it.title}
                </h3>
                <p
                  className={
                    "mt-2 text-sm leading-6 " +
                    (it.active ? "text-white/90" : "text-slate-600")
                  }
                >
                  {it.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="overflow-x-hidden py-16"
        aria-label="Phần dịch vụ"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 md:grid-cols-2">
          {/* Image left */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <img
              src="https://bvxuyena.com.vn/wp-content/uploads/2025/04/thumbnail-6x4-khoa-kham-benh-scaled.jpg"
              alt="Operating room"
              className="w-full rounded-3xl object-cover shadow-xl"
            />
          </motion.div>

          {/* Text right */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900"
            >
              Vì sao chọn chúng tôi?
            </motion.h2>

            <motion.ul variants={containerVariants} className="mt-8 space-y-4">
              {bullets.map((b, i) => (
                <motion.li
                  key={i}
                  variants={bulletVariants}
                  whileHover={{ x: 5, transition: { duration: 0.2 } }}
                  className="flex items-start gap-3 text-slate-700"
                >
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-teal-500" />
                  </span>
                  <span className="leading-6">{b}</span>
                </motion.li>
              ))}
            </motion.ul>

            <motion.a
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 1.0 }}
              whileHover={{ x: 5, transition: { duration: 0.2 } }}
              href="#"
              className="mt-8 inline-flex items-center gap-2 font-semibold text-teal-600 hover:text-teal-700"
            >
              Tìm hiểu thêm <ArrowRight className="h-4 w-4" />
            </motion.a>
          </motion.div>
        </div>
      </motion.section>
    </>
  );
}
