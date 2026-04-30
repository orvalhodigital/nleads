import React, { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { websiteService, PublicProfile } from '../../services/websiteService';
import { Vehicle } from '../../types';
import { MessageCircle, Search, ChevronDown, Car, MapPin, Send, Shield, Award, CreditCard, RefreshCw, Filter, SlidersHorizontal, ExternalLink } from 'lucide-react';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import whatsappAnimation from '../../assets/whatsapp-lottie.json';

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

const DynamicIcon = ({ name, ...props }: { name?: string; size?: number; className?: string; style?: React.CSSProperties }) => {
    if (!name) return <Shield {...props} />;
    const IconComponent = (Icons as any)[name];
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
    const carros = vehicles.filter(v => !['Naked', 'Sport', 'Trail', 'Custom', 'Scooter', 'Touring', 'Elétrica', 'Street'].includes(v.type));
    const motos = vehicles.filter(v => ['Naked', 'Sport', 'Trail', 'Custom', 'Scooter', 'Touring', 'Elétrica', 'Street'].includes(v.type));
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

function getTC(theme: string, primary: string, profile?: PublicProfile): TC {
    switch (theme) {
        case 'glass': return {
            wrapper: 'min-h-screen text-white relative before:content-[""] before:fixed before:inset-0 before:bg-gradient-to-br before:from-slate-950 before:via-indigo-950 before:to-slate-900 before:-z-10 after:content-[""] after:fixed after:inset-0 after:bg-[radial-gradient(ellipse_at_top_left,rgba(56,189,248,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.15),transparent_50%)] after:-z-10 selection:bg-cyan-500/30',
            nav: 'sticky top-0 z-50 bg-white/[0.03] backdrop-blur-xl border-b border-white/[0.08]',
            heroText: 'text-white text-5xl md:text-7xl font-black tracking-tight leading-[1.05]',
            heroSubText: 'text-white/60 text-lg md:text-xl font-light tracking-wide',
            heroAlign: 'text-center items-center',
            heroBtnOutline: 'border border-white/20 bg-white/5 backdrop-blur-xl text-white hover:bg-white/10 font-bold transition-all px-8 py-4 rounded-2xl shadow-2xl',
            sectionTitle: 'text-white/30 font-black text-xs uppercase tracking-[0.4em]',
            card: 'bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:border-cyan-400/40 hover:-translate-y-2 transition-all duration-500 shadow-2xl',
            cardTitle: 'text-white font-bold text-xl tracking-tight',
            cardSub: 'text-white/40 text-xs font-medium uppercase tracking-widest',
            cardBadge: 'bg-white/10 backdrop-blur-md text-white/90 text-[10px] font-bold px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter',
            cardBtnDetail: 'flex-1 bg-white/5 border border-white/10 text-white text-xs font-bold rounded-2xl py-3 hover:bg-white/10 transition-all text-center',
            cardBtnWa: 'flex-1 bg-cyan-500 text-black text-xs font-black rounded-2xl py-3 hover:bg-cyan-400 transition-all text-center flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20',
            filterPill: 'px-5 py-2.5 rounded-full border border-white/10 bg-white/5 text-white/40 text-xs font-bold hover:bg-white/10 transition-all',
            filterPillActive: 'px-5 py-2.5 rounded-full border border-cyan-400/50 bg-cyan-400/20 text-cyan-400 text-xs font-black shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all',
            input: 'bg-white/[0.05] border border-white/10 text-white placeholder-white/20 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-cyan-400/60 transition-all',
            inputField: 'w-full bg-white/[0.05] border border-white/10 text-white placeholder-white/20 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-cyan-400/60 transition-all',
            textarea: 'w-full bg-white/[0.05] border border-white/10 text-white placeholder-white/20 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-cyan-400/60 transition-all resize-none',
            footer: 'mt-24 border-t border-white/5 bg-white/[0.02] backdrop-blur-3xl',
            footerText: 'text-white/20 text-[10px] font-bold uppercase tracking-widest',
            formCard: 'bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 md:p-16 shadow-2xl',
            formLabel: 'text-white/20 text-[10px] font-black uppercase tracking-[0.2em]',
            formTitle: 'text-4xl font-black text-white mb-2',
        };
        case 'premium': return {
            wrapper: 'min-h-screen bg-[#050508] text-white selection:bg-amber-500/30',
            nav: 'bg-[#050508]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50',
            heroText: 'text-white text-5xl md:text-8xl font-black tracking-tight leading-[0.9] italic uppercase',
            heroSubText: 'text-slate-500 text-lg md:text-xl font-light tracking-wide max-w-xl',
            heroAlign: 'text-left items-start',
            heroBtnOutline: 'border border-amber-500/50 text-amber-500 hover:bg-amber-500/10 font-black tracking-[0.2em] uppercase text-xs transition-all px-10 py-5 rounded-sm',
            sectionTitle: 'text-white font-black text-3xl tracking-tighter uppercase italic',
            card: 'bg-[#0a0a0f] border border-white/5 rounded-none overflow-hidden hover:border-amber-500/30 transition-all duration-700 shadow-2xl',
            cardTitle: 'text-white font-black text-xl uppercase tracking-tighter',
            cardSub: 'text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]',
            cardBadge: 'bg-amber-500/10 text-amber-500 text-[10px] font-black px-3 py-1 border border-amber-500/20 uppercase tracking-tighter',
            cardBtnDetail: 'flex-1 bg-white/5 text-white text-[10px] font-black uppercase tracking-widest py-4 hover:bg-white/10 transition-all border border-white/5',
            cardBtnWa: 'flex-1 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest py-4 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20',
            filterPill: 'px-6 py-2.5 rounded-none border border-white/10 bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all',
            filterPillActive: 'px-6 py-2.5 rounded-none bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20',
            input: 'bg-[#0a0a0f] border border-white/10 text-white placeholder-slate-700 rounded-none px-6 py-4 text-sm focus:outline-none focus:border-amber-500/50 transition-all',
            inputField: 'w-full bg-[#0a0a0f] border border-white/10 text-white placeholder-slate-700 rounded-none px-6 py-4 text-sm focus:outline-none focus:border-amber-500/50 transition-all',
            textarea: 'w-full bg-[#0a0a0f] border border-white/10 text-white placeholder-slate-700 rounded-none px-6 py-4 text-sm focus:outline-none focus:border-amber-500/50 transition-all resize-none',
            footer: 'mt-32 border-t border-white/5 bg-black',
            footerText: 'text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]',
            formCard: 'bg-[#0a0a0f] border border-white/5 rounded-none p-12 md:p-24 shadow-2xl',
            formLabel: 'text-slate-700 text-[10px] font-black uppercase tracking-[0.4em]',
            formTitle: 'text-6xl font-black text-white mb-4 uppercase tracking-tighter italic',
        };
        case 'bold': return {
            wrapper: 'min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-500/30',
            nav: 'bg-slate-950 border-b-4 border-emerald-500 sticky top-0 z-50 shadow-2xl',
            heroText: 'text-white text-5xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85]',
            heroSubText: 'text-slate-400 text-lg md:text-xl font-medium mt-4',
            heroAlign: 'text-left items-start',
            heroBtnOutline: 'border-4 border-white text-white hover:bg-white hover:text-black font-black uppercase transition-all px-10 py-5 text-lg',
            sectionTitle: 'text-white font-black text-6xl italic uppercase tracking-tighter',
            card: 'bg-slate-900 border-4 border-slate-800 rounded-none overflow-hidden hover:border-emerald-500 transition-all duration-300',
            cardTitle: 'text-white font-black text-2xl uppercase tracking-tight italic',
            cardSub: 'text-emerald-500 text-xs font-black uppercase tracking-widest',
            cardBadge: 'bg-slate-800 text-white text-[10px] font-black px-4 py-1 uppercase tracking-widest',
            cardBtnDetail: 'flex-1 border-4 border-slate-700 text-white text-sm font-black uppercase py-4 hover:border-white transition-all text-center',
            cardBtnWa: 'flex-1 bg-emerald-500 text-slate-950 text-sm font-black uppercase py-4 hover:bg-emerald-400 transition-all text-center shadow-[0_0_30px_rgba(16,185,129,0.3)]',
            filterPill: 'px-8 py-4 rounded-none border-4 border-slate-800 bg-transparent text-white text-sm font-black uppercase hover:border-white transition-all',
            filterPillActive: 'px-8 py-4 rounded-none bg-emerald-500 text-slate-950 text-sm font-black uppercase transition-all',
            input: 'bg-slate-900 border-4 border-slate-800 text-white placeholder-slate-700 rounded-none px-6 py-5 text-base font-bold focus:outline-none focus:border-emerald-500 transition-all',
            inputField: 'w-full bg-slate-900 border-4 border-slate-800 text-white placeholder-slate-700 rounded-none px-6 py-5 text-base font-bold focus:outline-none focus:border-emerald-500 transition-all',
            textarea: 'w-full bg-slate-900 border-4 border-slate-800 text-white placeholder-slate-700 rounded-none px-6 py-5 text-base font-bold focus:outline-none focus:border-emerald-500 transition-all resize-none',
            footer: 'mt-32 bg-black border-t-8 border-emerald-500 py-16',
            footerText: 'text-slate-500 font-black uppercase tracking-[0.4em]',
            formCard: 'bg-slate-900 border-8 border-slate-800 rounded-none p-12 md:p-24 shadow-2xl',
            formLabel: 'text-emerald-500 text-sm font-black uppercase tracking-widest',
            formTitle: 'text-7xl font-black text-white mb-6 uppercase italic leading-none',
        };
        case 'luxury': return {
            wrapper: 'min-h-screen bg-[#0f0e0c] text-[#d4af37] font-serif selection:bg-[#d4af37]/20',
            nav: 'bg-[#0f0e0c]/95 backdrop-blur-xl border-b border-[#d4af37]/10 sticky top-0 z-50',
            heroText: 'text-[#d4af37] text-6xl md:text-8xl font-light uppercase tracking-[0.3em] leading-tight',
            heroSubText: 'text-[#d4af37]/40 text-lg md:text-2xl font-light tracking-[0.4em] mt-8 italic',
            heroAlign: 'text-center items-center',
            heroBtnOutline: 'border border-[#d4af37]/40 text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0f0e0c] uppercase tracking-[0.5em] text-[10px] transition-all px-12 py-6 rounded-none',
            sectionTitle: 'text-[#d4af37] font-extralight text-5xl uppercase tracking-[0.6em] text-center',
            card: 'bg-[#1a1814] border border-[#d4af37]/5 overflow-hidden hover:border-[#d4af37]/30 transition-all duration-1000 shadow-2xl',
            cardTitle: 'text-[#d4af37] font-serif text-2xl tracking-widest uppercase',
            cardSub: 'text-[#d4af37]/30 text-[10px] uppercase tracking-[0.5em] italic',
            cardBadge: 'border border-[#d4af37]/10 text-[#d4af37]/60 text-[9px] px-4 py-1.5 uppercase tracking-widest',
            cardBtnDetail: 'flex-1 border border-[#d4af37]/10 text-[#d4af37]/50 text-[10px] uppercase tracking-[0.4em] py-5 hover:bg-[#d4af37]/5 transition-all text-center',
            cardBtnWa: 'flex-1 bg-[#d4af37] text-[#0f0e0c] text-[10px] font-bold uppercase tracking-[0.4em] py-5 hover:bg-[#b8962d] transition-all text-center shadow-[0_10px_30px_rgba(212,175,55,0.15)]',
            filterPill: 'px-10 py-4 bg-transparent border border-[#d4af37]/10 text-[#d4af37]/40 text-[10px] font-bold uppercase tracking-[0.5em] hover:border-[#d4af37]/40 transition-all',
            filterPillActive: 'px-10 py-4 bg-[#d4af37] text-[#0f0e0c] text-[10px] font-bold uppercase tracking-[0.5em] transition-all shadow-2xl',
            input: 'bg-transparent border-b border-[#d4af37]/20 text-[#d4af37] placeholder-[#d4af37]/20 rounded-none px-2 py-6 text-lg focus:outline-none focus:border-[#d4af37] transition-all',
            inputField: 'w-full bg-transparent border-b border-[#d4af37]/20 text-[#d4af37] placeholder-[#d4af37]/20 rounded-none px-2 py-6 text-lg focus:outline-none focus:border-[#d4af37] transition-all',
            textarea: 'w-full bg-transparent border-b border-[#d4af37]/20 text-[#d4af37] placeholder-[#d4af37]/20 rounded-none px-2 py-6 text-lg focus:outline-none focus:border-[#d4af37] transition-all resize-none',
            footer: 'mt-40 bg-black border-t border-[#d4af37]/5 py-24',
            footerText: 'text-[#d4af37]/20 text-[10px] uppercase tracking-[0.6em]',
            formCard: 'bg-[#1a1814] border border-[#d4af37]/5 rounded-none p-16 md:p-32 shadow-2xl',
            formLabel: 'text-[#d4af37]/30 text-[9px] font-bold uppercase tracking-[0.6em]',
            formTitle: 'text-5xl font-extralight text-[#d4af37] mb-12 uppercase tracking-[0.4em] leading-relaxed',
        };
        case 'modern': return {
            wrapper: 'min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-500/10',
            nav: 'bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm',
            heroText: 'text-slate-950 text-5xl md:text-7xl font-black tracking-tight leading-[1.05]',
            heroSubText: 'text-slate-600 text-lg md:text-xl font-medium mt-6 max-w-2xl',
            heroAlign: 'text-center items-center',
            heroBtnOutline: 'bg-slate-950 text-white hover:bg-slate-800 font-bold px-10 py-4.5 rounded-2xl transition-all shadow-xl shadow-slate-900/20',
            sectionTitle: 'text-slate-900 font-black text-4xl tracking-tight',
            card: 'bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:shadow-[0_30px_70px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-500',
            cardTitle: 'text-slate-900 font-bold text-xl tracking-tight',
            cardSub: 'text-slate-400 font-bold text-[10px] uppercase tracking-widest',
            cardBadge: 'bg-slate-100 text-slate-600 text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider',
            cardBtnDetail: 'flex-1 bg-white border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl py-3.5 hover:bg-slate-50 transition-all text-center',
            cardBtnWa: 'flex-1 bg-blue-600 text-white text-sm font-bold rounded-2xl py-3.5 hover:bg-blue-700 transition-all text-center shadow-lg shadow-blue-600/20',
            filterPill: 'px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-500 text-sm font-bold hover:bg-slate-100 transition-all',
            filterPillActive: 'px-6 py-3 rounded-2xl bg-slate-950 text-white text-sm font-bold transition-all shadow-xl shadow-slate-950/20',
            input: 'bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all',
            inputField: 'w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all',
            textarea: 'w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all resize-none',
            footer: 'mt-32 bg-white border-t border-slate-200 py-16',
            footerText: 'text-slate-400 text-xs font-bold uppercase tracking-widest',
            formCard: 'bg-white border border-slate-100 rounded-[48px] p-12 md:p-20 shadow-2xl',
            formLabel: 'text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2',
            formTitle: 'text-5xl font-black text-slate-950 mb-4 tracking-tight',
        };
        default: return { // classic
            wrapper: `min-h-screen ${profile?.website_card_style === 'square' ? 'rounded-none' : ''} ${profile?.website_theme === 'glass' ? '' : 'bg-[#f8fafc] text-slate-900'}`,
            nav: 'bg-white/80 backdrop-blur-2xl border-b border-slate-100/50 sticky top-0 z-50 shadow-sm transition-all',
            heroText: 'text-slate-900 text-5xl md:text-7xl font-black tracking-tight leading-[1.05] text-center',
            heroSubText: 'text-slate-600 text-lg md:text-xl font-medium mt-4 max-w-2xl text-center mx-auto',
            heroAlign: 'text-center items-center justify-center',
            heroBtnOutline: 'border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold transition-all shadow-sm bg-white',
            sectionTitle: 'text-slate-900 font-black text-3xl md:text-4xl tracking-tight leading-none',
            card: `bg-white border border-slate-100 ${profile?.website_card_style === 'square' ? 'rounded-none' : 'rounded-[24px]'} overflow-hidden shadow-[0_10px_28px_rgba(15,23,42,0.03)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-all duration-300`,
            cardTitle: 'text-slate-900 font-bold text-xl tracking-tight',
            cardSub: 'text-slate-400 font-bold text-[10px] uppercase tracking-widest',
            cardBadge: 'bg-slate-50 text-slate-600 text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider border border-slate-100',
            cardBtnDetail: 'hidden',
            cardBtnWa: 'flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-700 text-xs font-bold rounded-xl px-4 py-2 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all text-center',
            filterPill: 'px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all shadow-sm',
            filterPillActive: 'px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold shadow-lg shadow-slate-900/20 transition-all border border-slate-900',
            input: 'bg-white border-2 border-slate-100 text-slate-900 placeholder-slate-400 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-emerald-500 transition-all shadow-sm',
            inputField: 'w-full bg-white border-2 border-slate-100 text-slate-900 placeholder-slate-400 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-emerald-500 transition-all',
            textarea: 'w-full bg-white border-2 border-slate-100 text-slate-900 placeholder-slate-400 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-emerald-500 transition-all resize-none',
            footer: 'mt-24 bg-slate-900 border-t border-slate-800 pt-16 pb-8',
            footerText: 'text-slate-400 text-[11px] font-bold uppercase tracking-widest',
            formCard: `bg-white ${profile?.website_card_style === 'square' ? 'rounded-none' : 'rounded-[32px]'} border border-slate-100 p-8 md:p-14 shadow-[0_20px_50px_rgba(0,0,0,0.05)]`,
            formLabel: 'text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5 block',
            formTitle: 'text-4xl font-black text-slate-900 mb-2 tracking-tight',
        };
    }
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
                <h3 className={`text-2xl font-bold mb-1 ${theme === 'classic' ? 'text-stone-900 pb-3 border-b-4' : theme === 'glass' ? 'text-white' : 'text-white uppercase tracking-widest'}`}
                    style={theme === 'classic' ? { borderColor: primary, fontFamily: "'Fraunces', Georgia, serif" } : {}}>
                    {title}
                </h3>
                <p className={`text-sm ${theme === 'classic' ? 'text-stone-500' : 'text-white/60'}`}>
                    {vehicles.length} veículo{vehicles.length !== 1 ? 's' : ''}
                </p>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6`}>
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
                            theme === 'glass' ? 'bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/20 text-white' :
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
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-colors shadow-lg"
                style={{ backgroundColor: sent ? '#16a34a' : profile.website_primary_color || '#10b981' }}>
                {sent ? <><Send size={16} /> Mensagem enviada!</> : <><MessageCircle size={16} /> Enviar via WhatsApp</>}
            </button>
        </form>
    );
};

// ─── Premium Card ─────────────────────────────────────────────────────────────

const VehicleCard: React.FC<{ vehicle: Vehicle; slug: string; tc: TC; profile: PublicProfile }> = ({ vehicle, slug, tc, profile }) => {
    const waMsg = profile.preset_messages?.[0] 
        ? replaceVariables(profile.preset_messages[0], { vehicle, profile })
        : `Olá! Tenho interesse no ${vehicle.brand} ${vehicle.model} ${vehicle.year}. Poderia me dar mais informações?`;
    const waUrl = buildWaUrl(profile.website_whatsapp || '', waMsg);
    
    return (
        <Link to={`/site/${slug}/veiculo/${vehicle.id}`} className="block h-full">
            <div className={tc.card + " flex flex-col h-full group"}>
                <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
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
                <div className="p-6 flex flex-col flex-1">
                    <div className="mb-4">
                        <p className={tc.cardSub}>{vehicle.type}</p>
                        <h3 className={tc.cardTitle}>{vehicle.brand} {vehicle.model}</h3>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                        <span className={tc.cardBadge}>{formatKm(vehicle.mileage)}</span>
                        <span className={tc.cardBadge}>{vehicle.transmission.split(' ')[0]}</span>
                        <span className={tc.cardBadge}>{vehicle.engine}</span>
                    </div>

                    <div className="mt-auto pt-4 border-t border-white/5 flex items-end justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Preço</p>
                            <p className="text-2xl font-black tracking-tight" style={profile.website_theme === 'classic' ? { color: profile.website_primary_color } : undefined}>
                                {formatPrice(vehicle.price)}
                            </p>
                        </div>
                        {profile.website_whatsapp && (
                            <a href={waUrl} target="_blank" rel="noopener noreferrer" className={tc.cardBtnWa + " !flex-initial px-4"} onClick={e => e.stopPropagation()}>
                                <MessageCircle size={18} />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </Link>
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

    const tc = useMemo(() => getTC(profile?.website_theme || 'classic', profile?.website_primary_color || '#10b981', profile || undefined), [profile?.website_theme, profile?.website_primary_color, profile]);
    const theme = profile?.website_theme || 'classic';
    const primary = profile?.website_primary_color || '#10b981';
    const secondary = profile?.website_secondary_color || '#0891b2';

    const mainWaMsg = profile?.preset_messages?.[0] ? replaceVariables(profile.preset_messages[0], { profile }) : `Olá! Vim pelo site ${profile?.company_name}.`;
    const mainWaUrl = profile?.website_whatsapp ? buildWaUrl(profile.website_whatsapp, mainWaMsg) : '#';

    const types = useMemo(() => {
        const t = Array.from(new Set(vehicles.map(v => v.type)));
        return ['Todos', ...t];
    }, [vehicles]);

    const heroStyle: React.CSSProperties = {
        background: profile?.website_use_gradient
            ? `linear-gradient(135deg, ${primary}, ${secondary})`
            : primary
    };

    // Dynamic Logo Logic
    const displayLogo = useMemo(() => {
        if (profile?.website_branding?.enabled) {
            const isDarkTheme = ['glass', 'premium', 'bold', 'luxury'].includes(theme);
            return isDarkTheme 
                ? (profile.website_branding.logo_dark || profile.website_branding.logo_primary || profile.company_logo)
                : (profile.website_branding.logo_primary || profile.company_logo);
        }
        return profile?.company_logo;
    }, [profile, theme]);

    const seoTitle = profile?.website_optimization?.meta_title || `${profile?.company_name} — Veículos de Procedência`;
    const seoDesc = profile?.website_optimization?.meta_description || `Confira nosso estoque de veículos em ${profile?.website_city || 'sua região'}. Qualidade e transparência.`;

    // Reset showAll when filters change
    useEffect(() => {
        setShowAll(false);
    }, [activeType, search, sortOrder]);

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
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
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
                <meta property="og:title" content={seoTitle} />
                <meta property="og:description" content={seoDesc} />
                <meta name="robots" content="index, follow" />
            </Helmet>

            {/* Nav */}
            {profile.website_theme === 'classic' ? (
                <nav className={tc.nav}>
                    <div className="max-w-[1250px] mx-auto px-4 h-20 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {displayLogo
                                ? <img src={displayLogo} alt={profile.company_name} className="h-16 w-auto object-contain" />
                                : <span className="text-3xl font-black tracking-tight">{profile.company_name}</span>
                            }
                            {profile.website_city && (
                                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-bold bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200 ml-2">
                                    <MapPin size={12} className="text-slate-400" /> {profile.website_city}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-8">
                            <div className="hidden md:flex items-center gap-8">
                                <a href="#estoque" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Estoque</a>
                                {profile.website_about_text && <a href="#sobre" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Sobre Nós</a>}
                                <a href="#contato" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Contato</a>
                            </div>
                            {profile.website_whatsapp && (
                                <a href={mainWaUrl} target="_blank" rel="noopener noreferrer"
                                    className={`flex items-center gap-2 text-white text-sm font-bold px-6 py-3 transition-all hover:-translate-y-0.5 hover:shadow-lg ${profile?.website_card_style === 'square' ? 'rounded-none' : 'rounded-xl'}`}
                                    style={{ backgroundColor: primary }}>
                                    <MessageCircle size={16} />
                                    <span className="hidden sm:inline">WhatsApp</span>
                                </a>
                            )}
                        </div>
                    </div>
                </nav>
            ) : (
                <nav className={tc.nav}>
                    <div className="max-w-[1250px] mx-auto px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {displayLogo
                                ? <img src={displayLogo} alt={profile.company_name} className="h-14 w-auto object-contain" />
                                : <span className="text-2xl font-extrabold">{profile.company_name}</span>
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
            )}

            {/* Hero */}
            {profile.website_theme === 'glass' ? (
                <section className="relative overflow-hidden pb-32" style={{ minHeight: '520px', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))' }}>
                    {profile.website_hero_image && (
                        <>
                            <img src={profile.website_hero_image} alt="Hero" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                            <div className="absolute inset-0 backdrop-blur-3xl" />
                        </>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-purple-500/5" />
                    <div className="relative z-10 max-w-[1250px] mx-auto px-4 h-full flex items-center justify-center">
                        <div className="text-center max-w-2xl">
                            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 drop-shadow-lg">
                                {profile.website_hero_text || `Explore nossa coleção`}
                            </h1>
                            {profile.website_hero_subtitle && (
                                <p className="text-xl text-white/80 drop-shadow mb-8">
                                    {profile.website_hero_subtitle}
                                </p>
                            )}
                            <p className="text-white/60 text-sm mb-8">
                                {filtered.length > 0 ? `${filtered.length} veículo${filtered.length > 1 ? 's' : ''} disponível${filtered.length > 1 ? 's' : ''}` : 'Confira nosso estoque'}
                            </p>
                        </div>
                    </div>
                    {/* Floating Glass Search Panel */}
                    <div className="absolute -bottom-16 left-0 right-0 z-20 max-w-4xl mx-auto px-4 w-full">
                        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-6 shadow-2xl">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="lg:col-span-2">
                                    <label className="text-xs font-bold text-white/70 uppercase mb-2 block">Buscar</label>
                                    <div className="relative">
                                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Marca ou modelo..."
                                            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 backdrop-blur-sm" />
                                    </div>
                                </div>
                                {types.length > 1 && (
                                    <div>
                                        <label className="text-xs font-bold text-white/70 uppercase mb-2 block">Tipo</label>
                                        <select value={activeType} onChange={e => setActiveType(e.target.value)} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm">
                                            {types.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="text-xs font-bold text-white/70 uppercase mb-2 block">Ordenar</label>
                                    <select value={sortOrder} onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm">
                                        <option value="asc" className="bg-slate-900">Menor preço</option>
                                        <option value="desc" className="bg-slate-900">Maior preço</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            ) : profile.website_theme === 'premium' ? (
                <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-[#050508]">
                    <div className="absolute inset-0 flex flex-col lg:flex-row">
                        <div className="w-full lg:w-1/2 h-full bg-[#050508] relative z-10 flex flex-col justify-center px-8 md:px-20 py-24 lg:py-0">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            >
                                <p className="text-amber-500 font-black text-[10px] uppercase tracking-[0.4em] mb-6">
                                    {profile.website_city || 'Coleção Privada'}
                                </p>
                                <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter mb-8">
                                    {profile.website_hero_text || 'O Padrão Ouro em Veículos'}
                                </h1>
                                {profile.website_hero_subtitle && (
                                    <p className="text-slate-400 text-lg md:text-xl font-light leading-relaxed max-w-md mb-10">
                                        {profile.website_hero_subtitle}
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-4">
                                    <a href="#estoque" 
                                        className="bg-amber-500 text-black px-10 py-5 rounded-sm font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-400 transition-all shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                                        Ver Coleção
                                    </a>
                                    {profile.website_whatsapp && (
                                        <a href={mainWaUrl} target="_blank" rel="noopener noreferrer"
                                            className="border border-white/10 text-white px-10 py-5 rounded-sm font-black text-xs uppercase tracking-[0.2em] hover:bg-white/5 transition-all">
                                            Agendar Visita
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                        <div className="w-full lg:w-1/2 h-[50vh] lg:h-full relative overflow-hidden">
                            {profile.website_hero_image ? (
                                <motion.img 
                                    initial={{ scale: 1.2, opacity: 0 }}
                                    whileInView={{ scale: 1, opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    src={profile.website_hero_image} 
                                    alt="Hero" 
                                    className="w-full h-full object-cover" 
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                    <Car size={120} className="text-slate-800 opacity-20" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-r from-[#050508] via-transparent to-transparent hidden lg:block" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-transparent to-transparent lg:hidden" />
                        </div>
                    </div>
                </section>
            ) : profile.website_theme === 'classic' ? (
                <>
                <section className="relative z-20 pb-24"
                    style={{
                        minHeight: '500px',
                        backgroundColor: profile?.website_branding?.dark_mode ? '#0f172a' : '#0f172a' // Always dark background for the hero mask
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
                    <div className="absolute -bottom-8 left-0 right-0 z-20 max-w-[800px] mx-auto px-4 w-full">
                        <div className={`bg-white ${profile?.website_card_style === 'square' ? 'rounded-none' : 'rounded-2xl'} p-2 md:p-3 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col md:flex-row gap-2 border border-slate-100`}>
                            <div className="flex-1 relative flex items-center">
                                <Search size={20} className="absolute left-4 text-slate-400" />
                                <input value={search} onChange={e => setSearch(e.target.value)} 
                                    onKeyDown={e => e.key === 'Enter' && scrollToStock(e)}
                                    placeholder="Busque por marca ou modelo..."
                                    className="w-full pl-12 pr-4 py-4 md:py-3 bg-transparent text-slate-900 font-bold placeholder-slate-400 focus:outline-none" />
                            </div>
                            <div className="w-full md:w-auto flex items-center gap-2">
                                <a href="#estoque" onClick={scrollToStock} className={`flex-1 md:flex-none px-8 py-4 md:py-3 ${profile?.website_card_style === 'square' ? 'rounded-none' : 'rounded-xl'} text-white font-bold transition-all text-center cursor-pointer`} style={{ backgroundColor: primary }}>
                                    Buscar Ofertas
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                <div className={`${profile.website_theme === 'premium' ? 'bg-[#0a0a0f] border-y border-white/5' : 'bg-white border-y border-slate-100'}`}>
                    <div className="max-w-[1250px] mx-auto px-4 pt-16 pb-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { active: profile.website_diff1_active ?? true, icon: profile.website_diff1_icon || 'Shield', label: profile.website_diff1_title || 'Veículos Revisados', sub: profile.website_diff1_sub || 'Inspeção completa' },
                            { active: profile.website_diff2_active ?? true, icon: profile.website_diff2_icon || 'Award', label: profile.website_diff2_title || 'Garantia Inclusa', sub: profile.website_diff2_sub || 'Pós-venda' },
                            { active: profile.website_diff3_active ?? true, icon: profile.website_diff3_icon || 'CreditCard', label: profile.website_diff3_title || 'Financiamento', sub: profile.website_diff3_sub || 'Até 60x' },
                            { active: profile.website_diff4_active ?? true, icon: profile.website_diff4_icon || 'RefreshCw', label: profile.website_diff4_title || 'Troca Aceita', sub: profile.website_diff4_sub || 'Avaliação grátis' },
                        ].filter(item => item.active).map((item, idx) => {
                            return (
                                <div key={idx} className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${profile.website_theme === 'premium' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-slate-100 text-slate-900 border border-slate-200'}`}
                                        style={profile.website_theme === 'classic' ? { backgroundColor: primary + '15', color: primary, borderColor: primary + '30' } : {}}>
                                        <DynamicIcon name={item.icon} size={22} />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-black tracking-tight ${profile.website_theme === 'premium' ? 'text-white' : 'text-slate-900'}`}>{item.label}</p>
                                        <p className={`text-[11px] font-medium ${profile.website_theme === 'premium' ? 'text-slate-500' : 'text-slate-500'}`}>{item.sub}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                </>
            ) : (
                <section className="relative flex items-center justify-center overflow-hidden" style={{ minHeight: '500px' }}>
                    {profile.website_hero_image ? (
                        <>
                            <img src={profile.website_hero_image} alt="Hero" className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50" />
                        </>
                    ) : (
                        <div className={`absolute inset-0 ${profile.website_theme === 'glass' ? 'bg-gradient-to-r from-indigo-900/80 to-purple-900/80' : profile.website_theme === 'premium' ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/20' : ''}`} style={!profile.website_hero_image ? heroStyle : undefined} />
                    )}
                    <div className={`relative z-10 max-w-[1250px] mx-auto px-4 py-16 space-y-4 w-full flex flex-col ${tc.heroAlign}`}>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg">
                            {profile.website_hero_text || `Bem-vindo à ${profile.company_name}`}
                        </h1>
                        {profile.website_hero_subtitle && (
                            <p className="text-white/80 text-lg drop-shadow">
                                {profile.website_hero_subtitle}
                            </p>
                        )}
                        <p className="text-white/60 text-sm">
                            {filtered.length > 0 ? `${filtered.length} veículo${filtered.length > 1 ? 's' : ''} disponíve${filtered.length > 1 ? 'is' : 'l'} agora` : 'Confira nosso estoque'}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                            <a href="#estoque" className="px-7 py-3.5 rounded-xl text-sm font-bold text-white transition-colors hover:opacity-90 shadow-lg" style={{ backgroundColor: profile.website_theme === 'premium' ? '#eab308' : (profile.website_theme === 'glass' ? 'rgba(255,255,255,0.25)' : primary) }}>
                                Ver Estoque
                            </a>
                            {profile.website_whatsapp && (
                                <a href={mainWaUrl} target="_blank" rel="noopener noreferrer" className="px-7 py-3.5 rounded-xl text-sm font-bold border-2 border-white text-white hover:bg-white/15 transition-colors shadow-lg">
                                    Falar no WhatsApp
                                </a>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* MISSÃO / VISÃO / VALORES */}
            {profile.website_sections?.show_mission_vision_values && (profile.website_sections.mission || profile.website_sections.vision || profile.website_sections.values) && (
                <section className="max-w-[1250px] mx-auto px-4 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {profile.website_sections.mission && (
                            <div className={`p-8 rounded-2xl ${profile.website_theme === 'classic' ? 'bg-white shadow-lg border border-slate-100' : profile.website_theme === 'glass' ? 'bg-white/10 backdrop-blur-lg border border-white/20' : 'bg-slate-800 border border-slate-700'}`}>
                                <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${profile.website_theme === 'classic' ? 'text-slate-500' : 'text-white/60'}`} style={profile.website_theme === 'classic' ? { color: primary } : undefined}>Missão</p>
                                <p className={profile.website_theme === 'classic' ? 'text-slate-900 text-lg font-bold leading-relaxed' : 'text-white text-lg font-bold'}>
                                    {profile.website_sections.mission}
                                </p>
                            </div>
                        )}
                        {profile.website_sections.vision && (
                            <div className={`p-8 rounded-2xl ${profile.website_theme === 'classic' ? 'bg-white shadow-lg border border-slate-100' : profile.website_theme === 'glass' ? 'bg-white/10 backdrop-blur-lg border border-white/20' : 'bg-slate-800 border border-slate-700'}`}>
                                <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${profile.website_theme === 'classic' ? 'text-slate-500' : 'text-white/60'}`} style={profile.website_theme === 'classic' ? { color: primary } : undefined}>Visão</p>
                                <p className={profile.website_theme === 'classic' ? 'text-slate-900 text-lg font-bold leading-relaxed' : 'text-white text-lg font-bold'}>
                                    {profile.website_sections.vision}
                                </p>
                            </div>
                        )}
                        {profile.website_sections.values && (
                            <div className={`p-8 rounded-2xl ${profile.website_theme === 'classic' ? 'bg-white shadow-lg border border-slate-100' : profile.website_theme === 'glass' ? 'bg-white/10 backdrop-blur-lg border border-white/20' : 'bg-slate-800 border border-slate-700'}`}>
                                <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${profile.website_theme === 'classic' ? 'text-slate-500' : 'text-white/60'}`} style={profile.website_theme === 'classic' ? { color: primary } : undefined}>Valores</p>
                                <p className={profile.website_theme === 'classic' ? 'text-slate-900 text-lg font-bold leading-relaxed' : 'text-white text-lg font-bold'}>
                                    {profile.website_sections.values}
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Inventory */}
            <section id="estoque" className={`max-w-[1250px] mx-auto px-4 py-16 ${profile.website_theme === 'classic' ? 'pt-20' : profile.website_theme === 'glass' ? 'pt-24' : ''}`}>
                {/* Premium layout */}
                {profile.website_theme === 'premium' ? (
                    <div className="space-y-12">
                        <div className="text-center max-w-2xl mx-auto">
                            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4">Nossa Coleção</p>
                            <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">Veículos Selecionados</h2>
                            <p className="text-slate-400 text-lg">
                                {filtered.length} opção{filtered.length !== 1 ? 's' : ''} disponível{filtered.length !== 1 ? 's' : ''}
                            </p>
                        </div>

                        {filtered.length === 0 ? (
                            <div className="text-center py-20 opacity-40">
                                <Car size={48} className="mx-auto mb-3 opacity-20" />
                                <p className="font-medium text-white">Nenhum veículo encontrado</p>
                                <p className="text-sm text-slate-500 mt-1">Tente outros filtros.</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {displayedVehicles.map((vehicle, i) => (
                                        <motion.div 
                                            key={vehicle.id}
                                            initial={{ opacity: 0, y: 30 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, margin: "-50px" }}
                                            transition={{ duration: 0.5, delay: (i % 8) * 0.1 }}
                                        >
                                            <VehicleCard vehicle={vehicle} slug={slug!} tc={tc} profile={profile} />
                                        </motion.div>
                                    ))}
                                </div>
                                {!showAll && filtered.length > 8 && (
                                    <div className="text-center mt-16">
                                        <button onClick={() => setShowAll(true)}
                                            className="px-8 py-4 rounded text-white font-bold text-sm uppercase tracking-wider transition-all hover:opacity-80"
                                            style={{ backgroundColor: primary || '#10b981' }}>
                                            Ver todos os {filtered.length} veículos
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : profile.website_theme === 'glass' ? (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-3xl font-black text-white mb-2">Coleção Disponível</h2>
                            <p className="text-white/60 text-sm">
                                {filtered.length} veículo{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
                            </p>
                        </div>

                        {filtered.length === 0 ? (
                            <div className="text-center py-20 opacity-40">
                                <Car size={48} className="mx-auto mb-3 opacity-20" />
                                <p className="font-medium text-white">Nenhum veículo encontrado</p>
                                <p className="text-sm text-white/50 mt-1">Tente outros filtros.</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
                                    <div className="text-center mt-12">
                                        <button onClick={() => setShowAll(true)}
                                            className="px-8 py-4 rounded-lg font-bold text-white text-lg bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/20 hover:border-white/40 transition-all">
                                            Ver todos os {filtered.length} veículos
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : profile.website_theme !== 'classic' ? (
                    <div className="space-y-6">
                        {/* Top Sticky Glass Filter Bar */}
                        <div className={`sticky top-16 z-40 -mx-4 px-4 py-4 ${profile.website_theme === 'glass' ? 'bg-white/[0.05] backdrop-blur-[12px] backdrop-saturate-[180%] border-y border-white/[0.125] shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]' : 'bg-[#050508]/80 backdrop-blur-xl border-y border-white/5'}`}>
                            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                {/* Search */}
                                <div className="relative flex-1 min-w-[240px]">
                                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
                                    <input value={search} onChange={e => setSearch(e.target.value)}
                                        placeholder="Buscar marca ou modelo..."
                                        className={`${tc.input} w-full pl-11`} />
                                </div>

                                {/* Type filter pills */}
                                {types.length > 1 && (
                                    <div className="flex flex-wrap gap-2">
                                        {types.map(type => (
                                            <button key={type} onClick={() => setActiveType(type)}
                                                className={`whitespace-nowrap transition-all ${activeType === type ? tc.filterPillActive : tc.filterPill}`}>
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Sort */}
                                <div className="relative lg:ml-auto">
                                    <select value={sortOrder} onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
                                        className={`${tc.input} pr-9 appearance-none cursor-pointer`}>
                                        <option value="asc">Menor preço</option>
                                        <option value="desc">Maior preço</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-2 pb-4">
                            <p className={`text-sm mb-5 ${tc.sectionTitle}`}>
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
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                        {displayedVehicles.map((vehicle, i) => (
                                            <motion.div 
                                                key={vehicle.id}
                                                initial={{ opacity: 0, y: 30 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true, margin: "-50px" }}
                                                transition={{ duration: 0.5, delay: (i % 6) * 0.1 }}
                                            >
                                                <Link to={`/site/${slug}/veiculo/${vehicle.id}`}>
                                                    <VehicleCard vehicle={vehicle} slug={slug!} tc={tc} profile={profile} />
                                                </Link>
                                            </motion.div>
                                        ))}
                                    </div>
                                    {!showAll && filtered.length > 8 && (
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
                    // Redesigned Classic layout
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
                )}
            </section>



            {/* CTA Banner */}
            {profile.website_whatsapp && (
                profile.website_theme === 'classic' ? (
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
                ) : (
                    <section className="max-w-[1250px] mx-auto px-4 pb-8">
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
                )
            )}

            {/* Contact Form + Google Maps */}
            {(profile.website_sections?.show_contact_form && profile.website_whatsapp) || (profile.website_sections?.show_maps && profile.website_google_maps) ? (
                <section id="contato" className="max-w-[1250px] mx-auto px-4 pb-8">
                    <div className={tc.formCard}>
                        <h2 className={tc.formTitle}>Entre em Contato</h2>
                        {profile.website_city && (
                            <p className="flex items-center gap-1 text-sm opacity-50 mb-5">
                                <MapPin size={13} /> {profile.website_city}
                            </p>
                        )}
                        <div className={`grid grid-cols-1 ${profile.website_sections?.show_maps && profile.website_google_maps ? 'md:grid-cols-2' : ''} gap-8`}>
                            {profile.website_sections?.show_contact_form && profile.website_whatsapp && (
                                <div>
                                    <p className="text-sm opacity-60 mb-4">Preencha o formulário e entraremos em contato pelo WhatsApp.</p>
                                    <ContactForm profile={profile} tc={tc} />
                                </div>
                            )}
                            {profile.website_sections?.show_maps && profile.website_google_maps && (
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
            ) : null}

            {/* Footer */}
            {/* Footer */}
            {profile.website_theme === 'classic' ? (
                <footer className="bg-slate-950 text-white mt-16 rounded-t-[40px] shadow-2xl">
                    <div className="max-w-[1250px] mx-auto px-4 py-16">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-12">
                            {/* Col 1: Brand & About */}
                            <div className="md:col-span-2">
                                {profile.company_logo
                                    ? <img src={profile.company_logo} alt={profile.company_name} className="h-16 w-auto object-contain mb-6 brightness-0 invert" />
                                    : <p className="text-4xl font-black mb-6 tracking-tight">{profile.company_name}</p>
                                }
                                {(profile.website_about_text || profile.website_hero_subtitle) && (
                                    <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-6 whitespace-pre-wrap">
                                        {profile.website_about_text || profile.website_hero_subtitle}
                                    </p>
                                )}
                                {/* Socials */}
                                <div className="flex gap-3">
                                    {profile.website_instagram && (
                                        <a href={`https://instagram.com/${profile.website_instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 hover:-translate-y-1 flex items-center justify-center transition-all text-sm font-bold">
                                            IG
                                        </a>
                                    )}
                                    {profile.website_facebook && (
                                        <a href={profile.website_facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 hover:-translate-y-1 flex items-center justify-center transition-all text-sm font-bold">
                                            FB
                                        </a>
                                    )}
                                    {profile.website_youtube && (
                                        <a href={profile.website_youtube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 hover:-translate-y-1 flex items-center justify-center transition-all text-sm font-bold">
                                            YT
                                        </a>
                                    )}
                                </div>
                            </div>
                            {/* Col 3: Links */}
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">Links Rápidos</p>
                                <div className="space-y-4">
                                    <a href="#estoque" className="block text-sm font-medium text-slate-400 hover:text-white hover:translate-x-1 transition-all">Ver Estoque</a>
                                    {profile.website_sections?.show_vehicle_categories && (
                                        <a href="#categorias" className="block text-sm font-medium text-slate-400 hover:text-white hover:translate-x-1 transition-all">Categorias</a>
                                    )}
                                    {profile.website_about_text && (
                                        <a href="#sobre" className="block text-sm font-medium text-slate-400 hover:text-white hover:translate-x-1 transition-all">Sobre a Loja</a>
                                    )}
                                </div>
                            </div>
                            {/* Col 4: Contato */}
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">Contato</p>
                                <div className="space-y-4">
                                    {profile.website_city && (
                                        <p className="flex items-start gap-3 text-sm font-medium text-slate-400">
                                            <MapPin size={18} className="text-slate-600 shrink-0 mt-0.5" /> 
                                            <span>{profile.website_city}</span>
                                        </p>
                                    )}
                                    {profile.website_whatsapp && (
                                        <a href={mainWaUrl} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-3 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                                            <MessageCircle size={18} className="text-slate-600 shrink-0" /> WhatsApp
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-slate-800/50 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-slate-500 text-sm font-medium">© {new Date().getFullYear()} {profile.company_name}. Todos os direitos reservados.</p>
                            <p className="text-slate-700 text-xs font-bold tracking-wider">POWERED BY NLEADS</p>
                        </div>
                    </div>
                </footer>
            ) : (
                <footer className={tc.footer}>
                    <div className="max-w-[1250px] mx-auto px-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                            <div className="md:col-span-2">
                                <h3 className="text-xl font-black text-white mb-4 tracking-tight">{profile.company_name}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-6">
                                    {profile.website_about_text ? profile.website_about_text.slice(0, 150) + '...' : 'Ajudando você a encontrar o veículo perfeito com total transparência e segurança.'}
                                </p>
                                <div className="flex items-center gap-3">
                                    {profile.website_instagram && (
                                        <a href={profile.website_instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 hover:-translate-y-1 flex items-center justify-center transition-all text-sm font-bold text-white">IG</a>
                                    )}
                                    {profile.website_facebook && (
                                        <a href={profile.website_facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 hover:-translate-y-1 flex items-center justify-center transition-all text-sm font-bold text-white">FB</a>
                                    )}
                                    {profile.website_youtube && (
                                        <a href={profile.website_youtube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 hover:-translate-y-1 flex items-center justify-center transition-all text-sm font-bold text-white">YT</a>
                                    )}
                                    {profile.website_tiktok && (
                                        <a href={profile.website_tiktok} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 hover:-translate-y-1 flex items-center justify-center transition-all text-sm font-bold text-white">TK</a>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">Links Rápidos</p>
                                <div className="space-y-4">
                                    <a href="#estoque" className="block text-sm font-medium text-slate-400 hover:text-white transition-all">Ver Estoque</a>
                                    {profile.website_about_text && <a href="#sobre" className="block text-sm font-medium text-slate-400 hover:text-white transition-all">Sobre a Loja</a>}
                                    {profile.website_terms_of_use && <a href="#termos" className="block text-sm font-medium text-slate-400 hover:text-white transition-all">Termos de Uso</a>}
                                    {profile.website_privacy_policy && <a href="#privacidade" className="block text-sm font-medium text-slate-400 hover:text-white transition-all">Política de Privacidade</a>}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">Contato</p>
                                <div className="space-y-4">
                                    {profile.website_city && (
                                        <p className="flex items-start gap-3 text-sm font-medium text-slate-400">
                                            <MapPin size={18} className="text-slate-600 shrink-0 mt-0.5" /> 
                                            <span>{profile.website_city}</span>
                                        </p>
                                    )}
                                    {profile.website_whatsapp && (
                                        <a href={mainWaUrl} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-3 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                                            <MessageCircle size={18} className="text-slate-600 shrink-0" /> WhatsApp
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-slate-500 text-sm font-medium">© {new Date().getFullYear()} {profile.company_name}. Todos os direitos reservados.</p>
                            <p className="text-slate-700 text-xs font-bold tracking-wider">POWERED BY NLEADS</p>
                        </div>
                    </div>
                </footer>
            )}

            {/* Floating WA */}
            {profile.website_whatsapp && (
                <a href={mainWaUrl} target="_blank" rel="noopener noreferrer"
                    className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-400 hover:scale-110 transition-all z-50 overflow-hidden">
                    <Lottie animationData={whatsappAnimation} loop={true} className="w-16 h-16 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </a>
            )}
        </div>
    );
};

export default PublicSiteHome;
