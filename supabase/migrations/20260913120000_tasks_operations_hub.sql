-- Evolui o módulo de Tarefas em centro operacional: categoria,
-- vínculo com consórcio/documento, data real de conclusão automática.
--
-- Fix de bug pré-existente: completeTask() gravava status = 'done',
-- mas o CHECK só aceita 'pending'/'in_progress'/'completed'/'cancelled'
-- — ou seja, concluir uma tarefa sempre falhava. Corrigido no código
-- (lib/actions/tasks.ts) junto desta migration.

alter table public.tasks add column category text;
alter table public.tasks add column consortium_contract_id uuid references public.consortium_contracts(id);
alter table public.tasks add column document_id uuid references public.documents(id);
alter table public.tasks add column completed_at timestamptz;

create index tasks_consortium_idx on public.tasks(consortium_contract_id) where consortium_contract_id is not null;
create index tasks_document_idx on public.tasks(document_id) where document_id is not null;

-- Data real de conclusão, preenchida automaticamente — mesma ideia do
-- closed_at das oportunidades.
create or replace function public.set_task_completed_at()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    new.completed_at := now();
  elsif new.status != 'completed' and old.status = 'completed' then
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger trg_task_completed_at
  before update on public.tasks
  for each row execute function public.set_task_completed_at();
