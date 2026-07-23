import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, UserCheck, AlertCircle } from 'lucide-react';
import { Lead, LeadPhase, LeadTemperature, SaleDetails } from '../../types';
import { CustomDatePicker } from '../ui/CustomDatePicker';
import { formatCurrency, parseCurrency } from '../../utils/formatters';
import { leadService } from '../../services/leadService';
import { salesFlowService } from '../../services/salesFlowService';
import { withPreferenceDefaults } from '../../lib/leadPreferenceDefaults';

interface SellVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: { id: string; brand: string; model: string } | null;
  leads: Lead[];
  onAddLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'lastUpdate' | 'funnelHistory'>) => Promise<Lead | null>;
  onConfirmSell: (itemId: string, details: SaleDetails) => Promise<void> | void;
}

export const SellVehicleModal: React.FC<SellVehicleModalProps> = ({
  isOpen,
  onClose,
  item,
  leads,
  onAddLead,
  onConfirmSell,
}) => {
  const [buyerSelectionId, setBuyerSelectionId] = useState('');
  const [walkInLeadName, setWalkInLeadName] = useState('');
  const [walkInLeadPhone, setWalkInLeadPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [sellData, setSellData] = useState<SaleDetails>({
    salePrice: 0,
    saleDate: new Date().toISOString().split('T')[0],
    buyerName: '',
    buyerLeadId: '',
    isFollowUpSale: true,
    refurbishmentCosts: 0,
  });

  // Reset form when modal opens with a new item
  useEffect(() => {
    if (isOpen) {
      setBuyerSelectionId('');
      setWalkInLeadName('');
      setWalkInLeadPhone('');
      setIsSubmitting(false);
      setSellData({
        salePrice: 0,
        saleDate: new Date().toISOString().split('T')[0],
        buyerName: '',
        buyerLeadId: '',
        isFollowUpSale: true,
        refurbishmentCosts: 0,
      });
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerSelectionId) {
      alert('Selecione um comprador antes de confirmar a venda.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalBuyerLeadId: string | undefined;
      let finalBuyerName: string;

      if (buyerSelectionId === 'Venda Avulsa') {
        if (!walkInLeadName.trim() || !walkInLeadPhone.trim()) {
          alert('Por favor, preencha o nome e telefone do cliente para a venda avulsa.');
          setIsSubmitting(false);
          return;
        }

        const newLead = await onAddLead({
          name: walkInLeadName.trim(),
          phone: walkInLeadPhone.trim(),
          email: '',
          phase: LeadPhase.COMPLETED,
          temperature: LeadTemperature.HOT,
          preferences: withPreferenceDefaults({
            transmissao: ['Qualquer Um(a)'],
            motorizacao: ['Qualquer Um(a)'],
            observacoes_adicionais: 'Criado automaticamente via Venda Avulsa',
            veiculo_troca: '',
          }),
          presentedVehicles: [item.id],
          source: 'Venda Avulsa',
          notes: 'Lead criado automaticamente ao registrar venda avulsa.',
          is_buyer: true,
        } as any);

        if (newLead) {
          finalBuyerLeadId = newLead.id;
          finalBuyerName = newLead.name;
        } else {
          setIsSubmitting(false);
          return;
        }
      } else {
        const selectedLead = leads.find((l) => l.id === buyerSelectionId);
        if (!selectedLead) {
          alert('Selecione um comprador válido.');
          setIsSubmitting(false);
          return;
        }
        finalBuyerLeadId = selectedLead.id;
        finalBuyerName = selectedLead.name;

        try {
          await leadService.update({
            ...selectedLead,
            phase: LeadPhase.COMPLETED,
            is_buyer: true,
          });
        } catch (err) {
          console.error('Erro ao atualizar lead selecionado:', err);
        }
      }

      const finalDetails: SaleDetails = {
        ...sellData,
        buyerName: finalBuyerName,
        buyerLeadId: finalBuyerLeadId,
      };

      await onConfirmSell(item.id, finalDetails);

      if (finalBuyerLeadId) {
        try {
          await salesFlowService.initiateSaleFlow(finalBuyerLeadId, sellData.saleDate);
        } catch (syncError) {
          console.warn('Aviso: não foi possível sincronizar com o fluxo de vendas', syncError);
        }
      }

      onClose();
    } catch (err) {
      console.error('Erro ao processar venda:', err);
      alert('Erro ao registrar a venda. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card text-card-foreground border border-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-fadeUp my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
            <div>
              <h2 className="text-lg font-heading font-bold uppercase tracking-tight text-foreground">
                Registrar Venda
              </h2>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                {item.brand} {item.model}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Sale Price */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <DollarSign size={13} className="text-primary" />
                Preço Final de Venda
              </label>
              <input
                type="text"
                required
                value={formatCurrency(sellData.salePrice)}
                onChange={(e) =>
                  setSellData({ ...sellData, salePrice: parseCurrency(e.target.value) })
                }
                className="w-full p-4 bg-primary/10 border border-primary/30 text-primary rounded-2xl font-heading font-black text-lg outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="R$ 0,00"
              />
            </div>

            {/* Sale Date */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Calendar size={13} />
                Data da Venda
              </label>
              <CustomDatePicker
                value={sellData.saleDate}
                onChange={(date) => setSellData({ ...sellData, saleDate: date })}
                className="w-full py-3.5 px-4 bg-background border border-input rounded-2xl font-medium outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>

            {/* Buyer Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <UserCheck size={13} />
                Comprador (Selecione o Lead)
              </label>
              <select
                value={buyerSelectionId}
                onChange={(e) => setBuyerSelectionId(e.target.value)}
                className="w-full p-4 bg-background border border-input text-foreground rounded-2xl font-medium outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="">Selecione um comprador...</option>
                <option value="Venda Avulsa">-- Venda Avulsa (Sem Lead Cadastrado) --</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name} {lead.phone ? `(${lead.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Walk-in Buyer Fields */}
            {buyerSelectionId === 'Venda Avulsa' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border animate-fadeUp bg-muted/40 p-4 rounded-2xl">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={walkInLeadName}
                    onChange={(e) => setWalkInLeadName(e.target.value)}
                    className="w-full p-3.5 bg-background border border-input rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm font-medium text-foreground"
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Telefone *
                  </label>
                  <input
                    type="text"
                    required
                    value={walkInLeadPhone}
                    onChange={(e) => setWalkInLeadPhone(e.target.value)}
                    className="w-full p-3.5 bg-background border border-input rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm font-medium text-foreground"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-muted/30 border-t border-border flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3.5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3.5 bg-primary text-primary-foreground rounded-2xl text-[11px] font-extrabold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Confirmando...' : 'Confirmar Venda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellVehicleModal;
