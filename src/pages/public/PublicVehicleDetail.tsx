import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { websiteService, PublicProfile } from '../../services/websiteService';
import { Vehicle } from '../../types';
import {
    MessageCircle, ArrowLeft, CheckCircle, XCircle,
    ChevronLeft, ChevronRight, Gauge, Fuel, Settings,
    Calendar, Palette, Car, Shield, FileText, Star, MapPin, Send, Menu, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import Lottie from 'lottie-react';
import whatsappAnimation from '../../assets/whatsapp-lottie.json';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const baseSchema = z.object({
    name: z.string().min(2, "Digite seu nome"),
    phone: z.string().min(10, "Telefone válido com DDD").refine(v => v.replace(/\D/g, '').length >= 10, "Telefone incompleto"),
});

const contactSchema = baseSchema.extend({ message: z.string().optional() });
const testDriveSchema = baseSchema.extend({ date: z.string().min(1, "Data obrigatória"), time: z.string().min(1, "Horário obrigatório") });
const financeSchema = baseSchema.extend({ entrada: z.string().optional(), parcelas: z.string().optional(), ideal: z.string().optional() });
const tradeSchema = baseSchema.extend({ modelo: z.string().optional(), ano: z.string().optional(), placa: z.string().optional() });

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const formatPrice = (n: number) => fmt.format(n);
const formatKm = (n: number) => `${new Intl.NumberFormat('pt-BR').format(n)} km`;
const PLACEHOLDER = 'https://placehold.co/800x600/e2e8f0/94a3b8?text=Sem+foto';

// ─── Mobile Menu ─────────────────────────────────────────────────────────────
const MobileMenu: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    profile: PublicProfile | null;
    primary: string;
    theme: string;
    slug: string;
}> = ({ isOpen, onClose, profile, primary, theme, slug }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-white text-slate-900 flex flex-col md:hidden"
            style={theme === 'glass' || theme === 'premium' || theme === 'bold' || theme === 'luxury' 
                ? { backgroundColor: theme === 'luxury' ? '#0f0e0c' : '#050508', color: 'white' } 
                : {}}
        >
            <div className="p-6 flex items-center justify-between border-b border-white/5">
                <span className="font-black tracking-tight">{profile?.company_name}</span>
                <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                    <X size={24} />
                </button>
            </div>
            <div className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto text-left">
                <Link to={`/site/${slug}`} onClick={onClose} className="text-2xl font-black tracking-tighter uppercase italic">Estoque</Link>
                {profile?.website_about_text && <Link to={`/site/${slug}#sobre`} onClick={onClose} className="text-2xl font-black tracking-tighter uppercase italic">Sobre Nós</Link>}
                <Link to={`/site/${slug}#contato`} onClick={onClose} className="text-2xl font-black tracking-tighter uppercase italic">Contato</Link>
                
                {profile?.website_whatsapp && (
                    <button 
                        onClick={() => {
                            const mainWaMsg = profile?.preset_messages?.[0] ? profile.preset_messages[0].replace(/\[NOME\]/gi, profile.company_name) : `Olá! Vim pelo site ${profile.company_name}.`;
                            window.open(`https://wa.me/${profile.website_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(mainWaMsg)}`, '_blank');
                            onClose();
                        }}
                        className="mt-4 w-full py-4 rounded-xl font-black text-white text-center shadow-xl"
                        style={{ backgroundColor: primary }}
                    >
                        WhatsApp
                    </button>
                )}
            </div>
            <div className="p-8 border-t border-white/5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                    © {new Date().getFullYear()} {profile?.company_name}
                </p>
            </div>
        </motion.div>
    );
};


