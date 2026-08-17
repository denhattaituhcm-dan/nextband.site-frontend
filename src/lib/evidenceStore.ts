export interface EvidenceItem {
  id: string;
  studentName: string;
  studentSchool?: string;
  title: string;
  imageUrl: string;
  story: string;
  scoreBefore?: string;
  overallScore: string;
  listeningScore?: string;
  readingScore?: string;
  writingScore?: string;
  speakingScore?: string;
  studyDuration?: string;
  courseName?: string;
  featured: boolean;
  published: boolean;
  consentConfirmed: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "aris_evidence_records_v1";

const INITIAL_EVIDENCE_DATA: EvidenceItem[] = [
  {
    id: "evi-01",
    studentName: "Ánh Minh",
    studentSchool: "THPT Gia Định",
    title: "Cựu học sinh Gia Định đạt IELTS 6.5 Overall phục vụ xét tuyển ĐH",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
    story:
      "Mình thật sự rất vui vì đã chọn ARIS là nơi bắt đầu hành trình chinh phục IELTS. Điều mình ấn tượng nhất là phương pháp bóc tách cấu trúc câu, giúp mình không còn thói quen dịch thô từ tiếng Việt.",
    scoreBefore: "5.0",
    overallScore: "6.5",
    listeningScore: "7.0",
    readingScore: "6.5",
    writingScore: "6.0",
    speakingScore: "6.5",
    studyDuration: "14 tuần",
    courseName: "Khóa BUILDER & MASTER",
    featured: true,
    published: true,
    consentConfirmed: true,
    displayOrder: 1,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "evi-02",
    studentName: "Đinh Văn Mạnh",
    studentSchool: "ĐH Bách Khoa",
    title: "Đạt IELTS 7.0 ngay từ lần thi đầu tiên cùng phương pháp The ARIS Way",
    imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80",
    story:
      "Đạt được aim 7.0 ngay trong lần thi IELTS đầu tiên là một cột mốc rất đáng nhớ. Thầy cô tại ARIS chỉ rõ từng lỗi sai lập luận và bắt buộc mình phải tự tay viết lại bài sửa sau mỗi buổi học.",
    scoreBefore: "5.5",
    overallScore: "7.0",
    listeningScore: "7.5",
    readingScore: "7.5",
    writingScore: "6.5",
    speakingScore: "6.5",
    studyDuration: "16 tuần",
    courseName: "Khóa MASTER & LEADER",
    featured: true,
    published: true,
    consentConfirmed: true,
    displayOrder: 2,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "evi-03",
    studentName: "Trần Phúc Hòa",
    studentSchool: "ĐH Sài Gòn",
    title: "Xét tốt nghiệp đầu ra và chuẩn bị cho sự nghiệp quốc tế với IELTS 7.5",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
    story:
      "Sau khóa học tại ARIS, mình thấy bản thân tiến bộ rõ rệt nhất ở kỹ năng Writing Task 2. Lần đầu tiên mình viết được bài luận hơn 300 từ có cấu trúc mạch lạc, ít sai ngữ pháp và luận điểm sắc bén.",
    scoreBefore: "6.0",
    overallScore: "7.5",
    listeningScore: "8.0",
    readingScore: "8.0",
    writingScore: "7.0",
    speakingScore: "7.0",
    studyDuration: "18 tuần",
    courseName: "Khóa LEADER",
    featured: true,
    published: true,
    consentConfirmed: true,
    displayOrder: 3,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "evi-04",
    studentName: "Thanh Thảo",
    studentSchool: "ĐH Ngoại Ngữ",
    title: "Học kỷ luật tại ARIS: Bứt phá IELTS 8.0 để săn học bổng du học",
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
    story:
      "Quy trình chấm chữa từng câu và làm lại bài sửa trên NextBand đã tạo ra sự khác biệt hoàn toàn. Mình kiểm soát được hoàn toàn độ chính xác về ngữ nghĩa và phản xạ nói tự nhiên.",
    scoreBefore: "6.5",
    overallScore: "8.0",
    listeningScore: "8.5",
    readingScore: "8.5",
    writingScore: "7.5",
    speakingScore: "7.5",
    studyDuration: "20 tuần",
    courseName: "Khóa LEADER",
    featured: false,
    published: true,
    consentConfirmed: true,
    displayOrder: 4,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Helper to get raw items
export function getEvidenceList(): EvidenceItem[] {
  if (typeof window === "undefined") return INITIAL_EVIDENCE_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_EVIDENCE_DATA));
      return INITIAL_EVIDENCE_DATA;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EVIDENCE_DATA;
  }
}

