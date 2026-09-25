# Manual de Uso — Patrimônio: Contas

**Software:** Primo Invest
**Módulo:** Patrimônio → Contas
**Onde fica:** menu lateral → grupo **Patrimônio** → **Contas**.

---

## 1. Para que serve

Reúne **todas as contas dos clientes** — contas correntes, contas em corretoras, previdência e outras — em um só lugar, mostrando quanto há em cada uma, onde está custodiado e o que precisa de cuidado.

Aqui você acompanha:

- o saldo total em contas e quanto dele está disponível (liquidez) ou investido;
- em quais instituições o patrimônio dos clientes está;
- quais contas estão com problema (inativas, desatualizadas ou com cadastro incompleto);
- o detalhe de cada conta: investimentos, evolução do saldo e movimentações.

### Conceitos

- **Conta** — um registro de conta de um cliente em uma instituição (por exemplo, a conta de investimentos do João na corretora X).
- **Titular** — o cliente dono da conta.
- **Saldo** — o valor total da conta.
- **Investido** — a parte do saldo aplicada em investimentos.
- **Liquidez** — a parte do saldo que pode ser resgatada rapidamente.

---

## 2. A tela

### 2.1 Cabeçalho

- **Título "Contas"** — com a frase *"Consolidação de contas — N contas de clientes"*.
- **Relatório patrimonial** — abre a **Central de Relatórios** com o relatório patrimonial já selecionado.
- **Voltar a Patrimônio** — retorna à Visão Geral de Patrimônio.

Se ainda não houver nenhuma conta, a tela mostra apenas *"Nenhuma conta cadastrada."*

### 2.2 Indicadores

Seis cartões no topo:

- **Patrimônio em contas** — soma do saldo de todas as contas.
- **Liquidez** — quanto desse saldo está disponível para resgate rápido.
- **Total investido** — quanto está aplicado em investimentos.
- **Contas** — quantidade de contas.
- **Instituições** — em quantas instituições diferentes as contas estão.
- **Contas com atenção** — quantas contas têm algum problema. O número fica **vermelho** quando é maior que zero.

**Clique em "Contas com atenção"** para mostrar na tabela **só as contas com problema**. Clique de novo para voltar a mostrar todas.

Uma conta entra em **atenção** quando:

- está **inativa**;
- está **sem atualização há mais de 90 dias**;
- tem **cadastro incompleto** (falta o titular, a instituição ou o nome da conta).

### 2.3 Alertas

Logo abaixo, podem aparecer avisos coloridos. Os avisos sobre **uma conta específica** têm o botão **"Ver →"**, que abre a própria conta:

- *"Conta inativa: … está com status …"*;
- *"Conta sem atualização há mais de 90 dias: …"*;
- *"Inconsistência cadastral em …: cadastro incompleto (cliente, instituição ou nome ausente)."*;
- *"Liquidez baixa: apenas X% do saldo em contas está disponível."*;
- *"Concentração elevada: X% do saldo em contas está em …"* — aparece quando uma instituição concentra 60% ou mais do saldo.

Se não houver nenhum problema, esse quadro não aparece.

### 2.4 Quadro "Por instituição"

Mostra **onde o patrimônio dos clientes está custodiado**. Para cada instituição aparece um cartão com:

- o nome da instituição e quantas contas há nela;
- **Saldo**, **Investido** e **Liquidez**.

Quando há duas ou mais instituições, aparecem também **barras comparativas** do saldo de cada uma — a maior barra é a instituição com mais recursos.

### 2.5 Filtros

- **Buscar** — digite parte do nome da conta, da instituição ou do cliente.
- **Instituição** — mostra só as contas de uma instituição.
- **Cliente** — mostra só as contas de um cliente (ou *Sem cliente vinculado*).
- **Tipo** — mostra só um tipo de conta (por exemplo, corrente).
- **Status** — *Ativas*, *Inativas* ou *Todos*.
- **Limpar filtros** — aparece quando algum filtro está ativo; volta tudo ao padrão.

Os filtros atuam sobre a tabela de contas.

### 2.6 Tabela "Contas"

Acima da tabela há dois seletores:

- **Agrupamento** — *Sem agrupamento*, *Agrupar por instituição* ou *Agrupar por cliente*. Ao agrupar, cada grupo ganha uma linha de título com a quantidade de contas e o saldo somado.
- **Ordenar por** — *Maior saldo* (padrão), *Nome (A-Z)* ou *Atualizadas recentemente*.

