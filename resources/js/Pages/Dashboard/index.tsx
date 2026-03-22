import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { DashboardProps, FiltersState } from './Components/types';
import { DashboardFilters } from './Components/DashboardFilters';
import { KpiCards } from './Components/KpiCards';
import { DailySeriesChart } from './Components/DailySeriesChart';
import { RankingsPanel } from './Components/RankingsPanel';
import { PendingChargesTable } from './Components/PendingChargesTable';
import { DayDetailsDrawer } from './Components/DayDetailsDrawer';

export default function DashboardIndex({ 
  filters, range, current, deltas, timeseries, 
  ranking_services, ranking_customers, pending_charges, can_export, errors
}: DashboardProps) {

  const [filterState, setFilterState] = useState<FiltersState>({
    from: filters.from || range.from.split(' ')[0],
    to: filters.to || range.to.split(' ')[0],
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

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
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

        <KpiCards cards={current.cards} deltas={deltas} />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-12">
          {/* Main Chart Area */}
          <DailySeriesChart 
            data={timeseries} 
            onBarClick={setSelectedDay} 
          />

          {/* Side by side rankings */}
          <RankingsPanel 
            services={ranking_services} 
            customers={ranking_customers} 
          />

          {/* Full width pending charges with internal pagination */}
          <PendingChargesTable 
            data={pending_charges} 
            filterState={filterState}
            setFilterState={setFilterState}
          />
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