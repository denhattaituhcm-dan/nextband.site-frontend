import { describe, it, expect } from "vitest";
import { normalizeSectionData, normalizeCourseData } from "@/lib/api";

describe("Data Layer Contract Tests (Phase G Guardrails)", () => {
  it("Read Mapper (normalizeSectionData) converts snake_case DB object to pure camelCase Frontend Model", () => {
    const rawDbSection = {
      id: "sec-101",
      exam_id: "exam-999",
      section_type: "listening",
      title: "Listening Test 1",
      instructions: "Listen carefully",
      content: [],
      audio_url: "/uploads/audio/test.mp3",
      audio_script: "Audio text script",
      duration_minutes: 30,
      order_index: 0,
      question_groups: [
        {
          id: "grp-1",
          section_id: "sec-101",
          title: "Part 1",
          passage: null,
          instructions: "Fill in the blanks",
          audio_url: "/uploads/audio/part1.mp3",
          order_index: 1,
          questions: [
            {
              id: "q-1",
              group_id: "grp-1",
              question_type: "fill_blank",
              question_text: "Name: [1]",
              options: null,
              correct_answer: "John",
              audio_url: null,
              points: 1,
              order_index: 1,
            },
          ],
        },
      ],
    };

    const normalized = normalizeSectionData(rawDbSection);

    // Verify Section camelCase conversion
    expect(normalized.id).toBe("sec-101");
    expect(normalized.examId).toBe("exam-999");
    expect(normalized.sectionType).toBe("listening");
    expect(normalized.audioScript).toBe("Audio text script");
    expect(normalized.durationMinutes).toBe(30);
    expect(normalized.orderIndex).toBe(0);

    // Verify Question Groups nested camelCase conversion
    expect(normalized.questionGroups).toHaveLength(1);
    const group = normalized.questionGroups[0];
    expect(group.id).toBe("grp-1");
    expect(group.sectionId).toBe("sec-101");
    expect(group.orderIndex).toBe(1);

    // Verify Questions nested camelCase conversion
    expect(group.questions).toHaveLength(1);
    const question = group.questions[0];
    expect(question.id).toBe("q-1");
    expect(question.groupId).toBe("grp-1");
    expect(question.questionType).toBe("fill_blank");
    expect(question.questionText).toBe("Name: [1]");
    expect(question.correctAnswer).toBe("John");

    // Verify Semantics Safety (null stays null)
    expect(question.audioUrl).toBeNull();
  });

  it("Read Mapper (normalizeCourseData) converts snake_case course to Frontend Model", () => {
    const rawDbCourse = {
      id: "crs-1",
      title: "MASTER",
      description: "Master Course",
      thumbnail_url: "http://example.com/thumb.jpg",
      level: "beginner",
      price: 100,
      is_published: true,
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
    };

    const normalized = normalizeCourseData(rawDbCourse);

    expect(normalized.id).toBe("crs-1");
    expect(normalized.thumbnailUrl).toBe("http://example.com/thumb.jpg");
    expect(normalized.isPublished).toBe(true);
    expect(normalized.isActive).toBe(true);
    expect(normalized.createdAt).toBe("2026-01-01T00:00:00Z");
  });
});
