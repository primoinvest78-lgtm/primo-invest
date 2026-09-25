# Manual de Uso — Clientes

**Software:** Primo Invest
**Módulo:** Clientes
**Onde fica:** menu lateral → grupo **Relacionamento** → **Clientes**.

---

## 1. Para que serve o módulo Clientes

O módulo Clientes é a **base de relacionamento** da sua carteira. Aqui ficam todas as pessoas físicas e empresas atendidas pelo escritório.

Com ele você pode:

- ver a lista completa de clientes, com patrimônio, perfil de investidor, etiquetas e assessor responsável;
- procurar e filtrar clientes;
- cadastrar um cliente novo por meio de um assistente em etapas;
- abrir a **ficha do cliente**, com tudo o que se sabe sobre ele: patrimônio, família, perfil de investidor, metas, histórico de contatos, documentos e oportunidades;
- registrar contatos, anotações, tarefas e oportunidades ligados ao cliente.

O módulo é dividido em duas telas: a **lista de clientes** e a **ficha do cliente**.

---

## 2. A lista de clientes

### 2.1 Cabeçalho

**Botão "Voltar"** — retorna para a tela anterior.

**Título "Clientes"** — logo abaixo aparece o total, por exemplo *"Base de relacionamento e carteira ativa — 48 clientes."*

**Botão "Relatório executivo"** — abre a Central de Relatórios com o relatório executivo já selecionado, para gerar um documento de resumo da carteira.

**Botão "+ Novo cliente"** — abre o assistente de cadastro (explicado na seção 3).

### 2.2 Busca e filtros

Acima da tabela ficam quatro controles. Eles podem ser usados juntos, e a tabela se atualiza na hora.

**"Buscar por nome..."** — digite parte do nome do cliente. A busca não diferencia letras maiúsculas e minúsculas. Exemplo: digitar *"silva"* encontra "Ana Silva" e "Carlos Silva Neto".

**Status** — escolha entre:
- *Todos os status* (padrão);
- *Ativo* — clientes com relacionamento em andamento;
- *Inativo* — clientes sem relacionamento ativo no momento;
- *Prospect* — pessoas que ainda estão sendo conquistadas como clientes.

**Assessor** — mostra só os clientes de um assessor específico. A lista de nomes é montada a partir dos assessores que têm clientes.

**Tag** — mostra só os clientes que têm uma determinada etiqueta (por exemplo, "Investidor" ou "Consorciado").

Para voltar a ver todos, escolha a opção "Todos" em cada filtro e apague o texto da busca.

### 2.3 A tabela

Cada linha é um cliente, com as colunas:

| Coluna | O que mostra |
|---|---|
| **Cliente** | O nome. **Clique no nome para abrir a ficha do cliente.** |
| **Patrimônio consolidado** | Soma de contas e investimentos menos os passivos do cliente. |
| **Perfil de Investidor** | Situação da avaliação de perfil: **Vigente** (dentro da validade), **Vencido** (precisa ser refeita) ou **Não iniciado** (nunca foi feita). |
| **Tags** | As etiquetas do cliente. Um traço (—) indica que não há nenhuma. |
| **Assessor** | O assessor responsável pelo cliente. |

Se nenhum cliente corresponder à busca e aos filtros, aparece *"Nenhum cliente encontrado."*

---

## 3. Cadastrando um cliente novo (assistente "Novo cliente")

Clique em **"+ Novo cliente"**. Abre uma janela com o assistente de cadastro, dividido em **7 etapas**:

**Tipo → Identificação → Contatos → Perfil → Família → Documentos → Revisão**

### 3.1 Como navegar pelo assistente

No topo da janela aparecem:

- a etapa atual, por exemplo *"Etapa 2 de 7 · Identificação"*;
- os círculos numerados de cada etapa:
  - **verde com ✓** — etapa já concluída;
  - **branco** — etapa em que você está;
  - **vermelho com !** — etapa com algum erro a corrigir (aparece na Revisão);
- uma barra de progresso.

Você pode **clicar em uma etapa já visitada** para voltar diretamente a ela.

No rodapé ficam os botões:

- **Cancelar** — fecha o assistente. Se você já preencheu algo, o sistema pergunta se quer mesmo descartar o preenchimento.
- **Voltar** — volta para a etapa anterior sem perder o que foi digitado.
- **Avançar** — confere os campos da etapa e segue para a próxima. Se houver erro, o campo com problema fica marcado em vermelho, com a explicação logo abaixo, e o cursor vai direto para ele.
- **Concluir cadastro** — aparece só na última etapa (Revisão) e grava o cliente.

