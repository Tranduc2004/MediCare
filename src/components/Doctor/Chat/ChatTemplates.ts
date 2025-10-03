// Chat Templates cho bác sĩ theo playbook
export interface ChatTemplate {
  id: string;
  title: string;
  content: string;
  quickReplies: string[];
  variables: string[];
}

export interface TemplateVariables {
  patient_name: string;
  doctor_name: string;
  service_name: string;
  date: string;
  time_range: string;
  clinic_address: string;
  map_link: string;
  queue_no?: string;
  requirements: string;
  prescription_code?: string;
  followup_date?: string;
  reason?: string;
  option_1?: string;
  option_2?: string;
  option_3?: string;
  dx?: string;
  plan?: string;
  hotline?: string;
  days?: string;
}

export const CHAT_TEMPLATES: Record<string, ChatTemplate> = {
  // 1. Xác nhận lịch hẹn
  confirm_appointment: {
    id: "confirm_appointment",
    title: "Xác nhận lịch hẹn",
    content: `Chào {{patient_name}}, tôi là **{{doctor_name}}**. Lịch **{{service_name}}** của bạn đã **được xác nhận** vào **{{date}}**, khung giờ **{{time_range}}**.

**Địa điểm:** {{clinic_address}} — [Chỉ đường]({{map_link}})

**Chuẩn bị:** {{requirements}}

Bạn vui lòng đến sớm **10 phút** để làm thủ tục. Cần đổi lịch? Trả lời *"chọn giờ khác"* nhé.`,
    quickReplies: ["Đã rõ", "Chọn giờ khác", "Xem chỉ đường", "Hỏi thêm"],
    variables: [
      "patient_name",
      "doctor_name",
      "service_name",
      "date",
      "time_range",
      "clinic_address",
      "map_link",
      "requirements",
    ],
  },

  // 2. Nhắc hẹn T-24h
  reminder_24h: {
    id: "reminder_24h",
    title: "Nhắc hẹn T-24h",
    content: `Nhắc lịch ngày mai **{{date}} {{time_range}}** với BS {{doctor_name}}. Vui lòng phản hồi nếu cần đổi lịch.`,
    quickReplies: ["Đã rõ", "Đổi lịch", "Xác nhận"],
    variables: ["date", "time_range", "doctor_name"],
  },

  // 3. Nhắc hẹn T-2h
  reminder_2h: {
    id: "reminder_2h",
    title: "Nhắc hẹn T-2h",
    content: `Hẹn gặp bạn lúc **{{time_range}}** hôm nay. Đến quầy tiếp đón & nói **số: {{queue_no}}** (nếu có).`,
    quickReplies: ["Đã rõ", "Đang đến", "Cần hỗ trợ"],
    variables: ["time_range", "queue_no"],
  },

  // 4. Đề xuất lại thời gian
  reschedule_proposal: {
    id: "reschedule_proposal",
    title: "Đề xuất lại thời gian",
    content: `Rất xin lỗi {{patient_name}}, tôi bận ca **{{date}} {{time_range}}**. Tôi đề xuất các khung giờ sau:
– {{option_1}}
– {{option_2}}
– {{option_3}}

Bạn bấm chọn khung giờ phù hợp, mình sẽ **xác nhận ngay**.`,
    quickReplies: [
      "Chọn {{option_1}}",
      "Chọn {{option_2}}",
      "Chọn {{option_3}}",
      "Cần thêm lựa chọn",
    ],
    variables: [
      "patient_name",
      "date",
      "time_range",
      "option_1",
      "option_2",
      "option_3",
    ],
  },

  // 5. Hủy lịch (phía bác sĩ)
  cancel_by_doctor: {
    id: "cancel_by_doctor",
    title: "Hủy lịch (phía bác sĩ)",
    content: `Xin lỗi {{patient_name}}, tôi phải **hủy lịch** {{date}} {{time_range}} do {{reason}}. Tôi có thể **sắp xếp lại** vào: {{option_1}} / {{option_2}}.`,
    quickReplies: [
      "Chọn {{option_1}}",
      "Chọn {{option_2}}",
      "Để sau",
      "Hỏi thêm",
    ],
    variables: [
      "patient_name",
      "date",
      "time_range",
      "reason",
      "option_1",
      "option_2",
    ],
  },

  // 6. Thu thập thông tin trước khám
  pre_exam_info: {
    id: "pre_exam_info",
    title: "Thu thập thông tin trước khám",
    content: `Để buổi khám hiệu quả, bạn cho tôi biết:

1. Triệu chứng chính & thời gian xuất hiện?
2. Bệnh nền / dị ứng thuốc?
3. Thuốc đang dùng (tên & liều)?
4. Mang/đính kèm kết quả cận lâm sàng gần đây (nếu có).`,
    quickReplies: [
      "Gửi triệu chứng",
      "Tôi đang dùng thuốc",
      "Đính kèm kết quả",
      "Không có gì đặc biệt",
    ],
    variables: [],
  },

  // 7. Bắt đầu khám
  start_examination: {
    id: "start_examination",
    title: "Bắt đầu khám",
    content: `Chào {{patient_name}}, tôi là **{{doctor_name}}**. Bạn mô tả giúp tôi **vấn đề chính** hôm nay và mục tiêu mong muốn từ buổi khám này nhé.`,
    quickReplies: [
      "Đau/khó chịu chính",
      "Mong muốn điều trị",
      "Kiểm tra định kỳ",
    ],
    variables: ["patient_name", "doctor_name"],
  },

  // 8. Tóm tắt đơn thuốc
  prescription_summary: {
    id: "prescription_summary",
    title: "Tóm tắt đơn thuốc",
    content: `Tôi đã kê **đơn điện tử**: **{{prescription_code}}**. Hướng dẫn dùng:

1. **{{drug_1}}** – {{dose_1}} – {{freq_1}} – {{duration_1}} ({{before_after_meal_1}})
2. **{{drug_2}}** – {{dose_2}} – {{freq_2}} – {{duration_2}} ({{before_after_meal_2}})

**Lưu ý chung:**
– Nếu có **phát ban, khó thở, sưng môi/lưỡi** → **ngừng ngay** và liên hệ cơ sở gần nhất.
– Không tự ý ngưng thuốc khi **đỡ triệu chứng**.
– Nếu quên liều < 4h: uống bù; > 4h: bỏ qua, **không** gộp liều.

**Tái khám:** {{followup_date}} (hoặc khi triệu chứng nặng lên).`,
    quickReplies: [
      "Xem đơn",
      "Gửi SMS đơn thuốc",
      "Hỏi cách dùng",
      "Đặt lịch tái khám",
    ],
    variables: [
      "prescription_code",
      "drug_1",
      "dose_1",
      "freq_1",
      "duration_1",
      "before_after_meal_1",
      "drug_2",
      "dose_2",
      "freq_2",
      "duration_2",
      "before_after_meal_2",
      "followup_date",
    ],
  },

  // 9. Không dùng thuốc / Điều trị hỗ trợ
  non_medication_treatment: {
    id: "non_medication_treatment",
    title: "Điều trị hỗ trợ (không dùng thuốc)",
    content: `Tôi ưu tiên **không dùng thuốc** lúc này. Bạn thực hiện:
– **Nghỉ ngơi/giãn cơ/ uống đủ nước**
– **Chườm ấm/lạnh** tùy triệu chứng
– Bài tập: {{exercise_link}}
– Ghi nhật ký triệu chứng 3–5 ngày. Nếu **không cải thiện**, chúng ta chuyển hướng.`,
    quickReplies: [
      "Xem bài tập",
      "Ghi nhật ký",
      "Hỏi thêm",
      "Đặt lịch tái khám",
    ],
    variables: ["exercise_link"],
  },

  // 10. Yêu cầu xét nghiệm
  lab_request: {
    id: "lab_request",
    title: "Yêu cầu xét nghiệm",
    content: `Tôi chỉ định: **{{test_list}}** để chẩn đoán chính xác. Bạn:
– Nhịn ăn **6–8h** (với lipid/glucose), uống nước lọc bình thường.
– Tránh vận động nặng 24h trước ECG/siêu âm tim (nếu có).
– Kết quả dự kiến: **{{eta}}**.`,
    quickReplies: [
      "Đặt lịch xét nghiệm",
      "Hướng dẫn chuẩn bị",
      "Hỏi thêm",
      "Xem địa chỉ",
    ],
    variables: ["test_list", "eta"],
  },

  // 11. Kết thúc buổi khám
  end_examination: {
    id: "end_examination",
    title: "Kết thúc buổi khám",
    content: `Cảm ơn {{patient_name}} đã hợp tác. Tóm tắt:
– Chẩn đoán làm việc: **{{dx}}**
– Kế hoạch: **{{plan}}**
– Đơn: **{{prescription_code}}** | Tái khám: **{{followup_date}}**

Nếu có dấu hiệu **bất thường** (sốt cao kéo dài, khó thở, đau ngực…), hãy liên hệ ngay **{{hotline}}** hoặc cơ sở gần nhất.`,
    quickReplies: [
      "Tải hướng dẫn",
      "Đặt lịch tái khám",
      "Hỏi thêm",
      "Đánh giá dịch vụ",
    ],
    variables: [
      "patient_name",
      "dx",
      "plan",
      "prescription_code",
      "followup_date",
      "hotline",
    ],
  },

  // 12. BN đến muộn
  patient_late: {
    id: "patient_late",
    title: "Bệnh nhân đến muộn",
    content: `Bạn có thể đến vào **{{new_time}}** hôm nay không? Nếu không, tôi sẽ **đổi sang** {{option_1}} / {{option_2}}.`,
    quickReplies: [
      "Chọn {{new_time}}",
      "Chọn {{option_1}}",
      "Chọn {{option_2}}",
      "Hỏi thêm",
    ],
    variables: ["new_time", "option_1", "option_2"],
  },

  // 13. BN quên chuẩn bị
  patient_unprepared: {
    id: "patient_unprepared",
    title: "Bệnh nhân quên chuẩn bị",
    content: `Hôm nay bạn **chưa nhịn ăn**, kết quả có thể sai lệch. Tôi khuyên **đổi sang** {{option_1}} sáng mai. Bạn thấy sao?`,
    quickReplies: [
      "Chọn {{option_1}}",
      "Vẫn khám hôm nay",
      "Hỏi thêm",
      "Hủy lịch",
    ],
    variables: ["option_1"],
  },

  // 14. BN mang thai/cho con bú
  pregnant_breastfeeding: {
    id: "pregnant_breastfeeding",
    title: "BN mang thai/cho con bú",
    content: `Vui lòng **báo rõ** tình trạng mang thai/cho con bú. Một số thuốc **không dùng** trong giai đoạn này, tôi sẽ điều chỉnh phác đồ phù hợp.`,
    quickReplies: ["Đang mang thai", "Đang cho con bú", "Không", "Hỏi thêm"],
    variables: [],
  },

  // 15. Xin giấy nghỉ/xác nhận
  request_certificate: {
    id: "request_certificate",
    title: "Xin giấy nghỉ/xác nhận",
    content: `Tôi có thể cấp **giấy xác nhận khám** hoặc **đề nghị nghỉ** {{days}} ngày. Bạn có cần không?`,
    quickReplies: [
      "Cần giấy nghỉ",
      "Cần giấy xác nhận",
      "Không cần",
      "Hỏi thêm",
    ],
    variables: ["days"],
  },
};

