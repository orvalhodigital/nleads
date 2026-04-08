
import React, { useEffect, useState } from 'react';
import { Lock, LogOut, CheckCircle, Zap, Shield, Crown } from 'lucide-react';
import { Plan } from '../types';
import { supabase } from '../lib/supabaseClient';

interface TrialExpiredProps {
    onUpgrade: (plan?: Plan) => void;
    onLogout: () => void;
}

const TrialExpired: React.FC<TrialExpiredProps> = ({ onUpgrade, onLogout }) => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            const { data } = await supabase.from('plans').select('*').eq('is_active', true).order('price', { ascending: true });
            if (data) setPlans(data);
            setLoading(false);
        };
        fetchPlans();
    }, []);

    return (
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-slate-100/50">
            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

                {/* Visual Section */}
                <div className="space-y-8 pr-0 md:pr-12">
                    <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-rose-100 animate-bounce-slow">
                        <Lock size={40} />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black text-slate-900 leading-[1.1] tracking-tight">
                            Sua jornada apenas <span className="text-indigo-600">começou.</span>
                        </h1>
                        <p className="text-slate-500 mt-6 text-xl font-medium leading-relaxed">
                            Seu período de 7 dias de teste gratuito expirou. Escolha o melhor plano para continuar escalando sua operação de leads.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 text-slate-600">
                            <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                <CheckCircle size={14} />
                            </div>
                            <span className="font-bold">Mantenha seu estoque ativo</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-600">
                            <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                <CheckCircle size={14} />
                            </div>
                            <span className="font-bold">Não perca o histórico de leads</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-600">
                            <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                <CheckCircle size={14} />
                            </div>
                            <span className="font-bold">Acesso a todas as automações</span>
                        </div>
                    </div>

                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 text-slate-400 hover:text-rose-500 transition-all font-black uppercase text-xs tracking-widest pl-2"
                    >
                        <LogOut size={16} /> Sair da conta
                    </button>
                </div>

                {/* Plans Selection */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl border border-slate-100 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : plans.length > 0 ? (
                        plans.map(plan => (
                            <div key={plan.id}
                                className={`p-8 rounded-[2.5rem] border-2 transition-all group relative overflow-hidden ${plan.slug === 'pro' || plan.slug === 'crm' ? 'bg-white border-indigo-500 shadow-2xl shadow-indigo-100' : 'bg-slate-900 border-slate-800 text-white'}`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-slate-50 rounded-2xl group-hover:scale-110 group-hover:bg-indigo-50 transition-all text-slate-400 group-hover:text-indigo-600">
                                        {plan.style?.icon === 'Star' && <Star size={24} />}
                                        {plan.style?.icon === 'Shield' && <Shield size={24} />}
                                        {plan.style?.icon === 'Crown' && <Crown size={24} />}
                                        {(!plan.style?.icon || plan.style?.icon === 'Zap') && <Zap size={24} />}
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-4xl font-black ${plan.slug === 'pro' || plan.slug === 'crm' ? 'text-slate-900' : 'text-white'}`}>
                                            R$ {plan.price}
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-40">por {plan.interval === 'month' ? 'mês' : plan.interval === 'year' ? 'ano' : 'período'}</div>
                                    </div>
                                </div>
                                <h3 className={`text-xl font-black mb-2 ${plan.slug === 'pro' || plan.slug === 'crm' ? 'text-slate-900' : 'text-white'}`}>{plan.name}</h3>
                                <p className={`text-sm font-medium mb-8 leading-relaxed opacity-60`}>{plan.description}</p>

                                <button
                                    onClick={() => onUpgrade(plan)}
                                    className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 shadow-lg ${plan.slug === 'pro' || plan.slug === 'crm' ? 'bg-indigo-600 text-white hover:bg-slate-900 shadow-indigo-100' : 'bg-white text-slate-900 hover:bg-emerald-500 hover:text-white'}`}
                                >
                                    Atualizar Agora
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl border border-slate-100 text-center">
                            <p className="font-bold text-slate-400">Nenhum plano disponível no momento.</p>
                            <button onClick={onLogout} className="mt-4 text-indigo-600 font-black uppercase text-xs">Sair</button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

// Simple Star icon as it's not imported
const Star = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
);

export default TrialExpired;
