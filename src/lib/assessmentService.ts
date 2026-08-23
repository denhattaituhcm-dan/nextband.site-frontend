import { supabase } from "./supabase";
import { IeltsBandCalculator, IeltsSectionType } from "./ieltsBandCalculator";
import { submitContactLead } from "./contactService";

export interface AssessmentLead {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  currentLevel: string;
  targetBand: string;
  testFormat: "online" | "offline";
  preferredDate?: string;
  status: "new" | "confirmed" | "completed" | "archived";
  createdAt: string;
}

export interface AssessmentResultDetail {
  id: string;
  candidateName?: string;
  phone?: string;
  examTitle: string;
  sectionType: string;
  rawScore: number;
  totalQuestions: number;
  accuracyPercent: number;
  ieltsBandScore: number;
  rankCode: number; // 3 to 7
  rankTitle: string;
  bandRange: string;
  questionTypeStats?: Array<{
    type: string;
    label: string;
    correct: number;
    total: number;
    percent: number;
  }>;
  strengths: string[];
  weaknesses: string[];
  recommendedCourse: {
    slug: string;
    title: string;
    targetBand: string;
    level: string;
    summary: string;
  };
  submittedAt: string;
}

const LOCAL_ASSESSMENT_LEADS_KEY = "aris_assessment_leads_v1";
const LOCAL_ASSESSMENT_RESULTS_KEY = "aris_assessment_results_v1";

export function getLocalAssessmentLeads(): AssessmentLead[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_ASSESSMENT_LEADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalAssessmentLead(lead: AssessmentLead) {
  if (typeof window === "undefined") return;
  try {
    const leads = getLocalAssessmentLeads();
    leads.unshift(lead);
    localStorage.setItem(LOCAL_ASSESSMENT_LEADS_KEY, JSON.stringify(leads));
  } catch (err) {
    console.error("Failed to save local assessment lead", err);
  }
}

export function getLocalAssessmentResult(id: string): AssessmentResultDetail | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${LOCAL_ASSESSMENT_RESULTS_KEY}_${id}`);
    if (raw) return JSON.parse(raw);
    const allRaw = localStorage.getItem(LOCAL_ASSESSMENT_RESULTS_KEY);
    if (allRaw) {
      const all: Record<string, AssessmentResultDetail> = JSON.parse(allRaw);
      return all[id] || null;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveLocalAssessmentResult(result: AssessmentResultDetail) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${LOCAL_ASSESSMENT_RESULTS_KEY}_${result.id}`, JSON.stringify(result));
    const allRaw = localStorage.getItem(LOCAL_ASSESSMENT_RESULTS_KEY);
    const all: Record<string, AssessmentResultDetail> = allRaw ? JSON.parse(allRaw) : {};
    all[result.id] = result;
    localStorage.setItem(LOCAL_ASSESSMENT_RESULTS_KEY, JSON.stringify(all));
  } catch (err) {
    console.error("Failed to save local assessment result", err);
  }
}

/**
 * Mapping IELTS Band Score to ARIS-7 Framework Rank & Recommended Course
 */
