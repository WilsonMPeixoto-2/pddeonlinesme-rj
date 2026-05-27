/**
 * Tipos compartilhados do fluxo de Atualizacao Parcial Assistida da BASE.
 *
 * Marco 10B v2. Whitelist v1: somente o campo `diretor` e alteravel.
 */

export type BulkUpdateAllowedKey = "designacao" | "inep" | "cnpj";

export type BulkUpdateAllowedField = "diretor" | "email" | "endereco";

export const BULK_UPDATE_ALLOWED_KEYS: ReadonlyArray<BulkUpdateAllowedKey> = [
  "designacao",
  "inep",
  "cnpj",
];

export const BULK_UPDATE_ALLOWED_FIELDS: ReadonlyArray<BulkUpdateAllowedField> = [
  "diretor",
  "email",
  "endereco",
];

/** Resultado bruto do parser. Nenhum dado normalizado ainda. */
export type ParsedSpreadsheet = {
  fileName: string;
  fileSize: number;
  headersRaw: string[];
  rows: Array<Record<string, unknown>>;
  totalRows: number;
};

/** Coluna reconhecida apos aplicar aliases controlados. */
export type RecognizedColumn = {
  rawHeader: string;
  recognizedAs: BulkUpdateAllowedKey | BulkUpdateAllowedField | "ignored";
};

export type BulkUpdateRowStatus =
  | "ready"
  | "unchanged"
  | "error_not_found"
  | "error_duplicate_key"
  | "error_ambiguous"
  | "error_key_mismatch"
  | "error_empty_value";

export type BulkUpdatePreviewItem = {
  rowNumber: number;
  unidadeId: string | null;
  designacao: string | null;
  inep: string | null;
  cnpj: string | null;
  keyType: BulkUpdateAllowedKey;
  keyValue: string;
  field: BulkUpdateAllowedField;
  oldValue: string | null;
  newValue: string;
  status: BulkUpdateRowStatus;
  message?: string;
};

export type BulkUpdatePreviewSummary = {
  totalRows: number;
  readyCount: number;
  unchangedCount: number;
  errorCount: number;
};

export type BulkUpdatePreview = {
  items: BulkUpdatePreviewItem[];
  summary: BulkUpdatePreviewSummary;
  /**
   * Erros bloqueantes da operacao inteira. Quando preenchido, o lote nao
   * deve ir para a etapa de confirmacao.
   */
  blockingErrors: string[];
};

/** Payload enviado a RPC apply_partial_bulk_update. */
export type ApplyPartialBulkUpdateItem = {
  rowNumber: number;
  unidadeId: string;
  field: BulkUpdateAllowedField;
  newValue: string;
  keyType: BulkUpdateAllowedKey;
  keyValue: string;
};

export type ApplyPartialBulkUpdateResponse = {
  run_id: string;
  status: "applied" | "partial" | "failed";
  total: number;
  applied: number;
  skipped: number;
  errors: number;
};
