import { supabase } from "./supabase";
import { normalizeSiteSettings } from "./site-settings";

// Helper helper format URLs if any
export const formatStorageUrl = (path: string | null) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const { data } = supabase.storage.from("exam-assets").getPublicUrl(path);
  return data.publicUrl;
};

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
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
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

  verifyPassword: async (password: string) => {
    return { valid: true };
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

    // Auto-seed default 9 courses if database table is empty
    if (!data || data.length === 0) {
      const defaultCourses = [
        { id: "c1000000-0000-0000-0000-000000000001", title: "DREAMER", description: "Khóa học IELTS dành cho người mới bắt đầu (Band 3.0 - 4.0)", level: "3.0 - 4.0", slug: "dreamer", is_published: true, is_active: true },
        { id: "c1000000-0000-0000-0000-000000000002", title: "BUILDER", description: "Khóa học IELTS Xây dựng nền tảng (Band 4.0 - 5.0)", level: "4.0 - 5.0", slug: "builder", is_published: true, is_active: true },
        { id: "c1000000-0000-0000-0000-000000000003", title: "MASTER", description: "Khóa học IELTS Chuyên sâu bứt phá (Band 5.0 - 6.0+)", level: "5.0 - 6.0+", slug: "master", is_published: true, is_active: true },
        { id: "c1000000-0000-0000-0000-000000000004", title: "PLACEMENT TEST", description: "Bài thi kiểm tra trình độ đầu vào IELTS", level: "All Levels", slug: "placement-test", is_published: true, is_active: true },
        { id: "c1000000-0000-0000-0000-000000000005", title: "LUYỆN THI TN THPT", description: "Bộ đề luyện thi tốt nghiệp Trung học Phổ thông", level: "Lớp 12", slug: "luyen-thi-tn-thpt", is_published: true, is_active: true },
        { id: "c1000000-0000-0000-0000-000000000006", title: "ENTRANCE TEST THPTQG", description: "Bài test đánh giá năng lực THPTQG", level: "Lớp 12", slug: "entrance-test-thptqg", is_published: true, is_active: true },
        { id: "c1000000-0000-0000-0000-000000000007", title: "STARTER", description: "Nền tảng Tiếng Anh căn bản", level: "Beginner", slug: "starter", is_published: true, is_active: true },
        { id: "c1000000-0000-0000-0000-000000000008", title: "LEADER", description: "Bứt phá kỹ năng Luyện nói & Viết IELTS", level: "Intermediate", slug: "leader", is_published: true, is_active: true },
        { id: "c1000000-0000-0000-0000-000000000009", title: "EXTRA LISTENING", description: "Luyện phản xạ và kỹ năng nghe chuyên sâu", level: "All Levels", slug: "extra-listening", is_published: true, is_active: true },
      ];

      // Fire and forget upsert to populate database
      supabase.from("courses").upsert(defaultCourses, { onConflict: "id" }).then(() => {});

      data = defaultCourses as any[];
      count = defaultCourses.length;
    }

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
    isLocked?: boolean;
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
        is_locked: course.isLocked ?? false,
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
      isLocked: boolean;
      slug: string;
    }>
  ) => {
    const { data, error } = await supabase
      .from("courses")
      .update({
        title: course.title,
        description: course.description,
        level: course.level,
        thumbnail_url: course.thumbnailUrl,
        is_published: course.isPublished,
        is_active: course.isActive,
        is_locked: course.isLocked,
        slug: course.slug,
      })
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
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("exams")
      .select(
        "*, exam_sections(*, question_groups(*, questions(*)))"
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  create: async (exam: {
    courseId: string;
    title: string;
    description?: string;
    week?: number;
    durationMinutes?: number;
    isPublished?: boolean;
    isActive?: boolean;
    isLocked?: boolean;
    isOpen?: boolean;
    maxParticipants?: number | null;
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
        is_locked: exam.isLocked ?? false,
        is_open: exam.isOpen ?? false,
        max_participants: exam.maxParticipants ?? null,
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

    await supabase.from("exam_sections").insert(
      defaultSections.map((s) => ({ ...s, exam_id: newExam.id }))
    );

    return newExam;
  },

  update: async (
    id: string,
    exam: Partial<{
      title: string;
      description: string;
      isPublished: boolean;
      isActive: boolean;
      isLocked: boolean;
      week: number;
      durationMinutes: number;
      isOpen: boolean;
      maxParticipants: number | null;
    }>
  ) => {
    const { data, error } = await supabase
      .from("exams")
      .update({
        title: exam.title,
        description: exam.description,
        is_published: exam.isPublished,
        is_active: exam.isActive,
        is_locked: exam.isLocked,
        week: exam.week,
        duration_minutes: exam.durationMinutes,
        is_open: exam.isOpen,
        max_participants: exam.maxParticipants,
      })
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
    // 1. Save Answers
    if (answers && answers.length > 0) {
      await submissionsApi.saveAnswers(id, answers);
    }

    // 2. Mark submission as submitted
    const { data, error } = await supabase
      .from("exam_submissions")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
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
// USERS API
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

    let query = supabase
      .from("profiles")
      .select("*, user_roles(role)", { count: "exact" });

    if (params?.search) {
      query = query.ilike("full_name", `%${params.search}%`);
    }

    const { data, count, error } = await query.range(from, to);
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
      .from("profiles")
      .select("*, user_roles(role)")
      .eq("user_id", id)
      .single();

    if (error) throw error;
    return data;
  },

  create: async (user: any) => {
    // Handled via Supabase Auth signup
    return { success: true };
  },

  update: async (id: string, user: any) => {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: user.fullName,
        is_active: user.isActive,
        phone: user.phone,
        gender: user.gender,
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

  unenroll: async (id: string) => {
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
  list: async (params?: any) => {
    const { data, error } = await supabase.from("classes").select("*");
    if (error) throw error;
    return { data: data || [] };
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("classes")
      .select("*, class_students(*)")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  create: async (body: any) => {
    const { data, error } = await supabase
      .from("classes")
      .insert(body)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, body: any) => {
    const { data, error } = await supabase
      .from("classes")
      .update(body)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
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
    const response = await fetch("http://localhost:3000/api/v1/invitations/join", {
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
    const response = await fetch("http://localhost:3000/api/v1/invitations/generate", {
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
    const response = await fetch("http://localhost:3000/api/v1/homeworks/workspace", {
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
    const response = await fetch("http://localhost:3000/api/v1/homeworks/teacher-workspace", {
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
    const response = await fetch("http://localhost:3000/api/v1/homeworks/create", {
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
    const response = await fetch("http://localhost:3000/api/v1/homeworks/submit", {
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
    const response = await fetch("http://localhost:3000/api/v1/homeworks/grade", {
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
    const response = await fetch(`http://localhost:3000/api/v1/classes/${classId}/lessons`, {
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
    const response = await fetch(`http://localhost:3000/api/v1/classes/${classId}/sessions/${sessionId}/attendance`, {
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
    const response = await fetch(`http://localhost:3000/api/v1/classes/${classId}/sessions/${sessionId}/attendance`, {
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

export default supabase;