**Rascunho automático:** enquanto você preenche, o sistema guarda um rascunho no seu navegador (aparece a indicação *"rascunho salvo neste navegador"*). Se a janela fechar sem querer, ao abrir de novo o assistente aparece a mensagem *"Há um cadastro não concluído salvo neste navegador"* com dois botões:
- **Continuar rascunho** — recupera o que você tinha digitado;
- **Descartar** — apaga o rascunho e começa do zero.

> Os arquivos anexados **não** ficam no rascunho — só os dados digitados. Se recuperar um rascunho, anexe os arquivos novamente.

### 3.2 Etapa 1 — Tipo

Escolha:

**Tipo de cliente**
- **Pessoa Física** — indivíduo identificado por CPF (investidor, consorciado ou cliente de relacionamento).
- **Pessoa Jurídica** — empresa identificada por CNPJ, com representante legal e quadro de sócios.

Essa escolha define quais campos e documentos aparecem nas etapas seguintes.

**Tipo de relacionamento** — Prospect, Cliente, Consorciado, Investidor ou as combinações (Cliente + Consorciado, Cliente + Investidor, Cliente + Investidor + Consorciado). O relacionamento escolhido vira etiquetas (tags) do cliente e pode mudar com o tempo.

### 3.3 Etapa 2 — Identificação

**Para Pessoa Física:**

- *Dados pessoais:* nome completo (com sobrenome), nome social (como o cliente prefere ser chamado), CPF, data de nascimento, sexo, nacionalidade, naturalidade, estado civil e profissão.
- *Documento de identificação:* tipo (RG, CNH, Passaporte ou outro documento oficial), número, órgão emissor, UF e data de emissão.

**Para Pessoa Jurídica:**

- *Dados da empresa:* razão social, nome fantasia, CNPJ, data de constituição, natureza jurídica, CNAE, atividade principal, site, faturamento anual, patrimônio e fonte dos recursos.
- *Representante legal:* nome, CPF, cargo, e-mail e telefone.
- *Sócios e beneficiários:* use **"Adicionar sócio"** para incluir cada sócio, com nome, CPF ou CNPJ, participação (%) e cargo. A soma das participações não pode passar de 100%.

**Conferências automáticas:**

- O sistema verifica se o CPF e o CNPJ são válidos (dígitos verificadores).
- Ao clicar em **Avançar**, o sistema procura se **já existe um cliente com o mesmo CPF ou CNPJ**. Se existir, o avanço é bloqueado com a mensagem *"Já cadastrado para [nome]. Abra o perfil existente em vez de duplicar."* Isso evita clientes em duplicidade.

### 3.4 Etapa 3 — Contatos

- *Contato principal:* e-mail e celular (obrigatórios) e WhatsApp. Se o WhatsApp for o mesmo número do celular, basta marcar a opção correspondente.
- *Endereço:* digite o **CEP** e o sistema busca automaticamente logradouro, bairro, cidade e estado (aparece *"Buscando CEP"* enquanto consulta). Complete com número, complemento, país e tipo de residência.
- *Contatos adicionais:* use **"Adicionar contato"** para incluir telefone fixo, e-mail secundário, contato de secretária etc., com tipo, identificação e observação.

Ao avançar, o sistema também confere se **o e-mail já pertence a outro cliente**. Nesse caso, ele avisa, mas permite continuar (duas pessoas podem compartilhar um e-mail, como em uma família).

### 3.5 Etapa 4 — Perfil

- *Perfil profissional:* situação profissional, empresa, CNPJ da empresa, cargo e tempo de atividade.
- *Perfil financeiro:* renda mensal, renda familiar, outras rendas, fonte de renda, patrimônio estimado e fonte dos recursos (valores mensais, exceto o patrimônio). Para empresas, faturamento e patrimônio já foram informados na identificação.
- *Conformidade* (uso interno): classificação de risco, beneficiário final, origem dos recursos em detalhe e observações de conformidade. Essa parte pode ser completada depois pela área de conformidade.

> Esta etapa **não é uma análise de crédito**: são informações cadastrais de relacionamento.

### 3.6 Etapa 5 — Família

Só para Pessoa Física (para empresas aparece *"Núcleo familiar não se aplica a pessoa jurídica"*).

- *Cônjuge/companheiro(a):* marque que o cliente tem cônjuge e preencha nome, CPF, nascimento, profissão, regime de bens, e-mail e telefone. O CPF do cônjuge não pode ser o mesmo do titular.
- *Dependentes e outros membros:* use **"Adicionar membro"** para cada pessoa, com nome, vínculo, CPF e data de nascimento.

### 3.7 Etapa 6 — Documentos

Os documentos aparecem em três grupos:

1. **Obrigatórios para cadastro** — exigência interna para concluir o cadastro. Podem ficar **pendentes** e ser solicitados ao cliente depois. Se algum não se aplicar, use o status **"Dispensado"**.
2. **Condicionais** — dependem do perfil (estado civil, cônjuge, renda). Não bloqueiam o cadastro. O sistema já marca os que parecem necessários pelo que você preencheu.
3. **Para operações futuras e análise** — normalmente pedidos quando surgir uma operação específica. Marque só se já quiser solicitar.

