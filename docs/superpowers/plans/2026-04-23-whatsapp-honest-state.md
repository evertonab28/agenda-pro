# WhatsApp Honest State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar a política de comunicação honesta do Sprint 6 adicionando estado explícito "Disponível após conectar" na tela de Integrações e banner condicional no Dashboard quando o WhatsApp não está conectado.

**Architecture:** Três mudanças independentes e minimais: (1) badge condicional na tela de Integrações usando dados já presentes na prop `integrations`; (2) prop `whatsAppConnected` injetada pelo `DashboardPageController`; (3) novo componente `WhatsAppBanner` renderizado condicionalmente no Dashboard. Sem nova rota, sem nova lógica de negócio.

**Tech Stack:** React + TypeScript (Inertia/Vite), Laravel PHP, Lucide icons, Tailwind CSS, shadcn/ui Button

---

## File Map

| Operação | Arquivo | Responsabilidade |
|----------|---------|-----------------|
| Modify | `resources/js/Pages/Configurations/Integrations/Index.tsx` | Adicionar badge âmbar quando evolution não está ativa |
| Modify | `app/Http/Controllers/DashboardPageController.php` | Injetar prop `whatsAppConnected` |
| Create | `resources/js/Pages/Dashboard/Components/WhatsAppBanner.tsx` | Banner condicional de WhatsApp |
| Modify | `resources/js/Pages/Dashboard/index.tsx` | Importar e renderizar `WhatsAppBanner` |

---

## Task 1: Badge âmbar na tela de Integrações

**Files:**
- Modify: `resources/js/Pages/Configurations/Integrations/Index.tsx:200-204`

O bloco atual (linhas 200–204) renderiza o badge "Conectado" apenas quando `evolution && evolution.status === 'active'`. Precisa de um `else` com o badge âmbar.

- [ ] **Step 1: Editar o bloco de badge no card Evolution**

Localizar este bloco em `resources/js/Pages/Configurations/Integrations/Index.tsx`:

```tsx
{evolution && evolution.status === 'active' && (
    <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full">
        <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
    </span>
)}
```

Substituir por:

```tsx
{evolution && evolution.status === 'active' ? (
    <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full">
        <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
    </span>
) : (
    <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-1 rounded-full">
        <AlertCircle className="w-3.5 h-3.5" /> Disponível após conectar
    </span>
)}
```

Nota: `AlertCircle` já está importado no arquivo (linha 9). Nenhum import novo necessário.

- [ ] **Step 2: Verificar build TypeScript**

```bash
cd d:/saas/agenda-pro && npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Step 3: Commit**

```bash
git add resources/js/Pages/Configurations/Integrations/Index.tsx
git commit -m "feat(integrations): badge âmbar quando WhatsApp não está conectado"
```

---

## Task 2: Prop `whatsAppConnected` no DashboardPageController

**Files:**
- Modify: `app/Http/Controllers/DashboardPageController.php`

- [ ] **Step 1: Adicionar cálculo de `whatsAppConnected` antes do `return Inertia::render`**

Localizar este bloco em `app/Http/Controllers/DashboardPageController.php`:

```php
$segmentCounts = $this->crmService->getSegmentCounts();
$atRiskCount = ($segmentCounts['Em Risco'] ?? 0) + ($segmentCounts['Inativo'] ?? 0);

return Inertia::render('Dashboard/index', array_merge([
    'filters' => $filters,
    'can_export' => $request->user() ? $request->user()->can('export-dashboard') : true,
    'publicBookingUrl' => $publicBookingUrl,
    'atRiskCount' => $atRiskCount,
], $dashboardData));
```

Substituir por:

```php
$segmentCounts = $this->crmService->getSegmentCounts();
$atRiskCount = ($segmentCounts['Em Risco'] ?? 0) + ($segmentCounts['Inativo'] ?? 0);

$whatsAppConnected = $workspace
    ? $workspace->integrations()
        ->where('provider', 'evolution')
        ->where('status', 'active')
        ->exists()
    : false;