Colunas: **Conta** (nome e um código curto de identificação), **Instituição**, **Titular**, **Tipo**, **Saldo**, **Investido**, **Liquidez**, quantidade de investimentos, **data de atualização** e **status**.

Na coluna de status aparece **Ativa** ou **Inativa**, e a etiqueta vermelha **Atenção** quando a conta tem algum problema.

- **Clique no nome da conta** para abrir o **detalhe da conta**.
- **Clique no nome do titular** para abrir o **perfil do cliente**.
- **Lápis** — edita a conta (veja a seção 4).
- **Lixeira** — exclui a conta (veja a seção 5).

---

## 3. Detalhe da conta

Abre ao clicar no nome da conta.

### 3.1 Cabeçalho

Mostra a instituição, o **nome da conta** e quatro informações: **Titular**, **Tipo**, **Identificação** e **Atualizada em**.

À direita ficam o botão **Voltar a Contas**, a etiqueta **Ativa/Inativa** e os botões de **editar** (lápis) e **excluir** (lixeira).

### 3.2 Indicadores

- **Saldo** — valor total da conta.
- **Liquidez** — parte disponível para resgate rápido.
- **Valor investido** — parte aplicada.
- **Patrimônio relacionado (cliente)** — o patrimônio líquido total do titular, somando todas as contas dele.

### 3.3 Cliente vinculado

Quando a conta tem titular, aparece a faixa *"Cliente vinculado: …"* com o link **"Abrir perfil do cliente →"**.

### 3.4 Investimentos vinculados

Lista as posições de investimento dessa conta, com **Ativo**, **Categoria**, **Quantidade**, **Valor** e **% da conta** (quanto aquela posição representa do saldo da conta).

O botão de **remover posição** apaga a posição. O navegador pede uma confirmação: *"Remover essa posição da conta? Essa ação não pode ser desfeita."*

Se não houver posições: *"Nenhum investimento vinculado a essa conta."*

### 3.5 Evolução do saldo

Gráfico com a evolução do saldo ao longo do tempo. Os botões de período, no canto do quadro, mudam o intervalo exibido.

Se faltar histórico: *"Sem transações suficientes registradas pra montar a evolução do saldo dessa conta."*

### 3.6 Movimentações

Tabela com **Data**, **Tipo**, **Descrição**, **Categoria** e **Valor** de cada movimentação.

Filtros acima da tabela:

- **Tipo** — *Compra*, *Venda*, *Dividendo*, *Juros*, *Taxa*, *Depósito*, *Saque* ou *Todos*;
- **De** e **Até** — intervalo de datas.

Mensagens possíveis: *"Nenhuma movimentação registrada pra essa conta."* ou *"Nenhuma movimentação encontrada com esses filtros."*

---

## 4. Editar uma conta

Clique no **lápis** (na tabela ou no detalhe). Abre a janela **"Editar conta"** com:

- **Nome da conta**;
- **Instituição**;
- **Tipo** (por exemplo, *corrente*);
- **Moeda** (três letras, por exemplo *BRL*);
- **Titular** — escolha o cliente ou *Sem cliente vinculado*;
- **Status** — *Ativa* ou *Inativa*.

Clique em **Salvar**. Enquanto grava, o botão mostra *"Salvando..."*.

Dica: vincular o titular e preencher a instituição tira a conta da lista de **atenção** por cadastro incompleto.

---

## 5. Excluir uma conta

Clique na **lixeira**. Abre a janela **"Excluir conta"** avisando que serão apagados a conta, todos os investimentos vinculados e todo o histórico de movimentações — e que **a ação não pode ser desfeita**.

- **Excluir permanentemente** — confirma.
- **Cancelar** — desiste.

Use a exclusão só para registros criados por engano. Uma conta encerrada deve ficar **Inativa**, para preservar o histórico.

---

## 6. Perguntas frequentes

**Como cadastro uma conta nova?**
*Situação atual:* nesta versão não há botão de nova conta nesta tela. As contas chegam pelas integrações com instituições (módulo **Integrações**) ou por carga de dados.

**Por que uma conta aparece com "Atenção"?**
Porque está inativa, sem atualização há mais de 90 dias ou com cadastro incompleto. Abra a conta, corrija o que falta pelo lápis e ela sai da lista.

**Qual a diferença entre inativar e excluir?**
Inativar mantém a conta e todo o histórico, só marcando que ela não está mais em uso. Excluir apaga tudo definitivamente.

**O "Patrimônio relacionado" é só desta conta?**
Não. É o patrimônio líquido total do titular, considerando todas as contas e dívidas dele.
