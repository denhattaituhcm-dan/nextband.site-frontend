/**
 * Canonical Submission Status Normalization & Domain Helper
 * Single Source of Truth for submission lifecycle states across NextBand.
 */

export type CanonicalSubmissionStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "GRADED"
  | "EXPIRED"
  | "ABANDONED";

/**
 * Normalizes any raw status string (uppercase/lowercase/legacy) into a canonical SubmissionStatus.
 */
export function normalizeSubmissionStatus(
  status?: string | null,
): CanonicalSubmissionStatus {
  if (!status) return "IN_PROGRESS";
  const normalized = status.trim().toUpperCase();
  switch (normalized) {
    case "GRADED":
      return "GRADED";
    case "SUBMITTED":
    case "GRADING":
      return "SUBMITTED";
    case "EXPIRED":
      return "EXPIRED";
    case "ABANDONED":
      return "ABANDONED";
    case "IN_PROGRESS":
    default:
      return "IN_PROGRESS";
  }
}

export function isSubmissionGraded(status?: string | null): boolean {
  return normalizeSubmissionStatus(status) === "GRADED";
}

export function isSubmissionSubmitted(status?: string | null): boolean {
  return normalizeSubmissionStatus(status) === "SUBMITTED";
}

export function isSubmissionCompleted(status?: string | null): boolean {
  const norm = normalizeSubmissionStatus(status);
  return norm === "GRADED" || norm === "SUBMITTED";
}
