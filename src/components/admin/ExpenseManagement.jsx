import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Banknote, Plus, Search, RefreshCw, Trash2, X, FileText, AlertTriangle, Calendar, Eye, Printer, Edit3 } from 'lucide-react';
import api from '../../api';
import useSubmitGuard from '../../utils/useSubmitGuard';
import { openA4PrintWindow, buildPrintFileName } from '../../utils/printDocument';
import { currencyLabel, formatNumber } from '../../utils/currency';
import ExpenseVoucherTemplate from './ExpenseVoucherTemplate';
import ExpenseReportTemplate from './ExpenseReportTemplate';
import './ExpenseManagement.css';
import '../../styles/modern-table.css';

const EMPTY_STATS = { todayTotal: 0, todayCount: 0, monthTotal: 0, monthCount: 0, yearTotal: 0, voidedCount: 0 };
const EDIT_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

const emptyForm = () => ({
    name: '',
    expenseDate: new Date().toISOString().slice(0, 10),
    paidTo: '',
    billNumber: '',
    categoryName: '',
    purpose: 'office',
    projectRef: '',
    amount: '',
    paymentMethod: 'cash',
    chequeNumber: '',
    notes: ''
});

const ExpenseManagement = ({ showToast }) => {
    const [expenses, setExpenses] = useState([]);
    const [stats, setStats] = useState(EMPTY_STATS);
    const [projects, setProjects] = useState([]);
    const [businessData, setBusinessData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [purposeFilter, setPurposeFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [projectFilter, setProjectFilter] = useState('all');
    const [methodFilter, setMethodFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [viewExpense, setViewExpense] = useState(null);
    const [voidModal, setVoidModal] = useState(null);
    const [voidReason, setVoidReason] = useState('');
    const [printTarget, setPrintTarget] = useState(null);
    const [reportScope, setReportScope] = useState('base');
    const [reportPeriod, setReportPeriod] = useState('monthly');
    const [reportProjectId, setReportProjectId] = useState('');
    const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
    const [reportData, setReportData] = useState(null);
    const [reportPrintTarget, setReportPrintTarget] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const printRef = useRef(null);
    const reportPrintRef = useRef(null);
    const { isSubmitting, runGuarded } = useSubmitGuard();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (dateFrom) params.dateFrom = dateFrom;
            if (dateTo) params.dateTo = dateTo;
            if (purposeFilter !== 'all') params.purpose = purposeFilter;
            if (categoryFilter !== 'all') params.categoryName = categoryFilter;
            if (projectFilter !== 'all') params.projectId = projectFilter;
            if (methodFilter !== 'all') params.paymentMethod = methodFilter;
            if (searchTerm.trim()) params.search = searchTerm.trim();

            const [eRes, pRes, bRes] = await Promise.allSettled([
                api.get('/expenses', { params }),
                api.get('/projects'),
                api.get('/business')
            ]);

            if (eRes.status === 'fulfilled') {
                setExpenses(eRes.value.data?.data || []);
                setStats(eRes.value.data?.stats || EMPTY_STATS);
            } else {
                showToast?.(eRes.reason?.response?.data?.message || 'Error fetching expenses', 'error');
            }

            if (pRes.status === 'fulfilled') setProjects(pRes.value.data?.data || []);
            if (bRes.status === 'fulfilled' && bRes.value.data?.data?.details) {
                setBusinessData(bRes.value.data.data.details);
            }
        } catch (err) {
            showToast?.(err.response?.data?.message || 'Error fetching expenses', 'error');
        } finally {
            setLoading(false);
        }
    }, [dateFrom, dateTo, purposeFilter, categoryFilter, projectFilter, methodFilter, searchTerm, showToast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fmt = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const toDateInput = (d) => {
        if (!d) return '';
        const date = new Date(d);
        return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
    };

    const fmtMoney = (n) => formatNumber(n);
    const CR = currencyLabel(businessData?.primaryCurrency);

    const activeCategories = (businessData?.expenseCategories || []).filter(c => c.isActive === true);

    const methodLabel = (m) => String(m || 'cash').split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

    const purposeLabel = (p) => ({
        project: 'Project',
        office: 'Day-to-day office',
        asset: 'Asset purchase'
    }[p] || '—');

    const periodLabel = (p) => ({
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        yearly: 'Yearly'
    }[p] || p || '—');

    const isEditable = (expense) => expense.status !== 'void'
        && (Date.now() - new Date(expense.createdAt).getTime()) <= EDIT_WINDOW_MS;

    const projectLabel = (expense) => {
        const p = expense?.projectRef;
        if (!p) return '—';
        const client = p.client || p.clientRef;
        const clientName = client
            ? ([client.firstName, client.lastName].filter(Boolean).join(' ') || client.organization || '')
            : '';
        return clientName ? `${p.name} — ${clientName}` : p.name;
    };

    const preparedBy = (expense) => {
        const u = expense?.createdBy;
        if (!u) return '—';
        return [u.firstName, u.lastName].filter(Boolean).join(' ') || '—';
    };

    const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const resetForm = () => {
        setEditTarget(null);
        setForm(emptyForm());
    };

    const startEdit = (e) => {
        setEditTarget(e);
        setForm({
            name: e.name || '',
            expenseDate: toDateInput(e.expenseDate || e.createdAt),
            paidTo: e.paidTo || '',
            billNumber: e.billNumber || '',
            categoryName: e.categoryName || '',
            purpose: e.purpose || 'office',
            projectRef: e.projectRef?._id || e.projectRef || '',
            amount: e.amount != null ? Number(e.amount).toFixed(2) : '',
            paymentMethod: e.paymentMethod || 'cash',
            chequeNumber: e.chequeNumber || '',
            notes: e.notes || ''
        });
        setShowForm(true);
    };

    const validateForm = () => {
        if (!form.name.trim()) return showToast?.('Expense name is required', 'error'), false;
        if (!form.expenseDate) return showToast?.('Expense date is required', 'error'), false;
        if (!form.paidTo.trim()) return showToast?.('Paid to is required', 'error'), false;
        if (!form.billNumber.trim()) return showToast?.('Bill number is required', 'error'), false;
        if (!form.categoryName) return showToast?.('Select a category', 'error'), false;
        if (!(Number(form.amount) > 0)) return showToast?.('Enter an amount greater than zero', 'error'), false;
        if (form.purpose === 'project' && !form.projectRef) return showToast?.('Select a project', 'error'), false;
        if (form.paymentMethod === 'cheque' && !form.chequeNumber.trim()) return showToast?.('Cheque number is required', 'error'), false;
        return true;
    };

    const buildPayload = () => ({
        name: form.name.trim(),
        expenseDate: form.expenseDate ? new Date(form.expenseDate) : undefined,
        paidTo: form.paidTo.trim(),
        billNumber: form.billNumber.trim(),
        categoryName: form.categoryName,
        purpose: form.purpose,
        projectRef: form.purpose === 'project' ? form.projectRef : null,
        amount: form.amount,
        paymentMethod: form.paymentMethod,
        chequeNumber: form.paymentMethod === 'cheque' ? form.chequeNumber.trim() : '',
        notes: form.notes.trim()
    });

    const handleCreate = async () => {
        if (!validateForm()) return;
        await runGuarded(async () => {
            try {
                const res = await api.post('/expenses', buildPayload());
                showToast?.('Expense recorded successfully', 'success');
                setShowForm(false);
                resetForm();
                fetchData();
                return res;
            } catch (err) {
                showToast?.(err.response?.data?.message || 'Failed to record expense', 'error');
            }
        });
    };

    const handleUpdate = async () => {
        if (!validateForm()) return;
        await runGuarded(async () => {
            try {
                const res = await api.put(`/expenses/${editTarget._id}`, buildPayload());
                showToast?.('Expense updated successfully', 'success');
                setShowForm(false);
                resetForm();
                fetchData();
                return res;
            } catch (err) {
                showToast?.(err.response?.data?.message || 'Failed to update expense', 'error');
            }
        });
    };

    const handleVoid = async () => {
        if (!voidReason.trim()) return showToast?.('Void reason is required', 'error');
        await runGuarded(async () => {
            try {
                await api.delete(`/expenses/${voidModal._id}`, { data: { reason: voidReason.trim() } });
                showToast?.('Expense voided', 'success');
                setVoidModal(null);
                setVoidReason('');
                fetchData();
            } catch (err) {
                showToast?.(err.response?.data?.message || 'Failed to void expense', 'error');
            }
        });
    };

    const handlePrint = (e) => setPrintTarget(e);

    const handleGenerateReport = async () => {
        if (reportScope === 'project' && !reportProjectId) {
            return showToast?.('Select a project for the report', 'error');
        }
        await runGuarded(async () => {
            try {
                const params = { scope: reportScope, period: reportPeriod };
                if (reportScope === 'project') params.projectId = reportProjectId;
                if (reportDate) params.date = reportDate;
                const res = await api.get('/expenses/report', { params });
                const next = res.data?.data || null;
                setReportData(next);
                setReportPrintTarget(next);
                showToast?.('Expense report generated', 'success');
                return res;
            } catch (err) {
                showToast?.(err.response?.data?.message || 'Failed to generate expense report', 'error');
            }
        });
    };

    useEffect(() => {
        if (printTarget && businessData) {
            openA4PrintWindow(printRef.current, buildPrintFileName(
                printTarget.expenseNumber || 'EXP',
                printTarget.paidTo,
                printTarget.expenseDate || printTarget.createdAt
            ));
            setPrintTarget(null);
        }
    }, [printTarget, businessData]);

    useEffect(() => {
        if (reportPrintTarget && businessData) {
            openA4PrintWindow(reportPrintRef.current, buildPrintFileName(
                'EXPREPORT',
                reportPrintTarget.project?.name || 'Base',
                reportPrintTarget.dateRange?.start || reportDate
            ));
            setReportPrintTarget(null);
        }
    }, [reportPrintTarget, businessData, reportDate]);

    const breakdownRowLabel = (row) => row?.name || row?.label || row?.category || row?.purpose
        || row?.paymentMethod || row?._id || '—';

    const renderBreakdown = (title, rows) => (
        <div className="ex-report-breakdown">
            <div className="ex-report-subtitle">{title}</div>
            <table className="modern-table ex-report-table">
                <thead>
                    <tr>
                        <th>{title}</th>
                        <th className="text-center">Count</th>
                        <th className="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {(rows || []).map((row, idx) => (
                        <tr key={`${title}-${idx}`}>
                            <td><span className="ex-cell-title">{breakdownRowLabel(row)}</span></td>
                            <td className="text-center">{row.count ?? 0}</td>
                            <td className="text-right"><span className="ex-cell-amount">{CR} {fmtMoney(row.total ?? row.amount)}</span></td>
                        </tr>
                    ))}
                    {(!rows || rows.length === 0) && (
                        <tr>
                            <td colSpan={3}><div className="ex-empty">No data</div></td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="ex-root">
            <div className="ex-stats">
                <div className="ex-stat-card red">
                    <div className="ex-stat-icon red"><Banknote size={22} /></div>
                    <div className="ex-stat-body">
                        <div className="ex-stat-value">{CR} {fmtMoney(stats.todayTotal)}</div>
                        <div className="ex-stat-label">Spent Today ({stats.todayCount})</div>
                    </div>
                </div>
                <div className="ex-stat-card amber">
                    <div className="ex-stat-icon amber"><Calendar size={22} /></div>
                    <div className="ex-stat-body">
                        <div className="ex-stat-value">{CR} {fmtMoney(stats.monthTotal)}</div>
                        <div className="ex-stat-label">This Month ({stats.monthCount})</div>
                    </div>
                </div>
                <div className="ex-stat-card indigo">
                    <div className="ex-stat-icon indigo"><FileText size={22} /></div>
                    <div className="ex-stat-body">
                        <div className="ex-stat-value">{CR} {fmtMoney(stats.yearTotal)}</div>
                        <div className="ex-stat-label">This Year</div>
                    </div>
                </div>
                <div className="ex-stat-card danger">
                    <div className="ex-stat-icon danger"><AlertTriangle size={22} /></div>
                    <div className="ex-stat-body">
                        <div className="ex-stat-value">{stats.voidedCount}</div>
                        <div className="ex-stat-label">Voided Expenses</div>
                    </div>
                </div>
            </div>

            <div className="ex-card">
                <div className="ex-card-header">
                    <div className="ex-card-title">
                        <div className="ex-card-icon red"><Banknote size={22} /></div>
                        <div>
                            <h3>Expense Registry</h3>
                            <div className="ex-card-subtitle">Record and track every business outflow</div>
                        </div>
                    </div>
                    <div className="ex-card-actions">
                        <Motion.button whileTap={{ scale: 0.95 }} onClick={fetchData} className="ex-btn ex-btn-outline"><RefreshCw size={16} /></Motion.button>
                        <Motion.button whileTap={{ scale: 0.95 }} onClick={() => { resetForm(); setShowForm(true); }} className="ex-btn ex-btn-primary"><Plus size={16} /> Record Expense</Motion.button>
                    </div>
                </div>

                <div className="ex-filters-row">
                    <div className="ex-search-wrap">
                        <Search size={14} className="ex-search-icon" />
                        <input type="text" placeholder="Search name, bill no, paid to, EXP no..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="ex-search-input" />
                    </div>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="ex-filter-select" title="Date from" />
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="ex-filter-select" title="Date to" />
                    <select value={purposeFilter} onChange={e => setPurposeFilter(e.target.value)} className="ex-filter-select">
                        <option value="all">All Purposes</option>
                        <option value="project">Project</option>
                        <option value="office">Day-to-day office</option>
                        <option value="asset">Asset purchase</option>
                    </select>
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="ex-filter-select">
                        <option value="all">All Categories</option>
                        {activeCategories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                    </select>
                    <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="ex-filter-select">
                        <option value="all">All Projects</option>
                        {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                    <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} className="ex-filter-select">
                        <option value="all">All Methods</option>
                        <option value="cash">Cash</option>
                        <option value="cheque">Cheque</option>
                        <option value="bank_transfer">Bank Transfer</option>
                    </select>
                </div>

                {loading ? (
                    <div className="ex-loading"><RefreshCw className="animate-spin" size={20} /> Loading expenses...</div>
                ) : (
                    <div className="ex-table-shell">
                        <table className="modern-table ex-table">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Date</th>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Purpose</th>
                                    <th>Project</th>
                                    <th>Paid to</th>
                                    <th>Bill no</th>
                                    <th>Method</th>
                                    <th className="text-right">Amount</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map(e => (
                                    <tr key={e._id} className={e.status === 'void' ? 'ex-row-void' : ''}>
                                        <td>
                                            <span className="ex-badge ex-badge-id">{e.expenseNumber}</span>
                                            {e.status === 'void' && <span className="ex-badge ex-badge-void" style={{ marginLeft: '6px' }}>VOID</span>}
                                        </td>
                                        <td><div className="ex-cell-title">{fmt(e.expenseDate)}</div></td>
                                        <td><div className="ex-cell-title">{e.name}</div></td>
                                        <td><div className="ex-cell-title">{e.categoryName || '—'}</div></td>
                                        <td><span className={`ex-badge ex-badge-purpose ${e.purpose || ''}`}>{purposeLabel(e.purpose)}</span></td>
                                        <td>
                                            <div className="ex-cell-title">{e.projectRef?.name || '—'}</div>
                                            {(e.projectRef?.client || e.projectRef?.clientRef) && <div className="ex-cell-sub">{(() => { const c = e.projectRef.client || e.projectRef.clientRef; return [c.firstName, c.lastName].filter(Boolean).join(' ') || c.name || c.organization || ''; })()}</div>}
                                        </td>
                                        <td><div className="ex-cell-title">{e.paidTo}</div></td>
                                        <td><div className="ex-cell-title">{e.billNumber || '—'}</div></td>
                                        <td><span className={`ex-badge ex-badge-method ${e.paymentMethod || ''}`}>{methodLabel(e.paymentMethod)}</span></td>
                                        <td className="text-right"><span className="ex-cell-amount">{CR} {fmtMoney(e.amount)}</span></td>
                                        <td className="text-center">
                                            <div className="modern-table-actions" style={{ justifyContent: 'center' }}>
                                                <button type="button" className="modern-table-action view" title="View Expense" onClick={() => setViewExpense(e)}><Eye size={13} /></button>
                                                <button type="button" className="modern-table-action edit" title="Print / Download PDF" onClick={() => handlePrint(e)}><Printer size={13} /></button>
                                                {isEditable(e) && (
                                                    <button type="button" className="modern-table-action edit" title="Edit Expense" onClick={() => startEdit(e)}><Edit3 size={13} /></button>
                                                )}
                                                {isEditable(e) && (
                                                    <button type="button" className="modern-table-action delete" title="Void Expense" onClick={() => { setVoidModal(e); setVoidReason(''); }}><Trash2 size={13} /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {expenses.length === 0 && (
                                    <tr>
                                        <td colSpan={11}><div className="ex-empty">No expenses found</div></td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="ex-card ex-report-card">
                <div className="ex-card-header">
                    <div className="ex-card-title">
                        <div className="ex-card-icon amber"><FileText size={22} /></div>
                        <div>
                            <h3>Expense Report</h3>
                            <div className="ex-card-subtitle">Summarised outflows by period, category and purpose</div>
                        </div>
                    </div>
                    <div className="ex-card-actions">
                        {reportData && (
                            <Motion.button whileTap={{ scale: 0.95 }} className="ex-btn ex-btn-outline" onClick={() => setReportPrintTarget(reportData)}><Printer size={16} /> Print Report</Motion.button>
                        )}
                    </div>
                </div>

                <div className="ex-filters-row ex-report-filters">
                    <select value={reportScope} onChange={e => setReportScope(e.target.value)} className="ex-filter-select">
                        <option value="base">Base (all expenses)</option>
                        <option value="project">Project</option>
                    </select>
                    <select value={reportPeriod} onChange={e => setReportPeriod(e.target.value)} className="ex-filter-select">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                    {reportScope === 'project' && (
                        <select value={reportProjectId} onChange={e => setReportProjectId(e.target.value)} className="ex-filter-select">
                            <option value="">Select a project...</option>
                            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                    )}
                    <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="ex-filter-select" title="Report date" />
                    <Motion.button whileTap={{ scale: 0.95 }} className="ex-btn ex-btn-primary" onClick={handleGenerateReport} disabled={isSubmitting}>
                        <FileText size={16} /> Generate Report
                    </Motion.button>
                </div>

                {reportData && (
                    <div className="ex-report-body">
                        <div className="ex-report-summary">
                            <div className="ex-report-summary-item">
                                <span className="ex-report-summary-label">Report</span>
                                <strong>{reportData.title || 'Expense Report'}</strong>
                            </div>
                            <div className="ex-report-summary-item">
                                <span className="ex-report-summary-label">Period</span>
                                <strong>{periodLabel(reportData.period)}</strong>
                            </div>
                            <div className="ex-report-summary-item">
                                <span className="ex-report-summary-label">Records</span>
                                <strong>{reportData.count ?? 0}</strong>
                            </div>
                            {reportData.project && (
                                <div className="ex-report-summary-item">
                                    <span className="ex-report-summary-label">Project</span>
                                    <strong>{reportData.project.name}{reportData.project.clientName ? ` — ${reportData.project.clientName}` : ''}</strong>
                                </div>
                            )}
                            <div className="ex-report-summary-item ex-report-total">
                                <span className="ex-report-summary-label">Total Outflow</span>
                                <strong>{CR} {fmtMoney(reportData.total)}</strong>
                            </div>
                        </div>
                        {reportData.dateRange && (
                            <div className="ex-report-range">
                                {fmt(reportData.dateRange.start)} — {fmt(reportData.dateRange.end)}
                            </div>
                        )}
                        <div className="ex-report-breakdowns">
                            {renderBreakdown('Category', reportData.breakdown?.category)}
                            {renderBreakdown('Purpose', reportData.breakdown?.purpose)}
                            {renderBreakdown('Payment Method', reportData.breakdown?.paymentMethod)}
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {viewExpense && (
                    <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="ex-modal-overlay" onClick={() => setViewExpense(null)}>
                        <Motion.div
                            initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
                            className="ex-modal ex-view-modal"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="ex-modal-header">
                                <div className={`ex-modal-icon ${viewExpense.status === 'void' ? 'danger' : 'red'}`}>
                                    {viewExpense.status === 'void' ? <AlertTriangle size={18} /> : <Banknote size={18} />}
                                </div>
                                <div>
                                    <h3 className="ex-modal-title">Expense {viewExpense.expenseNumber}</h3>
                                    <p className="ex-modal-desc">Expense details & preview</p>
                                </div>
                                <button className="ex-modal-close" onClick={() => setViewExpense(null)}><X size={18} /></button>
                            </div>

                            <div className="ex-modal-body ex-view-body">
                                <div className="ex-expense-view">
                                    <div className="ex-expense-view-title">
                                        <span className="ex-expense-view-main">EXPENSE VOUCHER</span>
                                        <span className="ex-expense-view-sub">Recorded business outflow</span>
                                    </div>
                                    <div className={`ex-expense-status ${viewExpense.status === 'void' ? 'is-void' : 'is-recorded'}`}>
                                        {viewExpense.status === 'void' ? 'VOID' : 'RECORDED'}
                                    </div>
                                    <div className="ex-expense-meta">
                                        <div className="ex-expense-meta-item">
                                            <span className="ex-expense-meta-label">Expense No.</span>
                                            <span className="ex-expense-meta-value">{viewExpense.expenseNumber}</span>
                                        </div>
                                        <div className="ex-expense-meta-item">
                                            <span className="ex-expense-meta-label">Date</span>
                                            <span className="ex-expense-meta-value">{fmt(viewExpense.expenseDate)}</span>
                                        </div>
                                        <div className="ex-expense-meta-item">
                                            <span className="ex-expense-meta-label">Category</span>
                                            <span className="ex-expense-meta-value">{viewExpense.categoryName || '—'}</span>
                                        </div>
                                        <div className="ex-expense-meta-item">
                                            <span className="ex-expense-meta-label">Purpose</span>
                                            <span className="ex-expense-meta-value">{purposeLabel(viewExpense.purpose)}</span>
                                        </div>
                                        <div className="ex-expense-meta-item">
                                            <span className="ex-expense-meta-label">Paid To</span>
                                            <span className="ex-expense-meta-value">{viewExpense.paidTo}</span>
                                        </div>
                                        <div className="ex-expense-meta-item">
                                            <span className="ex-expense-meta-label">Bill No</span>
                                            <span className="ex-expense-meta-value">{viewExpense.billNumber || '—'}</span>
                                        </div>
                                        <div className="ex-expense-meta-item">
                                            <span className="ex-expense-meta-label">Project</span>
                                            <span className="ex-expense-meta-value">{projectLabel(viewExpense)}</span>
                                        </div>
                                        <div className="ex-expense-meta-item">
                                            <span className="ex-expense-meta-label">Payment Method</span>
                                            <span className="ex-expense-meta-value">{methodLabel(viewExpense.paymentMethod)}{viewExpense.paymentMethod === 'cheque' && ` — ${viewExpense.chequeNumber || '—'}`}</span>
                                        </div>
                                        <div className="ex-expense-meta-item">
                                            <span className="ex-expense-meta-label">Prepared By</span>
                                            <span className="ex-expense-meta-value">{preparedBy(viewExpense)}</span>
                                        </div>
                                    </div>

                                    <div className={`ex-expense-amount ${viewExpense.status === 'void' ? 'is-void' : ''}`}>
                                        <span className="ex-expense-amount-label">Amount Paid</span>
                                        <span className="ex-expense-amount-value">{CR} {fmtMoney(viewExpense.amount)}</span>
                                    </div>

                                    {viewExpense.notes && (
                                        <div className="ex-expense-desc">
                                            <div className="ex-expense-section-label">Notes</div>
                                            <p>{viewExpense.notes}</p>
                                        </div>
                                    )}

                                    {viewExpense.status === 'void' && (
                                        <div className="ex-expense-void-note">
                                            <AlertTriangle size={14} />
                                            <div>
                                                <strong>Voided expense</strong>
                                                <div>{viewExpense.voidNote || 'No reason provided'}</div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="ex-expense-footer">
                                        <span>Recorded on {fmt(viewExpense.createdAt)}</span>
                                        <span>InvoPrint</span>
                                    </div>
                                </div>
                            </div>

                            <div className="ex-modal-actions">
                                <button className="ex-modal-btn ex-modal-btn--secondary" onClick={() => setViewExpense(null)}>Close</button>
                                <Motion.button whileTap={{ scale: 0.97 }} className="ex-modal-btn ex-modal-btn--primary" onClick={() => handlePrint(viewExpense)}>
                                    <Printer size={15} /> A4 Print / PDF
                                </Motion.button>
                            </div>
                        </Motion.div>
                    </Motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showForm && (
                    <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="ex-modal-overlay">
                        <Motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }} className="ex-modal">
                            <div className="ex-modal-header">
                                <div className={`ex-modal-icon ${editTarget ? 'blue' : 'red'}`}>{editTarget ? <Edit3 size={18} /> : <Plus size={18} />}</div>
                                <div>
                                    <h3 className="ex-modal-title">{editTarget ? 'Edit Expense' : 'Record Expense'}</h3>
                                    <p className="ex-modal-desc">{editTarget ? 'Update the expense details' : 'Record a new business outflow'}</p>
                                </div>
                                <button className="ex-modal-close" onClick={() => { setShowForm(false); resetForm(); }}><X size={18} /></button>
                            </div>

                            <div className="ex-modal-body">
                                <div className="ex-form-grid">
                                    <div className="ex-form-row">
                                        <label className="ex-label">Expense Name</label>
                                        <input className="ex-input" value={form.name} onChange={e => updateForm('name', e.target.value)} placeholder="e.g. Office supplies" />
                                    </div>
                                    <div className="ex-form-row">
                                        <label className="ex-label">Expense Date</label>
                                        <input type="date" className="ex-input" value={form.expenseDate} onChange={e => updateForm('expenseDate', e.target.value)} />
                                    </div>
                                    <div className="ex-form-row">
                                        <label className="ex-label">Paid To</label>
                                        <input className="ex-input" value={form.paidTo} onChange={e => updateForm('paidTo', e.target.value)} placeholder="Supplier / payee name" />
                                    </div>
                                    <div className="ex-form-row">
                                        <label className="ex-label">Bill Number *</label>
                                        <input className="ex-input" required value={form.billNumber} onChange={e => updateForm('billNumber', e.target.value)} placeholder="Bill / invoice reference" />
                                    </div>
                                    <div className="ex-form-row">
                                        <label className="ex-label">Category</label>
                                        <select className="ex-input" value={form.categoryName} onChange={e => updateForm('categoryName', e.target.value)}>
                                            <option value="">Select a category...</option>
                                            {activeCategories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="ex-form-row">
                                        <label className="ex-label">Amount ({CR})</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="ex-input ex-input-amount"
                                            value={form.amount}
                                            onChange={e => updateForm('amount', e.target.value)}
                                            onBlur={e => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val)) updateForm('amount', val.toFixed(2));
                                            }}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="ex-form-row">
                                    <label className="ex-label">Purpose</label>
                                    <div className="ex-radio-group">
                                        <label className={`ex-radio-option ${form.purpose === 'project' ? 'active' : ''}`}>
                                            <input type="radio" name="ex-purpose" checked={form.purpose === 'project'} onChange={() => updateForm('purpose', 'project')} />
                                            <span>Project</span>
                                        </label>
                                        <label className={`ex-radio-option ${form.purpose === 'office' ? 'active' : ''}`}>
                                            <input type="radio" name="ex-purpose" checked={form.purpose === 'office'} onChange={() => updateForm('purpose', 'office')} />
                                            <span>Day-to-day office</span>
                                        </label>
                                        <label className={`ex-radio-option ${form.purpose === 'asset' ? 'active' : ''}`}>
                                            <input type="radio" name="ex-purpose" checked={form.purpose === 'asset'} onChange={() => updateForm('purpose', 'asset')} />
                                            <span>Asset purchase</span>
                                        </label>
                                    </div>
                                </div>

                                {form.purpose === 'project' && (
                                    <div className="ex-form-row">
                                        <label className="ex-label">Project</label>
                                        <select className="ex-input" value={form.projectRef} onChange={e => updateForm('projectRef', e.target.value)}>
                                            <option value="">Select a project...</option>
                                            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                )}

                                <div className="ex-form-grid">
                                    <div className="ex-form-row">
                                        <label className="ex-label">Payment Method</label>
                                        <select className="ex-input" value={form.paymentMethod} onChange={e => updateForm('paymentMethod', e.target.value)}>
                                            <option value="cash">Cash</option>
                                            <option value="cheque">Cheque</option>
                                            <option value="bank_transfer">Bank Transfer</option>
                                        </select>
                                    </div>
                                    {form.paymentMethod === 'cheque' && (
                                        <div className="ex-form-row">
                                            <label className="ex-label">Cheque Number</label>
                                            <input className="ex-input" value={form.chequeNumber} onChange={e => updateForm('chequeNumber', e.target.value)} placeholder="Enter cheque number" />
                                        </div>
                                    )}
                                </div>

                                <div className="ex-form-row">
                                    <label className="ex-label">Notes</label>
                                    <textarea className="ex-input ex-input-area" value={form.notes} onChange={e => updateForm('notes', e.target.value)} rows={3} placeholder="Additional details about this expense" />
                                </div>
                            </div>

                            <div className="ex-modal-actions">
                                <button className="ex-modal-btn ex-modal-btn--secondary" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
                                <Motion.button whileTap={{ scale: isSubmitting ? 1 : 0.97 }} className="ex-modal-btn ex-modal-btn--primary" onClick={editTarget ? handleUpdate : handleCreate} disabled={isSubmitting}>
                                    {isSubmitting ? (editTarget ? 'Saving...' : 'Recording...') : (editTarget ? 'Save Changes' : 'Record Expense')}
                                </Motion.button>
                            </div>
                        </Motion.div>
                    </Motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {voidModal && (
                    <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="ex-modal-overlay">
                        <Motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }} className="ex-modal ex-modal--danger">
                            <div className="ex-modal-header">
                                <div className="ex-modal-icon danger"><AlertTriangle size={18} /></div>
                                <div>
                                    <h3 className="ex-modal-title">Void Expense</h3>
                                    <p className="ex-modal-desc">This will mark the expense as void and exclude it from totals.</p>
                                </div>
                                <button className="ex-modal-close" onClick={() => setVoidModal(null)}><X size={18} /></button>
                            </div>
                            <div className="ex-modal-body">
                                <div className="ex-void-info">
                                    <div><span className="ex-void-label">Expense No:</span> <strong>{voidModal.expenseNumber}</strong></div>
                                    <div><span className="ex-void-label">Name:</span> <strong>{voidModal.name}</strong></div>
                                    <div><span className="ex-void-label">Paid To:</span> <strong>{voidModal.paidTo}</strong></div>
                                    <div><span className="ex-void-label">Amount:</span> <strong>{CR} {fmtMoney(voidModal.amount)}</strong></div>
                                </div>
                                <div className="ex-form-row">
                                    <label className="ex-label">Void Reason</label>
                                    <textarea className="ex-input ex-input-area" value={voidReason} onChange={e => setVoidReason(e.target.value)} rows={3} placeholder="Reason for voiding this expense" />
                                </div>
                            </div>
                            <div className="ex-modal-actions">
                                <button className="ex-modal-btn ex-modal-btn--secondary" onClick={() => setVoidModal(null)}>Cancel</button>
                                <Motion.button whileTap={{ scale: isSubmitting ? 1 : 0.97 }} className="ex-modal-btn ex-modal-btn--danger" onClick={handleVoid} disabled={isSubmitting}>
                                    {isSubmitting ? 'Processing...' : 'Void Expense'}
                                </Motion.button>
                            </div>
                        </Motion.div>
                    </Motion.div>
                )}
            </AnimatePresence>

            {printTarget && businessData && (
                <div className="app-print-doc" ref={printRef} style={{ position: 'fixed', left: '-9999px', top: 0, width: '0', height: '0', overflow: 'hidden' }}>
                    <ExpenseVoucherTemplate expense={printTarget} business={businessData} />
                </div>
            )}

            {reportPrintTarget && businessData && (
                <div className="app-print-doc" ref={reportPrintRef} style={{ position: 'fixed', left: '-9999px', top: 0, width: '0', height: '0', overflow: 'hidden' }}>
                    <ExpenseReportTemplate report={reportPrintTarget} business={businessData} />
                </div>
            )}
        </div>
    );
};

export default ExpenseManagement;
