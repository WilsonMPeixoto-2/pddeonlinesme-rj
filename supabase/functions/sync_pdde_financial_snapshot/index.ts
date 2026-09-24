import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  buildNormalizedPublicationPayload,
  evaluatePublicationDimensions,
  isBasicSecondInstallment,
} from "../_shared/financial-publication.mjs";

const ENGINE_ROOT = "https://raw.githubusercontent.com/WilsonMPeixoto-2/pdde-repasse-conciliador/main/public/data";
const MANIFEST_URL = `${ENGINE_ROOT}/pdde-2026-snapshot.json`;
const EXPECTED_ARTIFACT = "sigef-full-163-2026";
const LIMITS = { encoded: 20 * 1024 * 1024, compressed: 10 * 1024 * 1024, raw: 50 * 1024 * 1024 };

type Manifest = {
  encoding: "gzip-base64-parts";
  parts: string[];
  publishedAt: string;
  source: {
    workflowRunId: number;
    artifactId: number;
    artifactName: string;
  };
};

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

type FinancialDimension = {
  dimensionKey: string;
  coverageObserved: number;
  coverageExpected: number;
  qualityStatus: string;
};

type FinancialPayload = {
  exercise: number;
  source: {
    workflowRunId: number;
    artifactId: number;
    snapshotDigest?: string;
    [key: string]: unknown;
  };
  schools: Array<{ inep: string }>;
  repasses: FinancialRepasse[];
  dimensions?: FinancialDimension[];
  [key: string]: unknown;
};

type ViewRepasse = {
  inep: string;
  programa: string;
  acao: string;
  parcela: string;
  valor_programado: number | null;
  valor_pago: number | null;
  custeio_programado: number | null;
  capital_programado: number | null;
  custeio_pago: number | null;
  capital_pago: number | null;
  data_pagamento: string | null;
  data_ordem_pagamento: string | null;
};

type PublicationResult = { status?: string; publication?: { status?: string } };
type IntegrationRun = { workflow_run_id: number; artifact_id: number; publication_result: string | null };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}


function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function adminKey() {
  const modern = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (modern) {
    const parsed = JSON.parse(modern);
    if (typeof parsed?.default === "string" && parsed.default) return parsed.default;
  }
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  throw new Error("SUPABASE_ADMIN_KEY_UNAVAILABLE");
}

function headers(key: string, body = false): Record<string, string> {
  const result: Record<string, string> = { apikey: key, accept: "application/json" };
  if (key.startsWith("eyJ")) result.Authorization = `Bearer ${key}`;
  if (body) result["content-type"] = "application/json";
  return result;
}

