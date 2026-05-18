/**
 * Aliases controlados (whitelist) para reconhecimento de colunas.
 *
 * IMPORTANTE: nao implementar fuzzy match livre. Apenas correspondencia
 * exata apos normalizeHeader. Aliases adicionais devem ser adicionados
 * conscientemente neste arquivo, com comentario justificativo se houver
 * ambiguidade de dominio (ex.: "presidente do CEC" NAO mapeia para diretor
 * automaticamente — registrar como nao reconhecida).
 */
import { normalizeHeader } from "./normalize";
import {
  BULK_UPDATE_ALLOWED_KEYS,
  BULK_UPDATE_ALLOWED_FIELDS,
  type BulkUpdateAllowedKey,
  type BulkUpdateAllowedField,
} from "./types";

type AliasTarget =
  | BulkUpdateAllowedKey
  | BulkUpdateAllowedField
  | "ignored";

/** Mapa de aliases -> alvo canonico. Chaves ja em formato normalizeHeader. */
const ALIAS_MAP: Record<string, AliasTarget> = {
  // chave: designacao
  "designacao": "designacao",
  "designação": "designacao", // tolerancia caso normalizeHeader nao remova acento (defensivo)
  "unidade": "designacao",
  "codigo da unidade": "designacao",
  "codigo unidade": "designacao",
  "cod unidade": "designacao",
  "cod da unidade": "designacao",

  // chave: inep
  "inep": "inep",
  "codigo inep": "inep",
  "cod inep": "inep",

  // chave: cnpj
  "cnpj": "cnpj",
  "cnpj cec": "cnpj",
  "cnpj uex": "cnpj",
  "cnpj da uex": "cnpj",
  "cnpj do cec": "cnpj",

  // campo: diretor
  "diretor": "diretor",
  "diretora": "diretor",
  "diretor a": "diretor", // "Diretor(a)" → "diretor a" apos normalizacao
  "nome do diretor": "diretor",
  "nome da diretora": "diretor",
  "novo diretor": "diretor",
  "nova diretora": "diretor",
  "diretor atual": "diretor",
  "diretora atual": "diretor",

  // explicitamente NAO mapeados — registrar como ignorado se vierem.
  // "presidente do cec" e ambiguo no dominio: pode ser pessoa diferente
  // do diretor. Se aparecer, fica como nao reconhecida (default no map).
};

/**
 * Reconhece uma coluna a partir de seu header bruto.
 *
 * Retorna o alvo canonico (chave, campo ou "ignored") se houver match
 * exato com algum alias na whitelist. Caso contrario, retorna "ignored".
 */
export function recognizeColumn(rawHeader: string): AliasTarget {
  const key = normalizeHeader(rawHeader);
  if (key in ALIAS_MAP) return ALIAS_MAP[key];
  return "ignored";
}

/** Lista publica de todos os aliases reconhecidos (para diagnostico/help). */
export function listKnownAliases(): Array<{ alias: string; target: AliasTarget }> {
  return Object.entries(ALIAS_MAP).map(([alias, target]) => ({ alias, target }));
}

export { BULK_UPDATE_ALLOWED_KEYS, BULK_UPDATE_ALLOWED_FIELDS };
