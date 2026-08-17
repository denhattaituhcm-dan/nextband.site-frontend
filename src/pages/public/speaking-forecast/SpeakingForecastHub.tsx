import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  forecastService,
  Season,
  ForecastTopic,
  formatSeasonSlug,
} from '@/services/forecast';
import { ForecastSEO } from '@/components/public/speaking-forecast/ForecastSEO';
import { SeasonTopicCard } from '@/components/public/speaking-forecast/SeasonTopicCard';
import { SoftConversionCTA } from '@/components/public/speaking-forecast/SoftConversionCTA';
import { SectionContainer } from '@/components/public/SectionContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar,
  Sparkles,
  ArrowRight,
  BookOpen,
  Award,
  Layers,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

export default function SpeakingForecastHub() {
  const navigate = useNavigate();
  const [latestSeason, setLatestSeason] = useState<Season | null>(null);
  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [featuredTopics, setFeaturedTopics] = useState<ForecastTopic[]>([]);
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
          setFeaturedTopics(topics.slice(0, 6));
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
    : 'q3-2026';

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      <ForecastSEO
        title="IELTS Speaking Forecast Mới Nhất Theo Quý — ARIS Academic"
        description="Trọn bộ đề dự đoán IELTS Speaking Forecast mới nhất cập nhật theo 3 quý trong năm. Tổng hợp câu hỏi Part 1, 2, 3 kèm bài mẫu Band 8.0+ và từ vựng trọng tâm."
        canonicalUrl="https://nextband.site/ielts-speaking-forecast"
        breadcrumbs={[
          { name: 'Trang chủ', url: 'https://nextband.site' },
          { name: 'Speaking Forecast', url: 'https://nextband.site/ielts-speaking-forecast' },
        ]}
      />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-[#0c1e38] text-white pt-12 pb-16 sm:pt-16 sm:pb-24 border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-primary border border-white/15 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>IELTS Speaking Forecast Hub</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Bộ Đề Dự Đoán Speaking Mới Nhất Theo Chu Kỳ 3 Quý
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Hệ thống cập nhật đề thi IELTS Speaking thực tế tại Việt Nam theo chu kỳ đổi đề của IDP &amp; BC. Trang bị dàn ý logic, bảng từ vựng học thuật và câu trả lời mẫu Band 8.0+ chuẩn hóa bởi ARIS.
            </p>

            {latestSeason && (
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white font-bold text-sm px-6 h-12 shadow-md gap-2"
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
                  className="border-slate-700 bg-white/5 text-white hover:bg-white/15 font-semibold text-sm px-6 h-12"
                >
                  <Link to="/assessment">
                    <span>Đánh giá năng lực phát âm</span>
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ACTIVE SEASON SPOTLIGHT */}
      {latestSeason && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="p-6 sm:p-8 bg-card border rounded-2xl shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Mùa thi hiện tại
                  </span>
                  <span className="text-xs text-muted-foreground">• Cập nhật liên tục</span>
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">
                  IELTS Speaking Forecast {latestSeason.name}
                </h2>
              </div>

              <Button asChild className="font-bold gap-2 self-start sm:self-auto">
                <Link to={`/ielts-speaking-forecast/${latestSeasonSlug}`}>
                  <span>Xem toàn bộ đề {latestSeason.name}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Featured Topics Grid */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Chủ đề tiêu biểu trong mùa này
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {featuredTopics.map((topic) => (
                  <SeasonTopicCard
                    key={topic.id}
                    topic={topic}
                    seasonSlug={latestSeasonSlug}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* HOW FORECAST WORKS EDITORIAL GUIDE */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-foreground">
                Quy luật đổi đề Speaking và Chiến lược luyện thi thực chất
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Kỳ thi IELTS Speaking tại IDP và British Council vận hành theo chu kỳ 4 tháng đổi đề một lần. Việc hiểu đúng quy luật giúp bạn phân bổ thời gian học tập tối ưu:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border bg-card p-4 space-y-2">
                <div className="text-primary font-bold text-base">Quý 1: T1 – T4</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  50% giữ lại từ Quý 3 năm trước + 50% đề mới xuất hiện vào đầu tháng 1.
                </p>
              </Card>

              <Card className="border bg-card p-4 space-y-2">
                <div className="text-primary font-bold text-base">Quý 2: T5 – T8</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  50% giữ lại từ Quý 1 + 50% đề mới xuất hiện vào đầu tháng 5.
                </p>
              </Card>

              <Card className="border bg-card p-4 space-y-2">
                <div className="text-primary font-bold text-base">Quý 3: T9 – T12</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  50% giữ lại từ Quý 2 + 50% đề mới xuất hiện vào đầu tháng 9.
                </p>
              </Card>
            </div>

            <div className="p-5 bg-muted/40 rounded-xl border space-y-2">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Nguyên tắc sử dụng Forecast tại ARIS
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Không học thuộc lòng nguyên văn bài mẫu để tránh bị giám khảo chấm điểm vẹt. Hãy dùng Forecast để làm quen với các chủ đề từ vựng mới, luyện cấu trúc triển khai luận điểm và tăng tốc độ phản xạ tự nhiên.
              </p>
            </div>
          </div>

          {/* ALL SEASONS ARCHIVE LIST */}
          <div className="space-y-4 p-6 bg-card border rounded-xl">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Lưu trữ bộ đề các Quý
            </h3>
            <div className="space-y-2.5">
              {allSeasons.map((season) => {
                const slug = formatSeasonSlug(season.year, season.quarter);
                return (
                  <Link
                    key={season.id}
                    to={`/ielts-speaking-forecast/${slug}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/70 hover:border-primary hover:bg-primary/5 transition-all text-xs font-semibold text-foreground group"
                  >
                    <div className="flex items-center gap-2">
                      <span>Speaking Forecast {season.name}</span>
                      {season.isCurrent && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
                          Active
                        </span>
                      )}
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SOFT CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SoftConversionCTA seasonName={latestSeason?.name} />
      </section>
    </div>
  );
}
