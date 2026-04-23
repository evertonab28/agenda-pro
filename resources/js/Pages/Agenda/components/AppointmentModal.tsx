// resources/js/Pages/Agenda/components/AppointmentModal.tsx
import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { format, addMinutes } from 'date-fns';
import { CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import CustomerAutocomplete from '@/components/CustomerAutocomplete';
import type {
  AgendaCalendarEvent,
  AppointmentPayload,
  AppointmentStatus,
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
  const [pendingCriticalStatus, setPendingCriticalStatus] = useState<AppointmentStatus | null>(null);
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
      setPendingCriticalStatus(null);
      setError('');
    } else if (mode === 'edit' && event) {
      const getIso = (date: any) => {
        if (!date) return '';
        try {
          const d = new Date(date);
          if (isNaN(d.getTime())) {
            // Tenta limpar strings com formatos zoados (ex: remove offset)
            const cleanDate = String(date).split(/[+-]/)[0].replace(' ', 'T');
            const d2 = new Date(cleanDate);
            if (isNaN(d2.getTime())) return '';
            return format(d2, "yyyy-MM-dd'T'HH:mm");
          }
          return format(d, "yyyy-MM-dd'T'HH:mm");
        } catch (e) {
          return '';
        }
      };

      // FullCalendar EventApi uses getResources()
      const resId = (event as any).getResources?.()?.[0]?.id || event.resourceId;

      setCustomerId(String(ep?.customer?.id ?? ''));
      setServiceId(String(ep?.service?.id ?? ''));
      setProfessionalId(String(resId ?? ''));
      setStartsAt(getIso(event.start) || (event as any).startStr?.slice(0, 16) || '');
      setEndsAt(getIso(event.end) || (event as any).endStr?.slice(0, 16) || '');
      setNotes(ep?.notes ?? '');
      setCancelReason('');
      setPendingCriticalStatus(null);
      setError('');
    }
  }, [open, mode, event, initialSlot]);

  // Recalcula ends_at ao trocar serviço
  useEffect(() => {
    if (!startsAt || !serviceId) return;
    const svc = services.find((s) => String(s.id) === serviceId);
    if (!svc) return;
    try {
      const start = new Date(startsAt);
      if (isNaN(start.getTime())) return;
      const end = addMinutes(start, svc.duration_minutes);
      setEndsAt(format(end, "yyyy-MM-dd'T'HH:mm"));
    } catch (e) {
      console.error("Erro ao calcular término:", e);
    }
  }, [serviceId, startsAt, services]);

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
      setError(resolveApiError(e, 'Não foi possível salvar o agendamento. Verifique os dados e tente novamente.'));
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
      setError('Não foi possível excluir o agendamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  const handleStatusChange = async (status: AppointmentStatus) => {
    if (!event) return;
    
    if ((status === 'canceled' || status === 'no_show') && pendingCriticalStatus !== status) {
      setPendingCriticalStatus(status);
      setCancelReason('');
      return;
    }

    setLoading(true);

    const id = Number(event.id);
    if (isNaN(id)) {
      setError('ID de agendamento inválido.');
      setLoading(false);
      return;
    }

    try {
      await onStatusChange(id, status, cancelReason || undefined);
      onClose();
    } catch (e: any) {
      setError(resolveApiError(e, 'Não foi possível mudar o status. Tente novamente.'));
    } finally {
      setLoading(false);
    }
  };

  const currentStatus = ep?.status;
  const isEditable = currentStatus === 'scheduled' || currentStatus === 'confirmed';
  const simpleStatuses = (['scheduled', 'confirmed'] as AppointmentStatus[]).filter((s) => s !== currentStatus);
  const criticalStatuses = (['completed', 'no_show', 'canceled'] as AppointmentStatus[]).filter((s) => s !== currentStatus);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 flex flex-col max-h-[90vh] overflow-hidden">
        <DialogHeader className="p-6 border-b">
          <DialogTitle>
            {mode === 'create' ? 'Novo Agendamento' : 'Editar Agendamento'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
          )}

          {/* Cliente */}
          <div className="space-y-1">
            <Label>Cliente *</Label>
            <CustomerAutocomplete
              value={customerId}
              onChange={setCustomerId}
            />
          </div>

          {/* Serviço */}
          <div className="space-y-1">
            <Label>Serviço *</Label>
            <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              <option value="">Selecione...</option>
              {services.map((s) => (
                <option key={s.id} value={String(s.id)}>{s.name}</option>
              ))}
            </Select>
          </div>

          {/* Profissional */}
          <div className="space-y-1">
            <Label>Profissional *</Label>
            <Select value={professionalId} onChange={(e) => setProfessionalId(e.target.value)}>
              <option value="">Selecione...</option>
              {professionals.map((p) => (
                <option key={p.id} value={String(p.id)}>{p.name}</option>
              ))}
            </Select>
          </div>

          {/* Horários */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                {simpleStatuses.map((s) => (
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
              <div className="pt-2 space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Ações críticas
                </Label>
                <div className="flex flex-wrap gap-2">
                  {criticalStatuses.map((s) => (
                    <Button
                      key={s}
                      variant={s === 'canceled' ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(s)}
                      disabled={loading}
                    >
                      {STATUS_LABELS[s]}
                    </Button>
                  ))}
                </div>
              </div>
              {(pendingCriticalStatus === 'canceled' || pendingCriticalStatus === 'no_show') && (
                <div className="mt-4 space-y-3 rounded-xl border-2 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/40 p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-amber-900 dark:text-amber-200">
                      Confirmar {STATUS_LABELS[pendingCriticalStatus]}
                    </Label>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/50" 
                      onClick={() => setPendingCriticalStatus(null)}
                    >
                      <span className="sr-only">Cancelar</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </Button>
                  </div>
                  
                  {pendingCriticalStatus === 'no_show' && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                      O não comparecimento será registrado no histórico do cliente para consultas futuras. Nenhuma cobrança será gerada.
                    </p>
                  )}
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs text-amber-800 dark:text-amber-300">Motivo (opcional)</Label>
                    <Input
                      placeholder="Ex: cliente não avisou a ausência"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="bg-white dark:bg-black/20 border-amber-200 dark:border-amber-800 focus-visible:ring-amber-500"
                    />
                  </div>
                  
                  <Button 
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-200/50 dark:shadow-none" 
                    onClick={() => handleStatusChange(pendingCriticalStatus)} 
                    disabled={loading}
                  >
                    {loading ? 'Processando...' : `Confirmar ${STATUS_LABELS[pendingCriticalStatus]}`}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t bg-gray-50/50 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 w-full">
            {mode === 'edit' && (
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading} className="w-full">
                Excluir
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} disabled={loading} className="w-full border">
              Cancelar
            </Button>
          </div>
          
          <div className="flex flex-col gap-2 w-full">
            {(mode === 'create' || isEditable) && (
              <Button onClick={handleSave} disabled={loading} className="w-full h-10">
                {loading ? 'Processando...' : 'Salvar Alterações'}
              </Button>
            )}
            {mode === 'edit' && isEditable && event && (
              <Button
                variant="default"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 w-full h-10"
                onClick={() => {
                  router.patch(route('agenda.finalize', event.id));
                }}
                disabled={loading}
              >
                <CreditCard className="w-4 h-4" />
                Finalizar e Cobrar
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function resolveApiError(error: any, fallback: string): string {
  const data = error.response?.data;

  if (data?.message) return data.message;

  if (data?.errors) {
    const firstError = Object.values(data.errors).flat()[0];
    if (typeof firstError === 'string') return firstError;
  }

  return fallback;
}
