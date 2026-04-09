import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { websiteService, PublicProfile } from '../../services/websiteService';
import { Vehicle } from '../../types';
import {
    MessageCircle, ArrowLeft, CheckCircle, XCircle,
    ChevronLeft, ChevronRight, Gauge, Fuel, Settings,
    Calendar, Palette, Car, Shield, FileText, Star, MapPin, Send
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const formatPrice = (n: number) => fmt.format(n);
const formatKm = (n: number) => `${new Intl.NumberFormat('pt-BR').format(n)} km`;
const PLACEHOLDER = 'https://placehold.co/800x600/e2e8f0/94a3b8?text=Sem+foto';

function buildWaUrl(phone: string, message: string) {
    const clean = phone.replace(/\D/g, '');
    const number = clean.startsWith('55') ? clean : `55${clean}`;
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

// ─── Theme Classes ───────────────────────────────────────────────────────────

interface TC {
    wrapper: string; nav: string; backBtn: string;
    thumbActive: string; thumbInactive: string;
    card: string; title: string; specLabel: string; specValue: string;
    divider: string; ctaCard: string; ctaTitle: string;
    ctaBtnOutline: string; badge: string; badgeText: string;
    similarCard: string; similarTitle: string; similarBtn: string;
    check: string; cross: string; footer: string; footerText: string;
    formCard: string; formLabel: string; formTitle: string;
    inputField: string; textarea: string;
}

function getTC(theme: string): TC {
    switch (theme) {
        case 'glass': return {
            wrapper: 'min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white',
            nav: 'bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50',
            backBtn: 'text-white/60 hover:text-white flex items-center gap-2 text-sm transition-colors',
            thumbActive: 'border-2 border-white rounded-xl overflow-hidden cursor-pointer',
            thumbInactive: 'border-2 border-white/10 rounded-xl overflow-hidden cursor-pointer opacity-60 hover:opacity-100 transition',
            card: 'bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl p-6',
            title: 'text-white', specLabel: 'text-white/40 text-xs', specValue: 'text-white font-semibold',
            divider: 'border-white/10',
            ctaCard: 'bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl p-6 sticky top-24',
            ctaTitle: 'text-white font-bold',
            ctaBtnOutline: 'w-full py-3.5 rounded-xl font-bold border border-white/30 text-white text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2',
            badge: 'bg-white/15', badgeText: 'text-white/80',
            similarCard: 'bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden hover:border-white/30 hover:-translate-y-1 transition-all',
            similarTitle: 'text-white font-semibold text-sm',
            similarBtn: 'mt-2 w-full text-center py-2 rounded-xl border border-white/20 text-white/70 text-xs hover:bg-white/10 transition-colors',
            check: 'text-green-400', cross: 'text-red-400',
            footer: 'bg-black/40 border-t border-white/10 mt-16',
            footerText: 'text-white/40 text-sm',
            formCard: 'bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl p-6 md:p-8',
            formLabel: 'text-white/60 text-xs font-semibold uppercase tracking-wider block mb-1',
            formTitle: 'text-white font-bold text-xl mb-1',
            inputField: 'w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/50',
            textarea: 'w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/50 resize-none',
        };
        case 'premium': return {
            wrapper: 'min-h-screen bg-[#0a0a12] text-white',
            nav: 'bg-[#0a0a12]/95 backdrop-blur-xl border-b border-yellow-500/15 sticky top-0 z-50',
            backBtn: 'text-gray-500 hover:text-yellow-400 flex items-center gap-2 text-sm transition-colors',
            thumbActive: 'border-2 border-yellow-500 rounded-xl overflow-hidden cursor-pointer',
            thumbInactive: 'border-2 border-yellow-500/10 rounded-xl overflow-hidden cursor-pointer opacity-60 hover:opacity-100 transition',
            card: 'bg-[#12121e] border border-yellow-500/15 rounded-2xl p-6',
            title: 'text-white', specLabel: 'text-gray-600 text-xs', specValue: 'text-white font-semibold',
            divider: 'border-yellow-500/10',
            ctaCard: 'bg-[#12121e] border border-yellow-500/15 rounded-2xl p-6 sticky top-24',
            ctaTitle: 'text-white font-bold',
            ctaBtnOutline: 'w-full py-3.5 rounded-xl font-bold border border-yellow-500/30 text-yellow-400 text-sm hover:bg-yellow-500/10 transition-colors flex items-center justify-center gap-2',
            badge: 'bg-yellow-500/10', badgeText: 'text-yellow-300',
            similarCard: 'bg-[#12121e] border border-yellow-500/15 rounded-2xl overflow-hidden hover:border-yellow-500/40 hover:-translate-y-1 transition-all',
            similarTitle: 'text-white font-semibold text-sm',
            similarBtn: 'mt-2 w-full text-center py-2 rounded-xl border border-yellow-500/20 text-yellow-400/70 text-xs hover:bg-yellow-500/10 transition-colors',
            check: 'text-green-500', cross: 'text-red-500',
            footer: 'bg-[#060610] border-t border-yellow-500/10 mt-16',
            footerText: 'text-gray-600 text-sm',
            formCard: 'bg-[#12121e] border border-yellow-500/15 rounded-2xl p-6 md:p-8',
            formLabel: 'text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1',
            formTitle: 'text-white font-bold text-xl mb-1',
            inputField: 'w-full bg-[#1a1a2a] border border-yellow-500/20 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-500/50',
            textarea: 'w-full bg-[#1a1a2a] border border-yellow-500/20 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-500/50 resize-none',
        };
        default: return { // classic
            wrapper: 'min-h-screen bg-gray-50 text-gray-900',
            nav: 'bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50',
            backBtn: 'text-gray-500 hover:text-gray-900 flex items-center gap-2 text-sm transition-colors',
            thumbActive: 'border-2 border-gray-900 rounded-xl overflow-hidden cursor-pointer',
            thumbInactive: 'border-2 border-gray-100 rounded-xl overflow-hidden cursor-pointer opacity-60 hover:opacity-100 transition',
            card: 'bg-white border border-gray-100 rounded-2xl p-6 shadow-sm',
            title: 'text-gray-900', specLabel: 'text-gray-400 text-xs', specValue: 'text-gray-900 font-semibold',
            divider: 'border-gray-100',
            ctaCard: 'bg-white border border-gray-100 rounded-2xl p-6 shadow-sm sticky top-24',
            ctaTitle: 'text-gray-900 font-bold',
            ctaBtnOutline: 'w-full py-3.5 rounded-xl font-bold border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2',
            badge: 'bg-gray-100', badgeText: 'text-gray-600',
            similarCard: 'bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all',
            similarTitle: 'text-gray-900 font-semibold text-sm',
            similarBtn: 'mt-2 w-full text-center py-2 rounded-xl border border-gray-200 text-gray-600 text-xs hover:bg-gray-50 transition-colors',
            check: 'text-green-500', cross: 'text-red-400',
            footer: 'bg-white border-t border-gray-100 mt-16',
            footerText: 'text-gray-400 text-sm',
            formCard: 'bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm',
            formLabel: 'text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1',
            formTitle: 'text-gray-900 font-bold text-xl mb-1',
            inputField: 'w-full bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10',
            textarea: 'w-full bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 resize-none',
        };
    }
}

// ─── Spec Item ─────────────────────────────────────────────────────────────────

const SpecItem: React.FC<{ icon: React.ReactNode; label: string; value: string; tc: TC }> = ({ icon, label, value, tc }) => (
    <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center opacity-60 shrink-0">{icon}</div>
        <div>
            <p className={tc.specLabel}>{label}</p>
            <p className={tc.specValue}>{value}</p>
        </div>
    </div>
);

// ─── Contact Form ─────────────────────────────────────────────────────────────

const ContactForm: React.FC<{ profile: PublicProfile; vehicle?: Vehicle; tc: TC }> = ({ profile, vehicle, tc }) => {
    const [form, setForm] = useState({ name: '', phone: '', message: '' });
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile.website_whatsapp || !form.name || !form.phone) return;
        const vehicleRef = vehicle ? `o ${vehicle.brand} ${vehicle.model} ${vehicle.year} (${formatPrice(vehicle.price)})` : 'um veículo';
        const msg = `Olá, *${profile.company_name}*! Me chamo *${form.name}*, telefone: ${form.phone}. Tenho interesse em ${vehicleRef}.${form.message ? ` ${form.message}` : ''}`;
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
                    placeholder="Alguma dúvida? Quer agendar um test drive?" rows={3} className={tc.textarea} />
            </div>
            <button type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-colors"
                style={{ backgroundColor: sent ? '#16a34a' : profile.website_primary_color || '#10b981' }}>
                {sent ? <><Send size={16} /> Mensagem enviada!</> : <><MessageCircle size={16} /> Enviar via WhatsApp</>}
            </button>
        </form>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const PublicVehicleDetail: React.FC = () => {
    const { slug, id } = useParams<{ slug: string; id: string }>();
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [activeImg, setActiveImg] = useState(0);

    useEffect(() => {
        if (!slug || !id) return;
        (async () => {
            const [p, v] = await Promise.all([
                websiteService.getProfileBySlug(slug),
                websiteService.getVehicleById(id),
            ]);
            if (!p || !v) { setNotFound(true); setLoading(false); return; }
            setProfile(p);
            setVehicle(v);
            const all = await websiteService.getVehiclesByUserId(p.id);
            setAllVehicles(all);
            setLoading(false);
            setActiveImg(0);
        })();
    }, [slug, id]);

    const tc = useMemo(() => getTC(profile?.website_theme || 'classic'), [profile?.website_theme]);
    const primary = profile?.website_primary_color || '#10b981';
    const secondary = profile?.website_secondary_color || primary;

    const allImages = useMemo(() => {
        if (!vehicle) return [PLACEHOLDER];
        const imgs = [vehicle.imageUrl, ...(vehicle.galleryImages || [])].filter(Boolean);
        return imgs.length > 0 ? imgs : [PLACEHOLDER];
    }, [vehicle]);

    const similar = useMemo(() =>
        allVehicles.filter(v => v.id !== vehicle?.id && v.type === vehicle?.type).slice(0, 3),
        [allVehicles, vehicle]
    );

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (notFound || !profile || !vehicle) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="text-6xl mb-4">🚗</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Veículo não encontrado</h1>
                <Link to={`/site/${slug}`} className="text-emerald-600 underline text-sm">← Voltar para o estoque</Link>
            </div>
        </div>
    );

    const waMsg = `Olá! Tenho interesse no ${vehicle.brand} ${vehicle.model} ${vehicle.year} — ${formatPrice(vehicle.price)}. Poderia me dar mais informações?`;
    const waUrl = profile.website_whatsapp ? buildWaUrl(profile.website_whatsapp, waMsg) : '#';
    const mainWaUrl = profile.website_whatsapp
        ? buildWaUrl(profile.website_whatsapp, `Olá! Vim pelo site ${profile.company_name}.`)
        : '#';

    const ctaBtnPrimary = `w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors`;
    const ctaBtnPrimaryStyle = profile.website_theme === 'premium'
        ? { backgroundColor: '#eab308', color: '#000' }
        : { backgroundColor: primary, color: '#fff' };

    const seoTitle = `${vehicle.brand} ${vehicle.model} ${vehicle.year} — ${profile.company_name}`;
    const seoDesc = `${vehicle.brand} ${vehicle.model} ${vehicle.year}, ${formatKm(vehicle.mileage)}, ${vehicle.transmission}. ${formatPrice(vehicle.price)} em ${profile.company_name}.`;

    return (
        <div className={tc.wrapper}>
            <Helmet>
                <title>{seoTitle}</title>
                <meta name="description" content={seoDesc} />
                <meta property="og:title" content={seoTitle} />
                <meta property="og:description" content={seoDesc} />
                {allImages[0] && <meta property="og:image" content={allImages[0]} />}
                <meta property="og:type" content="product" />
                <meta name="robots" content="index, follow" />
            </Helmet>

            {/* Nav */}
            <nav className={tc.nav}>
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {profile.company_logo
                            ? <img src={profile.company_logo} alt={profile.company_name} className="h-9 w-auto object-contain" />
                            : <span className="text-base font-extrabold">{profile.company_name}</span>
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

            <div className="max-w-6xl mx-auto px-4 py-8">
                <Link to={`/site/${slug}`} className={`${tc.backBtn} mb-6 inline-flex`}>
                    <ArrowLeft size={16} /> Voltar ao estoque
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Gallery */}
                        <div>
                            <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-gray-200">
                                <img src={allImages[activeImg] || PLACEHOLDER} alt={`${vehicle.brand} ${vehicle.model}`}
                                    className="w-full h-full object-cover"
                                    onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                                {allImages.length > 1 && (
                                    <>
                                        <button onClick={() => setActiveImg(i => (i - 1 + allImages.length) % allImages.length)}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                                            <ChevronLeft size={20} />
                                        </button>
                                        <button onClick={() => setActiveImg(i => (i + 1) % allImages.length)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                                            <ChevronRight size={20} />
                                        </button>
                                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                                            {activeImg + 1} / {allImages.length}
                                        </div>
                                    </>
                                )}
                            </div>
                            {allImages.length > 1 && (
                                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                                    {allImages.map((img, i) => (
                                        <button key={i} onClick={() => setActiveImg(i)}
                                            className={`shrink-0 w-16 h-12 ${i === activeImg ? tc.thumbActive : tc.thumbInactive}`}>
                                            <img src={img} alt="" className="w-full h-full object-cover"
                                                onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Title */}
                        <div>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {[
                                    vehicle.type,
                                    vehicle.isSingleOwner && '1º Dono',
                                    vehicle.isIpvaPaid && 'IPVA Pago',
                                    vehicle.hasWarranty && 'Com Garantia',
                                ].filter(Boolean).map(label => (
                                    <span key={String(label)} className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${tc.badge} ${tc.badgeText}`}>{label}</span>
                                ))}
                            </div>
                            <h1 className={`text-2xl md:text-3xl font-extrabold ${tc.title}`}
                                style={profile.website_theme === 'classic' ? { color: profile.website_title_color || '#111827' } : undefined}>
                                {vehicle.brand} {vehicle.model}
                            </h1>
                            <p className={`text-sm mt-1 ${tc.specLabel}`}>
                                {vehicle.year}{vehicle.modelYear && vehicle.modelYear !== vehicle.year ? `/${vehicle.modelYear}` : ''} · {vehicle.color}{vehicle.plate ? ` · Placa ${vehicle.plate}` : ''}
                            </p>
                        </div>

                        {/* Specs */}
                        <div className={tc.card}>
                            <h2 className={`font-bold mb-5 ${tc.title}`}>Especificações</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                                <SpecItem icon={<Gauge size={16} />} label="Quilometragem" value={formatKm(vehicle.mileage)} tc={tc} />
                                <SpecItem icon={<Settings size={16} />} label="Transmissão" value={vehicle.transmission} tc={tc} />
                                <SpecItem icon={<Fuel size={16} />} label="Motorização" value={vehicle.engine} tc={tc} />
                                <SpecItem icon={<Calendar size={16} />} label="Ano" value={`${vehicle.year}${vehicle.modelYear && vehicle.modelYear !== vehicle.year ? `/${vehicle.modelYear}` : ''}`} tc={tc} />
                                <SpecItem icon={<Palette size={16} />} label="Cor" value={vehicle.color} tc={tc} />
                                <SpecItem icon={<Car size={16} />} label="Tipo" value={vehicle.type} tc={tc} />
                            </div>
                        </div>

                        {/* Condition */}
                        <div className={tc.card}>
                            <h2 className={`font-bold mb-4 ${tc.title}`}>Estado do Veículo</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: '1º Proprietário', value: vehicle.isSingleOwner },
                                    { label: 'Histórico de Manutenção', value: vehicle.isServiceHistoryComplete },
                                    { label: 'IPVA Pago', value: vehicle.isIpvaPaid },
                                    { label: 'Com Garantia', value: vehicle.hasWarranty },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex items-center gap-2">
                                        {value ? <CheckCircle size={16} className={tc.check} /> : <XCircle size={16} className={tc.cross} />}
                                        <span className={`text-sm ${value ? tc.specValue : tc.specLabel}`}>{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Optionals */}
                        {(vehicle.optionals?.length ?? 0) > 0 && (
                            <div className={tc.card}>
                                <h2 className={`font-bold mb-4 ${tc.title}`}>Opcionais</h2>
                                <div className="flex flex-wrap gap-2">
                                    {vehicle.optionals.map(opt => (
                                        <span key={opt} className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full ${tc.badge} ${tc.badgeText}`}>
                                            <Star size={10} />{opt}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT — CTA Sidebar */}
                    <div className="space-y-4">
                        <div className={tc.ctaCard}>
                            <p className="text-3xl font-extrabold mb-1"
                                style={{ color: profile.website_theme === 'premium' ? '#eab308' : primary }}>
                                {formatPrice(vehicle.price)}
                            </p>
                            <p className={`text-xs mb-5 ${tc.specLabel}`}>Preço de tabela · sujeito a alterações</p>

                            {profile.website_whatsapp && (
                                <div className="space-y-2.5">
                                    <a href={waUrl} target="_blank" rel="noopener noreferrer"
                                        className={ctaBtnPrimary} style={ctaBtnPrimaryStyle}>
                                        <MessageCircle size={18} />
                                        Tenho Interesse
                                    </a>
                                    <a href={buildWaUrl(profile.website_whatsapp, `Olá! Gostaria de agendar um test drive do ${vehicle.brand} ${vehicle.model} ${vehicle.year}.`)}
                                        target="_blank" rel="noopener noreferrer" className={tc.ctaBtnOutline}>
                                        <Calendar size={16} /> Agendar Test Drive
                                    </a>
                                    <a href={buildWaUrl(profile.website_whatsapp, `Olá! Gostaria de simular o financiamento do ${vehicle.brand} ${vehicle.model} ${vehicle.year} — ${formatPrice(vehicle.price)}.`)}
                                        target="_blank" rel="noopener noreferrer" className={tc.ctaBtnOutline}>
                                        <FileText size={16} /> Simular Financiamento
                                    </a>
                                    <a href={buildWaUrl(profile.website_whatsapp, `Olá! Tenho um veículo para troca e tenho interesse no ${vehicle.brand} ${vehicle.model} ${vehicle.year}.`)}
                                        target="_blank" rel="noopener noreferrer" className={tc.ctaBtnOutline}>
                                        <Shield size={16} /> Propor Troca
                                    </a>
                                </div>
                            )}

                            <div className={`border-t ${tc.divider} mt-5 pt-4`}>
                                <div className={`flex items-center gap-2 text-xs ${tc.specLabel}`}>
                                    <Shield size={12} />
                                    <span>Anúncio verificado por {profile.company_name}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Similar Vehicles */}
                {similar.length > 0 && (
                    <div className="mt-12">
                        <h2 className={`text-lg font-bold mb-5 ${tc.title}`}>Veículos Similares</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {similar.map(v => (
                                <div key={v.id} className={tc.similarCard}>
                                    <div className="aspect-[4/3] overflow-hidden">
                                        <img src={v.imageUrl || PLACEHOLDER} alt={`${v.brand} ${v.model}`}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                            onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                                    </div>
                                    <div className="p-3">
                                        <p className={tc.similarTitle}>{v.brand} {v.model}</p>
                                        <p className={`text-[10px] ${tc.specLabel}`}>{v.year} · {formatKm(v.mileage)}</p>
                                        <p className="mt-1 text-sm font-bold"
                                            style={{ color: profile.website_theme === 'premium' ? '#eab308' : primary }}>
                                            {formatPrice(v.price)}
                                        </p>
                                        <Link to={`/site/${slug}/veiculo/${v.id}`} className={`block ${tc.similarBtn}`}>
                                            Ver Detalhes
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bottom CTA */}
                {profile.website_whatsapp && (
                    <div className="mt-12 rounded-2xl p-8 text-center text-white"
                        style={{ background: profile.website_use_gradient
                            ? `linear-gradient(135deg, ${primary}, ${secondary})`
                            : `linear-gradient(135deg, ${primary}dd, ${primary}88)` }}>
                        <h2 className="text-xl font-extrabold mb-2">Pronto para fechar negócio?</h2>
                        <p className="text-white/80 text-sm mb-5">Entre em contato agora e garanta condições especiais.</p>
                        <a href={waUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-white font-bold px-7 py-3.5 rounded-xl hover:bg-white/90 transition-colors"
                            style={{ color: primary }}>
                            <MessageCircle size={18} />
                            Tenho Interesse
                        </a>
                    </div>
                )}

                {/* Contact Form + Maps */}
                {(profile.website_whatsapp || profile.website_google_maps) && (
                    <div className={`mt-8 ${tc.formCard}`}>
                        <h2 className={tc.formTitle}>Entre em Contato</h2>
                        {profile.website_city && (
                            <p className={`flex items-center gap-1 text-sm mb-5 ${tc.specLabel}`}>
                                <MapPin size={13} />{profile.website_city}
                            </p>
                        )}
                        <div className={`grid grid-cols-1 ${profile.website_google_maps ? 'md:grid-cols-2' : ''} gap-8`}>
                            {profile.website_whatsapp && (
                                <div>
                                    <p className={`text-sm mb-4 ${tc.specLabel}`}>Preencha o formulário e entraremos em contato.</p>
                                    <ContactForm profile={profile} vehicle={vehicle} tc={tc} />
                                </div>
                            )}
                            {profile.website_google_maps && (
                                <div>
                                    <p className={`text-sm font-semibold mb-3 ${tc.formLabel}`}>Como chegar</p>
                                    <iframe src={profile.website_google_maps} width="100%" height="300"
                                        className="rounded-xl border-0 w-full" loading="lazy"
                                        allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

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
                <a href={waUrl} target="_blank" rel="noopener noreferrer"
                    className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-400 hover:scale-110 transition-all z-50">
                    <MessageCircle size={26} className="text-white" />
                </a>
            )}
        </div>
    );
};

export default PublicVehicleDetail;
