import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, X, Search, RefreshCw, Printer, AlertTriangle, ShieldAlert, CheckCircle, Briefcase, Trash2, Users, Building, MapPin, Edit3, Clock, AlertCircle } from 'lucide-react';
import api from '../../api';
import useSubmitGuard from '../../utils/useSubmitGuard';
import PriceInput from '../../utils/PriceInput';
import { calculateDocumentTotals } from '../../utils/calculateDocumentTotals';
import { openA4PrintWindow, buildPrintFileName } from '../../utils/printDocument';
import PurchaseOrderTemplate from './PurchaseOrderTemplate';
import './PurchaseOrderManagement.css';
import '../../styles/modern-table.css';

const PurchaseOrderManagement = ({ currentUser, showToast }) => {
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [businessData, setBusinessData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Active');
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'root';
    const isRoot = currentUser?.role === 'root';

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [creationMode, setCreationMode] = useState('automatic'); // 'automatic' or 'manual'
    const [editingPO, setEditingPO] = useState(null);
    const [editNote, setEditNote] = useState('');
    const [historyPO, setHistoryPO] = useState(null);

    // Add Supplier Modal
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [newSupplier, setNewSupplier] = useState({
        name: '', telephoneNumber: '', emailAddress: '', address: '',
        bankDetails: { accountNumber: '', accountName: '', bankName: '', branch: '' }
    });

    // View/Print
    const [viewPO, setViewPO] = useState(null);
    const printRef = useRef();

    // Deletion Modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [poToDelete, setPoToDelete] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');

    const initialForm = {
        supplierRef: '',
        supplierQuotationNumber: '',
        deliveryType: 'Organization',
        selectedStoreRef: '',
        deliveryAddress: '',
        items: [],
        subTotal: 0,
        appliedDiscounts: [],
        discountTotal: 0,
        hasTax: false,
        appliedTaxes: [],
        taxTotal: 0,
        finalTotal: 0,
        currency: 'primary',
        terms: '',
        notes: ''
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
            const [poRes, sRes, pRes, bRes] = await Promise.all([
                api.get('/purchase-orders'),
                api.get('/suppliers'),
                api.get('/products'),
                api.get('/business')
            ]);
            setPurchaseOrders(poRes.data.data);
            setSuppliers(sRes.data.data);
            setProducts(pRes.data.data);
            if (bRes.data.data.details) setBusinessData(bRes.data.data.details);
        } catch (error) {
            showToast?.('Error fetching PO metrics', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handlePrint = () => {
        if (!viewPO) return;
        const poId = viewPO.poNumber || 'PO';
        const supplierName = viewPO.supplierRef?.name || 'Supplier';
        openA4PrintWindow(
            printRef.current,
            buildPrintFileName(poId, supplierName, viewPO.poDate || viewPO.createdAt),
        );
    };

    const calculateTotals = calculateDocumentTotals;

    const openCreation = (mode) => {
        setCreationMode(mode);
        setEditingPO(null);
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
            terms: businessData?.purchaseOrderTerms || 'Standard purchase order terms and conditions apply.',
            notes: businessData?.purchaseOrderNotes || '',
            deliveryAddress: businessData?.address || '',
            items: []
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

    const handleToggleTax = (e) => {
        const checked = e.target.checked;
        setForm(prev => calculateTotals({ ...prev, hasTax: checked }));
    };

    const handleDeliveryChange = (type, storeId = '') => {
        let address = '';
        let selectedStore = '';
        if (type === 'Organization') {
            address = businessData?.address || '';
        } else if (type === 'Store') {
            const store = businessData?.stores?.find(s => s._id === storeId || s.name === storeId);
            if (store) {
                address = `${store.name}\n${store.address}\nTel: ${store.phoneNumber}`;
                selectedStore = store.name;
            }
        }
        setForm(prev => ({ ...prev, deliveryType: type, selectedStoreRef: selectedStore, deliveryAddress: address }));
    };

    const handleCreateSupplier = async (e) => {
        e.preventDefault();
        if (!newSupplier.name.trim()) return showToast?.('Supplier name is required', 'error');
        await runGuarded(async () => {
            try {
                const res = await api.post('/suppliers', newSupplier);
                const created = res.data.data;
                setSuppliers(prev => [created, ...prev]);
                setForm(prev => ({ ...prev, supplierRef: created._id }));
                setIsSupplierModalOpen(false);
                setNewSupplier({
                    name: '', telephoneNumber: '', emailAddress: '', address: '',
                    bankDetails: { accountNumber: '', accountName: '', bankName: '', branch: '' }
                });
                showToast?.('Supplier added successfully', 'success');
            } catch (err) {
                showToast?.('Failed to create supplier', 'error');
            }
        });
    };

    const submitPO = async (e) => {
        e.preventDefault();
        if (!form.supplierRef) return showToast?.('Please select a Supplier', 'error');
        if (!form.supplierQuotationNumber.trim()) return showToast?.('Supplier Quotation Number is required', 'error');
        if (form.items.length === 0) return showToast?.('Insert at least 1 item', 'error');
        if (editingPO && !editNote.trim()) return showToast?.('Edit reason is required', 'error');

        await runGuarded(async () => {
            try {
                const payload = { ...form, creationMethod: creationMode };
                if (editingPO) {
                    await api.put(`/purchase-orders/${editingPO._id}/edit`, { ...payload, editNote });
                    showToast?.(`Purchase Order edited. Original ${editingPO.poNumber} cancelled.`, 'success');
                } else {
                    await api.post('/purchase-orders', payload);
                    showToast?.('Purchase Order created successfully', 'success');
                }
                setIsCreateModalOpen(false);
                setEditingPO(null);
                setEditNote('');
                fetchData();
            } catch (err) {
                showToast?.(err.response?.data?.message || 'Failed to save PO', 'error');
            }
        });
    };

    const openEditModal = (po) => {
        if (!isWithin30Days(po.createdAt || po.poDate)) {
            return showToast?.('This purchase order is older than 30 days and cannot be edited.', 'error');
        }
        setEditingPO(po);
        setEditNote('');
        setCreationMode(po.creationMethod || 'automatic');
        setForm({
            supplierRef: po.supplierRef?._id || '',
            supplierQuotationNumber: po.supplierQuotationNumber || '',
            deliveryType: po.deliveryType || 'Organization',
            selectedStoreRef: po.selectedStoreRef || '',
            deliveryAddress: po.deliveryAddress || '',
            items: (po.items || []).map(it => ({
                productRef: it.productRef?._id || it.productRef || '',
                manualName: it.manualName || '',
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                lineTotal: it.lineTotal
            })),
            subTotal: po.subTotal || 0,
            appliedDiscounts: po.appliedDiscounts || [],
            discountTotal: po.discountTotal || 0,
            hasTax: po.hasTax || false,
            appliedTaxes: po.appliedTaxes || [],
            taxTotal: po.taxTotal || 0,
            finalTotal: po.finalTotal || 0,
            currency: po.currency || 'primary',
            terms: po.terms || '',
            notes: po.notes || ''
        });
        setIsCreateModalOpen(true);
    };

    const openDeleteModal = (po) => {
        setPoToDelete(po);
        setDeleteReason('');
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteReason.trim()) return showToast?.('Deletion reason is required', 'error');

        await runGuarded(async () => {
            try {
                await api.delete(`/purchase-orders/${poToDelete._id}`, { data: { reason: deleteReason.trim() } });
                showToast?.('Purchase Order cancelled', 'success');
                setDeleteModalOpen(false);
                setPoToDelete(null);
                setDeleteReason('');
                fetchData();
            } catch (err) {
                showToast?.(err.response?.data?.message || 'Failed to cancel PO', 'error');
            }
        });
    };

    const filtered = purchaseOrders.filter(po => {
        const matchesSearch =
            po.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (po.supplierRef?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (po.supplierQuotationNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
        const isCancelled = po.status === 'Cancelled';
        const matchesTab = activeTab === 'Active' ? !isCancelled : isCancelled;
        return matchesSearch && matchesTab;
    });

    const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#64748b', marginBottom: '0.6rem', textTransform: 'uppercase' };
    const inputStyle = { width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '0.8rem 1.25rem', color: '#0f172a', outline: 'none', fontWeight: 600, boxSizing: 'border-box' };

    return (
        <div className="po-root">
            {loading ? (
                <div className="po-loading"><RefreshCw className="animate-spin" color="var(--po-t3)" /> Loading purchase orders...</div>
            ) : (
                <div className="po-card">
                    <div className="po-card-header">
                        <div className="po-card-title">
                            <div className="po-card-icon sky"><FileText size={20} /></div>
                            <div>
                                <h3>Purchase Order Engine</h3>
                                <div className="po-card-subtitle">Manage, create, and format purchase orders cleanly.</div>
                            </div>
                        </div>
                        <div className="po-card-actions">
                            <div className="po-search-wrap">
                                <Search size={16} className="po-search-icon" />
                                <input type="text" placeholder="Search PO00001 or Supplier..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="po-search-input" />
                            </div>
                            <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '12px', alignItems: 'center' }}>
                                <button onClick={() => setActiveTab('Active')} style={{ padding: '6px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', background: activeTab === 'Active' ? '#fff' : 'transparent', color: activeTab === 'Active' ? '#0f172a' : '#64748b', boxShadow: activeTab === 'Active' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>Active</button>
                                <button onClick={() => setActiveTab('Cancelled')} style={{ padding: '6px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', background: activeTab === 'Cancelled' ? '#fff' : 'transparent', color: activeTab === 'Cancelled' ? '#ef4444' : '#64748b', boxShadow: activeTab === 'Cancelled' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>Deleted / Cancelled</button>
                            </div>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => openCreation('automatic')} className="po-btn po-btn-primary"><Plus size={16} /> Automatic Items</motion.button>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => openCreation('manual')} className="po-btn po-btn-outline" style={{ border: '2px dashed #cbd5e1' }}><Plus size={16} /> Manual Items</motion.button>
                        </div>
                    </div>

                    <div className="modern-table-card">
                        <div className="modern-table-scroll">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>PO Number</th>
                                    <th>Supplier</th>
                                    <th>Supplier Quotation #</th>
                                    <th>Delivery Type</th>
                                    <th className="text-right">Total sum</th>
                                    <th>Created By</th>
                                    <th className="text-center" style={{ width: '180px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(po => (
                                    <tr key={po._id}>
                                        <td>
                                            <div className="modern-table-cell-primary">
                                                <div style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{po.poNumber}</div>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>{new Date(po.poDate || po.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700 }}>{po.supplierRef?.name || 'N/A'}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{po.supplierRef?.supplierId}</div>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 600, color: '#475569' }}>{po.supplierQuotationNumber}</span>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '0.8rem', background: po.deliveryType === 'Store' ? '#dbeafe' : '#f1f5f9', color: po.deliveryType === 'Store' ? '#1e40af' : '#475569', padding: '4px 8px', borderRadius: '6px', fontWeight: 700 }}>
                                                {po.deliveryType === 'Store' ? `Store: ${po.selectedStoreRef}` : 'Main HQ'}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <span style={{ fontWeight: 800, color: '#059669', fontSize: '0.95rem' }}>
                                                {po.currency === 'primary' ? businessData?.primaryCurrency?.symbol || 'Rs.' : businessData?.secondaryCurrency?.symbol || '$'} {parseFloat(po.finalTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                                                {po.createdBy?.firstName} {po.createdBy?.lastName}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="modern-table-actions">
                                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setViewPO(po)} className="modern-table-action view"><Printer size={14} /></motion.button>
                                                {isAdmin && (
                                                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setHistoryPO(po)} className="modern-table-action history" title="View Status History"><Clock size={14} /></motion.button>
                                                )}
                                                {isRoot && po.status !== 'Cancelled' && isWithin30Days(po.createdAt || po.poDate) && (
                                                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => openEditModal(po)} className="modern-table-action edit"><Edit3 size={14} /></motion.button>
                                                )}
                                                {isAdmin && po.status !== 'Cancelled' && isWithin30Days(po.createdAt || po.poDate) && (
                                                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => openDeleteModal(po)} className="modern-table-action delete"><Trash2 size={14} /></motion.button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && <tr><td colSpan="7"><div className="po-empty">No purchase orders found.</div></td></tr>}
                            </tbody>
                        </table>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE MODAL */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="po-overlay">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="po-modal po-modal-lg">
                            <div className="po-modal-header">
                                <div>
                                    <h2>{editingPO ? `Edit Purchase Order (${editingPO.poNumber})` : `Create Purchase Order [${creationMode.toUpperCase()}]`}</h2>
                                    <div className="po-modal-subtitle">{editingPO ? 'Root-level edit — original will be cancelled' : 'Generate a formal PO to send to your supplier.'}</div>
                                </div>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setIsCreateModalOpen(false); setEditingPO(null); setEditNote(''); }} className="po-modal-close"><X size={18} /></motion.button>
                            </div>

                            {editingPO && (
                                <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                    <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <div>
                                        <div style={{ fontWeight: 800, color: '#92400e', fontSize: '0.9rem' }}>Editing Purchase Order {editingPO.poNumber}</div>
                                        <div style={{ color: '#b45309', fontSize: '0.8rem', marginTop: '0.2rem' }}>Saving will cancel the original PO and create a new PO number. This action is irreversible.</div>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={submitPO}>
                                {editingPO && (
                                    <div style={{ marginBottom: '1.5rem', padding: '1.5rem', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                        <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Reason for Edit</h4>
                                        <input
                                            type="text"
                                            value={editNote}
                                            onChange={e => setEditNote(e.target.value)}
                                            placeholder="Why are you editing this purchase order?"
                                            style={{ ...inputStyle, background: '#fff', borderColor: !editNote ? '#fca5a5' : '#e2e8f0' }}
                                            required
                                        />
                                    </div>
                                )}
                                {/* SUPPLIER DETAILS */}
                                <div className="po-section" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ margin: 0, color: '#0f172a' }}>1. Supplier Reference</h4>
                                        <button type="button" onClick={() => setIsSupplierModalOpen(true)} className="po-btn po-btn-outline" style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={14} /> Add Supplier</button>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={labelStyle}>Select Supplier *</label>
                                            <select required value={form.supplierRef} onChange={e => setForm({ ...form, supplierRef: e.target.value })} style={{ ...inputStyle, background: '#fff' }}>
                                                <option value="" disabled>Choose Supplier...</option>
                                                {suppliers.map(s => <option key={s._id} value={s._id}>{s.name} ({s.supplierId})</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Supplier Quotation Number *</label>
                                            <input required placeholder="Enter supplier's proposal #" value={form.supplierQuotationNumber} onChange={e => setForm({ ...form, supplierQuotationNumber: e.target.value })} style={{ ...inputStyle, background: '#fff' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* DELIVERY & ADDRESS */}
                                <div className="po-section" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                                    <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>2. Delivery Address</h4>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                                        <div>
                                            <label style={labelStyle}>Deliver To</label>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button type="button" onClick={() => handleDeliveryChange('Organization')} className={`po-btn ${form.deliveryType === 'Organization' ? 'po-btn-primary' : 'po-btn-outline'}`} style={{ flex: 1, padding: '10px', fontSize: '0.8rem' }}>Organization HQ</button>
                                                <button type="button" onClick={() => handleDeliveryChange('Store', businessData?.stores?.[0]?.name || '')} className={`po-btn ${form.deliveryType === 'Store' ? 'po-btn-primary' : 'po-btn-outline'}`} style={{ flex: 1, padding: '10px', fontSize: '0.8rem' }}>Store / Warehouse</button>
                                            </div>
                                        </div>

                                        {form.deliveryType === 'Store' && (
                                            <div>
                                                <label style={labelStyle}>Select Store Location</label>
                                                <select value={form.selectedStoreRef} onChange={e => handleDeliveryChange('Store', e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
                                                    <option value="" disabled>Choose Store Location...</option>
                                                    {businessData?.stores?.map(store => (
                                                        <option key={store._id || store.name} value={store.name}>{store.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label style={labelStyle}>Resolved Delivery Address</label>
                                        <textarea required value={form.deliveryAddress} onChange={e => setForm({ ...form, deliveryAddress: e.target.value })} style={{ ...inputStyle, background: '#fff', height: '80px', resize: 'none' }} placeholder="Resolve delivery coordinates..." />
                                    </div>
                                </div>

                                {/* ITEMS */}
                                <div style={{ marginBottom: '1.5rem', padding: '1.5rem', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ margin: 0, color: '#0f172a' }}>3. Purchase Items</h4>
                                        <button type="button" onClick={handleAddItem} className="po-btn po-btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Plus size={14} /> Add Item</button>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ padding: '0.5rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748b' }}>Item Description</th>
                                                <th style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748b', width: '12%' }}>QTY</th>
                                                <th style={{ padding: '0.5rem', textAlign: 'right', fontSize: '0.75rem', color: '#64748b', width: '22%' }}>Unit Price</th>
                                                <th style={{ padding: '0.5rem', textAlign: 'right', fontSize: '0.75rem', color: '#64748b', width: '18%' }}>Line Total</th>
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
                                                                {products.map(p => <option key={p._id} value={p._id}>{p.name} [{p.productId}]</option>)}
                                                            </select>
                                                        ) : (
                                                            <input required placeholder="Enter manual description..." value={it.manualName} onChange={e => updateItem(idx, 'manualName', e.target.value)} style={{ ...inputStyle, background: '#fff', padding: '0.5rem' }} />
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '0.5rem' }}>
                                                        <input required type="number" min="1" value={it.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)} style={{ ...inputStyle, background: '#fff', padding: '0.5rem', textAlign: 'center' }} />
                                                    </td>
                                                    <td style={{ padding: '0.5rem' }}>
                                                        <PriceInput value={it.unitPrice} onChange={v => updateItem(idx, 'unitPrice', v)} style={{ ...inputStyle, background: '#fff', padding: '0.5rem 0.75rem', textAlign: 'right', minWidth: '140px' }} required />
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
                                            {form.items.length === 0 && <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>No purchase items added.</td></tr>}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td colSpan="3" style={{ padding: '1.5rem 1rem 1rem', textAlign: 'right', fontWeight: 800 }}>Subtotal:</td>
                                                <td style={{ padding: '1.5rem 1rem 1rem', textAlign: 'right', fontWeight: 950, fontSize: '1.1rem', color: '#0f172a', borderTop: '2px solid #e2e8f0' }}>{form.subTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* DISCOUNTS & TAXES */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                    {/* Discount Block */}
                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>Purchase Discounts</div>
                                            <input type="checkbox" checked={form.appliedDiscounts?.length > 0 || form.discountTotal > 0} onChange={(e) => {
                                                if (e.target.checked && businessData?.discountProfiles?.length > 0) {
                                                    setApplyDiscountMode(true);
                                                } else {
                                                    setForm({ ...form, appliedDiscounts: [], discountTotal: 0 });
                                                    setForm(prev => calculateTotals(prev));
                                                }
                                            }} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                                        </div>
                                        {(form.appliedDiscounts?.length > 0 || form.discountTotal > 0 || applyDiscountMode) && (
                                            <div style={{ marginTop: '1rem' }}>
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
                                                
                                                <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '1rem' }}>
                                                    <label style={{ ...labelStyle, color: '#0f172a' }}>Custom PO Discount</label>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <select value={customDiscount.type} onChange={e => setCustomDiscount({ ...customDiscount, type: e.target.value })} style={{ ...inputStyle, background: '#f8fafc', padding: '0.5rem', flex: 1 }}>
                                                            <option value="percentage">% Percentage</option>
                                                            <option value="fixed">Fixed Amount</option>
                                                        </select>
                                                        <input type="number" placeholder="Value" value={customDiscount.value || ''} onChange={e => setCustomDiscount({ ...customDiscount, value: parseFloat(e.target.value) || 0 })} style={{ ...inputStyle, background: '#f8fafc', padding: '0.5rem', flex: 1 }} />
                                                        <button type="button" onClick={() => {
                                                            if (customDiscount.value > 0) {
                                                                setForm(prev => {
                                                                    const amount = customDiscount.type === 'percentage' ? (prev.subTotal * customDiscount.value) / 100 : customDiscount.value;
                                                                    const newDiscount = { name: 'Manual Custom', type: customDiscount.type, value: customDiscount.value, amount };
                                                                    return calculateTotals({ ...prev, appliedDiscounts: [...(prev.appliedDiscounts || []), newDiscount] });
                                                                });
                                                                setCustomDiscount({ type: 'percentage', value: 0 });
                                                            }
                                                        }} className="po-btn po-btn-primary" style={{ padding: '0.5rem 1rem' }}>Add</button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Tax Block */}
                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>Govt / Purchasing Taxes</div>
                                            <input type="checkbox" checked={form.hasTax} onChange={handleToggleTax} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                                        </div>
                                        {form.hasTax && (
                                            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {businessData?.isVatRegistered && (() => {
                                                    const isApplied = form.appliedTaxes?.some(t => t.name === 'VAT');
                                                    return (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: isApplied ? '#d1fae5' : '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                            <input type="checkbox" checked={isApplied} onChange={e => {
                                                                const checked = e.target.checked;
                                                                setForm(prev => {
                                                                    let taxes = [...(prev.appliedTaxes || [])];
                                                                    if (checked) taxes.push({ name: 'VAT', type: 'percentage', value: businessData.vatPercentage, amount: 0 });
                                                                    else taxes = taxes.filter(t => t.name !== 'VAT');
                                                                    return calculateTotals({ ...prev, appliedTaxes: taxes });
                                                                });
                                                            }} style={{ cursor: 'pointer' }} />
                                                            <div style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 600 }}>VAT ({businessData.vatPercentage}%)</div>
                                                        </div>
                                                    )
                                                })()}
                                                {businessData?.otherTaxes?.map((tax, i) => {
                                                    const isApplied = form.appliedTaxes?.some(t => t.name === tax.name);
                                                    return (
                                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: isApplied ? '#d1fae5' : '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                            <input type="checkbox" checked={isApplied} onChange={e => {
                                                                const checked = e.target.checked;
                                                                setForm(prev => {
                                                                    let taxes = [...(prev.appliedTaxes || [])];
                                                                    if (checked) taxes.push({ name: tax.name, type: tax.type, value: tax.value, amount: 0 });
                                                                    else taxes = taxes.filter(t => t.name !== tax.name);
                                                                    return calculateTotals({ ...prev, appliedTaxes: taxes });
                                                                });
                                                            }} style={{ cursor: 'pointer' }} />
                                                            <div style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 600 }}>{tax.name} ({tax.type === 'percentage' ? tax.value + '%' : 'Rs. ' + tax.value})</div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* TERMS & NOTES */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                    <div>
                                        <label style={labelStyle}>Terms & Conditions</label>
                                        <textarea value={form.terms} onChange={e => setForm({ ...form, terms: e.target.value })} style={{ ...inputStyle, background: '#fff', height: '100px', resize: 'none' }} placeholder="Standard T&C apply..." />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Default PO Notes</label>
                                        <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, background: '#fff', height: '100px', resize: 'none' }} placeholder="Default notes..." />
                                    </div>
                                </div>

                                <div className="po-total-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', color: '#fff', padding: '1.5rem 2rem', borderRadius: '16px', marginBottom: '2rem' }}>
                                    <div style={{ fontSize: '1rem', fontWeight: 800 }}>Purchase Order Final Sum</div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 950, color: '#38bdf8' }}>
                                        {form.currency === 'primary' ? businessData?.primaryCurrency?.symbol || 'Rs.' : businessData?.secondaryCurrency?.symbol || '$'} {form.finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>

                                <motion.button whileTap={{ scale: isSubmitting ? 1 : 0.98 }} type="submit" disabled={isSubmitting} className="po-btn po-btn-success po-btn-full" style={{ padding: '1rem', fontWeight: 800, opacity: isSubmitting ? 0.85 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}><CheckCircle size={20} /> {isSubmitting ? 'Processing...' : (editingPO ? 'Save Edited Purchase Order' : 'Create Purchase Order')}</motion.button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ADD SUPPLIER SUB-MODAL */}
            <AnimatePresence>
                {isSupplierModalOpen && (
                    <div className="po-overlay" style={{ zIndex: 1100 }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="po-modal" style={{ maxWidth: '500px', background: '#fff', padding: '2rem', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>Add New Supplier</h3>
                                <button type="button" onClick={() => setIsSupplierModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={18} /></button>
                            </div>

                            <form onSubmit={handleCreateSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Supplier Name *</label>
                                    <input required value={newSupplier.name} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} style={inputStyle} placeholder="e.g. Acme Corp" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={labelStyle}>Telephone</label>
                                        <input value={newSupplier.telephoneNumber} onChange={e => setNewSupplier({ ...newSupplier, telephoneNumber: e.target.value })} style={inputStyle} placeholder="+94..." />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Email Address</label>
                                        <input type="email" value={newSupplier.emailAddress} onChange={e => setNewSupplier({ ...newSupplier, emailAddress: e.target.value })} style={inputStyle} placeholder="supplier@acme.com" />
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Supplier Address</label>
                                    <input value={newSupplier.address} onChange={e => setNewSupplier({ ...newSupplier, address: e.target.value })} style={inputStyle} placeholder="123 Industrial Zone, Colombo" />
                                </div>

                                <div style={{ borderTop: '1px solid #e2e8f0', pt: '1rem', mt: '0.5rem' }}>
                                    <h5 style={{ margin: '0 0 0.8rem 0', fontWeight: 800, color: '#475569' }}>Bank Remittance Details (Optional)</h5>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.8rem' }}>
                                        <div>
                                            <label style={labelStyle}>Account Number</label>
                                            <input value={newSupplier.bankDetails.accountNumber} onChange={e => setNewSupplier({ ...newSupplier, bankDetails: { ...newSupplier.bankDetails, accountNumber: e.target.value } })} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Account Name</label>
                                            <input value={newSupplier.bankDetails.accountName} onChange={e => setNewSupplier({ ...newSupplier, bankDetails: { ...newSupplier.bankDetails, accountName: e.target.value } })} style={inputStyle} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={labelStyle}>Bank Name</label>
                                            <input value={newSupplier.bankDetails.bankName} onChange={e => setNewSupplier({ ...newSupplier, bankDetails: { ...newSupplier.bankDetails, bankName: e.target.value } })} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Branch</label>
                                            <input value={newSupplier.bankDetails.branch} onChange={e => setNewSupplier({ ...newSupplier, bankDetails: { ...newSupplier.bankDetails, branch: e.target.value } })} style={inputStyle} />
                                        </div>
                                    </div>
                                </div>

                                <motion.button whileTap={{ scale: isSubmitting ? 1 : 0.98 }} type="submit" disabled={isSubmitting} className="po-btn po-btn-success" style={{ width: '100%', padding: '10px', marginTop: '1rem', fontWeight: 800, opacity: isSubmitting ? 0.85 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>{isSubmitting ? 'Processing...' : 'Save Supplier to Database'}</motion.button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* DELETE PO CONFIRMATION */}
            <AnimatePresence>
                {deleteModalOpen && (
                    <div className="po-overlay" style={{ zIndex: 1100 }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: 420, textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                            <ShieldAlert size={48} color="#ef4444" style={{ marginBottom: '1rem', margin: '0 auto' }} />
                            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}>Cancel Purchase Order?</h3>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                                This will soft-cancel purchase order <strong>{poToDelete?.poNumber}</strong>. The reason will be saved in status history.
                            </p>
                            <label style={{ ...labelStyle, textAlign: 'left' }}>Cancellation Reason *</label>
                            <textarea
                                placeholder="e.g. Wrong supplier, duplicate PO, order cancelled..."
                                value={deleteReason}
                                onChange={e => setDeleteReason(e.target.value)}
                                required
                                style={{ ...inputStyle, height: 100, resize: 'none', marginBottom: '1.5rem', textAlign: 'left' }}
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setDeleteModalOpen(false); setDeleteReason(''); }} style={{ background: '#f8fafc', color: '#64748b', border: 'none', borderRadius: '12px', padding: '0.8rem', fontWeight: 800, cursor: 'pointer' }}>Cancel</motion.button>
                                <motion.button whileTap={{ scale: isSubmitting ? 1 : 0.95 }} onClick={confirmDelete} disabled={isSubmitting || !deleteReason.trim()} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.8rem', fontWeight: 800, cursor: (isSubmitting || !deleteReason.trim()) ? 'not-allowed' : 'pointer', opacity: (isSubmitting || !deleteReason.trim()) ? 0.6 : 1 }}>{isSubmitting ? 'Processing...' : 'Cancel Purchase Order'}</motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* STATUS HISTORY MODAL */}
            <AnimatePresence>
                {historyPO && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ background: '#fff', borderRadius: '24px', padding: '2rem', width: '100%', maxWidth: 600, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '85vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h3 style={{ margin: 0, fontWeight: 900, color: '#0f172a', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Clock size={22} color="#3b82f6" /> Status History: {historyPO.poNumber}
                                </h3>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setHistoryPO(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></motion.button>
                            </div>

                            {historyPO.statusHistory && historyPO.statusHistory.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {historyPO.statusHistory.map((hist, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '40px' }}>
                                                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#3b82f6', margin: '4px 0', border: '3px solid #eff6ff' }} />
                                                {idx < historyPO.statusHistory.length - 1 && <div style={{ width: 2, height: '100%', background: '#e2e8f0', minHeight: '40px' }} />}
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

            {/* PRINT PREVIEW PRESET */}
            <AnimatePresence>
                {viewPO && (
                    <div className="app-print-overlay">
                        <div className="app-print-shell">
                            <div className="app-print-toolbar">
                                <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={handlePrint} className="app-print-btn">
                                    <Printer size={18} /> A4 Print / PDF
                                </motion.button>
                                <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={() => setViewPO(null)} className="app-print-close">
                                    <X size={20} />
                                </motion.button>
                            </div>
                            <div className="app-print-doc">
                                <PurchaseOrderTemplate ref={printRef} po={viewPO} business={businessData} />
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PurchaseOrderManagement;
