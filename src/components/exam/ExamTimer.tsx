import { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExamTimerProps {
  duration?: number; // in minutes
  initialSeconds?: number;
  onTimeUp?: () => void;
  size?: 'default' | 'large' | 'small';
}

export function ExamTimer({
  duration = 60,
  initialSeconds,
  onTimeUp,
  size = 'default',
}: ExamTimerProps) {
  const safeDuration = Math.max(60, duration || 60);
  const timeUpTriggeredRef = useRef(false);
  const [timeLeft, setTimeLeft] = useState(
    typeof initialSeconds === "number" && initialSeconds > 0 ? initialSeconds : safeDuration * 60,
  );

  useEffect(() => {
    if (typeof initialSeconds === "number" && initialSeconds > 0) {
      setTimeLeft(initialSeconds);
      timeUpTriggeredRef.current = false;
      return;
    }
    setTimeLeft(safeDuration * 60);
    timeUpTriggeredRef.current = false;
  }, [safeDuration, initialSeconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!timeUpTriggeredRef.current) {
        timeUpTriggeredRef.current = true;
        onTimeUp?.();
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!timeUpTriggeredRef.current) {
            timeUpTriggeredRef.current = true;
            onTimeUp?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTimeUp, timeLeft]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  const formattedTime =
    hours > 0
      ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isLow = timeLeft < 300; // Less than 5 minutes
  const isCritical = timeLeft < 60; // Less than 1 minute

  if (size === 'large') {
    return (
      <div
        title="Thời gian còn lại của bài thi"
        className={cn(
          'flex items-center gap-3 px-4 py-2 rounded-2xl font-mono transition-colors shadow-xs',
          isCritical
            ? 'bg-destructive text-destructive-foreground animate-pulse'
            : isLow
            ? 'bg-destructive/10 text-destructive border border-destructive/20'
            : 'bg-muted/80 text-foreground border border-border/60'
        )}
      >
        <Clock className="h-5 w-5 text-orange-500" />
        <div className="flex flex-col">
          <span className="text-[10px] font-sans font-bold text-muted-foreground uppercase tracking-wider">Thời gian còn lại</span>
          <span className="text-2xl font-extrabold tracking-wider">
            {formattedTime}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      title="Thời gian còn lại của bài thi"
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-2xl transition-colors shadow-2xs',
        isCritical
          ? 'bg-destructive text-destructive-foreground animate-pulse'
          : isLow
          ? 'bg-destructive/10 text-destructive border border-destructive/20'
          : 'bg-muted/70 text-foreground border border-border/50'
      )}
    >
      <Clock className="h-4 w-4 text-orange-500 shrink-0" />
      <span className="hidden sm:inline text-xs text-muted-foreground font-sans font-semibold mr-0.5">Thời gian bài thi:</span>
      <span className="font-mono font-extrabold text-sm tracking-tight">
        {formattedTime}
      </span>
    </div>
  );
}
