import { ITextNormalizer } from "./types.js";

export class TextNormalizer implements ITextNormalizer {
  /**
   * Universal text normalization for IELTS answer matching
   * - Strips leading/trailing whitespace
   * - Collapses consecutive whitespace characters into a single space
   * - Strips trailing/leading peripheral punctuation (. , ! ? ; :)
   * - Lowercases text for uniform case-insensitive comparison
   */
  public normalizeText(raw: unknown): string {
    if (raw === null || raw === undefined) return "";
    let str = typeof raw === "string" ? raw : String(raw);

    // Trim whitespace
    str = str.trim();
    if (!str) return "";

    // Collapse multi-spaces and newlines into single space
    str = str.replace(/\s+/g, " ");

    // Lowercase
    str = str.toLowerCase();

    // Strip leading and trailing punctuation (except parentheses or brackets)
    // E.g., "office." -> "office", " 'hello' " -> "hello"
    str = str.replace(/^[.,!?:;"'“”‘’]+|[.,!?:;"'“”‘’]+$/g, "");

    return str.trim();
  }

  /**
   * Normalizes accepted alternative answers separated by "|"
   * Handles optional parenthetical words like "(a) car" or "(the) station"
   */
  public normalizeAlternatives(raw: unknown): string[] {
    if (raw === null || raw === undefined) return [];
    const str = typeof raw === "string" ? raw : String(raw);
    if (!str.trim()) return [];

    const rawParts = str.split("|").map((p) => p.trim()).filter(Boolean);
    const results = new Set<string>();

    for (const part of rawParts) {
      const normalized = this.normalizeText(part);
      if (normalized) {
        results.add(normalized);

        // Expand optional parentheses: "(a) car" -> "a car" AND "car"
        if (normalized.includes("(") && normalized.includes(")")) {
          const withoutParens = normalized.replace(/[()]/g, "").replace(/\s+/g, " ").trim();
          const withoutOptional = normalized.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
          if (withoutParens) results.add(withoutParens);
          if (withoutOptional) results.add(withoutOptional);
        }
      }
    }

    return Array.from(results);
  }

  /**
   * Converts option representation ('A', 'B', '0', 0, 1) to a 0-based integer index
   */
  public normalizeOptionIndex(val: unknown): number | null {
    if (val === null || val === undefined) return null;
    if (typeof val === "number" && Number.isInteger(val) && val >= 0) {
      return val;
    }
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (/^\d+$/.test(trimmed)) {
        return parseInt(trimmed, 10);
      }
      if (/^[A-Za-z]$/.test(trimmed)) {
        return trimmed.toUpperCase().charCodeAt(0) - 65;
      }
    }
    return null;
  }

  /**
   * Safely parses JSON strings, returns fallback if parsing fails
   */
  public parseJsonSafe<T = any>(val: unknown, fallback: T = {} as T): T {
    if (val === null || val === undefined) return fallback;
    if (typeof val === "object") return val as T;
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return fallback;
      }
    }
    return fallback;
  }

  /**
   * Evaluates equivalence between a student string and correct answer expression (with alternatives)
   */
  public areEquivalent(studentText: unknown, correctText: unknown): boolean {
    const studentNorm = this.normalizeText(studentText);
    if (!studentNorm) return false;

    const alternatives = this.normalizeAlternatives(correctText);
    if (alternatives.length === 0) {
      return false;
    }

    return alternatives.includes(studentNorm);
  }
}

export const defaultTextNormalizer = new TextNormalizer();
