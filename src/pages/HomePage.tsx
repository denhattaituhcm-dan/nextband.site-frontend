// Student IELTS Practice Hub - Course-Driven Action-Oriented Dashboard
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { lessonsApi, submissionsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate, Link } from "react-router-dom";
import { HomeworkEmptyState } from "@/components/homework/HomeworkEmptyState";
import { useStudentLifecycle } from "@/hooks/useStudentLifecycle";
import {
  FileText,
  Headphones,
  BookOpen,
  Mic,
  ArrowRight,
  HelpCircle,
  Edit3,
  Sparkles,
  MessageSquare,
} from "lucide-react";

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { enrollments } = useStudentLifecycle();

  const hasClasses = Array.isArray(enrollments) && enrollments.length > 0;
  const enrolledClassId = enrollments[0]?.classId || enrollments[0]?.class_id;
  const activeClassName = enrollments[0]?.className || enrollments[0]?.courses?.title || "Lớp học";

  // Fetch Class Lessons / Homeworks from Supabase directly
  const { data: classLessonsData, isLoading } = useQuery({
    queryKey: ["class-timeline", enrolledClassId],
    queryFn: () => lessonsApi.getClassLessons(enrolledClassId!).catch(() => ({ success: false, data: null as any })),
    enabled: !!enrolledClassId,
    retry: false,
  });

  // Fetch Student Submissions
  const { data: submissionsData } = useQuery({
    queryKey: ["my-recent-submissions", user?.id],
    queryFn: () => submissionsApi.list({ studentId: user?.id, limit: 100 }).catch(() => ({ data: [] })),
    enabled: !!user?.id,
    retry: false,
  });

  const classData = classLessonsData?.data;
  const lessons = Array.isArray(classData?.lessons) ? classData.lessons : [];
  const userSubmissions = Array.isArray(submissionsData?.data) ? submissionsData.data : [];

  // Map submissions to homeworks
  const submissionsMap: Record<string, any> = {};
  userSubmissions.forEach((s: any) => {
    if (s.homework_id || s.exam_id) {
      submissionsMap[s.homework_id || s.exam_id] = s;
    }
  });

  // Homework items formatted for Practice Platform
  const homeworkList = lessons.map((item: any, idx: number) => {
    const sub = submissionsMap[item.id] || item.submission;
    let status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "REVIEWED" = "NOT_STARTED";

    if (sub?.grade_status === "graded" || sub?.status === "graded") {
      status = "REVIEWED";
    } else if (sub?.status === "submitted" || sub?.grade_status === "pending") {
      status = "SUBMITTED";
    } else if (sub?.status === "in_progress") {
      status = "IN_PROGRESS";
    }

    return {
      id: item.id,
      hwNum: String(idx + 1).padStart(2, "0"),
      title: item.title || `Homework ${String(idx + 1).padStart(2, "0")}`,
      description: item.description || `Bài tập buổi ${idx + 1}`,
      status,
      resources: item.resources || [],
      submission: sub,
    };
  });

  // Find next homework to do ("Tiếp tục học / Tiếp tục làm bài")
  const nextHomework = homeworkList.find((hw) => hw.status === "NOT_STARTED" || hw.status === "IN_PROGRESS") || homeworkList[0];

  const notStartedCount = homeworkList.filter((hw) => hw.status === "NOT_STARTED").length;
  const submittedCount = homeworkList.filter((hw) => hw.status === "SUBMITTED").length;
  const reviewedCount = homeworkList.filter((hw) => hw.status === "REVIEWED").length;

  const gradedSubmissions = userSubmissions.filter((s: any) => s.status === "graded" || s.grade_status === "graded");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "REVIEWED":
        return <Badge className="bg-emerald-600 text-white text-[11px] font-bold">🟢 Đã nhận xét</Badge>;
      case "SUBMITTED":
        return <Badge className="bg-amber-500 text-white text-[11px] font-bold">🟡 Đã nộp (Chờ phản hồi)</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-blue-600 text-white text-[11px] font-bold">🔵 Đang làm</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-600 border-slate-300 text-[11px] font-semibold">○ Chưa làm</Badge>;
    }
  };

  const getSkillIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "listening":
        return <Headphones className="h-3.5 w-3.5 text-blue-600" />;
      case "reading":
        return <BookOpen className="h-3.5 w-3.5 text-emerald-600" />;
      case "writing":
        return <FileText className="h-3.5 w-3.5 text-purple-600" />;
      case "speaking":
        return <Mic className="h-3.5 w-3.5 text-amber-600" />;
      default:
        return <HelpCircle className="h-3.5 w-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {!hasClasses ? (
          <HomeworkEmptyState state="NO_ENROLLMENT" />
        ) : (
          <>
            {/* HERO SECTION: "TIẾP TỤC LUYỆN TẬP" (ACTION-DRIVEN HERO CARD) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-6 md:p-8 rounded-2xl shadow-md flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-white/20 text-white border border-white/25 backdrop-blur-md">
                      {activeClassName}
                    </span>
                    <span className="text-xs text-emerald-200">•</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500 text-white">
                      NỀN TẢNG LUYỆN THI IELTS
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                    Xin chào, {user?.fullName || "Học viên"}! Sẵn sàng luyện tập hôm nay ✍️
                  </h1>
                  <p className="text-xs md:text-sm text-emerald-100 mt-1">
                    Toàn bộ bài tập của khóa học được mở hoàn toàn. Hãy chọn bài tập để bắt đầu rèn luyện kỹ năng ngay.
                  </p>
                </div>

                {nextHomework && (
                  <div className="pt-3 border-t border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                        Bài tập cần làm tiếp theo:
                      </span>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                        {nextHomework.title}
                        {getStatusBadge(nextHomework.status)}
                      </h3>
                    </div>

                    <Button
                      onClick={() => navigate(`/exam/${nextHomework.id}`)}
                      className="bg-white text-emerald-800 hover:bg-emerald-50 font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-md shrink-0"
                    >
                      ✍️ Làm bài ngay
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* SIDEBAR KPI SUMMARY */}
              <div className="md:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Tình trạng Bài tập cá nhân
                  </h3>
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-medium block">Chưa làm</span>
                    <div className="font-extrabold text-slate-800 text-base mt-1">{notStartedCount}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-amber-600 font-medium block">Đã nộp</span>
                    <div className="font-extrabold text-amber-600 text-base mt-1">{submittedCount}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-emerald-600 font-medium block">Đã nhận xét</span>
                    <div className="font-extrabold text-emerald-600 text-base mt-1">{reviewedCount}</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 font-medium leading-relaxed">
                  💡 <strong>Gợi ý:</strong> Nộp bài tập luyện viết & nói sớm để nhận phản hồi nhận xét chi tiết từ giáo viên.
                </div>
              </div>
            </div>

            {/* MAIN PRACTICE LIST SECTION (DANH SÁCH BÀI TẬP LUYỆN TẬP) */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-emerald-600" />
                    Danh sách Bài tập Luyện tập ({homeworkList.length} Homework)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click chọn bài tập bất kỳ để vào màn hình thực hành kỹ năng.
                  </p>
                </div>
              </div>

              {isLoading ? (
                <div className="p-8 text-center text-slate-500 text-xs">Đang tải danh sách bài tập...</div>
              ) : homeworkList.length === 0 ? (
                <div className="p-8 border rounded-2xl bg-white text-center text-slate-500 text-xs">
                  Chưa có bài tập nào thuộc khóa học này.
                </div>
              ) : (
                <div className="grid gap-3">
                  {homeworkList.map((hw) => (
                    <Card
                      key={hw.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-400 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2.5">
                          <h3 className="font-extrabold text-sm text-slate-900">{hw.title}</h3>
                          {getStatusBadge(hw.status)}
                        </div>

                        {/* Activities Checklist preview */}
                        {hw.resources && hw.resources.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-[11px] font-medium text-slate-500">Hoạt động:</span>
                            {hw.resources.map((res: any, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                              >
                                {getSkillIcon(res.type)}
                                {res.type?.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">{hw.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          className={`font-bold text-xs gap-1.5 ${
                            hw.status === "REVIEWED"
                              ? "bg-slate-800 hover:bg-slate-900 text-white"
                              : hw.status === "SUBMITTED"
                              ? "bg-amber-600 hover:bg-amber-700 text-white"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }`}
                          onClick={() => navigate(`/exam/${hw.id}`)}
                        >
                          {hw.status === "REVIEWED"
                            ? "🔍 Xem phản hồi"
                            : hw.status === "SUBMITTED"
                            ? "🔍 Xem bài làm"
                            : "✍️ Làm bài ngay"}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* FEEDBACK MỚI NHẤT TỪ GIÁO VIÊN */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                Nhận xét & Feedback gần đây từ Giáo viên
              </h3>
              <Card className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-3">
                {gradedSubmissions.length > 0 ? (
                  gradedSubmissions.slice(0, 3).map((sub: any) => (
                    <div key={sub.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm truncate">
                            {sub.exams?.title || "Listening Session 11"}
                          </span>
                          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                            Band {sub.total_score ?? "7.5"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 truncate italic">
                          "{sub.feedback || 'Cần chú ý danh từ số nhiều và nối âm ở Part 2...'}"
                        </p>
                      </div>
                      <Link to={`/submissions/${sub.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                          Chi tiết ➔
                        </Button>
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-xs py-4 text-center">
                    Chưa có nhận xét mới từ giáo viên. Hãy làm và nộp bài tập để nhận bài chấm chi tiết!
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
