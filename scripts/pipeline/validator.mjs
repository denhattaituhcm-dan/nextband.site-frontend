import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://gzpdlqxjggyxlkeatvvf.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cGRscXhqZ2d5eGxrZWF0dnZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyOTc3NjMsImV4cCI6MjEwMDg3Mzc2M30.M7uMAo2qJCDQtxQMP-_58VKF1LfSBdwR31gpvqcCN6I";

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 3-TIER SEVERITY VALIDATION ENGINE
 * 
 * Severity Levels:
 * - ERROR: Hard invariant violation -> BLOCK IMPORT
 * - WARNING: Non-critical missing asset -> ALLOW IMPORT WITH WARNING
 * - INFO: Metadata/tags missing -> ALLOW IMPORT WITH INFO
 */
export async function validateContent3Tier(examId) {
  const { data: exam } = await supabase
    .from("exams")
    .select("id, title, week, course_id, courses(id, title)")
    .eq("id", examId)
    .single();

  if (!exam) {
    return {
      examId,
      status: "BLOCK",
      errors: [{ severity: "ERROR", code: "EXAM_NOT_FOUND", message: `Exam ${examId} not found` }],
      warnings: [],
      info: []
    };
  }

  const { data: sections } = await supabase
    .from("exam_sections")
    .select("*")
    .eq("exam_id", examId)
    .order("order_index", { ascending: true });

  const errors = [];
  const warnings = [];
  const infoList = [];

  if (!sections || sections.length === 0) {
    errors.push({ severity: "ERROR", code: "NO_SECTIONS", message: `Exam '${exam.title}' has 0 sections` });
  } else {
    for (const sec of sections) {
      const { data: groups } = await supabase
        .from("question_groups")
        .select("*")
        .eq("section_id", sec.id);

      const groupList = groups || [];

      // Structural Invariant: Mismapped Section
      if (sec.section_type === "general" && groupList.some(g => Boolean(g.audio_url || g.passage))) {
        errors.push({
          severity: "ERROR",
          code: "MISMAPPED_SECTION",
          sectionId: sec.id,
          message: `Section '${sec.title}' contains Listening/Reading content stuffed inside Grammar section`
        });
      }

      // Semantic Invariant: Listening Audio
      if (sec.section_type === "listening" && groupList.length > 0) {
        const hasAudio = groupList.some(g => Boolean(g.audio_url || sec.audio_url));
        if (!hasAudio) {
          errors.push({
            severity: "ERROR",
            code: "MISSING_AUDIO",
            sectionId: sec.id,
            message: `Listening Section '${sec.title}' is missing audio URL`
          });
        }
      }

      // Semantic Invariant: Reading Passage
      if (sec.section_type === "reading" && groupList.length > 0) {
        const hasPassage = groupList.some(g => Boolean(g.passage && g.passage.trim().length >= 50));
        if (!hasPassage) {
          errors.push({
            severity: "ERROR",
            code: "MISSING_PASSAGE",
            sectionId: sec.id,
            message: `Reading Section '${sec.title}' is missing passage text`
          });
        }
      }

      for (const grp of groupList) {
        const { data: questions } = await supabase
          .from("questions")
          .select("*")
          .eq("group_id", grp.id);

        const qList = questions || [];
        if (qList.length === 0) {
          warnings.push({
            severity: "WARNING",
            code: "EMPTY_GROUP",
            groupId: grp.id,
            message: `Group '${grp.title}' in section '${sec.title}' contains 0 questions`
          });
        }

        for (const q of qList) {
          if (q.question_text && q.question_text.trim() === "Question Item") {
            warnings.push({
              severity: "WARNING",
              code: "PLACEHOLDER_TEXT",
              questionId: q.id,
              message: `Question [${q.id}] contains placeholder text 'Question Item'`
            });
          }

          if (q.question_type === "multiple_choice" && (!q.options || q.options.length === 0)) {
            errors.push({
              severity: "ERROR",
              code: "MISSING_OPTIONS",
              questionId: q.id,
              message: `Multiple choice question [${q.id}] has empty options array`
            });
          }

          if (!q.correct_answer) {
            infoList.push({
              severity: "INFO",
              code: "MISSING_ANSWER_KEY",
              questionId: q.id,
              message: `Question [${q.id}] is missing correct answer key`
            });
          }
        }
      }
    }
  }

  const isBlocked = errors.length > 0;
  const status = isBlocked ? "BLOCK" : warnings.length > 0 ? "ALLOW_WITH_WARNINGS" : "ALLOW_CLEAN";

  return {
    examId: exam.id,
    examTitle: exam.title,
    courseTitle: exam.courses?.title || "Unknown Course",
    week: exam.week,
    status,
    errors,
    warnings,
    info: infoList
  };
}
