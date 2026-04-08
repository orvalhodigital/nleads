
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LeadManager from '../components/LeadManager';
import { useData } from '../contexts/DataContext';
import { LeadPhase } from '../types';

const LeadsPage: React.FC = () => {
    const location = useLocation();
    const {
        leads, vehicles, profile,
        addLead, updateLead, deleteLead,
        loadData
    } = useData();

    // Manage local focus state from router state
    const [focusedLeadId, setFocusedLeadId] = useState<string | null>(null);

    useEffect(() => {
        if (location.state && location.state.focusedLeadId) {
            setFocusedLeadId(location.state.focusedLeadId);
        }
    }, [location]);

    const ACTIVE_LEAD_PHASES = [
        LeadPhase.NEW,
        LeadPhase.VISIT,
        LeadPhase.SIMULATION,
        LeadPhase.FOLLOW_UP,
        LeadPhase.COMPLETED,
        LeadPhase.DISQUALIFIED
    ];

    return (
        <LeadManager
            leads={leads}
            phases={ACTIVE_LEAD_PHASES}
            vehicles={vehicles}
            onUpdateLead={updateLead}
            onAddLead={addLead}
            onDeleteLead={deleteLead}
            focusedLeadId={focusedLeadId}
            onClearFocus={() => setFocusedLeadId(null)}
            userEmail={profile?.email}
            onDataChange={loadData}
        />
    );
};

export default LeadsPage;
