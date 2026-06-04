'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, BookOpen, Sparkles, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

interface KBItem { id: string; title: string; content: string; category: string; agentId: string; }
interface Agent { id: string; name: string; }

const CATEGORIES = [
    { value: 'product', label: 'Produit', emoji: '📦' },
    { value: 'service', label: 'Service', emoji: '⚙️' },
    { value: 'price', label: 'Prix & Tarifs', emoji: '💰' },
    { value: 'schedule', label: 'Horaires', emoji: '🕐' },
    { value: 'address', label: 'Localisation', emoji: '📍' },
    { value: 'faq', label: 'FAQ', emoji: '❓' },
    { value: 'delivery', label: 'Livraison', emoji: '🚚' },
    { value: 'payment', label: 'Paiement', emoji: '💳' },
    { value: 'contact', label: 'Contact', emoji: '📞' },
    { value: 'other', label: 'Autre', emoji: '📝' },
];

const TEMPLATES = [
    { category: 'schedule', title: 'Horaires d\'ouverture', content: 'Nous sommes ouverts du lundi au samedi de 8h à 18h. Le dimanche de 9h à 14h.' },
    { category: 'address', title: 'Notre adresse & localisation', content: 'Nous sommes situés à [Quartier], [Rue], [Ville]. Point de repère : à 100m de [repère connu]. Lien Google Maps : [lien]' },
    { category: 'payment', title: 'Moyens de paiement acceptés', content: 'Nous acceptons : Cash, MTN Mobile Money, Orange Money, Wave. Aucune carte bancaire pour le moment.' },
    { category: 'delivery', title: 'Politique de livraison', content: 'Livraison disponible dans un rayon de 10km. Délai : 30 à 60 minutes. Frais : 500 FCFA à 1 500 FCFA selon la distance.' },
    { category: 'faq', title: 'Puis-je passer commande par WhatsApp ?', content: 'Oui ! Envoyez-nous simplement votre commande et votre adresse. Nous confirmons sous 5 minutes.' },
    { category: 'price', title: 'Tarifs & Promotions', content: 'Nos prix varient selon les produits. Consultez notre menu/catalogue. Promotion en cours : [décrire la promo]' },
];

const CAT_COLORS: Record<string, string> = {
    product: '#f5a623', service: '#818cf8', price: '#22c55e',
    schedule: '#38bdf8', address: '#fb923c', faq: '#a78bfa',
    delivery: '#34d399', payment: '#f472b6', contact: '#94a3b8', other: 'rgba(255,255,255,0.3)',
};

const inputCls = 'w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none transition-all';
const inputSty = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' };

