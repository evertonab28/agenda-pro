# Spec: Agenda com FullCalendar + ResourceTimeGrid

**Data:** 2026-04-21  
**Status:** Aprovado para implementação

---

## 1. Árvore final de arquivos

```
resources/js/Pages/Agenda/
├── Index.tsx                        # ~80 linhas — orquestrador, zero lógica
├── types.ts                         # Todos os tipos compartilhados
├── hooks/
│   ├── useAppointments.ts           # Eventos, CRUD, otimismo, undo
│   └── useAgendaUI.ts               # Estado de UI (modal, view, filtros)
├── components/
│   ├── AgendaCalendar.tsx           # FullCalendar configurado, só callbacks
│   ├── AgendaToolbar.tsx            # Navegação de data, view switcher
│   ├── ProfessionalFilter.tsx       # Toggles de visibilidade por profissional
│   └── AppointmentModal.tsx         # Formulário criar/editar
└── utils/
    └── calendarMappers.ts           # toEventInput(), toResourceInput()
```

**Pacotes a instalar:**
```bash
npm install @fullcalendar/react @fullcalendar/resource-timegrid @fullcalendar/timegrid \
            @fullcalendar/daygrid @fullcalendar/list @fullcalendar/interaction \
            @fullcalendar/resource-daygrid
```

---

## 2. Responsabilidade exata de cada arquivo

| Arquivo | Faz | Não faz |
|---|---|---|
| `Index.tsx` | Injeta props Laravel, instancia hooks, compõe layout | Estado, HTTP, lógica |
| `types.ts` | Define interfaces e tipos | Nada além de tipos |
| `useAppointments.ts` | Lista de eventos, create/update/delete, otimismo, undo stack | UI state |
| `useAgendaUI.ts` | Modal aberto/fechado, view, data atual, profissionais visíveis | HTTP |
| `AgendaCalendar.tsx` | Config FullCalendar, monta resources/events, dispara callbacks | HTTP, estado próprio |
| `AgendaToolbar.tsx` | Renderiza controles de nav, seletor de view, ProfessionalFilter | Lógica de negócio |
| `ProfessionalFilter.tsx` | Toggle de visibilidade por profissional com cor | Estado global |
| `AppointmentModal.tsx` | Form criar/editar com validação local, onSave/onDelete | HTTP direto |
| `calendarMappers.ts` | Funções puras de transformação de dados | Estado, side effects |

---

## 3. Tipos principais (`types.ts`)

```typescript
export interface Professional {
  id: number;
  name: string;
}

export interface Service {
  id: number;
  name: string;
  duration_minutes: number;
  buffer_minutes: number;
  price: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
}

export interface AppointmentCharge {
  id: number;
  status: string;
  amount: number;
  paid: number;
}

// Formato que chega do Laravel (AgendaService::getAgendaEvents)
export interface AppointmentEvent {
  id: number;
  title: string;
  start: string;        // ISO 8601
  end: string;          // ISO 8601
  status: AppointmentStatus;
  customer: Customer | null;
  service: Service | null;
  professional: Professional | null;
  notes: string | null;
  charge: AppointmentCharge | null;
}

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'no_show'
  | 'canceled';

// Payload para criar/atualizar (enviado ao Laravel)
export interface AppointmentPayload {
  customer_id: number | string;
  service_id: number | string;
  professional_id: number | string;
  starts_at: string;   // "YYYY-MM-DD HH:mm:ss"
  ends_at: string;
  notes?: string;
  status?: AppointmentStatus;
  cancel_reason?: string;
}

// Formato do FullCalendar (EventInput com campos extras)
export interface AgendaCalendarEvent {
  id: string;              // string por requisito do FullCalendar
  resourceId: string;      // professional.id como string
  title: string;
  start: string;
  end: string;
  extendedProps: {
    status: AppointmentStatus;
    customer: Customer | null;
    service: Service | null;
    professional: Professional | null;
    notes: string | null;
    charge: AppointmentCharge | null;
  };
}

// Entrada de recurso para resourceTimeGrid
export interface AgendaResource {
  id: string;              // professional.id como string
  title: string;
  color: string;           // cor HEX da coluna
}

// Estado de uma operação de undo
export interface UndoOperation {
  id: string;              // appointment id
  previousEvent: AppointmentCalendarEvent;
  timeoutId: ReturnType<typeof setTimeout>;
}
```

---

## 4. Assinatura dos hooks

### `useAppointments.ts`

