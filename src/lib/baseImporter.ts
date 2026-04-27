/**
 * @deprecated Importador prototípico do fluxo Lovable.
 * Substituído pelo importador oficial em scripts/import_base_xlsx.py,
 * que usa validação robusta, Decimal para valores financeiros, separação
 * semântica entre designacao e nome, e aplicação transacional via DATABASE_URL.
 *
 * Será removido ou substituído no PR 3B durante o refactor das telas que
 * adaptam o frontend ao schema semântico v2.2.
 *
 * NÃO USE este arquivo como referência de importador oficial.
 * Consulte docs/MIGRATION_PLAN_FINAL.md, docs/SCHEMA_MAPPING.md
 * e scripts/import_base_xlsx.py.
 */
/**
 * Importador da planilha oficial BASE.xlsx (4ª CRE / SME-RJ).
 *
 * Responsabilidades:
 *  1. Parsear a aba `BASE` da planilha.
 *  2. Normalizar e validar cada linha contra o schema de `unidades_escolares`.
 *  3. Fazer upsert pelo campo `designacao` (índice único na migration).
 *  4. Registrar o resultado em `import_logs` (auditoria).
 *
 * Mantém o frontend desacoplado: parsing fica nesta lib, UI consome o resultado.
 */
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

/* ---------- Tipos públicos ---------- */

export type ParsedRow = {
  rowIndex: number; // linha real na planilha (1-based, contando header)
  designacao: string;
  inep: string | null;
  cnpj: string | null;
  diretor: string | null;
  endereco: string | null;
  agencia: string | null;
  conta_corrente: string | null;
  reprogramado_custeio: number;
  reprogramado_capital: number;
  parcela_1_custeio: number;
  parcela_1_capital: number;
  parcela_2_custeio: number;
  parcela_2_capital: number;
};

export type ParseError = {
  rowIndex: number;
  field: string;
  message: string;
  rawValue?: string;
};

export type ParseResult = {
  rows: ParsedRow[];
  errors: ParseError[];
  totalRows: number;
  filename: string;
};

export type ImportResult = {
  totalRows: number;
  insertedRows: number;
  updatedRows: number;
  skippedRows: number;
  errors: ParseError[];
  status: "success" | "partial" | "failed";
};

/* ---------- Helpers ---------- */

const HEADER_MAP: Record<string, keyof ParsedRow | "ignore"> = {
  DESIGNAÇÃO: "designacao",
  DESIGNACAO: "designacao",
  NOME: "ignore", // Mantemos `designacao` como chave principal (código 04.10.xxx)
  INEP: "inep",
  CNPJ: "cnpj",
  "REPROGRAMADO CUSTEIO": "reprogramado_custeio",
  "REPROGRAMADO CAPITAL": "reprogramado_capital",
  DIRETOR: "diretor",
  ENDEREÇO: "endereco",
  ENDERECO: "endereco",
  AGENCIA: "agencia",
  AGÊNCIA: "agencia",
  "CONTA CORRENTE": "conta_corrente",
  "1 PARCELA CUSTEIO": "parcela_1_custeio",
  "1 PARCELA CAPITAL": "parcela_1_capital",
  "2 PARCELA CUSTEIO": "parcela_2_custeio",
  "2 PARCELA CAPITAL": "parcela_2_capital",
};

const onlyDigits = (v: unknown) => String(v ?? "").replace(/\D/g, "");

function toNumber(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v).replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function toText(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

/**
 * Designação no formato `04.10.xxx` é a chave estável da unidade.
 * Mas para a UI, queremos exibir o NOME completo. Combinamos os dois:
 * `designacao` no banco = "04.10.001 — EM EMA NEGRÃO DE LIMA"
 */
function buildDesignacao(codigo: string, nome: string): string {
  const c = codigo.trim();
  const n = nome.trim();
  if (!c && !n) return "";
  if (!n) return c;
  if (!c) return n;
  return `${c} — ${n}`;
}

/* ---------- Parse ---------- */

export async function parseBaseXlsx(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });

  if (!wb.SheetNames.includes("BASE")) {
    return {
      rows: [],
      errors: [
        {
          rowIndex: 0,
          field: "arquivo",
          message: "Aba 'BASE' não encontrada na planilha.",
        },
      ],
      totalRows: 0,
      filename: file.name,
    };
  }

  const ws = wb.Sheets["BASE"];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: null,
    raw: true,
  });

  // Detect header keys present (case-insensitive contra HEADER_MAP)
  const sample = raw[0] ?? {};
  const fieldByHeader = new Map<string, keyof ParsedRow | "ignore">();
  Object.keys(sample).forEach((h) => {
    const key = h.toUpperCase().trim();
    const target = HEADER_MAP[key];
    if (target) fieldByHeader.set(h, target);
  });

  const rows: ParsedRow[] = [];
  const errors: ParseError[] = [];

  raw.forEach((rawRow, idx) => {
    const rowIndex = idx + 2; // +1 para 1-based, +1 para pular header

    // Extrai campos
    const get = (key: keyof ParsedRow): unknown => {
      for (const [h, target] of fieldByHeader) {
        if (target === key) return rawRow[h];
      }
      return null;
    };

    const codigo = String(rawRow["DESIGNAÇÃO"] ?? rawRow["DESIGNACAO"] ?? "").trim();
    const nome = String(rawRow["NOME"] ?? "").trim();
    if (!codigo && !nome) return; // linha vazia

    const designacao = buildDesignacao(codigo, nome);
    if (!designacao) {
      errors.push({
        rowIndex,
        field: "designacao",
        message: "Linha sem designação nem nome — ignorada.",
      });
      return;
    }

    const inepRaw = onlyDigits(get("inep"));
    const cnpjRaw = onlyDigits(get("cnpj"));

    if (inepRaw && inepRaw.length !== 8) {
      errors.push({
        rowIndex,
        field: "INEP",
        message: `INEP com ${inepRaw.length} dígitos (esperado 8).`,
        rawValue: String(get("inep") ?? ""),
      });
    }
    if (cnpjRaw && cnpjRaw.length !== 14) {
      errors.push({
        rowIndex,
        field: "CNPJ",
        message: `CNPJ com ${cnpjRaw.length} dígitos (esperado 14).`,
        rawValue: String(get("cnpj") ?? ""),
      });
    }

    rows.push({
      rowIndex,
      designacao,
      inep: inepRaw && inepRaw.length === 8 ? inepRaw : null,
      cnpj: cnpjRaw && cnpjRaw.length === 14 ? cnpjRaw : null,
      diretor: toText(get("diretor")),
      endereco: toText(get("endereco")),
      agencia: toText(get("agencia")),
      conta_corrente: toText(get("conta_corrente")),
      reprogramado_custeio: toNumber(get("reprogramado_custeio")),
      reprogramado_capital: toNumber(get("reprogramado_capital")),
      parcela_1_custeio: toNumber(get("parcela_1_custeio")),
      parcela_1_capital: toNumber(get("parcela_1_capital")),
      parcela_2_custeio: toNumber(get("parcela_2_custeio")),
      parcela_2_capital: toNumber(get("parcela_2_capital")),
    });
  });

  return { rows, errors, totalRows: rows.length, filename: file.name };
}

