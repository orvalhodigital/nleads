import React, { useState, useEffect, useRef } from 'react';
import {
    Globe, Eye, Copy, Check, ChevronDown, ChevronUp,
    ExternalLink, Phone, Server, Info, Monitor, Layers,
    MapPin, Loader2, CheckCircle2, XCircle, AlertCircle,
    Type, Sparkles, ImageIcon, X
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { profileService } from '../services/profileService';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabaseClient';

// ─── Helpers ────────────────────────────────────────────────────────────────

const generateSlug = (name: string): string =>
    name.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ─── Color Palettes ──────────────────────────────────────────────────────────

const PALETTES = [
    { id: 'bw',        name: 'P&B',          primary: '#111827', secondary: '#6b7280', title: '#111827', text: '#374151', gradient: false },
    { id: 'blue',      name: 'Azul',          primary: '#1d4ed8', secondary: '#3b82f6', title: '#1e3a8a', text: '#1d4ed8', gradient: false },
    { id: 'green',     name: 'Verde',         primary: '#16a34a', secondary: '#22c55e', title: '#14532d', text: '#15803d', gradient: false },
    { id: 'amber',     name: 'Âmbar',         primary: '#d97706', secondary: '#f59e0b', title: '#92400e', text: '#b45309', gradient: false },
    { id: 'pgrad',     name: 'Azul→Roxo',    primary: '#1d4ed8', secondary: '#7c3aed', title: '#1e3a8a', text: '#4c1d95', gradient: true  },
    { id: 'ggrad',     name: 'Verde→Ciano',  primary: '#059669', secondary: '#0891b2', title: '#064e3b', text: '#0e7490', gradient: true  },
    { id: 'ograd',     name: 'Laranja→Rosa', primary: '#ea580c', secondary: '#db2777', title: '#7c2d12', text: '#831843', gradient: true  },
    { id: 'darkgrad',  name: 'Preto→Ouro',   primary: '#1a1a2e', secondary: '#d97706', title: '#000000', text: '#374151', gradient: true  },
];

// ─── Themes ──────────────────────────────────────────────────────────────────

const THEMES = [
    {
        id: 'classic' as const,
        name: 'Classic',
        description: 'Fundo branco, tipografia clara e profissional.',
        previewBg: 'bg-white',
        previewBorder: 'border-gray-200',
        bars: ['bg-gray-200', 'bg-gray-100', 'bg-gray-200'],
    },
    {
        id: 'glass' as const,
        name: 'Glass',
        description: 'Glassmorphismo com gradiente escuro e blur.',
        previewBg: 'bg-gradient-to-br from-slate-800 to-indigo-900',
        previewBorder: 'border-white/20',
        bars: ['bg-white/15', 'bg-white/8', 'bg-white/15'],
    },
    {
        id: 'premium' as const,
        name: 'Premium',
        description: 'Escuro e luxuoso com detalhes dourados.',
        previewBg: 'bg-[#0a0a12]',
        previewBorder: 'border-yellow-500/30',
        bars: ['bg-yellow-500/20', 'bg-[#12121e]', 'bg-yellow-500/20'],
    },
];

// ─── Color Field ─────────────────────────────────────────────────────────────

const ColorField: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
    <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">{label}</label>
        <div className="flex items-center gap-2">
            <input type="color" value={value} onChange={e => onChange(e.target.value)}
                className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 shrink-0" />
            <input value={value} onChange={e => onChange(e.target.value)} placeholder="#000000"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" />
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'short';

const WebsitePage: React.FC = () => {
    const { profile, refreshProfile } = useData();
    const { showToast } = useToast();

    // State
    const [active, setActive]             = useState(false);
    const [theme, setTheme]               = useState<'classic' | 'glass' | 'premium'>('classic');
    const [primaryColor, setPrimaryColor] = useState('#10b981');
    const [secondaryColor, setSecondary]  = useState('#0891b2');
    const [titleColor, setTitleColor]     = useState('#111827');
    const [textColor, setTextColor]       = useState('#374151');
    const [useGradient, setUseGradient]   = useState(false);
    const [backgroundColor, setBackgroundColor]         = useState('');
    const [bgColor2, setBgColor2]                       = useState('');
    const [bgGradient, setBgGradient]                   = useState(false);
    const [heroImage, setHeroImage]       = useState('');
    const [heroImageUploading, setHeroImageUploading] = useState(false);
    const [heroText, setHeroText]         = useState('');
    const [heroSubtitle, setHeroSubtitle] = useState('');
    const [whatsapp, setWhatsapp]         = useState('');
    const [city, setCity]                 = useState('');
    const [googleMaps, setGoogleMaps]     = useState('');
    const [slug, setSlug]                 = useState('');
    const [customDomain, setCustomDomain] = useState('');
    const [saving, setSaving]             = useState(false);
    const [copied, setCopied]             = useState(false);
    const [showDns, setShowDns]           = useState(false);
    const [slugStatus, setSlugStatus]     = useState<SlugStatus>('idle');

    const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!profile) return;
        setActive(profile.website_active || false);
        setTheme(profile.website_theme || 'classic');
        setPrimaryColor(profile.website_primary_color || '#10b981');
        setSecondary(profile.website_secondary_color || '#0891b2');
        setTitleColor(profile.website_title_color || '#111827');
        setTextColor(profile.website_text_color || '#374151');
        setUseGradient(profile.website_use_gradient || false);
        setBackgroundColor(profile.website_background_color || '');
        setBgColor2(profile.website_bg_color2 || '');
        setBgGradient(profile.website_bg_gradient || false);
        setHeroImage(profile.website_hero_image || '');
        setHeroText(profile.website_hero_text || '');
        setHeroSubtitle(profile.website_hero_subtitle || '');
        setWhatsapp(profile.website_whatsapp || '');
        setCity(profile.website_city || '');
        setGoogleMaps(profile.website_google_maps || '');
        const autoSlug = profile.website_slug || (profile.company_name ? generateSlug(profile.company_name) : '');
        setSlug(autoSlug);
        setCustomDomain(profile.custom_domain || '');
    }, [profile]);

    // ─── Slug checker ─────────────────────────────────────────────────────────

    const handleSlugChange = (raw: string) => {
        const clean = raw.toLowerCase().replace(/[^a-z0-9-]/g, '');
        setSlug(clean);
        setSlugStatus('idle');
        if (slugTimer.current) clearTimeout(slugTimer.current);

        if (clean.length < 3) { setSlugStatus('short'); return; }
        if (clean === profile?.website_slug) { setSlugStatus('available'); return; }

        setSlugStatus('checking');
        slugTimer.current = setTimeout(async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id')
                .eq('website_slug', clean)
                .neq('id', profile?.id || '')
                .maybeSingle();
            setSlugStatus(data ? 'taken' : 'available');
        }, 600);
    };

    const slugIndicator = () => {
        switch (slugStatus) {
            case 'checking':
                return <span className="flex items-center gap-1 text-xs text-slate-400"><Loader2 size={12} className="animate-spin" /> Verificando...</span>;
            case 'available':
                return <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold"><CheckCircle2 size={12} /> Disponível</span>;
            case 'taken':
                return <span className="flex items-center gap-1 text-xs text-red-500 font-semibold"><XCircle size={12} /> Indisponível, tente outro</span>;
            case 'short':
                return <span className="flex items-center gap-1 text-xs text-slate-400"><AlertCircle size={12} /> Mínimo 3 caracteres</span>;
            default:
                return null;
        }
    };

    // ─── Apply palette ────────────────────────────────────────────────────────

    const applyPalette = (p: typeof PALETTES[0]) => {
        setPrimaryColor(p.primary);
        setSecondary(p.secondary);
        setTitleColor(p.title);
        setTextColor(p.text);
        setUseGradient(p.gradient);
    };

    // ─── Copy URL ─────────────────────────────────────────────────────────────

    const handleCopy = async () => {
        try { await navigator.clipboard.writeText(`veiculos.nleads.pro/${slug}`); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /**/ }
    };

    // ─── Save ─────────────────────────────────────────────────────────────────

    const handleSave = async () => {
        if (!slug || slug.length < 3) { showToast('error', 'Defina um endereço com mínimo 3 caracteres.'); return; }
        if (slugStatus === 'taken') { showToast('error', 'Escolha um endereço disponível antes de salvar.'); return; }
        setSaving(true);
        try {
            await profileService.updateProfile({
                website_active: active,
                website_theme: theme,
                website_primary_color: primaryColor,
                website_secondary_color: secondaryColor,
                website_text_color: textColor,
                website_title_color: titleColor,
                website_use_gradient: useGradient,
                website_background_color: backgroundColor,
                website_bg_color2: bgColor2,
                website_bg_gradient: bgGradient,
                website_hero_image: heroImage,
                website_hero_text: heroText,
                website_hero_subtitle: heroSubtitle,
                website_whatsapp: whatsapp,
                website_city: city,
                website_google_maps: googleMaps,
                website_slug: slug,
                custom_domain: customDomain,
            });
            await refreshProfile();
            showToast('success', 'Configurações do website salvas!');
        } catch (err: any) {
            showToast('error', err?.message || 'Erro ao salvar configurações.');
        } finally {
            setSaving(false);
        }
    };

    const previewUrl = `/site/${slug}`;
    const gradientPreview = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Globe size={20} className="text-emerald-600" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Website</h1>
                    <p className="text-sm text-slate-500">Configure e publique o site público da sua loja</p>
                </div>
            </div>

            {/* ── 1. Status + URL ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                {/* Toggle */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Monitor size={17} className="text-slate-400" />
                        <span className="font-semibold text-slate-800 text-sm">Status do Site</span>
                    </div>
                    <button onClick={() => setActive(v => !v)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${active ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                <div className={`text-xs px-3 py-2 rounded-xl border ${active ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                    {active ? 'Seu site está publicado e visível ao público.' : 'Seu site está desativado.'}
                </div>

                {/* Slug */}
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Endereço do Site</label>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 gap-1.5 min-w-0">
                            <span className="text-[11px] text-slate-400 shrink-0">veiculos.nleads.pro/</span>
                            <input value={slug} onChange={e => handleSlugChange(e.target.value)}
                                placeholder="nome-da-loja"
                                className="flex-1 bg-transparent text-sm font-mono text-slate-700 outline-none min-w-0" />
                        </div>
                        <button onClick={handleCopy} title="Copiar"
                            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                            {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                        </button>
                        <a href={previewUrl} target="_blank" rel="noopener noreferrer" title="Visualizar"
                            className="p-2.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-600 transition-colors">
                            <Eye size={15} />
                        </a>
                    </div>
                    <div className="mt-1.5 h-4">{slugIndicator()}</div>
                </div>
            </div>

            {/* ── 2. Theme ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Layers size={17} className="text-slate-400" />
                    <span className="font-semibold text-slate-800 text-sm">Tema</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {THEMES.map(t => (
                        <button key={t.id} onClick={() => setTheme(t.id)}
                            className={`rounded-xl overflow-hidden border-2 text-left transition-all ${theme === t.id ? 'border-emerald-500 shadow-md' : 'border-slate-100 hover:border-slate-300'}`}>
                            <div className={`h-16 ${t.previewBg} p-2 flex flex-col gap-1`}>
                                {t.bars.map((b, i) => <div key={i} className={`h-2.5 rounded-md ${b} border ${t.previewBorder}`} />)}
                            </div>
                            <div className="p-2 bg-white border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800">{t.name}</span>
                                    {theme === t.id && <Check size={11} className="text-emerald-500" />}
                                </div>
                                <p className="text-[9px] text-slate-400 mt-0.5 leading-tight line-clamp-2">{t.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── 3. Colors ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 rounded-full" style={{ background: useGradient ? gradientPreview : primaryColor }} />
                    <span className="font-semibold text-slate-800 text-sm">Cores & Estilo</span>
                </div>

                {/* Palettes */}
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Paletas Rápidas</label>
                    <div className="flex flex-wrap gap-2">
                        {PALETTES.map(p => (
                            <button key={p.id} onClick={() => applyPalette(p)} title={p.name}
                                className="flex flex-col items-center gap-1 group">
                                <div className="w-9 h-9 rounded-xl border-2 border-white shadow-md hover:scale-110 transition-transform"
                                    style={{ background: p.gradient ? `linear-gradient(135deg, ${p.primary}, ${p.secondary})` : p.primary }} />
                                <span className="text-[9px] text-slate-400 group-hover:text-slate-600">{p.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Gradient toggle */}
                <div className="flex items-center justify-between py-2 border-t border-slate-50">
                    <div>
                        <p className="text-sm font-medium text-slate-700">Usar Degradê</p>
                        <p className="text-xs text-slate-400">Aplica degradê de Cor Principal → Secundária no hero</p>
                    </div>
                    <button onClick={() => setUseGradient(v => !v)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${useGradient ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${useGradient ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                {/* Preview gradient bar */}
                {useGradient && (
                    <div className="h-3 rounded-full" style={{ background: gradientPreview }} />
                )}

                {/* Color pickers grid */}
                <div className="grid grid-cols-2 gap-3">
                    <ColorField label="Cor Principal" value={primaryColor} onChange={setPrimaryColor} />
                    <ColorField label="Cor Secundária" value={secondaryColor} onChange={setSecondary} />
                    <ColorField label="Cor dos Títulos" value={titleColor} onChange={setTitleColor} />
                    <ColorField label="Cor do Texto" value={textColor} onChange={setTextColor} />
                </div>
            </div>

            {/* ── 3b. Background Color ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 rounded-full" style={{ background: bgGradient ? `linear-gradient(135deg, ${backgroundColor}, ${bgColor2})` : backgroundColor || '#f3f4f6' }} />
                    <span className="font-semibold text-slate-800 text-sm">Cor de Fundo</span>
                </div>

                {/* Palettes para background */}
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Paletas Rápidas</label>
                    <div className="flex flex-wrap gap-2">
                        {PALETTES.map(p => (
                            <button key={`bg-${p.id}`} onClick={() => {
                                setBackgroundColor(p.primary);
                                setBgColor2(p.secondary);
                                setBgGradient(p.gradient);
                            }} title={`Fundo - ${p.name}`}
                                className="flex flex-col items-center gap-1 group">
                                <div className="w-9 h-9 rounded-xl border-2 border-white shadow-md hover:scale-110 transition-transform"
                                    style={{ background: p.gradient ? `linear-gradient(135deg, ${p.primary}, ${p.secondary})` : p.primary }} />
                                <span className="text-[9px] text-slate-400 group-hover:text-slate-600">{p.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Gradient toggle */}
                <div className="flex items-center justify-between py-2 border-t border-slate-50">
                    <div>
                        <p className="text-sm font-medium text-slate-700">Usar Degradê</p>
                        <p className="text-xs text-slate-400">Aplica degradê na cor de fundo</p>
                    </div>
                    <button onClick={() => setBgGradient(v => !v)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${bgGradient ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${bgGradient ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                {/* Preview gradient bar */}
                {bgGradient && (
                    <div className="h-3 rounded-full" style={{ background: `linear-gradient(135deg, ${backgroundColor}, ${bgColor2})` }} />
                )}

                {/* Color pickers grid */}
                <div className="grid grid-cols-2 gap-3">
                    <ColorField label="Cor de Fundo" value={backgroundColor} onChange={setBackgroundColor} />
                    {bgGradient && <ColorField label="Cor Secundária" value={bgColor2} onChange={setBgColor2} />}
                </div>
            </div>

            {/* ── 4. Personalization ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={17} className="text-slate-400" />
                    <span className="font-semibold text-slate-800 text-sm">Personalização</span>
                </div>

                {/* Hero Image */}
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                        <ImageIcon size={10} /> Imagem de Fundo da Hero
                    </label>
                    {heroImage ? (
                        <div className="relative rounded-xl overflow-hidden h-32 border border-slate-200">
                            <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
                                <label className="cursor-pointer bg-white/90 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-white transition-colors">
                                    Trocar
                                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file || !profile) return;
                                        setHeroImageUploading(true);
                                        try {
                                            const ext = file.name.split('.').pop();
                                            const path = `hero/${profile.id}-${Date.now()}.${ext}`;
                                            const { error } = await supabase.storage.from('vehicles').upload(path, file, { upsert: true });
                                            if (!error) {
                                                const { data: urlData } = supabase.storage.from('vehicles').getPublicUrl(path);
                                                setHeroImage(urlData.publicUrl);
                                            }
                                        } finally { setHeroImageUploading(false); }
                                    }} />
                                </label>
                                <button onClick={() => setHeroImage('')}
                                    className="bg-red-500/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-500 transition-colors">
                                    Remover
                                </button>
                            </div>
                            {heroImageUploading && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <Loader2 size={24} className="text-white animate-spin" />
                                </div>
                            )}
                        </div>
                    ) : (
                        <label className={`flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all ${heroImageUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            {heroImageUploading
                                ? <Loader2 size={20} className="text-emerald-500 animate-spin" />
                                : <>
                                    <ImageIcon size={20} className="text-slate-300 mb-2" />
                                    <span className="text-xs text-slate-400 font-medium">Clique para fazer upload</span>
                                    <span className="text-[10px] text-slate-300 mt-0.5">JPG, PNG, WebP até 5MB</span>
                                </>
                            }
                            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file || !profile) return;
                                setHeroImageUploading(true);
                                try {
                                    const ext = file.name.split('.').pop();
                                    const path = `hero/${profile.id}-${Date.now()}.${ext}`;
                                    const { error } = await supabase.storage.from('vehicles').upload(path, file, { upsert: true });
                                    if (!error) {
                                        const { data: urlData } = supabase.storage.from('vehicles').getPublicUrl(path);
                                        setHeroImage(urlData.publicUrl);
                                    }
                                } finally { setHeroImageUploading(false); }
                            }} />
                        </label>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">Quando vazia, o hero usa a cor/degradê selecionado acima.</p>
                </div>

                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                        <MapPin size={10} /> Cidade
                    </label>
                    <input value={city} onChange={e => setCity(e.target.value)} placeholder="Ex: São Paulo, SP"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" />
                </div>

                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                        <Type size={10} /> Título do Hero
                    </label>
                    <input value={heroText} onChange={e => setHeroText(e.target.value)} placeholder="Ex: Os melhores veículos da região"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" />
                </div>

                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                        <Type size={10} /> Subtítulo do Hero
                    </label>
                    <input value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} placeholder="Ex: Financiamento facilitado, entrada zero"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" />
                </div>

                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                        <Phone size={10} /> WhatsApp — CTA Principal (com DDD)
                    </label>
                    <input value={whatsapp} onChange={e => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                        placeholder="Ex: 11999998888" maxLength={13}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" />
                    <p className="text-[10px] text-slate-400 mt-1">Todos os botões do site abrem conversa neste número.</p>
                </div>
            </div>

            {/* ── 5. Google Maps ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                    <MapPin size={17} className="text-slate-400" />
                    <span className="font-semibold text-slate-800 text-sm">Google Maps</span>
                </div>
                <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3">
                    <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700">
                        No Google Maps, clique em <strong>Compartilhar → Incorporar mapa</strong>, copie apenas o atributo <code className="bg-blue-100 px-1 rounded">src="..."</code> e cole abaixo.
                    </p>
                </div>
                <input value={googleMaps} onChange={e => setGoogleMaps(e.target.value)}
                    placeholder="https://www.google.com/maps/embed?pb=..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" />
                {googleMaps && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 h-40">
                        <iframe src={googleMaps} width="100%" height="100%" className="border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                    </div>
                )}
            </div>

            {/* ── 6. DNS ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <button onClick={() => setShowDns(v => !v)}
                    className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                        <Server size={17} className="text-slate-400" />
                        <span className="font-semibold text-slate-800 text-sm">DNS / Domínio Personalizado</span>
                    </div>
                    {showDns ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>

                {showDns && (
                    <div className="px-5 pb-5 space-y-4 border-t border-slate-100">
                        <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3 mt-4">
                            <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-700">
                                Seu site já fica disponível em <strong>veiculos.nleads.pro/{slug || 'sua-loja'}</strong>.
                                Para usar domínio próprio, configure os registros abaixo no provedor de DNS.
                            </p>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">URL padrão</label>
                            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                                <span className="text-sm font-mono text-slate-700">veiculos.nleads.pro/{slug || 'sua-loja'}</span>
                                <ExternalLink size={13} className="text-slate-400" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Registros DNS para domínio próprio</label>
                            <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                                <div className="grid grid-cols-3 gap-2 px-4 py-2 bg-slate-50 text-[9px] font-bold text-slate-400 uppercase">
                                    <span>Tipo</span><span>Nome</span><span>Valor</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 px-4 py-3 text-xs font-mono text-slate-700">
                                    <span className="text-indigo-600 font-bold">A</span><span>@</span><span>76.76.21.21</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 px-4 py-3 text-xs font-mono text-slate-700">
                                    <span className="text-indigo-600 font-bold">CNAME</span><span>www</span><span>veiculos.nleads.pro</span>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1.5">A propagação pode levar até 48 horas.</p>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Domínio personalizado</label>
                            <input value={customDomain} onChange={e => setCustomDomain(e.target.value.toLowerCase())}
                                placeholder="Ex: estoque.minhaloja.com.br"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" />
                        </div>
                    </div>
                )}
            </div>

            {/* Save */}
            <div className="flex justify-end pb-8">
                <button onClick={handleSave} disabled={saving || slugStatus === 'taken'}
                    className="px-7 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-sm">
                    {saving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
            </div>
        </div>
    );
};

export default WebsitePage;
