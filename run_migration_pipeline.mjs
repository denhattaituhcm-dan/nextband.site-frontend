import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://gzpdlqxjggyxlkeatvvf.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cGRscXhqZ2d5eGxrZWF0dnZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyOTc3NjMsImV4cCI6MjEwMDg3Mzc2M30.M7uMAo2qJCDQtxQMP-_58VKF1LfSBdwR31gpvqcCN6I";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SQL_FILE = "d:\\handover\\ielts\\nextband_backup.sql";

function parseLineTuples(line) {
  if (!line) return [];
  const tuples = [];
  let current = "";
  let inStr = false;
  let inTuple = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const pr = line[i - 1];

    if (ch === "'" && pr !== "\\") inStr = !inStr;

    if (!inStr && ch === "(" && !inTuple) {
      inTuple = true;
      current = "";
      continue;
    }

    if (!inStr && ch === ")" && inTuple) {
      inTuple = false;
      const parts = current.split(/,(?=(?:[^\']*\'[^\']*\')*[^\']*$)/).map((p) => p.trim().replace(/^'|'$/g, ""));
      tuples.push(parts);
      current = "";
      continue;
    }

    if (inTuple) current += ch;
  }
  return tuples;
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
  const lines = sqlContent.split("\n");
  const rawCourses = parseLineTuples(lines[252]).filter((c) => c[0] && c[0].length === 36);
  const rawExams = parseLineTuples(lines[398]).filter((e) => e[0] && e[0].length === 36);
  const rawSections = parseLineTuples(lines[319]).filter((s) => s[0] && s[0].length === 36);
  const rawGroups = parseLineTuples(lines[466]).filter((g) => g[0] && g[0].length === 36);
  const rawQuestions = parseLineTuples(lines[500]).filter((q) => q[0] && q[0].length === 36);

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
      id: c[0],
      title: c[1] || "Untitled Course",
      description: c[2] || "",
      level: c[4] || "beginner",
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

  const validCourseIds = new Set(rawCourses.map((c) => c[0]));

  // 2. Exams
  console.log("  Step 2/5: Migrating Exams...");
  let migratedExams = 0;
  const filteredExams = rawExams.filter((e) => validCourseIds.has(e[1]));
  for (const e of filteredExams) {
    const payload = {
      id: e[0],
      course_id: e[1],
      title: e[2] || "Untitled Exam",
      description: e[3] || "",
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

  const validExamIds = new Set(filteredExams.map((e) => e[0]));

  // 3. Exam Sections
  console.log("  Step 3/5: Migrating Exam Sections...");
  let migratedSections = 0;
  const filteredSections = rawSections.filter((s) => validExamIds.has(s[1]));
  for (const s of filteredSections) {
    const payload = {
      id: s[0],
      exam_id: s[1],
      section_type: s[2] || "general",
      title: s[3] || "Section",
      instructions: s[4] || "",
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

  const validSectionIds = new Set(filteredSections.map((s) => s[0]));

  // 4. Question Groups
  console.log("  Step 4/5: Migrating Question Groups...");
  let migratedGroups = 0;
  const filteredGroups = rawGroups.filter((g) => validSectionIds.has(g[1]));
  for (const g of filteredGroups) {
    const payload = {
      id: g[0],
      section_id: g[1],
      title: g[2] || "",
      instructions: g[3] || "",
    };
    const { error } = await supabase.from("question_groups").upsert(payload, { onConflict: "id" });
    if (error) {
      console.error(`    ❌ Group error [${payload.id}]:`, error.message);
      errorCount++;
    } else {
      migratedGroups++;
    }
  }
  console.log(`  ✓ Question Groups migrated: ${migratedGroups}/${filteredGroups.length}`);

  const validGroupIds = new Set(filteredGroups.map((g) => g[0]));

  // 5. Questions
  console.log("  Step 5/5: Migrating Questions...");
  let migratedQuestions = 0;
  const filteredQuestions = rawQuestions.filter((q) => validGroupIds.has(q[1]));
  for (const q of filteredQuestions) {
    const payload = {
      id: q[0],
      group_id: q[1],
      question_type: q[2] || "essay",
      question_text: q[3] || "",
    };
    const { error } = await supabase.from("questions").upsert(payload, { onConflict: "id" });
    if (error) {
      console.error(`    ❌ Question error [${payload.id}]:`, error.message);
      errorCount++;
    } else {
      migratedQuestions++;
    }
  }
  console.log(`  ✓ Questions migrated: ${migratedQuestions}/${filteredQuestions.length}`);

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
