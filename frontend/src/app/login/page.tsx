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
    email: z.string().email('Email invalide'),
    password: z.string().min(1, 'Mot de passe requis'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading } = useAuthStore();
    const [error, setError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    const onSubmit = async (data: FormData) => {
        try {
            setError('');
            await login(data.email, data.password);
            toast.success('Connexion réussie !');
            router.push('/dashboard');
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Identifiants invalides');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-green-50 p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-green-700">🌿 Ivoire Agents IA</h1>
                    <p className="text-gray-500 mt-1">Votre employé virtuel disponible 24h/24</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Connexion</CardTitle>
                        <CardDescription>Accédez à votre tableau de bord</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="contact@monentreprise.ci"
                                    {...register('email')}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Mot de passe</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    {...register('password')}
                                />
                                {errors.password && (
                                    <p className="text-sm text-red-500">{errors.password.message}</p>
                                )}
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md">{error}</div>
                            )}

                            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                                {isLoading ? 'Connexion...' : 'Se connecter'}
                            </Button>
                        </form>

                        <div className="mt-4 text-center text-sm text-gray-500">
                            Pas encore de compte ?{' '}
                            <Link href="/register" className="text-green-600 hover:underline font-medium">
                                Créer un compte
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
