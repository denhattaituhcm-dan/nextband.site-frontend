import React from 'react';
import { Link } from 'react-router-dom';
import { ForecastTopic } from '@/services/forecast';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  Layers,
  Calendar,
  Mic,
  MessageSquare,
  MessageSquareText,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeasonTopicCardProps {
  topic: ForecastTopic;
  seasonSlug: string;
}

export const SeasonTopicCard: React.FC<SeasonTopicCardProps> = ({
  topic,
  seasonSlug,
}) => {
  const getPartConfig = (part: string) => {
    switch (part) {
      case 'Part 1':
        return {
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-200/80',
          borderTopClass: 'border-t-4 border-t-blue-500',
          icon: Mic,
          label: 'Part 1',
        };
      case 'Part 2':
        return {
          badgeClass: 'bg-purple-100 text-purple-800 border-purple-200/80',
          borderTopClass: 'border-t-4 border-t-purple-500',
          icon: MessageSquareText,
          label: 'Part 2 (Cue Card)',
        };
      case 'Part 3':
        return {
          badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200/80',
          borderTopClass: 'border-t-4 border-t-indigo-500',
          icon: MessageSquare,
          label: 'Part 3 (Discussion)',
        };
      default:
        return {
          badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
          borderTopClass: 'border-t-4 border-t-slate-400',
          icon: Layers,
          label: part,
        };
    }
  };

  const partConfig = getPartConfig(topic.part);
  const IconComponent = partConfig.icon;
  const topicUrl = `/ielts-speaking-forecast/${seasonSlug}/${topic.slug || topic.id}`;

  return (
    <Card
      id={`topic-${topic.id}`}
      style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 260px' }}
      className={cn(
        'group bg-card hover:bg-card border border-border/80 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between overflow-hidden rounded-xl scroll-mt-24',
        partConfig.borderTopClass
      )}
    >
      <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          {/* Top Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border',
                  partConfig.badgeClass
                )}
              >
                <IconComponent className="h-3 w-3" />
                {partConfig.label}
              </span>

              {topic.type === 'New' ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                  Đề mới
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  Giữ lại
                </span>
              )}
            </div>

            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              {topic.category || 'General'}
            </span>
          </div>

          {/* Topic Title */}
          <h3 className="text-base sm:text-lg font-extrabold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            <Link to={topicUrl}>{topic.topicName}</Link>
          </h3>

          {/* Content Preview Box */}
          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {topic.part === 'Part 2' && topic.cueCardPrompt ? (
              <div>
                <p className="italic font-medium text-foreground/90 line-clamp-1">“{topic.cueCardPrompt}”</p>
                {topic.part3Questions && topic.part3Questions.length > 0 && (
                  <p className="text-[11px] text-indigo-600 font-semibold mt-1">
                    + Kèm {topic.part3Questions.length} câu hỏi thảo luận Part 3
                  </p>
                )}
              </div>
            ) : topic.questions && topic.questions.length > 0 ? (
              <p className="font-medium text-foreground/80">• {topic.questions[0]}</p>
            ) : (
              <p>Trọn bộ câu hỏi, từ vựng và bài mẫu Band 8.0+.</p>
            )}
          </div>
        </div>

        {/* Card Footer */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
            <Clock className="h-3 w-3" />
            Cập nhật: {topic.updatedAt}
          </span>

          <Link
            to={topicUrl}
            className="inline-flex items-center gap-1 font-bold text-primary group-hover:translate-x-1 transition-transform"
          >
            <span>Mở bài mẫu</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
