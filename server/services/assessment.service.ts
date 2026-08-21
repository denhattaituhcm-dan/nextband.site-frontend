import { PrismaClient } from "@prisma/client";
import { canonicalPlacementTestPayload, SanitizedPlacementTestPayload } from "../data/placement-test/questions.js";
import { authoritativePlacementAnswerKeys, AuthoritativeAnswerKey } from "../data/placement-test/answerKeys.js";

// Rate limiting in-memory trackers
const ipRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const phoneRateLimitMap = new Map<string, { count: number; resetAt: number }>();

// In-memory session cache for speed & resilience
const inMemoryAssessmentSessions = new Map<string, AssessmentSessionRecord>();

export interface AssessmentSessionRecord {
  id: string;
  candidateName: string;
  phone: string;
  targetBand: string;
  status: "ACTIVE" | "SUBMITTED" | "EXPIRED";
  answers: Record<string, any>;
  objectiveScore?: {
    rawCorrect: number;
    totalQuestions: number;
    accuracyPercent: number;
    listeningCorrect: number;
    listeningTotal: number;
    readingCorrect: number;
    readingTotal: number;
    grammarCorrect: number;
    grammarTotal: number;
  } | null;
  subjectiveStatus: "NONE" | "PENDING_REVIEW" | "REVIEWED";
  result?: DiagnosticReport | null;
  startedAt: Date;
  expiresAt: Date;
  submittedAt?: Date | null;
  ipAddress?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiagnosticReport {
  sessionId: string;
  candidateName: string;
  phone: string;
  targetBand: string;
  arisLevel: {
    levelNumber: number;
    levelTitle: string;
    estimatedIeltsRange: string;
    description: string;
    recommendedCourse: {
      slug: string;
      title: string;
      targetBand: string;
      level: string;
      summary: string;
    };
  };
  objectiveBreakdown: {
    rawScore: number;
    totalQuestions: number;
    accuracyPercent: number;
    listening: { correct: number; total: number; scorePercent: number; feedback: string };
    reading: { correct: number; total: number; scorePercent: number; feedback: string };
    grammar: { correct: number; total: number; scorePercent: number; feedback: string };
  };
  subjectiveEvaluation: {
    status: "NONE" | "PENDING_REVIEW" | "REVIEWED";
    hasWritingSubmission: boolean;
    hasSpeakingRecording: boolean;
    note: string;
  };
  strengths: string[];
  weaknesses: string[];
  submittedAt: string;
}

export function mapRawScoreToArisLevel(correctCount: number, totalQuestions: number = 35) {
  const percentage = Math.round((correctCount / Math.max(1, totalQuestions)) * 100);

  if (percentage < 25) {
    return {
      levelNumber: 1,
      levelTitle: "Cấp 1 — Khởi Nền (Starter)",
      estimatedIeltsRange: "Band 2.5 – 3.5",
      description: "Thí sinh có vốn từ vựng ban đầu, cần củng cố lại phương pháp xây nền ngữ âm IPA và cấu trúc câu đơn hoàn chỉnh trước khi luyện đề.",
      recommendedCourse: {
        slug: "starter",
        title: "Khóa STARTER (Xây Nền 44 Âm IPA & Câu Đơn)",
        targetBand: "Mục tiêu: Bứt phá chuẩn 3.5+",
        level: "Beginner",
        summary: "Huấn luyện chuẩn xác 44 âm IPA, làm chủ cấu trúc câu đơn và 800 từ vựng cốt lõi theo phương pháp The ARIS Way.",
      },
    };
  }
  if (percentage < 45) {
    return {
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
    };
  }
  if (percentage < 65) {
    return {
      levelNumber: 3,
      levelTitle: "Cấp 3 — Học Sĩ (Builder)",
      estimatedIeltsRange: "Band 5.0 – 5.5",
      description: "Nền tảng từ vựng và ngữ pháp khá vững. Cần chuyên sâu rèn luyện câu phức nhiều mệnh đề, các dạng bài suy luận logic IELTS và collocations học thuật.",
      recommendedCourse: {
        slug: "builder",
        title: "Khóa BUILDER (Làm Chủ Câu Phức & Đọc Hiểu Học Thuật)",
        targetBand: "Mục tiêu: Đạt chuẩn 5.5 – 6.0",
        level: "Intermediate",
        summary: "Huấn luyện kỹ thuật Scanning, Skimming chuyên sâu và bóc tách các bài đọc học thuật Cambridge nâng cao.",
      },
    };
  }
  if (percentage < 82) {
    return {
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
    };
  }
  if (percentage < 92) {
    return {
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
    };
  }
  return {
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
  };
}

export class AssessmentService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Rate limiting check
   */
  private checkRateLimits(ip: string, phone: string) {
    const now = Date.now();

    if (ip) {
      const ipRec = ipRateLimitMap.get(ip);
      if (ipRec && ipRec.resetAt > now) {
        if (ipRec.count >= 15) {
          const err = new Error("Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau 1 phút.");
          (err as any).statusCode = 429;
          throw err;
        }
        ipRec.count++;
      } else {
        ipRateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
      }
    }

    if (phone) {
      const phoneRec = phoneRateLimitMap.get(phone);
      if (phoneRec && phoneRec.resetAt > now) {
        if (phoneRec.count >= 5) {
          const err = new Error("Số điện thoại này đã tạo quá nhiều lượt khảo thí. Vui lòng thử lại sau 10 phút.");
          (err as any).statusCode = 429;
          throw err;
        }
        phoneRec.count++;
      } else {
        phoneRateLimitMap.set(phone, { count: 1, resetAt: now + 600000 });
      }
    }
  }

