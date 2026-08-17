import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, FileDown, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface SoftConversionCTAProps {
  seasonName?: string;
  topicName?: string;
}

export const SoftConversionCTA: React.FC<SoftConversionCTAProps> = ({
  seasonName = 'Quý mới nhất',
  topicName,
}) => {
  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-background overflow-hidden shadow-xs">
      <CardContent className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              Nâng cao năng lực Speaking thực chiến
            </div>
            <h4 className="text-lg sm:text-xl font-bold text-foreground leading-snug">
              Luyện tập phản xạ chủ đề {topicName ? `"${topicName}"` : 'Forecast'} cùng ARIS
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Tránh học vẹt bài mẫu. Rèn luyện tư duy cấu trúc câu và nhận đánh giá lỗi phát âm, từ vựng theo khung 7 cấp bậc ARIS-7.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto shrink-0">
            <Button asChild size="default" className="font-bold gap-2 shadow-xs">
              <Link to="/assessment">
                <GraduationCap className="h-4 w-4" />
                <span>Đánh giá Năng lực Speaking</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>

            <Button asChild variant="outline" size="default" className="font-semibold gap-2 border-border/80">
              <Link to="/courses">
                <span>Xem Lộ trình Khóa học</span>
              </Link>
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Phương pháp đào tạo tư duy học thuật thực chất — Không học tủ mẹo vặt</span>
          </div>

          <span className="text-[11px] font-medium text-slate-500">
            ARIS Academic System • IELTS Speaking Forecast {seasonName}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
