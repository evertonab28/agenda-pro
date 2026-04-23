# Sprint 6 — Posicionamento, Clareza de Produto e UX de Ativação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o produto mais claro e vendável para negócios de serviço com atendimento agendado (barbearias, lava rápidos, estética, clínicas, oficinas leves) — sem alterar lógica de negócio, sem novas rotas, sem migrations.

**Architecture:** Mudanças puramente de UI/UX e apresentação. Seis tarefas independentes, do menor para o maior risco: rename de strings → banner de link → CTA de checkout → card de risco → tooltip de no-show → stepper de WhatsApp. Cada tarefa é reversível individualmente.

**Tech Stack:** React/TypeScript (Inertia.js), Tailwind CSS, componentes UI existentes (`card`, `button`, `badge`, `dialog`), PHP/Laravel (`DashboardPageController`, `CRMService`).

---

## Mapa de arquivos

| Arquivo | Operação | Tarefa |
|---------|----------|--------|
| `resources/js/Layouts/AppLayout.tsx` | Modificar linha 61 | T1 |
| `resources/views/app.blade.php` | Modificar — adicionar `<title>` | T1 |
| `resources/views/welcome.blade.php` | Verificar/Modificar | T1 |
| `resources/js/Pages/Dashboard/Components/BookingLinkBanner.tsx` | Criar | T2 |
| `resources/js/Pages/Dashboard/index.tsx` | Modificar — adicionar props e componentes | T2, T4 |
| `app/Http/Controllers/DashboardPageController.php` | Modificar — adicionar props `publicBookingUrl` e `at_risk_count` | T2, T4 |
| `resources/js/Pages/Dashboard/Components/AtRiskBanner.tsx` | Criar | T4 |
| `resources/js/Pages/Agenda/components/AppointmentModal.tsx` | Modificar — adicionar botão e tooltip | T3, T5 |
| `resources/js/Pages/Configurations/Integrations/Index.tsx` | Modificar — stepper Evolution | T6 |

---

## Task 1: Rename controlado — "Agenda Pro" → "AgendaNexo" nas áreas operacionais

**Escopo:** só strings visíveis para o usuário autenticado nas áreas operacionais. Sem tocar em URLs, rotas, emails, portal do cliente.

**Files:**
- Modify: `resources/js/Layouts/AppLayout.tsx:61`
- Modify: `resources/views/app.blade.php`
- Verify/Modify: `resources/views/welcome.blade.php`

- [ ] **Step 1: Substituir o logo na sidebar do AppLayout**

Em `resources/js/Layouts/AppLayout.tsx`, linha 61, trocar:
```tsx
// ANTES
Agenda Pro
// DEPOIS
AgendaNexo
```

O trecho completo fica assim:
```tsx
<div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-zinc-800 font-bold text-xl text-primary">
  AgendaNexo
</div>
```

- [ ] **Step 2: Adicionar `<title>` padrão em `app.blade.php`**

Em `resources/views/app.blade.php`, adicionar `<title>` antes de `@inertiaHead` — o Inertia sobrescreve com o título da página individual quando `<Head title="...">` é usado, então isso é apenas o fallback:

```html
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AgendaNexo</title>
@routes
@viteReactRefresh
@vite(['resources/css/app.css', 'resources/js/app.tsx'])
@inertiaHead
</head>
<body class="antialiased">
@inertia
</body>
</html>
```

- [ ] **Step 3: Verificar e corrigir `welcome.blade.php`**

Abrir `resources/views/welcome.blade.php` e verificar se contém "Agenda Pro". Se sim, substituir por "AgendaNexo". Se a view não é usada em produção ativa, a mudança é cosmética mas necessária para consistência.

- [ ] **Step 4: Verificar ocorrências residuais**

```bash
grep -rn "Agenda Pro" resources/js/ resources/views/ --include="*.tsx" --include="*.blade.php"
```

