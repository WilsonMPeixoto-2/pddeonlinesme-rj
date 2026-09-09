import { type ChangeEvent, type ReactNode, useEffect, useState, useActionState } from "react";
import { AlertCircle, Loader2, Lock, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { UnidadeDetalhe } from "@/hooks/useUnidadeDetalhe";
import {
  toUnidadeCadastroFormValues,
  validateUnidadeCadastro,
  type UnidadeCadastroFormValues,
} from "@/lib/unidadeCadastro";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { isValidCNPJ, unidadeSchema } from "@/schemas/unidadeSchema";

interface UnidadeCadastroEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidade: UnidadeDetalhe;
  emailAtual?: string;
  isSaving: boolean;
  onSubmit: (values: UnidadeCadastroFormValues) => Promise<void>;
}

const readOnlyInputClass =
  "border-dashed border-border/60 bg-muted/30 text-muted-foreground cursor-not-allowed";

const editableInputClass =
  "transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/60";

interface FieldGroupProps {
  title: string;
  hint?: string;
  icon?: ReactNode;
  children: ReactNode;
}

function FieldGroup({ title, hint, icon, children }: FieldGroupProps) {
  return (
    <section className="space-y-3">
      <header className="flex items-baseline justify-between gap-3 border-b border-border/40 pb-1.5">
        <div className="flex items-center gap-1.5">
          {icon}
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {title}
          </h3>
        </div>
        {hint && (
          <p className="hidden text-[11px] text-muted-foreground/70 @sm:block">
            {hint}
          </p>
        )}
      </header>
      <div className="grid grid-cols-1 gap-4 @md:grid-cols-2">{children}</div>
    </section>
  );
}

