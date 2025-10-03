import { ChevronRight } from "lucide-react";
import { FaArrowRight } from "react-icons/fa6";
import { motion } from "framer-motion";

export default function FaqSection() {
  const faqs = [
    {
      question: "Làm thế nào để đặt lịch khám trực tuyến?",
      answer:
        "Để đặt lịch khám trực tuyến, bạn chỉ cần đăng nhập vào tài khoản, chọn chuyên khoa, bác sĩ, ngày giờ phù hợp và xác nhận thông tin. Sau đó, bạn sẽ nhận được email xác nhận lịch hẹn.",
    },
    {
      question: "Tôi có thể hủy hoặc thay đổi lịch hẹn không?",
      answer:
        "Có, bạn có thể hủy hoặc thay đổi lịch hẹn ít nhất 24 giờ trước giờ khám đã đặt. Vui lòng đăng nhập vào tài khoản và vào mục Quản lý lịch hẹn để thực hiện.",
    },
    {
      question: "Làm sao để xem kết quả khám online?",
      answer:
        "Sau khi khám bệnh, kết quả sẽ được cập nhật trên hệ thống trong vòng 24-48 giờ. Bạn có thể đăng nhập vào tài khoản và vào mục Kết quả khám bệnh để xem và tải về.",
    },
    {
      question: "MediCare có chấp nhận bảo hiểm y tế không?",
      answer:
        "Có, MediCare có liên kết với nhiều công ty bảo hiểm y tế. Vui lòng mang theo thẻ bảo hiểm khi đến khám và thông báo trước khi đặt lịch khám.",
    },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2,
      },
    },
  };

  const slideInLeft = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6 },
    },
  };

  const slideInRight = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6 },
    },
  };

  const faqItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={containerVariants}
      className="relative bg-[#F7FDFC] py-16"
      id="faq"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-10 px-6 md:grid-cols-2">
        {/* Intro khớp style các section trước */}
        <motion.aside
          variants={slideInLeft}
          className="md:sticky md:top-24 md:self-start"
        >
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900"
          >
            Câu hỏi thường gặp
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-2 max-w-md text-slate-600"
          >
            Giải đáp những thắc mắc phổ biến về dịch vụ khám chữa bệnh tại
            MediCare.
          </motion.p>

          {/* chip nhỏ nhấn nhẹ */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-teal-700 ring-1 ring-slate-200 shadow-sm"
          >
            <motion.span
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.8 }}
              className="h-2 w-2 rounded-full bg-teal-500"
            />
            Hỗ trợ 24/7
          </motion.div>
        </motion.aside>

        {/* Accordion */}
        <motion.div variants={slideInRight} className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.details
              key={i}
              variants={faqItemVariants}
              whileHover={{
                scale: 1.02,
                transition: { duration: 0.2 },
              }}
              className="group rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm open:ring-teal-300"
            >
              <summary className="flex cursor-pointer select-none items-center justify-between gap-4 p-5">
                <h3 className="text-base md:text-lg font-semibold text-slate-900">
                  {faq.question}
                </h3>
                <ChevronRight className="h-5 w-5 text-teal-600 transition-transform duration-300 group-open:rotate-90" />
              </summary>
              <div className="border-t border-slate-200 px-5 pb-5 pt-4">
                <p className="leading-7 text-slate-700">{faq.answer}</p>
              </div>
            </motion.details>
          ))}
        </motion.div>
      </div>

      {/* CTA cuối khớp palette emerald/teal */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mx-auto mt-10 max-w-6xl px-20 bg-teal-500 p-20 rounded-2xl"
      >
        <div className="flex items-center justify-between rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <p className="text-slate-700">Bạn còn câu hỏi khác?</p>
          <motion.a
            href="/contact"
            whileHover={{
              scale: 1.1,
              transition: { duration: 0.2 },
            }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center justify-center p-3 rounded-full bg-teal-500  font-semibold text-white shadow hover:bg-teal-700"
          >
            <FaArrowRight className="h-5 w-5" />
          </motion.a>
        </div>
      </motion.div>
    </motion.section>
  );
}
