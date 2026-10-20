import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  School, FileText, AlertTriangle, CheckCircle2, Clock,
  ChevronRight, Download, Bell, BarChart3, ArrowLeft,
  FileSpreadsheet, ClipboardList, FileSignature, Coins, ScrollText, ShieldCheck,
  Building, User, Mail, Info, FileDown, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import BrandMark from "@/components/BrandMark";
import { SegundaParcelaUnidadeResumo } from "@/components/SegundaParcelaUnidadeResumo";
import { useAuth } from "@/hooks/useAuth";
import { useUnidadeDetalhe } from "@/hooks/useUnidadeDetalhe";
import { useUnidadesLocalizador } from "@/hooks/useUnidadesLocalizador";
import { supabase } from "@/integrations/supabase/client";
import { generateDemonstrativoBasico } from "@/lib/demonstrativo/generateDemonstrativoBasico";
import { getCamposCadastraisPendentes } from "@/lib/demonstrativo/mapUnidadeToMemoria";
import { getErrorMessage } from "@/lib/errors";
import { buildSegundaParcelaOverview } from "@/lib/financeiroPDDE";
import { financeiroUnidadeOptions } from "@/lib/queryKeys";
import { saveAs } from "file-saver";

/* ─── Nomes amigáveis para campos cadastrais ─── */
const CAMPO_LABELS: Record<string, string> = {
  designacao: "Designação da Unidade",
  cnpj: "CNPJ da Unidade",
  endereco: "Endereço Físico",
  diretor: "Nome do Diretor(a)",
  agencia: "Agência Bancária",
  conta_corrente: "Conta Corrente",
};

const FAQ_ITEMS = [
  {
    question: "Como funciona a Execução Financeira Geral?",
    answer: "A execução financeira do PDDE consiste no planejamento e aplicação dos recursos depositados na conta corrente da UEx (Unidade Executora). Os recursos devem ser integralmente aplicados no exercício financeiro de repasse (2026), respeitando as categorias econômicas de Custeio e Capital contratadas. Toda compra ou contratação exige pesquisa prévia de preços com no mínimo 3 orçamentos válidos e emissão de nota fiscal em nome da UEx."
  },
  {
    question: "Qual a diferença entre Custeio e Capital na prestação de contas?",
    answer: "Custeio refere-se a despesas operacionais, de consumo diário ou serviços de terceiros (ex: materiais de limpeza, pequenos reparos, cartuchos, serviços de chaveiro). Capital refere-se à aquisição de bens permanentes que se incorporam ao patrimônio da escola (ex: computadores, aparelhos de ar-condicionado, armários de aço, projetores). O saldo de Custeio não pode ser usado para comprar itens de Capital, e vice-versa. Os limites de cada categoria são exibidos no resumo financeiro."
  },
  {
    question: "Minha nota fiscal apresentou pendência. O que devo fazer?",
    answer: "Confira o motivo informado pela 4ª CRE e providencie a correção aplicável. Erros formais que admitam correção podem exigir documento do fornecedor; erros estruturais de valor ou CNPJ podem exigir cancelamento e reemissão. Enquanto o envio documental pelo portal não estiver institucionalmente habilitado, apresente a correção pelo canal oficial informado pela equipe responsável."
  },
  {
    question: "Como regularizar pendências de dados cadastrais (CNPJ/INEP/Diretor)?",
    answer: "Os dados cadastrais que constam no PDDE Online (como CNPJ, código INEP, nome do Diretor ativo, telefone e e-mail) são sincronizados periodicamente com os sistemas da SME e da Receita Federal. Caso note alguma inconsistência, entre em contato imediatamente com o setor de UEx do GAD na 4ª CRE, enviando a ata de posse atualizada do diretor e o comprovante de CNPJ ativo."
  }
];

