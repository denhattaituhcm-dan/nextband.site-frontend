/**
 * Data Remediation Action Script
 * Updates invalid placeholder question texts or missing metadata.
 * 
 * Safety: Runs in DRY-RUN mode by default.
 * Pass --execute flag to apply mutations to database with an Audit Log.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://gzpdlqxjggyxlkeatvvf.supabase.co";
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cGRscXhqZ2d5eGxrZWF0dnZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyOTc3NjMsImV4cCI6MjEwMDg3Mzc2M30.M7uMAo2qJCDQtxQMP-_58VKF1LfSBdwR31gpvqcCN6I";

const supabase = createClient(supabaseUrl, supabaseKey);

const isExecute = process.argv.includes("--execute");

async function runRemediation() {
  console.log(`🛠️ Starting Data Remediation Script [Mode: ${isExecute ? "EXECUTE (MUTATING DB)" : "DRY-RUN (SAFE READ-ONLY)"}]`);

  const reportPath = path.join(process.cwd(), "content_audit_report.json");
  if (!fs.existsSync(reportPath)) {
    console.error("❌ Audit report 'content_audit_report.json' not found. Please run 'node scripts/audit_content_report.mjs' first.");
    process.exit(1);
  }

  const auditReport = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  console.log(`📋 Found ${auditReport.invalidExamsCount} invalid exams from audit report.`);

  const remediationLog = {
    executedAt: new Date().toISOString(),
    isExecute,
    actionsAttempted: 0,
    actionsSuccessful: 0,
    logs: [],
  };

  for (const diag of auditReport.examDiagnostics) {
    for (const v of diag.violations) {
      if (v.rule === "QUESTION_TEXT_PLACEHOLDER" && v.questionId) {
        remediationLog.actionsAttempted++;

        const logMsg = `Target Question [${v.questionId}] in Exam '${diag.examTitle}': Placeholder '${v.placeholderText}'`;

        if (isExecute) {
          // Flag question or set placeholder remediation note
          const { error } = await supabase
            .from("questions")
            .update({
              question_text: `[CẦN BIÊN SOẠN CÂU HỎI] ${diag.examTitle} - Câu hỏi ${v.questionId.slice(0, 6)}`,
            })
            .eq("id", v.questionId);

          if (error) {
            remediationLog.logs.push({ success: false, message: `${logMsg} -> ERROR: ${error.message}` });
          } else {
            remediationLog.actionsSuccessful++;
            remediationLog.logs.push({ success: true, message: `${logMsg} -> REMEDIATED` });
          }
        } else {
          remediationLog.logs.push({ success: true, message: `[DRY-RUN WOULD REMEDIATE] ${logMsg}` });
        }
      }
    }
  }

  const logPath = path.join(process.cwd(), "remediation_execution_log.json");
  fs.writeFileSync(logPath, JSON.stringify(remediationLog, null, 2), "utf8");

  console.log("\n==================================================");
  console.log(`✅ Remediation Finished! (${isExecute ? "Applied Changes" : "Dry-Run Complete"})`);
  console.log(`📄 Execution Log: ${logPath}`);
  console.log(`📊 Actions: ${remediationLog.actionsSuccessful}/${remediationLog.actionsAttempted}`);
  if (!isExecute) {
    console.log("💡 Tip: Pass '--execute' flag to apply changes to database.");
  }
  console.log("==================================================\n");
}

runRemediation();
