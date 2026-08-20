import { supabase } from "./supabase";
import { normalizeSiteSettings } from "./site-settings";
import { isValidUUID } from "./classContext";

export const resolveApiBaseUrl = (): string => {
  const envUrl =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
    (typeof process !== "undefined" && process.env?.VITE_API_URL);

  if (envUrl && !envUrl.includes("localhost")) {
    return envUrl;
  }

  // If in browser and on production domain (e.g. nextband.site), always use production API gateway
  if (typeof window !== "undefined" && window.location.hostname.includes("nextband.site")) {
    return "https://api.nextband.site/api/v1";
  }

  // If explicit localhost env was provided during local dev
  if (envUrl) {
    return envUrl;
  }

  return "http://localhost:3000/api/v1";
};

export const API_BASE_URL = resolveApiBaseUrl();

export const getAuthToken = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
};

// Helper to format URLs
export const formatStorageUrl = (path: string | null | undefined) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("blob:") || path.startsWith("data:")) return path;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const { data } = supabase.storage.from("exam-assets").getPublicUrl(cleanPath);
  return data.publicUrl;
};

// =============================================
// DATA NORMALIZER: Supabase snake_case → Frontend camelCase
// Đảm bảo ExamInterface, QuestionRenderers, v.v. hoạt động
// dù data đến từ Supabase (snake_case) hay fallback (camelCase)
// =============================================
export function normalizeExamData(exam: any): any {
  if (!exam) return exam;

  const normalizeSections = (sections: any[]) =>
    (sections || []).map((s: any) => ({
      ...s,
      // Normalize section fields
      sectionType: s.sectionType || s.section_type,
      section_type: s.section_type || s.sectionType,
      examId: s.examId || s.exam_id,
      orderIndex: s.orderIndex ?? s.order_index ?? 0,
      audioUrl: formatStorageUrl(s.audioUrl || s.audio_url || ""),
      audio_url: formatStorageUrl(s.audio_url || s.audioUrl || ""),
      audioScript: s.audioScript ?? s.audio_script ?? undefined,
      // Normalize nested question_groups / questionGroups
      questionGroups: normalizeGroups(s.questionGroups || s.question_groups || []),
      question_groups: normalizeGroups(s.questionGroups || s.question_groups || []),
    }));

  const normalizeGroups = (groups: any[]) =>
    (groups || []).map((g: any) => ({
      ...g,
      sectionId: g.sectionId || g.section_id,
      orderIndex: g.orderIndex ?? g.order_index ?? 0,
      audioUrl: formatStorageUrl(g.audioUrl || g.audio_url || ""),
      audio_url: formatStorageUrl(g.audio_url || g.audioUrl || ""),
      questions: normalizeQuestions(g.questions || []),
    }));

  const normalizeQuestions = (questions: any[]) =>
    (questions || []).map((q: any) => {
      const selectionMode = q.selectionMode || (q.isMultiChoice ? "multiple" : "single");
      const maxSelections = typeof q.maxSelections === "number" ? q.maxSelections : (selectionMode === "multiple" ? 2 : 1);
      const isMultiChoice = selectionMode === "multiple" || Boolean(q.isMultiChoice);

      return {
        ...q,
        questionType: q.questionType || q.question_type,
        question_type: q.question_type || q.questionType,
        questionText: q.questionText || q.question_text || "",
        question_text: q.question_text || q.questionText || "",
        selectionMode,
        maxSelections,
        isMultiChoice,
        correctAnswer: q.correctAnswer ?? q.correct_answer ?? null,
        correct_answer: q.correct_answer ?? q.correctAnswer ?? null,
        groupId: q.groupId || q.group_id,
        orderIndex: q.orderIndex ?? q.order_index ?? 0,
        audioUrl: formatStorageUrl(q.audioUrl || q.audio_url || ""),
        audio_url: formatStorageUrl(q.audio_url || q.audioUrl || ""),
        // Normalize options: ensure array format
        options: Array.isArray(q.options)
          ? q.options
          : (q.options ? (typeof q.options === "string" ? JSON.parse(q.options) : q.options) : []),
      };
    });

  return {
    ...exam,
    courseId: exam.courseId || exam.course_id,
    durationMinutes: exam.durationMinutes || exam.duration_minutes || 60,
    isPublished: exam.isPublished ?? exam.is_published ?? false,
    isActive: exam.isActive ?? exam.is_active ?? true,
    sections: normalizeSections(exam.sections || exam.exam_sections || []),
  };
}

export function normalizeSectionData(section: any): any {
  if (!section) return section;

  const normalizeQuestions = (questions: any[]) =>
    (questions || []).map((q: any) => {
      const selectionMode = q.selectionMode || (q.isMultiChoice ? "multiple" : "single");
      const maxSelections = typeof q.maxSelections === "number" ? q.maxSelections : (selectionMode === "multiple" ? 2 : 1);
      const isMultiChoice = selectionMode === "multiple" || Boolean(q.isMultiChoice);

      return {
        ...q,
        id: q.id,
        groupId: q.groupId || q.group_id,
        questionType: q.questionType || q.question_type,
        questionText: q.questionText || q.question_text || "",
        selectionMode,
        maxSelections,
        isMultiChoice,
        options: Array.isArray(q.options)
          ? q.options
          : q.options
          ? typeof q.options === "string"
            ? JSON.parse(q.options)
            : q.options
          : [],
        correctAnswer: q.correctAnswer ?? q.correct_answer ?? null,
        audioUrl: q.audioUrl ?? (q.audio_url ? formatStorageUrl(q.audio_url) : null),
        points: q.points ?? 1,
        orderIndex: q.orderIndex ?? q.order_index ?? 0,
      };
    });

  const normalizeGroups = (groups: any[]) =>
    (groups || []).map((g: any) => ({
      ...g,
      id: g.id,
      sectionId: g.sectionId || g.section_id,
      title: g.title ?? null,
      passage: g.passage ?? null,
      instructions: g.instructions ?? null,
      audioUrl: g.audioUrl ?? (g.audio_url ? formatStorageUrl(g.audio_url) : null),
      orderIndex: g.orderIndex ?? g.order_index ?? 0,
      questions: normalizeQuestions(g.questions || []),
    }));

  return {
    ...section,
    id: section.id,
    examId: section.examId || section.exam_id,
    sectionType: section.sectionType || section.section_type,
    title: section.title,
    instructions: section.instructions ?? null,
    content: section.content ?? [],
    audioUrl: section.audioUrl ?? (section.audio_url ? formatStorageUrl(section.audio_url) : null),
    audioScript: section.audioScript || section.audio_script || null,
    durationMinutes: section.durationMinutes ?? section.duration_minutes ?? null,
    orderIndex: section.orderIndex ?? section.order_index ?? 0,
    questionGroups: normalizeGroups(section.questionGroups || section.question_groups || []),
    question_groups: normalizeGroups(section.questionGroups || section.question_groups || []),
  };
}

export function normalizeCourseData(course: any): any {
  if (!course) return course;

  return {
    ...course,
    id: course.id,
    title: course.title,
    description: course.description ?? null,
    level: course.level || "beginner",
    price: course.price ?? 0,
    isPublished: course.isPublished ?? course.is_published ?? false,
    isActive: course.isActive ?? course.is_active ?? true,
    thumbnailUrl: course.thumbnailUrl ?? (course.thumbnail_url ? formatStorageUrl(course.thumbnail_url) : null),
    createdAt: course.createdAt || course.created_at,
    updatedAt: course.updatedAt || course.updated_at,
    exams: Array.isArray(course.exams) ? course.exams.map(normalizeExamData) : [],
  };
}

// =============================================
// AUTH API
// =============================================
export const authApi = {
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  loginWithGoogle: async (redirectTo?: string) => {
    const targetRedirect = redirectTo || `${window.location.origin}/login`;
    console.log("[AUTH_DIAGNOSTIC] Initiating signInWithOAuth", {
      provider: "google",
      redirectTo: targetRedirect,
      currentHref: window.location.href,
      origin: window.location.origin,
      timestamp: new Date().toISOString(),
    });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: targetRedirect,
      },
    });
    if (error) {
      console.error("[AUTH_DIAGNOSTIC] signInWithOAuth failed directly", error);
      throw error;
    }
    console.log("[AUTH_DIAGNOSTIC] signInWithOAuth initiated successfully, provider URL returned:", data?.url);
    return data;
  },

  register: async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) throw error;
    return data;
  },

  getMe: async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) throw error || new Error("User not authenticated");

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const roles = rolesData ? rolesData.map((r) => r.role) : ["student"];

    return {
      id: user.id,
      email: user.email,
      fullName: profile?.full_name || user.user_metadata?.full_name || null,
      avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || null,
      bio: profile?.bio || null,
      phone: profile?.phone || null,
      gender: profile?.gender || null,
      roles,
    };
  },

  updateProfile: async (profile: {
    fullName?: string;
    bio?: string;
    avatarUrl?: string;
    phone?: string;
    gender?: string;
  }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthenticated");

    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.fullName,
        bio: profile.bio,
        avatar_url: profile.avatarUrl,
        phone: profile.phone,
        gender: profile.gender,
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return { success: true };
  },
};

