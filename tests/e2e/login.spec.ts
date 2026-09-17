import { expect, test } from "@playwright/test";
import { installSupabaseMock, signInAsTestAdmin, TEST_EMAIL } from "./supabase-mock";

test("renderiza a tela pública de acesso institucional", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Bem-vindo" })).toBeVisible();
  await expect(page.getByText("Acesse sua conta para continuar na Inteligência Financeira PDDE.")).toBeVisible();
  await expect(page.getByText(/Inteligência Financeira/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  await expect(page.getByLabel("Usuário").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Esqueci minha senha" })).toBeVisible();
  await expect(page.getByText("Ambiente seguro")).toBeVisible();
  await expect(page.getByText("Seus dados são protegidos e utilizados apenas para fins institucionais.")).toBeVisible();
  await expect(page.getByText("Criar conta institucional")).toHaveCount(0);
});

test("mantém o card inteiro visível em viewport desktop equivalente a zoom elevado", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 650 });
  await page.goto("/");

  const card = page.locator('section[aria-labelledby="login-title"]');
  await expect(card).toBeVisible();
  await expect(page.getByText("Ambiente seguro")).toBeVisible();

  const box = await card.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(650);
});

test("permite reflow vertical sem corte ou overflow horizontal em zoom muito alto", async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 });
  await page.goto("/");

  await page.getByText("Ambiente seguro").scrollIntoViewIfNeeded();
  await expect(page.getByText("Ambiente seguro")).toBeVisible();

  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    scrollHeight: document.documentElement.scrollHeight,
    innerHeight: window.innerHeight,
  }));

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
  expect(metrics.scrollHeight).toBeGreaterThanOrEqual(metrics.innerHeight);
});

test("valida credenciais obrigatórias antes de chamar o backend", async ({ page }) => {
  let authRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/auth/v1/token")) authRequests += 1;
  });

  await page.goto("/");
  await page.getByLabel("Usuário").first().fill("email-invalido");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByText("E-mail inválido")).toBeVisible();
  await expect(page.getByText("Senha é obrigatória")).toBeVisible();
  expect(authRequests).toBe(0);
});

test("recuperação de senha direciona para a tela de redefinição", async ({ page }) => {
  await installSupabaseMock(page);
  await page.goto("/");
  await page.getByLabel("Usuário").first().fill(TEST_EMAIL);

  const recoverRequestPromise = page.waitForRequest((request) =>
    request.url().includes("/auth/v1/recover"),
  );

  await page.getByRole("button", { name: "Esqueci minha senha" }).click();
  const recoverRequest = await recoverRequestPromise;

  const redirectTo = new URL(recoverRequest.url()).searchParams.get("redirect_to");
  expect(redirectTo).toBe("http://127.0.0.1:4173/redefinir-senha");
});

test("tela de redefinição rejeita acesso sem sessão de recuperação", async ({ page }) => {
  await page.goto("/redefinir-senha");

  await expect(page.getByRole("heading", { name: "Definir nova senha" })).toBeVisible();
  await expect(page.getByText(/link de recuperação é inválido/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Voltar para o acesso" })).toBeVisible();
});

test("tela de redefinição atualiza a senha com sessão autenticada", async ({ page }) => {
  await installSupabaseMock(page);
  await signInAsTestAdmin(page);
  await page.goto("/redefinir-senha");

  await page.getByLabel("Nova senha", { exact: true }).fill("nova-senha-e2e");
  await page.getByLabel("Confirmar nova senha", { exact: true }).fill("nova-senha-e2e");

  const updateRequestPromise = page.waitForRequest(
    (request) => request.url().includes("/auth/v1/user") && request.method() === "PUT",
  );

  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  const updateRequest = await updateRequestPromise;

  expect(updateRequest.postDataJSON()).toMatchObject({ password: "nova-senha-e2e" });
  await page.waitForURL("**/dashboard");
});
