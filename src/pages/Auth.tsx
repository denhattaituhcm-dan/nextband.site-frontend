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

  const queryParams = new URLSearchParams(location.search);
  const nextParam = queryParams.get("next");
  const rawFrom = (location.state as { from?: { pathname?: string } })?.from?.pathname;
  const targetDestination = nextParam || rawFrom || "/app";
  const studentTarget = targetDestination === "/" ? "/app" : targetDestination;

  useEffect(() => {
    if (user) {
      // Automatic role-based routing:
      // If user has teacher or admin role (logged in via Password), redirect to Teacher Workspace for grading
      if (user.roles?.includes("teacher") || user.roles?.includes("admin")) {
        const adminTarget = studentTarget.startsWith("/admin") ? studentTarget : "/admin/teacher-workspace";
        navigate(adminTarget, { replace: true });
      } else {
        // Students redirect to Student Workspace /app (or next destination)
        navigate(studentTarget, { replace: true });
      }
    }
  }, [user, navigate, studentTarget]);

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
    <div className="min-h-screen flex bg-background font-sans text-foreground selection:bg-primary/10 selection:text-primary relative overflow-hidden">
      {/* Background: Subtle soft ambient surface */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-primary-soft/40 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Left side - Education & Academic Branding Panel (Visual 2-Zone Separation) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[58%] bg-muted/20 text-foreground px-8 xl:px-14 py-8 xl:py-10 flex-col justify-between relative overflow-hidden border-r border-border animate-in fade-in duration-500 z-10">
        {/* Subtle Soft Ambient Glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-info/5 rounded-full blur-3xl pointer-events-none" />

        {/* Unified Brand Header (Logo + ARIS IELTS + Cambridge Badge + Subtitle) */}
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-3">
            <SiteLogo alt="ARIS IELTS" className="max-h-12 w-auto object-contain" />
            <div className="border-l border-border pl-3">
              <div className="font-bold text-foreground text-lg leading-tight tracking-tight">ARIS IELTS</div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning mt-0.5">
                <Award className="h-3.5 w-3.5" />
                Cambridge Standard
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold tracking-tight text-muted-foreground">
              {settings.authTagline}
            </p>
          </div>
        </div>

        {/* Left side Primary Content */}
        <div className="relative z-10 w-full max-w-3xl my-auto py-4 space-y-6">
          {/* Feature Pillars */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-card border border-border/60 shadow-xs">
              <div className="rounded-lg bg-primary-soft p-2.5 shrink-0">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground text-sm sm:text-base tracking-tight truncate">
                  Learning Workspace
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  Lộ trình IELTS chuẩn
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-card border border-border/60 shadow-xs">
              <div className="rounded-lg bg-info/10 p-2.5 shrink-0">
                <TrendingUp className="h-5 w-5 text-info" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground text-sm sm:text-base tracking-tight truncate">
                  Track Progress
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  Theo dõi tiến độ
                </p>
              </div>
            </div>
          </div>

          {/* Hero Illustration */}
          <div className="w-full rounded-[24px] overflow-hidden shadow-xs border border-border/40">
            <img
              src="/your-journey.webp"
              alt="ARIS IELTS Learning Journey"
              className="w-full h-auto object-cover rounded-[24px] scale-100 hover:scale-[1.01] transition-transform duration-300"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>

        {/* Subtler Footer */}
        <div className="relative z-10 flex items-center justify-between gap-3 pt-3 border-t border-border/60 text-[11px]">
          <div className="space-y-0.5">
            <div className="font-medium text-foreground tracking-tight">ARIS IELTS</div>
            <div className="text-muted-foreground font-normal text-[10px]">
              © 2026 <span className="mx-1">•</span> Dĩ An, TP.HCM
            </div>
          </div>

          {settings.zaloLink && (
            <a
              href={settings.zaloLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-card hover:bg-muted text-primary border border-border text-[11px] font-medium transition-colors shadow-2xs"
            >
              <MessageCircle className="h-3 w-3 text-primary" />
              <span>Support</span>
            </a>
          )}
        </div>
      </div>

      {/* Right side - Student Login Workspace Form */}
      <div className="flex-1 flex items-center justify-center px-6 lg:px-12 py-6 lg:py-8 z-10">
        <Card className="w-full max-w-[520px] border border-border shadow-lg rounded-2xl bg-card p-7 sm:p-8">
          <CardHeader className="space-y-1.5 text-center p-0 pb-5">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-3">
              <SiteLogo alt="ARIS IELTS Logo" className="max-h-9 w-auto object-contain" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              Đăng nhập
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-0">
            {/* DÀNH CHO HỌC VIÊN + Google Button */}
            <div className="space-y-3">
              <div className="text-xs font-bold tracking-wider text-primary uppercase text-center">
                🎓 DÀNH CHO HỌC VIÊN
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-3 border-border bg-card h-11 rounded-xl px-4 text-sm font-semibold hover:bg-muted text-foreground shadow-xs transition-all duration-150 active:scale-[0.99]"
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
              <p className="text-xs text-center text-muted-foreground font-normal">
                Cách đăng nhập nhanh chóng nhất
              </p>
            </div>

            {/* Divider */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-card px-3 text-muted-foreground font-semibold">
                  Giáo viên &amp; Quản trị
                </span>
              </div>
            </div>

            {/* Teacher & Admin Form */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>Email</span>
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-10 text-sm border-border focus-visible:ring-1 focus-visible:ring-primary/40"
                />
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">{errors.email}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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
                    className="h-10 text-sm pr-9 border-border focus-visible:ring-1 focus-visible:ring-primary/40"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-2.5 py-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
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

              <Button
                type="submit"
                className="w-full h-10 text-sm font-semibold tracking-tight mt-1.5 bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs transition-all duration-150"
                disabled={isLoading}
              >
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