Esperado: zero ocorrências de "Agenda Pro" nas áreas operacionais. Ocorrências em comentários de código são aceitáveis.

- [ ] **Step 5: Commit**

```bash
git add resources/js/Layouts/AppLayout.tsx resources/views/app.blade.php resources/views/welcome.blade.php
git commit -m "feat(brand): rename Agenda Pro → AgendaNexo nas áreas operacionais da UI"
```

**Critério de aceite:** sidebar mostra "AgendaNexo"; `<title>` do browser fallback é "AgendaNexo"; nenhuma ocorrência de "Agenda Pro" visível para usuário autenticado.

---

## Task 2: Banner de link de agendamento no dashboard

**Contexto:** o portal `/p/{workspace:slug}/agendar` existe e funciona, mas o profissional não sabe que ele existe. Este banner exibe o link no topo do dashboard com botão de cópia.

**Files:**
- Create: `resources/js/Pages/Dashboard/Components/BookingLinkBanner.tsx`
- Modify: `resources/js/Pages/Dashboard/index.tsx`
- Modify: `app/Http/Controllers/DashboardPageController.php`

- [ ] **Step 1: Criar o componente `BookingLinkBanner`**

Criar `resources/js/Pages/Dashboard/Components/BookingLinkBanner.tsx`:

```tsx
import { useState } from 'react';
import { Link2, Copy, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BookingLinkBannerProps {
  publicBookingUrl: string;
}

export function BookingLinkBanner({ publicBookingUrl }: BookingLinkBannerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(publicBookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10">
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Link2 className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Seu link de agendamento
          </p>
          <p className="text-sm text-muted-foreground truncate max-w-xs sm:max-w-sm md:max-w-md">
            {publicBookingUrl}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
          {copied ? (
            <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Copiado</>
          ) : (
            <><Copy className="w-3.5 h-3.5" /> Copiar link</>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(publicBookingUrl, '_blank')}
          className="gap-1.5"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Abrir
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Adicionar `publicBookingUrl` como prop no `DashboardPageController`**

Em `app/Http/Controllers/DashboardPageController.php`, adicionar a geração do URL público no método `index()`:

```php
public function index(DashboardFilterRequest $request)
{
    $filters = $request->validated();

    if (!isset($filters['status'])) {
        $filters['status'] = [];
    }

    $dashboardData = $this->dashboardService->getDashboardData($filters);
    $dashboardData['daily_actions'] = $this->dashboardService->getDailyActions();

    $workspace = auth()->user()->workspace;
    $publicBookingUrl = 'https://app.agendanexo.com.br/p/' . $workspace->slug;

    return Inertia::render('Dashboard/index', array_merge([
        'filters' => $filters,
        'can_export' => $request->user() ? $request->user()->can('export-dashboard') : true,
        'publicBookingUrl' => $publicBookingUrl,
    ], $dashboardData));
}
```

- [ ] **Step 3: Adicionar `BookingLinkBanner` no `Dashboard/index.tsx`**

Em `resources/js/Pages/Dashboard/index.tsx`, importar e renderizar o banner:

```tsx
import { BookingLinkBanner } from './Components/BookingLinkBanner';

// Adicionar publicBookingUrl nos parâmetros do componente:
export default function DashboardIndex({ 
  filters, range, current, deltas, timeseries, 
  ranking_services, ranking_customers, pending_charges, daily_actions, can_export, errors,
  publicBookingUrl,
}: DashboardProps & { daily_actions: any[]; publicBookingUrl: string }) {

  // ... estado existente inalterado ...

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        {/* Banner de link de agendamento — sempre visível */}
        <BookingLinkBanner publicBookingUrl={publicBookingUrl} />

        {errors && Object.keys(errors).length > 0 && (
           <div className="p-4 bg-red-50 ...">
             ...
           </div>
        )}

        <DashboardFilters ... />
        <DailyActions actions={daily_actions} />
        <KpiCards ... />
        ...
      </div>
    </AppLayout>
  );
}
```

- [ ] **Step 4: Verificar manualmente no browser**

Abrir `/dashboard`. Confirmar:
- Banner aparece no topo com URL no formato `https://app.agendanexo.com.br/p/{slug}`
- Botão "Copiar link" copia para clipboard (testar colando em campo de texto)
- Botão "Abrir" abre o portal em nova aba
- Layout não quebra em mobile (< 768px)

