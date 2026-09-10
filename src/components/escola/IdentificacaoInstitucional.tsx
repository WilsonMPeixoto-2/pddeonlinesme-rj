import {
  Building2,
  GraduationCap,
  Hash,
  Mail,
  MapPin,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

function Field({
  label,
  value,
  icon: Icon,
  mono = false,
  className,
}: {
  label: string;
  value: string | number | null | undefined;
  icon: React.ElementType;
  mono?: boolean;
  className?: string;
}) {
  const display = value === null || value === undefined || String(value).trim() === ""
    ? "Não informado"
    : String(value);

  return (
    <div className={cn("rounded-xl border border-border/55 bg-background/45 p-4", className)}>
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </div>
      <p
        className={cn(
          "mt-2 break-words text-sm font-medium leading-relaxed text-foreground",
          mono && "font-mono tabular-nums",
          display === "Não informado" && "font-normal text-muted-foreground",
        )}
      >
        {display}
      </p>
    </div>
  );
}

export function IdentificacaoInstitucional({
  designacao,
  nome,
  inep,
  cnpj,
  diretor,
  email,
  endereco,
  alunos,
}: {
  designacao: string | null | undefined;
  nome: string | null | undefined;
  inep: string | null | undefined;
  cnpj: string | null | undefined;
  diretor: string | null | undefined;
  email: string | null | undefined;
  endereco: string | null | undefined;
  alunos: number | null | undefined;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-2">
        <Field
          label="Designação"
          value={designacao}
          icon={Building2}
          className="xl:col-span-2"
        />
        <Field
          label="Nome completo"
          value={nome}
          icon={Building2}
          className="xl:col-span-2"
        />
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Identificadores e porte
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="INEP" value={inep} icon={Hash} mono />
          <Field label="CNPJ" value={cnpj} icon={Hash} mono />
          <Field label="Alunos" value={alunos} icon={GraduationCap} mono />
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Responsável e contato
        </p>
        <div className="grid gap-3 xl:grid-cols-2">
          <Field label="Diretor(a)" value={diretor} icon={UserRound} />
          <Field label="E-mail institucional" value={email} icon={Mail} />
        </div>
      </div>

      <Field label="Endereço" value={endereco} icon={MapPin} />
    </div>
  );
}
