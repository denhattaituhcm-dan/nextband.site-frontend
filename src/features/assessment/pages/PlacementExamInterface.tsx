import React, { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { SEO } from "@/components/common/SEO";
import { useAssessmentSession } from "../hooks/useAssessmentSession";
import { useAssessmentTimer } from "../hooks/useAssessmentTimer";
import { AssessmentHeader } from "../components/AssessmentHeader";
import { SkillTabs } from "../components/SkillTabs";
import { QuestionPalette } from "../components/QuestionPalette";
import { ListeningPanel } from "../components/ListeningPanel";
import { ReadingPanel } from "../components/ReadingPanel";
import { GrammarPanel } from "../components/GrammarPanel";
import { WritingPanel } from "../components/WritingPanel";
import { SpeakingPanel } from "../components/SpeakingPanel";
import { AssessmentSubmitDialog } from "../components/AssessmentSubmitDialog";
import { AssessmentSkill, AssessmentQuestion } from "../domain/assessment.types";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, RefreshCw, ArrowLeft, FileQuestion } from "lucide-react";
import { assessmentApi } from "@/lib/api";
import { toast } from "sonner";

export default function PlacementExamInterface() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [activeSkill, setActiveSkill] = useState<AssessmentSkill>("listening");
  const [currentQuestionId, setCurrentQuestionId] = useState<string | undefined>();
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    session,
    testPayload,
    answers,
    setAnswer,
    clearLocalDraft,
    isLoading,
    error,
    saveStatus,
  } = useAssessmentSession(sessionId);

  const handleTimeUp = useCallback(async () => {
    toast.error("Hết thời gian làm bài! Hệ thống đang tự động nộp bài cho bạn.");
    handleFinalSubmit();
  }, [sessionId, answers]);

  const { formattedTime, isUrgent } = useAssessmentTimer(
    session?.remainingSeconds || 3600,
    handleTimeUp,
  );

  // Skill Question Completion Statistics
  const skillCounts = useMemo(() => {
    const counts: Record<AssessmentSkill, { answered: number; total: number }> = {
      listening: { answered: 0, total: 0 },
      reading: { answered: 0, total: 0 },
      grammar: { answered: 0, total: 0 },
      writing: { answered: 0, total: 1 },
      speaking: { answered: 0, total: 2 },
    };

    if (testPayload) {
      const calcSkill = (skillQuestions: AssessmentQuestion[]) => {
        let total = 0;
        let answered = 0;
        skillQuestions.forEach((q) => {
          if (q.blankCount && q.blankCount > 1) {
            total += q.blankCount;
            const qAns = typeof answers[q.id] === "object" ? answers[q.id] || {} : {};
            for (let b = 0; b < q.blankCount; b++) {
              const val = qAns[b] ?? qAns[String(b)];
              if (val != null && String(val).trim() !== "") {
                answered++;
              }
            }
          } else {
            total += 1;
            if (answers[q.id] != null && String(answers[q.id]).trim() !== "") {
              answered++;
            }
          }
        });
        return { total, answered };
      };

      counts.listening = calcSkill(testPayload.skills.listening.questions);
      counts.reading = calcSkill(testPayload.skills.reading.questions);
      counts.grammar = calcSkill(testPayload.skills.grammar.questions);

      counts.writing.answered =
        answers["writing_response"] && String(answers["writing_response"]).trim().length > 0 ? 1 : 0;
      counts.speaking.answered =
        (answers["speaking_part1_audio_url"] ? 1 : 0) +
        (answers["speaking_part2_audio_url"] ? 1 : 0);
    }

    return counts;
  }, [testPayload, answers]);

  const handleSelectQuestion = (questionId: string) => {
    setCurrentQuestionId(questionId);
    const element = document.getElementById(`question-${questionId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleFinalSubmit = async () => {
    if (!sessionId) return;
    setIsSubmitting(true);

    try {
      const res = await assessmentApi.submit(sessionId, answers);
      clearLocalDraft();
      toast.success("Nộp bài khảo thí thành công! Đang chuyển đến Báo cáo năng lực ARIS-7.");
      navigate(`/assessment/result/${sessionId}`);
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
      setIsSubmitDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="w-9 h-9 animate-spin text-brand-blue" />
        <p className="text-sm text-muted-foreground font-medium">Đang thiết lập phòng thi khảo thí chẩn đoán...</p>
      </div>
    );
  }

  if (error || !testPayload || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center bg-background">
        <div className="w-16 h-16 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto shadow-xs">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1.5 max-w-md">
          <h3 className="text-xl font-extrabold text-foreground">Không Thể Truy Cập Phòng Thi</h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {error || "Phiên khảo thí không hợp lệ hoặc đã hết hạn làm bài."}
          </p>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Button asChild className="rounded-xl font-bold text-xs bg-brand-red hover:bg-brand-red-hover text-white shadow-md">
            <Link to="/assessment">Đăng ký phiên mới</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl font-bold text-xs">
            <Link to="/">Quay về trang chủ</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Active Questions for Palette
  const currentSkillQuestions =
    activeSkill === "listening"
      ? testPayload.skills.listening.questions
      : activeSkill === "reading"
      ? testPayload.skills.reading.questions
      : activeSkill === "grammar"
      ? testPayload.skills.grammar.questions
      : [];

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <SEO
        title={`Phòng Khảo Thí ARIS — ${session.candidateName}`}
        description="Làm bài khảo thí chẩn đoán 4 kỹ năng Listening, Reading, Grammar, Writing, Speaking để định vị Rank ARIS-7."
      />

      {/* Focus Mode Header */}
      <AssessmentHeader
        candidateName={session.candidateName}
        targetBand={session.targetBand}
        formattedTime={formattedTime}
        isUrgent={isUrgent}
        saveStatus={saveStatus}
        onOpenSubmitDialog={() => setIsSubmitDialogOpen(true)}
        isSubmitting={isSubmitting}
      />

      {/* Main Assessment Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Skill Tabs */}
        <SkillTabs
          activeSkill={activeSkill}
          onSelectSkill={(skill) => {
            setActiveSkill(skill);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          skillCounts={skillCounts}
        />

        {/* Content Layout - Full Width for Maximum Reading & Question Comfort */}
        <div className="w-full space-y-6 pb-24">
          {activeSkill === "listening" && (
            <ListeningPanel
              title={testPayload.skills.listening.title}
              audioUrl={testPayload.skills.listening.audioUrl}
              questions={testPayload.skills.listening.questions}
              answers={answers}
              onAnswerChange={setAnswer}
            />
          )}

          {activeSkill === "reading" && (
            <ReadingPanel
              title={testPayload.skills.reading.title}
              passage={testPayload.skills.reading.passage}
              questions={testPayload.skills.reading.questions}
              answers={answers}
              onAnswerChange={setAnswer}
            />
          )}

          {activeSkill === "grammar" && (
            <GrammarPanel
              title={testPayload.skills.grammar.title}
              questions={testPayload.skills.grammar.questions}
              answers={answers}
              onAnswerChange={setAnswer}
            />
          )}

          {activeSkill === "writing" && (
            <WritingPanel
              title={testPayload.skills.writing.title}
              prompt={testPayload.skills.writing.prompt}
              guidelines={testPayload.skills.writing.guidelines}
              maxWords={testPayload.skills.writing.maxWords || 350}
              value={answers["writing_response"] || ""}
              onChange={(val) => setAnswer("writing_response", val)}
            />
          )}

          {activeSkill === "speaking" && (
            <SpeakingPanel
              sessionId={sessionId!}
              title={testPayload.skills.speaking.title}
              part1Questions={testPayload.skills.speaking.part1Questions}
              part2Topic={testPayload.skills.speaking.part2Topic}
              part2Cues={testPayload.skills.speaking.part2Cues}
              onPart1Recorded={(path) => setAnswer("speaking_part1_audio_url", path)}
              onPart2Recorded={(path) => setAnswer("speaking_part2_audio_url", path)}
            />
          )}
        </div>
      </main>

      {/* Floating Bottom Question Palette Bar for Objective Skills */}
      {currentSkillQuestions.length > 0 && (
        <QuestionPalette
          questions={currentSkillQuestions}
          answers={answers}
          currentQuestionId={currentQuestionId}
          onSelectQuestion={handleSelectQuestion}
        />
      )}

      {/* Confirmation Dialog */}
      <AssessmentSubmitDialog
        isOpen={isSubmitDialogOpen}
        onOpenChange={setIsSubmitDialogOpen}
        skillCounts={skillCounts}
        isSubmitting={isSubmitting}
        onConfirmSubmit={handleFinalSubmit}
      />
    </div>
  );
}
