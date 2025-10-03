# Hệ thống Chat tự động cho Bác sĩ

## Tổng quan

Hệ thống chat tự động được thiết kế để giúp bác sĩ giao tiếp chuẩn hóa với bệnh nhân theo playbook đã định sẵn. Hệ thống bao gồm các template chat có sẵn với khả năng tùy chỉnh biến động.

## Cấu trúc

### 1. ChatTemplates.ts

- Chứa tất cả các template chat theo playbook
- Định nghĩa các biến động có thể thay thế
- Cung cấp checklist chuẩn bị theo từng loại dịch vụ
- Hàm thay thế biến và tạo quick replies

### 2. ChatModal.tsx

- Component modal chính để gửi tin nhắn
- Giao diện chọn template và chỉnh sửa biến
- Chế độ xem trước tin nhắn
- Tích hợp quick replies

## Cách sử dụng

### 1. Mở Chat Modal

```tsx
// Từ trang Appointments
<button onClick={() => handleOpenChat(appointment)}>Chat với bệnh nhân</button>
```

### 2. Chọn Template

- Chọn từ danh mục template có sẵn
- Hoặc nhập tin nhắn tùy chỉnh

### 3. Chỉnh sửa Biến

- Tự động điền thông tin từ appointment
- Có thể chỉnh sửa các biến như tên bệnh nhân, ngày khám, etc.

### 4. Xem trước và Gửi

- Xem trước tin nhắn với biến đã thay thế
- Copy tin nhắn hoặc gửi trực tiếp

## Các Template có sẵn

### Xác nhận & Nhắc nhở

- **Xác nhận lịch hẹn**: Template chuẩn để xác nhận lịch hẹn với bệnh nhân
- **Nhắc hẹn T-24h**: Nhắc nhở bệnh nhân 24h trước khám
- **Nhắc hẹn T-2h**: Nhắc nhở bệnh nhân 2h trước khám

### Thay đổi lịch

- **Đề xuất lại thời gian**: Khi bác sĩ cần đổi lịch
- **Hủy lịch**: Template hủy lịch từ phía bác sĩ

### Khám bệnh

- **Thu thập thông tin trước khám**: Hỏi triệu chứng và thông tin cần thiết
- **Bắt đầu khám**: Mở đầu buổi khám
- **Kết thúc buổi khám**: Tóm tắt và hướng dẫn sau khám

### Điều trị

- **Tóm tắt đơn thuốc**: Hướng dẫn dùng thuốc chi tiết
- **Điều trị hỗ trợ**: Khi không cần dùng thuốc
- **Yêu cầu xét nghiệm**: Hướng dẫn chuẩn bị xét nghiệm

### Tình huống đặc biệt

- **Bệnh nhân đến muộn**: Xử lý khi BN đến muộn
- **Bệnh nhân quên chuẩn bị**: Khi BN chưa chuẩn bị đúng
- **BN mang thai/cho con bú**: Xử lý đặc biệt
- **Xin giấy nghỉ/xác nhận**: Cấp giấy tờ cần thiết

## Biến động

### Biến cơ bản

- `{{patient_name}}`: Tên bệnh nhân
- `{{doctor_name}}`: Tên bác sĩ
- `{{service_name}}`: Dịch vụ khám
- `{{date}}`: Ngày khám (dd/mm/yyyy)
- `{{time_range}}`: Khung giờ khám
- `{{clinic_address}}`: Địa chỉ phòng khám
- `{{map_link}}`: Link chỉ đường
- `{{queue_no}}`: Số thứ tự
- `{{requirements}}`: Yêu cầu chuẩn bị
- `{{hotline}}`: Số hotline

### Biến y khoa

- `{{prescription_code}}`: Mã đơn thuốc
- `{{followup_date}}`: Ngày tái khám
- `{{dx}}`: Chẩn đoán
- `{{plan}}`: Kế hoạch điều trị
- `{{reason}}`: Lý do hủy/đổi lịch

## Checklist chuẩn bị theo dịch vụ

Hệ thống tự động gợi ý yêu cầu chuẩn bị dựa trên loại dịch vụ:

- **Xét nghiệm máu**: Nhịn ăn 6–8h, uống nước lọc bình thường
- **Sản–phụ**: Không tự dùng thuốc nếu nghi mang thai
- **Tim mạch**: Mang ECG hoặc toa thuốc cũ
- **Dinh dưỡng**: Chuẩn bị nhật ký ăn uống 3 ngày
- **Tâm lý**: Viết tình huống gây căng thẳng gần đây

## Tích hợp Backend

Để tích hợp với backend thực tế, cần implement hàm `handleSendMessage`:

```tsx
const handleSendMessage = async (message: string, appointmentId: string) => {
  try {
    const response = await fetch("/api/chat/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        appointmentId,
        message,
        senderType: "doctor",
      }),
    });

    if (response.ok) {
      // Thành công
      alert("Tin nhắn đã được gửi!");
    }
  } catch (error) {
    console.error("Lỗi gửi tin nhắn:", error);
  }
};
```

## Mở rộng

### Thêm Template mới

1. Thêm template vào `CHAT_TEMPLATES` trong `ChatTemplates.ts`
2. Định nghĩa các biến cần thiết
3. Thêm vào danh mục phù hợp trong `ChatModal.tsx`

### Thêm Biến mới

1. Thêm vào interface `TemplateVariables`
2. Thêm vào giao diện chỉnh sửa trong `ChatModal.tsx`
3. Cập nhật logic thay thế biến

### Tùy chỉnh Quick Replies

- Có thể tạo quick replies động dựa trên template
- Hỗ trợ biến trong quick replies
- Tự động tạo quick replies từ danh sách options

## Lưu ý

- Tất cả template đều hỗ trợ tiếng Việt
- Có thể dễ dàng mở rộng sang tiếng Anh
- Hỗ trợ copy tin nhắn để gửi qua kênh khác
- Giao diện responsive trên mobile
