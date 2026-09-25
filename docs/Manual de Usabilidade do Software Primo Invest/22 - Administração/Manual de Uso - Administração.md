# Manual de Uso — Administração

**Software:** Primo Invest
**Módulo:** Administração (Centro de Administração e Governança)
**Onde fica:** menu lateral → **Administração**. Para abrir direto na lista de usuários: **primo-invest.vercel.app/administracao?aba=usuarios**.

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

---

## 2. Abas

A tela tem cinco abas: **Dashboard**, **Usuários**, **Perfis e permissões**, **Auditoria** e **Configurações**.

### 2.1 Dashboard

- **Indicadores:** **Usuários ativos** e **Usuários inativos** (clique para abrir *Usuários*), **Convites pendentes**, **Alertas administrativos** (clique para rolar até os alertas) e **Eventos nos últimos 7 dias** (clique para abrir *Auditoria*).
- **Alertas administrativos** — por exemplo, convites parados há mais de 7 dias.
- **Gráficos:** **Usuários por perfil** (**Ver usuários →**), **Atividade por dia — 14 dias** e **Eventos administrativos por módulo** (**Ver auditoria →**).
- **Atividades recentes**.

### 2.2 Usuários

Tabela **Usuários da organização** com **Nome**, **E-mail**, **Perfil**, **Status**, **Último acesso**, **Criado em**, **Responsável** (quem adicionou) e **Atividades**.

- **Perfil** — escolha na lista para mudar o perfil da pessoa. O sistema **não deixa a organização sem nenhum Administrador ativo**.
- **Status** — o botão ao lado liga/desliga (**Ativar** / **Desativar**) o acesso.
- **Convite pendente** — mostra o botão verde **Ativar acesso** (veja a seção 3).
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

## 3. Liberar o acesso de uma pessoa

A pessoa **precisa ter entrado no Primo Invest pelo menos uma vez** (por exemplo, com **Entrar com Google**). Depois:

1. Abra **Administração** → aba **Usuários** (ou use o link direto **/administracao?aba=usuarios**).
2. Clique em **Adicionar usuário**.
3. Informe o **E-mail** e escolha o **Perfil**. Confirme.
4. A pessoa aparece como **Convite pendente**. Clique em **Ativar acesso** na linha dela.
5. Pronto: o status fica **Ativo**. Peça à pessoa para atualizar a página.

Mensagens possíveis ao adicionar:

- *"Usuário adicionado como convite pendente."*;
- *"Essa pessoa já faz parte da organização."*;
- *"Nenhuma conta encontrada com esse e-mail. A pessoa precisa criar uma conta na Primo Invest antes de ser adicionada."*

Enquanto não for liberada, a pessoa vê a tela **"Esta conta não tem acesso"** (ou **"Acesso aguardando liberação"**, se o convite já existir), com o botão **Sair e entrar com outra conta**.

---

## 4. Perguntas frequentes

**Desativar apaga o usuário?**
Não. A pessoa perde o acesso, mas tudo o que ela fez continua na auditoria. É possível reativar a qualquer momento.

**Por que não consigo mudar meu próprio perfil de Administrador?**
Porque você é o último Administrador ativo. Promova outra pessoa antes.

**Onde vejo o que um usuário alterou?**
Na aba **Usuários**, clique em **Ver atividades** na linha dele.