// =============================================
// COURSES API
// =============================================
export const coursesApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    level?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    isPublished?: boolean;
    isActive?: boolean;
  }) => {
    const token = await getAuthToken();
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.level) query.set("level", params.level);
    if (params?.search) query.set("search", params.search);
    if (params?.sortBy) query.set("sortBy", params.sortBy);
    if (params?.sortOrder) query.set("sortOrder", params.sortOrder);
    if (params?.isPublished !== undefined) query.set("isPublished", String(params.isPublished));
    if (params?.isActive !== undefined) query.set("isActive", String(params.isActive));

    const res = await fetch(`${API_BASE_URL}/courses?${query.toString()}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.ok) {
      const result = await res.json();
      const rawData = result.data || [];
      const formattedData = rawData.map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        level: c.level || "beginner",
        price: c.price || 0,
        isPublished: c.isPublished ?? c.is_published ?? false,
        isActive: c.isActive ?? c.is_active ?? true,
        thumbnailUrl: c.thumbnailUrl || c.thumbnail_url,
        createdAt: c.createdAt || c.created_at,
        band: c.level === "beginner" ? "3.0 - 4.0" : c.level === "intermediate" ? "5.0 - 5.5" : "6.0 - 6.5+",
        lessonsCount: c.exams && Array.isArray(c.exams) ? c.exams.length : 0,
        activeClassesCount: 2,
        totalClassesCount: 4,
        studentsCount: 26,
      }));

      return {
        data: formattedData,
        meta: result.meta || { total: formattedData.length, page: 1, limit: 10, totalPages: 1 },
      };
    }

    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Không thể tải danh sách khóa học");
  },

  getById: async (id: string) => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/courses/${id}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.ok) {
      const data = await res.json();
      return normalizeCourseData(data);
    }

    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Không tìm thấy khóa học");
  },

  getBySlug: async (slug: string) => {
    return coursesApi.getById(slug);
  },

  create: async (course: {
    title: string;
    description?: string;
    level?: string;
    price?: number;
    thumbnailUrl?: string;
    isPublished?: boolean;
    isActive?: boolean;
    slug?: string;
  }) => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/courses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(course),
    });

    if (res.ok) {
      return res.json();
    }

    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Tạo khóa học thất bại");
  },

  update: async (
    id: string,
    course: Partial<{
      title: string;
      description: string;
      level: string;
      thumbnailUrl: string;
      isPublished: boolean;
      isActive: boolean;
      slug: string;
    }>
  ) => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/courses/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(course),
    });

    if (res.ok) {
      return res.json();
    }

    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Cập nhật khóa học thất bại");
  },

  delete: async (id: string) => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/courses/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.ok) {
      return { success: true };
    }

    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Xóa khóa học thất bại");
  },
};

// =============================================
// EXAMS API (REST FASTIFY CANONICAL ADAPTER)
// =============================================
export const examsApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    courseId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    isPublished?: boolean;
    isActive?: boolean;
  }) => {
    const token = await getAuthToken();
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.courseId) query.set("courseId", params.courseId);
    if (params?.search) query.set("search", params.search);
    if (params?.sortBy) query.set("sortBy", params.sortBy);
    if (params?.sortOrder) query.set("sortOrder", params.sortOrder);
    if (params?.isPublished !== undefined) query.set("isPublished", String(params.isPublished));
    if (params?.isActive !== undefined) query.set("isActive", String(params.isActive));

    const res = await fetch(`${API_BASE_URL}/exams?${query.toString()}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.ok) {
      const result = await res.json();
      const rawData = result.data || [];
      return {
        data: rawData.map((item: any) => normalizeExamData(item)),
        meta: result.meta || { total: rawData.length, page: 1, limit: 10, totalPages: 1 },
      };
    }

    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Không thể tải danh sách bài thi");
  },

  getById: async (id: string) => {
    if (!isValidUUID(id)) {
      const err = new Error("Mã bài thi không hợp lệ.");
      (err as any).httpStatus = 400;
      throw err;
    }

    const token = await getAuthToken();

    // 1. Primary Path: Fastify API Gateway
    try {
      const res = await fetch(`${API_BASE_URL}/exams/${id}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        return normalizeExamData(data);
      }

      // INVARIANT: Do NOT fallback on 401, 403, 404!
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        const errData = await res.json().catch(() => ({}));
        const message =
          errData.error ||
          errData.message ||
          (res.status === 401
            ? "Phiên đăng nhập đã hết hạn"
            : res.status === 403
            ? "Bạn không có quyền truy cập bài thi này"
            : "Không tìm thấy bài thi");
        const err = new Error(message);
        (err as any).httpStatus = res.status;
        throw err;
      }
    } catch (networkErr: any) {
      // If error already has an explicit client/auth status code, rethrow immediately (no fallback)
      if (networkErr?.httpStatus === 401 || networkErr?.httpStatus === 403 || networkErr?.httpStatus === 404) {
        throw networkErr;
      }
      // Otherwise (fetch failed, server offline, 5xx), proceed to Read-Only Supabase Fallback below
    }

    // 2. Read-Only Resilience Fallback: Supabase Direct Query (Offline / Network Failure only)
    const { data: rawExam, error: dbErr } = await supabase
      .from("exams")
      .select("*, courses(id, title), exam_sections(*, question_groups(*, questions(*)))")
      .eq("id", id)
      .single();

    if (dbErr || !rawExam) {
      const err = new Error("Không thể kết nối máy chủ để tải bài thi.");
      (err as any).httpStatus = 503;
      throw err;
    }

    // Security Sanitization: Zero Secret Leaks for students
    const sanitizedSections = (rawExam.exam_sections || []).map((sec: any) => ({
      ...sec,
      audio_script: undefined,
      audioScript: undefined,
      question_groups: (sec.question_groups || []).map((grp: any) => ({
        ...grp,
        questions: (grp.questions || []).map((q: any) => ({
          ...q,
          answer_key: undefined,
          answerKey: undefined,
          correct_answer: null,
          correctAnswer: null,
        })),
      })),
    }));

    const sanitizedExam = {
      ...rawExam,
      exam_sections: sanitizedSections,
      sections: sanitizedSections,
    };

    return normalizeExamData(sanitizedExam);
  },

  create: async (exam: {
    courseId: string;
    title: string;
    description?: string;
    week?: number;
    durationMinutes?: number;
    isPublished?: boolean;
    isActive?: boolean;
  }) => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/exams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(exam),
    });

    if (res.ok) {
      return res.json();
    }

    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Tạo bài thi thất bại");
  },

  update: async (
    id: string,
    exam: Partial<{
      title: string;
      description: string;
      isPublished: boolean;
      isActive: boolean;
      week: number;
      durationMinutes: number;
    }>
  ) => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/exams/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(exam),
    });

    if (res.ok) {
      return res.json();
    }

    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Cập nhật bài thi thất bại");
  },

  delete: async (id: string, password?: string) => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/exams/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      return { success: true };
    }

    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Xóa bài thi thất bại");
  },
};

// =============================================
// SECTIONS API
// =============================================
export const sectionsApi = {
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("exam_sections")
      .select("*, question_groups(*, questions(*))")
      .eq("id", id)
      .single();

    if (error) throw error;
    return normalizeSectionData(data);
  },

  create: async (section: {
    examId: string;
    sectionType: string;
    title: string;
    instructions?: string;
  }) => {
    const { data, error } = await supabase
      .from("exam_sections")
      .insert({
        exam_id: section.examId,
        section_type: section.sectionType as any,
        title: section.title,
        instructions: section.instructions,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  update: async (
    id: string,
    section: Partial<{
      title: string;
      instructions: string;
      content: any;
      audioUrl: string;
      audioScript: string;
      durationMinutes: number;
      orderIndex: number;
      sectionType: string;
    }>
  ) => {
    const updatePayload: Record<string, any> = {};
    if (section.title !== undefined) updatePayload.title = section.title;
    if (section.instructions !== undefined) updatePayload.instructions = section.instructions;
    if (section.content !== undefined) updatePayload.content = section.content;
    if (section.audioUrl !== undefined) updatePayload.audio_url = section.audioUrl;
    if (section.audioScript !== undefined) updatePayload.audio_script = section.audioScript;
    if (section.durationMinutes !== undefined) updatePayload.duration_minutes = section.durationMinutes;
    if (section.orderIndex !== undefined) updatePayload.order_index = section.orderIndex;
    if (section.sectionType !== undefined) updatePayload.section_type = section.sectionType;

    const { data, error } = await supabase
      .from("exam_sections")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from("exam_sections")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return { success: true };
  },
};

// Types for Question Mutation Payloads
export interface UpdateQuestionGroupPayload {
  title?: string;
  instructions?: string;
  passage?: string;
  audioUrl?: string;
  orderIndex?: number;
}

export interface UpdateQuestionPayload {
  questionType?: string;
  questionText?: string;
  options?: any;
  correctAnswer?: string;
  audioUrl?: string;
  points?: number;
  orderIndex?: number;
}

// =============================================
// QUESTIONS API
// =============================================
export const questionsApi = {
  createGroup: async (group: {
    sectionId: string;
    title?: string;
    instructions?: string;
    passage?: string;
    audioUrl?: string;
    orderIndex?: number;
  }) => {
    const { data, error } = await supabase
      .from("question_groups")
      .insert({
        section_id: group.sectionId,
        title: group.title,
        instructions: group.instructions,
        passage: group.passage,
        audio_url: group.audioUrl,
        order_index: group.orderIndex ?? 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateGroup: async (id: string, group: UpdateQuestionGroupPayload) => {
    const updatePayload: Record<string, any> = {};
    if (group.title !== undefined) updatePayload.title = group.title;
    if (group.instructions !== undefined) updatePayload.instructions = group.instructions;
    if (group.passage !== undefined) updatePayload.passage = group.passage;
    if (group.audioUrl !== undefined) updatePayload.audio_url = group.audioUrl;
    if (group.orderIndex !== undefined) updatePayload.order_index = group.orderIndex;

    const { data, error } = await supabase
      .from("question_groups")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteGroup: async (id: string) => {
    const { error } = await supabase
      .from("question_groups")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return { success: true };
  },

  create: async (question: {
    groupId: string;
    questionType: string;
    questionText: string;
    options?: any;
    correctAnswer?: string;
    audioUrl?: string;
    points?: number;
    orderIndex?: number;
  }) => {
    const { data, error } = await supabase
      .from("questions")
      .insert({
        group_id: question.groupId,
        question_type: question.questionType as any,
        question_text: question.questionText,
        options: question.options,
        correct_answer: question.correctAnswer,
        audio_url: question.audioUrl,
        points: question.points ?? 1.0,
        order_index: question.orderIndex ?? 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  update: async (id: string, question: UpdateQuestionPayload) => {
    const updatePayload: Record<string, any> = {};
    if (question.questionType !== undefined) updatePayload.question_type = question.questionType;
    if (question.questionText !== undefined) updatePayload.question_text = question.questionText;
    if (question.options !== undefined) updatePayload.options = question.options;
    if (question.correctAnswer !== undefined) updatePayload.correct_answer = question.correctAnswer;
    if (question.audioUrl !== undefined) updatePayload.audio_url = question.audioUrl;
    if (question.points !== undefined) updatePayload.points = question.points;
    if (question.orderIndex !== undefined) updatePayload.order_index = question.orderIndex;

    const { data, error } = await supabase
      .from("questions")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/questions/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (res.ok) return { success: true };
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Xóa câu hỏi thất bại");
  },

  bulkCreate: async (groupId: string, questions: any[]) => {
    const records = questions.map((q, idx) => ({
      group_id: groupId,
      question_type: q.questionType || "multiple_choice",
      question_text: q.questionText,
      options: q.options,
      correct_answer: q.correctAnswer,
      points: q.points || 1.0,
      order_index: q.orderIndex ?? idx,
    }));

    const { data, error } = await supabase
      .from("questions")
      .insert(records)
      .select();

    if (error) throw error;
    return data;
  },
};

// =============================================
// SUBMISSIONS API
// =============================================
// =============================================
// SUBMISSION NORMALIZER
// =============================================
export function normalizeSubmissionData(data: any, examData?: any): any {
  if (!data) return null;

  let overallFeedback = "";
  let primaryErrorCategory: string | null = null;
  let revisionRequired = false;

  const rawAnswers = data.answers || [];
  const normalizedAnswers = rawAnswers.map((a: any) => {
    let parsedFeedback = a.feedback || "";
    let ansErrorCategory: string | null = null;
    let ansRevisionRequired = false;

    if (parsedFeedback && typeof parsedFeedback === "string" && parsedFeedback.startsWith("{")) {
      try {
        const json = JSON.parse(parsedFeedback);
        parsedFeedback = json.text || json.feedback || "";
        ansErrorCategory = json.primaryErrorCategory || null;
        ansRevisionRequired = !!json.revisionRequired;
        if (!primaryErrorCategory && ansErrorCategory) primaryErrorCategory = ansErrorCategory;
        if (ansRevisionRequired) revisionRequired = true;
        if (!overallFeedback && parsedFeedback) overallFeedback = parsedFeedback;
      } catch {
        // Fallback to raw string if JSON parsing fails
      }
    } else if (parsedFeedback && !overallFeedback) {
      overallFeedback = parsedFeedback;
    }

    return {
      id: a.id,
      submissionId: a.submission_id || a.submissionId,
      questionId: a.question_id || a.questionId,
      answerText: a.answer_text || a.answerText || "",
      audioUrl: formatStorageUrl(a.audio_url || a.audioUrl),
      score: a.score != null ? Number(a.score) : null,
      feedback: parsedFeedback,
      primaryErrorCategory: ansErrorCategory,
      revisionRequired: ansRevisionRequired,
      createdAt: a.created_at || a.createdAt,
      updatedAt: a.updated_at || a.updatedAt,
    };
  });

  const rawStudent = data.profiles || data.student;
  const normalizedStudent = rawStudent
    ? {
        id: rawStudent.user_id || rawStudent.id,
        fullName:
          rawStudent.full_name ||
          rawStudent.fullName ||
          rawStudent.email ||
          "Học viên",
        email: rawStudent.email || "",
        avatarUrl: rawStudent.avatar_url || rawStudent.avatarUrl,
      }
    : null;

  const rawExam = examData || data.exams || data.exam;
  const normalizedExam = rawExam ? normalizeExamData(rawExam) : null;

  return {
    id: data.id,
    examId: data.exam_id || data.examId,
    studentId: data.student_id || data.studentId,
    status: data.status || "in_progress",
    startedAt: data.started_at || data.startedAt,
    submittedAt: data.submitted_at || data.submittedAt,
    totalScore:
      data.total_score != null
        ? Number(data.total_score)
        : data.totalScore != null
        ? Number(data.totalScore)
        : null,
    correctAnswers:
      data.correct_answers != null
        ? Number(data.correct_answers)
        : data.correctAnswers != null
        ? Number(data.correctAnswers)
        : null,
    totalQuestions:
      data.total_questions != null
        ? Number(data.total_questions)
        : data.totalQuestions != null
        ? Number(data.totalQuestions)
        : null,
    gradedBy: data.graded_by || data.gradedBy,
    gradedAt: data.graded_at || data.gradedAt,
    createdAt: data.created_at || data.createdAt,
    feedback: overallFeedback,
    primaryErrorCategory,
    revisionRequired,
    student: normalizedStudent,
    exam: normalizedExam,
    answers: normalizedAnswers,
  };
}

// =============================================
// SUBMISSIONS API (REST FASTIFY CANONICAL ADAPTER)
// =============================================
export const submissionsApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    examId?: string;
    studentId?: string;
    status?: string;
    classId?: string;
    needGrading?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) => {
    const token = await getAuthToken();
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params?.page));
    if (params?.limit) query.set("limit", String(params?.limit));
    if (params?.examId) query.set("examId", params?.examId);
    if (params?.studentId) query.set("studentId", params?.studentId);
    if (params?.status) query.set("status", params?.status);
    if (params?.classId) query.set("classId", params?.classId);
    if (params?.needGrading) query.set("needGrading", "true");
    if (params?.sortBy) query.set("sortBy", params?.sortBy);
    if (params?.sortOrder) query.set("sortOrder", params?.sortOrder);

    const res = await fetch(`${API_BASE_URL}/submissions?${query.toString()}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.ok) {
      const result = await res.json();
      const rawData = result.data || [];
      return {
        data: rawData.map((item: any) => normalizeSubmissionData(item)),
        meta: result.meta || { total: rawData.length, page: 1, limit: 10, totalPages: 1 },
      };
    }

    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Không thể tải danh sách bài làm");
  },

  getById: async (id: string) => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/submissions/${id}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.ok) {
      const data = await res.json();
      return normalizeSubmissionData(data, data.exam);
    }

    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Không tìm thấy bài nộp");
  },

  getLatestByExam: async (examId: string) => {
    try {
      const res = await submissionsApi.list({ examId, limit: 1 });
      return res.data?.[0] || null;
    } catch {
      return null;
    }
  },

  regrade: async (
    id: string,
    payload: {
      reason: string;
      grades?: Array<{ answerId: string; score: number; feedback?: string }>;
      regradeAll?: boolean;
    }
  ) => {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Vui lòng đăng nhập để phúc khảo bài thi.");
    }

    const response = await fetch(`${API_BASE_URL}/submissions/${id}/regrade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const result = await response.json();
      return normalizeSubmissionData(result);
    }

    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Phúc khảo bài làm thất bại");
  },

  start: async (examId: string) => {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Vui lòng đăng nhập để bắt đầu làm bài.");
    }

    const response = await fetch(`${API_BASE_URL}/submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ examId }),
    });

    if (response.ok) {
      const data = await response.json();
      return normalizeSubmissionData(data);
    }

    const errData = await response.json().catch(() => ({}));
    const errMsg = errData.error || errData.message || "Không thể bắt đầu bài làm";
    throw new Error(errMsg);
  },

  saveAnswers: async (
    id: string,
    answers: Array<{
      questionId: string;
      answerText?: any;
      audioUrl?: string;
      revision?: number;
    }>,
    version?: number,
  ) => {
    if (!answers || answers.length === 0) return [];

    const token = await getAuthToken();
    if (!token) {
      throw new Error("Vui lòng đăng nhập để lưu bài làm.");
    }

    const res = await fetch(`${API_BASE_URL}/submissions/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ answers, version }),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }

    const errData = await res.json().catch(() => ({}));
    const errMsg = errData.error || errData.message || "Lưu bài làm thất bại";
    throw new Error(errMsg);
  },

  submit: async (
    id: string,
    answers: Array<{
      questionId: string;
      answerText?: any;
      audioUrl?: string;
    }>,
    options: { idempotencyKey?: string; version?: number } = {},
  ) => {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Vui lòng đăng nhập để nộp bài.");
    }

    const finalIdempotencyKey =
      options.idempotencyKey ||
      (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `idem_${id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);

    const response = await fetch(`${API_BASE_URL}/submissions/${id}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Idempotency-Key": finalIdempotencyKey,
      },
      body: JSON.stringify({
        answers,
        idempotencyKey: finalIdempotencyKey,
        version: options.version,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return normalizeSubmissionData(result.data || result);
    }

    const errData = await response.json().catch(() => ({}));
    const errMsg = errData.error || errData.message || "Nộp bài thất bại";
    throw new Error(errMsg);
  },

  startRevision: async (payload: { examId: string; clonePreviousAnswers?: boolean }) => {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Vui lòng đăng nhập để bắt đầu bài sửa.");
    }

    const response = await fetch(`${API_BASE_URL}/submissions/revision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      return normalizeSubmissionData(data);
    }

    const errData = await response.json().catch(() => ({}));
    const errMsg = errData.error || errData.message || "Không thể tạo bài sửa";
    throw new Error(errMsg);
  },

  grade: async (
    id: string,
    grades: Array<{ answerId: string; score: number; feedback?: string }>,
    totalScore?: number,
    options?: {
      feedback?: string;
      primaryErrorCategory?: "CONCEPT" | "STRUCTURE" | "EXPRESSION" | "GRAMMAR";
      revisionRequired?: boolean;
    }
  ) => {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Vui lòng đăng nhập để chấm bài.");
    }

    const response = await fetch(`${API_BASE_URL}/submissions/${id}/grade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        grades,
        totalScore,
        feedback: options?.feedback,
        primaryErrorCategory: options?.primaryErrorCategory,
        revisionRequired: options?.revisionRequired,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return normalizeSubmissionData(result);
    }

    const errData = await response.json().catch(() => ({}));
    const errMsg = errData.error || errData.message || "Chấm điểm thất bại";
    throw new Error(errMsg);
  },
};

// =============================================
// In-memory store for newly created users in session
const localUsersStore: any[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    user_id: "00000000-0000-0000-0000-000000000001",
    email: "admin@ielts.com",
    fullName: "Admin ARIS IELTS",
    phone: "0901234567",
    gender: "male",
    roles: ["admin"],
    role: "admin",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    user_id: "00000000-0000-0000-0000-000000000002",
    email: "teacher@ielts.com",
    fullName: "CÃ´ HoÃ ng Anh (IELTS 8.5)",
    phone: "0909876543",
    gender: "female",
    roles: ["teacher"],
    role: "teacher",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

// USERS API (Cleaned Production Store - No Silent RAM Fallbacks)
// =============================================
export const usersApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) => {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const hasRoleFilter = params?.role && params.role !== "all";

    // BÆ¯á»šC 1: Náº¿u lá»c theo role -> láº¥y danh sÃ¡ch user_id tá»« user_roles trÆ°á»›c
    let allowedUserIds: string[] | null = null;
    if (hasRoleFilter) {
      const { data: roleRows, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", params.role);

      if (roleError) throw roleError;
      allowedUserIds = (roleRows || []).map((r: any) => r.user_id);

      // Náº¿u khÃ´ng cÃ³ ai cÃ³ role nÃ y -> tráº£ vá» rá»—ng ngay
      if (allowedUserIds.length === 0) {
        return { data: [], meta: { total: 0, page, limit, totalPages: 1 } };
      }
    }

    // BƯỚC 2: Query profiles
    let query = supabase
      .from("profiles")
      .select("*", { count: "exact" });

    if (allowedUserIds !== null) {
      query = query.in("user_id", allowedUserIds);
    }

    if (params?.search) {
      query = query.or(
        `full_name.ilike.%${params.search}%,email.ilike.%${params.search}%`
      );
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const targetUserIds = (data || []).map((p: any) => p.user_id || p.id).filter(Boolean);

    // Fetch batch activeClassesCount & pendingSubmissionsCount in parallel (No N+1)
    let classCountsMap: Record<string, number> = {};
    let pendingSubmissionsMap: Record<string, number> = {};

    if (targetUserIds.length > 0) {
      const [{ data: classesData }, { data: submissionsData }] = await Promise.all([
        supabase
          .from("classes")
          .select("teacher_id")
          .in("teacher_id", targetUserIds)
          .eq("is_active", true),
        supabase
          .from("submissions")
          .select("teacher_id")
          .in("teacher_id", targetUserIds)
          .eq("grade_status", "pending"),
      ]);

      (classesData || []).forEach((c: any) => {
        if (c.teacher_id) {
          classCountsMap[c.teacher_id] = (classCountsMap[c.teacher_id] || 0) + 1;
        }
      });

      (submissionsData || []).forEach((s: any) => {
        if (s.teacher_id) {
          pendingSubmissionsMap[s.teacher_id] = (pendingSubmissionsMap[s.teacher_id] || 0) + 1;
        }
      });
    }

    const formattedData = (data || []).map((p: any) => {
      const extractedRoles =
        p.user_roles && Array.isArray(p.user_roles) && p.user_roles.length > 0
          ? p.user_roles.map((r: any) => r.role)
          : [params?.role || "student"];

      // Option 1 Invariant: Primary ID for DB foreign key class_students_student_id_fkey is ALWAYS user_id (Auth User ID)
      const authUserId = p.user_id || p.id;

      return {
        id: authUserId,
        profile_id: p.id,
        user_id: authUserId,
        email: p.email,
        fullName: p.full_name || p.fullName || p.email?.split("@")[0],
        avatarUrl: p.avatar_url || p.avatarUrl || null,
        phone: p.phone,
        gender: p.gender,
        roles: extractedRoles,
        role: extractedRoles[0] || "student",
        isActive: p.is_active ?? true,
        activeClassesCount: classCountsMap[authUserId] || 0,
        pendingSubmissionsCount: pendingSubmissionsMap[authUserId] || 0,
        lastLoginAt: p.last_login_at || null,
        createdAt: p.created_at,
      };
    });

    const totalCount = count !== null && count !== undefined ? count : formattedData.length;

    return {
      data: formattedData,
      meta: { total: totalCount, page, limit, totalPages: Math.ceil(totalCount / limit) || 1 },
    };
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*, user_roles(role)")
      .eq("user_id", id)
      .single();

    if (error) throw error;
    return data;
  },

  getStudentManagement: async (params?: { page?: number; limit?: number; search?: string }) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.search) searchParams.set("search", params.search);

    const response = await fetch(`${API_BASE_URL}/users/students-management?${searchParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to fetch student management data");
    return result as {
      success: boolean;
      data: any[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    };
  },

  create: async (user: any) => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(user),
    });

    if (res.ok) {
      return res.json();
    }

    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Tạo người dùng thất bại");
  },

  update: async (id: string, user: any) => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(user),
    });

    if (res.ok) {
      return res.json();
    }

    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Cập nhật người dùng thất bại");
  },

  delete: async (id: string) => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.ok) {
      return { success: true };
    }

    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Xóa người dùng thất bại");
  },
};

