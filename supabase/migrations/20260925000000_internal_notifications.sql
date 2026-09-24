-- Notificações internas do Primo Invest.
--
-- Reaproveita a tabela `notifications` (já existente, vazia até aqui).
-- Cada pessoa só vê as próprias (RLS atual: user_id = auth.uid()); por
-- isso notificações PARA OUTRAS PESSOAS são criadas por gatilhos no
-- banco, via função SECURITY DEFINER que confere se remetente e
-- destinatário são da mesma organização. Nada aqui altera dado de
-- negócio: só avisa quem precisa agir.

alter table public.notifications
  add column if not exists href text,
  add column if not exists severity text not null default 'info',
  add column if not exists source_module text,
  add column if not exists dedupe_key text;

alter table public.notifications drop constraint if exists notifications_severity_check;
alter table public.notifications add constraint notifications_severity_check
  check (severity = ANY (ARRAY['info','aviso','critico']));

create unique index if not exists notifications_user_dedupe_key
  on public.notifications (user_id, dedupe_key) where dedupe_key is not null;
create index if not exists idx_notifications_user_unread
  on public.notifications (user_id, read_at, created_at desc);

-- Envia UMA notificação. Ignora duplicata (mesma dedupe_key) e
-- destinatário fora da organização.
create or replace function public.notify_user(
  p_org uuid, p_user uuid, p_title text, p_message text, p_type text,
  p_href text default null, p_severity text default 'info', p_module text default null,
  p_dedupe text default null, p_metadata jsonb default '{}'::jsonb
) returns void
language plpgsql security definer set search_path to 'public'
as $$
begin
  if p_user is null then return; end if;
  -- Quem dispara precisa ser da organização (gatilhos rodam como o usuário da sessão).
  if auth.uid() is not null and not is_org_member(p_org) then return; end if;
  if not exists (select 1 from organization_members where organization_id = p_org and user_id = p_user and status = 'active') then
    return;
  end if;
  insert into notifications (organization_id, user_id, title, message, notification_type, href, severity, source_module, dedupe_key, metadata)
  values (p_org, p_user, p_title, p_message, p_type, p_href, coalesce(p_severity, 'info'), p_module, p_dedupe, coalesce(p_metadata, '{}'::jsonb))
  on conflict (user_id, dedupe_key) where dedupe_key is not null do nothing;
end;
$$;

-- Envia para todos os membros ativos com um dos papéis (menos quem agiu).
create or replace function public.notify_roles(
  p_org uuid, p_roles app_role[], p_title text, p_message text, p_type text,
  p_href text default null, p_severity text default 'info', p_module text default null,
  p_dedupe text default null, p_metadata jsonb default '{}'::jsonb
) returns void
language plpgsql security definer set search_path to 'public'
as $$
declare
  m record;
begin
  for m in
    select user_id from organization_members
     where organization_id = p_org and status = 'active' and role = any(p_roles)
       and user_id is distinct from auth.uid()
  loop
    perform notify_user(p_org, m.user_id, p_title, p_message, p_type, p_href, p_severity, p_module,
                        case when p_dedupe is null then null else p_dedupe end, p_metadata);
  end loop;
end;
$$;

revoke execute on function public.notify_roles(uuid, app_role[], text, text, text, text, text, text, text, jsonb) from public, anon;

-- ────────────────────────────────────────────────────────────────
-- Gatilhos: quem precisa agir é avisado.
-- ────────────────────────────────────────────────────────────────

-- Tarefa atribuída a alguém (que não seja quem atribuiu).
create or replace function public.notify_task_assignment()
returns trigger language plpgsql security definer set search_path to 'public'
as $$
begin
  if NEW.assigned_to is not null
     and (TG_OP = 'INSERT' or NEW.assigned_to is distinct from OLD.assigned_to)
     and NEW.assigned_to is distinct from auth.uid() then
    perform notify_user(NEW.organization_id, NEW.assigned_to,
      'Nova tarefa para você', NEW.title, 'tarefa_atribuida', '/tarefas', 'info', 'Tarefas',
      'tarefa:' || NEW.id || ':' || NEW.assigned_to, jsonb_build_object('taskId', NEW.id));
  end if;
  return NEW;
