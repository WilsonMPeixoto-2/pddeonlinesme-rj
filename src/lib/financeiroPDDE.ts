export interface RepasseFinanceiro {
  id: string;
  unidade_id: string;
  designacao: string | null;
  nome: string | null;
  inep: string | null;
  exercicio: number;
  programa: string;
  acao: string;
  parcela: string;
  ordem_exibicao: number;
  valor_programado: number;
  valor_pago: number | null;
  data_pagamento: string | null;
  data_ordem_pagamento: string | null;
  conta_bancaria_id: string | null;
  banco: string | null;
  agencia: string | null;
  conta_corrente: string | null;
  custeio_programado: number | null;
  capital_programado: number | null;
  custeio_pago: number | null;
  capital_pago: number | null;
}

export interface ContaFinanceira {
  id: string;
  unidade_id: string;
  programa: string | null;
  exercicio: number | null;
  banco: string | null;
  agencia: string | null;
  conta_corrente: string | null;
  principal: boolean;
}

export interface EscolaPrimeiraParcela {
  unidadeId: string;
  designacao: string;
  nome: string;
  inep: string | null;
  acao: string;
  valorPago: number;
  dataPagamento: string | null;
  participacao: number;
}

export interface ActionOverview {
  acao: string;
  total: number;
  escolas: number;
  participacao: number;
}

export interface ValueBandOverview {
  id: "ate-3" | "3-5" | "5-8" | "acima-8";
  label: string;
  minExclusive: number | null;
  maxInclusive: number | null;
  escolas: number;
  total: number;
}

export interface PaymentDateOverview {
  data: string;
  escolas: number;
  total: number;
  acumulado: number;
}

export interface PrimeiraParcelaOverview {
  exercicio: number;
  totalPago: number;
  escolas: EscolaPrimeiraParcela[];
  mediana: number;
  media: number;
  porAcao: ActionOverview[];
  faixas: ValueBandOverview[];
  porData: PaymentDateOverview[];
  insightAcao: string | null;
  insightFaixa: string | null;
  insightData: string | null;
}

export interface ProgramaFinanceiroOverview {
  programa: string;
  totalProgramado: number | null;
  totalPago: number | null;
  pagamentosIdentificados: number;
  acoes: number;
  contas: number;
  escolas: number;
}

export interface DashboardFinanceiroOverview {
  exercicio: number;
  totalProgramado: number | null;
  totalPagoIdentificado: number | null;
  pagamentosIdentificados: number;
  totalRepasses: number;
  totalContas: number;
  totalEscolas: number;
  ultimaDataPagamento: string | null;
  primeiraParcela: {
    totalPago: number | null;
    escolas: number;
    custeioPago: number | null;
    capitalPago: number | null;
    detalhamentoCompleto: number;
    ultimaDataPagamento: string | null;
  };
  porPrograma: ProgramaFinanceiroOverview[];
}

export interface ParcelaFinanceira {
  id: string;
  parcela: string;
  ordem: number;
  valorProgramado: number;
  valorPago: number | null;
  dataPagamento: string | null;
  dataOrdemPagamento: string | null;
  contaBancariaId: string | null;
  custeioProgramado: number | null;
  capitalProgramado: number | null;
  custeioPago: number | null;
  capitalPago: number | null;
}

export interface AcaoFinanceira {
  acao: string;
  label: string;
  parcelas: ParcelaFinanceira[];
}

export interface ProgramaFinanceiro {
  programa: string;
  contas: ContaFinanceira[];
  acoes: AcaoFinanceira[];
}

export const PROGRAM_ORDER = ["PDDE BÁSICO", "PDDE QUALIDADE", "PDDE EQUIDADE"] as const;

export function actionLabel(acao: string) {
  if (acao === "PDDE Básico — Primeira Infância") return "Primeira Infância";
  return acao;
}

