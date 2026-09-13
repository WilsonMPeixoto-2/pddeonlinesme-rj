import { expect, test } from "@playwright/test";
import { installSupabaseMock, signInAsTestAdmin } from "./supabase-mock";

test("rota protegida redireciona usuário sem sessão para o login", async ({ page }) => {
  await page.goto("/manual");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Acesso ao sistema" })).toBeVisible();
});

test("login autenticado abre o dashboard canônico e mantém sessão ao navegar", async ({ page }) => {
  await installSupabaseMock(page);
  await signInAsTestAdmin(page);

  await expect(page.getByText("Painel Executivo-Operacional", { exact: false })).toBeVisible();
  await expect(page.getByText("1ª parcela paga · PDDE Básico · 2026", { exact: true })).toBeVisible();
  await expect(page.getByText("15.000", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Repasse · 1ª parcela", { exact: true })).toBeVisible();

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

test("frente fiscal bloqueia homologação quando o contrato remoto não existe", async ({ page }) => {
  await installSupabaseMock(page);
  await signInAsTestAdmin(page);

  await page.goto("/fiscal");
  await page.getByText("Selecione a Unidade Escolar...", { exact: true }).click();
  await page.getByRole("option", { name: /04\.10\.001/ }).click();

  await expect(page.getByText("Total Disponível", { exact: true })).toBeVisible();

  await page.getByLabel("CNPJ do Fornecedor *").fill("12345678000199");
  await page.getByLabel("Número do Documento (Nota/Recibo) *").fill("NF-TESTE-1");
  await page.getByLabel("Razão Social / Nome do Fornecedor *").fill("Fornecedor Teste Ltda");
  await page.getByLabel("Data de Emissão *").fill("2026-09-12");
  await page.getByLabel("Valor Total *").fill("12345");

  const rpcResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().includes("/rest/v1/rpc/homologar_despesa_fiscal"),
  );

  await page.getByRole("button", { name: "Homologar e Lançar Despesa" }).click();

  const response = await rpcResponse;
  expect(response.status()).toBe(404);

  await expect(
    page.getByText(
      "A homologação fiscal está indisponível porque o contrato de persistência não está ativo. Nenhum dado foi gravado.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByText("Despesa homologada localmente! (Modo Sandbox)")).toHaveCount(0);
  await expect(page.getByLabel("Razão Social / Nome do Fornecedor *")).toHaveValue("Fornecedor Teste Ltda");

  const sandboxData = await page.evaluate(() => localStorage.getItem("sandbox_despesas_fiscais"));
  expect(sandboxData).toBeNull();
});

test("ficha da escola bloqueia estorno quando o contrato fiscal remoto não existe", async ({ page }) => {
  await installSupabaseMock(page);
  await signInAsTestAdmin(page);

  await page.route("https://example.supabase.co/rest/v1/despesas_fiscais**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "00000000-0000-4000-8000-000000000401",
          unidade_id: "00000000-0000-4000-8000-000000000101",
          exercicio: 2026,
          fornecedor_cnpj: "12345678000199",
          fornecedor_nome: "Fornecedor Teste Ltda",
          numero_nota: "NF-ESTORNO-1",
          chave_acesso: null,
          data_emissao: "2026-09-10",
          valor: 100,
          tipo_gasto: "custeio",
          programa: "basico",
          created_at: "2026-09-10T12:00:00.000Z",
        },
      ]),
    });
  });

  await page.goto("/escolas/00000000-0000-4000-8000-000000000101");
  await expect(page.getByText("NF-ESTORNO-1", { exact: true }).first()).toBeVisible();

  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });

  const rpcResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().includes("/rest/v1/rpc/estornar_despesa_fiscal"),
  );

  await page.getByRole("button", { name: "Estornar" }).first().click();

  const response = await rpcResponse;
  expect(response.status()).toBe(404);
  await expect(
    page.getByText(
      "O estorno fiscal está indisponível porque o contrato de persistência não está ativo. Nenhum dado foi alterado.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByText("Despesa estornada localmente! (Modo Sandbox)")).toHaveCount(0);
  await expect(page.getByText("NF-ESTORNO-1", { exact: true }).first()).toBeVisible();

  const sandboxData = await page.evaluate(() => localStorage.getItem("sandbox_despesas_fiscais"));
  expect(sandboxData).toBeNull();
});