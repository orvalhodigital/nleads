import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { LogOut, Users, Settings, Bell, Car, Tag, Quote, Rocket, Calendar, CheckCircle2, Clock, LifeBuoy, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useSystemSettings } from '../hooks/useSystemSettings';

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { logoUrl } = useSystemSettings();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/paineldoadm/login');
    };

    const isActive = (path: string) => {
        if (path === '' && location.pathname === '/paineldoadm') return true;
        if (path !== '' && location.pathname.includes(path)) return true;
        return false;
    };

    return (
        <div className="h-screen bg-slate-50 flex overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-black text-white flex flex-col fixed h-full z-10 transition-all duration-300 border-r border-zinc-800">
                <div className="p-6 flex items-center gap-3">
                    {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black">
                                <Car size={16} strokeWidth={3} />
                            </div>
                            <h2 className="text-lg font-bold tracking-tight">nLeads <span className="text-zinc-500">Admin</span></h2>
                        </div>
                    )}
                </div>
                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <Link
                        to="/paineldoadm"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${isActive('dashboard') || location.pathname === '/paineldoadm' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}
                    >
                        <CheckCircle2 size={18} />
                        Dashboard
                    </Link>
                    <Link
                        to="/paineldoadm/users"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${isActive('users') ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}
                    >
                        <Users size={18} />
                        Usuários
                    </Link>
                    <Link
                        to="/paineldoadm/leads"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${isActive('leads') ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}
                    >
                        <MessageSquare size={18} />
                        Leads
                    </Link>
                    <Link
                        to="/paineldoadm/vehicles"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${isActive('vehicles') ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}
                    >
                        <Car size={18} />
                        Veículos
                    </Link>
                    <Link
                        to="/paineldoadm/settings"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${isActive('settings') ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}
                    >
                        <Settings size={18} />
                        Configurações
                    </Link>
                    <Link
                        to="/paineldoadm/notifications"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${isActive('notifications') ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}
                    >
                        <Bell size={18} />
                        Notificações
                    </Link>
                    <Link
                        to="/paineldoadm/onboarding"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${isActive('onboarding') ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}
                    >
                        <Rocket size={18} />
                        Onboarding & CS
                    </Link>
                    <Link
                        to="/paineldoadm/quotes"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${isActive('quotes') ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}
                    >
                        <Quote size={18} />
                        Frases
                    </Link>
                    <Link
                        to="/paineldoadm/plans"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${isActive('plans') ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}
                    >
                        <Tag size={18} />
                        Planos & Ofertas
                    </Link>
                    <Link
                        to="/paineldoadm/tickets"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${isActive('tickets') ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}
                    >
                        <LifeBuoy size={18} />
                        Tickets de Suporte
                    </Link>
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
            <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen bg-slate-50">
                <div className="max-w-6xl mx-auto pb-12">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
