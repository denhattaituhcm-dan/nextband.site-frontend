export interface CourseTheme {
  primary: string;
  pillBg: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconBg: string;
  iconText: string;
  borderHover: string;
  titleHover: string;
  shadowHover: string;
  buttonHover: string;
}

export interface CourseData {
  id: string;
  slug: string;
  stageNumber: string;
  title: string;
  name: string;
  bandTarget: string;
  target: string;
  rank: string;
  durationWeeks: number;
  durationHours: string;
  durationLabel: string;
  totalLessons: number;
  totalHours: number;
  schedule: string;
  classSize: string;
  tuition: string;
  tuitionNum: number;
  description: string;
  metadata: string[];
  inclusions: string[];
  trustBadges: string[];
  modules: string[];
  outcomes: string[];
  theme: CourseTheme;
}

export interface TrustPoint {
  key: string;
  title: string;
  description: string;
  iconName: "Users" | "GraduationCap" | "ShieldCheck" | "Gift";
}

export const TRUST_POINTS: TrustPoint[] = [
  {
    key: "class-size",
    title: "SĨ SỐ TỐI ĐA 8",
    description: "Lớp nhỏ, giáo viên có thể theo sát từng học viên.",
    iconName: "Users",
  },
  {
    key: "teacher",
    title: "100% GV IELTS 8.0+",
    description: "Giáo viên trực tiếp đứng lớp.",
    iconName: "GraduationCap",
  },
  {
    key: "trial",
    title: "HỌC THỬ 02 BUỔI",
    description: "Trải nghiệm trước khi quyết định.",
    iconName: "ShieldCheck",
  },
  {
    key: "scholarship",
    title: "HỌC BỔNG ĐẾN 10%",
    description: "Áp dụng theo điều kiện chương trình.",
    iconName: "Gift",
  },
];

