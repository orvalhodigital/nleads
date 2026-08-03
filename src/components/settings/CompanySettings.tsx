import React, { useState } from 'react';
import { Profile } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { profileService } from '../../services/profileService';
import { supabase } from '../../lib/supabaseClient';
import { generateCompanyText } from '../../services/openaiService';
import {
    Building2, Sparkles, Wand2, Upload, Loader2, Save, Palette,
    Phone, MapPin, Instagram, Facebook, Youtube, Globe, Check, Image
} from 'lucide-react';

interface CompanySettingsProps {
    profile: Profile;
    onUpdate: () => void;
}

const BRAND_COLOR_PRESETS = [
    { label: 'Roxo Imperial', color: '#7c3aed' },
    { label: 'Azul Concessionária', color: '#2563eb' },
    { label: 'Esmeralda Premium', color: '#059669' },
    { label: 'Dourado Prestige', color: '#d97706' },
    { label: 'Vermelho Esportivo', color: '#dc2626' },
    { label: 'Grafite Moderno', color: '#1e293b' },
];

export const CompanySettings: React.FC<CompanySettingsProps> = ({ profile, onUpdate }) => {
    const { showToast } = useToast();
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingFavicon, setUploadingFavicon] = useState(false);

    // Form state
    const [companyName, setCompanyName] = useState(profile.company_name || '');
    const [cpfCnpj, setCpfCnpj] = useState(profile.cpf_cnpj || '');
    const [phone, setPhone] = useState(profile.phone || profile.website_whatsapp || '');
    const [companyLogo, setCompanyLogo] = useState(profile.company_logo || '');
    const [websiteFavicon, setWebsiteFavicon] = useState(profile.website_favicon || '');
    const [city, setCity] = useState(profile.website_city || '');
    
    // Visual Identity Color
    const [primaryColor, setPrimaryColor] = useState(profile.website_primary_color || '#7c3aed');

    // Institutional Texts
    const [shortAbout, setShortAbout] = useState(profile.website_hero_subtitle || '');
    const [aboutText, setAboutText] = useState(profile.website_about_text || '');

    // Social Media
    const [instagram, setInstagram] = useState(profile.website_instagram || '');
    const [facebook, setFacebook] = useState(profile.website_facebook || '');
    const [youtube, setYoutube] = useState(profile.website_youtube || '');
    const [tiktok, setTiktok] = useState(profile.website_tiktok || '');

    // AI Loaders
    const [generatingShort, setGeneratingShort] = useState(false);
    const [improvingShort, setImprovingShort] = useState(false);
    const [generatingAbout, setGeneratingAbout] = useState(false);
    const [improvingAbout, setImprovingAbout] = useState(false);

    // Logo Upload Handler
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingLogo(true);
        try {
            const fileName = `logos/${Date.now()}-${Math.random().toString(36).substring(2)}.png`;
            const { error: uploadError } = await supabase.storage
                .from('vehicles')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('vehicles')
                .getPublicUrl(fileName);

            setCompanyLogo(publicUrl);
            showToast('success', 'Logotipo enviado com sucesso!');
        } catch (err: any) {
            console.error(err);
            showToast('error', 'Erro ao enviar logotipo: ' + (err.message || 'Tente novamente.'));
        } finally {
            setUploadingLogo(false);
        }
    };

    // Favicon Upload Handler
    const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingFavicon(true);
        try {
            const fileName = `favicons/${Date.now()}-${Math.random().toString(36).substring(2)}.png`;
            const { error: uploadError } = await supabase.storage
                .from('vehicles')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('vehicles')
                .getPublicUrl(fileName);

            setWebsiteFavicon(publicUrl);
            showToast('success', 'Favicon enviado com sucesso!');
        } catch (err: any) {
            console.error(err);
            showToast('error', 'Erro ao enviar favicon: ' + (err.message || 'Tente novamente.'));
        } finally {
            setUploadingFavicon(false);
        }
    };

    // AI Handlers
    const handleGenerateShortAI = async () => {
        setGeneratingShort(true);
        try {
            const result = await generateCompanyText({
                companyName,
                city,
                mode: 'short',
                subAction: 'generate'
            });
            setShortAbout(result);
            showToast('success', 'Apresentação curta gerada com sucesso!');
        } catch (err: any) {
            showToast('error', err.message || 'Erro ao gerar com IA.');
        } finally {
            setGeneratingShort(false);
        }
    };

    const handleImproveShortAI = async () => {
        if (!shortAbout.trim()) {
            showToast('error', 'Digite um texto curto primeiro para que a IA possa melhorá-lo.');
            return;
        }
        setImprovingShort(true);
        try {
            const result = await generateCompanyText({
                companyName,
                city,
                text: shortAbout,
                mode: 'short',
                subAction: 'improve'
            });
            setShortAbout(result);
            showToast('success', 'Texto aprimorado com sucesso!');
        } catch (err: any) {
            showToast('error', err.message || 'Erro ao melhorar com IA.');
        } finally {
            setImprovingShort(false);
        }
    };

    const handleGenerateAboutAI = async () => {
        setGeneratingAbout(true);
        try {
            const result = await generateCompanyText({
                companyName,
                city,
                mode: 'full',
                subAction: 'generate'
            });
            setAboutText(result);
            showToast('success', 'História da empresa gerada com sucesso!');
        } catch (err: any) {
            showToast('error', err.message || 'Erro ao gerar história.');
        } finally {
            setGeneratingAbout(false);
        }
    };

    const handleImproveAboutAI = async () => {
        if (!aboutText.trim()) {
            showToast('error', 'Escreva uma prévia da história primeiro para a IA melhorar.');
            return;
        }
        setImprovingAbout(true);
        try {
            const result = await generateCompanyText({
                companyName,
                city,
                text: aboutText,
                mode: 'full',
                subAction: 'improve'
            });
            setAboutText(result);
            showToast('success', 'História aprimorada com sucesso!');
        } catch (err: any) {
            showToast('error', err.message || 'Erro ao melhorar história.');
        } finally {
            setImprovingAbout(false);
        }
    };

    // Save All Company Settings
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await profileService.updateProfile({
                company_name: companyName,
                cpf_cnpj: cpfCnpj,
                phone: phone,
                company_logo: companyLogo,
                website_favicon: websiteFavicon,
                website_whatsapp: phone,
                website_city: city,
                website_primary_color: primaryColor,
                website_hero_subtitle: shortAbout,
                website_about_text: aboutText,
                website_instagram: instagram,
                website_facebook: facebook,
                website_youtube: youtube,
                website_tiktok: tiktok
            });

            await onUpdate();
            showToast('success', 'Informações da empresa salvas com sucesso!');
        } catch (err: any) {
            console.error(err);
            showToast('error', 'Erro ao salvar informações da empresa.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="space-y-8 animate-fadeUp">
            {/* Bloco 1: Identidade Visual, Logotipo e Favicon */}
            <div className="bg-card rounded-3xl p-8 border border-border/80 shadow-sm space-y-8">
                <div className="flex items-center gap-3 pb-4 border-b border-border/60">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                        <Building2 size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-heading font-extrabold text-foreground tracking-tight">
                            Identidade Visual e Dados da Loja
                        </h2>
                        <p className="text-xs font-medium text-muted-foreground mt-0.5">
                            Gerencie a marca da sua loja, logotipo oficial, favicon de aba e informações de contato.
                        </p>
                    </div>
                </div>

                {/* Uploads Lado a Lado: Logotipo e Favicon */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Logotipo Upload */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 block">
                            Logotipo da Empresa
                        </label>
                        <div className="p-6 bg-muted/40 border-2 border-dashed border-border/80 rounded-3xl text-center space-y-4 relative overflow-hidden group">
                            {companyLogo ? (
                                <div className="space-y-3">
                                    <div className="w-full h-28 rounded-2xl bg-card border border-border/60 flex items-center justify-center p-3">
                                        <img src={companyLogo} alt="Logo da Empresa" className="max-h-full max-w-full object-contain" />
                                    </div>
                                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1">
                                        <Check size={12} /> Exibido no cabeçalho e site
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2 py-3">
                                    <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                                        <Image size={20} />
                                    </div>
                                    <p className="text-xs font-bold text-foreground">Nenhum logotipo enviado</p>
                                    <p className="text-[10px] text-muted-foreground">PNG, JPG, SVG, WEBP</p>
                                </div>
                            )}

                            <label className="block w-full cursor-pointer">
                                <div className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20 cursor-pointer">
                                    {uploadingLogo ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                                    {uploadingLogo ? 'Enviando...' : companyLogo ? 'Alterar Logotipo' : 'Enviar Logotipo'}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleLogoUpload}
                                    disabled={uploadingLogo}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Favicon Upload */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 block">
                            Favicon / Ícone da Aba do Navegador
                        </label>
                        <div className="p-6 bg-muted/40 border-2 border-dashed border-border/80 rounded-3xl text-center space-y-4 relative overflow-hidden group">
                            {websiteFavicon ? (
                                <div className="space-y-3">
                                    <div className="w-full h-28 rounded-2xl bg-card border border-border/60 flex items-center justify-center p-3">
                                        <img src={websiteFavicon} alt="Favicon da Empresa" className="w-12 h-12 object-contain" />
                                    </div>
                                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1">
                                        <Check size={12} /> Ativo na aba do navegador do cliente
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2 py-3">
                                    <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                                        <Globe size={20} />
                                    </div>
                                    <p className="text-xs font-bold text-foreground">Nenhum favicon enviado</p>
                                    <p className="text-[10px] text-muted-foreground">Ícone quadrado (ex: 64x64px)</p>
                                </div>
                            )}

                            <label className="block w-full cursor-pointer">
                                <div className="w-full py-3 px-4 bg-muted hover:bg-muted/80 text-foreground border border-border/80 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer">
                                    {uploadingFavicon ? <Loader2 size={15} className="animate-spin text-primary" /> : <Upload size={15} />}
                                    {uploadingFavicon ? 'Enviando...' : websiteFavicon ? 'Alterar Favicon' : 'Enviar Favicon'}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFaviconUpload}
                                    disabled={uploadingFavicon}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Form Fields: Nome, CNPJ, Cidade, WhatsApp */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                            Nome da Empresa / Nome Fantasia
                        </label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={e => setCompanyName(e.target.value)}
                            placeholder="Ex: Neto Carros Seminovos"
                            className="w-full p-4 bg-muted/60 border border-border/80 rounded-2xl outline-none font-bold text-sm text-foreground focus:bg-card focus:border-primary transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                            CNPJ / CPF do Estabelecimento
                        </label>
                        <input
                            type="text"
                            value={cpfCnpj}
                            onChange={e => setCpfCnpj(e.target.value)}
                            placeholder="00.000.000/0001-00"
                            className="w-full p-4 bg-muted/60 border border-border/80 rounded-2xl outline-none font-bold text-sm text-foreground focus:bg-card focus:border-primary transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                            Telefone / WhatsApp de Vendas
                        </label>
                        <div className="relative">
                            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="(11) 99999-9999"
                                className="w-full p-4 pl-11 bg-muted/60 border border-border/80 rounded-2xl outline-none font-bold text-sm text-foreground focus:bg-card focus:border-primary transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                            Cidade e Estado
                        </label>
                        <div className="relative">
                            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={city}
                                onChange={e => setCity(e.target.value)}
                                placeholder="Ex: São Paulo - SP"
                                className="w-full p-4 pl-11 bg-muted/60 border border-border/80 rounded-2xl outline-none font-bold text-sm text-foreground focus:bg-card focus:border-primary transition-all"
                            />
                        </div>
                    </div>

                    {/* Cor Primária da Marca */}
                    <div className="md:col-span-2 space-y-3 pt-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2">
                            <Palette size={14} className="text-primary" /> Cor Primária da Marca
                        </label>
                        <div className="flex flex-wrap items-center gap-3">
                            {BRAND_COLOR_PRESETS.map(preset => (
                                <button
                                    type="button"
                                    key={preset.color}
                                    onClick={() => setPrimaryColor(preset.color)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                        primaryColor.toLowerCase() === preset.color.toLowerCase()
                                            ? 'border-foreground shadow-md scale-105'
                                            : 'border-border/60 hover:border-border'
                                    }`}
                                >
                                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: preset.color }} />
                                    <span className="text-foreground">{preset.label}</span>
                                </button>
                            ))}

                            <div className="flex items-center gap-2 pl-2">
                                <input
                                    type="color"
                                    value={primaryColor}
                                    onChange={e => setPrimaryColor(e.target.value)}
                                    className="w-9 h-9 rounded-xl border border-border cursor-pointer bg-transparent"
                                />
                                <span className="text-xs font-mono font-bold text-muted-foreground uppercase">{primaryColor}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bloco 2: Sobre a Empresa & História (COM BOTÕES DE IA) */}
            <div className="bg-card rounded-3xl p-8 border border-border/80 shadow-sm space-y-8">
                <div className="flex items-center justify-between pb-4 border-b border-border/60">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-heading font-extrabold text-foreground tracking-tight">
                                Sobre a Empresa & História (Assistido por IA)
                            </h2>
                            <p className="text-xs font-medium text-muted-foreground mt-0.5">
                                Crie apresentações cativantes para os clientes do seu site. Use os botões de IA para escrever ou aprimorar.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 1. Apresentação Comercial Curta */}
                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                            Descrição Curta da Loja (Frase de Impacto)
                        </label>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleGenerateShortAI}
                                disabled={generatingShort || improvingShort}
                                className="px-3.5 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-primary/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {generatingShort ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                                {generatingShort ? 'Gerando...' : 'Gerar com IA'}
                            </button>

                            <button
                                type="button"
                                onClick={handleImproveShortAI}
                                disabled={generatingShort || improvingShort}
                                className="px-3.5 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {improvingShort ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                                {improvingShort ? 'Melhorando...' : 'Melhorar com IA'}
                            </button>
                        </div>
                    </div>

                    <textarea
                        value={shortAbout}
                        onChange={e => setShortAbout(e.target.value)}
                        placeholder="Ex: A Neto Carros é referência em seminovos revisados e com garantia em São Paulo. Qualidade, transparência e aprovação facilitada."
                        className="w-full p-4 h-24 bg-muted/60 border border-border/80 rounded-2xl outline-none font-semibold text-sm text-foreground focus:bg-card focus:border-primary transition-all resize-none"
                    />
                </div>

                {/* 2. História da Empresa & Diferenciais */}
                <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                            História da Empresa e Diferenciais
                        </label>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleGenerateAboutAI}
                                disabled={generatingAbout || improvingAbout}
                                className="px-3.5 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-primary/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {generatingAbout ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                                {generatingAbout ? 'Gerando...' : 'Gerar com IA'}
                            </button>

                            <button
                                type="button"
                                onClick={handleImproveAboutAI}
                                disabled={generatingAbout || improvingAbout}
                                className="px-3.5 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {improvingAbout ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                                {improvingAbout ? 'Melhorando...' : 'Melhorar com IA'}
                            </button>
                        </div>
                    </div>

                    <textarea
                        value={aboutText}
                        onChange={e => setAboutText(e.target.value)}
                        placeholder="Ex: Fundada com a missão de transformar a compra e venda de veículos seminovos em uma experiência transparente e segura..."
                        className="w-full p-4 h-44 bg-muted/60 border border-border/80 rounded-2xl outline-none font-semibold text-sm text-foreground focus:bg-card focus:border-primary transition-all"
                    />
                </div>
            </div>

            {/* Bloco 3: Redes Sociais */}
            <div className="bg-card rounded-3xl p-8 border border-border/80 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-border/60">
                    <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center border border-sky-500/20">
                        <Globe size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-heading font-extrabold text-foreground tracking-tight">
                            Redes Sociais da Loja
                        </h2>
                        <p className="text-xs font-medium text-muted-foreground mt-0.5">
                            Links para exibir no rodapé do site e cartões de atendimento.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Instagram</label>
                        <div className="relative">
                            <Instagram size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={instagram}
                                onChange={e => setInstagram(e.target.value)}
                                placeholder="https://instagram.com/sualoja"
                                className="w-full p-4 pl-11 bg-muted/60 border border-border/80 rounded-2xl outline-none font-bold text-sm text-foreground focus:bg-card focus:border-primary transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Facebook</label>
                        <div className="relative">
                            <Facebook size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={facebook}
                                onChange={e => setFacebook(e.target.value)}
                                placeholder="https://facebook.com/sualoja"
                                className="w-full p-4 pl-11 bg-muted/60 border border-border/80 rounded-2xl outline-none font-bold text-sm text-foreground focus:bg-card focus:border-primary transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">YouTube</label>
                        <div className="relative">
                            <Youtube size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={youtube}
                                onChange={e => setYoutube(e.target.value)}
                                placeholder="https://youtube.com/@sualoja"
                                className="w-full p-4 pl-11 bg-muted/60 border border-border/80 rounded-2xl outline-none font-bold text-sm text-foreground focus:bg-card focus:border-primary transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">TikTok</label>
                        <div className="relative">
                            <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={tiktok}
                                onChange={e => setTiktok(e.target.value)}
                                placeholder="https://tiktok.com/@sualoja"
                                className="w-full p-4 pl-11 bg-muted/60 border border-border/80 rounded-2xl outline-none font-bold text-sm text-foreground focus:bg-card focus:border-primary transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Salvando...' : 'Salvar Alterações da Empresa'}
                </button>
            </div>
        </form>
    );
};
