'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const schema = z.object({
    companyName: z.string().min(2, 'Nom requis (min 2 caractères)'),
    email: z.string().email('Email invalide'),
    password: z.string().min(8, 'Minimum 8 caractères'),
    sector: z.string().min(2, 'Secteur requis'),
    phone: z.string().min(8, 'Téléphone requis'),
    city: z.string().min(2, 'Ville requise'),
});

type FormData = z.infer<typeof schema>;

const SECTORS = [
    'Restaurant / Maquis',
    'Commerce / Boutique',
    'Immobilier',
    'Clinique / Santé',
    'Transport / Livraison',
    'Hôtel / Tourisme',
    'Services financiers',
    'Education / Formation',
    'Technologie',
    'Autre',
];

const CITIES_CI = [
    'Abidjan', 'Bouaké', 'Daloa', 'San Pédro', 'Korhogo',
    'Yamoussoukro', 'Man', 'Divo', 'Gagnoa', 'Abengourou',
];

export default function RegisterPage() {
    const router = useRouter();
    const { register: registerUser, isLoading } = useAuthStore();
    const [error, setError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    const onSubmit = async (data: FormData) => {
        try {
            setError('');
            await registerUser(data);
            toast.success('Compte créé avec succès ! Bienvenue 🎉');
            router.push('/dashboard');
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Erreur lors de l'inscription");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-green-50 p-4 py-8">
            <div className="w-full max-w-lg space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-green-700">🌿 Ivoire Agents IA</h1>
                    <p className="text-gray-500 mt-1">Créez votre premier employé virtuel</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Créer un compte entreprise</CardTitle>
                        <CardDescription>
                            Commencez gratuitement avec 14 jours d'essai
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="companyName">Nom de l'entreprise *</Label>
                                    <Input
                                        id="companyName"
                                        placeholder="Restaurant Chez Koffi"
                                        {...register('companyName')}
                                    />
                                    {errors.companyName && (
                                        <p className="text-sm text-red-500">{errors.companyName.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sector">Secteur d'activité *</Label>
                                    <select
                                        id="sector"
                                        className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                        {...register('sector')}
                                    >
                                        <option value="">Choisir un secteur</option>
                                        {SECTORS.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                    {errors.sector && (
                                        <p className="text-sm text-red-500">{errors.sector.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="city">Ville *</Label>
                                    <select
                                        id="city"
                                        className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                        {...register('city')}
                                    >
                                        <option value="">Choisir une ville</option>
                                        {CITIES_CI.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                    {errors.city && (
                                        <p className="text-sm text-red-500">{errors.city.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email professionnel *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="contact@entreprise.ci"
                                        {...register('email')}
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-red-500">{errors.email.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Téléphone *</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+225 07 00 00 00 00"
                                        {...register('phone')}
                                    />
                                    {errors.phone && (
                                        <p className="text-sm text-red-500">{errors.phone.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="password">Mot de passe *</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Minimum 8 caractères"
                                        {...register('password')}
                                    />
                                    {errors.password && (
                                        <p className="text-sm text-red-500">{errors.password.message}</p>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md">{error}</div>
                            )}

                            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                                {isLoading ? 'Création...' : 'Créer mon compte gratuitement'}
                            </Button>

                            <p className="text-xs text-center text-gray-400">
                                Plan Starter gratuit · 14 jours d'essai · Sans carte bancaire
                            </p>
                        </form>

                        <div className="mt-4 text-center text-sm text-gray-500">
                            Déjà un compte ?{' '}
                            <Link href="/login" className="text-green-600 hover:underline font-medium">
                                Se connecter
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
