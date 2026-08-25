import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HuanCoState } from "@/lib/huanCoState";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, X, BookOpen, AlertTriangle } from "lucide-react";

interface HuanCoMascotProps {
  state: HuanCoState;
  className?: string;
}

export function HuanCoMascot({ state, className = "" }: HuanCoMascotProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const isUrgent = state.urgency === "RED" || state.urgency === "ORANGE" || state.urgency === "YELLOW";

  const handleCtaClick = () => {
    if (state.ctaPath) {
      setIsOpen(false);
      navigate(state.ctaPath);
    }
  };

  return (
    <div className={`fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 select-none ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="group relative flex items-center justify-center p-0.5 rounded-full transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-hidden"
            aria-label="Mở bảng chỉ dẫn của Huyền Cơ Lão Nhân"
          >
            {/* Urgency Ambient Glow for High Priority */}
            {isUrgent && (
              <span className={`absolute -inset-1 rounded-full animate-ping opacity-25 ${state.dotColorClass}`} />
            )}

            {/* Mascot Circular Avatar */}
            <div
              className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shadow-lg border-2 bg-card transition-all ${state.ringColorClass}`}
            >
              <img
                src="/mascot/Huyenco.png"
                alt="Huyền Cơ Lão Nhân"
                className="w-full h-full object-cover pointer-events-none"
                loading="eager"
              />
            </div>

            {/* Notification Dot */}
            <span
              className={`absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background shadow-xs ${state.dotColorClass}`}
            />

            {/* Quick Teaser Label on Desktop Hover */}
            <div className="hidden sm:group-hover:flex absolute right-full mr-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-card/95 border border-border shadow-md text-xs font-semibold text-foreground whitespace-nowrap items-center gap-1.5 backdrop-blur-xs pointer-events-none animate-in fade-in zoom-in-95">
              <span>Huyền Cơ Lão Nhân</span>
              <span className={`w-2 h-2 rounded-full ${state.dotColorClass}`} />
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          side="top"
          align="end"
          sideOffset={12}
          className="w-[calc(100vw-2.5rem)] sm:w-96 p-0 rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-border/80 shadow-2xs shrink-0">
                <img
                  src="/mascot/Huyenco.png"
                  alt="Huyền Cơ"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-xs text-foreground tracking-tight">
                    Huyền Cơ Lão Nhân
                  </h3>
                  <Badge
                    variant="outline"
                    className={`text-[10px] h-4 px-1.5 font-bold uppercase ${
                      state.urgency === "RED"
                        ? "bg-rose-500/10 text-rose-600 border-rose-300"
                        : state.urgency === "ORANGE"
                        ? "bg-amber-500/10 text-amber-600 border-amber-300"
                        : state.urgency === "YELLOW"
                        ? "bg-amber-400/15 text-amber-700 border-amber-300"
                        : state.urgency === "GREEN"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-300"
                        : "bg-primary/10 text-primary border-primary/20"
                    }`}
                  >
                    {state.badgeText}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Chỉ Dẫn Tu Luyện
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Đóng bảng chỉ dẫn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 space-y-3.5">
            {/* Quote with Mascot Voice */}
            <div className="relative p-3 rounded-xl bg-primary-soft/40 border border-primary/15 text-foreground space-y-1">
              <span className="text-xs font-serif italic leading-relaxed block text-foreground/90">
                “{state.quote}”
              </span>
            </div>

            {/* Concrete Action Card */}
            <div className="p-3 rounded-xl bg-card border border-border/70 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                {isUrgent ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                )}
                <span>Mục tiêu hiện tại</span>
              </div>
              <p className="text-xs font-semibold text-foreground leading-snug">
                {state.advice}
              </p>
            </div>

            {/* Single Clear CTA Button */}
            {state.ctaLabel && state.ctaPath && (
              <Button
                onClick={handleCtaClick}
                className={`w-full font-bold text-xs h-9 rounded-xl gap-2 shadow-xs transition-all ${
                  state.urgency === "RED"
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : state.urgency === "ORANGE"
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : ""
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="truncate">{state.ctaLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