export function mapBandToArisRank(band: number) {
  if (band < 3.5) {
    return {
      rankCode: 3,
      rankTitle: "Rank 3 — Khởi Nền (Starter)",
      bandRange: "Band 2.5 – 3.5",
      recommendedCourse: {
        slug: "starter",
        title: "Khóa STARTER (Xây Nền Phát Âm & Câu Đơn)",
        targetBand: "Mục tiêu: Đạt chuẩn 3.5+",
        level: "Beginner",
        summary: "Dành cho người mất gốc hoặc bắt đầu lại từ đầu. Huấn luyện 44 âm IPA chuẩn xác, làm chủ cấu trúc câu đơn và 800 từ vựng cốt lõi.",
      },
    };
  }
  if (band <= 4.5) {
    return {
      rankCode: 4,
      rankTitle: "Rank 4 — Tập Sự (Dreamer)",
      bandRange: "Band 4.0 – 4.5",
      recommendedCourse: {
        slug: "dreamer",
        title: "Khóa DREAMER (Mở Rộng Từ Vựng & Phản Xạ Nghe)",
        targetBand: "Mục tiêu: Đạt chuẩn 4.5 – 5.0",
        level: "Elementary",
        summary: "Làm chủ cấu trúc câu ghép, mệnh đề quan hệ và ngữ pháp thông dụng. Xây dựng phản xạ nghe hiểu các đoạn hội thoại thực tế.",
      },
    };
  }
  if (band <= 5.5) {
    return {
      rankCode: 5,
      rankTitle: "Rank 5 — Học Sĩ (Builder)",
      bandRange: "Band 5.0 – 5.5",
      recommendedCourse: {
        slug: "builder",
        title: "Khóa BUILDER (Làm Chủ Câu Phức & Ngữ Pháp Học Thuật)",
        targetBand: "Mục tiêu: Đạt chuẩn 5.5 – 6.0",
        level: "Intermediate",
        summary: "Huấn luyện chuyên sâu về cấu trúc câu phức nhiều mệnh đề, các thì hoàn thành và kỹ thuật xử lý bài đọc Cambridge học thuật.",
      },
    };
  }
  if (band <= 6.5) {
    return {
      rankCode: 6,
      rankTitle: "Rank 6 — Học Sư (Master)",
      bandRange: "Band 6.0 – 6.5",
      recommendedCourse: {
        slug: "master",
        title: "Khóa MASTER (Bứt Phá Writing Task 2 & Speaking)",
        targetBand: "Mục tiêu: Đạt chuẩn 6.5 – 7.0",
        level: "Upper-Intermediate",
        summary: "Rèn luyện tư duy lập luận phản biện theo phương pháp The ARIS Way. Bóc tách và hoàn thiện kỹ năng viết luận Task 2 và nói Part 2-3.",
      },
    };
  }
  return {
    rankCode: 7,
    rankTitle: "Rank 7 — Học Giả (Leader)",
    bandRange: "Band 7.0 – 8.0+",
    recommendedCourse: {
      slug: "leader",
      title: "Khóa LEADER (Tối Ưu Điểm Số & Độ Nhạy Học Thuật)",
      targetBand: "Mục tiêu: Bứt phá 7.5 – 8.0+",
      level: "Advanced",
      summary: "Huấn luyện cùng Giảng viên 8.5+. Tinh chỉnh độ tự nhiên của ngôn ngữ, collocations cao cấp và chiến thuật phòng thi đỉnh cao.",
    },
  };
}

/**
 * Generate Comprehensive Assessment Diagnostic Report from Submission Data
 */
