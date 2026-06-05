'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
    Smartphone,
    CheckCircle2,
    XCircle,
    Loader2,
    AlertTriangle,
    Zap,
    Shield,
    Clock,
    WifiOff,
    ChevronRight,
    RefreshCw,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConnectionStatus {
    connected: boolean;
    displayPhoneNumber?: string;
    qualityRating?: 'GREEN' | 'YELLOW' | 'RED' | string;
    connectionStatus?: 'active' | 'disconnected' | 'error' | string;
    webhookStatus?: 'pending' | 'verified' | 'error' | string;
    tokenExpiresAt?: string;
}

// ─── Déclaration globals Meta SDK ─────────────────────────────────────────────

declare global {
    interface Window {
        FB: {
            init: (opts: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
            login: (cb: (response: any) => void, opts?: any) => void;
            getLoginStatus: (cb: (response: any) => void) => void;
        };
        fbAsyncInit: () => void;
    }
}

// ─── Helpers UI ───────────────────────────────────────────────────────────────

const qualityColors: Record<string, string> = {
    GREEN: '#22c55e',
    YELLOW: '#f59e0b',
    RED: '#ef4444',
};

const qualityLabels: Record<string, string> = {
    GREEN: 'Excellente qualité',
    YELLOW: 'Qualité moyenne',
    RED: 'Qualité faible',
};

function QualityBadge({ rating }: { rating?: string }) {
    if (!rating) return null;
    const color = qualityColors[rating] ?? '#94a3b8';
    const label = qualityLabels[rating] ?? rating;
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: `${color}18`, color, border: `1px solid ${color}44` }}
        >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
            {label}
        </span>
    );
}

function WebhookBadge({ status }: { status?: string }) {
    const config = {
        verified: { label: 'Webhook actif', color: '#22c55e' },
        pending: { label: 'En attente', color: '#f59e0b' },
        error: { label: 'Erreur webhook', color: '#ef4444' },
    }[status ?? 'pending'] ?? { label: status, color: '#94a3b8' };

    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: `${config.color}18`, color: config.color, border: `1px solid ${config.color}44` }}
        >
            {config.label}
        </span>
    );
}

// ─── Étapes explicatives ──────────────────────────────────────────────────────

const STEPS = [
    {
        icon: Smartphone,
        title: 'Sélectionnez votre numéro',
        desc: 'Choisissez le numéro WhatsApp de votre entreprise dans votre compte Meta Business.',
    },
    {
        icon: Shield,
        title: 'Connexion sécurisée',
        desc: 'Ivoire Agents gère automatiquement la configuration — aucune manipulation technique.',
    },
    {
        icon: Zap,
        title: 'Prêt en 2 minutes',
        desc: 'Votre agent IA répond automatiquement à vos clients WhatsApp dès la connexion.',
    },
];

// ─── Composant principal ──────────────────────────────────────────────────────

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID ?? '';

