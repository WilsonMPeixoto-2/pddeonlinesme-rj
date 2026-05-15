from decimal import Decimal
from pathlib import Path

from fiscal_extraction.extract_pdf_text import parse_fiscal_text


SAMPLES = Path(__file__).resolve().parents[1] / "samples"


def test_parse_synthetic_nf_text():
    sample_path = SAMPLES / "synthetic_nf_text.txt"
    result = parse_fiscal_text(sample_path.read_text(encoding="utf-8"), source_file=sample_path)

    assert result.source_type == "text"
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
    assert result.warnings == []
