import React from 'react';
import { SpeakingPart, TopicType, TopicStatus } from './types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Filter } from 'lucide-react';

interface TopicFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  partFilter: string;
  onPartFilterChange: (val: string) => void;
  typeFilter: string;
  onTypeFilterChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export const TopicFilterBar: React.FC<TopicFilterBarProps> = ({
  search,
  onSearchChange,
  partFilter,
  onPartFilterChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  onClearFilters,
  hasActiveFilters,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[220px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search topics..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Part Filter */}
      <div className="w-[120px]">
        <Select value={partFilter} onValueChange={onPartFilterChange}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Part" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Parts</SelectItem>
            <SelectItem value="Part 1">Part 1</SelectItem>
            <SelectItem value="Part 2">Part 2</SelectItem>
            <SelectItem value="Part 3">Part 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Type Filter */}
      <div className="w-[120px]">
        <Select value={typeFilter} onValueChange={onTypeFilterChange}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Retained">Retained</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div className="w-[120px]">
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Published">Published</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
        >
          <X className="h-3.5 w-3.5" />
          Clear filters
        </Button>
      )}
    </div>
  );
};
