import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { ConsultationBubble } from "@/components/public/ConsultationBubble";

export default function PublicLayout() {
  const { pathname } = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary-soft selection:text-primary">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
      <ConsultationBubble />
    </div>
  );
}
