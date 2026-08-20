import { PrismaClient } from "@prisma/client";
import { SubmissionRepository } from "../repositories/submission.repository.js";
import { canonicalScoringService } from "./scoring/CanonicalScoringService.js";
import { auditOutboxService } from "./audit/AuditOutboxService.js";
import { idempotencyService } from "./idempotency/IdempotencyService.js";
import { AuthorizationError, NotFoundError } from "./authorization.service.js";
import { SubmissionStateMachine, SubmissionState, StateTransitionError } from "./submission-state-machine.js";
import { NotificationService } from "./notification.service.js";
import {
  getClassStudentIds,
  getTeacherStudentIds,
  isTeacherOfClass,
} from "../utils/teacherScope.js";

const MANUAL_TYPES = new Set(["essay", "speaking"]);
const MAX_EXAM_ATTEMPTS = 3;

export interface CriteriaScores {
  taskResponse: number | null;
  coherence: number | null;
  lexical: number | null;
  grammar: number | null;
}

export interface TeacherFeedbackPayload {
  text: string;
  primaryErrorCategory: "CONCEPT" | "STRUCTURE" | "EXPRESSION" | "GRAMMAR" | null;
  revisionRequired: boolean;
  criteriaScores: CriteriaScores | null;
}

export function getRemainingSeconds(startedAt: Date | null, durationMinutes: number | null) {
  const safeDuration = Math.max(1, durationMinutes || 60);
  if (!startedAt) return safeDuration * 60;

  const startedMs = new Date(startedAt).getTime();
  if (!Number.isFinite(startedMs)) return safeDuration * 60;

  const elapsed = Math.floor((Date.now() - startedMs) / 1000);
  return Math.max(0, safeDuration * 60 - Math.max(0, elapsed));
}

function sanitizeQuestionForStudent(q: any, showAnswerKey: boolean) {
  const cleaned = { ...q };
  if (!showAnswerKey) {
    delete cleaned.correctAnswer;
    delete cleaned.correct_answer;
    delete cleaned.audioScript;
    delete cleaned.audio_script;
    delete cleaned.acceptedAnswers;
    delete cleaned.accepted_answers;
    delete cleaned.answerKey;
    delete cleaned.answer_key;
  }
  return cleaned;
}

export class ExamSubmissionService {
  private repo: SubmissionRepository;

  constructor(private prisma: PrismaClient) {
    this.repo = new SubmissionRepository(prisma);
  }

