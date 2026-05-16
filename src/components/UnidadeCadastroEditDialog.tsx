import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useState } from "react";
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
import { cn } from "@/lib/utils";

interface UnidadeCadastroEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidade: UnidadeDetalhe;
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
          <p className="hidden text-[11px] text-muted-foreground/70 sm:block">
            {hint}
          </p>
        )}
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function UnidadeCadastroEditDialog({
  open,
  onOpenChange,
  unidade,
  isSaving,
  onSubmit,
}: UnidadeCadastroEditDialogProps) {
  const [values, setValues] = useState<UnidadeCadastroFormValues>(() =>
    toUnidadeCadastroFormValues(unidade),
  );
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setValues(toUnidadeCadastroFormValues(unidade));
    setErrors([]);
  }, [open, unidade]);

  const updateField =
    (field: keyof UnidadeCadastroFormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((current) => ({
        ...current,
        [field]: event.target.value,
      }));
      if (errors.length > 0) setErrors([]);
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    const nextErrors = validateUnidadeCadastro(values, {
      designacao: unidade.designacao,
      diretorAtual: unidade.diretor,
    });

    setErrors(nextErrors);
    if (nextErrors.length > 0) return;

    await onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto p-6 sm:max-w-2xl sm:p-7">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-lg">Editar dados cadastrais</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Alterações afetam novas consultas e novos documentos gerados.
            Arquivos já baixados não são reprocessados.
          </DialogDescription>
        </DialogHeader>

        <form className="mt-2 space-y-6" onSubmit={handleSubmit} noValidate>
          {errors.length > 0 && (
            <Alert variant="destructive" className="border-destructive/40">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Revise os campos antes de salvar</AlertTitle>
              <AlertDescription>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <FieldGroup
            title="Identificação"
            hint="Gerenciado pela BASE.xlsx e Marco 6B."
            icon={
              <Lock
                className="h-3 w-3 text-muted-foreground/60"
                aria-hidden="true"
              />
            }
          >
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cadastro-designacao" className="text-xs font-medium">
                Designação
              </Label>
              <Input
                id="cadastro-designacao"
                value={unidade.designacao ?? ""}
                readOnly
                tabIndex={-1}
                className={readOnlyInputClass}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cadastro-inep" className="text-xs font-medium">
                INEP
              </Label>
              <Input
                id="cadastro-inep"
                value={unidade.inep ?? ""}
                readOnly
                tabIndex={-1}
                className={cn(readOnlyInputClass, "font-mono tabular-nums")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cadastro-cnpj" className="text-xs font-medium">
                CNPJ
              </Label>
              <Input
                id="cadastro-cnpj"
                value={unidade.cnpj ?? ""}
                readOnly
                tabIndex={-1}
                className={cn(readOnlyInputClass, "font-mono tabular-nums")}
              />
            </div>
          </FieldGroup>

          <FieldGroup
            title="Dados cadastrais"
            hint="Refletem em consultas e novos documentos."
          >
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cadastro-nome" className="text-xs font-medium">
                Nome completo
              </Label>
              <Input
                id="cadastro-nome"
                value={values.nome}
                onChange={updateField("nome")}
                disabled={isSaving}
                maxLength={255}
                required
                className={editableInputClass}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cadastro-diretor" className="text-xs font-medium">
                Diretor(a)
              </Label>
              <Input
                id="cadastro-diretor"
                value={values.diretor}
                onChange={updateField("diretor")}
                disabled={isSaving}
                maxLength={160}
                className={editableInputClass}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cadastro-endereco" className="text-xs font-medium">
                Endereço
              </Label>
              <Textarea
                id="cadastro-endereco"
                value={values.endereco}
                onChange={updateField("endereco")}
                disabled={isSaving}
                maxLength={255}
                rows={3}
                className={editableInputClass}
              />
            </div>
          </FieldGroup>

          <FieldGroup
            title="Dados bancários"
            hint="Preservam zeros à esquerda e caracteres como X."
          >
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cadastro-banco" className="text-xs font-medium">
                Banco
              </Label>
              <Input
                id="cadastro-banco"
                value={values.banco}
                onChange={updateField("banco")}
                disabled={isSaving}
                maxLength={80}
                className={editableInputClass}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cadastro-agencia" className="text-xs font-medium">
                Agência
              </Label>
              <Input
                id="cadastro-agencia"
                value={values.agencia}
                onChange={updateField("agencia")}
                disabled={isSaving}
                maxLength={20}
                className={cn(editableInputClass, "font-mono tabular-nums")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cadastro-conta" className="text-xs font-medium">
                Conta corrente
              </Label>
              <Input
                id="cadastro-conta"
                value={values.conta_corrente}
                onChange={updateField("conta_corrente")}
                disabled={isSaving}
                maxLength={30}
                className={cn(editableInputClass, "font-mono tabular-nums")}
              />
            </div>
          </FieldGroup>

          <Alert className="border-amber-500/30 bg-amber-500/[0.06] text-foreground dark:border-amber-400/25 dark:bg-amber-400/[0.05]">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-sm font-semibold">
              Protótipo controlado — sem auditoria persistente
            </AlertTitle>
            <AlertDescription className="text-sm leading-relaxed text-muted-foreground">
              Este fluxo grava no cadastro compartilhado em produção. Trilha de
              auditoria e fluxo de aprovação chegam no Marco 6B (Auth/RLS).
              Confirme os valores antes de salvar.
            </AlertDescription>
          </Alert>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="transition-colors duration-150"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              aria-busy={isSaving}
              className="min-w-[160px] transition-colors duration-150"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                  Salvar cadastro
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
