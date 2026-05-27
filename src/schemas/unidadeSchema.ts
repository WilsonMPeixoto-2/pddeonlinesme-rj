import { z } from "zod";

/**
 * Função utilitária para validar CNPJ de forma estrita usando o algoritmo matemático de Módulo 11.
 * Aceita CNPJs formatados (14.230.768/0001-90) ou apenas numéricos (14230768000190).
 */
export function isValidCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, "");

  if (cleanCNPJ.length !== 14) return false;

  // Elimina CNPJs com todos os dígitos repetidos (ex: 00000000000000)
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;

  // Validação do primeiro dígito verificador
  let size = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, size);
  const digits = cleanCNPJ.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += Number(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== Number(digits.charAt(0))) return false;

  // Validação do segundo dígito verificador
  size = size + 1;
  numbers = cleanCNPJ.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += Number(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== Number(digits.charAt(1))) return false;

  return true;
}

/**
 * Zod Strict Validation Schema para governança cadastral das Unidades Escolares.
 * Garante integridade absoluta dos dados informados na UI antes de salvar no Supabase.
 */
export const unidadeSchema = z.object({
  designacao: z.string()
    .min(1, "A designação (ex: 04.10.012) é obrigatória")
    .regex(/^\d{2}\.\d{2}\.\d{3}$/, "Formato de designação inválido (ex: 04.10.012)"),
  nome: z.string()
    .min(3, "O nome da unidade escolar deve ter no mínimo 3 caracteres")
    .max(150, "O nome da unidade escolar deve ter no máximo 150 caracteres"),
  inep: z.string()
    .min(1, "O código INEP é obrigatório")
    .regex(/^\d{8}$/, "O código INEP deve conter exatamente 8 dígitos numéricos"),
  cnpj: z.string()
    .min(1, "O CNPJ é obrigatório")
    .refine((val) => isValidCNPJ(val), {
      message: "CNPJ inválido ou com dígitos verificadores inconsistentes",
    }),
  diretor: z.string()
    .min(3, "O nome do(a) diretor(a) deve ter no mínimo 3 caracteres")
    .max(100, "O nome do(a) diretor(a) deve ter no máximo 100 caracteres"),
  endereco: z.string().nullable().optional(),
  email: z.string()
    .email("Formato de e-mail institucional inválido")
    .nullable()
    .optional()
    .or(z.literal("")), // Permite string vazia
});

export type UnidadeFormData = z.infer<typeof unidadeSchema>;
