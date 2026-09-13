-- Enriquece as oportunidades de teste já existentes e cria mais
-- algumas, cobrindo o pipeline de 7 etapas + ganhas/perdidas em meses
-- diferentes — só pra validação visual do painel executivo, ranking,
-- evolução de fechamento e análise de motivos de perda. Não é dado de
-- produção real.

do $$
declare
  v_org_id uuid := 'd34dae9a-6460-4210-906d-e9a973014436';
  v_advisor_id uuid := 'e34371d0-8f9b-455e-b944-5ee56376dec7';
  v_client_carlos_id uuid;
  v_client_beatriz_id uuid;
  v_client_jose_id uuid;
  v_client_ana_id uuid;
  v_stage_identificada_id uuid;
  v_stage_reuniao_id uuid;
  v_stage_proposta_id uuid;
  v_stage_negociacao_id uuid;
  v_stage_ganha_id uuid;
  v_stage_perdida_id uuid;
begin
  select id into v_client_carlos_id from public.clients where full_name = 'Carlos Eduardo Martins';
  select id into v_client_beatriz_id from public.clients where full_name = 'Beatriz Nascimento';
  select id into v_client_jose_id from public.clients where full_name = 'José Ricardo Pereira';
  select id into v_client_ana_id from public.clients where full_name = 'Ana Luiza Ferreira';

  select id into v_stage_identificada_id from public.opportunity_stages where organization_id = v_org_id and stage_key = 'prospeccao';
  select id into v_stage_reuniao_id from public.opportunity_stages where organization_id = v_org_id and stage_key = 'reuniao';
  select id into v_stage_proposta_id from public.opportunity_stages where organization_id = v_org_id and stage_key = 'proposta';
  select id into v_stage_negociacao_id from public.opportunity_stages where organization_id = v_org_id and stage_key = 'negociacao';
  select id into v_stage_ganha_id from public.opportunity_stages where organization_id = v_org_id and stage_key = 'ganha';
  select id into v_stage_perdida_id from public.opportunity_stages where organization_id = v_org_id and stage_key = 'perdida';

  -- Enriquece as 3 oportunidades já existentes.
  update public.opportunities
  set product = 'Fundos internacionais', source = 'indicação', priority = 'high', probability = 65
  where title = 'Aporte adicional em renda variável';

  update public.opportunities
  set product = 'ETFs internacionais', source = 'evento', priority = 'urgent', probability = 80
  where title = 'Aporte em renda variável internacional';

  update public.opportunities
  set product = 'PGBL', source = 'indicação', priority = 'normal', probability = 45
  where title = 'Complementação de previdência privada';

  -- Novas oportunidades abertas, em etapas variadas.
  insert into public.opportunities (organization_id, client_id, assigned_advisor_id, stage_id, title, opportunity_type, product, source, priority, probability, estimated_value, expected_close_date, status)
  values
    (v_org_id, v_client_ana_id, v_advisor_id, v_stage_identificada_id, 'Reserva de emergência ampliada', 'investimento', 'CDB liquidez diária', 'site', 'low', 20, 15000, current_date + interval '40 days', 'open'),
    (v_org_id, v_client_carlos_id, v_advisor_id, v_stage_reuniao_id, 'Consórcio de imóvel adicional', 'consorcio', 'Consórcio imobiliário', 'whatsapp', 'high', 45, 280000, current_date + interval '10 days', 'open'),
    (v_org_id, v_client_beatriz_id, v_advisor_id, v_stage_negociacao_id, 'Seguro de vida high net worth', 'seguros', 'Seguro de vida premium', 'parceiro', 'urgent', 75, 60000, current_date + interval '5 days', 'open');

  -- Ganhas e perdidas em meses diferentes, pra evolução de fechamento e análise de motivos de perda.
  insert into public.opportunities (organization_id, client_id, assigned_advisor_id, stage_id, title, opportunity_type, product, source, priority, probability, estimated_value, expected_close_date, status, closed_at, created_at)
  values
    (v_org_id, v_client_jose_id, v_advisor_id, v_stage_ganha_id, 'Aporte em CDB isento', 'investimento', 'CDB isento IR', 'indicação', 'normal', 100, 45000, current_date - interval '55 days', 'won', now() - interval '55 days', now() - interval '80 days'),
    (v_org_id, v_client_carlos_id, v_advisor_id, v_stage_ganha_id, 'Consórcio de veículo', 'consorcio', 'Consórcio automóvel', 'site', 'normal', 100, 90000, current_date - interval '20 days', 'won', now() - interval '20 days', now() - interval '50 days');

  insert into public.opportunities (organization_id, client_id, assigned_advisor_id, stage_id, title, opportunity_type, product, source, priority, probability, estimated_value, expected_close_date, status, loss_reason, closed_at, created_at)
  values
    (v_org_id, v_client_ana_id, v_advisor_id, v_stage_perdida_id, 'Plano de previdência família', 'previdencia', 'VGBL', 'campanha', 'normal', 0, 30000, current_date - interval '45 days', 'lost', 'Preço — cliente achou a taxa de administração alta', now() - interval '45 days', now() - interval '70 days'),
    (v_org_id, v_client_beatriz_id, v_advisor_id, v_stage_perdida_id, 'Crédito consignado', 'credito', 'Crédito consignado', 'evento', 'low', 0, 20000, current_date - interval '15 days', 'lost', 'Concorrência — fechou com outro banco', now() - interval '15 days', now() - interval '35 days'),
    (v_org_id, v_client_jose_id, v_advisor_id, v_stage_perdida_id, 'Aporte em fundo imobiliário', 'investimento', 'FII', 'site', 'normal', 0, 25000, current_date - interval '5 days', 'lost', 'Preço — achou a taxa de entrada elevada', now() - interval '5 days', now() - interval '25 days');

  raise notice 'Oportunidades de teste enriquecidas com sucesso.';
end $$;
