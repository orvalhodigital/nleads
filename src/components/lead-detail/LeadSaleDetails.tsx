import React, { useState } from 'react';
import { ShoppingBag, Calendar, Clock, Shield, Check, Save, ExternalLink, Car } from 'lucide-react';
import { Lead, SalePhase, Vehicle } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { format, parseISO, isValid, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';

interface LeadSaleDetailsProps {
    lead: Lead;
    onUpdateLead: (updatedLead: Lead) => Promise<void>;
    purchasedVehicles?: Vehicle[];
}

export const LeadSaleDetails: React.FC<LeadSaleDetailsProps> = ({
    lead,
    onUpdateLead,
    purchasedVehicles = []
}) => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Form state
    const [saleDate, setSaleDate] = useState<string>(
        lead.saleDate ? lead.saleDate.split('T')[0] : (lead.saleDetails?.saleDate ? lead.saleDetails.saleDate.split('T')[0] : '')
    );
    const [deliveryDate, setDeliveryDate] = useState<string>(
        lead.deliveryDate ? lead.deliveryDate.split('T')[0] : ''
    );
    const [saleStatus, setSaleStatus] = useState<SalePhase>(
        (lead.saleStatus as SalePhase) || 'documentacao'
    );
    const [postSaleNotes, setPostSaleNotes] = useState<string>(
        lead.postSaleNotes || ''
    );

    const [isSaving, setIsSaving] = useState(false);

    // Compute warranty info
    const parsedEndsAt = lead.guaranteeEndsAt ? parseISO(lead.guaranteeEndsAt) : null;
    const daysLeft = parsedEndsAt && isValid(parsedEndsAt) ? differenceInDays(parsedEndsAt, new Date()) : null;
    const isWarrantyExpired = daysLeft !== null && daysLeft <= 0;
    const isWarrantyExpiring = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;

    const handleSaveSalesData = async () => {
        setIsSaving(true);
        try {
            const saleDateIso = saleDate ? new Date(`${saleDate}T12:00:00`).toISOString() : lead.saleDate;
            const deliveryDateIso = deliveryDate ? new Date(`${deliveryDate}T12:00:00`).toISOString() : lead.deliveryDate;

            await onUpdateLead({
                ...lead,
                saleDate: saleDateIso,
                deliveryDate: deliveryDateIso,
                saleStatus: saleStatus,
                postSaleNotes: postSaleNotes,
                saleDetails: {
                    salePrice: lead.saleDetails?.salePrice || 0,
                    buyerName: lead.name,
                    ...(lead.saleDetails || {}),
                    saleDate: saleDateIso || lead.saleDate || new Date().toISOString()
                }
            });
            showToast('success', 'Dados da venda atualizados com sucesso!');
        } catch (error) {
            showToast('error', 'Erro ao salvar dados da venda.');
        } finally {
            setIsSaving(false);
        }
    };

    const isBuyerOrHasSalesData = lead.is_buyer || lead.phase === 'Compradores' || lead.saleStatus || lead.saleDate || purchasedVehicles.length > 0;

    if (!isBuyerOrHasSalesData) {
        return null;
    }

    return (
        <div className="p-6 md:p-8 bg-card rounded-3xl border border-border/80 shadow-sm space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                        <ShoppingBag size={20} />
                    </div>
                    <div>
                        <h3 className="font-heading font-extrabold text-lg text-foreground tracking-tight">
                            Dados da Venda e Pós-Venda
                        </h3>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Registro de entrega, garantias e historico comercial
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleSaveSalesData}
                    disabled={isSaving}
                    className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                    {isSaving ? <span className="animate-spin">⏳</span> : <Save size={15} />}
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            {/* Form grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Data da Venda */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-1.5">
                        <Calendar size={14} className="text-primary" /> Data da Venda
                    </label>
                    <input
                        type="date"
                        value={saleDate}
                        onChange={e => setSaleDate(e.target.value)}
                        className="w-full p-3.5 bg-muted/60 border border-border/80 rounded-2xl font-bold text-sm text-foreground focus:bg-card focus:border-primary outline-none transition-all"
                    />
                </div>

                {/* Data da Entrega */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-1.5">
                        <Clock size={14} className="text-amber-500" /> Data da Entrega
                    </label>
                    <input
                        type="date"
                        value={deliveryDate}
                        onChange={e => setDeliveryDate(e.target.value)}
                        className="w-full p-3.5 bg-muted/60 border border-border/80 rounded-2xl font-bold text-sm text-foreground focus:bg-card focus:border-primary outline-none transition-all"
                    />
                </div>

                {/* Etapa do Pós-Venda */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-1.5">
                        <Shield size={14} className="text-emerald-500" /> Etapa do Pós-Venda
                    </label>
                    <select
                        value={saleStatus}
                        onChange={e => setSaleStatus(e.target.value as SalePhase)}
                        className="w-full p-3.5 bg-muted/60 border border-border/80 rounded-2xl font-bold text-sm text-foreground focus:bg-card focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                    >
                        <option value="documentacao">📋 Documentação</option>
                        <option value="entrega">🚚 Entrega</option>
                        <option value="em_garantia">⏱️ Em Garantia</option>
                        <option value="apos_garantia">📞 Pós-Venda (Concluído)</option>
                    </select>
                </div>
            </div>

            {/* Informações da Garantia */}
            {lead.guaranteeEndsAt && (
                <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                    isWarrantyExpired ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' :
                    isWarrantyExpiring ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                    'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                }`}>
                    <div className="flex items-center gap-3">
                        <Shield size={20} />
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider">Status da Garantia</p>
                            <p className="text-sm font-semibold">
                                Vencimento em: {format(parseISO(lead.guaranteeEndsAt), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                        </div>
                    </div>
                    <span className="px-3 py-1 rounded-lg bg-card text-xs font-extrabold uppercase border border-border/60">
                        {isWarrantyExpired ? 'Vencida ✕' : daysLeft === 0 ? 'Vence Hoje ⚠️' : `${daysLeft} dias restantes`}
                    </span>
                </div>
            )}

            {/* Veículos Adquiridos */}
            {purchasedVehicles.length > 0 && (
                <div className="space-y-3 pt-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-2">
                        <Car size={15} className="text-primary" /> Veículo Adquirido neste Negócio
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                        {purchasedVehicles.map(v => (
                            <div key={v.id} className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                                        <Car size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-foreground">{v.brand} {v.model}</h4>
                                        <p className="text-xs text-muted-foreground font-medium">
                                            {v.year} • Placa {v.plate || 'N/A'} {v.price ? `• R$ ${formatCurrency(v.price)}` : ''}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigate((v as any).isMoto || v.vehicleCategory === 'moto' ? `/motorcycles?motoId=${v.id}` : `/inventory?vehicleId=${v.id}`)}
                                    className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
                                    title="Ver Veículo no Estoque"
                                >
                                    <ExternalLink size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Anotações do Pós-Venda */}
            <div className="space-y-2 pt-2 border-t border-border/80">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                    Anotações e Histórico de Pós-Venda
                </label>
                <textarea
                    value={postSaleNotes}
                    onChange={e => setPostSaleNotes(e.target.value)}
                    rows={3}
                    className="w-full p-4 bg-muted/60 border border-border/80 rounded-2xl font-medium text-sm text-foreground focus:bg-card focus:border-primary outline-none transition-all resize-none"
                    placeholder="Registre observações da entrega, garantia acionada, transferência de documentos ou contato de pós-venda..."
                />
            </div>
        </div>
    );
};
