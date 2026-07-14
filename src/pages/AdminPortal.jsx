import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    Users, ShieldCheck, LayoutDashboard, FileText, Settings,
    TrendingUp, LogOut, Bell, Package, Briefcase, Truck, ShieldAlert, ScrollText, Printer, Shield, X,     Undo2, RotateCcw, Menu, Wrench
} from 'lucide-react';
import api from '../api';
import { toast, Toaster } from 'react-hot-toast';
import './AdminPortal.css';

import UserManagement from '../components/admin/UserManagement';
import BusinessSettings from '../components/admin/BusinessSettings';
import ProductManagement from '../components/admin/ProductManagement';
import ClientManagement from '../components/admin/ClientManagement';
import ProjectManagement from '../components/admin/ProjectManagement';
import SupplierManagement from '../components/admin/SupplierManagement';
import ApprovalsDashboard from '../components/admin/ApprovalsDashboard';
import AdminDashboard from '../components/admin/AdminDashboard';
import QuotationManagement from '../components/shared/QuotationManagement';
import InvoiceManagement from '../components/shared/InvoiceManagement';
import WarrantyManagement from '../components/admin/WarrantyManagement';
import PurchaseOrderManagement from '../components/shared/PurchaseOrderManagement';
import DeliveryNoteManagement from '../components/shared/DeliveryNoteManagement';
import SalesReturnManagement from '../components/shared/SalesReturnManagement';
import GoodsReturnManagement from '../components/shared/GoodsReturnManagement';
import RmaManagement from '../components/shared/RmaManagement';
import UserSettings from '../components/shared/UserSettings';



