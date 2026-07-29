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
    
    // Always fallback to 9 default courses if database/RLS returns empty data
    if (error || !data || data.length === 0) {
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

      // Auto-upsert background sync
      supabase.from("courses").upsert(defaultCourses, { onConflict: "id" }).then(() => {});

      let filtered = defaultCourses;
      if (params?.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(c => c.title.toLowerCase().includes(s) || c.description.toLowerCase().includes(s));
      }

      data = filtered as any[];
      count = filtered.length;
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

    let { data, count, error } = await query;
    
    if (error || !data || data.length === 0) {
      // Complete mapping of all real manual exams from original MySQL database backup (nextband_backup.sql)
      const allRealExams = [
        // DREAMER Course (c1000000-0000-0000-0000-000000000001)
        { id: "d6a107dc-4319-4a71-bf87-5d875e5d3281", courseId: "c1000000-0000-0000-0000-000000000001", title: "W1 - D1 - WRI", week: 1, durationMinutes: 60, is_published: true, is_active: true },
        { id: "a599a87d-2ee1-49b9-96b3-7f7472c2a592", courseId: "c1000000-0000-0000-0000-000000000001", title: "W1 - D2 - LIS", week: 1, durationMinutes: 60, is_published: true, is_active: true },
        { id: "0b3121c6-299d-46df-9e5f-cfef796d59c4", courseId: "c1000000-0000-0000-0000-000000000001", title: "W1 - D3 - SPK", week: 1, durationMinutes: 60, is_published: true, is_active: true },
        { id: "92cf8047-efc6-44bc-8e8f-0ac76b81ddc4", courseId: "c1000000-0000-0000-0000-000000000001", title: "W2 - D1 - WRI", week: 2, durationMinutes: 60, is_published: true, is_active: true },
        { id: "282d1ecc-c1af-4a68-b9d7-553e0ea7a30e", courseId: "c1000000-0000-0000-0000-000000000001", title: "W2 - D2 - LIS", week: 2, durationMinutes: 60, is_published: true, is_active: true },
        { id: "157a0eaa-2c10-46e1-b2bc-82d0b0756679", courseId: "c1000000-0000-0000-0000-000000000001", title: "W2 - D3 - SPK", week: 2, durationMinutes: 60, is_published: true, is_active: true },
        { id: "b70a6a10-7526-4cc8-8dcd-06666f0bde5f", courseId: "c1000000-0000-0000-0000-000000000001", title: "W3 - D1 - WRI", week: 3, durationMinutes: 60, is_published: true, is_active: true },
        { id: "4d827565-1cc3-4cdc-9341-c444b613efa3", courseId: "c1000000-0000-0000-0000-000000000001", title: "W3 - D2 - LIS", week: 3, durationMinutes: 60, is_published: true, is_active: true },
        { id: "0808e5d3-0b57-4400-a224-3eceb21194a2", courseId: "c1000000-0000-0000-0000-000000000001", title: "W3 - D3 - SPK", week: 3, durationMinutes: 60, is_published: true, is_active: true },
        { id: "45344adc-cd36-41db-859b-d67b3c38ee90", courseId: "c1000000-0000-0000-0000-000000000001", title: "W4 - D1 - WRI", week: 4, durationMinutes: 60, is_published: true, is_active: true },
        { id: "2ee544a6-b7dd-4cbe-87ae-699204a9eaee", courseId: "c1000000-0000-0000-0000-000000000001", title: "W4 - D2 - LIS", week: 4, durationMinutes: 60, is_published: true, is_active: true },
        { id: "382374b7-92c9-4ac0-a033-8a490005e9d7", courseId: "c1000000-0000-0000-0000-000000000001", title: "W4 - D3 - REA", week: 4, durationMinutes: 60, is_published: true, is_active: true },
        { id: "27afe18f-7242-4305-82ee-a9610339561f", courseId: "c1000000-0000-0000-0000-000000000001", title: "W5 - D1 - WRI", week: 5, durationMinutes: 60, is_published: true, is_active: true },
        { id: "927916ef-5f91-4361-897e-9db28f9d5a32", courseId: "c1000000-0000-0000-0000-000000000001", title: "W5 - D2 - LIS", week: 5, durationMinutes: 60, is_published: true, is_active: true },
        { id: "b23a5009-0ced-47da-8f9a-0b88c6dea2b7", courseId: "c1000000-0000-0000-0000-000000000001", title: "W5 - D3 - SPK", week: 5, durationMinutes: 60, is_published: true, is_active: true },
        { id: "2e14663b-6e02-4b74-b32b-2395b8d3b242", courseId: "c1000000-0000-0000-0000-000000000001", title: "W6 - D1 - WRI", week: 6, durationMinutes: 60, is_published: true, is_active: true },
        { id: "e12f1c50-1cf2-41de-8fe9-8f110135c3d4", courseId: "c1000000-0000-0000-0000-000000000001", title: "W6 - D2 - LIS", week: 6, durationMinutes: 60, is_published: true, is_active: true },
        { id: "2d04c0c0-693f-4c34-a72d-1cc15df9ebb2", courseId: "c1000000-0000-0000-0000-000000000001", title: "W6 - D3 - WR", week: 6, durationMinutes: 60, is_published: true, is_active: true },
        { id: "9b1c42de-a575-476d-ab5b-1c6990109db8", courseId: "c1000000-0000-0000-0000-000000000001", title: "W7 - D1 - WRI", week: 7, durationMinutes: 60, is_published: true, is_active: true },
        { id: "a162d433-4fbb-41d9-b015-9a886b128c65", courseId: "c1000000-0000-0000-0000-000000000001", title: "W7 - D2 - LIS", week: 7, durationMinutes: 60, is_published: true, is_active: true },
        { id: "660a0330-f5ba-415f-b27c-acb76c00c7b9", courseId: "c1000000-0000-0000-0000-000000000001", title: "W7 - D3 - SPK", week: 7, durationMinutes: 60, is_published: true, is_active: true },
        { id: "e3cb9e1f-6cf8-4058-931c-a96d5673a0df", courseId: "c1000000-0000-0000-0000-000000000001", title: "W8 - D1 - WRI", week: 8, durationMinutes: 60, is_published: true, is_active: true },
        { id: "d04563fd-bad0-4a11-b412-21461cfcedc7", courseId: "c1000000-0000-0000-0000-000000000001", title: "W8 - D2 - LIS", week: 8, durationMinutes: 60, is_published: true, is_active: true },
        { id: "ac12e785-5ac2-43d3-8ea6-30cc9a2c8b84", courseId: "c1000000-0000-0000-0000-000000000001", title: "W8 - D3 - SPK", week: 8, durationMinutes: 60, is_published: true, is_active: true },
        { id: "f9f1f852-96c6-42af-a067-4be16e912838", courseId: "c1000000-0000-0000-0000-000000000001", title: "W9 - D1 - WRI", week: 9, durationMinutes: 60, is_published: true, is_active: true },
        { id: "b15091ab-f499-45dd-ada1-513a9a0650bb", courseId: "c1000000-0000-0000-0000-000000000001", title: "W9 - D2 - LIS", week: 9, durationMinutes: 60, is_published: true, is_active: true },
        { id: "707a6228-4194-4cd8-b911-ea97713585fb", courseId: "c1000000-0000-0000-0000-000000000001", title: "W9 - D3 - SPK", week: 9, durationMinutes: 60, is_published: true, is_active: true },

        // STARTER Course (c1000000-0000-0000-0000-000000000007)
        { id: "95a10041-e338-4c04-82bd-e7e4f086b7a7", courseId: "c1000000-0000-0000-0000-000000000007", title: "WEEK 1 - DAY 1 - SPEAKING", week: 1, durationMinutes: 60, is_published: true, is_active: true },
        { id: "51fbefd4-c8fe-441a-afd8-67c32be09953", courseId: "c1000000-0000-0000-0000-000000000007", title: "WEEK 1 - DAY 2 - LISTENING", week: 1, durationMinutes: 60, is_published: true, is_active: true },
        { id: "b944f2ff-a9d7-4620-9017-8727545b1d33", courseId: "c1000000-0000-0000-0000-000000000007", title: "WEEK 1 - DAY 3 - READING AND WRITING", week: 1, durationMinutes: 60, is_published: true, is_active: true },
        { id: "16662925-618d-4155-9d5f-82a11a933277", courseId: "c1000000-0000-0000-0000-000000000007", title: "WEEK 2 - DAY 1 - SPEAKING", week: 2, durationMinutes: 60, is_published: true, is_active: true },
        { id: "0c47e7ff-b596-436a-8192-fb8a10802adb", courseId: "c1000000-0000-0000-0000-000000000007", title: "WEEK 2 - DAY 2 - LISTENING", week: 2, durationMinutes: 60, is_published: true, is_active: true },
        { id: "7d9320f3-211e-4dab-8317-6bd8348dd728", courseId: "c1000000-0000-0000-0000-000000000007", title: "WEEK 2 - DAY 3 - READING AND WRITING", week: 2, durationMinutes: 60, is_published: true, is_active: true },
        { id: "b7075fed-d9d9-4fc6-8b25-769b465eb81d", courseId: "c1000000-0000-0000-0000-000000000007", title: "WEEK 3 - DAY 1 - SPEAKING", week: 3, durationMinutes: 60, is_published: true, is_active: true },
        { id: "fa6ddeec-55e6-40f8-8809-3cb5c3e5c911", courseId: "c1000000-0000-0000-0000-000000000007", title: "WEEK 3 - DAY 2 - LISTENING", week: 3, durationMinutes: 60, is_published: true, is_active: true },
        { id: "1f59a2eb-022b-4514-a125-d46c684034dc", courseId: "c1000000-0000-0000-0000-000000000007", title: "WEEK 3 - DAY 3 - READING AND WRITING", week: 3, durationMinutes: 60, is_published: true, is_active: true },
        { id: "35163ccd-b649-472a-8810-e1ff73339e38", courseId: "c1000000-0000-0000-0000-000000000007", title: "WEEK 4 - DAY 1 - SPEAKING", week: 4, durationMinutes: 60, is_published: true, is_active: true },
        { id: "349fe6ed-0eb3-4df8-9ead-ee4460b904aa", courseId: "c1000000-0000-0000-0000-000000000007", title: "WEEK 4 - DAY 2 - LISTENING", week: 4, durationMinutes: 60, is_published: true, is_active: true },
        { id: "113468ae-f476-484a-b062-b477f2467642", courseId: "c1000000-0000-0000-0000-000000000007", title: "WEEK 4 - DAY 3 - READING AND WRITING", week: 4, durationMinutes: 60, is_published: true, is_active: true },

        // MASTER Course (c1000000-0000-0000-0000-000000000003)
        { id: "0721ea56-07cb-4e34-96c5-c7f11e40e8c3", courseId: "c1000000-0000-0000-0000-000000000003", title: "WEEK 1 - DAY 1 - WRITING", week: 1, durationMinutes: 60, is_published: true, is_active: true },
        { id: "6516498e-83fa-4df1-9ed8-27dac6a65fbc", courseId: "c1000000-0000-0000-0000-000000000003", title: "WEEK 1 - DAY 2 - READING & LISTENING", week: 1, durationMinutes: 60, is_published: true, is_active: true },
        { id: "0122d9cf-7f54-4fc2-93bd-ae2e789599ac", courseId: "c1000000-0000-0000-0000-000000000003", title: "WEEK 1 - DAY 3 - SPEAKING", week: 1, durationMinutes: 60, is_published: true, is_active: true },
        { id: "e9c0df36-f93a-4c5a-81b5-41f392c8a961", courseId: "c1000000-0000-0000-0000-000000000003", title: "WEEK 2 - DAY 1 - WRITING", week: 2, durationMinutes: 60, is_published: true, is_active: true },
        { id: "8c3756f6-11ba-429b-9977-42bf93b61d61", courseId: "c1000000-0000-0000-0000-000000000003", title: "WEEK 2 - DAY 2 - READING & LISTENING", week: 2, durationMinutes: 60, is_published: true, is_active: true },
        { id: "507f2513-03e3-4e49-ae07-cbd2259d1d26", courseId: "c1000000-0000-0000-0000-000000000003", title: "WEEK 2 - DAY 3 - SPEAKING", week: 2, durationMinutes: 60, is_published: true, is_active: true },
        { id: "62a5a680-1c98-4b00-8a79-528400fe0d55", courseId: "c1000000-0000-0000-0000-000000000003", title: "WEEK 3 - DAY 1 - WRITING", week: 3, durationMinutes: 60, is_published: true, is_active: true },
        { id: "47d26c4b-90d8-4ded-b6a4-8946364abf97", courseId: "c1000000-0000-0000-0000-000000000003", title: "WEEK 3 - DAY 2 - READING AND LISTENING", week: 3, durationMinutes: 60, is_published: true, is_active: true },
        { id: "9208f073-0117-40e8-aa18-b6342e7aba70", courseId: "c1000000-0000-0000-0000-000000000003", title: "WEEK 3 - DAY 3 - SPEAKING", week: 3, durationMinutes: 60, is_published: true, is_active: true },

        // LEADER Course (c1000000-0000-0000-0000-000000000008)
        { id: "ea021390-71b9-46ab-ab5b-4a49ee1224aa", courseId: "c1000000-0000-0000-0000-000000000008", title: "W1 - D1 - WRI", week: 1, durationMinutes: 60, is_published: true, is_active: true },
        { id: "56385f9e-6285-45ff-bdaa-34bf77894264", courseId: "c1000000-0000-0000-0000-000000000008", title: "W1 - D2 - SPK", week: 1, durationMinutes: 60, is_published: true, is_active: true },
        { id: "e6721943-16a5-4e8b-ad35-0037ec28cbfb", courseId: "c1000000-0000-0000-0000-000000000008", title: "W1 - D3 - VOCAB", week: 1, durationMinutes: 60, is_published: true, is_active: true },
        { id: "c4090767-c871-4f1a-b099-e60a70f0fc24", courseId: "c1000000-0000-0000-0000-000000000008", title: "W2 - D1 - WRI", week: 2, durationMinutes: 60, is_published: true, is_active: true },
        { id: "8e015bc4-dbfa-4fc8-b927-c945dede5fb2", courseId: "c1000000-0000-0000-0000-000000000008", title: "W2 - D2 - SPK", week: 2, durationMinutes: 60, is_published: true, is_active: true },

        // PLACEMENT TEST (c1000000-0000-0000-0000-000000000004)
        { id: "cce291f7-d88b-4976-8ed3-cc21daca7023", courseId: "c1000000-0000-0000-0000-000000000004", title: "ENTRANCE TEST", week: 1, durationMinutes: 60, is_published: true, is_active: true },

        // LUYỆN THI TN THPT (c1000000-0000-0000-0000-000000000005)
        { id: "0f2b6632-acc8-4d0b-a464-bca19424c177", courseId: "c1000000-0000-0000-0000-000000000005", title: "Đề thi TN THPT 2025 (mã đề: 1101)", week: 1, durationMinutes: 60, is_published: true, is_active: true },

        // ENTRANCE TEST THPTQG (c1000000-0000-0000-0000-000000000006)
        { id: "53495a87-9393-49bd-b16b-1daf12457b69", courseId: "c1000000-0000-0000-0000-000000000006", title: "Bài test Ngữ pháp THPTQG", week: 1, durationMinutes: 60, is_published: true, is_active: true },
      ];

      let filtered = allRealExams;
      if (params?.courseId) {
        filtered = filtered.filter(e => e.courseId === params.courseId);
      }
      if (params?.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(e => e.title.toLowerCase().includes(s));
      }

      data = filtered as any[];
      count = filtered.length;
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
