import React, { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { ConsultationBubble } from "@/components/public/ConsultationBubble";
import { useAuth } from "@/hooks/useAuth";

export default function PublicLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // If user just authenticated via OAuth and landed on a public page, redirect inside
  useEffect(() => {
    if (isLoading || !user) return;

    const savedTarget = sessionStorage.getItem("auth_redirect_target");
    const hasAuthHash =
      window.location.hash.includes("access_token") ||
      window.location.hash.includes("refresh_token") ||
      window.location.search.includes("code=");

    if (savedTarget || hasAuthHash) {
      if (savedTarget) {
        sessionStorage.removeItem("auth_redirect_target");
      }
      const destination = savedTarget || "/app";
      const target = destination === "/" ? "/app" : destination;

      if (user.roles?.includes("teacher") || user.roles?.includes("admin")) {
        const adminTarget = target.startsWith("/admin") ? target : "/admin/teacher-workspace";
        navigate(adminTarget, { replace: true });
      } else {
        navigate(target, { replace: true });
      }
    }
  }, [user, isLoading, navigate]);

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

