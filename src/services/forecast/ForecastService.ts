import { Season, ForecastTopic, TopicFilters } from './types';

export interface ForecastService {
  /**
   * Retrieves the current or latest published season.
   */
  getLatestSeason(): Promise<Season | null>;

  /**
   * Retrieves all available forecast seasons.
   */
  getSeasons(): Promise<Season[]>;

  /**
   * Retrieves a specific season by slug (e.g. "q3-2026").
   */
  getSeason(slug: string): Promise<Season | null>;

  /**
   * Retrieves topics for a season with optional filtering.
   */
  getTopics(seasonSlug: string, filters?: TopicFilters): Promise<ForecastTopic[]>;

  /**
   * Retrieves a single topic by season slug and topic slug.
   */
  getTopic(seasonSlug: string, topicSlug: string): Promise<ForecastTopic | null>;

  /**
   * Retrieves related topics in the same season/category.
   */
  getRelatedTopics(topic: ForecastTopic, limit?: number): Promise<ForecastTopic[]>;
}
