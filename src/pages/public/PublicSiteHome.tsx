import React, { useEffect, useState, useMemo, useRef, useCallback, Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { websiteService, PublicProfile } from '../../services/websiteService';
import { Vehicle } from '../../types';
import { toVehicleSlug } from '../../utils/vehicleSlug';
import { 
    MessageCircle, 
    Search, 
    ChevronDown, 
    Car, 
    MapPin, 
    Send, 
    Shield, 
    Award, 
    CreditCard, 
    RefreshCw, 
    Filter, 
    SlidersHorizontal, 
    ExternalLink, 
    Menu, 
    X,
    Star,
    Clock,
    Check,
    CheckCircle2,
    Users,
    DollarSign,
    Sparkles,
    ThumbsUp,
    Wrench,
    Lock,
    Calendar,
    AlertTriangle,
    Info,
    HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PublicNavbar } from '../../components/PublicNavbar';
import { PublicFooter } from '../../components/PublicFooter';

const ContactSection = React.lazy(() => import('../../components/public/ContactSection'));


// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const formatPrice = (n: number) => fmt.format(n);
const formatKm = (n: number) => `${new Intl.NumberFormat('pt-BR').format(n)} km`;
const PLACEHOLDER = 'https://placehold.co/600x400/e2e8f0/94a3b8?text=Sem+foto';

const buildWaUrl = (phone: string, message: string) => {
    const clean = phone.replace(/\D/g, '');
    const number = clean.startsWith('55') ? clean : `55${clean}`;
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
};

const replaceVariables = (text: string, data: { vehicle?: any; profile?: any }) => {
    if (!text) return '';
    return text
        .replace(/\[NOME\]/gi, data.vehicle?.model || data.profile?.company_name || '')
        .replace(/\[MARCA\]/gi, data.vehicle?.brand || '')
        .replace(/\[MODELO\]/gi, data.vehicle?.model || '')
        .replace(/\[ANO\]/gi, String(data.vehicle?.year || ''))
        .replace(/\[PRECO\]/gi, data.vehicle ? fmt.format(data.vehicle.price) : '');
};

const IconMap: Record<string, React.ComponentType<any>> = {
    MessageCircle,
    Search,
    ChevronDown,
    Car,
    MapPin,
    Send,
    Shield,
    Award,
    CreditCard,
    RefreshCw,
    Filter,
    SlidersHorizontal,
    ExternalLink,
    Menu,
    X,
    Star,
    Clock,
    Check,
    CheckCircle2,
    Users,
    DollarSign,
    Sparkles,
    ThumbsUp,
    Wrench,
    Lock,
    Calendar,
    AlertTriangle,
    Info,
    HelpCircle
};

const DynamicIcon = ({ name, ...props }: { name?: string; size?: number; className?: string; style?: React.CSSProperties }) => {
    if (!name) return <Shield {...props} />;
    const normalized = name.charAt(0).toUpperCase() + name.slice(1);
    const IconComponent = IconMap[name] || IconMap[normalized];
    if (!IconComponent) return <Shield {...props} />;
    return <IconComponent {...props} />;
};

// Categorias de veículos
const VEHICLE_CATEGORIES = ['Sedan', 'Hatch', 'SUV', 'Picape', 'Esportivo', 'Conversível', 'Van', 'Naked', 'Sport', 'Trail', 'Custom', 'Scooter', 'Touring', 'Elétrica', 'Street'];
const MAIN_TYPES = ['Carro', 'Moto'];

function groupVehiclesByType(vehicles: Vehicle[]) {
    const grouped: Record<string, Vehicle[]> = {};
    vehicles.forEach(v => {
        if (!grouped[v.type]) grouped[v.type] = [];
        grouped[v.type].push(v);
    });
    return grouped;
}

function groupVehiclesByMainType(vehicles: Vehicle[]) {
    const visibleVehicles = vehicles.filter(v => v.showOnWebsite !== false);
    const carros = visibleVehicles.filter(v => !['Naked', 'Sport', 'Trail', 'Custom', 'Scooter', 'Touring', 'Elétrica', 'Street'].includes(v.type));
    const motos = visibleVehicles.filter(v => ['Naked', 'Sport', 'Trail', 'Custom', 'Scooter', 'Touring', 'Elétrica', 'Street'].includes(v.type));
    return { carros, motos };
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

// Classes visuais do site público. Hoje só existe o modelo 'classic';
// ver docs/DECISOES-E-ROADMAP.md para o roadmap de múltiplos modelos.
function getTC(primary: string, profile?: PublicProfile): TC {

    return {
            wrapper: `min-h-screen ${profile?.website_card_style === 'square' ? 'rounded-none' : ''} bg-[#f8fafc] text-slate-900`,
            nav: 'bg-white/80 backdrop-blur-2xl border-b border-slate-100/50 sticky top-0 z-50 shadow-sm transition-all',
            heroText: 'text-slate-900 text-3xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[1.1] md:leading-[1.05] text-center',
            heroSubText: 'text-slate-600 text-base md:text-xl font-medium mt-4 max-w-2xl text-center mx-auto',
            heroAlign: 'text-center items-center justify-center',
            heroBtnOutline: 'border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold transition-all shadow-sm bg-white',
            sectionTitle: 'text-slate-900 font-black text-2xl md:text-4xl tracking-tight leading-none',
            card: `bg-white border border-slate-100 ${profile?.website_card_style === 'square' ? 'rounded-none' : 'rounded-[24px]'} overflow-hidden shadow-[0_10px_28px_rgba(15,23,42,0.03)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-all duration-300`,
            cardTitle: 'text-slate-900 font-bold text-xl tracking-tight',
            cardSub: 'text-slate-400 font-bold text-[10px] uppercase tracking-widest',
            cardBadge: 'bg-slate-50 text-slate-600 text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider border border-slate-100',
            cardBtnDetail: 'hidden',
            cardBtnWa: 'flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-700 text-xs font-bold rounded-xl px-4 py-2 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-all text-center',
            filterPill: 'px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all shadow-sm',
            filterPillActive: 'px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold shadow-lg shadow-slate-900/20 transition-all border border-slate-900',
            input: 'bg-white border-2 border-slate-100 text-slate-900 placeholder-slate-400 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-brand-500 transition-all shadow-sm',
            inputField: 'w-full bg-white border-2 border-slate-100 text-slate-900 placeholder-slate-400 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-brand-500 transition-all',
            textarea: 'w-full bg-white border-2 border-slate-100 text-slate-900 placeholder-slate-400 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-brand-500 transition-all resize-none',
            footer: 'mt-24 bg-slate-900 border-t border-slate-800 pt-16 pb-8',
            footerText: 'text-slate-400 text-[11px] font-bold uppercase tracking-widest',
            formCard: `bg-white ${profile?.website_card_style === 'square' ? 'rounded-none' : 'rounded-3xl md:rounded-[32px]'} border border-slate-100 p-6 md:p-14 shadow-[0_20px_50px_rgba(0,0,0,0.05)]`,
            formLabel: 'text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5 block',
            formTitle: 'text-2xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight',
        };
}

// ─── Category Section ────────────────────────────────────────────────────────

const CategorySection: React.FC<{
    title: string;
    vehicles: Vehicle[];
    slug: string;
    tc: TC;
    profile: PublicProfile;
    theme: string;
    primary: string;
    onViewMore: () => void;
}> = ({ title, vehicles, slug, tc, profile, theme, primary, onViewMore }) => {
    if (vehicles.length === 0) return null;

    const displayed = vehicles.slice(0, 4);

    return (
        <div className="space-y-6">
            <div>
                <h3 className={`text-2xl font-bold mb-1 ${theme === 'classic' ? 'text-stone-900 pb-3 border-b-4' : 'text-white uppercase tracking-widest'}`}
                    style={theme === 'classic' ? { borderColor: primary, fontFamily: "'Fraunces', Georgia, serif" } : {}}>
                    {title}
                </h3>
                <p className={`text-sm ${theme === 'classic' ? 'text-stone-500' : 'text-white/60'}`}>
                    {vehicles.length} veículo{vehicles.length !== 1 ? 's' : ''}
                </p>
            </div>

            <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6`}>
                {displayed.map((vehicle, i) => (
                    <motion.div 
                        key={vehicle.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className="h-full"
                    >
                        <VehicleCard vehicle={vehicle} slug={slug} tc={tc} profile={profile} />
                    </motion.div>
                ))}
            </div>

            {vehicles.length > 4 && (
                <div className="text-center">
                    <button onClick={onViewMore}
                        className={`px-8 py-4 rounded font-bold text-sm transition-all ${
                            theme === 'classic' ? `bg-white text-slate-900 border-2 hover:shadow-lg` :
                            'bg-slate-800 hover:bg-slate-700 text-white'
                        }`}
                        style={theme === 'classic' ? { borderColor: primary, color: primary } : {}}>
                        Ver todos os {vehicles.length} {title.toLowerCase()}
                    </button>
                </div>
            )}
        </div>
    );
};



// ─── Price Slider ─────────────────────────────────────────────────────────────

const HatchSVG = () => <span className="text-4xl leading-none select-none" role="img" aria-label="Hatch">🚗</span>;
const SedanSVG = () => <span className="text-4xl leading-none select-none" role="img" aria-label="Sedan">🚕</span>;
const SUVSVG  = () => <span className="text-4xl leading-none select-none" role="img" aria-label="SUV">🚙</span>;
const SportSVG = () => <span className="text-4xl leading-none select-none" role="img" aria-label="Esportivo">🏎️</span>;

const CAR_STAGES = [
    { pct: 0.25, icon: HatchSVG, color: '#3b82f6' },
    { pct: 0.50, icon: SedanSVG, color: '#06b6d4' },
    { pct: 0.75, icon: SUVSVG,   color: '#10b981' },
    { pct: 1,    icon: SportSVG, color: '#16a34a' },
];

const PriceSlider: React.FC<{
    value: number;
    max: number;
    primary: string;
    matchCount: number;
    onChange: (v: number) => void;
}> = ({ value, max, primary, matchCount, onChange }) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState(false);
    const STEP = 5000;

    const pct = value === 0 ? 1 : Math.min(1, value / max);
    const stage = CAR_STAGES.find(s => pct <= s.pct) || CAR_STAGES[3];
    const CarIcon = stage.icon;

    const snap = (v: number) => Math.round(v / STEP) * STEP;
    const getVal = useCallback((clientX: number) => {
        if (!trackRef.current) return 0;
        const { left, width } = trackRef.current.getBoundingClientRect();
        const ratio = Math.max(0.02, Math.min(1, (clientX - left) / width));
        return snap(ratio * max);
    }, [max, snap]);

    const onPointerDown = (e: React.PointerEvent) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setDragging(true);
        onChange(getVal(e.clientX));
    };
    const onPointerMove = (e: React.PointerEvent) => {
        if (!dragging) return;
        onChange(getVal(e.clientX));
    };
    const onPointerUp = () => setDragging(false);

    const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
    const displayValue = value === 0 ? max : value;

    return (
        <div className="space-y-2 pt-1">
            {/* Car icon + price label */}
            <div className="flex items-end justify-between mb-1">
                <div className="flex flex-col items-start gap-0.5">
                    <span className="text-xl font-black text-slate-900 tabular-nums leading-none">
                        {fmt.format(displayValue)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                        {matchCount} veículo{matchCount !== 1 ? 's' : ''} disponíve{matchCount !== 1 ? 'is' : 'l'}
                    </span>
                </div>
                <motion.div
                    key={stage.color}
                    initial={{ opacity: 0, scale: 0.7, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="flex items-center justify-center"
                >
                    <CarIcon />
                </motion.div>
            </div>

            {/* Track */}
            <div
                ref={trackRef}
                className="relative h-10 flex items-center cursor-pointer select-none touch-none"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
            >
                {/* Background track */}
                <div className="absolute inset-x-0 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full rounded-full"
                        animate={{ width: `${pct * 100}%` }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        style={{ background: `linear-gradient(90deg, #3b82f6, ${stage.color})` }}
                    />
                </div>
                {/* Handle */}
                <motion.div
                    className="absolute w-6 h-6 bg-white rounded-full shadow-lg border-2 pointer-events-none"
                    animate={{ left: `calc(${pct * 100}% - 12px)` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    style={{ borderColor: stage.color, top: '50%', marginTop: '-12px' }}
                />
                {/* Stage markers */}
                {CAR_STAGES.slice(0, 2).map((s, i) => (
                    <div key={i}
                        className="absolute w-1 h-1 rounded-full bg-slate-300 pointer-events-none"
                        style={{ left: `${s.pct * 100}%`, top: '50%', marginTop: '-2px' }}
                    />
                ))}
            </div>

            {/* Min / Max labels */}
            <div className="flex justify-between text-[9px] font-bold text-slate-300 px-0.5">
                <span>{fmt.format(STEP)}</span>
                <span>{fmt.format(max)}</span>
            </div>
        </div>
    );
};

// ─── Premium Card ─────────────────────────────────────────────────────────────

const VehicleCard: React.FC<{ vehicle: Vehicle; slug: string; tc: TC; profile: PublicProfile }> = ({ vehicle, slug, tc, profile }) => {
    const waMsg = profile.preset_messages?.[0] 
        ? replaceVariables(profile.preset_messages[0], { vehicle, profile })
        : `Olá! Tenho interesse no ${vehicle.brand} ${vehicle.model} ${vehicle.year}. Poderia me dar mais informações?`;
    const waUrl = buildWaUrl(profile.website_whatsapp || '', waMsg);
    
    return (
        <Link to={`/site/${slug}/veiculo/${toVehicleSlug(vehicle)}`} className="block h-full">
            <div className={tc.card + " flex flex-col h-full group"}>
                <div className="relative aspect-square overflow-hidden bg-slate-100">
                    {vehicle.imageUrl ? (
                        <img src={vehicle.imageUrl} alt={`${vehicle.brand} ${vehicle.model}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-2xl m-2">
                            <Car size={64} strokeWidth={1} />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-2">Sem Foto</span>
                        </div>
                    )}
                    <div className="absolute top-4 left-4">
                        <span className={tc.cardBadge}>{vehicle.year}</span>
                    </div>
                </div>
                <div className="p-3 md:p-6 flex flex-col flex-1">
                    <div className="mb-2 md:mb-4">
                        <p className={tc.cardSub + " !text-[8px] md:!text-[10px]"}>{vehicle.type}</p>
                        <h3 className={tc.cardTitle + " !text-sm md:!text-xl line-clamp-1"}>{vehicle.brand} {vehicle.model}</h3>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 md:gap-2 mb-4 md:mb-6">
                        <span className={tc.cardBadge + " !px-2 !py-0.5 !text-[8px] md:!text-[10px]"}>{formatKm(vehicle.mileage)}</span>
                        <span className={tc.cardBadge + " !px-2 !py-0.5 !text-[8px] md:!text-[10px]"}>{vehicle.transmission.split(' ')[0]}</span>
                    </div>

                    <div className="mt-auto pt-4 border-t border-white/5 flex items-end justify-between">
                        <div>
                            <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5 md:mb-1">Preço</p>
                            <p className="text-base md:text-2xl font-black tracking-tight" style={{ color: profile.website_primary_color }}>
                                {formatPrice(vehicle.price)}
                            </p>
                        </div>
                        {profile.website_whatsapp && (
                            <a href={waUrl} target="_blank" rel="noopener noreferrer" className={tc.cardBtnWa + " !flex-initial px-2 md:px-4 !py-2 md:!py-3"} onClick={e => e.stopPropagation()}>
                                <MessageCircle size={14} className="md:w-[18px] md:h-[18px]" />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const PublicSiteHome: React.FC<{ forcedSlug?: string }> = ({ forcedSlug }) => {
    const params = useParams<{ slug: string }>();
    const slug = forcedSlug ?? params.slug;
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [search, setSearch] = useState('');
    const [activeType, setActiveType] = useState('Todos');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [showAll, setShowAll] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [vehicleSearch, setVehicleSearch] = useState('');
    const [maxPriceFilter, setMaxPriceFilter] = useState(0);
    const [typeFilter, setTypeFilter] = useState('Todos');

    useEffect(() => {
        if (!slug) return;
        (async () => {
            try {
                setLoading(true);
                const result = await websiteService.getProfileBySlug(slug);
                if (!result.profile || result.reason !== 'ok') { 
                    setNotFound(true); 
                    setLoading(false); 
                    return; 
                }
                setProfile(result.profile);
                const v = await websiteService.getVehiclesByUserId(result.profile.id);
                setVehicles(v);
            } catch (err) {
                console.error('[PublicSiteHome] Fetch error:', err);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        })();
    }, [slug]);

    const tc = useMemo(() => getTC(profile?.website_primary_color || '#10b981', profile || undefined), [profile?.website_theme, profile?.website_primary_color, profile]);
    const theme = profile?.website_theme || 'classic';
    const primary = profile?.website_primary_color || '#10b981';
    const secondary = profile?.website_secondary_color || '#0891b2';

    const mainWaMsg = profile?.preset_messages?.[0] ? replaceVariables(profile.preset_messages[0], { profile }) : `Olá! Vim pelo site ${profile?.company_name}.`;
    const mainWaUrl = profile?.website_whatsapp ? buildWaUrl(profile.website_whatsapp, mainWaMsg) : '#';

    const types = useMemo(() => {
        const t = Array.from(new Set(vehicles.map(v => v.type)));
        return ['Todos', ...t];
    }, [vehicles]);


    const hasAdvancedFilters = !!(vehicleSearch || maxPriceFilter > 0 || typeFilter !== 'Todos');

    const clearAdvancedFilters = () => {
        setVehicleSearch('');
        setMaxPriceFilter(0);
        setTypeFilter('Todos');
    };

    const heroStyle: React.CSSProperties = {
        background: profile?.website_use_gradient
            ? `linear-gradient(135deg, ${primary}, ${secondary})`
            : primary
    };


    const seoTitle = profile?.website_optimization?.meta_title || `${profile?.company_name} — Veículos de Procedência`;
    const seoDesc = profile?.website_optimization?.meta_description || `Confira nosso estoque de veículos em ${profile?.website_city || 'sua região'}. Qualidade e transparência.`;

    // Reset showAll when filters change
    useEffect(() => {
        setShowAll(false);
    }, [activeType, search, sortOrder, vehicleSearch, maxPriceFilter, typeFilter]);

    const stockMaxPrice = useMemo(() => {
        if (!vehicles.length) return 200000;
        const max = Math.max(...vehicles.map(v => v.price));
        // Round up to nearest 10k
        return Math.ceil(max / 10000) * 10000;
    }, [vehicles]);

    const filtered = useMemo(() => {
        let list = [...vehicles];
        if (activeType !== 'Todos') list = list.filter(v => v.type === activeType);
        if (typeFilter !== 'Todos') list = list.filter(v => v.type === typeFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(v => v.brand.toLowerCase().includes(q) || v.model.toLowerCase().includes(q));
        }
        if (vehicleSearch.trim()) {
            const q = vehicleSearch.toLowerCase();
            list = list.filter(v => v.brand.toLowerCase().includes(q) || v.model.toLowerCase().includes(q));
        }
        if (maxPriceFilter > 0) {
            list = list.filter(v => v.price <= maxPriceFilter);
        }
        list.sort((a, b) => sortOrder === 'asc' ? a.price - b.price : b.price - a.price);
        return list;
    }, [vehicles, activeType, search, sortOrder, vehicleSearch, maxPriceFilter, typeFilter]);

    const displayedVehicles = useMemo(() => {
        if (showAll) return filtered;
        // Premium uses 8 (grid 4), Glass uses 9 (grid 3), others use 9 or 8
        // Grid is now always 4 columns, so use multiples of 4
        const limit = 8;
        return filtered.slice(0, limit);
    }, [filtered, showAll, theme]);

    const scrollToStock = (e?: React.MouseEvent | React.KeyboardEvent) => {
        if (e) e.preventDefault();
        const el = document.getElementById('estoque');
        if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500" />
        </div>
    );

    if (notFound || !profile) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center space-y-4 bg-white p-8 rounded-2xl shadow-xl max-w-md mx-4">
                <div className="text-5xl">⚠️</div>
                <h2 className="text-lg font-bold text-slate-900">Site não encontrado</h2>
                <p className="text-slate-600 text-sm leading-relaxed">O endereço que você acessou não existe ou o site está desativado.</p>
                <a
                    href="https://painel.orvalhodigital.com.br"
                    className="inline-block mt-4 px-6 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-900 transition"
                >
                    Ir para o Gestor de Pátio
                </a>
            </div>
        </div>
    );

    // Background color style
    const bgStyle: React.CSSProperties = {};
    if (profile?.website_background_color) {
        if (profile.website_bg_gradient && profile.website_bg_color2) {
            bgStyle.background = `linear-gradient(135deg, ${profile.website_background_color}, ${profile.website_bg_color2})`;
        } else {
            bgStyle.backgroundColor = profile.website_background_color;
        }
    }

    const fontStyle = { 
        fontFamily: profile?.website_typography === 'serif' ? 'Playfair Display, serif' : 
                    profile?.website_typography === 'oswald' ? 'Oswald, sans-serif' : 
                    'Inter, sans-serif' 
    };

    return (
        <div className={tc.wrapper} style={{ ...bgStyle, ...fontStyle }}>
            <Helmet>
                <title>{seoTitle}</title>
                <meta name="description" content={seoDesc} />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={window.location.href} />
                <meta property="og:title" content={seoTitle} />
                <meta property="og:description" content={seoDesc} />
                <meta property="og:site_name" content={profile.company_name} />
                {profile.company_logo && <meta property="og:image" content={profile.company_logo} />}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={seoTitle} />
                <meta name="twitter:description" content={seoDesc} />
                {profile.company_logo && <meta name="twitter:image" content={profile.company_logo} />}
                <meta name="robots" content="index, follow" />
            </Helmet>

            <PublicNavbar
                profile={profile}
                slug={slug!}
                tc={tc}
                theme={theme}
                primary={primary}
                mainWaUrl={mainWaUrl}
            />

            {/* Hero */}
                <>
                <section className="relative z-20 pb-24"
                    style={{
                        minHeight: '500px',
                        backgroundColor: '#0f172a' // fundo sempre escuro, para a máscara do hero
                    }}>
                    {/* Hero image with dark overlay */}
                    {profile.website_hero_image ? (
                        <>
                            <img src={profile.website_hero_image} alt="Hero" className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-900/60" />
                        </>
                    ) : (
                        <div className="absolute inset-0 bg-slate-900" />
                    )}

                    <div className="relative z-10 max-w-[1250px] mx-auto px-4 h-full flex flex-col justify-center pt-24 pb-16">
                        <div className={`w-full flex flex-col items-center justify-center text-center ${tc.heroAlign}`}>
                            <h1 className={tc.heroText + " text-white text-center"}>
                                {profile.website_hero_text || `Encontre seu próximo veículo`}
                            </h1>
                            {profile.website_hero_subtitle && (
                                <p className={tc.heroSubText + " text-white/80 text-center mx-auto"}>
                                    {profile.website_hero_subtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Floating Search Bar */}
                    <div className={`absolute left-0 right-0 z-20 max-w-[800px] mx-auto px-4 w-full transition-all duration-300 ${showAdvancedFilters ? '-bottom-[210px] md:-bottom-[180px]' : '-bottom-8'}`}>
                        <div className={`bg-white ${profile?.website_card_style === 'square' ? 'rounded-none' : 'rounded-2xl'} shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden`}>
                            {/* Main search row */}
                            <div className="p-2 md:p-3 flex flex-col md:flex-row gap-2">
                                <div className="flex-1 relative flex items-center">
                                    <Search size={20} className="absolute left-4 text-slate-400" />
                                    <input value={search} onChange={e => setSearch(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && scrollToStock(e)}
                                        placeholder="Busque por marca ou modelo..."
                                        className="w-full pl-12 pr-4 py-4 md:py-3 bg-transparent text-slate-900 font-bold placeholder-slate-400 focus:outline-none" />
                                </div>
                                <div className="w-full md:w-auto flex items-center gap-2">
                                    <a href="#estoque" onClick={scrollToStock}
                                        className={`flex-1 md:flex-none px-6 py-4 md:py-3 ${profile?.website_card_style === 'square' ? 'rounded-none' : 'rounded-xl'} text-white font-bold transition-all text-center cursor-pointer`}
                                        style={{ backgroundColor: primary }}>
                                        Buscar Ofertas
                                    </a>
                                    <button
                                        onClick={() => setShowAdvancedFilters(p => !p)}
                                        className={`flex-1 md:flex-none px-6 py-4 md:py-3 ${profile?.website_card_style === 'square' ? 'rounded-none' : 'rounded-xl'} font-bold transition-all text-center flex items-center justify-center gap-2 border-2 ${showAdvancedFilters ? 'bg-red-50 border-red-200' : 'bg-red-50/60 border-red-100 hover:bg-red-50'}`}
                                        style={{ color: '#dc2626' }}>
                                        <SlidersHorizontal size={16} />
                                        <span>Mais Opções</span>
                                        {hasAdvancedFilters && <span className="w-2 h-2 rounded-full bg-red-500 ml-0.5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Advanced filters panel */}
                            {showAdvancedFilters && (
                                <div className="px-3 pb-4 border-t border-slate-100">
                                    <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-4">
                                        {/* Marca + Modelo unificado */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Marca / Modelo</label>
                                            <div className="relative">
                                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                <input
                                                    value={vehicleSearch}
                                                    onChange={e => setVehicleSearch(e.target.value)}
                                                    placeholder="Ex: Honda, Civic…"
                                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-9 pr-4 py-2.5 text-sm font-bold text-slate-700 placeholder-slate-300 focus:outline-none focus:border-red-200 transition-all" />
                                            </div>
                                        </div>

                                        {/* Tipo */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tipo</label>
                                            <div className="relative">
                                                <select
                                                    value={typeFilter}
                                                    onChange={e => setTypeFilter(e.target.value)}
                                                    className="w-full appearance-none bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:border-red-200 transition-all cursor-pointer">
                                                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        {/* Preço — ocupa 2 colunas para o slider ter espaço */}
                                        <div className="col-span-2 space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Preço Máximo</label>
                                            <PriceSlider
                                                value={maxPriceFilter}
                                                max={stockMaxPrice}
                                                primary={primary}
                                                matchCount={filtered.length}
                                                onChange={setMaxPriceFilter}
                                            />
                                        </div>
                                    </div>

                                    {hasAdvancedFilters && (
                                        <div className="mt-3 flex justify-end">
                                            <button onClick={clearAdvancedFilters}
                                                className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors flex items-center gap-1">
                                                <X size={12} /> Limpar filtros
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <div className={`bg-white border-y border-slate-100`}>
                    <div className="max-w-[1250px] mx-auto px-4 pt-16 pb-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { active: profile.website_diff1_active ?? true, icon: profile.website_diff1_icon || 'Shield', label: profile.website_diff1_title || 'Veículos Revisados', sub: profile.website_diff1_sub || 'Inspeção completa' },
                            { active: profile.website_diff2_active ?? true, icon: profile.website_diff2_icon || 'Award', label: profile.website_diff2_title || 'Garantia Inclusa', sub: profile.website_diff2_sub || 'Pós-venda' },
                            { active: profile.website_diff3_active ?? true, icon: profile.website_diff3_icon || 'CreditCard', label: profile.website_diff3_title || 'Financiamento', sub: profile.website_diff3_sub || 'Até 60x' },
                            { active: profile.website_diff4_active ?? true, icon: profile.website_diff4_icon || 'RefreshCw', label: profile.website_diff4_title || 'Troca Aceita', sub: profile.website_diff4_sub || 'Avaliação grátis' },
                        ].filter(item => item.active).map((item, idx) => {
                            return (
                                <div key={idx} className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-slate-100 text-slate-900 border border-slate-200`}
                                        style={{ backgroundColor: primary + '15', color: primary, borderColor: primary + '30' }}>
                                        <DynamicIcon name={item.icon} size={22} />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-black tracking-tight text-slate-900`}>{item.label}</p>
                                        <p className={`text-[11px] font-medium text-slate-500`}>{item.sub}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                </>

            {/* MISSÃO / VISÃO / VALORES */}
            {profile.website_sections?.show_mission_vision_values && (profile.website_sections.mission || profile.website_sections.vision || profile.website_sections.values) && (
                <section className="max-w-[1250px] mx-auto px-4 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {profile.website_sections.mission && (
                            <div className={`p-8 rounded-2xl bg-white shadow-lg border border-slate-100`}>
                                <p className={`text-xs font-bold uppercase tracking-wider mb-3 text-slate-500`} style={{ color: primary }}>Missão</p>
                                <p className={'text-slate-900 text-lg font-bold leading-relaxed'}>
                                    {profile.website_sections.mission}
                                </p>
                            </div>
                        )}
                        {profile.website_sections.vision && (
                            <div className={`p-8 rounded-2xl bg-white shadow-lg border border-slate-100`}>
                                <p className={`text-xs font-bold uppercase tracking-wider mb-3 text-slate-500`} style={{ color: primary }}>Visão</p>
                                <p className={'text-slate-900 text-lg font-bold leading-relaxed'}>
                                    {profile.website_sections.vision}
                                </p>
                            </div>
                        )}
                        {profile.website_sections.values && (
                            <div className={`p-8 rounded-2xl bg-white shadow-lg border border-slate-100`}>
                                <p className={`text-xs font-bold uppercase tracking-wider mb-3 text-slate-500`} style={{ color: primary }}>Valores</p>
                                <p className={'text-slate-900 text-lg font-bold leading-relaxed'}>
                                    {profile.website_sections.values}
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Inventory */}
            <section id="estoque" className="max-w-[1250px] mx-auto px-4 py-16 pt-20">
                    <div className="space-y-12">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-100">
                            <div>
                                <h2 className={tc.sectionTitle}>Nosso Estoque</h2>
                                <p className="text-slate-500 font-medium mt-2">
                                    {filtered.length} veículo{filtered.length !== 1 ? 's' : ''} disponíve{filtered.length !== 1 ? 'is' : 'l'}
                                </p>
                            </div>

                            {types.length > 1 && (
                                <div className="flex flex-wrap gap-2">
                                    {types.map(type => (
                                        <button key={type} onClick={() => setActiveType(type)}
                                            className={`px-5 py-2.5 rounded-full font-bold text-xs transition-all ${activeType === type ? tc.filterPillActive : tc.filterPill}`}
                                            style={activeType === type ? { backgroundColor: primary } : undefined}>
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {filtered.length === 0 ? (
                            <div className="text-center py-24 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                                <Car size={64} className="mx-auto mb-4 text-slate-200" />
                                <p className="text-xl font-bold text-slate-900">Nenhum veículo encontrado</p>
                                <p className="text-slate-500 mt-2">Tente outros filtros ou entre em contato conosco.</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                                    {displayedVehicles.map((vehicle, i) => (
                                        <motion.div 
                                            key={vehicle.id}
                                            initial={{ opacity: 0, y: 30 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, margin: "-50px" }}
                                            transition={{ duration: 0.5, delay: (i % 6) * 0.1 }}
                                        >
                                            <VehicleCard vehicle={vehicle} slug={slug!} tc={tc} profile={profile} />
                                        </motion.div>
                                    ))}
                                </div>
                                {!showAll && filtered.length > 8 && (
                                    <div className="text-center mt-16">
                                        <button onClick={() => setShowAll(true)}
                                            className="px-10 py-4 rounded-2xl font-bold text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95"
                                            style={{ backgroundColor: primary }}>
                                            Ver todos os {filtered.length} veículos
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
            </section>



            {/* CTA Banner */}
            {profile.website_whatsapp && (
                    <section className="py-2 px-4">
                        <div className="max-w-[1250px] mx-auto">
                            <div className="relative overflow-hidden rounded-2xl p-10 md:p-14 text-white"
                                style={{ background: profile.website_use_gradient ? `linear-gradient(135deg, ${primary}, ${secondary})` : `linear-gradient(135deg, #1c2a3a, #2d3f52)` }}>
                                <div className="absolute inset-0 opacity-10"
                                    style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                                <div className="relative z-10 max-w-xl">
                                    <h2 className="text-3xl md:text-4xl font-black mb-3 leading-tight"
                                        style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                                        Não encontrou o que procurava?
                                    </h2>
                                    <p className="text-white/75 text-lg mb-6">Fale diretamente com nossa equipe e encontre o veículo ideal para você.</p>
                                    <a href={mainWaUrl} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-white font-bold px-8 py-4 rounded-xl hover:bg-stone-50 transition-colors text-base shadow-lg"
                                        style={{ color: primary }}>
                                        <MessageCircle size={20} />
                                        Chamar no WhatsApp
                                    </a>
                                </div>
                            </div>
                        </div>
                    </section>
            )}

            {/* Contact Form + Google Maps (Lazy Loaded) */}
            {((profile.website_sections?.show_contact_form && profile.website_whatsapp) || (profile.website_sections?.show_maps && profile.website_google_maps)) && (
                <Suspense fallback={
                    <div className="max-w-[1250px] mx-auto px-4 pb-8 min-h-[250px] flex items-center justify-center">
                        <div className="animate-pulse text-xs font-bold text-slate-400 uppercase tracking-widest">Carregando contato e mapa...</div>
                    </div>
                }>
                    <ContactSection profile={profile} tc={tc} />
                </Suspense>
            )}

            {/* Footer */}
            <PublicFooter profile={profile} mainWaUrl={mainWaUrl} />

            {/* Floating WA com SVG Animado */}
            {profile.website_whatsapp && (
                <a href={mainWaUrl} target="_blank" rel="noopener noreferrer"
                    className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-400 hover:scale-110 hover:-translate-y-1 transition-all z-50 animate-bounce group"
                    title="Chamar no WhatsApp"
                    aria-label="Chamar no WhatsApp">
                    <svg viewBox="0 0 24 24" className="w-8 h-8 text-white fill-current group-hover:scale-110 transition-transform">
                        <path d="M19.007 4.93A9.847 9.847 0 0 0 12.034 2c-5.441 0-9.886 4.444-9.89 9.89a9.833 9.833 0 0 0 1.324 4.96L2.06 22l5.305-1.392a9.866 9.866 0 0 0 4.664 1.173h.004c5.441 0 9.886-4.444 9.89-9.89a9.84 9.84 0 0 0-2.916-6.961M12.034 20.172h-.004a8.174 8.174 0 0 1-4.17-1.14l-.298-.177-3.1 1.026.837-3.03-.195-.31a8.173 8.173 0 0 1-1.25-4.321c.004-4.51 3.682-8.188 8.196-8.188a8.177 8.177 0 0 1 5.792 2.404 8.18 8.18 0 0 1 2.399 5.8a8.212 8.212 0 0 1-8.207 8.196m4.496-6.142c-.246-.123-1.458-.72-1.685-.803-.227-.082-.392-.123-.556.123-.164.246-.636.803-.78 1.018-.144.214-.288.24-.534.116-.246-.123-1.037-.382-1.975-1.218-.73-.65-1.222-1.453-1.365-1.7-.144-.246-.015-.38.109-.502.11-.11.246-.288.37-.432.124-.144.165-.246.248-.41.082-.164.04-.308-.02-.432-.062-.124-.557-1.343-.763-1.838-.2-.48-.4-.413-.556-.421-.144-.007-.309-.008-.474-.008a.91.91 0 0 0-.659.308c-.227.247-.865.845-.865 2.062s.886 2.392.984 2.52c.099.127 1.742 2.658 4.22 3.727.59.254 1.05.405 1.41.52.593.189 1.133.162 1.56.098.476-.07 1.458-.596 1.664-1.173.206-.577.206-1.071.144-1.173-.06-.102-.226-.143-.472-.266" />
                    </svg>
                </a>
            )}
        </div>
    );
};

export default PublicSiteHome;
