-- Fundação de schema pro Cofre Digital. Todas as mudanças são
-- aditivas (colunas nullable, tabelas novas com uma única FK cada) —
-- nenhuma cria um segundo caminho de relacionamento pra uma tabela já
-- embutida em outro lugar (ver memória do projeto sobre o incidente
-- de FK duplicada em consortium_contracts/clients).

-- Metadados de organização/busca do documento.
alter table public.documents
  add column if not exists category text,
  add column if not exists expires_at date,
  add column if not exists tags text[];

-- Auditoria automática (upload, alteração, exclusão) — mesmo padrão
-- já usado em consortium_contracts (trg_audit_consortium_contracts),
-- reaproveitando a função write_audit_log() existente.
drop trigger if exists trg_audit_documents on public.documents;
create trigger trg_audit_documents
  after insert or update or delete on public.documents
  for each row execute function write_audit_log();

-- Log de acesso — visualização/download/compartilhamento são leituras
-- que não passam por INSERT/UPDATE/DELETE, então o trigger de
-- auditoria não capturaria; a aplicação grava aqui explicitamente.
create table if not exists public.document_access_log (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null check (action = ANY (ARRAY['view'::text, 'download'::text, 'share'::text])),
  created_at timestamptz not null default now()
);
alter table public.document_access_log enable row level security;
drop policy if exists document_access_log_org_access on public.document_access_log;
create policy document_access_log_org_access on public.document_access_log
  for all using (is_org_member(organization_id)) with check (is_org_member(organization_id));

-- Relacionamentos genéricos (documento -> várias entidades de módulos
-- diferentes). Entity_id é proposital não-FK (aponta pra tabelas
-- diferentes conforme entity_type) — evita criar uma coluna de FK
-- nova por tipo de relação (conta, meta, passivo, oportunidade...) e
-- evita duplicar o arquivo em cada módulo.
create table if not exists public.document_relationships (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (document_id, entity_type, entity_id)
);
alter table public.document_relationships enable row level security;
drop policy if exists document_relationships_org_access on public.document_relationships;
create policy document_relationships_org_access on public.document_relationships
  for all using (is_org_member(organization_id)) with check (is_org_member(organization_id));

-- Compartilhamento — estrutura preparada (quem, qual permissão, prazo)
-- mas a ENFORCEMENT de acesso continua só em nível de organização via
-- RLS (is_org_member). Isso NÃO implementa controle de acesso
-- granular por pessoa/registro — ver comentário em
-- lib/actions/documents.ts sobre essa limitação real.
create table if not exists public.document_shares (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  shared_with_type text not null check (shared_with_type = ANY (ARRAY['advisor'::text, 'team'::text, 'client'::text, 'administrator'::text, 'third_party'::text])),
  shared_with_name text,
  can_view boolean not null default true,
  can_download boolean not null default false,
  can_edit boolean not null default false,
  expires_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.document_shares enable row level security;
drop policy if exists document_shares_org_access on public.document_shares;
create policy document_shares_org_access on public.document_shares
  for all using (is_org_member(organization_id)) with check (is_org_member(organization_id));