async function sb<T = unknown>(path: string, key: string, init: RequestInit = {}): Promise<T> {
  const base = Deno.env.get("SUPABASE_URL");
  if (!base) throw new Error("SUPABASE_URL_UNAVAILABLE");
  const response = await fetch(`${base.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: { ...headers(key, Boolean(init.body)), ...(init.headers ?? {}) },
    redirect: "error",
    signal: AbortSignal.timeout(60_000),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`SUPABASE_HTTP_${response.status}:${text.slice(0, 500)}`);
  return (text ? JSON.parse(text) : null) as T;
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: { accept: "application/json" }, redirect: "error", signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`SOURCE_HTTP_${response.status}`);
  return response.json();
}

async function fetchText(url: string) {
  const response = await fetch(url, { headers: { accept: "text/plain" }, redirect: "error", signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`SOURCE_PART_HTTP_${response.status}`);
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > LIMITS.encoded) throw new Error("SOURCE_PART_TOO_LARGE");
  return response.text();
}

function validateManifest(input: unknown): Manifest {
  if (!isRecord(input)) throw new Error("MANIFEST_INVALID");
  if (input.encoding !== "gzip-base64-parts") throw new Error("MANIFEST_ENCODING_UNSUPPORTED");
  if (!Array.isArray(input.parts) || input.parts.length < 1 || input.parts.length > 64) throw new Error("MANIFEST_PARTS_INVALID");
  if (!input.parts.every((part) => typeof part === "string" && /^\/data\/pdde-2026-snapshot\.part\d+\.txt$/.test(part))) {
    throw new Error("MANIFEST_PART_INVALID");
  }
  if (typeof input.publishedAt !== "string" || Number.isNaN(Date.parse(input.publishedAt))) throw new Error("MANIFEST_PUBLISHED_AT_INVALID");
  if (!isRecord(input.source)) throw new Error("MANIFEST_SOURCE_INVALID");
  if (!Number.isInteger(input.source.workflowRunId) || Number(input.source.workflowRunId) <= 0) throw new Error("MANIFEST_RUN_INVALID");
  if (!Number.isInteger(input.source.artifactId) || Number(input.source.artifactId) <= 0) throw new Error("MANIFEST_ARTIFACT_INVALID");
  if (input.source.artifactName !== EXPECTED_ARTIFACT) throw new Error("MANIFEST_ARTIFACT_NAME_INVALID");
  return {
    encoding: "gzip-base64-parts",
    parts: input.parts as string[],
    publishedAt: input.publishedAt,
    source: {
      workflowRunId: Number(input.source.workflowRunId),
      artifactId: Number(input.source.artifactId),
      artifactName: String(input.source.artifactName),
    },
  };
}

function decode64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function hex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hydrate(manifest: Manifest) {
  let encoded = "";
  for (const part of manifest.parts) {
    const text = (await fetchText(`${ENGINE_ROOT}/${part.replace(/^\/data\//, "")}`)).replace(/\s+/g, "");
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(text)) throw new Error("SNAPSHOT_BASE64_INVALID");
    encoded += text;
    if (encoded.length > LIMITS.encoded) throw new Error("SNAPSHOT_ENCODED_TOO_LARGE");
  }
  const compressed = decode64(encoded);
  if (compressed.byteLength > LIMITS.compressed) throw new Error("SNAPSHOT_COMPRESSED_TOO_LARGE");
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
  const raw = new Uint8Array(await new Response(stream).arrayBuffer());
  if (raw.byteLength > LIMITS.raw) throw new Error("SNAPSHOT_RAW_TOO_LARGE");
  const parsed: unknown = JSON.parse(new TextDecoder().decode(raw));
  if (!isRecord(parsed) || !isRecord(parsed.source)) throw new Error("SNAPSHOT_INVALID");
  if (
    parsed.publishedAt !== manifest.publishedAt ||
    parsed.source.workflowRunId !== manifest.source.workflowRunId ||
    parsed.source.artifactId !== manifest.source.artifactId ||
    parsed.source.artifactName !== manifest.source.artifactName
  ) throw new Error("SNAPSHOT_PROVENANCE_MISMATCH");
  return { snapshot: parsed, digest: hex(await crypto.subtle.digest("SHA-256", raw)), rawBytes: raw.byteLength };
}

async function createAttempt(key: string) {
  const rows = await sb<Array<{ id: string }>>("/rest/v1/financial_sync_attempts?select=id", key, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ status: "RUNNING", execution_id: Deno.env.get("SB_EXECUTION_ID") ?? null }),
  });
  return rows?.[0]?.id as string | undefined;
}

async function finishAttempt(key: string, id: string | undefined, patch: Record<string, unknown>) {
  if (!id) return;
  await sb(`/rest/v1/financial_sync_attempts?id=eq.${encodeURIComponent(id)}`, key, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ ...patch, finished_at: new Date().toISOString() }),
  }).catch((error) => console.error("ATTEMPT_UPDATE_FAILED", error instanceof Error ? error.message : String(error)));
}

function semanticKey(row: FinancialRepasse | ViewRepasse) {
  const program = "program" in row ? row.program : row.programa;
  const action = "action" in row ? row.action : row.acao;
  const installment = "installment" in row ? row.installment : row.parcela;
  return [row.inep, program, action, installment].join("|");
}

function numericEqual(a: unknown, b: unknown) {
  if (a == null || b == null) return a === b;
  return Math.abs(Number(a) - Number(b)) < 0.005;
}

