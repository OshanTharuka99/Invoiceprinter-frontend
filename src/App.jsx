import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminPortal from './pages/AdminPortal';
import UserPortal from './pages/UserPortal';

// ─── Loading Spinner ───────────────────────────────────────
const LoadingScreen = () => (
    <div style={{
        minHeight: '100vh', background: '#000', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem'
    }}>
        <div style={{
            width: 40, height: 40, border: '2px solid rgba(255,255,255,0.08)',
            borderTopColor: '#fff', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#3f3f46', fontSize: '0.85rem', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
            Verifying credentials...
        </p>
    </div>
);

// ─── Protected Route ───────────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) return <LoadingScreen />;

    if (!user) return <Navigate to="/login" replace />;

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to the correct portal based on role
        return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
    }

    return children;
};

// ─── App ───────────────────────────────────────────────────
const App = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public */}
                    <Route path="/login" element={<Login />} />

                    {/* Admin Routes — /admin/* */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <Navigate to="/admin/dashboard" replace />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <AdminPortal />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/users"
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <AdminPortal />
                            </ProtectedRoute>
                        }
                    />

                    {/* User Routes — /dashboard/* */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={['user']}>
                                <UserPortal />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/dashboard/invoices"
                        element={
                            <ProtectedRoute allowedRoles={['user']}>
                                <UserPortal />
                            </ProtectedRoute>
                        }
                    />

                    {/* Fallback: redirect root to login */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;
