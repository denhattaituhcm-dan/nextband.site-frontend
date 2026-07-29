import { useState } from "react";
import { invitationsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, KeyRound } from "lucide-react";

interface JoinClassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function JoinClassModal({ open, onOpenChange, onSuccess }: JoinClassModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await invitationsApi.joinByCode({ code: code.trim().toUpperCase() });
      toast({
        title: "Thành công!",
        description: res.message || "Bạn đã tham gia lớp học thành công.",
      });
      setCode("");
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Lỗi tham gia lớp",
        description: err.message || "Mã mời không đúng hoặc đã hết hạn.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <KeyRound className="h-5 w-5 text-primary" />
            Tham gia Lớp học mới
          </DialogTitle>
          <DialogDescription>
            Nhập Mã tham gia (VD: <span className="font-mono font-bold text-foreground">DREAM31</span>) do Giáo viên cấp để gia nhập Lớp học của bạn.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="VD: DREAM31"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="font-mono text-center text-lg tracking-wider uppercase h-12"
              maxLength={10}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleJoin} disabled={loading || !code.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Tham gia ngay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
