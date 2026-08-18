import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SiteLogo } from "@/components/common/SiteLogo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/common/SEO";
import { Mail, ArrowLeft, Send, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <SEO
        title="Quên Mật Khẩu — ARIS / NextBand"
        description="Khôi phục mật khẩu tài khoản học viên và giảng viên ARIS."
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
            Quên Mật Khẩu
          </CardTitle>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Nhập email đã đăng ký của bạn để nhận liên kết khôi phục mật khẩu.
          </p>
        </CardHeader>

        <CardContent className="space-y-4 p-0">
          {submitted ? (
            <div className="p-4 rounded-xl bg-success/10 border border-success/20 space-y-3 text-center">
              <CheckCircle2 className="h-6 w-6 text-success mx-auto" />
              <p className="text-xs font-medium text-foreground">
                Yêu cầu đã được gửi! Vui lòng kiểm tra hòm thư <strong>{email}</strong> để tiếp tục.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/login")}
                className="w-full text-xs font-bold"
              >
                Quay lại đăng nhập
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <Label htmlFor="forgot-email" className="text-xs font-semibold">
                  Email đăng ký
                </Label>
                <div className="relative">
                  <Input
                    id="forgot-email"
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-10 font-bold text-xs sm:text-sm bg-primary text-primary-foreground gap-2"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Gửi liên kết khôi phục</span>
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
