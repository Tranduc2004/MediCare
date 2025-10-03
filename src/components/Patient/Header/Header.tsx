import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode, CSSProperties } from "react";
import {
  Search,
  Menu,
  X,
  Home,
  User,
  Stethoscope,
  Newspaper,
  Phone,
  Layers,
  Calendar,
  FileText,
  ClipboardList,
  LogIn,
  LogOut,
  UserPlus,
  Settings,
  Mail,
  Bell,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getMyAppointments } from "../../../api/appointmentApi";
import { getUnreadCount } from "../../../api/chatApi";
import api from "../../../api/axiosConfig";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";
import { toast } from "react-toastify";
import { FaChevronDown } from "react-icons/fa";
import { chatBadge } from "../../../store/chatBadge";
import useUnreadNotifications from "../../Notifications/useUnreadNotifications";
import { useNotificationAlerts } from "../../../pages/Patient/Notifications/useNotificationAlerts";
// api not used here
import useNotifications from "../../../hooks/useNotifications";
import { useBadgeCounts } from "../../../hooks/useBadgeCounts";
import { BadgeDot } from "../BadgeDot/BadgeDot";

// Types for notification preview
interface NotificationItem {
  _id: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  createdAt?: string;
}

interface NotificationPreviewResponse {
  items: NotificationItem[];
  nextCursor?: string | null;
  totalUnread?: number;
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuAnimation, setMenuAnimation] = useState("hidden");
  const { user, isAuthenticated, logout } = useAuth();
  const unreadNotifications = useUnreadNotifications();
  const { notify } = useNotificationAlerts({ showPopupWhenVisible: false });

  // dropdown state for bell
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);

  // load preview when dropdown opens
  const { data: notifPreview } = useQuery<NotificationPreviewResponse>({
    queryKey: ["notifications", "preview", user?._id],
    queryFn: async () => {
      if (!user?._id) return { items: [], nextCursor: null, totalUnread: 0 };
      const res = await api.get(
        `/notifications?userId=${encodeURIComponent(String(user._id))}&limit=6`
      );
      return res.data as NotificationPreviewResponse;
    },
    enabled: isNotifOpen && Boolean(user?._id),
    staleTime: 30_000,
  });

  // close on outside click / Escape
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!isNotifOpen) return;
      const el = notifRef.current;
      if (el && !el.contains(e.target as Node)) setIsNotifOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsNotifOpen(false);
    }
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [isNotifOpen]);

  // Connect notification socket globally from header so realtime updates
  // update the header badge even when the Notifications page isn't open.
  let notifToken: string | null = null;
  try {
    const isDoctorRoute =
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/doctor");
    const tokenKey = isDoctorRoute ? "doctor_token" : "patient_token";
    if (typeof window !== "undefined") {
      notifToken =
        window.sessionStorage.getItem(tokenKey) ??
        window.localStorage.getItem(tokenKey) ??
        window.sessionStorage.getItem("token") ??
        window.localStorage.getItem("token") ??
        null;
    }
  } catch {
    notifToken = null;
  }
  // Call hook to set up socket (no-op if token or userId missing)
  useNotifications(notifToken, user?._id ?? null);

  useEffect(() => {
    let prev = 0;
    try {
      prev = Number(sessionStorage.getItem("_nc_prev") || "0");
    } catch {
      prev = 0;
    }
    if (unreadNotifications > prev) {
      notify(unreadNotifications, "Bạn có thông báo mới");
    }
    try {
      sessionStorage.setItem("_nc_prev", String(unreadNotifications));
    } catch {
      // ignore
    }
  }, [unreadNotifications, notify]);

  const [unread, setUnread] = useState(0);
  const [notifCount, setNotifCount] = useState<number>(0);
  const badgeQuery = useBadgeCounts(notifToken, user?._id ?? null);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement | null>(null);

  // latest appointment id: prefer badgeQuery, otherwise attempt to fetch patient's most recent appointment
  const [latestAppointmentId, setLatestAppointmentId] = useState<
    string | undefined
  >(() => {
    try {
      const b = badgeQuery?.data as unknown;
      if (
        b &&
        typeof b === "object" &&
        "latestAppointmentId" in (b as Record<string, unknown>)
      ) {
        const v = (b as Record<string, unknown>)["latestAppointmentId"];
        if (typeof v === "string") return v;
      }
    } catch {
      // ignore
    }
    return undefined;
  });

  useEffect(() => {
    // keep in sync if badgeQuery updates
    try {
      const b = badgeQuery?.data as unknown;
      if (
        b &&
        typeof b === "object" &&
        "latestAppointmentId" in (b as Record<string, unknown>)
      ) {
        const v = (b as Record<string, unknown>)["latestAppointmentId"];
        if (typeof v === "string") {
          setLatestAppointmentId(v);
          return;
        }
      }
    } catch {
      // ignore
    }

    // If we still don't have an id and the user is a patient, try fetching their most recent appointment
    if (!latestAppointmentId && user?.role === "patient" && user?._id) {
      (async () => {
        try {
          const list = await getMyAppointments(String(user._id));
          if (Array.isArray(list) && list.length > 0 && list[0]._id) {
            setLatestAppointmentId(list[0]._id);
          }
        } catch {
          // ignore fetch errors
        }
      })();
    }
  }, [badgeQuery?.data, user?.role, user?._id, latestAppointmentId]);

  useLayoutEffect(() => {
    const getScrollbarWidth = () =>
      window.innerWidth - document.documentElement.clientWidth;

    if (isMenuOpen) {
      setMenuAnimation("visible");
      const scrollbarWidth = getScrollbarWidth();
      document.documentElement.style.overflow = "hidden";
      if (scrollbarWidth > 0)
        document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      if (menuAnimation !== "hidden") {
        setMenuAnimation("closing");
        const timer = setTimeout(() => {
          setMenuAnimation("hidden");
          document.documentElement.style.overflow = "";
          document.body.style.paddingRight = "";
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [isMenuOpen, menuAnimation]);

  useEffect(() => {
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, []);

  useEffect(() => {
    chatBadge.setUser(isAuthenticated && user?._id ? user._id : null);
    setUnread(chatBadge.get());
    const unsub = chatBadge.subscribe((n: number) => setUnread(n));
    return () => {
      unsub();
    };
  }, [isAuthenticated, user?._id]);

  useEffect(() => {
    let timer: number | null = null;
    const loadUnread = async () => {
      if (isAuthenticated && user?.role === "patient") {
        try {
          const { count } = await getUnreadCount({
            role: "patient",
            patientId: user._id,
          });
          chatBadge.set(count);
        } catch {
          // ignore
        }
      } else {
        chatBadge.set(0);
      }
    };
    loadUnread();
    timer = window.setInterval(loadUnread, 7000) as unknown as number;
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [isAuthenticated, user?._id, user?.role]);

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      setNotifCount(badgeQuery.data?.notifications ?? unreadNotifications);
    } else {
      setNotifCount(0);
    }
  }, [unreadNotifications, isAuthenticated, user?._id, badgeQuery.data]);

  const handleLogout = () => {
    logout();
    closeMenu();
    toast.success("Đăng xuất thành công!");
    navigate("/");
  };

  const openMenu = () => setIsMenuOpen(true);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header
      className={`sticky top-0 z-50 bg-[#E8F7F5]/80 ${
        isMenuOpen ? "backdrop-blur-0" : "backdrop-blur"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <Logo />
            <nav className="hidden md:flex items-center gap-8 text-slate-700 ml-8">
              <NavLinks horizontal isVisible />
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {/* Search (không làm tràn menu) */}
            <div className="relative group shrink-0">
              {/* Nút icon nhỏ, không chiếm chỗ */}
              <button
                className="p-2 rounded-lg text-slate-600 hover:text-teal-600 hover:bg-emerald-50
               focus:outline-none focus:ring-2 focus:ring-teal-200 flex items-center"
                aria-label="Tìm kiếm"
              >
                <span className="mr-2">Tìm kiếm</span>
                <Search size={18} />
              </button>

              {/* Popover input: absolute nên không ảnh hưởng layout */}
              <div
                className="absolute right-0 top-full mt-2 w-[260px] sm:w-[300px]
               opacity-0 scale-95 pointer-events-none
               transition-all duration-200
               group-focus-within:opacity-100 group-focus-within:scale-100
               group-focus-within:pointer-events-auto"
              >
                <div className="flex items-center rounded-xl bg-white shadow-lg ring-1 ring-slate-200">
                  <Search size={16} className="ml-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm bác sĩ, chuyên khoa…"
                    className="w-full bg-transparent px-3 py-2 text-sm text-slate-700
                   placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <Link
              to="/appointment"
              className="px-4 py-2 bg-teal-500 text-white rounded-md hover:opacity-90 transition duration-200"
            >
              Đặt lịch khám
            </Link>

            <div className="ml-2 relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNotifOpen((v) => !v);
                }}
                className="hover:opacity-90 relative p-1 rounded-full border border-transparent hover:border-slate-100"
                aria-expanded={isNotifOpen}
                aria-haspopup="true"
                title="Thông báo"
              >
                <Bell size={22} className="text-gray-600" />
                {isAuthenticated && (
                  <span className="absolute -top-2 -right-1">
                    <BadgeDot
                      count={badgeQuery.data?.notifications ?? notifCount}
                    />
                  </span>
                )}
              </button>

              {/* Dropdown */}
              {isNotifOpen && (
                <div
                  ref={notifRef}
                  className="absolute right-0 mt-2 w-80  z-50"
                  role="menu"
                  aria-label="Thông báo"
                >
                  <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/80">
                    {/* Header gradient theo chủ đạo: sky → teal → emerald */}
                    <div className="bg-teal-500 px-4 py-3 text-white flex items-center justify-between">
                      <div className="font-semibold">Thông báo</div>
                      <Link
                        to="/notifications"
                        className="text-sm font-medium rounded-lg bg-white/10 px-2.5 py-1 hover:bg-white/20 active:bg-white/25 transition"
                        onClick={() => setIsNotifOpen(false)}
                      >
                        Xem tất cả
                      </Link>
                    </div>

                    {/* Danh sách */}
                    <div className="max-h-80 overflow-auto divide-y divide-slate-100">
                      {(notifPreview?.items ?? []).length === 0 ? (
                        <div className="p-4 text-sm text-slate-500">
                          Không có thông báo
                        </div>
                      ) : (
                        (notifPreview?.items ?? []).map((it) => (
                          <div
                            key={it._id}
                            className="group px-4 py-3 hover:bg-slate-50/80 cursor-pointer flex gap-3 items-start transition"
                            onClick={() => {
                              setIsNotifOpen(false);
                              try {
                                const url = it.data?.url;
                                if (url) window.open(String(url), "_blank");
                                else window.location.href = "/notifications";
                                // mark as read optimistically
                                void api.post("/notifications/mark-read", {
                                  ids: [it._id],
                                  userId: user?._id,
                                });
                              } catch {
                                // ignore
                              }
                            }}
                          >
                            {/* chấm trạng thái (giả sử có it.read; nếu không có, bỏ điều kiện) */}
                            <div className="relative mt-0.5">
                              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 group-hover:bg-teal-500" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-semibold text-slate-800 truncate">
                                  {it.title}
                                </div>
                                {/* chip thời gian nhỏ gọn */}
                                <div className="text-[11px] text-slate-400 whitespace-nowrap ml-auto">
                                  {(() => {
                                    if (!it.createdAt) return "";
                                    const diff =
                                      Date.now() -
                                      new Date(it.createdAt).getTime();
                                    const s = Math.floor(diff / 1000);
                                    if (s < 60) return `${s}s`;
                                    const m = Math.floor(s / 60);
                                    if (m < 60) return `${m}m`;
                                    const h = Math.floor(m / 60);
                                    if (h < 24) return `${h}h`;
                                    const d = Math.floor(h / 24);
                                    if (d < 7) return `${d}d`;
                                    return new Date(
                                      it.createdAt
                                    ).toLocaleString();
                                  })()}
                                </div>
                              </div>

                              {it.body && (
                                <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                                  {it.body}
                                </div>
                              )}

                              {/* thanh nhấn nhá theo brand khi hover */}
                              <div className="mt-2 h-0.5 w-0 bg-teal-500 transition-all duration-200 group-hover:w-full rounded-full" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              className="ml-2 hover:text-teal-500 transition duration-200 relative"
              onClick={openMenu}
              aria-label="Mở menu"
            >
              <Menu size={28} />
              {isAuthenticated && user?.role === "patient" && unread > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] leading-none px-1.5 py-0.5 min-w-[18px] h-[18px]">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu panel */}
      {menuAnimation !== "hidden" && (
        <div
          className={`fixed inset-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            menuAnimation === "closing"
              ? "opacity-0 pointer-events-none"
              : menuAnimation === "visible"
              ? "opacity-100"
              : "opacity-0"
          }`}
        >
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              menuAnimation === "visible"
                ? "opacity-100"
                : menuAnimation === "closing"
                ? "opacity-0"
                : "opacity-0"
            }`}
            onClick={closeMenu}
          />

          <div
            ref={menuRef}
            className={`fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl rounded-l-2xl flex flex-col z-50 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] transform-gpu will-change-transform ${
              menuAnimation === "visible"
                ? "translate-x-0"
                : menuAnimation === "closing"
                ? "translate-x-full"
                : "translate-x-full"
            }`}
          >
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition duration-200"
              onClick={closeMenu}
              aria-label="Đóng menu"
            >
              <X size={28} />
            </button>

            <div
              className={`flex flex-col items-center mt-8 mb-6 transition-all duration-300 ${
                menuAnimation === "visible"
                  ? "opacity-100 translate-y-0 delay-100"
                  : "opacity-0 translate-y-2"
              }`}
            >
              <Logo />
              {isAuthenticated && user && (
                <div className="mt-2 text-gray-700 font-semibold text-center">
                  Xin chào, {user.name}
                </div>
              )}
            </div>

            <nav
              className={`flex-1 flex flex-col gap-1 px-4 overflow-y-auto transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                menuAnimation === "visible"
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              }`}
            >
              <NavLinks
                onClick={closeMenu}
                isVisible={menuAnimation === "visible"}
              />

              <div className="border-t my-3" />

              <MenuLink
                icon={<Stethoscope size={20} />}
                to="/appointment"
                onClick={closeMenu}
                className="px-4 py-2 bg-teal-500 text-white rounded-md hover:opacity-90 transition duration-200 hover:bg-teal-600"
              >
                Đặt lịch khám
              </MenuLink>

              {isAuthenticated && (
                <>
                  <div className="mt-4 p-4 pl-2">
                    <h1 className="text-teal-500 text-lg font-semibold mb-3">
                      Tài khoản của tôi
                    </h1>
                    <ul className="space-y-2">
                      <li>
                        <MenuLink
                          icon={<User size={18} />}
                          to="/profile"
                          onClick={closeMenu}
                          className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                          Hồ sơ cá nhân
                        </MenuLink>
                      </li>
                      <li>
                        <MenuLink
                          icon={<Calendar size={18} />}
                          to="/appointments/my"
                          onClick={closeMenu}
                          className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                          Lịch hẹn khám
                        </MenuLink>
                      </li>
                      <li>
                        <MenuLink
                          icon={<FileText size={18} />}
                          to="/payments/history"
                          onClick={closeMenu}
                          className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                          Thanh toán
                        </MenuLink>
                      </li>
                      <li>
                        <MenuLink
                          icon={<FileText size={18} />}
                          to="/prescriptions/my"
                          onClick={closeMenu}
                          className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                          Đơn thuốc
                        </MenuLink>
                      </li>
                      <li>
                        <MenuLink
                          icon={<ClipboardList size={18} />}
                          to="/diagnosis/my"
                          onClick={closeMenu}
                          className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                          Bệnh án
                        </MenuLink>
                      </li>
                      <li>
                        <div className="relative">
                          <MenuLink
                            icon={<Bell size={18} />}
                            to="/notifications"
                            onClick={closeMenu}
                            className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg pr-8"
                          >
                            Thông báo
                          </MenuLink>
                          {(notifCount ?? 0) > 0 && (
                            <span className="absolute top-1 right-2 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs px-2 py-0.5">
                              {(notifCount ?? 0) > 99 ? "99+" : notifCount}
                            </span>
                          )}
                        </div>
                      </li>
                      <li>
                        <div className="relative">
                          <MenuLink
                            icon={<Mail size={18} />}
                            to="/chat"
                            onClick={closeMenu}
                            className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg pr-8"
                          >
                            Tin nhắn
                          </MenuLink>
                          {unread > 0 && (
                            <span className="absolute top-1 right-2 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs px-2 py-0.5">
                              {unread}
                            </span>
                          )}
                        </div>
                      </li>
                    </ul>
                  </div>
                </>
              )}

              {/* Phần footer menu */}
              <div
                className={`mt-auto border-t transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  menuAnimation === "visible"
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-2"
                }`}
              >
                {isAuthenticated ? (
                  <div className="p-4 space-y-2">
                    <MenuLink
                      icon={<Settings size={18} />}
                      to="/settings"
                      onClick={closeMenu}
                      className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      Cài đặt
                    </MenuLink>
                    <MenuLink
                      icon={<Mail size={18} />}
                      to="/contact"
                      onClick={closeMenu}
                      className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      Liên hệ hỗ trợ
                    </MenuLink>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition duration-200"
                    >
                      <LogOut size={18} />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    <MenuLink
                      icon={<LogIn size={18} />}
                      to="/login"
                      onClick={closeMenu}
                      className="w-full px-4 py-2 bg-teal-500 text-white rounded-lg hover:opacity-90 transition duration-200 justify-center hover:bg-teal-600"
                    >
                      Đăng nhập
                    </MenuLink>
                    <MenuLink
                      icon={<UserPlus size={18} />}
                      to="/register"
                      onClick={closeMenu}
                      className="w-full px-4 py-2 bg-white border border-teal-400 text-teal-500 rounded-lg hover:bg-teal-50 transition duration-200 justify-center"
                    >
                      Đăng ký
                    </MenuLink>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

// Logo component
function Logo() {
  return (
    <div className="flex items-center">
      <h1 className="text-2xl font-bold tracking-tight">
        <span className="text-slate-900">Medi</span>
        <span className="text-teal-500">Care</span>
      </h1>
    </div>
  );
}

// Link có icon cho menu panel
type MenuLinkProps = {
  icon: ReactNode;
  to: string;
  children: ReactNode;
  horizontal?: boolean;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
  showIcon?: boolean;
};

function MenuLink({
  icon,
  to,
  children,
  horizontal,
  onClick,
  className,
  style,
  showIcon = true,
}: MenuLinkProps) {
  const baseClass = horizontal
    ? "inline-flex items-center gap-2 px-0 py-0 text-slate-700 hover:text-slate-900 transition duration-200 text-sm font-medium"
    : "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200 text-base";

  return (
    <Link
      to={to}
      className={`${baseClass} ${className || ""}`}
      style={style}
      onClick={() => {
        window.scrollTo(0, 0);
        if (onClick) onClick();
      }}
    >
      {showIcon && icon}
      {children}
    </Link>
  );
}

// NavLinks
type NavLinksProps = {
  horizontal?: boolean;
  onClick?: () => void;
  isVisible?: boolean;
};

function NavLinks({ horizontal, onClick, isVisible }: NavLinksProps) {
  const links = [
    { text: "Trang chủ", path: "/", icon: <Home size={20} /> },
    { text: "Dịch vụ", path: "/services", icon: <Layers size={20} /> },
    // Dropdown cho Đội ngũ bác sĩ nằm riêng phía dưới
    { text: "Chuyên khoa", path: "/specialties", icon: <User size={20} /> },
    { text: "Tin tức", path: "/news", icon: <Newspaper size={20} /> },
    { text: "Liên hệ", path: "/contact", icon: <Phone size={20} /> },
  ];

  return (
    <>
      {links.map((link, index) => {
        const delayMs = isVisible ? 80 + index * 40 : 0;
        const transitionClasses =
          "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-teal-500 hover:border-teal-500 border-b-2 border-transparent";
        const visibilityClasses = isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2";

        return (
          <MenuLink
            key={index}
            icon={link.icon}
            to={link.path}
            horizontal={horizontal}
            onClick={onClick}
            className={`${transitionClasses} ${visibilityClasses}`}
            style={{ transitionDelay: `${delayMs}ms` }}
            showIcon={!horizontal}
          >
            {link.text}
          </MenuLink>
        );
      })}
      <div className="relative group">
        {/* Nút chính */}
        <SpecialtyDropdown horizontal={horizontal} onClick={onClick} />
        {/* Dropdown content */}
        <div className="absolute left-0 top-[calc(100%-6px)] hidden group-hover:block z-50">
          {/* Nội dung menu của SpecialtyDropdown sẽ render ở đây */}
        </div>

        {/* Vùng hover đệm để không bị mất khi rê chuột */}
        <div className="absolute left-0 top-full w-full h-4 -mt-1 bg-transparent"></div>
      </div>
    </>
  );
}

function SpecialtyDropdown({
  horizontal,
  onClick,
}: {
  horizontal?: boolean;
  onClick?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const [specialties, setSpecialties] = useState<
    { _id: string; name: string }[]
  >([]);
  useEffect(() => {
    import("../../../api/specialtyApi").then(({ specialtyApi }) => {
      specialtyApi
        .getActiveSpecialties()
        .then((data) => setSpecialties(data || []))
        .catch(() => {});
    });
  }, []);
  return (
    <div
      className={`relative ${horizontal ? "" : ""}`}
      onMouseEnter={() => {
        if (closeTimerRef.current) {
          window.clearTimeout(closeTimerRef.current);
          closeTimerRef.current = null;
        }
        setOpen(true);
      }}
      onMouseLeave={() => {
        if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = window.setTimeout(
          () => setOpen(false),
          150
        ) as unknown as number;
      }}
    >
      <MenuLink
        icon={<Stethoscope size={20} />}
        to="/alldoctors"
        horizontal={horizontal}
        onClick={onClick}
        showIcon={!horizontal}
      >
        Đội ngũ bác sĩ <FaChevronDown size={12} style={{ marginTop: 4 }} />
      </MenuLink>
      {open && specialties.length > 0 && (
        <div
          className="absolute left-0 top-full -mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          onMouseEnter={() => {
            if (closeTimerRef.current) {
              window.clearTimeout(closeTimerRef.current);
              closeTimerRef.current = null;
            }
            setOpen(true);
          }}
          onMouseLeave={() => {
            if (closeTimerRef.current)
              window.clearTimeout(closeTimerRef.current);
            closeTimerRef.current = window.setTimeout(
              () => setOpen(false),
              150
            ) as unknown as number;
          }}
        >
          <div className="py-2 max-h-72 overflow-auto">
            {specialties.map((s) => (
              <MenuLink
                key={s._id}
                icon={<Layers size={16} />}
                to={`/alldoctors?specialty=${s._id}`}
                onClick={onClick}
                className="w-full !px-4 !py-2 text-sm hover:bg-teal-500 hover:border-teal-500 border-b-2 border-transparent"
              >
                {s.name}
              </MenuLink>
            ))}
          </div>
        </div>
      )}
      {/* Vùng đệm hover để dễ di chuyển chuột từ nút xuống menu */}
      {open && <div className="absolute left-0 top-full w-full h-8 -mt-1" />}
    </div>
  );
}
