import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://gzpdlqxjggyxlkeatvvf.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

const SQL_FILE_PATH = path.join(process.cwd(), "..", "nextband_backup.sql");

interface SQLInsertRecord {
  table: string;
  values: string[];
}

function parseSQLInserts(sqlContent: string, tableName: string): any[] {
  const records: any[] = [];
  const regex = new RegExp(`INSERT INTO \`${tableName}\` VALUES\\s*(.*?);`, "gs");
  let match;

  while ((match = regex.exec(sqlContent)) !== null) {
    const rawValues = match[1];
    // Split rows: (row1), (row2)
    const rowRegex = /\((.*?)\)(?:,|\s*$)/gs;
    let rowMatch;
    
    // We process line by line or custom parser
    const tuples = parseTuples(rawValues);
    records.push(...tuples);
  }

  return records;
}

// Simple SQL tuple parser for MySQL dump
function parseTuples(rawString: string): any[][] {
  const results: any[][] = [];
  let currentTuple: any[] = [];
  let currentVal = "";
  let inQuotes = false;
  let quoteChar = "";
  let inTuple = false;
  let escaped = false;

  for (let i = 0; i < rawString.length; i++) {
    const char = rawString[i];

    if (escaped) {
      currentVal += char;
      escaped = false;
      continue;
    }

    if (char === "\\" && inQuotes) {
      escaped = true;
      continue;
    }

    if (!inTuple) {
      if (char === "(") {
        inTuple = true;
        currentTuple = [];
        currentVal = "";
      }
      continue;
    }

    if (inQuotes) {
      if (char === quoteChar) {
        inQuotes = false;
      } else {
        currentVal += char;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      inQuotes = true;
      quoteChar = char;
      continue;
    }

    if (char === ",") {
      currentTuple.push(cleanVal(currentVal));
      currentVal = "";
      continue;
    }

    if (char === ")") {
      currentTuple.push(cleanVal(currentVal));
      results.push(currentTuple);
      inTuple = false;
      currentVal = "";
      continue;
    }

    currentVal += char;
  }

  return results;
}

function cleanVal(val: string): any {
  val = val.trim();
  if (val === "NULL") return null;
  if (val === "1" || val === "true") return true;
  if (val === "0" || val === "false") return false;
  if (!isNaN(Number(val)) && val !== "") return Number(val);
  return val;
}

async function migrate() {
  console.log("🚀 Starting Data Migration Engine...");

  if (!fs.existsSync(SQL_FILE_PATH)) {
    console.error(`❌ Backup SQL file not found at: ${SQL_FILE_PATH}`);
    process.exit(1);
  }

  console.log("📖 Reading nextband_backup.sql...");
  const sqlContent = fs.readFileSync(SQL_FILE_PATH, "utf-8");

  // 1. Migrate Courses
  console.log("\n📦 1/4 Processing Courses...");
  const rawCourses = parseSQLInserts(sqlContent, "courses");
  const coursesToImport = rawCourses
    .map((row) => ({
      id: row[0],
      title: row[1],
      description: row[2],
      thumbnail_url: row[3],
      level: row[4] || "beginner",
      price: row[6] ? Number(row[6]) : 0,
      is_published: Boolean(row[7]),
      is_active: Boolean(row[8]),
      slug: row[10] || row[0],
      is_locked: Boolean(row[13]),
    }))
    .filter(
      (c) =>
        c.title &&
        !c.title.toLowerCase().startsWith("test") &&
        c.title !== "TESTING" &&
        c.title !== "TESTING "
    );

  console.log(`Found ${coursesToImport.length} valid courses. Uploading to Supabase...`);
  for (const course of coursesToImport) {
    const { error } = await supabase.from("courses").upsert(course, { onConflict: "id" });
    if (error) {
      console.error(`  ❌ Error inserting course "${course.title}":`, error.message);
    } else {
      console.log(`  ✅ Course: ${course.title}`);
    }
  }

  // 2. Migrate Exams
  console.log("\n📝 2/4 Processing Exams...");
  const rawExams = parseSQLInserts(sqlContent, "exams");
  const validCourseIds = new Set(coursesToImport.map((c) => c.id));
  const examsToImport = rawExams
    .map((row) => ({
      id: row[0],
      course_id: row[1],
      title: row[2],
      description: row[3],
      week: Number(row[4]) || 1,
      duration_minutes: Number(row[5]) || 60,
      is_published: Boolean(row[6]),
      is_active: Boolean(row[7]),
      is_locked: Boolean(row[8]),
      is_open: Boolean(row[9]),
      exam_type: row[12] || "ielts",
    }))
    .filter((e) => validCourseIds.has(e.course_id));

  console.log(`Found ${examsToImport.length} valid exams. Uploading to Supabase...`);
  for (const exam of examsToImport) {
    const { error } = await supabase.from("exams").upsert(exam, { onConflict: "id" });
    if (error) {
      console.error(`  ❌ Error inserting exam "${exam.title}":`, error.message);
    } else {
      console.log(`  ✅ Exam: ${exam.title} (Week ${exam.week})`);
    }
  }

  // 3. Migrate Exam Sections
  console.log("\n🧩 3/4 Processing Exam Sections...");
  const rawSections = parseSQLInserts(sqlContent, "exam_sections");
  const validExamIds = new Set(examsToImport.map((e) => e.id));
  const sectionsToImport = rawSections
    .map((row) => ({
      id: row[0],
      exam_id: row[1],
      section_type: row[2],
      title: row[3],
      instructions: row[4],
      audio_url: row[6],
      order_index: Number(row[8]) || 0,
      audio_script: row[10] || null,
    }))
    .filter((s) => validExamIds.has(s.exam_id));

  console.log(`Found ${sectionsToImport.length} valid sections. Uploading...`);
  for (const sec of sectionsToImport) {
    const { error } = await supabase.from("exam_sections").upsert(sec, { onConflict: "id" });
    if (error) {
      console.error(`  ❌ Error section "${sec.title}":`, error.message);
    }
  }
  console.log(`  ✅ Inserted ${sectionsToImport.length} sections.`);

  console.log("\n🎉 Migration completed successfully!");
}

migrate().catch(console.error);