- [ ] **Step 5: Commit**

```bash
git add resources/js/Pages/Dashboard/Components/BookingLinkBanner.tsx \
        resources/js/Pages/Dashboard/index.tsx \
        app/Http/Controllers/DashboardPageController.php
git commit -m "feat(dashboard): exibir link de agendamento público no topo do dashboard"
```

**Critério de aceite:** banner aparece com URL correta; copiar e abrir funcionam; não quebra layout existente.

---

## Task 3: CTA "Finalizar e Cobrar" destacado no modal de agendamento

**Contexto:** o botão de finalizar e cobrar existe como status "Concluído" enterrado na seção "Ações críticas". Para o ICP, encerrar o atendimento e cobrar é a ação principal — precisa de destaque visual próprio, acima dos status.

**Files:**
- Modify: `resources/js/Pages/Agenda/components/AppointmentModal.tsx`

- [ ] **Step 1: Adicionar importação de `CreditCard` no modal**

Em `resources/js/Pages/Agenda/components/AppointmentModal.tsx`, adicionar `CreditCard` aos imports de `lucide-react`:

```tsx
import { CreditCard } from 'lucide-react';
```

O arquivo não tem imports de lucide-react atualmente — adicionar no topo após os outros imports:

```tsx
import { CreditCard } from 'lucide-react';
```

- [ ] **Step 2: Adicionar o botão "Finalizar e Cobrar" no DialogFooter**

Localizar o `DialogFooter` no final do componente (linha ~295). O bloco atual é:

```tsx
<DialogFooter className="gap-2">
  {mode === 'edit' && (
    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
      Excluir
    </Button>
  )}
  <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
  {(mode === 'create' || isEditable) && (
    <Button onClick={handleSave} disabled={loading}>
      {loading ? 'Salvando...' : 'Salvar'}
    </Button>
  )}
</DialogFooter>
```

Substituir por:

```tsx
<DialogFooter className="gap-2">
  {mode === 'edit' && (
    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
      Excluir
    </Button>
  )}
  <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
  {(mode === 'create' || isEditable) && (
    <Button onClick={handleSave} disabled={loading}>
      {loading ? 'Salvando...' : 'Salvar'}
    </Button>
  )}
  {mode === 'edit' && isEditable && event && (
    <Button
      variant="default"
      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
      onClick={() => {
        window.location.href = `/agenda/${event.id}/finalizar`;
      }}
      disabled={loading}
    >
      <CreditCard className="w-4 h-4" />
      Finalizar e Cobrar
    </Button>
  )}
</DialogFooter>
```

- [ ] **Step 3: Verificar no browser**

Abrir a agenda, clicar em um agendamento com status `scheduled` ou `confirmed`. Confirmar:
- Botão "Finalizar e Cobrar" aparece em verde no rodapé do modal
- Clicar no botão redireciona para `/agenda/{id}/finalizar`
- Botão NÃO aparece para appointments com status `completed`, `canceled`, ou `no_show`
- Botão NÃO aparece no modo `create`

- [ ] **Step 4: Commit**

```bash
git add resources/js/Pages/Agenda/components/AppointmentModal.tsx
git commit -m "feat(agenda): destacar CTA 'Finalizar e Cobrar' no modal de agendamento"
```

**Critério de aceite:** botão verde "Finalizar e Cobrar" aparece somente para status `scheduled`/`confirmed` no modo `edit`; redireciona para o fluxo de checkout existente.

