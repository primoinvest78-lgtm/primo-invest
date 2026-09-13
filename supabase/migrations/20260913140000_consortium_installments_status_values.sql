-- O módulo /consorcios/parcelas introduziu os status "negociado" e
-- "isento" (spec: Pendente, Pago, Em atraso, Negociado, Isento,
-- Cancelado) mas a CHECK constraint original só permitia
-- pending/paid/overdue/cancelled — a action de negociar parcela
-- (negotiateInstallment) já grava status "negotiated" e falhava com
-- violação de constraint. Amplia a lista permitida; não remove nenhum
-- valor existente.
alter table public.consortium_installments
  drop constraint if exists consortium_installments_status_check;

alter table public.consortium_installments
  add constraint consortium_installments_status_check
  check (status = ANY (ARRAY['pending'::text, 'paid'::text, 'overdue'::text, 'negotiated'::text, 'exempt'::text, 'cancelled'::text]));
