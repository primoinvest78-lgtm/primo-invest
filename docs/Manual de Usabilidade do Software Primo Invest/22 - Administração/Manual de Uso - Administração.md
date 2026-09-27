# Manual de Uso — Administração

**Software:** Primo Invest
**Módulo:** Administração (Centro de Administração e Governança)
**Onde fica:** menu lateral → **Administração**. Para abrir direto na lista de usuários: **https://www.primoinvest.com.br/administracao?aba=usuarios**.

---

## 1. Para que serve

Controla **quem usa o sistema e com qual perfil**, as **permissões**, a **auditoria** de tudo o que foi feito e os **dados da empresa**.

### Quem pode usar

Só **Administrador** ou **Gestor**. Os demais veem *"Acesso restrito"*. Algumas ações (dados da empresa, perfis) são exclusivas do Administrador.

### Perfis de usuário

| Perfil | Para quem é |
|---|---|
| **Administrador** | Acesso total à organização, incluindo usuários, permissões e configurações. |
| **Gestor** | Gestão sobre clientes, pipeline, relatórios e usuários. |
| **Assessor** | Atendimento e carteira de clientes no dia a dia. |
| **Operacional** | Integrações, sincronizações e rotinas operacionais. |
| **Financeiro** | Acompanhamento financeiro e patrimonial. |
| **Compliance** | Conformidade, auditoria e aprovações de governança. |
| **Visualizador** | Só consulta. |

### Situações de um usuário

*Ativo*, *Inativo* e *Convite pendente*.

Além disso, o acesso de cada pessoa é **Permanente** ou **Provisório** (com data para acabar). Veja a seção 4.

---

## 2. Abas

Logo no alto da tela, acima das abas, fica uma **faixa laranja** com o botão laranja **Convidar pessoa** (com um ponto piscando). Ela aparece em **todas as abas**, para você não precisar procurar. Só quem pode convidar vê essa faixa.

A tela tem cinco abas: **Dashboard**, **Usuários**, **Perfis e permissões**, **Auditoria** e **Configurações**.

### 2.1 Dashboard

- **Indicadores:** **Usuários ativos** e **Usuários inativos** (clique para abrir *Usuários*), **Convites pendentes**, **Alertas administrativos** (clique para rolar até os alertas) e **Eventos nos últimos 7 dias** (clique para abrir *Auditoria*).
- **Alertas administrativos** — por exemplo, convites parados há mais de 7 dias.
- **Gráficos:** **Usuários por perfil** (**Ver usuários →**), **Atividade por dia — 14 dias** e **Eventos administrativos por módulo** (**Ver auditoria →**).
- **Atividades recentes**.

### 2.2 Usuários

Tabela **Usuários da organização** com **Nome**, **E-mail**, **Perfil**, **Status**, **Acesso**, **Último acesso**, **Criado em**, **Responsável** (quem adicionou) e **Atividades**.

- **Perfil** — escolha na lista para mudar o perfil da pessoa. O sistema **não deixa a organização sem nenhum Administrador ativo**.
- **Status** — o botão ao lado liga/desliga (**Ativar** / **Desativar**) o acesso.
- **Convite pendente** — mostra o botão verde **Ativar acesso** (veja a seção 3).
- **Acesso** — mostra **Permanente** ou um selo com o prazo, e os botões para estender ou encerrar (veja a seção 4).
- **Ver atividades** — abre a *Auditoria* já filtrada por aquela pessoa.

### 2.3 Perfis e permissões

- **Perfis do sistema** — quantas pessoas há em cada perfil.
- **Acesso por módulo** — *Como o acesso funciona hoje*: quem acessa cada módulo e observações.
- **Matriz de permissões** — por perfil, se cada módulo é só de **Visualizar** ou também **Administrar** (*Concedida* / *Não concedida*). Módulos sem permissão detalhada (Leads, Oportunidades, Tarefas, Consórcios) ficam liberados para qualquer membro ativo.

### 2.4 Auditoria

**Central de auditoria** com filtros por **usuário**, **módulo**, **ação** e busca. Colunas: **Usuário**, **Ação**, **Módulo**, **Data/hora** e **Resultado**. Use **Anterior** / **Próxima** para navegar.

**Ver detalhes** abre o **Detalhe do evento**, com **O que mudou** em linguagem comum (antes e depois), os **Dados registrados** ou os **Dados removidos**.

### 2.5 Configurações

- **Empresa** — **Nome**, **Razão social**, **Documento (CNPJ)** e **Organização desde**. Só o Administrador altera. Clique em salvar; aparece *"Salvo."*
- **Notificações** — explica quando cada pessoa recebe aviso (tarefas atribuídas, documentos, pagamentos, consórcios e o resumo do dia) e tem o botão **Abrir minhas notificações**.
- **Segurança** — o que **já está ativo** (segurança por linha em todas as tabelas, funções com checagem de perfil, sempre ao menos um Administrador, auditoria de todas as alterações, nenhuma chave com acesso total na aplicação) e o que **ainda não foi implementado** (autenticação em duas etapas, lista de IPs permitidos, revogação manual de sessões e aprovação em duas pessoas para ações críticas).

---

## 3. Convidar uma pessoa

### 3.1 Enviar convite por e-mail (o jeito recomendado)

A pessoa **não precisa ter conta** no Primo Invest. O convite cria a conta, já libera o acesso e ela mesma cria a senha.

