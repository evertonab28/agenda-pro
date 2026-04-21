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
- **Próximas Melhores Ações**: Recomendador inteligente que sugere ações de cobrança (Notificar via WhatsApp, Enviar Link de Pagamento ou Confirmar Recebimento).
- **Alertas de Inadimplência**: Identificação rápida de cobranças vencidas e pendentes diretamente na home.
- **Top Rankings**: Descubra seus serviços mais rentáveis e seus clientes mais fiéis.

### 📅 Agenda Inteligente
- **Múltiplas Visões**: Alterne entre visão Diária, Semanal (estilo Google Calendar) e Mensal.
- **Sincronização Total**: Navegação entre datas com carregamento dinâmico via servidor.
- **Filtros por Profissional**: Visualize a agenda de toda a equipe ou de um colaborador específico.
- **Gestão Rápida**: Crie, edite, cancele ou altere o status de agendamentos em poucos cliques através de modais contextuais.

### 👥 Gestão de Clientes & Insights
- **Perfil 360°**: Histórico completo de agendamentos, pagamentos e logs de atividade de cada cliente.
- **Busca Preditiva**: Autocomplete inteligente para localização rápida de clientes em agendamentos e cobranças.
- **Métricas de Crescimento**: Cálculo automático de taxa de retenção e crescimento de base de clientes nos últimos 30 dias.
- **Ações Rápidas**: Atalhos para editar perfil ou iniciar um novo agendamento com cliente pré-selecionado.

### 🌐 Portal do Cliente (Self-Service)
- **Acesso Sem Senha**: Login ultra-seguro via **Magic Link** (Token 6 dígitos via WhatsApp/Email).
- **Auto-Agendamento**: Fluxo intuitivo para seleção de serviço, profissional e horário com disponibilidade em tempo real.
- **Área do Cliente**: Dashboard centralizado para gerenciar agendamentos ativos e histórico de visitas.
- **Gestão Financeira**: Visualização de faturas e botão "Pagar Agora" integrado.
- **Meu Perfil**: Autonomia para o cliente atualizar seus próprios dados cadastrais.

### 💰 Módulo Financeiro
- **Gestão de Cobranças**: Controle granular de faturas (Pago, Parcial, Pendente, Vencido) com UUIDs para segurança.
- **Checkout e Quitação**: Fluxo unificado para registrar pagamentos parciais ou totais, com geração automática de recibos.
- **Cobranças Avulsas**: Crie cobranças manuais vinculadas ou não a agendamentos, com suporte a busca de clientes existentes.
- **Links de Pagamento**: Geração dinâmica de links únicos com alta entropia para envio via WhatsApp ou Email.
- **Exportação de Dados**: Gere relatórios em CSV para integração com contabilidade ou Excel.

### ⚙️ Configurações Estruturais
- **Serviços**: Cadastro com duração, preço e configuração de disponibilidade.
- **Profissionais**: Gestão de membros da equipe e vínculos com serviços.
- **Horários de Trabalho**: Configuração flexível de expediente, incluindo intervalos de almoço por profissional.
- **Feriados e Bloqueios**: Impeça agendamentos em datas específicas ou feriados nacionais/locais.

### 🎟️ SaaS Billing (Assinatura do Sistema)
- **Assinatura do Workspace**: Gestão de planos e faturamento direto da plataforma para o workspace.
- **Upgrade de Plano**: Fluxo de contratação e upgrade com geração de faturas Asaas sob demanda.
- **Isolamento Financeiro**: Faturas do SaaS (`workspace_billing_invoices`) são mantidas separadas do fluxo financeiro operacional do cliente.
- **Status de Assinatura**: Gating comercial baseado em pagamento confirmado via webhook.

### 🔐 Segurança & Compliance (Hardening)
- **Isolamento de Tenant**: Multi-tenancy rigoroso via Global Scopes e `clinic_id` obrigatório em todas as transações financeiras.
- **Integridade de Rotas**: Mapeamento explícito de parâmetros (`{charge}`, `{service}`) para garantir Route Model Binding resiliente e evitar falhas de resolução.
- **Proteção de Webhooks**: Validação HMAC (SHA256), proteção Anti-Replay e auditoria de idempotência.
- **Mascaramento de PII (LGPD)**: Processador automático de logs que mascara dados sensíveis (email, telefone, documentos).
- **Controle de Acesso (RBAC)**: Perfis de Admin, Manager, Operator e Customer com permissões granulares.

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

