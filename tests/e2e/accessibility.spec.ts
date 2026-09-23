import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { installSupabaseMock, signInAsTestAdmin } from "./supabase-mock";

async function expectNoCriticalViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const criticalViolations = results.violations.filter(
    (violation) => violation.impact === "critical",
  );

  expect(
    criticalViolations,
    JSON.stringify(criticalViolations, null, 2),
  ).toEqual([]);
}

test("tela pública não possui violações críticas de acessibilidade", async ({ page }) => {
  await page.goto("/");
  await expectNoCriticalViolations(page);
});

test("dashboard autenticado não possui violações críticas de acessibilidade", async ({ page }) => {
  await installSupabaseMock(page);
  await signInAsTestAdmin(page);
  await expect(page.getByText("Painel Executivo-Operacional", { exact: false })).toBeVisible();

  await expectNoCriticalViolations(page);
});
