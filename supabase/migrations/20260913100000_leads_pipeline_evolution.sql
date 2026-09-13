-- Evolui o módulo de Leads: pipeline de 8 etapas, perfil enriquecido,
-- motivo de perda, histórico de mudança de etapa e observações.
--
-- Fix de bug pré-existente: o CHECK de leads.status só aceitava chaves
-- em inglês minúsculo ('new','qualified','contacted','converted','lost'),
-- mas toda a aplicação sempre gravou o rótulo em português ("Novo",
-- "Qualificado" etc.) — ou seja, qualquer updateLeadStatus real
-- quebraria com violação de constraint. Corrigido junto da evolução
-- pro pipeline de 8 etapas.

alter table public.leads drop constraint leads_status_check;

-- Migra valores antigos (em ambas as formas já usadas) pro novo pipeline.
update public.leads set status = 'Novo' where status in ('new');
update public.leads set status = 'Contato' where status in ('contacted', 'Contatado');
update public.leads set status = 'Qualificação' where status in ('qualified', 'Qualificado');
update public.leads set status = 'Convertido' where status in ('converted');
update public.leads set status = 'Perdido' where status in ('lost');

alter table public.leads add constraint leads_status_check check (
  status = any (array[
    'Novo', 'Contato', 'Qualificação', 'Reunião', 'Proposta',
    'Negociação', 'Convertido', 'Perdido'
  ])
);

-- Perfil enriquecido do lead — dado real capturável na qualificação.
alter table public.leads add column interest text;
alter table public.leads add column product_interest text;
alter table public.leads add column estimated_net_worth numeric;
alter table public.leads add column objective text;
alter table public.leads add column lost_reason text;
alter table public.leads add column lost_at timestamptz;
alter table public.leads add column converted_at timestamptz;

-- Observações do lead — mesmo padrão já usado por clients (notes).
alter table public.notes add column lead_id uuid references public.leads(id);
create index notes_lead_idx on public.notes(lead_id) where lead_id is not null;

-- Histórico de mudança de etapa. Tabela própria (não o audit_log
-- genérico) porque audit_logs só é legível por admin/manager/compliance
-- via RLS, e aqui qualquer membro da organização precisa ver a timeline.
create table public.lead_status_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  lead_id uuid not null references public.leads(id),
  from_status text,
  to_status text not null,
  changed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index lead_status_history_lead_idx on public.lead_status_history(lead_id, created_at desc);

alter table public.lead_status_history enable row level security;

create policy lead_status_history_org_access on public.lead_status_history
  for all
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

-- Populado automaticamente a cada mudança de status — a aplicação só
-- precisa fazer update em leads.status, o histórico nunca fica
-- dessincronizado.
create or replace function public.log_lead_status_change()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.status is distinct from old.status then
    insert into public.lead_status_history (organization_id, lead_id, from_status, to_status, changed_by)
    values (new.organization_id, new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger trg_lead_status_history
  after update on public.leads
  for each row execute function public.log_lead_status_change();