end;
$$;
drop trigger if exists trg_notify_task_assignment on public.tasks;
create trigger trg_notify_task_assignment after insert or update of assigned_to on public.tasks
  for each row execute function notify_task_assignment();

-- Lead atribuído a um assessor.
create or replace function public.notify_lead_assignment()
returns trigger language plpgsql security definer set search_path to 'public'
as $$
begin
  if NEW.assigned_advisor_id is not null
     and (TG_OP = 'INSERT' or NEW.assigned_advisor_id is distinct from OLD.assigned_advisor_id)
     and NEW.assigned_advisor_id is distinct from auth.uid() then
    perform notify_user(NEW.organization_id, NEW.assigned_advisor_id,
      'Novo lead para você', NEW.name, 'lead_atribuido', '/leads/' || NEW.id, 'info', 'Leads',
      'lead:' || NEW.id || ':' || NEW.assigned_advisor_id, jsonb_build_object('leadId', NEW.id));
  end if;
  return NEW;
end;
$$;
drop trigger if exists trg_notify_lead_assignment on public.leads;
create trigger trg_notify_lead_assignment after insert or update of assigned_advisor_id on public.leads
  for each row execute function notify_lead_assignment();

-- Oportunidade atribuída a um assessor.
create or replace function public.notify_opportunity_assignment()
returns trigger language plpgsql security definer set search_path to 'public'
as $$
begin
  if NEW.assigned_advisor_id is not null
     and (TG_OP = 'INSERT' or NEW.assigned_advisor_id is distinct from OLD.assigned_advisor_id)
     and NEW.assigned_advisor_id is distinct from auth.uid() then
    perform notify_user(NEW.organization_id, NEW.assigned_advisor_id,
      'Nova oportunidade para você', NEW.title, 'oportunidade_atribuida', '/oportunidades/' || NEW.id, 'info', 'Oportunidades',
      'oportunidade:' || NEW.id || ':' || NEW.assigned_advisor_id, jsonb_build_object('opportunityId', NEW.id));
  end if;
  return NEW;
end;
$$;
drop trigger if exists trg_notify_opportunity_assignment on public.opportunities;
create trigger trg_notify_opportunity_assignment after insert or update of assigned_advisor_id on public.opportunities
  for each row execute function notify_opportunity_assignment();

-- Documento solicitado: avisa quem pediu quando o documento chega/é decidido.
create or replace function public.notify_document_request()
returns trigger language plpgsql security definer set search_path to 'public'
as $$
begin
  if TG_OP = 'UPDATE' and NEW.status is distinct from OLD.status and NEW.requested_by is not null
     and NEW.status in ('recebido','aprovado','reprovado') then
    perform notify_user(NEW.organization_id, NEW.requested_by,
      case NEW.status when 'recebido' then 'Documento recebido' when 'aprovado' then 'Documento aprovado' else 'Documento reprovado' end,
      NEW.title, 'documento_' || NEW.status, '/documentos/documentos',
      case when NEW.status = 'reprovado' then 'aviso' else 'info' end, 'Documentos',
      'docreq:' || NEW.id || ':' || NEW.status, jsonb_build_object('requestId', NEW.id));
  end if;
  if NEW.responsible_id is not null and (TG_OP = 'INSERT' or NEW.responsible_id is distinct from OLD.responsible_id) then
    perform notify_user(NEW.organization_id, NEW.responsible_id,
      'Documento sob sua responsabilidade', NEW.title, 'documento_responsavel', '/documentos/documentos', 'info', 'Documentos',
      'docresp:' || NEW.id || ':' || NEW.responsible_id, jsonb_build_object('requestId', NEW.id));
  end if;
  return NEW;
end;
$$;
drop trigger if exists trg_notify_document_request on public.document_requests;
create trigger trg_notify_document_request after insert or update on public.document_requests
  for each row execute function notify_document_request();