Para cada documento você pode:

- **anexar o arquivo** (opcional, até 15 MB — pode ser enviado depois);
- escolher o **status** (por exemplo, Pendente, Recebido ou Dispensado);
- clicar em **"Ver detalhes"** para informar nome, categoria, data de validade (para CNH e comprovantes com prazo), responsável pelo envio, responsável pela validação e observações. **"Recolher detalhes"** esconde esses campos;
- usar **"Remover arquivo"** para tirar um arquivo anexado por engano.

Use **"Novo documento"** para incluir um documento que não está na lista.

### 3.8 Etapa 7 — Revisão

Mostra um resumo de tudo o que foi preenchido, dividido em Identificação, Contato, Endereço, Perfil, Família e Documentos.

- Cada bloco tem um atalho para **editar** aquela etapa.
- Em Documentos aparecem os já **recebidos**, os **pendentes (serão solicitados)** e os **condicionais não solicitados**.
- Pendências de documentos **não impedem a conclusão** — podem ser completadas depois, no perfil do cliente.
- Se o sistema encontrou um cliente parecido (mesmo e-mail), aparece um aviso com a opção **"Concluir mesmo assim"**.

Clique em **"Concluir cadastro"**. Enquanto grava, o botão mostra o andamento (*"Gravando cadastro..."*, depois *"Enviando documentos (1 de 3)..."*).

### 3.9 Cadastro concluído

Aparece a confirmação *"[Nome] cadastrado com sucesso"*, informando que contatos, endereço, núcleo familiar, ficha cadastral e solicitações de documentos foram registrados.

Se algum arquivo não conseguiu ser enviado, aparece o aviso *"Alguns arquivos não foram enviados"*, com a lista. As solicitações foram criadas mesmo assim — envie esses arquivos pela ficha do cliente.

Três botões:

- **Fechar** — fecha a janela.
- **+ Cadastrar outro** — limpa o assistente para um novo cadastro.
- **Abrir perfil do cliente →** — vai direto para a ficha do cliente recém-cadastrado.

---

## 4. A ficha do cliente

Abra clicando no nome do cliente na lista.

### 4.1 Cabeçalho da ficha

Mostra o **nome do cliente** e o **assessor responsável** (ou *"Sem assessor vinculado"*).

**"Voltar a Clientes"** — retorna à lista.

**"Relatório do cliente"** — abre a Central de Relatórios com o relatório deste cliente já selecionado. Você não precisa escolher o cliente de novo.

### 4.2 Ações rápidas

Quatro botões para registrar algo sem sair da ficha:

**Nova tarefa** — cria uma tarefa ligada ao cliente, com título, prazo (data e hora) e prioridade (Baixa, Normal, Alta ou Urgente). Clique em **"Criar tarefa"** para salvar. A tarefa aparece também no módulo Tarefas.

**Novo contato** — registra um contato feito com o cliente. Escolha o tipo (**Ligação**, **E-mail** ou **Reunião**), escreva o assunto e uma descrição, e clique em **Salvar**. O contato entra na linha do tempo do relacionamento e na Atividade recente do Dashboard.

**Nova oportunidade** — cria uma oportunidade de negócio para o cliente, com título, tipo (Investimento, Aporte, Consórcio, Planejamento ou Outro produto) e valor estimado. A oportunidade aparece no módulo Oportunidades.

**Novo membro familiar** — adiciona uma pessoa ao núcleo familiar do cliente, com nome completo e grau de relacionamento (por exemplo, cônjuge ou filho).

### 4.3 As abas da ficha

A ficha é organizada em sete abas. Clique no nome da aba para trocar.

#### Aba "Visão Geral"

É o retrato completo do cliente:

- **indicadores:** patrimônio total, liquidez, investimentos, consórcios, passivos, metas ativas, oportunidades e tarefas pendentes;
- **Evolução patrimonial:** gráfico com o patrimônio do cliente ao longo dos meses;
- **Composição patrimonial:** como o patrimônio se divide;
- **Principais ativos**, **Contas** e **Passivos** do cliente;
- **Dados cadastrais:** nome completo, nome preferido, documento, nascimento, status e endereço principal;
- **Contatos** cadastrados, com o principal destacado;
- **Último contato** e **Próximo contato**;
- **Tags** do cliente;
- **Alertas** relevantes sobre o cliente.

Quando algo não existe, aparece a indicação correspondente (por exemplo, *"Nenhuma conta cadastrada."*).

#### Aba "Núcleo Familiar"

Lista os **membros** da família do cliente e o vínculo de cada um.

