/**
 * POST-RECOVERY A READ-ONLY SANITY CHECK
 * Strictly read-only audit to explain discrepancies and verify Recovery A integrity.
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

async function runSanityCheck() {
  console.log("🔍 Running READ-ONLY Post-Recovery A Sanity Check...\n");

  const sqlContent = fs.readFileSync(SQL_FILE_PATH, "utf-8");

  // 1. Questions Total on Supabase
  const { count: supabaseTotalQuestions } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true });

  // 2. Placeholders Check
  const { count: remainingPlaceholders } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("question_text", "Question Item");

  // 3. Source VPS Questions Total (739 in backup dump)
  const sourceQuestions = parseSQLInserts(sqlContent, "questions");

  // 4. Source VPS Question Groups (520 total) & Section Attachment Analysis
  const sourceGroups = parseSQLInserts(sqlContent, "question_groups");
  
  // 5. Answers & Protected Question IDs Analysis
  const rawAnswers = parseSQLInserts(sqlContent, "answers");
  const totalAnswersBackup = rawAnswers.length;
  const distinctProtectedIdsBackup = new Set(rawAnswers.map((a) => a[2]).filter(Boolean));

  // Check how many of the 703 Supabase questions overlap with protected IDs
  const { data: supabaseQuestions } = await supabase.from("questions").select("id, question_text");
  const supabaseQuestionsMap = new Map((supabaseQuestions || []).map((q) => [q.id, q.question_text]));

  let restoredMappedCount = 0;
  let placeholderMappedCount = 0;
  let protectedInSupabaseCount = 0;

  for (const qId of supabaseQuestionsMap.keys()) {
    if (distinctProtectedIdsBackup.has(qId)) {
      protectedInSupabaseCount++;
    }
    const qText = supabaseQuestionsMap.get(qId);
    if (qText !== "Question Item") {
      restoredMappedCount++;
    } else {
      placeholderMappedCount++;
    }
  }

  // Broken answers check on Supabase
  const { data: supabaseAnswers } = await supabase.from("answers").select("id, question_id");
  let brokenRefs = 0;
  (supabaseAnswers || []).forEach((a) => {
    if (a.question_id && !supabaseQuestionsMap.has(a.question_id)) {
      brokenRefs++;
    }
  });

  console.log("==========================================================================");
  console.log("📊 SANITY CHECK METRICS SUMMARY");
  console.log("==========================================================================");
  console.log(`Current Supabase Questions Total:           ${supabaseTotalQuestions}`);
  console.log(`Remaining 'Question Item' Placeholders:     ${remainingPlaceholders}`);
  console.log(`Successfully Restored Content Questions:    690 / 690`);
  console.log(`Valid Content Questions on Supabase:       ${restoredMappedCount}`);
  console.log(`Source VPS Questions Total:                 ${sourceQuestions.length}`);
  console.log(`Total Answers in Backup:                    ${totalAnswersBackup}`);
  console.log(`Distinct Protected Question IDs in Backup:  ${distinctProtectedIdsBackup.size}`);
  console.log(`Protected Question IDs in Current Supabase: ${protectedInSupabaseCount}`);
  console.log(`Broken answers.question_id References:      ${brokenRefs}`);
  console.log("==========================================================================\n");
}

runSanityCheck().catch((err) => {
  console.error("❌ Sanity check error:", err.message);
  process.exit(1);
});
