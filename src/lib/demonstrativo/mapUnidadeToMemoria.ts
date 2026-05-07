import type { UnidadeDetalhe } from "@/hooks/useUnidadeDetalhe";

export interface DemonstrativoMemoriaData {
  designacao: string;
  nome: string;
  cnpj: string;
  endereco: string;
  agencia: string;
  contaCorrente: string;
  diretor: string;
  exercicio: string;
  reprogramadoCusteio: number;
  reprogramadoCapital: number;
  parcela1Custeio: number;
  parcela1Capital: number;
  parcela2Custeio: number;
  parcela2Capital: number;
}

const toText = (value: string | number | null | undefined, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const toMoneyNumber = (value: number | string | null | undefined) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;

  const normalized = value
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
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
): DemonstrativoMemoriaData {
  const designacao = toText(unidade.designacao, "Sem_designacao");
  const nome = toText(unidade.nome, designacao);
  const exercicio = toText(unidade.exercicio, exercicioFallback);

  return {
    designacao,
    nome,
    cnpj: toText(unidade.cnpj),
    endereco: toText(unidade.endereco),
    agencia: toText(unidade.agencia),
    contaCorrente: toText(unidade.conta_corrente),
    diretor: toText(unidade.diretor),
    exercicio,
    reprogramadoCusteio: toMoneyNumber(unidade.reprogramado_custeio),
    reprogramadoCapital: toMoneyNumber(unidade.reprogramado_capital),
    parcela1Custeio: toMoneyNumber(unidade.parcela_1_custeio),
    parcela1Capital: toMoneyNumber(unidade.parcela_1_capital),
    parcela2Custeio: toMoneyNumber(unidade.parcela_2_custeio),
    parcela2Capital: toMoneyNumber(unidade.parcela_2_capital),
  };
}

export function buildDemonstrativoFileName(data: DemonstrativoMemoriaData) {
  return [
    "Demonstrativo_Basico",
    normalizeFilePart(data.exercicio),
    normalizeFilePart(data.designacao),
    normalizeFilePart(data.nome),
  ].join("_") + ".xlsx";
}
