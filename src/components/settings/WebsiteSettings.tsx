import React, { useState } from 'react';
import {
    Save,
    Globe,
    Palette,
    Image as ImageIcon,
    MapPin,
    Loader2,
    Camera,
    Check,
    AlertCircle,
    Layers,
    Layout,
    MessageSquare,
    Search,
    Code,
    Smartphone,
    Monitor,
    Zap,
    Sparkles,
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
    { id: 'classic', name: 'Classic (Stone)', description: 'Elegante, focado em tipografia e tons de pedra.', preview: 'bg-stone-100' },
    { id: 'modern', name: 'Modern (Clean)', description: 'Minimalista, bordas arredondadas e espaços em branco.', preview: 'bg-blue-50' },
    { id: 'glass', name: 'Glassmorphism', description: 'Visual futurista com transparências e gradientes.', preview: 'bg-slate-900' },
    { id: 'bold', name: 'Bold (Dark)', description: 'Cores fortes, contraste alto e tipografia agressiva.', preview: 'bg-slate-950' },
    { id: 'luxury', name: 'Luxury (Gold)', description: 'Sofisticado, tons pretos e dourados com fontes serifadas.', preview: 'bg-[#0f0e0c]' },
];

const WebsiteSettings: React.FC<Props> = ({ profile, onUpdate }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'visual' | 'content' | 'seo' | 'advanced'>('visual');

    // Basic Settings
    const [website_active, setWebsiteActive] = useState(profile.website_active || false);
    const [website_slug, setWebsiteSlug] = useState(profile.website_slug || '');
    const [website_theme, setWebsiteTheme] = useState(profile.website_theme || 'classic');
    const [website_primary_color, setWebsitePrimaryColor] = useState(profile.website_primary_color || '#10b981');
    const [website_background_color, setWebsiteBackgroundColor] = useState(profile.website_background_color || '');
    
    // Content Settings
    const [website_hero_text, setWebsiteHeroText] = useState(profile.website_hero_text || '');
    const [website_hero_subtitle, setWebsiteHeroSubtitle] = useState(profile.website_hero_subtitle || '');
    const [website_city, setWebsiteCity] = useState(profile.website_city || '');
    const [website_whatsapp, setWebsiteWhatsapp] = useState(profile.website_whatsapp || '');
    
    // Branding Settings
    const [brandingEnabled, setBrandingEnabled] = useState(profile.website_branding?.enabled || false);
    
    // SEO Settings
    const [metaTitle, setMetaTitle] = useState(profile.website_optimization?.meta_title || '');
    const [metaDesc, setMetaDesc] = useState(profile.website_optimization?.meta_description || '');

    // Advanced Settings
    const [presetMessages, setPresetMessages] = useState<string[]>(profile.preset_messages || []);

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
                website_hero_text,
                website_hero_subtitle,
                website_city,
                website_whatsapp,
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
            showToast('success', 'Configurações atualizadas com sucesso!');
        } catch (error: any) {
            showToast('error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'hero' | 'logo_primary' | 'logo_dark') => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        try {
            const width = type === 'hero' ? 1920 : 600;
            const height = type === 'hero' ? 600 : 200;

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

            await profileService.updateProfile(update);
            onUpdate();
            showToast('success', 'Upload concluído!');
        } catch (error: any) {
            showToast('error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const publicUrl = website_slug ? `nleads.com.br/site/${website_slug}` : 'Escolha sua URL...';

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header com Status */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-colors ${website_active ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <Globe size={32} className={website_active ? 'animate-pulse' : ''} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Website Público</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{publicUrl}</span>
                            {website_slug && (
                                <a href={`/site/${website_slug}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-500 hover:underline">
                                    Visualizar Site
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl">
                    <span className={`text-xs font-black uppercase tracking-widest px-3 ${website_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {website_active ? 'Online' : 'Offline'}
                    </span>
                    <button
                        onClick={() => setWebsiteActive(!website_active)}
                        className={`relative w-14 h-8 rounded-full transition-all duration-300 ${website_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                        <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-sm ${website_active ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>

            {/* Tabs de Configuração */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/50 rounded-2xl md:w-fit">
                {[
                    { id: 'visual', label: 'Visual & Temas', icon: Palette },
                    { id: 'content', label: 'Conteúdo & Hero', icon: Layout },
                    { id: 'seo', label: 'SEO & Google', icon: Search },
                    { id: 'advanced', label: 'Avançado', icon: Zap },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === tab.id 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Conteúdo das Tabs */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-12 shadow-sm min-h-[400px]">
                {activeTab === 'visual' && (
                    <div className="space-y-12">
                        {/* Seletor de Temas */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <Sparkles className="text-amber-500" size={24} />
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Motor de Temas Dinâmico</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {THEMES.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setWebsiteTheme(t.id)}
                                        className={`group relative flex flex-col p-6 rounded-[2rem] border-2 transition-all text-left ${
                                            website_theme === t.id 
                                                ? 'border-emerald-500 bg-emerald-50/30 ring-4 ring-emerald-500/5' 
                                                : 'border-slate-100 hover:border-slate-200 bg-white'
                                        }`}
                                    >
                                        <div className={`w-full h-24 rounded-2xl mb-4 shadow-inner ${t.preview} flex items-center justify-center border border-slate-100 overflow-hidden`}>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="px-4 py-2 bg-black/80 text-white text-[10px] font-black uppercase rounded-full">Prévia</div>
                                            </div>
                                        </div>
                                        <h4 className="text-sm font-black text-slate-900">{t.name}</h4>
                                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-medium">{t.description}</p>
                                        {website_theme === t.id && (
                                            <div className="absolute top-4 right-4 text-emerald-500">
                                                <Check size={20} className="bg-white rounded-full" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Cores */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-slate-50">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Cor de Destaque (Principal)</label>
                                <div className="flex items-center gap-4">
                                    <input type="color" value={website_primary_color} onChange={e => setWebsitePrimaryColor(e.target.value)}
                                        className="w-16 h-16 rounded-2xl cursor-pointer border-4 border-white shadow-lg" />
                                    <div className="flex-1">
                                        <input type="text" value={website_primary_color} onChange={e => setWebsitePrimaryColor(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-mono text-sm uppercase" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Cor de Fundo (Páginas)</label>
                                <div className="flex items-center gap-4">
                                    <input type="color" value={website_background_color || '#ffffff'} onChange={e => setWebsiteBackgroundColor(e.target.value)}
                                        className="w-16 h-16 rounded-2xl cursor-pointer border-4 border-white shadow-lg" />
                                    <div className="flex-1">
                                        <input type="text" value={website_background_color} onChange={e => setWebsiteBackgroundColor(e.target.value)}
                                            placeholder="Default (White)" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-mono text-sm uppercase" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="space-y-12">
                        {/* URL e Básicos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">URL do Site (Slug)</label>
                                <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 group focus-within:bg-white focus-within:border-emerald-500 transition-all">
                                    <span className="text-slate-400 font-bold text-sm">site/</span>
                                    <input value={website_slug} onChange={e => setWebsiteSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                        placeholder="nome-da-loja" className="bg-transparent border-none outline-none font-black text-slate-900 flex-1 ml-1" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Cidade Principal</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input value={website_city} onChange={e => setWebsiteCity(e.target.value)}
                                        placeholder="Ex: Curitiba, PR" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:border-emerald-500 transition-all" />
                                </div>
                            </div>
                        </div>

                        {/* Hero Section */}
                        <div className="space-y-6 pt-8 border-t border-slate-50">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Seção Hero (Cabeçalho)</h3>
                                <ImageIcon className="text-slate-200" size={24} />
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <input value={website_hero_text} onChange={e => setWebsiteHeroText(e.target.value)}
                                        placeholder="Título Principal impactante..." className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-lg outline-none" />
                                    <textarea value={website_hero_subtitle} onChange={e => setWebsiteHeroSubtitle(e.target.value)}
                                        placeholder="Subtítulo ou descrição curta..." className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm h-32 outline-none resize-none" />
                                </div>
                                <div className="relative aspect-video rounded-[2rem] bg-slate-100 overflow-hidden border-4 border-white shadow-xl group">
                                    {profile.website_hero_image ? (
                                        <img src={profile.website_hero_image} alt="Hero" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                            <ImageIcon size={48} />
                                            <span className="text-[10px] font-black uppercase">Banner do Site</span>
                                        </div>
                                    )}
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <div className="px-6 py-3 bg-white rounded-2xl text-xs font-black uppercase tracking-widest text-slate-900 shadow-xl flex items-center gap-2">
                                            <Camera size={16} /> Alterar Banner
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'hero')} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'seo' && (
                    <div className="space-y-12">
                        {/* SEO Config */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <Search className="text-blue-500" size={24} />
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Otimização (SEO)</h3>
                            </div>
                            <div className="space-y-6 max-w-3xl">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Meta Título (Aba do Navegador)</label>
                                    <input value={metaTitle} onChange={e => setMetaTitle(e.target.value)}
                                        placeholder="Título para o Google e Redes Sociais..." className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Meta Descrição</label>
                                    <textarea value={metaDesc} onChange={e => setMetaDesc(e.target.value)}
                                        placeholder="Descrição que aparece nos resultados de busca..." className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm h-32 outline-none resize-none" />
                                </div>
                            </div>
                        </div>

                        {/* Branding Avançado */}
                        <div className="space-y-6 pt-8 border-t border-slate-50">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Logos Customizados</h3>
                                <button onClick={() => setBrandingEnabled(!brandingEnabled)}
                                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${brandingEnabled ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    {brandingEnabled ? 'Branding Ativo' : 'Ativar Branding'}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Logo Principal (Light Background)</label>
                                    <div className="relative h-32 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group">
                                        {profile.website_branding?.logo_primary ? (
                                            <img src={profile.website_branding.logo_primary} alt="Logo Light" className="max-h-20" />
                                        ) : <ImageIcon className="text-slate-200" size={32} />}
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={e => handleFileUpload(e, 'logo_primary')} />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Logo Alternativa (Dark Background)</label>
                                    <div className="relative h-32 bg-slate-900 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden group">
                                        {profile.website_branding?.logo_dark ? (
                                            <img src={profile.website_branding.logo_dark} alt="Logo Dark" className="max-h-20" />
                                        ) : <ImageIcon className="text-white/10" size={32} />}
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={e => handleFileUpload(e, 'logo_dark')} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'advanced' && (
                    <div className="space-y-12">
                        {/* WhatsApp Automation */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <MessageSquare className="text-emerald-500" size={24} />
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic">Automação WhatsApp</h3>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Template de Mensagem</label>
                                        <div className="flex gap-1.5">
                                            {['[NOME]', '[MARCA]', '[MODELO]', '[PRECO]'].map(v => (
                                                <span key={v} className="px-2 py-0.5 bg-slate-100 text-[9px] font-bold text-slate-600 rounded">{v}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <textarea 
                                        value={presetMessages[0] || ''} 
                                        onChange={e => {
                                            const newMsgs = [...presetMessages];
                                            newMsgs[0] = e.target.value;
                                            setPresetMessages(newMsgs);
                                        }}
                                        placeholder="Ex: Olá, vim pelo site! Gostaria de saber mais sobre o [MARCA] [MODELO]..."
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm h-32 outline-none resize-none" />
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-4">
                                    <Smartphone className="text-emerald-500 shrink-0" size={20} />
                                    <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                                        As variáveis entre colchetes serão substituídas automaticamente pelos dados do veículo quando o cliente clicar no botão do site.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Codigo Customizado */}
                        <div className="space-y-6 pt-8 border-t border-slate-50">
                            <div className="flex items-center gap-3">
                                <Code className="text-indigo-500" size={20} />
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Scripts & Analytics</h3>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Google Tag Manager / Facebook Pixel (Header)</label>
                                <textarea placeholder="<script>...</script>" className="w-full px-5 py-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl h-40 outline-none resize-none" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Ação de Salvar Flutuante */}
            <div className="fixed bottom-8 right-8 z-[100] animate-bounceIn">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-3 px-8 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Publicar Alterações
                </button>
            </div>
        </div>
    );
};

export default WebsiteSettings;
