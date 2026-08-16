/**
 * Active Tab Lease Manager
 * Protects against multi-tab mutation conflicts with Challenge-Response Grace Period
 * to defend against browser background tab throttling.
 *
 * Invariants:
 * 1. Single Mutation Authority: Only the tab holding the active lease may mutate answers.
 * 2. Anti-Throttling Grace Period: Background tabs are given 1500ms grace period to respond
 *    to claim challenges before a secondary tab can acquire the lease.
 * 3. Graceful Voluntary Transfer: The user can explicitly take over a session from another tab.
 */

export interface TabLeaseRecord {
  submissionId: string;
  tabId: string;
  leaseId: string;
  acquiredAt: number;
  lastHeartbeat: number;
  expiresAt: number;
}

export type LeaseStatusListener = (hasLease: boolean, activeLease: TabLeaseRecord | null) => void;

const HEARTBEAT_INTERVAL_MS = 2000;
const LEASE_TTL_MS = 6000;
const GRACE_PERIOD_MS = 1500;

export class TabLeaseManager {
  private submissionId: string;
  private tabId: string;
  private currentLeaseId: string | null = null;
  private hasLease = false;
  private channel: BroadcastChannel | null = null;
  private heartbeatTimer: any = null;
  private listeners: Set<LeaseStatusListener> = new Set();
  private pendingClaimTimeout: any = null;
  private isDestroyed = false;

  constructor(submissionId: string) {
    this.submissionId = submissionId;
    this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    if (typeof window !== "undefined" && typeof window.BroadcastChannel !== "undefined") {
      try {
        this.channel = new BroadcastChannel(`ielts_lease_${this.submissionId}`);
        this.channel.onmessage = this.handleChannelMessage.bind(this);
      } catch {
        this.channel = null;
      }
    }
  }

  public getTabId(): string {
    return this.tabId;
  }

  public hasMutationLease(): boolean {
    return this.hasLease;
  }

  public subscribe(listener: LeaseStatusListener): () => void {
    this.listeners.add(listener);
    listener(this.hasLease, this.readStoredLease());
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const current = this.readStoredLease();
    this.listeners.forEach((fn) => fn(this.hasLease, current));
  }

  private getStorageKey(): string {
    return `ielts_tab_lease_${this.submissionId}`;
  }

  private readStoredLease(): TabLeaseRecord | null {
    if (typeof window === "undefined" || !window.localStorage) return null;
    try {
      const item = window.localStorage.getItem(this.getStorageKey());
      if (!item) return null;
      return JSON.parse(item) as TabLeaseRecord;
    } catch {
      return null;
    }
  }