return Inertia::render('Dashboard/index', array_merge([
    'filters' => $filters,
    'can_export' => $request->user() ? $request->user()->can('export-dashboard') : true,
    'publicBookingUrl' => $publicBookingUrl,
    'atRiskCount' => $atRiskCount,
    'whatsAppConnected' => $whatsAppConnected,
], $dashboardData));
```

- [ ] **Step 2: Verificar que o método `integrations()` existe no modelo Workspace**

```bash
grep -n "integrations" d:/saas/agenda-pro/app/Models/Workspace.php | head -10
```

Esperado: linha com `public function integrations()` ou `hasMany`. Se não existir, verificar via:

```bash
grep -rn "WorkspaceIntegration\|workspace_integrations" d:/saas/agenda-pro/app/Models/ | head -10
```

- [ ] **Step 3: Rodar suite de testes PHP**

```bash
cd d:/saas/agenda-pro && php artisan test
```

Esperado: todos os testes passando (239+).

- [ ] **Step 4: Commit**

```bash
git add app/Http/Controllers/DashboardPageController.php
git commit -m "feat(dashboard): injetar prop whatsAppConnected no DashboardPageController"
```

---

## Task 3: Componente WhatsAppBanner

**Files:**
- Create: `resources/js/Pages/Dashboard/Components/WhatsAppBanner.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
import { MessageSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';

interface WhatsAppBannerProps {
  whatsAppConnected: boolean;
}

export function WhatsAppBanner({ whatsAppConnected }: WhatsAppBannerProps) {
  if (whatsAppConnected) return null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/40">
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
            Confirme agendamentos pelo WhatsApp
          </p>
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            Conecte sua conta para ativar confirmações e reagendamentos automáticos.
          </p>
        </div>
      </div>
      <Link href="/configurations/integrations" className="shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-300"
        >
          Configurar WhatsApp <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Verificar build TypeScript**

```bash
cd d:/saas/agenda-pro && npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Step 3: Commit**

```bash
git add resources/js/Pages/Dashboard/Components/WhatsAppBanner.tsx
git commit -m "feat(dashboard): componente WhatsAppBanner condicional"
```

---

## Task 4: Integrar WhatsAppBanner no Dashboard

**Files:**
- Modify: `resources/js/Pages/Dashboard/index.tsx`

- [ ] **Step 1: Adicionar import do WhatsAppBanner**

Localizar os imports existentes no topo de `resources/js/Pages/Dashboard/index.tsx`:

```tsx
import { BookingLinkBanner } from './Components/BookingLinkBanner';
import { AtRiskBanner } from './Components/AtRiskBanner';
```

Substituir por:

```tsx
import { BookingLinkBanner } from './Components/BookingLinkBanner';
import { AtRiskBanner } from './Components/AtRiskBanner';
import { WhatsAppBanner } from './Components/WhatsAppBanner';
```

- [ ] **Step 2: Adicionar `whatsAppConnected` na assinatura da função**

Localizar:

```tsx
export default function DashboardIndex({
  filters, range, current, deltas, timeseries,
  ranking_services, ranking_customers, pending_charges, daily_actions, can_export, errors, publicBookingUrl, atRiskCount
}: DashboardProps & { daily_actions: any[], publicBookingUrl: string, atRiskCount: number }) {
```

Substituir por:

```tsx
export default function DashboardIndex({
  filters, range, current, deltas, timeseries,
  ranking_services, ranking_customers, pending_charges, daily_actions, can_export, errors, publicBookingUrl, atRiskCount, whatsAppConnected
}: DashboardProps & { daily_actions: any[], publicBookingUrl: string, atRiskCount: number, whatsAppConnected: boolean }) {
```

- [ ] **Step 3: Renderizar WhatsAppBanner após AtRiskBanner**

Localizar:

```tsx
<BookingLinkBanner publicBookingUrl={publicBookingUrl} />
<AtRiskBanner atRiskCount={atRiskCount} />
```

Substituir por:

```tsx
<BookingLinkBanner publicBookingUrl={publicBookingUrl} />
<AtRiskBanner atRiskCount={atRiskCount} />
<WhatsAppBanner whatsAppConnected={whatsAppConnected} />
```

- [ ] **Step 4: Verificar build completo**

```bash
cd d:/saas/agenda-pro && npx tsc --noEmit && npm run build
```

Esperado: zero erros TypeScript, build bem-sucedido.

- [ ] **Step 5: Rodar suite completa de testes**

```bash
cd d:/saas/agenda-pro && php artisan test
```

Esperado: todos os testes passando.

- [ ] **Step 6: Commit final**

```bash
git add resources/js/Pages/Dashboard/index.tsx
git commit -m "feat(dashboard): exibir WhatsAppBanner quando integração não está ativa"
```

---

## Self-Review

### Spec coverage

| Requisito do spec | Task que implementa |
|-------------------|---------------------|
| Badge "Conectado" quando `evolution.status === 'active'` | Task 1 (mantido) |
| Badge âmbar "Disponível após conectar" quando não ativo | Task 1 |
| Banner no dashboard quando WhatsApp não conectado | Tasks 2, 3, 4 |
| Banner invisível quando conectado | Task 3 (`if (whatsAppConnected) return null`) |
| CTA para `/configurations/integrations` | Task 3 |
| Texto: "Confirme agendamentos pelo WhatsApp" | Task 3 |
| Texto: "Conecte sua conta para ativar confirmações e reagendamentos automáticos." | Task 3 |
| CTA: "Configurar WhatsApp" | Task 3 |
| Zero nova rota / lógica de negócio | Confirmado — sem Service, sem Model, sem migration |

### Placeholder scan
Nenhum TBD, TODO, ou "similar ao task N" encontrado. Todos os blocos de código são completos.

### Type consistency
- `whatsAppConnected: boolean` definido no controller (Task 2), prop do componente (Task 3), e assinatura do Dashboard (Task 4) — consistente.
- `WhatsAppBanner` exportado como named export em Task 3, importado como named import em Task 4 — consistente.
- `AlertCircle` já importado no arquivo de Integrações (linha 9) — Task 1 não precisa de import adicional.
