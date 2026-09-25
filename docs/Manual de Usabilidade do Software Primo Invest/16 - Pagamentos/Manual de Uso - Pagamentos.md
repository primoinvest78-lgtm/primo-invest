# Manual de Uso — Pagamentos

**Software:** Primo Invest
**Módulo:** Pagamentos (inteligência de pagamentos)
**Onde fica:** menu lateral → **Pagamentos**.

---

## 1. Para que serve

Recebe os **comprovantes de pagamento** enviados pelos clientes (Pix, TED, boleto…), identifica **de quem é e a qual parcela se refere** e faz a **baixa da parcela** — automaticamente quando há certeza, ou com a sua revisão quando há dúvida.

Toda baixa fica rastreável até o comprovante e o critério que a gerou.

### Quem pode usar

Só os perfis **Administrador**, **Gestor**, **Financeiro** ou **Operacional**. Os demais veem a mensagem *"Acesso restrito"*.

### Como o sistema decide

Ao receber um comprovante, o sistema lê os dados, procura o cliente e a parcela correspondentes e atribui uma **confiança**:

| Confiança | O que acontece |
|---|---|
| **Alta** | Baixa automática na parcela. O comprovante fica *Conciliado*. |
| **Média** | Vai para a fila de revisão (*Aguardando revisão*). |
| **Baixa** | É registrado como *Exceção*, para análise. |

Se o **identificador da transação** já foi usado em outro comprovante, ele é marcado como **Duplicado**.

### Situações de um comprovante

*Recebido*, *Processando*, *Identificado*, *Conciliado*, *Aguardando revisão*, *Exceção*, *Rejeitado* e *Duplicado*.

---

## 2. A tela

### 2.1 Cabeçalho

Título **Pagamentos**, subtítulo **Inteligência de pagamentos** e o botão **Enviar comprovante**.

### 2.2 Indicadores

- **Recebidos**, **Conciliados**, **Aguardando revisão** e **Exceções** — **clique** para abrir a aba correspondente na fila.
- **Valor conciliado** — total já baixado.
- **Taxa de automação** — quanto foi conciliado sem intervenção manual.

### 2.3 Comprovantes por status

Gráfico com a composição dos comprovantes. **Clique numa fatia ou numa linha da legenda** para abrir aquela aba na fila.

### 2.4 Fila de comprovantes

Abas: **Todos**, **Recebidos**, **Conciliados**, **Aguardando revisão**, **Exceções** e **Duplicidades**.

Colunas: **Comprovante**, **Cliente informado**, **Valor**, **Data**, **Status** e **Recebido em**. O botão **Revisar** abre a revisão.

Sem itens: *"Nenhum comprovante nessa categoria."*

---

## 3. Enviar um comprovante

Clique em **Enviar comprovante**. Na janela **"Enviar comprovante de pagamento"**:

1. Escolha o **arquivo** do comprovante.
2. Preencha **Valor**, **Método** (*Pix*, *TED*, *DOC*, *Boleto*, *Dinheiro* ou *Outro*), **Data** e **Hora**.
3. **Cliente (nome ou CPF/CNPJ)** — como identificar o cliente.
4. Opcionais: **Banco**, **Beneficiário**, **Identificador da transação** (usado para detectar duplicidade) e **Observações**.
5. Clique em **Enviar e processar**.

O resultado aparece na hora:

- *"Alta confiança — baixa automática já aplicada na parcela."*
- *"Confiança média — enviado para a fila de revisão."*
- *"Baixa confiança — registrado como exceção para revisão."*
- *"Identificador de transação já usado em outro comprovante — marcado como duplicado."*

Use **Enviar outro** para continuar ou **Fechar**.

---

## 4. Revisar um comprovante

Clique em **Revisar** na fila. A janela **"Revisão de comprovante"** mostra:

- **Dados extraídos** — Valor, Data, Hora, Método, Banco, Beneficiário, Identificador, Cliente informado e quem enviou;
- **Exceções** encontradas, cada uma com o botão **Resolver**;
- **Possíveis correspondências** — parcelas candidatas com a confiança de cada uma. Escolha a correta para confirmar;
- **Pagamento confirmado** — quando já foi baixado (automático ou por quem confirmou).

Ações disponíveis:

- **Vincular manualmente** — escolha o **cliente** e a **parcela** e clique em **Vincular e confirmar**;
- **Criar tarefa** — para acompanhar o caso;
- **Marcar como duplicado**;
- **Rejeitar** — com motivo opcional.

Mensagens possíveis: *"Essa parcela já estava paga — não foi possível confirmar de novo."*, *"Parcela não encontrada."*, *"Não foi possível confirmar."*

---

## 5. Perguntas frequentes

**Uma baixa automática pode estar errada?**
Ela só acontece com alta confiança. Mesmo assim, tudo fica registrado com o critério usado e pode ser revisado.

**Por que preencher o identificador da transação?**
Porque é ele que impede que o mesmo pagamento seja baixado duas vezes.

**Onde vejo a parcela baixada?**
Em **Consórcios → Parcelas** ou na ficha do contrato, aba **Parcelas**.
