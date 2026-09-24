import { createRemoteJWKSet, jwtVerify } from "npm:jose@6";

const EXPECTED_REPOSITORY = "WilsonMPeixoto-2/pddeonlinesme-rj";
const EXPECTED_ENVIRONMENT = "production";
const EXPECTED_REF = "refs/heads/main";
const EXPECTED_WORKFLOW_REF =
  "WilsonMPeixoto-2/pddeonlinesme-rj/.github/workflows/sync-financial-snapshot.yml@refs/heads/main";
const EXPECTED_AUDIENCE = "pdde-online-financial-publisher";
const EXPECTED_ISSUER = "https://token.actions.githubusercontent.com";
const ALLOWED_EVENTS = new Set(["push", "schedule", "repository_dispatch", "workflow_dispatch"]);
const GITHUB_JWKS = createRemoteJWKSet(
  new URL("https://token.actions.githubusercontent.com/.well-known/jwks"),
);

type FinancialRepasse = {
  inep: string;
  program: string;
  action: string;
  installment: string;
  programmed: number | null;
  paid: number | null;
  programmedCusteio: number | null;
  programmedCapital: number | null;
  paidCusteio: number | null;
  paidCapital: number | null;
  paymentDate: string | null;
  paymentOrderDate: string | null;
};

type FinancialPayload = {
  exercise: number;
  source: {
    origin: string;
    workflowRunId: number;
    artifactId: number;
  };
  repasses: FinancialRepasse[];
};

type ViewRow = {
  inep: string | null;
  programa: string | null;
  acao: string | null;
  parcela: string | null;
  valor_programado: number | null;
  valor_pago: number | null;
  custeio_programado: number | null;
  capital_programado: number | null;
  custeio_pago: number | null;
  capital_pago: number | null;
  data_pagamento: string | null;
  data_ordem_pagamento: string | null;
};

function responseJson(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function authorizeGithub(request: Request) {
  const header = request.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) throw new Error("Token OIDC ausente.");

  const { payload } = await jwtVerify(token, GITHUB_JWKS, {
    issuer: EXPECTED_ISSUER,
    audience: EXPECTED_AUDIENCE,
  });

  const repository = String(payload.repository ?? "");
  const environment = String(payload.environment ?? "");
  const ref = String(payload.ref ?? "");
  const workflowRef = String(payload.workflow_ref ?? "");
  const eventName = String(payload.event_name ?? "");

  if (repository !== EXPECTED_REPOSITORY) throw new Error("Repositório OIDC não autorizado.");
  if (environment !== EXPECTED_ENVIRONMENT) throw new Error("Environment OIDC não autorizado.");
  if (ref !== EXPECTED_REF) throw new Error("Ref OIDC não autorizada.");
  if (workflowRef !== EXPECTED_WORKFLOW_REF) throw new Error("Workflow OIDC não autorizado.");
  if (!ALLOWED_EVENTS.has(eventName)) throw new Error("Evento OIDC não autorizado.");

  return {
    repository,
    environment,
    ref,
    workflowRef,
    eventName,
    runId: String(payload.run_id ?? ""),
    sha: String(payload.sha ?? ""),
  };
}

function secretKey() {
  const modern = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (modern) {
    try {
      const keys = JSON.parse(modern) as Record<string, string>;
      if (keys.default) return keys.default;
    } catch {
      // Fallback legado abaixo.
    }
  }
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  throw new Error("Chave administrativa do Supabase indisponível no runtime.");
}

function adminHeaders(key: string, contentType = false) {
  return {
    apikey: key,
    Accept: "application/json",
    ...(contentType ? { "Content-Type": "application/json" } : {}),
  };
}

