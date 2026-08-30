import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("tela pública não possui violações críticas de acessibilidade", async ({ page }) => {
  await page.goto("/");

  const results = await new AxeBuilder({ page }).analyze();
  const criticalViolations = results.violations.filter(
    (violation) => violation.impact === "critical",
  );

  expect(
    criticalViolations,
    JSON.stringify(criticalViolations, null, 2),
  ).toEqual([]);
});
