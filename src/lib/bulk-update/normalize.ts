/**
 * Funcoes puras de normalizacao usadas pelo fluxo de Atualizacao Parcial
 * Assistida. Nenhuma faz I/O, todas sao deterministicas.
 */

/**
 * Normaliza um cabecalho de coluna para comparacao com whitelist:
 * remove acentos, colapsa espacos e baixa para minusculo.
 */
export function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/[._\-()[\]{}]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normaliza um valor textual de chave (designacao, nome de diretor):
 * trim, colapsa espacos multiplos. Mantem case porque designacao usa
 * "04.10.001 — EM JOAO BARBALHO" e e case-sensitive no banco.
 */
export function normalizeTextValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value).trim().replace(/\s+/g, " ");
}

/**
 * Normaliza o nome do diretor para comparacao oldValue vs newValue
 * (so para detectar "sem alteracao"). Mantem case original ao gravar,
 * mas trim + colapso de espacos como minimo civilizado.
 */
export function normalizeDirectorValue(value: unknown): string {
  return normalizeTextValue(value);
}

/**
 * Normaliza CNPJ: remove tudo que nao e digito, preserva zeros.
 * Aceita 13 digitos vindos de planilhas que perderam o zero inicial.
 */
export function normalizeCnpj(value: unknown): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 13) return `0${digits}`;
  return digits;
}

/**
 * Normaliza INEP como texto. Preserva zeros a esquerda. Nao converte
 * para number — INEPs com zeros importam.
 */
export function normalizeInep(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\D/g, "");
}

/**
 * Normaliza designacao para comparacao case-insensitive sem fuzzy match.
 * Usada apenas no diff "antes igual depois", nao para gravar.
 */
export function normalizeDesignacaoForCompare(value: unknown): string {
  return normalizeTextValue(value).toUpperCase();
}

/** True se valor parece "vazio" para fins de validacao de campo alteravel. */
export function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  const s = String(value).trim();
  return s.length === 0 || s === "—" || s === "-";
}
