from decimal import Decimal
from pathlib import Path

from fiscal_extraction.extract_pdf_text import parse_fiscal_text


SAMPLES = Path(__file__).resolve().parents[1] / "samples"


def test_parse_synthetic_nf_text():
    sample_path = SAMPLES / "synthetic_nf_text.txt"
    result = parse_fiscal_text(sample_path.read_text(encoding="utf-8"), source_file=sample_path)

    assert result.source_type == "manual_text"
    assert result.document_type == "NF-e"
    assert result.document_number == "1234"
    assert result.access_key == "35260511222333000181550010000012341123456789"
    assert result.issue_date.isoformat() == "2026-05-15"
    assert result.supplier.cnpj == "11222333000181"
    assert result.supplier.name == "ALFA MATERIAIS PEDAGOGICOS LTDA"
    assert result.recipient.cnpj == "04252011000110"
    assert result.recipient.name == "ESCOLA MUNICIPAL TESTE PDDE"
    assert result.total_value == Decimal("1234.56")
    assert result.confidence == 1.0
    assert result.status == "extraido"
    assert result.warnings == []


def test_parse_pdf_text_source_type_without_pdf_binary():
    result = parse_fiscal_text(
        (SAMPLES / "synthetic_nf_text.txt").read_text(encoding="utf-8"),
        source_file="synthetic.local.pdf",
    )

    assert result.source_type == "pdf_text"


def test_parse_incomplete_text_requires_review():
    raw_text = """
    NOTA FISCAL ELETRONICA - NF-e
    Emitente / Fornecedor
    Razao Social: FORNECEDOR FICTICIO INVALIDO LTDA
    CNPJ: 11.222.333/0001-82
    Destinatario
    CNPJ: 00.000.000/0000-00
    Data de Emissao: 15/05/2026
    """

    result = parse_fiscal_text(raw_text, source_file="incomplete.local.txt")

    assert result.source_type == "manual_text"
    assert result.status == "requer_revisao"
    assert result.confidence < 0.5
    assert "emitente: CNPJ invalido" in result.warnings
    assert "destinatario: CNPJ invalido" in result.warnings
    assert "numero do documento ausente" in result.warnings
    assert "valor total ausente" in result.warnings


def test_parse_missing_cnpj_warns_and_requires_review():
    raw_text = """
    Nota Fiscal
    Emitente / Fornecedor
    Razao Social: FORNECEDOR FICTICIO SEM CNPJ LTDA
    Numero da Nota: 4321
    Data de Emissao: 15/05/2026
    Valor Total da Nota: R$ 10,00
    """

    result = parse_fiscal_text(raw_text, source_file="missing-cnpj.local.txt")

    assert result.status == "requer_revisao"
    assert "emitente: CNPJ ausente" in result.warnings
