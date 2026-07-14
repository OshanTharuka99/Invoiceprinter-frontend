import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Search, Package, Plus, FileSearch, Printer, X, Edit3, Trash2, Clock, ShieldAlert } from 'lucide-react';
import api from '../../api';
import useSubmitGuard from '../../utils/useSubmitGuard';
import { openA4PrintWindow, buildPrintFileName } from '../../utils/printDocument';
import '../../styles/modern-table.css';
import GoodsReturnTemplate from './GoodsReturnTemplate';

const GoodsReturnManagement = ({ currentUser, showToast }) => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sourceType, setSourceType] = useState('supplier_invoice');
    const [sourceNumber, setSourceNumber] = useState('');
    const [sourceData, setSourceData] = useState(null);
    const [reason, setReason] = useState('');
    const [terms, setTerms] = useState('');
    const [notes, setNotes] = useState('');
    const [selected, setSelected] = useState({});
    const { isSubmitting, runGuarded } = useSubmitGuard();
    const [searchTerm, setSearchTerm] = useState('');
    const [createMode, setCreateMode] = useState(false);
    const [businessData, setBusinessData] = useState(null);
    const [previewReturn, setPreviewReturn] = useState(null);
    const [activeTab, setActiveTab] = useState('Active');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [noteToEdit, setNoteToEdit] = useState(null);
    const [editForm, setEditForm] = useState({ reason: '', terms: '', notes: '' });
    const [editNote, setEditNote] = useState('');
    const [historyNote, setHistoryNote] = useState(null);
    const printRef = useRef();

    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'root';
    const isRoot = currentUser?.role === 'root';

    const isWithin30Days = (createdAt) => {
        const diffMs = Date.now() - new Date(createdAt);
        return diffMs / (1000 * 60 * 60 * 24) <= 30;
    };

    const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#64748b', marginBottom: '0.6rem', textTransform: 'uppercase', textAlign: 'left' };
    const inputStyle = { width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '0.8rem 1.25rem', color: '#0f172a', outline: 'none', fontWeight: 600, boxSizing: 'border-box' };

    const fetchReturns = async () => {
        setLoading(true);
        try {
            const [returnsRes, businessRes] = await Promise.all([
                api.get('/goods-returns'),
                api.get('/business'),
            ]);
            setReturns(returnsRes.data.data || []);
            setBusinessData(businessRes.data?.data?.details || null);
        } catch (error) {
            showToast?.(error.response?.data?.message || 'Failed to load goods returns', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReturns(); }, []);

    const lookupSource = async () => {
        if (!sourceNumber.trim()) return showToast?.('Enter supplier document number', 'error');
        try {
            const query = sourceType === 'supplier_invoice'
                ? `supplierInvoiceNumber=${encodeURIComponent(sourceNumber.trim())}`
                : `supplierDeliveryNumber=${encodeURIComponent(sourceNumber.trim())}`;
            const res = await api.get(`/goods-returns/source?${query}`);
            setSourceData(res.data.data);
            const defaults = {};
            (res.data.data.items || []).forEach((item) => {
                defaults[item.sourceItemKey] = {
                    enabled: item.maxReturnableQty > 0,
                    quantity: item.maxReturnableQty > 0 ? item.maxReturnableQty : 0,
                    serialNumbers: item.hasSerialNumbers
                        ? (item.serialNumbers || []).slice(0, item.maxReturnableQty)
                        : [],
                };
            });
            setSelected(defaults);
            setTerms(businessData?.goodsReturnTerms || '');
            setNotes(businessData?.goodsReturnNotes || '');
            showToast?.('Supplier stock loaded', 'success');
        } catch (error) {
            setSourceData(null);
            setSelected({});
            showToast?.(error.response?.data?.message || 'Source lookup failed', 'error');
        }
    };

    const submitReturn = async () => {
        if (!sourceData?.sourceNumber) return showToast?.('Load supplier document first', 'error');

        const payloadItems = (sourceData.items || [])
            .filter((item) => selected[item.sourceItemKey]?.enabled)
            .map((item) => {
                const selectedItem = selected[item.sourceItemKey];
                const quantity = Number(selectedItem.quantity || 0);
                const serialNumbers = (selectedItem.serialNumbers || []).slice(0, quantity);
                return { sourceItemKey: item.sourceItemKey, quantity, serialNumbers };
            })
            .filter((item) => item.quantity > 0);

        if (payloadItems.length === 0) {
            return showToast?.('Select at least one item to return', 'error');
        }

        await runGuarded(async () => {
            try {
                await api.post('/goods-returns', {
                    sourceType: sourceData.sourceType,
                    sourceNumber: sourceData.sourceNumber,
                    items: payloadItems,
                    reason,
                    terms,
                    notes,
                    supplierRef: sourceData.supplierRef?._id || sourceData.supplierRef || null,
                });
                showToast?.('Goods return note processed successfully', 'success');
                setSourceData(null);
                setSelected({});
                setSourceNumber('');
                setReason('');
                setTerms('');
                setNotes('');
                setCreateMode(false);
                fetchReturns();
            } catch (error) {
                showToast?.(error.response?.data?.message || 'Failed to create goods return note', 'error');
            }
        });
    };

    const filteredReturns = useMemo(() => returns.filter((note) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = (note.returnNumber || '').toLowerCase().includes(term)
            || (note.sourceNumber || '').toLowerCase().includes(term)
            || (note.supplierRef?.name || '').toLowerCase().includes(term)
            || (note.supplierName || '').toLowerCase().includes(term);
        const isCancelled = note.status === 'Cancelled';
        const matchesTab = activeTab === 'Active' ? !isCancelled : isCancelled;
        return matchesSearch && matchesTab;
    }), [returns, searchTerm, activeTab]);

    const openDeleteModal = (note) => {
        setNoteToDelete(note);
        setDeleteReason('');
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteReason.trim()) return showToast?.('Cancellation reason is required', 'error');
        await runGuarded(async () => {
            try {
                await api.delete(`/goods-returns/${noteToDelete._id}`, { data: { reason: deleteReason.trim() } });
                showToast?.('Goods return cancelled', 'success');
                setDeleteModalOpen(false);
                setNoteToDelete(null);
                setDeleteReason('');
                fetchReturns();
            } catch (error) {
                showToast?.(error.response?.data?.message || 'Failed to cancel goods return', 'error');
            }
        });
    };

    const openEditModal = (note) => {
        if (!isWithin30Days(note.createdAt)) {
            return showToast?.('This return is older than 30 days and cannot be edited.', 'error');
        }
        setNoteToEdit(note);
        setEditForm({
            reason: note.reason || '',
            terms: note.terms || '',
            notes: note.notes || '',
        });
        setEditNote('');
        setEditModalOpen(true);
    };

    const confirmEdit = async () => {
        if (!editNote.trim()) return showToast?.('Edit note is required', 'error');
        await runGuarded(async () => {
            try {
                await api.put(`/goods-returns/${noteToEdit._id}/edit`, { ...editForm, editNote: editNote.trim() });
                showToast?.('Goods return updated', 'success');
                setEditModalOpen(false);
                setNoteToEdit(null);
                setEditNote('');
                fetchReturns();
            } catch (error) {
                showToast?.(error.response?.data?.message || 'Failed to edit goods return', 'error');
            }
        });
    };

    const handlePrint = () => {
        if (!previewReturn) return;
        const returnId = previewReturn.returnNumber || 'GRN';
        const supplierName = previewReturn.supplierRef?.name || previewReturn.supplierName || 'Supplier';
        openA4PrintWindow(
            printRef.current,
            buildPrintFileName(returnId, supplierName, previewReturn.returnDate || previewReturn.createdAt),
        );
    };

    const openPreview = (note) => setPreviewReturn(note);
    const closePreview = () => setPreviewReturn(null);

    return (
        <div className="pm-root">
            <div className="pm-card">
                <div className="pm-card-header">
                    <div className="pm-card-title">
                        <div className="pm-card-icon green"><Package size={22} /></div>
                        <div>
                            <h3>Goods Return Note Engine</h3>
                            <div className="pm-card-subtitle">
                                Admin/Root only — return purchased stock to supplier using their invoice or delivery note number.
                            </div>
                        </div>
                    </div>
                    <div className="pm-card-actions">
                        {!createMode && (
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setCreateMode(true)}
                                className="pm-btn pm-btn-primary"
                            >
                                <Plus size={16} /> Create
                            </motion.button>
                        )}
                        <motion.button whileTap={{ scale: 0.95 }} onClick={fetchReturns} className="pm-btn pm-btn-outline">
                            <RefreshCw size={16} />
                        </motion.button>
                    </div>
                </div>

                {createMode && (
                    <div className="pm-filters-row">
                        <select value={sourceType} onChange={(e) => { setSourceType(e.target.value); setSourceData(null); setSelected({}); }} className="pm-filter-select">
                            <option value="supplier_invoice">Supplier Invoice</option>
                            <option value="supplier_delivery">Supplier Delivery Note</option>
                        </select>
                        <div className="pm-search-wrap">
                            <Search size={14} className="pm-search-icon" />
                            <input
                                className="pm-search-input"
                                value={sourceNumber}
                                onChange={(e) => setSourceNumber(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && lookupSource()}
                                placeholder={sourceType === 'supplier_invoice' ? 'Enter Supplier Invoice Number' : 'Enter Supplier Delivery Note Number'}
                            />
                        </div>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={lookupSource} className="pm-btn pm-btn-primary">
                            <FileSearch size={16} /> Load
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setCreateMode(false);
                                setSourceData(null);
                                setSelected({});
                                setSourceNumber('');
                                setReason('');
                                setTerms('');
                                setNotes('');
                            }}
                            className="pm-btn pm-btn-outline"
                        >
                            Cancel
                        </motion.button>
                    </div>
                )}

                {sourceData && (
                    <div className="pm-card-body-padded">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.9rem' }}>
                            <input className="pm-search-input" value={sourceData.sourceNumber || ''} readOnly />
                            <input
                                className="pm-search-input"
                                value={sourceData.supplierRef?.name || 'Supplier not linked on stock batches'}
                                readOnly
                            />
                            <input
                                className="pm-search-input"
                                placeholder="Reason (optional)"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                style={{ gridColumn: '1 / -1' }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.9rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Return Terms</label>
                                <textarea
                                    className="pm-search-input"
                                    value={terms}
                                    onChange={(e) => setTerms(e.target.value)}
                                    rows={4}
                                    style={{ width: '100%', resize: 'vertical', minHeight: '90px' }}
                                    placeholder="Terms to appear on the goods return notice..."
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Return Notes</label>
                                <textarea
                                    className="pm-search-input"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={4}
                                    style={{ width: '100%', resize: 'vertical', minHeight: '90px' }}
                                    placeholder="Additional notes for this return notice..."
                                />
                            </div>
                        </div>
                        <div className="modern-table-card">
                            <div className="modern-table-scroll">
                                <table className="modern-table">
                                    <thead>
                                        <tr>
                                            <th>Return</th>
                                            <th>Item / Batch</th>
                                            <th>Max Qty</th>
                                            <th>Qty</th>
                                            <th>Unit Cost</th>
                                            <th>Serials</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(sourceData.items || []).map((item) => {
                                            const state = selected[item.sourceItemKey] || { enabled: false, quantity: 0, serialNumbers: [] };
                                            return (
                                                <tr key={item.sourceItemKey}>
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            checked={!!state.enabled}
                                                            onChange={(e) => setSelected((prev) => ({
                                                                ...prev,
                                                                [item.sourceItemKey]: { ...state, enabled: e.target.checked },
                                                            }))}
                                                        />
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 700 }}>{item.productName || item.productRef?.name || 'Item'}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.batchRef}{item.location ? ` · ${item.location}` : ''}</div>
                                                    </td>
                                                    <td>{item.maxReturnableQty}</td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={item.maxReturnableQty}
                                                            value={state.quantity}
                                                            onChange={(e) => setSelected((prev) => ({
                                                                ...prev,
                                                                [item.sourceItemKey]: {
                                                                    ...state,
                                                                    quantity: Number(e.target.value || 0),
                                                                    serialNumbers: item.hasSerialNumbers
                                                                        ? (item.serialNumbers || []).slice(0, Number(e.target.value || 0))
                                                                        : [],
                                                                },
                                                            }))}
                                                            style={{ width: '90px' }}
                                                        />
                                                    </td>
                                                    <td>Rs. {Number(item.unitCost || 0).toLocaleString()}</td>
                                                    <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                        {(item.serialNumbers || []).join(', ') || 'N/A'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                disabled={isSubmitting}
                                onClick={submitReturn}
                                className="pm-btn pm-btn-primary"
                            >
                                <Plus size={16} /> {isSubmitting ? 'Processing...' : 'Process Goods Return'}
                            </motion.button>
                        </div>
                    </div>
                )}
            </div>

            <div className="pm-card" style={{ marginTop: '1rem' }}>
                <div className="pm-card-header">
                    <div className="pm-card-title">
                        <div className="pm-card-icon indigo"><Package size={20} /></div>
                        <div><h3>Processed Goods Returns</h3></div>
                    </div>
                    <div className="pm-card-actions">
                        <div className="pm-search-wrap">
                            <Search size={14} className="pm-search-icon" />
                            <input className="pm-search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search goods returns..." />
                        </div>
                        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '12px', alignItems: 'center' }}>
                            <button type="button" onClick={() => setActiveTab('Active')} style={{ padding: '6px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', background: activeTab === 'Active' ? '#fff' : 'transparent', color: activeTab === 'Active' ? '#0f172a' : '#64748b', boxShadow: activeTab === 'Active' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>Active</button>
                            <button type="button" onClick={() => setActiveTab('Cancelled')} style={{ padding: '6px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', background: activeTab === 'Cancelled' ? '#fff' : 'transparent', color: activeTab === 'Cancelled' ? '#ef4444' : '#64748b', boxShadow: activeTab === 'Cancelled' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>Deleted / Cancelled</button>
                        </div>
                    </div>
                </div>
                {loading ? (
                    <div className="pm-loading"><RefreshCw className="animate-spin" size={20} /> Loading...</div>
                ) : (
                    <div className="modern-table-card">
                        <div className="modern-table-scroll">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Return #</th>
                                        <th>Source</th>
                                        <th>Supplier</th>
                                        <th>Items</th>
                                        <th>Amount</th>
                                        <th>Date</th>
                                        <th className="text-center">Status</th>
                                        <th className="text-center" style={{ width: '200px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReturns.map((note) => (
                                        <tr key={note._id}>
                                            <td>{note.returnNumber}</td>
                                            <td>
                                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f766e' }}>
                                                    {note.sourceType === 'supplier_delivery' ? 'Supplier DN' : 'Supplier Invoice'}
                                                </div>
                                                {note.sourceNumber}
                                            </td>
                                            <td>{note.supplierRef?.name || note.supplierName || '—'}</td>
                                            <td>{(note.items || []).length}</td>
                                            <td>Rs. {(note.returnAmount || 0).toLocaleString()}</td>
                                            <td>{new Date(note.returnDate || note.createdAt).toLocaleDateString()}</td>
                                            <td className="text-center">
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '4px 10px',
                                                    borderRadius: '999px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 800,
                                                    background: note.status === 'Cancelled' ? '#fef2f2' : '#ecfdf5',
                                                    color: note.status === 'Cancelled' ? '#dc2626' : '#059669',
                                                }}>
                                                    {note.status === 'Cancelled' ? 'Cancelled' : 'Processed'}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <div className="modern-table-actions" style={{ justifyContent: 'center' }}>
                                                    <motion.button whileTap={{ scale: 0.95 }} type="button" className="modern-table-action view" onClick={() => openPreview(note)} title="View / Print">
                                                        <Printer size={14} />
                                                    </motion.button>
                                                    {isAdmin && (
                                                        <motion.button whileTap={{ scale: 0.95 }} type="button" className="modern-table-action history" onClick={() => setHistoryNote(note)} title="View Status History">
                                                            <Clock size={14} />
                                                        </motion.button>
                                                    )}
                                                    {isAdmin && note.status !== 'Cancelled' && isWithin30Days(note.createdAt) && (
                                                        <motion.button whileTap={{ scale: 0.95 }} type="button" className="modern-table-action edit" onClick={() => openEditModal(note)} title="Edit">
                                                            <Edit3 size={14} />
                                                        </motion.button>
                                                    )}
                                                    {isAdmin && note.status !== 'Cancelled' && isWithin30Days(note.createdAt) && (
                                                        <motion.button whileTap={{ scale: 0.95 }} type="button" className="modern-table-action delete" onClick={() => openDeleteModal(note)} title="Cancel return">
                                                            <Trash2 size={14} />
                                                        </motion.button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredReturns.length === 0 && (
                                        <tr><td colSpan="8" className="modern-table-empty">No goods return notes found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {previewReturn && businessData && (
                <div className="app-print-overlay">
                    <div className="app-print-shell">
                        <div className="app-print-toolbar">
                            <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={handlePrint} className="app-print-btn">
                                <Printer size={18} /> A4 Print / PDF
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={closePreview} className="app-print-close">
                                <X size={20} />
                            </motion.button>
                        </div>
                        <div className="app-print-doc" ref={printRef}>
                            <GoodsReturnTemplate goodsReturn={previewReturn} business={businessData} />
                        </div>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {deleteModalOpen && noteToDelete && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: 450, textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                            <ShieldAlert size={48} color="#ef4444" style={{ marginBottom: '1rem', margin: '0 auto' }} />
                            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}>Cancel Goods Return?</h3>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                                This soft-cancels the return note, reverses stock movements, and logs the reason in status history.
                            </p>
                            <label style={labelStyle}>Cancellation Reason *</label>
                            <textarea
                                placeholder="e.g. Created in error, wrong supplier document..."
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                                required
                                style={{ ...inputStyle, height: 100, resize: 'none', marginBottom: '1.5rem' }}
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={() => { setDeleteModalOpen(false); setDeleteReason(''); setNoteToDelete(null); }} style={{ background: '#f8fafc', color: '#64748b', border: 'none', borderRadius: '12px', padding: '0.8rem', fontWeight: 800, cursor: 'pointer' }}>Back</motion.button>
                                <motion.button whileTap={{ scale: isSubmitting ? 1 : 0.95 }} type="button" onClick={confirmDelete} disabled={isSubmitting || !deleteReason.trim()} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.8rem', fontWeight: 800, cursor: (isSubmitting || !deleteReason.trim()) ? 'not-allowed' : 'pointer', opacity: (isSubmitting || !deleteReason.trim()) ? 0.6 : 1 }}>{isSubmitting ? 'Processing...' : 'Cancel Return'}</motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {editModalOpen && noteToEdit && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ background: '#fff', borderRadius: '24px', padding: '2rem', width: '100%', maxWidth: 520, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.2rem' }}>Edit {noteToEdit.returnNumber}</h3>
                                <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={() => { setEditModalOpen(false); setNoteToEdit(null); setEditNote(''); }} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></motion.button>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>Reason</label>
                                <input value={editForm.reason} onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })} style={inputStyle} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>Terms</label>
                                <textarea value={editForm.terms} onChange={(e) => setEditForm({ ...editForm, terms: e.target.value })} style={{ ...inputStyle, height: 80, resize: 'vertical' }} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>Notes</label>
                                <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} style={{ ...inputStyle, height: 80, resize: 'vertical' }} />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={labelStyle}>Edit Note *</label>
                                <textarea placeholder="Why is this being edited?" value={editNote} onChange={(e) => setEditNote(e.target.value)} required style={{ ...inputStyle, height: 80, resize: 'none' }} />
                            </div>
                            <motion.button whileTap={{ scale: isSubmitting ? 1 : 0.98 }} type="button" onClick={confirmEdit} disabled={isSubmitting || !editNote.trim()} style={{ background: isSubmitting || !editNote.trim() ? '#94a3b8' : '#4f46e5', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.9rem', width: '100%', fontWeight: 800, cursor: (isSubmitting || !editNote.trim()) ? 'not-allowed' : 'pointer' }}>{isSubmitting ? 'Saving...' : 'Save Changes'}</motion.button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {historyNote && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ background: '#fff', borderRadius: '24px', padding: '2rem', width: '100%', maxWidth: 600, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '85vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h3 style={{ margin: 0, fontWeight: 900, color: '#0f172a', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Clock size={22} color="#3b82f6" /> Status History: {historyNote.returnNumber}
                                </h3>
                                <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={() => setHistoryNote(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></motion.button>
                            </div>
                            {historyNote.statusHistory && historyNote.statusHistory.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {historyNote.statusHistory.map((hist, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '40px' }}>
                                                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#3b82f6', margin: '4px 0', border: '3px solid #eff6ff' }} />
                                                {idx < historyNote.statusHistory.length - 1 && <div style={{ width: 2, height: '100%', background: '#e2e8f0', minHeight: '40px' }} />}
                                            </div>
                                            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', flex: 1, border: '1px solid #e2e8f0' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                                                    <span style={{
                                                        padding: '4px 10px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 800,
                                                        borderRadius: '999px',
                                                        background: hist.status === 'Cancelled' ? '#fef2f2' : '#ecfdf5',
                                                        color: hist.status === 'Cancelled' ? '#dc2626' : '#059669',
                                                    }}>{hist.status}</span>
                                                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>{new Date(hist.editedAt).toLocaleString()}</span>
                                                </div>
                                                <div style={{ fontSize: '0.9rem', color: '#334155', marginBottom: hist.note ? '0.75rem' : '0' }}>
                                                    Updated by <strong style={{ color: '#0f172a' }}>{hist.editedBy?.firstName || 'System'} {hist.editedBy?.lastName || ''}</strong>
                                                </div>
                                                {hist.note && (
                                                    <div style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic', background: '#fff', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid #cbd5e1' }}>
                                                        &quot;{hist.note}&quot;
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
        </div>
    );
};

export default GoodsReturnManagement;
