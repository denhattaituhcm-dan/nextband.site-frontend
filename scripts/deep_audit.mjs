import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gzpdlqxjggyxlkeatvvf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cGRscXhqZ2d5eGxrZWF0dnZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyOTc3NjMsImV4cCI6MjEwMDg3Mzc2M30.M7uMAo2qJCDQtxQMP-_58VKF1LfSBdwR31gpvqcCN6I";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function deepAudit() {
  console.log("==========================================================================");
  console.log("🔍 DEEP DATABASE AUDIT: COURSES, EXAMS, SECTIONS, GROUPS, QUESTIONS");
  console.log("==========================================================================");

  // 1. Fetch ALL courses
  const { data: courses } = await supabase.from("courses").select("*");
  console.log(`\n1. COURSES TABLE (${courses?.length || 0} rows):`);
  courses?.forEach(c => console.log(`   - [${c.title}] ID: ${c.id} | Level: ${c.level} | Published: ${c.is_published} | Active: ${c.is_active}`));

  // 2. Fetch ALL exams unconditionally (no filter on is_published or is_active)
  const { data: allExams } = await supabase.from("exams").select("*");
  console.log(`\n2. TOTAL EXAMS IN DB (${allExams?.length || 0} rows):`);

  // Group exams by course_id
  const examsByCourse = {};
  allExams?.forEach(e => {
    const cid = e.course_id || "ORPHAN (NULL)";
    if (!examsByCourse[cid]) examsByCourse[cid] = [];
    examsByCourse[cid].push(e);
  });

  for (const [cid, exList] of Object.entries(examsByCourse)) {
    const courseObj = courses?.find(c => c.id === cid);
    const courseTitle = courseObj ? courseObj.title : (cid === "ORPHAN (NULL)" ? "ORPHAN (NULL)" : cid);
    console.log(`\n  📌 Course: [${courseTitle}] -> Total Exams: ${exList.length}`);
    exList.forEach((e, idx) => {
      console.log(`     - Exam #${idx + 1} (Week ${e.week}): "${e.title}" | ID: ${e.id} | Type: ${e.exam_type} | Active: ${e.is_active} | Published: ${e.is_published}`);
    });
  }

  // 3. Fetch ALL exam_sections
  const { data: allSections } = await supabase.from("exam_sections").select("*");
  console.log(`\n3. TOTAL EXAM_SECTIONS IN DB (${allSections?.length || 0} rows):`);

  // Group sections by exam_id
  const sectionsByExam = {};
  allSections?.forEach(s => {
    if (!sectionsByExam[s.exam_id]) sectionsByExam[s.exam_id] = [];
    sectionsByExam[s.exam_id].push(s);
  });

  // 4. Fetch Question Groups & Questions count
  const { data: allGroups } = await supabase.from("question_groups").select("id, section_id");
  const { data: allQuestions } = await supabase.from("questions").select("id, group_id");

  console.log(`\n4. ENTITY COUNTS OVERVIEW:`);
  console.log(`   - Courses: ${courses?.length || 0}`);
  console.log(`   - Exams: ${allExams?.length || 0}`);
  console.log(`   - Exam Sections: ${allSections?.length || 0}`);
  console.log(`   - Question Groups: ${allGroups?.length || 0}`);
  console.log(`   - Questions: ${allQuestions?.length || 0}`);

  // 5. DETAILED ACTIVITY DISTRIBUTION THONG KE (Per Course & Per Exam)
  console.log("\n==========================================================================");
  console.log("📊 DETAILED ACTIVITY DISTRIBUTION PER HOMEWORK/EXAM:");
  console.log("==========================================================================");

  let activityHistogram = {
    act_1: 0,
    act_2: 0,
    act_3: 0,
    act_4: 0,
    act_5_plus: 0,
    act_0: 0,
  };

  let totalAuditedHomeworks = 0;

  for (const course of courses || []) {
    const cExams = allExams?.filter(e => e.course_id === course.id) || [];
    console.log(`\n📚 Course: [${course.title}] (Total ${cExams.length} Exams in DB):`);
    
    if (cExams.length === 0) {
      console.log(`   (No exams in DB for this course)`);
      continue;
    }

    cExams.sort((a, b) => (a.week || 0) - (b.week || 0));

    cExams.forEach((e, idx) => {
      totalAuditedHomeworks++;
      const secs = sectionsByExam[e.id] || [];
      const sectionTypes = secs.map(s => s.section_type);
      const uniqueTypes = Array.from(new Set(sectionTypes));
      const activityCount = uniqueTypes.length;

      if (activityCount === 1) activityHistogram.act_1++;
      else if (activityCount === 2) activityHistogram.act_2++;
      else if (activityCount === 3) activityHistogram.act_3++;
      else if (activityCount === 4) activityHistogram.act_4++;
      else if (activityCount >= 5) activityHistogram.act_5_plus++;
      else activityHistogram.act_0++;

      console.log(`   HW ${String(idx + 1).padStart(2, "0")} (W${e.week || 1}): "${e.title}" -> ${secs.length} sections (${activityCount} unique skills: [${uniqueTypes.join(", ")}])`);
    });
  }

  console.log("\n==========================================================================");
  console.log("📈 FINAL STATISTICAL DISTRIBUTION OF ACTIVITIES PER HOMEWORK:");
  console.log("==========================================================================");
  console.log(`Total Audited Homeworks across all courses: ${totalAuditedHomeworks}`);
  
  if (totalAuditedHomeworks > 0) {
    const pct1 = ((activityHistogram.act_1 / totalAuditedHomeworks) * 100).toFixed(1);
    const pct2 = ((activityHistogram.act_2 / totalAuditedHomeworks) * 100).toFixed(1);
    const pct3 = ((activityHistogram.act_3 / totalAuditedHomeworks) * 100).toFixed(1);
    const pct4 = ((activityHistogram.act_4 / totalAuditedHomeworks) * 100).toFixed(1);
    const pct5 = ((activityHistogram.act_5_plus / totalAuditedHomeworks) * 100).toFixed(1);
    const pct0 = ((activityHistogram.act_0 / totalAuditedHomeworks) * 100).toFixed(1);

    console.log(`  - 1 Activity:  ${activityHistogram.act_1} (${pct1}%)`);
    console.log(`  - 2 Activities: ${activityHistogram.act_2} (${pct2}%)`);
    console.log(`  - 3 Activities: ${activityHistogram.act_3} (${pct3}%)`);
    console.log(`  - 4 Activities: ${activityHistogram.act_4} (${pct4}%)`);
    console.log(`  - 5+ Activities: ${activityHistogram.act_5_plus} (${pct5}%)`);
    console.log(`  - 0 Activities: ${activityHistogram.act_0} (${pct0}%)`);
  }
}

deepAudit();