---

## Task 4: Card de clientes em risco no dashboard

**Contexto:** o CRM calcula segmentação em background, mas o resultado não aparece de forma acionável no dashboard. Este card mostra a contagem de clientes em risco com CTA direto.

**Files:**
- Create: `resources/js/Pages/Dashboard/Components/AtRiskBanner.tsx`
- Modify: `resources/js/Pages/Dashboard/index.tsx`
- Modify: `app/Http/Controllers/DashboardPageController.php`

- [ ] **Step 1: Criar o componente `AtRiskBanner`**

Criar `resources/js/Pages/Dashboard/Components/AtRiskBanner.tsx`:

```tsx
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { route } from '@/utils/route';

interface AtRiskBannerProps {
  atRiskCount: number;
}

export function AtRiskBanner({ atRiskCount }: AtRiskBannerProps) {
  if (atRiskCount === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900/40">
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-orange-900 dark:text-orange-200">
            {atRiskCount} {atRiskCount === 1 ? 'cliente está sumindo' : 'clientes estão sumindo'}
          </p>
          <p className="text-sm text-orange-700 dark:text-orange-400">
            Clientes em risco ou inativos que podem não voltar.
          </p>
        </div>
      </div>
      <Link href={route('crm.segment', 'Em Risco')} className="shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300"
        >
          Ver clientes <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Adicionar `at_risk_count` no `DashboardPageController`**

Em `app/Http/Controllers/DashboardPageController.php`, injetar `CRMService` e calcular `atRiskCount`:

```php
use App\Services\CRMService;

class DashboardPageController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService,
        protected CRMService $crmService,
    ) {}

    public function index(DashboardFilterRequest $request)
    {
        $filters = $request->validated();

        if (!isset($filters['status'])) {
            $filters['status'] = [];
        }

        $dashboardData = $this->dashboardService->getDashboardData($filters);
        $dashboardData['daily_actions'] = $this->dashboardService->getDailyActions();

        $workspace = auth()->user()->workspace;
        $publicBookingUrl = 'https://app.agendanexo.com.br/p/' . $workspace->slug;

        $segmentCounts = $this->crmService->getSegmentCounts();
        $atRiskCount = ($segmentCounts['Em Risco'] ?? 0) + ($segmentCounts['Inativo'] ?? 0);

        return Inertia::render('Dashboard/index', array_merge([
            'filters' => $filters,
            'can_export' => $request->user() ? $request->user()->can('export-dashboard') : true,
            'publicBookingUrl' => $publicBookingUrl,
            'atRiskCount' => $atRiskCount,
        ], $dashboardData));
    }
    // ... demais métodos inalterados
}
```

- [ ] **Step 3: Adicionar `AtRiskBanner` no `Dashboard/index.tsx`**

Em `resources/js/Pages/Dashboard/index.tsx`, importar e renderizar o banner após `BookingLinkBanner`:

```tsx
import { AtRiskBanner } from './Components/AtRiskBanner';

// Adicionar atRiskCount nos parâmetros:
export default function DashboardIndex({ 
  filters, range, current, deltas, timeseries, 
  ranking_services, ranking_customers, pending_charges, daily_actions, can_export, errors,
  publicBookingUrl,
  atRiskCount,
}: DashboardProps & { daily_actions: any[]; publicBookingUrl: string; atRiskCount: number }) {

  // ...

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        <BookingLinkBanner publicBookingUrl={publicBookingUrl} />
        <AtRiskBanner atRiskCount={atRiskCount} />

        {/* restante inalterado */}
      </div>
    </AppLayout>
  );
}
```

- [ ] **Step 4: Verificar no browser**

Abrir `/dashboard`. Confirmar:
- Se existem clientes "Em Risco" ou "Inativo" no workspace: banner laranja aparece com contagem correta
- Link "Ver clientes" leva para `/crm/segmento/Em+Risco` (ou equivalente da rota `crm.segment`)
- Se não existem clientes em risco/inativo: banner não aparece (componente retorna `null`)

- [ ] **Step 5: Commit**

```bash
git add resources/js/Pages/Dashboard/Components/AtRiskBanner.tsx \
        resources/js/Pages/Dashboard/index.tsx \
        app/Http/Controllers/DashboardPageController.php
