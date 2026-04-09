import React, { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { websiteService, PublicProfile } from '../../services/websiteService';
import { Vehicle } from '../../types';
import { MessageCircle, Search, ChevronDown, Car, MapPin, Send } from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const formatPrice = (n: number) => fmt.format(n);
const formatKm = (n: number) => `${new Intl.NumberFormat('pt-BR').format(n)} km`;
const PLACEHOLDER = 'https://placehold.co/600x400/e2e8f0/94a3b8?text=Sem+foto';

function buildWaUrl(phone: string, message: string) {
    const clean = phone.replace(/\D/g, '');
    const number = clean.startsWith('55') ? clean : `55${clean}`;
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

// ─── Theme Classes ───────────────────────────────────────────────────────────

interface TC {
    wrapper: string; nav: string; heroText: string; heroSubText: string; heroAlign: string;
    heroBtnOutline: string; sectionTitle: string;
    card: string; cardTitle: string; cardSub: string;
    cardBadge: string; cardBtnDetail: string; cardBtnWa: string;
    filterPill: string; filterPillActive: string;
    input: string; inputField: string; textarea: string;
    footer: string; footerText: string;
    formCard: string; formLabel: string; formTitle: string;
}

function getTC(theme: string): TC {
    switch (theme) {
        case 'glass': return {
            wrapper: 'min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white',
            nav: 'bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50',
            heroText: 'text-white text-4xl md:text-5xl font-extrabold drop-shadow',
            heroSubText: 'text-white/70 text-lg',
            heroAlign: 'text-center items-center',
            heroBtnOutline: 'border border-white/40 text-white hover:bg-white/10',
            sectionTitle: 'text-white font-bold',
            card: 'bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden hover:border-white/30 hover:-translate-y-1 transition-all duration-300',
            cardTitle: 'text-white font-bold', cardSub: 'text-white/50 text-xs',
            cardBadge: 'bg-white/15 text-white/80 text-xs px-2.5 py-0.5 rounded-full',
            cardBtnDetail: 'flex-1 border border-white/30 text-white text-sm font-semibold rounded-xl py-2.5 hover:bg-white/10 transition-colors text-center',
            cardBtnWa: 'flex-1 bg-green-500 text-white text-sm font-semibold rounded-xl py-2.5 hover:bg-green-400 transition-colors text-center flex items-center justify-center gap-1.5',
            filterPill: 'bg-white/10 text-white/70 border border-white/15 rounded-full px-3 py-1 text-xs hover:bg-white/20 transition-colors cursor-pointer',
            filterPillActive: 'bg-white text-slate-900 border-white rounded-full px-3 py-1 text-xs font-bold cursor-pointer',
            input: 'bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/50',
            inputField: 'w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/50',
            textarea: 'w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/50 resize-none',
            footer: 'bg-black/40 border-t border-white/10 mt-16',
            footerText: 'text-white/40 text-sm',
            formCard: 'bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl p-6 md:p-8',
            formLabel: 'text-white/60 text-xs font-semibold uppercase tracking-wider block mb-1',
            formTitle: 'text-white font-bold text-xl mb-1',
        };
        case 'premium': return {
            wrapper: 'min-h-screen bg-[#0a0a12] text-white',
            nav: 'bg-[#0a0a12]/95 backdrop-blur-xl border-b border-yellow-500/15 sticky top-0 z-50',
            heroText: 'text-white text-4xl md:text-5xl font-extrabold',
            heroSubText: 'text-gray-400 text-lg',
            heroAlign: 'text-center items-center',
            heroBtnOutline: 'border border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10',
            sectionTitle: 'text-white font-bold',
            card: 'bg-[#12121e] border border-yellow-500/15 rounded-2xl overflow-hidden hover:border-yellow-500/40 hover:-translate-y-1 transition-all duration-300',
            cardTitle: 'text-white font-bold', cardSub: 'text-gray-500 text-xs',
            cardBadge: 'bg-yellow-500/10 text-yellow-300 text-xs px-2.5 py-0.5 rounded-full border border-yellow-500/20',
            cardBtnDetail: 'flex-1 border border-yellow-500/30 text-yellow-400 text-sm font-semibold rounded-xl py-2.5 hover:bg-yellow-500/10 transition-colors text-center',
            cardBtnWa: 'flex-1 bg-green-600 text-white text-sm font-semibold rounded-xl py-2.5 hover:bg-green-500 transition-colors text-center flex items-center justify-center gap-1.5',
            filterPill: 'bg-[#1a1a2a] text-gray-400 border border-yellow-500/10 rounded-full px-3 py-1 text-xs hover:border-yellow-500/30 transition-colors cursor-pointer',
            filterPillActive: 'bg-yellow-500 text-black border-yellow-500 rounded-full px-3 py-1 text-xs font-bold cursor-pointer',
            input: 'bg-[#1a1a2a] border border-yellow-500/20 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-500/50',
            inputField: 'w-full bg-[#1a1a2a] border border-yellow-500/20 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-500/50',
            textarea: 'w-full bg-[#1a1a2a] border border-yellow-500/20 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-500/50 resize-none',
            footer: 'bg-[#060610] border-t border-yellow-500/10 mt-16',
            footerText: 'text-gray-600 text-sm',
            formCard: 'bg-[#12121e] border border-yellow-500/15 rounded-2xl p-6 md:p-8',
            formLabel: 'text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1',
            formTitle: 'text-white font-bold text-xl mb-1',
        };
        default: return { // classic
            wrapper: 'min-h-screen bg-gray-50 text-gray-900',
            nav: 'bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50',
            heroText: 'text-white text-4xl md:text-5xl font-extrabold drop-shadow',
            heroSubText: 'text-white/80 text-lg',
            heroAlign: 'text-left items-start',
            heroBtnOutline: 'border-2 border-white text-white hover:bg-white/10',
            sectionTitle: 'text-gray-900 font-bold',
            card: 'bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300',
            cardTitle: 'text-gray-900 font-bold', cardSub: 'text-gray-400 text-xs',
            cardBadge: 'bg-gray-100 text-gray-600 text-xs px-2.5 py-0.5 rounded-full',
            cardBtnDetail: 'flex-1 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl py-2.5 hover:bg-gray-200 transition-colors text-center',
            cardBtnWa: 'flex-1 bg-green-500 text-white text-sm font-semibold rounded-xl py-2.5 hover:bg-green-400 transition-colors text-center flex items-center justify-center gap-1.5',
            filterPill: 'bg-white text-gray-600 border border-gray-200 rounded-full px-3 py-1 text-xs hover:border-gray-400 transition-colors cursor-pointer',
            filterPillActive: 'text-white border-transparent rounded-full px-3 py-1 text-xs font-bold cursor-pointer',
            input: 'bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10',
            inputField: 'w-full bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10',
            textarea: 'w-full bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 resize-none',
            footer: 'bg-white border-t border-gray-100 mt-16',
            footerText: 'text-gray-400 text-sm',
            formCard: 'bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm',
            formLabel: 'text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1',
            formTitle: 'text-gray-900 font-bold text-xl mb-1',
        };
    }
}

// ─── Contact Form ─────────────────────────────────────────────────────────────

const ContactForm: React.FC<{ profile: PublicProfile; tc: TC }> = ({ profile, tc }) => {
    const [form, setForm] = useState({ name: '', phone: '', message: '' });
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile.website_whatsapp || !form.name || !form.phone) return;
        const msg = `Olá, *${profile.company_name}*! Me chamo *${form.name}*, telefone: ${form.phone}.${form.message ? ` ${form.message}` : ''}`;
        window.open(buildWaUrl(profile.website_whatsapp, msg), '_blank');
        setSent(true);
        setForm({ name: '', phone: '', message: '' });
        setTimeout(() => setSent(false), 4000);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className={tc.formLabel}>Seu nome *</label>
                    <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Como podemos te chamar?" className={tc.inputField} />
                </div>
                <div>
                    <label className={tc.formLabel}>Telefone *</label>
                    <input required type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="(11) 99999-9999" className={tc.inputField} />
                </div>
            </div>
            <div>
                <label className={tc.formLabel}>Mensagem</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Qual veículo te interessa? Tem alguma dúvida?" rows={3} className={tc.textarea} />
            </div>
            <button type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-colors"
                style={{ backgroundColor: sent ? '#16a34a' : profile.website_primary_color || '#10b981' }}>
                {sent ? <><Send size={16} /> Mensagem enviada!</> : <><MessageCircle size={16} /> Enviar via WhatsApp</>}
            </button>
        </form>
    );
};

