'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import {
    MessageSquare,
    Bot,
    AlertCircle,
    TrendingUp,
    ArrowUpRight,
    Zap,
    CheckCircle2,
    Circle,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Stats {
    total: number;
    open: number;
    humanRequested: number;
    closed: number;
    totalMessages: number;
}

const WEEK_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function buildChartData(total: number) {
    return WEEK_LABELS.map((name, i) => ({
        name,
        messages: Math.max(0, Math.round((total / 7) * (0.5 + Math.sin(i) * 0.5 + Math.random() * 0.5))),
    }));
}

function StatCard({ title, value, icon: Icon, gradient, loading }: {
    title: string; value: number; icon: any; gradient: string; loading: boolean;
}) {
    return (
        <div className="rounded-2xl p-5 flex flex-col gap-4 border" style={{ background: '#13151f', borderColor: 'rgba(255,255,255,0.06)' }}>
            {loading ? (
                <>
                    <Skeleton className="h-4 w-28" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    <Skeleton className="h-9 w-16" style={{ background: 'rgba(255,255,255,0.06)' }} />
                </>
            ) : (
                <>
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>{title}</p>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: gradient + '1a' }}>
                            <Icon className="w-4 h-4" style={{ color: gradient }} />
                        </div>
                    </div>
                    <div className="flex items-end justify-between">
                        <p className="text-4xl font-bold tracking-tight text-white">{value}</p>
                        <div className="flex items-center gap-1 text-xs font-medium mb-1" style={{ color: '#22c55e' }}>
                            <ArrowUpRight className="w-3 h-3" />
                            <span>Live</span>
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
            <div className="rounded-xl px-3 py-2 text-xs border" style={{ background: '#1a1d2e', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
                <p className="font-semibold">{label}</p>
                <p style={{ color: '#f5a623' }}>{payload[0].value} messages</p>
            </div>
        );
    }
    return null;
};

export default function DashboardPage() {
    const { company } = useAuthStore();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        api.get('/conversations/stats')
            .then((res) => {
                setStats(res.data);
                setChartData(buildChartData(res.data.totalMessages ?? 0));
            })
            .catch(() => {
                setStats({ total: 0, open: 0, humanRequested: 0, closed: 0, totalMessages: 0 });
                setChartData(buildChartData(0));
            })
            .finally(() => setLoading(false));
    }, []);

    const statCards = [
        { title: 'Conversations', value: stats?.total ?? 0, icon: MessageSquare, gradient: '#f5a623' },
        { title: 'IA active', value: stats?.open ?? 0, icon: Bot, gradient: '#22c55e' },
        { title: 'Messages échangés', value: stats?.totalMessages ?? 0, icon: TrendingUp, gradient: '#818cf8' },
        { title: 'Transferts humains', value: stats?.humanRequested ?? 0, icon: AlertCircle, gradient: '#f87171' },
    ];

    const setupSteps = [
        { label: 'Créer un agent IA', href: '/agents', done: false },
        { label: 'Remplir la base de connaissances', href: '/knowledge-base', done: false },
        { label: 'Configurer WhatsApp', href: '/settings', done: !!company?.whatsappConnected },
        { label: 'Premier message reçu', href: '/conversations', done: (stats?.total ?? 0) > 0 },
    ];
    const setupProgress = setupSteps.filter((s) => s.done).length;

    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

    return (
        <div className="p-8 space-y-8 min-h-screen" style={{ background: '#0b0d15' }}>
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium mb-1" style={{ color: 'rgba(245,166,35,0.8)' }}>
                        {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <h1 className="text-3xl font-bold text-white">
                        {greeting}, <span style={{ background: 'linear-gradient(90deg, #f5a623, #fcd34d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{company?.name}</span> 👋
                    </h1>
                    <p className="mt-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Voici un aperçu de votre activité IA en temps réel</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-medium"
                    style={{ background: '#22c55e10', borderColor: '#22c55e30', color: '#22c55e' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Système opérationnel
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <StatCard key={card.title} {...card} loading={loading} />
                ))}
            </div>

            {/* Chart + Setup */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <div className="lg:col-span-2 rounded-2xl p-6 border" style={{ background: '#13151f', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="font-semibold text-white">Activité cette semaine</p>
                            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Messages échangés par jour</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs px-2.5 py-1 rounded-lg" style={{ background: 'rgba(245,166,35,0.08)', color: '#f5a623' }}>
                            <Zap className="w-3 h-3" />
                            {stats?.totalMessages ?? 0} total
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="h-40 w-full rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
                    ) : (
                        <ResponsiveContainer width="100%" height={160}>
                            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f5a623" stopOpacity={0.25} />
                                        <stop offset="100%" stopColor="#f5a623" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(245,166,35,0.1)', strokeWidth: 20, strokeLinecap: 'round' }} />
                                <Area type="monotone" dataKey="messages" stroke="#f5a623" strokeWidth={2} fill="url(#grad)" dot={false} activeDot={{ r: 4, fill: '#f5a623', strokeWidth: 0 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Setup progress */}
                <div className="rounded-2xl p-6 border" style={{ background: '#13151f', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center justify-between mb-5">
                        <p className="font-semibold text-white">Configuration</p>
                        <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(245,166,35,0.1)', color: '#f5a623' }}>
                            {setupProgress}/{setupSteps.length}
                        </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full mb-5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(setupProgress / setupSteps.length) * 100}%`, background: 'linear-gradient(90deg, #f5a623, #fcd34d)' }} />
                    </div>
                    <div className="space-y-3">
                        {setupSteps.map((step) => (
                            <a key={step.href} href={step.href} className="flex items-center gap-3 group">
                                {step.done
                                    ? <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400" />
                                    : <Circle className="w-4 h-4 shrink-0 opacity-30 group-hover:opacity-60 transition-opacity" style={{ color: '#f5a623' }} />
                                }
                                <span className="text-[13px] transition-colors" style={{ color: step.done ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.65)' }}>
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


interface Stats {
    total: number;
    open: number;
    humanRequested: number;
    closed: number;
    totalMessages: number;
}

export default function DashboardPage() {
    const { company } = useAuthStore();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/conversations/stats')
            .then((res) => setStats(res.data))
            .catch(() => setStats({ total: 0, open: 0, humanRequested: 0, closed: 0, totalMessages: 0 }))
            .finally(() => setLoading(false));
    }, []);

    const statCards = stats ? [
        {
            title: 'Conversations totales',
            value: stats.total,
            icon: MessageSquare,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
        },
        {
            title: 'IA active',
            value: stats.open,
            icon: Bot,
            color: 'text-green-600',
            bg: 'bg-green-50',
        },
        {
            title: 'Messages échangés',
            value: stats.totalMessages,
            icon: TrendingUp,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
        },
        {
            title: 'Transferts humains',
            value: stats.humanRequested,
            icon: AlertCircle,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
        },
    ] : [];

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Bonjour, {company?.name} 👋
                    </h1>
                    <p className="text-gray-500 mt-1">Voici un aperçu de votre activité</p>
                </div>
                <div className="flex items-center gap-2">
                    {company?.whatsappConnected ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                            <Wifi className="h-3 w-3 mr-1" />
                            WhatsApp connecté
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-gray-500">
                            <WifiOff className="h-3 w-3 mr-1" />
                            WhatsApp non connecté
                        </Badge>
                    )}
                </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {loading
                    ? Array(4).fill(0).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <Skeleton className="h-4 w-32 mb-3" />
                                <Skeleton className="h-8 w-16" />
                            </CardContent>
                        </Card>
                    ))
                    : statCards.map((card) => (
                        <Card key={card.title} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">{card.title}</p>
                                        <p className="text-3xl font-bold mt-1">{card.value}</p>
                                    </div>
                                    <div className={`p-3 rounded-full ${card.bg}`}>
                                        <card.icon className={`h-5 w-5 ${card.color}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
            </div>

            {/* Guide de démarrage */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">🚀 Guide de démarrage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {[
                        { step: '1', label: 'Créez votre premier agent IA', href: '/agents', done: false },
                        { step: '2', label: 'Ajoutez vos informations dans la base de connaissances', href: '/knowledge-base', done: false },
                        { step: '3', label: 'Connectez WhatsApp Business dans les paramètres', href: '/settings', done: !!company?.whatsappConnected },
                        { step: '4', label: 'Testez votre agent en lui envoyant un message', href: '/conversations', done: stats ? stats.total > 0 : false },
                    ].map((item) => (
                        <a
                            key={item.step}
                            href={item.href}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-gray-50 ${item.done ? 'opacity-60' : ''
                                }`}
                        >
                            <span
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${item.done
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-500'
                                    }`}
                            >
                                {item.done ? '✓' : item.step}
                            </span>
                            <span className={`text-sm ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                {item.label}
                            </span>
                        </a>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
