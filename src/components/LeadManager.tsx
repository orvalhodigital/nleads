import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus, MessageCircle, Filter, LayoutGrid, Rows, ChevronLeft, ChevronRight,
  Edit2, Check, X, Car, Trash2, Phone, Mail, ArrowRight,
  CalendarCheck, Clock, ExternalLink, Search, CheckSquare, Square, Upload,
  Briefcase, Users, User, MapPin, DollarSign, Calendar, Sliders, Settings,
  MessageSquare, MoreVertical, CreditCard, LayoutTemplate, Tag, Trash, FileText,
  AlertTriangle, Menu, UserPlus, Zap, History, UserCheck, Smartphone, Target, Info
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import { Lead, LeadPhase, LeadTemperature, LeadCommunication, Tag as TagType, Vehicle, VehicleType, TransmissionType, EngineType, SaleDetails } from '../types';
import { leadService } from '../services/leadService';
import { notificationService } from '../services/notificationService';
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



interface LeadManagerProps {
  type?: 'leads' | 'sales';
  leads: Lead[];
  phases?: LeadPhase[];
  onAddLead: (lead: any) => Promise<Lead | null>;
  onUpdateLead: (lead: Lead) => Promise<void>;
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
}

const SOURCES = ['Site', 'WhatsApp', 'Facebook', 'Instagram', 'Indicação', 'Telefone', 'Outros'];

