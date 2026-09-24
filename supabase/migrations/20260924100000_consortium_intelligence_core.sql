-- Consortium Intelligence Core — Fase 1: fundação do motor de consórcios
-- (numeração, regras versionadas, fonte oficial de sorteio, snapshots,
-- apuração determinística, lances, contemplação, retificação, auditoria).
--
-- REUTILIZA (não cria banco paralelo):
--   - `consortium_contracts` — a cota conhecida pelo PRIMO aponta pro
--     contrato do cliente via `consortium_quotas.contract_id`. NENHUMA FK
--     nova é adicionada em consortium_contracts (ver incidente PostgREST
--     da segunda FK — memória do projeto).
--   - `consortium_installments` — fonte da adimplência no snapshot.
--   - `consortium_bids` — lances continuam aqui; só ganham `assembly_id`
--     e `embedded_amount` (aditivos, nullable).
--   - `consortium_events` — linha do tempo do contrato na homologação.
--   - `documents` — regulamento do grupo, evidência da loteria e da
--     retificação (FKs opcionais, nenhum armazenamento novo).
--   - `audit_logs` + `write_audit_log()` — trigger genérico anexado em
--     todas as tabelas novas.
--
-- DECISÕES DE MODELAGEM:
--   - Número equivalente NÃO é tabela: é representação calculada pelo
--     motor (lib/consortium-engine/equivalence.ts). Se virasse linha,
--     viraria "cota fantasma". A única entidade de cota é
--     `consortium_quotas`, com unicidade (grupo, número) e faixa checada
--     contra o grupo.
--   - Snapshots de elegibilidade/regra/loteria/recursos/lances numa só
--     tabela imutável (`consortium_assembly_snapshots`, por `kind`).
--   - Calculation trace é campo do run (`consortium_draw_runs.trace`),
--     congelado junto com os 5 hashes.
--   - Nada aqui é sobrescrito: regra publicada, resultado verificado,
--     snapshot, run e evento de auditoria são imutáveis por trigger.

-- ────────────────────────────────────────────────────────────────
-- Papéis
-- ────────────────────────────────────────────────────────────────
-- Operação (criar grupo/assembleia, importar resultado, apurar):
--   admin, manager, operations, advisor
-- Governança (aprovar/publicar regra, verificar resultado, homologar,
-- aprovar retificação): admin, manager, compliance

create or replace function public.consortium_can_operate(p_org_id uuid)
returns boolean
language sql stable security definer set search_path to 'public'
as $$
  select has_org_role(p_org_id, array['admin','manager','operations','advisor']::app_role[]);
$$;

create or replace function public.consortium_can_govern(p_org_id uuid)
returns boolean
language sql stable security definer set search_path to 'public'
as $$
  select has_org_role(p_org_id, array['admin','manager','compliance']::app_role[]);
$$;

-- ────────────────────────────────────────────────────────────────
-- Grupos
-- ────────────────────────────────────────────────────────────────
create table public.consortium_groups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  administrator_name text not null,
  group_code text not null,
  product_type text,
  quota_count integer not null check (quota_count > 0),
  number_start integer not null default 1 check (number_start >= 0),
  number_end integer not null,
  display_digits integer not null check (display_digits between 1 and 8),
  credit_amount numeric check (credit_amount is null or credit_amount >= 0),
  status text not null default 'ACTIVE' check (status = ANY (ARRAY['FORMING','ACTIVE','CLOSED','SUSPENDED'])),
  regulation_document_id uuid references public.documents(id) on delete set null,
  regulation_reference text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, administrator_name, group_code),
  check (number_end >= number_start),
  check (quota_count = number_end - number_start + 1),
  check (length(number_end::text) <= display_digits)
);

create index idx_consortium_groups_org on public.consortium_groups (organization_id, status);

-- ────────────────────────────────────────────────────────────────
-- Cotas (PRIMARY_QUOTA) — só as cotas que o PRIMO conhece/acompanha.
-- ────────────────────────────────────────────────────────────────
create table public.consortium_quotas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  group_id uuid not null references public.consortium_groups(id) on delete restrict,
  quota_number integer not null,
  contract_id uuid references public.consortium_contracts(id) on delete set null,
  holder_label text,
  status text not null default 'ACTIVE' check (status = ANY (ARRAY['ACTIVE','CANCELLED','EXCLUDED','AVAILABLE'])),
  payment_status text not null default 'UNKNOWN' check (payment_status = ANY (ARRAY['UP_TO_DATE','DELINQUENT','UNKNOWN'])),
  contemplated_at date,
  contemplation_method text,
  eligibility_source text not null default 'MANUAL' check (eligibility_source = ANY (ARRAY['CONTRACT','IMPORTED','MANUAL'])),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, quota_number)
);

create index idx_consortium_quotas_group on public.consortium_quotas (group_id, quota_number);
create index idx_consortium_quotas_contract on public.consortium_quotas (contract_id) where contract_id is not null;

