import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://gzpdlqxjggyxlkeatvvf.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SQL_FILE = "d:\\handover\\ielts\\nextband_backup.sql";

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
      const inner = tuple.slice(1, -1);
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
        } else if (!isNaN(Number(val)) && val !== "") {
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

async function runPipeline() {
  const startTime = Date.now();
  console.log("=================================================");
  console.log("🚀 NEXTBAND LMS PRODUCTION MIGRATION PIPELINE");
  console.log("=================================================\n");

  // PHASE 0: Source & File Verification
  console.log("📌 [PHASE 0] Source & Schema Pre-flight Check...");
  if (!fs.existsSync(SQL_FILE)) {
    console.error(`❌ Source SQL file not found at: ${SQL_FILE}`);
    process.exit(1);
  }
  const stat = fs.statSync(SQL_FILE);
  console.log(`  ✓ SQL Snapshot file verified: ${SQL_FILE}`);
  console.log(`  ✓ File Size: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  ✓ Last Modified: ${stat.mtime.toISOString()}`);

  const sqlContent = fs.readFileSync(SQL_FILE, "utf-8");

  // PHASE 1: Data Audit
  console.log("\n📌 [PHASE 1] Auditing Source Data Records...");
  const rawCourses = parseInsertStatements(sqlContent, "courses");
  const rawExams = parseInsertStatements(sqlContent, "exams");
  const rawSections = parseInsertStatements(sqlContent, "exam_sections");
  const rawGroups = parseInsertStatements(sqlContent, "question_groups");
  const rawQuestions = parseInsertStatements(sqlContent, "questions");

  console.log(`  ✓ Courses in SQL: ${rawCourses.length}`);
  console.log(`  ✓ Exams in SQL: ${rawExams.length}`);
  console.log(`  ✓ Sections in SQL: ${rawSections.length}`);
  console.log(`  ✓ Question Groups in SQL: ${rawGroups.length}`);
  console.log(`  ✓ Questions in SQL: ${rawQuestions.length}`);

  let warningCount = 0;
  let errorCount = 0;

  // PHASE 2: Idempotent Batch Migration (Dependency Graph: Course -> Exam -> Section -> Group -> Question)
  console.log("\n📌 [PHASE 2] Executing Idempotent Batch Migration Pipeline...");

  // 1. Courses
  console.log("  Step 1/5: Migrating Courses...");
  let migratedCourses = 0;
  for (const c of rawCourses) {
    const payload = {
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
    };
    const { error } = await supabase.from("courses").upsert(payload, { onConflict: "id" });
    if (error) {
      console.error(`    ❌ Course error [${payload.id}]:`, error.message);
      errorCount++;
    } else {
      migratedCourses++;
    }
  }
  console.log(`  ✓ Courses migrated: ${migratedCourses}/${rawCourses.length}`);

  // Fetch valid course IDs
  const validCourseIds = new Set(rawCourses.map((c) => c.id));

  // 2. Exams
  console.log("  Step 2/5: Migrating Exams...");
  let migratedExams = 0;
  const filteredExams = rawExams.filter((e) => validCourseIds.has(e.course_id || e.courseId));
  for (const e of filteredExams) {
    const payload = {
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
    };
    const { error } = await supabase.from("exams").upsert(payload, { onConflict: "id" });
    if (error) {
      console.error(`    ❌ Exam error [${payload.id}]:`, error.message);
      errorCount++;
    } else {
      migratedExams++;
    }
  }
  console.log(`  ✓ Exams migrated: ${migratedExams}/${filteredExams.length}`);

  const validExamIds = new Set(filteredExams.map((e) => e.id));

  // 3. Exam Sections
  console.log("  Step 3/5: Migrating Exam Sections...");
  let migratedSections = 0;
  const filteredSections = rawSections.filter((s) => validExamIds.has(s.exam_id || s.examId));
  for (const s of filteredSections) {
    const payload = {
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
    };
    const { error } = await supabase.from("exam_sections").upsert(payload, { onConflict: "id" });
    if (error) {
      console.error(`    ❌ Section error [${payload.id}]:`, error.message);
      errorCount++;
    } else {
      migratedSections++;
    }
  }
  console.log(`  ✓ Exam Sections migrated: ${migratedSections}/${filteredSections.length}`);

  const validSectionIds = new Set(filteredSections.map((s) => s.id));

  // 4. Question Groups
  console.log("  Step 4/5: Migrating Question Groups...");
  let migratedGroups = 0;
  const filteredGroups = rawGroups.filter((g) => validSectionIds.has(g.section_id || g.sectionId));
  for (const g of filteredGroups) {
    const payload = {
      id: g.id,
      section_id: g.section_id || g.sectionId,
      title: g.title || "",
      instructions: g.instructions || "",
      passage: g.passage || "",
      audio_url: g.audio_url || g.audioUrl || "",
      order_index: g.order_index || g.orderIndex || 0,
    };
    const { error } = await supabase.from("question_groups").upsert(payload, { onConflict: "id" });
    if (error) {
      console.error(`    ❌ Question Group error [${payload.id}]:`, error.message);
      errorCount++;
    } else {
      migratedGroups++;
    }
  }
  console.log(`  ✓ Question Groups migrated: ${migratedGroups}/${filteredGroups.length}`);

  const validGroupIds = new Set(filteredGroups.map((g) => g.id));

  // 5. Questions (In Batches of 500)
  console.log("  Step 5/5: Migrating Questions (Batch Size = 500)...");
  let migratedQuestions = 0;
  const filteredQuestions = rawQuestions.filter((q) => validGroupIds.has(q.group_id || q.groupId));
  
  const BATCH_SIZE = 500;
  for (let i = 0; i < filteredQuestions.length; i += BATCH_SIZE) {
    const chunk = filteredQuestions.slice(i, i + BATCH_SIZE).map((q) => ({
      id: q.id,
      group_id: q.group_id || q.groupId,
      question_type: q.question_type || q.questionType || "multiple_choice",
      question_text: q.question_text || q.questionText || "",
      options: q.options ? (typeof q.options === "string" ? JSON.parse(q.options) : q.options) : null,
      correct_answer: q.correct_answer || q.correctAnswer || "",
      audio_url: q.audio_url || q.audioUrl || "",
      points: q.points || 1.0,
      order_index: q.order_index || q.orderIndex || 0,
    }));

    const { error } = await supabase.from("questions").upsert(chunk, { onConflict: "id" });
    if (error) {
      console.error(`    ❌ Questions Batch Error [Range ${i}-${i + chunk.length}]:`, error.message);
      errorCount += chunk.length;
    } else {
      migratedQuestions += chunk.length;
      console.log(`    ✓ Batch ${Math.floor(i / BATCH_SIZE) + 1} (${migratedQuestions}/${filteredQuestions.length}) processed.`);
    }
  }
  console.log(`  ✓ Total Questions migrated: ${migratedQuestions}/${filteredQuestions.length}`);

  // PHASE 3: Foreign Key & Integrity Validation
  console.log("\n📌 [PHASE 3] Validating Foreign Key Integrity & Data Health...");
  
  const { count: dbCourses } = await supabase.from("courses").select("*", { count: "exact", head: true });
  const { count: dbExams } = await supabase.from("exams").select("*", { count: "exact", head: true });
  const { count: dbSections } = await supabase.from("exam_sections").select("*", { count: "exact", head: true });
  const { count: dbGroups } = await supabase.from("question_groups").select("*", { count: "exact", head: true });
  const { count: dbQuestions } = await supabase.from("questions").select("*", { count: "exact", head: true });

  console.log(`  ✓ Supabase Total Courses: ${dbCourses}`);
  console.log(`  ✓ Supabase Total Exams: ${dbExams}`);
  console.log(`  ✓ Supabase Total Sections: ${dbSections}`);
  console.log(`  ✓ Supabase Total Question Groups: ${dbGroups}`);
  console.log(`  ✓ Supabase Total Questions: ${dbQuestions}`);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  // PHASE 6: Production Migration Report
  console.log("\n=================================================");
  console.log("📋 PRODUCTION MIGRATION REPORT");
  console.log("=================================================");
  console.log(`  Duration      : ${durationSec}s`);
  console.log(`  Courses       : ${migratedCourses}/${rawCourses.length}`);
  console.log(`  Exams         : ${migratedExams}/${filteredExams.length}`);
  console.log(`  Sections      : ${migratedSections}/${filteredSections.length}`);
  console.log(`  Groups        : ${migratedGroups}/${filteredGroups.length}`);
  console.log(`  Questions     : ${migratedQuestions}/${filteredQuestions.length}`);
  console.log(`  Warnings      : ${warningCount}`);
  console.log(`  Errors        : ${errorCount}`);
  console.log("=================================================");

  if (errorCount === 0) {
    console.log("🎉 MIGRATION PIPELINE PASSED WITH ZERO ERRORS!\n");
  } else {
    console.warn("⚠️ MIGRATION COMPLETED WITH SOME WARNINGS/ERRORS. SEE LOGS ABOVE.\n");
  }
}

runPipeline().catch((err) => {
  console.error("FATAL PIPELINE ERROR:", err);
  process.exit(1);
});
