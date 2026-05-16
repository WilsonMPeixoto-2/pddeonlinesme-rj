import { type FormEvent, useEffect, useState } from "react";
import { AlertCircle, Loader2, Save } from "lucide-react";
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

const readOnlyInputClass = "bg-muted/30 text-muted-foreground";

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
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    const nextErrors = validateUnidadeCadastro(values, {
      designacao: unidade.designacao,
    });

    setErrors(nextErrors);
    if (nextErrors.length > 0) return;

    await onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar dados cadastrais</DialogTitle>
          <DialogDescription>
            Alteracoes salvas aqui passam a valer para novas consultas e novos documentos gerados.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cadastro-designacao">Designacao</Label>
              <Input
                id="cadastro-designacao"
                value={unidade.designacao ?? ""}
                readOnly
                className={readOnlyInputClass}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cadastro-inep">INEP</Label>
              <Input
                id="cadastro-inep"
                value={unidade.inep ?? ""}
                readOnly
                className={cn(readOnlyInputClass, "font-mono tabular-nums")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cadastro-cnpj">CNPJ</Label>
              <Input
                id="cadastro-cnpj"
                value={unidade.cnpj ?? ""}
                readOnly
                className={cn(readOnlyInputClass, "font-mono tabular-nums")}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cadastro-nome">Nome completo</Label>
              <Input
                id="cadastro-nome"
                value={values.nome}
                onChange={updateField("nome")}
                disabled={isSaving}
                maxLength={255}
                required
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cadastro-diretor">Diretor(a)</Label>
              <Input
                id="cadastro-diretor"
                value={values.diretor}
                onChange={updateField("diretor")}
                disabled={isSaving}
                maxLength={160}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cadastro-endereco">Endereco</Label>
              <Textarea
                id="cadastro-endereco"
                value={values.endereco}
                onChange={updateField("endereco")}
                disabled={isSaving}
                maxLength={255}
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cadastro-agencia">Agencia</Label>
              <Input
                id="cadastro-agencia"
                value={values.agencia}
                onChange={updateField("agencia")}
                disabled={isSaving}
                maxLength={20}
                className="font-mono tabular-nums"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cadastro-conta">Conta corrente</Label>
              <Input
                id="cadastro-conta"
                value={values.conta_corrente}
                onChange={updateField("conta_corrente")}
                disabled={isSaving}
                maxLength={30}
                className="font-mono tabular-nums"
              />
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Revisao humana obrigatoria</AlertTitle>
            <AlertDescription>
              Auditoria persistente e fluxo de aprovacao ficam para Marco 6B/Auth/RLS.
            </AlertDescription>
          </Alert>

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Revise os campos</AlertTitle>
              <AlertDescription>
                <ul className="list-disc space-y-1 pl-4">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving} aria-busy={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Salvar cadastro
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
