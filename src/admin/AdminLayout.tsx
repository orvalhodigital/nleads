import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { LogOut, Users, Settings, Bell, Tag, Quote, Rocket, CheckCircle2, LifeBuoy, TrendingUp, Shield, Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useSystemSettings } from '../hooks/useSystemSettings';
import { LogoRenderer } from '../components/OtimizzaLogo';
import AdminErrorBoundary from './AdminErrorBoundary';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { logoUrl } = useSystemSettings();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/paineldoadm/login');
    };

    const isActive = (path: string) => {
        const current = location.pathname.replace(/\/+$/, '');
        const target = path.replace(/\/+$/, '');
        // Dashboard (raiz) só fica ativo na rota exata
        if (target === '/paineldoadm') return current === '/paineldoadm';
        // Demais itens ativam na própria rota ou em sub-rotas (ex: /users/:id)
        return current === target || current.startsWith(target + '/');
    };

    const navGroups: NavGroup[] = [
        {
            title: 'Gestão',
            items: [
                { label: 'Dashboard', path: '/paineldoadm', icon: <CheckCircle2 size={18} /> },
                { label: 'Usuários', path: '/paineldoadm/users', icon: <Users size={18} /> },
                { label: 'Vendas', path: '/paineldoadm/sales', icon: <TrendingUp size={18} /> },
            ]
        },
        {
            title: 'Conteúdo',
            items: [
                { label: 'Onboarding & CS', path: '/paineldoadm/onboarding', icon: <Rocket size={18} /> },
                { label: 'Frases', path: '/paineldoadm/quotes', icon: <Quote size={18} /> },
                { label: 'Planos & Ofertas', path: '/paineldoadm/plans', icon: <Tag size={18} /> },
            ]
        },
        {
            title: 'Suporte',
            items: [
                { label: 'Notificações', path: '/paineldoadm/notifications', icon: <Bell size={18} /> },
                { label: 'Tickets', path: '/paineldoadm/tickets', icon: <LifeBuoy size={18} /> },
                { label: 'Audit Log', path: '/paineldoadm/audit-log', icon: <Shield size={18} /> },
                { label: 'Configurações', path: '/paineldoadm/settings', icon: <Settings size={18} /> },
            ]
        },
    ];

    return (
        <div className="h-screen bg-slate-50 flex overflow-hidden font-sans">
            {/* Mobile Hamburger Button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-black text-white rounded-lg"
            >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar Overlay (mobile) */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 md:hidden z-30"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } md:translate-x-0 w-64 bg-black text-white flex flex-col fixed md:static h-full z-40 transition-transform duration-300 border-r border-zinc-800`}>
                <div className="p-6 flex items-center gap-3">
                    <LogoRenderer src={logoUrl} variant="horizontal" className="h-8 w-auto" light={true} />
                </div>

                <nav className="flex-1 px-4 space-y-6 mt-4 overflow-y-auto">
                    {navGroups.map((group) => (
                        <div key={group.title}>
                            <h3 className="text-xs font-bold uppercase text-zinc-400 px-4 mb-3 tracking-wider">{group.title}</h3>
                            <div className="space-y-2">
                                {group.items.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${
                                            isActive(item.path)
                                                ? 'bg-white text-black shadow-lg shadow-white/10'
                                                : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
                                        }`}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t border-zinc-900">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 text-zinc-500 hover:text-red-500 transition-colors w-full px-4 py-2 hover:bg-zinc-900 rounded-lg text-sm font-medium"
                    >
                        <LogOut size={16} />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen bg-slate-50 pt-16 md:pt-8">
                <div className="max-w-6xl mx-auto pb-12">
                    <AdminErrorBoundary key={location.pathname}>
                        <Outlet />
                    </AdminErrorBoundary>
                </div>
            </main>
        </div>
    );
}
