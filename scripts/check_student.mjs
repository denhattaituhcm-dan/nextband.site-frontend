import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gzpdlqxjggyxlkeatvvf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cGRscXhqZ2d5eGxrZWF0dnZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyOTc3NjMsImV4cCI6MjEwMDg3Mzc2M30.M7uMAo2qJCDQtxQMP-_58VKF1LfSBdwR31gpvqcCN6I";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkStudent() {
  console.log("=================================================");
  console.log("🔍 CHECKING RECORDS FOR bestcanthocity@gmail.com");
  console.log("=================================================");

  // 1. Check Profiles by ilike
  const { data: profs } = await supabase
    .from("profiles")
    .select("*")
    .ilike("email", "%bestcanthocity%");

  console.log("Profiles found via ilike:", profs);

  const { data: allProfs } = await supabase
    .from("profiles")
    .select("id, user_id, email, full_name");

  console.log("\nAll profiles in DB:", allProfs);

  if (profs && profs.length > 0) {
    const studentIds = profs.map(p => p.user_id || p.id);

    // 2. Check class_students
    const { data: csList } = await supabase
      .from("class_students")
      .select("*, classes(*, courses(*))")
      .in("student_id", studentIds);

    console.log("\nclass_students rows found:", csList);

    // 3. Check enrollments
    const { data: enList } = await supabase
      .from("enrollments")
      .select("*, courses(*)")
      .in("student_id", studentIds);

    console.log("\nenrollments rows found:", enList);
  }
}

checkStudent();
