import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileSpreadsheet, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Unidade = {
  id: string;
  designacao: string;
  inep: string | null;
  cnpj: string | null;
  diretor: string | null;
  email: string | null;
  alunos: number;
  saldo_anterior: number;
  recebido: number;
  gasto: number;
};

export default function EscolaEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [u, setU] = useState<Unidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("unidades_escolares")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) toast.error(error.message);
      setU(data as Unidade | null);
      setLoading(false);
    })();
  }, [id]);

  const setField = <K extends keyof Unidade>(k: K, v: Unidade[K]) =>
    setU((prev) => (prev ? { ...prev, [k]: v } : prev));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!u) return;
    setSaving(true);
    const { error } = await supabase
      .from("unidades_escolares")
      .update({
        designacao: u.designacao,
        inep: u.inep,
        cnpj: u.cnpj,
        diretor: u.diretor,
        email: u.email,
        alunos: Number(u.alunos),
        saldo_anterior: Number(u.saldo_anterior),
        recebido: Number(u.recebido),
        gasto: Number(u.gasto),
      })
      .eq("id", u.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Salvo na BASE central");
  };

  if (loading) {
    return <AppLayout><p className="text-sm text-muted-foreground">Carregando…</p></AppLayout>;
  }
  if (!u) {
    return (
      <AppLayout>
        <p className="text-sm">Unidade escolar não encontrada.</p>
        <Button variant="link" onClick={() => navigate("/escolas")}>Voltar</Button>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/escolas")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <Button
            size="sm"
            onClick={() => toast.info(`Em breve: gerar DEMONSTRATIVO BÁSICO - ${u.designacao}.xlsx`)}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Gerar demonstrativo
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle>{u.designacao}</CardTitle></CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleSave}>
              <div className="space-y-2 sm:col-span-2">
                <Label>Designação</Label>
                <Input value={u.designacao} onChange={(e) => setField("designacao", e.target.value)} />
              </div>
              <div className="space-y-2"><Label>INEP</Label><Input value={u.inep ?? ""} onChange={(e) => setField("inep", e.target.value)} /></div>
              <div className="space-y-2"><Label>CNPJ</Label><Input value={u.cnpj ?? ""} onChange={(e) => setField("cnpj", e.target.value)} /></div>
              <div className="space-y-2"><Label>Diretor(a)</Label><Input value={u.diretor ?? ""} onChange={(e) => setField("diretor", e.target.value)} /></div>
              <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={u.email ?? ""} onChange={(e) => setField("email", e.target.value)} /></div>
              <div className="space-y-2"><Label>Nº de alunos</Label><Input type="number" value={u.alunos} onChange={(e) => setField("alunos", Number(e.target.value))} /></div>
              <div className="space-y-2"><Label>Saldo anterior (R$)</Label><Input type="number" step="0.01" value={u.saldo_anterior} onChange={(e) => setField("saldo_anterior", Number(e.target.value))} /></div>
              <div className="space-y-2"><Label>Recebido (R$)</Label><Input type="number" step="0.01" value={u.recebido} onChange={(e) => setField("recebido", Number(e.target.value))} /></div>
              <div className="space-y-2"><Label>Gasto (R$)</Label><Input type="number" step="0.01" value={u.gasto} onChange={(e) => setField("gasto", Number(e.target.value))} /></div>

              <div className="sm:col-span-2 flex justify-end pt-2">
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" /> {saving ? "Salvando…" : "Salvar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