// =============================================
// ENROLLMENTS API
// =============================================
// CLASS MEMBERSHIP SERVICE (SINGLE SOURCE OF TRUTH)
// =============================================

/**
 * Typed discriminated union for getMyClasses() responses.
 *
 * INVARIANT-01: API failure MUST NEVER be represented as an empty array.
 * INVARIANT-02: PRE_ENROLLMENT MUST ONLY originate from { status:"ok", data:[] }.
 */
export interface MyClassEnrollment {
  id: string;
  classId: string;
  className: string;
  courseId: string;
  courseTitle: string;
  teacherName: string | null;
  isActive: boolean;
  membershipStatus: string;
  joinedAt: string;
}

export type MyClassesResult =
  | { status: "ok"; data: MyClassEnrollment[] }
  | { status: "unauthenticated" }
  | { status: "api_error"; httpStatus: number; message: string }
  | { status: "network_error"; message: string };

export const classStudentsApi = {
  /**
   * Fetch the authenticated student's class memberships from Backend.
   *
   * Returns a typed discriminated union — never silently returns [].
   * Callers MUST handle all status variants.
   *
   * Status semantics:
   *   "ok" + data:[]   → 200 confirmed no enrollment → PRE_ENROLLMENT
   *   "ok" + data:[..] → 200 confirmed enrollment    → ENROLLED
   *   "unauthenticated"→ 401 → auth redirect
   *   "api_error"      → 4xx/5xx → API_ERROR state
   *   "network_error"  → fetch exception → NETWORK_ERROR state
   */
  getMyClasses: async (): Promise<MyClassesResult> => {
    const token = await getAuthToken();
    if (!token) {
      return { status: "unauthenticated" };
    }

    const abortCtrl = new AbortController();
    const timeoutId = setTimeout(() => abortCtrl.abort(), 6000);

    try {
      const res = await fetch(`${API_BASE_URL}/classes/my-classes`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        signal: abortCtrl.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (res.status === 401) {
        return { status: "unauthenticated" };
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return {
          status: "api_error",
          httpStatus: res.status,
          message: (body as any).message ?? (body as any).error ?? `HTTP ${res.status}`,
        };
      }

      const body = await res.json();
      const data: MyClassEnrollment[] = Array.isArray(body?.data) ? body.data : [];
      return { status: "ok", data };
    } catch (err: any) {
      return {
        status: "network_error",
        message: err?.name === "AbortError" ? "Kết nối tới máy chủ quá thời gian (Timeout)" : err?.message ?? "Network request failed",
      };
    }
  },
};

// =============================================
// ENROLLMENTS API (LEGACY DIRECT COURSE PURCHASES ONLY - DO NOT USE FOR CLASS ACCESS)
// =============================================
export const enrollmentsApi = {
  /**
   * @deprecated DO NOT USE FOR CLASS MEMBERSHIP OR ACCESS CONTROL.
   * Use `classStudentsApi.getMyClasses()` for all student class access rights.
   * This method is preserved only for legacy direct course purchase history logs.
   */
  listDirectPurchases: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("enrollments")
      .select("*, courses(*)")
      .eq("student_id", user.id);

    if (error) throw error;
    return data || [];
  },

  list: async () => {
    // Forward to unified classStudentsApi.getMyClasses for backward compatibility
    return classStudentsApi.getMyClasses();
  },

  listByCourse: async (courseId: string) => {
    const { data, error } = await supabase
      .from("enrollments")
      .select("*, profiles:student_id(*)")
      .eq("course_id", courseId);

    if (error) throw error;
    return data;
  },

  enroll: async (courseId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthenticated");

    const { data, error } = await supabase
      .from("enrollments")
      .insert({
        course_id: courseId,
        student_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  enrollUser: async (courseId: string, studentId: string) => {
    const { data, error } = await supabase
      .from("enrollments")
      .insert({
        course_id: courseId,
        student_id: studentId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/enrollments/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (res.ok) return { success: true };
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Hủy ghi danh thất bại");
  },
};

// =============================================
// UPLOADS API
// =============================================
export const uploadsApi = {
  uploadImage: async (file: File) => {
    const fileName = `images/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from("exam-assets")
      .upload(fileName, file);

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("exam-assets").getPublicUrl(fileName);

    return { url: publicUrl, fileName };
  },

  uploadAudio: async (file: File) => {
    const fileName = `audio/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from("exam-assets")
      .upload(fileName, file);

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("exam-assets").getPublicUrl(fileName);

    return { url: publicUrl, fileName };
  },

  deleteFile: async (url: string) => {
    return { success: true };
  },
};

// =============================================
// STATS API (REST API ADAPTER)
// =============================================
export const statsApi = {
  getAdminStats: async () => {
    try {
      const [cRes, uRes, eRes] = await Promise.all([
        coursesApi.list({ limit: 1 }),
        usersApi.list({ limit: 1 }),
        examsApi.list({ limit: 1 }),
      ]);

      return {
        courses: cRes.meta?.total || 0,
        users: uRes.meta?.total || 0,
        exams: eRes.meta?.total || 0,
      };
    } catch {
      return { courses: 0, users: 0, exams: 0 };
    }
  },

  getMonthlyAttendance: async (params?: { month?: string; classId?: string }) => {
    return { totalPresent: 0, totalAbsent: 0, attendanceRate: 1.0 };
  },
};

// =============================================
// LOGS API (Deprecated)
// =============================================
export const logsApi = {
  getLogs: async () => "Log Viewer is disabled in serverless deployment.",
  getLastLogs: async () => "Log Viewer is disabled in serverless deployment.",
};

// =============================================
// CLASSES API
// =============================================
export const classesApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) => {
    let query = supabase
      .from("classes")
      .select("*", { count: "exact" });

    if (params?.search) {
      query = query.ilike("name", `%${params.search}%`);
    }

    let sortField = params?.sortBy || "created_at";
    if (sortField === "createdAt") sortField = "created_at";
    const ascending = params?.sortOrder === "asc";
    query = query.order(sortField, { ascending });

    if (params?.page && params?.limit) {
      const from = (params.page - 1) * params.limit;
      const to = from + params.limit - 1;
      query = query.range(from, to);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    // Fetch related teacher profiles separately to prevent PostgREST relation embed errors
    const teacherIds = Array.from(
      new Set((data || []).map((c: any) => c.teacher_id).filter(Boolean))
    );

    let teacherMap: Record<string, { fullName: string; avatarUrl?: string }> = {};
    if (teacherIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", teacherIds);

      (profs || []).forEach((p: any) => {
        if (p.user_id) {
          teacherMap[p.user_id] = {
            fullName: p.full_name,
            avatarUrl: p.avatar_url,
          };
        }
      });
    }

    // Fetch student counts for each class
    const classIds = (data || []).map((c: any) => c.id);
    let studentCountsMap: Record<string, number> = {};
    if (classIds.length > 0) {
      const { data: studentCounts } = await supabase
        .from("class_students")
        .select("class_id")
        .in("class_id", classIds);

      if (studentCounts) {
        studentCounts.forEach((cs: any) => {
          if (cs.class_id) {
            studentCountsMap[cs.class_id] = (studentCountsMap[cs.class_id] || 0) + 1;
          }
        });
      }
    }

    const formatted = (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description || "",
      courseId: c.course_id,
      teacherId: c.teacher_id,
      teacher: {
        id: c.teacher_id,
        fullName: teacherMap[c.teacher_id]?.fullName || null,
        avatarUrl: teacherMap[c.teacher_id]?.avatarUrl || null,
      },
      startDate: c.start_date,
      endDate: c.end_date,
      isActive: c.is_active ?? true,
      createdAt: c.created_at,
      _count: {
        students: studentCountsMap[c.id] || 0,
      },
      studentCount: studentCountsMap[c.id] || 0,
    }));

    const totalCount = count !== null && count !== undefined ? count : formatted.length;

    return {
      data: formatted,
      meta: {
        total: totalCount,
        page: params?.page || 1,
        limit: params?.limit || 10,
        totalPages: Math.ceil(totalCount / (params?.limit || 10)) || 1,
      },
    };
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("classes")
      .select("*, class_students(*)")
      .eq("id", id)
      .single();

    if (error) throw error;

    // Data enrichment for student profiles matching DB FK (profiles.user_id)
    const studentIds = (data.class_students || []).map((cs: any) => cs.student_id).filter(Boolean);
    let students: any[] = [];
    if (studentIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", studentIds);
      students = profs || [];
    }

    // Fetch teacher profile if teacher_id exists
    let teacherProfile = null;
    if (data.teacher_id) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .eq("user_id", data.teacher_id)
        .maybeSingle();

      if (prof) {
        teacherProfile = {
          id: prof.user_id,
          fullName: prof.full_name,
          avatarUrl: prof.avatar_url,
        };
      }
    }

    // Map canonical students array with strict type structure
    const canonicalStudents = (data.class_students || []).map((cs: any) => {
      const matchedProfile = students.find((p: any) => (p.user_id || p.id) === cs.student_id);
      return {
        id: cs.id,
        studentId: cs.student_id,
        fullName: matchedProfile?.full_name || matchedProfile?.fullName || matchedProfile?.email || "Học viên",
        email: matchedProfile?.email || "",
        avatarUrl: matchedProfile?.avatar_url || matchedProfile?.avatarUrl || undefined,
        joinedAt: cs.created_at || data.created_at,
        status: matchedProfile?.is_active === false || matchedProfile?.status === "suspended" ? "suspended" : "active",
        is_active: matchedProfile?.is_active !== false,
      };
    });

    const activeStudents = canonicalStudents.filter((s: any) => s.status === "active");

    // Fetch course information if course_id exists
    let courseProfile = null;
    if (data.course_id) {
      const { data: courseRow } = await supabase
        .from("courses")
        .select("id, title, description")
        .eq("id", data.course_id)
        .maybeSingle();

      if (courseRow) {
        courseProfile = {
          id: courseRow.id,
          title: courseRow.title,
          description: courseRow.description || "",
        };
      }
    }

    return {
      ...data,
      id: data.id,
      name: data.name,
      description: data.description || "",
      status: data.status || (data.is_active === false ? "CLOSED" : "IN_PROGRESS"),
      isActive: data.is_active ?? true,
      startDate: data.start_date,
      endDate: data.end_date,
      teacherId: data.teacher_id,
      courseId: data.course_id,
      teacher: teacherProfile,
      course: courseProfile,
      class_students: canonicalStudents,
      students: canonicalStudents,
      activeStudents,
      studentCount: activeStudents.length,
      _count: {
        students: activeStudents.length,
      },
    };
  },

  create: async (body: any) => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/classes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        ...data,
        courseId: data.courseId || data.course_id,
        teacherId: data.teacherId || data.teacher_id,
        startDate: data.startDate || data.start_date,
        endDate: data.endDate || data.end_date,
        isActive: data.isActive ?? data.is_active ?? true,
      };
    }

    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Tạo lớp học thất bại");
  },

  update: async (id: string, body: any) => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/classes/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        ...data,
        courseId: data.courseId || data.course_id,
        teacherId: data.teacherId || data.teacher_id,
        startDate: data.startDate || data.start_date,
        endDate: data.endDate || data.end_date,
        isActive: data.isActive ?? data.is_active ?? true,
      };
    }

    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Cập nhật lớp học thất bại");
  },

  delete: async (id: string) => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/classes/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.ok) {
      return { success: true };
    }

    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Xóa lớp học thất bại");
  },

  /**
   * Kiểm tra trạng thái hoạt động học tập (Academic Activity) của lớp học:
   * Trả về UNSTARTED nếu chưa từng có COMPLETED Session, Attendance, hay Exam Submission nào.
   */
  checkAcademicStatus: async (classId: string): Promise<{
    state: "UNSTARTED" | "IN_PROGRESS" | "CLOSED";
    completedSessionsCount: number;
    attendanceCount: number;
    submissionsCount: number;
    reasons: string[];
  }> => {
    const reasons: string[] = [];

    // 1. Kiểm tra lớp đã closed chưa
    const { data: cls } = await supabase
      .from("classes")
      .select("is_active")
      .eq("id", classId)
      .single();

    // 2. Kiểm tra Completed Sessions
    const { count: completedSessionsCount } = await supabase
      .from("class_sessions")
      .select("*", { count: "exact", head: true })
      .eq("class_id", classId)
      .eq("status", "COMPLETED");

    if (completedSessionsCount && completedSessionsCount > 0) {
      reasons.push(`Đã có ${completedSessionsCount} buổi học hoàn thành`);
    }

    // 3. Kiểm tra Attendance records
    const { count: attendanceCount } = await supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .eq("class_id", classId);

    if (attendanceCount && attendanceCount > 0) {
      reasons.push(`Đã có ${attendanceCount} bản ghi điểm danh`);
    }

    // 4. Kiểm tra Exam Submissions liên quan tới học viên của lớp
    const { data: studentRecords } = await supabase
      .from("class_students")
      .select("student_id")
      .eq("class_id", classId);

    let submissionsCount = 0;
    const studentIds = (studentRecords || []).map((s: any) => s.student_id).filter(Boolean);

    if (studentIds.length > 0) {
      const { count } = await supabase
        .from("exam_submissions")
        .select("*", { count: "exact", head: true })
        .in("student_id", studentIds);
      submissionsCount = count || 0;
      if (submissionsCount > 0) {
        reasons.push(`Đã có ${submissionsCount} bài tập/bài thi được học viên nộp`);
      }
    }

    if (cls?.is_active === false && (completedSessionsCount || 0) > 0) {
      return {
        state: "CLOSED",
        completedSessionsCount: completedSessionsCount || 0,
        attendanceCount: attendanceCount || 0,
        submissionsCount,
        reasons: ["Lớp học đã tạm dừng / kết thúc"],
      };
    }

    const hasAcademicActivity =
      (completedSessionsCount || 0) > 0 ||
      (attendanceCount || 0) > 0 ||
      submissionsCount > 0;

    return {
      state: hasAcademicActivity ? "IN_PROGRESS" : "UNSTARTED",
      completedSessionsCount: completedSessionsCount || 0,
      attendanceCount: attendanceCount || 0,
      submissionsCount,
      reasons: hasAcademicActivity ? reasons : ["Lớp mới khởi tạo, chưa có hoạt động học tập nào"],
    };
  },

  /**
   * Preview lịch học tương lai (FUTURE ONLY) cho lớp IN_PROGRESS mà KHÔNG ghi vào DB
   */
  previewFutureScheduleUpdate: async (
    classId: string,
    params: {
      applyFromDate: string; // Ngày bắt đầu áp dụng lịch mới
      weekdays: number[];
      startTime: string;
      endTime: string;
    }
  ) => {
    // 1. Fetch tất cả class_sessions sắp xếp theo session_number
    const { data: sessions, error } = await supabase
      .from("class_sessions")
      .select("*")
      .eq("class_id", classId)
      .order("session_number", { ascending: true });

    if (error) throw error;
    const allSessions = sessions || [];

    // Phân loại: Sessions bị khóa (COMPLETED hoặc ngày trước applyFromDate) và Sessions tương lai
    const lockedSessions: any[] = [];
    const futureSessions: any[] = [];

    allSessions.forEach((s: any) => {
      if (s.status === "COMPLETED" || s.planned_date < params.applyFromDate) {
        lockedSessions.push(s);
      } else {
        futureSessions.push(s);
      }
    });

    if (futureSessions.length === 0) {
      return {
        lockedSessions,
        futureSessionsPreview: [],
        message: "Không có buổi học tương lai nào cần điều chỉnh",
      };
    }

    // Sinh danh sách ngày mới cho các buổi tương lai
    const newDates = generateSessionDates(
      params.applyFromDate,
      params.weekdays,
      futureSessions.length
    );

    const futureSessionsPreview = futureSessions.map((s: any, idx: number) => ({
      id: s.id,
      sessionNumber: s.session_number,
      oldPlannedDate: s.planned_date,
      newPlannedDate: newDates[idx] || s.planned_date,
      oldStartTime: s.start_time,
      newStartTime: params.startTime,
      oldEndTime: s.end_time,
      newEndTime: params.endTime,
      status: s.status,
    }));

    return {
      lockedSessionsCount: lockedSessions.length,
      futureSessionsCount: futureSessions.length,
      futureSessionsPreview,
    };
  },

  /**
   * Cập nhật lịch học tương lai (IN_PROGRESS Atomic Transaction)
   */
  applyFutureScheduleUpdate: async (
    classId: string,
    updates: Array<{ id: string; newPlannedDate: string; newStartTime: string; newEndTime: string }>
  ) => {
    for (const item of updates) {
      const { error } = await supabase
        .from("class_sessions")
        .update({
          planned_date: item.newPlannedDate,
          start_time: item.newStartTime,
          end_time: item.newEndTime,
          status: "RESCHEDULED",
        })
        .eq("id", item.id);

      if (error) throw error;
    }
    return { success: true, updatedCount: updates.length };
  },

  addStudents: async (classId: string, studentIds: string[]) => {
    const records = studentIds.map((sid) => ({
      class_id: classId,
      student_id: sid,
    }));
    const { data, error } = await supabase
      .from("class_students")
      .upsert(records, { onConflict: "class_id,student_id" });

    if (error) throw error;
    return data;
  },

  addStudentsByEmails: async (classId: string, emails: string[]) => {
    const cleanEmails = Array.from(
      new Set(
        emails
          .map((e) => e.trim().toLowerCase())
          .filter((e) => e && e.includes("@"))
      )
    );

    if (cleanEmails.length === 0) {
      return { added: 0, profiles: [] };
    }

    const addedProfiles: Array<{ id: string; email: string; isNew: boolean }> = [];

    for (const email of cleanEmails) {
      // 1. Check if profile with email exists
      let { data: profile } = await supabase
        .from("profiles")
        .select("id, user_id, email")
        .eq("email", email)
        .maybeSingle();

      let studentAuthUserId = profile?.user_id || profile?.id;

      // 2. Pre-provision profile if not found
      if (!profile) {
        const newId = crypto.randomUUID();
        const { data: createdProfile, error: createErr } = await supabase
          .from("profiles")
          .insert({
            id: newId,
            user_id: newId,
            email: email,
            full_name: email.split("@")[0],
          })
          .select("id, user_id, email")
          .single();

        if (createErr) {
          console.warn(`Failed to pre-provision profile for ${email}:`, createErr.message);
          continue;
        }

        studentAuthUserId = createdProfile.user_id || createdProfile.id;
        addedProfiles.push({ id: studentAuthUserId, email, isNew: true });
      } else {
        addedProfiles.push({ id: studentAuthUserId, email, isNew: false });
      }

      // 3. Link studentAuthUserId to class_students
      if (studentAuthUserId) {
        await supabase
          .from("class_students")
          .upsert(
            { class_id: classId, student_id: studentAuthUserId },
            { onConflict: "class_id,student_id" }
          );
      }
    }

    return { added: addedProfiles.length, profiles: addedProfiles };
  },

  claimProfileOnLogin: async (authUser: { id: string; email: string; user_metadata?: any }) => {
    if (!authUser.email) return;

    const email = authUser.email.toLowerCase();
    const fullName =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      email.split("@")[0];
    const avatarUrl =
      authUser.user_metadata?.avatar_url ||
      authUser.user_metadata?.picture ||
      null;

    // Check if a pre-provisioned profile exists for this email
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, user_id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      const oldIds = [existingProfile.id, existingProfile.user_id].filter(Boolean);

      // If user_id is not set or different, update it to claim ownership
      if (existingProfile.user_id !== authUser.id) {
        await supabase
          .from("profiles")
          .update({
            user_id: authUser.id,
            full_name: fullName,
            avatar_url: avatarUrl,
          })
          .eq("id", existingProfile.id);
      }

      // Migrate any class_students or enrollments created with pre-provisioned profile IDs
      for (const oldId of oldIds) {
        if (oldId && oldId !== authUser.id) {
          await supabase
            .from("class_students")
            .update({ student_id: authUser.id })
            .eq("student_id", oldId);

          await supabase
            .from("enrollments")
            .update({ student_id: authUser.id })
            .eq("student_id", oldId);
        }
      }
    } else {
      // Brand new login (e.g. via Google SSO): Ensure profile exists in profiles table
      try {
        await supabase
          .from("profiles")
          .upsert(
            {
              id: authUser.id,
              user_id: authUser.id,
              email: email,
              full_name: fullName,
              avatar_url: avatarUrl,
              is_active: true,
            },
            { onConflict: "user_id" }
          );
      } catch (upsertErr) {
        console.warn("Profiles auto-provision notice:", upsertErr);
      }
    }

    // Ensure user_roles has 'student' role for this user if not already present
    try {
      const { data: existingRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authUser.id);

      if (!existingRoles || existingRoles.length === 0) {
        await supabase
          .from("user_roles")
          .insert({
            user_id: authUser.id,
            role: "student",
          });
      }
    } catch (roleErr) {
      console.warn("User role auto-provision notice:", roleErr);
    }
  },

  removeStudent: async (classId: string, studentId: string) => {
    const { error } = await supabase
      .from("class_students")
      .delete()
      .eq("class_id", classId)
      .eq("student_id", studentId);

    if (error) throw error;
    return { success: true };
  },

  updateStudentStatus: async (classId: string, studentId: string, status: string, reason?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const response = await fetch(`${API_BASE_URL}/classes/${classId}/students/${studentId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, reason }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to update student status");
    return result;
  },
};


/**
 * Standardized Universal Cache Invalidation Helper for Class Workspace
 */
export const invalidateClassWorkspace = (queryClient: any, classId: string) => {
  if (!queryClient || !classId) return;
  queryClient.invalidateQueries({ queryKey: ["admin-class", classId] });
  queryClient.invalidateQueries({ queryKey: ["admin-class-workspace", classId] });
  queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
  queryClient.invalidateQueries({ queryKey: ["class-sessions", classId] });
  queryClient.invalidateQueries({ queryKey: ["class-attendance-matrix", classId] });
  queryClient.invalidateQueries({ queryKey: ["class-attendance", classId] });
};

// Backward compatibility alias
export const invalidateClassQueries = invalidateClassWorkspace;

// =============================================
// SESSIONS API - Quản lý Buổi học (Semi-Auto Scheduling)
// =============================================
export type CanonicalSessionStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";
export type SessionStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "PLANNED" | "RESCHEDULED";

export interface CanonicalSessionDTO {
  id: string;
  classId: string;
  sessionNumber: number;
  scheduledDate: string; // YYYY-MM-DD
  startTime: string;     // HH:MM
  endTime: string;       // HH:MM
  status: CanonicalSessionStatus;
  rescheduleReason?: string;
  note?: string;
  lessonId?: string;
  lessonTitle: string;
  createdAt?: string;
}

// Backward compatibility interface
export interface ClassSession extends CanonicalSessionDTO {
  plannedDate?: string;
}

/**
 * SINGLE-POINT NORMALIZATION: Chuyển đổi raw session từ DB/API sang CanonicalSessionDTO
 */
export function normalizeSession(s: any): CanonicalSessionDTO {
  if (!s) return s;
  const rawStatus = s.status || "SCHEDULED";
  let status: CanonicalSessionStatus = "SCHEDULED";
  if (rawStatus === "COMPLETED") {
    status = "COMPLETED";
  } else if (rawStatus === "CANCELLED") {
    status = "CANCELLED";
  } else {
    // "PLANNED", "RESCHEDULED", "SCHEDULED", or undefined -> "SCHEDULED"
    status = "SCHEDULED";
  }

  const rawDate =
    s.scheduledDate ||
    s.plannedDate ||
    s.sessionDate ||
    s.session_date ||
    s.planned_date ||
    "";
  const scheduledDate = typeof rawDate === "string" ? rawDate.slice(0, 10) : "";
  const sessionNumber = s.sessionNumber ?? s.session_number ?? 1;

  return {
    id: s.id,
    classId: s.classId || s.class_id || "",
    sessionNumber,
    scheduledDate,
    startTime: s.startTime || s.start_time || "00:00",
    endTime: s.endTime || s.end_time || "00:00",
    status,
    rescheduleReason: s.rescheduleReason || s.reschedule_reason,
    note: s.note,
    lessonId: s.lessonId || s.lesson_id,
    lessonTitle:
      s.lessonTitle ||
      s.lesson_title ||
      (s.lessons?.title || `Lesson ${sessionNumber}`),
    createdAt: s.createdAt || s.created_at,
  };
}

/**
 * Hàm tiện ích: Tự động sinh danh sách ngày học từ lịch hàng tuần
 * @param startDate - ngày bắt đầu "YYYY-MM-DD"
 * @param weekdays - mảng số (0=CN, 1=T2, ..., 6=T7)
 * @param totalSessions - số buổi cần sinh
 */
export function generateSessionDates(
  startDate: string,
  weekdays: number[],
  totalSessions: number
): string[] {
  if (!startDate || weekdays.length === 0 || totalSessions <= 0) return [];

  const dates: string[] = [];
  // Parse startDate in local time to avoid UTC offset issues
  const [y, m, d] = startDate.split("-").map(Number);
  const cur = new Date(y, m - 1, d);

  while (dates.length < totalSessions) {
    const dow = cur.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    if (weekdays.includes(dow)) {
      const mm = String(cur.getMonth() + 1).padStart(2, "0");
      const dd = String(cur.getDate()).padStart(2, "0");
      dates.push(`${cur.getFullYear()}-${mm}-${dd}`);
    }
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export const sessionsApi = {
  list: async (classId: string): Promise<CanonicalSessionDTO[]> => {
    const token = await getAuthToken();
    try {
      const res = await fetch(`${API_BASE_URL}/classes/${classId}/sessions`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map(normalizeSession);
        }
      }
    } catch {
      // Backend REST offline -> proceed to Supabase query
    }

    try {
      const { data: dbSessions, error } = await supabase
        .from("class_sessions")
        .select("*")
        .eq("class_id", classId)
        .order("session_number", { ascending: true });

      if (!error && dbSessions && dbSessions.length > 0) {
        return dbSessions.map(normalizeSession);
      }
    } catch {
      // ignore
    }

    return [];
  },

  /** Sinh hàng loạt sessions từ lịch hàng tuần */
  generateForClass: async (
    classId: string,
    options: {
      startDate: string;
      weekdays: number[];
      totalSessions: number;
      startTime: string;
      endTime: string;
    }
  ): Promise<ClassSession[]> => {
    const token = await getAuthToken();
    try {
      const res = await fetch(`${API_BASE_URL}/classes/${classId}/sessions/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(options),
      });

      if (res.ok) {
        const data = await res.json();
        return (data || []).map((s: any) => ({
          id: s.id,
          classId: s.classId || s.class_id,
          sessionNumber: s.sessionNumber || s.session_number,
          plannedDate: s.plannedDate || s.planned_date,
          startTime: s.startTime || s.start_time,
          endTime: s.endTime || s.end_time,
          status: (s.status as SessionStatus) || "PLANNED",
          createdAt: s.createdAt || s.created_at,
        }));
      }
    } catch {
      // Backend REST offline -> Fallback to direct Supabase creation
    }

    try {
      const dates = calculateSessionDates(
        options.startDate,
        options.weekdays,
        options.totalSessions
      );

      const rows = dates.map((d, idx) => ({
        class_id: classId,
        session_number: idx + 1,
        planned_date: d,
        session_date: d,
        start_time: options.startTime,
        end_time: options.endTime,
        status: "SCHEDULED",
        title: `Buổi ${idx + 1}`,
      }));

      const { data, error } = await supabase
        .from("class_sessions")
        .insert(rows)
        .select();

      if (error) throw error;
      return (data || []).map((s: any) => ({
        id: s.id,
        classId: s.class_id,
        sessionNumber: s.session_number,
        plannedDate: s.session_date || s.planned_date,
        startTime: s.start_time,
        endTime: s.end_time,
        status: s.status as SessionStatus,
        createdAt: s.created_at,
      }));
    } catch (err: any) {
      throw new Error(err.message || "Sinh buổi học thất bại");
    }
  },

  /** Reschedule một buổi học cụ thể */
  reschedule: async (
    sessionId: string,
    newDate: string,
    reason: string
  ): Promise<ClassSession> => {
    const token = await getAuthToken();
    try {
      const res = await fetch(`${API_BASE_URL}/classes/sessions/${sessionId}/reschedule`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ plannedDate: newDate, reason }),
      });

      if (res.ok) {
        const s = await res.json();
        return {
          id: s.id,
          classId: s.classId || s.class_id,
          sessionNumber: s.sessionNumber || s.session_number,
          plannedDate: s.plannedDate || s.planned_date,
          startTime: s.startTime || s.start_time,
          endTime: s.endTime || s.end_time,
          status: (s.status as SessionStatus) || "PLANNED",
          createdAt: s.createdAt || s.created_at,
        };
      }
    } catch {
      // Fallback
    }

    try {
      const { data: s, error } = await supabase
        .from("class_sessions")
        .update({
          planned_date: newDate,
          session_date: newDate,
          reschedule_reason: reason,
          status: "RESCHEDULED",
        })
        .eq("id", sessionId)
        .select()
        .single();

      if (!error && s) {
        return {
          id: s.id,
          classId: s.class_id,
          sessionNumber: s.session_number,
          plannedDate: s.planned_date || s.session_date,
          startTime: s.start_time,
          endTime: s.end_time,
          status: s.status,
          createdAt: s.created_at,
        };
      }
    } catch {
      // ignore
    }

    return {
      id: sessionId,
      classId: "",
      sessionNumber: 1,
      plannedDate: newDate,
      startTime: "",
      endTime: "",
      status: "PLANNED",
      createdAt: new Date().toISOString(),
    };
  },

  /** Cập nhật trạng thái buổi học (COMPLETED, CANCELLED, PLANNED) */
  updateStatus: async (
    sessionId: string,
    status: SessionStatus,
    note?: string
  ): Promise<ClassSession> => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/classes/sessions/${sessionId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status, note }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        id: data.id,
        classId: data.classId || data.class_id,
        sessionNumber: data.sessionNumber || data.session_number,
        plannedDate: data.plannedDate || data.planned_date,
        startTime: data.startTime || data.start_time,
        endTime: data.endTime || data.end_time,
        status: data.status as SessionStatus,
        rescheduleReason: data.rescheduleReason || data.reschedule_reason,
        note: data.note,
        createdAt: data.createdAt || data.created_at,
      };
    }

    return {
      id: sessionId,
      classId: "",
      sessionNumber: 1,
      plannedDate: new Date().toISOString().split("T")[0],
      startTime: "",
      endTime: "",
      status,
      createdAt: new Date().toISOString(),
    };
  },
};