const replaceVariables = (text: string, data: { vehicle?: Vehicle; profile?: PublicProfile }) => {
    if (!text) return '';
    return text
        .replace(/\[NOME\]/gi, data.vehicle?.model || data.profile?.company_name || '')
        .replace(/\[MARCA\]/gi, data.vehicle?.brand || '')
        .replace(/\[MODELO\]/gi, data.vehicle?.model || '')
        .replace(/\[ANO\]/gi, String(data.vehicle?.year || ''))
        .replace(/\[PRECO\]/gi, data.vehicle ? fmt.format(data.vehicle.price) : '');
};

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
            wrapper: 'min-h-screen text-white relative before:content-[""] before:fixed before:inset-0 before:bg-gradient-to-br before:from-slate-950 before:via-indigo-950 before:to-slate-900 before:-z-10 after:content-[""] after:fixed after:inset-0 after:bg-[radial-gradient(ellipse_at_top_left,rgba(56,189,248,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.15),transparent_50%)] after:-z-10 selection:bg-cyan-500/30',
            nav: 'sticky top-0 z-50 bg-white/[0.03] backdrop-blur-xl border-b border-white/[0.08]',
            backBtn: 'text-white/40 hover:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all px-4 py-2.5 md:px-6 md:py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10',
            thumbActive: 'border-2 border-cyan-400 rounded-2xl overflow-hidden cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.3)]',
            thumbInactive: 'border border-white/10 rounded-2xl overflow-hidden cursor-pointer opacity-40 hover:opacity-100 transition duration-500',
            card: 'bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-12 shadow-2xl',
            title: 'text-white',
            specLabel: 'text-white/20 text-[10px] font-black uppercase tracking-widest',
            specValue: 'text-white font-bold',
            divider: 'border-white/10',
            ctaCard: 'bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 sticky top-24 shadow-2xl',
            ctaTitle: 'text-white font-black uppercase tracking-tighter italic text-xl md:text-2xl',
            ctaBtnOutline: 'w-full py-4 md:py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2',
            badge: 'bg-white/10 border border-white/10',
            badgeText: 'text-white/80 font-bold',
            similarCard: 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:border-cyan-400/40 transition-all duration-500',
            similarTitle: 'text-white font-bold text-sm',
            similarBtn: 'mt-2 w-full text-center py-3 rounded-xl border border-white/10 bg-white/5 text-white/50 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all',
            check: 'text-cyan-400', cross: 'text-white/20',
            footer: 'mt-32 bg-white/[0.02] border-t border-white/5 py-20',
            footerText: 'text-white/20 text-[10px] font-black uppercase tracking-widest',
            formCard: 'bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl md:rounded-[40px] p-6 md:p-16',
            formLabel: 'text-white/20 text-[10px] font-black uppercase tracking-widest',
            formTitle: 'text-2xl md:text-4xl font-black text-white mb-2',
            inputField: 'w-full bg-white/[0.05] border border-white/10 text-white placeholder-white/20 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-cyan-400/60 transition-all',
            textarea: 'w-full bg-white/[0.05] border border-white/10 text-white placeholder-white/20 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-cyan-400/60 transition-all resize-none',
        };
        case 'premium': return {
            wrapper: 'min-h-screen bg-[#050508] text-white selection:bg-amber-500/30',
            nav: 'bg-[#050508]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50',
            backBtn: 'text-slate-500 hover:text-amber-500 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] transition-all',
            thumbActive: 'border-2 border-amber-500 rounded-none overflow-hidden cursor-pointer shadow-lg shadow-amber-500/20',
            thumbInactive: 'border border-white/5 rounded-none overflow-hidden cursor-pointer opacity-30 hover:opacity-100 transition duration-700',
            card: 'bg-[#0a0a0f] border border-white/5 rounded-none p-8 md:p-16 shadow-2xl',
            title: 'text-white uppercase tracking-tighter italic font-black',
            specLabel: 'text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]',
            specValue: 'text-white font-bold',
            divider: 'border-white/5',
            ctaCard: 'bg-[#0a0a0f] border border-white/5 rounded-none p-8 md:p-12 sticky top-24 shadow-2xl',
            ctaTitle: 'text-white font-black uppercase tracking-tighter italic text-2xl md:text-3xl',
            ctaBtnOutline: 'w-full py-4 md:py-5 rounded-none font-black uppercase tracking-[0.2em] text-[10px] border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2',
            badge: 'bg-amber-500/10 border border-amber-500/20',
            badgeText: 'text-amber-500 font-black uppercase text-[9px] tracking-widest',
            similarCard: 'bg-[#0a0a0f] border border-white/5 rounded-none overflow-hidden hover:border-amber-500/30 transition-all duration-700',
            similarTitle: 'text-white font-black uppercase tracking-tighter text-sm',
            similarBtn: 'mt-2 w-full text-center py-4 rounded-none border border-white/10 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all',
            check: 'text-amber-500', cross: 'text-slate-800',
            footer: 'mt-40 bg-black border-t border-white/5 py-24',
            footerText: 'text-slate-700 text-[10px] font-black uppercase tracking-[0.4em]',
            formCard: 'bg-[#0a0a0f] border border-white/5 rounded-none p-8 md:p-24 shadow-2xl',
            formLabel: 'text-slate-700 text-[10px] font-black uppercase tracking-[0.3em]',
            formTitle: 'text-3xl md:text-6xl font-black text-white mb-6 uppercase tracking-tighter italic leading-none',
            inputField: 'w-full bg-black border border-white/10 text-white placeholder-slate-800 rounded-none px-6 py-5 text-sm focus:outline-none focus:border-amber-500/50 transition-all',
            textarea: 'w-full bg-black border border-white/10 text-white placeholder-slate-800 rounded-none px-6 py-5 text-sm focus:outline-none focus:border-amber-500/50 transition-all resize-none',
        };
        case 'bold': return {
            wrapper: 'min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-500/30',
            nav: 'bg-slate-950 border-b-4 border-emerald-500 sticky top-0 z-50 shadow-2xl',
            backBtn: 'text-white hover:text-emerald-500 flex items-center gap-3 text-sm font-black uppercase italic tracking-tighter transition-all',
            thumbActive: 'border-4 border-emerald-500 rounded-none overflow-hidden cursor-pointer',
            thumbInactive: 'border-4 border-slate-900 rounded-none overflow-hidden cursor-pointer opacity-40 hover:opacity-100 transition duration-300',
            card: 'bg-slate-900 border-4 md:border-8 border-slate-800 rounded-none p-8 md:p-20 shadow-2xl',
            title: 'text-white font-black text-3xl md:text-5xl uppercase italic tracking-tighter leading-none',
            specLabel: 'text-emerald-500 text-xs font-black uppercase tracking-widest',
            specValue: 'text-white font-black text-lg md:text-xl italic uppercase',
            divider: 'border-slate-800',
            ctaCard: 'bg-slate-900 border-4 md:border-8 border-slate-800 rounded-none p-8 md:p-14 sticky top-24 shadow-2xl',
            ctaTitle: 'text-white font-black text-2xl md:text-4xl uppercase italic leading-none',
            ctaBtnOutline: 'w-full py-4 md:py-5 rounded-none font-black uppercase tracking-tighter text-base border-4 border-slate-700 text-white hover:border-white transition-all flex items-center justify-center gap-3',
            badge: 'bg-emerald-500 text-slate-950',
            badgeText: 'font-black uppercase text-[10px] tracking-widest',
            similarCard: 'bg-slate-900 border-4 border-slate-800 rounded-none overflow-hidden hover:border-emerald-500 transition-all duration-300',
            similarTitle: 'text-white font-black uppercase italic text-base',
            similarBtn: 'mt-2 w-full text-center py-4 rounded-none border-4 border-slate-700 text-white text-xs font-black uppercase hover:border-white transition-all',
            check: 'text-emerald-500', cross: 'text-slate-700',
            footer: 'mt-40 bg-black border-t-8 border-emerald-500 py-24',
            footerText: 'text-slate-500 font-black uppercase tracking-[0.4em]',
            formCard: 'bg-slate-900 border-4 md:border-8 border-slate-800 rounded-none p-12 md:p-32 shadow-2xl',
            formLabel: 'text-emerald-500 text-sm font-black uppercase tracking-widest',
            formTitle: 'text-4xl md:text-8xl font-black text-white mb-10 uppercase italic leading-[0.85]',
            inputField: 'w-full bg-slate-950 border-4 border-slate-800 text-white placeholder-slate-800 rounded-none px-6 py-5 text-lg font-bold focus:outline-none focus:border-emerald-500 transition-all',
            textarea: 'w-full bg-slate-950 border-4 border-slate-800 text-white placeholder-slate-800 rounded-none px-6 py-5 text-lg font-bold focus:outline-none focus:border-emerald-500 transition-all resize-none',
        };
        case 'luxury': return {
            wrapper: 'min-h-screen bg-[#0f0e0c] text-[#d4af37] font-serif selection:bg-[#d4af37]/20',
            nav: 'bg-[#0f0e0c]/95 backdrop-blur-xl border-b border-[#d4af37]/10 sticky top-0 z-50',
            backBtn: 'text-[#d4af37]/40 hover:text-[#d4af37] flex items-center gap-3 text-[10px] font-light uppercase tracking-[0.4em] transition-all',
            thumbActive: 'border border-[#d4af37] rounded-none overflow-hidden cursor-pointer shadow-2xl',
            thumbInactive: 'border border-[#d4af37]/5 rounded-none overflow-hidden cursor-pointer opacity-20 hover:opacity-100 transition duration-1000',
            card: 'bg-[#1a1814] border border-[#d4af37]/5 rounded-none p-8 md:p-24 shadow-2xl',
            title: 'text-[#d4af37] font-light text-3xl md:text-6xl uppercase tracking-[0.2em] md:tracking-[0.3em] leading-tight',
            specLabel: 'text-[#d4af37]/30 text-[9px] font-bold uppercase tracking-[0.4em]',
            specValue: 'text-[#d4af37] font-serif text-base md:text-lg tracking-widest uppercase',
            divider: 'border-[#d4af37]/5',
            ctaCard: 'bg-[#1a1814] border border-[#d4af37]/5 rounded-none p-8 md:p-20 sticky top-24 shadow-2xl',
            ctaTitle: 'text-[#d4af37] font-extralight text-2xl md:text-4xl uppercase tracking-[0.2em] leading-relaxed',
            ctaBtnOutline: 'w-full py-5 md:py-6 rounded-none font-bold uppercase tracking-[0.4em] text-[10px] border border-[#d4af37]/20 text-[#d4af37]/50 hover:bg-[#d4af37]/5 hover:text-[#d4af37] transition-all flex items-center justify-center gap-3',
            badge: 'border border-[#d4af37]/10',
            badgeText: 'text-[#d4af37]/60 font-bold uppercase text-[8px] tracking-[0.3em]',
            similarCard: 'bg-[#1a1814] border border-[#d4af37]/5 rounded-none overflow-hidden hover:border-[#d4af37]/30 transition-all duration-1000',
            similarTitle: 'text-[#d4af37] font-serif uppercase tracking-widest text-sm',
            similarBtn: 'mt-4 w-full text-center py-5 rounded-none border border-[#d4af37]/10 text-[#d4af37]/30 text-[9px] font-bold uppercase tracking-[0.4em] hover:bg-[#d4af37]/5 transition-all',
            check: 'text-[#d4af37]', cross: 'text-[#d4af37]/10',
            footer: 'mt-40 bg-black border-t border-[#d4af37]/5 py-32',
            footerText: 'text-[#d4af37]/20 text-[10px] uppercase tracking-[0.6em]',
            formCard: 'bg-[#1a1814] border border-[#d4af37]/5 rounded-none p-10 md:p-40 shadow-2xl',
            formLabel: 'text-[#d4af37]/30 text-[9px] font-bold uppercase tracking-[0.6em]',
            formTitle: 'text-3xl md:text-6xl font-extralight text-[#d4af37] mb-12 uppercase tracking-[0.4em] leading-relaxed',
            inputField: 'w-full bg-transparent border-b border-[#d4af37]/20 text-[#d4af37] placeholder-[#d4af37]/20 rounded-none px-2 py-4 md:py-6 text-lg md:text-xl focus:outline-none focus:border-[#d4af37] transition-all',
            textarea: 'w-full bg-transparent border-b border-[#d4af37]/20 text-[#d4af37] placeholder-[#d4af37]/20 rounded-none px-2 py-4 md:py-6 text-lg md:text-xl focus:outline-none focus:border-[#d4af37] transition-all resize-none',
        };
        case 'modern': return {
            wrapper: 'min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-500/10',
            nav: 'bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm',
            backBtn: 'text-slate-500 hover:text-slate-950 flex items-center gap-2 text-xs font-bold transition-all px-4 py-2 md:px-5 md:py-2.5 rounded-2xl bg-white border border-slate-200 hover:shadow-lg',
            thumbActive: 'border-2 border-blue-600 rounded-[20px] overflow-hidden cursor-pointer shadow-xl shadow-blue-600/20',
            thumbInactive: 'border border-slate-200 rounded-[20px] overflow-hidden cursor-pointer opacity-50 hover:opacity-100 transition duration-500',
            card: 'bg-white border border-slate-100 rounded-[32px] md:rounded-[48px] p-8 md:p-20 shadow-[0_20px_50px_rgba(0,0,0,0.03)]',
            title: 'text-slate-950 font-black text-2xl md:text-4xl tracking-tight leading-tight',
            specLabel: 'text-slate-400 text-[10px] font-bold uppercase tracking-widest',
            specValue: 'text-slate-900 font-bold',
            divider: 'border-slate-100',
            ctaCard: 'bg-white border border-slate-100 rounded-[32px] md:rounded-[40px] p-8 md:p-12 sticky top-24 shadow-2xl shadow-slate-900/5',
            ctaTitle: 'text-slate-950 font-black text-2xl md:text-3xl tracking-tight leading-none',
            ctaBtnOutline: 'w-full py-4 md:py-4.5 rounded-2xl font-bold text-sm border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2',
            badge: 'bg-slate-100',
            badgeText: 'text-slate-600 font-bold text-[10px] uppercase tracking-wider',
            similarCard: 'bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500',
            similarTitle: 'text-slate-950 font-bold text-sm tracking-tight',
            similarBtn: 'mt-2 w-full text-center py-3.5 rounded-xl bg-slate-50 text-slate-500 text-[11px] font-bold hover:bg-slate-100 transition-all',
            check: 'text-blue-600', cross: 'text-slate-300',
            footer: 'mt-32 bg-white border-t border-slate-200 py-24',
            footerText: 'text-slate-400 text-xs font-bold uppercase tracking-widest',
            formCard: 'bg-white border border-slate-100 rounded-3xl md:rounded-[56px] p-8 md:p-32 shadow-2xl shadow-slate-900/5',
            formLabel: 'text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2',
            formTitle: 'text-3xl md:text-6xl font-black text-slate-950 mb-6 tracking-tight',
            inputField: 'w-full bg-slate-50 border border-slate-100 text-slate-900 placeholder-slate-400 rounded-2xl px-6 py-5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all',
            textarea: 'w-full bg-slate-50 border border-slate-100 text-slate-900 placeholder-slate-400 rounded-2xl px-6 py-5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all resize-none',
        };
        default: return { // classic
            wrapper: 'min-h-screen bg-[#f8fafc] text-slate-900',
            nav: 'bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50 shadow-sm',
            backBtn: 'text-slate-500 hover:text-slate-900 flex items-center gap-2 text-sm font-bold transition-all px-4 py-2 rounded-xl bg-white border border-slate-100',
            thumbActive: 'border-2 border-slate-900 rounded-xl overflow-hidden cursor-pointer shadow-lg',
            thumbInactive: 'border-2 border-slate-100 rounded-xl overflow-hidden cursor-pointer opacity-60 hover:opacity-100 transition duration-300',
            card: 'bg-white border border-slate-100 rounded-[24px] p-6 md:p-12 shadow-[0_10px_28px_rgba(15,23,42,0.05)]',
            title: 'text-slate-900 font-extrabold text-2xl md:text-3xl tracking-tight leading-tight',
            specLabel: 'text-slate-400 text-[10px] font-semibold uppercase tracking-wider',
            specValue: 'text-slate-900 font-bold',
            divider: 'border-slate-100',
            ctaCard: 'bg-white border border-slate-100 rounded-[24px] p-6 md:p-10 sticky top-24 shadow-[0_10px_40px_rgba(15,23,42,0.08)]',
            ctaTitle: 'text-slate-900 font-black text-xl md:text-2xl tracking-tight',
            ctaBtnOutline: 'w-full py-3.5 md:py-4 rounded-xl font-bold border-2 border-slate-100 text-slate-600 text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2',
            badge: 'bg-slate-100',
            badgeText: 'text-slate-600 font-bold text-[10px] uppercase tracking-wider',
            similarCard: 'bg-white border border-slate-100 rounded-[20px] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300',
            similarTitle: 'text-slate-900 font-extrabold text-sm',
            similarBtn: 'mt-2 w-full text-center py-3 rounded-lg border-2 border-slate-50 text-slate-500 text-xs font-bold hover:bg-slate-50 transition-colors',
            check: 'text-emerald-500', cross: 'text-slate-300',
            footer: 'mt-32 bg-white border-t border-slate-100 py-20',
            footerText: 'text-slate-400 text-[11px] font-bold uppercase tracking-widest',
            formCard: 'bg-white rounded-[32px] md:rounded-[40px] border border-slate-100 p-8 md:p-20 shadow-[0_20px_50px_rgba(0,0,0,0.05)]',
            formLabel: 'text-slate-400 text-[10px] font-black uppercase tracking-widest',
            formTitle: 'text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight',
            inputField: 'w-full bg-slate-50 border-2 border-slate-100 text-slate-900 placeholder-slate-400 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-emerald-500 transition-all',
            textarea: 'w-full bg-slate-50 border-2 border-slate-100 text-slate-900 placeholder-slate-400 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-emerald-500 transition-all resize-none',
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
    const [sent, setSent] = useState(false);
    const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof contactSchema>>({ resolver: zodResolver(contactSchema) });

    const onSubmit = (data: z.infer<typeof contactSchema>) => {
        if (!profile.website_whatsapp) return;
        const vehicleRef = vehicle ? `o ${vehicle.brand} ${vehicle.model} ${vehicle.year} (${formatPrice(vehicle.price)})` : 'um veículo';
        const msg = `Olá, *${profile.company_name}*! Me chamo *${data.name}*, telefone: ${data.phone}. Tenho interesse em ${vehicleRef}.${data.message ? ` ${data.message}` : ''}`;
        window.open(buildWaUrl(profile.website_whatsapp, msg), '_blank');
        setSent(true);
        reset();
        setTimeout(() => setSent(false), 4000);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className={tc.formLabel}>Seu nome *</label>
                    <input {...register('name')} placeholder="Como podemos te chamar?" className={`${tc.inputField} ${errors.name ? 'border-red-400 focus:border-red-500 ring-1 ring-red-400' : ''}`} />
                    {errors.name && <span className="text-red-400 text-[10px] mt-1 font-semibold block">{errors.name.message}</span>}
                </div>
                <div>
                    <label className={tc.formLabel}>Telefone *</label>
                    <input {...register('phone', { onChange: e => e.target.value = e.target.value.replace(/[^0-9()\-\s]/g, '') })} placeholder="(11) 99999-9999" type="tel" className={`${tc.inputField} ${errors.phone ? 'border-red-400 focus:border-red-500 ring-1 ring-red-400' : ''}`} />
                    {errors.phone && <span className="text-red-400 text-[10px] mt-1 font-semibold block">{errors.phone.message}</span>}
                </div>
            </div>
            <div>
                <label className={tc.formLabel}>Mensagem</label>
                <textarea {...register('message')} placeholder="Alguma dúvida? Quer agendar um test drive?" rows={3} className={tc.textarea} />
            </div>
            <button type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-colors"
                style={{ backgroundColor: sent ? '#16a34a' : profile.website_primary_color || '#10b981' }}>
                {sent ? <><Send size={16} /> Mensagem enviada!</> : <><MessageCircle size={16} /> Enviar via WhatsApp</>}
            </button>
        </form>
    );
};

