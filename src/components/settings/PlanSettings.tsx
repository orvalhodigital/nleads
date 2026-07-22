import React, { useState, useEffect } from 'react';
import { CreditCard, Check, Crown, Star, Rocket, Zap, Clock, ShieldCheck, Loader2, Sparkles, TrendingUp, HelpCircle, X, MessageSquare, Globe, Users, Target, ShieldAlert } from 'lucide-react';
import { Profile, Plan, Campaign } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { formatCurrency } from '../../utils/formatters';
import { planService } from '../../services/planService';
import { hasUnlimitedAccess } from '../../lib/planAccess';

interface Props {
    profile: Profile;
}

const PlanSettings: React.FC<Props> = ({ profile }) => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState(false);

    const handleUpgradeClick = async (selectedPlan: Plan) => {
        setUpgrading(true);
        try {
            const url = await planService.getAsaasUpgradeLink(profile.id, selectedPlan.id);
            window.open(url, '_blank');
        } catch (err: any) {
            // NÃO cair para Stripe. Este sistema cobra exclusivamente via Asaas —
            // um pagamento no Stripe iria para uma conta desintegrada e o plano
            // NUNCA ativaria (só o webhook do Asaas ativa). Em erro, avisamos e
            // paramos, em vez de mandar o cliente pagar no lugar errado.
            console.error('Erro ao gerar pagamento no Asaas:', err);
            alert(err?.message || 'Não foi possível iniciar o pagamento agora. Tente novamente em instantes ou fale com o suporte.');
        } finally {
            setUpgrading(false);
        }
    };

    const [loadingBilling, setLoadingBilling] = useState(false);

    const handleBillingPortalClick = async () => {
        setLoadingBilling(true);
        try {
            const url = await planService.getAsaasBillingPortalLink();
            window.open(url, '_blank');
        } catch (err: any) {
            console.error('Error opening billing portal:', err);
            alert(err.message || 'Erro ao carregar o portal de faturamento. Verifique se possui cobranças ativas.');
        } finally {
            setLoadingBilling(false);
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
                <Loader2 className="animate-spin text-brand-500" size={48} />
                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Carregando planos...</p>
            </div>
        );
    }

    const isProActive = hasUnlimitedAccess(profile.plan);

    const freeFeatures = [
        { text: 'Limite de até 10 Veículos cadastrados', available: true },
        { text: 'Limite de até 50 Leads ativos', available: true },
        { text: 'Acesso completo ao Kanban e Listas', available: true },
        { text: 'Acesso à Agenda e Lembretes', available: true },
        { text: 'Website de Vendas Orvalho básico', available: true },
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
            {profile.planStatus === 'overdue' && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <h4 className="font-black text-amber-800 text-sm uppercase tracking-wide">Pagamento em atraso</h4>
                        <p className="text-amber-700 text-sm font-medium mt-0.5">
                            Identificamos um pagamento pendente na sua assinatura. Regularize para não perder o acesso aos recursos do Plano Ilimitado.
                        </p>
                    </div>
                </div>
            )}

            {/* Current Plan Dashboard Banner */}
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group border-b-8 border-slate-950">
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
                    <Crown size={180} />
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 relative z-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-violet-500 font-black text-sm uppercase tracking-widest">
                            <Star size={20} fill="currentColor" /> Assinatura Ativa
                        </div>
                        <h2 className="text-4xl font-black">{isProActive ? 'Plano Ilimitado' : 'Plano Básico'}</h2>
                        <p className="text-slate-400 font-medium max-w-md leading-relaxed">
                            {isProActive
                                ? 'Sua assinatura está em dia e todas as funcionalidades premium do Gestor de Pátio estão liberadas para você e sua equipe.'
                                : 'Você está no plano básico. Faça upgrade para o Plano Ilimitado para remover limites de cadastro e liberar todos os recursos avançados de WhatsApp, domínio e equipe.'}
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 min-w-[280px] shadow-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
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
                                onClick={() => {
                                    const proPlan = plans.find(p => p.slug === 'pro');
                                    if (proPlan) handleUpgradeClick(proPlan);
                                }}
                                disabled={upgrading}
                                className="w-full py-4 bg-violet-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-violet-700 transition-all shadow-xl shadow-violet-600/10 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {upgrading && <Loader2 size={16} className="animate-spin" />}
                                {upgrading ? 'Redirecionando...' : 'Adquirir Plano Ilimitado'}
                            </button>
                        ) : (
                             <button
                                onClick={handleBillingPortalClick}
                                disabled={loadingBilling}
                                className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-violet-500 hover:text-white transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                             >
                                {loadingBilling && <Loader2 size={16} className="animate-spin" />}
                                {loadingBilling ? 'Carregando...' : 'Gerenciar Faturas'}
                             </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                {plans.map((plan) => {
                    const isCurrent = profile.plan === plan.slug;
                    const isHighlight = plan.style?.highlight;
                    
                    return (
                        <div 
                            key={plan.id} 
                            className={`p-8 rounded-[2.5rem] border-4 bg-white shadow-xl relative transition-all flex flex-col justify-between ${
                                isCurrent 
                                    ? 'border-indigo-600 ring-8 ring-indigo-50 shadow-indigo-100' 
                                    : isHighlight 
                                        ? 'border-slate-300 ring-4 ring-slate-50' 
                                        : 'border-slate-100 hover:border-slate-200'
                            }`}
                        >
                            {isCurrent && (
                                <div className="absolute top-0 right-10 -translate-y-1/2 bg-indigo-600 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">
                                    Seu Plano Atual
                                </div>
                            )}
                            <div>
                                <div className="flex flex-col items-start gap-3 mb-6">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                                        isHighlight ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {plan.style?.icon === 'Clock' && <Clock size={24} />}
                                        {plan.style?.icon === 'Zap' && <Zap size={24} />}
                                        {plan.style?.icon === 'Target' && <Target size={24} />}
                                        {plan.style?.icon === 'Crown' && <Crown size={24} />}
                                        {plan.style?.icon === 'Star' && <Star size={24} />}
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-slate-900">{plan.name}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                            {plan.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-baseline gap-2 mb-8">
                                    <span className="text-4xl font-black text-slate-900 tracking-tighter">
                                        {plan.price === 0 ? 'Grátis' : `R$ ${plan.price}`}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400 uppercase">/ mês</span>
                                </div>

                                <div className="space-y-4 mb-8">
                                    {plan.features?.map((feat, i) => (
                                        <div key={i} className="flex items-start gap-3 text-xs font-bold text-slate-600">
                                            <div className="w-5 h-5 rounded-lg bg-violet-50 text-violet-500 flex items-center justify-center shrink-0 border border-violet-100 mt-0.5">
                                                <Check size={12} strokeWidth={3} />
                                            </div>
                                            <span>{feat}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => handleUpgradeClick(plan)}
                                disabled={isCurrent || upgrading}
                                className={`w-full py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer ${
                                    isCurrent
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                        : 'bg-slate-900 text-white hover:bg-violet-600 shadow-xl shadow-slate-900/10 border-b-4 border-slate-950 disabled:opacity-50'
                                }`}
                            >
                                {upgrading && <Loader2 size={16} className="animate-spin" />}
                                {isCurrent ? 'Plano em Uso' : upgrading ? 'Redirecionando...' : `Adquirir ${plan.name}`}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Detailed Pro Advantages Grid */}
            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl space-y-8">
                <div className="text-center max-w-2xl mx-auto">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full">Recursos Pro</span>
                    <h3 className="text-3xl font-black text-slate-950 mt-4">Tudo o que o Gestor de Pátio Pro Entrega</h3>
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
                    Dúvidas sobre os planos? Entre em contato com nosso <span className="text-brand-600 cursor-pointer hover:underline">suporte especializado</span>.
                </p>
            </div>
        </div>
    );
};

export default PlanSettings;
