import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SiteLogo } from "@/components/common/SiteLogo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Menu,
  X,
  ArrowRight,
  User,
  Shield,
  GraduationCap,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
}

const PUBLIC_NAV_ITEMS: NavItem[] = [
  { label: "Giới thiệu", href: "/about" },
  { label: "Phương pháp", href: "/method" },
  { label: "Hệ thống học thuật", href: "/academic-system" },
  { label: "Khóa học", href: "/courses" },
  { label: "Speaking Forecast", href: "/ielts-speaking-forecast" },
  { label: "Giảng viên", href: "/teachers" },
];

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, isTeacher } = useAuth();

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#0c1e38] text-white shadow-md transition-all">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-white rounded-lg p-1.5 shadow-sm flex items-center justify-center transition-transform group-hover:scale-105">
                <SiteLogo
                  alt="ARIS Logo"
                  className="max-h-9 sm:max-h-10 w-auto object-contain"
                />
              </div>
              <div className="hidden sm:flex items-center border-l border-white/20 pl-3">
                <span className="font-black tracking-wider text-base sm:text-lg text-white leading-none uppercase">
                  ARIS IELTS
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {PUBLIC_NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "px-2.5 xl:px-3 py-2 rounded-xl text-xs xl:text-[13px] font-bold tracking-wider uppercase whitespace-nowrap text-center transition-all",
                    active
                      ? "bg-white/15 text-white font-black shadow-xs border border-white/20"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="hidden sm:flex items-center gap-2.5">
            {isAuthenticated ? (
              <>
                {/* Authenticated quick state */}
                <div
                  onClick={() => navigate("/app/profile")}
                  className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user?.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground font-bold">
                      {user?.fullName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-bold text-white uppercase tracking-wide max-w-[140px] truncate">
                    {user?.fullName || "Học viên"}
                  </span>
                </div>

                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/admin")}
                    className="h-10 px-3.5 text-xs font-bold uppercase tracking-wider gap-1.5 border-slate-700 bg-transparent text-slate-200 hover:bg-white/10 hover:text-white"
                  >
                    <Shield className="h-3.5 w-3.5 text-sky-400" />
                    <span>Quản trị</span>
                  </Button>
                )}

                {/* Primary NextBand Entry CTA */}
                <Button
                  size="sm"
                  onClick={() => navigate("/app")}
                  className="h-10 px-5 rounded-xl text-xs sm:text-[13px] font-black uppercase tracking-wider bg-primary hover:bg-primary-hover text-white shadow-sm gap-2"
                >
                  <span>NextBand</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                {/* Guest State */}
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-10 px-4 text-xs sm:text-[13px] font-bold uppercase tracking-wider text-slate-200 hover:text-white hover:bg-white/10 rounded-xl"
                >
                  <Link to="/login">Đăng nhập</Link>
                </Button>

                <Button
                  size="sm"
                  asChild
                  className="h-10 px-5 rounded-xl text-xs sm:text-[13px] font-black uppercase tracking-wider bg-primary hover:bg-primary-hover text-white shadow-sm gap-2"
                >
                  <Link to="/login?next=/app">
                    <span>NextBand</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex sm:hidden items-center gap-2">
            {isAuthenticated ? (
              <Button
                size="sm"
                onClick={() => navigate("/app")}
                className="h-8 px-2.5 text-xs font-bold uppercase tracking-wider bg-primary text-white"
              >
                NextBand →
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                asChild
                className="h-8 px-2.5 text-xs font-bold uppercase tracking-wider border-slate-700 bg-transparent text-white"
              >
                <Link to="/login">Đăng nhập</Link>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-9 w-9 rounded-lg text-white hover:bg-white/10"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-[#0c1e38] text-white px-4 pt-3 pb-6 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-1">
            {PUBLIC_NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-between",
                    active
                      ? "bg-white/15 text-white font-black border border-white/20"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  )}
                >
                  <span>{item.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-60" />
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/app");
                  }}
                  className="w-full h-10 font-bold uppercase tracking-wider text-xs bg-primary text-white justify-center gap-2"
                >
                  <GraduationCap className="h-4 w-4" />
                  <span>Vào Học NextBand</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/login");
                  }}
                  className="w-full h-9 font-bold uppercase tracking-wider text-xs border-slate-700 bg-transparent text-white hover:bg-white/10"
                >
                  Đăng nhập
                </Button>
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/login?next=/app");
                  }}
                  className="w-full h-9 font-bold uppercase tracking-wider text-xs bg-primary text-white gap-1"
                >
                  <span>NextBand</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
