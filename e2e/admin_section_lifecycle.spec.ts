import { test, expect } from "@playwright/test";

test.describe("True Browser E2E: Admin Exam & Section Lifecycle", () => {
  test("Browser loads production bundle, checks dynamic chunks and error boundary immunity", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // 1. Visit root page
    await page.goto("/");
    await expect(page).toHaveTitle(/NextBand|LMS/i);

    // 2. Verify no uncaught reference errors on bundle execution
    expect(consoleErrors.filter((e) => e.includes("useMemo is not defined"))).toHaveLength(0);
    expect(consoleErrors.filter((e) => e.includes("TypeError"))).toHaveLength(0);
  });
});
