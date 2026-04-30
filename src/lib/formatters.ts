type NullableNumber = number | string | null | undefined;
type NullableDate = string | number | Date | null | undefined;

function numberOrZero(value: NullableNumber) {
  if (value === null || value === undefined || value === "") return 0;

  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function fmtBRL(value: NullableNumber, options: Intl.NumberFormatOptions = {}) {
  return numberOrZero(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  });
}

export function fmtBRLCompacto(value: NullableNumber) {
  return numberOrZero(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  });
}

export function fmtData(value: NullableDate, options: Intl.DateTimeFormatOptions = {}) {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...options,
  });
}
