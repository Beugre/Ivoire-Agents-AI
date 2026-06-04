'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Bot, Settings, Trash2, MessageSquare } from 'lucide-react';
import AgentForm from '@/components/agents/agent-form';
import { toast } from 'sonner';

interface Agent {
    id: string;
    name: string;
    role: string;
    tone: string;
    language: string;
    isActive: boolean;
    createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
    commercial: '💼 Commercial',
    support: '🛠️ Support',
    secretary: '📋 Secrétaire',
    sav: '🔧 SAV',
    reservation: '📅 Réservation',
};

const TONE_LABELS: Record<string, string> = {
    professional: 'Professionnel',
    warm: 'Chaleureux',
    ivorian: 'Ivoirien',
    formal: 'Formel',
    friendly: 'Amical',
};

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editAgent, setEditAgent] = useState<Agent | null>(null);

    const fetchAgents = async () => {
        try {
            const { data } = await api.get('/agents');
            setAgents(data);
        } catch {
            toast.error('Erreur lors du chargement des agents');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAgents(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer cet agent ? Cette action est irréversible.')) return;
        try {
            await api.delete(`/agents/${id}`);
            toast.success('Agent supprimé');
            fetchAgents();
        } catch {
            toast.error('Erreur lors de la suppression');
        }
    };

    const handleSaved = () => {
        setOpen(false);
        setEditAgent(null);
        fetchAgents();
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Mes agents IA</h1>
                    <p className="text-gray-500 mt-1">Créez et gérez vos employés virtuels</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-green-600 hover:bg-green-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Nouvel agent
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editAgent ? "Modifier l'agent" : 'Créer un agent IA'}</DialogTitle>
                        </DialogHeader>
                        <AgentForm agent={editAgent} onSaved={handleSaved} />
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array(3).fill(0).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-6 space-y-3">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-20" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : agents.length === 0 ? (
                <Card className="text-center py-16">
                    <CardContent>
                        <Bot className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-600">Aucun agent créé</h3>
                        <p className="text-gray-400 mt-2">
                            Créez votre premier agent IA pour commencer à automatiser vos réponses clients.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agents.map((agent) => (
                        <Card key={agent.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                            <Bot className="h-5 w-5 text-green-700" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{agent.name}</CardTitle>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {ROLE_LABELS[agent.role] ?? agent.role}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge
                                        variant={agent.isActive ? 'default' : 'outline'}
                                        className={agent.isActive ? 'bg-green-100 text-green-700 text-xs' : 'text-xs'}
                                    >
                                        {agent.isActive ? 'Actif' : 'Inactif'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="text-xs">
                                        {TONE_LABELS[agent.tone] ?? agent.tone}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                        {agent.language === 'ivorian_french' ? '🇨🇮 Français ivoirien' : '🇫🇷 Français'}
                                    </Badge>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Link href={`/conversations?agentId=${agent.id}`} className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full">
                                            <MessageSquare className="h-3.5 w-3.5 mr-1" />
                                            Conversations
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setEditAgent(agent);
                                            setOpen(true);
                                        }}
                                    >
                                        <Settings className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleDelete(agent.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
