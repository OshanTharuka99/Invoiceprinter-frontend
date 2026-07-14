import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Search, Package, Plus, FileSearch, Printer, Eye, X } from 'lucide-react';
import api from '../../api';
import useSubmitGuard from '../../utils/useSubmitGuard';
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
    const [viewReturn, setViewReturn] = useState(null);
    const [previewReturn, setPreviewReturn] = useState(null);
    const printRef = useRef();

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
        return (note.returnNumber || '').toLowerCase().includes(term)
            || (note.sourceNumber || '').toLowerCase().includes(term)
            || (note.supplierRef?.name || '').toLowerCase().includes(term)
            || (note.supplierName || '').toLowerCase().includes(term);
    }), [returns, searchTerm]);

    const handlePrint = (note) => {
        if (!note) return;
        setViewReturn(note);
        setTimeout(() => {
            const printContent = printRef.current;
            if (!printContent) return;

            const returnId = note.returnNumber || 'GRN';
            const supplierName = note.supplierRef?.name || note.supplierName || 'Supplier';
            const cleanSupplier = supplierName.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_+/g, '_');
            const dateStr = new Date(note.returnDate || note.createdAt || Date.now()).toISOString().slice(0, 10);
            const fileName = `${returnId}_${cleanSupplier}_${dateStr}`;

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
            setTimeout(() => {
                windowPrint.print();
                windowPrint.close();
            }, 400);
        }, 100);
    };

    return (
        <div className="pm-root">
            <div style={{ display: 'none' }}>
                <div ref={printRef}>
                    {viewReturn && businessData && (
                        <GoodsReturnTemplate goodsReturn={viewReturn} business={businessData} />
                    )}
                </div>
            </div>

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
                                        <th className="text-center">Actions</th>
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
                                                <div className="modern-table-actions" style={{ justifyContent: 'center' }}>
                                                    <button type="button" className="modern-table-action edit" onClick={() => setPreviewReturn(note)} title="View">
                                                        <Eye size={14} />
                                                    </button>
                                                    <button type="button" className="modern-table-action view" onClick={() => handlePrint(note)} title="Print / PDF">
                                                        <Printer size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredReturns.length === 0 && (
                                        <tr><td colSpan="7" className="modern-table-empty">No goods return notes found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {previewReturn && businessData && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 9999,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '1rem',
                    }}
                    onClick={() => setPreviewReturn(null)}
                >
                    <div
                        style={{
                            width: '100%',
                            maxWidth: '1100px',
                            maxHeight: '92vh',
                            background: '#f8fafc',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>Goods Return Preview - {previewReturn.returnNumber}</div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="button" className="pm-btn pm-btn-primary" onClick={() => handlePrint(previewReturn)}>
                                    <Printer size={15} /> A4 Print / PDF
                                </button>
                                <button type="button" className="pm-btn pm-btn-outline" onClick={() => setPreviewReturn(null)}>
                                    <X size={15} /> Close
                                </button>
                            </div>
                        </div>
                        <div style={{ overflow: 'auto', padding: '1rem' }}>
                            <GoodsReturnTemplate goodsReturn={previewReturn} business={businessData} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoodsReturnManagement;
