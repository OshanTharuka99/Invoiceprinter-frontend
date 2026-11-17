import React, { useState, useEffect, useRef } from 'react';
import { Truck, RefreshCw, CreditCard, CalendarClock, FileText, DollarSign, CheckCircle2, AlertTriangle, ScrollText, Landmark } from 'lucide-react';
import api from '../../api';
import useSubmitGuard from '../../utils/useSubmitGuard';
import './SupplierManagement.css';
import '../../styles/modern-table.css';

const emptyForm = { amount: '', paymentMethod: 'cash', chequeNumber: '', notes: '' };

const money = (value) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const isOverdue = (value) => {
    if (!value) return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
};

const formatPeriod = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'object') {
        if (value.duration !== undefined && value.duration !== null) return `${value.duration}${value.unit ? ` ${value.unit}` : ''}`;
        return '—';
    }
    return value;
};

const SupplierCreditManagement = ({ showToast }) => {
    const [rows, setRows] = useState([]);
    const [selected, setSelected] = useState(null);
    const [detail, setDetail] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const selectedRef = useRef(null);
    const { isSubmitting, runGuarded } = useSubmitGuard();

    const fetchDetail = async (id) => {
        if (!id) return;
        setDetailLoading(true);
        try {
            const res = await api.get(`/suppliers/${id}/credit/entries`);
            setDetail(res.data?.data || null);
        } catch (error) {
            showToast?.(error.response?.data?.message || 'Failed to load supplier credit entries', 'error');
        } finally {
            setDetailLoading(false);
        }
    };

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const res = await api.get('/suppliers/credits');
            const list = Array.isArray(res.data?.data) ? res.data.data : [];
            setRows(list);
            return list;
        } catch (error) {
            showToast?.(error.response?.data?.message || 'Failed to load supplier credits', 'error');
            return [];
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const load = async () => {
            const list = await fetchSummary();
            const target = list.find((row) => Number(row.totalCredit) > 0);
            if (target?.supplier?._id) {
                selectedRef.current = target.supplier._id;
                setSelected(target.supplier._id);
                fetchDetail(target.supplier._id);
            }
        };
        load();
    }, []);

    const selectSupplier = (id) => {
        if (!id) return;
        selectedRef.current = id;
        setSelected(id);
        setForm(emptyForm);
        fetchDetail(id);
    };

    const handleRefresh = async () => {
        const list = await fetchSummary();
        if (selectedRef.current) {
            await fetchDetail(selectedRef.current);
        } else {
            const target = list.find((row) => Number(row.totalCredit) > 0);
            if (target?.supplier?._id) selectSupplier(target.supplier._id);
        }
    };

    const handlePay = async (e) => {
        e.preventDefault();
        const total = Number(detail?.totalCredit || 0);
        const amount = Number(form.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            showToast?.('Enter a payment amount greater than zero', 'error');
            return;
        }
        if (amount > total + 0.000001) {
            showToast?.('Payment amount cannot exceed the supplier credit', 'error');
            return;
        }
        if (form.paymentMethod === 'cheque' && !form.chequeNumber.trim()) {
            showToast?.('Cheque number is required', 'error');
            return;
        }

        await runGuarded(async () => {
            try {
                const payload = {
                    amount,
                    paymentMethod: form.paymentMethod,
                    chequeNumber: form.paymentMethod === 'cheque' ? form.chequeNumber.trim() : '',
                    notes: form.notes.trim(),
                };
                const res = await api.post(`/suppliers/${selected}/credit/pay`, payload);
                const expenseNumber = res.data?.data?.expenseNumber;
                showToast?.(expenseNumber ? `Payment recorded · Expense ${expenseNumber}` : 'Payment recorded successfully', 'success');
                setForm(emptyForm);
                await fetchSummary();
                await fetchDetail(selected);
            } catch (error) {
                showToast?.(error.response?.data?.message || 'Failed to record payment', 'error');
            }
        });
    };

    const visibleRows = rows.filter((row) => Number(row.totalCredit) > 0);

    return (
        <div className="pm-root">
            <div className="pm-card">
                <div className="pm-card-header">
                    <div className="pm-card-title">
                        <div className="pm-card-icon blue"><CreditCard size={22} /></div>
                        <div>
                            <h3>Supplier Credit</h3>
                            <div className="pm-card-subtitle">Review outstanding supplier credit and settle balances.</div>
                        </div>
                    </div>
                    <div className="pm-card-actions">
                        <button type="button" className="pm-btn pm-btn-outline" onClick={handleRefresh} disabled={loading}>
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="pm-loading"><RefreshCw className="animate-spin" size={20} /> Loading...</div>
                ) : rows.length === 0 ? (
                    <div className="pm-empty">No supplier credit records found</div>
                ) : (
                    <div className="modern-table-card">
                        <div className="modern-table-scroll">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Vendor</th>
                                        <th>Total Credit</th>
                                        <th>Credit Batches</th>
                                        <th>Oldest Due</th>
                                        <th className="text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleRows.map((row) => {
                                        const supplier = row.supplier || {};
                                        const total = Number(row.totalCredit || 0);
                                        const expanded = selected === supplier._id;
                                        const bank = detail?.supplier?.bankDetails || supplier.bankDetails || {};
                                        const bankItems = [
                                            { label: 'Bank', value: bank.bankName },
                                            { label: 'Branch', value: bank.branch },
                                            { label: 'Account Name', value: bank.accountName },
                                            { label: 'Account Number', value: bank.accountNumber },
                                        ];
                                        return (
                                            <React.Fragment key={supplier._id}>
                                                <tr
                                                    onClick={() => selectSupplier(supplier._id)}
                                                    style={{ cursor: 'pointer', background: expanded ? '#fffbeb' : undefined }}>
                                                    <td>
                                                        <div className="modern-table-cell-primary">
                                                            <div className="modern-table-cell-icon" style={{ background: '#fffbeb' }}><Truck size={18} color="#f59e0b" /></div>
                                                            <div>
                                                                <div className="modern-table-cell-title">{supplier.name || '—'}</div>
                                                                <span className="modern-table-cell-subtitle amber">{supplier.supplierId || '—'}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td><span className="modern-table-badge amber">Rs. {money(total)}</span></td>
                                                    <td>{Number(row.entryCount || 0)}</td>
                                                    <td>
                                                        <span className="modern-table-cell-info">
                                                            <CalendarClock size={14} color={row.oldestDueDate && isOverdue(row.oldestDueDate) ? '#ef4444' : '#94a3b8'} />
                                                            <span style={{ color: row.oldestDueDate && isOverdue(row.oldestDueDate) ? '#ef4444' : undefined, fontWeight: row.oldestDueDate ? 700 : 500 }}>
                                                                {formatDate(row.oldestDueDate)}
                                                            </span>
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <button
                                                            type="button"
                                                            title={expanded ? 'Hide credit details' : 'View credit details'}
                                                            className="modern-table-action view"
                                                            onClick={(e) => { e.stopPropagation(); selectSupplier(supplier._id); }}>
                                                            <ScrollText size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                                {expanded && (
                                                    <tr>
                                                        <td colSpan={5} style={{ padding: 0, background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                                                            <div className="sc-expanded">
                                                                <div className="sc-detail-head">
                                                                    <div className="modern-table-cell-primary">
                                                                        <div className="pm-card-icon amber"><Truck size={20} /></div>
                                                                        <div>
                                                                            <div className="modern-table-cell-title">{detail?.supplier?.name || supplier.name}</div>
                                                                            <span className="modern-table-cell-subtitle amber">{detail?.supplier?.supplierId || supplier.supplierId}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ textAlign: 'right' }}>
                                                                        <div className="pm-card-subtitle">Outstanding Credit</div>
                                                                        <div className="sc-credit-total">Rs. {money(detail?.totalCredit ?? total)}</div>
                                                                    </div>
                                                                </div>

                                                                <div className="sc-bank-grid">
                                                                    <div className="sc-bank-title"><Landmark size={15} /> Supplier Bank Information</div>
                                                                    {bankItems.some((item) => item.value) ? bankItems.map((item) => (
                                                                        <div key={item.label} className="sc-bank-item">
                                                                            <div className="sc-bank-label">{item.label}</div>
                                                                            <div className="sc-bank-value">{item.value || '—'}</div>
                                                                        </div>
                                                                    )) : (
                                                                        <div className="sc-bank-empty">Bank details not set for this supplier.</div>
                                                                    )}
                                                                </div>

                                                                {detailLoading ? (
                                                                    <div className="pm-loading"><RefreshCw className="animate-spin" size={20} /> Loading credit details...</div>
                                                                ) : !detail || !Array.isArray(detail.entries) || detail.entries.length === 0 ? (
                                                                    <div className="pm-empty">No credited products for this supplier</div>
                                                                ) : (
                                                                    <div className="modern-table-card" style={{ marginTop: '1rem' }}>
                                                                        <div className="modern-table-scroll">
                                                                            <table className="modern-table">
                                                                                <thead>
                                                                                    <tr>
                                                                                        <th>Product</th>
                                                                                        <th>Batch</th>
                                                                                        <th>Invoice</th>
                                                                                        <th>Amount</th>
                                                                                        <th>Credit Period</th>
                                                                                        <th>Due Date</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {detail.entries.map((entry) => {
                                                                                        const overdue = isOverdue(entry.creditDueDate);
                                                                                        return (
                                                                                            <tr key={entry._id}>
                                                                                                <td>
                                                                                                    <div className="modern-table-cell-primary">
                                                                                                        <div className="modern-table-cell-icon" style={{ background: '#eff6ff' }}><DollarSign size={16} color="#2563eb" /></div>
                                                                                                        <div>
                                                                                                            <div className="modern-table-cell-title">{entry.productName || '—'}</div>
                                                                                                            <span className="modern-table-cell-subtitle blue">{entry.productId || '—'}</span>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </td>
                                                                                                <td><span className="modern-table-cell-info"><FileText size={14} color="#94a3b8" />{entry.batchRef || '—'}</span></td>
                                                                                                <td>{entry.supplierInvoiceNumber || entry.expenseNumber || '—'}</td>
                                                                                                <td><span className="modern-table-cell-value amber">Rs. {money(entry.creditAmount)}</span></td>
                                                                                                <td>{formatPeriod(entry.creditPeriod)}</td>
                                                                                                <td>
                                                                                                    <span className="modern-table-cell-info" style={{ color: overdue ? '#ef4444' : undefined, fontWeight: overdue ? 700 : 500 }}>
                                                                                                        <CalendarClock size={14} color={overdue ? '#ef4444' : '#94a3b8'} />
                                                                                                        {formatDate(entry.creditDueDate)}
                                                                                                    </span>
                                                                                                    {overdue && <span className="modern-table-badge sc-overdue"><AlertTriangle size={12} /> Overdue</span>}
                                                                                                </td>
                                                                                            </tr>
                                                                                        );
                                                                                    })}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <div className="sm-form-section" style={{ margin: '1.25rem 0 0' }}>
                                                                    <div className="sm-form-section-header">
                                                                        <h4 className="sm-form-section-title">Settle Credit</h4>
                                                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>
                                                                            Maximum payable: Rs. {money(detail?.totalCredit ?? total)}
                                                                        </span>
                                                                    </div>
                                                                    <form
                                                                        onSubmit={handlePay}
                                                                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                                                                        <div className="sm-form-group" style={{ marginBottom: 0 }}>
                                                                            <label className="sm-label">Amount</label>
                                                                            <input type="number" step="0.01" min="0.01" max={detail?.totalCredit ?? total} required className="sm-input" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                                                                        </div>
                                                                        <div className="sm-form-group" style={{ marginBottom: 0 }}>
                                                                            <label className="sm-label">Payment Method</label>
                                                                            <select className="sm-input" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                                                                                <option value="cash">Cash</option>
                                                                                <option value="cheque">Cheque</option>
                                                                                <option value="bank">Bank Transfer</option>
                                                                            </select>
                                                                        </div>
                                                                        {form.paymentMethod === 'cheque' && (
                                                                            <div className="sm-form-group" style={{ marginBottom: 0 }}>
                                                                                <label className="sm-label">Cheque Number</label>
                                                                                <input type="text" required className="sm-input" placeholder="Enter cheque number" value={form.chequeNumber} onChange={(e) => setForm({ ...form, chequeNumber: e.target.value })} />
                                                                            </div>
                                                                        )}
                                                                        <div className="sm-form-group" style={{ marginBottom: 0 }}>
                                                                            <label className="sm-label">Additional Note</label>
                                                                            <textarea rows="2" className="sm-input" placeholder="Optional note" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                                                                        </div>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                            <button type="submit" disabled={isSubmitting} className="sm-btn-submit" style={{ opacity: isSubmitting ? 0.85 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                                                                                {isSubmitting ? 'Processing...' : 'Pay'}
                                                                            </button>
                                                                            {Number(detail?.totalCredit ?? total) > 0 && <CheckCircle2 size={18} color="#059669" />}
                                                                        </div>
                                                                    </form>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default SupplierCreditManagement;
