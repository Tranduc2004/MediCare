# Cấu trúc thư mục Client - Hệ thống quản lý phòng khám

## Tổng quan
Cấu trúc thư mục Client được tổ chức theo mô hình module-based với 3 đối tượng chính: **Patient**, **Doctor**, và **Pharmacy**. Mỗi module có thể hoạt động độc lập và chia sẻ các components/utilities chung.

## 🏗️ **Cấu trúc thư mục đề xuất chi tiết**

```
src/
├── App.css
├── App.tsx
├── main.tsx
├── index.css
├── vite-env.d.ts
│
├── modules/                          # Các module chính
│   ├── patient/                      # Module bệnh nhân
│   │   ├── components/               # Components riêng cho patient
│   │   │   ├── Cards/
│   │   │   │   ├── AppointmentCard.tsx
│   │   │   │   ├── PaymentCard.tsx
│   │   │   │   ├── ServiceCard.tsx
│   │   │   │   ├── SpecialtyCard.tsx
│   │   │   │   ├── DoctorCard.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Profile/
│   │   │   │   ├── PatientProfile.tsx
│   │   │   │   ├── ProfileEdit.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Notifications/
│   │   │   │   ├── NotificationItem.tsx
│   │   │   │   ├── NotificationList.tsx
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── pages/                    # Các trang của patient
│   │   │   ├── Home/
│   │   │   │   ├── Home.tsx
│   │   │   │   ├── Chat.tsx
│   │   │   │   ├── DoctorDetail.tsx
│   │   │   │   ├── Doctors.tsx
│   │   │   │   └── Profile.tsx
│   │   │   ├── Appointment/
│   │   │   │   ├── Appointment.tsx
│   │   │   │   ├── BookingForm.tsx
│   │   │   │   ├── History.tsx
│   │   │   │   └── Slip.tsx
│   │   │   ├── Auth/
│   │   │   │   ├── ForgotPassword.tsx
│   │   │   │   └── ResetPassword.tsx
│   │   │   ├── Payment/
│   │   │   │   ├── Payment.tsx
│   │   │   │   ├── PaymentDetailModal.tsx
│   │   │   │   ├── PaymentHistory.tsx
│   │   │   │   ├── PaymentNew.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Services/
│   │   │   │   ├── ServiceDetailPage.tsx
│   │   │   │   └── ServicesPage.tsx
│   │   │   ├── Specialties/
│   │   │   │   ├── SpecialtiesPage.tsx
│   │   │   │   └── SpecialtyDetailPage.tsx
│   │   │   └── Notifications.tsx
│   │   ├── api/                      # API calls riêng cho patient
│   │   │   ├── appointmentApi.ts
│   │   │   ├── paymentApi.ts
│   │   │   ├── serviceApi.ts
│   │   │   ├── notificationApi.ts
│   │   │   └── index.ts
│   │   ├── hooks/                    # Custom hooks cho patient
│   │   │   ├── usePatientAuth.ts
│   │   │   ├── useAppointments.ts
│   │   │   ├── usePayments.ts
│   │   │   ├── useServices.ts
│   │   │   ├── useNotifications.ts
│   │   │   └── index.ts
│   │   ├── types/                    # Types riêng cho patient
│   │   │   ├── appointment.ts
│   │   │   ├── payment.ts
│   │   │   ├── service.ts
│   │   │   ├── notification.ts
│   │   │   └── index.ts
│   │   └── utils/                    # Utilities riêng cho patient
│   │       ├── appointmentHelpers.ts
│   │       ├── paymentHelpers.ts
│   │       ├── dateHelpers.ts
│   │       └── index.ts
│   │
│   ├── doctor/                       # Module bác sĩ
│   │   ├── components/               # Components riêng cho doctor
│   │   │   ├── Dashboard/
│   │   │   │   ├── DoctorDashboard.tsx
│   │   │   │   ├── StatsCard.tsx
│   │   │   │   ├── ActivityCard.tsx
│   │   │   │   ├── RevenueChart.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Patient/
│   │   │   │   ├── PatientCard.tsx
│   │   │   │   ├── PatientList.tsx
│   │   │   │   ├── PatientSearch.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Schedule/
│   │   │   │   ├── ScheduleCalendar.tsx
│   │   │   │   ├── TimeSlotManager.tsx
│   │   │   │   ├── ScheduleForm.tsx
│   │   │   │   └── index.ts
│   │   │   ├── MedicalRecord/
│   │   │   │   ├── MedicalRecordCard.tsx
│   │   │   │   ├── RecordForm.tsx
│   │   │   │   ├── RecordHistory.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Appointment/
│   │   │   │   ├── AppointmentCard.tsx
│   │   │   │   ├── AppointmentList.tsx
│   │   │   │   ├── AppointmentFilter.tsx
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── pages/                    # Các trang của doctor
│   │   │   ├── Home/
│   │   │   │   └── Home.tsx
│   │   │   ├── Appointments/
│   │   │   │   └── Appointments.tsx
│   │   │   ├── Login/
│   │   │   │   └── Login.tsx
│   │   │   ├── Register/
│   │   │   │   └── Register.tsx
│   │   │   ├── MedicalRecords/
│   │   │   │   └── MedicalRecords.tsx
│   │   │   ├── Messages/
│   │   │   │   ├── Messages.tsx
│   │   │   │   └── useChatNotifications.ts
│   │   │   ├── Profile/
│   │   │   │   └── Profile.tsx
│   │   │   └── Schedule/
│   │   │       └── Schedule.tsx
│   │   ├── api/                      # API calls riêng cho doctor
│   │   │   ├── doctorApi.ts
│   │   │   ├── scheduleApi.ts
│   │   │   ├── medicalRecordApi.ts
│   │   │   ├── appointmentApi.ts
│   │   │   ├── dashboardApi.ts
│   │   │   └── index.ts
│   │   ├── hooks/                    # Custom hooks cho doctor
│   │   │   ├── useDoctorAuth.ts
│   │   │   ├── useSchedule.ts
│   │   │   ├── useDashboard.ts
│   │   │   ├── useAppointments.ts
│   │   │   ├── useMedicalRecords.ts
│   │   │   ├── useChatNotifications.ts
│   │   │   └── index.ts
│   │   ├── types/                    # Types riêng cho doctor
│   │   │   ├── schedule.ts
│   │   │   ├── medicalRecord.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── appointment.ts
│   │   │   └── index.ts
│   │   └── utils/                    # Utilities riêng cho doctor
│   │       ├── scheduleHelpers.ts
│   │       ├── appointmentHelpers.ts
│   │       ├── medicalRecordHelpers.ts
│   │       └── index.ts
│   │
│   └── pharmacy/                     # Module nhà thuốc (chuẩn bị cho tương lai)
│       ├── components/               # Components riêng cho pharmacy
│       │   ├── Dashboard/
│       │   │   ├── PharmacyDashboard.tsx
│       │   │   ├── InventoryStats.tsx
│       │   │   ├── SalesChart.tsx
│       │   │   ├── RevenueCard.tsx
│       │   │   └── index.ts
│       │   ├── Inventory/
│       │   │   ├── DrugInventory.tsx
│       │   │   ├── DrugCard.tsx
│       │   │   ├── DrugForm.tsx
│       │   │   ├── StockAlert.tsx
│       │   │   └── index.ts
│       │   ├── Prescription/
│       │   │   ├── PrescriptionCard.tsx
│       │   │   ├── PrescriptionList.tsx
│       │   │   ├── PrescriptionDetail.tsx
│       │   │   └── index.ts
│       │   ├── Order/
│       │   │   ├── OrderCard.tsx
│       │   │   ├── OrderList.tsx
│       │   │   ├── OrderForm.tsx
│       │   │   ├── OrderStatus.tsx
│       │   │   └── index.ts
│       │   └── index.ts
│       ├── pages/                    # Các trang của pharmacy
│       │   ├── Home/
│       │   │   └── Home.tsx
│       │   ├── Inventory/
│       │   │   ├── Inventory.tsx
│       │   │   └── DrugManagement.tsx
│       │   ├── Prescriptions/
│       │   │   ├── Prescriptions.tsx
│       │   │   └── PrescriptionDetail.tsx
│       │   ├── Orders/
│       │   │   ├── Orders.tsx
│       │   │   └── OrderDetail.tsx
│       │   └── Profile/
│       │       └── Profile.tsx
│       ├── api/                      # API calls riêng cho pharmacy
│       │   ├── pharmacyApi.ts
│       │   ├── drugApi.ts
│       │   ├── prescriptionApi.ts
│       │   ├── orderApi.ts
│       │   └── index.ts
│       ├── hooks/                    # Custom hooks cho pharmacy
│       │   ├── usePharmacyAuth.ts
│       │   ├── useInventory.ts
│       │   ├── usePrescriptions.ts
│       │   ├── useOrders.ts
│       │   └── index.ts
│       ├── types/                    # Types riêng cho pharmacy
│       │   ├── drug.ts
│       │   ├── prescription.ts
│       │   ├── order.ts
│       │   ├── inventory.ts
│       │   └── index.ts
│       └── utils/                    # Utilities riêng cho pharmacy
│           ├── drugHelpers.ts
│           ├── prescriptionHelpers.ts
│           ├── orderHelpers.ts
│           └── index.ts
│
├── shared/                           # Thành phần dùng chung
│   ├── components/                   # Components dùng chung
│   │   ├── Auth/
│   │   │   ├── AuthContainer.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── index.ts
│   │   ├── Layout/
│   │   │   ├── Header/
│   │   │   │   ├── Header.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Footer/
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Sidebar.tsx
│   │   │   ├── DoctorLayout.tsx
│   │   │   └── index.ts
│   │   ├── UI/                       # UI Components cơ bản
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   └── index.ts
│   │   ├── Chat/
│   │   │   ├── ChatModal.tsx
│   │   │   ├── ChatTemplates.ts
│   │   │   ├── GlobalChatNotifier.tsx
│   │   │   ├── README.md
│   │   │   └── index.ts
│   │   ├── Home/                     # Components cho trang chủ
│   │   │   ├── AppointmentSection.tsx
│   │   │   ├── DoctorSection.tsx
│   │   │   ├── FaqSection.tsx
│   │   │   ├── FloatingChatWidget.tsx
│   │   │   ├── HeroBanner.tsx
│   │   │   ├── ServiceSection.tsx
│   │   │   ├── TestimonialSection.tsx
│   │   │   └── index.ts
│   │   ├── Forms/                    # Form components
│   │   │   ├── MedicalRecordForm.tsx
│   │   │   ├── ImagePreviewUpload.tsx
│   │   │   └── index.ts
│   │   ├── Notifications/            # Notification components
│   │   │   ├── NotificationBadge.tsx
│   │   │   ├── useUnreadNotifications.ts
│   │   │   └── index.ts
│   │   ├── Appointments/             # Appointment components
│   │   │   ├── AppointmentSlip.tsx
│   │   │   ├── AppointmentSlipView.tsx
│   │   │   ├── ExpiryCountdown/
│   │   │   │   └── ExpiryCountdown.tsx
│   │   │   └── index.ts
│   │   ├── BadgeDot.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── index.ts
│   │
│   ├── api/                          # API calls dùng chung
│   │   ├── axiosConfig.ts            # Axios configuration
│   │   ├── authApi.ts                # Authentication API
│   │   ├── chatApi.ts                # Chat API
│   │   ├── doctorsApi.ts             # Doctors listing API
│   │   ├── specialtyApi.ts           # Specialty API
│   │   ├── uploadApi.ts              # File upload API
│   │   └── index.ts
│   │
│   ├── contexts/                     # React Contexts dùng chung
│   │   ├── AuthContext.tsx
│   │   ├── PaymentContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── index.ts
│   │
│   ├── hooks/                        # Custom hooks dùng chung
│   │   ├── useBadgeCounts.ts
│   │   ├── useNotifications.tsx
│   │   ├── useAuth.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useDebounce.ts
│   │   └── index.ts
│   │
│   ├── types/                        # Types dùng chung
│   │   ├── api.ts                    # API response types
│   │   ├── auth.ts                   # Authentication types
│   │   ├── common.ts                 # Common types
│   │   ├── socket-io-client.d.ts     # Socket.io types
│   │   └── index.ts
│   │
│   ├── utils/                        # Utilities dùng chung
│   │   ├── osNotify.ts               # OS notifications
│   │   ├── dateUtils.ts              # Date utilities
│   │   ├── formatUtils.ts            # Format utilities
│   │   ├── validationUtils.ts        # Validation utilities
│   │   └── index.ts
│   │
│   ├── constants/                    # Constants dùng chung
│   │   ├── specialties.ts            # Specialty constants
│   │   ├── apiEndpoints.ts           # API endpoints
│   │   ├── appConfig.ts              # App configuration
│   │   └── index.ts
│   │
│   └── styles/                       # Styles dùng chung
│       ├── Auth.module.css
│       ├── globals.css
│       ├── components.css
│       └── variables.css
│
├── store/                            # State management
│   ├── chatBadge.ts
│   ├── authStore.ts
│   ├── notificationStore.ts
│   └── index.ts
│
└── assets/                           # Static assets
    ├── images/
    │   ├── logos/
    │   ├── icons/
    │   └── backgrounds/
    ├── fonts/
    └── react.svg

│
├── shared/                           # Thành phần dùng chung
│   ├── components/                   # Components dùng chung
│   │   ├── Auth/
│   │   │   ├── AuthContainer.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── Layout/
│   │   │   ├── Header/
│   │   │   │   ├── Header.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Footer/
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Sidebar.tsx
│   │   │   ├── DoctorLayout.tsx
│   │   │   └── index.ts
│   │   ├── UI/                       # UI Components cơ bản
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── index.ts
│   │   ├── Chat/
│   │   │   ├── ChatModal.tsx
│   │   │   ├── ChatTemplates.ts
│   │   │   ├── GlobalChatNotifier.tsx
│   │   │   ├── README.md
│   │   │   └── index.ts
│   │   ├── Home/                     # Components cho trang chủ
│   │   │   ├── AppointmentSection.tsx
│   │   │   ├── DoctorSection.tsx
│   │   │   ├── FaqSection.tsx
│   │   │   ├── FloatingChatWidget.tsx
│   │   │   ├── HeroBanner.tsx
│   │   │   ├── ServiceSection.tsx
│   │   │   └── TestimonialSection.tsx
│   │   ├── AppointmentSlip.tsx
│   │   ├── AppointmentSlipView.tsx
│   │   ├── BadgeDot.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── ExpiryCountdown/
│   │   │   └── ExpiryCountdown.tsx
│   │   ├── ImagePreviewUpload.tsx
│   │   ├── MedicalRecordForm.tsx
│   │   ├── NotificationBadge.tsx
│   │   ├── useUnreadNotifications.ts
│   │   └── index.ts
│   │
│   ├── api/                          # API calls dùng chung
│   │   ├── authApi.ts
│   │   ├── axiosConfig.ts
│   │   ├── chatApi.ts
│   │   ├── doctorsApi.ts
│   │   ├── specialtyApi.ts
│   │   ├── uploadApi.ts
│   │   └── index.ts
│   │
│   ├── contexts/                     # React Contexts dùng chung
│   │   ├── AuthContext.tsx
│   │   ├── PaymentContext.tsx
│   │   └── index.ts
│   │
│   ├── hooks/                        # Custom hooks dùng chung
│   │   ├── useBadgeCounts.ts
│   │   ├── useNotifications.tsx
│   │   └── index.ts
│   │
│   ├── types/                        # Types dùng chung
│   │   ├── api.ts
│   │   ├── socket-io-client.d.ts
│   │   └── index.ts
│   │
│   ├── utils/                        # Utilities dùng chung
│   │   ├── osNotify.ts
│   │   └── index.ts
│   │
│   ├── constants/                    # Constants dùng chung
│   │   ├── specialties.ts
│   │   └── index.ts
│   │
│   └── styles/                       # Styles dùng chung
│       ├── Auth.module.css
│       └── globals.css
│
├── store/                            # State management
│   ├── chatBadge.ts
│   └── index.ts
│
└── assets/                           # Static assets
    └── react.svg
```

