'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import { Settings, Wifi, WifiOff, Save } from 'lucide-react';

interface FormData {
    name: string;
    sector: string;
    phone: string;
    city: string;
    description: string;
    whatsappPhoneNumberId: string;
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

    useEffect(() => {
        if (company) {
            reset({
                name: company.name ?? '',
                sector: company.sector ?? '',
                phone: company.phone ?? '',
                city: company.city ?? '',
                description: company.description ?? '',
                whatsappPhoneNumberId: company.whatsappPhoneNumberId ?? '',
            });
        }
    }, [company, reset]);

    const onSubmit = async (data: FormData) => {
        try {
            await updateCompany(data);
            toast.success('Paramètres sauvegardés !');
        } catch { toast.error('Erreur lors de la sauvegarde'); }
    };

    const webhookUrl = typeof window !== 'undefined'
        ? window.location.origin.replace('3001', '3000') + '/api/webhooks/whatsapp'
        : 'https://ivoire-agents-ai-backend.onrender.com/api/webhooks/whatsapp';

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
                        title="WhatsApp Business"
                        subtitle="Connectez votre numéro pour recevoir et envoyer des messages">
                        <div className="flex items-center gap-2 mb-2">
                            {company?.whatsappConnected ? (
                                <span className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                                    <Wifi className="w-3.5 h-3.5" />Connecté
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <WifiOff className="w-3.5 h-3.5" />Non connecté
                                </span>
                            )}
                        </div>

                        <Field label="Phone Number ID (Meta)">
                            <input style={inp} {...register('whatsappPhoneNumberId')} placeholder="Ex: 123456789012345" />
                            <p className="text-[11px] mt-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                Trouvez ce numéro dans{' '}
                                <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#f5a623' }}>
                                    Meta for Developers
                                </a>{' '}→ WhatsApp → Getting Started
                            </p>
                        </Field>

                        <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.12)' }}>
                            <p className="text-[12px] font-semibold" style={{ color: 'rgba(245,166,35,0.8)' }}>📋 Configuration webhook :</p>
                            <ol className="text-[12px] space-y-1.5 list-decimal list-inside" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                <li>Créez un compte Meta Business</li>
                                <li>Créez une app dans Meta for Developers</li>
                                <li>Activez WhatsApp Business Cloud API</li>
                                <li>
                                    Webhook URL :{' '}
                                    <code className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
                                        {webhookUrl}
                                    </code>
                                </li>
                                <li>
                                    Token de vérification :{' '}
                                    <code className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
                                        ivoire_agents_verify_token_2024
                                    </code>
                                </li>
                            </ol>
                        </div>

                        <button type="button" onClick={handleSubmit(onSubmit)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold"
                            style={{ background: 'linear-gradient(135deg, #f5a623, #f7b84b)', color: '#1a0e00' }}>
                            <Save className="w-3.5 h-3.5" />Sauvegarder WhatsApp
                        </button>
                    </Section>
                </div>
            </div>
        </div>
    );
}
