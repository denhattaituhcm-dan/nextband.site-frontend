export interface ExitContext {
  destination?: string;
  source?: "class_homework" | "course_detail" | "dashboard" | "direct" | string;
  classId?: string;
  courseId?: string;
}

/**
 * Chống lỗ hổng Open Redirect bằng cách chỉ cho phép các route nội bộ hợp lệ của NextBand
 */
export function sanitizeInternalRoute(path: string | null | undefined, fallback: string = "/my-courses"): string {
  if (!path || typeof path !== "string") {
    return fallback;
  }

  const trimmed = path.trim();

  // Bắt buộc phải bắt đầu bằng '/' và KHÔNG được bắt đầu bằng '//' (chống protocol-relative URL)
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  // Chặn javascript:, data:, http://, https://
  if (
    trimmed.toLowerCase().startsWith("/\\") ||
    /^\/[a-z0-9]+:/i.test(trimmed)
  ) {
    return fallback;
  }

  return trimmed;
}

/**
 * Xác định điểm điều hướng quay về theo 4 cấp ưu tiên (Exit Context Invariant):
 * 1. Explicit current navigation context (State)
 * 2. Persisted return context (URL Query parameter: returnUrl)
 * 3. Domain fallback (dựa theo classId hoặc courseId của exam)
 * 4. Global fallback (/my-courses)
 */
export function resolveExitDestination(
  exam?: { classId?: string; courseId?: string } | null,
  searchParams?: URLSearchParams | null,
  locationState?: { exitContext?: ExitContext; returnUrl?: string } | null
): string {
  // 1. Explicit current navigation context (Location State)
  if (locationState?.exitContext?.destination) {
    return sanitizeInternalRoute(locationState.exitContext.destination);
  }
  if (locationState?.returnUrl) {
    return sanitizeInternalRoute(locationState.returnUrl);
  }

  // 2. Persisted return context (URL Query Parameter: ?returnUrl=...)
  const queryReturnUrl = searchParams?.get("returnUrl");
  if (queryReturnUrl) {
    return sanitizeInternalRoute(queryReturnUrl);
  }

  // 3. Domain Fallback (Exam metadata)
  if (exam?.classId) {
    return `/class/${exam.classId}`;
  }
  if (exam?.courseId) {
    return `/course/${exam.courseId}`;
  }

  // 4. Global Fallback
  return "/my-courses";
}
