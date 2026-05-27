import type { Workbook } from "exceljs";
import type { UnidadeDetalhe } from "@/hooks/useUnidadeDetalhe";

export interface CapitalExpenseItem {
  id: string;
  fornecedor_cnpj: string;
  fornecedor_nome: string;
  numero_nota: string;
  data_emissao: string;
  valor: number;
  programa: string;
}

export interface GeneratedRelacaoBens {
  blob: Blob;
  fileName: string;
}

const XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function generateRelacaoBens(
  unidade: UnidadeDetalhe,
  items: CapitalExpenseItem[],
  exercicio: string
): Promise<GeneratedRelacaoBens> {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Anexo II - Bens Adquiridos");

  // Ativa linhas de grade (Gridlines)
  worksheet.views = [{ showGridLines: true }];

  // Configuração de larguras das colunas
  worksheet.columns = [
    { key: "item", width: 8 },
    { key: "fornecedor", width: 35 },
    { key: "nota", width: 14 },
    { key: "data", width: 15 },
    { key: "descricao", width: 45 },
    { key: "qtd", width: 10 },
    { key: "valor_unit", width: 18 },
    { key: "valor_total", width: 18 }
  ];

  // Estilos Comuns
  const fontTitle = { name: "Arial", size: 11, bold: true };
  const fontHeader = { name: "Arial", size: 9, bold: true };
  const fontBody = { name: "Arial", size: 9 };
  const borderThin = {
    top: { style: "thin" as const, color: { argb: "FFD3D3D3" } },
    left: { style: "thin" as const, color: { argb: "FFD3D3D3" } },
    bottom: { style: "thin" as const, color: { argb: "FFD3D3D3" } },
    right: { style: "thin" as const, color: { argb: "FFD3D3D3" } }
  };
  const borderHeader = {
    top: { style: "medium" as const, color: { argb: "FF000000" } },
    left: { style: "thin" as const, color: { argb: "FFD3D3D3" } },
    bottom: { style: "medium" as const, color: { argb: "FF000000" } },
    right: { style: "thin" as const, color: { argb: "FFD3D3D3" } }
  };

  // 1. Cabeçalho Institucional
  worksheet.mergeCells("A1:H1");
  const r1 = worksheet.getCell("A1");
  r1.value = "PREFEITURA DA CIDADE DO RIO DE JANEIRO";
  r1.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF404040" } };
  r1.alignment = { horizontal: "center" };

  worksheet.mergeCells("A2:H2");
  const r2 = worksheet.getCell("A2");
  r2.value = "SECRETARIA MUNICIPAL DE EDUCAÇÃO - 4ª COORDENADORIA REGIONAL DE EDUCAÇÃO";
  r2.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF606060" } };
  r2.alignment = { horizontal: "center" };

  worksheet.mergeCells("A4:H4");
  const r4 = worksheet.getCell("A4");
  r4.value = "RELAÇÃO DE BENS ADQUIRIDOS OU PRODUZIDOS — (ANEXO II - CAPITAL)";
  r4.font = fontTitle;
  r4.alignment = { horizontal: "center" };

  // 2. Metadados da Unidade
  worksheet.getCell("A6").value = "UNIDADE EXECUTORA:";
  worksheet.getCell("A6").font = fontHeader;
  worksheet.mergeCells("B6:E6");
  worksheet.getCell("B6").value = unidade.nome || unidade.designacao || "NÃO CADASTRADO";
  worksheet.getCell("B6").font = fontBody;

  worksheet.getCell("F6").value = "CNPJ:";
  worksheet.getCell("F6").font = fontHeader;
  worksheet.mergeCells("G6:H6");
  worksheet.getCell("G6").value = unidade.cnpj || "—";
  worksheet.getCell("G6").font = fontBody;

  worksheet.getCell("A7").value = "EXERCÍCIO:";
  worksheet.getCell("A7").font = fontHeader;
  worksheet.getCell("B7").value = Number.parseInt(exercicio, 10);
  worksheet.getCell("B7").font = fontBody;

  worksheet.getCell("D7").value = "PROGRAMA:";
  worksheet.getCell("D7").font = fontHeader;
  worksheet.mergeCells("E7:F7");
  worksheet.getCell("E7").value = unidade.programa || "PDDE Básico";
  worksheet.getCell("E7").font = fontBody;

  worksheet.getCell("G7").value = "PROCESSO:";
  worksheet.getCell("G7").font = fontHeader;
  worksheet.getCell("H7").value = "—";
  worksheet.getCell("H7").font = fontBody;

  // Espaçador
  worksheet.addRow([]);

  // 3. Cabeçalho da Tabela
  const tableHeader = [
    "ITEM",
    "FORNECEDOR / EMITENTE",
    "NOTA FISCAL",
    "DATA AQUISIÇÃO",
    "DESCRIÇÃO DO BEM PERMANENTE",
    "QTD",
    "VALOR UNITÁRIO",
    "VALOR TOTAL"
  ];
  const headerRowObj = worksheet.addRow(tableHeader);
  headerRowObj.height = 24;
  headerRowObj.eachCell((cell) => {
    cell.font = fontHeader;
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0F4F8" }
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = borderHeader;
  });

  // 4. Preenchimento dos Itens
  let totalCapital = 0;
  if (items.length === 0) {
    // Caso sem itens de Capital
    worksheet.mergeCells("A10:H11");
    const emptyCell = worksheet.getCell("A10");
    emptyCell.value = "NÃO HOUVE AQUISIÇÃO DE BENS PERMANENTES (RECURSO DE CAPITAL) NESTE EXERCÍCIO FINANCEIRO.";
    emptyCell.font = { name: "Arial", size: 9, italic: true, color: { argb: "FF707070" } };
    emptyCell.alignment = { horizontal: "center", vertical: "middle" };
    
    // Aplica bordas finas na célula mesclada
    for (let r = 10; r <= 11; r++) {
      for (let c = 1; c <= 8; c++) {
        worksheet.getCell(r, c).border = borderThin;
      }
    }
  } else {
    items.forEach((item, index) => {
      const row = worksheet.addRow([
        index + 1,
        `${item.fornecedor_nome} (${item.fornecedor_cnpj})`,
        item.numero_nota,
        new Date(item.data_emissao).toLocaleDateString("pt-BR"),
        `Equipamento / Material Permanente (Adquirido via nota nº ${item.numero_nota})`,
        1,
        item.valor,
        item.valor
      ]);
      row.height = 20;
      totalCapital += item.valor;

      row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
      row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(5).alignment = { horizontal: "left", vertical: "middle" };
      row.getCell(6).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(7).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(8).alignment = { horizontal: "right", vertical: "middle" };

      // Máscara monetária
      row.getCell(7).numFmt = '"R$"#,##0.00;("R$"#,##0.00);"—"';
      row.getCell(8).numFmt = '"R$"#,##0.00;("R$"#,##0.00);"—"';

      row.eachCell((cell) => {
        cell.font = fontBody;
        cell.border = borderThin;
      });
    });
  }

  // 5. Linha de Totalizador
  const lastRowIndex = items.length === 0 ? 12 : 10 + items.length;
  worksheet.mergeCells(`A${lastRowIndex}:G${lastRowIndex}`);
  const labelTotal = worksheet.getCell(`A${lastRowIndex}`);
  labelTotal.value = "VALOR TOTAL DE RECURSOS DE CAPITAL EXECUTADOS:";
  labelTotal.font = fontHeader;
  labelTotal.alignment = { horizontal: "right", vertical: "middle" };

  const valTotal = worksheet.getCell(`H${lastRowIndex}`);
  valTotal.value = totalCapital;
  valTotal.font = fontHeader;
  valTotal.alignment = { horizontal: "right", vertical: "middle" };
  valTotal.numFmt = '"R$"#,##0.00;("R$"#,##0.00);"—"';

  // Aplica bordas no totalizador
  for (let c = 1; c <= 8; c++) {
    worksheet.getCell(lastRowIndex, c).border = {
      top: { style: "thin" as const, color: { argb: "FF000000" } },
      bottom: { style: "medium" as const, color: { argb: "FF000000" } },
      left: { style: "thin" as const, color: { argb: "FFD3D3D3" } },
      right: { style: "thin" as const, color: { argb: "FFD3D3D3" } }
    };
  }

  // 6. Bloco de Assinaturas
  const sigRow = lastRowIndex + 4;
  worksheet.mergeCells(`A${sigRow}:C${sigRow}`);
  const s1 = worksheet.getCell(`A${sigRow}`);
  s1.value = "_________________________________________";
  s1.alignment = { horizontal: "center" };
  s1.font = fontBody;

  worksheet.mergeCells(`F${sigRow}:H${sigRow}`);
  const s2 = worksheet.getCell(`F${sigRow}`);
  s2.value = "_________________________________________";
  s2.alignment = { horizontal: "center" };
  s2.font = fontBody;

  const labelsRow = sigRow + 1;
  worksheet.mergeCells(`A${labelsRow}:C${labelsRow}`);
  const l1 = worksheet.getCell(`A${labelsRow}`);
  l1.value = unidade.diretor || "DIRETOR(A) DA UNIDADE";
  l1.font = fontHeader;
  l1.alignment = { horizontal: "center" };

  worksheet.mergeCells(`F${labelsRow}:H${labelsRow}`);
  const l2 = worksheet.getCell(`F${labelsRow}`);
  l2.value = "MEMBROS DO CONSELHO FISCAL";
  l2.font = fontHeader;
  l2.alignment = { horizontal: "center" };

  // Escreve o buffer final do Excel
  const outputBuffer = await workbook.xlsx.writeBuffer();
  
  // Nome normalizado do arquivo
  const normalizeFilePart = (val: string) => {
    return val
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  };

  const fileName = [
    "Anexo_II_Relacao_Bens",
    normalizeFilePart(exercicio),
    normalizeFilePart(unidade.designacao || "UE"),
    normalizeFilePart(unidade.nome || "UE")
  ].join("_") + ".xlsx";

  return {
    blob: new Blob([outputBuffer as BlobPart], { type: XLSX_MIME_TYPE }),
    fileName
  };
}
