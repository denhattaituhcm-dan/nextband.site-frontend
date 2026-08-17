import React from 'react';
import { useSpeakingForecastStore } from '@/components/admin/speaking-forecast/useSpeakingForecastStore';
import { TopicEditorForm } from '@/components/admin/speaking-forecast/TopicEditorForm';

export default function SpeakingForecastCreate() {
  const { seasons, selectedSeasonId, addTopic } = useSpeakingForecastStore();

  return (
    <TopicEditorForm
      mode="create"
      seasons={seasons}
      defaultSeasonId={selectedSeasonId}
      onSave={(payload) => {
        addTopic(payload);
      }}
    />
  );
}