export function UnidadeCadastroEditDialog({
  open,
  onOpenChange,
  unidade,
  emailAtual,
  onSubmit,
}: UnidadeCadastroEditDialogProps) {
  const [values, setValues] = useState<UnidadeCadastroFormValues>(() =>
    toUnidadeCadastroFormValues(unidade, emailAtual),
  );

  const [errors, formAction, isPending] = useActionState(
    async (_prevState: string[], _formData: FormData) => {
      const nextErrors = validateUnidadeCadastro(values, {
        designacao: unidade.designacao,
        diretorAtual: unidade.diretor,
      });

      const parseResult = unidadeSchema.safeParse({
        designacao: unidade.designacao ?? "00.00.000",
        nome: values.nome,
        inep: unidade.inep ?? "00000000",
        cnpj: unidade.cnpj ?? "00.000.000/0000-00",
        diretor: values.diretor,
        endereco: values.endereco,
        email: values.email,
      });

      if (!parseResult.success) {
        parseResult.error.errors.forEach((err) => {
          const path = err.path[0];
          if (path === "nome" || path === "diretor" || path === "email" || path === "endereco") {
            nextErrors.push(err.message);
          }
        });
      }

      if (nextErrors.length > 0) return nextErrors;

      try {
        await onSubmit(values);
        return [];
      } catch (err: unknown) {
        return [getErrorMessage(err, "Erro ao salvar dados cadastrais.")];
      }
    },
    [],
  );

  const cnpjValido = unidade.cnpj ? isValidCNPJ(unidade.cnpj) : false;
  const inepValido = unidade.inep ? /^\d{8}$/.test(unidade.inep) : false;

  useEffect(() => {
    if (!open) return;
    setValues(toUnidadeCadastroFormValues(unidade, emailAtual));
  }, [open, unidade, emailAtual]);

  const updateField =
    (field: keyof UnidadeCadastroFormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
    };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="@container max-h-[92vh] overflow-y-auto p-6 sm:max-w-2xl sm:p-7">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-lg">Editar dados cadastrais</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Atualize os dados institucionais da unidade. Contas bancárias são
            mantidas separadamente para preservar a identidade financeira e o histórico dos repasses.
          </DialogDescription>
        </DialogHeader>

        <form key={open ? "open" : "closed"} className="mt-2 space-y-6" action={formAction} noValidate>
          {errors && errors.length > 0 && (
            <Alert variant="destructive" className="border-destructive/40">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Revise os campos antes de salvar</AlertTitle>
              <AlertDescription>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm">
                  {errors.map((error) => <li key={error}>{error}</li>)}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <FieldGroup
            title="Identificação"
            hint="Identificadores institucionais protegidos."
            icon={<Lock className="h-3 w-3 text-muted-foreground/60" aria-hidden="true" />}
          >
            <div className="space-y-1.5 @md:col-span-2">
              <Label htmlFor="cadastro-designacao" className="text-xs font-medium">Designação</Label>
              <Input
                id="cadastro-designacao"
                value={unidade.designacao ?? ""}
                readOnly
                tabIndex={-1}
                className={readOnlyInputClass}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="cadastro-inep" className="text-xs font-medium">INEP</Label>
                {unidade.inep && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-1",
                    inepValido
                      ? "bg-success/10 text-success border border-success/20"
                      : "bg-destructive/10 text-destructive border border-destructive/20",
                  )}>
                    {inepValido ? "✓ Válido (8d)" : "✗ Inválido"}
                  </span>
                )}
              </div>
              <Input
                id="cadastro-inep"
                value={unidade.inep ?? ""}
                readOnly
                tabIndex={-1}
                className={cn(readOnlyInputClass, "font-mono tabular-nums")}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="cadastro-cnpj" className="text-xs font-medium">CNPJ</Label>
                {unidade.cnpj && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-1",
                    cnpjValido
                      ? "bg-success/10 text-success border border-success/20"
                      : "bg-destructive/10 text-destructive border border-destructive/20",
                  )}>
                    {cnpjValido ? "✓ Válido (Mod 11)" : "✗ Inconsistente"}
                  </span>
                )}
              </div>
              <Input
                id="cadastro-cnpj"
                value={unidade.cnpj ?? ""}
                readOnly
                tabIndex={-1}
                className={cn(readOnlyInputClass, "font-mono tabular-nums")}
              />
            </div>
          </FieldGroup>

          <FieldGroup title="Dados cadastrais" hint="Refletem em consultas e novos documentos.">
            <div className="space-y-1.5 @md:col-span-2">
              <Label htmlFor="cadastro-nome" className="text-xs font-medium">Nome completo</Label>
              <Input
                id="cadastro-nome"
                value={values.nome}
                onChange={updateField("nome")}
                disabled={isPending}
                maxLength={255}
                required
                className={editableInputClass}
              />
            </div>

            <div className="space-y-1.5 @md:col-span-2">
              <Label htmlFor="cadastro-diretor" className="text-xs font-medium">Diretor(a)</Label>
              <Input
                id="cadastro-diretor"
                value={values.diretor}
                onChange={updateField("diretor")}
                disabled={isPending}
                maxLength={160}
                className={editableInputClass}
              />
            </div>

            <div className="space-y-1.5 @md:col-span-2">
              <Label htmlFor="cadastro-email" className="text-xs font-medium">E-mail institucional de contato</Label>
              <Input
                id="cadastro-email"
                type="email"
                value={values.email}
                onChange={updateField("email")}
                disabled={isPending}
                placeholder="exemplo@sme.rio"
                maxLength={255}
                className={editableInputClass}
              />
            </div>

            <div className="space-y-1.5 @md:col-span-2">
              <Label htmlFor="cadastro-endereco" className="text-xs font-medium">Endereço</Label>
              <Textarea
                id="cadastro-endereco"
                value={values.endereco}
                onChange={updateField("endereco")}
                disabled={isPending}
                maxLength={255}
                rows={3}
                className={editableInputClass}
              />
            </div>
          </FieldGroup>

          <Alert className="border-primary/20 bg-primary/[0.04] text-foreground">
            <Lock className="h-4 w-4 text-primary" />
            <AlertTitle className="text-sm font-semibold">Dados bancários protegidos</AlertTitle>
            <AlertDescription className="text-sm leading-relaxed text-muted-foreground">
              Banco, agência e conta não são alterados neste formulário. Essa separação evita que uma edição cadastral modifique a conta associada a repasses já registrados.
            </AlertDescription>
          </Alert>

          <DialogFooter className="gap-2 @md:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="transition-colors duration-150"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              aria-busy={isPending}
              className="min-w-[160px] @md:min-w-[180px] transition-colors duration-150"
            >
              {isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Salvando...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" aria-hidden="true" />Salvar cadastro</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
