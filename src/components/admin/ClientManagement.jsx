import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, X, Edit2, Trash2, Search, RefreshCw, AlertTriangle, Building2, UserCircle2, Landmark, FileText, Phone, Mail, MapPin, Hash } from 'lucide-react';
import api from '../../api';

const ClientManagement = ({ currentUser, showToast }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);
    const [viewClient, setViewClient] = useState(null);

    const initialForm = { firstName: '', lastName: '', clientType: 'Person', telephoneNumber: '', whatsappNumber: '', emailAddress: '', address: '' };
    const [form, setForm] = useState(initialForm);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const res = await api.get('/clients');
            setClients(res.data.data);
        } catch (error) { showToast?.('Failed to load clients', 'error'); } 
        finally { setLoading(false); }
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
        } else { setEditingClient(null); setForm(initialForm); }
        setIsModalOpen(true);
    };

    const saveClient = async (e) => {
        e.preventDefault();
        try {
            if (editingClient) { await api.put(`/clients/${editingClient._id}`, form); showToast?.('Client records updated', 'success'); }
            else { await api.post('/clients', form); showToast?.('New client registered', 'success'); }
            setIsModalOpen(false);
            fetchClients();
        } catch (error) { showToast?.(error.response?.data?.message || 'Protocol failure', 'error'); }
    };

    const deleteClient = (id) => {
        setConfirmAction({
            message: "Permanently delete this client? This will remove all associated data.",
            onConfirm: async () => {
                try { await api.delete(`/clients/${id}`); showToast?.('Client deleted', 'success'); fetchClients(); }
                catch (error) { showToast?.('Deletion failed', 'error'); }
            }
        });
    };

    const filtered = clients.filter(c => c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || c.clientId.toLowerCase().includes(searchTerm.toLowerCase()) || c.telephoneNumber?.includes(searchTerm));

    const cardStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
    const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#64748b', marginBottom: '0.6rem', textTransform: 'uppercase' };
    const inputStyle = { width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '0.9rem 1.25rem', color: '#0f172a', outline: 'none', fontWeight: 600, boxSizing: 'border-box' };

    const getIcon = (type) => {
        if(type === 'Business') return <Building2 size={16} color="#3b82f6" />;
        if(type === 'Organization') return <Landmark size={16} color="#8b5cf6" />;
        return <UserCircle2 size={16} color="#10b981" />;
    }

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            {loading ? ( <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><RefreshCw className="animate-spin" color="#64748b" /></div> ) : (
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
                                <Search size={16} title="Locate account" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input type="text" title="Enter search parameters" placeholder="Search accounts..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', width: 240, outline: 'none' }} />
                            </div>
                            <motion.button whileTap={{ scale: 0.95 }} title="Add a new Client" onClick={() => openModal()} style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={18} /> Add Client</motion.button>
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                <th style={{ padding: '1.25rem 1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>Client Profile</th>
                                <th style={{ padding: '1.25rem 1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>Contact Information</th>
                                <th style={{ padding: '1.25rem 1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>Client Type</th>
                                <th style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(c => (
                                <tr key={c._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1.25rem 1rem' }}>
                                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{c.firstName} {c.lastName}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700 }}>{c.clientId}</div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', fontSize: '0.85rem', color: '#475569' }}>
                                        {c.telephoneNumber && <div>📞 {c.telephoneNumber}</div>}
                                        {c.emailAddress && <div>📧 {c.emailAddress}</div>}
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f8fafc', padding: '4px 8px', borderRadius: '8px', width: 'fit-content', border: '1px solid #e2e8f0' }}>
                                            {getIcon(c.clientType)} <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>{c.clientType}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                            <motion.button whileTap={{ scale: 0.9 }} title="View Details" onClick={() => setViewClient(c)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight: 800, color: '#0f172a', display: 'flex', gap: '0.4rem', fontSize: '0.7rem' }}><FileText size={12} /> View</motion.button>
                                            <motion.button whileTap={{ scale: 0.9 }} title="Edit Records" onClick={() => openModal(c)} style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight: 800, color: '#2563eb', display: 'flex', gap: '0.4rem', fontSize: '0.7rem' }}><Edit2 size={12} /> Edit</motion.button>
                                            <motion.button whileTap={{ scale: 0.9 }} title="Delete Client" onClick={() => deleteClient(c._id)} style={{ background: '#fff1f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight: 800, color: '#ef4444', fontSize: '0.7rem' }}>Delete</motion.button>
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
                {viewClient && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#fff', borderRadius: '32px', padding: '3rem', width: '100%', maxWidth: 500, boxShadow: '0 50px 100px -20px rgba(0,0,0,0.4)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ background: '#3b82f615', color: '#3b82f6', padding: '12px', borderRadius: '15px' }}>{getIcon(viewClient.clientType)}</div>
                                    <div>
                                        <h3 style={{ margin: 0, fontWeight: 900 }}>{viewClient.firstName} {viewClient.lastName}</h3>
                                        <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 800 }}>{viewClient.clientId}</span>
                                    </div>
                                </div>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setViewClient(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={20}/></motion.button>
                            </div>
                            <div style={{ display: 'grid', gap: '1.25rem' }}>
                                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}><Phone size={16} color="#64748b"/> <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{viewClient.telephoneNumber || '--'}</div></div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}><Mail size={16} color="#64748b"/> <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{viewClient.emailAddress || '--'}</div></div>
                                    <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}><MapPin size={16} color="#64748b" style={{marginTop: '4px'}}/> <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', lineHeight: '1.4' }}>{viewClient.address || '--'}</div></div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1, background: '#f1f5f9', padding: '1rem', borderRadius: '16px', textAlign: 'center' }}><div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b' }}>ENTITY TYPE</div><div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{viewClient.clientType.toUpperCase()}</div></div>
                                    <div style={{ flex: 1, background: '#f1f5f9', padding: '1rem', borderRadius: '16px', textAlign: 'center' }}><div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b' }}>REGISTERED</div><div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{new Date(viewClient.createdAt).toLocaleDateString()}</div></div>
                                </div>
                            </div>
                            <motion.button whileTap={{ scale: 0.98 }} onClick={() => setViewClient(null)} style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '14px', width: '100%', padding: '1rem', fontWeight: 800, cursor: 'pointer', marginTop: '2rem' }}>Close</motion.button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* EDIT/ADD MODAL (Already updated with tooltips) */}
            <AnimatePresence>
                {isModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#fff', borderRadius: '32px', padding: '3rem', width: '100%', maxWidth: 600, boxShadow: '0 50px 100px -20px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                                <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem' }}>{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
                                <motion.button whileTap={{ scale: 0.8 }} title="Close Modal" onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={24} /></motion.button>
                            </div>
                            <form onSubmit={saveClient}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                    <div><label style={labelStyle}>Given Name / Entity</label><input title="First Name/Business Name" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required style={inputStyle} /></div>
                                    <div><label style={labelStyle}>Last Name (Optional)</label><input title="Surname or secondary name" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} style={inputStyle} /></div>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={labelStyle}>Class Status</label>
                                    <select title="Select account classification" value={form.clientType} onChange={e => setForm({...form, clientType: e.target.value})} required style={inputStyle}>
                                        <option value="Person">Individual Person</option>
                                        <option value="Business">Business / Company</option>
                                        <option value="Organization">Non-Profit / Organization</option>
                                    </select>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '24px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                                    <h4 style={{ margin: '0 0 1.5rem 0', fontWeight: 800, color: '#0f172a' }}>Contact Information</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div><label style={labelStyle}>Phone Number *</label><input title="Primary telephone" value={form.telephoneNumber} onChange={e => setForm({...form, telephoneNumber: e.target.value})} required style={{...inputStyle, background: '#fff'}} /></div>
                                        <div><label style={labelStyle}>WhatsApp Number</label><input title="WhatsApp handle" value={form.whatsappNumber} onChange={e => setForm({...form, whatsappNumber: e.target.value})} style={{...inputStyle, background: '#fff'}} /></div>
                                        <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Email Address</label><input title="Electronic mail address" type="email" value={form.emailAddress} onChange={e => setForm({...form, emailAddress: e.target.value})} style={{...inputStyle, background: '#fff'}} /></div>
                                        <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Address</label><input title="Geographic location" value={form.address} onChange={e => setForm({...form, address: e.target.value})} style={{...inputStyle, background: '#fff'}} /></div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <motion.button whileTap={{ scale: 0.98 }} title="Save client" type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '14px', width: '100%', padding: '1rem', fontWeight: 800, cursor: 'pointer', justifyContent: 'center', display: 'flex' }}>SAVE CLIENT</motion.button>
                                </div>
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
                            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', color: '#0f172a' }}>Confirm Deletion?</h3>
                            <p style={{ color: '#64748b', marginTop: '1rem', marginBottom: '2.5rem', lineHeight: '1.6', fontWeight:600 }}>{confirmAction.message}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <motion.button whileTap={{ scale: 0.95 }} title="Cancel" onClick={() => setConfirmAction(null)} style={{ padding: '1rem', borderRadius: '16px', border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 800, color: '#0f172a' }}>Cancel</motion.button>
                                <motion.button whileTap={{ scale: 0.95 }} title="Delete" onClick={() => { confirmAction.onConfirm(); setConfirmAction(null); }} style={{ padding: '1rem', borderRadius: '16px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 800 }}>Delete</motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ClientManagement;
