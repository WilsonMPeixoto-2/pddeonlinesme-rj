import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

// 1. Carregar variáveis do .env.local manualmente
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, "utf-8");
  envFile.split("\n").forEach((line) => {
    if (line.trim().startsWith("#") || !line.trim()) return;
    const [key, ...valueChunks] = line.split("=");
    if (key && valueChunks.length > 0) {
      process.env[key.trim()] = valueChunks.join("=").trim().replace(/(^"|"$)/g, '');
    }
  });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE_XLSX_PATH = process.env.BASE_XLSX_PATH;
const IMPORT_EXERCICIO = parseInt(process.env.IMPORT_EXERCICIO || "2026", 10);
const IMPORT_PROGRAMA = process.env.IMPORT_PROGRAMA || "basico";

const HEADER_MAP = {
  "DESIGNAÇÃO": "designacao",
  "DESIGNACAO": "designacao",
  "NOME": "nome",
  "INEP": "inep",
  "CNPJ": "cnpj",
  "REPROGRAMADO CUSTEIO": "reprogramado_custeio",
  "REPROGRAMADO CAPITAL": "reprogramado_capital",
  "DIRETOR": "diretor",
  "ENDEREÇO": "endereco",
  "ENDERECO": "endereco",
  "AGENCIA": "agencia",
  "AGÊNCIA": "agencia",
  "CONTA CORRENTE": "conta_corrente",
  "1 PARCELA CUSTEIO": "parcela_1_custeio",
  "1 PARCELA CAPITAL": "parcela_1_capital",
  "2 PARCELA CUSTEIO": "parcela_2_custeio",
  "2 PARCELA CAPITAL": "parcela_2_capital",
};

const onlyDigits = (v) => String(v ?? "").replace(/\D/g, "");

