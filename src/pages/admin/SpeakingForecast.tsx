import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSpeakingForecastStore } from '@/components/admin/speaking-forecast/useSpeakingForecastStore';
import { SeasonSelectorCard } from '@/components/admin/speaking-forecast/SeasonSelectorCard';
import { TopicFilterBar } from '@/components/admin/speaking-forecast/TopicFilterBar';
import { TopicTable } from '@/components/admin/speaking-forecast/TopicTable';
import { NewSeasonDialog } from '@/components/admin/speaking-forecast/NewSeasonDialog';
import { Button } from '@/components/ui/button';
import { Plus, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SpeakingForecast() {
  const { toast } = useToast();
  const {
    seasons,
    topics,
    selectedSeasonId,
    setSelectedSeasonId,
    getSeasonMetrics,
    duplicateTopic,
    deleteTopic,
    addSeason,
  } = useSpeakingForecastStore();

  const [search, setSearch] = useState('');
  const [partFilter, setPartFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isNewSeasonModalOpen, setIsNewSeasonModalOpen] = useState(false);

  // Derived metrics for the currently selected season
  const metrics = getSeasonMetrics(selectedSeasonId);

  // Filter topics of the selected season
  const filteredTopics = topics.filter((t) => {
    if (t.seasonId !== selectedSeasonId) return false;

    // Search filter (matches name, category, or questions)
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = t.topicName.toLowerCase().includes(q);
      const matchCategory = t.category?.toLowerCase().includes(q);
      const matchPrompt = t.cueCardPrompt?.toLowerCase().includes(q);
      const matchQuestions = t.questions?.some((item) =>
        item.toLowerCase().includes(q)
      );
      if (!matchName && !matchCategory && !matchPrompt && !matchQuestions) {
        return false;
      }
    }

    // Part filter
    if (partFilter !== 'all' && t.part !== partFilter) {
      return false;
    }

    // Type filter
    if (typeFilter !== 'all' && t.type !== typeFilter) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && t.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const hasActiveFilters =
    Boolean(search.trim()) ||
    partFilter !== 'all' ||
    typeFilter !== 'all' ||
    statusFilter !== 'all';

  const handleClearFilters = () => {
    setSearch('');
    setPartFilter('all');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  const handleDuplicate = (id: string) => {
    const copy = duplicateTopic(id);
    if (copy) {
      toast({
        title: 'Topic Duplicated',
        description: `Created a draft copy of "${copy.topicName}".`,
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteTopic(id);
    toast({
      title: 'Topic Deleted',
      description: 'The topic has been removed from the season.',
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* A. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Mic className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Speaking Forecast</h1>
            <p className="text-sm text-muted-foreground">
              Manage IELTS Speaking forecast content by season, part and topic.
            </p>
          </div>
        </div>

        <Button asChild className="font-semibold gap-1.5 shadow-sm">
          <Link to="/admin/speaking-forecast/new">
            <Plus className="h-4 w-4" />
            Add Topic
          </Link>
        </Button>
      </div>

      {/* B. SEASON SELECTOR & SUMMARY */}
      <SeasonSelectorCard
        seasons={seasons}
        selectedSeasonId={selectedSeasonId}
        onSelectSeason={setSelectedSeasonId}
        metrics={metrics}
        onOpenNewSeasonModal={() => setIsNewSeasonModalOpen(true)}
      />

      {/* C. TOPIC FILTER BAR & MANAGEMENT TABLE */}
      <div className="space-y-3">
        <TopicFilterBar
          search={search}
          onSearchChange={setSearch}
          partFilter={partFilter}
          onPartFilterChange={setPartFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        <TopicTable
          topics={filteredTopics}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      </div>

      {/* NEW SEASON MODAL */}
      <NewSeasonDialog
        open={isNewSeasonModalOpen}
        onOpenChange={setIsNewSeasonModalOpen}
        existingSeasons={seasons}
        onCreateSeason={(seasonData, cloneFromSeasonId) => {
          const created = addSeason(seasonData, cloneFromSeasonId);
          toast({
            title: 'Season Created',
            description: `Season ${created.name} is now active.${
              cloneFromSeasonId ? ' Topics have been cloned as Retained Drafts.' : ''
            }`,
          });
        }}
      />
    </div>
  );
}
