/**
 * ARIS ACADEMIC OS — P2-A: COMPETENCY EVIDENCE COLLECTION
 * 
 * Module trích xuất và cấu trúc hóa bằng chứng thực nghiệm học tập từ Lean Learning Loop v1.0.
 * Tuân thủ nguyên tắc khoa học dữ liệu thực nghiệm:
 * 1. Error Category ≠ Competency Ground Truth (Chỉ là Observation / Hypothesis).
 * 2. Score Delta ≠ Resolution Proof (Chỉ là supporting context).
 * 3. Phân tách rạch ròi 3 tầng: Observation -> Evidence -> Hypothesis.
 * 4. Zero premature metrics: Không mastery, không resolution rate, không suggested rank.
 */

/**
 * 4 Trụ Cột Năng Lực Theo Khung The ARIS Way (Giả thuyết suy luận năng lực)
 */
export type ArisCompetency =
  | 'C1_MEANING'      // Meaning Precision (WHAT meaning?)
  | 'C2_STRUCTURE'    // Structural Control (HOW structured?)
  | 'C3_LOGIC'        // Logical Progression (HOW developed?)
  | 'C4_CONTEXT';     // Contextual Appropriateness (APPROPRIATE for whom/why?)

/**
 * 4 Nhóm Lỗi Thực Nghiệm Do Giáo Viên Gắn Nhãn Trong Lean Learning Loop
 */
export type PrimaryErrorCategory = 'CONCEPT' | 'STRUCTURE' | 'EXPRESSION' | 'GRAMMAR';

/**
 * Trạng Thái Bằng Chứng Thực Nghiệm Giữa 2 Attempt
 */
export type EvidenceStatus =
  | 'OBSERVED'          // Ghi nhận lỗi ở Attempt 1, chưa thực hiện bài sửa
  | 'IMPROVED'          // Giáo viên đã nghiệm thu và xác nhận lỗi được khắc phục ở Attempt 2
  | 'NOT_YET_IMPROVED'  // Lỗi mục tiêu vẫn tiếp tục lặp lại và yêu cầu sửa tiếp
  | 'UNDETERMINED';     // Chưa đủ cơ sở kết luận (Đang làm nháp, chưa chấm, hoặc ngữ cảnh thay đổi)

/**
 * Bảng Ánh Xạ Giả Thuyết Năng Lực (Hypothetical Implication Mapping)
 * Đóng vai trò phân loại định hướng để tích lũy dữ liệu corpus, không phán xét năng lực tuyệt đối.
 */
export const ERROR_TO_COMPETENCY_HYPOTHESIS: Record<PrimaryErrorCategory, ArisCompetency> = {
  CONCEPT: 'C1_MEANING',
  STRUCTURE: 'C2_STRUCTURE',
  EXPRESSION: 'C4_CONTEXT',
  GRAMMAR: 'C2_STRUCTURE',
};

/**
 * Một Bản Ghi Bằng Chứng Học Tập Cụ Thể (Competency Evidence Item)
 */
export interface CompetencyEvidenceItem {
  submissionId: string;
  examId: string;
  examTitle: string;
  attemptNumber: number;

  // Tầng 1: Observation (Dữ liệu quan sát thực tế)
  errorCategory: PrimaryErrorCategory;
  teacherFeedback: string;
  initialScore: number | null;
  attempt1AnswerText?: string;

  // Tầng 2: Evidence (So sánh giữa 2 phiên làm bài)
  resolvedInAttemptId?: string;
  resolvedScore?: number | null;
  scoreDelta?: number | null;
  attempt2AnswerText?: string;
  evidenceStatus: EvidenceStatus;

  // Tầng 3: Hypothesis (Giả thuyết liên đới năng lực)
  implicatedCompetency: ArisCompetency;

  timestamp: string;
}

/**
 * Tập Hợp Bằng Chứng Học Tập Của Học Viên (Student Evidence Corpus Summary)
 */
export interface StudentEvidenceCorpus {
  studentId: string;
  totalReviewedSubmissions: number;
  totalRevisionAttempts: number;

  // Thống kê số lượng quan sát thực tế theo nhóm lỗi
  observedErrorCounts: Record<PrimaryErrorCategory, number>;

  // Danh sách các bằng chứng cụ thể theo thời gian
  evidenceItems: CompetencyEvidenceItem[];

  // Tỷ lệ bao phủ bằng chứng thực tế
  evidenceCoverage: {
    totalSubmissionsWithFeedback: number;
    totalRevisionsCompleted: number;
    undeterminedCount: number;
  };
}

/**
 * Hàm thuần túy xây dựng một CompetencyEvidenceItem từ 2 Submission liên tiếp của một Exam
 */