## 🎯 **Lợi ích của cấu trúc mới**

### 1. **Tách biệt rõ ràng theo module**
- Mỗi module (patient, doctor, pharmacy) có thể phát triển độc lập
- Dễ dàng thêm/xóa module mà không ảnh hưởng đến module khác
- Team có thể làm việc song song trên các module khác nhau

### 2. **Tái sử dụng code hiệu quả**
- Shared components được sử dụng chung giữa các module
- API calls, hooks, utilities chung được tập trung
- Giảm thiểu code duplicate

### 3. **Dễ bảo trì và mở rộng**
- Cấu trúc rõ ràng, dễ tìm kiếm file
- Mỗi module có structure nhất quán
- Dễ dàng thêm tính năng mới

### 4. **Performance tốt hơn**
- Có thể áp dụng code splitting theo module
- Lazy loading cho từng module
- Bundle size nhỏ hơn cho từng role

## 🔄 **Kế hoạch migration**

### Phase 1: Tạo cấu trúc mới
1. Tạo các thư mục module mới
2. Tạo thư mục shared
3. Di chuyển components chung vào shared

### Phase 2: Di chuyển Patient module
1. Di chuyển pages/Patient → modules/patient/pages
2. Tách API calls riêng cho patient
3. Cập nhật import paths

