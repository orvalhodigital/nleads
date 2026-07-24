import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { useInventoryContext } from '../contexts/InventoryContext';
import { useLeadContext } from '../contexts/LeadContext';
import { useBasePath } from '../hooks/useBasePath';
import { Clock, Car, ExternalLink, Plus, MessageCircle, CheckCircle2, X, Edit2, Sparkles, Zap, Flame } from 'lucide-react';

import { LeadTemperature, LeadPhase } from '../types';
import { leadCommunicationService } from '../services/leadCommunicationService';
import { CustomDatePicker } from '../components/ui/CustomDatePicker';
import { CustomTimePicker } from '../components/ui/CustomTimePicker';
import { formatCurrency } from '../utils/formatters';
import { DEFAULT_PRESET_MESSAGES } from '../utils/constants';
import { deriveRootVisitFields } from '../utils/visits';
import { useToast } from '../contexts/ToastContext';
import { generateUUID } from '../utils/uuid';

import { LeadHeader } from '../components/lead-detail/LeadHeader';
import { LeadContactInfo } from '../components/lead-detail/LeadContactInfo';
import { LeadSaleDetails } from '../components/lead-detail/LeadSaleDetails';
import { LeadPreferences } from '../components/lead-detail/LeadPreferences';
import { LeadSimulationData } from '../components/lead-detail/LeadSimulationData';

const LeadDetailPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const basePath = useBasePath();
    const { profile } = useAuthContext();
    const { vehicles, motorcycles } = useInventoryContext();
    const { leads, updateLead } = useLeadContext();
    // showToast não existe em useData() — sempre foi `undefined` aqui (mascarado pelo
    // `?.` nas chamadas), então agendar visita/enviar mensagem nunca mostrava toast.
    const { showToast } = useToast();
    const safeLead = (found: any) => {
        if (!found) return null;
        return {
            ...found,
            preferences: {
                marcas: [],
                modelos: [],
                tipos_veiculo: [],
                carro_transmissao: [],
                carro_motorizacao: [],
                transmissao: [],
                motorizacao: [],
                marcas_moto: [],
                modelos_moto: [],
                tipos_moto: [],
                moto_transmissao: [],
                moto_motorizacao: [],
                ...(found.preferences || {})
            }
        };
    };

    const [lead, setLead] = useState(safeLead(leads.find(l => l.id === id)));
    const [visitNoteEdit, setVisitNoteEdit] = useState<{ id: string | null; draft: string }>({ id: null, draft: '' });
    const [isAllMatchesModalOpen, setIsAllMatchesModalOpen] = useState(false);

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
        setLead(safeLead(leads.find(l => l.id === id)));
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

    // Sugestões de Inventário em duas camadas:
    // 1. Match Completo — marca E modelo E tipo de carroceria precisam bater
    //    (quando o lead preencheu esses campos). Antes cada critério preenchido
    //    era tratado como "ou" com os demais (na prática só marca/preço eram
    //    considerados), então um lead que queria especificamente um "Corolla"
    //    via TODOS os Toyota do estoque, não só Corollas.
    // 2. Outras Sugestões — veículos fora do Match Completo mas ainda
    //    relevantes: mesma faixa de preço (±20% do orçamento declarado) ou
    //    mesmo tipo de carroceria (quando o lead declarou um tipo).
    const inventorySuggestions = useMemo(() => {
        const hasCarPref = (lead?.preferences?.carro_valor_max ?? 0) > 0 ||
            (lead?.preferences?.marcas?.length ?? 0) > 0 ||
            (lead?.preferences?.modelos?.length ?? 0) > 0 ||
            (lead?.preferences?.tipos_veiculo?.length ?? 0) > 0;

        const hasMotoPref = (lead?.preferences?.moto_valor_max ?? 0) > 0 ||
            (lead?.preferences?.marcas_moto?.length ?? 0) > 0 ||
            (lead?.preferences?.modelos_moto?.length ?? 0) > 0 ||
            (lead?.preferences?.tipos_moto?.length ?? 0) > 0;

        const hasTruckPref = (lead?.preferences?.caminhao_valor_max ?? 0) > 0 ||
            (lead?.preferences?.marcas_caminhao?.length ?? 0) > 0 ||
            (lead?.preferences?.modelos_caminhao?.length ?? 0) > 0 ||
            (lead?.preferences?.tipos_caminhao?.length ?? 0) > 0;

        const hasAnyPreference = hasCarPref || hasMotoPref || hasTruckPref || (lead?.preferences?.valor_maximo ?? 0) > 0;

        if (!hasAnyPreference) {
            return { matchCompleto: [], outrasSugestoes: [], hasAnyPreference: false };
        }

        const buildPool = (items: any[], maxPrice: number, marcas: string[], modelos: string[], tipos: string[], isMoto: boolean) =>
            items
                .filter(item => item.status === 'available')
                .map(item => ({ item: { ...item, isMoto }, maxPrice, marcas, modelos, tipos }));

        const carMaxPrice = lead.preferences.carro_valor_max && lead.preferences.carro_valor_max > 0
            ? lead.preferences.carro_valor_max
            : (lead.preferences.valor_maximo && lead.preferences.valor_maximo > 0 ? lead.preferences.valor_maximo : 9999999);

        const carPool = profile?.enable_cars !== false
            ? buildPool(
                vehicles,
                carMaxPrice,
                lead.preferences.marcas || [],
                lead.preferences.modelos || [],
                lead.preferences.tipos_veiculo || [],
                false
            )
            : [];

        const motoMaxPrice = lead.preferences.moto_valor_max && lead.preferences.moto_valor_max > 0
            ? lead.preferences.moto_valor_max
            : (lead.preferences.valor_maximo && lead.preferences.valor_maximo > 0 ? lead.preferences.valor_maximo : 9999999);

        const motoPool = profile?.enable_motorcycles
            ? buildPool(
                motorcycles,
                motoMaxPrice,
                lead.preferences.marcas_moto || [],
                lead.preferences.modelos_moto || [],
                lead.preferences.tipos_moto || [],
                true
            )
            : [];

        const matchCompleto: any[] = [];
        const outrasSugestoes: any[] = [];

        [...carPool, ...motoPool].forEach(({ item, maxPrice, marcas, modelos, tipos }) => {
            const temLimitePreco = maxPrice < 9999999;
            const dentroDoOrcamento = !temLimitePreco || item.price <= maxPrice;
            const bateMarca = marcas.length === 0 || marcas.includes(item.brand);
            const bateModelo = modelos.length === 0 || modelos.includes(item.model);
            const bateTipo = tipos.length === 0 || tipos.includes(item.type);

            if (dentroDoOrcamento && bateMarca && bateModelo && bateTipo) {
                matchCompleto.push(item);
                return;
            }

            const mesmaFaixaDePreco = temLimitePreco && item.price >= maxPrice * 0.8 && item.price <= maxPrice * 1.2;
            const carroceriaSimilar = tipos.length > 0 && tipos.includes(item.type);
            if (mesmaFaixaDePreco || carroceriaSimilar) {
                const motivos: string[] = [];
                if (mesmaFaixaDePreco) motivos.push('Faixa de preço');
                if (carroceriaSimilar) motivos.push('Carroceria similar');
                outrasSugestoes.push({ ...item, _motivos: motivos });
            }
        });

        return { matchCompleto, outrasSugestoes, hasAnyPreference: true };
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
                id: generateUUID(),
                date: lead.visit_date,
                status: status,
                vehicleOfInterest: lead.scheduling_data?.vehicleOfInterest,
                notes: lead.scheduling_data?.notes
            });
        }

        // Deriva visit_date/visit_status do agendamento mais recente, em vez de
        // sobrescrever incondicionalmente com o agendamento que acabou de ser editado
        // (que pode ser um mais antigo sendo corrigido retroativamente). Ver utils/visits.ts.
        await updateLead({
            ...lead,
            ...deriveRootVisitFields(updatedAppointments),
            scheduling_data: {
                ...(lead.scheduling_data || {}),
                appointments: updatedAppointments
            }
        });
    };

    const handleSaveVisitNotes = async () => {
        if (!lead || !visitNoteEdit.id) return;

        let updatedAppointments = lead.scheduling_data?.appointments ? [...lead.scheduling_data.appointments] : [];
        const appointmentIndex = updatedAppointments.findIndex(a => a.id === visitNoteEdit.id);

        if (appointmentIndex !== -1) {
            updatedAppointments[appointmentIndex] = { ...updatedAppointments[appointmentIndex], notes: visitNoteEdit.draft };
        } else if (lead.visit_date && visitNoteEdit.id === 'legacy') {
            updatedAppointments.push({
                id: generateUUID(),
                date: lead.visit_date,
                status: lead.visit_status || 'pending',
                vehicleOfInterest: lead.scheduling_data?.vehicleOfInterest,
                notes: visitNoteEdit.draft
            });
        }

        await updateLead({
            ...lead,
            scheduling_data: {
                ...(lead.scheduling_data || {}),
                notes: visitNoteEdit.id === 'legacy' ? visitNoteEdit.draft : lead.scheduling_data?.notes,
                appointments: updatedAppointments
            }
        });
        setVisitNoteEdit({ id: null, draft: '' });
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
                id: generateUUID(),
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
                    id: generateUUID(),
                    date: visitDateTime,
                    status: lead.visit_status || 'pending',
                    vehicleOfInterest: newScheduleForm.vehicleOfInterest,
                    notes: newScheduleForm.notes
                });
            }
        } else {
            // Creating new
            const newAppointment = {
                id: generateUUID(),
                date: visitDateTime,
                status: 'pending' as const,
                vehicleOfInterest: newScheduleForm.vehicleOfInterest,
                notes: newScheduleForm.notes
            };
            updatedAppointments.push(newAppointment);
        }

        try {
            // Deriva visit_date/visit_status do agendamento mais recente (por data),
            // em vez de assumir que o agendamento recém-criado/editado é sempre "o mais
            // novo" — evita corromper o resumo do lead ao editar um agendamento antigo.
            await updateLead({
                ...lead,
                ...deriveRootVisitFields(updatedAppointments),
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

    const renderSuggestionCard = (v: any) => (
        <div key={v.id} className="bg-white p-5 rounded-3xl border border-slate-100 hover:border-brand-200 hover:shadow-md transition-all flex flex-col gap-4">
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-widest w-fit">{v.year}</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{v.brand} {v.model}</h4>
                </div>
                <Car size={16} className="text-slate-200" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-bold text-brand-600">R$ {formatCurrency(v.price)}</p>
                {v._motivos?.map((motivo: string) => (
                    <span key={motivo} className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                        {motivo}
                    </span>
                ))}
            </div>

            <div className="w-full flex gap-2">
                <button
                    onClick={() => handleOpenSuggestion(v.id, v.brand, v.model, v.year, v.price)}
                    className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-green-600 transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-green-500/20"
                >
                    <MessageCircle size={14} /> Enviar Sugestão
                </button>
                <button
                    onClick={() => navigate(v.isMoto ? `/motorcycles?motoId=${v.id}` : `/inventory?vehicleId=${v.id}`)}
                    className="px-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"
                >
                    <ExternalLink size={16} />
                </button>
            </div>
        </div>
    );

    const handleSubmitSuggestion = async () => {
        if (!lead || !profile) {
            showToast?.('error', 'Perfil incomum ou Lead não carregado.');
            return;
        }

        setIsSendingSuggestion(true);
        try {
            await leadCommunicationService.insert({
                lead_id: lead.id,
                vehicle_id: suggestionModal.vehicleId,
                user_id: profile.id,
                contact_name: lead.name,
                contact_phone: lead.phone,
                message_body: suggestionModal.message,
                is_sent: 'não',
                email_user: profile.email
            });

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
            <LeadHeader lead={lead} onBack={() => navigate(-1)} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Coluna 1: Informações de Contato e Visita */}
                <div className="space-y-6">
                    <LeadContactInfo lead={lead} />

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
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-brand-100 transition-colors border border-brand-100 shadow-sm active:scale-95"
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
                                            className="bg-white rounded-[24px] border border-slate-100 p-5 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-500/5 transition-all group"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${app.status === 'show' ? 'bg-brand-50 text-brand-600' :
                                                        app.status === 'noshow' ? 'bg-rose-50 text-rose-600' :
                                                            'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'
                                                        }`}>
                                                        <Clock size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-black text-slate-900">
                                                                {new Date(app.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                            </p>
                                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                            <p className="text-sm font-black text-indigo-600">
                                                                {new Date(app.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${app.status === 'show' ? 'bg-brand-100 text-brand-700' :
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
                                                        onClick={() => setVisitNoteEdit({ id: app.id, draft: app.notes || '' })}
                                                        className="p-2 text-slate-300 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-all"
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
                                                    className={`flex-1 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${app.status === 'show' ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20' : 'bg-white text-slate-500 border-slate-100 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-100'}`}
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

                {/* Coluna 2 e 3: Vendas, Perfil, Simulação e Veículos */}
                <div className="md:col-span-2 space-y-6">
                    <LeadSaleDetails
                        lead={lead}
                        onUpdateLead={async (updated) => {
                            setLead(updated);
                            await updateLead(updated);
                        }}
                        purchasedVehicles={purchasedVehicles}
                    />
                    <LeadPreferences lead={lead} />
                    <LeadSimulationData lead={lead} />

                    <div>
                        <div className="flex items-center justify-between mb-4 px-1">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-500/30 text-amber-500 shadow-sm">
                                    <Sparkles size={22} className="fill-amber-400 text-amber-500" />
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <h3 className="font-heading font-extrabold text-xl text-foreground tracking-tight">
                                        Match Perfeito
                                    </h3>
                                    <span className="px-2.5 py-0.5 text-xs font-black rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                        {inventorySuggestions.matchCompleto.length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {!inventorySuggestions.hasAnyPreference ? (
                            <div className="py-10 text-center border-2 border-dashed border-border/80 rounded-3xl bg-card p-6">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Nenhuma preferência cadastrada</p>
                                <p className="text-xs text-muted-foreground/80">Preencha o orçamento máximo ou selecione marcas e modelos no perfil do lead para exibir a compatibilidade em tempo real.</p>
                            </div>
                        ) : inventorySuggestions.matchCompleto.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {inventorySuggestions.matchCompleto.slice(0, 4).map(renderSuggestionCard)}
                                </div>

                                {inventorySuggestions.matchCompleto.length > 4 && (
                                    <button
                                        onClick={() => setIsAllMatchesModalOpen(true)}
                                        className="w-full mt-4 py-3.5 bg-card hover:bg-muted border border-border/80 rounded-2xl font-bold text-xs uppercase tracking-wider text-primary flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] cursor-pointer"
                                    >
                                        <Sparkles size={16} /> Ver todos os {inventorySuggestions.matchCompleto.length} veículos com Match Perfeito
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="py-10 text-center border-2 border-dashed border-border/80 rounded-3xl bg-card p-6">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nenhum veículo disponível bate 100% com o perfil deste lead.</p>
                            </div>
                        )}
                    </div>

                    {inventorySuggestions.outrasSugestoes.length > 0 && (
                        <div className="pt-4 border-t border-border/60">
                            <div className="flex items-center gap-3 mb-4 px-1">
                                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
                                    <Sparkles size={18} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-heading font-extrabold text-lg text-foreground tracking-tight">
                                        Pode dar Match
                                    </h3>
                                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                        {inventorySuggestions.outrasSugestoes.length}
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {inventorySuggestions.outrasSugestoes.slice(0, 4).map(renderSuggestionCard)}
                            </div>
                        </div>
                    )}
                    {purchasedVehicles.length > 0 && (
                        <div>
                            <h3 className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-6 px-1 flex items-center gap-2">
                                <Car size={14} /> Veículo Adquirido
                            </h3>

                            <div className="grid grid-cols-1 gap-4">
                                {purchasedVehicles.map(v => (
                                    <div key={v.id} className="bg-white p-6 rounded-3xl border border-brand-100 flex items-center justify-between shadow-sm group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 border border-brand-100/50">
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
                                            onClick={() => navigate(v.isMoto ? `/motorcycles?motoId=${v.id}` : `/inventory?vehicleId=${v.id}`)}
                                            className="p-2.5 text-brand-500 hover:bg-brand-50 rounded-xl transition-all"
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
            {visitNoteEdit.id && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl animate-fadeIn">
                        <h3 className="text-lg font-black text-slate-800 mb-4">Anotações da Visita</h3>
                        <textarea
                            value={visitNoteEdit.draft}
                            onChange={(e) => setVisitNoteEdit(v => ({ ...v, draft: e.target.value }))}
                            rows={4}
                            className="w-full text-sm font-medium p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-500 transition-all outline-none resize-none mb-4"
                            placeholder="Como foi a visita? Detalhes sobre o interesse do cliente..."
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setVisitNoteEdit({ id: null, draft: '' })}
                                className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveVisitNotes}
                                className="flex-1 py-3 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors shadow-sm shadow-brand-500/20"
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
                                <Clock size={20} className="text-brand-500" />
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
                                    className="w-full text-sm font-medium p-3.5 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-brand-500 transition-all outline-none"
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
                                                    <p className="text-[10px] font-bold text-brand-600 mt-0.5">R$ {formatCurrency(v.price)}</p>

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
                                    className="w-full text-sm font-medium p-3.5 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-brand-500 transition-all outline-none resize-none"
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
                                    className="flex-1 py-3 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm shadow-brand-500/20"
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
                                <MessageCircle className="text-brand-500" size={24} />
                                Revisar Mensagem
                            </h3>
                            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">Mensagem Sorteada Aleatoriamente</p>

                            <textarea
                                value={suggestionModal.message}
                                onChange={(e) => setSuggestionModal(prev => ({ ...prev, message: e.target.value }))}
                                rows={5}
                                className="w-full text-sm font-medium p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-500 transition-all outline-none resize-none mb-6 text-slate-700"
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

            {/* Modal para ver todos os veículos com Match Perfeito */}
            {isAllMatchesModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-card text-foreground rounded-3xl border border-border/80 p-6 md:p-8 max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between pb-4 border-b border-border/80 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                                    <Sparkles size={20} className="fill-amber-500/20" />
                                </div>
                                <div>
                                    <h3 className="font-heading font-extrabold text-xl tracking-tight">Veículos com Match Perfeito</h3>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Encontramos {inventorySuggestions.matchCompleto.length} veículos 100% compatíveis com as preferências de {lead.name}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAllMatchesModalOpen(false)}
                                className="w-10 h-10 rounded-xl bg-muted border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {inventorySuggestions.matchCompleto.map(renderSuggestionCard)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};



export default LeadDetailPage;
