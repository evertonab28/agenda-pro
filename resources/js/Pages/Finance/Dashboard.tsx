import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import {
    Plus,
    TrendingDown,
    Calendar,
    AlertCircle,
    Activity,
    ExternalLink,
    DollarSign,
    Banknote,
    PieChart,
} from "lucide-react";
import { route } from "@/utils/route";
import {
    PieChart as RechartsPie,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { PageHeader } from "@/components/Shared/PageHeader";
import { MetricCard } from "@/components/Shared/MetricCard";
import { SectionCard } from "@/components/Shared/SectionCard";
import { BarChart } from "@/components/Shared/Charts/BarChart";

interface FinanceMetrics {
    received: number;
    pending: number;
    overdue: number;
    averageTicket: number;
    defaultRate: number;
}

interface DailyReceipt {
    date: string;
    total: number;
}

interface PaymentMethod {
    method: string;
    total: number;
    count: number;
}

interface ChartData {
    dailyReceipts: DailyReceipt[];
    paymentMethods: PaymentMethod[];
}

interface Props {
    metrics: FinanceMetrics;
    chartData: ChartData;
    filters: { period?: string };
}

const METHOD_LABELS: Record<string, string> = {
    cash: "Dinheiro",
    credit_card: "Crédito",
    debit_card: "Débito",
    pix: "PIX",
    bank_transfer: "Transferência",
    check: "Cheque",
    other: "Outro",
    card: "Cartão",
    transfer: "Transferência",
};

const PIE_COLORS = [
    "var(--primary)",
    "var(--info)",
    "var(--success)",
    "var(--warning)",
    "var(--destructive)",
    "var(--muted-foreground)",
];

export default function Dashboard({ metrics, chartData, filters }: Props) {
    const handlePeriodChange = (val: string) => {
        router.get(
            route("finance.dashboard"),
            { period: val },
            { preserveState: true },
        );
    };

    const money = (v: number) =>
        new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(v);

    const percent = (v: number) => `${v.toFixed(1)}%`;

    const methodData = chartData.paymentMethods.map((m) => ({
        ...m,
        label: METHOD_LABELS[m.method] ?? m.method,
    }));

    const chartAction = (
        <div className="flex gap-1.5 p-1 bg-muted rounded-xl">
            {(["week", "month", "year"] as const).map((p) => (
                <button
                    key={p}
                    onClick={() => handlePeriodChange(p)}
                    className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200 border-none ${
                        (filters.period || "month") === p
                            ? "bg-card text-primary shadow-sm"
                            : "bg-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                    {p === "week" ? "Semana" : p === "month" ? "Mês" : "Ano"}
                </button>
            ))}
        </div>
    );

    const headerAction = (
        <Link
            href="/financeiro/cobrancas/create"
            className="flex items-center gap-1.5 text-sm font-bold text-primary-foreground bg-primary border-none rounded-xl px-4 py-2.5 cursor-pointer shadow-[0_4px_16px_color-mix(in_srgb,var(--primary)_25%,transparent)] no-underline transition-transform active:scale-95"
        >
            <Plus className="w-4 h-4" strokeWidth={2.5} /> Nova Cobrança
        </Link>
    );

    return (
        <div className="space-y-6 pb-12 max-w-[1600px] mx-auto">
            <Head title="Painel Financeiro" />

            <PageHeader
                title="Painel Financeiro"
                subtitle="Visão geral do seu fluxo de caixa e inadimplência."
                action={headerAction}
            />

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <MetricCard
                    label="Recebido"
                    value={money(metrics.received)}
                    color="var(--success)"
                    icon={<TrendingDown size={18} />}
                />
                <MetricCard
                    label="A Receber"
                    value={money(metrics.pending)}
                    color="var(--info)"
                    icon={<Activity size={18} />}
                    sub={
                        <Link href="/financeiro/cobrancas?status=pending" className="hover:underline flex items-center gap-1">
                            Ver todas <ExternalLink className="h-3 w-3" />
                        </Link>
                    }
                />
                <MetricCard
                    label="Vencido"
                    value={money(metrics.overdue)}
                    color="var(--destructive)"
                    icon={<AlertCircle size={18} />}
                    sub={
                        <Link href="/financeiro/cobrancas?status=overdue" className="hover:underline flex items-center gap-1">
                            Ver pendências <ExternalLink className="h-3 w-3" />
                        </Link>
                    }
                />
                <MetricCard
                    label="Ticket Médio"
                    value={money(metrics.averageTicket)}
                    color="var(--primary)"
                    icon={<DollarSign size={18} />}
                />
                <MetricCard
                    label="Inadimplência"
                    value={percent(metrics.defaultRate)}
                    color="var(--warning)"
                    icon={<Activity size={18} />}
                    reverseColors
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard
                    title="Evolução de Recebimentos"
                    subtitle="Histórico de entradas"
                    headerAction={chartAction}
                >
                    <div className="h-[280px] w-full">
                        <BarChart
                            data={chartData.dailyReceipts.map(d => ({
                                date: d.date,
                                full_date: d.date,
                                value: d.total
                            }))}
                            height={240}
                            formatValue={(v) => money(v)}
                        />
                    </div>
                </SectionCard>

                <SectionCard
                    title="Métodos de Pagamento"
                    subtitle="Distribuição por canal"
                >
                    <div className="h-[280px] w-full">
                        {methodData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <Banknote className="mx-auto h-10 w-10 text-muted-foreground/30 mb-2" />
                                <p className="text-sm text-muted-foreground font-medium">Nenhum recebimento no período.</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPie>
                                    <Pie
                                        data={methodData}
                                        dataKey="total"
                                        nameKey="label"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={4}
                                    >
                                        {methodData.map((_, index) => (
                                            <Cell
                                                key={index}
                                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                                                stroke="var(--card)"
                                                strokeWidth={2}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "var(--card)",
                                            borderColor: "var(--border)",
                                            borderRadius: "12px",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                            boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
                                        }}
                                        itemStyle={{ color: "var(--foreground)" }}
                                        formatter={(v: number) => money(v)}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        align="center"
                                        iconType="circle"
                                        formatter={(v) => <span className="text-xs font-bold text-muted-foreground">{v}</span>}
                                    />
                                </RechartsPie>
                            </ResponsiveContainer>
                        )}
                    </div>
                </SectionCard>
            </div>
        </div>
    );
}

Dashboard.layout = (page: any) => <AppLayout children={page} />;