-- Garante que a cota existe na faixa numérica do grupo — nenhum número
-- equivalente/fora de faixa consegue virar cota.
create or replace function public.consortium_quota_in_range()
returns trigger language plpgsql set search_path to 'public'
as $$
declare
  v_start integer;
  v_end integer;
  v_org uuid;
begin
  select number_start, number_end, organization_id into v_start, v_end, v_org
    from public.consortium_groups where id = NEW.group_id;
  if NEW.quota_number < v_start or NEW.quota_number > v_end then
    raise exception 'Cota % fora da faixa do grupo (% a %).', NEW.quota_number, v_start, v_end
      using errcode = 'check_violation';
  end if;
  if NEW.organization_id <> v_org then
    raise exception 'Cota e grupo pertencem a organizações diferentes.';
  end if;
  return NEW;
end;
$$;

create trigger trg_consortium_quota_in_range
  before insert or update on public.consortium_quotas
  for each row execute function consortium_quota_in_range();

-- ────────────────────────────────────────────────────────────────
-- Regras de apuração — versionadas e congeladas após aprovação.
-- ────────────────────────────────────────────────────────────────
create table public.consortium_draw_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  rule_key text not null,
  version integer not null check (version >= 1),
  name text not null,
  administrator_name text not null,
  product_type text,
  group_id uuid references public.consortium_groups(id) on delete restrict,
  effective_from date not null,
  effective_until date,
  status text not null default 'DRAFT' check (status = ANY (ARRAY['DRAFT','REVIEW','APPROVED','PUBLISHED','SUPERSEDED','ARCHIVED'])),
  source text not null default 'FEDERAL_LOTTERY' check (source = ANY (ARRAY['FEDERAL_LOTTERY','OTHER_REGULATED_SOURCE'])),
  regulation_document_id uuid references public.documents(id) on delete set null,
  regulation_reference text,
  config jsonb not null,
  calculation_method text generated always as (config->>'calculationMethod') stored,
  equivalence_method text generated always as (config->'equivalence'->>'method') stored,
  fallback_method text generated always as (config->'fallback'->>'method') stored,
  tie_break_method text generated always as (config->'bids'->>'tieBreak') stored,
  rule_hash text,
  previous_version_id uuid references public.consortium_draw_rules(id) on delete restrict,
  created_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  published_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, rule_key, version),
  check (effective_until is null or effective_until >= effective_from)
);

create index idx_consortium_draw_rules_org on public.consortium_draw_rules (organization_id, rule_key, version desc);

create or replace function public.consortium_rule_guard()
returns trigger language plpgsql set search_path to 'public'
as $$
declare
  v_allowed boolean;
begin
  if TG_OP = 'DELETE' then
    if OLD.status <> 'DRAFT' then
      raise exception 'Só regras em rascunho podem ser excluídas. Regras revisadas/publicadas ficam no histórico.';
    end if;
    return OLD;
  end if;

  -- Conteúdo só é editável em DRAFT (e REVIEW volta pra DRAFT antes).
  if OLD.status <> 'DRAFT' and (
       NEW.config is distinct from OLD.config
    or NEW.rule_key is distinct from OLD.rule_key
    or NEW.version is distinct from OLD.version
    or NEW.name is distinct from OLD.name
    or NEW.administrator_name is distinct from OLD.administrator_name
    or NEW.product_type is distinct from OLD.product_type
    or NEW.group_id is distinct from OLD.group_id
    or NEW.effective_from is distinct from OLD.effective_from
    or NEW.source is distinct from OLD.source
    or NEW.rule_hash is distinct from OLD.rule_hash
    or NEW.regulation_reference is distinct from OLD.regulation_reference
  ) then
    raise exception 'Regra "%" v% está em %, e não pode ser alterada. Crie uma nova versão.', OLD.name, OLD.version, OLD.status;
  end if;

  if NEW.status is distinct from OLD.status then
    v_allowed := (OLD.status, NEW.status) in (
      ('DRAFT','REVIEW'), ('REVIEW','DRAFT'), ('REVIEW','APPROVED'),
      ('APPROVED','PUBLISHED'), ('PUBLISHED','SUPERSEDED'), ('PUBLISHED','ARCHIVED'),
      ('SUPERSEDED','ARCHIVED'), ('DRAFT','ARCHIVED')
    );
    if not v_allowed then
      raise exception 'Transição de status de regra inválida: % → %.', OLD.status, NEW.status;
    end if;
    if NEW.status in ('APPROVED','PUBLISHED') and not consortium_can_govern(NEW.organization_id) then
      raise exception 'Aprovar ou publicar regra exige papel de governança (admin, gestor ou compliance).';
    end if;
    if NEW.status = 'APPROVED' and NEW.rule_hash is null then
      raise exception 'Regra sem hash não pode ser aprovada.';
    end if;
  end if;

  return NEW;
end;
$$;

