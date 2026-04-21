// resources/js/Pages/Agenda/components/AgendaCalendar.tsx
import { useRef, useEffect, memo } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventDropArg, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
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
  onReady?: (api: { prev: () => void; next: () => void; today: () => void; getDate: () => Date; changeView: (view: string) => void }) => void;
}

const EDITABLE_STATUSES = new Set(['scheduled', 'confirmed']);

// Module-level constants — never recreated, prevents FullCalendar infinite update loop
const PLUGINS = [
  resourceTimeGridPlugin,
  resourceDayGridPlugin,
  dayGridPlugin,
  listPlugin,
  interactionPlugin,
];


const eventAllow = (_dropInfo: unknown, draggedEvent: { extendedProps?: { status?: string } } | null) => {
  const status = draggedEvent?.extendedProps?.status;
  return EDITABLE_STATUSES.has(status ?? '');
};

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
  onReady,
}: AgendaCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);

  // Expõe API imperativa ao pai sem re-montar o FullCalendar
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api && onReady) {
      onReady({
        prev: () => { api.prev(); },
        next: () => { api.next(); },
        today: () => { api.today(); },
        getDate: () => api.getDate(),
        changeView: (view: string) => { api.changeView(view); },
      });
    }
  }, []); // eslint-disable-line

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
      schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
      plugins={PLUGINS}
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
      eventAllow={eventAllow}
      eventDrop={handleEventDrop}
      eventResize={handleEventResize}
      select={handleSelect}
      eventClick={handleEventClick}
      datesSet={handleDatesSet}
    />
  );
}

export const AgendaCalendar = memo(AgendaCalendarInner);
