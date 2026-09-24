-- Consortium Intelligence Layer (Fase 2) — em cima do Core, nunca no
-- lugar dele. DATA → CORE → AUDIT → INTELIGÊNCIA → ACHADOS → ALERTAS →
-- DECISÃO HUMANA. Nenhuma tabela aqui altera resultado oficial.
--
-- Por que tabelas próprias (e não ai_insights): os achados do motor
-- têm evidência estruturada (fonte, regra, versão, cálculo, dado),
-- deduplicação por impressão digital e revisão humana obrigatória em
-- severidade crítica — conceitos que ai_insights (insights de cliente)
-- não tem. Simulação e log de automação também não existiam.

-- Evidência bruta da fonte (coleta automática) + normalização explícita.
alter table public.consortium_lottery_results
  add column if not exists origin text not null default 'MANUAL' check (origin = ANY (ARRAY['MANUAL','AUTOMATED_FETCH'])),
  add column if not exists raw_payload jsonb,
  add column if not exists normalization_notes text;

-- Achados de inteligência (anomalia, risco, padrão, inconsistência,
-- oportunidade, alerta). Confiança NUNCA altera resultado oficial.
create table public.consortium_intelligence_findings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  fingerprint text not null,
  category text not null check (category = ANY (ARRAY['ANOMALY','RISK','PATTERN','INCONSISTENCY','OPPORTUNITY','ALERT'])),
  severity text not null check (severity = ANY (ARRAY['CRITICAL','HIGH','MEDIUM','LOW'])),
  confidence text not null check (confidence = ANY (ARRAY['HIGH','MEDIUM','LOW'])),
  code text not null,
  title text not null,
  explanation text not null,
  -- SOURCE / RULE / VERSION / CALCULATION / DATA
  evidence jsonb not null default '{}'::jsonb,
  detector text not null,
  requires_human_review boolean not null default false,
  group_id uuid references public.consortium_groups(id) on delete set null,
  assembly_id uuid references public.consortium_assemblies(id) on delete set null,
  entity_type text,
  entity_id uuid,
  status text not null default 'OPEN' check (status = ANY (ARRAY['OPEN','ACKNOWLEDGED','RESOLVED','DISMISSED'])),
  first_detected_at timestamptz not null default now(),
  last_detected_at timestamptz not null default now(),
  occurrences integer not null default 1,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, fingerprint)
);

create index idx_consortium_findings_org_status on public.consortium_intelligence_findings (organization_id, status, severity);
create index idx_consortium_findings_assembly on public.consortium_intelligence_findings (assembly_id) where assembly_id is not null;

-- Revisão humana: crítico só fecha com nota e por governança.
create or replace function public.consortium_finding_guard()
returns trigger language plpgsql set search_path to 'public'
as $$
begin
  if TG_OP = 'DELETE' then
    raise exception 'Achado de inteligência não é excluído — resolva ou descarte com justificativa.';
  end if;
  if NEW.status is distinct from OLD.status and NEW.status in ('RESOLVED','DISMISSED') then
    if OLD.requires_human_review and not consortium_can_govern(NEW.organization_id) then
      raise exception 'Achado que exige revisão humana só pode ser encerrado por governança.';
    end if;
    if coalesce(length(trim(NEW.review_notes)), 0) < 5 then
      raise exception 'Informe a justificativa da revisão.';
    end if;
  end if;
  return NEW;
end;
$$;

create trigger trg_consortium_finding_guard
  before update or delete on public.consortium_intelligence_findings
  for each row execute function consortium_finding_guard();

-- Simulações: SIMULATION_ID, INPUT, RULE, RESULT, CREATED_BY, CREATED_AT.
-- Imutáveis e fisicamente separadas do resultado oficial.
create table public.consortium_simulations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assembly_id uuid references public.consortium_assemblies(id) on delete set null,
  base_run_id uuid references public.consortium_draw_runs(id) on delete set null,
  title text not null,
  scenario jsonb not null,
  input jsonb not null,
  rule jsonb not null,
  result jsonb not null,
  comparison jsonb,
  input_hash text not null,
  result_hash text not null,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index idx_consortium_simulations_org on public.consortium_simulations (organization_id, created_at desc);

create trigger trg_consortium_simulations_immutable
  before update or delete on public.consortium_simulations
  for each row execute function consortium_immutable_guard();

-- Log de toda automação (coleta, validação, monitoramento, relatórios).
create table public.consortium_automation_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job text not null check (job = ANY (ARRAY[
    'LOTTERY_FETCH','LOTTERY_CROSS_CHECK','MONITORING_SCAN','REPRODUCTION_SWEEP','ASSEMBLY_PREPARATION','INTERNAL_REPORT','RULE_EXTRACTION'
  ])),
  trigger_kind text not null default 'MANUAL' check (trigger_kind = ANY (ARRAY['MANUAL','ON_VIEW','SCHEDULED'])),
  status text not null check (status = ANY (ARRAY['SUCCESS','PARTIAL','FAILED'])),
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  started_at timestamptz not null,
  finished_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null default auth.uid()
);

create index idx_consortium_automation_runs_org on public.consortium_automation_runs (organization_id, started_at desc);

create trigger trg_consortium_automation_runs_immutable
  before update or delete on public.consortium_automation_runs
  for each row execute function consortium_immutable_guard();

do $$
declare
  t text;
begin
  foreach t in array array['consortium_intelligence_findings','consortium_simulations','consortium_automation_runs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select using (is_org_member(organization_id))', t || '_read', t);
    execute format('create policy %I on public.%I for insert with check (is_org_member(organization_id) and (consortium_can_operate(organization_id) or consortium_can_govern(organization_id)))', t || '_insert', t);
    execute format('create policy %I on public.%I for update using (is_org_member(organization_id) and (consortium_can_operate(organization_id) or consortium_can_govern(organization_id))) with check (is_org_member(organization_id))', t || '_update', t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function write_audit_log()', 'trg_audit_' || t, t);
  end loop;
end $$;

create trigger trg_consortium_intelligence_findings_updated_at
  before update on public.consortium_intelligence_findings
  for each row execute function set_updated_at();

notify pgrst, 'reload schema';
