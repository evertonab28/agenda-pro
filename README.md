# 📅 Agenda Pro

**Agenda Pro** é um ecossistema completo e moderno para gestão de agendamentos, controle de clientes e saúde financeira. Projetado para clínicas, estúdios e profissionais liberais, o sistema transforma a complexidade operacional em uma interface fluida, focada em produtividade e insights baseados em dados reais.

Construído como uma **Single Page Application (SPA)** de alta performance, o Agenda Pro combina a robustez do Laravel com a reatividade instantânea do React.

---

## 🚀 Stack Tecnológica

- **Backend**: [Laravel 11](https://laravel.com/) (PHP 8.2+) - Arquitetura MVC sólida e segura.
- **Frontend**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) - Interface tipada e resiliente.
- **Comunicação**: [Inertia.js](https://inertiajs.com/) - Experiência de SPA sem a complexidade de APIs REST tradicionais.
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/) + [Shadcn/UI](https://ui.shadcn.com/) - Design System premium e responsivo.
- **Dados & Gráficos**: [Recharts](https://recharts.org/) para visualização analítica.
- **Build**: [Vite](https://vitejs.dev/) para carregamento instantâneo em desenvolvimento.

---

## 💎 Funcionalidades e Módulos

### 📊 Dashboard Analítico
- **KPIs em Tempo Real**: Visualize agendamentos, faturamento e taxas de conversão com indicadores de variação percentual.
- **Gráficos de Desempenho**: Acompanhe o cruzamento de Agendamentos vs. Receita Diária.
- **Alertas de Inadimplência**: Identificação rápida de cobranças vencidas e pendentes diretamente na home.
- **Top Rankings**: Descubra seus serviços mais rentáveis e seus clientes mais fiéis.

### 📅 Agenda Inteligente
- **Múltiplas Visões**: Alterne entre visão Diária, Semanal (estilo Google Calendar) e Mensal.
- **Sincronização Total**: Navegação entre datas com carregamento dinâmico via servidor.
- **Filtros por Profissional**: Visualize a agenda de toda a equipe ou de um colaborador específico.
- **Gestão Rápida**: Crie, edite, cancele ou altere o status de agendamentos em poucos cliques através de modais contextuais.

### 👥 Gestão de Clientes & Insights
- **Perfil 360°**: Histórico completo de agendamentos, pagamentos e logs de atividade de cada cliente.
- **Métricas de Crescimento**: Cálculo automático de taxa de retenção e crescimento de base de clientes nos últimos 30 dias.
- **Ações Rápidas**: Atalhos para editar perfil ou iniciar um novo agendamento com cliente pré-selecionado.

### 💰 Módulo Financeiro
- **Gestão de Cobranças**: Controle granular de faturas (Pago, Pendente, Vencido).
- **Fluxo de Caixa**: Visão clara de receitas previstas vs. realizadas.
- **Exportação de Dados**: Gere relatórios em CSV para integração com contabilidade ou Excel.

### ⚙️ Configurações Estruturais
- **Serviços**: Cadastro com duração, preço e configuração de disponibilidade.
- **Profissionais**: Gestão de membros da equipe e vínculos com serviços.
- **Horários de Trabalho**: Configuração flexível de expediente, incluindo intervalos de almoço por profissional.
- **Feriados e Bloqueios**: Impeça agendamentos em datas específicas ou feriados nacionais/locais.

### 🔐 Segurança e Acessos
- **Controle de Acesso (RBAC)**: Perfis de Admin, Manager e Operator com permissões distintas.
- **Onboarding Guiado**: Setup assistido para novos usuários, garantindo que o sistema esteja pronto para uso em minutos.

---

## 🛠️ Instalação e Setup

1. **Requisitos**: PHP 8.2+, Composer, Node.js 20+, MySQL/PostgreSQL/SQLite.

2. **Backend**:
   ```bash
   composer install
   cp .env.example .env
   php artisan key:generate
   php artisan migrate --seed
   ```

3. **Frontend**:
   ```bash
   npm install
   ```

4. **Execução**:
   - Terminal 1: `php artisan serve`
   - Terminal 2: `npm run dev`

5. **Acesso**: [http://localhost:8000](http://localhost:8000)

---

## 🎨 Filosofia de Design

O Agenda Pro segue princípios de **Micro-frontend Architecture** dentro do ecossistema Monolito, utilizando componentes reutilizáveis alojados em `resources/js/components/ui`. O foco é uma interface limpa, com modo escuro nativo e animações sutis que melhoram a percepção de performance.
