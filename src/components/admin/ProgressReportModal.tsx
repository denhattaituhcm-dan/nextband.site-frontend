import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy, Download, Sparkles, Check, FileText } from "lucide-react";
import { toast } from "sonner";
import { ProgressReportData } from "@/types/progressReport";

interface ProgressReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ProgressReportData;
}

export function ProgressReportModal({ open, onOpenChange, data }: ProgressReportModalProps) {
  const [note, setNote] = useState(data.teacherNote || "");
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const studentName = data.student?.name || "Học viên";
  const className = data.student?.className || "Lớp học";
  const teacherName = data.student?.teacherName || "Giảng viên phụ trách";
  const periodStr = `${data.period?.from || ""} — ${data.period?.to || ""}`;

  /**
   * Draw the Progress Report directly onto an HTML5 Canvas with sharp high-res rendering
   */
  const drawReportToCanvas = (): HTMLCanvasElement => {
    const width = 800;
    const height = 1000;
    const canvas = document.createElement("canvas");
    canvas.width = width * 2; // 2x retina sharpness
    canvas.height = height * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context not available");

    ctx.scale(2, 2);

    // 1. Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Outer subtle border
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    // 2. Header Banner
    ctx.fillStyle = "#0c1e38";
    ctx.fillRect(20, 20, width - 40, 110);

    // Brand Wordmark
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px 'Inter', sans-serif";
    ctx.fillText("ARIS IELTS", 44, 58);

    ctx.fillStyle = "#93c5fd";
    ctx.font = "bold 15px 'Inter', sans-serif";
    ctx.fillText("BÁO CÁO TIẾN ĐỘ HỌC TẬP", 44, 82);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "12px 'Inter', sans-serif";
    ctx.fillText(`Kỳ báo cáo: ${periodStr}`, 44, 106);

    let currY = 160;

    // 3. Student Identification Box
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(40, currY, width - 80, 75);
    ctx.strokeStyle = "#e2e8f0";
    ctx.strokeRect(40, currY, width - 80, 75);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 16px 'Inter', sans-serif";
    ctx.fillText(`HỌC VIÊN: ${studentName.toUpperCase()}`, 56, currY + 28);

    ctx.fillStyle = "#475569";
    ctx.font = "13px 'Inter', sans-serif";
    ctx.fillText(`• Lớp học: ${className}`, 56, currY + 54);
    ctx.fillText(`• Giảng viên: ${teacherName}`, 340, currY + 54);

    currY += 95;

    // 4. Section: 1. CHUYÊN CẦN (if exists)
    if (data.attendance && data.attendance.total > 0) {
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 14px 'Inter', sans-serif";
      ctx.fillText("1. CHUYÊN CẦN LỚP HỌC", 40, currY + 16);

      ctx.fillStyle = "#f1f5f9";
      ctx.fillRect(40, currY + 26, width - 80, 48);

      ctx.fillStyle = "#1e293b";
      ctx.font = "13px 'Inter', sans-serif";
      const attRate = Math.round((data.attendance.present / data.attendance.total) * 100);
      ctx.fillText(
        `• Có mặt: ${data.attendance.present} / ${data.attendance.total} buổi  (${attRate}%)   |   Vắng: ${data.attendance.absent} buổi`,
        56,
        currY + 55
      );

      currY += 90;
    }

    // 5. Section: 2. BÀI TẬP VỀ NHÀ
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 14px 'Inter', sans-serif";
    ctx.fillText(data.attendance ? "2. BÀI TẬP VỀ NHÀ" : "1. BÀI TẬP VỀ NHÀ", 40, currY + 16);

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(40, currY + 26, width - 80, 68);
    ctx.strokeStyle = "#e2e8f0";
    ctx.strokeRect(40, currY + 26, width - 80, 68);

    ctx.fillStyle = "#059669";
    ctx.font = "bold 13px 'Inter', sans-serif";
    ctx.fillText(`✓ Đã hoàn thành: ${data.homework.submitted} bài`, 56, currY + 52);

    if (data.homework.overdue > 0) {
      ctx.fillStyle = "#e11d48";
      ctx.fillText(`⚠ Đang quá hạn: ${data.homework.overdue} bài`, 260, currY + 52);
    } else {
      ctx.fillStyle = "#64748b";
      ctx.fillText(`• Đang tiến hành: ${data.homework.pending} bài`, 260, currY + 52);
    }

    if (data.homework.overdueTitles && data.homework.overdueTitles.length > 0) {
      ctx.fillStyle = "#e11d48";
      ctx.font = "12px 'Inter', sans-serif";
      ctx.fillText(`  (Cần làm bù: ${data.homework.overdueTitles.join(", ")})`, 56, currY + 76);
    } else {
      ctx.fillStyle = "#64748b";
      ctx.font = "12px 'Inter', sans-serif";
      ctx.fillText("  (Tiến độ nộp bài tốt, không có bài tập trễ hạn)", 56, currY + 76);
    }

    currY += 110;

    // 6. Section: KẾT QUẢ CÁC BÀI GẦN NHẤT
    const secNum = data.attendance ? "3" : "2";
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 14px 'Inter', sans-serif";
    ctx.fillText(`${secNum}. KẾT QUẢ ĐÁNH GIÁ GẦN ĐÂY`, 40, currY + 16);

    if (data.recentResults && data.recentResults.length > 0) {
      data.recentResults.forEach((res, idx) => {
        const itemY = currY + 28 + idx * 36;
        ctx.fillStyle = idx % 2 === 0 ? "#f8fafc" : "#ffffff";
        ctx.fillRect(40, itemY, width - 80, 32);

        ctx.fillStyle = "#1e293b";
        ctx.font = "13px 'Inter', sans-serif";
        ctx.fillText(`• ${res.title}`, 56, itemY + 21);

        if (res.score != null) {
          ctx.fillStyle = "#0284c7";
          ctx.font = "bold 13px 'Inter', sans-serif";
          ctx.fillText(`${res.score}`, width - 140, itemY + 21);
        }
      });
      currY += 28 + data.recentResults.length * 36 + 20;
    } else {
      ctx.fillStyle = "#64748b";
      ctx.font = "italic 13px 'Inter', sans-serif";
      ctx.fillText("Chưa có bản ghi điểm bài tập gần đây", 56, currY + 45);
      currY += 65;
    }

    // 7. Section: LỜI NHẮN CỦA THẦY / CÔ
    const finalSecNum = data.attendance ? "4" : "3";
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 14px 'Inter', sans-serif";
    ctx.fillText(`${finalSecNum}. LỜI NHẮN CỦA THẦY / CÔ`, 40, currY + 16);

    ctx.fillStyle = "#fefce8";
    ctx.fillRect(40, currY + 26, width - 80, 60);
    ctx.strokeStyle = "#fef08a";
    ctx.strokeRect(40, currY + 26, width - 80, 60);

    ctx.fillStyle = "#713f12";
    ctx.font = "italic 12.5px 'Inter', sans-serif";
    const noteText = note.trim() || "Học viên duy trì thái độ học tập nghiêm túc và hoàn thành các bài học theo đúng lộ trình.";
    ctx.fillText(`"${noteText}"`, 56, currY + 58);

    currY += 105;

    // 8. Footer & Branding
    ctx.strokeStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(40, height - 60);
    ctx.lineTo(width - 40, height - 60);
    ctx.stroke();

    ctx.fillStyle = "#64748b";
    ctx.font = "11px 'Inter', sans-serif";
    ctx.fillText("HỌC VIỆN NGÔN NGỮ HỌC THUẬT ARIS — HỌC TIẾNG ANH TỪ BẢN CHẤT", 44, height - 38);
    ctx.fillText(`Ngày tạo: ${data.generatedAt}`, width - 160, height - 38);

    return canvas;
  };

  /**
   * Action 1 (Primary): Copy Image to Clipboard
   */
  const handleCopyImage = async () => {
    setIsExporting(true);
    try {
      const canvas = drawReportToCanvas();
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error("Không thể tạo ảnh báo cáo");
          setIsExporting(false);
          return;
        }

        try {
          if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob }),
            ]);
            toast.success("Đã sao chép ảnh báo cáo! Hãy mở Zalo và nhấn Ctrl+V để gửi.");
          } else {
            // Fallback for older browsers: download image
            handleDownloadImage();
          }
        } catch (clipErr) {
          console.warn("Clipboard copy failed, fallback to download:", clipErr);
          handleDownloadImage();
        } finally {
          setIsExporting(false);
        }
      }, "image/png");
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi tạo ảnh");
      setIsExporting(false);
    }
  };

  /**
   * Action 2 (Secondary): Download PNG
   */
  const handleDownloadImage = () => {
    try {
      const canvas = drawReportToCanvas();
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      const safeName = studentName.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/g, "_");
      a.download = `Bao_cao_tien_do_${safeName}.png`;
      a.href = dataUrl;
      a.click();
      toast.success("Đã tải tệp ảnh PNG về máy.");
    } catch (err: any) {
      toast.error("Không thể tải ảnh: " + err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Báo Cáo Tiến Độ Học Tập (Gửi Phụ Huynh)
          </DialogTitle>
        </DialogHeader>

        {/* LIVE CARD PREVIEW (100% Polite Vietnamese) */}
        <div
          ref={cardRef}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 space-y-4 shadow-sm text-slate-900 dark:text-slate-100"
        >
          {/* Header */}
          <div className="bg-[#0c1e38] text-white p-4 rounded-lg space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-300">ARIS IELTS</div>
            <div className="text-base font-extrabold">BÁO CÁO TIẾN ĐỘ HỌC TẬP</div>
            <div className="text-[11px] text-slate-300">Kỳ báo cáo: {periodStr}</div>
          </div>

          {/* Student Info */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1">
            <div className="font-bold text-sm text-slate-900 dark:text-white">
              HỌC VIÊN: {studentName.toUpperCase()}
            </div>
            <div className="flex flex-wrap gap-4 text-slate-600 dark:text-slate-300 pt-0.5">
              <span>• Lớp: <strong>{className}</strong></span>
              <span>• Giảng viên: <strong>{teacherName}</strong></span>
            </div>
          </div>

          {/* Attendance (Only if recorded) */}
          {data.attendance && data.attendance.total > 0 && (
            <div className="space-y-1 text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200">1. CHUYÊN CẦN LỚP HỌC</div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded border text-slate-700 dark:text-slate-300">
                • Có mặt: <strong>{data.attendance.present}/{data.attendance.total} buổi</strong> ({Math.round((data.attendance.present / data.attendance.total) * 100)}%) | Vắng: {data.attendance.absent} buổi
              </div>
            </div>
          )}

          {/* Homework */}
          <div className="space-y-1 text-xs">
            <div className="font-bold text-slate-800 dark:text-slate-200">
              {data.attendance ? "2. BÀI TẬP VỀ NHÀ" : "1. BÀI TẬP VỀ NHÀ"}
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded border space-y-1">
              <div className="flex gap-4">
                <span className="text-emerald-600 font-bold">✓ Đã hoàn thành: {data.homework.submitted} bài</span>
                {data.homework.overdue > 0 ? (
                  <span className="text-rose-600 font-bold">⚠ Quá hạn: {data.homework.overdue} bài</span>
                ) : (
                  <span className="text-slate-500">• Đang làm: {data.homework.pending} bài</span>
                )}
              </div>
              {data.homework.overdueTitles && data.homework.overdueTitles.length > 0 && (
                <div className="text-[11px] text-rose-600 font-medium">
                  Cần làm bù: {data.homework.overdueTitles.join(", ")}
                </div>
              )}
            </div>
          </div>

          {/* Recent results */}
          {data.recentResults && data.recentResults.length > 0 && (
            <div className="space-y-1 text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200">
                {data.attendance ? "3. KẾT QUẢ ĐÁNH GIÁ GẦN ĐÂY" : "2. KẾT QUẢ ĐÁNH GIÁ GẦN ĐÂY"}
              </div>
              <div className="divide-y border rounded bg-slate-50/50 dark:bg-slate-900/40">
                {data.recentResults.map((res, idx) => (
                  <div key={idx} className="p-2 flex items-center justify-between">
                    <span className="text-slate-800 dark:text-slate-200">• {res.title}</span>
                    {res.score != null && (
                      <span className="font-bold text-sky-600 dark:text-sky-400">{res.score}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Note Input */}
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {data.attendance ? "4. LỜI NHẮN CỦA THẦY / CÔ" : "3. LỜI NHẮN CỦA THẦY / CÔ"}
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập 1-3 câu nhận xét riêng gửi phụ huynh (tùy chọn)..."
              className="text-xs min-h-[65px] rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200"
            />
          </div>

          {/* Footer watermark */}
          <div className="pt-2 border-t text-[11px] text-slate-400 flex items-center justify-between">
            <span>Học Viện ARIS — Học Tiếng Anh Từ Bản Chất</span>
            <span>{data.generatedAt}</span>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl font-medium"
          >
            Đóng
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadImage}
            className="rounded-xl font-bold gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Tải ảnh (.PNG)
          </Button>

          <Button
            variant="default"
            size="sm"
            disabled={isExporting}
            onClick={handleCopyImage}
            className="rounded-xl font-bold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          >
            <Copy className="w-3.5 h-3.5" />
            {isExporting ? "Đang sao chép..." : "Sao chép ảnh (Dán vào Zalo)"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
