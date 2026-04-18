import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Plus, X, Edit3, Trash2, Search, RefreshCw, AlertTriangle, Building, CreditCard } from 'lucide-react';
import api from '../../api';

const SupplierManagement = ({ showToast }) => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSup, setEditingSup] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);

    const initialForm = {
        name: '', telephoneNumber: '', emailAddress: '', address: '',
        bankDetails: { accountNumber: '', accountName: '', bankName: '', branch: '' }
    };
    const [form, setForm] = useState(initialForm);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/suppliers');
            setSuppliers(res.data.data);
        } catch (error) {
            showToast?.('Failed to load supplier array', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const openModal = (sup = null) => {
        if (sup) {
            setEditingSup(sup);
            setForm({
                name: sup.name, telephoneNumber: sup.telephoneNumber || '',
                emailAddress: sup.emailAddress || '', address: sup.address || '',
                bankDetails: sup.bankDetails || { accountNumber: '', accountName: '', bankName: '', branch: '' }
            });
        } else {
            setEditingSup(null);
            setForm(initialForm);
        }
        setIsModalOpen(true);
    };

    const saveSupplier = async (e) => {
        e.preventDefault();
        try {
            if (editingSup) {
                await api.put(`/suppliers/${editingSup._id}`, form);
                showToast?.('Vendor updated successfully', 'success');
            } else {
                await api.post('/suppliers', form);
                showToast?.('Vendor linked to master directory', 'success');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            showToast?.(error.response?.data?.message || 'Update malfunction', 'error');
        }
    };

    const deleteSupplier = (id) => {
        setConfirmAction({
            message: "Purging this supplier terminates all mapped links internally.",
            onConfirm: async () => {
                try {
                    await api.delete(`/suppliers/${id}`);
                    showToast?.('Supplier matrix eliminated', 'success');
                    fetchData();
                } catch (error) {
                    showToast?.('Failed destruction protocol', 'error');
                }
            }
        });
    };

    const filtered = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.supplierId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const cardStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
    const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#64748b', marginBottom: '0.6rem', textTransform: 'uppercase' };
    const inputStyle = { width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '0.9rem 1.25rem', color: '#0f172a', outline: 'none', fontWeight: 600, boxSizing: 'border-box' };
    const btnStyle = { background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><RefreshCw className="animate-spin" color="#64748b" /></div>
            ) : (
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ background: '#ec489915', color: '#ec4899', padding: '10px', borderRadius: '12px' }}><Truck size={24} /></div>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 900 }}>Supplier Details</h3>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>Restricted administrative logistics management.</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input type="text" placeholder="Search Supplier" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', width: 240, outline: 'none' }} />
                            </div>
                            <motion.button whileTap={{ scale: 0.95 }} title="Connect new supplier" onClick={() => openModal()} style={btnStyle}><Plus size={18} /> Add New Supplier</motion.button>
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', width: '30%' }}>Suplier</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', width: '30%' }}>Contact</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', width: '30%' }}>Bank Details</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => (
                                <tr key={s._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{s.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#ec4899', fontWeight: 700 }}>{s.supplierId}</div>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#475569' }}>
                                        {s.telephoneNumber && <div>📞 {s.telephoneNumber}</div>}
                                        {s.emailAddress && <div>📧 {s.emailAddress}</div>}
                                        {!s.telephoneNumber && !s.emailAddress && <span style={{ color: '#cbd5e1' }}>No pipeline found</span>}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#475569' }}>
                                        {s.bankDetails?.accountNumber ? (
                                            <div>
                                                <div style={{ fontWeight: 700 }}>{s.bankDetails.bankName || 'Unknown Bank'}</div>
                                                <div style={{ fontFamily: 'monospace' }}>{s.bankDetails.accountNumber}</div>
                                            </div>
                                        ) : <span style={{ color: '#cbd5e1' }}>Void</span>}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <motion.button whileTap={{ scale: 0.9 }} title="Update Properties" onClick={() => openModal(s)} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}><Edit3 size={16} /></motion.button>
                                            <motion.button whileTap={{ scale: 0.9 }} title="Detach Component" onClick={() => deleteSupplier(s._id)} style={{ background: '#fff1f2', color: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={16} /></motion.button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: 600, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <h2 style={{ margin: 0, fontWeight: 900 }}>{editingSup ? 'Vendor Refactoring' : 'Vendor Registration'}</h2>
                            <motion.button whileTap={{ scale: 0.9 }} title="Nullify sequence" onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></motion.button>
                        </div>
                        <form onSubmit={saveSupplier}>
                            <h4 style={{ margin: '0 0 1rem 0', color: '#334155' }}><Building size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} /> Supplier Details</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Supplier Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={inputStyle} /></div>
                                <div><label style={labelStyle}>Telephone Number</label><input value={form.telephoneNumber} onChange={e => setForm({ ...form, telephoneNumber: e.target.value })} style={inputStyle} /></div>
                                <div><label style={labelStyle}>Email Address</label><input type="email" value={form.emailAddress} onChange={e => setForm({ ...form, emailAddress: e.target.value })} style={inputStyle} /></div>
                                <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Address</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={inputStyle} /></div>
                            </div>

                            <h4 style={{ margin: '1rem 0', color: '#334155' }}><CreditCard size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} /> Bank Details</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <div><label style={labelStyle}>Account Number</label><input value={form.bankDetails.accountNumber} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, accountNumber: e.target.value } })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                <div><label style={labelStyle}>Account Owner Name</label><input value={form.bankDetails.accountName} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, accountName: e.target.value } })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                <div><label style={labelStyle}>Bank Name</label><input value={form.bankDetails.bankName} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, bankName: e.target.value } })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                <div><label style={labelStyle}>Branch</label><input value={form.bankDetails.branch} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, branch: e.target.value } })} style={{ ...inputStyle, background: '#fff' }} /></div>
                            </div>

                            <motion.button whileTap={{ scale: 0.98 }} type="submit" style={{ ...btnStyle, width: '100%', justifyContent: 'center' }}>Upload Parameters</motion.button>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* CONFIRMATION MODAL */}
            <AnimatePresence>
                {confirmAction && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: 400, textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                            <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem', margin: '0 auto' }} />
                            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}>Are you absolutely sure?</h3>
                            <p style={{ color: '#64748b', marginTop: '0.8rem', marginBottom: '2rem', lineHeight: '1.5' }}>{confirmAction.message}</p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setConfirmAction(null)} style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 700, color: '#0f172a' }}>Halt</motion.button>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => { confirmAction.onConfirm(); setConfirmAction(null); }} style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Initiate Sequence</motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SupplierManagement;
