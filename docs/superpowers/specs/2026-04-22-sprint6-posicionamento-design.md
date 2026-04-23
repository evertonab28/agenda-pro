# Spec: Sprint 6 — Posicionamento, Clareza de Produto e UX de Ativação

**Data:** 2026-04-22  
**Status:** Aprovado para implementação

---

## 1. Contexto e objetivo

As Sprints 1–5 consolidaram: segurança de OTP, scheduling soberano, lifecycle central de appointment, integrações/webhooks robustas e UX crítica de agendamento (FullCalendar). O produto está operacionalmente sólido.

A Sprint 6 não adiciona domínios novos. Ela resolve um problema de clareza: o produto entrega mais do que comunica, e os pontos de maior valor (checkout integrado, confirmação por WhatsApp, retenção) estão escondidos na UI ou exigem mais atrito do que o necessário para ativar.

**Objetivo:** tornar o produto mais claro, focado e vendável para o ICP definido — sem rebrand completo, sem roadmap novo, sem mexer em lógica de negócio.

---

## 2. ICP primário desta fase

**Negócios de serviço com atendimento agendado e operação dependente de horário.**

Segmentos foco:
- Barbearias
- Lava rápidos / estética automotiva
- Estética (salões, manicures, depilação, facial)
- Clínicas (psicólogos, fisioterapeutas, nutricionistas, odonto)
- Oficinas leves (alinhamento, revisão, troca de óleo)

Denominador comum: atendimento agendado · confirmação · cobrança por sessão · operação dependente de profissional/vaga · recorrência e retorno do cliente.

Fora do escopo desta fase: academias com acesso livre, delivery, consultoria sem horário fixo, qualquer prestador de serviço genérico.

---

## 3. Textos aprovados de posicionamento

### Headline principal
> Agendamento, confirmação e cobrança num só lugar — para negócios que vivem de horário.

### Subheadline
> Do agendamento pelo WhatsApp até o pagamento na saída — o AgendaNexo opera junto com você.

### Cinco pilares (usados em onboarding, marketing interno e tooltips)

| # | Pilar | Texto curto |
|---|-------|-------------|
| 1 | Confirmação pelo WhatsApp | Seu cliente confirma ou reagenda respondendo uma mensagem. Sem ligar, sem esperar. |
| 2 | Cobrança no encerramento | Quando o atendimento termina, a cobrança já está gerada. Com link de Pix ou pagamento presencial. |
| 3 | Link de agendamento sem senha | Seu cliente abre, escolhe o horário e confirma. Sem criar conta, sem senha. |
| 4 | Clientes em risco | Saiba quem está sumindo antes de perder o cliente. O sistema classifica sozinho. |
| 5 | Agenda com regras reais | Multi-profissional, com buffer, feriados e horário de pico. Não é Google Agenda. |

### Política de comunicação honesta para features com dependência externa

**Pilar 1 (WhatsApp):** só aparece como ativo se `WorkspaceIntegration` com `provider = evolution` e `status = active` existir para o workspace. Caso contrário, a UI mostra o pilar com badge "Disponível após conectar seu WhatsApp" e CTA para Configurações > Integrações.

Essa regra vale para qualquer elemento de UI que referencie confirmação automática por WhatsApp.

---

## 4. Política de rename AgendaNexo

### Estado atual
O código usa "Agenda Pro" em:
1. `resources/js/Layouts/AppLayout.tsx` — sidebar logo (linha 61) e header (linha 197 "Visão Geral" — não é nome, ok)
2. `resources/views/welcome.blade.php` — landing/welcome não utilizada em produção ativa (verificar)
3. Outros `<Head title="...">` em páginas individuais (maioria já usa "AgendaNexo" ou nome da página)

**Nota:** `resources/js/Pages/Onboarding/Index.tsx` linha 121 já usa `"Ativação do AgendaNexo"` — a troca parcial já começou.

### Política aprovada: rollout controlado

Sprint 6 faz o rename nas **áreas operacionais principais** onde o usuário autenticado passa o tempo:
1. Sidebar logo em `AppLayout.tsx`
2. `<title>` padrão do `app.blade.php` (tag `<title>` global)
3. Páginas que ainda exibem "Agenda Pro" no `<Head title>`

**Fora do escopo desta sprint:** domínio/URL, emails transacionais, portal do cliente (esses têm impacto maior e precisam de decisão separada).

**Critério:** após a sprint, nenhum usuário autenticado deve ver "Agenda Pro" nas áreas principais da UI. O portal `/p/{slug}` e emails ficam para sprint futura.

