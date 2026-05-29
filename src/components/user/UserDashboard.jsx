import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign, TrendingUp, Clock, AlertCircle, BarChart3,
    Users, Package, FileText, Shield, ClipboardList,
    CheckCircle, X, Search, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import api from '../../api';
import './UserDashboard.css';

function AnimatedCounter({ value, duration = 800 }) {
    const [display, setDisplay] = useState(0);
    const prevRef = useRef(0);
    const rafRef = useRef(null);

    useEffect(() => {
        const start = prevRef.current;
        const diff = value - start;
        if (diff === 0) return;
        const startTime = performance.now();

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(start + diff * eased));
            if (progress < 1) rafRef.current = requestAnimationFrame(animate);
            else prevRef.current = value;
        };

        rafRef.current = requestAnimationFrame(animate);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [value, duration]);

    return <>{display}</>;
}

const STATUS_STYLE = {
    paid: { label: 'Paid', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
    unpaid: { label: 'Unpaid', color: '#dc2626', bg: '#fff1f2', border: '#fecdd3' },
    pending: { label: 'Pending', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    cancelled: { label: 'Cancelled', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' },
};

const UserDashboard = ({ currentUser, showToast }) => {
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState([]);
    const [entityCounts, setEntityCounts] = useState({ clients: 0, products: 0, quotations: 0, purchaseOrders: 0, warranties: 0, projects: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [invRes, clRes, prRes, qtRes, poRes, wrRes, pjRes] = await Promise.all([
                    api.get('/invoices'),
                    api.get('/clients'),
                    api.get('/products'),
                    api.get('/quotations'),
                    api.get('/purchase-orders'),
                    api.get('/warranties'),
                    api.get('/projects'),
                ]);
                const allInvoices = invRes.data.data || [];
                const myInvoices = allInvoices.filter(inv => {
                    const createdById = inv.createdBy?._id || inv.createdBy;
                    return createdById === currentUser?._id;
                });
                setInvoices(myInvoices);
                setEntityCounts({
                    clients: (clRes.data.data || []).length,
                    products: (prRes.data.data || []).length,
                    quotations: (qtRes.data.data || []).length,
                    purchaseOrders: (poRes.data.data || []).length,
                    warranties: wrRes.data.data?.length || 0,
                    projects: (pjRes.data.data || []).length,
                });
            } catch (err) {
                showToast?.('Failed to load dashboard', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUser?._id]);

    const sym = (currency) => {
        const map = { primary: 'Rs', secondary: '$', LKR: 'Rs', USD: '$' };
        return map[currency] || currency || 'Rs';
    };

    const fmt = (val, cur) => `${sym(cur || 'primary')} ${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.finalTotal || 0), 0);
    const totalUnpaid = invoices.filter(i => i.status === 'Unpaid').reduce((s, i) => s + (i.finalTotal || 0), 0);
    const totalPending = invoices.filter(i => i.status === 'Pending').reduce((s, i) => s + (i.finalTotal || 0), 0);
    const totalBilled = invoices.reduce((s, i) => s + (i.finalTotal || 0), 0);

    const statusBreakdown = ['Paid', 'Unpaid', 'Pending', 'Cancelled'].map(s => ({
        _id: s, count: invoices.filter(i => i.status === s).length, total: invoices.filter(i => i.status === s).reduce((sum, inv) => sum + (inv.finalTotal || 0), 0)
    }));

    const totalInvoices = invoices.filter(i => i.status !== 'Cancelled').length;
    const statusCount = (status) => {
        const found = statusBreakdown.find(s => s._id === status);
        return found ? found.count : 0;
    };
    const statusPct = (status) => {
        const total = totalInvoices || 1;
        return Math.round((statusCount(status) / total) * 100);
    };

    const getClientName = (inv) => {
        if (inv.clientRef) return `${inv.clientRef.firstName || ''} ${inv.clientRef.lastName || ''}`.trim() || inv.clientRef.organization || 'Client';
        if (inv.manualClientDetails?.name) return inv.manualClientDetails.name;
        return 'Walk-in Customer';
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchSearch = (inv.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            getClientName(inv).toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'all' || (inv.status || '').toLowerCase() === statusFilter;
        return matchSearch && matchStatus;
    }).slice(0, 8);

    if (loading) {
        return (
            <div className="ud-loading">
                <div className="ud-spinner" />
                <span className="ud-loading-text">Loading dashboard...</span>
            </div>
        );
    }

    return (
        <div className="ud-root">
            {/* Welcome Header */}
            <div className="ud-welcome">
                <div className="ud-welcome-left">
                    <motion.h1 initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                        Dashboard
                        <span className="ud-welcome-underline" />
                    </motion.h1>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                        Welcome back, <strong>{currentUser?.firstName}</strong>. Here's your overview.
                    </motion.p>
                </div>
            </div>

            {/* Financial Stats */}
            <div className="ud-stats-grid">
                {[
                    { label: 'Revenue Collected', value: totalRevenue, icon: DollarSign, color: '#059669', bg: '#ecfdf5', change: `${statusCount('Paid')} paid invoices` },
                    { label: 'Outstanding', value: totalUnpaid, icon: AlertCircle, color: '#dc2626', bg: '#fff1f2', change: `${statusCount('Unpaid')} unpaid invoices` },
                    { label: 'Awaiting', value: totalPending, icon: Clock, color: '#d97706', bg: '#fffbeb', change: `${statusCount('Pending')} pending` },
                    { label: 'Total Billed', value: totalBilled, icon: TrendingUp, color: '#6366f1', bg: '#eef2ff', change: `${invoices.length} total invoices` },
                ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="ud-stat-card">
                            <div className="ud-stat-top">
                                <span className="ud-stat-label">{stat.label}</span>
                                <div className="ud-stat-icon" style={{ background: stat.bg, color: stat.color }}><Icon size={16} /></div>
                            </div>
                            <div className="ud-stat-value">{fmt(stat.value)}</div>
                            <div className="ud-stat-change">{stat.change}</div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Entity Counts + Status Donut */}
            <div className="ud-grid-2col">
                {/* Entity Counts */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="ud-card">
                    <div className="ud-card-header">
                        <div className="ud-card-icon indigo"><BarChart3 size={18} /></div>
                        <h3>Registry Overview</h3>
                    </div>
                    <div className="ud-entity-grid">
                        {[
                            { label: 'Clients', value: entityCounts.clients, icon: Users, color: '#6366f1' },
                            { label: 'Products', value: entityCounts.products, icon: Package, color: '#10b981' },
                            { label: 'Projects', value: entityCounts.projects, icon: FileText, color: '#3b82f6' },
                            { label: 'Quotations', value: entityCounts.quotations, icon: FileText, color: '#f59e0b' },
                            { label: 'Warranties', value: entityCounts.warranties, icon: Shield, color: '#ef4444' },
                            { label: 'Purchase Orders', value: entityCounts.purchaseOrders, icon: ClipboardList, color: '#8b5cf6' },
                        ].map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <div key={i} className="ud-entity-item">
                                    <div className="ud-entity-icon" style={{ background: `${item.color}12`, color: item.color }}><Icon size={16} /></div>
                                    <div>
                                        <div className="ud-entity-value"><AnimatedCounter value={item.value} /></div>
                                        <div className="ud-entity-label">{item.label}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Invoice Status */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="ud-card">
                    <div className="ud-card-header">
                        <div className="ud-card-icon green"><CheckCircle size={18} /></div>
                        <h3>Invoice Status</h3>
                    </div>
                    <div className="ud-status-body">
                        <div className="ud-status-donut">
                            <svg viewBox="0 0 42 42" style={{ width: '120px', height: '120px' }}>
                                {(() => {
                                    const total = totalInvoices || 1;
                                    const segments = [
                                        { label: 'Paid', pct: (statusCount('Paid') / total) * 100, color: '#059669' },
                                        { label: 'Unpaid', pct: (statusCount('Unpaid') / total) * 100, color: '#dc2626' },
                                        { label: 'Pending', pct: (statusCount('Pending') / total) * 100, color: '#d97706' },
                                        { label: 'Cancelled', pct: (statusCount('Cancelled') / total) * 100, color: '#94a3b8' },
                                    ];
                                    let offset = 0;
                                    const r = 15.915;
                                    const c = 2 * Math.PI * r;
                                    return segments.map((seg, i) => {
                                        const length = (seg.pct / 100) * c;
                                        const dash = length > 0 ? `${Math.max(length, 0.5)} ${c - Math.max(length, 0.5)}` : `0 ${c}`;
                                        const dashOffset = -offset;
                                        offset += length;
                                        return (
                                            <circle key={i} cx="21" cy="21" r={r} fill="none" stroke={seg.color}
                                                strokeWidth="3" strokeDasharray={dash} strokeDashoffset={dashOffset}
                                                strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.5s' }}
                                            />
                                        );
                                    });
                                })()}
                                <text x="21" y="21" textAnchor="middle" dominantBaseline="central" fontSize="6" fontWeight="800" fill="#0f172a">{totalInvoices}</text>
                                <text x="21" y="26" textAnchor="middle" dominantBaseline="central" fontSize="3" fontWeight="600" fill="#94a3b8">Invoices</text>
                            </svg>
                        </div>
                        <div className="ud-status-rows">
                            {[
                                { label: 'Paid', count: statusCount('Paid'), pct: statusPct('Paid'), color: '#059669' },
                                { label: 'Unpaid', count: statusCount('Unpaid'), pct: statusPct('Unpaid'), color: '#dc2626' },
                                { label: 'Pending', count: statusCount('Pending'), pct: statusPct('Pending'), color: '#d97706' },
                                { label: 'Cancelled', count: statusCount('Cancelled'), pct: statusPct('Cancelled'), color: '#94a3b8' },
                            ].map((row, i) => (
                                <div key={i} className="ud-status-row">
                                    <div className="ud-status-row-left">
                                        <span className="ud-status-row-dot" style={{ background: row.color }} />
                                        <span className="ud-status-row-label">{row.label}</span>
                                    </div>
                                    <span className="ud-status-row-count" style={{ color: row.color }}>
                                        {row.count}<span className="ud-status-row-pct"> ({row.pct}%)</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Recent Invoices */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="ud-card ud-card-table">
                <div className="ud-card-header">
                    <div className="ud-card-icon red"><FileText size={18} /></div>
                    <h3>Recent Invoices</h3>
                    <div className="ud-card-spacer" />
                    <div className="ud-search-wrap">
                        <Search size={14} className="ud-search-icon" />
                        <input className="ud-search-input" placeholder="Search invoices..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <select className="ud-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="pending">Pending</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                <div className="ud-table-wrap">
                    <table className="ud-table">
                        <thead>
                            <tr>
                                <th>Invoice</th>
                                <th>Client</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.length === 0 ? (
                                <tr><td colSpan={5} className="ud-empty">No invoices found</td></tr>
                            ) : (
                                filteredInvoices.map((inv, i) => {
                                    const statusKey = (inv.status || '').toLowerCase();
                                    const sc = STATUS_STYLE[statusKey] || { label: inv.status || 'Unknown', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' };
                                    const invDate = inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                                    return (
                                        <motion.tr key={inv._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                                            <td><span className="ud-inv-id">{inv.invoiceNumber || '—'}</span></td>
                                            <td><span className="ud-inv-client">{getClientName(inv)}</span></td>
                                            <td><span className="ud-inv-date">{invDate}</span></td>
                                            <td><span className="ud-inv-amount">{fmt(inv.finalTotal, inv.currencyType)}</span></td>
                                            <td>
                                                <span className="ud-inv-status" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{sc.label}</span>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
};

export default UserDashboard;