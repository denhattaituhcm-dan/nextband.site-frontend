import { describe, it, expect } from "vitest";
import {
  FILL_BLANK_PLACEHOLDER_REGEX,
  hasFillBlankPlaceholders,
} from "../components/exam/FillBlankHtmlRenderer";
import { extractFillBlankTokens } from "../components/admin/question-forms/QuestionFormTypes";

describe("Fill-in-the-blank Natural Placeholder [N] Architectural Tests", () => {
  describe("Placeholder Detection: hasFillBlankPlaceholders", () => {
    it("detects natural [1], [2], [10] placeholders", () => {
      expect(hasFillBlankPlaceholders("I live in [1] which is a big city.")).toBe(true);
      expect(hasFillBlankPlaceholders("Focus: how to [1] and cook with [2] products")).toBe(true);
      expect(hasFillBlankPlaceholders("The [7] Centre is located near the [9].")).toBe(true);
      expect(hasFillBlankPlaceholders("Question with double digit [10] and [40].")).toBe(true);
    });

    it("maintains backward compatibility with [BLANK] and [BLANK_1] placeholders", () => {
      expect(hasFillBlankPlaceholders("I live in [BLANK] which is a big city.")).toBe(true);
      expect(hasFillBlankPlaceholders("how to 1 [BLANK_1] and cook with seasonal products")).toBe(true);
      expect(hasFillBlankPlaceholders("The 7 [BLANK_7] Centre")).toBe(true);
    });

    it("does not false-positive on option letters or non-numeric square brackets", () => {
      expect(hasFillBlankPlaceholders("Choose [A] or [B] or [C]")).toBe(false);
      expect(hasFillBlankPlaceholders("Mark [x] or [v]")).toBe(false);
      expect(hasFillBlankPlaceholders("This is normal text without brackets.")).toBe(false);
    });
  });

  describe("Token Extraction: extractFillBlankTokens", () => {
    it("extracts correct token count for [1], [2], [3]", () => {
      const text = "1. [1] is great. 2. [2] is better. 3. [3] is best.";
      const tokens = extractFillBlankTokens(text);
      expect(tokens.length).toBe(3);
      expect(tokens).toEqual(["[1]", "[2]", "[3]"]);
    });

    it("extracts tokens from user screenshot text using [BLANK_N] and [N]", () => {
      const legacyText = `
        how to 1 [BLANK_1] and cook with seasonal products
        also offers 2 [BLANK_2]
        clients who return get a 3 [BLANK_3] discount
        food that is 4 [BLANK_4]
        The 7 [BLANK_7] Centre
        mainly 8 [BLANK_8] food
        located near the 9 [BLANK_9]
        a special course in skills with a 10 [BLANK_10]
      `;
      expect(extractFillBlankTokens(legacyText).length).toBe(8);

      const naturalText = `
        how to [1] and cook with seasonal products
        also offers [2]
        clients who return get a [3] discount
        food that is [4]
        The [7] Centre
        mainly [8] food
        located near the [9]
        a special course in skills with a [10]
      `;
      const tokens = extractFillBlankTokens(naturalText);
      expect(tokens.length).toBe(8);
      expect(tokens).toEqual(["[1]", "[2]", "[3]", "[4]", "[7]", "[8]", "[9]", "[10]"]);
    });
  });

  describe("HTML Replacement & Slot Indexing", () => {
    it("correctly maps [1] -> index 0, [2] -> index 1, [7] -> index 6, [10] -> index 9", () => {
      const inputHtml = "<p>Cookery: [1] and also [2]. Location: [7] and [10].</p>";
      const replaced = inputHtml.replace(FILL_BLANK_PLACEHOLDER_REGEX, (_match, blankNum, directNum) => {
        const numStr = blankNum || directNum;
        const blankIndex = numStr ? Number(numStr) - 1 : -1;
        return `<span data-fill-blank="${blankIndex}" class="fill-blank-slot"></span>`;
      });

      expect(replaced).toContain('data-fill-blank="0"');
      expect(replaced).toContain('data-fill-blank="1"');
      expect(replaced).toContain('data-fill-blank="6"');
      expect(replaced).toContain('data-fill-blank="9"');
    });

    it("produces identical slot indices for legacy [BLANK_1] and natural [1]", () => {
      const legacy = "Item: [BLANK_1] and [BLANK_5]";
      const natural = "Item: [1] and [5]";

      const parseIndices = (html: string) => {
        const indices: number[] = [];
        html.replace(FILL_BLANK_PLACEHOLDER_REGEX, (_match, blankNum, directNum) => {
          const numStr = blankNum || directNum;
          indices.push(numStr ? Number(numStr) - 1 : -1);
          return "";
        });
        return indices;
      };

      expect(parseIndices(legacy)).toEqual([0, 4]);
      expect(parseIndices(natural)).toEqual([0, 4]);
    });

    it("correctly parses IELTS table completion HTML with [1] to [7]", () => {
      const tableHtml = `
        <table>
          <thead>
            <tr><th>Section of website</th><th>Comments</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Database of tourism services</td>
              <td>
                <ul>
                  <li>easy for tourism-related businesses to get on the list</li>
                  <li>allowed businesses to [1] information regularly</li>
                  <li>provided a country-wide evaluation of businesses, including their impact on the [2]</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td>Special features on local topics</td>
              <td>
                <ul>
                  <li>e.g. an interview with a former sports [3], and an interactive tour of various locations used in [4]</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td>Information on driving routes</td>
              <td>
                <ul><li>varied depending on the [5]</li></ul>
              </td>
            </tr>
            <tr>
              <td>Travel Planner</td>
              <td>
                <ul><li>included a map showing selected places, details of public transport and local [6]</li></ul>
              </td>
            </tr>
            <tr>
              <td>'Your Words'</td>
              <td>
                <ul><li>travelers could send a link to their [7]</li></ul>
              </td>
            </tr>
          </tbody>
        </table>
      `;

      expect(hasFillBlankPlaceholders(tableHtml)).toBe(true);
      const tokens = extractFillBlankTokens(tableHtml);
      expect(tokens).toEqual(["[1]", "[2]", "[3]", "[4]", "[5]", "[6]", "[7]"]);
      expect(tokens.length).toBe(7);
    });
  });
});
