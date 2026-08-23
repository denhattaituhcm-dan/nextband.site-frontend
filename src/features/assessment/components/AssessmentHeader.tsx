import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ShieldCheck, CheckCircle2, RefreshCw, Send, AlertTriangle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssessmentHeaderProps {
  candidateName: string;
  targetBand: string;
  formattedTime: string;
  isUrgent: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error" | "offline" | "syncing";
  onOpenSubmitDialog: () => void;
  onOpenExitDialog: () => void;
  isSubmitting: boolean;
}

export function AssessmentHeader({
  candidateName,
  targetBand,
  formattedTime,
  isUrgent,
  saveStatus,
  onOpenSubmitDialog,
  onOpenExitDialog,
  isSubmitting,
}: AssessmentHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Branding & Candidate Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-brand-red flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0">
            N
          </div>
          <div className="hidden sm:block min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-foreground truncate">{candidateName}</span>
              <Badge variant="outline" className="text-[10px] bg-brand-red-soft text-brand-red border-brand-red/20 font-bold px-1.5 py-0">
                Mục tiêu: {targetBand}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">ARIS Diagnostic Assessment</p>
          </div>
        </div>

        {/* Center: Countdown Timer */}
        <div
          className={cn(
            "flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all shadow-xs",
            isUrgent
              ? "bg-red-50 dark:bg-red-950/40 border-red-300 text-red-600 animate-pulse font-black"
              : "bg-muted/80 border-border text-foreground font-extrabold",
          )}
        >
          <Clock className={cn("w-4 h-4", isUrgent ? "text-red-600" : "text-brand-blue")} />
          <span className="text-sm font-mono tracking-wider">{formattedTime}</span>
        </div>

        {/* Right: Autosave Status, Exit & Submit Button */}
        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
            {saveStatus === "saving" || saveStatus === "syncing" ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-blue" />
                <span>{saveStatus === "syncing" ? "Đang đồng bộ..." : "Đang lưu nháp..."}</span>
              </>
            ) : saveStatus === "saved" ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Đã lưu nháp</span>
              </>
            ) : saveStatus === "error" || saveStatus === "offline" ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-amber-600 font-medium">Lưu offline</span>
              </>
            ) : null}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onOpenExitDialog}
            className="h-10 px-3 rounded-xl font-bold text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5 transition-colors cursor-pointer border border-border sm:border-transparent"
            title="Thoát và hủy bài làm hiện tại"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thoát bài</span>
          </Button>

          <Button
            onClick={onOpenSubmitDialog}
            disabled={isSubmitting}
            className="h-10 px-4 rounded-xl font-black text-xs bg-brand-red hover:bg-brand-red-hover text-white shadow-md gap-2 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Nộp Bài & Xem Kết Quả</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
