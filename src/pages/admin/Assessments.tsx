import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assessmentAdminApi, AdminAssessmentItem } from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Phone,
  RefreshCw,
  Edit3,
  Inbox,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  Mic,
  Send,
  Copy,
  ExternalLink,
  BookOpen,
  Volume2,
  Clock,
  UserCheck,
  Check,
  Award,
  Play,
  Pause,
} from "lucide-react";
import { toast } from "sonner";

interface SpeakingReviewPlayerProps {
  title: string;
  audioUrl: string;
  onInsertTimestampTag?: (tagText: string) => void;
}

function SpeakingReviewPlayer({ title, audioUrl, onInsertTimestampTag }: SpeakingReviewPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [notes, setNotes] = useState("");

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const jump = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration || 9999, audioRef.current.currentTime + seconds));
  };

  const changeSpeed = (rate: number) => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const handleTag = (type: string) => {
    const timeStr = formatTime(currentTime);
    const tag = `[${timeStr} - ${type}: ]`;
    setNotes((prev) => (prev ? `${prev}\n${tag}` : tag));
    if (onInsertTimestampTag) {
      onInsertTimestampTag(`[${timeStr} - ${type}]`);
    }
    toast.success(`Đã gắn mốc ${timeStr} (${type})`);
  };

  return (
    <div className="p-5 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-brand-blue" />
          <h4 className="font-extrabold text-sm text-foreground">{title}</h4>
        </div>
        <a
          href={audioUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
        >
          <span>Tải file gốc</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Scrubber & Time */}
      <div className="space-y-1.5 bg-muted/40 p-3.5 rounded-xl border border-border">
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span className="font-bold text-foreground">{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={(e) => {
            const val = Number(e.target.value);
            setCurrentTime(val);
            if (audioRef.current) audioRef.current.currentTime = val;
          }}
          className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
        />

        {/* Player Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => jump(-5)}
              className="h-8 px-2.5 text-xs font-bold gap-1 rounded-lg"
              title="Lùi 5 giây"
            >
              -5s
            </Button>
            <Button
              type="button"
              size="sm"
              variant={isPlaying ? "default" : "outline"}
              onClick={togglePlay}
              className="h-8 px-4 text-xs font-bold gap-1.5 rounded-lg"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? "Tạm dừng" : "Phát"}</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => jump(5)}
              className="h-8 px-2.5 text-xs font-bold gap-1 rounded-lg"
              title="Tiến 5 giây"
            >
              +5s
            </Button>
          </div>

          {/* Speed selector */}
          <div className="flex items-center gap-1 bg-background p-0.5 rounded-lg border border-border text-xs font-mono">
            {[0.75, 1, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => changeSpeed(rate)}
                className={`px-2 py-1 rounded-md font-bold transition-all ${
                  playbackRate === rate
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Timestamp Error Tagging */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-foreground uppercase tracking-wider">
            Gắn mốc thời gian đánh giá lỗi ({formatTime(currentTime)}):
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleTag("Phát âm (Pronunciation)")}
            className="h-7 text-xs font-semibold rounded-lg hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400"
          >
            + Phát âm
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleTag("Ngữ pháp (Grammar)")}
            className="h-7 text-xs font-semibold rounded-lg hover:border-red-500 hover:text-red-600 dark:hover:text-red-400"
          >
            + Ngữ pháp
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleTag("Từ vựng (Vocabulary)")}
            className="h-7 text-xs font-semibold rounded-lg hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
          >
            + Từ vựng
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleTag("Độ trôi chảy (Fluency)")}
            className="h-7 text-xs font-semibold rounded-lg hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            + Độ trôi chảy
          </Button>
        </div>
      </div>

      {/* Teacher Dictation / Transcript / Notes Box */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-muted-foreground flex items-center justify-between">
          <span>Ghi chú / Transcript bài nói của giáo viên (Draft Note):</span>
          {notes.trim().length > 0 && (
            <span className="text-[11px] text-emerald-600 font-semibold">Đã ghi chú</span>
          )}
        </Label>
        <Textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={`Gõ lại câu nói cần chú ý hoặc bấm các nút gắn mốc thời gian ở trên...\nVí dụ: [00:15 - Phát âm: Nuốt đuôi /s/ ở từ 'students']`}
          className="rounded-xl text-xs font-mono leading-relaxed"
        />
      </div>
    </div>
  );
}

const GRADING_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; badgeVariant: "default" | "secondary" | "outline" | "destructive" }
> = {
  PENDING: {
    label: "Chờ chấm",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200",
    badgeVariant: "outline",
  },
  IN_PROGRESS: {
    label: "Đang chấm",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200",
    badgeVariant: "secondary",
  },
  GRADED_SENT_ZALO: {
    label: "Đã trả kết quả Zalo",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200",
    badgeVariant: "default",
  },
};

export default function AdminAssessments() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Detail Modal Form state
  const [editGradingStatus, setEditGradingStatus] = useState<"PENDING" | "IN_PROGRESS" | "GRADED_SENT_ZALO">("PENDING");
  const [editTeacher, setEditTeacher] = useState("");
  const [editTeacherNotes, setEditTeacherNotes] = useState("");
  const [activeTab, setActiveTab] = useState("writing");
  const [copiedZalo, setCopiedZalo] = useState(false);

  const queryClient = useQueryClient();

  // 1. Fetch Assessment list
  const {
    data: assessmentData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin_assessments", search, statusFilter],
    queryFn: () =>
      assessmentAdminApi.list({
        search: search.trim() || undefined,
        gradingStatus: statusFilter !== "ALL" ? statusFilter : undefined,
      }),
    refetchInterval: 30000,
  });

  const items = assessmentData?.data || [];

  // 2. Fetch Single Assessment Detail when opened
  const { data: detailData, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["admin_assessment_detail", selectedSessionId],
    queryFn: () => assessmentAdminApi.getById(selectedSessionId!),
    enabled: !!selectedSessionId && isDetailOpen,
  });

  // 3. Mutation to update grading review
  const updateMutation = useMutation({
    mutationFn: async (payload: {
      gradingStatus?: "PENDING" | "IN_PROGRESS" | "GRADED_SENT_ZALO";
      assignedTeacher?: string;
      teacherNotes?: string;
    }) => {
      if (!selectedSessionId) return;
      return assessmentAdminApi.update(selectedSessionId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_assessments"] });
      queryClient.invalidateQueries({ queryKey: ["admin_assessment_detail", selectedSessionId] });
      toast.success("Cập nhật thông tin chấm bài thành công!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Không thể cập nhật bài khảo thí");
    },
  });

  const handleOpenDetail = (item: AdminAssessmentItem) => {
    setSelectedSessionId(item.id);
    setEditGradingStatus(item.gradingStatus || "PENDING");
    setEditTeacher(item.assignedTeacher || "");
    setEditTeacherNotes(item.teacherNotes || "");
    setIsDetailOpen(true);
  };

  const handleSaveReview = () => {
    updateMutation.mutate({
      gradingStatus: editGradingStatus,
      assignedTeacher: editTeacher,
      teacherNotes: editTeacherNotes,
    });
  };

  const handleQuickStatusChange = (item: AdminAssessmentItem, newStatus: any) => {
    assessmentAdminApi.update(item.id, { gradingStatus: newStatus }).then(() => {
      queryClient.invalidateQueries({ queryKey: ["admin_assessments"] });
      toast.success("Đã cập nhật trạng thái bài khảo thí");
    });
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "N/A";
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(d);
    } catch {
      return isoString;
    }
  };

  const cleanZaloPhone = (phoneStr: string) => {
    return phoneStr.replace(/\D/g, "");
  };

  // Generate Zalo Message Template
  const getZaloTemplateText = () => {
    if (!detailData) return "";
    const session = detailData.session || {};
    const result = detailData.result || {};
    const obj = result.objectiveBreakdown || {};
    const aris = result.arisLevel || {};

    const name = session.candidateName || "bạn";
    const dateStr = session.submittedAt ? formatDate(session.submittedAt) : "hôm nay";
    const rawScore = obj.rawScore != null ? `${obj.rawScore}/${obj.totalQuestions || 35}` : "N/A";
    const listeningStr = obj.listening ? `${obj.listening.correct}/${obj.listening.total}` : "N/A";
    const readingStr = obj.reading ? `${obj.reading.correct}/${obj.reading.total}` : "N/A";
    const grammarStr = obj.grammar ? `${obj.grammar.correct}/${obj.grammar.total}` : "N/A";
    const levelStr = aris.levelTitle || "Đang phân tích";
    const bandStr = aris.estimatedIeltsRange || "IELTS 5.0 - 6.5";
    const courseStr = aris.recommendedCourse?.title || "Khóa học phù hợp";

    return `Chào ${name}, Ban Chuyên Môn ARIS IELTS gửi bạn kết quả bài Khảo thí 4 Kỹ Năng thực hiện ngày ${dateStr}:

📊 1. KẾT QUẢ TRẮC NGHIỆM:
• Tổng điểm: ${rawScore} câu đúng
• Listening: ${listeningStr}
• Reading: ${readingStr}
• Grammar & Vocab: ${grammarStr}

🎯 2. ĐỊNH VỊ TRÌNH ĐỘ ARIS:
• Phân hạng: ${levelStr}
• Ước lượng: ${bandStr}
• Khóa học đề xuất: ${courseStr}

✍️ 3. NHẬN XÉT WRITING & SPEAKING TỪ GIÁO VIÊN:
${editTeacherNotes.trim() ? editTeacherNotes.trim() : "Giáo viên đánh giá bài làm có cấu trúc rõ ràng, cần lưu ý thêm các lỗi ngữ pháp và nối âm tự nhiên."}

Nếu bạn cần tư vấn chi tiết hơn về bài sửa hoặc lộ trình học, hãy nhắn lại ngay cho ARIS qua Zalo này nhé!`;
  };

  const handleCopyZaloTemplate = () => {
    const text = getZaloTemplateText();
    navigator.clipboard.writeText(text);
    setCopiedZalo(true);
    toast.success("Đã sao chép nội dung tin nhắn Zalo vào bộ nhớ đệm!");
    setTimeout(() => setCopiedZalo(false), 2500);
  };

  // Summary counts
  const totalCount = items.length;
  const pendingCount = items.filter((i) => i.gradingStatus === "PENDING").length;
  const inProgressCount = items.filter((i) => i.gradingStatus === "IN_PROGRESS").length;
  const gradedCount = items.filter((i) => i.gradingStatus === "GRADED_SENT_ZALO").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Khảo Thí Thử (Entrance Assessments)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản trị bài nộp test 4 kỹ năng, xem bài viết Writing, nghe bài nói Speaking và gửi phản hồi Zalo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
          <span className="text-xs font-bold text-muted-foreground uppercase">Tổng bài nộp</span>
          <div className="text-2xl font-black text-foreground">{totalCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
          <span className="text-xs font-bold text-amber-600 uppercase">Chờ chấm</span>
          <div className="text-2xl font-black text-amber-600">{pendingCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
          <span className="text-xs font-bold text-blue-600 uppercase">Đang chấm</span>
          <div className="text-2xl font-black text-blue-600">{inProgressCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
          <span className="text-xs font-bold text-emerald-600 uppercase">Đã trả Zalo</span>
          <div className="text-2xl font-black text-emerald-600">{gradedCount}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-4 rounded-2xl border border-border">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo Tên thí sinh, Số điện thoại Zalo, Mã session..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background h-10 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px] h-10 rounded-xl bg-background">
              <SelectValue placeholder="Lọc trạng thái chấm" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ALL">Tất cả trạng thái ({totalCount})</SelectItem>
              <SelectItem value="PENDING">🟡 Chờ chấm ({pendingCount})</SelectItem>
              <SelectItem value="IN_PROGRESS">🔵 Đang chấm ({inProgressCount})</SelectItem>
              <SelectItem value="GRADED_SENT_ZALO">🟢 Đã trả kết quả Zalo ({gradedCount})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Inbox Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm">Đang tải danh sách bài khảo thí...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground space-y-3">
            <Inbox className="w-12 h-12 mx-auto text-muted-foreground/50" />
            <div>
              <p className="font-semibold text-foreground">Chưa có bài khảo thí nào</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Khi học viên hoàn thành bài test 4 kỹ năng, bài nộp sẽ xuất hiện ngay tại đây.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Thí sinh</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Mục tiêu & Thời gian</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Trắc nghiệm</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Tự luận</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng thái chấm</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Giáo viên</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const statusInfo = GRADING_STATUS_CONFIG[item.gradingStatus] || GRADING_STATUS_CONFIG.PENDING;
                  const rawScore = item.objectiveScore?.rawScore ?? item.objectiveScore?.rawCorrect;
                  const totalQs = item.objectiveScore?.totalQuestions || 35;
                  const rawScoreText = rawScore != null ? `${rawScore}/${totalQs}` : "Chưa chấm";

                  return (
                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                      {/* Candidate Name & Zalo */}
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-bold text-foreground text-sm">{item.candidateName}</p>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`https://zalo.me/${cleanZaloPhone(item.phone)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue hover:underline bg-brand-blue/10 px-2 py-0.5 rounded-md"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Zalo: {item.phone}</span>
                            </a>
                          </div>
                        </div>
                      </TableCell>

                      {/* Target Band & Submission Date */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-foreground block">
                            {item.targetBand || "Chưa xác định"}
                          </span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(item.submittedAt || item.createdAt)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Objective Score & Level */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="font-black text-sm text-foreground">
                            {rawScoreText}
                          </div>
                          {item.arisLevel && (
                            <span className="text-[11px] font-medium text-brand-red block truncate max-w-[160px]">
                              {item.arisLevel.levelTitle}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Subjective Status (Writing & Speaking) */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {item.hasWriting ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                              <FileText className="w-3 h-3" />
                              <span>Writing ({item.writingLength} ký tự)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/60">
                              <FileText className="w-3 h-3" />
                              <span>Không có Writing</span>
                            </span>
                          )}

                          {item.hasSpeaking ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600">
                              <Mic className="w-3 h-3" />
                              <span>Speaking (Có audio)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/60">
                              <Mic className="w-3 h-3" />
                              <span>Không có Speaking</span>
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Grading Status Selector */}
                      <TableCell>
                        <Select
                          value={item.gradingStatus || "PENDING"}
                          onValueChange={(val) => handleQuickStatusChange(item, val)}
                        >
                          <SelectTrigger className="h-8 w-[150px] text-xs font-bold rounded-lg border">
                            <SelectValue>
                              <span className="flex items-center gap-1.5">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    item.gradingStatus === "PENDING"
                                      ? "bg-amber-500"
                                      : item.gradingStatus === "IN_PROGRESS"
                                      ? "bg-blue-500"
                                      : "bg-emerald-500"
                                  }`}
                                />
                                {statusInfo.label}
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="rounded-xl text-xs">
                            <SelectItem value="PENDING">🟡 Chờ chấm</SelectItem>
                            <SelectItem value="IN_PROGRESS">🔵 Đang chấm</SelectItem>
                            <SelectItem value="GRADED_SENT_ZALO">🟢 Đã trả Zalo</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* Assigned Teacher */}
                      <TableCell className="max-w-[140px]">
                        <span className="text-xs text-foreground truncate block">
                          {item.assignedTeacher || (
                            <span className="italic text-muted-foreground/60">Chưa gán</span>
                          )}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleOpenDetail(item)}
                          className="h-8 px-3 text-xs font-bold bg-brand-red hover:bg-brand-red-hover text-white gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Xem & Chấm bài</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DETAILED SUBMISSION INSPECTION DIALOG                                      */}
      {/* ========================================================================= */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-6 rounded-3xl overflow-hidden">
          <DialogHeader className="border-b border-border pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono font-bold uppercase text-brand-blue border-brand-blue/30 bg-brand-blue/5">
                    Mã Session: #{selectedSessionId}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    • Nộp lúc: {detailData?.session?.submittedAt ? formatDate(detailData.session.submittedAt) : "N/A"}
                  </span>
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-black text-foreground mt-1">
                  Bài Làm: {detailData?.session?.candidateName || "Thí sinh"}
                </DialogTitle>
              </div>

              {/* Direct Zalo / Phone Quick Actions */}
              {detailData?.session?.phone && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      window.open(`https://zalo.me/${cleanZaloPhone(detailData.session.phone)}`, "_blank")
                    }
                    className="h-9 px-3.5 bg-[#0068FF] hover:bg-[#0057d9] text-white font-bold text-xs gap-1.5 rounded-xl shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Mở Zalo Thí Sinh</span>
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="py-24 text-center text-muted-foreground space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-sm font-semibold">Đang tải toàn bộ bài làm và câu trả lời...</p>
            </div>
          ) : detailData ? (
            <div className="flex-1 overflow-y-auto pr-1 py-2 space-y-4">
              {/* Quick Profile & Objective Score Strip */}
              <div className="p-4 rounded-2xl bg-muted/50 border border-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block">SĐT Zalo:</span>
                  <strong className="text-foreground text-sm">{detailData.session?.phone}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Mục tiêu Band:</span>
                  <strong className="text-brand-red text-sm">{detailData.session?.targetBand || "Chưa xác định"}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Điểm Trắc Nghiệm:</span>
                  <strong className="text-brand-blue text-sm">
                    {detailData.result?.objectiveBreakdown?.rawScore ?? 0} /{" "}
                    {detailData.result?.objectiveBreakdown?.totalQuestions ?? 35} câu
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Định vị Cấp độ:</span>
                  <strong className="text-foreground truncate block">
                    {detailData.result?.arisLevel?.levelTitle || "N/A"}
                  </strong>
                </div>
              </div>

              {/* Tabs for All 5 Skills + Dedicated Grading Tab */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-6 h-11 p-1 rounded-2xl bg-muted">
                  <TabsTrigger value="listening" className="rounded-xl text-xs font-bold gap-1">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">1. Nghe</span>
                    <span className="sm:hidden">Nghe</span>
                  </TabsTrigger>
                  <TabsTrigger value="reading" className="rounded-xl text-xs font-bold gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">2. Đọc</span>
                    <span className="sm:hidden">Đọc</span>
                  </TabsTrigger>
                  <TabsTrigger value="grammar" className="rounded-xl text-xs font-bold gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">3. Ngữ pháp</span>
                    <span className="sm:hidden">NP</span>
                  </TabsTrigger>
                  <TabsTrigger value="writing" className="rounded-xl text-xs font-bold gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">4. Viết</span>
                    <span className="sm:hidden">Viết</span>
                  </TabsTrigger>
                  <TabsTrigger value="speaking" className="rounded-xl text-xs font-bold gap-1">
                    <Mic className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">5. Nói</span>
                    <span className="sm:hidden">Nói</span>
                  </TabsTrigger>
                  <TabsTrigger value="grading" className="rounded-xl text-xs font-bold gap-1 text-brand-red data-[state=active]:text-brand-red">
                    <Award className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Chấm &amp; Trả Zalo</span>
                    <span className="sm:hidden">Chấm</span>
                  </TabsTrigger>
                </TabsList>

                {/* 🎧 TAB 1: LISTENING */}
                <TabsContent value="listening" className="space-y-4 pt-3 text-left">
                  {detailData.testPayload?.skills?.listening?.audioUrl && (
                    <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold uppercase text-muted-foreground flex items-center gap-1.5">
                          <Volume2 className="w-4 h-4 text-brand-blue" />
                          Audio Bài Nghe (Listening)
                        </span>
                        <Badge variant="outline" className="text-[11px] font-mono">
                          Section Audio
                        </Badge>
                      </div>
                      <audio controls className="w-full h-10" src={detailData.testPayload.skills.listening.audioUrl}>
                        Trình duyệt không hỗ trợ phát audio.
                      </audio>
                    </div>
                  )}

                  <div className="space-y-3">
                    {detailData.questionBreakdown?.filter((q: any) => q.skill === "listening").map((q: any, idx: number) => {
                      const isMultiBlank = !!q.parentQuestionId;
                      const hasPrompt = q.prompt && (!isMultiBlank || q.blankIndex === 0);

                      return (
                        <div
                          key={q.id || idx}
                          className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
                            q.isCorrect
                              ? "bg-emerald-500/5 border-emerald-500/20"
                              : q.studentAnswer != null && q.studentAnswer !== ""
                              ? "bg-destructive/5 border-destructive/20"
                              : "bg-muted/40 border-border"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-foreground text-sm">
                              Câu {idx + 1} {q.blankLabel ? `• ${q.blankLabel}` : ""}
                            </span>
                            {q.isCorrect ? (
                              <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                                Chính xác (+1)
                              </Badge>
                            ) : q.studentAnswer != null && q.studentAnswer !== "" ? (
                              <Badge variant="destructive" className="text-[10px] font-bold">
                                Chưa chính xác
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                Chưa làm
                              </Badge>
                            )}
                          </div>

                          {hasPrompt && (
                            <div
                              className="text-xs text-foreground font-medium leading-relaxed prose prose-sm max-w-none p-3 rounded-xl bg-background/60 border border-border/50"
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.prompt) }}
                            />
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            <div className="p-2.5 rounded-xl bg-background border border-border">
                              <span className="text-[11px] text-muted-foreground block font-semibold">Thí sinh điền:</span>
                              <strong className={q.isCorrect ? "text-emerald-600 font-mono text-xs" : "text-destructive font-mono text-xs"}>
                                {q.studentAnswer != null && q.studentAnswer !== "" ? String(q.studentAnswer) : "(Chưa điền)"}
                              </strong>
                            </div>
                            <div className="p-2.5 rounded-xl bg-background border border-border">
                              <span className="text-[11px] text-muted-foreground block font-semibold">Đáp án chuẩn:</span>
                              <strong className="text-foreground font-mono text-xs">{q.correctAnswer}</strong>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>

                {/* 📖 TAB 2: READING (Split screen with passage text) */}
                <TabsContent value="reading" className="space-y-4 pt-3 text-left">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Left Column: Passage Text */}
                    {detailData.testPayload?.skills?.reading?.passage && (
                      <div className="lg:col-span-6 space-y-3">
                        <div className="p-5 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
                          <div className="flex items-center justify-between pb-2 border-b border-border">
                            <span className="text-xs font-extrabold uppercase text-foreground flex items-center gap-1.5">
                              <BookOpen className="w-4 h-4 text-brand-blue" />
                              Passage Text
                            </span>
                            <Badge variant="outline" className="text-[11px]">
                              Bài đọc
                            </Badge>
                          </div>
                          <div
                            className="text-xs text-foreground/90 leading-relaxed space-y-3 max-h-[60vh] overflow-y-auto pr-2 text-justify select-text"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(detailData.testPayload.skills.reading.passage) }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Right Column: Reading Questions */}
                    <div className={detailData.testPayload?.skills?.reading?.passage ? "lg:col-span-6 space-y-3" : "lg:col-span-12 space-y-3"}>
                      {detailData.questionBreakdown?.filter((q: any) => q.skill === "reading").map((q: any, idx: number) => {
                        const isMultiBlank = !!q.parentQuestionId;
                        const hasPrompt = q.prompt && (!isMultiBlank || q.blankIndex === 0);

                        return (
                          <div
                            key={q.id || idx}
                            className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
                              q.isCorrect
                                ? "bg-emerald-500/5 border-emerald-500/20"
                                : q.studentAnswer != null && q.studentAnswer !== ""
                                ? "bg-destructive/5 border-destructive/20"
                                : "bg-muted/40 border-border"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-foreground text-sm">
                                Câu {idx + 1} {q.blankLabel ? `• ${q.blankLabel}` : ""}
                              </span>
                              {q.isCorrect ? (
                                <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                                  Chính xác (+1)
                                </Badge>
                              ) : q.studentAnswer != null && q.studentAnswer !== "" ? (
                                <Badge variant="destructive" className="text-[10px] font-bold">
                                  Chưa chính xác
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                  Chưa làm
                                </Badge>
                              )}
                            </div>

                            {hasPrompt && (
                              <div
                                className="text-xs text-foreground font-medium leading-relaxed prose prose-sm max-w-none p-3 rounded-xl bg-background/60 border border-border/50"
                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.prompt) }}
                              />
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              <div className="p-2.5 rounded-xl bg-background border border-border">
                                <span className="text-[11px] text-muted-foreground block font-semibold">
                                  {q.questionType === "fill_blank" ? "Thí sinh điền:" : "Thí sinh chọn:"}
                                </span>
                                <strong className={q.isCorrect ? "text-emerald-600 font-mono text-xs" : "text-destructive font-mono text-xs"}>
                                  {q.studentAnswer != null && q.studentAnswer !== "" ? String(q.studentAnswer) : "(Chưa chọn/điền)"}
                                </strong>
                              </div>
                              <div className="p-2.5 rounded-xl bg-background border border-border">
                                <span className="text-[11px] text-muted-foreground block font-semibold">Đáp án chuẩn:</span>
                                <strong className="text-foreground font-mono text-xs">{q.correctAnswer}</strong>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                {/* 📝 TAB 3: GRAMMAR & VOCABULARY */}
                <TabsContent value="grammar" className="space-y-4 pt-3 text-left">
                  <div className="space-y-3">
                    {detailData.questionBreakdown?.filter((q: any) => q.skill === "grammar").map((q: any, idx: number) => (
                      <div
                        key={q.id || idx}
                        className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
                          q.isCorrect
                            ? "bg-emerald-500/5 border-emerald-500/20"
                            : q.studentAnswer != null && q.studentAnswer !== ""
                            ? "bg-destructive/5 border-destructive/20"
                            : "bg-muted/40 border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-foreground text-sm">
                            Câu {idx + 1}
                          </span>
                          {q.isCorrect ? (
                            <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                              Chính xác (+1)
                            </Badge>
                          ) : q.studentAnswer != null && q.studentAnswer !== "" ? (
                            <Badge variant="destructive" className="text-[10px] font-bold">
                              Chưa chính xác
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              Chưa làm
                            </Badge>
                          )}
                        </div>

                        <div
                          className="text-xs text-foreground font-medium leading-relaxed prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.prompt) }}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <div className="p-2.5 rounded-xl bg-background border border-border">
                            <span className="text-[11px] text-muted-foreground block font-semibold">Thí sinh chọn:</span>
                            <strong className={q.isCorrect ? "text-emerald-600 font-mono text-xs" : "text-destructive font-mono text-xs"}>
                              {q.studentAnswer != null && q.studentAnswer !== "" ? String(q.studentAnswer) : "(Chưa chọn)"}
                            </strong>
                          </div>
                          <div className="p-2.5 rounded-xl bg-background border border-border">
                            <span className="text-[11px] text-muted-foreground block font-semibold">Đáp án chuẩn:</span>
                            <strong className="text-foreground font-mono text-xs">{q.correctAnswer}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* ✍️ TAB 4: WRITING */}
                <TabsContent value="writing" className="space-y-4 pt-3 text-left">
                  <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider">
                        Đề bài Writing được giao
                      </span>
                      <Badge variant="outline" className="text-[11px] font-mono">
                        Yêu cầu: Tối thiểu 80 từ
                      </Badge>
                    </div>
                    <div
                      className="text-sm font-semibold text-foreground leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(detailData.testPayload?.skills?.writing?.prompt || "Viết một bài văn ngắn.") }}
                    />
                  </div>

                  <div className="p-5 rounded-2xl bg-card border-2 border-border/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-primary" />
                        <span>Bài Làm Của Học Viên</span>
                      </h4>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 text-xs font-mono font-bold">
                        {String(detailData.answers?.["writing_response"] || "").trim().split(/\s+/).filter(Boolean).length} Từ
                      </Badge>
                    </div>

                    {detailData.answers?.["writing_response"] ? (
                      <div className="p-4 rounded-xl bg-muted/40 font-mono text-sm leading-relaxed text-foreground whitespace-pre-wrap select-text border border-border/60">
                        {detailData.answers["writing_response"]}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground text-sm italic">
                        Thí sinh không làm hoặc bỏ trống phần Writing.
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* 🎙️ TAB 5: SPEAKING WITH TEACHER REVIEW PLAYER & TIMESTAMP TAGGING */}
                <TabsContent value="speaking" className="space-y-4 pt-3 text-left">
                  <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                    <span className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider">
                      Chủ đề Speaking
                    </span>
                    <p className="text-sm font-bold text-foreground">
                      {detailData.testPayload?.skills?.speaking?.part2Topic || "Speaking Topic"}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Part 1 Review Player */}
                    {detailData.answers?.["speaking_part1_audio_url"] && (
                      <SpeakingReviewPlayer
                        title="Part 1 — Ghi Âm Phỏng Vấn (Part 1 Recording)"
                        audioUrl={detailData.answers["speaking_part1_audio_url"]}
                        onInsertTimestampTag={(tag) => {
                          setEditTeacherNotes((prev) => (prev ? `${prev}\n• ${tag}` : `• ${tag}`));
                        }}
                      />
                    )}

                    {/* Part 2 Review Player */}
                    {detailData.answers?.["speaking_part2_audio_url"] && (
                      <SpeakingReviewPlayer
                        title="Part 2 — Ghi Âm Thuyết Trình (Part 2 Recording)"
                        audioUrl={detailData.answers["speaking_part2_audio_url"]}
                        onInsertTimestampTag={(tag) => {
                          setEditTeacherNotes((prev) => (prev ? `${prev}\n• ${tag}` : `• ${tag}`));
                        }}
                      />
                    )}

                    {/* Legacy / Single Audio fallback */}
                    {detailData.answers?.["speaking_audio_url"] && !detailData.answers?.["speaking_part1_audio_url"] && (
                      <SpeakingReviewPlayer
                        title="File Thu Âm Bài Nói (Speaking Audio)"
                        audioUrl={detailData.answers["speaking_audio_url"]}
                        onInsertTimestampTag={(tag) => {
                          setEditTeacherNotes((prev) => (prev ? `${prev}\n• ${tag}` : `• ${tag}`));
                        }}
                      />
                    )}

                    {!detailData.answers?.["speaking_part1_audio_url"] &&
                      !detailData.answers?.["speaking_part2_audio_url"] &&
                      !detailData.answers?.["speaking_audio_url"] && (
                        <div className="py-12 text-center text-muted-foreground text-sm italic bg-card rounded-2xl border border-border">
                          Thí sinh chưa gửi bản ghi âm Speaking.
                        </div>
                      )}
                  </div>
                </TabsContent>

                {/* 📝 TAB 6: GRADING & ZALO FEEDBACK */}
                <TabsContent value="grading" className="space-y-4 pt-3 text-left">
                  <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
                    <h4 className="text-sm font-extrabold uppercase text-foreground tracking-wider">
                      Cập Nhật Trạng Thái &amp; Nhận Xét Của Giáo Viên
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Trạng thái */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Trạng thái chấm bài</Label>
                        <Select
                          value={editGradingStatus}
                          onValueChange={(val: any) => setEditGradingStatus(val)}
                        >
                          <SelectTrigger className="h-10 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="PENDING">🟡 Chờ chấm (PENDING)</SelectItem>
                            <SelectItem value="IN_PROGRESS">🔵 Đang chấm (IN_PROGRESS)</SelectItem>
                            <SelectItem value="GRADED_SENT_ZALO">🟢 Đã trả kết quả qua Zalo (GRADED_SENT_ZALO)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Giáo viên phụ trách */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Giáo viên phụ trách</Label>
                        <Input
                          placeholder="Ví dụ: Thầy Hoàng (IELTS 8.5)"
                          value={editTeacher}
                          onChange={(e) => setEditTeacher(e.target.value)}
                          className="h-10 rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Nhận xét giáo viên */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">
                        Ghi chú nhận xét Writing &amp; Speaking (Sẽ đưa vào mẫu tin nhắn Zalo)
                      </Label>
                      <Textarea
                        rows={4}
                        placeholder="Nhập nhận xét chi tiết lỗi từ vựng, ngữ pháp, phát âm và lộ trình rèn luyện để gửi Zalo cho thí sinh..."
                        value={editTeacherNotes}
                        onChange={(e) => setEditTeacherNotes(e.target.value)}
                        className="rounded-xl text-sm"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button
                        onClick={handleSaveReview}
                        disabled={updateMutation.isPending}
                        className="h-10 px-5 rounded-xl font-bold text-xs bg-primary text-primary-foreground"
                      >
                        {updateMutation.isPending ? "Đang lưu..." : "Lưu Thông Tin Chấm"}
                      </Button>
                    </div>
                  </div>

                  {/* 🚀 ZALO 1-CLICK DISPATCH CARD */}
                  <div className="p-5 rounded-2xl bg-brand-blue-soft border border-brand-blue/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-black text-foreground flex items-center gap-1.5">
                          <Send className="w-4 h-4 text-brand-blue" />
                          <span>Mẫu Tin Nhắn Phản Hồi Zalo Tự Động</span>
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Tin nhắn đã được format sẵn điểm số và nhận xét, sẵn sàng gửi ngay cho thí sinh.
                        </p>
                      </div>

                      <Button
                        size="sm"
                        onClick={handleCopyZaloTemplate}
                        className="h-9 px-3.5 font-bold text-xs bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl gap-1.5 shadow-xs"
                      >
                        {copiedZalo ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedZalo ? "Đã sao chép" : "Sao chép tin nhắn Zalo"}</span>
                      </Button>
                    </div>

                    <pre className="p-3.5 rounded-xl bg-background border border-border text-xs leading-relaxed text-foreground whitespace-pre-wrap font-sans select-text max-h-48 overflow-y-auto">
                      {getZaloTemplateText()}
                    </pre>

                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        SĐT Zalo thí sinh: <strong>{detailData.session?.phone}</strong>
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleCopyZaloTemplate();
                          window.open(`https://zalo.me/${cleanZaloPhone(detailData.session.phone)}`, "_blank");
                        }}
                        className="h-8 text-xs font-bold gap-1 rounded-xl border-[#0068FF] text-[#0068FF] hover:bg-[#0068FF]/10"
                      >
                        <span>Sao chép &amp; Mở Zalo ngay</span>
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
