
import React from 'react';
import Dashboard from '../components/Dashboard';
import { useData } from '../contexts/DataContext';

const DashboardPage: React.FC = () => {
    const { leads, vehicles, profile, motorcycles } = useData();
    return <Dashboard leads={leads} vehicles={vehicles} motorcycles={motorcycles} profile={profile} />;
};

export default DashboardPage;
