import React, { useState, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import { toast, Toaster } from 'sonner';
import { format, startOfToday } from 'date-fns';

import PublicHeader       from './Scheduling/PublicHeader';
import PublicHero         from './Scheduling/PublicHero';
import ServiceSelector    from './Scheduling/ServiceSelector';
import BookingWizard      from './Scheduling/BookingWizard';
import SocialProofSection from './Scheduling/SocialProofSection';
import LocationSection    from './Scheduling/LocationSection';

import { fullName } from './Scheduling/types';
import type { Workspace, Customer, Service, Professional, BookingFormData } from './Scheduling/types';

interface Props {
    workspace: Workspace;
    customer?: Customer;
}

// ── Step constants — single source of truth ───────────────────────────────────
// Changing STEP_* here is the only change needed if the wizard order ever shifts.
const STEP_SERVICE      = 1;
const STEP_PROFESSIONAL = 2;
const STEP_DATE_TIME    = 3; // Date + time selection combined in one view
const STEP_CONTACT      = 4;
const STEP_REVIEW       = 5;
const STEP_SUCCESS      = 6;

/** Split a full name string into [firstName, lastName] for form initialisation */
function splitName(fullNameStr: string): [string, string] {
    const parts = fullNameStr.trim().split(/\s+/);
    if (parts.length === 0) return ['', ''];
    const first = parts[0];
    const last  = parts.slice(1).join(' ');
    return [first, last];
}

export default function Schedule({ workspace, customer }: Props) {
    // ── UI mode ──────────────────────────────────────────────────────────────
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    // ── Wizard step ──────────────────────────────────────────────────────────
    const [step, setStep] = useState(STEP_SERVICE);

    // ── Data ─────────────────────────────────────────────────────────────────
    const [services,             setServices]             = useState<Service[]>([]);
    const [selectedService,      setSelectedService]      = useState<Service | null>(null);
    const [professionals,        setProfessionals]        = useState<Professional[]>([]);
    const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
    const [selectedDate,         setSelectedDate]         = useState<Date>(startOfToday());
    const [availableSlots,       setAvailableSlots]       = useState<string[]>([]);
    const [selectedSlot,         setSelectedSlot]         = useState<string | null>(null);
    const [loading,              setLoading]              = useState(false);

    const [firstName, lastName] = splitName(customer?.name ?? '');
    const [formData, setFormData] = useState<BookingFormData>({
        firstName,
        lastName,
        phone: customer?.phone || '',
        email: customer?.email || '',
    });

    // ── Load services on mount ───────────────────────────────────────────────
    // Loaded immediately so the profile view's service grid is populated without
    // waiting for the wizard to open.
    useEffect(() => {
        (window as any).axios
            .get(`/p/${workspace.slug}/scheduling/services`)
            .then((res: any) => setServices(res.data))
            .catch(() => toast.error('Erro ao carregar serviços. Tente novamente.'));
    }, [workspace.slug]);

    // ── Load professionals when entering Step 2 ──────────────────────────────
    useEffect(() => {
        if (!selectedService || step !== STEP_PROFESSIONAL) return;

        setSelectedProfessional(null);
        setSelectedSlot(null);
        setAvailableSlots([]);

        (window as any).axios
            .get(`/p/${workspace.slug}/scheduling/services/${selectedService.id}/professionals`)
            .then((res: any) => {
                setProfessionals(res.data);
                // Auto-select when only one professional — the user will still
                // click "Escolher data" to explicitly proceed.
                if (res.data.length === 1) setSelectedProfessional(res.data[0]);
            })
            .catch(() => toast.error('Erro ao carregar profissionais. Tente novamente.'));
    }, [selectedService, step, workspace.slug]);

    // ── Load availability when entering Step 4 ───────────────────────────────
    // Also re-runs if the user navigates back to step 3 (date) and changes
    // the date, then returns to step 4 — because `selectedDate` and `step`
    // both appear in the dependency array.
    const loadAvailability = useCallback(() => {
        if (!selectedProfessional || !selectedService) return;

        setLoading(true);
        setSelectedSlot(null);

        (window as any).axios
            .get(`/p/${workspace.slug}/scheduling/availability`, {
                params: {
                    professional_id: selectedProfessional.id,
                    service_id:      selectedService.id,
                    date:            format(selectedDate, 'yyyy-MM-dd'),
                },
            })
            .then((res: any) => setAvailableSlots(res.data))
            .catch(() => toast.error('Erro ao carregar horários. Tente novamente.'))
            .finally(() => setLoading(false));
    }, [selectedProfessional, selectedService, selectedDate, workspace.slug]);

    useEffect(() => {
        if (step === STEP_DATE_TIME && selectedProfessional && selectedService) {
            loadAvailability();
        }
    }, [step, selectedProfessional, selectedDate, selectedService]);

    // ── Open wizard ──────────────────────────────────────────────────────────
    // When called with a service (from profile service card), jump straight to
    // the Professional step — service is already decided.
    // When called without, start from step 1 (service selection).
    const openWizard = useCallback((service?: Service) => {
        setSelectedProfessional(null);
        setSelectedSlot(null);
        setAvailableSlots([]);
        setProfessionals([]);

        if (service) {
            setSelectedService(service);
            setStep(STEP_PROFESSIONAL);
        } else {
            setSelectedService(null);
            setStep(STEP_SERVICE);
        }

        setIsWizardOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // ── Close wizard / reset ─────────────────────────────────────────────────
    const closeWizard = useCallback(() => {
        setIsWizardOpen(false);
        setStep(STEP_SERVICE);
        setSelectedService(null);
        setSelectedProfessional(null);
        setSelectedSlot(null);
        setAvailableSlots([]);
        setProfessionals([]);
    }, []);

    // ── Booking submission (POST) ─────────────────────────────────────────────
    const handleConfirm = () => {
        setLoading(true);

        (window as any).axios
            .post(`/p/${workspace.slug}/scheduling/book`, {
                // Backend expects a single `name` field — composed from firstName + lastName
                name:            fullName(formData),
                email:           formData.email,
                phone:           formData.phone,
                service_id:      selectedService?.id,
                professional_id: selectedProfessional?.id,
                start_time:      `${format(selectedDate, 'yyyy-MM-dd')} ${selectedSlot}`,
            })
            .then((res: any) => {
                if (res.data.ok) setStep(STEP_SUCCESS);
            })
            .catch((err: any) => {
                if (err.response?.status === 409) {
                    toast.error(
                        'Esse horário acabou de ficar indisponível. Escolha outro horário.',
                    );
                    // Return user to date/time step and reload slots
                    setStep(STEP_DATE_TIME);
                    loadAvailability();
                    return;
                }
                toast.error(
                    err.response?.data?.message ||
                    'Não foi possível concluir o agendamento. Verifique os dados e tente novamente.',
                );
            })
            .finally(() => setLoading(false));
    };

    // ── Wizard navigation ────────────────────────────────────────────────────
    const handleNext    = () => setStep((s) => s + 1);
    const handleGoToStep = (target: number) => setStep(target);
    const handleBack    = () => {
        if (step <= STEP_SERVICE) {
            closeWizard();
        } else {
            setStep((s) => s - 1);
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Toaster position="top-center" richColors />
            <Head title={`Agendar – ${workspace.name}`} />

            {/* Sticky header — always visible */}
            <PublicHeader
                workspace={workspace}
                customer={customer}
                isWizardOpen={isWizardOpen}
                onCloseWizard={step < STEP_SUCCESS ? closeWizard : undefined}
            />

            {isWizardOpen ? (
                // ── Wizard mode ──────────────────────────────────────────────
                <main className="flex-1">
                    <BookingWizard
                        workspace={workspace}
                        customer={customer}
                        step={step}
                        services={services}
                        selectedService={selectedService}
                        professionals={professionals}
                        selectedProfessional={selectedProfessional}
                        selectedDate={selectedDate}
                        availableSlots={availableSlots}
                        selectedSlot={selectedSlot}
                        loading={loading}
                        formData={formData}
                        onSelectService={setSelectedService}
                        onSelectProfessional={setSelectedProfessional}
                        onSelectDate={setSelectedDate}
                        onSelectSlot={setSelectedSlot}
                        onFormChange={setFormData}
                        onConfirm={handleConfirm}
                        onNext={handleNext}
                        onBack={handleBack}
                        onGoToStep={handleGoToStep}
                    />
                </main>
            ) : (
                // ── Profile / landing mode ───────────────────────────────────
                <main className="flex-1">
                    <PublicHero workspace={workspace} onBookNow={() => openWizard()} />

                    <section className="bg-white border-t border-slate-100 py-14 px-4">
                        <div className="max-w-5xl mx-auto">
                            <div className="flex items-center justify-between mb-6 gap-4">
                                <h2 className="text-xl font-bold text-slate-800">Nossos serviços</h2>
                                <button
                                    onClick={() => openWizard()}
                                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                                >
                                    Ver todos →
                                </button>
                            </div>
                            {/* Clicking a service card opens wizard at Professional step */}
                            <ServiceSelector
                                services={services}
                                selected={null}
                                onSelect={(s) => openWizard(s)}
                            />
                        </div>
                    </section>

                    <SocialProofSection />
                    <LocationSection workspace={workspace} />
                </main>
            )}

            <footer className="py-8 text-center text-slate-400 text-xs border-t border-slate-100 bg-white">
                &copy; {new Date().getFullYear()} {workspace.name} &middot; Agendamento online por{' '}
                <span className="font-medium text-slate-500">AgendaNexo</span>
            </footer>
        </div>
    );
}
