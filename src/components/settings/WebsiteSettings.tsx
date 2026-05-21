import React, { useState } from 'react';
import {
    Save, Globe, Palette, Image as ImageIcon, MapPin, Loader2, Camera, Check,
    AlertCircle, Layers, Layout, MessageSquare, Search, Code, Smartphone,
    Monitor, Zap, Sparkles, Link as LinkIcon, ShieldCheck, Sun, Moon,
    Instagram, Facebook, Youtube, Twitter, Phone, Clock, Trash2, Copy
} from 'lucide-react';
import { Profile } from '../../types';
import { profileService } from '../../services/profileService';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabaseClient';
import { resizeImage } from '../../utils/imageProcessor';

interface Props {
    profile: Profile;
    onUpdate: () => void;
}

const THEMES = [
    { id: 'classic', name: 'Classic', description: 'Limpo, claro e profissional.', preview: 'bg-stone-100' },
    { id: 'modern', name: 'Modern', description: 'Bordas arredondadas e destaques fortes.', preview: 'bg-blue-50' },
    { id: 'glass', name: 'Glassmorphism', description: 'Transparências e gradientes.', preview: 'bg-slate-900' },
    { id: 'bold', name: 'Bold', description: 'Tipografia agressiva e contraste.', preview: 'bg-slate-950' },
    { id: 'luxury', name: 'Luxury', description: 'Tons escuros para veículos premium.', preview: 'bg-[#0f0e0c]' },
];

const PRESET_COLORS = [
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Red', hex: '#ef4444' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Purple', hex: '#8b5cf6' },
    { name: 'Slate', hex: '#475569' },
    { name: 'Gold', hex: '#d4af37' },
    { name: 'Black', hex: '#0f172a' },
];

