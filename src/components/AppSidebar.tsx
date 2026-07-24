
import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Car,
    Users,
    CheckCircle2,
    LogOut,
    Settings,
    Calendar,
    CalendarDays,
    PhoneCall,
    Bike,
    ChevronLeft,
    ChevronRight,
    LifeBuoy,
    Globe,
    BarChart3,
    MoreHorizontal,
    X,
    ListTodo,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useSystemSettings } from '../hooks/useSystemSettings';
import { LogoRenderer } from './OrvalhoLogo';
import { useAuthContext } from '../contexts/AuthContext';
import { hasUnlimitedAccess } from '../lib/planAccess';

interface MenuItem {
    id: string;
    icon: React.ComponentType<{ size?: number | string; strokeWidth?: number; className?: string }>;
    label: string;
    end: boolean;
}

const AppSidebar: React.FC = () => {
    const { logoUrl } = useSystemSettings();
    const { profile } = useAuthContext();
    const location = useLocation();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const [isMoreOpen, setIsMoreOpen] = React.useState(false);

    const isItemActive = (item: MenuItem) => {
        const [itemPath] = item.id.split('?');
        if (location.pathname !== itemPath) return false;

        if (itemPath === '/agenda') {
            const params = new URLSearchParams(location.search);
            const tab = params.get('tab');
            if (item.id === '/agenda?tab=visitas') {
                return !tab || tab === 'visitas' || tab === 'visits';
            }
            if (item.id === '/agenda?tab=followups') {
                return tab === 'followups' || tab === 'followup';
            }
        }

        return true;
    };

    // Lista completa (usada na sidebar desktop e no sheet "Mais" do mobile)
    const menuItems: MenuItem[] = [
        { id: '/dashboard', icon: LayoutDashboard, label: 'Métricas', end: true },
        ...(profile?.enable_cars !== false ? [{ id: '/inventory', icon: Car, label: profile?.enable_motorcycles ? 'Carros' : 'Veículos', end: false }] : []),
        ...(profile?.enable_motorcycles ? [{ id: '/motorcycles', icon: Bike, label: 'Motos', end: false }] : []),
        { id: '/leads', icon: Users, label: 'Leads', end: false },
        { id: '/agenda?tab=visitas', icon: CalendarDays, label: 'Visitas', end: false },
        { id: '/agenda?tab=followups', icon: PhoneCall, label: 'Follow-up', end: false },
        { id: '/sales-flow', icon: BarChart3, label: 'Fluxo de Vendas', end: false },
        { id: '/sales-closed', icon: CheckCircle2, label: 'Vendas (Relatório)', end: false },
        { id: '/support', icon: LifeBuoy, label: 'Suporte', end: false },
        { id: '/website', icon: Globe, label: 'Website', end: false },
    ];

    // Mobile: 4 itens principais na barra inferior; o resto vai para o sheet "Mais".
    const estoqueItem = menuItems.find(i => i.id === '/inventory' || i.id === '/motorcycles');
    const primaryMobile: MenuItem[] = [
        menuItems.find(i => i.id === '/dashboard'),
        estoqueItem,
        menuItems.find(i => i.id === '/leads'),
        menuItems.find(i => i.id === '/agenda?tab=visitas'),
    ].filter(Boolean) as MenuItem[];
    const primaryMobileIds = primaryMobile.map(i => i.id);
    const secondaryMobile = menuItems.filter(i => !primaryMobileIds.includes(i.id));

    const handleUpgrade = () => {
        navigate('/settings?tab=Planos');
    };

    const handleSignOut = () => supabase.auth.signOut();

    const isPro = hasUnlimitedAccess(profile?.plan);

    return (
        <>
            {/* ─── SIDEBAR DESKTOP (lg+) ────────────────────────────────────── */}
            <aside className={`
                hidden lg:flex lg:relative lg:h-auto lg:flex-col lg:z-50 lg:shrink-0
                bg-secondary/70 dark:bg-secondary/20 lg:backdrop-blur-3xl border-r border-border/60
                transition-[width] duration-300
                ${isCollapsed ? 'lg:w-[88px]' : 'lg:w-64'}
            `}>
                <div className={`flex items-center ${isCollapsed ? 'justify-center px-4 py-5' : 'justify-between px-4 py-4'}`}>
                    {!isCollapsed && (
                        <div
                            onClick={() => navigate('/')}
                            className="cursor-pointer hover:opacity-80 transition-opacity flex-1 min-w-0 flex items-center"
                            title="Página Inicial"
                        >
                            {profile?.company_logo ? (
                                <img src={profile.company_logo} alt="Logo da empresa" className="w-full h-auto object-contain object-left" />
                            ) : (
                                <LogoRenderer src={logoUrl} variant="horizontal" className="h-[42px] w-auto" />
                            )}
                        </div>
                    )}

                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all shrink-0 ${isCollapsed ? '' : 'ml-2'}`}
                        title={isCollapsed ? "Expandir menu" : "Recolher menu"}
                        aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
                    >
                        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>

                <nav className="flex-1 flex flex-col px-4 space-y-1.5 mt-4 items-stretch overflow-y-auto min-h-0">
                    {menuItems.map(item => {
                        const active = isItemActive(item);
                        return (
                            <NavLink
                                key={item.id}
                                to={item.id}
                                className={`
                                    flex flex-row items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative
                                    ${isCollapsed ? 'justify-center mx-1' : 'w-full'}
                                    ${active
                                        ? 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20'
                                        : 'text-foreground/75 dark:text-foreground/80 hover:text-primary dark:hover:text-primary-foreground hover:bg-primary/10 dark:hover:bg-primary/20'
                                    }
                                `}
                            >
                                <item.icon
                                    size={20}
                                    strokeWidth={active ? 2.5 : 2}
                                    className={`shrink-0 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}
                                />
                                <span className={`text-sm font-semibold ${isCollapsed ? 'hidden' : ''}`}>
                                    {item.label}
                                </span>

                                {isCollapsed && (
                                    <div className="absolute left-full ml-4 px-3 py-1.5 bg-foreground text-background text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl pointer-events-none">
                                        <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-foreground rotate-45" />
                                        {item.label}
                                    </div>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="p-4 mt-auto border-t border-border/60">
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                        <NavLink
                            to="/settings"
                            className={`flex items-center flex-1 min-w-0 cursor-pointer group/profile relative ${isCollapsed ? 'justify-center' : 'gap-3'}`}
                            title="Ver meu perfil"
                        >
                            <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0 uppercase transition-transform group-hover/profile:scale-105 overflow-hidden border-2 border-transparent group-hover/profile:border-primary">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Foto de perfil" className="w-full h-full object-cover" />
                                ) : (
                                    profile?.full_name?.charAt(0) || profile?.email.charAt(0) || 'U'
                                )}
                            </div>

                            {!isCollapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-foreground truncate group-hover/profile:text-primary transition-colors">{profile?.full_name || 'Usuário'}</p>
                                    {profile?.company_name && (
                                        <p className="text-[10px] font-medium text-muted-foreground truncate mt-0.5">{profile.company_name}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                        {isPro ? (
                                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded border bg-primary text-primary-foreground border-primary">PRO</span>
                                        ) : (
                                            <>
                                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded border bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60">FREE</span>
                                                <button
                                                    onClick={(e) => { e.preventDefault(); handleUpgrade(); }}
                                                    className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
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
                                <div className="absolute left-full ml-4 px-3 py-1.5 bg-foreground text-background text-xs font-bold rounded-lg opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all whitespace-nowrap z-50 shadow-xl pointer-events-none">
                                    <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-foreground rotate-45" />
                                    {profile?.full_name || 'Meu Perfil'}
                                </div>
                            )}
                        </NavLink>

                        {!isCollapsed && (
                            <button
                                onClick={handleSignOut}
                                className="text-muted-foreground hover:text-destructive transition-colors bg-transparent p-2 rounded-lg hover:bg-destructive/10 shrink-0"
                                title="Sair"
                                aria-label="Sair"
                            >
                                <LogOut size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            {/* ─── BARRA INFERIOR MOBILE (< lg) ─────────────────────────────── */}
            <nav
                className="lg:hidden fixed bottom-0 inset-x-0 z-[100] surface-glass border-t border-border/70 shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.25)]"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
                aria-label="Navegação principal"
            >
                <div className="flex items-stretch justify-around px-1 h-16">
                    {primaryMobile.map(item => {
                        const active = isItemActive(item);
                        return (
                            <NavLink
                                key={item.id}
                                to={item.id}
                                className={`
                                    relative flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 rounded-2xl transition-colors
                                    ${active ? 'text-primary' : 'text-muted-foreground active:bg-primary/5'}
                                `}
                            >
                                {active && <span className="absolute top-0 h-1 w-8 rounded-full bg-primary" />}
                                <item.icon size={22} strokeWidth={active ? 2.6 : 2} className="shrink-0" />
                                <span className={`text-[10px] leading-none truncate max-w-[64px] ${active ? 'font-bold' : 'font-medium'}`}>
                                    {item.label}
                                </span>
                            </NavLink>
                        );
                    })}

                    {/* Botão "Mais" */}
                    <button
                        onClick={() => setIsMoreOpen(true)}
                        className="relative flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 rounded-2xl text-muted-foreground active:bg-primary/5 transition-colors"
                        aria-label="Mais opções"
                        aria-haspopup="dialog"
                        aria-expanded={isMoreOpen}
                    >
                        <MoreHorizontal size={22} strokeWidth={2} className="shrink-0" />
                        <span className="text-[10px] leading-none font-medium">Mais</span>
                    </button>
                </div>
            </nav>

            {/* ─── SHEET "MAIS" (mobile) ────────────────────────────────────── */}
            {isMoreOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-[110] flex items-end bg-foreground/40 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setIsMoreOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Mais opções de navegação"
                >
                    <div
                        className="w-full bg-card rounded-t-3xl border-t border-border shadow-2xl p-5 animate-fadeUp"
                        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.25rem)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Handle + header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-11 h-11 rounded-full bg-primary/90 flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0 uppercase overflow-hidden">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Foto de perfil" className="w-full h-full object-cover" />
                                    ) : (
                                        profile?.full_name?.charAt(0) || profile?.email.charAt(0) || 'U'
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-foreground truncate">{profile?.full_name || 'Usuário'}</p>
                                    {profile?.company_name && (
                                        <p className="text-[11px] font-medium text-muted-foreground truncate">{profile.company_name}</p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setIsMoreOpen(false)}
                                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                                aria-label="Fechar"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {!isPro && (
                            <button
                                onClick={() => { setIsMoreOpen(false); handleUpgrade(); }}
                                className="w-full mb-4 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-md shadow-primary/20 active:scale-[0.99] transition-transform"
                            >
                                ✨ Fazer upgrade para o PRO
                            </button>
                        )}

                        {/* Grade de itens secundários */}
                        <div className="grid grid-cols-3 gap-2">
                            {secondaryMobile.map(item => {
                                const active = isItemActive(item);
                                return (
                                    <NavLink
                                        key={item.id}
                                        to={item.id}
                                        onClick={() => setIsMoreOpen(false)}
                                        className={`
                                            flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl border transition-colors
                                            ${active
                                                ? 'bg-primary/10 border-primary/30 text-primary'
                                                : 'bg-muted/40 border-border/60 text-foreground/80 active:bg-muted'}
                                        `}
                                    >
                                        <item.icon size={22} strokeWidth={2} className="shrink-0" />
                                        <span className="text-[11px] font-semibold text-center leading-tight px-1">{item.label}</span>
                                    </NavLink>
                                );
                            })}

                            <NavLink
                                to="/settings"
                                onClick={() => setIsMoreOpen(false)}
                                className={({ isActive }) => `
                                    flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl border transition-colors
                                    ${isActive
                                        ? 'bg-primary/10 border-primary/30 text-primary'
                                        : 'bg-muted/40 border-border/60 text-foreground/80 active:bg-muted'}
                                `}
                            >
                                <Settings size={22} strokeWidth={2} className="shrink-0" />
                                <span className="text-[11px] font-semibold text-center leading-tight">Configurações</span>
                            </NavLink>
                        </div>

                        <button
                            onClick={handleSignOut}
                            className="w-full mt-4 py-3 rounded-2xl bg-destructive/10 text-destructive text-sm font-bold flex items-center justify-center gap-2 active:bg-destructive/20 transition-colors"
                        >
                            <LogOut size={18} /> Sair da conta
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default AppSidebar;
