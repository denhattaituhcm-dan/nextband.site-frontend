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

export interface Teacher {
  id: string;
  name: string;
  role: string;
  specialties: string[];
  avatar: string;
  ielts: {
    overall: number;
    highlight?: TeacherBadgeHighlight;
  };
  achievements: TeacherAchievement[];
  certificate?: {
    image: string;
    alt: string;
  };
  reviewLink?: string;
}

export const teachers: Teacher[] = [
  {
    id: "luu-van-dang",
    name: "Lưu Văn Đẳng",
    role: "Academic Lead — Phụ trách Chuyên môn ARIS",
    specialties: ["Reading & Listening", "Methodology & Academic Strategy"],
    avatar: "/teachers/luu-van-dang.jpg",
    ielts: {
      overall: 8.0,
      highlight: {
        label: "Listening & Reading",
        value: "8.5",
      },
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
      alt: "IELTS Test Report Form - Lưu Văn Đẳng",
    },
  },
];