// ─── Modal Components ─────────────────────────────────────────────────────────

interface ModalProps { profile: PublicProfile; vehicle: Vehicle | null; tc: TC; onClose: () => void; }

const InterestModal: React.FC<ModalProps> = ({ profile, vehicle, tc, onClose }) => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof baseSchema>>({ resolver: zodResolver(baseSchema) });

    const onSubmit = async (data: z.infer<typeof baseSchema>) => {
        try {
            await fetch('https://webhook.orvalhodigital.com.br/webhook/BOTAO-tenho-interesse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.name, phone: data.phone,
                    vehicle: vehicle ? { id: vehicle.id, brand: vehicle.brand, model: vehicle.model, year: vehicle.year, price: vehicle.price } : null,
                    store_id: profile.id, store_name: profile.company_name
                })
            });
            if (profile.website_whatsapp) {
                const msg = `Olá! Tenho interesse no ${vehicle?.brand} ${vehicle?.model} ${vehicle?.year}. Poderia me dar mais informações?`;
                window.open(buildWaUrl(profile.website_whatsapp, msg), '_blank');
            }
            onClose();
        } catch (e) { console.error(e); }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <input {...register('name')} placeholder="Seu nome completo" className={`${tc.inputField} ${errors.name ? 'border-red-400 ring-1 ring-red-400' : ''}`} />
                {errors.name && <span className="text-red-400 text-[10px] mt-1.5 font-semibold block">{errors.name.message}</span>}
            </div>
            <div>
                <input {...register('phone', { onChange: e => e.target.value = e.target.value.replace(/[^0-9()\-\s]/g, '') })} placeholder="Seu WhatsApp com DDD" type="tel" className={`${tc.inputField} ${errors.phone ? 'border-red-400 ring-1 ring-red-400' : ''}`} />
                {errors.phone && <span className="text-red-400 text-[10px] mt-1.5 font-semibold block">{errors.phone.message}</span>}
            </div>
            <button type="submit" disabled={isSubmitting} className={tc.ctaBtnOutline}>
                {isSubmitting ? 'Enviando...' : 'Conversar no WhatsApp'}
            </button>
        </form>
    );
};

