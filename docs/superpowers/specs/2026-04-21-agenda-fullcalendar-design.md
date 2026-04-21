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
| `useAppointments.ts` | Lista de eventos, create/update/delete, otimismo, undo | UI state |
| `useAgendaUI.ts` | Modal aberto/fechado, view, data atual, profissionais visíveis | HTTP |
| `AgendaCalendar.tsx` | Config FullCalendar, monta resources/events, dispara callbacks | HTTP, estado próprio |
| `AgendaToolbar.tsx` | Renderiza controles de nav, seletor de view, ProfessionalFilter | Lógica de negócio |
| `ProfessionalFilter.tsx` | Toggle de visibilidade por profissional com cor | Estado global |
| `AppointmentModal.tsx` | Form criar/editar com validação local, onSave/onDelete | HTTP direto |
| `calendarMappers.ts` | Funções puras de transformação de dados | Estado, side effects |

**Limite de crescimento:** `useAppointments.ts` não deve ultrapassar ~250 linhas. Se ultrapassar, separar em `useAppointments.ts` (state + mutations) e `useAppointmentUndo.ts` (undo helpers).

---

## 3. Tipos principais (`types.ts`)

```typescript
import type { EventInput } from '@fullcalendar/core';

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

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'no_show'
  | 'canceled';

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

// Payload para criar/atualizar (enviado ao backend JSON)
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

// Estende EventInput do FullCalendar para ter extendedProps tipados.
// backgroundColor, borderColor, textColor são herdados de EventInput.
export interface AgendaCalendarEvent extends EventInput {
  id: string;              // obrigatório como string no FullCalendar
  resourceId: string;      // professional.id como string
  extendedProps: {
    status: AppointmentStatus;
    customer: Customer | null;
    service: Service | null;
    professional: Professional | null;
    notes: string | null;
    charge: AppointmentCharge | null;
  };
}

// Entrada de recurso para resourceTimeGrid.
// `color` é a cor visual da coluna/header do profissional.
// Cor dos eventos é controlada por status em toEventInput(), não pelo resource.
export interface AgendaResource {
  id: string;    // professional.id como string
  title: string;
  color: string;
}

// Estado de uma operação de undo pendente
export interface UndoOperation {
  id: string;                        // appointment id como string
  previousEvent: AgendaCalendarEvent; // snapshot antes do move
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
  pendingUndo: UndoOperation | null;  // MVP: 1 undo pendente por vez

  // CRUD — todos usam endpoints JSON dedicados
  createAppointment: (payload: AppointmentPayload) => Promise<void>;
  updateAppointment: (id: number, payload: AppointmentPayload) => Promise<void>;
  deleteAppointment: (id: number) => Promise<void>;
  changeStatus: (id: number, status: AppointmentStatus, cancelReason?: string) => Promise<void>;

  // Drag — atualiza horário e/ou profissional
  moveAppointment: (params: {
    id: number;
    newStart: string;
    newEnd: string;
    newProfessionalId: number;
    revertFn: () => void;
  }) => void;

  // Resize — recalcula ends_at mantendo starts_at fixo
  resizeAppointment: (params: {
    id: number;
    newStart: string;
    newEnd: string;
    revertFn: () => void;
  }) => void;

  // Undo
  commitUndo: () => void;   // usuário clicou "desfazer"
  dismissUndo: () => void;  // timeout expirou
}

export function useAppointments({ initialEvents }: UseAppointmentsProps): UseAppointmentsReturn;
```

**Notas de implementação:**
- `events` é `useState<AgendaCalendarEvent[]>` inicializado via `calendarMappers.toEventInput(initialEvents)`
- Todos os métodos usam `axios` diretamente contra os endpoints JSON (ver Seção 9)
- Nenhum `router.reload()` — o estado local é a fonte da verdade após o carregamento inicial

### `useAgendaUI.ts`

