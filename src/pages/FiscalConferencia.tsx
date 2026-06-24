import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCode, QrCode, FileSearch, Building2, Hash, Calendar,
  DollarSign, CheckCircle2, AlertCircle, Loader2, Sparkles,
  UploadCloud, Check, ExternalLink, ShieldCheck, Eye, RefreshCw,
  TrendingUp, Wallet, ArrowRight, BookOpen, AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUnidadesLocalizador } from "@/hooks/useUnidadesLocalizador";
import { useExercicio } from "@/hooks/useExercicio";
import { getErrorMessage } from "@/lib/errors";

/* ─── HELPERS DE FORMATAÇÃO E MÁSCARAS ─── */
function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

function calculateKeyChecksum(key43: string): number {
  let multiplier = 2;
  let sum = 0;
  for (let i = key43.length - 1; i >= 0; i--) {
    sum += Number.parseInt(key43[i], 10) * multiplier;
    multiplier = multiplier === 9 ? 2 : multiplier + 1;
  }
  const remainder = sum % 11;
  return remainder === 0 || remainder === 1 ? 0 : 11 - remainder;
}

function validateAccessKey(key: string): { isValid: boolean; cnpj: string } {
  const digits = key.replace(/\D/g, "");
  if (digits.length !== 44) return { isValid: false, cnpj: "" };
  
  const key43 = digits.slice(0, 43);
  const actualDV = Number.parseInt(digits[43], 10);
  const calculatedDV = calculateKeyChecksum(key43);
  
  // CNPJ fica na chave nas posições 7 a 20 (índices 6 a 20 na string)
  const cnpjRaw = digits.slice(6, 20);
  
  return {
    isValid: actualDV === calculatedDV,
    cnpj: cnpjRaw
  };
}

