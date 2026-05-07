import type { UnidadeDetalhe } from "@/hooks/useUnidadeDetalhe";

export interface DemonstrativoMemoriaData {
  nome: string;
  cnpj: string;
  endereco: string;
  agencia: string;
  contaCorrente: string;
  diretor: string;
  reprogramadoCusteio: number;
  reprogramadoCapital: number;
  parcela1Custeio: number;
  parcela1Capital: number;
  parcela2Custeio: number;
  parcela2Capital: number;
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

const toText = (value: string | number | null | undefined, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const toMoneyNumber = (value: number | string | null | undefined) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;

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

  return Number.isFinite(parsed) ? parsed : 0;
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
      reprogramadoCusteio: toMoneyNumber(unidade.reprogramado_custeio),
      reprogramadoCapital: toMoneyNumber(unidade.reprogramado_capital),
      parcela1Custeio: toMoneyNumber(unidade.parcela_1_custeio),
      parcela1Capital: toMoneyNumber(unidade.parcela_1_capital),
      parcela2Custeio: toMoneyNumber(unidade.parcela_2_custeio),
      parcela2Capital: toMoneyNumber(unidade.parcela_2_capital),
    },
  };
}

export function buildDemonstrativoFileName(data: DemonstrativoFileNameData) {
  return [
    "Demonstrativo_Basico",
    normalizeFilePart(data.exercicio),
    normalizeFilePart(data.designacao),
    normalizeFilePart(data.nome),
  ].join("_") + ".xlsx";
}