5. **Acesso — SaaS (workspace cliente)**: [http://localhost:8000/dashboard](http://localhost:8000/dashboard)
   - **E-mail**: `admin@agendapro.com.br`
   - **Senha**: `AgendaPro@2026`
   - **Workspace Modelo (Slug)**: `workspace-modelo`

6. **Agenda do Workspace**: [http://localhost:8000/agenda](http://localhost:8000/agenda)
   - Mesmas credenciais do item acima.

7. **Agendamento Público (self-service do cliente final)**: [http://localhost:8000/p/workspace-modelo](http://localhost:8000/p/workspace-modelo)
   - Acesso sem senha via **Magic Link** (token de 6 dígitos enviado por WhatsApp/e-mail).
   - O código OTP aparece em `storage/logs/laravel.log` durante o desenvolvimento.
   - Identificador de teste: `test@example.com` ou `11988887777`

8. **Control Plane (admin da plataforma)**: [http://localhost:8000/admin](http://localhost:8000/admin)
   - **E-mail**: `admin@agendapro.com`
   - **Senha**: `password`
   - Permite gerenciar workspaces, assinaturas e trocar planos de clientes.

---

## 🔐 Matriz de Permissões

| Funcionalidade | Admin | Manager | Operator | Cliente (Portal) |
|---|:---:|:---:|:---:|:---:|
| Dashboard Analítico | ✅ | ✅ | ✅ | ❌ |
| Exportar CSV | ✅ | ✅ | ❌ | ❌ |
| Agenda — Ver | ✅ | ✅ | ✅ | ❌ |
| Agenda (Portal) — Ver Próprio | ✅ | ✅ | ✅ | ✅ |
| Agendar (Público/Portal) | ✅ | ✅ | ✅ | ✅ |
| Clientes — CRUD | ✅ | ✅ | ✅ | ❌ |
| Perfil (Portal) — Editar Próprio | ❌ | ❌ | ❌ | ✅ |
| Financeiro — Ver | ✅ | ✅ | ✅ | ❌ |
| Financeiro — Ver Próprias Faturas | ✅ | ✅ | ✅ | ✅ |
| Assinatura/Billing do SaaS | ✅ | ❌ | ❌ | ❌ |
| Configurações (Serviços/Equipe) | ✅ | ✅ | ❌ | ❌ |
| Usuários — CRUD | ✅ | ❌ | ❌ | ❌ |

---

## ⚙️ Variáveis de Ambiente (Configuração)
 
 ```env
 DASHBOARD_CACHE_TTL=120   # TTL do cache do Dashboard em segundos
 FINANCE_CACHE_TTL=120     # TTL do cache Financeiro em segundos
 MESSAGING_DRIVER=fake     # Driver de mensagens (fake, whatsapp) - whatsapp é stub/futuro
 MESSAGING_WEBHOOK_SECRET= # Segredo obrigatório para validação de webhooks em produção
 
 # Asaas SaaS Billing Integration
 ASAAS_API_KEY=            # Chave da conta "Dona da Plataforma"
 ASAAS_SAAS_WEBHOOK_TOKEN= # Token de segurança para webhook de billing
 ```

---

## 🔧 Comandos de Manutenção

```bash
# Limpar todos os caches
php artisan cache:clear && php artisan config:clear && php artisan route:clear

# Reprocessar fila de jobs
php artisan queue:restart

# Verificar status das migrations
php artisan migrate:status

# Ver logs de auditoria
php artisan tinker --execute="App\Models\AuditLog::latest()->limit(10)->get()->toArray();"
```

## ⏰ Cron Necessário

Adicione ao `crontab -e` do servidor:
```cron
* * * * * cd /path/to/agenda-pro && php artisan schedule:run >> /dev/null 2>&1
```

---

## 🩺 Troubleshooting Básico

| Sintoma | Solução Rápida |
|---|---|
| Tela em branco | `npm run build` e `php artisan config:clear` |
| Erro 500 | Ver `storage/logs/laravel.log` |
| Acesso negado (403) | Verificar `role` do usuário no banco |
| Login em loop | `php artisan cache:clear` + verificar `SESSION_DRIVER` |
| Agenda sem eventos | Verificar filtros de data (from/to) na URL |

---

## 📁 Documentação Operacional

- [Deploy Checklist](docs/deploy-checklist.md)
- [Backup & Restore](docs/backup-restore.md)
- [Runbook de Incidentes](docs/runbook-incidentes.md)

---

## 🎨 Filosofia de Design

O Agenda Pro segue princípios de **Micro-frontend Architecture** dentro do ecossistema Monolito, utilizando componentes reutilizáveis alojados em `resources/js/components/ui`. O foco é uma interface limpa, com modo escuro nativo e animações sutis que melhoram a percepção de performance.
