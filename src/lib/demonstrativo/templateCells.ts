export const DEMONSTRATIVO_TEMPLATE_URL =
  "/templates/demonstrativo-basico-4cre-template.xlsx";

export const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const MEMORIA_SHEET_NAME = "MEMORIA";
export const DEMONSTRATIVO_SHEET_NAME = "Demonstrativo";

export const MEMORIA_CELLS = {
  nome: "B2",
  cnpj: "B3",
  endereco: "B4",
  agencia: "B6",
  contaCorrente: "F6",
  reprogramadoCusteio: "C28",
  reprogramadoCapital: "G28",
  parcela1Custeio: "C29",
  parcela1Capital: "G29",
  parcela2Custeio: "C30",
  parcela2Capital: "G30",
  diretor: "A52",
} as const;
