import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://gzpdlqxjggyxlkeatvvf.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const AUDIO_DIR = process.env.AUDIO_DIR || "./uploads/audio";
const IMAGES_DIR = process.env.IMAGES_DIR || "./uploads/images";

async function uploadDirectory(localDir, targetSubfolder) {
  if (!fs.existsSync(localDir)) {
    console.log(`Directory not found: ${localDir}`);
    return;
  }

  const files = fs.readdirSync(localDir);
  console.log(`Found ${files.length} files in ${localDir}`);

  for (const file of files) {
    const filePath = path.join(localDir, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile()) {
      const fileBuffer = fs.readFileSync(filePath);
      const storagePath = `${targetSubfolder}/${file}`;

      const { data, error } = await supabase.storage
        .from("course-assets")
        .upload(storagePath, fileBuffer, {
          upsert: true,
        });

      if (error) {
        console.error(`Failed to upload ${file}:`, error.message);
      } else {
        console.log(`Uploaded ${file} -> ${storagePath}`);
      }
    }
  }
}

async function main() {
  console.log("🚀 Starting upload of local assets to Supabase Storage bucket 'course-assets'...");
  await uploadDirectory(AUDIO_DIR, "audio");
  await uploadDirectory(IMAGES_DIR, "images");
  console.log("🎉 Asset upload completed!");
}

main();
