# Requisitos de Engenharia - PRIMO INVEST

## 1. Arquitetura e stack

- Aplicação em Next.js com TypeScript
- UI em React com Tailwind
- Uso de componentes modulares em `components/`
- Dados mockados em `lib/mock/`
- Estrutura organizada para futura integração com Supabase/TanStack Query

## 2. Restrições do projeto

### 2.1 Banco de dados
- Não deve haver criação de esquemas, tabelas ou migrations
- Não devem ser alterados scripts de SQL
- Não deve existir modificação em RLS
- Não deve haver alteração do ambiente Supabase

### 2.2 Segurança e acesso
- Não implementar autenticação
- Não criar fluxos de login
- Não expor permissões ou dados sensíveis

### 2.3 Dependências
- Não instalar novas dependências
- Usar apenas as bibliotecas já presentes em `package.json`
- Evitar mudanças de stack sem aprovação explícita

### 2.4 Dados
- Usar mock data tipada
- Evitar criação de dados reais no Supabase
- Não assumir integração com backend em fase atual

## 3. Qualidade de software

- Manter código legível, modular e reutilizável
- Seguir princípios de componentização
- Priorizar hierarquia visual e UX institucional
- Preservar responsividade para desktop, tablet e mobile
- Validar lint e build antes de publicar

## 4. Requisitos de interface

- Visual institucional premium
- Paleta definida pela identidade visual do projeto
- Sidebar, header, KPIs, gráficos e painéis analíticos
- Uso de `motion/react` para animações discretas
- Uso de Recharts para gráficos de análise
- Logo existente em `public/primo-invest-logo.png`

## 5. Critérios de aceite

A solução será considerada aceitável quando:

- a aplicação renderiza o dashboard principal
- o layout segue a identidade visual acordada
- a estrutura está quebrada em componentes
- os dados vêm de mocks tipados
- o projeto continua compilando com lint e build
- não há alteração de infra de dados ou autenticação

## 6. Evidências de validação

- `npm run lint` executado com sucesso
- `npm run build` executado com sucesso
- Estado do projeto revisado após correções

## 7. Risco e controle

- Risco principal: permitir drift de escopo e alterações fora do prompt
- Controle: registrar mudanças em documentação e manter foco no dashboard visual
- Processo: cada etapa deve ser validada por lint/build e registrada em log
