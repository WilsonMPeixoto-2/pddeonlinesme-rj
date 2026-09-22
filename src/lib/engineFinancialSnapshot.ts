import { z } from "zod";

import type { RepasseFinanceiro } from "@/lib/financeiroPDDE";

const ENGINE_DATA_ROOT =
  "https://raw.githubusercontent.com/WilsonMPeixoto-2/pdde-repasse-conciliador/main/public/data";
const MANIFEST_URL = `${ENGINE_DATA_ROOT}/pdde-2026-snapshot.json`;

const manifestSchema = z.object({
  encoding: z.literal("gzip-base64-parts"),
  parts: z.array(z.string().min(1)).min(1),
  publishedAt: z.string().min(1),
  source: z.object({
    workflowRunId: z.number().int().positive(),
    artifactId: z.number().int().positive(),
    artifactName: z.string().min(1),
  }),
});

const accountSchema = z.object({
  bank: z.string().nullable().optional(),
  agency: z.string().nullable().optional(),
  number: z.string().nullable().optional(),
}).nullable().optional();

const creditEvidenceSchema = z.object({
  status: z.string(),
  date: z.string().nullable(),
  amountCents: z.number().nullable(),
  document: z.string().nullable(),
}).nullable().optional();

const installmentSchema = z.object({
  installment: z.string().nullable(),
  programmedCents: z.number(),
  paymentInformedCents: z.number(),
  paymentInformedDate: z.string().nullable(),
  paymentOrderDate: z.string().nullable(),
  account: accountSchema,
  creditEvidence: creditEvidenceSchema,
  breakdown: z.object({
    programmedCusteioCents: z.number().nullable(),
    programmedCapitalCents: z.number().nullable(),
    paidCusteioCents: z.number().nullable(),
    paidCapitalCents: z.number().nullable(),
  }).nullable().optional(),
});

const schoolSchema = z.object({
  school: z.object({
    inep: z.string().min(1),
    sme: z.string().min(1),
    name: z.string().min(1),
  }),
  programs: z.array(z.object({
    name: z.string().min(1),
    installments: z.array(installmentSchema),
  })),
});

const snapshotSchema = z.object({
  publishedAt: z.string().min(1),
  source: manifestSchema.shape.source,
  portfolio: z.object({
    fiscalYear: z.number().int(),
  }).passthrough(),
  schools: z.record(z.string(), schoolSchema),
});

export type EngineFinancialManifest = z.infer<typeof manifestSchema>;
export type EngineFinancialSnapshot = z.infer<typeof snapshotSchema>;

export interface UnidadeFinanceiraIdentity {
  id: string;
  designacao: string;
  nome: string | null;
  inep: string;
}

