-- Centro de Integrações — ESTENDE a infraestrutura que já existia no
-- banco (`integration_connections` e `integration_sync_runs`, ambas
-- vazias, sem uso em nenhuma tela ainda), em vez de criar um esquema
-- paralelo. É a regra do próprio módulo: "não criar bancos paralelos
-- nem dados duplicados".
--
-- REGRA ABSOLUTA: nenhuma integração aqui é funcional de verdade — não
-- existe conector real pra Open Finance, B3, bancos etc. Estas tabelas
-- guardam o CADASTRO administrativo (o que a organização pretende /
-- já conectou por fora) e o HISTÓRICO real de tentativas de
-- sincronização — que hoje sempre resolvem como 'not_available',
-- porque o job/serviço externo não existe ainda.

-- ────────────────────────────────────────────────────────────────
-- integration_connections — campos administrativos que faltavam
-- ────────────────────────────────────────────────────────────────
alter table public.integration_connections
  add column if not exists environment text check (environment = ANY (ARRAY['sandbox'::text, 'production'::text])),
  add column if not exists sync_frequency text not null default 'manual' check (sync_frequency = ANY (ARRAY[
    'manual'::text, 'hourly'::text, 'daily'::text, 'weekly'::text
  ])),
  add column if not exists has_credentials boolean not null default false,
  add column if not exists next_sync_at timestamptz,
  add column if not exists activated_at timestamptz,
  add column if not exists activated_by uuid references public.profiles(id) on delete set null,
  add column if not exists responsible_id uuid references public.profiles(id) on delete set null,
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

-- 'not_configured' é o estado inicial do catálogo (a linha existe,
-- nada foi configurado ainda) — os valores antigos (active/inactive/
-- error/revoked) continuam válidos, isto só amplia o conjunto.
alter table public.integration_connections drop constraint if exists integration_connections_status_check;
alter table public.integration_connections add constraint integration_connections_status_check
  check (status = ANY (ARRAY['not_configured'::text, 'active'::text, 'inactive'::text, 'error'::text, 'revoked'::text]));
alter table public.integration_connections alter column status set default 'not_configured';

-- Necessário pro upsert idempotente do catálogo (um item por
-- organização) via ON CONFLICT (organization_id, provider).
create unique index if not exists integration_connections_org_provider_idx
  on public.integration_connections (organization_id, provider);

drop trigger if exists trg_audit_integration_connections on public.integration_connections;
create trigger trg_audit_integration_connections
  after insert or update or delete on public.integration_connections
  for each row execute function write_audit_log();

-- ────────────────────────────────────────────────────────────────
-- integration_sync_runs — quem disparou + status honesto de "não há
-- conector real" + policies de escrita (só existia SELECT)
-- ────────────────────────────────────────────────────────────────
alter table public.integration_sync_runs
  add column if not exists triggered_by text not null default 'manual' check (triggered_by = ANY (ARRAY[
    'manual'::text, 'scheduled'::text, 'system'::text
  ])),
  add column if not exists triggered_by_user uuid references public.profiles(id) on delete set null;

alter table public.integration_sync_runs drop constraint if exists integration_sync_runs_status_check;
alter table public.integration_sync_runs add constraint integration_sync_runs_status_check
  check (status = ANY (ARRAY[
    'started'::text, 'running'::text, 'completed'::text, 'failed'::text, 'cancelled'::text, 'not_available'::text
  ]));

-- A policy existente só cobria SELECT; "Testar conexão" e "Sincronizar
-- agora" gravam uma execução real no histórico e precisam de INSERT.
drop policy if exists integration_sync_runs_insert on public.integration_sync_runs;
create policy integration_sync_runs_insert on public.integration_sync_runs
  for insert
  with check (is_org_member(organization_id) and has_org_role(organization_id, ARRAY['admin'::app_role, 'manager'::app_role, 'operations'::app_role]));

-- ────────────────────────────────────────────────────────────────
-- integration_alerts — tabela nova. Mesma fronteira de acesso das
-- duas tabelas acima (admin/manager/operations), porque é a mesma
-- área sensível.
-- ────────────────────────────────────────────────────────────────
create table if not exists public.integration_alerts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  connection_id uuid not null references public.integration_connections(id) on delete cascade,
  alert_type text not null check (alert_type = ANY (ARRAY[
    'disconnected'::text, 'sync_failed'::text, 'credential_expired'::text,
    'stale_data'::text, 'recurring_error'::text, 'inactive'::text
  ])),
  severity text not null default 'warning' check (severity = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text])),
  message text not null,
  status text not null default 'open' check (status = ANY (ARRAY['open'::text, 'acknowledged'::text, 'resolved'::text])),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.integration_alerts enable row level security;
drop policy if exists integration_alerts_access on public.integration_alerts;
create policy integration_alerts_access on public.integration_alerts
  for all
  using (is_org_member(organization_id) and has_org_role(organization_id, ARRAY['admin'::app_role, 'manager'::app_role, 'operations'::app_role]))
  with check (is_org_member(organization_id) and has_org_role(organization_id, ARRAY['admin'::app_role, 'manager'::app_role, 'operations'::app_role]));

drop trigger if exists trg_audit_integration_alerts on public.integration_alerts;
create trigger trg_audit_integration_alerts
  after insert or update or delete on public.integration_alerts
  for each row execute function write_audit_log();

create index if not exists integration_alerts_connection_idx
  on public.integration_alerts (connection_id, status);

-- ────────────────────────────────────────────────────────────────
-- integration_field_mappings — tabela nova. Origem -> destino, vazia
-- até alguém cadastrar uma correspondência manualmente.
-- ────────────────────────────────────────────────────────────────
create table if not exists public.integration_field_mappings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  connection_id uuid not null references public.integration_connections(id) on delete cascade,
  source_entity text not null,
  source_field text not null,
  target_entity text not null,
  target_field text not null,
  status text not null default 'pending' check (status = ANY (ARRAY['mapped'::text, 'pending'::text, 'conflict'::text])),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.integration_field_mappings enable row level security;
drop policy if exists integration_field_mappings_access on public.integration_field_mappings;
create policy integration_field_mappings_access on public.integration_field_mappings
  for all
  using (is_org_member(organization_id) and has_org_role(organization_id, ARRAY['admin'::app_role, 'manager'::app_role, 'operations'::app_role]))
  with check (is_org_member(organization_id) and has_org_role(organization_id, ARRAY['admin'::app_role, 'manager'::app_role, 'operations'::app_role]));

drop trigger if exists trg_integration_field_mappings_updated_at on public.integration_field_mappings;
create trigger trg_integration_field_mappings_updated_at
  before update on public.integration_field_mappings
  for each row execute function set_updated_at();

drop trigger if exists trg_audit_integration_field_mappings on public.integration_field_mappings;
create trigger trg_audit_integration_field_mappings
  after insert or update or delete on public.integration_field_mappings
  for each row execute function write_audit_log();

notify pgrst, 'reload schema';
