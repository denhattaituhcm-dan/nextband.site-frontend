import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PartFilterTabsProps {
  counts?: {
    all: number;
    part1: number;
    part2: number;
    part3: number;
  };
}

export const PartFilterTabs: React.FC<PartFilterTabsProps> = ({ counts }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPartParam = searchParams.get('part');

  const selectedPart =
    currentPartParam === '1'
      ? 'Part 1'
      : currentPartParam === '2'
      ? 'Part 2'
      : currentPartParam === '3'
      ? 'Part 3'
      : 'all';

  const handleSelectPart = (partVal: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (partVal === 'all') {
      newParams.delete('part');
    } else if (partVal === 'Part 1') {
      newParams.set('part', '1');
    } else if (partVal === 'Part 2') {
      newParams.set('part', '2');
    } else if (partVal === 'Part 3') {
      newParams.set('part', '3');
    }
    setSearchParams(newParams, { replace: true });
  };

  const tabs = [
    { label: 'Tất cả Parts', value: 'all', count: counts?.all },
    { label: 'Part 1 (Short Q&A)', value: 'Part 1', count: counts?.part1 },
    { label: 'Part 2 (Cue Card)', value: 'Part 2', count: counts?.part2 },
    { label: 'Part 3 (Discussion)', value: 'Part 3', count: counts?.part3 },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/40 rounded-lg border">
      {tabs.map((tab) => {
        const isActive = selectedPart === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => handleSelectPart(tab.value)}
            className={cn(
              'px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer',
              isActive
                ? 'bg-primary text-white shadow-xs font-extrabold'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
            )}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.2 rounded-full font-semibold',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