export function isPrimeiraParcelaPublicada(repasse: RepasseFinanceiro, exercicio: number) {
  if (
    repasse.exercicio !== exercicio ||
    repasse.programa !== "PDDE BÁSICO" ||
    repasse.valor_pago === null
  ) {
    return false;
  }

  return (
    (repasse.acao === "PDDE Básico" && repasse.parcela === "1ª Parcela") ||
    (repasse.acao === "PDDE Básico — Primeira Infância" && repasse.parcela === "P1")
  );
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function buildBands(escolas: EscolaPrimeiraParcela[]): ValueBandOverview[] {
  const definitions: Array<Omit<ValueBandOverview, "escolas" | "total">> = [
    { id: "ate-3", label: "Até R$ 3 mil", minExclusive: null, maxInclusive: 3000 },
    { id: "3-5", label: "R$ 3–5 mil", minExclusive: 3000, maxInclusive: 5000 },
    { id: "5-8", label: "R$ 5–8 mil", minExclusive: 5000, maxInclusive: 8000 },
    { id: "acima-8", label: "Acima de R$ 8 mil", minExclusive: 8000, maxInclusive: null },
  ];

  return definitions.map((definition) => {
    const rows = escolas.filter((row) => {
      const aboveMin = definition.minExclusive === null || row.valorPago > definition.minExclusive;
      const belowMax = definition.maxInclusive === null || row.valorPago <= definition.maxInclusive;
      return aboveMin && belowMax;
    });
    return {
      ...definition,
      escolas: rows.length,
      total: rows.reduce((sum, row) => sum + row.valorPago, 0),
    };
  });
}

export function buildPrimeiraParcelaOverview(
  repasses: RepasseFinanceiro[],
  exercicio: number,
): PrimeiraParcelaOverview {
  const publicados = repasses.filter((repasse) => isPrimeiraParcelaPublicada(repasse, exercicio));
  const bySchool = new Map<string, EscolaPrimeiraParcela>();

  for (const repasse of publicados) {
    const value = repasse.valor_pago ?? 0;
    const current = bySchool.get(repasse.unidade_id);
    if (current) {
      current.valorPago += value;
      if (!current.dataPagamento && repasse.data_pagamento) current.dataPagamento = repasse.data_pagamento;
      if (current.acao !== actionLabel(repasse.acao)) current.acao = "Múltiplas ações";
      continue;
    }

    bySchool.set(repasse.unidade_id, {
      unidadeId: repasse.unidade_id,
      designacao: repasse.designacao ?? repasse.nome ?? "Unidade escolar",
      nome: repasse.nome ?? repasse.designacao ?? "Unidade escolar",
      inep: repasse.inep,
      acao: actionLabel(repasse.acao),
      valorPago: value,
      dataPagamento: repasse.data_pagamento,
      participacao: 0,
    });
  }

  const totalPago = [...bySchool.values()].reduce((sum, row) => sum + row.valorPago, 0);
  const escolas = [...bySchool.values()]
    .map((row) => ({ ...row, participacao: totalPago > 0 ? row.valorPago / totalPago : 0 }))
    .sort((a, b) => b.valorPago - a.valorPago || a.designacao.localeCompare(b.designacao, "pt-BR"));

  const actionMap = new Map<string, { total: number; escolas: Set<string> }>();
  for (const repasse of publicados) {
    const label = actionLabel(repasse.acao);
    const current = actionMap.get(label) ?? { total: 0, escolas: new Set<string>() };
    current.total += repasse.valor_pago ?? 0;
    current.escolas.add(repasse.unidade_id);
    actionMap.set(label, current);
  }

  const porAcao = [...actionMap.entries()]
    .map(([acao, item]) => ({
      acao,
      total: item.total,
      escolas: item.escolas.size,
      participacao: totalPago > 0 ? item.total / totalPago : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const dateMap = new Map<string, { escolas: Set<string>; total: number }>();
  for (const repasse of publicados) {
    if (!repasse.data_pagamento) continue;
    const current = dateMap.get(repasse.data_pagamento) ?? { escolas: new Set<string>(), total: 0 };
    current.escolas.add(repasse.unidade_id);
    current.total += repasse.valor_pago ?? 0;
    dateMap.set(repasse.data_pagamento, current);
  }

  let acumulado = 0;
  const porData = [...dateMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, item]) => {
      acumulado += item.total;
      return { data, escolas: item.escolas.size, total: item.total, acumulado };
    });

  const faixas = buildBands(escolas);
  const predominantAction = porAcao[0];
  const predominantBand = [...faixas].sort((a, b) => b.escolas - a.escolas)[0];
  const predominantDate = [...porData].sort((a, b) => b.escolas - a.escolas)[0];

  return {
    exercicio,
    totalPago,
    escolas,
    mediana: median(escolas.map((row) => row.valorPago)),
    media: escolas.length > 0 ? totalPago / escolas.length : 0,
    porAcao,
    faixas,
    porData,
    insightAcao: predominantAction && porAcao.length > 1
      ? `${predominantAction.acao} representa ${Math.round(predominantAction.participacao * 100)}% do valor repassado neste recorte.`
      : null,
    insightFaixa: predominantBand
      ? `${predominantBand.escolas} escolas estão na faixa ${predominantBand.label.toLowerCase()}.`
      : null,
    insightData: predominantDate && porData.length > 1
      ? `${predominantDate.escolas} escolas receberam recursos na data com maior concentração de pagamentos.`
      : null,
  };
}

export function buildDashboardFinanceiroOverview(
  repasses: RepasseFinanceiro[],
  contas: ContaFinanceira[],
  exercicio: number,
): DashboardFinanceiroOverview {
  const repassesDoExercicio = repasses.filter((repasse) => repasse.exercicio === exercicio);
  const contasDoExercicio = contas.filter((conta) => conta.exercicio === exercicio);
  const pagos = repassesDoExercicio.filter((repasse) => repasse.valor_pago !== null);
  const primeiraParcela = repassesDoExercicio.filter((repasse) =>
    isPrimeiraParcelaPublicada(repasse, exercicio),
  );

  const escolas = new Set<string>();
  repassesDoExercicio.forEach((repasse) => escolas.add(repasse.unidade_id));
  contasDoExercicio.forEach((conta) => escolas.add(conta.unidade_id));

  const somaConhecida = (
    rows: RepasseFinanceiro[],
    field: "custeio_pago" | "capital_pago",
  ) => {
    if (rows.length === 0 || rows.some((row) => row[field] === null)) return null;
    return rows.reduce((sum, row) => sum + (row[field] ?? 0), 0);
  };

  const programNames = new Set<string>();
  repassesDoExercicio.forEach((repasse) => programNames.add(repasse.programa));
  contasDoExercicio.forEach((conta) => {
    if (conta.programa) programNames.add(conta.programa);
  });
  PROGRAM_ORDER.forEach((programa) => {
    if (
      repassesDoExercicio.some((repasse) => repasse.programa === programa) ||
      contasDoExercicio.some((conta) => conta.programa === programa)
    ) {
      programNames.add(programa);
    }
  });

  const order = new Map<string, number>(PROGRAM_ORDER.map((programa, index) => [programa, index]));
  const porPrograma = [...programNames]
    .map((programa): ProgramaFinanceiroOverview => {
      const repassesPrograma = repassesDoExercicio.filter((repasse) => repasse.programa === programa);
      const contasPrograma = contasDoExercicio.filter((conta) => conta.programa === programa);
      const pagosPrograma = repassesPrograma.filter((repasse) => repasse.valor_pago !== null);
      const escolasPrograma = new Set<string>();
      repassesPrograma.forEach((repasse) => escolasPrograma.add(repasse.unidade_id));
      contasPrograma.forEach((conta) => escolasPrograma.add(conta.unidade_id));
      return {
        programa,
        totalProgramado: repassesPrograma.length > 0
          ? repassesPrograma.reduce((sum, repasse) => sum + repasse.valor_programado, 0)
          : null,
        totalPago: pagosPrograma.length > 0
          ? pagosPrograma.reduce((sum, repasse) => sum + (repasse.valor_pago ?? 0), 0)
          : null,
        pagamentosIdentificados: pagosPrograma.length,
        acoes: new Set(repassesPrograma.map((repasse) => repasse.acao)).size,
        contas: contasPrograma.length,
        escolas: escolasPrograma.size,
      };
    })
    .sort(
      (a, b) =>
        (order.get(a.programa) ?? 99) - (order.get(b.programa) ?? 99) ||
        a.programa.localeCompare(b.programa, "pt-BR"),
    );

  const datasPagamento = pagos
    .map((repasse) => repasse.data_pagamento)
    .filter((data): data is string => Boolean(data))
    .sort((a, b) => b.localeCompare(a));
  const datasPrimeiraParcela = primeiraParcela
    .map((repasse) => repasse.data_pagamento)
    .filter((data): data is string => Boolean(data))
    .sort((a, b) => b.localeCompare(a));

  return {
    exercicio,
    totalProgramado: repassesDoExercicio.length > 0
      ? repassesDoExercicio.reduce((sum, repasse) => sum + repasse.valor_programado, 0)
      : null,
    totalPagoIdentificado: pagos.length > 0
      ? pagos.reduce((sum, repasse) => sum + (repasse.valor_pago ?? 0), 0)
      : null,
    pagamentosIdentificados: pagos.length,
    totalRepasses: repassesDoExercicio.length,
    totalContas: contasDoExercicio.length,
    totalEscolas: escolas.size,
    ultimaDataPagamento: datasPagamento[0] ?? null,
    primeiraParcela: {
      totalPago: primeiraParcela.length > 0
        ? primeiraParcela.reduce((sum, repasse) => sum + (repasse.valor_pago ?? 0), 0)
        : null,
      escolas: new Set(primeiraParcela.map((repasse) => repasse.unidade_id)).size,
      custeioPago: somaConhecida(primeiraParcela, "custeio_pago"),
      capitalPago: somaConhecida(primeiraParcela, "capital_pago"),
      detalhamentoCompleto: primeiraParcela.filter(
        (repasse) => repasse.custeio_pago !== null && repasse.capital_pago !== null,
      ).length,
      ultimaDataPagamento: datasPrimeiraParcela[0] ?? null,
    },
    porPrograma,
  };
}

export function groupFinanceiroByProgram(
  contas: ContaFinanceira[],
  repasses: RepasseFinanceiro[],
  exercicio: number,
): ProgramaFinanceiro[] {
  const programs = new Map<string, ProgramaFinanceiro>();
  const ensureProgram = (programa: string) => {
    const existing = programs.get(programa);
    if (existing) return existing;
    const next: ProgramaFinanceiro = { programa, contas: [], acoes: [] };
    programs.set(programa, next);
    return next;
  };

  for (const conta of contas) {
    if (conta.exercicio !== exercicio || !conta.programa) continue;
    ensureProgram(conta.programa).contas.push(conta);
  }

  const actionMaps = new Map<string, Map<string, AcaoFinanceira>>();
  for (const repasse of repasses) {
    if (repasse.exercicio !== exercicio) continue;
    const program = ensureProgram(repasse.programa);
    let actions = actionMaps.get(repasse.programa);
    if (!actions) {
      actions = new Map<string, AcaoFinanceira>();
      actionMaps.set(repasse.programa, actions);
    }
    let action = actions.get(repasse.acao);
    if (!action) {
      action = { acao: repasse.acao, label: actionLabel(repasse.acao), parcelas: [] };
      actions.set(repasse.acao, action);
      program.acoes.push(action);
    }
    action.parcelas.push({
      id: repasse.id,
      parcela: repasse.parcela,
      ordem: repasse.ordem_exibicao,
      valorProgramado: repasse.valor_programado,
      valorPago: repasse.valor_pago,
      dataPagamento: repasse.data_pagamento,
      dataOrdemPagamento: repasse.data_ordem_pagamento,
      contaBancariaId: repasse.conta_bancaria_id,
      custeioProgramado: repasse.custeio_programado,
      capitalProgramado: repasse.capital_programado,
      custeioPago: repasse.custeio_pago,
      capitalPago: repasse.capital_pago,
    });
  }

  const order = new Map<string, number>(PROGRAM_ORDER.map((program, index) => [program, index]));
  return [...programs.values()]
    .map((program) => ({
      ...program,
      contas: [...program.contas].sort((a, b) => Number(b.principal) - Number(a.principal)),
      acoes: program.acoes
        .map((acao) => ({ ...acao, parcelas: [...acao.parcelas].sort((a, b) => a.ordem - b.ordem) }))
        .sort((a, b) => a.label.localeCompare(b.label, "pt-BR")),
    }))
    .sort((a, b) => (order.get(a.programa) ?? 99) - (order.get(b.programa) ?? 99) || a.programa.localeCompare(b.programa, "pt-BR"));
}

export function isSchoolInBand(value: number, band: ValueBandOverview) {
  const aboveMin = band.minExclusive === null || value > band.minExclusive;
  const belowMax = band.maxInclusive === null || value <= band.maxInclusive;
  return aboveMin && belowMax;
}