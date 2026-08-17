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
  CheckCircle2,
  FileCheck,
  RefreshCw,
  Clock,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

export default function PublicHomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      <SEO
        title="ARIS — Học Tiếng Anh Từ Bản Chất"
        description="ARIS — Học tiếng Anh từ bản chất. Không học mẹo. Không học thuộc bài mẫu. Định vị chính xác năng lực và bóc tách từng lỗi sai để đạt điểm IELTS mong muốn."
      />

      {/* ========================================================================= */}
      {/* SECTION 1: HERO SECTION                                                   */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-border/60 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left: Headline, Subheadline & Primary Action */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Học Viện ARIS</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-[1.15]">
                Học tiếng Anh từ bản chất.{" "}
                <span className="text-primary block sm:inline">
                  Không học mẹo. Không học thuộc bài mẫu.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                ARIS giúp bạn hiểu rõ năng lực hiện tại, bóc tách từng lỗi sai và xây dựng tư duy ngôn ngữ vững chắc để đạt điểm IELTS mong muốn.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3.5">
                <Button
                  size="lg"
                  onClick={() => navigate("/assessment")}
                  className="rounded-xl px-6 h-12 font-bold text-xs sm:text-sm bg-primary hover:bg-primary-hover text-primary-foreground shadow-sm gap-2"
                >
                  <span>Đánh giá năng lực miễn phí</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/method")}
                  className="rounded-xl px-6 h-12 font-bold text-xs sm:text-sm border-border hover:bg-muted text-foreground"
                >
                  Khám phá phương pháp học
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-border/60 flex flex-wrap items-center gap-6 text-xs text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Chuẩn khảo thí Cambridge
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Giảng viên chuyên môn 8.0+
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Hệ thống học tập riêng
                </span>
              </div>
            </div>

            {/* Right: 3-Question Framework Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-5">
                <div className="space-y-1 border-b border-border/60 pb-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
                    Khung Đào Tạo ARIS
                  </span>
                  <h4 className="font-extrabold text-foreground text-sm">
                    3 Câu Hỏi Định Hình Sự Tiến Bộ
                  </h4>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1 text-left">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <span className="h-5 w-5 rounded-full bg-primary-soft text-primary font-mono text-[11px] flex items-center justify-center font-bold">
                        1
                      </span>
                      <span>Bạn đang ở đâu?</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground pl-7">
                      Định vị chính xác trình độ hiện tại theo khung 7 cấp bậc.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1 text-left">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <span className="h-5 w-5 rounded-full bg-primary-soft text-primary font-mono text-[11px] flex items-center justify-center font-bold">
                        2
                      </span>
                      <span>Điều gì cản trở bạn?</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground pl-7">
                      Bóc tách chi tiết từng lỗi sai về ngữ pháp, từ vựng và lập luận.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1 text-left">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <span className="h-5 w-5 rounded-full bg-primary-soft text-primary font-mono text-[11px] flex items-center justify-center font-bold">
                        3
                      </span>
                      <span>Bước tiếp theo là gì?</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground pl-7">
                      Lộ trình rèn luyện rõ ràng và bài tập sửa lỗi có người theo sát.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-primary text-primary-foreground text-left space-y-1">
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Học có kỷ luật &amp; đo lường minh bạch</span>
                  </div>
                  <p className="text-[11px] text-primary-foreground/90 leading-relaxed">
                    Mọi bài nộp được lưu trữ và chấm chữa chi tiết trên hệ thống để bạn thấy rõ sự tiến bộ qua từng ngày.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: THE REAL PROBLEM (VẤN ĐỀ THẬT SỰ)                             */}
      {/* ========================================================================= */}
      <SectionContainer
        badge="Thực Tế Người Học"
        title="Vì sao bạn giải nhiều đề nhưng điểm số vẫn đứng yên?"
        description="Làm 100 bài tập mà không được chỉ rõ lỗi sai thì bạn chỉ đang lặp lại lỗi cũ 100 lần. Điểm số chỉ thay đổi khi bạn biết chính xác vì sao câu văn của mình chưa đạt."
        containerSize="md"
        background="muted"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-card border border-border/70 space-y-2.5">
            <div className="p-2.5 rounded-xl bg-primary-soft text-primary w-fit">
              <Brain className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground text-base">Học vẹt bài mẫu</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Điểm thi có thể tạm tăng trong ngắn hạn, nhưng bạn mất hoàn toàn khả năng tự diễn giải ý tưởng khi gặp đề lạ.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/70 space-y-2.5">
            <div className="p-2.5 rounded-xl bg-primary-soft text-primary w-fit">
              <Target className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground text-base">Nhận xét chung chung</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Những lời phê như "cần viết tự nhiên hơn" không giúp bạn biết phải sửa từ nào hay cấu trúc ngữ pháp nào.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/70 space-y-2.5">
            <div className="p-2.5 rounded-xl bg-primary-soft text-primary w-fit">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground text-base">Thiếu lộ trình đo lường</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Học theo cảm tính mà không biết mình đang ở chặng nào và cần hoàn thiện điều gì để bứt phá lên band tiếp theo.
            </p>
          </div>
        </div>
      </SectionContainer>

      {/* ========================================================================= */}
      {/* SECTION 3: THE ARIS WAY (CÁCH HỌC KHÁC BIỆT)                             */}
      {/* ========================================================================= */}
      <SectionContainer
        badge="Phương Pháp Học"
        title="Biến ý tưởng trong đầu thành câu tiếng Anh chuẩn xác."
        description="Thay vì dịch từng từ từ tiếng Việt hay cố nhồi từ vựng phức tạp, ARIS hướng dẫn bạn cách tổ chức suy nghĩ mạch lạc và biểu đạt đúng ngữ cảnh qua 3 bước trực quan."
        background="default"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-7 rounded-2xl border border-border/80 bg-card space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-mono font-extrabold text-sm px-2.5 py-1 rounded-lg bg-primary-soft text-primary">
                01
              </span>
              <h3 className="font-bold text-foreground text-base">
                Hiểu bản chất câu hỏi
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Nhận diện chính xác yêu cầu của đề bài, bóc tách các tiêu chí chấm điểm để phản xạ câu trả lời đúng trọng tâm.
            </p>
          </div>

          <div className="p-7 rounded-2xl border border-border/80 bg-card space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-mono font-extrabold text-sm px-2.5 py-1 rounded-lg bg-primary-soft text-primary">
                02
              </span>
              <h3 className="font-bold text-foreground text-base">
                Sắp xếp ý tưởng mạch lạc
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Xây dựng luận điểm logic, có mở đầu, lý giải nguyên nhân và ví dụ cụ thể thay vì liệt kê ý rời rạc.
            </p>
          </div>

          <div className="p-7 rounded-2xl border border-border/80 bg-card space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-mono font-extrabold text-sm px-2.5 py-1 rounded-lg bg-primary-soft text-primary">
                03
              </span>
              <h3 className="font-bold text-foreground text-base">
                Sửa lỗi đến khi chuẩn
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Giáo viên nhận xét chi tiết từng câu văn và bạn tự tay viết lại bài sửa để không lặp lại lỗi cũ trong bài tiếp theo.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/method")}
            className="text-xs font-bold text-primary hover:text-primary-hover hover:bg-primary-soft gap-1.5"
          >
            <span>Tìm hiểu chi tiết phương pháp The ARIS Way</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </SectionContainer>

      {/* ========================================================================= */}
      {/* SECTION 4: THE ARIS-7 ACADEMIC RANK SYSTEM                               */}
      {/* ========================================================================= */}
      <SectionContainer
        id="academic-system"
        badge="Bản Đồ Tiến Độ"
        title="Bạn đang ở đâu trên hành trình học tiếng Anh?"
        description="ARIS chuẩn hóa lộ trình thành 7 cấp bậc rõ ràng. Mỗi bậc đều có tiêu chuẩn năng lực cụ thể, giúp bạn biết mình đã làm được gì và cần thêm điều gì để nâng band."
        background="elevated"
      >
        <AcademicRankSystem initialRank={5} />

        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => navigate("/academic-system")}
            className="rounded-xl px-5 text-xs font-bold border-border"
          >
            <span>Xem toàn bộ tiêu chuẩn 7 cấp bậc &amp; 4 giai đoạn tiến trình</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      </SectionContainer>

      {/* ========================================================================= */}
      {/* SECTION 5: NEXTBAND LEARNING SYSTEM (HỆ THỐNG HỌC TẬP RIÊNG)              */}
      {/* ========================================================================= */}
      <SectionContainer
        badge="Hệ Thống Học Tập Riêng"
        title="Mọi bài làm của bạn đều được theo dõi và sửa chữa kỹ lưỡng."
        description="Không gửi bài qua tin nhắn trôi nổi. Toàn bộ bài nộp, nhận xét của giáo viên và lịch sử bài sửa đều được lưu trữ minh bạch trên hệ thống học tập của ARIS."
        background="default"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <PlaceholderCard
            variant="feature"
            badge="Chấm chữa chi tiết"
            title="Sửa lỗi từng câu"
            description="Giáo viên chỉ rõ từng lỗi sai ngữ pháp, từ vựng và cách dùng từ để bạn hiểu rõ nguyên nhân câu văn chưa chuẩn."
            metadata={["Phân tích ngữ pháp", "Gợi ý viết lại"]}
          />

          <PlaceholderCard
            variant="feature"
            badge="Kỷ luật luyện tập"
            title="Làm bài sửa (Re-attempt)"
            description="Sau khi nhận phản hồi, học viên tự tay viết lại bài sửa để khắc phục triệt để lỗ hổng trước khi chuyển sang bài mới."
            metadata={["Khắc phục lỗi cũ", "Đo lường tiến bộ"]}
          />

          <PlaceholderCard
            variant="feature"
            badge="Minh bạch tiến trình"
            title="Nhật ký bài nộp"
            description="Dễ dàng xem lại toàn bộ lịch sử bài nộp, so sánh bài làm đầu khóa và hiện tại để thấy rõ sự tiến bộ thực tế."
            metadata={["Lưu trữ bài nộp", "Biểu đồ kỹ năng"]}
          />
        </div>
      </SectionContainer>

      {/* ========================================================================= */}
      {/* SECTION 6: PROGRAMS & COURSES (CHƯƠNG TRÌNH ĐÀO TẠO)                     */}
      {/* ========================================================================= */}
      <SectionContainer
        badge="Lộ Trình Phù Hợp"
        title="Chọn khóa học đúng với điểm xuất phát của bạn."
        description="Không học lớp quá dễ gây lãng phí thời gian, không học lớp quá khó gây nản lòng. Các khóa học tại ARIS được thiết kế theo đúng từng mốc năng lực."
        background="muted"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <PlaceholderCard
            variant="course"
            badge="Khởi động"
            title="ARIS Foundation"
            subtitle="Mục tiêu 3.5 - 5.0 (Học Đồ &amp; Học Giả)"
            description="Củng cố phát âm chuẩn IPA, từ vựng cốt lõi và làm quen với ngữ pháp câu trong văn bản học thuật."
            metadata={["Thời lượng: 12 tuần", "4 Kỹ năng căn bản", "NextBand LMS"]}
            ctaLabel="Xem chi tiết khóa học"
            onCtaClick={() => navigate("/courses/foundation")}
          />

          <PlaceholderCard
            variant="course"
            badge="Trọng tâm"
            title="ARIS Intensive"
            subtitle="Mục tiêu 5.0 - 6.5 (Học Sĩ &amp; Học Sư)"
            description="Luyện viết luận Task 2 có luận điểm sắc bén và phản xạ Nói theo các chủ đề chuyên sâu của bài thi IELTS."
            metadata={["Thời lượng: 14 tuần", "Chấm bài chi tiết", "Thi thử định kỳ"]}
            ctaLabel="Xem chi tiết khóa học"
            onCtaClick={() => navigate("/courses/intensive")}
          />

          <PlaceholderCard
            variant="course"
            badge="Bứt phá"
            title="ARIS Master"
            subtitle="Mục tiêu 6.5 - 7.5+ (Học Bá &amp; Học Tôn)"
            description="Tinh chỉnh văn phong tự nhiên, kiểm soát độ chính xác ngữ nghĩa và hoàn thiện tư duy phản biện cấp cao."
            metadata={["Thời lượng: 10 tuần", "Giảng viên 8.0+", "Phản hồi nâng cao"]}
            ctaLabel="Xem chi tiết khóa học"
            onCtaClick={() => navigate("/courses/master")}
          />
        </div>
      </SectionContainer>

      {/* ========================================================================= */}
      {/* SECTION 7: EVIDENCE & FACULTY (KẾT QUẢ & ĐỘI NGŨ)                        */}
      {/* ========================================================================= */}
      <SectionContainer
        badge="Kết Quả Thực Tế"
        title="Tiến bộ được đo bằng năng lực thật, không phải lời hứa."
        description="Học viên ARIS đạt điểm số mục tiêu nhờ quá trình rèn luyện nghiêm túc và sự đồng hành trực tiếp từ đội ngũ giảng viên chuyên môn."
        background="default"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <PlaceholderCard
            variant="result"
            badge="Thành tích nổi bật"
            title="IELTS Overall 8.0"
            subtitle="Học viên ARIS Master"
            description="Đạt 9.0 Listening, 8.5 Reading sau quá trình rèn luyện tư duy lập luận và làm bài trên hệ thống học tập."
            metadata={["Listening: 9.0", "Reading: 8.5", "Writing: 7.5"]}
          />

          <PlaceholderCard
            variant="result"
            badge="Nâng band bền vững"
            title="IELTS Overall 7.5"
            subtitle="Học viên ARIS Intensive"
            description="Tăng từ 5.5 lên 7.5 sau lộ trình học tập kỷ luật và được giáo viên sửa chi tiết từng bài viết hàng tuần."
            metadata={["Reading: 8.5", "Listening: 8.0", "Speaking: 7.0"]}
          />

          <PlaceholderCard
            variant="teacher"
            badge="Đội ngũ chuyên môn"
            title="Lưu Văn Đẳng &amp; Đội Ngũ"
            subtitle="Ban Chuyên môn ARIS"
            description="100% giảng viên sở hữu chứng chỉ IELTS 8.0+, trực tiếp giảng dạy, chấm chữa bài và theo sát tiến độ học viên."
            metadata={["IELTS 8.0+", "Trực tiếp chấm bài"]}
            ctaLabel="Xem thêm bảng vàng &amp; Giảng viên"
            onCtaClick={() => navigate("/results")}
          />
        </div>
      </SectionContainer>

      {/* ========================================================================= */}
      {/* SECTION 8: FINAL CONVERSION BANNER (HÀNH ĐỘNG NGAY)                       */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-20 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 text-white border border-white/20 text-xs font-semibold">
            <Target className="h-4 w-4" />
            <span>Bắt Đầu Đúng Cách</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Bắt đầu bằng việc biết chính xác bạn đang ở đâu.
          </h2>

          <p className="text-sm sm:text-base text-primary-foreground/90 leading-relaxed max-w-2xl mx-auto">
            Làm bài kiểm tra năng lực đầu vào miễn phí để nhận phân tích chi tiết điểm mạnh, điểm yếu và gợi ý lộ trình học tập phù hợp từ ARIS.
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3.5">
            <Button
              size="lg"
              onClick={() => navigate("/assessment")}
              className="rounded-xl px-7 h-12 font-bold text-xs sm:text-sm bg-white text-primary hover:bg-white/95 shadow-sm border-0 gap-2"
            >
              <span>Làm bài kiểm tra năng lực ngay</span>
              <ArrowRight className="h-4 w-4 text-primary" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/contact")}
              className="rounded-xl px-7 h-12 font-bold text-xs sm:text-sm border-white/30 text-white hover:bg-white/10"
            >
              Liên hệ nhận tư vấn trực tiếp
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