### Phase 3: Di chuyển Doctor module
1. Di chuyển pages/Doctor → modules/doctor/pages
2. Tách API calls riêng cho doctor
3. Cập nhật import paths

### Phase 4: Chuẩn bị Pharmacy module
1. Tạo cấu trúc cơ bản cho pharmacy
2. Thiết kế API structure
3. Tạo base components

### Phase 5: Cleanup và optimization
1. Xóa các thư mục cũ
2. Cập nhật tất cả import paths
3. Kiểm tra và test toàn bộ ứng dụng

## 📝 **Quy tắc đặt tên**

### File và thư mục:
- **PascalCase** cho components: `PatientProfile.tsx`
- **camelCase** cho utilities/hooks: `usePatientAuth.ts`
- **kebab-case** cho thư mục: `medical-records/`

### Import/Export:
- Mỗi thư mục có file `index.ts` để export
- Sử dụng named exports thay vì default exports
- Import theo thứ tự: external → shared → module-specific

## 🚀 **Ví dụ sử dụng**

```typescript
// Import từ shared
import { AuthContext, Button, Modal } from '@/shared';

// Import từ module cụ thể
import { usePatientAuth, PatientProfile } from '@/modules/patient';

// Import từ module khác (nếu cần)
import { DoctorCard } from '@/modules/doctor/components';
```

