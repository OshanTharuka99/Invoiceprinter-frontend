import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, Package, Briefcase, Truck, FileText, DollarSign, BarChart3, Calendar, TrendingUp, CheckCircle2, Activity, PiggyBank } from 'lucide-react';
import api from '../../api';
import '../../styles/dashboard-shared.css';
import './AdminDashboard.css';

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

function MiniBar({ value, total, color }) {
    const pct = total > 0 ? (value / total) * 100 : 0;
    return (
        <div className="ad-minibar-track">
            <div className="ad-minibar-fill" style={{ width: `${pct}%`, background: color }} />
        </div>
    );
}

const PERIODS = [
    { key: 'daily', label: 'Daily' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'yearly', label: 'Yearly' },
];

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

const AdminDashboard = ({ currentUser }) => {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('yearly');
    const [org, setOrg] = useState(null);
    const [stats, setStats] = useState({
        users: 0, clients: 0, products: 0,
        projects: 0, suppliers: 0, quotations: 0,
        warranties: { total: 0, active: 0, expired: 0 },
    });
    const [invoiceStats, setInvoiceStats] = useState(null);
    const [recentInvoices, setRecentInvoices] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [entityRes, invoiceStatsRes, businessRes] = await Promise.all([
                    Promise.all([
                        api.get('/users'),
                        api.get('/clients'),
                        api.get('/products'),
                        api.get('/projects'),
                        api.get('/suppliers'),
                        api.get('/quotations'),
                        api.get('/warranties'),
                    ]),
                    api.get(`/invoices/stats?period=${period}`),
                    api.get('/business'),
                ]);

                const [usersRes, clientsRes, productsRes,
                    projectsRes, suppliersRes, quotationsRes,
                    warrantiesRes] = entityRes;

                const biz = businessRes.data?.data?.details ?? businessRes.data?.business ?? null;
                if (biz) setOrg(biz);

                setStats({
                    users: usersRes.data?.data?.length ?? usersRes.data?.length ?? 0,
                    clients: clientsRes.data?.data?.length ?? clientsRes.data?.length ?? 0,
                    products: productsRes.data?.data?.length ?? productsRes.data?.length ?? 0,
                    projects: projectsRes.data?.data?.length ?? projectsRes.data?.length ?? 0,
                    suppliers: suppliersRes.data?.data?.length ?? suppliersRes.data?.length ?? 0,
                    quotations: quotationsRes.data?.data?.length ?? quotationsRes.data?.length ?? 0,
                    warranties: warrantiesRes.data?.stats ?? { total: 0, active: 0, expired: 0 },
                });

                const data = invoiceStatsRes.data?.data;
                if (data) {
                    setInvoiceStats(data);
                    setRecentInvoices(data.recentInvoices?.slice(0, 6) ?? []);
                }
            } catch (err) {
                console.error('Dashboard fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [period]);

    if (loading) {
        return (
            <div className="dash-page ad-root">
                <div className="dash-loading">
                    <div className="dash-loading-ring" />
                    <span className="dash-loading-text">Loading dashboard...</span>
                </div>
            </div>
        );
    }

    const totalSales = invoiceStats?.totalSales ?? 0;
    const totalProfit = invoiceStats?.totalProfit ?? 0;
    const profitMargin = invoiceStats?.profitMargin ?? 0;
    const totalCost = invoiceStats?.totalCost ?? 0;
    const paymentMethods = invoiceStats?.paymentMethodBreakdown ?? [];
    const statusBreakdown = invoiceStats?.statusBreakdown ?? [];
    const maxPayment = Math.max(...paymentMethods.map(p => p.total || 0), 1);

    const fmt = (n) => {
        if (!n && n !== 0) return 'Rs. 0';
        return 'Rs. ' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const statusCount = (status) => {
        const found = statusBreakdown.find(s => s._id === status);
        return found ? found.count : 0;
    };

    const statusPct = (status) => {
        const total = invoiceStats?.totalInvoices ?? 0;
        const count = statusCount(status);
        return total > 0 ? Math.round((count / total) * 100) : 0;
    };

    const paymentTotal = (method) => {
        const found = paymentMethods.find(p => {
            const m = p._id?.toLowerCase().replace(/\s+/g, '_');
            return m === method;
        });
        return found ? found.total : 0;
    };

    const paymentCount = (method) => {
        const found = paymentMethods.find(p => {
            const m = p._id?.toLowerCase().replace(/\s+/g, '_');
            return m === method;
        });
        return found ? found.count : 0;
    };

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const periodLabel = PERIODS.find(p => p.key === period)?.label ?? '';
    const paidRate = invoiceStats?.totalInvoices > 0
        ? Math.round((statusCount('Paid') / invoiceStats.totalInvoices) * 100)
        : 0;

    return (
        <div className="dash-page ad-root">
            <div className="dash-hero">
                <motion.div className="dash-hero-main" {...cardMotion(0)}>
                    <div className="dash-hero-top">
                        <div className="dash-hero-eyebrow">{periodLabel} Business Overview</div>
                        <div className="dash-live-badge">
                            <span className="dash-live-dot" />
                            Live Data
                        </div>
                    </div>
                    <h1 className="dash-hero-title">{getGreeting()}, <span>{currentUser?.firstName}</span></h1>
                    <p className="dash-hero-sub">
                        Your business at a glance — <strong>{fmt(totalSales)}</strong> revenue, <strong>{fmt(totalProfit)}</strong> gross profit ({profitMargin}% margin) across <strong>{invoiceStats?.totalInvoices ?? 0}</strong> invoices.
                    </p>
                    <div className="dash-hero-chips">
                        <span className="dash-hero-chip"><DollarSign size={12} /> {fmt(totalSales)} revenue</span>
                        <span className="dash-hero-chip"><PiggyBank size={12} /> {fmt(totalProfit)} profit</span>
                        <span className="dash-hero-chip"><Activity size={12} /> {profitMargin}% margin</span>
                    </div>
                </motion.div>
                <div className="dash-hero-actions">
                    <div className="dash-period-group">
                        {PERIODS.map(p => (
                            <button
                                key={p.key}
                                onClick={() => setPeriod(p.key)}
                                className={`dash-period-btn ${period === p.key ? 'dash-period-btn--active' : ''}`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <div className="dash-date-pill">
                        <Calendar size={14} />
                        {today}
                    </div>
                </div>
            </div>

            <div className="dash-kpi-strip">
                {[
                    { label: 'Total Revenue', value: fmt(totalSales), meta: `${periodLabel} sales`, icon: DollarSign, accent: '#059669', bg: '#ecfdf5' },
                    { label: 'Gross Profit', value: fmt(totalProfit), meta: `${profitMargin}% margin`, icon: PiggyBank, accent: '#0891b2', bg: '#ecfeff' },
                    { label: 'Total Cost', value: fmt(totalCost), meta: 'Buy price (COGS)', icon: TrendingUp, accent: '#d97706', bg: '#fffbeb' },
                    { label: 'Invoices', value: invoiceStats?.totalInvoices ?? 0, meta: `${statusCount('Paid')} paid`, icon: FileText, accent: '#6366f1', bg: '#eef2ff' },
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
                            <div className="dash-kpi-value">{typeof kpi.value === 'number' ? <AnimatedCounter value={kpi.value} /> : kpi.value}</div>
                            <div className="dash-kpi-meta">{kpi.meta}</div>
                        </motion.div>
                    );
                })}
            </div>

            {org && (
                <>
                    <div className="dash-section">
                        <div className="dash-section-left">
                            <div className="dash-section-line" />
                            <div>
                                <h2 className="dash-section-title">Organization Profile</h2>
                                <p className="dash-section-sub">Registered business details & contact information</p>
                            </div>
                        </div>
                        <span className="dash-verified-badge"><CheckCircle2 size={11} /> Verified</span>
                    </div>
                    <motion.div className="ad-org-card dash-card" {...cardMotion(5)}>
                    <div className="ad-org-top">
                        {org.quotationLogo && (
                            <div className="ad-org-logo">
                                <img src={org.quotationLogo} alt={org.businessName} />
                            </div>
                        )}
                        <div className="ad-org-head">
                            <div className="ad-org-name">{org.businessName || 'Business'}</div>
                            <div className="ad-org-type">{org.businessType}</div>
                        </div>
                    </div>
                    <div className="ad-org-grid">
                        {org.registrationNumber && (
                            <div className="ad-org-field">
                                <span className="ad-org-field-label">Registry No</span>
                                <span className="ad-org-field-value">{org.registrationNumber}</span>
                            </div>
                        )}
                        {org.address && (
                            <div className="ad-org-field">
                                <span className="ad-org-field-label">Address</span>
                                <span className="ad-org-field-value ad-org-field-value--addr">{org.address}</span>
                            </div>
                        )}
                        {org.phoneNumber && (
                            <div className="ad-org-field">
                                <span className="ad-org-field-label">Phone</span>
                                <span className="ad-org-field-value">{org.phoneNumber}</span>
                            </div>
                        )}
                        {org.email && (
                            <div className="ad-org-field">
                                <span className="ad-org-field-label">Email</span>
                                <span className="ad-org-field-value">{org.email}</span>
                            </div>
                        )}
                        {org.vatNumber && (
                            <div className="ad-org-field">
                                <span className="ad-org-field-label">VAT No</span>
                                <span className="ad-org-field-value ad-org-field-value--vat">{org.vatNumber}</span>
                            </div>
                        )}
                        {org.city && (
                            <div className="ad-org-field">
                                <span className="ad-org-field-label">City</span>
                                <span className="ad-org-field-value">{org.city}</span>
                            </div>
                        )}
                    </div>
                </motion.div>
                </>
            )}

            <div className="dash-section">
                <div className="dash-section-left">
                    <div className="dash-section-line" />
                    <div>
                        <h2 className="dash-section-title">Business Registry</h2>
                        <p className="dash-section-sub">Core entities across your organization</p>
                    </div>
                </div>
                <span className="dash-section-badge">{stats.users + stats.clients + stats.products + stats.projects + stats.suppliers} Total Records</span>
            </div>

            <div className="ad-stats-grid">
                {[
                    { value: stats.users, label: 'Users', icon: Users, variant: 'red', i: 0 },
                    { value: stats.clients, label: 'Clients', icon: Users, variant: 'black', i: 1 },
                    { value: stats.products, label: 'Products', icon: Package, variant: 'red', i: 2 },
                    { value: stats.projects, label: 'Projects', icon: Briefcase, variant: 'black', i: 3 },
                ].map(({ value, label, icon: Icon, variant, i }) => (
                    <motion.div key={label} className="ad-stat-card dash-card" style={{ '--i': i }} {...cardMotion(6 + i)}>
                        <div className={`ad-stat-icon ad-stat-icon--${variant}`}><Icon size={20} /></div>
                        <div className="ad-stat-info">
                            <div className="ad-stat-value"><AnimatedCounter value={value} /></div>
                            <div className="ad-stat-label">{label}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="dash-section">
                <div className="dash-section-left">
                    <div className="dash-section-line" />
                    <div>
                        <h2 className="dash-section-title">Financial Analytics</h2>
                        <p className="dash-section-sub">Revenue breakdown & invoice status distribution</p>
                    </div>
                </div>
                <span className="dash-section-badge">{periodLabel} Period</span>
            </div>

            <div className="ad-mid-grid">
                <motion.div className="ad-finance-card dash-card" {...cardMotion(11)}>
                    <div className="ad-finance-header">
                        <div className="ad-finance-header-left">
                            <div className="ad-finance-header-icon"><DollarSign size={14} /></div>
                            <h3>Revenue Overview</h3>
                        </div>
                    </div>
                    <div className="ad-finance-total">
                        <span className="ad-finance-total-label">Total Revenue</span>
                        {fmt(totalSales)}
                        <div className="ad-finance-profit-row">
                            <div className="ad-finance-profit-item">
                                <span className="ad-finance-profit-label">Gross Profit</span>
                                <span className="ad-finance-profit-value ad-finance-profit-value--profit">{fmt(totalProfit)}</span>
                            </div>
                            <div className="ad-finance-profit-item">
                                <span className="ad-finance-profit-label">Cost (Buy)</span>
                                <span className="ad-finance-profit-value">{fmt(totalCost)}</span>
                            </div>
                            <div className="ad-finance-profit-item">
                                <span className="ad-finance-profit-label">Margin</span>
                                <span className="ad-finance-profit-value ad-finance-profit-value--margin">{profitMargin}%</span>
                            </div>
                        </div>
                        <div className="dash-rate-bar">
                            <div className="dash-rate-bar-header">
                                <span className="dash-rate-bar-label">Collection Rate</span>
                                <span className="dash-rate-bar-value">{paidRate}%</span>
                            </div>
                            <div className="dash-rate-track">
                                <div className="dash-rate-fill" style={{ width: `${paidRate}%`, '--rate-from': '#059669', '--rate-to': '#34d399', '--rate-glow': 'rgba(52,211,153,0.4)' }} />
                            </div>
                        </div>
                    </div>
                    <div className="ad-finance-rows">
                        <div className="ad-finance-row">
                            <span className="ad-finance-row-label">
                                <span className="ad-finance-row-dot ad-finance-row-dot--cash" />
                                Cash
                            </span>
                            <div className="ad-finance-row-right">
                                <div className="ad-finance-row-value">{fmt(paymentTotal('cash'))}</div>
                                <div className="ad-finance-row-count">{paymentCount('cash')} invoices</div>
                            </div>
                        </div>
                        <MiniBar value={paymentCount('cash')} total={invoiceStats?.totalInvoices} color="#10b981" />
                        <div className="ad-finance-row">
                            <span className="ad-finance-row-label">
                                <span className="ad-finance-row-dot ad-finance-row-dot--cheque" />
                                Cheque
                            </span>
                            <div className="ad-finance-row-right">
                                <div className="ad-finance-row-value">{fmt(paymentTotal('cheque'))}</div>
                                <div className="ad-finance-row-count">{paymentCount('cheque')} invoices</div>
                            </div>
                        </div>
                        <MiniBar value={paymentCount('cheque')} total={invoiceStats?.totalInvoices} color="#3b82f6" />
                        <div className="ad-finance-row">
                            <span className="ad-finance-row-label">
                                <span className="ad-finance-row-dot ad-finance-row-dot--bank" />
                                Bank Transfer
                            </span>
                            <div className="ad-finance-row-right">
                                <div className="ad-finance-row-value">{fmt(paymentTotal('bank_transfer'))}</div>
                                <div className="ad-finance-row-count">{paymentCount('bank_transfer')} invoices</div>
                            </div>
                        </div>
                        <MiniBar value={paymentCount('bank_transfer')} total={invoiceStats?.totalInvoices} color="#8b5cf6" />
                        <div className="ad-finance-row">
                            <span className="ad-finance-row-label">
                                <span className="ad-finance-row-dot ad-finance-row-dot--credit" />
                                Credit
                            </span>
                            <div className="ad-finance-row-right">
                                <div className="ad-finance-row-value">{fmt(paymentTotal('credit'))}</div>
                                <div className="ad-finance-row-count">{paymentCount('credit')} invoices</div>
                            </div>
                        </div>
                        <MiniBar value={paymentCount('credit')} total={invoiceStats?.totalInvoices} color="#f59e0b" />
                    </div>
                </motion.div>

                <motion.div className="ad-status-card dash-card" {...cardMotion(12)}>
                    <div className="ad-status-header">
                        <h3>Invoice Status</h3>
                    </div>
                    <div className="ad-status-body">
                        <div className="ad-donut-wrap">
                            <div
                                className="ad-donut"
                                style={{
                                    background: `conic-gradient(
                                        #10b981 0% ${statusPct('Paid')}%,
                                        #dc2626 ${statusPct('Paid')}% ${statusPct('Paid') + statusPct('Unpaid')}%,
                                        #f59e0b ${statusPct('Paid') + statusPct('Unpaid')}% 100%
                                    )`
                                }}
                            >
                                <div className="ad-donut-hole">
                                    <span className="ad-donut-total">{invoiceStats?.totalInvoices ?? 0}</span>
                                    <span className="ad-donut-label">Total</span>
                                </div>
                            </div>
                        </div>
                        <div className="ad-status-right">
                            <div className="ad-status-rows">
                                <div className="ad-status-row">
                                    <div className="ad-status-row-left">
                                        <span className="ad-status-row-bar ad-status-row-bar--paid" />
                                        <span className="ad-status-row-label">Paid</span>
                                    </div>
                                    <span className="ad-status-row-count ad-status-row-count--paid">
                                        {statusCount('Paid')}
                                        <span className="ad-status-row-pct">({statusPct('Paid')}%)</span>
                                    </span>
                                </div>
                                <div className="ad-status-row">
                                    <div className="ad-status-row-left">
                                        <span className="ad-status-row-bar ad-status-row-bar--unpaid" />
                                        <span className="ad-status-row-label">Unpaid</span>
                                    </div>
                                    <span className="ad-status-row-count ad-status-row-count--unpaid">
                                        {statusCount('Unpaid')}
                                        <span className="ad-status-row-pct">({statusPct('Unpaid')}%)</span>
                                    </span>
                                </div>
                                <div className="ad-status-row">
                                    <div className="ad-status-row-left">
                                        <span className="ad-status-row-bar ad-status-row-bar--pending" />
                                        <span className="ad-status-row-label">Pending</span>
                                    </div>
                                    <span className="ad-status-row-count ad-status-row-count--pending">
                                        {statusCount('Pending')}
                                        <span className="ad-status-row-pct">({statusPct('Pending')}%)</span>
                                    </span>
                                </div>
                                <div className="ad-status-row">
                                    <div className="ad-status-row-left">
                                        <span className="ad-status-row-bar" style={{background:'#6b7280'}} />
                                        <span className="ad-status-row-label" style={{color:'#6b7280'}}>Cancelled</span>
                                    </div>
                                    <span className="ad-status-row-count" style={{color:'#6b7280'}}>
                                        {invoiceStats?.cancelledCount ?? 0}
                                    </span>
                                </div>
                            </div>
                            <div className="ad-status-divider">
                                <div className="ad-status-mini-row">
                                    <span className="ad-status-mini-label">Quotations</span>
                                    <span className="ad-status-mini-value">{stats.quotations}</span>
                                </div>
                                <div className="ad-status-mini-row">
                                    <span className="ad-status-mini-label">Warranties</span>
                                    <span className="ad-status-mini-value">
                                        {stats.warranties.active} <span className="ad-status-mini-sub">/ {stats.warranties.total}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="dash-section">
                <div className="dash-section-left">
                    <div className="dash-section-line" />
                    <div>
                        <h2 className="dash-section-title">Recent Activity</h2>
                        <p className="dash-section-sub">Latest invoices & payment method analysis</p>
                    </div>
                </div>
            </div>

            <motion.div className="ad-chart-card dash-card" {...cardMotion(13)}>
                <div className="ad-chart-header">
                    <div className="ad-chart-header-left">
                        <div className="ad-chart-icon"><BarChart3 size={14} /></div>
                        <h3>Payment Method Revenue</h3>
                    </div>
                </div>
                <div className="ad-chart-rows">
                    {[
                        { id: 'cash', label: 'Cash', color: '#10b981' },
                        { id: 'cheque', label: 'Cheque', color: '#3b82f6' },
                        { id: 'bank_transfer', label: 'Bank Transfer', color: '#8b5cf6' },
                        { id: 'credit', label: 'Credit', color: '#f59e0b' },
                    ].map(m => {
                        const val = paymentTotal(m.id);
                        const pct = Math.round((val / maxPayment) * 100);
                        return (
                            <div className="ad-hbar-row" key={m.id}>
                                <span className="ad-hbar-label">{m.label}</span>
                                <div className="ad-hbar-track">
                                    <div className="ad-hbar-fill" style={{ width: `${pct}%`, background: m.color }} />
                                </div>
                                <span className="ad-hbar-value">
                                    {fmt(val)}
                                    <span className="ad-hbar-sub">({paymentCount(m.id)})</span>
                                </span>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            <motion.div className="ad-recent-card dash-card" {...cardMotion(14)}>
                <div className="ad-recent-header">
                    <div className="ad-recent-header-left">
                        <h3>Recent Invoices</h3>
                    </div>
                    <span className="ad-recent-badge">{invoiceStats?.totalInvoices ?? 0} Total</span>
                </div>
                {recentInvoices.length === 0 ? (
                    <div className="dash-empty">
                        <div className="dash-empty-icon"><FileText size={32} /></div>
                        No invoices recorded yet
                    </div>
                ) : (
                    <div className="ad-recent-table-wrap modern-table-scroll">
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
                            {recentInvoices.map((inv, i) => {
                                const clientName = inv.clientRef
                                    ? `${inv.clientRef.firstName ?? ''} ${inv.clientRef.lastName ?? ''}`.trim()
                                    : inv.manualClientDetails?.name ?? '—';
                                const status = inv.status ?? 'Pending';
                                return (
                                    <tr key={inv._id ?? i}>
                                        <td><span className="ad-recent-table-num">{inv.invoiceNumber ?? '—'}</span></td>
                                        <td><span className="ad-recent-table-client">{clientName}</span></td>
                                        <td><span className="ad-recent-table-date">
                                            {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '—'}
                                        </span></td>
                                        <td><span className="ad-recent-table-amount">{fmt(inv.finalTotal)}</span></td>
                                        <td>
                                            <span className={`modern-table-status ${status.toLowerCase() === 'paid' ? 'paid' : status.toLowerCase() === 'cancelled' ? 'cancelled' : status.toLowerCase() === 'unpaid' ? 'unpaid' : 'pending'}`}>
                                                {status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default AdminDashboard;