  /**
   * 1. Create a dedicated Assessment Session
   */
  public async createAssessmentSession(params: {
    fullName: string;
    phone: string;
    targetBand?: string;
    ipAddress?: string;
  }): Promise<AssessmentSessionRecord> {
    const cleanName = params.fullName?.trim();
    const cleanPhone = params.phone?.trim().replace(/\s+/g, "");

    if (!cleanName || cleanName.length < 2) {
      const err = new Error("Họ và tên thí sinh phải có ít nhất 2 ký tự");
      (err as any).statusCode = 400;
      throw err;
    }

    const digitsOnly = cleanPhone.replace(/\D/g, "");
    if (!digitsOnly || digitsOnly.length < 9) {
      const err = new Error("Số điện thoại không hợp lệ (tối thiểu 9 chữ số)");
      (err as any).statusCode = 400;
      throw err;
    }

    this.checkRateLimits(params.ipAddress || "", cleanPhone);

    const now = new Date();
    // 45 minutes duration + 15 minutes buffer
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
    const sessionId = crypto.randomUUID();

    const session: AssessmentSessionRecord = {
      id: sessionId,
      candidateName: cleanName,
      phone: cleanPhone,
      targetBand: params.targetBand || "Chưa xác định",
      status: "ACTIVE",
      answers: {},
      objectiveScore: null,
      subjectiveStatus: "NONE",
      result: null,
      startedAt: now,
      expiresAt,
      submittedAt: null,
      ipAddress: params.ipAddress || null,
      createdAt: now,
      updatedAt: now,
    };

    // Store in PostgreSQL AssessmentSession if table exists
    try {
      if ((this.prisma as any).assessmentSession) {
        await (this.prisma as any).assessmentSession.create({
          data: {
            id: session.id,
            fullName: session.candidateName,
            phone: session.phone,
            targetBand: session.targetBand,
            status: session.status,
            answers: session.answers,
            startedAt: session.startedAt,
            expiresAt: session.expiresAt,
            ipAddress: session.ipAddress,
          },
        });
      }
    } catch (dbErr) {
      console.warn("[AssessmentService] DB Session create notice:", dbErr);
    }

    // Fast-lookup memory store
    inMemoryAssessmentSessions.set(sessionId, session);

    // Record Lead to CRM for Admissions Team
    try {
      await this.prisma.contactLead.create({
        data: {
          fullName: cleanName,
          phone: cleanPhone,
          goal: `Khảo thí chẩn đoán ARIS | Mục tiêu: ${session.targetBand}`,
          source: "aris_diagnostic_test",
          notes: `Session: ${sessionId}`,
        },
      });
    } catch (leadErr) {
      console.warn("[AssessmentService] Lead create notice:", leadErr);
    }

    return session;
  }

