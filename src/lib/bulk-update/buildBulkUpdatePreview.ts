/**
 * Constroi o preview/diff de uma corrida de atualizacao parcial.
 *
 * Recebe a planilha parseada + as colunas reconhecidas + a chave escolhida
 * pelo usuario. Resolve cada linha contra o banco e classifica o status.
 *
 * Toda a logica de regra de negocio v1 vive aqui. A RPC apenas aplica e
 * audita; quem decide "essa linha deve ir ou nao" e este modulo.
 */
import {
  normalizeCnpj,
  normalizeDirectorValue,
  normalizeInep,
  normalizeTextValue,
  normalizeDesignacaoForCompare,
  isEmptyValue,
} from "./normalize";
import { recognizeColumn } from "./columnAliases";
import type {
  BulkUpdateAllowedField,
  BulkUpdateAllowedKey,
  BulkUpdatePreview,
  BulkUpdatePreviewItem,
  BulkUpdatePreviewSummary,
  ParsedSpreadsheet,
  RecognizedColumn,
} from "./types";

export type BuildPreviewInput = {
  parsed: ParsedSpreadsheet;
  /** Chave escolhida pelo usuario quando ha mais de uma reconhecida. */
  chosenKey: BulkUpdateAllowedKey;
};

export type BuildPreviewContext = {
  /** Override opcional para testes — substitui a query Supabase. */
  fetchUnits?: (
    chosenKey: BulkUpdateAllowedKey,
    values: string[],
  ) => Promise<UnitForPreview[]>;
};

export type UnitForPreview = {
  id: string;
  designacao: string | null;
  inep: string | null;
  cnpj: string | null;
  diretor: string | null;
};

/**
 * Inspeciona cabecalhos da planilha e devolve as colunas reconhecidas
 * (incluindo as "ignored") e quais chaves estao disponiveis.
 */
export function inspectColumns(parsed: ParsedSpreadsheet): {
  recognizedColumns: RecognizedColumn[];
  availableKeys: BulkUpdateAllowedKey[];
  fieldColumn: string | null;
} {
  const recognizedColumns: RecognizedColumn[] = parsed.headersRaw.map((raw) => ({
    rawHeader: raw,
    recognizedAs: recognizeColumn(raw),
  }));

  const availableKeys: BulkUpdateAllowedKey[] = [];
  for (const col of recognizedColumns) {
    if (
      col.recognizedAs === "designacao" ||
      col.recognizedAs === "inep" ||
      col.recognizedAs === "cnpj"
    ) {
      if (!availableKeys.includes(col.recognizedAs)) {
        availableKeys.push(col.recognizedAs);
      }
    }
  }

  const fieldColumn =
    recognizedColumns.find((c) => c.recognizedAs === "diretor")?.rawHeader ?? null;

  return { recognizedColumns, availableKeys, fieldColumn };
}

async function fetchUnitsFromSupabase(
  chosenKey: BulkUpdateAllowedKey,
  values: string[],
): Promise<UnitForPreview[]> {
  if (values.length === 0) return [];

  // Import dinamico para que os testes do diff possam rodar sem booting
  // do client Supabase (que exige variaveis de ambiente).
  const { supabase } = await import("@/integrations/supabase/client");
  const { data, error } = await supabase
    .from("unidades_escolares")
    .select("id, designacao, inep, cnpj, diretor")
    .in(chosenKey, values);

  if (error) {
    throw new Error(`Falha ao consultar unidades: ${error.message}`);
  }
  return (data ?? []) as UnitForPreview[];
}

/** Normaliza o valor da chave conforme seu tipo. */
function normalizeKeyValue(keyType: BulkUpdateAllowedKey, raw: unknown): string {
  if (keyType === "cnpj") return normalizeCnpj(raw);
  if (keyType === "inep") return normalizeInep(raw);
  return normalizeTextValue(raw);
}

/**
 * Comparacao de chave entre planilha e banco. Para CNPJ e INEP, compara
 * apenas digitos. Para designacao, case-insensitive sobre normalizeText.
 */
function keysMatch(
  keyType: BulkUpdateAllowedKey,
  spreadsheetValue: string,
  dbValue: string | null,
): boolean {
  if (dbValue == null) return false;
  if (keyType === "cnpj") {
    return normalizeCnpj(dbValue) === spreadsheetValue;
  }
  if (keyType === "inep") {
    return normalizeInep(dbValue) === spreadsheetValue;
  }
  return (
    normalizeDesignacaoForCompare(dbValue) ===
    normalizeDesignacaoForCompare(spreadsheetValue)
  );
}

