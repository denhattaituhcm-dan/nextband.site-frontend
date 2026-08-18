import React, { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Target,
  BarChart3,
  BookOpen,
  Send,
} from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface QuickOption {
  icon: React.ReactNode;
  label: string;
}

export function ConsultationBubble() {
  const { settings } = useSiteSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const zaloUrl = settings?.zaloLink || "https://zalo.me";

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const quickOptions: QuickOption[] = [
    {
      icon: <Target className="w-4 h-4 text-brand-red" />,
      label: "Tư vấn lộ trình IELTS",
    },
    {
      icon: <BarChart3 className="w-4 h-4 text-brand-blue" />,
      label: "Kiểm tra trình độ",
    },
    {
      icon: <BookOpen className="w-4 h-4 text-amber-500" />,
      label: "Tư vấn khóa học",
    },
    {
      icon: <MessageCircle className="w-4 h-4 text-emerald-500" />,
      label: "Chat với ARIS",
    },
  ];

  const handleOptionClick = (_option: QuickOption) => {
    window.open(zaloUrl, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  const handleDirectZaloClick = () => {
    window.open(zaloUrl, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end select-none"
    >
      {/* 3. Click State: Mini-Card Popover */}
      {isOpen && (
        <div className="mb-3 w-72 sm:w-80 rounded-2xl bg-white border border-border/80 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.15)] p-4 animate-in fade-in zoom-in-95 duration-200 origin-bottom-right">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <span className="text-sm font-semibold text-foreground">
              Bạn cần hỗ trợ gì?
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Options List */}
          <div className="py-2.5 space-y-1">
            {quickOptions.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionClick(opt)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs sm:text-sm font-medium text-foreground hover:bg-muted/70 hover:text-primary transition-all duration-150 group"
              >
                <span className="p-1.5 rounded-lg bg-muted/50 group-hover:bg-white group-hover:shadow-2xs transition-all">
                  {opt.icon}
                </span>
                <span className="flex-1">{opt.label}</span>
              </button>
            ))}
          </div>

          {/* Action Button: Nhắn Zalo */}
          <div className="pt-2 border-t border-border/60">
            <button
              onClick={handleDirectZaloClick}
              className="w-full flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white text-xs sm:text-sm font-medium transition-all shadow-xs active:scale-[0.98]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Nhắn qua Zalo</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Pill Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative flex items-center h-11 px-4 sm:px-5 rounded-full bg-brand-red hover:bg-brand-red-hover text-white font-medium text-xs sm:text-sm shadow-[0_4px_20px_rgba(225,29,72,0.35)] transition-all duration-300 ease-out active:scale-95 cursor-pointer"
        aria-expanded={isOpen}
        aria-label="Tư vấn ngay"
      >
        <MessageCircle className="w-4 h-4 mr-2 shrink-0 transition-transform duration-300 group-hover:scale-110" />

        {/* Smooth text transition between Idle and Hover */}
        <span className="whitespace-nowrap overflow-hidden transition-all duration-300">
          {isHovered ? "Tư vấn lộ trình IELTS" : "Tư vấn ngay"}
        </span>
      </button>
    </div>
  );
}
