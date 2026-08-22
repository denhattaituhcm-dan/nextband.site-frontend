/**
 * Canonical Progress Report Data Types
 * Strict Contract: Every field is verified and nullable if absent in DB.
 * Zero speculative data (no fake 4-skill bands, no fake certificates).
 */

export interface ProgressReportData {
  student: {
    name: string;
    className: string;
    teacherName: string;
  };

  period: {
    from: string; // DD/MM/YYYY
    to: string;   // DD/MM/YYYY
  };

  // Rendered ONLY if attendance records exist in the database
  attendance?: {
    present: number;
    absent: number;
    total: number;
  } | null;

  homework: {
    submitted: number;
    pending: number;
    overdue: number;
    overdueTitles: string[];
  };

  // Max 3 recent submissions ordered by gradedAt DESC
  recentResults: Array<{
    title: string;
    score: number | string | null;
  }>;

  teacherNote: string;
  generatedAt: string; // DD/MM/YYYY
}
