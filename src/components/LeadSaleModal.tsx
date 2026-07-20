import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Car, Calendar, DollarSign, Search, Loader2 } from 'lucide-react';
import { Lead, Vehicle, LeadPhase } from '../types';
import { leadService } from '../services/leadService';
import { salesFlowService } from '../services/salesFlowService';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabaseClient';
import { CustomDatePicker } from './ui/CustomDatePicker';
import { formatCurrency, parseCurrency } from '../utils/formatters';


interface LeadSaleModalProps {
    isOpen: boolean;
    onClose: () => void;
    leadId: string | null;
    leads: Lead[];
    vehicles: Vehicle[];
    onSuccess: () => void;
    onAddLead: (lead: any) => Promise<Lead | null>;
}

const LeadSaleModal: React.FC<LeadSaleModalProps> = ({ isOpen, onClose, leadId, leads, vehicles, onSuccess, onAddLead }) => {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
    const [salePrice, setSalePrice] = useState<number>(0);
    const [refurbishmentCosts, setRefurbishmentCosts] = useState<number>(0);
    const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Walk-in mode (cliente sem lead)
    const [isWalkIn, setIsWalkIn] = useState(false);
    const [walkInName, setWalkInName] = useState('');
    const [walkInPhone, setWalkInPhone] = useState('');

    const lead = leads.find(l => l.id === leadId);

    const filteredVehicles = vehicles.filter(v =>
        v.status === 'available' &&
        (v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.plate?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleConfirm = async () => {
        if (!selectedVehicleId || salePrice <= 0) {
            showToast('error', 'Preencha todos os campos corretamente.');
            return;
        }

        if (isWalkIn && (!walkInName || !walkInPhone)) {
            showToast('error', 'Nome e telefone são obrigatórios para cliente walk-in.');
            return;
        }

        if (!isWalkIn && !leadId) {
            showToast('error', 'Selecione um cliente.');
            return;
        }

        setIsSubmitting(true);
        try {
            const vehicle = vehicles.find(v => v.id === selectedVehicleId);
            if (!vehicle) throw new Error("Veículo não encontrado");

            let buyerLeadId = leadId;
            let buyerName = lead?.name || 'Cliente Orvalho';

            // 1. Se é walk-in, criar lead on-the-fly (via onAddLead para respeitar o
            // limite de leads do plano Free — leadService.create() direto o ignorava)
            if (isWalkIn) {
                const newLead = await onAddLead({
                    name: walkInName,
                    phone: walkInPhone,
                    email: '',
                    phase: LeadPhase.COMPLETED,
                    temperature: 'Morna',
                    source: 'Walk-in',
                    notes: 'Lead criado via venda walk-in',
                    preferences: {
                        tipos_veiculo: [], marcas: [], modelos: [],
                        transmissao: [], motorizacao: [],
                        carro_transmissao: [], carro_motorizacao: [],
                        moto_transmissao: [], moto_motorizacao: [],
                        observacoes_adicionais: '',
                        possui_entrada: false,
                        possui_troca: false
                    },
                    is_buyer: true
                } as any);
                if (!newLead) throw new Error('Falha ao criar lead do cliente walk-in.');
                buyerLeadId = newLead.id;
                buyerName = walkInName;
            }

            // 2. Update Vehicle to 'sold' and add sale details
            const saleDetails = {
                salePrice,
                saleDate,
                buyerLeadId,
                buyerName,
                isFollowUpSale: true,
                refurbishmentCosts
            };

            const { error: vError } = await supabase
                .from('vehicles')
                .update({
                    status: 'sold',
                    sale_details: saleDetails as any
                })
                .eq('id', selectedVehicleId);

            if (vError) throw vError;

            // 3. Update Lead: mark as buyer e mover para COMPLETED (Compradores).
            // Antes ia para WAITING_PAYMENT, fase que nunca aparece em nenhum
            // kanban real do app (o kanban WAITING_PAYMENT->DOCUMENTATION->
            // DELIVERY nunca foi conectado a uma rota) — como o Fluxo de Vendas
            // (SalesFlowPage) exige phase === COMPLETED, o lead nunca aparecia
            // lá para vendas de leads já existentes (só funcionava por acaso
            // para leads walk-in, criados já com phase COMPLETED).
            if (!isWalkIn && lead) {
                await leadService.update({
                    ...lead,
                    phase: LeadPhase.COMPLETED,
                    is_buyer: true
                });
            }

            // 4. Sync to Sales Flow: initiate post-sale process
            // Both walk-in and regular leads go through sales flow after purchase
            try {
                if (buyerLeadId) {
                    await salesFlowService.initiateSaleFlow(buyerLeadId, saleDate);
                }
            } catch (syncError) {
                console.warn('Aviso: não foi possível sincronizar com o fluxo de vendas', syncError);
                // Don't fail the entire sale if sync fails — it's non-critical
            }

            showToast('success', 'Venda registrada com sucesso!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Erro ao registrar venda:", error);
            showToast('error', error.message || 'Erro ao registrar venda.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[10000] flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-fadeUp">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/20">
                            <DollarSign size={24} />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Registrar Venda</h2>
                            <p className="text-xs font-bold text-slate-400">
                                {isWalkIn ? 'Cliente: Walk-in' : `Cliente: ${lead?.name || 'Não selecionado'}`}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Walk-in Toggle */}
                    <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                        <input
                            type="checkbox"
                            id="walkInToggle"
                            checked={isWalkIn}
                            onChange={(e) => {
                                setIsWalkIn(e.target.checked);
                                if (e.target.checked) {
                                    setWalkInName('');
                                    setWalkInPhone('');
                                }
                            }}
                            className="w-5 h-5 rounded border-slate-300 text-amber-600 cursor-pointer"
                        />
                        <label htmlFor="walkInToggle" className="flex-1 text-sm font-bold text-amber-800 cursor-pointer">
                            Cliente Walk-in (sem cadastro prévio)
                        </label>
                    </div>

                    {/* Walk-in Form */}
                    {isWalkIn && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                            <div className="col-span-2 space-y-2">
                                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block px-2">Nome do Cliente *</label>
                                <input
                                    type="text"
                                    placeholder="Nome completo"
                                    className="w-full px-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-brand-500 transition-all"
                                    value={walkInName}
                                    onChange={e => setWalkInName(e.target.value)}
                                />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block px-2">Telefone *</label>
                                <input
                                    type="tel"
                                    placeholder="(11) 99999-9999"
                                    className="w-full px-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-brand-500 transition-all"
                                    value={walkInPhone}
                                    onChange={e => setWalkInPhone(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Vehicle Selection */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block px-2">1. Selecione o Veículo Vendido</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar no estoque por marca, modelo ou placa..."
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-brand-500 transition-all"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-3 mt-4">
                            {filteredVehicles.slice(0, 5).map(v => (
                                <div
                                    key={v.id}
                                    onClick={() => {
                                        setSelectedVehicleId(v.id);
                                        if (salePrice === 0) setSalePrice(v.price);
                                    }}
                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group
                                        ${selectedVehicleId === v.id ? 'border-brand-500 bg-brand-50' : 'border-slate-100 bg-white hover:border-brand-200'}
                                    `}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${selectedVehicleId === v.id ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-brand-100 group-hover:text-brand-500'}`}>
                                            <Car size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-slate-900 uppercase tracking-tight">{v.brand} {v.model}</h4>
                                            <p className="text-xs font-bold text-slate-400">{v.year} • {v.plate || 'S/ Placa'} • R$ {v.price.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    {selectedVehicleId === v.id && (
                                        <div className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center">
                                            <Check size={14} />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {filteredVehicles.length === 0 && (
                                <div className="p-10 border-2 border-dashed border-slate-100 rounded-3xl text-center">
                                    <p className="text-sm font-bold text-slate-400">Nenhum veículo disponível encontrado</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Price */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block px-2">2. Valor da Venda (R$)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-black text-slate-900 outline-none focus:border-brand-500 transition-all"
                                    value={formatCurrency(salePrice)}
                                    onChange={e => setSalePrice(parseCurrency(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block px-2">3. Custos de Preparação</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-black text-slate-900 outline-none focus:border-brand-500 transition-all"
                                    value={formatCurrency(refurbishmentCosts)}
                                    onChange={e => setRefurbishmentCosts(parseCurrency(e.target.value))}
                                />
                            </div>
                        </div>

                        {/* Date */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block px-2">4. Data da Venda</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <div className="ml-12">
                                    <CustomDatePicker
                                        value={saleDate}
                                        onChange={(date) => setSaleDate(date)}
                                        className="w-full pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-black text-slate-900 outline-none focus:border-brand-500 transition-all cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 bg-slate-50/50 flex gap-4">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 py-5 bg-white border border-slate-200 text-slate-400 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isSubmitting || !selectedVehicleId || salePrice <= 0}
                        className="flex-[2] py-5 bg-brand-500 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-500/30 hover:bg-brand-600 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-3"
                    >
                        {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                        Finalizar Venda
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default LeadSaleModal;
