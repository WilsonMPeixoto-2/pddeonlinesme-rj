export interface GlobalNavigationItem {
  id: "dashboard" | "repasses" | "escolas" | "fiscal" | "base" | "configuracoes" | "manual" | "diretor";
  label: string;
  path: string;
  shortcut?: string;
  keywords: string[];
}

export interface GlobalSearchSchool {
  id: string;
  designacao: string;
  nome: string | null;
  inep: string | null;
  cnpj: string | null;
  diretor: string | null;
}

export const GLOBAL_NAVIGATION: GlobalNavigationItem[] = [
  {
    id: "dashboard",
    label: "Painel",
    path: "/dashboard",
    shortcut: "D",
    keywords: ["dashboard", "painel", "inicio", "visao geral"],
  },
  {
    id: "repasses",
    label: "Repasses",
    path: "/repasses",
    shortcut: "R",
    keywords: ["financeiro", "recursos", "pagamentos", "parcelas", "pdde"],
  },
  {
    id: "escolas",
    label: "Unidades Escolares",
    path: "/escolas",
    shortcut: "E",
    keywords: ["escolas", "unidades", "ue", "cadastro"],
  },
  {
    id: "fiscal",
    label: "Frente Fiscal",
    path: "/fiscal",
    shortcut: "F",
    keywords: ["fiscal", "nota fiscal", "despesas", "homologacao"],
  },
  {
    id: "base",
    label: "Importar / Exportar BASE",
    path: "/base",
    shortcut: "B",
    keywords: ["base", "importar", "exportar", "dados"],
  },
  {
    id: "configuracoes",
    label: "Configurações",
    path: "/configuracoes",
    shortcut: "C",
    keywords: ["configuracoes", "preferencias", "administracao"],
  },
  {
    id: "manual",
    label: "Manual",
    path: "/manual",
    shortcut: "M",
    keywords: ["manual", "ajuda", "orientacoes"],
  },
  {
    id: "diretor",
    label: "Portal do Diretor",
    path: "/diretor",
    shortcut: "P",
    keywords: ["diretor", "portal", "escola"],
  },
];

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function onlyDigits(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

export function searchGlobalSchools(
  schools: GlobalSearchSchool[],
  query: string,
  limit = 8,
) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];

  const queryDigits = onlyDigits(query);

  return schools
    .filter((school) => {
      const textualHaystack = normalizeText([
        school.designacao,
        school.nome,
        school.diretor,
      ].filter(Boolean).join(" "));

      if (textualHaystack.includes(normalizedQuery)) return true;
      if (queryDigits.length < 2) return false;

      return [school.inep, school.cnpj]
        .map(onlyDigits)
        .some((value) => value.includes(queryDigits));
    })
    .slice(0, Math.max(0, limit));
}