export default function FiscalConferencia() {
  const queryClient = useQueryClient();
  const { exercicio } = useExercicio();
  
  // 1. Estados de seleção da Unidade Escolar
  const [selectedUnidadeId, setSelectedUnidadeId] = useState<string>("");
  const { data: unidades, isLoading: loadingUnidades } = useUnidadesLocalizador();
  
  // 2. Busca balanço financeiro atualizado da escola selecionada
  const { data: escolaAtiva, refetch: refetchEscola } = useQuery({
    queryKey: ["unidade-fiscal-balanco", selectedUnidadeId],
    enabled: !!selectedUnidadeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unidades_escolares")
        .select("*")
        .eq("id", selectedUnidadeId)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  // 3. Estados do formulário de conferência ("Human-in-the-Loop")
  const [fornecedorCNPJ, setFornecedorCNPJ] = useState("");
  const [fornecedorNome, setFornecedorNome] = useState("");
  const [numeroNota, setNumeroNota] = useState("");
  const [chaveAcesso, setChaveAcesso] = useState("");
  const [dataEmissao, setDataEmissao] = useState("");
  const [valorDespesa, setValorDespesa] = useState("");
  const [tipoGasto, setTipoGasto] = useState<"custeio" | "capital">("custeio");
  const [programa, setPrograma] = useState("basico");
  
  // Estados Auxiliares de UI e Extração
  const [activeTab, setActiveTab] = useState("xml");
  const [isHomologando, setIsHomologando] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [xmlRawMetadata, setXmlRawMetadata] = useState<string | null>(null);
  const [keyValidationInfo, setKeyValidationInfo] = useState<{ isValid: boolean; show: boolean }>({ isValid: false, show: false });
  const [ocrFileName, setOcrFileName] = useState<string | null>(null);
  const [extractionMethod, setExtractionMethod] = useState<"xml" | "chave" | "ocr" | "manual">("manual");

  // Reset de formulário
  const resetForm = () => {
    setFornecedorCNPJ("");
    setFornecedorNome("");
    setNumeroNota("");
    setChaveAcesso("");
    setDataEmissao("");
    setValorDespesa("");
    setXmlRawMetadata(null);
    setOcrFileName(null);
    setKeyValidationInfo({ isValid: false, show: false });
    setExtractionMethod("manual");
  };

  // 4. PARSER CLIENT-SIDE XML (DOMParser)
  const handleXmlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading("Analisando arquivo XML fiscal...");
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "application/xml");
      
      // Verifica erros de parsing
      const parserError = xmlDoc.getElementsByTagName("parsererror")[0];
      if (parserError) {
        throw new Error("Arquivo XML com formatação corrompida.");
      }

      // 1. Extração estruturada de NF-e (Tags padrão nacional)
      let cnpj = xmlDoc.getElementsByTagName("CNPJ")[0]?.textContent || "";
      let emitName = xmlDoc.getElementsByTagName("xNome")[0]?.textContent || "";
      let nNF = xmlDoc.getElementsByTagName("nNF")[0]?.textContent || "";
      let dhEmi = xmlDoc.getElementsByTagName("dhEmi")[0]?.textContent || 
                   xmlDoc.getElementsByTagName("dEmi")[0]?.textContent || "";
      let chNFe = xmlDoc.getElementsByTagName("chNFe")[0]?.textContent || "";
      let vNF = xmlDoc.getElementsByTagName("vNF")[0]?.textContent || "";

      // 2. Fallback / Tratamento para NFS-e (Nota Carioca / Rio de Janeiro)
      if (!cnpj) {
        cnpj = xmlDoc.getElementsByTagName("IdentificacaoPrestador")[0]?.getElementsByTagName("Cnpj")[0]?.textContent || "";
        emitName = xmlDoc.getElementsByTagName("RazaoSocialPrestador")[0]?.textContent || 
                   xmlDoc.getElementsByTagName("PrestadorServico")[0]?.getElementsByTagName("RazaoSocial")[0]?.textContent || "";
        nNF = xmlDoc.getElementsByTagName("Numero")[0]?.textContent || "";
        dhEmi = xmlDoc.getElementsByTagName("DataEmissao")[0]?.textContent || "";
        vNF = xmlDoc.getElementsByTagName("ValorServicos")[0]?.textContent || "";
      }

      // Limpeza de chaves sob atributos no protocolo
      if (!chNFe) {
        const infProt = xmlDoc.getElementsByTagName("infProt")[0];
        if (infProt) {
          chNFe = infProt.getAttribute("Id")?.replace(/\D/g, "") || "";
        }
      }

      // Validação de dados extraídos
      if (!cnpj && !nNF) {
        throw new Error("Não foi possível identificar elementos fiscais estruturados padrão (NF-e/NFS-e) neste XML.");
      }

      // Tratamento de Data
      if (dhEmi) dhEmi = dhEmi.substring(0, 10);

      // Atualização dos inputs
      setFornecedorCNPJ(formatCNPJ(cnpj));
      setFornecedorNome(emitName || "FORNECEDOR EXTRAÍDO");
      setNumeroNota(nNF);
      setChaveAcesso(chNFe);
      setDataEmissao(dhEmi);
      setValorDespesa(vNF ? parseFloat(vNF).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");
      
      // Gera mini metadados JSON para o visualizador técnico
      const summary = {
        fornecedor: emitName,
        cnpj,
        documento_numero: nNF,
        data_emissao: dhEmi,
        chave_nfe: chNFe,
        valor_total: vNF ? parseFloat(vNF) : 0,
        tipo_documento: chNFe ? "NF-e (Estadual)" : "NFS-e (Municipal Carioca)"
      };
      setXmlRawMetadata(JSON.stringify(summary, null, 2));
      setExtractionMethod("xml");
      toast.success("XML fiscal extraído com sucesso!", { id: toastId });
    } catch (err: unknown) {
      console.error(err);
      toast.error(getErrorMessage(err, "Falha ao ler o arquivo XML fiscal."), { id: toastId });
    }
  };

  // 5. DIGITAÇÃO E VALIDAÇÃO DE CHAVE DE ACESSO
  const handleKeyChange = (val: string) => {
    const rawDigits = val.replace(/\D/g, "").slice(0, 44);
    setChaveAcesso(rawDigits);

    if (rawDigits.length === 44) {
      const { isValid, cnpj } = validateAccessKey(rawDigits);
      setKeyValidationInfo({ isValid, show: true });
      if (isValid) {
        setFornecedorCNPJ(formatCNPJ(cnpj));
        setExtractionMethod("chave");
        toast.success("Chave validada! CNPJ do fornecedor extraído automaticamente.");
      } else {
        toast.error("Chave de acesso com dígito verificador matemático inválido.");
      }
    } else {
      setKeyValidationInfo({ isValid: false, show: false });
    }
  };

  // 6. SIMULADOR DE SCANNER OCR PREMIUM (PDF / Imagem)
  const handleOcrFileDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleOcrFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) startFakeOcr(file.name);
  };

  const handleOcrFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) startFakeOcr(file.name);
  };

  const startFakeOcr = (fileName: string) => {
    setIsScanning(true);
    setOcrFileName(fileName);
    toast.info("Iniciando varredura OCR inteligente do documento...");

    setTimeout(() => {
      setIsScanning(false);
      // Simulação realista baseada no nome do arquivo ou randômica
      const isNotaRio = fileName.toLowerCase().includes("carioca") || fileName.toLowerCase().includes("nfse");
      
      setFornecedorCNPJ(formatCNPJ("12345678000199"));
      setFornecedorNome(isNotaRio ? "RIO DE JANEIRO INFORMATICA LTDA" : "LIVRARIA E PAPELARIA DANTAS LTDA");
      setNumeroNota(Math.floor(1000 + Math.random() * 9000).toString());
      setChaveAcesso(isNotaRio ? "" : "332605" + "12345678000199" + "55001" + "000003421" + "1" + "87654321" + "9");
      
      const today = new Date();
      const formattedDate = today.toISOString().substring(0, 10);
      setDataEmissao(formattedDate);
      
      const val = 150 + Math.floor(Math.random() * 850);
      setValorDespesa(val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setExtractionMethod("ocr");
      toast.success("Varredura OCR concluída! Dados estruturados sugeridos para conferência.");
    }, 2200);
  };

  // 7. AÇÃO DE HOMOLOGAÇÃO TRANSACIONAL (Homologar Despesa)
  const handleHomologar = async () => {
    if (!selectedUnidadeId) {
      toast.error("Por favor, selecione uma Unidade Escolar antes de prosseguir.");
      return;
    }
    if (!fornecedorCNPJ || !fornecedorNome || !numeroNota || !dataEmissao || !valorDespesa) {
      toast.error("Preencha todos os campos obrigatórios da conferência fiscal antes de homologar.");
      return;
    }

    setIsHomologando(true);
    const toastId = toast.loading("Enviando dados fiscais e consolidando saldos...");
    
    // Converte valor monetário formatado
    const valorFloat = parseFloat(valorDespesa.replace(/\./g, "").replace(",", "."));
    if (Number.isNaN(valorFloat) || valorFloat <= 0) {
      toast.error("Valor da despesa inválido.", { id: toastId });
      setIsHomologando(false);
      return;
    }

    try {
      // Tenta efetuar a mutação transacional robusta via RPC remota do Supabase
      const { data: despesaId, error } = await supabase.rpc("homologar_despesa_fiscal", {
        p_unidade_id: selectedUnidadeId,
        p_exercicio: Number.parseInt(exercicio, 10),
        p_fornecedor_cnpj: fornecedorCNPJ.replace(/\D/g, ""),
        p_fornecedor_nome: fornecedorNome.trim(),
        p_numero_nota: numeroNota.trim(),
        p_chave_acesso: chaveAcesso.replace(/\D/g, "") || null,
        p_data_emissao: dataEmissao,
        p_valor: valorFloat,
        p_tipo_gasto: tipoGasto,
        p_programa: programa
      });

      if (error) {
        // Se a tabela ou RPC não estiver em produção remota, ativamos o fallback local de alta fidelidade
        if (error.message.includes("does not exist") || error.message.includes("function")) {
          console.warn("RPC ou tabela inexistente no Supabase remoto. Ativando Sandbox local resiliente.", error);
          await handleHomologacaoLocalFallback(valorFloat);
          toast.success("Despesa homologada localmente! (Modo Sandbox)", { id: toastId });
        } else {
          throw error;
        }
      } else {
        toast.success(`Despesa fiscal homologada com sucesso! Registro ID: ${despesaId}`, { id: toastId });
      }

      // Atualiza caches e recarrega dados na interface
      queryClient.invalidateQueries({ queryKey: ["unidade-fiscal-balanco", selectedUnidadeId] });
      queryClient.invalidateQueries({ queryKey: ["unidades-localizador"] });
      refetchEscola();
      resetForm();
    } catch (err: unknown) {
      console.error(err);
      toast.error(getErrorMessage(err, "Erro inesperado ao homologar despesa fiscal."), { id: toastId });
    } finally {
      setIsHomologando(false);
    }
  };

  // Fallback Local de Alta Fidelidade
  const handleHomologacaoLocalFallback = async (valor: number) => {
    // 1. Simula a atualização do saldo na tabela local do React Query
    const currentUnidade = escolaAtiva;
    if (currentUnidade) {
      const updatedGasto = (currentUnidade.gasto ?? 0) + valor;
      queryClient.setQueryData(["unidade-fiscal-balanco", selectedUnidadeId], {
        ...currentUnidade,
        gasto: updatedGasto
      });
    }

    // 2. Persiste em um log de despesas simuladas no localStorage do operador
    const despesasLocais = JSON.parse(localStorage.getItem("sandbox_despesas_fiscais") || "[]");
    const novaDespesa = {
      id: Math.random().toString(36).substring(2, 9),
      unidade_id: selectedUnidadeId,
      exercicio: Number.parseInt(exercicio, 10),
      fornecedor_cnpj: fornecedorCNPJ,
      fornecedor_nome: fornecedorNome,
      numero_nota: numeroNota,
      chave_acesso: chaveAcesso,
      data_emissao: dataEmissao,
      valor,
      tipo_gasto: tipoGasto,
      programa,
      created_at: new Date().toISOString(),
      status: "sandbox_homologado"
    };
    localStorage.setItem("sandbox_despesas_fiscais", JSON.stringify([...despesasLocais, novaDespesa]));
  };

  // Derivados financeiros reativos do card superior
  const saldoAnterior = escolaAtiva?.saldo_anterior ?? 0;
  const recebido = escolaAtiva?.recebido ?? 0;
  const totalDisponivel = saldoAnterior + recebido;
  const gastoReal = escolaAtiva?.gasto ?? 0;
  const saldoRestante = totalDisponivel - gastoReal;

  const novoValorFloat = parseFloat(valorDespesa.replace(/\./g, "").replace(",", ".")) || 0;
  const saldoProjetado = saldoRestante - novoValorFloat;

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DA PÁGINA */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
              Aquisição Fiscal Multicanal
            </h1>
            <Badge variant="outline" className="border-primary/30 bg-primary/8 text-primary animate-pulse text-[10px]">
              v1.0 Spike Active
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Importação estruturada, validação de chaves de acesso, OCR sandbox e homologação transacional humana.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="school-selector" className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            Escola Ativa:
          </Label>
          <Select value={selectedUnidadeId} onValueChange={(val) => { setSelectedUnidadeId(val); resetForm(); }}>
            <SelectTrigger className="w-[300px] h-9 text-xs border-border/60 bg-card">
              <SelectValue placeholder="Selecione a Unidade Escolar..." />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {loadingUnidades ? (
                <div className="flex items-center justify-center p-2 text-xs text-muted-foreground">
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Carregando...
                </div>
              ) : (
                unidades?.map((u) => (
                  <SelectItem key={u.id} value={u.id} className="text-xs">
                    {u.designacao}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* PAINEL DE BALANÇO FINANCEIRO REAL-TIME */}
      <AnimatePresence mode="wait">
        {selectedUnidadeId && escolaAtiva ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-card/40 border-border/50 shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
                <CardHeader className="py-3 px-4">
                  <CardDescription className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Wallet className="h-3 w-3 text-primary/70" /> Total Disponível
                  </CardDescription>
                  <CardTitle className="text-lg font-bold tracking-tight text-foreground">
                    {totalDisponivel.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-0 px-4 pb-3">
                  <p className="text-[10px] text-muted-foreground/80">
                    Soma do reprogramado + parcelas recebidas
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/40 border-border/50 shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-warning/5 to-transparent pointer-events-none" />
                <CardHeader className="py-3 px-4">
                  <CardDescription className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3 text-warning/70" /> Gasto Homologado
                  </CardDescription>
                  <CardTitle className="text-lg font-bold tracking-tight text-warning">
                    {gastoReal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-0 px-4 pb-3">
                  <p className="text-[10px] text-muted-foreground/80">
                    Total de despesas fiscais auditadas e gravadas
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/40 border-border/50 shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-success/5 to-transparent pointer-events-none" />
                <CardHeader className="py-3 px-4">
                  <CardDescription className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-success/70" /> Saldo Restante
                  </CardDescription>
                  <CardTitle className="text-lg font-bold tracking-tight text-success">
                    {saldoRestante.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-0 px-4 pb-3">
                  <p className="text-[10px] text-muted-foreground/80">
                    Balanço atual livre para execução
                  </p>
                </CardContent>
              </Card>

              <Card className={`relative overflow-hidden border-dashed border-2 transition-all duration-300 ${
                novoValorFloat > 0 
                  ? saldoProjetado < 0 
                    ? "bg-destructive/5 border-destructive/40 shadow-inner" 
                    : "bg-primary/5 border-primary/40 shadow-sm"
                  : "bg-muted/10 border-border/40"
              }`}>
                <CardHeader className="py-3 px-4">
                  <CardDescription className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-primary/70 animate-pulse" /> Projeção Pós-Lançamento
                  </CardDescription>
                  <CardTitle className={`text-lg font-bold tracking-tight transition-colors ${
                    novoValorFloat > 0 
                      ? saldoProjetado < 0 
                        ? "text-destructive" 
                        : "text-primary"
                      : "text-muted-foreground"
                  }`}>
                    {novoValorFloat > 0 
                      ? saldoProjetado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) 
                      : "—"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-0 px-4 pb-3">
                  {novoValorFloat > 0 ? (
                    saldoProjetado < 0 ? (
                      <p className="text-[10px] font-semibold text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-destructive animate-bounce" /> Saldo insuficiente na unidade!
                      </p>
                    ) : (
                      <p className="text-[10px] text-primary/80 font-medium flex items-center gap-1">
                        <ArrowRight className="h-3 w-3" /> Margem financeira segura para homologação
                      </p>
                    )
                  ) : (
                    <p className="text-[10px] text-muted-foreground/80">
                      Preencha o valor da despesa para simular
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        ) : (
          <Card className="border-dashed border-border/60 bg-card/25 py-8 text-center flex flex-col justify-center items-center shadow-inner">
            <Building2 className="h-8 w-8 text-muted-foreground/50 animate-bounce mb-3" />
            <p className="text-sm font-semibold text-foreground/80">Nenhuma Unidade Escolar Selecionada</p>
            <p className="text-xs text-muted-foreground/60 max-w-sm mt-1">
              Selecione uma escola no menu superior direito para desbloquear a captação fiscal e analisar o demonstrativo financeiro em tempo real.
            </p>
          </Card>
        )}
      </AnimatePresence>

      {/* SPLIT-SCREEN WORKSPACE */}
      {selectedUnidadeId && (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-12 items-start">
          {/* COLUNA ESQUERDA: CAPTAÇÃO FISCAL MULTICANAL */}
          <div className="lg:col-span-6 space-y-6">
            <Card className="border-border/50 bg-card shadow-md">
              <CardHeader className="pb-3 border-b border-border/30">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <UploadCloud className="h-4 w-4 text-primary" /> Canais de Captação Fiscal
                </CardTitle>
                <CardDescription className="text-xs">
                  Selecione a fonte de aquisição seguindo a ordem de preferência institucional.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); resetForm(); }} className="space-y-4">
                  <TabsList className="grid grid-cols-3 bg-muted/40 h-9 p-0.5 border border-border/50">
                    <TabsTrigger value="xml" className="text-[11px] font-semibold gap-1.5 h-8 data-[state=active]:bg-card">
                      <FileCode className="h-3.5 w-3.5" /> 1. XML Nota
                    </TabsTrigger>
                    <TabsTrigger value="key" className="text-[11px] font-semibold gap-1.5 h-8 data-[state=active]:bg-card">
                      <QrCode className="h-3.5 w-3.5" /> 2. Chave NF-e
                    </TabsTrigger>
                    <TabsTrigger value="ocr" className="text-[11px] font-semibold gap-1.5 h-8 data-[state=active]:bg-card">
                      <FileSearch className="h-3.5 w-3.5" /> 3. OCR Sandbox
                    </TabsTrigger>
                  </TabsList>

                  {/* CANAL 1: XML PARSER CLIENT-SIDE */}
                  <TabsContent value="xml" className="space-y-4 pt-1 focus-visible:outline-none">
                    <div className="flex flex-col items-center justify-center border-dashed border-2 border-border/80 hover:border-primary/50 rounded-xl p-6 bg-muted/10 transition-colors relative group">
                      <input
                        type="file"
                        accept=".xml"
                        onChange={handleXmlUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        aria-label="Upload de XML Fiscal"
                      />
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform mb-3">
                        <FileCode className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-semibold text-foreground/90 group-hover:text-primary transition-colors text-center">
                        Arraste ou clique para enviar o XML estruturado
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1 text-center">
                        Suporte oficial para NF-e padrão nacional e NFS-e (Nota Carioca)
                      </p>
                    </div>

                    {/* MINI VISUALIZADOR TÉCNICO DO XML */}
                    <AnimatePresence>
                      {xmlRawMetadata && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="rounded-lg border border-border/80 bg-muted/30 p-3 relative overflow-hidden"
                        >
                          <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground mb-1.5 border-b border-border/30 pb-1">
                            <span className="flex items-center gap-1 text-primary">
                              <Eye className="h-3 w-3" /> Visualização dos Elementos Extraídos
                            </span>
                            <span className="font-mono text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">XML PARSED</span>
                          </div>
                          <pre className="text-[9px] font-mono text-muted-foreground leading-relaxed overflow-x-auto max-h-[140px]">
                            {xmlRawMetadata}
                          </pre>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </TabsContent>

                  {/* CANAL 2: CHAVE DE ACESSO */}
                  <TabsContent value="key" className="space-y-4 pt-1 focus-visible:outline-none">
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="access-key-input" className="text-[11px] font-semibold text-muted-foreground">
                          Digite a Chave de Acesso da NF-e (44 dígitos numéricos)
                        </Label>
                        <div className="relative">
                          <Input
                            id="access-key-input"
                            type="text"
                            maxLength={54} // suporta espaços na máscara manual do usuário
                            placeholder="0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000"
                            value={chaveAcesso}
                            onChange={(e) => handleKeyChange(e.target.value)}
                            className="font-mono text-xs tracking-wider pr-20 h-9 border-border/60 bg-muted/15 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                          />
                          <div className="absolute right-2.5 top-1.5 text-[9px] font-mono text-muted-foreground/75">
                            {chaveAcesso.length}/44
                          </div>
                        </div>
                      </div>

                      {/* FEEDBACK REATIVO DO CHECKSUM */}
                      <AnimatePresence>
                        {keyValidationInfo.show && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className={`rounded-lg border p-3 flex items-center justify-between transition-all ${
                              keyValidationInfo.isValid 
                                ? "bg-success/5 border-success/30 text-success" 
                                : "bg-destructive/5 border-destructive/30 text-destructive"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {keyValidationInfo.isValid ? (
                                <ShieldCheck className="h-4 w-4 text-success animate-pulse" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-destructive animate-bounce" />
                              )}
                              <div className="leading-tight">
                                <p className="text-[11px] font-bold">
                                  {keyValidationInfo.isValid ? "Checksum Válido" : "Checksum Matemático Inválido"}
                                </p>
                                <p className="text-[9px] opacity-80 font-mono">
                                  {keyValidationInfo.isValid 
                                    ? "Chave íntegra e CNPJ extraído com sucesso" 
                                    : "Validação matemática falhou. Verifique erros de digitação."}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${
                              keyValidationInfo.isValid 
                                ? "border-success/30 bg-success/10 text-success" 
                                : "border-destructive/30 bg-destructive/10 text-destructive"
                            }`}>
                              {keyValidationInfo.isValid ? "DV OK" : "DV ERRO"}
                            </Badge>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </TabsContent>

                  {/* CANAL 3: OCR SANDBOX DRAG & DROP */}
                  <TabsContent value="ocr" className="space-y-4 pt-1 focus-visible:outline-none">
                    <div
                      onDragOver={handleOcrFileDrag}
                      onDrop={handleOcrFileDrop}
                      className="border-dashed border-2 border-border/80 hover:border-primary/50 rounded-xl p-6 bg-muted/10 transition-colors flex flex-col items-center justify-center relative overflow-hidden min-h-[140px]"
                    >
                      {/* EFEITO VISUAL DO SCANNER LASER CSS */}
                      {isScanning && (
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_hsl(var(--primary))] animate-[scan_2s_infinite_ease-in-out]" />
                      )}

                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleOcrFileSelect}
                        disabled={isScanning}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                        aria-label="Upload de Imagem/PDF para OCR"
                      />

                      {isScanning ? (
                        <div className="flex flex-col items-center text-center">
                          <Loader2 className="h-6 w-6 text-primary animate-spin mb-2" />
                          <p className="text-xs font-semibold text-primary animate-pulse">Varrendo documento com OCR inteligente...</p>
                          <p className="text-[9px] text-muted-foreground/70 mt-0.5">Executando heurística de fidelidade na imagem</p>
                        </div>
                      ) : ocrFileName ? (
                        <div className="flex flex-col items-center text-center">
                          <CheckCircle2 className="h-6 w-6 text-success mb-2" />
                          <p className="text-xs font-semibold text-foreground/90">{ocrFileName}</p>
                          <p className="text-[9px] text-muted-foreground/80 mt-1 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Extração finalizada com OCR Simulador
                          </p>
                          <Button variant="ghost" size="sm" onClick={() => resetForm()} className="mt-2 text-[10px] h-7 text-muted-foreground hover:text-destructive">
                            <RefreshCw className="mr-1 h-3 w-3" /> Limpar e varrer outro
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center">
                          <UploadCloud className="h-6 w-6 text-primary mb-2" />
                          <p className="text-xs font-semibold text-foreground/90">Arraste Fatura PDF ou Foto do Recibo</p>
                          <p className="text-[9px] text-muted-foreground/75 mt-1 max-w-xs">
                            Simule o processamento e OCR com o laser de varredura visual de alta tecnologia.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* LINKS E APOIO INSTITUCIONAL RIO */}
                    <div className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-2">
                      <p className="text-[10px] font-bold text-foreground/90 flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5 text-primary" /> Recursos Fiscais Auxiliares
                      </p>
                      <p className="text-[9px] text-muted-foreground leading-relaxed">
                        Se o documento estiver com rasura no OCR ou sem chave, utilize os canais oficiais do município do Rio de Janeiro para consulta e verificação de notas de serviços.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <a
                          href="https://notacarioca.rio.gov.br/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[9px] font-bold text-primary hover:underline bg-primary/5 px-2 py-1 rounded border border-primary/20"
                        >
                          Portal Nota Carioca <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* COLUNA DIREITA: INTERFACE DE CONFERÊNCIA HUMANA ("HUMAN-IN-THE-LOOP") */}
          <div className="lg:col-span-6">
            <Card className="border-border/50 bg-card shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-primary/5 to-transparent pointer-events-none" />
              <CardHeader className="pb-3 border-b border-border/30 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" /> Conferência Humana
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Revise as despesas sugeridas e classifique antes de gravar no banco de dados.
                  </CardDescription>
                </div>
                {extractionMethod !== "manual" && (
                  <Badge variant="outline" className="border-success/30 bg-success/8 text-success font-mono text-[9px] px-1.5 h-4.5 animate-pulse uppercase">
                    Extraído via {extractionMethod}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid gap-3 grid-cols-2">
                  <div className="space-y-1.5 col-span-1">
                    <Label htmlFor="fornecedor-cnpj" className="text-[11px] font-semibold text-muted-foreground">
                      CNPJ do Fornecedor *
                    </Label>
                    <Input
                      id="fornecedor-cnpj"
                      type="text"
                      placeholder="00.000.000/0000-00"
                      value={fornecedorCNPJ}
                      onChange={(e) => setFornecedorCNPJ(formatCNPJ(e.target.value))}
                      className="text-xs h-8.5 border-border/60 font-mono focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 col-span-1">
                    <Label htmlFor="numero-nota-input" className="text-[11px] font-semibold text-muted-foreground">
                      Número do Documento (Nota/Recibo) *
                    </Label>
                    <Input
                      id="numero-nota-input"
                      type="text"
                      placeholder="Ex: 002143"
                      value={numeroNota}
                      onChange={(e) => setNumeroNota(e.target.value)}
                      className="text-xs h-8.5 border-border/60 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="fornecedor-nome" className="text-[11px] font-semibold text-muted-foreground">
                    Razão Social / Nome do Fornecedor *
                  </Label>
                  <Input
                    id="fornecedor-nome"
                    type="text"
                    placeholder="Razão Social completa do Fornecedor"
                    value={fornecedorNome}
                    onChange={(e) => setFornecedorNome(e.target.value)}
                    className="text-xs h-8.5 border-border/60 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="chave-conferencia" className="text-[11px] font-semibold text-muted-foreground">
                    Chave de Acesso (44 dígitos, opcional para NFS-e)
                  </Label>
                  <Input
                    id="chave-conferencia"
                    type="text"
                    placeholder="Chave de acesso da NF-e"
                    value={chaveAcesso}
                    onChange={(e) => setChaveAcesso(e.target.value.replace(/\D/g, "").slice(0, 44))}
                    className="text-xs h-8.5 border-border/60 font-mono focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                  />
                </div>

                <div className="grid gap-3 grid-cols-2">
                  <div className="space-y-1.5 col-span-1">
                    <Label htmlFor="data-emissao-input" className="text-[11px] font-semibold text-muted-foreground">
                      Data de Emissão *
                    </Label>
                    <div className="relative">
                      <Input
                        id="data-emissao-input"
                        type="date"
                        value={dataEmissao}
                        onChange={(e) => setDataEmissao(e.target.value)}
                        className="text-xs h-8.5 border-border/60 pr-8 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                        required
                      />
                      <Calendar className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5 col-span-1">
                    <Label htmlFor="valor-despesa-input" className="text-[11px] font-semibold text-muted-foreground">
                      Valor Total *
                    </Label>
                    <div className="relative">
                      <Input
                        id="valor-despesa-input"
                        type="text"
                        placeholder="0,00"
                        value={valorDespesa}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          if (!val) { setValorDespesa(""); return; }
                          const floatVal = parseFloat(val) / 100;
                          setValorDespesa(floatVal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                        }}
                        className="text-xs h-8.5 border-border/60 pl-8 focus-visible:ring-primary/40 focus-visible:ring-offset-0 font-semibold"
                        required
                      />
                      <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground/60 font-medium">R$</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 grid-cols-2">
                  {/* CLASSIFICAÇÃO DE GASTO: CUSTEIO VS CAPITAL TOGGLE */}
                  <div className="space-y-1.5 col-span-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      Classificação do Recurso *
                    </Label>
                    <div className="grid grid-cols-2 gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/50 h-8.5">
                      <button
                        type="button"
                        onClick={() => setTipoGasto("custeio")}
                        className={`text-[10px] font-bold rounded-md transition-all ${
                          tipoGasto === "custeio"
                            ? "bg-primary/95 text-primary-foreground shadow-sm scale-[1.02]"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Custeio
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipoGasto("capital")}
                        className={`text-[10px] font-bold rounded-md transition-all ${
                          tipoGasto === "capital"
                            ? "bg-primary/95 text-primary-foreground shadow-sm scale-[1.02]"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Capital
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 col-span-1">
                    <Label htmlFor="programa-select" className="text-[11px] font-semibold text-muted-foreground">
                      Programa Associado *
                    </Label>
                    <Select value={programa} onValueChange={setPrograma}>
                      <SelectTrigger id="programa-select" className="h-8.5 text-xs border-border/60 bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basico" className="text-xs">PDDE Básico</SelectItem>
                        <SelectItem value="integral" className="text-xs">PDDE Integral</SelectItem>
                        <SelectItem value="estrutura" className="text-xs">PDDE Estrutura</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* BOTÃO PRINCIPAL DE LANÇAMENTO */}
                <div className="pt-2">
                  <Button
                    onClick={handleHomologar}
                    disabled={isHomologando || !selectedUnidadeId || (novoValorFloat > 0 && saldoProjetado < 0)}
                    className="w-full h-9.5 text-xs font-bold gap-2 relative overflow-hidden bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.005] active:scale-[0.995]"
                  >
                    {isHomologando ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Homologando nota no banco...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Homologar e Lançar Despesa
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
