from __future__ import annotations

from datetime import date
from decimal import Decimal

from .models import FiscalExtractionResult, FiscalParty
from .normalize import is_valid_cnpj

CRITICAL_WARNING_FRAGMENTS = (
    "emitente: ausente",
    "destinatario: ausente",
    "CNPJ ausente",
    "CNPJ invalido",
    "chave de acesso",
    "data de emissao fora da faixa aceita",
    "soma dos itens difere do valor total",
    "numero do documento ausente",
    "data de emissao ausente",
    "valor total ausente",
    "valor total nao positivo",
    "total incoerente",
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


def is_valid_nfe_access_key_check_digit(access_key: str | None) -> bool:
    if not access_key or len(access_key) != 44 or not access_key.isdigit():
        return False

    total = 0
    weights = [2, 3, 4, 5, 6, 7, 8, 9]
    for index, digit in enumerate(reversed(access_key[:43])):
        total += int(digit) * weights[index % len(weights)]

    check_digit = 11 - (total % 11)
    if check_digit >= 10:
        check_digit = 0
    return int(access_key[-1]) == check_digit


def validate_access_key(result: FiscalExtractionResult) -> list[str]:
    if not result.access_key:
        if result.document_type == "NF-e":
            return ["chave de acesso ausente"]
        return []

    warnings: list[str] = []
    if len(result.access_key) != 44 or not result.access_key.isdigit():
        return ["chave de acesso invalida"]

    if not is_valid_nfe_access_key_check_digit(result.access_key):
        warnings.append("chave de acesso com digito verificador invalido")

    if result.supplier and result.supplier.cnpj and result.access_key[6:20] != result.supplier.cnpj:
        warnings.append("chave de acesso nao corresponde ao CNPJ do emitente")

    return warnings


def validate_issue_date(result: FiscalExtractionResult) -> list[str]:
    if not result.issue_date:
        return []

    minimum = date(2020, 1, 1)
    maximum = date(date.today().year + 1, 12, 31)
    if result.issue_date < minimum or result.issue_date > maximum:
        return ["data de emissao fora da faixa aceita"]
    return []


def validate_money_and_items(result: FiscalExtractionResult) -> list[str]:
    warnings: list[str] = []
    tolerance = Decimal("0.02")

    if result.total_value is not None and result.total_value <= 0:
        warnings.append("valor total nao positivo")

    item_totals = []
    for index, item in enumerate(result.items, start=1):
        if item.total_value is not None:
            item_totals.append(item.total_value)
        if item.quantity is None or item.unit_value is None or item.total_value is None:
            continue
        expected_total = item.quantity * item.unit_value
        if abs(expected_total - item.total_value) > tolerance:
            warnings.append(f"item {index}: total incoerente")

    if result.total_value is not None and item_totals and len(item_totals) == len(result.items):
        if abs(sum(item_totals, Decimal("0")) - result.total_value) > tolerance:
            warnings.append("soma dos itens difere do valor total")

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
        checks.append(is_valid_nfe_access_key_check_digit(result.access_key))

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
    warnings.extend(validate_access_key(result))
    warnings.extend(validate_issue_date(result))
    warnings.extend(validate_money_and_items(result))

    warnings = sorted(set(warnings))
    status = "requer_revisao" if has_critical_warnings(warnings) else "extraido"
    return result.model_copy(update={"confidence": calculate_confidence(result), "status": status, "warnings": warnings})
