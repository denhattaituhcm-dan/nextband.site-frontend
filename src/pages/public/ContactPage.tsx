import React, { useState } from "react";
import { SectionContainer } from "@/components/public/SectionContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SEO } from "@/components/common/SEO";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { submitContactLead } from "@/lib/contactService";
import { toast } from "sonner";

export default function ContactPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<{ fullName: string; phone: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Vui lòng nhập họ và tên của bạn");
      return;
    }

    const cleanPhone = phone.trim().replace(/\s+/g, "");
    if (!cleanPhone || cleanPhone.length < 9) {
      toast.error("Vui lòng nhập số điện thoại hợp lệ (tối thiểu 9 số)");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitContactLead({
        fullName,
        phone: cleanPhone,
        email,
        goal,
        source: "contact_page",
      });

      if (res.success) {
        setSubmittedLead({ fullName, phone: cleanPhone });
        toast.success("Gửi yêu cầu tư vấn thành công!");
      }
    } catch (err: any) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại hoặc gọi trực tiếp qua Hotline 0933.319.693");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFullName("");
    setPhone("");
    setEmail("");
    setGoal("");
    setSubmittedLead(null);
  };

  return (
    <div className="flex flex-col">
      <SEO
        title="Liên Hệ & Địa Điểm — Học Viện ARIS"
        description="Thông tin liên hệ trực tiếp, địa chỉ cơ sở đào tạo và hotline tư vấn lộ trình học tập tại Học Viện ARIS."
      />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-28 border-b border-border/80 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-blue-soft text-brand-blue border border-brand-blue/20 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            <span>Kết Nối &amp; Hỗ Trợ</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.12]">
            Liên hệ với{" "}
            <span className="text-brand-blue block sm:inline">
              Ban Học Thuật ARIS
            </span>
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-foreground/85 font-normal leading-relaxed max-w-3xl mx-auto">
            Chúng tôi luôn sẵn sàng lắng nghe, giải đáp thắc mắc về các khóa học và hỗ trợ bạn xác định lộ trình học tập phù hợp nhất.
          </p>
        </div>
      </section>

      {/* Contact Details & Direct Form */}
      <SectionContainer
        badge="Thông Tin Trực Tiếp"
        title="Gửi câu hỏi hoặc liên hệ trực tiếp"
        description="Bạn có thể đến trực tiếp cơ sở đào tạo, gọi qua hotline hoặc để lại thông tin để nhận phản hồi từ ban chuyên môn."
        background="default"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 text-left">
          {/* Details Col */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 sm:p-10 rounded-3xl border border-border/80 bg-card space-y-8 shadow-2xs">
              <h3 className="font-black text-foreground text-2xl border-b border-border/60 pb-4">
                Thông Tin Cơ Sở
              </h3>

              <div className="space-y-6 text-sm sm:text-base">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-brand-blue-soft text-brand-blue shrink-0">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-black text-foreground text-base">Địa Điểm Đào Tạo</div>
                    <div className="text-foreground/75 mt-1 leading-relaxed">
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
                    <a
                      href="tel:0933319693"
                      className="text-brand-red font-black text-xl mt-1 block hover:underline"
                    >
                      0933.319.693
                    </a>
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
              {submittedLead ? (
                /* Success State */
                <div className="space-y-6 py-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-success/15 text-success mx-auto flex items-center justify-center">
                    <CheckCircle2 className="h-9 w-9" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl sm:text-3xl font-black text-foreground">
                      Đã Gửi Yêu Cầu Thành Công!
                    </h3>
                    <p className="text-sm sm:text-base text-foreground/80 max-w-md mx-auto leading-relaxed">
                      Cảm ơn <strong>{submittedLead.fullName}</strong>. Ban Học Thuật ARIS đã tiếp nhận thông tin và sẽ gọi điện qua số <strong>{submittedLead.phone}</strong> trong vòng 2–4 giờ làm việc.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-brand-blue-soft/50 border border-brand-blue/20 text-xs sm:text-sm text-foreground/80 font-bold max-w-md mx-auto">
                    Nếu bạn cần tư vấn khẩn cấp, vui lòng gọi trực tiếp hotline:{" "}
                    <a href="tel:0933319693" className="text-brand-red font-black underline">
                      0933.319.693
                    </a>
                  </div>

                  <div className="pt-4">
                    <Button
                      variant="outline"
                      onClick={handleResetForm}
                      className="rounded-2xl px-6 h-12 font-bold text-sm border-2 border-border/80 hover:bg-muted"
                    >
                      Gửi thêm thông tin khác
                    </Button>
                  </div>
                </div>
              ) : (
                /* Form Input State */
                <>
                  <div>
                    <h3 className="font-black text-foreground text-2xl">
                      Nhận Tư Vấn Lộ Trình Cá Nhân
                    </h3>
                    <p className="text-sm sm:text-base text-foreground/75 mt-1">
                      Điền thông tin bên dưới, Ban Học Thuật ARIS sẽ liên hệ và tư vấn chặng học phù hợp với bạn.
                    </p>
                  </div>

                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contact-name" className="text-sm font-bold">
                          Họ và tên *
                        </Label>
                        <Input
                          id="contact-name"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Ví dụ: Nguyễn Văn An"
                          className="rounded-xl h-12 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-phone" className="text-sm font-bold">
                          Số điện thoại *
                        </Label>
                        <Input
                          id="contact-phone"
                          required
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Ví dụ: 0912 345 678"
                          className="rounded-xl h-12 text-sm font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact-email" className="text-sm font-bold">
                        Email (nếu có)
                      </Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="Ví dụ: Em muốn bắt đầu từ mất gốc và đạt mục tiêu 6.0 trong vòng 9 tháng..."
                        className="rounded-xl text-sm"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-14 rounded-2xl font-extrabold text-base bg-brand-red hover:bg-brand-red-hover text-white shadow-sm gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Đang gửi thông tin...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Gửi Thông Tin Nhận Tư Vấn</span>
                        </>
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}
