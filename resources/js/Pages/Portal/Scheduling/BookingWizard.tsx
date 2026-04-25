import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addDays, startOfToday } from 'date-fns';

import WizardProgress       from './WizardProgress';
import ServiceSelector      from './ServiceSelector';
import ProfessionalSelector from './ProfessionalSelector';
import DateSelector         from './DateSelector';
import TimeSlotGrid         from './TimeSlotGrid';
import BookingSummary       from './BookingSummary';
import ContactStep          from './ContactStep';
import BookingReview        from './BookingReview';
import BookingSuccess       from './BookingSuccess';

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
    onSelectService:      (s: Service)       => void;
    onSelectProfessional: (p: Professional)  => void;
    onSelectDate:         (d: Date)          => void;
    onSelectSlot:         (slot: string)     => void;
    onFormChange:         (data: BookingFormData) => void;
    onConfirm:            () => void;
    onNext:               () => void;
    onBack:               () => void;
    onGoToStep:           (step: number)     => void;
}

export default function BookingWizard({
    workspace, customer,
    step, services,
    selectedService, professionals, selectedProfessional,
    selectedDate, availableSlots, selectedSlot,
    loading, formData,
    onSelectService, onSelectProfessional, onSelectDate, onSelectSlot,
    onFormChange, onConfirm, onNext, onBack, onGoToStep,
}: Props) {

    // ── Step 6: success — full-width, no progress, no back ───────────────────
    if (step === 6) {
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
            {/* Progress bar — visible on steps 1–5 */}
            <WizardProgress step={step} />

            {/* ── Step 1: Service ──────────────────────────────────────────── */}
            {step === 1 && (
                <ServiceSelector
                    services={services}
                    selected={selectedService}
                    onSelect={(s) => { onSelectService(s); onNext(); }}
                    title="Qual serviço você precisa?"
                    description="Clique em um serviço para continuar."
                />
            )}

            {/* ── Step 2: Professional ─────────────────────────────────────── */}
            {step === 2 && (
                <StepLayout
                    back={<BackButton onClick={onBack} label="Alterar serviço" />}
                    sidebar={
                        <BookingSummary
                            service={selectedService}
                            professional={null}
                            date={null}
                            slot={null}
                        />
                    }
                    mobileSummary={null}
                >
                    <div className="space-y-6">
                        <StepHeading
                            title="Com quem você prefere?"
                            sub={selectedService?.name}
                        />

                        {professionals.length === 0 ? (
                            <div className="py-10 text-center text-slate-400 text-sm">
                                Carregando profissionais...
                            </div>
                        ) : (
                            <ProfessionalSelector
                                professionals={professionals}
                                selected={selectedProfessional}
                                onSelect={onSelectProfessional}
                            />
                        )}

                        <Button
                            className="w-full h-12 text-base font-semibold shadow-md shadow-indigo-100"
                            disabled={!selectedProfessional}
                            onClick={onNext}
                        >
                            Escolher data
                        </Button>
                    </div>
                </StepLayout>
            )}

            {/* ── Step 3: Date + Time (combined) ───────────────────────────── */}
            {step === 3 && (
                <StepLayout
                    back={<BackButton onClick={onBack} label="Alterar profissional" />}
                    sidebar={
                        <BookingSummary
                            service={selectedService}
                            professional={selectedProfessional}
                            date={selectedSlot ? selectedDate : null}
                            slot={selectedSlot}
                        />
                    }
                    mobileSummary={null}
                >
                    <div className="space-y-6">
                        <StepHeading
                            title="Escolha a data e o horário"
                            sub={selectedProfessional?.id === 0 ? 'Qualquer profissional' : `com ${selectedProfessional?.name}`}
                        />

                        {/* Date strip — selecting a date reloads slots inline */}
                        <DateSelector
                            days={DAYS}
                            selected={selectedDate}
                            onSelect={onSelectDate}
                        />

                        {/* Time slots load below, no page navigation needed */}
                        <TimeSlotGrid
                            slots={availableSlots}
                            selected={selectedSlot}
                            loading={loading}
                            noProfessionals={professionals.length === 0}
                            onSelect={onSelectSlot}
                        />

                        <Button
                            className="w-full h-12 text-base font-semibold shadow-md shadow-indigo-100"
                            disabled={!selectedSlot}
                            onClick={onNext}
                        >
                            Continuar
                        </Button>
                    </div>
                </StepLayout>
            )}

            {/* ── Step 4: Contact ──────────────────────────────────────────── */}
            {step === 4 && (
                <StepLayout
                    back={<BackButton onClick={onBack} label="Alterar data / horário" />}
                    sidebar={
                        <BookingSummary
                            service={selectedService}
                            professional={selectedProfessional}
                            date={selectedDate}
                            slot={selectedSlot}
                        />
                    }
                    mobileSummary={
                        <BookingSummary
                            service={selectedService}
                            professional={selectedProfessional}
                            date={selectedDate}
                            slot={selectedSlot}
                        />
                    }
                >
                    <div className="space-y-2">
                        <StepHeading
                            title="Seus dados"
                            sub="Para confirmar o agendamento"
                        />
                        <ContactStep
                            customer={customer}
                            formData={formData}
                            onChange={onFormChange}
                            onNext={onNext}
                        />
                    </div>
                </StepLayout>
            )}

            {/* ── Step 5: Review + Confirm ─────────────────────────────────── */}
            {step === 5 && (
                <div className="max-w-lg mx-auto">
                    <BackButton onClick={onBack} label="Editar dados" />
                    <BookingReview
                        service={selectedService}
                        professional={selectedProfessional}
                        date={selectedDate}
                        slot={selectedSlot}
                        formData={formData}
                        onEditStep={onGoToStep}
                        onConfirm={onConfirm}
                        loading={loading}
                    />
                </div>
            )}
        </div>
    );
}

// ── Internal layout helpers ───────────────────────────────────────────────────

interface StepLayoutProps {
    back: React.ReactNode;
    sidebar: React.ReactNode;
    /** Shown inline on mobile above the main content. Pass null to suppress. */
    mobileSummary: React.ReactNode;
    children: React.ReactNode;
}

function StepLayout({ back, sidebar, mobileSummary, children }: StepLayoutProps) {
    return (
        <>
            {back}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
                <div className="space-y-0">
                    {children}
                    {/* Mobile-only inline summary */}
                    {mobileSummary && (
                        <div className="lg:hidden mt-6">{mobileSummary}</div>
                    )}
                </div>
                {/* Desktop sticky sidebar */}
                <div className="hidden lg:block">
                    <div className="sticky top-24">{sidebar}</div>
                </div>
            </div>
        </>
    );
}

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

function StepHeading({ title, sub }: { title: string; sub?: string | null }) {
    return (
        <div className="mb-2">
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            {sub && <p className="text-sm text-slate-500 mt-0.5">{sub}</p>}
        </div>
    );
}
