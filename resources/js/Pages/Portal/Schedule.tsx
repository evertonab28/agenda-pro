import React, { useState, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import { toast, Toaster } from 'sonner';
import { format, startOfToday } from 'date-fns';

import PublicHeader      from './Scheduling/PublicHeader';
import PublicHero        from './Scheduling/PublicHero';
import ServiceSelector   from './Scheduling/ServiceSelector';
import BookingWizard     from './Scheduling/BookingWizard';
import SocialProofSection from './Scheduling/SocialProofSection';
import LocationSection   from './Scheduling/LocationSection';

import type { Workspace, Customer, Service, Professional, BookingFormData } from './Scheduling/types';

interface Props {
    workspace: Workspace;
    customer?: Customer;
}

export default function Schedule({ workspace, customer }: Props) {
    // ── UI mode ──────────────────────────────────────────────────────────────
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    // ── Wizard step ──────────────────────────────────────────────────────────
    const [step, setStep] = useState(1);

    // ── Data ─────────────────────────────────────────────────────────────────
    const [services,            setServices]            = useState<Service[]>([]);
    const [selectedService,     setSelectedService]     = useState<Service | null>(null);
    const [professionals,       setProfessionals]       = useState<Professional[]>([]);
    const [selectedProfessional,setSelectedProfessional]= useState<Professional | null>(null);
    const [selectedDate,        setSelectedDate]        = useState<Date>(startOfToday());
    const [availableSlots,      setAvailableSlots]      = useState<string[]>([]);
    const [selectedSlot,        setSelectedSlot]        = useState<string | null>(null);
    const [loading,             setLoading]             = useState(false);

    const [formData, setFormData] = useState<BookingFormData>({
        name:  customer?.name  || '',
        email: customer?.email || '',
        phone: customer?.phone || '',
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

    // ── Load professionals when service selected at step 2 ───────────────────
    useEffect(() => {
        if (!selectedService || step !== 2) return;

        setSelectedProfessional(null);
        setSelectedSlot(null);
        setAvailableSlots([]);

        (window as any).axios
            .get(`/p/${workspace.slug}/scheduling/services/${selectedService.id}/professionals`)
            .then((res: any) => {
                setProfessionals(res.data);
                if (res.data.length > 0) setSelectedProfessional(res.data[0]);
            })
            .catch(() => toast.error('Erro ao carregar profissionais. Tente novamente.'));
    }, [selectedService, step, workspace.slug]);

    // ── Load availability when professional, date or service changes at step 2
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
        if (selectedProfessional && selectedDate && step === 2) {
            loadAvailability();
        }
    }, [selectedProfessional, selectedDate, selectedService, step]);

    // ── Open wizard ──────────────────────────────────────────────────────────
    // When called with a service, jump straight to step 2 (date/time selection).
    // When called without, open at step 1 (service selection).
    const openWizard = useCallback((service?: Service) => {
        setSelectedProfessional(null);
        setSelectedSlot(null);
        setAvailableSlots([]);
        setProfessionals([]);

        if (service) {
            setSelectedService(service);
            setStep(2);
        } else {
            setSelectedService(null);
            setStep(1);
        }

        setIsWizardOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // ── Close wizard / reset ─────────────────────────────────────────────────
    const closeWizard = useCallback(() => {
        setIsWizardOpen(false);
        setStep(1);
        setSelectedService(null);
        setSelectedProfessional(null);
        setSelectedSlot(null);
        setAvailableSlots([]);
        setProfessionals([]);
    }, []);

    // ── Booking submission ───────────────────────────────────────────────────
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        (window as any).axios
            .post(`/p/${workspace.slug}/scheduling/book`, {
                ...formData,
                service_id:      selectedService?.id,
                professional_id: selectedProfessional?.id,
                start_time:      `${format(selectedDate, 'yyyy-MM-dd')} ${selectedSlot}`,
            })
            .then((res: any) => {
                if (res.data.ok) setStep(4);
            })
            .catch((err: any) => {
                if (err.response?.status === 409) {
                    toast.error(
                        'Esse horário acabou de ficar indisponível. Atualizamos a lista para você escolher outro.',
                    );
                    // Go back to time selection and refresh slots
                    setStep(2);
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
    const handleNext = () => setStep((s) => s + 1);
    const handleBack = () => {
        if (step <= 1) {
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
                onCloseWizard={step < 4 ? closeWizard : undefined}
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
                        onSubmit={handleSubmit}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                </main>
            ) : (
                // ── Profile / landing mode ───────────────────────────────────
                <main className="flex-1">
                    {/* Hero */}
                    <PublicHero workspace={workspace} onBookNow={() => openWizard()} />

                    {/* Services preview — clicking a card opens the wizard at step 2 */}
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
