export interface Delta {
  absolute: number;
  percentage: number;
}

export interface Cards {
  appointments_total: number;
  appointments_confirmed: number;
  appointments_completed: number;
  appointments_no_show: number;
  confirmation_rate: number;
  no_show_rate: number;
  pending_amount: number;
  paid_amount: number;
  overdue_amount: number;
}

export interface FiltersState {
  from?: string;
  to?: string;
  status: string[];
  professional_id?: number | string;
  service_id?: number | string;
  pending_page?: number;
  pending_search?: string;
  pending_status?: string;
}

export interface TimeseriesItem {
  date: string;
  appointments: number;
  revenue: number;
}

export interface PendingCharge {
  id: number;
  customer_name: string;
  amount: number;
  status: string;
  due_date: string | null;
}

export interface PendingChargesData {
  data: PendingCharge[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface RankingService {
  service_id: number;
  service_name: string;
  total_appointments: number;
  total_revenue: number;
}

export interface RankingCustomer {
  customer_id: number;
  customer_name: string;
  total_appointments: number;
  total_spent: number;
}

export interface DashboardProps {
  filters: FiltersState;
  range: { from: string; to: string };
  previous_range: { from: string; to: string };
  current: { cards: Cards };
  previous: { cards: Cards };
  deltas: Record<keyof Cards, Delta>;
  timeseries: TimeseriesItem[];
  ranking_services: RankingService[];
  ranking_customers: RankingCustomer[];
  pending_charges: PendingChargesData;
}
