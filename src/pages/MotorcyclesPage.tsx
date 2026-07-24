import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MotorcycleInventory from '../components/MotorcycleInventory';
import { Motorcycle } from '../types';
import { useAuthContext } from '../contexts/AuthContext';
import { useInventoryContext } from '../contexts/InventoryContext';
import { useLeadContext } from '../contexts/LeadContext';

const MotorcyclesPage: React.FC = () => {
    const navigate = useNavigate();
    const { profile } = useAuthContext();
    const { motorcycles, refreshMotorcycles } = useInventoryContext();
    const { leads, addLead } = useLeadContext();

    const loadMotorcycles = useCallback(async () => {
        await refreshMotorcycles();
    }, [refreshMotorcycles]);

    useEffect(() => {
        loadMotorcycles();
    }, [loadMotorcycles]);

    const handleViewLead = (leadId: string) => {
        navigate(`/leads/${leadId}`);
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
