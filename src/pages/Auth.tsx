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
      navigate(from, { replace: true });
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
      {/* Left side - Apple Education + Coursera + Linear Premium Academic Branding Panel */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-[#090D16] text-slate-100 p-8 xl:p-12 flex-col justify-between relative overflow-hidden border-r border-slate-800/80 animate-in fade-in duration-500">
        {/* Subtle Soft Blue & Ambient Brand Glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Logo */}
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <SiteLogo alt="NextBand Logo" className="max-h-11 w-auto object-contain" />
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] font-medium text-slate-300">
              <Award className="h-3.5 w-3.5 text-amber-400" />
              Cambridge Standard
            </span>
          </div>
          <p className="text-xs font-medium tracking-tight text-slate-400 leading-relaxed max-w-sm">
            {settings.authTagline}
          </p>
        </div>

        {/* Middle Section: Compact Feature Cards & Academic Roadmap */}
        <div className="space-y-4 relative z-10 my-auto w-full max-w-md">
          {/* Compact Feature Cards (35% Height Reduced) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm backdrop-blur-sm">
              <div className="rounded-lg bg-sky-500/10 p-2 border border-sky-500/20 shrink-0">
                <GraduationCap className="h-4 w-4 text-sky-400" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-200 text-xs tracking-tight truncate">
                  Learning Workspace
                </h3>
                <p className="text-[11px] text-slate-400 truncate">
                  Structured IELTS learning
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm backdrop-blur-sm">
              <div className="rounded-lg bg-indigo-500/10 p-2 border border-indigo-500/20 shrink-0">
                <TrendingUp className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-200 text-xs tracking-tight truncate">
                  Track Progress
                </h3>
                <p className="text-[11px] text-slate-400 truncate">
                  Measure improvement
                </p>
              </div>
            </div>
          </div>

          {/* Academic Curriculum Roadmap Card (Refined Official Coursebook Colors & Curriculum Format) */}
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 shadow-sm backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-800/60">
              <div>
                <h4 className="font-semibold text-slate-200 text-xs tracking-tight">Academic Curriculum</h4>
                <p className="text-[10px] text-slate-400">Official Course Progression</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">5 Levels</span>
            </div>

            {/* Vertical Roadmap Timeline */}
            <div className="relative pl-5 space-y-3.5 my-1.5">
              {/* Ultra-thin Elegant Connecting Line */}
              <div className="absolute left-[5.5px] top-1.5 bottom-1.5 w-[1px] bg-slate-800" />

              {/* Stage 1: Leader (Dark Red) - TOP */}
              <div className="relative flex items-center justify-between text-xs group">
                <div className="absolute -left-[18px] w-2 h-2 rounded-full bg-red-700 ring-2 ring-red-900/50 shadow-[0_0_6px_rgba(185,28,28,0.6)]" />
                <span className="font-medium text-slate-200 text-[11px]">Leader</span>
                <span className="text-[10px] font-mono text-red-400 font-medium">IELTS 6.5+</span>
              </div>

              {/* Stage 2: Master (Green) */}
              <div className="relative flex items-center justify-between text-xs group">
                <div className="absolute -left-[18px] w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-950/40 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                <span className="font-medium text-slate-200 text-[11px]">Master</span>
                <span className="text-[10px] font-mono text-emerald-400 font-medium">IELTS 6.0</span>
              </div>

              {/* Stage 3: Builder (Orange) */}
              <div className="relative flex items-center justify-between text-xs group">
                <div className="absolute -left-[18px] w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-950/40 shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
                <span className="font-medium text-slate-200 text-[11px]">Builder</span>
                <span className="text-[10px] font-mono text-amber-400 font-medium">IELTS 5.0</span>
              </div>

              {/* Stage 4: Dreamer (Blue) */}
              <div className="relative flex items-center justify-between text-xs group">
                <div className="absolute -left-[18px] w-2 h-2 rounded-full bg-sky-500 ring-2 ring-sky-950/40 shadow-[0_0_6px_rgba(14,165,233,0.4)]" />
                <span className="font-medium text-slate-300 text-[11px]">Dreamer</span>
                <span className="text-[10px] font-mono text-sky-400 font-medium">IELTS 4.0</span>
              </div>

              {/* Stage 5: Starter (Pink) - BOTTOM */}
              <div className="relative flex items-center justify-between text-xs group">
                <div className="absolute -left-[18px] w-2 h-2 rounded-full bg-pink-500 ring-2 ring-pink-950/40 shadow-[0_0_6px_rgba(236,72,153,0.4)]" />
                <span className="font-medium text-slate-300 text-[11px]">Starter</span>
                <span className="text-[10px] font-mono text-pink-400 font-medium">IELTS 3.0</span>
              </div>
            </div>
          </div>

          {/* Social Proof & Zalo Link Dynamic Single Source of Truth */}
          <div className="flex items-center justify-between gap-3 text-xs">
            {settings.completedLessonsStat && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px]">
                  <strong className="text-slate-200 font-medium">
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
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-800 text-sky-400 border border-sky-500/30 text-[11px] font-medium transition-colors"
              >
                <MessageCircle className="h-3 w-3 text-sky-400" />
                <span>Support</span>
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-slate-500 relative z-10 font-normal tracking-wide">
          © {new Date().getFullYear()} NextBand. All rights reserved.
        </p>
      </div>

      {/* Right side - Focal Point Student Login Workspace Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16">
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
            {/* 7. Google Login Primary Entry */}
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-3 border-slate-200 dark:border-slate-700 h-10.5 px-4 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 shadow-sm hover:shadow transition-all duration-150 active:scale-[0.99]"
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    await authApi.loginWithGoogle();
                  } catch (error: any) {
                    toast({
                      variant: "destructive",
                      title: "Đăng nhập Google thất bại",
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
              <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 font-normal">
                Cách nhanh nhất dành cho học viên
              </p>
            </div>

            <div className="relative my-3.5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200/80 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                <span className="bg-white dark:bg-slate-900 px-2.5 text-slate-400 font-medium">
                  Hoặc bằng email
                </span>
              </div>
            </div>

            {/* Secondary Email/Password Form */}
            <form onSubmit={handleSignIn} className="space-y-3.5">
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
