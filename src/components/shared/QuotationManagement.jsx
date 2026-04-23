import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, X, Search, RefreshCw, Printer, AlertTriangle, ShieldAlert, CheckCircle } from 'lucide-react';
import api from '../../api';
import QuotationTemplate from './QuotationTemplate';

const QuotationManagement = ({ currentUser, showToast }) => {
    const [quotations, setQuotations] = useState([]);
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [businessData, setBusinessData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [creationMode, setCreationMode] = useState('automatic'); // 'automatic' or 'manual'
    
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
        manualClientDetails: { title: 'Mr', organization: '', name: '', address: '', telephoneNumber: '', emailAddress: '' },
        items: [],
        subTotal: 0,
        hasDiscount: false, discountType: 'none', discountValue: 0,
        hasTax: false, taxName: 'VAT', taxPercentage: 0,
        finalTotal: 0,
        currency: 'primary',
        validDate: ''
    };
    const [form, setForm] = useState(initialForm);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [qRes, cRes, pRes, bRes, prRes] = await Promise.all([
                api.get('/quotations'),
                api.get('/clients'),
                api.get('/products'),
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
        const printContent = printRef.current;
        const windowPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
        windowPrint.document.write(`
            <html>
                <head>
                    <title>Print Quotation</title>
                    <style>
                        body { margin: 0; padding: 0; background: #fff; }
                        @media print {
                            @page { size: A4; margin: 0; }
                            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
            </html>
        `);
        windowPrint.document.close();
        windowPrint.focus();
        setTimeout(() => {
            windowPrint.print();
            windowPrint.close();
        }, 250);
    };

    const openCreation = (mode) => {
        setCreationMode(mode);
        
        let autoTaxEnabled = false;
        let taxName = 'VAT';
        let taxPercentage = 0;

        if (mode === 'automatic') {
            const isVatRegistered = !!businessData?.isVatRegistered;
            const hasOtherTaxes = businessData?.otherTaxes && businessData.otherTaxes.length > 0;
            autoTaxEnabled = isVatRegistered || hasOtherTaxes;
            taxName = businessData?.otherTaxes?.[0]?.name || 'VAT';
            taxPercentage = isVatRegistered ? businessData.vatPercentage : (businessData?.otherTaxes?.[0]?.value || 0);
        } else {
            const isVatRegistered = !!businessData?.isVatRegistered;
            autoTaxEnabled = isVatRegistered;
            taxName = 'VAT';
            taxPercentage = isVatRegistered ? businessData.vatPercentage : 0;
        }

        setForm({
            ...initialForm,
            hasTax: autoTaxEnabled,
            taxName,
            taxPercentage,
            items: mode === 'automatic' ? form.items : []
        });
        setIsCreateModalOpen(true);
    };

    const handleAddItem = () => {
        setForm({ ...form, items: [...form.items, { productRef: '', manualName: '', quantity: 1, unitPrice: 0, lineTotal: 0 }] });
    };

    const updateItem = (index, field, value) => {
        const newItems = [...form.items];
        newItems[index][field] = value;

        if (field === 'productRef' && value) {
            const prod = products.find(p => p._id === value);
            if (prod) {
                newItems[index].unitPrice = prod.price;
                newItems[index].manualName = prod.name;
            }
        }
        
        newItems[index].lineTotal = newItems[index].quantity * newItems[index].unitPrice;
        
        const subTotal = newItems.reduce((acc, current) => acc + current.lineTotal, 0);
        calculateTotals(newItems, subTotal, form.hasDiscount, form.discountType, form.discountValue, form.hasTax, form.taxPercentage);
    };

    const calculateTotals = (items, subTotal, hasDiscount, discountType, discountValue, hasTax, taxPercentage) => {
        let finalParams = subTotal;
        if (hasDiscount && discountValue > 0) {
            if (discountType === 'percentage') {
                finalParams -= (subTotal * discountValue) / 100;
            } else if (discountType === 'fixed') {
                finalParams -= discountValue;
            }
        }
        if (hasTax && taxPercentage > 0) {
           finalParams += (finalParams * taxPercentage) / 100;
        }

        setForm(prev => ({
            ...prev,
            items, subTotal, hasDiscount, discountType, discountValue, hasTax, taxPercentage, finalTotal: finalParams
        }));
    };

    const handleToggleDiscount = (e) => {
        const val = e.target.checked;
        calculateTotals(form.items, form.subTotal, val, form.discountType, form.discountValue, form.hasTax, form.taxPercentage);
    };

    const handleToggleTax = (e) => {
        const val = e.target.checked;
        calculateTotals(form.items, form.subTotal, form.hasDiscount, form.discountType, form.discountValue, val, form.taxPercentage);
    };

    const handleParamChange = (field, val) => {
        const merged = { ...form, [field]: val };
        calculateTotals(merged.items, merged.subTotal, merged.hasDiscount, merged.discountType, merged.discountValue, merged.hasTax, merged.taxPercentage);
    };

    const submitQuotation = async (e) => {
        e.preventDefault();
        if (form.items.length === 0) return showToast?.('Insert at least 1 item', 'error');
        
        try {
            await api.post('/quotations', { ...form, creationMethod: creationMode });
            showToast?.('Quotation compiled securely', 'success');
            setIsCreateModalOpen(false);
            fetchData();
        } catch (err) {
            showToast?.(err.response?.data?.message || 'Failure writing node', 'error');
        }
    };

    const openDeleteModal = (q) => {
        setQuotationToDelete(q);
        setDeleteReason('');
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        try {
            if (currentUser.role === 'root' || currentUser.role === 'admin') {
                await api.delete(`/quotations/${quotationToDelete._id}`);
                showToast?.('Record eliminated.', 'success');
            } else {
                if (!deleteReason.trim()) return showToast?.('Reason is required for standard users.', 'error');
                await api.post(`/quotations/${quotationToDelete._id}/request-delete`, { reason: deleteReason });
                showToast?.('Deletion Request transmitted to Security.', 'success');
            }
            setDeleteModalOpen(false);
            setQuotationToDelete(null);
            fetchData();
        } catch (err) {
            showToast?.('Elimination protocol failed', 'error');
        }
    };

    const filtered = quotations.filter(q => 
        q.quotationId.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (q.clientRef?.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.manualClientDetails?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const cardStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
    const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#64748b', marginBottom: '0.6rem', textTransform: 'uppercase' };
    const inputStyle = { width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '0.8rem 1.25rem', color: '#0f172a', outline: 'none', fontWeight: 600, boxSizing: 'border-box' };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><RefreshCw className="animate-spin" color="#64748b" /></div>
            ) : (
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 800, color: '#0f172a' }}>Quotation Engine</h1>
                            <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>Architect formatting and proposals securely.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} title="Locate Protocol" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input type="text" placeholder="Search QN00000 or Client..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', width: 280, outline: 'none' }} />
                            </div>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => openCreation('automatic')} style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={18} /> Automatic Protocol</motion.button>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => openCreation('manual')} style={{ background: '#f8fafc', color: '#0f172a', border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '0.8rem 1.5rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={18} /> Manual</motion.button>
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Identifier</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Client Receiver</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Final Sum</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Generated By</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(q => (
                                <tr key={q._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.9rem' }}>{q.quotationId}</div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>{new Date(q.createdAt).toLocaleDateString()}</div>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 700, color: '#0f172a' }}>
                                        {q.clientRef ? `${q.clientRef.firstName} ${q.clientRef.lastName}` : q.manualClientDetails?.name || 'Unknown'}
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 800, color: '#0f172a' }}>
                                        {q.currency === 'primary' ? businessData.primaryCurrency?.symbol || 'Rs.' : businessData.secondaryCurrency?.symbol || '$'} {parseFloat(q.finalTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                                        {q.createdBy?.firstName} {q.createdBy?.lastName}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setViewQuotation(q)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}><Printer size={14} /> Open Form</motion.button>
                                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => openDeleteModal(q)} style={{ background: '#fdf2f8', border: '1px solid #fce7f3', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: 700, color: '#db2777', fontSize: '0.8rem' }}>
                                                {(currentUser.role === 'admin' || currentUser.role === 'root') ? 'Delete' : 'Delete Request'}
                                            </motion.button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No templates in active registry.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {/* CREATE MODAL */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: 850, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontWeight: 900 }}>Create Quotation [{creationMode.toUpperCase()}]</h2>
                                    <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>Create a new quotation for a client.</p>
                                </div>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsCreateModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></motion.button>
                            </div>
                            
                            <form onSubmit={submitQuotation}>
                                {/* CLIENT INFO */}
                                <div style={{ marginBottom: '1.5rem', padding: '1.5rem', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                    <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>1. Client Details</h4>
                                    
                                    {/* Toggle between Client Directory and Manual Entry */}
                                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                                        <button type="button" 
                                            onClick={() => setForm({...form, clientRef: form.clientRef || ''})}
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
                                            onClick={() => setForm({...form, clientRef: ''})}
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
                                                    manualClientDetails: selected ? {
                                                        title: 'Mr',
                                                        organization: selected.clientType === 'Organization' ? selected.firstName : '',
                                                        name: selected.clientType !== 'Organization' ? `${selected.firstName} ${selected.lastName || ''}`.trim() : '',
                                                        address: selected.address || '',
                                                        telephoneNumber: selected.telephoneNumber || selected.whatsappNumber || '',
                                                        emailAddress: selected.emailAddress || ''
                                                    } : form.manualClientDetails
                                                });
                                            }} style={{...inputStyle, background: '#fff'}}>
                                                <option value="" disabled>Select a client...</option>
                                                {clients.map(c => <option key={c._id} value={c._id}>{c.clientType === 'Organization' ? c.firstName : `${c.firstName} ${c.lastName || ''}`} ({c.clientId})</option>)}
                                            </select>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={labelStyle}>Title</label>
                                                <select value={form.manualClientDetails.title} onChange={e => setForm({...form, manualClientDetails: {...form.manualClientDetails, title: e.target.value}})} style={{...inputStyle, background: '#fff', padding: '0.8rem 0.5rem'}}>
                                                    <option value="Mr">Mr.</option>
                                                    <option value="Mrs">Mrs.</option>
                                                    <option value="Miss">Miss</option>
                                                    <option value="Ms">Ms.</option>
                                                    <option value="Organization">Organization</option>
                                                </select>
                                            </div>
                                            <div><label style={labelStyle}>Client Name / Organization</label><input required value={form.manualClientDetails.name} onChange={e => setForm({...form, manualClientDetails: {...form.manualClientDetails, name: e.target.value}})} style={{...inputStyle, background: '#fff'}} /></div>
                                            <div><label style={labelStyle}>Contact Number</label><input value={form.manualClientDetails.telephoneNumber} onChange={e => setForm({...form, manualClientDetails: {...form.manualClientDetails, telephoneNumber: e.target.value}})} style={{...inputStyle, background: '#fff'}} /></div>
                                            <div style={{ gridColumn: 'span 3' }}><label style={labelStyle}>Address</label><input value={form.manualClientDetails.address} onChange={e => setForm({...form, manualClientDetails: {...form.manualClientDetails, address: e.target.value}})} style={{...inputStyle, background: '#fff'}} /></div>
                                            <div style={{ gridColumn: 'span 3' }}><label style={labelStyle}>Email (Optional)</label><input type="email" value={form.manualClientDetails.emailAddress} onChange={e => setForm({...form, manualClientDetails: {...form.manualClientDetails, emailAddress: e.target.value}})} style={{...inputStyle, background: '#fff'}} /></div>
                                        </div>
                                    )}
                                </div>

                                {/* QUOTATION VALIDITY */}
                                <div style={{ marginBottom: '1.5rem', padding: '1.5rem', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                    <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>2. Quotation Validity</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={labelStyle}>Valid Until (Expiry Date)</label>
                                            <input
                                                type="date"
                                                value={form.validDate}
                                                onChange={e => setForm({ ...form, validDate: e.target.value })}
                                                style={{ ...inputStyle, background: '#fff' }}
                                            />
                                            <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>
                                                Optional — printed on the quotation as "Valid Until".
                                            </p>
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
                                                <th style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748b', width: '15%' }}>QTY</th>
                                                <th style={{ padding: '0.5rem', textAlign: 'right', fontSize: '0.75rem', color: '#64748b', width: '20%' }}>Unit Price</th>
                                                <th style={{ padding: '0.5rem', textAlign: 'right', fontSize: '0.75rem', color: '#64748b', width: '20%' }}>Line Total</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {form.items.map((it, idx) => (
                                                <tr key={idx}>
                                                    <td style={{ padding: '0.5rem' }}>
                                                        {creationMode === 'automatic' ? (
                                                            <select required value={it.productRef} onChange={e => updateItem(idx, 'productRef', e.target.value)} style={{...inputStyle, background: '#fff', padding: '0.5rem'}}>
                                                                <option value="" disabled>Select Product Catalog...</option>
                                                                {products.map(p => <option key={p._id} value={p._id}>{p.name} [{p.productId}] - Stock: {p.quantity || 0}</option>)}
                                                            </select>
                                                        ) : (
                                                            <input required placeholder="Manual Entry..." value={it.manualName} onChange={e => updateItem(idx, 'manualName', e.target.value)} style={{...inputStyle, background: '#fff', padding: '0.5rem'}} />
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '0.5rem' }}>
                                                        <input required type="number" min="1" value={it.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value)||0)} style={{...inputStyle, background: '#fff', padding: '0.5rem', textAlign: 'center'}} />
                                                    </td>
                                                    <td style={{ padding: '0.5rem' }}>
                                                        <input required type="number" step="0.01" value={it.unitPrice} onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value)||0)} disabled={creationMode === 'automatic'} style={{...inputStyle, background: creationMode === 'automatic' ? '#f1f5f9' : '#fff', padding: '0.5rem', textAlign: 'right'}} />
                                                    </td>
                                                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                                                        {it.lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                                        <button type="button" onClick={() => {
                                                            const n = form.items.filter((_, i) => i !== idx);
                                                            const sub = n.reduce((acc, c) => acc + c.lineTotal, 0);
                                                            calculateTotals(n, sub, form.hasDiscount, form.discountType, form.discountValue, form.hasTax, form.taxPercentage);
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

                                {/* TOTALS VERIFICATION - "Ask the user" logic */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                    {/* Discount Block */}
                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>Apply Promotional Discout?</div>
                                            <input type="checkbox" checked={form.hasDiscount} onChange={handleToggleDiscount} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                                        </div>
                                        {form.hasDiscount && (
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                                <select value={form.discountType} onChange={e => handleParamChange('discountType', e.target.value)} style={{...inputStyle, background: '#fff', padding: '0.5rem'}}>
                                                    <option value="percentage">% Percentage</option>
                                                    <option value="fixed">Fixed Flat</option>
                                                </select>
                                                <input type="number" step="0.01" placeholder="Value..." value={form.discountValue} onChange={e => handleParamChange('discountValue', parseFloat(e.target.value)||0)} style={{...inputStyle, background: '#fff', padding: '0.5rem'}} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Tax Block */}
                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                                                {creationMode === 'manual' ? 'Apply Govt/Sector Tax?' : `Apply Tax (VAT: ${businessData?.isVatRegistered ? businessData.vatPercentage + '%' : 'N/A'})?`}
                                            </div>
                                            <input type="checkbox" checked={form.hasTax} onChange={handleToggleTax} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                                        </div>
                                        {form.hasTax && (
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                                {businessData?.otherTaxes && businessData.otherTaxes.length > 0 ? (
                                                    <>
                                                        <select value={form.taxName} onChange={e => handleParamChange('taxName', e.target.value)} style={{...inputStyle, background: '#fff', padding: '0.5rem', minWidth: '150px'}}>
                                                            {businessData.isVatRegistered && <option value="VAT">VAT ({businessData.vatPercentage}%)</option>}
                                                            {businessData.otherTaxes.map((t, i) => (
                                                                <option key={i} value={t.name}>{t.name} ({t.type === 'percentage' ? t.value + '%' : 'Fixed'})</option>
                                                            ))}
                                                        </select>
                                                        {(() => {
                                                            const selectedTax = businessData.otherTaxes.find(t => t.name === form.taxName);
                                                            const isVat = form.taxName === 'VAT';
                                                            const pct = isVat ? businessData.vatPercentage : (selectedTax?.value || 0);
                                                            return (
                                                                <input type="number" step="0.01" placeholder="Rate %" value={pct} 
                                                                    onChange={e => handleParamChange('taxPercentage', parseFloat(e.target.value)||0)} 
                                                                    style={{...inputStyle, background: '#f1f5f9', padding: '0.5rem', width: '80px'}} 
                                                                    disabled={isVat || selectedTax?.type === 'percentage'} 
                                                                />
                                                            );
                                                        })()}
                                                    </>
                                                ) : (
                                                    <>
                                                        <input type="text" placeholder="Tax Name (e.g. VAT)" value={form.taxName} onChange={e => handleParamChange('taxName', e.target.value)} style={{...inputStyle, background: '#fff', padding: '0.5rem'}} />
                                                        <input type="number" step="0.01" placeholder="Rate %" value={form.taxPercentage} onChange={e => handleParamChange('taxPercentage', parseFloat(e.target.value)||0)} style={{...inputStyle, background: '#fff', padding: '0.5rem'}} />
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: '#0f172a', borderRadius: '16px', color: '#fff', marginBottom: '2rem' }}>
                                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 900, color: '#94a3b8' }}>Final Total</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px' }}>{form.finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                                </div>

                                <motion.button whileTap={{ scale: 0.98 }} type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', padding: '1rem', width: '100%', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1rem' }}><CheckCircle size={20} /> Create Quotation</motion.button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* DELETE MODAL (Distinguishes Admin vs User) */}
            <AnimatePresence>
                {deleteModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: 450, textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                            {(currentUser.role === 'admin' || currentUser.role === 'root') ? (
                                <>
                                    <ShieldAlert size={48} color="#ef4444" style={{ marginBottom: '1rem', margin: '0 auto' }} />
                                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}>Authorize Direct Nullification?</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>As a high-level authority, executing this will permanently destroy this quotation.</p>
                                </>
                            ) : (
                                <>
                                    <AlertTriangle size={48} color="#f59e0b" style={{ marginBottom: '1rem', margin: '0 auto' }} />
                                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}>Propose Deletion Request</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Provide diagnostic reason for Security Approval dashboard.</p>
                                    <textarea placeholder="State explicit reason..." value={deleteReason} onChange={e => setDeleteReason(e.target.value)} required style={{...inputStyle, height: 100, resize: 'none', marginBottom: '2rem', textAlign: 'left'}} />
                                </>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setDeleteModalOpen(false)} style={{ background: '#f8fafc', color: '#64748b', border: 'none', borderRadius: '12px', padding: '0.8rem', fontWeight: 800, cursor: 'pointer' }}>Abort Action</motion.button>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={confirmDelete} style={{ background: (currentUser.role === 'admin' || currentUser.role === 'root') ? '#ef4444' : '#f59e0b', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.8rem', fontWeight: 800, cursor: 'pointer' }}>Proceed with Command</motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* PRINT/VIEW INVISIBLE TEMPLATE LAYER */}
            <AnimatePresence>
                {viewQuotation && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '2rem' }}>
                        <div style={{ width: '100%', maxWidth: '210mm', position: 'relative' }}>
                            <div style={{ position: 'sticky', top: 0, display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1rem', zIndex: 10 }}>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={handlePrint} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4)' }}><Printer size={18} /> A4 Print / PDF</motion.button>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setViewQuotation(null)} style={{ background: '#fff', color: '#0f172a', border: 'none', width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}><X size={20} /></motion.button>
                            </div>
                            <div style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden' }}>
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