function normalizedText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function stripExercise(value: string): string {
  return value
    .replace(/\b20\d{2}\b/g, "")
    .replace(/^[/\s-]+|[/\s-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const STANDALONE_QUALITY_ACTIONS = new Map([
  ["EDUCACAO CONECTADA", "Educação Conectada"],
  ["ESCOLA E COMUNIDADE", "Escola e Comunidade"],
  ["ESCOLA DAS ADOLESCENCIAS", "Escola das Adolescências"],
  ["CANTINHO DA LEITURA", "Cantinho da Leitura"],
]);

function classifyProgram(programName: string): { program: string; action: string } | null {
  const raw = programName.trim();
  const text = normalizedText(raw);
  const standaloneAction = normalizedText(stripExercise(raw));

  if (text.includes("PRIMEIRA INFANCIA")) {
    return { program: "PDDE BÁSICO", action: "PDDE Básico — Primeira Infância" };
  }

  const qualityAction = STANDALONE_QUALITY_ACTIONS.get(standaloneAction);
  if (qualityAction) return { program: "PDDE QUALIDADE", action: qualityAction };
  if (standaloneAction === "PDDE SRM") {
    return { program: "PDDE EQUIDADE", action: "PDDE SRM" };
  }

  if (text.includes("QUALIDADE")) {
    let action = raw.split("/").slice(1).join("/").trim();
    if (!action) action = raw.replace(/PDDE\s+QUALIDADE/i, "").trim();
    action = stripExercise(action);
    return { program: "PDDE QUALIDADE", action: action || "PDDE Qualidade" };
  }

  if (text.includes("EQUIDADE")) {
    let action = raw.split("/").slice(1).join("/").trim();
    if (!action) action = raw.replace(/PDDE\s+EQUIDADE/i, "").trim();
    action = stripExercise(action);
    return { program: "PDDE EQUIDADE", action: action || "PDDE Equidade" };
  }

  if (text.includes("PDDE BASICO") || text === "PDDE" || text.startsWith("PDDE /")) {
    return { program: "PDDE BÁSICO", action: "PDDE Básico" };
  }

  return null;
}

function canonicalInstallment(value: string | null): string {
  const raw = String(value ?? "").trim();
  const text = normalizedText(raw);
  if (!raw) return "Parcela única";
  if (text === "P1" || text.includes("1A PARCELA") || text.includes("1ª PARCELA") || text.includes("PRIMEIRA PARCELA")) {
    return text === "P1" ? "P1" : "1ª Parcela";
  }
  if (text === "P2" || text.includes("2A PARCELA") || text.includes("2ª PARCELA") || text.includes("SEGUNDA PARCELA")) {
    return text === "P2" ? "P2" : "2ª Parcela";
  }
  return raw;
}

function installmentOrder(value: string | null, index: number): number {
  const text = normalizedText(value);
  if (text === "P1" || text.includes("1A PARCELA") || text.includes("1ª PARCELA") || text.includes("PRIMEIRA")) return 1;
  if (text === "P2" || text.includes("2A PARCELA") || text.includes("2ª PARCELA") || text.includes("SEGUNDA")) return 2;
  return index + 1;
}

function centsToReais(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value / 100 : null;
}

function informedPayment(installment: z.infer<typeof installmentSchema>): number | null {
  if (!Number.isFinite(installment.paymentInformedCents)) return null;
  if (
    installment.paymentInformedCents === 0
    && !installment.paymentInformedDate
    && !installment.paymentOrderDate
  ) {
    return null;
  }
  return installment.paymentInformedCents / 100;
}

function confirmedBankCreditDate(installment: z.infer<typeof installmentSchema>): string | null {
  if (normalizedText(installment.creditEvidence?.status) !== "CREDITO LOCALIZADO") return null;
  return installment.creditEvidence?.date ?? null;
}

function recordKey(inep: string | null, action: string, installment: string): string {
  return [inep ?? "", normalizedText(action), normalizedText(installment)].join("|");
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value.replace(/\s+/g, ""));
  const result = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    result[index] = binary.charCodeAt(index);
  }
  return result;
}

async function gunzipText(bytes: Uint8Array): Promise<string> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("Este navegador não oferece suporte à descompressão do snapshot financeiro.");
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}

async function fetchText(url: string, signal?: AbortSignal): Promise<string> {
  const response = await fetch(url, {
    headers: { Accept: "text/plain" },
    cache: "no-store",
    signal,
  });
  if (!response.ok) {
    throw new Error(`Fonte financeira corrente indisponível: HTTP ${response.status}`);
  }
  return response.text();
}

export async function fetchEngineFinancialManifest(signal?: AbortSignal): Promise<EngineFinancialManifest> {
  const response = await fetch(MANIFEST_URL, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  });
  if (!response.ok) {
    throw new Error(`Manifesto financeiro corrente indisponível: HTTP ${response.status}`);
  }
  return manifestSchema.parse(await response.json());
}

