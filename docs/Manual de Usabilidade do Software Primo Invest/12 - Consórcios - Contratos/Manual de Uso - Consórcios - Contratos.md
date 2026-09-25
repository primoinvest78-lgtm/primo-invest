# Manual de Uso — Consórcios: Visão Geral e Contratos

**Software:** Primo Invest
**Módulo:** Consórcios → Contratos
**Onde fica:** menu lateral → grupo **Consórcios** → **Contratos**. A visão geral de consórcios fica em **primo-invest.vercel.app/consorcios**.

---

## 1. Para que serve

Guarda **todas as cotas de consórcio dos clientes** e tudo o que acontece com cada uma: parcelas, lances, contemplação, documentos e observações.

Aqui você acompanha:

- quantos contratos existem e quanto de crédito eles representam;
- quais estão inadimplentes;
- a ficha completa de cada contrato, dividida em abas.

### Conceitos

- **Contrato (cota)** — a participação de um cliente em um grupo de consórcio.
- **Administradora** — a empresa que administra o grupo.
- **Grupo** e **Cota** — o grupo de consórcio e o número da cota do cliente nele.
- **Crédito** — o valor da carta de crédito.
- **Saldo devedor** — quanto ainda falta pagar.
- **Contemplação** — quando a cota é sorteada ou vence por lance e o cliente ganha o direito de usar o crédito.

### Situações possíveis de um contrato

*Proposta*, *Ativo*, *Inadimplente*, *Contemplado*, *Em utilização*, *Quitado*, *Cancelado* e *Encerrado*.

---

## 2. Visão geral de Consórcios

Tela de entrada do módulo (**/consorcios**).

### 2.1 Cabeçalho

- **Relatório de consórcios** — abre a **Central de Relatórios** com esse relatório selecionado.
- Atalhos para **Contratos**, **Parcelas**, **Lances** e **Motor de apuração**.

### 2.2 Cartões

Os três cartões são clicáveis:

- **Contratos ativos** — leva à lista de contratos.
- **Crédito total ativo** — leva à lista de contratos.
- **Parcelas em aberto** — leva a **Parcelas**.

### 2.3 Lista "Contratos"

Mostra os contratos com cliente, parcelas pagas / total, data de início (*"desde …"*), valor do crédito e situação. **Clique num contrato** para abrir a ficha. O link **Ver detalhes** leva à lista completa.

---

## 3. Lista de contratos

### 3.1 Cabeçalho

- **Relatório de consórcios** — abre o relatório na Central de Relatórios.
- **Voltar a Consórcios** — volta à visão geral.

Sem nenhum contrato: *"Nenhum contrato cadastrado."*

### 3.2 Indicadores

- **Contratos** — total. **Clique** para mostrar todos.
- **Ativos** — contratos em andamento.
- **Inadimplentes** — **clique** para mostrar só os inadimplentes.
- **Crédito ativo** — soma do crédito dos contratos ativos.
- **Saldo devedor total** — quanto falta pagar, somando todos (em vermelho).

### 3.3 Filtros

- **Buscar** — contrato, grupo, cota, cliente ou bem.
- **Tipo** — por exemplo, imóvel ou veículo.
- **Cliente** — só os contratos de um cliente.
- **Status** — uma das situações do contrato.
- **Limpar filtros** — volta tudo ao padrão.

### 3.4 Tabela

**Ordenar por:** *Mais recentes*, *Maior crédito*, *Maior progresso* ou *Administradora (A-Z)*.

Colunas: **Contrato**, **Cliente**, **Tipo**, **Crédito**, **Progresso** (parcelas pagas), **Início** e **Status**.

**Clique na linha** para abrir a ficha do contrato. Sem resultados: *"Nenhum contrato encontrado."*

---

## 4. Ficha do contrato

No topo aparecem o número do contrato (ou *"Sem número"*), os botões de **editar** (lápis) e **excluir** (lixeira) e **Voltar a Contratos**. Abaixo ficam oito abas.

### 4.1 Aba "Visão Geral"

- **Progresso do contrato** — barra com o percentual pago e os indicadores **Crédito contratado**, **Saldo devedor**, **% pago**, **Parcelas restantes**, **Parcela atual** e **Próximo vencimento**.
- **Próximas ações** — tarefas pendentes ligadas a este contrato. Sem tarefas: *"Nenhuma tarefa pendente vinculada a este contrato."*

### 4.2 Aba "Dados do Contrato"

Ficha completa, em blocos:

