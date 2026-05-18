import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Plus, X, Edit2, Trash2, Search, RefreshCw, AlertTriangle, UserCircle2, FileText, MapPin, Calendar, Landmark, Info, DollarSign, TrendingUp, CheckCircle2, Clock, FolderKanban, Building2 } from 'lucide-react';
import api from '../../api';
import '../../styles/modern-table.css';

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

    const activeProjects = projects.filter(p => p.startDate && new Date(p.startDate) <= new Date()).length;
    const totalValue = projects.reduce((sum, p) => sum + (p.value || 0), 0);

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '1.5rem' }}>
            {/* Header Section */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>Project Portfolio</h1>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>Manage and monitor organizational project tracking</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openModal()}
                        style={{
                            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '16px',
                            padding: '0.875rem 1.75rem',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.625rem',
                            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.35)',
                            transition: 'all 0.2s ease'
                        }}>
                        <Plus size={18} /> New Project
                    </motion.button>
                </div>

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Projects', value: projects.length, icon: FolderKanban, color: '#3b82f6', bg: '#eff6ff' },
                        { label: 'Active Projects', value: activeProjects, icon: CheckCircle2, color: '#10b981', bg: '#ecfdf5' },
                        { label: 'Portfolio Value', value: `$${totalValue.toLocaleString()}`, icon: DollarSign, color: '#f59e0b', bg: '#fffbeb' },
                        { label: 'Clients', value: clients.length, icon: Building2, color: '#8b5cf6', bg: '#f5f3ff' }
                    ].map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            style={{
                                background: '#fff',
                                borderRadius: '20px',
                                padding: '1.5rem',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                            <div style={{ background: stat.bg, padding: '12px', borderRadius: '14px', display: 'flex' }}>
                                <stat.icon size={22} color={stat.color} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>{stat.value}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Search Bar */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
                        <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search projects by name or ID..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                background: '#fff',
                                border: '1.5px solid #e2e8f0',
                                borderRadius: '14px',
                                padding: '0.875rem 1rem 0.875rem 3rem',
                                fontSize: '0.875rem',
                                color: '#0f172a',
                                outline: 'none',
                                fontWeight: 500,
                                transition: 'all 0.2s',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={fetchData}
                        style={{
                            background: '#f8fafc',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: '14px',
                            padding: '0.875rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                        <RefreshCw size={18} color="#64748b" />
                    </motion.button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                        <RefreshCw size={32} color="#64748b" />
                    </motion.div>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: '24px', padding: '4rem 2rem', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <FolderKanban size={64} color="#cbd5e1" style={{ marginBottom: '1.5rem' }} />
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#475569' }}>No projects found</h3>
                    <p style={{ margin: '0.5rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>{searchTerm ? 'Try adjusting your search terms' : 'Create your first project to get started'}</p>
                </div>
            ) : (
                <div className="modern-table-card">
                    <div className="modern-table-scroll">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Project</th>
                                    <th>Client</th>
                                    <th>Location</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th className="text-right">Value</th>
                                    <th className="text-center">Status</th>
                                    <th className="text-center" style={{ width: '180px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((p, idx) => {
                                    const isStarted = p.startDate && new Date(p.startDate) <= new Date();
                                    const isEnded = p.endDate && new Date(p.endDate) < new Date();
                                    const status = isEnded ? 'Completed' : isStarted ? 'Active' : 'Upcoming';
                                    const statusClass = isEnded ? 'completed' : isStarted ? 'active' : 'upcoming';

                                    return (
                                        <motion.tr
                                            key={p._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}>
                                            <td>
                                                <div className="modern-table-cell-primary">
                                                    <div className="modern-table-cell-icon" style={{ background: '#fffbeb' }}>
                                                        <Briefcase size={18} color="#f59e0b" />
                                                    </div>
                                                    <div>
                                                        <div className="modern-table-cell-title">{p.name}</div>
                                                        <span className="modern-table-cell-subtitle amber">{p.projectId}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="modern-table-cell-info">
                                                    <UserCircle2 size={16} color="#94a3b8" />
                                                    <span className="info-value">{p.client?.firstName} {p.client?.lastName}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="modern-table-cell-info muted">
                                                    <MapPin size={16} color="#94a3b8" />
                                                    <span>{p.location || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="modern-table-cell-info muted">
                                                    <Calendar size={16} color="#94a3b8" />
                                                    <span>{p.startDate ? new Date(p.startDate).toLocaleDateString() : 'TBD'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="modern-table-cell-info muted">
                                                    <Calendar size={16} color="#94a3b8" />
                                                    <span>{p.endDate ? new Date(p.endDate).toLocaleDateString() : 'TBD'}</span>
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <span className="modern-table-cell-value green">${(p.value || 0).toLocaleString()}</span>
                                            </td>
                                            <td className="text-center">
                                                <span className={`modern-table-status ${statusClass}`}>
                                                    {status === 'Active' ? <Clock size={10} /> : status === 'Completed' ? <CheckCircle2 size={10} /> : <TrendingUp size={10} />}
                                                    {status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="modern-table-actions">
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => setViewProject(p)}
                                                        title="View"
                                                        className="modern-table-action view">
                                                        <FileText size={14} />
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => openModal(p)}
                                                        title="Edit"
                                                        className="modern-table-action edit">
                                                        <Edit2 size={14} />
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => deleteProject(p._id)}
                                                        title="Delete"
                                                        className="modern-table-action delete">
                                                        <Trash2 size={14} />
                                                    </motion.button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="modern-table-footer">
                        <span className="footer-info">Showing {filtered.length} of {projects.length} projects</span>
                        <span className="footer-total">Total Value: <span className="total-value">${totalValue.toLocaleString()}</span></span>
                    </div>
                </div>
            )}

            {/* View Modal */}
            <AnimatePresence>
                {viewProject && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                        onClick={() => setViewProject(null)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ background: '#fff', borderRadius: '28px', padding: '2.5rem', width: '100%', maxWidth: 520, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', maxHeight: '85vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ background: '#fffbeb', padding: '14px', borderRadius: '16px' }}><Briefcase size={24} color="#f59e0b" /></div>
                                    <div>
                                        <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}>{viewProject.name}</h3>
                                        <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700, background: '#fffbeb', padding: '0.25rem 0.75rem', borderRadius: '8px', display: 'inline-block', marginTop: '0.5rem' }}>{viewProject.projectId}</span>
                                    </div>
                                </div>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setViewProject(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={20} /></motion.button>
                            </div>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {[
                                    { icon: Building2, label: 'ASSIGNED CLIENT', value: `${viewProject.client?.firstName} ${viewProject.client?.lastName}` },
                                    { icon: MapPin, label: 'LOCATION', value: viewProject.location || 'Undetermined' },
                                    { icon: Calendar, label: 'TIMELINE', value: `${viewProject.startDate ? new Date(viewProject.startDate).toLocaleDateString() : 'TBD'} → ${viewProject.endDate ? new Date(viewProject.endDate).toLocaleDateString() : 'TBD'}` },
                                    { icon: DollarSign, label: 'VALUATION', value: `$${(viewProject.value || 0).toLocaleString()}`, color: '#059669' }
                                ].map((item, idx) => (
                                    <div key={idx} style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ background: '#fff', padding: '10px', borderRadius: '12px', display: 'flex' }}><item.icon size={18} color="#64748b" /></div>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                                            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: item.color || '#0f172a', marginTop: '0.25rem' }}>{item.value}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <motion.button whileTap={{ scale: 0.98 }} onClick={() => setViewProject(null)} style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '14px', width: '100%', padding: '1rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', marginTop: '2rem' }}>Close</motion.button>
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
                        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                        onClick={() => setIsModalOpen(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ background: '#fff', borderRadius: '28px', padding: '2.5rem', width: '100%', maxWidth: 600, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.375rem', color: '#0f172a' }}>{editingProject ? 'Edit Project' : 'New Project'}</h2>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></motion.button>
                            </div>
                            <form onSubmit={saveProject}>
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Project Name</label>
                                    <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={{ width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#0f172a', outline: 'none', fontWeight: 500, boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ marginBottom: '1.25rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client Assignment</label>
                                        <button type="button" onClick={() => setIsInlineClient(!isInlineClient)} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>{isInlineClient ? 'Cancel' : '+ New Client'}</button>
                                    </div>
                                    {isInlineClient ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                            <input placeholder="First Name" value={inlineClientForm.firstName} onChange={e => setInlineClientForm({...inlineClientForm, firstName: e.target.value})} required style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                                            <input placeholder="Last Name" value={inlineClientForm.lastName} onChange={e => setInlineClientForm({...inlineClientForm, lastName: e.target.value})} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                                            <input placeholder="Phone Number" value={inlineClientForm.telephoneNumber} onChange={e => setInlineClientForm({...inlineClientForm, telephoneNumber: e.target.value})} required style={{ gridColumn: '1/-1', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                                        </div>
                                    ) : (
                                        <select value={form.client} onChange={e => setForm({...form, client: e.target.value})} required style={{ width: '100%', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}>
                                            <option value="" disabled>Select client...</option>
                                            {clients.map(c => <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>)}
                                        </select>
                                    )}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Start Date</label>
                                        <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} style={{ width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>End Date</label>
                                        <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} style={{ width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                </div>
                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</label>
                                    <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} style={{ width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Value ($)</label>
                                    <input type="number" value={form.value} onChange={e => setForm({...form, value: parseFloat(e.target.value) || 0})} style={{ width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                                <motion.button whileTap={{ scale: 0.98 }} type="submit" style={{ width: '100%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', borderRadius: '14px', padding: '1rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)' }}>{editingProject ? 'Update Project' : 'Create Project'}</motion.button>
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
                        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#fff', borderRadius: '28px', padding: '3rem', width: '100%', maxWidth: 440, textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)' }}>
                            <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '16px', display: 'inline-flex', marginBottom: '1.5rem' }}><AlertTriangle size={40} color="#ef4444" /></div>
                            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}>Confirm Deletion</h3>
                            <p style={{ color: '#64748b', marginTop: '0.75rem', marginBottom: '2rem', fontSize: '0.875rem', fontWeight: 500 }}>{confirmAction.message}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <motion.button whileTap={{ scale: 0.98 }} onClick={() => setConfirmAction(null)} style={{ padding: '0.875rem', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', color: '#475569' }}>Cancel</motion.button>
                                <motion.button whileTap={{ scale: 0.98 }} onClick={() => { confirmAction.onConfirm(); setConfirmAction(null); }} style={{ padding: '0.875rem', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)' }}>Delete</motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProjectManagement;
