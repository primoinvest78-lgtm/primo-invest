# Manual de Uso — Consórcios: Motor de Apuração

**Software:** Primo Invest
**Módulo:** Consórcios → Motor de apuração (inclui a Roleta, o Treinamento e a Inteligência)
**Onde fica:** menu lateral → grupo **Consórcios** → **Motor de apuração**. O treinamento fica no segundo item do menu, **Treinamento · Roleta**.

---

## 1. Para que serve

O Motor de apuração **calcula quais cotas são contempladas em cada assembleia**, seguindo exatamente a regra do regulamento do grupo, e **guarda a prova de cada passo** do cálculo.

Ele cuida de:

- **grupos** de consórcio e da numeração das cotas;
- **regras de apuração**, com versões;
- **resultado oficial** (Loteria Federal) ou **sorteio próprio** (roleta);
- **assembleias**: elegibilidade, sorteio, lances, homologação e trava;
- **crédito** depois da contemplação: documentação, garantias, uso e quitação;
- **inteligência**: achados, simulações, assistente e automações.

### Três ideias importantes

1. **Número da cota ≠ número sorteado ≠ número equivalente.** O sorteio gera números; a regra transforma esses números em cotas.
2. **Nada é apagado.** Regras publicadas não mudam (cria-se nova versão), resultados verificados ficam congelados e correções viram **retificação**, preservando o original.
3. **O PRIMO normalmente não é a administradora.** Quando o sistema não tem os dados de todas as cotas do grupo, a apuração aparece como **conferência**, não como resultado oficial.

---

## 2. Tela principal do Motor

### 2.1 Cabeçalho

Botões: **Treinamento · Roleta** (amarelo), **Inteligência** e **Visão geral de consórcios**.

### 2.2 Números do topo

Cada número tem uma setinha verde e **abre a aba correspondente** logo abaixo:

- **Grupos** → aba Grupos;
- **Assembleias em andamento** → aba Assembleias;
- **Regras publicadas** → aba Regras;
- **Resultados a verificar** → aba Resultado oficial;
- **Créditos em andamento** → aba Crédito (com a quantidade de contemplações ainda sem crédito aberto).

Dica: o endereço **/consorcios/motor?aba=credito** (ou *grupos*, *regras*, *loteria*, *assembleias*, *auditoria*) abre direto na aba.

### 2.3 Abas

| Aba | O que mostra |
|---|---|
| **Assembleias** | Todas as assembleias com grupo, data, contemplações previstas e estado. Botão **Nova assembleia**. |
| **Grupos** | Grupos com administradora, cotas e situação. Botão **Novo grupo**. |
| **Regras** | Regras com versão, vigência, integridade e status. Botão **Nova regra**. |
| **Resultado oficial** | Resultados importados (concurso, prêmios, referência, situação). Botão **Importar resultado**. |
| **Crédito** | Contemplações homologadas sem crédito aberto e operações de crédito em andamento. |
| **Auditoria** | Eventos do motor encadeados — não podem ser alterados nem apagados. |

Clique no nome de um item para abrir a página dele.

---

## 3. Grupos

### 3.1 Criar um grupo

**Novo grupo** abre o formulário **"Novo grupo de consórcio"**: Administradora, Código do grupo, Produto (imóvel, veículo…), **Quantidade de cotas**, **Número inicial**, **Dígitos de exibição** (o sistema mostra a faixa resultante, por exemplo *001 a 1000*), Valor do crédito, Valor da parcela, Prazo (meses), Data de constituição, Participantes, Índice de reajuste (INCC, IPCA…), Taxa de administração (%), Fundo de reserva (%), **Seguro obrigatório**, **Referência do regulamento** e Observações. Clique em **Criar grupo**.

### 3.2 Página do grupo

