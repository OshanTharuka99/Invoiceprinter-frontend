import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, RefreshCw, Send, Plus, X } from 'lucide-react';
import api from '../../api';

const UserClientManagement = ({ showToast }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);

    const initialForm = { firstName: '', lastName: '', clientType: 'Person', telephoneNumber: '', whatsappNumber: '', emailAddress: '', address: '' };
    const [form, setForm] = useState(initialForm);

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
        try {
            await api.post('/clients', form);
            showToast?.('Client entity securely created', 'success');
            setIsCreateModalOpen(false);
            fetchClients();
        } catch (error) {
            showToast?.(error.response?.data?.message || 'Error executing creation', 'error');
        }
    };

    const submitEditRequest = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/clients/${selectedClient._id}/request-edit`, form);
            showToast?.('Modification request transmitted to security clearance node.', 'success');
            setIsEditModalOpen(false);
        } catch (error) {
            showToast?.(error.response?.data?.message || 'Request failed to transmit', 'error');
        }
    };

    const filtered = clients.filter(c =>
        c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.clientId.toLowerCase().includes(searchTerm.toLowerCase())
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
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 800, color: '#0f172a' }}>Client Directory</h1>
                            <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>Read-Only visibility with dynamic override proposal systems.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} title="Locate Entity" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input type="text" placeholder="Entity search matrix..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', width: 280, outline: 'none', fontFamily: "'Outfit', sans-serif" }} />
                            </div>
                            <motion.button whileTap={{ scale: 0.95 }} title="Enroll New Agent" onClick={openCreateModal} style={btnStyle}><Plus size={18} /> Enroll Client</motion.button>
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Identifier & Node</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Class Type</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Comms Channels</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Security Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(c => (
                                <tr key={c._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{c.firstName} {c.lastName}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 700 }}>{c.clientId}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>{c.clientType}</span>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#475569' }}>
                                        {c.telephoneNumber && <div>📞 {c.telephoneNumber}</div>}
                                        {c.emailAddress && <div>📧 {c.emailAddress}</div>}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEditModal(c)} style={{ background: '#fdf2f8', color: '#db2777', border: '1px solid #fce7f3', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>Suggest Edit</motion.button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No entities map to current parameters.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {/* CREATE MODAL */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: 550, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <h2 style={{ margin: 0, fontWeight: 900 }}>Create General System Client</h2>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsCreateModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></motion.button>
                            </div>
                            <form onSubmit={saveNewClient}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div><label style={labelStyle}>Given / Entity Name</label><input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required style={inputStyle} /></div>
                                    <div><label style={labelStyle}>Surname</label><input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} style={inputStyle} /></div>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={labelStyle}>Schema Classification</label>
                                    <select value={form.clientType} onChange={e => setForm({ ...form, clientType: e.target.value })} required style={inputStyle}>
                                        <option value="Person">Single Actor</option>
                                        <option value="Business">Registered Commerce</option>
                                        <option value="Organization">Non-Profit / Network</option>
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                    <div><label style={labelStyle}>Phone Comms</label><input value={form.telephoneNumber} onChange={e => setForm({ ...form, telephoneNumber: e.target.value })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                    <div><label style={labelStyle}>WhatsApp ID</label><input value={form.whatsappNumber} onChange={e => setForm({ ...form, whatsappNumber: e.target.value })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                    <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Global E-Mail Hash</label><input type="email" value={form.emailAddress} onChange={e => setForm({ ...form, emailAddress: e.target.value })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                </div>
                                <motion.button whileTap={{ scale: 0.98 }} type="submit" style={{ ...btnStyle, width: '100%', justifyContent: 'center' }}>Compile Record in Datastore</motion.button>
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
                                    <h2 style={{ margin: 0, fontWeight: 900, color: '#db2777' }}>Propose Datastream Override</h2>
                                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>Standard accounts cannot forcibly rewrite verified client data. <br />Your modified parameters below will be sent to Central Authority for manual validation.</p>
                                </div>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsEditModalOpen(false)} style={{ background: '#fdf2f8', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#db2777' }}><X size={18} /></motion.button>
                            </div>
                            <form onSubmit={submitEditRequest}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div><label style={labelStyle}>Given / Entity Name</label><input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required style={inputStyle} /></div>
                                    <div><label style={labelStyle}>Surname</label><input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} style={inputStyle} /></div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                    <div><label style={labelStyle}>Phone Comms</label><input value={form.telephoneNumber} onChange={e => setForm({ ...form, telephoneNumber: e.target.value })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                    <div><label style={labelStyle}>WhatsApp ID</label><input value={form.whatsappNumber} onChange={e => setForm({ ...form, whatsappNumber: e.target.value })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                    <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Address Matrix</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                </div>
                                <motion.button whileTap={{ scale: 0.98 }} type="submit" style={{ background: '#db2777', color: '#fff', border: 'none', borderRadius: '12px', padding: '1rem 1.5rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}><Send size={18} /> Transmit Request Packet</motion.button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserClientManagement;
