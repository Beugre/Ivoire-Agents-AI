'use client';

import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '@/lib/api';
import {
    Plus, Trash2, Pencil, ChevronRight, Brain, Sparkles,
    MessageSquare, X, Send, Upload, Check, ArrowLeft, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

/* ─── Types ─────────────────────────────────────────────────── */
interface KBItem { id: string; title: string; content: string; category: string; agentId: string; }
interface Agent { id: string; name: string; }

/* ─── Config modules ─────────────────────────────────────────── */
const MODULES = [
    { value: 'product',  label: 'Produits',     emoji: '📦', color: '#f5a623', desc: 'Vos articles, références, gammes' },
    { value: 'service',  label: 'Services',     emoji: '⚙️', color: '#818cf8', desc: 'Prestations et savoir-faire' },
    { value: 'price',    label: 'Tarifs',        emoji: '💰', color: '#22c55e', desc: 'Prix, promotions, offres' },
    { value: 'schedule', label: 'Horaires',      emoji: '🕐', color: '#38bdf8', desc: "Heures d'ouverture, jours fériés" },
    { value: 'address',  label: 'Localisation',  emoji: '📍', color: '#fb923c', desc: 'Adresse, accès, itinéraire' },
    { value: 'faq',      label: 'FAQ',           emoji: '❓', color: '#a78bfa', desc: 'Questions fréquentes' },
    { value: 'delivery', label: 'Livraison',     emoji: '🚚', color: '#34d399', desc: 'Zones, délais, frais' },
    { value: 'payment',  label: 'Paiement',      emoji: '💳', color: '#f472b6', desc: 'Moyens acceptés, conditions' },
    { value: 'contact',  label: 'Contact',       emoji: '📞', color: '#94a3b8', desc: 'Téléphone, email, réseaux' },
];

const inputBase: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'white',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.15s',
};
const focusBorder = (e: React.FocusEvent<HTMLElement>) => { (e.target as HTMLElement).style.borderColor = 'rgba(245,166,35,0.45)'; };
const blurBorder  = (e: React.FocusEvent<HTMLElement>) => { (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; };

/* ─── ModuleCard ─────────────────────────────────────────────── */
function ModuleCard({ mod, count, onClick }: { mod: typeof MODULES[0]; count: number; onClick: () => void }) {
    const filled = count > 0;
    return (
        <motion.button whileHover={{ y: -3, scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={onClick}
            className="rounded-2xl p-5 text-left w-full flex flex-col gap-2 group relative overflow-hidden"
            style={{ background: filled ? `${mod.color}08` : '#13151f', border: `1px solid ${filled ? mod.color + '30' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer' }}>
            {filled && <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ background: `radial-gradient(circle at 30% 30%, ${mod.color}, transparent 70%)` }} />}
            <div className="flex items-start justify-between">
                <span className="text-2xl">{mod.emoji}</span>
                {filled ? <span className="w-2 h-2 rounded-full mt-1" style={{ background: mod.color }} /> : <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 text-white mt-0.5" />}
            </div>
            <div>
                <p className="text-[13px] font-semibold text-white">{mod.label}</p>
                <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {filled ? `${count} information${count > 1 ? 's' : ''}` : mod.desc}
                </p>
            </div>
            {filled && <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: mod.color }}>Voir et modifier <ChevronRight className="w-3 h-3" /></span>}
        </motion.button>
    );
}

/* ─── ItemRow ────────────────────────────────────────────────── */
function ItemRow({ item, color, onEdit, onDelete }: { item: KBItem; color: string; onEdit: () => void; onDelete: () => void }) {
    return (
        <div className="rounded-xl p-4 border group flex gap-3" style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: color }} />
            <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white">{item.title}</p>
                <p className="text-[12px] mt-0.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.content}</p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.35)' }}><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400" style={{ color: 'rgba(255,255,255,0.35)' }}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
        </div>
    );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function KnowledgeBasePage() {
    const [items, setItems]           = useState<KBItem[]>([]);
    const [agents, setAgents]         = useState<Agent[]>([]);
    const [selectedAgent, setAgent]   = useState<string>('');
    const [loading, setLoading]       = useState(true);
    const [activeModule, setModule]   = useState<string | null>(null);
    const [showAdd, setShowAdd]       = useState(false);
    const [editItem, setEditItem]     = useState<KBItem | null>(null);
    const [form, setForm]             = useState({ title: '', content: '' });
    const [testOpen, setTestOpen]     = useState(false);
    const [testMessages, setTestMsgs] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
    const [testInput, setTestInput]   = useState('');
    const [testLoading, setTestLoad]  = useState(false);
    const testEnd = useRef<HTMLDivElement>(null);
    const [importOpen, setImportOpen] = useState(false);
    const [importText, setImportText] = useState('');
    const [importLoading, setImportLoad] = useState(false);
    const [importPreview, setImportPreview] = useState<{ title: string; content: string; category: string }[]>([]);

    const fetchData = async () => {
        try {
            const [agR, kbR] = await Promise.all([api.get('/agents'), api.get('/knowledge-base')]);
            setAgents(agR.data);
            setItems(kbR.data);
            if (agR.data.length > 0 && !selectedAgent) setAgent(agR.data[0].id);
        } catch { toast.error('Erreur de chargement'); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchData(); }, []);
    useEffect(() => { testEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [testMessages]);

    const filtered = selectedAgent ? items.filter((i) => i.agentId === selectedAgent) : items;
    const countFor = (cat: string) => filtered.filter((i) => i.category === cat).length;
    const filledModules = MODULES.filter((m) => countFor(m.value) > 0).length;
    const score = Math.round((filledModules / MODULES.length) * 100);
    const currentAgent = agents.find((a) => a.id === selectedAgent);
    const activeMod = MODULES.find((m) => m.value === activeModule);
    const moduleItems = activeModule ? filtered.filter((i) => i.category === activeModule) : [];

    const handleSave = async () => {
        if (!form.title.trim() || !form.content.trim()) return toast.error('Titre et contenu requis');
        try {
            if (editItem) {
                await api.patch(`/knowledge-base/${editItem.id}`, form);
                toast.success('Mis à jour !');
            } else {
                await api.post('/knowledge-base', { ...form, category: activeModule ?? 'other', agentId: selectedAgent });
                toast.success('Ajouté !');
            }
            setShowAdd(false); setEditItem(null); setForm({ title: '', content: '' }); fetchData();
        } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Erreur'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer cette information ?')) return;
        await api.delete(`/knowledge-base/${id}`);
        toast.success('Supprimé'); fetchData();
    };

    const openEdit = (item: KBItem) => {
        setEditItem(item); setForm({ title: item.title, content: item.content }); setShowAdd(true);
    };

    const sendTest = async () => {
        if (!testInput.trim() || !selectedAgent) return;
        const q = testInput.trim();
        setTestMsgs((m) => [...m, { role: 'user', text: q }]);
        setTestInput(''); setTestLoad(true);
        try {
            const { data } = await api.post('/knowledge-base/test-agent', { agentId: selectedAgent, question: q });
            setTestMsgs((m) => [...m, { role: 'ai', text: data.answer }]);
        } catch { setTestMsgs((m) => [...m, { role: 'ai', text: '⚠️ Erreur lors de la réponse.' }]); }
        finally { setTestLoad(false); }
    };

    const handleImport = async () => {
        if (!importText.trim()) return;
        setImportLoad(true);
        try {
            const { data } = await api.post('/knowledge-base/import-text', { text: importText, agentId: selectedAgent });
            setImportPreview(data);
            if (data.length === 0) toast.error('Aucune information extraite.');
        } catch { toast.error("Erreur d'extraction"); }
        finally { setImportLoad(false); }
    };

    const confirmImport = async () => {
        toast.success(`${importPreview.length} informations importées !`);
        setImportOpen(false); setImportText(''); setImportPreview([]); fetchData();
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ background: '#080a10' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-4">
                    {activeModule && (
                        <button onClick={() => { setModule(null); setShowAdd(false); setEditItem(null); setForm({ title: '', content: '' }); }}
                            className="p-2 rounded-xl hover:bg-white/5 transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <Brain className="w-5 h-5" style={{ color: '#f5a623' }} />
                            {activeModule ? `${activeMod?.emoji} ${activeMod?.label}` : 'Cerveau IA'}
                        </h1>
                        <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            {activeModule
                                ? `${moduleItems.length} information${moduleItems.length !== 1 ? 's' : ''} dans cette catégorie`
                                : "Construisez le cerveau de votre agent"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {agents.length > 1 && (
                        <select value={selectedAgent} onChange={(e) => setAgent(e.target.value)}
                            className="px-3 py-2 text-[13px] rounded-xl text-white"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', colorScheme: 'dark' }}>
                            {agents.map((a) => <option key={a.id} value={a.id} style={{ background: '#13151f' }}>{a.name}</option>)}
                        </select>
                    )}
                    <button onClick={() => setImportOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all hover:bg-white/5"
                        style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Upload className="w-3.5 h-3.5" /> Importer
                    </button>
                    <button onClick={() => setTestOpen((v) => !v)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all"
                        style={testOpen
                            ? { background: 'rgba(245,166,35,0.15)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.25)' }
                            : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <MessageSquare className="w-3.5 h-3.5" /> Tester
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left: Employee panel */}
                <div className="w-64 flex-shrink-0 border-r p-5 flex flex-col gap-5 overflow-y-auto" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="rounded-2xl p-4 border" style={{ background: '#13151f', borderColor: 'rgba(255,255,255,0.07)' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                                style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.2)' }}>🤖</div>
                            <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-white truncate">{currentAgent?.name ?? 'Votre agent'}</p>
                                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Employé IA</p>
                            </div>
                        </div>
                        <div className="mb-4">
                            <div className="flex justify-between mb-1.5">
                                <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>Cerveau rempli</span>
                                <span className="text-[11px] font-bold" style={{ color: score >= 60 ? '#22c55e' : score >= 30 ? '#f5a623' : '#f87171' }}>{score}%</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                                    style={{ background: score >= 60 ? '#22c55e' : score >= 30 ? '#f5a623' : '#f87171' }} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>Connaissances</p>
                            {MODULES.map((m) => {
                                const n = countFor(m.value);
                                return (
                                    <button key={m.value} onClick={() => { setModule(m.value); setShowAdd(false); setEditItem(null); setForm({ title: '', content: '' }); }}
                                        className="w-full flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
                                        style={activeModule === m.value ? { background: 'rgba(255,255,255,0.07)' } : {}}>
                                        <span className="text-[12px] flex items-center gap-1.5" style={{ color: n > 0 ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.3)' }}>
                                            {n > 0 ? <Check className="w-3 h-3" style={{ color: m.color }} /> : <span className="w-3 h-3 rounded-full border border-dashed flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.15)' }} />}
                                            {m.label}
                                        </span>
                                        {n > 0 && <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: m.color + '18', color: m.color }}>{n}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    {score < 50 && (
                        <div className="rounded-xl p-3 text-[12px]" style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.12)', color: 'rgba(245,166,35,0.7)' }}>
                            <Sparkles className="w-3 h-3 inline mr-1" />Remplissez au moins 5 modules pour des réponses précises.
                        </div>
                    )}
                </div>

                {/* Center: Canvas / Module */}
                <div className="flex-1 overflow-y-auto p-8">
                    <AnimatePresence mode="wait">
                        {!activeModule ? (
                            <motion.div key="canvas" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                                {loading ? (
                                    <div className="grid grid-cols-3 gap-4">
                                        {Array(9).fill(0).map((_, i) => <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-4">
                                        {MODULES.map((m) => <ModuleCard key={m.value} mod={m} count={countFor(m.value)} onClick={() => { setModule(m.value); setShowAdd(false); }} />)}
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div key={activeModule} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{activeMod?.desc}</p>
                                    {!showAdd && (
                                        <button onClick={() => { setShowAdd(true); setEditItem(null); setForm({ title: '', content: '' }); }}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold"
                                            style={{ background: `${activeMod?.color}15`, color: activeMod?.color, border: `1px solid ${activeMod?.color}30` }}>
                                            <Plus className="w-3.5 h-3.5" /> Ajouter
                                        </button>
                                    )}
                                </div>

                                <AnimatePresence>
                                    {showAdd && (
                                        <motion.div key="form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                            className="rounded-2xl p-5 border overflow-hidden" style={{ background: '#13151f', borderColor: activeMod?.color + '30' }}>
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-[13px] font-semibold text-white">{editItem ? 'Modifier' : `Nouvelle information — ${activeMod?.label}`}</p>
                                                <button onClick={() => { setShowAdd(false); setEditItem(null); setForm({ title: '', content: '' }); }}
                                                    className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-[12px] block mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Titre *</label>
                                                    <input type="text" placeholder="Ex: Produit phare — Attiéké Premium" value={form.title}
                                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                                        onFocus={focusBorder} onBlur={blurBorder} style={inputBase} />
                                                </div>
                                                <div>
                                                    <label className="text-[12px] block mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Contenu *</label>
                                                    <textarea rows={4} placeholder="Décrivez cette information avec précision..."
                                                        value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                                                        onFocus={focusBorder} onBlur={blurBorder}
                                                        style={{ ...inputBase, resize: 'none', fontFamily: 'inherit' }} />
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => { setShowAdd(false); setEditItem(null); setForm({ title: '', content: '' }); }}
                                                        className="px-4 py-2 rounded-xl text-[13px] hover:bg-white/5 transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>Annuler</button>
                                                    <button onClick={handleSave}
                                                        className="px-5 py-2 rounded-xl text-[13px] font-semibold transition-all"
                                                        style={{ background: `linear-gradient(135deg, ${activeMod?.color}, ${activeMod?.color}cc)`, color: '#0a0c10' }}>
                                                        {editItem ? 'Mettre à jour' : 'Enregistrer'}
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {moduleItems.length === 0 && !showAdd ? (
                                    <div className="rounded-2xl border py-14 text-center" style={{ background: '#0f1117', borderColor: 'rgba(255,255,255,0.05)' }}>
                                        <p className="text-3xl mb-3">{activeMod?.emoji}</p>
                                        <p className="text-[13px] font-medium text-white mb-1">Aucune information encore</p>
                                        <p className="text-[12px] mb-5" style={{ color: 'rgba(255,255,255,0.25)' }}>{activeMod?.desc}</p>
                                        <button onClick={() => setShowAdd(true)}
                                            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold"
                                            style={{ background: `${activeMod?.color}15`, color: activeMod?.color, border: `1px solid ${activeMod?.color}25` }}>
                                            <Plus className="w-3.5 h-3.5 inline mr-1" />Ajouter la première
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {moduleItems.map((item) => (
                                            <ItemRow key={item.id} item={item} color={activeMod?.color ?? '#f5a623'}
                                                onEdit={() => openEdit(item)} onDelete={() => handleDelete(item.id)} />
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right: Test panel */}
                <AnimatePresence>
                    {testOpen && (
                        <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }} className="flex-shrink-0 border-l flex flex-col overflow-hidden"
                            style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                                <div>
                                    <p className="text-[13px] font-semibold text-white">Test en direct</p>
                                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Posez une question à votre agent</p>
                                </div>
                                <button onClick={() => setTestOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {testMessages.length === 0 && (
                                    <div className="text-center py-8">
                                        <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-15 text-white" />
                                        <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Testez les réponses avec les connaissances remplies</p>
                                    </div>
                                )}
                                {testMessages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className="max-w-[85%] rounded-xl px-3 py-2 text-[12px]"
                                            style={msg.role === 'user'
                                                ? { background: 'rgba(245,166,35,0.15)', color: '#f5a623' }
                                                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)' }}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {testLoading && (
                                    <div className="flex justify-start">
                                        <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                            <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
                                        </div>
                                    </div>
                                )}
                                <div ref={testEnd} />
                            </div>
                            <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                                <div className="flex gap-2">
                                    <input type="text" placeholder="Posez une question..." value={testInput}
                                        onChange={(e) => setTestInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && sendTest()}
                                        className="flex-1 px-3 py-2 rounded-xl text-[12px] text-white outline-none"
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                                    <button onClick={sendTest} disabled={testLoading || !testInput.trim()}
                                        className="p-2 rounded-xl disabled:opacity-30 transition-opacity"
                                        style={{ background: 'rgba(245,166,35,0.15)', color: '#f5a623' }}>
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Import Modal */}
            <AnimatePresence>
                {importOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6"
                        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
                        <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
                            className="w-full max-w-xl rounded-2xl border p-6 space-y-5"
                            style={{ background: '#13151f', borderColor: 'rgba(255,255,255,0.08)' }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[15px] font-bold text-white flex items-center gap-2">
                                        <Upload className="w-4 h-4" style={{ color: '#f5a623' }} />Import intelligent
                                    </p>
                                    <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                        Collez une conversation WhatsApp, une description Facebook, un catalogue... L&apos;IA extrait tout.
                                    </p>
                                </div>
                                <button onClick={() => { setImportOpen(false); setImportText(''); setImportPreview([]); }}
                                    className="p-2 rounded-lg hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            {importPreview.length === 0 ? (
                                <>
                                    <textarea rows={8}
                                        placeholder="Collez ici votre texte brut (conversation WhatsApp, description de page Facebook, menu, liste de prix...)"
                                        value={importText} onChange={(e) => setImportText(e.target.value)}
                                        onFocus={focusBorder} onBlur={blurBorder}
                                        style={{ ...inputBase, resize: 'none', fontFamily: 'inherit', lineHeight: '1.6' }} />
                                    <button onClick={handleImport} disabled={importLoading || !importText.trim()}
                                        className="w-full py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
                                        style={{ background: 'linear-gradient(135deg, #f5a623, #f7b84b)', color: '#1a0e00' }}>
                                        {importLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        {importLoading ? "Extraction en cours..." : "Extraire avec l'IA"}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                        <p className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                            {importPreview.length} informations détectées
                                        </p>
                                        {importPreview.map((item, i) => {
                                            const m = MODULES.find((mod) => mod.value === item.category);
                                            return (
                                                <div key={i} className="rounded-xl p-3 border flex gap-3"
                                                    style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                                                    <span className="text-lg flex-shrink-0">{m?.emoji ?? '📝'}</span>
                                                    <div className="min-w-0">
                                                        <p className="text-[12px] font-semibold text-white truncate">{item.title}</p>
                                                        <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.content}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => setImportPreview([])}
                                            className="flex-1 py-2.5 rounded-xl text-[13px] hover:bg-white/5 transition-colors"
                                            style={{ color: 'rgba(255,255,255,0.4)' }}>Recommencer</button>
                                        <button onClick={confirmImport}
                                            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2"
                                            style={{ background: 'linear-gradient(135deg, #f5a623, #f7b84b)', color: '#1a0e00' }}>
                                            <Check className="w-4 h-4" />Tout importer
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
