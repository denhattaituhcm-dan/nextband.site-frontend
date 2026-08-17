import React from 'react';
import { Season, SeasonMetrics } from './types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SeasonSelectorCardProps {
  seasons: Season[];
  selectedSeasonId: string;
  onSelectSeason: (id: string) => void;
  metrics: SeasonMetrics;
  onOpenNewSeasonModal: () => void;
}

export const SeasonSelectorCard: React.FC<SeasonSelectorCardProps> = ({
  seasons,
  selectedSeasonId,
  onSelectSeason,
  metrics,
  onOpenNewSeasonModal,
}) => {
  const currentSeasonObj = seasons.find((s) => s.id === selectedSeasonId);

  return (
    <Card className="border shadow-none bg-card">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Season selector */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Current Season:</span>
            </div>

            <div className="w-[180px]">
              <Select value={selectedSeasonId} onValueChange={onSelectSeason}>
                <SelectTrigger className="h-9 font-semibold">
                  <SelectValue placeholder="Chọn mùa đề thi" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((season) => (
                    <SelectItem key={season.id} value={season.id}>
                      <div className="flex items-center gap-2">
                        <span>{season.name}</span>
                        {season.isCurrent && (
                          <span className="text-[10px] bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded">
                            Current
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenNewSeasonModal}
              className="h-9 gap-1.5 text-xs font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              New Season
            </Button>
          </div>

          {/* Right: Derived summary badges */}
          <div className="flex items-center gap-3 border-t md:border-t-0 pt-3 md:pt-0">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-muted/60 text-xs font-medium text-slate-700">
              <span className="font-bold text-sm text-foreground">{metrics.totalTopics}</span>
              <span className="text-muted-foreground">Topics</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 text-xs font-medium text-emerald-700 border border-emerald-200/50">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span className="font-bold text-sm text-emerald-800">{metrics.publishedCount}</span>
              <span>Published</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-50 text-xs font-medium text-amber-700 border border-amber-200/50">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span className="font-bold text-sm text-amber-800">{metrics.draftCount}</span>
              <span>Draft</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
