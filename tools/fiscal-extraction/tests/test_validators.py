from __future__ import annotations

from datetime import date
from decimal import Decimal

from fiscal_extraction.models import FiscalExtractionResult, FiscalItem, FiscalParty
from fiscal_extraction.validators import (
    calculate_confidence,
    is_valid_nfe_access_key_check_digit,
    validate_access_key,
    validate_issue_date,
    validate_money_and_items,
    validate_party,
    validate_result,
)


VALID_SUPPLIER_CNPJ = "11222333000181"
VALID_RECIPIENT_CNPJ = "04252011000110"


def make_access_key(prefix_43: str | None = None) -> str:
    base = prefix_43 or f"352605{VALID_SUPPLIER_CNPJ}55001000001234112345678"
    assert len(base) == 43
    assert base.isdigit()

    total = 0
    weights = [2, 3, 4, 5, 6, 7, 8, 9]
    for index, digit in enumerate(reversed(base)):
        total += int(digit) * weights[index % len(weights)]

    check_digit = 11 - (total % 11)
    if check_digit >= 10:
        check_digit = 0
    return f"{base}{check_digit}"


def make_valid_result(**overrides) -> FiscalExtractionResult:
    values = {
        "document_type": "NF-e",
        "document_number": "1234",
        "access_key": make_access_key(),
        "issue_date": date(2026, 5, 15),
        "supplier": FiscalParty(name="FORNECEDOR FICTICIO LTDA", cnpj=VALID_SUPPLIER_CNPJ),
        "recipient": FiscalParty(name="UNIDADE FICTICIA PDDE", cnpj=VALID_RECIPIENT_CNPJ),
        "total_value": Decimal("129.45"),
    }
    values.update(overrides)
    return FiscalExtractionResult(**values)


def test_validate_party_warning_scenarios():
    assert validate_party("emitente", None) == ["emitente: ausente"]
    assert validate_party("emitente", FiscalParty(name="FORNECEDOR FICTICIO LTDA")) == [
        "emitente: CNPJ ausente"
    ]
    assert validate_party(
        "emitente",
        FiscalParty(name="FORNECEDOR FICTICIO LTDA", cnpj="11.222.333/0001-82"),
    ) == ["emitente: CNPJ invalido"]
    assert validate_party("emitente", FiscalParty(cnpj=VALID_SUPPLIER_CNPJ)) == ["emitente: nome ausente"]
    assert validate_party(
        "emitente",
        FiscalParty(name="FORNECEDOR FICTICIO LTDA", cnpj=VALID_SUPPLIER_CNPJ),
    ) == []


def test_is_valid_nfe_access_key_check_digit():
    valid_key = make_access_key()
    invalid_digit = f"{valid_key[:-1]}{(int(valid_key[-1]) + 1) % 10}"

    assert is_valid_nfe_access_key_check_digit(valid_key)
    assert not is_valid_nfe_access_key_check_digit(invalid_digit)
    assert not is_valid_nfe_access_key_check_digit(valid_key[:-1])
    assert not is_valid_nfe_access_key_check_digit(f"{valid_key[:-1]}X")
    assert not is_valid_nfe_access_key_check_digit(None)


def test_validate_access_key_warning_scenarios():
    assert validate_access_key(FiscalExtractionResult(document_type="NF-e")) == ["chave de acesso ausente"]
    assert validate_access_key(FiscalExtractionResult(access_key="123")) == ["chave de acesso invalida"]

    valid_key = make_access_key()
    invalid_digit = f"{valid_key[:-1]}{(int(valid_key[-1]) + 1) % 10}"
    result_with_invalid_digit = make_valid_result(access_key=invalid_digit)
    assert "chave de acesso com digito verificador invalido" in validate_access_key(result_with_invalid_digit)

    result_with_wrong_supplier = make_valid_result(
        supplier=FiscalParty(name="OUTRO FORNECEDOR FICTICIO LTDA", cnpj=VALID_RECIPIENT_CNPJ)
    )
    assert "chave de acesso nao corresponde ao CNPJ do emitente" in validate_access_key(
        result_with_wrong_supplier
    )

    assert validate_access_key(make_valid_result()) == []


