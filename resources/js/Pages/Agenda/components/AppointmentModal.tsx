// resources/js/Pages/Agenda/components/AppointmentModal.tsx
import { useState, useEffect } from 'react';
import { format, addMinutes } from 'date-fns';
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
      setCustomerId(String(ep?.customer?.id ?? ''));
      setServiceId(String(ep?.service?.id ?? ''));
      setProfessionalId(String(event.resourceId ?? ''));
      setStartsAt((event.start as string)?.slice(0, 16) ?? '');
      setEndsAt((event.end as string)?.slice(0, 16) ?? '');
      setNotes(ep?.notes ?? '');
      setCancelReason('');
      setPendingCriticalStatus(null);
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
    setLoading(true);
    if ((status === 'canceled' || status === 'no_show') && pendingCriticalStatus !== status) {
      setPendingCriticalStatus(status);
      setCancelReason('');
      return;
    }

    try {
      await onStatusChange(Number(event.id), status, cancelReason || undefined);
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
                <div className="space-y-2 rounded-md border bg-amber-50 p-3">
                  <Label>Motivo para {STATUS_LABELS[pendingCriticalStatus].toLowerCase()} (opcional)</Label>
                  <Input
                    placeholder="Ex: cliente solicitou cancelamento"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                  <Button size="sm" onClick={() => handleStatusChange(pendingCriticalStatus)} disabled={loading}>
                    Confirmar {STATUS_LABELS[pendingCriticalStatus]}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {mode === 'edit' && (
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
              Excluir
            </Button>
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

function resolveApiError(error: any, fallback: string): string {
  const data = error.response?.data;

  if (data?.message) return data.message;

  if (data?.errors) {
    const firstError = Object.values(data.errors).flat()[0];
    if (typeof firstError === 'string') return firstError;
  }

  return fallback;
}
