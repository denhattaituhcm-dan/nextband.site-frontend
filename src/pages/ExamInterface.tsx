import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate, Link, useSearchParams, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { examsApi, submissionsApi } from "@/lib/api";
import { resolveExitDestination } from "@/lib/exitContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Clock,
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  FileText,
  ChevronLeft,
  ChevronRight,
  Send,
  Eye,
  Flag,
  X,
} from "lucide-react";
import { ListeningSection } from "@/components/exam/ListeningSection";
import { ReadingSection } from "@/components/exam/ReadingSection";
import { WritingSection } from "@/components/exam/WritingSection";
import { SpeakingSection } from "@/components/exam/SpeakingSection";
import { GrammarSection } from "@/components/exam/GrammarSection";
import { ExamTimer } from "@/components/exam/ExamTimer";
import { QuestionPagination } from "@/components/exam/QuestionPagination";
import { ExamReviewDialog } from "@/components/exam/ExamReviewDialog";
import { ActorAwareUnavailableScreen } from "@/components/exam/ActorAwareUnavailableScreen";
import { evaluateContentContract } from "@/lib/contentContract";
import { SEO } from "@/components/common/SEO";
import { getFillBlankBlankCount } from "@/lib/fillBlank";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const safeJsonParse = (value: string | undefined | null) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

type SectionType = "listening" | "reading" | "writing" | "speaking" | "general";

const sectionIcons = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenTool,
  speaking: Mic,
  general: FileText,
};

const sectionLabels = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
  general: "Grammar",
};

