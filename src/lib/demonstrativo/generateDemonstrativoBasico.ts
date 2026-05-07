import type { Worksheet } from "exceljs";
import type { UnidadeDetalhe } from "@/hooks/useUnidadeDetalhe";
import {
  DEMONSTRATIVO_SHEET_NAME,
  DEMONSTRATIVO_TEMPLATE_URL,
  MEMORIA_CELLS,
  MEMORIA_SHEET_NAME,
  XLSX_MIME_TYPE,
} from "./templateCells";
import {
  buildDemonstrativoFileName,
  mapUnidadeToMemoria,
  type DemonstrativoMemoriaData,
} from "./mapUnidadeToMemoria";

export interface GeneratedDemonstrativo {
  blob: Blob;
  fileName: string;
  memoria: DemonstrativoMemoriaData;
}

const fetchTemplate = async () => {
  const response = await fetch(DEMONSTRATIVO_TEMPLATE_URL);

  if (!response.ok) {
    throw new Error(
      `Template do Demonstrativo Basico nao encontrado (${response.status}).`,
    );
  }

  return response.arrayBuffer();
};

const setCell = (worksheet: Worksheet, address: string, value: string | number) => {
  worksheet.getCell(address).value = value;
};

const fillMemoria = (worksheet: Worksheet, data: DemonstrativoMemoriaData) => {
  setCell(worksheet, MEMORIA_CELLS.nome, data.nome);
  setCell(worksheet, MEMORIA_CELLS.cnpj, data.cnpj);
  setCell(worksheet, MEMORIA_CELLS.endereco, data.endereco);
  setCell(worksheet, MEMORIA_CELLS.agencia, data.agencia);
  setCell(worksheet, MEMORIA_CELLS.contaCorrente, data.contaCorrente);
  setCell(worksheet, MEMORIA_CELLS.reprogramadoCusteio, data.reprogramadoCusteio);
  setCell(worksheet, MEMORIA_CELLS.reprogramadoCapital, data.reprogramadoCapital);
  setCell(worksheet, MEMORIA_CELLS.parcela1Custeio, data.parcela1Custeio);
  setCell(worksheet, MEMORIA_CELLS.parcela1Capital, data.parcela1Capital);
  setCell(worksheet, MEMORIA_CELLS.parcela2Custeio, data.parcela2Custeio);
  setCell(worksheet, MEMORIA_CELLS.parcela2Capital, data.parcela2Capital);
  setCell(worksheet, MEMORIA_CELLS.diretor, data.diretor);
};

export async function generateDemonstrativoBasico(
  unidade: UnidadeDetalhe,
  exercicio: string,
): Promise<GeneratedDemonstrativo> {
  const templateBuffer = await fetchTemplate();
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.load(templateBuffer);
  workbook.calcProperties.fullCalcOnLoad = true;
  workbook.calcProperties.forceFullCalc = true;

  const memoriaWorksheet = workbook.getWorksheet(MEMORIA_SHEET_NAME);
  const demonstrativoWorksheet = workbook.getWorksheet(DEMONSTRATIVO_SHEET_NAME);

  if (!memoriaWorksheet) {
    throw new Error(`Aba ${MEMORIA_SHEET_NAME} nao encontrada no template.`);
  }

  if (!demonstrativoWorksheet) {
    throw new Error(`Aba ${DEMONSTRATIVO_SHEET_NAME} nao encontrada no template.`);
  }

  const memoria = mapUnidadeToMemoria(unidade, exercicio);
  fillMemoria(memoriaWorksheet, memoria);

  const outputBuffer = await workbook.xlsx.writeBuffer();

  return {
    blob: new Blob([outputBuffer as BlobPart], { type: XLSX_MIME_TYPE }),
    fileName: buildDemonstrativoFileName(memoria),
    memoria,
  };
}
