import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Deferred } from '@inertiajs/react';
import { DashboardProps, FiltersState } from './Components/types';
import { DashboardFilters } from './Components/DashboardFilters';
import { KpiCards } from './Components/KpiCards';
import { DailySeriesChart } from './Components/DailySeriesChart';
import { RankingsPanel } from './Components/RankingsPanel';
import { PendingChargesTable } from './Components/PendingChargesTable';
import { DayDetailsDrawer } from './Components/DayDetailsDrawer';
import { DailyActions } from './Components/DailyActions';
import { BookingLinkBanner } from './Components/BookingLinkBanner';
import { AtRiskBanner } from './Components/AtRiskBanner';
import { WhatsAppBanner } from './Components/WhatsAppBanner';
import { Skeleton } from '@/Components/ui/skeleton';

export default function DashboardIndex({
  filters, dashboardData, daily_actions, can_export, errors, publicBookingUrl, atRiskCount, whatsAppConnected
}: any) {

  const [filterState, setFilterState] = useState<FiltersState>({
    from: filters.from || '',
    to: filters.to || '',
    status: filters.status || [],
    professional_id: filters.professional_id || '',
    service_id: filters.service_id || '',
    pending_page: filters.pending_page || 1,
    pending_search: filters.pending_search || '',
    pending_status: filters.pending_status || 'all',
  });

  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const searchParams = new URLSearchParams();
  if (filterState.from) searchParams.append('from', filterState.from);
  if (filterState.to) searchParams.append('to', filterState.to);
  if (filterState.professional_id) searchParams.append('professional_id', String(filterState.professional_id));
  if (filterState.service_id) searchParams.append('service_id', String(filterState.service_id));
  filterState.status.forEach(s => searchParams.append('status[]', s));
  const exportUrl = `/dashboard/export?${searchParams.toString()}`;

  const SkeletonBlock = () => (
    <div className="h-32 w-full bg-muted/50 animate-pulse rounded-2xl border border-border/50" />
  );

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        <BookingLinkBanner publicBookingUrl={publicBookingUrl} />
        <AtRiskBanner atRiskCount={atRiskCount} />
        <WhatsAppBanner whatsAppConnected={whatsAppConnected} />

        {errors && Object.keys(errors).length > 0 && (
           <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-100 dark:border-red-900/50">
             {Object.values(errors).map((e: any, idx) => <p key={idx}>{e}</p>)}
           </div>
        )}

        <DashboardFilters 
          filterState={filterState} 
          setFilterState={setFilterState} 
          exportUrl={exportUrl} 
          canExport={can_export !== false}
        />

        <Deferred data="daily_actions" fallback={<SkeletonBlock />}>
          <DailyActions actions={daily_actions} />
        </Deferred>

        <Deferred data="dashboardData" fallback={<div className="grid grid-cols-1 md:grid-cols-4 gap-4"><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /></div>}>
          <KpiCards cards={dashboardData?.current?.cards} deltas={dashboardData?.deltas} />
        </Deferred>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <Deferred data="dashboardData" fallback={<div className="h-[400px] bg-muted/50 rounded-2xl animate-pulse" />}>
              <DailySeriesChart 
                data={dashboardData?.timeseries} 
                onBarClick={setSelectedDay} 
              />
            </Deferred>
          </div>

          <div className="xl:col-span-4">
            <Deferred data="dashboardData" fallback={<div className="h-[400px] bg-muted/50 rounded-2xl animate-pulse" />}>
              <RankingsPanel 
                services={dashboardData?.ranking_services} 
                customers={dashboardData?.ranking_customers} 
              />
            </Deferred>
          </div>

          <div className="xl:col-span-12">
            <Deferred data="dashboardData" fallback={<SkeletonBlock />}>
              <PendingChargesTable 
                data={dashboardData?.pending_charges} 
                filterState={filterState}
                setFilterState={setFilterState}
              />
            </Deferred>
          </div>
        </div>

        <DayDetailsDrawer 
          date={selectedDay} 
          filters={filterState} 
          onClose={() => setSelectedDay(null)} 
        />
      </div>
    </AppLayout>
  );
}