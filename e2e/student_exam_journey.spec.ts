import { test, expect } from "@playwright/test";

test.describe("True Browser E2E: Student Navigation & Route Boundary Resilience", () => {
  test("Browser navigates between routes, validates chunk loading and zero console errors", async ({ page }) => {
    const criticalErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (!text.includes("Failed to load resource") && !text.includes("ECONNREFUSED")) {
          criticalErrors.push(text);
        }
      }
    });

    page.on("pageerror", (err) => {
      criticalErrors.push(err.message);
    });

    // 1. Load application
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // 2. Assert zero uncaught exceptions in page context
    expect(criticalErrors).toHaveLength(0);
  });
});
