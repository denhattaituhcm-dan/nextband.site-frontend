/**
 * RECOVERY A — CONTROLLED EXECUTION SCRIPT
 * Restores 690 placeholder questions ("Question Item") with real content from nextband_backup.sql.
 * 
 * Safety Guards:
 * - Pre-execution assertions (placeholders = 690)
 * - Row count affected = 1 check per update
 * - Safety predicate: WHERE id = target_id AND question_text = 'Question Item'
 * - Preserves existing target question IDs (0 ID mutations)
 * - Post-execution assertions (placeholders = 0, total questions = 3120)
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
  if (val === "1" || val === "true") return true;
  if (val === "0" || val === "false") return false;
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

async function executeRecoveryA() {
  console.log("🚀 Starting Controlled Execution for RECOVERY A...\n");

  if (!fs.existsSync(SQL_FILE_PATH)) {
    throw new Error(`Backup SQL file not found at ${SQL_FILE_PATH}`);
  }

  const sqlContent = fs.readFileSync(SQL_FILE_PATH, "utf-8");

  // Parse answers from nextband_backup.sql
  const rawAnswers = parseSQLInserts(sqlContent, "answers");
  const historicalAnswersCount = rawAnswers.length;
  const distinctProtectedIds = new Set(rawAnswers.map((a) => a[2]).filter(Boolean));

  console.log("🛡️ Step 1/4: Running Pre-Execution Assertions...");
  console.log(`  • Historical Answers in VPS backup: ${historicalAnswersCount}`);
  console.log(`  • Distinct Protected Question IDs: ${distinctProtectedIds.size}`);

  const { data: placeholders, error: pErr } = await supabase
    .from("questions")
    .select("id, group_id, question_type, order_index")
    .eq("question_text", "Question Item");

  if (pErr) throw new Error(`Pre-check Failed fetching placeholders: ${pErr.message}`);
  const placeholderCount = placeholders ? placeholders.length : 0;
  console.log(`  • Placeholder Questions observed on Supabase: ${placeholderCount}`);

  if (placeholderCount !== 690) {
    throw new Error(`PRE-CHECK FAILED: Expected 690 placeholders on Supabase, observed ${placeholderCount}`);
  }

  console.log("  ✅ Pre-execution Assertions PASSED!\n");

  // Save protected_question_ids.csv artifact
  const protectedCsvPath = path.join(process.cwd(), "scripts", "pipeline", "protected_question_ids.csv");
  const protectedCsvContent = ["question_id,submission_count", ...Array.from(distinctProtectedIds).map((id) => `${id},1`)].join("\n");
  fs.mkdirSync(path.dirname(protectedCsvPath), { recursive: true });
  fs.writeFileSync(protectedCsvPath, protectedCsvContent, "utf-8");

  // =========================================================================
  // 2. PARSE SOURCE DATA & MATCH CANDIDATES
  // =========================================================================
  console.log("📖 Step 2/4: Reading source VPS dump and matching candidates...");
  const rawQuestions = parseSQLInserts(sqlContent, "questions");

  // Map source questions by ID
  const sourceQuestionsMap = new Map();
  rawQuestions.forEach((q) => {
    if (q[0]) {
      sourceQuestionsMap.set(q[0], {
        id: q[0],
        group_id: q[1],
        question_type: q[2],
        question_text: q[3],
        options: q[4],
        correct_answer: q[5],
        points: q[6],
        order_index: q[7],
      });
    }
  });

  console.log(`  • Parsed ${sourceQuestionsMap.size} source questions from VPS dump.`);

  // Build batch updates list
  const recoveryPlan = [];
  for (const pQ of placeholders) {
    const sQ = sourceQuestionsMap.get(pQ.id);
    if (!sQ) {
      throw new Error(`MAPPING FAILED: Target placeholder ${pQ.id} not found in VPS source dump!`);
    }

    if (!sQ.question_text || sQ.question_text === "Question Item") {
      throw new Error(`INVALID SOURCE TEXT: Source question ${sQ.id} has empty or placeholder text!`);
    }

    recoveryPlan.push({
      id: pQ.id,
      question_text: sQ.question_text,
      options: sQ.options ? (typeof sQ.options === "string" ? JSON.parse(sQ.options) : sQ.options) : null,
      correct_answer: sQ.correct_answer,
    });
  }

  console.log(`  • Built unambiguous recovery plan for ${recoveryPlan.length} placeholder questions.\n`);

  // =========================================================================
  // 3. EXECUTING CONTROLLED BATCH UPDATES
  // =========================================================================
  console.log(`⚙️ Step 3/4: Executing ${recoveryPlan.length} safe UPDATE statements...`);
  let successCount = 0;

  for (let i = 0; i < recoveryPlan.length; i++) {
    const item = recoveryPlan[i];

    // Update with safety predicate
    const { data: updated, error: uErr } = await supabase
      .from("questions")
      .update({
        question_text: item.question_text,
        options: item.options,
        correct_answer: item.correct_answer,
      })
      .eq("id", item.id)
      .eq("question_text", "Question Item")
      .select("id");

    if (uErr || !updated || updated.length !== 1) {
      console.error(`  ❌ Failed updating question [${item.id}]:`, uErr ? uErr.message : "Row count affected != 1");
      throw new Error(`EXECUTION ABORTED: Update for question [${item.id}] failed or affected != 1 row.`);
    } else {
      successCount++;
      if (successCount % 100 === 0 || successCount === recoveryPlan.length) {
        console.log(`  • Progress: ${successCount}/${recoveryPlan.length} questions restored...`);
      }
    }
  }

  console.log(`\n  ✅ Successfully executed ${successCount} content updates.\n`);

  // =========================================================================
  // 4. POST-EXECUTION ASSERTIONS
  // =========================================================================
  console.log("🛡️ Step 4/4: Running Post-Execution Assertions...");

  const { data: remainingPlaceholders } = await supabase
    .from("questions")
    .select("id")
    .eq("question_text", "Question Item");

  const { data: questionsAfter } = await supabase
    .from("questions")
    .select("id");

  const remainingCount = remainingPlaceholders ? remainingPlaceholders.length : 0;
  const questionsAfterCount = questionsAfter ? questionsAfter.length : 0;

  console.log(`  • Remaining Placeholders on Supabase: ${remainingCount} (Expected: 0)`);
  console.log(`  • Total Questions on Supabase: ${questionsAfterCount} (Expected: 3120)`);

  if (remainingCount !== 0) throw new Error(`POST-CHECK FAILED: Remaining placeholders expected 0, got ${remainingCount}`);
  if (questionsAfterCount !== 3120) throw new Error(`POST-CHECK FAILED: Total questions count changed from 3120 to ${questionsAfterCount}`);

  console.log("\n==========================================================================");
  console.log("🎉 RECOVERY A EXECUTED & VERIFIED SUCCESSFULLY!");
  console.log("==========================================================================\n");
}

executeRecoveryA().catch((err) => {
  console.error("\n❌ RECOVERY A ABORTED WITH ERROR:", err.message);
  process.exit(1);
});
