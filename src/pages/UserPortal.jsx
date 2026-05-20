import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
    FileText, Plus, LogOut, TrendingUp, Clock, CheckCircle,
    AlertCircle, Download, Send, Printer, Search,
    X, DollarSign, ArrowUpRight, ArrowDownRight, Bell
} from 'lucide-react';
import api from '../api';
import ProductManagement from '../components/admin/ProductManagement';
import UserClientManagement from '../components/user/UserClientManagement';
import UserProjectCatalog from '../components/user/UserProjectCatalog';
import QuotationManagement from '../components/shared/QuotationManagement';
import InvoiceManagement from '../components/shared/InvoiceManagement';
import WarrantyManagement from '../components/admin/WarrantyManagement';
import PurchaseOrderManagement from '../components/shared/PurchaseOrderManagement';
import './UserPortal.css';

const MOCK_INVOICES = [
    { id: 'INV-2024-001', client: 'Acme Corp', amount: 3200.00, date: 'Apr 14, 2024', status: 'paid', due: 'Apr 28, 2024' },
    { id: 'INV-2024-002', client: 'TechNova Ltd', amount: 1850.50, date: 'Apr 12, 2024', status: 'pending', due: 'Apr 26, 2024' },
    { id: 'INV-2024-003', client: 'BlueWave Inc', amount: 5400.00, date: 'Apr 10, 2024', status: 'paid', due: 'Apr 24, 2024' },
    { id: 'INV-2024-004', client: 'Summit Group', amount: 970.00, date: 'Apr 08, 2024', status: 'overdue', due: 'Apr 15, 2024' },
    { id: 'INV-2024-005', client: 'Zenith Partners', amount: 2100.00, date: 'Apr 05, 2024', status: 'paid', due: 'Apr 19, 2024' },
];

