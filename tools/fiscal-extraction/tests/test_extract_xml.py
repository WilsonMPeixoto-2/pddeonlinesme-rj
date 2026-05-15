from decimal import Decimal
from pathlib import Path

from fiscal_extraction.extract_xml import extract_from_xml


SAMPLES = Path(__file__).resolve().parents[1] / "samples"


def test_extract_from_synthetic_nfe_xml():
    result = extract_from_xml(SAMPLES / "synthetic_nfe.xml")

    assert result.source_type == "xml"
    assert result.document_type == "NF-e"
    assert result.document_number == "1234"
    assert result.access_key == "35260511222333000181550010000012341123456789"
    assert result.issue_date.isoformat() == "2026-05-15"
    assert result.supplier.cnpj == "11222333000181"
    assert result.supplier.name == "ALFA MATERIAIS PEDAGOGICOS LTDA"
    assert result.recipient.cnpj == "04252011000110"
    assert result.total_value == Decimal("1234.56")
    assert len(result.items) == 2
    assert result.items[0].description == "Caderno universitario"
    assert result.confidence == 1.0
    assert result.warnings == []
