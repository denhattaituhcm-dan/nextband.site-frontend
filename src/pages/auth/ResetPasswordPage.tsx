import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SiteLogo } from "@/components/common/SiteLogo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/common/SEO";
import { Lock, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password === confirmPassword) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <SEO
        title="Đặt Lại Mật Khẩu — ARIS / NextBand"
        description="Thiết lập mật khẩu mới cho tài khoản ARIS."
      />

      <Card className="w-full max-w-md border border-border shadow-lg rounded-2xl bg-card p-6 sm:p-8">
        <CardHeader className="space-y-2 text-center p-0 pb-6">
          <div className="flex justify-center mb-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center group transition-opacity hover:opacity-90 cursor-pointer"
              title="Quay về trang chủ ARIS IELTS"
            >
              <SiteLogo alt="ARIS Logo" className="max-h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105" />
            </Link>
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            Đặt Lại Mật Khẩu
          </CardTitle>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Nhập mật khẩu mới để hoàn tất việc khôi phục tài khoản.
          </p>
        </CardHeader>

        <CardContent className="space-y-4 p-0">
          {submitted ? (
            <div className="p-4 rounded-xl bg-success/10 border border-success/20 space-y-3 text-center">
              <CheckCircle2 className="h-6 w-6 text-success mx-auto" />
              <p className="text-xs font-medium text-foreground">
                Mật khẩu mới đã được cập nhật thành công!
              </p>
              <Button
                onClick={() => navigate("/login")}
                className="w-full text-xs font-bold bg-primary text-primary-foreground"
              >
                Đăng nhập ngay
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <Label htmlFor="new-password" className="text-xs font-semibold">
                  Mật khẩu mới
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <Label htmlFor="confirm-password" className="text-xs font-semibold">
                  Xác nhận mật khẩu mới
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-10 text-xs sm:text-sm"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 font-bold text-xs sm:text-sm bg-primary text-primary-foreground"
              >
                Cập nhật mật khẩu
              </Button>
            </form>
          )}

          <div className="pt-3 border-t border-border/60 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Quay lại trang Đăng nhập</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
