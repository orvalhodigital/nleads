import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MotorcycleInventory from '../components/MotorcycleInventory';
import { motorcycleService } from '../services/motorcycleService';
import { Motorcycle } from '../types';
import { useData } from '../contexts/DataContext';

const MotorcyclesPage: React.FC = () => {
    const navigate = useNavigate();
    const { leads, profile, addLead } = useData();

    const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
    const [loading, setLoading] = useState(true);

    const loadMotorcycles = useCallback(async () => {
        try {
            const data = await motorcycleService.getAll();
            setMotorcycles(data);
        } catch (err) {
            console.error('Erro ao carregar motos:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMotorcycles();
    }, [loadMotorcycles]);

    const handleViewLead = (leadId: string) => {
        navigate('/leads', { state: { focusedLeadId: leadId } });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-emerald-500 font-bold">
                Carregando motos...
            </div>
        );
    }

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
