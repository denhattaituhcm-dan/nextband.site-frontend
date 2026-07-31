import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://gzpdlqxjggyxlkeatvvf.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const COURSES = [
  { id: "c1000000-0000-0000-0000-000000000001", title: "DREAMER", description: "Khóa học IELTS dành cho người mới bắt đầu (Band 3.0 - 4.0)", level: "3.0 - 4.0", slug: "dreamer", is_published: true, is_active: true },
  { id: "c1000000-0000-0000-0000-000000000002", title: "BUILDER", description: "Khóa học IELTS Xây dựng nền tảng (Band 4.0 - 5.0)", level: "4.0 - 5.0", slug: "builder", is_published: true, is_active: true },
  { id: "c1000000-0000-0000-0000-000000000003", title: "MASTER", description: "Khóa học IELTS Chuyên sâu bứt phá (Band 5.0 - 6.0+)", level: "5.0 - 6.0+", slug: "master", is_published: true, is_active: true },
  { id: "c1000000-0000-0000-0000-000000000004", title: "PLACEMENT TEST", description: "Bài thi kiểm tra trình độ đầu vào IELTS", level: "All Levels", slug: "placement-test", is_published: true, is_active: true },
  { id: "c1000000-0000-0000-0000-000000000005", title: "LUYỆN THI TN THPT", description: "Bộ đề luyện thi tốt nghiệp Trung học Phổ thông", level: "Lớp 12", slug: "luyen-thi-tn-thpt", is_published: true, is_active: true },
  { id: "c1000000-0000-0000-0000-000000000006", title: "ENTRANCE TEST THPTQG", description: "Bài test đánh giá năng lực THPTQG", level: "Lớp 12", slug: "entrance-test-thptqg", is_published: true, is_active: true },
  { id: "c1000000-0000-0000-0000-000000000007", title: "STARTER", description: "Nền tảng Tiếng Anh căn bản", level: "Beginner", slug: "starter", is_published: true, is_active: true },
  { id: "c1000000-0000-0000-0000-000000000008", title: "LEADER", description: "Bứt phá kỹ năng Luyện nói & Viết IELTS", level: "Intermediate", slug: "leader", is_published: true, is_active: true },
  { id: "c1000000-0000-0000-0000-000000000009", title: "EXTRA LISTENING", description: "Luyện phản xạ và kỹ năng nghe chuyên sâu", level: "All Levels", slug: "extra-listening", is_published: true, is_active: true }
];

async function seed() {
  console.log("🚀 Seeding 9 Courses to Supabase...");
  for (const c of COURSES) {
    const { data, error } = await supabase.from("courses").upsert(c, { onConflict: "id" });
    if (error) {
      console.error(`❌ Fail ${c.title}:`, error.message);
    } else {
      console.log(`✅ Success: ${c.title}`);
    }
  }

  // Link any unassigned exams to DREAMER course
  const dreamerId = COURSES[0].id;
  const { data: exams, error: examErr } = await supabase.from("exams").select("id, course_id").is("course_id", null);
  if (exams && exams.length > 0) {
    console.log(`🔗 Linking ${exams.length} orphan exams to DREAMER course...`);
    for (const e of exams) {
      await supabase.from("exams").update({ course_id: dreamerId }).eq("id", e.id);
    }
  }
  console.log("🎉 Seeding complete!");
}

seed();
