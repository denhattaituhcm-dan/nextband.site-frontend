export type TopicType = 'New' | 'Retained';
export type TopicStatus = 'Draft' | 'Published';
export type SpeakingPart = 'Part 1' | 'Part 2' | 'Part 3';

export interface VocabularyItem {
  id: string;
  word: string;
  meaning: string;
  example: string;
}

export interface AudioSample {
  fileName: string;
  fileUrl: string;
  duration?: number;
  fileSize?: number;
  uploadedAt?: string;
}

export interface SampleAnswers {
  band65: string;
  band75: string;
  band65Audio?: AudioSample | null;
  band75Audio?: AudioSample | null;
}

export interface Season {
  id: string;
  name: string; // e.g. "Q3 / 2026"
  year: number;
  quarter: 1 | 2 | 3 | 4;
  isCurrent?: boolean;
}

export interface ForecastTopic {
  id: string;
  seasonId: string;
  topicName: string;
  category: string;
  part: SpeakingPart;
  type: TopicType;
  status: TopicStatus;
  updatedAt: string;

  // Question Content (contextual according to part)
  questions?: string[]; // For Part 1 and Part 3
  cueCardPrompt?: string; // For Part 2
  cueCardBulletPoints?: string[]; // For Part 2 "You should say:"

  // Learning Content
  sampleAnswers: SampleAnswers;
  keyVocabulary: VocabularyItem[];
  ideas: string;

  // SEO
  seoTitle: string;
  metaDescription: string;
  slug: string;
}

export interface SeasonMetrics {
  totalTopics: number;
  publishedCount: number;
  draftCount: number;
}
