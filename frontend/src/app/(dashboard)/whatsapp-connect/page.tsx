'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
    CheckCircle2, XCircle, Loader2, AlertTriangle,
    Zap, Shield, WifiOff, ChevronRight,
} from 'lucide-react';

interface BaileysStatus {
    status: 'not_started' | 'qr_pending' | 'connected' | 'disconnected';
    qr?: string;
    phoneNumber?: string;
    displayName?: string;
}

interface MetaStatus {
    connected: boolean;
    displayPhoneNumber?: string;
    qualityRating?: string;
    webhookStatus?: string;
    tokenExpiresAt?: string;
}

declare global {
    interface Window {
        FB: any;
        fbAsyncInit: () => void;
        __waSignupData?: { waba_id?: string; phone_number_id?: string };
    }
}

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID ?? '';

export default function WhatsAppConnectPage() {
    const { company } = useAuthStore();
    const [tab, setTab] = useState<'qr' | 'meta'>('qr');

    // ── Baileys ────────────────────────────────────────────────────────────
    const [baileys, setBaileys] = useState<BaileysStatus>({ status: 'not_started' });
    const [startingSession, setStartingSession] = useState(false);
    const [disconnectingQR, setDisconnectingQR] = useState(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Meta ───────────────────────────────────────────────────────────────
    const [metaStatus, setMetaStatus] = useState<MetaStatus | null>(null);
    const [metaSdkReady, setMetaSdkReady] = useState(false);
    const [connectingMeta, setConnectingMeta] = useState(false);
    const [testingMeta, setTestingMeta] = useState(false);

    // Chargement initial
    useEffect(() => {
        api.get<BaileysStatus>('/baileys/status').then((r) => setBaileys(r.data)).catch(() => { });
        api.get<MetaStatus>('/whatsapp-connect/status').then((r) => setMetaStatus(r.data)).catch(() => { });
    }, []);

    // Polling Baileys
    useEffect(() => {
        if (baileys.status === 'qr_pending') {
            if (!pollRef.current) {
                pollRef.current = setInterval(async () => {
                    try {
                        const r = await api.get<BaileysStatus>('/baileys/status');
                        // Ne mettre à jour que si le statut ou le QR a changé
                        setBaileys((prev) => {
                            if (prev.status === r.data.status && prev.qr === r.data.qr) return prev;
                            return r.data;
                        });
                        if (r.data.status === 'connected') {
                            clearInterval(pollRef.current!);
                            pollRef.current = null;
                            toast.success(`WhatsApp connecté — ${r.data.displayName ?? r.data.phoneNumber}`);
                        }
                    } catch { }
                }, 10000);
            }
        } else {
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        }
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [baileys.status]);

    const handleStartQR = async () => {
        setStartingSession(true);
        try {
            await api.post('/baileys/start-session');
            setBaileys({ status: 'qr_pending' });
            toast('Génération du QR code en cours…');
        } catch { toast.error('Erreur lors du démarrage.'); }
        finally { setStartingSession(false); }
    };

    const handleDisconnectQR = async () => {
        if (!confirm('Déconnecter ce numéro WhatsApp ?')) return;
        setDisconnectingQR(true);
        try {
            await api.delete('/baileys/session');
            setBaileys({ status: 'not_started' });
            toast.success('WhatsApp déconnecté.');
        } catch { toast.error('Erreur déconnexion.'); }
        finally { setDisconnectingQR(false); }
    };

    // Meta SDK
    useEffect(() => {
        if (!META_APP_ID || tab !== 'meta') return;
        const handleMsg = (event: MessageEvent) => {
            if (event.origin !== 'https://www.facebook.com' && event.origin !== 'https://web.facebook.com') return;
            try {
                const d = JSON.parse(event.data as string);
                if (d.type === 'WA_EMBEDDED_SIGNUP' && d.event === 'FINISH') window.__waSignupData = d.data;
            } catch { }
        };
        window.addEventListener('message', handleMsg);
        window.fbAsyncInit = () => {
            window.FB.init({ appId: META_APP_ID, cookie: true, xfbml: true, version: 'v19.0' });
            setMetaSdkReady(true);
        };
        if (!document.getElementById('facebook-jssdk')) {
            const s = document.createElement('script');
            s.id = 'facebook-jssdk';
            s.src = 'https://connect.facebook.net/fr_FR/sdk.js';
            s.async = true; s.defer = true; s.crossOrigin = 'anonymous';
            document.head.appendChild(s);
        } else { setMetaSdkReady(true); }
        return () => window.removeEventListener('message', handleMsg);
    }, [tab]);

    const handleConnectMeta = useCallback(() => {
        if (!metaSdkReady || !window.FB) { toast.error('SDK Meta non chargé.'); return; }
        setConnectingMeta(true);
        const t = setTimeout(() => { setConnectingMeta(false); toast.error('Popup fermée ou bloquée.'); }, 90000);
        window.FB.login(async (response: any) => {
            clearTimeout(t);
            if (response.status !== 'connected' || !response.authResponse) {
                setConnectingMeta(false);
                if (response.status !== 'unknown') toast.error('Connexion annulée.');
                return;
            }
            const waData = window.__waSignupData ?? {};
            try {
                const r = await api.post<MetaStatus>('/whatsapp-connect/embedded-signup', {
                    accessToken: response.authResponse.accessToken,
                    wabaId: waData.waba_id,
                    phoneNumberId: waData.phone_number_id,
                });
                setMetaStatus(r.data);
                toast.success('WhatsApp Business connecté !');
            } catch (err: any) {
                toast.error(err?.response?.data?.message ?? 'Erreur connexion.');
            } finally { setConnectingMeta(false); window.__waSignupData = undefined; }
        }, {
            scope: 'business_management,whatsapp_business_management,whatsapp_business_messaging',
            extras: { feature: 'whatsapp_embedded_signup', sessionInfoVersion: 2 },
        });
    }, [metaSdkReady]);

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-white">Connexion WhatsApp</h1>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Connectez votre numéro — votre agent IA répondra automatiquement à vos clients.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {([
                    { key: 'qr', label: 'Votre numéro (QR code)', badge: 'Recommandé' as string | undefined },
                    { key: 'meta', label: 'WhatsApp Business API', badge: undefined as string | undefined },
                ] as const).map((t) => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition"
                        style={{
                            background: tab === t.key ? 'rgba(255,255,255,0.08)' : 'transparent',
                            color: tab === t.key ? 'white' : 'rgba(255,255,255,0.4)',
                            border: `1px solid ${tab === t.key ? 'rgba(255,255,255,0.12)' : 'transparent'}`,
                        }}>
                        {t.label}
                        {t.badge && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                                {t.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── TAB QR ── */}
            {tab === 'qr' && (
                <div className="space-y-4">
                    {baileys.status === 'connected' && (
                        <div className="rounded-2xl border p-6 space-y-4"
                            style={{ background: '#0f1117', borderColor: 'rgba(34,197,94,0.25)' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                                    style={{ background: 'rgba(34,197,94,0.12)' }}>
                                    <CheckCircle2 size={22} style={{ color: '#22c55e' }} />
                                </div>
                                <div>
                                    <p className="text-white font-semibold">WhatsApp connecté</p>
                                    <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                        {baileys.displayName && `${baileys.displayName} — `}+{baileys.phoneNumber}
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-xl p-3 text-xs"
                                style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', color: 'rgba(255,255,255,0.55)' }}>
                                ✅ Votre numéro reste actif sur votre téléphone. Vos clients peuvent écrire à votre numéro habituel.
                            </div>
                            <button onClick={handleDisconnectQR} disabled={disconnectingQR}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                                style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                                {disconnectingQR ? <Loader2 size={14} className="animate-spin" /> : <WifiOff size={14} />}
                                Déconnecter
                            </button>
                        </div>
                    )}

                    {baileys.status === 'qr_pending' && (
                        <div className="rounded-2xl border p-6 space-y-5"
                            style={{ background: '#0f1117', borderColor: 'rgba(255,255,255,0.07)' }}>
                            <div className="flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin" style={{ color: '#f5a623' }} />
                                <p className="text-sm font-medium text-white">
                                    {baileys.qr ? 'Scannez ce QR code avec WhatsApp' : 'Génération du QR code…'}
                                </p>
                            </div>
                            {baileys.qr ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="p-3 rounded-2xl" style={{ background: 'white' }}>
                                        <img src={baileys.qr} alt="QR WhatsApp" width={220} height={220} />
                                    </div>
                                    <div className="text-center space-y-1.5">
                                        {['1. Ouvrez WhatsApp sur votre téléphone',
                                            '2. Appuyez sur ⋮ (ou Paramètres) → Appareils connectés',
                                            '3. Appuyez sur "Associer un appareil" et scannez'].map((s) => (
                                                <p key={s} className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{s}</p>
                                            ))}
                                    </div>
                                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                        Le QR se régénère automatiquement si vous êtes trop long — scannez-le dès qu&apos;il apparaît
                                    </p>
                                </div>
                            ) : (
                                <div className="flex justify-center py-10">
                                    <Loader2 size={32} className="animate-spin" style={{ color: 'rgba(255,255,255,0.15)' }} />
                                </div>
                            )}
                        </div>
                    )}

                    {(baileys.status === 'not_started' || baileys.status === 'disconnected') && (
                        <div className="rounded-2xl border p-6 space-y-5"
                            style={{ background: '#0f1117', borderColor: 'rgba(255,255,255,0.07)' }}>
                            <div className="space-y-3">
                                {[
                                    'Cliquez sur "Connecter mon WhatsApp"',
                                    'Un QR code apparaît — scannez-le avec votre téléphone (comme WhatsApp Web)',
                                    "Votre agent IA répond à vos clients automatiquement. Vous pouvez toujours utiliser WhatsApp sur votre téléphone.",
                                ].map((s, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                                            style={{ background: 'rgba(245,166,35,0.15)', color: '#f5a623' }}>
                                            {i + 1}
                                        </span>
                                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{s}</p>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleStartQR} disabled={startingSession}
                                className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl text-sm font-semibold transition"
                                style={{ background: startingSession ? 'rgba(37,211,102,0.35)' : '#25D366', color: 'white' }}>
                                {startingSession ? (
                                    <><Loader2 size={16} className="animate-spin" />Démarrage…</>
                                ) : (
                                    <span>📱 Connecter mon WhatsApp</span>
                                )}
                            </button>
                            <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                Fonctionne avec n&apos;importe quel numéro WhatsApp — personnel ou professionnel
                            </p>
                        </div>
                    )}

                    <div className="rounded-2xl border p-4 flex items-start gap-3"
                        style={{ background: '#0f1117', borderColor: 'rgba(255,255,255,0.05)' }}>
                        <Shield size={14} style={{ color: '#f5a623', flexShrink: 0, marginTop: 2 }} />
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            Fonctionne comme WhatsApp Web — votre numéro reste actif sur votre téléphone. Si le serveur redémarre, la session se reconnecte automatiquement.
                        </p>
                    </div>
                </div>
            )}

            {/* ── TAB META ── */}
            {tab === 'meta' && (
                <div className="space-y-4">
                    {metaStatus?.connected ? (
                        <div className="rounded-2xl border p-6 space-y-4"
                            style={{ background: '#0f1117', borderColor: 'rgba(34,197,94,0.2)' }}>
                            <div className="flex items-center gap-3">
                                <CheckCircle2 size={20} style={{ color: '#22c55e' }} />
                                <div>
                                    <p className="text-white font-semibold text-sm">API Business connectée</p>
                                    <p className="text-xs font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                        {metaStatus.displayPhoneNumber}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={async () => {
                                    setTestingMeta(true);
                                    try {
                                        const r = await api.post<{ success: boolean; message: string }>('/whatsapp-connect/test-message');
                                        if (r.data.success) toast.success(r.data.message); else toast.error(r.data.message);
                                    } catch { toast.error('Erreur test.'); } finally { setTestingMeta(false); }
                                }} disabled={testingMeta}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                                    style={{ background: 'rgba(245,166,35,0.1)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.2)' }}>
                                    {testingMeta ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />} Tester
                                </button>
                                <button onClick={async () => { await api.delete('/whatsapp-connect'); setMetaStatus({ connected: false }); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                                    style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}>
                                    <WifiOff size={12} /> Déconnecter
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl border p-6 space-y-4"
                            style={{ background: '#0f1117', borderColor: 'rgba(255,255,255,0.07)' }}>
                            <p className="text-sm font-medium text-white">WhatsApp Business Cloud API (officiel Meta)</p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                Nécessite un compte WhatsApp Business dédié. Le numéro connecté ne pourra plus être utilisé depuis un téléphone.
                            </p>
                            {!META_APP_ID ? (
                                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                                    style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                                    <XCircle size={14} /> Configuration manquante — contactez le support.
                                </div>
                            ) : (
                                <button onClick={handleConnectMeta} disabled={connectingMeta || !metaSdkReady}
                                    className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl text-sm font-semibold"
                                    style={{ background: 'rgba(24,119,242,0.15)', color: '#4f96ff', border: '1px solid rgba(24,119,242,0.3)' }}>
                                    {connectingMeta ? <><Loader2 size={15} className="animate-spin" />Connexion…</> :
                                        !metaSdkReady ? <><Loader2 size={15} className="animate-spin" />Chargement…</> :
                                            <>Connecter via Meta Business <ChevronRight size={14} /></>}
                                </button>
                            )}
                        </div>
                    )}
                    <div className="rounded-2xl border p-4 flex items-start gap-3"
                        style={{ background: '#0f1117', borderColor: 'rgba(255,255,255,0.05)' }}>
                        <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            Si vous souhaitez garder votre numéro habituel actif sur votre téléphone, utilisez l&apos;onglet &quot;QR code&quot;.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
