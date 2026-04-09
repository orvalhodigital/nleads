import React, { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { websiteService, PublicProfile } from '../../services/websiteService';
import { Vehicle } from '../../types';
import {
    MessageCircle, Search, ChevronDown, Car, Phone,
    MapPin, Instagram, Facebook, X
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const formatPrice = (n: number) => fmt.format(n);
const formatKm = (n: number) => `${new Intl.NumberFormat('pt-BR').format(n)} km`;

function buildWaUrl(phone: string, message: string) {
    const clean = phone.replace(/\D/g, '');
    const number = clean.startsWith('55') ? clean : `55${clean}`;
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

const PLACEHOLDER = 'https://placehold.co/600x400/e2e8f0/94a3b8?text=Sem+foto';

// ─── Theme Classes ───────────────────────────────────────────────────────────

interface TC {
    wrapper: string;
    nav: string;
    hero: string;
    heroTitle: string;
    heroSub: string;
    heroBtnPrimary: string;
    heroBtnOutline: string;
    sectionBg: string;
    sectionTitle: string;
    card: string;
    cardBadge: string;
    cardTitle: string;
    cardSub: string;
    cardPrice: string;
    cardBtnDetail: string;
    cardBtnWa: string;
    filterPill: string;
    filterPillActive: string;
    input: string;
    footer: string;
    footerText: string;
}

function getTC(theme: string): TC {
    switch (theme) {
        case 'glass':
            return {
                wrapper: 'min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white',
                nav: 'bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50',
                hero: 'relative bg-gradient-to-r from-indigo-900/60 to-purple-900/60 backdrop-blur border-b border-white/10',
                heroTitle: 'text-white text-4xl md:text-5xl font-extrabold drop-shadow',
                heroSub: 'text-white/70 text-lg',
                heroBtnPrimary: 'bg-white text-slate-900 font-bold hover:bg-white/90',
                heroBtnOutline: 'border border-white/40 text-white hover:bg-white/10',
                sectionBg: '',
                sectionTitle: 'text-white font-bold',
                card: 'bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden hover:border-white/30 hover:-translate-y-1 transition-all duration-300',
                cardBadge: 'bg-white/15 text-white/80 text-xs px-2.5 py-0.5 rounded-full',
                cardTitle: 'text-white font-bold',
                cardSub: 'text-white/50 text-xs',
                cardPrice: 'text-white text-xl font-extrabold',
                cardBtnDetail: 'flex-1 border border-white/30 text-white text-sm font-semibold rounded-xl py-2.5 hover:bg-white/10 transition-colors text-center',
                cardBtnWa: 'flex-1 bg-green-500 text-white text-sm font-semibold rounded-xl py-2.5 hover:bg-green-400 transition-colors text-center flex items-center justify-center gap-1.5',
                filterPill: 'bg-white/10 text-white/70 border border-white/15 rounded-full px-3 py-1 text-xs hover:bg-white/20 transition-colors cursor-pointer',
                filterPillActive: 'bg-white text-slate-900 border-white rounded-full px-3 py-1 text-xs font-bold cursor-pointer',
                input: 'bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/50',
                footer: 'bg-black/40 border-t border-white/10 mt-16',
                footerText: 'text-white/40 text-sm',
            };
        case 'premium':
            return {
                wrapper: 'min-h-screen bg-[#0a0a12] text-white',
                nav: 'bg-[#0a0a12]/95 backdrop-blur-xl border-b border-yellow-500/15 sticky top-0 z-50',
                hero: 'relative bg-gradient-to-r from-yellow-900/20 to-orange-900/10 border-b border-yellow-500/15',
                heroTitle: 'text-white text-4xl md:text-5xl font-extrabold',
                heroSub: 'text-gray-400 text-lg',
                heroBtnPrimary: 'bg-yellow-500 text-black font-bold hover:bg-yellow-400',
                heroBtnOutline: 'border border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10',
                sectionBg: '',
                sectionTitle: 'text-white font-bold',
                card: 'bg-[#12121e] border border-yellow-500/15 rounded-2xl overflow-hidden hover:border-yellow-500/40 hover:-translate-y-1 transition-all duration-300',
                cardBadge: 'bg-yellow-500/10 text-yellow-300 text-xs px-2.5 py-0.5 rounded-full border border-yellow-500/20',
                cardTitle: 'text-white font-bold',
                cardSub: 'text-gray-500 text-xs',
                cardPrice: 'text-yellow-400 text-xl font-extrabold',
                cardBtnDetail: 'flex-1 border border-yellow-500/30 text-yellow-400 text-sm font-semibold rounded-xl py-2.5 hover:bg-yellow-500/10 transition-colors text-center',
                cardBtnWa: 'flex-1 bg-green-600 text-white text-sm font-semibold rounded-xl py-2.5 hover:bg-green-500 transition-colors text-center flex items-center justify-center gap-1.5',
                filterPill: 'bg-[#1a1a2a] text-gray-400 border border-yellow-500/10 rounded-full px-3 py-1 text-xs hover:border-yellow-500/30 transition-colors cursor-pointer',
                filterPillActive: 'bg-yellow-500 text-black border-yellow-500 rounded-full px-3 py-1 text-xs font-bold cursor-pointer',
                input: 'bg-[#1a1a2a] border border-yellow-500/20 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-500/50',
                footer: 'bg-[#060610] border-t border-yellow-500/10 mt-16',
                footerText: 'text-gray-600 text-sm',
            };
        default: // classic
            return {
                wrapper: 'min-h-screen bg-gray-50 text-gray-900',
                nav: 'bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50',
                hero: 'relative bg-gradient-to-r from-slate-800 to-slate-700',
                heroTitle: 'text-white text-4xl md:text-5xl font-extrabold drop-shadow',
                heroSub: 'text-white/80 text-lg',
                heroBtnPrimary: 'font-bold text-white hover:opacity-90',
                heroBtnOutline: 'border-2 border-white text-white hover:bg-white/10',
                sectionBg: 'bg-gray-50',
                sectionTitle: 'text-gray-900 font-bold',
                card: 'bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300',
                cardBadge: 'bg-gray-100 text-gray-600 text-xs px-2.5 py-0.5 rounded-full',
                cardTitle: 'text-gray-900 font-bold',
                cardSub: 'text-gray-400 text-xs',
                cardPrice: 'text-xl font-extrabold',
                cardBtnDetail: 'flex-1 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl py-2.5 hover:bg-gray-200 transition-colors text-center',
                cardBtnWa: 'flex-1 bg-green-500 text-white text-sm font-semibold rounded-xl py-2.5 hover:bg-green-400 transition-colors text-center flex items-center justify-center gap-1.5',
                filterPill: 'bg-white text-gray-600 border border-gray-200 rounded-full px-3 py-1 text-xs hover:border-gray-400 transition-colors cursor-pointer',
                filterPillActive: 'text-white border-transparent rounded-full px-3 py-1 text-xs font-bold cursor-pointer',
                input: 'bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10',
                footer: 'bg-white border-t border-gray-100 mt-16',
                footerText: 'text-gray-400 text-sm',
            };
    }
}

// ─── Vehicle Card ─────────────────────────────────────────────────────────────

interface VehicleCardProps {
    vehicle: Vehicle;
    slug: string;
    tc: TC;
    primaryColor: string;
    waPhone: string;
    ctaText: string;
    theme: string;
    companyName: string;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, slug, tc, primaryColor, waPhone, ctaText, theme, companyName }) => {
    const waMsg = `Olá! Tenho interesse no ${vehicle.brand} ${vehicle.model} ${vehicle.year} anunciado em seu site. Poderia me dar mais informações?`;
    const waUrl = buildWaUrl(waPhone, waMsg);

    return (
        <div className={tc.card}>
            {/* Image */}
            <div className="relative overflow-hidden aspect-[4/3]">
                <img
                    src={vehicle.imageUrl || PLACEHOLDER}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                />
                <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {vehicle.year}
                </div>
                {vehicle.galleryImages?.length > 0 && (
                    <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                        +{vehicle.galleryImages.length} fotos
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className={`text-base ${tc.cardTitle}`}>{vehicle.brand} {vehicle.model}</h3>
                <p className={tc.cardSub}>{vehicle.type} · {vehicle.color}</p>

                <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className={tc.cardBadge}>{formatKm(vehicle.mileage)}</span>
                    <span className={tc.cardBadge}>{vehicle.transmission}</span>
                    <span className={tc.cardBadge}>{vehicle.engine}</span>
                </div>

                <div className="flex items-end justify-between mt-3">
                    <span
                        className={tc.cardPrice}
                        style={theme === 'classic' ? { color: primaryColor } : undefined}
                    >
                        {formatPrice(vehicle.price)}
                    </span>
                </div>

                <div className="flex gap-2 mt-3">
                    <Link to={`/site/${slug}/veiculo/${vehicle.id}`} className={tc.cardBtnDetail}>
                        Ver Detalhes
                    </Link>
                    <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={tc.cardBtnWa}
                    >
                        <MessageCircle size={15} />
                        {ctaText}
                    </a>
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

    // Filters
    const [search, setSearch] = useState('');
    const [activeType, setActiveType] = useState('Todos');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    useEffect(() => {
        if (!slug) return;
        (async () => {
            const p = await websiteService.getProfileBySlug(slug);
            if (!p) { setNotFound(true); setLoading(false); return; }
            setProfile(p);
            const v = await websiteService.getVehiclesByUserId(p.id);
            setVehicles(v);
            setLoading(false);
        })();
    }, [slug]);

    const tc = useMemo(() => getTC(profile?.website_theme || 'classic'), [profile?.website_theme]);
    const primaryColor = profile?.website_primary_color || '#10b981';

    const types = useMemo(() => {
        const unique = Array.from(new Set(vehicles.map(v => v.type)));
        return ['Todos', ...unique];
    }, [vehicles]);

    const filtered = useMemo(() => {
        let list = [...vehicles];
        if (activeType !== 'Todos') list = list.filter(v => v.type === activeType);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(v =>
                v.brand.toLowerCase().includes(q) ||
                v.model.toLowerCase().includes(q)
            );
        }
        list.sort((a, b) => sortOrder === 'asc' ? a.price - b.price : b.price - a.price);
        return list;
    }, [vehicles, activeType, search, sortOrder]);

    const mainWaUrl = profile?.website_whatsapp
        ? buildWaUrl(profile.website_whatsapp, `Olá! Vim pelo site ${profile.company_name} e gostaria de saber mais sobre os veículos disponíveis.`)
        : '#';

    // ── States ────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 text-sm">Carregando...</p>
                </div>
            </div>
        );
    }

    if (notFound || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-6xl mb-4">🚗</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Site não encontrado</h1>
                    <p className="text-gray-500">O endereço que você acessou não existe ou o site está desativado.</p>
                </div>
            </div>
        );
    }

    // ── Page ─────────────────────────────────────────────────────────────────

    const seoTitle = `${profile.company_name} — Veículos à Venda`;
    const seoDesc = profile.website_hero_text || `Confira os melhores veículos disponíveis em ${profile.company_name}. Carros, SUVs, picapes e mais com ótimas condições de pagamento.`;

    return (
        <div className={tc.wrapper}>
            <Helmet>
                <title>{seoTitle}</title>
                <meta name="description" content={seoDesc} />
                <meta property="og:title" content={seoTitle} />
                <meta property="og:description" content={seoDesc} />
                <meta property="og:type" content="website" />
                <meta name="robots" content="index, follow" />
            </Helmet>

            {/* Navigation */}
            <nav className={tc.nav}>
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {profile.company_logo ? (
                            <img src={profile.company_logo} alt={profile.company_name} className="h-9 w-auto object-contain" />
                        ) : (
                            <span className="text-lg font-extrabold">{profile.company_name}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hidden md:block text-sm opacity-60">{filtered.length} veículos</span>
                        {profile.website_whatsapp && (
                            <a
                                href={mainWaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-green-400 transition-colors"
                            >
                                <MessageCircle size={16} />
                                <span className="hidden sm:inline">WhatsApp</span>
                            </a>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className={`${tc.hero} py-16 md:py-24`}>
                <div className="max-w-6xl mx-auto px-4 text-center space-y-5">
                    <h1 className={tc.heroTitle}>
                        {profile.website_hero_text || `Bem-vindo à ${profile.company_name}`}
                    </h1>
                    <p className={tc.heroSub}>
                        {filtered.length > 0
                            ? `${filtered.length} veículo${filtered.length > 1 ? 's' : ''} disponíve${filtered.length > 1 ? 'is' : 'l'} agora`
                            : 'Confira nosso estoque exclusivo'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <a
                            href="#estoque"
                            className={`px-7 py-3.5 rounded-xl text-sm font-bold transition-colors ${tc.heroBtnPrimary}`}
                            style={profile.website_theme !== 'premium' && profile.website_theme !== 'glass' ? { backgroundColor: primaryColor } : undefined}
                        >
                            Ver Estoque
                        </a>
                        {profile.website_whatsapp && (
                            <a
                                href={mainWaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`px-7 py-3.5 rounded-xl text-sm font-bold transition-colors ${tc.heroBtnOutline}`}
                            >
                                Falar no WhatsApp
                            </a>
                        )}
                    </div>
                </div>
            </section>

            {/* Inventory Section */}
            <section id="estoque" className="max-w-6xl mx-auto px-4 py-12">

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-3 mb-8">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar por marca ou modelo..."
                            className={`${tc.input} w-full pl-10`}
                        />
                    </div>

                    {/* Sort */}
                    <div className="relative">
                        <select
                            value={sortOrder}
                            onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
                            className={`${tc.input} pr-8 appearance-none cursor-pointer`}
                        >
                            <option value="asc">Menor preço</option>
                            <option value="desc">Maior preço</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
                    </div>
                </div>

                {/* Type Pills */}
                {types.length > 1 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {types.map(type => (
                            <button
                                key={type}
                                onClick={() => setActiveType(type)}
                                className={activeType === type ? tc.filterPillActive : tc.filterPill}
                                style={activeType === type && profile.website_theme === 'classic' ? { backgroundColor: primaryColor } : undefined}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                )}

                {/* Results */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-lg ${tc.sectionTitle}`}>
                        {filtered.length} veículo{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
                    </h2>
                </div>

                {/* Grid */}
                {filtered.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <Car size={48} className="mx-auto mb-3 opacity-30" />
                        <p className="text-base font-medium">Nenhum veículo encontrado</p>
                        <p className="text-sm mt-1">Tente outros filtros ou entre em contato.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filtered.map(vehicle => (
                            <VehicleCard
                                key={vehicle.id}
                                vehicle={vehicle}
                                slug={slug!}
                                tc={tc}
                                primaryColor={primaryColor}
                                waPhone={profile.website_whatsapp}
                                ctaText={profile.website_cta_text || 'Tenho Interesse'}
                                theme={profile.website_theme || 'classic'}
                                companyName={profile.company_name}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* CTA Banner */}
            {profile.website_whatsapp && (
                <section className="max-w-6xl mx-auto px-4 pb-8">
                    <div
                        className="rounded-2xl p-8 text-center text-white"
                        style={{ background: `linear-gradient(135deg, ${primaryColor}dd, ${primaryColor}99)` }}
                    >
                        <h2 className="text-2xl font-extrabold mb-2">Não encontrou o que procurava?</h2>
                        <p className="text-white/80 mb-5">Fale com nossa equipe e encontre o veículo perfeito para você.</p>
                        <a
                            href={mainWaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-7 py-3.5 rounded-xl hover:bg-white/90 transition-colors"
                        >
                            <MessageCircle size={18} />
                            Chamar no WhatsApp
                        </a>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className={tc.footer}>
                <div className="max-w-6xl mx-auto px-4 py-8 text-center">
                    <p className={tc.footerText}>
                        © {new Date().getFullYear()} {profile.company_name}. Todos os direitos reservados.
                    </p>
                    <p className="text-xs opacity-30 mt-1">Powered by nLeads</p>
                </div>
            </footer>

            {/* Floating WhatsApp Button */}
            {profile.website_whatsapp && (
                <a
                    href={mainWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-400 hover:scale-110 transition-all z-50"
                    title="Falar no WhatsApp"
                >
                    <MessageCircle size={26} className="text-white" />
                </a>
            )}
        </div>
    );
};

export default PublicSiteHome;
