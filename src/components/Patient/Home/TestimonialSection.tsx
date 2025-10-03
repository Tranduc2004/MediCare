import { Star } from "lucide-react";
import { motion } from "framer-motion";

export default function TestimonialSection() {
  const review = {
    name: "Jane Cooper",
    date: "12/4/17",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sem velit viverra amet faucibus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sem velit viverra amet faucibus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sem velit viverra amet faucibus.",
    avatar:
      "https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=256&auto=format&fit=crop",
    rating: 5,
  };

  // nhóm avatar mẫu (có thể thay bằng dữ liệu thật)
  const faces = [
    "https://api.dicebear.com/7.x/thumbs/svg?seed=a",
    "https://api.dicebear.com/7.x/thumbs/svg?seed=b",
    "https://api.dicebear.com/7.x/thumbs/svg?seed=c",
    "https://api.dicebear.com/7.x/thumbs/svg?seed=d",
    "https://api.dicebear.com/7.x/thumbs/svg?seed=e",
    "https://api.dicebear.com/7.x/thumbs/svg?seed=f",
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.3,
      },
    },
  };

  const slideInLeft = {
    hidden: { opacity: 0, x: -60 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8 },
    },
  };

  const slideInRight = {
    hidden: { opacity: 0, x: 60 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8 },
    },
  };

  const avatarVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4 },
    },
  };

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={containerVariants}
      className="bg-[#E8F7F5] py-30"
      id="testimonials"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-2">
        {/* Left copy */}
        <motion.div variants={slideInLeft}>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-slate-900"
          >
            What{" "}
            <span className="bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">
              Our Member’s
            </span>
            <br />
            Saying About Us
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6 max-w-xl text-slate-600"
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sem velit
            viverra amet faucibus.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8 flex items-center gap-6"
          >
            <motion.div
              variants={containerVariants}
              className="-space-x-3 flex"
            >
              {faces.map((src, i) => (
                <motion.img
                  key={i}
                  variants={avatarVariants}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.8 + i * 0.1 }}
                  src={src}
                  alt={`avatar ${i + 1}`}
                  className="h-10 w-10 rounded-full ring-2 ring-[#E8F7F5]"
                />
              ))}
            </motion.div>
            <div className="text-slate-700 font-semibold">100+ Reviews</div>
          </motion.div>
        </motion.div>

        {/* Right card */}
        <motion.article
          variants={slideInRight}
          whileHover={{
            y: -5,
            scale: 1.02,
            transition: { duration: 0.2 },
          }}
          className="rounded-3xl bg-white p-8 md:p-10 ring-1 ring-slate-200 shadow-sm"
        >
          {/* header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={review.avatar}
                alt={review.name}
                className="h-12 w-12 rounded-full"
              />
              <div>
                <div className="font-semibold text-slate-900">
                  {review.name}
                </div>
                <div className="text-xs text-slate-500">{review.date}</div>
              </div>
            </div>

            <Stars value={review.rating} />
          </div>

          <p className="mt-6 leading-7 text-slate-700">{review.text}</p>
        </motion.article>
      </div>
    </motion.section>
  );
}

/** Sao vàng giống thiết kế */
function Stars({ value = 5 }: { value?: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-5 w-5 ${
            i < value ? "text-yellow-400 fill-yellow-400" : "text-slate-300"
          }`}
        />
      ))}
    </div>
  );
}
