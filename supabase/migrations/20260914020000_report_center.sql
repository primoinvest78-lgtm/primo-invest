-- Report Center: histórico de relatórios gerados, compartilhamento e
-- templates reutilizáveis. Aditivo — tabelas novas com FKs simples
-- (nenhum segundo caminho de relacionamento pra uma tabela já
-- embutida em outro lugar).

-- payload guarda um SNAPSHOT dos dados calculados no momento da
-- geração (mesmas funções que alimentam o resto da plataforma) —
-- garante que reabrir um relatório antigo mostre exatamente o que foi
-- gerado então, mesmo que os dados atuais tenham mudado depois
-- (rastreabilidade/auditoria).
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type text not null check (type = ANY (ARRAY['patrimonial'::text, 'investimentos'::text, 'cliente'::text, 'consorcios'::text, 'operacional'::text, 'executivo'::text])),
  title text not null,
  client_id uuid references public.clients(id) on delete set null,
  period_start date,
  period_end date,
  sections text[] not null default '{}',
  parameters jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'gerado' check (status = ANY (ARRAY['gerado'::text, 'agendado'::text, 'falhou'::text])),
  schedule jsonb,
  version integer not null default 1,
  view_count integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reports enable row level security;
drop policy if exists reports_org_access on public.reports;
create policy reports_org_access on public.reports
  for all using (is_org_member(organization_id)) with check (is_org_member(organization_id));

drop trigger if exists trg_reports_updated_at on public.reports;
create trigger trg_reports_updated_at
  before update on public.reports
  for each row execute function set_updated_at();

drop trigger if exists trg_audit_reports on public.reports;
create trigger trg_audit_reports
  after insert or update or delete on public.reports
  for each row execute function write_audit_log();

create table if not exists public.report_shares (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  shared_with_type text not null check (shared_with_type = ANY (ARRAY['advisor'::text, 'team'::text, 'client'::text, 'administrator'::text, 'third_party'::text])),
  shared_with_name text,
  can_download boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.report_shares enable row level security;
drop policy if exists report_shares_org_access on public.report_shares;
create policy report_shares_org_access on public.report_shares
  for all using (is_org_member(organization_id)) with check (is_org_member(organization_id));

create table if not exists public.report_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type text not null check (type = ANY (ARRAY['patrimonial'::text, 'investimentos'::text, 'cliente'::text, 'consorcios'::text, 'operacional'::text, 'executivo'::text])),
  title text not null,
  config jsonb not null default '{}'::jsonb,
  usage_count integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.report_templates enable row level security;
drop policy if exists report_templates_org_access on public.report_templates;
create policy report_templates_org_access on public.report_templates
  for all using (is_org_member(organization_id)) with check (is_org_member(organization_id));

drop trigger if exists trg_report_templates_updated_at on public.report_templates;
create trigger trg_report_templates_updated_at
  before update on public.report_templates
  for each row execute function set_updated_at();
