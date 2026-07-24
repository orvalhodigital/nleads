
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Inventory from '../components/Inventory';
import { useAuthContext } from '../contexts/AuthContext';
import { useInventoryContext } from '../contexts/InventoryContext';
import { useLeadContext } from '../contexts/LeadContext';
import { useData } from '../contexts/DataContext';

const InventoryPage: React.FC = () => {
    const navigate = useNavigate();
    const { profile } = useAuthContext();
    const { vehicles, addVehicle, updateVehicle, deleteVehicle, handleSellVehicle } = useInventoryContext();
    const { leads, addLead } = useLeadContext();
    const { loadData } = useData();

    // The ViewLead function in Inventory redirects to "leads" view with a focused ID.
    // In new router, we should navigate to `/leads?focus=ID` or something.
    const handleViewLead = (leadId: string) => {
        navigate(`/leads/${leadId}`);
    };

    return (
        <Inventory
            vehicles={vehicles}
            onAddVehicle={addVehicle}
            onUpdateVehicle={updateVehicle}
            onDeleteVehicle={deleteVehicle}
            onSellVehicle={handleSellVehicle}
            onAddLead={addLead}
            onViewLead={handleViewLead}
            leads={leads}
            userEmail={profile?.email}
            onDataChange={loadData}
        />
    );
};

export default InventoryPage;
