'use client';

import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '@/lib/api';
import {
    Plus, Trash2, Pencil, ChevronRight, Brain, Sparkles,
    MessageSquare, X, Send, Upload, Check, ArrowLeft, Loader2,
    FileText, Globe, Wand2, Clock,
} from 'lucide-react';
import { toast } from 'sonner';

/* ─── Types ─────────────────────────────────────────────────── */
interface KBItem { id: string; title: string; content: string; category: string; agentId: string; }
interface Agent { id: string; name: string; }

/* ─── Modules ────────────────────────────────────────────────── */
const MODULES = [
    { value: 'product',  label: 'Produits',    emoji: '📦', color: '#f5a623', desc: 'Vos articles, références, gammes' },
    { value: 'service',  label: 'Services',    emoji: '⚙️', color: '#818cf8', desc: 'Prestations et savoir-faire' },
    { value: 'price',    label: 'Tarifs',       emoji: '💰', color: '#22c55e', desc: 'Prix, promotions, offres' },
    { value: 'schedule', label: 'Horaires',     emoji: '🕐', color: '#38bdf8', desc: "Heures d'ouverture, jours fériés" },
    { value: 'address',  label: 'Localisation', emoji: '📍', color: '#fb923c', desc: 'Adresse, accès, itinéraire' },
    { value: 'faq',      label: 'FAQ',          emoji: '❓', color: '#a78bfa', desc: 'Questions fréquentes' },
    { value: 'delivery', label: 'Livraison',    emoji: '🚚', color: '#34d399', desc: 'Zones, délais, frais' },
    { value: 'payment',  label: 'Paiement',     emoji: '💳', color: '#f472b6', desc: 'Moyens acceptés, conditions' },
    { value: 'contact',  label: 'Contact',      emoji: '📞', color: '#94a3b8', desc: 'Téléphone, email, réseaux' },
];

