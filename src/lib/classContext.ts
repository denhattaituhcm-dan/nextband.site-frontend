import { MyClassEnrollment } from "@/lib/api";

/**
 * UUID v4 / General UUID strict validator regex.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Pure Boundary Guard: Validates that an identifier is a well-formed UUID.
 * Never allows garbage strings (e.g. ":classId", "undefined", "[object Object]") to pass to the network.
 */
export function isValidUUID(id: unknown): id is string {
  if (typeof id !== "string") return false;
  return UUID_REGEX.test(id.trim());
}

/**
 * Authoritative Error Taxonomy for Class Domain
 */
export type ClassDomainErrorType =
  | "INVALID_CLASS_ID"
  | "AUTH_REQUIRED"
  | "CLASS_ACCESS_DENIED"
  | "CLASS_NOT_FOUND"
  | "COURSE_NOT_CONFIGURED"
  | "NETWORK_ERROR"
  | "SERVER_ERROR";

export interface ClassDomainError {
  type: ClassDomainErrorType;
  message: string;
  httpStatus?: number;
}

/**
 * Result of Class Context Resolution
 */
export type ResolveClassResult =
  | {
      status: "AUTHORIZED";
      activeClass: MyClassEnrollment;
    }
  | {
      status: "INVALID_CLASS_ID";
      error: ClassDomainError;
    }
  | {
      status: "CLASS_ACCESS_DENIED";
      error: ClassDomainError;
    }
  | {
      status: "NO_ENROLLMENT";
      error: ClassDomainError;
    };

/**
 * Pure Class Context Resolver
 * 
 * INVARIANT-01 (NO SILENT FALLBACK):
 * If a targetClassId is provided, it MUST be a valid UUID and MUST exist in the student's enrollments.
 * If validation fails, it MUST return an explicit error state (INVALID_CLASS_ID or CLASS_ACCESS_DENIED).
 * It MUST NEVER silently fallback to enrollments[0].
 * 
 * Fallback to default class (e.g. enrollments[0]) is ONLY permitted when targetClassId is undefined/null
 * (e.g. at the Welcome/Home portal where no specific class route parameter was requested).
 */
export function resolveClassContext(
  enrollments: MyClassEnrollment[],
  targetClassId?: string | null
): ResolveClassResult {
  // If student has no enrollments confirmed
  if (!enrollments || enrollments.length === 0) {
    return {
      status: "NO_ENROLLMENT",
      error: {
        type: "CLASS_ACCESS_DENIED",
        message: "Bạn chưa được phân vào lớp học nào.",
      },
    };
  }

  // Case A: A specific targetClassId was requested (e.g. from Route URL /app/class/:classId/lessons)
  if (targetClassId !== undefined && targetClassId !== null) {
    // 1. Boundary Guard: Validate UUID format
    if (!isValidUUID(targetClassId)) {
      return {
        status: "INVALID_CLASS_ID",
        error: {
          type: "INVALID_CLASS_ID",
          message: "Mã định danh lớp học không hợp lệ. Vui lòng chọn lại lớp từ danh sách.",
        },
      };
    }

    // 2. Authorization Check: Must exist in student's verified memberships
    const matchedClass = enrollments.find((cls) => cls.classId === targetClassId);
    if (!matchedClass) {
      // INVARIANT-01: DO NOT fallback to enrollments[0]!
      return {
        status: "CLASS_ACCESS_DENIED",
        error: {
          type: "CLASS_ACCESS_DENIED",
          message: "Bạn không có quyền truy cập lớp học này hoặc lớp học không tồn tại.",
          httpStatus: 403,
        },
      };
    }

    return {
      status: "AUTHORIZED",
      activeClass: matchedClass,
    };
  }

  // Case B: No targetClassId provided (e.g. Default Home Portal selection)
  return {
    status: "AUTHORIZED",
    activeClass: enrollments[0],
  };
}

/**
 * Maps raw backend / Supabase exceptions into structured ClassDomainError.
 * Eradicates ambiguous error masking.
 */
export function classifyClassError(err: any): ClassDomainError {
  if (!err) {
    return {
      type: "SERVER_ERROR",
      message: "Đã xảy ra lỗi không xác định.",
      httpStatus: 500,
    };
  }

  const message = String(err.message || err.error || "");
  const status = Number(err.httpStatus || err.status || err.statusCode || 0);

  if (status === 401 || message.toLowerCase().includes("unauthenticated") || message.toLowerCase().includes("jwt")) {
    return {
      type: "AUTH_REQUIRED",
      message: "Phiên đăng nhập đã hết hạn. Đang chuyển hướng...",
      httpStatus: 401,
    };
  }

  if (status === 403 || message.toLowerCase().includes("từ chối") || message.toLowerCase().includes("không có quyền") || message.toLowerCase().includes("access denied")) {
    return {
      type: "CLASS_ACCESS_DENIED",
      message: "Bạn không có quyền truy cập vào nội dung lớp học này.",
      httpStatus: 403,
    };
  }

  if (status === 404 || message.toLowerCase().includes("not found") || message.toLowerCase().includes("không tìm thấy")) {
    return {
      type: "CLASS_NOT_FOUND",
      message: "Không tìm thấy thông tin lớp học trong hệ thống.",
      httpStatus: 404,
    };
  }

  if (message.includes("22P02") || message.toLowerCase().includes("invalid input syntax for type uuid") || message.toLowerCase().includes("invalid_class_id")) {
    return {
      type: "INVALID_CLASS_ID",
      message: "Định dạng mã lớp học không hợp lệ.",
      httpStatus: 400,
    };
  }

  if (message.toLowerCase().includes("course_not_configured") || message.toLowerCase().includes("chưa được gán khóa học")) {
    return {
      type: "COURSE_NOT_CONFIGURED",
      message: "Lớp học chưa được liên kết khóa học cha. Vui lòng liên hệ giáo viên.",
    };
  }

  if (message.toLowerCase().includes("fetch") || message.toLowerCase().includes("network") || message.toLowerCase().includes("failed to fetch")) {
    return {
      type: "NETWORK_ERROR",
      message: "Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng.",
    };
  }

  return {
    type: "SERVER_ERROR",
    message: message || "Lỗi hệ thống khi tải dữ liệu lớp học.",
    httpStatus: status || 500,
  };
}