- **Lápis (Editar relação)** — permite corrigir o vínculo (por exemplo, de "Filho" para "Enteado"). Depois clique em **Salvar relação**, ou em **Cancelar** para desistir.
- **Lixeira (Remover membro)** — tira a pessoa do núcleo familiar. O sistema pede confirmação antes.

Para incluir alguém, use o botão **"Novo membro familiar"** das ações rápidas.

#### Aba "Perfil de Investidor"

Mostra a avaliação de perfil de investidor (suitability) mais recente:

- a **classificação** (por exemplo, Conservador, Moderado, Arrojado);
- a situação: **Vigente** ou **Vencido**;
- **Objetivo**, **Horizonte** de investimento e **Score**;
- o **Histórico de avaliações** anteriores, quando houver.

Se o cliente ainda não foi avaliado, aparece *"Nenhuma avaliação de suitability registrada para este cliente ainda."*

*Situação atual:* nesta versão, a aba é somente para consulta — o registro de uma nova avaliação ainda não está disponível na tela.

#### Aba "Metas Financeiras"

Lista as metas do cliente (por exemplo, aposentadoria, compra de imóvel), com progresso e prazo, e as contas vinculadas a cada meta.

**Clique em uma meta** para abrir o detalhe dela no módulo Patrimônio → Metas.

#### Aba "Relacionamento"

Mostra a **Linha do tempo de relacionamento**: contatos, anotações e tarefas do cliente, do mais recente para o mais antigo.

Botões no alto da aba:

- **Registrar interação** — registra uma ligação, e-mail ou reunião, com assunto e descrição.
- **Nova nota** — escreve uma anotação livre sobre o cliente (título opcional e conteúdo).

Em cada item da linha do tempo:

- **Lápis** — edita a nota ou a tarefa (título, conteúdo, prazo, prioridade).
- **Lixeira (Excluir)** — remove o item da linha do tempo.

#### Aba "Documentos"

Lista os documentos enviados para o cliente, com nome, tipo, data e tamanho.

- **"Enviar documento"** — abre a seleção de arquivo do seu computador. O arquivo é guardado com segurança e passa a aparecer na lista (e no Cofre Digital).
- **Lixeira (Excluir documento)** — apaga o documento. O sistema pede confirmação, porque a exclusão **não pode ser desfeita**.

Se nada foi enviado ainda, aparece *"Nenhum documento enviado ainda."*

#### Aba "Oportunidades"

Lista as oportunidades de negócio do cliente, com tipo, etapa e data prevista de fechamento (ou *"Sem previsão"*).

**Clique em uma oportunidade** para abrir o detalhe no módulo Oportunidades.

Para criar uma nova, use **"Nova oportunidade"** nas ações rápidas.

---

## 5. Passo a passo das tarefas mais comuns

**Cadastrar um cliente pessoa física**
1. Clientes → **+ Novo cliente**.
2. Escolha **Pessoa Física** e o tipo de relacionamento → **Avançar**.
3. Preencha identificação, contatos, perfil e família, clicando em **Avançar** a cada etapa.
4. Em Documentos, anexe o que já tiver e deixe o resto como pendente.
5. Confira a Revisão → **Concluir cadastro** → **Abrir perfil do cliente**.

**Registrar uma ligação feita para um cliente**
1. Abra a ficha do cliente.
2. Clique em **Novo contato** → tipo **Ligação** → assunto e descrição → **Salvar**.

**Encontrar os clientes com perfil de investidor vencido**
1. Na lista, observe a coluna **Perfil de Investidor**: os vencidos aparecem com a etiqueta vermelha **"Vencido"**.

---

## 6. Perguntas frequentes

**Tentei cadastrar e o sistema disse que o CPF já existe. O que faço?**
O cliente já está na base. Procure pelo nome na lista e abra a ficha existente, em vez de criar outro cadastro.

**Fechei a janela sem querer no meio do cadastro. Perdi tudo?**
Não. Abra "Novo cliente" de novo e clique em **"Continuar rascunho"**. Só os arquivos anexados precisam ser anexados novamente.

**Posso concluir o cadastro sem todos os documentos?**
Sim. Os documentos pendentes viram solicitações e podem ser enviados depois.

**Qual a diferença entre "Novo contato" e "Nova nota"?**
"Novo contato" registra uma interação real com o cliente (ligação, e-mail, reunião). "Nova nota" é uma anotação interna, sem interação.

---

## 7. Situação atual desta versão (resumo)

- Ainda **não é possível editar ou excluir** os dados cadastrais de um cliente depois de concluído o cadastro.
- A aba **Perfil de Investidor** é somente para consulta.
- Algumas confirmações de exclusão (documentos e membros da família) usam a janela de confirmação do próprio navegador.
