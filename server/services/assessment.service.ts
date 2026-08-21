import { PrismaClient } from "@prisma/client";
import { canonicalScoringService } from "./scoring/CanonicalScoringService.js";
import { toFileUrl } from "../utils/file.js";

// Rate limiting in-memory trackers
const ipRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const phoneRateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Fallback in-memory session cache for resilience
const inMemoryAssessmentSessions = new Map<string, any>();

export interface AssessmentSessionDTO {
  id: string;
  examId: string;
  fullName: string;
  phone: string;
  targetBand?: string | null;
  status: "ACTIVE" | "SUBMITTED" | "EXPIRED";
  answers?: any;
  result?: any;
  startedAt: Date;
  expiresAt: Date;
  submittedAt?: Date | null;
  ipAddress?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function cleanAssessmentQuestion(q: any) {
  let selectionMode: "single" | "multiple" = "single";
  let maxSelections = 1;

  if (q.questionType === "multiple_choice") {
    if (q.correctAnswer && typeof q.correctAnswer === "string") {
      const answers = q.correctAnswer.split("|").map((s: string) => s.trim()).filter(Boolean);
      if (answers.length > 1) {
        selectionMode = "multiple";
        maxSelections = answers.length;
      }
    }
  }

  const cleaned = { ...q };
  if (q.questionType === "matching" && q.correctAnswer) {
    try {
      const config = JSON.parse(q.correctAnswer);
      delete config.pairs;
      if (!cleaned.options || typeof cleaned.options !== "object") {
        cleaned.options = { items: config.items || [], options: config.options || [] };
      }
    } catch {}
  }

  // 100% Secret stripping
  delete cleaned.correctAnswer;
  delete cleaned.correct_answer;
  delete cleaned.audioScript;
  delete cleaned.audio_script;
  delete cleaned.acceptedAnswers;
  delete cleaned.accepted_answers;
  delete cleaned.answerKey;
  delete cleaned.answer_key;

  cleaned.correctAnswer = null;
  cleaned.audioScript = null;
  cleaned.selectionMode = selectionMode;
  cleaned.maxSelections = maxSelections;
  cleaned.isMultiChoice = selectionMode === "multiple";

  return cleaned;
}

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

export class AssessmentService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Rate limiting enforcement
   */
  private checkRateLimits(ip: string, phone: string) {
    const now = Date.now();

    // 1. IP Rate limit: max 10 requests per 1 minute
    if (ip) {
      const ipRecord = ipRateLimitMap.get(ip);
      if (ipRecord && ipRecord.resetAt > now) {
        if (ipRecord.count >= 10) {
          const err = new Error("Quá nhiều yêu cầu từ địa chỉ IP này. Vui lòng thử lại sau 1 phút.");
          (err as any).statusCode = 429;
          throw err;
        }
        ipRecord.count++;
      } else {
        ipRateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
      }
    }

    // 2. Phone Rate limit: max 5 active assessment sessions per 10 minutes
    if (phone) {
      const phoneRecord = phoneRateLimitMap.get(phone);
      if (phoneRecord && phoneRecord.resetAt > now) {
        if (phoneRecord.count >= 5) {
          const err = new Error("Số điện thoại này đã tạo quá nhiều lượt khảo thí trong thời gian ngắn. Vui lòng kiểm tra lại hoặc liên hệ Hotline 0933.319.693.");
          (err as any).statusCode = 429;
          throw err;
        }
        phoneRecord.count++;
      } else {
        phoneRateLimitMap.set(phone, { count: 1, resetAt: now + 600000 });
      }
    }
  }

