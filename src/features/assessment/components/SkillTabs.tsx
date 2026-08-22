import React from "react";
import { Headphones, BookOpen, PenTool, Mic, Sparkles } from "lucide-react";
import { AssessmentSkill } from "../domain/assessment.types";
import { cn } from "@/lib/utils";

interface SkillTabsProps {
  activeSkill: AssessmentSkill;
  onSelectSkill: (skill: AssessmentSkill) => void;
  skillCounts: Record<AssessmentSkill, { answered: number; total: number }>;
}

export function SkillTabs({ activeSkill, onSelectSkill, skillCounts }: SkillTabsProps) {
  const tabs: Array<{ id: AssessmentSkill; baseLabel: string; icon: any }> = [
    { id: "listening", baseLabel: "Listening", icon: Headphones },
    { id: "reading", baseLabel: "Reading", icon: BookOpen },
    { id: "grammar", baseLabel: "Grammar", icon: Sparkles },
    { id: "writing", baseLabel: "Writing", icon: PenTool },
    { id: "speaking", baseLabel: "Speaking", icon: Mic },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1.5 bg-muted/60 rounded-2xl border border-border overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeSkill === tab.id;
        const stat = skillCounts[tab.id];
        const isComplete = stat && stat.total > 0 && stat.answered >= stat.total;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectSkill(tab.id)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer",
              isActive
                ? "bg-card text-brand-blue shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80",
            )}
          >
            <Icon className={cn("w-4 h-4", isActive ? "text-brand-blue" : "text-muted-foreground")} />
            <span>{tab.baseLabel}{stat && stat.total > 0 ? ` (${stat.total})` : ""}</span>
            {stat && stat.total > 0 && (
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ml-0.5",
                  isComplete
                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {stat.answered}/{stat.total}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
