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