def test_validate_issue_date_range():
    assert validate_issue_date(FiscalExtractionResult()) == []
    assert validate_issue_date(FiscalExtractionResult(issue_date=date(2019, 12, 31))) == [
        "data de emissao fora da faixa aceita"
    ]
    assert validate_issue_date(FiscalExtractionResult(issue_date=date(date.today().year + 2, 1, 1))) == [
        "data de emissao fora da faixa aceita"
    ]
    assert validate_issue_date(FiscalExtractionResult(issue_date=date(2026, 5, 15))) == []


def test_validate_money_and_items_warning_scenarios():
    assert validate_money_and_items(FiscalExtractionResult(total_value=Decimal("0"))) == [
        "valor total nao positivo"
    ]
    assert validate_money_and_items(FiscalExtractionResult(total_value=Decimal("-1.00"))) == [
        "valor total nao positivo"
    ]

    incoherent_item = FiscalExtractionResult(
        total_value=Decimal("10.00"),
        items=[
            FiscalItem(
                quantity=Decimal("2"),
                unit_value=Decimal("5.00"),
                total_value=Decimal("9.97"),
            )
        ],
    )
    warnings = validate_money_and_items(incoherent_item)
    assert "item 1: total incoerente" in warnings

    divergent_sum = FiscalExtractionResult(
        total_value=Decimal("12.00"),
        items=[
            FiscalItem(quantity=Decimal("1"), unit_value=Decimal("5.00"), total_value=Decimal("5.00")),
            FiscalItem(quantity=Decimal("1"), unit_value=Decimal("5.00"), total_value=Decimal("5.00")),
        ],
    )
    assert "soma dos itens difere do valor total" in validate_money_and_items(divergent_sum)

    within_tolerance = FiscalExtractionResult(
        total_value=Decimal("10.02"),
        items=[FiscalItem(quantity=Decimal("2"), unit_value=Decimal("5.00"), total_value=Decimal("10.00"))],
    )
    assert validate_money_and_items(within_tolerance) == []


def test_calculate_confidence_reflects_structural_completeness():
    complete = make_valid_result()
    incomplete = FiscalExtractionResult()
    invalid_key = make_valid_result(access_key=f"{complete.access_key[:-1]}{(int(complete.access_key[-1]) + 1) % 10}")
    invalid_recipient = make_valid_result(
        recipient=FiscalParty(name="UNIDADE FICTICIA PDDE", cnpj="00.000.000/0000-00")
    )
    missing_total = make_valid_result(total_value=None)

    assert calculate_confidence(complete) == 1.0
    assert calculate_confidence(incomplete) < calculate_confidence(complete)
    assert calculate_confidence(invalid_key) < calculate_confidence(complete)
    assert calculate_confidence(invalid_recipient) < calculate_confidence(complete)
    assert calculate_confidence(missing_total) < calculate_confidence(complete)


def test_validate_result_status_and_warning_scenarios():
    missing_critical_fields = validate_result(FiscalExtractionResult())
    assert missing_critical_fields.status == "requer_revisao"
    assert "numero do documento ausente" in missing_critical_fields.warnings

    invalid_supplier = validate_result(
        make_valid_result(supplier=FiscalParty(name="FORNECEDOR FICTICIO LTDA", cnpj="11.222.333/0001-82"))
    )
    assert invalid_supplier.status == "requer_revisao"
    assert "emitente: CNPJ invalido" in invalid_supplier.warnings

    missing_total = validate_result(make_valid_result(total_value=None))
    assert missing_total.status == "requer_revisao"
    assert "valor total ausente" in missing_total.warnings

    valid = validate_result(make_valid_result())
    assert valid.status == "extraido"
    assert valid.warnings == []


def test_validate_result_deduplicates_and_sorts_warnings():
    validated = validate_result(make_valid_result(warnings=["z warning", "a warning", "z warning"]))

    assert validated.status == "extraido"
    assert validated.warnings == ["a warning", "z warning"]
