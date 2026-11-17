import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Banknote, Plus, Search, RefreshCw, Download, Trash2, X, FileText, AlertTriangle, Calendar, Users, Eye, Building2, Phone, MapPin, CheckCircle2, XCircle, Printer, CreditCard, Edit3, Clock } from 'lucide-react';
import api from '../../api';
import useSubmitGuard from '../../utils/useSubmitGuard';
import { openA4PrintWindow, buildPrintFileName } from '../../utils/printDocument';
import { currencyLabel, formatNumber } from '../../utils/currency';
import CashReceiptTemplate from './CashReceiptTemplate';
import './CashReceiptManagement.css';
import '../../styles/modern-table.css';

const CashReceiptManagement = ({ showToast }) => {
    const [receipts, setReceipts] = useState([]);
    const [stats, setStats] = useState({ todayTotal: 0, todayCount: 0, monthTotal: 0, monthCount: 0, voidedCount: 0 });
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [quotations, setQuotations] = useState([]);
    const [businessData, setBusinessData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [viewReceipt, setViewReceipt] = useState(null);
    const [voidModal, setVoidModal] = useState(null);
    const [voidReason, setVoidReason] = useState('');
    const [printTarget, setPrintTarget] = useState(null);
    const printRef = useRef(null);
    const { isSubmitting, runGuarded } = useSubmitGuard();

    const [form, setForm] = useState({
        clientRef: '',
        manualMode: false,
        manualClientDetails: { organization: '', name: '', telephoneNumber: '', address: '' },
        amountReceived: '',
        paymentMethod: 'cash',
        chequeNumber: '',
        projectRef: '',
        quotationRef: '',
        invoiceRef: '',
        receiptType: 'payment',
        receiptDate: new Date().toISOString().slice(0, 10),
        description: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter !== 'all') params.status = statusFilter;
            if (searchTerm.trim()) params.search = searchTerm.trim();

            const [rRes, cRes, bRes, prRes, invRes, qRes] = await Promise.allSettled([
                api.get('/cash-receipts', { params }),
                api.get('/clients'),
                api.get('/business'),
                api.get('/projects'),
                api.get('/invoices'),
                api.get('/quotations')
            ]);

            if (rRes.status === 'fulfilled') {
                setReceipts(rRes.value.data?.data || []);
                setStats(rRes.value.data?.stats || stats);
            } else {
                const msg = rRes.reason?.response?.data?.message || 'Error fetching cash receipts';
                showToast?.(msg, 'error');
            }

            if (cRes.status === 'fulfilled') setClients(cRes.value.data?.data || []);
            if (prRes.status === 'fulfilled') setProjects(prRes.value.data?.data || []);
            if (invRes.status === 'fulfilled') setInvoices(invRes.value.data?.data || []);
            if (qRes.status === 'fulfilled') setQuotations(qRes.value.data?.data || []);
            if (bRes.status === 'fulfilled' && bRes.value.data?.data?.details) {
                setBusinessData(bRes.value.data.data.details);
            }
        } catch (err) {
            showToast?.(err.response?.data?.message || 'Error fetching cash receipts', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [statusFilter, searchTerm]);

    const fmt = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const fmtMoney = (n) => formatNumber(n);

    const EDIT_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
    const isEditable = (r) => r.status !== 'void'
        && !r.appliedToInvoice
        && (Date.now() - new Date(r.createdAt || r.receiptDate).getTime()) <= EDIT_WINDOW_MS;
    const canEdit = (r) => isEditable(r) && r.autoCreated !== true;

    const CR = currencyLabel(businessData?.primaryCurrency);

    const clientName = (r) => {
        if (r.clientRef) {
            return [r.clientRef.firstName, r.clientRef.lastName].filter(Boolean).join(' ') || r.clientRef.organization || 'Walk-in Customer';
        }
        if (r.manualClientDetails) {
            return r.manualClientDetails.name || r.manualClientDetails.organization || 'Walk-in Customer';
        }
        return 'Walk-in Customer';
    };

    const clientOrg = (r) => {
        const org = r.clientRef?.organization || r.manualClientDetails?.organization || '';
        return org && org !== clientName(r) ? org : '';
    };

    const methodLabel = (m) => String(m || 'cash').split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

    const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const visibleProjects = !form.manualMode && form.clientRef
        ? projects.filter(p => String(p.client?._id || '') === String(form.clientRef))
        : projects;

    const selectedProject = projects.find(p => String(p._id) === String(form.projectRef));
    const projectCreditValue = form.receiptType === 'payment' ? Number(selectedProject?.creditValue || 0) : 0;

    const projectDocNos = (pid) => {
        let qt = '';
        let inv = '';
        quotations.forEach(q => { if (String(q.projectId?._id || q.projectId) === String(pid)) qt = q.quotationId; });
        invoices.forEach(i => { if (String(i.projectId?._id || i.projectId) === String(pid)) inv = i.invoiceNumber; });
        return { qt, inv };
    };

    const receiptDocNos = (r) => projectDocNos(r.projectRef?._id || r.projectRef);

    const visibleQuotations = quotations.filter(q => {
        const pidMatch = !form.projectRef || String(q.projectId?._id || q.projectId) === String(form.projectRef);
        const cidMatch = !form.clientRef || String(q.clientRef?._id || q.clientRef || '') === String(form.clientRef);
        return pidMatch && cidMatch;
    });

    const visibleInvoices = invoices.filter(i => {
        const pidMatch = !form.projectRef || String(i.projectId?._id || i.projectId) === String(form.projectRef);
        const cidMatch = !form.clientRef || String(i.clientRef?._id || i.clientRef || '') === String(form.clientRef);
        // Only show non-cancelled invoices that still have an outstanding balance
        return pidMatch && cidMatch && i.status !== 'Cancelled' && (i.outstandingBalance ?? 0) > 0;
    });

    const selectedInvoice = invoices.find(i => String(i._id) === String(form.invoiceRef));
    const invoiceOutstanding = form.receiptType === 'payment' && selectedInvoice
        ? Number(selectedInvoice.outstandingBalance ?? 0) : 0;

    // The effective cap for the amount field: invoice outstanding takes priority over project credit.
    // When editing, the receipt's own current amount is added back to the available capacity.
    const editOffset = editTarget && editTarget.receiptType === 'payment' ? (Number(editTarget.amountReceived) || 0) : 0;
    const editSameInvoice = !!editTarget && String(editTarget.invoiceRef?._id || editTarget.invoiceRef || '') === String(form.invoiceRef);
    const editSameProject = !!editTarget && !form.invoiceRef && String(editTarget.projectRef?._id || editTarget.projectRef || '') === String(form.projectRef);
    const effectiveAmountCap = invoiceOutstanding > 0
        ? invoiceOutstanding + (editSameInvoice ? editOffset : 0)
        : projectCreditValue + (editSameProject ? editOffset : 0);

    const resetForm = () => {
        setEditTarget(null);
        setForm({
            clientRef: '',
            manualMode: false,
            manualClientDetails: { organization: '', name: '', telephoneNumber: '', address: '' },
            amountReceived: '',
            paymentMethod: 'cash',
            chequeNumber: '',
            projectRef: '',
            quotationRef: '',
            invoiceRef: '',
            receiptType: 'payment',
            receiptDate: new Date().toISOString().slice(0, 10),
            description: ''
        });
    };

    const startEdit = (r) => {
        setEditTarget(r);
        setForm({
            clientRef: r.clientRef?._id || r.clientRef || '',
            manualMode: !r.clientRef,
            manualClientDetails: {
                organization: r.manualClientDetails?.organization || '',
                name: r.manualClientDetails?.name || '',
                telephoneNumber: r.manualClientDetails?.telephoneNumber || '',
                address: r.manualClientDetails?.address || ''
            },
            amountReceived: Number(r.amountReceived || 0).toFixed(2),
            paymentMethod: r.paymentMethod || 'cash',
            chequeNumber: r.chequeNumber || '',
            projectRef: r.projectRef?._id || r.projectRef || '',
            quotationRef: r.quotationRef?._id || r.quotationRef || '',
            invoiceRef: r.invoiceRef?._id || r.invoiceRef || '',
            receiptType: r.receiptType || 'payment',
            receiptDate: new Date(r.receiptDate).toISOString().slice(0, 10),
            description: r.description || ''
        });
        setShowForm(true);
    };

    const buildPayload = () => ({
        clientRef: !form.manualMode ? form.clientRef : null,
        manualClientDetails: form.manualMode ? form.manualClientDetails : {},
        amountReceived: form.amountReceived,
        paymentMethod: form.paymentMethod,
        chequeNumber: form.paymentMethod === 'cheque' ? (form.chequeNumber || '') : '',
        projectRef: form.projectRef || null,
        quotationRef: form.quotationRef || null,
        invoiceRef: form.invoiceRef || null,
        receiptType: form.receiptType,
        receiptDate: form.receiptDate ? new Date(form.receiptDate) : undefined,
        description: form.description
    });

    const handleCreate = async () => {
        const amount = Number(form.amountReceived) || 0;
        if (!amount || amount <= 0) return showToast?.('Enter the amount received', 'error');
        if (effectiveAmountCap > 0 && amount > effectiveAmountCap) {
            return showToast?.(`Amount cannot exceed ${CR} ${formatNumber(effectiveAmountCap)}`, 'error');
        }
        await runGuarded(async () => {
            try {
                const res = await api.post('/cash-receipts', buildPayload());
                showToast?.('Cash receipt issued successfully', 'success');
                setShowForm(false);
                resetForm();
                fetchData();
                return res;
            } catch (err) {
                showToast?.(err.response?.data?.message || 'Failed to issue cash receipt', 'error');
            }
        });
    };

    const handleUpdate = async () => {
        const amount = Number(form.amountReceived) || 0;
        if (!amount || amount <= 0) return showToast?.('Enter the amount received', 'error');
        if (effectiveAmountCap > 0 && amount > effectiveAmountCap) {
            return showToast?.(`Amount cannot exceed ${CR} ${formatNumber(effectiveAmountCap)}`, 'error');
        }
        await runGuarded(async () => {
            try {
                const res = await api.put(`/cash-receipts/${editTarget._id}`, buildPayload());
                showToast?.('Cash receipt updated successfully', 'success');
                setShowForm(false);
                resetForm();
                fetchData();
                return res;
            } catch (err) {
                showToast?.(err.response?.data?.message || 'Failed to update cash receipt', 'error');
            }
        });
    };

    const handleVoid = async () => {
        if (!voidReason.trim()) return showToast?.('Void reason is required', 'error');
        await runGuarded(async () => {
            try {
                await api.delete(`/cash-receipts/${voidModal._id}`, { data: { reason: voidReason } });
                showToast?.('Cash receipt voided', 'success');
                setVoidModal(null);
                setVoidReason('');
                fetchData();
            } catch (err) {
                showToast?.(err.response?.data?.message || 'Failed to void cash receipt', 'error');
            }
        });
    };

    const handlePrint = (r) => setPrintTarget(r);

    useEffect(() => {
        if (printTarget && businessData) {
            openA4PrintWindow(printRef.current, buildPrintFileName(
                printTarget.receiptNumber || 'CR',
                clientName(printTarget),
                printTarget.receiptDate || printTarget.createdAt
            ));
            setPrintTarget(null);
        }
    }, [printTarget, businessData]);

    return (
        <div className="cr-root">
            <div className="cr-stats">
                <div className="cr-stat-card green">
                    <div className="cr-stat-icon green"><Banknote size={22} /></div>
                    <div className="cr-stat-body">
                        <div className="cr-stat-value">{CR} {fmtMoney(stats.todayTotal)}</div>
                        <div className="cr-stat-label">Collected Today ({stats.todayCount})</div>
                    </div>
                </div>
                <div className="cr-stat-card indigo">
                    <div className="cr-stat-icon indigo"><Calendar size={22} /></div>
                    <div className="cr-stat-body">
                        <div className="cr-stat-value">{CR} {fmtMoney(stats.monthTotal)}</div>
                        <div className="cr-stat-label">Collected This Month ({stats.monthCount})</div>
                    </div>
                </div>
                <div className="cr-stat-card amber">
                    <div className="cr-stat-icon amber"><FileText size={22} /></div>
                    <div className="cr-stat-body">
                        <div className="cr-stat-value">{receipts.length}</div>
                        <div className="cr-stat-label">Receipts in Registry</div>
                    </div>
                </div>
                <div className="cr-stat-card red">
                    <div className="cr-stat-icon red"><AlertTriangle size={22} /></div>
                    <div className="cr-stat-body">
                        <div className="cr-stat-value">{stats.voidedCount}</div>
                        <div className="cr-stat-label">Voided Receipts</div>
                    </div>
                </div>
            </div>

            <div className="cr-card">
                <div className="cr-card-header">
                    <div className="cr-card-title">
                        <div className="cr-card-icon green"><Banknote size={22} /></div>
                        <div>
                            <h3>Cash Receipt Registry</h3>
                            <div className="cr-card-subtitle">Track all cash received by the business</div>
                        </div>
                    </div>
                    <div className="cr-card-actions">
                        <motion.button whileTap={{ scale: 0.95 }} onClick={fetchData} className="cr-btn cr-btn-outline"><RefreshCw size={16} /></motion.button>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => { resetForm(); setShowForm(true); }} className="cr-btn cr-btn-primary"><Plus size={16} /> Issue Receipt</motion.button>
                    </div>
                </div>

                <div className="cr-filters-row">
                    <div className="cr-search-wrap">
                        <Search size={14} className="cr-search-icon" />
                        <input type="text" placeholder="Search receipt no, client..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="cr-search-input" />
                    </div>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="cr-filter-select">
                        <option value="all">All Status</option>
                        <option value="issued">Issued</option>
                        <option value="void">Void</option>
                    </select>
                </div>

                {loading ? (
                    <div className="cr-loading"><RefreshCw className="animate-spin" size={20} /> Loading cash receipts...</div>
                ) : (
                    <div className="cr-table-shell">
                        <table className="modern-table cr-table">
                            <thead>
                                <tr>
                                    <th>Receipt No</th>
                                    <th>Date</th>
                                    <th>Client</th>
                                    <th>Method</th>
                                    <th>Project</th>
                                    <th className="text-right">Amount</th>
                                    <th>Received By</th>
                                    <th>Status</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {receipts.map(r => (
                                    <tr key={r._id}>
                                        <td><span className="cr-badge cr-badge-id">{r.receiptNumber}</span>{r.receiptType === 'advance' && <span className="cr-badge cr-badge-advance" style={{ marginLeft: '6px' }}>ADVANCE</span>}</td>
                                        <td>
                                            <div className="cr-cell-title">{fmt(r.receiptDate)}</div>
                                        </td>
                                        <td>
                                            <div className="cr-cell-title">{clientName(r)}</div>
                                            {clientOrg(r) && <div className="cr-cell-sub">{clientOrg(r)}</div>}
                                        </td>
                                        <td><span className={`cr-badge cr-badge-method ${r.paymentMethod}`}>{methodLabel(r.paymentMethod)}</span></td>
                                        <td>
                                            <div className="cr-cell-title">{r.projectRef ? r.projectRef.name : 'N/A'}</div>
                                            {r.projectRef && <div className="cr-cell-sub">{r.projectRef.projectId}</div>}
                                            {r.appliedToInvoice && (
                                                <div className="cr-cell-sub" style={{ color: '#2563eb', fontWeight: 700 }}>
                                                    Applied to {r.appliedToInvoice.invoiceNumber}
                                                </div>
                                            )}
                                        </td>
                                        <td className="text-right"><span className="cr-cell-amount">{CR} {fmtMoney(r.amountReceived)}</span></td>
                                        <td>
                                            <div className="cr-cell-title">{r.receivedBy ? `${r.receivedBy.firstName} ${r.receivedBy.lastName || ''}`.trim() : '—'}</div>
                                        </td>
                                        <td>
                                            <span className={`cr-badge ${r.status === 'void' ? 'cr-badge-void' : 'cr-badge-active'}`}>{r.status === 'void' ? 'Void' : 'Issued'}</span>
                                        </td>
                                        <td className="text-center">
                                            <div className="modern-table-actions" style={{ justifyContent: 'center' }}>
                                                {canEdit(r) && (
                                                    <button type="button" className="modern-table-action edit" title="Edit Receipt" onClick={() => startEdit(r)}>
                                                        <Edit3 size={13} />
                                                    </button>
                                                )}
                                                <button type="button" className="modern-table-action view" title="View Receipt" onClick={() => setViewReceipt(r)}>
                                                    <Eye size={13} />
                                                </button>
                                                <button type="button" className="modern-table-action edit" title="Print / Download PDF" onClick={() => handlePrint(r)}>
                                                    <Download size={13} />
                                                </button>
                                                {r.status !== 'void' && isEditable(r) && (
                                                    <button type="button" className="modern-table-action delete" title="Void Receipt" onClick={() => { setVoidModal(r); setVoidReason(''); }}>
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {receipts.length === 0 && (
                                    <tr>
                                        <td colSpan={9}>
                                            <div className="cr-empty">No cash receipts found</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* VIEW RECEIPT MODAL */}
            <AnimatePresence>
                {viewReceipt && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="cr-modal-overlay" onClick={() => setViewReceipt(null)}>
                        <motion.div
                            initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
                            className="cr-modal cr-view-modal"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="cr-modal-header">
                                <div className={`cr-modal-icon ${viewReceipt.status === 'void' ? 'red' : 'green'}`}>
                                    {viewReceipt.status === 'void' ? <AlertTriangle size={18} /> : <Banknote size={18} />}
                                </div>
                                <div>
                                    <h3 className="cr-modal-title">Cash Receipt {viewReceipt.receiptNumber}</h3>
                                    <p className="cr-modal-desc">Receipt details & preview</p>
                                </div>
                                <button className="cr-modal-close" onClick={() => setViewReceipt(null)}><X size={18} /></button>
                            </div>

                            <div className="cr-modal-body cr-view-body">
                                <div className="cr-receipt-view">
                                    <div className="cr-receipt-title">
                                        <span className="cr-receipt-title-main">CASH RECEIPT</span>
                                        <span className="cr-receipt-title-sub">Received with thanks</span>
                                    </div>

                                    <div className={`cr-receipt-status ${viewReceipt.status === 'void' ? 'is-void' : 'is-issued'}`}>
                                        {viewReceipt.status === 'void' ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                                        {viewReceipt.status === 'void' ? 'VOID' : 'ISSUED'}
                                    </div>

                                    <div className="cr-receipt-meta">
                                        <div className="cr-receipt-meta-item">
                                            <span className="cr-receipt-meta-label">Receipt No.</span>
                                            <span className="cr-receipt-meta-value">{viewReceipt.receiptNumber}</span>
                                        </div>
                                        <div className="cr-receipt-meta-item">
                                            <span className="cr-receipt-meta-label">Date</span>
                                            <span className="cr-receipt-meta-value">{fmt(viewReceipt.receiptDate)}</span>
                                        </div>
                                        <div className="cr-receipt-meta-item">
                                            <span className="cr-receipt-meta-label">Payment Method</span>
                                            <span className="cr-receipt-meta-value">{methodLabel(viewReceipt.paymentMethod)}</span>
                                        </div>
                                        <div className="cr-receipt-meta-item">
                                            <span className="cr-receipt-meta-label">Receipt Type</span>
                                            <span className="cr-receipt-meta-value" style={{ color: viewReceipt.receiptType === 'advance' ? '#b45309' : '#0f172a', textTransform: 'uppercase', fontWeight: 800 }}>
                                                {viewReceipt.receiptType === 'advance' ? 'Advance' : 'Payment'}
                                            </span>
                                        </div>
                                        <div className="cr-receipt-meta-item">
                                            <span className="cr-receipt-meta-label">Project</span>
                                            <span className="cr-receipt-meta-value">
                                                {viewReceipt.projectRef ? viewReceipt.projectRef.name : 'N/A'}
                                                {(() => { const { qt, inv } = receiptDocNos(viewReceipt); const extra = [qt && `QT ${qt}`, inv && `INV ${inv}`].filter(Boolean).join(' / '); return extra ? ` — ${extra}` : ''; })()}
                                            </span>
                                        </div>
                                        <div className="cr-receipt-meta-item">
                                            <span className="cr-receipt-meta-label">Quotation</span>
                                            <span className="cr-receipt-meta-value">{viewReceipt.quotationRef?.quotationId || 'N/A'}</span>
                                        </div>
                                        <div className="cr-receipt-meta-item">
                                            <span className="cr-receipt-meta-label">Invoice</span>
                                            <span className="cr-receipt-meta-value">
                                                {viewReceipt.appliedToInvoice ? `Applied to ${viewReceipt.appliedToInvoice.invoiceNumber}` : (viewReceipt.invoiceRef?.invoiceNumber || 'N/A')}
                                            </span>
                                        </div>
                                        {viewReceipt.paymentMethod === 'cheque' && (
                                            <div className="cr-receipt-meta-item">
                                                <span className="cr-receipt-meta-label">Cheque No</span>
                                                <span className="cr-receipt-meta-value">{viewReceipt.chequeNumber || '—'}</span>
                                            </div>
                                        )}
                                        <div className="cr-receipt-meta-item">
                                            <span className="cr-receipt-meta-label">Received By</span>
                                            <span className="cr-receipt-meta-value">{viewReceipt.receivedBy ? `${viewReceipt.receivedBy.firstName} ${viewReceipt.receivedBy.lastName || ''}`.trim() : '—'}</span>
                                        </div>
                                    </div>

                                    <div className="cr-receipt-client">
                                        <div className="cr-receipt-section-label">Received From</div>
                                        <div className="cr-receipt-client-name">{clientName(viewReceipt)}</div>
                                        {(clientOrg(viewReceipt) || viewReceipt.manualClientDetails?.telephoneNumber || viewReceipt.clientRef?.telephoneNumber) && (
                                            <div className="cr-receipt-client-sub">
                                                {clientOrg(viewReceipt) && <span><Building2 size={12} /> {clientOrg(viewReceipt)}</span>}
                                                {(viewReceipt.manualClientDetails?.telephoneNumber || viewReceipt.clientRef?.telephoneNumber) && (
                                                    <span><Phone size={12} /> {viewReceipt.manualClientDetails?.telephoneNumber || viewReceipt.clientRef?.telephoneNumber}</span>
                                                )}
                                                {(viewReceipt.manualClientDetails?.address || viewReceipt.clientRef?.address) && (
                                                    <span><MapPin size={12} /> {viewReceipt.manualClientDetails?.address || viewReceipt.clientRef?.address}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className={`cr-receipt-amount ${viewReceipt.status === 'void' ? 'is-void' : ''}`}>
                                        <span className="cr-receipt-amount-label">Amount Received</span>
                                        <span className="cr-receipt-amount-value">{CR} {fmtMoney(viewReceipt.amountReceived)}</span>
                                    </div>

                                    {viewReceipt.description && (
                                        <div className="cr-receipt-desc">
                                            <div className="cr-receipt-section-label">Purpose of Payment</div>
                                            <p>{viewReceipt.description}</p>
                                        </div>
                                    )}

                                    {viewReceipt.status === 'void' && (
                                        <div className="cr-receipt-void-note">
                                            <AlertTriangle size={14} />
                                            <div>
                                                <strong>Voided receipt</strong>
                                                <div>{viewReceipt.voidNote || 'No reason provided'}</div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="cr-receipt-footer">
                                        <span>Recorded on {fmt(viewReceipt.createdAt)}</span>
                                        <span>InvoPrint</span>
                                    </div>
                                </div>
                            </div>

                            <div className="cr-modal-actions">
                                <button className="cr-modal-btn cr-modal-btn--secondary" onClick={() => setViewReceipt(null)}>Close</button>
                                <motion.button whileTap={{ scale: 0.97 }} className="cr-modal-btn cr-modal-btn--primary" onClick={() => { handlePrint(viewReceipt); }}>
                                    <Printer size={15} /> A4 Print / PDF
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ISSUE RECEIPT MODAL */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="cr-modal-overlay">
                        <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }} className="cr-modal">
                            <div className="cr-modal-header">
                                <div className={`cr-modal-icon ${editTarget ? 'blue' : 'green'}`}>{editTarget ? <Edit3 size={18} /> : <Plus size={18} />}</div>
                                <div>
                                    <h3 className="cr-modal-title">{editTarget ? 'Edit Cash Receipt' : 'Issue Cash Receipt'}</h3>
                                    <p className="cr-modal-desc">{editTarget ? 'Update the receipt details' : 'Record cash received from a client'}</p>
                                </div>
                                <button className="cr-modal-close" onClick={() => { setShowForm(false); setEditTarget(null); }}><X size={18} /></button>
                            </div>

                            <div className="cr-modal-body">
                                <div className="cr-form-row">
                                    <label className="cr-label">Receipt Date</label>
                                    <input type="date" className="cr-input" value={form.receiptDate} onChange={e => updateForm('receiptDate', e.target.value)} />
                                </div>

                                <div className="cr-form-row">
                                    <label className="cr-label">Receipt Type</label>
                                    <div className="cr-mode-toggle">
                                        <button type="button" className={form.receiptType !== 'advance' ? 'active' : ''} onClick={() => updateForm('receiptType', 'payment')}><Banknote size={14} /> Payment</button>
                                        <button type="button" className={form.receiptType === 'advance' ? 'active' : ''} onClick={() => updateForm('receiptType', 'advance')}><AlertTriangle size={14} /> Advance</button>
                                    </div>
                                    {form.receiptType === 'advance' && (
                                        <div style={{ fontSize: '0.72rem', color: '#b45309', marginTop: '0.4rem', fontWeight: 700 }}>
                                            Advance receipts are received before a project is invoiced. It must be linked to a project and can later be selected as the advance on that project's invoice.
                                        </div>
                                    )}
                                </div>

                                <div className="cr-form-row">
                                    <label className="cr-label">Client</label>
                                    <div className="cr-mode-toggle">
                                        <button type="button" className={!form.manualMode ? 'active' : ''} onClick={() => updateForm('manualMode', false)}><Users size={14} /> Select Client</button>
                                        <button type="button" className={form.manualMode ? 'active' : ''} onClick={() => updateForm('manualMode', true)}><FileText size={14} /> Manual Entry</button>
                                    </div>
                                </div>

                                {!form.manualMode ? (
                                    <div className="cr-form-row">
                                        <select
                                            className="cr-input"
                                            value={form.clientRef}
                                            onChange={e => updateForm('clientRef', e.target.value)}
                                        >
                                            <option value="">Select a client...</option>
                                            {clients.map(c => (
                                                <option key={c._id} value={c._id}>
                                                    {[c.firstName, c.lastName].filter(Boolean).join(' ') || c.organization}{c.organization ? ` (${c.organization})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="cr-form-grid">
                                        <div className="cr-form-row">
                                            <label className="cr-label">Organization</label>
                                            <input className="cr-input" value={form.manualClientDetails.organization} onChange={e => updateForm('manualClientDetails', { ...form.manualClientDetails, organization: e.target.value })} placeholder="Company / Organization" />
                                        </div>
                                        <div className="cr-form-row">
                                            <label className="cr-label">Name</label>
                                            <input className="cr-input" value={form.manualClientDetails.name} onChange={e => updateForm('manualClientDetails', { ...form.manualClientDetails, name: e.target.value })} placeholder="Client name" />
                                        </div>
                                        <div className="cr-form-row">
                                            <label className="cr-label">Telephone</label>
                                            <input className="cr-input" value={form.manualClientDetails.telephoneNumber} onChange={e => updateForm('manualClientDetails', { ...form.manualClientDetails, telephoneNumber: e.target.value })} placeholder="Phone number" />
                                        </div>
                                        <div className="cr-form-row">
                                            <label className="cr-label">Address</label>
                                            <input className="cr-input" value={form.manualClientDetails.address} onChange={e => updateForm('manualClientDetails', { ...form.manualClientDetails, address: e.target.value })} placeholder="Address" />
                                        </div>
                                    </div>
                                )}

                                <div className="cr-form-grid">
                                    <div className="cr-form-row">
                                        <label className="cr-label">Amount Received ({CR})</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="cr-input cr-input-amount"
                                            value={form.amountReceived}
                                            max={effectiveAmountCap > 0 ? effectiveAmountCap : undefined}
                                            onChange={e => {
                                                let val = e.target.value;
                                                if (effectiveAmountCap > 0 && val && Number(val) > effectiveAmountCap) {
                                                    val = String(effectiveAmountCap);
                                                }
                                                // Clamp to at most 2 decimal places while typing
                                                if (val && val.includes('.')) {
                                                    const parts = val.split('.');
                                                    if (parts[1] && parts[1].length > 2) val = parts[0] + '.' + parts[1].slice(0, 2);
                                                }
                                                updateForm('amountReceived', val);
                                            }}
                                            onBlur={e => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val)) updateForm('amountReceived', val.toFixed(2));
                                            }}
                                            placeholder="0.00"
                                        />
                                        {effectiveAmountCap > 0 && (
                                            <div style={{ fontSize: '0.68rem', color: '#b45309', marginTop: '0.3rem', fontWeight: 600 }}>
                                                {invoiceOutstanding > 0
                                                    ? `Cannot exceed the invoice outstanding balance of ${CR} ${formatNumber(invoiceOutstanding)}`
                                                    : `Cannot exceed the project's outstanding credit of ${CR} ${formatNumber(projectCreditValue)}`
                                                }
                                            </div>
                                        )}
                                    </div>
                                    <div className="cr-form-row">
                                        <label className="cr-label">Payment Method</label>
                                        <select className="cr-input" value={form.paymentMethod} onChange={e => updateForm('paymentMethod', e.target.value)}>
                                            <option value="cash">Cash</option>
                                            <option value="cheque">Cheque</option>
                                            <option value="bank_transfer">Bank Transfer</option>
                                        </select>
                                    </div>
                                </div>

                                {form.paymentMethod === 'cheque' && (
                                    <div className="cr-form-row">
                                        <label className="cr-label">Cheque Number</label>
                                        <input
                                            type="text"
                                            className="cr-input"
                                            value={form.chequeNumber}
                                            onChange={e => updateForm('chequeNumber', e.target.value)}
                                            placeholder="Enter cheque number"
                                        />
                                    </div>
                                )}

                                <div className="cr-form-row">
                                    <label className="cr-label">Project Name</label>
                                    <select className="cr-input" value={form.projectRef} onChange={e => updateForm('projectRef', e.target.value)}>
                                        <option value="">N/A — No Project</option>
                                        {visibleProjects.map(p => (
                                            <option key={p._id} value={p._id}>{p.name} ({p.projectId})</option>
                                        ))}
                                    </select>
                                    {form.receiptType === 'payment' && projectCreditValue > 0 && (
                                        <div style={{ fontSize: '0.72rem', color: '#2563eb', marginTop: '0.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <CreditCard size={13} /> Outstanding Credit — {CR} {formatNumber(projectCreditValue)}
                                        </div>
                                    )}
                                </div>

                                <div className="cr-form-row">
                                    <label className="cr-label">Quotation</label>
                                    <select className="cr-input" value={form.quotationRef} onChange={e => {
                                        const val = e.target.value;
                                        setForm(prev => ({ ...prev, quotationRef: val }));
                                    }}>
                                        <option value="">N/A — No Quotation</option>
                                        {visibleQuotations.map(q => (
                                            <option key={q._id} value={q._id}>
                                                {q.quotationId}{q.projectId?.name ? ` — ${q.projectId.name}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="cr-form-row">
                                    <label className="cr-label">Invoice</label>
                                    {form.receiptType === 'advance' ? (
                                        <div className="cr-input" style={{ background: '#f8fafc', color: '#94a3b8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span>Not allowed for advance receipts</span>
                                            <AlertTriangle size={14} color="#f59e0b" />
                                        </div>
                                    ) : (
                                        <select className="cr-input" value={form.invoiceRef} onChange={e => {
                                            const val = e.target.value;
                                            setForm(prev => ({ ...prev, invoiceRef: val }));
                                        }}>
                                            <option value="">N/A — No Invoice</option>
                                            {visibleInvoices.map(i => (
                                                <option key={i._id} value={i._id}>
                                                    {i.invoiceNumber} — {CR} {formatNumber(i.outstandingBalance ?? 0)} due
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    {form.receiptType === 'payment' && invoiceOutstanding > 0 && (
                                        <div style={{ fontSize: '0.72rem', color: '#2563eb', marginTop: '0.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <FileText size={13} /> Invoice Balance — {CR} {formatNumber(invoiceOutstanding)}
                                        </div>
                                    )}
                                </div>

                                <div className="cr-form-row">
                                    <label className="cr-label">Purpose of Payment</label>
                                    <textarea className="cr-input cr-input-area" value={form.description} onChange={e => updateForm('description', e.target.value)} placeholder="e.g. Payment received for invoice INV00012" rows={3} />
                                </div>
                            </div>

                            <div className="cr-modal-actions">
                                <button className="cr-modal-btn cr-modal-btn--secondary" onClick={() => { setShowForm(false); setEditTarget(null); }}>Cancel</button>
                                <motion.button whileTap={{ scale: isSubmitting ? 1 : 0.97 }} className="cr-modal-btn cr-modal-btn--primary" onClick={editTarget ? handleUpdate : handleCreate} disabled={isSubmitting}>
                                    {isSubmitting ? (editTarget ? 'Saving...' : 'Issuing...') : (editTarget ? 'Save Changes' : 'Issue Receipt')}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* VOID RECEIPT MODAL */}
            <AnimatePresence>
                {voidModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="cr-modal-overlay">
                        <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }} className="cr-modal cr-modal--danger">
                            <div className="cr-modal-header">
                                <div className="cr-modal-icon red"><AlertTriangle size={18} /></div>
                                <div>
                                    <h3 className="cr-modal-title">Void Cash Receipt</h3>
                                    <p className="cr-modal-desc">This will mark the receipt as void and exclude it from collected totals.</p>
                                </div>
                                <button className="cr-modal-close" onClick={() => setVoidModal(null)}><X size={18} /></button>
                            </div>
                            <div className="cr-modal-body">
                                <div className="cr-void-info">
                                    <div><span className="cr-void-label">Receipt No:</span> <strong>{voidModal.receiptNumber}</strong></div>
                                    <div><span className="cr-void-label">Client:</span> <strong>{clientName(voidModal)}</strong></div>
                                    <div><span className="cr-void-label">Amount:</span> <strong>{CR} {fmtMoney(voidModal.amountReceived)}</strong></div>
                                </div>
                                <div className="cr-form-row">
                                    <label className="cr-label">Void Reason</label>
                                    <textarea className="cr-input cr-input-area" value={voidReason} onChange={e => setVoidReason(e.target.value)} rows={3} placeholder="Reason for voiding this receipt" />
                                </div>
                            </div>
                            <div className="cr-modal-actions">
                                <button className="cr-modal-btn cr-modal-btn--secondary" onClick={() => setVoidModal(null)}>Cancel</button>
                                <motion.button whileTap={{ scale: isSubmitting ? 1 : 0.97 }} className="cr-modal-btn cr-modal-btn--danger" onClick={handleVoid} disabled={isSubmitting}>
                                    {isSubmitting ? 'Processing...' : 'Void Receipt'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {printTarget && businessData && (
                <div className="app-print-doc" ref={printRef} style={{ position: 'fixed', left: '-9999px', top: 0, width: '0', height: '0', overflow: 'hidden' }}>
                    <CashReceiptTemplate receipt={printTarget} business={businessData} docNos={receiptDocNos(printTarget)} />
                </div>
            )}
        </div>
    );
};

export default CashReceiptManagement;