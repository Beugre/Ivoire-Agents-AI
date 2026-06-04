'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import {
    MessageSquare,
    Users,
    Bot,
    AlertCircle,
    TrendingUp,
    Wifi,
    WifiOff,
} from 'lucide-react';

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