const TestDriveModal: React.FC<ModalProps> = ({ profile, vehicle, tc, onClose }) => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof testDriveSchema>>({ resolver: zodResolver(testDriveSchema) });

    const onSubmit = async (data: z.infer<typeof testDriveSchema>) => {
        try {
            await fetch('https://webhook.orvalhodigital.com.br/webhook/BOTAO-test-drive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: data.name, phone: data.phone, date: data.date, time: data.time, vehicle_id: vehicle?.id })
            });
            onClose();
        } catch(e) { console.error(e); }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <input {...register('name')} placeholder="Seu nome" className={`${tc.inputField} ${errors.name ? 'border-red-400 ring-1 ring-red-400' : ''}`} />
                {errors.name && <span className="text-red-400 text-[10px] mt-1.5 font-semibold block">{errors.name.message}</span>}
            </div>
            <div>
                <input {...register('phone', { onChange: e => e.target.value = e.target.value.replace(/[^0-9()\-\s]/g, '') })} placeholder="Seu telefone" type="tel" className={`${tc.inputField} ${errors.phone ? 'border-red-400 ring-1 ring-red-400' : ''}`} />
                {errors.phone && <span className="text-red-400 text-[10px] mt-1.5 font-semibold block">{errors.phone.message}</span>}
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <input {...register('date')} type="date" className={`${tc.inputField} ${errors.date ? 'border-red-400 ring-1 ring-red-400' : ''}`} />
                    {errors.date && <span className="text-red-400 text-[10px] mt-1.5 font-semibold block">{errors.date.message}</span>}
                </div>
                <div>
                    <input {...register('time')} type="time" className={`${tc.inputField} ${errors.time ? 'border-red-400 ring-1 ring-red-400' : ''}`} />
                    {errors.time && <span className="text-red-400 text-[10px] mt-1.5 font-semibold block">{errors.time.message}</span>}
                </div>
            </div>
            <button type="submit" disabled={isSubmitting} className={tc.ctaBtnOutline}>
                {isSubmitting ? 'Agendando...' : 'Agendar Test Drive'}
            </button>
        </form>
    );
};

