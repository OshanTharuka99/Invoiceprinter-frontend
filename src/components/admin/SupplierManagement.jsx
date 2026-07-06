import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Plus, X, Edit2, Trash2, Search, RefreshCw, AlertTriangle, FileText, Phone, Mail, MapPin, Landmark, Building2, Users, CheckCircle2, DollarSign, CreditCard } from 'lucide-react';
import api from '../../api';
import './SupplierManagement.css';
import '../../styles/modern-table.css';

const SupplierManagement = ({ currentUser, showToast }) => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewVendor, setViewVendor] = useState(null);
    const [editingVendor, setEditingVendor] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);

    const initialForm = { 
        name: '', 
        telephoneNumber: '', 
        emailAddress: '', 
        address: '', 
        bankDetails: { accountNumber: '', accountName: '', bankName: '', branch: '' } 
    };
    const [form, setForm] = useState(initialForm);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/suppliers');
            setVendors(res.data.data);
        } catch (error) { showToast?.('Failed to load supply matrix', 'error'); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const openModal = (vendor = null) => {
        if (vendor) {
            setEditingVendor(vendor);
            setForm({
                name: vendor.name,
                telephoneNumber: vendor.telephoneNumber || '',
                emailAddress: vendor.emailAddress || '',
                address: vendor.address || '',
                bankDetails: {
                    accountNumber: vendor.bankDetails?.accountNumber || '',
                    accountName: vendor.bankDetails?.accountName || '',
                    bankName: vendor.bankDetails?.bankName || '',
                    branch: vendor.bankDetails?.branch || ''
                }
            });
        } else { setEditingVendor(null); setForm(initialForm); }
        setIsModalOpen(true);
    };

    const saveVendor = async (e) => {
        e.preventDefault();
        try {
            if (editingVendor) { await api.put(`/suppliers/${editingVendor._id}`, form); showToast?.('Supply chain records synchronized', 'success'); }
            else { await api.post('/suppliers', form); showToast?.('New vendor entity established', 'success'); }
            setIsModalOpen(false);
            fetchData();
        } catch (error) { showToast?.(error.response?.data?.message || 'Transmission failure', 'error'); }
    };

    const deleteVendor = (id) => {
        setConfirmAction({
            message: "Permanently terminate this vendor relationship from the supply matrix?",
            onConfirm: async () => {
                try { await api.delete(`/suppliers/${id}`); showToast?.('Entity eliminated', 'success'); fetchData(); }
                catch (error) { showToast?.('Elimination protocol failed', 'error'); }
            }
        });
    };

    const filtered = vendors.filter(v => 
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (v.supplierId || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const withBank = vendors.filter(v => v.bankDetails?.bankName).length;

    return (
        <div className="pm-root">
            <div className="pm-stats">
                {[
                    { label: 'Total Vendors', value: vendors.length, icon: Building2, variant: 'blue' },
                    { label: 'With Bank Details', value: withBank, icon: CheckCircle2, variant: 'green' },
                    { label: 'Pending Archival', value: vendors.length - withBank, icon: CreditCard, variant: 'amber' },
                    { label: 'Contacted Vendors', value: vendors.filter(v => v.telephoneNumber || v.emailAddress).length, icon: Users, variant: 'indigo' },
                ].map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div key={idx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }} className={`pm-stat-card ${stat.variant}`}>
                            <div className={`pm-stat-icon ${stat.variant}`}><Icon size={22} /></div>
                            <div className="pm-stat-body">
                                <div className="pm-stat-value">{stat.value}</div>
                                <div className="pm-stat-label">{stat.label}</div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="pm-card">
                <div className="pm-card-header">
                    <div className="pm-card-title">
                        <div className="pm-card-icon blue"><Truck size={22} /></div>
                        <div>
                            <h3>Vendor Management</h3>
                            <div className="pm-card-subtitle">Centrally manage supply chain entities and archival.</div>
                        </div>
                    </div>
                    <div className="pm-card-actions">
                        <div className="pm-search-wrap">
                            <Search size={14} className="pm-search-icon" />
                            <input type="text" placeholder="Search vendors by name or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pm-search-input" />
                        </div>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={fetchData} className="pm-btn pm-btn-outline"><RefreshCw size={16} /></motion.button>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => openModal()} className="pm-btn pm-btn-primary"><Plus size={16} /> New Vendor</motion.button>
                    </div>
                </div>

                {loading ? (
                    <div className="pm-loading"><RefreshCw className="animate-spin" size={20} /> Loading...</div>
                ) : filtered.length === 0 ? (
                    <div className="pm-empty">No vendors found{searchTerm ? ' — try adjusting your search' : ''}</div>
                ) : (
                    <div className="modern-table-card">
                    <div className="modern-table-scroll">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Vendor</th>
                                <th>Contact</th>
                                <th>Address</th>
                                <th>Bank Status</th>
                                <th className="text-center" style={{ width: '180px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((v, idx) => (
                                <motion.tr
                                    key={v._id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.03 }}>
                                    <td>
                                        <div className="modern-table-cell-primary">
                                            <div className="sm-table-name-icon modern-table-cell-icon" style={{ background: '#fffbeb' }}><Truck size={18} color="#f59e0b" /></div>
                                            <div>
                                                <div className="sm-table-name-text modern-table-cell-title">{v.name}</div>
                                                <span className="modern-table-cell-subtitle amber">{v.supplierId}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {v.telephoneNumber && <div className="modern-table-cell-info" style={{ marginBottom: '0.35rem' }}><Phone size={14} color="#94a3b8" /><span>{v.telephoneNumber}</span></div>}
                                        {v.emailAddress && <div className="modern-table-cell-info"><Mail size={14} color="#94a3b8" /><span>{v.emailAddress}</span></div>}
                                        {!v.telephoneNumber && !v.emailAddress && <span className="modern-table-cell-info muted">—</span>}
                                    </td>
                                    <td>
                                        <div className="modern-table-cell-info muted">
                                            <MapPin size={14} color="#94a3b8" />
                                            <span>{v.address || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        {v.bankDetails?.bankName ? (
                                            <span className="modern-table-badge green">{v.bankDetails.bankName}</span>
                                        ) : (
                                            <span className="modern-table-badge gray">Not Set</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="modern-table-actions">
                                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setViewVendor(v)} className="modern-table-action view"><FileText size={14} /></motion.button>
                                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => openModal(v)} className="modern-table-action edit"><Edit2 size={14} /></motion.button>
                                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => deleteVendor(v._id)} className="modern-table-action delete"><Trash2 size={14} /></motion.button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>
                )}
            </div>

            {/* View Modal */}
            <AnimatePresence>
                {viewVendor && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="sm-overlay"
                        onClick={() => setViewVendor(null)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="sm-modal sm-modal-md">
                            <div className="sm-modal-header">
                                <div className="sm-modal-title-row">
                                    <div className="sm-modal-icon-wrap" style={{ background: '#fffbeb' }}><Truck size={24} color="#f59e0b" /></div>
                                    <div>
                                        <h3 className="sm-modal-title">{viewVendor.name}</h3>
                                        <span className="sm-modal-badge">{viewVendor.supplierId}</span>
                                    </div>
                                </div>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setViewVendor(null)} className="sm-modal-close"><X size={20} /></motion.button>
                            </div>
                            <div className="sm-detail-grid">
                                {[
                                    { icon: Phone, label: 'CONTACT NUMBER', value: viewVendor.telephoneNumber || '--' },
                                    { icon: Mail, label: 'EMAIL ADDRESS', value: viewVendor.emailAddress || '--' },
                                    { icon: MapPin, label: 'ADDRESS', value: viewVendor.address || '--' }
                                ].map((item, idx) => (
                                    <div key={idx} className="sm-detail-item">
                                        <div className="sm-detail-icon-box"><item.icon size={18} color="#64748b" /></div>
                                        <div>
                                            <div className="sm-detail-label">{item.label}</div>
                                            <div className="sm-detail-value">{item.value}</div>
                                        </div>
                                    </div>
                                ))}
                                {viewVendor.bankDetails?.bankName && (
                                    <div className="sm-detail-item">
                                        <div className="sm-detail-icon-box"><Landmark size={18} color="#64748b" /></div>
                                        <div>
                                            <div className="sm-detail-label">BANK DETAILS</div>
                                            <div className="sm-detail-value">{viewVendor.bankDetails.bankName} ({viewVendor.bankDetails.branch})</div>
                                            <div className="sm-detail-value sm-detail-value-green">{viewVendor.bankDetails.accountName} — {viewVendor.bankDetails.accountNumber}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <motion.button whileTap={{ scale: 0.98 }} onClick={() => setViewVendor(null)} className="sm-btn-close">Close</motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="sm-overlay"
                        onClick={() => setIsModalOpen(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="sm-modal sm-modal-lg">
                            <div className="sm-modal-header">
                                <h2 className="sm-form-title">{editingVendor ? 'Edit Vendor' : 'New Vendor'}</h2>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsModalOpen(false)} className="sm-modal-close"><X size={20} /></motion.button>
                            </div>
                            <form onSubmit={saveVendor}>
                                <div className="sm-form-group">
                                    <label className="sm-label">Vendor Name</label>
                                    <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="sm-input" />
                                </div>
                                <div className="sm-form-section">
                                    <h4 className="sm-form-section-title">Contact Information</h4>
                                    <div className="sm-form-row-2">
                                        <div>
                                            <label className="sm-label">Telephone</label>
                                            <input value={form.telephoneNumber} onChange={e => setForm({...form, telephoneNumber: e.target.value})} className="sm-input" />
                                        </div>
                                        <div>
                                            <label className="sm-label">Email</label>
                                            <input type="email" value={form.emailAddress} onChange={e => setForm({...form, emailAddress: e.target.value})} className="sm-input" />
                                        </div>
                                        <div className="sm-form-row-full">
                                            <label className="sm-label">Address</label>
                                            <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="sm-input" />
                                        </div>
                                    </div>
                                </div>
                                <div className="sm-form-section">
                                    <h4 className="sm-form-section-title">Bank Details</h4>
                                    <div className="sm-form-row-2">
                                        <div>
                                            <label className="sm-label">Bank Name</label>
                                            <input value={form.bankDetails.bankName} onChange={e => setForm({...form, bankDetails: {...form.bankDetails, bankName: e.target.value}})} className="sm-input" />
                                        </div>
                                        <div>
                                            <label className="sm-label">Branch</label>
                                            <input value={form.bankDetails.branch} onChange={e => setForm({...form, bankDetails: {...form.bankDetails, branch: e.target.value}})} className="sm-input" />
                                        </div>
                                        <div>
                                            <label className="sm-label">Account Name</label>
                                            <input value={form.bankDetails.accountName} onChange={e => setForm({...form, bankDetails: {...form.bankDetails, accountName: e.target.value}})} className="sm-input" />
                                        </div>
                                        <div>
                                            <label className="sm-label">Account Number</label>
                                            <input value={form.bankDetails.accountNumber} onChange={e => setForm({...form, bankDetails: {...form.bankDetails, accountNumber: e.target.value}})} className="sm-input" />
                                        </div>
                                    </div>
                                </div>
                                <motion.button whileTap={{ scale: 0.98 }} type="submit" className="sm-btn-submit">
                                    {editingVendor ? 'Update Vendor' : 'Create Vendor'}
                                </motion.button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {confirmAction && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="sm-overlay">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="sm-modal sm-modal-sm" style={{ textAlign: 'center' }}>
                            <div className="sm-confirm-icon-box"><AlertTriangle size={40} color="#ef4444" /></div>
                            <h3 className="sm-confirm-title">Confirm Deletion</h3>
                            <p className="sm-confirm-msg">{confirmAction.message}</p>
                            <div className="sm-confirm-actions">
                                <motion.button whileTap={{ scale: 0.98 }} onClick={() => setConfirmAction(null)} className="sm-btn-cancel">Cancel</motion.button>
                                <motion.button whileTap={{ scale: 0.98 }} onClick={() => { confirmAction.onConfirm(); setConfirmAction(null); }} className="sm-btn-danger">Delete</motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SupplierManagement;
