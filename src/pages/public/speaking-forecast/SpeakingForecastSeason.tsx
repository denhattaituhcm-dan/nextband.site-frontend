import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  forecastService,
  Season,
  ForecastTopic,
  formatSeasonSlug,
} from '@/services/forecast';
import { ForecastSEO } from '@/components/public/speaking-forecast/ForecastSEO';
import { SeasonTopicCard } from '@/components/public/speaking-forecast/SeasonTopicCard';
import { SpeakingForecastTOC } from '@/components/public/speaking-forecast/SpeakingForecastTOC';
import { SoftConversionCTA } from '@/components/public/speaking-forecast/SoftConversionCTA';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Calendar,
  HelpCircle,
  ArrowLeft,
  BookOpen,
  X,
  Mic,
  MessageSquareText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SpeakingForecastSeason() {
  const { seasonSlug } = useParams<{ seasonSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [season, setSeason] = useState<Season | null>(null);
  const [topics, setTopics] = useState<ForecastTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [partFilter, setPartFilter] = useState('all');

  const hasQueryParams = searchParams.toString().length > 0;

  useEffect(() => {
    async function loadSeasonData() {
      if (!seasonSlug) return;
      setIsLoading(true);
      try {
        const foundSeason = await forecastService.getSeason(seasonSlug);
        setSeason(foundSeason);

        const loadedTopics = await forecastService.getTopics(seasonSlug);
        setTopics(loadedTopics);
      } catch (err) {
        console.error('Failed to load season topics', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSeasonData();
  }, [seasonSlug]);

  // Distance-to-Offset Scrollspy Algorithm
  useEffect(() => {
    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const offset = 150;
        const cardElements = document.querySelectorAll<HTMLElement>('[id^="topic-"]');
        let closestId: string | null = null;

        for (let i = 0; i < cardElements.length; i++) {
          const el = cardElements[i];
          const rect = el.getBoundingClientRect();
          if (rect.top <= offset) {
            closestId = el.id.replace('topic-', '');
          } else {
            break;
          }
        }

        if (closestId) {
          setActiveTopicId(closestId);
        }
        rafId = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [topics]);

  // Filter topics
  const filteredTopics = useMemo(() => {
    return topics.filter((t) => {
      // Part filter
      if (partFilter !== 'all' && t.part !== partFilter) return false;

      // Type filter
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;

      // Search filter
      if (searchInput.trim()) {
        const q = searchInput.toLowerCase();
        const matchName = t.topicName.toLowerCase().includes(q);
        const matchCat = t.category?.toLowerCase().includes(q);
        const matchPrompt = t.cueCardPrompt?.toLowerCase().includes(q);
        const matchQ = t.questions?.some((item) => item.toLowerCase().includes(q));
        const matchP3 = t.part3Questions?.some((item) => item.toLowerCase().includes(q));
        if (!matchName && !matchCat && !matchPrompt && !matchQ && !matchP3) {
          return false;
        }
      }

      return true;
    });
  }, [topics, partFilter, typeFilter, searchInput]);

  // Group filtered topics by part for single-page long scroll
  const part1List = useMemo(
    () => filteredTopics.filter((t) => t.part === 'Part 1'),
    [filteredTopics]
  );
  const part2List = useMemo(
    () => filteredTopics.filter((t) => t.part === 'Part 2'),
    [filteredTopics]
  );

  const handleJumpToTopic = (topicId: string) => {
    const el = document.getElementById(`topic-${topicId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveTopicId(topicId);
    }
  };

  const handleJumpToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!season && !isLoading) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 border rounded-2xl bg-card text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">Không tìm thấy mùa đề thi</h2>
        <p className="text-xs text-muted-foreground">
          Mùa dự đoán đề Speaking bạn đang tìm kiếm không tồn tại hoặc đã được cập nhật.
        </p>
        <Button onClick={() => navigate('/ielts-speaking-forecast')}>
          Quay lại Speaking Forecast Hub
        </Button>
      </div>
    );
  }

  const seasonName = season?.name || seasonSlug?.toUpperCase() || 'Forecast';
  const canonicalUrl = `https://nextband.site/ielts-speaking-forecast/${seasonSlug}`;

  return (
    <div className="space-y-8 pb-16">
      <ForecastSEO
        title={`IELTS Speaking Forecast ${seasonName} Mới Nhất [Full Part 1, 2, 3]`}
        description={`Trọn bộ dự đoán đề thi IELTS Speaking Forecast ${seasonName} cập nhật liên tục. Đầy đủ câu hỏi Part 1, Part 2 & 3 kèm từ vựng Collocations và bài mẫu Band 8.0+.`}
        canonicalUrl={canonicalUrl}
        noIndex={hasQueryParams}
        breadcrumbs={[
          { name: 'Trang chủ', url: 'https://nextband.site' },
          { name: 'Speaking Forecast', url: 'https://nextband.site/ielts-speaking-forecast' },
          { name: seasonName, url: canonicalUrl },
        ]}
      />

      {/* HEADER & BREADCRUMBS */}
      <section className="bg-muted/30 border-b py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
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
            <span className="text-foreground font-semibold">{seasonName}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                  <Calendar className="h-3.5 w-3.5" />
                  Mùa thi: {seasonName}
                </span>
                {season?.isCurrent && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Đang áp dụng
                  </span>
                )}
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {topics.length} Chủ đề
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
                IELTS Speaking Forecast {seasonName}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="sm" className="text-xs font-semibold gap-1.5">
                <Link to="/ielts-speaking-forecast">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Tất cả các Quý</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* EDITORIAL OVERVIEW (SEO BLOCK) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-7 rounded-2xl border bg-card/60 space-y-3">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Tổng quan bộ đề Speaking {seasonName}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Bộ đề <strong>IELTS Speaking Forecast {seasonName}</strong> tổng hợp trọn bộ <strong>{topics.length} chủ đề</strong> (Part 1, Part 2 &amp; Part 3) đang xuất hiện trong phòng thi thực tế tại IDP và British Council Việt Nam. Khoảng 50% số chủ đề là các đề giữ lại từ quý liền kề trước đó, và 50% là các chủ đề mới xuất hiện (được gắn nhãn <em>Đề mới</em>).
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Mỗi chủ đề đều được trang bị đầy đủ câu hỏi, gợi ý dàn ý ý tưởng (Brainstorming) và bài mẫu tham khảo giúp học viên chuẩn bị phản xạ tự tin, mạch lạc trước khi bước vào phòng thi thật.
          </p>
        </div>
      </section>

      {/* TOOLBAR: SECTION JUMP SHORTCUTS & FILTERS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-muted/40 border">
          {/* Quick Section Shortcuts */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleJumpToSection('section-part-1')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Mic className="h-3.5 w-3.5" />
              <span>Part 1 ({part1List.length})</span>
            </button>

            <button
              onClick={() => handleJumpToSection('section-part-2')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquareText className="h-3.5 w-3.5" />
              <span>Part 2 &amp; 3 ({part2List.length})</span>
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm tên đề, từ khóa..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8.5 h-8.5 text-xs bg-background"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8.5 text-xs w-[120px] bg-background">
                <SelectValue placeholder="Loại đề" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại đề</SelectItem>
                <SelectItem value="New">Đề mới</SelectItem>
                <SelectItem value="Retained">Đề giữ lại</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* MAIN TWO-COLUMN LAYOUT: CONTENT + STICKY TOC */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* LEFT MAIN COLUMN: SINGLE-PAGE LONG SCROLL */}
          <main className="flex-1 w-full min-w-0 space-y-12">
            {filteredTopics.length === 0 ? (
              <div className="p-12 border border-dashed rounded-2xl text-center space-y-3 bg-muted/20">
                <HelpCircle className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                <p className="text-sm font-semibold text-foreground">
                  Không tìm thấy chủ đề phù hợp
                </p>
                <p className="text-xs text-muted-foreground">
                  Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.
                </p>
              </div>
            ) : (
              <>
                {/* SECTION 1: PART 1 TOPICS */}
                {part1List.length > 0 && (
                  <section id="section-part-1" className="space-y-5 scroll-mt-24">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          P1
                        </div>
                        <div>
                          <h2 className="text-xl font-extrabold text-foreground tracking-tight">
                            Forecast Speaking Part 1
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            Các câu hỏi phỏng vấn ngắn mở đầu ({part1List.length} chủ đề)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {part1List.map((topic) => (
                        <SeasonTopicCard
                          key={topic.id}
                          topic={topic}
                          seasonSlug={seasonSlug || 'q2-2026'}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* SECTION 2: PART 2 & PART 3 TOPICS */}
                {part2List.length > 0 && (
                  <section id="section-part-2" className="space-y-5 scroll-mt-24">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                          P2
                        </div>
                        <div>
                          <h2 className="text-xl font-extrabold text-foreground tracking-tight">
                            Forecast Speaking Part 2 &amp; Part 3
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            Đề bài Cue Card 2 phút kèm câu hỏi thảo luận mở rộng ({part2List.length} chủ đề)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {part2List.map((topic) => (
                        <SeasonTopicCard
                          key={topic.id}
                          topic={topic}
                          seasonSlug={seasonSlug || 'q2-2026'}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </main>

          {/* RIGHT COLUMN: FLOATING STICKY TABLE OF CONTENTS */}
          <SpeakingForecastTOC
            topics={filteredTopics}
            activeTopicId={activeTopicId}
            onTopicClick={handleJumpToTopic}
          />
        </div>
      </section>

      {/* SOFT CONVERSION CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        <SoftConversionCTA seasonName={seasonName} />
      </section>
    </div>
  );
}
