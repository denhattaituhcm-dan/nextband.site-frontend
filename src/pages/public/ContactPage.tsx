import React from "react";
import { SectionContainer } from "@/components/public/SectionContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SEO } from "@/components/common/SEO";
import { MapPin, Mail, Phone, Clock, Send, Sparkles, MessageCircle } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="flex flex-col">
      <SEO
        title="Liên Hệ & Địa Chỉ Học Viện ARIS"
        description="Thông tin liên hệ, hotline 0933.319.693 và địa chỉ đào tạo trực tiếp của Học viện ARIS IELTS."
      />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-28 border-b border-border/80 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-blue-soft text-brand-blue border border-brand-blue/20 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            <span>Kết Nối &amp; Hỗ Trợ</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.12]">
            Liên hệ với Ban Học Thuật ARIS
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-foreground/85 font-normal leading-relaxed max-w-3xl mx-auto">
            Chúng tôi luôn sẵn sàng lắng nghe, giải đáp thắc mắc về các khóa học và hỗ trợ bạn xác định lộ trình học tập phù hợp nhất.
          </p>
        </div>
      </section>

      {/* Contact Info & Form Section */}
      <SectionContainer
        badge="Thông Tin Trực Tiếp"
        title="Gửi câu hỏi hoặc liên hệ trực tiếp"
        description="Bạn có thể đến trực tiếp cơ sở đào tạo, gọi qua hotline hoặc để lại thông tin để nhận phản hồi từ ban chuyên môn."
        background="default"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left max-w-6xl mx-auto">
          {/* Contact Info Col */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 rounded-3xl border border-border/80 bg-card space-y-6 shadow-2xs">
              <h3 className="font-black text-foreground text-2xl">
                Thông Tin Cơ Sở
              </h3>

              <div className="space-y-5 text-sm sm:text-base">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-brand-blue-soft text-brand-blue shrink-0">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-black text-foreground text-base">Địa Điểm Đào Tạo</div>
                    <div className="text-foreground/75 leading-relaxed mt-1">
                      68B Phan Bội Châu, phường Dĩ An, TP. Dĩ An, Tỉnh Bình Dương
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-brand-red-soft text-brand-red shrink-0">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-black text-foreground text-base">Hotline Tư Vấn</div>
                    <div className="text-brand-red font-black text-lg mt-1">
                      0933.319.693
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-brand-blue-soft text-brand-blue shrink-0">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-black text-foreground text-base">Hòm Thư Học Thuật</div>
                    <a
                      href="mailto:arisieltsdeeplearning@gmail.com"
                      className="text-foreground/85 font-bold hover:text-brand-red transition-colors block mt-1"
                    >
                      arisieltsdeeplearning@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-brand-blue-soft text-brand-blue shrink-0">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-black text-foreground text-base">Thời Gian Làm Việc</div>
                    <div className="text-foreground/75 mt-1">
                      Thứ Hai – Thứ Bảy: 08:00 – 21:00
                      <br />
                      Chủ Nhật: 08:00 – 17:00
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Col */}
          <div className="lg:col-span-7">
            <div className="p-8 sm:p-10 rounded-3xl border border-border/80 bg-card space-y-6 shadow-2xs">
              <div>
                <h3 className="font-black text-foreground text-2xl">
                  Nhận Tư Vấn Lộ Trình Cá Nhân
                </h3>
                <p className="text-sm sm:text-base text-foreground/75 mt-1">
                  Điền thông tin bên dưới, Ban Học Thuật ARIS sẽ liên hệ và tư vấn chặng học phù hợp với bạn.
                </p>
              </div>

              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name" className="text-sm font-bold">
                      Họ và tên
                    </Label>
                    <Input
                      id="contact-name"
                      placeholder="Nguyễn Văn A"
                      className="rounded-xl h-12 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone" className="text-sm font-bold">
                      Số điện thoại
                    </Label>
                    <Input
                      id="contact-phone"
                      placeholder="0912 345 678"
                      className="rounded-xl h-12 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-email" className="text-sm font-bold">
                    Email
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="email@example.com"
                    className="rounded-xl h-12 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-message" className="text-sm font-bold">
                    Mục tiêu điểm số hoặc câu hỏi của bạn
                  </Label>
                  <Textarea
                    id="contact-message"
                    rows={4}
                    placeholder="Ví dụ: Em muốn bắt đầu từ mất gốc và đạt mục tiêu 6.0 trong vòng 9 tháng..."
                    className="rounded-xl text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 rounded-2xl font-extrabold text-base bg-brand-red hover:bg-brand-red-hover text-white shadow-sm gap-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Gửi Thông Tin Nhận Tư Vấn</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}
