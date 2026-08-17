import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  forecastService,
  Season,
  ForecastTopic,
  formatSeasonSlug,
} from '@/services/forecast';
import { ForecastSEO } from '@/components/public/speaking-forecast/ForecastSEO';
import { SeasonTopicCard } from '@/components/public/speaking-forecast/SeasonTopicCard';
import { PartFilterTabs } from '@/components/public/speaking-forecast/PartFilterTabs';
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
  Sparkles,
  Layers,
  HelpCircle,
  ArrowLeft,
  BookOpen,
  Filter,
  X,
} from 'lucide-react';

export default function SpeakingForecastSeason() {
  const { seasonSlug } = useParams<{ seasonSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [season, setSeason] = useState<Season | null>(null);
  const [topics, setTopics] = useState<ForecastTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const currentPartParam = searchParams.get('part');
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

  const activePart =
    currentPartParam === '1'
      ? 'Part 1'
      : currentPartParam === '2'
      ? 'Part 2'
      : currentPartParam === '3'
      ? 'Part 3'
      : 'all';

  // Topic counts by Part
  const counts = {
    all: topics.length,
    part1: topics.filter((t) => t.part === 'Part 1').length,
    part2: topics.filter((t) => t.part === 'Part 2').length,
    part3: topics.filter((t) => t.part === 'Part 3').length,
  };

  // Filter topics
  const filteredTopics = topics.filter((t) => {
    // Part filter
    if (activePart !== 'all' && t.part !== activePart) return false;

    // Type filter
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;

    // Search filter
    if (searchInput.trim()) {
      const q = searchInput.toLowerCase();
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
    <div className="space-y-10 pb-16">
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
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
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

      {/* EDITORIAL OVERVIEW (150-300 words SEO block) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-7 rounded-2xl border bg-card/60 space-y-3">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Tổng quan bộ đề Speaking {seasonName}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Bộ đề <strong>IELTS Speaking Forecast {seasonName}</strong> tổng hợp toàn bộ các chủ đề Part 1, Part 2 và Part 3 đang xuất hiện trong phòng thi thực tế tại IDP và British Council Việt Nam. Khoảng 50% số chủ đề là các đề giữ lại từ quý liền kề trước đó, và 50% là các chủ đề mới xuất hiện (được gắn nhãn <em>✨ Đề mới</em>).
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Mỗi chủ đề đều được Ban Chuyên môn ARIS phân tích dàn ý tư duy phản biện, trích xuất bảng từ vựng học thuật (Collocations &amp; Idioms) và xây dựng 2 tầng bài mẫu tham khảo (Band 7.5+ và Band 8.0+) giúp học viên nắm chắc cách triển khai câu trả lời tự nhiên, mạch lạc.
          </p>
        </div>
      </section>

      {/* MAIN TOPIC LISTING & FILTER BAR */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Part Tabs Filter */}
          <PartFilterTabs counts={counts} />

          {/* Search & Type Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px] flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm chủ đề..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8.5 h-9 text-xs"
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
              <SelectTrigger className="h-9 text-xs w-[130px]">
                <SelectValue placeholder="Loại đề" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại đề</SelectItem>
                <SelectItem value="New">✨ Đề mới</SelectItem>
                <SelectItem value="Retained">🔄 Đề giữ lại</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Topics Grid */}
        {filteredTopics.length === 0 ? (
          <div className="p-12 border border-dashed rounded-2xl text-center space-y-3 bg-muted/20">
            <HelpCircle className="h-8 w-8 text-muted-foreground/50 mx-auto" />
            <p className="text-sm font-semibold text-foreground">
              Không tìm thấy chủ đề phù hợp
            </p>
            <p className="text-xs text-muted-foreground">
              Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để hiển thị toàn bộ đề thi.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTopics.map((topic) => (
              <SeasonTopicCard
                key={topic.id}
                topic={topic}
                seasonSlug={seasonSlug || 'q3-2026'}
              />
            ))}
          </div>
        )}
      </section>

      {/* SOFT CONVERSION CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
        <SoftConversionCTA seasonName={seasonName} />
      </section>
    </div>
  );
}
