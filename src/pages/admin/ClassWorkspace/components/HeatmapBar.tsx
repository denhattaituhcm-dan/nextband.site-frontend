import React from "react";
import { Progress } from "@/components/ui/progress";

interface HeatmapBarProps {
  percent: number;
  showBadge?: boolean;
}

export const HeatmapBar: React.FC<HeatmapBarProps> = ({ percent, showBadge = true }) => {
  const getProgressColorClass = (val: number) => {
    if (val >= 90) return "[&>div]:bg-emerald-500";
    if (val >= 70) return "[&>div]:bg-amber-400";
    if (val >= 40) return "[&>div]:bg-orange-500";
    return "[&>div]:bg-rose-500";
  };

  const getBadgeColorClass = (val: number) => {
    if (val >= 90) return "text-emerald-700 dark:text-emerald-300";
    if (val >= 70) return "text-amber-700 dark:text-amber-300";
    if (val >= 40) return "text-orange-700 dark:text-orange-300";
    return "text-rose-700 dark:text-rose-300";
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <Progress
        value={percent}
        className={`h-1.5 flex-1 ${getProgressColorClass(percent)}`}
      />
      {showBadge && (
        <span className={`font-mono text-[10px] font-bold w-8 text-right ${getBadgeColorClass(percent)}`}>
          {percent}%
        </span>
      )}
    </div>
  );
};
