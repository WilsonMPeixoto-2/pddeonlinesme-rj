import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockEscolas } from "@/lib/mockEscolas";
import { useNavigate } from "react-router-dom";
import { ArrowRight, FileSpreadsheet, School, AlertTriangle, CheckCircle2 } from "lucide-react";

const stats = [
  { label: "Unidades escolares", value: "163", icon: School, hint: "4ª CRE" },
  { label: "Demonstrativos gerados", value: "148", icon: CheckCircle2, hint: "Ciclo 2025" },
  { label: "Pendências", value: "15", icon: AlertTriangle, hint: "BASE incompleta" },
  { label: "Última geração em lote", value: "há 3 dias", icon: FileSpreadsheet, hint: "por 4cre@sme.rio" },
];

const recentes = [
  { quando: "21/04/2026 14:32", usuario: "ana.coord", qtd: 1, escola: "EM EMA NEGRÃO DE LIMA" },
  { quando: "18/04/2026 09:10", usuario: "4cre@sme.rio", qtd: 163, escola: "Lote completo" },
  { quando: "15/04/2026 16:45", usuario: "ana.coord", qtd: 3, escola: "EM JOÃO BARBALHO + 2" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Visão geral</h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe o estado da prestação de contas das unidades escolares.
            </p>
          </div>
          <Button onClick={() => navigate("/escolas")}>
            Ir para unidades escolares <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-2xl font-semibold">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Gerações recentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentes.map((r, i) => (
                <div key={i} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{r.escola}</p>
                    <p className="text-xs text-muted-foreground">{r.quando} · {r.usuario}</p>
                  </div>
                  <Badge variant="secondary">{r.qtd} arq.</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Escolas com pendência</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mockEscolas.slice(0, 4).map((e) => (
                <div key={e.id} className="flex items-center justify-between text-sm">
                  <span className="truncate pr-2">{e.designacao}</span>
                  <Badge variant="outline" className="text-warning border-warning/40">
                    revisar
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
