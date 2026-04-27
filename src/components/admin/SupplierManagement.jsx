import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Plus, X, Edit2, Trash2, Search, RefreshCw, AlertTriangle, FileText, Phone, Mail, MapPin, Landmark, CreditCard, User } from 'lucide-react';
import api from '../../api';

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

    const cardStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
    const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#64748b', marginBottom: '0.6rem', textTransform: 'uppercase' };
    const inputStyle = { width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '0.9rem 1.25rem', color: '#0f172a', outline: 'none', fontWeight: 600, boxSizing: 'border-box' };

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            {loading ? ( <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><RefreshCw className="animate-spin" color="#64748b" /></div> ) : (
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ background: '#0f172a10', color: '#0f172a', padding: '10px', borderRadius: '12px' }}><Truck size={24} /></div> 
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 900 }}>Vendor Management</h3>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>Centrally manage supply chain entities and archival.</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} title="Locate entity" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input type="text" title="Enter search parameters" placeholder="Search vendors..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', width: 240, outline: 'none' }} />
                            </div>
                            <motion.button whileTap={{ scale: 0.95 }} title="Establish new supply entity" onClick={() => openModal()} style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={18} /> Add Vendor</motion.button>
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                <th style={{ padding: '1.25rem 1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>Identity & ID</th>
                                <th style={{ padding: '1.25rem 1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>Contact Matrix</th>
                                <th style={{ padding: '1.25rem 1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>Bank Archival</th>
                                <th style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>Management</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(v => (
                                <tr key={v._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1.25rem 1rem' }}>
                                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{v.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 700 }}>{v.supplierId}</div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
                                        {v.telephoneNumber && <div>📞 {v.telephoneNumber}</div>}
                                        {v.emailAddress && <div>📧 {v.emailAddress}</div>}
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem' }}>
                                        {v.bankDetails?.bankName ? (
                                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '4px 10px', borderRadius: '8px', border: '1px solid #d1fae5', width: 'fit-content' }}>
                                               ACTIVE: {v.bankDetails.bankName}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>INCOMPLETE ARCHIVAL</div>
                                        )}
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                            <motion.button whileTap={{ scale: 0.9 }} title="Inspect Entity Specifications" onClick={() => setViewVendor(v)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight: 800, color: '#0f172a', display: 'flex', gap: '0.4rem', fontSize: '0.7rem' }}><FileText size={12} /> View</motion.button>
                                            <motion.button whileTap={{ scale: 0.9 }} title="Modify Archival Configuration" onClick={() => openModal(v)} style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight: 800, color: '#2563eb', display: 'flex', gap: '0.4rem', fontSize: '0.7rem' }}><Edit2 size={12} /> Edit</motion.button>
                                            <motion.button whileTap={{ scale: 0.9 }} title="Initiate Elimination Sequence" onClick={() => deleteVendor(v._id)} style={{ background: '#fff1f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight: 800, color: '#ef4444', fontSize: '0.7rem' }}>Delete</motion.button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* VIEW MODAL */}
            <AnimatePresence>
                {viewVendor && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#fff', borderRadius: '32px', padding: '3rem', width: '100%', maxWidth: 550, boxShadow: '0 50px 100px -20px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ background: '#0f172a10', color: '#0f172a', padding: '12px', borderRadius: '15px' }}><Truck size={24} /></div>
                                    <div>
                                        <h3 style={{ margin: 0, fontWeight: 900 }}>{viewVendor.name}</h3>
                                        <span style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 800 }}>{viewVendor.supplierId}</span>
                                    </div>
                                </div>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setViewVendor(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={20}/></motion.button>
                            </div>
                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                    <h4 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 900, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}><User size={16}/> Identity Matrix</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}><Phone size={16} color="#94a3b8"/> <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{viewVendor.telephoneNumber || '--'}</div></div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}><Mail size={16} color="#94a3b8"/> <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{viewVendor.emailAddress || '--'}</div></div>
                                    <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}><MapPin size={16} color="#94a3b8" style={{marginTop: '4px'}}/> <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', lineHeight: '1.4' }}>{viewVendor.address || '--'}</div></div>
                                </div>
                                <div style={{ background: '#0f172a', color: '#fff', padding: '2rem', borderRadius: '24px' }}>
                                    <h4 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 900, color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}><Landmark size={16}/> Financial Settlement Arclight</h4>
                                    {viewVendor.bankDetails?.bankName ? (
                                        <div style={{ display: 'grid', gap: '1rem' }}>
                                            <div><div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b' }}>SETTLEMENT INSTITUTION</div><div style={{ fontSize: '1rem', fontWeight: 800 }}>{viewVendor.bankDetails.bankName} ({viewVendor.bankDetails.branch})</div></div>
                                            <div><div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b' }}>ACCOUNT DESIGNATION</div><div style={{ fontSize: '1rem', fontWeight: 800 }}>{viewVendor.bankDetails.accountName}</div></div>
                                            <div><div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b' }}>ROUTING NUMBER / ACC</div><div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981', letterSpacing: '2px' }}>{viewVendor.bankDetails.accountNumber}</div></div>
                                        </div>
                                    ) : ( <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>NO SETTLEMENT DATA LOGGED</div> )}
                                </div>
                            </div>
                            <motion.button whileTap={{ scale: 0.98 }} onClick={() => setViewVendor(null)} style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '14px', width: '100%', padding: '1.1rem', fontWeight: 800, cursor: 'pointer', marginTop: '2rem' }}>Close Inspector</motion.button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ADD/EDIT MODAL */}
            <AnimatePresence>
                {isModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#fff', borderRadius: '32px', padding: '3rem', width: '100%', maxWidth: 700, boxShadow: '0 50px 100px -20px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                                <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem' }}>{editingVendor ? 'Sync Supplier' : 'Establish Supplier'}</h2>
                                <motion.button whileTap={{ scale: 0.8 }} title="Close Modal" onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={24} /></motion.button>
                            </div>
                            <form onSubmit={saveVendor}>
                                <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '24px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                                    <h4 style={{ margin: '0 0 1.5rem 0', fontWeight: 800 }}>Profile Designation</h4>
                                    <div style={{ gridColumn: 'span 2', marginBottom: '1.5rem' }}><label style={labelStyle}>Entity Name</label><input title="Full business/entity nomenclature" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={{...inputStyle, background: '#fff'}} /></div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div><label style={labelStyle}>Primary Telephone</label><input title="Contact number" value={form.telephoneNumber} onChange={e => setForm({...form, telephoneNumber: e.target.value})} style={{...inputStyle, background: '#fff'}} /></div>
                                        <div><label style={labelStyle}>Mail Exchange</label><input title="Email address" type="email" value={form.emailAddress} onChange={e => setForm({...form, emailAddress: e.target.value})} style={{...inputStyle, background: '#fff'}} /></div>
                                        <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Physical Domicile</label><input title="Geographic location" value={form.address} onChange={e => setForm({...form, address: e.target.value})} style={{...inputStyle, background: '#fff'}} /></div>
                                    </div>
                                </div>
                                <div style={{ background: '#0f172a', color: '#fff', padding: '2rem', borderRadius: '24px' }}>
                                    <h4 style={{ margin: '0 0 1.5rem 0', fontWeight: 800 }}>Financial Settlement Arclight</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                        <div><label style={{...labelStyle, color: '#94a3b8'}}>Bank Institution</label><input title="Full name of financial institution" value={form.bankDetails.bankName} onChange={e => setForm({...form, bankDetails: {...form.bankDetails, bankName: e.target.value}})} style={{...inputStyle, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)'}} /></div>
                                        <div><label style={{...labelStyle, color: '#94a3b8'}}>Branch Node</label><input title="Geographic branch location" value={form.bankDetails.branch} onChange={e => setForm({...form, bankDetails: {...form.bankDetails, branch: e.target.value}})} style={{...inputStyle, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)'}} /></div>
                                        <div><label style={{...labelStyle, color: '#94a3b8'}}>Account Designation</label><input title="Exact name on financial account" value={form.bankDetails.accountName} onChange={e => setForm({...form, bankDetails: {...form.bankDetails, accountName: e.target.value}})} style={{...inputStyle, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)'}} /></div>
                                        <div><label style={{...labelStyle, color: '#94a3b8'}}>Account Registry Number</label><input title="Unique account identifier" value={form.bankDetails.accountNumber} onChange={e => setForm({...form, bankDetails: {...form.bankDetails, accountNumber: e.target.value}})} style={{...inputStyle, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)'}} /></div>
                                    </div>
                                </div>
                                <motion.button whileTap={{ scale: 0.98 }} title="Commit entity to supply matrix" type="submit" style={{ ...inputStyle, background: '#10b981', color: '#fff', border: 'none', justifyContent: 'center', padding: '1.25rem', fontSize: '1.1rem', marginTop: '2.5rem' }}>EXECUTE SYNCHRONIZATION</motion.button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

             {/* CONFIRMATION MODAL */}
             <AnimatePresence>
                {confirmAction && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#fff', borderRadius: '32px', padding: '3rem', width: '100%', maxWidth: 450, textAlign: 'center', boxShadow: '0 50px 100px -20px rgba(0,0,0,0.4)' }}>
                            <AlertTriangle size={64} color="#ef4444" style={{ marginBottom: '1.5rem', margin: '0 auto' }} />
                            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', color: '#0f172a' }}>Authorize De-Authorization?</h3>
                            <p style={{ color: '#64748b', marginTop: '1rem', marginBottom: '2.5rem', fontWeight: 600 }}>{confirmAction.message}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}><motion.button whileTap={{ scale: 0.95 }} title="Abort Operation" onClick={() => setConfirmAction(null)} style={{ padding: '1rem', borderRadius: '16px', border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 800 }}>Abort</motion.button><motion.button whileTap={{ scale: 0.95 }} title="Execute Record Elimination" onClick={() => { confirmAction.onConfirm(); setConfirmAction(null); }} style={{ padding: '1rem', borderRadius: '16px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 800 }}>Confirm</motion.button></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SupplierManagement;
