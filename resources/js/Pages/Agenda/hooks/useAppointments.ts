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
