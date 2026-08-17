import {
  ForecastService,
} from './ForecastService';
import {
  Season,
  ForecastTopic,
  TopicFilters,
  formatSeasonSlug,
  parseSeasonSlug,
} from './types';
import { initialSeasons, initialTopics } from '@/components/admin/speaking-forecast/mockData';

const SEASONS_STORAGE_KEY = 'nb_speaking_forecast_seasons';
const TOPICS_STORAGE_KEY = 'nb_speaking_forecast_topics';

function loadStoredSeasons(): Season[] {
  try {
    const raw = localStorage.getItem(SEASONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return initialSeasons;
}

function loadStoredTopics(): ForecastTopic[] {
  try {
    const raw = localStorage.getItem(TOPICS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return initialTopics;
}

export class MockForecastService implements ForecastService {
  async getLatestSeason(): Promise<Season | null> {
    const seasons = loadStoredSeasons();
    const current = seasons.find((s) => s.isCurrent);
    if (current) return current;
    return seasons[0] || null;
  }

  async getSeasons(): Promise<Season[]> {
    return loadStoredSeasons();
  }

  async getSeason(slug: string): Promise<Season | null> {
    const seasons = loadStoredSeasons();
    const parsed = parseSeasonSlug(slug);
    if (parsed) {
      const match = seasons.find(
        (s) => s.year === parsed.year && s.quarter === parsed.quarter
      );
      if (match) return match;
    }
    return (
      seasons.find(
        (s) => formatSeasonSlug(s.year, s.quarter).toLowerCase() === slug.toLowerCase()
      ) || null
    );
  }

  async getTopics(seasonSlug: string, filters?: TopicFilters): Promise<ForecastTopic[]> {
    const season = await this.getSeason(seasonSlug);
    if (!season) return [];

    const allTopics = loadStoredTopics();
    return allTopics.filter((t) => {
      // Must belong to target season
      if (t.seasonId !== season.id) return false;

      // Only published topics on public frontend
      const statusFilter = filters?.status || 'Published';
      if (t.status !== statusFilter) return false;

      // Part filter
      if (filters?.part && filters.part !== 'all' && t.part !== filters.part) {
        return false;
      }

      // Type filter
      if (filters?.type && filters.type !== 'all' && t.type !== filters.type) {
        return false;
      }

      // Category filter
      if (filters?.category && t.category.toLowerCase() !== filters.category.toLowerCase()) {
        return false;
      }

      // Search term
      if (filters?.search && filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const matchName = t.topicName.toLowerCase().includes(q);
        const matchCat = t.category?.toLowerCase().includes(q);
        const matchPrompt = t.cueCardPrompt?.toLowerCase().includes(q);
        const matchQ = t.questions?.some((item) => item.toLowerCase().includes(q));
        if (!matchName && !matchCat && !matchPrompt && !matchQ) {
          return false;
        }
      }

      return true;
    });
  }

  async getTopic(seasonSlug: string, topicSlug: string): Promise<ForecastTopic | null> {
    const season = await this.getSeason(seasonSlug);
    if (!season) return null;

    const allTopics = loadStoredTopics();
    const topic = allTopics.find(
      (t) =>
        t.seasonId === season.id &&
        (t.slug.toLowerCase() === topicSlug.toLowerCase() ||
          t.id.toLowerCase() === topicSlug.toLowerCase()) &&
        t.status === 'Published'
    );

    return topic || null;
  }

  async getRelatedTopics(
    currentTopic: ForecastTopic,
    limit = 3
  ): Promise<ForecastTopic[]> {
    const allTopics = loadStoredTopics();
    return allTopics
      .filter(
        (t) =>
          t.id !== currentTopic.id &&
          t.seasonId === currentTopic.seasonId &&
          t.status === 'Published'
      )
      .sort((a, b) => {
        // Prioritize same category, then same part
        if (a.category === currentTopic.category && b.category !== currentTopic.category) return -1;
        if (b.category === currentTopic.category && a.category !== currentTopic.category) return 1;
        if (a.part === currentTopic.part && b.part !== currentTopic.part) return -1;
        if (b.part === currentTopic.part && a.part !== currentTopic.part) return 1;
        return 0;
      })
      .slice(0, limit);
  }
}
