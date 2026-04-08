
import React, { useState, useMemo } from 'react';
import {
    Calendar as CalendarIcon,
    Clock,
    Users,
    Plus,
    Search,
    MessageSquare,
    Car,
    ChevronRight,
    CheckCircle2,
    XCircle,
    Save,
    ChevronLeft,
    ChevronDown,
    X,
    CalendarDays,
    LayoutList,
    UserPlus,
    Zap,
    List as ListIcon,
    PhoneCall,
    RefreshCw,
    Eye,
    ArrowRight
} from 'lucide-react';
import { format, isToday, parseISO, startOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, addDays, isPast, isFuture, isAfter, isBefore, addWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { vehicleService } from '../services/vehicleService';
import { formatCurrency } from '../utils/formatters';

import { supabase } from '../lib/supabaseClient';
import { CustomDatePicker } from './ui/CustomDatePicker';
import { CustomTimePicker } from './ui/CustomTimePicker';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { Lead, LeadPhase, LeadTemperature, VisitStatus } from '../types';

const Agenda: React.FC = () => {
    const { leads, vehicles, updateLead, addLead, loadData } = useData();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const now = useMemo(() => new Date(), []);

    // View State
    const [viewType, setViewType] = useState<'list' | 'calendar'>('list');
    const [agendaTab, setAgendaTab] = useState<'visits' | 'followups'>('visits');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [statusFilter, setStatusFilter] = useState<VisitStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState<string>(''); // YYYY-MM-DD
    const [followupFilter, setFollowupFilter] = useState<'overdue' | 'today' | 'upcoming' | 'nodate' | 'all'>('all');

    // Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [scheduleForm, setScheduleForm] = useState({
        leadId: '',
        vehicleId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '09:00',
        isNewLead: false,
        newLeadName: '',
        newLeadPhone: '',
        vehicleSearch: ''
    });
    const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
    const [isLeadDropdownOpen, setIsLeadDropdownOpen] = useState(false);
    const [leadSearch, setLeadSearch] = useState('');

    // Edit State
    const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
    const [tempDate, setTempDate] = useState('');

    // All Visits (not filtered yet)
    const baseVisits = useMemo(() => {
        return leads.flatMap(l => {
            const allVisits = [];
            const appointments = l.scheduling_data?.appointments || [];

            if (appointments.length > 0) {
                allVisits.push(...appointments.map(app => ({
                    ...l,
                    appointmentId: app.id,
                    visitDate: parseISO(app.date),
                    visit_status: (app.status || 'pending') as VisitStatus,
                    schedulingNotes: app.notes,
                    vehicleOfInterestId: app.vehicleOfInterest,
                    vehicle: vehicles.find(v => v.id === (app.vehicleOfInterest || l.presentedVehicles?.[l.presentedVehicles.length - 1]))
                })));
            } else if (l.visit_date) {
                allVisits.push({
                    ...l,
                    appointmentId: 'legacy', // Consistente com os handlers de update
                    visitDate: parseISO(l.visit_date),
                    visit_status: (l.visit_status || 'pending') as VisitStatus,
                    schedulingNotes: l.scheduling_data?.notes,
                    vehicleOfInterestId: l.scheduling_data?.vehicleOfInterest,
                    vehicle: vehicles.find(v => v.id === (l.scheduling_data?.vehicleOfInterest || l.presentedVehicles?.[l.presentedVehicles.length - 1]))
                });
            }
            return allVisits;
        });
    }, [leads, vehicles]);

    // Final visits list - all filters applied together
    const visits = useMemo(() => {
        return baseVisits
            .filter(v => {
                const q = searchQuery.toLowerCase();
                const matchesSearch = !searchQuery ||
                    v.name.toLowerCase().includes(q) ||
                    (v.phone && v.phone.includes(searchQuery));
                const matchesDate = !dateFilter ||
                    format(v.visitDate, 'yyyy-MM-dd') === dateFilter;
                const matchesStatus = statusFilter === 'all' ||
                    v.visit_status === statusFilter;
                return matchesSearch && matchesDate && matchesStatus;
            })
            .sort((a, b) => a.visitDate.getTime() - b.visitDate.getTime());
    }, [baseVisits, searchQuery, dateFilter, statusFilter]);

    // Visit pool (ignores status filter) - used for stats card counts
    const visitPool = useMemo(() => {
        return baseVisits.filter(v => {
            const q = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery ||
                v.name.toLowerCase().includes(q) ||
                (v.phone && v.phone.includes(searchQuery));
            const matchesDate = !dateFilter ||
                format(v.visitDate, 'yyyy-MM-dd') === dateFilter;
            return matchesSearch && matchesDate;
        });
    }, [baseVisits, searchQuery, dateFilter]);

    // All Follow-ups (not filtered yet)
    const baseFollowups = useMemo(() => {
        return leads
            .filter(l => l.phase === LeadPhase.FOLLOW_UP && l.follow_up_data?.nextContactDate)
            .map(l => ({
                ...l,
                contactDate: parseISO(l.follow_up_data!.nextContactDate!),
                vehicle: vehicles.find(v => v.id === l.presentedVehicles[l.presentedVehicles.length - 1])
            }));
    }, [leads, vehicles]);

    // Pool of follow-ups filtered by search and date
    const currentPoolFollowups = useMemo(() => {
        return baseFollowups.filter(f => {
            const matchesSearch = !searchQuery ||
                f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (f.phone && f.phone.includes(searchQuery));

            const matchesDate = !dateFilter || format(f.contactDate, 'yyyy-MM-dd') === dateFilter;

            return matchesSearch && matchesDate;
        });
    }, [baseFollowups, searchQuery, dateFilter]);

    // Final list for follow-ups
    const followups = useMemo(() => {
        let list = [...currentPoolFollowups];

        if (followupFilter === 'overdue') {
            list = list.filter(f => isPast(f.contactDate) && !isToday(f.contactDate));
        } else if (followupFilter === 'today') {
            list = list.filter(f => isToday(f.contactDate));
        } else if (followupFilter === 'upcoming') {
            list = list.filter(f => isAfter(f.contactDate, now) && !isToday(f.contactDate));
        }

        return list.sort((a, b) => a.contactDate.getTime() - b.contactDate.getTime());
    }, [currentPoolFollowups, followupFilter, now]);

    // Follow-ups without date (just in follow-up phase)
    const followupsNoDateFil = useMemo(() => {
        return leads
            .filter(l => l.phase === LeadPhase.FOLLOW_UP && !l.follow_up_data?.nextContactDate)
            .filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.phone?.includes(searchQuery));
    }, [leads, searchQuery]);

    const stats = useMemo(() => {
        // Stats from visitPool (respects search+date, ignores status filter)
        return {
            visitsTodayTotal: baseVisits.filter(v => isToday(v.visitDate)).length,
            visitsPending: visitPool.filter(v => v.visit_status === 'pending').length,
            visitsShow: visitPool.filter(v => v.visit_status === 'show').length,
            visitsNoShow: visitPool.filter(v => v.visit_status === 'noshow').length,
            visitsTotal: visitPool.length,
            followupsOverdue: currentPoolFollowups.filter(f => isPast(f.contactDate) && !isToday(f.contactDate)).length,
            followupsToday: currentPoolFollowups.filter(f => isToday(f.contactDate)).length,
            followupsUpcoming: currentPoolFollowups.filter(f => isAfter(f.contactDate, now) && !isToday(f.contactDate)).length,
            followupsNoDate: followupsNoDateFil.length,
        };
    }, [baseVisits, visitPool, currentPoolFollowups, followupsNoDateFil, now]);

    const handleUpdateVisitStatus = async (leadId: string, appointmentId: string, status: VisitStatus) => {
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return;

        let updatedAppointments = lead.scheduling_data?.appointments ? [...lead.scheduling_data.appointments] : [];
        const appointmentIndex = updatedAppointments.findIndex(a => a.id === appointmentId);

        if (appointmentIndex !== -1) {
            updatedAppointments[appointmentIndex] = { ...updatedAppointments[appointmentIndex], status };
        } else if (lead.visit_date && appointmentId === 'legacy') {
            updatedAppointments.push({
                id: crypto.randomUUID(),
                date: lead.visit_date,
                status: status,
                vehicleOfInterest: lead.scheduling_data?.vehicleOfInterest,
                notes: lead.scheduling_data?.notes
            });
        }

        try {
            await updateLead({
                ...lead,
                visit_status: status, // Also sync the root
                scheduling_data: {
                    ...(lead.scheduling_data || {}),
                    appointments: updatedAppointments
                }
            });
            showToast('success', `Status atualizado!`);
        } catch (error) {
            showToast('error', 'Erro ao atualizar.');
        }
    };

    const handleSaveDate = async (leadId: string, appointmentId: string) => {
        const lead = leads.find(l => l.id === leadId);
        if (!lead || !tempDate) return;

        let updatedAppointments = lead.scheduling_data?.appointments ? [...lead.scheduling_data.appointments] : [];
        const appointmentIndex = updatedAppointments.findIndex(a => a.id === appointmentId);
        const newDateIso = new Date(tempDate).toISOString();

        if (appointmentIndex !== -1) {
            updatedAppointments[appointmentIndex] = { ...updatedAppointments[appointmentIndex], date: newDateIso };
        } else if (lead.visit_date && appointmentId === 'legacy') {
            updatedAppointments.push({
                id: crypto.randomUUID(),
                date: newDateIso,
                status: lead.visit_status || 'pending',
                vehicleOfInterest: lead.scheduling_data?.vehicleOfInterest,
                notes: lead.scheduling_data?.notes
            });
        }

        try {
            await updateLead({
                ...lead,
                visit_date: newDateIso, // Sync root
                scheduling_data: {
                    ...(lead.scheduling_data || {}),
                    appointments: updatedAppointments
                }
            });
            setEditingVisitId(null);
            showToast('success', 'Agendamento atualizado!');
        } catch (error) {
            showToast('error', 'Erro ao atualizar data.');
        }
    };

    const getStatusLabel = (status: VisitStatus) => {
        switch (status) {
            case 'pending': return 'Pendente';
            case 'show': return 'Realizada';
            case 'noshow': return 'Faltou';
        }
    };

    const getStatusStyle = (status: VisitStatus) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-600';
            case 'show': return 'bg-emerald-100 text-emerald-600';
            case 'noshow': return 'bg-rose-100 text-rose-600';
        }
    };

    const handleScheduleVisit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let targetLeadId = scheduleForm.leadId;

            if (scheduleForm.isNewLead) {
                const newLead = await addLead({
                    name: scheduleForm.newLeadName,
                    phone: scheduleForm.newLeadPhone,
                    email: '',
                    phase: LeadPhase.NEW,
                    temperature: LeadTemperature.HOT,
                    preferences: {
                        tipos_veiculo: [],
                        marcas: [],
                        modelos: [],
                        transmissao: [],
                        motorizacao: [],
                        observacoes_adicionais: '',
                        possui_entrada: false,
                        possui_troca: false,
                        veiculo_troca: ''
                    },
                    presentedVehicles: [],
                    source: 'Agendamento Direto',
                    notes: 'Criado via agenda',
                    funnelHistory: { [LeadPhase.NEW]: new Date().toISOString() }
                } as any);
                targetLeadId = newLead.id;
            } else if (leadSearch) {
                // If the user typed a name but it's not a new lead and we don't have an ID, try to match or create
                const matchedLead = leads.find(l => l.name.toLowerCase() === leadSearch.toLowerCase() || l.phone === leadSearch);
                if (matchedLead) {
                    targetLeadId = matchedLead.id;
                } else {
                    showToast('error', 'Por favor, selecione um cliente existente válido ou crie um novo registro.');
                    return;
                }
            }

            const lead = leads.find(l => l.id === targetLeadId);
            if (lead) {
                const visitDateTime = new Date(`${scheduleForm.date}T${scheduleForm.time}`).toISOString();
                const presentedVehicles = [...(lead.presentedVehicles || [])];

                // Try to find the vehicle by ID based on search term matching brand + model
                const matchedVehicle = vehicles.find(v => `${v.brand} ${v.model}`.toLowerCase() === scheduleForm.vehicleSearch.toLowerCase());
                const vehicleIdToSave = matchedVehicle ? matchedVehicle.id : scheduleForm.vehicleSearch;

                if (vehicleIdToSave && !presentedVehicles.includes(vehicleIdToSave)) {
                    presentedVehicles.push(vehicleIdToSave);
                }

                const newAppointment = {
                    id: crypto.randomUUID(),
                    date: visitDateTime,
                    status: 'pending' as const,
                    vehicleOfInterest: vehicleIdToSave,
                    notes: 'Criado via agenda'
                };

                // Cria cópia do array para não mutar o estado diretamente
                const existingAppointments = [...(lead.scheduling_data?.appointments || [])];

                if (existingAppointments.length === 0 && lead.visit_date) {
                    existingAppointments.push({
                        id: crypto.randomUUID(),
                        date: lead.visit_date,
                        status: lead.visit_status || 'pending',
                        vehicleOfInterest: lead.scheduling_data?.vehicleOfInterest,
                        notes: lead.scheduling_data?.notes
                    });
                }

                await updateLead({
                    ...lead,
                    visit_date: visitDateTime,
                    visit_status: 'pending',
                    phase: LeadPhase.VISIT,
                    presentedVehicles,
                    tags: lead.tags || [],
                    scheduling_data: {
                        ...(lead.scheduling_data || {}),
                        appointments: [...existingAppointments, newAppointment]
                    }
                });

                showToast('success', 'Visita agendada!');
                setIsFormOpen(false);
                setScheduleForm({
                    leadId: '', vehicleId: '', date: format(new Date(), 'yyyy-MM-dd'), time: '09:00',
                    isNewLead: false, newLeadName: '', newLeadPhone: '', vehicleSearch: ''
                });
                loadData();
            }
        } catch (error) {
            showToast('error', 'Erro ao agendar visita.');
        }
    };

    const handleMarkFollowUpDone = async (lead: Lead) => {
        try {
            await updateLead({
                ...lead,
                follow_up_data: {
                    ...lead.follow_up_data,
                    notes: (lead.follow_up_data?.notes || '') + `\n✅ Contato realizado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`
                }
            });
            showToast('success', 'Follow-up marcado como realizado!');
        } catch (error) {
            showToast('error', 'Erro ao atualizar follow-up.');
        }
    };

    // Combined data for calendar view (ignores status filter for overview)
    const calendarItems = useMemo(() => {
        const visitItems = baseVisits
            .filter(v => !searchQuery ||
                v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (v.phone && v.phone.includes(searchQuery)))
            .map(v => ({
                id: v.appointmentId,
                leadId: v.id,
                date: v.visitDate,
                name: v.name,
                type: 'visit' as const,
                status: v.visit_status
            }));

        const followupItems = baseFollowups
            .filter(f => !searchQuery ||
                f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (f.phone && f.phone.includes(searchQuery)))
            .map(f => ({
                id: f.id + f.contactDate.getTime(),
                leadId: f.id,
                date: f.contactDate,
                name: f.name,
                type: 'followup' as const,
                status: undefined
            }));

        return [...visitItems, ...followupItems];
    }, [baseVisits, baseFollowups, searchQuery]);

    return (
        <div className="flex flex-col h-full space-y-6 animate-fadeIn pb-10" >
            <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-6 px-1">
                    <div className="flex items-center gap-3">
                        {/* Tab Selector */}
                        <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200/30 backdrop-blur-sm">
                            <button
                                onClick={() => setAgendaTab('visits')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-300 ${agendaTab === 'visits' ? 'bg-white text-emerald-600 shadow-md font-black ring-1 ring-emerald-500/10' : 'text-slate-500 hover:text-slate-700 font-bold'}`}
                            >
                                <CalendarDays size={15} />
                                <span className="text-[11px] uppercase tracking-wide">Visitas</span>
                                {stats.visitsPending > 0 && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${agendaTab === 'visits' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                        {stats.visitsPending}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setAgendaTab('followups')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-300 ${agendaTab === 'followups' ? 'bg-white text-blue-600 shadow-md font-black ring-1 ring-blue-500/10' : 'text-slate-500 hover:text-slate-700 font-bold'}`}
                            >
                                <PhoneCall size={15} />
                                <span className="text-[11px] uppercase tracking-wide">Follow-ups</span>
                                {(stats.followupsOverdue + stats.followupsToday) > 0 && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${agendaTab === 'followups' ? 'bg-red-50 text-red-600' : 'bg-slate-200 text-slate-500'}`}>
                                        {stats.followupsOverdue + stats.followupsToday}
                                    </span>
                                )}
                            </button>
                        </div>

                        <div className="h-10 w-px bg-slate-200 mx-1 hidden md:block" />

                        {/* View Type */}
                        <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
                            {(['list', 'calendar'] as const).map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setViewType(v)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${viewType === v ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700 font-semibold'}`}
                                >
                                    {v === 'list' ? <LayoutList size={15} strokeWidth={2.5} /> : <CalendarDays size={15} strokeWidth={2.5} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {agendaTab === 'visits' && (
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl text-[11px] font-bold uppercase tracking-wide hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/10 active:scale-95"
                        >
                            <Plus size={15} strokeWidth={3} /> Novo Agendamento
                        </button>
                    )}
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {agendaTab === 'visits' ? (
                        <>
                            <div
                                onClick={() => { setDateFilter(format(new Date(), 'yyyy-MM-dd')); setStatusFilter('all'); }}
                                className={`bg-white rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all active:scale-95 group ${dateFilter === format(new Date(), 'yyyy-MM-dd') ? 'border-emerald-500 ring-1 ring-emerald-500/10 shadow-sm' : 'border-slate-100'}`}
                            >
                                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                                    <CalendarDays size={16} className="text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-slate-900">{dateFilter ? stats.visitsTotal : stats.visitsTodayTotal}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{dateFilter ? 'Na Data' : 'Hoje'}</p>
                                </div>
                            </div>
                            <div
                                onClick={() => setStatusFilter('pending')}
                                className={`bg-white rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all active:scale-95 group ${statusFilter === 'pending' ? 'border-amber-500 ring-1 ring-amber-500/10 shadow-sm' : 'border-slate-100'}`}
                            >
                                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                                    <Clock size={16} className="text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-slate-900">{stats.visitsPending}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{dateFilter ? 'Pend. na Data' : 'Total Pendentes'}</p>
                                </div>
                            </div>
                            <div
                                onClick={() => setStatusFilter('show')}
                                className={`bg-white rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all active:scale-95 group ${statusFilter === 'show' ? 'border-emerald-500 ring-1 ring-emerald-500/10 shadow-sm' : 'border-slate-100'}`}
                            >
                                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-slate-900">{stats.visitsShow}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{dateFilter ? 'Real. na Data' : 'Total Realizadas'}</p>
                                </div>
                            </div>
                            <div
                                onClick={() => setStatusFilter('noshow')}
                                className={`bg-white rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all active:scale-95 group ${statusFilter === 'noshow' ? 'border-rose-500 ring-1 ring-rose-500/10 shadow-sm' : 'border-slate-100'}`}
                            >
                                <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                                    <XCircle size={16} className="text-rose-500" />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-slate-900">{stats.visitsNoShow}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{dateFilter ? 'Faltas na Data' : 'Total Faltaram'}</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div
                                onClick={() => setFollowupFilter('overdue')}
                                className={`bg-white rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all active:scale-95 group ${followupFilter === 'overdue' ? 'border-red-500 ring-1 ring-red-500/10 shadow-sm' : 'border-slate-100'}`}
                            >
                                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                                    <Clock size={16} className="text-red-500" />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-red-600">{stats.followupsOverdue}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Atrasados</p>
                                </div>
                            </div>
                            <div
                                onClick={() => setFollowupFilter('today')}
                                className={`bg-white rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all active:scale-95 group ${followupFilter === 'today' ? 'border-amber-500 ring-1 ring-amber-500/10 shadow-sm' : 'border-slate-100'}`}
                            >
                                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                                    <PhoneCall size={16} className="text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-slate-900">{stats.followupsToday}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Hoje</p>
                                </div>
                            </div>
                            <div
                                onClick={() => setFollowupFilter('upcoming')}
                                className={`bg-white rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all active:scale-95 group ${followupFilter === 'upcoming' ? 'border-blue-500 ring-1 ring-blue-500/10 shadow-sm' : 'border-slate-100'}`}
                            >
                                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                    <CalendarDays size={16} className="text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-slate-900">{stats.followupsUpcoming}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Próximos</p>
                                </div>
                            </div>
                            <div
                                onClick={() => setFollowupFilter('nodate')}
                                className={`bg-white rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all active:scale-95 group ${followupFilter === 'nodate' ? 'border-slate-500 ring-1 ring-slate-500/10 shadow-sm' : 'border-slate-100'}`}
                            >
                                <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                                    <Users size={16} className="text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-slate-900">{stats.followupsNoDate}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Sem Data</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px] space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-slate-400 px-1 block">Buscar</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <input
                                placeholder="Buscar por nome..."
                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500/5 transition-all outline-none"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {viewType === 'list' && (
                        <div className="space-y-1.5 min-w-[140px]">
                            <label className="text-[10px] font-bold uppercase text-slate-400 px-1 block flex justify-between items-center h-4">
                                Filtrar Data
                                {dateFilter && (
                                    <button onClick={() => setDateFilter('')} className="text-[8px] text-emerald-500 hover:text-emerald-700 font-extrabold flex items-center gap-0.5 transition-all">
                                        <X size={10} /> LIMPAR
                                    </button>
                                )}
                            </label>
                            <CustomDatePicker
                                value={dateFilter}
                                onChange={setDateFilter}
                                placeholder="Todas as datas"
                                className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-[11px] font-semibold focus:bg-white focus:border-emerald-500/30 transition-all outline-none flex items-center justify-between"
                            />
                        </div>
                    )}

                    {agendaTab === 'visits' && viewType === 'list' && (
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-slate-400 px-1 block">Status</label>
                            <div className="flex bg-white p-1.5 rounded-xl border border-slate-100 h-[45px]">
                                {(['all', 'pending', 'show', 'noshow'] as const).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setStatusFilter(f)}
                                        className={`px-3 rounded-lg text-[9px] font-bold uppercase tracking-tight transition-all ${statusFilter === f ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-100'}`}
                                    >
                                        {f === 'all' ? 'Todos' : getStatusLabel(f)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {viewType === 'calendar' && (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded-xl border border-slate-100 h-[45px]">
                                <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:text-emerald-500 text-slate-400"><ChevronLeft size={16} /></button>
                                <span className="text-[11px] font-black text-slate-900 uppercase min-w-[120px] text-center">{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</span>
                                <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:text-emerald-500 text-slate-400"><ChevronRight size={16} /></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div>
                {/* ===== VISITS TAB ===== */}
                {agendaTab === 'visits' && viewType === 'list' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {visits.length > 0 ? (
                            visits.map((visit) => (
                                <div key={visit.appointmentId} className="group relative bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden">
                                    <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                                        <div className={`px-2 py-1 rounded text-[9px] font-black uppercase ${isToday(visit.visitDate) ? 'bg-emerald-500 text-white' : isPast(visit.visitDate) ? 'bg-red-100 text-red-500' : 'bg-slate-100 text-slate-500'}`}>
                                            {isToday(visit.visitDate) ? '🟢 HOJE ' : isPast(visit.visitDate) ? '⚠️ ' : ''}{format(visit.visitDate, "dd/MM 'às' HH:mm")}
                                        </div>
                                        <button onClick={() => { setEditingVisitId(visit.appointmentId); setTempDate(format(visit.visitDate, "yyyy-MM-dd'T'HH:mm")); }} className="p-1.5 text-slate-300 hover:text-slate-900 transition-colors">
                                            <Clock size={14} />
                                        </button>
                                    </div>

                                    <div className="p-4 flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/leads/${visit.id}`)}>
                                        <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center text-sm font-black shrink-0 overflow-hidden">
                                            {visit.foto_url ? (
                                                <img src={visit.foto_url} alt={visit.name} className="w-full h-full object-cover rounded-lg" />
                                            ) : (
                                                visit.name.charAt(0)
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xs font-black text-slate-900 uppercase truncate leading-tight">{visit.name}</h3>
                                            <p className="text-[9px] font-bold text-slate-400 mt-0.5">{visit.phone}</p>
                                        </div>
                                    </div>

                                    <div className="px-4 pb-4 mt-auto">
                                        {visit.vehicle ? (
                                            <div className="bg-slate-50/50 rounded-xl p-3 flex items-center gap-3 border border-slate-100/50 mb-4 cursor-pointer"
                                                onClick={() => navigate('/inventory', { state: { selectedVehicleId: visit.vehicle!.id } })}>
                                                <Car size={14} className="text-emerald-500" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-slate-900 uppercase text-[9px] truncate">{visit.vehicle.brand} {visit.vehicle.model}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-50/50 rounded-xl p-2 border border-dashed border-slate-200 flex items-center justify-center mb-4">
                                                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest italic">Visita Simples</p>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between gap-2">
                                            <div className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase text-center ${getStatusStyle(visit.visit_status || 'pending')}`}>
                                                {getStatusLabel(visit.visit_status || 'pending')}
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => handleUpdateVisitStatus(visit.id, visit.appointmentId, visit.visit_status === 'show' ? 'pending' : 'show')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${visit.visit_status === 'show' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-50 text-slate-300 border border-slate-100 hover:text-emerald-600'}`}>
                                                    <CheckCircle2 size={16} />
                                                </button>
                                                <button onClick={() => handleUpdateVisitStatus(visit.id, visit.appointmentId, visit.visit_status === 'noshow' ? 'pending' : 'noshow')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${visit.visit_status === 'noshow' ? 'bg-rose-500 text-white shadow-sm' : 'bg-slate-50 text-slate-300 border border-slate-100 hover:text-rose-600'}`}>
                                                    <XCircle size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {editingVisitId === visit.appointmentId && (
                                        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col justify-center p-6 animate-fadeUp">
                                            <p className="text-[9px] font-black text-slate-900 text-center uppercase tracking-widest mb-4 italic">Reagendar</p>

                                            <div className="mb-3">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Data</label>
                                                <CustomDatePicker
                                                    value={tempDate ? tempDate.split('T')[0] : ''}
                                                    onChange={date => setTempDate(date + 'T' + (tempDate ? tempDate.split('T')[1] : '10:00'))}
                                                />
                                            </div>

                                            <div className="mb-4">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Horário</label>
                                                <CustomTimePicker
                                                    value={tempDate ? tempDate.split('T')[1] : ''}
                                                    onChange={time => setTempDate((tempDate ? tempDate.split('T')[0] : new Date().toISOString().split('T')[0]) + 'T' + time)}
                                                />
                                            </div>

                                            <div className="flex w-full gap-2 mt-2">
                                                <button onClick={() => setEditingVisitId(null)} className="flex-1 py-3 bg-white border border-slate-100 text-slate-400 rounded-lg text-[8px] font-black uppercase">Sair</button>
                                                <button onClick={() => handleSaveDate(visit.id, visit.appointmentId)} className="flex-1 py-3 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase flex items-center justify-center gap-2"><Save size={12} /> Salvar</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 flex flex-col items-center text-center opacity-20 select-none">
                                <CalendarIcon size={48} strokeWidth={1} />
                                <h3 className="text-sm font-black uppercase tracking-tight mt-2 italic">Sem Visitas no Momento</h3>
                            </div>
                        )}
                    </div>
                )}

                {/* ===== FOLLOW-UPS TAB ===== */}
                {
                    agendaTab === 'followups' && viewType === 'list' && (
                        <div className="space-y-6">
                            {/* Filter Summary */}
                            {followupFilter !== 'all' && (
                                <div className="flex items-center justify-between bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${followupFilter === 'overdue' ? 'bg-red-500' : followupFilter === 'today' ? 'bg-amber-500' : followupFilter === 'upcoming' ? 'bg-blue-500' : 'bg-slate-500'}`} />
                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                                            Filtrando por: {followupFilter === 'overdue' ? 'Atrasados' : followupFilter === 'today' ? 'Hoje' : followupFilter === 'upcoming' ? 'Próximos' : 'Sem Data'}
                                        </span>
                                    </div>
                                    <button onClick={() => setFollowupFilter('all')} className="text-[8px] font-black text-emerald-500 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg transition-all">LIMPAR FILTRO</button>
                                </div>
                            )}

                            {/* Overdue Follow-ups */}
                            {(followupFilter === 'all' || followupFilter === 'overdue') && followups.filter(f => isPast(f.contactDate) && !isToday(f.contactDate)).length > 0 && (
                                <div>
                                    <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2 px-1">
                                        <Clock size={12} /> Atrasados
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {followups.filter(f => isPast(f.contactDate) && !isToday(f.contactDate)).map(followup => (
                                            <FollowUpCard key={followup.id} lead={followup} contactDate={followup.contactDate} vehicle={followup.vehicle} type="overdue" onViewLead={() => navigate(`/leads/${followup.id}`)} onMarkDone={() => handleMarkFollowUpDone(followup)} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Today's Follow-ups */}
                            {(followupFilter === 'all' || followupFilter === 'today') && followups.filter(f => isToday(f.contactDate)).length > 0 && (
                                <div>
                                    <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2 px-1">
                                        <PhoneCall size={12} /> Contatos para Hoje
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {followups.filter(f => isToday(f.contactDate)).map(followup => (
                                            <FollowUpCard key={followup.id} lead={followup} contactDate={followup.contactDate} vehicle={followup.vehicle} type="today" onViewLead={() => navigate(`/leads/${followup.id}`)} onMarkDone={() => handleMarkFollowUpDone(followup)} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Upcoming Follow-ups */}
                            {(followupFilter === 'all' || followupFilter === 'upcoming') && followups.filter(f => isAfter(f.contactDate, now) && !isToday(f.contactDate)).length > 0 && (
                                <div>
                                    <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2 px-1">
                                        <CalendarDays size={12} /> Próximos Contatos
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {followups.filter(f => isAfter(f.contactDate, now) && !isToday(f.contactDate)).map(followup => (
                                            <FollowUpCard key={followup.id} lead={followup} contactDate={followup.contactDate} vehicle={followup.vehicle} type="upcoming" onViewLead={() => navigate(`/leads/${followup.id}`)} onMarkDone={() => handleMarkFollowUpDone(followup)} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Follow-ups without date */}
                            {(followupFilter === 'all' || followupFilter === 'nodate') && followupsNoDateFil.length > 0 && (
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 px-1">
                                        <Users size={12} /> Follow-ups Sem Data Definida
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {followupsNoDateFil.map(lead => (
                                            <div key={lead.id} className="bg-white border border-dashed border-slate-200 rounded-2xl p-4 flex items-center gap-3 hover:bg-slate-50/50 transition-all cursor-pointer" onClick={() => navigate(`/leads/${lead.id}`)}>
                                                <div className="w-10 h-10 rounded-lg bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-black shrink-0 overflow-hidden">
                                                    {lead.foto_url ? (
                                                        <img src={lead.foto_url} alt="" className="w-full h-full object-cover rounded-lg" />
                                                    ) : (
                                                        lead.name.charAt(0)
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-xs font-black text-slate-700 uppercase truncate">{lead.name}</h3>
                                                    <p className="text-[9px] font-medium text-slate-400">{lead.phone}</p>
                                                </div>
                                                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Sem data</span>
                                                <ChevronRight size={14} className="text-slate-300" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {followups.length === 0 && followupsNoDateFil.length === 0 && (
                                <div className="py-20 flex flex-col items-center text-center opacity-20 select-none">
                                    <PhoneCall size={48} strokeWidth={1} />
                                    <h3 className="text-sm font-black uppercase tracking-tight mt-2 italic">Nenhum Follow-up Encontrado</h3>
                                    <p className="text-xs font-medium mt-1">Mova leads para Follow-up para agendar contatos</p>
                                </div>
                            )}
                        </div>
                    )
                }

                {/* ===== CALENDAR VIEW ===== */}
                {
                    viewType === 'calendar' && (
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden animate-fadeUp">
                            <div className="grid grid-cols-7 gap-1">
                                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                                    <div key={`${day}-${i}`} className="py-2 text-[8px] font-black text-slate-300 uppercase text-center">{day}</div>
                                ))}
                                {(() => {
                                    const start = startOfWeek(startOfMonth(currentDate));
                                    const days = eachDayOfInterval({ start, end: addDays(start, 34) });
                                    return days.map(day => {
                                        const dayItems = calendarItems.filter(v => isSameDay(v.date, day));
                                        const isCurrentMonth = isSameMonth(day, currentDate);
                                        return (
                                            <div key={day.toISOString()} className={`min-h-[100px] p-2 rounded-xl border ${!isCurrentMonth ? 'opacity-10 grayscale' : isToday(day) ? 'bg-emerald-50/50 border-emerald-100' : 'border-slate-50 hover:bg-slate-50/30'} transition-all`}>
                                                <span className={`text-[9px] font-black ${isToday(day) ? 'text-emerald-500' : 'text-slate-300'}`}>{format(day, 'd')}</span>
                                                <div className="mt-1 space-y-0.5">
                                                    {dayItems.map(v => (
                                                        <div key={v.id} onClick={() => navigate(`/leads/${v.leadId}`)} className={`p-0.5 px-1 rounded text-[7px] font-black text-white truncate cursor-pointer ${v.type === 'visit' ? 'bg-slate-900 hover:bg-emerald-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
                                                            {format(v.date, 'HH:mm')} {v.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-slate-900"></div>
                                    <span className="text-[9px] font-bold text-slate-400">Visitas</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                                    <span className="text-[9px] font-bold text-slate-400">Follow-ups</span>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >

            {/* Schedule Modal */}
            {
                isFormOpen && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
                        <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl animate-fadeUp overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-black uppercase tracking-tight italic">Agendar Atendimento</h2>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Visitante Presencial</p>
                                </div>
                                <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-slate-50 rounded-lg transition-all group">
                                    <X size={20} className="text-slate-300 group-hover:rotate-90 transition-all" />
                                </button>
                            </div>

                            <form onSubmit={handleScheduleVisit} className="p-6 space-y-6 overflow-y-auto">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-2">
                                        <button type="button" onClick={() => setScheduleForm(prev => ({ ...prev, isNewLead: false }))}
                                            className={`py-3 rounded-xl border transition-all text-[9px] font-black uppercase flex flex-col items-center gap-1 ${!scheduleForm.isNewLead ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>
                                            <Users size={16} /> Existente
                                        </button>
                                        <button type="button" onClick={() => setScheduleForm(prev => ({ ...prev, isNewLead: true }))}
                                            className={`py-3 rounded-xl border transition-all text-[9px] font-black uppercase flex flex-col items-center gap-1 ${scheduleForm.isNewLead ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>
                                            <UserPlus size={16} /> Novo Registro
                                        </button>
                                    </div>

                                    {scheduleForm.isNewLead ? (
                                        <div className="space-y-3 animate-fadeUp">
                                            <input type="text" required placeholder="Nome Completo" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                                                value={scheduleForm.newLeadName} onChange={e => setScheduleForm(prev => ({ ...prev, newLeadName: e.target.value }))} />
                                            <input type="text" required placeholder="WhatsApp" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                                                value={scheduleForm.newLeadPhone} onChange={e => setScheduleForm(prev => ({ ...prev, newLeadPhone: e.target.value }))} />
                                        </div>
                                    ) : (
                                        <div className="relative animate-fadeUp">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Selecione o Cliente</label>
                                            <input
                                                type="text"
                                                placeholder="Buscar por nome ou telefone..."
                                                value={leadSearch}
                                                onChange={(e) => {
                                                    setLeadSearch(e.target.value);
                                                    setIsLeadDropdownOpen(true);
                                                }}
                                                onFocus={() => setIsLeadDropdownOpen(true)}
                                                onBlur={() => setTimeout(() => setIsLeadDropdownOpen(false), 200)}
                                                className="w-full text-xs font-bold p-3.5 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 transition-all outline-none"
                                            />
                                            {isLeadDropdownOpen && leadSearch && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto custom-scrollbar">
                                                    {leads
                                                        .filter(l =>
                                                            l.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
                                                            l.phone?.includes(leadSearch)
                                                        )
                                                        .map(l => (
                                                            <div
                                                                key={l.id}
                                                                className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                                                                onClick={() => {
                                                                    setLeadSearch(`${l.name} (${l.phone || 'Sem telefone'})`);
                                                                    setScheduleForm(prev => ({ ...prev, leadId: l.id }));
                                                                    setIsLeadDropdownOpen(false);
                                                                }}
                                                            >
                                                                <p className="text-sm font-bold text-slate-700">{l.name}</p>
                                                                <p className="text-[10px] font-bold text-emerald-600 mt-0.5">{l.phone || 'Sem telefone vazado'}</p>
                                                            </div>
                                                        ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <div className="relative">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Veículo de Interesse (Opcional)</label>
                                            <input
                                                type="text"
                                                placeholder="Ex: BYD Dolphin"
                                                value={scheduleForm.vehicleSearch}
                                                onChange={(e) => {
                                                    setScheduleForm({ ...scheduleForm, vehicleSearch: e.target.value });
                                                    setIsVehicleDropdownOpen(true);
                                                }}
                                                onFocus={() => setIsVehicleDropdownOpen(true)}
                                                onBlur={() => setTimeout(() => setIsVehicleDropdownOpen(false), 200)}
                                                className="w-full text-xs font-bold p-3.5 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 transition-all outline-none"
                                            />
                                            {isVehicleDropdownOpen && scheduleForm.vehicleSearch && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto custom-scrollbar">
                                                    {vehicles
                                                        .filter(v => v.status === 'available' && `${v.brand} ${v.model}`.toLowerCase().includes(scheduleForm.vehicleSearch.toLowerCase()))
                                                        .map(v => (
                                                            <div
                                                                key={v.id}
                                                                className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                                                                onClick={() => {
                                                                    setScheduleForm({ ...scheduleForm, vehicleSearch: `${v.brand} ${v.model}`, vehicleId: v.id });
                                                                    setIsVehicleDropdownOpen(false);
                                                                }}
                                                            >
                                                                <p className="text-sm font-bold text-slate-700">{v.brand} {v.model}</p>
                                                                <p className="text-[10px] font-bold text-emerald-600 mt-0.5">R$ {formatCurrency(v.price)}</p>

                                                            </div>
                                                        ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <CustomDatePicker className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                                                value={scheduleForm.date} onChange={val => setScheduleForm(prev => ({ ...prev, date: val }))} />
                                            <CustomTimePicker className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                                                value={scheduleForm.time} onChange={val => setScheduleForm(prev => ({ ...prev, time: val }))} />
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 mt-4">
                                    <Plus size={16} /> Finalizar Agendamento
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

// Follow-Up Card Component
interface FollowUpCardProps {
    lead: Lead & { contactDate?: Date; vehicle?: any };
    contactDate: Date;
    vehicle?: any;
    type: 'overdue' | 'today' | 'upcoming';
    onViewLead: () => void;
    onMarkDone: () => void;
}

const FollowUpCard: React.FC<FollowUpCardProps> = ({ lead, contactDate, vehicle, type, onViewLead, onMarkDone }) => {
    const borderColor = type === 'overdue' ? 'border-red-200' : type === 'today' ? 'border-amber-200' : 'border-blue-100';
    const bgTag = type === 'overdue' ? 'bg-red-500 text-white' : type === 'today' ? 'bg-amber-500 text-white' : 'bg-blue-100 text-blue-600';
    const tagLabel = type === 'overdue' ? '⚠️ ATRASADO' : type === 'today' ? '📞 HOJE' : format(contactDate, "dd/MM/yyyy");

    return (
        <div className={`bg-white border ${borderColor} rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden`}>
            <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                <div className={`px-2 py-1 rounded text-[9px] font-black uppercase ${bgTag}`}>
                    {tagLabel}
                </div>
                {lead.follow_up_data?.notes && (
                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest truncate max-w-[120px]" title={lead.follow_up_data.notes}>
                        {lead.follow_up_data.notes}
                    </span>
                )}
            </div>

            <div className="p-4 flex items-center gap-3 cursor-pointer" onClick={onViewLead}>
                <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center text-sm font-black shrink-0 overflow-hidden">
                    {lead.foto_url ? (
                        <img src={lead.foto_url} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                        lead.name.charAt(0)
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-black text-slate-900 uppercase truncate leading-tight">{lead.name}</h3>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">{lead.phone}</p>
                </div>
            </div>

            <div className="px-4 pb-4 mt-auto flex gap-2">
                <button onClick={onMarkDone} className="flex-1 py-2.5 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition-colors">
                    <CheckCircle2 size={12} /> Feito
                </button>
                <button onClick={onViewLead} className="flex-1 py-2.5 bg-slate-50 text-slate-500 rounded-lg text-[8px] font-black uppercase flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-colors">
                    <Eye size={12} /> Ver Lead
                </button>
            </div>
        </div>
    );
};

export default Agenda;