export const COURSE_CATALOG: Record<string, CourseData> = {
  starter: {
    id: "c1000000-0000-0000-0000-000000000007",
    slug: "starter",
    stageNumber: "Chặng 01",
    title: "Khóa STARTER",
    name: "STARTER",
    bandTarget: "Đầu ra 3.0",
    target: "Đầu vào: Mất gốc → Đầu ra: 3.0 (Rank 3)",
    rank: "Tương ứng Rank 3 — Học Đồ",
    durationWeeks: 9,
    durationHours: "27 buổi (54 giờ)",
    durationLabel: "9 tuần · 27 buổi · 54 giờ",
    totalLessons: 27,
    totalHours: 54,
    schedule: "03 buổi / tuần, 02 giờ / buổi",
    classSize: "Tối đa 08 học viên / lớp",
    tuition: "4.400.000đ",
    tuitionNum: 4400000,
    description:
      "Chuẩn hóa phát âm IPA, từ vựng sinh hoạt thông dụng và cấu trúc câu đơn căn bản trong tiếng Anh.",
    metadata: ["9 tuần · 27 buổi · 54 giờ", "Tối đa 8 học viên", "NextBand LMS"],
    inclusions: [
      "100% GV IELTS 8.0+ trực tiếp đứng lớp",
      "Lớp tối đa 8 học viên",
      "Trọn bộ tài liệu & giáo trình",
      "Tài khoản NextBand LMS",
      "Chữa bài Speaking & Writing 1-1",
      "02 bài thi thử Mock Tests chuẩn phòng thi",
    ],
    trustBadges: [
      "100% GV IELTS 8.0+ trực tiếp dạy",
      "Học thử 02 buổi",
    ],
    modules: [
      "Chuẩn hóa 44 âm quốc tế IPA và nhận diện trọng âm từ",
      "Ngữ pháp câu đơn: Các thì căn bản, trật tự từ và các từ loại chính",
      "Xây dựng vốn từ vựng thông dụng theo các chủ đề sinh hoạt quen thuộc",
      "Luyện phản xạ nghe hiểu các mẩu hội thoại ngắn và số liệu đơn giản",
    ],
    outcomes: [
      "Phát âm chuẩn xác, không bị lai tạp âm tiếng Việt",
      "Tự tin viết và nói các câu đơn hoàn chỉnh đúng ngữ pháp",
      "Hiểu được các đoạn hội thoại giao tiếp thường ngày",
      "Sẵn sàng bước vào chặng rèn luyện DREAMER",
    ],
    theme: {
      primary: "#EE6873",
      pillBg: "bg-[#EE6873]",
      badgeBg: "bg-[#EE6873]/15",
      badgeText: "text-[#EE6873]",
      badgeBorder: "border-[#EE6873]/30",
      iconBg: "bg-[#EE6873]/15",
      iconText: "text-[#EE6873]",
      borderHover: "hover:border-[#EE6873]/60",
      titleHover: "group-hover:text-[#EE6873]",
      shadowHover: "hover:shadow-lg hover:shadow-[#EE6873]/15",
      buttonHover: "hover:text-[#EE6873] hover:bg-[#EE6873]/10",
    },
  },

  dreamer: {
    id: "c1000000-0000-0000-0000-000000000006",
    slug: "dreamer",
    stageNumber: "Chặng 02",
    title: "Khóa DREAMER",
    name: "DREAMER",
    bandTarget: "3.0 → 4.0",
    target: "Đầu vào: 3.0 → Đầu ra: 4.0 (Rank 4)",
    rank: "Tương ứng Rank 4 — Học Giả",
    durationWeeks: 9,
    durationHours: "27 buổi (54 giờ)",
    durationLabel: "9 tuần · 27 buổi · 54 giờ",
    totalLessons: 27,
    totalHours: 54,
    schedule: "03 buổi / tuần, 02 giờ / buổi",
    classSize: "Tối đa 08 học viên / lớp",
    tuition: "4.900.000đ",
    tuitionNum: 4900000,
    description:
      "Xây dựng ngữ pháp câu ghép, câu phức và kỹ năng đọc hiểu đoạn văn học thuật ngắn không đoán mò.",
    metadata: ["9 tuần · 27 buổi · 54 giờ", "Tối đa 8 học viên", "Chấm bài chi tiết"],
    inclusions: [
      "100% GV IELTS 8.0+ trực tiếp đứng lớp",
      "Lớp tối đa 8 học viên",
      "Trọn bộ tài liệu & giáo trình",
      "Tài khoản NextBand LMS",
      "Chữa bài Speaking & Writing 1-1",
      "02 bài thi thử Mock Tests chuẩn phòng thi",
    ],
    trustBadges: [
      "100% GV IELTS 8.0+ trực tiếp dạy",
      "Học thử 02 buổi",
    ],
    modules: [
      "Cấu trúc câu ghép và câu phức: Mệnh đề quan hệ, liên từ chỉ nguyên nhân/kết quả",
      "Phương pháp đọc hiểu skimming & scanning nhận diện thông tin chính",
      "Kỹ năng nghe nhận diện bẫy phát âm, từ đồng nghĩa (paraphrase) cơ bản",
      "Luyện nói trả lời câu hỏi Speaking Part 1 tự nhiên, có mở rộng ý",
    ],
    outcomes: [
      "Viết được đoạn văn ngắn liên kết mạch lạc giữa các câu",
      "Đọc hiểu chính xác ý chính của bài viết học thuật ngắn",
      "Phản xạ trả lời trôi chảy các chủ đề Speaking Part 1",
      "Sẵn sàng bước vào chặng rèn luyện BUILDER",
    ],
    theme: {
      primary: "#294398",
      pillBg: "bg-[#294398]",
      badgeBg: "bg-[#294398]/15",
      badgeText: "text-[#294398]",
      badgeBorder: "border-[#294398]/30",
      iconBg: "bg-[#294398]/15",
      iconText: "text-[#294398]",
      borderHover: "hover:border-[#294398]/60",
      titleHover: "group-hover:text-[#294398]",
      shadowHover: "hover:shadow-lg hover:shadow-[#294398]/15",
      buttonHover: "hover:text-[#294398] hover:bg-[#294398]/10",
    },
  },

  builder: {
    id: "c1000000-0000-0000-0000-000000000005",
    slug: "builder",
    stageNumber: "Chặng 03",
    title: "Khóa BUILDER",
    name: "BUILDER",
    bandTarget: "4.0 → 5.0",
    target: "Đầu vào: 4.0 → Đầu ra: 5.0 (Rank 5)",
    rank: "Tương ứng Rank 5 — Học Sĩ",
    durationWeeks: 9,
    durationHours: "27 buổi (54 giờ)",
    durationLabel: "9 tuần · 27 buổi · 54 giờ",
    totalLessons: 27,
    totalHours: 54,
    schedule: "03 buổi / tuần, 02 giờ / buổi",
    classSize: "Tối đa 08 học viên / lớp",
    tuition: "5.400.000đ",
    tuitionNum: 5400000,
    description:
      "Làm quen cấu trúc 4 kỹ năng IELTS, viết đoạn văn học thuật có luận điểm và phản xạ câu trả lời mạch lạc.",
    metadata: ["9 tuần · 27 buổi · 54 giờ", "Tối đa 8 học viên", "Thi thử định kỳ"],
    inclusions: [
      "100% GV IELTS 8.0+ trực tiếp đứng lớp",
      "Lớp tối đa 8 học viên",
      "Trọn bộ tài liệu & giáo trình",
      "Tài khoản NextBand LMS",
      "Chữa bài Speaking & Writing 1-1",
      "02 bài thi thử Mock Tests chuẩn phòng thi",
    ],
    trustBadges: [
      "100% GV IELTS 8.0+ trực tiếp dạy",
      "Học thử 02 buổi",
    ],
    modules: [
      "Làm quen cấu trúc đề thi 4 kỹ năng chuẩn Cambridge",
      "Tổ chức đoạn văn Writing Task 2 có câu chủ đề và giải thích lý do",
      "Kỹ năng mô tả biểu đồ đơn giản trong Writing Task 1",
      "Chiến thuật xử lý các dạng bài True/False/Not Given và Multiple Choice",
    ],
    outcomes: [
      "Nắm vững định dạng đề và tiêu chí chấm điểm bài thi IELTS",
      "Viết bài luận Task 1 & 2 hoàn chỉnh đúng cấu trúc logic",
      "Kiểm soát thời gian làm bài trong phòng thi",
      "Sẵn sàng bước vào chặng rèn luyện MASTER",
    ],
    theme: {
      primary: "#F37C42",
      pillBg: "bg-[#F37C42]",
      badgeBg: "bg-[#F37C42]/15",
      badgeText: "text-[#F37C42]",
      badgeBorder: "border-[#F37C42]/30",
      iconBg: "bg-[#F37C42]/15",
      iconText: "text-[#F37C42]",
      borderHover: "hover:border-[#F37C42]/60",
      titleHover: "group-hover:text-[#F37C42]",
      shadowHover: "hover:shadow-lg hover:shadow-[#F37C42]/15",
      buttonHover: "hover:text-[#F37C42] hover:bg-[#F37C42]/10",
    },
  },

  master: {
    id: "c1000000-0000-0000-0000-000000000004",
    slug: "master",
    stageNumber: "Chặng 04",
    title: "Khóa MASTER",
    name: "MASTER",
    bandTarget: "5.0 → 6.0",
    target: "Đầu vào: 5.0 → Đầu ra: 6.0 (Rank 6)",
    rank: "Tương ứng Rank 6 — Học Sư",
    durationWeeks: 9,
    durationHours: "27 buổi (54 giờ)",
    durationLabel: "9 tuần · 27 buổi · 54 giờ",
    totalLessons: 27,
    totalHours: 54,
    schedule: "03 buổi / tuần, 02 giờ / buổi",
    classSize: "Tối đa 08 học viên / lớp",
    tuition: "5.900.000đ",
    tuitionNum: 5900000,
    description:
      "Luyện viết luận Task 2 có lập luận chặt chẽ, mô tả biểu đồ Task 1 chính xác và phản xạ Nói theo các chủ đề chuyên sâu.",
    metadata: ["9 tuần · 27 buổi · 54 giờ", "Tối đa 8 học viên", "Chấm chữa 1:1 từng câu"],
    inclusions: [
      "100% GV IELTS 8.0+ trực tiếp đứng lớp",
      "Lớp tối đa 8 học viên",
      "Trọn bộ tài liệu & giáo trình",
      "Tài khoản NextBand LMS",
      "Chữa bài Speaking & Writing 1-1",
      "02 bài thi thử Mock Tests chuẩn phòng thi",
    ],
    trustBadges: [
      "100% GV IELTS 8.0+ trực tiếp dạy",
      "Học thử 02 buổi",
    ],
    modules: [
      "Tái cấu trúc lập luận Writing Task 2 theo phương pháp The ARIS Way",
      "Phân tích chuyên sâu và chọn lọc số liệu nổi bật Writing Task 1",
      "Mở rộng ý tưởng Speaking Part 2 & 3 không bị ngắc ngứ hay sáo rỗng",
      "Luyện đề thi thử định kỳ có tính giờ chuẩn trên phòng thi NextBand",
    ],
    outcomes: [
      "Tự xây dựng chuỗi luận điểm logic, có dẫn chứng thuyết phục",
      "Phản xạ Nói linh hoạt, kiểm soát độ trôi chảy và ngữ pháp phức",
      "Bứt phá band điểm Listening & Reading lên mốc 6.0 - 6.5",
      "Sẵn sàng bước vào chặng rèn luyện LEADER",
    ],
    theme: {
      primary: "#538442",
      pillBg: "bg-[#538442]",
      badgeBg: "bg-[#538442]/15",
      badgeText: "text-[#538442]",
      badgeBorder: "border-[#538442]/30",
      iconBg: "bg-[#538442]/15",
      iconText: "text-[#538442]",
      borderHover: "hover:border-[#538442]/60",
      titleHover: "group-hover:text-[#538442]",
      shadowHover: "hover:shadow-lg hover:shadow-[#538442]/15",
      buttonHover: "hover:text-[#538442] hover:bg-[#538442]/10",
    },
  },

  leader: {
    id: "c1000000-0000-0000-0000-000000000003",
    slug: "leader",
    stageNumber: "Chặng 05",
    title: "Khóa LEADER",
    name: "LEADER",
    bandTarget: "6.0 → 6.5+",
    target: "Đầu vào: 6.0 → Đầu ra: 6.5+ (Rank 7)",
    rank: "Tương ứng Rank 7 — Học Bá",
    durationWeeks: 10,
    durationHours: "30 buổi (60 giờ)",
    durationLabel: "10 tuần · 30 buổi · 60 giờ",
    totalLessons: 30,
    totalHours: 60,
    schedule: "03 buổi / tuần, 02 giờ / buổi",
    classSize: "Tối đa 08 học viên / lớp",
    tuition: "6.400.000đ",
    tuitionNum: 6400000,
    description:
      "Tinh chỉnh văn phong học thuật tự nhiên, kiểm soát độ chính xác ngữ nghĩa và hoàn thiện tư duy phản biện cấp cao.",
    metadata: ["10 tuần · 30 buổi · 60 giờ", "Tối đa 8 học viên", "Luyện đề phòng thi NextBand"],
    inclusions: [
      "100% GV IELTS 8.0+ trực tiếp đứng lớp",
      "Lớp tối đa 8 học viên",
      "Trọn bộ tài liệu & giáo trình",
      "Tài khoản NextBand LMS",
      "Chữa bài Speaking & Writing 1-1",
      "02 bài thi thử Mock Tests chuẩn phòng thi",
    ],
    trustBadges: [
      "100% GV IELTS 8.0+ trực tiếp dạy",
      "Học thử 02 buổi",
    ],
    modules: [
      "Kiểm soát độ mạch lạc cấp cao (Advanced Cohesion & Coherence)",
      "Văn phong bản ngữ và linh hoạt từ vựng theo ngữ cảnh học thuật chuyên sâu",
      "Tư duy phản biện và lập luận đa chiều trong Speaking Part 3",
      "Chấm chữa 1:1 chi tiết từng bài viết dưới sự theo sát của giảng viên chuyên môn",
    ],
    outcomes: [
      "Làm chủ hoàn toàn kỹ năng viết luận học thuật và phản xạ nói tự nhiên",
      "Đạt chuẩn đầu ra 6.5+ để phục vụ du học, làm việc hoặc nghiên cứu quốc tế",
      "Sở hữu năng lực tư duy ngôn ngữ độc lập dùng suốt đời",
      "Tự tin bước vào kỳ thi IELTS chính thức",
    ],
    theme: {
      primary: "#D12E33",
      pillBg: "bg-[#D12E33]",
      badgeBg: "bg-[#D12E33]/15",
      badgeText: "text-[#D12E33]",
      badgeBorder: "border-[#D12E33]/30",
      iconBg: "bg-[#D12E33]/15",
      iconText: "text-[#D12E33]",
      borderHover: "hover:border-[#D12E33]/60",
      titleHover: "group-hover:text-[#D12E33]",
      shadowHover: "hover:shadow-lg hover:shadow-[#D12E33]/15",
      buttonHover: "hover:text-[#D12E33] hover:bg-[#D12E33]/10",
    },
  },
};
