# Manual de Uso — Patrimônio: Passivos

**Software:** Primo Invest
**Módulo:** Patrimônio → Passivos
**Onde fica:** menu lateral → grupo **Patrimônio** → **Passivos**.

---

## 1. Para que serve

Mostra **todas as dívidas e obrigações dos clientes** — financiamentos, empréstimos, cartões, consórcios a pagar — e o impacto delas no patrimônio.

Aqui você acompanha:

- quanto os clientes devem no total e quanto pagam por mês;
- quais dívidas vencem logo, quais estão perto de ser quitadas e quais pesam demais;
- o detalhe de cada passivo, com a evolução do saldo e os documentos do titular.

### Conceitos

- **Passivo** — uma dívida ou obrigação de um cliente.
- **Saldo atual** — quanto ainda falta pagar.
- **Parcela** — quanto se paga por mês.
- **Taxa** — juros ao mês (% a.m.).
- **Vencimento** — data final prevista do passivo.
- **Patrimônio líquido** — tudo o que os clientes têm menos o que devem. Todo passivo reduz esse número.

---

## 2. A tela

### 2.1 Cabeçalho

- **Título "Passivos"** — com a frase *"N passivos registrados — impacto direto no patrimônio líquido consolidado"*.
- **Relatório patrimonial** — abre a **Central de Relatórios** com o relatório patrimonial já selecionado.
- **Voltar a Patrimônio** — retorna à Visão Geral.

Se não houver nenhum passivo, a tela mostra apenas *"Nenhum passivo registrado."*

### 2.2 Indicadores

- **Total de passivos** — soma do saldo de todas as dívidas (em vermelho).
- **Patrimônio líquido** — patrimônio total já descontadas as dívidas.
- **Parcela mensal total** — soma das parcelas de todos os passivos.
- **Passivos** — quantidade de passivos.
- **Em atenção** — quantos passivos merecem cuidado. Fica **vermelho** quando é maior que zero. **Clique** para mostrar só esses passivos na tabela; clique de novo para mostrar todos.
- **Próximos do vencimento** — quantos vencem nos **próximos 180 dias**. **Clique** para filtrar a tabela por eles; clique de novo para desfazer.

Um passivo entra **em atenção** quando:

- vence nos próximos **90 dias**;
- **não está ativo**;
- faltam **3 meses ou menos** para quitá-lo no ritmo atual.

### 2.3 Alertas

Avisos coloridos que aparecem só quando se aplicam. **Cada aviso tem o botão "Ver →", que abre o próprio passivo.**

- *"Vencimento próximo: … vence em N dias."* — vence em até 90 dias;
- *"… está com o vencimento cadastrado no passado e ainda ativo — verificar status."*;
- *"… está com status …"* — passivo que não está ativo;
- *"… está próximo da quitação: N meses restantes no ritmo atual."*;
- *"Concentração de dívida: … representa X% do total em passivos."* — uma dívida com 60% ou mais do total;
- *"Parcela elevada: … representa X% do comprometimento mensal total."* — uma parcela com 40% ou mais do total mensal.

### 2.4 Gráficos

- **Maiores passivos** — as maiores dívidas, em barras. **Clique numa barra para abrir aquele passivo.**
- **Passivos por categoria** — quanto se deve em cada categoria (financiamento, empréstimo etc.). Aparece quando há duas ou mais categorias.

### 2.5 Filtros

- **Buscar** — parte do nome, da categoria ou do cliente.
- **Categoria** — só uma categoria.
- **Cliente** — só os passivos de um cliente (ou *Sem cliente vinculado*).
- **Status** — *Ativos*, *Inativos* ou *Todos*.
- **Limpar filtros** — aparece quando algum filtro está ativo.

### 2.6 Tabela de passivos

**Ordenar por** (acima da tabela): *Maior saldo* (padrão), *Maior parcela*, *Vencimento mais próximo* ou *Nome (A-Z)*.

Colunas: **Passivo**, **Titular**, **Saldo atual**, **Parcela**, **Taxa**, **Vencimento** e **Status**.

- **Clique no nome do passivo** para abrir o **detalhe**.
- **Clique no titular** para abrir o **perfil do cliente**.
- **Lápis** — edita o passivo.
- **Lixeira** — exclui o passivo.

---

## 3. Detalhe do passivo

### 3.1 Cabeçalho

Mostra o nome do passivo e: **Titular**, **Taxa** (% ao mês), **Vencimento** e **Atualizado em**. À direita, **Voltar a Passivos**, o status e os botões de editar e excluir.

### 3.2 Indicadores

- **Saldo atual** — quanto falta pagar.
- **Parcela mensal** — valor da parcela.
- **Meses pra quitar** — estimativa de quantos meses faltam no ritmo atual de pagamento.
- **Patrimônio líquido (cliente)** — o patrimônio líquido total do titular.

### 3.3 Evolução do saldo

Gráfico de como o saldo devedor evoluiu. Se faltar histórico: *"Esse passivo ainda não tem histórico de saldo suficiente registrado pra montar a evolução."*

### 3.4 Documentos relacionados

Lista os documentos do titular guardados no sistema, para consulta rápida (contratos, comprovantes).

- Sem titular: *"Sem cliente vinculado — não há documentos pra relacionar."*
- Titular sem documentos: *"Nenhum documento do titular cadastrado ainda."*

---

## 4. Editar um passivo

Clique no **lápis**. Abre a janela **"Editar passivo"** com:

- **Descrição**;
- **Categoria** (por exemplo, *financiamento*);
- **Moeda** (três letras);
- **Saldo atual**;
- **Parcela mensal**;
- **Taxa de juros (% a.m.)**;
- **Titular** — o cliente, ou *Sem cliente vinculado*;
- **Status** — *Ativo* ou *Inativo*.

Clique em **Salvar** (mostra *"Salvando..."* enquanto grava).

---

## 5. Excluir um passivo

Clique na **lixeira**. A janela **"Excluir passivo"** avisa que o registro será removido e que **a ação não pode ser desfeita**.

- **Excluir permanentemente** — confirma.
- **Cancelar** — desiste.

Um passivo quitado deve ficar **Inativo**, não ser excluído, para manter o histórico do cliente.

---

## 6. Perguntas frequentes

**Como cadastro um passivo novo?**
*Situação atual:* nesta versão não há botão de novo passivo nesta tela. Os passivos chegam pelas integrações ou por carga de dados; depois você pode corrigir qualquer campo pelo lápis.

**Qual a diferença entre "Em atenção" e "Próximos do vencimento"?**
"Próximos do vencimento" olha só a data: vence em até 180 dias. "Em atenção" é mais restrito e mais amplo ao mesmo tempo: vence em até 90 dias, ou não está ativo, ou está a 3 meses ou menos da quitação.

**Por que o "Meses pra quitar" não aparece?**
Porque falta a parcela mensal ou o saldo no cadastro. Preencha pelo lápis.