/* ─── Styles ─────────────────────────────────────────────────── */
const inp: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
    color: 'white', borderRadius: '10px', padding: '10px 14px', fontSize: '13px',
    width: '100%', outline: 'none', transition: 'border-color 0.15s',
};
const fo = (e: React.FocusEvent<HTMLElement>) => { (e.target as HTMLElement).style.borderColor = 'rgba(245,166,35,0.45)'; };
const fb = (e: React.FocusEvent<HTMLElement>) => { (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; };

const LBL = ({ children }: { children: React.ReactNode }) => (
    <label className="text-[12px] block mb-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{children}</label>
);

/* ─── DAYS ───────────────────────────────────────────────────── */
const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const mkSchedule = () => DAYS.map((day) => ({ day, open: day !== 'Dimanche', from: '08:00', to: '18:00' }));

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
                    {filled ? `${count} entrée${count > 1 ? 's' : ''}` : mod.desc}
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

/* ─── Structured forms ───────────────────────────────────────── */
type ScheduleDay = { day: string; open: boolean; from: string; to: string };

function ProductForm({ v, onChange }: { v: { name: string; price: string; description: string }; onChange: (v: any) => void }) {
    return (
        <div className="space-y-3">
            <div><LBL>Nom du produit *</LBL><input style={inp} onFocus={fo} onBlur={fb} placeholder="Ex: Attiéké premium 500g" value={v.name} onChange={(e) => onChange({ ...v, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
                <div><LBL>Prix</LBL><input style={inp} onFocus={fo} onBlur={fb} placeholder="Ex: 1 500 FCFA" value={v.price} onChange={(e) => onChange({ ...v, price: e.target.value })} /></div>
            </div>
            <div><LBL>Description</LBL><textarea rows={3} style={{ ...inp, resize: 'none', fontFamily: 'inherit' }} onFocus={fo} onBlur={fb} placeholder="Décrivez ce produit..." value={v.description} onChange={(e) => onChange({ ...v, description: e.target.value })} /></div>
        </div>
    );
}

function ServiceForm({ v, onChange }: { v: { name: string; rate: string; duration: string; description: string }; onChange: (v: any) => void }) {
    return (
        <div className="space-y-3">
            <div><LBL>Nom du service *</LBL><input style={inp} onFocus={fo} onBlur={fb} placeholder="Ex: Coiffure tresses" value={v.name} onChange={(e) => onChange({ ...v, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
                <div><LBL>Tarif</LBL><input style={inp} onFocus={fo} onBlur={fb} placeholder="Ex: 5 000 FCFA" value={v.rate} onChange={(e) => onChange({ ...v, rate: e.target.value })} /></div>
                <div><LBL>Durée</LBL><input style={inp} onFocus={fo} onBlur={fb} placeholder="Ex: 2h" value={v.duration} onChange={(e) => onChange({ ...v, duration: e.target.value })} /></div>
            </div>
            <div><LBL>Description</LBL><textarea rows={3} style={{ ...inp, resize: 'none', fontFamily: 'inherit' }} onFocus={fo} onBlur={fb} placeholder="Décrivez ce service..." value={v.description} onChange={(e) => onChange({ ...v, description: e.target.value })} /></div>
        </div>
    );
}

function FaqForm({ v, onChange }: { v: { question: string; answer: string }; onChange: (v: any) => void }) {
    return (
        <div className="space-y-3">
            <div><LBL>Question *</LBL><input style={inp} onFocus={fo} onBlur={fb} placeholder="Ex: Livrez-vous le dimanche ?" value={v.question} onChange={(e) => onChange({ ...v, question: e.target.value })} /></div>
            <div><LBL>Réponse *</LBL><textarea rows={4} style={{ ...inp, resize: 'none', fontFamily: 'inherit' }} onFocus={fo} onBlur={fb} placeholder="Répondez de façon claire et complète..." value={v.answer} onChange={(e) => onChange({ ...v, answer: e.target.value })} /></div>
        </div>
    );
}

function ScheduleFormCmp({ v, onChange }: { v: ScheduleDay[]; onChange: (v: ScheduleDay[]) => void }) {
    const update = (i: number, patch: Partial<ScheduleDay>) => {
        const next = v.map((d, idx) => idx === i ? { ...d, ...patch } : d);
        onChange(next);
    };
    return (
        <div className="space-y-2">
            {v.map((d, i) => (
                <div key={d.day} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <button type="button" onClick={() => update(i, { open: !d.open })}
                        className="w-8 h-4 rounded-full transition-colors flex-shrink-0 relative"
                        style={{ background: d.open ? '#38bdf8' : 'rgba(255,255,255,0.1)' }}>
                        <span className="absolute top-0.5 rounded-full w-3 h-3 bg-white transition-all" style={{ left: d.open ? '18px' : '2px' }} />
                    </button>
                    <span className="text-[12px] w-16 flex-shrink-0" style={{ color: d.open ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)' }}>{d.day}</span>
                    {d.open ? (
                        <>
                            <input type="time" value={d.from} onChange={(e) => update(i, { from: e.target.value })}
                                className="text-[12px] px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', colorScheme: 'dark' }} />
                            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>→</span>
                            <input type="time" value={d.to} onChange={(e) => update(i, { to: e.target.value })}
                                className="text-[12px] px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', colorScheme: 'dark' }} />
                        </>
                    ) : (
                        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Fermé</span>
                    )}
                </div>
            ))}
        </div>
    );
}

function LocationFormCmp({ v, onChange }: { v: { description: string; neighborhood: string; mapLink: string }; onChange: (v: any) => void }) {
    return (
        <div className="space-y-3">
            <div><LBL>Description du lieu *</LBL><textarea rows={2} style={{ ...inp, resize: 'none', fontFamily: 'inherit' }} onFocus={fo} onBlur={fb} placeholder="Ex: Situé au rez-de-chaussée de l'immeuble Soleil, à côté de la pharmacie" value={v.description} onChange={(e) => onChange({ ...v, description: e.target.value })} /></div>
            <div><LBL>Quartier / Zone</LBL><input style={inp} onFocus={fo} onBlur={fb} placeholder="Ex: Cocody Riviera 2" value={v.neighborhood} onChange={(e) => onChange({ ...v, neighborhood: e.target.value })} /></div>
            <div><LBL>Lien Google Maps (optionnel)</LBL><input style={inp} onFocus={fo} onBlur={fb} placeholder="https://maps.google.com/..." value={v.mapLink} onChange={(e) => onChange({ ...v, mapLink: e.target.value })} /></div>
        </div>
    );
}

function GenericForm({ v, onChange, placeholder }: { v: { title: string; content: string }; onChange: (v: any) => void; placeholder?: string }) {
    return (
        <div className="space-y-3">
            <div><LBL>Titre *</LBL><input style={inp} onFocus={fo} onBlur={fb} placeholder="Titre court et précis" value={v.title} onChange={(e) => onChange({ ...v, title: e.target.value })} /></div>
            <div><LBL>Contenu *</LBL><textarea rows={4} style={{ ...inp, resize: 'none', fontFamily: 'inherit' }} onFocus={fo} onBlur={fb} placeholder={placeholder ?? 'Décrivez cette information...'} value={v.content} onChange={(e) => onChange({ ...v, content: e.target.value })} /></div>
        </div>
    );
}

/* ─── serialize helpers ──────────────────────────────────────── */
function serializeProduct(v: { name: string; price: string; description: string }): { title: string; content: string } {
    const parts = [v.description, v.price && `Prix : ${v.price}`].filter(Boolean);
    return { title: v.name, content: parts.join('\n') };
}
function serializeService(v: { name: string; rate: string; duration: string; description: string }): { title: string; content: string } {
    const parts = [v.description, v.rate && `Tarif : ${v.rate}`, v.duration && `Durée : ${v.duration}`].filter(Boolean);
    return { title: v.name, content: parts.join('\n') };
}
function serializeSchedule(v: ScheduleDay[]): { title: string; content: string } {
    const lines = v.map((d) => d.open ? `${d.day} : ${d.from} – ${d.to}` : `${d.day} : Fermé`);
    return { title: "Horaires d'ouverture", content: lines.join('\n') };
}
function serializeLocation(v: { description: string; neighborhood: string; mapLink: string }): { title: string; content: string } {
    const parts = [v.description, v.neighborhood && `Quartier : ${v.neighborhood}`, v.mapLink && `Maps : ${v.mapLink}`].filter(Boolean);
    return { title: 'Adresse & localisation', content: parts.join('\n') };
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function KnowledgeBasePage() {
    const [items, setItems]         = useState<KBItem[]>([]);
    const [agents, setAgents]       = useState<Agent[]>([]);
    const [selectedAgent, setAgent] = useState<string>('');
    const [loading, setLoading]     = useState(true);
    const [activeModule, setModule] = useState<string | null>(null);
    const [showAdd, setShowAdd]     = useState(false);
    const [editItem, setEditItem]   = useState<KBItem | null>(null);

    // per-category form states
    const [productForm, setProductForm]     = useState({ name: '', price: '', description: '' });
    const [serviceForm, setServiceForm]     = useState({ name: '', rate: '', duration: '', description: '' });
    const [faqForm, setFaqForm]             = useState({ question: '', answer: '' });
    const [scheduleForm, setScheduleForm]   = useState<ScheduleDay[]>(mkSchedule());
    const [locationForm, setLocationForm]   = useState({ description: '', neighborhood: '', mapLink: '' });
    const [genericForm, setGenericForm]     = useState({ title: '', content: '' });

    // test panel
    const [testOpen, setTestOpen]   = useState(false);
    const [testMsgs, setTestMsgs]   = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
    const [testInput, setTestInput] = useState('');
    const [testLoad, setTestLoad]   = useState(false);
    const testEnd = useRef<HTMLDivElement>(null);

    // import modal
    const [importOpen, setImportOpen]           = useState(false);
    const [importTab, setImportTab]             = useState<'text' | 'file' | 'url'>('text');
    const [importText, setImportText]           = useState('');
    const [importUrl, setImportUrl]             = useState('');
    const [importLoad, setImportLoad]           = useState(false);
    const [importPreview, setImportPreview]     = useState<{ title: string; content: string; category: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // generate FAQs
    const [genFaqLoad, setGenFaqLoad]           = useState(false);
    const [genFaqPreview, setGenFaqPreview]     = useState<{ title: string; content: string; category: string }[]>([]);
    const [genFaqOpen, setGenFaqOpen]           = useState(false);

    /* ── fetch ── */
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
    useEffect(() => { testEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [testMsgs]);

    const resetForms = () => {
        setProductForm({ name: '', price: '', description: '' });
        setServiceForm({ name: '', rate: '', duration: '', description: '' });
        setFaqForm({ question: '', answer: '' });
        setScheduleForm(mkSchedule());
        setLocationForm({ description: '', neighborhood: '', mapLink: '' });
        setGenericForm({ title: '', content: '' });
    };

    /* ── computed ── */
    const filtered     = selectedAgent ? items.filter((i) => i.agentId === selectedAgent) : items;
    const countFor     = (cat: string) => filtered.filter((i) => i.category === cat).length;
    const filled       = MODULES.filter((m) => countFor(m.value) > 0).length;
    const score        = Math.round((filled / MODULES.length) * 100);
    const currentAgent = agents.find((a) => a.id === selectedAgent);
    const activeMod    = MODULES.find((m) => m.value === activeModule);
    const modItems     = activeModule ? filtered.filter((i) => i.category === activeModule) : [];

    /* ── serialize & save ── */
    const getSerialized = (): { title: string; content: string } | null => {
        if (activeModule === 'product') {
            if (!productForm.name.trim()) { toast.error('Nom requis'); return null; }
            return serializeProduct(productForm);
        }
        if (activeModule === 'service') {
            if (!serviceForm.name.trim()) { toast.error('Nom requis'); return null; }
            return serializeService(serviceForm);
        }
        if (activeModule === 'faq') {
            if (!faqForm.question.trim() || !faqForm.answer.trim()) { toast.error('Question et réponse requises'); return null; }
            return { title: faqForm.question, content: faqForm.answer };
        }
        if (activeModule === 'schedule') return serializeSchedule(scheduleForm);
        if (activeModule === 'address') {
            if (!locationForm.description.trim()) { toast.error('Description requise'); return null; }
            return serializeLocation(locationForm);
        }
        if (!genericForm.title.trim() || !genericForm.content.trim()) { toast.error('Titre et contenu requis'); return null; }
        return genericForm;
    };

    const handleSave = async () => {
        const s = getSerialized();
        if (!s) return;
        try {
            if (editItem) {
                await api.patch(`/knowledge-base/${editItem.id}`, s);
                toast.success('Mis à jour !');
            } else {
                await api.post('/knowledge-base', { ...s, category: activeModule ?? 'other', agentId: selectedAgent });
                toast.success('Ajouté !');
            }
            setShowAdd(false); setEditItem(null); resetForms(); fetchData();
        } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Erreur'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer ?')) return;
        await api.delete(`/knowledge-base/${id}`);
        toast.success('Supprimé'); fetchData();
    };

    const openEdit = (item: KBItem) => {
        setEditItem(item);
        if (item.category === 'faq') setFaqForm({ question: item.title, answer: item.content });
        else if (item.category === 'product') {
            const lines = item.content.split('\n');
            const pLine = lines.find((l) => l.startsWith('Prix :'));
            setProductForm({ name: item.title, description: lines.filter((l) => !l.startsWith('Prix :')).join('\n'), price: pLine?.replace('Prix : ', '') ?? '' });
        } else if (item.category === 'service') {
            const lines = item.content.split('\n');
            const rLine = lines.find((l) => l.startsWith('Tarif :'));
            const dLine = lines.find((l) => l.startsWith('Durée :'));
            setServiceForm({ name: item.title, rate: rLine?.replace('Tarif : ', '') ?? '', duration: dLine?.replace('Durée : ', '') ?? '', description: lines.filter((l) => !l.startsWith('Tarif :') && !l.startsWith('Durée :')).join('\n') });
        } else {
            setGenericForm({ title: item.title, content: item.content });
        }
        setShowAdd(true);
    };

    /* ── Test ── */
    const sendTest = async () => {
        if (!testInput.trim() || !selectedAgent) return;
        const q = testInput.trim();
        setTestMsgs((m) => [...m, { role: 'user', text: q }]);
        setTestInput(''); setTestLoad(true);
        try {
            const { data } = await api.post('/knowledge-base/test-agent', { agentId: selectedAgent, question: q });
            setTestMsgs((m) => [...m, { role: 'ai', text: data.answer }]);
        } catch { setTestMsgs((m) => [...m, { role: 'ai', text: '⚠️ Erreur.' }]); }
        finally { setTestLoad(false); }
    };

    /* ── Import ── */
    const runImport = async (text: string) => {
        if (!text.trim()) return;
        setImportLoad(true);
        try {
            const { data } = await api.post('/knowledge-base/import-text', { text, agentId: selectedAgent });
            setImportPreview(data);
            if (data.length === 0) toast.error('Aucune information extraite.');
        } catch { toast.error("Erreur d'extraction"); }
        finally { setImportLoad(false); }
    };

    const handleImportText = () => runImport(importText);

    const handleImportUrl = async () => {
        if (!importUrl.trim()) return;
        setImportLoad(true);
        try {
            const { data } = await api.post('/knowledge-base/import-url', { url: importUrl, agentId: selectedAgent });
            setImportPreview(data);
            if (data.length === 0) toast.error('Aucune information extraite depuis ce site.');
        } catch { toast.error("Erreur lors du scraping du site"); }
        finally { setImportLoad(false); }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!['txt', 'pdf'].includes(ext ?? '')) { toast.error('Fichier .txt ou .pdf uniquement'); return; }
        setImportLoad(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('agentId', selectedAgent);
            const { data } = await api.post('/knowledge-base/import-file', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setImportPreview(data);
            if (data.length === 0) toast.error('Aucune information extraite.');
        } catch { toast.error("Erreur lors de la lecture du fichier"); }
        finally { setImportLoad(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };

    const confirmImport = async () => {
        toast.success(`${importPreview.length} informations importées !`);
        setImportOpen(false); setImportText(''); setImportUrl(''); setImportPreview([]); fetchData();
    };

    /* ── Generate FAQs ── */
    const handleGenFaqs = async () => {
        if (!selectedAgent) { toast.error('Sélectionnez un agent'); return; }
        setGenFaqLoad(true);
        try {
            const { data } = await api.post('/knowledge-base/generate-faqs', { agentId: selectedAgent });
            if (data.length === 0) { toast.error('Pas assez de données dans la base pour générer des FAQs.'); return; }
            setGenFaqPreview(data);
            setGenFaqOpen(true);
        } catch { toast.error('Erreur lors de la génération'); }
        finally { setGenFaqLoad(false); }
    };

    const confirmGenFaqs = async () => {
        toast.success(`${genFaqPreview.length} FAQs ajoutées !`);
        setGenFaqOpen(false); setGenFaqPreview([]); fetchData();
    };

    /* ══ RENDER ══════════════════════════════════════════════════ */
    return (
        <div className="min-h-screen flex flex-col" style={{ background: '#080a10' }}>

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-8 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-4">
                    {activeModule && (
                        <button onClick={() => { setModule(null); setShowAdd(false); setEditItem(null); resetForms(); }}
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
                            {activeModule ? `${modItems.length} entrée${modItems.length !== 1 ? 's' : ''}` : 'Construisez le cerveau de votre agent'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {agents.length > 1 && (
                        <select value={selectedAgent} onChange={(e) => setAgent(e.target.value)} className="px-3 py-2 text-[13px] rounded-xl text-white"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', colorScheme: 'dark' }}>
                            {agents.map((a) => <option key={a.id} value={a.id} style={{ background: '#13151f' }}>{a.name}</option>)}
                        </select>
                    )}
                    {/* Generate FAQs button */}
                    <button onClick={handleGenFaqs} disabled={genFaqLoad}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium transition-all disabled:opacity-40"
                        style={{ background: 'rgba(167,139,250,0.08)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)' }}>
                        {genFaqLoad ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                        Générer FAQs
                    </button>
                    {/* Import */}
                    <button onClick={() => setImportOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium transition-all hover:bg-white/5"
                        style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Upload className="w-3.5 h-3.5" /> Importer
                    </button>
                    {/* Test */}
                    <button onClick={() => setTestOpen((v) => !v)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all"
                        style={testOpen
                            ? { background: 'rgba(245,166,35,0.15)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.25)' }
                            : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <MessageSquare className="w-3.5 h-3.5" /> Tester
                    </button>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left: Employee */}
                <div className="w-60 flex-shrink-0 border-r p-4 flex flex-col gap-4 overflow-y-auto" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="rounded-2xl p-4 border" style={{ background: '#13151f', borderColor: 'rgba(255,255,255,0.07)' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.2)' }}>🤖</div>
                            <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-white truncate">{currentAgent?.name ?? 'Votre agent'}</p>
                                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Employé IA</p>
                            </div>
                        </div>
                        <div className="mb-4">
                            <div className="flex justify-between mb-1.5">
                                <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>Cerveau rempli</span>
                                <span className="text-[11px] font-bold" style={{ color: score >= 60 ? '#22c55e' : score >= 30 ? '#f5a623' : '#f87171' }}>{score}%</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                                    style={{ background: score >= 60 ? '#22c55e' : score >= 30 ? '#f5a623' : '#f87171' }} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            {MODULES.map((m) => {
                                const n = countFor(m.value);
                                return (
                                    <button key={m.value} onClick={() => { setModule(m.value); setShowAdd(false); setEditItem(null); resetForms(); }}
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
                            <Sparkles className="w-3 h-3 inline mr-1" />Remplissez 5+ modules pour des réponses précises.
                        </div>
                    )}
                </div>

                {/* Center: Canvas or Module */}
                <div className="flex-1 overflow-y-auto p-8">
                    <AnimatePresence mode="wait">
                        {!activeModule ? (
                            <motion.div key="canvas" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                                {loading ? (
                                    <div className="grid grid-cols-3 gap-4">{Array(9).fill(0).map((_, i) => <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}</div>
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
                                        <button onClick={() => { setShowAdd(true); setEditItem(null); resetForms(); }}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold"
                                            style={{ background: `${activeMod?.color}15`, color: activeMod?.color, border: `1px solid ${activeMod?.color}30` }}>
                                            <Plus className="w-3.5 h-3.5" /> Ajouter
                                        </button>
                                    )}
                                </div>

                                {/* Inline form */}
                                <AnimatePresence>
                                    {showAdd && (
                                        <motion.div key="form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                            className="rounded-2xl p-5 border overflow-hidden" style={{ background: '#13151f', borderColor: activeMod?.color + '30' }}>
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-[13px] font-semibold text-white">{editItem ? 'Modifier' : `Nouvelle entrée — ${activeMod?.label}`}</p>
                                                <button onClick={() => { setShowAdd(false); setEditItem(null); resetForms(); }} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.3)' }}><X className="w-4 h-4" /></button>
                                            </div>

                                            {activeModule === 'product'  && <ProductForm  v={productForm}  onChange={setProductForm} />}
                                            {activeModule === 'service'  && <ServiceForm  v={serviceForm}  onChange={setServiceForm} />}
                                            {activeModule === 'faq'      && <FaqForm      v={faqForm}      onChange={setFaqForm} />}
                                            {activeModule === 'schedule' && <ScheduleFormCmp v={scheduleForm} onChange={setScheduleForm} />}
                                            {activeModule === 'address'  && <LocationFormCmp v={locationForm} onChange={setLocationForm} />}
                                            {!['product','service','faq','schedule','address'].includes(activeModule ?? '') &&
                                                <GenericForm v={genericForm} onChange={setGenericForm} placeholder={`Informations sur ${activeMod?.label.toLowerCase()}...`} />}

                                            <div className="flex justify-end gap-2 mt-4">
                                                <button onClick={() => { setShowAdd(false); setEditItem(null); resetForms(); }}
                                                    className="px-4 py-2 rounded-xl text-[13px] hover:bg-white/5 transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>Annuler</button>
                                                <button onClick={handleSave}
                                                    className="px-5 py-2 rounded-xl text-[13px] font-semibold transition-all"
                                                    style={{ background: `linear-gradient(135deg, ${activeMod?.color}, ${activeMod?.color}cc)`, color: '#0a0c10' }}>
                                                    {editItem ? 'Mettre à jour' : 'Enregistrer'}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {modItems.length === 0 && !showAdd ? (
                                    <div className="rounded-2xl border py-14 text-center" style={{ background: '#0f1117', borderColor: 'rgba(255,255,255,0.05)' }}>
                                        <p className="text-3xl mb-3">{activeMod?.emoji}</p>
                                        <p className="text-[13px] font-medium text-white mb-1">Aucune entrée</p>
                                        <p className="text-[12px] mb-5" style={{ color: 'rgba(255,255,255,0.25)' }}>{activeMod?.desc}</p>
                                        <button onClick={() => setShowAdd(true)} className="px-5 py-2.5 rounded-xl text-[13px] font-semibold"
                                            style={{ background: `${activeMod?.color}15`, color: activeMod?.color, border: `1px solid ${activeMod?.color}25` }}>
                                            <Plus className="w-3.5 h-3.5 inline mr-1" />Ajouter la première
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {modItems.map((item) => (
                                            <ItemRow key={item.id} item={item} color={activeMod?.color ?? '#f5a623'} onEdit={() => openEdit(item)} onDelete={() => handleDelete(item.id)} />
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
                        <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                            className="flex-shrink-0 border-l flex flex-col overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                            <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                                <div>
                                    <p className="text-[13px] font-semibold text-white">Test en direct</p>
                                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Simulez une question client</p>
                                </div>
                                <button onClick={() => setTestOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.3)' }}><X className="w-4 h-4" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {testMsgs.length === 0 && (
                                    <div className="text-center py-8">
                                        <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-15 text-white" />
                                        <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Testez l&apos;agent avec ses connaissances</p>
                                    </div>
                                )}
                                {testMsgs.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className="max-w-[85%] rounded-xl px-3 py-2 text-[12px]"
                                            style={msg.role === 'user' ? { background: 'rgba(245,166,35,0.15)', color: '#f5a623' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)' }}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {testLoad && <div className="flex justify-start"><div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}><Loader2 className="w-4 h-4 animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} /></div></div>}
                                <div ref={testEnd} />
                            </div>
                            <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                                <div className="flex gap-2">
                                    <input type="text" placeholder="Posez une question..." value={testInput} onChange={(e) => setTestInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendTest()}
                                        className="flex-1 px-3 py-2 rounded-xl text-[12px] text-white outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                                    <button onClick={sendTest} disabled={testLoad || !testInput.trim()} className="p-2 rounded-xl disabled:opacity-30" style={{ background: 'rgba(245,166,35,0.15)', color: '#f5a623' }}>
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ═══ IMPORT MODAL ═══════════════════════════════════════ */}
            <AnimatePresence>
                {importOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
                        <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
                            className="w-full max-w-xl rounded-2xl border p-6 space-y-5" style={{ background: '#13151f', borderColor: 'rgba(255,255,255,0.08)' }}>

                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-[15px] font-bold text-white flex items-center gap-2"><Upload className="w-4 h-4" style={{ color: '#f5a623' }} />Import intelligent</p>
                                    <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>L&apos;IA extrait automatiquement les informations utiles</p>
                                </div>
                                <button onClick={() => { setImportOpen(false); setImportText(''); setImportUrl(''); setImportPreview([]); }} className="p-2 rounded-lg hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.3)' }}><X className="w-4 h-4" /></button>
                            </div>

                            {importPreview.length === 0 ? (
                                <>
                                    {/* Tabs */}
                                    <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        {([['text','Texte / WhatsApp', MessageSquare], ['file','Fichier PDF/TXT', FileText], ['url','Site web', Globe]] as const).map(([tab, label, Icon]) => (
                                            <button key={tab} onClick={() => setImportTab(tab)}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium transition-all"
                                                style={importTab === tab ? { background: 'rgba(245,166,35,0.12)', color: '#f5a623' } : { color: 'rgba(255,255,255,0.4)' }}>
                                                <Icon className="w-3.5 h-3.5" />{label}
                                            </button>
                                        ))}
                                    </div>

                                    {importTab === 'text' && (
                                        <>
                                            <textarea rows={8} placeholder="Collez une conversation WhatsApp, description Facebook, catalogue produits, menu restaurant..."
                                                value={importText} onChange={(e) => setImportText(e.target.value)} onFocus={fo} onBlur={fb}
                                                style={{ ...inp, resize: 'none', fontFamily: 'inherit', lineHeight: '1.6' }} />
                                            <button onClick={handleImportText} disabled={importLoad || !importText.trim()}
                                                className="w-full py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                                                style={{ background: 'linear-gradient(135deg, #f5a623, #f7b84b)', color: '#1a0e00' }}>
                                                {importLoad ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                {importLoad ? 'Extraction...' : "Extraire avec l'IA"}
                                            </button>
                                        </>
                                    )}

                                    {importTab === 'file' && (
                                        <div className="space-y-4">
                                            <input ref={fileInputRef} type="file" accept=".txt,.pdf" className="hidden" onChange={handleFileChange} />
                                            <button onClick={() => fileInputRef.current?.click()} disabled={importLoad}
                                                className="w-full py-10 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors hover:bg-white/5 disabled:opacity-40"
                                                style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                                                {importLoad ? <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#f5a623' }} /> : <FileText className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.2)' }} />}
                                                <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                                    {importLoad ? 'Lecture en cours...' : 'Cliquez pour choisir un fichier .txt ou .pdf'}
                                                </span>
                                                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Taille max : 5 Mo</span>
                                            </button>
                                        </div>
                                    )}

                                    {importTab === 'url' && (
                                        <div className="space-y-4">
                                            <div>
                                                <LBL>URL du site web</LBL>
                                                <input style={inp} onFocus={fo} onBlur={fb} placeholder="https://www.monentreprise.ci" value={importUrl} onChange={(e) => setImportUrl(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleImportUrl()} />
                                                <p className="text-[11px] mt-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>L&apos;IA va analyser la page d&apos;accueil et extraire les informations clés (produits, horaires, contact...)</p>
                                            </div>
                                            <button onClick={handleImportUrl} disabled={importLoad || !importUrl.trim()}
                                                className="w-full py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                                                style={{ background: 'linear-gradient(135deg, #f5a623, #f7b84b)', color: '#1a0e00' }}>
                                                {importLoad ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                                                {importLoad ? 'Analyse du site...' : 'Analyser le site'}
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                        <p className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>{importPreview.length} informations détectées — vérifiez avant d&apos;importer</p>
                                        {importPreview.map((item, i) => {
                                            const m = MODULES.find((mod) => mod.value === item.category);
                                            return (
                                                <div key={i} className="rounded-xl p-3 border flex gap-3" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                                                    <span className="text-lg flex-shrink-0">{m?.emoji ?? '📝'}</span>
                                                    <div className="min-w-0">
                                                        <p className="text-[12px] font-semibold text-white truncate">{item.title}</p>
                                                        <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.content}</p>
                                                    </div>
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-md self-start flex-shrink-0" style={{ background: m?.color ? m.color + '18' : 'rgba(255,255,255,0.06)', color: m?.color ?? 'rgba(255,255,255,0.4)' }}>{m?.label ?? item.category}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => setImportPreview([])} className="flex-1 py-2.5 rounded-xl text-[13px] hover:bg-white/5 transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>Recommencer</button>
                                        <button onClick={confirmImport} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #f5a623, #f7b84b)', color: '#1a0e00' }}>
                                            <Check className="w-4 h-4" />Tout importer
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ GENERATE FAQS MODAL ═══════════════════════════════ */}
            <AnimatePresence>
                {genFaqOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
                        <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
                            className="w-full max-w-2xl rounded-2xl border p-6 space-y-5" style={{ background: '#13151f', borderColor: 'rgba(167,139,250,0.2)' }}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-[15px] font-bold text-white flex items-center gap-2"><Wand2 className="w-4 h-4" style={{ color: '#a78bfa' }} />FAQs générées par l&apos;IA</p>
                                    <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{genFaqPreview.length} questions/réponses basées sur votre base de connaissances</p>
                                </div>
                                <button onClick={() => { setGenFaqOpen(false); setGenFaqPreview([]); }} className="p-2 rounded-lg hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.3)' }}><X className="w-4 h-4" /></button>
                            </div>
                            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                                {genFaqPreview.map((item, i) => (
                                    <div key={i} className="rounded-xl p-3 border" style={{ background: 'rgba(167,139,250,0.04)', borderColor: 'rgba(167,139,250,0.12)' }}>
                                        <p className="text-[12px] font-semibold text-white mb-1">❓ {item.title}</p>
                                        <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.content}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => { setGenFaqOpen(false); setGenFaqPreview([]); }} className="flex-1 py-2.5 rounded-xl text-[13px] hover:bg-white/5 transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>Annuler</button>
                                <button onClick={confirmGenFaqs} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #a78bfa, #818cf8)', color: 'white' }}>
                                    <Check className="w-4 h-4" />Ajouter à la base
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
