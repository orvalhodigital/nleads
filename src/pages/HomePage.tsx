import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { format, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sparkles, Calendar as CalendarIcon, ArrowRight, TrendingUp, Users, Car, Target, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LeadPhase } from '../types';

const quotes = [
    "Um ótimo dia para bater metas e encantar clientes!",
    "A consistência é a chave para resultados extraordinários.",
    "Oportunidades excelentes esperam por você hoje.",
    "Sua dedicação molda o sucesso do seu negócio."
];

const HomePage: React.FC = () => {
    const { profile, leads, vehicles, motorcycles } = useData();
    const navigate = useNavigate();
    const [quote, setQuote] = useState('');

    useEffect(() => {
        setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }, []);

    const todayDate = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
    const firstName = profile?.full_name?.split(' ')[0] || 'Lojista';

    // Daily Stats
    const leadsNovosHoje = leads.filter(l => l.phase === LeadPhase.NEW && isToday(new Date(l.createdAt))).length;
    const visitasHoje = leads.filter(l => l.visit_date && isToday(parseISO(l.visit_date)) && l.visit_status === 'pending').length;
    const followupsHoje = leads.filter(l => l.phase === LeadPhase.FOLLOW_UP && l.follow_up_data?.nextContactDate && isToday(parseISO(l.follow_up_data.nextContactDate))).length;
    const availableVehicles = profile?.enable_cars !== false ? vehicles.filter(v => v.status === 'available').length : 0;
    const availableMotos = profile?.enable_motorcycles ? motorcycles.filter(m => m.status === 'available').length : 0;
    const estoqueDisponivel = availableVehicles + availableMotos;

    return (
        <div className="flex flex-col h-full justify-center animate-fadeUp pb-4 md:p-8 gap-8 lg:gap-12 w-full">

            {/* ════════════ HEADER & GREETING ════════════ */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 w-full mb-4 lg:mb-8">
                <div className="text-center md:text-left">
                    <div className="inline-flex items-center gap-2 text-muted-foreground font-semibold mb-6 surface-glass px-5 py-2.5 rounded-full shadow-sm">
                        <CalendarIcon size={16} className="text-primary" />
                        <span className="capitalize">{todayDate}</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-4">
                        Olá, {firstName}! <span className="inline-block animate-wave-emoji cursor-default">👋</span>
                    </h1>

                    <p className="text-lg text-muted-foreground max-w-2xl font-medium leading-relaxed italic surface-glass p-4 rounded-2xl">
                        "{quote}"
                    </p>
                </div>

                <div className="shrink-0 flex gap-4 w-full md:w-auto flex-col">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full md:w-auto px-8 py-4 sm:py-5 bg-brand-600 hover:bg-brand-700 shadow-[0_8px_32px_rgba(139,92,246,0.25)] hover:-translate-y-1 active:scale-95 text-white rounded-full font-extrabold uppercase tracking-widest text-sm sm:text-base transition-all duration-300 flex items-center justify-center gap-3 group border border-brand-500/50"
                    >
                        <TrendingUp size={20} className="text-white" />
                        Acessar Métricas
                        <ArrowRight size={16} className="text-white group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* ════════════ DAILY QUICK STATS (GLASSMORPHISM) ════════════ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative z-10">

                <div
                    onClick={() => navigate('/leads')}
                    className="surface-glass p-6 rounded-[2rem] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                >
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                        <Users size={24} strokeWidth={2.5} />
                    </div>
                    <p className="text-4xl font-heading font-bold text-foreground mb-1">{leadsNovosHoje}</p>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Novos Leads Hoje</p>
                </div>

                <div
                    onClick={() => navigate('/agenda')}
                    className="surface-glass p-6 rounded-[2rem] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                >
                    <div className="w-12 h-12 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-rose-500/20 transition-all duration-300">
                        <CalendarIcon size={24} strokeWidth={2.5} />
                    </div>
                    <p className="text-4xl font-heading font-bold text-foreground mb-1">{visitasHoje}</p>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Visitas Marcadas Hoje</p>
                </div>

                <div
                    onClick={() => navigate('/agenda')}
                    className="surface-glass p-6 rounded-[2rem] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                >
                    <div className="w-12 h-12 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-300">
                        <Clock size={24} strokeWidth={2.5} />
                    </div>
                    <p className="text-4xl font-heading font-bold text-foreground mb-1">{followupsHoje}</p>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Follow-Ups Hoje</p>
                </div>

                <div
                    onClick={() => navigate('/inventory')}
                    className="surface-glass p-6 rounded-[2rem] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                >
                    <div className="w-12 h-12 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all duration-300">
                        <Car size={24} strokeWidth={2.5} />
                    </div>
                    <p className="text-4xl font-heading font-bold text-foreground mb-1">{estoqueDisponivel}</p>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Veículos no Estoque</p>
                </div>

            </div>
        </div>
    );
};

export default HomePage;
