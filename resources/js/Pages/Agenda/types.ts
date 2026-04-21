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

export type ChargeStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'canceled';

export interface AppointmentCharge {
  id: number;
  status: ChargeStatus;
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

/**
 * Typed view of a FullCalendar event carrying appointment domain data.
 * Always read extendedProps from a variable typed as AgendaCalendarEvent,
 * NOT from FullCalendar runtime objects (EventImpl) — EventInput's index
 * signature returns `any` and silently bypasses the strong typing here.
 */
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
