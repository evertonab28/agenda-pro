# Agenda FullCalendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar a página `/agenda` de um calendário customizado para FullCalendar com `resourceTimeGrid`, suportando múltiplos profissionais em colunas, drag-and-drop com undo otimista, e modal integrado de criação/edição.

**Architecture:** O `Index.tsx` atual (596 linhas) é refatorado em 8 arquivos focados: dois hooks (`useAppointments`, `useAgendaUI`), quatro componentes (`AgendaCalendar`, `AgendaToolbar`, `ProfessionalFilter`, `AppointmentModal`), um utilitário (`calendarMappers`) e um arquivo de tipos. O backend ganha 4 endpoints JSON em `routes/api.php` servidos por um novo `AgendaApiController` que delega para o `AgendaService` existente.

**Tech Stack:** FullCalendar 6.x (`@fullcalendar/react`, `@fullcalendar/resource-timegrid`, `@fullcalendar/interaction`), React + TypeScript, Laravel + Inertia, axios, sonner (toast).

---

## Mapa de arquivos

| Ação | Arquivo |
|---|---|
| Criar | `resources/js/Pages/Agenda/types.ts` |
| Criar | `resources/js/Pages/Agenda/utils/calendarMappers.ts` |
| Criar | `resources/js/Pages/Agenda/hooks/useAgendaUI.ts` |
| Criar | `resources/js/Pages/Agenda/hooks/useAppointments.ts` |
| Criar | `resources/js/Pages/Agenda/components/AgendaCalendar.tsx` |
| Criar | `resources/js/Pages/Agenda/components/ProfessionalFilter.tsx` |
| Criar | `resources/js/Pages/Agenda/components/AgendaToolbar.tsx` |
| Criar | `resources/js/Pages/Agenda/components/AppointmentModal.tsx` |
| Substituir | `resources/js/Pages/Agenda/Index.tsx` |
| Criar | `app/Http/Controllers/AgendaApiController.php` |
| Modificar | `routes/api.php` |
| Modificar | `resources/js/Layouts/AppLayout.tsx` (adicionar `<Toaster>`) |

---

## Task 1: Instalar FullCalendar e criar types.ts

**Files:**
- Modify: `package.json` (via npm install)
- Create: `resources/js/Pages/Agenda/types.ts`

- [ ] **Step 1: Instalar pacotes FullCalendar**

```bash
cd d:/saas/agenda-pro
npm install @fullcalendar/react @fullcalendar/resource-timegrid @fullcalendar/timegrid @fullcalendar/daygrid @fullcalendar/list @fullcalendar/interaction @fullcalendar/resource-daygrid @fullcalendar/core
```

Expected: sem erros, `node_modules/@fullcalendar` criado.

- [ ] **Step 2: Criar `types.ts`**

```typescript
// resources/js/Pages/Agenda/types.ts
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

export interface AppointmentEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  status: AppointmentStatus;
  customer: Customer | null;
  service: Service | null;
  professional: Professional | null;
  notes: string | null;
  charge: AppointmentCharge | null;
}

export interface AppointmentPayload {
  customer_id: number | string;
  service_id: number | string;
  professional_id: number | string;
  starts_at: string;
  ends_at: string;
  notes?: string;
  status?: AppointmentStatus;
  cancel_reason?: string;
}

export interface AgendaCalendarEvent extends EventInput {
  id: string;
  resourceId: string;
  extendedProps: {
    status: AppointmentStatus;
    customer: Customer | null;
    service: Service | null;
    professional: Professional | null;
    notes: string | null;
    charge: AppointmentCharge | null;
  };
}

export interface AgendaResource {
  id: string;
  title: string;
  color: string;
}

export interface UndoOperation {
  id: string;
  previousEvent: AgendaCalendarEvent;
  timeoutId: ReturnType<typeof setTimeout>;
}
```

- [ ] **Step 3: Verificar que TypeScript aceita os tipos**

```bash
cd d:/saas/agenda-pro
npx tsc --noEmit 2>&1 | grep "types.ts"
```

Expected: sem output (sem erros no arquivo).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json resources/js/Pages/Agenda/types.ts
git commit -m "feat(agenda): instala FullCalendar e define tipos base"
```

---

## Task 2: Criar calendarMappers.ts

**Files:**
- Create: `resources/js/Pages/Agenda/utils/calendarMappers.ts`

- [ ] **Step 1: Criar o arquivo**

```typescript
// resources/js/Pages/Agenda/utils/calendarMappers.ts
import type {
  AgendaCalendarEvent,
  AgendaResource,
  AppointmentEvent,
  AppointmentStatus,
  Professional,
} from '../types';

export const PROFESSIONAL_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
];

export const STATUS_COLORS: Record<
  AppointmentStatus,
  { bg: string; border: string; text: string }