export function buildAssessmentReportFromSubmission(submission: any): AssessmentResultDetail {
  const exam = submission?.exam || {};
  const answers = submission?.answers || [];
  const correctCount = submission?.correctAnswers ?? 0;
  const totalCount = submission?.totalQuestions ?? Math.max(1, answers.length);
  const accuracy = Math.round((correctCount / Math.max(1, totalCount)) * 100);

  // Determine section type for official band calculation
  const hasListening = (exam.sections || []).some((s: any) => s.sectionType === "listening") ||
    (exam.title || "").toLowerCase().includes("listening");
  const hasReading = (exam.sections || []).some((s: any) => s.sectionType === "reading") ||
    (exam.title || "").toLowerCase().includes("reading");
  const isMultiSkill = hasListening && hasReading;

  const sectionType: IeltsSectionType = hasReading ? "reading_academic" : "listening";

  // Official Band Score (scale to 40 equivalent if needed)
  const normalized40Equivalent = totalCount > 0 ? (correctCount / totalCount) * 40 : 0;
  const ieltsBandScore = IeltsBandCalculator.calculateBandScore(normalized40Equivalent, sectionType);
  const rankInfo = mapBandToArisRank(ieltsBandScore);

  // Strengths & Weaknesses based on performance
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (correctCount === 0) {
    strengths.push("Chưa đủ dữ liệu để xác nhận điểm mạnh (thí sinh chưa hoàn thành câu trả lời).");
    weaknesses.push("Chưa có đủ dữ liệu câu trả lời để bóc tách điểm nghẽn chi tiết.");
  } else if (accuracy >= 75) {
    strengths.push("Nắm vững kỹ năng định vị thông tin (Scanning & Skimming) trong đoạn văn học thuật.");
    strengths.push("Nhận diện chính xác từ đồng nghĩa (Paraphrasing) giữa câu hỏi và bài đọc/nghe.");
    strengths.push("Tốc độ xử lý câu hỏi nhanh, phản xạ ngữ pháp và từ vựng tự nhiên.");
  } else if (accuracy >= 50) {
    strengths.push("Làm tốt các câu hỏi tìm chi tiết cụ thể ở mức độ thông tin trực tiếp.");
    strengths.push("Có vốn từ vựng cơ bản vững vàng, hiểu được ý chính của từng đoạn văn/hội thoại.");
    weaknesses.push("Còn lúng túng khi gặp các câu hỏi suy luận logic (Inference / True-False-Not Given).");
    weaknesses.push("Tốc độ đọc/nghe còn chậm ở các đoạn có cấu trúc câu phức và nhiều thuật ngữ.");
  } else {
    strengths.push("Đã hoàn thành một phần bài khảo thí chẩn đoán.");
    weaknesses.push("Vốn từ vựng học thuật còn hạn chế, gặp khó khăn khi bài đổi từ đồng nghĩa.");
    weaknesses.push("Chưa làm chủ ngữ pháp câu phức, dễ bị bẫy ở các câu hỏi phủ định và quan hệ logic.");
    weaknesses.push("Cần củng cố lại phương pháp xây nền từ gốc trước khi luyện giải đề Cambridge nâng cao.");
  }

  const displaySectionTitle = isMultiSkill
    ? "Kiểm Tra Trình Độ 4 Kỹ Năng & Ngữ Pháp"
    : hasReading
      ? "IELTS Reading Academic"
      : "IELTS Cambridge Listening";

  const report: AssessmentResultDetail = {
    id: submission?.id || `assess-${Date.now()}`,
    candidateName: submission?.student?.fullName || "Học viên",
    examTitle: exam.title || "Bài Khảo Thí Năng Lực IELTS Chuẩn Hóa",
    sectionType: displaySectionTitle,
    rawScore: correctCount,
    totalQuestions: totalCount,
    accuracyPercent: accuracy,
    ieltsBandScore,
    rankCode: rankInfo.rankCode,
    rankTitle: rankInfo.rankTitle,
    bandRange: rankInfo.bandRange,
    strengths,
    weaknesses,
    recommendedCourse: rankInfo.recommendedCourse,
    submittedAt: submission?.submittedAt || submission?.createdAt || new Date().toISOString(),
  };

  saveLocalAssessmentResult(report);
  return report;
}

/**
 * Submit an assessment booking form (Offline or 1:1 Consultation)
 */
export async function submitAssessmentBooking(params: {
  fullName: string;
  phone: string;
  email?: string;
  currentLevel: string;
  targetBand: string;
  testFormat?: "online" | "offline";
  preferredDate?: string;
}): Promise<{ success: boolean; lead: AssessmentLead; message?: string }> {
  const now = new Date().toISOString();
  const cleanName = params.fullName.trim();
  const cleanPhone = params.phone.trim().replace(/\s+/g, "");
  const cleanEmail = params.email?.trim() || "";

  const lead: AssessmentLead = {
    id: `assess-${Date.now()}`,
    fullName: cleanName,
    phone: cleanPhone,
    email: cleanEmail,
    currentLevel: params.currentLevel || "Mới bắt đầu",
    targetBand: params.targetBand || "IELTS 6.5",
    testFormat: params.testFormat || "online",
    preferredDate: params.preferredDate || "",
    status: "new",
    createdAt: now,
  };

  saveLocalAssessmentLead(lead);

  try {
    const formattedGoal = `[Khảo Thí] Trình độ: ${lead.currentLevel} -> Mục tiêu: ${lead.targetBand} (${lead.testFormat === "online" ? "Online LMS" : "Trực tiếp tại cơ sở"})${lead.preferredDate ? ` | Ngày hẹn: ${lead.preferredDate}` : ""}`;

    const contactRes = await submitContactLead({
      leadType: "ASSESSMENT",
      fullName: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      goal: formattedGoal,
      message: formattedGoal,
      source: "assessment_page",
      metadata: {
        currentLevel: lead.currentLevel,
        targetBand: lead.targetBand,
        testFormat: lead.testFormat,
        preferredDate: lead.preferredDate,
      },
    });

    if (contactRes?.lead?.id) {
      lead.id = contactRes.lead.id;
    }
  } catch (err: any) {
    console.warn("[AssessmentService] Sync notice:", err?.message || err);
  }

  return {
    success: true,
    lead,
    message: "Đăng ký thành công! Ban Chuyên Môn ARIS sẽ liên hệ xác nhận lịch làm bài và cấp tài khoản khảo thí cho bạn.",
  };
}
