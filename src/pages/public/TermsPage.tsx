import React from "react";
import { SectionContainer } from "@/components/public/SectionContainer";
import { SEO } from "@/components/common/SEO";
import { ShieldCheck, Scale, FileText, CheckCircle2 } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="flex flex-col">
      <SEO
        title="Điều Khoản Dịch Vụ & Quy Chuẩn Học Thuật — Học Viện ARIS"
        description="Quy định sử dụng dịch vụ, quy chuẩn học thuật và cam kết trách nhiệm giữa học viên và Học Viện ARIS."
      />

      <section className="pt-16 pb-14 border-b border-border/80 bg-background text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-blue-soft text-brand-blue border border-brand-blue/20 text-xs font-black uppercase tracking-wider">
            <Scale className="h-4 w-4" />
            <span>Văn Bản Pháp Lý &amp; Học Thuật</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
            Điều Khoản Dịch Vụ &amp; Quy Chuẩn Đào Tạo
          </h1>
          <p className="text-sm sm:text-base text-foreground/75 max-w-2xl mx-auto">
            Cập nhật lần cuối: Tháng 8/2026. Áp dụng cho toàn bộ học viên, giảng viên và người sử dụng nền tảng ARIS &amp; NextBand.
          </p>
        </div>
      </section>

      <SectionContainer background="default">
        <div className="max-w-4xl mx-auto space-y-10 text-left text-sm sm:text-base text-foreground/85 leading-relaxed">
          {/* Section 1 */}
          <div className="p-8 rounded-3xl border border-border/80 bg-card space-y-4 shadow-2xs">
            <h3 className="text-xl font-black text-foreground flex items-center gap-2.5">
              <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-brand-blue-soft text-brand-blue">01</span>
              <span>Quy Chuẩn Học Thuật &amp; Kỷ Luật Lớp Học</span>
            </h3>
            <p>
              Học viện ARIS vận hành theo triết lý rèn luyện có chủ đích (Deliberate Practice). Học viên khi tham gia các khóa học tại ARIS cam kết:
            </p>
            <ul className="space-y-2 pl-4">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-blue shrink-0 mt-1" />
                <span>Hoàn thành đầy đủ bài chuẩn bị trước buổi học và bài tập về nhà theo đúng thời hạn quy định.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-blue shrink-0 mt-1" />
                <span>Bắt buộc hoàn thành bài sửa (Re-attempt) trên hệ thống NextBand sau khi nhận được nhận xét chi tiết từ giảng viên.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-blue shrink-0 mt-1" />
                <span>Tham gia tối thiểu 90% thời lượng các buổi học để đảm bảo sự tiến bộ liên tục và đo lường được.</span>
              </li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="p-8 rounded-3xl border border-border/80 bg-card space-y-4 shadow-2xs">
            <h3 className="text-xl font-black text-foreground flex items-center gap-2.5">
              <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-brand-blue-soft text-brand-blue">02</span>
              <span>Bản Quyền Học Liệu &amp; Hệ Thống NextBand</span>
            </h3>
            <p>
              Toàn bộ giáo trình, tài liệu bóc tách ngôn ngữ học tri nhận, hệ thống câu hỏi khảo thí và giao diện phần mềm NextBand là tài sản trí tuệ độc quyền thuộc quyền sở hữu của Học Viện ARIS. Nghiêm cấm mọi hành vi sao chép, phân phối lại hoặc thương mại hóa học liệu dưới mọi hình thức khi chưa có văn bản đồng ý chính thức từ Ban Quản Trị.
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-8 rounded-3xl border border-border/80 bg-card space-y-4 shadow-2xs">
            <h3 className="text-xl font-black text-foreground flex items-center gap-2.5">
              <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-brand-blue-soft text-brand-blue">03</span>
              <span>Chính Sách Bằng Chứng (Evidence) &amp; Kết Quả Thi</span>
            </h3>
            <p>
              ARIS chỉ công khai bảng điểm, câu chuyện tiến bộ và hình ảnh học viên trên mục Bằng Chứng (Evidence / Kết Quả) khi đã có <strong>Sự Đồng Ý Rõ Ràng (Consent Confirmed)</strong> từ chính học viên. Mọi bảng điểm công bố đều có thể được xác thực đối chiếu với kỳ thi thật tại IDP / British Council.
            </p>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}
