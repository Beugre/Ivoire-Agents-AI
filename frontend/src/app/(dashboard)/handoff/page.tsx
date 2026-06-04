'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface HandoffRequest {
    id: string;
    status: string;
    reason?: string;
    conversationId: string;
    createdAt: string;
}

export default function HandoffPage() {
    const [requests, setRequests] = useState<HandoffRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const { data } = await api.get('/handoff/pending');
            setRequests(data);
        } catch {
            toast.error('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, []);

    const handleAccept = async (convId: string) => {
        await api.post(`/handoff/${convId}/accept`);
        toast.success('Conversation reprise en main');
        fetchRequests();
    };

    const handleResumeAi = async (convId: string) => {
        await api.post(`/handoff/${convId}/resume-ai`);
        toast.success('IA réactivée');
        fetchRequests();
    };

    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Prises en main</h1>
                <p className="text-gray-500 mt-1">
                    Conversations nécessitant votre intervention
                </p>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
            ) : requests.length === 0 ? (
                <Card className="text-center py-16">
                    <CardContent>
                        <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-600">Tout est géré par l'IA</h3>
                        <p className="text-gray-400 mt-2">
                            Aucune conversation en attente de prise en main.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {requests.map((req) => (
                        <Card key={req.id} className="border-orange-200">
                            <CardContent className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium">Transfert demandé</p>
                                        {req.reason && (
                                            <p className="text-xs text-gray-500 mt-0.5">{req.reason}</p>
                                        )}
                                        <p className="text-xs text-gray-400">
                                            {new Date(req.createdAt).toLocaleString('fr-FR')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700"
                                        onClick={() => handleAccept(req.conversationId)}
                                    >
                                        Prendre en main
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleResumeAi(req.conversationId)}
                                    >
                                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                        Réactiver IA
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
