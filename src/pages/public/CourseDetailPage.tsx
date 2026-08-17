import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SectionContainer } from "@/components/public/SectionContainer";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/common/SEO";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  BookOpen,
  ShieldCheck,
  Sparkles,
  Target,
  Brain,
  Users,
} from "lucide-react";

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const courseCatalog: Record<
    string,
    {
      title: string;
      target: string;
      rank: string;
      duration: string;
      schedule: string;
      classSize: string;
      description: string;
      modules: string[];
      outcomes: string[];
    }
  > = {
    starter: {
      title: "Khóa Học STARTER",
      target: "Đầu vào: Mất gốc → Mục tiêu: Nền tảng 3.0",
      rank: "Tương ứng Rank 3 — Học Đồ",
      duration: "09 Tuần (27 Buổi học + Bài tập trên NextBand)",
      schedule: "03 buổi / tuần, 02 giờ / buổi",
      classSize: "Tối đa 08 học viên / lớp",
      description:
        "Khóa học dành cho học viên mất gốc hoặc chưa có nền tảng tiếng Anh, tập trung chuẩn hóa phát âm IPA, xây dựng vốn từ vựng sinh hoạt cốt lõi và làm chủ cấu trúc câu đơn căn bản.",
      modules: [
        "Chuẩn hóa 44 âm quốc tế IPA và nhận diện trọng âm từ",
        "Ngữ pháp câu đơn: Các thì căn bản, trật tự từ và các từ loại chính",
        "Xây dựng vốn từ vựng thông dụng theo các chủ đề sinh hoạt quen thuộc",
        "Luyện phản xạ nghe hiểu các mẩu hội thoại ngắn và số liệu đơn giản",
      ],
      outcomes: [
        "Phát âm chuẩn xác, không bị lai tạp âm tiếng Việt",
        "Tự tin viết và nói các câu đơn hoàn chỉnh đúng ngữ pháp",
        "Hiểu được các đoạn hội thoại giao tiếp thường ngày",
        "Sẵn sàng bước vào chặng rèn luyện DREAMER",
      ],
    },
    dreamer: {
      title: "Khóa Học DREAMER",
      target: "Đầu vào: 3.0 → Mục tiêu: Nền tảng 4.0",
      rank: "Tương ứng Rank 4 — Học Giả",
      duration: "09 Tuần (27 Buổi học + Bài tập trên NextBand)",
      schedule: "03 buổi / tuần, 02 giờ / buổi",
      classSize: "Tối đa 08 học viên / lớp",
      description:
        "Khóa học mở rộng năng lực liên kết câu, làm quen với ngữ pháp câu ghép và câu phức, đồng thời phát triển kỹ năng đọc hiểu đoạn văn học thuật ngắn không đoán mò.",
      modules: [
        "Cấu trúc câu ghép và câu phức: Mệnh đề quan hệ, liên từ chỉ nguyên nhân/kết quả",
        "Phương pháp đọc hiểu skimming & scanning nhận diện thông tin chính",
        "Kỹ năng nghe nhận diện bẫy phát âm, từ đồng nghĩa (paraphrase) cơ bản",
        "Luyện nói trả lời câu hỏi Speaking Part 1 tự nhiên, có mở rộng ý",
      ],
      outcomes: [
        "Viết được đoạn văn ngắn liên kết mạch lạc giữa các câu",
        "Đọc hiểu chính xác ý chính của bài viết học thuật ngắn",
        "Phản xạ trả lời trôi chảy các chủ đề Speaking Part 1",
        "Sẵn sàng bước vào chặng rèn luyện BUILDER",
      ],
    },
    builder: {
      title: "Khóa Học BUILDER",
      target: "Đầu vào: 4.0 → Mục tiêu: Nền tảng 5.0",
      rank: "Tương ứng Rank 5 — Học Sĩ",
      duration: "09 Tuần (27 Buổi học + Bài tập trên NextBand)",
      schedule: "03 buổi / tuần, 02 giờ / buổi",
      classSize: "Tối đa 08 học viên / lớp",
      description:
        "Khóa học bản lề chuyển giao sang định dạng bài thi IELTS, rèn luyện kỹ năng viết đoạn văn học thuật có luận điểm và xử lý các dạng bài thi Cambridge 4 kỹ năng.",
      modules: [
        "Làm quen cấu trúc đề thi 4 kỹ năng chuẩn Cambridge",
        "Tổ chức đoạn văn Writing Task 2 có câu chủ đề và giải thích lý do",
        "Kỹ năng mô tả biểu đồ đơn giản trong Writing Task 1",
        "Chiến thuật xử lý các dạng bài True/False/Not Given và Multiple Choice",
      ],
      outcomes: [
        "Nắm vững định dạng đề và tiêu chí chấm điểm bài thi IELTS",
        "Viết bài luận Task 1 & 2 hoàn chỉnh đúng cấu trúc logic",
        "Kiểm soát thời gian làm bài trong phòng thi",
        "Sẵn sàng bước vào chặng rèn luyện MASTER",
      ],
    },
    master: {
      title: "Khóa Học MASTER",
      target: "Đầu vào: 5.0 → Mục tiêu: Nền tảng 6.0",
      rank: "Tương ứng Rank 6 — Học Sư",
      duration: "09 Tuần (27 Buổi học + Bài tập trên NextBand)",
      schedule: "03 buổi / tuần, 02 giờ / buổi",
      classSize: "Tối đa 08 học viên / lớp",
      description:
        "Khóa học chuyên sâu rèn luyện kỹ năng viết luận Task 2 có lập luận chặt chẽ, mô tả biểu đồ Task 1 sắc nét và phản xạ Nói theo phương pháp The ARIS Way.",
      modules: [
        "Tái cấu trúc lập luận Writing Task 2 theo phương pháp The ARIS Way",
        "Phân tích chuyên sâu và chọn lọc số liệu nổi bật Writing Task 1",
        "Mở rộng ý tưởng Speaking Part 2 & 3 không bị ngắc ngứ hay sáo rỗng",
        "Luyện đề thi thử định kỳ có tính giờ chuẩn trên phòng thi NextBand",
      ],
      outcomes: [
        "Tự xây dựng chuỗi luận điểm logic, có dẫn chứng thuyết phục",
        "Phản xạ Nói linh hoạt, kiểm soát độ trôi chảy và ngữ pháp phức",
        "Bứt phá band điểm Listening & Reading lên mốc 6.0 - 6.5",
        "Sẵn sàng bước vào chặng rèn luyện LEADER",
      ],
    },
    leader: {
      title: "Khóa Học LEADER",
      target: "Đầu vào: 6.0 → Mục tiêu: Nền tảng 6.5+",
      rank: "Tương ứng Rank 7 — Học Bá",
      duration: "10 Tuần (30 Buổi học + Bài tập trên NextBand)",
      schedule: "03 buổi / tuần, 02 giờ / buổi",
      classSize: "Tối đa 08 học viên / lớp",
      description:
        "Khóa học nâng cao tinh chỉnh văn phong học thuật tự nhiên, kiểm soát độ chính xác ngữ nghĩa và hoàn thiện tư duy phản biện cấp cao cho các band điểm xuất sắc.",
      modules: [
        "Kiểm soát độ mạch lạc cấp cao (Advanced Cohesion & Coherence)",
        "Văn phong bản ngữ và linh hoạt từ vựng theo ngữ cảnh học thuật chuyên sâu",
        "Tư duy phản biện và lập luận đa chiều trong Speaking Part 3",
        "Chấm chữa 1:1 chi tiết từng bài viết dưới sự theo sát của giảng viên chuyên môn",
      ],
      outcomes: [
        "Làm chủ hoàn toàn kỹ năng viết luận học thuật và phản xạ nói tự nhiên",
        "Đạt chuẩn đầu ra 6.5+ để phục vụ du học, làm việc hoặc nghiên cứu quốc tế",
        "Sở hữu năng lực tư duy ngôn ngữ độc lập dùng suốt đời",
        "Tự tin bước vào kỳ thi IELTS chính thức",
      ],
    },
  };

  const course = courseCatalog[slug || "starter"] || courseCatalog.starter;

  return (
    <div className="flex flex-col">
      <SEO
        title={`${course.title} — Chi Tiết Khóa Học ARIS`}
        description={course.description}
      />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-28 border-b border-border/80 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6 text-left">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/courses")}
            className="gap-2 text-foreground/75 hover:text-foreground font-bold -ml-3 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại danh sách 5 khóa học</span>
          </Button>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-blue-soft text-brand-blue border border-brand-blue/20 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              <span>{course.target}</span>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted text-foreground border border-border text-xs sm:text-sm font-bold">
              <span>{course.rank}</span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.12]">
            {course.title}
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-foreground/85 font-normal leading-relaxed max-w-3xl">
            {course.description}
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/assessment")}
              className="rounded-2xl px-8 h-14 font-extrabold text-base sm:text-lg bg-brand-red hover:bg-brand-red-hover text-brand-red-foreground shadow-sm gap-2"
            >
              <span>Kiểm tra đầu vào cho khóa này</span>
              <ArrowRight className="h-5 w-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/contact")}
              className="rounded-2xl px-8 h-14 font-bold text-base sm:text-lg border-2 border-border/80 hover:bg-muted text-foreground"
            >
              Liên hệ tư vấn xếp lớp
            </Button>
          </div>
        </div>
      </section>

      {/* Course Modules & Learning Details Section */}
      <SectionContainer
        badge="Nội Dung Học Tập"
        title="Chương trình đào tạo &amp; Chuẩn đầu ra"
        description="Mỗi học phần được thiết kế để giải quyết dứt điểm các lỗi sai thường gặp và giúp bạn tự tin nâng cấp bậc năng lực."
        background="muted"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {/* Syllabus Modules */}
          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-5 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-brand-blue-soft text-brand-blue">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-black text-foreground text-xl">Học Phần Trọng Tâm</h3>
                <p className="text-xs sm:text-sm font-bold text-muted-foreground">Theo chuẩn The ARIS Way</p>
              </div>
            </div>

            <ul className="space-y-3.5 pt-2">
              {course.modules.map((mod, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-foreground/85 font-medium leading-relaxed">
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <span>{mod}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Learning Outcomes */}
          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-5 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-brand-blue-soft text-brand-blue">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-black text-foreground text-xl">Chuẩn Đầu Ra Đạt Được</h3>
                <p className="text-xs sm:text-sm font-bold text-muted-foreground">{course.rank}</p>
              </div>
            </div>

            <ul className="space-y-3.5 pt-2">
              {course.outcomes.map((outcome, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-foreground/85 font-medium leading-relaxed">
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SectionContainer>

      {/* Class Specifications */}
      <SectionContainer
        badge="Quy Chuẩn Lớp Học"
        title="Thời lượng &amp; Hình thức học tập"
        description="Đảm bảo sự tương tác tối đa giữa giảng viên và từng học viên trong lớp học."
        background="default"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
            <div className="p-2.5 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-black text-foreground text-lg">Sĩ Số Lớp Học</h3>
            <p className="text-base font-extrabold text-brand-blue">{course.classSize}</p>
            <p className="text-sm text-foreground/75 leading-relaxed">
              Giáo viên theo sát và sửa chữa chi tiết bài làm của từng bạn.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
            <div className="p-2.5 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="font-black text-foreground text-lg">Thời Lượng &amp; Lịch Học</h3>
            <p className="text-base font-extrabold text-brand-blue">{course.schedule}</p>
            <p className="text-sm text-foreground/75 leading-relaxed">
              Tổng thời lượng: {course.duration}.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
            <div className="p-2.5 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-black text-foreground text-lg">Hệ Thống NextBand</h3>
            <p className="text-base font-extrabold text-brand-blue">Lưu vết bài nộp &amp; sửa bài</p>
            <p className="text-sm text-foreground/75 leading-relaxed">
              Nhận phản hồi 1:1 và làm lại bài sửa trực tiếp trên nền tảng.
            </p>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}