---

## 5. Recorte funcional da sprint

Seis entregas, em ordem de menor para maior risco:

### T1 — Rename controlado na UI
Substituir "Agenda Pro" por "AgendaNexo" nas áreas operacionais principais. Mudança puramente de string/visual, zero lógica de negócio.

**Arquivos afetados:**
- `resources/js/Layouts/AppLayout.tsx` — sidebar logo
- `resources/views/app.blade.php` — `<title>` global (adicionar tag `<title>`)
- `resources/views/welcome.blade.php` — se contiver o nome (verificar)

**Critério de aceite:** sidebar mostra "AgendaNexo"; título do browser mostra "AgendaNexo" em todas as páginas autenticadas; nenhuma ocorrência de "Agenda Pro" visível para usuário autenticado nas áreas operacionais.

---

### T2 — Link de agendamento visível no dashboard
O portal `/p/{workspace:slug}/agendar` existe e funciona. O profissional não sabe que ele existe.

**Entrega:** card fixo no `Dashboard/index.tsx` mostrando o link público do workspace com botão "Copiar link" e "Abrir no navegador". Aparece sempre, acima dos KPIs.

**Dados necessários:** `publicBookingUrl` — já existe em `OnboardingController` como `publicBookingUrl`. Precisa ser adicionado como prop do `DashboardController`.

**Arquivos afetados:**
- `resources/js/Pages/Dashboard/Components/BookingLinkBanner.tsx` — novo componente
- `resources/js/Pages/Dashboard/index.tsx` — importar e renderizar `BookingLinkBanner`
- `app/Http/Controllers/DashboardController.php` — adicionar `publicBookingUrl` e `workspaceSlug` às props

**Critério de aceite:** card aparece no topo do dashboard com URL correta para o workspace logado; botão "Copiar link" copia para o clipboard; botão "Abrir" abre em nova aba.

---

### T3 — CTA "Finalizar e Cobrar" destacado no modal de agendamento
O botão de checkout existe mas está enterrado como um dos muitos botões de status. Para o ICP, finalizar e cobrar é a ação principal no encerramento do atendimento.

**Entrega:** no `AppointmentModal`, quando `status === 'scheduled' || status === 'confirmed'`, adicionar um botão primário destacado "Finalizar e Cobrar" que redireciona para `/agenda/{id}/finalizar` (fluxo de checkout já existente). O botão fica acima da seção "Mudar status", com visual distinto (cor primária, tamanho maior, ícone `CreditCard`).

**Arquivos afetados:**
- `resources/js/Pages/Agenda/components/AppointmentModal.tsx` — adicionar botão destacado na seção de ações

**Critério de aceite:** botão aparece somente para appointments com status `scheduled` ou `confirmed`; clique redireciona para `/agenda/{id}/finalizar`; botão não aparece para `completed`, `canceled`, `no_show`.

---

### T4 — Card de clientes em risco no dashboard
O CRM já calcula e segmenta. O profissional não vê esse dado de forma acionável no dashboard.

**Entrega:** card no `Dashboard/index.tsx` mostrando contagem de clientes nos segmentos "Em Risco" e "Inativo" com botão "Ver clientes" que leva para `/crm?segment=Em+Risco`. Aparece somente se a contagem for > 0.

**Dados necessários:** `at_risk_count` (soma de `Em Risco` + `Inativo`) e `at_risk_segment` — calculado no `DashboardController` via `CRMService::getSegmentCounts()`.

**Arquivos afetados:**
- `resources/js/Pages/Dashboard/Components/AtRiskBanner.tsx` — novo componente
- `resources/js/Pages/Dashboard/index.tsx` — importar e renderizar `AtRiskBanner`
- `app/Http/Controllers/DashboardController.php` — adicionar `at_risk_count` às props

**Critério de aceite:** card aparece quando `at_risk_count > 0`; número exibido é correto; link "Ver clientes" leva para CRM filtrado; card não aparece quando `at_risk_count === 0`.

---

### T5 — Texto explicativo de no-show fee no modal
A cobrança automática de taxa por falta existe (`ensureNoShowFeeForAppointment()`), mas o operador não tem feedback visual sobre o que acontece ao marcar "Não Compareceu".

**Entrega:** no `AppointmentModal`, ao selecionar o status `no_show` (antes de confirmar), mostrar tooltip ou texto inline: _"Uma cobrança de taxa de no-show será gerada automaticamente."_ — apenas se o workspace tiver configuração de taxa ativa (verificar se existe campo de configuração; se não existir, exibir sempre ao marcar no_show).

