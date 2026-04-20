import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Plus, X, Edit3, Trash2, Search, RefreshCw, AlertTriangle, Building2, UserCircle2, Landmark } from 'lucide-react';
import api from '../../api';

const ProjectManagement = ({ currentUser, showToast }) => {
    const [projects, setProjects] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);

    // Forms
    const initialForm = { name: '', client: '', location: '', startDate: '', endDate: '', value: 0 };
    const [form, setForm] = useState(initialForm);

    const [isInlineClient, setIsInlineClient] = useState(false);
    const [inlineClientForm, setInlineClientForm] = useState({ firstName: '', lastName: '', clientType: 'Business', telephoneNumber: '', whatsappNumber: '', emailAddress: '', address: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [projRes, cliRes] = await Promise.all([
                api.get('/projects'),
                api.get('/clients')
            ]);
            setProjects(projRes.data.data);
            setClients(cliRes.data.data);
        } catch (error) {
            showToast?.('Failed to load project database', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const openModal = (proj = null) => {
        if (proj) {
            setEditingProject(proj);
            setForm({
                name: proj.name, client: proj.client?._id || '', location: proj.location || '',
                startDate: proj.startDate ? proj.startDate.split('T')[0] : '',
                endDate: proj.endDate ? proj.endDate.split('T')[0] : '', value: proj.value || 0
            });
        } else {
            setEditingProject(null);
            setForm(initialForm);
        }
        setIsInlineClient(false);
        setInlineClientForm({ firstName: '', lastName: '', clientType: 'Business', telephoneNumber: '', whatsappNumber: '', emailAddress: '', address: '' });
        setIsModalOpen(true);
    };

    const saveProject = async (e) => {
        e.preventDefault();
        try {
            let finalClientId = form.client;

            if (isInlineClient) {
                if (!inlineClientForm.firstName || !inlineClientForm.telephoneNumber) {
                    return showToast?.('Please provide an entity name and telephone number for the new client.', 'error');
                }
                const newCli = await api.post('/clients', inlineClientForm);
                finalClientId = newCli.data.data._id;
                showToast?.('Inline client automatically registered', 'success');
            } else if (!finalClientId) {
                return showToast?.('Please assign this project to a client.', 'error');
            }

            const payload = { ...form, client: finalClientId };

            if (editingProject) {
                await api.put(`/projects/${editingProject._id}`, payload);
                showToast?.('Project successfully updated', 'success');
            } else {
                await api.post('/projects', payload);
                showToast?.('Project successfully initialized', 'success');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            showToast?.(error.response?.data?.message || 'Transaction failed', 'error');
        }
    };

    const deleteProject = (id) => {
        setConfirmAction({
            message: "Permanently terminate this project database record?",
            onConfirm: async () => {
                try {
                    await api.delete(`/projects/${id}`);
                    showToast?.('Project permanently deleted', 'success');
                    fetchData();
                } catch (error) {
                    showToast?.('Failed to drop project', 'error');
                }
            }
        });
    };

    const formatPriceString = (val) => {
        if (!val) return '';
        const parts = val.toString().split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join('.');
    };

    const handleValueChange = (e) => {
        let val = e.target.value.replace(/,/g, '');
        if (val === '' || /^\d*\.?\d*$/.test(val)) {
            setForm({...form, value: val});
        }
    };

    const filtered = projects.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.projectId.toLowerCase().includes(searchTerm.toLowerCase())
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
                            <div style={{ background: '#f59e0b15', color: '#f59e0b', padding: '10px', borderRadius: '12px' }}><Briefcase size={24} /></div> 
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 900 }}>Project Portfolio</h3>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>Centrally manage all organizational project tracking.</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input type="text" placeholder="Locate by Name/ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', width: 240, outline: 'none' }} />
                            </div>
                            <motion.button whileTap={{ scale: 0.95 }} title="Initialize a new Project" onClick={() => openModal()} style={btnStyle}><Plus size={18} /> New Project</motion.button>
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Project Code & Nomenclature</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Assigned Client</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Timeline</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Location</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Controls</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => (
                                <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{p.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 700 }}>{p.projectId}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 700, color: '#475569', fontSize: '0.9rem' }}>{p.client?.firstName} {p.client?.lastName}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.client?.telephoneNumber || p.client?.emailAddress || 'No primary contact'}</div>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#475569' }}>
                                        {p.startDate ? new Date(p.startDate).toLocaleDateString() : 'TBD'} <span style={{color: '#cbd5e1'}}>→</span> {p.endDate ? new Date(p.endDate).toLocaleDateString() : 'TBD'}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#64748b' }}>{p.location || '-'}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <motion.button whileTap={{ scale: 0.9 }} title="Edit Configuration" onClick={() => openModal(p)} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}><Edit3 size={16} /></motion.button>
                                            <motion.button whileTap={{ scale: 0.9 }} title="Drop Database Entity" onClick={() => deleteProject(p._id)} style={{ background: '#fff1f2', color: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={16} /></motion.button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No project blueprints extracted.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: 550, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <h2 style={{ margin: 0, fontWeight: 900 }}>{editingProject ? 'Modify Blueprint' : 'Project Definition'}</h2>
                            <motion.button whileTap={{ scale: 0.9 }} title="Discard" onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></motion.button>
                        </div>
                        <form onSubmit={saveProject}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={labelStyle}>Project Name</label>
                                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={inputStyle} placeholder="e.g. Tower Construction Phase IV" />
                            </div>

                            <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <label style={{...labelStyle, marginBottom: 0}}>Assigned Client</label>
                                    {!isInlineClient ? (
                                        <button type="button" onClick={() => setIsInlineClient(true)} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Plus size={14}/> Create New Client</button>
                                    ) : (
                                        <button type="button" onClick={() => setIsInlineClient(false)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><X size={14}/> Cancel Creation</button>
                                    )}
                                </div>
                                
                                {!isInlineClient ? (
                                    <select value={form.client} onChange={e => setForm({...form, client: e.target.value})} required style={{...inputStyle, background: '#fff'}}>
                                        <option value="" disabled>--- Select Existing Client ---</option>
                                        {clients.map(c => <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>)}
                                    </select>
                                ) : (
                                    <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
                                            <div><label style={labelStyle}>First Name</label><input value={inlineClientForm.firstName} onChange={e => setInlineClientForm({...inlineClientForm, firstName: e.target.value})} required style={{...inputStyle, background: '#fff', padding: '0.7rem 1rem'}} /></div>
                                            <div><label style={labelStyle}>Last Name</label><input value={inlineClientForm.lastName} onChange={e => setInlineClientForm({...inlineClientForm, lastName: e.target.value})} style={{...inputStyle, background: '#fff', padding: '0.7rem 1rem'}} /></div>
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <label style={labelStyle}>Client Type</label>
                                                <select value={inlineClientForm.clientType} onChange={e => setInlineClientForm({...inlineClientForm, clientType: e.target.value})} style={{...inputStyle, background: '#fff', padding: '0.7rem 1rem'}}>
                                                    <option value="Person">Individual Person</option>
                                                    <option value="Business">Business / Company</option>
                                                    <option value="Organization">Non-Profit / Organization</option>
                                                </select>
                                            </div>
                                            <div style={{ gridColumn: 'span 2' }}><h4 style={{ margin: '0.5rem 0 0.5rem', fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>Contact Details</h4></div>
                                            <div><label style={labelStyle}>Phone Number</label><input value={inlineClientForm.telephoneNumber} onChange={e => setInlineClientForm({...inlineClientForm, telephoneNumber: e.target.value})} style={{...inputStyle, background: '#fff', padding: '0.7rem 1rem'}} /></div>
                                            <div><label style={labelStyle}>WhatsApp</label><input value={inlineClientForm.whatsappNumber} onChange={e => setInlineClientForm({...inlineClientForm, whatsappNumber: e.target.value})} style={{...inputStyle, background: '#fff', padding: '0.7rem 1rem'}} /></div>
                                            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Email Address</label><input type="email" value={inlineClientForm.emailAddress} onChange={e => setInlineClientForm({...inlineClientForm, emailAddress: e.target.value})} style={{...inputStyle, background: '#fff', padding: '0.7rem 1rem'}} /></div>
                                            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Physical Address</label><input value={inlineClientForm.address} onChange={e => setInlineClientForm({...inlineClientForm, address: e.target.value})} style={{...inputStyle, background: '#fff', padding: '0.7rem 1rem'}} /></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div><label style={labelStyle}>Start Date</label><input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} style={inputStyle} /></div>
                                <div><label style={labelStyle}>End Date</label><input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} style={inputStyle} /></div>
                                <div><label style={labelStyle}>Location</label><input value={form.location} onChange={e => setForm({...form, location: e.target.value})} style={inputStyle} placeholder="Site Location" /></div>
                                <div><label style={labelStyle}>Project Value</label><input type="text" value={formatPriceString(form.value)} onChange={handleValueChange} style={inputStyle} placeholder="0.00" /></div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <motion.button whileTap={{ scale: 0.98 }} type="button" onClick={() => setIsModalOpen(false)} style={{ ...btnStyle, background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', width: '100%', justifyContent: 'center' }}>Cancel</motion.button>
                                <motion.button whileTap={{ scale: 0.98 }} type="submit" style={{ ...btnStyle, width: '100%', justifyContent: 'center' }}>Save Project</motion.button>
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
                            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}>Are you absolutely sure?</h3>
                            <p style={{ color: '#64748b', marginTop: '0.8rem', marginBottom: '2rem', lineHeight: '1.5' }}>{confirmAction.message}</p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setConfirmAction(null)} style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 700, color: '#0f172a' }}>Cancel</motion.button>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => { confirmAction.onConfirm(); setConfirmAction(null); }} style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Execute Wipe</motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProjectManagement;
