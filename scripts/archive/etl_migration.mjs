import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://gzpdlqxjggyxlkeatvvf.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const SQL_FILE = process.env.SQL_FILE_PATH || "./nextband_backup.sql";

function parseInsertStatements(sqlContent, tableName) {
  const regex = new RegExp(`INSERT INTO \`?${tableName}\`?\\s*\\(([^)]+)\\)\\s*VALUES\\s*(.+?);`, "gis");
  const matches = [...sqlContent.matchAll(regex)];
  
  if (matches.length === 0) return [];

  const records = [];
  for (const match of matches) {
    const columns = match[1].split(",").map((c) => c.trim().replace(/`/g, ""));
    const rawValues = match[2];
    
    // Parse tuples: (val1, val2, ...), (val1, val2, ...)
    const valueTuples = rawValues.match(/\((?:[^()']|'[^']*')*\)/g);
    if (!valueTuples) continue;

    for (const tuple of valueTuples) {
      // Clean leading and trailing parentheses
      const inner = tuple.slice(1, -1);
      // Split by comma ignoring commas inside quotes
      const values = [];
      let current = "";
      let inString = false;
      let quoteChar = "";

      for (let i = 0; i < inner.length; i++) {
        const char = inner[i];
        if ((char === "'" || char === '"') && (i === 0 || inner[i - 1] !== "\\")) {
          if (!inString) {
            inString = true;
            quoteChar = char;
          } else if (char === quoteChar) {
            inString = false;
          } else {
            current += char;
          }
        } else if (char === "," && !inString) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const obj = {};
      columns.forEach((col, idx) => {
        let val = values[idx];
        if (val === undefined || val === "NULL" || val === "null") {
          obj[col] = null;
        } else if (val.startsWith("'") && val.endsWith("'")) {
          obj[col] = val.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, "\\");
        } else if (val === "true" || val === "1") {
          obj[col] = true;
        } else if (val === "false" || val === "0") {
          obj[col] = false;
        } else if (!isNaN(Number(val))) {
          obj[col] = Number(val);
        } else {
          obj[col] = val;
        }
      });
      records.push(obj);
    }
  }

  return records;
}

async function main() {
  console.log("🚀 Starting ETL Data Migration from nextband_backup.sql to Supabase...");

  if (!fs.existsSync(SQL_FILE)) {
    console.error(`❌ File not found: ${SQL_FILE}`);
    return;
  }

  const sqlContent = fs.readFileSync(SQL_FILE, "utf-8");
  console.log(`📄 Read SQL File: ${Math.round(sqlContent.length / 1024)} KB`);

  // 1. Migrate Courses
  let rawCourses = parseInsertStatements(sqlContent, "courses") || parseInsertStatements(sqlContent, "Course");
  if (!rawCourses || rawCourses.length === 0) {
    console.log("ℹ️ No courses found in SQL dump, creating 9 core IELTS courses...");
    rawCourses = [
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
  }
  console.log(`\n📚 Found ${rawCourses.length} Courses to import`);
  let courseCount = 0;
  for (const c of rawCourses) {
    const { error } = await supabase.from("courses").upsert({
      id: c.id,
      title: c.title || c.name || "Untitled Course",
      description: c.description || "",
      thumbnail_url: c.thumbnail_url || c.thumbnailUrl || "",
      level: c.level || "Beginner",
      price: c.price || 0,
      is_published: c.is_published ?? c.isPublished ?? true,
      is_active: c.is_active ?? c.isActive ?? true,
      is_locked: c.is_locked ?? c.isLocked ?? false,
      slug: c.slug || (c.title ? c.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") : `course-${c.id}`),
    }, { onConflict: "id" });

    if (!error) courseCount++;
    else console.error(`❌ Course error: ${c.title}`, error.message);
  }
  console.log(`✅ Migrated Courses: ${courseCount}/${rawCourses.length}`);

  // 2. Migrate Exams
  const rawExams = parseInsertStatements(sqlContent, "exams") || parseInsertStatements(sqlContent, "Exam");
  console.log(`\n📝 Found ${rawExams.length} Exams/Lessons in SQL`);
  let examCount = 0;
  for (const e of rawExams) {
    const { error } = await supabase.from("exams").upsert({
      id: e.id,
      course_id: e.course_id || e.courseId,
      title: e.title || "Untitled Exam",
      description: e.description || "",
      week: e.week || 1,
      duration_minutes: e.duration_minutes || e.durationMinutes || 60,
      is_published: e.is_published ?? e.isPublished ?? true,
      is_active: e.is_active ?? e.isActive ?? true,
      is_locked: e.is_locked ?? e.isLocked ?? false,
      is_open: e.is_open ?? e.isOpen ?? false,
      max_participants: e.max_participants || e.maxParticipants || null,
      current_participants: e.current_participants || e.currentParticipants || 0,
      exam_type: e.exam_type || e.examType || "homework",
    }, { onConflict: "id" });

    if (!error) examCount++;
    else console.error(`❌ Exam error: ${e.title}`, error.message);
  }
  console.log(`✅ Migrated Exams: ${examCount}/${rawExams.length}`);

  // 3. Migrate Exam Sections
  const rawSections = parseInsertStatements(sqlContent, "exam_sections") || parseInsertStatements(sqlContent, "ExamSection");
  console.log(`\n🧩 Found ${rawSections.length} Exam Sections in SQL`);
  let sectionCount = 0;
  for (const s of rawSections) {
    const { error } = await supabase.from("exam_sections").upsert({
      id: s.id,
      exam_id: s.exam_id || s.examId,
      section_type: s.section_type || s.sectionType || "general",
      title: s.title || "Section",
      instructions: s.instructions || "",
      content: s.content ? (typeof s.content === "string" ? JSON.parse(s.content) : s.content) : null,
      audio_url: s.audio_url || s.audioUrl || "",
      audio_script: s.audio_script || s.audioScript || "",
      duration_minutes: s.duration_minutes || s.durationMinutes || 15,
      order_index: s.order_index || s.orderIndex || 0,
    }, { onConflict: "id" });

    if (!error) sectionCount++;
    else console.error(`❌ Section error: ${s.title}`, error.message);
  }
  console.log(`✅ Migrated Sections: ${sectionCount}/${rawSections.length}`);

  // 4. Migrate Question Groups
  const rawGroups = parseInsertStatements(sqlContent, "question_groups") || parseInsertStatements(sqlContent, "QuestionGroup");
  console.log(`\n📦 Found ${rawGroups.length} Question Groups in SQL`);
  let groupCount = 0;
  for (const g of rawGroups) {
    const { error } = await supabase.from("question_groups").upsert({
      id: g.id,
      section_id: g.section_id || g.sectionId,
      title: g.title || "",
      instructions: g.instructions || "",
      passage: g.passage || "",
      audio_url: g.audio_url || g.audioUrl || "",
      order_index: g.order_index || g.orderIndex || 0,
    }, { onConflict: "id" });

    if (!error) groupCount++;
    else console.error(`❌ QuestionGroup error: ${g.id}`, error.message);
  }
  console.log(`✅ Migrated Question Groups: ${groupCount}/${rawGroups.length}`);

  // 5. Migrate Questions
  const rawQuestions = parseInsertStatements(sqlContent, "questions") || parseInsertStatements(sqlContent, "Question");
  console.log(`\n❓ Found ${rawQuestions.length} Questions in SQL`);
  let questionCount = 0;
  for (const q of rawQuestions) {
    const { error } = await supabase.from("questions").upsert({
      id: q.id,
      group_id: q.group_id || q.groupId,
      question_type: q.question_type || q.questionType || "multiple_choice",
      question_text: q.question_text || q.questionText || "",
      options: q.options ? (typeof q.options === "string" ? JSON.parse(q.options) : q.options) : null,
      correct_answer: q.correct_answer || q.correctAnswer || "",
      audio_url: q.audio_url || q.audioUrl || "",
      points: q.points || 1.0,
      order_index: q.order_index || q.orderIndex || 0,
    }, { onConflict: "id" });

    if (!error) questionCount++;
    else console.error(`❌ Question error: ${q.id}`, error.message);
  }
  console.log(`✅ Migrated Questions: ${questionCount}/${rawQuestions.length}`);

  console.log("\n=======================================================");
  console.log("🎉 ETL CONTENT MIGRATION COMPLETED SUCCESSFULLY!");
  console.log(`📊 Summary:`);
  console.log(`   - Courses: ${courseCount}/${rawCourses.length}`);
  console.log(`   - Exams/Lessons: ${examCount}/${rawExams.length}`);
  console.log(`   - Sections: ${sectionCount}/${rawSections.length}`);
  console.log(`   - Question Groups: ${groupCount}/${rawGroups.length}`);
  console.log(`   - Questions: ${questionCount}/${rawQuestions.length}`);
  console.log("=======================================================");
}

main();
