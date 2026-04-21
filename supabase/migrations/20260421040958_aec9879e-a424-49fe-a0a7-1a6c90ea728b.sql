-- Roles enum + table (separate, to avoid privilege escalation)
create type public.app_role as enum ('admin', 'operador');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users read own roles"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id);

-- Unidades escolares
create table public.unidades_escolares (
  id uuid primary key default gen_random_uuid(),
  designacao text not null,
  inep text,
  cnpj text,
  diretor text,
  email text,
  alunos integer not null default 0,
  saldo_anterior numeric(12,2) not null default 0,
  recebido numeric(12,2) not null default 0,
  gasto numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.unidades_escolares enable row level security;

create policy "Authenticated can read unidades"
on public.unidades_escolares for select
to authenticated
using (true);

create policy "Authenticated can insert unidades"
on public.unidades_escolares for insert
to authenticated
with check (true);

create policy "Authenticated can update unidades"
on public.unidades_escolares for update
to authenticated
using (true);

create policy "Admins can delete unidades"
on public.unidades_escolares for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_unidades_updated_at
before update on public.unidades_escolares
for each row execute function public.set_updated_at();