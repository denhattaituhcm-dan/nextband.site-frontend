import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate, Link, useSearchParams, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { examsApi, submissionsApi, assessmentApi } from "@/lib/api";
import { resolveExitDestination } from "@/lib/exitContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  saveDraftLocally,
  loadDraftLocally,
  clearDraftLocally,
  ExamAnswersMap,
} from "@/lib/draftStore";
import {
  computeServerOffset,
  getTrustedRemainingSeconds,
  calculateExpiresAt,
} from "@/lib/trustedClock";
import { TabLeaseManager, TabLeaseRecord } from "@/lib/tabLeaseManager";
import {
  ExamSyncEngine,
  SyncVisualState,
  SubmissionFlowStatus,
} from "@/lib/examSyncEngine";
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
  AlertTriangle,
  ShieldCheck,
  WifiOff,
  AlertCircle,
  RefreshCw,
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
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [syncVisualState, setSyncVisualState] = useState<SyncVisualState>("LOCAL_SAVED");
  const [hasTabLease, setHasTabLease] = useState(true);
  const [activeTabLease, setActiveTabLease] = useState<TabLeaseRecord | null>(null);

  const autoSubmitTriggeredRef = useRef(false);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localDraftTimerRef = useRef<NodeJS.Timeout | null>(null);
  const draftVersionRef = useRef<number>(0);
  const localDraftRestoredRef = useRef<boolean>(false);
  const serverHydratedAtRef = useRef<number>(0);
  const answersRef = useRef<Record<string, any>>({});
  answersRef.current = answers;

  const syncEngineRef = useRef<ExamSyncEngine | null>(null);
  const tabLeaseManagerRef = useRef<TabLeaseManager | null>(null);
  const isSubmissionCompletedRef = useRef<boolean>(false);
  const isAssessment = searchParams.get("isAssessment") === "true";
  const assessmentSessionId = searchParams.get("sessionId") || "";

  const questionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const {
    data: examData,
    isLoading: examLoading,
    error: examError,
    refetch: refetchExam,
  } = useQuery({
    queryKey: ["exam", examId, isAssessment, assessmentSessionId],
    queryFn: () => {
      if (isAssessment) {
        return assessmentApi.getExam(examId!);
      }
      return examsApi.getById(examId!);
    },
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

  const explicitSubmissionId = searchParams.get("submissionId");

  // Create or fetch existing submission (LMS Student Mode only)
  const {
    data: submissionData,
    isLoading: submissionLoading,
    error: submissionError,
  } = useQuery({
    queryKey: ["exam-submission", examId, user?.id, explicitSubmissionId],
    queryFn: async () => {
      if (!user || !examId) return null;
      if (explicitSubmissionId) {
        const result = await submissionsApi.getById(explicitSubmissionId);
        if (result && result.examId && result.examId !== examId) {
          throw new Error("Bài làm không thuộc bài thi này (Exam ID mismatch)");
        }
        return result;
      }
      const result = await submissionsApi.start(examId);
      return result;
    },
    enabled: !isAssessment && !!examId && !!user && !!exam,
    retry: false,
  });

  const submission = submissionData;
  const submissionStartErrorMessage =
    (submissionError as any)?.response?.data?.error ||
    (submissionError as any)?.message ||
    "";

  // Initialize Tab Lease Manager & Sync Engine
  useEffect(() => {
    if (!submission?.id || !user?.id || !examId) return;

    // 1. Tab Lease Manager
    const leaseMgr = new TabLeaseManager(submission.id);
    tabLeaseManagerRef.current = leaseMgr;
    const unsubLease = leaseMgr.subscribe((hasLease, leaseRecord) => {
      setHasTabLease(hasLease);
      setActiveTabLease(leaseRecord);
    });
    leaseMgr.start();

    // 2. Exam Sync Engine
    const syncEngine = new ExamSyncEngine({
      submissionId: submission.id,
      userId: user.id,
      examId,
      onVisualStateChange: (state) => setSyncVisualState(state),
    });
    syncEngineRef.current = syncEngine;

    // 3. BeforeUnload UX Guard
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSubmissionCompletedRef.current) {
        e.preventDefault();
        e.returnValue = "Bạn đang có bài thi chưa hoàn tất. Rời khỏi có thể làm gián đoạn bài làm.";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      unsubLease();
      leaseMgr.destroy();
      syncEngine.destroy();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [submission?.id, user?.id, examId]);

  // Trusted Clock Timer Calculation
  useEffect(() => {
    if (!exam) return;

    if (isAssessment) {
      const remainingSec = (exam as any).sessionRemainingSeconds ?? ((exam.durationMinutes || 45) * 60);
      setInitialTimeLeft(remainingSec);
      return;
    }

    if (!submission) return;

    const durationMinutes = exam.durationMinutes || 60;
    const startedAt = submission.startedAt
      ? new Date(submission.startedAt).getTime()
      : Date.now();
    const expiresAt = calculateExpiresAt(startedAt, durationMinutes);
    const trustedRemaining = getTrustedRemainingSeconds(expiresAt);

    setInitialTimeLeft(trustedRemaining);
  }, [exam, submission?.startedAt, submission?.durationMinutes, isAssessment]);

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

  // 1. Restore offline local draft (Triple-key identity check + conflict check)
  useEffect(() => {
    if (!submission?.id || !user?.id || !examId || localDraftRestoredRef.current) return;

    let isMounted = true;
    (async () => {
      try {
        const result = await loadDraftLocally(submission.id, user.id, examId);
        if (!isMounted) return;

        if (result.status === "DRAFT_LOADED") {
          const draft = result.draft;
          draftVersionRef.current = draft.draftVersion;

          // Conflict check: Only restore if draft was saved after server baseline or server has no baseline
          const isNewerThanServer = !serverHydratedAtRef.current || draft.lastSavedAt >= serverHydratedAtRef.current;
          if (isNewerThanServer && Object.keys(draft.answers).length > 0) {
            setAnswers((prev) => {
              const merged = { ...draft.answers, ...prev };
              answersRef.current = merged;
              return merged;
            });
            localDraftRestoredRef.current = true;
            toast({
              title: "Đã khôi phục bản nháp",
              description: "Các câu trả lời offline đã được tự động khôi phục từ bộ nhớ cục bộ.",
            });
          }
        }
      } catch (err) {
        console.error("[DraftStore Restore Error]", err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [submission?.id, user?.id, examId, toast]);

  // 2. Restore saved answers from server
  useEffect(() => {
    if (savedAnswersData && savedAnswersData.length > 0) {
      serverHydratedAtRef.current = Date.now();
      const restored: Record<string, any> = {};
      savedAnswersData.forEach((a: any) => {
        if (!a.answerText) return;
        const parsed = safeJsonParse(a.answerText);
        restored[a.questionId] = parsed ?? a.answerText;
      });
      setAnswers((prev) => {
        const merged = { ...restored, ...prev };
        answersRef.current = merged;
        return merged;
      });
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
  }, [currentSection, paginationQuestions, currentQuestionId]);

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

  const handleAnswerChange = useCallback(
    (questionId: string, answer: any) => {
      if (!hasTabLease) return; // Prevent mutation if secondary tab

      setAnswers((prev) => {
        const next = { ...prev, [questionId]: answer };
        answersRef.current = next;
        return next;
      });

      // 1. Debounced Local Offline Persistence (300ms)
      if (submission?.id && user?.id && examId) {
        if (localDraftTimerRef.current) {
          clearTimeout(localDraftTimerRef.current);
        }
        localDraftTimerRef.current = setTimeout(async () => {
          try {
            const res = await saveDraftLocally(
              submission.id,
              user.id,
              examId,
              answersRef.current as ExamAnswersMap,
              draftVersionRef.current
            );
            if (res.status === "SAVE_SUCCESS") {
              draftVersionRef.current = res.version;
              syncEngineRef.current?.onLocalSaved();
            }
          } catch (err) {
            console.error("[DraftStore Save Error]", err);
          }
        }, 300);
      }

      // 2. Debounced Remote Backend Autosave (1500ms)
      if (submission?.id) {
        setSaveStatus("saving");
        syncEngineRef.current?.onServerSyncPending();
        if (autosaveTimerRef.current) {
          clearTimeout(autosaveTimerRef.current);
        }
        autosaveTimerRef.current = setTimeout(async () => {
          try {
            const currentAnswers = answersRef.current;
            const validQuestionIds = new Set(
              sections?.flatMap(
                (s: any) =>
                  (s.questionGroups || s.question_groups)?.flatMap((g: any) =>
                    (g.questions || []).map((q: any) => q.id),
                  ) || [],
              ) || [],
            );

            const answerEntries = Object.entries(currentAnswers)
              .filter(([qId]) => validQuestionIds.has(qId))
              .map(([qId, ansText]) => ({
                questionId: qId,
                answerText:
                  typeof ansText === "string"
                    ? ansText
                    : ansText != null
                    ? JSON.stringify(ansText)
                    : "",
              }));

            if (answerEntries.length > 0) {
              await submissionsApi.saveAnswers(submission.id, answerEntries);
            }
            setSaveStatus("saved");
            syncEngineRef.current?.onServerSyncSuccess();
          } catch (err) {
            console.error("[Autosave Error]", err);
            setSaveStatus("error");
            syncEngineRef.current?.onServerSyncError();
          }
        }, 1500);
      }

      // 3. Debounced Assessment Guest Autosave (1500ms)
      if (isAssessment && assessmentSessionId) {
        setSaveStatus("saving");
        if (autosaveTimerRef.current) {
          clearTimeout(autosaveTimerRef.current);
        }
        autosaveTimerRef.current = setTimeout(async () => {
          try {
            await assessmentApi.autosave(assessmentSessionId, answersRef.current);
            setSaveStatus("saved");
          } catch (err) {
            console.warn("[Assessment Autosave Notice]", err);
            setSaveStatus("error");
          }
        }, 1500);
      }
    },
    [submission?.id, sections, user?.id, examId, hasTabLease, isAssessment, assessmentSessionId],
  );

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
    // 1. Cancel pending debounce timer
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    // 2. Assessment Guest Mode Submission
    if (isAssessment && assessmentSessionId) {
      setIsSubmitting(true);
      try {
        const validQuestionIds = new Set(
          sections?.flatMap(
            (s: any) =>
              (s.questionGroups || s.question_groups)?.flatMap((g: any) =>
                (g.questions || []).map((q: any) => q.id),
              ) || [],
          ) || [],
        );

        const answerEntries = Object.entries(answers)
          .filter(([questionId]) => validQuestionIds.has(questionId))
          .map(([questionId, answerVal]) => {
            const isAudio =
              typeof answerVal === "string" &&
              (answerVal.startsWith("http://") ||
                answerVal.startsWith("https://") ||
                answerVal.startsWith("/uploads/"));
            return {
              questionId,
              answerText: typeof answerVal === "string" ? answerVal : JSON.stringify(answerVal),
              audioUrl: isAudio ? answerVal : undefined,
            };
          });

        await assessmentApi.submit(assessmentSessionId, answerEntries);
        isSubmissionCompletedRef.current = true;

        toast({
          title: "Nộp bài khảo thí thành công",
          description: "Hệ thống đã tính điểm và thiết lập báo cáo năng lực cho bạn.",
        });

        navigate(`/assessment/result/${assessmentSessionId}`);
        return;
      } catch (submitErr: any) {
        toast({
          title: "Lỗi nộp bài",
          description: submitErr.message || "Có lỗi xảy ra khi nộp bài khảo thí. Vui lòng thử lại.",
          variant: "destructive",
        });
        return;
      } finally {
        setIsSubmitting(false);
        setShowReviewDialog(false);
      }
    }

    if (!user || !examId || !submission || !syncEngineRef.current) return;

    setIsSubmitting(true);
    try {
      // 2. Collect all valid question answers
      const validQuestionIds = new Set(
        sections?.flatMap(
          (s: any) =>
            (s.questionGroups || s.question_groups)?.flatMap((g: any) =>
              (g.questions || []).map((q: any) => q.id),
            ) || [],
        ) || [],
      );

      const answerEntries = Object.entries(answers)
        .filter(([questionId]) => validQuestionIds.has(questionId))
        .map(([questionId, answerVal]) => {
          const isAudio = typeof answerVal === "string" && (answerVal.startsWith("http://") || answerVal.startsWith("https://") || answerVal.startsWith("/uploads/"));
          return {
            questionId,
            answerText: typeof answerVal === "string" ? answerVal : JSON.stringify(answerVal),
            audioUrl: isAudio ? answerVal : undefined,
          };
        });

      // 3. Submit atomically via Sync Engine (Atomic Enqueue -> Idempotent Post -> Reconciliation)
      const res = await syncEngineRef.current.submitExam(answerEntries);

      if (res.success && res.status === "SUBMITTED") {
        isSubmissionCompletedRef.current = true;
        await clearDraftLocally(submission.id);

        queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
        queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });

        const correctCount = res.result?.correctAnswers;
        const totalCount = res.result?.totalQuestions;
        const resultText =
          correctCount != null && totalCount != null
            ? ` - Kết quả: ${correctCount}/${totalCount} câu đúng`
            : "";

        toast({
          title: "Nộp bài thành công",
          description: `Bài tập của bạn đã được ghi nhận${resultText}`,
        });

        const isAssessment = searchParams.get("isAssessment") === "true";
        if (isAssessment) {
          navigate(`/assessment/result/${submission.id}`);
          return;
        }

        const exitDestination = resolveExitDestination(
          exam,
          searchParams,
          location.state,
        );
        navigate(
          `/app/submissions/${submission.id}?returnUrl=${encodeURIComponent(
            exitDestination,
          )}`,
          {
            state: {
              exitContext: { destination: exitDestination },
              returnUrl: exitDestination,
            },
          },
        );
      } else if (res.status === "UNKNOWN" || res.status === "LOCAL_SEALED") {
        toast({
          title: "Bài làm đã được niêm phong an toàn",
          description: res.error || "Hệ thống đang tự động kết nối lại máy chủ để xác nhận bài nộp.",
        });
      } else {
        toast({
          title: "Lỗi nộp bài",
          description: res.error || "Có lỗi xảy ra khi nộp bài. Bài làm vẫn được bảo vệ trên máy.",
          variant: "destructive",
        });
      }
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

  if (examLoading || (!isAssessment && submissionLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAssessment && submissionError) {
    const isAttemptLimitError =
      (submissionError as any)?.response?.status === 409 ||
      submissionStartErrorMessage.includes("lượt làm bài");

    const isGatewayColdStartOrNetwork =
      submissionStartErrorMessage.toLowerCase().includes("fetch") ||
      submissionStartErrorMessage.toLowerCase().includes("network") ||
      submissionStartErrorMessage.toLowerCase().includes("502") ||
      submissionStartErrorMessage.toLowerCase().includes("kết nối") ||
      submissionStartErrorMessage.toLowerCase().includes("máy chủ");

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        {isGatewayColdStartOrNetwork ? (
          <div className="w-16 h-16 rounded-2xl bg-warning/10 text-warning flex items-center justify-center mx-auto mb-2">
            <WifiOff className="h-8 w-8" />
          </div>
        ) : (
          <FileText className="h-16 w-16 text-muted-foreground/50" />
        )}
        <h2 className="text-xl font-semibold">
          {isAttemptLimitError
            ? "Đã hết lượt làm bài"
            : isGatewayColdStartOrNetwork
            ? "Máy chủ phòng thi đang khởi động"
            : "Không thể bắt đầu bài thi"}
        </h2>
        <p className="text-muted-foreground max-w-md text-sm">
          {isGatewayColdStartOrNetwork
            ? "Máy chủ chấm điểm & phòng thi (Fastify API) đang được đánh thức hoặc tạm gián đoạn. Vui lòng bấm 'Thử lại ngay' sau vài giây."
            : submissionStartErrorMessage ||
              "Có lỗi xảy ra khi khởi tạo bài thi. Vui lòng thử lại sau."}
        </p>
        <div className="flex items-center gap-3">
          {isGatewayColdStartOrNetwork && (
            <Button onClick={() => refetchSubmission()} className="gap-2 font-semibold shadow-xs">
              <RefreshCw className="h-4 w-4" />
              Thử lại ngay
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to={exam?.course ? `/course/${exam.course.id}` : "/"}>
              Quay lại khóa học
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/my-submissions">Xem bài đã làm</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (examError || !exam) {
    const httpStatus = (examError as any)?.httpStatus || (examError as any)?.status;
    const errorMessage = (examError as any)?.message || "";

    const is401 = httpStatus === 401 || errorMessage.includes("hết hạn") || errorMessage.includes("AUTH_REQUIRED");
    const is403 = httpStatus === 403 || errorMessage.includes("quyền truy cập") || errorMessage.includes("CLASS_ACCESS_DENIED");
    const is404 = httpStatus === 404 || errorMessage.includes("Không tìm thấy");
    const isNetwork = httpStatus === 503 || errorMessage.includes("máy chủ") || errorMessage.includes("kết nối") || errorMessage.includes("fetch");

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          <h2 className="text-xl font-bold">
            {is401
              ? "Phiên đăng nhập đã hết hạn"
              : is403
              ? "Từ chối quyền truy cập bài thi"
              : is404
              ? "Không tìm thấy bài thi"
              : isNetwork
              ? "Không thể kết nối máy chủ"
              : "Có lỗi xảy ra khi tải bài thi"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {is401
              ? "Vui lòng đăng nhập lại để tiếp tục làm bài."
              : is403
              ? "Bạn chưa được phân quyền vào lớp học hoặc khóa học chứa bài thi này."
              : is404
              ? "Bài tập này không tồn tại hoặc đã bị xóa khỏi hệ thống."
              : isNetwork
              ? "Không thể kết nối tới máy chủ. Vui lòng kiểm tra lại kết nối mạng."
              : errorMessage || "Hệ thống đang gặp sự cố. Vui lòng thử lại sau."}
          </p>
        </div>
        <div className="flex items-center gap-3 pt-2">
          {is401 ? (
            <Button asChild className="font-bold rounded-xl">
              <Link to="/login">Đăng nhập lại</Link>
            </Button>
          ) : (
            <>
              <Button onClick={() => refetchExam()} className="font-bold rounded-xl gap-2">
                <RefreshCw className="w-4 h-4" />
                Thử lại
              </Button>
              <Button variant="outline" asChild className="font-bold rounded-xl">
                <Link to="/app">Quay về trang chủ</Link>
              </Button>
            </>
          )}
        </div>
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
          <Link to="/app">Quay về trang chủ</Link>
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

      {/* Exam Focus Mode Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/75 shadow-xs">
        {/* Muted Spatial Anchor Strip - Training/Exam Realm */}
        <div className="h-1 w-full bg-indigo-600/80" />

        <div className="flex h-14 md:h-16 items-center justify-between px-3 md:px-6 gap-2">
          {/* Left: Exit + Space Tag + Title */}
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExitDialog(true)}
              className="text-muted-foreground hover:text-foreground font-medium text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Rời bài tập
            </Button>
            <div className="h-4 w-[1px] bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block" />
                Phòng Làm Bài
              </span>
              {searchParams.get("isRevision") === "true" && (
                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700 items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  Bài Sửa (Attempt 2)
                </span>
              )}
              <h1 className="font-bold text-sm md:text-base tracking-tight truncate max-w-[160px] sm:max-w-[220px] md:max-w-none">
                {exam.title}
              </h1>
            </div>
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
            {syncVisualState === "SERVER_SYNC_PENDING" && (
              <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 animate-pulse">
                ● Đang đồng bộ...
              </span>
            )}
            {syncVisualState === "SERVER_SYNCED" && (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                ✓ Đã đồng bộ máy chủ
              </span>
            )}
            {syncVisualState === "LOCAL_SAVED" && (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                ✓ Đã lưu trên máy
              </span>
            )}
            {syncVisualState === "SERVER_UNREACHABLE" && (
              <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                <WifiOff className="w-3.5 h-3.5" />
                ⚠️ Ngắt kết nối (Đã lưu an toàn)
              </span>
            )}
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

      {/* Multi-Tab Secondary Warning Banner */}
      {!hasTabLease && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between gap-4 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>Chế độ chỉ xem:</strong> Bài thi này đang hoạt động ở một Tab khác. Các chỉnh sửa ở Tab này đã được tạm khóa để chống ghi đè chéo.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => tabLeaseManagerRef.current?.forceTakeover()}
            className="shrink-0 h-7 text-xs font-bold border-amber-500/40 hover:bg-amber-500/20"
          >
            Chuyển quyền làm bài sang Tab này
          </Button>
        </div>
      )}

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
