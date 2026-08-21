import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { submissionsApi, assessmentApi } from "@/lib/api";
import {
  getLocalAssessmentResult,
  buildAssessmentReportFromSubmission,
  AssessmentResultDetail,
  mapBandToArisRank,
} from "@/lib/assessmentService";
import { SectionContainer } from "@/components/public/SectionContainer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/common/SEO";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  BookOpen,
  Target,
  Brain,
  ShieldCheck,
  Clock,
  HelpCircle,
  FileCheck,
  Sparkles,
  BarChart3,
  Calendar,
  AlertTriangle,
  RotateCw,
} from "lucide-react";

export default function AssessmentResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isDemo = !id || id === "demo";

  // Query live assessment result from API if real ID is passed
  const {
    data: submissionData,
    isLoading: isLoadingSubmission,
    isError: isSubmissionError,
  } = useQuery({
    queryKey: ["assessment-submission", id],
    queryFn: async () => {
      if (!id || id === "demo") return null;
      try {
        const res = await assessmentApi.getResult(id);
        return res;
      } catch {
        // Fallback to student submission query
        try {
          return await submissionsApi.getById(id);
        } catch {
          return null;
        }
      }
    },
    enabled: !isDemo && !!id,
    retry: 1,
  });

  const [report, setReport] = useState<AssessmentResultDetail | null>(null);

  useEffect(() => {
    if (isDemo) {
      // Demo mock report
      const demoRank = mapBandToArisRank(5.0);
      setReport({
        id: "DEMO-SAMPLE",
        candidateName: "Học Viên Mẫu",
        examTitle: "IELTS Reading Academic Placement (Cambridge)",
        sectionType: "IELTS Reading Academic",
        rawScore: 18,
        totalQuestions: 26,
        accuracyPercent: 69,
        ieltsBandScore: 5.0,
        rankCode: demoRank.rankCode,
        rankTitle: demoRank.rankTitle,
        bandRange: demoRank.bandRange,
        strengths: [
          "Làm tốt các câu hỏi tìm chi tiết cụ thể trong đoạn văn ngắn.",
          "Phát âm các âm IPA cơ bản chuẩn xác và có vốn từ vựng xã hội cơ bản.",
          "Nắm bắt được ý chính của từng đoạn văn ngắn.",
        ],
        weaknesses: [
          "Còn lúng túng khi viết câu phức nhiều mệnh đề và hòa hợp chủ vị.",
          "Dễ bị bẫy ở các câu hỏi suy luận logic True/False/Not Given.",
          "Tốc độ đọc còn chậm ở các đoạn văn có nhiều từ vựng chuyên ngành.",
        ],
        recommendedCourse: demoRank.recommendedCourse,
        submittedAt: new Date().toISOString(),
      });
      return;
    }

    // 1. Check direct result from assessment API first
    if (submissionData) {
      if (submissionData.rankCode || submissionData.ieltsBandScore != null) {
        setReport(submissionData as AssessmentResultDetail);
        return;
      }
      const built = buildAssessmentReportFromSubmission(submissionData);
      setReport(built);
      return;
    }

    // 2. Check local storage fallback
    if (id) {
      const local = getLocalAssessmentResult(id);
      if (local) {
        setReport(local);
        return;
      }
    }
  }, [id, isDemo, submissionData]);

  const activeReport = report as any;

  const arisLevelTitle =
    activeReport?.arisLevel?.levelTitle || activeReport?.rankTitle || "Cấp 3 — Học Sĩ (Builder)";
  const arisEstimatedBand =
    activeReport?.arisLevel?.estimatedIeltsRange || activeReport?.bandRange || "Band 5.0 – 5.5";
  const rawScore =
    activeReport?.objectiveBreakdown?.rawScore ?? activeReport?.rawScore ?? 0;
  const totalQuestions =
    activeReport?.objectiveBreakdown?.totalQuestions ?? activeReport?.totalQuestions ?? 35;
  const accuracyPercent =
    activeReport?.objectiveBreakdown?.accuracyPercent ?? activeReport?.accuracyPercent ?? 0;
  const recommendedCourse =
    activeReport?.arisLevel?.recommendedCourse || activeReport?.recommendedCourse;
  const subjectiveEvaluation = activeReport?.subjectiveEvaluation;

  return (
    <div className="flex flex-col">
      <SEO
        title={`Báo Cáo Chẩn Đoán Năng Lực ARIS — ${arisLevelTitle}`}
        description="Báo cáo phân tích trình độ IELTS-style, chẩn đoán điểm mạnh điểm yếu và đề xuất lộ trình đào tạo theo khung phân hạng ARIS."
      />

      {/* ========================================================================= */}
      {/* 01. HERO HEADER                                                           */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-14 pb-16 sm:pt-20 sm:pb-24 border-b border-border/80 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6 text-left">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/assessment")}
            className="gap-2 text-foreground/75 hover:text-foreground font-bold -ml-3 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại cổng khảo thí</span>
          </Button>

          <div className="flex flex-wrap items-center gap-3">
            {isDemo ? (
              <Badge variant="outline" className="bg-brand-red-soft text-brand-red border-brand-red/30 uppercase font-mono font-black text-xs px-3 py-1">
                BẢN DEMO — Minh họa cấu trúc báo cáo
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-success/15 text-success border-success/30 font-mono font-bold text-xs px-3 py-1 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Kết quả khảo thí chẩn đoán
              </Badge>
            )}
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-brand-blue-soft text-brand-blue border border-brand-blue/20">
              Mã hồ sơ: #{id || "DEMO-SAMPLE"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-[1.15]">
            Báo Cáo Chẩn Đoán Trình Độ &amp; Định Hướng Lộ Trình
          </h1>

          <p className="text-base sm:text-lg text-foreground/85 font-normal leading-relaxed">
            {isDemo
              ? "Dưới đây là bản mô phỏng cấu trúc báo cáo khảo thí chẩn đoán của ARIS. Sau khi hoàn thành bài làm thực tế, hệ thống sẽ tự động bóc tách dữ liệu theo kết quả của bạn."
              : `Báo cáo phân tích tự động cho thí sinh ${activeReport?.candidateName || "Khảo thí"} hoàn thành lúc ${new Date(activeReport?.submittedAt || "").toLocaleString("vi-VN")}.`}
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 02. DETAILED RESULT BREAKDOWN                                             */}
      {/* ========================================================================= */}
      <SectionContainer
        badge="Chẩn Đoán Năng Lực"
        title="Định vị Cấp độ ARIS &amp; Đề xuất lộ trình"
        description="Điểm số phần trắc nghiệm được chấm tự động và đối chiếu với Khung phân hạng ARIS Diagnostic Scale."
        background="muted"
      >
        {isLoadingSubmission && !activeReport ? (
          <div className="py-20 text-center space-y-3">
            <div className="flex justify-center text-primary">
              <RotateCw className="h-8 w-8 animate-spin" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">
              Đang phân tích bài làm và thiết lập báo cáo...
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8 text-left">
            {/* Main Result Score Card */}
            <div className="p-8 sm:p-10 rounded-3xl bg-card border border-border/80 space-y-6 shadow-2xs">
              <div className="flex flex-wrap gap-4 items-center justify-between border-b border-border/60 pb-6">
                <div className="space-y-1">
                  <span className="text-xs font-mono uppercase tracking-widest text-brand-blue font-extrabold">
                    Cấp Độ Chẩn Đoán ARIS
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-foreground">
                    {arisLevelTitle}
                  </h3>
                </div>

                <div className="p-3.5 px-6 rounded-2xl bg-brand-blue text-white font-extrabold text-base flex items-center gap-2.5 shadow-xs">
                  <Award className="h-6 w-6 text-brand-cyan" />
                  <span>Dự báo: {arisEstimatedBand}</span>
                </div>
              </div>

              {/* 4 Stat Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Điểm Trắc Nghiệm
                  </span>
                  <div className="text-2xl font-black text-emerald-600">
                    {rawScore} / {totalQuestions}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Độ chính xác
                  </span>
                  <div className="text-2xl font-black text-brand-blue">
                    {accuracyPercent}%
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Khoảng IELTS Dự Báo
                  </span>
                  <div className="text-xl font-black text-brand-red truncate mt-0.5">
                    {arisEstimatedBand}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Trạng thái Tự luận
                  </span>
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{subjectiveEvaluation?.status === "PENDING_REVIEW" ? "Đang chấm AI/GV" : "Hoàn tất"}</span>
                  </div>
                </div>
              </div>

              {/* Skill Breakdown (Listening, Reading, Grammar) */}
              {activeReport?.objectiveBreakdown && (
                <div className="p-5 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
                  <h4 className="font-extrabold text-xs text-foreground uppercase tracking-wider">
                    Bóc Tách Từng Kỹ Năng Thành Phần
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                      <span className="font-bold text-brand-blue">Listening:</span>{" "}
                      <strong className="text-foreground">{activeReport.objectiveBreakdown.listening?.correct}/{activeReport.objectiveBreakdown.listening?.total} câu</strong>
                      <p className="text-[11px] text-muted-foreground">{activeReport.objectiveBreakdown.listening?.feedback}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                      <span className="font-bold text-brand-blue">Reading:</span>{" "}
                      <strong className="text-foreground">{activeReport.objectiveBreakdown.reading?.correct}/{activeReport.objectiveBreakdown.reading?.total} câu</strong>
                      <p className="text-[11px] text-muted-foreground">{activeReport.objectiveBreakdown.reading?.feedback}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                      <span className="font-bold text-brand-blue">Grammar & Vocab:</span>{" "}
                      <strong className="text-foreground">{activeReport.objectiveBreakdown.grammar?.correct}/{activeReport.objectiveBreakdown.grammar?.total} câu</strong>
                      <p className="text-[11px] text-muted-foreground">{activeReport.objectiveBreakdown.grammar?.feedback}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Strengths and Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-border/60">
                <div className="space-y-3">
                  <h4 className="font-extrabold text-foreground text-base flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>Điểm mạnh đã xác nhận</span>
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-foreground/80 leading-relaxed pl-1">
                    {(activeReport?.strengths || []).map((s: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-extrabold text-foreground text-base flex items-center gap-2 text-brand-red">
                    <Target className="h-5 w-5 text-brand-red shrink-0" />
                    <span>Điểm nghẽn cần tháo gỡ</span>
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-foreground/80 leading-relaxed pl-1">
                    {(activeReport?.weaknesses || []).map((w: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-brand-red font-bold">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Targeted Course Recommendation */}
              {activeReport?.recommendedCourse && (
                <div className="p-6 sm:p-7 rounded-2xl bg-brand-blue-soft border border-brand-blue/30 space-y-4 pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-1">
                      <span className="text-xs font-mono font-black uppercase text-brand-blue">
                        Khuyến Nghị Đào Tạo Tối Ưu
                      </span>
                      <h4 className="text-xl sm:text-2xl font-black text-foreground">
                        {activeReport.recommendedCourse.title}
                      </h4>
                    </div>
                    <Badge className="bg-brand-blue text-white font-bold px-3 py-1">
                      {activeReport.recommendedCourse.targetBand}
                    </Badge>
                  </div>

                  <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
                    {activeReport.recommendedCourse.summary}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <Button
                      size="lg"
                      onClick={() => navigate(`/courses/${activeReport.recommendedCourse.slug}`)}
                      className="rounded-xl px-6 h-12 font-extrabold text-sm bg-brand-red text-white hover:bg-brand-red-hover gap-2 shadow-xs"
                    >
                      <span>Xem Lộ Trình {activeReport.recommendedCourse.title}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>

                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => navigate("/contact")}
                      className="rounded-xl px-6 h-12 font-bold text-sm border-2 border-border/80 hover:bg-muted text-foreground"
                    >
                      Đăng ký học thử 02 buổi miễn phí
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </SectionContainer>
    </div>
  );
}
