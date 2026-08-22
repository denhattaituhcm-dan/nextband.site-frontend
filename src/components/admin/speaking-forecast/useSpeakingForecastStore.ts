import { useState, useEffect, useCallback } from 'react';
import { Season, ForecastTopic, SeasonMetrics } from './types';
import { initialSeasons, initialTopics } from './mockData';
import { speakingForecastApi } from '@/lib/api';

const SEASONS_STORAGE_KEY = 'nb_speaking_forecast_seasons';
const TOPICS_STORAGE_KEY = 'nb_speaking_forecast_topics';
const SELECTED_SEASON_STORAGE_KEY = 'nb_speaking_forecast_selected_season';

// Custom event to synchronize state across component instances and routes
const STORE_UPDATE_EVENT = 'nb_speaking_forecast_store_update';

function getStoredSeasons(): Season[] {
  try {
    const raw = localStorage.getItem(SEASONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load seasons from storage', e);
  }
  return initialSeasons;
}

function normalizeTopic(topic: ForecastTopic): ForecastTopic {
  const sa = topic.sampleAnswers as any;
  if (!sa) {
    return {
      ...topic,
      sampleAnswers: { band65: '', band75: '', band65Audio: null, band75Audio: null },
    };
  }
  let band65 = sa.band65 ?? '';
  let band75 = sa.band75 ?? '';
  if (!band65 && sa.band80) {
    band65 = sa.band75 ?? '';
    band75 = sa.band80 ?? '';
  }
  return {
    ...topic,
    sampleAnswers: {
      band65,
      band75,
      band65Audio: sa.band65Audio ?? null,
      band75Audio: sa.band75Audio ?? null,
    },
  };
}

function getStoredTopics(): ForecastTopic[] {
  try {
    const raw = localStorage.getItem(TOPICS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeTopic);
      }
    }
  } catch (e) {
    console.error('Failed to load topics from storage', e);
  }
  return initialTopics;
}

function getStoredSelectedSeason(): string {
  try {
    const raw = localStorage.getItem(SELECTED_SEASON_STORAGE_KEY);
    if (raw) return raw;
  } catch (e) {
    console.error('Failed to load selected season from storage', e);
  }
  return initialSeasons[0]?.id || 'season-2026-q2';
}

function emitStoreUpdate() {
  window.dispatchEvent(new Event(STORE_UPDATE_EVENT));
}