async function verify(payload: FinancialPayload, key: string) {
  const rows = await sb<ViewRepasse[]>(`/rest/v1/vw_repasses_financeiros_unidade?select=inep,programa,acao,parcela,valor_programado,valor_pago,custeio_programado,capital_programado,custeio_pago,capital_pago,data_pagamento,data_ordem_pagamento&exercicio=eq.${payload.exercise}`, key);
  const runs = await sb<IntegrationRun[]>(`/rest/v1/integracoes_financeiras_runs?select=workflow_run_id,artifact_id,publication_result&exercicio=eq.${payload.exercise}&workflow_run_id=eq.${payload.source.workflowRunId}&artifact_id=eq.${payload.source.artifactId}&limit=1`, key);
  if (!Array.isArray(runs) || runs.length !== 1) throw new Error("READ_AFTER_WRITE_PROVENANCE_MISMATCH");

  const byKey = new Map((rows ?? []).map((row) => [semanticKey(row), row]));
  let mismatches = 0;
  for (const expected of payload.repasses) {
    const observed = byKey.get(semanticKey(expected));
    if (!observed) { mismatches += 1; continue; }
    const checks = [
      [expected.program, observed.programa, "text"],
      [expected.programmed, observed.valor_programado, "number"],
      [expected.paid, observed.valor_pago, "number"],
      [expected.programmedCusteio, observed.custeio_programado, "number"],
      [expected.programmedCapital, observed.capital_programado, "number"],
      [expected.paidCusteio, observed.custeio_pago, "number"],
      [expected.paidCapital, observed.capital_pago, "number"],
      [expected.paymentDate, observed.data_pagamento, "text"],
      [expected.paymentOrderDate, observed.data_ordem_pagamento, "text"],
    ] as const;
    for (const [left, right, kind] of checks) {
      if (left == null) continue;
      if (kind === "number" ? !numericEqual(left, right) : String(left) !== String(right ?? "")) mismatches += 1;
    }
  }
  if (mismatches > 0) throw new Error(`READ_AFTER_WRITE_SEMANTIC_MISMATCH:${mismatches}`);

  const second = payload.repasses.filter((row) => isBasicSecondInstallment(row) && row.paid !== null && Boolean(row.paymentDate || row.paymentOrderDate));
  return {
    semanticRowsVerified: payload.repasses.length,
    secondCycleSchools: new Set(second.map((row) => row.inep)).size,
    secondCycleTotal: second.reduce((sum, row) => sum + Number(row.paid ?? 0), 0),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  const key = adminKey();
  const triggerToken = req.headers.get("X-PDDE-Financial-Sync-Token") ?? "";
  const authorized = await sb<boolean>("/rest/v1/rpc/verify_pdde_financial_sync_token_v1", key, {
    method: "POST",
    body: JSON.stringify({ p_token: triggerToken }),
  }).catch(() => false);
  if (!authorized) return json({ error: "FORBIDDEN" }, 403);

  const attemptId = await createAttempt(key).catch(() => undefined);

  try {
    const manifest = validateManifest(await fetchJson(MANIFEST_URL));
    const { snapshot, digest, rawBytes } = await hydrate(manifest);
    const payload = buildNormalizedPublicationPayload(snapshot, manifest) as FinancialPayload;
    const dimensions = evaluatePublicationDimensions(payload);
    const blocked = (dimensions as FinancialDimension[]).filter((dimension) =>
      dimension.qualityStatus === "REJECTED" ||
      (dimension.dimensionKey !== "pdde_basic_second_installment_payment_informed" && dimension.qualityStatus !== "MATURE")
    );
    if (blocked.length) throw new Error(`SNAPSHOT_NOT_PUBLISHABLE:${blocked.map((dimension) => `${dimension.dimensionKey}:${dimension.coverageObserved}/${dimension.coverageExpected}`).join(",")}`);

    payload.source.snapshotDigest = digest;
    payload.dimensions = dimensions;

    const publication = await sb<PublicationResult>("/rest/v1/rpc/publish_financial_snapshot_with_order_evidence_v2", key, {
      method: "POST",
      body: JSON.stringify({ p_payload: payload }),
    });
    const checked = await verify(payload, key);
    const publicationStatus = publication.status ?? publication.publication?.status;
    const status = publicationStatus === "idempotent"
      ? "ALREADY_CURRENT"
      : publicationStatus === "unchanged"
        ? "UNCHANGED"
        : "PUBLISHED";

    await finishAttempt(key, attemptId, {
      status,
      source_workflow_run_id: manifest.source.workflowRunId,
      source_artifact_id: manifest.source.artifactId,
      source_published_at: manifest.publishedAt,
      snapshot_digest: digest,
      raw_bytes: rawBytes,
      schools_observed: payload.schools.length,
      repasses_observed: payload.repasses.length,
      semantic_rows_verified: checked.semanticRowsVerified,
      second_cycle_schools: checked.secondCycleSchools,
      second_cycle_total: checked.secondCycleTotal,
      error_code: null,
      error_message: null,
    });

    return json({ status, source: manifest.source, publishedAt: manifest.publishedAt, digest, ...checked });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("FINANCIAL_SYNC_FAILED", message);
    await finishAttempt(key, attemptId, { status: "FAILED", error_code: message.split(":")[0].slice(0, 120), error_message: message.slice(0, 2000) });
    return json({ status: "FAILED", error: message }, 500);
  }
});
