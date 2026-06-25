import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert, Fingerprint, RotateCw,
  Terminal, Activity, KeyRound, Server, Info
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface RlsTableStatus {
  name: string;
  plannedPoliciesCount: number;
  state: string;
  description: string;
}

const RLS_TABLES: RlsTableStatus[] = [
  { name: "unidades_escolares", plannedPoliciesCount: 4, state: "Contrato a validar", description: "Escopo desejado: edição por GAD/admin e, no futuro, diretor associado à própria unidade." },
  { name: "contas_bancarias", plannedPoliciesCount: 2, state: "Revisão pendente", description: "Critério desejado: proteger dados bancários e confirmar escrita apenas por fluxo autorizado." },
  { name: "user_roles", plannedPoliciesCount: 3, state: "Marco 6B", description: "Critério desejado: prevenir elevação indevida de papéis e registrar mudanças sensíveis." },
  { name: "audit_logs", plannedPoliciesCount: 1, state: "Não conectado", description: "Roteiro conceitual: leitura restrita e gravação por triggers ou funções aprovadas." },
  { name: "document_generation_runs", plannedPoliciesCount: 2, state: "A confirmar", description: "Critério desejado: rastrear execuções documentais por usuário, data, status e falhas." }
];

export function SecurityCenterPanel() {
  const [isMfaPriorityMarked, setIsMfaPriorityMarked] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewTimestamp, setReviewTimestamp] = useState<string | null>(null);

  const handleMarkMfaPriority = () => {
    setIsMfaPriorityMarked((prev) => {
      const next = !prev;
      if (next) {
        toast.info("MFA marcado como prioridade de implantação.", {
          description: "Esta marcação é apenas visual; não ativa MFA real no provedor de autenticação."
        });
      } else {
        toast.info("Prioridade visual de MFA removida do painel.");
      }
      return next;
    });
  };

  const handleRefreshChecklist = () => {
    setIsReviewing(true);
    toast.info("Atualizando checklist visual de RLS.", {
      description: "Nenhuma política real do banco é lida pelo navegador neste protótipo."
    });
    
    setTimeout(() => {
      setIsReviewing(false);
      const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setReviewTimestamp(timeStr);
      toast.success("Checklist visual atualizado.", {
        description: "O resultado organiza pendências; a validação real exige PR próprio de segurança."
      });
    }, 1800);
  };

  return (
    <Card className="border-border/70 overflow-hidden shadow-md">
      <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md border transition-all duration-300",
              isMfaPriorityMarked ? "bg-warning/10 text-warning border-warning/30" : "bg-primary/10 text-primary border-primary/20"
            )}>
              {isMfaPriorityMarked ? <ShieldAlert className="h-4.5 w-4.5" /> : <Fingerprint className="h-4.5 w-4.5" />}
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                Centro de Segurança e Auditoria <Badge className="text-[9px] bg-warning/10 text-warning hover:bg-warning/20 border-warning/20">Mapa 6B</Badge>
              </CardTitle>
              <CardDescription>
                Mapeie pendências de RLS, MFA e auditoria sem acionar controles reais do banco ou do provedor de autenticação.
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={isReviewing}
            onClick={handleRefreshChecklist}
            className="h-8 text-xs font-semibold shrink-0 border-border/60 bg-background/50 hover:bg-background"
          >
            <RotateCw className={cn("mr-1.5 h-3.5 w-3.5", isReviewing && "animate-spin")} />
            {isReviewing ? "Atualizando..." : "Atualizar checklist"}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* MFA implementation priority */}
          <div className="rounded-lg border border-border/50 bg-muted/5 p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-primary" /> Acesso de Operador
                </span>
                <AnimatePresence mode="wait">
                  {isMfaPriorityMarked ? (
                    <motion.div
                      key="priority"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                    >
                      <Badge className="bg-warning/15 hover:bg-warning/20 text-warning border-warning/30 font-medium text-[9px] h-5 px-2">
                        Prioridade marcada
                      </Badge>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="pending"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                    >
                      <Badge variant="outline" className="border-warning/30 bg-warning/8 text-warning font-medium text-[9px] h-5 px-2">
                        Integração pendente
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <h4 className="text-sm font-semibold text-foreground">Multi-Factor Authentication (MFA)</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Implantação real depende de fluxo de autenticação, decisão de perfis, testes e revisão humana de segurança.
              </p>
            </div>
            
            <Button
              size="sm"
              variant={isMfaPriorityMarked ? "outline" : "default"}
              onClick={handleMarkMfaPriority}
              className={cn(
                "h-9 text-xs font-semibold w-full transition-all duration-300",
                isMfaPriorityMarked ? "border-warning/30 bg-warning/5 hover:bg-warning/10 text-warning" : "shadow-md"
              )}
            >
              <Fingerprint className="mr-1.5 h-3.5 w-3.5" />
              {isMfaPriorityMarked ? "Remover prioridade visual" : "Marcar como prioridade"}
            </Button>
          </div>

          {/* RLS implementation checklist */}
          <div className="md:col-span-2 space-y-3.5 rounded-lg border border-border/50 bg-muted/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5 text-primary" /> Segurança no Banco de Dados
              </span>
              {reviewTimestamp && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  Revisão visual: {reviewTimestamp}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
              {RLS_TABLES.map((table) => (
                <div
                  key={table.name}
                  className="flex items-start gap-2.5 rounded-md border border-border bg-card/60 p-2.5 hover:bg-muted/10 transition-colors"
                >
                  <ShieldAlert className="h-4 w-4 shrink-0 text-warning mt-0.5" />
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-semibold text-foreground truncate">{table.name}</span>
                      <Badge variant="outline" className="text-[8px] font-mono leading-none h-4 px-1 border-warning/30 bg-warning/5 text-warning">
                        {table.state} ({table.plannedPoliciesCount})
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">{table.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PostgreSQL audit implementation roadmap */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-primary" /> Roteiro de Auditoria do Banco
            </span>
            <span className="flex items-center gap-1 text-[10px] text-warning font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" /> Integração pendente
            </span>
          </div>
          
          <div className="rounded-lg border border-border/80 bg-zinc-950 p-4 font-mono text-xs text-zinc-300 shadow-inner relative group select-all">
            <div className="absolute right-3 top-3 opacity-30 group-hover:opacity-75 transition-opacity pointer-events-none">
              <Terminal className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="space-y-1.5 text-[11px] leading-relaxed custom-scrollbar max-h-[140px] overflow-y-auto">
              <p className="text-zinc-500">{"// Planejamento de trilha auditavel; nao representa logs reais em tempo real"}</p>
              <p className="flex flex-wrap items-center gap-x-2">
                <span className="text-zinc-500">[planejado]</span>
                <span className="text-blue-400 font-semibold">AUDIT LOGS:</span>
                <span>definir contrato de eventos sensíveis para</span>
                <span className="text-amber-400 font-semibold">`unidades_escolares`</span>
                <span>e</span>
                <span className="text-amber-400 font-semibold">`contas_bancarias`</span>
              </p>
              <p className="flex flex-wrap items-center gap-x-2">
                <span className="text-zinc-500">[pendente]</span>
                <span className="text-blue-400 font-semibold">RLS REVIEW:</span>
                <span>validar políticas com sessão autenticada e testes de acesso por perfil</span>
              </p>
              <p className="flex flex-wrap items-center gap-x-2">
                <span className="text-zinc-500">[pendente]</span>
                <span className="text-blue-400 font-semibold">MFA FLOW:</span>
                <span>desenhar ativação real no provedor de Auth antes de expor controles operacionais</span>
              </p>
              <p className="flex flex-wrap items-center gap-x-2">
                <span className="text-zinc-500">[pendente]</span>
                <span className="text-blue-400 font-semibold">OPERATIONS:</span>
                <span>conectar painel somente após migrations, types, revisão humana e smoke operacional</span>
              </p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3 text-primary" /> Este painel é um mapa de implantação: não lê `audit_logs`, não executa scanner RLS e não ativa MFA real.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
