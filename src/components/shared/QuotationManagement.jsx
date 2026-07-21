import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, X, Search, RefreshCw, Printer, AlertTriangle, ShieldAlert, CheckCircle, Briefcase, Trash2, Edit3, Clock, AlertCircle } from 'lucide-react';
import api from '../../api';
import useSubmitGuard from '../../utils/useSubmitGuard';
import PriceInput from '../../utils/PriceInput';
import { calculateDocumentTotals } from '../../utils/calculateDocumentTotals';
import { openA4PrintWindow, buildPrintFileName } from '../../utils/printDocument';
import QuotationTemplate from './QuotationTemplate';
import './QuotationManagement.css';
import '../../styles/modern-table.css';

const QuotationManagement = ({ currentUser, showToast }) => {
    const [quotations, setQuotations] = useState([]);
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [businessData, setBusinessData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Active');
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'root';
    const isRoot = currentUser?.role === 'root';

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [creationMode, setCreationMode] = useState('automatic'); // 'automatic' or 'manual'
    const [editingQuotation, setEditingQuotation] = useState(null);
    const [editNote, setEditNote] = useState('');
    const [historyQuotation, setHistoryQuotation] = useState(null);

    // View/Print
    const [viewQuotation, setViewQuotation] = useState(null);
    const printRef = useRef();

    // Deletion Modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [quotationToDelete, setQuotationToDelete] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');

    const [projects, setProjects] = useState([]);
    const initialForm = {
        clientRef: '',
        projectId: '',
        deliveryAddress: '',
        customDuration: '',
        customUnit: 'days',
        manualClientDetails: { title: 'Mr', organization: '', name: '', address: '', telephoneNumber: '', emailAddress: '' },
        items: [],
        subTotal: 0,
        appliedDiscounts: [],
        discountTotal: 0,
        hasTax: false, appliedTaxes: [], taxTotal: 0,
        finalTotal: 0,
        currency: 'primary',
        validDate: ''
    };
    const [form, setForm] = useState(initialForm);
    const [applyDiscountMode, setApplyDiscountMode] = useState(false);
    const [customDiscount, setCustomDiscount] = useState({ type: 'percentage', value: 0 });
    const { isSubmitting, runGuarded } = useSubmitGuard();

    const isWithin30Days = (createdAt) => {
        const diffMs = Date.now() - new Date(createdAt);
        return diffMs / (1000 * 60 * 60 * 24) <= 30;
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [qRes, cRes, pRes, bRes, prRes] = await Promise.all([
                api.get('/quotations'),
                api.get('/clients'),
                api.get('/products?includeSerials=true'),
                api.get('/business'),
                api.get('/projects')
            ]);
            setQuotations(qRes.data.data);
            setClients(cRes.data.data);
            setProducts(pRes.data.data);
            setProjects(prRes.data.data);
            if (bRes.data.data.details) setBusinessData(bRes.data.data.details);
        } catch (error) {
            showToast?.('Error fetching metrics', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handlePrint = () => {
        if (!viewQuotation) return;
        const qId = viewQuotation.quotationId || 'QN';
        const clientName = viewQuotation.clientRef
            ? (viewQuotation.clientRef.firstName + (viewQuotation.clientRef.lastName ? '_' + viewQuotation.clientRef.lastName : ''))
            : (viewQuotation.manualClientDetails?.organization || viewQuotation.manualClientDetails?.name || 'Client');
        openA4PrintWindow(
            printRef.current,
            buildPrintFileName(qId, clientName, viewQuotation.createdAt),
        );
    };

    const calculateTotals = calculateDocumentTotals;

    const openCreation = (mode) => {
        setCreationMode(mode);
        setEditingQuotation(null);
        setEditNote('');

        const initialTaxes = [];
        if (businessData?.isVatRegistered) {
            initialTaxes.push({ name: 'VAT', type: 'percentage', value: businessData.vatPercentage, amount: 0 });
        }
        if (businessData?.otherTaxes?.length > 0) {
            businessData.otherTaxes.forEach(t => {
                initialTaxes.push({ name: t.name, type: t.type, value: t.value, amount: 0 });
            });
        }

        setForm({
            ...initialForm,
            hasTax: initialTaxes.length > 0,
            appliedTaxes: initialTaxes,
            taxTotal: 0,
            items: mode === 'automatic' ? form.items : []
        });
        setIsCreateModalOpen(true);
    };

    const handleAddItem = () => {
        setForm(prev => ({ ...prev, items: [...prev.items, { productRef: '', manualName: '', quantity: 1, unitPrice: 0, lineTotal: 0 }] }));
    };

    const updateItem = (index, field, value) => {
        setForm(prev => {
            const newItems = [...prev.items];
            newItems[index] = { ...newItems[index], [field]: value };

            if (field === 'productRef' && value) {
                const prod = products.find(p => p._id === value);
                if (prod) {
                    newItems[index].unitPrice = prod.price;
                    newItems[index].manualName = prod.name;
                }
            }
            newItems[index].lineTotal = newItems[index].quantity * newItems[index].unitPrice;
            const subTotal = newItems.reduce((acc, current) => acc + current.lineTotal, 0);
            return calculateTotals({ ...prev, items: newItems, subTotal });
        });
    };

    const recalculateFinal = () => {
        setForm(prev => calculateTotals(prev));
    };

    const handleToggleTax = (e) => {
        const checked = e.target.checked;
        setForm(prev => calculateTotals({ ...prev, hasTax: checked }));
    };

    const submitQuotation = async (e) => {
        e.preventDefault();
        if (form.items.length === 0) return showToast?.('Insert at least 1 item', 'error');
        if (editingQuotation && !editNote.trim()) return showToast?.('Edit reason is required', 'error');

        await runGuarded(async () => {
            try {
                const payload = { ...form, creationMethod: creationMode };
                if (editingQuotation) {
                    await api.put(`/quotations/${editingQuotation._id}/edit`, { ...payload, editNote });
                    showToast?.(`Quotation edited. Original ${editingQuotation.quotationId} cancelled.`, 'success');
                } else {
                    await api.post('/quotations', payload);
                    showToast?.('Quotation compiled securely', 'success');
                }
                setIsCreateModalOpen(false);
                setEditingQuotation(null);
                setEditNote('');
                fetchData();
            } catch (err) {
                showToast?.(err.response?.data?.message || 'Failure writing node', 'error');
            }
        });
    };

    const openEditModal = (q) => {
        if (!isWithin30Days(q.createdAt)) {
            return showToast?.('This quotation is older than 30 days and cannot be edited.', 'error');
        }
        setEditingQuotation(q);
        setEditNote('');
        setCreationMode(q.creationMethod || 'automatic');
        setForm({
            clientRef: q.clientRef?._id || '',
            projectId: q.projectId?._id || '',
            deliveryAddress: q.deliveryAddress || '',
            customDuration: q.customDuration || '',
            customUnit: q.customUnit || 'days',
            manualClientDetails: q.manualClientDetails || { title: 'Mr', organization: '', name: '', address: '', telephoneNumber: '', emailAddress: '' },
            items: (q.items || []).map(it => ({
                productRef: it.productRef?._id || it.productRef || '',
                manualName: it.manualName || '',
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                lineTotal: it.lineTotal
            })),
            subTotal: q.subTotal || 0,
            appliedDiscounts: q.appliedDiscounts || [],
            discountTotal: q.discountTotal || 0,
            hasTax: q.hasTax || false,
            appliedTaxes: q.appliedTaxes || [],
            taxTotal: q.taxTotal || 0,
            finalTotal: q.finalTotal || 0,
            currency: q.currency || 'primary',
            validDate: q.validDate ? new Date(q.validDate).toISOString().split('T')[0] : ''
        });
        setIsCreateModalOpen(true);
    };

    const openDeleteModal = (q) => {
        setQuotationToDelete(q);
        setDeleteReason('');
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteReason.trim()) return showToast?.('Deletion reason is required', 'error');

        await runGuarded(async () => {
            try {
                if (isAdmin) {
                    await api.delete(`/quotations/${quotationToDelete._id}`, { data: { reason: deleteReason.trim() } });
                    showToast?.('Quotation cancelled.', 'success');
                } else {
                    await api.post(`/quotations/${quotationToDelete._id}/request-delete`, { reason: deleteReason.trim() });
                    showToast?.('Deletion request sent', 'success');
                }
                setDeleteModalOpen(false);
                setQuotationToDelete(null);
                setDeleteReason('');
                fetchData();
            } catch (err) {
                showToast?.(err.response?.data?.message || 'Delete failed', 'error');
            }
        });
    };

    const filtered = quotations.filter(q => {
        const matchesSearch =
            q.quotationId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (q.clientRef?.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (q.manualClientDetails?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const isCancelled = q.status === 'Cancelled';
        const matchesTab = activeTab === 'Active' ? !isCancelled : isCancelled;
        return matchesSearch && matchesTab;
    });

    const cardStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
    const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#64748b', marginBottom: '0.6rem', textTransform: 'uppercase' };
    const inputStyle = { width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '0.8rem 1.25rem', color: '#0f172a', outline: 'none', fontWeight: 600, boxSizing: 'border-box' };

    return (
        <div className="qm-root">
            {loading ? (
                <div className="qm-loading"><RefreshCw className="animate-spin" color="var(--qm-t3)" /> Loading quotations...</div>
            ) : (
                <div className="qm-card">
                    <div className="qm-card-header">
                        <div className="qm-card-title">
                            <div className="qm-card-icon amber"><FileText size={20} /></div>
                            <div>
                                <h3>Quotation Engine</h3>
                                <div className="qm-card-subtitle">Architect formatting and proposals securely</div>
                            </div>
                        </div>
                        <div className="qm-card-actions">
                            <div className="qm-search-wrap">
                                <Search size={16} className="qm-search-icon" />
                                <input type="text" placeholder="Search QN00000 or Client..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="qm-search-input" />
                            </div>
                            <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '12px', alignItems: 'center' }}>
                                <button onClick={() => setActiveTab('Active')} style={{ padding: '6px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', background: activeTab === 'Active' ? '#fff' : 'transparent', color: activeTab === 'Active' ? '#0f172a' : '#64748b', boxShadow: activeTab === 'Active' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>Active</button>
                                <button onClick={() => setActiveTab('Cancelled')} style={{ padding: '6px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', background: activeTab === 'Cancelled' ? '#fff' : 'transparent', color: activeTab === 'Cancelled' ? '#ef4444' : '#64748b', boxShadow: activeTab === 'Cancelled' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>Deleted / Cancelled</button>
                            </div>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => openCreation('automatic')} className="qm-btn qm-btn-primary"><Plus size={16} /> Automatic Protocol</motion.button>
                            {isAdmin && (
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => openCreation('manual')} className="qm-btn qm-btn-outline" style={{ border: '2px dashed var(--qm-border)' }}><Plus size={16} /> Manual</motion.button>
                            )}
                        </div>
                    </div>

                    <div className="modern-table-card">
                        <div className="modern-table-scroll">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Identifier</th>
                                    <th>Client Receiver</th>
                                    <th>Project</th>
                                    <th className="text-right">Final Sum</th>
                                    <th>Generated By</th>
                                    <th className="text-center" style={{ width: '180px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(q => (
                                    <tr key={q._id}>
                                        <td>
                                            <div className="modern-table-cell-primary">
                                                <div style={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{q.quotationId}</div>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>{new Date(q.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td>
                                            {q.clientRef ? `${q.clientRef.firstName} ${q.clientRef.lastName}` : q.manualClientDetails?.name || 'Unknown'}
                                        </td>
                                        <td>
                                            {q.projectId ? (
                                                <div className="modern-table-cell-info">
                                                    <Briefcase size={14} color="#94a3b8" />
                                                    <span>{q.projectId.name || 'N/A'}</span>
                                                </div>
                                            ) : <span className="modern-table-cell-info muted">—</span>}
                                        </td>
                                        <td className="text-right">
                                            <span style={{ fontWeight: 800, color: '#059669', fontSize: '0.95rem' }}>
                                                {q.currency === 'primary' ? businessData?.primaryCurrency?.symbol || 'Rs.' : businessData?.secondaryCurrency?.symbol || '$'} {parseFloat(q.finalTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                                                {q.createdBy?.firstName} {q.createdBy?.lastName}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="modern-table-actions">
                                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setViewQuotation(q)} className="modern-table-action view"><Printer size={14} /></motion.button>
                                                {isAdmin && (
                                                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setHistoryQuotation(q)} className="modern-table-action history" title="View Status History"><Clock size={14} /></motion.button>
                                                )}
                                                {isRoot && q.status !== 'Cancelled' && isWithin30Days(q.createdAt) && (
                                                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => openEditModal(q)} className="modern-table-action edit"><Edit3 size={14} /></motion.button>
                                                )}
                                                {q.status !== 'Cancelled' && isWithin30Days(q.createdAt) && (
                                                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => openDeleteModal(q)} className="modern-table-action delete"><Trash2 size={14} /></motion.button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && <tr><td colSpan="6"><div className="qm-empty">No templates in active registry</div></td></tr>}
                            </tbody>
                        </table>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE MODAL */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="qm-overlay">
                                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="qm-modal qm-modal-lg">
                                    <div className="qm-modal-header">
                                        <div className="qm-modal-title-row">
                                            <div>
                                                <h2>{editingQuotation ? `Edit Quotation (${editingQuotation.quotationId})` : `Create Quotation [${creationMode.toUpperCase()}]`}</h2>
                                                <div className="qm-modal-subtitle">{editingQuotation ? 'Root-level edit — original will be cancelled' : 'Create a new quotation for a client'}</div>
                                            </div>
                                        </div>
                                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setIsCreateModalOpen(false); setEditingQuotation(null); setEditNote(''); }} className="qm-modal-close"><X size={18} /></motion.button>
                                    </div>

                                    {editingQuotation && (
                                        <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                            <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                                            <div>
                                                <div style={{ fontWeight: 800, color: '#92400e', fontSize: '0.9rem' }}>Editing Quotation {editingQuotation.quotationId}</div>
                                                <div style={{ color: '#b45309', fontSize: '0.8rem', marginTop: '0.2rem' }}>Saving will cancel the original quotation and create a new quotation number. This action is irreversible.</div>
                                            </div>
                                        </div>
                                    )}

                                    <form onSubmit={submitQuotation}>
                                        {editingQuotation && (
                                            <div style={{ marginBottom: '1.5rem', padding: '1.5rem', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                                <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Reason for Edit</h4>
                                                <input
                                                    type="text"
                                                    value={editNote}
                                                    onChange={e => setEditNote(e.target.value)}
                                                    placeholder="Why are you editing this quotation?"
                                                    style={{ ...inputStyle, background: '#fff', borderColor: !editNote ? '#fca5a5' : '#e2e8f0' }}
                                                    required
                                                />
                                            </div>
                                        )}
                                        {/* CLIENT INFO */}
                                        <div className="qm-section">
                                            <h4>1. Client Details</h4>

                                            {/* Toggle between Client Directory and Manual Entry */}
                                            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                                                <button type="button"
                                                    onClick={() => setForm({ ...form, clientRef: clients[0]?._id || '' })}
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        background: form.clientRef ? '#0f172a' : '#e2e8f0',
                                                        color: form.clientRef ? '#fff' : '#64748b',
                                                        fontWeight: 600,
                                                        fontSize: '0.8rem'
                                                    }}>
                                                    Select from Directory
                                                </button>
                                                <button type="button"
                                                    onClick={() => setForm({ ...form, clientRef: '' })}
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        background: !form.clientRef ? '#0f172a' : '#e2e8f0',
                                                        color: !form.clientRef ? '#fff' : '#64748b',
                                                        fontWeight: 600,
                                                        fontSize: '0.8rem'
                                                    }}>
                                                    Manual Entry
                                                </button>
                                            </div>

                                            {/* Client Directory Selection */}
                                            {form.clientRef ? (
                                                <div>
                                                    <label style={labelStyle}>Select Client</label>
                                                    <select value={form.clientRef} onChange={e => {
                                                        const selected = clients.find(c => c._id === e.target.value);
                                                        setForm({
                                                            ...form,
                                                            clientRef: e.target.value,
                                                            deliveryAddress: selected?.address || '',
                                                            manualClientDetails: selected ? {
                                                                title: 'Mr',
                                                                organization: selected.clientType === 'Organization' ? selected.firstName : '',
                                                                name: selected.clientType !== 'Organization' ? `${selected.firstName} ${selected.lastName || ''}`.trim() : '',
                                                                address: selected.address || '',
                                                                telephoneNumber: selected.telephoneNumber || selected.whatsappNumber || '',
                                                                emailAddress: selected.emailAddress || ''
                                                            } : form.manualClientDetails
                                                        });
                                                    }} style={{ ...inputStyle, background: '#fff' }}>
                                                        <option value="" disabled>Select a client...</option>
                                                        {clients.map(c => <option key={c._id} value={c._id}>{c.clientType === 'Organization' ? c.firstName : `${c.firstName} ${c.lastName || ''}`} ({c.clientId})</option>)}
                                                    </select>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: '1rem' }}>
                                                    <div>
                                                        <label style={labelStyle}>Title</label>
                                                        <select value={form.manualClientDetails.title} onChange={e => setForm({ ...form, manualClientDetails: { ...form.manualClientDetails, title: e.target.value } })} style={{ ...inputStyle, background: '#fff', padding: '0.8rem 0.5rem' }}>
                                                            <option value="Mr">Mr.</option>
                                                            <option value="Mrs">Mrs.</option>
                                                            <option value="Miss">Miss</option>
                                                            <option value="Ms">Ms.</option>
                                                            <option value="Organization">Organization</option>
                                                        </select>
                                                    </div>
                                                    <div><label style={labelStyle}>Client Name / Organization</label><input required value={form.manualClientDetails.name} onChange={e => setForm({ ...form, manualClientDetails: { ...form.manualClientDetails, name: e.target.value } })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                                    <div><label style={labelStyle}>Contact Number</label><input value={form.manualClientDetails.telephoneNumber} onChange={e => setForm({ ...form, manualClientDetails: { ...form.manualClientDetails, telephoneNumber: e.target.value } })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                                    <div style={{ gridColumn: 'span 3' }}><label style={labelStyle}>Address</label><input value={form.manualClientDetails.address} onChange={e => setForm({ ...form, manualClientDetails: { ...form.manualClientDetails, address: e.target.value } })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                                    <div style={{ gridColumn: 'span 3' }}><label style={labelStyle}>Email (Optional)</label><input type="email" value={form.manualClientDetails.emailAddress} onChange={e => setForm({ ...form, manualClientDetails: { ...form.manualClientDetails, emailAddress: e.target.value } })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                                </div>
                                            )}

                                            <div style={{ marginTop: '1rem' }}>
                                                <label className="qm-label">Delivery Address</label>
                                                <input value={form.deliveryAddress} onChange={e => setForm({ ...form, deliveryAddress: e.target.value })} placeholder="Auto-filled from client or enter manually" className="qm-input" />
                                            </div>
                                        </div>

                                        {/* QUOTATION VALIDITY */}
                                        <div style={{ marginBottom: '1.5rem', padding: '1.5rem', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                            <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>2. Quotation Validity</h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                <div>
                                                    <label style={labelStyle}>Duration</label>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            placeholder="Enter number"
                                                            value={form.customDuration || ''}
                                                            onChange={e => {
                                                                const num = parseInt(e.target.value) || '';
                                                                const unit = form.customUnit || 'days';
                                                                const today = new Date();
                                                                if (num) {
                                                                    if (unit === 'days') {
                                                                        today.setDate(today.getDate() + num);
                                                                    } else if (unit === 'weeks') {
                                                                        today.setDate(today.getDate() + (num * 7));
                                                                    } else if (unit === 'months') {
                                                                        today.setMonth(today.getMonth() + num);
                                                                    }
                                                                    setForm(prev => ({ ...prev, customDuration: num, validDate: today.toISOString().split('T')[0] }));
                                                                } else {
                                                                    setForm(prev => ({ ...prev, customDuration: num, validDate: '' }));
                                                                }
                                                            }}
                                                            style={{ ...inputStyle, background: '#fff', width: '100px' }}
                                                        />
                                                        <select
                                                            value={form.customUnit || 'days'}
                                                            onChange={e => {
                                                                const num = form.customDuration || 0;
                                                                const unit = e.target.value;
                                                                const today = new Date();
                                                                if (num) {
                                                                    if (unit === 'days') {
                                                                        today.setDate(today.getDate() + num);
                                                                    } else if (unit === 'weeks') {
                                                                        today.setDate(today.getDate() + (num * 7));
                                                                    } else if (unit === 'months') {
                                                                        today.setMonth(today.getMonth() + num);
                                                                    }
                                                                    setForm(prev => ({ ...prev, customUnit: unit, validDate: today.toISOString().split('T')[0] }));
                                                                } else {
                                                                    setForm(prev => ({ ...prev, customUnit: unit, validDate: '' }));
                                                                }
                                                            }}
                                                            style={{ ...inputStyle, background: '#fff' }}
                                                        >
                                                            <option value="days">Days</option>
                                                            <option value="weeks">Weeks</option>
                                                            <option value="months">Months</option>
                                                        </select>
                                                    </div>
                                                    {form.validDate && (
                                                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                                                            Expires on: {new Date(form.validDate).toLocaleDateString('en-GB')}
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>Currency</label>
                                                    <select
                                                        value={form.currency}
                                                        onChange={e => setForm({ ...form, currency: e.target.value })}
                                                        style={{ ...inputStyle, background: '#fff' }}
                                                    >
                                                        <option value="primary">Primary ({businessData?.primaryCurrency?.code || 'LKR'})</option>
                                                        <option value="secondary">Secondary ({businessData?.secondaryCurrency?.code || 'USD'})</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <p style={{ margin: '0.5rem 0 0', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>
                                                Enter duration and select unit. Date will be automatically calculated and printed on the quotation.
                                            </p>
                                        </div>

                                        {/* ITEMS */}
                                        <div style={{ marginBottom: '1.5rem', padding: '1.5rem', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                <h4 style={{ margin: 0, color: '#0f172a' }}>3. Product Modules</h4>
                                                <button type="button" onClick={handleAddItem} style={{ background: '#0f172a', color: '#fff', padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Plus size={14} /> Attach Item</button>
                                            </div>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr>
                                                        <th style={{ padding: '0.5rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748b' }}>Item/Module</th>
                                                        <th style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748b', width: '10%' }}>QTY</th>
                                                        <th style={{ padding: '0.5rem', textAlign: 'right', fontSize: '0.75rem', color: '#64748b', width: '22%' }}>Unit Price</th>
                                                        <th style={{ padding: '0.5rem', textAlign: 'right', fontSize: '0.75rem', color: '#64748b', width: '15%' }}>Line Total</th>
                                                        <th></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {form.items.map((it, idx) => (
                                                        <tr key={idx}>
                                                            <td style={{ padding: '0.5rem' }}>
                                                                {creationMode === 'automatic' ? (
                                                                    <select required value={it.productRef} onChange={e => updateItem(idx, 'productRef', e.target.value)} style={{ ...inputStyle, background: '#fff', padding: '0.5rem' }}>
                                                                        <option value="" disabled>Select Product Catalog...</option>
                                                                        {products.map(p => <option key={p._id} value={p._id}>{p.name} [{p.productId}] - Stock: {p.quantity || 0}</option>)}
                                                                    </select>
                                                                ) : (
                                                                    <input required placeholder="Manual Entry..." value={it.manualName} onChange={e => updateItem(idx, 'manualName', e.target.value)} style={{ ...inputStyle, background: '#fff', padding: '0.5rem' }} />
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '0.5rem' }}>
                                                                <input required type="number" min="1" value={it.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)} style={{ ...inputStyle, background: '#fff', padding: '0.5rem', textAlign: 'center' }} />
                                                            </td>
                                                            <td style={{ padding: '0.5rem' }}>
                                                                <PriceInput value={it.unitPrice} onChange={v => updateItem(idx, 'unitPrice', v)} disabled={creationMode === 'automatic'} style={{ ...inputStyle, background: creationMode === 'automatic' ? '#f1f5f9' : '#fff', padding: '0.5rem 0.75rem', textAlign: 'right', minWidth: '140px' }} required />
                                                            </td>
                                                            <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                                                                {it.lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                            </td>
                                                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                                                <button type="button" onClick={() => {
                                                                    setForm(prev => {
                                                                        const n = prev.items.filter((_, i) => i !== idx);
                                                                        const sub = n.reduce((acc, c) => acc + c.lineTotal, 0);
                                                                        return calculateTotals({ ...prev, items: n, subTotal: sub });
                                                                    });
                                                                }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={16} /></button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {form.items.length === 0 && <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>No modules connected to array.</td></tr>}
                                                </tbody>
                                                <tfoot>
                                                    <tr>
                                                        <td colSpan="3" style={{ padding: '1rem', textAlign: 'right', fontWeight: 800 }}>Subtotal:</td>
                                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 900, fontSize: '1.1rem', color: '#0f172a', borderTop: '2px solid #e2e8f0' }}>{form.subTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                                        <td></td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>

                                        {/* TOTALS VERIFICATION - Multiple Discounts + Custom */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                            {/* Discount Block */}
                                            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>Discounts</div>
                                                    <input type="checkbox" checked={form.appliedDiscounts?.length > 0 || form.discountTotal > 0} onChange={(e) => {
                                                        if (e.target.checked && businessData?.discountProfiles?.length > 0) {
                                                            setApplyDiscountMode(true);
                                                        } else {
                                                            setForm({ ...form, appliedDiscounts: [], discountTotal: 0 });
                                                            recalculateFinal();
                                                        }
                                                    }} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                                                </div>
                                                {(form.appliedDiscounts?.length > 0 || form.discountTotal > 0 || applyDiscountMode) && (
                                                    <div style={{ marginTop: '1rem' }}>

                                                        {/* Promotional Yields */}
                                                        <div style={{ marginBottom: '1rem' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                                <label style={{ ...labelStyle, color: '#0f172a' }}>Promotional Yields</label>
                                                                {currentUser.role === 'root' && (
                                                                    <button type="button" onClick={async () => {
                                                                        const newProfile = { name: 'New Profile', type: 'percentage', value: 0, minBillAmount: 0 };
                                                                        const updatedProfiles = [...(businessData.discountProfiles || []), newProfile];
                                                                        try {
                                                                            await api.patch('/business', { discountProfiles: updatedProfiles });
                                                                            setBusinessData({ ...businessData, discountProfiles: updatedProfiles });
                                                                            showToast?.('New profile added', 'success');
                                                                        } catch (err) {
                                                                            showToast?.('Failed to add profile', 'error');
                                                                        }
                                                                    }} style={{ fontSize: '0.7rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontWeight: 700 }}>+ Add</button>
                                                                )}
                                                            </div>
                                                            {businessData?.discountProfiles?.map((profile, i) => {
                                                                const isEligible = form.subTotal >= profile.minBillAmount;
                                                                const isApplied = form.appliedDiscounts?.some(d => d.name === profile.name);
                                                                return (
                                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', padding: '0.5rem', background: isApplied ? '#d1fae5' : '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                        <input type="checkbox" checked={!!isApplied} disabled={!isEligible} onChange={(e) => {
                                                                            setForm(prev => {
                                                                                const applied = [...(prev.appliedDiscounts || [])];
                                                                                if (e.target.checked) {
                                                                                    const amount = profile.type === 'percentage' ? (prev.subTotal * profile.value) / 100 : profile.value;
                                                                                    applied.push({ name: profile.name, type: profile.type, value: profile.value, amount });
                                                                                } else {
                                                                                    const idx = applied.findIndex(d => d.name === profile.name);
                                                                                    if (idx > -1) applied.splice(idx, 1);
                                                                                }
                                                                                return calculateTotals({ ...prev, appliedDiscounts: applied });
                                                                            });
                                                                        }} style={{ width: '16px', height: '16px' }} />
                                                                        <div style={{ flex: 1, fontSize: '0.8rem', color: isEligible ? '#0f172a' : '#94a3b8' }}>
                                                                            <strong>{profile.name}</strong> ({profile.type === 'percentage' ? profile.value + '%' : 'Rs. ' + profile.value})
                                                                            <span style={{ fontSize: '0.7rem', marginLeft: '0.5rem' }}>Min: {profile.minBillAmount.toLocaleString()}</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        <div style={{ textAlign: 'center', margin: '0.5rem 0', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>+ Add Manual Discount</div>

                                                        {/* Custom Discount */}
                                                        <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                            <label style={{ ...labelStyle, color: '#0f172a' }}>Custom Discount</label>
                                                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                                <select value={customDiscount.type} onChange={e => setCustomDiscount({ ...customDiscount, type: e.target.value })} style={{ ...inputStyle, background: '#f8fafc', padding: '0.5rem', flex: 1 }}>
                                                                    <option value="percentage">% Percentage</option>
                                                                    <option value="fixed">Fixed Amount</option>
                                                                </select>
                                                                <input type="number" step="0.01" placeholder="Value" value={customDiscount.value || ''} onChange={e => setCustomDiscount({ ...customDiscount, value: parseFloat(e.target.value) || 0 })} style={{ ...inputStyle, background: '#f8fafc', padding: '0.5rem', flex: 1 }} />
                                                                <button type="button" onClick={() => {
                                                                    if (customDiscount.value > 0) {
                                                                        setForm(prev => {
                                                                            const amount = customDiscount.type === 'percentage' ? (prev.subTotal * customDiscount.value) / 100 : customDiscount.value;
                                                                            const newDiscount = { name: 'Custom', type: customDiscount.type, value: customDiscount.value, amount };
                                                                            return calculateTotals({ ...prev, appliedDiscounts: [...(prev.appliedDiscounts || []), newDiscount] });
                                                                        });
                                                                        setCustomDiscount({ type: 'percentage', value: 0 });
                                                                    }
                                                                }} style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 700 }}>Add</button>
                                                            </div>
                                                        </div>

                                                        {/* Applied Discounts List */}
                                                        {form.appliedDiscounts?.length > 0 && (
                                                            <div style={{ marginTop: '1rem' }}>
                                                                <label style={{ ...labelStyle, color: '#10b981' }}>Applied Discounts</label>
                                                                {form.appliedDiscounts.map((disc, i) => (
                                                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: '#d1fae5', borderRadius: '8px', marginBottom: '0.5rem' }}>
                                                                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{disc.name} ({disc.type === 'percentage' ? disc.value + '%' : 'Rs. ' + disc.value})</span>
                                                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669' }}>- Rs. {disc.amount.toLocaleString()}</span>
                                                                        <button type="button" onClick={() => {
                                                                            setForm(prev => calculateTotals({ ...prev, appliedDiscounts: prev.appliedDiscounts.filter((_, idx) => idx !== i) }));
                                                                        }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}>×</button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                    </div>
                                                )}
                                            </div>

                                            {/* Tax Block */}
                                            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                                                        Apply Govt/Sector Taxes
                                                    </div>
                                                    <input type="checkbox" checked={form.hasTax} onChange={handleToggleTax} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                                                </div>
                                                {form.hasTax && (
                                                    <div style={{ marginTop: '1rem' }}>
                                                        <div style={{ marginBottom: '1rem' }}>
                                                            {businessData?.isVatRegistered && (() => {
                                                                const isApplied = form.appliedTaxes?.some(t => t.name === 'VAT');
                                                                return (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', padding: '0.5rem', background: isApplied ? '#d1fae5' : '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                        <input type="checkbox" checked={isApplied} onChange={e => {
                                                                            const checked = e.target.checked;
                                                                            setForm(prev => {
                                                                                let taxes = [...(prev.appliedTaxes || [])];
                                                                                if (checked) taxes.push({ name: 'VAT', type: 'percentage', value: businessData.vatPercentage, amount: 0 });
                                                                                else taxes = taxes.filter(t => t.name !== 'VAT');
                                                                                return calculateTotals({ ...prev, appliedTaxes: taxes });
                                                                            });
                                                                        }} style={{ cursor: 'pointer' }} />
                                                                        <div style={{ flex: 1, fontSize: '0.8rem', color: '#0f172a' }}>
                                                                            <strong>VAT</strong> ({businessData.vatPercentage}%)
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })()}

                                                            {businessData?.otherTaxes?.map((tax, i) => {
                                                                const isApplied = form.appliedTaxes?.some(t => t.name === tax.name);
                                                                return (
                                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', padding: '0.5rem', background: isApplied ? '#d1fae5' : '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                        <input type="checkbox" checked={isApplied} onChange={e => {
                                                                            const checked = e.target.checked;
                                                                            setForm(prev => {
                                                                                let taxes = [...(prev.appliedTaxes || [])];
                                                                                if (checked) taxes.push({ name: tax.name, type: tax.type, value: tax.value, amount: 0 });
                                                                                else taxes = taxes.filter(t => t.name !== tax.name);
                                                                                return calculateTotals({ ...prev, appliedTaxes: taxes });
                                                                            });
                                                                        }} style={{ cursor: 'pointer' }} />
                                                                        <div style={{ flex: 1, fontSize: '0.8rem', color: '#0f172a' }}>
                                                                            <strong>{tax.name}</strong> ({tax.type === 'percentage' ? tax.value + '%' : 'Rs. ' + tax.value})
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="qm-total-bar">
                                            <div className="qm-total-label">Final Total</div>
                                            <div className="qm-total-value">{form.finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                                        </div>

                                        <motion.button whileTap={{ scale: isSubmitting ? 1 : 0.98 }} type="submit" disabled={isSubmitting} className="qm-btn qm-btn-success qm-btn-full" style={{ opacity: isSubmitting ? 0.85 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}><CheckCircle size={20} /> {isSubmitting ? 'Processing...' : (editingQuotation ? 'Save Edited Quotation' : 'Create Quotation')}</motion.button>
                                    </form>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* DELETE MODAL */}
                    <AnimatePresence>
                        {deleteModalOpen && (
                            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: 450, textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                                    {isAdmin ? (
                                        <>
                                            <ShieldAlert size={48} color="#ef4444" style={{ marginBottom: '1rem', margin: '0 auto' }} />
                                            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}>Cancel Quotation?</h3>
                                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                                                This will soft-cancel the quotation. The reason will be saved in status history.
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle size={48} color="#f59e0b" style={{ marginBottom: '1rem', margin: '0 auto' }} />
                                            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}>Request Quotation Cancellation</h3>
                                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                                                Provide a reason for admin approval. The reason will be saved in status history.
                                            </p>
                                        </>
                                    )}
                                    <label style={{ ...labelStyle, textAlign: 'left' }}>Cancellation Reason *</label>
                                    <textarea
                                        placeholder="e.g. Wrong client selected, duplicate quotation, customer cancelled..."
                                        value={deleteReason}
                                        onChange={e => setDeleteReason(e.target.value)}
                                        required
                                        style={{ ...inputStyle, height: 100, resize: 'none', marginBottom: '1.5rem', textAlign: 'left' }}
                                    />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setDeleteModalOpen(false); setDeleteReason(''); }} style={{ background: '#f8fafc', color: '#64748b', border: 'none', borderRadius: '12px', padding: '0.8rem', fontWeight: 800, cursor: 'pointer' }}>Cancel</motion.button>
                                        <motion.button whileTap={{ scale: isSubmitting ? 1 : 0.95 }} onClick={confirmDelete} disabled={isSubmitting || !deleteReason.trim()} style={{ background: isAdmin ? '#ef4444' : '#f59e0b', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.8rem', fontWeight: 800, cursor: (isSubmitting || !deleteReason.trim()) ? 'not-allowed' : 'pointer', opacity: (isSubmitting || !deleteReason.trim()) ? 0.6 : 1 }}>{isSubmitting ? 'Processing...' : (isAdmin ? 'Cancel Quotation' : 'Submit Request')}</motion.button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* STATUS HISTORY MODAL */}
                    <AnimatePresence>
                        {historyQuotation && (
                            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ background: '#fff', borderRadius: '24px', padding: '2rem', width: '100%', maxWidth: 600, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '85vh', overflowY: 'auto' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                        <h3 style={{ margin: 0, fontWeight: 900, color: '#0f172a', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Clock size={22} color="#3b82f6" /> Status History: {historyQuotation.quotationId}
                                        </h3>
                                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setHistoryQuotation(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></motion.button>
                                    </div>

                                    {historyQuotation.statusHistory && historyQuotation.statusHistory.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {historyQuotation.statusHistory.map((hist, idx) => (
                                                <div key={idx} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '40px' }}>
                                                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#3b82f6', margin: '4px 0', border: '3px solid #eff6ff' }} />
                                                        {idx < historyQuotation.statusHistory.length - 1 && <div style={{ width: 2, height: '100%', background: '#e2e8f0', minHeight: '40px' }} />}
                                                    </div>
                                                    <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', flex: 1, border: '1px solid #e2e8f0' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                                                            <span style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, borderRadius: '8px', background: hist.status === 'Cancelled' ? '#fef2f2' : '#f0fdf4', color: hist.status === 'Cancelled' ? '#ef4444' : '#166534' }}>{hist.status}</span>
                                                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>{new Date(hist.editedAt).toLocaleString()}</span>
                                                        </div>
                                                        <div style={{ fontSize: '0.9rem', color: '#334155', marginBottom: hist.note ? '0.75rem' : '0' }}>
                                                            Updated by <strong style={{ color: '#0f172a' }}>{hist.editedBy?.firstName || 'System'} {hist.editedBy?.lastName || ''}</strong>
                                                        </div>
                                                        {hist.note && (
                                                            <div style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic', background: '#fff', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid #cbd5e1' }}>
                                                                "{hist.note}"
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ color: '#64748b', fontSize: '0.95rem', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>No status history available.</div>
                                    )}
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* PRINT/VIEW INVISIBLE TEMPLATE LAYER */}
                    <AnimatePresence>
                        {viewQuotation && (
                            <div className="app-print-overlay">
                                <div className="app-print-shell">
                                    <div className="app-print-toolbar">
                                        <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={handlePrint} className="app-print-btn">
                                            <Printer size={18} /> A4 Print / PDF
                                        </motion.button>
                                        <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={() => setViewQuotation(null)} className="app-print-close">
                                            <X size={20} />
                                        </motion.button>
                                    </div>
                                    <div className="app-print-doc">
                                        <QuotationTemplate ref={printRef} quotation={viewQuotation} business={businessData} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            );
};

export default QuotationManagement;