/** Encontra coluna no header bruto para um alvo canonico. */
function findRawHeaderFor(
  recognized: RecognizedColumn[],
  target: BulkUpdateAllowedKey | BulkUpdateAllowedField,
): string | null {
  return recognized.find((c) => c.recognizedAs === target)?.rawHeader ?? null;
}

/**
 * Constroi o preview completo a partir do parser + chave + colunas.
 */
export async function buildBulkUpdatePreview(
  input: BuildPreviewInput,
  ctx: BuildPreviewContext = {},
): Promise<BulkUpdatePreview> {
  const { parsed, chosenKey } = input;
  const { recognizedColumns, availableKeys, fieldColumn } =
    inspectColumns(parsed);

  const blockingErrors: string[] = [];

  // Validacoes estruturais.
  if (availableKeys.length === 0) {
    blockingErrors.push(
      "A planilha nao contem uma coluna de chave reconhecida (designacao, INEP ou CNPJ).",
    );
  } else if (!availableKeys.includes(chosenKey)) {
    blockingErrors.push(
      `A chave selecionada (${chosenKey}) nao foi encontrada nos cabecalhos da planilha.`,
    );
  }

  if (!fieldColumn) {
    blockingErrors.push(
      'A planilha precisa conter uma coluna do tipo "diretor" para que algo seja atualizado.',
    );
  }

  if (parsed.rows.length === 0) {
    blockingErrors.push("Nenhuma linha de dados encontrada apos o cabecalho.");
  }

  if (blockingErrors.length > 0) {
    return {
      items: [],
      summary: {
        totalRows: parsed.totalRows,
        readyCount: 0,
        unchangedCount: 0,
        errorCount: 0,
      },
      blockingErrors,
    };
  }

  const keyColumnHeader = findRawHeaderFor(recognizedColumns, chosenKey);
  if (!keyColumnHeader) {
    // Defensivo (chosenKey ja foi validado contra availableKeys acima).
    blockingErrors.push("Cabecalho da chave escolhida nao foi localizado.");
    return {
      items: [],
      summary: {
        totalRows: parsed.totalRows,
        readyCount: 0,
        unchangedCount: 0,
        errorCount: 0,
      },
      blockingErrors,
    };
  }

  // Tambem detectamos chave secundaria para validacao de convergencia
  // (ex: planilha traz INEP + designacao; conferimos se ambos batem na
  // mesma unidade).
  const secondaryKeys = availableKeys.filter((k) => k !== chosenKey);

  // Passo 1: extrair valores de chave por linha, detectar duplicidade.
  type StagedRow = {
    rowNumber: number;
    keyValue: string;
    newValue: string;
    secondaryKey?: BulkUpdateAllowedKey;
    secondaryValue?: string;
    raw: Record<string, unknown>;
  };

  const staged: StagedRow[] = [];
  const keyOccurrences = new Map<string, number>();

  parsed.rows.forEach((row, idx) => {
    const rowNumber = idx + 2; // header e linha 1, dados comecam em 2
    const keyRaw = row[keyColumnHeader];
    const keyValue = normalizeKeyValue(chosenKey, keyRaw);
    const newRaw = fieldColumn != null ? row[fieldColumn] : undefined;
    const newValue = normalizeDirectorValue(newRaw);

    let secondaryKey: BulkUpdateAllowedKey | undefined;
    let secondaryValue: string | undefined;
    for (const sk of secondaryKeys) {
      const header = findRawHeaderFor(recognizedColumns, sk);
      if (!header) continue;
      const v = row[header];
      const normalized = normalizeKeyValue(sk, v);
      if (normalized.length > 0) {
        secondaryKey = sk;
        secondaryValue = normalized;
        break;
      }
    }

    staged.push({
      rowNumber,
      keyValue,
      newValue,
      secondaryKey,
      secondaryValue,
      raw: row,
    });

    if (keyValue.length > 0) {
      keyOccurrences.set(keyValue, (keyOccurrences.get(keyValue) ?? 0) + 1);
    }
  });

  // Duplicidade de chave no arquivo bloqueia toda a operacao.
  const duplicates: string[] = [];
  for (const [value, count] of keyOccurrences) {
    if (count > 1) duplicates.push(value);
  }
  if (duplicates.length > 0) {
    blockingErrors.push(
      `Chave duplicada na planilha: ${duplicates.slice(0, 5).join(", ")}${
        duplicates.length > 5 ? ` (+${duplicates.length - 5})` : ""
      }. Cada unidade deve aparecer no maximo uma vez.`,
    );
    return {
      items: [],
      summary: {
        totalRows: parsed.totalRows,
        readyCount: 0,
        unchangedCount: 0,
        errorCount: 0,
      },
      blockingErrors,
    };
  }

  // Passo 2: buscar todas as unidades no banco pelo conjunto de chaves.
  const uniqueKeys = Array.from(
    new Set(staged.map((s) => s.keyValue).filter((v) => v.length > 0)),
  );
  const fetcher = ctx.fetchUnits ?? fetchUnitsFromSupabase;
  const units = await fetcher(chosenKey, uniqueKeys);

  // Indexa unidades pela chave normalizada para lookup O(1).
  const unitByKey = new Map<string, UnitForPreview[]>();
  for (const u of units) {
    const k: string | null =
      chosenKey === "cnpj"
        ? u.cnpj ? normalizeCnpj(u.cnpj) : null
        : chosenKey === "inep"
          ? u.inep ? normalizeInep(u.inep) : null
          : u.designacao ? normalizeDesignacaoForCompare(u.designacao) : null;

    if (!k) continue;
    const list = unitByKey.get(k) ?? [];
    list.push(u);
    unitByKey.set(k, list);
  }

  // Passo 3: classificar cada linha.
  const items: BulkUpdatePreviewItem[] = staged.map((row) => {
    const lookupKey =
      chosenKey === "designacao"
        ? normalizeDesignacaoForCompare(row.keyValue)
        : row.keyValue;
    const matching = lookupKey.length > 0 ? unitByKey.get(lookupKey) : undefined;

    const base: BulkUpdatePreviewItem = {
      rowNumber: row.rowNumber,
      unidadeId: null,
      designacao: null,
      inep: null,
      cnpj: null,
      keyType: chosenKey,
      keyValue: row.keyValue,
      field: "diretor",
      oldValue: null,
      newValue: row.newValue,
      status: "ready",
    };

    if (row.keyValue.length === 0) {
      return {
        ...base,
        status: "error_not_found",
        message: "Linha sem valor de chave.",
      };
    }

    if (isEmptyValue(row.newValue)) {
      return {
        ...base,
        status: "error_empty_value",
        message:
          "Novo valor de diretor vazio. Para limpar, edite individualmente.",
      };
    }

    if (!matching || matching.length === 0) {
      return {
        ...base,
        status: "error_not_found",
        message: `Unidade nao encontrada (${chosenKey} = ${row.keyValue}).`,
      };
    }

    if (matching.length > 1) {
      return {
        ...base,
        status: "error_ambiguous",
        message: `Mais de uma unidade encontrada para ${chosenKey} = ${row.keyValue}.`,
      };
    }

    const unit = matching[0];

    // Validacao de convergencia INEP/designacao quando ambos vierem.
    if (row.secondaryKey && row.secondaryValue) {
      const ok = keysMatch(row.secondaryKey, row.secondaryValue, getUnitKey(unit, row.secondaryKey));
      if (!ok) {
        return {
          ...base,
          unidadeId: unit.id,
          designacao: unit.designacao,
          inep: unit.inep,
          cnpj: unit.cnpj,
          oldValue: unit.diretor,
          status: "error_key_mismatch",
          message: `Divergencia entre ${chosenKey} (${row.keyValue}) e ${row.secondaryKey} (${row.secondaryValue}).`,
        };
      }
    }

    const old = unit.diretor ?? "";
    const isUnchanged =
      normalizeDirectorValue(old).toUpperCase() ===
      normalizeDirectorValue(row.newValue).toUpperCase();

    return {
      ...base,
      unidadeId: unit.id,
      designacao: unit.designacao,
      inep: unit.inep,
      cnpj: unit.cnpj,
      oldValue: unit.diretor,
      status: isUnchanged ? "unchanged" : "ready",
    };
  });

  const summary: BulkUpdatePreviewSummary = items.reduce(
    (acc, item) => {
      acc.totalRows += 1;
      if (item.status === "ready") acc.readyCount += 1;
      else if (item.status === "unchanged") acc.unchangedCount += 1;
      else acc.errorCount += 1;
      return acc;
    },
    { totalRows: 0, readyCount: 0, unchangedCount: 0, errorCount: 0 },
  );

  return { items, summary, blockingErrors: [] };
}

function getUnitKey(
  unit: UnitForPreview,
  key: BulkUpdateAllowedKey,
): string | null {
  if (key === "cnpj") return unit.cnpj;
  if (key === "inep") return unit.inep;
  return unit.designacao;
}