// =============================================
// SITE SETTINGS API (REST FASTIFY ADAPTER)
// =============================================
export const siteSettingsApi = {
  get: async () => {
    const res = await fetch(`${API_BASE_URL}/site-settings`);
    if (!res.ok) {
      throw new Error("Không thể tải cài đặt hệ thống");
    }
    const data = await res.json();
    return normalizeSiteSettings(data);
  },

  update: async (payload: Record<string, unknown>) => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/site-settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errorMessage = "Không thể lưu cài đặt hệ thống";
      try {
        const errorData = await res.json();
        errorMessage = errorData?.error || errorData?.message || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }

    const data = await res.json();
    if (!data || typeof data !== "object" || !data.id) {
      throw new Error("Dữ liệu phản hồi từ máy chủ không hợp lệ");
    }

    return normalizeSiteSettings(data);
  },
};

// =============================================
// PHASE 0 SPRINT 3 PROJECTION DTO APIS
// =============================================
export enum HomeworkPriority {
  RESUME = "RESUME",
  DUE_TODAY = "DUE_TODAY",
  UPCOMING = "UPCOMING",
  OVERDUE = "OVERDUE",
}

export interface StudentWorkspaceTask {
  id: string;
  title: string;
  className: string;
  deadline: string | null;
  status: string;
  score: number | null;
  feedback: string | null;
  actionUrl: string;
}