/* ---------- Upsert + log ---------- */

export async function importParsedRows(
  parsed: ParseResult,
  userId: string,
): Promise<ImportResult> {
  if (parsed.rows.length === 0) {
    await logImport(userId, parsed, {
      insertedRows: 0,
      updatedRows: 0,
      skippedRows: 0,
      status: "failed",
    });
    return {
      totalRows: 0,
      insertedRows: 0,
      updatedRows: 0,
      skippedRows: 0,
      errors: parsed.errors,
      status: "failed",
    };
  }

  // Mapeia para shape do banco (sem rowIndex). Mantém recebido/gasto/saldo_anterior
  // sob valores derivados das parcelas e reprogramado para que a UI atual continue funcionando.
  const payload = parsed.rows.map((r) => ({
    designacao: r.designacao,
    inep: r.inep,
    cnpj: r.cnpj,
    diretor: r.diretor,
    endereco: r.endereco,
    agencia: r.agencia,
    conta_corrente: r.conta_corrente,
    reprogramado_custeio: r.reprogramado_custeio,
    reprogramado_capital: r.reprogramado_capital,
    parcela_1_custeio: r.parcela_1_custeio,
    parcela_1_capital: r.parcela_1_capital,
    parcela_2_custeio: r.parcela_2_custeio,
    parcela_2_capital: r.parcela_2_capital,
    // Derivados para compatibilidade com KPIs existentes
    saldo_anterior: r.reprogramado_custeio + r.reprogramado_capital,
    recebido:
      r.parcela_1_custeio +
      r.parcela_1_capital +
      r.parcela_2_custeio +
      r.parcela_2_capital,
  }));

  // Conta o que já existe para diferenciar inserted vs updated
  const designacoes = payload.map((p) => p.designacao);
  const { data: existing } = await supabase
    .from("unidades_escolares")
    .select("designacao")
    .in("designacao", designacoes);

  const existingSet = new Set((existing ?? []).map((e) => e.designacao));
  const inserted = payload.filter((p) => !existingSet.has(p.designacao)).length;
  const updated = payload.length - inserted;

  const { error } = await supabase
    .from("unidades_escolares")
    .upsert(payload, { onConflict: "designacao", ignoreDuplicates: false });

  if (error) {
    const failResult: ImportResult = {
      totalRows: parsed.totalRows,
      insertedRows: 0,
      updatedRows: 0,
      skippedRows: parsed.totalRows,
      errors: [
        ...parsed.errors,
        { rowIndex: 0, field: "banco", message: error.message },
      ],
      status: "failed",
    };
    await logImport(userId, parsed, {
      insertedRows: 0,
      updatedRows: 0,
      skippedRows: parsed.totalRows,
      status: "failed",
    });
    return failResult;
  }

  const status: ImportResult["status"] =
    parsed.errors.length === 0 ? "success" : "partial";

  await logImport(userId, parsed, {
    insertedRows: inserted,
    updatedRows: updated,
    skippedRows: 0,
    status,
  });

  return {
    totalRows: parsed.totalRows,
    insertedRows: inserted,
    updatedRows: updated,
    skippedRows: 0,
    errors: parsed.errors,
    status,
  };
}

async function logImport(
  userId: string,
  parsed: ParseResult,
  counts: {
    insertedRows: number;
    updatedRows: number;
    skippedRows: number;
    status: ImportResult["status"];
  },
) {
  await supabase.from("import_logs").insert({
    user_id: userId,
    source: "BASE.xlsx",
    filename: parsed.filename,
    total_rows: parsed.totalRows,
    inserted_rows: counts.insertedRows,
    updated_rows: counts.updatedRows,
    skipped_rows: counts.skippedRows,
    errors: parsed.errors.slice(0, 100), // cap para não inflar a row
    status: counts.status,
  });
}
