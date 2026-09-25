-- Sorteio próprio amarrado à regra publicada.
--
-- A quantidade de números e de algarismos não é mais informada por
-- quem sorteia: vem da regra da assembleia (config.prizeCount e
-- config.prizeDigits). E o sorteio só acontece se a regra disser que a
-- fonte é o sorteio próprio — grupo de Loteria Federal nunca usa roleta.

drop function if exists public.consortium_own_draw_reveal(uuid, text, integer, integer);

create or replace function public.consortium_own_draw_reveal(p_assembly_id uuid, p_phrase text)
returns uuid
language plpgsql security definer set search_path to 'public'
as $$
declare
  v_a public.consortium_assemblies%rowtype;
  v_r public.consortium_draw_rules%rowtype;
  v_d public.consortium_own_draws%rowtype;
  v_count integer;
  v_digits integer;
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
    raise exception 'O sorteio acontece com a elegibilidade travada e antes de travar o resultado.';
  end if;
  select * into v_r from public.consortium_draw_rules where id = v_a.rule_id;
  if not found then raise exception 'A assembleia ainda não tem regra definida.'; end if;
  if v_r.source <> 'OWN_DRAW' then
    raise exception 'A regra desta assembleia usa outra fonte de sorteio. A roleta só vale para regra de sorteio próprio.';
  end if;
  v_count := (v_r.config->>'prizeCount')::integer;
  v_digits := (v_r.config->>'prizeDigits')::integer;
  if v_count is null or v_digits is null or v_count < 1 or v_count > 10 or v_digits < 3 or v_digits > 8 then
    raise exception 'A regra precisa definir de 1 a 10 números com 3 a 8 algarismos cada.';
  end if;

  select * into v_d from public.consortium_own_draws where assembly_id = p_assembly_id for update;
  if not found then raise exception 'Registre o selo prévio antes do sorteio.'; end if;
  if v_d.revealed_at is not null then raise exception 'O sorteio desta assembleia já foi realizado.'; end if;

  select seed_hex into v_seed from public.consortium_own_draw_secrets where own_draw_id = v_d.id;
  v_entropy := coalesce(nullif(trim(p_phrase), ''), 'sem frase') || ' | ' || to_char(v_now at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  v_prizes := consortium_own_draw_derive(v_seed, v_entropy, v_count, v_digits);
  v_contest := 'SP-' || to_char(v_a.assembly_date, 'YYYYMMDD') || '-' || v_a.assembly_number;

  insert into public.consortium_lottery_results (
    organization_id, source, contest_number, draw_date, prizes, prize_digits, source_reference,
    retrieved_at, evidence_notes, verification_status, validation_errors, content_hash, origin, verified_by, verified_at, created_by
  ) values (
    v_a.organization_id, 'OWN_DRAW', v_contest, v_a.assembly_date, v_prizes, v_digits,
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
    prize_count = v_count, prize_digits = v_digits, public_phrase = nullif(trim(p_phrase), ''),
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
