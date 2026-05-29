import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, X, Search, RefreshCw, Printer, Trash2, Truck, Store, MapPin, Building2, Package } from 'lucide-react';
import api from '../../api';
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

    const [viewDeliveryNote, setViewDeliveryNote] = useState(null);
    const printRef = useRef();

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [dnToDelete, setDnToDelete] = useState(null);

    const [serialModalOpen, setSerialModalOpen] = useState(false);
    const [serialItemIndex, setSerialItemIndex] = useState(null);
    const [availableSerials, setAvailableSerials] = useState([]);
    const [manualSerialInput, setManualSerialInput] = useState('');

    const initialForm = {
        clientRef: '',
        projectId: '',
        deliveryType: 'Client',
        selectedStoreRef: '',
        deliveryAddress: '',
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

    const openCreation = (mode) => {
        setCreationMode(mode);
        const defaultTerms = businessData?.deliveryNoteTerms || 'Standard delivery terms apply.';
        const defaultNotes = businessData?.deliveryNoteNotes || '';
        if (mode === 'automatic') {
            setForm({ ...initialForm, terms: defaultTerms, notes: defaultNotes });
        } else {
            setForm({ ...initialForm, terms: defaultTerms, notes: defaultNotes });
        }
        setIsCreateModalOpen(true);
    };

    const handleClientChange = (clientId) => {
        if (clientId && creationMode === 'automatic') {
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
        try {
            let payload = {
                creationMethod: creationMode,
                items: form.items,
                terms: form.terms,
                notes: form.notes
            };

            if (creationMode === 'automatic') {
                payload.clientRef = form.clientRef || undefined;
                payload.projectId = form.projectId || undefined;
                payload.deliveryType = form.deliveryType;
                payload.selectedStoreRef = form.deliveryType === 'Store' ? form.selectedStoreRef : '';
                payload.deliveryAddress = form.deliveryAddress;
            } else {
                payload.deliveryType = form.deliveryType;
                payload.selectedStoreRef = form.deliveryType === 'Store' ? form.selectedStoreRef : '';
                payload.deliveryAddress = form.deliveryAddress;
                payload.manualClientDetails = form.manualClientDetails;
                if (form.clientRef) payload.clientRef = form.clientRef;
                if (form.projectId) payload.projectId = form.projectId;
            }

            const res = await api.post('/delivery-notes', payload);
            setDeliveryNotes(prev => [res.data.data, ...prev]);
            setIsCreateModalOpen(false);
            showToast?.('Delivery note created');
        } catch (error) {
            showToast?.(error.response?.data?.message || 'Creation failed', 'error');
        }
    };

    const handleDelete = async () => {
        if (!dnToDelete) return;
        try {
            await api.delete(`/delivery-notes/${dnToDelete._id}`);
            setDeliveryNotes(prev => prev.filter(dn => dn._id !== dnToDelete._id));
            setDeleteModalOpen(false);
            setDnToDelete(null);
            showToast?.('Delivery note deleted');
        } catch (error) {
            showToast?.(error.response?.data?.message || 'Deletion failed', 'error');
        }
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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: '#94a3b8', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>
                <RefreshCw size={20} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />
                Loading delivery notes...
            </div>
        );
    }

    return (
        <div>
            {/* Hidden print template */}
            <div style={{ display: 'none' }}>
                <div ref={printRef}>
                    {viewDeliveryNote && businessData && (
                        <DeliveryNoteTemplate deliveryNote={viewDeliveryNote} business={businessData} />
                    )}
                </div>
            </div>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>Delivery Note Engine</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, fontFamily: "'Outfit', sans-serif", marginTop: 4 }}>
                        {deliveryNotes.length} record{deliveryNotes.length !== 1 ? 's' : ''}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => openCreation('automatic')} style={{
                        padding: '10px 20px', borderRadius: '12px', border: 'none',
                        background: '#8b5cf6', color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                        fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s'
                    }}>
                        <Plus size={18} /> Create (Automatic)
                    </button>
                    <button onClick={() => openCreation('manual')} style={{
                        padding: '10px 20px', borderRadius: '12px', border: '1.5px solid #e2e8f0',
                        background: '#fff', color: '#475569', fontWeight: 700, fontSize: '0.85rem',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                        fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s'
                    }}>
                        <Plus size={18} /> Create (Manual)
                    </button>
                </div>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '20px', position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                    type="text"
                    placeholder="Search by number or client..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%', padding: '12px 14px 12px 44px', borderRadius: '12px',
                        border: '1.5px solid #e2e8f0', fontSize: '0.9rem', fontFamily: "'Outfit', sans-serif",
                        outline: 'none', boxSizing: 'border-box'
                    }}
                />
            </div>

            {/* Table */}
            <div className="modern-table-wrapper">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>Delivery Note #</th>
                            <th>Client</th>
                            <th>Delivery Type</th>
                            <th>Items</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDNs.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
                                    No delivery notes found
                                </td>
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
                                            fontWeight: 700, background: '#f1f5f9', color: '#475569'
                                        }}>
                                            {dn.deliveryType === 'Store' ? <Store size={12} /> : dn.deliveryType === 'Organization' ? <Building2 size={12} /> : <MapPin size={12} />}
                                            {dn.deliveryType}
                                        </span>
                                    </td>
                                    <td>{(dn.items || []).length} item{(dn.items || []).length !== 1 ? 's' : ''}</td>
                                    <td>{new Date(dn.createdAt).toLocaleDateString('en-GB')}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button onClick={() => { setViewDeliveryNote(dn); setTimeout(handlePrint, 100); }} style={{
                                                padding: '6px 10px', borderRadius: '8px', border: 'none',
                                                background: '#f1f5f9', color: '#475569', cursor: 'pointer',
                                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                fontSize: '0.75rem', fontWeight: 600, fontFamily: "'Outfit', sans-serif"
                                            }}>
                                                <Printer size={14} /> Print
                                            </button>
                                            {isAdmin && (
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
                                        {creationMode === 'automatic' ? 'New Delivery Note (Automatic)' : 'New Delivery Note (Manual)'}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>
                                        {creationMode === 'automatic' ? 'Select client and items from catalog' : 'Enter client and item details manually'}
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
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={labelStyle}>Client</label>
                                            {creationMode === 'automatic' ? (
                                                <select value={form.clientRef} onChange={e => handleClientChange(e.target.value)} style={inputStyle}>
                                                    <option value="">Select a client...</option>
                                                    {clients.map(c => (
                                                        <option key={c._id} value={c._id}>
                                                            {c.clientType === 'Organization' ? c.firstName : `${c.firstName || ''} ${c.lastName || ''}`.trim()}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <input placeholder="Organization" value={form.manualClientDetails.organization}
                                                        onChange={e => setForm(prev => ({ ...prev, manualClientDetails: { ...prev.manualClientDetails, organization: e.target.value } }))}
                                                        style={inputStyle} />
                                                    <input placeholder="Contact Name" value={form.manualClientDetails.name}
                                                        onChange={e => setForm(prev => ({ ...prev, manualClientDetails: { ...prev.manualClientDetails, name: e.target.value } }))}
                                                        style={inputStyle} />
                                                    <input placeholder="Address" value={form.manualClientDetails.address}
                                                        onChange={e => setForm(prev => ({ ...prev, manualClientDetails: { ...prev.manualClientDetails, address: e.target.value } }))}
                                                        style={inputStyle} />
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                        <input placeholder="Telephone" value={form.manualClientDetails.telephoneNumber}
                                                            onChange={e => setForm(prev => ({ ...prev, manualClientDetails: { ...prev.manualClientDetails, telephoneNumber: e.target.value } }))}
                                                            style={inputStyle} />
                                                        <input placeholder="Email" value={form.manualClientDetails.emailAddress}
                                                            onChange={e => setForm(prev => ({ ...prev, manualClientDetails: { ...prev.manualClientDetails, emailAddress: e.target.value } }))}
                                                            style={inputStyle} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Project</label>
                                            <select value={form.projectId} onChange={e => setForm(prev => ({ ...prev, projectId: e.target.value }))} style={inputStyle}>
                                                <option value="">No project</option>
                                                {projects.map(p => (
                                                    <option key={p._id} value={p._id}>{p.name || p.projectId}</option>
                                                ))}
                                            </select>
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
                                                        {creationMode === 'automatic' ? (
                                                            <select value={item.productRef} onChange={e => updateItem(i, 'productRef', e.target.value)} style={inputStyle}>
                                                                <option value="">Select product...</option>
                                                                {products.map(p => (
                                                                    <option key={p._id} value={p._id}>{p.name} (Qty: {p.quantity})</option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <input value={item.manualName} onChange={e => updateItem(i, 'manualName', e.target.value)}
                                                                placeholder="Product name" style={inputStyle} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label style={labelStyle}>Qty</label>
                                                        <input type="number" min="1" value={item.quantity}
                                                            onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                                                            style={inputStyle} />
                                                    </div>
                                                    <div>
                                                        <label style={labelStyle}>Serials ({item.serialNumbers?.length || 0})</label>
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
                                <button onClick={handleCreate} style={{
                                    padding: '10px 24px', borderRadius: '10px', border: 'none',
                                    background: '#8b5cf6', color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                                    cursor: 'pointer', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: '6px'
                                }}>
                                    <FileText size={16} /> Create Delivery Note
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
                                        {creationMode === 'automatic' ? 'Choose from available stock' : 'Enter serial numbers manually'}
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
                                {creationMode === 'manual' && (
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
                                )}

                                {creationMode === 'automatic' && availableSerials.length > 0 ? (
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
                                ) : creationMode === 'automatic' ? (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>
                                        No serials available for this product in stock.
                                    </div>
                                ) : null}

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
                                <button onClick={handleDelete} style={{
                                    padding: '10px 20px', borderRadius: '10px', border: 'none',
                                    background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                                    cursor: 'pointer', fontFamily: "'Outfit', sans-serif"
                                }}>
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DeliveryNoteManagement;
