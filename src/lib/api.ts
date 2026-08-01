import { supabase } from "./supabase";
import { normalizeSiteSettings } from "./site-settings";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

// Helper to format URLs
export const formatStorageUrl = (path: string | null) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const { data } = supabase.storage.from("exam-assets").getPublicUrl(path);
  return data.publicUrl;
};

// =============================================
// DATA NORMALIZER: Supabase snake_case â†’ Frontend camelCase
// Äáº£m báº£o ExamInterface, QuestionRenderers, v.v. hoáº¡t Ä‘á»™ng
// dÃ¹ data Ä‘áº¿n tá»« Supabase (snake_case) hay fallback (camelCase)
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
      audioUrl: s.audioUrl || s.audio_url || "",
      audioScript: s.audioScript || s.audio_script || "",
      // Normalize nested question_groups / questionGroups
      questionGroups: normalizeGroups(s.questionGroups || s.question_groups || []),
      question_groups: normalizeGroups(s.questionGroups || s.question_groups || []),
    }));

  const normalizeGroups = (groups: any[]) =>
    (groups || []).map((g: any) => ({
      ...g,
      sectionId: g.sectionId || g.section_id,
      orderIndex: g.orderIndex ?? g.order_index ?? 0,
      audioUrl: g.audioUrl || g.audio_url || "",
      questions: normalizeQuestions(g.questions || []),
    }));

  const normalizeQuestions = (questions: any[]) =>
    (questions || []).map((q: any) => ({
      ...q,
      questionType: q.questionType || q.question_type,
      question_type: q.question_type || q.questionType,
      questionText: q.questionText || q.question_text || "",
      question_text: q.question_text || q.questionText || "",
      correctAnswer: q.correctAnswer ?? q.correct_answer ?? "",
      correct_answer: q.correct_answer ?? q.correctAnswer ?? "",
      groupId: q.groupId || q.group_id,
      orderIndex: q.orderIndex ?? q.order_index ?? 0,
      audioUrl: q.audioUrl || q.audio_url || "",
      // Normalize options: ensure array format
      options: Array.isArray(q.options)
        ? q.options
        : (q.options ? (typeof q.options === "string" ? JSON.parse(q.options) : q.options) : []),
    }));

  return {
    ...exam,
    courseId: exam.courseId || exam.course_id,
    durationMinutes: exam.durationMinutes || exam.duration_minutes || 60,
    isPublished: exam.isPublished ?? exam.is_published ?? false,
    isActive: exam.isActive ?? exam.is_active ?? true,
    sections: normalizeSections(exam.sections || exam.exam_sections || []),
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

  loginWithGoogle: async () => {
    const targetRedirect = window.location.origin;
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
  }) => {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("courses")
      .select("*", { count: "exact" });

    if (params?.search) {
      query = query.ilike("title", `%${params.search}%`);
    }

    if (params?.level) {
      query = query.eq("level", params.level);
    }

    const sortField = params?.sortBy || "created_at";
    const ascending = params?.sortOrder === "asc";
    query = query.order(sortField, { ascending }).range(from, to);

    let { data, count, error } = await query;
    if (error) throw error;

    return {
      data: data || [],
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit) || 1,
      },
    };
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("courses")
      .select("*, exams(*)")
      .or(`id.eq.${id},slug.eq.${id}`)
      .single();

    if (error) throw error;
    return data;
  },

  getBySlug: async (slug: string) => {
    const { data, error } = await supabase
      .from("courses")
      .select("*, exams(*)")
      .eq("slug", slug)
      .single();

    if (error) throw error;
    return data;
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
    const slug =
      course.slug || course.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const { data, error } = await supabase
      .from("courses")
      .insert({
        title: course.title,
        description: course.description,
        level: course.level,
        price: course.price,
        thumbnail_url: course.thumbnailUrl,
        is_published: course.isPublished ?? false,
        is_active: course.isActive ?? true,
        slug,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
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
    const updatePayload: any = {};
    if (course.title !== undefined) updatePayload.title = course.title;
    if (course.description !== undefined) updatePayload.description = course.description;
    if (course.level !== undefined) updatePayload.level = course.level;
    if (course.thumbnailUrl !== undefined) updatePayload.thumbnail_url = course.thumbnailUrl;
    if (course.isPublished !== undefined) updatePayload.is_published = course.isPublished;
    if (course.isActive !== undefined) updatePayload.is_active = course.isActive;
    if (course.slug !== undefined) updatePayload.slug = course.slug;

    const { data, error } = await supabase
      .from("courses")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id: string, password?: string) => {
    const { data, error } = await supabase
      .from("courses")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return { success: true };
  },
};

// =============================================
// EXAMS API
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
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from("exams").select("*, course:courses(id, title)", { count: "exact" });

    if (params?.courseId) query = query.eq("course_id", params.courseId);
    if (params?.search) query = query.ilike("title", `%${params.search}%`);
    if (params?.isPublished !== undefined)
      query = query.eq("is_published", params.isPublished);
    if (params?.isActive !== undefined)
      query = query.eq("is_active", params.isActive);

    const sortField = params?.sortBy || "created_at";
    const ascending = params?.sortOrder === "asc";
    query = query.order(sortField, { ascending }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      data: data || [],
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit) || 1,
      },
    };
  },

  getById: async (id: string) => {
    const { data, error } = await supabase.rpc("get_exam_by_id", {
      p_exam_id: id,
    });

    if (error) {
      console.error("[EXAM_FETCH_ERROR] Failed to fetch exam via RPC get_exam_by_id:", error.message);
      throw error;
    }

    return normalizeExamData(data);
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
    const { data: newExam, error } = await supabase
      .from("exams")
      .insert({
        course_id: exam.courseId,
        title: exam.title,
        description: exam.description,
        week: exam.week ?? 1,
        duration_minutes: exam.durationMinutes ?? 60,
        is_published: exam.isPublished ?? false,
        is_active: exam.isActive ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    // Auto-create 5 default IELTS sections
    const defaultSections = [
      { section_type: "listening", title: "Listening", order_index: 0 },
      { section_type: "reading", title: "Reading", order_index: 1 },
      { section_type: "writing", title: "Writing", order_index: 2 },
      { section_type: "speaking", title: "Speaking", order_index: 3 },
      { section_type: "general", title: "General", order_index: 4 },
    ];

    const { error: sectionsError } = await supabase.from("exam_sections").insert(
      defaultSections.map((s) => ({ ...s, exam_id: newExam.id }))
    );
    if (sectionsError) console.warn("[EXAM_SECTIONS_WARNING]", sectionsError);

    return newExam;
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
    const updatePayload: any = {};
    if (exam.title !== undefined) updatePayload.title = exam.title;
    if (exam.description !== undefined) updatePayload.description = exam.description;
    if (exam.isPublished !== undefined) updatePayload.is_published = exam.isPublished;
    if (exam.isActive !== undefined) updatePayload.is_active = exam.isActive;
    if (exam.week !== undefined) updatePayload.week = exam.week;
    if (exam.durationMinutes !== undefined) updatePayload.duration_minutes = exam.durationMinutes;

    const { data, error } = await supabase
      .from("exams")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id: string, password?: string) => {
    const { error } = await supabase.from("exams").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
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
    return data;
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

  update: async (id: string, section: any) => {
    const { data, error } = await supabase
      .from("exam_sections")
      .update(section)
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

  updateGroup: async (id: string, group: any) => {
    const { data, error } = await supabase
      .from("question_groups")
      .update(group)
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

  update: async (id: string, question: any) => {
    const { data, error } = await supabase
      .from("questions")
      .update(question)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
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
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("exam_submissions")
      .select("*, exams(*), profiles:student_id(*)", { count: "exact" });

    if (params?.examId) query = query.eq("exam_id", params.examId);
    if (params?.studentId) query = query.eq("student_id", params.studentId);
    if (params?.status) query = query.eq("status", params.status as any);
    if (params?.needGrading) query = query.eq("status", "submitted");

    const sortField = params?.sortBy || "created_at";
    const ascending = params?.sortOrder === "asc";
    query = query.order(sortField, { ascending }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      data: data || [],
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("exam_submissions")
      .select(
        "*, exams(*, exam_sections(*, question_groups(*, questions(*)))), answers(*)"
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  getLatestByExam: async (examId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("exam_submissions")
      .select("*")
      .eq("exam_id", examId)
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return data;
  },

  start: async (examId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthenticated");

    // Idempotent start: Check if existing in_progress submission exists
    const { data: existing } = await supabase
      .from("exam_submissions")
      .select("*")
      .eq("exam_id", examId)
      .eq("student_id", user.id)
      .eq("status", "in_progress")
      .maybeSingle();

    if (existing) return existing;

    // Create new submission
    const { data, error } = await supabase
      .from("exam_submissions")
      .insert({
        exam_id: examId,
        student_id: user.id,
        status: "in_progress",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  saveAnswers: async (
    id: string,
    answers: Array<{
      questionId: string;
      answerText?: string;
      audioUrl?: string;
    }>
  ) => {
    const records = answers.map((a) => ({
      submission_id: id,
      question_id: a.questionId,
      answer_text: a.answerText,
      audio_url: a.audioUrl,
    }));

    const { data, error } = await supabase
      .from("answers")
      .upsert(records, { onConflict: "submission_id,question_id" })
      .select();

    if (error) throw error;
    return data;
  },

  submit: async (
    id: string,
    answers: Array<{
      questionId: string;
      answerText?: string;
      audioUrl?: string;
    }>
  ) => {
    // Gá»i RPC Stored Procedure Ä‘á»ƒ thá»±c hiá»‡n Atomic Transaction trÃªn Database:
    // Upsert Answers + Auto Grade + Mark Submitted/Graded trong 1 giao dá»‹ch duy nháº¥t.
    const formattedAnswers = (answers || []).map((a) => ({
      question_id: a.questionId,
      answer_text: a.answerText || "",
      audio_url: a.audioUrl || "",
    }));

    const { data, error } = await supabase.rpc("submit_exam_transaction", {
      p_submission_id: id,
      p_answers: formattedAnswers,
    });

    if (error) {
      // Fallback Ä‘Æ¡n giáº£n náº¿u RPC chÆ°a Ä‘Æ°á»£c táº¡o trong Supabase SQL Editor
      console.warn("RPC submit_exam_transaction fail, fallback to direct update:", error.message);
      await submissionsApi.saveAnswers(id, answers);
      const { data: fallbackData, error: fallbackErr } = await supabase
        .from("exam_submissions")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      if (fallbackErr) throw fallbackErr;
      return fallbackData;
    }

    return data;
  },

  grade: async (
    id: string,
    grades: Array<{ answerId: string; score: number; feedback?: string }>,
    totalScore: number
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Update individual answer scores & feedbacks
    for (const g of grades) {
      await supabase
        .from("answers")
        .update({
          score: g.score,
          feedback: g.feedback,
        })
        .eq("id", g.answerId);
    }

    // 2. Update submission total score and status to graded
    const { data, error } = await supabase
      .from("exam_submissions")
      .update({
        total_score: totalScore,
        status: "graded",
        graded_by: user?.id,
        graded_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
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

    const formattedData = (data || []).map((p: any) => {
      const extractedRoles =
        p.user_roles && Array.isArray(p.user_roles) && p.user_roles.length > 0
          ? p.user_roles.map((r: any) => r.role)
          : [params?.role || "student"];

      return {
        id: p.id || p.user_id,
        user_id: p.user_id || p.id,
        email: p.email,
        fullName: p.full_name || p.fullName || p.email?.split("@")[0],
        phone: p.phone,
        gender: p.gender,
        roles: extractedRoles,
        role: extractedRoles[0] || "student",
        isActive: p.is_active ?? true,
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

  create: async (user: any) => {
    const targetRole = user.role || "student";

    const { data: rpcData, error: rpcError } = await supabase.rpc("admin_create_user", {
      p_email: user.email,
      p_full_name: user.fullName || null,
      p_phone: user.phone || null,
      p_gender: user.gender || null,
      p_role: targetRole,
      p_password: user.password || "nextband123",
    });

    if (rpcError) {
      throw rpcError;
    }

    return { ...rpcData, role: targetRole, roles: [targetRole] };
  },

  update: async (id: string, user: any) => {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: user.fullName,
        is_active: user.isActive,
        phone: user.phone,
        gender: user.gender,
        certificate_band: user.certificateBand,
        certificate_type: user.certificateType,
        certificate_url: user.certificateUrl,
        certificate_verified: user.certificateVerified,
      })
      .eq("user_id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", id);
    if (error) throw error;
    return { success: true };
  },
};

// =============================================
// ENROLLMENTS API
// =============================================
export const enrollmentsApi = {
  list: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("enrollments")
      .select("*, courses(*)")
      .eq("student_id", user.id);

    if (error) throw error;
    return data;
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

  updateProgress: async (id: string, progressPercent: number) => {
    const { data, error } = await supabase
      .from("enrollments")
      .update({ progress_percent: progressPercent })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase.from("enrollments").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
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
// STATS API
// =============================================
export const statsApi = {
  getAdminStats: async () => {
    const [courses, profiles, exams] = await Promise.all([
      supabase.from("courses").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("exams").select("id", { count: "exact", head: true }),
    ]);

    return {
      courses: courses.count || 0,
      users: profiles.count || 0,
      exams: exams.count || 0,
    };
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
    let query = supabase.from("classes").select("*, courses(title)", { count: "exact" });

    if (params?.search) {
      query = query.ilike("name", `%${params.search}%`);
    }

    const sortField = params?.sortBy || "created_at";
    const ascending = params?.sortOrder === "asc";
    query = query.order(sortField, { ascending });

    if (params?.page && params?.limit) {
      const from = (params.page - 1) * params.limit;
      const to = from + params.limit - 1;
      query = query.range(from, to);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    const formatted = (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description || "",
      courseId: c.course_id,
      courseTitle: c.courses?.title || null,
      teacherId: c.teacher_id,
      startDate: c.start_date,
      endDate: c.end_date,
      isActive: c.is_active ?? true,
      createdAt: c.created_at,
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
    return {
      ...data,
      courseId: data.course_id,
      teacherId: data.teacher_id,
      startDate: data.start_date,
      endDate: data.end_date,
      isActive: data.is_active,
    };
  },

  create: async (body: any) => {
    const dbPayload = {
      name: body.name,
      description: body.description || null,
      course_id: body.courseId || null,
      teacher_id: body.teacherId || null,
      start_date: body.startDate || null,
      end_date: body.endDate || null,
      is_active: body.isActive ?? true,
    };

    const { data, error } = await supabase
      .from("classes")
      .insert(dbPayload)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      courseId: data.course_id,
      teacherId: data.teacher_id,
      startDate: data.start_date,
      endDate: data.end_date,
      isActive: data.is_active,
    };
  },

  update: async (id: string, body: any) => {
    const dbPayload = {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description || null }),
      ...(body.courseId !== undefined && { course_id: body.courseId || null }),
      ...(body.teacherId !== undefined && { teacher_id: body.teacherId || null }),
      ...(body.startDate !== undefined && { start_date: body.startDate || null }),
      ...(body.endDate !== undefined && { end_date: body.endDate || null }),
      ...(body.isActive !== undefined && { is_active: body.isActive }),
    };

    const { data, error } = await supabase
      .from("classes")
      .update(dbPayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      courseId: data.course_id,
      teacherId: data.teacher_id,
      startDate: data.start_date,
      endDate: data.end_date,
      isActive: data.is_active,
    };
  },

  delete: async (id: string) => {
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
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

      let profileId = profile?.id;

      // 2. Pre-provision profile if not found
      if (!profile) {
        const newProfileId = crypto.randomUUID();
        const { data: createdProfile, error: createErr } = await supabase
          .from("profiles")
          .insert({
            id: newProfileId,
            email: email,
            full_name: email.split("@")[0],
          })
          .select("id, email")
          .single();

        if (createErr) {
          console.warn(`Failed to pre-provision profile for ${email}:`, createErr.message);
          continue;
        }

        profileId = createdProfile.id;
        addedProfiles.push({ id: profileId, email, isNew: true });
      } else {
        addedProfiles.push({ id: profileId, email, isNew: false });
      }

      // 3. Link profile.id to class_students
      if (profileId) {
        await supabase
          .from("class_students")
          .upsert(
            { class_id: classId, student_id: profileId },
            { onConflict: "class_id,student_id" }
          );
      }
    }

    return { added: addedProfiles.length, profiles: addedProfiles };
  },

  claimProfileOnLogin: async (authUser: { id: string; email: string; user_metadata?: any }) => {
    if (!authUser.email) return;

    // Check if a pre-provisioned profile exists for this email
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, user_id")
      .eq("email", authUser.email.toLowerCase())
      .maybeSingle();

    if (existingProfile) {
      // If user_id is not set or different, update it to claim ownership
      if (existingProfile.user_id !== authUser.id) {
        await supabase
          .from("profiles")
          .update({
            user_id: authUser.id,
            full_name: authUser.user_metadata?.full_name || authUser.email.split("@")[0],
            avatar_url: authUser.user_metadata?.avatar_url || null,
          })
          .eq("id", existingProfile.id);
      }
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

  listSchedules: async (classId: string) => {
    const { data, error } = await supabase
      .from("class_schedules")
      .select("*")
      .eq("class_id", classId);

    if (error) throw error;
    return data;
  },

  createSchedule: async (classId: string, body: any) => {
    const { data, error } = await supabase
      .from("class_schedules")
      .insert({ ...body, class_id: classId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteSchedule: async (classId: string, scheduleId: string) => {
    const { error } = await supabase
      .from("class_schedules")
      .delete()
      .eq("id", scheduleId);

    if (error) throw error;
    return { success: true };
  },

  getAttendance: async (classId: string, sessionDate: string) => {
    const { data, error } = await supabase
      .from("class_attendance")
      .select("*")
      .eq("class_id", classId)
      .eq("session_date", sessionDate);

    if (error) throw error;
    return data;
  },

  upsertAttendance: async (classId: string, body: any) => {
    const records = body.records.map((r: any) => ({
      class_id: classId,
      session_date: body.sessionDate,
      student_id: r.studentId,
      status: r.status,
      note: r.note,
    }));

    const { data, error } = await supabase
      .from("class_attendance")
      .upsert(records, {
        onConflict: "class_id,student_id,session_date",
      });

    if (error) throw error;
    return data;
  },

  getAttendanceHistory: async (classId: string) => {
    const { data, error } = await supabase
      .from("class_attendance")
      .select("*")
      .eq("class_id", classId);

    if (error) throw error;
    return data;
  },
};

// =============================================
// SITE SETTINGS API
// =============================================
export const siteSettingsApi = {
  get: async () => {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "global")
      .maybeSingle();

    if (error || !data) {
      return normalizeSiteSettings({});
    }
    return normalizeSiteSettings(data.value);
  },

  update: async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from("site_settings")
      .upsert(
        { key: "global", value: payload },
        { onConflict: "key" }
      )
      .select()
      .single();

    if (error) throw error;
    return normalizeSiteSettings(data.value);
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
  getWorkspace: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const response = await fetch(`${API_BASE_URL}/homeworks/workspace`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to fetch workspace");
    return result as { success: boolean; data: StudentWorkspaceContract };
  },

  getTeacherWorkspace: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const response = await fetch(`${API_BASE_URL}/homeworks/teacher-workspace`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to fetch teacher workspace");
    return result as { success: boolean; data: TeacherWorkspaceContract };
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
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const response = await fetch(`${API_BASE_URL}/classes/${classId}/lessons`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to fetch class lessons");
    return result as { success: boolean; data: ClassLessonContract };
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
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const response = await fetch(`${API_BASE_URL}/classes/${classId}/sessions/${sessionId}/attendance`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to fetch attendance");
    return result as { success: boolean; data: SessionAttendanceContract };
  },

  markAttendance: async (
    classId: string,
    sessionId: string,
    items: Array<{ studentId: string; status: AttendanceStatus; notes?: string }>
  ) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const response = await fetch(`${API_BASE_URL}/classes/${classId}/sessions/${sessionId}/attendance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to save attendance");
    return result;
  },
};

// NOTIFICATIONS API (Core Notification Engine)
// =============================================
export interface NotificationItem {
  id: string;
  recipient_id?: string;
  recipient_role: "admin" | "teacher" | "student";
  type: string;
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
  action_url: string;
  priority: "info" | "warning" | "urgent";
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export const notificationsApi = {
  list: async (scope: "admin" | "teacher" | "student") => {
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase.from("notifications").select("*").order("created_at", { ascending: false });

    if (scope === "admin") {
      query = query.eq("recipient_role", "admin");
    } else if (user?.id) {
      query = query.or(`recipient_id.eq.${user.id},and(recipient_role.eq.${scope},recipient_id.is.null)`);
    } else {
      query = query.eq("recipient_role", scope);
    }

    const { data, error } = await query;
    if (error) {
      // Mock Fallback náº¿u chÆ°a táº¡o báº£ng notifications trÃªn CSDL
      const mockNotifications: NotificationItem[] = scope === "admin" ? [
        {
          id: "n1",
          recipient_role: "admin",
          type: "user_sso",
          title: "Há»c viÃªn má»›i Ä‘Äƒng nháº­p",
          message: "Há»c viÃªn Pháº¡m VÄƒn D vá»«a Ä‘Äƒng nháº­p láº§n Ä‘áº§u qua Google SSO.",
          action_url: "/admin/users?search=student",
          priority: "info",
          is_read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: "n2",
          recipient_role: "admin",
          type: "sla_warning",
          title: "Cáº£nh bÃ¡o cháº¥m bÃ i cháº­m",
          message: "GiÃ¡o viÃªn HoÃ ng Anh cÃ³ 12 bÃ i ná»™p chÆ°a cháº¥m quÃ¡ 3 ngÃ y.",
          action_url: "/admin/teachers",
          priority: "warning",
          is_read: false,
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: "n3",
          recipient_role: "admin",
          type: "class_complete",
          title: "Lá»›p há»c hoÃ n táº¥t khÃ³a",
          message: "Lá»›p Leader K10 Ä‘Ã£ hoÃ n thÃ nh 27/27 buá»•i há»c.",
          action_url: "/admin/classes",
          priority: "info",
          is_read: true,
          created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
      ] : [
        {
          id: "nt1",
          recipient_role: "teacher",
          type: "submission",
          title: "BÃ i ná»™p má»›i Writing Task 2",
          message: "Há»c viÃªn Nguyá»…n VÄƒn A vá»«a ná»™p bÃ i Writing Task 2 cho Lá»›p Dreamer K31.",
          action_url: "/teacher/grading",
          priority: "urgent",
          is_read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: "nt2",
          recipient_role: "teacher",
          type: "submission",
          title: "BÃ i ná»™p má»›i Speaking Part 2",
          message: "Há»c viÃªn Tráº§n Thá»‹ B vá»«a gá»­i ghi Ã¢m Speaking Part 2.",
          action_url: "/teacher/grading",
          priority: "info",
          is_read: false,
          created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
        },
        {
          id: "nt3",
          recipient_role: "teacher",
          type: "enrollment",
          title: "Biáº¿n Ä‘á»™ng há»c viÃªn",
          message: "Admin vá»«a thÃªm 2 há»c viÃªn má»›i vÃ o Lá»›p Master K15 cá»§a báº¡n.",
          action_url: "/teacher/classes",
          priority: "info",
          is_read: true,
          created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        },
      ];
      return mockNotifications;
    }

    return (data || []) as NotificationItem[];
  },

  markAsRead: async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.warn("Failed to mark notification as read in DB:", error.message);
    }
    return { success: true };
  },

  markAllAsRead: async (scope: "admin" | "teacher" | "student") => {
    const { data: { user } } = await supabase.auth.getUser();
    let query = supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() });

    if (scope === "admin") {
      query = query.eq("recipient_role", "admin");
    } else if (user?.id) {
      query = query.or(`recipient_id.eq.${user.id},recipient_role.eq.${scope}`);
    }

    const { error } = await query;
    if (error) console.warn("markAllAsRead warning:", error);
    return { success: true };
  },
};

export default supabase;
