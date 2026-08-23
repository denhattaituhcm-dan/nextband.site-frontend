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
  Headphones,
  Mic,
  FileText,
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
      } catch (err: any) {
        // Fallback to student submission query
        try {
          return await submissionsApi.getById(id);
        } catch {
          throw err;
        }
      }
    },
    enabled: !isDemo && !!id,
    retry: false,
  });

  const [report, setReport] = useState<AssessmentResultDetail | null>(null);

  useEffect(() => {
    if (isDemo) {
      // Demo mock report
      const demoRank = mapBandToArisRank(5.5);
      setReport({
        id: "DEMO-SAMPLE",
        candidateName: "Học Viên Mẫu",
        examTitle: "ARIS IELTS Diagnostic Assessment (4 Kỹ Năng & Ngữ Pháp)",
        sectionType: "IELTS 4 Kỹ Năng & Ngữ Pháp (Chuẩn Cambridge)",
        rawScore: 24,
        totalQuestions: 35,
        accuracyPercent: 69,
        ieltsBandScore: 5.5,
        rankCode: demoRank.rankCode,
        rankTitle: demoRank.rankTitle,
        bandRange: "Band 5.0 – 5.5",
        objectiveBreakdown: {
          rawScore: 24,
          totalQuestions: 35,
          accuracyPercent: 69,
          listening: {
            correct: 7,
            total: 10,
            scorePercent: 70,
            estimatedBand: "Band 6.0 – 6.5",
            level: "Upper-Intermediate",
            feedback: "Phản xạ nghe hiểu tốt các đoạn hội thoại và độc thoại học thuật.",
          },
          reading: {
            correct: 7,
            total: 10,
            scorePercent: 70,
            estimatedBand: "Band 5.5 – 6.0",
            level: "Intermediate",
            feedback: "Nắm vững kỹ năng Scanning & Skimming, định vị thông tin nhanh.",
          },
          grammar: {
            correct: 10,
            total: 15,
            scorePercent: 67,
            level: "Trung cấp (Intermediate)",
            feedback: "Làm chủ cấu trúc câu phức và các collocations học thuật thông dụng.",
          },
        },
        subjectiveEvaluation: {
          status: "PENDING_REVIEW",
          hasWritingSubmission: true,
          hasSpeakingRecording: true,
          writing: {
            submitted: true,
            status: "Đang chờ Giảng viên chấm",
            message: "Bài viết Task 2 của bạn đã được ghi nhận. Giảng viên ARIS sẽ chấm chi tiết theo 4 tiêu chí chuẩn IELTS (TR, CC, LR, GRA) và gửi bài sửa kèm kết quả qua Zalo/SĐT trong vòng 24h.",
          },
          speaking: {
            submitted: true,
            status: "Đang chờ Giảng viên chấm",
            message: "2 bản ghi âm đã được niêm phong an toàn. Giảng viên chuyên môn sẽ thẩm định phát âm (Pronunciation), độ trôi chảy & từ vựng và gửi audio feedback chi tiết sau.",
          },
          note: "Bài làm đã được niêm phong an toàn và chuyển đến Giảng viên chấm chuyên sâu.",
        },
        strengths: [
          "Khả năng quét và định vị thông tin học thuật (Scanning & Skimming) rất nhanh và chính xác.",
          "Phản xạ nghe hiểu tốt, bắt kịp tốc độ các đoạn hội thoại thực tế.",
          "Nắm vững cấu trúc câu phức, đảo ngữ và các collocations học thuật thông dụng.",
        ],
        weaknesses: [
          "Còn lúng túng khi viết câu phức nhiều mệnh đề và hòa hợp chủ vị.",
          "Dễ bị bẫy ở các câu hỏi suy luận logic True/False/Not Given.",
          "Cần tiếp tục trau dồi các collocations nâng cao để bứt phá band điểm.",
        ],
        recommendedCourse: demoRank.recommendedCourse,
        submittedAt: new Date().toISOString(),
      } as any);
      return;
    }

    // 1. Check direct result from assessment API first
    if (submissionData) {
      if (submissionData.rankCode || submissionData.ieltsBandScore != null || submissionData.objectiveBreakdown) {
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

    // Otherwise report stays null
    setReport(null);
  }, [id, isDemo, submissionData]);

  const activeReport = report as any;

  const arisLevelTitle =
    activeReport?.arisLevel?.levelTitle || activeReport?.rankTitle || "Cấp 3 — Học Sĩ (Builder)";
  const arisEstimatedBand =
    activeReport?.arisLevel?.estimatedIeltsRange || activeReport?.bandRange || (activeReport?.ieltsBandScore != null ? `Band ${activeReport.ieltsBandScore}` : "Band 5.0 – 5.5");
  const rawScore =
    activeReport?.objectiveBreakdown?.rawScore ?? activeReport?.rawScore ?? 0;
  const totalQuestions =
    activeReport?.objectiveBreakdown?.totalQuestions ?? activeReport?.totalQuestions ?? 35;
  const accuracyPercent =
    activeReport?.objectiveBreakdown?.accuracyPercent ?? activeReport?.accuracyPercent ?? 0;
  const recommendedCourse =
    activeReport?.arisLevel?.recommendedCourse || activeReport?.recommendedCourse;
  const subjectiveEvaluation = activeReport?.subjectiveEvaluation;
  const formattedSubmittedDate = activeReport?.submittedAt
    ? new Date(activeReport.submittedAt).toLocaleString("vi-VN")
    : null;

  return (
    <div className="flex flex-col">
      <SEO
        title={activeReport ? `Báo Cáo Chẩn Đoán Năng Lực ARIS — ${arisLevelTitle}` : "Báo Cáo Chẩn Đoán Năng Lực IELTS — ARIS"}
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
            ) : activeReport ? (
              <Badge variant="outline" className="bg-success/15 text-success border-success/30 font-mono font-bold text-xs px-3 py-1 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Kết quả khảo thí chẩn đoán
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 font-mono font-bold text-xs px-3 py-1 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Thông báo trạng thái hồ sơ
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
              : activeReport
              ? `Báo cáo phân tích tự động cho thí sinh ${activeReport?.candidateName || "Khảo thí"}${formattedSubmittedDate ? ` hoàn thành lúc ${formattedSubmittedDate}` : ""}.`
              : "Vui lòng kiểm tra trạng thái xác thực hoặc mã phiên khảo thí bên dưới."}
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 02. DETAILED RESULT BREAKDOWN / ERROR STATE                                */}
      {/* ========================================================================= */}
      <SectionContainer
        badge="Chẩn Đoán Năng Lực"
        title={activeReport ? "Định vị Cấp độ ARIS & Đề xuất lộ trình" : "Trạng thái truy cập bài làm"}
        description={activeReport ? "Điểm số phần trắc nghiệm được chấm tự động và đối chiếu với Khung phân hạng ARIS Diagnostic Scale." : "Thông tin tra cứu hồ sơ khảo thí."}
        background="muted"
      >
        {isLoadingSubmission ? (
          <div className="py-20 text-center space-y-3">
            <div className="flex justify-center text-primary">
              <RotateCw className="h-8 w-8 animate-spin" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">
              Đang phân tích bài làm và thiết lập báo cáo...
            </p>
          </div>
        ) : !activeReport ? (
          /* Proper Error / Unauthorized / Expired State (No Fake Scorecard) */
          <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-foreground">
                {isSubmissionError ? "Phiên Khảo Thí Hết Hạn hoặc Cần Xác Thực" : "Không Tìm Thấy Báo Cáo Khảo Thí"}
              </h3>
              <p className="text-sm text-foreground/75 leading-relaxed">
                {isSubmissionError
                  ? "Không thể truy xuất dữ liệu báo cáo chẩn đoán cho mã hồ sơ này. Phiên khảo thí có thể đã hết hạn hoặc liên kết được mở trên thiết bị chưa được xác thực."
                  : "Không tìm thấy hồ sơ bài thi tương ứng trong hệ thống hoặc bài thi chưa hoàn tất nộp bài."}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button
                onClick={() => navigate("/assessment")}
                className="rounded-2xl px-6 h-12 font-bold text-sm bg-brand-red hover:bg-brand-red-hover text-white shadow-sm"
              >
                Làm bài khảo thí mới
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/assessment/result/demo")}
                className="rounded-2xl px-6 h-12 font-bold text-sm border-2 border-border/80 text-foreground"
              >
                Xem trước báo cáo mẫu
              </Button>
            </div>
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

              {/* 5-Category Assessment & IELTS Band Breakdown */}
              <div className="space-y-4 pt-2 border-t border-border/60">
                <div>
                  <h4 className="font-extrabold text-base sm:text-lg text-foreground">
                    Bóc Tách Năng Lực 5 Kỹ Năng Thành Phần
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Điểm trắc nghiệm (Nghe, Đọc, Ngữ pháp) được đối chiếu theo thang Band IELTS. Bài tự luận (Viết, Nói) được chấm chuyên sâu bởi Giảng viên.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category 1: Listening (IELTS Band) */}
                  <div className="p-5 rounded-2xl bg-card border border-border/80 space-y-3 shadow-2xs hover:border-brand-blue/40 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-brand-blue-soft text-brand-blue flex items-center justify-center font-bold">
                          <Headphones className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[11px] font-mono font-bold text-muted-foreground uppercase">Hạng Mục 01</span>
                          <h5 className="font-extrabold text-sm text-foreground">Kỹ Năng Nghe (Listening)</h5>
                        </div>
                      </div>
                      <Badge className="bg-brand-blue text-white font-extrabold text-xs px-2.5 py-1">
                        {activeReport?.objectiveBreakdown?.listening?.estimatedBand || "Band 5.5 – 6.0"}
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-muted-foreground">Kết quả trắc nghiệm</span>
                        <span className="text-brand-blue">
                          {activeReport?.objectiveBreakdown?.listening?.correct ?? 0} / {activeReport?.objectiveBreakdown?.listening?.total ?? 10} câu ({activeReport?.objectiveBreakdown?.listening?.scorePercent ?? 0}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-brand-blue rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(5, activeReport?.objectiveBreakdown?.listening?.scorePercent ?? 0)}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-xs text-foreground/80 leading-relaxed bg-muted/30 p-2.5 rounded-xl border border-border/50">
                      💡 {activeReport?.objectiveBreakdown?.listening?.feedback || "Phản xạ nghe hiểu tốt các ngữ cảnh thông dụng & học thuật."}
                    </p>
                  </div>

                  {/* Category 2: Reading (IELTS Band) */}
                  <div className="p-5 rounded-2xl bg-card border border-border/80 space-y-3 shadow-2xs hover:border-brand-blue/40 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-brand-blue-soft text-brand-blue flex items-center justify-center font-bold">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[11px] font-mono font-bold text-muted-foreground uppercase">Hạng Mục 02</span>
                          <h5 className="font-extrabold text-sm text-foreground">Kỹ Năng Đọc Hiểu (Reading)</h5>
                        </div>
                      </div>
                      <Badge className="bg-brand-blue text-white font-extrabold text-xs px-2.5 py-1">
                        {activeReport?.objectiveBreakdown?.reading?.estimatedBand || "Band 5.5 – 6.0"}
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-muted-foreground">Kết quả trắc nghiệm</span>
                        <span className="text-brand-blue">
                          {activeReport?.objectiveBreakdown?.reading?.correct ?? 0} / {activeReport?.objectiveBreakdown?.reading?.total ?? 10} câu ({activeReport?.objectiveBreakdown?.reading?.scorePercent ?? 0}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-brand-blue rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(5, activeReport?.objectiveBreakdown?.reading?.scorePercent ?? 0)}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-xs text-foreground/80 leading-relaxed bg-muted/30 p-2.5 rounded-xl border border-border/50">
                      💡 {activeReport?.objectiveBreakdown?.reading?.feedback || "Đọc hiểu nhanh, định vị thông tin học thuật chính xác."}
                    </p>
                  </div>

                  {/* Category 3: Grammar & Lexicon */}
                  <div className="p-5 rounded-2xl bg-card border border-border/80 space-y-3 shadow-2xs hover:border-brand-blue/40 transition-all md:col-span-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                          <Brain className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[11px] font-mono font-bold text-muted-foreground uppercase">Hạng Mục 03</span>
                          <h5 className="font-extrabold text-sm text-foreground">Ngữ Pháp &amp; Từ Vựng Học Thuật (Grammar &amp; Lexicon)</h5>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-purple-300 text-purple-700 dark:text-purple-300 bg-purple-500/10 font-extrabold text-xs px-2.5 py-1">
                        {activeReport?.objectiveBreakdown?.grammar?.level || "Trung cấp (Intermediate)"}
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-muted-foreground">Độ chính xác ngữ pháp &amp; từ vựng</span>
                        <span className="text-purple-600 dark:text-purple-400">
                          {activeReport?.objectiveBreakdown?.grammar?.correct ?? 0} / {activeReport?.objectiveBreakdown?.grammar?.total ?? 15} câu ({activeReport?.objectiveBreakdown?.grammar?.scorePercent ?? 0}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(5, activeReport?.objectiveBreakdown?.grammar?.scorePercent ?? 0)}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-xs text-foreground/80 leading-relaxed bg-muted/30 p-2.5 rounded-xl border border-border/50">
                      💡 {activeReport?.objectiveBreakdown?.grammar?.feedback || "Làm chủ các cấu trúc ngữ pháp học thuật và collocations nâng cao."}
                    </p>
                  </div>

                  {/* Category 4: Writing (Subjective - Reviewed Later) */}
                  <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/30 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[11px] font-mono font-bold text-amber-600 uppercase">Hạng Mục 04 — Tự Luận</span>
                          <h5 className="font-extrabold text-sm text-foreground">Kỹ Năng Viết (Writing Task 2)</h5>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-amber-400/60 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-xs px-2.5 py-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Chấm &amp; gửi kết quả sau</span>
                      </Badge>
                    </div>

                    <p className="text-xs text-foreground/80 leading-relaxed bg-muted/30 p-3 rounded-xl border border-border/50">
                      {activeReport?.subjectiveEvaluation?.writing?.message ||
                        "Bài viết Task 2 của bạn đã được ghi nhận an toàn. Giảng viên ARIS sẽ chấm chi tiết theo 4 tiêu chí chuẩn IELTS (TR, CC, LR, GRA) và gửi bài sửa kèm kết quả qua Zalo/SĐT trong vòng 24h."}
                    </p>
                  </div>

                  {/* Category 5: Speaking (Subjective - Reviewed Later) */}
                  <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/30 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold">
                          <Mic className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[11px] font-mono font-bold text-emerald-600 uppercase">Hạng Mục 05 — Tự Luận</span>
                          <h5 className="font-extrabold text-sm text-foreground">Kỹ Năng Nói (Speaking Part 1 &amp; 2)</h5>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-emerald-400/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs px-2.5 py-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Chấm &amp; gửi kết quả sau</span>
                      </Badge>
                    </div>

                    <p className="text-xs text-foreground/80 leading-relaxed bg-muted/30 p-3 rounded-xl border border-border/50">
                      {activeReport?.subjectiveEvaluation?.speaking?.message ||
                        "2 bản ghi âm đã được niêm phong an toàn. Giảng viên chuyên môn sẽ thẩm định phát âm (Pronunciation), độ trôi chảy & từ vựng và gửi phiếu nhận xét chi tiết kèm audio feedback sau."}
                    </p>
                  </div>
                </div>
              </div>

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
