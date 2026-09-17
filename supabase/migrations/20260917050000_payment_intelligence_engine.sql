-- Payment Intelligence Engine — motor de recebimento, identificação e
-- conciliação de comprovantes de pagamento.
--
-- REUTILIZA (não cria banco/armazenamento paralelo):
--   - `clients`, `consortium_contracts`, `consortium_installments` —
--     nenhuma cópia de dado do cliente/contrato/parcela é feita aqui,
--     só referência por FK.
--   - `documents`/`document_versions` + bucket "documents" do Storage —
--     o comprovante em si é um documento comum do Cofre Digital
--     (`recordVaultDocument`, já existente); estas tabelas só guardam a
--     inteligência EM CIMA do documento (extração, matching, baixa).
--   - `audit_logs` + `write_audit_log()` — nenhuma tabela de auditoria
--     nova; o trigger genérico é só anexado nas tabelas novas (e em
--     `consortium_installments`, que nunca tinha sido auditada).
--
-- MAPEAMENTO DOS 7 CONCEITOS PEDIDOS PRO SCHEMA (evitando proliferar
-- tabela por conceito quando o conceito já é um ESTADO, não uma
-- entidade separada):
--   Payment Evidence   -> tabela `payment_evidences` (o comprovante +
--                         os dados extraídos/digitados dele)
--   Payment Transaction -> campos de transação (banco, método, id da
--                         transação, valor, data/hora) em
--                         `payment_evidences` — são atributos de UMA
--                         evidência, não uma entidade em si
--   Payment Match      -> tabela `payment_matches` (pode haver vários
--                         candidatos por evidência, por isso é tabela
--                         própria)
--   Payment            -> tabela `payment_transactions` (o pagamento
--                         CONFIRMADO/baixado — liga evidência a
--                         cliente/contrato/parcela reais)
--   Payment Reconciliation -> o estado `status = 'conciliado'` em
--                         `payment_transactions`/`payment_evidences`,
--                         não uma tabela própria
--   Payment Exception  -> tabela `payment_exceptions`
--   Payment Audit      -> `audit_logs` (reaproveitado)
--
-- NENHUM OCR, integração bancária, Pix ou Open Finance é fingido aqui.
-- `origin` e as colunas de extração já existem prontas pra quando um
-- provedor real for plugado (ver `lib/payments/extraction.ts`) — hoje
-- quem preenche os dados extraídos é a pessoa que faz o upload.

create type payment_status as enum (
  'recebido', 'processando', 'identificado', 'conciliado',
  'aguardando_revisao', 'excecao', 'rejeitado', 'duplicado'
);

create type payment_confidence as enum ('alta', 'media', 'baixa');

create type payment_exception_type as enum (
  'pagamento_duplicado', 'comprovante_duplicado', 'parcela_ja_paga',
  'valor_divergente', 'cliente_divergente', 'contrato_divergente',
  'data_incompativel', 'beneficiario_divergente', 'transacao_nao_encontrada',
  'inconsistencia_possivel'
);

-- ────────────────────────────────────────────────────────────────
-- Payment Evidence (+ Payment Transaction como atributos)
-- ────────────────────────────────────────────────────────────────
create table public.payment_evidences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  origin text not null default 'upload' check (origin = ANY (ARRAY[
    'upload'::text, 'whatsapp'::text, 'email'::text, 'portal'::text, 'api'::text
  ])),
  status payment_status not null default 'recebido',
  -- "Payment Transaction": dados da transação extraídos/digitados.
  extracted_amount numeric,
  extracted_date date,
  extracted_time time,
  extracted_method text,
  extracted_bank text,
  extracted_beneficiary text,
  extracted_transaction_id text,
  client_hint text,
  notes text,
  rejection_reason text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payment_evidences_org_status on public.payment_evidences (organization_id, status);
create index idx_payment_evidences_transaction_id on public.payment_evidences (organization_id, extracted_transaction_id)
  where extracted_transaction_id is not null;

