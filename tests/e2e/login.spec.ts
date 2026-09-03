import { expect, test } from "@playwright/test";
import { installSupabaseMock, TEST_EMAIL } from "./supabase-mock";

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

test("recuperação de senha direciona para a tela de redefinição", async ({ page }) => {
  await installSupabaseMock(page);
  await page.goto("/");
  await page.getByLabel("E-mail institucional").first().fill(TEST_EMAIL);

  const recoverRequestPromise = page.waitForRequest((request) =>
    request.url().includes("/auth/v1/recover"),
  );

  await page.getByRole("button", { name: "Esqueci minha senha" }).click();
  const recoverRequest = await recoverRequestPromise;

  const redirectTo = new URL(recoverRequest.url()).searchParams.get("redirect_to");
  expect(redirectTo).toBe("http://127.0.0.1:4173/redefinir-senha");
});