function toNumber(v) {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v).replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function toText(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

function buildDesignacao(codigo, nome) {
  const c = codigo.trim();
  const n = nome.trim();
  if (!c && !n) return "";
  if (!n) return c;
  if (!c) return n;
  return `${c} — ${n}`;
}

async function run() {
  console.log("🚀 Iniciando importação administrativa da BASE...");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ ERRO: Faltam variáveis de conexão do Supabase.");
    process.exit(1);
  }

  if (!BASE_XLSX_PATH) {
    console.error("❌ ERRO: A variável BASE_XLSX_PATH não está definida.");
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), BASE_XLSX_PATH);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ ERRO: Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`📂 Lendo arquivo: ${filePath}`);
  const buffer = fs.readFileSync(filePath);
  const wb = XLSX.read(buffer, { type: "buffer" });

  if (!wb.SheetNames.includes("BASE")) {
    console.error("❌ ERRO: Aba 'BASE' não encontrada na planilha.");
    process.exit(1);
  }

  const ws = wb.Sheets["BASE"];
  const raw = XLSX.utils.sheet_to_json(ws, { defval: null, raw: true });

  const sample = raw[0] ?? {};
  const fieldByHeader = new Map();
  Object.keys(sample).forEach((h) => {
    const key = h.toUpperCase().trim();
    const target = HEADER_MAP[key];
    if (target) fieldByHeader.set(h, target);
  });

  const rows = [];
  const errors = [];

  raw.forEach((rawRow, idx) => {
    const rowIndex = idx + 2;
    const get = (key) => {
      for (const [h, target] of fieldByHeader) {
        if (target === key) return rawRow[h];
      }
      return null;
    };

    const codigo = String(rawRow["DESIGNAÇÃO"] ?? rawRow["DESIGNACAO"] ?? "").trim();
    const nome = String(rawRow["NOME"] ?? "").trim();
    if (!codigo && !nome) return;

    const designacao = buildDesignacao(codigo, nome);
    if (!designacao) {
      errors.push({ rowIndex, field: "designacao", message: "Linha sem designação/nome." });
      return;
    }

    const inepRaw = onlyDigits(get("inep"));
    let cnpjRaw = onlyDigits(get("cnpj"));

    if (cnpjRaw && cnpjRaw.length === 13) {
      cnpjRaw = cnpjRaw.padStart(14, "0");
    }

    if (inepRaw && inepRaw.length !== 8) {
      errors.push({ rowIndex, field: "INEP", message: `INEP com ${inepRaw.length} dígitos.` });
    }
    if (cnpjRaw && cnpjRaw.length !== 14) {
      errors.push({ rowIndex, field: "CNPJ", message: `CNPJ com ${cnpjRaw.length} dígitos.` });
    }

    rows.push({
      rowIndex,
      designacao,
      nome: nome || null,
      inep: inepRaw && inepRaw.length === 8 ? inepRaw : null,
      cnpj: cnpjRaw && cnpjRaw.length === 14 ? cnpjRaw : null,
      diretor: toText(get("diretor")),
      endereco: toText(get("endereco")),
      agencia: toText(get("agencia")),
      conta_corrente: toText(get("conta_corrente")),
      reprogramado_custeio: toNumber(get("reprogramado_custeio")),
      reprogramado_capital: toNumber(get("reprogramado_capital")),
      parcela_1_custeio: toNumber(get("parcela_1_custeio")),
      parcela_1_capital: toNumber(get("parcela_1_capital")),
      parcela_2_custeio: toNumber(get("parcela_2_custeio")),
      parcela_2_capital: toNumber(get("parcela_2_capital")),
      saldo_anterior: toNumber(get("reprogramado_custeio")) + toNumber(get("reprogramado_capital")),
      recebido: toNumber(get("parcela_1_custeio")) + toNumber(get("parcela_1_capital")) + toNumber(get("parcela_2_custeio")) + toNumber(get("parcela_2_capital")),
    });
  });

  console.log(`📝 Parse concluído. ${rows.length} linhas válidas encontradas.`);
  if (errors.length > 0) console.log(`⚠️ Foram encontrados ${errors.length} warnings.`);

  // Upsert unidades_escolares
  const payload = rows.map(({ rowIndex, ...rest }) => rest);
  const designacoes = payload.map((p) => p.designacao);
  
  const { data: existing } = await supabaseAdmin
    .from("unidades_escolares")
    .select("designacao")
    .in("designacao", designacoes);

  const existingSet = new Set((existing ?? []).map((e) => e.designacao));
  const inserted = payload.filter((p) => !existingSet.has(p.designacao)).length;
  const updated = payload.length - inserted;

  console.log("⏳ Enviando unidades_escolares...");
  const { error: upsertError } = await supabaseAdmin
    .from("unidades_escolares")
    .upsert(payload, { onConflict: "designacao" });

  if (upsertError) {
    console.error("❌ Erro no upsert de unidades_escolares:", upsertError.message);
    process.exit(1);
  }

  // Execucao Financeira
  console.log("⏳ Recuperando IDs e enviando execucao_financeira...");
  const { data: ids, error: selectError } = await supabaseAdmin
    .from("unidades_escolares")
    .select("id, designacao")
    .in("designacao", designacoes);

  if (selectError) {
    console.error("❌ Erro ao recuperar IDs:", selectError.message);
    process.exit(1);
  }

  const idByDesignacao = new Map((ids ?? []).map((u) => [u.designacao, u.id]));
  const execPayload = rows.map((r) => {
    const unidade_id = idByDesignacao.get(r.designacao);
    if (!unidade_id) return null;
    return {
      unidade_id,
      exercicio: IMPORT_EXERCICIO,
      programa: IMPORT_PROGRAMA,
      reprogramado_custeio: r.reprogramado_custeio,
      reprogramado_capital: r.reprogramado_capital,
      parcela_1_custeio: r.parcela_1_custeio,
      parcela_1_capital: r.parcela_1_capital,
      parcela_2_custeio: r.parcela_2_custeio,
      parcela_2_capital: r.parcela_2_capital,
    };
  }).filter(p => p !== null);

  const { error: execError } = await supabaseAdmin
    .from("execucao_financeira")
    .upsert(execPayload, { onConflict: "unidade_id,exercicio,programa" });

  if (execError) {
    console.error("❌ Erro no upsert de execucao_financeira:", execError.message);
    process.exit(1);
  }

  // Logs
  console.log("⏳ Registrando import_logs...");
  await supabaseAdmin.from("import_logs").insert({
    user_id: null,
    source: "SCRIPT_ADMIN_LOCAL",
    filename: path.basename(filePath),
    exercicio: IMPORT_EXERCICIO,
    programa: IMPORT_PROGRAMA,
    total_rows: rows.length,
    inserted_rows: inserted,
    updated_rows: updated,
    skipped_rows: 0,
    errors: errors.slice(0, 100),
    status: errors.length > 0 ? "partial" : "success",
  });

  console.log("\n📊 VALIDAÇÃO DE CONTAGENS NO SUPABASE:");
  const res1 = await supabaseAdmin.from("unidades_escolares").select("*", { count: "exact", head: true });
  const res2 = await supabaseAdmin.from("execucao_financeira").select("*", { count: "exact", head: true });
  const res3 = await supabaseAdmin.from("vw_unidades_localizador").select("*", { count: "exact", head: true });
  const res4 = await supabaseAdmin.from("vw_unidade_detalhe").select("*", { count: "exact", head: true });
  const { data: dbData } = await supabaseAdmin.from("vw_dashboard_basico").select("*");

  console.log(`  - unidades_escolares: ${res1.count || 0}`);
  console.log(`  - execucao_financeira: ${res2.count || 0}`);
  console.log(`  - vw_unidades_localizador: ${res3.count || 0}`);
  console.log(`  - vw_unidade_detalhe: ${res4.count || 0}`);
  console.log(`  - vw_dashboard_basico:`);
  console.table(dbData);

  console.log("\n🎉 IMPORTAÇÃO BASE CONCLUÍDA COM SUCESSO!");
}

run().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