alter table public.payment_evidences enable row level security;
create policy payment_evidences_access on public.payment_evidences
  for all
  using (is_org_member(organization_id) and has_org_role(organization_id, ARRAY['admin'::app_role, 'manager'::app_role, 'finance'::app_role, 'operations'::app_role]))
  with check (is_org_member(organization_id) and has_org_role(organization_id, ARRAY['admin'::app_role, 'manager'::app_role, 'finance'::app_role, 'operations'::app_role]));

drop trigger if exists trg_updated_at_payment_evidences on public.payment_evidences;
create trigger trg_updated_at_payment_evidences
  before update on public.payment_evidences
  for each row execute function set_updated_at();

drop trigger if exists trg_audit_payment_evidences on public.payment_evidences;
create trigger trg_audit_payment_evidences
  after insert or update or delete on public.payment_evidences
  for each row execute function write_audit_log();

-- ────────────────────────────────────────────────────────────────
-- Payment Match — candidatos gerados pelo motor de matching
-- ────────────────────────────────────────────────────────────────
create table public.payment_matches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  evidence_id uuid not null references public.payment_evidences(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  consortium_contract_id uuid references public.consortium_contracts(id) on delete set null,
  consortium_installment_id uuid references public.consortium_installments(id) on delete set null,
  score integer not null check (score >= 0 and score <= 100),
  confidence payment_confidence not null,
  score_breakdown jsonb not null default '{}'::jsonb,
  reasons text[] not null default '{}'::text[],
  divergences text[] not null default '{}'::text[],
  is_selected boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_payment_matches_evidence on public.payment_matches (evidence_id);

alter table public.payment_matches enable row level security;
create policy payment_matches_access on public.payment_matches
  for all
  using (is_org_member(organization_id) and has_org_role(organization_id, ARRAY['admin'::app_role, 'manager'::app_role, 'finance'::app_role, 'operations'::app_role]))
  with check (is_org_member(organization_id) and has_org_role(organization_id, ARRAY['admin'::app_role, 'manager'::app_role, 'finance'::app_role, 'operations'::app_role]));

drop trigger if exists trg_audit_payment_matches on public.payment_matches;
create trigger trg_audit_payment_matches
  after insert or update or delete on public.payment_matches
  for each row execute function write_audit_log();

-- ────────────────────────────────────────────────────────────────
-- Payment (confirmado) / Payment Reconciliation
-- ────────────────────────────────────────────────────────────────
create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  evidence_id uuid not null references public.payment_evidences(id) on delete cascade,
  match_id uuid references public.payment_matches(id) on delete set null,
  client_id uuid not null references public.clients(id) on delete restrict,
  consortium_contract_id uuid references public.consortium_contracts(id) on delete set null,
  consortium_installment_id uuid references public.consortium_installments(id) on delete set null,
  amount numeric not null,
  status text not null default 'conciliado' check (status = ANY (ARRAY['conciliado'::text, 'revertido'::text])),
  auto_confirmed boolean not null default false,
  confirmed_by uuid references public.profiles(id) on delete set null,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index idx_payment_transactions_evidence on public.payment_transactions (evidence_id);
create index idx_payment_transactions_installment on public.payment_transactions (consortium_installment_id);

alter table public.payment_transactions enable row level security;
create policy payment_transactions_access on public.payment_transactions
  for all
  using (is_org_member(organization_id) and has_org_role(organization_id, ARRAY['admin'::app_role, 'manager'::app_role, 'finance'::app_role, 'operations'::app_role]))
  with check (is_org_member(organization_id) and has_org_role(organization_id, ARRAY['admin'::app_role, 'manager'::app_role, 'finance'::app_role, 'operations'::app_role]));

drop trigger if exists trg_audit_payment_transactions on public.payment_transactions;
create trigger trg_audit_payment_transactions
  after insert or update or delete on public.payment_transactions
  for each row execute function write_audit_log();

-- ────────────────────────────────────────────────────────────────
-- Payment Exception
-- ────────────────────────────────────────────────────────────────
create table public.payment_exceptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  evidence_id uuid not null references public.payment_evidences(id) on delete cascade,
  exception_type payment_exception_type not null,
  details text,
  status text not null default 'aberta' check (status = ANY (ARRAY['aberta'::text, 'resolvida'::text])),
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_payment_exceptions_evidence on public.payment_exceptions (evidence_id);
create index idx_payment_exceptions_org_status on public.payment_exceptions (organization_id, status);

alter table public.payment_exceptions enable row level security;
create policy payment_exceptions_access on public.payment_exceptions
  for all
  using (is_org_member(organization_id) and has_org_role(organization_id, ARRAY['admin'::app_role, 'manager'::app_role, 'finance'::app_role, 'operations'::app_role]))
  with check (is_org_member(organization_id) and has_org_role(organization_id, ARRAY['admin'::app_role, 'manager'::app_role, 'finance'::app_role, 'operations'::app_role]));

drop trigger if exists trg_audit_payment_exceptions on public.payment_exceptions;
create trigger trg_audit_payment_exceptions
  after insert or update or delete on public.payment_exceptions
  for each row execute function write_audit_log();

-- ────────────────────────────────────────────────────────────────
-- `consortium_installments` nunca tinha auditoria — a "baixa" de
-- parcela é exatamente o tipo de mudança financeira que precisa ficar
-- rastreada.
-- ────────────────────────────────────────────────────────────────
drop trigger if exists trg_audit_consortium_installments on public.consortium_installments;
create trigger trg_audit_consortium_installments
  after insert or update or delete on public.consortium_installments
  for each row execute function write_audit_log();

-- ────────────────────────────────────────────────────────────────
-- confirm_payment — único ponto que dá baixa de verdade. Atômico:
-- parcela + contrato + transação + evidência mudam juntos ou nada
-- muda. Reutiliza a MESMA fronteira de perfil das tabelas acima.
-- ────────────────────────────────────────────────────────────────
create or replace function public.confirm_payment(
  p_evidence_id uuid,
  p_client_id uuid,
  p_consortium_contract_id uuid,
  p_consortium_installment_id uuid,
  p_amount numeric,
  p_match_id uuid,
  p_auto_confirmed boolean
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_installment_status text;
  v_transaction_id uuid;
begin
  select organization_id into v_org_id from public.payment_evidences where id = p_evidence_id;
  if v_org_id is null then
    return 'evidence_not_found';
  end if;

  if not has_org_role(v_org_id, array['admin', 'manager', 'finance', 'operations']::app_role[]) then
    raise exception 'not authorized';
  end if;

  if p_consortium_installment_id is not null then
    select status into v_installment_status
      from public.consortium_installments where id = p_consortium_installment_id;

    if v_installment_status is null then
      return 'installment_not_found';
    end if;
    if v_installment_status = 'paid' then
      return 'already_paid';
    end if;

    update public.consortium_installments
      set status = 'paid', paid_amount = p_amount, paid_at = now()::date
      where id = p_consortium_installment_id;

    if p_consortium_contract_id is not null then
      update public.consortium_contracts
        set paid_installments = paid_installments + 1
        where id = p_consortium_contract_id;
    end if;
  end if;

  insert into public.payment_transactions (
    organization_id, evidence_id, match_id, client_id,
    consortium_contract_id, consortium_installment_id,
    amount, status, confirmed_by, auto_confirmed
  ) values (
    v_org_id, p_evidence_id, p_match_id, p_client_id,
    p_consortium_contract_id, p_consortium_installment_id,
    p_amount, 'conciliado', auth.uid(), p_auto_confirmed
  )
  returning id into v_transaction_id;

  update public.payment_evidences
    set status = 'conciliado', updated_at = now()
    where id = p_evidence_id;

  if p_match_id is not null then
    update public.payment_matches set is_selected = true where id = p_match_id;
  end if;

  return 'confirmed';
end;
$$;

grant execute on function public.confirm_payment(uuid, uuid, uuid, uuid, numeric, uuid, boolean) to authenticated;

notify pgrst, 'reload schema';
