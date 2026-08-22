import { describe, it, expect } from "vitest";
import { parseSmartBulkQuestions } from "../smartQuestionParser";

describe("Smart Question Parser", () => {
  it("parses standard numbered questions with options", () => {
    const input = `
2. I ___ this book three times, but I still find it interesting.

a. read
b. am reading
c. have read
d. had read
    `;

    const result = parseSmartBulkQuestions(input);
    expect(result).toHaveLength(1);
    expect(result[0].questionNumber).toBe(2);
    expect(result[0].questionText).toBe("I ___ this book three times, but I still find it interesting.");
    expect(result[0].questionType).toBe("multiple_choice");
    expect(result[0].options).toEqual(["read", "am reading", "have read", "had read"]);
    expect(result[0].correctAnswer).toBeNull();
  });

  it("parses multiple numbered questions with answers", () => {
    const input = `
1. It's the first time I ___ sushi.
A. eat
B. ate
*C. have eaten
D. had eaten

2. She hasn't seen her cousin ___ last year.
A. since
B. for
C. in
D. from
Đáp án: A
    `;

    const result = parseSmartBulkQuestions(input);
    expect(result).toHaveLength(2);

    expect(result[0].questionNumber).toBe(1);
    expect(result[0].questionText).toBe("It's the first time I ___ sushi.");
    expect(result[0].options).toEqual(["eat", "ate", "have eaten", "had eaten"]);
    expect(result[0].correctAnswer).toBe("have eaten");

    expect(result[1].questionNumber).toBe(2);
    expect(result[1].questionText).toBe("She hasn't seen her cousin ___ last year.");
    expect(result[1].options).toEqual(["since", "for", "in", "from"]);
    expect(result[1].correctAnswer).toBe("since");
  });

  it("parses inline options on a single line", () => {
    const input = `
1. It's the first time I ___ sushi. A. eat  B. ate  C. have eaten  D. had eaten
2. She hasn't seen her cousin ___ last year. A. since  B. for  C. in  D. from
    `;

    const result = parseSmartBulkQuestions(input);
    expect(result).toHaveLength(2);
    expect(result[0].options).toEqual(["eat", "ate", "have eaten", "had eaten"]);
    expect(result[1].options).toEqual(["since", "for", "in", "from"]);
  });

  it("parses Vietnamese prefixed questions (Câu 1:, Câu 2:)", () => {
    const input = `
Câu 1: What is the capital of France?
A. London
B. Paris
C. Berlin
D. Rome
Answer: B

Câu 2: Where is Tokyo?
A. Japan
B. China
Key: A
    `;

    const result = parseSmartBulkQuestions(input);
    expect(result).toHaveLength(2);
    expect(result[0].questionText).toBe("What is the capital of France?");
    expect(result[0].correctAnswer).toBe("Paris");
    expect(result[1].questionText).toBe("Where is Tokyo?");
    expect(result[1].correctAnswer).toBe("Japan");
  });

  it("parses unnumbered short answer or speaking questions", () => {
    const input = `
Describe a person who has a big influence on you.
What are the qualities of a good leader?
    `;

    const result = parseSmartBulkQuestions(input, { sectionType: "speaking" });
    expect(result).toHaveLength(2);
    expect(result[0].questionText).toBe("Describe a person who has a big influence on you.");
    expect(result[0].questionType).toBe("speaking");
    expect(result[0].options).toBeNull();
  });

  it("parses True/False/Not Given questions automatically", () => {
    const input = `
1. The company was founded in 1990.
A. TRUE
B. FALSE
C. NOT GIVEN
Answer: A
    `;

    const result = parseSmartBulkQuestions(input);
    expect(result).toHaveLength(1);
    expect(result[0].questionType).toBe("true_false_not_given");
    expect(result[0].correctAnswer).toBe("TRUE");
  });
});
