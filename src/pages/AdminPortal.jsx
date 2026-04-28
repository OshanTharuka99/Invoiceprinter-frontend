import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    Users, ShieldCheck, LayoutDashboard, FileText, Settings,
    TrendingUp, LogOut, Bell, Package, Briefcase, Truck, ShieldAlert, ScrollText, Printer
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
import QuotationManagement from '../components/shared/QuotationManagement';
import InvoiceManagement from '../components/shared/InvoiceManagement';

const AdminPortal = () => {
    const { user, logout } = useAuth();
    const [activeNav, setActiveNav] = useState('users');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.data);
        } catch (err) { console.error('Notification error:', err); }
    };

    useEffect(() => { fetchNotifications(); }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const navItems = [
        { id: 'approvals', label: 'Security Approvals', icon: ShieldAlert },
        { id: 'quotations', label: 'Quotation Engine', icon: ScrollText },
        { id: 'clients', label: 'Client Directory', icon: Users },
        { id: 'projects', label: 'Project Portfolio', icon: Briefcase },
        { id: 'products', label: 'Product Catalog', icon: Package },
        { id: 'suppliers', label: 'Vendor Intranet', icon: Truck },
        { id: 'users', label: 'User Management', icon: ShieldCheck },
        { id: 'business', label: 'General Settings', icon: Settings },
        { id: 'invoices', label: 'Invoice Engine', icon: FileText },
        { id: 'analytics', label: 'System Analytics', icon: TrendingUp },
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
            case 'invoices': return <InvoiceManagement currentUser={user} showToast={showToast} />;
            default: return <div className="admin-empty-module">Module under development...</div>;
        }
    };

    return (
        <div className="admin-container">
            <Toaster position="top-right" reverseOrder={false} />

            {/* SIDEBAR - 20% width */}
            <motion.aside
                animate={{ width: sidebarOpen ? '20%' : '90px' }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="admin-sidebar"
            >
                <div className="admin-sidebar-brand">
                    <div className="admin-sidebar-logo">
                        <Printer size={26} color="#08090a" />
                    </div>
                    {sidebarOpen && (
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
                            onClick={() => setActiveNav(item.id)}
                            className={`admin-nav-item ${activeNav === item.id ? 'admin-nav-item-active' : ''}`}
                        >
                            <item.icon size={20} />
                            {sidebarOpen && <span>{item.label}</span>}
                        </button>
                    ))}
                </nav>

                <div className="admin-sidebar-footer">
                    <div className="admin-sidebar-user">
                        <div className="admin-sidebar-avatar">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                        {sidebarOpen && (
                            <div className="admin-sidebar-user-info">
                                <div className="admin-sidebar-username">{user?.firstName}</div>
                                <div className="admin-sidebar-userrole">{user?.role?.toUpperCase()}</div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.aside>

            {/* MAIN AREA */}
            <div className="admin-main">
                {/* Header - 1/8 height */}
                <header className="admin-header">
                    {/* Left: Page Title */}
                    <div className="admin-header-left">
                        <motion.button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            whileTap={{ scale: 0.9 }}
                            className="admin-sidebar-toggle"
                        >
                            <LayoutDashboard size={18} />
                        </motion.button>
                        <div className="admin-header-title">
                            <div className="admin-header-pagename">
                                {navItems.find(n => n.id === activeNav)?.label}
                            </div>
                            <div className="admin-header-subtitle">Platform Control</div>
                        </div>
                    </div>

                    {/* Right: User → Notification → Sign Out */}
                    <div className="admin-header-right">
                        <div className="admin-user-section">
                            <div className="admin-user-avatar">
                                {user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}
                            </div>
                            <div className="admin-user-details">
                                <div className="admin-user-name">{user?.firstName} {user?.lastName}</div>
                                <div className="admin-user-role">{user?.role?.toUpperCase()}</div>
                            </div>
                        </div>

                        <div className="admin-header-divider" />

                        <div className="admin-notification-wrapper">
                            <button
                                onClick={() => { setShowNotifications(!showNotifications); fetchNotifications(); }}
                                className="admin-notification-btn"
                            >
                                <Bell size={18} />
                                <span>Notifications</span>
                                {unreadCount > 0 && (
                                    <span className="admin-notification-badge">{unreadCount}</span>
                                )}
                            </button>
                            {showNotifications && (
                                <div className="admin-notification-dropdown">
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

                        <div className="admin-header-divider" />

                        <button onClick={handleLogout} className="admin-signout-btn">
                            <LogOut size={16} />
                            <span>Sign Out</span>
                        </button>
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
