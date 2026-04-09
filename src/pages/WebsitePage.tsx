import React, { useState, useEffect } from 'react';
import {
    Globe, Eye, Copy, Check, ChevronDown, ChevronUp,
    ExternalLink, Palette, Phone, MessageSquare, Type,
    Server, Info, Sparkles, Monitor, Layers
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { profileService } from '../services/profileService';
import { useToast } from '../contexts/ToastContext';

const generateSlug = (name: string): string =>
    name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const THEMES = [
    {
        id: 'classic' as const,
        name: 'Classic',
        description: 'Design limpo e profissional. Fundo branco, tipografia clara.',
        previewBg: 'bg-white',
        previewBorder: 'border-gray-200',
        previewCards: ['bg-gray-100', 'bg-gray-50', 'bg-gray-100'],
        accentClass: 'bg-emerald-500',
        textClass: 'text-emerald-600',
    },
    {
        id: 'glass' as const,
        name: 'Glass',
        description: 'Glassmorphismo com gradiente escuro e efeitos de blur.',
        previewBg: 'bg-gradient-to-br from-slate-800 to-indigo-900',
        previewBorder: 'border-white/20',
        previewCards: ['bg-white/10', 'bg-white/8', 'bg-white/10'],
        accentClass: 'bg-indigo-500',
        textClass: 'text-indigo-400',
    },
    {
        id: 'premium' as const,
        name: 'Premium',
        description: 'Escuro e luxuoso com detalhes em dourado. Para lojas premium.',
        previewBg: 'bg-[#0a0a12]',
        previewBorder: 'border-yellow-500/30',
        previewCards: ['bg-yellow-500/10', 'bg-[#12121e]', 'bg-yellow-500/10'],
        accentClass: 'bg-yellow-500',
        textClass: 'text-yellow-500',
    },
];

const WebsitePage: React.FC = () => {
    const { profile, refreshProfile } = useData();
    const { showToast } = useToast();

    const [active, setActive] = useState(false);
    const [theme, setTheme] = useState<'classic' | 'glass' | 'premium'>('classic');
    const [primaryColor, setPrimaryColor] = useState('#10b981');
    const [heroText, setHeroText] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [ctaText, setCtaText] = useState('Tenho Interesse');
    const [slug, setSlug] = useState('');
    const [customDomain, setCustomDomain] = useState('');
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showDns, setShowDns] = useState(false);

    useEffect(() => {
        if (profile) {
            setActive(profile.website_active || false);
            setTheme(profile.website_theme || 'classic');
            setPrimaryColor(profile.website_primary_color || '#10b981');
            setHeroText(profile.website_hero_text || '');
            setWhatsapp(profile.website_whatsapp || '');
            setCtaText(profile.website_cta_text || 'Tenho Interesse');
            const autoSlug = profile.website_slug || (profile.company_name ? generateSlug(profile.company_name) : '');
            setSlug(autoSlug);
            setCustomDomain(profile.custom_domain || '');
        }
    }, [profile]);

    const siteUrl = `veiculos.nleads.pro/${slug}`;
    const previewPath = `/site/${slug}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(siteUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // ignore
        }
    };

    const handleSave = async () => {
        if (!slug) {
            showToast('error', 'Defina um endereço (slug) para o site.');
            return;
        }
        setSaving(true);
        try {
            await profileService.updateProfile({
                website_active: active,
                website_theme: theme,
                website_primary_color: primaryColor,
                website_hero_text: heroText,
                website_whatsapp: whatsapp,
                website_cta_text: ctaText,
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

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

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

            {/* Publish Toggle Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Monitor size={18} className="text-slate-500" />
                        <span className="font-semibold text-slate-900">Status do Site</span>
                    </div>
                    <button
                        onClick={() => setActive(v => !v)}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${active ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${active ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                <div className={`rounded-xl p-4 ${active ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-100'}`}>
                    {active ? (
                        <p className="text-sm text-emerald-700 font-medium">
                            Seu site está <strong>publicado</strong> e visível ao público.
                        </p>
                    ) : (
                        <p className="text-sm text-slate-500">
                            Seu site está <strong>desativado</strong>. Ative para torná-lo público.
                        </p>
                    )}
                </div>

                {/* URL Display */}
                <div className="mt-4 space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Endereço do Site</label>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 gap-2 min-w-0">
                            <span className="text-xs text-slate-400 shrink-0">veiculos.nleads.pro/</span>
                            <input
                                value={slug}
                                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                placeholder="nome-da-loja"
                                className="flex-1 bg-transparent text-sm font-mono text-slate-700 outline-none min-w-0"
                            />
                        </div>
                        <button
                            onClick={handleCopy}
                            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shrink-0"
                            title="Copiar URL"
                        >
                            {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                        </button>
                        <a
                            href={previewPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-600 transition-colors shrink-0"
                            title="Visualizar site"
                        >
                            <Eye size={16} />
                        </a>
                    </div>
                </div>
            </div>

            {/* Theme Selector */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Layers size={18} className="text-slate-500" />
                    <span className="font-semibold text-slate-900">Tema</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {THEMES.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            className={`relative rounded-xl overflow-hidden border-2 transition-all p-0 text-left ${theme === t.id ? `border-emerald-500 shadow-md shadow-emerald-100` : 'border-slate-100 hover:border-slate-300'}`}
                        >
                            {/* Theme Preview */}
                            <div className={`h-20 ${t.previewBg} p-2 flex flex-col gap-1`}>
                                {t.previewCards.map((c, i) => (
                                    <div key={i} className={`h-3 rounded ${c} border ${t.previewBorder}`} />
                                ))}
                            </div>
                            <div className="p-2.5 bg-white border-t border-slate-100">
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-2 h-2 rounded-full ${t.accentClass}`} />
                                    <span className="text-xs font-bold text-slate-800">{t.name}</span>
                                    {theme === t.id && <Check size={12} className="text-emerald-600 ml-auto" />}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight line-clamp-2">{t.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Customization */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={18} className="text-slate-500" />
                    <span className="font-semibold text-slate-900">Personalização</span>
                </div>

                {/* Hero Text */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                        <Type size={12} />
                        Título do Hero
                    </label>
                    <input
                        value={heroText}
                        onChange={e => setHeroText(e.target.value)}
                        placeholder="Ex: Os melhores veículos da região"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                    />
                </div>

                {/* WhatsApp */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                        <Phone size={12} />
                        WhatsApp (com DDD)
                    </label>
                    <input
                        value={whatsapp}
                        onChange={e => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                        placeholder="Ex: 11999998888"
                        maxLength={13}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                    />
                </div>

                {/* CTA Text */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                        <MessageSquare size={12} />
                        Texto do Botão CTA
                    </label>
                    <input
                        value={ctaText}
                        onChange={e => setCtaText(e.target.value)}
                        placeholder="Ex: Tenho Interesse"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                    />
                </div>

                {/* Primary Color */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                        <Palette size={12} />
                        Cor de Destaque
                    </label>
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            value={primaryColor}
                            onChange={e => setPrimaryColor(e.target.value)}
                            className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                        />
                        <input
                            value={primaryColor}
                            onChange={e => setPrimaryColor(e.target.value)}
                            placeholder="#10b981"
                            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                        />
                    </div>
                </div>
            </div>

            {/* DNS Configuration */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <button
                    onClick={() => setShowDns(v => !v)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Server size={18} className="text-slate-500" />
                        <span className="font-semibold text-slate-900">Configurações de DNS / Domínio</span>
                    </div>
                    {showDns ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </button>

                {showDns && (
                    <div className="px-5 pb-5 space-y-4 border-t border-slate-100">
                        {/* Info */}
                        <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3 mt-4">
                            <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-700">
                                Seu site já fica disponível em <strong>veiculos.nleads.pro/{slug || 'sua-loja'}</strong>.
                                Para usar um domínio próprio, configure os registros abaixo no seu provedor de DNS e insira o domínio abaixo.
                            </p>
                        </div>

                        {/* Default URL */}
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">URL padrão</label>
                            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                                <span className="text-sm font-mono text-slate-700">veiculos.nleads.pro/{slug || 'sua-loja'}</span>
                                <ExternalLink size={14} className="text-slate-400" />
                            </div>
                        </div>

                        {/* DNS Records */}
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Registros DNS para domínio próprio</label>
                            <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                                <div className="grid grid-cols-3 gap-2 px-4 py-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase">
                                    <span>Tipo</span>
                                    <span>Nome</span>
                                    <span>Valor</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 px-4 py-3 text-xs font-mono text-slate-700">
                                    <span className="text-indigo-600 font-bold">A</span>
                                    <span>@</span>
                                    <span>76.76.21.21</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 px-4 py-3 text-xs font-mono text-slate-700">
                                    <span className="text-indigo-600 font-bold">CNAME</span>
                                    <span>www</span>
                                    <span>veiculos.nleads.pro</span>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2">
                                A propagação do DNS pode levar até 48 horas após a configuração.
                            </p>
                        </div>

                        {/* Custom Domain Input */}
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Domínio personalizado</label>
                            <input
                                value={customDomain}
                                onChange={e => setCustomDomain(e.target.value.toLowerCase())}
                                placeholder="Ex: estoque.minhaloja.com.br"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-sm shadow-emerald-200"
                >
                    {saving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
            </div>
        </div>
    );
};

export default WebsitePage;
