import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Plus, X, Edit2, Trash2, Search, RefreshCw, AlertTriangle, UserCircle2, FileText, MapPin, Calendar, Landmark, Info, DollarSign } from 'lucide-react';
import api from '../../api';

const ProjectManagement = ({ currentUser, showToast }) => {
    const [projects, setProjects] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewProject, setViewProject] = useState(null);
    const [editingProject, setEditingProject] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);

    const initialForm = { name: '', client: '', location: '', startDate: '', endDate: '', value: 0 };
    const [form, setForm] = useState(initialForm);

    const [isInlineClient, setIsInlineClient] = useState(false);
    const [inlineClientForm, setInlineClientForm] = useState({ firstName: '', lastName: '', clientType: 'Business', telephoneNumber: '', whatsappNumber: '', emailAddress: '', address: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [projRes, cliRes] = await Promise.all([api.get('/projects'), api.get('/clients')]);
            setProjects(projRes.data.data);
            setClients(cliRes.data.data);
        } catch (error) { showToast?.('Failed to load project database', 'error'); } 
        finally { setLoading(false); }
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
        } else { setEditingProject(null); setForm(initialForm); }
        setIsInlineClient(false);
        setIsModalOpen(true);
    };

    const saveProject = async (e) => {
        e.preventDefault();
        try {
            let finalClientId = form.client;
            if (isInlineClient) {
                if (!inlineClientForm.firstName || !inlineClientForm.telephoneNumber) return showToast?.('Identity records incomplete', 'error');
                const newCli = await api.post('/clients', inlineClientForm);
                finalClientId = newCli.data.data._id;
                showToast?.('Identity automatically registered', 'success');
            } else if (!finalClientId) return showToast?.('Account assignment required', 'error');
            const payload = { ...form, client: finalClientId };
            if (editingProject) { await api.put(`/projects/${editingProject._id}`, payload); showToast?.('Blueprint synchronized', 'success'); }
            else { await api.post('/projects', payload); showToast?.('Definition established', 'success'); }
            setIsModalOpen(false);
            fetchData();
        } catch (error) { showToast?.(error.response?.data?.message || 'Transaction failure', 'error'); }
    };

    const deleteProject = (id) => {
        setConfirmAction({
            message: "Verify command to eliminate project blueprint from master portfolio.",
            onConfirm: async () => {
                try { await api.delete(`/projects/${id}`); showToast?.('Blueprint eliminated', 'success'); fetchData(); }
                catch (error) { showToast?.('Elimination protocol failed', 'error'); }
            }
        });
    };

    const filtered = projects.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.projectId.toLowerCase().includes(searchTerm.toLowerCase()));

    const cardStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
    const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#64748b', marginBottom: '0.6rem', textTransform: 'uppercase' };
    const inputStyle = { width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '0.9rem 1.25rem', color: '#0f172a', outline: 'none', fontWeight: 600, boxSizing: 'border-box' };

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            {loading ? ( <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><RefreshCw className="animate-spin" color="#64748b" /></div> ) : (
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ background: '#f59e0b15', color: '#f59e0b', padding: '10px', borderRadius: '12px' }}><Briefcase size={24} /></div> 
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 900 }}>Project Portfolio</h3>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>Manage structural organizational project tracking.</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} title="Locate blueprint" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input type="text" title="Enter search parameters" placeholder="Locate by Name/ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', width: 240, outline: 'none' }} />
                            </div>
                            <motion.button whileTap={{ scale: 0.95 }} title="Initialize a new Project Blueprint" onClick={() => openModal()} style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={18} /> New Project</motion.button>
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                <th style={{ padding: '1.25rem 1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>Blueprint & ID</th>
                                <th style={{ padding: '1.25rem 1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>Assigned Identity</th>
                                <th style={{ padding: '1.25rem 1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>Operational Timeline</th>
                                <th style={{ padding: '1.25rem 1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>Location</th>
                                <th style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>Management</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => (
                                <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1.25rem 1rem' }}>
                                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{p.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>{p.projectId}</div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem' }}>
                                        <div style={{ fontWeight: 700, color: '#475569', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><UserCircle2 size={14} color="#94a3b8" /> {p.client?.firstName} {p.client?.lastName}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', paddingLeft: '1.2rem', fontWeight: 600 }}>{p.client?.telephoneNumber || 'N/A'}</div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', fontSize: '0.85rem', color: '#475569', fontWeight: 700 }}>
                                        {p.startDate ? new Date(p.startDate).toLocaleDateString() : 'TBD'} <span style={{color: '#cbd5e1'}}>→</span> {p.endDate ? new Date(p.endDate).toLocaleDateString() : 'TBD'}
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', fontWeight: 700, color: '#64748b', fontSize: '0.85rem' }}>{p.location || '-- SITE UNKNOWN --'}</td>
                                    <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                            <motion.button whileTap={{ scale: 0.9 }} title="Inspect Blueprint Specifications" onClick={() => setViewProject(p)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight: 800, color: '#0f172a', display: 'flex', gap: '0.4rem', fontSize: '0.7rem' }}><FileText size={12} /> View</motion.button>
                                            <motion.button whileTap={{ scale: 0.9 }} title="Modify Blueprint Configuration" onClick={() => openModal(p)} style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight: 800, color: '#2563eb', display: 'flex', gap: '0.4rem', fontSize: '0.7rem' }}><Edit2 size={12} /> Edit</motion.button>
                                            <motion.button whileTap={{ scale: 0.9 }} title="Initiate Elimination Sequence" onClick={() => deleteProject(p._id)} style={{ background: '#fff1f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight: 800, color: '#ef4444', fontSize: '0.7rem' }}>Delete</motion.button>
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
                {viewProject && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#fff', borderRadius: '32px', padding: '3rem', width: '100%', maxWidth: 500, boxShadow: '0 50px 100px -20px rgba(0,0,0,0.4)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ background: '#f59e0b15', color: '#f59e0b', padding: '12px', borderRadius: '15px' }}><Briefcase size={24} /></div>
                                    <div>
                                        <h3 style={{ margin: 0, fontWeight: 900 }}>{viewProject.name}</h3>
                                        <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 800 }}>{viewProject.projectId}</span>
                                    </div>
                                </div>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setViewProject(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={20}/></motion.button>
                            </div>
                            <div style={{ display: 'grid', gap: '1.25rem' }}>
                                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                                        <Landmark size={18} color="#64748b"/>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b' }}>ASSIGNED ACCOUNT</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{viewProject.client?.firstName} {viewProject.client?.lastName}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                                        <MapPin size={18} color="#64748b"/>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b' }}>OPERATIONAL GEOGRAPHY</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{viewProject.location || 'Undetermined'}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                                        <Calendar size={18} color="#64748b"/>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b' }}>OPERATIONAL TIMELINE</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{viewProject.startDate ? new Date(viewProject.startDate).toLocaleDateString() : 'TBD'} TO {viewProject.endDate ? new Date(viewProject.endDate).toLocaleDateString() : 'TBD'}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <DollarSign size={18} color="#64748b"/>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b' }}>PORTFOLIO VALUATION</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#059669' }}>{viewProject.value ? viewProject.value.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <motion.button whileTap={{ scale: 0.98 }} onClick={() => setViewProject(null)} style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '14px', width: '100%', padding: '1.1rem', fontWeight: 800, cursor: 'pointer', marginTop: '2.5rem' }}>Close Inspector</motion.button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL (Already updated) */}
            <AnimatePresence>
                {isModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#fff', borderRadius: '32px', padding: '3rem', width: '100%', maxWidth: 600, boxShadow: '0 50px 100px -20px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                                <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem' }}>{editingProject ? 'Sync Blueprint' : 'Define Blueprint'}</h2>
                                <motion.button whileTap={{ scale: 0.8 }} title="Close Modal" onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={24} /></motion.button>
                            </div>
                            <form onSubmit={saveProject}>
                                <div style={{ marginBottom: '1.5rem' }}><label style={labelStyle}>Designation Name</label><input title="Project nomenclature" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={inputStyle} /></div>
                                <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '2rem', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <label style={{...labelStyle, marginBottom: 0}}>Identity Assignment</label>
                                        <button type="button" title="Establish new identity directly" onClick={() => setIsInlineClient(!isInlineClient)} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer' }}>{isInlineClient ? 'CANCEL' : '+ DEFINE NEW'}</button>
                                    </div>
                                    {isInlineClient ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                            <input title="Identity first name" placeholder="First Name" value={inlineClientForm.firstName} onChange={e => setInlineClientForm({...inlineClientForm, firstName: e.target.value})} required style={{...inputStyle, background: '#fff'}} />
                                            <input title="Identity last name" placeholder="Last Name" value={inlineClientForm.lastName} onChange={e => setInlineClientForm({...inlineClientForm, lastName: e.target.value})} style={{...inputStyle, background: '#fff'}} />
                                            <div style={{ gridColumn: '1/-1' }}><input title="Identity contact details" placeholder="Phone Number" value={inlineClientForm.telephoneNumber} onChange={e => setInlineClientForm({...inlineClientForm, telephoneNumber: e.target.value})} required style={{...inputStyle, background: '#fff'}} /></div>
                                        </div>
                                    ) : (
                                        <select title="Map blueprint to existing identity" value={form.client} onChange={e => setForm({...form, client: e.target.value})} required style={{...inputStyle, background: '#fff'}}><option value="" disabled>Select identity index...</option>{clients.map(c => <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>)}</select>
                                    )}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2.5rem' }}>
                                    <div><label style={labelStyle}>Start Phase</label><input title="Define commencement date" type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} style={inputStyle} /></div>
                                    <div><label style={labelStyle}>Terminal Phase</label><input title="Define target completion date" type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} style={inputStyle} /></div>
                                    <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Site Location</label><input title="Define operational geography" value={form.location} onChange={e => setForm({...form, location: e.target.value})} style={inputStyle} /></div>
                                </div>
                                <motion.button whileTap={{ scale: 0.98 }} title="Commit blueprint to portfolio database" type="submit" style={{ ...inputStyle, background: '#10b981', color: '#fff', border: 'none', justifyContent: 'center', padding: '1.25rem', fontSize: '1rem' }}>EXECUTE SYNCHRONIZATION</motion.button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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

export default ProjectManagement;
