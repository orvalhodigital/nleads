import React, { useState } from 'react';
import {
    Save,
    Globe,
    Palette,
    Image,
    MapPin,
    Lock,
    Loader2,
    Camera,
    Check,
    AlertCircle,
    Layers,
    Heart,
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
    { id: 'modern', name: 'Moderno', colors: '#10b981-#1f2937', preview: 'bg-gradient-to-r from-emerald-500 to-slate-900' },
    { id: 'classic', name: 'Clássico', colors: '#3b82f6-#1e40af', preview: 'bg-gradient-to-r from-blue-500 to-blue-900' },
    { id: 'bold', name: 'Ousado', colors: '#ef4444-#dc2626', preview: 'bg-gradient-to-r from-red-500 to-red-800' },
    { id: 'luxury', name: 'Luxury', colors: '#d4af37-#1f2937', preview: 'bg-gradient-to-r from-yellow-500 to-slate-900' },
];

const PALETTES = [
    { name: 'Emerald', primary: '#10b981', secondary: '#059669', text: '#1f2937', title: '#064e3b' },
    { name: 'Blue', primary: '#3b82f6', secondary: '#1e40af', text: '#1e293b', title: '#0c2340' },
    { name: 'Purple', primary: '#a855f7', secondary: '#7e22ce', text: '#2d1b4e', title: '#4a1172' },
    { name: 'Red', primary: '#ef4444', secondary: '#dc2626', text: '#1f2937', title: '#7f1d1d' },
];