  /**
   * Resolve appropriate exam for Placement Assessment
   */
  public async resolveAssessmentExam(assessmentCode?: string, examId?: string) {
    if (examId) {
      const exam = await this.prisma.exam.findUnique({
        where: { id: examId },
      });
      if (exam && exam.isPublished && exam.isActive) {
        return exam;
      }
    }

    // Dynamic resolution: Find default placement test in database
    const dynamicExam = await this.prisma.exam.findFirst({
      where: {
        OR: [
          { allowGuestAssessment: true },
          { title: { contains: "ENTRANCE", mode: "insensitive" } },
          { title: { contains: "PLACEMENT", mode: "insensitive" } },
          { isOpen: true },
        ],
        isPublished: true,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (dynamicExam) {
      return dynamicExam;
    }

    // Fallback: any published active exam
    const fallbackExam = await this.prisma.exam.findFirst({
      where: { isPublished: true, isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!fallbackExam) {
      const err = new Error("Hệ thống phòng thi khảo thí đang bảo trì cập nhật bộ đề. Vui lòng quay lại sau.");
      (err as any).statusCode = 503;
      throw err;
    }

    return fallbackExam;
  }

  /**
   * Create an Assessment Session
   */
  public async createAssessmentSession(params: {
    fullName: string;
    phone: string;
    targetBand?: string;
    assessmentCode?: string;
    examId?: string;
    ipAddress?: string;
  }): Promise<{ session: AssessmentSessionDTO; exam: any }> {
    const cleanName = params.fullName?.trim();
    const cleanPhone = params.phone?.trim().replace(/\s+/g, "");

    if (!cleanName || cleanName.length < 2) {
      const err = new Error("Họ và tên thí sinh phải có ít nhất 2 ký tự");
      (err as any).statusCode = 400;
      throw err;
    }

    if (!cleanPhone || cleanPhone.length < 9) {
      const err = new Error("Số điện thoại không hợp lệ (tối thiểu 9 số)");
      (err as any).statusCode = 400;
      throw err;
    }

    this.checkRateLimits(params.ipAddress || "", cleanPhone);

    const exam = await this.resolveAssessmentExam(params.assessmentCode, params.examId);
    const durationMinutes = Math.max(15, exam.durationMinutes || 45);
    const now = new Date();
    // Expiration: Duration + 20 minutes buffer
    const expiresAt = new Date(now.getTime() + (durationMinutes + 20) * 60 * 1000);
    const sessionId = crypto.randomUUID();

    const sessionData: AssessmentSessionDTO = {
      id: sessionId,
      examId: exam.id,
      fullName: cleanName,
      phone: cleanPhone,
      targetBand: params.targetBand || "Chưa xác định",
      status: "ACTIVE",
      answers: {},
      result: null,
      startedAt: now,
      expiresAt,
      submittedAt: null,
      ipAddress: params.ipAddress || null,
      createdAt: now,
      updatedAt: now,
    };

    // Store in PostgreSQL if Prisma assessmentSession model is available
    try {
      if ((this.prisma as any).assessmentSession) {
        await (this.prisma as any).assessmentSession.create({
          data: {
            id: sessionData.id,
            examId: sessionData.examId,
            fullName: sessionData.fullName,
            phone: sessionData.phone,
            targetBand: sessionData.targetBand,
            status: sessionData.status,
            answers: sessionData.answers,
            startedAt: sessionData.startedAt,
            expiresAt: sessionData.expiresAt,
            ipAddress: sessionData.ipAddress,
          },
        });
      }
    } catch (dbErr) {
      console.warn("[AssessmentService] DB Session store notice:", dbErr);
    }

    // Always keep in-memory cache for fast lookups & resilience
    inMemoryAssessmentSessions.set(sessionId, sessionData);

    // Save lead to ContactLead table for Admissions Team
    try {
      const goalText = `Thi thử 4 kỹ năng Online | Đề: ${exam.title} | Mục tiêu: ${sessionData.targetBand}`;
      await this.prisma.contactLead.create({
        data: {
          fullName: cleanName,
          phone: cleanPhone,
          goal: goalText,
          source: "assessment_bubble_entrance_test",
          notes: `Session ID: ${sessionId} | Exam ID: ${exam.id}`,
        },
      });
    } catch (leadErr) {
      console.warn("[AssessmentService] Contact lead recording notice:", leadErr);
    }

    return { session: sessionData, exam };
  }

  /**
   * Find an existing Assessment Session by ID
   */
  public async getSessionById(sessionId: string): Promise<AssessmentSessionDTO | null> {
    if (!sessionId) return null;

    // 1. Check in-memory cache
    const mem = inMemoryAssessmentSessions.get(sessionId);
    if (mem) return mem;

    // 2. Check DB
    try {
      if ((this.prisma as any).assessmentSession) {
        const dbSession = await (this.prisma as any).assessmentSession.findUnique({
          where: { id: sessionId },
        });
        if (dbSession) {
          inMemoryAssessmentSessions.set(sessionId, dbSession);
          return dbSession;
        }
      }
    } catch (err) {
      console.warn("[AssessmentService] DB fetch session notice:", err);
    }

    return null;
  }

  /**
   * Load clean exam for guest assessment session
   */
  public async getExamForSession(sessionId: string, examId: string) {
    const session = await this.getSessionById(sessionId);
    if (!session) {
      const err = new Error("Phiên khảo thí không tồn tại hoặc đã hết hạn");
      (err as any).statusCode = 404;
      throw err;
    }

    // Security Check: Session is locked to exact examId
    if (session.examId !== examId) {
      const err = new Error("Từ chối truy cập: Phiên khảo thí này không thuộc về bài thi yêu cầu");
      (err as any).statusCode = 403;
      throw err;
    }

    // Check expiration
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      session.status = "EXPIRED";
      const err = new Error("Phiên khảo thí của bạn đã hết thời gian làm bài");
      (err as any).statusCode = 403;
      throw err;
    }

    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        course: { select: { id: true, title: true } },
        sections: {
          orderBy: { orderIndex: "asc" },
          include: {
            questionGroups: {
              orderBy: { orderIndex: "asc" },
              include: {
                questions: { orderBy: { orderIndex: "asc" } },
              },
            },
          },
        },
      },
    });

    if (!exam || !exam.isPublished || !exam.isActive) {
      const err = new Error("Bài thi không khả dụng hoặc đã bị ẩn");
      (err as any).statusCode = 404;
      throw err;
    }

    // Sanitize 100% of secret fields
    const formattedSections = exam.sections.map((section) => ({
      ...section,
      audioUrl: toFileUrl(section.audioUrl),
      audioScript: undefined,
      questionGroups: section.questionGroups.map((group) => ({
        ...group,
        audioUrl: toFileUrl(group.audioUrl),
        questions: group.questions.map((q) => {
          const formatted = {
            ...q,
            audioUrl: toFileUrl(q.audioUrl),
          };
          return cleanAssessmentQuestion(formatted);
        }),
      })),
    }));

    const remainingSeconds = Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000));