```typescript
interface UseAgendaUIProps {
  professionals: Professional[];
  defaultView?: string;
}

interface UseAgendaUIReturn {
  // View e navegação
  currentView: string;
  setCurrentView: (view: string) => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;

  // Profissionais visíveis (máximo 5 lado a lado; acima disso scroll horizontal)
  visibleProfessionalIds: number[];
  toggleProfessional: (id: number) => void;
  visibleProfessionals: Professional[];   // useMemo — só os visíveis

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
- `visibleProfessionalIds` inicia com todos os IDs
- `visibleProfessionals` é `useMemo` — recalcula só quando `visibleProfessionalIds` muda

---

## 5. Props de cada componente

### `AgendaCalendar.tsx`

```typescript
interface AgendaCalendarProps {
  events: AgendaCalendarEvent[];
  resources: AgendaResource[];
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
  onSelect: (slot: { start: string; end: string; professionalId: number }) => void;
  onEventClick: (event: AgendaCalendarEvent) => void;
  onViewChange: (view: string) => void;
  onDateChange: (date: Date) => void;
}
```

**Notas:**
- `selectable: true` e handler `select` para criação por intervalo (mais preciso que `dateClick`)
- `headerToolbar: false` — a toolbar nativa é desativada; `AgendaToolbar` cuida disso
- `editable: false` para eventos com status `completed`, `canceled`, `no_show` (via `eventAllow`)
- Sincroniza `currentDate` e `currentView` via `calendarRef.current.getApi()` em `useEffect`, nunca via prop `initialDate` (evita re-mount do FullCalendar)
- `React.memo` para evitar re-render ao abrir/fechar modal

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
- Pill com cor sólida = visível; `opacity-40` = oculto
- Cores idênticas às de `PROFESSIONAL_COLORS` em `calendarMappers.ts`
- No mobile, vira `<select>` de profissional único (ver Seção 10)

### `AppointmentModal.tsx`

```typescript
interface AppointmentModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  event: AgendaCalendarEvent | null;
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
- No modo `create`: `professional_id` e `starts_at` pré-preenchidos do `initialSlot`
- `ends_at` recalculado automaticamente ao trocar o serviço (`starts_at + duration_minutes`)
- Botão "Finalizar e Cobrar" só aparece no modo `edit` com status `scheduled` ou `confirmed`
- Campos `status` `completed`, `canceled`, `no_show` abrem campo `cancel_reason` quando aplicável

---

## 6. Fluxo completo de drag-and-drop com update otimista e undo

```
Usuário arrasta evento
        │
        ▼
FullCalendar dispara eventDrop(info)
        │
        ▼
AgendaCalendar extrai id, newStart, newEnd, newResourceId, info.revert
        │
        ▼
useAppointments.moveAppointment(params)
        │
        ├─► [1] Se já existe pendingUndo: fecha o undo anterior (dismissUndo)
        │
        ├─► [2] Atualiza events[] imediatamente (otimista)
        │
        ├─► [3] Guarda UndoOperation { id, previousEvent, timeoutId: setTimeout(dismissUndo, 6000) }
        │
        ├─► [4] Mostra toast "Agendamento movido  [Desfazer]" (6 segundos)
        │
        ├─► [5] axios.put('/api/agenda/{id}', payload)
        │       │
        │       ├─ SUCESSO → nada; estado otimista já está correto
        │       │
        │       └─ ERRO → revertFn() + restaura events[] para previousEvent
        │                + fecha undo + mostra toast de erro
        │
        └─► [6] Se usuário clicar "Desfazer" (dentro de 6s):
                ├─► clearTimeout(undoOperation.timeoutId)
                ├─► Restaura events[] para previousEvent (UI imediata)
                ├─► axios.put('/api/agenda/{id}', valoresOriginais)  ← operação compensatória
                └─► Fecha pendingUndo
```

**Política de undo (MVP):**
- **1 undo pendente por vez.** Nova ação fecha o undo anterior sem reverter.
- Undo é uma **operação compensatória independente** — não depende de cancelar o PUT original.
- `AbortController` pode ser usado como otimização se o PUT original ainda não foi enviado, mas nunca como fundamento de consistência.
- Se o PUT compensatório falhar: mostra toast de erro, estado local pode ficar dessincronizado — usuário precisa recarregar. Raro mas documentado.

---

## 7. Fluxo de criação e edição de agendamento

