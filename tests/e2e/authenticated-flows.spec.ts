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

  await expect(page.getByText("Painel Executivo-Operacional", { exact: false })).toBeVisible();
  await expect(page.getByText("PDDE Básico · total dos ciclos de repasses · 2026", { exact: true })).toBeVisible();
  await expect(page.getByText("1º ciclo de repasses", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Total PDDE Básico", { exact: true })).toBeVisible();

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


test("Repasses abre a visão anual e permite navegar pelos ciclos", async ({ page }) => {
  await installSupabaseMock(page);
  await signInAsTestAdmin(page);

  await page.getByRole("link", { name: "Repasses" }).click();
  await expect(page).toHaveURL(/\/repasses$/);
  await expect(page.getByRole("heading", { name: "Visão anual dos repasses" })).toBeVisible();
  await expect(page.getByText("Total oficial identificado", { exact: false })).toBeVisible();
  await expect(page.getByRole("link", { name: "1º ciclo de repasses" }).first()).toHaveAttribute("href", "/repasses?ciclo=1");
  await expect(page.getByRole("link", { name: "2º ciclo de repasses" }).first()).toHaveAttribute("href", "/repasses?ciclo=2");
});

test("segundo ciclo faz drill-down da escola e preserva o retorno", async ({ page }) => {
  await installSupabaseMock(page);
  await signInAsTestAdmin(page);

  await page.getByRole("button", { name: /2º ciclo de repasses/i }).click();
  await expect(page).toHaveURL(/\/repasses\?ciclo=2/);
  await expect(page.getByRole("heading", { name: "2º ciclo de repasses · PDDE Básico" })).toBeVisible();
  await expect(page.getByText("04.10.002", { exact: true })).toBeVisible();
  await expect(page.getByText(/2\.785,00/).first()).toBeVisible();
  await expect(page.getByText(/1\.671,00/).first()).toBeVisible();
  await expect(page.getByText(/1\.114,00/).first()).toBeVisible();
  await expect(page.getByRole("cell", { name: "Ordem de pagamento emitida" })).toBeVisible();

  await page.getByRole("link", { name: "04.10.002" }).click();
  await expect(page).toHaveURL(/\/escolas\/00000000-0000-4000-8000-000000000102\/recursos/);
  await expect(page.getByRole("heading", { name: "EM Beta" })).toBeVisible();
  await expect(page.getByText("Ordem de pagamento emitida", { exact: true })).toBeVisible();
  await expect(page.getByText("14/09/2026", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Voltar aos repasses" }).click();
  await expect(page).toHaveURL(/\/repasses\?ciclo=2/);
  await expect(page.getByText("04.10.002", { exact: true })).toBeVisible();
});
