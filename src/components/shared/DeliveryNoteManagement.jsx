import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, X, Search, RefreshCw, Printer, Trash2, Truck, Store, MapPin, Building2, Package, CheckCircle, Eye, Clock } from 'lucide-react';
import api from '../../api';
import useSubmitGuard from '../../utils/useSubmitGuard';
import DeliveryNoteTemplate from './DeliveryNoteTemplate';
import './QuotationManagement.css';
import '../../styles/modern-table.css';

const DeliveryNoteManagement = ({ currentUser, showToast }) => {
    const [deliveryNotes, setDeliveryNotes] = useState([]);
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [projects, setProjects] = useState([]);
    const [businessData, setBusinessData] = useState(null);
    const [stockEntries, setStockEntries] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'root';

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [creationMode, setCreationMode] = useState('automatic');
    const [editingDN, setEditingDN] = useState(null);
    const [viewingDN, setViewingDN] = useState(null);

    const [viewDeliveryNote, setViewDeliveryNote] = useState(null);
    const printRef = useRef();

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [dnToDelete, setDnToDelete] = useState(null);
    const [historyDN, setHistoryDN] = useState(null);

    const [serialModalOpen, setSerialModalOpen] = useState(false);
    const [serialItemIndex, setSerialItemIndex] = useState(null);
    const [availableSerials, setAvailableSerials] = useState([]);
    const [manualSerialInput, setManualSerialInput] = useState('');
    const { isSubmitting, runGuarded } = useSubmitGuard();

    const initialForm = {
        clientRef: '',
        projectId: '',
        deliveryType: 'Client',
        selectedStoreRef: '',
        deliveryDate: new Date().toISOString().split('T')[0],
        deliveryAddress: '',
        customerPORef: '',

        manualClientDetails: { title: 'Mr', organization: '', name: '', address: '', telephoneNumber: '', emailAddress: '' },
        items: [],
        terms: '',
        notes: ''
    };
    const [form, setForm] = useState(initialForm);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [dnRes, cRes, pRes, bRes, prRes] = await Promise.all([
                api.get('/delivery-notes'),
                api.get('/clients'),
                api.get('/products'),
                api.get('/business'),
                api.get('/projects')
            ]);
            setDeliveryNotes(dnRes.data.data);
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

    const handlePrint = () => {
        if (!viewDeliveryNote) return;

        const dnId = viewDeliveryNote.deliveryNoteNumber || 'DN';
        const clientName = viewDeliveryNote.clientRef
            ? (viewDeliveryNote.clientRef.firstName + (viewDeliveryNote.clientRef.lastName ? '_' + viewDeliveryNote.clientRef.lastName : ''))
            : (viewDeliveryNote.manualClientDetails?.organization || viewDeliveryNote.manualClientDetails?.name || 'Client');
        const cleanClient = clientName.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_+/g, '_');
        const dateStr = new Date(viewDeliveryNote.createdAt || Date.now()).toISOString().slice(0, 10);
        const fileName = `${dnId}_${cleanClient}_${dateStr}`;

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
        }, 400);
    };

    const openCreation = () => {
        setCreationMode('automatic');
        setEditingDN(null);
        const defaultTerms = businessData?.deliveryNoteTerms || 'Standard delivery terms apply.';
        const defaultNotes = businessData?.deliveryNoteNotes || '';
        setForm({ ...initialForm, terms: defaultTerms, notes: defaultNotes });
        setIsCreateModalOpen(true);
    };

    const openEdit = (dn) => {
        setCreationMode('automatic');
        setEditingDN(dn);
        setForm({
            clientRef: dn.clientRef?._id || dn.clientRef || '',
            projectId: dn.projectId?._id || dn.projectId || '',
            deliveryType: dn.deliveryType || 'Client',
            selectedStoreRef: dn.selectedStoreRef || '',
            deliveryAddress: dn.deliveryAddress || '',
            customerPORef: dn.customerPORef || '',
            deliveryDate: dn.deliveryDate ? new Date(dn.deliveryDate).toISOString().split('T')[0] : '',

            manualClientDetails: dn.manualClientDetails || { title: 'Mr', organization: '', name: '', address: '', telephoneNumber: '', emailAddress: '' },
            items: dn.items || [],
            terms: dn.terms || '',
            notes: dn.notes || ''
        });
        setIsCreateModalOpen(true);
    };

    const handleClientChange = (clientId) => {
        if (clientId) {
            const client = clients.find(c => c._id === clientId);
            if (client) {
                const addr = client.address || '';
                setForm(prev => ({
                    ...prev,
                    clientRef: clientId,
                    manualClientDetails: {
                        title: client.clientType === 'Organization' ? 'Organization' : 'Mr',
                        organization: client.clientType === 'Organization' ? client.firstName : '',
                        name: client.clientType === 'Organization' ? '' : `${client.firstName || ''} ${client.lastName || ''}`.trim(),
                        address: addr,
                        telephoneNumber: client.telephoneNumber || '',
                        emailAddress: client.emailAddress || ''
                    },
                    deliveryAddress: prev.deliveryType === 'Client' ? addr : prev.deliveryAddress
                }));
            }
        } else {
            setForm(prev => ({ ...prev, clientRef: clientId }));
        }
    };

    const handleDeliveryTypeChange = (type) => {
        let addr = '';
        if (type === 'Organization') {
            addr = businessData?.address || '';
        } else if (type === 'Store') {
            const stores = businessData?.stores || [];
            if (stores.length > 0) {
                setForm(prev => ({ ...prev, deliveryType: type, selectedStoreRef: stores[0].name || '', deliveryAddress: stores[0].address || '' }));
                return;
            }
        } else if (type === 'Client') {
            if (form.clientRef) {
                const client = clients.find(c => c._id === form.clientRef);
                addr = client?.address || '';
            }
        }
        setForm(prev => ({ ...prev, deliveryType: type, deliveryAddress: addr }));
    };

    const handleStoreChange = (storeName) => {
        const stores = businessData?.stores || [];
        const store = stores.find(s => s.name === storeName);
        setForm(prev => ({
            ...prev,
            selectedStoreRef: storeName,
            deliveryAddress: store?.address || ''
        }));
    };

    const handleAddItem = () => {
        setForm(prev => ({ ...prev, items: [...prev.items, { productRef: '', manualName: '', quantity: 1, serialNumbers: [] }] }));
    };

    const updateItem = (index, field, value) => {
        setForm(prev => {
            const newItems = [...prev.items];
            newItems[index] = { ...newItems[index], [field]: value };
            if (field === 'productRef' && value) {
                const prod = products.find(p => p._id === value);
                if (prod) {
                    newItems[index].manualName = prod.name;
                    newItems[index].serialNumbers = [];
                }
            }
            return { ...prev, items: newItems };
        });
    };

    const removeItem = (index) => {
        setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    };

    const openSerialModal = async (index) => {
        setSerialItemIndex(index);
        setManualSerialInput('');
        const item = form.items[index];
        if (creationMode === 'automatic' && item.productRef) {
            try {
                const res = await api.get(`/products/${item.productRef}/stock`);
                const entries = res.data.data || [];
                const allSerials = entries.flatMap(e => e.serialNumbers || []);
                setAvailableSerials(allSerials);
            } catch {
                setAvailableSerials([]);
            }
        } else {
            setAvailableSerials([]);
        }
        setSerialModalOpen(true);
    };

    const toggleSerialSelection = (serial) => {
        const idx = serialItemIndex;
        setForm(prev => {
            const newItems = [...prev.items];
            const currentSerials = newItems[idx]?.serialNumbers || [];
            if (currentSerials.includes(serial)) {
                newItems[idx] = { ...newItems[idx], serialNumbers: currentSerials.filter(s => s !== serial) };
            } else {
                newItems[idx] = { ...newItems[idx], serialNumbers: [...currentSerials, serial] };
            }
            return { ...prev, items: newItems };
        });
    };

    const addManualSerial = () => {
        if (!manualSerialInput.trim()) return;
        const idx = serialItemIndex;
        setForm(prev => {
            const newItems = [...prev.items];
            const currentSerials = newItems[idx]?.serialNumbers || [];
            if (!currentSerials.includes(manualSerialInput.trim().toUpperCase())) {
                newItems[idx] = { ...newItems[idx], serialNumbers: [...currentSerials, manualSerialInput.trim().toUpperCase()] };
            }
            return { ...prev, items: newItems };
        });
        setManualSerialInput('');
    };

    const removeSerial = (serial) => {
        const idx = serialItemIndex;
        setForm(prev => {
            const newItems = [...prev.items];
            newItems[idx] = { ...newItems[idx], serialNumbers: (newItems[idx]?.serialNumbers || []).filter(s => s !== serial) };
            return { ...prev, items: newItems };
        });
    };

    const handleCreate = async () => {
        await runGuarded(async () => {
            try {
                const itemsWithQty = form.items.map(item => ({
                    ...item,
                    quantity: item.quantity || item.serialNumbers?.length || 0
                }));
                const payload = {
                    creationMethod: 'automatic',
                    items: itemsWithQty,
                    terms: form.terms,
                    notes: form.notes,
                    clientRef: form.clientRef || undefined,
                    projectId: form.projectId || undefined,
                    deliveryType: form.deliveryType,
                    selectedStoreRef: form.deliveryType === 'Store' ? form.selectedStoreRef : '',
                    deliveryAddress: form.deliveryAddress,
                    customerPORef: form.customerPORef || undefined,
                    deliveryDate: form.deliveryDate || undefined,

                };

                let res;
                if (editingDN) {
                    res = await api.put(`/delivery-notes/${editingDN._id}`, payload);
                    setDeliveryNotes(prev => prev.map(d => d._id === editingDN._id ? res.data.data : d));
                } else {
                    res = await api.post('/delivery-notes', payload);
                    setDeliveryNotes(prev => [res.data.data, ...prev]);
                }
                setIsCreateModalOpen(false);
                setEditingDN(null);
                showToast?.(editingDN ? 'Delivery note updated' : 'Delivery note created');
            } catch (error) {
                showToast?.(error.response?.data?.message || 'Save failed', 'error');
            }
        });
    };

    const handleDelete = async () => {
        if (!dnToDelete) return;
        await runGuarded(async () => {
            try {
                await api.delete(`/delivery-notes/${dnToDelete._id}`);
                setDeliveryNotes(prev => prev.filter(dn => dn._id !== dnToDelete._id));
                setDeleteModalOpen(false);
                setDnToDelete(null);
                showToast?.('Delivery note deleted');
            } catch (error) {
                showToast?.(error.response?.data?.message || 'Deletion failed', 'error');
            }
        });
    };

    const handleDeliver = async (dn) => {
        await runGuarded(async () => {
            try {
                const res = await api.put(`/delivery-notes/${dn._id}/deliver`);
                setDeliveryNotes(prev => prev.map(d => d._id === dn._id ? res.data.data : d));
                showToast?.('Delivery note delivered');
            } catch (e) {
                showToast?.(e.response?.data?.message || 'Failed to deliver', 'error');
            }
        });
    };

    const getClientDisplay = (dn) => {
        if (dn.clientRef) {
            const c = dn.clientRef;
            return c.clientType === 'Organization' ? c.firstName : `${c.firstName || ''} ${c.lastName || ''}`.trim();
        }
        const m = dn.manualClientDetails || {};
        return m.organization || m.name || '—';
    };

    const filteredDNs = deliveryNotes.filter(dn =>
        (dn.deliveryNoteNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (getClientDisplay(dn) || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const deliveredCount = deliveryNotes.filter(dn => dn.status === 'Delivered').length;
    const draftCount = deliveryNotes.filter(dn => dn.status === 'Draft' || !dn.status).length;

    const modalOverlay = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '20px'
    };

    const modalContent = {
        background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '900px',
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px rgba(0,0,0,0.2)'
    };

    const modalHeader = {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 24px', borderBottom: '1px solid #e2e8f0'
    };

    const modalBody = {
        padding: '24px', overflow: 'auto', flex: 1
    };

    const modalFooter = {
        display: 'flex', justifyContent: 'flex-end', gap: '12px',
        padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc'
    };

    const inputStyle = {
        width: '100%', padding: '10px 14px', borderRadius: '10px',
        border: '1.5px solid #e2e8f0', fontSize: '0.9rem', fontFamily: "'Outfit', sans-serif",
        outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box'
    };

    const labelStyle = {
        display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569',
        marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'
    };

    if (loading) {
        return (
            <div className="pm-root">
                <div className="pm-loading"><RefreshCw className="animate-spin" size={20} /> Loading delivery notes...</div>
            </div>
        );
    }

    return (
        <div className="pm-root">
            <div style={{ display: 'none' }}>
                <div ref={printRef}>
                    {viewDeliveryNote && businessData && (
                        <DeliveryNoteTemplate deliveryNote={viewDeliveryNote} business={businessData} />
                    )}
                </div>
            </div>

            <div className="pm-stats">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pm-stat-card indigo">
                    <div className="pm-stat-icon indigo"><Truck size={22} /></div>
                    <div className="pm-stat-body">
                        <div className="pm-stat-value">{deliveryNotes.length}</div>
                        <div className="pm-stat-label">Total Notes</div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="pm-stat-card green">
                    <div className="pm-stat-icon green"><CheckCircle size={22} /></div>
                    <div className="pm-stat-body">
                        <div className="pm-stat-value">{deliveredCount}</div>
                        <div className="pm-stat-label">Delivered</div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="pm-stat-card amber">
                    <div className="pm-stat-icon amber"><FileText size={22} /></div>
                    <div className="pm-stat-body">
                        <div className="pm-stat-value">{draftCount}</div>
                        <div className="pm-stat-label">Draft</div>
                    </div>
                </motion.div>
            </div>

            <div className="pm-card">
                <div className="pm-card-header">
                    <div className="pm-card-title">
                        <div className="pm-card-icon indigo"><Truck size={22} /></div>
                        <div>
                            <h3>Delivery Note Engine</h3>
                            <div className="pm-card-subtitle">Create, deliver, and track delivery notes with stock integration.</div>
                        </div>
                    </div>
                    <div className="pm-card-actions">
                        <div className="pm-search-wrap">
                            <Search size={14} className="pm-search-icon" />
                            <input type="text" placeholder="Search by number or client..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pm-search-input" />
                        </div>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => openCreation()} className="pm-btn pm-btn-primary"><Plus size={16} /> Create Delivery Note</motion.button>
                    </div>
                </div>

            <div className="modern-table-card">
                <div className="modern-table-scroll">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>Delivery Note #</th>
                            <th>Client</th>
                            <th>Status</th>
                            <th>Delivery Type</th>
                            <th>Items</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDNs.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="modern-table-empty">No delivery notes found</td>
                            </tr>
                        ) : (
                            filteredDNs.map((dn, i) => (
                                <tr key={dn._id}>
                                    <td><strong>{dn.deliveryNoteNumber}</strong></td>
                                    <td>{getClientDisplay(dn)}</td>
                                    <td>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                            padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem',
                                            fontWeight: 700,
                                            background: dn.status === 'Delivered' ? '#dcfce7' : '#fef3c7',
                                            color: dn.status === 'Delivered' ? '#166534' : '#92400e'
                                        }}>
                                            {dn.status === 'Delivered' ? '✓' : '○'} {dn.status || 'Draft'}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                            padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem',
                                            fontWeight: 700, background: '#f1f5f9', color: '#475569'
                                        }}>
                                            {dn.deliveryType === 'Store' ? <Store size={12} /> : dn.deliveryType === 'Organization' ? <Building2 size={12} /> : <MapPin size={12} />}
                                            {dn.deliveryType}
                                        </span>
                                    </td>
                                    <td>{(dn.items || []).length} item{(dn.items || []).length !== 1 ? 's' : ''}</td>
                                    <td>{new Date(dn.createdAt).toLocaleDateString('en-GB')}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                            <button onClick={() => { setViewingDN(dn); }} style={{
                                                padding: '6px 10px', borderRadius: '8px', border: 'none',
                                                background: '#f1f5f9', color: '#475569', cursor: 'pointer',
                                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                fontSize: '0.75rem', fontWeight: 600, fontFamily: "'Outfit', sans-serif"
                                            }}>
                                                <FileText size={14} /> View
                                            </button>
                                            <button onClick={() => { setViewDeliveryNote(dn); setTimeout(handlePrint, 100); }} style={{
                                                padding: '6px 10px', borderRadius: '8px', border: 'none',
                                                background: '#f1f5f9', color: '#475569', cursor: 'pointer',
                                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                fontSize: '0.75rem', fontWeight: 600, fontFamily: "'Outfit', sans-serif"
                                            }}>
                                                <Printer size={14} /> Print
                                            </button>
                                            <button onClick={() => setHistoryDN(dn)} style={{
                                                padding: '6px 10px', borderRadius: '8px', border: 'none',
                                                background: '#f1f5f9', color: '#475569', cursor: 'pointer',
                                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                fontSize: '0.75rem', fontWeight: 600, fontFamily: "'Outfit', sans-serif"
                                            }}>
                                                <Clock size={14} /> History
                                            </button>
                                            {dn.status === 'Draft' && (
                                                <>
                                                    <button onClick={() => openEdit(dn)} style={{
                                                        padding: '6px 10px', borderRadius: '8px', border: 'none',
                                                        background: '#fef3c7', color: '#92400e', cursor: 'pointer',
                                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                        fontSize: '0.75rem', fontWeight: 600, fontFamily: "'Outfit', sans-serif"
                                                    }}>
                                                        <FileText size={14} /> Edit
                                                    </button>
                                                    <button onClick={() => handleDeliver(dn)} disabled={isSubmitting} style={{
                                                        padding: '6px 10px', borderRadius: '8px', border: 'none',
                                                        background: '#dcfce7', color: '#166534', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                        fontSize: '0.75rem', fontWeight: 600, fontFamily: "'Outfit', sans-serif",
                                                        opacity: isSubmitting ? 0.7 : 1
                                                    }}>
                                                        <CheckCircle size={14} /> Deliver
                                                    </button>
                                                </>
                                            )}
                                            {dn.status === 'Delivered' && (
                                                <button onClick={() => {
                                                    localStorage.setItem('preSelectedDN', dn._id);
                                                    showToast?.('Delivery note selected. Go to Invoice Engine to create invoice.', 'success');
                                                }} style={{
                                                    padding: '6px 10px', borderRadius: '8px', border: 'none',
                                                    background: '#e0f2fe', color: '#0369a1', cursor: 'pointer',
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                    fontSize: '0.75rem', fontWeight: 600, fontFamily: "'Outfit', sans-serif"
                                                }}>
                                                    <FileText size={14} /> Invoice
                                                </button>
                                            )}
                                            {isAdmin && dn.status === 'Draft' && (
                                                <button onClick={() => { setDnToDelete(dn); setDeleteModalOpen(true); }} style={{
                                                    padding: '6px 10px', borderRadius: '8px', border: 'none',
                                                    background: '#fef2f2', color: '#ef4444', cursor: 'pointer',
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                    fontSize: '0.75rem', fontWeight: 600, fontFamily: "'Outfit', sans-serif"
                                                }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                </div>
            </div>
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={modalOverlay}
                        onClick={() => setIsCreateModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 12 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 12 }}
                            style={modalContent}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={modalHeader}>
                                <div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
                                        {editingDN ? 'Edit Delivery Note' : 'New Delivery Note'}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>
                                        {editingDN ? `Editing ${editingDN.deliveryNoteNumber}` : 'Select client and items from catalog'}
                                    </div>
                                </div>
                                <button onClick={() => setIsCreateModalOpen(false)} style={{
                                    padding: '8px', borderRadius: '10px', border: 'none',
                                    background: '#f1f5f9', color: '#64748b', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center'
                                }}>
                                    <X size={18} />
                                </button>
                            </div>

                            <div style={modalBody}>
                                {/* Client Section */}
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', fontFamily: "'Outfit', sans-serif", marginBottom: '12px' }}>
                                        <Truck size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                        Client Information
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={labelStyle}>Client</label>
                                            <select value={form.clientRef} onChange={e => handleClientChange(e.target.value)} style={inputStyle}>
                                                <option value="">Select a client...</option>
                                                {clients.map(c => (
                                                    <option key={c._id} value={c._id}>
                                                        {c.clientType === 'Organization' ? c.firstName : `${c.firstName || ''} ${c.lastName || ''}`.trim()}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Project</label>
                                            <select value={form.projectId} onChange={e => setForm(prev => ({ ...prev, projectId: e.target.value }))} style={inputStyle}>
                                                <option value="">No project</option>
                                                {projects.filter(p => !form.clientRef || p.client === form.clientRef || (p.client?._id === form.clientRef)).map(p => (
                                                    <option key={p._id} value={p._id}>{p.name || p.projectId}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Customer PO Ref</label>
                                            <input
                                                type="text"
                                                value={form.customerPORef}
                                                onChange={e => setForm(prev => ({ ...prev, customerPORef: e.target.value }))}
                                                placeholder="e.g. PO-2024-001"
                                                style={inputStyle}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Delivery Section */}
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', fontFamily: "'Outfit', sans-serif", marginBottom: '12px' }}>
                                        <MapPin size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                        Delivery Details
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={labelStyle}>Delivery Type</label>
                                            <select value={form.deliveryType} onChange={e => handleDeliveryTypeChange(e.target.value)} style={inputStyle}>
                                                <option value="Client">Client Address</option>
                                                <option value="Store">Store Address</option>
                                                <option value="Organization">Organization Address</option>
                                            </select>
                                        </div>
                                        {form.deliveryType === 'Store' && (
                                            <div>
                                                <label style={labelStyle}>Select Store</label>
                                                <select value={form.selectedStoreRef} onChange={e => handleStoreChange(e.target.value)} style={inputStyle}>
                                                    {(businessData?.stores || []).map((s, i) => (
                                                        <option key={i} value={s.name}>{s.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        <div>
                                            <label style={labelStyle}>Delivery Date</label>
                                            <input type="date" value={form.deliveryDate}
                                                onChange={e => setForm(prev => ({ ...prev, deliveryDate: e.target.value }))}
                                                style={inputStyle} />
                                        </div>
                                        <div style={{ gridColumn: form.deliveryType === 'Store' ? '1 / -1' : undefined }}>
                                            <label style={labelStyle}>Delivery Address</label>
                                            <textarea
                                                value={form.deliveryAddress}
                                                onChange={e => setForm(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                                                style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
                                                placeholder="Delivery address (auto-populated based on type, or type manually)"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Items Section */}
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
                                            <Package size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                            Items
                                        </div>
                                        <button onClick={handleAddItem} style={{
                                            padding: '6px 14px', borderRadius: '8px', border: '1.5px dashed #cbd5e1',
                                            background: 'transparent', color: '#64748b', fontWeight: 600, fontSize: '0.8rem',
                                            cursor: 'pointer', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: '4px'
                                        }}>
                                            <Plus size={14} /> Add Item
                                        </button>
                                    </div>
                                    {form.items.length === 0 ? (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, fontFamily: "'Outfit', sans-serif", background: '#f8fafc', borderRadius: '12px' }}>
                                            No items added. Click "Add Item" to begin.
                                        </div>
                                    ) : (
                                        form.items.map((item, i) => (
                                            <div key={i} style={{
                                                padding: '16px', marginBottom: '10px', borderRadius: '12px',
                                                border: '1px solid #e2e8f0', background: '#fafafa'
                                            }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto auto', gap: '10px', alignItems: 'end' }}>
                                                    <div>
                                                        <label style={labelStyle}>Product</label>
                                                        <select value={item.productRef} onChange={e => updateItem(i, 'productRef', e.target.value)} style={inputStyle}>
                                                            <option value="">Select product...</option>
                                                            {products.map(p => (
                                                                <option key={p._id} value={p._id}>{p.name} (Qty: {p.quantity})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                    <div>
                                        <label style={labelStyle}>Qty</label>
                                        <input type="number" min="1" value={item.quantity}
                                            onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                                            style={{ ...inputStyle, background: '#fff' }} />
                                    </div>
                                                    <div>
                                                        <label style={labelStyle}>Serials</label>
                                                        <button onClick={() => openSerialModal(i)} style={{
                                                            ...inputStyle, cursor: 'pointer', background: '#f1f5f9',
                                                            border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center',
                                                            justifyContent: 'center', gap: '4px', fontWeight: 600, fontSize: '0.8rem'
                                                        }}>
                                                            <FileText size={14} /> Select Serials
                                                        </button>
                                                    </div>
                                                    <button onClick={() => removeItem(i)} style={{
                                                        padding: '10px', borderRadius: '8px', border: 'none',
                                                        background: '#fef2f2', color: '#ef4444', cursor: 'pointer'
                                                    }}>
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                                {item.serialNumbers && item.serialNumbers.length > 0 && (
                                                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                        {item.serialNumbers.map((sn, si) => (
                                                            <span key={si} style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px',
                                                                fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 600, color: '#334155'
                                                            }}>
                                                                {sn}
                                                                <button onClick={() => {
                                                                    const idx = i;
                                                                    setForm(prev => {
                                                                        const newItems = [...prev.items];
                                                                        newItems[idx] = { ...newItems[idx], serialNumbers: newItems[idx].serialNumbers.filter(s => s !== sn) };
                                                                        return { ...prev, items: newItems };
                                                                    });
                                                                }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, fontSize: '12px' }}>
                                                                    <X size={12} />
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Terms & Notes */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={labelStyle}>Delivery Terms</label>
                                        <textarea value={form.terms} onChange={e => setForm(prev => ({ ...prev, terms: e.target.value }))}
                                            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                                            placeholder="Terms and conditions for this delivery..." />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Notes</label>
                                        <textarea value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                                            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                                            placeholder="Additional notes..." />
                                    </div>
                                </div>
                            </div>

                            <div style={modalFooter}>
                                <button onClick={() => setIsCreateModalOpen(false)} style={{
                                    padding: '10px 20px', borderRadius: '10px', border: '1.5px solid #e2e8f0',
                                    background: '#fff', color: '#64748b', fontWeight: 700, fontSize: '0.85rem',
                                    cursor: 'pointer', fontFamily: "'Outfit', sans-serif"
                                }}>
                                    Cancel
                                </button>
                                <button onClick={handleCreate} disabled={isSubmitting} style={{
                                    padding: '10px 24px', borderRadius: '10px', border: 'none',
                                    background: isSubmitting ? '#a78bfa' : '#8b5cf6', color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: '6px',
                                    opacity: isSubmitting ? 0.85 : 1
                                }}>
                                    <FileText size={16} /> {isSubmitting ? 'Processing...' : (editingDN ? 'Save Changes' : 'Create Delivery Note')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Serial Number Modal */}
            <AnimatePresence>
                {serialModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={modalOverlay}
                        onClick={() => setSerialModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 12 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 12 }}
                            style={{ ...modalContent, maxWidth: '500px' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={modalHeader}>
                                <div>
                                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
                                        Select Serial Numbers
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>
                                        Choose from available stock
                                    </div>
                                </div>
                                <button onClick={() => setSerialModalOpen(false)} style={{
                                    padding: '8px', borderRadius: '10px', border: 'none',
                                    background: '#f1f5f9', color: '#64748b', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center'
                                }}>
                                    <X size={18} />
                                </button>
                            </div>

                            <div style={modalBody}>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                    <input
                                        type="text"
                                        placeholder="Type or scan serial number..."
                                        value={manualSerialInput}
                                        onChange={e => setManualSerialInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addManualSerial(); } }}
                                        style={inputStyle}
                                    />
                                    <button onClick={addManualSerial} style={{
                                        padding: '10px 16px', borderRadius: '10px', border: 'none',
                                        background: '#8b5cf6', color: '#fff', fontWeight: 700, fontSize: '0.8rem',
                                        cursor: 'pointer', fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap'
                                    }}>
                                        Add
                                    </button>
                                </div>

                                {availableSerials.length > 0 ? (
                                    <div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '10px', fontFamily: "'Outfit', sans-serif" }}>
                                            {availableSerials.length} serial(s) available
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {availableSerials.map((serial, i) => {
                                                const isSelected = form.items[serialItemIndex]?.serialNumbers?.includes(serial);
                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => toggleSerialSelection(serial)}
                                                        style={{
                                                            padding: '6px 12px', borderRadius: '8px', border: `1.5px solid ${isSelected ? '#8b5cf6' : '#e2e8f0'}`,
                                                            background: isSelected ? '#f5f3ff' : '#fff',
                                                            color: isSelected ? '#8b5cf6' : '#475569',
                                                            fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'monospace',
                                                            transition: 'all 0.15s'
                                                        }}
                                                    >
                                                        {serial}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>
                                        No serials available for this product in stock.
                                    </div>
                                )}

                                {/* Selected serials display */}
                                {serialItemIndex !== null && form.items[serialItemIndex]?.serialNumbers?.length > 0 && (
                                    <div style={{ marginTop: '16px' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px', fontFamily: "'Outfit', sans-serif" }}>
                                            Selected ({form.items[serialItemIndex].serialNumbers.length})
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {form.items[serialItemIndex].serialNumbers.map((sn, si) => (
                                                <span key={si} style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                    background: '#f5f3ff', padding: '4px 10px', borderRadius: '6px',
                                                    fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 600, color: '#8b5cf6',
                                                    border: '1px solid #ddd6fe'
                                                }}>
                                                    {sn}
                                                    <button onClick={() => removeSerial(sn)} style={{
                                                        border: 'none', background: 'none', cursor: 'pointer',
                                                        color: '#a78bfa', padding: 0, fontSize: '14px', lineHeight: 1
                                                    }}>
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={modalFooter}>
                                <button onClick={() => setSerialModalOpen(false)} style={{
                                    padding: '10px 20px', borderRadius: '10px', border: 'none',
                                    background: '#8b5cf6', color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                                    cursor: 'pointer', fontFamily: "'Outfit', sans-serif"
                                }}>
                                    Done
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Modal */}
            <AnimatePresence>
                {deleteModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={modalOverlay}
                        onClick={() => setDeleteModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 12 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 12 }}
                            style={{ ...modalContent, maxWidth: '400px' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={modalHeader}>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ef4444', fontFamily: "'Outfit', sans-serif" }}>
                                    Delete Delivery Note
                                </div>
                                <button onClick={() => setDeleteModalOpen(false)} style={{
                                    padding: '8px', borderRadius: '10px', border: 'none',
                                    background: '#f1f5f9', color: '#64748b', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center'
                                }}>
                                    <X size={18} />
                                </button>
                            </div>
                            <div style={{ padding: '24px', fontFamily: "'Outfit', sans-serif", fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
                                Are you sure you want to delete delivery note <strong>{dnToDelete?.deliveryNoteNumber}</strong>? This action cannot be undone.
                            </div>
                            <div style={modalFooter}>
                                <button onClick={() => setDeleteModalOpen(false)} style={{
                                    padding: '10px 20px', borderRadius: '10px', border: '1.5px solid #e2e8f0',
                                    background: '#fff', color: '#64748b', fontWeight: 700, fontSize: '0.85rem',
                                    cursor: 'pointer', fontFamily: "'Outfit', sans-serif"
                                }}>
                                    Cancel
                                </button>
                                <button onClick={handleDelete} disabled={isSubmitting} style={{
                                    padding: '10px 20px', borderRadius: '10px', border: 'none',
                                    background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer', fontFamily: "'Outfit', sans-serif",
                                    opacity: isSubmitting ? 0.85 : 1
                                }}>
                                    {isSubmitting ? 'Processing...' : 'Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* History Modal */}
            <AnimatePresence>
                {historyDN && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '2rem 1rem' }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ background: '#fff', borderRadius: '24px', padding: '2rem', width: '100%', maxWidth: 600, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '80vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.3rem' }}>Version History</h2>
                                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>{historyDN.deliveryNoteNumber}</p>
                                </div>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setHistoryDN(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></motion.button>
                            </div>
                            <div>
                                {(historyDN.history && historyDN.history.length > 0) ? (
                                    historyDN.history.map((entry, i) => (
                                        <div key={i} style={{
                                            display: 'flex', gap: '1rem', padding: '1rem 0',
                                            borderBottom: i < historyDN.history.length - 1 ? '1px solid #f1f5f9' : 'none'
                                        }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: '50%',
                                                background: entry.action === 'Created' ? '#dbeafe' : entry.action === 'Delivered' ? '#dcfce7' : '#fef3c7',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                            }}>
                                                <Clock size={16} color={entry.action === 'Created' ? '#2563eb' : entry.action === 'Delivered' ? '#16a34a' : '#d97706'} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                                    <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{entry.action}</strong>
                                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(entry.editedAt).toLocaleString('en-GB')}</span>
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>{entry.changes}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                                                    by {entry.editedBy?.firstName || 'Unknown'} {entry.editedBy?.lastName || ''}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No history recorded for this delivery note.</div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* View Modal — renders same format as print */}
            <AnimatePresence>
                {viewingDN && businessData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={modalOverlay}
                        onClick={() => setViewingDN(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 12 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 12 }}
                            style={{ ...modalContent, maxWidth: '850px' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={modalHeader}>
                                <div>
                                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
                                        {viewingDN.deliveryNoteNumber}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>
                                        {viewingDN.status === 'Delivered' ? '✓ Delivered' : '○ Draft'}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => { const p = viewingDN; setViewDeliveryNote(p); setTimeout(() => { handlePrint(); }, 100); }} style={{
                                        padding: '8px', borderRadius: '10px', border: 'none',
                                        background: '#f1f5f9', color: '#475569', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center'
                                    }}>
                                        <Printer size={18} />
                                    </button>
                                    <button onClick={() => setViewingDN(null)} style={{
                                        padding: '8px', borderRadius: '10px', border: 'none',
                                        background: '#f1f5f9', color: '#64748b', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center'
                                    }}>
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                            <div style={{
                                padding: '20px 24px', overflow: 'auto', flex: 1,
                                background: '#f8f9fa', display: 'flex', justifyContent: 'center'
                            }}>
                                <div style={{
                                    background: '#fff', width: '210mm', padding: '12mm 14mm',
                                    boxShadow: '0 2px 20px rgba(0,0,0,0.08)', borderRadius: '4px',
                                    boxSizing: 'border-box', fontSize: '12px', lineHeight: '1.6',
                                    fontFamily: "'Arial', 'Helvetica Neue', sans-serif", color: '#0f172a'
                                }}>
                                    <DeliveryNoteTemplate deliveryNote={viewingDN} business={businessData} />
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DeliveryNoteManagement;
