import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, X, Edit3, Trash2, Search, RefreshCw, AlertTriangle, Building2, UserCircle2, Landmark } from 'lucide-react';
import api from '../../api';

const ClientManagement = ({ currentUser, showToast }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);

    const initialForm = { firstName: '', lastName: '', clientType: 'Person', telephoneNumber: '', whatsappNumber: '', emailAddress: '', address: '' };
    const [form, setForm] = useState(initialForm);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const res = await api.get('/clients');
            setClients(res.data.data);
        } catch (error) {
            showToast?.('Failed to load clients', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchClients(); }, []);

    const openModal = (client = null) => {
        if (client) {
            setEditingClient(client);
            setForm({
                firstName: client.firstName, lastName: client.lastName, clientType: client.clientType,
                telephoneNumber: client.telephoneNumber || '', whatsappNumber: client.whatsappNumber || '',
                emailAddress: client.emailAddress || '', address: client.address || ''
            });
        } else {
            setEditingClient(null);
            setForm(initialForm);
        }
        setIsModalOpen(true);
    };

    const saveClient = async (e) => {
        e.preventDefault();
        try {
            if (editingClient) {
                await api.put(`/clients/${editingClient._id}`, form);
                showToast?.('Client updated', 'success');
            } else {
                await api.post('/clients', form);
                showToast?.('Client added', 'success');
            }
            setIsModalOpen(false);
            fetchClients();
        } catch (error) {
            showToast?.(error.response?.data?.message || 'Error saving client', 'error');
        }
    };

    const deleteClient = (id) => {
        setConfirmAction({
            message: "Permanently delete this client? This will remove all associated contact datums.",
            onConfirm: async () => {
                try {
                    await api.delete(`/clients/${id}`);
                    showToast?.('Client deleted', 'success');
                    fetchClients();
                } catch (error) {
                    showToast?.('Error deleting client', 'error');
                }
            }
        });
    };

    const filtered = clients.filter(c => 
        c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.clientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.telephoneNumber?.includes(searchTerm)
    );

    const cardStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
    const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#64748b', marginBottom: '0.6rem', textTransform: 'uppercase' };
    const inputStyle = { width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '0.9rem 1.25rem', color: '#0f172a', outline: 'none', fontWeight: 600, boxSizing: 'border-box' };
    const btnStyle = { background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' };

    const getIcon = (type) => {
        if(type === 'Business') return <Building2 size={16} color="#3b82f6" />;
        if(type === 'Organization') return <Landmark size={16} color="#8b5cf6" />;
        return <UserCircle2 size={16} color="#10b981" />;
    }

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><RefreshCw className="animate-spin" color="#64748b" /></div>
            ) : (
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ background: '#3b82f615', color: '#3b82f6', padding: '10px', borderRadius: '12px' }}><Users size={24} /></div> 
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 900 }}>Client Directory</h3>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>Manage all business entities securely.</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input type="text" placeholder="Search accounts..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', width: 240, outline: 'none' }} />
                            </div>
                            <motion.button whileTap={{ scale: 0.95 }} title="Register a new Client" onClick={() => openModal()} style={btnStyle}><Plus size={18} /> Add Client</motion.button>
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Client Profile</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Contact</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Type</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(c => (
                                <tr key={c._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{c.firstName} {c.lastName}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 700 }}>{c.clientId}</div>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#475569' }}>
                                        {c.telephoneNumber && <div>📞 {c.telephoneNumber}</div>}
                                        {c.emailAddress && <div>📧 {c.emailAddress}</div>}
                                        {!c.telephoneNumber && !c.emailAddress && <div>📍 {c.address}</div>}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f8fafc', padding: '4px 8px', borderRadius: '8px', width: 'fit-content', border: '1px solid #e2e8f0' }}>
                                            {getIcon(c.clientType)} <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>{c.clientType}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <motion.button whileTap={{ scale: 0.9 }} title="Edit Client" onClick={() => openModal(c)} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}><Edit3 size={16} /></motion.button>
                                            <motion.button whileTap={{ scale: 0.9 }} title="Delete Client" onClick={() => deleteClient(c._id)} style={{ background: '#fff1f2', color: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={16} /></motion.button>
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
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: 550, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <h2 style={{ margin: 0, fontWeight: 900 }}>{editingClient ? 'Edit Profile' : 'Register Client'}</h2>
                            <motion.button whileTap={{ scale: 0.9 }} title="Close" onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></motion.button>
                        </div>
                        <form onSubmit={saveClient}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div><label style={labelStyle}>Primary / First Name</label><input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required style={inputStyle} /></div>
                                <div><label style={labelStyle}>Last Name (Optional)</label><input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} style={inputStyle} /></div>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={labelStyle}>Entity Type</label>
                                <select value={form.clientType} onChange={e => setForm({...form, clientType: e.target.value})} required style={inputStyle}>
                                    <option value="Person">Individual Person</option>
                                    <option value="Business">Business / Company</option>
                                    <option value="Organization">Non-Profit / Organization</option>
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <div style={{ gridColumn: '1 / -1' }}><h4 style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Contact Details</h4><p style={{ margin: '0.2rem 0 1rem', fontSize: '0.75rem', color: '#64748b' }}>Provide at least one method of contact.</p></div>
                                <div><label style={labelStyle}>Phone Number *</label><input value={form.telephoneNumber} onChange={e => setForm({...form, telephoneNumber: e.target.value})} required style={{...inputStyle, background: '#fff'}} /></div>
                                <div><label style={labelStyle}>WhatsApp Number</label><input value={form.whatsappNumber} onChange={e => setForm({...form, whatsappNumber: e.target.value})} style={{...inputStyle, background: '#fff'}} /></div>
                                <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Email Address</label><input type="email" value={form.emailAddress} onChange={e => setForm({...form, emailAddress: e.target.value})} style={{...inputStyle, background: '#fff'}} /></div>
                                <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Physical Address</label><input value={form.address} onChange={e => setForm({...form, address: e.target.value})} style={{...inputStyle, background: '#fff'}} /></div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <motion.button whileTap={{ scale: 0.98 }} type="button" onClick={() => setIsModalOpen(false)} style={{ ...btnStyle, background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', width: '100%', justifyContent: 'center' }}>Cancel</motion.button>
                                <motion.button whileTap={{ scale: 0.98 }} type="submit" style={{ ...btnStyle, width: '100%', justifyContent: 'center' }}>Save Data</motion.button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

             {/* CONFIRMATION MODAL */}
             <AnimatePresence>
                {confirmAction && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: 400, textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                            <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem', margin: '0 auto' }} />
                            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}>Are you sure?</h3>
                            <p style={{ color: '#64748b', marginTop: '0.8rem', marginBottom: '2rem', lineHeight: '1.5' }}>{confirmAction.message}</p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setConfirmAction(null)} style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 700, color: '#0f172a' }}>Cancel</motion.button>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => { confirmAction.onConfirm(); setConfirmAction(null); }} style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Yes, Delete</motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ClientManagement;
