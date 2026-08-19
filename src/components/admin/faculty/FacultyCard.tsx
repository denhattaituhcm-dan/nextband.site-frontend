import React from "react";
import { FacultyProfile } from "@/lib/facultyService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ExternalLink,
  Edit2,
  MoreVertical,
  Trash2,
  FileCheck,
  FileX,
  Award,
} from "lucide-react";

interface FacultyCardProps {
  profile: FacultyProfile;
  onEdit: (profile: FacultyProfile) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string, isPublished: boolean) => void;
}

export function FacultyCard({
  profile,
  onEdit,
  onDelete,
  onTogglePublish,
}: FacultyCardProps) {
  return (
    <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-brand-blue/40">
      {/* Left: Avatar + Details */}
      <div className="flex items-start gap-3.5 sm:gap-4 w-full md:w-auto">
        {/* Avatar */}
        <div className="relative aspect-square w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-muted/40 border border-border/60 shrink-0">
          <img
            src={profile.avatar_url || "/placeholder.svg"}
            alt={profile.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
        </div>

        {/* Profile Info */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight line-clamp-1">
              {profile.name}
            </h3>

            {profile.is_published ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Đang hiển thị
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-muted text-muted-foreground border border-border">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Bản nháp
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm font-semibold text-brand-blue line-clamp-1">
            {profile.role}
          </p>

          {/* Badges & Meta */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {/* IELTS Badge */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-black bg-brand-red-soft text-brand-red border border-brand-red/20">
              <Award className="h-3.5 w-3.5" />
              <span>IELTS {profile.ielts_badge}</span>
              {profile.ielts_badge_sub && (
                <span className="opacity-85 font-semibold text-[11px]">
                  · {profile.ielts_badge_sub}
                </span>
              )}
            </span>

            {/* TRF Status */}
            {profile.trf_image_url ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-muted text-foreground/80">
                <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>TRF Đã tải lên</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                <FileX className="h-3.5 w-3.5" />
                <span>Chưa có TRF</span>
              </span>
            )}

            <span className="text-xs text-muted-foreground">
              {profile.achievements?.length || 0} gạch đầu dòng
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center justify-between md:justify-end gap-2.5 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-border/60">
        {/* Toggle Switch */}
        <div className="flex items-center gap-2 mr-1">
          <Switch
            checked={profile.is_published}
            onCheckedChange={(checked) => onTogglePublish(profile.id, checked)}
            aria-label="Bật tắt hiển thị"
          />
          <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
            {profile.is_published ? "Hiển thị" : "Ẩn"}
          </span>
        </div>

        {/* Action Buttons */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open("/teachers", "_blank")}
          className="h-8 px-2.5 rounded-lg text-xs font-semibold gap-1.5"
          title="Xem trang công khai"
        >
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="hidden sm:inline">Xem trên web</span>
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={() => onEdit(profile)}
          className="h-8 px-3 rounded-lg text-xs font-bold bg-brand-blue hover:bg-brand-blue-hover text-white gap-1.5"
        >
          <Edit2 className="h-3.5 w-3.5" />
          <span>Chỉnh sửa</span>
        </Button>

        {/* More Actions (Delete) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onDelete(profile.id)}
              className="text-destructive focus:text-destructive text-xs gap-2 font-medium"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Xóa hồ sơ</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
