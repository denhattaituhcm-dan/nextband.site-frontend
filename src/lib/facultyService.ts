import { supabase } from "./supabase";

export interface FacultyProfile {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
  ielts_badge: string;
  ielts_badge_sub?: string | null;
  achievements: string[];
  trf_image_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export type FacultyProfileInput = Omit<FacultyProfile, "id" | "created_at" | "updated_at">;

// Fallback seed record if table has not been initialized in environment
export const INITIAL_FACULTY_SEED: FacultyProfile = {
  id: "luu-van-dang",
  name: "Lưu Văn Đang",
  role: "Academic Lead — Phụ trách Chuyên môn ARIS",
  avatar_url: "/teachers/LVD.png",
  ielts_badge: "8.0",
  ielts_badge_sub: "Listening & Reading 8.5",
  achievements: [
    "IELTS 8.0 Academic (Listening 8.5, Reading 8.5) — Verified Test Report Form",
    "Tác giả khung năng lực 7 cấp bậc (ARIS-7) & phương pháp đào tạo The ARIS Way",
    "Hơn 5 năm kinh nghiệm giảng dạy & chuẩn hóa tiêu chuẩn chấm chữa trên NextBand",
    "Cử nhân Sư phạm Tiếng Anh, chuyên sâu phương pháp luận khảo thí quốc tế",
  ],
  trf_image_url: "/IELTS CERTIFICATE_LUU_VAN-DANG_page-0001.jpg",
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function normalizeRow(row: any): FacultyProfile {
  let achievements: string[] = [];
  if (Array.isArray(row.achievements)) {
    achievements = row.achievements.map((item: any) =>
      typeof item === "string" ? item : item?.text || String(item)
    );
  } else if (typeof row.achievements === "string") {
    try {
      const parsed = JSON.parse(row.achievements);
      if (Array.isArray(parsed)) {
        achievements = parsed.map((item: any) =>
          typeof item === "string" ? item : item?.text || String(item)
        );
      }
    } catch {
      achievements = [row.achievements];
    }
  }

  return {
    id: row.id,
    name: row.name || "Giảng viên ARIS",
    role: row.role || "IELTS Instructor",
    avatar_url: row.avatar_url || null,
    ielts_badge: row.ielts_badge || "8.0",
    ielts_badge_sub: row.ielts_badge_sub || null,
    achievements: achievements.length > 0 ? achievements : INITIAL_FACULTY_SEED.achievements,
    trf_image_url: row.trf_image_url || null,
    is_published: Boolean(row.is_published ?? true),
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

export const facultyService = {
  /**
   * Fetch all published faculty profiles for the public /teachers page
   */
  async getPublicFaculty(): Promise<FacultyProfile[]> {
    try {
      const { data, error } = await supabase
        .from("faculty_profiles")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: true });

      if (error) {
        console.warn("[facultyService] Supabase query notice, using default seed:", error.message);
        return [INITIAL_FACULTY_SEED];
      }

      if (data && data.length > 0) {
        return data.map(normalizeRow);
      }

      return [INITIAL_FACULTY_SEED];
    } catch (err) {
      console.warn("[facultyService] Network error, using default seed:", err);
      return [INITIAL_FACULTY_SEED];
    }
  },

  /**
   * Fetch all faculty profiles (including drafts) for Admin
   */
  async getAllFaculty(): Promise<FacultyProfile[]> {
    try {
      const { data, error } = await supabase
        .from("faculty_profiles")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.warn("[facultyService] Supabase admin query notice:", error.message);
        return [INITIAL_FACULTY_SEED];
      }

      if (data && data.length > 0) {
        return data.map(normalizeRow);
      }

      return [INITIAL_FACULTY_SEED];
    } catch (err) {
      console.warn("[facultyService] Network error:", err);
      return [INITIAL_FACULTY_SEED];
    }
  },

  /**
   * Create or update a faculty profile
   */
  async saveFaculty(profile: Partial<FacultyProfile>): Promise<FacultyProfile> {
    const payload: any = {
      name: profile.name,
      role: profile.role,
      avatar_url: profile.avatar_url,
      ielts_badge: profile.ielts_badge || "8.0",
      ielts_badge_sub: profile.ielts_badge_sub || null,
      achievements: profile.achievements || [],
      trf_image_url: profile.trf_image_url || null,
      is_published: profile.is_published ?? true,
      updated_at: new Date().toISOString(),
    };

    if (profile.id && profile.id !== "luu-van-dang") {
      const { data, error } = await supabase
        .from("faculty_profiles")
        .update(payload)
        .eq("id", profile.id)
        .select()
        .single();

      if (error) throw error;
      return normalizeRow(data);
    } else {
      const { data, error } = await supabase
        .from("faculty_profiles")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return normalizeRow(data);
    }
  },

  /**
   * Delete a faculty profile
   */
  async deleteFaculty(id: string): Promise<boolean> {
    if (id === "luu-van-dang") {
      // If it's the synthetic seed ID, attempt delete by name
      await supabase.from("faculty_profiles").delete().eq("name", "Lưu Văn Đang");
      return true;
    }
    const { error } = await supabase.from("faculty_profiles").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  /**
   * Quick toggle publish state
   */
  async togglePublished(id: string, is_published: boolean): Promise<boolean> {
    const { error } = await supabase
      .from("faculty_profiles")
      .update({ is_published, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    return true;
  },

  /**
   * Upload image asset (avatar or TRF scan) to Supabase Storage
   */
  async uploadAsset(file: File, folder: "avatars" | "trf"): Promise<string> {
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `faculty/${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    // Use exam-assets bucket or public bucket
    const bucketName = "exam-assets";
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      // Try fallback to standard public bucket if exam-assets bucket policy fails
      const fallbackBucket = "public-assets";
      const { data: fbData, error: fbError } = await supabase.storage
        .from(fallbackBucket)
        .upload(fileName, file, { cacheControl: "3600", upsert: true });

      if (fbError) throw new Error(error.message || fbError.message);

      const { data: publicUrlData } = supabase.storage.from(fallbackBucket).getPublicUrl(fbData.path);
      return publicUrlData.publicUrl;
    }

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  },
};
