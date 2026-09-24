-- Consolidação do núcleo de consórcios — completa o ciclo depois da
-- contemplação (crédito, documentação, garantias, razão financeiro:
-- uso de crédito, amortização, quitação) e alinha o vocabulário.
--
-- NÃO duplica nada da Fase 1:
--   - resultado/trace do cálculo continuam em consortium_draw_runs;
--   - snapshots continuam em consortium_assembly_snapshots;
--   - parcelas/pagamentos continuam em consortium_installments (+ Payment Engine);
--   - documentos continuam em documents/document_requests (vínculo
--     polimórfico entity_type/entity_id que document_requests já tem).
--
-- NENHUMA tabela nova referencia `clients` (evita a ambiguidade de
-- embed do PostgREST — incidente da segunda FK). Cliente = cota →
-- contrato → cliente.

-- ────────────────────────────────────────────────────────────────
-- 1. Group Engine — atributos do grupo e status completos
-- ────────────────────────────────────────────────────────────────
alter table public.consortium_groups
  add column if not exists constituted_at date,
  add column if not exists participants_count integer check (participants_count is null or participants_count >= 0),
  add column if not exists term_months integer check (term_months is null or term_months > 0),
  add column if not exists installment_amount numeric check (installment_amount is null or installment_amount >= 0),
  add column if not exists adjustment_index text,
  add column if not exists admin_fee_percentage numeric check (admin_fee_percentage is null or admin_fee_percentage between 0 and 100),
  add column if not exists reserve_fund_percentage numeric check (reserve_fund_percentage is null or reserve_fund_percentage between 0 and 100),
  add column if not exists insurance_required boolean not null default false;

alter table public.consortium_groups drop constraint if exists consortium_groups_status_check;
alter table public.consortium_groups add constraint consortium_groups_status_check
  check (status = ANY (ARRAY['FORMING','ACTIVE','SUSPENDED','CLOSED','CANCELLED','ARCHIVED']));

-- ────────────────────────────────────────────────────────────────
-- 2. Contemplação — vocabulário da especificação (0 linhas hoje)
--    Tipos:   DRAW, DRAW_CANCELLED, FREE_BID, FIXED_BID, EMBEDDED_BID
--    Estados: PENDING, SELECTED, HOMOLOGATED, CANCELLED, RETAINED, RETIRED
-- ────────────────────────────────────────────────────────────────
alter table public.consortium_contemplations drop constraint if exists consortium_contemplations_method_check;
alter table public.consortium_contemplations drop constraint if exists consortium_contemplations_status_check;
update public.consortium_contemplations set method = case method
  when 'BID_FREE' then 'FREE_BID' when 'BID_FIXED' then 'FIXED_BID' when 'BID_EMBEDDED' then 'EMBEDDED_BID' else method end;
update public.consortium_contemplations set status = case status
  when 'PROVISIONAL' then 'SELECTED' when 'VOIDED' then 'CANCELLED' else status end;
alter table public.consortium_contemplations alter column status set default 'SELECTED';
alter table public.consortium_contemplations add constraint consortium_contemplations_method_check
  check (method = ANY (ARRAY['DRAW','DRAW_CANCELLED','FREE_BID','FIXED_BID','EMBEDDED_BID']));
alter table public.consortium_contemplations add constraint consortium_contemplations_status_check
  check (status = ANY (ARRAY['PENDING','SELECTED','HOMOLOGATED','CANCELLED','RETAINED','RETIRED']));