> = {
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
  return events.map((event) => ({
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

export function professionalColor(professionalId: number, professionals: Professional[]): string {
  const index = professionals.findIndex((p) => p.id === professionalId);
  return PROFESSIONAL_COLORS[index % PROFESSIONAL_COLORS.length] ?? PROFESSIONAL_COLORS[0];
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit 2>&1 | grep "calendarMappers"
```

Expected: sem output.

- [ ] **Step 3: Commit**

```bash
git add resources/js/Pages/Agenda/utils/calendarMappers.ts
git commit -m "feat(agenda): adiciona calendarMappers (toEventInput, toResourceInput)"
```

---

## Task 3: Criar useAgendaUI.ts

**Files:**
- Create: `resources/js/Pages/Agenda/hooks/useAgendaUI.ts`

- [ ] **Step 1: Criar o hook**

```typescript
// resources/js/Pages/Agenda/hooks/useAgendaUI.ts
import { useState, useMemo, useCallback } from 'react';
import type { AgendaCalendarEvent, Professional } from '../types';

interface UseAgendaUIProps {
  professionals: Professional[];
}

export function useAgendaUI({ professionals }: UseAgendaUIProps) {
  const defaultView =
    typeof window !== 'undefined' && window.innerWidth < 768
      ? 'listWeek'
      : 'resourceTimeGridWeek';

  const [currentView, setCurrentView] = useState(defaultView);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visibleProfessionalIds, setVisibleProfessionalIds] = useState<number[]>(
    () => professionals.map((p) => p.id)
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedEvent, setSelectedEvent] = useState<AgendaCalendarEvent | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: string;
    end: string;
    professionalId: number;
  } | null>(null);

  const visibleProfessionals = useMemo(
    () => professionals.filter((p) => visibleProfessionalIds.includes(p.id)),
    [professionals, visibleProfessionalIds]
  );

  const toggleProfessional = useCallback((id: number) => {
    setVisibleProfessionalIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const openCreateModal = useCallback(
    (slot: { start: string; end: string; professionalId: number }) => {
      setSelectedSlot(slot);
      setSelectedEvent(null);
      setModalMode('create');
      setModalOpen(true);
    },
    []
  );

  const openEditModal = useCallback((event: AgendaCalendarEvent) => {
    setSelectedEvent(event);
    setSelectedSlot(null);
    setModalMode('edit');
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedEvent(null);
    setSelectedSlot(null);
  }, []);

  return {
    currentView,
    setCurrentView,
    currentDate,
    setCurrentDate,
    visibleProfessionalIds,
    toggleProfessional,
    visibleProfessionals,
    modalOpen,
    modalMode,
    selectedEvent,
    selectedSlot,
    openCreateModal,
    openEditModal,
    closeModal,
  };
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit 2>&1 | grep "useAgendaUI"
```

Expected: sem output.

- [ ] **Step 3: Commit**

```bash
git add resources/js/Pages/Agenda/hooks/useAgendaUI.ts
git commit -m "feat(agenda): adiciona useAgendaUI (modal, view, filtro de profissionais)"
```

---

## Task 4: Criar useAppointments.ts (sem undo)

**Files:**
- Create: `resources/js/Pages/Agenda/hooks/useAppointments.ts`

- [ ] **Step 1: Criar o hook com CRUD básico**

```typescript
// resources/js/Pages/Agenda/hooks/useAppointments.ts
import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { toEventInput } from '../utils/calendarMappers';
import type {
  AgendaCalendarEvent,
  AppointmentEvent,
  AppointmentPayload,
  AppointmentStatus,
  UndoOperation,
} from '../types';

interface UseAppointmentsProps {
  initialEvents: AppointmentEvent[];
}

export function useAppointments({ initialEvents }: UseAppointmentsProps) {
  const [events, setEvents] = useState<AgendaCalendarEvent[]>(
    () => toEventInput(initialEvents)
  );
  const [pendingUndo, setPendingUndo] = useState<UndoOperation | null>(null);

  const dismissUndo = useCallback(() => {
    setPendingUndo((prev) => {
      if (prev) clearTimeout(prev.timeoutId);
      return null;
    });
  }, []);

  const commitUndo = useCallback(() => {
    if (!pendingUndo) return;
    clearTimeout(pendingUndo.timeoutId);
    const { id, previousEvent } = pendingUndo;
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? previousEvent : e))
    );
    setPendingUndo(null);
    // Operação compensatória: restaura no backend
    axios
      .put(`/api/agenda/${id}`, {
        professional_id: previousEvent.resourceId,
        starts_at: previousEvent.start,
        ends_at: previousEvent.end,
      })
      .catch(() => toast.error('Falha ao desfazer. Recarregue a página.'));
  }, [pendingUndo]);

  const createAppointment = useCallback(async (payload: AppointmentPayload) => {
    const { data } = await axios.post<{ appointment: AppointmentEvent }>('/api/agenda', payload);
    const [newEvent] = toEventInput([data.appointment]);
    setEvents((prev) => [...prev, newEvent]);
    toast.success('Agendamento criado.');
  }, []);

  const updateAppointment = useCallback(async (id: number, payload: AppointmentPayload) => {
    const { data } = await axios.put<{ appointment: AppointmentEvent }>(`/api/agenda/${id}`, payload);
    const [updated] = toEventInput([data.appointment]);
    setEvents((prev) => prev.map((e) => (e.id === String(id) ? updated : e)));
    toast.success('Agendamento atualizado.');
  }, []);

  const deleteAppointment = useCallback(async (id: number) => {
    await axios.delete(`/api/agenda/${id}`);
    setEvents((prev) => prev.filter((e) => e.id !== String(id)));
    toast.success('Agendamento excluído.');
  }, []);

  const changeStatus = useCallback(
    async (id: number, status: AppointmentStatus, cancelReason?: string) => {
      const { data } = await axios.put<{ appointment: AppointmentEvent }>(
        `/api/agenda/${id}/status`,
        { status, cancel_reason: cancelReason }
      );
      const [updated] = toEventInput([data.appointment]);
      setEvents((prev) => prev.map((e) => (e.id === String(id) ? updated : e)));
      toast.success('Status atualizado.');
    },
    []
  );

  const moveAppointment = useCallback(
    ({
      id,
      newStart,
      newEnd,
      newProfessionalId,
      revertFn,
    }: {
      id: number;
      newStart: string;
      newEnd: string;
      newProfessionalId: number;
      revertFn: () => void;
    }) => {
      // Fecha undo anterior sem reverter
      if (pendingUndo) {
        clearTimeout(pendingUndo.timeoutId);
        setPendingUndo(null);
      }

      const strId = String(id);
      const previousEvent = events.find((e) => e.id === strId);
      if (!previousEvent) return;

      // Atualização otimista
      setEvents((prev) =>
        prev.map((e) =>
          e.id === strId
            ? { ...e, start: newStart, end: newEnd, resourceId: String(newProfessionalId) }
            : e
        )
      );

      const timeoutId = setTimeout(() => dismissUndo(), 6000);
      setPendingUndo({ id: strId, previousEvent, timeoutId });

      // Toast com undo — commitUndo é chamado via botão no toast
      toast('Agendamento movido.', {
        duration: 6000,
        action: { label: 'Desfazer', onClick: commitUndo },
      });

      axios
        .put(`/api/agenda/${id}`, {
          professional_id: newProfessionalId,
          starts_at: newStart,
          ends_at: newEnd,
        })
        .catch((err) => {
          revertFn();
          setEvents((prev) =>
            prev.map((e) => (e.id === strId ? previousEvent : e))
          );
          clearTimeout(timeoutId);
          setPendingUndo(null);
          const msg = err.response?.data?.message ?? 'Erro ao mover agendamento.';
          toast.error(msg);
        });
    },
    [events, pendingUndo, dismissUndo, commitUndo]
  );

  const resizeAppointment = useCallback(
    ({
      id,
      newStart,
      newEnd,
      revertFn,
    }: {
      id: number;
      newStart: string;
      newEnd: string;
      revertFn: () => void;
    }) => {
      if (pendingUndo) {
        clearTimeout(pendingUndo.timeoutId);
        setPendingUndo(null);
      }

      const strId = String(id);
      const previousEvent = events.find((e) => e.id === strId);
      if (!previousEvent) return;

      setEvents((prev) =>
        prev.map((e) =>
          e.id === strId ? { ...e, start: newStart, end: newEnd } : e
        )
      );

      const timeoutId = setTimeout(() => dismissUndo(), 6000);
      setPendingUndo({ id: strId, previousEvent, timeoutId });

      toast('Duração alterada.', {
        duration: 6000,
        action: { label: 'Desfazer', onClick: commitUndo },
      });

      axios
        .put(`/api/agenda/${id}`, { starts_at: newStart, ends_at: newEnd })
        .catch((err) => {
          revertFn();
          setEvents((prev) =>
            prev.map((e) => (e.id === strId ? previousEvent : e))
          );
          clearTimeout(timeoutId);
          setPendingUndo(null);
          toast.error(err.response?.data?.message ?? 'Erro ao redimensionar.');
        });
    },
    [events, pendingUndo, dismissUndo, commitUndo]
  );

  return {
    events,
    pendingUndo,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    changeStatus,
    moveAppointment,
    resizeAppointment,
    commitUndo,
    dismissUndo,
  };
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit 2>&1 | grep "useAppointments"
```

Expected: sem output.

- [ ] **Step 3: Commit**

```bash
git add resources/js/Pages/Agenda/hooks/useAppointments.ts
git commit -m "feat(agenda): adiciona useAppointments (CRUD, otimismo, undo 6s)"
```

---

## Task 5: Criar AgendaCalendar.tsx

**Files:**
- Create: `resources/js/Pages/Agenda/components/AgendaCalendar.tsx`

- [ ] **Step 1: Criar o componente**

```typescript
// resources/js/Pages/Agenda/components/AgendaCalendar.tsx
import { useRef, useEffect, memo } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventDropArg, EventResizeDoneArg, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import type { AgendaCalendarEvent, AgendaResource } from '../types';

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

const EDITABLE_STATUSES = new Set(['scheduled', 'confirmed']);

function AgendaCalendarInner({
  events,
  resources,
  currentView,
  currentDate,
  onEventDrop,
  onEventResize,
  onSelect,
  onEventClick,
  onViewChange,
  onDateChange,
}: AgendaCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);

  // Sincroniza view sem re-montar o FullCalendar
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    if (api.view.type !== currentView) api.changeView(currentView);
  }, [currentView]);

  // Sincroniza data sem re-montar o FullCalendar
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    api.gotoDate(currentDate);
  }, [currentDate]);

  const handleEventDrop = (info: EventDropArg) => {
    const status = info.event.extendedProps?.status;
    if (!EDITABLE_STATUSES.has(status)) { info.revert(); return; }
    onEventDrop({
      id: Number(info.event.id),
      newStart: info.event.startStr,
      newEnd: info.event.endStr,
      newProfessionalId: Number(info.newResource?.id ?? info.event.getResources()[0]?.id),
      revertFn: info.revert,
    });
  };

  const handleEventResize = (info: EventResizeDoneArg) => {
    onEventResize({
      id: Number(info.event.id),
      newStart: info.event.startStr,
      newEnd: info.event.endStr,
      revertFn: info.revert,
    });
  };

  const handleSelect = (info: DateSelectArg) => {
    // Bloqueia criação em horário passado
    if (info.start < new Date()) return;
    onSelect({
      start: info.startStr,
      end: info.endStr,
      professionalId: Number(info.resource?.id ?? 0),
    });
  };

  const handleEventClick = (info: EventClickArg) => {
    onEventClick(info.event as unknown as AgendaCalendarEvent);
  };

  const handleDatesSet = (arg: { view: { type: string }; start: Date }) => {
    onViewChange(arg.view.type);
    onDateChange(arg.start);
  };

  return (
    <FullCalendar
      ref={calendarRef}
      plugins={[
        resourceTimeGridPlugin,
        resourceDayGridPlugin,
        dayGridPlugin,
        listPlugin,
        interactionPlugin,
      ]}
      initialView={currentView}
      resources={resources}
      events={events}
      headerToolbar={false}
      editable={true}
      selectable={true}
      selectMirror={true}
      slotMinTime="06:00:00"
      slotMaxTime="22:00:00"
      allDaySlot={false}
      locale="pt-br"
      height="calc(100vh - 120px)"
      eventAllow={(dropInfo, draggedEvent) => {
        const status = draggedEvent?.extendedProps?.status;
        return EDITABLE_STATUSES.has(status);
      }}
      eventDrop={handleEventDrop}
      eventResize={handleEventResize}
      select={handleSelect}
      eventClick={handleEventClick}
      datesSet={handleDatesSet}
      resourceLabelContent={(arg) => (
        <span className="text-xs font-semibold">{arg.resource.title}</span>
      )}
    />
  );
}

