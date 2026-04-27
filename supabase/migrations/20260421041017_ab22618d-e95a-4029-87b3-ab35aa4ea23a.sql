-- Fix search_path on trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Restrict insert/update to admin OR operador
drop policy "Authenticated can insert unidades" on public.unidades_escolares;
drop policy "Authenticated can update unidades" on public.unidades_escolares;

create policy "Team can insert unidades"
on public.unidades_escolares for insert
to authenticated
with check (
  public.has_role(auth.uid(), 'admin')
  or public.has_role(auth.uid(), 'operador')
);

create policy "Team can update unidades"
on public.unidades_escolares for update
to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or public.has_role(auth.uid(), 'operador')
)
with check (
  public.has_role(auth.uid(), 'admin')
  or public.has_role(auth.uid(), 'operador')
);