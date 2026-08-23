import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { statsApi, usersApi, coursesApi } from "@/lib/api";
import { useBranch } from "@/contexts/BranchContext";
import {
  BookOpen,
  Users,
  FileText,
  GraduationCap,
  Mail,
  Phone,
  ChevronRight,
  CalendarRange,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck,
  School,
  ArrowRight,
  TrendingUp,
  Building2,
  MapPin,
  Layers,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { AlertWidget } from "@/components/AlertWidget";

export default function AdminDashboard() {
  const { selectedBranch, setSelectedBranch, currentBranch, branches, canSelectAll } = useBranch();
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => statsApi.getAdminStats().catch(() => ({ courses: 0, users: 0, exams: 0 })),
    retry: false,
  });

  const currentYear = new Date().getFullYear();
  const [period, setPeriod] = useState<string>(() =>
    String(new Date().getMonth() + 1).padStart(2, "0"),
  );

  const { data: attendanceSummary, isLoading: isAttendanceLoading } = useQuery({
    queryKey: ["admin-attendance-monthly", currentYear, period],
    queryFn: () => statsApi.getMonthlyAttendance({ year: currentYear, month: period }),
  });

  const monthLabel = useMemo(() => {
    if (period === "year" || period === "all") return `Cả năm ${currentYear}`;
    return `Tháng ${Number(period)}/${currentYear}`;
  }, [currentYear, period]);

  const periods = useMemo(
    () => [
      ...Array.from({ length: 12 }, (_, i) => ({
        key: String(i + 1).padStart(2, "0"),
        label: `Tháng ${i + 1}`,
      })),
      { key: "year", label: "Cả năm" },
    ],
    [],
  );

  // Fetch recent teachers for the teacher list widget
  const { data: teachersData } = useQuery({
    queryKey: ["dashboard-teachers"],
    queryFn: () => usersApi.list({ role: "teacher", limit: 5 }),
  });

  // Fetch courses for the academic programs widget
  const { data: coursesData } = useQuery({
    queryKey: ["dashboard-courses"],
    queryFn: () => coursesApi.list({ limit: 5 }),
  });

  const teachers = teachersData?.data || [];
  const totalTeachers = teachersData?.meta?.total || 0;
  const courses = coursesData?.data || [];

  const statCards = [
    {
      title: "Tổng khóa học",
      value: stats?.courses || 0,
      icon: BookOpen,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Tổng người dùng",
      value: stats?.users || 0,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Tổng bài thi",
      value: stats?.exams || 0,
      icon: FileText,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Tổng giáo viên",
      value: totalTeachers,
      icon: GraduationCap,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      {/* Scope Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-card/60 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {selectedBranch === "ALL" ? (
              <Layers className="h-5 w-5" />
            ) : (
              <MapPin className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phạm vi dữ liệu:</span>
              <Badge variant={selectedBranch === "ALL" ? "secondary" : "default"} className="font-medium text-xs">
                {selectedBranch === "ALL" ? "Toàn bộ hệ thống" : currentBranch?.name || "Cơ sở"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedBranch === "ALL"
                ? `Đang tổng hợp số liệu từ tất cả ${branches.length} chi nhánh hoạt động`
                : `${currentBranch?.address || "Không có địa chỉ"} ${currentBranch?.phone ? `• Hotline: ${currentBranch.phone}` : ""}`}
            </p>
          </div>
        </div>

        {selectedBranch !== "ALL" && canSelectAll && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedBranch("ALL")}
            className="text-xs h-8"
          >
            <Layers className="h-3.5 w-3.5 mr-1.5 text-primary" />
            Xem toàn hệ thống
          </Button>
        )}
      </div>

      {/* Surface 2 Banner & Surface 4 Widget */}
      <AnnouncementBanner scopeRole="admin" />
      <AlertWidget role="admin" />

      {/* Multi-branch Breakdown when selectedBranch === 'ALL' */}
      {selectedBranch === "ALL" && branches.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Tổng quan các Chi nhánh ({branches.length})
            </h2>
            <span className="text-xs text-muted-foreground">
              Bấm vào chi nhánh để chuyển đổi góc nhìn
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {branches.map((b) => (
              <Card
                key={b.id}
                className="hover:border-primary/50 transition-all cursor-pointer hover:shadow-md bg-card/80 group"
                onClick={() => setSelectedBranch(b.id)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                        {b.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">{b.code}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
                      Hoạt động
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center">
                    <div className="bg-muted/40 p-2 rounded-lg">
                      <p className="text-[10px] text-muted-foreground font-medium">Lớp học</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">{b._count?.classes || 0}</p>
                    </div>
                    <div className="bg-muted/40 p-2 rounded-lg">
                      <p className="text-[10px] text-muted-foreground font-medium">Phòng</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">{b._count?.rooms || 0}</p>
                    </div>
                    <div className="bg-muted/40 p-2 rounded-lg">
                      <p className="text-[10px] text-muted-foreground font-medium">Leads</p>
                      <p className="text-sm font-bold text-primary mt-0.5">{b._count?.leads || 0}</p>
                    </div>
                  </div>

                  <div className="text-[11px] text-primary flex items-center justify-end font-medium group-hover:translate-x-0.5 transition-transform">
                    Xem cơ sở này
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bgColor}`}
              >
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attendance Monthly Card */}
      <Card className="overflow-hidden border shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Điểm danh theo tháng
                <Badge variant="outline" className="text-xs font-normal text-emerald-700 bg-emerald-50 border-emerald-200">
                  {monthLabel}
                </Badge>
              </CardTitle>
              <CardDescription>
                Tổng hợp lịch học, lượt có mặt, vắng và tỷ lệ chuyên cần của toàn bộ các lớp
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex text-xs">
            <Link to="/admin/classes">
              Quản lý lớp học
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 pt-4">
          {/* Period selector buttons */}
          <div className="overflow-x-auto pb-1 -mx-1 px-1">
            <div className="flex items-center gap-1.5 min-w-max">
              {periods.map((item) => (
                <Button
                  key={item.key}
                  type="button"
                  size="sm"
                  variant={period === item.key ? "default" : "outline"}
                  className={cn(
                    "h-8 rounded-full px-3 text-xs transition-all font-medium",
                    period === item.key
                      ? "bg-emerald-600 hover:bg-emerald-600/90 text-white shadow-xs"
                      : "hover:bg-muted text-muted-foreground",
                  )}
                  onClick={() => setPeriod(item.key)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Tổng buổi học */}
            <div className="p-3.5 rounded-xl border bg-slate-50/70 space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span>Số buổi học</span>
                <School className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <div className="text-xl font-bold text-slate-900">
                {attendanceSummary?.totalSessions ?? 0} <span className="text-xs font-normal text-muted-foreground">buổi</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {attendanceSummary?.completedSessions ?? 0} buổi đã chốt
              </div>
            </div>

            {/* 2. Có mặt */}
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
              <div className="flex items-center justify-between text-xs text-emerald-700 font-medium">
                <span>Lượt có mặt</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-emerald-700">
                {attendanceSummary?.totalPresent ?? 0} <span className="text-xs font-normal text-emerald-600/80">lượt</span>
              </div>
              <div className="text-[11px] text-emerald-600/80">
                {attendanceSummary?.lateCount ? `${attendanceSummary.lateCount} đi muộn` : "Tham gia đầy đủ"}
              </div>
            </div>

            {/* 3. Vắng không phép */}
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 space-y-1">
              <div className="flex items-center justify-between text-xs text-rose-700 font-medium">
                <span>Lượt vắng</span>
                <XCircle className="h-3.5 w-3.5 text-rose-600" />
              </div>
              <div className="text-xl font-bold text-rose-700">
                {attendanceSummary?.totalAbsent ?? 0} <span className="text-xs font-normal text-rose-600/80">lượt</span>
              </div>
              <div className="text-[11px] text-rose-600/80">
                Vắng không phép
              </div>
            </div>

            {/* 4. Nghỉ có phép */}
            <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 space-y-1">
              <div className="flex items-center justify-between text-xs text-purple-700 font-medium">
                <span>Nghỉ có phép</span>
                <FileCheck className="h-3.5 w-3.5 text-purple-600" />
              </div>
              <div className="text-xl font-bold text-purple-700">
                {attendanceSummary?.totalExcused ?? 0} <span className="text-xs font-normal text-purple-600/80">lượt</span>
              </div>
              <div className="text-[11px] text-purple-600/80">
                Có đơn xin phép
              </div>
            </div>

            {/* 5. Đi muộn */}
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1">
              <div className="flex items-center justify-between text-xs text-amber-700 font-medium">
                <span>Đi muộn</span>
                <Clock className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <div className="text-xl font-bold text-amber-700">
                {attendanceSummary?.lateCount ?? 0} <span className="text-xs font-normal text-amber-600/80">lượt</span>
              </div>
              <div className="text-[11px] text-amber-600/80">
                Được tính có mặt
              </div>
            </div>

            {/* 6. Tỷ lệ chuyên cần */}
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1">
              <div className="flex items-center justify-between text-xs text-blue-700 font-medium">
                <span>Chuyên cần</span>
                <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div className="text-xl font-bold text-blue-700">
                {attendanceSummary?.attendanceRate != null
                  ? Math.round(attendanceSummary.attendanceRate * 100)
                  : 100}
                %
              </div>
              <div className="text-[11px] text-blue-600/80">
                {attendanceSummary?.activeClassesCount ?? 0} lớp có lịch học
              </div>
            </div>
          </div>

          {/* Breakdown By Class in this month */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tổng hợp theo từng lớp ({attendanceSummary?.byClass?.length || 0} lớp trong {monthLabel})
              </h4>
            </div>

            {isAttendanceLoading ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Đang tải dữ liệu điểm danh...
              </div>
            ) : !attendanceSummary?.byClass || attendanceSummary.byClass.length === 0 ? (
              <div className="p-8 border border-dashed rounded-xl text-center text-xs text-muted-foreground bg-muted/10">
                Không có buổi học hoặc bản ghi điểm danh nào trong {monthLabel}.
              </div>
            ) : (
              <div className="border rounded-xl overflow-hidden bg-card">
                <div className="grid grid-cols-12 bg-muted/40 p-2.5 px-3.5 text-xs font-semibold text-muted-foreground border-b">
                  <span className="col-span-4 sm:col-span-4">Lớp học</span>
                  <span className="col-span-2 text-center">Số buổi</span>
                  <span className="col-span-2 text-center text-emerald-700">Có mặt</span>
                  <span className="col-span-2 text-center text-rose-700">Vắng</span>
                  <span className="col-span-2 text-right">Chuyên cần</span>
                </div>
                <div className="divide-y text-xs">
                  {attendanceSummary.byClass.map((cls) => (
                    <div
                      key={cls.classId}
                      className="grid grid-cols-12 p-3 px-3.5 items-center hover:bg-muted/30 transition-colors gap-1"
                    >
                      <div className="col-span-4 sm:col-span-4 min-w-0 pr-2">
                        <Link
                          to={`/admin/classes/${cls.classId}`}
                          className="font-semibold text-foreground hover:text-emerald-600 hover:underline truncate block"
                          title={cls.className}
                        >
                          {cls.className}
                        </Link>
                        <div className="text-[11px] text-muted-foreground truncate">
                          GV: {cls.teacherName} · {cls.totalStudents} học viên
                        </div>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="font-semibold text-foreground">{cls.totalSessions}</span>
                        <span className="text-[10px] text-muted-foreground block">
                          ({cls.completedSessions} đã chốt)
                        </span>
                      </div>
                      <div className="col-span-2 text-center font-semibold text-emerald-600">
                        {cls.totalPresent}
                        {cls.lateCount > 0 && (
                          <span className="text-[10px] text-amber-600 block">
                            ({cls.lateCount} muộn)
                          </span>
                        )}
                      </div>
                      <div className="col-span-2 text-center">
                        <span className={cls.totalAbsent > 0 ? "font-semibold text-rose-600" : "text-muted-foreground"}>
                          {cls.totalAbsent}
                        </span>
                        {cls.totalExcused > 0 && (
                          <span className="text-[10px] text-purple-600 block">
                            ({cls.totalExcused} phép)
                          </span>
                        )}
                      </div>
                      <div className="col-span-2 text-right">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[11px] font-bold",
                            cls.attendanceRate >= 0.9
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : cls.attendanceRate >= 0.75
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200",
                          )}
                        >
                          {Math.round(cls.attendanceRate * 100)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Teachers List Widget */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                <GraduationCap className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Danh sách giáo viên</CardTitle>
                <CardDescription>
                  {totalTeachers} giáo viên trong hệ thống
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/teachers">
                Xem tất cả
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {teachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <GraduationCap className="h-10 w-10 mb-2 text-muted-foreground/50" />
              <p className="text-sm">Chưa có giáo viên nào</p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link to="/admin/teachers">Thêm giáo viên</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {teachers.map((teacher: any) => (
                <div
                  key={teacher.id}
                  className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={teacher.avatarUrl || undefined} />
                    <AvatarFallback className="bg-amber-500/10 text-amber-600">
                      <GraduationCap className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {teacher.fullName || "Chưa đặt tên"}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        {teacher.email}
                      </span>
                      {teacher.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          {teacher.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={
                      teacher.isActive !== false ? "default" : "secondary"
                    }
                    className="flex-shrink-0"
                  >
                    {teacher.isActive !== false ? "Hoạt động" : "Tắt"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Academic Programs Quick Check Widget (Cuối Dashboard) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Academic Programs
                  <Badge variant="outline" className="text-xs font-normal">
                    {coursesData?.meta?.total || courses.length} Programs
                  </Badge>
                </CardTitle>
                <CardDescription>Tra cứu nhanh thông số lớp đang mở & trạng thái khóa học</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/courses">
                Quản lý khóa học
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
              <BookOpen className="h-8 w-8 mb-2 text-muted-foreground/50" />
              <p className="text-sm">Chưa có chương trình đào tạo nào</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-3 bg-muted/40 p-2 px-3 text-xs font-semibold text-muted-foreground border-b">
                <span>Program</span>
                <span className="text-center">Status</span>
                <span className="text-right">Classes (Đang mở / Tổng)</span>
              </div>
              <div className="divide-y text-xs">
                {courses.slice(0, 5).map((c: any) => (
                  <div key={c.id} className="grid grid-cols-3 p-2.5 px-3 items-center hover:bg-muted/30 transition-colors">
                    <span className="font-semibold text-foreground truncate">{c.title}</span>
                    <div className="text-center">
                      <Badge variant="outline" className={c.isPublished ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]" : "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"}>
                        {c.isPublished ? "🟢 Active" : "🟡 Draft"}
                      </Badge>
                    </div>
                    <span className="text-right font-medium">
                      <span className="text-primary font-bold">{c.activeClassesCount || 2}</span> / {c.totalClassesCount || 4} lớp
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
