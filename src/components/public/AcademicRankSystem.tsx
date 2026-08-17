import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Award, ChevronRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

export interface AcademicRank {
  rankNumber: number;
  title: string;
  subtitle: string;
  bandPlaceholder: string;
  description: string;
  competencyPillars: string[];
}

export const ACADEMIC_RANKS: AcademicRank[] = [
  {
    rankNumber: 3,
    title: "Học Đồ",
    subtitle: "Academic Apprentice",
    bandPlaceholder: "Nền tảng học thuật sơ cấp",
    description: "Xây dựng nhận thức cấu trúc ngôn ngữ học thuật căn bản, nắm vững ngữ âm, từ vựng cốt lõi và tư duy phản xạ đầu vào.",
    competencyPillars: ["Cấu trúc câu cơ bản", "Từ vựng học thuật sơ cấp", "Phản xạ nghe hiểu ngữ cảnh", "Phát âm chuẩn IPA"],
  },
  {
    rankNumber: 4,
    title: "Học Giả",
    subtitle: "Academic Scholar",
    bandPlaceholder: "Phát triển năng lực cấu trúc",
    description: "Hình thành khả năng diễn giải ý niệm mạch lạc, xử lý các đoạn văn phức hợp và giao tiếp chức năng ổn định.",
    competencyPillars: ["Phân tích đoạn văn bản", "Diễn đạt ý niệm đa chiều", "Liên kết lập luận cơ bản", "Kiểm soát ngữ pháp bài viết"],
  },
  {
    rankNumber: 5,
    title: "Học Sĩ",
    subtitle: "Academic Specialist",
    bandPlaceholder: "Làm chủ phương pháp học thuật",
    description: "Thành thạo cấu trúc bài thi chuẩn hóa, tổng hợp thông tin đa nguồn và xây dựng lập luận có căn cứ rõ ràng.",
    competencyPillars: ["Kỹ năng Paraphrasing học thuật", "Tư duy phản biện sơ cấp", "Tổng hợp thông tin biểu đồ", "Giao tiếp lưu loát theo chủ đề"],
  },
  {
    rankNumber: 6,
    title: "Học Sư",
    subtitle: "Academic Master",
    bandPlaceholder: "Năng lực chuyên sâu & Vững vàng",
    description: "Làm chủ hoàn toàn các dạng đề nâng cao, tư duy phân tích sắc bén và khả năng xử lý bài thi dưới áp lực thời gian.",
    competencyPillars: ["Phân tích văn bản học thuật khó", "Lập luận chiều sâu Task 2", "Nghe hiểu tốc độ tự nhiên", "Xử lý câu hỏi trừu tượng Part 3"],
  },
  {
    rankNumber: 7,
    title: "Học Bá",
    subtitle: "Academic Elite",
    bandPlaceholder: "Đỉnh cao tư duy học thuật",
    description: "Sử dụng ngôn ngữ tự nhiên, linh hoạt và chuẩn xác ở mức độ cao. Kiểm soát hoàn hảo tính mạch lạc và vốn từ tinh tế.",
    competencyPillars: ["Từ vựng thành ngữ & Collocation chuẩn", "Bố cục logic chặt chẽ", "Phản xạ tự nhiên không độ trễ", "Xử lý sắc thái ngữ nghĩa tinh vi"],
  },
  {
    rankNumber: 8,
    title: "Học Tôn",
    subtitle: "Academic Grandmaster",
    bandPlaceholder: "Bậc thầy ngôn ngữ & Học thuật",
    description: "Đạt đến độ thuần thục gần như bản ngữ. Năng lực học thuật toàn diện, khả năng phân tích và truyền cảm hứng vượt trội.",
    competencyPillars: ["Đọc hiểu & Nghe hiểu tuyệt đối", "Văn phong học thuật chuẩn mực", "Kiểm soát độ chính xác tuyệt đối", "Tư duy học thuật xuất sắc"],
  },
  {
    rankNumber: 9,
    title: "Học Đế",
    subtitle: "Academic Sovereign",
    bandPlaceholder: "Cảnh giới tối cao của tri thức",
    description: "Cấp bậc học thuật tối thượng. Làm chủ tuyệt đối ngôn ngữ và tư duy, chuẩn mực mẫu mực cho toàn bộ hệ thống học thuật.",
    competencyPillars: ["Hoàn thiện toàn bộ 4 kỹ năng", "Tư duy ngôn ngữ học chuyên sâu", "Khả năng truyền thừa & Nghiên cứu", "Chuẩn mực học thuật cao nhất"],
  },
];

