import React, { useState } from 'react';
import { Season } from './types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Copy } from 'lucide-react';

interface NewSeasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingSeasons: Season[];
  onCreateSeason: (
    seasonData: Omit<Season, 'id'>,
    cloneFromSeasonId?: string
  ) => void;
}

export const NewSeasonDialog: React.FC<NewSeasonDialogProps> = ({
  open,
  onOpenChange,
  existingSeasons,
  onCreateSeason,
}) => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(4);
  const [isCurrent, setIsCurrent] = useState(false);
  const [enableClone, setEnableClone] = useState(false);
  const [cloneFromId, setCloneFromId] = useState<string>(
    existingSeasons[0]?.id || ''
  );

  const seasonName = `Q${quarter} / ${year}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateSeason(
      {
        name: seasonName,
        year: Number(year),
        quarter,
        isCurrent,
      },
      enableClone && cloneFromId ? cloneFromId : undefined
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Add New Forecast Season
          </DialogTitle>
          <DialogDescription>
            Create a new quarter cycle for IELTS Speaking Forecast topics.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Season Name Preview */}
          <div className="p-3 bg-muted/50 rounded-lg border flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground block">Season Identifier</span>
              <span className="text-base font-bold text-foreground">{seasonName}</span>
            </div>
            <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-1 rounded">
              {quarter === 1
                ? 'Jan - Apr'
                : quarter === 2
                ? 'May - Aug'
                : quarter === 3
                ? 'Sep - Dec'
                : 'Quarter 4'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="season-quarter" className="text-xs font-semibold">
                Quarter
              </Label>
              <Select
                value={quarter.toString()}
                onValueChange={(val) => setQuarter(Number(val) as 1 | 2 | 3 | 4)}
              >
                <SelectTrigger id="season-quarter" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Q1 (Jan - Apr)</SelectItem>
                  <SelectItem value="2">Q2 (May - Aug)</SelectItem>
                  <SelectItem value="3">Q3 (Sep - Dec)</SelectItem>
                  <SelectItem value="4">Q4 (Oct - Dec)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="season-year" className="text-xs font-semibold">
                Year
              </Label>
              <Input
                id="season-year"
                type="number"
                min={2024}
                max={2035}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="h-9"
              />
            </div>
          </div>

          {/* Mark as current active season */}
          <div className="flex items-center space-x-2 pt-1">
            <Checkbox
              id="is-current"
              checked={isCurrent}
              onCheckedChange={(checked) => setIsCurrent(!!checked)}
            />
            <Label htmlFor="is-current" className="text-xs font-normal cursor-pointer">
              Set as current active season
            </Label>
          </div>

          {/* Clone from previous season option */}
          <div className="border rounded-lg p-3 bg-card space-y-3 pt-3">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="clone-toggle"
                checked={enableClone}
                onCheckedChange={(checked) => setEnableClone(!!checked)}
                className="mt-0.5"
              />
              <div className="grid gap-1 leading-none">
                <Label htmlFor="clone-toggle" className="text-xs font-semibold cursor-pointer">
                  Clone topics from previous season (Retained 50%)
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Creates independent copies marked as <strong>Retained</strong> and set to <strong>Draft</strong> for review.
                </p>
              </div>
            </div>

            {enableClone && (
              <div className="pl-6 pt-1 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Source Season</Label>
                <Select value={cloneFromId} onValueChange={setCloneFromId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select source season" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingSeasons.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} {s.isCurrent ? '(Current)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="font-semibold">
              Create Season
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
