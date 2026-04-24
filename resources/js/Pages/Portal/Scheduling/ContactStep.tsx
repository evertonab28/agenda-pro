import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { Customer, BookingFormData } from './types';

interface Props {
    customer?: Customer;
    formData: BookingFormData;
    onChange: (data: BookingFormData) => void;
    onSubmit: (e: React.FormEvent) => void;
    loading: boolean;
}

export default function ContactStep({ customer, formData, onChange, onSubmit, loading }: Props) {
    return (
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
            {/* Greeting for authenticated customer */}
            {customer && (
                <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-800">
                    <span aria-hidden>👋</span>
                    <span>
                        Olá, <strong>{customer.name}</strong>! Confirme seus dados para concluir.
                    </span>
                </div>
            )}

            {/* Name */}
            <div className="space-y-1.5">
                <Label htmlFor="booking-name">Nome completo</Label>
                <Input
                    id="booking-name"
                    required
                    autoComplete="name"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={(e) => onChange({ ...formData, name: e.target.value })}
                />
            </div>

            {/* Phone + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="booking-phone">
                        WhatsApp / Telefone
                    </Label>
                    <Input
                        id="booking-phone"
                        required
                        type="tel"
                        autoComplete="tel"
                        placeholder="(00) 00000-0000"
                        value={formData.phone}
                        onChange={(e) => onChange({ ...formData, phone: e.target.value })}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="booking-email">
                        E-mail{' '}
                        <span className="text-slate-400 font-normal text-xs">(opcional)</span>
                    </Label>
                    <Input
                        id="booking-email"
                        type="email"
                        autoComplete="email"
                        placeholder="email@exemplo.com"
                        value={formData.email}
                        onChange={(e) => onChange({ ...formData, email: e.target.value })}
                    />
                </div>
            </div>

            {/* Submit */}
            <Button
                type="submit"
                className="w-full h-12 text-base font-semibold shadow-md shadow-indigo-100"
                disabled={loading}
            >
                {loading ? 'Confirmando...' : 'Confirmar agendamento'}
            </Button>

            <p className="text-center text-xs text-slate-400 leading-relaxed">
                Ao confirmar, você concorda em receber comunicações sobre seu agendamento.
            </p>
        </form>
    );
}
