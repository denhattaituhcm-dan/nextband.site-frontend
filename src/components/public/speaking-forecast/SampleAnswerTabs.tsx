import React, { useState } from 'react';
import { SampleAnswers } from '@/services/forecast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Sparkles, CheckCircle2 } from 'lucide-react';
import DOMPurify from 'dompurify';

interface SampleAnswerTabsProps {
  sampleAnswers: SampleAnswers;
}

export const SampleAnswerTabs: React.FC<SampleAnswerTabsProps> = ({ sampleAnswers }) => {
  const [activeTab, setActiveTab] = useState<'band75' | 'band80'>('band80');

  const hasBand75 = Boolean(sampleAnswers?.band75 && sampleAnswers.band75.trim());
  const hasBand80 = Boolean(sampleAnswers?.band80 && sampleAnswers.band80.trim());

  if (!hasBand75 && !hasBand80) return null;

  const defaultTab = hasBand80 ? 'band80' : 'band75';

  const cleanBand75 = DOMPurify.sanitize(sampleAnswers?.band75 || '');
  const cleanBand80 = DOMPurify.sanitize(sampleAnswers?.band80 || '');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary">
            <Award className="h-4 w-4" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            Bài mẫu tham khảo (Model Answers)
          </h3>
        </div>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden shadow-xs">
        <Tabs defaultValue={defaultTab} className="w-full">
          <div className="border-b bg-muted/40 px-4 py-2.5 flex items-center justify-between">
            <TabsList className="bg-background/80 border p-1 h-9">
              {hasBand80 && (
                <TabsTrigger
                  value="band80"
                  className="text-xs font-bold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Band 8.0+ Advanced Sample
                </TabsTrigger>
              )}
              {hasBand75 && (
                <TabsTrigger
                  value="band75"
                  className="text-xs font-bold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Band 7.5+ Model Sample
                </TabsTrigger>
              )}
            </TabsList>

            <span className="hidden sm:inline-block text-[11px] text-muted-foreground font-medium">
              Chuẩn hóa bởi ARIS Academic Board
            </span>
          </div>

          {hasBand80 && (
            <TabsContent value="band80" className="p-5 sm:p-6 mt-0">
              <div
                className="prose prose-slate dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed space-y-3"
                dangerouslySetInnerHTML={{ __html: cleanBand80 }}
              />
            </TabsContent>
          )}

          {hasBand75 && (
            <TabsContent value="band75" className="p-5 sm:p-6 mt-0">
              <div
                className="prose prose-slate dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed space-y-3"
                dangerouslySetInnerHTML={{ __html: cleanBand75 }}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};
