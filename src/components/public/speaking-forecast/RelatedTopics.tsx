import React from 'react';
import { Link } from 'react-router-dom';
import { ForecastTopic } from '@/services/forecast';
import { ArrowRight, Layers } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface RelatedTopicsProps {
  topics: ForecastTopic[];
  seasonSlug: string;
}

export const RelatedTopics: React.FC<RelatedTopicsProps> = ({ topics, seasonSlug }) => {
  if (!topics || topics.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-muted text-foreground">
            <Layers className="h-4 w-4" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            Chủ đề liên quan trong cùng Quý
          </h3>
        </div>

        <Link
          to={`/ielts-speaking-forecast/${seasonSlug}`}
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          <span>Xem tất cả chủ đề</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {topics.map((item) => {
          const itemUrl = `/ielts-speaking-forecast/${seasonSlug}/${item.slug || item.id}`;
          return (
            <Card
              key={item.id}
              className="group border border-border/80 bg-card hover:border-primary/40 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <CardContent className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-primary">{item.part}</span>
                    <span className="text-muted-foreground">{item.category}</span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    <Link to={itemUrl}>{item.topicName}</Link>
                  </h4>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{item.updatedAt}</span>
                  <Link
                    to={itemUrl}
                    className="font-semibold text-primary inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Xem đề</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
