import React from 'react';
import MaintenanceManager from '../components/MaintenanceManager';
import { useData } from '../contexts/DataContext';

const MaintenancePage: React.FC = () => {
    const {
        maintenances, addMaintenance, updateMaintenance, deleteMaintenance
    } = useData();

    return (
        <MaintenanceManager
            maintenances={maintenances}
            onAddMaintenance={addMaintenance}
            onUpdateMaintenance={updateMaintenance}
            onDeleteMaintenance={deleteMaintenance}
        />
    );
};

export default MaintenancePage;