git commit -m "feat(dashboard): card de clientes em risco com CTA direto para CRM"
```

**Critério de aceite:** banner aparece com contagem correta quando `atRiskCount > 0`; não aparece quando `0`; link navega para CRM.

---

## Task 5: Texto informativo de no-show fee no modal

**Contexto:** ao marcar "Não Compareceu", o sistema gera uma cobrança de taxa automaticamente (`AppointmentLifecycleService::markNoShow()` → `ensureNoShowFeeForAppointment()`). O operador não tem feedback sobre isso — pode surpreender.

**Files:**
- Modify: `resources/js/Pages/Agenda/components/AppointmentModal.tsx`

- [ ] **Step 1: Adicionar texto explicativo na confirmação de no_show**

No `AppointmentModal.tsx`, localizar o bloco de confirmação de status crítico (linha ~278):

```tsx
{(pendingCriticalStatus === 'canceled' || pendingCriticalStatus === 'no_show') && (
  <div className="space-y-2 rounded-md border bg-amber-50 p-3">
    <Label>Motivo para {STATUS_LABELS[pendingCriticalStatus].toLowerCase()} (opcional)</Label>
    <Input
      placeholder="Ex: cliente solicitou cancelamento"
      value={cancelReason}
      onChange={(e) => setCancelReason(e.target.value)}
    />
    <Button size="sm" onClick={() => handleStatusChange(pendingCriticalStatus)} disabled={loading}>
      Confirmar {STATUS_LABELS[pendingCriticalStatus]}
    </Button>
  </div>
)}
```

Substituir por:

```tsx
{(pendingCriticalStatus === 'canceled' || pendingCriticalStatus === 'no_show') && (
  <div className="space-y-2 rounded-md border bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/40 p-3">
    <Label>Motivo para {STATUS_LABELS[pendingCriticalStatus].toLowerCase()} (opcional)</Label>
    {pendingCriticalStatus === 'no_show' && (
      <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 rounded px-2 py-1">
        Uma cobrança de taxa de no-show será gerada automaticamente.
      </p>
    )}
    <Input
      placeholder="Ex: cliente não avisou a ausência"
      value={cancelReason}
      onChange={(e) => setCancelReason(e.target.value)}
    />
    <Button size="sm" onClick={() => handleStatusChange(pendingCriticalStatus)} disabled={loading}>
      Confirmar {STATUS_LABELS[pendingCriticalStatus]}
    </Button>
  </div>
)}
```

- [ ] **Step 2: Verificar no browser**

Abrir um agendamento com status `scheduled` ou `confirmed`. Clicar em "Não Compareceu" na seção "Ações críticas". Confirmar:
- Aparece a caixa de confirmação com o texto em amarelo: _"Uma cobrança de taxa de no-show será gerada automaticamente."_
- Texto NÃO aparece quando o status pendente é `canceled`
- Texto NÃO aparece para outros status
- O fluxo de confirmação (botão "Confirmar...") funciona normalmente

- [ ] **Step 3: Commit**

```bash
git add resources/js/Pages/Agenda/components/AppointmentModal.tsx
git commit -m "feat(agenda): informar geração de taxa de no-show ao confirmar ausência"
```

**Critério de aceite:** texto informativo aparece somente no pendente `no_show`; não interfere com fluxo de confirmação; texto correto e não alarmista.

---

## Task 6: Stepper guiado para ativação do WhatsApp

**Contexto:** a integração com Evolution API exige URL, nome de instância e API key. Os campos estão dispostos como inputs soltos sem contexto. Para o ICP (barbeeiro, dono de lava rápido), essa tela é uma barreira. Esta task adiciona textos explicativos e estrutura guiada sem alterar a lógica de salvamento.

**Files:**
- Modify: `resources/js/Pages/Configurations/Integrations/Index.tsx`

- [ ] **Step 1: Ler o estado atual da seção Evolution no componente**

Abrir `resources/js/Pages/Configurations/Integrations/Index.tsx` e localizar a seção que renderiza os campos `evoUrl`, `evoInstance`, `evoKey` (aproximadamente linhas 80-200 que não foram lidas). Identificar o bloco JSX que renderiza a seção "Evolution/WhatsApp".

- [ ] **Step 2: Substituir a seção Evolution por stepper guiado**

Localizar a seção que renderiza a integração Evolution (buscar pelo texto "Evolution" ou pelo JSX com `evoUrl`). Substituir o bloco de campos soltos pelo seguinte stepper:

```tsx
{/* Seção WhatsApp / Evolution API */}
<div className="space-y-4 border rounded-xl p-5">
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
      <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    </div>
    <div>
      <h3 className="font-semibold text-gray-900 dark:text-white">WhatsApp (Evolution API)</h3>
      <p className="text-sm text-muted-foreground">
        Envie lembretes e receba confirmações diretamente pelo WhatsApp.
      </p>
    </div>
    {evolution && evolution.status === 'active' && (
      <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full">
        <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
      </span>
    )}
  </div>

  <div className="space-y-4">
    {/* Passo 1 */}
    <div className="space-y-1.5">
      <Label htmlFor="evo-url" className="flex items-center gap-1.5">
        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">1</span>
        URL da sua Evolution API
      </Label>
      <input
        id="evo-url"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder="https://api.seudominio.com"
        value={evoUrl}
        onChange={(e) => setEvoUrl(e.target.value)}
      />
      <p className="text-xs text-muted-foreground">
        É o endereço do servidor Evolution API que você configurou.{' '}
        <a
          href="https://doc.evolution-api.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:no-underline"
        >
          O que é isso?
        </a>
      </p>
    </div>

    {/* Passo 2 */}
    <div className="space-y-1.5">
      <Label htmlFor="evo-instance" className="flex items-center gap-1.5">
        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">2</span>
        Nome da instância
      </Label>
      <input
        id="evo-instance"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder="minha-barbearia"
        value={evoInstance}
        onChange={(e) => setEvoInstance(e.target.value)}
      />
      <p className="text-xs text-muted-foreground">
        Você vê o nome da instância no painel da sua Evolution API, em "Instâncias".
      </p>
    </div>

    {/* Passo 3 */}
    <div className="space-y-1.5">
      <Label htmlFor="evo-key" className="flex items-center gap-1.5">
        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">3</span>
        Chave de API
      </Label>
      <input
        id="evo-key"
        type="password"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder="Sua API Key da Evolution"
        value={evoKey}
        onChange={(e) => setEvoKey(e.target.value)}
      />
      <p className="text-xs text-muted-foreground">
        Encontrada em Configurações &gt; API Keys no painel da Evolution API.
      </p>
    </div>
  </div>

  {/* Feedback de save */}
  {saveResults['evolution']?.ok === true && (
    <p className="text-sm text-emerald-600 font-medium">Configuração salva com sucesso.</p>
  )}
  {saveResults['evolution']?.ok === false && (
    <p className="text-sm text-red-600">{saveResults['evolution'].message || 'Erro ao salvar.'}</p>
  )}

  {/* Feedback de test */}
  {evolution && testResults[evolution.id]?.ok === true && (
    <p className="text-sm text-emerald-600 font-medium">Conexão testada com sucesso.</p>
  )}
  {evolution && testResults[evolution.id]?.ok === false && (
    <p className="text-sm text-red-600">{testResults[evolution.id].message || 'Falha na conexão.'}</p>
  )}

  <div className="flex gap-2 pt-2">
    <Button
      variant="default"
      disabled={!evoUrl || !evoInstance || !evoKey || savingProvider === 'evolution'}
      onClick={() =>
        handleSave(
          { type: 'messaging', provider: 'evolution', url: evoUrl, instance: evoInstance, api_key: evoKey },
          'evolution',
        )
      }
    >
      {savingProvider === 'evolution' ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Salvando...</> : 'Salvar configuração'}
    </Button>
    {evolution && (
      <Button
        variant="outline"
        disabled={testingId === evolution.id}
        onClick={() => testConnection(evolution.id)}
      >
        {testingId === evolution.id ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Testando...</> : 'Testar conexão'}
      </Button>
    )}
  </div>