**Arquivos afetados:**
- `resources/js/Pages/Agenda/components/AppointmentModal.tsx` — adicionar texto explicativo na confirmação de no_show

**Critério de aceite:** texto aparece quando o usuário seleciona "Não Compareceu" e ainda não confirmou; texto não aparece para outros status; texto não bloqueia o fluxo — é informativo apenas.

---

### T6 — Passo-a-passo de ativação de WhatsApp para não-técnicos
Conectar a Evolution API hoje exige saber URL, instância e API key. Para o ICP (barbeeiro, dono de lava rápido), isso é uma barreira intransponível.

**Entrega:** na página `Configurations/Integrations/Index.tsx`, substituir os campos soltos de Evolution API por um stepper guiado de 3 passos:

1. **"Insira a URL da sua Evolution API"** — campo com placeholder `https://api.seudominio.com` + link de ajuda "O que é isso?"
2. **"Nome da instância"** — campo com placeholder `minha-barbearia` + texto: _"Você vê isso no painel da sua Evolution API"_
3. **"Chave de API"** — campo com placeholder + texto: _"Encontrada em Configurações > API Keys na Evolution"_

Após preenchimento dos 3 campos, botão "Testar conexão" — comportamento idêntico ao atual. Status de sucesso mostra badge verde "WhatsApp conectado".

**Política honesta:** se a integração não estiver ativa, o pilar 1 (confirmação WhatsApp) no dashboard/onboarding mostra badge "Conecte seu WhatsApp" com link para esta tela.

**Arquivos afetados:**
- `resources/js/Pages/Configurations/Integrations/Index.tsx` — substituir seção Evolution por stepper guiado

**Critério de aceite:** stepper tem 3 campos claros com textos explicativos; botão "Testar conexão" funciona como antes; sucesso/erro são exibidos; nenhuma funcionalidade existente é removida — apenas apresentação melhorada.

---

## 6. Arquivos afetados — mapa completo

| Arquivo | Operação | Tarefa |
|---------|----------|--------|
| `resources/js/Layouts/AppLayout.tsx` | Modificar | T1 |
| `resources/views/app.blade.php` | Modificar | T1 |
| `resources/views/welcome.blade.php` | Verificar/Modificar | T1 |
| `resources/js/Pages/Dashboard/Components/BookingLinkBanner.tsx` | Criar | T2 |
| `resources/js/Pages/Dashboard/index.tsx` | Modificar | T2, T4 |
| `app/Http/Controllers/DashboardController.php` | Modificar | T2, T4 |
| `resources/js/Pages/Dashboard/Components/AtRiskBanner.tsx` | Criar | T4 |
| `resources/js/Pages/Agenda/components/AppointmentModal.tsx` | Modificar | T3, T5 |
| `resources/js/Pages/Configurations/Integrations/Index.tsx` | Modificar | T6 |

---

## 7. O que esta sprint NÃO faz

- Não altera lógica de negócio (nenhum Service, nenhum Model, nenhuma migration)
- Não muda URLs, rotas ou endpoints
- Não altera portal do cliente (`/p/{slug}`)
- Não altera emails transacionais
- Não adiciona novas integrações
- Não mexe em billing/planos

---

## 8. Métricas de sucesso (enxutas)

**Ativação**
- Tempo até primeiro agendamento criado após cadastro: < 10 min
- % de workspaces que copiaram o link de agendamento nos primeiros 7 dias: > 60%
- % de workspaces que ativaram WhatsApp nos primeiros 30 dias: > 40%

**Operação**
- % de appointments `completed` com `Charge` associada: > 80%
- Taxa de no-show < 15% (alerta se > 25%)

**Retenção**
- Churn mensal < 3%
- Conversão trial → paid em 14 dias: > 30%

---

## 9. Riscos

| Risco | Mitigação |
|-------|-----------|
| Evolution API tem setup técnico alto mesmo com stepper | O stepper não resolve a necessidade de ter a Evolution API rodando. Comunicar claramente que é necessário um servidor Evolution separado. |
| "AgendaNexo" ainda não testado com usuário real | Rename controlado na UI (não em domínio) permite reversão simples se houver feedback negativo |
| DashboardController não tem `publicBookingUrl` hoje | Padrão já está no `OnboardingController` — copiar a lógica de geração de URL |
| CRMService pode ser lento para calcular `at_risk_count` | Usar `getSegmentCounts()` que já existe; se lento, envolver em cache com TTL de 1h |
