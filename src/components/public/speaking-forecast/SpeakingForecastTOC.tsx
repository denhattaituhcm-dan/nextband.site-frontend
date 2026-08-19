import React, { useState, useMemo } from 'react';
import { ForecastTopic } from '@/services/forecast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  List,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Mic,
  MessageSquareText,
  Eye,
  EyeOff,
  Compass,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpeakingForecastTOCProps {
  topics: ForecastTopic[];
  activeTopicId: string | null;
  onTopicClick: (topicId: string) => void;
}

export const SpeakingForecastTOC: React.FC<SpeakingForecastTOCProps> = ({
  topics,
  activeTopicId,
  onTopicClick,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPart1Expanded, setIsPart1Expanded] = useState(true);
  const [isPart2Expanded, setIsPart2Expanded] = useState(true);

  // Group topics
  const part1Topics = useMemo(
    () => topics.filter((t) => t.part === 'Part 1'),
    [topics]
  );
  const part2Topics = useMemo(
    () => topics.filter((t) => t.part === 'Part 2'),
    [topics]
  );

  // Filter topics based on search
  const filteredPart1 = useMemo(() => {
    if (!searchQuery.trim()) return part1Topics;
    const q = searchQuery.toLowerCase();
    return part1Topics.filter(
      (t) =>
        t.topicName.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
    );
  }, [part1Topics, searchQuery]);

  const filteredPart2 = useMemo(() => {
    if (!searchQuery.trim()) return part2Topics;
    const q = searchQuery.toLowerCase();
    return part2Topics.filter(
      (t) =>
        t.topicName.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q) ||
        t.cueCardPrompt?.toLowerCase().includes(q)
    );
  }, [part2Topics, searchQuery]);

  const handleItemClick = (id: string) => {
    onTopicClick(id);
    setIsMobileOpen(false);
  };

  const renderTOCContent = () => (
    <div className="flex flex-col h-full space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-border/80">
        <div className="flex items-center gap-2">
          <List className="h-4 w-4 text-primary" />
          <span className="font-bold text-sm text-foreground tracking-tight">
            MỤC LỤC
          </span>
          <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {topics.length} đề
          </span>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors cursor-pointer"
        >
          {isCollapsed ? (
            <>
              <Eye className="h-3.5 w-3.5" />
              <span>[ Hiện ]</span>
            </>
          ) : (
            <>
              <EyeOff className="h-3.5 w-3.5" />
              <span>[ Ẩn ]</span>
            </>
          )}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Mini Search Bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Lọc nhanh chủ đề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-7 h-8 text-xs bg-muted/30 focus-visible:ring-1"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Navigation Scrollable List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[calc(100vh-280px)] text-xs scrollbar-thin">
            {/* PART 1 SECTION */}
            <div className="space-y-1.5">
              <button
                onClick={() => setIsPart1Expanded(!isPart1Expanded)}
                className="w-full flex items-center justify-between py-1 px-1.5 rounded font-bold text-slate-800 hover:bg-muted/60 transition-colors text-left"
              >
                <span className="flex items-center gap-1.5 text-blue-700">
                  <Mic className="h-3.5 w-3.5" />
                  Forecast Speaking Part 1
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  ({filteredPart1.length})
                  {isPart1Expanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </span>
              </button>

              {isPart1Expanded && (
                <ul className="pl-2 space-y-0.5 border-l-2 border-blue-100 ml-2">
                  {filteredPart1.map((topic) => {
                    const isActive = activeTopicId === topic.id;
                    return (
                      <li key={topic.id} className="relative">
                        <button
                          onClick={() => handleItemClick(topic.id)}
                          className={cn(
                            'w-full text-left py-1 px-2 rounded text-[11px] transition-all truncate block cursor-pointer',
                            isActive
                              ? 'bg-amber-500 text-white font-extrabold shadow-xs translate-x-0.5'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium'
                          )}
                        >
                          {topic.topicName}
                        </button>
                      </li>
                    );
                  })}
                  {filteredPart1.length === 0 && (
                    <li className="text-[11px] text-muted-foreground italic px-2 py-1">
                      Không tìm thấy chủ đề
                    </li>
                  )}
                </ul>
              )}
            </div>

            {/* PART 2 & PART 3 SECTION */}
            <div className="space-y-1.5">
              <button
                onClick={() => setIsPart2Expanded(!isPart2Expanded)}
                className="w-full flex items-center justify-between py-1 px-1.5 rounded font-bold text-slate-800 hover:bg-muted/60 transition-colors text-left"
              >
                <span className="flex items-center gap-1.5 text-purple-700">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  Forecast Speaking Part 2 &amp; 3
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  ({filteredPart2.length})
                  {isPart2Expanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </span>
              </button>

              {isPart2Expanded && (
                <ul className="pl-2 space-y-0.5 border-l-2 border-purple-100 ml-2">
                  {filteredPart2.map((topic) => {
                    const isActive = activeTopicId === topic.id;
                    return (
                      <li key={topic.id} className="relative">
                        <button
                          onClick={() => handleItemClick(topic.id)}
                          className={cn(
                            'w-full text-left py-1 px-2 rounded text-[11px] transition-all truncate block cursor-pointer',
                            isActive
                              ? 'bg-amber-500 text-white font-extrabold shadow-xs translate-x-0.5'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium'
                          )}
                          title={topic.topicName}
                        >
                          {topic.topicName}
                        </button>
                      </li>
                    );
                  })}
                  {filteredPart2.length === 0 && (
                    <li className="text-[11px] text-muted-foreground italic px-2 py-1">
                      Không tìm thấy chủ đề
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* 1. DESKTOP STICKY SIDEBAR (lg+) */}
      <aside className="hidden lg:block w-72 shrink-0">
        <div
          className={cn(
            'sticky top-24 rounded-2xl bg-card border border-border/80 p-4 shadow-sm backdrop-blur transition-all',
            isCollapsed ? 'p-3 w-40' : 'w-72'
          )}
        >
          {renderTOCContent()}
        </div>
      </aside>

      {/* 2. MOBILE FLOATING ACTION BUTTON & BOTTOM SHEET (lg-) */}
      <div className="lg:hidden">
        {/* Floating Quick Jump Button */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs shadow-xl border border-slate-700 hover:bg-primary transition-all cursor-pointer"
        >
          <Compass className="h-4 w-4 text-primary" />
          <span>Mục lục ({topics.length})</span>
        </button>

        {/* Mobile Drawer Backdrop */}
        {isMobileOpen && (
          <div
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs transition-opacity animate-in fade-in"
          >
            {/* Mobile Drawer Panel */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-card rounded-t-3xl border-t border-border p-5 flex flex-col shadow-2xl z-50 animate-in slide-in-from-bottom"
            >
              <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-3" />
              {renderTOCContent()}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