  /**
   * 2. Find existing session by ID
   */
  public async getSessionById(sessionId: string): Promise<AssessmentSessionRecord | null> {
    if (!sessionId) return null;

    const mem = inMemoryAssessmentSessions.get(sessionId);
    if (mem) return mem;

    try {
      if ((this.prisma as any).assessmentSession) {
        const db = await (this.prisma as any).assessmentSession.findUnique({
          where: { id: sessionId },
        });
        if (db) {
          const rec: AssessmentSessionRecord = {
            id: db.id,
            candidateName: db.fullName || db.candidateName,
            phone: db.phone,
            targetBand: db.targetBand || "Chưa xác định",
            status: db.status,
            answers: db.answers || {},
            objectiveScore: (db.result as any)?.objectiveBreakdown || null,
            subjectiveStatus: (db.result as any)?.subjectiveEvaluation?.status || "NONE",
            result: db.result as any,
            startedAt: db.startedAt || db.createdAt,
            expiresAt: db.expiresAt,
            submittedAt: db.submittedAt,
            ipAddress: db.ipAddress,
            createdAt: db.createdAt,
            updatedAt: db.updatedAt,
          };
          inMemoryAssessmentSessions.set(sessionId, rec);
          return rec;
        }
      }
    } catch (err) {
      console.warn("[AssessmentService] Fetch session error:", err);
    }

    return null;
  }