export default function WhatsAppConnectPage() {
    const { company } = useAuthStore();

    const [status, setStatus] = useState<ConnectionStatus | null>(null);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [testingMsg, setTestingMsg] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [sdkReady, setSdkReady] = useState(false);

    // ── Charger le statut de connexion ──────────────────────────────────────
    const fetchStatus = useCallback(async () => {
        try {
            const res = await api.get<ConnectionStatus>('/whatsapp-connect/status');
            setStatus(res.data);
        } catch {
            setStatus({ connected: false });
        } finally {
            setLoadingStatus(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // ── Charger le Meta SDK ──────────────────────────────────────────────────
    useEffect(() => {
        if (!META_APP_ID) {
            console.warn('NEXT_PUBLIC_META_APP_ID non configuré');
            return;
        }

        // Listener pour le message WA_EMBEDDED_SIGNUP
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== 'https://www.facebook.com' && event.origin !== 'https://web.facebook.com') return;
            try {
                const data = JSON.parse(event.data as string);
                if (data.type === 'WA_EMBEDDED_SIGNUP' && data.event === 'FINISH') {
                    // phone_number_id et waba_id disponibles ici
                    window.__waSignupData = data.data;
                }
            } catch {
                // pas du JSON — ignorer
            }
        };
        window.addEventListener('message', handleMessage);

        window.fbAsyncInit = () => {
            window.FB.init({
                appId: META_APP_ID,
                cookie: true,
                xfbml: true,
                version: 'v19.0',
            });
            setSdkReady(true);
        };

        if (!document.getElementById('facebook-jssdk')) {
            const script = document.createElement('script');
            script.id = 'facebook-jssdk';
            script.src = 'https://connect.facebook.net/fr_FR/sdk.js';
            script.async = true;
            script.defer = true;
            script.crossOrigin = 'anonymous';
            document.head.appendChild(script);
        } else {
            setSdkReady(true);
        }

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    // ── Lancer le flow Embedded Signup ──────────────────────────────────────
    const handleConnect = useCallback(() => {
        if (!sdkReady || !window.FB) {
            toast.error('SDK Meta non chargé. Rechargez la page.');
            return;
        }
        setConnecting(true);

        // Timeout de sécurité : si la popup Meta ne répond pas en 90s, reset
        const safetyTimeout = setTimeout(() => {
            setConnecting(false);
            toast.error('La fenêtre Meta a été fermée ou bloquée. Vérifiez que les popups sont autorisées.');
        }, 90_000);

        window.FB.login(
            async (response) => {
                clearTimeout(safetyTimeout);
                if (response.status !== 'connected' || !response.authResponse) {
                    setConnecting(false);
                    if (response.status !== 'unknown') {
                        toast.error('Connexion annulée ou refusée.');
                    }
                    return;
                }

                const { accessToken } = response.authResponse;

                // Récupérer les données du message WA_EMBEDDED_SIGNUP (si disponibles)
                const waData = window.__waSignupData ?? {};

                try {
                    const res = await api.post<ConnectionStatus>('/whatsapp-connect/embedded-signup', {
                        accessToken,
                        wabaId: waData.waba_id,
                        phoneNumberId: waData.phone_number_id,
                    });
                    setStatus(res.data);
                    toast.success('WhatsApp connecté avec succès !');
                } catch (err: any) {
                    const msg = err?.response?.data?.message ?? 'Erreur lors de la connexion.';
                    toast.error(msg);
                } finally {
                    setConnecting(false);
                    window.__waSignupData = undefined;
                }
            },
            {
                scope: 'business_management,whatsapp_business_management,whatsapp_business_messaging',
                extras: {
                    feature: 'whatsapp_embedded_signup',
                    sessionInfoVersion: 2,
                },
            },
        );
    }, [sdkReady]);

    // ── Envoyer un message test ──────────────────────────────────────────────
    const handleTest = async () => {
        setTestingMsg(true);
        try {
            const res = await api.post<{ success: boolean; message: string }>('/whatsapp-connect/test-message');
            if (res.data.success) toast.success(res.data.message);
            else toast.error(res.data.message);
        } catch {
            toast.error('Erreur lors du test de connexion.');
        } finally {
            setTestingMsg(false);
        }
    };

    // ── Déconnecter ──────────────────────────────────────────────────────────
    const handleDisconnect = async () => {
        if (!confirm('Déconnecter WhatsApp ? Vos clients ne pourront plus contacter votre agent IA.')) return;
        setDisconnecting(true);
        try {
            await api.delete('/whatsapp-connect');
            setStatus({ connected: false });
            toast.success('WhatsApp déconnecté.');
        } catch {
            toast.error('Erreur lors de la déconnexion.');
        } finally {
            setDisconnecting(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Rendu
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6 max-w-3xl">
            {/* En-tête */}
            <div>
                <h1 className="text-2xl font-bold text-white">Connexion WhatsApp</h1>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Connectez votre numéro WhatsApp Business pour que votre agent IA réponde automatiquement à vos clients.
                </p>
            </div>

            {/* === ÉTAT CONNECTÉ === */}
            {!loadingStatus && status?.connected && (
                <div
                    className="rounded-2xl border p-6 space-y-5"
                    style={{ background: '#0f1117', borderColor: 'rgba(34,197,94,0.25)' }}
                >
                    {/* Header statut */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center"
                                style={{ background: 'rgba(34,197,94,0.12)' }}
                            >
                                <CheckCircle2 size={22} style={{ color: '#22c55e' }} />
                            </div>
                            <div>
                                <p className="text-white font-semibold text-base">WhatsApp connecté</p>
                                <p className="text-sm font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                                    {status.displayPhoneNumber}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={fetchStatus}
                            className="p-2 rounded-lg hover:bg-white/5 transition"
                            title="Actualiser"
                        >
                            <RefreshCw size={15} style={{ color: 'rgba(255,255,255,0.4)' }} />
                        </button>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                        <QualityBadge rating={status.qualityRating} />
                        <WebhookBadge status={status.webhookStatus} />
                        {status.tokenExpiresAt && (
                            <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                                style={{ background: 'rgba(245,166,35,0.1)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.25)' }}
                            >
                                <Clock size={11} />
                                Expire le {new Date(status.tokenExpiresAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </span>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-1">
                        <button
                            onClick={handleTest}
                            disabled={testingMsg}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition"
                            style={{ background: 'rgba(245,166,35,0.12)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.25)' }}
                        >
                            {testingMsg ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                            Envoyer un message test
                        </button>
                        <button
                            onClick={handleDisconnect}
                            disabled={disconnecting}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition"
                            style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                        >
                            {disconnecting ? <Loader2 size={14} className="animate-spin" /> : <WifiOff size={14} />}
                            Déconnecter
                        </button>
                    </div>

                    {/* Info token expiration */}
                    {status.tokenExpiresAt && new Date(status.tokenExpiresAt) < new Date(Date.now() + 7 * 86400000) && (
                        <div
                            className="flex items-start gap-3 p-4 rounded-xl"
                            style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)' }}
                        >
                            <AlertTriangle size={16} style={{ color: '#f5a623', flexShrink: 0, marginTop: 1 }} />
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
                                Votre connexion WhatsApp expire bientôt. Cliquez sur{' '}
                                <button
                                    onClick={handleConnect}
                                    className="underline font-medium"
                                    style={{ color: '#f5a623' }}
                                >
                                    Reconnecter
                                </button>{' '}
                                pour la renouveler.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* === ÉTAT NON CONNECTÉ === */}
            {!loadingStatus && !status?.connected && (
                <>
                    {/* Étapes explicatives */}
                    <div
                        className="rounded-2xl border p-6 space-y-5"
                        style={{ background: '#0f1117', borderColor: 'rgba(255,255,255,0.07)' }}
                    >
                        <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                            Comment ça marche
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {STEPS.map((step, i) => {
                                const Icon = step.icon;
                                return (
                                    <div key={i} className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                                style={{ background: 'rgba(245,166,35,0.1)' }}
                                            >
                                                <Icon size={15} style={{ color: '#f5a623' }} />
                                            </div>
                                            <span
                                                className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0"
                                                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
                                            >
                                                {i + 1}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium">{step.title}</p>
                                            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{step.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bouton principal */}
                    <div
                        className="rounded-2xl border p-8 flex flex-col items-center text-center space-y-5"
                        style={{ background: '#0f1117', borderColor: 'rgba(255,255,255,0.07)' }}
                    >
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center"
                            style={{ background: 'rgba(37,211,102,0.1)' }}
                        >
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <path
                                    d="M16 2C8.268 2 2 8.268 2 16c0 2.478.65 4.8 1.786 6.808L2 30l7.406-1.74A13.93 13.93 0 0 0 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2z"
                                    fill="#25D366"
                                />
                                <path
                                    d="M22.5 19.6c-.3-.15-1.772-.874-2.047-.974-.274-.1-.474-.15-.674.15-.2.3-.774.974-.948 1.175-.175.2-.35.225-.65.075-.3-.15-1.267-.467-2.414-1.49-.892-.793-1.494-1.773-1.669-2.073-.175-.3-.018-.462.131-.61.135-.134.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.674-1.624-.924-2.224-.243-.584-.49-.505-.674-.515l-.574-.01c-.2 0-.525.075-.8.375-.274.3-1.049 1.025-1.049 2.5 0 1.474 1.074 2.898 1.224 3.098.15.2 2.098 3.2 5.084 4.488.71.307 1.264.49 1.696.627.712.226 1.36.194 1.872.118.571-.085 1.77-.723 2.02-1.423.25-.7.25-1.3.175-1.424-.074-.124-.274-.2-.574-.35z"
                                    fill="white"
                                />
                            </svg>
                        </div>

                        <div>
                            <h2 className="text-white text-lg font-semibold">Connecter mon WhatsApp Business</h2>
                            <p className="text-sm mt-1.5 max-w-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                Connectez-vous avec votre compte Meta Business pour activer les réponses automatiques WhatsApp.
                            </p>
                        </div>

                        {!META_APP_ID ? (
                            <div
                                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm w-full max-w-sm"
                                style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                            >
                                <XCircle size={15} />
                                Configuration manquante — contactez le support.
                            </div>
                        ) : (
                            <button
                                onClick={handleConnect}
                                disabled={connecting || !sdkReady}
                                className="flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-semibold transition w-full max-w-sm"
                                style={{
                                    background: connecting || !sdkReady ? 'rgba(37,211,102,0.3)' : '#25D366',
                                    color: 'white',
                                    cursor: connecting || !sdkReady ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {connecting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Connexion en cours…
                                    </>
                                ) : !sdkReady ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Chargement…
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                                            <path d="M16 2C8.268 2 2 8.268 2 16c0 2.478.65 4.8 1.786 6.808L2 30l7.406-1.74A13.93 13.93 0 0 0 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2z" fill="white" fillOpacity="0.9" />
                                        </svg>
                                        Connecter mon WhatsApp
                                        <ChevronRight size={16} />
                                    </>
                                )}
                            </button>
                        )}

                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                            Vous serez redirigé vers Meta Business pour autoriser la connexion.
                        </p>
                    </div>

                    {/* Encart WhatsApp perso */}
                    <div
                        className="rounded-2xl border p-5 space-y-4"
                        style={{ background: '#0f1117', borderColor: 'rgba(255,255,255,0.07)' }}
                    >
                        <div className="flex items-start gap-3">
                            <AlertTriangle size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
                            <div>
                                <p className="text-sm font-semibold text-white">Vous avez un WhatsApp personnel ?</p>
                                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                    L&apos;API WhatsApp nécessite un compte WhatsApp Business. Bonne nouvelle : la conversion est gratuite et vous gardez votre numéro et vos contacts.
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <a
                                href="https://www.whatsapp.com/business/download"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col gap-1 p-3 rounded-xl text-xs transition hover:opacity-90"
                                style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)', color: 'rgba(255,255,255,0.7)' }}
                            >
                                <span className="font-semibold text-white">Option 1 — Convertir votre numéro</span>
                                <span>Téléchargez WhatsApp Business et convertissez votre numéro existant gratuitement. Prend 5 minutes.</span>
                                <span style={{ color: '#25D366', marginTop: 4 }}>Télécharger WhatsApp Business →</span>
                            </a>
                            <div
                                className="flex flex-col gap-1 p-3 rounded-xl text-xs"
                                style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.18)', color: 'rgba(255,255,255,0.7)' }}
                            >
                                <span className="font-semibold text-white">Option 2 — Numéro géré par la plateforme</span>
                                <span>Ivoire Agents peut vous attribuer un numéro dédié. Vos clients écrivent à ce numéro et l&apos;agent IA leur répond.</span>
                                <span style={{ color: '#f5a623', marginTop: 4 }}>Contactez-nous pour cette option</span>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Chargement initial */}
            {loadingStatus && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={24} className="animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
                </div>
            )}

            {/* Encart sécurité */}
            <div
                className="rounded-2xl border p-5 flex items-start gap-4"
                style={{ background: '#0f1117', borderColor: 'rgba(255,255,255,0.05)' }}
            >
                <Shield size={16} style={{ color: '#f5a623', flexShrink: 0, marginTop: 2 }} />
                <div className="space-y-1">
                    <p className="text-xs font-medium text-white">Vos données sont sécurisées</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        Vos tokens d'accès Meta sont chiffrés (AES-256) et stockés côté serveur uniquement. Ivoire Agents n'a jamais accès à vos messages personnels, uniquement aux messages envoyés à votre numéro professionnel.
                    </p>
                </div>
            </div>
        </div>
    );
}

// Extend Window for temp signup data
declare global {
    interface Window {
        __waSignupData?: { waba_id?: string; phone_number_id?: string };
    }
}