// ─── Vehicle Card ─────────────────────────────────────────────────────────────

const VehicleCard: React.FC<{ vehicle: Vehicle; slug: string; tc: TC; profile: PublicProfile }> = ({ vehicle, slug, tc, profile }) => {
    const waMsg = `Olá! Tenho interesse no ${vehicle.brand} ${vehicle.model} ${vehicle.year}. Poderia me dar mais informações?`;
    const waUrl = buildWaUrl(profile.website_whatsapp, waMsg);
    const priceStyle = profile.website_theme === 'classic' ? { color: profile.website_primary_color } : undefined;

    return (
        <div className={tc.card}>
            <div className="relative overflow-hidden aspect-[4/3]">
                <img src={vehicle.imageUrl || PLACEHOLDER} alt={`${vehicle.brand} ${vehicle.model}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {vehicle.year}
                </div>
                {(vehicle.galleryImages?.length ?? 0) > 0 && (
                    <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                        +{vehicle.galleryImages.length} fotos
                    </div>
                )}
            </div>
            <div className="p-4">
                <h3 className={`text-base ${tc.cardTitle}`}>{vehicle.brand} {vehicle.model}</h3>
                <p className={tc.cardSub}>{vehicle.type} · {vehicle.color}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className={tc.cardBadge}>{formatKm(vehicle.mileage)}</span>
                    <span className={tc.cardBadge}>{vehicle.transmission}</span>
                    <span className={tc.cardBadge}>{vehicle.engine}</span>
                </div>
                <p className="text-xl font-extrabold mt-3" style={priceStyle}>
                    {formatPrice(vehicle.price)}
                </p>
                <div className="flex gap-2 mt-3">
                    <div className={tc.cardBtnDetail}>
                        Ver Detalhes
                    </div>
                    {profile.website_whatsapp && (
                        <a href={waUrl} target="_blank" rel="noopener noreferrer" className={tc.cardBtnWa} onClick={e => e.stopPropagation()}>
                            <MessageCircle size={15} />
                            Tenho Interesse
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const PublicSiteHome: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [search, setSearch] = useState('');
    const [activeType, setActiveType] = useState('Todos');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        if (!slug) return;
        (async () => {
            const result = await websiteService.getProfileBySlug(slug);
            if (!result.profile || result.reason !== 'ok') { setNotFound(true); setLoading(false); return; }
            setProfile(result.profile);
            const v = await websiteService.getVehiclesByUserId(result.profile.id);
            setVehicles(v);
            setLoading(false);
        })();
    }, [slug]);

    // Reset showAll when filters change
    useEffect(() => {
        setShowAll(false);
    }, [activeType, search, sortOrder]);

    const tc = useMemo(() => getTC(profile?.website_theme || 'classic'), [profile?.website_theme]);
    const primary = profile?.website_primary_color || '#10b981';
    const secondary = profile?.website_secondary_color || primary;

    const heroStyle: React.CSSProperties = useMemo(() => {
        if (!profile) return {};
        if (profile.website_use_gradient)
            return { background: `linear-gradient(135deg, ${primary}, ${secondary})` };
        if (profile.website_theme === 'glass') return {};  // uses CSS class
        if (profile.website_theme === 'premium') return {}; // uses CSS class
        return { background: `linear-gradient(135deg, #1e293b, #334155)` }; // classic default
    }, [profile, primary, secondary]);

    const types = useMemo(() => ['Todos', ...Array.from(new Set(vehicles.map(v => v.type)))], [vehicles]);

    const filtered = useMemo(() => {
        let list = [...vehicles];
        if (activeType !== 'Todos') list = list.filter(v => v.type === activeType);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(v => v.brand.toLowerCase().includes(q) || v.model.toLowerCase().includes(q));
        }
        list.sort((a, b) => sortOrder === 'asc' ? a.price - b.price : b.price - a.price);
        return list;
    }, [vehicles, activeType, search, sortOrder]);

    const displayedVehicles = useMemo(() => {
        return showAll ? filtered : filtered.slice(0, 9);
    }, [filtered, showAll]);

    const mainWaUrl = profile?.website_whatsapp
        ? buildWaUrl(profile.website_whatsapp, `Olá! Vim pelo site ${profile.company_name} e gostaria de saber mais sobre os veículos disponíveis.`)
        : '#';

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 text-sm">Carregando...</p>
            </div>
        </div>
    );

    if (notFound || !profile) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="text-6xl mb-4">🚗</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Site não encontrado</h1>
                <p className="text-gray-500">O endereço que você acessou não existe ou o site está desativado.</p>
            </div>
        </div>
    );

    const seoTitle = `${profile.company_name}${profile.website_city ? ` — ${profile.website_city}` : ''} | Veículos à Venda`;
    const seoDesc = profile.website_hero_subtitle || profile.website_hero_text || `Confira os melhores veículos em ${profile.company_name}${profile.website_city ? `, ${profile.website_city}` : ''}.`;

    // Background color style
    const bgStyle: React.CSSProperties = {};
    if (profile?.website_background_color) {
        if (profile.website_bg_gradient && profile.website_bg_color2) {
            bgStyle.background = `linear-gradient(135deg, ${profile.website_background_color}, ${profile.website_bg_color2})`;
        } else {
            bgStyle.backgroundColor = profile.website_background_color;
        }
    }

    return (
        <div className={tc.wrapper} style={bgStyle}>
            <Helmet>
                <title>{seoTitle}</title>
                <meta name="description" content={seoDesc} />
                <meta property="og:title" content={seoTitle} />
                <meta property="og:description" content={seoDesc} />
                <meta property="og:type" content="website" />
                <meta name="robots" content="index, follow" />
            </Helmet>

            {/* Nav */}
            <nav className={tc.nav}>
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {profile.company_logo
                            ? <img src={profile.company_logo} alt={profile.company_name} className="h-9 w-auto object-contain" />
                            : <span className="text-lg font-extrabold">{profile.company_name}</span>
                        }
                        {profile.website_city && (
                            <span className="hidden sm:flex items-center gap-1 text-xs opacity-50">
                                <MapPin size={12} />{profile.website_city}
                            </span>
                        )}
                    </div>
                    {profile.website_whatsapp && (
                        <a href={mainWaUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-green-400 transition-colors">
                            <MessageCircle size={16} />
                            <span className="hidden sm:inline">WhatsApp</span>
                        </a>
                    )}
                </div>
            </nav>

            {/* Hero */}
            <section
                className="relative flex items-center justify-center overflow-hidden"
                style={{ minHeight: '500px' }}>
                {/* Background: image > gradient > theme default */}
                {profile.website_hero_image ? (
                    <>
                        <img
                            src={profile.website_hero_image}
                            alt="Hero"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50" />
                    </>
                ) : (
                    <div
                        className={`absolute inset-0 ${
                            profile.website_theme === 'glass'
                                ? 'bg-gradient-to-r from-indigo-900/80 to-purple-900/80'
                                : profile.website_theme === 'premium'
                                ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/20'
                                : ''
                        }`}
                        style={!profile.website_hero_image ? heroStyle : undefined}
                    />
                )}

                {/* Content */}
                <div className={`relative z-10 max-w-6xl mx-auto px-4 py-16 space-y-4 w-full flex flex-col ${tc.heroAlign}`}>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg">
                        {profile.website_hero_text || `Bem-vindo à ${profile.company_name}`}
                    </h1>
                    {profile.website_hero_subtitle && (
                        <p className="text-white/80 text-lg drop-shadow">
                            {profile.website_hero_subtitle}
                        </p>
                    )}
                    <p className="text-white/60 text-sm">
                        {filtered.length > 0
                            ? `${filtered.length} veículo${filtered.length > 1 ? 's' : ''} disponíve${filtered.length > 1 ? 'is' : 'l'} agora`
                            : 'Confira nosso estoque'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                        <a href="#estoque"
                            className="px-7 py-3.5 rounded-xl text-sm font-bold text-white transition-colors hover:opacity-90 shadow-lg"
                            style={{ backgroundColor: profile.website_theme === 'premium' ? '#eab308' : (profile.website_theme === 'glass' ? 'rgba(255,255,255,0.25)' : primary) }}>
                            Ver Estoque
                        </a>
                        {profile.website_whatsapp && (
                            <a href={mainWaUrl} target="_blank" rel="noopener noreferrer"
                                className="px-7 py-3.5 rounded-xl text-sm font-bold border-2 border-white text-white hover:bg-white/15 transition-colors shadow-lg">
                                Falar no WhatsApp
                            </a>
                        )}
                    </div>
                </div>
            </section>

            {/* Inventory */}
            <section id="estoque" className="max-w-6xl mx-auto px-4 py-12">
                {/* For Glass/Premium: Sidebar layout */}
                {profile.website_theme !== 'classic' ? (
                    <div className="flex gap-6">
                        {/* Sidebar - Filtros */}
                        <div className="w-56 shrink-0">
                            <h3 className={`text-lg font-bold mb-4 ${tc.sectionTitle}`}>Filtros</h3>

                            {/* Search */}
                            <div className="mb-6">
                                <label className={`text-xs font-semibold opacity-60 mb-2 block`}>Buscar</label>
                                <div className="relative">
                                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
                                    <input value={search} onChange={e => setSearch(e.target.value)}
                                        placeholder="Marca ou modelo..."
                                        className={`${tc.input} w-full pl-10`} />
                                </div>
                            </div>

                            {/* Type filter */}
                            {types.length > 1 && (
                                <div className="mb-6">
                                    <label className={`text-xs font-semibold opacity-60 mb-2 block`}>Tipo</label>
                                    <div className="space-y-2">
                                        {types.map(type => (
                                            <button key={type} onClick={() => setActiveType(type)}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeType === type ? tc.filterPillActive : tc.filterPill}`}
                                                style={activeType === type && profile.website_theme === 'classic' ? { backgroundColor: primary } : undefined}>
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sort */}
                            <div className="mb-6">
                                <label className={`text-xs font-semibold opacity-60 mb-2 block`}>Ordenar</label>
                                <div className="relative">
                                    <select value={sortOrder} onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
                                        className={`${tc.input} w-full pr-8 appearance-none cursor-pointer`}>
                                        <option value="asc">Menor preço</option>
                                        <option value="desc">Maior preço</option>
                                    </select>
                                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <p className={`text-sm mb-4 ${tc.sectionTitle}`}>
                                {filtered.length} veículo{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
                            </p>

                            {filtered.length === 0 ? (
                                <div className="text-center py-20 opacity-40">
                                    <Car size={48} className="mx-auto mb-3 opacity-30" />
                                    <p className="font-medium">Nenhum veículo encontrado</p>
                                    <p className="text-sm mt-1">Tente outros filtros ou entre em contato.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {displayedVehicles.map(vehicle => (
                                            <Link key={vehicle.id} to={`/site/${slug}/veiculo/${vehicle.id}`}>
                                                <VehicleCard vehicle={vehicle} slug={slug!} tc={tc} profile={profile} />
                                            </Link>
                                        ))}
                                    </div>
                                    {!showAll && filtered.length > 9 && (
                                        <div className="text-center mt-8">
                                            <button onClick={() => setShowAll(true)}
                                                className={`px-8 py-3 rounded-xl font-semibold text-sm transition-colors ${tc.filterPillActive}`}
                                                style={{ backgroundColor: primary }}>
                                                Ver todos os {filtered.length} veículos
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    // Classic layout - horizontal filters
                    <>
                        <div className="flex flex-col md:flex-row gap-3 mb-6">
                            <div className="relative flex-1">
                                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Buscar por marca ou modelo..."
                                    className={`${tc.input} w-full pl-10`} />
                            </div>
                            <div className="relative">
                                <select value={sortOrder} onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
                                    className={`${tc.input} pr-8 appearance-none cursor-pointer`}>
                                    <option value="asc">Menor preço</option>
                                    <option value="desc">Maior preço</option>
                                </select>
                                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
                            </div>
                        </div>

                        {types.length > 1 && (
                            <div className="flex flex-wrap gap-2 mb-5">
                                {types.map(type => (
                                    <button key={type} onClick={() => setActiveType(type)}
                                        className={activeType === type ? tc.filterPillActive : tc.filterPill}
                                        style={activeType === type && profile.website_theme === 'classic' ? { backgroundColor: primary } : undefined}>
                                        {type}
                                    </button>
                                ))}
                            </div>
                        )}

                        <p className={`text-sm mb-4 ${tc.sectionTitle}`}>
                            {filtered.length} veículo{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
                        </p>

                        {filtered.length === 0 ? (
                            <div className="text-center py-20 opacity-40">
                                <Car size={48} className="mx-auto mb-3 opacity-30" />
                                <p className="font-medium">Nenhum veículo encontrado</p>
                                <p className="text-sm mt-1">Tente outros filtros ou entre em contato.</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {displayedVehicles.map(vehicle => (
                                        <Link key={vehicle.id} to={`/site/${slug}/veiculo/${vehicle.id}`}>
                                            <VehicleCard vehicle={vehicle} slug={slug!} tc={tc} profile={profile} />
                                        </Link>
                                    ))}
                                </div>
                                {!showAll && filtered.length > 9 && (
                                    <div className="text-center mt-8">
                                        <button onClick={() => setShowAll(true)}
                                            className={`px-8 py-3 rounded-xl font-semibold text-sm transition-colors ${tc.filterPillActive}`}
                                            style={{ backgroundColor: primary }}>
                                            Ver todos os {filtered.length} veículos
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </section>

            {/* CTA Banner */}
            {profile.website_whatsapp && (
                <section className="max-w-6xl mx-auto px-4 pb-8">
                    <div className="rounded-2xl p-8 text-center text-white"
                        style={{ background: profile.website_use_gradient ? `linear-gradient(135deg, ${primary}, ${secondary})` : `linear-gradient(135deg, ${primary}dd, ${primary}99)` }}>
                        <h2 className="text-2xl font-extrabold mb-2">Não encontrou o que procurava?</h2>
                        <p className="text-white/80 mb-5">Fale com nossa equipe e encontre o veículo ideal para você.</p>
                        <a href={mainWaUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-white font-bold px-7 py-3.5 rounded-xl hover:bg-white/90 transition-colors"
                            style={{ color: primary }}>
                            <MessageCircle size={18} />
                            Chamar no WhatsApp
                        </a>
                    </div>
                </section>
            )}

            {/* Contact Form + Google Maps */}
            {(profile.website_whatsapp || profile.website_google_maps) && (
                <section className="max-w-6xl mx-auto px-4 pb-8">
                    <div className={tc.formCard}>
                        <h2 className={tc.formTitle}>Entre em Contato</h2>
                        {profile.website_city && (
                            <p className="flex items-center gap-1 text-sm opacity-50 mb-5">
                                <MapPin size={13} /> {profile.website_city}
                            </p>
                        )}
                        <div className={`grid grid-cols-1 ${profile.website_google_maps ? 'md:grid-cols-2' : ''} gap-8`}>
                            {profile.website_whatsapp && (
                                <div>
                                    <p className="text-sm opacity-60 mb-4">Preencha o formulário e entraremos em contato pelo WhatsApp.</p>
                                    <ContactForm profile={profile} tc={tc} />
                                </div>
                            )}
                            {profile.website_google_maps && (
                                <div>
                                    <p className={`text-sm font-semibold mb-3 ${tc.formLabel}`}>Como chegar</p>
                                    <iframe src={profile.website_google_maps} width="100%" height="320"
                                        className="rounded-xl border-0 w-full" loading="lazy"
                                        allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className={tc.footer}>
                <div className="max-w-6xl mx-auto px-4 py-8 text-center">
                    <p className={tc.footerText}>
                        © {new Date().getFullYear()} {profile.company_name}{profile.website_city ? ` — ${profile.website_city}` : ''}. Todos os direitos reservados.
                    </p>
                    <p className="text-xs opacity-25 mt-1">Powered by nLeads</p>
                </div>
            </footer>

            {/* Floating WA */}
            {profile.website_whatsapp && (
                <a href={mainWaUrl} target="_blank" rel="noopener noreferrer"
                    className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-400 hover:scale-110 transition-all z-50">
                    <MessageCircle size={26} className="text-white" />
                </a>
            )}
        </div>
    );
};

export default PublicSiteHome;
