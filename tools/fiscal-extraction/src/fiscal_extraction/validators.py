from __future__ import annotations

from .models import FiscalExtractionResult, FiscalParty
from .normalize import is_valid_cnpj

CRITICAL_WARNING_FRAGMENTS = (
    "emitente: ausente",
    "destinatario: ausente",
    "CNPJ ausente",
    "CNPJ invalido",
    "numero do documento ausente",
    "data de emissao ausente",
    "valor total ausente",
)


def validate_party(label: str, party: FiscalParty | None) -> list[str]:
    if not party:
        return [f"{label}: ausente"]

    warnings: list[str] = []
    if not party.cnpj:
        warnings.append(f"{label}: CNPJ ausente")
    elif not is_valid_cnpj(party.cnpj):
        warnings.append(f"{label}: CNPJ invalido")
    if not party.name:
        warnings.append(f"{label}: nome ausente")
    return warnings


def calculate_confidence(result: FiscalExtractionResult) -> float:
    checks: list[bool] = [
        bool(result.supplier and result.supplier.cnpj and is_valid_cnpj(result.supplier.cnpj)),
        bool(result.document_number),
        bool(result.issue_date),
        bool(result.total_value is not None and result.total_value > 0),
        bool(result.supplier and result.supplier.name),
    ]

    if result.recipient and result.recipient.cnpj:
        checks.append(is_valid_cnpj(result.recipient.cnpj))
    elif result.recipient:
        checks.append(False)

    if result.document_type == "NF-e" or result.access_key:
        checks.append(bool(result.access_key and len(result.access_key) == 44 and result.access_key.isdigit()))

    return round(sum(1 for check in checks if check) / len(checks), 2)


def has_critical_warnings(warnings: list[str]) -> bool:
    return any(fragment in warning for warning in warnings for fragment in CRITICAL_WARNING_FRAGMENTS)


def validate_result(result: FiscalExtractionResult) -> FiscalExtractionResult:
    warnings = list(result.warnings)
    warnings.extend(validate_party("emitente", result.supplier))
    warnings.extend(validate_party("destinatario", result.recipient))

    if not result.document_number:
        warnings.append("numero do documento ausente")
    if not result.issue_date:
        warnings.append("data de emissao ausente")
    if result.total_value is None:
        warnings.append("valor total ausente")

    warnings = sorted(set(warnings))
    status = "requer_revisao" if has_critical_warnings(warnings) else "extraido"
    return result.model_copy(update={"confidence": calculate_confidence(result), "status": status, "warnings": warnings})
