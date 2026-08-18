export type TeacherAchievementType =
  | "achievement"
  | "education"
  | "experience"
  | "expertise"
  | "verification";

export interface TeacherAchievement {
  type: TeacherAchievementType;
  text: string;
}

export interface TeacherBadgeHighlight {
  label: string;
  value: string;
}

export interface TeacherScores {
  overall: number;
  listening: number;
  reading: number;
  writing?: number;
  speaking?: number;
  testType: "Academic" | "General Training";
}

export interface TeacherCredentials {
  education: string[];
  certifications: string[];
  experience: string[];
  expertise: string[];
}

export interface Teacher {
  id: string;
  name: string;
  role: string;
  roleSummary?: string;
  specialties: string[];
  avatar: string;
  ielts: {
    overall: number;
    highlight?: TeacherBadgeHighlight;
  };
  scores: TeacherScores;
  credentials: TeacherCredentials;
  achievements: TeacherAchievement[];
  certificate?: {
    image: string;
    pdfUrl?: string;
    alt: string;
  };
  reviewLink?: string;
}

export const teachers: Teacher[] = [
  {
    id: "luu-van-dang",
    name: "Lưu Văn Đang",
    role: "Academic Lead — Phụ trách Chuyên môn ARIS",
    roleSummary:
      "Phụ trách xây dựng chương trình đào tạo, chuẩn hóa tiêu chuẩn học thuật và trực tiếp theo dõi tiến độ cải thiện điểm số của học viên.",
    specialties: ["IELTS Academic", "Reading & Listening", "Academic English Strategy"],
    avatar: "/teachers/LVD.png",
    ielts: {
      overall: 8.0,
      highlight: {
        label: "Listening & Reading",
        value: "8.5",
      },
    },
    scores: {
      overall: 8.0,
      listening: 8.5,
      reading: 8.5,
      writing: 7.5,
      speaking: 7.5,
      testType: "Academic",
    },
    credentials: {
      education: [
        "Cử nhân Sư phạm Tiếng Anh — ĐH Sư phạm TP.HCM",
        "Nghiên cứu chuyên sâu phương pháp luận khảo thí quốc tế & Ngữ dụng học",
      ],
      certifications: [
        "IELTS 8.0 Academic (Listening 8.5, Reading 8.5) — Verified Test Report Form",
        "Chứng chỉ Nghiệp vụ Sư phạm Quốc gia",
      ],
      experience: [
        "Hơn 5 năm kinh nghiệm giảng dạy chuyên sâu lộ trình IELTS mục tiêu 6.5 - 7.5+",
        "Trực tiếp xây dựng tiêu chuẩn chấm chữa chi tiết từng câu trên hệ thống NextBand",
      ],
      expertise: [
        "Tác giả Khung Năng lực 7 Cấp bậc (ARIS-7) & Phương pháp The ARIS Way",
        "Chuẩn hóa quy trình phản hồi lỗi sai ngữ pháp, collocation và logic bài thi",
      ],
    },
    achievements: [
      {
        type: "verification",
        text: "IELTS 8.0 Academic (Listening 8.5, Reading 8.5) — Verified Test Report Form",
      },
      {
        type: "expertise",
        text: "Tác giả khung năng lực 7 cấp bậc (ARIS-7) & phương pháp đào tạo The ARIS Way",
      },
      {
        type: "experience",
        text: "Hơn 5 năm kinh nghiệm giảng dạy & chuẩn hóa tiêu chuẩn chấm chữa trên NextBand",
      },
      {
        type: "education",
        text: "Cử nhân Sư phạm Tiếng Anh, chuyên sâu phương pháp luận khảo thí quốc tế",
      },
    ],
    certificate: {
      image: "/IELTS CERTIFICATE_LUU_VAN-DANG_page-0001.jpg",
      pdfUrl: "/IELTS CERTIFICATE_LUU_VAN-DANG.pdf",
      alt: "IELTS Test Report Form - Lưu Văn Đang",
    },
  },
];
