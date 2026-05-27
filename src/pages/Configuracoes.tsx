import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Settings2, Lock, FileStack,
  FileSpreadsheet, ClipboardList, FileSignature, Coins, ScrollText, ShieldCheck, Upload,
} from "lucide-react";
import { toast } from "sonner";
import { TeamMembersPanel } from "@/components/TeamMembersPanel";
import { SecurityCenterPanel } from "@/components/SecurityCenterPanel";
import { useExercicio } from "@/hooks/useExercicio";

export default function Configuracoes() {
  const { exercicio, setExercicio } = useExercicio();
  return (
    <AppLayout>
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

        {/* Team management (Marco 6B v0 — dados reais via list_admin_users + admin_assign_role + admin_revoke_role) */}
        <TeamMembersPanel />

        {/* Security and database compliance panel (Marco 6B) */}
        <SecurityCenterPanel />

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
                    value={exercicio}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                      if (v.length === 4) setExercicio(v);
                    }}
                    inputMode="numeric"
                    maxLength={4}
                    className="h-10 tabular-nums"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ano de referência sincronizado com o seletor do cabeçalho. Aplicado em todas as gerações de demonstrativos.
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

          {/* Templates & Documents */}
          <Card className="border-border/70">
            <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <FileStack className="h-4 w-4" aria-hidden />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold">Templates e Documentos</CardTitle>
                  <CardDescription>
                    Gerencie os modelos oficiais usados na geração automática de documentos.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-3">
              {[
                { icon: FileSpreadsheet, name: "Demonstrativo Básico", status: "ativo" as const },
                { icon: ClipboardList, name: "Relação de Bens Adquiridos", status: "pendente" as const },
                { icon: FileSignature, name: "Termo de Doação", status: "pendente" as const },
                { icon: Coins, name: "Consolidação de Pesquisas de Preços", status: "pendente" as const },
                { icon: ScrollText, name: "Ata do Conselho Escolar", status: "pendente" as const },
                { icon: ShieldCheck, name: "Parecer do Conselho Fiscal", status: "pendente" as const },
              ].map((doc) => (
                <div key={doc.name} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/10 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/8 text-primary">
                      <doc.icon className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {doc.status === "ativo" ? (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-success/30 bg-success/8 text-success">Ativo</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-border/50 bg-muted/40 text-muted-foreground">Não configurado</Badge>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toast.info(`Em breve: atualizar template — ${doc.name}`)}>
                      <Upload className="mr-1.5 h-3 w-3" /> Atualizar
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
      </div>
    </AppLayout>
  );
}
