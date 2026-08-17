import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSpeakingForecastStore } from '@/components/admin/speaking-forecast/useSpeakingForecastStore';
import { TopicEditorForm } from '@/components/admin/speaking-forecast/TopicEditorForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function SpeakingForecastEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { seasons, getTopic, updateTopic } = useSpeakingForecastStore();

  if (!id) {
    return (
      <div className="p-12 text-center">
        <p className="text-destructive font-medium">Invalid Topic ID</p>
      </div>
    );
  }

  const topic = getTopic(id);

  if (!topic) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 border rounded-lg bg-card text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 bg-amber-100 rounded-full text-amber-600">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>
        <h2 className="text-lg font-bold">Topic Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The requested Speaking Forecast topic could not be located or may have been removed.
        </p>
        <Button onClick={() => navigate('/admin/speaking-forecast')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Speaking Forecast
        </Button>
      </div>
    );
  }

  return (
    <TopicEditorForm
      mode="edit"
      initialTopic={topic}
      seasons={seasons}
      defaultSeasonId={topic.seasonId}
      onSave={(payload) => {
        updateTopic(topic.id, payload);
      }}
    />
  );
}
