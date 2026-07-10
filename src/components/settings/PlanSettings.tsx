import React, { useState, useEffect } from 'react';
import { CreditCard, Check, Crown, Star, Rocket, Zap, Clock, ShieldCheck, Loader2, Sparkles, TrendingUp, HelpCircle, X, MessageSquare, Globe, Users, Target, ShieldAlert } from 'lucide-react';
import { Profile, Plan, Campaign } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { formatCurrency } from '../../utils/formatters';
import { planService } from '../../services/planService';

interface Props {
    profile: Profile;
}

const PlanSettings: React.FC<Props> = ({ profile }) => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState(false);

    const handleUpgradeClick = async () => {
        const proPlan = plans.find(p => p.slug === 'pro');
        if (!proPlan) return;

        setUpgrading(true);
        try {
            const url = await planService.getAsaasUpgradeLink(profile.id, proPlan.id);
            window.open(url, '_blank');
        } catch (err) {
            console.error('Error generating Asaas link, falling back to Stripe:', err);
            if (profile.email) {
                const url = await planService.getUpgradeLink(profile.email);
                window.open(url, '_blank');
            } else {
                const url = planService.getUpgradeStripeUrl();
                window.open(url, '_blank');
            }
        } finally {
            setUpgrading(false);
        }
    };

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

    const isProActive = profile.plan === 'pro';

    const freeFeatures = [
        { text: 'Limite de até 10 Veículos cadastrados', available: true },
        { text: 'Limite de até 50 Leads ativos', available: true },
        { text: 'Acesso completo ao Kanban e Listas', available: true },
        { text: 'Acesso à Agenda e Lembretes', available: true },
        { text: 'Website de Vendas Otimizza básico', available: true },
        { text: 'Multiusuários (Múltiplos Vendedores)', available: false },
        { text: 'Instância WhatsApp Integrada', available: false },
        { text: 'Website com Domínio Customizado', available: false },
        { text: 'Dashboard e Metas Avançadas', available: false },
        { text: 'Suporte Prioritário 24/7', available: false },
    ];

    const proFeatures = [
        { text: 'Veículos Ilimitados (Carros e Motos)', available: true, highlight: true },
        { text: 'Leads Ilimitados (Sem travas ou barreiras)', available: true, highlight: true },
        { text: 'Website de Vendas Profissional Completo', available: true },
        { text: 'Uso de Domínio Personalizado (Ex: sua-loja.com)', available: true },
        { text: 'WhatsApp Integrado (webhook automatizado)', available: true },
        { text: 'Disparos Ilimitados de WhatsApp Web', available: true },
        { text: 'Multiusuários (Múltiplos Vendedores e Metas)', available: true },
        { text: 'Dashboard de Metas e Métricas Financeiras', available: true },
        { text: 'Garantias de Pós-Venda Customizadas', available: true },
        { text: 'Suporte VIP e Monitoramento 24/7', available: true },
    ];

    return (
        <div className="space-y-10 animate-fadeUp">
            {/* Current Plan Dashboard Banner */}
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group border-b-8 border-slate-950">
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
                    <Crown size={180} />
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 relative z-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-emerald-500 font-black text-sm uppercase tracking-widest">
                            <Star size={20} fill="currentColor" /> Assinatura Ativa
                        </div>
                        <h2 className="text-4xl font-black">{isProActive ? 'Plano Pro' : 'Plano Free'}</h2>
                        <p className="text-slate-400 font-medium max-w-md leading-relaxed">
                            {isProActive
                                ? 'Sua assinatura está em dia e todas as funcionalidades premium do Otimizza estão liberadas para você e sua equipe.'
                                : 'Você está no plano gratuito. Faça upgrade para o Otimizza Pro para remover limites de cadastro e liberar todos os recursos avançados de WhatsApp, domínio e equipe.'}
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 min-w-[280px] shadow-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <ShieldCheck size={28} className="text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status da Conta</p>
                                <p className="text-lg font-black text-white">
                                    Regularizada
                                </p>
                            </div>
                        </div>
                        {!isProActive ? (
                            <button
                                onClick={handleUpgradeClick}
                                disabled={upgrading}
                                className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/10 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {upgrading && <Loader2 size={16} className="animate-spin" />}
                                {upgrading ? 'Redirecionando...' : 'Adquirir Plano Pro'}
                            </button>
                        ) : (
                            <button className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-xl">
                                Gerenciar Faturas
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Comparison Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Free Plan Card */}
                <div className={`p-10 rounded-[3rem] border-4 bg-white shadow-xl relative transition-all ${!isProActive ? 'border-amber-500 ring-8 ring-amber-50' : 'border-slate-100'}`}>
                    {!isProActive && (
                        <div className="absolute top-0 right-10 -translate-y-1/2 bg-amber-500 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">
                            Seu Plano Atual
                        </div>
                    )}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shadow-md">
                            <Clock size={28} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black text-slate-900">Plano Free</h4>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Para quem está começando</p>
                        </div>
                    </div>

                    <div className="flex items-baseline gap-2 mb-10">
                        <span className="text-5xl font-black text-slate-900 tracking-tighter">Grátis</span>
                        <span className="text-sm font-bold text-slate-400 uppercase">/ sempre</span>
                    </div>

                    <div className="space-y-4 mb-12">
                        {freeFeatures.map((feat, i) => (
                            <div key={i} className={`flex items-center gap-4 text-sm font-bold ${feat.available ? 'text-slate-600' : 'text-slate-300'}`}>
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                                    feat.available ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-rose-50 text-rose-300 border-rose-100'
                                }`}>
                                    {feat.available ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                                </div>
                                <span className={!feat.available ? 'line-through decoration-slate-200' : ''}>
                                    {feat.text}
                                </span>
                            </div>
                        ))}
                    </div>

                    <button
                        disabled
                        className="w-full py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 text-center"
                    >
                        {!isProActive ? 'Plano em Uso' : 'Plano Free'}
                    </button>
                </div>

                {/* Pro Plan Card */}
                <div className={`p-10 rounded-[3rem] border-4 bg-white shadow-xl relative transition-all ${isProActive ? 'border-emerald-600 ring-8 ring-emerald-50 shadow-emerald-100' : 'border-slate-50 hover:border-slate-200'}`}>
                    {isProActive && (
                        <div className="absolute top-0 right-10 -translate-y-1/2 bg-emerald-600 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">
                            Seu Plano Atual
                        </div>
                    )}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                            <Zap size={28} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black text-slate-900">Plano Pro</h4>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Para acelerar suas vendas</p>
                        </div>
                    </div>

                    <div className="flex items-baseline gap-2 mb-10">
                        <span className="text-5xl font-black text-slate-900 tracking-tighter">R$ 197</span>
                        <span className="text-sm font-bold text-slate-400 uppercase">/ mês</span>
                    </div>

                    <div className="space-y-4 mb-12">
                        {proFeatures.map((feat, i) => (
                            <div key={i} className={`flex items-center gap-4 text-sm font-bold ${feat.highlight ? 'text-emerald-700 font-extrabold' : 'text-slate-700'}`}>
                                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-100">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                                <span>{feat.text}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleUpgradeClick}
                        disabled={isProActive || upgrading}
                        className={`w-full py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer ${
                            isProActive
                                ? 'bg-slate-150 text-slate-350 cursor-not-allowed border border-slate-100'
                                : 'bg-slate-900 text-white hover:bg-emerald-600 shadow-xl shadow-slate-900/10 border-b-4 border-slate-950 disabled:opacity-50'
                        }`}
                    >
                        {upgrading && <Loader2 size={16} className="animate-spin" />}
                        {isProActive ? 'Plano em Uso' : upgrading ? 'Redirecionando...' : 'Fazer Upgrade para Pro'}
                    </button>
                </div>
            </div>

            {/* Detailed Pro Advantages Grid */}
            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl space-y-8">
                <div className="text-center max-w-2xl mx-auto">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full">Recursos Pro</span>
                    <h3 className="text-3xl font-black text-slate-950 mt-4">Tudo o que o Otimizza Pro Entrega</h3>
                    <p className="text-sm text-slate-400 mt-2 font-medium">Veja em detalhes como a versão Pro transforma o gerenciamento da sua concessionária.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
                    <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Zap size={20} /></div>
                        <h5 className="font-bold text-slate-900">Cadastro Ilimitado</h5>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">Cadastre quantos carros e motos precisar e receba leads sem limite de quantidade. Seu funil cresce com o seu negócio.</p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><MessageSquare size={20} /></div>
                        <h5 className="font-bold text-slate-900">Instância WhatsApp API</h5>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">Conecte o WhatsApp do seu negócio para captar leads e mandar mensagens com cliques rápidos diretamente do painel.</p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Globe size={20} /></div>
                        <h5 className="font-bold text-slate-900">Domínio Personalizado</h5>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">Publique seu estoque em um domínio próprio (ex: www.sualoja.com.br) com certificado SSL gratuito e alta velocidade de carregamento.</p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Users size={20} /></div>
                        <h5 className="font-bold text-slate-900">Gestão de Equipe (Vendedores)</h5>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">Cadastre vendedores, distribua leads de forma organizada e analise o desempenho individual de conversão da equipe.</p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Target size={20} /></div>
                        <h5 className="font-bold text-slate-900">Metas Comerciais Mensais</h5>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">Defina metas de faturamento, leads, visitas e vendas no mês. O sistema calcula a progressão diária automaticamente.</p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><ShieldCheck size={20} /></div>
                        <h5 className="font-bold text-slate-900">Garantia e Pós-Venda</h5>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">Configure as condições de garantia da sua loja, gerencie o pós-venda e receba avisos automáticos de expiração.</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <HelpCircle size={18} className="text-slate-400 animate-pulse" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Dúvidas sobre os planos? Entre em contato com nosso <span className="text-emerald-600 cursor-pointer hover:underline">suporte especializado</span>.
                </p>
            </div>
        </div>
    );
};

export default PlanSettings;
