import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Deferred, Link } from '@inertiajs/react';
import { FiltersState } from './Components/types';
import { DashboardFilters } from './Components/DashboardFilters';
import { KpiCards } from './Components/KpiCards';
import { RankingsPanel } from './Components/RankingsPanel';
import { PendingChargesTable } from './Components/PendingChargesTable';
import { DayDetailsDrawer } from './Components/DayDetailsDrawer';
import { DailyActions } from './Components/DailyActions';
import { BookingLinkBanner } from './Components/BookingLinkBanner';
import { AtRiskBanner } from './Components/AtRiskBanner';
import { WhatsAppBanner } from './Components/WhatsAppBanner';
import { BarChart } from '@/components/Shared/Charts/BarChart';
import { TodayPanel } from './Components/TodayPanel';
import { AtRiskPanel } from './Components/AtRiskPanel';
import { PageHeader } from '@/components/Shared/PageHeader';
import { SectionCard } from '@/components/Shared/SectionCard';
import { Plus } from 'lucide-react';

export default function DashboardIndex({
  filters = {},
  dashboardData,
  daily_actions = [],
  can_export = true,
  errors = {},
  publicBookingUrl = '',
  atRiskCount = 0,
  whatsAppConnected = false,
  today_appointments = [],
  at_risk_customers = [],
}: any) {

  const [filterState, setFilterState] = useState<FiltersState>({
    from: filters?.from || '',
    to: filters?.to || '',
    status: filters?.status || [],
    professional_id: filters?.professional_id || '',
    service_id: filters?.service_id || '',
    pending_page: filters?.pending_page || 1,
    pending_search: filters?.pending_search || '',
    pending_status: filters?.pending_status || 'all',
  });

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [chartMetric, setChartMetric] = useState<'revenue' | 'appointments'>('revenue');

  const searchParams = new URLSearchParams();
  if (filterState.from) searchParams.append('from', filterState.from);
  if (filterState.to) searchParams.append('to', filterState.to);
  if (filterState.professional_id) searchParams.append('professional_id', String(filterState.professional_id));
  if (filterState.service_id) searchParams.append('service_id', String(filterState.service_id));
  filterState.status.forEach(s => searchParams.append('status[]', s));
  const exportUrl = `/dashboard/export?${searchParams.toString()}`;

  const formattedDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const dateLabel = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const SkeletonBlock = () => (
    <div className="h-32 w-full bg-muted/50 animate-pulse rounded-2xl border border-border/50" />
  );

  const headerAction = (
    <Link
      href={route('agenda')}
      className="flex items-center gap-1.5 text-sm font-bold text-primary-foreground bg-primary border-none rounded-xl px-4 py-2.5 cursor-pointer shadow-[0_4px_16px_color-mix(in_srgb,var(--primary)_25%,transparent)] no-underline transition-transform active:scale-95"
    >
      <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Novo agendamento
    </Link>
  );

  return (
    <div className="space-y-4 pb-12 max-w-[1600px] mx-auto">
      {/* Banners */}
      <BookingLinkBanner publicBookingUrl={publicBookingUrl} />
      <AtRiskBanner atRiskCount={atRiskCount} />
      <WhatsAppBanner whatsAppConnected={whatsAppConnected} />

      {/* Error messages */}
      {errors && Object.keys(errors).length > 0 && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20 font-medium">
          {Object.values(errors).map((e: any, idx) => <p key={idx}>{e}</p>)}
        </div>
      )}

      {/* Daily Actions */}
      <Deferred data="daily_actions" fallback={<SkeletonBlock />}>
        <DailyActions actions={daily_actions} />
      </Deferred>

      {/* Page header */}
      <PageHeader
        title="Dashboard"
        subtitle={dateLabel}
        action={headerAction}
      />

      {/* Filters */}
      <DashboardFilters
        filterState={filterState}
        setFilterState={setFilterState}
        exportUrl={exportUrl}
        canExport={can_export !== false}
      />

      {/* KPI Cards */}
      <Deferred data="dashboardData" fallback={
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} />)}
        </div>
      }>
        <KpiCards
          cards={dashboardData?.current?.cards}
          deltas={dashboardData?.deltas}
          timeseries={dashboardData?.timeseries ?? []}
          atRiskCount={atRiskCount}
        />
      </Deferred>

      {/* Main two-column grid */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-[1fr_340px] items-start">
        {/* Left column: Chart + Rankings */}
        <div className="flex flex-col gap-4">
          <Deferred data="dashboardData" fallback={<div className="h-[320px] bg-muted/50 rounded-2xl animate-pulse" />}>
            <SectionCard
              title={chartMetric === 'revenue' ? 'Receita por dia' : 'Agendamentos por dia'}
              subtitle="Últimos 7 dias"
              headerAction={
                <div className="flex gap-1.5 p-1 bg-muted rounded-xl">
                  {(['revenue', 'appointments'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setChartMetric(m)}
                      className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200 border-none ${
                        chartMetric === m
                          ? 'bg-card text-primary shadow-sm'
                          : 'bg-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {m === 'revenue' ? 'Receita' : 'Agendamentos'}
                    </button>
                  ))}
                </div>
              }
            >
              <BarChart
                data={(dashboardData?.timeseries ?? []).map((d: any) => ({
                  ...d,
                  value: chartMetric === 'revenue' ? d.revenue : d.appointments
                }))}
                onBarClick={setSelectedDay}
                formatValue={v => chartMetric === 'revenue' ? `R$ ${v.toLocaleString('pt-BR')}` : String(v)}
              />
            </SectionCard>
          </Deferred>

          <Deferred data="dashboardData" fallback={<div className="h-[300px] bg-muted/50 rounded-2xl animate-pulse" />}>
            <RankingsPanel
              services={dashboardData?.ranking_services || []}
              customers={dashboardData?.ranking_customers || []}
            />
          </Deferred>
        </div>

        {/* Right column: Today + At Risk */}
        <div className="flex flex-col gap-4">
          <Deferred data="today_appointments" fallback={<SkeletonBlock />}>
            <TodayPanel appointments={today_appointments} />
          </Deferred>
          <Deferred data="at_risk_customers" fallback={<SkeletonBlock />}>
            <AtRiskPanel customers={at_risk_customers} />
          </Deferred>
        </div>
      </div>

      {/* Pending charges below the grid */}
      <Deferred data="dashboardData" fallback={<SkeletonBlock />}>
        <PendingChargesTable
          data={dashboardData?.pending_charges || { data: [], meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 } }}
          filterState={filterState}
          setFilterState={setFilterState}
        />
      </Deferred>

      {/* Day details drawer overlay */}
      <DayDetailsDrawer
        date={selectedDay}
        filters={filterState}
        onClose={() => setSelectedDay(null)}
      />
    </div>
  );
}

DashboardIndex.layout = (page: any) => <AppLayout children={page} />;
