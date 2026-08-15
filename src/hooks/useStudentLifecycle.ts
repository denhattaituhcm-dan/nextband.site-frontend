import { useQuery, useQueryClient } from "@tanstack/react-query";
import { classStudentsApi, MyClassEnrollment, workspaceApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useCallback } from "react";

/**
 * Authoritative lifecycle states for a student session.
 *
 * State machine (source of truth: GET /classes/my-classes):
 *
 *   LOADING          → query in-flight
 *   PRE_ENROLLMENT   → 200 + data:[]  (Backend confirms: no enrollment)
 *   ENROLLED         → 200 + data:[…] (Backend confirms: has enrollment)
 *   API_ERROR        → 4xx / 5xx
 *   NETWORK_ERROR    → fetch exception / offline
 *
 * INVARIANT-01: API failure MUST NEVER produce PRE_ENROLLMENT.
 * INVARIANT-02: PRE_ENROLLMENT MUST ONLY originate from HTTP 200 + data:[].
 * INVARIANT-03: ENROLLED MUST ONLY originate from HTTP 200 + data.length > 0.
 * INVARIANT-04: workspaceApi MUST NOT execute while lifecycle is LOADING / API_ERROR / NETWORK_ERROR.
 * INVARIANT-05: No UI component may independently infer enrollment state.
 *               useStudentLifecycle is the authoritative lifecycle source.
 */
export type StudentLifecycleState =
  | "LOADING"
  | "PRE_ENROLLMENT"
  | "ENROLLED"
  | "API_ERROR"
  | "NETWORK_ERROR";

export interface StudentLifecycleError {
  httpStatus?: number;
  message: string;
}

const MY_CLASSES_QUERY_KEY = "my-class-memberships" as const;

export function useStudentLifecycle() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // ─── Primary: fetch class memberships from Backend ──────────────────────────
  const {
    data: classesResult,
    isLoading: isLoadingEnrollments,
  } = useQuery({
    queryKey: [MY_CLASSES_QUERY_KEY, user?.id],
    queryFn: () => classStudentsApi.getMyClasses(),
    enabled: !!isAuthenticated && !!user?.id,
    staleTime: 1000 * 60 * 2,
    // Do NOT use retry: false — let React Query retry on network errors naturally.
    // But do NOT transform errors into empty arrays (handled in getMyClasses itself).
  });

  // ─── Derive authoritative lifecycle state ───────────────────────────────────
  let state: StudentLifecycleState = "LOADING";
  let enrollments: MyClassEnrollment[] = [];
  let lifecycleError: StudentLifecycleError | undefined;

  if (!isLoadingEnrollments && classesResult !== undefined) {
    switch (classesResult.status) {
      case "ok":
        // INVARIANT-02 & INVARIANT-03: only 200 may produce PRE/ENROLLED
        enrollments = classesResult.data;
        state = enrollments.length > 0 ? "ENROLLED" : "PRE_ENROLLMENT";
        break;
      case "unauthenticated":
        // Treat as API_ERROR in lifecycle — auth redirect handled by ProtectedRoute
        state = "API_ERROR";
        lifecycleError = { httpStatus: 401, message: "Session expired" };
        break;
      case "api_error":
        // INVARIANT-01: 4xx/5xx MUST NOT become PRE_ENROLLMENT
        state = "API_ERROR";
        lifecycleError = {
          httpStatus: classesResult.httpStatus,
          message: classesResult.message,
        };
        break;
      case "network_error":
        state = "NETWORK_ERROR";
        lifecycleError = { message: classesResult.message };
        break;
    }
  }

  const hasEnrollments = state === "ENROLLED";

  // ─── Secondary: workspace (INVARIANT-04: only when ENROLLED) ─────────────────
  const { data: workspace, isLoading: isLoadingWorkspace } = useQuery({
    queryKey: ["student-workspace-summary", user?.id],
    queryFn: async () => {
      try {
        const result = await workspaceApi.getStudentWorkspace();
        return result?.data ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!isAuthenticated && !!user?.id && state === "ENROLLED",
    staleTime: 1000 * 60 * 2,
  });

  const dueTodayTasks = Array.isArray(workspace?.data?.dueToday) ? workspace.data.dueToday : [];
  const upcomingTasks = Array.isArray(workspace?.data?.upcoming) ? workspace.data.upcoming : [];
  const completedTasks = Array.isArray(workspace?.data?.completed) ? workspace.data.completed : [];
  const homeworkCount = dueTodayTasks.length + upcomingTasks.length + completedTasks.length;

  /**
   * Retry: invalidates the primary membership query and resets lifecycle to LOADING.
   * UI components should call this on "Retry" buttons — it restarts the full resolution.
   *
   * INVARIANT: Retry MUST reset to LOADING → full GET /classes/my-classes → resolve state.
   */
  const retry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [MY_CLASSES_QUERY_KEY, user?.id] });
  }, [queryClient, user?.id]);

  return {
    state,
    enrollments,
    lifecycleError,
    workspace: workspace?.data ?? null,
    hasEnrollments,
    homeworkCount,
    dueTodayTasks,
    upcomingTasks,
    completedTasks,
    isLoading: isLoadingEnrollments || (state === "ENROLLED" && isLoadingWorkspace),
    retry,
  };
}
