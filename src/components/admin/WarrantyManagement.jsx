import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, RefreshCw, Search, Calendar, Package, Users, Briefcase } from 'lucide-react';
import api from '../../api';

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
        const invoiceMatch = w.invoiceRef?.invoiceId?.toLowerCase().includes(search);
        const productMatch = w.productRef?.name?.toLowerCase().includes(search);
        const clientMatch = `${w.clientRef?.firstName || ''} ${w.clientRef?.lastName || ''}`.toLowerCase().includes(search);
        return serialMatch || invoiceMatch || productMatch || clientMatch;
    });

    const cardStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
    const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#64748b', marginBottom: '0.6rem', textTransform: 'uppercase' };
    const inputStyle = { width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '0.8rem 1.25rem', color: '#0f172a', outline: 'none', fontWeight: 600, boxSizing: 'border-box' };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ width: 56, height: 56, background: '#d1fae5', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={24} color="#059669" /></div>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Active</div>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: '#059669' }}>{stats.active}</div>
                    </div>
                </div>
                <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ width: 56, height: 56, background: '#fee2e2', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={24} color="#dc2626" /></div>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Expired</div>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: '#dc2626' }}>{stats.expired}</div>
                    </div>
                </div>
                <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ width: 56, height: 56, background: '#e0e7ff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={24} color="#4f46e5" /></div>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Registry</div>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: '#4f46e5' }}>{stats.total}</div>
                    </div>
                </div>
            </div>

            {/* FILTERS */}
            <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 800, color: '#0f172a' }}>Warranty Registry</h1>
                        <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>Track active and expired warranties for all products.</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={fetchData} style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><RefreshCw size={18} /> Refresh</motion.button>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                        <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input type="text" placeholder="Search serial, invoice, product, client..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', width: '100%', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, background: '#fff', width: 'auto', minWidth: 150 }}>
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                    </select>
                    <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} style={{ ...inputStyle, background: '#fff', width: 'auto', minWidth: 180 }}>
                        <option value="">All Clients</option>
                        {clients.map(c => <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>)}
                    </select>
                    <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} style={{ ...inputStyle, background: '#fff', width: 'auto', minWidth: 180 }}>
                        <option value="">All Projects</option>
                        {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><RefreshCw className="animate-spin" color="#64748b" /></div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Serial No</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Product</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Client</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Invoice</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Warranty Period</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Start Date</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Expiry Date</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(w => {
                                const remaining = daysRemaining(w.expiryDate);
                                return (
                                    <tr key={w._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem', fontFamily: 'monospace' }}>{w.serialNumber}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>{w.productRef?.name || 'Unknown'}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{w.productRef?.productId || ''}</div>
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
                                            {w.clientRef ? `${w.clientRef.firstName} ${w.clientRef.lastName}` : 'Unknown'}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.85rem', fontFamily: 'monospace' }}>{w.invoiceRef?.invoiceId || '—'}</span>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#475569' }}>
                                            {w.warrantyPeriod || '—'}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#475569' }}>
                                            {fmt(w.startDate)}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.8rem', color: '#475569' }}>{fmt(w.expiryDate)}</div>
                                            {w.status === 'active' && remaining !== null && (
                                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: remaining <= 30 ? '#dc2626' : '#059669' }}>
                                                    {remaining} days remaining
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                                                background: w.status === 'active' ? '#d1fae5' : '#fee2e2',
                                                color: w.status === 'active' ? '#059669' : '#dc2626'
                                            }}>{w.status}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && <tr><td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No warranties in registry.</td></tr>}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default WarrantyManagement;