```typescript
interface UseAppointmentsProps {
  initialEvents: AppointmentEvent[];
}

interface UseAppointmentsReturn {
  // Estado
  events: AgendaCalendarEvent[];
  pendingUndo: UndoOperation | null;

  // Ações
  createAppointment: (payload: AppointmentPayload) => Promise<void>;
  updateAppointment: (id: number, payload: AppointmentPayload) => Promise<void>;
  deleteAppointment: (id: number) => Promise<void>;

  // Drag-drop — atualiza horário e/ou profissional
  moveAppointment: (params: {
    id: number;
    newStart: string;
    newEnd: string;
    newProfessionalId: number;
    revertFn: () => void;   // função do FullCalendar para reverter visualmente
  }) => void;

  // Undo
  commitUndo: () => void;   // usuário clicou "desfazer"
  dismissUndo: () => void;  // timeout expirou ou usuário ignorou
}

export function useAppointments({ initialEvents }: UseAppointmentsProps): UseAppointmentsReturn;
```

**Notas de implementação:**
- `events` é um `useState<AgendaCalendarEvent[]>` inicializado via `calendarMappers.toEventInput(initialEvents)`
- `moveAppointment` atualiza `events` imediatamente (otimista), chama `axios.put`, e em caso de erro chama `revertFn()` + mostra toast de erro
- Undo funciona via `pendingUndo`: guarda o estado anterior por 4 segundos com `setTimeout`; `commitUndo` restaura o estado e cancela o PUT; `dismissUndo` limpa sem reverter
- Todos os métodos usam `axios` diretamente (não Inertia) para evitar reload de página

### `useAgendaUI.ts`

```typescript
interface UseAgendaUIProps {
  professionals: Professional[];
  defaultView?: 'resourceTimeGridDay' | 'resourceTimeGridWeek' | 'dayGridMonth' | 'listWeek';
}

interface UseAgendaUIReturn {
  // View e navegação
  currentView: string;
  setCurrentView: (view: string) => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;

  // Profissionais visíveis
  visibleProfessionalIds: number[];
  toggleProfessional: (id: number) => void;
  visibleProfessionals: Professional[];   // derivado — só os visíveis

  // Modal
  modalOpen: boolean;
  modalMode: 'create' | 'edit';
  selectedEvent: AgendaCalendarEvent | null;
  selectedSlot: { start: string; end: string; professionalId: number } | null;
  openCreateModal: (slot: { start: string; end: string; professionalId: number }) => void;
  openEditModal: (event: AgendaCalendarEvent) => void;
  closeModal: () => void;
}

export function useAgendaUI({ professionals, defaultView }: UseAgendaUIProps): UseAgendaUIReturn;
```

**Notas de implementação:**
- `defaultView` detecta mobile: `window.innerWidth < 768 ? 'listWeek' : 'resourceTimeGridWeek'`
- `visibleProfessionalIds` inicia com todos os IDs; máximo visual de 5 lado a lado (acima disso o scroll horizontal do FullCalendar entra)
- `visibleProfessionals` é `useMemo` para evitar re-render desnecessário

---

## 5. Props de cada componente

### `AgendaCalendar.tsx`

```typescript
interface AgendaCalendarProps {
  events: AgendaCalendarEvent[];
  resources: AgendaResource[];          // toResourceInput(visibleProfessionals)
  currentView: string;
  currentDate: Date;
  onEventDrop: (params: {
    id: number;
    newStart: string;
    newEnd: string;
    newProfessionalId: number;
    revertFn: () => void;
  }) => void;
  onEventResize: (params: {
    id: number;
    newStart: string;
    newEnd: string;
    revertFn: () => void;
  }) => void;
  onDateClick: (slot: { start: string; end: string; professionalId: number }) => void;
  onEventClick: (event: AgendaCalendarEvent) => void;
  onViewChange: (view: string) => void;
  onDateChange: (date: Date) => void;
}
```

**Notas:**
- Usa `useRef` para a instância do FullCalendar (`calendarRef`)
- Sincroniza `currentDate` e `currentView` via `useEffect` chamando `calendarRef.current.getApi().changeView()` e `.gotoDate()`
- `headerToolbar: false` — a toolbar nativa é desativada; `AgendaToolbar` cuida disso

### `AgendaToolbar.tsx`

```typescript
interface AgendaToolbarProps {
  currentView: string;
  currentDate: Date;
  professionals: Professional[];
  visibleProfessionalIds: number[];
  onViewChange: (view: string) => void;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
  onToggleProfessional: (id: number) => void;
  onCreateClick: () => void;
}
```

### `ProfessionalFilter.tsx`

