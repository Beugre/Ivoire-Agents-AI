'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { Settings, Wifi, WifiOff, Save, Brain, Bell, Smartphone, ChevronRight, CheckCircle2 } from 'lucide-react';

interface FormData {
    name: string;
    sector: string;
    phone: string;
    city: string;
    description: string;
}

const inp: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'white', borderRadius: '10px', padding: '10px 14px',
    fontSize: '13px', width: '100%', outline: 'none',
};
const fo = (e: React.FocusEvent<HTMLElement>) => { (e.target as HTMLElement).style.borderColor = 'rgba(245,166,35,0.45)'; };
const fb = (e: React.FocusEvent<HTMLElement>) => { (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; };

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border p-6 space-y-5" style={{ background: '#0f1117', borderColor: 'rgba(255,255,255,0.07)' }}>
            <div>
                <h2 className="text-[14px] font-bold text-white">{title}</h2>
                {subtitle && <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{subtitle}</p>}
            </div>
            {children}
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[12px] block" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</label>
            {children}
        </div>
    );
}

export default function SettingsPage() {
    const { company, updateCompany } = useAuthStore();
    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>();

    // #38 — Mémoire entreprise
    const [memory, setMemory] = useState('');
    const [savingMemory, setSavingMemory] = useState(false);
    // #29 — Relance auto
    const [relanceEnabled, setRelanceEnabled] = useState(false);
    const [relanceDays, setRelanceDays] = useState(7);
    const [relanceMessage, setRelanceMessage] = useState('');
    const [savingRelance, setSavingRelance] = useState(false);

    useEffect(() => {
        if (company) {
            reset({
                name: company.name ?? '',
                sector: company.sector ?? '',
                phone: company.phone ?? '',
                city: company.city ?? '',
                description: company.description ?? '',
            });
            setMemory((company as any).memory ?? '');
            setRelanceEnabled((company as any).relanceEnabled ?? false);
            setRelanceDays((company as any).relanceDays ?? 7);
            setRelanceMessage((company as any).relanceMessage ?? '');
        }
    }, [company, reset]);

    const handleSaveMemory = async () => {
        setSavingMemory(true);
        try {
            await api.patch('/companies/me', { memory });
            await updateCompany({ memory } as any);
            toast.success('Mémoire entreprise sauvegardée ✓');
        } catch { toast.error('Erreur'); }
        finally { setSavingMemory(false); }
    };

    const handleSaveRelance = async () => {
        setSavingRelance(true);
        try {
            await api.patch('/companies/me', { relanceEnabled, relanceDays, relanceMessage });
            toast.success('Configuration relance sauvegardée ✓');
        } catch { toast.error('Erreur'); }
        finally { setSavingRelance(false); }
    };

    const onSubmit = async (data: FormData) => {
        try {
            await updateCompany(data);
            toast.success('Paramètres sauvegardés !');
        } catch { toast.error('Erreur lors de la sauvegarde'); }
    };

    return (
        <div className="min-h-screen p-8" style={{ background: '#080a10' }}>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.2)' }}>
                        <Settings className="w-4 h-4" style={{ color: '#f5a623' }} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Paramètres</h1>
                        <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Gérez les informations de votre entreprise</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Profil */}
                    <Section title="Profil entreprise" subtitle="Ces informations sont utilisées par votre agent IA">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <Field label="Nom de l'entreprise *">
                                <input style={inp} {...register('name')} placeholder="Ex: Boulangerie Soleil" />
                            </Field>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Secteur">
                                    <input style={inp} {...register('sector')} placeholder="Ex: Restauration" />
                                </Field>
                                <Field label="Ville">
                                    <input style={inp} {...register('city')} placeholder="Ex: Abidjan" />
                                </Field>
                            </div>
                            <Field label="Téléphone">
                                <input style={inp} {...register('phone')} placeholder="+225 07 00 00 00 00" />
                            </Field>
                            <Field label="Description de l'activité">
                                <textarea rows={3} style={{ ...inp, resize: 'none', fontFamily: 'inherit' }} {...register('description')} placeholder="Décrivez votre activité..." />
                            </Field>
                            <button type="submit" disabled={isSubmitting}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #f5a623, #f7b84b)', color: '#1a0e00' }}>
                                <Save className="w-3.5 h-3.5" />
                                {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
                            </button>
                        </form>
                    </Section>

                    {/* WhatsApp */}
                    <Section
                        title="Connexion WhatsApp"
                        subtitle="Connectez votre numéro pour recevoir et envoyer des messages">
                        <div className="flex items-center gap-2 mb-4">
                            {company?.whatsappConnected ? (
                                <span className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                                    <CheckCircle2 className="w-3.5 h-3.5" />Connecté
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <WifiOff className="w-3.5 h-3.5" />Non connecté
                                </span>
                            )}
                        </div>
                        <p className="text-[12px] mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            La configuration WhatsApp se fait désormais en quelques clics depuis la page dédiée.
                        </p>
                        <Link href="/whatsapp-connect"
                            className="flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-medium transition hover:opacity-90"
                            style={{ background: 'rgba(37,211,102,0.1)', color: '#25D366', border: '1px solid rgba(37,211,102,0.25)' }}>
                            <div className="flex items-center gap-2">
                                <Smartphone className="w-4 h-4" />
                                {company?.whatsappConnected ? 'Gérer la connexion WhatsApp' : 'Connecter mon WhatsApp'}
                            </div>
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </Section>
                </div>

                {/* Mémoire entreprise */}
                <Section title="Mémoire entreprise" subtitle="Informations contextuelles permanentes transmises à l'IA à chaque conversation">
                    <div className="flex items-start gap-2 mb-3 p-3 rounded-xl" style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.12)' }}>
                        <Brain className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#a855f7' }} />
                        <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                            Exemples : horaires d&apos;ouverture, politique de retour, promotions en cours, instructions spéciales...
                        </p>
                    </div>
                    <textarea
                        rows={5}
                        style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }}
                        placeholder="Nous sommes ouverts du lundi au samedi de 8h à 18h. Livraison gratuite dès 5000 FCFA d'achat..."
                        value={memory}
                        onChange={(e) => setMemory(e.target.value)}
                        onFocus={fo}
                        onBlur={fb}
                    />
                    <button
                        onClick={handleSaveMemory}
                        disabled={savingMemory}
                        className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold disabled:opacity-50"
                        style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.25)' }}>
                        <Save className="w-3.5 h-3.5" />
                        {savingMemory ? 'Sauvegarde...' : 'Sauvegarder la mémoire'}
                    </button>
                </Section>

                {/* Relance automatique */}
                <Section title="Relance automatique" subtitle="Envoyer un message automatique aux clients inactifs depuis N jours">
                    <div className="flex items-center gap-3 mb-4">
                        <Bell className="w-4 h-4 flex-shrink-0" style={{ color: relanceEnabled ? '#f5a623' : 'rgba(255,255,255,0.3)' }} />
                        <label className="flex items-center gap-2.5 cursor-pointer">
                            <div
                                onClick={() => setRelanceEnabled((v) => !v)}
                                className="relative w-10 h-5 rounded-full transition-all cursor-pointer"
                                style={{ background: relanceEnabled ? '#f5a623' : 'rgba(255,255,255,0.1)' }}>
                                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                                    style={{ left: relanceEnabled ? '22px' : '2px' }} />
                            </div>
                            <span className="text-[13px] font-medium" style={{ color: relanceEnabled ? 'white' : 'rgba(255,255,255,0.4)' }}>
                                {relanceEnabled ? 'Activée' : 'Désactivée'}
                            </span>
                        </label>
                    </div>
                    {relanceEnabled && (
                        <div className="space-y-4">
                            <Field label="Délai d'inactivité (jours)">
                                <input
                                    type="number"
                                    min={1}
                                    max={365}
                                    style={{ ...inp, width: '120px' }}
                                    value={relanceDays}
                                    onChange={(e) => setRelanceDays(parseInt(e.target.value) || 7)}
                                    onFocus={fo}
                                    onBlur={fb}
                                />
                            </Field>
                            <Field label="Message de relance">
                                <textarea
                                    rows={3}
                                    style={{ ...inp, resize: 'none', fontFamily: 'inherit' }}
                                    placeholder="Bonjour ! Nous n'avons pas eu de vos nouvelles depuis un moment. Avez-vous des questions ?"
                                    value={relanceMessage}
                                    onChange={(e) => setRelanceMessage(e.target.value)}
                                    onFocus={fo}
                                    onBlur={fb}
                                />
                            </Field>
                        </div>
                    )}
                    <button
                        onClick={handleSaveRelance}
                        disabled={savingRelance}
                        className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold disabled:opacity-50"
                        style={{ background: 'rgba(245,166,35,0.15)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.25)' }}>
                        <Save className="w-3.5 h-3.5" />
                        {savingRelance ? 'Sauvegarde...' : 'Sauvegarder la relance'}
                    </button>
                </Section>
            </div>
        </div>
    );
}