alter table public.consortium_contemplations rename column voided_reason to status_reason;

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
    if (to_jsonb(NEW) - array['status','homologated_by','homologated_at','status_reason'])
         = (to_jsonb(OLD) - array['status','homologated_by','homologated_at','status_reason'])
       and (OLD.status, NEW.status) in (
         ('PENDING','SELECTED'), ('PENDING','CANCELLED'),
         ('SELECTED','HOMOLOGATED'), ('SELECTED','CANCELLED'),
         ('HOMOLOGATED','CANCELLED'), ('HOMOLOGATED','RETAINED'), ('HOMOLOGATED','RETIRED'),
         ('RETAINED','HOMOLOGATED'), ('RETAINED','RETIRED')
       ) then
      return NEW;
    end if;
  end if;

  raise exception 'Registro de % é imutável. Use retificação — nunca sobrescreva.', TG_TABLE_NAME;
end;
$$;

-- ────────────────────────────────────────────────────────────────
-- 3. Registro de números apurados (NUMBER, QUOTA, TYPE, RULE_VERSION)
--    Cada tentativa do sorteio vira linha consultável — sem virar cota.
-- ────────────────────────────────────────────────────────────────
create table public.consortium_draw_numbers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assembly_id uuid not null references public.consortium_assemblies(id) on delete restrict,
  run_id uuid not null references public.consortium_draw_runs(id) on delete restrict,
  attempt integer not null,
  -- Número como apareceu (texto: preserva zeros).
  number_text text not null,
  number_type text not null check (number_type = ANY (ARRAY['CANDIDATE','EQUIVALENT_NUMBER','APPROXIMATION','FALLBACK'])),
  candidate_order integer,
  -- A cota PRIMÁRIA testada (nunca o número equivalente).
  quota_number integer,
  outcome text not null check (outcome = ANY (ARRAY['ELIGIBLE','INELIGIBLE','ELIMINATED','SELECTED'])),
  reason text,
  rule_id uuid not null references public.consortium_draw_rules(id) on delete restrict,
  rule_version integer not null,
  created_at timestamptz not null default now(),
  unique (run_id, attempt)
);

create index idx_consortium_draw_numbers_assembly on public.consortium_draw_numbers (assembly_id, attempt);
create index idx_consortium_draw_numbers_quota on public.consortium_draw_numbers (organization_id, quota_number);

create trigger trg_consortium_draw_numbers_immutable
  before update or delete on public.consortium_draw_numbers
  for each row execute function consortium_immutable_guard();

-- ────────────────────────────────────────────────────────────────
-- 4. Credit Engine — direito ao crédito ≠ contemplação ≠ pagamento
-- ────────────────────────────────────────────────────────────────
create table public.consortium_credit_operations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contemplation_id uuid not null unique references public.consortium_contemplations(id) on delete restrict,
  quota_id uuid references public.consortium_quotas(id) on delete set null,
  contract_id uuid references public.consortium_contracts(id) on delete set null,
  contracted_credit numeric not null check (contracted_credit >= 0),
  updated_credit numeric not null check (updated_credit >= 0),
  bid_amount numeric not null default 0 check (bid_amount >= 0),
  embedded_bid_amount numeric not null default 0 check (embedded_bid_amount >= 0),
  -- Crédito líquido: sempre derivado, nunca digitado.
  net_available_credit numeric generated always as (updated_credit - embedded_bid_amount) stored,
  used_credit numeric not null default 0 check (used_credit >= 0),
  remaining_credit numeric generated always as (updated_credit - embedded_bid_amount - used_credit) stored,
  status text not null default 'PENDING_DOCUMENTS' check (status = ANY (ARRAY[
    'PENDING_DOCUMENTS','UNDER_ANALYSIS','APPROVED','AVAILABLE','PARTIALLY_USED','USED','CLOSED','CANCELLED'
  ])),
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  available_at timestamptz,
  closed_at timestamptz,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (embedded_bid_amount <= bid_amount),
  check (embedded_bid_amount <= updated_credit),
  check (used_credit <= updated_credit - embedded_bid_amount)
);

create index idx_consortium_credit_operations_org on public.consortium_credit_operations (organization_id, status);
create index idx_consortium_credit_operations_contract on public.consortium_credit_operations (contract_id) where contract_id is not null;