async function fetchAdminJson(url: string, key: string) {
  const response = await fetch(url, {
    headers: adminHeaders(key),
    signal: AbortSignal.timeout(30_000),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Leitura administrativa falhou: HTTP ${response.status} ${text.slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : [];
}

function isSecondCycle(row: FinancialRepasse) {
  return row.program === "PDDE BÁSICO" && (
    (row.action === "PDDE Básico" && row.installment === "2ª Parcela")
    || (row.action === "PDDE Básico — Primeira Infância" && row.installment === "P2")
  );
}

function semanticKey(row: { inep?: string | null; action?: string | null; installment?: string | null; acao?: string | null; parcela?: string | null }) {
  return [
    row.inep ?? "",
    row.action ?? row.acao ?? "",
    row.installment ?? row.parcela ?? "",
  ].join("|");
}

function numericEqual(left: unknown, right: unknown) {
  if (left === null || left === undefined || right === null || right === undefined) {
    return left === right;
  }
  return Math.abs(Number(left) - Number(right)) < 0.005;
}

async function verifyPublishedState(
  supabaseUrl: string,
  key: string,
  payload: FinancialPayload,
) {
  const fields = [
    "inep", "programa", "acao", "parcela", "valor_programado", "valor_pago",
    "custeio_programado", "capital_programado", "custeio_pago", "capital_pago",
    "data_pagamento", "data_ordem_pagamento",
  ].join(",");

  const [viewRows, integrationRows] = await Promise.all([
    fetchAdminJson(
      `${supabaseUrl}/rest/v1/vw_repasses_financeiros_unidade?select=${fields}&exercicio=eq.${payload.exercise}`,
      key,
    ) as Promise<ViewRow[]>,
    fetchAdminJson(
      `${supabaseUrl}/rest/v1/integracoes_financeiras_runs?select=workflow_run_id,artifact_id,publication_result,criado_em&exercicio=eq.${payload.exercise}&origem=eq.pdde-repasse-conciliador&order=workflow_run_id.desc,criado_em.desc&limit=1`,
      key,
    ) as Promise<Array<{ workflow_run_id: number | null; artifact_id: number | null }>>,
  ]);

  const latest = integrationRows[0] ?? null;
  if (
    !latest
    || Number(latest.workflow_run_id) !== Number(payload.source.workflowRunId)
    || Number(latest.artifact_id) !== Number(payload.source.artifactId)
  ) {
    throw new Error("Read-after-write: proveniência persistida diverge do snapshot publicado.");
  }

  const expectedSecond = payload.repasses.filter(
    (row) => isSecondCycle(row) && row.paid !== null && row.paymentDate !== null,
  );
  const observedSecond = viewRows.filter((row) => (
    row.programa === "PDDE BÁSICO"
    && (
      (row.acao === "PDDE Básico" && row.parcela === "2ª Parcela")
      || (row.acao === "PDDE Básico — Primeira Infância" && row.parcela === "P2")
    )
    && row.valor_pago !== null
    && row.data_pagamento !== null
  ));

  const expectedSchools = new Set(expectedSecond.map((row) => row.inep));
  const observedSchools = new Set(observedSecond.map((row) => row.inep).filter(Boolean));
  const expectedTotal = expectedSecond.reduce((sum, row) => sum + Number(row.paid ?? 0), 0);
  const observedTotal = observedSecond.reduce((sum, row) => sum + Number(row.valor_pago ?? 0), 0);

  if (
    expectedSchools.size !== observedSchools.size
    || !numericEqual(expectedTotal, observedTotal)
  ) {
    throw new Error(
      `Read-after-write: 2º ciclo diverge (escolas ${observedSchools.size}/${expectedSchools.size}; valor ${observedTotal.toFixed(2)}/${expectedTotal.toFixed(2)}).`,
    );
  }

  const observedByKey = new Map(viewRows.map((row) => [semanticKey(row), row]));
  const mismatches: Array<{ key: string; field: string }> = [];

  for (const expected of payload.repasses) {
    const keyName = semanticKey(expected);
    const observed = observedByKey.get(keyName);
    if (!observed) {
      mismatches.push({ key: keyName, field: "row" });
      continue;
    }

    const comparisons: Array<[string, unknown, unknown, "number" | "text"]> = [
      ["programa", expected.program, observed.programa, "text"],
      ["valor_programado", expected.programmed, observed.valor_programado, "number"],
      ["valor_pago", expected.paid, observed.valor_pago, "number"],
      ["custeio_programado", expected.programmedCusteio, observed.custeio_programado, "number"],
      ["capital_programado", expected.programmedCapital, observed.capital_programado, "number"],
      ["custeio_pago", expected.paidCusteio, observed.custeio_pago, "number"],
      ["capital_pago", expected.paidCapital, observed.capital_pago, "number"],
      ["data_pagamento", expected.paymentDate, observed.data_pagamento, "text"],
      ["data_ordem_pagamento", expected.paymentOrderDate, observed.data_ordem_pagamento, "text"],
    ];

    for (const [field, expectedValue, observedValue, kind] of comparisons) {
      if (expectedValue === null || expectedValue === undefined) continue;
      const equal = kind === "number"
        ? numericEqual(expectedValue, observedValue)
        : String(expectedValue) === String(observedValue ?? "");
      if (!equal) mismatches.push({ key: keyName, field });
    }
  }

  if (mismatches.length > 0) {
    throw new Error(`Read-after-write: view operacional diverge em ${mismatches.length} fato(s) financeiro(s).`);
  }

  return {
    workflowRunId: payload.source.workflowRunId,
    artifactId: payload.source.artifactId,
    secondInstallmentSchools: observedSchools.size,
    secondInstallmentTotal: observedTotal,
    semanticRowsVerified: payload.repasses.length,
  };
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return responseJson({ error: "Método não permitido." }, 405);

  try {
    const oidc = await authorizeGithub(request);
    const body = await request.json();
    const payload = body?.payload as FinancialPayload | undefined;

    if (
      !payload
      || payload.exercise !== 2026
      || payload.source?.origin !== "pdde-repasse-conciliador"
      || !Array.isArray(payload.repasses)
    ) {
      return responseJson({ error: "Payload financeiro inválido." }, 400);
    }

    const supabaseUrl = String(Deno.env.get("SUPABASE_URL") ?? "").replace(/\/$/, "");
    if (!supabaseUrl) throw new Error("SUPABASE_URL indisponível no runtime.");
    const key = secretKey();

    const publishResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/publish_financial_snapshot_with_order_evidence_v2`,
      {
        method: "POST",
        headers: adminHeaders(key, true),
        body: JSON.stringify({ p_payload: payload }),
        signal: AbortSignal.timeout(60_000),
      },
    );
    const publishText = await publishResponse.text();
    if (!publishResponse.ok) {
      throw new Error(
        `Supabase recusou a publicação: HTTP ${publishResponse.status} ${publishText.slice(0, 500)}`,
      );
    }

    const result = publishText ? JSON.parse(publishText) : null;
    const readAfterWrite = await verifyPublishedState(supabaseUrl, key, payload);

    return responseJson({
      transport: "github-oidc",
      oidc: { runId: oidc.runId, sha: oidc.sha, eventName: oidc.eventName },
      result,
      readAfterWrite,
    });
  } catch (error) {
    console.error(error);
    return responseJson({
      error: error instanceof Error ? error.message : String(error),
    }, 401);
  }
});
