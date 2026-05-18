import type { UnidadeDetalhe } from "@/hooks/useUnidadeDetalhe";

export const EMPTY_FIELD_PLACEHOLDER = "—" as const;

export type CampoCadastroEssencial =
  | "designacao"
  | "cnpj"
  | "endereco"
  | "diretor"
  | "agencia"
  | "conta_corrente";

type DemonstrativoMoneyValue = number | typeof EMPTY_FIELD_PLACEHOLDER;

type CadastroEssencialLike = Pick<
  UnidadeDetalhe,
  "designacao" | "cnpj" | "endereco" | "diretor" | "agencia" | "conta_corrente"
>;

export interface DemonstrativoMemoriaData {
  nome: string;
  cnpj: string;
  endereco: string;
  agencia: string;
  contaCorrente: string;
  diretor: string;
  reprogramadoCusteio: DemonstrativoMoneyValue;
  reprogramadoCapital: DemonstrativoMoneyValue;
  parcela1Custeio: DemonstrativoMoneyValue;
  parcela1Capital: DemonstrativoMoneyValue;
  parcela2Custeio: DemonstrativoMoneyValue;
  parcela2Capital: DemonstrativoMoneyValue;
}

export interface DemonstrativoWorkbookData {
  fileName: string;
  memoria: DemonstrativoMemoriaData;
}

interface DemonstrativoFileNameData {
  designacao: string;
  nome: string;
  exercicio: string;
}

const toText = (
  value: string | number | null | undefined,
  fallback = EMPTY_FIELD_PLACEHOLDER,
) => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const hasText = (value: string | number | null | undefined) =>
  value !== null &&
  value !== undefined &&
  String(value).trim().length > 0 &&
  String(value).trim() !== EMPTY_FIELD_PLACEHOLDER;

const toMoneyCellValue = (
  value: number | string | null | undefined,
): DemonstrativoMoneyValue => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return EMPTY_FIELD_PLACEHOLDER;
  if (!value.trim()) return EMPTY_FIELD_PLACEHOLDER;

  const numericText = value
    .replace(/\s/g, "")
    .replace(/[^\d,.-]/g, "");
  const lastComma = numericText.lastIndexOf(",");
  const lastDot = numericText.lastIndexOf(".");
  const decimalSeparator = lastComma > lastDot ? "," : ".";
  const normalized =
    decimalSeparator === ","
      ? numericText.replace(/\./g, "").replace(",", ".")
      : numericText.replace(/,/g, "");
  const parsed = Number.parseFloat(normalized);

  return Number.isFinite(parsed) ? parsed : EMPTY_FIELD_PLACEHOLDER;
};

const normalizeFilePart = (value: string) => {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || "unidade";
};

export function mapUnidadeToMemoria(
  unidade: UnidadeDetalhe,
  exercicioFallback: string,
): DemonstrativoWorkbookData {
  const designacao = toText(unidade.designacao, "Sem_designacao");
  const nome = toText(unidade.nome, designacao);
  const exercicio = toText(unidade.exercicio, exercicioFallback);

  return {
    fileName: buildDemonstrativoFileName({ designacao, exercicio, nome }),
    memoria: {
      nome,
      cnpj: toText(unidade.cnpj),
      endereco: toText(unidade.endereco),
      agencia: toText(unidade.agencia),
      contaCorrente: toText(unidade.conta_corrente),
      diretor: toText(unidade.diretor),
      reprogramadoCusteio: toMoneyCellValue(unidade.reprogramado_custeio),
      reprogramadoCapital: toMoneyCellValue(unidade.reprogramado_capital),
      parcela1Custeio: toMoneyCellValue(unidade.parcela_1_custeio),
      parcela1Capital: toMoneyCellValue(unidade.parcela_1_capital),
      parcela2Custeio: toMoneyCellValue(unidade.parcela_2_custeio),
      parcela2Capital: toMoneyCellValue(unidade.parcela_2_capital),
    },
  };
}

export function getCamposCadastraisPendentes(
  unidade: Partial<CadastroEssencialLike>,
): CampoCadastroEssencial[] {
  const fields: CampoCadastroEssencial[] = [
    "designacao",
    "cnpj",
    "endereco",
    "diretor",
    "agencia",
    "conta_corrente",
  ];

  return fields.filter((field) => !hasText(unidade[field]));
}

export function hasCadastroEssencialCompleto(unidade: Partial<CadastroEssencialLike>) {
  return getCamposCadastraisPendentes(unidade).length === 0;
}

export function buildDemonstrativoFileName(data: DemonstrativoFileNameData) {
  return [
    "Demonstrativo_Basico",
    normalizeFilePart(data.exercicio),
    normalizeFilePart(data.designacao),
    normalizeFilePart(data.nome),
  ].join("_") + ".xlsx";
}
