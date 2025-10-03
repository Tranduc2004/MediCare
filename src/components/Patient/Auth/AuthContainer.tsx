import React, { useState, useRef, useEffect } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import styles from "../../../styles/Auth.module.css";

const AuthContainer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const tabRef = useRef<HTMLDivElement>(null);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (tabRef.current) {
      const buttons = tabRef.current.querySelectorAll("button");
      const idx = activeTab === "login" ? 0 : 1;
      const btn = buttons[idx] as HTMLButtonElement;
      setUnderlineStyle({ left: btn.offsetLeft, width: btn.offsetWidth });
    }
  }, [activeTab]);

  return (
    <div className={styles.authContainer2col}>
      <div className={styles.authLeft}>
        <h2>
          Chào mừng bạn đến với{" "}
          <span className={styles.brand}>
            <span className="text-gray-800">Medi</span>
            <span className="text-teal-500">Care</span>
          </span>
        </h2>
        <p className={styles.desc}>
          Đăng nhập hoặc tạo tài khoản để trải nghiệm dịch vụ y tế hiện đại
        </p>
        <div className={styles.authTabs} ref={tabRef}>
          <button
            className={activeTab === "login" ? styles.active : ""}
            onClick={() => setActiveTab("login")}
          >
            Đăng nhập
          </button>
          <button
            className={activeTab === "register" ? styles.active : ""}
            onClick={() => setActiveTab("register")}
          >
            Đăng ký
          </button>
          <div
            className={styles.authTabUnderlineAnimated}
            style={{ left: underlineStyle.left, width: underlineStyle.width }}
          />
        </div>
        <div className={styles.authFormSlider}>
          <div
            className={styles.authFormSliderInner}
            style={{
              transform:
                activeTab === "login" ? "translateX(0%)" : "translateX(-100%)",
            }}
          >
            <div className={styles.authFormSlide}>
              <LoginForm />
            </div>
            <div className={styles.authFormSlide}>
              <RegisterForm />
            </div>
          </div>
        </div>
      </div>
      <div className={styles.authRight}>
        <div className={styles.authBrandLogo}>
          Medi<span style={{ color: "#1ecb8b" }}>Care</span>
        </div>
        <h3>Chăm sóc sức khỏe hiện đại</h3>
        <p>
          Dịch vụ y tế tiên tiến, đội ngũ bác sĩ chuyên nghiệp và không gian
          thân thiện.
        </p>
        <div className={styles.authImgPlaceholder}>
          <div
            style={{
              width: 350,
              height: 200,
              background: "#e3e3e3",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            350 x 200
          </div>
        </div>
        <ul className={styles.authFeatures}>
          <li>✔ Đặt lịch khám trực tuyến dễ dàng</li>
          <li>✔ Tra cứu kết quả khám online</li>
          <li>✔ Nhận thông báo và nhắc lịch hẹn</li>
        </ul>
      </div>
    </div>
  );
};

export default AuthContainer;
