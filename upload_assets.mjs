import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const SUPABASE_URL = "https://gzpdlqxjggyxlkeatvvf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cGRscXhqZ2d5eGxrZWF0dnZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyOTc3NjMsImV4cCI6MjEwMDg3Mzc2M30.M7uMAo2qJCDQtxQMP-_58VKF1LfSBdwR31gpvqcCN6I";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const AUDIO_DIR = "d:\\handover\\ielts\\ielts-be\\uploads\\audio";
const IMAGES_DIR = "d:\\handover\\ielts\\ielts-be\\uploads\\images";

async function uploadDirectory(localDir, targetSubfolder) {
  if (!fs.existsSync(localDir)) {
    console.log(`Directory not found: ${localDir}`);
    return;
  }

  const files = fs.readdirSync(localDir);
  console.log(`Found ${files.length} files in ${localDir}`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(localDir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) continue;

    const fileBuffer = fs.readFileSync(filePath);
    const storagePath = `${targetSubfolder}/${file}`;

    console.log(`[${i + 1}/${files.length}] Uploading ${file} (${Math.round(stat.size / 1024)} KB)...`);

    const { data, error } = await supabase.storage
      .from("exam-assets")
      .upload(storagePath, fileBuffer, {
        upsert: true,
        contentType: file.endsWith(".mp3")
          ? "audio/mpeg"
          : file.endsWith(".wav")
          ? "audio/wav"
          : file.endsWith(".webm")
          ? "audio/webm"
          : file.endsWith(".png")
          ? "image/png"
          : file.endsWith(".jpg") || file.endsWith(".jpeg")
          ? "image/jpeg"
          : "application/octet-stream",
      });

    if (error) {
      console.error(`❌ Failed: ${file}`, error.message);
      failCount++;
    } else {
      console.log(`✅ Success: ${storagePath}`);
      successCount++;
    }
  }

  console.log(`\n🎉 Completed ${targetSubfolder}: ${successCount} success, ${failCount} failed.`);
}

async function main() {
  console.log("🚀 Starting Media Assets Migration to Supabase Storage...");
  await uploadDirectory(AUDIO_DIR, "audio");
  await uploadDirectory(IMAGES_DIR, "images");
}

main();
