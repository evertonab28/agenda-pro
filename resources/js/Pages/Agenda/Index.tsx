// resources/js/Pages/Agenda/Index.tsx
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { AgendaCalendar } from './components/AgendaCalendar';
import { AgendaToolbar } from './components/AgendaToolbar';
import { AppointmentModal } from './components/AppointmentModal';
import { useAppointments } from './hooks/useAppointments';
import { useAgendaUI } from './hooks/useAgendaUI';
import { toResourceInput } from './utils/calendarMappers';
import type { AppointmentEvent, Professional, Service } from './types';

interface Props {
  events: AppointmentEvent[];
  professionals: Professional[];
  services: Service[];
  customers: unknown[]; // passed by controller, not used (CustomerAutocomplete fetches its own)
  filters: Record<string, string>;
}

export default function AgendaIndex({ events, professionals, services }: Props) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const [calendarApi, setCalendarApi] = useState<{
    prev: () => void;
    next: () => void;
    today: () => void;
    getDate: () => Date;
    changeView: (view: string) => void;
  } | null>(null);

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
    () => calendarEvents.filter((e) => visibleProfessionalIds.includes(Number(e.resourceId))),
    [calendarEvents, visibleProfessionalIds]
  );

  const handleNavigate = useCallback(
    (direction: 'prev' | 'next' | 'today') => {
      if (!calendarApi) return;
      if (direction === 'today') calendarApi.today();
      else if (direction === 'prev') calendarApi.prev();
      else calendarApi.next();
      setCurrentDate(calendarApi.getDate());
    },
    [calendarApi, setCurrentDate]
  );

  const handleMobileProfessionalSelect = useCallback(
    (id: number) => {
      professionals.forEach((p) => {
        const isVisible = visibleProfessionalIds.includes(p.id);
        if (isVisible && p.id !== id) toggleProfessional(p.id);
        if (!isVisible && p.id === id) toggleProfessional(p.id);
      });
    },
    [professionals, visibleProfessionalIds, toggleProfessional]
  );

  const handleCreateClick = useCallback(() => {
    openCreateModal({
      start: new Date().toISOString(),
      end: new Date(Date.now() + 3600000).toISOString(),
      professionalId: visibleProfessionals[0]?.id ?? 0,
    });
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
          onViewChange={(v) => { calendarApi?.changeView(v); setCurrentView(v); }}
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
          onReady={setCalendarApi}
        />

        <AppointmentModal
          open={modalOpen}
          mode={modalMode}
          event={selectedEvent}
          initialSlot={selectedSlot}
          professionals={visibleProfessionals}
          services={services}
          onSave={
            modalMode === 'create'
              ? createAppointment
              : (p) => updateAppointment(Number(selectedEvent!.id), p)
          }
          onDelete={deleteAppointment}
          onStatusChange={changeStatus}
          onClose={closeModal}
        />
      </div>
    </AppLayout>
  );
}
