-- Evolui o módulo de Oportunidades: pipeline de 7 etapas, campos
-- adicionais (produto, origem, prioridade, probabilidade), data real
-- de fechamento, e histórico automático de mudança de etapa/valor.

-- Pipeline: soma "Reunião" (entre Qualificação e Proposta) e renomeia
-- "Prospecção" -> "Identificada", mantendo a stage_key interna estável
-- (código já depende de stage_key='ganha'/'perdida').
update public.opportunity_stages set name = 'Identificada' where stage_key = 'prospeccao';
update public.opportunity_stages set position = position + 1
  where stage_key in ('proposta', 'negociacao', 'ganha', 'perdida');

insert into public.opportunity_stages (organization_id, name, stage_key, position, probability, is_active)
select qs.organization_id, 'Reunião', 'reuniao', 3, 40, true
from public.opportunity_stages qs
where qs.stage_key = 'qualificacao'
  and not exists (
    select 1 from public.opportunity_stages r
    where r.organization_id = qs.organization_id and r.stage_key = 'reuniao'
  );

create or replace function public.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.opportunity_stages (organization_id, name, stage_key, position, probability, is_active)
  values
    (new.id, 'Identificada', 'prospeccao', 1, 10, true),
    (new.id, 'Qualificação', 'qualificacao', 2, 30, true),
    (new.id, 'Reunião', 'reuniao', 3, 40, true),
    (new.id, 'Proposta', 'proposta', 4, 50, true),
    (new.id, 'Negociação', 'negociacao', 5, 75, true),
    (new.id, 'Ganha', 'ganha', 6, 100, true),
    (new.id, 'Perdida', 'perdida', 7, 0, true);

  return new;
end;
$$;

-- Campos adicionais da oportunidade.
alter table public.opportunities add column product text;
alter table public.opportunities add column source text;
alter table public.opportunities add column priority text not null default 'normal';
alter table public.opportunities add column probability numeric;
alter table public.opportunities add column closed_at timestamptz;

alter table public.opportunities add constraint opportunities_priority_check
  check (priority = any (array['low', 'normal', 'high', 'urgent']));

-- Data real de fechamento (won/lost), preenchida automaticamente —
-- não depende da aplicação lembrar de setar.
create or replace function public.set_opportunity_closed_at()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.status in ('won', 'lost') and old.status not in ('won', 'lost') then
    new.closed_at := now();
  elsif new.status = 'open' and old.status in ('won', 'lost') then
    new.closed_at := null;
  end if;
  return new;
end;
$$;

create trigger trg_opportunity_closed_at
  before update on public.opportunities
  for each row execute function public.set_opportunity_closed_at();

-- Histórico automático de mudança de etapa e de valor — mesmo padrão
-- do lead_status_history (tabela própria, não o audit_log genérico,
-- porque qualquer membro da org precisa ver a timeline).
create table public.opportunity_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  opportunity_id uuid not null references public.opportunities(id),
  event_type text not null,
  from_value text,
  to_value text,
  changed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index opportunity_history_opp_idx on public.opportunity_history(opportunity_id, created_at desc);

alter table public.opportunity_history enable row level security;

create policy opportunity_history_org_access on public.opportunity_history
  for all
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

create or replace function public.log_opportunity_changes()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_old_stage_name text;
  v_new_stage_name text;
begin
  if new.stage_id is distinct from old.stage_id then
    select name into v_old_stage_name from public.opportunity_stages where id = old.stage_id;
    select name into v_new_stage_name from public.opportunity_stages where id = new.stage_id;
    insert into public.opportunity_history (organization_id, opportunity_id, event_type, from_value, to_value, changed_by)
    values (new.organization_id, new.id, 'stage_change', v_old_stage_name, v_new_stage_name, auth.uid());
  end if;

  if new.estimated_value is distinct from old.estimated_value then
    insert into public.opportunity_history (organization_id, opportunity_id, event_type, from_value, to_value, changed_by)
    values (new.organization_id, new.id, 'value_change', old.estimated_value::text, new.estimated_value::text, auth.uid());
  end if;

  return new;
end;
$$;

create trigger trg_opportunity_history
  after update on public.opportunities
  for each row execute function public.log_opportunity_changes();
