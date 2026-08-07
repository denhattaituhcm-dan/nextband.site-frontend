import { describe, it, expect } from "vitest";
import { evaluateContentContract, isPlaceholderText } from "./contentContract";

describe("Content Contract Engine", () => {
  it("detects placeholder texts accurately", () => {
    expect(isPlaceholderText("Question Item")).toBe(true);
    expect(isPlaceholderText("NULL")).toBe(true);
    expect(isPlaceholderText("lorem ipsum dolor")).toBe(true);
    expect(isPlaceholderText("TODO: add prompt")).toBe(true);
    expect(isPlaceholderText("Translate the following sentence to English.")).toBe(false);
  });

  it("evaluates valid listening exam as READY", () => {
    const validExam = {
      id: "exam-1",
      title: "IELTS Listening Practice",
      sections: [
        {
          id: "sec-1",
          sectionType: "listening",
          title: "Listening Section",
          audioUrl: "https://example.com/audio.mp3",
          questionGroups: [
            {
              id: "grp-1",
              questions: [
                {
                  id: "q-1",
                  questionText: "What is the capital of France?",
                  questionType: "multiple_choice",
                },
              ],
            },
          ],
        },
      ],
    };

    const result = evaluateContentContract(validExam);
    expect(result.status).toBe("READY");
    expect(result.isReady).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("flags exam with 'Question Item' placeholder as INVALID", () => {
    const invalidExam = {
      id: "exam-2",
      title: "Broken Translation Practice",
      sections: [
        {
          id: "sec-2",
          sectionType: "general",
          title: "Controlled Translation",
          questionGroups: [
            {
              id: "grp-2",
              questions: [
                {
                  id: "q-broken-1",
                  questionText: "Question Item",
                  questionType: "short_answer",
                },
              ],
            },
          ],
        },
      ],
    };

    const result = evaluateContentContract(invalidExam);
    expect(result.status).toBe("INVALID");
    expect(result.isReady).toBe(false);
    expect(result.violations.some((v) => v.ruleId === "QUESTION_TEXT_PLACEHOLDER")).toBe(true);
  });

  it("flags listening exam without audio as INVALID", () => {
    const noAudioExam = {
      id: "exam-3",
      title: "Missing Audio Listening",
      sections: [
        {
          id: "sec-3",
          sectionType: "listening",
          title: "Listening",
          questionGroups: [
            {
              id: "grp-3",
              questions: [{ id: "q-2", questionText: "Listen and choose." }],
            },
          ],
        },
      ],
    };

    const result = evaluateContentContract(noAudioExam);
    expect(result.status).toBe("INVALID");
    expect(result.violations.some((v) => v.ruleId === "LISTENING_MISSING_AUDIO")).toBe(true);
  });
});
