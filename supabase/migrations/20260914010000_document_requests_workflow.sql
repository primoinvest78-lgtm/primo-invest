-- Camada de gestão documental sobre o Cofre Digital: workflow de
-- solicitação/recebimento/análise/aprovação de documentos.
-- Aditiva, uma tabela nova com FKs simples (nenhum segundo caminho de
-- relacionamento pra uma tabela já embutida em outro lugar — ver
-- memória do projeto sobre o incidente de FK duplicada).

create table if not exists public.document_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  category text,
  title text not null,
  description text,
  responsible_role text check (responsible_role = ANY (ARRAY['cliente'::text, 'assessor'::text, 'backoffice'::text, 'compliance'::text, 'administracao'::text])),
  responsible_id uuid references public.profiles(id) on delete set null,
  requested_by uuid references public.profiles(id) on delete set null,
  due_date date,
  status text not null default 'solicitado' check (status = ANY (ARRAY['solicitado'::text, 'recebido'::text, 'em_analise'::text, 'aprovado'::text, 'reprovado'::text, 'arquivado'::text])),
  decision_notes text,
  entity_type text,
  entity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.document_requests enable row level security;
drop policy if exists document_requests_org_access on public.document_requests;
create policy document_requests_org_access on public.document_requests
  for all using (is_org_member(organization_id)) with check (is_org_member(organization_id));

drop trigger if exists trg_document_requests_updated_at on public.document_requests;
create trigger trg_document_requests_updated_at
  before update on public.document_requests
  for each row execute function set_updated_at();

-- Auditoria automática (solicitação, recebimento, análise, aprovação,
-- reprovação, arquivamento são todos UPDATE/INSERT nesta tabela) —
-- mesmo padrão reaproveitado em documents (trg_audit_documents).
drop trigger if exists trg_audit_document_requests on public.document_requests;
create trigger trg_audit_document_requests
  after insert or update or delete on public.document_requests
  for each row execute function write_audit_log();
