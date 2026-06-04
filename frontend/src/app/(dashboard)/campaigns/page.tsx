'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Megaphone, Plus, Send, Trash2, Play, CheckCircle, XCircle, Clock, PenLine } from 'lucide-react';

interface Campaign {
    id: string;
    name: string;
    message: string;
    segment?: string;
    status: 'draft' | 'running' | 'done' | 'failed';
    sentCount: number;
    failedCount: number;
    sentAt?: string;
    createdAt: string;
}

const SEGMENTS = [
    { value: '', label: 'Tous les clients' },
    { value: 'prospect', label: 'Prospects' },
    { value: 'client', label: 'Clients' },
    { value: 'vip', label: 'VIP' },
    { value: 'inactif', label: 'Inactifs' },
];

const STATUS_CONFIG = {
    draft: { label: 'Brouillon', color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.06)', icon: PenLine },
    running: { label: 'En cours', color: '#f5a623', bg: 'rgba(245,166,35,0.1)', icon: Play },
    done: { label: 'Envoyée', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: CheckCircle },
    failed: { label: 'Échouée', color: '#f87171', bg: 'rgba(248,113,113,0.1)', icon: XCircle },
};

const inp: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'white', borderRadius: '10px', padding: '9px 14px',
    fontSize: '13px', width: '100%', outline: 'none',
};

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', message: '', segment: '' });
    const [creating, setCreating] = useState(false);
    const [sending, setSending] = useState<string | null>(null);

    const fetchCampaigns = async () => {
        try {
            const { data } = await api.get('/campaigns');
            setCampaigns(Array.isArray(data) ? data : []);
        } catch { toast.error('Erreur chargement campagnes'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchCampaigns(); }, []);

    const handleCreate = async () => {
        if (!form.name.trim() || !form.message.trim()) { toast.error('Nom et message requis'); return; }
        setCreating(true);
        try {
            await api.post('/campaigns', form);
            toast.success('Campagne créée ✓');
            setShowModal(false);
            setForm({ name: '', message: '', segment: '' });
            fetchCampaigns();
        } catch { toast.error('Erreur création'); }
        finally { setCreating(false); }
    };

    const handleSend = async (id: string) => {
        setSending(id);
        try {
            await api.post(`/campaigns/${id}/send`);
            toast.success('Campagne lancée — envoi en cours…');
            fetchCampaigns();
        } catch { toast.error('Erreur envoi'); }
        finally { setSending(null); }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/campaigns/${id}`);
            setCampaigns((prev) => prev.filter((c) => c.id !== id));
            toast.success('Campagne supprimée');
        } catch { toast.error('Erreur suppression'); }
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div className="p-8 min-h-screen" style={{ background: '#080a10' }}>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.12)' }}>
                                <Megaphone className="w-5 h-5" style={{ color: '#f5a623' }} />
                            </div>
                            <h1 className="text-2xl font-bold text-white">Campagnes WhatsApp</h1>
                        </div>
                        <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            Envoyez des messages groupés à vos segments de clients via WhatsApp.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold"
                        style={{ background: 'rgba(245,166,35,0.15)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.25)' }}>
                        <Plus className="w-4 h-4" />Nouvelle campagne
                    </button>
                </div>

                {/* Campaigns list */}
                {loading ? (
                    <div className="space-y-3">
                        {Array(3).fill(0).map((_, i) => (
                            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
                        ))}
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className="rounded-2xl p-12 text-center border" style={{ background: '#0f1117', borderColor: 'rgba(255,255,255,0.06)' }}>
                        <Megaphone className="w-10 h-10 mx-auto mb-4 opacity-15 text-white" />
                        <p className="text-[14px] font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>Aucune campagne</p>
                        <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Créez votre première campagne pour commencer</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {campaigns.map((c) => {
                            const st = STATUS_CONFIG[c.status];
                            const StatusIcon = st.icon;
                            return (
                                <div key={c.id} className="rounded-2xl p-5 border" style={{ background: '#0f1117', borderColor: 'rgba(255,255,255,0.06)' }}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2.5 mb-1.5">
                                                <h3 className="text-[14px] font-semibold text-white">{c.name}</h3>
                                                <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                                                    style={{ background: st.bg, color: st.color }}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {st.label}
                                                </span>
                                                {c.segment && (
                                                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                                                        style={{ background: 'rgba(96,165,250,0.08)', color: '#60a5fa' }}>
                                                        {SEGMENTS.find((s) => s.value === c.segment)?.label ?? c.segment}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[12px] line-clamp-2 mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>{c.message}</p>
                                            <div className="flex items-center gap-4 text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                                <span>Créée le {formatDate(c.createdAt)}</span>
                                                {c.sentAt && <span>Envoyée le {formatDate(c.sentAt)}</span>}
                                                {(c.sentCount > 0 || c.failedCount > 0) && (
                                                    <span className="flex items-center gap-2">
                                                        <span style={{ color: '#22c55e' }}>{c.sentCount} envoyés</span>
                                                        {c.failedCount > 0 && <span style={{ color: '#f87171' }}>{c.failedCount} échoués</span>}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {c.status === 'draft' && (
                                                <button
                                                    onClick={() => handleSend(c.id)}
                                                    disabled={sending === c.id}
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold disabled:opacity-50"
                                                    style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                                                    <Send className="w-3.5 h-3.5" />
                                                    {sending === c.id ? 'Envoi…' : 'Lancer'}
                                                </button>
                                            )}
                                            {c.status === 'running' && (
                                                <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px]"
                                                    style={{ color: '#f5a623' }}>
                                                    <Clock className="w-3.5 h-3.5 animate-spin" />
                                                    En cours…
                                                </div>
                                            )}
                                            {c.status !== 'running' && (
                                                <button
                                                    onClick={() => handleDelete(c.id)}
                                                    className="p-2 rounded-xl transition-all"
                                                    style={{ color: 'rgba(248,113,113,0.5)', background: 'rgba(248,113,113,0.06)' }}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* New campaign modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
                    onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="rounded-2xl p-7 w-full max-w-lg border" style={{ background: '#0f1117', borderColor: 'rgba(255,255,255,0.08)' }}>
                        <h2 className="text-[16px] font-bold text-white mb-6">Nouvelle campagne</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[12px] font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.4)' }}>Nom de la campagne</label>
                                <input
                                    style={inp}
                                    placeholder="Ex: Promo fin d'année"
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="text-[12px] font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.4)' }}>Segment cible</label>
                                <select
                                    style={inp}
                                    value={form.segment}
                                    onChange={(e) => setForm((f) => ({ ...f, segment: e.target.value }))}>
                                    {SEGMENTS.map((s) => (
                                        <option key={s.value} value={s.value} style={{ background: '#1a1d2e' }}>{s.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[12px] font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.4)' }}>Message WhatsApp</label>
                                <textarea
                                    style={{ ...inp, minHeight: '120px', resize: 'vertical' }}
                                    placeholder="Bonjour {{nom}}, nous avons une offre exclusive pour vous…"
                                    value={form.message}
                                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                                />
                                <p className="text-[11px] mt-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                    💡 Utilisez un message simple et direct. Évitez les liens multiples.
                                </p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleCreate}
                                    disabled={creating}
                                    className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold disabled:opacity-50"
                                    style={{ background: 'rgba(245,166,35,0.2)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.3)' }}>
                                    {creating ? 'Création…' : 'Créer la campagne'}
                                </button>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-5 py-2.5 rounded-xl text-[13px] font-medium"
                                    style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                    Annuler
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
