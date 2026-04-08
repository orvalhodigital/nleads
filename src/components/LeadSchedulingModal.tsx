import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, Car, FileText, Check } from 'lucide-react';
import { Lead, Vehicle } from '../types';
import { vehicleService } from '../services/vehicleService';
import { CustomDatePicker } from './ui/CustomDatePicker';
import { CustomTimePicker } from './ui/CustomTimePicker';

interface Props {
    lead: Lead;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data?: { date: string; time: string; vehicleOfInterest: string; notes: string }) => void;
}

export const LeadSchedulingModal: React.FC<Props> = ({ lead, isOpen, onClose, onConfirm }) => {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [vehicleOfInterest, setVehicleOfInterest] = useState('');
    const [notes, setNotes] = useState('');

    const [availableItems, setAvailableItems] = useState<Vehicle[]>([]);
    const [selectedItems, setSelectedItems] = useState<Vehicle[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            const fetchItems = async () => {
                try {
                    const data = await vehicleService.getAll();
                    setAvailableItems(data.filter(v => v.status === 'available'));
                } catch (error) {
                    console.error("Erro ao carregar veículos", error);
                }
            };
            fetchItems();

            setDate('');
            setTime('');
            setVehicleOfInterest('');
            setNotes('');
            setSelectedItems([]);
            setIsDropdownOpen(false);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getItemLabel = (item: Vehicle) => `${item.brand} ${item.model} ${item.year}`;

    const filteredItems = availableItems.filter(v =>
        getItemLabel(v).toLowerCase().includes(vehicleOfInterest.toLowerCase()) &&
        !selectedItems.find(sv => sv.id === v.id)
    );

    const toggleItem = (item: Vehicle) => {
        if (!selectedItems.find(v => v.id === item.id)) {
            setSelectedItems([...selectedItems, item]);
            setVehicleOfInterest('');
            setIsDropdownOpen(false);
        }
    };

    const removeItem = (id: string) => {
        setSelectedItems(selectedItems.filter(v => v.id !== id));
    };

    const handleConfirm = () => {
        const finalLabelString = [
            ...selectedItems.map(v => getItemLabel(v)),
            vehicleOfInterest.trim()
        ].filter(Boolean).join(', ');

        onConfirm({ date, time, vehicleOfInterest: finalLabelString, notes });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white w-[80vw] max-w-5xl h-[80vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-fadeUp" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                            Agendar Visita/Test Drive
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Lead: {lead.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 hover:bg-white rounded-xl transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                                <Calendar size={12} /> Data da Visita
                            </label>
                            <CustomDatePicker
                                value={date}
                                onChange={(val) => setDate(val)}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                                <Clock size={12} /> Horário
                            </label>
                            <CustomTimePicker
                                value={time}
                                onChange={(val) => setTime(val)}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 relative" ref={dropdownRef}>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                            <Car size={12} /> Veículo de Interesse (Opcional)
                        </label>
                        <div className="w-full min-h-[56px] p-2 bg-slate-50 border border-slate-100 rounded-2xl focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all flex flex-wrap gap-2 items-center">
                            {selectedItems.map(item => (
                                <span key={item.id} className="flex items-center gap-1 bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl text-sm font-semibold">
                                    {getItemLabel(item)}
                                    <button onClick={() => removeItem(item.id)} className="ml-1 hover:text-emerald-950 transition-colors">
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                            <input
                                type="text"
                                placeholder={selectedItems.length === 0 ? "Ex: Jeep Compass 2022" : ""}
                                value={vehicleOfInterest}
                                onChange={e => {
                                    setVehicleOfInterest(e.target.value);
                                    setIsDropdownOpen(true);
                                }}
                                onFocus={() => setIsDropdownOpen(true)}
                                className="flex-1 bg-transparent border-none outline-none font-semibold text-sm min-w-[120px] px-2"
                            />
                        </div>
                        {isDropdownOpen && (vehicleOfInterest.trim() !== '' || availableItems.length > 0) && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden z-20 max-h-60 overflow-y-auto">
                                {filteredItems.length > 0 ? (
                                    filteredItems.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => toggleItem(item)}
                                            className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors border-b border-slate-50 last:border-0 group"
                                        >
                                            <div>
                                                <p className="font-semibold text-slate-800">
                                                    {item.brand} {item.model}
                                                </p>
                                                <p className="text-xs font-medium text-slate-400">
                                                    {item.year}
                                                </p>
                                            </div>
                                            <div className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Check size={18} />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-sm text-slate-500 font-medium">
                                        {vehicleOfInterest ? "Nenhum veículo encontrado." : "Nenhum disponível"}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                            <FileText size={12} /> Observações para a visita
                        </label>
                        <textarea
                            placeholder="Detalhes adicionais..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold text-sm resize-none custom-scrollbar"
                            rows={3}
                        />
                    </div>
                </div>

                <div className="p-8 border-t border-slate-100 bg-slate-50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-4 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onConfirm()}
                        className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                        Pular (Apenas Mover)
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!date}
                        className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                    >
                        Confirmar Agendamento
                    </button>
                </div>
            </div>
        </div>
    );
};
