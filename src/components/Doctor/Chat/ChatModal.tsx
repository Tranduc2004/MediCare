import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  MessageSquare,
  Copy,
  Check,
  User,
  Edit3,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  CHAT_TEMPLATES,
  SERVICE_REQUIREMENTS,
  replaceTemplateVariables,
  getQuickRepliesWithVariables,
  TemplateVariables,
  ChatTemplate,
} from "./ChatTemplates";

interface Appointment {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  patientInfo?: {
    name: string;
    phone: string;
    email: string;
  };
  scheduleId: {
    _id: string;
    date: string;
    startTime: string;
    endTime: string;
  };
  status: string;
  symptoms?: string;
  note?: string;
  createdAt: string;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  doctorName: string;
  onSendMessage?: (message: string, appointmentId: string) => void;
  initialTemplate?: string;
  initialMessage?: string;
}

const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  appointment,
  doctorName,
  onSendMessage,
  initialTemplate,
  initialMessage,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customMessage, setCustomMessage] = useState<string>("");
  const [templateVariables, setTemplateVariables] = useState<
    Partial<TemplateVariables>
  >({});
  const [previewMode, setPreviewMode] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  // local editing flag (future use)

  // ref to the variables panel scroll container so we can auto-scroll focused inputs into view
  const varsScrollRef = React.useRef<HTMLDivElement | null>(null);

  const handleVarsFocusCapture = (e: React.FocusEvent) => {
    // If focus moves to an input/textarea/select inside the variables editor, scroll it into view
    const target = e.target as HTMLElement | null;
    if (!target || !varsScrollRef.current) return;
    // Only act for form controls
    const tag = target.tagName.toLowerCase();
    if (!["input", "textarea", "select"].includes(tag)) return;

    // Compute offset relative to container
    const container = varsScrollRef.current;
    const targetRect = target.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const offset = 12; // small padding
    // If target is below the visible area, scroll so it's visible with offset
    if (targetRect.bottom > containerRect.bottom - offset) {
      const scrollBy = targetRect.bottom - containerRect.bottom + offset;
      container.scrollBy({ top: scrollBy, behavior: "smooth" });
    }
    // If target is above the visible area, scroll up
    if (targetRect.top < containerRect.top + offset) {
      const scrollBy = targetRect.top - containerRect.top - offset;
      container.scrollBy({ top: scrollBy, behavior: "smooth" });
    }
  };

  // When entering edit mode, focus the first input inside the variables editor so
  // the browser will bring it into view. This helps on small screens where the
  // editor may be partially off-screen and the user can't manually scroll down.
  useEffect(() => {
    if (!previewMode && varsScrollRef.current) {
      // run after paint
      setTimeout(() => {
        const c = varsScrollRef.current!;
        // try to focus first control
        const first = c.querySelector<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >("input, textarea, select");
        if (first) {
          try {
            first.focus({ preventScroll: false });
          } catch {
            // some browsers may not support options
            first.focus();
          }
        }
      }, 60);
    }
  }, [previewMode]);

  // Khởi tạo biến mặc định khi appointment thay đổi
  useEffect(() => {
    if (appointment) {
      const parseService = (note?: string) => {
        if (!note) return "";
        const m = note.match(/\[Dịch vụ\]\s*([^|]+)/);
        return m?.[1]?.trim() || "";
      };

      const getServiceRequirements = (note?: string) => {
        const service = parseService(note).toLowerCase();
        if (service.includes("xét nghiệm") || service.includes("máu")) {
          return SERVICE_REQUIREMENTS.xet_nghiem_mau;
        } else if (service.includes("sản") || service.includes("phụ")) {
          return SERVICE_REQUIREMENTS.san_phu;
        } else if (service.includes("tim") || service.includes("mạch")) {
          return SERVICE_REQUIREMENTS.tim_mach;
        } else if (service.includes("dinh") || service.includes("dưỡng")) {
          return SERVICE_REQUIREMENTS.dinh_duong;
        } else if (service.includes("tâm") || service.includes("lý")) {
          return SERVICE_REQUIREMENTS.tam_ly;
        }
        return SERVICE_REQUIREMENTS.kham_tong_quat;
      };

      const defaultVars: Partial<TemplateVariables> = {
        patient_name: appointment.patientId.name,
        doctor_name: doctorName,
        service_name: parseService(appointment.note) || "Khám tổng quát",
        date: new Date(
          appointment.scheduleId.date + "T00:00:00"
        ).toLocaleDateString("vi-VN"),
        time_range: `${appointment.scheduleId.startTime} - ${appointment.scheduleId.endTime}`,
        clinic_address: "Phòng khám ABC, 123 Đường XYZ, Quận 1, TP.HCM",
        map_link: "https://maps.google.com",
        queue_no: "001",
        requirements: getServiceRequirements(appointment.note),
        hotline: "1900-1234",
      };
      setTemplateVariables(defaultVars);
      // If caller provided an initial template or message, apply it
      if (initialTemplate) setSelectedTemplate(initialTemplate);
      if (initialMessage) setCustomMessage(initialMessage);
    }
  }, [appointment, doctorName, initialTemplate, initialMessage]);

  const getCurrentTemplate = (): ChatTemplate | null => {
    return selectedTemplate ? CHAT_TEMPLATES[selectedTemplate] : null;
  };

  const getPreviewContent = (): string => {
    const base = (() => {
      if (customMessage) {
        return replaceTemplateVariables(customMessage, templateVariables);
      }
      const template = getCurrentTemplate();
      if (template) {
        return replaceTemplateVariables(template.content, templateVariables);
      }
      return "";
    })();
    // Loại bỏ placeholder chưa điền như {{option_1}}
    const withoutPlaceholders = base.replace(/\{\{[^}]+\}\}/g, "");
    // Gom bớt dòng trống
    return withoutPlaceholders.replace(/\n{3,}/g, "\n\n").trim();
  };

  const getPreviewQuickReplies = (): string[] => {
    const template = getCurrentTemplate();
    if (template) {
      return getQuickRepliesWithVariables(
        template.quickReplies,
        templateVariables
      );
    }
    return [];
  };

  const handleSendMessage = () => {
    const message = getPreviewContent();
    if (message && appointment && onSendMessage) {
      onSendMessage(message, appointment._id);
      onClose();
    }
  };

  const handleCopyToClipboard = async () => {
    const content = getPreviewContent();
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleVariableChange = (key: string, value: string) => {
    setTemplateVariables((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const getTemplateCategories = () => {
    const categories = {
      "Xác nhận & Nhắc nhở": [
        "confirm_appointment",
        "reminder_24h",
        "reminder_2h",
      ],
      "Thay đổi lịch": ["reschedule_proposal", "cancel_by_doctor"],
      "Khám bệnh": ["pre_exam_info", "start_examination", "end_examination"],
      "Điều trị": [
        "prescription_summary",
        "non_medication_treatment",
        "lab_request",
      ],
      "Tình huống đặc biệt": [
        "patient_late",
        "patient_unprepared",
        "pregnant_breastfeeding",
        "request_certificate",
      ],
    };
    return categories;
  };

  if (!isOpen || !appointment) return null;

  const template = getCurrentTemplate();
  const previewContent = getPreviewContent();
  const previewQuickReplies = getPreviewQuickReplies();
  const categories = getTemplateCategories();

  // Render markdown cơ bản: **bold**, *italic*, [text](url), xuống dòng
  const renderMarkdown = (text: string): string => {
    // Escape HTML trước
    const escapeHtml = (s: string) =>
      s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    let html = escapeHtml(text);
    // Link: [label](url)
    html = html.replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener" class="text-blue-600 underline">$1</a>'
    );
    // Bold: **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    // Italic: *text*
    html = html.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
    // Gạch đầu dòng đơn giản (không tạo ul/li đầy đủ để giữ layout hiện tại)
    // Chỉ chuyển \n thành <br/>
    html = html.replace(/\n/g, "<br/>");
    return html;
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-6xl max-h-[90vh] rounded-2xl bg-white shadow-xl overflow-hidden ">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4  bg-gradient-to-r from-blue-500 to-teal-400">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-white" />
            <div>
              <h3 className="text-lg font-semibold text-white">
                Chat với bệnh nhân
              </h3>
              <p className="text-sm text-white">
                {appointment.patientId.name} •{" "}
                {new Date(
                  appointment.scheduleId.date + "T00:00:00"
                ).toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Toggle preview */}
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={[
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                previewMode
                  ? // Secondary khi đang xem trước
                    "text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-300/60"
                  : // Primary khi đang ở chế độ chỉnh sửa
                    "text-white shadow-sm bg-gradient-to-r from-blue-500 to-teal-400 hover:from-blue-600 hover:to-teal-500 active:from-blue-700 active:to-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-300/60",
              ].join(" ")}
            >
              {previewMode ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {previewMode ? "Chỉnh sửa" : "Xem trước"}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              aria-label="Đóng"
              title="Đóng"
              className="rounded-full p-2 text-slate-500 transition-colors
               hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200
               focus:outline-none focus:ring-2 focus:ring-teal-300/60"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Left Panel - Template Selection */}
          <div className="w-1/3 border-r border-slate-200 bg-slate-50 overflow-y-auto">
            <div className="p-4">
              <h4 className="mb-4 font-semibold text-slate-900">
                Chọn template
              </h4>

              {/* Custom Message */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Tin nhắn tùy chỉnh
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Nhập tin nhắn tùy chỉnh..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  rows={3}
                />
              </div>

              {/* Template Categories */}
              {Object.entries(categories).map(([category, templateIds]) => (
                <div key={category} className="mb-4">
                  <h5 className="mb-2 text-sm font-medium text-slate-700">
                    {category}
                  </h5>
                  <div className="space-y-1">
                    {templateIds.map((templateId) => {
                      const t = CHAT_TEMPLATES[templateId];
                      return (
                        <button
                          key={templateId}
                          onClick={() => {
                            setSelectedTemplate(templateId);
                            setCustomMessage("");
                          }}
                          className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                            selectedTemplate === templateId
                              ? "bg-blue-100 text-blue-700 border border-blue-200"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {t.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Preview & Variables */}
          <div className="flex-1 flex flex-col">
            {previewMode ? (
              /* Preview Mode */
              <div className="flex-1 flex flex-col">
                {/* Message Preview */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="max-w-2xl mx-auto">
                    <div className="mb-4 flex items-center gap-2">
                      <h4 className="font-semibold text-slate-900">
                        Xem trước tin nhắn
                      </h4>
                      <button
                        onClick={handleCopyToClipboard}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        {copied ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {copied ? "Đã copy" : "Copy"}
                      </button>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-slate-900">
                          {doctorName}
                        </span>
                        <span className="text-xs text-slate-500">Bác sĩ</span>
                      </div>

                      <div
                        className="text-sm text-slate-800 leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: renderMarkdown(previewContent),
                        }}
                      />
                    </div>

                    {/* Quick Replies Preview */}
                    {previewQuickReplies.length > 0 && (
                      <div className="mt-4">
                        <h5 className="mb-2 text-sm font-medium text-slate-700">
                          Quick Replies
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {previewQuickReplies.map((reply, index) => (
                            <span
                              key={index}
                              className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                            >
                              {reply}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setPreviewMode(false)}
                      className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                      <Edit3 className="h-4 w-4" />
                      Chỉnh sửa biến
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={onClose}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleSendMessage}
                        disabled={!previewContent}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-300"
                      >
                        <Send className="h-4 w-4" />
                        Gửi tin nhắn
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Edit Mode */
              <div className="flex-1 flex flex-col">
                {/* Variables Editor */}
                <div
                  className="flex-1 p-6 overflow-y-auto"
                  ref={varsScrollRef}
                  onFocusCapture={handleVarsFocusCapture}
                >
                  <div className="max-w-2xl mx-auto">
                    <h4 className="mb-4 font-semibold text-slate-900">
                      Chỉnh sửa biến
                    </h4>

                    <div className="space-y-4">
                      {/* Basic Info */}
                      <div className="rounded-xl border border-slate-200 p-4">
                        <h5 className="mb-3 font-medium text-slate-900">
                          Thông tin cơ bản
                        </h5>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                              Tên bệnh nhân
                            </label>
                            <input
                              type="text"
                              value={templateVariables.patient_name || ""}
                              onChange={(e) =>
                                handleVariableChange(
                                  "patient_name",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                              Tên bác sĩ
                            </label>
                            <input
                              type="text"
                              value={templateVariables.doctor_name || ""}
                              onChange={(e) =>
                                handleVariableChange(
                                  "doctor_name",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                              Dịch vụ
                            </label>
                            <input
                              type="text"
                              value={templateVariables.service_name || ""}
                              onChange={(e) =>
                                handleVariableChange(
                                  "service_name",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                              Ngày khám
                            </label>
                            <input
                              type="text"
                              value={templateVariables.date || ""}
                              onChange={(e) =>
                                handleVariableChange("date", e.target.value)
                              }
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                              Khung giờ
                            </label>
                            <input
                              type="text"
                              value={templateVariables.time_range || ""}
                              onChange={(e) =>
                                handleVariableChange(
                                  "time_range",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                              Số thứ tự
                            </label>
                            <input
                              type="text"
                              value={templateVariables.queue_no || ""}
                              onChange={(e) =>
                                handleVariableChange("queue_no", e.target.value)
                              }
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Location & Contact */}
                      <div className="rounded-xl border border-slate-200 p-4">
                        <h5 className="mb-3 font-medium text-slate-900">
                          Địa điểm & Liên hệ
                        </h5>
                        <div className="space-y-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                              Địa chỉ phòng khám
                            </label>
                            <input
                              type="text"
                              value={templateVariables.clinic_address || ""}
                              onChange={(e) =>
                                handleVariableChange(
                                  "clinic_address",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                              Link chỉ đường
                            </label>
                            <input
                              type="text"
                              value={templateVariables.map_link || ""}
                              onChange={(e) =>
                                handleVariableChange("map_link", e.target.value)
                              }
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                              Hotline
                            </label>
                            <input
                              type="text"
                              value={templateVariables.hotline || ""}
                              onChange={(e) =>
                                handleVariableChange("hotline", e.target.value)
                              }
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Medical Info */}
                      <div className="rounded-xl border border-slate-200 p-4">
                        <h5 className="mb-3 font-medium text-slate-900">
                          Thông tin y khoa
                        </h5>
                        <div className="space-y-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                              Yêu cầu chuẩn bị
                            </label>
                            <textarea
                              value={templateVariables.requirements || ""}
                              onChange={(e) =>
                                handleVariableChange(
                                  "requirements",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              rows={3}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                              Mã đơn thuốc
                            </label>
                            <input
                              type="text"
                              value={templateVariables.prescription_code || ""}
                              onChange={(e) =>
                                handleVariableChange(
                                  "prescription_code",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                              Ngày tái khám
                            </label>
                            <input
                              type="text"
                              value={templateVariables.followup_date || ""}
                              onChange={(e) =>
                                handleVariableChange(
                                  "followup_date",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Additional Variables */}
                      {(template?.variables.includes("reason") ||
                        template?.variables.includes("option_1") ||
                        template?.variables.includes("dx") ||
                        template?.variables.includes("plan")) && (
                        <div className="rounded-xl border border-slate-200 p-4">
                          <h5 className="mb-3 font-medium text-slate-900">
                            Biến bổ sung
                          </h5>
                          <div className="space-y-3">
                            {template?.variables.includes("reason") && (
                              <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                  Lý do
                                </label>
                                <input
                                  type="text"
                                  value={templateVariables.reason || ""}
                                  onChange={(e) =>
                                    handleVariableChange(
                                      "reason",
                                      e.target.value
                                    )
                                  }
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                              </div>
                            )}
                            {template?.variables.includes("dx") && (
                              <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                  Chẩn đoán
                                </label>
                                <input
                                  type="text"
                                  value={templateVariables.dx || ""}
                                  onChange={(e) =>
                                    handleVariableChange("dx", e.target.value)
                                  }
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                              </div>
                            )}
                            {template?.variables.includes("plan") && (
                              <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                  Kế hoạch điều trị
                                </label>
                                <textarea
                                  value={templateVariables.plan || ""}
                                  onChange={(e) =>
                                    handleVariableChange("plan", e.target.value)
                                  }
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                  rows={2}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setPreviewMode(true)}
                      className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                      <Eye className="h-4 w-4" />
                      Xem trước
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={onClose}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={() => setPreviewMode(true)}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        <Eye className="h-4 w-4" />
                        Xem trước
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
