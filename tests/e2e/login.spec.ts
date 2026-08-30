import { expect, test } from "@playwright/test";

test("renderiza a tela pública de acesso", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "PDDE Online" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Acesso ao sistema" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  await expect(page.getByLabel("E-mail institucional").first()).toBeVisible();
});
