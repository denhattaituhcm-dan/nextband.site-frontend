import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionContainer } from "@/components/public/SectionContainer";
import { PlaceholderCard } from "@/components/public/PlaceholderCard";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/common/SEO";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Briefcase,
  Users,
  Brain,
  Award,
  Target,
  Flame,
  Scale,
  Send,
  Mail,
  Zap,
  Layers,
  BookOpen,
} from "lucide-react";

export default function CareersPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      <SEO
        title="Gia Nhập Đội Ngũ — Nơi Tôi Luyện Những 'Quái Vật' Học Thuật | ARIS"
        description="ARIS chiêu mộ những giảng viên và chuyên viên học thuật đam mê bản chất ngôn ngữ, dám phá vỡ giới hạn bản thân để cùng kiến tạo một học viện chuẩn mực."
      />

      {/* ========================================================================= */}
      {/* 01. HERO & MANIFESTO                                                      */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-32 border-b border-border/80 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-7">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-red-soft text-brand-red border border-brand-red/30 text-xs sm:text-sm font-black uppercase tracking-wider">
            <Flame className="h-4 w-4" />
            <span>Bản Sắc Đội Ngũ Sáng Lập</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-foreground tracking-tight leading-[1.08]">
            Nơi tôi luyện những{" "}
            <span className="text-brand-red block sm:inline">
              "quái vật" học thuật.
            </span>
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-foreground/85 font-medium leading-relaxed max-w-3xl mx-auto">
            Chúng tôi không tìm kiếm những cá nhân thích an phận, tự mãn hay chọn lối đi đơn độc, dễ dãi. ARIS tin rằng sự vượt trội chỉ được sinh ra từ kỷ luật nghiêm cẩn, quá trình tích lũy sâu sắc và việc đặt tư duy dưới áp lực đủ lớn để phá vỡ mọi giới hạn cũ.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => {
                const el = document.getElementById("open-positions");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-2xl px-8 h-14 font-extrabold text-base sm:text-lg bg-brand-red hover:bg-brand-red-hover text-white shadow-md gap-2"
            >
              <span>Xem vị trí đang tuyển</span>
              <ArrowRight className="h-5 w-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                const el = document.getElementById("core-beliefs");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-2xl px-8 h-14 font-bold text-base sm:text-lg border-2 border-border/80 hover:bg-muted text-foreground"
            >
              Đọc triết lý đội ngũ
            </Button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 02. CHÚNG TÔI TIN GÌ VỀ NGHỀ DẠY VÀ NGHỀ ĐỒNG ĐỘI?                       */}
      {/* ========================================================================= */}
      <SectionContainer
        id="core-beliefs"
        badge="Hai Niềm Tin Cốt Lõi"
        title="Chúng tôi tin gì về nghề dạy và nghề đồng đội?"
        description="Mọi quyết định, hành vi trong lớp học và quy chuẩn chuyên môn tại ARIS đều bắt nguồn từ hai niềm tin nền tảng này."
        background="muted"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {/* Pillar 1 */}
          <div className="p-8 sm:p-10 rounded-3xl border-2 border-border/80 bg-card space-y-6 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="font-mono font-black text-xs px-3 py-1.5 rounded-xl bg-brand-blue-soft text-brand-blue uppercase tracking-wider">
                Niềm Tin 01
              </span>
              <h3 className="text-2xl font-black text-foreground">
                Về bản chất của nghề dạy
              </h3>
            </div>

            <p className="text-base sm:text-lg text-foreground/80 leading-relaxed">
              Dạy học không phải là làm công ăn lương hay diễn trò hoa mỹ bề mặt. Dạy học là <strong>thấu hiểu tận gốc rễ cơ chế ngôn ngữ và tư duy bản xứ</strong>, từ đó trang bị phương pháp chuẩn xác để học viên thăng cấp thực chất.
            </p>

            <div className="p-5 rounded-2xl bg-muted/40 border border-border/60 text-sm text-foreground/85 leading-relaxed font-medium space-y-2">
              <div className="font-bold text-brand-red flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Trách nhiệm của một người thầy đích thực:</span>
              </div>
              <p>
                Khi thấy học viên bế tắc, chúng tôi không viện cớ đổ lỗi cho ngoại cảnh mà tự thân tìm mọi giải pháp triệt để, rèn giũa phương pháp và theo sát cho đến khi học viên bứt phá.
              </p>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-8 sm:p-10 rounded-3xl border-2 border-border/80 bg-card space-y-6 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="font-mono font-black text-xs px-3 py-1.5 rounded-xl bg-brand-red-soft text-brand-red uppercase tracking-wider">
                Niềm Tin 02
              </span>
              <h3 className="text-2xl font-black text-foreground">
                Về triết lý đồng đội và phát triển
              </h3>
            </div>

            <p className="text-base sm:text-lg text-foreground/80 leading-relaxed">
              Không một cá nhân nào có thể xây dựng điều vĩ đại bằng lối làm việc solo. Muốn đi xa và tái thiết chuẩn mực giáo dục, chúng ta cần một <strong>tập thể tinh hoa, sẵn sàng phản biện sắc bén và đối diện với sự thật</strong> để cùng nhau tiến bộ.
            </p>

            <div className="p-5 rounded-2xl bg-brand-blue-soft/40 border border-brand-blue/30 text-sm text-foreground/85 leading-relaxed font-medium space-y-2">
              <div className="font-bold text-brand-blue flex items-center gap-2">
                <Zap className="h-4 w-4 shrink-0" />
                <span>Nguyên lý phát triển qua va đập:</span>
              </div>
              <p>
                Người giỏi không lớn lên trong môi trường chỉ biết vuốt ve nhau, mà phát triển từ sự va đập tư duy đến tận cùng để liên tục tự nâng cấp năng lực.
              </p>
            </div>
          </div>
        </div>
      </SectionContainer>

      {/* ========================================================================= */}
      {/* 03. VÀO ARIS, BẠN SẼ PHẢI LÀM GÌ?                                         */}
      {/* ========================================================================= */}
      <SectionContainer
        badge="Ba Trách Nhiệm Sống Còn"
        title="Vào ARIS, bạn sẽ phải làm gì?"
        description="Một giảng viên ARIS không chỉ đơn thuần là người đứng lớp. Bạn sẽ đóng 3 vai trò cùng lúc: Giảng dạy thực chiến, Nhà nghiên cứu R&D và Người không ngừng tự nâng cấp."
        background="default"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">
          {/* Responsibility 1 */}
          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-4 shadow-2xs">
            <div className="p-3 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="font-black text-foreground text-xl">
              1. Giảng dạy thực chiến &amp; Chuyển giao tư duy
            </h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Truyền tải phương pháp học sâu theo góc độ ngôn ngữ học tri nhận, phá vỡ lối mòn học vẹt. Trực tiếp theo dõi, kỷ luật hóa quá trình luyện tập và chịu trách nhiệm với sự tiến bộ của từng học viên theo từng cấp độ rõ ràng.
            </p>
          </div>

          {/* Responsibility 2 */}
          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-4 shadow-2xs">
            <div className="p-3 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="font-black text-foreground text-xl">
              2. Nghiên cứu &amp; Phát triển (R&amp;D) hệ thống
            </h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Tham gia cải tiến hệ thống giáo trình độc quyền The ARIS Way, xây dựng tài liệu học thuật chuyên sâu và ứng dụng công nghệ/AI vào quy trình tối ưu hóa việc dạy và chấm bài trên nền tảng NextBand.
            </p>
          </div>

          {/* Responsibility 3 */}
          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-4 shadow-2xs">
            <div className="p-3 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
              <Scale className="h-6 w-6" />
            </div>
            <h3 className="font-black text-foreground text-xl">
              3. Phản biện &amp; Tự nâng cấp năng lực
            </h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Tham gia các buổi trau dồi chuyên môn nội bộ, sẵn sàng nhận góp ý trực diện để chuẩn hóa từng chi tiết giảng dạy và nâng cấp trình độ học thuật của chính mình lên mức cao nhất.
            </p>
          </div>
        </div>

        {/* Sharp Quote Banner */}
        <div className="mt-10 p-7 sm:p-8 rounded-3xl bg-brand-blue-soft/60 border border-brand-blue/30 text-center max-w-4xl mx-auto">
          <p className="text-base sm:text-lg font-bold text-foreground leading-relaxed">
            "Bạn sẽ bị phản biện. Bạn sẽ phải sửa. Bạn sẽ phải học lại thứ mình tưởng đã biết.<br className="hidden sm:inline" /> Và nếu bạn chứng minh được năng lực thực tế, bạn sẽ được giao nhiều trọng trách hơn."
          </p>
        </div>
      </SectionContainer>

      {/* ========================================================================= */}
      {/* 04. BẠN NHẬN LẠI ĐƯỢC GÌ?                                                 */}
      {/* ========================================================================= */}
      <SectionContainer
        badge="Đặc Quyền & Giá Trị"
        title="Bạn nhận lại được gì khi đồng hành cùng ARIS?"
        description="Chúng tôi đối xử với nhân sự bằng sự tôn trọng cao nhất: Sự minh bạch, đãi ngộ xứng đáng và cơ hội bứt phá năng lực chuyên môn."
        background="muted"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 text-left">
          {/* Benefit 1 */}
          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-3.5 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-success/15 text-success">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-black text-foreground text-lg sm:text-xl">
                Văn hóa thẳng thắn, không toxic
              </h3>
            </div>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Tuyệt đối nói không với thảo mai, xu nịnh hay giấu nghề. Môi trường chỉ tập trung vào hiệu suất, sự minh bạch và tinh thần hỗ trợ thực chất để cả đội ngũ cùng chiến thắng.
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-3.5 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-blue-soft text-brand-blue">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="font-black text-foreground text-lg sm:text-xl">
                Môi trường rèn giũa chuyên sâu
              </h3>
            </div>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Được bồi dưỡng trực tiếp về phương pháp ngôn ngữ học học thuật, chuẩn hóa kỹ năng Writing &amp; Speaking ở mức cao nhất, phát triển từ năng lực giảng dạy sang quản trị học thuật và R&amp;D.
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-3.5 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-red-soft text-brand-red">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="font-black text-foreground text-lg sm:text-xl">
                Thu nhập &amp; Đãi ngộ xứng đáng
              </h3>
            </div>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Mức thù lao giảng dạy cạnh tranh, tương xứng với năng lực và đóng góp thực tế. Cơ chế thưởng rõ ràng cho các dự án R&amp;D giáo trình và kết quả đào tạo xuất sắc.
            </p>
          </div>

          {/* Benefit 4 */}
          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-3.5 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-warning/15 text-warning">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-black text-foreground text-lg sm:text-xl">
                Di sản &amp; Sự kính trọng thực chất
              </h3>
            </div>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Sự kính trọng chân thành từ học viên khi họ chứng kiến sự biến đổi rõ rệt về tư duy và kết quả điểm số thực tế, thay vì những lời khen ngợi cảm tính xã giao.
            </p>
          </div>
        </div>
      </SectionContainer>

      {/* ========================================================================= */}
      {/* 05. AI PHÙ HỢP VỚI ARIS? (TIÊU CHUẨN, VỊ TRÍ & ỨNG TUYỂN)                  */}
      {/* ========================================================================= */}
      <SectionContainer
        id="open-positions"
        badge="Tiêu Chuẩn & Tuyển Mộ"
        title="Ai phù hợp với đội ngũ ARIS?"
        description="Chúng tôi sàng lọc ứng viên dựa trên tiêu chuẩn năng lực rõ ràng và tinh thần trách nhiệm kỷ luật."
        background="default"
      >
        <div className="space-y-12 text-left">
          {/* Criteria Table Box */}
          <div className="p-8 sm:p-10 rounded-3xl border-2 border-border/80 bg-card space-y-6 shadow-2xs">
            <h3 className="text-xl sm:text-2xl font-black text-foreground border-b border-border/60 pb-4">
              Tiêu Chuẩn Tuyển Chọn Cốt Lõi
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm sm:text-base">
              <div className="space-y-2">
                <div className="font-bold text-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-brand-red shrink-0" />
                  <span>Tư duy &amp; Thái độ</span>
                </div>
                <p className="text-foreground/75 leading-relaxed pl-4 text-sm">
                  Tinh thần kỷ luật cao, chịu được áp lực, không tự mãn, khao khát nâng cấp bản thân và sẵn sàng gắn bó xây dựng tập thể lâu dài.
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-brand-red shrink-0" />
                  <span>Năng lực học thuật</span>
                </div>
                <p className="text-foreground/75 leading-relaxed pl-4 text-sm">
                  Chứng chỉ IELTS tối thiểu 7.5+ (không kỹ năng nào dưới 7.0; ưu tiên các ứng viên có định hướng nâng band lên 8.0+).
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-brand-blue shrink-0" />
                  <span>Kinh nghiệm thực tế</span>
                </div>
                <p className="text-foreground/75 leading-relaxed pl-4 text-sm">
                  Tối thiểu 1 năm kinh nghiệm giảng dạy IELTS (Junior) hoặc từ 2 năm trở lên với hiệu suất cao (Middle – Senior).
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-brand-blue shrink-0" />
                  <span>Cam kết chuyên môn</span>
                </div>
                <p className="text-foreground/75 leading-relaxed pl-4 text-sm">
                  Sẵn sàng tiếp thu và vận hành triệt để các phương pháp chuẩn hóa The ARIS Way của học viện.
                </p>
              </div>
            </div>
          </div>

          {/* Open Position Cards */}
          <div className="space-y-6">
            <h3 className="text-xl sm:text-2xl font-black text-foreground">
              Các Vị Trí Đang Chiêu Mộ
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <PlaceholderCard
                variant="job"
                badge="Toàn thời gian / Bán thời gian"
                title="Giảng Viên IELTS Writing &amp; Speaking"
                subtitle="Ban Chuyên Môn"
                description="Trực tiếp giảng dạy và chấm chữa bài viết, bài nói cho học viên theo phương pháp The ARIS Way; chịu trách nhiệm với sự tiến bộ của từng học viên."
                metadata={["TP. Dĩ An, Tỉnh Bình Dương", "Lớp tối đa 8 học viên", "IELTS 7.5+"]}
                ctaLabel="Xem chi tiết &amp; Ứng tuyển"
                onCtaClick={() => navigate("/careers/ielts-teacher")}
              />

              <PlaceholderCard
                variant="job"
                badge="Toàn thời gian / Bán thời gian"
                title="Giáo Viên Tiếng Anh THCS &amp; THPT"
                subtitle="Ban Đào Tạo Phổ Thông"
                description="Giảng dạy củng cố ngữ pháp, từ vựng và 4 kỹ năng; luyện thi chuyển cấp và xây dựng nền tảng học thuật cho học sinh THCS và THPT."
                metadata={["TP. Dĩ An, Tỉnh Bình Dương", "Sĩ số 8–10 học sinh", "IELTS 7.0+ / ĐH Ngôn Ngữ Anh"]}
                ctaLabel="Xem chi tiết &amp; Ứng tuyển"
                onCtaClick={() => navigate("/careers/k12-english-teacher")}
              />

              <PlaceholderCard
                variant="job"
                badge="Toàn thời gian"
                title="Chuyên Viên Điều Phối Học Thuật"
                subtitle="Phòng Vận Hành &amp; Khảo Thí"
                description="Điều phối lịch học, theo dõi tiến độ nộp bài và làm bài sửa của học viên trên hệ thống NextBand; đảm bảo chất lượng vận hành lớp học."
                metadata={["TP. Dĩ An, Tỉnh Bình Dương", "Vận hành NextBand LMS", "Chế độ đãi ngộ tốt"]}
                ctaLabel="Xem chi tiết &amp; Ứng tuyển"
                onCtaClick={() => navigate("/careers/academic-coordinator")}
              />

              <PlaceholderCard
                variant="job"
                badge="Bán thời gian"
                title="Trợ Giảng Học Thuật (TA)"
                subtitle="Ban Hỗ Trợ Học Tập"
                description="Đồng hành hỗ trợ học viên luyện tập phát âm IPA, giải đáp thắc mắc bài tập cơ bản và hỗ trợ tổ chức các kỳ thi thử Cambridge định kỳ."
                metadata={["TP. Dĩ An, Tỉnh Bình Dương", "Linh hoạt ca làm", "Cơ hội rèn luyện chuyên môn"]}
                ctaLabel="Xem chi tiết &amp; Ứng tuyển"
                onCtaClick={() => navigate("/careers/teaching-assistant")}
              />
            </div>
          </div>

          {/* Application Process Box */}
          <div className="p-8 sm:p-10 rounded-3xl bg-brand-blue text-white space-y-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-white border border-white/20 text-xs font-extrabold uppercase tracking-wider">
              <Mail className="h-4 w-4 text-brand-cyan" />
              <span>Quy Trình Ứng Tuyển Trực Tiếp</span>
            </div>

            <div className="space-y-3 max-w-2xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-black">
                Sẵn sàng bước vào hành trình tôi luyện cùng ARIS?
              </h3>
              <p className="text-sm sm:text-base text-white/90 leading-relaxed">
                Gửi hồ sơ gồm <strong>CV chi tiết</strong> và <strong>Bản scan Bảng điểm IELTS</strong> trực tiếp về hòm thư học thuật của chúng tôi.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white/10 border border-white/20 max-w-xl mx-auto text-left space-y-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-brand-cyan">Email nhận hồ sơ:</span>
                <a
                  href="mailto:arisieltsdeeplearning@gmail.com"
                  className="font-bold underline text-white hover:text-brand-cyan"
                >
                  arisieltsdeeplearning@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-brand-cyan">Tiêu đề email:</span>
                <span className="font-mono bg-black/30 px-2.5 py-1 rounded text-white text-xs">
                  [Vị trí Ứng tuyển] - Họ và tên
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                size="lg"
                onClick={() => {
                  window.location.href = "mailto:arisieltsdeeplearning@gmail.com?subject=[Vị trí Ứng tuyển] - Họ và tên";
                }}
                className="rounded-2xl px-8 h-14 font-extrabold text-base bg-brand-red hover:bg-brand-red-hover text-white shadow-md border-0 gap-2.5"
              >
                <Send className="h-4 w-4" />
                <span>Gửi Hồ Sơ Ứng Tuyển Ngay</span>
              </Button>
            </div>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}
