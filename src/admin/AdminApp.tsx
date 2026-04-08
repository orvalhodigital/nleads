
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import AdminLogin from './AdminLogin';
import AdminLayout from './AdminLayout';
import AdminUsers from './AdminUsers';
import AdminSettings from './AdminSettings';
import AdminNotifications from './AdminNotifications';
import AdminSetup from './AdminSetup';
import AdminUserDetails from './AdminUserDetails';
import AdminPlans from './AdminPlans';
import AdminQuotes from './AdminQuotes';
import AdminOnboarding from './AdminOnboarding';
import AdminTickets from './AdminTickets';
import { DataProvider } from '../contexts/DataContext';
import UserLayout from '../components/UserLayout';
import DashboardPage from '../pages/DashboardPage';
import InventoryPage from '../pages/InventoryPage';
import LeadsPage from '../pages/LeadsPage';
import SalesClosedPage from '../pages/SalesClosedPage';
import PlansPage from '../pages/PlansPage';

function UserAppWrapper() {
    const { userId } = useParams();
    // We need to define the routes for the user app here as well, 
    // because standard UserApp in App.tsx is at root path.
    return (
        <DataProvider impersonatedUserId={userId}>
            <Routes>
                <Route element={<UserLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="inventory" element={<InventoryPage />} />
                    <Route path="leads" element={<LeadsPage />} />
                    <Route path="sales-closed" element={<SalesClosedPage />} />
                    <Route path="plans" element={<PlansPage />} />
                </Route>
            </Routes>
        </DataProvider>
    );
}

export default function AdminApp() {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [systemInitialized, setSystemInitialized] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        // 1. Check if ANY admin exists
        try {
            console.log('AdminApp: Checking for existing admins...');
            const { data: hasAdmins, error } = await supabase.rpc('check_has_admins');

            if (error) {
                console.error('AdminApp: Error calling check_has_admins RPC:', error);
            }

            console.log('AdminApp: check_has_admins result:', hasAdmins);

            // If checking fails entirely (e.g. 404), default to true (assume admins exist) to avoid setup loop
            // Unless we are explicitly sure there are NO admins (hasAdmins === false)
            if (error) {
                console.error('AdminApp: RPC error details:', error);
                // If RPC fails (e.g. missing function), allow setup to proceed
                setSystemInitialized(false);
            } else {
                setSystemInitialized(!!hasAdmins);
            }

            // 2. Check current user status
            const { data: { session } } = await supabase.auth.getSession();
            console.log('AdminApp: Current session:', session ? 'Active' : 'None');

            if (!session?.user) {
                setIsAdmin(false);
            } else {
                const { data, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();

                // If user exists in session but not in DB (profileError), clear session
                if (profileError || !data) {
                    console.warn('AdminApp: Session exists but profile missing. Clearing session cache.');
                    await supabase.auth.signOut();
                    setIsAdmin(false);
                } else {
                    setIsAdmin(data.role === 'admin');
                }
            }
        } catch (e) {
            console.error('Error checking admin status:', e);
            // If check fails, default to FALSE (allow setup).
            // This is better for UX if the DB is empty or RPC is missing.
            // The Setup page will still fail if an admin actually exists (backend constraint).
            setSystemInitialized(false);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center">Carregando sistema...</div>;

    // If system is NOT initialized (no admins), force setup
    // But ONLY if we are not already at the setup page (handled by router matching)
    // Actually, Router logic is better below.

    return (
        <Routes>
            <Route
                path="setup"
                element={
                    systemInitialized === false
                        ? <AdminSetup />
                        : <Navigate to="/paineldoadm/login" replace />
                }
            />

            <Route
                path="login"
                element={
                    systemInitialized === false
                        ? <Navigate to="/paineldoadm/setup" replace />
                        : <AdminLogin />
                }
            />

            <Route
                path="/"
                element={
                    systemInitialized === false
                        ? <Navigate to="/paineldoadm/setup" replace />
                        : (isAdmin ? <AdminLayout /> : <Navigate to="/paineldoadm/login" replace />)
                }
            >
                <Route index element={<AdminUsers />} />
                <Route path="users/:userId" element={<AdminUserDetails />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="quotes" element={<AdminQuotes />} />
                <Route path="plans" element={<AdminPlans />} />
                <Route path="onboarding" element={<AdminOnboarding />} />
                <Route path="tickets" element={<AdminTickets />} />
            </Route>

            <Route
                path="user/:userId/*"
                element={isAdmin ? <UserAppWrapper /> : <Navigate to="/paineldoadm/login" replace />}
            />
        </Routes>
    );
}
