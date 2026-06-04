'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Send, Bot, User, UserCheck, RotateCcw, StickyNote, MessageSquare, X, Sparkles, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface Customer { name?: string; phone: string; }
interface Message { id: string; content: string; sender: 'customer' | 'ai' | 'human_agent'; createdAt: string; }
interface Conversation {
    id: string;
    status: 'ai_active' | 'human_requested' | 'human_active' | 'closed';
    channel: string;
    customer?: Customer;
    updatedAt: string;
    createdAt: string;
    leadScore?: number;
    summary?: string;
}

const STATUS = {
    ai_active: { label: 'IA active', color: '#22c55e' },
    human_requested: { label: 'Transfert demandé', color: '#f59e0b' },
    human_active: { label: 'Humain actif', color: '#60a5fa' },
    closed: { label: 'Fermée', color: 'rgba(255,255,255,0.2)' },
};

const inp: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'white', borderRadius: '10px', padding: '9px 14px',
    fontSize: '13px', width: '100%', outline: 'none',
};

export default function ConversationsPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selected, setSelected] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState('');
    const [showNote, setShowNote] = useState(false);
    const [humanReply, setHumanReply] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [summarizing, setSummarizing] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const fetchConversations = async () => {
        try {
            const { data } = await api.get('/conversations');
            setConversations(data.data ?? data);
        } catch { toast.error('Erreur chargement conversations'); }
        finally { setLoading(false); }
    };

    const fetchMessages = async (conv: Conversation) => {
        const { data } = await api.get(`/conversations/${conv.id}/messages`);
        setMessages(data);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    useEffect(() => { fetchConversations(); }, []);
    useEffect(() => { if (selected) fetchMessages(selected); }, [selected]);

    const handleStatusChange = async (status: string) => {
        if (!selected) return;
        try {
            await api.patch(`/conversations/${selected.id}/status`, { status });
            toast.success('Statut mis à jour');
            fetchConversations();
            setSelected((prev) => prev ? { ...prev, status: status as Conversation['status'] } : null);
        } catch { toast.error('Erreur'); }
    };

    const handleSaveNote = async () => {
        if (!selected) return;
        try {
            await api.post(`/conversations/${selected.id}/note`, { note });
            toast.success('Note sauvegardée');
            setShowNote(false);
        } catch { toast.error('Erreur'); }
    };

    const handleSendAsHuman = async () => {
        if (!humanReply.trim() || !selected) return;
        setSendingReply(true);
        try {
            await api.post(`/conversations/${selected.id}/send-human`, { message: humanReply });
            setHumanReply('');
            fetchMessages(selected);
            if (selected.status !== 'human_active') {
                await handleStatusChange('human_active');
            }
        } catch { toast.error("Erreur lors de l'envoi"); }
        finally { setSendingReply(false); }
    };

    const handleSummarize = async () => {
        if (!selected) return;
        setSummarizing(true);
        try {
            const { data } = await api.post(`/conversations/${selected.id}/summarize`);
            setSelected((prev) => prev ? { ...prev, summary: data.summary } : null);
            setShowSummary(true);
            toast.success('Résumé généré');
        } catch { toast.error('Erreur lors de la génération du résumé'); }
        finally { setSummarizing(false); }
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

    const leadBadge = (score?: number) => {
        if (!score) return null;
        if (score >= 70) return { icon: '🔥', color: '#f87171', bg: 'rgba(248,113,113,0.12)' };
        if (score >= 40) return { icon: '⚡', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
        return { icon: '🆕', color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.04)' };
    };

    return (
        <div className="flex h-screen" style={{ background: '#080a10' }}>

            {/* ─── Liste conversations ─── */}
            <div className="w-72 flex-shrink-0 flex flex-col border-r" style={{ background: '#0a0d16', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <h2 className="text-[14px] font-bold text-white flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" style={{ color: '#f5a623' }} />
                        Conversations
                    </h2>
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{conversations.length} au total</p>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 space-y-3">
                            {Array(5).fill(0).map((_, i) => (
                                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
                            ))}
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                            <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-15 text-white" />
                            <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                Aucune conversation.<br />Connectez WhatsApp pour démarrer.
                            </p>
                        </div>
                    ) : (
                        conversations.map((conv) => {
                            const s = STATUS[conv.status] ?? STATUS.ai_active;
                            const isActive = selected?.id === conv.id;
                            return (
                                <button key={conv.id} onClick={() => setSelected(conv)}
                                    className="w-full text-left px-4 py-3.5 border-b transition-colors"
                                    style={{
                                        borderColor: 'rgba(255,255,255,0.04)',
                                        background: isActive ? 'rgba(245,166,35,0.06)' : 'transparent',
                                        borderLeft: isActive ? `2px solid #f5a623` : '2px solid transparent',
                                    }}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[13px] font-semibold text-white truncate pr-2">
                                            {conv.customer?.name ?? conv.customer?.phone ?? 'Client inconnu'}
                                        </span>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            {(() => {
                                                const b = leadBadge(conv.leadScore); return b ? (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: b.bg, color: b.color }}>{b.icon} {conv.leadScore}</span>
                                                ) : null;
                                            })()}
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                                style={{ background: s.color + '18', color: s.color }}>
                                                {s.label}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{formatDate(conv.updatedAt)}</p>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ─── Vue conversation ─── */}
            <div className="flex-1 flex flex-col min-w-0" style={{ background: '#080a10' }}>
                {!selected ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <Bot className="w-12 h-12 mx-auto mb-4 opacity-10 text-white" />
                            <p className="text-[14px] font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>Sélectionnez une conversation</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ background: '#0a0d16', borderColor: 'rgba(255,255,255,0.06)' }}>
                            <div>
                                <h3 className="text-[14px] font-bold text-white">
                                    {selected.customer?.name ?? selected.customer?.phone ?? 'Client'}
                                </h3>
                                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{selected.customer?.phone}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleSummarize} disabled={summarizing}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all disabled:opacity-50"
                                    style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)' }}>
                                    <Sparkles className="w-3.5 h-3.5" />{summarizing ? 'Analyse...' : 'Résumer'}
                                </button>
                                {selected.status !== 'closed' && (
                                    <>
                                        {selected.status === 'ai_active' && (
                                            <button onClick={() => handleStatusChange('human_active')}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all"
                                                style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>
                                                <UserCheck className="w-3.5 h-3.5" />Prendre en main
                                            </button>
                                        )}
                                        {selected.status === 'human_active' && (
                                            <button onClick={() => handleStatusChange('ai_active')}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all"
                                                style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                                                <RotateCcw className="w-3.5 h-3.5" />Réactiver IA
                                            </button>
                                        )}
                                        <button onClick={() => setShowNote(!showNote)}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all"
                                            style={showNote ? { background: 'rgba(245,166,35,0.1)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.2)' } : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                            <StickyNote className="w-3.5 h-3.5" />Note
                                        </button>
                                        <button onClick={() => handleStatusChange('closed')}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all"
                                            style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.15)' }}>
                                            <X className="w-3.5 h-3.5" />Fermer
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Résumé IA */}
                        {selected.summary && showSummary && (
                            <div className="flex-shrink-0 px-5 py-3 border-b" style={{ background: 'rgba(168,85,247,0.06)', borderColor: 'rgba(168,85,247,0.15)' }}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-2">
                                        <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#a855f7' }} />
                                        <p className="text-[12px] leading-relaxed whitespace-pre-line" style={{ color: 'rgba(255,255,255,0.7)' }}>{selected.summary}</p>
                                    </div>
                                    <button onClick={() => setShowSummary(false)} className="flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Note interne */}
                        {showNote && (
                            <div className="flex gap-2 px-5 py-3 border-b flex-shrink-0" style={{ background: 'rgba(245,166,35,0.04)', borderColor: 'rgba(245,166,35,0.15)' }}>
                                <input style={{ ...inp, flex: 1, width: 'auto' }} placeholder="Note interne (non visible par le client)..."
                                    value={note} onChange={(e) => setNote(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveNote()} />
                                <button onClick={handleSaveNote} className="px-4 py-2 rounded-xl text-[12px] font-semibold flex-shrink-0"
                                    style={{ background: 'rgba(245,166,35,0.15)', color: '#f5a623' }}>Sauvegarder</button>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
                            {messages.map((msg) => {
                                const isCustomer = msg.sender === 'customer';
                                const isAi = msg.sender === 'ai';
                                return (
                                    <div key={msg.id} className={cn('flex', isCustomer ? 'justify-start' : 'justify-end')}>
                                        <div className="max-w-xs lg:max-w-md space-y-1">
                                            <div className="flex items-center gap-1.5 px-1" style={{ justifyContent: isCustomer ? 'flex-start' : 'flex-end' }}>
                                                {isCustomer ? <User className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.25)' }} /> : isAi ? <Bot className="w-3 h-3" style={{ color: '#22c55e' }} /> : <UserCheck className="w-3 h-3" style={{ color: '#60a5fa' }} />}
                                                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                                    {isCustomer ? 'Client' : isAi ? 'IA' : 'Vous'}
                                                </span>
                                            </div>
                                            <div className="px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed"
                                                style={isCustomer
                                                    ? { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.85)', borderTopLeftRadius: '4px' }
                                                    : isAi
                                                        ? { background: 'rgba(34,197,94,0.15)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(34,197,94,0.2)', borderTopRightRadius: '4px' }
                                                        : { background: 'rgba(96,165,250,0.15)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(96,165,250,0.2)', borderTopRightRadius: '4px' }}>
                                                {msg.content}
                                            </div>
                                            <p className="text-[10px] px-1" style={{ color: 'rgba(255,255,255,0.15)', textAlign: isCustomer ? 'left' : 'right' }}>
                                                {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={bottomRef} />
                        </div>

                        {/* Human reply zone */}
                        {selected.status !== 'closed' && (
                            <div className="flex-shrink-0 px-5 py-4 border-t" style={{ background: '#0a0d16', borderColor: 'rgba(255,255,255,0.06)' }}>
                                {selected.status !== 'human_active' && (
                                    <p className="text-[11px] mb-2 text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                        Cliquez sur &quot;Prendre en main&quot; pour répondre en tant qu&apos;humain, ou utilisez ce champ pour envoyer un message direct.
                                    </p>
                                )}
                                <div className="flex gap-2">
                                    <input style={inp} placeholder="Répondre en tant qu'humain..."
                                        value={humanReply} onChange={(e) => setHumanReply(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendAsHuman()} />
                                    <button onClick={handleSendAsHuman} disabled={sendingReply || !humanReply.trim()}
                                        className="p-2.5 rounded-xl flex-shrink-0 disabled:opacity-30 transition-colors"
                                        style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
