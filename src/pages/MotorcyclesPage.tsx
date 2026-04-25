import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MotorcycleInventory from '../components/MotorcycleInventory';
import { motorcycleService } from '../services/motorcycleService';
import { Motorcycle } from '../types';
import { useData } from '../contexts/DataContext';

const MotorcyclesPage: React.FC = () => {
    const navigate = useNavigate();
    const { leads, profile, addLead, motorcycles, refreshMotorcycles } = useData();

    const loadMotorcycles = useCallback(async () => {
        await refreshMotorcycles();
    }, [refreshMotorcycles]);

    useEffect(() => {
        loadMotorcycles();
    }, [loadMotorcycles]);

    const handleViewLead = (leadId: string) => {
        navigate('/leads', { state: { focusedLeadId: leadId } });
    };

    return (
        <MotorcycleInventory
            motorcycles={motorcycles}
            leads={leads}
            userEmail={profile?.email}
            onDataChange={loadMotorcycles}
            onAddLead={addLead}
            onViewLead={handleViewLead}
        />
    );
};

export default MotorcyclesPage;
