import { useQuery, useQueryClient } from "@tanstack/react-query";
import { classStudentsApi, MyClassEnrollment } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useCallback } from "react";
import { resolveClassContext, ResolveClassResult } from "@/lib/classContext";

/**
 * Authoritative lifecycle states for a student session.
 *
 * State machine (Pure Class Discovery - Single Source of Truth):
 *
 *   LOADING          → query in-flight
 *   PRE_ENROLLMENT   → 200 + data:[]  (Backend confirms: no enrollment)
 *   ENROLLED         → 200 + data:[…] (Backend confirms: has enrollment)
 *   API_ERROR        → 4xx / 5xx
 *   NETWORK_ERROR    → fetch exception / offline / timeout / rejection
 *
 * INVARIANT-01: API failure MUST NEVER produce PRE_ENROLLMENT.
 * INVARIANT-02: PRE_ENROLLMENT MUST ONLY originate from HTTP 200 + data:[].
 * INVARIANT-03: ENROLLED MUST ONLY originate from HTTP 200 + data.length > 0.
 * INVARIANT-04: FAULT ISOLATION: useStudentLifecycle MUST NOT depend on secondary
 *               widgets (workspace, homework, KPI, submissions, exams).
 * INVARIANT-05: TERMINAL STATE GUARANTEE: Every settled query MUST transition out
 *               of LOADING into a deterministic terminal state (isLoading === false).
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
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // ─── Primary: fetch class memberships from Backend ──────────────────────────
  const {
    data: classesResult,
    isLoading: isLoadingEnrollments,
    isError: isQueryError,
    error: queryError,
    status: queryStatus,
  } = useQuery({
    queryKey: [MY_CLASSES_QUERY_KEY, user?.id],
    queryFn: () => classStudentsApi.getMyClasses(),
    enabled: !!isAuthenticated && !!user?.id,
    staleTime: 1000 * 60 * 2,
    retry: false,
  });

  // ─── Derive authoritative lifecycle state ───────────────────────────────────
  let state: StudentLifecycleState = "LOADING";
  let enrollments: MyClassEnrollment[] = [];
  let lifecycleError: StudentLifecycleError | undefined;

  const isQuerySettled = queryStatus === "success" || queryStatus === "error";

  if (isQuerySettled) {
    if (isQueryError || !classesResult) {
      // Query threw an exception or returned undefined on error
      const err = queryError as any;
      const httpStatus = err?.httpStatus || err?.status;
      const message = err?.message || "Không thể kết nối máy chủ";

      if (httpStatus === 401 || httpStatus === 403) {
        state = "API_ERROR";
        lifecycleError = { httpStatus, message };
      } else if (httpStatus && httpStatus >= 400 && httpStatus < 600) {
        state = "API_ERROR";
        lifecycleError = { httpStatus, message };
      } else {
        state = "NETWORK_ERROR";
        lifecycleError = { message };
      }
    } else {
      switch (classesResult.status) {
        case "ok":
          enrollments = classesResult.data || [];
          state = enrollments.length > 0 ? "ENROLLED" : "PRE_ENROLLMENT";
          break;
        case "unauthenticated":
          state = "API_ERROR";
          lifecycleError = { httpStatus: 401, message: "Phiên đăng nhập đã hết hạn" };
          break;
        case "api_error":
          state = "API_ERROR";
          lifecycleError = {
            httpStatus: classesResult.httpStatus || 500,
            message: classesResult.message || "Lỗi máy chủ",
          };
          break;
        case "network_error":
          state = "NETWORK_ERROR";
          lifecycleError = {
            message: classesResult.message || "Không thể kết nối tới máy chủ",
          };
          break;
      }
    }
  } else if (!authLoading && !isAuthenticated) {
    // Settled unauthenticated state
    state = "API_ERROR";
    lifecycleError = { httpStatus: 401, message: "Chưa đăng nhập" };
  }

  const hasEnrollments = state === "ENROLLED";
  const isLoading = (authLoading || isLoadingEnrollments) && state === "LOADING";

  // ─── Pure Context Resolver (No Silent Fallback) ─────────────────────────────
  const resolveClass = useCallback(
    (targetClassId?: string | null): ResolveClassResult => {
      return resolveClassContext(enrollments, targetClassId);
    },
    [enrollments]
  );

  /**
   * Retry: invalidates the primary membership query and resets lifecycle to LOADING.
   */
  const retry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [MY_CLASSES_QUERY_KEY, user?.id] });
  }, [queryClient, user?.id]);

  return {
    state,
    enrollments,
    resolveClass,
    lifecycleError,
    hasEnrollments,
    isLoading,
    retry,
  };
}
