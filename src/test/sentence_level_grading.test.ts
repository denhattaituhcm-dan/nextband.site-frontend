import { describe, it, expect } from "vitest";
import {
  segmentEssayIntoSentences,
  parseStructuredFeedback,
  serializeStructuredFeedback,
  PRESET_ERROR_TAGS,
  SentenceFeedbackItem,
} from "@/lib/sentenceFeedback";
import { diffWords, diffSentences } from "diff";

describe("🎯 Sentence-Level Grading & Feedback Serialization Test Suite", () => {
  const sampleEssay = `Education is a cornerstone of modern society. However, many students struggle with academic pressure! Do schools provide enough support? In conclusion, balanced education is essential.`;

  it("1.1 should accurately segment essay text into distinct sentences", () => {
    const sentences = segmentEssayIntoSentences(sampleEssay);
    expect(sentences.length).toBe(4);
    expect(sentences[0]).toBe("Education is a cornerstone of modern society.");
    expect(sentences[1]).toBe("However, many students struggle with academic pressure!");
    expect(sentences[2]).toBe("Do schools provide enough support?");
    expect(sentences[3]).toBe("In conclusion, balanced education is essential.");
  });

  it("1.2 should handle single-line essays and edge case whitespace without crashing", () => {
    expect(segmentEssayIntoSentences("")).toEqual([]);
    expect(segmentEssayIntoSentences("   ")).toEqual([]);
    expect(segmentEssayIntoSentences("Single sentence without delimiter")).toEqual([
      "Single sentence without delimiter",
    ]);
  });

  it("1.3 should correctly serialize and parse structured sentence feedbacks", () => {
    const sentenceFeedbacks: SentenceFeedbackItem[] = [
      {
        sentenceIndex: 0,
        originalSentence: "Education is a cornerstone of modern society.",
        category: "GRAMMAR",
        tag: "Subject-Verb Agreement",
        note: "Check plural noun",
        suggestedSentence: "Education remains a cornerstone of modern society.",
      },
      {
        sentenceIndex: 1,
        originalSentence: "However, many students struggle with academic pressure!",
        category: "EXPRESSION",
        tag: "Word Choice / Collocation",
        note: "Avoid exclamation in academic writing",
      },
    ];

    const serialized = serializeStructuredFeedback({
      text: "Good essay overall, but needs revision.",
      primaryErrorCategory: "GRAMMAR",
      revisionRequired: true,
      criteriaScores: {
        taskResponse: 6.5,
        coherence: 6.0,
        lexical: 6.0,
        grammar: 5.5,
      },
      sentenceFeedbacks,
      tabSwitchCount: 2,
    });

    const parsed = parseStructuredFeedback(serialized);
    expect(parsed.text).toBe("Good essay overall, but needs revision.");
    expect(parsed.primaryErrorCategory).toBe("GRAMMAR");
    expect(parsed.revisionRequired).toBe(true);
    expect(parsed.criteriaScores?.taskResponse).toBe(6.5);
    expect(parsed.tabSwitchCount).toBe(2);
    expect(parsed.sentenceFeedbacks?.length).toBe(2);
    expect(parsed.sentenceFeedbacks?.[0].category).toBe("GRAMMAR");
    expect(parsed.sentenceFeedbacks?.[0].suggestedSentence).toBe(
      "Education remains a cornerstone of modern society."
    );
  });

  it("1.4 should gracefully parse raw string feedback (backward compatibility)", () => {
    const rawPlainString = "Bài viết tốt, chú ý từ vựng.";
    const parsed = parseStructuredFeedback(rawPlainString);
    expect(parsed.text).toBe("Bài viết tốt, chú ý từ vựng.");
    expect(parsed.sentenceFeedbacks).toEqual([]);
  });

  it("1.5 should contain verified preset tags for all 4 error categories", () => {
    expect(PRESET_ERROR_TAGS.GRAMMAR).toContain("Subject-Verb Agreement");
    expect(PRESET_ERROR_TAGS.EXPRESSION).toContain("Word Choice / Collocation");
    expect(PRESET_ERROR_TAGS.STRUCTURE).toContain("Missing Transition / Linking");
    expect(PRESET_ERROR_TAGS.CONCEPT).toContain("Idea Off-topic");
  });

  it("1.6 should correctly compute word diffs between Attempt 1 and Attempt 2", () => {
    const attempt1 = "The government should ban cars in cities.";
    const attempt2 = "The government ought to restrict private vehicles in urban areas.";

    const changes = diffWords(attempt1, attempt2);
    expect(changes.length).toBeGreaterThan(1);

    const hasAdded = changes.some((c) => c.added);
    const hasRemoved = changes.some((c) => c.removed);
    expect(hasAdded).toBe(true);
    expect(hasRemoved).toBe(true);
  });
});