create trigger trg_consortium_rule_guard
  before update or delete on public.consortium_draw_rules
  for each row execute function consortium_rule_guard();

-- ────────────────────────────────────────────────────────────────
-- Resultados da fonte oficial de sorteio — congelados após verificação.
-- ────────────────────────────────────────────────────────────────
create table public.consortium_lottery_results (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source text not null default 'FEDERAL_LOTTERY' check (source = ANY (ARRAY['FEDERAL_LOTTERY','OTHER_REGULATED_SOURCE'])),
  contest_number text not null,
  draw_date date not null,
  -- Texto, não número: "03520" precisa continuar "03520".
  prizes text[] not null,
  prize_1 text generated always as (prizes[1]) stored,
  prize_2 text generated always as (prizes[2]) stored,
  prize_3 text generated always as (prizes[3]) stored,
  prize_4 text generated always as (prizes[4]) stored,
  prize_5 text generated always as (prizes[5]) stored,
  prize_digits integer not null check (prize_digits between 3 and 8),
  source_reference text,
  retrieved_at timestamptz,
  evidence_document_id uuid references public.documents(id) on delete set null,
  evidence_notes text,
  verification_status text not null default 'PENDING' check (verification_status = ANY (ARRAY['PENDING','VERIFIED','INVALID'])),
  validation_errors text[] not null default '{}'::text[],
  content_hash text not null,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, source, contest_number)
);

create index idx_consortium_lottery_results_org on public.consortium_lottery_results (organization_id, draw_date desc);

create or replace function public.consortium_lottery_guard()
returns trigger language plpgsql set search_path to 'public'
as $$
begin
  if TG_OP = 'DELETE' then
    if OLD.verification_status = 'VERIFIED' then
      raise exception 'Resultado verificado não pode ser excluído.';
    end if;
    return OLD;
  end if;

  if OLD.verification_status = 'VERIFIED' and (
       NEW.prizes is distinct from OLD.prizes
    or NEW.contest_number is distinct from OLD.contest_number
    or NEW.draw_date is distinct from OLD.draw_date
    or NEW.source is distinct from OLD.source
    or NEW.content_hash is distinct from OLD.content_hash
    or NEW.prize_digits is distinct from OLD.prize_digits
    or NEW.verification_status is distinct from OLD.verification_status
  ) then
    raise exception 'Resultado oficial verificado está congelado e não pode ser alterado.';
  end if;

  if NEW.verification_status = 'VERIFIED' and OLD.verification_status <> 'VERIFIED' then
    if not consortium_can_govern(NEW.organization_id) then
      raise exception 'Verificar resultado oficial exige papel de governança.';
    end if;
    if coalesce(array_length(NEW.validation_errors, 1), 0) > 0 then
      raise exception 'Resultado com erros de validação não pode ser verificado.';
    end if;
  end if;

  return NEW;
end;
$$;

create trigger trg_consortium_lottery_guard
  before update or delete on public.consortium_lottery_results
  for each row execute function consortium_lottery_guard();

-- ────────────────────────────────────────────────────────────────
-- Assembleias — máquina de estados validada no banco.
-- ────────────────────────────────────────────────────────────────
create table public.consortium_assemblies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  group_id uuid not null references public.consortium_groups(id) on delete restrict,
  assembly_number integer not null check (assembly_number >= 1),
  assembly_date date not null,
  status text not null default 'SCHEDULED' check (status = ANY (ARRAY[
    'SCHEDULED','PREPARING','ELIGIBILITY_LOCKED','LOTTERY_LOCKED','DRAW_READY','DRAWING',
    'DRAW_COMPLETED','BID_PROCESSING','HOMOLOGATION','COMPLETED','LOCKED','RETIFIED'
  ])),
  rule_id uuid references public.consortium_draw_rules(id) on delete restrict,
  lottery_result_id uuid references public.consortium_lottery_results(id) on delete restrict,
  planned_draw_contemplations integer not null default 1 check (planned_draw_contemplations >= 0),
  common_fund_balance numeric check (common_fund_balance is null or common_fund_balance >= 0),
  reserve_fund_balance numeric check (reserve_fund_balance is null or reserve_fund_balance >= 0),
  reserve_fund_usable boolean not null default false,
  credit_amount numeric check (credit_amount is null or credit_amount > 0),
  resources_status text check (resources_status is null or resources_status = ANY (ARRAY['AVAILABLE','INSUFFICIENT','PARTIAL','BLOCKED'])),
  homologated_by uuid references public.profiles(id) on delete set null,
  homologated_at timestamptz,
  locked_at timestamptz,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, assembly_number)
);

create index idx_consortium_assemblies_org on public.consortium_assemblies (organization_id, assembly_date desc);
create index idx_consortium_assemblies_group on public.consortium_assemblies (group_id, assembly_number desc);

create or replace function public.consortium_assembly_guard()
returns trigger language plpgsql set search_path to 'public'
as $$
declare
  v_allowed boolean;