    return {
      ...exam,
      sections: formattedSections,
      sessionRemainingSeconds: remainingSeconds,
      candidate: {
        fullName: session.fullName,
        phone: session.phone,
        targetBand: session.targetBand,
      },
    };
  }

  /**
   * Autosave answers for active assessment session
   */
  public async autosaveAnswers(sessionId: string, answers: any) {
    const session = await this.getSessionById(sessionId);
    if (!session) {
      const err = new Error("Phiên khảo thí không tồn tại");
      (err as any).statusCode = 404;
      throw err;
    }

    if (session.status === "SUBMITTED") {
      const err = new Error("Bài khảo thí đã được nộp. Không thể lưu thêm thay đổi.");
      (err as any).statusCode = 409;
      throw err;
    }

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      session.status = "EXPIRED";
      const err = new Error("Phiên làm bài đã hết hạn");
      (err as any).statusCode = 403;
      throw err;
    }

    session.answers = answers || {};
    session.updatedAt = new Date();
    inMemoryAssessmentSessions.set(sessionId, session);

    try {
      if ((this.prisma as any).assessmentSession) {
        await (this.prisma as any).assessmentSession.update({
          where: { id: sessionId },
          data: {
            answers: session.answers,
            updatedAt: session.updatedAt,
          },
        });
      }
    } catch (dbErr) {
      console.warn("[AssessmentService] DB Autosave notice:", dbErr);
    }

    return { success: true, savedAt: session.updatedAt.toISOString() };
  }

  /**
   * Submit and Grade Assessment Exam
   */
  public async submitAssessment(sessionId: string, answersPayload: any) {
    const session = await this.getSessionById(sessionId);
    if (!session) {
      const err = new Error("Phiên khảo thí không tồn tại");
      (err as any).statusCode = 404;
      throw err;
    }

    // Negative Case 5: Reject double-submission
    if (session.status === "SUBMITTED") {
      const err = new Error("Bài khảo thí này đã được nộp trước đó");
      (err as any).statusCode = 409;
      throw err;
    }

    // Negative Case 6: Reject submission after expiration
    if (new Date(session.expiresAt).getTime() < Date.now() - 60000) { // 1 min grace
      session.status = "EXPIRED";
      const err = new Error("Phiên làm bài đã hết hạn. Không thể nộp bài.");
      (err as any).statusCode = 403;
      throw err;
    }

    // Load full exam with answer keys for canonical grading
    const examWithKeys = await this.prisma.exam.findUnique({
      where: { id: session.examId },
      include: {
        sections: {
          orderBy: { orderIndex: "asc" },
          include: {
            questionGroups: {
              orderBy: { orderIndex: "asc" },
              include: {
                questions: { orderBy: { orderIndex: "asc" } },
              },
            },
          },
        },
      },
    });

    if (!examWithKeys) {
      const err = new Error("Không tìm thấy thông tin đề thi để chấm điểm");
      (err as any).statusCode = 404;
      throw err;
    }

    // Format student answers array
    let answerEntries: Array<{ questionId: string; answerText?: any; audioUrl?: string | null }> = [];
    if (Array.isArray(answersPayload)) {
      answerEntries = answersPayload;
    } else if (answersPayload && typeof answersPayload === "object") {
      answerEntries = Object.entries(answersPayload).map(([questionId, val]) => ({
        questionId,
        answerText: typeof val === "string" ? val : JSON.stringify(val),
        audioUrl: typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://") || val.startsWith("/uploads/")) ? val : undefined,
      }));
    }

    // Evaluate canonical scores
    const gradingSummary = canonicalScoringService.evaluateExamAttempt(examWithKeys, answerEntries);
    const correctCount = gradingSummary.correctAnswers || 0;
    const totalCount = Math.max(1, gradingSummary.totalQuestions || 40);
    const accuracy = Math.round((correctCount / totalCount) * 100);

    // Calculate official Band score
    const normalized40Equivalent = (correctCount / totalCount) * 40;
    let bandScore = 3.0;
    if (normalized40Equivalent >= 39) bandScore = 9.0;
    else if (normalized40Equivalent >= 37) bandScore = 8.5;
    else if (normalized40Equivalent >= 35) bandScore = 8.0;
    else if (normalized40Equivalent >= 32) bandScore = 7.5;
    else if (normalized40Equivalent >= 30) bandScore = 7.0;
    else if (normalized40Equivalent >= 26) bandScore = 6.5;
    else if (normalized40Equivalent >= 23) bandScore = 6.0;
    else if (normalized40Equivalent >= 18) bandScore = 5.5;
    else if (normalized40Equivalent >= 15) bandScore = 5.0;
    else if (normalized40Equivalent >= 12) bandScore = 4.5;
    else if (normalized40Equivalent >= 9) bandScore = 4.0;
    else if (normalized40Equivalent >= 6) bandScore = 3.5;
    else bandScore = 3.0;

    const rankInfo = mapBandToArisRank(bandScore);

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    if (accuracy >= 75) {
      strengths.push("Nắm vững kỹ năng định vị thông tin (Scanning & Skimming) trong đoạn văn học thuật.");
      strengths.push("Nhận diện chính xác từ đồng nghĩa (Paraphrasing) giữa câu hỏi và bài đọc/nghe.");
      strengths.push("Tốc độ xử lý câu hỏi nhanh, phản xạ ngữ pháp và từ vựng tự nhiên.");
    } else if (accuracy >= 50) {
      strengths.push("Làm tốt các câu hỏi tìm chi tiết cụ thể ở mức độ thông tin trực tiếp.");
      strengths.push("Có vốn từ vựng cơ bản vững vàng, hiểu được ý chính của từng đoạn văn/hội thoại.");
      weaknesses.push("Còn lúng túng khi gặp các câu hỏi suy luận logic (Inference / True-False-Not Given).");
      weaknesses.push("Tốc độ đọc/nghe còn chậm ở các đoạn có cấu trúc câu phức và nhiều thuật ngữ.");
    } else {
      strengths.push("Có tinh thần rèn luyện tốt, kiên trì hoàn thành bài khảo thí.");
      weaknesses.push("Vốn từ vựng học thuật còn hạn chế, gặp khó khăn khi bài đổi từ đồng nghĩa.");
      weaknesses.push("Chưa làm chủ ngữ pháp câu phức, dễ bị bẫy ở các câu hỏi phủ định và quan hệ logic.");
      weaknesses.push("Cần củng cố lại phương pháp xây nền từ gốc trước khi luyện giải đề Cambridge nâng cao.");
    }

    const reportData = {
      id: sessionId,
      candidateName: session.fullName,
      phone: session.phone,
      examTitle: examWithKeys.title,
      sectionType: "IELTS 4 Kỹ Năng & Ngữ Pháp (Chuẩn Cambridge)",
      rawScore: correctCount,
      totalQuestions: totalCount,
      accuracyPercent: accuracy,
      ieltsBandScore: bandScore,
      rankCode: rankInfo.rankCode,
      rankTitle: rankInfo.rankTitle,
      bandRange: rankInfo.bandRange,
      strengths,
      weaknesses,
      recommendedCourse: rankInfo.recommendedCourse,
      submittedAt: new Date().toISOString(),
    };

    session.status = "SUBMITTED";
    session.submittedAt = new Date();
    session.result = reportData;
    session.answers = answersPayload;
    inMemoryAssessmentSessions.set(sessionId, session);

    try {
      if ((this.prisma as any).assessmentSession) {
        await (this.prisma as any).assessmentSession.update({
          where: { id: sessionId },
          data: {
            status: "SUBMITTED",
            submittedAt: session.submittedAt,
            result: reportData,
            answers: answersPayload,
          },
        });
      }
    } catch (dbErr) {
      console.warn("[AssessmentService] DB Submit notice:", dbErr);
    }

    // Update Contact Lead if exists
    try {
      await this.prisma.contactLead.updateMany({
        where: { notes: { contains: sessionId } },
        data: {
          notes: `Session ID: ${sessionId} | Band: ${bandScore} | Rank: ${rankInfo.rankTitle}`,
        },
      });
    } catch (leadUpdateErr) {
      console.warn("[AssessmentService] Contact lead status update notice:", leadUpdateErr);
    }

    return reportData;
  }
}
