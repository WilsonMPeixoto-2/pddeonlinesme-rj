import type { UnidadeDetalhe } from "@/hooks/useUnidadeDetalhe";

export interface UnidadeCadastroFormValues {
  nome: string;
  diretor: string;
  endereco: string;
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
  email: 255,
} as const;

export function emptyUnidadeCadastroFormValues(): UnidadeCadastroFormValues {
  return {
    nome: "",
    diretor: "",
    endereco: "",
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

  return errors;
}

export function toUnidadesEscolaresUpdate(values: UnidadeCadastroFormValues) {
  return {
    nome: normalizeRequiredText(values.nome),
    diretor: normalizeOptionalText(values.diretor),
    endereco: normalizeOptionalText(values.endereco),
  };
}
