/**
 * Read-Only Content Contract Audit & Reporting Script
 * Scans all exams, sections, question groups, and questions in DB for Contract Violations.
 * Generates audit_report.json without mutating any database records.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://gzpdlqxjggyxlkeatvvf.supabase.co";
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cGRscXhqZ2d5eGxrZWF0dnZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyOTc3NjMsImV4cCI6MjEwMDg3Mzc2M30.M7uMAo2qJCDQtxQMP-_58VKF1LfSBdwR31gpvqcCN6I";

const supabase = createClient(supabaseUrl, supabaseKey);

const INVALID_PLACEHOLDERS = [
  "question item",
  "null",
  "lorem ipsum",
  "sample text",
  "todo",
  "placeholder",
];

async function runContentAudit() {
  console.log("🔍 Starting Read-Only Content Contract Audit...");

  const { data: exams, error: examsErr } = await supabase
    .from("exams")
    .select("id, title, course_id, courses(id, title)");

  if (examsErr || !exams) {
    console.error("❌ Failed to fetch exams:", examsErr);
    process.exit(1);
  }

  console.log(`📊 Total Exams Scanned: ${exams.length}`);

  const report = {
    generatedAt: new Date().toISOString(),
    totalExamsScanned: exams.length,
    invalidExamsCount: 0,
    placeholderQuestionsCount: 0,
    missingAudioSectionsCount: 0,
    missingPassageSectionsCount: 0,
    examDiagnostics: [],
  };

  for (const exam of exams) {
    const { data: sections } = await supabase
      .from("exam_sections")
      .select("*")
      .eq("exam_id", exam.id)
      .order("order_index", { ascending: true });

    const secList = sections || [];
    const examViolations = [];

    if (secList.length === 0) {
      examViolations.push({
        rule: "NO_SECTIONS",
        message: "Exam has no configured sections",
      });
    }

    for (const sec of secList) {
      const { data: groups } = await supabase
        .from("question_groups")
        .select("*")
        .eq("section_id", sec.id);

      const groupList = groups || [];

      if (sec.section_type === "listening") {
        const hasAudio =
          Boolean(sec.audio_url) ||
          groupList.some((g) => Boolean(g.audio_url));
        if (!hasAudio && groupList.length > 0) {
          report.missingAudioSectionsCount++;
          examViolations.push({
            rule: "LISTENING_MISSING_AUDIO",
            sectionId: sec.id,
            sectionTitle: sec.title,
            message: "Listening section has no audio URL configured",
          });
        }
      }

      if (sec.section_type === "reading") {
        const hasPassage = groupList.some(
          (g) => Boolean(g.passage) && g.passage.trim().length >= 20,
        );
        if (!hasPassage && groupList.length > 0) {
          report.missingPassageSectionsCount++;
          examViolations.push({
            rule: "READING_MISSING_PASSAGE",
            sectionId: sec.id,
            sectionTitle: sec.title,
            message: "Reading section has no passage text configured",
          });
        }
      }

      for (const grp of groupList) {
        const { data: questions } = await supabase
          .from("questions")
          .select("*")
          .eq("group_id", grp.id);

        const qList = questions || [];

        for (const q of qList) {
          const qText = (q.question_text || "").trim().toLowerCase();
          const isPlaceholder = INVALID_PLACEHOLDERS.some((p) =>
            qText === p || qText.startsWith(p),
          );

          if (isPlaceholder) {
            report.placeholderQuestionsCount++;
            examViolations.push({
              rule: "QUESTION_TEXT_PLACEHOLDER",
              sectionId: sec.id,
              questionId: q.id,
              placeholderText: q.question_text,
              message: `Question contains forbidden placeholder '${q.question_text}'`,
            });
          }
        }
      }
    }

    if (examViolations.length > 0) {
      report.invalidExamsCount++;
      report.examDiagnostics.push({
        examId: exam.id,
        examTitle: exam.title,
        courseTitle: exam.courses?.title || "Unknown Course",
        violationsCount: examViolations.length,
        violations: examViolations,
      });
    }
  }

  const outputPath = path.join(process.cwd(), "content_audit_report.json");
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf8");

  console.log("\n==================================================");
  console.log("✅ Content Audit Completed!");
  console.log(`📄 Report saved to: ${outputPath}`);
  console.log(`⚠️ Invalid Exams: ${report.invalidExamsCount}/${report.totalExamsScanned}`);
  console.log(`⚠️ Placeholder Questions Found: ${report.placeholderQuestionsCount}`);
  console.log("==================================================\n");
}

runContentAudit();