## 🔧 **Cấu hình cần thiết**

### 1. **Path mapping trong tsconfig.json**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/modules/*": ["./src/modules/*"]
    }
  }
}
```

### 2. **Vite config cho alias**
```typescript
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/modules': path.resolve(__dirname, './src/modules')
    }
  }
})
```

## 📊 **Metrics và monitoring**

- **Bundle size** theo module
- **Loading time** cho từng module
- **Code coverage** theo module
- **Dependency graph** để tránh circular imports

## 📋 **Chi tiết API Structure hiện tại**

### **Shared APIs (dùng chung)**
```typescript
shared/api/
├── axiosConfig.ts              # Cấu hình Axios chung
├── authApi.ts                  # Authentication API
├── chatApi.ts                  # Chat/messaging API
├── doctorsApi.ts               # Danh sách bác sĩ (public)
├── specialtyApi.ts             # Chuyên khoa API
├── uploadApi.ts                # Upload file API
└── index.ts                    # Export tất cả APIs
```

### **Patient Module APIs**
```typescript
modules/patient/api/
├── appointmentApi.ts           # Đặt lịch, lịch sử khám
├── paymentApi.ts               # Thanh toán, lịch sử thanh toán
├── serviceApi.ts               # Dịch vụ y tế
├── notificationApi.ts          # Thông báo cho bệnh nhân
└── index.ts
```

### **Doctor Module APIs**
```typescript
modules/doctor/api/
├── doctorApi.ts                # Thông tin bác sĩ, dashboard
├── scheduleApi.ts              # Lịch làm việc bác sĩ
├── medicalRecordApi.ts         # Hồ sơ bệnh án
├── appointmentApi.ts           # Quản lý lịch khám
├── dashboardApi.ts             # Thống kê dashboard
└── index.ts
```

### **Pharmacy Module APIs (Tương lai)**
```typescript
modules/pharmacy/api/
├── pharmacyApi.ts              # Thông tin nhà thuốc
├── drugApi.ts                  # Quản lý thuốc
├── prescriptionApi.ts          # Đơn thuốc
├── orderApi.ts                 # Đơn hàng thuốc
└── index.ts
```

## 🔄 **Mapping từ cấu trúc hiện tại**

### **API Files Migration**
```
Hiện tại → Cấu trúc mới
├── api/appointmentApi.ts → modules/patient/api/appointmentApi.ts
├── api/authApi.ts → shared/api/authApi.ts
├── api/axiosConfig.ts → shared/api/axiosConfig.ts
├── api/chatApi.ts → shared/api/chatApi.ts
├── api/doctorApi.ts → modules/doctor/api/doctorApi.ts
├── api/doctorsApi.ts → shared/api/doctorsApi.ts
├── api/medicalRecordApi.ts → modules/doctor/api/medicalRecordApi.ts
├── api/paymentApi.ts → modules/patient/api/paymentApi.ts
├── api/scheduleApi.ts → modules/doctor/api/scheduleApi.ts
├── api/serviceApi.ts → modules/patient/api/serviceApi.ts
├── api/specialtyApi.ts → shared/api/specialtyApi.ts
└── api/uploadApi.ts → shared/api/uploadApi.ts
```

### **Components Migration**
```
Hiện tại → Cấu trúc mới

