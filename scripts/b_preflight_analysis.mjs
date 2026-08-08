/**
 * B-PREFLIGHT READ-ONLY ANALYSIS SCRIPT
 * Analyzes the remaining orphan groups and orphan source questions.
 * 
 * Rules:
 * - Strictly READ-ONLY
 * - NO database mutations (0 INSERT, 0 UPDATE, 0 DELETE, 0 DDL)
 * - Identifies exact candidate mapping for orphan questions/groups
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

async function runBPreflight() {
  console.log("🔍 Running READ-ONLY B-Preflight Analysis...\n");

  const sqlContent = fs.readFileSync(SQL_FILE_PATH, "utf-8");

  // 1. Source Questions Total in backup (739)
  const sourceQuestions = parseSQLInserts(sqlContent, "questions");
  const sourceQuestionCount = sourceQuestions.length;

  // Map source questions by group_id
  const sourceQuestionsByGroup = new Map();
  sourceQuestions.forEach((q) => {
    const qObj = {
      id: q[0],
      group_id: q[1],
      question_type: q[2],
      question_text: q[3],
      options: q[4],
      correct_answer: q[5],
      points: q[6],
      order_index: q[7],
    };
    if (!sourceQuestionsByGroup.has(q[1])) {
      sourceQuestionsByGroup.set(q[1], []);
    }
    sourceQuestionsByGroup.get(q[1]).push(qObj);
  });

  // 2. Current Target Questions Total in Supabase (703)
  const { count: targetQuestionCount } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true });

  const { data: supabaseQuestions } = await supabase.from("questions").select("id, group_id, question_text");
  const supabaseQuestionIdsSet = new Set((supabaseQuestions || []).map((q) => q.id));

  // 3. Read 209 Orphan Groups from 03_orphan_records.csv (Column 1 is 'entity', Column 2 is 'id')
  let orphanGroupIds = [];
  if (fs.existsSync(ORPHAN_CSV_PATH)) {
    const csvContent = fs.readFileSync(ORPHAN_CSV_PATH, "utf-8");
    orphanGroupIds = csvContent
      .split("\n")
      .slice(1)
      .map((line) => {
        const parts = line.split(",");
        return parts[1] ? parts[1].trim() : null;
      })
      .filter(Boolean);
  }

  // 4. Identify Source Questions belonging to Orphan Groups
  const orphanSourceQuestions = [];
  orphanGroupIds.forEach((gId) => {
    const qList = sourceQuestionsByGroup.get(gId) || [];
    orphanSourceQuestions.push(...qList);
  });

  // Find source questions that are NOT currently in Supabase target (739 - 703 = 36 questions)
  const missingSourceQuestions = sourceQuestions.filter((q) => !supabaseQuestionIdsSet.has(q[0]));

  const orphanSourceQuestionCount = missingSourceQuestions.length;

  // 5. Match orphan source questions against current Supabase target questions
  const orphanMappingResults = [];
  let uniqueMatches = 0;
  let ambiguousMatches = 0;
  let unmatchedQuestions = 0;

  for (const sQ of missingSourceQuestions) {
    const hasTargetCounterpart = supabaseQuestionIdsSet.has(sQ[0]);

    let candidateCount = 0;
    let targetCandidateId = null;
    let confidence = "LOW";
    let recommendedAction = "MANUAL_REVIEW";

    if (hasTargetCounterpart) {
      candidateCount = 1;
      targetCandidateId = sQ[0];
      confidence = "HIGH";
      recommendedAction = "READY_FOR_RECOVERY_B";
      uniqueMatches++;
    } else {
      // 36 source questions do not exist in current 703 target rows yet
      candidateCount = 0;
      recommendedAction = "UNMATCHED_TARGET_NEW_ROW_REQUIRED";
      unmatchedQuestions++;
    }

    orphanMappingResults.push({
      source_question_id: sQ[0],
      source_group_id: sQ[1],
      target_candidate_question_id: targetCandidateId || "NONE",
      candidate_count: candidateCount,
      confidence,
      recommended_action: recommendedAction,
    });
  }

  // Generate b_preflight_mapping.csv
  const csvHeaders = "source_question_id,source_group_id,target_candidate_question_id,candidate_count,confidence,recommended_action";
  const csvRows = orphanMappingResults.map((r) =>
    `${r.source_question_id},${r.source_group_id},${r.target_candidate_question_id},${r.candidate_count},${r.confidence},${r.recommended_action}`
  );
  const csvPath = path.join(process.cwd(), "scripts", "pipeline", "b_preflight_mapping.csv");
  fs.mkdirSync(path.dirname(csvPath), { recursive: true });
  fs.writeFileSync(csvPath, [csvHeaders, ...csvRows].join("\n"), "utf-8");

  console.log("==========================================================================");
  console.log("📊 B-PREFLIGHT ANALYSIS RESULTS");
  console.log("==========================================================================");
  console.log(`source_question_count:          ${sourceQuestionCount}`);
  console.log(`target_question_count:          ${targetQuestionCount}`);
  console.log(`orphan_source_question_count:  ${orphanSourceQuestionCount}`);
  console.log(`unique_matches:                 ${uniqueMatches}`);
  console.log(`ambiguous_matches:              ${ambiguousMatches}`);
  console.log(`unmatched_questions:            ${unmatchedQuestions}`);
  console.log("==========================================================================\n");
}

runBPreflight().catch((err) => {
  console.error("❌ B-Preflight Error:", err.message);
  process.exit(1);
});
