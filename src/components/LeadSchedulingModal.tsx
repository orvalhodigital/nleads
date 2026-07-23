import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, Car, FileText, Check } from 'lucide-react';
import { Lead, Vehicle } from '../types';
import { vehicleService } from '../services/vehicleService';
import { motorcycleService } from '../services/motorcycleService';
import { useAuthContext } from '../contexts/AuthContext';
import { CustomDatePicker } from './ui/CustomDatePicker';
import { CustomTimePicker } from './ui/CustomTimePicker';

interface Props {
    lead: Lead;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data?: { date: string; time: string; vehicleOfInterest: string; notes: string }) => void;
}

export const LeadSchedulingModal: React.FC<Props> = ({ lead, isOpen, onClose, onConfirm }) => {
    const { profile } = useAuthContext();
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [vehicleOfInterest, setVehicleOfInterest] = useState('');
    const [notes, setNotes] = useState('');

    const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicles, setSelectedVehicles] = useState<Vehicle[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            const fetchVehicles = async () => {
                try {
                    const isAdmin = ['empresa', 'super_admin', 'admin'].includes(profile?.role || '');
                    const adminId = isAdmin ? profile?.id : profile?.parent_id;
                    
                    const [vData, mData] = await Promise.all([
                        vehicleService.getAll(undefined, adminId || undefined),
                        motorcycleService.getAll(undefined, adminId || undefined)
                    ]);
                    setAvailableVehicles([...vData, ...mData.map(m => ({ ...m, isMoto: true } as any))].filter(v => v.status === 'available'));
                } catch (error) {
                    console.error("Erro ao carregar veículos", error);
                }
            };
            fetchVehicles();

            // Reset state directly when opening modal for the first time
            setDate('');
            setTime('');
            setVehicleOfInterest('');
            setNotes('');
            setSelectedVehicles([]);
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

    const filteredVehicles = availableVehicles.filter(v =>
        `${v.brand} ${v.model} ${v.year}`.toLowerCase().includes(vehicleOfInterest.toLowerCase()) &&
        !selectedVehicles.find(sv => sv.id === v.id)
    );

    const toggleVehicle = (vehicle: Vehicle) => {
        if (!selectedVehicles.find(v => v.id === vehicle.id)) {
            setSelectedVehicles([...selectedVehicles, vehicle]);
            setVehicleOfInterest(''); // clear search
            setIsDropdownOpen(false);
        }
    };

    const removeVehicle = (id: string) => {
        setSelectedVehicles(selectedVehicles.filter(v => v.id !== id));
    };

    const handleConfirm = () => {
        const finalVehicleString = [
            ...selectedVehicles.map(v => `${v.brand} ${v.model} ${v.year}`),
            vehicleOfInterest.trim()
        ].filter(Boolean).join(', ');

        onConfirm({ date, time, vehicleOfInterest: finalVehicleString, notes });
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-[10000] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card w-[80vw] max-w-5xl h-[80vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-fadeUp border border-border/80" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b border-border/70 flex items-center justify-between bg-muted/40">
                    <div>
                        <h2 className="text-xl font-heading font-bold text-foreground tracking-tight">Agendar Visita/Test Drive</h2>
                        <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">Lead: {lead.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-card rounded-xl transition-all cursor-pointer">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2">
                                <Calendar size={12} /> Data da Visita
                            </label>
                            <CustomDatePicker
                                value={date}
                                onChange={(val) => setDate(val)}
                                className="w-full p-4 bg-muted/75 border border-border/85 rounded-2xl outline-none focus:ring-4 focus:ring-ring transition-all font-semibold text-sm text-foreground"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2">
                                <Clock size={12} /> Horário
                            </label>
                            <CustomTimePicker
                                value={time}
                                onChange={(val) => setTime(val)}
                                className="w-full p-4 bg-muted/75 border border-border/85 rounded-2xl outline-none focus:ring-4 focus:ring-ring transition-all font-semibold text-sm text-foreground"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 relative" ref={dropdownRef}>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2">
                            <Car size={12} /> Veículo de Interesse (Opcional)
                        </label>
                        <div className="w-full min-h-[56px] p-2 bg-muted/75 border border-border/85 rounded-2xl focus-within:ring-4 focus-within:ring-ring transition-all flex flex-wrap gap-2 items-center">
                            {selectedVehicles.map(v => (
                                <span key={v.id} className="flex items-center gap-1 bg-primary/15 text-primary px-3 py-1.5 rounded-xl text-sm font-semibold">
                                    {v.brand} {v.model} {v.year}
                                    <button onClick={() => removeVehicle(v.id)} className="ml-1 hover:opacity-70 transition-opacity cursor-pointer">
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                            <input
                                type="text"
                                placeholder={selectedVehicles.length === 0 ? "Ex: Jeep Compass 2022" : ""}
                                value={vehicleOfInterest}
                                onChange={e => {
                                    setVehicleOfInterest(e.target.value);
                                    setIsDropdownOpen(true);
                                }}
                                onFocus={() => setIsDropdownOpen(true)}
                                className="flex-1 bg-transparent border-none outline-none font-semibold text-sm min-w-[120px] px-2 text-foreground"
                            />
                        </div>
                        {isDropdownOpen && (vehicleOfInterest.trim() !== '' || availableVehicles.length > 0) && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/80 rounded-2xl shadow-xl overflow-hidden z-[20000] max-h-60 overflow-y-auto">
                                {filteredVehicles.length > 0 ? (
                                    filteredVehicles.map(v => (
                                        <div
                                            key={v.id}
                                            onClick={() => toggleVehicle(v)}
                                            className="px-4 py-3 hover:bg-muted cursor-pointer flex items-center justify-between transition-colors border-b border-border/60 last:border-0 group"
                                        >
                                            <div>
                                                <p className="font-semibold text-foreground">{v.brand} {v.model}</p>
                                                <p className="text-xs font-medium text-muted-foreground">{v.year}{v.plate ? ` • ${v.plate}` : ''}</p>
                                            </div>
                                            <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Check size={18} />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-sm text-muted-foreground font-medium">
                                        {vehicleOfInterest ? "Nenhum veículo encontrado. Você ainda pode usar este texto." : "Nenhum veículo disponível"}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2">
                            <FileText size={12} /> Observações para a visita
                        </label>
                        <textarea
                            placeholder="Detalhes adicionais..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full p-4 bg-muted/75 border border-border/85 rounded-2xl outline-none focus:ring-4 focus:ring-ring transition-all font-semibold text-sm text-foreground resize-none custom-scrollbar"
                            rows={3}
                        />
                    </div>
                </div>

                <div className="p-8 border-t border-border/70 bg-muted/40 flex gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-4 text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onConfirm()}
                        className="flex-1 py-4 bg-card border border-border/80 text-muted-foreground rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-muted transition-all cursor-pointer"
                    >
                        Pular (Apenas Mover)
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!date}
                        className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 cursor-pointer"
                    >
                        Confirmar Agendamento
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

