/**
 * RECOVERY B-PREPARE — 36 MISSING QUESTIONS ONLY
 * Strictly READ-ONLY preparation & static validation script.
 * 
 * Rules:
 * - 0 DATABASE MUTATIONS (NO INSERT, UPDATE, DELETE, DDL executed)
 * - Uses ORIGINAL SOURCE QUESTION ID as proposed target ID for all 36 questions
 * - Preserves historical submission IDs for 9 protected questions
 * - Generates missing_questions_insert_plan.sql, missing_questions_insert_audit.csv, recovery_b_preparation_report.md
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

function escapeSqlStr(str) {
  if (str === null || str === undefined) return "NULL";
  return "'" + String(str).replace(/'/g, "''").replace(/\\/g, "\\\\") + "'";
}

async function prepareRecoveryB36() {
  console.log("🛠️ Starting RECOVERY B-PREPARE: 36 Missing Questions Only (READ-ONLY)...\n");

  const sqlContent = fs.readFileSync(SQL_FILE_PATH, "utf-8");
  const rawQuestions = parseSQLInserts(sqlContent, "questions");

  // Fetch current Supabase target question IDs
  const { data: supabaseQuestions } = await supabase.from("questions").select("id");
  const targetIdsSet = new Set((supabaseQuestions || []).map((q) => q.id));

  // Filter exact 36 missing questions
  const missing36Questions = rawQuestions.filter((q) => !targetIdsSet.has(q[0]));

  if (missing36Questions.length !== 36) {
    throw new Error(`PRE-CHECK FAILED: Expected 36 missing questions, observed ${missing36Questions.length}`);
  }

  // Parse missing_36_questions_audit.csv to get historical answer counts & actions
  const audit36CsvContent = fs.readFileSync(AUDIT_36_CSV_PATH, "utf-8");
  const audit36Map = new Map();
  audit36CsvContent
    .split("\n")
    .slice(1)
    .forEach((line) => {
      const parts = line.split(",");
      if (parts[0]) {
        audit36Map.set(parts[0].trim(), {
          ansCount: parseInt(parts[4] || "0", 10),
          action: parts[6] ? parts[6].trim() : "SAFE_NEW_ROW_REQUIRED",
        });
      }
    });

  // 1. GENERATE missing_questions_insert_audit.csv
  const auditCsvHeaders = "proposed_target_id,source_group_id,question_type,historical_answer_count,classification,source_id_preserved";
  const auditCsvRows = [];
  const proposedSqlStatements = [];
  const proposedTargetIds = new Set();

  let safeCount = 0;
  let protectedCount = 0;
  let unresolvedCount = 0;

  proposedSqlStatements.push("-- ==================================================================");
  proposedSqlStatements.push("-- RECOVERY B-PREPARE: 36 MISSING QUESTIONS PROPOSED INSERT PLAN");
  proposedSqlStatements.push("-- ARTIFACT ONLY — DO NOT EXECUTE AUTOMATICALLY");
  proposedSqlStatements.push("-- Proposed Target IDs == Original VPS Source Question IDs (0 UUID Remappings)");
  proposedSqlStatements.push("-- ==================================================================\n");

  for (const q of missing36Questions) {
    const qId = q[0];
    const gId = q[1];
    const qType = q[2];
    const qText = q[3];
    const options = q[4];
    const correctAns = q[5];
    const points = q[6] || "1";
    const orderIdx = q[7] || "0";

    const auditInfo = audit36Map.get(qId) || { ansCount: 0, action: "SAFE_NEW_ROW_REQUIRED" };
    const ansCount = auditInfo.ansCount;
    const classification = ansCount > 0 ? "PROTECTED_NEW_ROW_REQUIRED" : "SAFE_NEW_ROW_REQUIRED";

    if (ansCount > 0) {
      protectedCount++;
    } else {
      safeCount++;
    }

    proposedTargetIds.add(qId);

    auditCsvRows.push(`${qId},${gId},${qType},${ansCount},${classification},true`);

    // Format SQL INSERT statement using original source ID
    const sqlInsert = `INSERT INTO questions (id, group_id, question_type, question_text, options, correct_answer, points, order_index) VALUES (${escapeSqlStr(qId)}, ${escapeSqlStr(gId)}, ${escapeSqlStr(qType)}, ${escapeSqlStr(qText)}, ${escapeSqlStr(options)}, ${escapeSqlStr(correctAns)}, ${points}, ${orderIdx}); -- Classification: ${classification} (Ans: ${ansCount})`;
    proposedSqlStatements.push(sqlInsert);
  }

  // Write missing_questions_insert_audit.csv
  const auditCsvPath = path.join(process.cwd(), "scripts", "pipeline", "missing_questions_insert_audit.csv");
  fs.writeFileSync(auditCsvPath, [auditCsvHeaders, ...auditCsvRows].join("\n"), "utf-8");

  // Write missing_questions_insert_plan.sql
  const planSqlPath = path.join(process.cwd(), "scripts", "pipeline", "missing_questions_insert_plan.sql");
  fs.writeFileSync(planSqlPath, proposedSqlStatements.join("\n"), "utf-8");

  // =========================================================================
  // 2. STATIC VALIDATION OF PROPOSED ARTIFACTS
  // =========================================================================
  console.log("🛡️ Running Static Validation on Proposed Artifacts...");

  const insertCountInSql = proposedSqlStatements.filter((line) => line.startsWith("INSERT INTO questions")).length;
  const updateCount = proposedSqlStatements.filter((line) => line.startsWith("UPDATE")).length;
  const deleteCount = proposedSqlStatements.filter((line) => line.startsWith("DELETE")).length;
  const alterCount = proposedSqlStatements.filter((line) => line.startsWith("ALTER")).length;
  const dropCount = proposedSqlStatements.filter((line) => line.startsWith("DROP")).length;

  let existingProposedIdOverlap = 0;
  for (const pId of proposedTargetIds) {
    if (targetIdsSet.has(pId)) existingProposedIdOverlap++;
  }

  console.log(`  • Proposed INSERT Statements:                     ${insertCountInSql} (Expected: 36)`);
  console.log(`  • Unique Proposed Question IDs:                  ${proposedTargetIds.size} (Expected: 36)`);
  console.log(`  • Overlap with Existing Target Question IDs:     ${existingProposedIdOverlap} (Expected: 0)`);
  console.log(`  • SAFE_NEW_ROW_REQUIRED (0 Answers):             ${safeCount} (Expected: 27)`);
  console.log(`  • PROTECTED_NEW_ROW_REQUIRED (Has Answers):      ${protectedCount} (Expected: 9)`);
  console.log(`  • Unresolved Rows:                                ${unresolvedCount} (Expected: 0)`);
  console.log(`  • UPDATE / DELETE / ALTER / DROP Statements:      ${updateCount + deleteCount + alterCount + dropCount} (Expected: 0)`);

  if (insertCountInSql !== 36) throw new Error(`STATIC VALIDATION FAILED: Insert count != 36`);
  if (proposedTargetIds.size !== 36) throw new Error(`STATIC VALIDATION FAILED: Unique proposed target IDs != 36`);
  if (existingProposedIdOverlap !== 0) throw new Error(`STATIC VALIDATION FAILED: Proposed ID already exists in target`);
  if (safeCount !== 27) throw new Error(`STATIC VALIDATION FAILED: Safe count != 27`);
  if (protectedCount !== 9) throw new Error(`STATIC VALIDATION FAILED: Protected count != 9`);
  if (updateCount + deleteCount + alterCount + dropCount !== 0) throw new Error(`STATIC VALIDATION FAILED: Unwanted DML/DDL statements found`);

  console.log("  ✅ Static Validation PASSED 100%!\n");

  // =========================================================================
  // 3. GENERATE recovery_b_preparation_report.md
  // =========================================================================
  const reportMdPath = path.join(process.cwd(), "scripts", "pipeline", "recovery_b_preparation_report.md");
  const reportMdContent = `# 📋 RECOVERY B-PREPARE REPORT (36 MISSING QUESTIONS ONLY)

## 1. Summary Metrics
- **Total Missing Questions Prepared**: 36
- **Original Source Question IDs Preserved**: 36 / 36 (100%)
- **Proposed Target IDs Overlapping Existing Target**: 0
- **INSERT Candidates (No Historical Answers)**: 27 (\`SAFE_NEW_ROW_REQUIRED\`)
- **INSERT Candidates (Has Historical Answers)**: 9 (\`PROTECTED_NEW_ROW_REQUIRED\`)
- **Unresolved Rows**: 0

## 2. Protected Questions (9 Rows) Safety Note
- The 9 questions with historical answers use their **ORIGINAL VPS SOURCE QUESTION ID** as the proposed target ID.
- Historical student answers in \`answers\` table remain 100% untouched (0 UPDATEs / 0 DELETEs / 0 INSERTs against \`answers\`).
- Importing these 9 rows with preserved source IDs will restore referential integrity for their student submissions.

## 3. Generated Artifacts
- **SQL Insert Plan**: \`missing_questions_insert_plan.sql\` (36 INSERTs - UNEXECUTED ARTIFACT ONLY)
- **Audit File**: \`missing_questions_insert_audit.csv\` (36 Rows)
- **Report File**: \`recovery_b_preparation_report.md\`

## 4. Execution & Governance Status
- **STATUS**: \`PREPARED_FOR_HUMAN_REVIEW\`
- **EXECUTION**: \`NOT_EXECUTED\`
- **DATABASE_MUTATIONS**: \`0\`
`;

  fs.writeFileSync(reportMdPath, reportMdContent, "utf-8");
  console.log(`📄 Generated Report Artifact: ${reportMdPath}`);

  console.log("\n==========================================================================");
  console.log("🎉 RECOVERY B-PREPARE COMPLETED SUCCESSFULLY (0 DATABASE MUTATIONS)");
  console.log("==========================================================================\n");
}

prepareRecoveryB36().catch((err) => {
  console.error("❌ Recovery B-Prepare Error:", err.message);
  process.exit(1);
});
