import React from "react";
import { Users, GraduationCap, ShieldCheck, Gift } from "lucide-react";
import { TRUST_POINTS } from "@/constants/courses";

const ICON_MAP = {
  Users: Users,
  GraduationCap: GraduationCap,
  ShieldCheck: ShieldCheck,
  Gift: Gift,
};

export function TrustValueStrip() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {TRUST_POINTS.map((point) => {
          const IconComponent = ICON_MAP[point.iconName] || ShieldCheck;
          return (
            <div
              key={point.key}
              className="p-5 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-2.5 text-left transition-all hover:border-brand-blue/40"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                <IconComponent className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-sm sm:text-base text-foreground tracking-tight">
                  {point.title}
                </h4>
                <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed pt-1">
                  {point.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
