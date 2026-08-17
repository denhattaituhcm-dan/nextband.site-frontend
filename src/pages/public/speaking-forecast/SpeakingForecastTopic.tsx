import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  forecastService,
  Season,
  ForecastTopic,
  formatSeasonSlug,
} from '@/services/forecast';
import { ForecastSEO } from '@/components/public/speaking-forecast/ForecastSEO';
import { KeyVocabularyTable } from '@/components/public/speaking-forecast/KeyVocabularyTable';
import { SampleAnswerTabs } from '@/components/public/speaking-forecast/SampleAnswerTabs';
import { SoftConversionCTA } from '@/components/public/speaking-forecast/SoftConversionCTA';
import { RelatedTopics } from '@/components/public/speaking-forecast/RelatedTopics';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Sparkles,
  ArrowLeft,
  Lightbulb,
  HelpCircle,
  Clock,
  Layers,
  CheckCircle2,
  FileQuestion,
} from 'lucide-react';

export default function SpeakingForecastTopic() {
  const { seasonSlug, topicSlug } = useParams<{ seasonSlug: string; topicSlug: string }>();
  const navigate = useNavigate();

  const [season, setSeason] = useState<Season | null>(null);
  const [topic, setTopic] = useState<ForecastTopic | null>(null);
  const [relatedTopics, setRelatedTopics] = useState<ForecastTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTopicData() {
      if (!seasonSlug || !topicSlug) return;
      setIsLoading(true);
      try {
        const foundSeason = await forecastService.getSeason(seasonSlug);
        setSeason(foundSeason);

        const foundTopic = await forecastService.getTopic(seasonSlug, topicSlug);
        setTopic(foundTopic);

        if (foundTopic) {
          const related = await forecastService.getRelatedTopics(foundTopic, 3);
          setRelatedTopics(related);
        }
      } catch (err) {
        console.error('Failed to load forecast topic', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadTopicData();
  }, [seasonSlug, topicSlug]);

  if (!topic && !isLoading) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 border rounded-2xl bg-card text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">Không tìm thấy chủ đề đề thi</h2>
        <p className="text-xs text-muted-foreground">
          Chủ đề bạn đang tìm kiếm có thể đã được cập nhật hoặc không nằm trong mùa thi này.
        </p>
        <Button onClick={() => navigate(`/ielts-speaking-forecast/${seasonSlug || ''}`)}>
          Quay lại danh sách chủ đề {season?.name || ''}
        </Button>
      </div>
    );
  }

  const seasonName = season?.name || seasonSlug?.toUpperCase() || 'Forecast';
  const canonicalUrl = `https://nextband.site/ielts-speaking-forecast/${seasonSlug}/${topicSlug}`;

  const getPartBadge = (part?: string) => {
    switch (part) {
      case 'Part 1':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Part 1 (Short Q&amp;A)
          </span>
        );
      case 'Part 2':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            Part 2 (Cue Card)
          </span>
        );
      case 'Part 3':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Part 3 (Discussion)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {topic && (
        <ForecastSEO
          title={
            topic.seoTitle ||
            `IELTS Speaking Forecast ${seasonName} - ${topic.topicName} [Sample Band 8.0 & Vocab]`
          }
          description={
            topic.metaDescription ||
            `Trọn bộ câu hỏi và bài mẫu IELTS Speaking ${topic.part} chủ đề "${topic.topicName}" trong Forecast ${seasonName} kèm từ vựng Collocations ăn điểm.`
          }
          canonicalUrl={canonicalUrl}
          breadcrumbs={[
            { name: 'Trang chủ', url: 'https://nextband.site' },
            { name: 'Speaking Forecast', url: 'https://nextband.site/ielts-speaking-forecast' },
            { name: seasonName, url: `https://nextband.site/ielts-speaking-forecast/${seasonSlug}` },
            { name: topic.topicName, url: canonicalUrl },
          ]}
          article={{
            headline: topic.topicName,
            dateModified: topic.updatedAt,
            authorName: 'ARIS Academic Board',
          }}
        />
      )}

      {/* HEADER & BREADCRUMBS */}
      <section className="bg-muted/30 border-b py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground font-medium">
            <Link to="/" className="hover:text-foreground transition-colors">
              Trang chủ
            </Link>
            <span>&rsaquo;</span>
            <Link
              to="/ielts-speaking-forecast"
              className="hover:text-foreground transition-colors"
            >
              Speaking Forecast
            </Link>
            <span>&rsaquo;</span>
            <Link
              to={`/ielts-speaking-forecast/${seasonSlug}`}
              className="hover:text-foreground transition-colors"
            >
              {seasonName}
            </Link>
            <span>&rsaquo;</span>
            <span className="text-foreground font-semibold truncate max-w-[200px]">
              {topic?.topicName}
            </span>
          </nav>

          {/* Badges & Meta Row */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {getPartBadge(topic?.part)}
              {topic?.type === 'New' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="h-3 w-3 text-emerald-600" />
                  ✨ Đề mới xuất hiện
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  🔄 Đề giữ lại từ quý trước
                </span>
              )}
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                Chủ đề: {topic?.category || 'General'}
              </span>
            </div>

            {/* H1 Topic Name */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              {topic?.topicName}
            </h1>

            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Mùa thi: <strong className="text-foreground">{seasonName}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Cập nhật gần nhất: <strong className="text-foreground">{topic?.updatedAt}</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN TOPIC CONTENT FLOW */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-10">
        {/* SECTION 1: QUESTION BOX */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600">
              <FileQuestion className="h-4 w-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              Đề bài chi tiết ({topic?.part})
            </h2>
          </div>

          <Card className="border border-border/80 bg-card overflow-hidden shadow-xs">
            <CardContent className="p-5 sm:p-6 space-y-4">
              {topic?.part === 'Part 2' ? (
                <div className="space-y-4">
                  {topic.cueCardPrompt && (
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/15">
                      <p className="text-base sm:text-lg font-bold text-foreground leading-snug">
                        {topic.cueCardPrompt}
                      </p>
                    </div>
                  )}

                  {topic.cueCardBulletPoints && topic.cueCardBulletPoints.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                        You should say:
                      </span>
                      <ul className="space-y-2 text-sm text-foreground/90 pl-1">
                        {topic.cueCardBulletPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <span className="text-primary font-bold mt-0.5">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {topic?.questions && topic.questions.length > 0 ? (
                    topic.questions.map((q, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3.5 rounded-lg bg-muted/30 border border-border/50 text-sm font-medium text-foreground"
                      >
                        <span className="text-xs font-extrabold text-primary px-2 py-0.5 rounded bg-primary/10 shrink-0 mt-0.5">
                          Q{idx + 1}
                        </span>
                        <span className="leading-relaxed">{q}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Danh sách câu hỏi đang được cập nhật thêm.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* SECTION 2: QUICK IDEAS & MINDMAP */}
        {topic?.ideas && topic.ideas.trim() && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600">
                <Lightbulb className="h-4 w-4" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                Gợi ý dàn ý &amp; Ý tưởng trả lời (Quick Ideas)
              </h3>
            </div>

            <Card className="border border-border/80 bg-amber-500/5">
              <CardContent className="p-5 sm:p-6">
                <div className="text-xs sm:text-sm text-foreground/90 whitespace-pre-line leading-relaxed font-sans">
                  {topic.ideas}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* SECTION 3: KEY VOCABULARY & COLLOCATIONS */}
        {topic?.keyVocabulary && topic.keyVocabulary.length > 0 && (
          <section>
            <KeyVocabularyTable vocabulary={topic.keyVocabulary} />
          </section>
        )}

        {/* SECTION 4: SAMPLE ANSWERS (BAND 7.5+ & 8.0+) */}
        {topic?.sampleAnswers && (
          <section>
            <SampleAnswerTabs sampleAnswers={topic.sampleAnswers} />
          </section>
        )}

        {/* SECTION 5: SOFT CONVERSION CTA */}
        <section className="pt-2">
          <SoftConversionCTA
            seasonName={seasonName}
            topicName={topic?.topicName}
          />
        </section>

        {/* SECTION 6: RELATED TOPICS */}
        {relatedTopics.length > 0 && (
          <section className="pt-4 border-t border-border/80">
            <RelatedTopics
              topics={relatedTopics}
              seasonSlug={seasonSlug || 'q3-2026'}
            />
          </section>
        )}
      </div>
    </div>
  );
}
