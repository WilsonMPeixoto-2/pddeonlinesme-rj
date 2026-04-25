import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  LayoutDashboard,
  School,
  FileSpreadsheet,
  Upload,
  Settings,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";

const secoes = [
  {
    icon: LayoutDashboard,
    titulo: "Dashboard",
    resumo: "Visão geral do ciclo de prestação de contas.",
    conteudo: (
      <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
        <li><strong>Cards superiores:</strong> totais de unidades, demonstrativos gerados, pendências e a última geração em lote.</li>
        <li><strong>Gerações recentes:</strong> histórico das últimas ações, com data, usuário responsável e quantidade de arquivos.</li>
        <li><strong>Unidades com pendência:</strong> escolas cuja BASE precisa ser revisada antes da próxima geração.</li>
      </ul>
    ),
  },
  {
    icon: School,
    titulo: "Unidades Escolares",
    resumo: "Gerencie as 163 unidades da 4ª CRE.",
    conteudo: (
      <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
        <li><strong>Buscar:</strong> use o campo no topo para filtrar por nome, INEP ou diretor(a).</li>
        <li><strong>Editar (✏️):</strong> abre o formulário com todos os campos da BASE daquela unidade.</li>
        <li><strong>Gerar (📄):</strong> produz o <code>DEMONSTRATIVO BÁSICO - &lt;designação&gt;.xlsx</code> daquela unidade.</li>
        <li><strong>Gerar lote (.zip):</strong> botão no canto superior direito — gera os 163 demonstrativos de uma vez.</li>
      </ul>
    ),
  },
  {
    icon: Upload,
    titulo: "Importar / Exportar BASE",
    resumo: "Sincronia entre o sistema e o .xlsx mestre.",
    conteudo: (
      <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
        <li><strong>Importar:</strong> envie um arquivo <code>.xlsx</code> para substituir os dados das 163 unidades. O sistema valida antes de aplicar.</li>
        <li><strong>Exportar:</strong> baixe a versão atual da BASE para revisão offline ou backup.</li>
        <li><strong>Boa prática:</strong> sempre exporte antes de importar — isso garante que você tem uma cópia do estado anterior.</li>
      </ul>
    ),
  },
  {
    icon: Settings,
    titulo: "Configurações",
    resumo: "Equipe e parâmetros do sistema.",
    conteudo: (
      <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
        <li><strong>Equipe da 4ª CRE:</strong> convide, remova e gerencie papéis dos usuários (admin / operador).</li>
        <li><strong>Senha de proteção:</strong> aplicada nas células amarelas das planilhas geradas (padrão: <code>ANA</code>).</li>
        <li><strong>Exercício vigente:</strong> ano de referência usado pelo motor de geração.</li>
      </ul>
    ),
  },
  {
    icon: FileSpreadsheet,
    titulo: "Como funciona a geração",
    resumo: "Entenda o motor por trás dos demonstrativos.",
    conteudo: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>
          O sistema usa o <strong>template oficial</strong> mantido pela 4ª CRE
          como esqueleto. Para cada unidade escolar, o motor:
        </p>
        <ol className="space-y-1 list-decimal pl-5">
          <li>Abre uma cópia do template.</li>
          <li>Injeta o nome da unidade na célula de gatilho da aba <code>MEMORIA</code>.</li>
          <li>As fórmulas <code>XLOOKUP</code> existentes puxam os dados da aba <code>BASE</code>.</li>
          <li>Aplica proteção com a senha <code>ANA</code> nas áreas amarelas (campos editáveis pela diretoria).</li>
          <li>Salva o arquivo nomeado como <code>DEMONSTRATIVO BÁSICO - &lt;designação&gt;.xlsx</code>.</li>
        </ol>
        <p className="pt-1">
          O layout, fórmulas e formatação <strong>nunca</strong> são reescritos —
          apenas dados são preenchidos.
        </p>
      </div>
    ),
  },
  {
    icon: ShieldCheck,
    titulo: "Boas práticas e governança",
    resumo: "Recomendações para uso seguro.",
    conteudo: (
      <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
        <li><strong>Fonte única da verdade:</strong> a BASE no sistema é a referência oficial. Arquivos já gerados são fotografias daquele momento.</li>
        <li><strong>Regerar quando alterar:</strong> ao mudar dados na BASE, regere os demonstrativos afetados para manter consistência.</li>
        <li><strong>Backup por exercício:</strong> ao final de cada ano, exporte o lote completo (.zip) e arquive no drive institucional da SME-RJ.</li>
        <li><strong>Validação no Excel:</strong> os arquivos devem ser sempre conferidos no Microsoft Excel — visualizadores web podem não calcular fórmulas avançadas.</li>
      </ul>
    ),
  },
  {
    icon: HelpCircle,
    titulo: "Dúvidas frequentes",
    resumo: "Respostas rápidas.",
    conteudo: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <div>
          <p className="font-medium text-foreground">Posso editar um demonstrativo já gerado?</p>
          <p>Sim, mas a edição não volta para a BASE. O recomendado é alterar a BASE e regerar.</p>
        </div>
        <div>
          <p className="font-medium text-foreground">Esqueci a senha das células amarelas.</p>
          <p>A senha padrão é <code>ANA</code> e pode ser alterada em Configurações → Parâmetros.</p>
        </div>
        <div>
          <p className="font-medium text-foreground">Como adicionar uma nova unidade escolar?</p>
          <p>Acesse a aba Unidades Escolares e use o botão de adição (em breve), ou importe uma BASE atualizada.</p>
        </div>
      </div>
    ),
  },
];

export default function Manual() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Manual</h1>
            <p className="text-sm text-muted-foreground">
              Guia de utilização, navegação e recursos do PDDE Online — 4ª CRE.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sobre o sistema</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              O <strong>PDDE Online</strong> centraliza a gestão da BASE de
              dados das 163 unidades escolares da 4ª CRE e automatiza a geração
              dos Demonstrativos Básicos no formato oficial.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conhecendo as áreas</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {secoes.map((s, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <s.icon className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{s.titulo}</p>
                        <p className="text-xs text-muted-foreground font-normal">{s.resumo}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-7">{s.conteudo}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          Versão do protótipo · 4ª CRE — SME-RJ
        </p>
      </div>
    </AppLayout>
  );
}
