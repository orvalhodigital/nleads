
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import UserLayout from './components/UserLayout';
import AdminApp from './admin/AdminApp';
import { ToastProvider } from './contexts/ToastContext';
import { DataProvider } from './contexts/DataContext';

// Pages
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import LeadsPage from './pages/LeadsPage';
import SalesClosedPage from './pages/SalesClosedPage';
import PlansPage from './pages/PlansPage';
import SettingsPage from './pages/SettingsPage';
import AgendaPage from './pages/AgendaPage';
import VehicleFormPage from './pages/VehicleFormPage';
import LeadFormPage from './pages/LeadFormPage';
import LeadDetailPage from './pages/LeadDetailPage';
import LeadActionPage from './pages/LeadActionPage';
import MotorcyclesPage from './pages/MotorcyclesPage';
import SupportPage from './pages/SupportPage';
import PhonesPage from './pages/PhonesPage';
import MaintenancePage from './pages/MaintenancePage';

const App: React.FC = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Admin Routes */}
          <Route path="/paineldoadm/*" element={<AdminApp />} />

          {/* User Routes */}
          <Route path="/*" element={
            <DataProvider>
              <UserLayout />
            </DataProvider>
          }>
            <Route index element={<HomePage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="inventory/new" element={<VehicleFormPage />} />
            <Route path="inventory/edit/:id" element={<VehicleFormPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="leads/new" element={<LeadFormPage />} />
            <Route path="leads/edit/:id" element={<LeadFormPage />} />
            <Route path="leads/:id" element={<LeadDetailPage />} />
            <Route path="leads/:id/action/:actionType" element={<LeadActionPage />} />
            <Route path="agenda" element={<AgendaPage />} />
            <Route path="sales-closed" element={<SalesClosedPage />} />
            <Route path="plans" element={<Navigate to="/settings" replace />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="motorcycles" element={<MotorcyclesPage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="phones" element={<PhonesPage />} />
            <Route path="maintenance" element={<MaintenancePage />} />

          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