📁 Shared Components:
├── components/Auth/ → shared/components/Auth/
├── components/Header/ → shared/components/Layout/Header/
├── components/Footer/ → shared/components/Layout/Footer/
├── components/Chat/ → shared/components/Chat/
├── components/Home/ → shared/components/Home/
├── components/layout/ → shared/components/Layout/
├── components/AppointmentSlip.tsx → shared/components/Appointments/
├── components/MedicalRecordForm.tsx → shared/components/Forms/
├── components/NotificationBadge.tsx → shared/components/Notifications/
└── components/ErrorBoundary.tsx → shared/components/

📁 Patient Components:
├── components/AppointmentCard.tsx → modules/patient/components/Cards/AppointmentCard.tsx
├── components/PaymentCard.tsx → modules/patient/components/Cards/PaymentCard.tsx
├── components/ServiceCard.tsx → modules/patient/components/Cards/ServiceCard.tsx
├── components/DoctorCard.tsx → modules/patient/components/Cards/DoctorCard.tsx
├── components/PatientProfile.tsx → modules/patient/components/Profile/PatientProfile.tsx
└── components/NotificationItem.tsx → modules/patient/components/Notifications/NotificationItem.tsx

📁 Doctor Components:
├── components/DoctorDashboard.tsx → modules/doctor/components/Dashboard/DoctorDashboard.tsx
├── components/PatientCard.tsx → modules/doctor/components/Patient/PatientCard.tsx
├── components/ScheduleCalendar.tsx → modules/doctor/components/Schedule/ScheduleCalendar.tsx
├── components/MedicalRecordCard.tsx → modules/doctor/components/MedicalRecord/MedicalRecordCard.tsx
├── components/AppointmentCard.tsx → modules/doctor/components/Appointment/AppointmentCard.tsx
├── components/StatsCard.tsx → modules/doctor/components/Dashboard/StatsCard.tsx
└── components/ActivityCard.tsx → modules/doctor/components/Dashboard/ActivityCard.tsx

