import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Banknote, Plus, Search, RefreshCw, Download, Trash2, X, FileText, AlertTriangle, Calendar, Users, Eye, Building2, Phone, MapPin, CheckCircle2, XCircle, Printer } from 'lucide-react';
import api from '../../api';
import useSubmitGuard from '../../utils/useSubmitGuard';
import { openA4PrintWindow, buildPrintFileName } from '../../utils/printDocument';
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

    const fmtMoney = (n) => {
        const num = Number(n) || 0;
        return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    };

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
        return pidMatch && cidMatch;
    });

    const resetForm = () => {
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
            receiptDate: new Date().toISOString().slice(0, 10),
            description: ''
        });
    };

    const handleCreate = async () => {
        await runGuarded(async () => {
            try {
                const payload = {
                    clientRef: !form.manualMode ? form.clientRef : null,
                    manualClientDetails: form.manualMode ? form.manualClientDetails : {},
                    amountReceived: form.amountReceived,
                    paymentMethod: form.paymentMethod,
                    chequeNumber: form.paymentMethod === 'cheque' ? (form.chequeNumber || '') : '',
                    projectRef: form.projectRef || null,
                    quotationRef: form.quotationRef || null,
                    invoiceRef: form.invoiceRef || null,
                    receiptDate: form.receiptDate ? new Date(form.receiptDate) : undefined,
                    description: form.description
                };
                const res = await api.post('/cash-receipts', payload);
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
                        <div className="cr-stat-value">Rs. {fmtMoney(stats.todayTotal)}</div>
                        <div className="cr-stat-label">Collected Today ({stats.todayCount})</div>
                    </div>
                </div>
                <div className="cr-stat-card indigo">
                    <div className="cr-stat-icon indigo"><Calendar size={22} /></div>
                    <div className="cr-stat-body">
                        <div className="cr-stat-value">Rs. {fmtMoney(stats.monthTotal)}</div>
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
                                        <td><span className="cr-badge cr-badge-id">{r.receiptNumber}</span></td>
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
                                        </td>
                                        <td className="text-right"><span className="cr-cell-amount">Rs. {fmtMoney(r.amountReceived)}</span></td>
                                        <td>
                                            <div className="cr-cell-title">{r.receivedBy ? `${r.receivedBy.firstName} ${r.receivedBy.lastName || ''}`.trim() : '—'}</div>
                                        </td>
                                        <td>
                                            <span className={`cr-badge ${r.status === 'void' ? 'cr-badge-void' : 'cr-badge-active'}`}>{r.status === 'void' ? 'Void' : 'Issued'}</span>
                                        </td>
                                        <td className="text-center">
                                            <div className="modern-table-actions" style={{ justifyContent: 'center' }}>
                                                <button type="button" className="modern-table-action view" title="View Receipt" onClick={() => setViewReceipt(r)}>
                                                    <Eye size={13} />
                                                </button>
                                                <button type="button" className="modern-table-action edit" title="Print / Download PDF" onClick={() => handlePrint(r)}>
                                                    <Download size={13} />
                                                </button>
                                                {r.status !== 'void' && (
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
                                            <span className="cr-receipt-meta-value">{viewReceipt.invoiceRef?.invoiceNumber || 'N/A'}</span>
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
                                        <span className="cr-receipt-amount-value">Rs. {fmtMoney(viewReceipt.amountReceived)}</span>
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
                                <div className="cr-modal-icon green"><Plus size={18} /></div>
                                <div>
                                    <h3 className="cr-modal-title">Issue Cash Receipt</h3>
                                    <p className="cr-modal-desc">Record cash received from a client</p>
                                </div>
                                <button className="cr-modal-close" onClick={() => setShowForm(false)}><X size={18} /></button>
                            </div>

                            <div className="cr-modal-body">
                                <div className="cr-form-row">
                                    <label className="cr-label">Receipt Date</label>
                                    <input type="date" className="cr-input" value={form.receiptDate} onChange={e => updateForm('receiptDate', e.target.value)} />
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
                                        <label className="cr-label">Amount Received (Rs.)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="cr-input cr-input-amount"
                                            value={form.amountReceived}
                                            onChange={e => updateForm('amountReceived', e.target.value)}
                                            placeholder="0.00"
                                        />
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
                                    <select className="cr-input" value={form.invoiceRef} onChange={e => {
                                        const val = e.target.value;
                                        setForm(prev => ({ ...prev, invoiceRef: val }));
                                    }}>
                                        <option value="">N/A — No Invoice</option>
                                        {visibleInvoices.map(i => (
                                            <option key={i._id} value={i._id}>
                                                {i.invoiceNumber}{i.projectId?.name ? ` — ${i.projectId.name}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="cr-form-row">
                                    <label className="cr-label">Purpose of Payment</label>
                                    <textarea className="cr-input cr-input-area" value={form.description} onChange={e => updateForm('description', e.target.value)} placeholder="e.g. Payment received for invoice INV00012" rows={3} />
                                </div>
                            </div>

                            <div className="cr-modal-actions">
                                <button className="cr-modal-btn cr-modal-btn--secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <motion.button whileTap={{ scale: isSubmitting ? 1 : 0.97 }} className="cr-modal-btn cr-modal-btn--primary" onClick={handleCreate} disabled={isSubmitting}>
                                    {isSubmitting ? 'Issuing...' : 'Issue Receipt'}
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
                                    <div><span className="cr-void-label">Amount:</span> <strong>Rs. {fmtMoney(voidModal.amountReceived)}</strong></div>
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