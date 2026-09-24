-- Ficha cadastral estruturada do cliente (assistente "Novo cliente").
-- Guarda o que não tem coluna em `clients`: dados complementares de
-- pessoa física/jurídica, perfil profissional e financeiro inicial,
-- representante legal, sócios e informações de conformidade.
--
-- Aditiva: tabela nova, 1:1 com clients, com UMA única FK pra clients
-- (mesmo formato de client_risk_profiles) — não cria segundo caminho de
-- relacionamento com nenhuma tabela já embutida em outro lugar.
-- NÃO é análise de crédito, consórcio ou contemplação.

create table if not exists public.client_registration_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null unique references public.clients(id) on delete cascade,
  person_type text not null check (person_type = any (array['pf'::text, 'pj'::text])),
  relationship_type text,

  -- Pessoa física
  sex text,
  nationality text,
  birthplace text,
  marital_status text,
  property_regime text,
  profession text,
  id_document_type text,
  id_document_number text,
  id_document_issuer text,
  id_document_uf text,
  id_document_issue_date date,
  residence_type text,

  -- Pessoa jurídica
  legal_nature text,
  cnae text,
  main_activity text,
  website text,
  annual_revenue numeric,
  company_net_worth numeric,
  legal_representative jsonb,
  partners jsonb not null default '[]'::jsonb,

  -- Perfil profissional e financeiro (cadastro, não análise de crédito)
  professional_status text,
  employer_name text,
  employer_cnpj text,
  job_title text,
  activity_time text,
  monthly_income numeric,
  other_income numeric,
  family_income numeric,
  estimated_net_worth numeric,
  income_sources text[],
  funds_origins text[],

  -- Conformidade
  risk_classification text check (risk_classification is null or risk_classification = any (array['Baixo'::text, 'Médio'::text, 'Alto'::text])),
  funds_origin_detail text,
  beneficial_owner text,
  compliance_notes text,

  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_registration_profiles_org_idx
  on public.client_registration_profiles (organization_id);

alter table public.client_registration_profiles enable row level security;
drop policy if exists client_registration_profiles_org_access on public.client_registration_profiles;
create policy client_registration_profiles_org_access on public.client_registration_profiles
  for all using (is_org_member(organization_id)) with check (is_org_member(organization_id));

drop trigger if exists trg_client_registration_profiles_updated_at on public.client_registration_profiles;
create trigger trg_client_registration_profiles_updated_at
  before update on public.client_registration_profiles
  for each row execute function set_updated_at();

drop trigger if exists trg_audit_client_registration_profiles on public.client_registration_profiles;
create trigger trg_audit_client_registration_profiles
  after insert or update or delete on public.client_registration_profiles
  for each row execute function write_audit_log();

notify pgrst, 'reload schema';
