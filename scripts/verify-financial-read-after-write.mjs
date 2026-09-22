import { pathToFileURL } from "node:url";
#!/usr/bin/env node
import {
  fetchLatestPublishedSnapshot,
  prepareFinancialPublicationPayload,
} from "./sync-financial-snapshot.mjs";

const EXPECTED_SUPABASE_URL = "https://raluxyojqosfzrfozmpz.supabase.co";

function normalizedKey(row) {
  return [
    String(row.inep ?? ""),
    String(row.action ?? row.acao ?? ""),
    String(row.installment ?? row.parcela ?? ""),
  ].join("|");
}

function isSecondInstallment(row) {
  return row.program === "PDDE BÁSICO" && (
    (row.action === "PDDE Básico" && row.installment === "2ª Parcela")
    || (row.action === "PDDE Básico — Primeira Infância" && row.installment === "P2")
  );
}

function sameNumber(left, right) {
  if (left === null || left === undefined) return true;
  return Number(right) === Number(left);
}

function sameDate(left, right) {
  if (left === null || left === undefined) return true;
  return String(right ?? "") === String(left);
}

async function supabaseRequest(path, init = {}, env = process.env) {
  const supabaseUrl = String(env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceRoleKey = String(env.SUPABASE_SERVICE_ROLE_KEY ?? "");
  if (supabaseUrl !== EXPECTED_SUPABASE_URL) {
    throw new Error("SUPABASE_URL não corresponde ao projeto PDDE Online autorizado.");
  }
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");

  const response = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    redirect: "error",
    signal: AbortSignal.timeout(60_000),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Read-after-write financeiro falhou: HTTP ${response.status} ${body.slice(0, 500)}`);
  }
  return body ? JSON.parse(body) : null;
}

export async function verifyFinancialReadAfterWrite(env = process.env) {
  const { manifest, snapshot, snapshotDigest } = await fetchLatestPublishedSnapshot();
  const payload = prepareFinancialPublicationPayload(snapshot, manifest, snapshotDigest);

  const observed = await supabaseRequest(
    "/rest/v1/vw_repasses_financeiros_unidade"
      + "?select=inep,programa,acao,parcela,valor_programado,valor_pago,custeio_programado,capital_programado,custeio_pago,capital_pago,data_pagamento,data_ordem_pagamento"
      + "&exercicio=eq.2026&limit=1000",
    {},
    env,
  );

  if (!Array.isArray(observed)) {
    throw new Error("A view operacional financeira não retornou uma coleção.");
  }

  const observedByKey = new Map(observed.map((row) => [normalizedKey(row), row]));
  const mismatches = [];

  for (const expected of payload.repasses) {
    const key = normalizedKey(expected);
    const actual = observedByKey.get(key);
    if (!actual) {
      mismatches.push({ key, reason: "missing-row" });
      continue;
    }

    const fields = [
      ["programa", expected.program, actual.programa, true],
      ["valor_programado", expected.programmed, actual.valor_programado, false],
      ["valor_pago", expected.paid, actual.valor_pago, false],
      ["custeio_programado", expected.programmedCusteio, actual.custeio_programado, false],
      ["capital_programado", expected.programmedCapital, actual.capital_programado, false],
      ["custeio_pago", expected.paidCusteio, actual.custeio_pago, false],
      ["capital_pago", expected.paidCapital, actual.capital_pago, false],
      ["data_pagamento", expected.paymentDate, actual.data_pagamento, true],
      ["data_ordem_pagamento", expected.paymentOrderDate, actual.data_ordem_pagamento, true],
    ];

    for (const [field, expectedValue, actualValue, textual] of fields) {
      const matches = textual
        ? (field.startsWith("data_") ? sameDate(expectedValue, actualValue) : String(actualValue ?? "") === String(expectedValue ?? ""))
        : sameNumber(expectedValue, actualValue);
      if (!matches) {
        mismatches.push({ key, field, expected: expectedValue, actual: actualValue });
      }
    }
  }

  if (mismatches.length > 0) {
    console.error(JSON.stringify({
      status: "VIEW_DIVERGES_FROM_ENGINE",
      mismatches: mismatches.slice(0, 25),
      mismatchCount: mismatches.length,
    }, null, 2));
    throw new Error(`A view usada pelo frontend diverge do snapshot validado em ${mismatches.length} comparação(ões).`);
  }

  const expectedSecond = payload.repasses.filter(
    (row) => isSecondInstallment(row) && typeof row.paid === "number",
  );
  const expectedSecondSchools = new Set(expectedSecond.map((row) => row.inep)).size;
  const expectedSecondTotal = expectedSecond.reduce((sum, row) => sum + row.paid, 0);

  const observedSecond = expectedSecond
    .map((row) => observedByKey.get(normalizedKey(row)))
    .filter(Boolean);
  const observedSecondSchools = new Set(observedSecond.map((row) => row.inep)).size;
  const observedSecondTotal = observedSecond.reduce(
    (sum, row) => sum + Number(row.valor_pago ?? 0),
    0,
  );

  if (
    observedSecondSchools !== expectedSecondSchools
    || Math.abs(observedSecondTotal - expectedSecondTotal) >= 0.005
  ) {
    throw new Error(
      `2º ciclo diverge após persistência: motor=${expectedSecondSchools} escolas/R$ ${expectedSecondTotal.toFixed(2)}; view=${observedSecondSchools} escolas/R$ ${observedSecondTotal.toFixed(2)}.`,
    );
  }

  const freshness = await supabaseRequest(
    "/rest/v1/rpc/get_financial_freshness_v1",
    {
      method: "POST",
      body: JSON.stringify({ p_exercise: 2026 }),
    },
    env,
  );
  const storage = Array.isArray(freshness) ? freshness[0] : null;
  if (
    !storage
    || Number(storage.workflow_run_id) !== manifest.source.workflowRunId
    || Number(storage.artifact_id) !== manifest.source.artifactId
  ) {
    throw new Error(
      `Proveniência persistida diverge do snapshot corrente: motor run=${manifest.source.workflowRunId}/artifact=${manifest.source.artifactId}; storage run=${storage?.workflow_run_id ?? "n/a"}/artifact=${storage?.artifact_id ?? "n/a"}.`,
    );
  }

  const summary = {
    status: "READ_AFTER_WRITE_OK",
    workflowRunId: manifest.source.workflowRunId,
    artifactId: manifest.source.artifactId,
    repassesChecked: payload.repasses.length,
    secondInstallment: {
      schools: observedSecondSchools,
      total: observedSecondTotal,
    },
    view: "vw_repasses_financeiros_unidade",
  };
  console.log(JSON.stringify(summary));
  return summary;
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
if (invokedPath === import.meta.url) {
  verifyFinancialReadAfterWrite().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