begin
  if TG_OP = 'DELETE' then
    if OLD.status not in ('SCHEDULED','PREPARING') then
      raise exception 'Assembleia em % não pode ser excluída — o histórico é preservado.', OLD.status;
    end if;
    return OLD;
  end if;

  if NEW.status is distinct from OLD.status then
    v_allowed := (OLD.status, NEW.status) in (
      ('SCHEDULED','PREPARING'),
      ('PREPARING','SCHEDULED'),
      ('PREPARING','ELIGIBILITY_LOCKED'),
      ('ELIGIBILITY_LOCKED','LOTTERY_LOCKED'),
      ('LOTTERY_LOCKED','DRAW_READY'),
      ('DRAW_READY','DRAWING'),
      ('DRAWING','DRAW_COMPLETED'),
      ('DRAW_COMPLETED','BID_PROCESSING'),
      ('DRAW_COMPLETED','HOMOLOGATION'),
      ('BID_PROCESSING','HOMOLOGATION'),
      ('HOMOLOGATION','COMPLETED'),
      ('COMPLETED','LOCKED'),
      ('COMPLETED','RETIFIED'),
      ('LOCKED','RETIFIED'),
      ('RETIFIED','LOCKED')
    );
    if not v_allowed then
      raise exception 'Operação incompatível com o estado da assembleia: % → %.', OLD.status, NEW.status;
    end if;
    if NEW.status in ('COMPLETED','LOCKED','RETIFIED') and not consortium_can_govern(NEW.organization_id) then
      raise exception 'Homologar, travar ou retificar assembleia exige papel de governança.';
    end if;
  end if;

  -- Insumos congelados: depois do travamento, não trocam mais.
  if OLD.status not in ('SCHEDULED','PREPARING','ELIGIBILITY_LOCKED') and
     NEW.lottery_result_id is distinct from OLD.lottery_result_id then
    raise exception 'Resultado oficial da assembleia já está travado.';
  end if;
  if OLD.status not in ('SCHEDULED','PREPARING','ELIGIBILITY_LOCKED','LOTTERY_LOCKED') and (
       NEW.rule_id is distinct from OLD.rule_id
    or NEW.common_fund_balance is distinct from OLD.common_fund_balance
    or NEW.reserve_fund_balance is distinct from OLD.reserve_fund_balance
    or NEW.reserve_fund_usable is distinct from OLD.reserve_fund_usable
    or NEW.credit_amount is distinct from OLD.credit_amount
    or NEW.planned_draw_contemplations is distinct from OLD.planned_draw_contemplations
  ) then
    raise exception 'Regra e recursos da assembleia já estão congelados.';
  end if;
  if NEW.group_id is distinct from OLD.group_id or NEW.assembly_number is distinct from OLD.assembly_number then
    raise exception 'Grupo e número da assembleia não podem ser alterados.';
  end if;

  return NEW;
end;
$$;

create trigger trg_consortium_assembly_guard
  before update or delete on public.consortium_assemblies
  for each row execute function consortium_assembly_guard();

-- ────────────────────────────────────────────────────────────────
-- Snapshots imutáveis (ELIGIBILITY, RULE, LOTTERY, RESOURCES, BIDS)
-- ────────────────────────────────────────────────────────────────
create table public.consortium_assembly_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assembly_id uuid not null references public.consortium_assemblies(id) on delete restrict,
  kind text not null check (kind = ANY (ARRAY['ELIGIBILITY','RULE','LOTTERY','RESOURCES','BIDS'])),
  sequence integer not null default 1,
  payload jsonb not null,
  payload_hash text not null,
  completeness text check (completeness is null or completeness = ANY (ARRAY['COMPLETE','PARTIAL'])),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (assembly_id, kind, sequence)
);

create index idx_consortium_snapshots_assembly on public.consortium_assembly_snapshots (assembly_id, kind, sequence desc);

-- ────────────────────────────────────────────────────────────────
-- Runs de cálculo (fase DRAW ou BIDS) — trace + 5 hashes, imutáveis.
-- ────────────────────────────────────────────────────────────────
create table public.consortium_draw_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assembly_id uuid not null references public.consortium_assemblies(id) on delete restrict,
  phase text not null check (phase = ANY (ARRAY['DRAW','BIDS'])),
  run_number integer not null,
  run_kind text not null check (run_kind = ANY (ARRAY['ORIGINAL','RETIFICATION'])),
  status text not null default 'CURRENT' check (status = ANY (ARRAY['CURRENT','SUPERSEDED'])),
  engine_version text not null,
  parent_run_id uuid references public.consortium_draw_runs(id) on delete restrict,
  rule_id uuid not null references public.consortium_draw_rules(id) on delete restrict,
  lottery_result_id uuid references public.consortium_lottery_results(id) on delete restrict,
  snapshot_ids jsonb not null default '{}'::jsonb,
  input_hash text not null,
  rule_hash text not null,
  eligibility_hash text not null,
  calculation_hash text not null,
  result_hash text not null,
  trace jsonb not null,
  result jsonb not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (assembly_id, phase, run_number)
);

