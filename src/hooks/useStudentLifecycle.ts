import { useQuery } from "@tanstack/react-query";
import { classStudentsApi, workspaceApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export type StudentLifecycleState = "PRE_ENROLLMENT" | "ENROLLED" | "ACTIVE_LEARNING";

export function useStudentLifecycle() {
  const { user, isAuthenticated } = useAuth();

  // 1. Fetch Class Memberships (Single source of truth)
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ["my-class-memberships", user?.id],
    queryFn: () => classStudentsApi.getMyClasses().catch(() => []),
    enabled: !!isAuthenticated && !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  const hasEnrollments = Array.isArray(enrollments) && enrollments.length > 0;

  // 2. Fetch Student Workspace Summary (Source of truth for homeworks)
  const { data: workspace, isLoading: isLoadingWorkspace } = useQuery({
    queryKey: ["student-workspace-summary", user?.id],
    queryFn: () => workspaceApi.getWorkspace().catch(() => null),
    enabled: !!isAuthenticated && !!user?.id && hasEnrollments,
    staleTime: 1000 * 60 * 2,
  });

  const dueTodayTasks = Array.isArray(workspace?.dueToday) ? workspace.dueToday : [];
  const upcomingTasks = Array.isArray(workspace?.upcoming) ? workspace.upcoming : [];
  const completedTasks = Array.isArray(workspace?.completed) ? workspace.completed : [];
  const homeworkCount = dueTodayTasks.length + upcomingTasks.length + completedTasks.length;

  // Pure derived state calculation
  let state: StudentLifecycleState = "PRE_ENROLLMENT";
  if (hasEnrollments) {
    if (homeworkCount > 0) {
      state = "ACTIVE_LEARNING";
    } else {
      state = "ENROLLED";
    }
  }

  return {
    state,
    enrollments,
    workspace,
    hasEnrollments,
    homeworkCount,
    dueTodayTasks,
    upcomingTasks,
    completedTasks,
    isLoading: isLoadingEnrollments || (hasEnrollments && isLoadingWorkspace),
  };
}
