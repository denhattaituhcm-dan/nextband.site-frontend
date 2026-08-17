import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Award, ChevronRight, CheckCircle2, ShieldCheck, Sparkles, Star, Shield } from "lucide-react";

export interface AcademicRank {
  rankNumber: number;
  title: string;
  subtitle: string;
  bandPlaceholder: string;
  description: string;
  competencyPillars: string[];
  theme: {
    name: string;
    activeBg: string;
    activeBorder: string;
    activeGlow: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    inactiveBorder: string;
    inactiveHoverBg: string;
    accentColor: string;
    iconColor: string;
    progressBar: string;
  };
}

export const ACADEMIC_RANKS: AcademicRank[] = [
  {
    rankNumber: 3,
    title: "Học Đồ",
    subtitle: "Academic Apprentice",
    bandPlaceholder: "Nền tảng học thuật sơ cấp (IELTS 3.0 – 4.0)",
    description: "Xây dựng nhận thức cấu trúc ngôn ngữ học thuật căn bản, nắm vững ngữ âm, từ vựng cốt lõi và tư duy phản xạ đầu vào.",
    competencyPillars: ["Cấu trúc câu cơ bản", "Từ vựng học thuật sơ cấp", "Phản xạ nghe hiểu ngữ cảnh", "Phát âm chuẩn IPA"],
    theme: {
      name: "Teal Emerald",
      activeBg: "bg-gradient-to-br from-[#0e5a60] to-[#083a3e] text-white",
      activeBorder: "border-[#0e8388]",
      activeGlow: "ring-2 ring-[#0e8388]/30 shadow-lg shadow-[#0e8388]/20",
      badgeBg: "bg-[#0e8388]/15",
      badgeText: "text-[#0e8388] dark:text-[#2dd4bf]",
      badgeBorder: "border-[#0e8388]/30",
      inactiveBorder: "border-[#0e8388]/25 hover:border-[#0e8388]/60",
      inactiveHoverBg: "hover:bg-[#0e8388]/5",
      accentColor: "text-[#0e8388]",
      iconColor: "#0e8388",
      progressBar: "bg-[#0e8388]",
    },
  },
  {
    rankNumber: 4,
    title: "Học Giả",
    subtitle: "Academic Scholar",
    bandPlaceholder: "Phát triển năng lực cấu trúc (IELTS 4.0 – 5.0)",
    description: "Hình thành khả năng diễn giải ý niệm mạch lạc, xử lý các đoạn văn phức hợp và giao tiếp chức năng ổn định.",
    competencyPillars: ["Phân tích đoạn văn bản", "Diễn đạt ý niệm đa chiều", "Liên kết lập luận cơ bản", "Kiểm soát ngữ pháp bài viết"],
    theme: {
      name: "Copper Bronze",
      activeBg: "bg-gradient-to-br from-[#8c4314] to-[#592606] text-white",
      activeBorder: "border-[#b85d19]",
      activeGlow: "ring-2 ring-[#b85d19]/30 shadow-lg shadow-[#b85d19]/20",
      badgeBg: "bg-[#b85d19]/15",
      badgeText: "text-[#b85d19] dark:text-[#fb923c]",
      badgeBorder: "border-[#b85d19]/30",
      inactiveBorder: "border-[#b85d19]/25 hover:border-[#b85d19]/60",
      inactiveHoverBg: "hover:bg-[#b85d19]/5",
      accentColor: "text-[#b85d19]",
      iconColor: "#b85d19",
      progressBar: "bg-[#b85d19]",
    },
  },
  {
    rankNumber: 5,
    title: "Học Sĩ",
    subtitle: "Academic Specialist",
    bandPlaceholder: "Làm chủ phương pháp học thuật (IELTS 5.0 – 6.0)",
    description: "Thành thạo cấu trúc bài thi chuẩn hóa, tổng hợp thông tin đa nguồn và xây dựng lập luận có căn cứ rõ ràng.",
    competencyPillars: ["Kỹ năng Paraphrasing học thuật", "Tư duy phản biện sơ cấp", "Tổng hợp thông tin biểu đồ", "Giao tiếp lưu loát theo chủ đề"],
    theme: {
      name: "Steel Slate",
      activeBg: "bg-gradient-to-br from-[#334155] to-[#1e293b] text-white",
      activeBorder: "border-[#64748b]",
      activeGlow: "ring-2 ring-[#64748b]/30 shadow-lg shadow-[#64748b]/20",
      badgeBg: "bg-[#64748b]/15",
      badgeText: "text-[#475569] dark:text-[#cbd5e1]",
      badgeBorder: "border-[#64748b]/30",
      inactiveBorder: "border-[#64748b]/25 hover:border-[#64748b]/60",
      inactiveHoverBg: "hover:bg-[#64748b]/5",
      accentColor: "text-[#475569]",
      iconColor: "#64748b",
      progressBar: "bg-[#64748b]",
    },
  },
  {
    rankNumber: 6,
    title: "Học Sư",
    subtitle: "Academic Master",
    bandPlaceholder: "Năng lực chuyên sâu & Vững vàng (IELTS 6.0 – 7.0)",
    description: "Làm chủ hoàn toàn các dạng đề nâng cao, tư duy phân tích sắc bén và khả năng xử lý bài thi dưới áp lực thời gian.",
    competencyPillars: ["Phân tích văn bản học thuật khó", "Lập luận chiều sâu Task 2", "Nghe hiểu tốc độ tự nhiên", "Xử lý câu hỏi trừu tượng Part 3"],
    theme: {
      name: "Gold Amber",
      activeBg: "bg-gradient-to-br from-[#92400e] to-[#632a04] text-white",
      activeBorder: "border-[#d97706]",
      activeGlow: "ring-2 ring-[#d97706]/30 shadow-lg shadow-[#d97706]/20",
      badgeBg: "bg-[#d97706]/15",
      badgeText: "text-[#b45309] dark:text-[#fcd34d]",
      badgeBorder: "border-[#d97706]/30",
      inactiveBorder: "border-[#d97706]/25 hover:border-[#d97706]/60",
      inactiveHoverBg: "hover:bg-[#d97706]/5",
      accentColor: "text-[#b45309]",
      iconColor: "#d97706",
      progressBar: "bg-[#d97706]",
    },
  },
  {
    rankNumber: 7,
    title: "Học Bá",
    subtitle: "Academic Elite",
    bandPlaceholder: "Đỉnh cao tư duy học thuật (IELTS 7.0 – 8.0)",
    description: "Sử dụng ngôn ngữ tự nhiên, linh hoạt và chuẩn xác ở mức độ cao. Kiểm soát hoàn hảo tính mạch lạc và vốn từ tinh tế.",
    competencyPillars: ["Từ vựng thành ngữ & Collocation chuẩn", "Bố cục logic chặt chẽ", "Phản xạ tự nhiên không độ trễ", "Xử lý sắc thái ngữ nghĩa tinh vi"],
    theme: {
      name: "Crimson Ruby",
      activeBg: "bg-gradient-to-br from-[#991b1b] to-[#680e0e] text-white",
      activeBorder: "border-[#dc2626]",
      activeGlow: "ring-2 ring-[#dc2626]/30 shadow-lg shadow-[#dc2626]/20",
      badgeBg: "bg-[#dc2626]/15",
      badgeText: "text-[#dc2626] dark:text-[#f87171]",
      badgeBorder: "border-[#dc2626]/30",
      inactiveBorder: "border-[#dc2626]/25 hover:border-[#dc2626]/60",
      inactiveHoverBg: "hover:bg-[#dc2626]/5",
      accentColor: "text-[#dc2626]",
      iconColor: "#dc2626",
      progressBar: "bg-[#dc2626]",
    },
  },
  {
    rankNumber: 8,
    title: "Học Tôn",
    subtitle: "Academic Grandmaster",
    bandPlaceholder: "Bậc thầy ngôn ngữ & Học thuật (IELTS 8.0 – 8.5)",
    description: "Đạt đến độ thuần thục gần như bản ngữ. Năng lực học thuật toàn diện, khả năng phân tích và truyền cảm hứng vượt trội.",
    competencyPillars: ["Đọc hiểu & Nghe hiểu tuyệt đối", "Văn phong học thuật chuẩn mực", "Kiểm soát độ chính xác tuyệt đối", "Tư duy học thuật xuất sắc"],
    theme: {
      name: "Royal Sapphire",
      activeBg: "bg-gradient-to-br from-[#1e40af] to-[#11256c] text-white",
      activeBorder: "border-[#2563eb]",
      activeGlow: "ring-2 ring-[#2563eb]/30 shadow-lg shadow-[#2563eb]/20",
      badgeBg: "bg-[#2563eb]/15",
      badgeText: "text-[#2563eb] dark:text-[#60a5fa]",
      badgeBorder: "border-[#2563eb]/30",
      inactiveBorder: "border-[#2563eb]/25 hover:border-[#2563eb]/60",
      inactiveHoverBg: "hover:bg-[#2563eb]/5",
      accentColor: "text-[#2563eb]",
      iconColor: "#2563eb",
      progressBar: "bg-[#2563eb]",
    },
  },
  {
    rankNumber: 9,
    title: "Học Đế",
    subtitle: "Academic Sovereign",
    bandPlaceholder: "Cảnh giới tối cao của tri thức (IELTS 8.5 – 9.0)",
    description: "Cấp bậc học thuật tối thượng. Làm chủ tuyệt đối ngôn ngữ và tư duy, chuẩn mực mẫu mực cho toàn bộ hệ thống học thuật.",
    competencyPillars: ["Hoàn thiện toàn bộ 4 kỹ năng", "Tư duy ngôn ngữ học chuyên sâu", "Khả năng truyền thừa & Nghiên cứu", "Chuẩn mực học thuật cao nhất"],
    theme: {
      name: "Cosmic Indigo",
      activeBg: "bg-gradient-to-br from-[#3730a3] to-[#1e1b4b] text-white",
      activeBorder: "border-[#4f46e5]",
      activeGlow: "ring-2 ring-[#4f46e5]/30 shadow-lg shadow-[#4f46e5]/20",
      badgeBg: "bg-[#4f46e5]/15",
      badgeText: "text-[#4f46e5] dark:text-[#a5b4fc]",
      badgeBorder: "border-[#4f46e5]/30",
      inactiveBorder: "border-[#4f46e5]/25 hover:border-[#4f46e5]/60",
      inactiveHoverBg: "hover:bg-[#4f46e5]/5",
      accentColor: "text-[#4f46e5]",
      iconColor: "#4f46e5",
      progressBar: "bg-[#4f46e5]",
    },
  },
];

