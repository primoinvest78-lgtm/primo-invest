# Manual de Uso — Patrimônio: Investimentos

**Software:** Primo Invest
**Módulo:** Patrimônio → Investimentos
**Onde fica:** menu lateral → grupo **Patrimônio** → **Investimentos**.

---

## 1. Para que serve

Mostra **todas as posições de investimento** dos clientes — cada ativo que alguém tem em carteira (um CDB, uma ação, um fundo, um título público) — com valor atual, custo, ganho ou perda e participação na carteira.

Aqui você acompanha:

- quanto está investido e quanto rendeu;
- como a carteira se divide entre classes de ativo, clientes e instituições;
- quais posições mais ganharam ou mais perderam;
- o histórico de movimentações de cada posição.

### Conceitos

- **Posição** — um ativo específico que um cliente tem em uma conta (por exemplo, 100 cotas de um fundo na corretora X).
- **Valor investido (custo)** — quanto foi aplicado para formar a posição.
- **Valor atual** — quanto a posição vale hoje.
- **Resultado / Ganho ou perda** — valor atual menos o custo.
- **Rentabilidade** — o resultado em percentual.
- **% carteira** — quanto aquela posição representa do total investido.

---

## 2. A tela

### 2.1 Cabeçalho

- **Título "Investimentos"** — com a quantidade de posições em carteira.
- **Relatório da carteira** — abre o Report Center com o relatório de investimentos já selecionado.
- **Voltar a Patrimônio** — retorna à Visão Geral.

### 2.2 Indicadores

- **Valor investido** — soma do custo das posições.
- **Resultado financeiro** — ganho ou perda total, em reais.
- **Rentabilidade** — ganho ou perda total, em percentual.
- **Quantidade** — número de posições. **Ao clicar, mostra todas** (limpa filtros).
- **Liquidez** — valor das posições de resgate rápido. **Ao clicar, filtra as posições líquidas.**
- **Variação no período** — quanto a carteira variou no período do histórico.

### 2.3 Filtros

- **Cliente** — posições de um cliente.
- **Conta** — posições de uma conta.
- **Instituição** — posições de uma corretora ou banco.
- **Status** — *Ativas* (em carteira), *Inativas* (encerradas) ou *Todas*.

Todos os quadros e gráficos da tela acompanham os filtros.

### 2.4 Performance da carteira

Gráfico da evolução do valor da carteira ao longo do tempo. Se faltar histórico, aparece *"Sem transações suficientes registradas pra montar a performance da carteira ao longo do tempo."*

### 2.5 Alocação por classe de ativo

Como a carteira se divide entre classes (renda fixa, ações, fundos etc.).

### 2.6 Concentração

Três visões para identificar dependência excessiva:

- **Por classe de ativo**;
- **Por cliente (R$)** — quais clientes concentram mais recursos;
- **Por instituição (R$)** — quanto está em cada banco ou corretora.

### 2.7 Rankings

- **Maiores posições** — as mais valiosas.
- **Maiores ganhos** — as que mais renderam.
- **Maiores perdas** — as que mais perderam. Boas candidatas para uma conversa com o cliente.

### 2.8 Tabela "Posições"

Colunas: **Ativo**, **Categoria**, **Instituição / Conta**, **Cliente**, **Quantidade**, **Valor atual**, **Ganho/Perda** e **% carteira**.

**"Ordenar por"** (acima da tabela):
- *Maior valor* (padrão);
- *Maior ganho/perda*;
- *Nome (A-Z)*.

**Clique no nome da conta** (dentro da coluna Instituição / Conta) para abrir o detalhe da conta.

**Clique em qualquer outra parte da linha** para abrir o **detalhe da posição**.

---

## 3. Detalhe da posição

Abre em uma janela com o nome do ativo e:

- **Valor atual**, **Custo**, **Resultado** e **Rentabilidade**;
- **Quantidade**, **Categoria**, **Instituição** e data da posição (**Posição em**);
- a **Conta** em que o ativo está;
- a lista de **Movimentações** (aplicações, resgates, rendimentos), com tipo, data e descrição. Se não houver, *"Nenhuma movimentação registrada pra essa conta/produto."*

**Remover posição** — apaga a posição. O sistema pede confirmação na própria janela: **"Confirmar remoção"** apaga; **"Cancelar"** desiste. Use só para registros incorretos — uma posição vendida deve aparecer como inativa, não ser removida.

Para fechar a janela, clique no **X** ou fora dela.

---

## 4. Perguntas frequentes

**Como cadastro um investimento novo?**
*Situação atual:* nesta versão não há tela de cadastro de posições. As posições chegam pelas integrações com instituições (módulo **Integrações**) ou por carga de dados.

**Por que o "Resultado" está negativo?**
Porque o valor atual da posição está abaixo do valor investido.

**O que significa uma posição "Inativa"?**
Uma posição que já foi encerrada (vendida ou resgatada). Ela continua no histórico.
