import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Car,
    Users,
    CheckCircle2,
    LogOut,
    Settings,
    CreditCard
} from 'lucide-react';
import { View, Profile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useSystemSettings } from '../hooks/useSystemSettings';
import { hasUnlimitedAccess } from '../lib/planAccess';

interface SidebarProps {
    currentView: View;
    onNavigate: (view: View) => void;
    profile: Profile | null;
}


const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, profile }) => {
    const { logoUrl } = useSystemSettings();

    const menuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'inventory', icon: Car, label: 'Estoque' },
        { id: 'leads', icon: Users, label: 'Leads' },
        { id: 'sales-closed', icon: CheckCircle2, label: 'Vendas Fechadas' }
    ];

    const getPlanLabel = (plan: string) => {
        if (hasUnlimitedAccess(plan)) return 'PRO';
        return 'FREE';
    };

    const getPlanStyle = (plan: string) => {
        if (hasUnlimitedAccess(plan)) return 'bg-slate-900 text-white border-slate-900';
        return 'bg-brand-100 text-brand-700 border-brand-200';
    };

    return (
        <aside className="
            fixed bottom-0 left-0 w-full h-[72px] bg-white/80 backdrop-blur-xl border-t border-slate-200 flex flex-row z-[100]
            lg:relative lg:w-64 lg:h-auto lg:bg-white lg:backdrop-blur-none lg:border-r lg:border-t-0 lg:flex-col lg:z-50 lg:shrink-0
        ">
            <div className="hidden lg:block p-6 lg:p-10">
                {profile?.company_logo ? (
                    <img src={profile.company_logo} alt="Company Logo" className="h-10 w-auto object-contain" />
                ) : logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-200 shrink-0">
                            <Car size={20} strokeWidth={2.5} />
                        </div>
                        <h1 className="hidden lg:block text-xl font-extrabold tracking-tight text-slate-900">
                            n<span className="text-brand-500">Leads</span>
                        </h1>
                    </div>
                )}

            </div>

            <nav className="
                flex-1 flex flex-row items-center justify-around px-2
                lg:flex-col lg:px-4 lg:space-y-2 lg:mt-4 lg:items-stretch lg:justify-start
            ">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id as View)}
                        className={`
                            flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300 group
                            lg:w-full lg:flex-row lg:gap-3 lg:px-4 lg:py-3 lg:justify-start
                            ${currentView === item.id
                                ? 'bg-brand-500/10 text-brand-600'
                                : 'text-slate-400 hover:text-brand-600 hover:bg-slate-50'
                            }
                        `}
                    >
                        <item.icon
                            size={22}
                            strokeWidth={currentView === item.id ? 2.5 : 2}
                            className={`shrink-0 transition-all duration-300 ${currentView === item.id ? 'scale-110 drop-shadow-[0_0_8px_rgba(139,92,246,0.3)]' : 'group-hover:scale-110'}`}
                        />
                        <span className={`
                            text-[10px] font-bold mt-1
                            lg:text-sm lg:mt-0 lg:font-semibold
                        `}>
                            {item.label}
                        </span>
                    </button>
                ))}
            </nav>

            <div className="hidden lg:block p-6 mt-auto border-t border-slate-50">
                <div className="flex items-center gap-3 p-2 lg:p-0">
                    <div
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group/profile"
                        onClick={() => onNavigate('settings')}
                        title="Ver meu perfil"
                    >
                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white shrink-0 uppercase transition-transform group-hover/profile:scale-105 overflow-hidden border-2 border-transparent group-hover/profile:border-brand-500">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                profile?.full_name?.charAt(0) || profile?.email.charAt(0) || 'U'
                            )}
                        </div>
                        <div className="hidden lg:block flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate group-hover/profile:text-brand-600 transition-colors">{profile?.full_name || 'Usuário'}</p>
                            {profile?.company_name && (
                                <p className="text-[10px] font-medium text-slate-500 truncate mt-0.5">{profile.company_name}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border shadow-sm ${getPlanStyle(profile?.plan || 'trial')}`}>
                                    {getPlanLabel(profile?.plan || 'trial')}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => supabase.auth.signOut()}
                        className="hidden lg:block text-slate-300 hover:text-red-500 transition-colors bg-transparent p-2 rounded-lg hover:bg-red-50"
                        title="Sair"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