**Criação (seleção de slot):**
```
Usuário seleciona intervalo de tempo numa coluna de profissional
        │
        ▼
FullCalendar dispara select(info)  ← selectable: true
  info.start, info.end, info.resource.id
        │
        ▼
useAgendaUI.openCreateModal({ start, end, professionalId })
        │
        ▼
AppointmentModal abre (mode='create')
  - professional_id pré-selecionado
  - starts_at pré-preenchido
  - ends_at calculado ao selecionar serviço
        │
        ▼
Usuário confirma → onSave(payload)
        │
        ▼
useAppointments.createAppointment(payload)
  → POST /api/agenda → retorna appointment normalizado
  → adiciona evento em events[] sem reload
```

**Edição (clique em evento):**
```
Usuário clica em evento
        │
        ▼
AgendaCalendar.onEventClick → extrai AgendaCalendarEvent de info.event
        │
        ▼
useAgendaUI.openEditModal(event)
        │
        ▼
AppointmentModal abre (mode='edit') com dados preenchidos
  Ações disponíveis:
  - Salvar        → onSave       → PUT /api/agenda/{id}
  - Excluir       → onDelete     → DELETE /api/agenda/{id}
  - Mudar Status  → onStatusChange → PUT /api/agenda/{id}/status
  - Finalizar     → redirect para /agenda/{id}/finalizar (fluxo Inertia existente)
```

---

## 8. Mapeamento Laravel props → FullCalendar events/resources (`calendarMappers.ts`)

```typescript
import type { AgendaCalendarEvent, AgendaResource, AppointmentEvent, AppointmentStatus, Professional } from '../types';

export const PROFESSIONAL_COLORS = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
];

export const STATUS_COLORS: Record<AppointmentStatus, { bg: string; border: string; text: string }> = {
  scheduled: { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af' },
  confirmed:  { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46' },
  completed:  { bg: '#f3f4f6', border: '#d1d5db', text: '#374151' },
  no_show:    { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
  canceled:   { bg: '#ffedd5', border: '#fdba74', text: '#9a3412' },
};

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
    backgroundColor: STATUS_COLORS[event.status]?.bg,
    borderColor: STATUS_COLORS[event.status]?.border,
    textColor: STATUS_COLORS[event.status]?.text,
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
```

---

## 9. Estratégia de backend — endpoints JSON dedicados

A leitura atual do backend (`AgendaController@index`) atende a renderização inicial sem alterações.

Para UX fluida em CRUD e drag-drop, **é necessário** expor endpoints JSON dedicados em `routes/api.php`. Misturar `axios` com `router.reload()` cria dois modelos inconsistentes dentro da mesma feature.

**Endpoints a adicionar:**

| Método | Rota | Ação | Resposta |
|---|---|---|---|
| `POST` | `/api/agenda` | Criar agendamento | `{ appointment: AppointmentEvent }` |
| `PUT` | `/api/agenda/{id}` | Atualizar agendamento | `{ appointment: AppointmentEvent }` |
| `PUT` | `/api/agenda/{id}/status` | Mudar status | `{ appointment: AppointmentEvent }` |
| `DELETE` | `/api/agenda/{id}` | Excluir agendamento | `{ ok: true }` |

**Contrato de resposta:** todos os endpoints retornam o appointment normalizado no mesmo formato de `AppointmentEvent` para que o frontend possa atualizar `events[]` diretamente sem mapeamento adicional.

**Reutilização:** os controllers existentes (`AgendaController@store`, `@update`, `@status`, `@destroy`) contêm a lógica de validação e autorização. Os novos endpoints JSON podem delegar para os mesmos services sem duplicar regras.

---

## 10. Regras de negócio do calendário

### Arrastabilidade
- `editable: true` apenas para status `scheduled` e `confirmed`
- Status `completed`, `canceled`, `no_show` → `editable: false` (via `eventAllow`)
- Resize recalcula `ends_at`, nunca `starts_at`
- Resize mínimo: 5 minutos (slot mínimo do FullCalendar)
- Mudança de profissional via drag permitida; compatibilidade de serviço não validada no frontend (backend valida disponibilidade)
- Profissional oculto no filtro: seus eventos permanecem editáveis via modal se já existirem; não podem receber novos eventos via drag

