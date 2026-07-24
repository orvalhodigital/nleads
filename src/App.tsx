
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import UserLayout from './components/UserLayout';
import { ToastProvider } from './contexts/ToastContext';
import { DataProvider } from './contexts/DataContext';

// ─── Detecção de domínio (avaliado uma única vez no carregamento) ─────────────
const SYSTEM_HOSTS = ['localhost', '127.0.0.1', 'painel.orvalhodigital.com.br', 'orvalhodigital.com.br', 'vercel.app'];
function isSystemHost(h: string) {
  return SYSTEM_HOSTS.some(s => h === s || h.endsWith(`.${s}`));
}
const IS_SYSTEM_DOMAIN = isSystemHost(window.location.hostname);

const RESERVED_SLUGS = new Set([
  'dashboard', 'inventory', 'motorcycles', 'leads', 'agenda',
  'sales-closed', 'sales-flow', 'plans', 'settings', 'support',
  'website', 'estrutura-ecv', 'login', 'nova-conta', 'redefinir-senha',
  'politica-de-privacidade', 'termos-de-uso', 'contrato-saas', 'paineldoadm',
  'site', 'loja', 'preview', 'admin'
]);

const StoreSlugResolver: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  if (!slug || RESERVED_SLUGS.has(slug.toLowerCase())) {
    return <Navigate to="/dashboard" replace />;
  }
  return <PublicSiteHome forcedSlug={slug} />;
};

const StoreVehicleResolver: React.FC = () => {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  if (!slug || RESERVED_SLUGS.has(slug.toLowerCase())) {
    return <Navigate to="/dashboard" replace />;
  }
  return <PublicVehicleDetail forcedSlug={slug} forcedVehicleParam={id} />;
};

// Loading Component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground text-sm font-semibold animate-pulse">Carregando...</p>
    </div>
  </div>
);

// Lazy Loaded Components
const Auth = lazy(() => import('./components/Auth'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AdminApp = lazy(() => import('./admin/AdminApp'));
const HomePage = lazy(() => import('./pages/HomePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const LeadsPage = lazy(() => import('./pages/LeadsPage'));
const MotorcyclesPage = lazy(() => import('./pages/MotorcyclesPage'));
const SalesClosedPage = lazy(() => import('./pages/SalesClosedPage'));
const SalesFlowPage = lazy(() => import('./pages/SalesFlowPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AgendaPage = lazy(() => import('./pages/AgendaPage'));
const VehicleFormPage = lazy(() => import('./pages/VehicleFormPage'));
const LeadFormPage = lazy(() => import('./pages/LeadFormPage'));
const LeadDetailPage = lazy(() => import('./pages/LeadDetailPage'));
const LeadActionPage = lazy(() => import('./pages/LeadActionPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const WebsitePage = lazy(() => import('./pages/WebsitePage'));
const EstruturaECV = lazy(() => import('./components/EstruturaECV'));
const PublicSiteHome = lazy(() => import('./pages/public/PublicSiteHome'));
const PublicVehicleDetail = lazy(() => import('./pages/public/PublicVehicleDetail'));
const CustomDomainRedirect = lazy(() => import('./pages/CustomDomainRedirect'));
const CustomDomainVehicleDetail = lazy(() => import('./pages/CustomDomainVehicleDetail'));
const LegalPrivacyPage = lazy(() => import('./pages/public/LegalPrivacyPage'));
const LegalTermsPage = lazy(() => import('./pages/public/LegalTermsPage'));
const LegalContractPage = lazy(() => import('./pages/public/LegalContractPage'));

import { ThemeProvider } from './contexts/ThemeContext';

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                 {/* Rotas públicas — acessíveis em qualquer domínio */}
                <Route path="/site/:slug" element={<PublicSiteHome />} />
                <Route path="/site/:slug/veiculo/:id" element={<PublicVehicleDetail />} />
                <Route path="/loja/:slug" element={<PublicSiteHome />} />
                <Route path="/loja/:slug/veiculo/:id" element={<PublicVehicleDetail />} />
                <Route path="/preview/:slug" element={<PublicSiteHome />} />
                <Route path="/preview/:slug/veiculo/:id" element={<PublicVehicleDetail />} />
                <Route path="/paineldoadm/*" element={<AdminApp />} />
                <Route path="/politica-de-privacidade" element={<LegalPrivacyPage />} />
                <Route path="/termos-de-uso" element={<LegalTermsPage />} />
                <Route path="/contrato-saas" element={<LegalContractPage />} />

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
                    <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
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
                      <Route path="motorcycles" element={<MotorcyclesPage />} />
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
                      <Route path="support" element={<SupportPage />} />
                      <Route path="website" element={<WebsitePage />} />
                      <Route path="estrutura-ecv" element={<EstruturaECV />} />
                    </Route>
                    {/* Resolvers de slug da loja no painel (/nomedaloja e /nomedaloja/veiculo/:id) */}
                    <Route path="/:slug" element={<StoreSlugResolver />} />
                    <Route path="/:slug/veiculo/:id" element={<StoreVehicleResolver />} />
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
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;
