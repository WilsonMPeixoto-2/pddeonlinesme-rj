import type { UnidadeDetalhe } from "@/hooks/useUnidadeDetalhe";

export interface UnidadeCadastroFormValues {
  nome: string;
  diretor: string;
  endereco: string;
  banco: string;
  agencia: string;
  conta_corrente: string;
  email: string;
}

export interface UnidadeCadastroValidationContext {
  designacao: string | null | undefined;
  diretorAtual: string | null | undefined;
}

export const UNIDADE_CADASTRO_LIMITS = {
  nome: 255,
  diretor: 160,
  endereco: 255,
  banco: 80,
  agencia: 20,
  conta_corrente: 30,
  email: 255,
} as const;

const AGENCY_PATTERN = /^[0-9xX-]+$/;
const ACCOUNT_PATTERN = /^[0-9xX./-]+$/;

export function emptyUnidadeCadastroFormValues(): UnidadeCadastroFormValues {
  return {
    nome: "",
    diretor: "",
    endereco: "",
    banco: "",
    agencia: "",
    conta_corrente: "",
    email: "",
  };
}

export function toUnidadeCadastroFormValues(
  unidade: UnidadeDetalhe | null | undefined,
  emailOverride?: string,
): UnidadeCadastroFormValues {
  if (!unidade) return emptyUnidadeCadastroFormValues();

  return {
    nome: unidade.nome ?? "",
    diretor: unidade.diretor ?? "",
    endereco: unidade.endereco ?? "",
    banco: unidade.banco ?? "",
    agencia: unidade.agencia ?? "",
    conta_corrente: unidade.conta_corrente ?? "",
    email: emailOverride ?? "",
  };
}

export function normalizeOptionalText(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function normalizeRequiredText(value: string) {
  return value.trim();
}

export function validateUnidadeCadastro(
  values: UnidadeCadastroFormValues,
  context: UnidadeCadastroValidationContext,
): string[] {
  const errors: string[] = [];
  const nome = normalizeRequiredText(values.nome);
  const designacao = context.designacao?.trim() ?? "";
  const diretorAtual = context.diretorAtual?.trim() ?? "";
  const diretor = values.diretor.trim();
  const endereco = values.endereco.trim();
  const banco = values.banco.trim();
  const agencia = values.agencia.trim();
  const contaCorrente = values.conta_corrente.trim();

  if (!nome) errors.push("Nome e obrigatorio.");
  if (!designacao) errors.push("Designacao e obrigatoria no cadastro atual.");
  if (diretorAtual && !diretor) {
    errors.push("Diretor(a) nao pode ser apagado sem substituto.");
  }

  if (nome.length > UNIDADE_CADASTRO_LIMITS.nome) {
    errors.push(`Nome deve ter no maximo ${UNIDADE_CADASTRO_LIMITS.nome} caracteres.`);
  }
  if (diretor.length > UNIDADE_CADASTRO_LIMITS.diretor) {
    errors.push(`Diretor(a) deve ter no maximo ${UNIDADE_CADASTRO_LIMITS.diretor} caracteres.`);
  }
  if (endereco.length > UNIDADE_CADASTRO_LIMITS.endereco) {
    errors.push(`Endereco deve ter no maximo ${UNIDADE_CADASTRO_LIMITS.endereco} caracteres.`);
  }
  if (banco.length > UNIDADE_CADASTRO_LIMITS.banco) {
    errors.push(`Banco deve ter no maximo ${UNIDADE_CADASTRO_LIMITS.banco} caracteres.`);
  }
  if (agencia.length > UNIDADE_CADASTRO_LIMITS.agencia) {
    errors.push(`Agencia deve ter no maximo ${UNIDADE_CADASTRO_LIMITS.agencia} caracteres.`);
  }
  if (contaCorrente.length > UNIDADE_CADASTRO_LIMITS.conta_corrente) {
    errors.push(`Conta corrente deve ter no maximo ${UNIDADE_CADASTRO_LIMITS.conta_corrente} caracteres.`);
  }
  if (agencia && !AGENCY_PATTERN.test(agencia)) {
    errors.push("Agencia aceita apenas digitos, hifen e X.");
  }
  if (contaCorrente && !ACCOUNT_PATTERN.test(contaCorrente)) {
    errors.push("Conta corrente aceita apenas digitos, hifen, ponto, barra e X.");
  }

  return errors;
}

export function toUnidadesEscolaresUpdate(values: UnidadeCadastroFormValues) {
  return {
    nome: normalizeRequiredText(values.nome),
    diretor: normalizeOptionalText(values.diretor),
    endereco: normalizeOptionalText(values.endereco),
    agencia: normalizeOptionalText(values.agencia),
    conta_corrente: normalizeOptionalText(values.conta_corrente),
  };
}

export function toContasBancariasUpdate(values: UnidadeCadastroFormValues) {
  return {
    banco: normalizeOptionalText(values.banco),
    agencia: normalizeOptionalText(values.agencia),
    conta_corrente: normalizeOptionalText(values.conta_corrente),
  };
}
