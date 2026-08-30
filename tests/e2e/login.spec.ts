import { expect, test } from "@playwright/test";

test("renderiza a tela pública de acesso", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "PDDE Online" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Acesso ao sistema" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  await expect(page.getByLabel("E-mail institucional").first()).toBeVisible();
});

test("valida credenciais obrigatórias antes de chamar o backend", async ({ page }) => {
  let authRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/auth/v1/token")) authRequests += 1;
  });

  await page.goto("/");
  await page.getByLabel("E-mail institucional").first().fill("email-invalido");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByText("E-mail inválido")).toBeVisible();
  await expect(page.getByText("Senha é obrigatória")).toBeVisible();
  expect(authRequests).toBe(0);
});
