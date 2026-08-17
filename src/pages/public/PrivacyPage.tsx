import React from "react";
import { SectionContainer } from "@/components/public/SectionContainer";
import { SEO } from "@/components/common/SEO";
import { ShieldCheck, Lock, Eye, Database } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col">
      <SEO
        title="Chính Sách Bảo Mật Thông Tin — Học Viện ARIS"
        description="Cam kết bảo vệ dữ liệu cá nhân, thông tin bài thi và quyền riêng tư của học viên tại Học Viện ARIS."
      />

      <section className="pt-16 pb-14 border-b border-border/80 bg-background text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-blue-soft text-brand-blue border border-brand-blue/20 text-xs font-black uppercase tracking-wider">
            <Lock className="h-4 w-4" />
            <span>Quyền Riêng Tư &amp; Dữ Liệu</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
            Chính Sách Bảo Mật Thông Tin
          </h1>
          <p className="text-sm sm:text-base text-foreground/75 max-w-2xl mx-auto">
            Chúng tôi tôn trọng tuyệt đối quyền riêng tư và cam kết bảo vệ thông tin học viên bằng các tiêu chuẩn bảo mật cao nhất.
          </p>
        </div>
      </section>

      <SectionContainer background="default">
        <div className="max-w-4xl mx-auto space-y-10 text-left text-sm sm:text-base text-foreground/85 leading-relaxed">
          {/* Section 1 */}
          <div className="p-8 rounded-3xl border border-border/80 bg-card space-y-4 shadow-2xs">
            <h3 className="text-xl font-black text-foreground flex items-center gap-2.5">
              <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-brand-blue-soft text-brand-blue">01</span>
              <span>Mục Đích Thu Thập Dữ Liệu</span>
            </h3>
            <p>
              Học viện ARIS chỉ thu thập các thông tin cần thiết gồm: Họ tên, Số điện thoại, Email và lịch sử bài nộp nhằm phục vụ cho mục đích quản lý tiến độ học tập, chấm chữa bài và gửi thông báo kết quả khảo thí.
            </p>
          </div>

          {/* Section 2 */}
          <div className="p-8 rounded-3xl border border-border/80 bg-card space-y-4 shadow-2xs">
            <h3 className="text-xl font-black text-foreground flex items-center gap-2.5">
              <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-brand-blue-soft text-brand-blue">02</span>
              <span>Cam Kết Tuyệt Đối Không Bán Dữ Liệu</span>
            </h3>
            <p>
              ARIS cam kết không chia sẻ, mua bán hoặc tiết lộ thông tin cá nhân của học viên cho bất kỳ bên thứ ba nào vì mục đích thương mại hoặc quảng cáo trái phép. Mọi thông tin liên hệ chỉ được sử dụng nội bộ bởi Ban Học Thuật ARIS.
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-8 rounded-3xl border border-border/80 bg-card space-y-4 shadow-2xs">
            <h3 className="text-xl font-black text-foreground flex items-center gap-2.5">
              <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-brand-blue-soft text-brand-blue">03</span>
              <span>Bảo Vệ Bài Làm &amp; Lịch Sử Học Tập</span>
            </h3>
            <p>
              Dữ liệu bài viết, bài nói và nhận xét của giảng viên trên hệ thống NextBand được lưu trữ an toàn. Học viên có toàn quyền xem lại lịch sử bài làm hoặc yêu cầu trích xuất dữ liệu học tập cá nhân bất kỳ lúc nào.
            </p>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}
