import React, { useState, useEffect } from 'react';
import { CreditCard, Check, Crown, Star, Rocket, Zap, Clock, ShieldCheck, Loader2, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';
import { Profile, Plan, Campaign } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { formatCurrency } from '../../utils/formatters';

interface Props {
    profile: Profile;
}

const PlanSettings: React.FC<Props> = ({ profile }) => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const { data: plansData } = await supabase
                    .from('plans')
                    .select('*')
                    .eq('is_active', true)
                    .order('price', { ascending: true });

                const { data: campaignsData } = await supabase
                    .from('campaigns')
                    .select('*')
                    .eq('is_active', true)
                    .lte('start_date', new Date().toISOString())
                    .gte('end_date', new Date().toISOString());

                if (plansData) setPlans(plansData);
                if (campaignsData) setCampaigns(campaignsData);
            } catch (error) {
                console.error('Error fetching plans:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlans();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Carregando planos...</p>
            </div>
        );
    }

    const currentPlan = plans.find(p => p.slug === profile.plan);

    return (
        <div className="space-y-10 animate-fadeUp">
            {/* Current Plan Dashboard */}
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group border-b-8 border-slate-950">
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
                    <Crown size={180} />
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-emerald-500 font-black text-sm uppercase tracking-widest">
                            <Star size={20} fill="currentColor" /> Assinatura Ativa
                        </div>
                        <h2 className="text-4xl font-black">{currentPlan?.name || 'Período de Teste'}</h2>
                        <p className="text-slate-400 font-medium max-w-md leading-relaxed">
                            {profile.planStatus === 'active'
                                ? 'Sua assinatura está em dia e todas as funcionalidades premium estão liberadas.'
                                : 'Atenção: sua assinatura expirou. Renove agora para manter o acesso.'}
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 min-w-[280px] shadow-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <ShieldCheck size={28} className="text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status da Conta</p>
                                <p className="text-lg font-black text-white">{profile.planStatus === 'active' ? 'Regularizada' : 'Pendente'}</p>
                            </div>
                        </div>
                        <button className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-xl">
                            Gerenciar Faturas
                        </button>
                    </div>
                </div>
            </div>

            {/* Campaign Banner */}
            {campaigns.length > 0 && (
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-[2.5rem] p-8 text-white flex items-center justify-between shadow-2xl shadow-emerald-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Rocket size={80} className="-rotate-12" />
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30">
                            <Sparkles size={32} />
                        </div>
                        <div>
                            <h4 className="text-xl font-black mb-1">Promoção Especial Ativa!</h4>
                            <p className="text-sm font-medium text-white/80">{campaigns[0].description || 'Aproveite agora as vantagens exclusivas.'}</p>
                        </div>
                    </div>
                    <button className="px-8 py-4 bg-white text-emerald-600 rounded-xl font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all">
                        Ver Oferta
                    </button>
                </div>
            )}

            {/* Plan Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {plans.filter(p => p.price > 0).map((plan) => (
                    <div
                        key={plan.id}
                        className={`p-10 rounded-[3rem] border-4 transition-all relative group bg-white shadow-xl ${
                            profile.plan === plan.slug
                            ? 'border-emerald-600 shadow-emerald-100 ring-8 ring-emerald-50'
                            : 'border-slate-50 hover:border-slate-200'
                        }`}
                    >
                        {profile.plan === plan.slug && (
                            <div className="absolute top-0 right-10 -translate-y-1/2 bg-emerald-600 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2">
                                <Check size={12} strokeWidth={4} /> Seu Plano
                            </div>
                        )}

                        <div className="flex items-center gap-4 mb-8">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                                plan.slug === 'pro' ? 'bg-slate-900 text-white' : 'bg-emerald-500 text-white'
                            }`}>
                                {plan.slug === 'pro' ? <Zap size={28} /> : <TrendingUp size={28} />}
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-slate-900">{plan.name}</h4>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ideal para seu negócio</p>
                            </div>
                        </div>

                        <div className="flex items-baseline gap-2 mb-10">
                            <span className="text-5xl font-black text-slate-900 tracking-tighter">{formatCurrency(plan.price)}</span>
                            <span className="text-sm font-bold text-slate-400 uppercase">/mês</span>
                        </div>

                        <div className="space-y-5 mb-12">
                            {plan.features.map((feature, i) => (
                                <div key={i} className="flex items-center gap-4 text-sm font-bold text-slate-600">
                                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-100">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                    {feature}
                                </div>
                            ))}
                        </div>

                        <button
                            disabled={profile.plan === plan.slug}
                            className={`w-full py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98] ${
                                profile.plan === plan.slug
                                ? 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100'
                                : 'bg-slate-900 text-white hover:bg-emerald-600 shadow-xl shadow-slate-900/10 border-b-4 border-slate-950'
                            }`}
                        >
                            {profile.plan === plan.slug ? 'Plano em Uso' : 'Fazer Upgrade'}
                        </button>
                    </div>
                ))}

                {/* Trial Box */}
                {profile.plan === 'trial' && (
                    <div className="p-10 rounded-[3rem] bg-emerald-50 border-4 border-dashed border-emerald-200 flex flex-col items-center text-center justify-center relative overflow-hidden">
                        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-emerald-600 mb-6 font-black text-2xl border border-emerald-100 relative z-10">
                            <Clock size={32} />
                        </div>
                        <h4 className="text-2xl font-black text-emerald-950 mb-2 relative z-10">Período de Experiência</h4>
                        <p className="text-sm font-medium text-emerald-900/60 leading-relaxed mb-8 max-w-[200px] relative z-10">
                            Aproveite todos os recursos antes de escolher sua modalidade definitiva.
                        </p>
                        <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-emerald-200 font-black text-emerald-600 text-xs uppercase tracking-widest relative z-10">
                            Expira em breve
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <HelpCircle size={18} className="text-slate-400" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Dúvidas sobre os planos? Entre em contato com nosso <span className="text-emerald-600 cursor-pointer hover:underline">suporte especializado</span>.
                </p>
            </div>
        </div>
    );
};

export default PlanSettings;
