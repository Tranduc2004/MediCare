import { MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <>
      <footer className="bg-gray-800 text-gray-200">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">
                <span className="text-white">Medi</span>
                <span className="text-teal-400">Care</span>
              </h3>
              <p className="mb-4">
                Chăm sóc sức khỏe hiện đại, thuận tiện và tin cậy dành cho bạn
                và gia đình.
              </p>
              <div className="flex space-x-4">
                {/* Social icons */}
                <a
                  href="#"
                  className="bg-gray-700 hover:bg-teal-500 w-8 h-8 rounded-full flex items-center justify-center"
                >
                  <span className="sr-only">Facebook</span>
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </a>
                <a
                  href="#"
                  className="bg-gray-700 hover:bg-teal-500 w-8 h-8 rounded-full flex items-center justify-center"
                >
                  <span className="sr-only">Twitter</span>
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a
                  href="#"
                  className="bg-gray-700 hover:bg-teal-500 w-8 h-8 rounded-full flex items-center justify-center"
                >
                  <span className="sr-only">YouTube</span>
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418zm-7.814 8.814v-4.814l5.209 2.407-5.209 2.407z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Liên kết nhanh</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="hover:text-teal-400">
                    Trang chủ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400">
                    Dịch vụ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400">
                    Bác sĩ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400">
                    Đặt lịch khám
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400">
                    Tin tức y tế
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400">
                    Về chúng tôi
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Chuyên khoa</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="hover:text-teal-400">
                    Nội Tổng Quát
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400">
                    Tim Mạch
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400">
                    Nhi Khoa
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400">
                    Da Liễu
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400">
                    Thần Kinh
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400">
                    Cơ Xương Khớp
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Liên hệ</h4>
              <ul className="space-y-3">
                <li className="flex">
                  <MapPin size={20} className="mr-2 mt-1 flex-shrink-0" />
                  <span>123 Đường Nguyễn Văn Linh, Quận 7, TP.HCM</span>
                </li>
                <li className="flex items-center">
                  <Phone size={20} className="mr-2 flex-shrink-0" />
                  <span>0123.456.789</span>
                </li>
                <li className="flex items-center">
                  <Mail size={20} className="mr-2 flex-shrink-0" />
                  <span>info@medicare.vn</span>
                </li>
              </ul>
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Giờ làm việc:</h4>
                <p>Thứ 2 - Thứ 6: 7:30 - 17:30</p>
                <p>Thứ 7: 7:30 - 12:00</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p>© 2025 MediCare. Tất cả quyền được bảo lưu.</p>
              <div className="mt-4 md:mt-0">
                <a href="#" className="hover:text-teal-400 mr-4">
                  Điều khoản sử dụng
                </a>
                <a href="#" className="hover:text-teal-400">
                  Chính sách bảo mật
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
