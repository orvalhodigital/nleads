import React, { useState, useEffect } from 'react';
import {
    Search,
    Settings,
    Bell,
    X,
    MessageCircle,
    CheckCheck,
    History,
    Loader2,
    Download,
    Upload,
    Database,
    Sun,
    Moon
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { View, Lead, Vehicle } from '../types';
import { notificationService, Notification } from '../services/notificationService';
import { leadService } from '../services/leadService';
import { vehicleService } from '../services/vehicleService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '../contexts/ToastContext';
import { useData } from '../contexts/DataContext';
import { motorcycleService } from '../services/motorcycleService';
import { useSystemSettings } from '../hooks/useSystemSettings';
import { LogoRenderer } from './OtimizzaLogo';

interface HeaderProps {
    currentView: View;
    impersonatedUserId?: string;
    onNavigate?: (view: View) => void;
    companyName?: string;
}

const Header: React.FC<HeaderProps> = ({ currentView, impersonatedUserId, onNavigate, companyName }) => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { profile, isEmpresa } = useData();
    const { logoUrl } = useSystemSettings();
    const adminId = isEmpresa ? profile?.id : profile?.parent_id;
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [leadsResults, setLeadsResults] = useState<Lead[]>([]);
    const [vehicleResults, setVehicleResults] = useState<Vehicle[]>([]);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [searching, setSearching] = useState(false);

    // Notification State
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (searchTerm.length > 2) {
                setSearching(true);
                setShowSearchDropdown(true);
                try {
                    const effectiveUserId = isEmpresa ? undefined : (profile?.id || impersonatedUserId);
                    const searchPromises: Promise<{ type: string, data: any[] }>[] = [
                        leadService.search(searchTerm, effectiveUserId, adminId).then(data => ({ type: 'leads', data }))
                    ];

                    if (profile?.enable_cars !== false) {
                        searchPromises.push(vehicleService.search(searchTerm, effectiveUserId, adminId).then(data => ({ type: 'vehicles', data })));
                    }

                    if (profile?.enable_motorcycles) {
                        searchPromises.push(motorcycleService.search(searchTerm, effectiveUserId, adminId).then(data => ({ type: 'motorcycles', data })));
                    }

                    const results = await Promise.all(searchPromises);

                    const foundLeads = results.find(r => r.type === 'leads')?.data || [];
                    const foundVehicles = results.find(r => r.type === 'vehicles')?.data || [];
                    const foundMotos = results.find(r => r.type === 'motorcycles')?.data || [];

                    setLeadsResults(foundLeads);

                    const combinedVehicles = [
                        ...foundVehicles,
                        ...foundMotos.map(m => ({ ...m, isMoto: true }))
                    ];
                    setVehicleResults(combinedVehicles);
                } catch (error) {
                    console.error("Search error", error);
                } finally {
                    setSearching(false);
                }
            } else {
                setShowSearchDropdown(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [searchTerm, impersonatedUserId, profile?.enable_motorcycles]);

    const handleResultClick = (type: 'lead' | 'vehicle', id: string, isMoto?: boolean) => {
        setShowSearchDropdown(false);
        setSearchTerm('');

        if (type === 'lead') {
            navigate(`/leads/${id}`);
        } else {
            const path = isMoto ? '/motorcycles' : '/inventory';
            const stateKey = isMoto ? 'selectedMotorcycleId' : 'selectedVehicleId';
            navigate(path, { state: { [stateKey]: id } });
        }
    };

    useEffect(() => {
        if (isNotificationsOpen) {
            loadNotifications();
        } else {
            // Also load unread count when closed for the badge
            loadUnreadCount();
        }
    }, [isNotificationsOpen, showHistory, impersonatedUserId]);

    const loadUnreadCount = async () => {
        try {
            const data = await notificationService.getUnread(impersonatedUserId);
            // We just need to know if there are any for the badge helper, 
            // but for simplicity we can just store them in state if we want, or separate count state.
            // For now, let's just reuse setNotifications if we are not filtering history.
            if (!showHistory && !isNotificationsOpen) {
                setNotifications(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const data = showHistory
                ? await notificationService.getHistory(impersonatedUserId)
                : await notificationService.getUnread(impersonatedUserId);
            setNotifications(data);
        } catch (error) {
            console.error('Erro ao carregar notificações', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead(impersonatedUserId);
            setNotifications([]);
        } catch (error) {
            console.error(error);
        }
    };

    const { showToast } = useToast();
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);

    const handleConnectWhatsApp = () => {
        // Open popup for webhook
        const url = 'https://webhook.orvalhodigital.com.br/webhook/nLeads-veiculos-criar-instancia';
        const width = 600;
        const height = 700;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        window.open(
            url,
            'ConnectWhatsApp',
            `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=yes`
        );
    };

    const handleExportData = async () => {
        setExporting(true);
        try {
            const effectiveUserId = isEmpresa ? undefined : (profile?.id || impersonatedUserId);
            const [leads, vehicles] = await Promise.all([
                leadService.getAll(effectiveUserId, adminId, isEmpresa),
                vehicleService.getAll(effectiveUserId, adminId)
            ]);

            const data = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                leads,
                vehicles
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `otimizza_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast('success', 'Backup exportado com sucesso!');
        } catch (error) {
            console.error(error);
            showToast('error', 'Erro ao exportar dados.');
        } finally {
            setExporting(false);
        }
    };

    const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (!data.leads || !data.vehicles) throw new Error("Formato inválido. O arquivo deve conter leads e veículos.");

            // Import Leads
            const leadMap: Record<string, string> = {};

            for (const lead of data.leads) {
                const newLead = await leadService.create({
                    name: lead.name,
                    phone: lead.phone,
                    email: lead.email,
                    phase: lead.phase,
                    temperature: lead.temperature,
                    preferences: lead.preferences,
                    presentedVehicles: lead.presentedVehicles,
                    source: lead.source,
                    notes: lead.notes,
                    funnelHistory: lead.funnelHistory
                });
                leadMap[lead.id] = newLead.id;
            }

            // Import Vehicles
            for (const vehicle of data.vehicles) {
                let saleDetails = vehicle.saleDetails;
                if (saleDetails && saleDetails.buyerLeadId && leadMap[saleDetails.buyerLeadId]) {
                    saleDetails = { ...saleDetails, buyerLeadId: leadMap[saleDetails.buyerLeadId] };
                }

                await vehicleService.create({
                    brand: vehicle.brand,
                    model: vehicle.model,
                    year: vehicle.year,
                    modelYear: vehicle.modelYear,
                    plate: vehicle.plate,
                    price: vehicle.price,
                    type: vehicle.type,
                    transmission: vehicle.transmission,
                    engine: vehicle.engine,
                    mileage: vehicle.mileage,
                    color: vehicle.color,
                    isSingleOwner: vehicle.isSingleOwner,
                    isServiceHistoryComplete: vehicle.isServiceHistoryComplete,
                    isIpvaPaid: vehicle.isIpvaPaid,
                    hasWarranty: vehicle.hasWarranty,
                    optionals: vehicle.optionals,
                    imageUrl: vehicle.imageUrl,
                    galleryImages: vehicle.galleryImages || [],
                    status: vehicle.status,
                    saleDetails: saleDetails
                });
            }

            showToast('success', 'Dados importados com sucesso! A página será recarregada.');
            setTimeout(() => window.location.reload(), 2000);

        } catch (error: any) {
            console.error(error);
            showToast('error', `Erro ao importar: ${error.message}`);
        } finally {
            setImporting(false);
            e.target.value = '';
        }
    };

    const getTitle = () => {
        switch (currentView) {
            case 'home': return '';
            case 'dashboard': return 'Métricas';
            case 'inventory': return 'Estoque';
            case 'motorcycles': return 'Estoque de Motos';
            case 'sales-flow': return 'Fluxo de Vendas';
            case 'sales-closed': return 'Vendas Fechadas';
            case 'settings': return 'Configurações';
            case 'support': return 'Suporte Técnico';
            case 'admin-tickets': return 'Gerenciamento de Tickets';
            default: return 'Gestão de Leads';
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <>
            <header className="h-16 md:h-20 bg-white/40 backdrop-blur-3xl border-b border-white/50 px-4 lg:px-10 flex items-center justify-between sticky top-0 z-40 shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                    {/* Logo - Mobile only */}
                    <div
                        onClick={() => navigate('/')}
                        className="flex md:hidden h-[90px] w-[90px] shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        title="Página Inicial"
                    >
                        {profile?.company_logo ? (
                            <img src={profile.company_logo} alt="Company Logo" className="h-full w-full object-contain" />
                        ) : (
                            <LogoRenderer src={logoUrl} variant="horizontal" className="h-full w-auto" />
                        )}
                    </div>

                    <div>
                        {currentView !== 'home' && (
                            <>
                                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                                    {getTitle()}
                                </h2>
                                {companyName && (
                                    <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest -mt-0.5">
                                        {companyName}
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 lg:gap-8">
                    <div className="relative hidden md:flex items-center group">
                        <Search size={16} className="absolute left-4 text-slate-400 group-focus-within:text-brand-500 transition-colors pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Pesquisar..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold w-64 focus:bg-white focus:border-brand-500 outline-none transition-all"
                        />

                        {/* Search Dropdown */}
                        {showSearchDropdown && (searchTerm.length > 2) && (
                            <div className="absolute top-12 left-0 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 max-h-96 overflow-y-auto z-50 animate-fadeUp">
                                {searching ? (
                                    <div className="flex items-center justify-center p-4 text-slate-400">
                                        <Loader2 className="animate-spin mr-2" size={16} /> Pesquisando...
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Leads Section */}
                                        <div>
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Leads</h4>
                                            {leadsResults.length === 0 ? (
                                                <p className="text-xs text-slate-300 px-2 italic">Nenhum lead encontrado.</p>
                                            ) : (
                                                <ul className="space-y-1">
                                                    {leadsResults.map(lead => (
                                                        <li key={lead.id}>
                                                            <button
                                                                onClick={() => handleResultClick('lead', lead.id)}
                                                                className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors group"
                                                            >
                                                                <p className="text-sm font-bold text-slate-800 group-hover:text-brand-600">{lead.name}</p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <div className="flex items-center gap-1 text-[10px] bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded-md font-bold">
                                                                        <MessageCircle size={10} fill="currentColor" fillOpacity={0.2} />
                                                                        {lead.phone}
                                                                    </div>
                                                                    <span className="text-[10px] text-slate-300">•</span>
                                                                    <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{lead.email}</p>
                                                                </div>
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>

                                        {/* Vehicles Section */}
                                        <div>
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2 border-t border-slate-100 pt-3">Veículos</h4>
                                            {vehicleResults.length === 0 ? (
                                                <p className="text-xs text-slate-300 px-2 italic">Nenhum veículo encontrado.</p>
                                            ) : (
                                                <ul className="space-y-1">
                                                    {vehicleResults.map(vehicle => (
                                                        <li key={vehicle.id}>
                                                            <button
                                                                onClick={() => handleResultClick('vehicle', vehicle.id, (vehicle as any).isMoto)}
                                                                className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors group"
                                                            >
                                                                <p className="text-sm font-bold text-slate-800 group-hover:text-brand-600">{vehicle.brand} {vehicle.model}</p>
                                                                <p className="text-[10px] text-slate-400">{vehicle.year} • {vehicle.color}</p>
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Tema Switcher: Dia / Noite */}
                        <button
                            onClick={toggleTheme}
                            className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800/80 border border-border/80 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-all duration-300 group shrink-0"
                            title={theme === 'dia' ? "Ativar Modo Noite (Escuro)" : "Ativar Modo Dia (Claro)"}
                        >
                            <span className="relative flex items-center justify-center w-5 h-5 rounded-full bg-white dark:bg-slate-950 shadow-sm text-amber-500 dark:text-purple-400 transition-all duration-300">
                                {theme === 'dia' ? <Sun size={12} fill="currentColor" /> : <Moon size={12} fill="currentColor" />}
                            </span>
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider hidden sm:inline pr-1">
                                {theme === 'dia' ? 'Dia' : 'Noite'}
                            </span>
                        </button>

                        <LogoRenderer src={logoUrl} variant="icon" className="h-5 w-auto opacity-50 hover:opacity-100 transition-all mr-2 hidden sm:flex" />
                        <button onClick={() => { setIsNotificationsOpen(true); }} className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-slate-800 rounded-lg transition-all relative">
                            <Bell size={18} />
                            {unreadCount > 0 && !showHistory && (
                                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-brand-500 rounded-full border border-white"></span>
                            )}
                        </button>
                        <button onClick={() => navigate('/settings')} className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-slate-800 rounded-lg transition-all">
                            <Settings size={18} />
                        </button>
                    </div>
                </div>
            </header>


            {/* Notifications Modal */}
            {isNotificationsOpen && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex justify-end" onClick={() => setIsNotificationsOpen(false)}>
                    <div className="w-full max-w-sm bg-white h-full shadow-2xl animate-fadeLeft p-6 flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 tracking-tight">
                                    {showHistory ? 'Histórico' : 'Notificações'}
                                </h2>
                                <p className="text-xs text-slate-400 font-medium mt-1">Alertas e atualizações</p>
                            </div>
                            <button onClick={() => setIsNotificationsOpen(false)} className="text-slate-300 hover:text-slate-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setShowHistory(false)}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${!showHistory ? 'bg-brand-100 text-brand-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                            >
                                Não Lidas
                            </button>
                            <button
                                onClick={() => setShowHistory(true)}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${showHistory ? 'bg-brand-100 text-brand-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                            >
                                <History size={14} /> Histórico
                            </button>

                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4">
                            {loading ? (
                                <div className="text-center py-10 text-slate-400 text-xs">Carregando...</div>
                            ) : notifications.length === 0 ? (
                                <div className="text-center py-10">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                                        <CheckCheck size={24} />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400">
                                        {showHistory ? 'Sem histórico recente.' : 'Você não tem mais notificações.'}
                                    </p>
                                </div>
                            ) : (
                                notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        onClick={() => !showHistory && handleMarkAsRead(notification.id)}
                                        className={`p-4 border rounded-2xl flex gap-3 items-start transition-all cursor-pointer group
                                            ${showHistory ? 'bg-slate-50 border-slate-100 opacity-75' : 'bg-white border-slate-100 hover:border-brand-200 hover:shadow-sm'}
                                        `}
                                    >
                                        <div className={`p-2 rounded-lg shrink-0 ${showHistory ? 'bg-slate-200 text-slate-500' : 'bg-brand-100 text-brand-600'}`}>
                                            <Bell size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800">{notification.title}</h4>
                                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notification.message}</p>
                                            <span className="text-[10px] font-bold text-slate-300 mt-2 block uppercase tracking-wider">
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {!showHistory && notifications.length > 0 && (
                            <div className="mt-auto pt-4 border-t border-slate-100">
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="w-full py-3 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-brand-500 transition-colors"
                                >
                                    Marcar todas como lidas
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
