import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "../lib/sanitize";

describe("GATE 2C: XSS SANITIZATION & SEMANTIC PRESERVATION TEST SUITE", () => {
  describe("1. Malicious Injection Stripping", () => {
    it("1.1 should completely strip <script> tags", () => {
      const dirty = `<p>Reading passage</p><script>alert('xss')</script>`;
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain("<script>");
      expect(clean).not.toContain("alert('xss')");
      expect(clean).toContain("<p>Reading passage</p>");
    });

    it("1.2 should strip inline event handlers like onerror from <img>", () => {
      const dirty = `<img src="x" onerror="alert(1)" alt="test" />`;
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain("onerror");
      expect(clean).not.toContain("alert(1)");
    });

    it("1.3 should strip javascript: pseudo-protocols from href", () => {
      const dirty = `<a href="javascript:alert(1)">Click for free IELTS tips</a>`;
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain("javascript:");
      expect(clean).not.toContain("alert(1)");
    });

    it("1.4 should strip vbscript: pseudo-protocols from href", () => {
      const dirty = `<a href="vbscript:msgbox(1)">Click</a>`;
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain("vbscript:");
    });

    it("1.5 should strip <iframe> embeds", () => {
      const dirty = `<p>Test</p><iframe src="https://evil.example.com"></iframe>`;
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain("<iframe");
      expect(clean).not.toContain("evil.example.com");
    });

    it("1.6 should strip <object> and <embed> tags", () => {
      const dirty = `<object data="exploit.swf"></object><embed src="exploit.swf">`;
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain("<object");
      expect(clean).not.toContain("<embed");
    });

    it("1.7 should strip dangerous inline style attributes to prevent CSS injection", () => {
      const dirty = `<div style="background-image: url(javascript:alert(1)); color: red;">Styled text</div>`;
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain("style=");
      expect(clean).not.toContain("javascript:");
      expect(clean).toContain("Styled text");
    });

    it("1.8 should strip arbitrary data-* attributes while preserving specific application data attributes", () => {
      const dirty = `<div data-arbitrary-hax="malicious" data-fill-blank="0" data-question-id="q-1">Slot</div>`;
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain("data-arbitrary-hax");
      expect(clean).toContain('data-fill-blank="0"');
      expect(clean).toContain('data-question-id="q-1"');
    });

    it("1.9 should strip data:text/html protocol vectors", () => {
      const dirty = `<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Click</a>`;
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain("data:text/html");
    });
  });

  describe("2. Semantic Preservation of Valid IELTS Content", () => {
    it("2.1 should preserve standard paragraphs and typography formatting", () => {
      const valid = `<p>The <strong>Industrial Revolution</strong> was a period of <em>great transition</em>.</p>`;
      const clean = sanitizeHtml(valid);
      expect(clean).toBe(valid);
    });

    it("2.2 should preserve headings (h1, h2, h3, etc.)", () => {
      const valid = `<h1>Reading Passage 1</h1><h2>The History of Coffee</h2>`;
      const clean = sanitizeHtml(valid);
      expect(clean).toBe(valid);
    });

    it("2.3 should preserve unordered and ordered lists", () => {
      const valid = `<ul><li>Point 1</li><li>Point 2</li></ul><ol><li>Step 1</li><li>Step 2</li></ol>`;
      const clean = sanitizeHtml(valid);
      expect(clean).toBe(valid);
    });

    it("2.4 should preserve complex tables with headers and cells", () => {
      const valid = `<table><thead><tr><th>Year</th><th>Population</th></tr></thead><tbody><tr><td>2000</td><td>6 Billion</td></tr></tbody></table>`;
      const clean = sanitizeHtml(valid);
      expect(clean).toBe(valid);
    });

    it("2.5 should preserve safe HTTPS images with alt and dimension attributes", () => {
      const valid = `<img src="https://nextband.site/uploads/images/chart1.png" alt="IELTS Bar Chart" width="500" height="300" />`;
      const clean = sanitizeHtml(valid);
      expect(clean).toContain('src="https://nextband.site/uploads/images/chart1.png"');
      expect(clean).toContain('alt="IELTS Bar Chart"');
    });

    it("2.6 should preserve safe HTTPS external links and enforce rel='noopener noreferrer'", () => {
      const valid = `<a href="https://ielts.org" target="_blank">Official IELTS</a>`;
      const clean = sanitizeHtml(valid);
      expect(clean).toContain('href="https://ielts.org"');
      expect(clean).toContain('rel="noopener noreferrer"');
    });

    it("2.7 should preserve fill-in-the-blank slot tokens and classes", () => {
      const valid = `<span data-fill-blank="1" class="fill-blank-slot"></span>`;
      const clean = sanitizeHtml(valid);
      expect(clean).toContain('data-fill-blank="1"');
      expect(clean).toContain('class="fill-blank-slot"');
    });
  });
});
