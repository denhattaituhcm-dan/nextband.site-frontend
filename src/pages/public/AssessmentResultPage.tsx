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
import { derivePreliminaryProfileRange } from "@/features/assessment/domain/diagnostic.rules";
import { SectionContainer } from "@/components/public/SectionContainer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/common/SEO";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Target,
  Brain,
  Clock,
  AlertTriangle,
  RotateCw,
  Headphones,
  Mic,
  FileText,
  Sparkles,
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
      setReport({
        id: "DEMO-SAMPLE",
        candidateName: "Học Viên Mẫu",
        examTitle: "ARIS IELTS Diagnostic Assessment (4 Kỹ Năng & Ngữ Pháp)",
        sectionType: "IELTS 4 Kỹ Năng & Ngữ Pháp (Chuẩn Cambridge)",
        rawScore: 24,
        totalQuestions: 35,
        accuracyPercent: 69,
        ieltsBandScore: 5.5,
        objectiveBreakdown: {
          rawScore: 24,
          totalQuestions: 35,
          accuracyPercent: 69,
          preliminaryRange: "5.0 – 6.0",
          listening: {
            correct: 7,
            total: 10,
            scorePercent: 70,
            estimatedBand: "≈ 6.0",
            level: "Upper-Intermediate",
            feedback: "Phản xạ nghe hiểu tốt các đoạn hội thoại và độc thoại học thuật.",
          },
          reading: {
            correct: 7,
            total: 10,
            scorePercent: 70,
            estimatedBand: "≈ 5.0",
            level: "Intermediate",
            feedback: "Nắm vững kỹ năng Scanning & Skimming, định vị thông tin nhanh.",
          },
          grammar: {
            correct: 10,
            total: 15,
            scorePercent: 67,
            level: "Intermediate (Trung cấp)",
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
            message: "Bài viết Task 2 của bạn đã được ghi nhận. Giáo viên sẽ chấm chi tiết theo 4 tiêu chí chuẩn IELTS (TR, CC, LR, GRA) và gửi kết quả qua Zalo/SĐT trong vòng 24h.",
          },
          speaking: {
            submitted: true,
            status: "Đang chờ Giảng viên chấm",
            message: "2 bản ghi âm đã được niêm phong an toàn. Giáo viên sẽ thẩm định phát âm, độ trôi chảy & từ vựng và gửi audio feedback chi tiết sau.",
          },
          note: "Bài làm đã được niêm phong an toàn và chuyển đến Giáo viên chấm chuyên sâu.",
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

  const listeningInfo = activeReport?.objectiveBreakdown?.listening;
  const readingInfo = activeReport?.objectiveBreakdown?.reading;
  const grammarInfo = activeReport?.objectiveBreakdown?.grammar;

  const rawScore =
    activeReport?.objectiveBreakdown?.rawScore ?? activeReport?.rawScore ?? 0;
  const totalQuestions =
    activeReport?.objectiveBreakdown?.totalQuestions ?? activeReport?.totalQuestions ?? 35;
  const accuracyPercent =
    activeReport?.objectiveBreakdown?.accuracyPercent ?? activeReport?.accuracyPercent ?? 0;

  const preliminaryRange =
    activeReport?.objectiveBreakdown?.preliminaryRange ||
    derivePreliminaryProfileRange(
      listeningInfo?.estimatedBand,
      readingInfo?.estimatedBand,
      rawScore > 0
    );

  const formattedSubmittedDate = activeReport?.submittedAt
    ? new Date(activeReport.submittedAt).toLocaleString("vi-VN")
    : null;

  return (
    <div className="flex flex-col">
      <SEO
        title={activeReport ? `Kết Quả Khảo Hạch Đầu Vào (Sơ bộ: ${preliminaryRange}) — ARIS` : "Kết Quả Khảo Hạch Đầu Vào — ARIS"}
        description="Báo cáo phân tích sơ bộ kết quả khảo hạch đầu vào IELTS-style cho các kỹ năng Listening, Reading và Grammar."
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
        badge="Khảo Hạch Đầu Vào"
        title={activeReport ? "Hồ sơ kết quả sơ bộ" : "Trạng thái truy cập bài làm"}
        description={activeReport ? "Kết quả các kỹ năng trắc nghiệm khách quan đã được ghi nhận tự động. Phần Tự luận đang chờ giáo viên chấm." : "Thông tin tra cứu hồ sơ khảo thí."}
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
            {/* ========================================================================= */}
            {/* PHẦN A. KẾT QUẢ SƠ BỘ                                                     */}
            {/* ========================================================================= */}
            <div className="p-8 sm:p-10 rounded-3xl bg-card border border-border/80 space-y-6 shadow-2xs">
              <div className="space-y-3 border-b border-border/60 pb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-mono uppercase tracking-widest text-brand-blue font-extrabold">
                      KẾT QUẢ KHẢO HẠCH ĐẦU VÀO
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                      Kết quả sơ bộ
                    </h2>
                  </div>

                  <div className="p-3.5 px-6 rounded-2xl bg-brand-blue/10 border border-brand-blue/30 text-brand-blue font-black text-lg flex items-center gap-2">
                    <span>Khoảng năng lực: {preliminaryRange}</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Ước tính từ các phần Listening, Reading và Grammar. Đây không phải điểm Overall IELTS và chưa bao gồm Speaking &amp; Writing.
                </p>
              </div>

              {/* 3 Receptive Metric Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Listening (10 câu)
                  </span>
                  <div className="text-2xl font-black text-brand-blue">
                    {listeningInfo ? `${listeningInfo.correct ?? 0} / ${listeningInfo.total ?? 10}` : "0 / 10"}
                  </div>
                  <span className="text-xs font-bold text-brand-blue/80 block">
                    {listeningInfo?.estimatedBand || "≈ 3.0"}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Reading (10 câu)
                  </span>
                  <div className="text-2xl font-black text-brand-blue">
                    {readingInfo ? `${readingInfo.correct ?? 0} / ${readingInfo.total ?? 10}` : "0 / 10"}
                  </div>
                  <span className="text-xs font-bold text-brand-blue/80 block">
                    {readingInfo?.estimatedBand || "≈ 3.0"}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Grammar &amp; Vocabulary (15 câu)
                  </span>
                  <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                    {grammarInfo ? `${grammarInfo.correct ?? 0} / ${grammarInfo.total ?? 15}` : "0 / 15"}
                  </div>
                  <span className="text-xs font-bold text-purple-600/80 dark:text-purple-300 block">
                    {grammarInfo?.level || "Intermediate"}
                  </span>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* PHẦN B. HỒ SƠ NĂNG LỰC (DIAGNOSTIC PROFILE)                                */}
            {/* ========================================================================= */}
            <div className="p-8 sm:p-10 rounded-3xl bg-card border border-border/80 space-y-6 shadow-2xs">
              <div className="border-b border-border/60 pb-4">
                <h3 className="font-black text-xl text-foreground">
                  Hồ Sơ Năng Lực (Diagnostic Profile)
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Bóc tách chi tiết từng cấu phần năng lực ngôn ngữ dựa trên dữ liệu bài làm thực tế.
                </p>
              </div>

              <div className="space-y-3.5">
                {/* Listening */}
                <div className="p-4 sm:p-5 rounded-2xl bg-muted/30 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-blue-soft text-brand-blue flex items-center justify-center font-bold shrink-0 mt-0.5">
                      <Headphones className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-foreground">Listening</h4>
                        <Badge className="bg-brand-blue text-white font-extrabold text-xs px-2.5 py-0.5">
                          {listeningInfo?.estimatedBand || "≈ 3.0"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {listeningInfo?.feedback || "Phản xạ nghe hiểu hội thoại và thông tin chi tiết."}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-13 sm:pl-0">
                    <span className="text-xs font-mono font-bold text-foreground bg-card px-3 py-1.5 rounded-xl border border-border">
                      {listeningInfo?.correct ?? 0} / {listeningInfo?.total ?? 10} câu
                    </span>
                  </div>
                </div>

                {/* Reading */}
                <div className="p-4 sm:p-5 rounded-2xl bg-muted/30 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-blue-soft text-brand-blue flex items-center justify-center font-bold shrink-0 mt-0.5">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-foreground">Reading</h4>
                        <Badge className="bg-brand-blue text-white font-extrabold text-xs px-2.5 py-0.5">
                          {readingInfo?.estimatedBand || "≈ 3.0"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {readingInfo?.feedback || "Kỹ năng định vị thông tin, đọc quét và suy luận logic."}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-13 sm:pl-0">
                    <span className="text-xs font-mono font-bold text-foreground bg-card px-3 py-1.5 rounded-xl border border-border">
                      {readingInfo?.correct ?? 0} / {readingInfo?.total ?? 10} câu
                    </span>
                  </div>
                </div>

                {/* Grammar & Vocabulary */}
                <div className="p-4 sm:p-5 rounded-2xl bg-muted/30 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold shrink-0 mt-0.5">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-foreground">Grammar &amp; Vocabulary</h4>
                        <Badge variant="outline" className="border-purple-300 text-purple-700 dark:text-purple-300 bg-purple-500/10 font-bold text-xs px-2.5 py-0.5">
                          {grammarInfo?.level || "Intermediate"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {grammarInfo?.feedback || "Làm chủ cấu trúc câu phức, thì và collocations học thuật."}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-13 sm:pl-0">
                    <span className="text-xs font-mono font-bold text-foreground bg-card px-3 py-1.5 rounded-xl border border-border">
                      {grammarInfo?.correct ?? 0} / {grammarInfo?.total ?? 15} câu
                    </span>
                  </div>
                </div>

                {/* Writing */}
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-foreground">Writing (Task 2)</h4>
                        <Badge variant="outline" className="border-amber-400/60 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-xs px-2.5 py-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Đang được giáo viên chấm</span>
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {activeReport?.subjectiveEvaluation?.writing?.message || "Bài viết đã được ghi nhận. Giáo viên sẽ chấm chi tiết theo 4 tiêu chuẩn IELTS (TR, CC, LR, GRA)."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Speaking */}
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold shrink-0 mt-0.5">
                      <Mic className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-foreground">Speaking (Part 1 &amp; 2)</h4>
                        <Badge variant="outline" className="border-amber-400/60 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-xs px-2.5 py-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Đang được giáo viên chấm</span>
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {activeReport?.subjectiveEvaluation?.speaking?.message || "2 bản ghi âm đã được niêm phong an toàn. Giáo viên sẽ thẩm định phát âm, độ trôi chảy & từ vựng."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths and Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-border/60">
                <div className="space-y-3">
                  <h4 className="font-extrabold text-foreground text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Điểm mạnh đã xác nhận</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-foreground/80 leading-relaxed pl-1">
                    {(activeReport?.strengths || []).map((s: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-extrabold text-foreground text-sm flex items-center gap-2 text-brand-red">
                    <Target className="h-4 w-4 text-brand-red shrink-0" />
                    <span>Điểm nghẽn cần tháo gỡ</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-foreground/80 leading-relaxed pl-1">
                    {(activeReport?.weaknesses || []).map((w: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-brand-red font-bold">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* PHẦN C. BƯỚC TIẾP THEO (NEXT STEPS)                                       */}
            {/* ========================================================================= */}
            <div className="p-8 sm:p-10 rounded-3xl bg-brand-blue-soft/30 border border-brand-blue/30 space-y-5 shadow-2xs text-left">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-blue shrink-0" />
                  <h3 className="font-black text-xl text-foreground">Bước tiếp theo</h3>
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed">
                  Giáo viên đang đánh giá Writing &amp; Speaking. Kết quả cuối cùng và khóa học phù hợp sẽ được xác định sau khi hoàn tất đánh giá.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-1 text-xs leading-relaxed text-muted-foreground">
                <p className="font-semibold text-foreground">
                  📌 Định hướng sơ bộ: Kết quả trắc nghiệm hiện tại phù hợp với nhóm năng lực {preliminaryRange}.
                </p>
                <p>
                  Giáo viên sẽ hoàn tất đánh giá Speaking &amp; Writing, sau đó ARIS sẽ gửi phiếu nhận xét chi tiết và định hướng khóa học phù hợp qua Zalo/SĐT trong vòng 24h.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/assessment")}
                  className="rounded-xl px-6 h-11 font-bold text-xs sm:text-sm border-2 border-border/80 hover:bg-muted text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  <span>Quay lại cổng khảo thí</span>
                </Button>

                <Button
                  size="lg"
                  onClick={() => navigate("/courses")}
                  className="rounded-xl px-6 h-11 font-bold text-xs sm:text-sm bg-brand-blue hover:bg-brand-blue-hover text-white gap-1.5 shadow-xs"
                >
                  <span>Khám phá các khóa học ARIS</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </SectionContainer>
    </div>
  );
}