create index idx_consortium_draw_runs_assembly on public.consortium_draw_runs (assembly_id, phase, status);

create or replace function public.consortium_immutable_guard()
returns trigger language plpgsql set search_path to 'public'
as $$
begin
  if TG_OP = 'DELETE' then
    raise exception 'Registro de % é imutável e não pode ser excluído.', TG_TABLE_NAME;
  end if;

  if TG_TABLE_NAME = 'consortium_draw_runs' then
    if OLD.status = 'CURRENT' and NEW.status = 'SUPERSEDED'
       and (to_jsonb(NEW) - 'status') = (to_jsonb(OLD) - 'status') then
      return NEW;
    end if;
  elsif TG_TABLE_NAME = 'consortium_contemplations' then
    if (to_jsonb(NEW) - array['status','homologated_by','homologated_at','voided_reason'])
         = (to_jsonb(OLD) - array['status','homologated_by','homologated_at','voided_reason'])
       and (OLD.status, NEW.status) in (('PROVISIONAL','HOMOLOGATED'), ('PROVISIONAL','VOIDED'), ('HOMOLOGATED','VOIDED')) then
      return NEW;
    end if;
  end if;

  raise exception 'Registro de % é imutável. Use retificação — nunca sobrescreva.', TG_TABLE_NAME;
end;
$$;

create trigger trg_consortium_snapshots_immutable
  before update or delete on public.consortium_assembly_snapshots
  for each row execute function consortium_immutable_guard();

create trigger trg_consortium_draw_runs_immutable
  before update or delete on public.consortium_draw_runs
  for each row execute function consortium_immutable_guard();

-- ────────────────────────────────────────────────────────────────
-- Contemplações (NÃO é liberação de crédito — só o fato apurado).
-- ────────────────────────────────────────────────────────────────
create table public.consortium_contemplations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assembly_id uuid not null references public.consortium_assemblies(id) on delete restrict,
  run_id uuid not null references public.consortium_draw_runs(id) on delete restrict,
  quota_id uuid references public.consortium_quotas(id) on delete set null,
  quota_number integer not null,
  method text not null check (method = ANY (ARRAY['DRAW','DRAW_CANCELLED','BID_FREE','BID_FIXED','BID_EMBEDDED'])),
  sequence integer not null,
  candidate_raw text,
  bid_id uuid references public.consortium_bids(id) on delete set null,
  credit_amount numeric,
  status text not null default 'PROVISIONAL' check (status = ANY (ARRAY['PROVISIONAL','HOMOLOGATED','VOIDED'])),
  homologated_by uuid references public.profiles(id) on delete set null,
  homologated_at timestamptz,
  voided_reason text,
  created_at timestamptz not null default now(),
  unique (run_id, sequence)
);

create index idx_consortium_contemplations_assembly on public.consortium_contemplations (assembly_id, status);
create index idx_consortium_contemplations_quota on public.consortium_contemplations (quota_id) where quota_id is not null;

create trigger trg_consortium_contemplations_immutable
  before update or delete on public.consortium_contemplations
  for each row execute function consortium_immutable_guard();

-- ────────────────────────────────────────────────────────────────
-- Retificações — ORIGINAL → RETIFICAÇÃO → NOVO RESULTADO.
-- ────────────────────────────────────────────────────────────────
create table public.consortium_retifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assembly_id uuid not null references public.consortium_assemblies(id) on delete restrict,
  original_run_id uuid not null references public.consortium_draw_runs(id) on delete restrict,
  new_run_id uuid references public.consortium_draw_runs(id) on delete restrict,
  original_result_hash text not null,
  new_result_hash text,
  reason text not null check (length(trim(reason)) >= 10),
  evidence_document_id uuid references public.documents(id) on delete set null,
  evidence_notes text,
  status text not null default 'REQUESTED' check (status = ANY (ARRAY['REQUESTED','APPROVED','REJECTED','APPLIED'])),
  requested_by uuid references public.profiles(id) on delete set null,
  requested_at timestamptz not null default now(),
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  decision_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Duas pessoas: quem pede não aprova.
  check (approved_by is null or requested_by is null or approved_by <> requested_by)
);

create index idx_consortium_retifications_assembly on public.consortium_retifications (assembly_id, status);

-- ────────────────────────────────────────────────────────────────
-- Eventos de auditoria de domínio — encadeados por hash (append-only).
-- ────────────────────────────────────────────────────────────────
create table public.consortium_engine_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  group_id uuid references public.consortium_groups(id) on delete restrict,
  assembly_id uuid references public.consortium_assemblies(id) on delete restrict,
  entity_type text not null,
  entity_id uuid,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  actor_id uuid default auth.uid(),
  prev_hash text,
  event_hash text not null,
  created_at timestamptz not null default now()
);