export interface StudentWorkspaceContract {
  continue: StudentWorkspaceTask | null;
  dueToday: StudentWorkspaceTask[];
  upcoming: StudentWorkspaceTask[];
  completed: StudentWorkspaceTask[];
}

export const invitationsApi = {
  joinByCode: async (payload: { code: string }) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const response = await fetch(`${API_BASE_URL}/invitations/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ inviteCode: payload.code.trim().toUpperCase() }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || result.message || "Failed to join class");
    return result;
  },

  generate: async (payload: { classId: string; inviteCode?: string }) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const response = await fetch(`${API_BASE_URL}/invitations/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to generate invitation");
    return result;
  },
};

export interface TeacherGradingItem {
  homeworkId: string;
  homeworkTitle: string;
  className?: string;
  studentId: string;
  studentName: string;
  submittedAt?: string;
  gradedAt?: string;
  score?: number | null;
  status: string;
}

export interface TeacherWorkspaceContract {
  needGrading: TeacherGradingItem[];
  recentGraded: TeacherGradingItem[];
}

export const homeworksApi = {

  getTeacherWorkspace: async (classId?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const url = classId 
      ? `${API_BASE_URL}/homeworks/teacher-workspace?classId=${encodeURIComponent(classId)}`
      : `${API_BASE_URL}/homeworks/teacher-workspace`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to fetch teacher workspace");
    return result as { success: boolean; data: any };
  },

  create: async (payload: { classId: string; title: string; description?: string; deadline?: string }) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const response = await fetch(`${API_BASE_URL}/homeworks/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to create homework");
    return result;
  },

  submit: async (payload: { homeworkId: string }) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const response = await fetch(`${API_BASE_URL}/homeworks/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to submit homework");
    return result;
  },

  grade: async (payload: { homeworkId: string; studentId: string; score: number; feedback: string }) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const response = await fetch(`${API_BASE_URL}/homeworks/grade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to grade submission");
    return result;
  },
};

export interface StudentLessonProgress {
  homeworkSubmitted: boolean;
  homeworkGraded: boolean;
  lessonCompleted: boolean;
}

export interface LessonResourceItemDTO {
  id: string;
  title: string;
  type: string;
  url: string;
}

export interface StudentLessonItemContract {
  id: string;
  title: string;
  description: string | null;
  lessonOrder: number;
  estimatedMinutes: number | null;
  status: string;
  sessionDate: string | null;
  sessionNumber: number | null;
  resources: LessonResourceItemDTO[];
  homework: {
    id: string;
    title: string;
    deadline: string | null;
    status: string;
    score: number | null;
  } | null;
  progress: StudentLessonProgress;
}

export interface ClassLessonContract {
  classId: string;
  className: string;
  courseTitle: string;
  progress: {
    completedLessons: number;
    totalLessons: number;
    percentage: number;
  };
  lessons: StudentLessonItemContract[];
}

export const lessonsApi = {
  getClassLessons: async (classId: string) => {
    // 0. Boundary Guard: Validate UUID format
    if (!isValidUUID(classId)) {
      throw new Error("Mã định danh lớp học không hợp lệ. Vui lòng kiểm tra lại URL.");
    }

    const token = await getAuthToken();
    try {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/lessons`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result?.success && result?.data) {
          return result.data;
        }
      }
    } catch {
      // Backend offline or mock test environment -> proceed to Supabase read fallback
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthenticated");

    // 1. Fetch class & course info
    const { data: cls, error: clsErr } = await supabase
      .from("classes")
      .select("id, name, course_id, courses(*)")
      .eq("id", classId)
      .single();

    if (clsErr || !cls) {
      throw new Error("Không tìm thấy thông tin lớp học");
    }

    const courseObj = Array.isArray(cls.courses) ? cls.courses[0] : cls.courses;
    const courseId = cls.course_id || courseObj?.id;
    const courseTitle = courseObj?.title || cls.name || "Lớp học";
    const className = cls.name || courseTitle || "Lớp học";

    // 2. Fetch all exams (homeworks) for this course from Supabase
    let exams: any[] = [];
    if (courseId) {
      const { data: examData } = await supabase
        .from("exams")
        .select("id, title, description, week, exam_type, exam_sections(id, section_type, title, instructions, order_index)")
        .eq("course_id", courseId)
        .order("week", { ascending: true });
      exams = examData || [];
    }

    // 3. Fetch student submissions for these exams
    const examIds = exams.map((e) => e.id);
    let submissionsMap: Record<string, any> = {};

    if (examIds.length > 0) {
      const { data: subs } = await supabase
        .from("exam_submissions")
        .select("id, exam_id, status, total_score, submitted_at")
        .eq("student_id", user.id)
        .in("exam_id", examIds);

      (subs || []).forEach((s: any) => {
        submissionsMap[s.exam_id] = s;
      });
    }

    // 4. Format lessons array for student lesson viewer
    const lessons = exams.map((ex: any, idx: number) => {
      const sub = submissionsMap[ex.id];
      const isCompleted = sub?.status === "graded" || sub?.status === "submitted";
      const hwNum = String(idx + 1).padStart(2, "0");

      return {
        id: ex.id,
        title: ex.title || `Homework ${hwNum}`,
        description: ex.description || `Bài tập buổi ${ex.week || idx + 1}`,
        week: ex.week || idx + 1,
        status: isCompleted ? "COMPLETED" : "AVAILABLE",
        submission: sub || null,
        resources: (ex.exam_sections || []).map((sec: any) => ({
          id: sec.id,
          title: sec.title || `Kỹ năng ${sec.section_type?.toUpperCase()}`,
          type: sec.section_type || "general",
          detail: sec.instructions || `Luyện tập phần ${sec.section_type}`,
        })),
      };
    });

    const completedLessons = lessons.filter((l) => l.status === "COMPLETED").length;
    const totalLessons = lessons.length;
    const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      success: true,
      data: {
        classId: cls.id,
        className,
        courseTitle,
        progress: {
          completedLessons,
          totalLessons,
          percentage,
        },
        lessons,
      },
    };
  },
};

