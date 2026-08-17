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
  { label: "Giảng viên", href: "/teachers" },
  { label: "Tuyển dụng", href: "/careers" },
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
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 transition-all">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-18 items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <SiteLogo
                alt="ARIS Logo"
                className="max-h-9 sm:max-h-10 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <div className="hidden sm:flex flex-col border-l border-border/70 pl-2.5">
                <span className="font-extrabold tracking-tight text-sm text-foreground leading-none">
                  ARIS
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider leading-none mt-0.5">
                  Academic System
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
                    "px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-colors",
                    active
                      ? "bg-primary-soft text-primary font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
                  className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-muted/60 border border-border/60 hover:bg-muted transition-colors cursor-pointer"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user?.avatarUrl || undefined} />
                    <AvatarFallback className="text-[10px] bg-primary text-primary-foreground font-bold">
                      {user?.fullName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold text-foreground max-w-[120px] truncate">
                    {user?.fullName || "Học viên"}
                  </span>
                </div>

                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/admin")}
                    className="h-8 px-3 text-xs font-bold gap-1 border-border"
                  >
                    <Shield className="h-3 w-3 text-primary" />
                    <span>Quản trị</span>
                  </Button>
                )}

                {/* Primary NextBand Entry CTA */}
                <Button
                  size="sm"
                  onClick={() => navigate("/app")}
                  className="h-8 px-3.5 rounded-lg text-xs font-bold bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs gap-1.5"
                >
                  <span>NextBand</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <>
                {/* Guest State */}
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 px-3 text-xs font-bold text-foreground hover:bg-muted"
                >
                  <Link to="/login">Đăng nhập</Link>
                </Button>

                <Button
                  size="sm"
                  asChild
                  className="h-8 px-3.5 rounded-lg text-xs font-bold bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs gap-1.5"
                >
                  <Link to="/login?next=/app">
                    <span>NextBand</span>
                    <ArrowRight className="h-3.5 w-3.5" />
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
                className="h-8 px-2.5 text-xs font-bold bg-primary text-primary-foreground"
              >
                NextBand →
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                asChild
                className="h-8 px-2.5 text-xs font-bold"
              >
                <Link to="/login">Đăng nhập</Link>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-9 w-9 rounded-lg text-foreground hover:bg-muted"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background px-4 pt-3 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-1">
            {PUBLIC_NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-semibold tracking-tight transition-colors flex items-center justify-between",
                    active
                      ? "bg-primary-soft text-primary font-bold"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <span>{item.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-40" />
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-border space-y-2">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/app");
                  }}
                  className="w-full h-10 font-bold text-xs bg-primary text-primary-foreground justify-center gap-2"
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
                  className="w-full h-9 font-bold text-xs"
                >
                  Đăng nhập
                </Button>
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/login?next=/app");
                  }}
                  className="w-full h-9 font-bold text-xs bg-primary text-primary-foreground gap-1"
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
