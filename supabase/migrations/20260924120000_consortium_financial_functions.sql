-- Operações financeiras atômicas do núcleo de consórcios (SECURITY
-- INVOKER: RLS continua valendo). O cálculo vem do motor TypeScript
-- (lib/consortium-engine/settlement.ts e credit.ts); aqui só se aplica
-- tudo-ou-nada, conferindo que o estado não mudou desde o cálculo.

-- Aplica um plano de parcelas (amortização / quitação) + lança no razão.
create or replace function public.consortium_apply_installment_plan(
  p_contract_id uuid,
  p_changes jsonb,
  p_movement jsonb,
  p_contract_patch jsonb default '{}'::jsonb
) returns uuid
language plpgsql set search_path to 'public'
as $$
declare
  v_org uuid;
  v_id uuid;
  c jsonb;
  v_current record;
begin
  select organization_id into v_org from public.consortium_contracts where id = p_contract_id for update;
  if v_org is null then raise exception 'Contrato não encontrado.'; end if;
  if not (consortium_can_operate(v_org) or consortium_can_govern(v_org)) then
    raise exception 'Sem permissão para operar o financeiro do consórcio.';
  end if;

  for c in select * from jsonb_array_elements(coalesce(p_changes, '[]'::jsonb)) loop
    select amount, status into v_current from public.consortium_installments
      where id = (c->>'id')::uuid and consortium_contract_id = p_contract_id for update;
    if not found then raise exception 'Parcela % não pertence ao contrato.', c->>'id'; end if;
    -- Concorrência otimista: o plano foi calculado sobre este estado.
    if v_current.amount <> (c->'before'->>'amount')::numeric or v_current.status <> c->'before'->>'status' then
      raise exception 'Parcela % mudou desde o cálculo. Recalcule antes de aplicar.', c->>'number';
    end if;
    update public.consortium_installments set
      amount = (c->'after'->>'amount')::numeric,
      status = c->'after'->>'status',
      paid_amount = case when c->'after'->>'status' = 'paid' then (c->'after'->>'amount')::numeric else paid_amount end,
      paid_at = case when c->'after'->>'status' = 'paid' then (p_movement->>'effective_date')::date else paid_at end
    where id = (c->>'id')::uuid;
  end loop;

  insert into public.consortium_financial_movements (
    organization_id, contract_id, credit_operation_id, movement_type, amount, details,
    reference, effective_date, created_by
  ) values (
    v_org, p_contract_id, nullif(p_movement->>'credit_operation_id', '')::uuid,
    p_movement->>'movement_type', (p_movement->>'amount')::numeric, coalesce(p_movement->'details', '{}'::jsonb),
    nullif(p_movement->>'reference', ''), (p_movement->>'effective_date')::date, auth.uid()
  ) returning id into v_id;

  if p_contract_patch ? 'status' then
    update public.consortium_contracts set status = p_contract_patch->>'status' where id = p_contract_id;
  end if;
  update public.consortium_contracts
     set paid_installments = (select count(*) from public.consortium_installments
                               where consortium_contract_id = p_contract_id and status = 'paid')
   where id = p_contract_id;

  insert into public.consortium_events (consortium_contract_id, event_type, event_date, description, metadata)
  values (p_contract_id, lower(p_movement->>'movement_type'), (p_movement->>'effective_date')::date,
          coalesce(p_movement->>'description', p_movement->>'movement_type'),
          jsonb_build_object('movementId', v_id, 'amount', p_movement->'amount'));
  return v_id;
end;
$$;

-- Movimento de crédito (atualização / utilização / estorno) + saldo.
create or replace function public.consortium_record_credit_movement(
  p_credit_operation_id uuid,
  p_movement_type text,
  p_amount numeric,
  p_effective_date date,
  p_reference text,
  p_details jsonb,
  p_expected_used numeric,
  p_expected_updated numeric
) returns uuid
language plpgsql set search_path to 'public'
as $$
declare
  v_op public.consortium_credit_operations%rowtype;
  v_id uuid;
  v_used numeric;
  v_updated numeric;
  v_status text;
begin
  select * into v_op from public.consortium_credit_operations where id = p_credit_operation_id for update;
  if not found then raise exception 'Operação de crédito não encontrada.'; end if;
  if v_op.used_credit <> p_expected_used or v_op.updated_credit <> p_expected_updated then
    raise exception 'Saldo do crédito mudou desde o cálculo. Recalcule.';
  end if;

  v_used := v_op.used_credit;
  v_updated := v_op.updated_credit;
  v_status := v_op.status;

  if p_movement_type = 'CREDIT_USAGE' then
    if v_op.status not in ('AVAILABLE','PARTIALLY_USED') then
      raise exception 'Crédito ainda não está disponível para utilização (status %).', v_op.status;
    end if;
    v_used := v_used + p_amount;
    v_status := case when (v_updated - v_op.embedded_bid_amount - v_used) <= 0.001 then 'USED' else 'PARTIALLY_USED' end;
  elsif p_movement_type = 'CREDIT_USAGE_REVERSAL' then
    if v_op.status in ('CLOSED','CANCELLED') then raise exception 'Crédito encerrado.'; end if;
    if p_amount > v_used then raise exception 'Estorno maior que o valor utilizado.'; end if;
    v_used := v_used - p_amount;
    -- Status não volta "pra trás" (o trigger só permite avançar): o
    -- saldo restante (coluna derivada) é que reflete o estorno.
  elsif p_movement_type = 'CREDIT_UPDATE' then
    if v_op.status in ('CLOSED','CANCELLED','USED') then raise exception 'Crédito encerrado não pode ser atualizado.'; end if;
    v_updated := p_amount;
  else
    raise exception 'Tipo de movimento de crédito inválido: %.', p_movement_type;
  end if;

  update public.consortium_credit_operations
     set used_credit = v_used, updated_credit = v_updated,
         status = v_status
   where id = p_credit_operation_id;

  insert into public.consortium_financial_movements (
    organization_id, contract_id, credit_operation_id, movement_type, amount, details, reference, effective_date, created_by
  ) values (
    v_op.organization_id, v_op.contract_id, p_credit_operation_id, p_movement_type, p_amount,
    coalesce(p_details, '{}'::jsonb) || jsonb_build_object('usedBefore', v_op.used_credit, 'usedAfter', v_used,
      'updatedBefore', v_op.updated_credit, 'updatedAfter', v_updated),
    nullif(p_reference, ''), p_effective_date, auth.uid()
  ) returning id into v_id;

  insert into public.consortium_engine_events (organization_id, entity_type, entity_id, event_type, payload)
  values (v_op.organization_id, 'credit_operation', p_credit_operation_id, p_movement_type,
          jsonb_build_object('movementId', v_id, 'amount', p_amount));
  return v_id;
end;
$$;

notify pgrst, 'reload schema';
