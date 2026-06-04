'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Send, Bot, User, UserCheck, RotateCcw, StickyNote } from 'lucide-react';
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
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    ai_active: { label: 'IA active', color: 'bg-green-100 text-green-700' },
    human_requested: { label: 'Transfert demandé', color: 'bg-orange-100 text-orange-700' },
    human_active: { label: 'Humain actif', color: 'bg-blue-100 text-blue-700' },
    closed: { label: 'Fermée', color: 'bg-gray-100 text-gray-500' },
};

export default function ConversationsPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selected, setSelected] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState('');
    const [showNote, setShowNote] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const fetchConversations = async () => {
        try {
            const { data } = await api.get('/conversations');
            setConversations(data.data);
        } catch {
            toast.error('Erreur chargement conversations');
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (conv: Conversation) => {
        const { data } = await api.get(`/conversations/${conv.id}/messages`);
        setMessages(data);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    useEffect(() => { fetchConversations(); }, []);
    useEffect(() => {
        if (selected) fetchMessages(selected);
    }, [selected]);

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

    return (
        <div className="flex h-screen">
            {/* Liste conversations */}
            <div className="w-80 border-r bg-white flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="font-semibold text-gray-900">Conversations</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 space-y-3">
                            {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded" />)}
                        </div>
                    ) : conversations.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm p-8">
                            Aucune conversation pour le moment.<br />Connectez WhatsApp pour démarrer.
                        </p>
                    ) : (
                        conversations.map((conv) => {
                            const s = STATUS_LABELS[conv.status];
                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelected(conv)}
                                    className={cn(
                                        'w-full text-left p-4 border-b hover:bg-gray-50 transition-colors',
                                        selected?.id === conv.id && 'bg-green-50 border-l-2 border-l-green-500',
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-sm truncate">
                                            {conv.customer?.name ?? conv.customer?.phone ?? 'Client inconnu'}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${s.color}`}>
                                            {s.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        {new Date(conv.updatedAt).toLocaleDateString('fr-FR', {
                                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                                        })}
                                    </p>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Vue conversation */}
            <div className="flex-1 flex flex-col bg-gray-50">
                {!selected ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p>Sélectionnez une conversation</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold">
                                    {selected.customer?.name ?? selected.customer?.phone ?? 'Client'}
                                </h3>
                                <p className="text-xs text-gray-400">{selected.customer?.phone}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {selected.status !== 'closed' && (
                                    <>
                                        {selected.status === 'ai_active' && (
                                            <Button size="sm" variant="outline" onClick={() => handleStatusChange('human_active')}>
                                                <UserCheck className="h-3.5 w-3.5 mr-1" />
                                                Prendre en main
                                            </Button>
                                        )}
                                        {selected.status === 'human_active' && (
                                            <Button size="sm" variant="outline" onClick={() => handleStatusChange('ai_active')}>
                                                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                                Réactiver IA
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setShowNote(!showNote)}
                                        >
                                            <StickyNote className="h-3.5 w-3.5 mr-1" />
                                            Note
                                        </Button>
                                        <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700" onClick={() => handleStatusChange('closed')}>
                                            Fermer
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Note interne */}
                        {showNote && (
                            <div className="bg-yellow-50 border-b px-6 py-3 flex gap-2">
                                <Input
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Ajouter une note interne..."
                                    className="text-sm"
                                />
                                <Button size="sm" onClick={handleSaveNote}>Sauvegarder</Button>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-3">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn('flex', msg.sender === 'customer' ? 'justify-start' : 'justify-end')}
                                >
                                    <div
                                        className={cn(
                                            'max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm',
                                            msg.sender === 'customer'
                                                ? 'bg-white border text-gray-800 rounded-tl-sm'
                                                : msg.sender === 'ai'
                                                    ? 'bg-green-600 text-white rounded-tr-sm'
                                                    : 'bg-blue-600 text-white rounded-tr-sm',
                                        )}
                                    >
                                        <div className="flex items-center gap-1 mb-1 opacity-70 text-xs">
                                            {msg.sender === 'customer' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                                            {msg.sender === 'customer' ? 'Client' : msg.sender === 'ai' ? 'IA' : 'Vous'}
                                        </div>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            <div ref={bottomRef} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
