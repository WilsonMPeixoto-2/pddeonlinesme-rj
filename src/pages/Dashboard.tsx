import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, FileSpreadsheet, School, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const navigate = useNavigate();
  const [total, setTotal] = useState<number | null>(null);
  const [recentes, setRecentes] = useState<{ id: string; designacao: string }[]>([]);

  useEffect(() => {
    (async () => {
      const { count } = await supabase
        .from("unidades_escolares")
        .select("*", { count: "exact", head: true });
      setTotal(count ?? 0);

      const { data } = await supabase
        .from("unidades_escolares")
        .select("id, designacao")
        .order("updated_at", { ascending: false })
        .limit(4);
      setRecentes(data ?? []);
    })();
  }, []);

  const stats = [
    { label: "Unidades escolares", value: total ?? "…", icon: School, hint: "4ª CRE" },
    { label: "Demonstrativos gerados", value: "—", icon: CheckCircle2, hint: "em breve" },
    { label: "Pendências", value: "—", icon: AlertTriangle, hint: "em breve" },
    { label: "Última geração em lote", value: "—", icon: FileSpreadsheet, hint: "em breve" },
  ];

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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Atualizadas recentemente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentes.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma unidade ainda.</p>
            )}
            {recentes.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                <span>{r.designacao}</span>
                <Badge variant="secondary" className="cursor-pointer" onClick={() => navigate(`/escolas/${r.id}`)}>
                  abrir
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
