
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import UserLayout from './components/UserLayout';
import { ToastProvider } from './contexts/ToastContext';
import { DataProvider } from './contexts/DataContext';

// ─── Detecção de domínio (avaliado uma única vez no carregamento) ─────────────
const SYSTEM_HOSTS = ['localhost', '127.0.0.1', 'painel.orvalhodigital.com.br', 'orvalhodigital.com.br', 'veiculos.otimizza.com.br', 'otimizza.com.br', 'nleads.pro', 'nleads.com.br', 'otimizza.pro', 'otimizzacrm.pro', 'otimizzacrm.com.br', 'vercel.app'];
function isSystemHost(h: string) {
  return SYSTEM_HOSTS.some(s => h === s || h.endsWith(`.${s}`));
}
const IS_SYSTEM_DOMAIN = isSystemHost(window.location.hostname);

// Loading Component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 text-sm font-medium animate-pulse">Carregando...</p>
    </div>
  </div>
);

// Lazy Loaded Components
const Auth = lazy(() => import('./components/Auth'));
const AdminApp = lazy(() => import('./admin/AdminApp'));
const HomePage = lazy(() => import('./pages/HomePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const LeadsPage = lazy(() => import('./pages/LeadsPage'));
const SalesClosedPage = lazy(() => import('./pages/SalesClosedPage'));
const SalesFlowPage = lazy(() => import('./pages/SalesFlowPage'));
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
const CustomDomainVehicleDetail = lazy(() => import('./pages/CustomDomainVehicleDetail'));

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Rotas públicas — acessíveis em qualquer domínio */}
              <Route path="/site/:slug" element={<PublicSiteHome />} />
              <Route path="/site/:slug/veiculo/:id" element={<PublicVehicleDetail />} />
              <Route path="/paineldoadm/*" element={<AdminApp />} />

              {IS_SYSTEM_DOMAIN ? (
                <>
                  {/* Domínio do sistema: vai direto pro painel */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/login" element={
                    <DataProvider>
                      <Auth mode="login" />
                    </DataProvider>
                  } />
                  <Route path="/nova-conta" element={
                    <DataProvider>
                      <Auth mode="signup" />
                    </DataProvider>
                  } />
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
                    <Route path="sales-flow" element={<SalesFlowPage />} />
                    <Route path="plans" element={<Navigate to="/settings" replace />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="motorcycles" element={<MotorcyclesPage />} />
                    <Route path="support" element={<SupportPage />} />
                    <Route path="website" element={<WebsitePage />} />
                  </Route>
                </>
              ) : (
                <>
                  {/* Domínio personalizado do cliente: mostra o site público */}
                  <Route path="/" element={<CustomDomainRedirect />} />
                  <Route path="/veiculo/:vehicleParam" element={<CustomDomainVehicleDetail />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </>
              )}
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </HelmetProvider>
  );
};

export default App;