📁 Pharmacy Components (Tương lai):
├── components/PharmacyDashboard.tsx → modules/pharmacy/components/Dashboard/PharmacyDashboard.tsx
├── components/DrugInventory.tsx → modules/pharmacy/components/Inventory/DrugInventory.tsx
├── components/PrescriptionCard.tsx → modules/pharmacy/components/Prescription/PrescriptionCard.tsx
└── components/OrderCard.tsx → modules/pharmacy/components/Order/OrderCard.tsx
```

### **Pages Migration**
```
Hiện tại → Cấu trúc mới
├── pages/Patient/ → modules/patient/pages/
├── pages/Doctor/ → modules/doctor/pages/
└── pages/useNotificationAlerts.ts → shared/hooks/useNotificationAlerts.ts
```

## 📊 **API Endpoints Summary**

### **Patient APIs**
| API File | Endpoints | Mô tả |
|----------|-----------|-------|
| `appointmentApi.ts` | `/api/patient/appointments/*` | Đặt lịch, lịch sử khám |
| `paymentApi.ts` | `/api/patient/payments/*` | Thanh toán, hóa đơn |
| `serviceApi.ts` | `/api/services/*` | Dịch vụ y tế (public) |
| `notificationApi.ts` | `/api/patient/notifications/*` | Thông báo |

### **Doctor APIs**
| API File | Endpoints | Mô tả |
|----------|-----------|-------|
| `doctorApi.ts` | `/api/doctor/*` | Dashboard, thống kê |
| `scheduleApi.ts` | `/api/doctor/schedules/*` | Lịch làm việc |
| `medicalRecordApi.ts` | `/api/doctor/medical-records/*` | Hồ sơ bệnh án |
| `appointmentApi.ts` | `/api/doctor/appointments/*` | Quản lý lịch khám |

### **Shared APIs**
| API File | Endpoints | Mô tả |
|----------|-----------|-------|
| `authApi.ts` | `/api/auth/*` | Đăng nhập, đăng ký |
| `chatApi.ts` | `/api/chat/*` | Tin nhắn |
| `doctorsApi.ts` | `/api/doctors/*` | Danh sách bác sĩ |
| `specialtyApi.ts` | `/api/specialties/*` | Chuyên khoa |
| `uploadApi.ts` | `/api/upload/*` | Upload file |

## 🎨 **Component Categories**

### **📁 Shared UI Components**
```
shared/components/
├── ui/                    # Basic UI components
│   ├── Button, Modal, Input, Badge, Card, Loading
├── layout/               # Layout components  
│   ├── Header, Footer, Sidebar, DoctorLayout
├── forms/                # Form components
│   ├── MedicalRecordForm, ImagePreviewUpload, ValidationInput
├── notifications/        # Notification components
│   ├── NotificationBadge, GlobalNotifier
├── chat/                 # Chat components
│   ├── ChatModal, MessageBubble, GlobalChatNotifier
└── appointments/         # Appointment components
    ├── AppointmentSlip, ExpiryCountdown, TimeSlotPicker
```

### **📁 Patient-Specific Components**
```
modules/patient/components/
├── Cards/                # Patient cards
│   ├── AppointmentCard, PaymentCard, ServiceCard
│   ├── SpecialtyCard, DoctorCard
├── Profile/              # Patient profile
│   ├── PatientProfile, ProfileEdit
└── Notifications/        # Patient notifications
    ├── NotificationItem, NotificationList
```

### **📁 Doctor-Specific Components**
```
modules/doctor/components/
├── Dashboard/            # Doctor dashboard
│   ├── DoctorDashboard, StatsCard, ActivityCard, RevenueChart
├── Patient/              # Patient management
│   ├── PatientCard, PatientList, PatientSearch
├── Schedule/             # Schedule management
│   ├── ScheduleCalendar, TimeSlotManager, ScheduleForm
├── MedicalRecord/        # Medical records
│   ├── MedicalRecordCard, RecordForm, RecordHistory
└── Appointment/          # Appointment management
    ├── AppointmentCard, AppointmentList, AppointmentFilter
```

### **📁 Pharmacy Components (Future)**
```
modules/pharmacy/components/
├── Dashboard/            # Pharmacy dashboard
│   ├── PharmacyDashboard, InventoryStats, SalesChart, RevenueCard
├── Inventory/            # Drug inventory
│   ├── DrugInventory, DrugCard, DrugForm, StockAlert
├── Prescription/         # Prescription management
│   ├── PrescriptionCard, PrescriptionList, PrescriptionDetail
└── Order/                # Order management
    ├── OrderCard, OrderList, OrderForm, OrderStatus
```

---

**Ghi chú**: Cấu trúc này được thiết kế để hỗ trợ tốt nhất cho việc phát triển và bảo trì dài hạn. Có thể điều chỉnh theo nhu cầu cụ thể của dự án.