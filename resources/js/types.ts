export type DashboardOverview = {
range: { from: string; to: string }
cards: {
appointments_total: number
appointments_confirmed: number
appointments_completed: number
appointments_no_show: number
confirmation_rate: number
no_show_rate: number
pending_amount: number
paid_amount: number
overdue_amount: number
}
}

export interface Customer {
    id: number;
    name: string;
    phone: string;
    email?: string;
    document?: string;
    birth_date?: string;
    is_active: boolean;
    notes?: string;
}

export interface Charge {
    id: number;
    customer_id?: number;
    appointment_id?: number;
    description: string;
    amount: number;
    due_date: string;
    status: 'pending' | 'paid' | 'overdue' | 'partial' | 'canceled';
    paid_at?: string;
    payment_method?: string;
    notes?: string;
    customer?: Customer;
    receipts?: Receipt[];
    receipts_sum_amount_received?: number;
}

export interface Receipt {
    id: number;
    charge_id: number;
    amount_received: number;
    received_at: string;
    fee_amount?: number;
    net_amount: number;
    method: string;
    notes?: string;
}