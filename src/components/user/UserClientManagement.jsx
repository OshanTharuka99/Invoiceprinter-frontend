import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, RefreshCw, Send, Plus, X } from 'lucide-react';
import api from '../../api';
import useSubmitGuard from '../../utils/useSubmitGuard';

const UserClientManagement = ({ showToast }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);

    const initialForm = { firstName: '', lastName: '', clientType: 'Person', telephoneNumber: '', whatsappNumber: '', emailAddress: '', address: '' };
    const [form, setForm] = useState(initialForm);
    const { isSubmitting, runGuarded } = useSubmitGuard();

    const fetchClients = async () => {
        setLoading(true);
        try {
            const res = await api.get('/clients');
            setClients(res.data.data);
        } catch (error) {
            showToast?.('Failed to load entity directory', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchClients(); }, []);

    const openCreateModal = () => {
        setForm(initialForm);
        setIsCreateModalOpen(true);
    };

    const openEditModal = (client) => {
        setSelectedClient(client);
        setForm({
            firstName: client.firstName, lastName: client.lastName, clientType: client.clientType,
            telephoneNumber: client.telephoneNumber || '', whatsappNumber: client.whatsappNumber || '',
            emailAddress: client.emailAddress || '', address: client.address || ''
        });
        setIsEditModalOpen(true);
    };

    const saveNewClient = async (e) => {
        e.preventDefault();
        await runGuarded(async () => {
            try {
                await api.post('/clients', form);
                showToast?.('Client successfully created', 'success');
                setIsCreateModalOpen(false);
                fetchClients();
            } catch (error) {
                showToast?.(error.response?.data?.message || 'Error executing creation', 'error');
            }
        });
    };

    const submitEditRequest = async (e) => {
        e.preventDefault();
        await runGuarded(async () => {
            try {
                await api.post(`/clients/${selectedClient._id}/request-edit`, form);
                showToast?.('Edit request submitted successfully.', 'success');
                setIsEditModalOpen(false);
            } catch (error) {
                showToast?.(error.response?.data?.message || 'Request failed to transmit', 'error');
            }
        });
    };

    const filtered = clients.filter(c =>
        c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.clientId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const personCount = clients.filter(c => c.clientType === 'Person').length;
    const companyCount = clients.filter(c => c.clientType === 'Company').length;

    const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#64748b', marginBottom: '0.6rem', textTransform: 'uppercase' };
    const inputStyle = { width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '0.9rem 1.25rem', color: '#0f172a', outline: 'none', fontWeight: 600, boxSizing: 'border-box' };

    return (
        <div className="pm-root">
            <div className="pm-stats">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pm-stat-card indigo">
                    <div className="pm-stat-icon indigo"><Users size={22} /></div>
                    <div className="pm-stat-body">
                        <div className="pm-stat-value">{clients.length}</div>
                        <div className="pm-stat-label">Total Clients</div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="pm-stat-card blue">
                    <div className="pm-stat-icon blue"><Users size={22} /></div>
                    <div className="pm-stat-body">
                        <div className="pm-stat-value">{personCount}</div>
                        <div className="pm-stat-label">Individuals</div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="pm-stat-card amber">
                    <div className="pm-stat-icon amber"><Users size={22} /></div>
                    <div className="pm-stat-body">
                        <div className="pm-stat-value">{companyCount}</div>
                        <div className="pm-stat-label">Companies</div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="pm-stat-card green">
                    <div className="pm-stat-icon green"><Users size={22} /></div>
                    <div className="pm-stat-body">
                        <div className="pm-stat-value">{clients.filter((c) => c.telephoneNumber || c.whatsappNumber).length}</div>
                        <div className="pm-stat-label">With Phone</div>
                    </div>
                </motion.div>
            </div>

            <div className="pm-card">
                <div className="pm-card-header">
                    <div className="pm-card-title">
                        <div className="pm-card-icon indigo"><Users size={22} /></div>
                        <div>
                            <h3>Client Directory</h3>
                            <div className="pm-card-subtitle">Read-only visibility with dynamic override proposal systems.</div>
                        </div>
                    </div>
                    <div className="pm-card-actions">
                        <div className="pm-search-wrap">
                            <Search size={14} className="pm-search-icon" />
                            <input type="text" placeholder="Search clients..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pm-search-input" />
                        </div>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={fetchClients} className="pm-btn pm-btn-outline"><RefreshCw size={16} /></motion.button>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={openCreateModal} className="pm-btn pm-btn-primary"><Plus size={16} /> Add Client</motion.button>
                    </div>
                </div>

                {loading ? (
                    <div className="pm-loading"><RefreshCw className="animate-spin" size={20} /> Loading...</div>
                ) : (
                    <div className="modern-table-card">
                        <div className="modern-table-scroll">
                        <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Identifier</th>
                                <th>Client Type</th>
                                <th>Contact Details</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(c => (
                                <tr key={c._id}>
                                    <td>
                                        <div className="modern-table-cell-primary">
                                            <div>
                                                <div className="modern-table-cell-title">{c.firstName} {c.lastName}</div>
                                                <span className="modern-table-cell-subtitle blue">{c.clientId}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="modern-table-type">{c.clientType}</span>
                                    </td>
                                    <td>
                                        <div className="modern-table-cell-info">
                                            {c.telephoneNumber && <span>{c.telephoneNumber}</span>}
                                            {c.emailAddress && <span>{c.emailAddress}</span>}
                                            {!c.telephoneNumber && !c.emailAddress && <span className="muted">—</span>}
                                        </div>
                                    </td>
                                    <td className="text-right">
                                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEditModal(c)} style={{ background: '#eff6ff', color: '#2563eb', border: '1.5px solid #dbeafe', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>Suggest Edit</motion.button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan="4" className="modern-table-empty">No entities map to current parameters.</td></tr>}
                        </tbody>
                        </table>
                        </div>
                    </div>
                )}
            </div>

            {/* CREATE MODAL */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: 550, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <h2 style={{ margin: 0, fontWeight: 900 }}>Create Client</h2>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsCreateModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></motion.button>
                            </div>
                            <form onSubmit={saveNewClient}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div><label style={labelStyle}>Given / Entity Name</label><input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required style={inputStyle} /></div>
                                    <div><label style={labelStyle}>Surname</label><input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} style={inputStyle} /></div>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={labelStyle}>Client Type</label>
                                    <select value={form.clientType} onChange={e => setForm({ ...form, clientType: e.target.value })} required style={inputStyle}>
                                        <option value="Person">Individual Person</option>
                                        <option value="Business">Business / Company</option>
                                        <option value="Organization">Non-Profit / Organization</option>
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                    <div><label style={labelStyle}>Phone Number</label><input value={form.telephoneNumber} onChange={e => setForm({ ...form, telephoneNumber: e.target.value })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                    <div><label style={labelStyle}>WhatsApp Number</label><input value={form.whatsappNumber} onChange={e => setForm({ ...form, whatsappNumber: e.target.value })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                    <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Email Address</label><input type="email" value={form.emailAddress} onChange={e => setForm({ ...form, emailAddress: e.target.value })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                </div>
                                <motion.button whileTap={{ scale: isSubmitting ? 1 : 0.98 }} type="submit" disabled={isSubmitting} style={{ ...btnStyle, width: '100%', justifyContent: 'center', opacity: isSubmitting ? 0.85 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>{isSubmitting ? 'Processing...' : 'Save Client'}</motion.button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* SUGGEST EDIT MODAL */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#fff', border: '2px solid #fce7f3', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: 550, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontWeight: 900, color: '#db2777' }}>Request Client Edit</h2>
                                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>Standard accounts cannot directly modify client data. <br />Your requested changes will be sent to an Administrator for validation.</p>
                                </div>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsEditModalOpen(false)} style={{ background: '#fdf2f8', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#db2777' }}><X size={18} /></motion.button>
                            </div>
                            <form onSubmit={submitEditRequest}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div><label style={labelStyle}>Given / Entity Name</label><input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required style={inputStyle} /></div>
                                    <div><label style={labelStyle}>Surname</label><input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} style={inputStyle} /></div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                    <div><label style={labelStyle}>Phone Number</label><input value={form.telephoneNumber} onChange={e => setForm({ ...form, telephoneNumber: e.target.value })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                    <div><label style={labelStyle}>WhatsApp Number</label><input value={form.whatsappNumber} onChange={e => setForm({ ...form, whatsappNumber: e.target.value })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                    <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Address</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                </div>
                                <motion.button whileTap={{ scale: isSubmitting ? 1 : 0.98 }} type="submit" disabled={isSubmitting} style={{ background: isSubmitting ? '#9d174d' : '#db2777', color: '#fff', border: 'none', borderRadius: '12px', padding: '1rem 1.5rem', fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', opacity: isSubmitting ? 0.85 : 1 }}><Send size={18} /> {isSubmitting ? 'Processing...' : 'Submit Request'}</motion.button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserClientManagement;
