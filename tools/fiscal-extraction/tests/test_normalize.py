from decimal import Decimal

from fiscal_extraction.normalize import (
    clean_text,
    is_valid_cnpj,
    normalize_cnpj,
    normalize_date,
    only_digits,
    parse_money_br,
)


def test_only_digits_and_cnpj_normalization():
    assert only_digits("CNPJ 11.222.333/0001-81") == "11222333000181"
    assert normalize_cnpj("11.222.333/0001-81") == "11222333000181"
    assert normalize_cnpj("123") is None


def test_cnpj_check_digits():
    assert is_valid_cnpj("11.222.333/0001-81")
    assert is_valid_cnpj("04.252.011/0001-10")
    assert not is_valid_cnpj("11.222.333/0001-82")
    assert not is_valid_cnpj("00.000.000/0000-00")


def test_parse_money_br_variants():
    assert parse_money_br("R$ 1.234,56") == Decimal("1234.56")
    assert parse_money_br("1.234,56") == Decimal("1234.56")
    assert parse_money_br("1234,56") == Decimal("1234.56")
    assert parse_money_br("1234.56") == Decimal("1234.56")


def test_normalize_date_and_clean_text():
    assert normalize_date("15/05/2026").isoformat() == "2026-05-15"
    assert normalize_date("2026-05-15T10:30:00-03:00").isoformat() == "2026-05-15"
    assert clean_text("  A   B  \n\n C\tD ") == "A B\nC D"
