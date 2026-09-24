begin;

select plan(5);

select ok(
  coalesce(
    (
      select (requirements->>'requires_payment_or_order_date')::boolean
      from public.financial_dimension_contracts
      where exercise = 2026
        and dimension_key = 'pdde_basic_second_installment_payment_informed'
    ),
    false
  )
  and not coalesce(
    (
      select (requirements->>'requires_payment_date')::boolean
      from public.financial_dimension_contracts
      where exercise = 2026
        and dimension_key = 'pdde_basic_second_installment_payment_informed'
    ),
    false
  ),
  'contrato v6 aceita data de pagamento ou data oficial da ordem'
);

select ok(
  to_regprocedure('public.publish_financial_snapshot_with_order_evidence_v2(jsonb)') is not null,
  'RPC v2 de publicacao financeira existe'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.publish_financial_snapshot_with_order_evidence_v2(jsonb)',
    'EXECUTE'
  ),
  'usuario autenticado nao pode publicar pela RPC v2'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.publish_financial_snapshot_with_order_evidence_v2(jsonb)',
    'EXECUTE'
  ),
  'service_role pode publicar pela RPC v2'
);

select is(
  (
    public.evaluate_second_cycle_payment_v1(
      '{
        "exercise": 2026,
        "repasses": [
          {
            "inep": "33000001",
            "exercise": 2026,
            "program": "PDDE BÁSICO",
            "action": "PDDE Básico",
            "installment": "2ª Parcela",
            "displayOrder": 2,
            "programmed": 5000,
            "paid": 5000,
            "paymentDate": null,
            "paymentOrderDate": "2026-09-17"
          }
        ]
      }'::jsonb
    )->>'qualityStatus'
  ),
  'VALIDATED',
  'ordem oficial com valor e fato parcial valido; 163/163 define maturidade, nao existencia'
);

select * from finish();
rollback;