create or replace function public.consortium_credit_guard()
returns trigger language plpgsql set search_path to 'public'
as $$
declare
  v_allowed boolean;
  v_blocking integer;
begin
  if TG_OP = 'DELETE' then
    raise exception 'Operação de crédito não pode ser excluída — use cancelamento.';
  end if;
  if NEW.contracted_credit is distinct from OLD.contracted_credit
     or NEW.contemplation_id is distinct from OLD.contemplation_id then
    raise exception 'Crédito contratado e contemplação de origem não podem ser alterados.';
  end if;
  if NEW.status is distinct from OLD.status then
    v_allowed := (OLD.status, NEW.status) in (
      ('PENDING_DOCUMENTS','UNDER_ANALYSIS'), ('UNDER_ANALYSIS','PENDING_DOCUMENTS'),
      ('UNDER_ANALYSIS','APPROVED'), ('APPROVED','AVAILABLE'),
      ('AVAILABLE','PARTIALLY_USED'), ('AVAILABLE','USED'), ('PARTIALLY_USED','USED'),
      ('USED','CLOSED'), ('AVAILABLE','CLOSED'), ('PARTIALLY_USED','CLOSED'),
      ('PENDING_DOCUMENTS','CANCELLED'), ('UNDER_ANALYSIS','CANCELLED'), ('APPROVED','CANCELLED')
    );
    if not v_allowed then
      raise exception 'Transição de crédito inválida: % → %.', OLD.status, NEW.status;
    end if;
    if NEW.status in ('APPROVED','AVAILABLE') then
      if not consortium_can_govern(NEW.organization_id) then
        raise exception 'Aprovar ou disponibilizar crédito exige papel de governança.';
      end if;
      -- Só requisito OBRIGATÓRIO (ou CONDICIONAL ativado) bloqueia.
      select count(*) into v_blocking from public.consortium_credit_requirements r
       where r.credit_operation_id = NEW.id
         and r.classification in ('MANDATORY','CONDITIONAL')
         and r.applies
         and r.status not in ('APPROVED','WAIVED')
         and (NEW.status = 'AVAILABLE' or r.stage <> 'RELEASE');
      if v_blocking > 0 then
        raise exception '% requisito(s) obrigatório(s) pendente(s) para %.', v_blocking, NEW.status;
      end if;
      if NEW.status = 'AVAILABLE' and exists (
        select 1 from public.consortium_guarantees g
         where g.credit_operation_id = NEW.id and g.required and g.status <> 'APPROVED'
      ) then
        raise exception 'Garantia exigida ainda não aprovada.';
      end if;
    end if;
  end if;
  return NEW;
end;
$$;

-- ────────────────────────────────────────────────────────────────
-- 5. Documentation Engine — checklist por etapa, classificado
--    (compliance by design: só OBRIGATÓRIO/CONDICIONAL aplicável bloqueia)
-- ────────────────────────────────────────────────────────────────
create table public.consortium_credit_requirements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  credit_operation_id uuid not null references public.consortium_credit_operations(id) on delete restrict,
  stage text not null check (stage = ANY (ARRAY['CONTEMPLATION','ANALYSIS','GUARANTEE','RELEASE'])),
  classification text not null check (classification = ANY (ARRAY['MANDATORY','CONDITIONAL','RECOMMENDED','INFORMATIVE'])),
  -- CONDICIONAL só bloqueia quando a situação exige (applies = true).
  applies boolean not null default true,
  title text not null,
  description text,
  legal_basis text,
  status text not null default 'PENDING' check (status = ANY (ARRAY['PENDING','RECEIVED','APPROVED','REJECTED','WAIVED'])),
  document_id uuid references public.documents(id) on delete set null,
  document_request_id uuid references public.document_requests(id) on delete set null,
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_consortium_credit_requirements_op on public.consortium_credit_requirements (credit_operation_id, stage);

