from __future__ import annotations

import json
from pathlib import Path
from typing import Annotated

import typer
from rich.console import Console
from rich.table import Table

from .extract_pdf_text import extract_text_pdfplumber, extract_text_pymupdf, parse_fiscal_text
from .extract_xml import extract_from_xml
from .models import FiscalExtractionResult

app = typer.Typer(help="Local fiscal document extraction POC.")
console = Console()


def _result_to_json(result: FiscalExtractionResult) -> str:
    return json.dumps(result.model_dump(mode="json"), ensure_ascii=False, indent=2)


def _print_table(result: FiscalExtractionResult) -> None:
    table = Table(title="Fiscal extraction result")
    table.add_column("Campo")
    table.add_column("Valor")

    table.add_row("arquivo", result.source_file or "")
    table.add_row("tipo_origem", result.source_type)
    table.add_row("tipo_documento", result.document_type or "")
    table.add_row("numero", result.document_number or "")
    table.add_row("chave_acesso", result.access_key or "")
    table.add_row("data_emissao", result.issue_date.isoformat() if result.issue_date else "")
    table.add_row("cnpj_emitente", result.supplier.cnpj if result.supplier and result.supplier.cnpj else "")
    table.add_row("emitente", result.supplier.name if result.supplier and result.supplier.name else "")
    table.add_row("cnpj_destinatario", result.recipient.cnpj if result.recipient and result.recipient.cnpj else "")
    table.add_row("destinatario", result.recipient.name if result.recipient and result.recipient.name else "")
    table.add_row("valor_total", str(result.total_value) if result.total_value is not None else "")
    table.add_row("itens", str(len(result.items)))
    table.add_row("confidence", str(result.confidence))
    table.add_row("warnings", "; ".join(result.warnings))
    console.print(table)


def _extract(path: Path) -> FiscalExtractionResult:
    suffix = path.suffix.lower()
    if suffix == ".xml":
        return extract_from_xml(path)
    if suffix == ".pdf":
        try:
            raw_text = extract_text_pymupdf(path)
        except Exception as exc:
            console.print(f"[yellow]PyMuPDF falhou, tentando pdfplumber: {exc}[/yellow]", stderr=True)
            raw_text = extract_text_pdfplumber(path)
        return parse_fiscal_text(raw_text, source_file=path)
    if suffix == ".txt":
        return parse_fiscal_text(path.read_text(encoding="utf-8"), source_file=path)
    raise typer.BadParameter(f"Extensao nao suportada: {path.suffix}")


@app.command()
def extract(
    file_path: Annotated[Path, typer.Argument(exists=True, readable=True, dir_okay=False)],
    output: Annotated[str, typer.Option("--output", "-o", help="json ou table")] = "json",
) -> None:
    """Extract structured suggestions from one XML, PDF or text file."""

    result = _extract(file_path)
    if output == "json":
        console.print(_result_to_json(result))
    elif output == "table":
        _print_table(result)
    else:
        raise typer.BadParameter("Formato de saida deve ser json ou table")


@app.command("inspect-text")
def inspect_text(file_path: Annotated[Path, typer.Argument(exists=True, readable=True, dir_okay=False)]) -> None:
    """Print raw text extracted from a PDF or text file."""

    suffix = file_path.suffix.lower()
    if suffix == ".pdf":
        try:
            console.print(extract_text_pymupdf(file_path))
        except Exception as exc:
            console.print(f"[yellow]PyMuPDF falhou, tentando pdfplumber: {exc}[/yellow]", stderr=True)
            console.print(extract_text_pdfplumber(file_path))
    elif suffix == ".txt":
        console.print(file_path.read_text(encoding="utf-8"))
    else:
        raise typer.BadParameter("inspect-text aceita apenas .pdf ou .txt")


@app.command()
def batch(directory: Annotated[Path, typer.Argument(exists=True, readable=True, file_okay=False)]) -> None:
    """Run extraction over supported files in a local directory."""

    table = Table(title=f"Fiscal extraction batch: {directory}")
    table.add_column("arquivo")
    table.add_column("tipo")
    table.add_column("numero")
    table.add_column("cnpj_emitente")
    table.add_column("valor_total")
    table.add_column("confidence")
    table.add_column("warnings")

    for file_path in sorted(directory.iterdir()):
        if file_path.suffix.lower() not in {".xml", ".pdf", ".txt"}:
            continue
        try:
            result = _extract(file_path)
            table.add_row(
                file_path.name,
                result.source_type,
                result.document_number or "",
                result.supplier.cnpj if result.supplier and result.supplier.cnpj else "",
                str(result.total_value) if result.total_value is not None else "",
                str(result.confidence),
                str(len(result.warnings)),
            )
        except Exception as exc:
            table.add_row(file_path.name, "erro", "", "", "", "0", str(exc))

    console.print(table)


if __name__ == "__main__":
    app()
