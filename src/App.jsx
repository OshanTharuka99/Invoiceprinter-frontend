import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Printer } from 'lucide-react';

// Pages
import Login from './pages/Login';
import UserPortal from './pages/UserPortal';
import AdminPortal from './pages/AdminPortal';
import ForcePasswordChange from './pages/ForcePasswordChange';

const pageVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.2 } }
};

const SplashScreen = () => (
    <div style={{
        position: 'fixed', inset: 0, background: '#08090a',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, fontFamily: "'Outfit', sans-serif"
    }}>
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}
        >
            <motion.div
                animate={{
                    boxShadow: [
                        '0 0 20px rgba(220,38,38,0.3), 0 0 40px rgba(220,38,38,0.1)',
                        '0 0 40px rgba(220,38,38,0.5), 0 0 80px rgba(220,38,38,0.2)',
                        '0 0 20px rgba(220,38,38,0.3), 0 0 40px rgba(220,38,38,0.1)'
                    ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    width: 72, height: 72, background: '#dc2626', borderRadius: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 20px rgba(220,38,38,0.3)'
                }}
            >
                <Printer size={34} color="#08090a" />
            </motion.div>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>
                    Invo<span style={{ color: '#dc2626', fontStyle: 'italic' }}>Print</span>
                </div>
                <div style={{
                    fontSize: '0.65rem', color: '#64748b', fontWeight: 700, letterSpacing: '2px',
                    textTransform: 'uppercase', marginTop: '0.5rem'
                }}>
                    Loading Portal
                </div>
            </div>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                style={{
                    width: 24, height: 24, border: '3px solid rgba(220,38,38,0.15)',
                    borderTopColor: '#dc2626', borderRadius: '50%'
                }}
            />
        </motion.div>
    </div>
);

const AnimatedRoute = ({ children }) => (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
        {children}
    </motion.div>
);

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) return <SplashScreen />;

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

    return <AnimatedRoute>{children}</AnimatedRoute>;
};

function AppContent() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/login" element={<AnimatedRoute><Login /></AnimatedRoute>} />
                <Route path="/force-password-change" element={
                    <ProtectedRoute><ForcePasswordChange /></ProtectedRoute>
                } />
                <Route path="/admin/dashboard" element={
                    <ProtectedRoute allowedRoles={['admin', 'root']}><AdminPortal /></ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                    <ProtectedRoute allowedRoles={['user', 'admin', 'root']}><UserPortal /></ProtectedRoute>
                } />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="App">
                    <Toaster position="top-right" />
                    <AppContent />
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