create index idx_consortium_engine_events_org on public.consortium_engine_events (organization_id, created_at desc);
create index idx_consortium_engine_events_assembly on public.consortium_engine_events (assembly_id, created_at desc);

create or replace function public.consortium_engine_event_chain()
returns trigger language plpgsql security definer set search_path to 'public'
as $$
begin
  -- Serializa por organização pra cadeia não bifurcar.
  perform pg_advisory_xact_lock(hashtext('consortium_engine_events:' || NEW.organization_id::text));
  select event_hash into NEW.prev_hash
    from public.consortium_engine_events
    where organization_id = NEW.organization_id
    order by created_at desc, id desc
    limit 1;
  NEW.created_at := clock_timestamp();
  NEW.actor_id := coalesce(NEW.actor_id, auth.uid());
  NEW.event_hash := encode(sha256(convert_to(
    coalesce(NEW.prev_hash, 'GENESIS') || '|' || NEW.event_type || '|' || NEW.entity_type || '|' ||
    coalesce(NEW.entity_id::text, '') || '|' || NEW.payload::text || '|' || NEW.created_at::text,
    'UTF8')), 'hex');
  return NEW;
end;
$$;

create trigger trg_consortium_engine_event_chain
  before insert on public.consortium_engine_events
  for each row execute function consortium_engine_event_chain();

create trigger trg_consortium_engine_events_immutable
  before update or delete on public.consortium_engine_events
  for each row execute function consortium_immutable_guard();

-- ────────────────────────────────────────────────────────────────
-- consortium_bids — vínculo com a assembleia + parcela embutida.
-- ────────────────────────────────────────────────────────────────
alter table public.consortium_bids
  add column if not exists assembly_id uuid references public.consortium_assemblies(id) on delete set null,
  add column if not exists embedded_amount numeric;

create index if not exists idx_consortium_bids_assembly on public.consortium_bids (assembly_id) where assembly_id is not null;