### Criação
- Não é permitido criar agendamento sem profissional selecionado
- Não é permitido criar agendamento em horário passado (validado no modal antes do POST)
- `ends_at` calculado automaticamente com base na `duration_minutes` do serviço selecionado

### Reabertura de status
- Eventos `canceled`, `completed`, `no_show` não são arrastáveis
- Podem ser reabertos apenas via modal (botão "Mudar Status") — nunca por drag

### Conflitos e sobreposição
- Sem overlap no mesmo profissional (validado no backend via `AgendaService::isAvailable`)
- **MVP:** frontend não bloqueia overlap visualmente — confia inteiramente na validação do backend
- Se o PUT retornar erro de conflito: `revertFn()` + toast com a mensagem do servidor
- **Dívida conhecida (pós-MVP):** bloquear ou sinalizar visualmente conflito antes do PUT, checando `events[]` local por sobreposição no mesmo `resourceId`

### Horários fora do expediente
- Drag fora do expediente é permitido no frontend; validado no backend
- Se fora do expediente, backend retorna erro → `revertFn()` + toast

---

## 11. Responsividade mobile

| Contexto | Comportamento |
|---|---|
| Desktop (≥768px) | `resourceTimeGridWeek` padrão; até 5 profissionais lado a lado |
| Mobile (<768px) | `listWeek` padrão; view `resourceTimeGridDay` disponível com 1 profissional por vez |
| Mobile — troca de profissional | `ProfessionalFilter` vira `<select>` de profissional único |
| Mobile — views disponíveis | `listWeek`, `resourceTimeGridDay`, `dayGridMonth` |
| Desktop — views disponíveis | `resourceTimeGridWeek`, `resourceTimeGridDay`, `dayGridMonth`, `listWeek` |

---

## 12. Recomendações para evitar re-render desnecessário

| Problema potencial | Solução |
|---|---|
| `events` e `resources` recalculados a cada render | `useMemo` em `Index.tsx` para `calendarEvents` e `calendarResources` |
| `AgendaCalendar` re-renderiza ao abrir modal | `React.memo` em `AgendaCalendar` |
| Callbacks inline recriados a cada render | `useCallback` em todos os handlers passados ao `AgendaCalendar` |
| `visibleProfessionals` calculado inline | `useMemo` dentro de `useAgendaUI` |
| FullCalendar re-monta ao mudar `currentDate` | Sincronizar via `calendarRef.current.getApi().gotoDate()`, não via prop `initialDate` |
| Toast de undo causa re-render em cascata | `pendingUndo` isolado em `useAppointments`, não sobe para `Index.tsx` |

---

## 13. Ordem de implementação (6 etapas)

### Etapa 1 — Fundação
1. Instalar pacotes FullCalendar
2. Criar `types.ts` com todas as interfaces
3. Criar `utils/calendarMappers.ts`
4. Criar `AgendaCalendar.tsx` mínimo: renderiza eventos sem drag, sem callbacks

### Etapa 2 — Hooks e estado
5. Criar `useAgendaUI.ts`
6. Criar `useAppointments.ts` sem undo (CRUD básico)
7. Refatorar `Index.tsx` para usar os dois hooks
8. Verificar que a agenda renderiza corretamente

### Etapa 3 — Toolbar e filtros
9. Criar `ProfessionalFilter.tsx`
10. Criar `AgendaToolbar.tsx`
11. Conectar toolbar ao FullCalendar via `calendarRef`

### Etapa 4 — Endpoints JSON + Modal
12. Adicionar endpoints JSON em `routes/api.php` + controllers
13. Extrair `AppointmentModal.tsx` do `Index.tsx` atual
14. Conectar `onSelect` (criar) e `onEventClick` (editar) usando os novos endpoints

### Etapa 5 — Drag-drop e undo
15. Ativar `editable: true` e `selectable: true` no FullCalendar
16. Implementar `eventDrop` e `eventResize` em `AgendaCalendar`
17. Implementar `moveAppointment` com otimismo e undo (6s) em `useAppointments`
18. Adicionar toast com "Desfazer"

### Etapa 6 — Responsividade mobile
19. Detectar mobile e ajustar `defaultView` e `ProfessionalFilter`
20. Testar e ajustar layout em viewport < 768px