- **Cliente** — o titular.
- **Consórcio** — Administradora, Nº do contrato, Tipo/categoria, Grupo, Cota e Bem/serviço.
- **Financeiro** — Valor do crédito, Parcela, Prazo, Taxa de administração, Fundo de reserva e Seguro.
- **Datas** — Adesão/início, Prazo final, Contemplação e Última atualização.

Campos vazios aparecem como *"Não informado"*.

### 4.3 Aba "Parcelas"

Lista das parcelas com **Nº**, **Vencimento**, **Valor**, **Pago em** e **Status** (*Pendente*, *Pago*, *Em atraso*, *Negociado*, *Isento* ou *Cancelado*).

- **Registrar parcela** — abre um formulário com Nº da parcela, Valor, Vencimento, Status, Valor pago e Data do pagamento. Clique em **Salvar**.
- **Lixeira na linha** — exclui a parcela.

Sem parcelas detalhadas, aparece o aviso de que o **contador oficial** (parcelas pagas / total, no topo) continua sendo a referência até você começar o detalhamento.

### 4.4 Aba "Lances"

Lista os lances feitos com esta cota.

- **Registrar lance** — formulário com **Modalidade** (*Lance Livre*, *Lance Fixo*, *Lance Embutido* ou *Lance Misto*, conforme o que a cota permite), **Valor do lance**, **% do crédito**, **Resultado** (*Ofertado*, *Em análise*, *Contemplado*, *Não contemplado*, *Cancelado* ou *Expirado*) e **Observações**.
- **Lápis** — edita o lance. **Lixeira** — exclui.

Sem lances: *"Nenhum lance registrado ainda."*

### 4.5 Aba "Contemplação"

Quando a cota foi contemplada, mostra a **Data da contemplação**, a **Forma** (sorteio ou lance) e o **Valor do lance vencedor**, além dos documentos da contemplação.

Antes disso: *"Essa cota ainda não foi contemplada. Quando houver um lance vencedor ou a data de contemplação for registrada, as informações aparecem aqui."*

### 4.6 Aba "Documentos"

Guarda tudo o que se refere à cota: contrato, aditivos, comprovantes, documentos de contemplação, garantia ou uso do crédito.

- **Enviar documento** — escolha o arquivo no computador (mostra *"Enviando..."*).
- **Excluir** — remove o documento.

Se o envio falhar: *"Não foi possível enviar o documento. Tente novamente."*

### 4.7 Aba "Histórico"

Linha do tempo de tudo o que aconteceu com o contrato (criação, alterações, parcelas, lances), com data e responsável. Quando o sistema não sabe quem fez: *"Responsável não identificado pelo sistema."*

### 4.8 Aba "Observações"

Notas internas do assessor — **o cliente não vê**. Escreva e clique em **Salvar observações**; aparece *"Salvo."*

---

## 5. Editar um contrato

Clique no **lápis**. A janela **"Editar contrato"** tem os blocos:

- **Consórcio** — Administradora, Nº do contrato, Tipo, Grupo, Cota e Bem/serviço;
- **Financeiro** — Valor do crédito, Valor da parcela, Total de parcelas, Parcelas pagas, Taxa adm. (%), Fundo reserva (%) e Seguro (R$);
- **Datas** — Adesão/início, Prazo final e Contemplação;
- **Cliente e status** — Titular e Status;
- **Observações**.

Clique em **Salvar**.

---

## 6. Excluir um contrato

Clique na **lixeira**. A janela **"Excluir contrato"** avisa que serão apagados também as parcelas, os lances, o histórico e os documentos — **a ação não pode ser desfeita**.

Se houver tarefas ligadas ao contrato, o sistema não deixa excluir: *"Não foi possível excluir: existem tarefas vinculadas a este contrato. Remova ou desvincule as tarefas primeiro."*

Prefira mudar o status para **Cancelado** ou **Encerrado** a excluir, para preservar o histórico.

---

## 7. Perguntas frequentes

**Como cadastro um contrato novo?**
*Situação atual:* nesta versão não há botão de novo contrato. Os contratos chegam por carga de dados ou integração; depois você completa e corrige tudo pelo lápis.

**O que é o "contador oficial" das parcelas?**
São os campos **Total de parcelas** e **Parcelas pagas** do contrato. Enquanto você não registra parcela por parcela, é por eles que o sistema calcula o progresso.

**Onde vejo o sorteio da cota?**
No **Motor de apuração** (Consórcios → Motor de apuração). Veja o manual específico.
