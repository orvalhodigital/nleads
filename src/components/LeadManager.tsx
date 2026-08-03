import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus, MessageCircle, Filter, LayoutGrid, Rows, ChevronLeft, ChevronRight,
  Edit2, Check, X, Car, Trash2, Phone, Mail, ArrowRight,
  CalendarCheck, Clock, ExternalLink, Search, CheckSquare, Square, Upload,
  Briefcase, Users, User, MapPin, DollarSign, Calendar, Sliders, Settings,
  MessageSquare, MoreVertical, CreditCard, LayoutTemplate, Tag, Trash, FileText,
  AlertTriangle, Menu, UserPlus, Zap, History, UserCheck, Smartphone, Target, Info, Flame, Snowflake, Droplet, Shield
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import { Lead, LeadPhase, LeadTemperature, Tag as TagType, Vehicle, VehicleType, TransmissionType, EngineType, SaleDetails, Profile } from '../types';
import { leadService } from '../services/leadService';
import { notificationService } from '../services/notificationService';
import { generateUUID } from '../utils/uuid';
import TagInput from './TagInput';
import MultiSelect from './MultiSelect';
import DisqualificationModal from './DisqualificationModal';
import LeadSaleModal from './LeadSaleModal';
import { LeadSchedulingModal } from './LeadSchedulingModal';
import { CustomDatePicker } from './ui/CustomDatePicker';
import { CustomTimePicker } from './ui/CustomTimePicker';
import { LeadSimulationModal } from './LeadSimulationModal';
import { LeadFollowUpModal } from './LeadFollowUpModal';
import { useToast } from '../contexts/ToastContext';
import { formatCurrency } from '../utils/formatters';
import { deriveRootVisitFields, safeIsoDate } from '../utils/visits';
import QuickLeadModal from './QuickLeadModal';



interface LeadManagerProps {
  type?: 'leads' | 'sales';
  leads: Lead[];
  phases?: LeadPhase[];
  onAddLead: (lead: any) => Promise<Lead | null>;
  // O retorno é ignorado aqui; aceita tanto quem devolve o lead atualizado
  // (DataContext.updateLead) quanto quem não devolve nada.
  onUpdateLead: (lead: Lead) => Promise<Lead | void>;
  onDeleteLead: (id: string) => Promise<void>;
  onViewLead?: (id: string) => void;
  focusedLeadId?: string | null;
  onClearFocus?: () => void;
  onRefresh?: () => void;
  userEmail?: string;
  onDataChange?: () => void;
  companyName?: string;
  impersonatedUserId?: string;
  vehicles?: Vehicle[];
  hasMoreLeads?: boolean;
  onLoadMore?: () => Promise<void>;
  loadingLeads?: boolean;
  isEmpresa?: boolean;
  teamMembers?: Profile[];
}

const SOURCES = ['Site', 'WhatsApp', 'Instagram', 'Facebook', 'Indicação', 'Google', 'Ponto de Venda', 'Outros'];