-- ────────────────────────────────────────────────────────────────
-- RLS
-- ────────────────────────────────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'consortium_groups','consortium_quotas','consortium_draw_rules','consortium_lottery_results',
    'consortium_assemblies','consortium_assembly_snapshots','consortium_draw_runs',
    'consortium_contemplations','consortium_retifications','consortium_engine_events'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select using (is_org_member(organization_id))', t || '_read', t);
    execute format('create policy %I on public.%I for insert with check (is_org_member(organization_id) and (consortium_can_operate(organization_id) or consortium_can_govern(organization_id)))', t || '_insert', t);
    execute format('create policy %I on public.%I for update using (is_org_member(organization_id) and (consortium_can_operate(organization_id) or consortium_can_govern(organization_id))) with check (is_org_member(organization_id))', t || '_update', t);
    execute format('create policy %I on public.%I for delete using (is_org_member(organization_id) and (consortium_can_operate(organization_id) or consortium_can_govern(organization_id)))', t || '_delete', t);
    execute format('drop trigger if exists %I on public.%I', 'trg_audit_' || t, t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function write_audit_log()', 'trg_audit_' || t, t);
  end loop;

  foreach t in array array['consortium_groups','consortium_quotas','consortium_draw_rules',
    'consortium_lottery_results','consortium_assemblies','consortium_retifications'] loop
    execute format('create trigger %I before update on public.%I for each row execute function set_updated_at()', 'trg_' || t || '_updated_at', t);
  end loop;
end $$;

-- ────────────────────────────────────────────────────────────────
-- Operações atômicas da assembleia (SECURITY INVOKER: RLS se aplica).
-- O cálculo em si acontece no motor TypeScript; aqui só persistimos
-- tudo-ou-nada (snapshot + status + evento na mesma transação).
-- ────────────────────────────────────────────────────────────────

create or replace function public.consortium_lock_snapshot(
  p_assembly_id uuid,
  p_kind text,
  p_payload jsonb,
  p_hash text,
  p_completeness text,
  p_expected_status text,
  p_next_status text,
  p_patch jsonb default '{}'::jsonb
) returns uuid
language plpgsql set search_path to 'public'
as $$
declare
  v_a public.consortium_assemblies%rowtype;
  v_seq integer;
  v_id uuid;
begin
  select * into v_a from public.consortium_assemblies where id = p_assembly_id for update;
  if not found then raise exception 'Assembleia não encontrada.'; end if;
  if v_a.status <> p_expected_status then
    raise exception 'Operação incompatível: assembleia está em %, esperado %.', v_a.status, p_expected_status;
  end if;

  select coalesce(max(sequence), 0) + 1 into v_seq
    from public.consortium_assembly_snapshots where assembly_id = p_assembly_id and kind = p_kind;

  insert into public.consortium_assembly_snapshots (organization_id, assembly_id, kind, sequence, payload, payload_hash, completeness, created_by)
  values (v_a.organization_id, p_assembly_id, p_kind, v_seq, p_payload, p_hash, p_completeness, auth.uid())
  returning id into v_id;

  update public.consortium_assemblies set
    status = coalesce(p_next_status, status),
    lottery_result_id = case when p_patch ? 'lottery_result_id' then (p_patch->>'lottery_result_id')::uuid else lottery_result_id end,
    rule_id = case when p_patch ? 'rule_id' then (p_patch->>'rule_id')::uuid else rule_id end,
    resources_status = case when p_patch ? 'resources_status' then p_patch->>'resources_status' else resources_status end
  where id = p_assembly_id;

  insert into public.consortium_engine_events (organization_id, group_id, assembly_id, entity_type, entity_id, event_type, payload)
  values (v_a.organization_id, v_a.group_id, p_assembly_id, 'snapshot', v_id, 'SNAPSHOT_' || p_kind,
          jsonb_build_object('hash', p_hash, 'sequence', v_seq, 'completeness', p_completeness,
                             'from', v_a.status, 'to', coalesce(p_next_status, v_a.status)));
  return v_id;
end;
$$;

create or replace function public.consortium_record_run(
  p_assembly_id uuid,
  p_run jsonb,
  p_contemplations jsonb,
  p_expected_status text,
  p_status_path text[],
  p_retification_id uuid default null
) returns uuid
language plpgsql set search_path to 'public'
as $$
declare
  v_a public.consortium_assemblies%rowtype;
  v_run_id uuid;
  v_run_number integer;
  v_phase text := p_run->>'phase';
  v_prev_id uuid;
  v_step text;
  c jsonb;
begin
  select * into v_a from public.consortium_assemblies where id = p_assembly_id for update;
  if not found then raise exception 'Assembleia não encontrada.'; end if;
  if v_a.status <> p_expected_status then
    raise exception 'Operação incompatível: assembleia está em %, esperado %.', v_a.status, p_expected_status;
  end if;

  select id into v_prev_id from public.consortium_draw_runs
    where assembly_id = p_assembly_id and phase = v_phase and status = 'CURRENT';

  if v_prev_id is not null then
    if p_retification_id is null then
      raise exception 'Já existe um cálculo vigente pra fase %. Use retificação.', v_phase;
    end if;
    update public.consortium_draw_runs set status = 'SUPERSEDED' where id = v_prev_id;
    update public.consortium_contemplations
      set status = 'VOIDED', voided_reason = 'Retificação ' || p_retification_id::text
      where run_id = v_prev_id and status <> 'VOIDED';
  end if;

  select coalesce(max(run_number), 0) + 1 into v_run_number
    from public.consortium_draw_runs where assembly_id = p_assembly_id and phase = v_phase;

  insert into public.consortium_draw_runs (
    organization_id, assembly_id, phase, run_number, run_kind, engine_version, parent_run_id,
    rule_id, lottery_result_id, snapshot_ids, input_hash, rule_hash, eligibility_hash,
    calculation_hash, result_hash, trace, result, created_by
  ) values (
    v_a.organization_id, p_assembly_id, v_phase, v_run_number,
    case when p_retification_id is null then 'ORIGINAL' else 'RETIFICATION' end,
    p_run->>'engine_version', nullif(p_run->>'parent_run_id', '')::uuid,
    (p_run->>'rule_id')::uuid, nullif(p_run->>'lottery_result_id', '')::uuid,
    coalesce(p_run->'snapshot_ids', '{}'::jsonb),
    p_run->>'input_hash', p_run->>'rule_hash', p_run->>'eligibility_hash',
    p_run->>'calculation_hash', p_run->>'result_hash', p_run->'trace', p_run->'result', auth.uid()
  ) returning id into v_run_id;

  for c in select * from jsonb_array_elements(coalesce(p_contemplations, '[]'::jsonb)) loop
    insert into public.consortium_contemplations (
      organization_id, assembly_id, run_id, quota_id, quota_number, method, sequence,
      candidate_raw, bid_id, credit_amount
    ) values (
      v_a.organization_id, p_assembly_id, v_run_id,
      (select q.id from public.consortium_quotas q where q.group_id = v_a.group_id and q.quota_number = (c->>'quota_number')::integer),
      (c->>'quota_number')::integer, c->>'method', (c->>'sequence')::integer,
      c->>'candidate_raw', nullif(c->>'bid_id', '')::uuid, nullif(c->>'credit_amount', '')::numeric
    );
  end loop;

  if p_status_path is not null then
    foreach v_step in array p_status_path loop
      update public.consortium_assemblies set status = v_step where id = p_assembly_id;
    end loop;
  end if;

  if p_retification_id is not null then
    update public.consortium_retifications
      set new_run_id = v_run_id, new_result_hash = p_run->>'result_hash', status = 'APPLIED'
      where id = p_retification_id and status = 'APPROVED';
    if not found then raise exception 'Retificação não está aprovada.'; end if;
  end if;

  insert into public.consortium_engine_events (organization_id, group_id, assembly_id, entity_type, entity_id, event_type, payload)
  values (v_a.organization_id, v_a.group_id, p_assembly_id, 'draw_run', v_run_id,
          case when p_retification_id is null then 'CALCULATION_' || v_phase else 'RETIFICATION_CALCULATION_' || v_phase end,
          jsonb_build_object('run_number', v_run_number, 'input_hash', p_run->>'input_hash',
                             'result_hash', p_run->>'result_hash', 'superseded_run_id', v_prev_id,
                             'contemplations', jsonb_array_length(coalesce(p_contemplations, '[]'::jsonb))));
  return v_run_id;
end;
$$;

-- Homologação: contemplações vigentes → HOMOLOGATED; assembleia →
-- COMPLETED; reflete na cota (e no contrato, só se ainda sem data —
-- nunca sobrescreve). NÃO libera crédito: isso é outro processo.
create or replace function public.consortium_homologate(p_assembly_id uuid)
returns integer
language plpgsql set search_path to 'public'
as $$
declare
  v_a public.consortium_assemblies%rowtype;
  v_count integer := 0;
  r record;
begin
  select * into v_a from public.consortium_assemblies where id = p_assembly_id for update;
  if not found then raise exception 'Assembleia não encontrada.'; end if;
  if v_a.status not in ('HOMOLOGATION','RETIFIED') then
    raise exception 'Homologação exige assembleia em HOMOLOGATION ou RETIFIED (está em %).', v_a.status;
  end if;
  if not consortium_can_govern(v_a.organization_id) then
    raise exception 'Homologar exige papel de governança.';
  end if;

  for r in
    select c.id, c.quota_id, c.quota_number, c.method, q.contract_id
      from public.consortium_contemplations c
      join public.consortium_draw_runs d on d.id = c.run_id and d.status = 'CURRENT'
      left join public.consortium_quotas q on q.id = c.quota_id
     where c.assembly_id = p_assembly_id and c.status = 'PROVISIONAL'
  loop
    update public.consortium_contemplations
      set status = 'HOMOLOGATED', homologated_by = auth.uid(), homologated_at = now()
      where id = r.id;
    if r.quota_id is not null then
      update public.consortium_quotas
        set contemplated_at = v_a.assembly_date, contemplation_method = r.method
        where id = r.quota_id and contemplated_at is null;
    end if;
    if r.contract_id is not null then
      update public.consortium_contracts set contemplated_at = v_a.assembly_date
        where id = r.contract_id and contemplated_at is null;
      insert into public.consortium_events (consortium_contract_id, event_type, event_date, description, metadata)
      values (r.contract_id, 'contemplation', v_a.assembly_date,
              'Contemplação homologada na assembleia ' || v_a.assembly_number || ' (cota ' || r.quota_number || ').',
              jsonb_build_object('assemblyId', p_assembly_id, 'method', r.method, 'quotaNumber', r.quota_number));
    end if;
    v_count := v_count + 1;
  end loop;

  -- Quotas cuja contemplação foi anulada por retificação voltam a não contempladas.
  update public.consortium_quotas q set contemplated_at = null, contemplation_method = null
   where q.group_id = v_a.group_id and q.contemplated_at = v_a.assembly_date
     and exists (select 1 from public.consortium_contemplations c
                  where c.assembly_id = p_assembly_id and c.quota_id = q.id and c.status = 'VOIDED')
     and not exists (select 1 from public.consortium_contemplations c
                  where c.assembly_id = p_assembly_id and c.quota_id = q.id and c.status = 'HOMOLOGATED');

  update public.consortium_assemblies
    set status = case when v_a.status = 'HOMOLOGATION' then 'COMPLETED' else 'LOCKED' end,
        homologated_by = auth.uid(), homologated_at = now(),
        locked_at = case when v_a.status = 'RETIFIED' then now() else locked_at end
    where id = p_assembly_id;

  insert into public.consortium_engine_events (organization_id, group_id, assembly_id, entity_type, entity_id, event_type, payload)
  values (v_a.organization_id, v_a.group_id, p_assembly_id, 'assembly', p_assembly_id,
          case when v_a.status = 'RETIFIED' then 'RETIFICATION_HOMOLOGATED' else 'HOMOLOGATED' end,
          jsonb_build_object('contemplations', v_count));
  return v_count;
end;
$$;

-- ────────────────────────────────────────────────────────────────
-- Permissões granulares (catálogo) — pra Administração enxergar.
-- ────────────────────────────────────────────────────────────────
insert into public.permissions (code, name, description) values
  ('consortium_engine.read', 'Visualizar motor de consórcios', 'Grupos, regras, assembleias, apurações e auditoria do motor.'),
  ('consortium_engine.operate', 'Operar motor de consórcios', 'Criar grupos/assembleias, importar resultado oficial e executar apuração.'),
  ('consortium_engine.govern', 'Governar motor de consórcios', 'Aprovar/publicar regras, verificar resultado, homologar e aprovar retificação.')
on conflict (code) do nothing;

notify pgrst, 'reload schema';
