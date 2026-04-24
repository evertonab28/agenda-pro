import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { Customer, BookingFormData } from './types';

interface Props {
    customer?: Customer;
    formData: BookingFormData;
    onChange: (data: BookingFormData) => void;
    /** Called when the user confirms their data and wants to proceed to Review */
    onNext: () => void;
}

/** Returns true if minimum required fields are filled */
function isValid(data: BookingFormData): boolean {
    return data.firstName.trim().length > 0 && data.phone.trim().length >= 8;
}

export default function ContactStep({ customer, formData, onChange, onNext }: Props) {
    return (
        <div className="space-y-6">
            {/* Greeting for authenticated customer */}
            {customer && (
                <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-800">
                    <span aria-hidden>👋</span>
                    <span>
                        Olá, <strong>{customer.name}</strong>! Confirme seus dados para concluir.
                    </span>
                </div>
            )}

            {/* WhatsApp — first and prominent: most important identifier */}
            <div className="space-y-1.5">
                <Label htmlFor="booking-phone">
                    WhatsApp / Telefone
                </Label>
                <Input
                    id="booking-phone"
                    required
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={(e) => onChange({ ...formData, phone: e.target.value })}
                />
                <p className="text-xs text-slate-400">
                    Usado para confirmação e lembretes do seu agendamento.
                </p>
            </div>

            {/* Name row: first + last */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="booking-first-name">Nome</Label>
                    <Input
                        id="booking-first-name"
                        required
                        autoComplete="given-name"
                        placeholder="João"
                        value={formData.firstName}
                        onChange={(e) => onChange({ ...formData, firstName: e.target.value })}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="booking-last-name">
                        Sobrenome{' '}
                        <span className="text-slate-400 font-normal text-xs">(opcional)</span>
                    </Label>
                    <Input
                        id="booking-last-name"
                        autoComplete="family-name"
                        placeholder="Silva"
                        value={formData.lastName}
                        onChange={(e) => onChange({ ...formData, lastName: e.target.value })}
                    />
                </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
                <Label htmlFor="booking-email">
                    E-mail{' '}
                    <span className="text-slate-400 font-normal text-xs">(opcional)</span>
                </Label>
                <Input
                    id="booking-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={(e) => onChange({ ...formData, email: e.target.value })}
                />
            </div>

            {/* Continue */}
            <Button
                type="button"
                className="w-full h-12 text-base font-semibold shadow-md shadow-indigo-100"
                disabled={!isValid(formData)}
                onClick={onNext}
            >
                Revisar agendamento
            </Button>
        </div>
    );
}
