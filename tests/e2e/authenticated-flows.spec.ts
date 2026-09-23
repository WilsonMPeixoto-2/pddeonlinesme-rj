import { expect, test } from "@playwright/test";
import { installSupabaseMock, signInAsTestAdmin } from "./supabase-mock";

test("rota protegida redireciona usuário sem sessão para o login", async ({ page }) => {
  await page.goto("/manual");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Bem-vindo" })).toBeVisible();
});

test("login autenticado abre o dashboard canônico e mantém sessão ao navegar", async ({ page }) => {
  await installSupabaseMock(page);
  await signInAsTestAdmin(page);

  await expect(page.getByText("Visão executiva", { exact: false })).toBeVisible();
  await expect(page.getByText("2º ciclo · PDDE Básico · pagamento informado pelo FNDE", { exact: true })).toBeVisible();
  await expect(page.getByText(/765\.215,00/).first()).toBeVisible();
  await expect(page.getByText("163/163", { exact: true })).toBeVisible();
  await expect(page.getByText("100% da rede", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Repasses", exact: true }).click();
  await expect(page).toHaveURL(/\/repasses$/);
  await expect(page.getByRole("heading", { name: "1ª parcela do PDDE Básico" })).toBeVisible();
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


test("segundo ciclo apresenta a cobertura executiva consolidada", async ({ page }) => {
  await installSupabaseMock(page);
  await signInAsTestAdmin(page);

  await page.goto("/repasses?ciclo=2");
  await expect(page.getByRole("heading", { name: "2º ciclo · PDDE Básico" })).toBeVisible();
  await expect(page.getByText(/765\.215,00/).first()).toBeVisible();
  await expect(page.getByText("163/163", { exact: true })).toBeVisible();
  await expect(page.getByText("111", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("52", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("15/09/2026", { exact: true })).toBeVisible();
  await expect(page.getByText("17/09/2026", { exact: true })).toBeVisible();
  await expect(page.getByText("100% das unidades da 4ª CRE", { exact: true })).toBeVisible();
});