export async function fetchLatestEngineFinancialSnapshot(signal?: AbortSignal): Promise<{
  manifest: EngineFinancialManifest;
  snapshot: EngineFinancialSnapshot;
}> {
  const manifest = await fetchEngineFinancialManifest(signal);
  const encoded = (
    await Promise.all(
      manifest.parts.map((part) => fetchText(`${ENGINE_DATA_ROOT}/${part.replace(/^\/data\//, "")}`, signal)),
    )
  ).join("");

  const snapshot = snapshotSchema.parse(JSON.parse(await gunzipText(decodeBase64(encoded))));
  if (
    snapshot.publishedAt !== manifest.publishedAt
    || snapshot.source.workflowRunId !== manifest.source.workflowRunId
    || snapshot.source.artifactId !== manifest.source.artifactId
  ) {
    throw new Error("Snapshot financeiro corrente diverge do manifesto publicado.");
  }
  return { manifest, snapshot };
}

export function mergeEngineSnapshotRepasses(input: {
  databaseRows: RepasseFinanceiro[];
  units: UnidadeFinanceiraIdentity[];
  snapshot: EngineFinancialSnapshot;
}): RepasseFinanceiro[] {
  if (input.snapshot.portfolio.fiscalYear !== 2026) return input.databaseRows;

  const unitByInep = new Map(
    input.units.map((unit) => [unit.inep, unit]),
  );
  const existingByKey = new Map(
    input.databaseRows.map((row) => [recordKey(row.inep, row.acao, row.parcela), row]),
  );
  const merged = new Map(existingByKey);

  for (const schoolRecord of Object.values(input.snapshot.schools)) {
    const identity = unitByInep.get(schoolRecord.school.inep);
    if (!identity) continue;

    for (const programRecord of schoolRecord.programs) {
      const classified = classifyProgram(programRecord.name);
      if (!classified) continue;

      programRecord.installments.forEach((installment, index) => {
        const parcela = canonicalInstallment(installment.installment);
        const key = recordKey(schoolRecord.school.inep, classified.action, parcela);
        const existing = existingByKey.get(key);
        const paid = informedPayment(installment);
        const breakdown = installment.breakdown ?? null;
        const account = installment.account ?? null;

        merged.set(key, {
          id: existing?.id ?? `engine:${schoolRecord.school.inep}:${normalizedText(classified.action)}:${normalizedText(parcela)}`,
          unidade_id: identity.id,
          designacao: identity.designacao,
          nome: identity.nome ?? schoolRecord.school.name,
          inep: schoolRecord.school.inep,
          exercicio: 2026,
          programa: classified.program,
          acao: classified.action,
          parcela,
          ordem_exibicao: installmentOrder(installment.installment, index),
          valor_programado: installment.programmedCents / 100,
          valor_pago: paid,
          data_pagamento: installment.paymentInformedDate,
          data_ordem_pagamento: installment.paymentOrderDate,
          credito_bancario_confirmado: confirmedBankCreditDate(installment) !== null,
          data_credito_bancario: confirmedBankCreditDate(installment),
          conta_bancaria_id: existing?.conta_bancaria_id ?? null,
          banco: account?.bank ?? existing?.banco ?? null,
          agencia: account?.agency ?? existing?.agencia ?? null,
          conta_corrente: account?.number ?? existing?.conta_corrente ?? null,
          custeio_programado: centsToReais(breakdown?.programmedCusteioCents),
          capital_programado: centsToReais(breakdown?.programmedCapitalCents),
          custeio_pago: paid === null ? null : centsToReais(breakdown?.paidCusteioCents),
          capital_pago: paid === null ? null : centsToReais(breakdown?.paidCapitalCents),
        });
      });
    }
  }

  return [...merged.values()].sort(
    (left, right) =>
      (left.designacao ?? "").localeCompare(right.designacao ?? "", "pt-BR")
      || left.ordem_exibicao - right.ordem_exibicao
      || left.acao.localeCompare(right.acao, "pt-BR"),
  );
}
