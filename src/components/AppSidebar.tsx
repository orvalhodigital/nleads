
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Car,
    Users,
    CheckCircle2,
    LogOut,
    CreditCard,
    Settings,
    Calendar,
    Bike,
    Truck,
    ChevronLeft,
    ChevronRight,
    LifeBuoy,
    Globe,
    BarChart3,
    Target
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useSystemSettings } from '../hooks/useSystemSettings';
import { LogoRenderer } from './OtimizzaLogo';
import { useData } from '../contexts/DataContext';

const AppSidebar: React.FC = () => {
    const { logoUrl } = useSystemSettings();
    const { profile } = useData();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    const menuItems = [
        // { id: '/estrutura-ecv', icon: Target, label: 'Estrutura ECV', end: false, always: true },
        { id: '/dashboard', icon: LayoutDashboard, label: 'Métricas', end: true, always: true },
        ...(profile?.enable_cars !== false ? [{ id: '/inventory', icon: Car, label: profile?.enable_motorcycles ? 'Carros' : 'Veículos', end: false, always: true }] : []),
        ...(profile?.enable_motorcycles ? [{ id: '/motorcycles', icon: Bike, label: 'Motos', end: false, always: true }] : []),
        { id: '/leads', icon: Users, label: 'Leads', end: false, always: true },
        { id: '/agenda', icon: Calendar, label: 'Agenda', end: false, always: true },
        { id: '/sales-flow', icon: BarChart3, label: 'Fluxo de Vendas', end: false, always: true },
        { id: '/sales-closed', icon: CheckCircle2, label: 'Vendas (Relatório)', end: false, always: true },
        { id: '/support', icon: LifeBuoy, label: 'Suporte', end: false, always: true },
        { id: '/website', icon: Globe, label: 'Website', end: false, always: true }
    ];

    const getPlanLabel = (plan: string) => {
        if (plan === 'pro') return 'PRO';
        return 'FREE';
    };

    const getPlanStyle = (plan: string) => {
        if (plan === 'pro') return 'bg-slate-900 text-white border-slate-900';
        return 'bg-amber-100 text-amber-700 border-amber-200';
    };

    const handleUpgrade = () => {
        navigate('/settings?tab=Planos');
    };

    return (
        <aside className={`
            fixed bottom-0 left-0 w-full h-[72px] bg-white/60 backdrop-blur-2xl border-t border-white/50 flex flex-row z-[100] transition-all duration-300
            lg:relative lg:h-auto lg:bg-white/40 lg:backdrop-blur-3xl lg:border-r lg:border-white/50 lg:border-t-0 lg:flex-col lg:z-50 lg:shrink-0
            ${isCollapsed ? 'lg:w-[88px]' : 'lg:w-64'}
        `}>
            <div className={`hidden lg:flex items-center ${isCollapsed ? 'justify-center px-4 py-5' : 'justify-between px-4 py-4'}`}>
                {!isCollapsed && (
                    <div
                        onClick={() => navigate('/')}
                        className="cursor-pointer hover:opacity-80 transition-opacity flex-1 min-w-0 flex items-center"
                        title="Página Inicial"
                    >
                        {profile?.company_logo ? (
                            <img src={profile.company_logo} alt="Company Logo" className="w-full h-auto object-contain object-left" />
                        ) : (
                            <LogoRenderer src={logoUrl} variant="horizontal" className="h-[42px] w-auto" />
                        )}
                    </div>
                )}

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`p-2 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-all shrink-0 ${isCollapsed ? '' : 'ml-2'}`}
                    title={isCollapsed ? "Expandir menu" : "Recolher menu"}
                >
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            <nav className="
                flex-1 flex flex-row items-center justify-around px-2
                lg:flex-col lg:px-4 lg:space-y-2 lg:mt-4 lg:items-stretch lg:justify-start lg:overflow-y-auto lg:min-h-0
            ">
                {menuItems.map(item => (
                    <NavLink
                        key={item.id}
                        to={item.id}
                        end={item.end}
                        className={({ isActive }) => `
                            flex flex-col items-center justify-center p-2 transition-all duration-300 group relative
                            lg:flex-row lg:gap-3 lg:px-4 lg:py-3 lg:justify-start
                            ${isCollapsed ? 'lg:justify-center lg:w-auto lg:mx-2' : 'lg:w-full'}
                            ${item.id === '/estrutura-ecv'
                                ? isActive
                                    ? 'bg-indigo-50 text-indigo-600 font-black border-b-2 lg:border-b-0 lg:border-l-4 border-indigo-500 rounded-t-2xl lg:rounded-t-none lg:rounded-r-2xl lg:rounded-l-none'
                                    : 'bg-indigo-50/30 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50/60 font-black border-b-2 lg:border-b-0 lg:border-l-4 border-transparent rounded-2xl'
                                : isActive
                                    ? 'bg-brand-50 text-brand-600 font-black border-b-2 lg:border-b-0 lg:border-l-4 border-brand-500 rounded-t-2xl lg:rounded-t-none lg:rounded-r-2xl lg:rounded-l-none'
                                    : 'text-slate-500 hover:text-brand-600 hover:bg-slate-50/50 border-b-2 lg:border-b-0 lg:border-l-4 border-transparent rounded-2xl'
                            }
                        `}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon
                                    size={22}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={`shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
                                />
                                <span className={`
                                    text-[10px] font-bold mt-1
                                    lg:text-sm lg:mt-0 lg:font-semibold
                                    ${isCollapsed ? 'lg:hidden' : ''}
                                `}>
                                    {item.label}
                                </span>

                                {/* Tooltip for collapsed state */}
                                {isCollapsed && (
                                    <div className="hidden lg:block absolute left-full ml-4 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl pointer-events-none">
                                        <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-slate-800 rotate-45" />
                                        {item.label}
                                    </div>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="hidden lg:block p-4 mt-auto border-t border-slate-50">
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} p-2 lg:p-0`}>
                    <NavLink
                        to="/settings"
                        className={`flex items-center flex-1 min-w-0 cursor-pointer group/profile relative ${isCollapsed ? 'justify-center' : 'gap-3'}`}
                        title="Ver meu perfil"
                    >
                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white shrink-0 uppercase transition-transform group-hover/profile:scale-105 overflow-hidden border-2 border-transparent group-hover/profile:border-brand-500">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                profile?.full_name?.charAt(0) || profile?.email.charAt(0) || 'U'
                            )}
                        </div>

                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate group-hover/profile:text-brand-600 transition-colors">{profile?.full_name || 'Usuário'}</p>
                                {profile?.company_name && (
                                    <p className="text-[10px] font-medium text-slate-500 truncate mt-0.5">{profile.company_name}</p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                    {profile?.plan && profile.plan !== 'free' && profile.plan !== 'trial' ? (
                                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded border bg-slate-900 text-white border-slate-900">PRO</span>
                                    ) : (
                                        <>
                                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded border bg-amber-100 text-amber-700 border-amber-200">FREE</span>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleUpgrade();
                                                }}
                                                className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                                                title="Fazer upgrade"
                                            >
                                                Upgrade
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {isCollapsed && (
                            <div className="hidden lg:block absolute left-full ml-4 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all whitespace-nowrap z-50 shadow-xl pointer-events-none">
                                <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-slate-800 rotate-45" />
                                {profile?.full_name || 'Meu Perfil'}
                            </div>
                        )}
                    </NavLink>

                    {!isCollapsed && (
                        <button
                            onClick={() => supabase.auth.signOut()}
                            className="hidden lg:flex text-slate-300 hover:text-red-500 transition-colors bg-transparent p-2 rounded-lg hover:bg-red-50 shrink-0"
                            title="Sair"
                        >
                            <LogOut size={16} />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default AppSidebar;
