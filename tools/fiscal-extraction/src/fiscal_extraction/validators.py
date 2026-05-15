from __future__ import annotations

from .models import FiscalExtractionResult, FiscalParty
from .normalize import is_valid_cnpj


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

    return result.model_copy(update={"warnings": sorted(set(warnings))})
