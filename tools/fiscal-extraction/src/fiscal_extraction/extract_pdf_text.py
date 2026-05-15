from __future__ import annotations

import re
from decimal import Decimal
from pathlib import Path

from .models import FiscalExtractionResult, FiscalParty
from .normalize import clean_text, normalize_cnpj, normalize_date, only_digits, parse_money_br
from .validators import validate_result


CNPJ_PATTERN = re.compile(r"\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}")
ACCESS_KEY_PATTERN = re.compile(r"(?:\d[\s.\-]*){44}")
DATE_PATTERN = re.compile(r"\b\d{1,2}/\d{1,2}/\d{4}\b|\b\d{4}-\d{2}-\d{2}(?:T[0-9:\-+.]+)?\b")
DOCUMENT_NUMBER_PATTERN = re.compile(
    r"(?:numero|n[uú]mero|nota fiscal|nf-e|nfe|n[ºo]\.?)\D{0,20}(\d{1,12})",
    flags=re.IGNORECASE,
)
TOTAL_PATTERN = re.compile(
    r"(?:valor\s+total(?:\s+da\s+nota)?|total\s+da\s+nota|valor\s+da\s+nota|total)\D{0,20}(R\$\s*)?([\d.,]+)",
    flags=re.IGNORECASE,
)


def extract_text_pymupdf(path: str | Path) -> str:
    import fitz

    document = fitz.open(str(path))
    try:
        return clean_text("\n".join(page.get_text("text") for page in document))
    finally:
        document.close()


def extract_text_pdfplumber(path: str | Path) -> str:
    import pdfplumber

    with pdfplumber.open(str(path)) as pdf:
        return clean_text("\n".join(page.extract_text() or "" for page in pdf.pages))


def _find_party_name(raw_text: str, labels: tuple[str, ...]) -> str | None:
    lines = clean_text(raw_text).splitlines()
    for index, line in enumerate(lines):
        if any(label.lower() in line.lower() for label in labels):
            for candidate in lines[index : index + 4]:
                match = re.search(r"(?:razao social|raz[aã]o social|nome)\s*:\s*(.+)", candidate, re.IGNORECASE)
                if match:
                    return match.group(1).strip()
    return None


def _first_decimal(matches: list[re.Match[str]]) -> Decimal | None:
    for match in matches:
        value = parse_money_br(match.group(2))
        if value is not None:
            return value
    return None


def _confidence(result: FiscalExtractionResult) -> float:
    checks = [
        result.document_number,
        result.access_key,
        result.issue_date,
        result.supplier and result.supplier.cnpj,
        result.recipient and result.recipient.cnpj,
        result.total_value is not None,
    ]
    return round(sum(1 for check in checks if check) / len(checks), 2)


def parse_fiscal_text(raw_text: str, source_file: str | Path | None = None) -> FiscalExtractionResult:
    cleaned = clean_text(raw_text)
    cnpjs = [normalize_cnpj(match.group(0)) for match in CNPJ_PATTERN.finditer(cleaned)]
    cnpjs = [cnpj for cnpj in cnpjs if cnpj]

    access_key = None
    for match in ACCESS_KEY_PATTERN.finditer(cleaned):
        candidate = only_digits(match.group(0))
        if len(candidate) == 44:
            access_key = candidate
            break

    document_number = None
    number_match = DOCUMENT_NUMBER_PATTERN.search(cleaned)
    if number_match:
        document_number = number_match.group(1).lstrip("0") or "0"

    issue_date = None
    date_match = DATE_PATTERN.search(cleaned)
    if date_match:
        issue_date = normalize_date(date_match.group(0))

    total_value = _first_decimal(list(TOTAL_PATTERN.finditer(cleaned)))

    source_path = Path(source_file) if source_file else None
    source_type = "pdf" if source_path and source_path.suffix.lower() == ".pdf" else "text"
    result = FiscalExtractionResult(
        source_file=str(source_path) if source_path else None,
        source_type=source_type,
        document_type="NF-e" if "nf-e" in cleaned.lower() or "nfe" in cleaned.lower() else None,
        document_number=document_number,
        access_key=access_key,
        issue_date=issue_date,
        supplier=FiscalParty(
            name=_find_party_name(cleaned, ("emitente", "fornecedor")),
            cnpj=cnpjs[0] if cnpjs else None,
        ),
        recipient=FiscalParty(
            name=_find_party_name(cleaned, ("destinatario", "destinatário")),
            cnpj=cnpjs[1] if len(cnpjs) > 1 else None,
        ),
        total_value=total_value,
        items=[],
        raw_text=cleaned,
        confidence=0.0,
        warnings=[],
    )

    result = result.model_copy(update={"confidence": _confidence(result)})
    return validate_result(result)