// Helper to get published items for public website
export function getPublishedEvidence(): EvidenceItem[] {
  const all = getEvidenceList();
  return all
    .filter((item) => item.published && item.consentConfirmed)
    .sort((a, b) => a.displayOrder - b.displayOrder || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Helper to get featured items for Homepage (top 3-4)
export function getFeaturedEvidence(): EvidenceItem[] {
  const published = getPublishedEvidence();
  const featured = published.filter((item) => item.featured);
  return featured.length > 0 ? featured.slice(0, 4) : published.slice(0, 3);
}

// Save or Update an item
export function saveEvidenceItem(itemData: Partial<EvidenceItem>): EvidenceItem {
  const all = getEvidenceList();
  const now = new Date().toISOString();

  if (itemData.id) {
    const idx = all.findIndex((e) => e.id === itemData.id);
    if (idx !== -1) {
      const updated: EvidenceItem = {
        ...all[idx],
        ...itemData,
        updatedAt: now,
      } as EvidenceItem;
      // Safeguard: cannot be published without consent
      if (!updated.consentConfirmed) {
        updated.published = false;
      }
      all[idx] = updated;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return updated;
    }
  }

  const newItem: EvidenceItem = {
    id: itemData.id || `evi-${Date.now()}`,
    studentName: itemData.studentName || "Học viên ARIS",
    studentSchool: itemData.studentSchool || "",
    title: itemData.title || "Tiến bộ năng lực IELTS cùng ARIS",
    imageUrl:
      itemData.imageUrl ||
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
    story: itemData.story || "",
    scoreBefore: itemData.scoreBefore || "",
    overallScore: itemData.overallScore || "6.5",
    listeningScore: itemData.listeningScore || "",
    readingScore: itemData.readingScore || "",
    writingScore: itemData.writingScore || "",
    speakingScore: itemData.speakingScore || "",
    studyDuration: itemData.studyDuration || "12 tuần",
    courseName: itemData.courseName || "Khóa MASTER",
    featured: Boolean(itemData.featured),
    published: Boolean(itemData.published && itemData.consentConfirmed),
    consentConfirmed: Boolean(itemData.consentConfirmed),
    displayOrder: typeof itemData.displayOrder === "number" ? itemData.displayOrder : all.length + 1,
    createdAt: now,
    updatedAt: now,
  };

  all.push(newItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return newItem;
}

// Delete an item
export function deleteEvidenceItem(id: string): boolean {
  const all = getEvidenceList();
  const filtered = all.filter((e) => e.id !== id);
  if (filtered.length === all.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

// Toggle published
export function toggleEvidencePublished(id: string, published: boolean): boolean {
  const all = getEvidenceList();
  const item = all.find((e) => e.id === id);
  if (!item) return false;
  if (published && !item.consentConfirmed) {
    throw new Error("Không thể xuất bản khi chưa có xác nhận đồng ý (Consent Confirmed) từ học viên.");
  }
  item.published = published;
  item.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return true;
}

// Toggle featured
export function toggleEvidenceFeatured(id: string, featured: boolean): boolean {
  const all = getEvidenceList();
  const item = all.find((e) => e.id === id);
  if (!item) return false;
  item.featured = featured;
  item.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return true;
}