const AdminPortal = () => {
    const { user, logout, updateUser } = useAuth();
    const [activeNav, setActiveNav] = useState('analytics');
    const [businessSubTab, setBusinessSubTab] = useState('settings');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [isNarrow, setIsNarrow] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 1024);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);


    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.data);
        } catch (err) { console.error('Notification error:', err); }
    };

    useEffect(() => { fetchNotifications(); }, []);

    useEffect(() => {
        const onResize = () => {
            const narrow = window.innerWidth <= 1024;
            setIsNarrow(narrow);
            if (!narrow) setMobileNavOpen(false);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const selectNav = (id) => {
        setActiveNav(id);
        setMobileNavOpen(false);
    };

    const toggleSidebar = () => {
        if (isNarrow) {
            setMobileNavOpen((v) => !v);
        } else {
            setSidebarOpen((v) => !v);
        }
    };

    const navItems = [
        { id: 'analytics', label: 'Dashboard', icon: TrendingUp },
        { id: 'approvals', label: 'Security Approvals', icon: ShieldAlert },
        { id: 'quotations', label: 'Quotation Engine', icon: ScrollText },
        { id: 'clients', label: 'Client Directory', icon: Users },
        { id: 'projects', label: 'Project Portfolio', icon: Briefcase },
        { id: 'products', label: 'Product Catalog', icon: Package },
        { id: 'suppliers', label: 'Vendor Intranet', icon: Truck },
        { id: 'users', label: 'User Management', icon: ShieldCheck },
        { id: 'business', label: 'General Settings', icon: Settings },
        { id: 'invoices', label: 'Invoice Engine', icon: FileText },
        { id: 'warranty', label: 'Warranty Management', icon: ShieldCheck },
        { id: 'purchase_orders', label: 'Purchase Orders', icon: ScrollText },
        { id: 'delivery_notes', label: 'Delivery Notes', icon: Truck },
        { id: 'sales_returns', label: 'Sales Return Notes', icon: Undo2 },
        { id: 'goods_returns', label: 'Goods Return Notes', icon: RotateCcw },
        { id: 'rma', label: 'RMA Process', icon: Wrench },
    ];


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
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        setShowLogoutConfirm(false);
        showToast(`Security session closed. Goodbye, ${user?.firstName}!`, 'success');
        setTimeout(() => logout(), 1500);
    };

    const cancelLogout = () => {
        setShowLogoutConfirm(false);
    };

    const renderContent = () => {
        switch (activeNav) {
            case 'users': return <UserManagement currentUser={user} showToast={showToast} />;
            case 'business': return (
                <div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', padding: '0.25rem', background: '#f1f5f9', borderRadius: '12px', width: 'fit-content' }}>
                        <button
                            onClick={() => setBusinessSubTab('settings')}
                            style={{
                                padding: '0.5rem 1.25rem', borderRadius: '10px', border: 'none',
                                fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                                background: businessSubTab === 'settings' ? '#fff' : 'transparent',
                                color: businessSubTab === 'settings' ? '#0f172a' : '#64748b',
                                boxShadow: businessSubTab === 'settings' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >Business Settings</button>
                        <button
                            onClick={() => setBusinessSubTab('profile')}
                            style={{
                                padding: '0.5rem 1.25rem', borderRadius: '10px', border: 'none',
                                fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                                background: businessSubTab === 'profile' ? '#fff' : 'transparent',
                                color: businessSubTab === 'profile' ? '#0f172a' : '#64748b',
                                boxShadow: businessSubTab === 'profile' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >My Profile</button>
                    </div>
                    {businessSubTab === 'settings'
                        ? <BusinessSettings currentUser={user} showToast={showToast} />
                        : <UserSettings currentUser={user} showToast={showToast} onUserUpdate={updateUser} />
                    }
                </div>
            );
            case 'products': return <ProductManagement currentUser={user} showToast={showToast} />;
            case 'approvals': return <ApprovalsDashboard currentUser={user} showToast={showToast} />;
            case 'clients': return <ClientManagement currentUser={user} showToast={showToast} />;
            case 'projects': return <ProjectManagement currentUser={user} showToast={showToast} />;
            case 'suppliers': return <SupplierManagement currentUser={user} showToast={showToast} />;
            case 'quotations': return <QuotationManagement currentUser={user} showToast={showToast} />;
            case 'invoices': return <InvoiceManagement currentUser={user} showToast={showToast} />;
            case 'warranty': return <WarrantyManagement currentUser={user} showToast={showToast} />;
            case 'purchase_orders': return <PurchaseOrderManagement currentUser={user} showToast={showToast} />;
            case 'delivery_notes': return <DeliveryNoteManagement currentUser={user} showToast={showToast} />;
            case 'sales_returns': return <SalesReturnManagement currentUser={user} showToast={showToast} />;
            case 'goods_returns': return <GoodsReturnManagement currentUser={user} showToast={showToast} />;
            case 'rma': return <RmaManagement currentUser={user} showToast={showToast} />;
            case 'analytics': return <AdminDashboard currentUser={user} />;
            default: return <div className="admin-empty-module">Module under development...</div>;
        }
    };


    return (
        <div className="admin-container">
            <Toaster position="top-right" reverseOrder={false} />

            {mobileNavOpen && (
                <button
                    type="button"
                    className="admin-sidebar-backdrop"
                    aria-label="Close menu"
                    onClick={() => setMobileNavOpen(false)}
                />
            )}

            <aside
                className={[
                    'admin-sidebar',
                    sidebarOpen ? 'admin-sidebar--expanded' : 'admin-sidebar--collapsed',
                    mobileNavOpen ? 'admin-sidebar--mobile-open' : '',
                ].filter(Boolean).join(' ')}
            >
                <div className="admin-sidebar-brand">
                    <div className="admin-sidebar-logo">
                        <Printer size={26} color="#08090a" />
                    </div>
                    {(sidebarOpen || isNarrow) && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-fade-in">
                            <div className="admin-sidebar-title">Invo<span style={{ color: '#dc2626', fontStyle: 'italic' }}>Print</span></div>
                            <div className="admin-sidebar-subtitle">CORE PROTOCOL</div>
                        </motion.div>
                    )}
                </div>

                <nav className="admin-sidebar-nav">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => selectNav(item.id)}
                            className={`admin-nav-item ${activeNav === item.id ? 'active' : ''}`}
                        >
                            <item.icon size={20} />
                            {(sidebarOpen || isNarrow) && <span>{item.label}</span>}
                        </button>
                    ))}
                </nav>

                <div className="admin-sidebar-footer">
                    <div className="admin-sidebar-user">
                        <div className="admin-sidebar-avatar">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                        {(sidebarOpen || isNarrow) && (
                            <div className="admin-sidebar-user-info">
                                <div className="admin-sidebar-username">{user?.firstName}</div>
                                <div className="admin-sidebar-userrole">{user?.role?.toUpperCase()}</div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* MAIN AREA */}
            <div className="admin-main">
                {/* Header */}
                <header className="admin-header">
                    {/* Left: Page Title */}
                    <div className="admin-header-left">
                        <motion.button
                            type="button"
                            onClick={toggleSidebar}
                            whileTap={{ scale: 0.9 }}
                            className="admin-sidebar-toggle"
                            aria-label="Toggle navigation"
                        >
                            {isNarrow ? (mobileNavOpen ? <X size={18} /> : <Menu size={18} />) : <LayoutDashboard size={18} />}
                        </motion.button>
                        <div className="admin-header-title">
                            <div className="admin-header-pagename">
                                {navItems.find(n => n.id === activeNav)?.label}
                            </div>
                            <div className="admin-header-subtitle">Platform Control</div>
                        </div>
                    </div>

                    {/* Right: User Profile → Notification → Sign Out */}
                    <div className="admin-header-right">
                        <div className="admin-user-section">
                            <div className="admin-user-avatar" style={user?.profilePicture ? { padding: 0, overflow: 'hidden' } : {}}>
                                {user?.profilePicture
                                    ? <img src={user.profilePicture} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <>{user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}</>
                                }
                            </div>
                            <div className="admin-user-details">
                                <div className="admin-user-name">{user?.firstName} {user?.lastName}</div>
                                <div className="admin-user-role">{user?.role?.toUpperCase()}</div>
                            </div>
                        </div>


                        <div className="admin-notification-wrapper">
                            <button
                                onClick={() => { setShowNotifications(!showNotifications); fetchNotifications(); }}
                                className="admin-header-btn"
                                title="Notifications"
                            >
                                <Bell size={16} />
                                {unreadCount > 0 && (
                                    <span className="admin-notification-badge">{unreadCount}</span>
                                )}
                            </button>
                            {showNotifications && (
                                <div className="admin-notification-dropdown">
                                    <button
                                        onClick={() => setShowNotifications(false)}
                                        className="admin-notification-close"
                                        title="Close"
                                    >
                                        <X size={14} />
                                    </button>
                                    <div className="admin-notification-header">
                                        <span>Notifications</span>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={async () => {
                                                    await api.put('/notifications/read-all');
                                                    fetchNotifications();
                                                }}
                                                className="admin-notification-markall"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    {notifications.length === 0 ? (
                                        <div className="admin-notification-empty">No notifications</div>
                                    ) : (
                                        notifications.slice(0, 10).map(n => (
                                            <div
                                                key={n._id}
                                                className={`admin-notification-item ${!n.isRead ? 'admin-notification-item-unread' : ''}`}
                                                onClick={async () => {
                                                    if (!n.isRead) {
                                                        await api.put(`/notifications/${n._id}/read`);
                                                        fetchNotifications();
                                                        setActiveNav('approvals');
                                                    }
                                                }}
                                            >
                                                <div className="admin-notification-item-title">{n.title}</div>
                                                <div className="admin-notification-item-message">{n.message}</div>
                                                <div className="admin-notification-item-time">
                                                    {new Date(n.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="admin-signout-wrapper">
                            <button onClick={handleLogout} className="admin-signout-btn" title="Sign Out">
                                <LogOut size={16} />
                            </button>
                            {showLogoutConfirm && (
                                <div className="admin-logout-confirm">
                                    <div className="admin-logout-confirm-icon">
                                        <LogOut size={20} />
                                    </div>
                                    <div className="admin-logout-confirm-title">Confirm Sign Out</div>
                                    <div className="admin-logout-confirm-msg">
                                        Are you sure you want to end your current session?
                                    </div>
                                    <div className="admin-logout-confirm-actions">
                                        <button onClick={cancelLogout} className="admin-logout-cancel">Cancel</button>
                                        <button onClick={confirmLogout} className="admin-logout-proceed">Sign Out</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="admin-content">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default AdminPortal;
