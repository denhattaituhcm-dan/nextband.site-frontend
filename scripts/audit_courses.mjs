import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gzpdlqxjggyxlkeatvvf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cGRscXhqZ2d5eGxrZWF0dnZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyOTc3NjMsImV4cCI6MjEwMDg3Mzc2M30.M7uMAo2qJCDQtxQMP-_58VKF1LfSBdwR31gpvqcCN6I";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runAudit() {
  console.log("=========================================");
  console.log("📊 AUDITING COURSES & EXAM SECTIONS IN DB");
  console.log("=========================================");

  // 1. Fetch all courses
  const { data: courses, error: cErr } = await supabase
    .from("courses")
    .select("id, title, level, slug");

  if (cErr) {
    console.error("Error fetching courses:", cErr);
    return;
  }

  console.log(`Found ${courses.length} courses:\n`);

  for (const course of courses) {
    console.log(`-----------------------------------------`);
    console.log(`📚 Course: [${course.title}] (ID: ${course.id}, Level: ${course.level})`);

    // Fetch exams for this course
    const { data: exams, error: eErr } = await supabase
      .from("exams")
      .select("id, title, week, exam_type, exam_sections(id, section_type, title, order_index)")
      .eq("course_id", course.id)
      .order("week", { ascending: true });

    if (eErr) {
      console.error(`  Error fetching exams:`, eErr.message);
      continue;
    }

    if (!exams || exams.length === 0) {
      console.log(`  ⚠️ No exams/homeworks attached in DB.`);
      continue;
    }

    console.log(`  Total Exams/Homeworks in DB: ${exams.length}`);
    
    let skillCounts = {
      skills_4: 0,
      skills_3: 0,
      skills_2: 0,
      skills_1: 0,
      skills_0: 0,
    };

    let sectionTypeDistribution = {};

    exams.forEach((exam, idx) => {
      const sections = exam.exam_sections || [];
      const sectionTypes = Array.from(new Set(sections.map(s => s.section_type)));
      const count = sectionTypes.length;

      if (count === 4) skillCounts.skills_4++;
      else if (count === 3) skillCounts.skills_3++;
      else if (count === 2) skillCounts.skills_2++;
      else if (count === 1) skillCounts.skills_1++;
      else skillCounts.skills_0++;

      sectionTypes.forEach(st => {
        sectionTypeDistribution[st] = (sectionTypeDistribution[st] || 0) + 1;
      });

      console.log(`    HW #${exam.week || idx + 1}: "${exam.title}" -> ${sections.length} sections [${sectionTypes.join(", ") || "None"}]`);
    });

    console.log(`\n  Summary for [${course.title}]:`);
    console.log(`    - 4 skills: ${skillCounts.skills_4}`);
    console.log(`    - 3 skills: ${skillCounts.skills_3}`);
    console.log(`    - 2 skills: ${skillCounts.skills_2}`);
    console.log(`    - 1 skill:  ${skillCounts.skills_1}`);
    console.log(`    - 0 skills: ${skillCounts.skills_0}`);
    console.log(`    - Section Breakdown:`, sectionTypeDistribution);
  }

  // Also query all exam_sections globally
  const { data: allSections } = await supabase.from("exam_sections").select("section_type");
  if (allSections) {
    const globalDist = {};
    allSections.forEach(s => globalDist[s.section_type] = (globalDist[s.section_type] || 0) + 1);
    console.log("\n=========================================");
    console.log("🌐 GLOBAL EXAM SECTIONS DISTRIBUTION:");
    console.log(globalDist);
    console.log("=========================================");
  }
}

runAudit();
