-- Sorteio próprio auditável (roleta) — fonte de sorteio alternativa à
-- Loteria Federal, permitida quando o CONTRATO do grupo prevê a forma
-- do sorteio (Circular BCB 3.432/2009 art. 5º, X; Resolução BCB
-- 285/2023). O resultado entra no MESMO motor de apuração: é gravado
-- como "resultado da fonte de sorteio" (source = OWN_DRAW) e segue
-- números apurados → cotas → elegibilidade → substituição.
--
-- Esquema compromisso-revelação (ninguém escolhe nem prevê o resultado):
--   1. SELO PRÉVIO: o banco gera um segredo aleatório (gen_random_bytes)
--      e publica só o sha256 dele. Um por assembleia, sem repetição.
--   2. SORTEIO: depois da elegibilidade congelada, os números nascem de
--      sha256(segredo | frase pública | horário | prêmio | tentativa).
--      A frase é dita pelos participantes na hora.
--   3. CONFERÊNCIA: o segredo é revelado; qualquer pessoa recalcula e
--      confere o selo e os números (lib/consortium-engine/own-draw.ts).
-- O segredo fica numa tabela sem leitura até a revelação.

alter table public.consortium_draw_rules drop constraint if exists consortium_draw_rules_source_check;
alter table public.consortium_draw_rules add constraint consortium_draw_rules_source_check
  check (source = ANY (ARRAY['FEDERAL_LOTTERY','OTHER_REGULATED_SOURCE','OWN_DRAW']));

alter table public.consortium_lottery_results drop constraint if exists consortium_lottery_results_source_check;
alter table public.consortium_lottery_results add constraint consortium_lottery_results_source_check
  check (source = ANY (ARRAY['FEDERAL_LOTTERY','OTHER_REGULATED_SOURCE','OWN_DRAW']));

alter table public.consortium_lottery_results drop constraint if exists consortium_lottery_results_origin_check;
alter table public.consortium_lottery_results add constraint consortium_lottery_results_origin_check
  check (origin = ANY (ARRAY['MANUAL','AUTOMATED_FETCH','OWN_DRAW']));

create table public.consortium_own_draws (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assembly_id uuid not null unique references public.consortium_assemblies(id) on delete restrict,
  commitment_hash text not null,
  committed_at timestamptz not null default now(),
  committed_by uuid references public.profiles(id) on delete set null,
  prize_count integer,
  prize_digits integer,
  public_phrase text,
  public_entropy text,
  revealed_seed text,
  prizes text[],
  revealed_at timestamptz,
  revealed_by uuid references public.profiles(id) on delete set null,
  lottery_result_id uuid references public.consortium_lottery_results(id) on delete restrict
);

create table public.consortium_own_draw_secrets (
  own_draw_id uuid primary key references public.consortium_own_draws(id) on delete cascade,
  seed_hex text not null
);

alter table public.consortium_own_draws enable row level security;
create policy consortium_own_draws_read on public.consortium_own_draws for select using (is_org_member(organization_id));
-- Sem políticas de escrita: só as funções abaixo gravam.
alter table public.consortium_own_draw_secrets enable row level security;
-- Sem nenhuma política: o segredo não é lido por ninguém pela API.

create trigger trg_audit_consortium_own_draws after insert or update or delete on public.consortium_own_draws
  for each row execute function write_audit_log();

-- Derivação determinística (espelhada em TypeScript para conferência).
create or replace function public.consortium_own_draw_derive(p_seed_hex text, p_entropy text, p_count integer, p_digits integer)
returns text[]
language plpgsql immutable set search_path to 'public'
as $$
declare
  v_out text[] := '{}';
  v_hash text;
  v_value text;
  v_attempt integer;
  v_mod bigint := (10::numeric ^ p_digits)::bigint;
begin
  for i in 1..p_count loop
    v_attempt := 0;
    loop
      v_hash := encode(sha256(convert_to(p_seed_hex || '|' || p_entropy || '|' || i || '|' || v_attempt, 'UTF8')), 'hex');
      v_value := lpad(((('x' || substr(v_hash, 1, 15))::bit(60)::bigint) % v_mod)::text, p_digits, '0');
      exit when not (v_value = any(v_out));
      v_attempt := v_attempt + 1;
    end loop;
    v_out := v_out || v_value;
  end loop;
  return v_out;
end;
$$;

-- 1. Selo prévio (uma vez por assembleia, antes do resultado travado).
create or replace function public.consortium_own_draw_commit(p_assembly_id uuid)
returns text
language plpgsql security definer set search_path to 'public'
as $$
declare
  v_a public.consortium_assemblies%rowtype;
  v_seed text;
  v_id uuid;
  v_commit text;
