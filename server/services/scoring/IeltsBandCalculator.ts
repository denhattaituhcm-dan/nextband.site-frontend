/**
 * Official IELTS Band Score Calculator
 * Standard conversion table for IELTS Listening and Reading (General & Academic)
 */

export type IeltsSectionType = "listening" | "reading_academic" | "reading_general";

export class IeltsBandCalculator {
  /**
   * Converts raw score (number of correct answers out of 40) to IELTS Band Score (0.0 - 9.0)
   */
  public static calculateBandScore(rawCorrectCount: number, sectionType: IeltsSectionType = "listening"): number {
    const score = Math.max(0, Math.min(40, Math.round(rawCorrectCount)));

    if (sectionType === "listening") {
      if (score >= 39) return 9.0;
      if (score >= 37) return 8.5;
      if (score >= 35) return 8.0;
      if (score >= 32) return 7.5;
      if (score >= 30) return 7.0;
      if (score >= 26) return 6.5;
      if (score >= 23) return 6.0;
      if (score >= 18) return 5.5;
      if (score >= 16) return 5.0;
      if (score >= 13) return 4.5;
      if (score >= 10) return 4.0;
      if (score >= 8) return 3.5;
      if (score >= 6) return 3.0;
      if (score >= 4) return 2.5;
      if (score >= 3) return 2.0;
      if (score >= 1) return 1.0;
      return 0.0;
    }

    if (sectionType === "reading_academic") {
      if (score >= 39) return 9.0;
      if (score >= 37) return 8.5;
      if (score >= 35) return 8.0;
      if (score >= 33) return 7.5;
      if (score >= 30) return 7.0;
      if (score >= 27) return 6.5;
      if (score >= 23) return 6.0;
      if (score >= 19) return 5.5;
      if (score >= 15) return 5.0;
      if (score >= 13) return 4.5;
      if (score >= 10) return 4.0;
      if (score >= 8) return 3.5;
      if (score >= 6) return 3.0;
      if (score >= 4) return 2.5;
      if (score >= 3) return 2.0;
      if (score >= 1) return 1.0;
      return 0.0;
    }

    // reading_general
    if (score >= 40) return 9.0;
    if (score >= 39) return 8.5;
    if (score >= 37) return 8.0;
    if (score >= 36) return 7.5;
    if (score >= 34) return 7.0;
    if (score >= 32) return 6.5;
    if (score >= 30) return 6.0;
    if (score >= 27) return 5.5;
    if (score >= 23) return 5.0;
    if (score >= 19) return 4.5;
    if (score >= 15) return 4.0;
    if (score >= 12) return 3.5;
    if (score >= 9) return 3.0;
    if (score >= 6) return 2.5;
    if (score >= 4) return 2.0;
    if (score >= 1) return 1.0;
    return 0.0;
  }

  /**
   * Calculates estimated band score based on percentage (for custom tests with < 40 questions)
   */
  public static calculateEstimatedBand(percentage: number): number {
    const raw40Equivalent = (Math.max(0, Math.min(100, percentage)) / 100) * 40;
    return this.calculateBandScore(raw40Equivalent, "listening");
  }
}