-- ────────────────────────────────────────────────────────────────
-- 6. Guarantee Engine
-- ────────────────────────────────────────────────────────────────
create table public.consortium_guarantees (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  credit_operation_id uuid not null references public.consortium_credit_operations(id) on delete restrict,
  guarantee_type text not null check (guarantee_type = ANY (ARRAY[
    'REAL_ESTATE_FIDUCIARY','VEHICLE_FIDUCIARY','GUARANTOR','PLEDGE','INSURANCE','OTHER'
  ])),
  required boolean not null default true,
  asset_description text,
  appraisal_value numeric check (appraisal_value is null or appraisal_value >= 0),
  appraisal_date date,
  valid_until date,
  status text not null default 'PENDING' check (status = ANY (ARRAY['PENDING','UNDER_ANALYSIS','APPROVED','REJECTED','EXPIRED','RELEASED'])),
  pending_notes text,
  evidence_document_id uuid references public.documents(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_consortium_guarantees_op on public.consortium_guarantees (credit_operation_id);

create or replace function public.consortium_guarantee_guard()
returns trigger language plpgsql set search_path to 'public'
as $$
begin
  if TG_OP = 'DELETE' then
    if OLD.status <> 'PENDING' then raise exception 'Garantia já analisada não pode ser excluída.'; end if;
    return OLD;
  end if;
  if NEW.status is distinct from OLD.status and NEW.status in ('APPROVED','REJECTED','RELEASED')
     and not consortium_can_govern(NEW.organization_id) then
    raise exception 'Decidir garantia exige papel de governança.';
  end if;
  return NEW;
end;
$$;

create trigger trg_consortium_guarantee_guard
  before update or delete on public.consortium_guarantees
  for each row execute function consortium_guarantee_guard();

-- ────────────────────────────────────────────────────────────────
-- 7. Financial Engine — razão append-only (crédito, amortização, quitação)
-- ────────────────────────────────────────────────────────────────
create table public.consortium_financial_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contract_id uuid references public.consortium_contracts(id) on delete restrict,
  credit_operation_id uuid references public.consortium_credit_operations(id) on delete restrict,
  movement_type text not null check (movement_type = ANY (ARRAY[
    'CREDIT_UPDATE','CREDIT_USAGE','CREDIT_USAGE_REVERSAL',
    'AMORTIZATION','SETTLEMENT_PARTIAL','SETTLEMENT_TOTAL'
  ])),
  amount numeric not null check (amount >= 0),
  -- Antes/depois e o cálculo que gerou o movimento (trace do motor).
  details jsonb not null default '{}'::jsonb,
  reference text,
  evidence_document_id uuid references public.documents(id) on delete set null,
  effective_date date not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (contract_id is not null or credit_operation_id is not null)
);

create index idx_consortium_financial_movements_contract on public.consortium_financial_movements (contract_id, effective_date);
create index idx_consortium_financial_movements_credit on public.consortium_financial_movements (credit_operation_id, effective_date);

create trigger trg_consortium_financial_movements_immutable
  before update or delete on public.consortium_financial_movements
  for each row execute function consortium_immutable_guard();

-- Amortização zera parcelas (redução de prazo) com status próprio.
alter table public.consortium_installments drop constraint if exists consortium_installments_status_check;
alter table public.consortium_installments add constraint consortium_installments_status_check
  check (status = ANY (ARRAY['pending','paid','overdue','negotiated','exempt','cancelled','amortized']));

-- ────────────────────────────────────────────────────────────────
-- RLS + auditoria + updated_at nas tabelas novas
-- ────────────────────────────────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'consortium_draw_numbers','consortium_credit_operations','consortium_credit_requirements',
    'consortium_guarantees','consortium_financial_movements'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select using (is_org_member(organization_id))', t || '_read', t);
    execute format('create policy %I on public.%I for insert with check (is_org_member(organization_id) and (consortium_can_operate(organization_id) or consortium_can_govern(organization_id)))', t || '_insert', t);
    execute format('create policy %I on public.%I for update using (is_org_member(organization_id) and (consortium_can_operate(organization_id) or consortium_can_govern(organization_id))) with check (is_org_member(organization_id))', t || '_update', t);
    execute format('create policy %I on public.%I for delete using (is_org_member(organization_id) and (consortium_can_operate(organization_id) or consortium_can_govern(organization_id)))', t || '_delete', t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function write_audit_log()', 'trg_audit_' || t, t);
  end loop;
  foreach t in array array['consortium_credit_operations','consortium_credit_requirements','consortium_guarantees'] loop
    execute format('create trigger %I before update on public.%I for each row execute function set_updated_at()', 'trg_' || t || '_updated_at', t);
  end loop;
end $$;

create trigger trg_consortium_credit_guard
  before update or delete on public.consortium_credit_operations
  for each row execute function consortium_credit_guard();

-- ────────────────────────────────────────────────────────────────
-- Funções atômicas atualizadas pro vocabulário novo
-- ────────────────────────────────────────────────────────────────
create or replace function public.consortium_record_run(
  p_assembly_id uuid,
  p_run jsonb,
  p_contemplations jsonb,
  p_expected_status text,
  p_status_path text[],
  p_retification_id uuid default null,
  p_numbers jsonb default '[]'::jsonb
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
  v_rule_version integer;
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
      set status = 'CANCELLED', status_reason = 'Retificação ' || p_retification_id::text
      where run_id = v_prev_id and status in ('SELECTED','HOMOLOGATED','PENDING');
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
      nullif(c->>'candidate_raw', ''), nullif(c->>'bid_id', '')::uuid, nullif(c->>'credit_amount', '')::numeric
    );
  end loop;

  select version into v_rule_version from public.consortium_draw_rules where id = (p_run->>'rule_id')::uuid;
  insert into public.consortium_draw_numbers (
    organization_id, assembly_id, run_id, attempt, number_text, number_type, candidate_order,
    quota_number, outcome, reason, rule_id, rule_version
  )
  select v_a.organization_id, p_assembly_id, v_run_id, (n->>'attempt')::integer, n->>'number_text', n->>'number_type',
         nullif(n->>'candidate_order', '')::integer, nullif(n->>'quota_number', '')::integer,
         n->>'outcome', nullif(n->>'reason', ''), (p_run->>'rule_id')::uuid, v_rule_version
    from jsonb_array_elements(coalesce(p_numbers, '[]'::jsonb)) n;

  if p_status_path is not null then
    foreach v_step in array p_status_path loop
      update public.consortium_assemblies set status = v_step where id = p_assembly_id;
    end loop;
  end if;

  -- A 1ª gravação (fase DRAW) aplica a retificação; a 2ª (fase BIDS,
  -- recalculada sobre o novo sorteio) só precisa que ela já esteja aplicada.
  if p_retification_id is not null then
    update public.consortium_retifications
      set new_run_id = v_run_id, new_result_hash = p_run->>'result_hash', status = 'APPLIED'
      where id = p_retification_id and status = 'APPROVED';
    if not found and not exists (
      select 1 from public.consortium_retifications
       where id = p_retification_id and status = 'APPLIED' and assembly_id = p_assembly_id
    ) then
      raise exception 'Retificação não está aprovada.';
    end if;
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

drop function if exists public.consortium_record_run(uuid, jsonb, jsonb, text, text[], uuid);

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
     where c.assembly_id = p_assembly_id and c.status = 'SELECTED'
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

  update public.consortium_quotas q set contemplated_at = null, contemplation_method = null
   where q.group_id = v_a.group_id and q.contemplated_at = v_a.assembly_date
     and exists (select 1 from public.consortium_contemplations c
                  where c.assembly_id = p_assembly_id and c.quota_id = q.id and c.status = 'CANCELLED')
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

notify pgrst, 'reload schema';
