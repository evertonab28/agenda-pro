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
    eventColor: PROFESSIONAL_COLORS[index % PROFESSIONAL_COLORS.length],
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
  if (index === -1) return PROFESSIONAL_COLORS[0];
  return PROFESSIONAL_COLORS[index % PROFESSIONAL_COLORS.length];
}
