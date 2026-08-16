/**
 * Exam Sync & Reconciliation Engine
 *
 * Implements:
 * 1. 4-State Network Truth Matrix (LOCAL_SAVED, SERVER_SYNC_PENDING, SERVER_SYNCED, SERVER_UNREACHABLE).
 * 2. Submission State Machine with strict "UNKNOWN ≠ FAILED" law.
 * 3. Status Reconciliation Probe against authoritative backend.
 * 4. Durable Outbox Flush Worker.
 */

import {
  sealAndEnqueueSubmission,
  getPendingOutboxSubmissions,
  removePendingOutboxSubmission,
  PendingOutboxRecord,
} from "./draftStore";
import { submissionsApi, API_BASE_URL, getAuthToken } from "./api";

export type SyncVisualState =
  | "LOCAL_SAVED"
  | "SERVER_SYNC_PENDING"
  | "SERVER_SYNCED"
  | "SERVER_UNREACHABLE";

export type SubmissionFlowStatus =
  | "IDLE"
  | "LOCAL_SEALED"
  | "SUBMITTING"
  | "ACKNOWLEDGED"
  | "UNKNOWN"
  | "RECONCILING"
  | "SUBMITTED"
  | "REJECTED";

export interface SyncEngineConfig {
  submissionId: string;
  userId: string;
  examId: string;
  onVisualStateChange?: (state: SyncVisualState) => void;
  onSubmissionStatusChange?: (status: SubmissionFlowStatus, payload?: any) => void;
}

export class ExamSyncEngine {
  private config: SyncEngineConfig;
  private visualState: SyncVisualState = "LOCAL_SAVED";
  private submissionStatus: SubmissionFlowStatus = "IDLE";
  private isFlushingOutbox = false;
  private isDestroyed = false;
  private networkCheckInterval: any = null;

  constructor(config: SyncEngineConfig) {
    this.config = config;
    this.startNetworkMonitor();
  }

  public getVisualState(): SyncVisualState {
    return this.visualState;
  }

  public getSubmissionStatus(): SubmissionFlowStatus {
    return this.submissionStatus;
  }

  private setVisualState(state: SyncVisualState) {
    this.visualState = state;
    this.config.onVisualStateChange?.(state);
  }

  private setSubmissionStatus(status: SubmissionFlowStatus, payload?: any) {
    this.submissionStatus = status;
    this.config.onSubmissionStatusChange?.(status, payload);
  }

  /**
   * Active Network Probe (HEAD request to verify true server reachability).
   */
  public async probeNetworkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${API_BASE_URL}/submissions/health-check-probe`, {
        method: "HEAD",
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(timeout);

      // If server responds with any HTTP status (even 404/401/405), the API gateway is alive
      return res !== null;
    } catch {
      return false;
    }
  }

  private startNetworkMonitor() {
    if (typeof window === "undefined") return;

    const handleOnline = async () => {
      const isActuallyAlive = await this.probeNetworkHealth();
      if (isActuallyAlive) {
        this.setVisualState("SERVER_SYNCED");
        this.flushOutboxQueue();
      } else {
        this.setVisualState("SERVER_UNREACHABLE");
      }
    };

    const handleOffline = () => {
      this.setVisualState("SERVER_UNREACHABLE");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    this.networkCheckInterval = setInterval(async () => {
      if (this.isDestroyed) return;
      if (this.visualState === "SERVER_UNREACHABLE") {
        const isBack = await this.probeNetworkHealth();
        if (isBack) {
          this.setVisualState("SERVER_SYNCED");
          this.flushOutboxQueue();
        }
      }
    }, 5000);
  }

  /**
   * Notifies the engine of a local save event.
   */
  public onLocalSaved() {
    this.setVisualState("LOCAL_SAVED");
  }

  /**
   * Notifies the engine of a background sync start.
   */
  public onServerSyncPending() {
    this.setVisualState("SERVER_SYNC_PENDING");
  }

  /**
   * Notifies the engine of a background sync success.
   */
  public onServerSyncSuccess() {
    this.setVisualState("SERVER_SYNCED");
  }

  /**
   * Notifies the engine of a background sync network error.
   */
  public onServerSyncError() {
    this.setVisualState("SERVER_UNREACHABLE");
  }

  /**
   * Durable Submission Flow adhering to the strict "UNKNOWN ≠ FAILED" law.
   */
  public async submitExam(
    answers: Array<{ questionId: string; answerText?: any; audioUrl?: string }>,
    customIdempotencyKey?: string
  ): Promise<{ success: boolean; result?: any; status: SubmissionFlowStatus; error?: string }> {
    const idempotencyKey = customIdempotencyKey || `idem_${this.config.submissionId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // 1. Atomic Persistence: Seal and enqueue into Outbox
    this.setSubmissionStatus("LOCAL_SEALED");
    const enqueueRes = await sealAndEnqueueSubmission(
      this.config.submissionId,
      this.config.userId,
      this.config.examId,
      idempotencyKey,
      answers
    );

    if (enqueueRes.status !== "ENQUEUE_SUCCESS") {
      this.setSubmissionStatus("REJECTED", { error: "Không thể ghi bản nộp vào bộ nhớ an toàn" });
      return { success: false, status: "REJECTED", error: "Storage enqueue failed" };
    }

    // 2. Submit to API with Idempotency Key
    this.setSubmissionStatus("SUBMITTING");
    try {
      const result = await submissionsApi.submit(this.config.submissionId, answers, {
        idempotencyKey,
      });

      // 3. Authoritative ACK
      this.setSubmissionStatus("ACKNOWLEDGED", result);
      await removePendingOutboxSubmission(this.config.submissionId);
      this.setSubmissionStatus("SUBMITTED", result);
      return { success: true, result, status: "SUBMITTED" };
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      const isExplicitClientReject =
        errorMsg.includes("400") ||
        errorMsg.includes("403") ||
        errorMsg.includes("bắt buộc");

      // 4. UNKNOWN ≠ FAILED: Any network error, timeout, 5xx, 409, or connection drop triggers Reconciliation
      if (!isExplicitClientReject) {
        this.setSubmissionStatus("UNKNOWN");
        return this.reconcileSubmission(this.config.submissionId, idempotencyKey);
      }

      // Explicit 4xx client rejection (e.g. 400 Bad Request, 403 Forbidden)
      this.setSubmissionStatus("REJECTED", { error: errorMsg });
      return { success: false, status: "REJECTED", error: errorMsg };
    }
  }

