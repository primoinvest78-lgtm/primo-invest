-- Permite vincular interactions/tasks diretamente a um lead (além do
-- vínculo já existente com client_id). Nullable, não quebra nada.
alter table public.interactions add column lead_id uuid references public.leads(id);
alter table public.tasks add column lead_id uuid references public.leads(id);

create index interactions_lead_idx on public.interactions(lead_id) where lead_id is not null;
create index tasks_lead_idx on public.tasks(lead_id) where lead_id is not null;
