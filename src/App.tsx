import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Layouts
import ClientLayout from "@/layouts/ClientLayout";
import AdminLayout from "@/layouts/AdminLayout";
import MinimalLayout from "@/layouts/MinimalLayout";

// Eagerly loaded core initial routes
import Auth from "@/pages/Auth";
import HomePage from "@/pages/HomePage";
import NotFound from "@/pages/NotFound";

// Lazy-loaded routes for code splitting
const StudentLessonViewerPage = lazy(() => import("@/pages/StudentLessonViewerPage"));
const MyCourses = lazy(() => import("@/pages/MyCourses"));
const MySubmissions = lazy(() => import("@/pages/MySubmissions"));
const CourseDetail = lazy(() => import("@/pages/CourseDetail"));
const SubmissionDetail = lazy(() => import("@/pages/SubmissionDetail"));
const ExamInterface = lazy(() => import("@/pages/ExamInterface"));
const Profile = lazy(() => import("@/pages/Profile"));

// Lazy-loaded Admin Pages
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminCourses = lazy(() => import("@/pages/admin/Courses"));
const AdminCourseCreate = lazy(() => import("@/pages/admin/CourseCreate"));
const AdminCourseEdit = lazy(() => import("@/pages/admin/CourseEdit"));
const AdminExams = lazy(() => import("@/pages/admin/Exams"));
const AdminExamCreate = lazy(() => import("@/pages/admin/ExamCreate"));
const AdminExamEdit = lazy(() => import("@/pages/admin/ExamEdit"));
const AdminSectionEdit = lazy(() => import("@/pages/admin/SectionEdit"));
const AdminUsers = lazy(() => import("@/pages/admin/Users"));
const AdminTeachers = lazy(() => import("@/pages/admin/Teachers"));
const AdminAdmins = lazy(() => import("@/pages/admin/Admins"));
const AdminCheckAttempt = lazy(() => import("@/pages/admin/CheckAttempt"));
const AdminSubmissionGrade = lazy(() => import("@/pages/admin/SubmissionGrade"));
const AdminLogViewer = lazy(() => import("@/pages/admin/LogViewer"));
const AdminClasses = lazy(() => import("@/pages/admin/Classes"));
const AdminClassEdit = lazy(() => import("@/pages/admin/ClassWorkspace"));
const AdminSettings = lazy(() => import("@/pages/admin/Settings"));
const TeacherWorkspace = lazy(() => import("@/pages/admin/TeacherWorkspace"));
const AdminContentQADashboard = lazy(() =>
  import("@/pages/admin/AdminContentQADashboard").then((m) => ({ default: m.AdminContentQADashboard }))
);
const ClassAttendancePage = lazy(() => import("@/pages/admin/ClassAttendancePage"));

const PageLoader = () => (
  <div className="min-h-[400px] w-full flex flex-col items-center justify-center space-y-3 p-12">
    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
    <p className="text-xs font-medium text-slate-500 animate-pulse">Đang tải trang...</p>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 minutes staleTime for standard queries
      gcTime: 1000 * 60 * 15, // 15 minutes garbage collection time
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

import React from "react";

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("[CRITICAL_APP_ERROR]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center font-sans">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto text-xl font-bold">
              ⚡
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">NextBand LMS System</h2>
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-left">
              <p className="text-[11px] font-mono font-bold text-red-700 break-words">
                {String(this.state.error?.message || this.state.error || "Unknown Error")}
              </p>
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = window.location.origin + window.location.pathname + "?t=" + Date.now();
              }}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Làm mới trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Auth Routes */}
              <Route path="/auth" element={<Auth />} />

              {/* Client Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <ClientLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<HomePage />} />
                <Route path="/my-courses" element={<MyCourses />} />
                <Route path="/class/:classId/lessons" element={<StudentLessonViewerPage />} />
                <Route path="/my-submissions" element={<MySubmissions />} />
                <Route path="/course/:slug" element={<CourseDetail />} />
                <Route path="/submissions/:id" element={<SubmissionDetail />} />
                <Route
                  path="/exam/:examId/review"
                  element={<SubmissionDetail />}
                />
                <Route path="/profile" element={<Profile />} />
              </Route>

              {/* Exam Interface - Minimal Layout */}
              <Route
                element={
                  <ProtectedRoute>
                    <MinimalLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/exam/:examId" element={<ExamInterface />} />
              </Route>

              {/* Admin Routes */}
              <Route
                element={
                  <ProtectedRoute requiredRoles={["admin", "teacher"]}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/content-qa"
                  element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <AdminContentQADashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/courses"
                  element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <AdminCourses />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/courses/create"
                  element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <AdminCourseCreate />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/courses/:id"
                  element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <AdminCourseEdit />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/exams"
                  element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <AdminExams />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/exams/create"
                  element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <AdminExamCreate />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/exams/:id"
                  element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <AdminExamEdit />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/sections/:id"
                  element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <AdminSectionEdit />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <AdminUsers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/teachers"
                  element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <AdminTeachers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/admins"
                  element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <AdminAdmins />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/check-attempt"
                  element={<AdminCheckAttempt />}
                />
                <Route
                  path="/admin/submissions/:id"
                  element={<AdminSubmissionGrade />}
                />
                <Route
                  path="/admin/logs"
                  element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <AdminLogViewer />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/classes"
                  element={
                    <ProtectedRoute requiredRoles={["admin", "teacher"]}>
                      <AdminClasses />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/classes/:classId/sessions/:sessionId/attendance"
                  element={
                    <ProtectedRoute requiredRoles={["admin", "teacher"]}>
                      <ClassAttendancePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/classes/:id"
                  element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <AdminClassEdit />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/teacher-workspace"
                  element={
                    <ProtectedRoute requiredRoles={["admin", "teacher"]}>
                      <TeacherWorkspace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <AdminSettings />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
