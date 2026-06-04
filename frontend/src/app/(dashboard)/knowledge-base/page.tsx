'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

interface KBItem {
    id: string;
    title: string;
    content: string;
    category: string;
    agentId: string;
}

interface Agent { id: string; name: string; }

const CATEGORIES = [
    { value: 'product', label: '📦 Produit' },
    { value: 'service', label: '⚙️ Service' },
    { value: 'price', label: '💰 Prix' },
    { value: 'schedule', label: '🕐 Horaires' },
    { value: 'address', label: '📍 Adresse' },
    { value: 'faq', label: '❓ FAQ' },
    { value: 'delivery', label: '🚚 Livraison' },
    { value: 'payment', label: '💳 Paiement' },
    { value: 'contact', label: '📞 Contact' },
    { value: 'other', label: '📝 Autre' },
];

export default function KnowledgeBasePage() {
    const [items, setItems] = useState<KBItem[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editItem, setEditItem] = useState<KBItem | null>(null);

    const { register, handleSubmit, reset, setValue } = useForm<{
        title: string;
        content: string;
        category: string;
        agentId: string;
    }>({
        defaultValues: { category: 'other' },
    });

    const fetchData = async () => {
        try {
            const [agentsRes, kbRes] = await Promise.all([
                api.get('/agents'),
                api.get('/knowledge-base'),
            ]);
            setAgents(agentsRes.data);
            setItems(kbRes.data);
            if (agentsRes.data.length > 0 && !selectedAgent) {
                setSelectedAgent(agentsRes.data[0].id);
            }
        } catch {
            toast.error('Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const filteredItems = selectedAgent
        ? items.filter((i) => i.agentId === selectedAgent)
        : items;

    const onSubmit = async (data: any) => {
        try {
            if (editItem) {
                await api.patch(`/knowledge-base/${editItem.id}`, data);
                toast.success('Mis à jour !');
            } else {
                await api.post('/knowledge-base', { ...data, agentId: selectedAgent });
                toast.success('Ajouté !');
            }
            setOpen(false);
            setEditItem(null);
            reset();
            fetchData();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Erreur');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer cet élément ?')) return;
        await api.delete(`/knowledge-base/${id}`);
        toast.success('Supprimé');
        fetchData();
    };

    const openEdit = (item: KBItem) => {
        setEditItem(item);
        setValue('title', item.title);
        setValue('content', item.content);
        setValue('category', item.category);
        setValue('agentId', item.agentId);
        setOpen(true);
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Base de connaissances</h1>
                    <p className="text-gray-500 mt-1">
                        Informez votre agent sur vos produits, services, horaires et plus encore
                    </p>
                </div>

                <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditItem(null); reset(); } }}>
                    <DialogTrigger asChild>
                        <Button className="bg-green-600 hover:bg-green-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter une info
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editItem ? 'Modifier' : 'Ajouter une information'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {!editItem && (
                                <div className="space-y-2">
                                    <Label>Agent concerné</Label>
                                    <select
                                        className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                                        value={selectedAgent}
                                        onChange={(e) => setSelectedAgent(e.target.value)}
                                    >
                                        {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label>Catégorie</Label>
                                <select
                                    className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                                    {...register('category')}
                                >
                                    {CATEGORIES.map((c) => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Titre *</Label>
                                <Input placeholder="Ex: Plats du jour, Horaires d'ouverture..." {...register('title', { required: true })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Contenu *</Label>
                                <Textarea
                                    rows={4}
                                    placeholder="Décrivez l'information en détail..."
                                    {...register('content', { required: true })}
                                />
                            </div>
                            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                                {editItem ? 'Mettre à jour' : 'Ajouter'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filtre par agent */}
            {agents.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                    {agents.map((a) => (
                        <Button
                            key={a.id}
                            variant={selectedAgent === a.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedAgent(a.id)}
                            className={selectedAgent === a.id ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                            {a.name}
                        </Button>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="space-y-3">
                    {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
            ) : filteredItems.length === 0 ? (
                <Card className="text-center py-16">
                    <CardContent>
                        <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-600">Base de connaissances vide</h3>
                        <p className="text-gray-400 mt-2 max-w-sm mx-auto">
                            Ajoutez vos produits, horaires, tarifs et conditions pour que votre agent puisse répondre avec précision.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredItems.map((item) => {
                        const cat = CATEGORIES.find((c) => c.value === item.category);
                        return (
                            <Card key={item.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <Badge variant="outline" className="text-xs mb-2">{cat?.label ?? item.category}</Badge>
                                            <CardTitle className="text-base">{item.title}</CardTitle>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600" onClick={() => handleDelete(item.id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <p className="text-sm text-gray-600 line-clamp-3">{item.content}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