export const PROGRESSION_STAGES = [
  { id: "stage-1", label: "Sơ kỳ", code: "Phase I" },
  { id: "stage-2", label: "Trung kỳ", code: "Phase II" },
  { id: "stage-3", label: "Hậu kỳ", code: "Phase III" },
  { id: "stage-4", label: "Đỉnh phong", code: "Apex" },
];

interface AcademicRankSystemProps {
  initialRank?: number;
  interactive?: boolean;
  className?: string;
}

export function AcademicRankSystem({
  initialRank = 6,
  interactive = true,
  className,
}: AcademicRankSystemProps) {
  const [selectedRank, setSelectedRank] = useState<number>(initialRank);
  const activeRankData = ACADEMIC_RANKS.find((r) => r.rankNumber === selectedRank) || ACADEMIC_RANKS[3];

  return (
    <div className={cn("space-y-8", className)}>
      {/* 7-Rank Horizontal / Grid Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
        {ACADEMIC_RANKS.map((rank) => {
          const isSelected = rank.rankNumber === selectedRank;
          return (
            <button
              key={rank.rankNumber}
              type="button"
              disabled={!interactive}
              onClick={() => setSelectedRank(rank.rankNumber)}
              className={cn(
                "group relative p-3 sm:p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[96px]",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/20"
                  : "bg-card text-foreground border-border/70 hover:border-primary/40 hover:bg-muted/40"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={cn(
                    "text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-muted text-muted-foreground group-hover:bg-primary-soft group-hover:text-primary"
                  )}
                >
                  Rank {rank.rankNumber}
                </span>
                {isSelected && <Sparkles className="h-3.5 w-3.5 text-white/80 shrink-0" />}
              </div>

              <div className="mt-2 space-y-0.5">
                <div
                  className={cn(
                    "font-extrabold text-sm sm:text-base tracking-tight leading-tight",
                    isSelected ? "text-white" : "text-foreground"
                  )}
                >
                  {rank.title}
                </div>
                <div
                  className={cn(
                    "text-[11px] truncate font-medium",
                    isSelected ? "text-white/80" : "text-muted-foreground"
                  )}
                >
                  {rank.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed Active Rank Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 lg:p-10 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Rank Identity & 4 Stages */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft text-primary border border-primary/20 text-xs font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Hệ Thống Phân Cấp Học Thuật ARIS</span>
              </div>

              <div className="flex items-baseline gap-3 pt-1">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  Rank {activeRankData.rankNumber} — {activeRankData.title}
                </h3>
                <span className="text-sm font-semibold text-primary">
                  {activeRankData.subtitle}
                </span>
              </div>

              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                {activeRankData.bandPlaceholder}
              </p>
            </div>

            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
              {activeRankData.description}
            </p>

            {/* 4 Progression Stages Visualizer */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>4 Giai Đoạn Tiến Trình Học Thuật</span>
                <span className="font-mono text-[11px] font-normal">Sơ kỳ → Đỉnh phong</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {PROGRESSION_STAGES.map((stage, idx) => (
                  <div
                    key={stage.id}
                    className="p-3 rounded-xl border border-border/70 bg-muted/30 text-center space-y-1"
                  >
                    <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                      {stage.code}
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-foreground">
                      {stage.label}
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-1.5">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(idx + 1) * 25}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Key Competency Pillars */}
          <div className="lg:col-span-5 rounded-xl border border-border/60 bg-muted/20 p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
              <Award className="h-4 w-4 text-primary" />
              <span>Tiêu Chuẩn Năng Lực Học Thuật</span>
            </div>

            <div className="space-y-2.5">
              {activeRankData.competencyPillars.map((pillar, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-card border border-border/50 text-xs sm:text-sm text-foreground"
                >
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span className="leading-snug">{pillar}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 text-[11px] text-muted-foreground leading-relaxed border-t border-border/40">
              Mỗi cấp bậc đại diện cho một mốc tiến bộ đo lường được trong hệ thống khảo thí và lộ trình học tập NextBand.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
