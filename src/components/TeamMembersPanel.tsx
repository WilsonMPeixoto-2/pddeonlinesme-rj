import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ShieldCheck, UserPlus, X, AlertTriangle, Mail } from "lucide-react";
import { toast } from "sonner";

import {
  useAdminUsers,
  useAdminAssignRole,
  useAdminRevokeRole,
  type AppRole,
  type AdminUserRow,
} from "@/hooks/useAdminUsers";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador",
  operador: "Operador",
};

const ROLE_BADGE_CLASS: Record<AppRole, string> = {
  admin: "bg-primary/10 text-primary border-primary/30 hover:bg-primary/15",
  operador:
    "bg-muted/40 text-foreground border-border/60 hover:bg-muted/60",
};

const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const fmtInitials = (email: string) => {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (local.slice(0, 2) || "??").toUpperCase();
};

export function TeamMembersPanel() {
  const { user: currentUser } = useAuth();
  const usersQuery = useAdminUsers();
  const assignMutation = useAdminAssignRole();
  const revokeMutation = useAdminRevokeRole();

  const [assignEmail, setAssignEmail] = useState("");
  const [assignRole, setAssignRole] = useState<AppRole>("operador");
  const [pendingRevoke, setPendingRevoke] = useState<{
    userId: string;
    email: string;
    role: AppRole;
  } | null>(null);

  const isLoading = usersQuery.isLoading;
  const isFetching = usersQuery.isFetching;
  const users = usersQuery.data ?? [];
  const errorMessage = usersQuery.error?.message ?? null;

  const handleAssign = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = assignEmail.trim();
    if (!email) {
      toast.warning("Informe o e-mail do usuario existente.");
      return;
    }
    assignMutation.mutate(
      { email, role: assignRole },
      {
        onSuccess: () => {
          toast.success(`Papel ${ROLE_LABELS[assignRole]} atribuido.`, {
            description: email,
          });
          setAssignEmail("");
        },
        onError: (err) => {
          toast.error("Nao foi possivel atribuir o papel.", {
            description: err.message,
          });
        },
      },
    );
  };

  const handleConfirmRevoke = () => {
    if (!pendingRevoke) return;
    const { userId, email, role } = pendingRevoke;
    revokeMutation.mutate(
      { userId, role },
      {
        onSuccess: (deleted) => {
          if (deleted) {
            toast.success(`Papel ${ROLE_LABELS[role]} revogado.`, {
              description: email,
            });
          } else {
            toast.info("Nada a revogar — papel ja estava ausente.");
          }
          setPendingRevoke(null);
        },
        onError: (err) => {
          toast.error("Nao foi possivel revogar o papel.", {
            description: err.message,
          });
        },
      },
    );
  };

  const renderRoleBadge = (row: AdminUserRow, role: AppRole) => {
    const isSelf = currentUser?.id === row.user_id;
    const onlyAdminLeft =
      role === "admin" &&
      users.filter((u) => u.roles.includes("admin")).length <= 1;
    const blocksRevoke = role === "admin" && isSelf && onlyAdminLeft;
    return (
      <Badge
        key={`${row.user_id}-${role}`}
        variant="outline"
        className={cn(
          "h-6 gap-1 px-2 text-[11px]",
          ROLE_BADGE_CLASS[role],
        )}
      >
        <span>{ROLE_LABELS[role]}</span>
        {blocksRevoke ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center text-muted-foreground/60">
                <AlertTriangle className="h-3 w-3" />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              Nao pode revogar — voce e o unico administrador.
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={() =>
              setPendingRevoke({
                userId: row.user_id,
                email: row.email,
                role,
              })
            }
            className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-destructive/20 hover:text-destructive"
            aria-label={`Revogar ${ROLE_LABELS[role]} de ${row.email}`}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        )}
      </Badge>
    );
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Card className="border-border/70">
        <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" aria-hidden />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">
                Equipe da 4ª CRE
              </CardTitle>
              <CardDescription>
                Atribua ou revogue papeis (admin/operador) para usuarios ja
                cadastrados. Cadastro de novo usuario continua via fluxo de
                autenticacao do Supabase.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          {/* Assign role form */}
          <form
            className="rounded-md border border-dashed border-border/70 bg-muted/20 p-4"
            onSubmit={handleAssign}
          >
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Atribuir papel a usuario existente
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px_auto]">
              <div className="space-y-1.5">
                <Label htmlFor="assign-email" className="text-xs">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="assign-email"
                    type="email"
                    value={assignEmail}
                    onChange={(e) => setAssignEmail(e.target.value)}
                    placeholder="email@dominio"
                    className="h-10 pl-9"
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="assign-role" className="text-xs">
                  Papel
                </Label>
                <Select
                  value={assignRole}
                  onValueChange={(v) => setAssignRole(v as AppRole)}
                >
                  <SelectTrigger id="assign-role" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operador">Operador</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  className="h-10 w-full sm:w-auto"
                  disabled={assignMutation.isPending || !assignEmail.trim()}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {assignMutation.isPending ? "Atribuindo..." : "Atribuir"}
                </Button>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              O usuario precisa ter conta criada via Supabase Auth (signup ou
              convite institucional). Nao envia e-mail.
            </p>
          </form>

          {/* Users table */}
          <div className="overflow-hidden rounded-md border border-border/70">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Membro
                  </TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Papeis
                  </TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Ultima atividade
                  </TableHead>
                  <TableHead className="h-10 w-[110px] text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-full" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-3.5 w-40" />
                            <Skeleton className="h-3 w-24 opacity-60" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-3.5 w-20" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-5 w-16 rounded-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : errorMessage ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6">
                      <div className="mx-auto flex max-w-md flex-col items-center gap-2 text-center">
                        <AlertTriangle className="h-5 w-5 text-warning" />
                        <p className="text-sm font-medium">
                          Nao foi possivel listar usuarios
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {errorMessage}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                      Nenhum usuario cadastrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((row) => {
                    const initials = fmtInitials(row.email);
                    const confirmed = Boolean(row.email_confirmed_at);
                    const isSelf = currentUser?.id === row.user_id;
                    return (
                      <TableRow
                        key={row.user_id}
                        className={cn(
                          "group transition-colors",
                          isSelf && "bg-primary/[0.04]",
                        )}
                      >
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-muted/80 to-muted/30 text-xs font-semibold uppercase text-foreground/90 shadow-inner">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {row.email}
                                {isSelf && (
                                  <span className="ml-1.5 text-[10px] uppercase tracking-wider text-primary/80">
                                    voce
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                Criado em {fmtDate(row.created_at)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {row.roles.length === 0 ? (
                            <span className="text-xs text-muted-foreground">
                              Nenhum
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {row.roles.map((r) => renderRoleBadge(row, r))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground tabular-nums">
                          {fmtDate(row.last_sign_in_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          {confirmed ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-0.5 text-[11px] font-medium text-success">
                              <span className="h-1.5 w-1.5 rounded-full bg-success" />
                              Confirmado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-[11px] font-medium text-warning">
                              <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                              Pendente
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {isFetching && !isLoading ? "Atualizando..." : `${users.length} usuario${users.length === 1 ? "" : "s"} cadastrado${users.length === 1 ? "" : "s"}`}
            </span>
            <button
              type="button"
              onClick={() => usersQuery.refetch()}
              className="rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            >
              Recarregar
            </button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={pendingRevoke !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRevoke(null);
        }}
        tone="destructive"
        title="Revogar papel deste usuario?"
        description={
          <>
            Apos confirmar, o usuario perdera o papel <strong>{pendingRevoke ? ROLE_LABELS[pendingRevoke.role] : ""}</strong>{" "}
            no PDDE Online. Acoes restritas a esse papel serao bloqueadas.
          </>
        }
        highlight={
          pendingRevoke
            ? `${pendingRevoke.email} · ${ROLE_LABELS[pendingRevoke.role]}`
            : undefined
        }
        confirmLabel="Revogar papel"
        loading={revokeMutation.isPending}
        onConfirm={handleConfirmRevoke}
      />
    </TooltipProvider>
  );
}
