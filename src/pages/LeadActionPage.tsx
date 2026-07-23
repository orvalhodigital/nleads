import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInventoryContext } from '../contexts/InventoryContext';
import { useLeadContext } from '../contexts/LeadContext';
import { useToast } from '../contexts/ToastContext';
import { notificationService } from '../services/notificationService';
import { LeadPhase } from '../types';
import { deriveRootVisitFields } from '../utils/visits';
import { generateUUID } from '../utils/uuid';

import { LeadSchedulingModal } from '../components/LeadSchedulingModal';
import { LeadSimulationModal } from '../components/LeadSimulationModal';
import { LeadFollowUpModal } from '../components/LeadFollowUpModal';
import DisqualificationModal from '../components/DisqualificationModal';
import LeadSaleModal from '../components/LeadSaleModal';

const LeadActionPage: React.FC = () => {
    const { id, actionType } = useParams<{ id: string, actionType: string }>();
    const navigate = useNavigate();
    const { vehicles } = useInventoryContext();
    const { leads, updateLead, addLead } = useLeadContext();
    const { showToast } = useToast();

    const [lead, setLead] = useState(leads.find(l => l.id === id) || null);

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

    const handleClose = () => {
        navigate(-1);
    };

    if (actionType === 'disqualify') {
        return (
            <DisqualificationModal
                isOpen={true}
                leadName={lead.name}
                onClose={handleClose}
                onConfirm={async (reasons, notes) => {
                    await updateLead({
                        ...lead,
                        phase: LeadPhase.DISQUALIFIED,
                        disqualificationReasons: reasons,
                        disqualificationNotes: notes
                    });
                    showToast('success', 'Lead desqualificado.');
                    handleClose();
                }}
            />
        );
    }

    if (actionType === 'visit') {
        return (
            <LeadSchedulingModal
                isOpen={true}
                lead={lead}
                onClose={handleClose}
                onConfirm={async (data) => {
                    const oldPhase = lead.phase;
                    if (data) {
                        // Acrescenta um novo agendamento preservando o histórico existente.
                        // Antes: `scheduling_data: data` substituía o objeto inteiro, apagando
                        // silenciosamente quaisquer visitas já agendadas em `.appointments`.
                        const timeString = data.time || '00:00';
                        const visitDateTime = new Date(`${data.date}T${timeString}`).toISOString();
                        const existingAppointments = lead.scheduling_data?.appointments || [];
                        const newAppointment = {
                            id: generateUUID(),
                            date: visitDateTime,
                            status: 'pending' as const,
                            vehicleOfInterest: data.vehicleOfInterest,
                            notes: data.notes,
                        };
                        const updatedAppointments = [...existingAppointments, newAppointment];

                        await updateLead({
                            ...lead,
                            phase: LeadPhase.VISIT,
                            ...deriveRootVisitFields(updatedAppointments),
                            scheduling_data: {
                                ...(lead.scheduling_data || {}),
                                appointments: updatedAppointments,
                            },
                        });
                    } else {
                        await updateLead({ ...lead, phase: LeadPhase.VISIT });
                    }
                    await notificationService.notifyLeadPhaseChange(lead.name, oldPhase, LeadPhase.VISIT, 'system');
                    showToast('success', data ? 'Visita agendada e lead atualizado.' : 'Lead movido para Visita.');
                    handleClose();
                }}
            />
        );
    }

    if (actionType === 'simulation') {
        return (
            <LeadSimulationModal
                isOpen={true}
                lead={lead}
                onClose={handleClose}
                onConfirm={async (data) => {
                    const oldPhase = lead.phase;
                    await updateLead({
                        ...lead,
                        phase: LeadPhase.SIMULATION,
                        ...(data ? { simulation_data: data } : {})
                    });
                    await notificationService.notifyLeadPhaseChange(lead.name, oldPhase, LeadPhase.SIMULATION, 'system');
                    showToast('success', data ? 'Dados da simulação registrados.' : 'Lead movido para Simulação.');
                    handleClose();
                }}
            />
        );
    }

    if (actionType === 'followup') {
        return (
            <LeadFollowUpModal
                isOpen={true}
                lead={lead}
                onClose={handleClose}
                onConfirm={async (data) => {
                    const oldPhase = lead.phase;
                    await updateLead({
                        ...lead,
                        phase: LeadPhase.FOLLOW_UP,
                        ...(data ? { follow_up_data: data } : {})
                    });
                    await notificationService.notifyLeadPhaseChange(lead.name, oldPhase, LeadPhase.FOLLOW_UP, 'system');
                    showToast('success', data ? 'Follow-up iniciado.' : 'Lead movido para Follow-up.');
                    handleClose();
                }}
            />
        );
    }

    if (actionType === 'sale') {
        return (
            <LeadSaleModal
                isOpen={true}
                leadId={lead.id}
                leads={leads}
                vehicles={vehicles}
                onClose={handleClose}
                onAddLead={addLead}
                onSuccess={() => {
                    showToast('success', 'Venda finalizada com sucesso!');
                    handleClose();
                }}
            />
        );
    }

    return (
        <div className="p-8 text-center text-slate-500">
            Ação inválida.
            <br /><br />
            <button onClick={handleClose} className="px-4 py-2 bg-slate-100 rounded-lg font-bold">Voltar</button>
        </div>
    );
};

export default LeadActionPage;