export const PROGRESSION_STAGES = [
  { id: "stage-1", stars: "1★", label: "Sơ kỳ", code: "Phase I" },
  { id: "stage-2", stars: "2★", label: "Trung kỳ", code: "Phase II" },
  { id: "stage-3", stars: "3★", label: "Hậu kỳ", code: "Phase III" },
  { id: "stage-4", stars: "4★", label: "Đỉnh phong", code: "Apex" },
];

interface AcademicRankSystemProps {
  initialRank?: number;
  interactive?: boolean;
  className?: string;
}

export function AcademicRankSystem({
  initialRank = 5,
  interactive = true,
  className,
}: AcademicRankSystemProps) {
  const [selectedRank, setSelectedRank] = useState<number>(initialRank);
  const activeRankData = ACADEMIC_RANKS.find((r) => r.rankNumber === selectedRank) || ACADEMIC_RANKS[2];

  return (
    <div className={cn("space-y-8", className)}>
      {/* 7-Rank Color-Synchronized Navigation Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3.5">
        {ACADEMIC_RANKS.map((rank) => {
          const isSelected = rank.rankNumber === selectedRank;
          return (
            <button
              key={rank.rankNumber}
              type="button"
              disabled={!interactive}
              onClick={() => setSelectedRank(rank.rankNumber)}
              className={cn(
                "group relative p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[104px]",
                isSelected
                  ? cn(rank.theme.activeBg, rank.theme.activeBorder, rank.theme.activeGlow)
                  : cn(
                      "bg-card text-foreground border-2",
                      rank.theme.inactiveBorder,
                      rank.theme.inactiveHoverBg
                    )
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={cn(
                    "text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border",
                    isSelected
                      ? "bg-white/20 text-white border-white/30"
                      : cn(rank.theme.badgeBg, rank.theme.badgeText, rank.theme.badgeBorder)
                  )}
                >
                  Rank {rank.rankNumber}
                </span>
                {isSelected ? (
                  <Sparkles className="h-4 w-4 text-white/90 shrink-0 animate-pulse" />
                ) : (
                  <div
                    className="w-2 h-2 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: rank.theme.iconColor }}
                  />
                )}
              </div>

              <div className="mt-2 space-y-0.5">
                <div
                  className={cn(
                    "font-black text-base sm:text-lg tracking-tight leading-tight",
                    isSelected ? "text-white" : "text-foreground"
                  )}
                >
                  {rank.title}
                </div>
                <div
                  className={cn(
                    "text-[11px] truncate font-medium",
                    isSelected ? "text-white/85" : "text-muted-foreground"
                  )}
                >
                  {rank.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed Active Rank Card (Color-Themed) */}
      <div
        className={cn(
          "rounded-3xl border-2 bg-card p-6 sm:p-8 lg:p-10 shadow-sm transition-all text-left",
          activeRankData.theme.inactiveBorder
        )}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Rank Identity & 4 Stages */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <div
                className={cn(
                  "inline-flex items-center gap-2 px-3.5 py-1 rounded-full border text-xs font-black uppercase tracking-wider",
                  activeRankData.theme.badgeBg,
                  activeRankData.theme.badgeText,
                  activeRankData.theme.badgeBorder
                )}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Hệ Thống Phân Cấp Năng Lực ARIS-7</span>
              </div>

              <div className="flex flex-wrap items-baseline gap-3 pt-1">
                <h3 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                  Rank {activeRankData.rankNumber} — {activeRankData.title}
                </h3>
                <span
                  className={cn("text-base font-bold", activeRankData.theme.accentColor)}
                >
                  {activeRankData.subtitle}
                </span>
              </div>

              <p className="text-sm font-bold text-muted-foreground">
                {activeRankData.bandPlaceholder}
              </p>
            </div>

            <p className="text-base text-foreground/85 leading-relaxed font-normal">
              {activeRankData.description}
            </p>

            {/* 4 Progression Stages Visualizer (Sơ kỳ -> Đỉnh phong với số sao ★) */}
            <div className="space-y-3 pt-3 border-t border-border/60">
              <div className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>4 Giai Đoạn Tiến Trình</span>
                <span className="font-mono text-xs text-foreground/75">
                  1★ Sơ kỳ → 4★ Đỉnh phong
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PROGRESSION_STAGES.map((stage, idx) => (
                  <div
                    key={stage.id}
                    className="p-3.5 rounded-2xl border border-border/80 bg-muted/30 text-center space-y-1.5 hover:border-border transition-all"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs font-mono font-black px-2 py-0.5 rounded-md bg-background border border-border text-foreground">
                        {stage.stars}
                      </span>
                    </div>
                    <div className="font-black text-sm text-foreground">
                      {stage.label}
                    </div>
                    <div className="text-[10px] font-mono uppercase text-muted-foreground">
                      {stage.code}
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-1">
                      <div
                        className={cn("h-full rounded-full transition-all", activeRankData.theme.progressBar)}
                        style={{ width: `${(idx + 1) * 25}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Key Competency Pillars */}
          <div className="lg:col-span-5 rounded-2xl border border-border/80 bg-muted/20 p-6 space-y-5">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-foreground">
              <Award className="h-4 w-4 text-brand-red" />
              <span>Tiêu Chuẩn Năng Lực Cốt Lõi</span>
            </div>

            <div className="space-y-3">
              {activeRankData.competencyPillars.map((pillar, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/60 text-sm font-medium text-foreground shadow-2xs"
                >
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span className="leading-snug">{pillar}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 text-xs text-muted-foreground leading-relaxed border-t border-border/60">
              Mỗi cấp bậc đại diện cho một mốc tiến bộ năng lực được đo lường chính xác và lưu vết qua hệ thống NextBand.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
