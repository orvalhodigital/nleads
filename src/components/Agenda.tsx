import React, { useState, useMemo, useCallback } from 'react';
import {
    Plus,
    CalendarDays,
    LayoutList,
    PhoneCall
} from 'lucide-react';
import { format, isToday, parseISO, startOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, addDays, isPast, isAfter } from 'date-fns';
import { useInventoryContext } from '../contexts/InventoryContext';
import { useLeadContext } from '../contexts/LeadContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lead, LeadPhase, LeadTemperature, VisitStatus } from '../types';
import ScheduleVisitModal, { ScheduleFormData } from './ScheduleVisitModal';
import ScheduleFollowUpModal from './ScheduleFollowUpModal';
import { deriveRootVisitFields } from '../utils/visits';
import { generateUUID } from '../utils/uuid';
import { AgendaStats } from './agenda/AgendaStats';
import { AgendaFilters } from './agenda/AgendaFilters';
import { AgendaVisitsList } from './agenda/AgendaVisitsList';
import { AgendaFollowupsList } from './agenda/AgendaFollowupsList';
import { AgendaCalendarView } from './agenda/AgendaCalendarView';

const Agenda: React.FC = () => {
    const { vehicles } = useInventoryContext();
    const { leads, updateLead, addLead } = useLeadContext();
    const { loadData } = useData();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const now = useMemo(() => new Date(), []);

    const tabParam = searchParams.get('tab');
    const agendaTab = useMemo<'visits' | 'followups'>(() => {
        if (tabParam === 'followups' || tabParam === 'followup') return 'followups';
        return 'visits';
    }, [tabParam]);

    const setAgendaTab = useCallback((tab: 'visits' | 'followups') => {
        setSearchParams({ tab: tab === 'followups' ? 'followups' : 'visitas' });
    }, [setSearchParams]);

    // View State
    const [viewType, setViewType] = useState<'list' | 'calendar'>('list');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [statusFilter, setStatusFilter] = useState<VisitStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState<string>(''); // YYYY-MM-DD
    const [followupFilter, setFollowupFilter] = useState<'overdue' | 'today' | 'upcoming' | 'nodate' | 'all'>('all');

    // Modal State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isFollowUpFormOpen, setIsFollowUpFormOpen] = useState(false);

    // Edit State
    const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
    const [tempDate, setTempDate] = useState('');

    // Optimization: Create a vehicle map for O(1) lookup
    const vehicleMap = useMemo(() => {
        const map = new Map();
        vehicles.forEach(v => map.set(v.id, v));
        return map;
    }, [vehicles]);

    // All Visits (not filtered yet)
    const baseVisits = useMemo(() => {
        const allVisits: any[] = [];
        
        // Using a single loop for performance on large lists
        for (const l of leads) {
            const appointments = l.scheduling_data?.appointments || [];

            if (appointments.length > 0) {
                for (const app of appointments) {
                    if (!app.date) continue; // Safety check
                    const vDate = parseISO(app.date);
                    if (isNaN(vDate.getTime())) continue; // Invalid date safety

                    const vehicleId = app.vehicleOfInterest || (l.presentedVehicles?.length ? l.presentedVehicles[l.presentedVehicles.length - 1] : undefined);
                    allVisits.push({
                        ...l,
                        appointmentId: app.id,
                        visitDate: vDate,
                        visit_status: (app.status || 'pending') as VisitStatus,
                        schedulingNotes: app.notes,
                        vehicleOfInterestId: app.vehicleOfInterest,
                        vehicle: vehicleMap.get(vehicleId)
                    });
                }
            } else if (l.visit_date) {
                const vDate = parseISO(l.visit_date);
                if (isNaN(vDate.getTime())) {
                    // Skip or handle corrupted legacy date
                } else {
                    const vehicleId = l.scheduling_data?.vehicleOfInterest || (l.presentedVehicles?.length ? l.presentedVehicles[l.presentedVehicles.length - 1] : undefined);
                    allVisits.push({
                        ...l,
                        appointmentId: 'legacy',
                        visitDate: vDate,
                        visit_status: (l.visit_status || 'pending') as VisitStatus,
                        schedulingNotes: l.scheduling_data?.notes,
                        vehicleOfInterestId: l.scheduling_data?.vehicleOfInterest,
                        vehicle: vehicleMap.get(vehicleId)
                    });
                }
            }
        }
        return allVisits;
    }, [leads, vehicleMap]);

    // Final visits list - all filters applied together
    const visits = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return baseVisits
            .filter(v => {
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
        const q = searchQuery.toLowerCase();
        return baseVisits.filter(v => {
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
            .map(l => {
                const cDate = parseISO(l.follow_up_data!.nextContactDate!);
                if (isNaN(cDate.getTime())) return null; // Safety check
                
                return {
                    ...l,
                    contactDate: cDate,
                    vehicle: (l.presentedVehicles?.length ? vehicleMap.get(l.presentedVehicles[l.presentedVehicles.length - 1]) : undefined)
                };
            })
            .filter((f): f is any => f !== null); // Filter out invalid entries
    }, [leads, vehicleMap]);

    // Pool of follow-ups filtered by search and date
    const currentPoolFollowups = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return baseFollowups.filter(f => {
            const matchesSearch = !searchQuery ||
                f.name.toLowerCase().includes(q) ||
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
        const q = searchQuery.toLowerCase();
        return leads
            .filter(l => l.phase === LeadPhase.FOLLOW_UP && !l.follow_up_data?.nextContactDate)
            .filter(f => !searchQuery || f.name.toLowerCase().includes(q) || f.phone?.includes(searchQuery));
    }, [leads, searchQuery]);

    const stats = useMemo(() => {
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

    const handleUpdateVisitStatus = useCallback(async (leadId: string, appointmentId: string, status: VisitStatus) => {
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return;

        let updatedAppointments = lead.scheduling_data?.appointments ? [...lead.scheduling_data.appointments] : [];
        const appointmentIndex = updatedAppointments.findIndex(a => a.id === appointmentId);

        if (appointmentIndex !== -1) {
            updatedAppointments[appointmentIndex] = { ...updatedAppointments[appointmentIndex], status };
        } else if (lead.visit_date && appointmentId === 'legacy') {
            updatedAppointments.push({
                id: generateUUID(),
                date: lead.visit_date,
                status: status,
                vehicleOfInterest: lead.scheduling_data?.vehicleOfInterest,
                notes: lead.scheduling_data?.notes
            });
        }

        try {
            // Deriva visit_date/visit_status do agendamento mais recente, em vez de
            // sobrescrever incondicionalmente com o agendamento que acabou de ser
            // editado (que pode ser um mais antigo sendo corrigido retroativamente).
            await updateLead({
                ...lead,
                ...deriveRootVisitFields(updatedAppointments),
                scheduling_data: {
                    ...(lead.scheduling_data || {}),
                    appointments: updatedAppointments
                }
            });
            showToast('success', `Status atualizado!`);
        } catch (error) {
            showToast('error', 'Erro ao atualizar.');
        }
    }, [leads, updateLead, showToast]);

    const handleSaveDate = useCallback(async (leadId: string, appointmentId: string) => {
        const lead = leads.find(l => l.id === leadId);
        if (!lead || !tempDate) return;

        let updatedAppointments = lead.scheduling_data?.appointments ? [...lead.scheduling_data.appointments] : [];
        const appointmentIndex = updatedAppointments.findIndex(a => a.id === appointmentId);
        const newDateIso = new Date(tempDate).toISOString();

        if (appointmentIndex !== -1) {
            updatedAppointments[appointmentIndex] = { ...updatedAppointments[appointmentIndex], date: newDateIso };
        } else if (lead.visit_date && appointmentId === 'legacy') {
            updatedAppointments.push({
                id: generateUUID(),
                date: newDateIso,
                status: lead.visit_status || 'pending',
                vehicleOfInterest: lead.scheduling_data?.vehicleOfInterest,
                notes: lead.scheduling_data?.notes
            });
        }

        try {
            await updateLead({
                ...lead,
                ...deriveRootVisitFields(updatedAppointments),
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
    }, [leads, tempDate, updateLead, showToast]);

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
            case 'show': return 'bg-brand-100 text-brand-600';
            case 'noshow': return 'bg-rose-100 text-rose-600';
        }
    };

    const handleScheduleVisit = async (formData: ScheduleFormData) => {
        try {
            let targetLeadId = formData.leadId;

            if (formData.isNewLead) {
                const newLead = await addLead({
                    name: formData.newLeadName,
                    phone: formData.newLeadPhone,
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
            }

            const lead = leads.find(l => l.id === targetLeadId);
            if (lead) {
                const visitDateTime = new Date(`${formData.date}T${formData.time}`).toISOString();
                const presentedVehicles = [...(lead.presentedVehicles || [])];

                // Check if vehicleId is actually an ID or a search string
                const matchedVehicle = vehicles.find(v => v.id === formData.vehicleId || `${v.brand} ${v.model}`.toLowerCase() === formData.vehicleSearch.toLowerCase());
                const vehicleIdToSave = matchedVehicle ? matchedVehicle.id : formData.vehicleSearch;

                if (vehicleIdToSave && !presentedVehicles.includes(vehicleIdToSave)) {
                    presentedVehicles.push(vehicleIdToSave);
                }

                const newAppointment = {
                    id: generateUUID(),
                    date: visitDateTime,
                    status: 'pending' as const,
                    vehicleOfInterest: vehicleIdToSave,
                    notes: 'Criado via agenda'
                };

                const existingAppointments = [...(lead.scheduling_data?.appointments || [])];

                if (existingAppointments.length === 0 && lead.visit_date) {
                    existingAppointments.push({
                        id: generateUUID(),
                        date: lead.visit_date,
                        status: lead.visit_status || 'pending',
                        vehicleOfInterest: lead.scheduling_data?.vehicleOfInterest,
                        notes: lead.scheduling_data?.notes
                    });
                }

                const allAppointments = [...existingAppointments, newAppointment];
                await updateLead({
                    ...lead,
                    ...deriveRootVisitFields(allAppointments),
                    phase: LeadPhase.VISIT,
                    presentedVehicles,
                    tags: lead.tags || [],
                    scheduling_data: {
                        ...(lead.scheduling_data || {}),
                        appointments: allAppointments
                    }
                });

                showToast('success', 'Visita agendada!');
                setIsFormOpen(false);
                loadData();
            }
        } catch (error) {
            showToast('error', 'Erro ao agendar visita.');
        }
    };

    const handleScheduleFollowUp = async (data: { leadId: string; nextContactDate: string; notes: string }) => {
        try {
            const lead = leads.find(l => l.id === data.leadId);
            if (!lead) return;

            await updateLead({
                ...lead,
                phase: LeadPhase.FOLLOW_UP,
                follow_up_data: {
                    ...(lead.follow_up_data || {}),
                    nextContactDate: data.nextContactDate,
                    notes: data.notes,
                },
            });

            showToast('success', 'Follow-up agendado!');
            setIsFollowUpFormOpen(false);
            loadData();
        } catch (error) {
            showToast('error', 'Erro ao agendar follow-up.');
        }
    };

    const handleMarkFollowUpDone = useCallback(async (lead: Lead) => {
        try {
            // Limpa nextContactDate para o card sair de Hoje/Atrasados/Próximos.
            // Antes só se acrescentava uma nota e a data continuava a mesma — o card
            // nunca saía da lista (e voltava como "Atrasado" depois), mesmo com o toast
            // dizendo "realizado". O lead vai para "Sem data" e pode ser reagendado
            // a qualquer momento pelo botão "Novo Follow-up".
            const { nextContactDate, ...restFollowUpData } = lead.follow_up_data || {};
            await updateLead({
                ...lead,
                follow_up_data: {
                    ...restFollowUpData,
                    notes: (lead.follow_up_data?.notes || '') + `\n✅ Contato realizado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`
                }
            });
            showToast('success', 'Follow-up marcado como realizado!');
        } catch (error) {
            showToast('error', 'Erro ao atualizar follow-up.');
        }
    }, [updateLead, showToast]);

    // Data for calendar view - strictly filtered by active tab (Visitas vs Follow-up)
    const calendarItems = useMemo(() => {
        if (agendaTab === 'visits') {
            return baseVisits
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
        }

        return baseFollowups
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
    }, [baseVisits, baseFollowups, searchQuery, agendaTab]);

    return (
        <div className="flex flex-col h-full space-y-6 animate-fadeIn pb-10" >
            <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-6 px-1">
                    <div className="flex items-center gap-4">
                        {/* Page Header Title */}
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                                {agendaTab === 'visits' ? <CalendarDays size={22} /> : <PhoneCall size={22} />}
                            </div>
                            <div>
                                <h1 className="font-heading font-extrabold text-2xl text-foreground tracking-tight">
                                    {agendaTab === 'visits' ? 'Visitas' : 'Follow-ups'}
                                </h1>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    {agendaTab === 'visits' ? 'Gestão e agendamentos de visitas presenciais' : 'Acompanhamento e tarefas de follow-up com clientes'}
                                </p>
                            </div>
                        </div>

                        <div className="h-10 w-px bg-border/80 mx-1 hidden md:block" />

                        {/* View Type Switcher */}
                        <div className="flex bg-muted/80 dark:bg-slate-900/60 p-1 rounded-xl border border-border/80">
                            {(['list', 'calendar'] as const).map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setViewType(v)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer ${viewType === v ? 'bg-card text-foreground shadow-sm font-bold border border-border/50' : 'text-muted-foreground hover:text-foreground font-semibold'}`}
                                >
                                    {v === 'list' ? <LayoutList size={15} strokeWidth={2.5} /> : <CalendarDays size={15} strokeWidth={2.5} />}
                                    <span className="text-xs font-bold capitalize">{v === 'list' ? 'Lista' : 'Calendário'}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {agendaTab === 'visits' && (
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl text-[11px] font-bold uppercase tracking-wide hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:scale-95 cursor-pointer"
                        >
                            <Plus size={15} strokeWidth={3} /> Novo Agendamento
                        </button>
                    )}

                    {agendaTab === 'followups' && (
                        <button
                            onClick={() => setIsFollowUpFormOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl text-[11px] font-bold uppercase tracking-wide hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:scale-95 cursor-pointer"
                        >
                            <Plus size={15} strokeWidth={3} /> Novo Follow-up
                        </button>
                    )}
                </div>

                {/* Stats Bar */}
                <AgendaStats
                    agendaTab={agendaTab}
                    dateFilter={dateFilter}
                    statusFilter={statusFilter}
                    followupFilter={followupFilter}
                    stats={stats}
                    setDateFilter={setDateFilter}
                    setStatusFilter={setStatusFilter}
                    setFollowupFilter={setFollowupFilter}
                    todayFormatted={format(new Date(), 'yyyy-MM-dd')}
                />

                {/* Filters */}
                <AgendaFilters
                    viewType={viewType}
                    agendaTab={agendaTab}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    dateFilter={dateFilter}
                    setDateFilter={setDateFilter}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    currentDate={currentDate}
                    setCurrentDate={setCurrentDate}
                    getStatusLabel={getStatusLabel}
                />
            </div>

            {/* Content Area */}
            <div>
                {/* ===== VISITS TAB ===== */}
                {agendaTab === 'visits' && viewType === 'list' && (
                    <AgendaVisitsList
                        visits={visits}
                        editingVisitId={editingVisitId}
                        setEditingVisitId={setEditingVisitId}
                        tempDate={tempDate}
                        setTempDate={setTempDate}
                        getStatusStyle={getStatusStyle}
                        getStatusLabel={getStatusLabel}
                        handleUpdateVisitStatus={handleUpdateVisitStatus}
                        handleSaveDate={handleSaveDate}
                    />
                )}

                {/* ===== FOLLOW-UPS TAB ===== */}
                {agendaTab === 'followups' && viewType === 'list' && (
                    <AgendaFollowupsList
                        followups={followups}
                        followupsNoDateFil={followupsNoDateFil}
                        followupFilter={followupFilter}
                        setFollowupFilter={setFollowupFilter}
                        now={now}
                        handleMarkFollowUpDone={handleMarkFollowUpDone}
                    />
                )}

                {/* ===== CALENDAR VIEW ===== */}
                {viewType === 'calendar' && (
                    <AgendaCalendarView
                        calendarItems={calendarItems}
                        currentDate={currentDate}
                    />
                )}
            </div>

            <ScheduleVisitModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                leads={leads}
                vehicles={vehicles}
                onSchedule={handleScheduleVisit}
            />

            <ScheduleFollowUpModal
                isOpen={isFollowUpFormOpen}
                onClose={() => setIsFollowUpFormOpen(false)}
                leads={leads}
                onSchedule={handleScheduleFollowUp}
            />
        </div>
    );
};

export default Agenda;
