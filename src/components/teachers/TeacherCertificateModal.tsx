import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShieldCheck } from "lucide-react";

interface TeacherCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate?: {
    image: string;
    alt: string;
  };
  teacherName: string;
}

export function TeacherCertificateModal({
  isOpen,
  onClose,
  certificate,
  teacherName,
}: TeacherCertificateModalProps) {
  if (!certificate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] p-4 sm:p-6 overflow-hidden flex flex-col gap-4 bg-card border-border/80 rounded-2xl sm:rounded-3xl shadow-xl">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/60 pb-3 pr-8">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-brand-blue-soft text-brand-blue">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-foreground">
                Bảng điểm IELTS Test Report Form (TRF)
              </DialogTitle>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                Giảng viên: <span className="font-bold text-foreground">{teacherName}</span>
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto flex items-center justify-center p-1 sm:p-2 bg-muted/20 rounded-xl border border-border/40">
          <img
            src={certificate.image}
            alt={certificate.alt}
            loading="lazy"
            className="w-full max-h-[75vh] object-contain rounded-lg shadow-xs"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
