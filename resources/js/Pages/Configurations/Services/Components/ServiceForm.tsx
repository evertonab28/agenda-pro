import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { route } from '@/utils/route';

interface Service {
    id?: number;
    name: string;
    duration_minutes: number;
    buffer_minutes: number;
    price: string | number;
    color: string | null;
    is_active: boolean;
    is_addon: boolean;
    description: string | null;
}

interface Props {
    service?: Service;
    onSubmitSuccess?: () => void;
}

export default function ServiceForm({ service, onSubmitSuccess }: Props) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: service?.name || '',
        duration_minutes: service?.duration_minutes || 30,
        buffer_minutes: (service as any)?.buffer_minutes || 0,
        price: service?.price || '',
        color: service?.color || '#3b82f6',
        is_active: service?.is_active ?? true,
        is_addon: (service as any)?.is_addon ?? false,
        description: service?.description || '',
    });

    useEffect(() => {
        setData({
            name: service?.name || '',
            duration_minutes: service?.duration_minutes || 30,
            buffer_minutes: service?.buffer_minutes || 0,
            price: service?.price || '',
            color: service?.color || '#3b82f6',
            is_active: service?.is_active ?? true,
            is_addon: (service as any)?.is_addon ?? false,
            description: service?.description || '',
        });
    }, [service, setData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const options = {
            onSuccess: () => onSubmitSuccess?.(),
        };

        if (service?.id) {
            put(route('configuracoes.services.update', service.id), options);
        } else {
            post(route('configuracoes.services.store'), options);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="name">Nome do Serviço</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="Ex: Corte de Cabelo"
                        required
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="duration_minutes">Duração (minutos)</Label>
                    <Input
                        id="duration_minutes"
                        type="number"
                        min="1"
                        value={data.duration_minutes}
                        onChange={(e) => setData('duration_minutes', parseInt(e.target.value))}
                        required
                    />
                    {errors.duration_minutes && <p className="text-sm text-red-500">{errors.duration_minutes}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="price">Preço (R$)</Label>
                    <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.price}
                        onChange={(e) => setData('price', e.target.value)}
                        placeholder="0.00"
                        required
                    />
                    {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="buffer_minutes">Intervalo Entre Atendimentos (Buffer - min)</Label>
                    <Input
                        id="buffer_minutes"
                        type="number"
                        min="0"
                        value={data.buffer_minutes}
                        onChange={(e) => setData('buffer_minutes', parseInt(e.target.value))}
                        placeholder="0"
                    />
                    {errors.buffer_minutes && <p className="text-sm text-red-500">{errors.buffer_minutes}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="color">Cor no Calendário</Label>
                    <div className="flex gap-3 items-center">
                        <Input
                            id="color"
                            type="color"
                            className="w-12 h-10 p-1 cursor-pointer"
                            value={data.color || '#3b82f6'}
                            onChange={(e) => setData('color', e.target.value)}
                        />
                        <span className="text-sm font-mono text-gray-500 uppercase">
                            {data.color || '#3b82f6'}
                        </span>
                    </div>
                    {errors.color && <p className="text-sm text-red-500">{errors.color}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Textarea
                    id="description"
                    value={data.description || ''}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="Descreva detalhes sobre o serviço..."
                    rows={3}
                />
                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
            </div>

            <div className="flex items-center space-x-2">
                <input
                    id="is_active"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    checked={data.is_active}
                    onChange={(e) => setData('is_active', e.target.checked)}
                />
                <Label htmlFor="is_active" className="text-sm font-medium leading-none cursor-pointer">
                    Serviço Ativo
                </Label>
            </div>

            <div className="flex items-center space-x-2">
                <input
                    id="is_addon"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    checked={data.is_addon}
                    onChange={(e) => setData('is_addon', e.target.checked)}
                />
                <Label htmlFor="is_addon" className="text-sm font-medium leading-none cursor-pointer">
                    Serviço Adicional (Add-on)
                </Label>
                <p className="text-[10px] text-slate-400 ml-1">(Opcional no fluxo de agendamento)</p>
            </div>

            <div className="flex justify-end pt-4 gap-3">
                <Button 
                    type="submit" 
                    disabled={processing}
                    className="w-full md:w-auto px-10 h-10 rounded-xl"
                >
                    {processing ? 'Salvando...' : (service?.id ? 'Atualizar Serviço' : 'Criar Serviço')}
                </Button>
            </div>
        </form>
    );
}
