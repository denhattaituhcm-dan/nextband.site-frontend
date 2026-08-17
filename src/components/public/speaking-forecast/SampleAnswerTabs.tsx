import React, { useState } from 'react';
import { SampleAnswers } from '@/services/forecast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Sparkles, CheckCircle2 } from 'lucide-react';
import DOMPurify from 'dompurify';

interface SampleAnswerTabsProps {
  sampleAnswers: SampleAnswers;
}

export const SampleAnswerTabs: React.FC<SampleAnswerTabsProps> = ({ sampleAnswers }) => {
  const sa = sampleAnswers as any;
  const rawBand65 = sa?.band65 ?? (!sa?.band65 && sa?.band80 ? sa?.band75 : '');
  const rawBand75 = sa?.band65 ? sa?.band75 : (sa?.band80 || sa?.band75 || '');

  const hasBand65 = Boolean(rawBand65 && rawBand65.trim());
  const hasBand75 = Boolean(rawBand75 && rawBand75.trim());

  if (!hasBand65 && !hasBand75) return null;

  const defaultTab = hasBand75 ? 'band75' : 'band65';

  const cleanBand65 = DOMPurify.sanitize(rawBand65 || '');
  const cleanBand75 = DOMPurify.sanitize(rawBand75 || '');

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
              {hasBand75 && (
                <TabsTrigger
                  value="band75"
                  className="text-xs font-bold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Band 7.5 ★
                </TabsTrigger>
              )}
              {hasBand65 && (
                <TabsTrigger
                  value="band65"
                  className="text-xs font-bold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Band 6.5
                </TabsTrigger>
              )}
            </TabsList>

            <span className="hidden sm:inline-block text-[11px] text-muted-foreground font-medium">
              Chuẩn hóa bởi ARIS Academic Board
            </span>
          </div>

          {hasBand75 && (
            <TabsContent value="band75" className="p-5 sm:p-6 mt-0">
              <div
                className="prose prose-slate dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed space-y-3"
                dangerouslySetInnerHTML={{ __html: cleanBand75 }}
              />
            </TabsContent>
          )}

          {hasBand65 && (
            <TabsContent value="band65" className="p-5 sm:p-6 mt-0">
              <div
                className="prose prose-slate dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed space-y-3"
                dangerouslySetInnerHTML={{ __html: cleanBand65 }}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};
