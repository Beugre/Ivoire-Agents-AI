'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const PLANS = [
    {
        name: 'Starter',
        price: '0',
        description: 'Pour commencer et tester',
        color: 'border-gray-200',
        badge: '',
        features: [
            '1 agent IA',
            'WhatsApp uniquement',
            '1 000 messages/mois',
            'Historique 30 jours',
            'Support email',
        ],
        cta: 'Plan actuel',
        disabled: true,
    },
    {
        name: 'Business',
        price: '25 000',
        description: 'Pour les PME actives',
        color: 'border-green-500',
        badge: '🌟 Populaire',
        features: [
            '3 agents IA',
            'WhatsApp',
            '10 000 messages/mois',
            'Base de connaissances avancée',
            'Handoff humain',
            'Analytics',
            'Support prioritaire',
        ],
        cta: 'Passer à Business',
        disabled: false,
    },
    {
        name: 'Enterprise',
        price: 'Sur devis',
        description: 'Pour les grandes entreprises',
        color: 'border-purple-500',
        badge: '',
        features: [
            'Agents illimités',
            'Tous les canaux',
            'Messages illimités',
            'API accès',
            'Reporting avancé',
            'Intégration CRM',
            'Support dédié 24/7',
        ],
        cta: 'Nous contacter',
        disabled: false,
    },
];

export default function BillingPage() {
    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Abonnement</h1>
                <p className="text-gray-500 mt-1">Choisissez le plan adapté à votre entreprise</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PLANS.map((plan) => (
                    <Card
                        key={plan.name}
                        className={`relative ${plan.color} ${plan.badge ? 'border-2' : 'border'}`}
                    >
                        {plan.badge && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <Badge className="bg-green-600 text-white text-xs">{plan.badge}</Badge>
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle>{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                            <div className="mt-2">
                                <span className="text-3xl font-bold">
                                    {plan.price === 'Sur devis' ? plan.price : `${plan.price} FCFA`}
                                </span>
                                {plan.price !== 'Sur devis' && plan.price !== '0' && (
                                    <span className="text-gray-400 text-sm"> /mois</span>
                                )}
                                {plan.price === '0' && (
                                    <span className="text-gray-400 text-sm"> gratuit</span>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-2">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                                        <Check className="h-4 w-4 text-green-600 shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <Button
                                className={`w-full ${plan.badge ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                variant={plan.disabled ? 'outline' : plan.badge ? 'default' : 'outline'}
                                disabled={plan.disabled}
                            >
                                {plan.cta}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800 font-medium">💳 Paiements disponibles bientôt</p>
                <p className="text-xs text-orange-700 mt-1">
                    Wave CI, Orange Money, MTN Money, Moov Money, Carte bancaire
                </p>
            </div>
        </div>
    );
}