export default function KnowledgeBasePage() {
    const [items, setItems] = useState<KBItem[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editItem, setEditItem] = useState<KBItem | null>(null);

    const { register, handleSubmit, reset, setValue, watch } = useForm<{
        title: string; content: string; category: string; agentId: string;
    }>({ defaultValues: { category: 'other' } });

    const fetchData = async () => {
        try {
            const [agentsRes, kbRes] = await Promise.all([api.get('/agents'), api.get('/knowledge-base')]);
            setAgents(agentsRes.data);
            setItems(kbRes.data);
            if (agentsRes.data.length > 0 && !selectedAgent) setSelectedAgent(agentsRes.data[0].id);
        } catch { toast.error('Erreur de chargement'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const filteredItems = selectedAgent ? items.filter((i) => i.agentId === selectedAgent) : items;

    const onSubmit = async (data: any) => {
        try {
            if (editItem) {
                await api.patch(`/knowledge-base/${editItem.id}`, data);
                toast.success('Mis à jour !');
            } else {
                await api.post('/knowledge-base', { ...data, agentId: selectedAgent });
                toast.success('Information ajoutée !');
            }
            setOpen(false); setEditItem(null); reset(); fetchData();
        } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Erreur'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer ?')) return;
        await api.delete(`/knowledge-base/${id}`);
        toast.success('Supprimé'); fetchData();
    };

    const openEdit = (item: KBItem) => {
        setEditItem(item);
        setValue('title', item.title); setValue('content', item.content);
        setValue('category', item.category); setValue('agentId', item.agentId);
        setOpen(true);
    };

    const applyTemplate = (t: typeof TEMPLATES[0]) => {
        setValue('category', t.category); setValue('title', t.title); setValue('content', t.content);
    };

    const focusStyle = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'rgba(245,166,35,0.5)');
    const blurStyle = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)');

    return (
        <div className="p-8 space-y-8 min-h-screen" style={{ background: '#0b0d15' }}>
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Base de connaissances</h1>
                    <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        Tout ce que votre agent doit savoir pour répondre à vos clients
                    </p>
                </div>
                <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditItem(null); reset(); } }}>
                    <DialogTrigger asChild>
                        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                            style={{ background: 'linear-gradient(135deg, #f5a623, #f7b84b)', color: '#1a0e00' }}>
                            <Plus className="w-4 h-4" /> Ajouter une info
                        </button>
                    </DialogTrigger>
                    <DialogContent style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }}>
                        <DialogHeader>
                            <DialogTitle className="text-white">{editItem ? 'Modifier' : 'Ajouter une information'}</DialogTitle>
                        </DialogHeader>
                        {/* Templates rapides */}
                        {!editItem && (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                    <Sparkles className="inline w-3 h-3 mr-1" />Templates rapides
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {TEMPLATES.map((t) => {
                                        const cat = CATEGORIES.find((c) => c.value === t.category);
                                        return (
                                            <button key={t.title} onClick={() => applyTemplate(t)}
                                                className="text-[11px] px-2.5 py-1 rounded-lg transition-all hover:scale-105"
                                                style={{ background: 'rgba(245,166,35,0.08)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.15)' }}>
                                                {cat?.emoji} {cat?.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 mt-2">
                            {!editItem && agents.length > 1 && (
                                <div className="space-y-1.5">
                                    <label className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Agent</label>
                                    <select className={inputCls} style={{ ...inputSty, colorScheme: 'dark' }}
                                        value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)}
                                        onFocus={focusStyle} onBlur={blurStyle}>
                                        {agents.map((a) => <option key={a.id} value={a.id} style={{ background: '#13151f' }}>{a.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Catégorie</label>
                                <select className={inputCls} style={{ ...inputSty, colorScheme: 'dark' }}
                                    {...register('category')} onFocus={focusStyle} onBlur={blurStyle}>
                                    {CATEGORIES.map((c) => <option key={c.value} value={c.value} style={{ background: '#13151f' }}>{c.emoji} {c.label}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Titre *</label>
                                <input type="text" placeholder="Ex: Horaires d'ouverture"
                                    className={inputCls} style={inputSty}
                                    {...register('title', { required: true })}
                                    onFocus={focusStyle} onBlur={blurStyle} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Contenu *</label>
                                <textarea rows={4} placeholder="Décrivez l'information en détail..."
                                    className={`${inputCls} resize-none`} style={inputSty}
                                    {...register('content', { required: true })}
                                    onFocus={focusStyle} onBlur={blurStyle} />
                            </div>
                            <button type="submit"
                                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
                                style={{ background: 'linear-gradient(135deg, #f5a623, #f7b84b)', color: '#1a0e00' }}>
                                {editItem ? 'Mettre à jour' : 'Ajouter'}
                            </button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Agent filter */}
            {agents.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                    {agents.map((a) => (
                        <button key={a.id} onClick={() => setSelectedAgent(a.id)}
                            className="px-3 py-1.5 rounded-xl text-[13px] font-medium transition-all"
                            style={selectedAgent === a.id
                                ? { background: 'rgba(245,166,35,0.12)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.25)' }
                                : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.06)' }
                            }>
                            {a.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Items by category */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array(4).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-28 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
                    ))}
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="rounded-2xl border py-16 text-center" style={{ background: '#13151f', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20 text-white" />
                    <p className="font-medium text-white mb-1">Base de connaissances vide</p>
                    <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        Ajoutez vos produits, horaires, tarifs et plus pour que votre agent réponde avec précision.
                    </p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                        💡 Utilisez les templates rapides dans le formulaire pour démarrer vite
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredItems.map((item) => {
                        const cat = CATEGORIES.find((c) => c.value === item.category);
                        const accent = CAT_COLORS[item.category] ?? 'rgba(255,255,255,0.3)';
                        return (
                            <div key={item.id} className="rounded-2xl p-5 border group hover:border-opacity-50 transition-all"
                                style={{ background: '#13151f', borderColor: 'rgba(255,255,255,0.06)' }}>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">{cat?.emoji}</span>
                                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg"
                                            style={{ background: accent + '18', color: accent }}>
                                            {cat?.label ?? item.category}
                                        </span>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(item)}
                                            className="p-1.5 rounded-lg transition-all hover:bg-white/5"
                                            style={{ color: 'rgba(255,255,255,0.4)' }}>
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)}
                                            className="p-1.5 rounded-lg transition-all hover:bg-red-500/10 hover:text-red-400"
                                            style={{ color: 'rgba(255,255,255,0.4)' }}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <p className="font-semibold text-white text-[13px] mb-1.5">{item.title}</p>
                                <p className="text-[13px] line-clamp-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.content}</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}


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