  private writeStoredLease(lease: TabLeaseRecord) {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      window.localStorage.setItem(this.getStorageKey(), JSON.stringify(lease));
    } catch {}
  }

  private clearStoredLease() {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      window.localStorage.removeItem(this.getStorageKey());
    } catch {}
  }

  /**
   * Initializes lease acquisition attempt.
   */
  public async start(): Promise<boolean> {
    const existing = this.readStoredLease();
    const now = Date.now();

    // If no lease exists or expired, issue a challenge before claiming
    if (!existing || existing.expiresAt < now) {
      return this.challengeAndAcquire();
    }

    if (existing.tabId === this.tabId) {
      this.grantLease(existing.leaseId);
      return true;
    }

    // Another tab holds a valid lease
    this.hasLease = false;
    this.notifyListeners();
    return false;
  }

  /**
   * Challenge existing holder with Grace Period to prevent background throttle takeover.
   */
  private challengeAndAcquire(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.channel) {
        let aliveReceived = false;

        const onChallengeResponse = (event: MessageEvent) => {
          if (event.data?.type === "LEASE_ALIVE" && event.data?.submissionId === this.submissionId) {
            aliveReceived = true;
          }
        };

        this.channel.addEventListener("message", onChallengeResponse);
        this.channel.postMessage({
          type: "LEASE_CLAIM_CHALLENGE",
          submissionId: this.submissionId,
          candidateTabId: this.tabId,
        });

        this.pendingClaimTimeout = setTimeout(() => {
          if (this.channel) {
            this.channel.removeEventListener("message", onChallengeResponse);
          }
          if (this.isDestroyed) {
            resolve(false);
            return;
          }

          if (aliveReceived) {
            this.hasLease = false;
            this.notifyListeners();
            resolve(false);
          } else {
            const newLeaseId = `lease_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            this.grantLease(newLeaseId);
            resolve(true);
          }
        }, GRACE_PERIOD_MS);
      } else {
        // Fallback when BroadcastChannel unavailable
        const newLeaseId = `lease_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        this.grantLease(newLeaseId);
        resolve(true);
      }
    });
  }

  /**
   * Forcibly takes over lease on explicit user action.
   */
  public forceTakeover(): void {
    if (this.pendingClaimTimeout) {
      clearTimeout(this.pendingClaimTimeout);
    }
    const newLeaseId = `lease_override_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.grantLease(newLeaseId);

    if (this.channel) {
      this.channel.postMessage({
        type: "LEASE_REVOKED_BY_TAKEOVER",
        submissionId: this.submissionId,
        newTabId: this.tabId,
        newLeaseId,
      });
    }
  }

  private grantLease(leaseId: string) {
    this.currentLeaseId = leaseId;
    this.hasLease = true;

    const now = Date.now();
    const leaseRecord: TabLeaseRecord = {
      submissionId: this.submissionId,
      tabId: this.tabId,
      leaseId,
      acquiredAt: now,
      lastHeartbeat: now,
      expiresAt: now + LEASE_TTL_MS,
    };

    this.writeStoredLease(leaseRecord);
    this.startHeartbeat();
    this.notifyListeners();

    if (this.channel) {
      this.channel.postMessage({
        type: "LEASE_ACQUIRED",
        submissionId: this.submissionId,
        tabId: this.tabId,
        leaseId,
      });
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (!this.hasLease || this.isDestroyed) return;

      const now = Date.now();
      const leaseRecord: TabLeaseRecord = {
        submissionId: this.submissionId,
        tabId: this.tabId,
        leaseId: this.currentLeaseId!,
        acquiredAt: now,
        lastHeartbeat: now,
        expiresAt: now + LEASE_TTL_MS,
      };

      this.writeStoredLease(leaseRecord);
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private handleChannelMessage(event: MessageEvent) {
    const data = event.data;
    if (!data || data.submissionId !== this.submissionId) return;

    switch (data.type) {
      case "LEASE_CLAIM_CHALLENGE":
        if (this.hasLease && data.candidateTabId !== this.tabId) {
          // Tab is alive, respond to defend lease
          const now = Date.now();
          const leaseRecord: TabLeaseRecord = {
            submissionId: this.submissionId,
            tabId: this.tabId,
            leaseId: this.currentLeaseId!,
            acquiredAt: now,
            lastHeartbeat: now,
            expiresAt: now + LEASE_TTL_MS,
          };
          this.writeStoredLease(leaseRecord);

          this.channel?.postMessage({
            type: "LEASE_ALIVE",
            submissionId: this.submissionId,
            tabId: this.tabId,
            leaseId: this.currentLeaseId,
          });
        }
        break;

      case "LEASE_REVOKED_BY_TAKEOVER":
      case "LEASE_ACQUIRED":
        if (data.tabId !== this.tabId) {
          this.hasLease = false;
          this.stopHeartbeat();
          this.notifyListeners();
        }
        break;

      case "LEASE_RELEASED":
        if (data.tabId !== this.tabId && !this.hasLease) {
          this.challengeAndAcquire();
        }
        break;
    }
  }

  /**
   * Cleans up resources upon tab unmount.
   */
  public destroy() {
    this.isDestroyed = true;
    this.stopHeartbeat();

    if (this.pendingClaimTimeout) {
      clearTimeout(this.pendingClaimTimeout);
    }

    if (this.hasLease) {
      const stored = this.readStoredLease();
      if (stored?.tabId === this.tabId) {
        this.clearStoredLease();
      }
      if (this.channel) {
        this.channel.postMessage({
          type: "LEASE_RELEASED",
          submissionId: this.submissionId,
          tabId: this.tabId,
        });
      }
    }

    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
  }
}
