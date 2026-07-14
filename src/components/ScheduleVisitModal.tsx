
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, UserPlus, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Lead, LeadPhase, LeadTemperature, Vehicle } from '../types';
import { CustomDatePicker } from './ui/CustomDatePicker';
import { CustomTimePicker } from './ui/CustomTimePicker';
import { formatCurrency } from '../utils/formatters';

interface ScheduleVisitModalProps {
    isOpen: boolean;
    onClose: () => void;
    leads: Lead[];
    vehicles: Vehicle[];
    onSchedule: (data: ScheduleFormData) => Promise<void>;
}

export interface ScheduleFormData {
    leadId: string;
    vehicleId: string;
    date: string;
    time: string;
    isNewLead: boolean;
    newLeadName: string;
    newLeadPhone: string;
    vehicleSearch: string;
}

const ScheduleVisitModal: React.FC<ScheduleVisitModalProps> = ({ isOpen, onClose, leads, vehicles, onSchedule }) => {
    const [form, setForm] = useState<ScheduleFormData>({
        leadId: '',
        vehicleId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '09:00',
        isNewLead: false,
        newLeadName: '',
        newLeadPhone: '',
        vehicleSearch: ''
    });

    const [leadSearch, setLeadSearch] = useState('');
    const [isLeadDropdownOpen, setIsLeadDropdownOpen] = useState(false);
    const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);

    const leadDropdownRef = useRef<HTMLDivElement>(null);
    const vehicleDropdownRef = useRef<HTMLDivElement>(null);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (leadDropdownRef.current && !leadDropdownRef.current.contains(event.target as Node)) {
                setIsLeadDropdownOpen(false);
            }
            if (vehicleDropdownRef.current && !vehicleDropdownRef.current.contains(event.target as Node)) {
                setIsVehicleDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSchedule(form);
    };

    const filteredLeads = leads.filter(l =>
        l.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
        l.phone?.includes(leadSearch)
    );

    const filteredVehicles = vehicles.filter(v => 
        v.status === 'available' && 
        `${v.brand} ${v.model}`.toLowerCase().includes(form.vehicleSearch.toLowerCase())
    );

    return createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl animate-fadeUp overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-tight italic">Agendar Atendimento</h2>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Visitante Presencial</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg transition-all group">
                        <X size={20} className="text-slate-300 group-hover:rotate-90 transition-all" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setForm(prev => ({ ...prev, isNewLead: false }))}
                                className={`py-3 rounded-xl border transition-all text-[9px] font-black uppercase flex flex-col items-center gap-1 ${!form.isNewLead ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>
                                <Users size={16} /> Existente
                            </button>
                            <button type="button" onClick={() => setForm(prev => ({ ...prev, isNewLead: true }))}
                                className={`py-3 rounded-xl border transition-all text-[9px] font-black uppercase flex flex-col items-center gap-1 ${form.isNewLead ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>
                                <UserPlus size={16} /> Novo Registro
                            </button>
                        </div>

                        {form.isNewLead ? (
                            <div className="space-y-3 animate-fadeUp">
                                <input type="text" required placeholder="Nome Completo" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                                    value={form.newLeadName} onChange={e => setForm(prev => ({ ...prev, newLeadName: e.target.value }))} />
                                <input type="text" required placeholder="WhatsApp" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                                    value={form.newLeadPhone} onChange={e => setForm(prev => ({ ...prev, newLeadPhone: e.target.value }))} />
                            </div>
                        ) : (
                            <div className="relative animate-fadeUp" ref={leadDropdownRef}>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Selecione o Cliente</label>
                                <input
                                    type="text"
                                    placeholder="Buscar por nome ou telefone..."
                                    value={leadSearch}
                                    onChange={(e) => {
                                        setLeadSearch(e.target.value);
                                        setIsLeadDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsLeadDropdownOpen(true)}
                                    className="w-full text-xs font-bold p-3.5 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-brand-500 transition-all outline-none"
                                />
                                {isLeadDropdownOpen && leadSearch && filteredLeads.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto custom-scrollbar">
                                        {filteredLeads.map(l => (
                                            <div
                                                key={l.id}
                                                className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                                                onClick={() => {
                                                    setLeadSearch(`${l.name} (${l.phone || 'Sem telefone'})`);
                                                    setForm(prev => ({ ...prev, leadId: l.id }));
                                                    setIsLeadDropdownOpen(false);
                                                }}
                                            >
                                                <p className="text-sm font-bold text-slate-700">{l.name}</p>
                                                <p className="text-[10px] font-bold text-brand-600 mt-0.5">{l.phone || 'Sem telefone'}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="relative" ref={vehicleDropdownRef}>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Veículo de Interesse (Opcional)</label>
                                <input
                                    type="text"
                                    placeholder="Ex: BYD Dolphin"
                                    value={form.vehicleSearch}
                                    onChange={(e) => {
                                        setForm({ ...form, vehicleSearch: e.target.value });
                                        setIsVehicleDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsVehicleDropdownOpen(true)}
                                    className="w-full text-xs font-bold p-3.5 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-brand-500 transition-all outline-none"
                                />
                                {isVehicleDropdownOpen && form.vehicleSearch && filteredVehicles.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto custom-scrollbar">
                                        {filteredVehicles.map(v => (
                                            <div
                                                key={v.id}
                                                className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                                                onClick={() => {
                                                    setForm({ ...form, vehicleSearch: `${v.brand} ${v.model}`, vehicleId: v.id });
                                                    setIsVehicleDropdownOpen(false);
                                                }}
                                            >
                                                <p className="text-sm font-bold text-slate-700">{v.brand} {v.model}</p>
                                                <p className="text-[10px] font-bold text-brand-600 mt-0.5">R$ {formatCurrency(v.price)}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <CustomDatePicker className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                                    value={form.date} onChange={val => setForm(prev => ({ ...prev, date: val }))} />
                                <CustomTimePicker className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                                    value={form.time} onChange={val => setForm(prev => ({ ...prev, time: val }))} />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-brand-500 transition-all flex items-center justify-center gap-2 mt-4">
                        <Plus size={16} /> Finalizar Agendamento
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default ScheduleVisitModal;
