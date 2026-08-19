import React, { useState, useRef, useEffect } from "react";
import { X, Target, BarChart3, BookOpen, Send } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface QuickOption {
  icon: React.ReactNode;
  label: string;
}

function ZaloIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="36" height="36" rx="18" fill="#0068FF" />
      <path
        d="M9 12.2h6.5c.3 0 .5.2.5.5v.4c0 .2-.1.3-.2.5l-4.4 5.7h4.3c.3 0 .5.2.5.5v.5c0 .3-.2.5-.5.5H8.8c-.3 0-.5-.2-.5-.5v-.4c0-.2.1-.3.2-.5l4.4-5.7H9c-.3 0-.5-.2-.5-.5v-.5c0-.3.2-.5.5-.5zm10 3.2c1.6 0 2.8 1.2 2.8 2.8v2.1c0 .3-.2.5-.5.5h-.5c-.3 0-.5-.2-.5-.5v-.5c-.4.7-1.1 1.2-1.9 1.2-1.4 0-2.4-1-2.4-2.4s1.1-2.4 2.5-2.4c.8 0 1.4.3 1.8.8v-1.6c0-.7-.6-1.3-1.3-1.3-.6 0-1.1.3-1.3.7-.1.2-.3.4-.6.4h-.5c-.3 0-.6-.3-.5-.7.4-1 1.5-1.6 2.7-1.6zm-.9 4c-.7 0-1.2.5-1.2 1.2s.5 1.2 1.2 1.2 1.2-.5 1.2-1.2-.5-1.2-1.2-1.2zm5.1-5.1c.3 0 .5.2.5.5v6.2c0 .3-.2.5-.5.5h-.5c-.3 0-.5-.2-.5-.5v-6.2c0-.3.2-.5.5-.5h.5zm4.8 2.3c1.5 0 2.7 1.1 2.7 2.6 0 1.5-1.2 2.6-2.7 2.6-1.5 0-2.7-1.1-2.7-2.6 0-1.5 1.2-2.6 2.7-2.6zm0 1.2c-.8 0-1.5.6-1.5 1.4s.7 1.4 1.5 1.4 1.5-.6 1.5-1.4-.7-1.4-1.5-1.4z"
        fill="white"
      />
    </svg>
  );
}

export function ConsultationBubble() {
  const { settings } = useSiteSettings();
  const [isOpen, setIsOpen] = useState(false);
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
      icon: <Target className="w-3.5 h-3.5" />,
      label: "Tư vấn lộ trình IELTS",
    },
    {
      icon: <BarChart3 className="w-3.5 h-3.5" />,
      label: "Kiểm tra trình độ",
    },
    {
      icon: <BookOpen className="w-3.5 h-3.5" />,
      label: "Trải nghiệm học thử",
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
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end select-none font-sans"
    >
      {/* Popover Mini-Card */}
      {isOpen && (
        <div className="mb-3 w-64 sm:w-72 rounded-2xl bg-white border border-border/80 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.12)] p-3.5 animate-in fade-in zoom-in-95 duration-150 origin-bottom-right">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-1 border-b border-border/60">
            <span className="text-xs font-semibold text-foreground">
              Bạn cần hỗ trợ gì?
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
              aria-label="Đóng"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Options List (Monochrome & Academic) */}
          <div className="py-1 space-y-0.5">
            {quickOptions.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionClick(opt)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs font-medium text-foreground/90 hover:bg-muted/60 hover:text-primary transition-colors group"
              >
                <span className="text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                  {opt.icon}
                </span>
                <span className="flex-1 leading-snug">{opt.label}</span>
              </button>
            ))}
          </div>

          {/* Action Button: Nhắn trực tiếp qua Zalo */}
          <div className="pt-2 mt-1 border-t border-border/60">
            <button
              onClick={handleDirectZaloClick}
              className="w-full flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl bg-[#0068FF] hover:bg-[#0057d9] text-white text-xs font-semibold transition-all shadow-xs active:scale-[0.98]"
            >
              <Send className="w-3 h-3" />
              <span>Nhắn trực tiếp qua Zalo</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating CTA Button (Desktop Pill, Mobile Circle) */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex items-center justify-center h-11 w-11 sm:w-auto sm:pl-4 sm:pr-1.5 rounded-full bg-brand-red hover:bg-brand-red-hover text-white shadow-[0_4px_18px_rgba(229,16,64,0.28)] hover:shadow-[0_6px_22px_rgba(229,16,64,0.38)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        aria-expanded={isOpen}
        aria-label="Tư vấn ngay"
      >
        {/* Brand Text: Visible on Desktop, Hidden on Mobile */}
        <span className="hidden sm:inline text-xs sm:text-sm font-semibold tracking-wide text-white mr-2.5 select-none whitespace-nowrap">
          Tư vấn ngay
        </span>

        {/* Zalo Icon & Centered Radar Light Rings */}
        <div className="relative w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs">
          {/* Main Ripple Ring */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-0.5 rounded-full border border-[#0068FF] animate-signal-ripple"
          />

          {/* Delayed Second Ripple Ring */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-0.5 rounded-full border border-[#0068FF] animate-signal-ripple-delayed"
          />

          {/* Zalo Icon */}
          <ZaloIcon className="w-full h-full" />
        </div>
      </button>
    </div>
  );
}
