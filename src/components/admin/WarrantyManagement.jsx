import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, RefreshCw, Search, Calendar, Package, Users, Briefcase, MapPin } from 'lucide-react';
import api from '../../api';
import './WarrantyManagement.css';

const WarrantyManagement = ({ currentUser, showToast }) => {
    const [warranties, setWarranties] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, expired: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]);
    const [clientFilter, setClientFilter] = useState('');
    const [projectFilter, setProjectFilter] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter !== 'all') params.status = statusFilter;
            if (clientFilter) params.client = clientFilter;
            if (projectFilter) params.project = projectFilter;

            const [wRes, cRes, pRes] = await Promise.all([
                api.get('/warranties', { params }),
                api.get('/clients'),
                api.get('/projects')
            ]);
            setWarranties(wRes.data.data);
            setStats(wRes.data.stats);
            setClients(cRes.data.data);
            setProjects(pRes.data.data);
        } catch (error) {
            showToast?.('Error fetching warranties', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [statusFilter, clientFilter, projectFilter]);

    const fmt = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const daysRemaining = (expiryDate) => {
        if (!expiryDate) return null;
        const now = new Date();
        const expiry = new Date(expiryDate);
        const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const filtered = warranties.filter(w => {
        const search = searchTerm.toLowerCase();
        const serialMatch = w.serialNumber?.toLowerCase().includes(search);
        const invoiceMatch = w.invoiceRef?.invoiceNumber?.toLowerCase().includes(search);
        const productMatch = w.productRef?.name?.toLowerCase().includes(search);
        const clientName = w.clientRef ? `${w.clientRef.firstName} ${w.clientRef.lastName}` : w.invoiceRef?.manualClientDetails?.name || 'Walk-in Customer';
        const clientMatch = clientName.toLowerCase().includes(search);
        return serialMatch || invoiceMatch || productMatch || clientMatch;
    });

    return (
        <div className="wm-root">
            {/* STATS */}
            <div className="wm-stats">
                <div className="wm-stat-card green">
                    <div className="wm-stat-icon green"><Shield size={24} /></div>
                    <div className="wm-stat-body">
                        <div className="wm-stat-value">{stats.active}</div>
                        <div className="wm-stat-label">Active Warranties</div>
                    </div>
                </div>
                <div className="wm-stat-card red">
                    <div className="wm-stat-icon red"><Calendar size={24} /></div>
                    <div className="wm-stat-body">
                        <div className="wm-stat-value">{stats.expired}</div>
                        <div className="wm-stat-label">Expired Warranties</div>
                    </div>
                </div>
                <div className="wm-stat-card indigo">
                    <div className="wm-stat-icon indigo"><Package size={24} /></div>
                    <div className="wm-stat-body">
                        <div className="wm-stat-value">{stats.total}</div>
                        <div className="wm-stat-label">Total Registry</div>
                    </div>
                </div>
            </div>

            {/* MAIN CARD */}
            <div className="wm-card">
                <div className="wm-card-header">
                    <div className="wm-card-title">
                        <div className="wm-card-icon green"><Shield size={20} /></div>
                        <div>
                            <h3>Warranty Registry</h3>
                            <div className="wm-card-subtitle">Track active and expired warranties for all products</div>
                        </div>
                    </div>
                    <div className="wm-card-actions">
                        <motion.button whileTap={{ scale: 0.95 }} onClick={fetchData} className="wm-btn wm-btn-primary"><RefreshCw size={16} /> Refresh</motion.button>
                    </div>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    {/* FILTERS */}
                    <div className="wm-filters">
                        <div className="wm-search-wrap">
                            <Search size={16} className="wm-search-icon" />
                            <input type="text" placeholder="Search serial, invoice, product, client..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="wm-search-input" />
                        </div>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="wm-select">
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                        </select>
                        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="wm-select">
                            <option value="">All Clients</option>
                            {clients.map(c => <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>)}
                        </select>
                        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="wm-select">
                            <option value="">All Projects</option>
                            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                    </div>

                    {loading ? (
                        <div className="wm-loading"><RefreshCw className="animate-spin" color="var(--wm-t3)" /> Loading warranties...</div>
                    ) : (
                        <div className="wm-table-wrap">
                            <table className="wm-table">
                                <thead>
                                    <tr>
                                        <th>Serial No</th>
                                        <th>Product</th>
                                        <th>Client</th>
                                        <th>Project</th>
                                        <th>Invoice</th>
                                        <th>Warranty Period</th>
                                        <th>Start Date</th>
                                        <th>Expiry Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(w => {
                                        const remaining = daysRemaining(w.expiryDate);
                                        const clientName = w.clientRef ? `${w.clientRef.firstName} ${w.clientRef.lastName}` : w.invoiceRef?.manualClientDetails?.name || 'Walk-in Customer';
                                        return (
                                            <tr key={w._id}>
                                                <td><span className="wm-badge wm-badge-serial">{w.serialNumber}</span></td>
                                                <td>
                                                    <div style={{ fontWeight: 700, color: 'var(--wm-t1)', fontSize: '0.88rem' }}>{w.productRef?.name || 'Unknown'}</div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--wm-t3)' }}>{w.productRef?.productId || ''}</div>
                                                </td>
                                                <td style={{ fontWeight: 700, color: 'var(--wm-t1)' }}>{clientName}</td>
                                                <td>
                                                    {w.projectRef ? (
                                                        <div>
                                                            <div style={{ fontWeight: 700, color: 'var(--wm-t1)', fontSize: '0.85rem' }}>{w.projectRef.name}</div>
                                                            {(w.projectRef.location || w.projectLocation) && (
                                                                <div style={{ fontSize: '0.72rem', color: 'var(--wm-t3)', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.15rem' }}>
                                                                    <MapPin size={10} />{w.projectRef.location || w.projectLocation}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: 'var(--wm-t3)', fontSize: '0.8rem' }}>—</span>
                                                    )}
                                                </td>
                                                <td><span className="wm-badge wm-badge-id">{w.invoiceRef?.invoiceNumber || '—'}</span></td>
                                                <td style={{ fontSize: '0.85rem', color: 'var(--wm-t2)' }}>{w.warrantyPeriod || '—'}</td>
                                                <td style={{ fontSize: '0.85rem', color: 'var(--wm-t2)' }}>{fmt(w.startDate)}</td>
                                                <td>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--wm-t2)' }}>{fmt(w.expiryDate)}</div>
                                                    {w.status === 'active' && remaining !== null && (
                                                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: remaining <= 30 ? 'var(--wm-red)' : 'var(--wm-green)' }}>
                                                            {remaining} days remaining
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`wm-badge ${w.status === 'active' ? 'wm-badge-active' : 'wm-badge-expired'}`}>{w.status}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filtered.length === 0 && <tr><td colSpan="9"><div className="wm-empty">No warranties found in registry</div></td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WarrantyManagement;
