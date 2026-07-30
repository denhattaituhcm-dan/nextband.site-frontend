import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  BookOpen,
  Users,
  Eye,
  EyeOff,
  MessageCircle,
  Headphones,
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { authApi } from "@/lib/api";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { SiteLogo } from "@/components/common/SiteLogo";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const emailSchema = z.string().email("Email không hợp lệ");
const passwordSchema = z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự");

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [showPassword, setShowPassword] = useState(false);
  const [rememberGoogleLogin, setRememberGoogleLogin] = useState(true);
  const [showGoogleHint, setShowGoogleHint] = useState(false);

  const { signIn, user } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = (location.state as { from?: Location })?.from?.pathname || "/";

  useEffect(() => {
    if (user) {
      // Automatic role-based routing:
      // If user has teacher or admin role (logged in via Password), redirect to Teacher Workspace for grading
      if (user.roles?.includes("teacher") || user.roles?.includes("admin")) {
        const adminTarget = from.startsWith("/admin") ? from : "/admin/teacher-workspace";
        navigate(adminTarget, { replace: true });
      } else {
        // Students (logged in via Google OAuth) redirect to Student Workspace /
        navigate(from, { replace: true });
      }
    }
  }, [user, navigate, from]);

  useEffect(() => {
    const hidden = localStorage.getItem("google_login_hint_hidden") === "1";
    setShowGoogleHint(!hidden);
  }, []);

  const validateInputs = () => {
    const newErrors: { email?: string; password?: string } = {};

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Đăng nhập thất bại",
        description: error.message || "Email hoặc mật khẩu không chính xác.",
      });
    } else {
      toast({
        title: "Đăng nhập thành công",
        description: "Chào mừng bạn quay trở lại!",
      });
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50/50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 selection:bg-primary/10 selection:text-primary">
      {/* Left side - Education & Academic Branding Panel (Visual 2-Zone Separation) */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-slate-50 text-slate-900 p-6 xl:p-8 flex-col justify-between relative overflow-hidden border-r border-slate-200/80 animate-in fade-in duration-500">
        {/* Subtle Soft Blue Ambient Glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Logo */}
        <div className="relative z-10 space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <SiteLogo alt="NextBand Logo" className="max-h-10 w-auto object-contain" />
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/80 shadow-xs text-[11px] font-medium text-slate-700">
              <Award className="h-3.5 w-3.5 text-amber-500" />
              Cambridge Standard
            </span>
          </div>
          <p className="text-xs font-medium tracking-tight text-slate-500 leading-relaxed max-w-sm">
            {settings.authTagline}
          </p>
        </div>

        {/* Middle Section: 2-ZONE SEPARATION (TOP: HỌC VIÊN / BOTTOM: GIÁO VIÊN & QUẢN TRỊ) */}
        <div className="space-y-3.5 relative z-10 w-full max-w-md my-0">
          {/* ZONE 1: TOP SECTION - DÀNH CHO HỌC VIÊN (SKY/WHITE BACKGROUND TONE) */}
          <div className="p-3.5 rounded-2xl bg-white border border-sky-100 shadow-xs space-y-3 relative">
            <div className="flex items-center justify-between border-b border-sky-50 pb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 font-extrabold text-[10px] uppercase tracking-wider">
                  🎓 Cổng Học viên
                </span>
              </div>
              <span className="text-[11px] text-sky-600 font-medium">Đăng nhập Google ⚡</span>
            </div>

            {/* Compact Feature Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-sky-50/50 border border-sky-100">
                <div className="rounded-lg bg-sky-500/10 p-1.5 border border-sky-500/20 shrink-0">
                  <GraduationCap className="h-4 w-4 text-sky-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-800 text-xs tracking-tight truncate">
                    Learning Workspace
                  </h3>
                  <p className="text-[10px] text-slate-500 truncate">
                    Lộ trình IELTS chuẩn
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-xl bg-indigo-50/50 border border-indigo-100">
                <div className="rounded-lg bg-indigo-500/10 p-1.5 border border-indigo-500/20 shrink-0">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-800 text-xs tracking-tight truncate">
                    Track Progress
                  </h3>
                  <p className="text-[10px] text-slate-500 truncate">
                    Theo dõi tiến độ
                  </p>
                </div>
              </div>
            </div>

            {/* Academic Curriculum Roadmap */}
            <div className="pt-0.5">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="font-semibold text-slate-800 text-xs tracking-tight">Academic Curriculum</h4>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60">5 Levels</span>
              </div>

              <div className="relative pl-5 space-y-2 my-1">
                <div className="absolute left-[5.5px] top-1.5 bottom-1.5 w-[1px] bg-slate-200" />
                <div className="relative flex items-center justify-between text-xs">
                  <div className="absolute -left-[18px] w-2 h-2 rounded-full bg-red-600 ring-2 ring-red-100" />
                  <span className="font-medium text-slate-700 text-[11px]">Leader</span>
                  <span className="text-[10px] font-mono text-red-600 font-medium">IELTS 6.5+</span>
                </div>
                <div className="relative flex items-center justify-between text-xs">
                  <div className="absolute -left-[18px] w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                  <span className="font-medium text-slate-700 text-[11px]">Master</span>
                  <span className="text-[10px] font-mono text-emerald-600 font-medium">IELTS 6.0</span>
                </div>
                <div className="relative flex items-center justify-between text-xs">
                  <div className="absolute -left-[18px] w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-100" />
                  <span className="font-medium text-slate-700 text-[11px]">Builder</span>
                  <span className="text-[10px] font-mono text-amber-600 font-medium">IELTS 5.0</span>
                </div>
                <div className="relative flex items-center justify-between text-xs">
                  <div className="absolute -left-[18px] w-2 h-2 rounded-full bg-sky-500 ring-2 ring-sky-100" />
                  <span className="font-medium text-slate-700 text-[11px]">Dreamer</span>
                  <span className="text-[10px] font-mono text-sky-600 font-medium">IELTS 4.0</span>
                </div>
                <div className="relative flex items-center justify-between text-xs">
                  <div className="absolute -left-[18px] w-2 h-2 rounded-full bg-pink-500 ring-2 ring-pink-100" />
                  <span className="font-medium text-slate-700 text-[11px]">Starter</span>
                  <span className="text-[10px] font-mono text-pink-600 font-medium">IELTS 3.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* CLEAR VISUAL DIVIDER BETWEEN TOP & BOTTOM SECTIONS */}
          <div className="relative flex items-center justify-center my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-dashed border-slate-300/70" />
            </div>
            <span className="relative px-3 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[9px] font-extrabold tracking-widest uppercase border border-slate-300 shadow-2xs">
              ▼ Phân cổng Đăng nhập
            </span>
          </div>

          {/* ZONE 2: BOTTOM SECTION - DÀNH CHO GIÁO VIÊN & QUẢN TRỊ (SLATE/AMBER BACKGROUND TONE) */}
          <div className="p-3 rounded-2xl bg-slate-200/60 border border-slate-300/80 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-100 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1">
                🔑 Cổng Giáo viên & Quản trị
              </span>
              <span className="text-[10px] text-slate-600 font-semibold">Email / Pass 🔒</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-normal font-medium">
              Dành riêng cho Giáo viên & Admin hệ thống vào giao diện Chấm bài, chữa bài Speaking / Writing và quản lý khóa học.
            </p>
          </div>

          {/* Social Proof & Zalo Link */}
          <div className="flex items-center justify-between gap-3 text-xs pt-1">
            {settings.completedLessonsStat && (
              <div className="flex items-center gap-1.5 text-slate-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span className="text-[11px]">
                  <strong className="text-slate-800 font-medium">
                    {settings.completedLessonsStat}
                  </strong>{" "}
                  lessons completed
                </span>
              </div>
            )}

            {settings.zaloLink && (
              <a
                href={settings.zaloLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-sky-600 border border-slate-200 text-[11px] font-medium transition-colors shadow-2xs"
              >
                <MessageCircle className="h-3 w-3 text-sky-500" />
                <span>Support</span>
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-slate-400 relative z-10 font-normal tracking-wide mt-4">
          © {new Date().getFullYear()} NextBand. All rights reserved.
        </p>
      </div>

      {/* Right side - Focal Point Student Login Workspace Form */}
      <div className="flex-1 flex items-start justify-center p-6 sm:p-10 lg:p-12 pt-8 sm:pt-12">
        {/* 6. Light Breathing Card */}
        <Card className="w-full max-w-[380px] border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-2xl bg-white dark:bg-slate-900 p-2 sm:p-3">
          <CardHeader className="space-y-1.5 text-center pb-5">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-3">
              <SiteLogo alt="NextBand Logo" className="max-h-9 w-auto object-contain" />
            </div>
            <CardTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Đăng nhập
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Đăng nhập để tiếp tục bài học của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* 7. Google Login Primary Entry (DÀNH CHO HỌC VIÊN) */}
            <div className="space-y-2 p-3 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30">
              <div className="text-[10px] font-bold tracking-wider text-sky-700 dark:text-sky-400 uppercase text-center mb-1">
                🎓 Dành cho Học viên
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-3 border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 h-10 px-4 text-sm font-medium hover:bg-sky-50 dark:hover:bg-sky-900/40 text-slate-800 dark:text-slate-200 shadow-xs transition-all duration-150 active:scale-[0.99]"
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    await authApi.loginWithGoogle();
                  } catch (error: any) {
                    toast({
                      variant: "destructive",
                      title: "Đăng nhập thất bại",
                      description: error?.message || "Không thể khởi chạy đăng nhập Google.",
                    });
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="tracking-tight">Đăng nhập bằng Google</span>
              </Button>
              <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-normal">
                Cách đăng nhập nhanh chóng nhất
              </p>
            </div>

            {/* DIVIDER BETWEEN STUDENT & TEACHER / ADMIN */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                <span className="bg-white dark:bg-slate-900 px-2.5 text-slate-400 font-medium">
                  Hoặc dành cho Giáo viên & Quản trị
                </span>
              </div>
            </div>

            {/* Secondary Email/Password Form (DÀNH CHO GIÁO VIÊN & QUẢN TRỊ) */}
            <form onSubmit={handleSignIn} className="space-y-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
              <div className="text-[10px] font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase">
                🔑 Cổng Giáo viên & Quản trị
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Email
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-9.5 text-xs border-slate-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-primary/40"
                />
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">{errors.email}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Mật khẩu
                </Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-9.5 text-xs pr-9 border-slate-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-primary/40"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-2.5 py-2 hover:bg-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive mt-1">{errors.password}</p>
                )}
              </div>
              <Button type="submit" className="w-full h-9.5 text-xs font-medium tracking-tight mt-1.5 bg-slate-900 hover:bg-slate-800 text-white transition-colors" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Đăng nhập"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
