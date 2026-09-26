-- Auditoria de segurança (2026-09-26): visitante sem login ("anon") podia
-- EXECUTAR funções SECURITY DEFINER, porque o Postgres concede EXECUTE a
-- PUBLIC por padrão. A maioria recusava sozinha (checa o papel do
-- usuário), mas notify_user pulava a checagem quando não há sessão —
-- permitindo, em tese, inserir uma notificação falsa (com link) para um
-- usuário cujo id fosse conhecido.
--
-- Correção: nenhuma função SECURITY DEFINER do schema public pode ser
-- chamada por anon, exceto consume_calendar_feed (o feed .ics do
-- calendário é consultado sem sessão e se autoriza pelo token na URL).
-- Usuários logados (authenticated) e o service_role mantêm o acesso.

do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as fn
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and p.proname <> 'consume_calendar_feed'
  loop
    execute format('revoke execute on function %s from public, anon', r.fn);
    execute format('grant execute on function %s to authenticated, service_role', r.fn);
  end loop;
end;
$$;

-- Funções criadas daqui em diante também não ficam abertas a anon.
alter default privileges in schema public revoke execute on functions from public, anon;

notify pgrst, 'reload schema';
