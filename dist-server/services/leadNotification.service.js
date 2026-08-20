import nodemailer from "nodemailer";
import { env } from "../config/env.js";
export class LeadNotificationService {
    transporter = null;
    constructor() {
        this.initTransporter();
    }
    initTransporter() {
        // If SMTP host or user is provided
        if (env.SMTP_HOST) {
            const port = env.SMTP_PORT ? parseInt(env.SMTP_PORT, 10) : 587;
            const isSecure = env.SMTP_SECURE === "true" || port === 465;
            this.transporter = nodemailer.createTransport({
                host: env.SMTP_HOST,
                port,
                secure: isSecure,
                auth: env.SMTP_USER && env.SMTP_PASS ? {
                    user: env.SMTP_USER,
                    pass: env.SMTP_PASS,
                } : undefined,
            });
        }
        else if (env.SMTP_USER && env.SMTP_PASS) {
            // Default to Gmail service if user & pass provided without explicit host
            this.transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: env.SMTP_USER,
                    pass: env.SMTP_PASS,
                },
            });
        }
    }
    /**
     * Send notification to staff via Email
     */
    async notifyNewLead(lead) {
        const recipient = env.NOTIFICATION_EMAIL_TO || "arisieltsdeeplearning@gmail.com";
        const formattedDate = new Intl.DateTimeFormat("vi-VN", {
            dateStyle: "full",
            timeStyle: "medium",
            timeZone: "Asia/Ho_Chi_Minh",
        }).format(lead.createdAt);
        const subject = `🔔 [LEAD MỚI] Khách hàng ${lead.fullName} (${lead.phone}) yêu cầu tư vấn`;
        const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
          <div style="display: inline-block; padding: 6px 14px; background-color: #fee2e2; color: #dc2626; font-weight: 800; font-size: 12px; text-transform: uppercase; border-radius: 9999px; letter-spacing: 0.05em; margin-bottom: 8px;">
            Yêu Cầu Tư Vấn Mới
          </div>
          <h2 style="margin: 0; color: #0f172a; font-size: 22px; font-weight: 800;">HỌC VIỆN ARIS IELTS</h2>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Thông báo tự động từ hệ thống tiếp nhận khách hàng</p>
        </div>

        <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; width: 140px; font-weight: 600;">Họ và tên:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 700; font-size: 16px;">${lead.fullName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Số điện thoại:</td>
              <td style="padding: 8px 0;">
                <a href="tel:${lead.phone}" style="color: #dc2626; font-weight: 800; font-size: 16px; text-decoration: none;">${lead.phone}</a>
                <span style="font-size: 12px; color: #64748b; margin-left: 8px;">(Bấm để gọi)</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Email:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 500;">
                ${lead.email ? `<a href="mailto:${lead.email}" style="color: #2563eb; text-decoration: none;">${lead.email}</a>` : '<span style="color: #94a3b8; font-style: italic;">Chưa cung cấp</span>'}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Nguồn trang:</td>
              <td style="padding: 8px 0; color: #334155; font-weight: 600;">${lead.source || "contact_page"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Thời gian gửi:</td>
              <td style="padding: 8px 0; color: #334155;">${formattedDate}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 24px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #334155;">🎯 Mục tiêu / Lời nhắn của học viên:</h4>
          <div style="background-color: #fff; border-left: 4px solid #dc2626; padding: 12px 16px; font-size: 14px; color: #1e293b; background-color: #fef2f2; border-radius: 0 8px 8px 0; line-height: 1.6;">
            ${lead.goal ? lead.goal.replace(/\n/g, "<br/>") : '<span style="color: #94a3b8; font-style: italic;">Không có lời nhắn bổ sung</span>'}
          </div>
        </div>

        <div style="text-align: center; padding-top: 16px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px;">
          <p style="margin: 0;">Mã Lead: <strong style="font-family: monospace;">${lead.id}</strong></p>
          <p style="margin: 4px 0 0 0;">Vui lòng liên hệ hỗ trợ học viên trong vòng 2–4 giờ làm việc để đạt tỷ lệ chuyển đổi cao nhất.</p>
        </div>
      </div>
    `;
        const textContent = `
========================================
🔔 [LEAD MỚI] CÓ YÊU CẦU TƯ VẤN LỘ TRÌNH
========================================
Họ và tên: ${lead.fullName}
Số điện thoại: ${lead.phone}
Email: ${lead.email || "Không có"}
Mục tiêu / Câu hỏi: ${lead.goal || "Không có"}
Nguồn: ${lead.source || "contact_page"}
Thời gian: ${formattedDate}
Mã Lead: ${lead.id}
========================================
Vui lòng gọi điện tư vấn cho học viên sớm nhất.
    `.trim();
        // 1. Send via Nodemailer (if configured)
        if (this.transporter) {
            try {
                const fromAddress = env.SMTP_FROM || `"ARIS IELTS System" <${env.SMTP_USER || "no-reply@nextband.site"}>`;
                await this.transporter.sendMail({
                    from: fromAddress,
                    to: recipient,
                    subject,
                    text: textContent,
                    html: htmlContent,
                });
                console.log(`[LeadNotificationService] ✅ Successfully dispatched lead notification email to ${recipient}`);
            }
            catch (err) {
                console.error(`[LeadNotificationService] ❌ Failed to send lead email to ${recipient}:`, err?.message || err);
            }
        }
        else {
            console.warn(`[LeadNotificationService] ⚠️ SMTP credentials not yet set in .env. Notification prepared for [${recipient}]:\n` +
                `>>> LEAD ID: ${lead.id} | NAME: ${lead.fullName} | PHONE: ${lead.phone} | GOAL: ${lead.goal || "N/A"}`);
        }
        // 2. Dispatch to Telegram (if bot token & chat id configured)
        if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
            try {
                const telegramMessage = `🔔 *[LEAD MỚI] YÊU CẦU TƯ VẤN LỘ TRÌNH*\n\n` +
                    `👤 *Họ và tên:* ${lead.fullName}\n` +
                    `📞 *Số điện thoại:* \`${lead.phone}\`\n` +
                    `✉️ *Email:* ${lead.email || "Chưa có"}\n` +
                    `🎯 *Mục tiêu / Lời nhắn:* ${lead.goal || "Không có"}\n` +
                    `🌐 *Nguồn:* ${lead.source || "contact_page"}\n` +
                    `⏰ *Thời gian:* ${formattedDate}\n` +
                    `🆔 *Mã Lead:* \`${lead.id}\``;
                await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chat_id: env.TELEGRAM_CHAT_ID,
                        text: telegramMessage,
                        parse_mode: "Markdown",
                    }),
                });
                console.log(`[LeadNotificationService] ✅ Successfully sent Telegram alert for lead ${lead.id}`);
            }
            catch (tgErr) {
                console.error("[LeadNotificationService] ❌ Failed to send Telegram alert:", tgErr?.message || tgErr);
            }
        }
    }
}
export const leadNotificationService = new LeadNotificationService();
