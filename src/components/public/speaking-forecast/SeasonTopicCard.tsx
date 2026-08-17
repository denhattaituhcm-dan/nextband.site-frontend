import React from 'react';
import { Link } from 'react-router-dom';
import { ForecastTopic, formatSeasonSlug, Season } from '@/services/forecast';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Sparkles, HelpCircle, Layers, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeasonTopicCardProps {
  topic: ForecastTopic;
  seasonSlug: string;
}

export const SeasonTopicCard: React.FC<SeasonTopicCardProps> = ({
  topic,
  seasonSlug,
}) => {
  const getPartBadge = (part: string) => {
    switch (part) {
      case 'Part 1':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Part 1
          </span>
        );
      case 'Part 2':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            Part 2
          </span>
        );
      case 'Part 3':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Part 3
          </span>
        );
      default:
        return null;
    }
  };

  const topicUrl = `/ielts-speaking-forecast/${seasonSlug}/${topic.slug || topic.id}`;

  return (
    <Card className="group border border-border/80 bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden">
      <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          {/* Badges Row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {getPartBadge(topic.part)}
              {topic.type === 'New' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="h-3 w-3 text-emerald-600" />
                  Đề mới
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  Giữ lại
                </span>
              )}
            </div>

            <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
              {topic.category || 'General'}
            </span>
          </div>

          {/* Topic Title */}
          <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            <Link to={topicUrl}>{topic.topicName}</Link>
          </h3>

          {/* Content Preview */}
          <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {topic.part === 'Part 2' && topic.cueCardPrompt ? (
              <p className="italic">“{topic.cueCardPrompt}”</p>
            ) : topic.questions && topic.questions.length > 0 ? (
              <p>• {topic.questions[0]}</p>
            ) : (
              <p>Trọn bộ câu hỏi, từ vựng và bài mẫu Band 8.0+.</p>
            )}
          </div>
        </div>

        {/* Card Footer */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Cập nhật: {topic.updatedAt}
          </span>

          <Link
            to={topicUrl}
            className="inline-flex items-center gap-1 font-semibold text-primary group-hover:translate-x-0.5 transition-transform"
          >
            <span>Chi tiết</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