begin
  select * into v_a from public.consortium_assemblies where id = p_assembly_id;
  if not found then raise exception 'Assembleia não encontrada.'; end if;
  if not (consortium_can_operate(v_a.organization_id) or consortium_can_govern(v_a.organization_id)) then
    raise exception 'Seu papel não permite registrar o selo do sorteio.';
  end if;
  if v_a.status not in ('SCHEDULED','PREPARING','ELIGIBILITY_LOCKED') then
    raise exception 'O selo prévio precisa ser registrado antes de travar o resultado da assembleia.';
  end if;
  if exists (select 1 from public.consortium_own_draws where assembly_id = p_assembly_id) then
    raise exception 'Esta assembleia já tem selo prévio registrado. Ele não pode ser trocado.';
  end if;
  v_seed := encode(extensions.gen_random_bytes(32), 'hex');
  v_commit := encode(sha256(convert_to(v_seed, 'UTF8')), 'hex');
  insert into public.consortium_own_draws (organization_id, assembly_id, commitment_hash, committed_by)
  values (v_a.organization_id, p_assembly_id, v_commit, auth.uid())
  returning id into v_id;
  insert into public.consortium_own_draw_secrets (own_draw_id, seed_hex) values (v_id, v_seed);
  insert into public.consortium_engine_events (organization_id, group_id, assembly_id, entity_type, entity_id, event_type, payload)
  values (v_a.organization_id, v_a.group_id, p_assembly_id, 'own_draw', v_id, 'OWN_DRAW_COMMITTED', '{}'::jsonb);
  return v_commit;
end;
$$;

-- 2. Sorteio (revelação). Governança; elegibilidade já congelada.
create or replace function public.consortium_own_draw_reveal(p_assembly_id uuid, p_phrase text, p_count integer, p_digits integer)
returns uuid
language plpgsql security definer set search_path to 'public'
as $$
declare
  v_a public.consortium_assemblies%rowtype;
  v_d public.consortium_own_draws%rowtype;
  v_seed text;
  v_entropy text;
  v_prizes text[];
  v_now timestamptz := clock_timestamp();
  v_result_id uuid;
  v_contest text;
begin
  select * into v_a from public.consortium_assemblies where id = p_assembly_id for update;
  if not found then raise exception 'Assembleia não encontrada.'; end if;
  if not consortium_can_govern(v_a.organization_id) then
    raise exception 'Realizar o sorteio próprio exige papel de governança (admin, gestor ou compliance).';
  end if;
  if v_a.status <> 'ELIGIBILITY_LOCKED' then
    raise exception 'O sorteio acontece com a elegibilidade travada e antes de travar o resultado (etapa atual: %).', v_a.status;
  end if;
  select * into v_d from public.consortium_own_draws where assembly_id = p_assembly_id for update;
  if not found then raise exception 'Registre o selo prévio antes do sorteio.'; end if;
  if v_d.revealed_at is not null then raise exception 'O sorteio desta assembleia já foi realizado.'; end if;
  if p_count < 1 or p_count > 10 or p_digits < 3 or p_digits > 8 then
    raise exception 'Quantidade de números ou de algarismos fora do permitido.';
  end if;

  select seed_hex into v_seed from public.consortium_own_draw_secrets where own_draw_id = v_d.id;
  v_entropy := coalesce(nullif(trim(p_phrase), ''), 'sem frase') || ' | ' || to_char(v_now at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  v_prizes := consortium_own_draw_derive(v_seed, v_entropy, p_count, p_digits);
  v_contest := 'SP-' || to_char(v_a.assembly_date, 'YYYYMMDD') || '-' || v_a.assembly_number;

  insert into public.consortium_lottery_results (
    organization_id, source, contest_number, draw_date, prizes, prize_digits, source_reference,
    retrieved_at, evidence_notes, verification_status, validation_errors, content_hash, origin, verified_by, verified_at, created_by
  ) values (
    v_a.organization_id, 'OWN_DRAW', v_contest, v_a.assembly_date, v_prizes, p_digits,
    'Sorteio próprio da assembleia nº ' || v_a.assembly_number,
    v_now, 'Selo prévio conferido; frase pública: ' || coalesce(nullif(trim(p_phrase), ''), 'sem frase'),
    'VERIFIED', '{}'::text[],
    -- Mesmo texto canônico de hashOf({source, contestNumber, drawDate, prizes}) do motor.
    encode(sha256(convert_to(
      '{"contestNumber":"' || v_contest || '","drawDate":"' || to_char(v_a.assembly_date, 'YYYY-MM-DD') ||
      '","prizes":[' || (select string_agg('"' || p || '"', ',' order by ord) from unnest(v_prizes) with ordinality as t(p, ord)) ||
      '],"source":"OWN_DRAW"}', 'UTF8')), 'hex'),
    'OWN_DRAW', auth.uid(), v_now, auth.uid()
  ) returning id into v_result_id;

  update public.consortium_own_draws set
    prize_count = p_count, prize_digits = p_digits, public_phrase = nullif(trim(p_phrase), ''),
    public_entropy = v_entropy, revealed_seed = v_seed, prizes = v_prizes,
    revealed_at = v_now, revealed_by = auth.uid(), lottery_result_id = v_result_id
  where id = v_d.id;

  insert into public.consortium_engine_events (organization_id, group_id, assembly_id, entity_type, entity_id, event_type, payload)
  values (v_a.organization_id, v_a.group_id, p_assembly_id, 'own_draw', v_d.id, 'OWN_DRAW_REVEALED',
          jsonb_build_object('prizes', v_prizes, 'phrase', nullif(trim(p_phrase), '')));
  return v_result_id;
end;
$$;

notify pgrst, 'reload schema';
