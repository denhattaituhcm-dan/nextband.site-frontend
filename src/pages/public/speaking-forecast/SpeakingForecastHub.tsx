import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  forecastService,
  Season,
  ForecastTopic,
  formatSeasonSlug,
} from '@/services/forecast';
import { ForecastSEO } from '@/components/public/speaking-forecast/ForecastSEO';
import { SeasonTopicCard } from '@/components/public/speaking-forecast/SeasonTopicCard';
import { SoftConversionCTA } from '@/components/public/speaking-forecast/SoftConversionCTA';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar,
  ArrowRight,
  BookOpen,
  Award,
  Layers,
  CheckCircle2,
  TrendingUp,
  Clock,
  Mic,
  ShieldCheck,
  Flame,
  Radio,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SpeakingForecastHub() {
  const [latestSeason, setLatestSeason] = useState<Season | null>(null);
  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [allTopics, setAllTopics] = useState<ForecastTopic[]>([]);
  const [activePartFilter, setActivePartFilter] = useState<'all' | 'Part 1' | 'Part 2' | 'Part 3'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [latest, seasons] = await Promise.all([
          forecastService.getLatestSeason(),
          forecastService.getSeasons(),
        ]);
        setLatestSeason(latest);
        setAllSeasons(seasons);

        if (latest) {
          const latestSlug = formatSeasonSlug(latest.year, latest.quarter);
          const topics = await forecastService.getTopics(latestSlug);
          setAllTopics(topics);
        }
      } catch (err) {
        console.error('Failed to load forecast hub data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const latestSeasonSlug = latestSeason
    ? formatSeasonSlug(latestSeason.year, latestSeason.quarter)
    : 'q2-2026';

  const filteredTopics = allTopics.filter((t) => {
    if (activePartFilter === 'all') return true;
    return t.part === activePartFilter;
  });

  const partCounts = {
    all: allTopics.length,
    part1: allTopics.filter((t) => t.part === 'Part 1').length,
    part2: allTopics.filter((t) => t.part === 'Part 2').length,
    part3: allTopics.filter((t) => t.part === 'Part 3').length,
  };

  return (
    <div className="flex flex-col w-full">
      <ForecastSEO
        title="IELTS Speaking Forecast Mới Nhất Theo Quý — ARIS Academic"
        description="Trọn bộ đề dự đoán IELTS Speaking Forecast mới nhất cập nhật theo 3 quý trong năm. Tổng hợp câu hỏi Part 1, 2, 3 kèm bài mẫu Band 8.0+ và từ vựng trọng tâm."
        canonicalUrl="https://nextband.site/ielts-speaking-forecast"
        breadcrumbs={[
          { name: 'Trang chủ', url: 'https://nextband.site' },
          { name: 'Speaking Forecast', url: 'https://nextband.site/ielts-speaking-forecast' },
        ]}
      />

      {/* ============================================================ */}
      {/* 1. HERO SECTION (NỀN TỐI SÂU THẲM + RADAR STATS CARD)       */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-[#0c1e38] text-white pt-14 pb-20 sm:pt-20 sm:pb-28 border-b border-slate-800">
        {/* Subtle grid background overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Headlines & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-primary border border-white/15 text-xs font-black uppercase tracking-wider backdrop-blur-xs">
                <Mic className="h-3.5 w-3.5 text-primary" />
                <span>IELTS Speaking Forecast Hub</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-white">
                Bộ Đề Dự Đoán Speaking Mới Nhất Theo Chu Kỳ 3 Quý
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
                Hệ thống cập nhật đề thi IELTS Speaking thực tế tại Việt Nam theo chu kỳ đổi đề của IDP &amp; BC. Trang bị dàn ý logic, bảng từ vựng học thuật và câu trả lời mẫu Band 8.0+ chuẩn hóa bởi ARIS.
              </p>

              {latestSeason && (
                <div className="pt-3 flex flex-wrap items-center gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white font-extrabold text-sm sm:text-base px-7 h-13 shadow-lg gap-2.5 rounded-xl"
                  >
                    <Link to={`/ielts-speaking-forecast/${latestSeasonSlug}`}>
                      <span>Vào Bộ Đề {latestSeason.name}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-slate-700 bg-white/5 text-white hover:bg-white/15 font-bold text-sm sm:text-base px-6 h-13 rounded-xl"
                  >
                    <Link to="/assessment">
                      <span>Đánh giá năng lực phát âm</span>
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Right Column: Live Forecast Radar Box */}
            <div className="lg:col-span-5">
              <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Live Status: {latestSeason?.name || 'Q3 / 2026'}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 font-medium">
                    IDP &amp; BC Verified
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <div className="text-[11px] text-slate-400 font-medium">Cơ cấu đề thi</div>
                    <div className="text-sm sm:text-base font-extrabold text-white mt-1">
                      50% Đề mới
                    </div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">+ 50% Giữ lại</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <div className="text-[11px] text-slate-400 font-medium">Tiến độ cập nhật</div>
                    <div className="text-sm sm:text-base font-extrabold text-white mt-1">
                      {partCounts.all} Chủ đề
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Đầy đủ Part 1, 2, 3</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>Chu kỳ áp dụng: <strong>Tháng 5 – Tháng 8</strong></span>
                  </div>
                  <Link
                    to={`/ielts-speaking-forecast/${latestSeasonSlug}`}
                    className="font-bold text-primary hover:underline"
                  >
                    Xem ngay &rsaquo;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. ACTIVE SEASON SHOWCASE (NỀN SÁNG VỚI TAB LỌC NHANH)       */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-20 bg-background border-b border-border/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/70 pb-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider border border-emerald-200">
                <Flame className="h-3.5 w-3.5 text-emerald-600" />
                Mùa thi hiện tại: {latestSeason?.name}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Danh sách chủ đề Speaking {latestSeason?.name}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Được cập nhật cuốn chiếu liên tục từ các phòng thi thực tế tại Hà Nội, TP.HCM và Đà Nẵng.
              </p>
            </div>

            <Button asChild className="font-bold gap-2 self-start md:self-auto h-11 px-5 rounded-xl shadow-xs">
              <Link to={`/ielts-speaking-forecast/${latestSeasonSlug}`}>
                <span>Vào trang tổng quan {latestSeason?.name}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Inline Part Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: 'Tất cả Part', value: 'all', count: partCounts.all },
              { label: 'Part 1 (Short Q&A)', value: 'Part 1', count: partCounts.part1 },
              { label: 'Part 2 (Cue Card)', value: 'Part 2', count: partCounts.part2 },
              { label: 'Part 3 (Discussion)', value: 'Part 3', count: partCounts.part3 },
            ].map((tab) => {
              const active = activePartFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActivePartFilter(tab.value as any)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer',
                    active
                      ? 'bg-slate-900 text-white shadow-sm font-extrabold'
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full font-extrabold',
                      active ? 'bg-white/20 text-white' : 'bg-background text-muted-foreground'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTopics.map((topic) => (
              <SeasonTopicCard
                key={topic.id}
                topic={topic}
                seasonSlug={latestSeasonSlug}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. INFOGRAPHIC SECTION: QUY LUẬT 3 CHU KỲ (NỀN DARK SLATE)  */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-24 bg-[#0a1424] text-white border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Section Heading */}
          <div className="max-w-3xl space-y-3 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/10 text-primary text-xs font-black uppercase tracking-wider border border-white/15">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              Khảo Thí Học Thuật
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              Quy luật đổi đề 3 mùa trong năm của IDP &amp; British Council
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Đề thi IELTS Speaking không thay đổi ngẫu nhiên mà vận hành theo chu kỳ 4 tháng một lần. Việc nắm vững quy luật giúp người học đón đầu các chủ đề mới và phân bổ thời gian luyện tập hiệu quả.
            </p>
          </div>

          {/* 3 Seasons Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Season 1 */}
            <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-primary">01</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  Tháng 1 – Tháng 4
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">Quý 1 (Season 1)</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Đỉnh sóng đầu năm. Giữ lại 50% các chủ đề từ Quý 3 năm trước, đồng thời bổ sung 50% chủ đề hoàn toàn mới bắt đầu từ đầu tháng 1.
              </p>
            </div>

            {/* Season 2 (Active) */}
            <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-primary/40 space-y-4 shadow-lg shadow-primary/5">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-primary">02</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-primary/20 text-primary border border-primary/30">
                  Tháng 5 – Tháng 8
                </span>
              </div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Quý 2 (Season 2)</span>
                <span className="text-[10px] font-extrabold uppercase bg-emerald-500 text-white px-2 py-0.5 rounded">
                  Đang diễn ra
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Đỉnh sóng giữa năm. Giữ lại 50% chủ đề của Quý 1 và cập nhật 50% bộ đề mới từ đầu tháng 5, phục vụ giai đoạn thi mùa hè.
              </p>
            </div>

            {/* Season 3 */}
            <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-primary">03</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  Tháng 9 – Tháng 12
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">Quý 3 (Season 3)</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Mùa cao điểm nộp hồ sơ du học và xét tuyển đại học. Giữ lại 50% chủ đề từ Quý 2 và xuất hiện 50% đề mới từ tháng 9.
              </p>
            </div>
          </div>

          {/* ARIS Core Principle Box */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" />
                <span>Nguyên tắc học tập cốt lõi tại ARIS</span>
              </div>
              <h4 className="text-lg sm:text-xl font-black text-white">
                Dùng Forecast để luyện tư duy mạch lạc, không học vẹt
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Giám khảo IELTS được đào tạo bài bản để phát hiện câu trả lời học thuộc lòng. Học viên ARIS sử dụng Forecast để chuẩn bị ý tưởng logic và từ vựng chuyên sâu, sau đó diễn đạt bằng phản xạ tự nhiên.
              </p>
            </div>

            <Button asChild className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-6 rounded-xl shrink-0">
              <Link to="/assessment">
                <span>Kiểm tra phản xạ Speaking</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. SEASON ARCHIVE LIST (NỀN XÁM NHẸ MỀM MẠI)                 */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-20 bg-slate-50 border-b border-border/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="space-y-1.5 text-left">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Tra cứu &amp; Lịch sử
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              Kho Lưu Trữ Bộ Đề Speaking Các Quý
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Xem lại các chủ đề và bài mẫu từ các mùa thi trước đó để mở rộng ngân hàng từ vựng.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {allSeasons.map((season) => {
              const slug = formatSeasonSlug(season.year, season.quarter);
              return (
                <Link
                  key={season.id}
                  to={`/ielts-speaking-forecast/${slug}`}
                  className={cn(
                    'p-5 rounded-2xl bg-white border transition-all duration-200 flex flex-col justify-between space-y-4 group shadow-2xs hover:shadow-md hover:-translate-y-1',
                    season.isCurrent
                      ? 'border-primary/40 ring-2 ring-primary/10'
                      : 'border-border/80 hover:border-primary/30'
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Năm {season.year}
                      </span>
                      {season.isCurrent && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          Mùa hiện tại
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-extrabold text-foreground group-hover:text-primary transition-colors">
                      Speaking Forecast {season.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {season.quarter === 1
                        ? 'Giai đoạn Tháng 1 – Tháng 4'
                        : season.quarter === 2
                        ? 'Giai đoạn Tháng 5 – Tháng 8'
                        : 'Giai đoạn Tháng 9 – Tháng 12'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-bold text-primary">
                    <span>Xem toàn bộ chủ đề</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. SOFT CONVERSION CTA                                       */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SoftConversionCTA seasonName={latestSeason?.name} />
        </div>
      </section>
    </div>
  );
}
