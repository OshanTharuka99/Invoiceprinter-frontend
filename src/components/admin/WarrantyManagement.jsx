import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, RefreshCw, Search, Calendar, Package, MapPin, Edit3, Trash2, X, AlertTriangle } from 'lucide-react';
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

    // Edit Serial Modal
    const [editSerialModal, setEditSerialModal] = useState(null); // warranty object
    const [newSerial, setNewSerial] = useState('');
    const [serialReason, setSerialReason] = useState('');
    const [editSerialSaving, setEditSerialSaving] = useState(false);
    const [availableSerials, setAvailableSerials] = useState([]);
    const [serialsLoading, setSerialsLoading] = useState(false);

    // Void Warranty Modal
    const [voidModal, setVoidModal] = useState(null); // warranty object
    const [voidSaving, setVoidSaving] = useState(false);

    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'root';

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
        return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    };

    const remainingPeriod = (expiryDate) => {
        if (!expiryDate) return null;
        const now = new Date();
        const expiry = new Date(expiryDate);
        if (expiry <= now) return null;
        let totalMonths = (expiry.getFullYear() - now.getFullYear()) * 12 + (expiry.getMonth() - now.getMonth());
        if (expiry.getDate() < now.getDate()) totalMonths--;
        if (totalMonths < 0) return null;
        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;
        let days = daysRemaining(expiryDate);
        if (years > 0) days = days % 30;
        else if (months > 0) days = days % 30;
        const parts = [];
        if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
        if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
        if (days > 0 && !years) parts.push(`${days} day${days > 1 ? 's' : ''}`);
        return parts.join(', ') || null;
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

    const handleEditSerial = async () => {
        if (!newSerial.trim()) return showToast?.('New serial number is required', 'error');
        if (!serialReason.trim()) return showToast?.('Reason is required', 'error');
        setEditSerialSaving(true);
        try {
            await api.patch(`/warranties/${editSerialModal._id}/serial`, { newSerial, reason: serialReason });
            showToast?.('Serial number updated and stock adjusted', 'success');
            setEditSerialModal(null);
            setNewSerial('');
            setSerialReason('');
            fetchData();
        } catch (err) {
            showToast?.(err.response?.data?.message || 'Failed to update serial', 'error');
        } finally {
            setEditSerialSaving(false);
        }
    };

    const handleVoidWarranty = async () => {
        setVoidSaving(true);
        try {
            await api.delete(`/warranties/${voidModal._id}`);
            showToast?.('Warranty voided and serial restored to catalog', 'success');
            setVoidModal(null);
            fetchData();
        } catch (err) {
            showToast?.(err.response?.data?.message || 'Failed to void warranty', 'error');
        } finally {
            setVoidSaving(false);
        }
    };

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
                                        {isAdmin && <th>Actions</th>}
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
                                                            {remainingPeriod(w.expiryDate)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`wm-badge ${w.status === 'active' ? 'wm-badge-active' : 'wm-badge-expired'}`}>{w.status}</span>
                                                </td>
                                                {isAdmin && (
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                            <button
                                                                className="wm-action-btn wm-action-edit"
                                                                title="Edit Serial Number"
                                                                onClick={async () => {
                                                                    setEditSerialModal(w); setNewSerial(''); setSerialReason('');
                                                                    setSerialsLoading(true); setAvailableSerials([]);
                                                                    try {
                                                                        const pId = w.productRef?._id;
                                                                        if (pId) {
                                                                            const res = await api.get(`/products/${pId}/stock`);
                                                                            const allSerials = (res.data.data || []).flatMap(e => e.serialNumbers || []);
                                                                            const unique = [...new Set(allSerials.map(s => s.toUpperCase()))];
                                                                            setAvailableSerials(unique);
                                                                        }
                                                                    } catch { setAvailableSerials([]); }
                                                                    finally { setSerialsLoading(false); }
                                                                }}
                                                            >
                                                                <Edit3 size={13} />
                                                            </button>
                                                            <button
                                                                className="wm-action-btn wm-action-void"
                                                                title="Void Warranty"
                                                                onClick={() => setVoidModal(w)}
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                    {filtered.length === 0 && <tr><td colSpan={isAdmin ? 10 : 9}><div className="wm-empty">No warranties found in registry</div></td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* EDIT SERIAL MODAL */}
            <AnimatePresence>
                {editSerialModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="wm-modal-overlay">
                        <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }} className="wm-modal">
                            <div className="wm-modal-header">
                                <div className="wm-modal-icon wm-modal-icon--edit"><Edit3 size={18} /></div>
                                <div>
                                    <h3 className="wm-modal-title">Edit Serial Number</h3>
                                    <p className="wm-modal-desc">Old serial will return to stock. New serial will be deducted from stock.</p>
                                </div>
                                <button className="wm-modal-close" onClick={() => setEditSerialModal(null)}><X size={18} /></button>
                            </div>
                            <div className="wm-modal-body">
                                <div className="wm-modal-field">
                                    <label className="wm-modal-label">Current Serial</label>
                                    <input className="wm-modal-input wm-modal-input--locked" value={editSerialModal.serialNumber} readOnly />
                                </div>
                                <div className="wm-modal-field">
                                    <label className="wm-modal-label">New Serial Number</label>
                                    <input className="wm-modal-input" value={newSerial} onChange={e => setNewSerial(e.target.value.toUpperCase())} placeholder="Type serial or select from available below" />
                                </div>
                                <div className="wm-modal-field">
                                    <label className="wm-modal-label">Available in Stock — click to select</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.2rem', minHeight: '2rem', alignItems: 'center' }}>
                                        {serialsLoading ? (
                                            <span style={{ fontSize: '0.78rem', color: '#9ca3af', fontStyle: 'italic' }}>Loading available serials...</span>
                                        ) : availableSerials.length === 0 ? (
                                            <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>No serials available in stock for this product</span>
                                        ) : (
                                            availableSerials.map((s, i) => {
                                                const isSelected = newSerial.toUpperCase() === s.toUpperCase();
                                                const isCurrent = editSerialModal.serialNumber?.toUpperCase() === s.toUpperCase();
                                                if (isCurrent) return null;
                                                return (
                                                    <span key={i}
                                                        onClick={() => setNewSerial(isSelected ? '' : s)}
                                                        style={{
                                                            padding: '0.3rem 0.7rem', borderRadius: '8px', fontSize: '0.75rem',
                                                            fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                                                            background: isSelected ? '#4f46e5' : '#e0e7ff',
                                                            color: isSelected ? '#fff' : '#4338ca',
                                                            border: isSelected ? '1px solid #4f46e5' : '1px solid #c7d2fe'
                                                        }}
                                                    >{isSelected ? '✓ ' : '+ '}{s}</span>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                                <div className="wm-modal-field">
                                    <label className="wm-modal-label">Reason for Change</label>
                                    <input className="wm-modal-input" value={serialReason} onChange={e => setSerialReason(e.target.value)} placeholder="e.g. Incorrect serial recorded" />
                                </div>
                            </div>
                            <div className="wm-modal-actions">
                                <button className="wm-modal-btn wm-modal-btn--secondary" onClick={() => setEditSerialModal(null)}>Cancel</button>
                                <motion.button whileTap={{ scale: 0.97 }} className="wm-modal-btn wm-modal-btn--primary" onClick={handleEditSerial} disabled={editSerialSaving}>
                                    {editSerialSaving ? 'Saving...' : 'Save Changes'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* VOID WARRANTY MODAL */}
            <AnimatePresence>
                {voidModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="wm-modal-overlay">
                        <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }} className="wm-modal wm-modal--danger">
                            <div className="wm-modal-header">
                                <div className="wm-modal-icon wm-modal-icon--danger"><AlertTriangle size={18} /></div>
                                <div>
                                    <h3 className="wm-modal-title">Void Warranty</h3>
                                    <p className="wm-modal-desc">This will permanently delete the warranty and restore the serial number to the product catalog.</p>
                                </div>
                                <button className="wm-modal-close" onClick={() => setVoidModal(null)}><X size={18} /></button>
                            </div>
                            <div className="wm-modal-body">
                                <div className="wm-void-info">
                                    <div><span className="wm-void-label">Serial:</span> <strong>{voidModal.serialNumber}</strong></div>
                                    <div><span className="wm-void-label">Product:</span> <strong>{voidModal.productRef?.name || 'Unknown'}</strong></div>
                                    <div><span className="wm-void-label">Invoice:</span> <strong>{voidModal.invoiceRef?.invoiceNumber || '—'}</strong></div>
                                </div>
                            </div>
                            <div className="wm-modal-actions">
                                <button className="wm-modal-btn wm-modal-btn--secondary" onClick={() => setVoidModal(null)}>Cancel</button>
                                <motion.button whileTap={{ scale: 0.97 }} className="wm-modal-btn wm-modal-btn--danger" onClick={handleVoidWarranty} disabled={voidSaving}>
                                    {voidSaving ? 'Voiding...' : 'Void & Restore Serial'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WarrantyManagement;
