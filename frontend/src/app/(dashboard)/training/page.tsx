'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { GraduationCap, ThumbsDown, CheckCircle, RefreshCw, Bot, Lightbulb, AlertTriangle, Trash2 } from 'lucide-react';

interface NegativeFeedback {
    id: string;
    messageId: string;
    conversationId: string;
    correction?: string;
    createdAt: string;
    message?: { content: string; sender: string };
}

interface KbSuggestion {
    id: string;
    question: string;
    suggestedAnswer: string;
    createdAt: string;
}

interface Contradiction {
    id1: string; id2: string;
    title1: string; title2: string;
    reason: string;
}

interface ObsoleteItem {
    id: string;
    title: string;
    reason: string;
}

const inp: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'white', borderRadius: '10px', padding: '9px 14px',
    fontSize: '13px', width: '100%', outline: 'none',
};

export default function TrainingPage() {
    const [feedbacks, setFeedbacks] = useState<NegativeFeedback[]>([]);
    const [suggestions, setSuggestions] = useState<KbSuggestion[]>([]);
    const [contradictions, setContradictions] = useState<Contradiction[]>([]);
    const [obsolete, setObsolete] = useState<ObsoleteItem[]>([]);
    const [corrections, setCorrections] = useState<Record<string, string>>({});
    const [trained, setTrained] = useState<Set<string>>(new Set());
    const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
    const [selectedAgent, setSelectedAgent] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingContradictions, setLoadingContradictions] = useState(false);
    const [loadingObsolete, setLoadingObsolete] = useState(false);

    useEffect(() => {
        Promise.all([
            api.get('/conversations/feedbacks/negative').catch(() => ({ data: [] })),
            api.get('/knowledge-base/suggestions').catch(() => ({ data: [] })),
            api.get('/agents').catch(() => ({ data: [] })),
        ]).then(([fbRes, sugRes, agRes]) => {
            setFeedbacks(Array.isArray(fbRes.data) ? fbRes.data : []);
            setSuggestions(Array.isArray(sugRes.data) ? sugRes.data : []);
            const ags = Array.isArray(agRes.data) ? agRes.data : [];
            setAgents(ags);
            if (ags.length > 0) setSelectedAgent(ags[0].id);
        }).finally(() => setLoading(false));
    }, []);

    const handleTrain = async (fb: NegativeFeedback) => {
        const corr = corrections[fb.id] ?? fb.correction ?? '';
        if (!corr.trim()) { toast.error('Veuillez entrer une correction'); return; }
        if (!selectedAgent) { toast.error('Sélectionnez un agent'); return; }
        const originalMsg = fb.message?.content ?? '';
        try {
            await api.post('/knowledge-base/train', {
                question: originalMsg,
                correction: corr,
                agentId: selectedAgent,
            });
            setTrained((prev) => new Set([...prev, fb.id]));
            toast.success('Entraînement réussi — entrée KB créée ✓');
        } catch { toast.error('Erreur lors de l\'entraînement'); }
    };

    const handleCheckContradictions = async () => {
        setLoadingContradictions(true);
        try {
            const { data } = await api.get('/knowledge-base/check-contradictions');
            setContradictions(Array.isArray(data) ? data : []);
            if (!data.length) toast.success('Aucune contradiction détectée ✓');
        } catch { toast.error('Erreur'); }
        finally { setLoadingContradictions(false); }
    };

    const handleDetectObsolete = async () => {
        setLoadingObsolete(true);
        try {
            const { data } = await api.get('/knowledge-base/detect-obsolete');
            setObsolete(Array.isArray(data) ? data : []);
            if (!data.length) toast.success('Aucune entrée obsolète détectée ✓');
        } catch { toast.error('Erreur'); }
        finally { setLoadingObsolete(false); }
    };

    const handleApproveSuggestion = async (id: string) => {
        try {
            await api.post(`/knowledge-base/suggestions/${id}/approve`);
            setSuggestions((prev) => prev.filter((s) => s.id !== id));
            toast.success('Suggestion approuvée — entrée KB créée ✓');
        } catch { toast.error('Erreur'); }
    };

    const handleDeleteSuggestion = async (id: string) => {
        try {
            await api.delete(`/knowledge-base/suggestions/${id}`);
            setSuggestions((prev) => prev.filter((s) => s.id !== id));
            toast.success('Suggestion supprimée');
        } catch { toast.error('Erreur'); }
    };

    if (loading) {
        return (
            <div className="p-8 min-h-screen" style={{ background: '#080a10' }}>
                <div className="space-y-4 max-w-4xl mx-auto">
                    {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 min-h-screen" style={{ background: '#080a10' }}>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.12)' }}>
                            <GraduationCap className="w-5 h-5" style={{ color: '#f5a623' }} />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Centre d&apos;entraînement</h1>
                    </div>
                    <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        Améliorez l&apos;IA à partir des feedbacks négatifs, gérez les suggestions et maintenez la base de connaissances à jour.
                    </p>
                </div>

                {/* Agent selector */}
                {agents.length > 0 && (
                    <div className="flex items-center gap-3">
                        <span className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Agent cible :</span>
                        <select
                            value={selectedAgent}
                            onChange={(e) => setSelectedAgent(e.target.value)}
                            style={{ ...inp, width: 'auto', minWidth: '200px' }}>
                            {agents.map((a) => (
                                <option key={a.id} value={a.id} style={{ background: '#1a1d2e' }}>{a.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Section 1 — Feedbacks négatifs */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <ThumbsDown className="w-4 h-4" style={{ color: '#f87171' }} />
                        <h2 className="text-[15px] font-semibold text-white">Feedbacks négatifs</h2>
                        <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                            {feedbacks.filter((f) => !trained.has(f.id)).length} à traiter
                        </span>
                    </div>

                    {feedbacks.length === 0 ? (
                        <div className="rounded-2xl p-8 text-center border" style={{ background: '#0f1117', borderColor: 'rgba(255,255,255,0.06)' }}>
                            <CheckCircle className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(34,197,94,0.4)' }} />
                            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Aucun feedback négatif — l&apos;IA répond correctement !</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {feedbacks.map((fb) => {
                                const isDone = trained.has(fb.id);
                                return (
                                    <div key={fb.id} className="rounded-2xl p-5 border" style={{
                                        background: isDone ? 'rgba(34,197,94,0.04)' : '#0f1117',
                                        borderColor: isDone ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)',
                                    }}>
                                        {isDone ? (
                                            <div className="flex items-center gap-2 text-[13px]" style={{ color: '#4ade80' }}>
                                                <CheckCircle className="w-4 h-4" />
                                                Entraîné avec succès
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-start gap-3 mb-3">
                                                    <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#22c55e' }} />
                                                    <div>
                                                        <p className="text-[11px] mb-1 font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>Réponse IA originale</p>
                                                        <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                                                            {fb.message?.content ?? '(message non disponible)'}
                                                        </p>
                                                    </div>
                                                </div>
                                                {fb.correction && (
                                                    <div className="flex items-start gap-3 mb-3 p-3 rounded-xl" style={{ background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.1)' }}>
                                                        <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#f5a623' }} />
                                                        <div>
                                                            <p className="text-[11px] mb-1 font-medium" style={{ color: 'rgba(245,166,35,0.6)' }}>Correction proposée</p>
                                                            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{fb.correction}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex gap-2">
                                                    <input
                                                        style={{ ...inp, flex: 1, fontSize: '12px', padding: '8px 12px' }}
                                                        placeholder={fb.correction ?? 'Entrez la bonne réponse…'}
                                                        value={corrections[fb.id] ?? ''}
                                                        onChange={(e) => setCorrections((prev) => ({ ...prev, [fb.id]: e.target.value }))}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleTrain(fb)}
                                                    />
                                                    <button
                                                        onClick={() => handleTrain(fb)}
                                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold flex-shrink-0"
                                                        style={{ background: 'rgba(245,166,35,0.15)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.2)' }}>
                                                        <GraduationCap className="w-3.5 h-3.5" />Entraîner
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Section 2 — Suggestions KB */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Lightbulb className="w-4 h-4" style={{ color: '#a855f7' }} />
                        <h2 className="text-[15px] font-semibold text-white">Suggestions KB générées par l&apos;IA</h2>
                        <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
                            {suggestions.length} en attente
                        </span>
                    </div>
                    {suggestions.length === 0 ? (
                        <div className="rounded-2xl p-6 text-center border" style={{ background: '#0f1117', borderColor: 'rgba(255,255,255,0.06)' }}>
                            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Aucune suggestion en attente.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {suggestions.map((s) => (
                                <div key={s.id} className="rounded-2xl p-5 border" style={{ background: '#0f1117', borderColor: 'rgba(168,85,247,0.15)' }}>
                                    <p className="text-[12px] font-semibold mb-1" style={{ color: '#a855f7' }}>Question</p>
                                    <p className="text-[13px] text-white mb-3">{s.question}</p>
                                    <p className="text-[12px] font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Réponse suggérée</p>
                                    <p className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.65)' }}>{s.suggestedAnswer}</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApproveSuggestion(s.id)}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold"
                                            style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)' }}>
                                            <CheckCircle className="w-3.5 h-3.5" />Approuver
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSuggestion(s.id)}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px]"
                                            style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                            <Trash2 className="w-3.5 h-3.5" />Ignorer
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Section 3 — Contradictions */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" style={{ color: '#f59e0b' }} />
                            <h2 className="text-[15px] font-semibold text-white">Contradictions dans la KB</h2>
                        </div>
                        <button
                            onClick={handleCheckContradictions}
                            disabled={loadingContradictions}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold disabled:opacity-50"
                            style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <RefreshCw className={`w-3.5 h-3.5 ${loadingContradictions ? 'animate-spin' : ''}`} />
                            {loadingContradictions ? 'Analyse…' : 'Vérifier'}
                        </button>
                    </div>
                    {contradictions.length > 0 && (
                        <div className="space-y-3">
                            {contradictions.map((c, i) => (
                                <div key={i} className="rounded-2xl p-4 border" style={{ background: 'rgba(245,158,11,0.04)', borderColor: 'rgba(245,158,11,0.2)' }}>
                                    <div className="flex items-start gap-2 mb-2">
                                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#f59e0b' }} />
                                        <p className="text-[12px] font-semibold text-white">{c.title1} ↔ {c.title2}</p>
                                    </div>
                                    <p className="text-[12px] pl-5" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.reason}</p>
                                    <div className="mt-3 pl-5">
                                        <a href="/knowledge-base" className="text-[11px] font-semibold underline" style={{ color: '#f59e0b' }}>
                                            Corriger dans la KB →
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Section 4 — Obsolescence */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" style={{ color: '#60a5fa' }} />
                            <h2 className="text-[15px] font-semibold text-white">Entrées potentiellement obsolètes</h2>
                        </div>
                        <button
                            onClick={handleDetectObsolete}
                            disabled={loadingObsolete}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold disabled:opacity-50"
                            style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>
                            <RefreshCw className={`w-3.5 h-3.5 ${loadingObsolete ? 'animate-spin' : ''}`} />
                            {loadingObsolete ? 'Analyse…' : 'Détecter'}
                        </button>
                    </div>
                    {obsolete.length > 0 && (
                        <div className="space-y-3">
                            {obsolete.map((o) => (
                                <div key={o.id} className="rounded-2xl p-4 border" style={{ background: 'rgba(96,165,250,0.04)', borderColor: 'rgba(96,165,250,0.15)' }}>
                                    <p className="text-[13px] font-semibold text-white mb-1">{o.title}</p>
                                    <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{o.reason}</p>
                                    <div className="mt-2">
                                        <a href="/knowledge-base" className="text-[11px] font-semibold underline" style={{ color: '#60a5fa' }}>
                                            Mettre à jour dans la KB →
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
