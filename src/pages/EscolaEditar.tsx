import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockEscolas } from "@/lib/mockEscolas";
import { ArrowLeft, FileSpreadsheet, Save } from "lucide-react";
import { toast } from "sonner";

export default function EscolaEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const escola = mockEscolas.find((e) => e.id === id);

  if (!escola) {
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
            onClick={() =>
              toast.success(`Protótipo: geraria DEMONSTRATIVO BÁSICO - ${escola.designacao}.xlsx`)
            }
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Gerar demonstrativo
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{escola.designacao}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Protótipo: salvaria na BASE central");
              }}
            >
              <div className="space-y-2 sm:col-span-2">
                <Label>Designação</Label>
                <Input defaultValue={escola.designacao} />
              </div>
              <div className="space-y-2"><Label>INEP</Label><Input defaultValue={escola.inep} /></div>
              <div className="space-y-2"><Label>CNPJ</Label><Input defaultValue={escola.cnpj} /></div>
              <div className="space-y-2"><Label>Diretor(a)</Label><Input defaultValue={escola.diretor} /></div>
              <div className="space-y-2"><Label>E-mail</Label><Input type="email" defaultValue={escola.email} /></div>
              <div className="space-y-2"><Label>Nº de alunos</Label><Input type="number" defaultValue={escola.alunos} /></div>
              <div className="space-y-2"><Label>Saldo anterior (R$)</Label><Input type="number" step="0.01" defaultValue={escola.saldoAnterior} /></div>
              <div className="space-y-2"><Label>Recebido (R$)</Label><Input type="number" step="0.01" defaultValue={escola.recebido} /></div>
              <div className="space-y-2"><Label>Gasto (R$)</Label><Input type="number" step="0.01" defaultValue={escola.gasto} /></div>

              <div className="sm:col-span-2 flex justify-end pt-2">
                <Button type="submit"><Save className="mr-2 h-4 w-4" /> Salvar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