const FinancingModal: React.FC<ModalProps> = ({ profile, vehicle, tc, onClose }) => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof financeSchema>>({ resolver: zodResolver(financeSchema) });

    const onSubmit = async (data: z.infer<typeof financeSchema>) => {
        try {
            await fetch('https://webhook.orvalhodigital.com.br/webhook/BOTAO-simular-financiamento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: data.name, phone: data.phone, entrada: data.entrada, parcelas: data.parcelas, ideal: data.ideal, vehicle_id: vehicle?.id })
            });
            onClose();
        } catch(e) { console.error(e); }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <input {...register('name')} placeholder="Seu nome" className={`${tc.inputField} ${errors.name ? 'border-red-400 ring-1 ring-red-400' : ''}`} />
                {errors.name && <span className="text-red-400 text-[10px] mt-1.5 font-semibold block">{errors.name.message}</span>}
            </div>
            <div>
                <input {...register('phone', { onChange: e => e.target.value = e.target.value.replace(/[^0-9()\-\s]/g, '') })} placeholder="Seu telefone" type="tel" className={`${tc.inputField} ${errors.phone ? 'border-red-400 ring-1 ring-red-400' : ''}`} />
                {errors.phone && <span className="text-red-400 text-[10px] mt-1.5 font-semibold block">{errors.phone.message}</span>}
            </div>
            <div className="grid grid-cols-2 gap-3">
                <input {...register('entrada')} placeholder="Entrada R$" className={tc.inputField} />
                <input {...register('parcelas')} placeholder="Nº de parcelas" className={tc.inputField} />
            </div>
            <input {...register('ideal')} placeholder="Valor ideal de parcela" className={tc.inputField} />
            <button type="submit" disabled={isSubmitting} className={tc.ctaBtnOutline}>
                {isSubmitting ? 'Enviando...' : 'Simular Financiamento'}
            </button>
        </form>
    );
};