const WebsiteSettings: React.FC<Props> = ({ profile, onUpdate }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    const [website_active, setWebsiteActive] = useState(profile.website_active || false);
    const [website_slug, setWebsiteSlug] = useState(profile.website_slug || '');
    const [website_theme, setWebsiteTheme] = useState(profile.website_theme || 'modern');
    const [website_primary_color, setWebsitePrimaryColor] = useState(profile.website_primary_color || '#10b981');
    const [website_secondary_color, setWebsiteSecondaryColor] = useState(profile.website_secondary_color || '#059669');
    const [website_text_color, setWebsiteTextColor] = useState(profile.website_text_color || '#1f2937');
    const [website_title_color, setWebsiteTitleColor] = useState(profile.website_title_color || '#064e3b');
    const [website_use_gradient, setWebsiteUseGradient] = useState(profile.website_use_gradient || false);
    const [website_hero_text, setWebsiteHeroText] = useState(profile.website_hero_text || '');
    const [website_hero_subtitle, setWebsiteHeroSubtitle] = useState(profile.website_hero_subtitle || '');
    const [website_city, setWebsiteCity] = useState(profile.website_city || '');
    const [website_whatsapp, setWebsiteWhatsapp] = useState(profile.website_whatsapp || '');
    const [website_cta_text, setWebsiteCtaText] = useState(profile.website_cta_text || 'Fale Conosco');
    const [website_google_maps, setWebsiteGoogleMaps] = useState(profile.website_google_maps || '');
    const [custom_domain, setCustomDomain] = useState(profile.custom_domain || '');

    // Website sections
    const [show_mission_vision_values, setShowMissionVisionValues] = useState(profile.website_sections?.show_mission_vision_values !== false);
    const [website_mission, setWebsiteMission] = useState(profile.website_sections?.mission || '');
    const [website_vision, setWebsiteVision] = useState(profile.website_sections?.vision || '');
    const [website_values, setWebsiteValues] = useState(profile.website_sections?.values || '');
    const [show_vehicle_categories, setShowVehicleCategories] = useState(profile.website_sections?.show_vehicle_categories !== false);
    const [show_maps, setShowMaps] = useState(profile.website_sections?.show_maps !== false);
    const [show_contact_form, setShowContactForm] = useState(profile.website_sections?.show_contact_form !== false);

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
                website_secondary_color,
                website_text_color,
                website_title_color,
                website_use_gradient,
                website_hero_text,
                website_hero_subtitle,
                website_city,
                website_whatsapp,
                website_cta_text,
                website_google_maps,
                custom_domain,
                website_sections: {
                    show_mission_vision_values,
                    mission: website_mission,
                    vision: website_vision,
                    values: website_values,
                    show_vehicle_categories,
                    show_maps,
                    show_contact_form,
                },
            });

            onUpdate();
            showToast('success', 'Configurações do website salvas!');
        } catch (error: any) {
            showToast('error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        try {
            const resized = await resizeImage(file, 1200, 400);
            const fileName = `${profile.id}/hero-${Date.now()}.png`;
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, resized, { contentType: 'image/png', upsert: true });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
            await profileService.updateProfile({ website_hero_image: publicUrl });
            onUpdate();
            showToast('success', 'Imagem do hero atualizada!');
        } catch (error: any) {
            showToast('error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const publicUrl = website_slug ? `nleads.com.br/${website_slug}` : 'nleads.com.br/seu-site';

    return (
        <div className="space-y-8">
            {/* STATUS E URL */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                        <Globe className="text-emerald-500" size={28} />
                        Website Público
                    </h2>
                    <p className="text-sm text-slate-500 mt-2 font-medium">
                        Configure e publique o site da sua concessionária
                    </p>
                </div>

                <div className="space-y-5">
                    {/* Toggle */}
                    <div className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                        website_active
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-slate-50 border-slate-100'
                    }`}>
                        <div>
                            <p className="font-semibold text-slate-900">Ativar Website</p>
                            <p className="text-sm text-slate-500 mt-0.5">
                                {website_active ? '✓ Seu site está publicado' : 'Site ainda não está publicado'}
                            </p>
                        </div>
                        <button
                            onClick={() => setWebsiteActive(!website_active)}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                                website_active ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                        >
                            <span
                                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                                    website_active ? 'translate-x-7' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>

                    {/* URL */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                            URL do Website
                        </label>
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
                                    <span className="text-sm font-mono text-slate-500">nleads.com.br/</span>
                                    <input
                                        type="text"
                                        value={website_slug}
                                        onChange={e => setWebsiteSlug(e.target.value.replace(/[^a-z0-9-]/g, '').toLowerCase())}
                                        placeholder="seu-site"
                                        className="flex-1 bg-transparent text-sm font-mono text-slate-900 outline-none focus:text-slate-900"
                                    />
                                </div>
                            </div>
                            {website_slug && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
                                    <Check size={16} className="text-emerald-600" />
                                    <span className="text-xs font-bold text-emerald-700">Disponível</span>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            Seu site será acessível em: <span className="font-mono text-slate-600 font-bold">{publicUrl}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* TEMA */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                        <Palette className="text-blue-500" size={28} />
                        Tema do Website
                    </h2>
                    <p className="text-sm text-slate-500 mt-2 font-medium">
                        Escolha o visual que melhor representa sua marca
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {THEMES.map(theme => (
                        <button
                            key={theme.id}
                            onClick={() => setWebsiteTheme(theme.id)}
                            className={`relative group overflow-hidden rounded-2xl transition-all border-2 ${
                                website_theme === theme.id
                                    ? 'border-slate-900 shadow-lg scale-105'
                                    : 'border-slate-100 hover:border-slate-200 shadow-sm'
                            }`}
                        >
                            <div className={`${theme.preview} h-24 w-full`} />
                            <div className="bg-white p-3 text-center">
                                <p className="text-sm font-bold text-slate-900">{theme.name}</p>
                                {website_theme === theme.id && (
                                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold">
                                        <Check size={12} />
                                        Selecionado
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* IMAGEM HERO */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                        <Image className="text-purple-500" size={28} />
                        Imagem Principal (Hero)
                    </h2>
                    <p className="text-sm text-slate-500 mt-2 font-medium">
                        Esta imagem aparecerá em destaque na página inicial do seu site
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 hover:border-slate-300 transition-colors">
                        <label className="flex flex-col items-center justify-center py-12 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors gap-3">
                            {profile.website_hero_image ? (
                                <img src={profile.website_hero_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                            ) : null}
                            <div className={`relative flex flex-col items-center gap-2 ${profile.website_hero_image ? 'opacity-0 hover:opacity-100' : ''}`}>
                                <Camera className="text-slate-400" size={32} />
                                <div className="text-center">
                                    <p className="text-sm font-bold text-slate-700">Escolher imagem</p>
                                    <p className="text-xs text-slate-500">1200x400px (recomendado)</p>
                                </div>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleHeroImageUpload}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* CORES E PALETA */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                        <Palette className="text-pink-500" size={28} />
                        Cores e Paleta
                    </h2>
                    <p className="text-sm text-slate-500 mt-2 font-medium">
                        Configure as cores do seu website
                    </p>
                </div>

                {/* Paletas rápidas */}
                <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Paletas Rápidas</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {PALETTES.map(pal => (
                            <button
                                key={pal.name}
                                onClick={() => {
                                    setWebsitePrimaryColor(pal.primary);
                                    setWebsiteSecondaryColor(pal.secondary);
                                    setWebsiteTextColor(pal.text);
                                    setWebsiteTitleColor(pal.title);
                                }}
                                className="p-3 rounded-2xl border-2 border-slate-100 hover:border-slate-300 transition-all group"
                            >
                                <div className="flex gap-1.5 mb-2">
                                    <div className="h-6 w-6 rounded-lg" style={{ backgroundColor: pal.primary }} />
                                    <div className="h-6 w-6 rounded-lg" style={{ backgroundColor: pal.secondary }} />
                                </div>
                                <p className="text-xs font-bold text-slate-700 group-hover:text-slate-900">{pal.name}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cores individuais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Cor Principal</label>
                        <div className="flex gap-3 items-center">
                            <input
                                type="color"
                                value={website_primary_color}
                                onChange={e => setWebsitePrimaryColor(e.target.value)}
                                className="w-16 h-16 rounded-2xl cursor-pointer border border-slate-200"
                            />
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={website_primary_color}
                                    onChange={e => setWebsitePrimaryColor(e.target.value)}
                                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:border-slate-400 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Cor Secundária</label>
                        <div className="flex gap-3 items-center">
                            <input
                                type="color"
                                value={website_secondary_color}
                                onChange={e => setWebsiteSecondaryColor(e.target.value)}
                                className="w-16 h-16 rounded-2xl cursor-pointer border border-slate-200"
                            />
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={website_secondary_color}
                                    onChange={e => setWebsiteSecondaryColor(e.target.value)}
                                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:border-slate-400 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Cor do Texto</label>
                        <div className="flex gap-3 items-center">
                            <input
                                type="color"
                                value={website_text_color}
                                onChange={e => setWebsiteTextColor(e.target.value)}
                                className="w-16 h-16 rounded-2xl cursor-pointer border border-slate-200"
                            />
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={website_text_color}
                                    onChange={e => setWebsiteTextColor(e.target.value)}
                                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:border-slate-400 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Cor dos Títulos</label>
                        <div className="flex gap-3 items-center">
                            <input
                                type="color"
                                value={website_title_color}
                                onChange={e => setWebsiteTitleColor(e.target.value)}
                                className="w-16 h-16 rounded-2xl cursor-pointer border border-slate-200"
                            />
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={website_title_color}
                                    onChange={e => setWebsiteTitleColor(e.target.value)}
                                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:border-slate-400 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PERSONALIZAÇÃO */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                        <Globe className="text-amber-500" size={28} />
                        Conteúdo do Website
                    </h2>
                    <p className="text-sm text-slate-500 mt-2 font-medium">
                        Customize o texto e informações que aparecem no seu site público
                    </p>
                </div>

                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Cidade</label>
                        <input
                            type="text"
                            value={website_city}
                            onChange={e => setWebsiteCity(e.target.value)}
                            placeholder="Ex: São Paulo, SP"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Título Principal (Hero)</label>
                        <input
                            type="text"
                            value={website_hero_text}
                            onChange={e => setWebsiteHeroText(e.target.value)}
                            placeholder="Ex: Encontre o Seu Veículo Ideal"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Subtítulo (Hero)</label>
                        <input
                            type="text"
                            value={website_hero_subtitle}
                            onChange={e => setWebsiteHeroSubtitle(e.target.value)}
                            placeholder="Ex: Qualidade, confiança e melhor preço"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">WhatsApp para Contato</label>
                        <input
                            type="text"
                            value={website_whatsapp}
                            onChange={e => setWebsiteWhatsapp(e.target.value)}
                            placeholder="Ex: 11999999999"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Texto do Botão CTA</label>
                        <input
                            type="text"
                            value={website_cta_text}
                            onChange={e => setWebsiteCtaText(e.target.value)}
                            placeholder="Ex: Fale Conosco"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* GOOGLE MAPS */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                        <MapPin className="text-red-500" size={28} />
                        Localização (Google Maps)
                    </h2>
                    <p className="text-sm text-slate-500 mt-2 font-medium">
                        Adicione o mapa da sua localização no site
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex gap-3">
                    <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
                    <div className="text-sm text-blue-900">
                        <p className="font-semibold">Como obter o código do mapa:</p>
                        <p className="text-xs mt-1">1. Acesse Google Maps 2. Clique em "Compartilhar" 3. Copie o código embed HTML</p>
                    </div>
                </div>

                <textarea
                    value={website_google_maps}
                    onChange={e => setWebsiteGoogleMaps(e.target.value)}
                    placeholder='Ex: <iframe src="https://www.google.com/maps/..." ></iframe>'
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono focus:bg-white focus:border-slate-400 outline-none transition-all"
                    rows={4}
                />
            </div>

            {/* DOMÍNIO PERSONALIZADO */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                        <Lock className="text-slate-600" size={28} />
                        Domínio Personalizado
                    </h2>
                    <p className="text-sm text-slate-500 mt-2 font-medium">
                        Use seu próprio domínio (opcional)
                    </p>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Seu Domínio</label>
                    <input
                        type="text"
                        value={custom_domain}
                        onChange={e => setCustomDomain(e.target.value)}
                        placeholder="Ex: veiculos.com.br"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 outline-none transition-all"
                    />
                    <p className="text-xs text-slate-400">Deixe em branco para usar o domínio padrão</p>
                </div>
            </div>

            {/* SEÇÕES DO WEBSITE */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                        <Layers className="text-indigo-500" size={28} />
                        Seções do Website
                    </h2>
                    <p className="text-sm text-slate-500 mt-2 font-medium">
                        Escolha quais seções aparecer no seu site
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Missão/Visão/Valores */}
                    <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                        <input
                            type="checkbox"
                            checked={show_mission_vision_values}
                            onChange={e => setShowMissionVisionValues(e.target.checked)}
                            className="mt-1 w-5 h-5 rounded cursor-pointer"
                        />
                        <div className="flex-1">
                            <p className="font-semibold text-slate-900">Missão, Visão e Valores</p>
                            <p className="text-xs text-slate-500 mt-1">Mostre os valores da sua empresa</p>
                            {show_mission_vision_values && (
                                <div className="mt-4 space-y-3">
                                    <input
                                        type="text"
                                        value={website_mission}
                                        onChange={e => setWebsiteMission(e.target.value)}
                                        placeholder="Missão da empresa"
                                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-400 outline-none"
                                    />
                                    <input
                                        type="text"
                                        value={website_vision}
                                        onChange={e => setWebsiteVision(e.target.value)}
                                        placeholder="Visão da empresa"
                                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-400 outline-none"
                                    />
                                    <input
                                        type="text"
                                        value={website_values}
                                        onChange={e => setWebsiteValues(e.target.value)}
                                        placeholder="Valores da empresa"
                                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-400 outline-none"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Categorias de Veículos */}
                    <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                        <input
                            type="checkbox"
                            checked={show_vehicle_categories}
                            onChange={e => setShowVehicleCategories(e.target.checked)}
                            className="mt-1 w-5 h-5 rounded cursor-pointer"
                        />
                        <div className="flex-1">
                            <p className="font-semibold text-slate-900">Categorias de Veículos</p>
                            <p className="text-xs text-slate-500 mt-1">Seções por categoria (Carros, Motos, Sedans, etc)</p>
                        </div>
                    </div>

                    {/* Google Maps */}
                    <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                        <input
                            type="checkbox"
                            checked={show_maps}
                            onChange={e => setShowMaps(e.target.checked)}
                            className="mt-1 w-5 h-5 rounded cursor-pointer"
                        />
                        <div className="flex-1">
                            <p className="font-semibold text-slate-900">Google Maps</p>
                            <p className="text-xs text-slate-500 mt-1">Mostra localização no site</p>
                        </div>
                    </div>

                    {/* Formulário de Contato */}
                    <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                        <input
                            type="checkbox"
                            checked={show_contact_form}
                            onChange={e => setShowContactForm(e.target.checked)}
                            className="mt-1 w-5 h-5 rounded cursor-pointer"
                        />
                        <div className="flex-1">
                            <p className="font-semibold text-slate-900">Formulário de Contato</p>
                            <p className="text-xs text-slate-500 mt-1">Permite visitantes entrar em contato</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTÃO SALVAR */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <>
                            <Save size={20} />
                            Salvar Configurações do Website
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default WebsiteSettings;
