/**
 * Trusted Exam Clock Module
 *
 * Invariant Rules:
 * 1. RTT Compensation: Offsets are calibrated using NTP-like Round Trip Time (RTT) measurements.
 * 2. Server Authority: The client timer is purely a local UX renderer.
 * 3. Tamper Resistance: Changing local system clock or reloading does not grant extra exam time.
 */

export interface ClockCalibration {
  serverOffsetMs: number;
  rttMs: number;
  calibratedAt: number;
}

let activeCalibration: ClockCalibration = {
  serverOffsetMs: 0,
  rttMs: 0,
  calibratedAt: Date.now(),
};

/**
 * Computes calibrated server clock offset compensating for network Round-Trip Time (RTT).
 *
 * Formula:
 * RTT = clientResponseEnd - clientRequestStart
 * estimatedServerNow = serverTimestamp + RTT / 2
 * offset = estimatedServerNow - clientResponseEnd
 */
export function computeServerOffset(
  serverTimestampMs: number,
  clientRequestStartMs: number,
  clientResponseEndMs: number
): ClockCalibration {
  const rttMs = Math.max(0, clientResponseEndMs - clientRequestStartMs);
  const estimatedServerNow = serverTimestampMs + Math.floor(rttMs / 2);
  const serverOffsetMs = estimatedServerNow - clientResponseEndMs;

  activeCalibration = {
    serverOffsetMs,
    rttMs,
    calibratedAt: Date.now(),
  };

  return activeCalibration;
}

/**
 * Gets the current active clock calibration.
 */
export function getActiveCalibration(): ClockCalibration {
  return activeCalibration;
}

/**
 * Sets clock calibration directly (e.g. from persisted session metadata).
 */
export function setCalibration(calibration: Partial<ClockCalibration>) {
  activeCalibration = {
    ...activeCalibration,
    ...calibration,
  };
}

/**
 * Computes trusted current exam time (UTC Epoch Ms).
 */
export function getTrustedNow(serverOffsetMs = activeCalibration.serverOffsetMs): number {
  return Date.now() + serverOffsetMs;
}

/**
 * Computes remaining seconds until expiration, strictly adhering to server offset.
 */
export function getTrustedRemainingSeconds(
  expiresAtMs: number,
  serverOffsetMs = activeCalibration.serverOffsetMs
): number {
  if (!Number.isFinite(expiresAtMs)) return 0;
  const trustedNow = getTrustedNow(serverOffsetMs);
  const diffMs = expiresAtMs - trustedNow;
  return Math.max(0, Math.floor(diffMs / 1000));
}

/**
 * Calculates absolute expiration timestamp given start time and duration.
 */
export function calculateExpiresAt(startedAtMs: number, durationMinutes: number): number {
  const safeDuration = Math.max(1, durationMinutes || 60);
  return startedAtMs + safeDuration * 60 * 1000;
}

/**
 * Validates whether the exam has legally expired on the trusted timeline.
 */
export function isExamExpired(
  expiresAtMs: number,
  serverOffsetMs = activeCalibration.serverOffsetMs
): boolean {
  return getTrustedRemainingSeconds(expiresAtMs, serverOffsetMs) <= 0;
}