// Checklist chuẩn bị theo dịch vụ
export const SERVICE_REQUIREMENTS: Record<string, string> = {
  xet_nghiem_mau:
    "Nhịn ăn 6–8h, uống nước lọc bình thường. Tránh rượu bia/cafein.",
  san_phu: "Nếu nghi mang thai, không tự dùng thuốc trước khi khám.",
  tim_mach: "Mang ECG hoặc toa thuốc cũ.",
  dinh_duong: "Chuẩn bị nhật ký ăn uống 3 ngày.",
  tam_ly: "Viết ngắn gọn tình huống gây căng thẳng gần đây.",
  kham_tong_quat: "Mang theo kết quả khám gần đây (nếu có).",
  kham_mat: "Không đeo kính áp tròng trong 24h trước khám.",
  kham_tai_mui_hong: "Không ăn uống 2h trước khám.",
};

// Hàm thay thế biến trong template
export function replaceTemplateVariables(
  template: string,
  variables: Partial<TemplateVariables>
): string {
  let result = template;

  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, "g"), value || "");
  });

  return result;
}

// Hàm lấy quick replies với biến đã thay thế
export function getQuickRepliesWithVariables(
  quickReplies: string[],
  variables: Partial<TemplateVariables>
): string[] {
  return quickReplies.map((reply) =>
    replaceTemplateVariables(reply, variables)
  );
}
