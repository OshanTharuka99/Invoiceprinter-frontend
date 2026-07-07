import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { LogOut, Printer, Bell, LayoutDashboard, FileText, ClipboardList, Package, Briefcase, Users, Shield, Settings, LogIn, Truck, Undo2 } from 'lucide-react';
import api from '../api';
import UserDashboard from '../components/user/UserDashboard';
import ProductManagement from '../components/admin/ProductManagement';
import UserClientManagement from '../components/user/UserClientManagement';
import UserProjectCatalog from '../components/user/UserProjectCatalog';
import QuotationManagement from '../components/shared/QuotationManagement';
import InvoiceManagement from '../components/shared/InvoiceManagement';
import WarrantyManagement from '../components/admin/WarrantyManagement';
import PurchaseOrderManagement from '../components/shared/PurchaseOrderManagement';
import DeliveryNoteManagement from '../components/shared/DeliveryNoteManagement';
import SalesReturnManagement from '../components/shared/SalesReturnManagement';
import UserSettings from '../components/shared/UserSettings';

import './UserPortal.css';

const NAV_ITEMS = [
    { key: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'Invoices', label: 'Invoices', icon: FileText },
    { key: 'Quotations', label: 'Quotations', icon: ClipboardList },
    { key: 'Purchase Orders', label: 'Purchase Orders', icon: Package, adminOnly: true },
    { key: 'Delivery Notes', label: 'Delivery Notes', icon: Truck, adminOnly: true },
    { key: 'Sales Returns', label: 'Sales Return Notes', icon: Undo2, adminOnly: true },
    { key: 'Products', label: 'Products', icon: Package },
    { key: 'Projects', label: 'Projects', icon: Briefcase },
    { key: 'Clients', label: 'Clients', icon: Users },
    { key: 'Warranty', label: 'Warranty', icon: Shield },
    { key: 'Settings', label: 'Settings', icon: Settings },
];