-- Pagamentos: comprovante que precisa de revisão humana ou virou exceção.
create or replace function public.notify_payment_evidence()
returns trigger language plpgsql security definer set search_path to 'public'
as $$
begin
  if NEW.status::text in ('aguardando_revisao','excecao') and (TG_OP = 'INSERT' or NEW.status is distinct from OLD.status) then
    perform notify_roles(NEW.organization_id, array['admin','manager','finance','operations']::app_role[],
      case when NEW.status::text = 'excecao' then 'Pagamento com exceção' else 'Pagamento aguardando revisão' end,
      'Um comprovante precisa de conferência manual.', 'pagamento_' || NEW.status::text, '/pagamentos',
      case when NEW.status::text = 'excecao' then 'aviso' else 'info' end, 'Pagamentos',
      'pagamento:' || NEW.id || ':' || NEW.status::text, jsonb_build_object('evidenceId', NEW.id));
  end if;
  return NEW;
end;
$$;
drop trigger if exists trg_notify_payment_evidence on public.payment_evidences;
create trigger trg_notify_payment_evidence after insert or update of status on public.payment_evidences
  for each row execute function notify_payment_evidence();

-- Consórcios: regra aguardando aprovação / publicada.
create or replace function public.notify_consortium_rule()
returns trigger language plpgsql security definer set search_path to 'public'
as $$
begin
  if NEW.status is distinct from OLD.status then
    if NEW.status = 'REVIEW' then
      perform notify_roles(NEW.organization_id, array['admin','manager','compliance']::app_role[],
        'Regra aguardando aprovação', NEW.name || ' v' || NEW.version, 'regra_revisao',
        '/consorcios/motor/regras/' || NEW.id, 'aviso', 'Consórcios',
        'regra:' || NEW.id || ':REVIEW', jsonb_build_object('ruleId', NEW.id));
    elsif NEW.status = 'PUBLISHED' and NEW.created_by is not null then
      perform notify_user(NEW.organization_id, NEW.created_by,
        'Regra publicada', NEW.name || ' v' || NEW.version, 'regra_publicada',
        '/consorcios/motor/regras/' || NEW.id, 'info', 'Consórcios',
        'regra:' || NEW.id || ':PUBLISHED', jsonb_build_object('ruleId', NEW.id));
    end if;
  end if;
  return NEW;
end;
$$;
drop trigger if exists trg_notify_consortium_rule on public.consortium_draw_rules;
create trigger trg_notify_consortium_rule after update of status on public.consortium_draw_rules
  for each row execute function notify_consortium_rule();

-- Consórcios: resultado oficial aguardando verificação.
create or replace function public.notify_consortium_lottery()
returns trigger language plpgsql security definer set search_path to 'public'
as $$
begin
  if NEW.verification_status = 'PENDING' then
    perform notify_roles(NEW.organization_id, array['admin','manager','compliance']::app_role[],
      'Resultado oficial aguardando verificação', 'Concurso ' || NEW.contest_number || ' de ' || to_char(NEW.draw_date, 'DD/MM/YYYY'),
      'resultado_pendente', '/consorcios/motor', 'aviso', 'Consórcios',
      'loteria:' || NEW.id, jsonb_build_object('resultId', NEW.id));
  end if;
  return NEW;
end;
$$;
drop trigger if exists trg_notify_consortium_lottery on public.consortium_lottery_results;
create trigger trg_notify_consortium_lottery after insert on public.consortium_lottery_results
  for each row execute function notify_consortium_lottery();

-- Consórcios: assembleia aguardando homologação.
create or replace function public.notify_consortium_assembly()
returns trigger language plpgsql security definer set search_path to 'public'
as $$
begin
  if NEW.status is distinct from OLD.status and NEW.status in ('HOMOLOGATION','RETIFIED') then
    perform notify_roles(NEW.organization_id, array['admin','manager','compliance']::app_role[],
      case when NEW.status = 'RETIFIED' then 'Retificação aguardando homologação' else 'Assembleia aguardando homologação' end,
      'Assembleia nº ' || NEW.assembly_number || ' de ' || to_char(NEW.assembly_date, 'DD/MM/YYYY'),
      'assembleia_homologacao', '/consorcios/motor/assembleias/' || NEW.id, 'aviso', 'Consórcios',
      'assembleia:' || NEW.id || ':' || NEW.status || ':' || coalesce(to_char(NEW.updated_at, 'YYYYMMDDHH24MISS'), ''), jsonb_build_object('assemblyId', NEW.id));
  end if;
  return NEW;
