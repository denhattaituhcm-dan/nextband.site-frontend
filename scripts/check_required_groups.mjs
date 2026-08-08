import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://gzpdlqxjggyxlkeatvvf.supabase.co";
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cGRscXhqZ2d5eGxrZWF0dnZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyOTc3NjMsImV4cCI6MjEwMDg3Mzc2M30.M7uMAo2qJCDQtxQMP-_58VKF1LfSBdwR31gpvqcCN6I";

const supabase = createClient(supabaseUrl, supabaseKey);

const required6GroupIds = [
  "33ecdbaa-fb31-4554-aebb-567bfd0eddb7",
  "3ae2d6c2-303d-4883-8839-05044f952f54",
  "ef21db03-ea09-401d-999f-91f7fdb7d2d5",
  "54d55784-1f9e-4b28-849c-12bb014f9d78",
  "6dfab062-004f-401b-8ae8-51ad73c7f013",
  "85c7d5b8-c606-4c33-8faf-35cbbc0175b8",
];

async function checkGroupStatus() {
  const { data: targetGroups } = await supabase.from("question_groups").select("id");
  const targetGroupIdsSet = new Set((targetGroups || []).map((g) => g.id));

  console.log("Group Existence Check:");
  for (const gId of required6GroupIds) {
    console.log(`  Group ${gId}: ${targetGroupIdsSet.has(gId) ? "EXISTS" : "MISSING"}`);
  }
}

checkGroupStatus();
