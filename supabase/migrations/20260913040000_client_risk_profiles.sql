-- Perfil de investidor / suitability (CVM/ANBIMA).
--
-- Histórico append-only: cada reavaliação do cliente gera uma linha NOVA.
-- A aplicação nunca faz UPDATE nos campos de avaliação de uma linha
-- existente — isso é obrigatório para auditoria (CVM/ANBIMA exigem
-- rastreabilidade completa de mudanças no perfil de risco do investidor).
--
-- "Vigente" = a linha mais recente por valid_from para aquele cliente.
-- "Vencido" = essa linha mais recente com valid_until no passado.
-- Determine isso sempre por query (order by valid_from desc limit 1),
-- nunca marcando/desmarcando linhas antigas.
create table public.client_risk_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  client_id uuid not null references public.clients(id),
  risk_tolerance text not null,
  investment_objective text not null,
  investment_horizon text not null,
  score numeric,
  questionnaire_data jsonb,
  valid_from date not null default current_date,
  valid_until date,
  status text not null default 'active',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index client_risk_profiles_client_idx
  on public.client_risk_profiles (client_id, valid_from desc);

alter table public.client_risk_profiles enable row level security;

create policy client_risk_profiles_org_access on public.client_risk_profiles
  for all
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

create trigger trg_client_risk_profiles_updated_at
  before update on public.client_risk_profiles
  for each row execute function set_updated_at();

create trigger trg_audit_client_risk_profiles
  after insert or update or delete on public.client_risk_profiles
  for each row execute function write_audit_log();

-- ----------------------------------------------------------------------
-- Fix de bug pré-existente: a tabela "tags" está com RLS habilitado mas
-- sem NENHUMA policy (achado ao investigar a lista de clientes) — hoje
-- fica 100% inacessível, mesmo para membros da própria organização.
-- ----------------------------------------------------------------------
create policy tags_org_access on public.tags
  for all
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

-- ----------------------------------------------------------------------
-- Bucket de Storage para a aba Documentos do cliente (privado; leitura
-- e escrita controladas por policy própria de storage, escopada por
-- organization_id via prefixo do caminho: {organization_id}/{client_id}/...).
-- ----------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy documents_bucket_org_access on storage.objects
  for all
  using (
    bucket_id = 'documents'
    and is_org_member((storage.foldername(name))[1]::uuid)
  )
  with check (
    bucket_id = 'documents'
    and is_org_member((storage.foldername(name))[1]::uuid)
  );
