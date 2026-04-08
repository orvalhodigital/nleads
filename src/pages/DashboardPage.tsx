
import React from 'react';
import Dashboard from '../components/Dashboard';
import { useData } from '../contexts/DataContext';

const DashboardPage: React.FC = () => {
    const { leads, vehicles, profile, motorcycles } = useData();
    // Dashboard expects leads and vehicles.
    return <Dashboard leads={leads} vehicles={vehicles} motorcycles={motorcycles} profile={profile} />;
};

export default DashboardPage;