export default function ExamInterface() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeSection, setActiveSection] = useState<SectionType | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(
    new Set(),
  );
  const [currentQuestionId, setCurrentQuestionId] = useState<
    string | undefined
  >();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [initialTimeLeft, setInitialTimeLeft] = useState<number | null>(null);
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const autoSubmitTriggeredRef = useRef(false);

  const questionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const { data: examData, isLoading: examLoading } = useQuery({
    queryKey: ["exam", examId],
    queryFn: () => examsApi.getById(examId!),
    enabled: !!examId,
  });

  const exam = examData;
  const sections = exam?.sections || [];

  const availableSections = useMemo(() => {
    return (sections || []).filter((s: any) => {
      const groups = s.questionGroups || s.question_groups || [];
      return groups.some(
        (g: any) => Array.isArray(g.questions) && g.questions.length > 0,
      );
    });
  }, [sections]);

  // Create or fetch existing submission
  const {
    data: submissionData,
    isLoading: submissionLoading,
    error: submissionError,
  } = useQuery({
    queryKey: ["exam-submission", examId, user?.id],
    queryFn: async () => {
      if (!user || !examId) return null;
      const result = await submissionsApi.start(examId);
      return result;
    },
    enabled: !!examId && !!user && !!exam,
    retry: false,
  });

  const submission = submissionData;
  const submissionStartErrorMessage =
    (submissionError as any)?.response?.data?.error ||
    (submissionError as any)?.message ||
    "";

  useEffect(() => {
    if (!exam) return;

    if (typeof submission?.remainingSeconds === "number") {
      setInitialTimeLeft(Math.max(0, submission.remainingSeconds));
      return;
    }

    const durationSeconds = (exam.durationMinutes || 60) * 60;
    if (!submission?.startedAt) {
      setInitialTimeLeft(durationSeconds);
      return;
    }
    const startedAt = new Date(submission.startedAt).getTime();
    if (!Number.isFinite(startedAt)) {
      setInitialTimeLeft(durationSeconds);
      return;
    }
    const elapsedSeconds = Math.max(
      0,
      Math.floor((Date.now() - startedAt) / 1000),
    );
    setInitialTimeLeft(Math.max(0, durationSeconds - elapsedSeconds));
  }, [exam, submission?.remainingSeconds, submission?.startedAt]);

  useEffect(() => {
    autoSubmitTriggeredRef.current = false;
  }, [submission?.id]);

  // Load existing answers if resuming
  const { data: savedAnswersData } = useQuery({
    queryKey: ["exam-saved-answers", submission?.id],
    queryFn: async () => {
      if (!submission?.id) return [];
      const result = await submissionsApi.getById(submission.id);
      return result?.answers || [];
    },
    enabled: !!submission?.id,
  });

  // Restore saved answers
  useEffect(() => {
    if (savedAnswersData && savedAnswersData.length > 0) {
      const restored: Record<string, any> = {};
      savedAnswersData.forEach((a: any) => {
        if (!a.answerText) return;
        const parsed = safeJsonParse(a.answerText);
        restored[a.questionId] = parsed ?? a.answerText;
      });
      setAnswers((prev) => ({ ...restored, ...prev }));
    }
  }, [savedAnswersData]);

  // Set default active section
  useEffect(() => {
    if (availableSections.length > 0 && !activeSection) {
      setActiveSection(availableSections[0].sectionType as SectionType);
    }
  }, [availableSections, activeSection]);

  const currentSectionIndex = availableSections.findIndex(
    (s: any) => s.sectionType === activeSection,
  );

  const currentSection = availableSections[currentSectionIndex];

  const sectionHasQuestions = useMemo(() => {
    if (!currentSection) return false;
    const groups =
      currentSection.questionGroups || currentSection.question_groups || [];
    return groups.some((g: any) => g.questions && g.questions.length > 0);
  }, [currentSection]);

  // Get all questions for pagination — must be sorted identically to how section components render them
  const currentSectionQuestions = useMemo(() => {
    if (!currentSection || !sectionHasQuestions) return [];

    const sortedGroups = [
      ...(currentSection.questionGroups ||
        currentSection.question_groups ||
        []),
    ].sort((a: any, b: any) => {
      const orderDiff =
        (a.orderIndex ?? a.order_index ?? 0) -
        (b.orderIndex ?? b.order_index ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return (
        new Date(a.createdAt ?? 0).getTime() -
        new Date(b.createdAt ?? 0).getTime()
      );
    });

    return sortedGroups.flatMap((g: any) =>
      [...(g.questions || [])]
        .sort((a: any, b: any) => {
          const orderDiff =
            (a.orderIndex ?? a.order_index ?? 0) -
            (b.orderIndex ?? b.order_index ?? 0);
          if (orderDiff !== 0) return orderDiff;
          return (
            new Date(a.createdAt ?? 0).getTime() -
            new Date(b.createdAt ?? 0).getTime()
          );
        })
        .map((q: any) => ({ ...q, groupId: g.id })),
    );
  }, [currentSection, sectionHasQuestions]);

  const paginationQuestions = useMemo(() => {
    const list: any[] = [];
    let displayCursor = 0;
    currentSectionQuestions.forEach((q) => {
      // Split fill_blank into sub-questions
      if (q.questionType === "fill_blank") {
        const blankCount = getFillBlankBlankCount(q.correctAnswer);
        if (blankCount > 0) {
          for (let idx = 0; idx < blankCount; idx++) {
            displayCursor += 1;
            list.push({
              ...q,
              isSubQuestion: true,
              subIndex: String(idx),
              focusId: `${q.id}::blank:${idx}`,
              displayNumber: displayCursor,
              displayLabel: String(displayCursor),
            });
          }
          return;
        }
      }

      // Split matching into sub-questions based on items
      if (q.questionType === "matching" && q.correctAnswer) {
        try {
          const parsed = JSON.parse(q.correctAnswer);
          if (
            typeof parsed === "object" &&
            parsed !== null &&
            Array.isArray(parsed.items)
          ) {
            if (parsed.items.length > 0) {
              parsed.items.forEach((_, idx) => {
                displayCursor += 1;
                list.push({
                  ...q,
                  isSubQuestion: true,
                  subIndex: String(idx),
                  displayNumber: displayCursor,
                  displayLabel: String(displayCursor),
                });
              });
              return;
            }
          }
        } catch {
          // fallback
        }
      }

      displayCursor += 1;
      list.push({
        ...q,
        displayNumber: displayCursor,
        displayLabel: String(displayCursor),
      });
    });
    return list;
  }, [currentSectionQuestions]);

  const answeredCount = useMemo(() => {
    return paginationQuestions.filter((q: any) => {
      const val = answers[q.id];
      if (q.isSubQuestion && q.subIndex !== undefined) {
        if (val && typeof val === "object") {
          const subVal = val[q.subIndex];
          return typeof subVal === "string" && subVal.trim().length > 0;
        }
        return false;
      }
      if (Array.isArray(val)) return val.length > 0;
      if (typeof val === "string") return val.trim().length > 0;
      if (val && typeof val === "object") {
        return Object.values(val).some(
          (item) => typeof item === "string" && item.trim().length > 0,
        );
      }
      return false;
    }).length;
  }, [paginationQuestions, answers]);

  const currentQuestionIndex = useMemo(() => {
    if (!currentQuestionId || paginationQuestions.length === 0) return -1;
    return paginationQuestions.findIndex(
      (q: any) => (q.focusId || q.id) === currentQuestionId,
    );
  }, [currentQuestionId, paginationQuestions]);

  useEffect(() => {
    if (
      currentSection &&
      paginationQuestions.length > 0 &&
      !currentQuestionId
    ) {
      setCurrentQuestionId(paginationQuestions[0].focusId || paginationQuestions[0].id);
    }
  const isProgrammaticScrollRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (isProgrammaticScrollRef.current) return;
      if (questionRefs.current.size === 0) return;

      const viewportCenter = window.innerHeight / 2;
      let closestId: string | null = null;
      let minDistance = Infinity;

      questionRefs.current.forEach((el, qId) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.bottom >= 80 && rect.top <= window.innerHeight - 80) {
          const elCenter = (rect.top + rect.bottom) / 2;
          const distance = Math.abs(elCenter - viewportCenter);
          if (distance < minDistance) {
            minDistance = distance;
            closestId = qId;
          }
        }
      });

      if (closestId && closestId !== currentQuestionId) {
        setCurrentQuestionId(closestId);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [currentQuestionId, activeSection]);

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevQuestion = paginationQuestions[currentQuestionIndex - 1];
      handleQuestionClick(prevQuestion.focusId || prevQuestion.id);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < paginationQuestions.length - 1) {
      const nextQuestion = paginationQuestions[currentQuestionIndex + 1];
      handleQuestionClick(nextQuestion.focusId || nextQuestion.id);
    }
  };

  const handleAnswerChange = useCallback((questionId: string, answer: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, []);

  const handleQuestionClick = useCallback((questionId: string) => {
    setCurrentQuestionId(questionId);
    isProgrammaticScrollRef.current = true;
    const element =
      questionRefs.current.get(questionId) ||
      (questionId.includes("::blank:")
        ? questionRefs.current.get(questionId.split("::blank:")[0])
        : undefined);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 600);
  }, []);

  const handleToggleFlag = useCallback((questionId: string) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  }, []);

  const handleGoToQuestion = useCallback(
    (sectionType: string, questionId: string) => {
      const targetSection = sections.find(
        (section: any) => section.sectionType === sectionType,
      );
      const targetQuestion = (targetSection?.questionGroups ||
        targetSection?.question_groups ||
        [])
        .flatMap((group: any) => group.questions || [])
        .find((question: any) => question.id === questionId);
      const focusId =
        targetQuestion?.questionType === "fill_blank" ||
        targetQuestion?.question_type === "fill_blank"
          ? `${questionId}::blank:0`
          : questionId;

      setActiveSection(sectionType as SectionType);
      setCurrentQuestionId(focusId);
      setTimeout(() => {
        const element =
          questionRefs.current.get(focusId) ||
          questionRefs.current.get(questionId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    },
    [sections],
  );

  const handleSubmit = useCallback(async () => {
    if (!user || !examId || !submission) return;

    setIsSubmitting(true);
    try {
      // Collect all valid question IDs from loaded sections to filter out invalid keys
      const validQuestionIds = new Set(
        sections?.flatMap(
          (s: any) =>
            (s.questionGroups || s.question_groups)?.flatMap((g: any) =>
              (g.questions || []).map((q: any) => q.id),
            ) || [],
        ) || [],
      );

      // Only submit answers whose keys are valid question IDs
      const answerEntries = Object.entries(answers)
        .filter(([questionId]) => validQuestionIds.has(questionId))
        .map(([questionId, answerText]) => ({
          questionId,
          answerText:
            typeof answerText === "string"
              ? answerText
              : JSON.stringify(answerText),
        }));

      const result = await submissionsApi.submit(submission.id, answerEntries);

      queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });

      const correctCount = result?.correctAnswers;
      const totalCount = result?.totalQuestions;
      const resultText =
        correctCount != null && totalCount != null
          ? ` - Kết quả: ${correctCount}/${totalCount} câu đúng`
          : "";

      toast({
        title: "Nộp bài thành công",
        description: `bài tập của bạn đã được ghi nhận${resultText}`,
      });

      const exitDestination = resolveExitDestination(
        exam,
        searchParams,
        location.state,
      );
      navigate(
        `/submissions/${submission.id}?returnUrl=${encodeURIComponent(
          exitDestination,
        )}`,
        {
          state: {
            exitContext: { destination: exitDestination },
            returnUrl: exitDestination,
          },
        },
      );
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowReviewDialog(false);
    }
  }, [
    answers,
    exam,
    examId,
    location.state,
    navigate,
    queryClient,
    searchParams,
    sections,
    submission,
    toast,
    user,
  ]);

  const handleTimeUp = useCallback(() => {
    if (autoSubmitTriggeredRef.current) return;
    autoSubmitTriggeredRef.current = true;
    toast({
      title: "Hết giờ!",
      description: "bài tập sẽ được nộp tự động.",
      variant: "destructive",
    });
    handleSubmit();
  }, [handleSubmit, toast]);

  if (examLoading || submissionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (submissionError) {
    const isAttemptLimitError =
      (submissionError as any)?.response?.status === 409 ||
      submissionStartErrorMessage.includes("lượt làm bài");

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <FileText className="h-16 w-16 text-muted-foreground/50" />
        <h2 className="text-xl font-semibold">
          {isAttemptLimitError ? "Đã hết lượt làm bài" : "Không thể bắt đầu bài thi"}
        </h2>
        <p className="text-muted-foreground max-w-md">
          {submissionStartErrorMessage ||
            "Có lỗi xảy ra khi khởi tạo bài thi. Vui lòng thử lại sau."}
        </p>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link to={exam?.course ? `/course/${exam.course.id}` : "/"}>
              Quay lại khóa học
            </Link>
          </Button>
          <Button asChild>
            <Link to="/my-submissions">Xem bài đã làm</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">Không tìm thấy bài thi</h2>
        <p className="text-muted-foreground">
          bài tập không tồn tại hoặc bạn không có quyền truy cập.
        </p>
        <Button asChild>
          <Link to="/">Quay về trang chủ</Link>
        </Button>
      </div>
    );
  }

  // Content Contract Guard (Publish-Time / Static Structure Check)
  const contractEvaluation = evaluateContentContract(exam);
  if (!contractEvaluation.isReady) {
    return (
      <ActorAwareUnavailableScreen
        examTitle={exam.title}
        courseId={exam.courseId || exam.course?.id}
        userRole={user?.role || "student"}
        status={contractEvaluation.status}
        violations={contractEvaluation.violations}
      />
    );
  }

  if (availableSections.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <FileText className="h-16 w-16 text-muted-foreground/50" />
        <h2 className="text-xl font-semibold">{exam.title}</h2>
        <p className="text-muted-foreground">
          bài tập này chưa được cấu hình phần thi nào. Vui lòng liên hệ giáo
          viên.
        </p>
        <Button asChild variant="outline">
          <Link to="/">Quay về trang chủ</Link>
        </Button>
      </div>
    );
  }

  const isGrammarExam = exam.examType === "grammar";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* SEO */}
      <SEO
        title={exam?.title || "Đang tải bài thi..."}
        description={`Luyện thi IELTS: ${exam?.title}. Nâng band điểm IELTS cùng NextBand.`}
      />

      {/* Exam Mode Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/75 shadow-xs">
        <div className="flex h-14 md:h-16 items-center justify-between px-3 md:px-6 gap-2">
          {/* Left: Exit + Title */}
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExitDialog(true)}
              className="text-muted-foreground hover:text-foreground font-semibold text-xs"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Rời bài
            </Button>
            <div className="h-4 w-[1px] bg-border hidden sm:block" />
            <h1 className="font-bold text-sm md:text-base tracking-tight truncate max-w-[180px] sm:max-w-[240px] md:max-w-none">
              {exam.title}
            </h1>
          </div>

          {/* Center: Real-time Context State */}
          <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-muted/50 border border-border/80 text-xs font-medium">
            <span className="font-bold uppercase tracking-wider text-primary">
              {currentSection?.title && currentSection.title.toLowerCase() !== "general"
                ? currentSection.title
                : sectionLabels[activeSection as SectionType] || activeSection || "EXAM"}
            </span>
            <span className="text-muted-foreground/60">•</span>
            <span className="font-semibold text-foreground/90">
              Câu {currentQuestionIndex >= 0 ? currentQuestionIndex + 1 : 1}/{paginationQuestions.length}
            </span>
            <span className="text-muted-foreground/60">•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              ✓ Đã lưu tự động
            </span>
            <span className="text-muted-foreground/40">|</span>
            <span className="text-muted-foreground font-medium">
              Đã làm {answeredCount}/{paginationQuestions.length}
            </span>
          </div>

          {/* Right: Timer & Action CTAs */}
          <div className="flex items-center gap-3 shrink-0">
            <ExamTimer
              duration={exam.durationMinutes || 60}
              initialSeconds={
                initialTimeLeft ?? (exam.durationMinutes || 60) * 60
              }
              onTimeUp={handleTimeUp}
              size="small"
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReviewDialog(true)}
                className="hidden sm:inline-flex"
              >
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                Xem lại
              </Button>
              <Button
                size="sm"
                onClick={() => setShowReviewDialog(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xs"
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Nộp bài
              </Button>
            </div>
          </div>
        </div>

        {/* Section Tabs (for multi-section IELTS exams) */}
        {!isGrammarExam && availableSections.length > 1 && (
          <div className="border-t bg-muted/20 px-4 py-1.5">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {availableSections.map((section: any) => {
                const Icon =
                  sectionIcons[section.sectionType as SectionType] || FileText;
                const isActive = activeSection === section.sectionType;

                return (
                  <Button
                    key={section.id}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setActiveSection(section.sectionType as SectionType);
                      setCurrentQuestionId(undefined);
                    }}
                    className={`h-8 text-xs font-semibold flex items-center gap-1.5 rounded-md ${
                      isActive ? "bg-primary text-primary-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {section.title && section.title.toLowerCase() !== "general"
                      ? section.title
                      : sectionLabels[section.sectionType as SectionType] || section.title || "Bài tập"}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {currentSection && activeSection === "listening" && (
          <ListeningSection
            section={currentSection}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            questionRefs={questionRefs}
            currentQuestionId={currentQuestionId}
            onQuestionFocus={setCurrentQuestionId}
          />
        )}
        {currentSection && activeSection === "reading" && (
          <ReadingSection
            section={currentSection}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            questionRefs={questionRefs}
            currentQuestionId={currentQuestionId}
            onQuestionFocus={setCurrentQuestionId}
          />
        )}
        {currentSection && activeSection === "writing" && (
          <WritingSection
            section={currentSection}
            answers={answers}
            onAnswerChange={handleAnswerChange}
          />
        )}
        {currentSection && activeSection === "speaking" && (
          <SpeakingSection
            section={currentSection}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            onRecordingStateChange={setIsRecordingActive}
            questionRefs={questionRefs}
            currentQuestionId={currentQuestionId}
            onQuestionFocus={setCurrentQuestionId}
          />
        )}
        {currentSection && (activeSection === "general" || isGrammarExam) && (
          <GrammarSection
            section={currentSection}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            questionRefs={questionRefs}
            currentQuestionId={currentQuestionId}
            onQuestionFocus={setCurrentQuestionId}
          />
        )}
      </main>

      {/* Footer with Question Pagination */}
      <footer className="border-t bg-background p-4">
        <div className="max-w-6xl mx-auto">
          {/* Pagination Bubbles */}
          {paginationQuestions.length > 0 && (
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex <= 0}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Câu trước
              </Button>

              <div className="flex-1 flex justify-center overflow-x-auto py-2">
                <QuestionPagination
                  questions={paginationQuestions}
                  answers={answers}
                  flaggedQuestions={flaggedQuestions}
                  currentQuestionId={currentQuestionId}
                  onQuestionClick={handleQuestionClick}
                  onToggleFlag={handleToggleFlag}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextQuestion}
                disabled={
                  currentQuestionIndex >= paginationQuestions.length - 1
                }
              >
                Câu sau
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </footer>

      {/* Review Dialog */}
      <ExamReviewDialog
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        sections={availableSections}
        answers={answers}
        flaggedQuestions={flaggedQuestions}
        onGoToQuestion={handleGoToQuestion}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Safe Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Rời khỏi bài thi?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Bài làm của bạn đã được hệ thống lưu tự động. Bạn có thể quay lại tiếp tục làm bài bất cứ lúc nào trước khi hết thời gian.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="rounded-xl font-semibold">Tiếp tục làm bài</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const destination = resolveExitDestination(
                  exam,
                  searchParams,
                  location.state,
                );
                navigate(destination);
              }}
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
            >
              Rời bài thi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
