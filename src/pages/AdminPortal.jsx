import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
    Users, ShieldCheck, LayoutDashboard, FileText, Settings, 
    TrendingUp, LogOut, ChevronRight, Activity, Bell, X, Check, AlertCircle, Shield, Crown, Edit3, Filter, Package, Briefcase, Truck, ShieldAlert, ScrollText
} from 'lucide-react';
import api from '../api';
import toast, { Toaster } from 'react-hot-toast';

// MODULAR COMPONENTS
import UserManagement from '../components/admin/UserManagement';
import BusinessSettings from '../components/admin/BusinessSettings';
import ProductManagement from '../components/admin/ProductManagement';
import ClientManagement from '../components/admin/ClientManagement';
import ProjectManagement from '../components/admin/ProjectManagement';
import SupplierManagement from '../components/admin/SupplierManagement';
import ApprovalsDashboard from '../components/admin/ApprovalsDashboard';
import QuotationManagement from '../components/shared/QuotationManagement';

/**
 * ADMIN PORTAL - PREMIUM ENTERPRISE EDITION
 * -----------------------------------------
 * This is the root container for administrative modules.
 * Restored with custom styled toast notifications.
 */
const AdminPortal = () => {
    const { user, logout } = useAuth();
    const [activeNav, setActiveNav] = useState('users');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const navItems = [
        { id: 'approvals', label: 'Security Approvals', icon: ShieldAlert },
        { id: 'quotations', label: 'Quotation Engine', icon: ScrollText },
        { id: 'clients', label: 'Client Directory', icon: Users },
        { id: 'projects', label: 'Project Portfolio', icon: Briefcase },
        { id: 'products', label: 'Product Catalog', icon: Package },
        { id: 'suppliers', label: 'Vendor Intranet', icon: Truck },
        { id: 'users', label: 'User Management', icon: ShieldCheck },
        { id: 'business', label: 'General Settings', icon: Settings },
        { id: 'invoices', label: 'Invoice History', icon: FileText },
        { id: 'analytics', label: 'System Analytics', icon: TrendingUp },
    ];

    // CUSTOM PREMIUM TOAST LOGIC
    const showToast = (message, type = 'success') => {
        toast(message, {
            duration: 4000,
            icon: type === 'success' ? '✅' : '🔴',
            style: {
                background: '#0f172a',
                color: '#f8fafc',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '16px 24px',
                fontSize: '1rem',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: '700',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            },
        });
    };

    const handleLogout = () => {
        showToast(`Security session closed. Goodbye, ${user?.firstName}!`, 'success');
        setTimeout(() => logout(), 1500);
    };

    const renderContent = () => {
        switch (activeNav) {
            case 'users': return <UserManagement currentUser={user} showToast={showToast} />;
            case 'business': return <BusinessSettings currentUser={user} showToast={showToast} />;
            case 'products': return <ProductManagement currentUser={user} showToast={showToast} />;
            case 'approvals': return <ApprovalsDashboard currentUser={user} showToast={showToast} />;
            case 'clients': return <ClientManagement currentUser={user} showToast={showToast} />;
            case 'projects': return <ProjectManagement currentUser={user} showToast={showToast} />;
            case 'suppliers': return <SupplierManagement currentUser={user} showToast={showToast} />;
            case 'quotations': return <QuotationManagement currentUser={user} showToast={showToast} />;
            default: return <div style={{ padding: '2rem', textAlign: 'center' }}>Module under development...</div>;
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontVariantNumeric: 'tabular-nums', fontFamily: "'Outfit', sans-serif" }}>
            <Toaster position="top-right" reverseOrder={false} />

            {/* SIDEBAR PROTOCOL */}
            <motion.aside 
                animate={{ width: sidebarOpen ? 300 : 90 }} 
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }} 
                style={{ background: '#08090a', color: '#fff', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', zIndex: 100, boxShadow: '4px 0 24px rgba(0,0,0,0.1)' }}
            >
                <div style={{ padding: '2.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 44, height: 44, background: '#fff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={24} color="#000" /></div>
                    {sidebarOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><div style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.5px' }}>InvoPrint</div><div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 900, letterSpacing: '1px' }}>CORE PROTOCOL</div></motion.div>}
                </div>

                <nav style={{ padding: '2rem 1rem', flex: 1 }}>
                    {navItems.map((item) => (
                        <button 
                            key={item.id} 
                            onClick={() => setActiveNav(item.id)} 
                            style={{ 
                                width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', 
                                borderRadius: '14px', marginBottom: '0.5rem', border: 'none', cursor: 'pointer', 
                                background: activeNav === item.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                                color: activeNav === item.id ? '#fff' : '#64748b', transition: 'all 0.2s',
                                fontWeight: activeNav === item.id ? 800 : 600
                            }}
                        >
                            <item.icon size={20} />
                            {sidebarOpen && <span style={{ fontSize: '1.05rem' }}>{item.label}</span>}
                        </button>
                    ))}
                </nav>

                <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem' }}>
                        <div style={{ width: 48, height: 48, background: '#fff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#000' }}>{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
                        {sidebarOpen && <div style={{ flex: 1 }}><div style={{ fontSize: '1rem', fontWeight: 800 }}>{user?.firstName}</div><div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800 }}>{user?.role?.toUpperCase()}</div></div>}
                    </div>
                </div>
            </motion.aside>

            {/* MAIN PORTAL AREA */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'auto' }}>
                <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(248, 250, 252, 0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #e2e8f0', padding: '0 3rem', height: 90, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <motion.button onClick={() => setSidebarOpen(!sidebarOpen)} whileTap={{ scale: 0.9 }} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', cursor: 'pointer', color: '#64748b' }}><LayoutDashboard size={18} /></motion.button>
                        <div style={{ pointerEvents: 'none' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.5px' }}>{navItems.find(n => n.id === activeNav)?.label}</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Platform Control</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{user?.firstName} {user?.lastName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 900, letterSpacing: '1px' }}>{user?.role?.toUpperCase()}</div>
                        </div>
                        <div style={{ width: 48, height: 48, background: '#0f172a', color: '#fff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem', letterSpacing: '1px' }}>
                            {user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />
                        <button onClick={handleLogout}
                            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fecdd3'; e.currentTarget.style.background = '#fff1f2'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                        >
                            <LogOut size={14} /> Sign Out
                        </button>
                    </div>
                </header>

                <main style={{ padding: '3.5rem', width: '100%', maxWidth: 1400, margin: '0 auto' }}>
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default AdminPortal;
