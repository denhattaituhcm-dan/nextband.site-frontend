import { LessonResourceItemDTO } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { FileText, Video, Music, Presentation, ExternalLink, Image } from "lucide-react";

interface LessonResourceItemProps {
  resource: LessonResourceItemDTO;
}

export function LessonResourceItem({ resource }: LessonResourceItemProps) {
  const getIcon = () => {
    switch (resource.type.toUpperCase()) {
      case "PDF":
        return <FileText className="w-4 h-4 text-red-500" />;
      case "VIDEO":
        return <Video className="w-4 h-4 text-blue-500" />;
      case "AUDIO":
        return <Music className="w-4 h-4 text-purple-500" />;
      case "SLIDE":
        return <Presentation className="w-4 h-4 text-amber-500" />;
      case "IMAGE":
        return <Image className="w-4 h-4 text-emerald-500" />;
      default:
        return <ExternalLink className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-slate-100">{getIcon()}</div>
        <div>
          <h5 className="font-semibold text-sm text-slate-900">{resource.title}</h5>
          <span className="text-xs text-slate-400 font-mono uppercase">{resource.type}</span>
        </div>
      </div>
      <Button size="sm" variant="outline" asChild>
        <a href={resource.url} target="_blank" rel="noopener noreferrer">
          Mở tài liệu
          <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
        </a>
      </Button>
    </div>
  );
}