- **Parâmetros do grupo** — crédito, parcela, prazo, taxas, seguro e o regulamento de referência.
- Números: **Cotas do grupo**, **Cotas com dado**, **Ativas**, **Inadimplentes**, **Contempladas**.
- **Numeração e cotas:**
  - **Integridade da numeração** — confirma que não há duplicidade nem número fora da faixa;
  - **Vincular cotas de clientes** — liga as cotas aos contratos já cadastrados em Consórcios → Contratos;
  - **Gerar numeração completa** — cria todos os números da faixa como *não comercializada* (use só se a alocação das cotas é feita aqui);
  - **Importar situação das cotas** — cole a situação de cada cota (ativa, cancelada, excluída, disponível; em dia, inadimplente, desconhecido). Cotas ligadas a contrato não são sobrescritas;
  - tabela com **Cota**, **Titular**, **Situação**, **Pagamento**, **Contemplada** e **Origem do dado**, com o campo *"Filtrar por número ou titular"*.
- **Assembleias do grupo** e **Auditoria do grupo**.

---

## 4. Regras de apuração

A regra é a tradução do regulamento em passos que o motor executa.

### 4.1 Criar ou editar uma regra

**Nova regra** (ou **Editar rascunho**) abre o formulário, em blocos:

1. **Identificação e fonte normativa** — Chave da regra (fixa entre versões), Nome, Administradora, Produto, Grupo (vazio = vale para toda a administradora), **Fonte do sorteio** (*Loteria Federal*, *Outra fonte regulada* ou **Sorteio próprio (roleta)** — só quando o contrato do grupo prevê), Vigente desde / até e a referência do regulamento.
2. **Resultado oficial → números apurados** — Dígitos por prêmio e Quantidade de prêmios. Use a **Montagem rápida**: marque os prêmios e os grupos de algarismos do regulamento e clique em **Montar plano**. A lista *"Números apurados, na ordem da apuração"* mostra cada passo com um exemplo fictício. Você pode **Adicionar passo**, **Subir**, **Descer** ou **Remover**.
3. **Equivalência, aproximação e substituição** — o que fazer quando o número não é uma cota (por exemplo, *000* vale a última cota), quando a cota sorteada não pode ser contemplada (aproximação para a seguinte ou anterior, com limite de passos e opção de voltar ao início da faixa) e quando todos os candidatos se esgotam (substituição).
4. **Elegibilidade e recursos** — exige adimplência, exclui cotas já contempladas, política para cotas sem dado, uso do fundo de reserva e sorteios de cotas canceladas.
5. **Lances (sempre depois do sorteio)** — se o regulamento prevê lance, a ordem das modalidades, percentuais e desempate.
6. **Contingência** — o que fazer se o resultado oficial não servir.

### 4.2 Ciclo de vida da regra

*Rascunho → Revisão → Aprovada → Publicada.* Na página da regra:

- **Enviar para revisão**, **Devolver para rascunho**, **Excluir rascunho**;
- **Aprovar** — congela o conteúdo com um selo de integridade (governança);
- **Publicar** — passa a valer; a versão publicada anterior da mesma chave é substituída;
- **Arquivar**;
- **Criar nova versão** — única forma de mudar uma regra publicada.

A página mostra a **Situação da regra** (e se o conteúdo confere com o selo), a **Configuração** exatamente como o motor executa, a **Comparação com a versão anterior** (campos alterados e impacto), as **Versões e assembleias que as utilizaram** e a **Auditoria da regra**.

---

## 5. Resultado oficial (Loteria Federal)

- **Importar resultado** — informe Fonte, Dígitos por prêmio, Concurso, Data da extração, os prêmios (com zeros à esquerda, exatamente como publicados), a Referência da fonte e a Evidência. O resultado entra **pendente**.
- **Verificar** — alguém de governança confere e clica em **Confirmar conferência**. Depois disso, o resultado fica congelado.
- **Invalidar / Marcar inválido** — com motivo, para um resultado errado.

