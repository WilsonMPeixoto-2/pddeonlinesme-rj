import { expect, test } from "@playwright/test";
import { installSupabaseMock, signInAsTestAdmin } from "./supabase-mock";

test("rota protegida redireciona usuário sem sessão para o login", async ({ page }) => {
  await page.goto("/manual");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Acesso ao sistema" })).toBeVisible();
});

test("login autenticado abre o dashboard e mantém sessão ao navegar", async ({ page }) => {
  await installSupabaseMock(page);
  await signInAsTestAdmin(page);

  await expect(page.getByText("Painel Executivo-Operacional", { exact: false })).toBeVisible();
  await expect(page.getByText("105.000", { exact: false }).first()).toBeVisible();

  await page.getByRole("link", { name: "Manual" }).click();
  await expect(page).toHaveURL(/\/manual$/);
  await expect(page.getByRole("heading", { name: "Manual" })).toBeVisible();
});

test("listagem de unidades usa dados Supabase e aplica busca no cliente", async ({ page }) => {
  await installSupabaseMock(page);
  await signInAsTestAdmin(page);

  await page.getByRole("link", { name: "Unidades Escolares" }).click();
  await expect(page).toHaveURL(/\/escolas$/);
  await expect(page.getByRole("heading", { name: "Unidades Escolares" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Abrir cadastro de 04.10.001" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Abrir cadastro de 04.10.002" })).toBeVisible();

  const search = page.getByRole("textbox", { name: "Buscar unidades escolares" });
  await search.fill("Alpha");

  await expect(page.getByRole("button", { name: "Abrir cadastro de 04.10.001" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Abrir cadastro de 04.10.002" })).toHaveCount(0);
});

test("edição cadastral percorre RPC e reconciliação sem tocar produção", async ({ page }) => {
  await installSupabaseMock(page);
  await signInAsTestAdmin(page);

  await page.goto("/escolas/00000000-0000-4000-8000-000000000101");
  await expect(page.getByText("EM Alpha", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "Editar dados cadastrais" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Editar dados cadastrais" })).toBeVisible();

  const nome = dialog.getByLabel("Nome completo");
  await nome.fill("EM Alpha Atualizada");

  const rpcRequest = page.waitForRequest(
    (request) =>
      request.method() === "POST" &&
      request.url().includes("/rest/v1/rpc/update_unidade_cadastro_minima"),
  );

  await dialog.getByRole("button", { name: "Salvar cadastro" }).click();

  const request = await rpcRequest;
  expect(request.postDataJSON()).toMatchObject({
    p_nome: "EM Alpha Atualizada",
  });

  await expect(page.getByText("Dados cadastrais salvos.")).toBeVisible();
});
