-- Motivo da perda (lista fechada + nota) — padrão de mercado: sem isso
-- registrado, ninguém aprende com a oportunidade perdida.
alter table public.opportunities add column loss_reason text;

-- opportunity_stages estava vazia — o kanban de Oportunidades não tinha
-- nenhum estágio pra organizar as colunas. Popula estágios padrão pras
-- organizações já existentes, e garante que organizações futuras
-- também nasçam com eles (trigger, mesmo padrão de handle_new_user).

insert into public.opportunity_stages (organization_id, name, stage_key, position, probability, is_active)
select o.id, s.name, s.stage_key, s.position, s.probability, true
from public.organizations o
cross join (
  values
    ('Prospecção', 'prospeccao', 1, 10),
    ('Qualificação', 'qualificacao', 2, 30),
    ('Proposta', 'proposta', 3, 50),
    ('Negociação', 'negociacao', 4, 75),
    ('Ganha', 'ganha', 5, 100),
    ('Perdida', 'perdida', 6, 0)
) as s(name, stage_key, position, probability)
where not exists (
  select 1 from public.opportunity_stages os where os.organization_id = o.id
);

create or replace function public.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.opportunity_stages (organization_id, name, stage_key, position, probability, is_active)
  values
    (new.id, 'Prospecção', 'prospeccao', 1, 10, true),
    (new.id, 'Qualificação', 'qualificacao', 2, 30, true),
    (new.id, 'Proposta', 'proposta', 3, 50, true),
    (new.id, 'Negociação', 'negociacao', 4, 75, true),
    (new.id, 'Ganha', 'ganha', 5, 100, true),
    (new.id, 'Perdida', 'perdida', 6, 0, true);

  return new;
end;
$$;

drop trigger if exists on_organization_created on public.organizations;

create trigger on_organization_created
  after insert on public.organizations
  for each row
  execute function public.handle_new_organization();
