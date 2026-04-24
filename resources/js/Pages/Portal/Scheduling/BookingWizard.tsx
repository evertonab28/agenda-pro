import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addDays, startOfToday } from 'date-fns';

import WizardProgress      from './WizardProgress';
import ServiceSelector     from './ServiceSelector';
import ProfessionalSelector from './ProfessionalSelector';
import DateSelector        from './DateSelector';
import TimeSlotGrid        from './TimeSlotGrid';
import BookingSummary      from './BookingSummary';
import BookingReview       from './BookingReview';
import ContactStep         from './ContactStep';
import BookingSuccess      from './BookingSuccess';

import type { Workspace, Customer, Service, Professional, BookingFormData } from './types';

// Pre-compute once — same 14-day window used everywhere
const DAYS = Array.from({ length: 14 }, (_, i) => addDays(startOfToday(), i));

interface Props {
    workspace: Workspace;
    customer?: Customer;

    // Wizard state
    step: number;
    services: Service[];
    selectedService: Service | null;
    professionals: Professional[];
    selectedProfessional: Professional | null;
    selectedDate: Date;
    availableSlots: string[];
    selectedSlot: string | null;
    loading: boolean;
    formData: BookingFormData;

    // Handlers
    onSelectService: (s: Service) => void;
    onSelectProfessional: (p: Professional) => void;
    onSelectDate: (d: Date) => void;
    onSelectSlot: (slot: string) => void;
    onFormChange: (data: BookingFormData) => void;
    onSubmit: (e: React.FormEvent) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function BookingWizard({
    workspace, customer,
    step, services,
    selectedService, professionals, selectedProfessional,
    selectedDate, availableSlots, selectedSlot,
    loading, formData,
    onSelectService, onSelectProfessional, onSelectDate, onSelectSlot,
    onFormChange, onSubmit, onNext, onBack,
}: Props) {

    // ── Step 4: success (full-width, no sidebar, no progress bar) ──────────
    if (step === 4) {
        return (
            <div className="max-w-5xl mx-auto px-4">
                <BookingSuccess
                    workspace={workspace}
                    service={selectedService}
                    professional={selectedProfessional}
                    date={selectedDate}
                    slot={selectedSlot}
                    customer={customer}
                    formData={formData}
                />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Step indicator */}
            <WizardProgress step={step} />

            {/* ── Step 1: Service selection ─────────────────────────────────── */}
            {step === 1 && (
                <ServiceSelector
                    services={services}
                    selected={selectedService}
                    onSelect={(s) => { onSelectService(s); onNext(); }}
                    title="Qual serviço você precisa?"
                    description="Clique em um serviço para ver os horários disponíveis."
                />
            )}

            {/* ── Step 2: Professional + Date + Time ───────────────────────── */}
            {step === 2 && (
                <>
                    <BackButton onClick={onBack} label="Alterar serviço" />

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
                        {/* Main content */}
                        <div className="space-y-7">
                            <ProfessionalSelector
                                professionals={professionals}
                                selected={selectedProfessional}
                                onSelect={onSelectProfessional}
                            />

                            <DateSelector
                                days={DAYS}
                                selected={selectedDate}
                                onSelect={onSelectDate}
                            />

                            <TimeSlotGrid
                                slots={availableSlots}
                                selected={selectedSlot}
                                loading={loading}
                                noProfessionals={professionals.length === 0}
                                onSelect={onSelectSlot}
                            />

                            {/* Inline summary on mobile (hidden on desktop) */}
                            <div className="lg:hidden">
                                <BookingSummary
                                    service={selectedService}
                                    professional={selectedProfessional}
                                    date={selectedDate}
                                    slot={selectedSlot}
                                />
                            </div>

                            <Button
                                className="w-full h-12 text-base font-semibold shadow-md shadow-indigo-100"
                                disabled={!selectedSlot || professionals.length === 0}
                                onClick={onNext}
                            >
                                Continuar para dados
                            </Button>
                        </div>

                        {/* Sticky sidebar (desktop only) */}
                        <SidebarSummary
                            service={selectedService}
                            professional={selectedProfessional}
                            date={selectedDate}
                            slot={selectedSlot}
                        />
                    </div>
                </>
            )}

            {/* ── Step 3: Contact form + review ────────────────────────────── */}
            {step === 3 && (
                <>
                    <BackButton onClick={onBack} label="Alterar horário" />

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
                        {/* Main content */}
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 mb-1">Seus dados</h2>
                                <p className="text-sm text-slate-500">
                                    {customer
                                        ? `Olá ${customer.name}, confirme para concluir.`
                                        : 'Preencha seus dados para concluir o agendamento.'}
                                </p>
                            </div>

                            {/* Inline booking review (compact) */}
                            <BookingReview
                                service={selectedService}
                                professional={selectedProfessional}
                                date={selectedDate}
                                slot={selectedSlot}
                                onEdit={onBack}
                            />

                            <ContactStep
                                customer={customer}
                                formData={formData}
                                onChange={onFormChange}
                                onSubmit={onSubmit}
                                loading={loading}
                            />
                        </div>

                        {/* Sticky sidebar (desktop only) */}
                        <SidebarSummary
                            service={selectedService}
                            professional={selectedProfessional}
                            date={selectedDate}
                            slot={selectedSlot}
                        />
                    </div>
                </>
            )}
        </div>
    );
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-7"
        >
            <ChevronLeft size={16} />
            {label}
        </button>
    );
}

function SidebarSummary(props: React.ComponentProps<typeof BookingSummary>) {
    return (
        <div className="hidden lg:block">
            <div className="sticky top-24">
                <BookingSummary {...props} />
            </div>
        </div>
    );
}