const LeadManager: React.FC<LeadManagerProps> = ({
  type = 'leads', leads, phases: propPhases, onAddLead, onUpdateLead, onDeleteLead, onViewLead,
  focusedLeadId, onClearFocus, onRefresh, userEmail, onDataChange, companyName, impersonatedUserId, vehicles = []
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
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

  const phases = useMemo(() => {
    if (propPhases) return propPhases;
    if (type === 'leads') {
      return [LeadPhase.NEW, LeadPhase.VISIT, LeadPhase.SIMULATION, LeadPhase.FOLLOW_UP, LeadPhase.COMPLETED, LeadPhase.DISQUALIFIED];
    }
    return [LeadPhase.WAITING_PAYMENT, LeadPhase.DOCUMENTATION, LeadPhase.DELIVERY, LeadPhase.COMPLETED];
  }, [propPhases, type]);

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case LeadPhase.NEW: return 'amber';      // Yellow tone
      case LeadPhase.VISIT: return 'sky';
      case LeadPhase.SIMULATION: return 'indigo';
      case LeadPhase.FOLLOW_UP: return 'emerald';  // Green tone
      case LeadPhase.COMPLETED: return 'green';    // Strong green
      case LeadPhase.DISQUALIFIED: return 'rose';   // Light red
      default: return 'slate';
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case LeadPhase.NEW: return <UserPlus size={14} />;
      case LeadPhase.VISIT: return <Calendar size={14} />;
      case LeadPhase.SIMULATION: return <Zap size={14} />;
      case LeadPhase.FOLLOW_UP: return <History size={14} />;
      case LeadPhase.COMPLETED: return <UserCheck size={14} />;
      case LeadPhase.DISQUALIFIED: return <X size={14} />;
      default: return <Target size={14} />;
    }
  };

  // consolidated state
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState('');

  // Disqualification State
  const [disqualificationState, setDisqualificationState] = useState<{ isOpen: boolean; leadId: string | null }>({ isOpen: false, leadId: null });

  // Sale Modal State (new)
  const [saleModalState, setSaleModalState] = useState<{ isOpen: boolean; leadId: string | null }>({ isOpen: false, leadId: null });

  // Add new specific modals for Pipeline Drag-n-Drop functionality
  const [schedulingModalState, setSchedulingModalState] = useState<{ isOpen: boolean; lead: Lead | null }>({ isOpen: false, lead: null });
  const [simulationModalState, setSimulationModalState] = useState<{ isOpen: boolean; lead: Lead | null }>({ isOpen: false, lead: null });
  const [followUpModalState, setFollowUpModalState] = useState<{ isOpen: boolean; lead: Lead | null }>({ isOpen: false, lead: null });

  // Filter & Search State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterTemp, setFilterTemp] = useState<string>('all');
  const [searchQueryLeads, setSearchQueryLeads] = useState('');
  const [searchQueryVehicles, setSearchQueryVehicles] = useState('');

  // Infinite Scroll / Pagination per column
  const [columnLimits, setColumnLimits] = useState<Record<string, number>>(
    phases.reduce((acc, phase) => ({ ...acc, [phase]: 14 }), {})
  );

  const handleColumnScroll = (e: React.UIEvent<HTMLDivElement>, phase: string) => {
    const target = e.currentTarget;
    const isBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50; // 50px threshold
    if (isBottom) {
      setColumnLimits(prev => ({
        ...prev,
        [phase]: (prev[phase] || 14) + 14
      }));
    }
  };

  // For leads view: is_buyer leads appear in COMPLETED column regardless of actual phase
  const getDisplayPhase = (lead: Lead): LeadPhase => {
    if (type === 'leads' && lead.is_buyer) return LeadPhase.COMPLETED;
    return lead.phase;
  };

  const getEvoAlert = (lead: Lead) => {
    const now = new Date();
    // Midnight normalized today
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
    // Explicitly add DISQUALIFIED if not in phases but we want to filter it? 
    // Usually if we are in "leads" view, we want to see Disqualified if filter says so.
    if (type === 'leads') allowedPhases.add(LeadPhase.DISQUALIFIED);

    return leads.filter(lead => {
      // In leads view: buyers (is_buyer=true) should always show in COMPLETED column
      if (type === 'leads' && lead.is_buyer) {
        // Apply search filter only
        if (searchQueryLeads) {
          const query = searchQueryLeads.toLowerCase();
          return (
            lead.name.toLowerCase().includes(query) ||
            lead.phone.toLowerCase().includes(query) ||
            lead.email.toLowerCase().includes(query)
          );
        }
        // Apply phase filter — show buyers only if filter is 'all' or COMPLETED
        if (filterPhase !== 'all' && filterPhase !== LeadPhase.COMPLETED) return false;
        if (filterSource !== 'all' && lead.source !== filterSource) return false;
        if (filterTemp !== 'all' && lead.temperature !== filterTemp) return false;
        return true;
      }

      // Check if lead belongs to the current "context" (leads or sales)
      if (!allowedPhases.has(lead.phase)) return false;

      if (filterPhase !== 'all' && lead.phase !== filterPhase) return false;
      if (filterSource !== 'all' && lead.source !== filterSource) return false;
      if (filterTemp !== 'all' && lead.temperature !== filterTemp) return false;

      if (searchQueryLeads) {
        const query = searchQueryLeads.toLowerCase();
        return (
          lead.name.toLowerCase().includes(query) ||
          lead.phone.toLowerCase().includes(query) ||
          lead.email.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [leads, phases, filterPhase, filterSource, filterTemp, searchQueryLeads, type]);

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newPhase = destination.droppableId as LeadPhase;

    const lead = leads.find(l => l.id === draggableId);
    if (!lead || lead.phase === newPhase) return;

    // Special Handling for Disqualified
    if (newPhase === LeadPhase.DISQUALIFIED) {
      navigate(`/leads/${lead.id}/action/disqualify`);
      return;
    }

    if (newPhase === LeadPhase.VISIT) {
      navigate(`/leads/${lead.id}/action/visit`);
      return;
    }

    if (newPhase === LeadPhase.SIMULATION) {
      navigate(`/leads/${lead.id}/action/simulation`);
      return;
    }

    if (newPhase === LeadPhase.FOLLOW_UP) {
      navigate(`/leads/${lead.id}/action/followup`);
      return;
    }

    // Special Handling for Completed (Sale)
    if (newPhase === LeadPhase.COMPLETED) {
      navigate(`/leads/${lead.id}/action/sale`);
      return;
    }

    try {
      const oldPhase = lead.phase;
      await onUpdateLead({ ...lead, phase: newPhase });
      // Notification
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

  const prepareMessageModal = (vehicle: Vehicle) => {
    if (!selectedLead) return;
    const msg = `Olá ${selectedLead.name}, chegou em nosso estoque esse veículo: ${vehicle.brand} ${vehicle.model} ${vehicle.year} por R$ ${formatCurrency(vehicle.price)}, quer mais detalhes sobre ele?`;

    setMessageTemplate(msg);
    window.open(`https://wa.me/55${selectedLead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleUpdateVisit = async (date: string, status: 'pending' | 'show' | 'noshow') => {
    if (!selectedLead) return;
    try {
      const updatedLead = {
        ...selectedLead,
        visit_date: date,
        visit_status: status
      };
      await onUpdateLead(updatedLead);
      setSelectedLead(updatedLead);
      showToast('success', `Visita ${status === 'show' ? 'confirmada' : status === 'noshow' ? 'faltou' : 'atualizada'}!`);
      onDataChange?.();
    } catch (error) {
      showToast('error', 'Erro ao atualizar visita.');
    }
  };


  const renderLeadDetail = () => {
    if (!selectedLead) return null;

    const matchingVehicles = vehicles.filter(v =>
      v.status === 'available' &&
      (v.price <= (selectedLead.preferences.valor_maximo || 9999999)) &&
      (selectedLead.preferences.marcas.length === 0 || selectedLead.preferences.marcas.includes(v.brand))
    );

    const purchasedVehicles = vehicles.filter(v => v.saleDetails?.buyerLeadId === selectedLead.id);

    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setSelectedLead(null)}>
        <div className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fadeUp" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl">
                {selectedLead.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{selectedLead.name}</h2>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${selectedLead.temperature === LeadTemperature.HOT ? 'bg-rose-50 text-rose-600 border-rose-100' :
                    selectedLead.temperature === LeadTemperature.WARM ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      'bg-sky-50 text-sky-600 border-sky-100'
                    }`}>
                    {selectedLead.temperature}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedLead.phase}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSaleModalState({ isOpen: true, leadId: selectedLead.id })}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-sm active:scale-95"
              >
                <DollarSign size={14} /> Registrar Venda
              </button>
              <button
                onClick={() => navigate(`/leads/edit/${selectedLead.id}`)}
                className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all shadow-sm active:scale-95"
              >
                <Edit2 size={14} /> Editar
              </button>
              <button onClick={() => setSelectedLead(null)} className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-50/30">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Info Column */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Ficha de Contato</h3>
                  <div className="space-y-2.5">
                    <div className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center gap-3 group hover:border-emerald-200 transition-all">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                        <Phone size={14} />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{selectedLead.phone}</span>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center gap-3 group">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 transition-colors">
                        <Mail size={14} />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{selectedLead.email || 'Não informado'}</span>
                    </div>
                  </div>
                </div>

                {/* Histórico de Follow-up */}
                {(selectedLead.follow_up_data?.nextContactDate || selectedLead.follow_up_data?.notes) && (
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Histórico de Follow-up</h3>
                    <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
                      {selectedLead.follow_up_data.nextContactDate && (
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Próximo Contato</p>
                          <p className="text-sm font-semibold text-slate-700">{new Date(selectedLead.follow_up_data.nextContactDate).toLocaleDateString('pt-BR')}</p>
                        </div>
                      )}
                      {selectedLead.follow_up_data.notes && (
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Observações</p>
                          <p className="text-sm font-medium text-slate-600 bg-slate-50 p-3 rounded-xl">{selectedLead.follow_up_data.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Agendamento de Visita</h3>
                  <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-5">

                    {selectedLead.scheduling_data?.vehicleOfInterest && (
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Veículo de Interesse</p>
                        <p className="text-sm font-semibold text-slate-700 bg-emerald-50 text-emerald-700 p-2.5 rounded-lg border border-emerald-100">{selectedLead.scheduling_data.vehicleOfInterest}</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={12} /> Data/Hora Agendada
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <CustomDatePicker
                          value={selectedLead.visit_date ? new Date(new Date(selectedLead.visit_date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10) : ''}
                          onChange={(date) => {
                            const timePart = selectedLead.visit_date ? new Date(new Date(selectedLead.visit_date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(11, 16) : '10:00';
                            handleUpdateVisit(new Date(`${date}T${timePart}`).toISOString(), selectedLead.visit_status || 'pending');
                          }}
                        />
                        <CustomTimePicker
                          value={selectedLead.visit_date ? new Date(new Date(selectedLead.visit_date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(11, 16) : '10:00'}
                          onChange={(time) => {
                            const datePart = selectedLead.visit_date ? new Date(new Date(selectedLead.visit_date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
                            handleUpdateVisit(new Date(`${datePart}T${time}`).toISOString(), selectedLead.visit_status || 'pending');
                          }}
                        />
                      </div>
                    </div>
                    {selectedLead.scheduling_data?.notes && (
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Notas da Visita</p>
                        <p className="text-sm font-medium text-slate-600 bg-slate-50 p-3 rounded-xl">{selectedLead.scheduling_data.notes}</p>
                      </div>
                    )}

                    <div className="pt-2">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Ações do Histórico (Agendamento Novo / Fechado)</p>
                      <div className="grid grid-cols-2 gap-2 border-t border-slate-50 pt-2">
                        <button
                          onClick={() => handleUpdateVisit(selectedLead.visit_date || '', 'show')}
                          className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${selectedLead.visit_status === 'show' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                        >
                          Confirmado
                        </button>
                        <button
                          onClick={() => handleUpdateVisit(selectedLead.visit_date || '', 'noshow')}
                          className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${selectedLead.visit_status === 'noshow' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/10' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                        >
                          Não Veio
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferences and Suggestions */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">Perfil de Interesse</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Câmbio</p>
                      <p className="text-sm font-bold text-slate-700">
                        {Array.isArray(selectedLead.preferences.transmissao) ? selectedLead.preferences.transmissao.join(', ') : (selectedLead.preferences.transmissao || 'Qualquer')}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Potencial Compra</p>
                      <p className="text-sm font-bold text-emerald-600">R$ {selectedLead.preferences.valor_maximo ? formatCurrency(selectedLead.preferences.valor_maximo) : 'N/A'}</p>

                    </div>
                    {selectedLead.preferences.motorizacao && selectedLead.preferences.motorizacao.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Motorização</p>
                        <p className="text-sm font-bold text-slate-700">
                          {Array.isArray(selectedLead.preferences.motorizacao) ? selectedLead.preferences.motorizacao.join(', ') : selectedLead.preferences.motorizacao}
                        </p>
                      </div>
                    )}
                    {selectedLead.preferences.tipos_veiculo && selectedLead.preferences.tipos_veiculo.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tipos de Veículo</p>
                        <p className="text-sm font-bold text-slate-700">
                          {Array.isArray(selectedLead.preferences.tipos_veiculo) ? selectedLead.preferences.tipos_veiculo.join(', ') : selectedLead.preferences.tipos_veiculo}
                        </p>
                      </div>
                    )}
                    <div className="col-span-full pt-4 border-t border-slate-50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Modelos de Interesse</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedLead.preferences.modelos && selectedLead.preferences.modelos.length > 0 ? (
                          selectedLead.preferences.modelos.map(m => (
                            <span key={m} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-bold uppercase tracking-tight">{m}</span>
                          ))
                        ) : (
                          <span className="text-xs font-medium text-slate-400 italic">Nenhum modelo definido</span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-full pt-4 border-t border-slate-50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Marcas Preferenciais</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedLead.preferences.marcas.length > 0 ? (
                          selectedLead.preferences.marcas.map(m => (
                            <span key={m} className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-tight">{m}</span>
                          ))
                        ) : (
                          <span className="text-xs font-medium text-slate-400 italic">Nenhuma marca definida</span>
                        )}
                      </div>
                    </div>
                    {(selectedLead.preferences.possui_entrada || selectedLead.preferences.possui_troca) && (
                      <div className="col-span-full grid grid-cols-2 gap-8 pt-4 border-t border-slate-50">
                        {selectedLead.preferences.possui_entrada && (
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Entrada Planejada</p>
                            <p className="text-sm font-bold text-emerald-600">R$ {formatCurrency(selectedLead.preferences.valor_entrada || 0)}</p>
                          </div>
                        )}
                        {selectedLead.preferences.possui_troca && (
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Veículo para Troca</p>
                            <p className="text-sm font-bold text-slate-700">{selectedLead.preferences.veiculo_troca}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {selectedLead.preferences.observacoes_adicionais && (
                      <div className="col-span-full pt-4 border-t border-slate-50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Observações Adicionais</p>
                        <p className="text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-xl italic">"{selectedLead.preferences.observacoes_adicionais}"</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dados de Simulação */}
                {(selectedLead.simulation_data?.cpf || selectedLead.simulation_data?.downPayment || selectedLead.simulation_data?.installments || selectedLead.simulation_data?.notes) && (
                  <div>
                    <h3 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-4 px-1">Dados de Simulação</h3>
                    <div className="p-6 bg-white rounded-3xl border border-indigo-100 shadow-sm grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Entrada Proposta</p>
                        <p className="text-sm font-semibold text-indigo-700 bg-indigo-50 px-3 py-2 rounded-xl w-fit">R$ {selectedLead.simulation_data.downPayment ? formatCurrency(selectedLead.simulation_data.downPayment) : '0'}</p>

                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Parcelamento</p>
                        <p className="text-sm font-semibold text-slate-700">{selectedLead.simulation_data.installments ? `${selectedLead.simulation_data.installments}x` : 'N/A'}</p>
                      </div>
                      {(selectedLead.simulation_data.cpf || selectedLead.simulation_data.cnh) && (
                        <div className="col-span-full flex gap-4">
                          {selectedLead.simulation_data.cpf && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">CPF: {selectedLead.simulation_data.cpf}</span>}
                          {selectedLead.simulation_data.cnh && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">CNH: {selectedLead.simulation_data.cnh}</span>}
                        </div>
                      )}
                      {selectedLead.simulation_data.notes && (
                        <div className="col-span-full pt-4 border-t border-indigo-50">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Notas da Simulação</p>
                          <p className="text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-xl">{selectedLead.simulation_data.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {purchasedVehicles.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest px-1 flex items-center gap-2">
                      <Car size={14} /> Veículo Adquirido
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {purchasedVehicles.map(v => (
                        <div key={v.id} className="bg-white p-6 rounded-3xl border border-emerald-100 flex items-center justify-between shadow-sm group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100/50">
                              <Car size={20} />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">{v.brand} {v.model}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">
                                {v.year} • {v.plate}
                                {v.saleDetails?.saleDate ? ` • Adquirido em ${new Date(v.saleDetails.saleDate).toLocaleDateString('pt-BR')} por R$ ${v.saleDetails.salePrice ? formatCurrency(v.saleDetails.salePrice) : ''}` : ''}

                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => navigate('/inventory', { state: { selectedVehicleId: v.id } })}
                            className="p-2.5 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                            title="Ver no Estoque"
                          >
                            <ExternalLink size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Sugestões de Inventário</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matchingVehicles.length > 0 ? (
                      matchingVehicles.slice(0, 4).map(v => (
                        <div key={v.id} className="bg-white p-5 rounded-3xl border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all group flex flex-col gap-4">
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-widest w-fit">{v.year}</span>
                              <h4 className="font-bold text-slate-900 text-sm mt-1">{v.brand} {v.model}</h4>
                            </div>
                            <Car size={16} className="text-slate-200 group-hover:text-emerald-500 transition-colors" />
                          </div>
                          <p className="text-xs font-bold text-emerald-600">R$ {formatCurrency(v.price)}</p>

                          <div className="flex gap-2">
                            <button onClick={() => navigate('/inventory', { state: { selectedVehicleId: v.id } })} className="flex-1 py-2.5 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-100 transition-colors">Detalhes</button>
                            <button onClick={() => prepareMessageModal(v)} className="flex-[2] py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-600 transition-colors">Sugerir Via WhatsApp</button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-8 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                        <p className="text-xs font-medium text-slate-400 italic">Nenhum veículo compatível encontrado no momento.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const colorMapping: Record<string, { bgSection: string, border: string, text: string, textStrong: string, bgIcon: string, ring: string, line: string, btnBg: string, bgCardHover: string, headerBg: string, columnBg: string }> = {
    amber: { bgSection: 'bg-amber-50/50', border: 'border-amber-200', text: 'text-amber-600', textStrong: 'text-slate-900', bgIcon: 'bg-amber-100', ring: 'ring-amber-50', line: 'border-amber-100', btnBg: 'bg-amber-500', bgCardHover: 'hover:border-amber-400', headerBg: 'bg-amber-100/50', columnBg: 'bg-amber-50/50' }, // Novo Lead
    sky: { bgSection: 'bg-sky-50/50', border: 'border-sky-200', text: 'text-sky-600', textStrong: 'text-slate-900', bgIcon: 'bg-sky-100', ring: 'ring-sky-50', line: 'border-sky-100', btnBg: 'bg-sky-500', bgCardHover: 'hover:border-sky-400', headerBg: 'bg-sky-100/50', columnBg: 'bg-slate-200/40' },
    indigo: { bgSection: 'bg-indigo-50/50', border: 'border-indigo-200', text: 'text-indigo-600', textStrong: 'text-slate-900', bgIcon: 'bg-indigo-100', ring: 'ring-indigo-50', line: 'border-indigo-100', btnBg: 'bg-indigo-600', bgCardHover: 'hover:border-indigo-400', headerBg: 'bg-indigo-100/50', columnBg: 'bg-slate-200/40' },
    emerald: { bgSection: 'bg-emerald-50/50', border: 'border-emerald-200', text: 'text-emerald-600', textStrong: 'text-slate-900', bgIcon: 'bg-emerald-100', ring: 'ring-emerald-50', line: 'border-emerald-100', btnBg: 'bg-emerald-500', bgCardHover: 'hover:border-emerald-400', headerBg: 'bg-emerald-100/50', columnBg: 'bg-emerald-50/40' }, // Follow-up
    green: { bgSection: 'bg-emerald-100/40', border: 'border-emerald-300', text: 'text-emerald-700', textStrong: 'text-slate-900', bgIcon: 'bg-emerald-200', ring: 'ring-emerald-100', line: 'border-emerald-200', btnBg: 'bg-emerald-600', bgCardHover: 'hover:border-emerald-500', headerBg: 'bg-emerald-200/50', columnBg: 'bg-emerald-100/30' }, // Compradores (forte)
    rose: { bgSection: 'bg-rose-50/60', border: 'border-rose-200', text: 'text-rose-600', textStrong: 'text-slate-900', bgIcon: 'bg-rose-100', ring: 'ring-rose-50', line: 'border-rose-100', btnBg: 'bg-rose-500', bgCardHover: 'hover:border-rose-400', headerBg: 'bg-rose-100/50', columnBg: 'bg-rose-50/50' }, // Desqualificados
    slate: { bgSection: 'bg-slate-200/50', border: 'border-slate-300', text: 'text-slate-500', textStrong: 'text-slate-900', bgIcon: 'bg-slate-300', ring: 'ring-slate-200', line: 'border-slate-300', btnBg: 'bg-slate-600', bgCardHover: 'hover:border-slate-400', headerBg: 'bg-slate-200/80', columnBg: 'bg-slate-100' },
  };

  const renderFilterControls = () => {
    if (!isFilterOpen) return null;
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm animate-fadeUp">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase text-slate-400 px-1 block">Filtro por Fase</label>
          <select value={filterPhase} onChange={e => setFilterPhase(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500/5 transition-all outline-none">
            <option value="all">Todas as Fases</option>
            {phases.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase text-slate-400 px-1 block">Filtro por Origem</label>
          <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500/5 transition-all outline-none">
            <option value="all">Todas as Origens</option>
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={() => { setFilterPhase('all'); setFilterSource('all'); setFilterTemp('all'); setSearchQueryLeads(''); }} className="w-full py-3.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-200 transition-all">Limpar Filtros</button>
        </div>
      </div>
    );
  };

  const renderKanban = () => {
    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden">
          <div className="flex gap-5 h-full w-full overflow-x-auto px-1 pb-6 no-scrollbar overflow-y-hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`
              .no-scrollbar::-webkit-scrollbar { display: none; }
              .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
              /* Hide scrollbar for the parent layout when on this page */
              .leads-page-container::-webkit-scrollbar { display: none; }
              * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
              *::-webkit-scrollbar { display: none !important; }
            `}</style>
            {phases.map((phase) => {
              const leadsInPhase = visibleLeads.filter(l => getDisplayPhase(l) === phase);
              const limit = columnLimits[phase] || 14;
              const paginatedLeads = leadsInPhase.slice(0, limit);

              const colorKey = getPhaseColor(phase);
              const colors = colorMapping[colorKey] || colorMapping.slate;
              const isDisqualified = phase === LeadPhase.DISQUALIFIED;
              const isCollapsed = isDisqualified && !isDisqualifiedExpanded;
              const leadsCount = leadsInPhase.length;

              return (
                <div key={phase} className={`shrink-0 flex flex-col gap-2 h-full p-2 rounded-[28px] ${colors.columnBg} animate-fadeIn transition-all duration-300 border border-slate-200/20 ${isCollapsed ? 'w-[70px]' : 'w-[290px]'} overflow-hidden`}>
                  {/* Column Header */}
                  <div
                    onClick={() => isDisqualified && setIsDisqualifiedExpanded(!isDisqualifiedExpanded)}
                    className={`flex items-center justify-between px-4 py-3 border rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-all ${isCollapsed ? 'flex-col gap-10 py-8 ' + colors.headerBg + ' ' + colors.border : 'bg-white border-slate-200/60'}`}
                  >
                    <div className={`flex items-center gap-2.5 ${isCollapsed ? 'flex-col' : ''}`}>
                      <div className={`p-2.5 rounded-xl ${colors.bgIcon} ${colors.textStrong} shadow-sm`}>
                        {getPhaseIcon(phase)}
                      </div>
                      {!isCollapsed && <h3 className="text-[11px] font-black text-slate-800 tracking-wider uppercase">{phase}</h3>}
                      {isCollapsed && <h3 className="text-[10px] font-black text-slate-400 [writing-mode:vertical-lr] rotate-180 uppercase tracking-[0.2em]">{phase}</h3>}
                    </div>
                    {!isCollapsed && (
                      <div className="flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-white border border-slate-200 text-slate-500 rounded-lg text-[10px] font-black">
                        {leadsCount}
                      </div>
                    )}
                  </div>

                  {/* Column Content */}
                  {!isCollapsed && (
                    <Droppable droppableId={phase}>
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          onScroll={(e) => handleColumnScroll(e, phase)}
                          className={`flex-1 flex flex-col gap-2 min-h-0 overflow-y-auto p-1.5 rounded-2xl transition-all duration-300 relative group/droppable no-scrollbar hover:no-scrollbar ${snapshot.isDraggingOver ? 'bg-black/5 ring-1 ring-slate-900/5' : ''}`}
                          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                          {/* Visual Separator Top Line */}
                          <div className={`sticky top-0 left-0 right-0 h-1.5 rounded-t-2xl ${colors.btnBg} opacity-50 z-10 shrink-0`} />

                          {paginatedLeads.map((lead, index) => (
                            /* @ts-ignore */
                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                              {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => {
                                const card = (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => !snapshot.isDragging && navigate(`/leads/${lead.id}`)}
                                    className={`group bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 cursor-grab active:cursor-grabbing ${snapshot.isDragging ? 'shadow-xl ring-1 ring-emerald-500/50' : ''} shrink-0`}
                                    style={provided.draggableProps.style}
                                  >
                                    <div className="flex items-center gap-2.5 mb-2 relative">
                                      <div className={`relative w-9 h-9 shrink-0 rounded-lg ${colors.btnBg} text-white flex items-center justify-center font-bold text-xs shadow-sm`}>
                                        {lead.name.charAt(0)}
                                        <div className={`absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full border-2 border-white ${lead.temperature === LeadTemperature.HOT ? 'bg-rose-500' : lead.temperature === LeadTemperature.WARM ? 'bg-amber-400' : 'bg-blue-400'}`} />
                                      </div>
                                      <div className="flex-1 min-w-0 pr-6">
                                        <h4 className="text-[13px] font-bold text-slate-900 truncate group-hover:text-emerald-600 transition-colors tracking-tight">{lead.name}</h4>
                                        <p className="text-[10px] font-medium text-slate-400 mt-0.5">{lead.source} • {lead.phone}</p>
                                      </div>
                                      {(() => {
                                        const alert = getEvoAlert(lead);
                                        if (alert.show) {
                                          return (
                                            <div className="absolute top-0 right-0 text-amber-500 group/tooltip">
                                              <Info size={16} />
                                              <div className="absolute bottom-full right-0 mb-2 hidden group-hover/tooltip:block w-48 bg-slate-800 text-white text-[10px] p-2 rounded-lg shadow-xl z-50 pointer-events-none">
                                                {alert.msg}
                                                {/* Tooltip arrow */}
                                                <div className="absolute top-full right-1 w-2 h-2 bg-slate-800 rotate-45 transform origin-top-left -mt-1"></div>
                                              </div>
                                            </div>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </div>

                                    {lead.preferences.valor_maximo && (
                                      <div className="flex items-center justify-between mb-2.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100/50">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Potencial</span>
                                        <span className="text-xs font-bold text-slate-700">R$ {formatCurrency(lead.preferences.valor_maximo)}</span>

                                      </div>
                                    )}

                                    <div className="flex flex-wrap gap-1 mb-2.5">
                                      {lead.preferences.marcas.slice(0, 2).map(m => (
                                        <span key={m} className="px-2 py-0.5 bg-white border border-slate-100 text-slate-600 rounded-lg text-[8px] font-bold uppercase tracking-tight">{m}</span>
                                      ))}
                                      {lead.preferences.marcas.length > 2 && <span className="px-2 py-0.5 text-slate-400 text-[8px] font-bold tracking-tight">+{lead.preferences.marcas.length - 2}</span>}
                                    </div>

                                    {lead.visit_date && (
                                      <div className="pt-2.5 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                          <Clock size={10} className="text-slate-300" />
                                          <p className="text-[9px] font-bold text-slate-500">
                                            {new Date(lead.visit_date).toLocaleDateString([], { day: '2-digit', month: '2-digit' })} às {new Date(lead.visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </p>
                                        </div>
                                        <span className={`px-1.5 py-0.5 rounded-md text-[7px] font-bold border ${lead.visit_status === 'show' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                          {lead.visit_status === 'show' ? 'CONFIRMADO' : 'PENDENTE'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                                // Renderiza via portal quando arrastando para evitar offset causado pelo container com overflow
                                return snapshot.isDragging ? createPortal(card, document.body) : card;
                              }}
                            </Draggable>
                          ))}
                          {provided.placeholder}
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
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-fadeUp">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-5 w-16 text-center">
                  <input type="checkbox" checked={selectedLeadIds.size === visibleLeads.length && visibleLeads.length > 0} onChange={toggleAllVisible} className="rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500/20 transition-all" />
                </th>
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Cliente</th>
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Fase Atual</th>
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Temperatura</th>
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none text-right">Data de Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visibleLeads.map(lead => {
                const displayPhase = getDisplayPhase(lead);
                const colorKey = getPhaseColor(displayPhase);
                const colors = colorMapping[colorKey] || colorMapping.slate;
                return (
                  <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)} className="hover:bg-slate-50/30 transition-all cursor-pointer group/row">
                    <td className="p-5 text-center" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedLeadIds.has(lead.id)} onChange={() => toggleLeadSelection(lead.id)} className="rounded-md border-slate-200 text-emerald-600 focus:ring-emerald-500/20 transition-all" />
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${colors.btnBg} text-white flex items-center justify-center font-bold uppercase text-xs shadow-sm`}>
                          {lead.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover/row:text-emerald-600 transition-colors">{lead.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[150px]">{lead.phone} • {lead.source}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg ${colors.bgSection} ${colors.textStrong} flex items-center justify-center border ${colors.border}`}>
                          {getPhaseIcon(displayPhase)}
                        </div>
                        <span className="text-[11px] font-bold text-slate-700">{displayPhase}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100">
                        <div className={`w-2 h-2 rounded-full ${lead.temperature === LeadTemperature.HOT ? 'bg-rose-500' : lead.temperature === LeadTemperature.WARM ? 'bg-amber-400' : 'bg-blue-400'}`} />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{lead.temperature}</span>
                      </div>
                    </td>
                    <td className="p-5 text-right">
                      <span className="text-xs font-semibold text-slate-400">{new Date(lead.createdAt).toLocaleDateString()}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visibleLeads.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-slate-400 text-sm font-medium">Nenhum lead encontrado para os filtros atuais.</p>
              <button onClick={() => { setFilterPhase('all'); setFilterSource('all'); setFilterTemp('all'); setSearchQueryLeads(''); }} className="mt-2 text-emerald-600 text-[11px] font-bold uppercase tracking-wider hover:underline">Limpar Filtros</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 space-y-6 animate-fadeIn overflow-hidden">
      <div className="flex flex-col gap-6 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-6 px-1">
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
              <button onClick={() => setViewMode('kanban')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700 font-semibold'}`}>
                <LayoutGrid size={15} strokeWidth={2.5} />
                <span className="text-[11px] uppercase tracking-wide">Kanban</span>
              </button>
              <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700 font-semibold'}`}>
                <Rows size={15} strokeWidth={2.5} />
                <span className="text-[11px] uppercase tracking-wide">Lista</span>
              </button>
            </div>
            <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={`flex items-center gap-2 px-5 py-3 border rounded-xl text-[11px] font-bold uppercase tracking-wide transition-all ${isFilterOpen ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:shadow-sm'}`}>
              <Filter size={15} strokeWidth={2.5} />
              Filtrar
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-100 text-slate-900 rounded-xl text-[11px] font-bold uppercase tracking-wide hover:shadow-sm transition-all">
              <Upload size={15} strokeWidth={2.5} /> Importar
            </button>
            <button onClick={() => navigate('/leads/new')} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl text-[11px] font-bold uppercase tracking-wide hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/10 active:scale-95">
              <Plus size={15} strokeWidth={3} /> Novo Lead
            </button>
            {selectedLeadIds.size > 0 && (
              <button onClick={handleBulkDelete} className="px-5 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[11px] font-bold uppercase tracking-wide hover:bg-rose-100 transition-all">
                Excluir ({selectedLeadIds.size})
              </button>
            )}
          </div>
        </div>

        {renderFilterControls()}
      </div>

      <div className="flex-1 min-h-0 min-w-0">
        {viewMode === 'kanban' ? renderKanban() : renderList()}
      </div>

    </div>
  );
};

export default LeadManager;
