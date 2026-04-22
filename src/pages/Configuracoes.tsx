import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserPlus, Trash2, ShieldCheck, Settings2, Lock } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const usuarios = [
  { email: "4cre@sme.rio", nome: "4ª CRE Coordenação", papel: "admin", ativo: true },
  { email: "ana.coord@sme.rio", nome: "Ana Coord", papel: "operador", ativo: true },
  { email: "bruno.tec@sme.rio", nome: "Bruno Técnico", papel: "operador", ativo: false },
];

export default function Configuracoes() {
  const [pendingRemove, setPendingRemove] = useState<{ email: string; nome: string } | null>(null);

  return (
    <AppLayout>
      <TooltipProvider delayDuration={200}>
        <div className="space-y-6">
          {/* Page header */}
          <div className="flex flex-col gap-1 border-b border-border/60 pb-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Administração
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie a equipe da 4ª CRE e os parâmetros gerais do sistema.
            </p>
          </div>

          {/* Team management */}
          <Card className="border-border/70">
            <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <ShieldCheck className="h-4.5 w-4.5" aria-hidden />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold">Equipe da 4ª CRE</CardTitle>
                  <CardDescription>
                    Apenas pessoas convidadas podem acessar o sistema. Defina papéis com responsabilidade.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              {/* Invite form */}
              <form
                className="rounded-md border border-dashed border-border/70 bg-muted/20 p-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Protótipo: convite enviado");
                }}
              >
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Convidar novo membro
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <div className="space-y-1.5">
                    <Label htmlFor="conv-nome" className="text-xs">Nome completo</Label>
                    <Input id="conv-nome" placeholder="Ex.: Maria da Silva" className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="conv-email" className="text-xs">E-mail institucional</Label>
                    <Input id="conv-email" placeholder="email@sme.rio" type="email" className="h-10" />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" className="h-10 w-full sm:w-auto">
                      <UserPlus className="mr-2 h-4 w-4" /> Enviar convite
                    </Button>
                  </div>
                </div>
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
                        Papel
                      </TableHead>
                      <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Status
                      </TableHead>
                      <TableHead className="h-10 w-[80px] text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios.map((u) => (
                      <TableRow key={u.email} className="group">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase text-muted-foreground">
                              {u.nome
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{u.nome}</p>
                              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {u.papel === "admin" ? (
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/15">
                              Administrador
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Operador</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {u.ativo ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                              <span className="h-1.5 w-1.5 rounded-full bg-success" />
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                              Inativo
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => setPendingRemove({ email: u.email, nome: u.nome })}
                                aria-label="Remover usuário"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remover acesso</TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* System parameters */}
          <Card className="border-border/70">
            <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Settings2 className="h-4.5 w-4.5" aria-hidden />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold">Parâmetros do sistema</CardTitle>
                  <CardDescription>
                    Configurações globais aplicadas a todas as planilhas geradas.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-5">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="param-senha" className="text-sm font-medium">
                    Senha das células protegidas
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input id="param-senha" defaultValue="ANA" className="h-10 pl-9 font-mono" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Aplicada nas abas Demonstrativo e Memória das planilhas geradas.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="param-exercicio" className="text-sm font-medium">
                    Exercício vigente
                  </Label>
                  <Input
                    id="param-exercicio"
                    defaultValue="2025"
                    inputMode="numeric"
                    className="h-10 tabular-nums"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ano de referência usado nas gerações de demonstrativos.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-4">
                <Button variant="ghost" type="button">
                  Cancelar
                </Button>
                <Button onClick={() => toast.success("Protótipo: parâmetros salvos")}>
                  Salvar alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <ConfirmDialog
          open={Boolean(pendingRemove)}
          onOpenChange={(o) => !o && setPendingRemove(null)}
          tone="destructive"
          title="Remover acesso ao sistema?"
          description={
            <>
              Esta pessoa perderá imediatamente o acesso ao PDDE Online da 4ª CRE.
              Você poderá convidá-la novamente a qualquer momento.
            </>
          }
          highlight={pendingRemove ? `${pendingRemove.nome} · ${pendingRemove.email}` : undefined}
          confirmLabel="Remover acesso"
          onConfirm={() => {
            toast.success("Protótipo: acesso removido");
            setPendingRemove(null);
          }}
        />
      </TooltipProvider>
    </AppLayout>
  );
}
