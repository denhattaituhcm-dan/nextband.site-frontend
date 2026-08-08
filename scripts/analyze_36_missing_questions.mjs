/**
 * READ-ONLY VERIFICATION SCRIPT FOR 36 MISSING SOURCE QUESTIONS
 * Analyzes historical answers and parent hierarchy for the 36 missing questions.
 * 
 * Rules:
 * - Strictly READ-ONLY
 * - NO database mutations (0 INSERT, 0 UPDATE, 0 DELETE, 0 DDL)
 * - NO migration SQL generated
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://gzpdlqxjggyxlkeatvvf.supabase.co";
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cGRscXhqZ2d5eGxrZWF0dnZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyOTc3NjMsImV4cCI6MjEwMDg3Mzc2M30.M7uMAo2qJCDQtxQMP-_58VKF1LfSBdwR31gpvqcCN6I";

const supabase = createClient(supabaseUrl, supabaseKey);
const SQL_FILE_PATH = path.join(process.cwd(), "..", "nextband_backup.sql");
const ORPHAN_CSV_PATH = path.join(process.cwd(), "03_orphan_records.csv");

function cleanVal(val) {
  if (val === undefined || val === null) return null;
  val = val.trim();
  if (val === "NULL") return null;
  return val;
}

function parseSQLInserts(sqlContent, tableName) {
  const records = [];
  const lines = sqlContent.split("\n");
  const prefix = `INSERT INTO \`${tableName}\` VALUES`;

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith(prefix)) {
      let raw = line.slice(prefix.length).trim();
      if (raw.endsWith(";")) raw = raw.slice(0, -1);

      let i = 0;
      while (i < raw.length) {
        if (raw[i] !== "(") {
          i++;
          continue;
        }

        i++; // skip '('
        const fields = [];
        let currentField = "";
        let inString = false;
        let quoteChar = "";

        while (i < raw.length) {
          const char = raw[i];

          if (inString) {
            if (char === "\\") {
              currentField += raw[i + 1] || "";
              i += 2;
              continue;
            }
            if (char === quoteChar) {
              inString = false;
              i++;
              continue;
            }
            currentField += char;
            i++;
            continue;
          }

          if (char === "'" || char === '"') {
            inString = true;
            quoteChar = char;
            i++;
            continue;
          }

          if (char === ",") {
            fields.push(cleanVal(currentField));
            currentField = "";
            i++;
            continue;
          }

          if (char === ")") {
            fields.push(cleanVal(currentField));
            records.push(fields);
            currentField = "";
            i++;
            break;
          }

          currentField += char;
          i++;
        }
      }
    }
  }

  return records;
}

async function runAnalysis36() {
  console.log("🔍 Running READ-ONLY Analysis for 36 Missing Questions...\n");

  const sqlContent = fs.readFileSync(SQL_FILE_PATH, "utf-8");

  // Parse questions, groups, sections from VPS backup
  const rawQuestions = parseSQLInserts(sqlContent, "questions");
  const rawGroups = parseSQLInserts(sqlContent, "question_groups");
  const rawSections = parseSQLInserts(sqlContent, "exam_sections");
  const rawAnswers = parseSQLInserts(sqlContent, "answers");

  // Build lookup maps for hierarchy
  const groupToSectionMap = new Map();
  rawGroups.forEach((g) => groupToSectionMap.set(g[0], g[1])); // g[0] is group_id, g[1] is section_id

  const sectionToExamMap = new Map();
  rawSections.forEach((s) => sectionToExamMap.set(s[0], s[1])); // s[0] is section_id, s[1] is exam_id

  // Build answer counts per question_id from backup
  const answersPerQuestion = new Map();
  rawAnswers.forEach((a) => {
    const qId = a[2]; // question_id
    if (qId) {
      answersPerQuestion.set(qId, (answersPerQuestion.get(qId) || 0) + 1);
    }
  });

  // Read 208 orphan group IDs from 03_orphan_records.csv
  const orphanGroupIds = new Set();
  if (fs.existsSync(ORPHAN_CSV_PATH)) {
    const csvContent = fs.readFileSync(ORPHAN_CSV_PATH, "utf-8");
    csvContent
      .split("\n")
      .slice(1)
      .forEach((line) => {
        const parts = line.split(",");
        if (parts[1]) orphanGroupIds.add(parts[1].trim());
      });
  }

  // Fetch all question IDs currently in Supabase target
  const { data: supabaseQuestions } = await supabase.from("questions").select("id");
  const supabaseQuestionIdsSet = new Set((supabaseQuestions || []).map((q) => q.id));

  // Identify the 36 missing questions
  const missingQuestions = rawQuestions.filter((q) => !supabaseQuestionIdsSet.has(q[0]));

  console.log(`  • Observed Missing Questions Count: ${missingQuestions.length}`);

  let belongsToOrphanCount = 0;
  let withHistoricalAnswersCount = 0;
  let totalAnswersFor36 = 0;
  let safeNewRowRequiredCount = 0;
  let protectedNewRowRequiredCount = 0;
  let unresolvedCount = 0;

  const analysisRows = [];

  for (const q of missingQuestions) {
    const qId = q[0];
    const gId = q[1];
    const sId = groupToSectionMap.get(gId) || "UNKNOWN";
    const eId = sectionToExamMap.get(sId) || "UNKNOWN";
    const ansCount = answersPerQuestion.get(qId) || 0;
    const isOrphanGroup = orphanGroupIds.has(gId);

    if (isOrphanGroup) belongsToOrphanCount++;
    if (ansCount > 0) {
      withHistoricalAnswersCount++;
      totalAnswersFor36 += ansCount;
    }

    let recAction = "SAFE_NEW_ROW_REQUIRED";
    if (ansCount > 0) {
      recAction = "PROTECTED_NEW_ROW_REQUIRED";
      protectedNewRowRequiredCount++;
    } else {
      safeNewRowRequiredCount++;
    }

    analysisRows.push({
      source_question_id: qId,
      source_group_id: gId,
      source_section_id: sId,
      source_exam_id: eId,
      historical_answer_count: ansCount,
      target_question_exists: false,
      recommended_action: recAction,
    });
  }

  // Generate CSV artifact
  const csvHeaders = "source_question_id,source_group_id,source_section_id,source_exam_id,historical_answer_count,target_question_exists,recommended_action";
  const csvRows = analysisRows.map(
    (r) => `${r.source_question_id},${r.source_group_id},${r.source_section_id},${r.source_exam_id},${r.historical_answer_count},${r.target_question_exists},${r.recommended_action}`
  );

  const csvPath = path.join(process.cwd(), "scripts", "pipeline", "missing_36_questions_audit.csv");
  fs.mkdirSync(path.dirname(csvPath), { recursive: true });
  fs.writeFileSync(csvPath, [csvHeaders, ...csvRows].join("\n"), "utf-8");

  console.log("==========================================================================");
  console.log("📊 36 MISSING QUESTIONS AUDIT SUMMARY");
  console.log("==========================================================================");
  console.log(`Total Missing Questions Analyzed:                ${missingQuestions.length}`);
  console.log(`Questions Belonging to Orphan Groups:            ${belongsToOrphanCount} / 36 (${Math.round(belongsToOrphanCount/36*100)}%)`);
  console.log(`Questions with Historical Answers:              ${withHistoricalAnswersCount}`);
  console.log(`Total Answers Referencing Missing Questions:     ${totalAnswersFor36}`);
  console.log(`SAFE_NEW_ROW_REQUIRED (0 Historical Answers):    ${safeNewRowRequiredCount}`);
  console.log(`PROTECTED_NEW_ROW_REQUIRED (Has Student Answers): ${protectedNewRowRequiredCount}`);
  console.log(`UNRESOLVED Questions:                            ${unresolvedCount}`);
  console.log("==========================================================================\n");
}

runAnalysis36().catch((err) => {
  console.error("❌ Error in 36 questions analysis:", err.message);
  process.exit(1);
});