  // Use Case: List Submissions with Role-based filtering
  async listSubmissions(user: { id: string; roles: string[] }, query: any) {
    const { examId, studentId, status, classId, needGrading, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    const isAdmin = user.roles.includes("admin");
    const isTeacher = user.roles.includes("teacher");

    if (!isAdmin && !isTeacher) {
      where.studentId = user.id;
    } else if (isTeacher && !isAdmin) {
      let teacherStudentIds: string[] = [];

      if (classId) {
        const owned = await isTeacherOfClass(this.prisma, user.id, classId);
        if (!owned) {
          throw new AuthorizationError("Từ chối truy cập - lớp không thuộc quyền quản lý của bạn", 403);
        }
        teacherStudentIds = await getClassStudentIds(this.prisma, classId);
      } else {
        teacherStudentIds = await getTeacherStudentIds(this.prisma, user.id);
      }

      where.studentId = {
        in: teacherStudentIds.length > 0 ? teacherStudentIds : ["__none__"],
      };
      if (studentId) {
        where.studentId = teacherStudentIds.includes(studentId) ? studentId : "__none__";
      }
    } else if (studentId) {
      where.studentId = studentId;
    }

    if (isAdmin && classId) {
      const classStudentIds = await getClassStudentIds(this.prisma, classId);
      const inClass = classStudentIds.length > 0 ? classStudentIds : ["__none__"];
      where.studentId = studentId ? (classStudentIds.includes(studentId) ? studentId : "__none__") : { in: inClass };
    }

    if (examId) where.examId = examId;
    if (status) where.status = status;

    const orderBy: any = {};
    orderBy[sortBy === "createdAt" ? "createdAt" : sortBy] = sortOrder;

    const [data, total] = await Promise.all([
      this.repo.findMany(
        where,
        skip,
        limit,
        orderBy,
        {
          id: true,
          studentId: true,
          examId: true,
          status: true,
          startedAt: true,
          submittedAt: true,
          gradedAt: true,
          totalScore: true,
          correctAnswers: true,
          totalQuestions: true,
          createdAt: true,
          updatedAt: true,
          student: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          exam: {
            select: {
              id: true,
              title: true,
              durationMinutes: true,
            },
          },
          answers: {
            select: {
              id: true,
              questionId: true,
              answerText: true,
              audioUrl: true,
              score: true,
              feedback: true,
            },
          },
        }
      ),
      this.repo.count(where),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Use Case: Get Submission Detail with Ownership check
  async getSubmissionById(user: { id: string; roles: string[] }, id: string) {
    const submission: any = await this.repo.findById(id, {
      student: {
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      exam: {
        include: {
          sections: {
            include: {
              questionGroups: {
                include: {
                  questions: true,
                },
              },
            },
          },
        },
      },
      answers: true,
    });

    if (!submission) {
      throw new NotFoundError("Không tìm thấy bài nộp");
    }

    // Ownership Enforcement
    const isAdmin = user.roles.includes("admin");
    const isTeacher = user.roles.includes("teacher");

    if (!isAdmin && !isTeacher && submission.studentId !== user.id) {
      throw new AuthorizationError("Từ chối truy cập - bài làm không thuộc sở hữu của bạn", 403);
    }

    if (isTeacher && !isAdmin) {
      const teacherStudentIds = await getTeacherStudentIds(this.prisma, user.id);
      if (submission.studentId !== user.id && !teacherStudentIds.includes(submission.studentId)) {
        throw new AuthorizationError("Từ chối truy cập - học viên không thuộc lớp bạn quản lý", 403);
      }
    }

    // Sanitize question data for student (Immutable copy without mutating database object)
    const isGraded = String(submission.status).toUpperCase() === "GRADED";
    const canSeeSecrets = isGraded || isAdmin || isTeacher;
    if (submission.exam?.sections) {
      submission.exam = {
        ...submission.exam,
        sections: submission.exam.sections.map((sec: any) => {
          const sanitizedSec = { ...sec };
          if (!canSeeSecrets) {
            delete sanitizedSec.audioScript;
            delete sanitizedSec.audio_script;
          }
          sanitizedSec.questionGroups = sec.questionGroups?.map((g: any) => ({
            ...g,
            questions: g.questions?.map((q: any) =>
              sanitizeQuestionForStudent(q, canSeeSecrets)
            ),
          }));
          return sanitizedSec;
        }),
      };
    }

    return submission;
  }

  // Use Case: Start Exam Attempt (with Open Exam & Dual-Channel Authorization)
  async startAttempt(user: { id: string; roles: string[] }, examId: string): Promise<{ submission: any; isNew: boolean }> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundError("Bài thi không tồn tại");
    }

    const isPrivileged = user.roles.includes("admin") || user.roles.includes("teacher");
    const isOpenExam = (exam as any).isOpen === true || (exam as any).is_open === true || (exam as any).openForAll === true;
    
    // Check enrollment ONLY if exam belongs to a course and is not open
    if (!isPrivileged && !isOpenExam && exam.courseId) {
      const directEnrollment = await this.prisma.enrollment?.findFirst?.({
        where: { studentId: user.id, courseId: exam.courseId },
      });

      let hasClassMembership = false;
      const classStudents = await this.prisma.classStudent.findMany({
        where: { studentId: user.id },
      });

      if (classStudents.length > 0) {
        const classIds = classStudents.map((cs: any) => cs.classId);
        const enrolledClasses = await this.prisma.class.findMany({
          where: { id: { in: classIds } },
        });
        hasClassMembership = enrolledClasses.some((c: any) => c.courseId === exam.courseId);
      }

      if (!directEnrollment && !hasClassMembership) {
        throw new AuthorizationError("Từ chối truy cập: Học viên chưa đăng ký khóa học hoặc lớp học của bài thi này", 403);
      }
    }

    const attemptCount = await this.repo.countAttempts(user.id, examId);
    if (!isPrivileged && attemptCount >= MAX_EXAM_ATTEMPTS) {
      throw new AuthorizationError(`Bạn đã sử dụng hết ${MAX_EXAM_ATTEMPTS} lượt làm bài cho bài thi này`, 409);
    }

    return this.repo.transaction(async (tx) => {
      const inProgress = await tx.examSubmission.findFirst({
        where: {
          examId,
          studentId: user.id,
          status: "IN_PROGRESS",
        },
      });

      if (inProgress) {
        const remainingSeconds = getRemainingSeconds(inProgress.startedAt, exam.durationMinutes);
        if (remainingSeconds > 0) {
          return {
            submission: {
              ...inProgress,
              remainingSeconds,
              serverTime: new Date().toISOString(),
            },
            isNew: false,
          };
        }

        const answerCount = await tx.answer.count({
          where: { submissionId: inProgress.id },
        });

        if (answerCount === 0) {
          const reset = await tx.examSubmission.update({
            where: { id: inProgress.id },
            data: { startedAt: new Date() },
          });
          return {
            submission: {
              ...reset,
              remainingSeconds: Math.max(1, (exam.durationMinutes || 60) * 60),
              serverTime: new Date().toISOString(),
            },
            isNew: false,
          };
        }

        // Stale attempt with answers -> finalize as SUBMITTED and create new attempt
        await tx.examSubmission.update({
          where: { id: inProgress.id },
          data: {
            status: "SUBMITTED",
            submittedAt: new Date(),
          },
        });
      }

      const newSubmission = await tx.examSubmission.create({
        data: {
          examId,
          studentId: user.id,
          status: "IN_PROGRESS",
          startedAt: new Date(),
          version: 1,
        },
      });

      return {
        submission: {
          ...newSubmission,
          remainingSeconds: (exam.durationMinutes || 60) * 60,
          serverTime: new Date().toISOString(),
        },
        isNew: true,
      };
    });
  }

  // Use Case: Save Draft Answers (Autosave - checks version conflict and status)
  async saveDraft(user: { id: string; roles: string[] }, id: string, answers: any[], version?: number) {
    const submission: any = await this.repo.findById(id);
    if (!submission) {
      throw new NotFoundError("Không tìm thấy bài làm");
    }

    if (submission.studentId !== user.id) {
      throw new AuthorizationError("Bạn không có quyền sửa bài làm này", 403);
    }

    const currentStatus = String(submission.status).toUpperCase() as SubmissionState;
    if (SubmissionStateMachine.isFinalized(currentStatus)) {
      throw new StateTransitionError("SUBMISSION_ALREADY_FINALIZED");
    }

    if (currentStatus !== "IN_PROGRESS") {
      throw new StateTransitionError("SUBMISSION_ALREADY_FINALIZED");
    }

    // Version conflict check
    if (typeof version === "number" && submission.version !== undefined && submission.version !== null) {
      if (version <= submission.version) {
        throw new AuthorizationError("STALE_VERSION_CONFLICT", 409);
      }
    }

    return this.repo.transaction(async (tx) => {
      for (const ans of answers) {
        const existingAns = await tx.answer.findFirst({
          where: {
            submissionId: id,
            questionId: ans.questionId,
          },
        });

        const answerText = typeof ans.answerText === "object" ? JSON.stringify(ans.answerText) : ans.answerText;

        if (existingAns) {
          await tx.answer.update({
            where: { id: existingAns.id },
            data: {
              answerText,
              audioUrl: ans.audioUrl || null,
            },
          });
        } else {
          await tx.answer.create({
            data: {
              submissionId: id,
              questionId: ans.questionId,
              answerText,
              audioUrl: ans.audioUrl || null,
            },
          });
        }
      }

      const updated = await tx.examSubmission.update({
        where: { id },
        data: {
          version: typeof version === "number" ? version : (submission.version || 1) + 1,
        },
        include: { answers: true },
      });

      return {
        ...updated,
        savedCount: answers.length,
      };
    });
  }

  // Use Case: Submit Exam with Canonical Scoring & Idempotency
  // CRITICAL: Pure Server Authority — Strips client score/bandScore/isCorrect injections
  async submitExam(
    user: { id: string; roles: string[] },
    id: string,
    payload: {
      answers: any[];
      idempotencyKey?: string;
      version?: number;
      // Client score injection fields to IGNORE
      score?: any;
      bandScore?: any;
      correctCount?: any;
      isCorrect?: any;
      totalScore?: any;
      status?: any;
    }
  ) {
    // Check idempotency record first
    if (payload.idempotencyKey) {
      let existingIdem: any = null;
      if ((this.prisma as any).idempotencyRecords) {
        existingIdem = await this.prisma.idempotencyRecord?.findFirst?.({
          where: { key: payload.idempotencyKey },
        });
      }

      if (existingIdem) {
        const cached = typeof existingIdem.responsePayload === "string" 
          ? JSON.parse(existingIdem.responsePayload) 
          : existingIdem.responsePayload;
        const cachedAnswers = cached.answers || [];
        const incomingAnswers = payload.answers || [];

        let isDifferent = false;
        if (incomingAnswers.length !== cachedAnswers.length) {
          isDifferent = true;
        } else {
          for (let i = 0; i < incomingAnswers.length; i++) {
            const incAns = incomingAnswers[i];
            const cachedAns = cachedAnswers.find((ca: any) => ca.questionId === incAns.questionId);
            const incText = typeof incAns.answerText === "object" ? JSON.stringify(incAns.answerText) : incAns.answerText;
            const caText = typeof cachedAns?.answerText === "object" ? JSON.stringify(cachedAns?.answerText) : cachedAns?.answerText;
            if (!cachedAns || incText !== caText) {
              isDifferent = true;
              break;
            }
          }
        }

        if (isDifferent) {
          throw new AuthorizationError("IDEMPOTENCY_CONFLICT", 409);
        }
        return cached;
      }
    }

    const submission: any = await this.repo.findById(id, {
      exam: {
        include: {
          sections: {
            include: {
              questionGroups: {
                include: {
                  questions: true,
                },
              },
            },
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundError("Không tìm thấy bài làm");
    }

    if (submission.studentId !== user.id) {
      throw new AuthorizationError("Bạn không có quyền nộp bài làm này", 403);
    }

    // Idempotency: If already graded, return saved result without re-modifying score
    const currentStatus = String(submission.status).toUpperCase() as SubmissionState;
    if (currentStatus === "GRADED") {
      return submission;
    }

    let answersToEvaluate = payload.answers || [];
    if (answersToEvaluate.length === 0) {
      const dbAnswers = await this.prisma.answer.findMany({
        where: { submissionId: id },
      });
      answersToEvaluate = dbAnswers.map((a: any) => ({
        questionId: a.questionId,
        answerText: a.answerText,
        audioUrl: a.audioUrl,
      }));
    }

    // SERVER IS SOLE AUTHORITY: Pure Canonical Scoring from answers & exam structure
    const examStructure = submission.exam;
    const gradingSummary = canonicalScoringService.evaluateExamAttempt(
      examStructure,
      answersToEvaluate
    );

    const hasManualQuestions = gradingSummary.hasManualQuestions;
    const targetStatus: SubmissionState = hasManualQuestions ? "SUBMITTED" : "GRADED";

    // Enforce State Machine Transition
    SubmissionStateMachine.assertTransition(currentStatus, targetStatus);

    return this.repo.transaction(async (tx) => {
      const createdOrUpdatedAnswers = [];
      for (const ans of answersToEvaluate) {
        const evalResult = gradingSummary.evaluatedAnswers.find((g) => g.questionId === ans.questionId);
        const answerText = typeof ans.answerText === "object" ? JSON.stringify(ans.answerText) : ans.answerText;

        const existingAns = await tx.answer.findFirst({
          where: { submissionId: id, questionId: ans.questionId },
        });

        if (existingAns) {
          const u = await tx.answer.update({
            where: { id: existingAns.id },
            data: {
              answerText,
              audioUrl: ans.audioUrl || null,
              score: evalResult ? evalResult.score : null,
            },
          });
          createdOrUpdatedAnswers.push(u);
        } else {
          const c = await tx.answer.create({
            data: {
              submissionId: id,
              questionId: ans.questionId,
              answerText,
              audioUrl: ans.audioUrl || null,
              score: evalResult ? evalResult.score : null,
            },
          });
          createdOrUpdatedAnswers.push(c);
        }
      }

      const updated = await tx.examSubmission.update({
        where: { id },
        data: {
          status: targetStatus as any,
          submittedAt: new Date(),
          gradedAt: targetStatus === "GRADED" ? new Date() : null,
          totalScore: gradingSummary.totalScore,
          correctAnswers: gradingSummary.correctAnswers,
          totalQuestions: gradingSummary.totalQuestions,
          version: (submission.version || 1) + 1,
        },
      });

      const fullResult = {
        ...updated,
        answers: createdOrUpdatedAnswers,
        bandScore: gradingSummary.bandScore,
      };

      // Audit Outbox Event (Enabled when backed by storage)
      if ((tx as any).auditOutboxList && tx.auditOutbox) {
        const auditEvent = auditOutboxService.buildSanitizedEvent({
          eventType: "SUBMISSION_FINALIZED",
          actorId: user.id,
          actorRole: user.roles[0] || "student",
          submissionId: id,
          examId: submission.examId,
          idempotencyKey: payload.idempotencyKey,
          oldState: { status: submission.status, totalScore: submission.totalScore },
          newState: { status: targetStatus, totalScore: gradingSummary.totalScore },
          resultSummary: gradingSummary,
        });
        await tx.auditOutbox.create({ data: auditEvent });
      }

      // Idempotency Record (Enabled when backed by storage)
      if (payload.idempotencyKey && (tx as any).idempotencyRecords && tx.idempotencyRecord) {
        await tx.idempotencyRecord.create({
          data: {
            key: payload.idempotencyKey,
            submissionId: id,
            payloadHash: "sha256-mock",
            responsePayload: JSON.stringify(fullResult),
          },
        });
      }

      return fullResult;
    });
  }

  // Use Case: Start Revision Attempt (P1 Canonical Learning Loop)
  async startRevision(
    user: { id: string; roles: string[] },
    examId: string,
    options?: { clonePreviousAnswers?: boolean }
  ): Promise<{ submission: any; isNew: boolean }> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundError("Bài thi không tồn tại");
    }

    // 1. Idempotency Check: Return existing active IN_PROGRESS session if present
    const existingInProgress = await this.prisma.examSubmission.findFirst({
      where: {
        examId,
        studentId: user.id,
        status: "IN_PROGRESS",
      },
      include: { answers: true },
    });

    if (existingInProgress) {
      return {
        submission: existingInProgress,
        isNew: false,
      };
    }

    // 2. Fetch latest previous submission for this exam & student
    const latestSubmission = await this.prisma.examSubmission.findFirst({
      where: {
        examId,
        studentId: user.id,
      },
      orderBy: { createdAt: "desc" },
      include: { answers: true },
    });

    if (!latestSubmission) {
      throw new AuthorizationError("Chưa có bài nộp nào trước đó để sửa. Vui lòng làm bài lần đầu.", 400);
    }

    const latestStatus = String(latestSubmission.status).toUpperCase();
    if (latestStatus !== "GRADED") {
      throw new AuthorizationError("Bài nộp trước đó chưa được chấm điểm. Chỉ có thể sửa bài sau khi đã có đánh giá từ giáo viên.", 400);
    }

    // Invariant Check: Verify that teacher explicitly marked revisionRequired: true
    let isRevisionRequired = true;
    for (const ans of latestSubmission.answers || []) {
      if (ans.feedback) {
        try {
          const parsed = JSON.parse(ans.feedback);
          if (parsed && typeof parsed === "object" && parsed.revisionRequired !== undefined) {
            isRevisionRequired = !!parsed.revisionRequired;
            break;
          }
        } catch {
          // not structured json feedback
        }
      }
    }

    if (!isRevisionRequired) {
      throw new AuthorizationError("Bài nộp đã đạt yêu cầu hoặc giáo viên không yêu cầu sửa bài.", 400);
    }

    // 3. Create fresh ExamSubmission for Attempt 2 (Revision) in an atomic transaction
    return this.repo.transaction(async (tx) => {
      const newSubmission = await tx.examSubmission.create({
        data: {
          examId,
          studentId: user.id,
          status: "IN_PROGRESS",
          startedAt: new Date(),
        },
      });

      // Optionally clone answer texts from previous attempt if requested
      if (options?.clonePreviousAnswers && latestSubmission.answers?.length > 0) {
        for (const prevAnswer of latestSubmission.answers) {
          await tx.answer.create({
            data: {
              submissionId: newSubmission.id,
              questionId: prevAnswer.questionId,
              answerText: prevAnswer.answerText,
              audioUrl: prevAnswer.audioUrl,
            },
          });
        }
      }

      const created = await tx.examSubmission.findUnique({
        where: { id: newSubmission.id },
        include: { answers: true },
      });

      return {
        submission: created,
        isNew: true,
      };
    });
  }

  // Use Case: Teacher Grades Manual Submission (Essay/Speaking / P1 Feedback)
  async gradeManualSubmission(
    user: { id: string; roles: string[] },
    id: string,
    grades: Array<{ answerId: string; score: number; feedback?: string }>,
    totalScore?: number,
    options?: {
      feedback?: string;
      primaryErrorCategory?: "CONCEPT" | "STRUCTURE" | "EXPRESSION" | "GRAMMAR" | null;
      revisionRequired?: boolean;
      criteriaScores?: CriteriaScores | null;
    }
  ) {
    const isAdmin = user.roles.includes("admin");
    const isTeacher = user.roles.includes("teacher");

    if (!isAdmin && !isTeacher) {
      throw new AuthorizationError("Chỉ giáo viên hoặc admin mới có quyền chấm bài", 403);
    }

    const submission: any = await this.repo.findById(id);
    if (!submission) {
      throw new NotFoundError("Không tìm thấy bài nộp");
    }

    if (isTeacher && !isAdmin) {
      const teacherStudentIds = await getTeacherStudentIds(this.prisma, user.id);
      if (!teacherStudentIds.includes(submission.studentId)) {
        throw new AuthorizationError("Học viên không thuộc lớp do bạn phụ trách", 403);
      }
    }

    const currentStatus = String(submission.status).toUpperCase() as SubmissionState;
    SubmissionStateMachine.assertTransition(currentStatus, "GRADED", true);

    return this.repo.transaction(async (tx) => {
      let computedTotal = 0;

      for (let i = 0; i < grades.length; i++) {
        const g = grades[i];
        let answerFeedback = g.feedback || null;

        // If top-level feedback metadata is provided and this is the first answer, format feedback
        if (
          i === 0 &&
          options &&
          (options.feedback ||
            options.primaryErrorCategory !== undefined ||
            options.revisionRequired !== undefined ||
            options.criteriaScores !== undefined)
        ) {
          const structuredPayload: TeacherFeedbackPayload = {
            text: options.feedback || g.feedback || "",
            primaryErrorCategory: options.primaryErrorCategory || null,
            revisionRequired: !!options.revisionRequired,
            criteriaScores: options.criteriaScores || null,
          };
          answerFeedback = JSON.stringify(structuredPayload);
        }

        if (g.answerId) {
          await tx.answer.update({
            where: { id: g.answerId },
            data: {
              score: g.score,
              feedback: answerFeedback,
            },
          });
        } else {
          const fallbackAns = await tx.answer.findFirst({
            where: { submissionId: id },
          });
          if (fallbackAns) {
            await tx.answer.update({
              where: { id: fallbackAns.id },
              data: {
                score: g.score,
                feedback: answerFeedback,
              },
            });
          }
        }
        computedTotal += g.score;
      }

      const allAnswers = await tx.answer.findMany({
        where: { submissionId: id },
      });

      const finalTotalScore = typeof totalScore === "number"
        ? totalScore
        : allAnswers.reduce((sum: number, a: any) => sum + (Number(a.score) || 0), 0);

      const updated = await tx.examSubmission.update({
        where: { id },
        data: {
          status: "GRADED" as any,
          gradedAt: new Date(),
          gradedBy: user.id,
          totalScore: finalTotalScore,
        },
        include: { answers: true },
      });

      // Audit Outbox Event (Enabled when backed by storage)
      if ((tx as any).auditOutboxList && tx.auditOutbox) {
        const auditEvent = auditOutboxService.buildSanitizedEvent({
          eventType: "TEACHER_REGRADED",
          actorId: user.id,
          actorRole: user.roles.includes("admin") ? "admin" : "teacher",
          submissionId: id,
          examId: submission.examId as string,
          oldState: { status: submission.status, totalScore: submission.totalScore },
          newState: { status: "GRADED", totalScore: finalTotalScore },
        });
        await tx.auditOutbox.create({ data: auditEvent });
      }

      return updated;
    });
  }

  // Use Case: Authorized Regrade Workflow (G4 Core)
  async regradeSubmission(
    user: { id: string; roles: string[] },
    id: string,
    data: {
      reason: string;
      grades?: Array<{ answerId: string; score: number; feedback?: string }>;
      regradeAll?: boolean;
    }
  ) {
    const isAdmin = user.roles.includes("admin");
    const isTeacher = user.roles.includes("teacher");

    if (!isAdmin && !isTeacher) {
      throw new AuthorizationError("Từ chối truy cập: Chỉ giáo viên quản lý lớp hoặc quản trị viên mới được phép phúc khảo/chấm lại bài thi", 403);
    }

    if (!data.reason || typeof data.reason !== "string" || data.reason.trim().length < 5) {
      throw new AuthorizationError("Yêu cầu phúc khảo bắt buộc phải có lý do chi tiết (tối thiểu 5 ký tự)", 400);
    }

    const submission: any = await this.repo.findById(id, {
      exam: {
        include: {
          sections: {
            include: {
              questionGroups: {
                include: {
                  questions: true,
                },
              },
            },
          },
        },
      },
      answers: true,
    });

    if (!submission) {
      throw new NotFoundError("Không tìm thấy bài nộp cần chấm lại");
    }

    if (isTeacher && !isAdmin) {
      const teacherStudentIds = await getTeacherStudentIds(this.prisma, user.id);
      if (!teacherStudentIds.includes(submission.studentId)) {
        throw new AuthorizationError("Học viên không thuộc lớp do bạn phụ trách", 403);
      }
    }

    const previousScore = Number(submission.totalScore) || 0;
    const currentStatus = String(submission.status).toUpperCase() as SubmissionState;
    SubmissionStateMachine.assertTransition(currentStatus, "GRADED", true);

    return this.repo.transaction(async (tx) => {
      let finalTotalScore = previousScore;
      let finalCorrectCount = submission.correctAnswers || 0;

      // Mode A: Regrade All against Canonical Scoring Engine
      if (data.regradeAll) {
        const rawAnswers = (submission.answers || []).map((a: any) => ({
          questionId: a.questionId,
          answerText: a.answerText,
          audioUrl: a.audioUrl,
        }));

        const gradingSummary = canonicalScoringService.evaluateExamAttempt(
          submission.exam,
          rawAnswers
        );

        for (const ans of rawAnswers) {
          const evalResult = gradingSummary.evaluatedAnswers.find((g) => g.questionId === ans.questionId);
          if (evalResult) {
            await tx.answer.updateMany({
              where: { submissionId: id, questionId: ans.questionId },
              data: { score: evalResult.score },
            });
          }
        }

        finalTotalScore = gradingSummary.totalScore;
        finalCorrectCount = gradingSummary.correctAnswers;
      }

      // Mode B: Partial overrides from Teacher Manual Regrade
      if (data.grades && data.grades.length > 0) {
        for (const g of data.grades) {
          await tx.answer.update({
            where: { id: g.answerId },
            data: {
              score: g.score,
              feedback: g.feedback || null,
            },
          });
        }

        const allAnswers = await tx.answer.findMany({ where: { submissionId: id } });
        finalTotalScore = allAnswers.reduce((sum: number, a: any) => sum + (Number(a.score) || 0), 0);
      }

      const updated = await tx.examSubmission.update({
        where: { id },
        data: {
          status: "GRADED" as any,
          gradedAt: new Date(),
          gradedBy: user.id,
          totalScore: finalTotalScore,
          correctAnswers: finalCorrectCount,
          version: (submission.version || 1) + 1,
        },
        include: { answers: true },
      });

      // Immutable Audit Trail (Enabled when backed by storage)
      if ((tx as any).auditOutboxList && tx.auditOutbox) {
        const auditEvent = auditOutboxService.buildSanitizedEvent({
          eventType: "SUBMISSION_REGRADED",
          actorId: user.id,
          actorRole: isAdmin ? "admin" : "teacher",
          submissionId: id,
          examId: submission.examId as string,
          oldState: { status: submission.status, totalScore: previousScore },
          newState: { status: "GRADED", totalScore: finalTotalScore },
          reason: data.reason.trim(),
        });
        await tx.auditOutbox.create({ data: auditEvent });
      }

      return {
        ...updated,
        regradeReason: data.reason.trim(),
        previousScore,
      };
    });
  }
}
