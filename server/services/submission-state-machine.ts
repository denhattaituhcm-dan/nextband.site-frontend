/**
 * Canonical IELTS Submission State Machine
 * Enforces strict transitions and immutability invariants:
 * 
 *                  ┌──────────────┐
 *                  │ IN_PROGRESS  │
 *                  └──────┬───────┘
 *                         │ submit
 *                         ▼
 *                  ┌──────────────┐
 *                  │  SUBMITTED   │ (Requires Teacher Manual Grade)
 *                  └──────┬───────┘
 *                         │ canonical grading
 *                         ▼
 *                  ┌──────────────┐
 *                  │   GRADED     │ (Authoritative Final Score)
 *                  └──────────────┘
 * 
 * INVARIANTS:
 * 1. GRADED is Immutable. Direct modifications or status rollbacks (e.g. GRADED -> IN_PROGRESS) are strictly FORBIDDEN.
 * 2. Regrading must follow an Authorized Regrade Workflow with explicit Actor, Reason, and Audit Trail.
 */

export type SubmissionState = "IN_PROGRESS" | "SUBMITTED" | "GRADED" | "PENDING";

export class StateTransitionError extends Error {
  public statusCode = 409;
  constructor(message: string) {
    super(message);
    this.name = "StateTransitionError";
  }
}

export class SubmissionStateMachine {
  private static VALID_TRANSITIONS: Record<SubmissionState, SubmissionState[]> = {
    IN_PROGRESS: ["SUBMITTED", "GRADED"],
    PENDING: ["IN_PROGRESS", "SUBMITTED", "GRADED"],
    SUBMITTED: ["GRADED"],
    GRADED: ["GRADED"], // Only allowed via Authorized Regrade Workflow
  };

  /**
   * Validates if a transition from current state to target state is legally permitted
   */
  public static canTransition(current: SubmissionState, target: SubmissionState): boolean {
    const allowed = this.VALID_TRANSITIONS[current] || [];
    return allowed.includes(target);
  }

  /**
   * Asserts transition validity or throws a 409 StateTransitionError
   */
  public static assertTransition(current: SubmissionState, target: SubmissionState, isAuthorizedRegrade = false): void {
    if (current === "GRADED") {
      if (target === "IN_PROGRESS" || target === "SUBMITTED") {
        throw new StateTransitionError(`INVALID_STATE_TRANSITION: Cannot roll back from GRADED to ${target}. Final state is immutable.`);
      }
      if (target === "GRADED" && !isAuthorizedRegrade) {
        throw new StateTransitionError("SUBMISSION_ALREADY_FINALIZED: Direct modification of GRADED submission is forbidden without an authorized regrade request.");
      }
    }

    if (!this.canTransition(current, target)) {
      throw new StateTransitionError(`INVALID_STATE_TRANSITION: Cannot transition submission from ${current} to ${target}`);
    }
  }

  /**
   * Checks whether the submission is in an immutable finalized state
   */
  public static isFinalized(state: SubmissionState): boolean {
    return state === "GRADED";
  }
}