```typescript
interface ProfessionalFilterProps {
  professionals: Professional[];
  visibleIds: number[];
  onToggle: (id: number) => void;
}
```

**Notas:**
- Cada profissional tem um botão/pill com a cor do resource
- `opacity-40` quando oculto, cor sólida quando visível
- Cores são as mesmas de `PROFESSIONAL_COLORS` em `calendarMappers.ts`

### `AppointmentModal.tsx`

```typescript
interface AppointmentModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  event: AgendaCalendarEvent | null;           // null no modo create
  initialSlot: { start: string; end: string; professionalId: number } | null;
  professionals: Professional[];
  services: Service[];
  customers: Customer[];
  onSave: (payload: AppointmentPayload) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onStatusChange: (id: number, status: AppointmentStatus, cancelReason?: string) => Promise<void>;
  onClose: () => void;
}
```

**Notas:**
- No modo `create`, preenche `professional_id` e `starts_at`/`ends_at` a partir de `initialSlot`
- `ends_at` é calculado automaticamente com base na duração do serviço selecionado
- Botão "Finalizar e Cobrar" aparece apenas no modo `edit` com status `scheduled` ou `confirmed`

---

## 6. Fluxo completo de drag-and-drop com update otimista e undo

```
Usuário arrasta evento
        │
        ▼
FullCalendar dispara eventDrop(info)
        │
        ▼
AgendaCalendar.onEventDrop → extrai id, newStart, newEnd, newResourceId, info.revert
        │
        ▼
useAppointments.moveAppointment(params)
        │
        ├─► Atualiza events[] imediatamente (otimista)
        │
        ├─► Guarda UndoOperation { previousEvent, timeoutId: setTimeout(dismissUndo, 4000) }
        │
        ├─► Mostra toast "Agendamento movido  [Desfazer]"
        │
        ├─► axios.put('/api/agenda/{id}', payload)
        │       │
        │       ├─ SUCESSO: nada, o estado otimista já é correto
        │       │
        │       └─ ERRO: revertFn() + restaura events[] + toast de erro
        │
        └─► Se usuário clicar "Desfazer" (dentro de 4s):
                ├─► clearTimeout(undoOperation.timeoutId)
                ├─► restaura events[] para previousEvent
                └─► NÃO envia PUT (o primeiro PUT ainda não foi confirmado)
                    └─► axios.put com os valores originais para sincronizar backend
```

**Detalhe importante:** se o undo acontece antes do PUT original retornar, cancela o PUT com `AbortController` e envia um novo PUT com os valores originais.

---

## 7. Fluxo de criação/edição de agendamento

**Criação (clique em slot vazio):**
```
Usuário clica em slot vazio na coluna de um profissional
        │
        ▼
FullCalendar dispara select(info) ou dateClick(info)
        │
        ▼
AgendaCalendar.onDateClick → extrai start, end, resourceId
        │
        ▼
useAgendaUI.openCreateModal({ start, end, professionalId })
        │
        ▼
AppointmentModal abre no modo 'create'
  - professional_id pré-preenchido
  - starts_at pré-preenchido
  - ends_at calculado ao selecionar serviço
        │
        ▼
Usuário preenche e confirma → onSave(payload)
        │
        ▼
useAppointments.createAppointment(payload)
  → axios.post('/agenda') — Inertia route retorna redirect
  → Em vez de redirect, usar axios + router.reload({ only: ['events'] })
```

**Edição (clique em evento):**
```
Usuário clica em evento existente
        │
        ▼
AgendaCalendar.onEventClick → extrai AgendaCalendarEvent da extendedProps
        │
        ▼
useAgendaUI.openEditModal(event)
        │
        ▼
AppointmentModal abre no modo 'edit' com dados preenchidos
  - Mostra botões: Salvar, Excluir, Mudar Status, Finalizar e Cobrar
        │
        ▼
onSave → useAppointments.updateAppointment
onDelete → useAppointments.deleteAppointment
onStatusChange → axios.put('/agenda/{id}/status')
```

**Nota sobre rotas:** o controller atual retorna `redirect()` (Inertia). Para o modal funcionar sem reload completo, adicionar rotas API puras em `routes/api.php` que retornam JSON, ou usar `router.reload({ only: ['events'] })` após a operação.

---

## 8. Mapeamento Laravel props → FullCalendar events/resources

