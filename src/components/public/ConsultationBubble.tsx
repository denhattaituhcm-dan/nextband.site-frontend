import React, { useState, useRef, useEffect } from "react";
import { X, Compass, ShieldCheck, BookOpen, Send } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  RoadmapConsultationModal,
  AssessmentRegistrationModal,
  TrialClassModal,
} from "./ConsultationModals";

function ZaloIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.49 10.2722v-.4496h1.3467v6.3218h-.7704a.576.576 0 01-.5763-.5729l-.0006.0005a3.273 3.273 0 01-1.9372.6321c-1.8138 0-3.2844-1.4697-3.2844-3.2823 0-1.8125 1.4706-3.2822 3.2844-3.2822a3.273 3.273 0 011.9372.6321l.0006.0005zM6.9188 7.7896v.205c0 .3823-.051.6944-.2995 1.0605l-.03.0343c-.0542.0615-.1815.206-.2421.2843L2.024 14.8h4.8948v.7682a.5764.5764 0 01-.5767.5761H0v-.3622c0-.4436.1102-.6414.2495-.8476L4.8582 9.23H.1922V7.7896h6.7266zm8.5513 8.3548a.4805.4805 0 01-.4803-.4798v-7.875h1.4416v8.3548H15.47zM20.6934 9.6C22.52 9.6 24 11.0807 24 12.9044c0 1.8252-1.4801 3.306-3.3066 3.306-1.8264 0-3.3066-1.4808-3.3066-3.306 0-1.8237 1.4802-3.3044 3.3066-3.3044zm-10.1412 5.253c1.0675 0 1.9324-.8645 1.9324-1.9312 0-1.065-.865-1.9295-1.9324-1.9295s-1.9324.8644-1.9324 1.9295c0 1.0667.865 1.9312 1.9324 1.9312zm10.1412-.0033c1.0737 0 1.945-.8707 1.945-1.9453 0-1.073-.8713-1.9436-1.945-1.9436-1.0753 0-1.945.8706-1.945 1.9436 0 1.0746.8697 1.9453 1.945 1.9453z" />
    </svg>
  );
}

type ModalType = "roadmap" | "assessment" | "trial" | null;

interface SupportOption {
  id: "roadmap" | "assessment" | "trial";
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

export function ConsultationBubble() {
  const { settings } = useSiteSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
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

  const supportOptions: SupportOption[] = [
    {
      id: "assessment",
      icon: <ShieldCheck className="w-4 h-4 text-brand-red" />,
      title: "Thi thử IELTS 4 Kỹ Năng (60 phút)",
      subtitle: "Đo lường 4 kỹ năng & định vị Rank ARIS-7",
    },
    {
      id: "roadmap",
      icon: <Compass className="w-4 h-4 text-brand-blue" />,
      title: "Tư vấn lộ trình học IELTS",
      subtitle: "Được tư vấn level và khóa học phù hợp",
    },
    {
      id: "trial",
      icon: <BookOpen className="w-4 h-4 text-emerald-600" />,
      title: "Đăng ký học thử miễn phí",
      subtitle: "Trải nghiệm lớp học trước khi quyết định",
    },
  ];

  const handleOptionClick = (optionId: "roadmap" | "assessment" | "trial") => {
    setIsOpen(false);
    setActiveModal(optionId);
  };

  const handleDirectZaloClick = () => {
    window.open(zaloUrl, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  return (
    <>
      <div
        ref={containerRef}
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end select-none font-sans"
      >
        {/* Popover Mini-Card */}
        {isOpen && (
          <div className="mb-3 w-72 sm:w-80 rounded-2xl bg-background/95 backdrop-blur-md border border-border shadow-[0_12px_40px_-5px_rgba(0,0,0,0.15)] p-3.5 sm:p-4 animate-in fade-in zoom-in-95 duration-150 origin-bottom-right">
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 mb-1.5 border-b border-border/60">
              <span className="text-xs sm:text-sm font-bold text-foreground tracking-tight">
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

            {/* 3 Action Options List */}
            <div className="py-1 space-y-1">
              {supportOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleOptionClick(opt.id)}
                  className="w-full flex items-start gap-2.5 p-2 rounded-xl text-left hover:bg-muted/70 transition-colors group cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-muted/80 group-hover:bg-brand-red/10 group-hover:text-brand-red transition-colors shrink-0 mt-0.5">
                    {opt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-foreground group-hover:text-brand-red transition-colors leading-tight">
                      {opt.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                      {opt.subtitle}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Direct Zalo Shortcut Button */}
            <div className="pt-2.5 mt-1 border-t border-border/60">
              <button
                onClick={handleDirectZaloClick}
                className="w-full flex items-center justify-center gap-2 h-9 px-3 rounded-xl bg-[#0068FF] hover:bg-[#0057d9] text-white text-xs font-semibold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
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
          <div className="relative w-8 h-8 rounded-full bg-[#0068FF] text-white flex items-center justify-center shrink-0 shadow-xs p-1.5">
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

      {/* Dynamic Modals */}
      <RoadmapConsultationModal
        isOpen={activeModal === "roadmap"}
        onOpenChange={(open) => !open && setActiveModal(null)}
      />

      <AssessmentRegistrationModal
        isOpen={activeModal === "assessment"}
        onOpenChange={(open) => !open && setActiveModal(null)}
      />

      <TrialClassModal
        isOpen={activeModal === "trial"}
        onOpenChange={(open) => !open && setActiveModal(null)}
      />
    </>
  );
}