Na aba **Inteligência → Automação**, o botão **Coletar da fonte oficial** busca o resultado direto na CAIXA. Mesmo assim ele entra pendente — a verificação é sempre humana.

---

## 6. Assembleias

### 6.1 Criar

**Nova assembleia**: Grupo, Número da assembleia, Data, **Contemplações previstas por sorteio** (o teto do regulamento; o número real depende dos recursos) e Observações. Clique em **Criar assembleia**.

### 6.2 As etapas

A página da assembleia mostra a linha de etapas e **só oferece a próxima ação possível**:

1. **Iniciar preparação**.
2. **Travar elegibilidade** — escolha a regra publicada. Congela a situação de cada cota nesta data; a apuração nunca usa o estado atual.
3. **Travar resultado oficial** — escolha o resultado verificado. *(Se a regra for de sorteio próprio, esta etapa é feita pela **Roleta** — veja a seção 7.)*
4. **Congelar regra e recursos** — informe o saldo do fundo comum, o valor do crédito, o fundo de reserva (e se pode ser usado) e as contemplações previstas. A quantidade real sai de *recursos ÷ crédito*, limitada ao previsto.
5. **Executar apuração do sorteio**.
6. **Apurar lances** — se a regra prevê. Antes, use **Vincular à assembleia** para trazer os lances em aberto das cotas do grupo (do módulo Lances).
7. **Enviar para homologação** → **Homologar resultado** (governança). Homologar abre o **direito** ao crédito; não libera dinheiro.
8. **Travar assembleia** — depois disso, só retificação.

### 6.3 O que a página mostra

- números da elegibilidade congelada (cotas, ativas, adimplentes, inadimplentes, já contempladas, aptas, recursos, contemplações possíveis) e um gráfico;
- **Resultado oficial** travado, com o botão **Ver na roleta**, que anima os números sorteados;
- **Contemplações** — ordem, cota, tipo (sorteio ou lance), número apurado, crédito e status;
- **Números apurados** — cada tentativa: número → cota → resultado → motivo;
- **Ver cálculo** — a prova completa, passo a passo;
- **Cálculos e reprodução** — **Reproduzir cálculo** executa de novo com a mesma entrada; se der diferente, é registrada uma anomalia crítica;
- **Retificação** e **Auditoria da assembleia**.

Quando a base de cotas é parcial, aparece o aviso **"Apuração de conferência"** — o resultado oficial é o da administradora.

### 6.4 Retificação

Para corrigir um erro sem apagar nada:

1. **Solicitar retificação** — Motivo (mínimo 10 caracteres) e Evidência.
2. **Outra pessoa** de governança **aprova** ou **rejeita**, com observação.
3. **Aplicar retificação** — o cálculo original fica marcado como substituído e um novo é gerado. Opcionalmente, gera um novo retrato de elegibilidade com os dados corrigidos.
4. **Homologar retificação**.

---

## 7. Roleta — sorteio próprio

Vale **só** para grupos cujo contrato prevê sorteio próprio e cuja regra tenha a fonte **Sorteio próprio (roleta)**. O painel **"Roleta · sorteio próprio"** aparece na página da assembleia, logo abaixo de *Etapa atual*.

1. **Selo prévio** — antes da assembleia, clique em **Registrar selo prévio**. O sistema sorteia um segredo e guarda só a marca dele. Um selo por assembleia; não pode ser trocado.
2. **Sorteio** — com a elegibilidade travada, alguém de governança digita a **frase pública** dita pelos participantes (opcional) e clica em **Girar a roleta** → **Confirmar e girar**. A roleta gira e revela um prêmio por vez. O resultado é travado na assembleia automaticamente. Só existe **um sorteio por assembleia**.
3. **Conferência** — **Conferir sorteio** refaz a conta no seu navegador e mostra se o selo e os números conferem. **Baixar dados para conferência** gera um arquivo com o passo a passo para um auditor. **Rever na roleta** repete a animação.