```typescript
// utils/calendarMappers.ts

// Paleta de cores — um por profissional, ciclica
export const PROFESSIONAL_COLORS = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
];

export function toResourceInput(professionals: Professional[]): AgendaResource[] {
  return professionals.map((p, index) => ({
    id: String(p.id),
    title: p.name,
    color: PROFESSIONAL_COLORS[index % PROFESSIONAL_COLORS.length],
  }));
}

export function toEventInput(events: AppointmentEvent[]): AgendaCalendarEvent[] {
  return events.map(event => ({
    id: String(event.id),
    resourceId: String(event.professional?.id ?? ''),
    title: event.title,
    start: event.start,
    end: event.end,
    // Cor por status (sobrepõe a cor do resource)
    backgroundColor: STATUS_COLORS[event.status]?.bg ?? '#6366f1',
    borderColor: STATUS_COLORS[event.status]?.border ?? '#4f46e5',
    textColor: STATUS_COLORS[event.status]?.text ?? '#ffffff',
    extendedProps: {
      status: event.status,
      customer: event.customer,
      service: event.service,
      professional: event.professional,
      notes: event.notes,
      charge: event.charge,
    },
  }));
}

export const STATUS_COLORS: Record<AppointmentStatus, { bg: string; border: string; text: string }> = {
  scheduled: { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af' },
  confirmed:  { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46' },
  completed:  { bg: '#f3f4f6', border: '#d1d5db', text: '#374151' },
  no_show:    { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
  canceled:   { bg: '#ffedd5', border: '#fdba74', text: '#9a3412' },
};
```

**AgendaController — adicionar `professional_id` ao evento** (necessário para o `resourceId`):
O `getAgendaEvents` já retorna `professional`, então `event.professional?.id` funciona. Não é necessário alterar o backend.

---

## 9. Recomendações para evitar re-render desnecessário

| Problema potencial | Solução |
|---|---|
| `events` e `resources` recalculados a cada render | `useMemo` em `Index.tsx` para `calendarEvents` e `calendarResources` |
| `AgendaCalendar` re-renderiza ao abrir modal | `React.memo` em `AgendaCalendar` — o modal não altera `events` |
| Callbacks inline recriados a cada render | `useCallback` em todos os handlers do `Index.tsx` |
| `visibleProfessionals` calculado inline | `useMemo` dentro de `useAgendaUI` |
| FullCalendar re-monta ao mudar `currentDate` | Sincronizar via `calendarRef.current.getApi()`, não via prop `initialDate` |
| Toast de undo causa re-render em cascata | Estado `pendingUndo` isolado em `useAppointments`, não em `Index.tsx` |

---

## 10. Ordem de implementação (etapas pequenas)

### Etapa 1 — Fundação (sem quebrar nada)
1. Instalar pacotes FullCalendar
2. Criar `types.ts` com todas as interfaces
3. Criar `utils/calendarMappers.ts` com `toEventInput` e `toResourceInput`
4. Criar `AgendaCalendar.tsx` mínimo: FullCalendar com `resourceTimeGridWeek`, sem drag, sem callbacks — só renderizar eventos

### Etapa 2 — Hooks e estado
5. Criar `useAgendaUI.ts`
6. Criar `useAppointments.ts` sem undo (só CRUD básico)
7. Refatorar `Index.tsx` para usar os dois hooks
8. Verificar que a agenda renderiza igual ao estado atual

### Etapa 3 — Toolbar e filtros
9. Criar `ProfessionalFilter.tsx`
10. Criar `AgendaToolbar.tsx` com nav, views e filtro
11. Conectar toolbar ao FullCalendar via `calendarRef`

### Etapa 4 — Modal
12. Extrair `AppointmentModal.tsx` do `Index.tsx` atual
13. Conectar `onDateClick` (criar) e `onEventClick` (editar)
14. Testar criação e edição sem reload

### Etapa 5 — Drag-drop e undo
15. Adicionar plugin `@fullcalendar/interaction`
16. Implementar `eventDrop` e `eventResize` em `AgendaCalendar`
17. Implementar `moveAppointment` com otimismo em `useAppointments`
18. Adicionar toast com "Desfazer" (4 segundos)

### Etapa 6 — Responsividade mobile
19. Detectar mobile e ajustar `defaultView`
20. Testar e ajustar layout em viewport < 768px

---

## Dependências de backend

Nenhuma mudança no Laravel é obrigatória para a implementação. O `AgendaController` e o `AgendaService` existentes servem tudo que é necessário.

**Melhoria opcional** (etapa 4): adicionar rotas API JSON puras em `routes/api.php` para create/update/delete de agendamentos, evitando `router.reload()` a cada operação. Isso torna o UX mais fluido mas não é bloqueante.