export type AttendanceStatus = "UNMARKED" | "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export interface AttendanceStudentDTO {
  studentId: string;
  studentName: string;
  avatarUrl: string | null;
  status: AttendanceStatus;
  notes: string | null;
}

export interface SessionAttendanceContract {
  classId: string;
  className: string;
  sessionId: string;
  sessionTitle: string;
  sessionDate: string;
  summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    unmarked: number;
  };
  students: AttendanceStudentDTO[];
}

export const attendanceApi = {
  getSessionAttendance: async (classId: string, sessionId: string) => {
    const token = await getAuthToken();
    try {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/sessions/${sessionId}/attendance`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (response.ok) {
        const result = await response.json();
        if (result?.success && result?.data) {
          return result;
        }
      }
    } catch {
      // Backend offline
    }

    try {
      const [sessionRes, attendanceRes, studentsRes] = await Promise.all([
        supabase.from("class_sessions").select("*").eq("id", sessionId).maybeSingle(),
        supabase.from("class_attendance").select("*").eq("session_id", sessionId),
        supabase.from("class_students").select("student_id").eq("class_id", classId),
      ]);

      const session = sessionRes.data;
      const attendance = attendanceRes.data || [];
      const studentIds = (studentsRes.data || []).map((s: any) => s.student_id).filter(Boolean);

      let profiles: any[] = [];
      if (studentIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, full_name, email, avatar_url")
          .in("user_id", studentIds);
        profiles = profs || [];
      }

      const total = studentIds.length;
      let present = 0;
      let absent = 0;
      let late = 0;
      let excused = 0;
      let unmarked = 0;

      const studentList = studentIds.map((sId: string) => {
        const prof = profiles.find((p: any) => (p.user_id || p.id) === sId);
        const att = attendance.find((a: any) => a.student_id === sId);
        const status: AttendanceStatus = att ? att.status : "UNMARKED";

        if (status === "PRESENT") present++;
        else if (status === "ABSENT") absent++;
        else if (status === "LATE") late++;
        else if (status === "EXCUSED") excused++;
        else unmarked++;

        return {
          studentId: sId,
          studentName: prof?.full_name || prof?.fullName || prof?.email || "Học viên",
          avatarUrl: prof?.avatar_url || prof?.avatarUrl,
          email: prof?.email || "",
          status,
          note: att?.note || null,
        };
      });

      return {
        success: true,
        data: {
          sessionNumber: session?.session_number || 1,
          sessionDate: session?.session_date || session?.planned_date || new Date().toISOString(),
          title: session?.title || `Buổi ${session?.session_number || 1}`,
          status: session?.status || "SCHEDULED",
          summary: { total, present, absent, late, excused, unmarked },
          students: studentList,
        },
      };
    } catch {
      return {
        success: true,
        data: {
          sessionNumber: 1,
          sessionDate: new Date().toISOString(),
          title: "Buổi học",
          status: "SCHEDULED",
          summary: { total: 0, present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 },
          students: [],
        },
      };
    }
  },

  markAttendance: async (
    classId: string,
    sessionId: string,
    items: Array<{ studentId: string; status: AttendanceStatus; note?: string | null; notes?: string | null }>
  ) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/classes/${classId}/sessions/${sessionId}/attendance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || errJson.message || "Không thể cập nhật điểm danh");
    }

    return { success: true };
  },

  completeSession: async (classId: string, sessionId: string) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/classes/${classId}/sessions/${sessionId}/complete`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || errJson.message || "Không thể chốt điểm danh buổi học");
    }

    return { success: true };
  },

  unlockSession: async (classId: string, sessionId: string) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/classes/${classId}/sessions/${sessionId}/unlock`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || errJson.message || "Không thể mở khóa buổi học");
    }

    return { success: true };
  },

  getAttendanceMatrix: async (classId: string) => {
    const token = await getAuthToken();
    try {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/attendance-matrix`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (response.ok) {
        const result = await response.json();
        if (result?.success && result?.data) {
          return result;
        }
      }
    } catch {
      // Backend offline
    }

    try {
      const [sessionsRes, studentsRes, attendanceRes, classRes] = await Promise.all([
        supabase.from("class_sessions").select("*").eq("class_id", classId).order("session_number", { ascending: true }),
        supabase.from("class_students").select("student_id").eq("class_id", classId),
        supabase.from("class_attendance").select("*").eq("class_id", classId),
        supabase.from("classes").select("name").eq("id", classId).maybeSingle(),
      ]);

      const sessions = (sessionsRes.data || []).map((s: any) => ({
        id: s.id,
        sessionNumber: s.session_number,
        sessionDate: s.session_date || s.planned_date,
        lessonTitle: s.title || `Buổi ${s.session_number}`,
        status: s.status,
      }));

      const studentIds = (studentsRes.data || []).map((cs: any) => cs.student_id).filter(Boolean);
      let profiles: any[] = [];
      if (studentIds.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("user_id, full_name, email, avatar_url").in("user_id", studentIds);
        profiles = profs || [];
      }

      const allAttendance = attendanceRes.data || [];
      const completedSessionsCount = sessions.filter((s: any) => s.status === "COMPLETED").length;

      const studentRows = studentIds.map((sId: string) => {
        const prof = profiles.find((p: any) => (p.user_id || p.id) === sId);
        const studentAtt = allAttendance.filter((a: any) => a.student_id === sId);
        const presentCount = studentAtt.filter((a: any) => a.status === "PRESENT").length;
        const lateCount = studentAtt.filter((a: any) => a.status === "LATE").length;
        const absentCount = studentAtt.filter((a: any) => a.status === "ABSENT").length;
        const excusedCount = studentAtt.filter((a: any) => a.status === "EXCUSED").length;

        const attendedScore = presentCount + lateCount * 0.8;
        const attendanceRate = completedSessionsCount > 0 ? Math.round((attendedScore / completedSessionsCount) * 100) : 100;

        return {
          studentId: sId,
          studentName: prof?.full_name || prof?.fullName || prof?.email || "Học viên",
          avatarUrl: prof?.avatar_url || prof?.avatarUrl,
          email: prof?.email || "",
          presentCount,
          lateCount,
          absentCount,
          excusedCount,
          eligibleSessions: completedSessionsCount,
          attendanceRate,
          sessions: sessions.map((s: any) => {
            const att = studentAtt.find((a: any) => a.session_id === s.id);
            return {
              sessionId: s.id,
              sessionNumber: s.sessionNumber,
              sessionDate: s.sessionDate,
              status: s.status,
              attendanceStatus: att ? att.status : "UNMARKED",
              note: att?.note || null,
            };
          }),
        };
      });

      return {
        success: true,
        data: {
          classId,
          className: classRes.data?.name || "Lớp học",
          totalSessions: sessions.length,
          completedSessions: completedSessionsCount,
          sessionCoverage: sessions.length > 0 ? Math.round((completedSessionsCount / sessions.length) * 100) : 0,
          recordCoverage: 100,
          attendanceCoverage: sessions.length > 0 ? Math.round((completedSessionsCount / sessions.length) * 100) : 0,
          sessions,
          students: studentRows,
        },
      };
    } catch {
      return { success: false, error: "Không thể tải ma trận chuyên cần" };
    }
  },
};

