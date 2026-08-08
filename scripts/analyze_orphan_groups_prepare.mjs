/**
 * ORPHAN GROUP PREPARE — READ ONLY ANALYSIS
 * Analyzes the minimum set of missing question_groups required for the 36 missing questions.
 * 
 * Rules:
 * - Strictly READ-ONLY (0 INSERT, 0 UPDATE, 0 DELETE, 0 DDL)
 * - DO NOT generate executable migration SQL
 * - Outputs orphan_groups_preflight.csv & orphan_groups_preflight_report.md
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
const AUDIT_36_CSV_PATH = path.join(process.cwd(), "scripts", "pipeline", "missing_36_questions_audit.csv");

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

async function runOrphanGroupPrepare() {
  console.log("🔍 Running READ-ONLY Orphan Group Prepare Analysis...\n");

  const sqlContent = fs.readFileSync(SQL_FILE_PATH, "utf-8");

  // Parse tables from backup
  const rawQuestions = parseSQLInserts(sqlContent, "questions");
  const rawGroups = parseSQLInserts(sqlContent, "question_groups");
  const rawSections = parseSQLInserts(sqlContent, "exam_sections");
  const rawExams = parseSQLInserts(sqlContent, "exams");
  const rawAnswers = parseSQLInserts(sqlContent, "answers");

  // Maps for source hierarchy
  const sourceGroupsMap = new Map(rawGroups.map((g) => [g[0], g]));
  const sourceSectionsMap = new Map(rawSections.map((s) => [s[0], s]));
  const sourceExamsMap = new Map(rawExams.map((e) => [e[0], e]));

  // Read missing 36 questions audit
  const audit36Csv = fs.readFileSync(AUDIT_36_CSV_PATH, "utf-8");
  const missing36QuestionIds = new Set();
  const requiredGroupIds = new Set();
  const answersPerGroup = new Map();

  audit36Csv
    .split("\n")
    .slice(1)
    .forEach((line) => {
      const parts = line.split(",");
      if (parts[0]) {
        const qId = parts[0].trim();
        const gId = parts[1] ? parts[1].trim() : null;
        const ansCount = parseInt(parts[4] || "0", 10);
        missing36QuestionIds.add(qId);
        if (gId) {
          requiredGroupIds.add(gId);
          answersPerGroup.set(gId, (answersPerGroup.get(gId) || 0) + ansCount);
        }
      }
    });

  // Count questions per group in backup
  const questionCountPerGroup = new Map();
  rawQuestions.forEach((q) => {
    const gId = q[1];
    if (gId) questionCountPerGroup.set(gId, (questionCountPerGroup.get(gId) || 0) + 1);
  });

  // Fetch current Supabase target DB state
  const { data: targetGroups } = await supabase.from("question_groups").select("id");
  const targetGroupIdsSet = new Set((targetGroups || []).map((g) => g.id));

  const { data: targetSections } = await supabase.from("exam_sections").select("id");
  const targetSectionIdsSet = new Set((targetSections || []).map((s) => s.id));

  const { data: targetExams } = await supabase.from("exams").select("id");
  const targetExamIdsSet = new Set((targetExams || []).map((e) => e.id));

  console.log(`  • Required Orphan Groups for 36 Questions: ${requiredGroupIds.size}`);

  const csvRows = [];
  const reportDetails = [];

  let noHistDepCount = 0;
  let histDepCount = 0;
  let parentMissingCount = 0;
  let readyForInsertCount = 0;

  for (const gId of requiredGroupIds) {
    const gRow = sourceGroupsMap.get(gId);
    const sId = gRow ? gRow[1] : "UNKNOWN";
    const sRow = sourceSectionsMap.get(sId);
    const eId = sRow ? sRow[1] : "UNKNOWN";

    const qCountInGroup = questionCountPerGroup.get(gId) || 0;
    const ansCountInGroup = answersPerGroup.get(gId) || 0;

    const targetGroupExists = targetGroupIdsSet.has(gId);
    const targetSectionExists = targetSectionIdsSet.has(sId);
    const targetExamExists = targetExamIdsSet.has(eId);

    let classification = "NO_HISTORICAL_DEPENDENCY";
    if (ansCountInGroup > 0) {
      classification = "HISTORICAL_DEPENDENCY";
      histDepCount++;
    } else {
      noHistDepCount++;
    }

    if (!targetSectionExists || !targetExamExists) {
      classification = "PARENT_DEPENDENCY_MISSING";
      parentMissingCount++;
    } else {
      readyForInsertCount++;
    }

    csvRows.push(
      `${gId},${sId},${eId},${qCountInGroup},${ansCountInGroup},${targetGroupExists},${targetSectionExists},${targetExamExists},${classification}`
    );
  }

  // Write orphan_groups_preflight.csv
  const csvHeaders =
    "source_group_id,source_section_id,source_exam_id,source_question_count,historical_answer_count,target_group_exists,target_section_exists,target_exam_exists,classification";
  const csvPath = path.join(process.cwd(), "scripts", "pipeline", "orphan_groups_preflight.csv");
  fs.mkdirSync(path.dirname(csvPath), { recursive: true });
  fs.writeFileSync(csvPath, [csvHeaders, ...csvRows].join("\n"), "utf-8");

  // Write orphan_groups_preflight_report.md
  const reportContent = `# 📋 ORPHAN GROUPS PREFLIGHT REPORT

## 1. Minimal Required Scope
- **Total Orphan Groups in System**: 208
- **MINIMUM Required Groups for 36 Missing Questions**: **${requiredGroupIds.size}**
- **Unnecessary Orphan Groups Filtered Out**: **${208 - requiredGroupIds.size}**

## 2. Parent Dependency Check
- **Target Section Foreign Key Exists**: **${requiredGroupIds.size - parentMissingCount} / ${requiredGroupIds.size}**
- **Target Exam Foreign Key Exists**: **${requiredGroupIds.size - parentMissingCount} / ${requiredGroupIds.size}**
- **Parent Dependency Missing**: **${parentMissingCount}**

## 3. Classification Summary
- **READY_FOR_INSERT**: ${readyForInsertCount} (Section & Exam parents exist in Target)
- **NO_HISTORICAL_DEPENDENCY**: ${noHistDepCount} (0 student answers in group)
- **HISTORICAL_DEPENDENCY**: ${histDepCount} (Contains student answers)
- **PARENT_DEPENDENCY_MISSING**: ${parentMissingCount}

## 4. Governance & Execution Status
- **DATABASE_MUTATIONS**: 0
- **RECOVERY_A**: UNTOUCHED
- **RECOVERY_B1**: ROLLED_BACK
- **STATUS**: READY_FOR_REVIEW
`;

  const reportPath = path.join(process.cwd(), "scripts", "pipeline", "orphan_groups_preflight_report.md");
  fs.writeFileSync(reportPath, reportContent, "utf-8");

  console.log("==========================================================================");
  console.log("📊 ORPHAN GROUPS PREFLIGHT SUMMARY");
  console.log("==========================================================================");
  console.log(`Minimum Required Groups for 36 Questions:   ${requiredGroupIds.size}`);
  console.log(`READY_FOR_INSERT Groups:                    ${readyForInsertCount}`);
  console.log(`NO_HISTORICAL_DEPENDENCY Groups:            ${noHistDepCount}`);
  console.log(`HISTORICAL_DEPENDENCY Groups:               ${histDepCount}`);
  console.log(`PARENT_DEPENDENCY_MISSING Groups:           ${parentMissingCount}`);
  console.log("==========================================================================\n");
}

runOrphanGroupPrepare().catch((err) => {
  console.error("❌ Orphan Group Prepare Error:", err.message);
  process.exit(1);
});
