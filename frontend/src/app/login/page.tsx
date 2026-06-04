'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import { Sparkles, ArrowRight, Loader2, Bot, MessageSquare, Zap } from 'lucide-react';

const schema = z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(1, 'Mot de passe requis'),
});

type FormData = z.infer<typeof schema>;

const FEATURES = [
    { icon: Bot, text: 'Agents IA disponibles 24h/24' },
    { icon: MessageSquare, text: 'Intégration WhatsApp Business' },
    { icon: Zap, text: 'Réponses instantanées en nouchi & français' },
];

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading } = useAuthStore();
    const [error, setError] = useState('');

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

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
        <div className="min-h-screen flex" style={{ background: '#080a10' }}>
            {/* Left panel */}
            <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden" style={{ background: '#0a0c14' }}>
                {/* Background orb */}
                <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-[0.07]"
                    style={{ background: 'radial-gradient(circle, #f5a623, transparent 70%)' }} />
                <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full opacity-[0.05]"
                    style={{ background: 'radial-gradient(circle, #818cf8, transparent 70%)' }} />

                {/* Logo */}
                <div className="flex items-center gap-2.5 relative z-10">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f5a623, #fcd34d)' }}>
                        <Sparkles className="w-5 h-5 text-amber-900" />
                    </div>
                    <span className="font-bold text-base" style={{ background: 'linear-gradient(90deg, #f5a623, #fcd34d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Ivoire Agents IA
                    </span>
                </div>

                {/* Hero text */}
                <div className="relative z-10 space-y-6">
                    <div>
                        <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'rgba(245,166,35,0.6)' }}>Plateforme SaaS B2B</p>
                        <h2 className="text-4xl font-bold leading-tight text-white">
                            Votre agent IA<br />
                            <span style={{ background: 'linear-gradient(90deg, #f5a623, #fcd34d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                disponible 24h/24
                            </span><br />
                            pour vos clients
                        </h2>
                        <p className="mt-4 text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            Déployez un assistant WhatsApp intelligent qui comprend vos clients ivoiriens, répond en nouchi et gère vos ventes automatiquement.
                        </p>
                    </div>
                    <div className="space-y-3">
                        {FEATURES.map(({ icon: Icon, text }) => (
                            <div key={text} className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(245,166,35,0.1)' }}>
                                    <Icon className="w-3.5 h-3.5 text-[#f5a623]" />
                                </div>
                                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-xs relative z-10" style={{ color: 'rgba(255,255,255,0.2)' }}>© 2026 Ivoire Agents IA — Made in Côte d'Ivoire 🇨🇮</p>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-sm space-y-8">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-2 lg:hidden">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f5a623, #fcd34d)' }}>
                            <Sparkles className="w-4 h-4 text-amber-900" />
                        </div>
                        <span className="font-bold" style={{ background: 'linear-gradient(90deg, #f5a623, #fcd34d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Ivoire Agents IA
                        </span>
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-white">Bon retour 👋</h1>
                        <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Connectez-vous à votre espace</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Email</label>
                            <input
                                type="email"
                                placeholder="contact@monentreprise.ci"
                                autoComplete="email"
                                {...register('email')}
                                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'none' }}
                                onFocus={(e) => e.target.style.borderColor = 'rgba(245,166,35,0.5)'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                            />
                            {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Mot de passe</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                autoComplete="current-password"
                                {...register('password')}
                                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                                onFocus={(e) => e.target.style.borderColor = 'rgba(245,166,35,0.5)'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                            />
                            {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
                        </div>

                        {error && (
                            <div className="text-sm text-red-400 px-4 py-3 rounded-xl" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-60"
                            style={{ background: 'linear-gradient(135deg, #f5a623, #f7b84b)', color: '#1a0e00' }}
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <>Se connecter <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        Pas encore de compte ?{' '}
                        <Link href="/register" className="font-medium text-[#f5a623] hover:underline">
                            Créer un compte
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