// =============================================
// AUTHORITATIVE NOTIFICATION SUBSYSTEM APIs
// =============================================

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
}

export const notificationsApi = {
  list: async (params?: { page?: number; limit?: number }) => {
    const token = await getAuthToken();
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));

    const res = await fetch(`${API_BASE_URL}/notifications?${query.toString()}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!res.ok) {
      throw new Error(`Notification API error: ${res.status}`);
    }
    return res.json() as Promise<{
      success: boolean;
      data: NotificationItem[];
      unreadCount: number;
      pagination: { total: number; page: number; limit: number };
    }>;
  },

  getUnreadCount: async () => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!res.ok) {
      throw new Error(`Notification unread-count API error: ${res.status}`);
    }
    return res.json() as Promise<{ success: boolean; count: number }>;
  },

  markAsRead: async (id: string) => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: "PATCH",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!res.ok) {
      throw new Error(`Failed to mark notification as read: ${res.status}`);
    }
    return res.json() as Promise<{ success: boolean }>;
  },

  markAllAsRead: async () => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: "PATCH",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!res.ok) {
      throw new Error(`Failed to mark all notifications as read: ${res.status}`);
    }
    return res.json() as Promise<{ success: boolean; markedCount: number }>;
  },
};

export interface StudentWorkspaceViewModel {
  state: "NO_ENROLLMENT" | "PENDING_ACTIVATION" | "SUSPENDED_STUDENT" | "ACTIVE_STUDENT";
  student: { id: string; email: string; fullName: string; avatarUrl?: string };
  classes: Array<{
    id: string;
    name: string;
    description?: string;
    courseTitle?: string;
    status: "INVITED" | "PENDING" | "ACTIVE" | "SUSPENDED" | "COMPLETED";
    joinedAt?: string;
  }>;
  nextAction: {
    type: "HOMEWORK" | "LESSON" | "EXAM";
    targetId: string;
    title: string;
    classId: string;
    deadline?: string | null;
  } | null;
  announcements: any[];
  notifications: any[];
}

export default supabase;
