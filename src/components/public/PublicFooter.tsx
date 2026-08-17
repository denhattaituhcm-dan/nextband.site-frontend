import React from "react";
import { Link } from "react-router-dom";
import { SiteLogo } from "@/components/common/SiteLogo";
import { Award, ArrowRight, ShieldCheck } from "lucide-react";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card text-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <SiteLogo alt="ARIS Logo" className="max-h-10 w-auto object-contain" />
              <div className="border-l border-border/80 pl-3">
                <div className="font-bold text-foreground text-base leading-tight">
                  ARIS IELTS
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-warning">
                  <Award className="h-3 w-3" />
                  Academic Excellence
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
              Hệ thống khảo thí và đào tạo IELTS chuẩn học thuật. Định hướng nâng cao năng lực ngôn ngữ thực chất và phương pháp tư duy phản biện.
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Nền tảng học tập số NextBand Learning System</span>
            </div>
          </div>

          {/* Group 1: ARIS */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              ARIS
            </h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link
                  to="/about"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Giới thiệu học viện
                </Link>
              </li>
              <li>
                <Link
                  to="/method"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Phương pháp đào tạo
                </Link>
              </li>
              <li>
                <Link
                  to="/academic-system"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Hệ thống học thuật
                </Link>
              </li>
              <li>
                <Link
                  to="/results"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Bảng vàng thành tích
                </Link>
              </li>
            </ul>
          </div>

          {/* Group 2: Learning */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Đào Tạo
            </h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link
                  to="/courses"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Chương trình khóa học
                </Link>
              </li>
              <li>
                <Link
                  to="/assessment"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Đánh giá năng lực
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cổng học viên (NextBand)
                </Link>
              </li>
            </ul>
          </div>

          {/* Group 3: Organization & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Tổ Chức &amp; Liên Hệ
            </h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link
                  to="/teachers"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Đội ngũ giảng viên
                </Link>
              </li>
              <li>
                <Link
                  to="/careers"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cơ hội nghề nghiệp
                </Link>
              </li>
              <li>
                <Link
                  to="/news"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Tin tức &amp; Học thuật
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Liên hệ &amp; Địa chỉ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & legal */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>
            © {currentYear} ARIS IELTS. Toàn bộ bản quyền thuộc về ARIS Academic Institution.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-foreground transition-colors cursor-pointer">
              Điều khoản dịch vụ
            </span>
            <span className="hover:text-foreground transition-colors cursor-pointer">
              Chính sách bảo mật
            </span>
            <span className="hover:text-foreground transition-colors cursor-pointer">
              Quy chuẩn học thuật
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