const WebsiteSettings: React.FC<Props> = ({ profile, onUpdate }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'visual' | 'content' | 'conversion' | 'seo'>('visual');

    // Basic Settings
    const [website_active, setWebsiteActive] = useState(profile.website_active || false);
    const [website_slug, setWebsiteSlug] = useState(profile.website_slug || '');
    const [custom_domain, setCustomDomain] = useState(profile.custom_domain || '');

    // Visual Settings
    const [website_theme, setWebsiteTheme] = useState(profile.website_theme || 'classic');
    const [website_primary_color, setWebsitePrimaryColor] = useState(profile.website_primary_color || '#10b981');
    const [website_background_color, setWebsiteBackgroundColor] = useState(profile.website_background_color || 'light');
    const [website_typography, setWebsiteTypography] = useState(profile.website_typography || 'inter');
    const [website_card_style, setWebsiteCardStyle] = useState(profile.website_card_style || 'rounded');
    
    // Content Settings
    const [website_hero_text, setWebsiteHeroText] = useState(profile.website_hero_text || '');
    const [website_hero_subtitle, setWebsiteHeroSubtitle] = useState(profile.website_hero_subtitle || '');
    const [website_city, setWebsiteCity] = useState(profile.website_city || '');
    const [website_about_text, setWebsiteAboutText] = useState(profile.website_about_text || '');
    const [website_business_hours, setWebsiteBusinessHours] = useState(profile.website_business_hours || '');
    const [website_google_maps, setWebsiteGoogleMaps] = useState(profile.website_google_maps || '');

    // Conversion
    const [website_whatsapp, setWebsiteWhatsapp] = useState(profile.website_whatsapp || '');
    const [website_cta_text, setWebsiteCtaText] = useState(profile.website_cta_text || 'Fale Conosco');
    const [show_floating_whatsapp, setShowFloatingWhatsapp] = useState(profile.website_sections?.show_floating_whatsapp !== false);
    const [show_exit_popup, setShowExitPopup] = useState(profile.website_sections?.show_exit_popup !== false);
    const [presetMessages, setPresetMessages] = useState<string[]>(profile.preset_messages || ['Olá! Vi este [VEICULO] no site e gostaria de mais informações.']);

    // SEO
    const [metaTitle, setMetaTitle] = useState(profile.website_optimization?.meta_title || '');
    const [metaDesc, setMetaDesc] = useState(profile.website_optimization?.meta_description || '');

    // Branding
    const [brandingEnabled, setBrandingEnabled] = useState(profile.website_branding?.enabled || false);

    // Custom Domain (Vercel)
    const [customDomainInput, setCustomDomainInput] = useState('');
    const [domainStatus, setDomainStatus] = useState<'idle' | 'registering' | 'error'>('idle');

    const handleRegisterDomain = async () => {
        if (!customDomainInput || customDomainInput.trim().length === 0) {
            showToast('error', 'Digite um domínio válido.');
            return;
        }

        const domain = customDomainInput.toLowerCase().trim();
        const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
        if (!domainRegex.test(domain)) {
            showToast('error', 'Formato de domínio inválido. Ex: seu-dominio.com.br');
            return;
        }

        if (!website_slug) {
            showToast('error', 'Configure um slug do website antes de registrar um domínio customizado.');
            return;
        }

        setDomainStatus('registering');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch('/api/register-custom-domain', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token ?? ''}`,
                },
                body: JSON.stringify({ domain, websiteSlug: website_slug }),
            });

            const data = await response.json();
            if (!response.ok) {
                setDomainStatus('error');
                showToast('error', data.error || 'Erro ao registrar domínio.');
                return;
            }

            setCustomDomain(domain);
            setCustomDomainInput('');
            setDomainStatus('idle');
            onUpdate();
            showToast('success', 'Domínio registrado com sucesso!');
        } catch (err: any) {
            setDomainStatus('error');
            showToast('error', err.message || 'Erro ao registrar domínio.');
        }
    };

    const handleRemoveDomain = async () => {
        if (!custom_domain || !window.confirm(`Remover "${custom_domain}"?`)) return;
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch('/api/remove-custom-domain', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token ?? ''}`,
                },
                body: JSON.stringify({ domain: custom_domain }),
            });

            if (!response.ok) {
                const data = await response.json();
                showToast('error', data.error || 'Erro ao remover domínio.');
                setLoading(false);
                return;
            }

            setCustomDomain('');
            showToast('success', 'Domínio removido.');

            // Force refresh after 500ms to ensure DB is updated
            setTimeout(() => {
                onUpdate();
                setLoading(false);
            }, 500);
        } catch (err: any) {
            showToast('error', err.message || 'Erro ao remover.');
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!website_slug.trim()) {
            showToast('error', 'URL do site é obrigatória');
            return;
        }

        setLoading(true);
        try {
            await profileService.updateProfile({
                website_active,
                website_slug: website_slug.toLowerCase().trim(),
                website_theme,
                website_primary_color,
                website_background_color,
                website_typography,
                website_card_style,
                website_hero_text,
                website_hero_subtitle,
                website_city,
                website_about_text,
                website_business_hours,
                website_google_maps,
                website_whatsapp,
                website_cta_text,
                website_sections: {
                    ...profile.website_sections,
                    show_floating_whatsapp,
                    show_exit_popup,
                },
                website_branding: {
                    ...profile.website_branding,
                    enabled: brandingEnabled,
                },
                website_optimization: {
                    ...profile.website_optimization,
                    meta_title: metaTitle,
                    meta_description: metaDesc,
                },
                preset_messages: presetMessages,
            });

            onUpdate();
            showToast('success', 'Configurações salvas com sucesso!');
        } catch (error: any) {
            showToast('error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'hero' | 'logo_primary' | 'logo_dark' | 'favicon') => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        try {
            const width = type === 'hero' ? 1920 : type === 'favicon' ? 128 : 600;
            const height = type === 'hero' ? 800 : type === 'favicon' ? 128 : 200;

            const resized = await resizeImage(file, width, height);
            const fileName = `${profile.id}/site-${type}-${Date.now()}.png`;
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, resized, { contentType: 'image/png', upsert: true });
            
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
            
            const update: any = {};
            if (type === 'hero') update.website_hero_image = publicUrl;
            else if (type === 'logo_primary') update.website_branding = { ...profile.website_branding, logo_primary: publicUrl };
            else if (type === 'logo_dark') update.website_branding = { ...profile.website_branding, logo_dark: publicUrl };
            else if (type === 'favicon') update.website_branding = { ...profile.website_branding, favicon: publicUrl };

            await profileService.updateProfile(update);
            onUpdate();
            showToast('success', 'Upload concluído!');
        } catch (error: any) {
            showToast('error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-[1200px] mx-auto pb-20 animate-fadeIn">
            {/* Header: Status e Links Rápidos */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col lg:flex-row gap-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50" />
                
                <div className="flex items-center gap-4 lg:w-1/3 relative z-10">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-all ${website_active ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <Globe size={28} className={website_active ? 'animate-pulse' : ''} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Website Público</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${website_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {website_active ? 'Online' : 'Offline'}
                            </span>
                            <button onClick={() => setWebsiteActive(!website_active)}
                                className={`relative w-10 h-5 rounded-full transition-all duration-300 ${website_active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${website_active ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 lg:border-l lg:border-slate-100 lg:pl-6 relative z-10">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">URL do Site</label>
                        <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 focus-within:bg-white focus-within:border-emerald-500 transition-all">
                            <span className="text-slate-400 font-bold text-xs">site/</span>
                            <input value={website_slug} onChange={e => setWebsiteSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                placeholder="sua-loja" className="bg-transparent border-none outline-none font-black text-slate-900 text-xs flex-1 ml-1" />
                        </div>
                        {website_slug && (
                            <a href={`/site/${website_slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-1 text-[9px] font-black text-emerald-600 uppercase hover:underline">
                                Ver Site <LinkIcon size={10} />
                            </a>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Domínio Profissional</label>
                        {custom_domain ? (
                            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
                                <Globe size={12} className="text-emerald-600 shrink-0" />
                                <span className="font-black text-emerald-900 text-xs flex-1 uppercase">{custom_domain}</span>
                                <button
                                    onClick={handleRemoveDomain}
                                    disabled={loading}
                                    className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-all disabled:opacity-50"
                                    title="Remover"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1">
                                <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 focus-within:bg-white focus-within:border-emerald-500 transition-all flex-1">
                                    <Globe size={12} className="text-slate-400 mr-2" />
                                    <input
                                        value={customDomainInput}
                                        onChange={e => setCustomDomainInput(e.target.value.toLowerCase())}
                                        onKeyPress={e => e.key === 'Enter' && handleRegisterDomain()}
                                        placeholder="seu-dominio.com.br"
                                        className="bg-transparent border-none outline-none font-black text-slate-900 text-xs flex-1" />
                                </div>
                                <button
                                    onClick={handleRegisterDomain}
                                    disabled={domainStatus === 'registering'}
                                    className="px-2 py-2.5 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50 active:scale-95"
                                >
                                    {domainStatus === 'registering' ? <Loader2 size={12} className="animate-spin" /> : 'OK'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Navegação por Abas */}
            <div className="flex flex-wrap gap-1 p-1 bg-slate-100/50 rounded-2xl md:w-fit">
                {[
                    { id: 'visual', label: 'Visual', icon: Palette },
                    { id: 'content', label: 'Conteúdo', icon: Layout },
                    { id: 'conversion', label: 'Conversão', icon: Zap },
                    { id: 'seo', label: 'SEO', icon: Search },
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Conteúdo das Abas */}
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm min-h-[500px]">
                {activeTab === 'visual' && (
                    <div className="space-y-10">
                        {/* Temas */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Sparkles size={14} className="text-amber-500" /> Estilo do Site</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                {THEMES.map(t => (
                                    <button key={t.id} onClick={() => setWebsiteTheme(t.id)}
                                        className={`p-4 rounded-2xl border-2 transition-all text-left relative ${website_theme === t.id ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'}`}>
                                        <div className={`w-full h-12 rounded-lg mb-3 ${t.preview} border border-black/5`} />
                                        <p className="text-[10px] font-black text-slate-900 uppercase">{t.name}</p>
                                        {website_theme === t.id && <Check size={12} className="absolute top-2 right-2 text-emerald-500" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Cores e Fundo */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-slate-50">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Cor de Destaque</label>
                                <div className="flex flex-wrap gap-2">
                                    {PRESET_COLORS.map(color => (
                                        <button key={color.hex} onClick={() => setWebsitePrimaryColor(color.hex)}
                                            className={`w-8 h-8 rounded-full border-2 transition-all ${website_primary_color === color.hex ? 'border-slate-900 ring-2 ring-slate-900/10 scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: color.hex }} title={color.name} />
                                    ))}
                                    <input type="color" value={website_primary_color} onChange={e => setWebsitePrimaryColor(e.target.value)} className="w-8 h-8 rounded-full cursor-pointer bg-transparent" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Esquema de Fundo</label>
                                <div className="flex gap-2">
                                    <button onClick={() => setWebsiteBackgroundColor('light')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-xs transition-all ${website_background_color === 'light' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}>
                                        <Sun size={14} /> Claro
                                    </button>
                                    <button onClick={() => setWebsiteBackgroundColor('dark')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-xs transition-all ${website_background_color === 'dark' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}>
                                        <Moon size={14} /> Escuro
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tipografia e Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-slate-50">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Fonte Principal</label>
                                <select value={website_typography} onChange={e => setWebsiteTypography(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none">
                                    <option value="inter">Inter (Moderna)</option>
                                    <option value="playfair">Playfair (Luxuosa)</option>
                                    <option value="oswald">Oswald (Impactante)</option>
                                    <option value="fraunces">Fraunces (Elegante)</option>
                                </select>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Estilo dos Elementos</label>
                                <div className="flex gap-2">
                                    <button onClick={() => setWebsiteCardStyle('rounded')}
                                        className={`flex-1 py-3 rounded-xl border-2 font-bold text-xs transition-all ${website_card_style === 'rounded' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-100 text-slate-500'}`}>
                                        Arredondado
                                    </button>
                                    <button onClick={() => setWebsiteCardStyle('square')}
                                        className={`flex-1 py-3 rounded-xl border-2 font-bold text-xs transition-all ${website_card_style === 'square' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-100 text-slate-500'}`}>
                                        Quadrado
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="space-y-10">
                        {/* Seção Hero - IMPORTANTE PARA O USUÁRIO */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><ImageIcon size={14} className="text-indigo-500" /> Banner Principal (Hero)</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Título Grande</label>
                                        <input value={website_hero_text} onChange={e => setWebsiteHeroText(e.target.value)}
                                            placeholder="Ex: Encontre o Seu Veículo Ideal" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-black text-sm outline-none focus:bg-white focus:border-emerald-500" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Subtítulo</label>
                                        <textarea value={website_hero_subtitle} onChange={e => setWebsiteHeroSubtitle(e.target.value)}
                                            placeholder="Descrição curta de boas-vindas..." className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs h-24 outline-none resize-none focus:bg-white focus:border-emerald-500" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Imagem de Fundo</label>
                                    <div className="relative aspect-video rounded-2xl bg-slate-100 overflow-hidden border-2 border-dashed border-slate-200 group flex items-center justify-center">
                                        {profile.website_hero_image ? (
                                            <img src={profile.website_hero_image} alt="Hero" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center">
                                                <ImageIcon size={32} className="mx-auto text-slate-300" />
                                                <p className="text-[9px] font-black text-slate-400 mt-2 uppercase">Sem Imagem</p>
                                            </div>
                                        )}
                                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                            <div className="px-4 py-2 bg-white rounded-lg text-[10px] font-black uppercase text-slate-900 flex items-center gap-2">
                                                <Camera size={14} /> Alterar Foto
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'hero')} />
                                        </label>
                                    </div>
                                    <p className="text-[9px] text-slate-400 italic">Recomendado: 1920x800px. A imagem terá um overlay escuro automaticamente.</p>
                                </div>
                            </div>
                        </div>

                        {/* Informações da Loja */}
                        <div className="pt-8 border-t border-slate-50 space-y-6">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><MapPin size={14} className="text-blue-500" /> Dados da Loja</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Cidade e Estado</label>
                                    <input value={website_city} onChange={e => setWebsiteCity(e.target.value)}
                                        placeholder="Ex: Curitiba, PR" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:bg-white" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Link do Google Maps</label>
                                    <input value={website_google_maps} onChange={e => setWebsiteGoogleMaps(e.target.value)}
                                        placeholder="https://goo.gl/maps/..." className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:bg-white" />
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Sobre a Loja</label>
                                    <textarea value={website_about_text} onChange={e => setWebsiteAboutText(e.target.value)}
                                        placeholder="História da loja, missão..." className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs h-24 outline-none resize-none focus:bg-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'conversion' && (
                    <div className="space-y-10">
                        {/* WhatsApp e CTA */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><MessageSquare size={14} className="text-emerald-500" /> Canais de Conversão</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">WhatsApp Principal</label>
                                    <input value={website_whatsapp} onChange={e => setWebsiteWhatsapp(e.target.value)}
                                        placeholder="(00) 00000-0000" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-black text-sm outline-none focus:bg-white" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Texto do Botão (CTA)</label>
                                    <input value={website_cta_text} onChange={e => setWebsiteCtaText(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-black text-sm outline-none focus:bg-white" />
                                </div>
                            </div>
                        </div>

                        {/* Automação */}
                        <div className="pt-8 border-t border-slate-50 space-y-6">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Zap size={14} className="text-amber-500" /> Gatilhos de Venda</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                                    <input type="checkbox" checked={show_floating_whatsapp} onChange={e => setShowFloatingWhatsapp(e.target.checked)} className="w-4 h-4 accent-emerald-500" />
                                    <div>
                                        <p className="text-[11px] font-black text-slate-900 uppercase">WhatsApp Flutuante</p>
                                        <p className="text-[9px] text-slate-500 font-medium">Botão fixo no canto da tela.</p>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                                    <input type="checkbox" checked={show_exit_popup} onChange={e => setShowExitPopup(e.target.checked)} className="w-4 h-4 accent-emerald-500" />
                                    <div>
                                        <p className="text-[11px] font-black text-slate-900 uppercase">Popup de Saída</p>
                                        <p className="text-[9px] text-slate-500 font-medium">Captura leads antes do fechamento.</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Mensagens Predefinidas */}
                        <div className="pt-8 border-t border-slate-50 space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Mensagem Padrão do WhatsApp</label>
                            <textarea value={presetMessages[0] || ''} onChange={e => setPresetMessages([e.target.value])}
                                placeholder="Use [VEICULO] para o nome do carro..." className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs h-24 outline-none resize-none focus:bg-white" />
                        </div>
                    </div>
                )}

                {activeTab === 'seo' && (
                    <div className="space-y-10">
                        {/* SEO Básicos */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Search size={14} className="text-blue-500" /> Otimização para Buscas</h3>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Título da Página (Aba do Navegador)</label>
                                    <input value={metaTitle} onChange={e => setMetaTitle(e.target.value)}
                                        placeholder="Ex: Sua Loja | Melhores Veículos da Região" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:bg-white" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Meta Descrição</label>
                                    <textarea value={metaDesc} onChange={e => setMetaDesc(e.target.value)}
                                        placeholder="Breve descrição para aparecer no Google..." className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs h-24 outline-none resize-none focus:bg-white" />
                                </div>
                            </div>
                        </div>

                        {/* Logos e Branding */}
                        <div className="pt-8 border-t border-slate-50 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Layers size={14} className="text-indigo-500" /> Logos e Favicon</h3>
                                <button onClick={() => setBrandingEnabled(!brandingEnabled)}
                                    className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${brandingEnabled ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    {brandingEnabled ? 'Personalizado Ativo' : 'Ativar Logos Próprios'}
                                </button>
                            </div>
                            
                            {brandingEnabled ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Logo (Light)</label>
                                        <div className="relative h-32 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center group overflow-hidden">
                                            {profile.website_branding?.logo_primary ? <img src={profile.website_branding.logo_primary} className="max-h-24 px-2" /> : <ImageIcon className="text-slate-200" size={24} />}
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={e => handleFileUpload(e, 'logo_primary')} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Logo (Dark)</label>
                                        <div className="relative h-32 bg-slate-900 rounded-xl border border-dashed border-white/10 flex items-center justify-center group overflow-hidden">
                                            {profile.website_branding?.logo_dark ? <img src={profile.website_branding.logo_dark} className="max-h-24 px-2" /> : <ImageIcon className="text-white/10" size={24} />}
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={e => handleFileUpload(e, 'logo_dark')} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Favicon</label>
                                        <div className="relative h-24 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center group overflow-hidden">
                                            {profile.website_branding?.favicon ? <img src={profile.website_branding.favicon} className="w-8 h-8" /> : <Globe className="text-slate-200" size={24} />}
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={e => handleFileUpload(e, 'favicon')} />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                                    <AlertCircle className="text-slate-400" size={16} />
                                    <p className="text-[10px] text-slate-600 font-medium">O site está usando a logo principal da empresa. Ative o branding para usar logos diferentes.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Ação de Salvar Flutuante */}
            <div className="fixed bottom-8 right-8 z-[100]">
                <button onClick={handleSave} disabled={loading}
                    className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-full font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Publicar Alterações
                </button>
            </div>
        </div>
    );
};

export default WebsiteSettings;