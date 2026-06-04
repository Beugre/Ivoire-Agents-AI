'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Users, Phone, MessageSquare, Tag, StickyNote, X, Check } from 'lucide-react';

interface Customer {
    id: string;
    name?: string;
    phone: string;
    email?: string;
    waId?: string;
    segment: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

const SEGMENTS: Record<string, { label: string; color: string }> = {
    prospect: { label: 'Prospect', color: '#f5a623' },
    client: { label: 'Client', color: '#22c55e' },
    vip: { label: 'VIP', color: '#a855f7' },
    inactif: { label: 'Inactif', color: 'rgba(255,255,255,0.2)' },
};

const inp: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'white', borderRadius: '10px', padding: '9px 14px',
    fontSize: '13px', width: '100%', outline: 'none',
};

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Customer | null>(null);
    const [editNotes, setEditNotes] = useState('');
    const [savingNote, setSavingNote] = useState(false);
    const [search, setSearch] = useState('');

    const fetchCustomers = async () => {
        try {
            const { data } = await api.get('/customers?limit=100');
            setCustomers(data.data ?? data);
            setTotal(data.total ?? (data.data ?? data).length);
        } catch { toast.error('Erreur chargement'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchCustomers(); }, []);
    useEffect(() => { if (selected) setEditNotes(selected.notes ?? ''); }, [selected]);

    const handleSegment = async (id: string, segment: string) => {
        try {
            await api.patch(`/customers/${id}`, { segment });
            setCustomers((prev) => prev.map((c) => c.id === id ? { ...c, segment } : c));
            if (selected?.id === id) setSelected((prev) => prev ? { ...prev, segment } : null);
            toast.success('Segment mis à jour');
        } catch { toast.error('Erreur'); }
    };

    const handleSaveNote = async () => {
        if (!selected) return;
        setSavingNote(true);
        try {
            await api.patch(`/customers/${selected.id}`, { notes: editNotes });
            setCustomers((prev) => prev.map((c) => c.id === selected.id ? { ...c, notes: editNotes } : c));
            setSelected((prev) => prev ? { ...prev, notes: editNotes } : null);
            toast.success('Note sauvegardée');
        } catch { toast.error('Erreur'); }
        finally { setSavingNote(false); }
    };

    const filtered = customers.filter((c) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (c.name ?? '').toLowerCase().includes(q) || c.phone.includes(q);
    });

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

    const segmentCounts = Object.keys(SEGMENTS).reduce((acc, key) => {
        acc[key] = customers.filter((c) => (c.segment ?? 'prospect') === key).length;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="min-h-screen" style={{ background: '#080a10' }}>
            <div className="px-8 py-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <Users className="w-5 h-5" style={{ color: '#f5a623' }} />
                            CRM Clients
                        </h1>
                        <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{total} clients enregistrés</p>
                    </div>
                    {/* Segment KPIs */}
                    <div className="flex items-center gap-3">
                        {Object.entries(SEGMENTS).map(([key, seg]) => (
                            <div key={key} className="text-center px-4 py-2 rounded-xl border" style={{ background: seg.color + '08', borderColor: seg.color + '25' }}>
                                <p className="text-[18px] font-bold" style={{ color: seg.color }}>{segmentCounts[key] ?? 0}</p>
                                <p className="text-[10px] font-medium" style={{ color: seg.color + 'bb' }}>{seg.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-4 max-w-xs">
                    <input style={inp} placeholder="Rechercher par nom ou téléphone..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            </div>

            <div className="flex h-[calc(100vh-160px)]">
                {/* Table */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-6 space-y-3">
                            {Array(8).fill(0).map((_, i) => (
                                <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Users className="w-10 h-10 mb-3 opacity-10 text-white" />
                            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                {search ? 'Aucun résultat pour cette recherche' : 'Aucun client pour le moment'}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                                    {['Client', 'Téléphone', 'Segment', 'Depuis', 'Dernière activité'].map((h) => (
                                        <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                                            style={{ color: 'rgba(255,255,255,0.2)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((c) => {
                                    const seg = SEGMENTS[c.segment ?? 'prospect'] ?? SEGMENTS.prospect;
                                    const isSelected = selected?.id === c.id;
                                    return (
                                        <tr key={c.id} onClick={() => setSelected(isSelected ? null : c)}
                                            className="border-b cursor-pointer transition-colors"
                                            style={{
                                                borderColor: 'rgba(255,255,255,0.03)',
                                                background: isSelected ? 'rgba(245,166,35,0.04)' : 'transparent',
                                            }}
                                            onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'; }}
                                            onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                                                        style={{ background: seg.color + '15', color: seg.color }}>
                                                        {(c.name ?? c.phone)[0].toUpperCase()}
                                                    </div>
                                                    <span className="text-[13px] font-medium text-white">{c.name ?? '—'}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5 text-[12px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                                    <Phone className="w-3 h-3" />{c.phone}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-[11px] px-2 py-1 rounded-full font-semibold"
                                                    style={{ background: seg.color + '15', color: seg.color }}>
                                                    {seg.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-[12px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{formatDate(c.createdAt)}</td>
                                            <td className="px-5 py-4 text-[12px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{formatDate(c.updatedAt)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Fiche client */}
                {selected && (
                    <div className="w-72 flex-shrink-0 border-l overflow-y-auto" style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#0a0d16' }}>
                        <div className="p-5 border-b flex items-start justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                            <div>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold mb-3"
                                    style={{ background: (SEGMENTS[selected.segment ?? 'prospect']?.color ?? '#f5a623') + '18', color: SEGMENTS[selected.segment ?? 'prospect']?.color ?? '#f5a623' }}>
                                    {(selected.name ?? selected.phone)[0].toUpperCase()}
                                </div>
                                <p className="text-[14px] font-bold text-white">{selected.name ?? 'Inconnu'}</p>
                                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{selected.phone}</p>
                            </div>
                            <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Segment */}
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                    <Tag className="w-3 h-3" />Segment
                                </p>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {Object.entries(SEGMENTS).map(([key, seg]) => (
                                        <button key={key} onClick={() => handleSegment(selected.id, key)}
                                            className="py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1"
                                            style={(selected.segment ?? 'prospect') === key
                                                ? { background: seg.color + '18', color: seg.color, border: `1px solid ${seg.color}40` }
                                                : { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            {(selected.segment ?? 'prospect') === key && <Check className="w-3 h-3" />}
                                            {seg.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                    <StickyNote className="w-3 h-3" />Notes internes
                                </p>
                                <textarea rows={4}
                                    style={{ ...inp, resize: 'none', fontFamily: 'inherit', fontSize: '12px', lineHeight: '1.5' }}
                                    placeholder="Notez des informations utiles sur ce client..."
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)} />
                                <button onClick={handleSaveNote} disabled={savingNote}
                                    className="mt-2 w-full py-2 rounded-xl text-[12px] font-semibold disabled:opacity-40 transition-all"
                                    style={{ background: 'rgba(245,166,35,0.12)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.2)' }}>
                                    {savingNote ? 'Sauvegarde...' : 'Sauvegarder'}
                                </button>
                            </div>

                            {/* Info */}
                            <div className="space-y-2">
                                <p className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                    <MessageSquare className="w-3 h-3" />Infos
                                </p>
                                <div className="space-y-1.5">
                                    {selected.email && (
                                        <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>📧 {selected.email}</p>
                                    )}
                                    <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                        Client depuis le {formatDate(selected.createdAt)}
                                    </p>
                                    <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                        Dernière activité : {formatDate(selected.updatedAt)}
                                    </p>
                                </div>
                            </div>

                            <a href={`/conversations?customer=${selected.id}`}
                                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[12px] font-semibold transition-all hover:opacity-80"
                                style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>
                                <MessageSquare className="w-3.5 h-3.5" />Voir les conversations
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
