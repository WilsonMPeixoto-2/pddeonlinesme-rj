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
  await page.waitForTimeout(300);
  await page.screenshot({
    path: "test-results/visual/dashboard-operacional.png",
    fullPage: true,
  });

  await expect(page.getByRole("link", { name: "Frente Fiscal" })).toHaveCount(0);
  await page.getByRole("button", { name: "Abrir ferramentas administrativas" }).click();
  await page.getByRole("menuitem", { name: "Manual" }).click();
  await expect(page).toHaveURL(/\/manual$/);
  await expect(page.getByRole("heading", { name: "Manual" })).toBeVisible();
});

test("navegação operacional permanece utilizável em viewport móvel", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installSupabaseMock(page);
  await signInAsTestAdmin(page);

  const nav = page.getByRole("navigation", { name: "Navegação principal" });
  await expect(nav).toBeVisible();
  const navigationButton = nav.getByRole("button", { name: "Abrir navegação principal" });
  await expect(navigationButton).toBeVisible();
  await expect(navigationButton).toContainText("Painel");
  await navigationButton.click();

  await expect(page.getByRole("menuitem", { name: "Painel" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Unidades Escolares" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Manual" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Frente Fiscal" })).toHaveCount(0);

  await page.screenshot({
    path: "test-results/visual/mobile-navegacao.png",
    fullPage: true,
  });
});

test("listagem de unidades usa dados Supabase e aplica busca no cliente", async ({ page }) => {
  await installSupabaseMock(page);
  await signInAsTestAdmin(page);

  await page.getByRole("link", { name: "Unidades Escolares" }).click();
  await expect(page).toHaveURL(/\/escolas$/);
  await expect(page.getByRole("heading", { name: "Unidades Escolares" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Abrir cadastro de 04.10.001" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Abrir cadastro de 04.10.002" })).toBeVisible();
  await page.waitForTimeout(300);
  await page.screenshot({
    path: "test-results/visual/escolas-carteira.png",
    fullPage: true,
  });

  const search = page.getByRole("textbox", { name: "Buscar unidades escolares" });
  await search.fill("Alpha");

  await expect(page.getByRole("button", { name: "Abrir cadastro de 04.10.001" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Abrir cadastro de 04.10.002" })).toHaveCount(0);
});

test("carteira de unidades usa cartões acionáveis no mobile sem overflow horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installSupabaseMock(page);
  await signInAsTestAdmin(page);

  await page.goto("/escolas");
  await expect(page.getByRole("heading", { name: "Unidades Escolares" })).toBeVisible();
  const portfolio = page.getByLabel("Carteira de unidades escolares");
  await expect(portfolio).toBeVisible();
  await expect(portfolio.getByRole("button", { name: "Abrir cadastro de 04.10.001" })).toBeVisible();
  await expect(portfolio.getByRole("button", { name: "Ver recursos PDDE" }).first()).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(hasHorizontalOverflow).toBe(false);

  await page.waitForTimeout(300);
  await page.screenshot({
    path: "test-results/visual/mobile-escolas-carteira.png",
    fullPage: true,
  });
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

test("timeline anual filtra a carteira e preserva o recorte no drill-down", async ({ page }) => {
  await installSupabaseMock(page);
  await signInAsTestAdmin(page);

  await page.getByRole("link", { name: "Repasses" }).click();
  await expect(page.getByRole("heading", { name: "Linha do tempo dos repasses" })).toBeVisible();

  const agosto = page.getByRole("button", {
    name: /Filtrar pagamentos de 05\/08\/2026: 1º ciclo de repasses/i,
  });
  await agosto.click();

  await expect(page).toHaveURL(/dataAnual=2026-08-05/);
  await expect(page.getByText("Análise ativa:", { exact: true })).toBeVisible();
  await expect(page.getByText("04.10.001", { exact: true })).toBeVisible();
  await expect(page.getByText("04.10.002", { exact: true })).toHaveCount(0);
  await page.screenshot({
    path: "test-results/visual/repasses-anual-timeline.png",
    fullPage: true,
  });

  await page.getByRole("link", { name: "04.10.001" }).click();
  await expect(page).toHaveURL(/\/escolas\/00000000-0000-4000-8000-000000000101\/recursos/);
  await expect(page.getByText("Total de repasses do exercício", { exact: true })).toBeVisible();
  await page.waitForTimeout(300);
  await page.screenshot({
    path: "test-results/visual/escola-recursos-anual.png",
    fullPage: true,
  });

  await page.getByRole("link", { name: "Voltar aos repasses" }).click();
  await expect(page).toHaveURL(/dataAnual=2026-08-05/);
  await expect(page.getByText("04.10.001", { exact: true })).toBeVisible();
  await expect(page.getByText("04.10.002", { exact: true })).toHaveCount(0);
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