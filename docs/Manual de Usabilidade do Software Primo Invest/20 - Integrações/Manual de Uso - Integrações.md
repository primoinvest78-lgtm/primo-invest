# Manual de Uso — Integrações

**Software:** Primo Invest
**Módulo:** Integrações e Histórico de sincronização
**Onde fica:** menu lateral → grupo **Integrações** → **Integrações** (ou **Histórico de sincronização**).

---

## 1. Para que serve

É o ponto central para **conectar o Primo Invest a fontes externas** — bancos, corretoras, Open Finance, bolsa, calendário, e-mail — e **controlar o fluxo de dados**: cadastro, sincronização, alertas e mapeamento de campos.

### Quem pode usar

Só perfis de **administração**, **gestão** ou **operações**. Os demais veem *"Acesso restrito"*.

### Situação atual (importante)

A maioria dos itens do catálogo está **"Disponível para configuração futura"**: o cadastro existe para planejamento e governança, mas **nenhum conector real** está implementado para eles ainda. Os botões de testar e sincronizar registram uma execução honesta no histórico, **nunca um resultado inventado**.

A exceção já funcionando é a **agenda de tarefas no calendário** (seção 4).

---

## 2. Tela de Integrações

### 2.1 Cabeçalho

Botão **Histórico de sincronização**.

### 2.2 Indicadores

**Integrações ativas**, **Inativas**, **Não configuradas**, **Sincronizações executadas**, **Erros de sincronização** e **Precisam de atenção**, com a data da última sincronização (ou *"Sem sincronizações ainda"*).

### 2.3 Requer atenção

Lista de integrações com **alertas em aberto**, cada uma com o botão **Ver integração**.

### 2.4 Gráficos

- **Sincronizações por período** e **Sucesso × erro** — com o botão **Ver histórico →**;
- **Distribuição por status** — quantas integrações estão em cada situação.

### 2.5 Catálogo — Integrações disponíveis

Um cartão por integração: *Open Finance*, *B3 — Bolsa de Valores*, *Custódias*, *Bancos*, *Corretoras*, *CRM*, *E-mail*, *Calendário*, *WhatsApp*, *Assinatura digital*, *Armazenamento*, *APIs externas*, *Serviços de mercado* e *Webhooks*.

Cada cartão mostra a situação, os **Registros sincronizados** e a **Última sincronização**, e os atalhos **Testar conexão** e **Sincronizar agora**. Clique no cartão para abrir o detalhe.

---

## 3. Detalhe da integração

### 3.1 Cabeçalho

Mostra o nome, a situação e: **Ambiente** (*Testes* ou *Produção*), **Frequência** (*Manual*, *A cada hora*, *Diária* ou *Semanal*), **Credenciais**, **Responsável**, **Última** e **Próxima execução**, **Ativada em / por**, **Registros sincronizados** e **Execuções com erro**.

### 3.2 Ações

- **Testar conexão** e **Sincronizar agora** — registram uma execução no histórico;
- **Ativar** / **Desativar**;
- **Configurar** — escolha **Ambiente**, **Frequência** e **Responsável** e marque **Credenciais configuradas por fora**. Esse campo é só um sinalizador de governança: **nenhuma senha ou chave é digitada ou guardada aqui**. Clique em **Salvar configuração**.

### 3.3 Mapeamento de dados

Diz qual campo externo corresponde a qual campo do Primo Invest (**Origem → Primo Invest**).

- **Novo mapeamento** → **Mapear campo**: informe a origem (ex.: *Cliente externo → Nome*) e o destino (ex.: *Cliente → nome*), o **Status** e uma observação. Clique em **Salvar mapeamento**.
- Status possíveis: **Mapeado** (conferido e em uso), **Pendente** (cadastrado, não validado) e **Conflito** (os dois lados divergem e precisam de ajuste).
- **Remover mapeamento** — na linha.

### 3.4 Histórico de sincronização

As últimas execuções com **Início**, **Duração**, **Disparado por**, **Processados**, **Situação** e **Detalhe**. **Ver histórico completo** leva à tela de histórico.

---

## 4. Minha agenda de tarefas no calendário

No detalhe da integração **Calendário** fica a **Assinatura pessoal**. Ela coloca **as suas tarefas com prazo** no seu app de calendário, atualizando sozinhas.

1. Clique em **Copiar link** — há duas opções: **Link para colar (https)** e **Assinatura direta (webcal)**.
2. No Google Calendar, Outlook ou Apple Calendar, use **"Adicionar calendário por URL"** e cole o link.
3. Pronto: as tarefas atribuídas a você aparecem na agenda.

O link é **pessoal**. A tela mostra quando o seu app consultou a agenda pela última vez (ou *"Ainda não consultado por nenhum app de calendário."*). Se o link vazar, **revogue** e gere outro.

---

## 5. Histórico de sincronização

Filtros: **Buscar por integração ou erro**, **Situação**, **Integração** e **Limpar filtros**.

Colunas: **Início**, **Duração**, **Disparado por**, **Processados**, situação e **Ver detalhe do erro** quando houver falha.

Sem execuções: *"Nenhuma sincronização executada ainda"* — use **Testar conexão** ou **Sincronizar agora** numa integração.

---

## 6. Perguntas frequentes

**Por que a sincronização não trouxe dados?**
Porque o conector daquela integração ainda não foi implementado. O histórico registra isso com honestidade.

**Onde coloco a senha do banco ou da corretora?**
Em lugar nenhum do Primo Invest. As credenciais ficam fora do sistema; aqui você só marca que elas foram configuradas.

**Minhas tarefas não aparecem na agenda.**
Confira se a tarefa tem prazo e está atribuída a você. Os apps de calendário consultam o link de tempos em tempos, então pode haver alguns minutos de atraso.
