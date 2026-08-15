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

/**
 * Detects stale Vite chunk errors (happen after a new deployment).
 * Returns true for "Failed to fetch dynamically imported module" errors.
 */
const isChunkLoadError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("Failed to fetch dynamically imported module") ||
    error.message.includes("Importing a module script failed") ||
    error.name === "ChunkLoadError"
  );
};

const CHUNK_RELOAD_KEY = "__nb_chunk_reloaded__";

/**
 * Wraps React.lazy with automatic page reload on stale-chunk errors.
 * Uses a sessionStorage flag to prevent infinite reload loops.
 */
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch((err: unknown) => {
      if (isChunkLoadError(err)) {
        const alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY);
        if (!alreadyReloaded) {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
          window.location.reload();
          // Return a never-resolving promise so React doesn't render anything
          return new Promise(() => {}) as never;
        }
      }
      throw err;
    })
  );
}

// Lazy-loaded routes for code splitting
const StudentLessonViewerPage = lazyWithRetry(() => import("@/pages/StudentLessonViewerPage"));
const MyCourses = lazyWithRetry(() => import("@/pages/MyCourses"));
const MySubmissions = lazyWithRetry(() => import("@/pages/MySubmissions"));
const CourseDetail = lazyWithRetry(() => import("@/pages/CourseDetail"));
const SubmissionDetail = lazyWithRetry(() => import("@/pages/SubmissionDetail"));
const ExamInterface = lazyWithRetry(() => import("@/pages/ExamInterface"));
const Profile = lazyWithRetry(() => import("@/pages/Profile"));

// Lazy-loaded Admin Pages
const AdminDashboard = lazyWithRetry(() => import("@/pages/admin/Dashboard"));
const AdminCourses = lazyWithRetry(() => import("@/pages/admin/Courses"));
const AdminCourseCreate = lazyWithRetry(() => import("@/pages/admin/CourseCreate"));
const AdminCourseEdit = lazyWithRetry(() => import("@/pages/admin/CourseEdit"));
const AdminExams = lazyWithRetry(() => import("@/pages/admin/Exams"));
const AdminExamCreate = lazyWithRetry(() => import("@/pages/admin/ExamCreate"));
const AdminExamEdit = lazyWithRetry(() => import("@/pages/admin/ExamEdit"));
const AdminSectionEdit = lazyWithRetry(() => import("@/pages/admin/SectionEdit"));
const AdminUsers = lazyWithRetry(() => import("@/pages/admin/Users"));
const AdminTeachers = lazyWithRetry(() => import("@/pages/admin/Teachers"));
const AdminAdmins = lazyWithRetry(() => import("@/pages/admin/Admins"));
const AdminCheckAttempt = lazyWithRetry(() => import("@/pages/admin/CheckAttempt"));
const AdminSubmissionGrade = lazyWithRetry(() => import("@/pages/admin/SubmissionGrade"));
const AdminLogViewer = lazyWithRetry(() => import("@/pages/admin/LogViewer"));
const AdminClasses = lazyWithRetry(() => import("@/pages/admin/Classes"));
const AdminClassEdit = lazyWithRetry(() => import("@/pages/admin/ClassWorkspace"));
const AdminSettings = lazyWithRetry(() => import("@/pages/admin/Settings"));
const TeacherWorkspace = lazyWithRetry(() => import("@/pages/admin/TeacherWorkspace"));
const AdminContentQADashboard = lazyWithRetry(() =>
  import("@/pages/admin/AdminContentQADashboard").then((m) => ({ default: m.AdminContentQADashboard }))
);
const ClassAttendancePage = lazyWithRetry(() => import("@/pages/admin/ClassAttendancePage"));

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

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // If this is a stale-chunk error that slipped past lazyWithRetry,
    // silently reload the page once rather than showing the error UI.
    if (isChunkLoadError(error)) {
      const alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY);
      if (!alreadyReloaded) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
        window.location.reload();
        return;
      }
    }
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