export function buildEvidenceItem(
  attempt1: any,
  attempt2?: any,
): CompetencyEvidenceItem | null {
  if (!attempt1 || !attempt1.primaryErrorCategory) {
    return null;
  }

  const category = attempt1.primaryErrorCategory as PrimaryErrorCategory;
  const initialScore = attempt1.totalScore != null ? Number(attempt1.totalScore) : null;
  const examTitle = attempt1.exam?.title || 'Bài tập';
  const firstAnswerText1 = attempt1.answers?.[0]?.answerText || undefined;

  let evidenceStatus: EvidenceStatus = 'OBSERVED';
  let resolvedScore: number | null = null;
  let scoreDelta: number | null = null;
  let firstAnswerText2: string | undefined = undefined;
  let resolvedInAttemptId: string | undefined = undefined;

  if (attempt2) {
    resolvedInAttemptId = attempt2.id;
    firstAnswerText2 = attempt2.answers?.[0]?.answerText || undefined;

    const rawScore2 = attempt2.totalScore != null ? Number(attempt2.totalScore) : null;
    resolvedScore = rawScore2;

    if (initialScore !== null && resolvedScore !== null) {
      scoreDelta = Math.round((resolvedScore - initialScore) * 10) / 10;
    }

    const rawStatus2 = String(attempt2.status || '').toUpperCase();

    // Xác định evidenceStatus dựa trên thẩm quyền đánh giá của Giáo viên
    if (rawStatus2 === 'GRADED') {
      if (attempt2.revisionRequired === false) {
        // Giáo viên xác nhận bài sửa đạt yêu cầu, không cần sửa thêm
        evidenceStatus = 'IMPROVED';
      } else if (attempt2.revisionRequired === true) {
        // Giáo viên đánh giá bài sửa vẫn còn lỗi và yêu cầu sửa tiếp
        evidenceStatus = 'NOT_YET_IMPROVED';
      } else {
        evidenceStatus = 'UNDETERMINED';
      }
    } else {
      // Đang làm nháp (IN_PROGRESS) hoặc vừa nộp chưa chấm (SUBMITTED)
      evidenceStatus = 'UNDETERMINED';
    }
  }

  return {
    submissionId: attempt1.id,
    examId: attempt1.examId,
    examTitle,
    attemptNumber: attempt1.attemptNumber || 1,
    errorCategory: category,
    teacherFeedback: attempt1.feedback || '',
    initialScore,
    attempt1AnswerText: firstAnswerText1,
    resolvedInAttemptId,
    resolvedScore,
    scoreDelta,
    attempt2AnswerText: firstAnswerText2,
    evidenceStatus,
    implicatedCompetency: ERROR_TO_COMPETENCY_HYPOTHESIS[category] || 'C2_STRUCTURE',
    timestamp: attempt1.gradedAt || attempt1.submittedAt || attempt1.createdAt || new Date().toISOString(),
  };
}

/**
 * Hàm thuần túy xây dựng StudentEvidenceCorpus từ toàn bộ danh sách submissions của học viên
 */
export function buildStudentEvidenceCorpus(
  studentId: string,
  submissions: any[],
): StudentEvidenceCorpus {
  const reviewedSubmissions = (submissions || []).filter((s) => {
    const isGraded = String(s.status || '').toUpperCase() === 'GRADED';
    return isGraded && s.primaryErrorCategory;
  });

  // Nhóm các submissions theo examId
  const subsByExam: Record<string, any[]> = {};
  (submissions || []).forEach((s) => {
    const eId = s.examId;
    if (!eId) return;
    if (!subsByExam[eId]) subsByExam[eId] = [];
    subsByExam[eId].push(s);
  });

  // Sắp xếp các submission của từng exam theo thời gian tăng dần (Attempt 1 -> Attempt 2)
  Object.keys(subsByExam).forEach((eId) => {
    subsByExam[eId].sort((a, b) => {
      const tA = new Date(a.createdAt || a.startedAt || 0).getTime();
      const tB = new Date(b.createdAt || b.startedAt || 0).getTime();
      return tA - tB;
    });
  });

  const observedErrorCounts: Record<PrimaryErrorCategory, number> = {
    CONCEPT: 0,
    STRUCTURE: 0,
    EXPRESSION: 0,
    GRAMMAR: 0,
  };

  const evidenceItems: CompetencyEvidenceItem[] = [];
  let totalRevisionsCompleted = 0;
  let undeterminedCount = 0;

  Object.values(subsByExam).forEach((examSubs) => {
    if (examSubs.length === 0) return;

    // Xét Attempt 1
    const att1 = examSubs[0];
    if (!att1.primaryErrorCategory) return;

    const cat = att1.primaryErrorCategory as PrimaryErrorCategory;
    if (observedErrorCounts[cat] !== undefined) {
      observedErrorCounts[cat]++;
    }

    // Tìm Attempt 2 tương ứng nếu có
    const att2 = examSubs.length > 1 ? examSubs[1] : undefined;
    const item = buildEvidenceItem(att1, att2);

    if (item) {
      evidenceItems.push(item);
      if (item.evidenceStatus === 'IMPROVED' || item.evidenceStatus === 'NOT_YET_IMPROVED') {
        totalRevisionsCompleted++;
      } else if (item.evidenceStatus === 'UNDETERMINED') {
        undeterminedCount++;
      }
    }
  });

  return {
    studentId,
    totalReviewedSubmissions: reviewedSubmissions.length,
    totalRevisionAttempts: totalRevisionsCompleted + undeterminedCount,
    observedErrorCounts,
    evidenceItems,
    evidenceCoverage: {
      totalSubmissionsWithFeedback: reviewedSubmissions.length,
      totalRevisionsCompleted,
      undeterminedCount,
    },
  };
}