</div>
```

- [ ] **Step 3: Verificar que as importações necessárias existem**

Confirmar que `CheckCircle2` e `Loader2` já estão importados no arquivo (estavam na leitura inicial da linha 1-13). Se não estiverem, adicionar ao bloco de imports de `lucide-react`.

- [ ] **Step 4: Verificar no browser**

Abrir `/configuracoes/integracoes`. Confirmar:
- Seção WhatsApp tem header descritivo com ícone verde
- Três campos numerados com labels e textos explicativos visíveis
- Placeholder `minha-barbearia` aparece no campo de instância
- Botão "Salvar configuração" fica desabilitado até os 3 campos serem preenchidos
- Botão "Testar conexão" aparece apenas quando a integração já existe
- Badge "Conectado" aparece quando `evolution.status === 'active'`
- Funcionalidade de save e test funciona identicamente ao comportamento anterior

- [ ] **Step 5: Commit**

```bash
git add resources/js/Pages/Configurations/Integrations/Index.tsx
git commit -m "feat(integrations): stepper guiado para ativação do WhatsApp (Evolution API)"
```

**Critério de aceite:** três passos numerados com textos explicativos; botão desabilitado até preenchimento completo; save e test funcionam como antes; badge "Conectado" aparece quando ativo.

---

## Self-review

### Cobertura do spec

| Requisito do spec | Tarefa |
|---|---|
| Rename "Agenda Pro" → "AgendaNexo" nas áreas operacionais (rollout controlado) | T1 |
| Link de agendamento visível no dashboard | T2 |
| CTA "Finalizar e Cobrar" destacado no modal | T3 |
| Card de clientes em risco com CTA direto | T4 |
| Texto informativo de no-show fee | T5 |
| Passo-a-passo de ativação de WhatsApp | T6 |
| Política de comunicação honesta (WhatsApp como "Conecte seu WhatsApp") | T6 — badge de status na tela de integrações; a prop `at_risk_count` e `publicBookingUrl` no dashboard cumprem a presença de dados reais |
| Textos aprovados de headline/subheadline/pilares | Documentados no spec — não há tela "de marketing" na UI atual para exibição; os pilares entram como textos de apoio no onboarding existente (fora do escopo desta sprint de produto) |
| Nenhuma alteração em lógica de negócio, rotas, migrations | Confirmado — todas as tasks são puramente de UI/UX |

### Verificação de placeholders

Todos os steps têm código completo. Nenhum "TBD" ou "similar à tarefa anterior".

### Consistência de tipos

- `BookingLinkBanner` recebe `publicBookingUrl: string` — fornecido pelo controller como string
- `AtRiskBanner` recebe `atRiskCount: number` — calculado no controller como `int`
- O modal usa `event.id` como `string` (FullCalendar) e faz cast implícito na URL — consistente com o padrão existente

### Risco residual documentado

A Task 6 (stepper WhatsApp) melhora a apresentação mas não resolve a necessidade de ter a Evolution API rodando em servidor separado. Isso está documentado no spec (seção 9, riscos) e não é responsabilidade desta sprint resolver.
