import React, { useState } from 'react';
import { X, User, Phone, Mail, Check, Loader2 } from 'lucide-react';
import { leadService } from '../services/leadService';
import { useToast } from '../contexts/ToastContext';
import { LeadPhase, LeadTemperature } from '../types';
import { useData } from '../contexts/DataContext';
import Modal from './ui/Modal';

interface QuickLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (leadId: string) => void;
}

const QuickLeadModal: React.FC<QuickLeadModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { showToast } = useToast();
    const { loadData } = useData();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.phone) {
            showToast('error', 'Nome e telefone são obrigatórios.');
            return;
        }

        setIsSubmitting(true);
        try {
            const newLead = await leadService.create({
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                phase: LeadPhase.NEW,
                temperature: LeadTemperature.WARM,
                source: 'Cadastro Rápido',
                notes: 'Lead criado via formulário rápido.',
                preferences: {
                    interesse_carro: true,
                    interesse_moto: false,
                    interesse_caminhao: false,
                    tipos_veiculo: [],
                    tipos_moto: [],
                    tipos_caminhao: [],
                    marcas: [],
                    modelos: [],
                    marcas_moto: [],
                    modelos_moto: [],
                    marcas_caminhao: [],
                    modelos_caminhao: [],
                    carro_valor_min: 0,
                    carro_valor_max: 0,
                    carro_transmissao: [],
                    carro_motorizacao: [],
                    moto_valor_min: 0,
                    moto_valor_max: 0,
                    moto_transmissao: [],
                    moto_motorizacao: [],
                    caminhao_valor_min: 0,
                    caminhao_valor_max: 0,
                    caminhao_transmissao: [],
                    caminhao_motorizacao: [],
                    transmissao: [],
                    motorizacao: [],
                    observacoes_adicionais: '',
                    possui_entrada: false,
                    possui_troca: false,
                    veiculo_troca: '',
                    troca_data: {
                        placa: '',
                        categoria: 'carro',
                        marca: '',
                        modelo: '',
                        ano: undefined,
                        cor: '',
                        quilometragem: undefined,
                        valor_fipe: undefined,
                        situacao_financeira: 'Quitado',
                        valor_quitacao: undefined,
                        observacoes: ''
                    }
                } as any
            } as any);

            showToast('success', 'Lead cadastrado com sucesso!');
            await loadData();
            setFormData({ name: '', phone: '', email: '' });
            onSuccess(newLead.id);
            onClose();
        } catch (error: any) {
            console.error('Error creating quick lead:', error);
            showToast('error', 'Erro ao cadastrar lead.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/20">
                        <User size={20} />
                    </div>
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Cadastro Rápido</h2>
                </div>
            }
            maxWidth="max-w-md"
            footer={
                <div className="flex gap-4 w-full">
                    <button
                        type="button"
                        form="quick-lead-form"
                        onClick={onClose}
                        className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all text-center"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="quick-lead-form"
                        disabled={isSubmitting}
                        className="flex-[2] py-4 bg-brand-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-500/20 hover:bg-brand-600 transition-all flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                        Criar Lead
                    </button>
                </div>
            }
        >
            <form id="quick-lead-form" onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1">Nome Completo *</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-brand-500 transition-all placeholder:text-slate-300"
                                placeholder="Ex: João Silva"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1">WhatsApp / Telefone *</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input
                                required
                                type="text"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-brand-500 transition-all placeholder:text-slate-300"
                                placeholder="Ex: (11) 99999-9999"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1">E-mail (Opcional)</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-brand-500 transition-all placeholder:text-slate-300"
                                placeholder="Ex: joao@email.com"
                            />
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default QuickLeadModal;
