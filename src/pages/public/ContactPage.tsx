import React from "react";
import { SectionContainer } from "@/components/public/SectionContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SEO } from "@/components/common/SEO";
import { MapPin, Mail, Phone, Clock, Send, MessageCircle } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="space-y-12">
      <SEO
        title="Liên Hệ & Địa Chỉ Học Viện ARIS"
        description="Thông tin liên hệ, địa chỉ trung tâm và kênh hỗ trợ học thuật ARIS IELTS."
      />

      <SectionContainer
        badge="Kết Nối &amp; Hỗ Trợ"
        title="Liên Hệ Với Ban Học Thuật ARIS"
        description="Chúng tôi luôn sẵn sàng lắng nghe, giải đáp thắc mắc về các khóa học và tư vấn lộ trình học tập phù hợp nhất."
        background="default"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left max-w-5xl mx-auto">
          {/* Contact Info Col */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-7 rounded-2xl border border-border/80 bg-card space-y-5">
              <h3 className="font-extrabold text-foreground text-lg">
                Thông Tin Trực Tiếp
              </h3>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-primary-soft text-primary shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">Địa Điểm Đào Tạo</div>
                    <div className="text-muted-foreground">
                      TP. Dĩ An, Tỉnh Bình Dương (Giáp ranh TP. Thủ Đức, TP.HCM)
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-primary-soft text-primary shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">Email Học Thuật</div>
                    <div className="text-muted-foreground">academic@nextband.site</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-primary-soft text-primary shrink-0">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">Thời Gian Làm Việc</div>
                    <div className="text-muted-foreground">
                      Thứ 2 — Thứ 7: 08:00 - 21:00
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form Col */}
          <div className="lg:col-span-7">
            <div className="p-7 sm:p-8 rounded-2xl border border-border/80 bg-card space-y-5">
              <h3 className="font-extrabold text-foreground text-lg">
                Gửi Yêu Cầu Tư Vấn Lộ Trình
              </h3>

              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="contact-name" className="text-xs font-semibold">
                      Họ và tên
                    </Label>
                    <Input
                      id="contact-name"
                      placeholder="Nguyễn Văn A"
                      className="h-10 text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contact-phone" className="text-xs font-semibold">
                      Số điện thoại / Zalo
                    </Label>
                    <Input
                      id="contact-phone"
                      placeholder="09xx xxx xxx"
                      className="h-10 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contact-email" className="text-xs font-semibold">
                    Email
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="email@example.com"
                    className="h-10 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contact-message" className="text-xs font-semibold">
                    Mục tiêu điểm số hoặc nội dung cần tư vấn
                  </Label>
                  <Textarea
                    id="contact-message"
                    rows={4}
                    placeholder="Ví dụ: Cần đạt 6.5 trong 6 tháng để xét tuyển đại học..."
                    className="text-xs sm:text-sm resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-bold text-xs sm:text-sm bg-primary text-primary-foreground gap-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Gửi thông tin tư vấn</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}
