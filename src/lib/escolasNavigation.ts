export type EscolasStatusFilter = "todas" | "completo" | "incompleto";

export interface EscolasFilterState {
  q: string;
  status: EscolasStatusFilter;
}

export function parseEscolasSearchParams(searchParams: URLSearchParams): EscolasFilterState {
  const rawStatus = searchParams.get("status");
  const status: EscolasStatusFilter = rawStatus === "completo" || rawStatus === "incompleto"
    ? rawStatus
    : "todas";

  return {
    q: searchParams.get("q") ?? "",
    status,
  };
}

export function buildEscolasSearchParams(filters: EscolasFilterState) {
  const params = new URLSearchParams();
  const q = filters.q.trim();
  if (q) params.set("q", q);
  if (filters.status !== "todas") params.set("status", filters.status);
  return params;
}

export function buildEscolasReturnPath(searchParams: URLSearchParams) {
  const query = searchParams.toString();
  return `/escolas${query ? `?${query}` : ""}`;
}

export function buildSchoolDetailPath(schoolId: string, searchParams: URLSearchParams) {
  const returnTo = buildEscolasReturnPath(searchParams);
  return `/escolas/${schoolId}?return=${encodeURIComponent(returnTo)}`;
}

export function resolveSafeEscolasReturn(value: string | null | undefined) {
  if (!value || !value.startsWith("/escolas") || value.startsWith("//")) return "/escolas";
  return value;
}
