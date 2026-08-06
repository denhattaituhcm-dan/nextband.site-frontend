import fs from "fs";
import path from "path";
import crypto from "crypto";

const SOURCE_AUDIO_DIR = "d:/handover/ielts/ielts-be/uploads/audio";
const SOURCE_IMAGE_DIR = "d:/handover/ielts/ielts-be/uploads/images";
const OUTPUT_DIR = "d:/handover/ielts/nextband/content_canonical";

function getSha256Checksum(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

export function runNormalizer() {
  console.log("==========================================================================");
  console.log("         LAYER 1 & 2: SOURCE NORMALIZER & MANIFEST GENERATOR              ");
  console.log("==========================================================================\n");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const manifest = {
    version: "v1.0.0",
    generated_at: new Date().toISOString(),
    assets: [],
    courses: []
  };

  // 1. Scan Audio Assets in ielts-be
  if (fs.existsSync(SOURCE_AUDIO_DIR)) {
    const audioFiles = fs.readdirSync(SOURCE_AUDIO_DIR);
    console.log(`Found ${audioFiles.length} raw audio files in ${SOURCE_AUDIO_DIR}`);

    audioFiles.forEach((file) => {
      const fullPath = path.join(SOURCE_AUDIO_DIR, file);
      const stat = fs.statSync(fullPath);
      const checksum = getSha256Checksum(fullPath);

      manifest.assets.push({
        asset_id: `audio-${file}`,
        type: "audio",
        checksum,
        size_bytes: stat.size,
        source_path: `uploads/audio/${file}`,
        mime: file.endsWith(".wav") ? "audio/wav" : file.endsWith(".webm") ? "audio/webm" : "audio/mpeg",
        status: "VERIFIED",
        last_verified: new Date().toISOString()
      });
    });
  }

  // 2. Scan Image Assets in ielts-be
  if (fs.existsSync(SOURCE_IMAGE_DIR)) {
    const imageFiles = fs.readdirSync(SOURCE_IMAGE_DIR);
    console.log(`Found ${imageFiles.length} raw image files in ${SOURCE_IMAGE_DIR}`);

    imageFiles.forEach((file) => {
      const fullPath = path.join(SOURCE_IMAGE_DIR, file);
      const stat = fs.statSync(fullPath);
      const checksum = getSha256Checksum(fullPath);

      manifest.assets.push({
        asset_id: `image-${file}`,
        type: "image",
        checksum,
        size_bytes: stat.size,
        source_path: `uploads/images/${file}`,
        mime: file.endsWith(".png") ? "image/png" : "image/jpeg",
        status: "VERIFIED",
        last_verified: new Date().toISOString()
      });
    });
  }

  // Save Canonical Content Manifest
  const manifestPath = path.join(OUTPUT_DIR, "content_manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nSaved Canonical Content Manifest to ${manifestPath} (${manifest.assets.length} Assets catalogued)`);

  return manifest;
}

if (process.argv[1] && process.argv[1].includes("normalizer.mjs")) {
  runNormalizer();
}