const TradeModal: React.FC<ModalProps> = ({ profile, vehicle, tc, onClose }) => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof tradeSchema>>({ resolver: zodResolver(tradeSchema) });

    const onSubmit = async (data: z.infer<typeof tradeSchema>) => {
        try {
            await fetch('https://webhook.orvalhodigital.com.br/webhook/BOTAO-troca', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: data.name, phone: data.phone, trade_model: data.modelo, trade_year: data.ano, trade_plate: data.placa, vehicle_id: vehicle?.id })
            });
            onClose();
        } catch(e) { console.error(e); }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <input {...register('name')} placeholder="Seu nome" className={`${tc.inputField} ${errors.name ? 'border-red-400 ring-1 ring-red-400' : ''}`} />
                {errors.name && <span className="text-red-400 text-[10px] mt-1.5 font-semibold block">{errors.name.message}</span>}
            </div>
            <div>
                <input {...register('phone', { onChange: e => e.target.value = e.target.value.replace(/[^0-9()\-\s]/g, '') })} placeholder="Seu telefone" type="tel" className={`${tc.inputField} ${errors.phone ? 'border-red-400 ring-1 ring-red-400' : ''}`} />
                {errors.phone && <span className="text-red-400 text-[10px] mt-1.5 font-semibold block">{errors.phone.message}</span>}
            </div>
            <input {...register('modelo')} placeholder="Modelo do seu carro" className={tc.inputField} />
            <div className="grid grid-cols-2 gap-3">
                <input {...register('ano')} placeholder="Ano" className={tc.inputField} />
                <input {...register('placa')} placeholder="Placa (opcional)" className={tc.inputField} />
            </div>
            <button type="submit" disabled={isSubmitting} className={tc.ctaBtnOutline}>
                {isSubmitting ? 'Enviando...' : 'Propor Troca'}
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
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [activeImg, setActiveImg] = useState(0);
    const [activeModal, setActiveModal] = useState<null | 'interest' | 'testdrive' | 'financing' | 'trade'>(null);
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

    useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on('select', () => {
            setActiveImg(emblaApi.selectedScrollSnap());
        });
    }, [emblaApi]);

    const scrollTo = (index: number) => {
        if (emblaApi) emblaApi.scrollTo(index);
    };

    useEffect(() => {
        if (!slug || !id) return;
        (async () => {
            try {
                setLoading(true);
                const pResult = await websiteService.getProfileBySlug(slug);
                const p = pResult.profile;
                
                if (!p) {
                    setNotFound(true);
                    setLoading(false);
                    return;
                }
                
                setProfile(p);

                // Agora buscamos o veículo garantindo que ele pertence a este lojista
                const v = await websiteService.getVehicleById(id, p.id);
                
                if (!v) {
                    setNotFound(true);
                    setLoading(false);
                    return;
                }
                
                setVehicle(v);
                
                // Buscar outros veículos do mesmo lojista para o "Veículos Similares"
                const all = await websiteService.getVehiclesByUserId(p.id);
                setAllVehicles(all);
            } catch (err) {
                console.error('[PublicVehicleDetail] Error:', err);
                setNotFound(true);
            } finally {
                setLoading(false);
                setActiveImg(0);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
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

    // Hooks must be called before any early returns
    const theme = profile?.website_theme || 'classic';
    const displayLogo = useMemo(() => {
        if (profile?.website_branding?.enabled) {
            const isDarkTheme = ['glass', 'premium', 'bold', 'luxury'].includes(theme);
            return isDarkTheme 
                ? (profile.website_branding.logo_dark || profile.website_branding.logo_primary || profile.company_logo)
                : (profile.website_branding.logo_primary || profile.company_logo);
        }
        return profile?.company_logo;
    }, [profile, theme]);

    const ctaBtnPrimary = `w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors`;
    const ctaBtnPrimaryStyle = profile?.website_theme === 'premium'
        ? { backgroundColor: '#eab308', color: '#000' }
        : { backgroundColor: primary, color: '#fff' };

    const seoTitle = vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year} — ${profile?.company_name}` : 'Veículo — nLeads';
    const seoDesc = vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}, ${formatKm(vehicle.mileage)}, ${vehicle.transmission}. ${formatPrice(vehicle.price)} em ${profile?.company_name}.` : '';
    const fontStyle = { 
        fontFamily: profile?.website_typography === 'serif' ? 'Playfair Display, serif' : 
                    profile?.website_typography === 'oswald' ? 'Oswald, sans-serif' : 
                    'Inter, sans-serif' 
    };

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

    const waMsg = profile.preset_messages?.[0] 
        ? replaceVariables(profile.preset_messages[0], { vehicle, profile })
        : `Olá! Tenho interesse no ${vehicle.brand} ${vehicle.model} ${vehicle.year} — ${formatPrice(vehicle.price)}. Poderia me dar mais informações?`;
    const waUrl = profile.website_whatsapp ? buildWaUrl(profile.website_whatsapp, waMsg) : '#';
    const mainWaMsg = profile.preset_messages?.[0] 
        ? replaceVariables(profile.preset_messages[0], { profile })
        : `Olá! Vim pelo site ${profile.company_name}.`;
    const mainWaUrl = profile.website_whatsapp ? buildWaUrl(profile.website_whatsapp, mainWaMsg) : '#';

    return (
        <div className={tc.wrapper} style={fontStyle}>
            <Helmet>
                <title>{seoTitle}</title>
                <meta name="description" content={seoDesc} />
                <meta property="og:type" content="product" />
                <meta property="og:url" content={window.location.href} />
                <meta property="og:title" content={seoTitle} />
                <meta property="og:description" content={seoDesc} />
                <meta property="og:site_name" content={profile.company_name} />
                {allImages[0] && <meta property="og:image" content={allImages[0]} />}
                {allImages[0] && <meta property="og:image:secure_url" content={allImages[0]} />}
                {allImages[0] && <meta property="og:image:alt" content={seoTitle} />}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={seoTitle} />
                <meta name="twitter:description" content={seoDesc} />
                {allImages[0] && <meta name="twitter:image" content={allImages[0]} />}
                <meta name="robots" content="index, follow" />
            </Helmet>

            <MobileMenu 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
                profile={profile} 
                primary={primary}
                theme={theme}
                slug={slug!}
            />

            {/* Nav */}
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
                    <div className="flex items-center gap-3">
                        {profile.website_whatsapp && (
                            <a href={mainWaUrl} target="_blank" rel="noopener noreferrer"
                                className="hidden sm:flex items-center gap-2 bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-green-400 transition-colors">
                                <MessageCircle size={16} />
                                <span>WhatsApp</span>
                            </a>
                        )}
                        <button onClick={() => setIsMenuOpen(true)} className="md:hidden p-2 opacity-60 hover:opacity-100 rounded-lg transition-colors">
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-[1250px] mx-auto px-4 py-8">
                <Link to={`/site/${slug}`} className={`${tc.backBtn} mb-6 inline-flex`}>
                    <ArrowLeft size={16} /> Voltar ao estoque
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Gallery */}
                        <div>
                            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] bg-gray-200" ref={emblaRef}>
                                <PhotoProvider>
                                    <div className="flex h-full">
                                        {allImages.map((img, i) => (
                                            <div key={i} className="flex-[0_0_100%] min-w-0 relative">
                                                {img === PLACEHOLDER ? (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl m-4">
                                                        <Car size={80} strokeWidth={1} />
                                                        <span className="text-xs font-black uppercase tracking-widest opacity-40 mt-4">Nenhuma foto disponível</span>
                                                    </div>
                                                ) : (
                                                    <PhotoView src={img}>
                                                        <img src={img} alt={`${vehicle.brand} ${vehicle.model} - foto ${i + 1}`}
                                                            className="w-full h-full object-cover cursor-zoom-in"
                                                            onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                                                    </PhotoView>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </PhotoProvider>
                                {allImages.length > 1 && (
                                    <>
                                        <button onClick={() => { if (emblaApi) emblaApi.scrollPrev(); }}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10">
                                            <ChevronLeft size={20} />
                                        </button>
                                        <button onClick={() => { if (emblaApi) emblaApi.scrollNext(); }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10">
                                            <ChevronRight size={20} />
                                        </button>
                                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm z-10">
                                            {activeImg + 1} / {allImages.length}
                                        </div>
                                    </>
                                )}
                            </div>
                            {allImages.length > 1 && (
                                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                                    {allImages.map((img, i) => (
                                        <button key={i} onClick={() => scrollTo(i)}
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

                            <div className="space-y-2.5">
                                <button onClick={() => setActiveModal('interest')}
                                    className={ctaBtnPrimary} style={ctaBtnPrimaryStyle}>
                                    <MessageCircle size={18} />
                                    Tenho Interesse
                                </button>
                                <button onClick={() => setActiveModal('testdrive')}
                                    className={tc.ctaBtnOutline}>
                                    <Calendar size={16} /> Agendar Test Drive
                                </button>
                                <button onClick={() => setActiveModal('financing')}
                                    className={tc.ctaBtnOutline}>
                                    <FileText size={16} /> Simular Financiamento
                                </button>
                                <button onClick={() => setActiveModal('trade')}
                                    className={tc.ctaBtnOutline}>
                                    <Shield size={16} /> Propor Troca
                                </button>
                            </div>

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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {similar.map(v => (
                                <div key={v.id} className={tc.similarCard}>
                                    <div className="aspect-[4/5] overflow-hidden">
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
                        <div className="text-center mt-6">
                            <Link to={`/site/${slug}`}
                                className="inline-block px-7 py-3 rounded-xl font-semibold text-sm transition-colors"
                                style={{ backgroundColor: primary, color: 'white' }}>
                                Ver todos os veículos
                            </Link>
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

            {/* Modals Overlay (Shadcn Dialog) */}
            <Dialog open={!!activeModal} onOpenChange={(open) => !open && setActiveModal(null)}>
                <DialogContent className={`${tc.formCard} max-w-md w-[90%] border-none shadow-2xl p-0 gap-0 rounded-2xl md:rounded-3xl`}>
                    <div className="p-6 md:p-8">
                        <DialogHeader className="mb-6 text-left">
                            <DialogTitle className={tc.formTitle}>
                                {activeModal === 'interest' && 'Tenho Interesse'}
                                {activeModal === 'testdrive' && 'Agendar Test Drive'}
                                {activeModal === 'financing' && 'Simular Financiamento'}
                                {activeModal === 'trade' && 'Propor Troca'}
                            </DialogTitle>
                            <DialogDescription className={`text-xs mt-1 ${tc.specLabel}`}>
                                Deixe seus dados corretos para entrarmos em contato com as melhores condições.
                            </DialogDescription>
                        </DialogHeader>

                        {activeModal === 'interest' && (
                            <InterestModal profile={profile} vehicle={vehicle} tc={tc} onClose={() => setActiveModal(null)} />
                        )}
                        {activeModal === 'testdrive' && (
                            <TestDriveModal profile={profile} vehicle={vehicle} tc={tc} onClose={() => setActiveModal(null)} />
                        )}
                        {activeModal === 'financing' && (
                            <FinancingModal profile={profile} vehicle={vehicle} tc={tc} onClose={() => setActiveModal(null)} />
                        )}
                        {activeModal === 'trade' && (
                            <TradeModal profile={profile} vehicle={vehicle} tc={tc} onClose={() => setActiveModal(null)} />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Footer */}
            <footer className={tc.footer}>
                <div className="max-w-[1250px] mx-auto px-4 py-8 text-center">
                    <p className={tc.footerText}>
                        © {new Date().getFullYear()} {profile.company_name}{profile.website_city ? ` — ${profile.website_city}` : ''}. Todos os direitos reservados.
                    </p>
                    <p className="text-xs opacity-25 mt-1">Powered by nLeads</p>
                </div>
            </footer>

            {/* Floating WA */}
            {profile.website_whatsapp && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer"
                    className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-400 hover:scale-110 transition-all z-50 overflow-hidden">
                    <Lottie animationData={whatsappAnimation} loop={true} className="w-16 h-16 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </a>
            )}
        </div>
    );
};

export default PublicVehicleDetail;