1. Abra **Administração** e clique no botão laranja **Convidar pessoa** (na faixa laranja do alto da tela, ou no alto da aba **Usuários**).
2. Na janela **"Convidar pessoa para o Primo Invest"**, informe o **E-mail** e escolha o **Perfil**.
3. No quadro laranja **Duração do acesso**, escolha:
   - **Permanente** — o acesso não tem data para acabar;
   - **Provisório: 24 horas**, **Provisório: 3 dias**, **Provisório: 7 dias** ou **Provisório: 30 dias** — o acesso acaba sozinho no fim do prazo.
4. Clique em **Enviar convite**.
5. A pessoa recebe um e-mail com um link (peça para ela **conferir também o spam**). O link abre a tela **"Bem-vindo! Crie sua senha"**, onde ela cria a senha (mínimo de **8 caracteres**) e clica em **Salvar senha e entrar**. Também pode clicar em **Agora não, ir direto para o painel** e entrar sem criar a senha naquele momento.
6. Nas próximas vezes, ela entra com o e-mail e a senha que criou, ou com **Entrar com Google**, se o e-mail for do Google.

Mensagens possíveis ao enviar:

- *"Convite enviado! A pessoa recebe um link por e-mail para entrar e criar a senha."* Se o acesso for provisório, a mensagem também diz até quando ele vale;
- *"Essa pessoa já fazia parte da organização. Um novo link de acesso foi enviado."*;
- *"O limite de e-mails por hora foi atingido. Aguarde alguns minutos e tente de novo."*;
- *"Atenção: Administrador não pode ser provisório, então o acesso ficou permanente."*

Se o link já foi usado ou venceu, a pessoa vê **"Link inválido ou vencido"**. Basta enviar um novo convite.

### 3.2 Só vincular uma conta que já existe

Use quando a pessoa **já entrou no Primo Invest pelo menos uma vez** (por exemplo, com **Entrar com Google**) e você não quer mandar e-mail.

1. Clique em **Convidar pessoa** e informe o **E-mail** e o **Perfil**.
2. Clique em **Só vincular conta existente**.
3. A pessoa aparece como **Convite pendente**. Na aba **Usuários**, clique em **Ativar acesso** na linha dela.
4. Pronto: o status fica **Ativo**. Peça à pessoa para atualizar a página.

Mensagens possíveis:

- *"Usuário adicionado como convite pendente."*;
- *"Essa pessoa já faz parte da organização."*;
- *"Nenhuma conta encontrada com esse e-mail. A pessoa precisa criar uma conta na Primo Invest antes de ser adicionada."* Nesse caso, use **Enviar convite**.

Enquanto não for liberada, a pessoa vê a tela **"Esta conta não tem acesso"** (ou **"Acesso aguardando liberação"**, se o convite já existir), com o botão **Sair e entrar com outra conta**.

---

## 4. Acesso provisório (com prazo)

Serve para quem precisa usar o sistema **só por um tempo**, como um investidor ou parceiro que vai avaliar o projeto. A pessoa entra livremente durante o prazo. Quando ele acaba, o acesso **deixa de valer**.

### 4.1 Como acompanhar

Na aba **Usuários**, coluna **Acesso**:

- **Permanente** — sem data para acabar;
- selo **amarelo** *"Provisório — vence em [data e hora]"* — o acesso está valendo;
- selo **vermelho** *"Vencido em [data e hora]"* — o prazo acabou e a pessoa não entra mais.

### 4.2 Estender, encerrar ou tornar permanente

Nos acessos provisórios aparecem os botões:

- **+7 dias** — soma 7 dias ao prazo. Se já tinha vencido, conta 7 dias a partir de agora, e a pessoa volta a entrar;
- **Encerrar agora** — o acesso acaba na hora;
- **∞** (infinito) — transforma em acesso **permanente**.

### 4.3 O que a pessoa vê quando o prazo acaba

Ao abrir o sistema, ela vê a tela **"Seu acesso provisório terminou"**, com a data e a hora do fim e a orientação de pedir a um Administrador para estender. A conta **não é apagada**: se você estender o prazo, ela volta a entrar normalmente.

O bloqueio vale **no próprio banco de dados**, não só na tela. Depois do prazo, nenhum dado é mostrado para essa pessoa, por nenhum caminho.

### 4.4 Regras

- **Administrador nunca é provisório**, para o sistema não correr o risco de ficar sem nenhum Administrador. Para quem só vai avaliar, use outro perfil (por exemplo, **Visualizador**).
- Quem já usava o sistema antes desta função continua com acesso **permanente**.

---

## 5. Perguntas frequentes

**Desativar apaga o usuário?**
Não. A pessoa perde o acesso, mas tudo o que ela fez continua na auditoria. É possível reativar a qualquer momento.

**Por que não consigo mudar meu próprio perfil de Administrador?**
Porque você é o último Administrador ativo. Promova outra pessoa antes.

**Onde vejo o que um usuário alterou?**
Na aba **Usuários**, clique em **Ver atividades** na linha dele.

**Mandei o convite, mas o e-mail não chegou. E agora?**
Peça para a pessoa conferir o spam. O serviço de e-mail tem um limite de envios por hora: se aparecer o aviso de limite, espere alguns minutos e envie de novo.

**O acesso provisório venceu, mas a pessoa ainda precisa usar. Preciso convidar de novo?**
Não. Na aba **Usuários**, clique em **+7 dias** na linha dela. Ela volta a entrar na hora.
