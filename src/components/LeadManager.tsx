import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
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
import { Lead, LeadPhase, LeadTemperature, Tag as TagType, Vehicle, VehicleType, TransmissionType, EngineType, SaleDetails } from '../types';
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
const LeadImportModal = lazy(() => import('./LeadImportModal'));
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
  hasMoreLeads?: boolean;
  onLoadMore?: () => Promise<void>;
  loadingLeads?: boolean;
}

const SOURCES = ['Site', 'WhatsApp', 'Facebook', 'Instagram', 'Indicação', 'Telefone', 'Outros'];

const LeadManager: React.FC<LeadManagerProps> = ({
  type = 'leads', leads, phases: propPhases, onAddLead, onUpdateLead, onDeleteLead, onViewLead,
  focusedLeadId, onClearFocus, onRefresh, userEmail, onDataChange, companyName, impersonatedUserId, 
  vehicles = [], hasMoreLeads, onLoadMore, loadingLeads
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
      case LeadPhase.NEW: return 'amber';
      case LeadPhase.VISIT: return 'sky';
      case LeadPhase.SIMULATION: return 'indigo';
      case LeadPhase.FOLLOW_UP: return 'emerald';
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
  const [searchQueryLeads, setSearchQueryLeads] = useState('');

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

    return leads.filter(lead => {
      if (type === 'leads' && lead.is_buyer) {
        if (searchQueryLeads) {
          const query = searchQueryLeads.toLowerCase();
          return (
            lead.name.toLowerCase().includes(query) ||
            lead.phone.toLowerCase().includes(query) ||
            lead.email.toLowerCase().includes(query)
          );
        }
        if (filterPhase !== 'all' && filterPhase !== LeadPhase.COMPLETED) return false;
        if (filterSource !== 'all' && lead.source !== filterSource) return false;
        if (filterTemp !== 'all' && lead.temperature !== filterTemp) return false;
        return true;
      }

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
    if (newPhase === LeadPhase.COMPLETED) {
      navigate(`/leads/${lead.id}/action/sale`);
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

  const colorMapping: Record<string, any> = {
    amber: { columnBg: 'bg-amber-50/50', headerBg: 'bg-amber-100/50', border: 'border-amber-200', bgIcon: 'bg-amber-100', textStrong: 'text-slate-900', btnBg: 'bg-amber-500', bgSection: 'bg-amber-50/50' },
    sky: { columnBg: 'bg-slate-200/40', headerBg: 'bg-sky-100/50', border: 'border-sky-200', bgIcon: 'bg-sky-100', textStrong: 'text-slate-900', btnBg: 'bg-sky-500', bgSection: 'bg-sky-50/50' },
    indigo: { columnBg: 'bg-slate-200/40', headerBg: 'bg-indigo-100/50', border: 'border-indigo-200', bgIcon: 'bg-indigo-100', textStrong: 'text-slate-900', btnBg: 'bg-indigo-600', bgSection: 'bg-indigo-50/50' },
    emerald: { columnBg: 'bg-emerald-50/40', headerBg: 'bg-emerald-100/50', border: 'border-emerald-200', bgIcon: 'bg-emerald-100', textStrong: 'text-slate-900', btnBg: 'bg-emerald-500', bgSection: 'bg-emerald-50/50' },
    green: { columnBg: 'bg-emerald-100/30', headerBg: 'bg-emerald-200/50', border: 'border-emerald-300', bgIcon: 'bg-emerald-200', textStrong: 'text-slate-900', btnBg: 'bg-emerald-600', bgSection: 'bg-emerald-100/40' },
    rose: { columnBg: 'bg-rose-50/50', headerBg: 'bg-rose-100/50', border: 'border-rose-200', bgIcon: 'bg-rose-100', textStrong: 'text-slate-900', btnBg: 'bg-rose-500', bgSection: 'bg-rose-50/60' },
    slate: { columnBg: 'bg-slate-100', headerBg: 'bg-slate-200/80', border: 'border-slate-300', bgIcon: 'bg-slate-300', textStrong: 'text-slate-900', btnBg: 'bg-slate-600', bgSection: 'bg-slate-200/50' },
  };

  const renderKanban = () => {
    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden">
          <div className="kanban-scrollbar flex gap-5 h-full w-full overflow-x-auto px-1 pb-4 overflow-y-hidden">
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
                    className={`flex items-center justify-between px-4 py-3 border rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-all ${isCollapsed ? 'flex-col gap-10 py-8 ' + colors.headerBg + ' ' + colors.border : 'bg-white border-slate-200/60'}`}
                  >
                    <div className={`flex items-center gap-2.5 ${isCollapsed ? 'flex-col' : ''}`}>
                      <div className={`p-2.5 rounded-xl ${colors.bgIcon} ${colors.textStrong} shadow-sm`}>
                        {getPhaseIcon(phase)}
                      </div>
                      {!isCollapsed && <h3 className="text-[11px] font-black text-slate-800 tracking-wider uppercase">{phase}</h3>}
                      {isCollapsed && <h3 className="text-[10px] font-black text-slate-400 [writing-mode:vertical-lr] rotate-180 uppercase tracking-[0.2em]">{phase}</h3>}
                    </div>
                    {!isCollapsed && <div className="flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-white border border-slate-200 text-slate-500 rounded-lg text-[10px] font-black">{leadsInPhase.length}</div>}
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
                            <Draggable key={String(lead.id)} draggableId={String(lead.id)} index={index}>
                              {(provided, snapshot) => {
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
                                        <h4 className="text-[13px] font-bold text-slate-900 truncate tracking-tight">{lead.name}</h4>
                                        <p className="text-[10px] font-medium text-slate-400 mt-0.5">{lead.source} • {lead.phone}</p>
                                      </div>
                                    </div>
                                    <div className="space-y-1.5 mb-2.5">
                                      {lead.preferences.interesse_carro && (lead.preferences.carro_valor_max || lead.preferences.valor_maximo) && (
                                        <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                                          <div className="flex items-center gap-1.5">
                                            <Car size={10} className="text-emerald-500" />
                                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wider">Carro</span>
                                          </div>
                                          <span className="text-[10px] font-black text-emerald-700">R$ {formatCurrency(lead.preferences.carro_valor_max || lead.preferences.valor_maximo || 0)}</span>
                                        </div>
                                      )}
                                      {lead.preferences.interesse_moto && lead.preferences.moto_valor_max && (
                                        <div className="flex items-center justify-between px-3 py-1.5 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                                          <div className="flex items-center gap-1.5">
                                            <Target size={10} className="text-indigo-500" />
                                            <span className="text-[8px] font-black text-indigo-600 uppercase tracking-wider">Moto</span>
                                          </div>
                                          <span className="text-[10px] font-black text-indigo-700">R$ {formatCurrency(lead.preferences.moto_valor_max)}</span>
                                        </div>
                                      )}
                                      {!lead.preferences.interesse_carro && !lead.preferences.interesse_moto && lead.preferences.valor_maximo && (
                                        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100/50">
                                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Geral</span>
                                          <span className="text-[10px] font-black text-slate-700">R$ {formatCurrency(lead.preferences.valor_maximo)}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                                return snapshot.isDragging ? createPortal(card, document.body) : card;
                              }}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {loadingLeads && (
                            <div className="flex justify-center p-4">
                              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
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
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-5 w-16 text-center">
                  <input type="checkbox" checked={selectedLeadIds.size === visibleLeads.length && visibleLeads.length > 0} onChange={toggleAllVisible} className="rounded-md border-slate-300 text-emerald-600" />
                </th>
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fase Atual</th>
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temperatura</th>
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Data de Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visibleLeads.map(lead => {
                const displayPhase = getDisplayPhase(lead);
                const colors = colorMapping[getPhaseColor(displayPhase)] || colorMapping.slate;
                return (
                  <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)} className="hover:bg-slate-50/30 transition-all cursor-pointer group/row">
                    <td className="p-5 text-center" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedLeadIds.has(lead.id)} onChange={() => toggleLeadSelection(lead.id)} className="rounded-md border-slate-200 text-emerald-600" />
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${colors.btnBg} text-white flex items-center justify-center font-bold uppercase text-xs shadow-sm`}>{lead.name.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover/row:text-emerald-600 transition-colors">{lead.name}</p>
                          <span className="text-[10px] font-semibold text-slate-400">{lead.phone} • {lead.source}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg ${colors.bgSection} ${colors.textStrong} flex items-center justify-center border ${colors.border}`}>{getPhaseIcon(displayPhase)}</div>
                        <span className="text-[11px] font-bold text-slate-700">{displayPhase}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100">
                        <div className={`w-2 h-2 rounded-full ${lead.temperature === LeadTemperature.HOT ? 'bg-rose-500' : lead.temperature === LeadTemperature.WARM ? 'bg-amber-400' : 'bg-blue-400'}`} />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{lead.temperature}</span>
                      </div>
                    </td>
                    <td className="p-5 text-right"><span className="text-xs font-semibold text-slate-400">{new Date(lead.createdAt).toLocaleDateString()}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visibleLeads.length === 0 && <div className="py-20 text-center text-slate-400 text-sm font-medium">Nenhum lead encontrado.</div>}
        </div>
        {hasMoreLeads && (
          <div className="p-6 border-t border-slate-50 flex justify-center bg-slate-50/20">
            <button
              onClick={onLoadMore}
              disabled={loadingLeads}
              className="flex items-center gap-2 px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              {loadingLeads ? 'Carregando...' : 'Carregar mais leads'}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 space-y-6 animate-fadeIn overflow-hidden">
      <div className="flex flex-col gap-6 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-6 px-1">
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
              <button onClick={() => setViewMode('kanban')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 font-semibold'}`}>
                <LayoutGrid size={15} />
                <span className="text-[11px] uppercase">Kanban</span>
              </button>
              <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 font-semibold'}`}>
                <Rows size={15} />
                <span className="text-[11px] uppercase">Lista</span>
              </button>
            </div>
            <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={`flex items-center gap-2 px-5 py-3 border rounded-xl text-[11px] font-bold uppercase tracking-wide transition-all ${isFilterOpen ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>
              <Filter size={15} /> Filtrar
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsImportModalOpen(true)} className="px-5 py-3 bg-white border border-slate-100 text-slate-900 rounded-xl text-[11px] font-bold uppercase">Importar</button>
            <button onClick={() => navigate('/leads/new')} className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-[11px] font-bold uppercase shadow-md active:scale-95">Novo Lead</button>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0">{viewMode === 'kanban' ? renderKanban() : renderList()}</div>
      <LeadImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} currentLeads={leads} />
    </div>
  );
};

export default LeadManager;
