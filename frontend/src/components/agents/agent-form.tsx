'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const schema = z.object({
    name: z.string().min(2, 'Nom requis'),
    role: z.enum(['commercial', 'support', 'secretary', 'sav', 'reservation']),
    tone: z.enum(['professional', 'warm', 'ivorian', 'formal', 'friendly']),
    language: z.enum(['french', 'ivorian_french']),
    welcomeMessage: z.string().optional(),
    customInstructions: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
    agent?: Partial<FormData & { id: string }> | null;
    onSaved: () => void;
}

export default function AgentForm({ agent, onSaved }: Props) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            role: 'support',
            tone: 'professional',
            language: 'french',
        },
    });

    useEffect(() => {
        if (agent) reset(agent as FormData);
    }, [agent, reset]);

    const onSubmit = async (data: FormData) => {
        try {
            if (agent?.id) {
                await api.patch(`/agents/${agent.id}`, data);
                toast.success('Agent mis à jour !');
            } else {
                await api.post('/agents', data);
                toast.success('Agent créé ! 🎉');
            }
            onSaved();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Erreur lors de la sauvegarde');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="name">Prénom / Nom de l'agent *</Label>
                <Input id="name" placeholder="Ex: Awa, Kofi, Assistant Commerce..." {...register('name')} />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="role">Rôle *</Label>
                    <select id="role" className="w-full border rounded-md px-3 py-2 text-sm bg-white" {...register('role')}>
                        <option value="commercial">💼 Commercial</option>
                        <option value="support">🛠️ Support client</option>
                        <option value="secretary">📋 Secrétaire</option>
                        <option value="sav">🔧 SAV</option>
                        <option value="reservation">📅 Réservation</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="tone">Ton *</Label>
                    <select id="tone" className="w-full border rounded-md px-3 py-2 text-sm bg-white" {...register('tone')}>
                        <option value="professional">Professionnel</option>
                        <option value="warm">Chaleureux</option>
                        <option value="ivorian">🇨🇮 Ivoirien</option>
                        <option value="formal">Formel</option>
                        <option value="friendly">Amical</option>
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="language">Langue *</Label>
                <select id="language" className="w-full border rounded-md px-3 py-2 text-sm bg-white" {...register('language')}>
                    <option value="french">🇫🇷 Français standard</option>
                    <option value="ivorian_french">🇨🇮 Français ivoirien</option>
                </select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Message d'accueil</Label>
                <Textarea
                    id="welcomeMessage"
                    placeholder="Bonjour ! Je suis Awa, comment puis-je vous aider aujourd'hui ?"
                    rows={2}
                    {...register('welcomeMessage')}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="customInstructions">Instructions personnalisées</Label>
                <Textarea
                    id="customInstructions"
                    placeholder="Ex: Tu es Awa, assistante virtuelle d'un restaurant à Cocody. Tu réponds poliment, tu prends les commandes et tu proposes les plats du jour..."
                    rows={4}
                    {...register('customInstructions')}
                />
                <p className="text-xs text-gray-400">
                    Décrivez le rôle et le comportement de votre agent en détail.
                </p>
            </div>

            <div className="flex gap-3 justify-end pt-2">
                <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                    {isSubmitting ? 'Sauvegarde...' : agent?.id ? 'Mettre à jour' : 'Créer l'agent'}
                </Button>
            </div>
        </form>
    );
}
