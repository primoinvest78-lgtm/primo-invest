-- Exemplos de solicitação de documento cobrindo os principais estados
-- do workflow (solicitado, recebido, em análise, reprovado), pra
-- testar a Central de Documentos de ponta a ponta. Usa clientes,
-- documentos e contrato de consórcio REAIS já existentes no banco —
-- nenhuma entidade inventada. O responsável usa o único membro real
-- da organização (Admin Demo).
insert into public.document_requests
  (organization_id, client_id, document_id, category, title, description, responsible_role, responsible_id, requested_by, due_date, status, decision_notes, entity_type, entity_id)
values
  ('d34dae9a-6460-4210-906d-e9a973014436', 'bd45ce7d-41d2-4f4c-a057-c7e7d580aa5f', null, 'pessoal',
   'Comprovante de residência atualizado', 'Necessário para atualização cadastral.',
   'assessor', 'e34371d0-8f9b-455e-b944-5ee56376dec7', 'e34371d0-8f9b-455e-b944-5ee56376dec7',
   current_date + interval '10 days', 'solicitado', null, null, null),

  ('d34dae9a-6460-4210-906d-e9a973014436', '54a95058-17c1-42ad-b4f8-e36e3b160c6a', null, 'pessoal',
   'RG atualizado (frente e verso)', null,
   'cliente', null, 'e34371d0-8f9b-455e-b944-5ee56376dec7',
   current_date + interval '5 days', 'solicitado', null, null, null),

  ('d34dae9a-6460-4210-906d-e9a973014436', '63e52526-d724-4fce-a249-0d89810a08fa', 'ea0c9424-95cf-4368-9922-6cd411926839', 'fiscal',
   'Declaração de Imposto de Renda', 'Revisão de compliance da última declaração enviada.',
   'compliance', 'e34371d0-8f9b-455e-b944-5ee56376dec7', 'e34371d0-8f9b-455e-b944-5ee56376dec7',
   current_date - interval '2 days', 'em_analise', null, null, null),

  ('d34dae9a-6460-4210-906d-e9a973014436', '40c194a1-f28c-4798-b275-bfcb0f850953', '41eacb5e-da94-4011-a2f8-d645add5258e', 'investimento',
   'Relatório de carteira atualizado', null,
   'assessor', 'e34371d0-8f9b-455e-b944-5ee56376dec7', 'e34371d0-8f9b-455e-b944-5ee56376dec7',
   current_date - interval '1 days', 'recebido', null, null, null),

  ('d34dae9a-6460-4210-906d-e9a973014436', 'bd45ce7d-41d2-4f4c-a057-c7e7d580aa5f', '9c3db3ee-17b8-4b0c-a1de-5bcf7fb0bca1', 'consorcio',
   'Contrato de consórcio assinado', 'Cópia assinada pro processo de contemplação.',
   'backoffice', 'e34371d0-8f9b-455e-b944-5ee56376dec7', 'e34371d0-8f9b-455e-b944-5ee56376dec7',
   current_date - interval '6 days', 'reprovado', 'Cópia ilegível, favor reenviar em melhor resolução digitalizada.',
   'consortium_contract', '28190807-39df-469b-b96d-128a8bde0eec');
