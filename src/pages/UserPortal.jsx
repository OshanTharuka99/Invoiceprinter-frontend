import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
    FileText, Plus, LogOut, TrendingUp, Clock, CheckCircle,
    AlertCircle, Download, Send, Printer, Search,
    X, DollarSign, ArrowUpRight, ArrowDownRight, Bell
} from 'lucide-react';
import api from '../api';
import UserProductCatalog from '../components/user/UserProductCatalog';
import UserClientManagement from '../components/user/UserClientManagement';
import UserProjectCatalog from '../components/user/UserProjectCatalog';
import QuotationManagement from '../components/shared/QuotationManagement';

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

    const inputStyle = {
        width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0',
        borderRadius: '10px', padding: '0.7rem 1rem', color: '#0f172a', outline: 'none',
        fontSize: '0.875rem', fontFamily: "'Outfit', sans-serif",
        transition: 'all 0.2s ease', boxSizing: 'border-box', colorScheme: 'light'
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f1f5f9', color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>

            {/* ── Navigation Bar ──────────────────────── */}
            <nav style={{
                position: 'sticky', top: 0, zIndex: 50,
                background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)',
                borderBottom: '1px solid #e2e8f0',
                padding: '0 2rem', height: 64,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
                {/* Logo + Nav links */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 36, height: 36, background: '#0f172a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Printer size={19} color="#fff" />
                        </div>
                        <span style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a' }}>
                            Invo<span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Print</span>
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {['Dashboard', 'Invoices', 'Quotations', 'Products', 'Projects', 'Clients', 'Reports'].map((item, i) => (
                            <button key={i} onClick={() => setActiveTab(item)} style={{
                                background: activeTab === item ? '#f1f5f9' : 'transparent',
                                border: 'none', cursor: 'pointer',
                                color: activeTab === item ? '#0f172a' : '#94a3b8',
                                padding: '0.4rem 0.875rem', borderRadius: '8px',
                                fontFamily: "'Outfit', sans-serif", fontSize: '0.875rem',
                                fontWeight: activeTab === item ? 600 : 400, transition: 'all 0.2s'
                            }}
                                onMouseEnter={e => { if (activeTab !== item) { e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.background = '#f1f5f9'; } }}
                                onMouseLeave={e => { if (activeTab !== item) { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; } }}
                            >{item}</button>
                        ))}
                    </div>
                </div>

                {/* Right side */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <button onClick={() => { setShowNotifications(!showNotifications); fetchNotifications(); }}
                            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s', position: 'relative' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.borderColor = '#0f172a'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                        >
                            <Bell size={16} /> Notifications
                            {unreadCount > 0 && (
                                <span style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>
                            )}
                        </button>
                        {showNotifications && (
                            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 320, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.15)', zIndex: 100, maxHeight: 400, overflowY: 'auto' }}>
                                <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>Notifications</div>
                                {notifications.length === 0 ? (
                                    <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No notifications</div>
                                ) : (
                                    notifications.slice(0, 10).map(n => (
                                        <div key={n._id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', background: n.isRead ? '#fff' : '#f0f9ff', cursor: 'pointer' }}
                                            onClick={async () => { if (!n.isRead) { await api.put(`/notifications/${n._id}/read`); fetchNotifications(); } }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#0f172a' }}>{n.title}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{n.message}</div>
                                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 4 }}>{new Date(n.createdAt).toLocaleString()}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{user?.firstName} {user?.lastName}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{user?.designation || 'User Account'}</div>
                    </div>
                    <div style={{ width: 36, height: 36, background: '#0f172a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />
                    <button onClick={logout}
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fecdd3'; e.currentTarget.style.background = '#fff1f2'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                    >
                        <LogOut size={14} /> Sign Out
                    </button>
                </div>
            </nav>

            {/* ── Main Content ─────────────────────────── */}
            <main style={{ maxWidth: 1280, margin: '0 auto', padding: '2.5rem 2rem' }}>
                {activeTab === 'Dashboard' ? (
                    <>
                {/* Page Header */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a' }}>Dashboard</h1>
                        <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                            Welcome back, <strong style={{ color: '#0f172a' }}>{user?.firstName}</strong>. Here's your billing overview.
                        </p>
                    </div>
                    <button onClick={() => setNewInvoiceModal(true)}
                        style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.7rem 1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(15,23,42,0.2)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.25)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.2)'; }}
                    >
                        <Plus size={16} /> New Invoice
                    </button>
                </motion.div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {stats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'all 0.2s ease', cursor: 'default' }}
                                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none'; }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</span>
                                    <div style={{ width: 34, height: 34, background: '#f1f5f9', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Icon size={16} color="#64748b" />
                                    </div>
                                </div>
                                <div style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', marginBottom: '0.4rem' }}>{stat.value}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.76rem', color: stat.positive === true ? '#059669' : stat.positive === false ? '#dc2626' : '#94a3b8', fontWeight: 500 }}>
                                    {stat.positive === true && <ArrowUpRight size={12} />}
                                    {stat.positive === false && <ArrowDownRight size={12} />}
                                    {stat.change}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Invoice Table */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

                    {/* Controls */}
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>Invoices</h2>
                            <span style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2px 8px', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{filteredInvoices.length}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {/* Filter pills */}
                            <div style={{ display: 'flex', gap: '0.25rem', background: '#f1f5f9', borderRadius: '10px', padding: '3px' }}>
                                {['all', 'paid', 'pending', 'overdue'].map(f => (
                                    <button key={f} onClick={() => setFilter(f)}
                                        style={{ background: filter === f ? '#fff' : 'transparent', border: filter === f ? '1px solid #e2e8f0' : '1px solid transparent', cursor: 'pointer', color: filter === f ? '#0f172a' : '#94a3b8', padding: '0.3rem 0.75rem', borderRadius: '7px', fontFamily: "'Outfit', sans-serif", fontSize: '0.78rem', fontWeight: filter === f ? 700 : 400, textTransform: 'capitalize', transition: 'all 0.2s', boxShadow: filter === f ? '0 1px 2px rgba(0,0,0,0.06)' : 'none' }}>
                                        {f}
                                    </button>
                                ))}
                            </div>
                            {/* Search */}
                            <div style={{ position: 'relative' }}>
                                <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input type="text" placeholder="Search invoices..." value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '9px', padding: '0.45rem 0.875rem 0.45rem 2.25rem', color: '#0f172a', outline: 'none', fontSize: '0.82rem', width: 200, fontFamily: "'Outfit', sans-serif", transition: 'border-color 0.2s' }}
                                    onFocus={e => e.target.style.borderColor = '#0f172a'}
                                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                                    {['Invoice', 'Client', 'Amount', 'Date', 'Due Date', 'Status', ''].map((h, i) => (
                                        <th key={i} style={{ padding: '0.75rem 1.25rem', textAlign: i === 6 ? 'right' : 'left', color: '#94a3b8', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {filteredInvoices.map((inv, idx) => {
                                        const sc = STATUS_CONFIG[inv.status];
                                        return (
                                            <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.04 }}
                                                style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s', cursor: 'pointer' }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                onClick={() => setSelectedInvoice(inv)}
                                            >
                                                <td style={{ padding: '0.875rem 1.25rem', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>{inv.id}</td>
                                                <td style={{ padding: '0.875rem 1.25rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{ width: 32, height: 32, background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>
                                                            {inv.client.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{inv.client}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.875rem 1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                                <td style={{ padding: '0.875rem 1.25rem', color: '#94a3b8', fontSize: '0.82rem' }}>{inv.date}</td>
                                                <td style={{ padding: '0.875rem 1.25rem', color: inv.status === 'overdue' ? '#dc2626' : '#94a3b8', fontSize: '0.82rem', fontWeight: inv.status === 'overdue' ? 600 : 400 }}>{inv.due}</td>
                                                <td style={{ padding: '0.875rem 1.25rem' }}>
                                                    <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                                                        {sc.label}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.375rem' }}>
                                                        {[Download, Send].map((Icon, j) => (
                                                            <button key={j} onClick={e => e.stopPropagation()}
                                                                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '7px', padding: '5px 7px', cursor: 'pointer', color: '#64748b', display: 'flex', transition: 'all 0.2s' }}
                                                                onMouseEnter={e => { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#0f172a'; }}
                                                                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                                            ><Icon size={13} /></button>
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
                    <UserProductCatalog />
                ) : activeTab === 'Quotations' ? (
                    <QuotationManagement currentUser={user} showToast={showToast} />
                ) : activeTab === 'Clients' ? (
                    <UserClientManagement showToast={showToast} /> 
                ) : activeTab === 'Projects' ? (
                    <UserProjectCatalog />
                ) : (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Module {activeTab} is currently under construction.</div>
                )}
            </main>

            {/* ── Invoice Detail Drawer ─────────────── */}
            <AnimatePresence>
                {selectedInvoice && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedInvoice(null)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', zIndex: 100 }} />
                        <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 400, background: '#fff', borderLeft: '1px solid #e2e8f0', zIndex: 101, overflowY: 'auto', padding: '2rem', boxShadow: '-20px 0 40px rgba(0,0,0,0.08)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{selectedInvoice.id}</h2>
                                <button onClick={() => setSelectedInvoice(null)}
                                    style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 8px', cursor: 'pointer', color: '#64748b', display: 'flex', transition: 'all 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                                ><X size={16} /></button>
                            </div>
                            {(() => { const sc = STATUS_CONFIG[selectedInvoice.status]; return (
                                <span style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, display: 'inline-block' }}>{sc.label}</span>
                            ); })()}
                            <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: '#0f172a', borderRadius: '16px', color: '#fff' }}>
                                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Total Amount</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em' }}>${selectedInvoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                            </div>
                            {[
                                { label: 'Client', value: selectedInvoice.client },
                                { label: 'Invoice Date', value: selectedInvoice.date },
                                { label: 'Due Date', value: selectedInvoice.due },
                            ].map(({ label, value }) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{label}</span>
                                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>{value}</span>
                                </div>
                            ))}
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
                                <button style={{ flex: 1, background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.875rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(15,23,42,0.2)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}>
                                    <Download size={15} /> Download
                                </button>
                                <button style={{ flex: 1, background: '#fff', color: '#0f172a', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '0.875rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#0f172a'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                                    <Send size={15} /> Send
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ── New Invoice Modal ─────────────────── */}
            <AnimatePresence>
                {newInvoiceModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={e => { if (e.target === e.currentTarget) setNewInvoiceModal(false); }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
                        <motion.div initial={{ scale: 0.96, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 12 }}
                            style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '28px', padding: '2.5rem', width: '100%', maxWidth: 460, boxShadow: '0 32px 64px rgba(0,0,0,0.15)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a' }}>Create Invoice</h2>
                                    <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>Fill in the invoice details below</p>
                                </div>
                                <button onClick={() => setNewInvoiceModal(false)}
                                    style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 8px', cursor: 'pointer', color: '#64748b', display: 'flex', transition: 'all 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                                ><X size={16} /></button>
                            </div>
                            <form onSubmit={e => { e.preventDefault(); setNewInvoiceModal(false); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {[
                                    { label: 'Client Name', type: 'text', placeholder: 'e.g. Acme Corporation' },
                                    { label: 'Amount (USD)', type: 'number', placeholder: '0.00' },
                                    { label: 'Due Date', type: 'date', placeholder: '' },
                                    { label: 'Description', type: 'text', placeholder: 'Services rendered...' },
                                ].map(({ label, type, placeholder }) => (
                                    <div key={label}>
                                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
                                        <input type={type} required placeholder={placeholder}
                                            style={inputStyle}
                                            onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(15,23,42,0.06)'; }}
                                            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                                        />
                                    </div>
                                ))}
                                <button type="submit"
                                    style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.9rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Outfit', sans-serif", marginTop: '0.5rem', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(15,23,42,0.2)' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.transform = 'none'; }}
                                >
                                    Generate Invoice
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserPortal;
