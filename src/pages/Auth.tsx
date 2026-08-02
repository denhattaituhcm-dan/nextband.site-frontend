import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
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
  GraduationCap,
  Mail,
  Lock,
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
    const { error } = await signIn(email.trim(), password.trim());
    setIsLoading(false);

    if (error) {
      const rawMsg = error.message;
      const description =
        typeof rawMsg === "string" && rawMsg.trim() && rawMsg.trim() !== "{}"
          ? rawMsg
          : "Email hoặc mật khẩu không chính xác.";

      toast({
        variant: "destructive",
        title: "Đăng nhập thất bại",
        description,
      });
    } else {
      toast({
        title: "Đăng nhập thành công",
        description: "Chào mừng bạn quay trở lại!",
      });
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50/50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 selection:bg-primary/10 selection:text-primary relative overflow-hidden">
      {/* 9. Background: Subtle radial glow behind login card */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-sky-400/5 dark:bg-sky-500/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Left side - Education & Academic Branding Panel (Visual 2-Zone Separation) */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-slate-50/90 text-slate-900 px-8 xl:px-12 py-8 xl:py-10 flex-col justify-between relative overflow-hidden border-r border-slate-200/80 animate-in fade-in duration-500 z-10">
        {/* Subtle Soft Blue Ambient Glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 4. Unified Brand Header (Logo A + ARIS IELTS + Cambridge Badge + Subtitle) */}
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-3">
            <SiteLogo alt="ARIS IELTS" className="max-h-11 w-auto object-contain" />
            <div className="border-l border-slate-200 pl-3">
              <div className="font-bold text-slate-900 text-base leading-tight tracking-tight">ARIS IELTS</div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                <Award className="h-3 w-3 text-amber-500" />
                Cambridge Standard
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold tracking-tight text-slate-700">
              {settings.authTagline}
            </p>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md">
              Không gian học tập được thiết kế cho từng buổi học trên lớp.
            </p>
          </div>
        </div>

        {/* 1. Left side Content Card - Expanded & pulled up closer to slogan with subtle shadow */}
        <div className="relative z-10 w-full max-w-xl my-auto py-3">
          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow space-y-6">
            {/* 3. Feature Highlights Grid - Icon +10%, Title weight 600, Subtitle brighter */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-sky-50/60 border border-sky-100/80">
                <div className="rounded-lg bg-sky-500/10 p-2.5 border border-sky-500/20 shrink-0">
                  <GraduationCap className="h-5 w-5 text-sky-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-800 text-sm tracking-tight truncate">
                    Learning Workspace
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    Lộ trình IELTS chuẩn
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100/80">
                <div className="rounded-lg bg-indigo-500/10 p-2.5 border border-indigo-500/20 shrink-0">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-800 text-sm tracking-tight truncate">
                    Track Progress
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    Theo dõi tiến độ
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Your Journey Section - Learning Evolution Journey */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-5">
                <h4 className="font-semibold text-slate-800 text-sm tracking-tight">Your Journey</h4>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60 font-medium">5 Levels</span>
              </div>

              {/* Connected Step Progression Timeline (Starter -> Leader) */}
              <div className="relative px-2 pt-2 pb-3">
                {/* Clean subtle light gray connector line perfectly centered through w-6 h-6 dots (top 20px) */}
                <div className="absolute top-[20px] left-[10%] right-[10%] h-0.5 bg-slate-200 z-0" />

                <div className="grid grid-cols-5 gap-2 relative z-10 text-center">
                  {/* Step 1 */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-pink-500 border-2 border-white ring-2 ring-pink-100 flex items-center justify-center text-[10px] text-white font-bold shrink-0 shadow-xs">
                      ●
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-800">Starter</div>
                      <div className="text-[11px] font-mono text-pink-600 font-semibold mt-0.5">3.0</div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-sky-500 border-2 border-white ring-2 ring-sky-100 flex items-center justify-center text-[10px] text-white font-bold shrink-0 shadow-xs">
                      ●
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-800">Dreamer</div>
                      <div className="text-[11px] font-mono text-sky-600 font-semibold mt-0.5">4.0</div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-500 border-2 border-white ring-2 ring-amber-100 flex items-center justify-center text-[10px] text-white font-bold shrink-0 shadow-xs">
                      ●
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-800">Builder</div>
                      <div className="text-[11px] font-mono text-amber-600 font-semibold mt-0.5">5.0</div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-100 flex items-center justify-center text-[10px] text-white font-bold shrink-0 shadow-xs">
                      ●
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-800">Master</div>
                      <div className="text-[11px] font-mono text-emerald-600 font-semibold mt-0.5">6.0</div>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-600 border-2 border-white ring-2 ring-red-100 flex items-center justify-center text-[10px] text-white font-bold shrink-0 shadow-xs">
                      ●
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-800">Leader</div>
                      <div className="text-[11px] font-mono text-red-600 font-semibold mt-0.5">6.5+</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Balanced Bottom Footer Anchor */}
        <div className="relative z-10 flex items-center justify-between gap-3 pt-3 border-t border-slate-200/60 text-xs">
          <div className="space-y-0.5">
            <div className="font-semibold text-slate-800 tracking-tight">ARIS IELTS</div>
            <div className="text-slate-500/80 font-normal text-[11px]">
              © 2026 <span className="mx-1">•</span> Dĩ An, TP.HCM
            </div>
          </div>

          {settings.zaloLink && (
            <a
              href={settings.zaloLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-sky-600 border border-slate-200 text-xs font-medium transition-colors shadow-2xs"
            >
              <MessageCircle className="h-3.5 w-3.5 text-sky-500" />
              <span>Support</span>
            </a>
          )}
        </div>
      </div>

      {/* Right side - Focal Point Student Login Workspace Form */}
      <div className="flex-1 flex items-center justify-center px-6 lg:px-12 py-6 lg:py-8 z-10">
        {/* 6. Light Breathing Card (Enlarged width max-w-[520px]) */}
        <Card className="w-full max-w-[520px] border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] rounded-2xl bg-white dark:bg-slate-900 p-7 sm:p-8">
          <CardHeader className="space-y-1.5 text-center p-0 pb-5">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-3">
              <SiteLogo alt="ARIS IELTS Logo" className="max-h-9 w-auto object-contain" />
            </div>
            {/* 10. Title font-weight 700 instead of 800 */}
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Đăng nhập
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-0">
            {/* 7 & 10. Google Login Primary Entry (DÀNH CHO HỌC VIÊN font đậm hơn) */}
            <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30">
              <div className="text-xs font-bold tracking-wider text-sky-800 dark:text-sky-300 uppercase text-center mb-1">
                🎓 DÀNH CHO HỌC VIÊN
              </div>
              {/* 5. Google Button: Height h-11 border-radius rounded-xl, light hover */}
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-3 border-sky-200/90 dark:border-sky-800 bg-white dark:bg-slate-900 h-11 rounded-xl px-4 text-sm font-semibold hover:bg-sky-50/80 hover:border-sky-300 dark:hover:bg-sky-900/40 text-slate-800 dark:text-slate-200 shadow-xs transition-all duration-150 active:scale-[0.99]"
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
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
              <p className="text-xs text-center text-slate-500 dark:text-slate-400 font-normal">
                Cách đăng nhập nhanh chóng nhất
              </p>
            </div>

            {/* 6. Shortened Divider: "Giáo viên & Quản trị" */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-semibold">
                  Giáo viên & Quản trị
                </span>
              </div>
            </div>

            {/* 7. Secondary Form with clean line icons (Mail & Lock) */}
            <form onSubmit={handleSignIn} className="space-y-4 p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Email</span>
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-10 text-sm border-slate-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-primary/40"
                />
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">{errors.email}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Mật khẩu</span>
                </Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-10 text-sm pr-9 border-slate-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-primary/40"
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
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive mt-1">{errors.password}</p>
                )}
              </div>
              {/* 8. Subtle Navy Gradient Login Button */}
              <Button type="submit" className="w-full h-10 text-sm font-semibold tracking-tight mt-1.5 bg-gradient-to-b from-[#1E293B] to-[#0F172A] hover:from-[#0F172A] hover:to-[#020617] text-white shadow-xs transition-all duration-150" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