export function useSpeakingForecastStore() {
  const [seasons, setSeasons] = useState<Season[]>(getStoredSeasons);
  const [topics, setTopics] = useState<ForecastTopic[]>(getStoredTopics);
  const [selectedSeasonId, setSelectedSeasonIdState] = useState<string>(getStoredSelectedSeason);

  const refreshState = useCallback(() => {
    setSeasons(getStoredSeasons());
    setTopics(getStoredTopics());
    setSelectedSeasonIdState(getStoredSelectedSeason());
  }, []);

  // Server sync on mount
  useEffect(() => {
    speakingForecastApi.getPublicData().then((serverData) => {
      if (serverData && serverData.seasons && Array.isArray(serverData.seasons) && serverData.seasons.length > 0) {
        setSeasons(serverData.seasons);
        localStorage.setItem(SEASONS_STORAGE_KEY, JSON.stringify(serverData.seasons));
      }
      if (serverData && serverData.topics && Array.isArray(serverData.topics) && serverData.topics.length > 0) {
        const normalized = serverData.topics.map(normalizeTopic);
        setTopics(normalized);
        localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(normalized));
      }
      if (serverData && serverData.selectedSeasonId) {
        setSelectedSeasonIdState(serverData.selectedSeasonId);
        localStorage.setItem(SELECTED_SEASON_STORAGE_KEY, serverData.selectedSeasonId);
      }
      emitStoreUpdate();
    }).catch(() => {});
  }, []);

  useEffect(() => {
    window.addEventListener(STORE_UPDATE_EVENT, refreshState);
    window.addEventListener('storage', refreshState);
    return () => {
      window.removeEventListener(STORE_UPDATE_EVENT, refreshState);
      window.removeEventListener('storage', refreshState);
    };
  }, [refreshState]);

  const syncToServer = useCallback((nextSeasons: Season[], nextTopics: ForecastTopic[], nextSeasonId?: string) => {
    speakingForecastApi.saveAdminData({
      seasons: nextSeasons,
      topics: nextTopics,
      selectedSeasonId: nextSeasonId || selectedSeasonId,
    }).catch((err) => {
      console.warn("Forecast server sync notice:", err);
    });
  }, [selectedSeasonId]);

  const saveSeasons = (newSeasons: Season[]) => {
    setSeasons(newSeasons);
    localStorage.setItem(SEASONS_STORAGE_KEY, JSON.stringify(newSeasons));
    emitStoreUpdate();
    syncToServer(newSeasons, topics, selectedSeasonId);
  };

  const saveTopics = (newTopics: ForecastTopic[]) => {
    setTopics(newTopics);
    localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(newTopics));
    emitStoreUpdate();
    syncToServer(seasons, newTopics, selectedSeasonId);
  };

  const setSelectedSeasonId = (id: string) => {
    setSelectedSeasonIdState(id);
    localStorage.setItem(SELECTED_SEASON_STORAGE_KEY, id);
    emitStoreUpdate();
    syncToServer(seasons, topics, id);
  };

  // Derived metrics calculation - never stored as raw attributes
  const getSeasonMetrics = useCallback(
    (seasonId: string): SeasonMetrics => {
      const seasonTopics = topics.filter((t) => t.seasonId === seasonId);
      return {
        totalTopics: seasonTopics.length,
        publishedCount: seasonTopics.filter((t) => t.status === 'Published').length,
        draftCount: seasonTopics.filter((t) => t.status === 'Draft').length,
      };
    },
    [topics]
  );

  const getTopic = useCallback(
    (id: string): ForecastTopic | undefined => {
      return topics.find((t) => t.id === id);
    },
    [topics]
  );

  const addTopic = (
    data: Omit<ForecastTopic, 'id' | 'updatedAt'>
  ): ForecastTopic => {
    const newTopic: ForecastTopic = {
      ...data,
      id: `topic-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      updatedAt: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    };
    const updated = [newTopic, ...topics];
    saveTopics(updated);
    return newTopic;
  };

  const updateTopic = (id: string, data: Partial<ForecastTopic>) => {
    const updated = topics.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          ...data,
          updatedAt: new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
        };
      }
      return t;
    });
    saveTopics(updated);
  };

  const duplicateTopic = (id: string): ForecastTopic | undefined => {
    const source = topics.find((t) => t.id === id);
    if (!source) return undefined;

    // Deep copy object to ensure complete independence
    const copy: ForecastTopic = {
      ...JSON.parse(JSON.stringify(source)),
      id: `topic-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      topicName: `${source.topicName} (Copy)`,
      status: 'Draft',
      updatedAt: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    };

    const updated = [copy, ...topics];
    saveTopics(updated);
    return copy;
  };

  const deleteTopic = (id: string) => {
    const updated = topics.filter((t) => t.id !== id);
    saveTopics(updated);
  };

  // Add new season with optional deep clone from a previous season
  const addSeason = (
    seasonData: Omit<Season, 'id'>,
    cloneFromSeasonId?: string
  ): Season => {
    const newSeasonId = `season-${seasonData.year}-q${seasonData.quarter}-${Date.now().toString(36)}`;
    const newSeason: Season = {
      ...seasonData,
      id: newSeasonId,
    };

    // If marked as current, unmark others
    let updatedSeasons = seasons.map((s) => ({
      ...s,
      isCurrent: newSeason.isCurrent ? false : s.isCurrent,
    }));
    updatedSeasons = [newSeason, ...updatedSeasons];
    saveSeasons(updatedSeasons);

    // Deep clone topics if requested
    if (cloneFromSeasonId) {
      const sourceTopics = topics.filter((t) => t.seasonId === cloneFromSeasonId);
      const clonedTopics: ForecastTopic[] = sourceTopics.map((item) => ({
        ...JSON.parse(JSON.stringify(item)),
        id: `topic-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        seasonId: newSeasonId,
        type: 'Retained', // Automatically marked as Retained
        status: 'Draft', // Automatically set as Draft for review
        updatedAt: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
      }));

      saveTopics([...clonedTopics, ...topics]);
    }

    setSelectedSeasonId(newSeasonId);
    return newSeason;
  };

  return {
    seasons,
    topics,
    selectedSeasonId,
    setSelectedSeasonId,
    getSeasonMetrics,
    getTopic,
    addTopic,
    updateTopic,
    duplicateTopic,
    deleteTopic,
    addSeason,
  };
}
