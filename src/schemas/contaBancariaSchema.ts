import { z } from "zod";

// Este schema servirá como base para a Fase 2B, 
// validando os dados antes de enviá-los ao Supabase.
export const contaBancariaSchema = z.object({
  banco: z.string().min(1, "O nome do banco é obrigatório"),
  agencia: z.string()
    .min(1, "A agência é obrigatória")
    .regex(/^\d{1,4}(?:-\d)?$/, "Formato de agência inválido (ex: 1234-5)"),
  conta_corrente: z.string()
    .min(1, "A conta corrente é obrigatória")
    .regex(/^\d+(?:-\d)?$/, "Formato de conta inválido (ex: 123456-7)"),
});

export type ContaBancariaFormData = z.infer<typeof contaBancariaSchema>;
