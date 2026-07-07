import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Search, Undo2, Plus, FileSearch, Printer, Eye, X } from 'lucide-react';
import api from '../../api';
import useSubmitGuard from '../../utils/useSubmitGuard';
import '../../styles/modern-table.css';
import SalesReturnTemplate from './SalesReturnTemplate';

const SalesReturnManagement = ({ currentUser, showToast }) => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sourceType, setSourceType] = useState('invoice');
    const [sourceNumber, setSourceNumber] = useState('');
    const [sourceData, setSourceData] = useState(null);
    const [stockLocation, setStockLocation] = useState('');
    const [reason, setReason] = useState('');
    const [terms, setTerms] = useState('');
    const [notes, setNotes] = useState('');
    const [specialOverride, setSpecialOverride] = useState(false);
    const [selected, setSelected] = useState({});
    const { isSubmitting, runGuarded } = useSubmitGuard();
    const [searchTerm, setSearchTerm] = useState('');
    const [createMode, setCreateMode] = useState(false);
    const [stores, setStores] = useState([]);
    const [businessData, setBusinessData] = useState(null);
    const [viewReturn, setViewReturn] = useState(null);
    const [previewReturn, setPreviewReturn] = useState(null);
    const printRef = useRef();

    const isSuperRoot = currentUser?.role === 'root';

    const fetchReturns = async () => {
        setLoading(true);
        try {
            const [returnsRes, businessRes] = await Promise.all([
                api.get('/sales-returns'),
                api.get('/business'),
            ]);
            setReturns(returnsRes.data.data || []);
            const details = businessRes.data?.data?.details || null;
            setStores(details?.stores || []);
            setBusinessData(details);
        } catch (error) {
            showToast?.(error.response?.data?.message || 'Failed to load sales returns', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReturns(); }, []);

    const lookupSource = async () => {
        if (!sourceNumber.trim()) return showToast?.('Enter source number', 'error');
        try {
            const query = sourceType === 'invoice'
                ? `invoiceNumber=${encodeURIComponent(sourceNumber.trim())}`
                : `deliveryNoteNumber=${encodeURIComponent(sourceNumber.trim())}`;
            const res = await api.get(`/sales-returns/source?${query}`);
            setSourceData(res.data.data);
            setSpecialOverride(false);
            const defaults = {};
            (res.data.data.items || []).forEach((item) => {
                defaults[item.sourceItemKey] = {
                    enabled: item.maxReturnableQty > 0,
                    quantity: item.maxReturnableQty > 0 ? item.maxReturnableQty : 0,
                    serialNumbers: item.serialNumbers?.slice(0, item.maxReturnableQty) || [],
                };
            });
            setSelected(defaults);
            setTerms(businessData?.salesReturnTerms || '');
            setNotes(businessData?.salesReturnNotes || '');
            showToast?.('Source document loaded', 'success');
        } catch (error) {
            setSourceData(null);
            setSelected({});
            const validity = error.response?.data?.validity;
            const baseMsg = error.response?.data?.message || 'Source lookup failed';
            const detail = validity?.expiresAt
                ? ` Expired on ${new Date(validity.expiresAt).toLocaleDateString()}.`
                : '';
            showToast?.(`${baseMsg}${detail}`, 'error');
        }
    };

    const submitReturn = async () => {
        if (!sourceData?.sourceId) return showToast?.('Load source document first', 'error');
        if (sourceData.validityExpired && !specialOverride) {
            return showToast?.(
                isSuperRoot
                    ? 'Return window expired. Enable Special Requirement override to proceed.'
                    : 'Return window expired. Contact Super Admin for special requirements.',
                'error',
            );
        }

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
                await api.post('/sales-returns', {
                    sourceType: sourceData.sourceType,
                    sourceId: sourceData.sourceId,
                    items: payloadItems,
                    returnStockLocation: stockLocation,
                    reason,
                    terms,
                    notes,
                    ...(sourceData.validityExpired && specialOverride ? { specialOverride: true } : {}),
                });
                showToast?.('Sales return note processed successfully', 'success');
                setSourceData(null);
                setSelected({});
                setSourceNumber('');
                setReason('');
                setTerms('');
                setNotes('');
                setStockLocation('');
                setSpecialOverride(false);
                setCreateMode(false);
                fetchReturns();
            } catch (error) {
                showToast?.(error.response?.data?.message || 'Failed to create sales return note', 'error');
            }
        });
    };

    const filteredReturns = useMemo(() => returns.filter((note) => {
        const term = searchTerm.toLowerCase();
        return (note.returnNumber || '').toLowerCase().includes(term)
            || (note.sourceNumber || '').toLowerCase().includes(term)
            || (note.clientRef?.firstName || '').toLowerCase().includes(term)
            || (note.manualClientDetails?.name || '').toLowerCase().includes(term);
    }), [returns, searchTerm]);

    const handlePrint = (note) => {
        if (!note) return;
        setViewReturn(note);
        setTimeout(() => {
            const printContent = printRef.current;
            if (!printContent) return;

            const returnId = note.returnNumber || 'SRN';
            const clientName = note.clientRef
                ? `${note.clientRef.firstName || ''}_${note.clientRef.lastName || ''}`.trim()
                : (note.manualClientDetails?.organization || note.manualClientDetails?.name || 'Client');
            const cleanClient = clientName.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_+/g, '_');
            const dateStr = new Date(note.returnDate || note.createdAt || Date.now()).toISOString().slice(0, 10);
            const fileName = `${returnId}_${cleanClient}_${dateStr}`;

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
                        <SalesReturnTemplate salesReturn={viewReturn} business={businessData} />
                    )}
                </div>
            </div>

            <div className="pm-card">
                <div className="pm-card-header">
                    <div className="pm-card-title">
                        <div className="pm-card-icon red"><Undo2 size={22} /></div>
                        <div>
                            <h3>Sales Return Note Engine</h3>
                            <div className="pm-card-subtitle">Admin/Root only - auto fill from Invoice or Delivery Note.</div>
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
                        <motion.button whileTap={{ scale: 0.95 }} onClick={fetchReturns} className="pm-btn pm-btn-outline"><RefreshCw size={16} /></motion.button>
                    </div>
                </div>

                {createMode && (
                    <div className="pm-filters-row">
                        <select value={sourceType} onChange={(e) => setSourceType(e.target.value)} className="pm-filter-select">
                            <option value="invoice">Invoice</option>
                            <option value="delivery_note">Delivery Note</option>
                        </select>
                        <div className="pm-search-wrap">
                            <Search size={14} className="pm-search-icon" />
                            <input className="pm-search-input" value={sourceNumber} onChange={(e) => setSourceNumber(e.target.value)} placeholder={sourceType === 'invoice' ? 'Enter Invoice Number' : 'Enter Delivery Note Number'} />
                        </div>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={lookupSource} className="pm-btn pm-btn-primary"><FileSearch size={16} /> Load</motion.button>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setCreateMode(false);
                                setSourceData(null);
                                setSelected({});
                                setSourceNumber('');
                                setSpecialOverride(false);
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
                        {sourceData.validityExpiresAt && (
                            sourceData.validityExpired ? (
                                <div style={{ marginBottom: '0.9rem', padding: '0.75rem 1rem', borderRadius: '10px', background: '#fff7ed', border: '1px solid #fdba74', color: '#9a3412', fontSize: '0.85rem' }}>
                                    <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Return window expired on {new Date(sourceData.validityExpiresAt).toLocaleDateString()}</div>
                                    <div>Allowed period was {sourceData.validityDuration} {sourceData.validityUnit} from invoice date.</div>
                                    {sourceData.allowSpecialOverride && (
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.65rem', fontWeight: 600, cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={specialOverride}
                                                onChange={(e) => setSpecialOverride(e.target.checked)}
                                            />
                                            Special Requirement — Super Admin override (process expired return)
                                        </label>
                                    )}
                                </div>
                            ) : (
                                <div style={{ marginBottom: '0.9rem', padding: '0.75rem 1rem', borderRadius: '10px', background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#166534', fontSize: '0.85rem', fontWeight: 600 }}>
                                    Return window valid until {new Date(sourceData.validityExpiresAt).toLocaleDateString()}
                                    {sourceData.validityDaysRemaining != null ? ` (${sourceData.validityDaysRemaining} day(s) remaining)` : ''}
                                    {' — '}allowed within {sourceData.validityDuration} {sourceData.validityUnit} from invoice date.
                                </div>
                            )
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.9rem' }}>
                            <input className="pm-search-input" value={sourceData.sourceNumber || ''} readOnly />
                            <input className="pm-search-input" value={sourceData.clientRef ? `${sourceData.clientRef.firstName || ''} ${sourceData.clientRef.lastName || ''}`.trim() : sourceData.manualClientDetails?.name || sourceData.manualClientDetails?.organization || ''} readOnly />
                            <select className="pm-filter-select" value={stockLocation} onChange={(e) => setStockLocation(e.target.value)}>
                                <option value="">Select return stock location</option>
                                {stores.map((store, idx) => (
                                    <option key={`${store.name || 'store'}-${idx}`} value={store.name || ''}>
                                        {store.name || `Store ${idx + 1}`}
                                    </option>
                                ))}
                            </select>
                            <input className="pm-search-input" placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.9rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Return Terms (manual)</label>
                                <textarea
                                    className="pm-search-input"
                                    value={terms}
                                    onChange={(e) => setTerms(e.target.value)}
                                    rows={4}
                                    style={{ width: '100%', resize: 'vertical', minHeight: '90px' }}
                                    placeholder="Terms to appear on the sales return notice..."
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Return Notes (manual)</label>
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
                                            <th>Item</th>
                                            <th>Max Qty</th>
                                            <th>Qty</th>
                                            <th>Serials</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(sourceData.items || []).map((item) => {
                                            const state = selected[item.sourceItemKey] || { enabled: false, quantity: 0, serialNumbers: [] };
                                            return (
                                                <tr key={item.sourceItemKey}>
                                                    <td><input type="checkbox" checked={!!state.enabled} onChange={(e) => setSelected((prev) => ({ ...prev, [item.sourceItemKey]: { ...state, enabled: e.target.checked } }))} /></td>
                                                    <td>{item.manualName || item.productRef?.name || 'Item'}</td>
                                                    <td>{item.maxReturnableQty}</td>
                                                    <td><input type="number" min="0" max={item.maxReturnableQty} value={state.quantity} onChange={(e) => setSelected((prev) => ({ ...prev, [item.sourceItemKey]: { ...state, quantity: Number(e.target.value || 0) } }))} style={{ width: '90px' }} /></td>
                                                    <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{(item.serialNumbers || []).join(', ') || 'N/A'}</td>
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
                                disabled={isSubmitting || (sourceData.validityExpired && !specialOverride)}
                                onClick={submitReturn}
                                className="pm-btn pm-btn-primary"
                            >
                                <Plus size={16} /> {isSubmitting ? 'Processing...' : 'Process Return'}
                            </motion.button>
                        </div>
                    </div>
                )}
            </div>

            <div className="pm-card" style={{ marginTop: '1rem' }}>
                <div className="pm-card-header">
                    <div className="pm-card-title">
                        <div className="pm-card-icon indigo"><Undo2 size={20} /></div>
                        <div><h3>Processed Returns</h3></div>
                    </div>
                    <div className="pm-card-actions">
                        <div className="pm-search-wrap">
                            <Search size={14} className="pm-search-icon" />
                            <input className="pm-search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search return notes..." />
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
                                        <th>Customer</th>
                                        <th>Payment</th>
                                        <th>Amount</th>
                                        <th>Date</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReturns.map((note) => (
                                        <tr key={note._id}>
                                            <td>{note.returnNumber}</td>
                                            <td>{note.sourceNumber}</td>
                                            <td>{note.clientRef ? `${note.clientRef.firstName || ''} ${note.clientRef.lastName || ''}`.trim() : note.manualClientDetails?.name || note.manualClientDetails?.organization || '—'}</td>
                                            <td>{note.paymentMethodAtSale}</td>
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
                                    {filteredReturns.length === 0 && <tr><td colSpan="7" className="modern-table-empty">No sales return notes found.</td></tr>}
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
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>Sales Return Preview - {previewReturn.returnNumber}</div>
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
                            <SalesReturnTemplate salesReturn={previewReturn} business={businessData} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesReturnManagement;
