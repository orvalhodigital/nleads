import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { Lead, SalePhase, GuaranteeConfig } from '../types';
import { salesFlowService } from '../services/salesFlowService';
import { guaranteeService } from '../services/guaranteeService';
import { format, parseISO, differenceInDays, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, AlertCircle, Clock, Shield, X, ExternalLink } from 'lucide-react';

interface SalesKanbanProps {
  leads: Lead[];
  userId: string;
  onUpdate?: () => void;
}

const PHASES: { id: SalePhase; name: string; color: string; bgColor: string }[] = [
  { id: 'documentacao', name: '📋 Documentação', color: 'bg-blue-500', bgColor: 'bg-blue-50' },
  { id: 'entrega', name: '🚚 Entrega', color: 'bg-orange-500', bgColor: 'bg-orange-50' },
  { id: 'em_garantia', name: '⏱️ Em Garantia', color: 'bg-brand-500', bgColor: 'bg-brand-50' },
  { id: 'apos_garantia', name: '📞 Pós-Venda', color: 'bg-purple-500', bgColor: 'bg-purple-50' },
];

const SalesKanban: React.FC<SalesKanbanProps> = ({ leads, userId, onUpdate }) => {
  const navigate = useNavigate();
  const [guaranteeConfigs, setGuaranteeConfigs] = useState<GuaranteeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Quando há mais de uma garantia configurada, pergunta qual aplicar em vez
  // de sempre escolher a primeira (guaranteeConfigs[0]) silenciosamente —
  // antes disso, mover um card para "Em Garantia" aplicava sempre a mesma
  // garantia, mesmo que a loja tivesse várias opções configuradas.
  const [pendingGuaranteeLeadId, setPendingGuaranteeLeadId] = useState<string | null>(null);

  useEffect(() => {
    loadGuaranteeConfigs();
  }, [userId]);

  const loadGuaranteeConfigs = async () => {
    try {
      const configs = await guaranteeService.getGuaranteeConfigs(userId);
      setGuaranteeConfigs(configs);
    } catch (err) {
      console.error('Erro ao carregar garantias:', err);
    } finally {
      setLoading(false);
    }
  };

  const salesByPhase = useMemo(() => {
    const grouped: Record<SalePhase, Lead[]> = {
      documentacao: [],
      entrega: [],
      em_garantia: [],
      apos_garantia: [],
    };

    leads.filter((l) => l.saleStatus).forEach((lead) => {
      const phase = lead.saleStatus as SalePhase;
      if (phase in grouped) {
        grouped[phase].push(lead);
      }
    });

    return grouped;
  }, [leads]);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    try {
      const leadId = draggableId;
      const nextPhase = destination.droppableId as SalePhase;
      let deliveryDate: string | undefined;
      let guaranteeId: string | undefined;
      let guaranteeEndsAt: string | undefined;

      if (nextPhase === 'entrega') {
        deliveryDate = new Date().toISOString();
      } else if (nextPhase === 'em_garantia') {
        if (guaranteeConfigs.length > 1) {
          // Mais de uma garantia configurada: pergunta qual aplicar em vez de
          // escolher a primeira silenciosamente.
          setPendingGuaranteeLeadId(leadId);
          return;
        }
        if (guaranteeConfigs.length === 1) {
          const defaultGuarantee = guaranteeConfigs[0];
          guaranteeId = defaultGuarantee.id;
          const lead = leads.find((l) => l.id === leadId);
          if (lead?.saleDate) {
            guaranteeEndsAt = salesFlowService.calculateGuaranteeEndDate(
              lead.saleDate,
              defaultGuarantee.days_warranty
            );
          }
        }
      }

      await salesFlowService.moveToNextPhase(leadId, nextPhase, deliveryDate, guaranteeId, guaranteeEndsAt);
      onUpdate?.();
    } catch (err) {
      setError('Erro ao mover venda');
      console.error(err);
      setTimeout(() => setError(null), 3000);
    }
  };

  const confirmGuaranteeSelection = async (config: GuaranteeConfig) => {
    const leadId = pendingGuaranteeLeadId;
    if (!leadId) return;
    setPendingGuaranteeLeadId(null);
    try {
      const lead = leads.find((l) => l.id === leadId);
      const guaranteeEndsAt = lead?.saleDate
        ? salesFlowService.calculateGuaranteeEndDate(lead.saleDate, config.days_warranty)
        : undefined;
      await salesFlowService.moveToNextPhase(leadId, 'em_garantia', undefined, config.id, guaranteeEndsAt);
      onUpdate?.();
    } catch (err) {
      setError('Erro ao mover venda');
      console.error(err);
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Carregando kanban...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-6">
          {PHASES.map((phase) => {
            const phaseLeads = salesByPhase[phase.id];
            const totalLeads = phaseLeads.length;

            return (
              <div key={phase.id} className={`rounded-2xl border-2 border-dashed p-5 min-h-[600px] ${phase.bgColor}`}>
                <div className="mb-5 pb-4 border-b-2 border-slate-200">
                  <h3 className={`text-lg font-black ${phase.color.replace('bg-', 'text-')}`}>
                    {phase.name}
                  </h3>
                  <p className="text-xs font-bold text-slate-500 mt-1">
                    {totalLeads} {totalLeads === 1 ? 'venda' : 'vendas'}
                  </p>
                </div>

                <Droppable droppableId={phase.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 transition-all ${snapshot.isDraggingOver ? 'bg-white/50 rounded-lg p-2' : ''}`}
                    >
                      {phaseLeads.length === 0 ? (
                        <div className="flex items-center justify-center h-32 border-2 border-dashed border-slate-300 rounded-lg">
                          <p className="text-xs text-slate-400 font-medium text-center">Nenhuma venda aqui</p>
                        </div>
                      ) : (
                        phaseLeads.map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => {
                              const card = (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => !snapshot.isDragging && navigate(`/leads/${lead.id}`)}
                                  className={`group p-4 rounded-2xl border-2 cursor-grab active:cursor-grabbing select-none ${
                                    snapshot.isDragging
                                      ? 'bg-card shadow-2xl border-primary ring-2 ring-primary/30 z-[9999]'
                                      : 'bg-card border-border/80 hover:border-primary/50 hover:shadow-md transition-colors'
                                  }`}
                                  style={provided.draggableProps.style}
                                >
                                  <SalesCard lead={lead} guaranteeConfigs={guaranteeConfigs} phase={phase.id} />
                                </div>
                              );
                              return snapshot.isDragging ? createPortal(card, document.body) : card;
                            }}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {pendingGuaranteeLeadId && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4" onClick={() => setPendingGuaranteeLeadId(null)}>
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600">
                  <Shield size={20} />
                </div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Qual garantia aplicar?</h3>
              </div>
              <button onClick={() => setPendingGuaranteeLeadId(null)} className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {guaranteeConfigs.map((config) => (
                <button
                  key={config.id}
                  onClick={() => confirmGuaranteeSelection(config)}
                  className="w-full p-4 rounded-2xl border-2 border-slate-100 hover:border-brand-400 hover:bg-brand-50 text-left transition-all"
                >
                  <p className="font-black text-sm text-slate-800">{config.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{config.days_warranty} dias de cobertura</p>
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

interface SalesCardProps {
  lead: Lead;
  guaranteeConfigs: GuaranteeConfig[];
  phase: SalePhase;
}

const SalesCard: React.FC<SalesCardProps> = ({ lead, guaranteeConfigs, phase }) => {
  const warranty = guaranteeConfigs.find((g) => g.id === lead.guaranteeId);
  const parsedEndsAt = lead.guaranteeEndsAt ? parseISO(lead.guaranteeEndsAt) : null;
  const daysLeft = parsedEndsAt && isValid(parsedEndsAt) ? differenceInDays(parsedEndsAt, new Date()) : null;
  const isWarrantyExpiring = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
  const isWarrantyExpired = daysLeft !== null && daysLeft <= 0;

  const safeFormatDate = (dateString?: string | null, formatStr: string = 'dd MMM') => {
    if (!dateString) return '';
    const date = parseISO(dateString);
    if (!isValid(date)) return 'Data inválida';
    return format(date, formatStr, { locale: ptBR });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-heading font-extrabold text-sm text-foreground truncate group-hover:text-primary transition-colors">
            {lead.name}
          </h4>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">
            {lead.phone ? lead.phone.replace(/\D/g, '').slice(-11) : 'Sem contato'}
          </p>
        </div>
        <div className="p-1.5 rounded-lg bg-muted border border-border/60 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all shrink-0" title="Abrir cadastro do lead">
          <ExternalLink size={13} />
        </div>
      </div>

      {lead.saleDate && (
        <div className="flex items-center gap-2 text-xs">
          <Calendar size={12} className="text-slate-400" />
          <span className="text-slate-600">{safeFormatDate(lead.saleDate)}</span>
        </div>
      )}

      {lead.deliveryDate && phase !== 'documentacao' && (
        <div className="flex items-center gap-2 text-xs">
          <Clock size={12} className="text-orange-500" />
          <span className="text-slate-600">
            Entregue: {safeFormatDate(lead.deliveryDate)}
          </span>
        </div>
      )}

      {warranty && phase === 'em_garantia' && (
        <div className={`p-2 rounded-lg border ${
          isWarrantyExpired ? 'bg-red-50 border-red-200' : isWarrantyExpiring ? 'bg-amber-50 border-amber-200' : 'bg-brand-50 border-brand-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-700 truncate">{warranty.name}</p>
              {daysLeft !== null && (
                <p className={`text-[10px] font-bold mt-1 ${isWarrantyExpired ? 'text-red-600' : isWarrantyExpiring ? 'text-amber-600' : 'text-brand-600'}`}>
                  {isWarrantyExpired ? '❌ Vencida' : daysLeft === 0 ? '⚠️ Vence hoje' : `${daysLeft}d restante${daysLeft !== 1 ? 's' : ''}`}
                </p>
              )}
            </div>
            {(isWarrantyExpiring || isWarrantyExpired) && <AlertCircle size={14} className={isWarrantyExpired ? 'text-red-600' : 'text-amber-600'} />}
          </div>
        </div>
      )}

      {lead.postSaleNotes && (
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-[10px] text-slate-600 line-clamp-2">{lead.postSaleNotes}</p>
        </div>
      )}

      <div className="pt-2 border-t border-slate-100">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {phase === 'documentacao' && '→ Pronto para Entrega'}
          {phase === 'entrega' && '→ Selecionar Garantia'}
          {phase === 'em_garantia' && '→ Pós-Venda'}
          {phase === 'apos_garantia' && '✓ Finalizado'}
        </p>
      </div>
    </div>
  );
};

export default SalesKanban;