  /**
   * 3. Get Sanitized Test Payload (ZERO answer keys in client response)
   */
  public async getTestPayloadForSession(sessionId: string): Promise<{
    session: {
      id: string;
      candidateName: string;
      phone: string;
      targetBand: string;
      status: string;
      remainingSeconds: number;
      answers: Record<string, any>;
    };
    test: SanitizedPlacementTestPayload;
  }> {
    const session = await this.getSessionById(sessionId);
    if (!session) {
      const err = new Error("Phiên khảo thí không tồn tại hoặc đã bị hủy");
      (err as any).statusCode = 404;
      throw err;
    }

    if (session.status === "SUBMITTED") {
      const err = new Error("Bài khảo thí này đã được nộp. Bạn có thể xem lại kết quả.");
      (err as any).statusCode = 409;
      throw err;
    }

    const remainingSec = Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000));
    if (remainingSec <= 0) {
      session.status = "EXPIRED";
      const err = new Error("Phiên làm bài đã hết hạn");
      (err as any).statusCode = 403;
      throw err;
    }

    return {
      session: {
        id: session.id,
        candidateName: session.candidateName,
        phone: session.phone,
        targetBand: session.targetBand,
        status: session.status,
        remainingSeconds: remainingSec,
        answers: session.answers || {},
      },
      test: canonicalPlacementTestPayload,
    };
  }

  /**
   * 4. Debounced autosave
   */
  public async autosaveAnswers(sessionId: string, answers: Record<string, any>) {
    const session = await this.getSessionById(sessionId);
    if (!session) {
      const err = new Error("Phiên khảo thí không tồn tại");
      (err as any).statusCode = 404;
      throw err;
    }

    if (session.status === "SUBMITTED") {
      const err = new Error("Bài thi đã được nộp. Không thể lưu thêm thay đổi.");
      (err as any).statusCode = 409;
      throw err;
    }

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      session.status = "EXPIRED";
      const err = new Error("Phiên làm bài đã hết hạn");
      (err as any).statusCode = 403;
      throw err;
    }

    session.answers = { ...session.answers, ...answers };
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
   * 5. Submit and Grade Objective Sections + Enqueue Subjective Review
   */
  public async submitAssessment(sessionId: string, answersPayload: Record<string, any>): Promise<DiagnosticReport> {
    const session = await this.getSessionById(sessionId);
    if (!session) {
      const err = new Error("Phiên khảo thí không tồn tại");
      (err as any).statusCode = 404;
      throw err;
    }

    if (session.status === "SUBMITTED") {
      const err = new Error("Bài khảo thí này đã được nộp trước đó");
      (err as any).statusCode = 409;
      throw err;
    }

    // 1-minute grace period for network latency
    if (new Date(session.expiresAt).getTime() < Date.now() - 60000) {
      session.status = "EXPIRED";
      const err = new Error("Phiên làm bài đã hết hạn. Không thể nộp bài.");
      (err as any).statusCode = 403;
      throw err;
    }

    const answers = { ...(session.answers || {}), ...(answersPayload || {}) };

    // Objective Scoring (Listening 10, Reading 10, Grammar 15) against Secret Answer Keys
    let listeningCorrect = 0;
    let listeningTotal = 0;
    let readingCorrect = 0;
    let readingTotal = 0;
    let grammarCorrect = 0;
    let grammarTotal = 0;

    const normalizeText = (s: any) =>
      String(s || "")
        .trim()
        .toLowerCase()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
        .replace(/\s+/g, " ");

    Object.entries(authoritativePlacementAnswerKeys).forEach(([qId, key]) => {
      if (key.skill === "listening") listeningTotal++;
      else if (key.skill === "reading") readingTotal++;
      else if (key.skill === "grammar") grammarTotal++;

      const studentAns = answers[qId];
      if (!studentAns) return;

      const normStudent = normalizeText(studentAns);
      const normCorrect = normalizeText(key.correctAnswer);

      let isMatch = normStudent === normCorrect;
      if (!isMatch && key.acceptedAnswers && key.acceptedAnswers.length > 0) {
        isMatch = key.acceptedAnswers.some((acc) => normalizeText(acc) === normStudent);
      }

      if (isMatch) {
        if (key.skill === "listening") listeningCorrect++;
        else if (key.skill === "reading") readingCorrect++;
        else if (key.skill === "grammar") grammarCorrect++;
      }
    });

    const totalQuestions = listeningTotal + readingTotal + grammarTotal;
    const rawCorrect = listeningCorrect + readingCorrect + grammarCorrect;
    const accuracyPercent = Math.round((rawCorrect / Math.max(1, totalQuestions)) * 100);

    const listeningPct = Math.round((listeningCorrect / Math.max(1, listeningTotal)) * 100);
    const readingPct = Math.round((readingCorrect / Math.max(1, readingTotal)) * 100);
    const grammarPct = Math.round((grammarCorrect / Math.max(1, grammarTotal)) * 100);

    // Map to ARIS Diagnostic Level & Estimated IELTS Range
    const arisInfo = mapRawScoreToArisLevel(rawCorrect, totalQuestions);

    // Subjective check (Writing & Speaking)
    const hasWriting = typeof answers["writing_response"] === "string" && answers["writing_response"].trim().length >= 30;
    const hasSpeaking = !!answers["speaking_audio_url"] || !!answers["speaking_completed"];
    const subjectiveStatus = (hasWriting || hasSpeaking) ? "PENDING_REVIEW" : "NONE";

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (readingPct >= 70) {
      strengths.push("Khả năng quét và định vị thông tin học thuật (Scanning & Skimming) rất nhanh và chính xác.");
    } else if (readingPct < 40) {
      weaknesses.push("Tốc độ đọc còn chậm và dễ bị bẫy ở các câu hỏi suy luận logic True/False/Not Given.");
    }

    if (listeningPct >= 70) {
      strengths.push("Phản xạ nghe hiểu tốt, bắt kịp tốc độ các đoạn hội thoại và độc thoại học thuật.");
    } else if (listeningPct < 40) {
      weaknesses.push("Còn gặp khó khăn khi nghe các từ nối âm và thông tin số liệu/địa chỉ trong bài nghe.");
    }

    if (grammarPct >= 70) {
      strengths.push("Nắm vững cấu trúc câu phức, đảo ngữ và các collocations học thuật thông dụng.");
    } else if (grammarPct < 50) {
      weaknesses.push("Cần củng cố thêm các thì hoàn thành, mệnh đề quan hệ và trật tự từ trong câu phức.");
    }

    if (strengths.length === 0) {
      strengths.push("Có thái độ học tập nghiêm túc, hoàn thành trọn vẹn toàn bộ bài khảo thí.");
    }
    if (weaknesses.length === 0) {
      weaknesses.push("Tiếp tục duy trì luyện tập các đề đọc hiểu độ khó cao để tối ưu tốc độ làm bài.");
    }

    const report: DiagnosticReport = {
      sessionId,
      candidateName: session.candidateName,
      phone: session.phone,
      targetBand: session.targetBand,
      arisLevel: {
        levelNumber: arisInfo.levelNumber,
        levelTitle: arisInfo.levelTitle,
        estimatedIeltsRange: arisInfo.estimatedIeltsRange,
        description: arisInfo.description,
        recommendedCourse: arisInfo.recommendedCourse,
      },
      objectiveBreakdown: {
        rawScore: rawCorrect,
        totalQuestions,
        accuracyPercent,
        listening: {
          correct: listeningCorrect,
          total: listeningTotal,
          scorePercent: listeningPct,
          feedback: listeningPct >= 70 ? "Nghe hiểu tốt các ngữ cảnh thông dụng & học thuật." : "Cần rèn luyện thêm kỹ thuật bắt từ khóa (Keywords tracking).",
        },
        reading: {
          correct: readingCorrect,
          total: readingTotal,
          scorePercent: readingPct,
          feedback: readingPct >= 70 ? "Đọc hiểu nhanh, nhận diện chính xác từ đồng nghĩa." : "Cần củng cố kỹ năng đọc lướt và phân tích ngữ cảnh.",
        },
        grammar: {
          correct: grammarCorrect,
          total: grammarTotal,
          scorePercent: grammarPct,
          feedback: grammarPct >= 70 ? "Làm chủ cấu trúc câu học thuật và collocations nâng cao." : "Cần củng cố ngữ pháp câu phức và mở rộng vốn từ vựng.",
        },
      },
      subjectiveEvaluation: {
        status: subjectiveStatus,
        hasWritingSubmission: hasWriting,
        hasSpeakingRecording: hasSpeaking,
        note: hasWriting || hasSpeaking
          ? "Bài Viết và Nói của bạn đã được lưu an toàn và chuyển đến Giảng viên/AI chấm chuyên sâu."
          : "Thí sinh không gửi phần làm bài Viết/Nói tự luận.",
      },
      strengths,
      weaknesses,
      submittedAt: new Date().toISOString(),
    };

    session.status = "SUBMITTED";
    session.submittedAt = new Date();
    session.answers = answers;
    session.objectiveScore = {
      rawCorrect,
      totalQuestions,
      accuracyPercent,
      listeningCorrect,
      listeningTotal,
      readingCorrect,
      readingTotal,
      grammarCorrect,
      grammarTotal,
    };
    session.subjectiveStatus = subjectiveStatus;
    session.result = report;

    inMemoryAssessmentSessions.set(sessionId, session);

    try {
      if ((this.prisma as any).assessmentSession) {
        await (this.prisma as any).assessmentSession.update({
          where: { id: sessionId },
          data: {
            status: "SUBMITTED",
            submittedAt: session.submittedAt,
            answers: session.answers,
            result: report,
          },
        });
      }
    } catch (dbErr) {
      console.warn("[AssessmentService] DB Submit update notice:", dbErr);
    }

    // Update Contact Lead
    try {
      await this.prisma.contactLead.updateMany({
        where: { notes: { contains: sessionId } },
        data: {
          notes: `Session: ${sessionId} | ${arisInfo.levelTitle} (${arisInfo.estimatedIeltsRange}) | Điểm: ${rawCorrect}/${totalQuestions}`,
        },
      });
    } catch (leadUpdateErr) {
      console.warn("[AssessmentService] Lead update notice:", leadUpdateErr);
    }

    return report;
  }
}
