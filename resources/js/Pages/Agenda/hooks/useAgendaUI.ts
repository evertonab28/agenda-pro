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
