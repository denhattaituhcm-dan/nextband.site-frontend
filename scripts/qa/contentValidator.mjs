import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://gzpdlqxjggyxlkeatvvf.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cGRscXhqZ2d5eGxrZWF0dnZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyOTc3NjMsImV4cCI6MjEwMDg3Mzc2M30.M7uMAo2qJCDQtxQMP-_58VKF1LfSBdwR31gpvqcCN6I";

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 2-TIER CONTENT VALIDATION & WEIGHTED COMPLETENESS SCORING ENGINE
 * 
 * Weights:
 * - Audio Reachability (Listening): 35%
 * - Passage Completeness (Reading): 30%
 * - Question & Answer Integrity: 25%
 * - Placeholder Cleanliness: 5%
 * - Sample Answer / Rubric (Writing/Speaking): 5%
 */
export async function validateExamContent(examId) {
  const { data: exam, error: examErr } = await supabase
    .from("exams")
    .select("id, title, week, course_id, courses(id, title)")
    .eq("id", examId)
    .single();

  if (examErr || !exam) {
    return {
      examId,
      score: 0,
      qaStatus: "BROKEN",
      criticalErrors: ["EXAM_NOT_FOUND"],
      actionableRemedies: [{ type: "RECREATE_EXAM", message: "Exam ID not found in database" }]
    };
  }

  const { data: sections } = await supabase
    .from("exam_sections")
    .select("*")
    .eq("exam_id", examId)
    .order("order_index", { ascending: true });

  let criticalErrors = [];
  let warnings = [];
  let actionableRemedies = [];

  let audioPoints = 35;
  let passagePoints = 30;
  let questionPoints = 25;
  let cleanlinessPoints = 5;
  let samplePoints = 5;

  let totalQuestionsCount = 0;
  let listeningGroupsCount = 0;
  let readingGroupsCount = 0;

  if (!sections || sections.length === 0) {
    criticalErrors.push("NO_SECTIONS_CONFIGURED");
    actionableRemedies.push({ type: "ADD_SECTIONS", message: "Create exam sections" });
    return {
      examId: exam.id,
      examTitle: exam.title,
      courseTitle: exam.courses?.title || "Unknown Course",
      week: exam.week,
      score: 0,
      qaStatus: "BROKEN",
      criticalErrors,
      warnings,
      actionableRemedies
    };
  }

  for (const sec of sections) {
    const { data: groups } = await supabase
      .from("question_groups")
      .select("*")
      .eq("section_id", sec.id);

    const groupList = groups || [];

    // Critical Invariant 1: Mismapped General Section with Listening/Reading Content
    if (sec.section_type === "general" && groupList.length > 0) {
      const hasAudioOrPassage = groupList.some(g => Boolean(g.audio_url || g.passage));
      if (hasAudioOrPassage) {
        criticalErrors.push(`Mis-mapped section '${sec.title}': Content stuffed in general/grammar section`);
        actionableRemedies.push({
          type: "REASSIGN_SECTION",
          sectionId: sec.id,
          message: `Move question groups from '${sec.title}' to Listening or Reading section`
        });
      }
    }

    if (sec.section_type === "listening") {
      listeningGroupsCount += groupList.length;
      const hasAudio = groupList.some(g => Boolean(g.audio_url || sec.audio_url));
      if (!hasAudio && groupList.length > 0) {
        audioPoints = 0;
        criticalErrors.push(`Listening section '${sec.title}' missing audio URL`);
        actionableRemedies.push({
          type: "UPLOAD_AUDIO",
          sectionId: sec.id,
          message: `Upload or configure audio URL for Listening section '${sec.title}'`
        });
      }
    }

    if (sec.section_type === "reading") {
      readingGroupsCount += groupList.length;
      const hasPassage = groupList.some(g => Boolean(g.passage && g.passage.trim().length >= 50));
      if (!hasPassage && groupList.length > 0) {
        passagePoints = 0;
        criticalErrors.push(`Reading section '${sec.title}' missing passage text`);
        actionableRemedies.push({
          type: "EDIT_PASSAGE",
          sectionId: sec.id,
          message: `Add reading passage text for section '${sec.title}'`
        });
      }
    }

    for (const grp of groupList) {
      const { data: questions } = await supabase
        .from("questions")
        .select("*")
        .eq("group_id", grp.id);

      const qList = questions || [];
      totalQuestionsCount += qList.length;

      if (qList.length === 0) {
        warnings.push(`Group '${grp.title}' in section '${sec.title}' has 0 questions`);
      }

      for (const q of qList) {
        if (q.question_text && q.question_text.trim() === "Question Item") {
          cleanlinessPoints = Math.max(0, cleanlinessPoints - 1);
          warnings.push(`Question [${q.id}] contains placeholder text 'Question Item'`);
          actionableRemedies.push({
            type: "EDIT_QUESTION_TEXT",
            questionId: q.id,
            message: `Replace placeholder 'Question Item' with actual question text`
          });
        }

        if (q.question_text && q.question_text.includes("NULL")) {
          cleanlinessPoints = Math.max(0, cleanlinessPoints - 1);
          warnings.push(`Question [${q.id}] contains raw string 'NULL'`);
        }
      }
    }
  }

  if (totalQuestionsCount === 0) {
    questionPoints = 0;
    criticalErrors.push("Exam contains 0 total questions");
    actionableRemedies.push({ type: "ADD_QUESTIONS", message: "Add questions to question groups" });
  }

  // Calculate Weighted Score
  let score = audioPoints + passagePoints + questionPoints + cleanlinessPoints + samplePoints;

  // Critical Invariant Override: Any critical error FORCES QA Status to BROKEN regardless of score!
  let qaStatus = "VERIFIED";
  if (criticalErrors.length > 0) {
    qaStatus = "BROKEN";
  } else if (score < 50) {
    qaStatus = "BROKEN";
  } else if (score < 85) {
    qaStatus = "NEEDS_REVIEW";
  } else if (score < 100) {
    qaStatus = "IMPORTED";
  } else {
    qaStatus = "VERIFIED";
  }

  return {
    examId: exam.id,
    examTitle: exam.title,
    courseTitle: exam.courses?.title || "Unknown Course",
    week: exam.week,
    score,
    qaStatus,
    criticalErrors,
    warnings,
    actionableRemedies
  };
}

export async function runFullAudit() {
  console.log("=== RUNNING FULL CONTENT INFRASTRUCTURE QA AUDIT ===");
  const { data: courses } = await supabase.from("courses").select("id, title").order("title");

  const results = [];
  for (const course of (courses || [])) {
    const { data: exams } = await supabase
      .from("exams")
      .select("id")
      .eq("course_id", course.id)
      .order("week");

    for (const exam of (exams || [])) {
      const res = await validateExamContent(exam.id);
      results.push(res);
    }
  }

  return results;
}
