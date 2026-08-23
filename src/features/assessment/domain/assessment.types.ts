/**
 * Domain Types for Clean-Room Assessment Engine
 * Zero LMS dependencies. Safe for client bundle (NO secret answer keys).
 */

export type AssessmentSkill = "listening" | "reading" | "grammar" | "writing" | "speaking";

export interface AssessmentQuestion {
  id: string;
  skill: AssessmentSkill;
  sectionTitle: string;
  questionType:
    | "multiple_choice"
    | "fill_blank"
    | "true_false_not_given"
    | "short_answer"
    | "matching"
    | "essay"
    | "text_area"
    | "audio_record";
  prompt: string;
  passageText?: string;
  audioUrl?: string;
  options?: string[];
  placeholder?: string;
  orderIndex: number;
  blankCount?: number;
}

export interface AssessmentTestStructure {
  testId: string;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  skills: {
    listening: {
      title: string;
      audioUrl: string;
      questions: AssessmentQuestion[];
    };
    reading: {
      title: string;
      passage: string;
      questions: AssessmentQuestion[];
    };
    grammar: {
      title: string;
      questions: AssessmentQuestion[];
    };
    writing: {
      title: string;
      prompt: string;
      guidelines: string[];
      minWords: number;
      maxWords?: number;
    };
    speaking: {
      title: string;
      part1Questions: string[];
      part2Topic: string;
      part2Cues: string[];
    };
  };
}

export interface AssessmentSessionState {
  sessionId: string;
  candidateName: string;
  phone: string;
  targetBand: string;
  status: "ACTIVE" | "SUBMITTED" | "EXPIRED";
  remainingSeconds: number;
  answers: Record<string, any>;
}

export interface ArisDiagnosticLevel {
  levelNumber: number;
  levelTitle: string;
  estimatedIeltsRange: string;
  description: string;
  recommendedCourse: {
    slug: string;
    title: string;
    targetBand: string;
    level: string;
    summary: string;
  };
}

export interface SkillScoreItem {
  correct: number;
  total: number;
  scorePercent: number;
  estimatedBand?: string;
  level?: string;
  feedback: string;
}

export interface AssessmentResultScorecard {
  sessionId: string;
  candidateName: string;
  phone: string;
  targetBand: string;
  arisLevel: ArisDiagnosticLevel;
  objectiveBreakdown: {
    rawScore: number;
    totalQuestions: number;
    accuracyPercent: number;
    listening: SkillScoreItem;
    reading: SkillScoreItem;
    grammar: SkillScoreItem;
  };
  subjectiveEvaluation: {
    status: "NONE" | "PENDING_REVIEW" | "REVIEWED";
    hasWritingSubmission: boolean;
    hasSpeakingRecording: boolean;
    writing?: {
      submitted: boolean;
      status: string;
      message: string;
    };
    speaking?: {
      submitted: boolean;
      status: string;
      message: string;
    };
    note: string;
  };
  strengths: string[];
  weaknesses: string[];
  submittedAt: string;
}
