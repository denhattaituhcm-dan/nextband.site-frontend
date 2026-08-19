import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SectionContainer } from "@/components/public/SectionContainer";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/common/SEO";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  CheckCircle2,
  Send,
  Clock,
  ShieldCheck,
  Award,
} from "lucide-react";

export default function JobDetailPage() {
  const { jobSlug } = useParams<{ jobSlug: string }>();
  const navigate = useNavigate();

  const jobCatalog: Record<
    string,
    {
      title: string;
      department: string;
      location: string;
      type: string;
      description: string;
      responsibilities: string[];
      requirements: string[];
      benefits: string[];
    }
  > = {
    "ielts-teacher": {
      title: "Giảng Viên IELTS Writing & Speaking",
      department: "Ban Chuyên Môn ARIS",
      location: "68B Phan Bội Châu, P. Dĩ An, TP. Dĩ An, Tỉnh Bình Dương",
      type: "Toàn thời gian / Bán thời gian",
      description:
        "Trực tiếp giảng dạy và chấm chữa bài viết, bài nói cho học viên theo phương pháp The ARIS Way; chịu trách nhiệm theo sát sự tiến bộ và việc làm lại bài sửa của từng học viên.",
      responsibilities: [
        "Đứng lớp giảng dạy các khóa học theo khung 7 cấp bậc ARIS-7 (sĩ số tối đa 08 học viên/lớp)",
        "Chấm chữa chi tiết từng câu cho bài nộp Writing và Speaking của học viên trên NextBand",
        "Theo dõi và đôn đốc học viên hoàn thành bài sửa (Re-attempt) sau mỗi buổi học",
        "Tham gia các buổi sinh hoạt chuyên môn và nghiên cứu phương pháp giảng dạy cùng Academic Lead",
      ],
      requirements: [
        "Chứng chỉ IELTS có điểm thành phần Writing & Speaking xuất sắc",
        "Tư duy ngôn ngữ học thuật sắc bén, phát âm chuẩn xác, không nói ngọng",
        "Khả năng sư phạm tốt, kiên nhẫn, có tinh thần trách nhiệm cao với từng học viên",
        "Ưu tiên ứng viên có chứng chỉ giảng dạy quốc tế (TESOL/CELTA) hoặc bằng cử nhân Ngôn ngữ Anh",
      ],
      benefits: [
        "Mức thu nhập và chế độ thù lao giảng dạy cạnh tranh theo năng lực",
        "Môi trường học thuật thực chất, không bị ép chỉ tiêu doanh số",
        "Được đào tạo bài bản về phương pháp The ARIS Way và ứng dụng công nghệ NextBand",
        "Cơ hội phát triển lên các vị trí Trưởng nhóm chuyên môn hoặc Quản lý học thuật",
      ],
    },
    "academic-coordinator": {
      title: "Chuyên Viên Điều Phối Học Thuật",
      department: "Phòng Vận Hành & Khảo Thí",
      location: "68B Phan Bội Châu, P. Dĩ An, TP. Dĩ An, Tỉnh Bình Dương",
      type: "Toàn thời gian",
      description:
        "Phụ trách điều phối lịch học, theo dõi tiến độ học tập của học viên trên hệ thống NextBand và phối hợp cùng ban chuyên môn để đảm bảo chất lượng vận hành các lớp học.",
      responsibilities: [
        "Quản lý lịch học, điểm danh và tiến độ nộp bài của học viên trên nền tảng NextBand",
        "Hỗ trợ tổ chức các kỳ thi thử Cambridge định kỳ và tổng hợp báo cáo kết quả",
        "Lắng nghe phản hồi từ học viên và phụ huynh, kết nối kịp thời với giảng viên đứng lớp",
        "Hỗ trợ các công tác hành chính và điều phối lớp học tại trung tâm",
      ],
      requirements: [
        "Tốt nghiệp Cao đẳng/Đại học, có khả năng giao tiếp tiếng Anh cơ bản",
        "Kỹ năng tin học văn phòng tốt, tỉ mỉ, cẩn thận và có tinh thần trách nhiệm cao",
        "Kỹ năng giao tiếp và xử lý tình huống khéo léo, thái độ thân thiện",
        "Ưu tiên ứng viên có kinh nghiệm làm việc tại các cơ sở giáo dục hoặc trung tâm ngoại ngữ",
      ],
      benefits: [
        "Lương cứng ổn định + thưởng hiệu quả công việc hàng tháng",
        "Đầy đủ chế độ BHXH, BHYT và các quyền lợi theo Luật Lao động",
        "Được đào tạo sử dụng các hệ thống quản lý học tập số hiện đại",
        "Môi trường làm việc trẻ trung, năng động và tôn trọng cá nhân",
      ],
    },
    "k12-english-teacher": {
      title: "Giáo Viên Tiếng Anh THCS & THPT",
      department: "Ban Đào Tạo Học Thuật Phổ Thông",
      location: "68B Phan Bội Châu, P. Dĩ An, TP. Dĩ An, Tỉnh Bình Dương",
      type: "Toàn thời gian / Bán thời gian (Linh hoạt theo ca)",
      description:
        "Giảng dạy và củng cố ngữ pháp, từ vựng và 4 kỹ năng tiếng Anh cho học sinh bậc THCS và THPT; theo sát tiến bộ học tập, luyện thi chuyển cấp và xây dựng nền tảng học thuật vững chắc.",
      responsibilities: [
        "Đứng lớp giảng dạy các lớp bổ trợ và tăng cường tiếng Anh THCS & THPT (sĩ số tối đa 8–10 học sinh/lớp)",
        "Kiểm tra, chữa bài tập chi tiết và giải thích cặn kẽ bản chất ngữ pháp cho từng học sinh",
        "Đánh giá định kỳ, theo dõi sự tiến bộ và duy trì báo cáo học tập trao đổi cùng phụ huynh",
        "Phối hợp cùng Ban Chuyên Môn để chuẩn hóa giáo trình bám sát đề thi tuyển sinh 10 và tốt nghiệp THPT",
      ],
      requirements: [
        "Tốt nghiệp Đại học chuyên ngành Ngôn ngữ Anh hoặc Sư phạm Tiếng Anh loại Khá trở lên",
        "Chứng chỉ IELTS tối thiểu 7.0+ (hoặc chứng chỉ năng lực quốc tế tương đương)",
        "Phát âm chuẩn xác, nắm vững bản chất ngữ pháp tiếng Anh phổ thông và học thuật",
        "Tận tâm, có tinh thần trách nhiệm cao, kiên nhẫn và yêu thương học sinh",
      ],
      benefits: [
        "Thù lao giảng dạy hấp dẫn theo sĩ số lớp (tối đa 10 học sinh/lớp)",
        "Thưởng KPI đánh giá chất lượng giảng dạy, tỷ lệ học sinh tiến bộ và duy trì lớp",
        "Thưởng gắn bó lâu dài theo các mốc 6 tháng, 12 tháng, 18 tháng, 24 tháng",
        "Được bồi dưỡng phương pháp The ARIS Way và ưu tiên lộ trình phát triển lên Giảng viên IELTS Full-time",
      ],
    },
    "teaching-assistant": {
      title: "Trợ Giảng Học Thuật (Teaching Assistant)",
      department: "Ban Hỗ Trợ Học Tập",
      location: "68B Phan Bội Châu, P. Dĩ An, TP. Dĩ An, Tỉnh Bình Dương",
      type: "Bán thời gian (Linh hoạt theo ca)",
      description:
        "Đồng hành hỗ trợ học viên luyện tập phát âm IPA, giải đáp thắc mắc bài tập cơ bản và hỗ trợ giảng viên trong các buổi học trực tiếp và thi thử.",
      responsibilities: [
        "Hỗ trợ học viên luyện tập phát âm IPA và từ vựng trong các giờ tự học",
        "Giải đáp các thắc mắc về ngữ pháp cơ bản cho học viên khóa Starter và Dreamer",
        "Hỗ trợ giảng viên kiểm tra việc chuẩn bị bài và ghi nhận tình hình học tập trên lớp",
        "Tham gia coi thi và chấm điểm các bài thi thử trắc nghiệm Listening & Reading",
      ],
      requirements: [
        "Sinh viên năm 2 trở lên các trường Đại học chuyên ngành Ngôn ngữ Anh hoặc tương đương",
        "Có chứng chỉ IELTS hoặc năng lực tiếng Anh vững vàng (ngữ pháp và phát âm tốt)",
        "Nhiệt tình, có tinh thần trách nhiệm và yêu thích công việc giảng dạy",
        "Linh hoạt sắp xếp thời gian làm việc theo ca học buổi tối hoặc cuối tuần",
      ],
      benefits: [
        "Thù lao trợ giảng hấp dẫn theo giờ làm việc",
        "Được học hỏi kinh nghiệm giảng dạy thực tế từ các giảng viên chuyên môn",
        "Cơ hội được bồi dưỡng và cất nhắc lên vị trí Giảng viên chính thức",
        "Được cấp giấy chứng nhận kinh nghiệm làm việc sau thời gian gắn bó",
      ],
    },
  };

  const job = jobCatalog[jobSlug || "ielts-teacher"] || jobCatalog["ielts-teacher"];

  return (
    <div className="flex flex-col">
      <SEO
        title={`${job.title} — Tuyển Dụng Học Viện ARIS`}
        description={job.description}
      />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-28 border-b border-border/80 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6 text-left">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/careers")}
            className="gap-2 text-foreground/75 hover:text-foreground font-bold -ml-3 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại danh sách vị trí</span>
          </Button>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-brand-blue-soft text-brand-blue border border-brand-blue/20">
              {job.department}
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-muted text-foreground">
              {job.type}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.12]">
            {job.title}
          </h1>

          <div className="flex items-center gap-2 text-sm sm:text-base text-foreground/80 font-bold">
            <MapPin className="h-4 w-4 text-brand-red shrink-0" />
            <span>{job.location}</span>
          </div>

          <p className="text-lg sm:text-xl text-foreground/85 font-normal leading-relaxed">
            {job.description}
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/contact")}
              className="rounded-2xl px-8 h-14 font-extrabold text-base sm:text-lg bg-brand-red hover:bg-brand-red-hover text-white shadow-sm gap-2"
            >
              <Send className="h-4 w-4" />
              <span>Nộp hồ sơ ứng tuyển</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Details Section */}
      <SectionContainer
        badge="Chi Tiết Tuyển Dụng"
        title="Mô tả công việc &amp; Yêu cầu ứng viên"
        description="Thông tin chi tiết về trách nhiệm, yêu cầu năng lực và các quyền lợi đi kèm."
        background="muted"
      >
        <div className="max-w-4xl mx-auto space-y-8 text-left">
          {/* Responsibilities */}
          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-4 shadow-2xs">
            <h3 className="text-xl font-black text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-brand-blue" />
              <span>Trách Nhiệm Chính</span>
            </h3>
            <ul className="space-y-3 pt-2">
              {job.responsibilities.map((resp, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-foreground/85 font-medium leading-relaxed">
                  <span className="text-brand-blue font-bold">•</span>
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Requirements */}
          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-4 shadow-2xs">
            <h3 className="text-xl font-black text-foreground flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand-blue" />
              <span>Yêu Cầu Ứng Viên</span>
            </h3>
            <ul className="space-y-3 pt-2">
              {job.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-foreground/85 font-medium leading-relaxed">
                  <span className="text-brand-blue font-bold">•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Benefits */}
          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-4 shadow-2xs">
            <h3 className="text-xl font-black text-foreground flex items-center gap-2">
              <Award className="h-5 w-5 text-success" />
              <span>Quyền Lợi &amp; Đãi Ngộ</span>
            </h3>
            <ul className="space-y-3 pt-2">
              {job.benefits.map((ben, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-foreground/85 font-medium leading-relaxed">
                  <span className="text-success font-bold">✓</span>
                  <span>{ben}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Box */}
          <div className="p-8 sm:p-10 rounded-3xl bg-brand-blue text-white text-center space-y-5">
            <h3 className="text-2xl sm:text-3xl font-black">
              Sẵn sàng thử thách năng lực tại vị trí này?
            </h3>
            <p className="text-sm sm:text-base text-white/90 max-w-xl mx-auto leading-relaxed">
              Gửi hồ sơ gồm <strong>CV chi tiết</strong> và <strong>Bản scan Bảng điểm IELTS</strong> trực tiếp về hòm thư học thuật của chúng tôi.
            </p>
            <div className="p-4 rounded-2xl bg-white/10 border border-white/20 max-w-md mx-auto text-xs sm:text-sm text-left space-y-1.5">
              <div>
                <span className="text-brand-cyan font-bold">Email: </span>
                <span className="font-mono text-white">arisieltsdeeplearning@gmail.com</span>
              </div>
              <div>
                <span className="text-brand-cyan font-bold">Tiêu đề: </span>
                <span className="font-mono text-white">[Ứng tuyển {job.title}] - Họ và tên</span>
              </div>
            </div>
            <div className="pt-2">
              <Button
                size="lg"
                onClick={() => {
                  window.location.href = `mailto:arisieltsdeeplearning@gmail.com?subject=[Ứng tuyển ${job.title}] - Họ và tên`;
                }}
                className="rounded-2xl px-8 h-14 font-extrabold text-base bg-brand-red text-white hover:bg-brand-red-hover shadow-md border-0 gap-2"
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