const UserPortal = () => {
    const { user, logout, updateUser } = useAuth();

    const [activeTab, setActiveTab] = useState('Dashboard');
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const isAdminOrRoot = user?.role === 'admin' || user?.role === 'root';
    useEffect(() => {
        if ((activeTab === 'Purchase Orders' || activeTab === 'Delivery Notes' || activeTab === 'Sales Returns') && !isAdminOrRoot) setActiveTab('Dashboard');
    }, [activeTab, isAdminOrRoot]);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.data);
        } catch (err) { console.error('Notification error:', err); }
    };

    useEffect(() => { fetchNotifications(); }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const visibleNavItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdminOrRoot);

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
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            },
        });
    };

    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        setShowLogoutConfirm(false);
        showToast(`Goodbye, ${user?.firstName}! Have a great day. 👋`, 'success');
        setTimeout(() => logout(), 1200);
    };

    const cancelLogout = () => {
        setShowLogoutConfirm(false);
    };

    return (
        <div className="user-container">

            {/* ── Navigation Bar ──────────────────────── */}
            <nav className="user-nav">
                {/* Logo + Nav links */}
                <div className="user-nav-brand">
                    <div className="user-nav-logo">
                        <div className="user-nav-logo-icon">
                            <Printer size={19} color="#fff" />
                        </div>
                        <span className="user-nav-logo-text">
                            Invo<span className="user-nav-logo-text-highlight">Print</span>
                        </span>
                    </div>
                    <div className="user-nav-links">
                        {visibleNavItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button key={item.key} onClick={() => setActiveTab(item.key)}
                                    className={`user-nav-link ${activeTab === item.key ? 'active' : ''}`}
                                >
                                    <Icon size={15} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>

                </div>

                {/* Right side */}
                <div className="user-nav-right">
                    <div className="user-nav-user-section" onClick={() => setActiveTab('Settings')} title="My Profile Settings">
                        <div className="user-nav-avatar" style={user?.profilePicture ? { padding: 0, overflow: 'hidden' } : {}}>
                            {user?.profilePicture
                                ? <img src={user.profilePicture} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <>{user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}</>
                            }
                        </div>
                        <div className="user-nav-user-details">
                            <div className="user-nav-user-name">{user?.firstName} {user?.lastName}</div>
                            <div className="user-nav-user-role">{user?.role?.toUpperCase()}</div>
                        </div>
                    </div>

                    <div className="user-nav-notification-wrapper">
                        <button onClick={() => { setShowNotifications(!showNotifications); fetchNotifications(); }}
                            className="user-nav-header-btn" title="Notifications"
                        >
                            <Bell size={16} />
                            {unreadCount > 0 && <span className="user-nav-notification-badge">{unreadCount}</span>}
                        </button>
                        {showNotifications && (
                            <div className="user-notification-dropdown">
                                <button onClick={() => setShowNotifications(false)} className="user-notification-close" title="Close">
                                    <LogIn size={14} />
                                </button>
                                <div className="user-notification-header">
                                    <span>Notifications</span>
                                    {unreadCount > 0 && (
                                        <button className="user-notification-markall" onClick={async () => {
                                            await api.put('/notifications/read-all');
                                            fetchNotifications();
                                        }}>Mark all read</button>
                                    )}
                                </div>
                                {notifications.length === 0 ? (
                                    <div className="user-notification-empty">No notifications</div>
                                ) : (
                                    notifications.slice(0, 10).map(n => (
                                        <div key={n._id} className={`user-notification-item ${!n.isRead ? 'user-notification-item-unread' : ''}`}
                                            onClick={async () => { if (!n.isRead) { await api.put(`/notifications/${n._id}/read`); fetchNotifications(); } }}>
                                            <div className="user-notification-item-title">{n.title}</div>
                                            <div className="user-notification-item-message">{n.message}</div>
                                            <div className="user-notification-item-time">{new Date(n.createdAt).toLocaleString()}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <button onClick={handleLogout} className="user-nav-signout-btn" title="Sign Out">
                        <LogOut size={16} />
                    </button>
                </div>
            </nav>

            {/* ── Main Content ─────────────────────────── */}
            <main className="user-main">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'Dashboard' ? (
                            <UserDashboard currentUser={user} showToast={showToast} />
                        ) : activeTab === 'Products' ? (
                            <ProductManagement currentUser={user} showToast={showToast} />
                        ) : activeTab === 'Quotations' ? (
                            <QuotationManagement currentUser={user} showToast={showToast} />
                        ) : activeTab === 'Purchase Orders' ? (
                            <PurchaseOrderManagement currentUser={user} showToast={showToast} />
                        ) : activeTab === 'Delivery Notes' ? (
                            <DeliveryNoteManagement currentUser={user} showToast={showToast} />
                        ) : activeTab === 'Sales Returns' ? (
                            <SalesReturnManagement currentUser={user} showToast={showToast} />
                        ) : activeTab === 'Invoices' ? (
                            <InvoiceManagement currentUser={user} showToast={showToast} />
                        ) : activeTab === 'Clients' ? (
                            <UserClientManagement showToast={showToast} />
                        ) : activeTab === 'Projects' ? (
                            <UserProjectCatalog />
                        ) : activeTab === 'Warranty' ? (
                            <WarrantyManagement currentUser={user} showToast={showToast} />
                        ) : activeTab === 'Settings' ? (
                            <UserSettings currentUser={user} showToast={showToast} onUserUpdate={updateUser} />
                        ) : (
                            <div className="user-empty-module">Module {activeTab} is currently under construction.</div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* ── Logout Confirmation Modal ─────────────── */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={cancelLogout}
                        className="user-modal-overlay"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 12 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 12 }}
                            className="user-modal"
                            onClick={e => e.stopPropagation()}
                            style={{ maxWidth: '380px' }}
                        >
                            <div className="user-modal-header">
                                <div>
                                    <h2 className="user-modal-title">Sign Out</h2>
                                    <p className="user-modal-subtitle">Are you sure you want to end your session?</p>
                                </div>
                                <button onClick={cancelLogout} className="user-modal-close-btn"><LogIn size={16} /></button>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button onClick={confirmLogout} className="user-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                                    <LogOut size={15} /> Sign Out
                                </button>
                                <button onClick={cancelLogout} style={{
                                    flex: 1, padding: '0.7rem 1.5rem', borderRadius: '12px',
                                    border: '1.5px solid #e2e8f0', background: '#fff', color: '#334155',
                                    fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: "'Outfit', sans-serif"
                                }}>Cancel</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default UserPortal;
