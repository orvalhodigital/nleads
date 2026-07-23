
import React from 'react';
import Dashboard from '../components/Dashboard';
import { useAuthContext } from '../contexts/AuthContext';
import { useInventoryContext } from '../contexts/InventoryContext';
import { useLeadContext } from '../contexts/LeadContext';

const DashboardPage: React.FC = () => {
    const { profile } = useAuthContext();
    const { vehicles, motorcycles } = useInventoryContext();
    const { leads } = useLeadContext();
    // Dashboard expects leads and vehicles.
    return <Dashboard leads={leads} vehicles={vehicles} motorcycles={motorcycles} profile={profile} />;
};

export default DashboardPage;
