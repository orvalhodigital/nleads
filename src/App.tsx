
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
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
import WebsitePage from './pages/WebsitePage';

// Public site pages (no auth required)
import PublicSiteHome from './pages/public/PublicSiteHome';
import PublicVehicleDetail from './pages/public/PublicVehicleDetail';
import CustomDomainRedirect from './pages/CustomDomainRedirect';

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Custom domain redirect — checks hostname and redirects to /site/{slug} */}
            <Route path="/" element={<CustomDomainRedirect />} />

            {/* Public site routes — outside DataProvider/auth */}
            <Route path="/site/:slug" element={<PublicSiteHome />} />
            <Route path="/site/:slug/veiculo/:id" element={<PublicVehicleDetail />} />

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
              <Route path="website" element={<WebsitePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </HelmetProvider>
  );
};

export default App;
