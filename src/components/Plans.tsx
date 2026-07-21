import React from 'react';
import { Check, Star, Zap } from 'lucide-react';
import { Profile } from '../types';
import { planService } from '../services/planService';
import { hasUnlimitedAccess } from '../lib/planAccess';

interface PlansProps {
    profile: Profile | null;
    onUpgrade: () => void;
}

const Plans: React.FC<PlansProps> = ({ profile, onUpgrade }) => {
    const isPro = hasUnlimitedAccess(profile?.plan);

    return (
        <div className="flex flex-col space-y-8 animate-fadeUp">
            <div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">Meus Planos</h2>
                <p className="text-muted-foreground font-semibold text-sm mt-1">Gerencie sua assinatura e acesso</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                {/* Plano Free */}
                <div className={`relative p-8 rounded-[2.5rem] border-2 transition-all ${!isPro ? 'bg-card border-primary shadow-sm' : 'bg-muted/40 border-transparent opacity-60'}`}>
                    {!isPro && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md shadow-primary/10">
                            Plano Atual
                        </div>
                    )}
                    <div className="flex flex-col h-full">
                        <div className="mb-6">
                            <span className="p-3 bg-muted rounded-2xl inline-flex text-muted-foreground mb-4">
                                <Zap size={24} fill="currentColor" />
                            </span>
                            <h3 className="text-xl font-bold text-foreground uppercase">Plano Free</h3>
                            <p className="text-sm font-bold text-muted-foreground mt-2">Para quem está começando</p>
                        </div>

                        <div className="mb-8">
                            <span className="text-4xl font-bold text-foreground">Grátis</span>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-sm font-bold text-foreground/90">
                                <Check size={18} className="text-primary" />
                                Até 10 veículos
                            </li>
                            <li className="flex items-center gap-3 text-sm font-bold text-foreground/90">
                                <Check size={18} className="text-primary" />
                                Até 50 leads
                            </li>
                            <li className="flex items-center gap-3 text-sm font-bold text-foreground/90">
                                <Check size={18} className="text-primary" />
                                Gestão de Estoque
                            </li>
                            <li className="flex items-center gap-3 text-sm font-bold text-foreground/90">
                                <span className="line-through text-muted-foreground/60">Agenda</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm font-bold text-foreground/90">
                                <span className="line-through text-muted-foreground/60">Fluxo de Vendas</span>
                            </li>
                        </ul>

                        <button disabled={true} className="w-full py-4 bg-muted text-muted-foreground rounded-2xl font-bold text-xs uppercase tracking-widest cursor-not-allowed">
                            {isPro ? 'Disponível' : 'Ativo Agora'}
                        </button>
                    </div>
                </div>

                {/* Plano Pro */}
                <div className={`relative p-8 rounded-[2.5rem] border-2 transition-all ${isPro ? 'bg-card border-primary shadow-sm' : 'bg-card border-border/80 text-foreground'}`}>
                    {isPro && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md shadow-primary/10">
                            Plano Atual
                        </div>
                    )}
                    <div className="flex flex-col h-full">
                        <div className="mb-6">
                            <span className={`p-3 rounded-2xl inline-flex mb-4 ${isPro ? 'bg-primary/15 text-primary' : 'bg-primary text-primary-foreground'}`}>
                                <Star size={24} fill="currentColor" />
                            </span>
                            <h3 className="text-xl font-bold uppercase text-foreground">Plano Pro</h3>
                            <p className="text-sm font-bold mt-2 text-muted-foreground">Para profissionais e lojas</p>
                        </div>

                        <div className="mb-8">
                            <span className="text-4xl font-bold text-foreground">R$ 197</span>
                            <span className="text-sm font-bold text-muted-foreground ml-2">/ mês</span>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-sm font-bold text-foreground/90">
                                <Check size={18} className="text-primary" />
                                Veículos Ilimitados
                            </li>
                            <li className="flex items-center gap-3 text-sm font-bold text-foreground/90">
                                <Check size={18} className="text-primary" />
                                Leads Ilimitados
                            </li>
                            <li className="flex items-center gap-3 text-sm font-bold text-foreground/90">
                                <Check size={18} className="text-primary" />
                                Gestão Completa de Estoque
                            </li>
                            <li className="flex items-center gap-3 text-sm font-bold text-foreground/90">
                                <Check size={18} className="text-primary" />
                                Agenda de Visitas
                            </li>
                            <li className="flex items-center gap-3 text-sm font-bold text-foreground/90">
                                <Check size={18} className="text-primary" />
                                Fluxo de Vendas Completo
                            </li>
                            <li className="flex items-center gap-3 text-sm font-bold text-foreground/90">
                                <Check size={18} className="text-primary" />
                                Website Profissional
                            </li>
                        </ul>

                        <button
                            onClick={onUpgrade}
                            disabled={isPro}
                            className={`w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${isPro
                                    ? 'bg-primary/10 text-primary cursor-default'
                                    : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20'
                                }`}
                        >
                            {isPro ? 'Assinatura Ativa' : 'Fazer Upgrade'}
                        </button>
                    </div>
                </div>
            </div>

            {profile && (
                <div className="mt-8 p-6 bg-card/60 rounded-3xl border border-border/80 max-w-4xl">
                    <h4 className="font-bold text-foreground uppercase tracking-tight mb-2">Detalhes da Assinatura</h4>
                    <div className="flex gap-8 text-sm text-muted-foreground">
                        <div>
                            <span className="block text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Plano</span>
                            <span className="font-bold text-foreground">{hasUnlimitedAccess(profile.plan) ? 'PRO' : 'FREE'}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Status</span>
                            <span className={`font-bold uppercase ${profile.planStatus === 'active' ? 'text-primary' : 'text-rose-500'}`}>
                                {profile.planStatus === 'active' ? 'Ativo' : 'Expirado'}
                            </span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Email</span>
                            <span className="font-bold text-foreground">
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
