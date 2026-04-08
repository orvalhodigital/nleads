import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Car, Calendar, DollarSign, Search, Loader2, Smartphone } from 'lucide-react';
import { Lead, Vehicle, LeadPhase, Phone } from '../types';
import { vehicleService } from '../services/vehicleService';
import { leadService } from '../services/leadService';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabaseClient';
import { CustomDatePicker } from './ui/CustomDatePicker';
import { formatCurrency, parseCurrency } from '../utils/formatters';


interface LeadSaleModalProps {
    isOpen: boolean;
    onClose: () => void;
    leadId: string | null;
    leads: Lead[];
    items: (Vehicle | Phone)[];
    onSuccess: () => void;
    businessType?: 'vehicles' | 'phones';
}

const LeadSaleModal: React.FC<LeadSaleModalProps> = ({ isOpen, onClose, leadId, leads, items, onSuccess, businessType = 'vehicles' }) => {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItemId, setSelectedItemId] = useState<string>('');
    const [salePrice, setSalePrice] = useState<number>(0);
    const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const lead = leads.find(l => l.id === leadId);

    const getItemLabel = (item: any) => {
        if (businessType === 'phones') {
            return `${item.brand} ${item.model} (${item.capacity})`;
        }
        return `${item.brand} ${item.model} ${item.year}`;
    };

    const filteredItems = items.filter(v =>
        v.status === 'available' &&
        (v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (businessType === 'vehicles' ? (v as Vehicle).plate?.toLowerCase().includes(searchTerm.toLowerCase()) : (v as Phone).imei?.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    const handleConfirm = async () => {
        if (!leadId || !selectedItemId || salePrice <= 0) {
            showToast('error', 'Preencha todos os campos corretamente.');
            return;
        }

        setIsSubmitting(true);
        try {
            const item = items.find(v => v.id === selectedItemId);
            if (!item) throw new Error("Item não encontrado");

            // 1. Update Product to 'sold' and add sale details
            const saleDetails = {
                salePrice,
                saleDate,
                buyerLeadId: leadId,
                buyerName: lead?.name || 'Cliente nLeads',
                isFollowUpSale: true
            };

            const targetTable = businessType === 'phones' ? 'phones' : 'vehicles';
            const { error: vError } = await supabase
                .from(targetTable)
                .update({
                    status: 'sold',
                    sale_details: saleDetails
                })
                .eq('id', selectedItemId);

            if (vError) throw vError;

            // 2. Update Lead: mark as buyer (appears in "Compradores" on Leads page)
            // and move to WAITING_PAYMENT (appears in Sales Closed kanban)
            if (lead) {
                await leadService.update({
                    ...lead,
                    phase: LeadPhase.WAITING_PAYMENT,
                    is_buyer: true
                });
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

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-fadeUp">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Registrar Venda</h2>
                            <p className="text-xs font-bold text-slate-400">Cliente: <span className="text-slate-900">{lead?.name}</span></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Item Selection */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block px-2">
                            1. Selecione o {businessType === 'phones' ? 'Aparelho' : 'Veículo'} Vendido
                        </label>
                        <div className="relative">
                            <Search className="absolute left-4 top-0 bottom-0 my-auto text-slate-300" size={18} />
                            <input
                                type="text"
                                placeholder={businessType === 'phones' ? "Buscar no estoque por marca, modelo ou IMEI..." : "Buscar no estoque por marca, modelo ou placa..."}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-3 mt-4">
                            {filteredItems.slice(0, 5).map(v => (
                                <div
                                    key={v.id}
                                    onClick={() => {
                                        setSelectedItemId(v.id);
                                        if (salePrice === 0) setSalePrice(v.price);
                                    }}
                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group
                                        ${selectedItemId === v.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-white hover:border-emerald-200'}
                                    `}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${selectedItemId === v.id ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-500'}`}>
                                            {businessType === 'phones' ? <Smartphone size={24} /> : <Car size={24} />}
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-slate-900 uppercase tracking-tight">{v.brand} {v.model}</h4>
                                            <p className="text-xs font-bold text-slate-400">
                                                {businessType === 'phones' ? (v as Phone).capacity : (v as Vehicle).year} • {businessType === 'phones' ? (v as Phone).imei : (v as Vehicle).plate || 'S/ Placa'} • R$ {v.price.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    {selectedItemId === v.id && (
                                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                            <Check size={14} />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {filteredItems.length === 0 && (
                                <div className="p-10 border-2 border-dashed border-slate-100 rounded-3xl text-center">
                                    <p className="text-sm font-bold text-slate-400">Nenhum {businessType === 'phones' ? 'aparelho' : 'veículo'} disponível encontrado</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Price */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block px-2">2. Valor da Venda (R$)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-0 bottom-0 my-auto text-slate-400" size={18} />
                                <input
                                    type="text"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-black text-slate-900 outline-none focus:border-emerald-500 transition-all"
                                    value={formatCurrency(salePrice)}
                                    onChange={e => setSalePrice(parseCurrency(e.target.value))}
                                />
                            </div>
                        </div>

                        {/* Date */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block px-2">3. Data da Venda</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-0 bottom-0 my-auto text-slate-300" size={18} />
                                <div className="ml-12">
                                    <CustomDatePicker
                                        value={saleDate}
                                        onChange={(date) => setSaleDate(date)}
                                        className="w-full pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-black text-slate-900 outline-none focus:border-emerald-500 transition-all cursor-pointer"
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
                        disabled={isSubmitting || !selectedItemId || salePrice <= 0}
                        className="flex-[2] py-5 bg-emerald-500 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/30 hover:bg-emerald-600 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-3"
                    >
                        {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                        Finalizar Venda
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LeadSaleModal;
