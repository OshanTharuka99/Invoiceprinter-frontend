import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    DollarSign, TrendingUp, AlertCircle, BarChart3,
    Users, Package, FileText, Shield, ClipboardList,
    CheckCircle, Search, Calendar, Activity, PiggyBank, Wrench
} from 'lucide-react';
import api from '../../api';
import '../../styles/dashboard-shared.css';
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

const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
};

const cardMotion = (i = 0) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
});

const emptyRma = {
    Open: 0, 'In Progress': 0, 'Awaiting Supplier': 0, Resolved: 0, Closed: 0, Cancelled: 0,
};

const UserDashboard = ({ currentUser, showToast }) => {
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState([]);
    const [myQuotations, setMyQuotations] = useState([]);
    const [quotationByStatus, setQuotationByStatus] = useState({});
    const [myPurchaseOrders, setMyPurchaseOrders] = useState([]);
    const [poByStatus, setPoByStatus] = useState({});
    const [entityCounts, setEntityCounts] = useState({
        clients: 0, products: 0, quotations: 0, purchaseOrders: 0, warranties: 0, projects: 0,
    });
    const [rmaByStatus, setRmaByStatus] = useState(emptyRma);
    const [totals, setTotals] = useState({ paid: 0, unpaid: 0, pending: 0, billed: 0 });
    const [profitStats, setProfitStats] = useState({
        totalCost: 0, totalRevenue: 0, totalProfit: 0, profitMargin: 0, paidProfit: 0,
    });
    const [statusBreakdown, setStatusBreakdown] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await api.get('/dashboard/stats');
                const data = res.data?.data;
                if (!data) throw new Error('No dashboard data');

                const ws = data.userWorkspace || {};
                setInvoices(ws.myInvoices || []);
                setMyQuotations(ws.quotations?.recent || []);
                setQuotationByStatus(ws.quotations?.byStatus || {});
                setMyPurchaseOrders(ws.purchaseOrders?.recent || []);
                setPoByStatus(ws.purchaseOrders?.byStatus || {});
                setTotals(ws.totals || { paid: 0, unpaid: 0, pending: 0, billed: 0 });
                setProfitStats(ws.profit || {
                    totalCost: 0, totalRevenue: 0, totalProfit: 0, profitMargin: 0, paidProfit: 0,
                });
                setStatusBreakdown(ws.statusBreakdown || []);
                setRmaByStatus(ws.myRmaByStatus || emptyRma);
                setEntityCounts({
                    clients: data.counts?.clients ?? 0,
                    products: data.counts?.products ?? 0,
                    quotations: ws.quotations?.total ?? ws.myQuotations ?? 0,
                    purchaseOrders: ws.purchaseOrders?.total ?? 0,
                    warranties: data.counts?.warranties?.total ?? 0,
                    projects: data.counts?.projects ?? 0,
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

    const totalRevenue = totals.paid;
    const totalUnpaid = totals.unpaid;
    const profitMargin = profitStats.profitMargin || 0;

    const statusCount = (status) => {
        const found = statusBreakdown.find(s => s._id === status);
        return found ? found.count : 0;
    };
    const totalInvoices = statusBreakdown
        .filter((s) => s._id !== 'Cancelled')
        .reduce((sum, s) => sum + (s.count || 0), 0);
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

    const rmaTotal = Object.values(rmaByStatus).reduce((s, n) => s + (n || 0), 0);
    const rmaCount = (key) => rmaByStatus[key] || 0;
    const qtCount = (statuses) => statuses.reduce((s, st) => s + (quotationByStatus[st] || 0), 0);
    const poCount = (statuses) => statuses.reduce((s, st) => s + (poByStatus[st] || 0), 0);

    if (loading) {
        return (
            <div className="dash-page ud-root">
                <div className="dash-loading">
                    <div className="dash-loading-ring" />
                    <span className="dash-loading-text">Loading dashboard...</span>
                </div>
            </div>
        );
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="dash-page ud-root">
            <div className="dash-hero">
                <motion.div className="dash-hero-main" {...cardMotion(0)}>
                    <div className="dash-hero-top">
                        <div className="dash-hero-eyebrow">Your Workspace</div>
                        <div className="dash-live-badge">
                            <span className="dash-live-dot" />
                            Live Data
                        </div>
                    </div>
                    <h1 className="dash-hero-title">{getGreeting()}, <span>{currentUser?.firstName}</span></h1>
                    <p className="dash-hero-sub">
                        You've collected <strong>{fmt(totalRevenue)}</strong> from <strong>{statusCount('Paid')}</strong> paid invoices with <strong>{fmt(profitStats.totalProfit)}</strong> gross profit ({profitMargin}% margin).
                    </p>
                    <div className="dash-hero-chips">
                        <span className="dash-hero-chip"><PiggyBank size={12} /> {fmt(profitStats.totalProfit)} profit</span>
                        <span className="dash-hero-chip"><DollarSign size={12} /> {fmt(profitStats.paidProfit)} from paid</span>
                        <span className="dash-hero-chip"><Activity size={12} /> {profitMargin}% margin</span>
                    </div>
                </motion.div>
                <div className="dash-hero-actions">
                    <div className="dash-date-pill">
                        <Calendar size={14} />
                        {today}
                    </div>
                </div>
            </div>

            <div className="dash-section">
                <div className="dash-section-left">
                    <div className="dash-section-line" />
                    <div>
                        <h2 className="dash-section-title">Financial Summary</h2>
                        <p className="dash-section-sub">Your invoice revenue & payment status at a glance</p>
                    </div>
                </div>
                <span className="dash-section-badge">{profitMargin}% Profit Margin</span>
            </div>

            <div className="dash-kpi-strip">
                {[
                    { label: 'Revenue Collected', value: fmt(totalRevenue), meta: `${statusCount('Paid')} paid invoices`, icon: DollarSign, accent: '#059669', bg: '#ecfdf5' },
                    { label: 'Gross Profit', value: fmt(profitStats.totalProfit), meta: `${profitMargin}% margin`, icon: PiggyBank, accent: '#0891b2', bg: '#ecfeff' },
                    { label: 'Outstanding', value: fmt(totalUnpaid), meta: `${statusCount('Unpaid')} unpaid`, icon: AlertCircle, accent: '#dc2626', bg: '#fff1f2' },
                    { label: 'Total Cost', value: fmt(profitStats.totalCost), meta: 'Buy price (COGS)', icon: TrendingUp, accent: '#d97706', bg: '#fffbeb' },
                ].map((kpi, i) => {
                    const Icon = kpi.icon;
                    return (
                        <motion.div
                            key={kpi.label}
                            className="dash-kpi-card"
                            style={{ '--kpi-accent': kpi.accent, '--kpi-bg': kpi.bg }}
                            {...cardMotion(i + 1)}
                        >
                            <div className="dash-kpi-top">
                                <span className="dash-kpi-label">{kpi.label}</span>
                                <div className="dash-kpi-icon"><Icon size={16} /></div>
                            </div>
                            <div className="dash-kpi-value">{kpi.value}</div>
                            <div className="dash-kpi-meta">{kpi.meta}</div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="dash-section">
                <div className="dash-section-left">
                    <div className="dash-section-line" />
                    <div>
                        <h2 className="dash-section-title">Operations Overview</h2>
                        <p className="dash-section-sub">Registry counts & invoice status distribution</p>
                    </div>
                </div>
            </div>

            <div className="ud-grid-2col">
                <motion.div {...cardMotion(5)} className="ud-card dash-card">
                    <div className="dash-card-header">
                        <div className="dash-card-icon ud-card-icon indigo"><BarChart3 size={16} /></div>
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

                <motion.div {...cardMotion(6)} className="ud-card dash-card">
                    <div className="dash-card-header">
                        <div className="dash-card-icon ud-card-icon green"><CheckCircle size={16} /></div>
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

            <div className="dash-section">
                <div className="dash-section-left">
                    <div className="dash-section-line" />
                    <div>
                        <h2 className="dash-section-title">RMA Process</h2>
                        <p className="dash-section-sub">Your assigned / related RMA status mix</p>
                    </div>
                </div>
            </div>

            <motion.div {...cardMotion(6.5)} className="ud-card dash-card">
                <div className="dash-card-header">
                    <div className="dash-card-icon ud-card-icon amber"><Wrench size={16} /></div>
                    <h3>RMA Status</h3>
                </div>
                <div className="ud-status-body">
                    <div className="ud-status-donut">
                        <svg viewBox="0 0 42 42" style={{ width: '120px', height: '120px' }}>
                            {(() => {
                                const RMA_SEGS = [
                                    { label: 'Open', key: 'Open', color: '#3b82f6' },
                                    { label: 'In Progress', key: 'In Progress', color: '#f59e0b' },
                                    { label: 'Awaiting Supplier', key: 'Awaiting Supplier', color: '#8b5cf6' },
                                    { label: 'Resolved', key: 'Resolved', color: '#10b981' },
                                    { label: 'Closed', key: 'Closed', color: '#64748b' },
                                    { label: 'Cancelled', key: 'Cancelled', color: '#ef4444' },
                                ];
                                const total = rmaTotal || 1;
                                let offset = 0;
                                const r = 15.915;
                                const c = 2 * Math.PI * r;
                                return (
                                    <>
                                        {RMA_SEGS.map((seg, i) => {
                                            const count = rmaCount(seg.key);
                                            const pct = (count / total) * 100;
                                            const length = (pct / 100) * c;
                                            const dash = length > 0 ? `${Math.max(length, 0.5)} ${c - Math.max(length, 0.5)}` : `0 ${c}`;
                                            const dashOffset = -offset;
                                            offset += length;
                                            return (
                                                <circle key={i} cx="21" cy="21" r={r} fill="none" stroke={seg.color}
                                                    strokeWidth="3" strokeDasharray={dash} strokeDashoffset={dashOffset}
                                                    strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.5s' }}
                                                />
                                            );
                                        })}
                                        <text x="21" y="20.5" textAnchor="middle" dominantBaseline="central" fontSize="6" fontWeight="800" fill="#0f172a">{rmaTotal}</text>
                                        <text x="21" y="25.5" textAnchor="middle" dominantBaseline="central" fontSize="3" fontWeight="600" fill="#94a3b8">RMA</text>
                                    </>
                                );
                            })()}
                        </svg>
                    </div>
                    <div className="ud-status-rows">
                        {[
                            { label: 'Open', key: 'Open', color: '#3b82f6' },
                            { label: 'In Progress', key: 'In Progress', color: '#f59e0b' },
                            { label: 'Awaiting Supplier', key: 'Awaiting Supplier', color: '#8b5cf6' },
                            { label: 'Resolved', key: 'Resolved', color: '#10b981' },
                            { label: 'Closed', key: 'Closed', color: '#64748b' },
                            { label: 'Cancelled', key: 'Cancelled', color: '#ef4444' },
                        ].map((row, i) => {
                            const count = rmaCount(row.key);
                            const pct = rmaTotal > 0 ? Math.round((count / rmaTotal) * 100) : 0;
                            return (
                                <div key={i} className="ud-status-row">
                                    <div className="ud-status-row-left">
                                        <span className="ud-status-row-dot" style={{ background: row.color }} />
                                        <span className="ud-status-row-label">{row.label}</span>
                                    </div>
                                    <span className="ud-status-row-count" style={{ color: row.color }}>
                                        {count}<span className="ud-status-row-pct"> ({pct}%)</span>
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>

            <div className="dash-section">
                <div className="dash-section-left">
                    <div className="dash-section-line" />
                    <div>
                        <h2 className="dash-section-title">Your Documents</h2>
                        <p className="dash-section-sub">Quotations & purchase orders you created</p>
                    </div>
                </div>
            </div>

            <div className="ud-grid-2col">
                <motion.div {...cardMotion(7)} className="ud-card dash-card">
                    <div className="dash-card-header">
                        <div className="dash-card-icon ud-card-icon indigo"><FileText size={16} /></div>
                        <h3>Quotation Overview</h3>
                    </div>
                    {entityCounts.quotations === 0 ? (
                        <div className="dash-empty">No quotations yet</div>
                    ) : (
                        <div className="ud-entity-grid">
                            {[
                                { label: 'Total', value: entityCounts.quotations, color: '#6366f1' },
                                { label: 'Approved', value: qtCount(['Approved']), color: '#059669' },
                                { label: 'Pending', value: qtCount(['Pending', 'Draft']), color: '#d97706' },
                                { label: 'Rejected', value: qtCount(['Rejected']), color: '#dc2626' },
                            ].map((item, i) => (
                                <div key={i} className="ud-entity-item">
                                    <div className="ud-entity-icon" style={{ background: `${item.color}12`, color: item.color }}>
                                        <FileText size={16} />
                                    </div>
                                    <div>
                                        <div className="ud-entity-value"><AnimatedCounter value={item.value} /></div>
                                        <div className="ud-entity-label">{item.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                <motion.div {...cardMotion(8)} className="ud-card dash-card">
                    <div className="dash-card-header">
                        <div className="dash-card-icon ud-card-icon green"><ClipboardList size={16} /></div>
                        <h3>Purchase Order Overview</h3>
                    </div>
                    {entityCounts.purchaseOrders === 0 ? (
                        <div className="dash-empty">No purchase orders yet</div>
                    ) : (
                        <div className="ud-entity-grid">
                            {[
                                { label: 'Total', value: entityCounts.purchaseOrders, color: '#6366f1' },
                                { label: 'Approved', value: poCount(['Approved']), color: '#059669' },
                                { label: 'Pending', value: poCount(['Pending', 'Draft']), color: '#d97706' },
                                { label: 'Rejected', value: poCount(['Rejected']), color: '#dc2626' },
                            ].map((item, i) => (
                                <div key={i} className="ud-entity-item">
                                    <div className="ud-entity-icon" style={{ background: `${item.color}12`, color: item.color }}>
                                        <ClipboardList size={16} />
                                    </div>
                                    <div>
                                        <div className="ud-entity-value"><AnimatedCounter value={item.value} /></div>
                                        <div className="ud-entity-label">{item.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            <div className="dash-section">
                <div className="dash-section-left">
                    <div className="dash-section-line" />
                    <div>
                        <h2 className="dash-section-title">Recent Transactions</h2>
                        <p className="dash-section-sub">Latest quotations, purchase orders & invoices</p>
                    </div>
                </div>
            </div>

            <div className="ud-grid-2col">
                <motion.div {...cardMotion(9)} className="ud-card ud-card-table dash-card">
                    <div className="dash-card-header">
                        <div className="dash-card-icon ud-card-icon indigo"><FileText size={16} /></div>
                        <h3>Recent Quotations</h3>
                    </div>
                    <div className="ud-table-wrap">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Quotation</th>
                                    <th>Client</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myQuotations.length === 0 ? (
                                    <tr><td colSpan={5} className="ud-empty">No quotations found</td></tr>
                                ) : (
                                    myQuotations.map((q, i) => {
                                        const clientName = q.clientRef
                                            ? `${q.clientRef.firstName ?? ''} ${q.clientRef.lastName ?? ''}`.trim()
                                            : q.manualClientDetails?.name || '—';
                                        const qDate = q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                                        const st = (q.status || 'Pending').toLowerCase();
                                        return (
                                            <motion.tr key={q._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                                                <td><span className="ud-inv-id">{q.quotationId || '—'}</span></td>
                                                <td><span className="ud-inv-client">{clientName}</span></td>
                                                <td><span className="ud-inv-date">{qDate}</span></td>
                                                <td><span className="ud-inv-amount">{fmt(q.finalTotal, q.currency)}</span></td>
                                                <td>
                                                    <span className={`ud-inv-status ud-status-${st}`} style={{
                                                        background: st === 'approved' ? '#ecfdf5' : st === 'rejected' ? '#fef2f2' : '#fffbeb',
                                                        color: st === 'approved' ? '#059669' : st === 'rejected' ? '#dc2626' : '#d97706',
                                                        border: `1px solid ${st === 'approved' ? '#a7f3d0' : st === 'rejected' ? '#fecdd3' : '#fde68a'}`
                                                    }}>{q.status || 'Pending'}</span>
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                <motion.div {...cardMotion(10)} className="ud-card ud-card-table dash-card">
                    <div className="dash-card-header">
                        <div className="dash-card-icon ud-card-icon green"><ClipboardList size={16} /></div>
                        <h3>Recent Purchase Orders</h3>
                    </div>
                    <div className="ud-table-wrap">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>PO Number</th>
                                    <th>Supplier</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myPurchaseOrders.length === 0 ? (
                                    <tr><td colSpan={5} className="ud-empty">No purchase orders found</td></tr>
                                ) : (
                                    myPurchaseOrders.map((po, i) => {
                                        const supplierName = po.supplierRef
                                            ? `${po.supplierRef.firstName ?? ''} ${po.supplierRef.lastName ?? ''}`.trim() || po.supplierRef.name || '—'
                                            : '—';
                                        const poDate = po.poDate ? new Date(po.poDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                                        const st = (po.status || 'Pending').toLowerCase();
                                        return (
                                            <motion.tr key={po._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                                                <td><span className="ud-inv-id">{po.poNumber || '—'}</span></td>
                                                <td><span className="ud-inv-client">{supplierName}</span></td>
                                                <td><span className="ud-inv-date">{poDate}</span></td>
                                                <td><span className="ud-inv-amount">{fmt(po.finalTotal, po.currency)}</span></td>
                                                <td>
                                                    <span className={`ud-inv-status ud-status-${st}`} style={{
                                                        background: st === 'approved' ? '#ecfdf5' : st === 'rejected' ? '#fef2f2' : '#fffbeb',
                                                        color: st === 'approved' ? '#059669' : st === 'rejected' ? '#dc2626' : '#d97706',
                                                        border: `1px solid ${st === 'approved' ? '#a7f3d0' : st === 'rejected' ? '#fecdd3' : '#fde68a'}`
                                                    }}>{po.status || 'Pending'}</span>
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

            <motion.div {...cardMotion(11)} className="ud-card ud-card-table dash-card">
                <div className="dash-card-header ud-invoice-header">
                    <div className="dash-card-icon ud-card-icon red"><FileText size={16} /></div>
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
                    <table className="modern-table">
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
                                            <td><span className="ud-inv-amount">{fmt(inv.finalTotal, inv.currency)}</span></td>
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