const STATUS_CONFIG = {
    paid: { label: 'Paid', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
    pending: { label: 'Pending', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    overdue: { label: 'Overdue', color: '#dc2626', bg: '#fff1f2', border: '#fecdd3' },
};

const UserPortal = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('Dashboard');
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
        showToast(`Goodbye, ${user?.firstName}! Have a great day. 👋`, 'success');
        setTimeout(() => logout(), 1200);
    };
    const [invoices] = useState(MOCK_INVOICES);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [newInvoiceModal, setNewInvoiceModal] = useState(false);

    const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
    const totalPending = invoices.filter(i => i.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0);
    const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);

    const filteredInvoices = invoices.filter(inv => {
        const matchSearch = inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.client.toLowerCase().includes(searchTerm.toLowerCase());
        const matchFilter = filter === 'all' || inv.status === filter;
        return matchSearch && matchFilter;
    });

    const stats = [
        { label: 'Total Billed', value: `$${totalBilled.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: DollarSign, change: '+12% this month', positive: true },
        { label: 'Collected', value: `$${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: CheckCircle, change: `${Math.round((totalPaid / totalBilled) * 100)}% of total`, positive: true },
        { label: 'Awaiting', value: `$${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: Clock, change: '1 invoice pending', positive: null },
        { label: 'Overdue', value: `$${totalOverdue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: AlertCircle, change: '1 overdue', positive: false },
    ];

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
                        {['Dashboard', 'Invoices', 'Quotations', 'Purchase Orders', 'Products', 'Projects', 'Clients', 'Warranty', 'Reports'].map((item, i) => (
                            <button key={i} onClick={() => setActiveTab(item)}
                                className={`user-nav-link ${activeTab === item ? 'active' : ''}`}
                            >{item}</button>
                        ))}
                    </div>
                </div>

                {/* Right side */}
                <div className="user-nav-right">
                    <div className="user-notification-wrapper">
                        <button onClick={() => { setShowNotifications(!showNotifications); fetchNotifications(); }}
                            className="user-notification-btn"
                        >
                            <Bell size={16} /> Notifications
                            {unreadCount > 0 && (
                                <span className="user-notification-badge">{unreadCount}</span>
                            )}
                        </button>
                        {showNotifications && (
                            <div className="user-notification-dropdown">
                                <div className="user-notification-header">
                                    Notifications
                                    {notifications.length > 0 && (
                                        <button className="user-notification-markall" onClick={async () => {
                                            await api.put('/notifications/mark-all-read');
                                            fetchNotifications();
                                        }}>Mark all read</button>
                                    )}
                                </div>
                                {notifications.length === 0 ? (
                                    <div className="user-notification-empty">No notifications</div>
                                ) : (
                                    notifications.slice(0, 10).map(n => (
                                        <div key={n._id} className={`user-notification-item ${n.isRead ? '' : 'unread'}`}
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
                    <div className="user-nav-user-wrapper">
                        <div className="user-nav-user">
                            <div className="user-nav-username">{user?.firstName} {user?.lastName}</div>
                            <div className="user-nav-userrole">{user?.designation || 'User Account'}</div>
                        </div>
                        <div className="user-nav-avatar">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                    </div>
                    <div className="user-nav-divider" />
                    <button onClick={handleLogout}
                        className="user-signout-btn"
                    >
                        <LogOut size={14} /> Sign Out
                    </button>
                </div>
            </nav>

            {/* ── Main Content ─────────────────────────── */}
            <main className="user-main">
                {activeTab === 'Dashboard' ? (
                    <>
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="user-dashboard-header">
                            <div>
                                <h1 className="user-dashboard-title">Dashboard</h1>
                                <p className="user-dashboard-subtitle">
                                    Welcome back, <strong>{user?.firstName}</strong>. Here's your billing overview.
                                </p>
                            </div>
                            <button onClick={() => setNewInvoiceModal(true)} className="user-btn-primary">
                                <Plus size={16} /> New Invoice
                            </button>
                        </motion.div>

                        <div className="user-stats-grid">
                            {stats.map((stat, i) => {
                                const Icon = stat.icon;
                                const changeClass = stat.positive === true ? 'positive' : stat.positive === false ? 'negative' : 'neutral';
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        className="user-stat-card"
                                    >
                                        <div className="user-stat-header">
                                            <span className="user-stat-label">{stat.label}</span>
                                            <div className="user-stat-icon"><Icon size={16} color="#dc2626" /></div>
                                        </div>
                                        <div className="user-stat-value">{stat.value}</div>
                                        <div className={`user-stat-change ${changeClass}`}>
                                            {stat.positive === true && <ArrowUpRight size={12} />}
                                            {stat.positive === false && <ArrowDownRight size={12} />}
                                            {stat.change}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="user-invoice-table-wrapper">
                            <div className="user-invoice-controls">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <h2 className="user-invoice-title">Invoices</h2>
                                    <span className="user-invoice-count">{filteredInvoices.length}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <div className="user-filter-pills">
                                        {['all', 'paid', 'pending', 'overdue'].map(f => (
                                            <button
                                                key={f}
                                                onClick={() => setFilter(f)}
                                                className={`user-filter-pill ${filter === f ? 'active' : ''}`}
                                            >{f}</button>
                                        ))}
                                    </div>
                                    <div className="user-search-wrapper">
                                        <Search size={14} className="user-search-icon" />
                                        <input
                                            type="text"
                                            placeholder="Search invoices..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="user-search-input"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="user-invoice-table-scroll">
                                <table className="user-invoice-table">
                                    <thead>
                                        <tr>
                                            {['Invoice', 'Client', 'Amount', 'Date', 'Due Date', 'Status', ''].map((h, i) => (
                                                <th key={i} style={{ textAlign: i === 6 ? 'right' : 'left' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <AnimatePresence>
                                            {filteredInvoices.map((inv, idx) => {
                                                const sc = STATUS_CONFIG[inv.status];
                                                return (
                                                    <motion.tr
                                                        key={inv.id}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: idx * 0.04 }}
                                                        onClick={() => setSelectedInvoice(inv)}
                                                    >
                                                        <td><span className="user-invoice-id">{inv.id}</span></td>
                                                        <td>
                                                            <div className="user-invoice-client">
                                                                <div className="user-invoice-client-avatar">
                                                                    {inv.client.substring(0, 2).toUpperCase()}
                                                                </div>
                                                                <span className="user-invoice-client-name">{inv.client}</span>
                                                            </div>
                                                        </td>
                                                        <td><span className="user-invoice-amount">${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></td>
                                                        <td><span className="user-invoice-date">{inv.date}</span></td>
                                                        <td><span className={`user-invoice-due ${inv.status === 'overdue' ? 'overdue' : ''}`}>{inv.due}</span></td>
                                                        <td>
                                                            <span className={`user-invoice-status ${inv.status}`}>{sc.label}</span>
                                                        </td>
                                                        <td>
                                                            <div className="user-invoice-actions">
                                                                {[Download, Send].map((Icon, j) => (
                                                                    <button key={j} onClick={e => e.stopPropagation()} className="user-invoice-action-btn">
                                                                        <Icon size={13} />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    </>
                ) : activeTab === 'Products' ? (
                    <ProductManagement currentUser={user} showToast={showToast} />
                ) : activeTab === 'Quotations' ? (
                    <QuotationManagement currentUser={user} showToast={showToast} />
                ) : activeTab === 'Purchase Orders' ? (
                    <PurchaseOrderManagement currentUser={user} showToast={showToast} />
                ) : activeTab === 'Invoices' ? (
                    <InvoiceManagement currentUser={user} showToast={showToast} />
                ) : activeTab === 'Clients' ? (
                    <UserClientManagement showToast={showToast} /> 
                ) : activeTab === 'Projects' ? (
                    <UserProjectCatalog />
                ) : activeTab === 'Warranty' ? (
                    <WarrantyManagement currentUser={user} showToast={showToast} />
                ) : (
                    <div className="user-empty-module">Module {activeTab} is currently under construction.</div>
                )}
            </main>

            {/* ── Invoice Detail Drawer ─────────────── */}
            <AnimatePresence>
                {selectedInvoice && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedInvoice(null)}
                            className="user-drawer-overlay"
                        />
                        <motion.aside
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="user-drawer"
                        >
                            <div className="user-drawer-header">
                                <h2 className="user-drawer-title">{selectedInvoice.id}</h2>
                                <button onClick={() => setSelectedInvoice(null)} className="user-drawer-close-btn">
                                    <X size={16} />
                                </button>
                            </div>
                            {(() => {
                                const sc = STATUS_CONFIG[selectedInvoice.status];
                                return <span className="user-drawer-status" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{sc.label}</span>;
                            })()}
                            <div className="user-drawer-amount-card">
                                <div className="user-drawer-amount-label">Total Amount</div>
                                <div className="user-drawer-amount-value">${selectedInvoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                            </div>
                            {[
                                { label: 'Client', value: selectedInvoice.client },
                                { label: 'Invoice Date', value: selectedInvoice.date },
                                { label: 'Due Date', value: selectedInvoice.due },
                            ].map(({ label, value }) => (
                                <div key={label} className="user-drawer-detail">
                                    <span className="user-drawer-detail-label">{label}</span>
                                    <span className="user-drawer-detail-value">{value}</span>
                                </div>
                            ))}
                            <div className="user-drawer-actions">
                                <button className="user-drawer-btn primary"><Download size={15} /> Download</button>
                                <button className="user-drawer-btn secondary"><Send size={15} /> Send</button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ── New Invoice Modal ─────────────────── */}
            <AnimatePresence>
                {newInvoiceModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={e => { if (e.target === e.currentTarget) setNewInvoiceModal(false); }}
                        className="user-modal-overlay"
                    >
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0, y: 12 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.96, opacity: 0, y: 12 }}
                            className="user-modal"
                        >
                            <div className="user-modal-header">
                                <div>
                                    <h2 className="user-modal-title">Create Invoice</h2>
                                    <p className="user-modal-subtitle">Fill in the invoice details below</p>
                                </div>
                                <button onClick={() => setNewInvoiceModal(false)} className="user-modal-close-btn">
                                    <X size={16} />
                                </button>
                            </div>
                            <form onSubmit={e => { e.preventDefault(); setNewInvoiceModal(false); }} className="user-form">
                                {[
                                    { label: 'Client Name', type: 'text', placeholder: 'e.g. Acme Corporation' },
                                    { label: 'Amount (USD)', type: 'number', placeholder: '0.00' },
                                    { label: 'Due Date', type: 'date', placeholder: '' },
                                    { label: 'Description', type: 'text', placeholder: 'Services rendered...' },
                                ].map(({ label, type, placeholder }) => (
                                    <div key={label}>
                                        <label className="user-form-label">{label}</label>
                                        <input
                                            type={type}
                                            required
                                            placeholder={placeholder}
                                            className="user-form-input"
                                        />
                                    </div>
                                ))}
                                <button type="submit" className="user-modal-submit-btn">Generate Invoice</button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserPortal;