  /**
   * Reconciles submission status with the authoritative server state.
   */
  public async reconcileSubmission(
    submissionId: string,
    idempotencyKey: string
  ): Promise<{ success: boolean; result?: any; status: SubmissionFlowStatus; error?: string }> {
    this.setSubmissionStatus("RECONCILING");

    try {
      const serverState = await submissionsApi.getById(submissionId);
      const normalizedStatus = String(serverState?.status || "").toUpperCase();

      if (normalizedStatus === "SUBMITTED" || normalizedStatus === "GRADED") {
        // Server already committed submission! True Success!
        await removePendingOutboxSubmission(submissionId);
        this.setSubmissionStatus("SUBMITTED", serverState);
        return { success: true, result: serverState, status: "SUBMITTED" };
      }

      // Server is still in progress; outbox item remains durable for automatic retry
      this.setSubmissionStatus("LOCAL_SEALED");
      return {
        success: false,
        status: "LOCAL_SEALED",
        error: "Bài làm đã được lưu an toàn trong hàng đợi nộp bài. Hệ thống sẽ tự động thử lại.",
      };
    } catch (reconcileErr) {
      // Reconcile endpoint unreachable; keep outbox sealed
      this.setSubmissionStatus("UNKNOWN");
      return {
        success: false,
        status: "UNKNOWN",
        error: "Không thể kết nối máy chủ để xác nhận. Bài làm đã được bảo vệ an toàn trên máy.",
      };
    }
  }

  /**
   * Flushes any pending submissions from the Outbox Queue upon network reconnection.
   */
  public async flushOutboxQueue(): Promise<void> {
    if (this.isFlushingOutbox || this.isDestroyed) return;
    this.isFlushingOutbox = true;

    try {
      const pendingList = await getPendingOutboxSubmissions();
      for (const record of pendingList) {
        if (record.submissionId !== this.config.submissionId) continue;

        try {
          const result = await submissionsApi.submit(record.submissionId, record.answers, {
            idempotencyKey: record.idempotencyKey,
          });

          await removePendingOutboxSubmission(record.submissionId);
          this.setSubmissionStatus("SUBMITTED", result);
          this.setVisualState("SERVER_SYNCED");
        } catch (err: any) {
          const is401 = String(err).includes("401");
          if (is401) {
            // Keep in queue indefinitely
            continue;
          }
          this.setVisualState("SERVER_UNREACHABLE");
          await this.reconcileSubmission(record.submissionId, record.idempotencyKey);
        }
      }
    } catch {
    } finally {
      this.isFlushingOutbox = false;
    }
  }

  /**
   * Destroys engine listeners.
   */
  public destroy() {
    this.isDestroyed = true;
    if (this.networkCheckInterval) {
      clearInterval(this.networkCheckInterval);
      this.networkCheckInterval = null;
    }
  }
}