const LeadManager: React.FC<LeadManagerProps> = ({
  type = 'leads', leads, phases: propPhases, onAddLead, onUpdateLead, onDeleteLead, onViewLead,
  focusedLeadId, onClearFocus, onRefresh, userEmail, onDataChange, companyName, impersonatedUserId,
  vehicles = [], hasMoreLeads, onLoadMore, loadingLeads,
  isEmpresa = false, teamMembers = []
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isQuickLeadOpen, setIsQuickLeadOpen] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isDisqualifiedExpanded, setIsDisqualifiedExpanded] = useState(false);

  // Focus effect
  useEffect(() => {
    if (focusedLeadId) {
      const lead = leads.find(l => l.id === focusedLeadId);
      if (lead) setSelectedLead(lead);
      onClearFocus?.();
    }
  }, [focusedLeadId, leads, onClearFocus]);

  // Estados para modais locais integrados no Kanban
  const [actionLead, setActionLead] = useState<Lead | null>(null);
  const [pendingPhase, setPendingPhase] = useState<LeadPhase | null>(null);
  const [activeModal, setActiveModal] = useState<'disqualify' | 'visit' | 'simulation' | 'followup' | 'sale' | null>(null);

  const handleConfirmDisqualify = async (reasons: string[], notes: string) => {
    if (!actionLead || !pendingPhase) return;
    try {
      const oldPhase = actionLead.phase;
      await onUpdateLead({
        ...actionLead,
        phase: pendingPhase,
        disqualificationReasons: reasons,
        disqualificationNotes: notes,
      });
      await notificationService.notifyLeadPhaseChange(actionLead.name, oldPhase, pendingPhase, impersonatedUserId);
      showToast('success', 'Lead desqualificado com sucesso!');
      onRefresh?.();
      onDataChange?.();
    } catch (e) {
      showToast('error', 'Erro ao desqualificar o lead.');
    } finally {
      setActiveModal(null);
      setActionLead(null);
      setPendingPhase(null);
    }
  };

  const handleConfirmScheduling = async (data?: { date: string; time: string; vehicleOfInterest: string; notes: string }) => {
    if (!actionLead || !pendingPhase) {
      setActiveModal(null);
      setActionLead(null);
      setPendingPhase(null);
      return;
    }
    try {
      const oldPhase = actionLead.phase;
      if (data) {
        const visitDateTime = safeIsoDate(data.date, data.time);
        
        const existingAppointments = actionLead.scheduling_data?.appointments || [];
        const newAppointment = {
          id: generateUUID(),
          date: visitDateTime,
          status: 'pending' as const,
          vehicleOfInterest: data.vehicleOfInterest,
          notes: data.notes
        };
        const updatedAppointments = [...existingAppointments, newAppointment];

        await onUpdateLead({
          ...actionLead,
          phase: pendingPhase,
          ...deriveRootVisitFields(updatedAppointments),
          scheduling_data: {
            ...(actionLead.scheduling_data || {}),
            appointments: updatedAppointments
          }
        });
        showToast('success', 'Visita agendada com sucesso!');
      } else {
        await onUpdateLead({
          ...actionLead,
          phase: pendingPhase
        });
        showToast('success', 'Lead movido com sucesso!');
      }
      await notificationService.notifyLeadPhaseChange(actionLead.name, oldPhase, pendingPhase, impersonatedUserId);
      onRefresh?.();
      onDataChange?.();
    } catch (e) {
      showToast('error', 'Erro ao agendar visita.');
    } finally {
      setActiveModal(null);
      setActionLead(null);
      setPendingPhase(null);
    }
  };

  const handleConfirmSimulation = async (data?: { cpf: string; cnh: string; downPayment: number; installments: number; notes: string }) => {
    if (!actionLead || !pendingPhase) {
      setActiveModal(null);
      setActionLead(null);
      setPendingPhase(null);
      return;
    }
    try {
      const oldPhase = actionLead.phase;
      if (data) {
        await onUpdateLead({
          ...actionLead,
          phase: pendingPhase,
          simulation_data: data
        });
        showToast('success', 'Simulação salva com sucesso!');
      } else {
        await onUpdateLead({
          ...actionLead,
          phase: pendingPhase
        });
        showToast('success', 'Lead movido com sucesso!');
      }
      await notificationService.notifyLeadPhaseChange(actionLead.name, oldPhase, pendingPhase, impersonatedUserId);
      onRefresh?.();
      onDataChange?.();
    } catch (e) {
      showToast('error', 'Erro ao salvar simulação.');
    } finally {
      setActiveModal(null);
      setActionLead(null);
      setPendingPhase(null);
    }
  };

  const handleConfirmFollowUp = async (data?: { nextContactDate: string; notes: string }) => {
    if (!actionLead || !pendingPhase) {
      setActiveModal(null);
      setActionLead(null);
      setPendingPhase(null);
      return;
    }
    try {
      const oldPhase = actionLead.phase;
      if (data) {
        await onUpdateLead({
          ...actionLead,
          phase: pendingPhase,
          follow_up_data: data
        });
        showToast('success', 'Follow-up salvo com sucesso!');
      } else {
        await onUpdateLead({
          ...actionLead,
          phase: pendingPhase
        });
        showToast('success', 'Lead movido com sucesso!');
      }
      await notificationService.notifyLeadPhaseChange(actionLead.name, oldPhase, pendingPhase, impersonatedUserId);
      onRefresh?.();
      onDataChange?.();
    } catch (e) {
      showToast('error', 'Erro ao salvar follow-up.');
    } finally {
      setActiveModal(null);
      setActionLead(null);
      setPendingPhase(null);
    }
  };

  const handleSaleSuccess = () => {
    showToast('success', 'Venda concluída com sucesso!');
    onRefresh?.();
    onDataChange?.();
    setActiveModal(null);
    setActionLead(null);
    setPendingPhase(null);
  };


  const phases = useMemo(() => {
    if (propPhases) return propPhases;
    if (type === 'leads') {
      return [LeadPhase.NEW, LeadPhase.VISIT, LeadPhase.SIMULATION, LeadPhase.FOLLOW_UP, LeadPhase.STAND_BY, LeadPhase.COMPLETED, LeadPhase.DISQUALIFIED];
    }
    return [LeadPhase.WAITING_PAYMENT, LeadPhase.DOCUMENTATION, LeadPhase.DELIVERY, LeadPhase.COMPLETED];
  }, [propPhases, type]);

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case LeadPhase.NEW: return 'amber';
      case LeadPhase.VISIT: return 'sky';
      case LeadPhase.SIMULATION: return 'indigo';
      case LeadPhase.FOLLOW_UP: return 'emerald';
      case LeadPhase.STAND_BY: return 'violet';
      case LeadPhase.COMPLETED: return 'green';
      case LeadPhase.DISQUALIFIED: return 'rose';
      default: return 'slate';
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case LeadPhase.NEW: return <UserPlus size={14} />;
      case LeadPhase.VISIT: return <Calendar size={14} />;
      case LeadPhase.SIMULATION: return <Zap size={14} />;
      case LeadPhase.FOLLOW_UP: return <History size={14} />;
      case LeadPhase.STAND_BY: return <Clock size={14} />;
      case LeadPhase.COMPLETED: return <UserCheck size={14} />;
      case LeadPhase.DISQUALIFIED: return <X size={14} />;
      default: return <Target size={14} />;
    }
  };

  const [messageTemplate, setMessageTemplate] = useState('');

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterTemp, setFilterTemp] = useState<string>('all');
  const [filterVendedor, setFilterVendedor] = useState<string>('all');
  const [searchQueryLeads, setSearchQueryLeads] = useState('');
  // Filtros comerciais: leads sem contato há N dias e sinais de intenção de compra.
  const [filterParados, setFilterParados] = useState<string>('all');
  const [filterEntrada, setFilterEntrada] = useState(false);
  const [filterTroca, setFilterTroca] = useState(false);

  const LEAD_SOURCES = ['Site', 'WhatsApp', 'Facebook', 'Instagram', 'Indicação', 'Telefone', 'Outros'];

  const daysSince = (dateStr?: string): number => {
    if (!dateStr) return Infinity;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return Infinity;
    return (Date.now() - d.getTime()) / 86400000;
  };

  const activeFilterCount =
    (filterPhase !== 'all' ? 1 : 0) +
    (filterSource !== 'all' ? 1 : 0) +
    (filterTemp !== 'all' ? 1 : 0) +
    (isEmpresa && filterVendedor !== 'all' ? 1 : 0) +
    (filterParados !== 'all' ? 1 : 0) +
    (filterEntrada ? 1 : 0) +
    (filterTroca ? 1 : 0);

  const clearFilters = () => {
    setFilterPhase('all');
    setFilterSource('all');
    setFilterTemp('all');
    setFilterVendedor('all');
    setFilterParados('all');
    setFilterEntrada(false);
    setFilterTroca(false);
  };

  const memberMap = useMemo(() => {
    const map = new Map<string, Profile>();
    teamMembers.forEach(m => map.set(m.id, m));
    return map;
  }, [teamMembers]);

  const getVendorName = (lead: Lead): string | null => {
    if (!isEmpresa || !lead.user_id) return null;
    const member = memberMap.get(lead.user_id);
    return member?.full_name?.split(' ')[0] || null;
  };

  const [columnLimits, setColumnLimits] = useState<Record<string, number>>(
    phases.reduce((acc, phase) => ({ ...acc, [phase]: 14 }), {})
  );

  const handleColumnScroll = (e: React.UIEvent<HTMLDivElement>, phase: string) => {
    const target = e.currentTarget;
    const isBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (isBottom) {
      if (hasMoreLeads && onLoadMore) {
        onLoadMore();
      }
      setColumnLimits(prev => ({
        ...prev,
        [phase]: (prev[phase] || 14) + 14
      }));
    }
  };

  const getDisplayPhase = (lead: Lead): LeadPhase => {
    if (type === 'leads' && lead.is_buyer) return LeadPhase.COMPLETED;
    return lead.phase;
  };

  const getEvoAlert = (lead: Lead) => {
    const now = new Date();
    const normalizedNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffDays = (date1: Date, date2: Date) => {
      const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
      const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
      return (d1.getTime() - d2.getTime()) / (1000 * 3600 * 24);
    };

    if (lead.phase === LeadPhase.NEW) {
      const created = new Date(lead.createdAt);
      const days = diffDays(normalizedNow, created);
      if (days >= 1) return { show: true, msg: `Esse Lead está na Fase Novo Lead há ${Math.floor(days)} dias, evolua o lead.` };
    }
    if (lead.phase === LeadPhase.VISIT && lead.visit_date) {
      const visitDate = new Date(lead.visit_date);
      const days = diffDays(normalizedNow, visitDate);
      if (days >= 2) return { show: true, msg: `Passaram-se ${Math.floor(days)} dias da visita, evolua o lead.` };
    }
    if (lead.phase === LeadPhase.SIMULATION && lead.funnelHistory?.[LeadPhase.SIMULATION]) {
      const simDate = new Date(lead.funnelHistory[LeadPhase.SIMULATION]);
      const days = diffDays(normalizedNow, simDate);
      if (days >= 2) return { show: true, msg: `Esse Lead está em Simulação há ${Math.floor(days)} dias, evolua o lead.` };
    }
    return { show: false, msg: '' };
  };

  const visibleLeads = useMemo(() => {
    const allowedPhases = new Set(phases);
    if (type === 'leads') allowedPhases.add(LeadPhase.DISQUALIFIED);
    const query = searchQueryLeads.trim().toLowerCase();
    const paradosDias = filterParados === 'all' ? null : Number(filterParados);

    return leads.filter(lead => {
      // Compradores entram pela flag is_buyer e não pelas fases do funil.
      const isBuyer = type === 'leads' && !!lead.is_buyer;
      if (!isBuyer && !allowedPhases.has(lead.phase)) return false;

      if (filterPhase !== 'all') {
        if (isBuyer ? filterPhase !== LeadPhase.COMPLETED : lead.phase !== filterPhase) return false;
      }
      if (filterSource !== 'all' && lead.source !== filterSource) return false;
      if (filterTemp !== 'all' && lead.temperature !== filterTemp) return false;
      if (isEmpresa && filterVendedor !== 'all' && lead.user_id !== filterVendedor) return false;
      if (filterEntrada && !lead.preferences?.possui_entrada) return false;
      if (filterTroca && !lead.preferences?.possui_troca) return false;
      if (paradosDias !== null && daysSince(lead.lastUpdate || lead.createdAt) < paradosDias) return false;

      if (query) {
        const hit =
          lead.name?.toLowerCase().includes(query) ||
          lead.phone?.toLowerCase().includes(query) ||
          lead.email?.toLowerCase().includes(query);
        if (!hit) return false;
      }

      return true;
    });
  }, [
    leads, phases, type, searchQueryLeads,
    filterPhase, filterSource, filterTemp,
    filterVendedor, isEmpresa,
    filterParados, filterEntrada, filterTroca,
  ]);

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newPhase = destination.droppableId as LeadPhase;

    const lead = leads.find(l => l.id === draggableId);
    if (!lead || lead.phase === newPhase) return;

    if (newPhase === LeadPhase.DISQUALIFIED) {
      setActionLead(lead);
      setPendingPhase(newPhase);
      setActiveModal('disqualify');
      return;
    }
    if (newPhase === LeadPhase.VISIT) {
      setActionLead(lead);
      setPendingPhase(newPhase);
      setActiveModal('visit');
      return;
    }
    if (newPhase === LeadPhase.SIMULATION) {
      setActionLead(lead);
      setPendingPhase(newPhase);
      setActiveModal('simulation');
      return;
    }
    if (newPhase === LeadPhase.FOLLOW_UP) {
      setActionLead(lead);
      setPendingPhase(newPhase);
      setActiveModal('followup');
      return;
    }
    if (newPhase === LeadPhase.COMPLETED) {
      setActionLead(lead);
      setPendingPhase(newPhase);
      setActiveModal('sale');
      return;
    }

    try {
      const oldPhase = lead.phase;
      await onUpdateLead({ ...lead, phase: newPhase });
      await notificationService.notifyLeadPhaseChange(lead.name, oldPhase, newPhase, impersonatedUserId);
    } catch (error) {
      console.error('Falha ao atualizar fase do lead:', error);
    }
  };

  const toggleLeadSelection = (id: string) => {
    const newSelection = new Set(selectedLeadIds);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedLeadIds(newSelection);
  };

  const toggleAllVisible = () => {
    if (selectedLeadIds.size === visibleLeads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(visibleLeads.map(l => l.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeadIds.size === 0) return;
    if (window.confirm(`Excluir permanentemente ${selectedLeadIds.size} leads selecionados?`)) {
      try {
        for (const id of Array.from(selectedLeadIds)) {
          await onDeleteLead(id);
        }
        setSelectedLeadIds(new Set());
        showToast('success', 'Leads excluídos com sucesso!');
        onRefresh?.();
      } catch (error) {
        showToast('error', 'Erro ao excluir leads em lote.');
      }
    }
  };

  // Paleta das colunas do Kanban. Cada tom tem par claro/escuro; o texto forte usa o
  // token `text-foreground` para adaptar sozinho. Ver DESIGN_GUIDELINES.md §3/§4.
  const colorMapping: Record<string, any> = {
    amber: { columnBg: 'bg-amber-50/50 dark:bg-amber-950/20', headerBg: 'bg-amber-100/50 dark:bg-amber-900/25', border: 'border-amber-200 dark:border-amber-900/40', bgIcon: 'bg-amber-100 dark:bg-amber-900/40', textStrong: 'text-foreground', btnBg: 'bg-amber-500', bgSection: 'bg-amber-50/50 dark:bg-amber-950/20' },
    sky: { columnBg: 'bg-sky-50/55 dark:bg-sky-950/20', headerBg: 'bg-sky-100/50 dark:bg-sky-900/25', border: 'border-sky-200 dark:border-sky-900/40', bgIcon: 'bg-sky-100 dark:bg-sky-900/40', textStrong: 'text-foreground', btnBg: 'bg-sky-500', bgSection: 'bg-sky-50/50 dark:bg-sky-950/20' },
    indigo: { columnBg: 'bg-indigo-50/55 dark:bg-indigo-950/20', headerBg: 'bg-indigo-100/50 dark:bg-indigo-900/25', border: 'border-indigo-200 dark:border-indigo-900/40', bgIcon: 'bg-indigo-100 dark:bg-indigo-900/40', textStrong: 'text-foreground', btnBg: 'bg-indigo-600', bgSection: 'bg-indigo-50/50 dark:bg-indigo-950/20' },
    emerald: { columnBg: 'bg-emerald-50/55 dark:bg-emerald-950/20', headerBg: 'bg-emerald-100/50 dark:bg-emerald-900/25', border: 'border-emerald-200 dark:border-emerald-900/40', bgIcon: 'bg-emerald-100 dark:bg-emerald-900/40', textStrong: 'text-foreground', btnBg: 'bg-emerald-500', bgSection: 'bg-emerald-50/50 dark:bg-emerald-950/20' },
    violet: { columnBg: 'bg-violet-50/50 dark:bg-violet-950/20', headerBg: 'bg-violet-100/50 dark:bg-violet-900/25', border: 'border-violet-200 dark:border-violet-900/40', bgIcon: 'bg-violet-100 dark:bg-violet-900/40', textStrong: 'text-foreground', btnBg: 'bg-violet-500', bgSection: 'bg-violet-50/50 dark:bg-violet-950/20' },
    green: { columnBg: 'bg-green-50/55 dark:bg-green-950/20', headerBg: 'bg-green-100/50 dark:bg-green-900/25', border: 'border-green-200 dark:bg-green-900/40', bgIcon: 'bg-green-100 dark:bg-green-900/40', textStrong: 'text-foreground', btnBg: 'bg-green-600', bgSection: 'bg-green-50/50 dark:bg-green-950/20' },
    rose: { columnBg: 'bg-rose-50/50 dark:bg-rose-950/20', headerBg: 'bg-rose-100/50 dark:bg-rose-900/25', border: 'border-rose-200 dark:border-rose-900/40', bgIcon: 'bg-rose-100 dark:bg-rose-900/40', textStrong: 'text-foreground', btnBg: 'bg-rose-500', bgSection: 'bg-rose-50/60 dark:bg-rose-950/20' },
    slate: { columnBg: 'bg-muted', headerBg: 'bg-muted/80', border: 'border-border', bgIcon: 'bg-secondary', textStrong: 'text-foreground', btnBg: 'bg-slate-600 dark:bg-slate-500', bgSection: 'bg-muted/60' },
  };

  const renderKanban = () => {
    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden h-full">
          <div className="kanban-scrollbar flex gap-5 h-full w-full overflow-x-auto px-1 pb-2 overflow-y-hidden">
            <style>{`
              .lead-column-scroll::-webkit-scrollbar { display: none; }
              .lead-column-scroll { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            {phases.map((phase) => {
              const leadsInPhase = visibleLeads.filter(l => getDisplayPhase(l) === phase);
              const limit = columnLimits[phase] || 14;
              const paginatedLeads = leadsInPhase.slice(0, limit);
              const colorKey = getPhaseColor(phase);
              const colors = colorMapping[colorKey] || colorMapping.slate;
              const isDisqualified = phase === LeadPhase.DISQUALIFIED;
              const isCollapsed = isDisqualified && !isDisqualifiedExpanded;

              return (
                <div key={phase} className={`shrink-0 flex flex-col gap-2 h-full p-2 rounded-[28px] ${colors.columnBg} transition-all duration-300 border border-slate-200/20 ${isCollapsed ? 'w-[70px]' : 'w-[290px]'} overflow-hidden`}>
                  <div
                    onClick={() => isDisqualified && setIsDisqualifiedExpanded(!isDisqualifiedExpanded)}
                    className={`flex items-center justify-between px-4 py-3 border rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-all ${isCollapsed ? 'flex-col gap-10 py-8 ' + colors.headerBg + ' ' + colors.border : 'bg-card border-border/80'}`}
                  >
                    <div className={`flex items-center gap-2.5 ${isCollapsed ? 'flex-col' : ''}`}>
                      <div className={`p-2.5 rounded-xl ${colors.bgIcon} ${colors.textStrong} shadow-sm`}>
                        {getPhaseIcon(phase)}
                      </div>
                      {!isCollapsed && <h3 className="text-[11px] font-black text-foreground tracking-wider uppercase">{phase}</h3>}
                      {isCollapsed && <h3 className="text-[10px] font-black text-muted-foreground [writing-mode:vertical-lr] rotate-180 uppercase tracking-[0.2em]">{phase}</h3>}
                    </div>
                    {!isCollapsed && <div className="flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-muted border border-border/80 text-muted-foreground rounded-lg text-[10px] font-black">{leadsInPhase.length}</div>}
                  </div>

                  {!isCollapsed && (
                    <Droppable droppableId={phase}>
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          onScroll={(e) => handleColumnScroll(e, phase)}
                          className={`lead-column-scroll flex-1 flex flex-col gap-2 min-h-0 overflow-y-auto p-1.5 rounded-2xl transition-all duration-300 relative ${snapshot.isDraggingOver ? 'bg-black/5 ring-1 ring-slate-900/5' : ''}`}
                        >
                          <div className={`sticky top-0 left-0 right-0 h-1.5 rounded-t-2xl ${colors.btnBg} opacity-50 z-10 shrink-0`} />
                          {paginatedLeads.map((lead, index) => (
                            <React.Fragment key={lead.id}>
                              <Draggable draggableId={lead.id} index={index}>
                                {(provided, snapshot) => {
                                  const card = (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      onClick={() => !snapshot.isDragging && navigate(`/leads/${lead.id}`)}
                                      className={`group bg-card p-3.5 rounded-2xl border border-border/80 shadow-sm hover:shadow-md hover:border-primary/40 cursor-grab active:cursor-grabbing ${snapshot.isDragging ? 'shadow-xl ring-1 ring-primary/50' : ''} shrink-0`}
                                      style={provided.draggableProps.style}
                                    >
                                      <div className="flex items-center gap-2.5 mb-2 relative">
                                        <div className={`relative w-9 h-9 shrink-0 rounded-lg ${colors.btnBg} text-white flex items-center justify-center font-bold text-xs shadow-sm`}>
                                          {lead.name.charAt(0)}
                                          <div className={`absolute -right-1 -bottom-1 w-4 h-4 rounded-full border border-card flex items-center justify-center shadow-sm ${
                                            lead.temperature === LeadTemperature.HOT ? 'bg-rose-500' :
                                            lead.temperature === LeadTemperature.WARM ? 'bg-amber-400' :
                                            'bg-blue-400'
                                          }`}>
                                            {lead.temperature === LeadTemperature.HOT && <Flame size={9} className="text-white shrink-0" />}
                                            {lead.temperature === LeadTemperature.WARM && <Droplet size={9} className="text-white shrink-0" />}
                                            {lead.temperature === LeadTemperature.COLD && <Snowflake size={9} className="text-white shrink-0" />}
                                          </div>
                                        </div>
                                        <div className="flex-1 min-w-0 pr-6">
                                          <h4 className="text-[13px] font-bold text-foreground truncate tracking-tight">{lead.name}</h4>
                                          <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">{lead.source} • {lead.phone}</p>
                                        </div>
                                      </div>
                                      <div className="space-y-1.5 mb-2.5">
                                        {lead.preferences.interesse_carro && (lead.preferences.carro_valor_max || lead.preferences.valor_maximo) && (
                                          <div className="flex items-center justify-between px-3 py-1.5 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/10">
                                            <div className="flex items-center gap-1.5">
                                              <Car size={10} className="text-primary" />
                                              <span className="text-[8px] font-black text-primary dark:text-primary-foreground uppercase tracking-wider">Carro</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-primary dark:text-primary-foreground">R$ {formatCurrency(lead.preferences.carro_valor_max || lead.preferences.valor_maximo || 0)}</span>
                                          </div>
                                        )}
                                        {lead.preferences.interesse_moto && lead.preferences.moto_valor_max && (
                                          <div className="flex items-center justify-between px-3 py-1.5 bg-indigo-500/5 dark:bg-indigo-950/20 rounded-xl border border-indigo-500/10 dark:border-indigo-800/20">
                                            <div className="flex items-center gap-1.5">
                                              <Target size={10} className="text-indigo-500" />
                                              <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Moto</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">R$ {formatCurrency(lead.preferences.moto_valor_max)}</span>
                                          </div>
                                        )}
                                        {lead.preferences.interesse_caminhao && lead.preferences.caminhao_valor_max && (
                                          <div className="flex items-center justify-between px-3 py-1.5 bg-amber-500/5 dark:bg-amber-950/20 rounded-xl border border-amber-500/10 dark:border-amber-800/20">
                                            <div className="flex items-center gap-1.5">
                                              <Shield size={10} className="text-amber-500" />
                                              <span className="text-[8px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">Caminhão</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">R$ {formatCurrency(lead.preferences.caminhao_valor_max)}</span>
                                          </div>
                                        )}
                                        {!lead.preferences.interesse_carro && !lead.preferences.interesse_moto && !lead.preferences.interesse_caminhao && lead.preferences.valor_maximo && (
                                          <div className="flex items-center justify-between px-3 py-1.5 bg-muted rounded-xl border border-border">
                                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-wider">Geral</span>
                                            <span className="text-[10px] font-bold text-foreground">R$ {formatCurrency(lead.preferences.valor_maximo)}</span>
                                          </div>
                                        )}
                                        {(() => { const vn = getVendorName(lead); return vn ? (
                                          <div className="flex items-center gap-1 pt-0.5">
                                            <User size={9} className="text-muted-foreground/50 shrink-0" />
                                            <span className="text-[9px] text-muted-foreground font-semibold truncate">{vn}</span>
                                          </div>
                                        ) : null; })()}
                                      </div>
                                    </div>
                                  );
                                  return snapshot.isDragging ? createPortal(card, document.body) : card;
                                }}
                              </Draggable>
                            </React.Fragment>
                          ))}
                          {provided.placeholder}
                          {loadingLeads && (
                            <div className="flex justify-center p-4">
                              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DragDropContext>
    );
  };

  const renderList = () => {
    return (
      <div className="bg-card rounded-3xl border border-border/80 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-5 w-16 text-center">
                  <input type="checkbox" checked={selectedLeadIds.size === visibleLeads.length && visibleLeads.length > 0} onChange={toggleAllVisible} className="rounded-md border-slate-300 text-brand-600" />
                </th>
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fase Atual</th>
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temperatura</th>
                {isEmpresa && <th className="p-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Vendedor</th>}
                <th className="p-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Data de Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 bg-card">
              {visibleLeads.map(lead => {
                const displayPhase = getDisplayPhase(lead);
                const colors = colorMapping[getPhaseColor(displayPhase)] || colorMapping.slate;
                return (
                  <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)} className="hover:bg-muted/35 transition-all cursor-pointer group/row">
                    <td className="p-5 text-center" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedLeadIds.has(lead.id)} onChange={() => toggleLeadSelection(lead.id)} className="rounded-md border-border text-primary" />
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${colors.btnBg} text-white flex items-center justify-center font-bold uppercase text-xs shadow-sm`}>{lead.name.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-bold text-foreground group-hover/row:text-primary transition-colors">{lead.name}</p>
                          <span className="text-[10px] font-semibold text-muted-foreground">{lead.phone} • {lead.source}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg ${colors.bgSection} ${colors.textStrong} flex items-center justify-center border ${colors.border}`}>{getPhaseIcon(displayPhase)}</div>
                        <span className="text-[11px] font-bold text-foreground">{displayPhase}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-muted border border-border/80">
                        {lead.temperature === LeadTemperature.HOT && <Flame size={12} className="text-rose-500 shrink-0" />}
                        {lead.temperature === LeadTemperature.WARM && <Droplet size={12} className="text-amber-500 shrink-0" />}
                        {lead.temperature === LeadTemperature.COLD && <Snowflake size={12} className="text-blue-400 shrink-0" />}
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{lead.temperature}</span>
                      </div>
                    </td>
                    {isEmpresa && (
                      <td className="p-5">
                        {(() => { const vn = getVendorName(lead); return vn ? (
                          <div className="flex items-center gap-1.5">
                            <User size={12} className="text-muted-foreground/60" />
                            <span className="text-xs font-semibold text-muted-foreground">{vn}</span>
                          </div>
                        ) : <span className="text-xs text-muted-foreground/45">—</span>; })()}
                      </td>
                    )}
                    <td className="p-5 text-right"><span className="text-xs font-semibold text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString()}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visibleLeads.length === 0 && <div className="py-20 text-center text-muted-foreground text-sm font-medium">Nenhum lead encontrado.</div>}
        </div>
        {hasMoreLeads && (
          <div className="p-6 border-t border-border/85 flex justify-center bg-muted/20">
            <button
              onClick={onLoadMore}
              disabled={loadingLeads}
              className="flex items-center gap-2 px-8 py-3 bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
            >
              {loadingLeads ? 'Carregando...' : 'Carregar mais leads'}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-150px)] min-h-0 space-y-4 animate-fadeIn overflow-hidden">
      <div className="flex flex-col gap-6 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-6 px-1">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex bg-muted/80 dark:bg-slate-900/60 p-1 rounded-xl border border-border/80">
              <button onClick={() => setViewMode('kanban')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-card text-foreground shadow-sm font-bold border border-border/50' : 'text-muted-foreground hover:text-foreground font-semibold'}`}>
                <LayoutGrid size={15} />
                <span className="text-[11px] uppercase">Kanban</span>
              </button>
              <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-card text-foreground shadow-sm font-bold border border-border/50' : 'text-muted-foreground hover:text-foreground font-semibold'}`}>
                <Rows size={15} />
                <span className="text-[11px] uppercase">Lista</span>
              </button>
            </div>
            {/* Busca rápida — nome, telefone ou e-mail */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQueryLeads}
                onChange={e => setSearchQueryLeads(e.target.value)}
                placeholder="Buscar nome, telefone ou e-mail..."
                aria-label="Buscar leads"
                className="w-56 md:w-72 pl-10 pr-9 py-3 bg-card border border-border/80 rounded-xl text-xs font-semibold text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring transition-all"
              />
              {searchQueryLeads && (
                <button
                  onClick={() => setSearchQueryLeads('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Limpar busca"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              aria-expanded={isFilterOpen}
              className={`flex items-center gap-2 px-5 py-3 border rounded-xl text-[11px] font-bold uppercase tracking-wide transition-all ${isFilterOpen || activeFilterCount > 0 ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20' : 'bg-card border-border/80 text-muted-foreground hover:bg-muted'}`}
            >
              <Filter size={15} /> Filtrar
              {activeFilterCount > 0 && (
                <span className="ml-0.5 min-w-[20px] h-5 px-1.5 rounded-full bg-primary-foreground/25 text-[10px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsQuickLeadOpen(true)}
              className="flex items-center gap-1.5 px-4 py-3 bg-card border border-border/80 text-muted-foreground hover:bg-muted rounded-xl text-[11px] font-bold uppercase tracking-wider shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Zap size={14} className="text-amber-500" />
              Cadastro Rápido
            </button>
            <button
              onClick={() => navigate('/leads/new')}
              className="flex items-center gap-1.5 px-6 py-3 bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl text-[11px] font-bold uppercase tracking-wider shadow-md hover:shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={14} />
              Novo Lead
            </button>
          </div>
        </div>

        {/* ═══════════ PAINEL DE FILTROS ═══════════ */}
        {isFilterOpen && (
          <div className="surface-glass rounded-2xl p-5 animate-fadeUp">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="f-fase" className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Fase</label>
                <select
                  id="f-fase"
                  value={filterPhase}
                  onChange={e => setFilterPhase(e.target.value)}
                  className="w-full px-3 py-2.5 bg-card border border-border/80 rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring transition-all"
                >
                  <option value="all">Todas as fases</option>
                  {phases.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="f-origem" className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Origem</label>
                <select
                  id="f-origem"
                  value={filterSource}
                  onChange={e => setFilterSource(e.target.value)}
                  className="w-full px-3 py-2.5 bg-card border border-border/80 rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring transition-all"
                >
                  <option value="all">Todas as origens</option>
                  {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="f-parados" className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Sem contato há</label>
                <select
                  id="f-parados"
                  value={filterParados}
                  onChange={e => setFilterParados(e.target.value)}
                  className="w-full px-3 py-2.5 bg-card border border-border/80 rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring transition-all"
                >
                  <option value="all">Qualquer tempo</option>
                  <option value="3">+3 dias</option>
                  <option value="7">+7 dias</option>
                  <option value="15">+15 dias</option>
                  <option value="30">+30 dias</option>
                </select>
              </div>

              {isEmpresa && teamMembers.length > 0 && (
                <div>
                  <label htmlFor="f-vendedor" className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Vendedor</label>
                  <select
                    id="f-vendedor"
                    value={filterVendedor}
                    onChange={e => setFilterVendedor(e.target.value)}
                    className="w-full px-3 py-2.5 bg-card border border-border/80 rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring transition-all"
                  >
                    <option value="all">Todos os vendedores</option>
                    {teamMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Temperatura + sinais de compra + limpar */}
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-border/60">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mr-1">Temperatura</span>
              {([
                { v: 'all', label: 'Todas', icon: null as React.ReactNode },
                { v: LeadTemperature.HOT, label: 'Quente', icon: <Flame size={13} /> },
                { v: LeadTemperature.WARM, label: 'Morna', icon: <Droplet size={13} /> },
                { v: LeadTemperature.COLD, label: 'Fria', icon: <Snowflake size={13} /> },
              ]).map(t => (
                <button
                  key={t.v}
                  onClick={() => setFilterTemp(t.v)}
                  aria-pressed={filterTemp === t.v}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all ${filterTemp === t.v ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border/80 text-muted-foreground hover:bg-muted'}`}
                >
                  {t.icon}{t.label}
                </button>
              ))}

              <span className="w-px h-5 bg-border mx-2 hidden sm:block" />

              <button
                onClick={() => setFilterEntrada(!filterEntrada)}
                aria-pressed={filterEntrada}
                title="Leads que informaram ter valor de entrada"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all ${filterEntrada ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40' : 'bg-card border-border/80 text-muted-foreground hover:bg-muted'}`}
              >
                <DollarSign size={13} /> Com entrada
              </button>
              <button
                onClick={() => setFilterTroca(!filterTroca)}
                aria-pressed={filterTroca}
                title="Leads que têm veículo para dar na troca"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all ${filterTroca ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40' : 'bg-card border-border/80 text-muted-foreground hover:bg-muted'}`}
              >
                <Car size={13} /> Com troca
              </button>

              <div className="ml-auto flex items-center gap-3">
                <span className="text-[11px] font-bold text-muted-foreground">
                  {visibleLeads.length} {visibleLeads.length === 1 ? 'lead' : 'leads'}
                </span>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <X size={13} /> Limpar filtros
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0">{viewMode === 'kanban' ? renderKanban() : renderList()}</div>

      {activeModal === 'disqualify' && actionLead && (
        <DisqualificationModal
          isOpen={true}
          onClose={() => { setActiveModal(null); setActionLead(null); setPendingPhase(null); }}
          onConfirm={handleConfirmDisqualify}
          leadName={actionLead.name}
        />
      )}

      {activeModal === 'visit' && actionLead && (
        <LeadSchedulingModal
          lead={actionLead}
          isOpen={true}
          onClose={() => { setActiveModal(null); setActionLead(null); setPendingPhase(null); }}
          onConfirm={handleConfirmScheduling}
        />
      )}

      {activeModal === 'simulation' && actionLead && (
        <LeadSimulationModal
          lead={actionLead}
          isOpen={true}
          onClose={() => { setActiveModal(null); setActionLead(null); setPendingPhase(null); }}
          onConfirm={handleConfirmSimulation}
        />
      )}

      {activeModal === 'followup' && actionLead && (
        <LeadFollowUpModal
          lead={actionLead}
          isOpen={true}
          onClose={() => { setActiveModal(null); setActionLead(null); setPendingPhase(null); }}
          onConfirm={handleConfirmFollowUp}
        />
      )}

      {activeModal === 'sale' && actionLead && (
        <LeadSaleModal
          isOpen={true}
          onClose={() => { setActiveModal(null); setActionLead(null); setPendingPhase(null); }}
          leadId={actionLead.id}
          leads={leads}
          vehicles={vehicles}
          onSuccess={handleSaleSuccess}
          onAddLead={onAddLead}
        />
      )}

      <QuickLeadModal
        isOpen={isQuickLeadOpen}
        onClose={() => setIsQuickLeadOpen(false)}
        onSuccess={() => {
          onRefresh?.();
          onDataChange?.();
        }}
      />
    </div>
  );
};

export default LeadManager;
