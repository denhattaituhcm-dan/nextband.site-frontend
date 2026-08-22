export interface NotificationTemplate {
  id: string;
  category: "HOLIDAY" | "MAINTENANCE" | "STUDY" | "GENERAL";
  name: string;
  icon: string;
  type: "ANNOUNCEMENT" | "SYSTEM" | "DEADLINE_APPROACHING";
  targetType: "ALL" | "STUDENTS" | "TEACHERS" | "CLASS";
  title: string;
  message: string;
  link?: string;
  defaultDurationDays?: number;
}

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: "HOLIDAY_TET",
    category: "HOLIDAY",
    name: "Nghỉ Tết Âm Lịch",
    icon: "🧧",
    type: "ANNOUNCEMENT",
    targetType: "ALL",
    title: "Thông báo lịch nghỉ Tết Âm Lịch",
    message: "NextBand xin thông báo lịch nghỉ Tết Âm Lịch từ ngày DD/MM đến hết ngày DD/MM. Các lớp học và hoạt động chấm bài sẽ tạm nghỉ và trở lại bình thường vào ngày DD/MM. Kính chúc toàn thể học viên và quý thầy cô một năm mới An Khang Thịnh Vượng!",
    link: "/app",
    defaultDurationDays: 14,
  },
  {
    id: "HOLIDAY_NATIONAL",
    category: "HOLIDAY",
    name: "Nghỉ lễ Quốc Khánh 2/9",
    icon: "🇻🇳",
    type: "ANNOUNCEMENT",
    targetType: "ALL",
    title: "Thông báo lịch nghỉ lễ Quốc Khánh 2/9",
    message: "Hệ thống NextBand thông báo lịch nghỉ lễ Quốc Khánh 2/9 từ ngày 01/09 đến hết ngày 03/09. Hoạt động giảng dạy và học tập trực tuyến sẽ tiếp tục bình thường từ ngày 04/09.",
    link: "/app",
    defaultDurationDays: 4,
  },
  {
    id: "HOLIDAY_30_4",
    category: "HOLIDAY",
    name: "Nghỉ lễ 30/4 & 1/5",
    icon: "🏖️",
    type: "ANNOUNCEMENT",
    targetType: "ALL",
    title: "Thông báo lịch nghỉ lễ 30/4 & 1/5",
    message: "NextBand trân trọng thông báo lịch nghỉ lễ Giải phóng miền Nam 30/4 và Quốc tế Lao động 1/5 từ ngày 30/04 đến hết ngày 03/05. Chúc các bạn học viên và thầy cô có kỳ nghỉ lễ vui vẻ và an toàn!",
    link: "/app",
    defaultDurationDays: 5,
  },
  {
    id: "MAINTENANCE_UPDATE",
    category: "MAINTENANCE",
    name: "Bảo trì & Nâng cấp",
    icon: "⚙️",
    type: "SYSTEM",
    targetType: "ALL",
    title: "Thông báo bảo trì hệ thống định kỳ",
    message: "Hệ thống sẽ tiến hành bảo trì định kỳ và tối ưu tốc độ máy chủ từ 00:00 đến 02:00 sáng ngày DD/MM. Trong khoảng thời gian này, một số tính năng làm bài thi có thể bị gián đoạn ngắn. Mong quý học viên thông cảm.",
    link: "/app",
    defaultDurationDays: 2,
  },
  {
    id: "HOMEWORK_REMINDER",
    category: "STUDY",
    name: "Nhắc nhở bài tập",
    icon: "📚",
    type: "DEADLINE_APPROACHING",
    targetType: "STUDENTS",
    title: "Nhắc nhở hoàn thành bài tập tuần này",
    message: "Các bạn học viên lưu ý kiểm tra và hoàn thành các bài tập Writing & Speaking được giao trong tuần trước hạn chót. Giáo viên sẽ tiến hành chấm và trả bài chi tiết.",
    link: "/app",
    defaultDurationDays: 7,
  },
  {
    id: "NEW_FEATURE",
    category: "GENERAL",
    name: "Tính năng mới",
    icon: "🚀",
    type: "ANNOUNCEMENT",
    targetType: "ALL",
    title: "Cập nhật tính năng luyện thi mới trên NextBand",
    message: "NextBand vừa cập nhật bộ đề Speaking Forecast mới nhất cùng giao diện phòng thi chuẩn quốc tế. Khám phá và luyện tập ngay hôm nay!",
    link: "/ielts-speaking-forecast",
    defaultDurationDays: 10,
  },
];