end;
$$;
drop trigger if exists trg_notify_consortium_assembly on public.consortium_assemblies;
create trigger trg_notify_consortium_assembly after update of status on public.consortium_assemblies
  for each row execute function notify_consortium_assembly();

-- Consórcios: retificação solicitada (governança) e decidida (solicitante).
create or replace function public.notify_consortium_retification()
returns trigger language plpgsql security definer set search_path to 'public'
as $$
begin
  if TG_OP = 'INSERT' then
    perform notify_roles(NEW.organization_id, array['admin','manager','compliance']::app_role[],
      'Retificação solicitada', NEW.reason, 'retificacao_solicitada',
      '/consorcios/motor/assembleias/' || NEW.assembly_id, 'critico', 'Consórcios',
      'retificacao:' || NEW.id || ':REQUESTED', jsonb_build_object('retificationId', NEW.id));
  elsif NEW.status is distinct from OLD.status and NEW.status in ('APPROVED','REJECTED') and NEW.requested_by is not null then
    perform notify_user(NEW.organization_id, NEW.requested_by,
      case when NEW.status = 'APPROVED' then 'Retificação aprovada' else 'Retificação rejeitada' end,
      coalesce(NEW.decision_notes, NEW.reason), 'retificacao_decidida',
      '/consorcios/motor/assembleias/' || NEW.assembly_id, 'aviso', 'Consórcios',
      'retificacao:' || NEW.id || ':' || NEW.status, jsonb_build_object('retificationId', NEW.id));
  end if;
  return NEW;
end;
$$;
drop trigger if exists trg_notify_consortium_retification on public.consortium_retifications;
create trigger trg_notify_consortium_retification after insert or update of status on public.consortium_retifications
  for each row execute function notify_consortium_retification();

-- Consórcios: achado crítico/alto da inteligência.
create or replace function public.notify_consortium_finding()
returns trigger language plpgsql security definer set search_path to 'public'
as $$
begin
  if NEW.severity in ('CRITICAL','HIGH') and (TG_OP = 'INSERT' or (OLD.status in ('RESOLVED','DISMISSED') and NEW.status = 'OPEN')) then
    perform notify_roles(NEW.organization_id, array['admin','manager','compliance']::app_role[],
      case when NEW.severity = 'CRITICAL' then 'Anomalia crítica detectada' else 'Alerta importante no motor de consórcios' end,
      NEW.title, 'achado_inteligencia', '/consorcios/motor/inteligencia',
      case when NEW.severity = 'CRITICAL' then 'critico' else 'aviso' end, 'Consórcios',
      'achado:' || NEW.id || ':' || NEW.occurrences, jsonb_build_object('findingId', NEW.id));
  end if;
  return NEW;
end;
$$;
drop trigger if exists trg_notify_consortium_finding on public.consortium_intelligence_findings;
create trigger trg_notify_consortium_finding after insert or update of status on public.consortium_intelligence_findings
  for each row execute function notify_consortium_finding();

-- Consórcios: crédito aguardando aprovação.
create or replace function public.notify_consortium_credit()
returns trigger language plpgsql security definer set search_path to 'public'
as $$
begin
  if NEW.status is distinct from OLD.status and NEW.status = 'UNDER_ANALYSIS' then
    perform notify_roles(NEW.organization_id, array['admin','manager','compliance']::app_role[],
      'Crédito aguardando aprovação', 'Operação de crédito em análise.', 'credito_analise',
      '/consorcios/motor/credito/' || NEW.id, 'aviso', 'Consórcios',
      'credito:' || NEW.id || ':UNDER_ANALYSIS', jsonb_build_object('creditOperationId', NEW.id));
  end if;
  return NEW;
end;
$$;
drop trigger if exists trg_notify_consortium_credit on public.consortium_credit_operations;
create trigger trg_notify_consortium_credit after update of status on public.consortium_credit_operations
  for each row execute function notify_consortium_credit();

-- Tempo real: o sino atualiza sozinho quando chega notificação.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

notify pgrst, 'reload schema';
