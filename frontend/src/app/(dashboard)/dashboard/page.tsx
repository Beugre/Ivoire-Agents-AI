'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import {
    MessageSquare, Bot, AlertCircle, TrendingUp,
    ArrowUpRight, Zap, CheckCircle2, Circle,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Stats {
    total: number;
    open: number;
    humanRequested: number;
    closed: number;
    totalMessages: number;
}

interface DayData {
    label: string;
    messages: number;
}

function StatCard({ title, value, icon: Icon, accent, loading }: {
    title: string; value: number | null; icon: any; accent: string; loading: boolean;
}) {
    return (
        <div className="rounded-2xl p-5 flex flex-col gap-3 border" style={{ background: '#0f1117', borderColor: 'rgba(255,255,255,0.06)' }}>
            {loading ? (
                <>
                    <Skeleton className="h-3.5 w-24 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    <Skeleton className="h-10 w-14 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }} />
                </>
            ) : (
                <>
                    <div className="flex items-center justify-between">
                        <p className="text-[12px] font-medium tracking-wide uppercase" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>{title}</p>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: accent + '15' }}>
                            <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
                        </div>
                    </div>
                    <div className="flex items-end gap-2">
                        <p className="text-[2.25rem] font-bold leading-none tracking-tighter text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {value ?? 0}
                        </p>
                        <div className="mb-1 flex items-center gap-0.5 text-[11px] font-semibold" style={{ color: '#22c55e' }}>
                            <ArrowUpRight className="w-3 h-3" />live
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
        return (
            <div className="rounded-xl px-3.5 py-2.5 text-xs border shadow-xl" style={{ background: '#1a1d2e', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)' }}>
                <p className="font-semibold mb-0.5">{label}</p>
                <p style={{ color: '#f5a623' }}>{payload[0].value} message{payload[0].value !== 1 ? 's' : ''}</p>
            </div>
        );
    }
    return null;
};

export default function DashboardPage() {
    const { company } = useAuthStore();
    const [stats, setStats] = useState<Stats | null>(null);
    const [weeklyData, setWeeklyData] = useState<DayData[]>([]);
    const [loading, setLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(true);
    const [agentCount, setAgentCount] = useState(0);
    const [kbCount, setKbCount] = useState(0);

    useEffect(() => {
        Promise.all([
            api.get('/conversations/stats'),
            api.get('/conversations/stats/weekly'),
            api.get('/agents'),
            api.get('/knowledge-base'),
        ])
            .then(([statsRes, weeklyRes, agentsRes, kbRes]) => {
                setStats(statsRes.data);
                setWeeklyData(weeklyRes.data);
                setAgentCount(Array.isArray(agentsRes.data) ? agentsRes.data.length : 0);
                setKbCount(Array.isArray(kbRes.data) ? kbRes.data.length : 0);
            })
            .catch(() => {
                setStats({ total: 0, open: 0, humanRequested: 0, closed: 0, totalMessages: 0 });
                setWeeklyData([]);
            })
            .finally(() => {
                setLoading(false);
                setChartLoading(false);
            });
    }, []);

    const statCards = [
        { title: 'Conversations', value: stats?.total ?? null, icon: MessageSquare, accent: '#f5a623' },
        { title: 'IA active', value: stats?.open ?? null, icon: Bot, accent: '#22c55e' },
        { title: 'Messages', value: stats?.totalMessages ?? null, icon: TrendingUp, accent: '#818cf8' },
        { title: 'Transferts', value: stats?.humanRequested ?? null, icon: AlertCircle, accent: '#f87171' },
    ];

    const setupSteps = [
        { label: 'Créer un agent IA', href: '/agents', done: agentCount > 0 },
        { label: 'Remplir la base de connaissances', href: '/knowledge-base', done: kbCount > 0 },
        { label: 'Configurer WhatsApp', href: '/settings', done: !!company?.whatsappConnected },
        { label: 'Premier message reçu', href: '/conversations', done: (stats?.total ?? 0) > 0 },
    ];
    const setupProgress = setupSteps.filter((s) => s.done).length;

    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

    return (
        <div className="p-8 space-y-7 min-h-screen" style={{ background: '#080a10' }}>
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(245,166,35,0.6)', letterSpacing: '0.12em' }}>
                        {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <h1 className="text-[1.75rem] font-bold leading-tight text-white tracking-tight">
                        {greeting},{' '}
                        <span style={{ background: 'linear-gradient(90deg, #f5a623 0%, #fde68a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {company?.name ?? '…'}
                        </span>
                    </h1>
                    <p className="mt-1 text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Tableau de bord en temps réel</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold border"
                    style={{ background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.2)', color: '#4ade80' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Système opérationnel
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {statCards.map((card) => (
                    <StatCard key={card.title} {...card} loading={loading} />
                ))}
            </div>

            {/* Chart + Setup */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Chart — données réelles semaine en cours */}
                <div className="lg:col-span-2 rounded-2xl p-6 border" style={{ background: '#0f1117', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="font-semibold text-white text-[15px]">Activité des 7 derniers jours</p>
                            <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Messages échangés par jour</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg"
                            style={{ background: 'rgba(245,166,35,0.08)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.12)' }}>
                            <Zap className="w-3 h-3" />
                            {loading ? '…' : stats?.totalMessages ?? 0} total
                        </div>
                    </div>
                    {chartLoading ? (
                        <Skeleton className="h-40 w-full rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
                    ) : weeklyData.length === 0 ? (
                        <div className="h-40 flex flex-col items-center justify-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
                            <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
                            <p className="text-sm">Aucune donnée cette semaine</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={160}>
                            <AreaChart data={weeklyData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f5a623" stopOpacity={0.22} />
                                        <stop offset="100%" stopColor="#f5a623" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.25)', fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.25)', fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(245,166,35,0.08)', strokeWidth: 24, strokeLinecap: 'round' }} />
                                <Area type="monotone" dataKey="messages" stroke="#f5a623" strokeWidth={2} fill="url(#grad)" dot={false} activeDot={{ r: 3.5, fill: '#f5a623', strokeWidth: 0 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Setup checklist */}
                <div className="rounded-2xl p-6 border" style={{ background: '#0f1117', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center justify-between mb-4">
                        <p className="font-semibold text-white text-[15px]">Mise en service</p>
                        <span className="text-[11px] font-bold px-2 py-1 rounded-lg tabular-nums" style={{ background: 'rgba(245,166,35,0.1)', color: '#f5a623' }}>
                            {setupProgress}/{setupSteps.length}
                        </span>
                    </div>
                    <div className="w-full h-1 rounded-full mb-5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(setupProgress / setupSteps.length) * 100}%`, background: 'linear-gradient(90deg, #f5a623, #fde68a)' }} />
                    </div>
                    <div className="space-y-3.5">
                        {setupSteps.map((step) => (
                            <a key={step.href} href={step.href} className="flex items-center gap-3 group">
                                {step.done
                                    ? <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#4ade80' }} />
                                    : <Circle className="w-4 h-4 shrink-0 transition-opacity group-hover:opacity-60" style={{ color: 'rgba(255,255,255,0.2)' }} />
                                }
                                <span className="text-[13px] font-medium transition-colors" style={{ color: step.done ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.6)', textDecoration: step.done ? 'line-through' : 'none' }}>
                                    {step.label}
                                </span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}