export default function PortalDiretor() {
  const navigate = useNavigate();
  const { user, loading: loadingAuth } = useAuth();
  const [selectedUnidadeId, setSelectedUnidadeId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"home" | "documentos" | "ajuda">("home");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingBens, setIsDownloadingBens] = useState(false);

  // 1. Consultar se o usuário possui a role de admin ou operador
  const { data: userRoles, isLoading: loadingRoles } = useQuery({
    queryKey: ["user-roles", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      if (error) {
        console.error("Erro ao carregar perfis de usuário:", error);
        throw error;
      }
      return data?.map((r) => r.role) ?? [];
    },
  });

  const isAdminOrOperador =
    userRoles?.includes("admin") || userRoles?.includes("operador") || false;

  // 2. Buscar escola associada ao e-mail do usuário logado
  const { data: escolaAssociada, isLoading: loadingAssociacao } = useQuery({
    queryKey: ["diretor-escola-associada", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unidades_escolares")
        .select("*")
        .eq("email", user.email!)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar vínculo de e-mail:", error);
        throw error;
      }
      return data;
    },
  });

  // 3. Buscar todas as unidades escolares (usado no seletor de simulação administrativa)
  const { data: unidadesLocalizador, isLoading: loadingLocalizador } = useUnidadesLocalizador();

  // 4. Efeito para auto-vincular a escola do diretor ou selecionar a primeira se for admin
  useEffect(() => {
    if (loadingAuth || loadingRoles || loadingAssociacao) return;

    if (escolaAssociada?.id) {
      setSelectedUnidadeId(escolaAssociada.id);
    } else if (isAdminOrOperador && unidadesLocalizador && unidadesLocalizador.length > 0) {
      setSelectedUnidadeId(unidadesLocalizador[0].id);
    }
  }, [loadingAuth, loadingRoles, loadingAssociacao, escolaAssociada, isAdminOrOperador, unidadesLocalizador]);

  const activeUnidadeId = selectedUnidadeId;

  // 5. Buscar dados cadastrais completos da escola ativa
  const { data: escolaAtiva, isLoading: loadingEscolaAtiva } = useQuery({
    queryKey: ["unidade-escolar-ativa", activeUnidadeId],
    enabled: !!activeUnidadeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unidades_escolares")
        .select("*")
        .eq("id", activeUnidadeId!)
        .maybeSingle();

      if (error) {
        console.error("Erro ao carregar dados da escola ativa:", error);
        throw error;
      }
      return data;
    },
  });

  // 6. Buscar dados detalhados de limites para o exercício 2026
  const { data: unidadeDetalhe, isLoading: loadingDetalhe } = useUnidadeDetalhe({
    unidadeId: activeUnidadeId || undefined,
    exercicio: "2026",
    programa: "PDDE",
  });

  const financeiroUnidade = useQuery(financeiroUnidadeOptions(activeUnidadeId || undefined, 2026));
  const segundoCiclo = buildSegundaParcelaOverview(financeiroUnidade.data?.repasses ?? [], 2026);
  const segundaParcelaEscola = segundoCiclo.escolas[0];

  // 7. Buscar todas as despesas fiscais homologadas da escola ativa no ano vigente
  const { data: despesasFiscais, isLoading: loadingDespesas } = useQuery({
    queryKey: ["escola-despesas-fiscais", activeUnidadeId],
    enabled: !!activeUnidadeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("despesas_fiscais")
        .select("*")
        .eq("unidade_id", activeUnidadeId!)
        .eq("exercicio", 2026)
        .order("data_emissao", { ascending: false });
      
      if (error) {
        console.error("Erro ao carregar despesas fiscais:", error);
        throw error;
      }
      return data || [];
    }
  });

  // Cálculos financeiros reais baseados nas tabelas
  const totalDisponivel = (escolaAtiva?.saldo_anterior ?? 0) + (escolaAtiva?.recebido ?? 0);
  const gastoReal = escolaAtiva?.gasto ?? 0;
  const saldoAtualReal = totalDisponivel - gastoReal;
  const percentualExecucao = totalDisponivel > 0 ? Math.round((gastoReal / totalDisponivel) * 100) : 0;

  // Análise de pendências cadastrais
  const pendenciasCadastro = escolaAtiva ? getCamposCadastraisPendentes(escolaAtiva) : [];
  const temPendencias = pendenciasCadastro.length > 0;
  const pendenciasFormatadas = pendenciasCadastro.map(f => CAMPO_LABELS[f] || f);

  // Ação de download do Demonstrativo Básico (.xlsx)
  const handleDownloadDemonstrativo = async () => {
    if (!unidadeDetalhe) {
      toast.error("Os dados de limites da unidade ainda não foram carregados completamente.");
      return;
    }

    setIsDownloading(true);
    const toastId = toast.loading("Gerando demonstrativo básico com dados reais do Supabase...");

    try {
      const result = await generateDemonstrativoBasico(unidadeDetalhe, "2026");
      saveAs(result.blob, result.fileName);
      toast.success("Demonstrativo Básico gerado e baixado com sucesso!", { id: toastId });
    } catch (err: unknown) {
      console.error("Erro ao baixar demonstrativo:", err);
      toast.error(`Falha ao gerar o arquivo .xlsx: ${getErrorMessage(err, "Erro desconhecido.")}`, { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };
 
  // Ação de download da Relação de Bens Adquiridos (Anexo II - Capital)
  const handleDownloadRelacaoBens = async () => {
    if (!escolaAtiva || !unidadeDetalhe) {
      toast.error("Os dados da unidade não foram carregados completamente.");
      return;
    }

    setIsDownloadingBens(true);
    const toastId = toast.loading("Gerando Relação de Bens Adquiridos (Anexo II - Capital)...");

    try {
      const { generateRelacaoBens } = await import("@/lib/demonstrativo/generateRelacaoBens");
      
      // Converte despesas do Supabase para o contrato da lib
      const capitalItems = (despesasFiscais || [])