export const AgendaCalendar = memo(AgendaCalendarInner);
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit 2>&1 | grep "AgendaCalendar"
```

Expected: sem output.

- [ ] **Step 3: Commit**

```bash
git add resources/js/Pages/Agenda/components/AgendaCalendar.tsx
git commit -m "feat(agenda): adiciona AgendaCalendar (FullCalendar com resourceTimeGrid)"
```

---

## Task 6: Criar ProfessionalFilter.tsx e AgendaToolbar.tsx

**Files:**
- Create: `resources/js/Pages/Agenda/components/ProfessionalFilter.tsx`
- Create: `resources/js/Pages/Agenda/components/AgendaToolbar.tsx`

- [ ] **Step 1: Criar ProfessionalFilter.tsx**

```typescript
// resources/js/Pages/Agenda/components/ProfessionalFilter.tsx
import { PROFESSIONAL_COLORS } from '../utils/calendarMappers';
import type { Professional } from '../types';

interface ProfessionalFilterProps {
  professionals: Professional[];
  visibleIds: number[];
  onToggle: (id: number) => void;
  mobile?: boolean; // se true, renderiza <select>
  onMobileSelect?: (id: number) => void;
}

export function ProfessionalFilter({
  professionals,
  visibleIds,
  onToggle,
  mobile = false,
  onMobileSelect,
}: ProfessionalFilterProps) {
  if (mobile) {
    const selectedId = visibleIds[0] ?? professionals[0]?.id;
    return (
      <select
        className="text-sm border border-gray-200 dark:border-zinc-700 rounded-lg px-2 py-1 bg-white dark:bg-zinc-900"
        value={selectedId}
        onChange={(e) => onMobileSelect?.(Number(e.target.value))}
      >
        {professionals.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {professionals.map((p, index) => {
        const color = PROFESSIONAL_COLORS[index % PROFESSIONAL_COLORS.length];
        const visible = visibleIds.includes(p.id);
        return (
          <button
            key={p.id}
            onClick={() => onToggle(p.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-opacity ${
              visible ? 'opacity-100' : 'opacity-40'
            }`}
            style={{ borderColor: color, color, backgroundColor: `${color}18` }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            {p.name}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Criar AgendaToolbar.tsx**

```typescript
// resources/js/Pages/Agenda/components/AgendaToolbar.tsx
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ProfessionalFilter } from './ProfessionalFilter';
import type { Professional } from '../types';

interface AgendaToolbarProps {
  currentView: string;
  currentDate: Date;
  professionals: Professional[];
  visibleProfessionalIds: number[];
  onViewChange: (view: string) => void;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
  onToggleProfessional: (id: number) => void;
  onCreateClick: () => void;
  isMobile: boolean;
  onMobileProfessionalSelect: (id: number) => void;
}

const VIEW_LABELS: Record<string, string> = {
  resourceTimeGridWeek: 'Semana',
  resourceTimeGridDay: 'Dia',
  dayGridMonth: 'Mês',
  listWeek: 'Lista',
};

const DESKTOP_VIEWS = ['resourceTimeGridWeek', 'resourceTimeGridDay', 'dayGridMonth', 'listWeek'];
const MOBILE_VIEWS = ['listWeek', 'resourceTimeGridDay', 'dayGridMonth'];

function formatHeader(date: Date, view: string): string {
  if (view === 'resourceTimeGridWeek' || view === 'listWeek') {
    return format(date, "MMMM yyyy", { locale: ptBR });
  }
  if (view === 'resourceTimeGridDay') {
    return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
  }
  return format(date, "MMMM yyyy", { locale: ptBR });
}

export function AgendaToolbar({
  currentView,
  currentDate,
  professionals,
  visibleProfessionalIds,
  onViewChange,
  onNavigate,
  onToggleProfessional,
  onCreateClick,
  isMobile,
  onMobileProfessionalSelect,
}: AgendaToolbarProps) {
  const views = isMobile ? MOBILE_VIEWS : DESKTOP_VIEWS;

  return (
    <div className="flex flex-col gap-3 mb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Navegação */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => onNavigate('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigate('today')}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => onNavigate('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium capitalize ml-1">
            {formatHeader(currentDate, currentView)}
          </span>
        </div>

        {/* Seletor de view */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
          {views.map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                currentView === v
                  ? 'bg-white dark:bg-zinc-700 shadow-sm text-gray-900 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400'
              }`}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>

        {/* Botão criar */}
        <Button onClick={onCreateClick} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Novo
        </Button>
      </div>

      {/* Filtro de profissionais */}
      {professionals.length > 1 && (
        <ProfessionalFilter
          professionals={professionals}
          visibleIds={visibleProfessionalIds}
          onToggle={onToggleProfessional}
          mobile={isMobile}
          onMobileSelect={onMobileProfessionalSelect}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verificar tipos**

```bash
npx tsc --noEmit 2>&1 | grep -E "ProfessionalFilter|AgendaToolbar"
```

Expected: sem output.

- [ ] **Step 4: Commit**

```bash
git add resources/js/Pages/Agenda/components/ProfessionalFilter.tsx resources/js/Pages/Agenda/components/AgendaToolbar.tsx
git commit -m "feat(agenda): adiciona ProfessionalFilter e AgendaToolbar"
```

---

## Task 7: Criar endpoints JSON no backend (AgendaApiController)

**Files:**
- Create: `app/Http/Controllers/AgendaApiController.php`
- Modify: `routes/api.php`

- [ ] **Step 1: Criar AgendaApiController.php**

```php
<?php
// app/Http/Controllers/AgendaApiController.php

namespace App\Http\Controllers;

use App\Http\Requests\AgendaStoreRequest;
use App\Models\Appointment;
use App\Services\AgendaService;
use App\Services\AuditService;
use App\Enums\AppointmentStatus;
use Illuminate\Http\Request;

class AgendaApiController extends Controller
{
    public function __construct(private AgendaService $agendaService) {}

    private function formatAppointment(Appointment $appointment): array
    {
        $appointment->load(['customer', 'service', 'professional', 'charge.receipts']);
        $charge = $appointment->charge;
        $amountPaid = $charge ? $charge->receipts->sum('amount_received') : 0;

        return [
            'id'           => $appointment->id,
            'title'        => ($appointment->customer?->name ?? 'Cliente') . ' - ' . ($appointment->service?->name ?? 'Serviço'),
            'start'        => $appointment->starts_at->toIso8601String(),
            'end'          => $appointment->ends_at->toIso8601String(),
            'status'       => $appointment->status,
            'customer'     => $appointment->customer,
            'service'      => $appointment->service,
            'professional' => $appointment->professional,
            'notes'        => $appointment->notes,
            'charge'       => $charge ? [
                'id'     => $charge->id,
                'status' => $charge->status,
                'amount' => $charge->amount,
                'paid'   => $amountPaid,
            ] : null,
        ];
    }

    public function store(AgendaStoreRequest $request)
    {
        $this->authorize('create', Appointment::class);

        $data = $request->validated();
        $availability = $this->agendaService->isAvailable(
            $data['professional_id'],
            $data['starts_at'],
            $data['ends_at'],
            null,
            $data['service_id']
        );

        if (!$availability['available']) {
            return response()->json(['message' => $availability['message']], 422);
        }

        $appointment = Appointment::create($data);
        AuditService::log(auth()->user(), 'appointment.created', $appointment);

        return response()->json(['appointment' => $this->formatAppointment($appointment)], 201);
    }

    public function update(AgendaStoreRequest $request, Appointment $appointment)
    {
        $this->authorize('update', $appointment);

        $data = $request->validated();
        $availability = $this->agendaService->isAvailable(
            $data['professional_id'],
            $data['starts_at'],
            $data['ends_at'],
            $appointment->id,
            $data['service_id'] ?? $appointment->service_id
        );

        if (!$availability['available']) {
            return response()->json(['message' => $availability['message']], 422);
        }

        $appointment->update($data);
        AuditService::log(auth()->user(), 'appointment.updated', $appointment);

        return response()->json(['appointment' => $this->formatAppointment($appointment)]);
    }

    public function status(Request $request, Appointment $appointment)
    {
        $this->authorize('update', $appointment);

        $request->validate([
            'status'        => 'required|string|in:' . implode(',', AppointmentStatus::values()),
            'cancel_reason' => 'nullable|string|max:255',
        ]);

        $appointment->update([
            'status'        => $request->status,
            'cancel_reason' => $request->cancel_reason,
        ]);

        AuditService::log(auth()->user(), 'appointment.status_changed', $appointment, [
            'status' => $request->status,
        ]);

        return response()->json(['appointment' => $this->formatAppointment($appointment)]);
    }

    public function destroy(Appointment $appointment)
    {
        $this->authorize('delete', $appointment);
        AuditService::log(auth()->user(), 'appointment.deleted', $appointment);
        $appointment->delete();

        return response()->json(['ok' => true]);
    }
}
```

- [ ] **Step 2: Adicionar rotas em `routes/api.php`**

Encontre o bloco `Route::middleware(['auth', 'subscribed'])` em `routes/api.php` e adicione as rotas dentro dele:

```php
// Agenda JSON API (para FullCalendar — sem redirect Inertia)
Route::post('agenda', [\App\Http\Controllers\AgendaApiController::class, 'store']);
Route::put('agenda/{appointment}', [\App\Http\Controllers\AgendaApiController::class, 'update']);
Route::put('agenda/{appointment}/status', [\App\Http\Controllers\AgendaApiController::class, 'status']);
Route::delete('agenda/{appointment}', [\App\Http\Controllers\AgendaApiController::class, 'destroy']);
```

- [ ] **Step 3: Testar os endpoints via tinker**

```bash
php artisan route:list --path=api/agenda
```

Expected: 4 rotas listadas (POST, PUT, PUT/status, DELETE).

- [ ] **Step 4: Commit**

```bash
git add app/Http/Controllers/AgendaApiController.php routes/api.php
git commit -m "feat(agenda): adiciona AgendaApiController com endpoints JSON (store, update, status, destroy)"
```

---

## Task 8: Criar AppointmentModal.tsx

**Files:**
- Create: `resources/js/Pages/Agenda/components/AppointmentModal.tsx`

- [ ] **Step 1: Criar o componente**

```typescript
// resources/js/Pages/Agenda/components/AppointmentModal.tsx
import { useState, useEffect } from 'react';
import { format, parseISO, addMinutes } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CustomerAutocomplete from '@/components/CustomerAutocomplete';
import { route } from '@/utils/route';
import type {
  AgendaCalendarEvent,
  AppointmentPayload,
  AppointmentStatus,
  Customer,
  Professional,
  Service,
} from '../types';

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

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  no_show: 'Não Compareceu',
  canceled: 'Cancelado',
};

export function AppointmentModal({
  open,
  mode,
  event,
  initialSlot,
  professionals,
  services,
  customers,
  onSave,
  onDelete,
  onStatusChange,
  onClose,
}: AppointmentModalProps) {
  const ep = event?.extendedProps;

  const [customerId, setCustomerId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [notes, setNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Preenche campos ao abrir
  useEffect(() => {
    if (!open) return;
    if (mode === 'create' && initialSlot) {
      setCustomerId('');
      setServiceId('');
      setProfessionalId(String(initialSlot.professionalId));
      setStartsAt(initialSlot.start.slice(0, 16));
      setEndsAt(initialSlot.end.slice(0, 16));
      setNotes('');
      setCancelReason('');
      setError('');
    } else if (mode === 'edit' && event) {
      setCustomerId(String(ep?.customer?.id ?? ''));
      setServiceId(String(ep?.service?.id ?? ''));
      setProfessionalId(String(event.resourceId ?? ''));
      setStartsAt((event.start as string)?.slice(0, 16) ?? '');
      setEndsAt((event.end as string)?.slice(0, 16) ?? '');
      setNotes(ep?.notes ?? '');
      setCancelReason('');
      setError('');
    }
  }, [open, mode]);

  // Recalcula ends_at ao trocar serviço
  useEffect(() => {
    if (!startsAt || !serviceId) return;
    const svc = services.find((s) => String(s.id) === serviceId);
    if (!svc) return;
    const start = new Date(startsAt);
    const end = addMinutes(start, svc.duration_minutes);
    setEndsAt(format(end, "yyyy-MM-dd'T'HH:mm"));
  }, [serviceId, startsAt]);

  const handleSave = async () => {
    if (!customerId || !serviceId || !professionalId || !startsAt || !endsAt) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    if (new Date(startsAt) < new Date() && mode === 'create') {
      setError('Não é possível agendar no passado.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSave({
        customer_id: customerId,
        service_id: serviceId,
        professional_id: professionalId,
        starts_at: startsAt.replace('T', ' ') + ':00',
        ends_at: endsAt.replace('T', ' ') + ':00',
        notes,
      });
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Erro ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !confirm('Excluir este agendamento?')) return;
    setLoading(true);
    try {
      await onDelete(Number(event.id));
      onClose();
    } catch {
      setError('Erro ao excluir.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: AppointmentStatus) => {
    if (!event) return;
    setLoading(true);
    try {
      await onStatusChange(Number(event.id), status, cancelReason || undefined);
      onClose();
    } catch {
      setError('Erro ao mudar status.');
    } finally {
      setLoading(false);
    }
  };

  const currentStatus = ep?.status;
  const isEditable = currentStatus === 'scheduled' || currentStatus === 'confirmed';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Novo Agendamento' : 'Editar Agendamento'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
          )}

          {/* Cliente */}
          <div className="space-y-1">
            <Label>Cliente *</Label>
            <CustomerAutocomplete
              customers={customers}
              value={customerId}
              onChange={setCustomerId}
            />
          </div>

          {/* Serviço */}
          <div className="space-y-1">
            <Label>Serviço *</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Profissional */}
          <div className="space-y-1">
            <Label>Profissional *</Label>
            <Select value={professionalId} onValueChange={setProfessionalId}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {professionals.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Horários */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Início *</Label>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Término *</Label>
              <Input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Mudar status (modo edit) */}
          {mode === 'edit' && currentStatus && (
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Mudar status
              </Label>
              <div className="flex flex-wrap gap-2">
                {(['scheduled', 'confirmed', 'completed', 'no_show', 'canceled'] as AppointmentStatus[])
                  .filter((s) => s !== currentStatus)
                  .map((s) => (
                    <Button
                      key={s}
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(s)}
                      disabled={loading}
                    >
                      {STATUS_LABELS[s]}
                    </Button>
                  ))}
              </div>
              {(currentStatus === 'canceled' || currentStatus === 'no_show') && (
                <Input
                  placeholder="Motivo (opcional)"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {mode === 'edit' && (
            <>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
                Excluir
              </Button>
              {isEditable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = route('agenda.finalizar' as any, event!.id as any)}
                >
                  Finalizar e Cobrar
                </Button>
              )}
            </>
          )}
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
          {(mode === 'create' || isEditable) && (
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Adicionar rota `agenda.finalizar` ao route.ts**

Em `resources/js/utils/route.ts`, dentro do objeto `routes`, adicionar:

```typescript
'agenda.finalizar': '/agenda/:id/finalizar',
```

- [ ] **Step 3: Verificar tipos**

```bash
npx tsc --noEmit 2>&1 | grep "AppointmentModal"
```

Expected: sem output.

- [ ] **Step 4: Commit**

```bash
git add resources/js/Pages/Agenda/components/AppointmentModal.tsx resources/js/utils/route.ts
git commit -m "feat(agenda): adiciona AppointmentModal com criação, edição, status e exclusão"
```

---

## Task 9: Montar Index.tsx com Toaster e substituir página atual

**Files:**
- Modify: `resources/js/Layouts/AppLayout.tsx` (adicionar Toaster)
- Substitute: `resources/js/Pages/Agenda/Index.tsx`

- [ ] **Step 1: Adicionar Toaster ao AppLayout**

Em `resources/js/Layouts/AppLayout.tsx`, adicionar import e tag:

```typescript
// Adicionar no topo dos imports
import { Toaster } from 'sonner';
```

Dentro do JSX retornado, antes do fechamento da `<div>` raiz:

```tsx
<Toaster position="top-right" richColors closeButton />
```

- [ ] **Step 2: Substituir Index.tsx**

```typescript
// resources/js/Pages/Agenda/Index.tsx
import { useCallback, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { AgendaCalendar } from './components/AgendaCalendar';
import { AgendaToolbar } from './components/AgendaToolbar';
import { AppointmentModal } from './components/AppointmentModal';
import { useAppointments } from './hooks/useAppointments';
import { useAgendaUI } from './hooks/useAgendaUI';
import { toResourceInput } from './utils/calendarMappers';
import type { AppointmentEvent, Professional, Service, Customer } from './types';

interface Props {
  events: AppointmentEvent[];
  professionals: Professional[];
  services: Service[];
  customers: Customer[];
  filters: Record<string, string>;
}

export default function AgendaIndex({ events, professionals, services, customers }: Props) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const {
    events: calendarEvents,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    changeStatus,
    moveAppointment,
    resizeAppointment,
  } = useAppointments({ initialEvents: events });

  const {
    currentView,
    setCurrentView,
    currentDate,
    setCurrentDate,
    visibleProfessionalIds,
    toggleProfessional,
    visibleProfessionals,
    modalOpen,
    modalMode,
    selectedEvent,
    selectedSlot,
    openCreateModal,
    openEditModal,
    closeModal,
  } = useAgendaUI({ professionals });

  const resources = useMemo(
    () => toResourceInput(visibleProfessionals),
    [visibleProfessionals]
  );

  const visibleEvents = useMemo(
    () => calendarEvents.filter((e) =>
      visibleProfessionalIds.includes(Number(e.resourceId))
    ),
    [calendarEvents, visibleProfessionalIds]
  );

  const handleNavigate = useCallback((direction: 'prev' | 'next' | 'today') => {
    // Atualiza currentDate baseado na direção e view atual
    const api = (window as any).__agendaCalendarApi;
    if (!api) return;
    if (direction === 'today') { api.today(); }
    else if (direction === 'prev') { api.prev(); }
    else { api.next(); }
    setCurrentDate(api.getDate());
  }, [setCurrentDate]);

  const handleMobileProfessionalSelect = useCallback((id: number) => {
    // No mobile: mostra só 1 profissional — reseta e seleciona apenas o escolhido
    professionals.forEach((p) => {
      if (visibleProfessionalIds.includes(p.id) && p.id !== id) toggleProfessional(p.id);
      if (!visibleProfessionalIds.includes(p.id) && p.id === id) toggleProfessional(p.id);
    });
  }, [professionals, visibleProfessionalIds, toggleProfessional]);

  const handleCreateClick = useCallback(() => {
    const slot = {
      start: new Date().toISOString(),
      end: new Date(Date.now() + 3600000).toISOString(),
      professionalId: visibleProfessionals[0]?.id ?? 0,
    };
    openCreateModal(slot);
  }, [visibleProfessionals, openCreateModal]);

  return (
    <AppLayout>
      <Head title="Agenda" />
      <div className="p-4">
        <AgendaToolbar
          currentView={currentView}
          currentDate={currentDate}
          professionals={professionals}
          visibleProfessionalIds={visibleProfessionalIds}
          onViewChange={setCurrentView}
          onNavigate={handleNavigate}
          onToggleProfessional={toggleProfessional}
          onCreateClick={handleCreateClick}
          isMobile={isMobile}
          onMobileProfessionalSelect={handleMobileProfessionalSelect}
        />

        <AgendaCalendar
          events={visibleEvents}
          resources={resources}
          currentView={currentView}
          currentDate={currentDate}
          onEventDrop={moveAppointment}
          onEventResize={resizeAppointment}
          onSelect={openCreateModal}
          onEventClick={openEditModal}
          onViewChange={setCurrentView}
          onDateChange={setCurrentDate}
        />

        <AppointmentModal
          open={modalOpen}
          mode={modalMode}
          event={selectedEvent}
          initialSlot={selectedSlot}
          professionals={visibleProfessionals}
          services={services}
          customers={customers}
          onSave={modalMode === 'create' ? createAppointment : (p) => updateAppointment(Number(selectedEvent!.id), p)}
          onDelete={deleteAppointment}
          onStatusChange={changeStatus}
          onClose={closeModal}
        />
      </div>
    </AppLayout>
  );
}
```

- [ ] **Step 3: Verificar build**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: sem erros em `Agenda/`.

- [ ] **Step 4: Abrir no browser e verificar renderização**

Acessar `http://127.0.0.1:8000/agenda`. Esperado:
- Toolbar com botões de navegação e view
- Calendário com colunas de profissionais
- Eventos do banco renderizados com cores por status

- [ ] **Step 5: Commit**

```bash
git add resources/js/Pages/Agenda/Index.tsx resources/js/Layouts/AppLayout.tsx
git commit -m "feat(agenda): substitui Index.tsx — FullCalendar com resourceTimeGrid, hooks e modal"
```

---

## Task 10: Corrigir navegação de datas na toolbar

**Files:**
- Modify: `resources/js/Pages/Agenda/components/AgendaCalendar.tsx`
- Modify: `resources/js/Pages/Agenda/Index.tsx`

O `handleNavigate` na Task 9 usa `window.__agendaCalendarApi` como workaround. A solução correta é expor o ref via callback.

- [ ] **Step 1: Expor calendarRef via prop em AgendaCalendar**

Em `AgendaCalendar.tsx`, adicionar prop `onReady` e chamar ao montar:

```typescript
// Adicionar na interface AgendaCalendarProps:
onReady?: (api: { prev: () => void; next: () => void; today: () => void; getDate: () => Date }) => void;
```

```typescript
// Adicionar useEffect dentro do componente:
useEffect(() => {
  const api = calendarRef.current?.getApi();
  if (api && onReady) {
    onReady({
      prev: () => { api.prev(); },
      next: () => { api.next(); },
      today: () => { api.today(); },
      getDate: () => api.getDate(),
    });
  }
}, []); // eslint-disable-line
```

- [ ] **Step 2: Atualizar Index.tsx para usar o api exposto**

```typescript
// Adicionar estado:
const [calendarApi, setCalendarApi] = useState<{
  prev: () => void; next: () => void; today: () => void; getDate: () => Date;
} | null>(null);

// Atualizar handleNavigate:
const handleNavigate = useCallback((direction: 'prev' | 'next' | 'today') => {
  if (!calendarApi) return;
  if (direction === 'today') calendarApi.today();
  else if (direction === 'prev') calendarApi.prev();
  else calendarApi.next();
  setCurrentDate(calendarApi.getDate());
}, [calendarApi, setCurrentDate]);

// Adicionar prop no AgendaCalendar:
// onReady={setCalendarApi}
```

- [ ] **Step 3: Verificar navegação no browser**

Clicar `<` `>` e `Hoje` na toolbar. Esperado: calendário navega corretamente.

- [ ] **Step 4: Commit**

```bash
git add resources/js/Pages/Agenda/components/AgendaCalendar.tsx resources/js/Pages/Agenda/Index.tsx
git commit -m "fix(agenda): corrige navegação de datas via calendarApi exposto pelo componente"
```

---

## Task 11: Testar drag-drop e undo

**Files:**
- Nenhum arquivo novo — validação funcional

- [ ] **Step 1: Verificar drag entre horários**

1. Abrir `http://127.0.0.1:8000/agenda`
2. Arrastar um agendamento `scheduled` ou `confirmed` para outro horário
3. Esperado: evento move na tela + toast "Agendamento movido [Desfazer]" por 6s
4. Verificar no banco: `php artisan tinker --execute="echo App\Models\Appointment::find(ID)->starts_at;"`

- [ ] **Step 2: Verificar undo**

1. Arrastar agendamento
2. Clicar "Desfazer" no toast antes de 6s
3. Esperado: evento volta para posição original no calendário
4. Verificar no banco que o `starts_at` voltou ao valor original

- [ ] **Step 3: Verificar drag bloqueado para status finalizado**

1. Tentar arrastar agendamento `completed` ou `canceled`
2. Esperado: drag não é permitido (cursor mostra "not-allowed" ou evento não se move)

- [ ] **Step 4: Verificar resize**

1. Arrastar a borda inferior de um evento `scheduled`
2. Esperado: `ends_at` atualiza + toast "Duração alterada [Desfazer]"

- [ ] **Step 5: Commit se ajustes foram necessários**

```bash
git add -p
git commit -m "fix(agenda): ajustes pós-testes de drag-drop e undo"
```

---

## Task 12: Responsividade mobile

**Files:**
- Modify: `resources/js/Pages/Agenda/Index.tsx`
- Modify: `resources/js/Pages/Agenda/hooks/useAgendaUI.ts`

- [ ] **Step 1: Usar `useState` + `useEffect` para isMobile em vez de valor estático**

Em `Index.tsx`, substituir:
```typescript
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
```

Por:
```typescript
const [isMobile, setIsMobile] = useState(
  typeof window !== 'undefined' ? window.innerWidth < 768 : false
);

useEffect(() => {
  const handler = () => setIsMobile(window.innerWidth < 768);
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, []);
```

- [ ] **Step 2: Testar em viewport mobile no browser**

No DevTools (F12), ativar modo mobile (iPhone SE ou similar). Esperado:
- View padrão: `listWeek`
- `ProfessionalFilter` renderiza como `<select>`
- Toolbar compacta e legível

- [ ] **Step 3: Commit**

```bash
git add resources/js/Pages/Agenda/Index.tsx
git commit -m "feat(agenda): responsividade mobile — listWeek default, select de profissional"
```

---

## Self-Review

### Cobertura do spec

| Requisito do spec | Task |
|---|---|
| FullCalendar instalado | Task 1 |
| `types.ts` com todas as interfaces | Task 1 |
| `calendarMappers.ts` com `toEventInput`, `toResourceInput` | Task 2 |
| `useAgendaUI` com modal, view, profissionais visíveis | Task 3 |
| `useAppointments` com CRUD, otimismo, undo 6s | Task 4 |
| `AgendaCalendar` com resourceTimeGrid, drag, resize, select | Task 5 |
| `ProfessionalFilter` com pills de cor | Task 6 |
| `AgendaToolbar` com nav, views, filtro | Task 6 |
| Endpoints JSON no backend | Task 7 |
| `AppointmentModal` com criar/editar/status/excluir | Task 8 |
| `<Toaster>` no AppLayout | Task 9 |
| `Index.tsx` refatorado em ~80 linhas | Task 9 |
| Navegação de datas via calendarApi | Task 10 |
| Drag bloqueado para status finalizado (`eventAllow`) | Task 5 |
| Criação bloqueada no passado | Task 8 |
| `resizeAppointment` separado de `moveAppointment` | Task 4 |
| Mobile: `listWeek` default, `<select>` de profissional | Task 12 |
| `React.memo` em AgendaCalendar | Task 5 |
| `useMemo` em recursos e eventos visíveis | Task 9 |
| Cor do resource via `color` (não `eventColor`) | Task 2 |
| `AgendaCalendarEvent extends EventInput` | Task 1 |
| Undo como operação compensatória independente | Task 4 |
