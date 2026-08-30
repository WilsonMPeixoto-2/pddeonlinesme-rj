import type { Page, Route } from "@playwright/test";

const TEST_EMAIL = "admin.teste@sme.rio";
const TEST_PASSWORD = "senha-e2e-segura";

const testUser = {
  id: "00000000-0000-4000-8000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: TEST_EMAIL,
  email_confirmed_at: "2026-01-01T00:00:00.000Z",
  phone: "",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  identities: [],
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const unidade = {
  unidade_id: "00000000-0000-4000-8000-000000000101",
  id: "00000000-0000-4000-8000-000000000101",
  designacao: "04.10.001",
  nome: "EM Alpha",
  inep: "33000001",
  cnpj: "12.345.678/0001-95",
  diretor: "Diretora Alpha",
  endereco: "Rua Alpha, 100",
  banco: "Banco do Brasil",
  agencia: "1234-X",
  conta_corrente: "12345-6",
  exercicio: 2026,
  programa: "basico",
  reprogramado_custeio: 50000,
  reprogramado_capital: 25000,
  parcela_1_custeio: 10000,
  parcela_1_capital: 5000,
  parcela_2_custeio: 10000,
  parcela_2_capital: 5000,
  total_reprogramado: 75000,
  total_parcelas: 30000,
  total_disponivel_inicial: 105000,
  updated_at: "2026-08-30T12:00:00.000Z",
};

const unidade2 = {
  ...unidade,
  unidade_id: "00000000-0000-4000-8000-000000000102",
  id: "00000000-0000-4000-8000-000000000102",
  designacao: "04.10.002",
  nome: "EM Beta",
  inep: "33000002",
  cnpj: "98.765.432/0001-10",
  diretor: "Diretor Beta",
  reprogramado_custeio: 0,
  reprogramado_capital: 0,
  total_reprogramado: 0,
  total_parcelas: 0,
  total_disponivel_inicial: 0,
};

function json(route: Route, body: unknown, headers: Record<string, string> = {}) {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    headers,
    body: JSON.stringify(body),
  });
}

export async function installSupabaseMock(page: Page) {
  await page.route("https://example.supabase.co/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    if (url.pathname === "/auth/v1/token" && method === "POST") {
      const body = request.postDataJSON() as { email?: string; password?: string };
      if (body.email !== TEST_EMAIL || body.password !== TEST_PASSWORD) {
        return route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ message: "Invalid login credentials" }),
        });
      }

      return json(route, {
        access_token: "e2e-access-token",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: "e2e-refresh-token",
        user: testUser,
      });
    }

    if (url.pathname === "/auth/v1/user") {
      return json(route, testUser);
    }

    if (url.pathname.includes("/rest/v1/vw_dashboard_basico")) {
      return json(route, {
        exercicio: 2026,
        programa: "basico",
        total_unidades: 2,
        total_reprogramado_custeio: 50000,
        total_reprogramado_capital: 25000,
        total_reprogramado: 75000,
        total_parcela_1_custeio: 10000,
        total_parcela_1_capital: 5000,
        total_parcela_2_custeio: 10000,
        total_parcela_2_capital: 5000,
        total_parcelas: 30000,
        total_disponivel_inicial: 105000,
        updated_at_max: "2026-08-30T12:00:00.000Z",
      });
    }

    if (url.pathname.includes("/rest/v1/vw_unidades_localizador")) {
      if (method === "HEAD") {
        const completos = url.searchParams.toString().includes("inep=not.is.null");
        return route.fulfill({
          status: 200,
          headers: {
            "content-range": completos ? "0-0/1" : "0-1/2",
            "range-unit": "items",
          },
        });
      }

      return json(route, [
        {
          id: unidade.id,
          designacao: unidade.designacao,
          nome: unidade.nome,
          inep: unidade.inep,
          cnpj: unidade.cnpj,
          diretor: unidade.diretor,
          updated_at: unidade.updated_at,
        },
        {
          id: unidade2.id,
          designacao: unidade2.designacao,
          nome: unidade2.nome,
          inep: unidade2.inep,
          cnpj: unidade2.cnpj,
          diretor: unidade2.diretor,
          updated_at: unidade2.updated_at,
        },
      ]);
    }

    if (url.pathname.includes("/rest/v1/vw_unidade_detalhe")) {
      const wantsSingle =
        request.headers()["accept"]?.includes("application/vnd.pgrst.object+json") ||
        url.searchParams.has("unidade_id");

      return json(route, wantsSingle ? unidade : [unidade, unidade2]);
    }

    if (url.pathname.includes("/rest/v1/document_generation_runs")) {
      return json(route, [], { "content-range": "*/0" });
    }

    if (url.pathname.includes("/rest/v1/unidades_escolares")) {
      if (method === "PATCH") {
        return json(route, []);
      }
      return json(route, { email: "alpha@sme.rio" });
    }

    if (url.pathname.includes("/rest/v1/despesas_fiscais")) {
      return json(route, []);
    }

    if (url.pathname.includes("/rest/v1/rpc/update_unidade_cadastro_minima")) {
      return json(route, "cadastro-atualizado");
    }

    if (url.pathname.includes("/rest/v1/rpc/")) {
      return json(route, null);
    }

    if (method === "HEAD") {
      return route.fulfill({
        status: 200,
        headers: { "content-range": "*/0", "range-unit": "items" },
      });
    }

    return json(route, []);
  });
}

export async function signInAsTestAdmin(page: Page) {
  await page.goto("/");
  await page.getByLabel("E-mail institucional").first().fill(TEST_EMAIL);
  await page.getByLabel("Senha").first().fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/dashboard");
}

export { TEST_EMAIL, unidade };
