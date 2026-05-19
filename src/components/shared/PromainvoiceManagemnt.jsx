import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, X, Search, RefreshCw, Printer, AlertTriangle, ShieldAlert, CheckCircle, Users, Briefcase, Barcode } from 'lucide-react';
import api from '../../api';
import PriceInput from '../../utils/PriceInput';
import InvoiceTemplate from './InvoiceTemplate';
import './PromainvoiceManagemnt.css';
import '../../styles/modern-table.css';

const PromainvoiceManagemnt = ({ currentUser, showToast }) => {
    const [invoices, setInvoices] = useState([]);
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [stockEntries, setStockEntries] = useState([]);
    const [businessData, setBusinessData] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [creationMode, setCreationMode] = useState('automatic');
    const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
    const [activeItemIndex, setActiveItemIndex] = useState(null);

    const [viewInvoice, setViewInvoice] = useState(null);
    const printRef = useRef();

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');

    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [statusForm, setStatusForm] = useState({ status: 'Paid', note: '' });
    const [selectedInvoiceForStatus, setSelectedInvoiceForStatus] = useState(null);

    const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
    const [newClientForm, setNewClientForm] = useState({ firstName: '', lastName: '', clientType: 'Person', telephoneNumber: '', whatsappNumber: '', address: '', emailAddress: '' });

    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
    const [newProjectForm, setNewProjectForm] = useState({ name: '', client: '', location: '', startDate: '', endDate: '', value: 0 });

    const initialForm = {
        clientRef: '',
        projectId: '',
        paymentMethod: 'cash',
        creditPeriod: { duration: 0, unit: 'days' },
        deliveryAddress: '',
        manualClientDetails: { title: 'Mr', organization: '', name: '', address: '', telephoneNumber: '', emailAddress: '' },
        items: [],
        subTotal: 0,
        appliedDiscounts: [],
        discountTotal: 0,
        hasTax: false, appliedTaxes: [], taxTotal: 0,
        finalTotal: 0,
        currency: 'primary',
        status: 'Unpaid',
        invoiceDate: new Date().toISOString().split('T')[0]
    };
    const [form, setForm] = useState(initialForm);
    const [applyDiscountMode, setApplyDiscountMode] = useState(false);
    const [customDiscount, setCustomDiscount] = useState({ type: 'percentage', value: 0 });

    const [serialSearchTerm, setSerialSearchTerm] = useState('');
    const [selectedSerialsPerItem, setSelectedSerialsPerItem] = useState({});
    const [manualSerialInput, setManualSerialInput] = useState('');

    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'root';

    const fetchData = async () => {
        setLoading(true);
        try {
            const [invRes, cRes, pRes, bRes, prRes] = await Promise.all([
                api.get('/invoices'),
                api.get('/clients'),
                api.get('/products'),
                api.get('/business'),
                api.get('/projects')
            ]);
            setInvoices(invRes.data.data);
            setClients(cRes.data.data);
            setProducts(pRes.data.data);
            setProjects(prRes.data.data);
            if (bRes.data.data.details) setBusinessData(bRes.data.data.details);
        } catch (error) {
            showToast?.('Error fetching data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const fetchStockForProduct = async (productId) => {
        try {
            const res = await api.get(`/products/${productId}/stock`);
            return res.data.data.filter(entry => entry.quantity > 0);
        } catch {
            return [];
        }
    };

    const handlePrint = () => {
        if (!viewInvoice) return;
        const invId = viewInvoice.invoiceNumber || 'INV';
        const clientName = viewInvoice.clientRef
            ? (viewInvoice.clientRef.firstName + (viewInvoice.clientRef.lastName ? '_' + viewInvoice.clientRef.lastName : ''))
            : (viewInvoice.manualClientDetails?.organization || viewInvoice.manualClientDetails?.name || 'Client');
        const cleanClient = clientName.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_+/g, '_');
        const dateStr = new Date(viewInvoice.createdAt || Date.now()).toISOString().slice(0, 10);
        const fileName = `${invId}_${cleanClient}_${dateStr}`;

        const printContent = printRef.current;
        const windowPrint = window.open('', '', 'left=0,top=0,width=900,height=1100,toolbar=0,scrollbars=1,status=0');
        windowPrint.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>${fileName}</title>
                    <style>
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
                        @media print {
                            @page { size: A4 portrait; margin: 14mm 15mm 14mm 15mm; }
                            body { margin: 0 !important; padding: 0 !important; }
                            div { padding: 0 !important; }
                            * { box-shadow: none !important; }
                            tr { page-break-inside: avoid; }
                        }
                    </style>
                </head>
                <body>${printContent.innerHTML}</body>
            </html>
        `);
        windowPrint.document.close();
        windowPrint.focus();
        setTimeout(() => { windowPrint.print(); windowPrint.close(); }, 400);
    };

    const calculateTotals = (currentForm) => {
        const subTotal = currentForm.subTotal;
        const discountTotal = (currentForm.appliedDiscounts || []).reduce((sum, d) => sum + (d.amount || 0), 0);
        let taxableBase = subTotal - discountTotal;
        let taxTotal = 0;
        let updatedTaxes = [];
        if (currentForm.hasTax && currentForm.appliedTaxes) {
            updatedTaxes = currentForm.appliedTaxes.map(tax => {
                const amount = tax.type === 'percentage' ? (taxableBase * tax.value) / 100 : tax.value;
                taxTotal += amount;
                return { ...tax, amount };
            });
        }
        let finalTotal = taxableBase + taxTotal;
        return { ...currentForm, discountTotal, appliedTaxes: updatedTaxes, taxTotal, finalTotal };
    };

    const openCreation = (mode) => {
        if (mode === 'manual' && !isAdmin) {
            showToast?.('Manual invoice creation is restricted to admin users', 'error');
            return;
        }
        setCreationMode(mode);
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
        setSelectedSerialsPerItem({});
        setManualSerialInput('');
        setIsCreateModalOpen(true);
    };

    const handleAddItem = () => {
        setForm(prev => ({ ...prev, items: [...prev.items, { productRef: '', manualName: '', quantity: 1, unitPrice: 0, lineTotal: 0, serialNumbers: [] }] }));
    };

    const updateItem = async (index, field, value) => {
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

        if (field === 'productRef' && value) {
            const entries = await fetchStockForProduct(value);
            setStockEntries(prev => {
                const updated = [...prev.filter(e => e.product !== value), ...entries];
                return updated;
            });
        }
    };

    const handleSerialSearch = async (itemIndex) => {
        if (!serialSearchTerm.trim()) return;
        const item = form.items[itemIndex];
        if (!item.productRef) {
            showToast?.('Select a product first', 'error');
            return;
        }
        const entries = stockEntries.filter(e => e.product === item.productRef);
        const matchingSerials = [];
        for (const entry of entries) {
            for (const sn of entry.serialNumbers) {
                if (sn.toUpperCase().includes(serialSearchTerm.toUpperCase()) && !item.serialNumbers.includes(sn)) {
                    matchingSerials.push({ serial: sn, batchRef: entry.batchRef, entryId: entry._id });
                }
            }
        }
        return matchingSerials;
    };

    const toggleSerialForItem = (itemIndex, serial) => {
        const item = form.items[itemIndex];
        const qty = item.quantity;
        const currentSerials = item.serialNumbers || [];

        if (currentSerials.includes(serial)) {
            const updated = currentSerials.filter(s => s !== serial);
            updateItem(itemIndex, 'serialNumbers', updated);
        } else {
            if (currentSerials.length >= qty) {
                showToast?.(`You can only select ${qty} serial(s) for this item.`, 'warning');
                return;
            }
            const updated = [...currentSerials, serial];
            updateItem(itemIndex, 'serialNumbers', updated);
        }
    };

    const recalculateFinal = () => {
        setForm(prev => calculateTotals(prev));
    };

    const handleToggleTax = (e) => {
        const checked = e.target.checked;
        setForm(prev => calculateTotals({ ...prev, hasTax: checked }));
    };

    const handleClientSelect = (clientId) => {
        const selected = clients.find(c => c._id === clientId);
        setForm({
            ...form,
            clientRef: clientId,
            manualClientDetails: selected ? {
                title: 'Mr',
                organization: selected.clientType === 'Organization' ? selected.firstName : '',
                name: selected.clientType !== 'Organization' ? `${selected.firstName} ${selected.lastName || ''}`.trim() : '',
                address: selected.address || '',
                telephoneNumber: selected.telephoneNumber || selected.whatsappNumber || '',
                emailAddress: selected.emailAddress || ''
            } : form.manualClientDetails,
            deliveryAddress: selected?.address || form.deliveryAddress
        });
    };

    const submitInvoice = async (e) => {
        e.preventDefault();
        if (form.items.length === 0) return showToast?.('Insert at least 1 item', 'error');
        if (!form.paymentMethod) return showToast?.('Select payment method', 'error');
        if (!form.projectId) return showToast?.('A project must be selected before generating an invoice', 'error');

        // Enforce Paid status on frontend for cash payments before submit
        const payload = { ...form, creationMethod: creationMode };
        if (payload.paymentMethod === 'cash') {
            payload.status = 'Paid';
        }

        try {
            await api.post('/invoices', payload);
            showToast?.('Invoice created successfully', 'success');
            setIsCreateModalOpen(false);
            fetchData();
        } catch (err) {
            showToast?.(err.response?.data?.message || 'Failed to create invoice', 'error');
        }
    };

    const openStatusModal = (inv) => {
        if (inv.paymentMethod === 'cash') {
            return showToast?.('Cash invoices are permanently marked as Paid.', 'warning');
        }
        setSelectedInvoiceForStatus(inv);
        setStatusForm({ status: inv.status, note: '' });
        setIsStatusModalOpen(true);
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/invoices/${selectedInvoiceForStatus._id}/status`, statusForm);
            showToast?.('Status updated successfully', 'success');
            setIsStatusModalOpen(false);
            fetchData();
            // Update viewInvoice if it is currently open
            if (viewInvoice && viewInvoice._id === selectedInvoiceForStatus._id) {
                const res = await api.get(`/invoices/${selectedInvoiceForStatus._id}`);
                setViewInvoice(res.data.data);
            }
        } catch (err) {
            showToast?.(err.response?.data?.message || 'Failed to update status', 'error');
        }
    };

    const handleCreateClient = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/clients', newClientForm);
            showToast?.('Client created', 'success');
            setClients(prev => [...prev, res.data.data]);
            setForm(prev => ({ ...prev, clientRef: res.data.data._id, deliveryAddress: res.data.data.address || '' }));
            setIsNewClientModalOpen(false);
            setNewClientForm({ firstName: '', lastName: '', clientType: 'Person', telephoneNumber: '', whatsappNumber: '', address: '', emailAddress: '' });
        } catch (err) {
            showToast?.(err.response?.data?.message || 'Failed to create client', 'error');
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/projects', newProjectForm);
            showToast?.('Project created', 'success');
            setProjects(prev => [...prev, res.data.data]);
            setForm(prev => ({ ...prev, projectId: res.data.data._id }));
            setIsNewProjectModalOpen(false);
            setNewProjectForm({ name: '', client: '', location: '', startDate: '', endDate: '', value: 0 });
        } catch (err) {
            showToast?.(err.response?.data?.message || 'Failed to create project', 'error');
        }
    };

    const openDeleteModal = (inv) => {
        setInvoiceToDelete(inv);
        setDeleteReason('');
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        try {
            if (isAdmin) {
                await api.delete(`/invoices/${invoiceToDelete._id}`);
                showToast?.('Invoice deleted', 'success');
            } else {
                if (!deleteReason.trim()) return showToast?.('Reason is required', 'error');
                await api.post(`/invoices/${invoiceToDelete._id}/request-delete`, { reason: deleteReason });
                showToast?.('Deletion request sent', 'success');
            }
            setDeleteModalOpen(false);
            setInvoiceToDelete(null);
            fetchData();
        } catch (err) {
            showToast?.('Delete failed', 'error');
        }
    };

    const filtered = invoices.filter(inv =>
        inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.clientRef?.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.manualClientDetails?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#64748b', marginBottom: '0.6rem', textTransform: 'uppercase' };
    const inputStyle = { width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '0.8rem 1.25rem', color: '#0f172a', outline: 'none', fontWeight: 600, boxSizing: 'border-box' };

    return (
        <div className="im-root">
            {loading ? (
                <div className="im-loading"><RefreshCw className="animate-spin" color="#64748b" /></div>
            ) : (
                <div className="im-card">
                    <div className="im-card-header">
                        <div className="im-card-title">
                            <div className="im-card-icon" style={{ background: 'var(--im-green-s)', color: 'var(--im-green)' }}><FileText size={22} /></div>
                            <div>
                                <h3>Invoice Engine</h3>
                                <div className="im-card-subtitle">Generate invoices with stock integration and warranty tracking.</div>
                            </div>
                        </div>
                        <div className="im-card-actions">
                            <div className="im-search-wrap">
                                <Search size={16} className="im-search-icon" />
                                <input type="text" placeholder="Search INV00000 or Client..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="im-search-input" />
                            </div>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => openCreation('automatic')} className="im-btn im-btn-primary"><Plus size={18} /> Automatic</motion.button>
                            {isAdmin && (
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => openCreation('manual')} className="im-btn im-btn-outline"><Plus size={18} /> Manual</motion.button>
                            )}
                        </div>
                    </div>
                    <div className="im-table-wrap modern-table-card">
                        <table className="im-table modern-table">
                            <thead>
                                <tr>
                                    <th>Invoice ID</th>
                                    <th>Client</th>
                                    <th>Payment</th>
                                    <th className="text-right">Total</th>
                                    <th className="text-center">Status</th>
                                    <th className="text-center" style={{ width: '180px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(inv => (
                                    <tr key={inv._id}>
                                        <td>
                                            <div className="modern-table-cell-primary">
                                                <div style={{ fontWeight: 800, color: '#10b981', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{inv.invoiceNumber}</div>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>{new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td>
                                            {inv.clientRef ? `${inv.clientRef.firstName} ${inv.clientRef.lastName}` : inv.manualClientDetails?.name || 'Unknown'}
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, textTransform: 'capitalize' }}>
                                                {inv.paymentMethod?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <span style={{ fontWeight: 800, color: '#059669', fontSize: '0.95rem' }}>
                                                {businessData?.primaryCurrency?.symbol || 'Rs.'} {parseFloat(inv.finalTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <span onClick={() => openStatusModal(inv)} className={`im-badge${inv.status === 'Paid' ? ' im-badge-paid' : inv.status === 'Pending' ? ' im-badge-pending' : ' im-badge-unpaid'}`} style={{ cursor: inv.paymentMethod === 'cash' ? 'default' : 'pointer', transition: 'all 0.2s' }} title={inv.paymentMethod === 'cash' ? 'Cash invoices cannot change status' : 'Click to update status'}>{inv.status}</span>
                                        </td>
                                        <td>
                                            <div className="im-table-actions modern-table-actions">
                                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setViewInvoice(inv)} className="modern-table-action view"><Printer size={14} /></motion.button>
                                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => openDeleteModal(inv)} className="modern-table-action delete"><Trash2 size={14} /></motion.button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && <tr><td colSpan="6"><div className="im-empty">No invoices in registry.</div></td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* CREATE MODAL */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: 900, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontWeight: 900 }}>Create Invoice [{creationMode.toUpperCase()}]</h2>
                                    <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                                        {creationMode === 'automatic' ? 'Stock will be reduced automatically' : 'Manual pricing - admin only'}
                                    </p>
                                </div>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsCreateModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></motion.button>
                            </div>

                            <form onSubmit={submitInvoice}>
                                {/* CLIENT & PROJECT INFO */}
                                <div style={{ marginBottom: '1.5rem', padding: '1.5rem', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                    <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>1. Client & Project</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={labelStyle}>Select Client</label>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <select value={form.clientRef} onChange={e => handleClientSelect(e.target.value)} style={{ ...inputStyle, background: '#fff', flex: 1 }}>
                                                    <option value="" disabled>Select client...</option>
                                                    {clients.map(c => <option key={c._id} value={c._id}>{c.clientType === 'Organization' ? c.firstName : `${c.firstName} ${c.lastName || ''}`} ({c.clientId})</option>)}
                                                </select>
                                                <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => setIsNewClientModalOpen(true)} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', padding: '0 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Add New Client"><Users size={18} /></motion.button>
                                            </div>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Project <span style={{ color: '#ef4444' }}>*</span> <span style={{ color: '#94a3b8', fontWeight: 600, textTransform: 'none', fontSize: '0.7rem' }}>(Required)</span></label>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} style={{ ...inputStyle, background: '#fff', flex: 1, borderColor: !form.projectId ? '#fca5a5' : '#e2e8f0' }}>
                                                    <option value="" disabled>Select project...</option>
                                                    {projects.filter(p => !form.clientRef || p.client === form.clientRef || (p.client?._id === form.clientRef)).map(p => <option key={p._id} value={p._id}>{p.name} ({p.projectId})</option>)}
                                                </select>
                                                <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => setIsNewProjectModalOpen(true)} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', padding: '0 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Add New Project"><Briefcase size={18} /></motion.button>
                                            </div>
                                            {!form.projectId && <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.3rem', fontWeight: 700 }}>⚠ Select a project to enable invoice generation</div>}
                                        </div>
                                    </div>
                                </div>

                                {/* PAYMENT & DELIVERY */}
                                <div style={{ marginBottom: '1.5rem', padding: '1.5rem', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                    <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>2. Payment & Delivery</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={labelStyle}>Payment Method</label>
                                            <select value={form.paymentMethod} onChange={e => {
                                                const val = e.target.value;
                                                setForm({ ...form, paymentMethod: val, status: val === 'cash' ? 'Paid' : form.status });
                                            }} style={{ ...inputStyle, background: '#fff' }}>
                                                <option value="cash">Cash</option>
                                                <option value="cheque">Cheque</option>
                                                <option value="bank_transfer">Bank Transfer</option>
                                                <option value="credit">Credit</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Invoice Date</label>
                                            <input type="date" value={form.invoiceDate} onChange={e => setForm({ ...form, invoiceDate: e.target.value })} style={{ ...inputStyle, background: '#fff' }} />
                                        </div>
                                        {form.paymentMethod === 'credit' ? (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={labelStyle}>Credit Duration</label>
                                                    <input type="number" min="1" value={form.creditPeriod.duration} onChange={e => setForm({ ...form, creditPeriod: { ...form.creditPeriod, duration: parseInt(e.target.value) || 0 } })} style={{ ...inputStyle, background: '#fff' }} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={labelStyle}>Unit</label>
                                                    <select value={form.creditPeriod.unit} onChange={e => setForm({ ...form, creditPeriod: { ...form.creditPeriod, unit: e.target.value } })} style={{ ...inputStyle, background: '#fff' }}>
                                                        <option value="days">Days</option>
                                                        <option value="weeks">Weeks</option>
                                                        <option value="months">Months</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ opacity: 0.5, pointerEvents: 'none' }}>
                                                <label style={labelStyle}>Credit Terms</label>
                                                <div style={{ ...inputStyle, background: '#f1f5f9' }}>N/A</div>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ marginTop: '1rem' }}>
                                        <label style={labelStyle}>Delivery Address</label>
                                        <input value={form.deliveryAddress} onChange={e => setForm({ ...form, deliveryAddress: e.target.value })} placeholder="Auto-filled from client or enter manually" style={{ ...inputStyle, background: '#fff' }} />
                                    </div>
                                </div>

                                {/* ITEMS */}
                                <div style={{ marginBottom: '1.5rem', padding: '1.5rem', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ margin: 0, color: '#0f172a' }}>3. Products</h4>
                                        <button type="button" onClick={handleAddItem} style={{ background: '#0f172a', color: '#fff', padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Plus size={14} /> Add Item</button>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1.5px solid #e2e8f0' }}>
                                                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item/Module</th>
                                                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748b', width: '8%', textTransform: 'uppercase' }}>QTY</th>
                                                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontSize: '0.75rem', color: '#64748b', width: '15%', textTransform: 'uppercase' }}>Unit Price</th>
                                                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontSize: '0.75rem', color: '#64748b', width: '15%', textTransform: 'uppercase' }}>Line Total</th>
                                                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748b', width: '18%', textTransform: 'uppercase' }}>Serials</th>
                                                <th style={{ width: '50px' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {form.items.map((it, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '0.75rem 0.5rem' }}>
                                                        <select required value={it.productRef} onChange={e => updateItem(idx, 'productRef', e.target.value)} style={{ ...inputStyle, background: '#fff', padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
                                                            <option value="" disabled>Select Product...</option>
                                                            {products.map(p => <option key={p._id} value={p._id}>{p.name} [{p.productId}]</option>)}
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: '0.75rem 0.5rem' }}>
                                                        <input required type="number" min="1" value={it.quantity} onChange={e => {
                                                            const newQty = parseInt(e.target.value) || 1;
                                                            updateItem(idx, 'quantity', newQty);
                                                            // Clear extra serials if qty reduced
                                                            if (it.serialNumbers?.length > newQty) {
                                                                updateItem(idx, 'serialNumbers', it.serialNumbers.slice(0, newQty));
                                                            }
                                                        }} style={{ ...inputStyle, background: '#fff', padding: '0.6rem 0.5rem', textAlign: 'center', fontSize: '0.85rem' }} />
                                                    </td>
                                                    <td style={{ padding: '0.75rem 0.5rem' }}>
                                                        <div style={{ position: 'relative' }}>
                                                            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.75rem' }}>{businessData?.primaryCurrency?.symbol || 'Rs.'}</span>
                                                            <PriceInput value={it.unitPrice} onChange={v => updateItem(idx, 'unitPrice', v)} disabled={creationMode === 'automatic'} style={{ ...inputStyle, background: creationMode === 'automatic' ? '#f8fafc' : '#fff', padding: '0.6rem 0.75rem 0.6rem 1.5rem', textAlign: 'right', fontSize: '0.85rem' }} required />
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                                                        {it.lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                                                        {creationMode === 'automatic' && it.productRef && (
                                                            <motion.button
                                                                type="button"
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => { setActiveItemIndex(idx); setIsSerialModalOpen(true); }}
                                                                style={{
                                                                    background: (it.serialNumbers?.length === it.quantity) ? '#10b981' : (it.serialNumbers?.length > 0 ? '#f59e0b' : '#0f172a'),
                                                                    color: '#fff',
                                                                    border: 'none',
                                                                    borderRadius: '8px',
                                                                    padding: '6px 12px',
                                                                    fontSize: '0.7rem',
                                                                    fontWeight: 800,
                                                                    cursor: 'pointer',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.4rem'
                                                                }}
                                                            >
                                                                <Barcode size={14} />
                                                                {it.serialNumbers?.length || 0} / {it.quantity}
                                                            </motion.button>
                                                        )}
                                                        {creationMode === 'manual' && it.productRef && (
                                                            <motion.button
                                                                type="button"
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => { setActiveItemIndex(idx); setIsSerialModalOpen(true); }}
                                                                style={{
                                                                    background: it.serialNumbers?.length > 0 ? '#6366f1' : '#64748b',
                                                                    color: '#fff',
                                                                    border: 'none',
                                                                    borderRadius: '8px',
                                                                    padding: '6px 12px',
                                                                    fontSize: '0.7rem',
                                                                    fontWeight: 800,
                                                                    cursor: 'pointer',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.4rem'
                                                                }}
                                                            >
                                                                <Barcode size={14} />
                                                                {it.serialNumbers?.length || 0} SN{it.serialNumbers?.length !== 1 ? 's' : ''}
                                                            </motion.button>
                                                        )}
                                                        {creationMode === 'manual' && !it.productRef && (
                                                            <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontStyle: 'italic' }}>Select product</div>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                                                        <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={() => {
                                                            setForm(prev => {
                                                                const n = prev.items.filter((_, i) => i !== idx);
                                                                const sub = n.reduce((acc, c) => acc + c.lineTotal, 0);
                                                                return calculateTotals({ ...prev, items: n, subTotal: sub });
                                                            });
                                                        }} style={{ background: '#fee2e2', border: 'none', color: '#ef4444', cursor: 'pointer', width: 32, height: 32, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></motion.button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {form.items.length === 0 && <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No modules connected to array. Use 'Add Item' to start.</td></tr>}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td colSpan="3" style={{ padding: '1rem', textAlign: 'right', fontWeight: 800, color: '#64748b', fontSize: '0.8rem' }}>NET SUB TOTAL:</td>
                                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 900, fontSize: '1.1rem', color: '#0f172a', borderTop: '2.5px solid #0f172a' }}>{form.subTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                                <td colSpan="2"></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* DISCOUNTS & TAXES */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>Discounts</div>
                                            <input type="checkbox" checked={form.appliedDiscounts?.length > 0 || form.discountTotal > 0} onChange={(e) => {
                                                if (e.target.checked && businessData?.discountProfiles?.length > 0) setApplyDiscountMode(true);
                                                else { setForm({ ...form, appliedDiscounts: [], discountTotal: 0 }); recalculateFinal(); }
                                            }} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                                        </div>
                                        {(form.appliedDiscounts?.length > 0 || form.discountTotal > 0 || applyDiscountMode) && (
                                            <div>
                                                <div style={{ marginBottom: '1rem' }}>
                                                    <label style={{ ...labelStyle, color: '#0f172a' }}>Promotional Yields</label>
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
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <label style={{ ...labelStyle, color: '#0f172a' }}>Custom Discount</label>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <select value={customDiscount.type} onChange={e => setCustomDiscount({ ...customDiscount, type: e.target.value })} style={{ ...inputStyle, background: '#f8fafc', padding: '0.5rem', flex: 1 }}>
                                                            <option value="percentage">% Percentage</option>
                                                            <option value="fixed">Fixed Amount</option>
                                                        </select>
                                                        <input type="number" step="0.01" placeholder="Value" value={customDiscount.value || ''} onChange={e => setCustomDiscount({ ...customDiscount, value: parseFloat(e.target.value) || 0 })} style={{ ...inputStyle, background: '#f8fafc', padding: '0.5rem', flex: 1 }} />
                                                        <button type="button" onClick={() => {
                                                            if (customDiscount.value > 0) {
                                                                setForm(prev => {
                                                                    const amount = customDiscount.type === 'percentage' ? (prev.subTotal * customDiscount.value) / 100 : customDiscount.value;
                                                                    return calculateTotals({ ...prev, appliedDiscounts: [...(prev.appliedDiscounts || []), { name: 'Custom', type: customDiscount.type, value: customDiscount.value, amount }] });
                                                                });
                                                                setCustomDiscount({ type: 'percentage', value: 0 });
                                                            }
                                                        }} style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 700 }}>Add</button>
                                                    </div>
                                                </div>
                                                {form.appliedDiscounts?.length > 0 && (
                                                    <div style={{ marginTop: '1rem' }}>
                                                        {form.appliedDiscounts.map((disc, i) => (
                                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: '#d1fae5', borderRadius: '8px', marginBottom: '0.5rem' }}>
                                                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{disc.name} ({disc.type === 'percentage' ? disc.value + '%' : 'Rs. ' + disc.value})</span>
                                                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669' }}>- Rs. {disc.amount.toLocaleString()}</span>
                                                                <button type="button" onClick={() => setForm(prev => calculateTotals({ ...prev, appliedDiscounts: prev.appliedDiscounts.filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}>x</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>Taxes</div>
                                            <input type="checkbox" checked={form.hasTax} onChange={handleToggleTax} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                                        </div>
                                        {form.hasTax && (
                                            <div>
                                                {businessData?.isVatRegistered && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', padding: '0.5rem', background: form.appliedTaxes?.some(t => t.name === 'VAT') ? '#d1fae5' : '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                        <input type="checkbox" checked={form.appliedTaxes?.some(t => t.name === 'VAT')} onChange={e => {
                                                            setForm(prev => {
                                                                let taxes = [...(prev.appliedTaxes || [])];
                                                                if (e.target.checked) taxes.push({ name: 'VAT', type: 'percentage', value: businessData.vatPercentage, amount: 0 });
                                                                else taxes = taxes.filter(t => t.name !== 'VAT');
                                                                return calculateTotals({ ...prev, appliedTaxes: taxes });
                                                            });
                                                        }} style={{ cursor: 'pointer' }} />
                                                        <div style={{ flex: 1, fontSize: '0.8rem', color: '#0f172a' }}><strong>VAT</strong> ({businessData.vatPercentage}%)</div>
                                                    </div>
                                                )}
                                                {businessData?.otherTaxes?.map((tax, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', padding: '0.5rem', background: form.appliedTaxes?.some(t => t.name === tax.name) ? '#d1fae5' : '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                        <input type="checkbox" checked={form.appliedTaxes?.some(t => t.name === tax.name)} onChange={e => {
                                                            setForm(prev => {
                                                                let taxes = [...(prev.appliedTaxes || [])];
                                                                if (e.target.checked) taxes.push({ name: tax.name, type: tax.type, value: tax.value, amount: 0 });
                                                                else taxes = taxes.filter(t => t.name !== tax.name);
                                                                return calculateTotals({ ...prev, appliedTaxes: taxes });
                                                            });
                                                        }} style={{ cursor: 'pointer' }} />
                                                        <div style={{ flex: 1, fontSize: '0.8rem', color: '#0f172a' }}><strong>{tax.name}</strong> ({tax.type === 'percentage' ? tax.value + '%' : 'Rs. ' + tax.value})</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* STATUS */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={labelStyle}>Invoice Status</label>
                                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} disabled={form.paymentMethod === 'cash'} style={{ ...inputStyle, background: form.paymentMethod === 'cash' ? '#f1f5f9' : '#fff', maxWidth: '200px', opacity: form.paymentMethod === 'cash' ? 0.7 : 1 }}>
                                        <option value="Unpaid">Unpaid</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Paid">Paid</option>
                                    </select>
                                    {form.paymentMethod === 'cash' && <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '0.3rem', fontWeight: 700 }}>✓ Cash invoices are automatically Paid</div>}
                                </div>

                                {/* FINAL TOTAL */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: '#0f172a', borderRadius: '16px', color: '#fff', marginBottom: '2rem' }}>
                                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 900, color: '#94a3b8' }}>Final Total</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px' }}>{form.finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                                </div>

                                <motion.button whileTap={{ scale: 0.98 }} type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', padding: '1rem', width: '100%', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1rem' }}><CheckCircle size={20} /> Create Invoice</motion.button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isSerialModalOpen && activeItemIndex !== null && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: 600, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
                            <div style={{ background: '#0f172a', padding: '1.5rem 2rem', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>Serial Number Assignment</h3>
                                    <p style={{ margin: '0.25rem 0 0', opacity: 0.7, fontSize: '0.8rem' }}>Assign {form.items[activeItemIndex].quantity} serials for {form.items[activeItemIndex].manualName}</p>
                                </div>
                                <button onClick={() => setIsSerialModalOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#fff', cursor: 'pointer' }}><X size={18} /></button>
                            </div>
                            <div style={{ padding: '2rem' }}>
                                {/* MANUAL TYPE-IN SECTION (manual mode only) */}
                                {creationMode === 'manual' && (
                                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f0f4ff', borderRadius: '12px', border: '1.5px solid #c7d2fe' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#4338ca', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Type / Scan Serial Number</div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input
                                                type="text"
                                                placeholder="Type or scan serial number..."
                                                value={manualSerialInput}
                                                onChange={e => setManualSerialInput(e.target.value.toUpperCase())}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const sn = manualSerialInput.trim();
                                                        if (!sn) return;
                                                        const current = form.items[activeItemIndex].serialNumbers || [];
                                                        if (current.includes(sn)) { showToast?.('Serial already added', 'warning'); return; }
                                                        toggleSerialForItem(activeItemIndex, sn);
                                                        setManualSerialInput('');
                                                    }
                                                }}
                                                style={{ ...inputStyle, background: '#fff', flex: 1 }}
                                            />
                                            <motion.button
                                                type="button"
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    const sn = manualSerialInput.trim();
                                                    if (!sn) return;
                                                    const current = form.items[activeItemIndex].serialNumbers || [];
                                                    if (current.includes(sn)) { showToast?.('Serial already added', 'warning'); return; }
                                                    toggleSerialForItem(activeItemIndex, sn);
                                                    setManualSerialInput('');
                                                }}
                                                style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '12px', padding: '0 1.25rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                                            >Add</motion.button>
                                        </div>
                                        {(form.items[activeItemIndex].serialNumbers?.length > 0) && (
                                            <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                                {form.items[activeItemIndex].serialNumbers.map(sn => (
                                                    <span key={sn} style={{ background: '#e0e7ff', color: '#3730a3', fontWeight: 700, fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                                        {sn}
                                                        <button type="button" onClick={() => toggleSerialForItem(activeItemIndex, sn)} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: 0, fontSize: '0.9rem', lineHeight: 1 }}>×</button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* STOCK SEARCH & SELECT SECTION */}
                                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <div style={{ position: 'relative', flex: 1 }}>
                                        <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                        <input type="text" placeholder={creationMode === 'manual' ? 'Search serial in stock...' : 'Scan or search serial...'} value={serialSearchTerm} onChange={e => setSerialSearchTerm(e.target.value)} style={{ ...inputStyle, padding: '0.8rem 1rem 0.8rem 2.5rem', background: '#f8fafc' }} />
                                    </div>
                                    <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={() => handleSerialSearch(activeItemIndex)} style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', padding: '0 1.5rem', fontWeight: 800, cursor: 'pointer' }}>Find</motion.button>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Available Stock</span>
                                        <span style={{ color: form.items[activeItemIndex].serialNumbers?.length === form.items[activeItemIndex].quantity ? '#10b981' : '#f59e0b' }}>
                                            {form.items[activeItemIndex].serialNumbers?.length || 0} / {form.items[activeItemIndex].quantity} Selected
                                        </span>
                                    </div>
                                    <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1.5px solid #f1f5f9', borderRadius: '16px', background: '#f8fafc' }}>
                                        {stockEntries.filter(e => e.product === form.items[activeItemIndex].productRef && e.serialNumbers.length > 0).length > 0 ? (
                                            stockEntries.filter(e => e.product === form.items[activeItemIndex].productRef).flatMap(e =>
                                                e.serialNumbers
                                                    .filter(sn => sn.toUpperCase().includes(serialSearchTerm.toUpperCase()))
                                                    .map(sn => {
                                                        const isSelected = form.items[activeItemIndex].serialNumbers?.includes(sn);
                                                        return (
                                                            <div key={sn} onClick={() => toggleSerialForItem(activeItemIndex, sn)} style={{
                                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.25rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                                                                background: isSelected ? '#d1fae5' : 'transparent', transition: 'all 0.2s'
                                                            }}>
                                                                <div>
                                                                    <div style={{ fontWeight: 700, color: isSelected ? '#059669' : '#0f172a', fontSize: '0.9rem' }}>{sn}</div>
                                                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Batch: {e.batchRef}</div>
                                                                </div>
                                                                {isSelected ? <CheckCircle size={18} color="#059669" /> : <div style={{ width: 18, height: 18, border: '2px solid #cbd5e1', borderRadius: '50%' }} />}
                                                            </div>
                                                        );
                                                    })
                                            )
                                        ) : (
                                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No serial numbers found for this product.</div>
                                        )}
                                    </div>
                                </div>

                                <motion.button whileTap={{ scale: 0.98 }} onClick={() => setIsSerialModalOpen(false)} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', padding: '1rem', width: '100%', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}>Confirm Assignment</motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* NEW CLIENT MODAL */}
            <AnimatePresence>
                {isNewClientModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: 500, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0, fontWeight: 900 }}>Add New Client</h2>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsNewClientModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></motion.button>
                            </div>
                            <form onSubmit={handleCreateClient}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div><label style={labelStyle}>First Name</label><input required value={newClientForm.firstName} onChange={e => setNewClientForm({ ...newClientForm, firstName: e.target.value })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                    <div><label style={labelStyle}>Last Name</label><input value={newClientForm.lastName} onChange={e => setNewClientForm({ ...newClientForm, lastName: e.target.value })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={labelStyle}>Client Type</label>
                                    <select value={newClientForm.clientType} onChange={e => setNewClientForm({ ...newClientForm, clientType: e.target.value })} style={{ ...inputStyle, background: '#fff' }}>
                                        <option value="Person">Person</option>
                                        <option value="Business">Business</option>
                                        <option value="Organization">Organization</option>
                                    </select>
                                </div>
                                <div style={{ marginBottom: '1rem' }}><label style={labelStyle}>Address</label><input value={newClientForm.address} onChange={e => setNewClientForm({ ...newClientForm, address: e.target.value })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div><label style={labelStyle}>Phone</label><input value={newClientForm.telephoneNumber} onChange={e => setNewClientForm({ ...newClientForm, telephoneNumber: e.target.value })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                    <div><label style={labelStyle}>Email</label><input type="email" value={newClientForm.emailAddress} onChange={e => setNewClientForm({ ...newClientForm, emailAddress: e.target.value })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                </div>
                                <motion.button whileTap={{ scale: 0.98 }} type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.8rem', width: '100%', fontWeight: 800, cursor: 'pointer' }}>Create & Select Client</motion.button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* NEW PROJECT MODAL */}
            <AnimatePresence>
                {isNewProjectModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: 500, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0, fontWeight: 900 }}>Add New Project</h2>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsNewProjectModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></motion.button>
                            </div>
                            <form onSubmit={handleCreateProject}>
                                <div style={{ marginBottom: '1rem' }}><label style={labelStyle}>Project Name</label><input required value={newProjectForm.name} onChange={e => setNewProjectForm({ ...newProjectForm, name: e.target.value })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={labelStyle}>Client</label>
                                    <select value={newProjectForm.client} onChange={e => setNewProjectForm({ ...newProjectForm, client: e.target.value })} style={{ ...inputStyle, background: '#fff' }}>
                                        <option value="">Select client...</option>
                                        {clients.map(c => <option key={c._id} value={c._id}>{c.clientType === 'Organization' ? c.firstName : `${c.firstName} ${c.lastName || ''}`}</option>)}
                                    </select>
                                </div>
                                <div style={{ marginBottom: '1rem' }}><label style={labelStyle}>Location</label><input value={newProjectForm.location} onChange={e => setNewProjectForm({ ...newProjectForm, location: e.target.value })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div><label style={labelStyle}>Start Date</label><input type="date" value={newProjectForm.startDate} onChange={e => setNewProjectForm({ ...newProjectForm, startDate: e.target.value })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                    <div><label style={labelStyle}>End Date</label><input type="date" value={newProjectForm.endDate} onChange={e => setNewProjectForm({ ...newProjectForm, endDate: e.target.value })} style={{ ...inputStyle, background: '#fff' }} /></div>
                                </div>
                                <motion.button whileTap={{ scale: 0.98 }} type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.8rem', width: '100%', fontWeight: 800, cursor: 'pointer' }}>Create & Select Project</motion.button>
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
                                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}>Authorize Direct Nullification?</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>Executing this will permanently destroy this invoice.</p>
                                </>
                            ) : (
                                <>
                                    <AlertTriangle size={48} color="#f59e0b" style={{ marginBottom: '1rem', margin: '0 auto' }} />
                                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}>Propose Deletion Request</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Provide reason for Security Approval.</p>
                                    <textarea placeholder="State explicit reason..." value={deleteReason} onChange={e => setDeleteReason(e.target.value)} required style={{ ...inputStyle, height: 100, resize: 'none', marginBottom: '2rem', textAlign: 'left' }} />
                                </>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setDeleteModalOpen(false)} style={{ background: '#f8fafc', color: '#64748b', border: 'none', borderRadius: '12px', padding: '0.8rem', fontWeight: 800, cursor: 'pointer' }}>Abort</motion.button>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={confirmDelete} style={{ background: isAdmin ? '#ef4444' : '#f59e0b', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.8rem', fontWeight: 800, cursor: 'pointer' }}>Proceed</motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* STATUS UPDATE MODAL */}
            <AnimatePresence>
                {isStatusModalOpen && selectedInvoiceForStatus && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: 450, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0, fontWeight: 900 }}>Update Status for {selectedInvoiceForStatus.invoiceNumber}</h3>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsStatusModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></motion.button>
                            </div>
                            <form onSubmit={handleUpdateStatus}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={labelStyle}>New Status</label>
                                    <select value={statusForm.status} onChange={e => setStatusForm({ ...statusForm, status: e.target.value })} style={{ ...inputStyle, background: '#fff' }}>
                                        <option value="Unpaid">Unpaid</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Paid">Paid</option>
                                    </select>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={labelStyle}>Update Note (Optional)</label>
                                    <textarea placeholder="Reason for status change, payment ref, etc..." value={statusForm.note} onChange={e => setStatusForm({ ...statusForm, note: e.target.value })} style={{ ...inputStyle, height: 80, resize: 'none', background: '#fff' }} />
                                </div>
                                <motion.button whileTap={{ scale: 0.98 }} type="submit" style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '12px', padding: '1rem', width: '100%', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>Update Status</motion.button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* VIEW/PRINT MODAL */}
            <AnimatePresence>
                {viewInvoice && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '2rem' }}>
                        <div style={{ width: '100%', maxWidth: '210mm', position: 'relative' }}>
                            <div style={{ position: 'sticky', top: 0, display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1rem', zIndex: 10 }}>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={handlePrint} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4)' }}><Printer size={18} /> A4 Print / PDF</motion.button>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setViewInvoice(null)} style={{ background: '#fff', color: '#0f172a', border: 'none', width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}><X size={20} /></motion.button>
                            </div>
                            <div style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden' }}>
                                <InvoiceTemplate ref={printRef} invoice={viewInvoice} business={businessData} />
                            </div>

                            {/* STATUS HISTORY SECTION - ADMIN ONLY */}
                            {isAdmin && (
                                <div style={{ marginTop: '2rem', background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                                    <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, color: '#0f172a', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <RefreshCw size={20} color="#4f46e5" /> Status History
                                    </h3>
                                    {viewInvoice.statusHistory && viewInvoice.statusHistory.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {viewInvoice.statusHistory.map((hist, idx) => (
                                                <div key={idx} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '40px' }}>
                                                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#4f46e5', margin: '4px 0' }} />
                                                        {idx < viewInvoice.statusHistory.length - 1 && <div style={{ width: 2, height: '100%', background: '#e2e8f0', minHeight: '30px' }} />}
                                                    </div>
                                                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', flex: 1, border: '1px solid #e2e8f0' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                            <span className={`im-badge${hist.status === 'Paid' ? ' im-badge-paid' : hist.status === 'Pending' ? ' im-badge-pending' : ' im-badge-unpaid'}`} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>{hist.status}</span>
                                                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{new Date(hist.editedAt).toLocaleString()}</span>
                                                        </div>
                                                        <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: hist.note ? '0.5rem' : '0' }}>
                                                            Updated by <strong style={{ color: '#0f172a' }}>{hist.editedBy?.firstName || 'System'} {hist.editedBy?.lastName || ''}</strong>
                                                        </div>
                                                        {hist.note && (
                                                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', background: '#fff', padding: '0.5rem', borderRadius: '6px', borderLeft: '3px solid #cbd5e1' }}>
                                                                "{hist.note}"
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>No status history available.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InvoiceManagement;
