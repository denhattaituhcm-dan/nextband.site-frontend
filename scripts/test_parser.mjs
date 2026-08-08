import fs from "fs";
import path from "path";

const sqlPath = path.join(process.cwd(), "..", "nextband_backup.sql");
const content = fs.readFileSync(sqlPath, "utf-8");

// Extract the line starting with "INSERT INTO `questions` VALUES"
const lines = content.split("\n");
const qLine = lines.find(l => l.startsWith("INSERT INTO `questions` VALUES"));

console.log("Found Q Line, length:", qLine ? qLine.length : 0);

function extractQuestions(line) {
  // Line format: INSERT INTO `questions` VALUES ('id','group_id','type','text','options','correct',...), (...);
  const prefix = "INSERT INTO `questions` VALUES ";
  if (!line.startsWith(prefix)) return [];
  let raw = line.slice(prefix.length).trim();
  if (raw.endsWith(";")) raw = raw.slice(0, -1);

  const questions = new Map();
  let i = 0;
  
  while (i < raw.length) {
    if (raw[i] !== '(') {
      i++;
      continue;
    }
    
    // Parse tuple fields
    i++; // skip '('
    const fields = [];
    let currentField = "";
    let inString = false;
    let quoteChar = "";
    
    while (i < raw.length) {
      const char = raw[i];
      
      if (inString) {
        if (char === '\\') {
          // escaped char
          currentField += raw[i + 1] || "";
          i += 2;
          continue;
        }
        if (char === quoteChar) {
          inString = false;
          i++;
          continue;
        }
        currentField += char;
        i++;
        continue;
      }
      
      if (char === "'" || char === '"') {
        inString = true;
        quoteChar = char;
        i++;
        continue;
      }
      
      if (char === ',') {
        fields.push(currentField.trim());
        currentField = "";
        i++;
        continue;
      }
      
      if (char === ')') {
        fields.push(currentField.trim());
        i++;
        break;
      }
      
      currentField += char;
      i++;
    }
    
    if (fields.length >= 6) {
      const id = fields[0];
      questions.set(id, {
        id: fields[0],
        group_id: fields[1],
        question_type: fields[2],
        question_text: fields[3],
        options: fields[4],
        correct_answer: fields[5],
        points: fields[6],
        order_index: fields[7],
      });
    }
  }
  
  return questions;
}

const questionsMap = extractQuestions(qLine);
console.log("Extracted Questions Count:", questionsMap.size);

// Test target placeholder ID lookup
const testTargetId = "00d76f65-dd5f-4dc1-98de-8c235f37f834";
console.log(`Lookup ${testTargetId}:`, questionsMap.get(testTargetId));
