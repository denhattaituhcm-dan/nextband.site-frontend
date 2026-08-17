import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SectionContainer } from "@/components/public/SectionContainer";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/common/SEO";
import { ArrowLeft, Briefcase, MapPin, CheckCircle2, Send } from "lucide-react";

export default function JobDetailPage() {
  const { jobSlug } = useParams<{ jobSlug: string }>();
  const navigate = useNavigate();

  const jobTitle =
    jobSlug === "ielts-teacher"
      ? "Giảng Viên IELTS Writing & Speaking (8.0+)"
      : jobSlug === "academic-coordinator"
      ? "Chuyên Viên Điều Phối Học Thuật (Academic Coordinator)"
      : jobSlug === "teaching-assistant"
      ? "Trợ Giảng Học Thuật (Teaching Assistant)"
      : `Vị Trí: ${jobSlug}`;

  return (
    <div className="space-y-12">
      <SEO
        title={`${jobTitle} — Tuyển Dụng ARIS`}
        description="Thông tin chi tiết yêu cầu công việc, quyền lợi và hình thức nộp hồ sơ ứng tuyển tại ARIS IELTS."
      />

      <SectionContainer
        badge="Chi Tiết Tuyển Dụng"
        title={jobTitle}
        description="Môi trường làm việc học thuật chuyên nghiệp, đề cao sự chuẩn mực và phát triển chuyên môn cá nhân."
        background="default"
      >
        <div className="max-w-4xl mx-auto space-y-8 text-left">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/careers")}
            className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại danh sách vị trí</span>
          </Button>

          <div className="p-8 rounded-2xl border border-border/80 bg-card space-y-6">
            <div className="flex flex-wrap gap-4 items-center justify-between border-b border-border/60 pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Dĩ An, Bình Dương / TP.HCM</span>
                </div>
                <h3 className="font-extrabold text-foreground text-xl">{jobTitle}</h3>
              </div>

              <Button
                onClick={() => navigate("/contact")}
                className="rounded-xl font-bold text-xs bg-primary text-primary-foreground gap-2"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Nộp hồ sơ ứng tuyển</span>
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-bold text-foreground text-sm uppercase tracking-wide">
                  Mô Tả Công Việc
                </h4>
                <ul className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Trực tiếp giảng dạy hoặc hỗ trợ lớp học theo giáo trình học thuật chuẩn ARIS.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Chấm chữa bài tập chi tiết trên hệ thống NextBand và theo dõi tiến độ của học viên.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Tham gia các buổi sinh hoạt chuyên môn và nghiên cứu phát triển học liệu định kỳ.</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/50">
                <h4 className="font-bold text-foreground text-sm uppercase tracking-wide">
                  Yêu Cầu Ứng Viên
                </h4>
                <ul className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Chứng chỉ IELTS còn hiệu lực với band điểm phù hợp từng vị trí.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Tác phong chuẩn mực, cẩn thận, có trách nhiệm cao với tiến bộ của học viên.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}
