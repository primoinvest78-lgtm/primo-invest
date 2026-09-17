-- Central de Inteligência — os insights em si são calculados na hora
-- (regras determinísticas em cima dos dados já existentes nos outros
-- módulos, ver lib/intelligence/rules.ts), NUNCA armazenados como uma
-- segunda fonte de verdade. A única coisa que precisa persistir é a
-- AÇÃO humana sobre um insight (resolver / ignorar / reabrir / criar
-- tarefa a partir dele) — isso é o registro de governança pedido no
-- módulo: quem agiu, quando, e o resultado.
--
-- `insight_key` é o id determinístico do insight (ex.: "tasks:overdue-
-- <taskId>"), o mesmo em toda renderização — é o que permite achar o
-- status atual de um insight sem guardar o insight inteiro: pega o
-- último evento daquela chave.

create table if not exists public.intelligence_insight_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  insight_key text not null,
  insight_title text not null,
  source_module text not null,
  action text not null check (action = ANY (ARRAY[
    'resolved'::text, 'ignored'::text, 'reopened'::text, 'task_created'::text
  ])),
  performed_by uuid references public.profiles(id) on delete set null,
  performed_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now()
);

alter table public.intelligence_insight_events enable row level security;
drop policy if exists intelligence_insight_events_access on public.intelligence_insight_events;
create policy intelligence_insight_events_access on public.intelligence_insight_events
  for all
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

create index if not exists intelligence_insight_events_key_idx
  on public.intelligence_insight_events (organization_id, insight_key, performed_at desc);

drop trigger if exists trg_audit_intelligence_insight_events on public.intelligence_insight_events;
create trigger trg_audit_intelligence_insight_events
  after insert on public.intelligence_insight_events
  for each row execute function write_audit_log();

notify pgrst, 'reload schema';
