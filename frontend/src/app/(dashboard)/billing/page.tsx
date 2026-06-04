'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import {
    TrendingUp, Zap, MessageSquare, DollarSign, Check,
    TrendingDown, AlertTriangle,
} from 'lucide-react';

const PLANS = [
    {
        name: 'Starter', price: '0', description: 'Pour démarrer',
        features: ['1 agent IA', '1 000 messages/mois', 'WhatsApp', 'Support email'],
        accent: 'rgba(255,255,255,0.15)',
    },
    {
        name: 'Business', price: '25 000', description: 'Pour les PME actives',
        features: ['3 agents IA', '10 000 messages/mois', 'Handoff humain', 'Analytics', 'Support prioritaire'],
        accent: '#f5a623', badge: '🌟 Populaire',
    },
    {
        name: 'Enterprise', price: 'Sur devis', description: 'Pour les grandes structures',
        features: ['Agents illimités', 'Messages illimités', 'API accès', 'CRM intégré', 'Support dédié 24/7'],
        accent: '#818cf8',
    },
];

interface UsageStats {
    plan: string;
    messagesUsed: number;
    tokensUsed: number;
    estimatedCostUsd: number;
    costFcfa: number;
    revenueFcfa: number;
    marginFcfa: number;
    marginPercent: number | null;
    costPerMessage: number;
}

function MetricCard({ title, value, sub, icon: Icon, accent, loading }: {
    title: string; value: string; sub?: string; icon: any; accent: string; loading: boolean;
}) {
    return (
        <div className="rounded-2xl p-5 border" style={{ background: '#13151f', borderColor: 'rgba(255,255,255,0.06)' }}>
            {loading ? (
                <>
                    <Skeleton className="h-4 w-28 mb-4" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    <Skeleton className="h-8 w-20" style={{ background: 'rgba(255,255,255,0.06)' }} />
                </>
            ) : (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>{title}</p>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: accent + '1a' }}>
                            <Icon className="w-4 h-4" style={{ color: accent }} />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-white">{value}</p>
                    {sub && <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{sub}</p>}
                </>
            )}
        </div>
    );
}

export default function BillingPage() {
    const [stats, setStats] = useState<UsageStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/subscriptions/stats')
            .then((r) => setStats(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const isProfit = (stats?.marginFcfa ?? 0) >= 0;

    return (
        <div className="p-8 space-y-8 min-h-screen" style={{ background: '#0b0d15' }}>
            <div>
                <h1 className="text-2xl font-bold text-white">Abonnement & Coûts</h1>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Suivez vos coûts d'infrastructure et votre rentabilité en temps réel</p>
            </div>

            {/* Cost tracking */}
            <div>
                <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    Tableau de bord coûts — ce mois
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard title="Messages traités" value={String(stats?.messagesUsed ?? 0)}
                        sub="par votre agent IA" icon={MessageSquare} accent="#f5a623" loading={loading} />
                    <MetricCard title="Tokens OpenAI" value={(stats?.tokensUsed ?? 0).toLocaleString()}
                        sub="gpt-4o-mini" icon={Zap} accent="#818cf8" loading={loading} />
                    <MetricCard title="Coût IA estimé" value={loading ? '...' : `${stats?.costFcfa ?? 0} FCFA`}
                        sub={`${stats?.estimatedCostUsd?.toFixed(4) ?? '0'} USD`} icon={DollarSign} accent="#f87171" loading={loading} />
                    <MetricCard title={isProfit ? 'Marge nette' : 'Perte nette'}
                        value={loading ? '...' : `${Math.abs(stats?.marginFcfa ?? 0)} FCFA`}
                        sub={stats?.marginPercent != null ? `${stats.marginPercent}% de marge` : 'Plan gratuit'}
                        icon={isProfit ? TrendingUp : TrendingDown}
                        accent={isProfit ? '#22c55e' : '#f87171'} loading={loading} />
                </div>
            </div>

            {/* Cost per message */}
            {!loading && stats && stats.messagesUsed > 0 && (
                <div className="rounded-2xl p-5 border flex items-center gap-4" style={{ background: '#13151f', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(34,197,94,0.1)' }}>
                        <AlertTriangle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                        <p className="font-semibold text-white text-sm">Coût moyen par message : {stats.costPerMessage} FCFA</p>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            Sur {stats.messagesUsed} messages traités ce mois.
                            {stats.marginPercent != null && stats.marginPercent < 30
                                ? ' ⚠️ Marge faible — envisagez de passer à un plan supérieur.'
                                : ' Votre rentabilité est bonne.'}
                        </p>
                    </div>
                </div>
            )}

            {/* Plans */}
            <div>
                <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>Plans disponibles</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {PLANS.map((plan) => {
                        const isCurrent = stats?.plan === plan.name.toLowerCase();
                        return (
                            <div key={plan.name} className="rounded-2xl p-6 border relative"
                                style={{
                                    background: '#13151f',
                                    borderColor: isCurrent ? plan.accent ?? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                                    boxShadow: isCurrent && plan.accent !== 'rgba(255,255,255,0.15)' ? `0 0 20px ${plan.accent}20` : 'none',
                                }}>
                                {plan.badge && (
                                    <div className="absolute -top-3 left-5 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                                        style={{ background: plan.accent, color: '#1a0e00' }}>
                                        {plan.badge}
                                    </div>
                                )}
                                {isCurrent && (
                                    <div className="absolute -top-3 right-5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-white/60">
                                        Plan actuel
                                    </div>
                                )}
                                <p className="font-bold text-white text-lg">{plan.name}</p>
                                <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>{plan.description}</p>
                                <p className="text-3xl font-bold mb-5" style={{ color: plan.accent ?? 'white' }}>
                                    {plan.price === 'Sur devis' ? plan.price : plan.price === '0' ? 'Gratuit' : `${plan.price} FCFA`}
                                    {plan.price !== '0' && plan.price !== 'Sur devis' && (
                                        <span className="text-sm font-normal ml-1" style={{ color: 'rgba(255,255,255,0.3)' }}>/mois</span>
                                    )}
                                </p>
                                <ul className="space-y-2 mb-6">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-center gap-2 text-[13px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                                            <Check className="w-3.5 h-3.5 shrink-0" style={{ color: plan.accent ?? 'rgba(255,255,255,0.4)' }} />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    disabled={isCurrent}
                                    className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                                    style={isCurrent
                                        ? { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }
                                        : { background: plan.accent ?? 'rgba(255,255,255,0.1)', color: plan.accent === '#f5a623' ? '#1a0e00' : 'white' }
                                    }>
                                    {isCurrent ? 'Plan actuel' : plan.price === 'Sur devis' ? 'Nous contacter' : 'Choisir ce plan'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
                💳 Paiements via Wave, MTN MoMo & Orange Money — disponibles prochainement
            </p>
        </div>
    );
}
