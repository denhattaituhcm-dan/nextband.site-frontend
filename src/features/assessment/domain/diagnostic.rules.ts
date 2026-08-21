import { ArisDiagnosticLevel } from "./assessment.types";

export const ARIS_DIAGNOSTIC_LEVELS: Record<number, ArisDiagnosticLevel> = {
  1: {
    levelNumber: 1,
    levelTitle: "Cấp 1 — Khởi Nền (Starter)",
    estimatedIeltsRange: "Band 2.5 – 3.5",
    description: "Thí sinh có nền tảng từ vựng cơ bản, cần củng cố lại phương pháp xây nền ngữ âm IPA và cấu trúc câu đơn hoàn chỉnh trước khi luyện đề.",
    recommendedCourse: {
      slug: "starter",
      title: "Khóa STARTER (Xây Nền 44 Âm IPA & Câu Đơn)",
      targetBand: "Mục tiêu: Đạt chuẩn 3.5+",
      level: "Beginner",
      summary: "Huấn luyện chuẩn xác 44 âm IPA, làm chủ cấu trúc câu đơn và 800 từ vựng cốt lõi theo phương pháp The ARIS Way.",
    },
  },
  2: {
    levelNumber: 2,
    levelTitle: "Cấp 2 — Tập Sự (Dreamer)",
    estimatedIeltsRange: "Band 3.5 – 4.5",
    description: "Đã có phản xạ nghe và hiểu các hội thoại quen thuộc. Cần mở rộng câu ghép, mệnh đề quan hệ và củng cố ngữ pháp trung cấp.",
    recommendedCourse: {
      slug: "dreamer",
      title: "Khóa DREAMER (Mở Rộng Từ Vựng & Phản Xạ Nghe)",
      targetBand: "Mục tiêu: Đạt chuẩn 4.5 – 5.0",
      level: "Elementary",
      summary: "Làm chủ các thì hoàn thành, mệnh đề quan hệ và xây dựng phản xạ nghe - nói qua các ngữ cảnh thực tế.",
    },
  },
  3: {
    levelNumber: 3,
    levelTitle: "Cấp 3 — Học Sĩ (Builder)",
    estimatedIeltsRange: "Band 5.0 – 5.5",
    description: "Nền tảng từ vựng và ngữ pháp khá vững. Cần chuyên sâu rèn luyện câu phức nhiều mệnh đề, các dạng bài suy luận logic và collocations học thuật.",
    recommendedCourse: {
      slug: "builder",
      title: "Khóa BUILDER (Làm Chủ Câu Phức & Đọc Hiểu Học Thuật)",
      targetBand: "Mục tiêu: Đạt chuẩn 5.5 – 6.0",
      level: "Intermediate",
      summary: "Huấn luyện kỹ thuật Scanning, Skimming chuyên sâu và bóc tách các bài đọc học thuật Cambridge nâng cao.",
    },
  },
  4: {
    levelNumber: 4,
    levelTitle: "Cấp 4 — Học Sư (Master)",
    estimatedIeltsRange: "Band 6.0 – 6.5",
    description: "Kỹ năng xử lý bài đọc và bài nghe rất tốt. Cần rèn luyện tư duy lập luận phản biện, bứt phá bài viết Task 2 và nói chuyên sâu Part 2-3.",
    recommendedCourse: {
      slug: "master",
      title: "Khóa MASTER (Bứt Phá Writing Task 2 & Speaking)",
      targetBand: "Mục tiêu: Đạt chuẩn 6.5 – 7.0",
      level: "Upper-Intermediate",
      summary: "Rèn luyện tư duy phản biện theo phương pháp The ARIS Way, tối ưu hóa điểm Lexical Resource và Coherence.",
    },
  },
  5: {
    levelNumber: 5,
    levelTitle: "Cấp 5 — Học Bá (Achiever)",
    estimatedIeltsRange: "Band 7.0 – 7.5",
    description: "Trình độ tiếng Anh học thuật xuất sắc. Phản xạ tự nhiên và độ chính xác ngữ pháp cao. Đề xuất luyện chiến thuật tối ưu hóa điểm số tuyệt đối.",
    recommendedCourse: {
      slug: "leader",
      title: "Khóa LEADER (Tối Ưu Điểm Số & Độ Nhạy Học Thuật)",
      targetBand: "Mục tiêu: Bứt phá 7.5 – 8.0+",
      level: "Advanced",
      summary: "Huấn luyện chuyên sâu cùng Giảng viên 8.5+ IELTS, tinh chỉnh collocations cao cấp và chiến thuật phòng thi đỉnh cao.",
    },
  },
  6: {
    levelNumber: 6,
    levelTitle: "Cấp 6 — Học Tôn (Scholar)",
    estimatedIeltsRange: "Band 8.0 – 8.5+",
    description: "Khả năng ngôn ngữ và độ chính xác ở mức chuyên gia. Xử lý các câu hỏi bẫy và từ vựng học thuật phức tạp một cách thuần thục.",
    recommendedCourse: {
      slug: "leader",
      title: "Khóa LEADER (Chuyên Đề Cao Cấp 8.0+)",
      targetBand: "Mục tiêu: Duy trì & Tối ưu 8.5+",
      level: "Advanced / Master",
      summary: "Huấn luyện 1-1 chuyên đề nâng cao về học thuật và ứng dụng xuất sắc.",
    },
  },
};

export function getArisDiagnosticLevel(rawCorrect: number, totalQuestions: number = 35): ArisDiagnosticLevel {
  const percentage = Math.round((rawCorrect / Math.max(1, totalQuestions)) * 100);
  if (percentage < 25) return ARIS_DIAGNOSTIC_LEVELS[1];
  if (percentage < 45) return ARIS_DIAGNOSTIC_LEVELS[2];
  if (percentage < 65) return ARIS_DIAGNOSTIC_LEVELS[3];
  if (percentage < 82) return ARIS_DIAGNOSTIC_LEVELS[4];
  if (percentage < 92) return ARIS_DIAGNOSTIC_LEVELS[5];
  return ARIS_DIAGNOSTIC_LEVELS[6];
}
