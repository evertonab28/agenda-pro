import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Deferred } from '@inertiajs/react';
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
import { BarChart } from './Components/BarChart';
import { TodayPanel } from './Components/TodayPanel';
import { AtRiskPanel } from './Components/AtRiskPanel';
import { Plus } from 'lucide-react';

export default function DashboardIndex({
  filters = {},
  dashboardData = {},
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

  return (
    <div className="space-y-4 pb-12">
      {/* Banners */}
      <BookingLinkBanner publicBookingUrl={publicBookingUrl} />
      <AtRiskBanner atRiskCount={atRiskCount} />
      <WhatsAppBanner whatsAppConnected={whatsAppConnected} />

      {/* Error messages */}
      {errors && Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-100 dark:border-red-900/50">
          {Object.values(errors).map((e: any, idx) => <p key={idx}>{e}</p>)}
        </div>
      )}

      {/* Daily Actions */}
      <Deferred data="daily_actions" fallback={<SkeletonBlock />}>
        <DailyActions actions={daily_actions} />
      </Deferred>

      {/* Page header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="font-display text-[22px] font-extrabold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{dateLabel}</p>
        </div>
        <button className="flex items-center gap-1.5 text-sm font-bold text-white bg-primary border-none rounded-xl px-4 py-2.5 cursor-pointer shadow-[0_4px_16px_color-mix(in_srgb,var(--primary)_25%,transparent)]">
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Novo agendamento
        </button>
      </div>

      {/* Filters */}
      <DashboardFilters
        filterState={filterState}
        setFilterState={setFilterState}
        exportUrl={exportUrl}
        canExport={can_export !== false}
      />

      {/* KPI Cards: 5 cols on xl, 3 on md, 2 on sm */}
      <Deferred data="dashboardData" fallback={
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-5">
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
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-[1fr_340px]">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          {/* Bar chart card */}
          <Deferred data="dashboardData" fallback={<div className="h-[320px] bg-muted/50 rounded-2xl animate-pulse" />}>
            <div className="bg-card border border-border rounded-2xl p-5 pb-3.5">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <div className="font-display font-bold text-sm text-foreground">
                    {chartMetric === 'revenue' ? 'Receita por dia' : 'Agendamentos por dia'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Últimos 7 dias</div>
                </div>
                <div className="flex gap-1.5">
                  {(['revenue', 'appointments'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setChartMetric(m)}
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-150"
                      style={{
                        border: `1px solid ${chartMetric === m ? 'var(--primary)' : 'var(--border)'}`,
                        background: chartMetric === m ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : 'transparent',
                        color: chartMetric === m ? 'var(--primary)' : 'var(--muted-foreground)',
                      }}
                    >
                      {m === 'revenue' ? 'Receita' : 'Agendamentos'}
                    </button>
                  ))}
                </div>
              </div>
              <BarChart data={dashboardData?.timeseries ?? []} metric={chartMetric} onBarClick={setSelectedDay} />
            </div>
          </Deferred>

          {/* Rankings Panel */}
          <Deferred data="dashboardData" fallback={<div className="h-[300px] bg-muted/50 rounded-2xl animate-pulse" />}>
            <RankingsPanel
              services={dashboardData?.ranking_services}
              customers={dashboardData?.ranking_customers}
            />
          </Deferred>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <TodayPanel appointments={today_appointments} />
          <AtRiskPanel customers={at_risk_customers} />
        </div>
      </div>

      {/* Pending charges below the grid */}
      <Deferred data="dashboardData" fallback={<SkeletonBlock />}>
        <PendingChargesTable
          data={dashboardData?.pending_charges}
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
