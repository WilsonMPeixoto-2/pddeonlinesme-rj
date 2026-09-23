begin;

select plan(5);

select ok(
  coalesce(
    (
      select (requirements->>'requires_payment_date')::boolean
      from public.financial_dimension_contracts
      where exercise = 2026
        and dimension_key = 'pdde_basic_second_installment_payment_informed'
    ),
    false
  ),
  'contrato do segundo ciclo exige paymentDate'
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

select throws_ok(
  $$select public.publish_financial_snapshot_with_order_evidence_v2(
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
  )$$,
  '22023',
  'dimensao pdde_basic_second_installment_payment_informed imatura: 0/163 pagamentos com data oficial',
  'ordem sem paymentDate nao matura pagamento do segundo ciclo'
);

select * from finish();
rollback;
