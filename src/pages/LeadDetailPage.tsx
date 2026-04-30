import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useBasePath } from '../hooks/useBasePath';
import {
    ArrowLeft, Edit2, DollarSign, Phone, Mail, Clock, Car,
    ExternalLink, Plus, MessageCircle, CheckCircle2, X, History, Target
} from 'lucide-react';

import { LeadTemperature, LeadPhase } from '../types';
import { supabase } from '../lib/supabaseClient';
import { CustomDatePicker } from '../components/ui/CustomDatePicker';
import { CustomTimePicker } from '../components/ui/CustomTimePicker';
import { formatCurrency } from '../utils/formatters';
import { DEFAULT_PRESET_MESSAGES } from '../utils/constants';

const LeadDetailPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const basePath = useBasePath();
    const { leads, vehicles, motorcycles, updateLead, showToast, profile } = useData();
    const [lead, setLead] = useState(leads.find(l => l.id === id) || null);
    const [editingVisitNotesId, setEditingVisitNotesId] = useState<string | null>(null);
    const [visitNotesDraft, setVisitNotesDraft] = useState('');

    // Updates/Notes system
    const [showUpdatesPanel, setShowUpdatesPanel] = useState(false);
    const [updates, setUpdates] = useState<Array<{ timestamp: string; type: string; message: string }>>([]);
    const [newUpdate, setNewUpdate] = useState('');

    // New Scheduling State
    const [isNewSchedulingModalOpen, setIsNewSchedulingModalOpen] = useState(false);
    const [newScheduleForm, setNewScheduleForm] = useState({ id: '', date: '', time: '', vehicleOfInterest: '', notes: '' });
    const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);

    // Suggestion State
    const [suggestionModal, setSuggestionModal] = useState<{ isOpen: boolean, vehicleId?: string, message: string }>({ isOpen: false, message: '' });
    const [isSendingSuggestion, setIsSendingSuggestion] = useState(false);

    useEffect(() => {
        setLead(leads.find(l => l.id === id) || null);
    }, [id, leads]);

    if (!lead) {
        return (
            <div className="p-8 text-center text-slate-500">
                Lead não encontrado.
                <br /><br />
                <button onClick={() => navigate(-1)} className="px-4 py-2 bg-slate-100 rounded-lg font-bold">Voltar</button>
            </div>
        );
    }

    const matchingVehicles = useMemo(() => {
        const list: any[] = [];
        if (profile?.enable_cars !== false) {
            list.push(...vehicles.filter(v =>
                v.status === 'available' &&
                (v.price <= (lead.preferences.valor_maximo || 9999999)) &&
                (lead.preferences.marcas.length === 0 || lead.preferences.marcas.includes(v.brand))
            ));
        }
        if (profile?.enable_motorcycles) {
            list.push(...motorcycles.filter(m =>
                m.status === 'available' &&
                (m.price <= (lead.preferences.valor_maximo || 9999999)) &&
                (lead.preferences.marcas.length === 0 || lead.preferences.marcas.includes(m.brand))
            ).map(m => ({ ...m, isMoto: true })));
        }
        return list;
    }, [vehicles, motorcycles, lead, profile]);

    const purchasedVehicles = useMemo(() => {
        const list: any[] = [];
        if (profile?.enable_cars !== false) {
            list.push(...vehicles.filter(v => v.saleDetails?.buyerLeadId === lead.id));
        }
        if (profile?.enable_motorcycles) {
            list.push(...motorcycles.filter(m => m.saleDetails?.buyerLeadId === lead.id).map(m => ({ ...m, isMoto: true })));
        }
        return list;
    }, [vehicles, motorcycles, lead, profile]);

    const handleUpdateVisit = async (id: string, status: 'pending' | 'show' | 'noshow') => {
        let updatedAppointments = lead.scheduling_data?.appointments ? [...lead.scheduling_data.appointments] : [];
        const appointmentIndex = updatedAppointments.findIndex(a => a.id === id);

        if (appointmentIndex !== -1) {
            updatedAppointments[appointmentIndex] = { ...updatedAppointments[appointmentIndex], status };
        } else if (lead.visit_date && id === 'legacy') {
            updatedAppointments.push({
                id: crypto.randomUUID(),
                date: lead.visit_date,
                status: status,
                vehicleOfInterest: lead.scheduling_data?.vehicleOfInterest,
                notes: lead.scheduling_data?.notes
            });
        }

        // Keep root visit_date / status synced with the most recent/pending appointment if necessary,
        // or just set what was just updated
        await updateLead({
            ...lead,
            visit_status: status,
            scheduling_data: {
                ...(lead.scheduling_data || {}),
                appointments: updatedAppointments
            }
        });
    };

    const handleSaveVisitNotes = async () => {
        if (!lead || !editingVisitNotesId) return;

        let updatedAppointments = lead.scheduling_data?.appointments ? [...lead.scheduling_data.appointments] : [];
        const appointmentIndex = updatedAppointments.findIndex(a => a.id === editingVisitNotesId);

        if (appointmentIndex !== -1) {
            updatedAppointments[appointmentIndex] = { ...updatedAppointments[appointmentIndex], notes: visitNotesDraft };
        } else if (lead.visit_date && editingVisitNotesId === 'legacy') {
            updatedAppointments.push({
                id: crypto.randomUUID(),
                date: lead.visit_date,
                status: lead.visit_status || 'pending',
                vehicleOfInterest: lead.scheduling_data?.vehicleOfInterest,
                notes: visitNotesDraft
            });
        }

        await updateLead({
            ...lead,
            scheduling_data: {
                ...(lead.scheduling_data || {}),
                notes: editingVisitNotesId === 'legacy' ? visitNotesDraft : lead.scheduling_data?.notes,
                appointments: updatedAppointments
            }
        });
        setEditingVisitNotesId(null);
    };

    const handleScheduleNewVisit = async () => {
        if (!lead || !newScheduleForm.date || !newScheduleForm.time) return;

        const visitDateTime = new Date(`${newScheduleForm.date}T${newScheduleForm.time}`).toISOString();
        const presentedVehicles = [...(lead.presentedVehicles || [])];
        if (newScheduleForm.vehicleOfInterest && !presentedVehicles.includes(newScheduleForm.vehicleOfInterest)) {
            // assume it's just recorded in scheduling_data
        }

        const existingAppointments = lead.scheduling_data?.appointments || [];
        let updatedAppointments = [...existingAppointments];

        // Se já existia uma data na raiz e a lista tava vazia, migra ela implicitamente
        if (existingAppointments.length === 0 && lead.visit_date && !newScheduleForm.id) {
            updatedAppointments.push({
                id: crypto.randomUUID(),
                date: lead.visit_date,
                status: lead.visit_status || 'pending',
                vehicleOfInterest: lead.scheduling_data?.vehicleOfInterest,
                notes: lead.scheduling_data?.notes
            });
        }

        if (newScheduleForm.id) {
            // Editing existing
            const index = updatedAppointments.findIndex(a => a.id === newScheduleForm.id);
            if (index !== -1) {
                updatedAppointments[index] = {
                    ...updatedAppointments[index],
                    date: visitDateTime,
                    vehicleOfInterest: newScheduleForm.vehicleOfInterest,
                    notes: newScheduleForm.notes
                };
            } else if (newScheduleForm.id === 'legacy') {
                updatedAppointments.push({
                    id: crypto.randomUUID(),
                    date: visitDateTime,
                    status: lead.visit_status || 'pending',
                    vehicleOfInterest: newScheduleForm.vehicleOfInterest,
                    notes: newScheduleForm.notes
                });
            }
        } else {
            // Creating new
            const newAppointment = {
                id: crypto.randomUUID(),
                date: visitDateTime,
                status: 'pending' as const,
                vehicleOfInterest: newScheduleForm.vehicleOfInterest,
                notes: newScheduleForm.notes
            };
            updatedAppointments.push(newAppointment);
        }

        try {
            await updateLead({
                ...lead,
                visit_date: visitDateTime, // update latest
                visit_status: 'pending',
                phase: LeadPhase.VISIT,
                scheduling_data: {
                    ...(lead.scheduling_data || {}),
                    appointments: updatedAppointments
                }
            });

            showToast?.('success', newScheduleForm.id ? 'Visita atualizada com sucesso!' : 'Nova visita agendada com sucesso!');
            setIsNewSchedulingModalOpen(false);
            setNewScheduleForm({ id: '', date: '', time: '', vehicleOfInterest: '', notes: '' });
        } catch (error) {
            showToast?.('error', 'Erro ao agendar a visita.');
        }
    };

    const handleOpenSuggestion = (vehicleId: string, brand: string, model: string, year: number, price: number) => {
        if (!lead) return;

        const messages = (profile?.preset_messages && profile.preset_messages.length > 0) ? profile.preset_messages : DEFAULT_PRESET_MESSAGES;
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];

        const finalMsg = randomMsg
            .replace(/\{\{nome\}\}/gi, lead.name.split(' ')[0] || '')
            .replace(/\{\{marca\}\}/gi, brand || '')
            .replace(/\{\{modelo\}\}/gi, model || '')
            .replace(/\{\{ano\}\}/gi, String(year || ''))
            .replace(/\{\{valor\}\}/gi, String(price !== undefined ? formatCurrency(price) : ''));


        setSuggestionModal({
            isOpen: true,
            vehicleId,
            message: finalMsg
        });
    };

    const handleSubmitSuggestion = async () => {
        if (!lead || !profile) {
            showToast?.('error', 'Perfil incomum ou Lead não carregado.');
            return;
        }

        setIsSendingSuggestion(true);
        try {
            const { error } = await supabase.from('lead_communications').insert({
                lead_id: lead.id,
                vehicle_id: suggestionModal.vehicleId,
                user_id: profile.id,
                contact_name: lead.name,
                contact_phone: lead.phone,
                message_body: suggestionModal.message,
                is_sent: 'não',
                email_user: profile.email
            });

            if (error) {
                console.error('Error inserting communication:', error);
                throw error;
            }

            showToast?.('success', 'Mensagem enviada com sucesso!');
            setSuggestionModal({ isOpen: false, message: '' });
        } catch (err: any) {
            showToast?.('error', 'Falha ao enviar mensagem.');
        } finally {
            setIsSendingSuggestion(false);
        }
    };


    return (
        <div className="flex-1 space-y-8 pb-20 animate-fadeIn">
            {/* Header com botão Voltar */}
            <div className="flex items-center justify-between mb-2">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm font-bold text-sm">
                    <ArrowLeft size={16} /> Voltar
                </button>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`/leads/${lead.id}/action/sale`)}
                        className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-sm active:scale-95"
                    >
                        <DollarSign size={14} /> Registrar Venda
                    </button>
                    <button
                        onClick={() => navigate(`/leads/edit/${lead.id}`)}
                        className="flex items-center gap-2 px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all shadow-sm active:scale-95"
                    >
                        <Edit2 size={14} /> Editar
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-2xl shadow-md overflow-hidden">
                        {lead.foto_url ? (
                            <img src={lead.foto_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            lead.name.charAt(0)
                        )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{lead.name}</h2>
                        <div className="flex items-center gap-3 mt-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${lead.temperature === LeadTemperature.HOT ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                lead.temperature === LeadTemperature.WARM ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    'bg-sky-50 text-sky-600 border-sky-100'
                                }`}>
                                {lead.temperature}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lead.phase}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Coluna 1: Informações de Contato e Visita */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">Contato</h3>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                    <Phone size={14} />
                                </div>
                                <span className="text-sm font-semibold text-slate-700">{lead.phone}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                    <Mail size={14} />
                                </div>
                                <span className="text-sm font-semibold text-slate-700">{lead.email || 'Não informado'}</span>
                            </div>
                        </div>
                    </div>

                    {(lead.follow_up_data?.nextContactDate || lead.follow_up_data?.notes) && (
                        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-6">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">Follow-up</h3>

                            {lead.follow_up_data.nextContactDate && (
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Próximo Contato</p>
                                    <p className="text-sm font-semibold text-slate-700">{new Date(lead.follow_up_data.nextContactDate).toLocaleDateString('pt-BR')}</p>
                                </div>
                            )}
                            {lead.follow_up_data.notes && (
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Observações</p>
                                    <p className="text-sm font-medium text-slate-600 bg-slate-50 p-3 rounded-xl">{lead.follow_up_data.notes}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-5 relative">
                        <div className="flex items-center justify-between mb-6 px-1">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visitas Agendadas</h3>
                            <button
                                onClick={() => {
                                    const nextDay = new Date();
                                    nextDay.setDate(nextDay.getDate() + 1);
                                    setNewScheduleForm({
                                        id: '',
                                        date: nextDay.toISOString().split('T')[0],
                                        time: '10:00',
                                        vehicleOfInterest: '',
                                        notes: ''
                                    });
                                    setIsNewSchedulingModalOpen(true);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-100 transition-colors border border-emerald-100 shadow-sm active:scale-95"
                            >
                                <Plus size={14} /> Nova
                            </button>
                        </div>

                        {/* Histórico Real de Appointments */}
                        {(() => {
                            const appointments = lead.scheduling_data?.appointments || [];

                            // Migração visual em tempo real para leads legados
                            if (appointments.length === 0 && lead.visit_date) {
                                appointments.push({
                                    id: 'legacy',
                                    date: lead.visit_date,
                                    status: lead.visit_status || 'pending',
                                    vehicleOfInterest: lead.scheduling_data?.vehicleOfInterest,
                                    notes: lead.scheduling_data?.notes
                                });
                            }

                            if (appointments.length === 0) {
                                return (
                                    <div className="py-6 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nenhuma visita agendada</p>
                                    </div>
                                );
                            }

                            // Ordenamos por data (mais recente/futura primeiro)
                            const sortedAppointments = [...appointments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                            return (
                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    {sortedAppointments.map((app) => (
                                        <div key={app.id}
                                            className="bg-white rounded-[24px] border border-slate-100 p-5 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${app.status === 'show' ? 'bg-emerald-50 text-emerald-600' :
                                                        app.status === 'noshow' ? 'bg-rose-50 text-rose-600' :
                                                            'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'
                                                        }`}>
                                                        <Clock size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-black text-slate-900">
                                                                {new Date(new Date(app.date).getTime() - new Date().getTimezoneOffset() * 60000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                            </p>
                                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                            <p className="text-sm font-black text-indigo-600">
                                                                {new Date(new Date(app.date).getTime() - new Date().getTimezoneOffset() * 60000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${app.status === 'show' ? 'bg-emerald-100 text-emerald-700' :
                                                                app.status === 'noshow' ? 'bg-rose-100 text-rose-700' :
                                                                    'bg-slate-100 text-slate-500'
                                                                }`}>
                                                                {app.status === 'show' ? 'Concluída' : app.status === 'noshow' ? 'Não Compareceu' : 'Agendada'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setVisitNotesDraft(app.notes || '');
                                                            setEditingVisitNotesId(app.id);
                                                        }}
                                                        className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                                                        title="Anotações"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const appDate = new Date(app.date);
                                                            const formattedDate = appDate.getFullYear() + '-' + String(appDate.getMonth() + 1).padStart(2, '0') + '-' + String(appDate.getDate()).padStart(2, '0');
                                                            const formattedTime = String(appDate.getHours()).padStart(2, '0') + ':' + String(appDate.getMinutes()).padStart(2, '0');
                                                            setNewScheduleForm({
                                                                id: app.id,
                                                                date: formattedDate,
                                                                time: formattedTime,
                                                                vehicleOfInterest: app.vehicleOfInterest || '',
                                                                notes: app.notes || ''
                                                            });
                                                            setIsNewSchedulingModalOpen(true);
                                                        }}
                                                        className="p-2 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
                                                        title="Reagendar"
                                                    >
                                                        <Clock size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {app.vehicleOfInterest && (() => {
                                                const isUUID = app.vehicleOfInterest.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
                                                let vehicle: any = null;
                                                if (isUUID) {
                                                    vehicle = vehicles.find(v => v.id === app.vehicleOfInterest);
                                                    if (!vehicle) {
                                                        const m = motorcycles.find(m => m.id === app.vehicleOfInterest);
                                                        if (m) vehicle = { ...m, isMoto: true };
                                                    }
                                                }
                                                const label = vehicle ? `${vehicle.brand} ${vehicle.model}` : app.vehicleOfInterest;

                                                return (
                                                    <div
                                                        onClick={() => vehicle && navigate(vehicle.isMoto ? `/motorcycles/details/${vehicle.id}` : `/inventory/details/${vehicle.id}`)}
                                                        className={`mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${vehicle ? 'bg-indigo-50/50 text-indigo-700 border-indigo-100 hover:bg-indigo-100 cursor-pointer' : 'bg-slate-50/80 text-slate-600 border-slate-100/50'}`}
                                                    >
                                                        {vehicle?.isMoto ? <Car size={14} className="text-indigo-500" /> : <Car size={14} className={vehicle ? 'text-indigo-500' : 'text-slate-400'} />}
                                                        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                            {label}
                                                            {vehicle && <ExternalLink size={10} className="opacity-50" />}
                                                        </span>
                                                    </div>
                                                );
                                            })()}


                                            {app.notes && (
                                                <p className="text-[11px] text-slate-500 italic mb-4 px-1 line-clamp-2">"{app.notes}"</p>
                                            )}

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleUpdateVisit(app.id, app.status === 'show' ? 'pending' : 'show')}
                                                    className={`flex-1 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${app.status === 'show' ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20' : 'bg-white text-slate-500 border-slate-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100'}`}
                                                >
                                                    <CheckCircle2 size={12} />
                                                    {app.status === 'show' ? 'Realizada ✓' : 'Realizada'}
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateVisit(app.id, app.status === 'noshow' ? 'pending' : 'noshow')}
                                                    className={`flex-1 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${app.status === 'noshow' ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20' : 'bg-white text-slate-500 border-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100'}`}
                                                >
                                                    <X size={12} />
                                                    {app.status === 'noshow' ? 'Não Veio ✕' : 'Não Veio'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                            );
                        })()}
                    </div>
                </div>

                {/* Coluna 2 e 3: Perfil, Simulação e Veículos */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">Perfil de Interesse</h3>

                        <div className="grid grid-cols-2 gap-8">

                            {/* SEÇÃO CARROS */}
                            {lead.preferences.interesse_carro && (
                                <div className="col-span-2 space-y-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <Car size={16} className="text-emerald-500" />
                                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Interesse em Carros</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Marcas Preferenciais</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {lead.preferences.marcas && lead.preferences.marcas.length > 0 ? (
                                                    lead.preferences.marcas.map(m => (
                                                        <span key={m} className="px-2 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-bold uppercase">{m}</span>
                                                    ))
                                                ) : <span className="text-[10px] text-slate-400 italic font-medium">Qualquer marca</span>}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Modelos</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {lead.preferences.modelos && lead.preferences.modelos.length > 0 ? (
                                                    lead.preferences.modelos.map(m => (
                                                        <span key={m} className="px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-[9px] font-bold uppercase">{m}</span>
                                                    ))
                                                ) : <span className="text-[10px] text-slate-400 italic font-medium">Qualquer modelo</span>}
                                            </div>
                                        </div>
                                        {lead.preferences.tipos_veiculo && lead.preferences.tipos_veiculo.length > 0 && (
                                            <div className="col-span-2">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tipos de Carro</p>
                                                <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
                                                    {lead.preferences.tipos_veiculo.join(' • ')}
                                                </p>
                                            </div>
                                        )}
                                        <div className="col-span-2 grid grid-cols-3 gap-4 pt-3 border-t border-slate-100/50">
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Valor Máx</p>
                                                <p className="text-sm font-black text-emerald-600">
                                                    R$ {formatCurrency(lead.preferences.carro_valormax || lead.preferences.valor_maximo || 0)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Câmbio</p>
                                                <p className="text-[11px] font-bold text-slate-700 uppercase">
                                                    {(lead.preferences.carro_transmissao || lead.preferences.transmissao || []).join(', ') || 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Motor</p>
                                                <p className="text-[11px] font-bold text-slate-700 uppercase">
                                                    {(lead.preferences.carro_motorizacao || lead.preferences.motorizacao || []).join(', ') || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SEÇÃO MOTOS */}
                            {lead.preferences.interesse_moto && (
                                <div className="col-span-2 space-y-4 p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-indigo-500 flex items-center justify-center">
                                            <Target size={10} className="text-white" />
                                        </div>
                                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Interesse em Motos</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Marcas de Moto</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {lead.preferences.marcas_moto && lead.preferences.marcas_moto.length > 0 ? (
                                                    lead.preferences.marcas_moto.map(m => (
                                                        <span key={m} className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-bold uppercase">{m}</span>
                                                    ))
                                                ) : <span className="text-[10px] text-indigo-400 italic font-medium">Qualquer marca</span>}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Modelos de Moto</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {lead.preferences.modelos_moto && lead.preferences.modelos_moto.length > 0 ? (
                                                    lead.preferences.modelos_moto.map(m => (
                                                        <span key={m} className="px-2 py-1 bg-white border border-indigo-100 text-indigo-600 rounded-lg text-[9px] font-bold uppercase">{m}</span>
                                                    ))
                                                ) : <span className="text-[10px] text-indigo-400 italic font-medium">Qualquer modelo</span>}
                                            </div>
                                        </div>
                                        {lead.preferences.tipos_moto && lead.preferences.tipos_moto.length > 0 && (
                                            <div className="col-span-2">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tipos de Moto</p>
                                                <p className="text-[11px] font-black text-indigo-700 uppercase tracking-tight">
                                                    {lead.preferences.tipos_moto.join(' • ')}
                                                </p>
                                            </div>
                                        )}
                                        <div className="col-span-2 grid grid-cols-3 gap-4 pt-3 border-t border-indigo-100/50">
                                            <div>
                                                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Valor Máx</p>
                                                <p className="text-sm font-black text-indigo-600">
                                                    R$ {formatCurrency(lead.preferences.moto__valormax || 0)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Câmbio</p>
                                                <p className="text-[11px] font-bold text-indigo-700 uppercase">
                                                    {(lead.preferences.moto_transmissao || []).join(', ') || 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Motor</p>
                                                <p className="text-[11px] font-bold text-indigo-700 uppercase">
                                                    {(lead.preferences.moto_motorizacao || []).join(', ') || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(lead.preferences.possui_entrada || lead.preferences.possui_troca) && (
                                <div className="col-span-2 grid grid-cols-2 gap-8 pt-4 border-t border-slate-50">
                                    {lead.preferences.possui_entrada && (
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Entrada Planejada</p>
                                            <p className="text-sm font-bold text-emerald-600">R$ {formatCurrency(lead.preferences.valor_entrada || 0)}</p>
                                        </div>
                                    )}
                                    {lead.preferences.possui_troca && (
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Veículo para Troca</p>
                                            <p className="text-sm font-bold text-slate-700">{lead.preferences.veiculo_troca}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            {lead.preferences.observacoes_adicionais && (
                                <div className="col-span-2 pt-4 border-t border-slate-50">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Observações Adicionais</p>
                                    <p className="text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-xl italic">"{lead.preferences.observacoes_adicionais}"</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {(lead.simulation_data?.cpf || lead.simulation_data?.downPayment || lead.simulation_data?.installments || lead.simulation_data?.notes) && (
                        <div className="p-6 bg-white rounded-3xl border border-indigo-100 shadow-sm">
                            <h3 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-6 px-1">Dados de Simulação</h3>
                            <div className="grid grid-cols-2 gap-6">

                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Entrada Proposta</p>
                                    <p className="text-sm font-semibold text-indigo-700 bg-indigo-50 px-3 py-2 rounded-xl w-fit">R$ {lead.simulation_data?.downPayment ? formatCurrency(lead.simulation_data.downPayment) : '0'}</p>

                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Parcelamento</p>
                                    <p className="text-sm font-semibold text-slate-700">{lead.simulation_data?.installments ? `${lead.simulation_data.installments}x` : 'N/A'}</p>
                                </div>
                                {(lead.simulation_data?.cpf || lead.simulation_data?.cnh) && (
                                    <div className="col-span-full flex gap-4">
                                        {lead.simulation_data?.cpf && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">CPF: {lead.simulation_data.cpf}</span>}
                                        {lead.simulation_data?.cnh && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">CNH: {lead.simulation_data.cnh}</span>}
                                    </div>
                                )}
                                {lead.simulation_data?.notes && (
                                    <div className="col-span-full pt-4 border-t border-indigo-50">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Notas da Simulação</p>
                                        <p className="text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-xl">{lead.simulation_data.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}




                    <div>

                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">Sugestões de Inventário</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {matchingVehicles.length > 0 ? (
                                matchingVehicles.slice(0, 4).map(v => (
                                    <div key={v.id} className="bg-white p-5 rounded-3xl border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-widest w-fit">{v.year}</span>
                                                <h4 className="font-bold text-slate-900 text-sm mt-1">{v.brand} {v.model}</h4>
                                            </div>
                                            <Car size={16} className="text-slate-200" />
                                        </div>
                                        <p className="text-xs font-bold text-emerald-600">R$ {formatCurrency(v.price)}</p>

                                        <div className="w-full flex gap-2">
                                            <button
                                                onClick={() => handleOpenSuggestion(v.id, v.brand, v.model, v.year, v.price)}
                                                className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-green-600 transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-green-500/20"
                                            >
                                                <MessageCircle size={14} /> Enviar Sugestão
                                            </button>
                                            <button
                                                onClick={() => navigate(v.isMoto ? `/motorcycles/details/${v.id}` : `/inventory/details/${v.id}`)}
                                                className="px-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"
                                            >
                                                <ExternalLink size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-2 py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nenhum veículo no estoque atende ao perfil.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    {purchasedVehicles.length > 0 && (
                        <div>
                            <h3 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-6 px-1 flex items-center gap-2">
                                <Car size={14} /> Veículo Adquirido
                            </h3>

                            <div className="grid grid-cols-1 gap-4">
                                {purchasedVehicles.map(v => (
                                    <div key={v.id} className="bg-white p-6 rounded-3xl border border-emerald-100 flex items-center justify-between shadow-sm group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100/50">
                                                <Car size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm">{v.brand} {v.model}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">
                                                    {v.year} • {v.plate}
                                                    {v.saleDetails?.saleDate ? ` • Adquirido em ${new Date(v.saleDetails.saleDate).toLocaleDateString('pt-BR')} por R$ ${v.saleDetails.salePrice ? formatCurrency(v.saleDetails.salePrice) : ''}` : ''}

                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/inventory/details/${v.id}`)}
                                            className="p-2.5 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                                            title="Ver no Estoque"
                                        >
                                            <ExternalLink size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

            </div>

            {/* Editing Notes Modal */}
            {editingVisitNotesId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl animate-fadeIn">
                        <h3 className="text-lg font-black text-slate-800 mb-4">Anotações da Visita</h3>
                        <textarea
                            value={visitNotesDraft}
                            onChange={(e) => setVisitNotesDraft(e.target.value)}
                            rows={4}
                            className="w-full text-sm font-medium p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 transition-all outline-none resize-none mb-4"
                            placeholder="Como foi a visita? Detalhes sobre o interesse do cliente..."
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setEditingVisitNotesId(null)}
                                className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveVisitNotes}
                                className="flex-1 py-3 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors shadow-sm shadow-emerald-500/20"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Nova Visita Modal */}
            {
                isNewSchedulingModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl animate-fadeIn space-y-5">
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <Clock size={20} className="text-emerald-500" />
                                {newScheduleForm.id ? 'Reagendar Visita' : 'Agendar Nova Visita'}
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Data</label>
                                    <CustomDatePicker
                                        value={newScheduleForm.date}
                                        onChange={(date) => setNewScheduleForm({ ...newScheduleForm, date })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Horário</label>
                                    <CustomTimePicker
                                        value={newScheduleForm.time}
                                        onChange={(time) => setNewScheduleForm({ ...newScheduleForm, time })}
                                    />
                                </div>
                            </div>

                            <div className="relative">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Veículo de Interesse</label>
                                <input
                                    type="text"
                                    placeholder="Ex: BYD Dolphin"
                                    value={newScheduleForm.vehicleOfInterest}
                                    onChange={(e) => {
                                        setNewScheduleForm({ ...newScheduleForm, vehicleOfInterest: e.target.value });
                                        setIsVehicleDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsVehicleDropdownOpen(true)}
                                    onBlur={() => setTimeout(() => setIsVehicleDropdownOpen(false), 200)}
                                    className="w-full text-sm font-medium p-3.5 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 transition-all outline-none"
                                />
                                {isVehicleDropdownOpen && newScheduleForm.vehicleOfInterest && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto custom-scrollbar">
                                        {[...vehicles.filter(v => profile?.enable_cars !== false), ...motorcycles.filter(m => profile?.enable_motorcycles).map(m => ({ ...m, isMoto: true }))]
                                            .filter(v => v.status === 'available' && `${v.brand} ${v.model}`.toLowerCase().includes(newScheduleForm.vehicleOfInterest.toLowerCase()))
                                            .map(v => (
                                                <div
                                                    key={v.id}
                                                    className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                                                    onClick={() => {
                                                        setNewScheduleForm({ ...newScheduleForm, vehicleOfInterest: `${v.brand} ${v.model}` });
                                                        setIsVehicleDropdownOpen(false);
                                                    }}
                                                >
                                                    <p className="text-sm font-bold text-slate-700">{v.brand} {v.model}</p>
                                                    <p className="text-[10px] font-bold text-emerald-600 mt-0.5">R$ {formatCurrency(v.price)}</p>

                                                </div>
                                            ))
                                        }
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Observações (opcional)</label>
                                <textarea
                                    value={newScheduleForm.notes}
                                    onChange={(e) => setNewScheduleForm({ ...newScheduleForm, notes: e.target.value })}
                                    rows={3}
                                    className="w-full text-sm font-medium p-3.5 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 transition-all outline-none resize-none"
                                    placeholder="Alguma observação para a visita?"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setIsNewSchedulingModalOpen(false)}
                                    className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleScheduleNewVisit}
                                    disabled={!newScheduleForm.date || !newScheduleForm.time}
                                    className="flex-1 py-3 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm shadow-emerald-500/20"
                                >
                                    Confirmar Agendamento
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal de Enviar Sugestão */}
            {
                suggestionModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl animate-fadeIn">
                            <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2">
                                <MessageCircle className="text-emerald-500" size={24} />
                                Revisar Mensagem
                            </h3>
                            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">Mensagem Sorteada Aleatoriamente</p>

                            <textarea
                                value={suggestionModal.message}
                                onChange={(e) => setSuggestionModal(prev => ({ ...prev, message: e.target.value }))}
                                rows={5}
                                className="w-full text-sm font-medium p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 transition-all outline-none resize-none mb-6 text-slate-700"
                                placeholder="A mensagem..."
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSuggestionModal({ isOpen: false, message: '' })}
                                    className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                    disabled={isSendingSuggestion}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSubmitSuggestion}
                                    disabled={!suggestionModal.message.trim() || isSendingSuggestion}
                                    className="flex-[2] py-3 text-sm font-bold text-white bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm shadow-green-500/20 flex items-center justify-center gap-2"
                                >
                                    {isSendingSuggestion ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <MessageCircle size={18} />
                                            Enviar Mensagem
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};



export default LeadDetailPage;