A animação só mostra os números já gravados — ela nunca decide nada.

---

## 8. Treinamento · Roleta

Área para **praticar e apresentar** a roleta com um **grupo fictício** de 1.000 cotas (777 aptas, 112 inadimplentes e 111 já contempladas). **Nada é gravado.**

1. **Registrar selo prévio**.
2. Digite uma frase e clique em **Girar a roleta**.
3. Veja as **cotas contempladas** e a tabela **"Como o sistema chegou nesse resultado"** — por exemplo, a cota 973 inadimplente é pulada e a 974 é contemplada.
4. **Conferir sorteio** → *"Sorteio íntegro."*
5. **Simular fraude** — o sistema altera um número e denuncia a adulteração.
6. **Nova rodada** — zera tudo. A lista *"Rodadas desta apresentação"* guarda o histórico da sessão.

---

## 9. Crédito depois da contemplação

Na aba **Crédito**, **Abrir direito ao crédito** cria a operação a partir de uma contemplação homologada. A página do crédito tem:

- **Fluxo do crédito** — contemplado → documentação → análise → garantia → aprovação → crédito disponível → utilização (*disponível não é pagamento*);
- números: crédito contratado, atualizado, lance, lance embutido, **crédito líquido**, utilizado e saldo;
- **Documentação** — requisitos classificados como obrigatório, condicional, recomendado ou informativo (**Novo requisito**, aprovar, dispensar). Só os obrigatórios bloqueiam;
- **Garantias** (**Nova garantia**);
- **Utilização do crédito** — nunca ultrapassa o crédito líquido;
- **Saldo devedor, amortização e quitação** — *contemplação não é quitação*; **Situação da cota** e **Saldo devedor** levam a Parcelas;
- **Razão financeiro** — só inclusão, nada é editado ou apagado;
- **Auditoria do crédito**.

---

## 10. Inteligência do motor

Pelo botão **Inteligência** no topo do Motor.

- **Painel** — assembleias em andamento, retificadas, achados abertos, críticos, que exigem revisão humana e crédito em aberto. **Clique** em Achados, Críticos ou Revisão para abrir a aba **Achados**; em Assembleias ou Crédito para ir ao Motor.
- **Achados** — anomalias, riscos, padrões, inconsistências, oportunidades e alertas, com evidência. Críticos só são encerrados por governança.
- **Assistente** — responda perguntas como *"por que a cota 940 não foi contemplada?"*. Ele só usa dados do sistema e mostra de onde veio. Não publica, não altera, não aprova e não libera.
- **Simulação** — **Simular cenário (e se...?)** roda o mesmo motor sobre uma cópia dos dados. Nunca altera o resultado oficial; cada simulação fica registrada à parte.
- **Automação** — **Coletar da fonte oficial** (CAIXA) e **Varredura de monitoramento** (reproduz todos os cálculos). Tudo vai para o **Log de automações**.
- **Números** — análise estatística dos resultados (com aviso de que não prevê sorteios).
- **Documentos** — cole o trecho do regulamento e clique em **Extrair (pré-visualizar)**: o sistema propõe a regra em rascunho, campo a campo, nunca publicada automaticamente.

---

## 11. Perguntas frequentes

**Por que não consigo mudar uma regra publicada?**
Porque ela pode ter sido usada em assembleias. Clique em **Criar nova versão**.

**Posso refazer um sorteio da roleta?**
Não. Cada assembleia tem um único sorteio. Para praticar, use o **Treinamento · Roleta**.

**Homologar libera o dinheiro?**
Não. Homologar abre o direito ao crédito. A liberação segue o fluxo do crédito (documentação, análise, garantia, aprovação).

**O que é "apuração de conferência"?**
Quando o sistema não tem os dados de todas as cotas do grupo, parte delas é presumida pela regra. O resultado serve para conferir o da administradora.
