
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import UserLayout from './components/UserLayout';
import { ToastProvider } from './contexts/ToastContext';
import { DataProvider } from './contexts/DataContext';

// Loading Component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 text-sm font-medium animate-pulse">Carregando plataforma...</p>
    </div>
  </div>
);

// Lazy Loaded Components
const AdminApp = lazy(() => import('./admin/AdminApp'));
const HomePage = lazy(() => import('./pages/HomePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const LeadsPage = lazy(() => import('./pages/LeadsPage'));
const SalesClosedPage = lazy(() => import('./pages/SalesClosedPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AgendaPage = lazy(() => import('./pages/AgendaPage'));
const VehicleFormPage = lazy(() => import('./pages/VehicleFormPage'));
const LeadFormPage = lazy(() => import('./pages/LeadFormPage'));
const LeadDetailPage = lazy(() => import('./pages/LeadDetailPage'));
const LeadActionPage = lazy(() => import('./pages/LeadActionPage'));
const MotorcyclesPage = lazy(() => import('./pages/MotorcyclesPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const WebsitePage = lazy(() => import('./pages/WebsitePage'));
const PublicSiteHome = lazy(() => import('./pages/public/PublicSiteHome'));
const PublicVehicleDetail = lazy(() => import('./pages/public/PublicVehicleDetail'));
const CustomDomainRedirect = lazy(() => import('./pages/CustomDomainRedirect'));

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </HelmetProvider>
  );
};

export default App;
