import React from 'react';
import { Check, Star, Zap } from 'lucide-react';
import { Profile } from '../types';

interface PlansProps {
    profile: Profile | null;
    onUpgrade: () => void;
}

const Plans: React.FC<PlansProps> = ({ profile, onUpgrade }) => {
    const isPro = profile?.plan === 'pro';

    return (
        <div className="flex flex-col space-y-8 animate-fadeUp">
            <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Meus Planos</h2>
                <p className="text-slate-400 font-bold text-sm mt-1">Gerencie sua assinatura e acesso</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                {/* Plano Teste */}
                <div className={`relative p-8 rounded-[2.5rem] border-2 transition-all ${!isPro ? 'bg-white border-emerald-500 shadow-xl' : 'bg-slate-50 border-transparent opacity-60'}`}>
                    {!isPro && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-lg shadow-emerald-500/30">
                            Plano Atual
                        </div>
                    )}
                    <div className="flex flex-col h-full">
                        <div className="mb-6">
                            <span className="p-3 bg-slate-100 rounded-2xl inline-flex text-slate-400 mb-4">
                                <Zap size={24} fill="currentColor" />
                            </span>
                            <h3 className="text-xl font-black text-slate-900 uppercase">Plano Teste</h3>
                            <p className="text-sm font-bold text-slate-400 mt-2">Para quem está começando</p>
                        </div>

                        <div className="mb-8">
                            <span className="text-4xl font-black text-slate-900">Grátis</span>
                            <span className="text-sm font-bold text-slate-400 ml-2">/ 7 dias</span>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                <Check size={18} className="text-emerald-500" />
                                <span className="line-through text-slate-400">Leads Ilimitados</span> (Limitado)
                            </li>
                            <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                <Check size={18} className="text-emerald-500" />
                                Gestão de Estoque
                            </li>
                            <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                <Check size={18} className="text-emerald-500" />
                                CRM Básico
                            </li>
                        </ul>

                        <button disabled={true} className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-extrabold text-xs uppercase tracking-widest cursor-not-allowed">
                            {isPro ? 'Disponível' : 'Ativo Agora'}
                        </button>
                    </div>
                </div>

                {/* Plano Pro */}
                <div className={`relative p-8 rounded-[2.5rem] border-2 transition-all ${isPro ? 'bg-white border-emerald-500 shadow-xl' : 'bg-slate-900 border-slate-900 text-white'}`}>
                    {isPro && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-lg shadow-emerald-500/30">
                            Plano Atual
                        </div>
                    )}
                    <div className="flex flex-col h-full">
                        <div className="mb-6">
                            <span className={`p-3 rounded-2xl inline-flex mb-4 ${isPro ? 'bg-emerald-50 text-emerald-500' : 'bg-emerald-500 text-white'}`}>
                                <Star size={24} fill="currentColor" />
                            </span>
                            <h3 className={`text-xl font-black uppercase ${isPro ? 'text-slate-900' : 'text-white'}`}>Plano Pro</h3>
                            <p className={`text-sm font-bold mt-2 ${isPro ? 'text-slate-400' : 'text-slate-400'}`}>Para profissionais e lojas</p>
                        </div>

                        <div className="mb-8">
                            <span className={`text-4xl font-black ${isPro ? 'text-slate-900' : 'text-white'}`}>R$ 97</span>
                            <span className="text-sm font-bold text-slate-500 ml-2">/ mês</span>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            <li className={`flex items-center gap-3 text-sm font-bold ${isPro ? 'text-slate-600' : 'text-slate-300'}`}>
                                <Check size={18} className="text-emerald-500" />
                                Leads Ilimitados
                            </li>
                            <li className={`flex items-center gap-3 text-sm font-bold ${isPro ? 'text-slate-600' : 'text-slate-300'}`}>
                                <Check size={18} className="text-emerald-500" />
                                Gestão de Estoque Completa
                            </li>
                            <li className={`flex items-center gap-3 text-sm font-bold ${isPro ? 'text-slate-600' : 'text-slate-300'}`}>
                                <Check size={18} className="text-emerald-500" />
                                Integração Webhook
                            </li>
                            <li className={`flex items-center gap-3 text-sm font-bold ${isPro ? 'text-slate-600' : 'text-slate-300'}`}>
                                <Check size={18} className="text-emerald-500" />
                                Suporte Prioritário
                            </li>
                        </ul>

                        <button
                            onClick={onUpgrade}
                            disabled={isPro}
                            className={`w-full py-4 rounded-2xl font-extrabold text-xs uppercase tracking-widest transition-all ${isPro
                                    ? 'bg-emerald-50 text-emerald-600 cursor-default'
                                    : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-xl shadow-emerald-500/20'
                                }`}
                        >
                            {isPro ? 'Assinatura Ativa' : 'Fazer Upgrade'}
                        </button>
                    </div>
                </div>
            </div>

            {profile && (
                <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 max-w-4xl">
                    <h4 className="font-extrabold text-slate-900 uppercase tracking-tight mb-2">Detalhes da Assinatura</h4>
                    <div className="flex gap-8 text-sm text-slate-600">
                        <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                            <span className={`font-bold uppercase ${profile.planStatus === 'active' ? 'text-emerald-600' : 'text-red-500'}`}>
                                {profile.planStatus === 'active' ? 'Ativo' : 'Expirado'}
                            </span>
                        </div>
                        {profile.plan === 'trial' && (
                            <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fim do Teste</span>
                                <span className="font-bold">
                                    {new Date(profile.trialEndsAt).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                        <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</span>
                            <span className="font-bold">
                                {profile.email}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Plans;
