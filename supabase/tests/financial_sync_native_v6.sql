begin;

select plan(10);

select ok(
  to_regprocedure('public.evaluate_second_cycle_payment_v1(jsonb)') is not null,
  'avaliador canonico do segundo ciclo existe'
);

select is(
  (
    public.evaluate_second_cycle_payment_v1(
      jsonb_build_object(
        'exercise', 2026,
        'repasses', jsonb_build_array(
          jsonb_build_object(
            'inep', '33000001',
            'exercise', 2026,
            'program', 'PDDE BÁSICO',
            'action', 'PDDE Básico',
            'installment', '2ª Parcela',
            'paid', 100,
            'paymentDate', null,
            'paymentOrderDate', '2026-09-17'
          )
        )
      )
    )->>'qualityStatus'
  ),
  'VALIDATED',
  'uma ordem oficial valida e parcial e VALIDATED, nao rejeitada'
);

select is(
  (
    public.evaluate_second_cycle_payment_v1(
      jsonb_build_object(
        'exercise', 2026,
        'repasses', jsonb_build_array(
          jsonb_build_object(
            'inep', '33000001',
            'exercise', 2026,
            'program', 'PDDE BÁSICO',
            'action', 'PDDE Básico',
            'installment', '2ª Parcela',
            'paid', 100,
            'paymentDate', null,
            'paymentOrderDate', '2026-09-17'
          )
        )
      )
    )->>'publicationStatus'
  ),
  'PUBLISHED',
  'cobertura parcial valida e publicavel'
);

select is(
  (
    public.evaluate_second_cycle_payment_v1(
      jsonb_build_object(
        'exercise', 2026,
        'repasses', jsonb_build_array(
          jsonb_build_object(
            'inep', '33000001',
            'exercise', 2026,
            'program', 'PDDE BÁSICO',
            'action', 'PDDE Básico',
            'installment', '2ª Parcela',
            'paid', 100,
            'paymentDate', null,
            'paymentOrderDate', '2026-09-17'
          )
        )
      )
    )->>'coverageObserved'
  ),
  '1',
  'cobertura parcial e contabilizada sem exigir 163'
);

with payload as (
  select jsonb_build_object(
    'exercise', 2026,
    'repasses', jsonb_agg(
      jsonb_build_object(
        'inep', lpad(gs::text, 8, '0'),
        'exercise', 2026,
        'program', 'PDDE BÁSICO',
        'action', 'PDDE Básico',
        'installment', '2ª Parcela',
        'paid', 100,
        'paymentDate', '2026-09-17',
        'paymentOrderDate', null
      )
    )
  ) as body
  from generate_series(1, 163) as gs
)
select is(
  (public.evaluate_second_cycle_payment_v1(body)->>'qualityStatus'),
  'MATURE',
  '163/163 promove a dimensao para MATURE'
)
from payload;

select ok(
  to_regprocedure('public.publish_financial_snapshot_with_order_evidence_v2(jsonb)') is not null,
  'RPC v2 de publicacao existe'
);

select ok(
  has_function_privilege('service_role', 'public.publish_financial_snapshot_with_order_evidence_v2(jsonb)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.publish_financial_snapshot_with_order_evidence_v2(jsonb)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.publish_financial_snapshot_with_order_evidence_v2(jsonb)', 'EXECUTE'),
  'publicacao continua exclusiva do service_role'
);

select ok(
  to_regclass('public.financial_sync_attempts') is not null,
  'tentativas reais de sincronizacao ficam auditaveis'
);

select ok(
  to_regprocedure('public.get_financial_sync_health_v1()') is not null
  and has_function_privilege('authenticated', 'public.get_financial_sync_health_v1()', 'EXECUTE'),
  'usuarios autenticados podem consultar somente a saude operacional'
);

select ok(
  exists(select 1 from pg_extension where extname = 'pg_cron')
  and exists(select 1 from pg_extension where extname = 'pg_net'),
  'agendamento e HTTP nativos do Supabase estao habilitados'
);

select * from finish();
rollback;
