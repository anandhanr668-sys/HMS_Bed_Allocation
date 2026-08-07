import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { PatientProvider } from './context/PatientContext';
import { FrontDeskProvider } from './context/FrontDeskContext';
import { HospitalLayoutProvider } from './context/HospitalLayoutContext';
import { initializeLCNC } from './services/lcncInit';
import Login from './auth/Login';
import Layout from './components/layout/Layout';

// Dashboards
import AdminDashboard from './dashboards/admin/AdminDashboard';
import DoctorDashboard from './dashboards/doctor/DoctorDashboard';
import NurseDashboard from './dashboards/nurse/NurseDashboard';
import FrontDeskDashboard from './dashboards/frontdesk/FrontDeskDashboard';
import LabDashboard from './dashboards/lab/LabDashboard';
import LabAssignments from './dashboards/lab/LabAssignments';
import SemenAnalysisForm from './dashboards/lab/SemenAnalysisForm';
import FormBuilder from './dashboards/admin/FormBuilder';
import FormsManagement from './dashboards/admin/FormsManagement';
import ProtocolBuilder from './modules/lcnc/ProtocolBuilder';
import StaffManagement from './dashboards/admin/components/StaffManagement';
import AdminLayout from './layouts/AdminLayout';

// Patient Portal
import PatientPortalLogin from './pages/portal/PatientPortalLogin';
import PatientDashboard from './pages/portal/PatientDashboard';

// Hospital Management Components
import { AdminBedConfiguration } from './components/hospital/AdminBedConfiguration';
import { PatientRegistration } from './components/hospital/PatientRegistration';
import { BedManagementDashboard } from './components/hospital/BedManagementDashboard';
import { PatientDashboard as HospitalPatientDashboard } from './components/hospital/PatientDashboard';
import NursePatientManager from './dashboards/nurse/NursePatientManager';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) return <div className="h-screen w-full flex items-center justify-center text-blue-600">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to their allowed dashboard if they try to access unauthorized route
        const rolePaths = {
            'ADMIN': '/admin',
            'DOCTOR': '/doctor',
            'NURSE': '/nurse',
            'FRONT_DESK': '/front-desk',
            'LAB_ASSISTANT': '/lab'
        };
        return <Navigate to={rolePaths[user.role] || '/login'} replace />;
    }
    return children;
};

const RootRedirect = () => {
    const { user, loading } = useAuth();

    console.log("🔴 [HMS_DEBUG] RootRedirect entry Point", {
        loading,
        userExists: !!user,
        role: user?.role,
        userData: user
    });

    if (loading) {
        console.log("🟡 Showing loading screen");
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-600 font-semibold">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        console.log("🟢 No user, redirecting to /login");
        return <Navigate to="/login" replace />;
    }

    const rolePaths = {
        'ADMIN': '/admin',
        'DOCTOR': '/doctor',
        'NURSE': '/nurse',
        'FRONT_DESK': '/front-desk',
        'LAB_ASSISTANT': '/lab'
    };

    const redirectPath = rolePaths[user.role];
    console.log("🟣 User role:", user.role, "redirecting to:", redirectPath);

    // If role is invalid or not found, redirect to login
    if (!redirectPath) {
        console.error("❌ Invalid user role:", user.role, "- redirecting to login");
        return <Navigate to="/login" replace />;
    }

    return <Navigate to={redirectPath} replace />;
};

function App() {
    React.useEffect(() => {
        initializeLCNC();
    }, []);

    return (
        <PatientProvider>
            <FrontDeskProvider>
                <HospitalLayoutProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/" element={<RootRedirect />} />

                        {/* Admin Routes */}
                        <Route path="/admin" element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <AdminLayout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<AdminDashboard />} />
                            <Route path="staff" element={<StaffManagement />} />
                            <Route path="protocols" element={<ProtocolBuilder />} />
                            <Route path="forms" element={<FormsManagement />} />
                            <Route path="forms/designer" element={<FormBuilder />} />
                            <Route path="wards" element={<AdminBedConfiguration />} />
                            <Route path="patient-view" element={<HospitalPatientDashboard />} />
                        </Route>

                        {/* Doctor Routes */}
                        <Route path="/doctor" element={
                            <ProtectedRoute allowedRoles={['DOCTOR']}>
                                <Layout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<DoctorDashboard />} />
                            <Route path="patients" element={<HospitalPatientDashboard />} />
                        </Route>

                        {/* Nurse Routes */}
                        <Route path="/nurse" element={
                            <ProtectedRoute allowedRoles={['NURSE']}>
                                <Layout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<NurseDashboard />} />
                            <Route path="patients" element={<NursePatientManager />} />
                            <Route path="bed-management" element={<BedManagementDashboard />} />
                        </Route>

                        {/* Front Desk Routes */}
                        <Route path="/front-desk" element={
                            <ProtectedRoute allowedRoles={['FRONT_DESK']}>
                                <Layout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<FrontDeskDashboard module="dashboard" />} />
                            <Route path="registration" element={<FrontDeskDashboard module="registration" />} />
                            <Route path="appointments" element={<FrontDeskDashboard module="appointments" />} />
                            <Route path="queue" element={<FrontDeskDashboard module="queue" />} />
                            <Route path="billing" element={<FrontDeskDashboard module="billing" />} />
                            <Route path="logs" element={<FrontDeskDashboard module="logs" />} />
                        </Route>

                        {/* Lab Assistant Routes */}
                        <Route path="/lab" element={
                            <ProtectedRoute allowedRoles={['LAB_ASSISTANT']}>
                                <Layout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<LabDashboard />} />
                            <Route path="assignments" element={<LabAssignments />} />
                            <Route path="process-report/:orderId" element={<SemenAnalysisForm />} />
                        </Route>

                        {/* Patient Portal Routes (Public + Protected) */}
                        <Route path="/portal/login" element={<PatientPortalLogin />} />
                        <Route path="/portal/dashboard" element={<PatientDashboard />} />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </HospitalLayoutProvider>
            </FrontDeskProvider>
        </PatientProvider>
    );
}

export default App;
