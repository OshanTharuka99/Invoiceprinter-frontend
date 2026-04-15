import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Pages
import Login from './pages/Login';
import UserPortal from './pages/UserPortal';
import AdminPortal from './pages/AdminPortal';
import ForcePasswordChange from './pages/ForcePasswordChange';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) return null; // Or a loading spinner

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Check if password change is forced
    if (user.forcePasswordChange && window.location.pathname !== '/force-password-change') {
        return <Navigate to="/force-password-change" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="App">
                    <Toaster position="top-right" />
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        
                        {/* Forced Password Change Route */}
                        <Route path="/force-password-change" element={
                            <ProtectedRoute>
                                <ForcePasswordChange />
                            </ProtectedRoute>
                        } />

                        {/* Admin Routes */}
                        <Route path="/admin/dashboard" element={
                            <ProtectedRoute allowedRoles={['admin', 'root']}>
                                <AdminPortal />
                            </ProtectedRoute>
                        } />

                        {/* Normal User Routes */}
                        <Route path="/dashboard" element={
                            <ProtectedRoute allowedRoles={['user', 'admin', 'root']}>
                                <UserPortal />
                            </ProtectedRoute>
                        } />

                        {/* Redirect / to login if not authenticated, or to dashboard if authenticated */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
