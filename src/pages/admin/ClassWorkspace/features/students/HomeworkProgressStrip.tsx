import React from "react";

export type HomeworkStatus = "done" | "late" | "missed" | "pending";

interface HomeworkProgressStripProps {
  totalHomeworks?: number;
  completedCount?: number;
  onSelectHomework?: (hwNumber: number) => void;
}

export const HomeworkProgressStrip: React.FC<HomeworkProgressStripProps> = ({
  totalHomeworks = 27,
  completedCount = 12,
  onSelectHomework,
}) => {
  const items = Array.from({ length: totalHomeworks }, (_, i) => {
    const hwNumber = i + 1;
    let status: HomeworkStatus = "pending";
    if (hwNumber <= completedCount) {
      status = hwNumber === 3 ? "late" : "done";
    } else if (hwNumber === completedCount + 1) {
      status = "missed";
    }

    return { hwNumber, status };
  });

  const getStatusSymbol = (status: HomeworkStatus) => {
    switch (status) {
      case "done":
        return { icon: "✓", bg: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300" };
      case "late":
        return { icon: "⏰", bg: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300" };
      case "missed":
        return { icon: "❌", bg: "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300" };
      default:
        return { icon: "○", bg: "bg-muted text-muted-foreground border-slate-200" };
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>Tiến độ 27 Homework (Click ô để xem bài)</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="text-emerald-600 font-bold">✓</span> Đã làm</span>
          <span className="flex items-center gap-1">⏰ Trễ</span>
          <span className="flex items-center gap-1">❌ Bỏ bài</span>
          <span className="flex items-center gap-1">○ Chưa học</span>
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 p-3 rounded-lg border bg-muted/20">
        {items.map(({ hwNumber, status }) => {
          const { icon, bg } = getStatusSymbol(status);
          return (
            <button
              key={hwNumber}
              onClick={() => onSelectHomework?.(hwNumber)}
              title={`Homework ${hwNumber}`}
              className={`h-7 w-7 rounded border text-xs font-semibold flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${bg}`}
            >
              {icon}
            </button>
          );
        })}
      </div>
    </div>
  );
};
