import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { SectionContainer } from "@/components/public/SectionContainer";
import { AcademicRankSystem } from "@/components/public/AcademicRankSystem";
import { PlaceholderCard } from "@/components/public/PlaceholderCard";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/common/SEO";
import {
  ArrowRight,
  Sparkles,
  BookOpen,
  Target,
  Brain,
  Award,
  Layers,
  GraduationCap,
  Users,
  Compass,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

export default function PublicHomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      <SEO
        title="Học Viện Đào Tạo & Khảo Thí IELTS Chuẩn Học Thuật"
        description="ARIS IELTS — Hệ thống khảo thí và đào tạo IELTS chuẩn học thuật. Định hướng nâng cao năng lực ngôn ngữ thực chất và phương pháp tư duy phản biện."
      />

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-border/60 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left: Text & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary-soft text-primary border border-primary/20 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>ARIS Academic Institution • NextBand Platform</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-[1.15]">
                Hệ Thống Đào Tạo &amp; Khảo Thí IELTS{" "}
                <span className="text-primary underline decoration-primary/30 underline-offset-4">
                  Chuẩn Học Thuật
                </span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Xây dựng năng lực ngôn ngữ học thuật thực chất thông qua hệ thống phân cấp 7 bậc tiêu chuẩn, phương pháp tư duy phản biện và nền tảng luyện tập NextBand.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3.5">
                <Button
                  size="lg"
                  onClick={() => navigate("/courses")}
                  className="rounded-xl px-6 h-12 font-bold text-xs sm:text-sm bg-primary hover:bg-primary-hover text-primary-foreground shadow-sm gap-2"
                >
                  <span>Khám phá lộ trình học</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/assessment")}
                  className="rounded-xl px-6 h-12 font-bold text-xs sm:text-sm border-border hover:bg-muted text-foreground"
                >
                  Kiểm tra trình độ đầu vào
                </Button>
              </div>

              {/* Quick Trust Indicators */}
              <div className="pt-6 border-t border-border/60 flex flex-wrap items-center gap-6 text-xs text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Chuẩn khảo thí Cambridge
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Đội ngũ giảng viên 8.0+
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Hệ thống LMS cá nhân hóa
                </span>
              </div>
            </div>

            {/* Right: Academic Hero Visual Skeleton */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
                      Academic Framework
                    </span>
                    <h4 className="font-extrabold text-foreground text-sm">
                      Tiến Trình 7 Cấp Bậc
                    </h4>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-primary-soft text-primary">
                    ARIS-7
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { rank: "Rank 7", name: "Học Bá", state: "Hoàn thiện tư duy 7.5+" },
                    { rank: "Rank 6", name: "Học Sư", state: "Làm chủ phương pháp 6.5+" },
                    { rank: "Rank 5", name: "Học Sĩ", state: "Xây dựng lập luận 5.5+" },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-primary">
                          {item.rank}
                        </span>
                        <span className="text-xs font-bold text-foreground">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {item.state}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-primary text-primary-foreground space-y-1.5">
                  <div className="text-xs font-semibold text-primary-foreground/80 flex items-center gap-1.5">
                    <Brain className="h-3.5 w-3.5" />
                    <span>Phương pháp tiếp cận</span>
                  </div>
                  <p className="text-xs text-primary-foreground/95 leading-relaxed">
                    Đánh giá toàn diện 4 kỹ năng dựa trên cấu trúc ngữ pháp học thuật, phản xạ từ vựng và tư duy logic.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BRAND & PHILOSOPHY STATEMENT */}
      <SectionContainer
        badge="Triết Lý Học Thuật"
        title="Tập Trung Vào Năng Lực Cốt Lõi, Không Dạy Mẹo Vặt"
        description="Tại ARIS, chúng tôi tin rằng điểm số IELTS cao là kết quả tất yếu của một nền tảng tư duy học thuật vững chắc và phương pháp tiếp cận ngôn ngữ có kỷ luật."
        containerSize="md"
        background="muted"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-card border border-border/70 space-y-3">
            <div className="p-2.5 rounded-xl bg-primary-soft text-primary w-fit">
              <Brain className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground text-base">Tư Duy Học Thuật</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Phát triển khả năng phân tích, tổng hợp và phản biện thông tin thay vì học vẹt câu mẫu.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/70 space-y-3">
            <div className="p-2.5 rounded-xl bg-primary-soft text-primary w-fit">
              <Target className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground text-base">Lộ Trình Đo Lường</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Mỗi bước tiến đều được định lượng rõ ràng qua hệ thống 7 cấp bậc và 4 giai đoạn phát triển.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/70 space-y-3">
            <div className="p-2.5 rounded-xl bg-primary-soft text-primary w-fit">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground text-base">Chấm Chữa Kỹ Lưỡng</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Giáo viên nhận xét chi tiết từng lỗi ngữ pháp, logic lập luận và phát âm trong từng bài tập.
            </p>
          </div>
        </div>
      </SectionContainer>

      {/* 3. WHY ARIS */}
      <SectionContainer
        badge="Khác Biệt Của ARIS"
        title="Mô Hình Đào Tạo Kết Hợp Trực Tiếp & Hệ Thống Số"
        description="Sự đồng bộ liền mạch giữa các buổi học tương tác chuyên sâu và nền tảng quản lý bài tập NextBand giúp học viên tối ưu thời gian học tập."
        background="default"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          <PlaceholderCard
            variant="feature"
            badge="Khảo thí chuẩn"
            title="Đề Thi Thực Chiến"
            description="Bộ đề thi bám sát cấu trúc khảo thí mới nhất, phân tích chi tiết từng dạng câu hỏi và kỹ năng làm bài."
            metadata={["Format chuẩn", "Cập nhật định kỳ"]}
          />
          <PlaceholderCard
            variant="feature"
            badge="Giảng viên"
            title="Đội Ngũ Tận Tâm"
            description="100% giảng viên sở hữu chứng chỉ IELTS 8.0+ và kinh nghiệm sư phạm chuyên sâu trong đào tạo học thuật."
            metadata={["IELTS 8.0+", "Theo sát tiến độ"]}
          />
          <PlaceholderCard
            variant="feature"
            badge="Nền tảng NextBand"
            title="Học Tập Cá Nhân Hóa"
            description="Nộp bài, nhận phản hồi sửa bài chi tiết và theo dõi tiến độ từng kỹ năng trực tiếp trên hệ thống."
            metadata={["Chấm chữa chi tiết", "Lưu trữ bài nộp"]}
          />
          <PlaceholderCard
            variant="feature"
            badge="Kỷ luật"
            title="Cam Kết Đầu Ra Thực Chất"
            description="Mục tiêu điểm số được xây dựng dựa trên sự tiến bộ thực sự trong tư duy và năng lực sử dụng ngôn ngữ."
            metadata={["Tiến bộ từng ngày", "Báo cáo định kỳ"]}
          />
        </div>
      </SectionContainer>

      {/* 4. ACADEMIC RANK SYSTEM */}
      <SectionContainer
        id="academic-system"
        badge="Hệ Thống Phân Cấp"
        title="7 Cấp Bậc Học Thuật — Chuẩn Đo Lường Năng Lực"
        description="Lộ trình học tập tại ARIS được chuẩn hóa thành 7 cấp bậc chính thức từ Học Đồ đến Học Đế, mỗi bậc gồm 4 giai đoạn tiến trình cụ thể."
        background="elevated"
      >
        <AcademicRankSystem initialRank={6} />
      </SectionContainer>

      {/* 5. THE ARIS WAY / LEARNING METHOD */}
      <SectionContainer
        badge="Phương Pháp Đào Tạo"
        title="The ARIS Way — 4 Trụ Cột Phát Triển Ngôn Ngữ"
        description="Phương pháp đào tạo khoa học giúp học viên vượt qua các rào cản tâm lý và nâng cao band điểm một cách tự nhiên, bền vững."
        background="default"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <div className="p-7 rounded-2xl border border-border/80 bg-card space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary-soft text-primary font-bold text-xs">
                01
              </div>
              <h3 className="font-extrabold text-foreground text-lg">
                Giải Phẫu Cấu Trúc Đề (Deconstructive Analysis)
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Phân tích sâu bản chất từng dạng đề thi, hiểu rõ tiêu chí chấm điểm và bẫy tư duy thường gặp để phản xạ chính xác.
            </p>
          </div>

          <div className="p-7 rounded-2xl border border-border/80 bg-card space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary-soft text-primary font-bold text-xs">
                02
              </div>
              <h3 className="font-extrabold text-foreground text-lg">
                Tái Cấu Trúc Lập Luận (Structured Reasoning)
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Huấn luyện kỹ năng xây dựng luận điểm logic, triển khai ví dụ thuyết phục và kiểm soát mạch lạc trong Writing &amp; Speaking.
            </p>
          </div>

          <div className="p-7 rounded-2xl border border-border/80 bg-card space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary-soft text-primary font-bold text-xs">
                03
              </div>
              <h3 className="font-extrabold text-foreground text-lg">
                Kỷ Luật Thực Hành (Deliberate Practice)
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Luyện tập có chủ đích theo từng điểm yếu cụ thể thay vì làm đề tràn lan không mục đích.
            </p>
          </div>

          <div className="p-7 rounded-2xl border border-border/80 bg-card space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary-soft text-primary font-bold text-xs">
                04
              </div>
              <h3 className="font-extrabold text-foreground text-lg">
                Vòng Lặp Phản Hồi (Feedback Loop)
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nhận xét sửa lỗi liên tục từ giảng viên trên NextBand, giúp học viên không lặp lại lỗi sai trong các bài nộp tiếp theo.
            </p>
          </div>
        </div>
      </SectionContainer>

      {/* 6. LEARNING PROCESS */}
      <SectionContainer
        badge="Quy Trình Học Tập"
        title="Quy Trình Học Thuật 5 Bước Khép Kín"
        description="Từ khâu kiểm tra đầu vào đến ngày thi chính thức, học viên luôn được định hướng và theo dõi sát sao."
        background="muted"
      >
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 text-center">
          {[
            { step: "01", title: "Đánh Giá Đầu Vào", desc: "Xác định chính xác trình độ và điểm nghẽn hiện tại." },
            { step: "02", title: "Thiết Kế Lộ Trình", desc: "Phân bổ thời gian và khóa học theo mục tiêu điểm số." },
            { step: "03", title: "Học Chuyên Sâu", desc: "Tiếp thu kiến thức và kỹ năng qua các bài giảng trọng tâm." },
            { step: "04", title: "Làm Bài & Sửa Lỗi", desc: "Nộp bài tập trên NextBand và nhận phản hồi chi tiết." },
            { step: "05", title: "Khảo Thí Thử", desc: "Thi thử trong điều kiện phòng thi thật trước khi thi chính thức." },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-card border border-border/70 space-y-2.5 text-left sm:text-center flex flex-col justify-between"
            >
              <div className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary-soft w-fit mx-0 sm:mx-auto">
                Bước {item.step}
              </div>
              <h3 className="font-bold text-foreground text-sm">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </SectionContainer>

      {/* 7. EVIDENCE & RESULTS */}
      <SectionContainer
        badge="Thành Tích &amp; Bằng Chứng"
        title="Minh Chứng Từ Sự Tiến Bộ Của Học Viên"
        description="Kết quả học tập thực chất được thể hiện qua các mốc thăng hạng và điểm thi chính thức của học viên ARIS."
        background="default"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <PlaceholderCard
            variant="result"
            badge="Thành tích nổi bật"
            title="IELTS Overall 7.5"
            subtitle="Học viên ARIS Intensive"
            description="Tăng từ 5.5 lên 7.5 sau khóa học 6 tháng với sự cải thiện vượt bậc ở kỹ năng Writing và Speaking."
            metadata={["Reading: 8.5", "Listening: 8.0", "Writing: 7.0"]}
          />
          <PlaceholderCard
            variant="result"
            badge="Thành tích nổi bật"
            title="IELTS Overall 8.0"
            subtitle="Học viên ARIS Master"
            description="Đạt điểm tuyệt đối ở kỹ năng Listening và 7.5 Writing sau quá trình rèn luyện tư duy phản biện chuyên sâu."
            metadata={["Listening: 9.0", "Reading: 8.5", "Speaking: 7.5"]}
          />
          <PlaceholderCard
            variant="result"
            badge="Thành tích nổi bật"
            title="IELTS Overall 7.0"
            subtitle="Học viên ARIS Foundation"
            description="Xây dựng nền tảng từ mất gốc và đạt mục tiêu xét tuyển đại học chỉ sau 2 kỳ học liên tục."
            metadata={["Writing: 7.0", "Speaking: 7.0", "Reading: 7.5"]}
          />
        </div>

        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => navigate("/results")}
            className="rounded-xl px-5 text-xs font-bold border-border"
          >
            <span>Xem thêm bảng vàng thành tích</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      </SectionContainer>

      {/* 8. PROGRAMS & COURSES */}
      <SectionContainer
        badge="Chương Trình Đào Tạo"
        title="Các Khóa Học Được Thiết Kế Theo Mục Tiêu"
        description="Lựa chọn chương trình học phù hợp với cấp bậc hiện tại và mục tiêu đầu ra của bạn."
        background="muted"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <PlaceholderCard
            variant="course"
            badge="Cơ bản"
            title="ARIS Foundation (3.5 - 5.0)"
            subtitle="Củng cố nền tảng học thuật"
            description="Khóa học tập trung vào ngữ âm chuẩn, từ vựng học thuật cốt lõi và làm quen với cấu trúc đề thi IELTS."
            metadata={["Thời lượng: 12 tuần", "4 Kỹ năng căn bản", "NextBand LMS"]}
            ctaLabel="Chi tiết khóa học"
            onCtaClick={() => navigate("/courses/foundation")}
          />
          <PlaceholderCard
            variant="course"
            badge="Chuyên sâu"
            title="ARIS Intensive (5.0 - 6.5)"
            subtitle="Phát triển kỹ năng thực chiến"
            description="Làm chủ các dạng bài thi nâng cao, rèn luyện phương pháp viết học thuật và phản xạ giao tiếp theo chủ đề."
            metadata={["Thời lượng: 14 tuần", "Chấm bài 1:1", "Thi thử định kỳ"]}
            ctaLabel="Chi tiết khóa học"
            onCtaClick={() => navigate("/courses/intensive")}
          />
          <PlaceholderCard
            variant="course"
            badge="Nâng cao"
            title="ARIS Master (6.5 - 7.5+)"
            subtitle="Đỉnh cao tư duy học thuật"
            description="Tập trung tối đa vào độ chính xác ngữ nghĩa, lập luận sâu sắc và kiểm soát phong cách học thuật bản ngữ."
            metadata={["Thời lượng: 10 tuần", "Giảng viên 8.0+", "Phản hồi nâng cao"]}
            ctaLabel="Chi tiết khóa học"
            onCtaClick={() => navigate("/courses/master")}
          />
        </div>
      </SectionContainer>

      {/* 9. TEACHERS & FACULTY */}
      <SectionContainer
        badge="Đội Ngũ Học Thuật"
        title="Giảng Viên Giàu Kinh Nghiệm &amp; Chuyên Môn Sâu"
        description="Đội ngũ giảng viên tại ARIS đồng hành cùng học viên trong từng bài tập và định hướng chiến lược học tập cá nhân."
        background="default"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          <PlaceholderCard
            variant="teacher"
            badge="Học thuật"
            title="Lưu Văn Đẳng"
            subtitle="Academic Director"
            description="Giảng viên phụ trách chuyên môn học thuật với chứng chỉ IELTS 8.0+ và nhiều năm nghiên cứu phương pháp giảng dạy."
            metadata={["IELTS 8.0+", "Trưởng ban Chuyên môn"]}
          />
          <PlaceholderCard
            variant="teacher"
            badge="Writing & Speaking"
            title="Giảng Viên Cao Cấp A"
            subtitle="Lead Instructor"
            description="Chuyên gia huấn luyện kỹ năng Viết và Nói học thuật với phương pháp sửa bài tỉ mỉ và phản biện logic."
            metadata={["IELTS 8.5", "5+ năm kinh nghiệm"]}
          />
          <PlaceholderCard
            variant="teacher"
            badge="Reading & Listening"
            title="Giảng Viên Cao Cấp B"
            subtitle="Senior Instructor"
            description="Phụ trách phương pháp giải phẫu văn bản học thuật và chiến lược xử lý bài thi dưới áp lực thời gian."
            metadata={["IELTS 8.0", "Thạc sĩ TESOL"]}
          />
          <PlaceholderCard
            variant="teacher"
            badge="Khảo thí"
            title="Giảng Viên Cao Cấp C"
            subtitle="Assessment Specialist"
            description="Chuyên gia đánh giá năng lực đầu vào và xây dựng ngân hàng câu hỏi chuẩn khảo thí quốc tế."
            metadata={["IELTS 8.0", "Chuyên viên Khảo thí"]}
          />
        </div>
      </SectionContainer>

      {/* 10. CAREERS / JOIN ARIS */}
      <SectionContainer
        badge="Tuyển Dụng &amp; Đồng Hành"
        title="Gia Nhập Đội Ngũ Học Thuật ARIS"
        description="Chúng tôi luôn tìm kiếm những giảng viên và chuyên viên học thuật đam mê đổi mới giáo dục và yêu thích sự chuẩn mực."
        background="muted"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <PlaceholderCard
            variant="job"
            badge="Toàn thời gian"
            title="Giảng Viên IELTS Writing &amp; Speaking"
            subtitle="Ban Học thuật"
            description="Yêu cầu IELTS 8.0+ (không kỹ năng nào dưới 7.5), có tư duy sư phạm bài bản và tinh thần trách nhiệm cao."
            metadata={["Dĩ An, Bình Dương / TP.HCM", "Môi trường học thuật"]}
            ctaLabel="Xem mô tả công việc"
            onCtaClick={() => navigate("/careers/ielts-teacher")}
          />
          <PlaceholderCard
            variant="job"
            badge="Toàn thời gian"
            title="Chuyên Viên Điều Phối Học Thuật"
            subtitle="Academic Coordinator"
            description="Quản lý lịch trình đào tạo, theo dõi chất lượng bài chấm và hỗ trợ vận hành lớp học trên NextBand."
            metadata={["Toàn thời gian", "Cơ hội phát triển"]}
            ctaLabel="Xem mô tả công việc"
            onCtaClick={() => navigate("/careers/academic-coordinator")}
          />
          <PlaceholderCard
            variant="job"
            badge="Bán thời gian"
            title="Trợ Giảng Học Thuật (Teaching Assistant)"
            subtitle="Hỗ trợ học viên"
            description="Hỗ trợ hướng dẫn học viên thực hành bài tập và tổ chức các buổi thi thử định kỳ."
            metadata={["IELTS 7.0+", "Linh hoạt thời gian"]}
            ctaLabel="Xem mô tả công việc"
            onCtaClick={() => navigate("/careers/teaching-assistant")}
          />
        </div>
      </SectionContainer>

      {/* 11. FINAL CTA BANNER */}
      <section className="py-16 sm:py-20 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 text-white border border-white/20 text-xs font-semibold">
            <GraduationCap className="h-4 w-4" />
            <span>Bắt Đầu Hành Trình Học Thuật</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Sẵn Sàng Đạt Điểm IELTS Mục Tiêu Với Lộ Trình Chuẩn Học Thuật?
          </h2>

          <p className="text-sm sm:text-base text-primary-foreground/90 leading-relaxed max-w-2xl mx-auto">
            Kiểm tra năng lực đầu vào miễn phí để nhận phân tích chi tiết điểm mạnh, điểm yếu và lộ trình học tập cá nhân hóa từ ban học thuật ARIS.
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3.5">
            <Button
              size="lg"
              onClick={() => navigate("/assessment")}
              className="rounded-xl px-7 h-12 font-bold text-xs sm:text-sm bg-white text-primary hover:bg-white/95 shadow-sm border-0 gap-2"
            >
              <span>Đăng ký đánh giá năng lực ngay</span>
              <ArrowRight className="h-4 w-4 text-primary" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/contact")}
              className="rounded-xl px-7 h-12 font-bold text-xs sm:text-sm border-white/30 text-white hover:bg-white/10"
            >
              Liên hệ tư vấn chi tiết
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
