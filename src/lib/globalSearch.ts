export interface GlobalNavigationItem {
  id: "dashboard" | "atualizacoes" | "repasses" | "escolas";
  label: string;
  path: string;
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
    keywords: ["dashboard", "painel", "inicio", "visao geral"],
  },
  {
    id: "atualizacoes",
    label: "Atualizações financeiras",
    path: "/atualizacoes",
    keywords: ["novidades", "atualizacoes", "pagamentos", "ordens", "creditos"],
  },
  {
    id: "repasses",
    label: "Repasses",
    path: "/repasses",
    keywords: ["financeiro", "recursos", "pagamentos", "parcelas", "pdde"],
  },
  {
    id: "escolas",
    label: "Unidades Escolares",
    path: "/escolas",
    keywords: ["escolas", "unidades", "ue", "cadastro"],
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
