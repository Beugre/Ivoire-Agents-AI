'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

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
    'Restaurant / Maquis', 'Commerce / Boutique', 'Immobilier',
    'Clinique / Santé', 'Transport / Livraison', 'Hôtel / Tourisme',
    'Services financiers', 'Education / Formation', 'Technologie', 'Autre',
];

const CITIES_CI = [
    'Abidjan', 'Bouaké', 'Daloa', 'San Pédro', 'Korhogo',
    'Yamoussoukro', 'Man', 'Divo', 'Gagnoa', 'Abengourou',
];

const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'white',
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</label>
            {children}
            {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
    );
}

export default function RegisterPage() {
    const router = useRouter();
    const { register: registerUser, isLoading } = useAuthStore();
    const [error, setError] = useState('');

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

    const onSubmit = async (data: FormData) => {
        try {
            setError('');
            await registerUser(data);
            toast.success('Bienvenue sur Ivoire Agents IA 🎉');
            router.push('/dashboard');
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Erreur lors de l'inscription");
        }
    };

    const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
        (e.target.style.borderColor = 'rgba(245,166,35,0.5)');
    const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
        (e.target.style.borderColor = 'rgba(255,255,255,0.08)');

    return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#080a10' }}>
            {/* Background orbs */}
            <div className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none opacity-[0.04]"
                style={{ background: 'radial-gradient(circle, #f5a623, transparent 70%)' }} />
            <div className="fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none opacity-[0.03]"
                style={{ background: 'radial-gradient(circle, #818cf8, transparent 70%)' }} />

            <div className="w-full max-w-lg relative z-10">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2.5 mb-8">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f5a623, #fcd34d)' }}>
                        <Sparkles className="w-5 h-5 text-amber-900" />
                    </div>
                    <span className="font-bold text-base" style={{ background: 'linear-gradient(90deg, #f5a623, #fcd34d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Ivoire Agents IA
                    </span>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white">Créer votre compte 🚀</h1>
                    <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Plan Starter gratuit · Sans carte bancaire</p>
                </div>

                {/* Card */}
                <div className="rounded-2xl p-8 border" style={{ background: '#13151f', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Field label="Nom de l'entreprise *" error={errors.companyName?.message}>
                            <input type="text" placeholder="Restaurant Chez Koffi" {...register('companyName')}
                                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all" style={inputStyle}
                                onFocus={focusStyle} onBlur={blurStyle} />
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Secteur *" error={errors.sector?.message}>
                                <select {...register('sector')}
                                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all appearance-none cursor-pointer"
                                    style={{ ...inputStyle, colorScheme: 'dark' }}
                                    onFocus={focusStyle} onBlur={blurStyle}>
                                    <option value="" style={{ background: '#13151f' }}>Choisir</option>
                                    {SECTORS.map((s) => <option key={s} value={s} style={{ background: '#13151f' }}>{s}</option>)}
                                </select>
                            </Field>
                            <Field label="Ville *" error={errors.city?.message}>
                                <select {...register('city')}
                                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all appearance-none cursor-pointer"
                                    style={{ ...inputStyle, colorScheme: 'dark' }}
                                    onFocus={focusStyle} onBlur={blurStyle}>
                                    <option value="" style={{ background: '#13151f' }}>Choisir</option>
                                    {CITIES_CI.map((c) => <option key={c} value={c} style={{ background: '#13151f' }}>{c}</option>)}
                                </select>
                            </Field>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Email *" error={errors.email?.message}>
                                <input type="email" placeholder="contact@entreprise.ci" {...register('email')}
                                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all" style={inputStyle}
                                    onFocus={focusStyle} onBlur={blurStyle} />
                            </Field>
                            <Field label="Téléphone *" error={errors.phone?.message}>
                                <input type="tel" placeholder="+225 07 00 00 00" {...register('phone')}
                                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all" style={inputStyle}
                                    onFocus={focusStyle} onBlur={blurStyle} />
                            </Field>
                        </div>

                        <Field label="Mot de passe * (min 8 caractères)" error={errors.password?.message}>
                            <input type="password" placeholder="••••••••" {...register('password')}
                                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all" style={inputStyle}
                                onFocus={focusStyle} onBlur={blurStyle} />
                        </Field>

                        {error && (
                            <div className="text-sm text-red-400 px-4 py-3 rounded-xl" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold mt-2 transition-all disabled:opacity-60"
                            style={{ background: 'linear-gradient(135deg, #f5a623, #f7b84b)', color: '#1a0e00' }}>
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <>Créer mon compte <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm mt-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Déjà un compte ?{' '}
                    <Link href="/login" className="font-medium text-[#f5a623] hover:underline">Se connecter</Link>
                </p>
            </div>
        </div>
    );
}


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
