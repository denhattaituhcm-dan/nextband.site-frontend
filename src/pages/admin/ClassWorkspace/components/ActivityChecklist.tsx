import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Headphones,
  BookOpen,
  FileText,
  Mic,
  HelpCircle,
  CheckCircle2,
  CheckSquare,
} from "lucide-react";

export interface ActivitySkill {
  type: string;
  name: string;
  detail: string;
}

interface ActivityChecklistProps {
  skills: ActivitySkill[];
}

export const ActivityChecklist: React.FC<ActivityChecklistProps> = ({ skills }) => {
  const getSkillIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "listening":
        return <Headphones className="h-4 w-4 text-blue-600" />;
      case "reading":
        return <BookOpen className="h-4 w-4 text-emerald-600" />;
      case "writing":
        return <FileText className="h-4 w-4 text-purple-600" />;
      case "speaking":
        return <Mic className="h-4 w-4 text-amber-600" />;
      default:
        return <HelpCircle className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
        <CheckSquare className="h-4 w-4 text-emerald-600" />
        Danh sách Hoạt động Luyện tập ({skills.length} Activity Checklist)
      </h4>

      <div className="border rounded-xl bg-card overflow-hidden divide-y">
        {skills.map((skill, idx) => (
          <div
            key={idx}
            className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted/50">
                {getSkillIcon(skill.type)}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  {skill.name}
                  <Badge variant="outline" className="text-[10px] font-mono uppercase px-1.5 py-0">
                    {skill.type}
                  </Badge>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {skill.detail}
                </p>
              </div>
            </div>
            <CheckCircle2 className="h-4 w-4 text-emerald-500 opacity-60" />
          </div>
        ))}
      </div>
    </div>
  );
};
