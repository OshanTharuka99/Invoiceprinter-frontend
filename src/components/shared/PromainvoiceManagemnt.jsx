import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Plus, X, Search, RefreshCw, Printer, CheckCircle,
    Trash2, Clock, AlertTriangle
} from 'lucide-react';
import api from '../../api';
import useSubmitGuard from '../../utils/useSubmitGuard';
import PriceInput from '../../utils/PriceInput';
import { calculateDocumentTotals } from '../../utils/calculateDocumentTotals';
import { openA4PrintWindow, buildPrintFileName } from '../../utils/printDocument';
import PromainvoiceTemplate from './PromainvoiceTemplate';
import './PromainvoiceManagemnt.css';
import '../../styles/modern-table.css';

const NEW_CLIENT_OPTION = '__new_client__';
const NEW_PROJECT_OPTION = '__new_project__';

const PromainvoiceManagemnt = ({ currentUser, showToast }) => {
    const [promaInvoices, setPromaInvoices] = useState([]);
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [businessData, setBusinessData] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Active');

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [creationMode, setCreationMode] = useState('automatic');
    const { isSubmitting, runGuarded } = useSubmitGuard();

    const [viewDoc, setViewDoc] = useState(null);
    const [historyDoc, setHistoryDoc] = useState(null);
    const printRef = useRef();

    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [docToCancel, setDocToCancel] = useState(null);
    const [cancelNote, setCancelNote] = useState('');

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [docToDelete, setDocToDelete] = useState(null);

    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [statusForm, setStatusForm] = useState({ status: 'Paid', note: '' });
    const [selectedForStatus, setSelectedForStatus] = useState(null);

    const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
    const [newClientForm, setNewClientForm] = useState({
        firstName: '', lastName: '', clientType: 'Person',
        telephoneNumber: '', whatsappNumber: '', address: '', emailAddress: ''
    });

    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
    const [newProjectForm, setNewProjectForm] = useState({
        name: '', client: '', location: '', startDate: '', endDate: '', value: 0
    });

    const initialForm = {
        clientRef: '',
        projectId: '',
        paymentMethod: 'cash',
        creditPeriod: { duration: 0, unit: 'days' },
        deliveryAddress: '',
        customerPO: '',
        manualClientDetails: {
            title: 'Mr', organization: '', name: '', address: '', telephoneNumber: '', emailAddress: ''
        },
        items: [],
        subTotal: 0,
        appliedDiscounts: [],
        discountTotal: 0,
        hasTax: false,
        appliedTaxes: [],
        taxTotal: 0,
        finalTotal: 0,
        currency: 'primary',
        status: 'Unpaid',
        invoiceDate: new Date().toISOString().split('T')[0]
    };
    const [form, setForm] = useState(initialForm);
    const [applyDiscountMode, setApplyDiscountMode] = useState(false);
    const [customDiscount, setCustomDiscount] = useState({ type: 'percentage', value: 0 });

    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'root';

    const fetchData = async () => {
        setLoading(true);
        try {
            const [piRes, cRes, pRes, bRes, prRes] = await Promise.all([
                api.get('/proma-invoices'),
                api.get('/clients'),
                api.get('/products'),
                api.get('/business'),
                api.get('/projects')
            ]);
            setPromaInvoices(piRes.data.data);
            setClients(cRes.data.data);
            setProducts(pRes.data.data);
            setProjects(prRes.data.data);
            if (bRes.data.data.details) setBusinessData(bRes.data.data.details);
        } catch {
            showToast?.('Error fetching proma invoice data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handlePrint = () => {
        if (!viewDoc) return;
        const docId = viewDoc.promaInvoiceNumber || 'PI';
        const clientName = viewDoc.clientRef
            ? `${viewDoc.clientRef.firstName || ''}${viewDoc.clientRef.lastName ? '_' + viewDoc.clientRef.lastName : ''}`
            : (viewDoc.manualClientDetails?.organization || viewDoc.manualClientDetails?.name || 'Client');
        openA4PrintWindow(printRef.current, buildPrintFileName(docId, clientName, viewDoc.createdAt));
    };

    const calculateTotals = calculateDocumentTotals;

    const openCreation = (mode) => {
        if (mode === 'manual' && !isAdmin) {
            showToast?.('Manual proma invoice creation is restricted to admin users', 'error');
            return;
        }
        setCreationMode(mode);

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
            items: mode === 'automatic' ? [] : []
        });
        setIsCreateModalOpen(true);
    };

    const handleAddItem = () => {
        setForm(prev => ({
            ...prev,
            items: [...prev.items, { productRef: '', manualName: '', quantity: 1, unitPrice: 0, lineTotal: 0 }]
        }));
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
            if (field === 'quantity' || field === 'unitPrice' || field === 'productRef') {
                newItems[index].lineTotal = (Number(newItems[index].quantity) || 0) * (Number(newItems[index].unitPrice) || 0);
            }
            const subTotal = newItems.reduce((acc, current) => acc + (current.lineTotal || 0), 0);
            return calculateTotals({ ...prev, items: newItems, subTotal });
        });
    };

    const removeItem = (index) => {
        setForm(prev => {
            const newItems = prev.items.filter((_, i) => i !== index);
            const subTotal = newItems.reduce((acc, current) => acc + (current.lineTotal || 0), 0);
            return calculateTotals({ ...prev, items: newItems, subTotal });
        });
    };

    const recalculateFinal = () => setForm(prev => calculateTotals(prev));

    const handleToggleTax = (e) => {
        setForm(prev => calculateTotals({ ...prev, hasTax: e.target.checked }));
    };

    const handleClientSelectChange = (value) => {
        if (value === NEW_CLIENT_OPTION) {
            setIsNewClientModalOpen(true);
            return;
        }
        const selected = clients.find(c => c._id === value);
        setForm({
            ...form,
            clientRef: value,
            manualClientDetails: selected ? {
                title: 'Mr',
                organization: selected.clientType === 'Organization' ? selected.firstName : '',
                name: selected.clientType !== 'Organization' ? `${selected.firstName} ${selected.lastName || ''}`.trim() : '',
                address: selected.address || '',
                telephoneNumber: selected.telephoneNumber || selected.whatsappNumber || '',
                emailAddress: selected.emailAddress || ''
            } : form.manualClientDetails,
            deliveryAddress: selected?.address || form.deliveryAddress
        });
    };

    const handleProjectSelectChange = (value) => {
        if (value === NEW_PROJECT_OPTION) {
            if (!form.clientRef) {
                showToast?.('Please select a client before adding a new project', 'error');
                return;
            }
            setNewProjectForm(prev => ({ ...prev, client: form.clientRef }));
            setIsNewProjectModalOpen(true);
            return;
        }
        setForm({ ...form, projectId: value });
    };

    const filteredProjectsForClient = projects.filter(
        p => !form.clientRef || p.client === form.clientRef || p.client?._id === form.clientRef
    );

    const submitPromaInvoice = async (e) => {
        e.preventDefault();
        if (form.items.length === 0) return showToast?.('Insert at least 1 item', 'error');
        if (!form.paymentMethod) return showToast?.('Select payment method', 'error');

        await runGuarded(async () => {
            try {
                const payload = { ...form, creationMethod: creationMode };
                if (payload.paymentMethod === 'cash') payload.status = 'Paid';
                await api.post('/proma-invoices', payload);
                showToast?.('Proma invoice created successfully', 'success');
                setIsCreateModalOpen(false);
                fetchData();
            } catch (err) {
                showToast?.(err.response?.data?.message || 'Failed to create proma invoice', 'error');
            }
        });
    };

    const openStatusModal = (doc) => {
        if (doc.paymentMethod === 'cash') {
            return showToast?.('Cash proma invoices are permanently marked as Paid.', 'warning');
        }
        setSelectedForStatus(doc);
        setStatusForm({ status: doc.status, note: '' });
        setIsStatusModalOpen(true);
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        await runGuarded(async () => {
            try {
                await api.patch(`/proma-invoices/${selectedForStatus._id}/status`, statusForm);
                showToast?.('Status updated successfully', 'success');
                setIsStatusModalOpen(false);
                fetchData();
                if (viewDoc && viewDoc._id === selectedForStatus._id) {
                    const res = await api.get(`/proma-invoices/${selectedForStatus._id}`);
                    setViewDoc(res.data.data);
                }
            } catch (err) {
                showToast?.(err.response?.data?.message || 'Failed to update status', 'error');
            }
        });
    };

    const openCancelModal = (doc) => {
        setDocToCancel(doc);
        setCancelNote('');
        setCancelModalOpen(true);
    };

    const confirmCancel = async () => {
        if (!cancelNote.trim()) return showToast?.('Cancellation note is required', 'error');
        await runGuarded(async () => {
            try {
                await api.put(`/proma-invoices/${docToCancel._id}/cancel`, { note: cancelNote.trim() });
                showToast?.('Proma invoice cancelled', 'success');
                setCancelModalOpen(false);
                setDocToCancel(null);
                setCancelNote('');
                fetchData();
            } catch (err) {
                showToast?.(err.response?.data?.message || 'Cancel failed', 'error');
            }
        });
    };

    const openDeleteModal = (doc) => {
        setDocToDelete(doc);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        await runGuarded(async () => {
            try {
                await api.delete(`/proma-invoices/${docToDelete._id}`);
                showToast?.('Proma invoice permanently deleted', 'success');
                setDeleteModalOpen(false);
                setDocToDelete(null);
                fetchData();
            } catch (err) {
                showToast?.(err.response?.data?.message || 'Delete failed', 'error');
            }
        });
    };

    const handleCreateClient = async (e) => {
        e.preventDefault();
        await runGuarded(async () => {
            try {
                const res = await api.post('/clients', newClientForm);
                showToast?.('Client created', 'success');
                setClients(prev => [...prev, res.data.data]);
                setForm(prev => ({ ...prev, clientRef: res.data.data._id, deliveryAddress: res.data.data.address || '' }));
                setIsNewClientModalOpen(false);
                setNewClientForm({
                    firstName: '', lastName: '', clientType: 'Person',
                    telephoneNumber: '', whatsappNumber: '', address: '', emailAddress: ''
                });
            } catch (err) {
                showToast?.(err.response?.data?.message || 'Failed to create client', 'error');
            }
        });
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        await runGuarded(async () => {
            try {
                const res = await api.post('/projects', newProjectForm);
                showToast?.('Project created', 'success');
                setProjects(prev => [...prev, res.data.data]);
                setForm(prev => ({ ...prev, projectId: res.data.data._id }));
                setIsNewProjectModalOpen(false);
                setNewProjectForm({ name: '', client: '', location: '', startDate: '', endDate: '', value: 0 });
            } catch (err) {
                showToast?.(err.response?.data?.message || 'Failed to create project', 'error');
            }
        });
    };

    const getClientLabel = (doc) => {
        if (doc.clientRef) {
            return doc.clientRef.clientType === 'Organization'
                ? doc.clientRef.firstName
                : `${doc.clientRef.firstName || ''} ${doc.clientRef.lastName || ''}`.trim();
        }
        return doc.manualClientDetails?.organization || doc.manualClientDetails?.name || 'Unknown';
    };

    const filtered = promaInvoices.filter(doc => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
            doc.promaInvoiceNumber?.toLowerCase().includes(term) ||
            getClientLabel(doc).toLowerCase().includes(term);
        const isCancelled = doc.status === 'Cancelled';
        const matchesTab = activeTab === 'Active' ? !isCancelled : isCancelled;
        return matchesSearch && matchesTab;
    });

    const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#64748b', marginBottom: '0.6rem', textTransform: 'uppercase' };
    const inputStyle = { width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '0.8rem 1.25rem', color: '#0f172a', outline: 'none', fontWeight: 600, boxSizing: 'border-box' };
    const sym = businessData?.primaryCurrency?.symbol || 'Rs.';

    const statusBadgeClass = (status) => {
        if (status === 'Paid') return 'im-badge im-badge-paid';
        if (status === 'Pending') return 'im-badge im-badge-pending';
        if (status === 'Cancelled') return 'im-badge im-badge-rejected';
        return 'im-badge im-badge-unpaid';
    };

    return (
        <div className="im-root">
            {loading ? (
                <div className="im-loading"><RefreshCw className="animate-spin" color="#64748b" /></div>
            ) : (
                <div className="im-card">
                    <div className="im-card-header">
                        <div className="im-card-title">
                            <div className="im-card-icon indigo"><FileText size={22} /></div>
                            <div>
                                <h3>Proma Invoice</h3>
                                <div className="im-card-subtitle">Proforma / estimate documents — no stock or warranty impact.</div>
                            </div>
                        </div>
                        <div className="im-card-actions">
                            <div className="im-search-wrap">
                                <Search size={16} className="im-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search PI00000 or Client..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="im-search-input"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '12px', alignItems: 'center' }}>
                                <button type="button" onClick={() => setActiveTab('Active')} style={{ padding: '6px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', background: activeTab === 'Active' ? '#fff' : 'transparent', color: activeTab === 'Active' ? '#0f172a' : '#64748b', boxShadow: activeTab === 'Active' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Active</button>
                                <button type="button" onClick={() => setActiveTab('Cancelled')} style={{ padding: '6px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', background: activeTab === 'Cancelled' ? '#fff' : 'transparent', color: activeTab === 'Cancelled' ? '#ef4444' : '#64748b', boxShadow: activeTab === 'Cancelled' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Cancelled</button>
                            </div>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => openCreation('automatic')} className="im-btn im-btn-primary"><Plus size={18} /> Automatic</motion.button>
                            {isAdmin && (
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => openCreation('manual')} className="im-btn im-btn-outline"><Plus size={18} /> Manual</motion.button>
                            )}
                        </div>
                    </div>

                    <div className="modern-table-card">
                        <div className="modern-table-scroll">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Document No</th>
                                        <th>Client</th>
                                        <th>Date</th>
                                        <th className="text-right">Amount</th>
                                        <th className="text-center">Status</th>
                                        <th className="text-center" style={{ width: '200px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(doc => (
                                        <tr key={doc._id}>
                                            <td>
                                                <div className="modern-table-cell-primary">
                                                    <div style={{ fontWeight: 800, color: '#4f46e5', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{doc.promaInvoiceNumber}</div>
                                                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'capitalize' }}>{doc.creationMethod}</span>
                                                </div>
                                            </td>
                                            <td>{getClientLabel(doc)}</td>
                                            <td>{new Date(doc.invoiceDate || doc.createdAt).toLocaleDateString()}</td>
                                            <td className="text-right">
                                                <span style={{ fontWeight: 800, color: '#059669', fontSize: '0.95rem' }}>
                                                    {sym} {parseFloat(doc.finalTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <span
                                                    onClick={() => doc.status !== 'Cancelled' && openStatusModal(doc)}
                                                    className={statusBadgeClass(doc.status)}
                                                    style={{ cursor: doc.paymentMethod === 'cash' || doc.status === 'Cancelled' ? 'default' : 'pointer' }}
                                                    title={doc.status === 'Cancelled' ? 'Cancelled' : doc.paymentMethod === 'cash' ? 'Cash — status locked Paid' : 'Click to update status'}
                                                >{doc.status}</span>
                                            </td>
                                            <td>
                                                <div className="modern-table-actions">
                                                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setViewDoc(doc)} className="modern-table-action view" title="View / Print"><Printer size={14} /></motion.button>
                                                    {isAdmin && (
                                                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setHistoryDoc(doc)} className="modern-table-action history" title="Status History"><Clock size={14} /></motion.button>
                                                    )}
                                                    {doc.status !== 'Cancelled' && (
                                                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => openCancelModal(doc)} className="modern-table-action delete" title="Cancel"><AlertTriangle size={14} /></motion.button>
                                                    )}
                                                    {isAdmin && (
                                                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => openDeleteModal(doc)} className="modern-table-action delete" title="Delete permanently"><Trash2 size={14} /></motion.button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && (
                                        <tr><td colSpan="6"><div className="im-empty">No proma invoices found.</div></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE MODAL */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="im-overlay">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="im-modal im-modal-lg">
                            <div className="im-modal-header">
                                <div className="im-modal-title-row">
                                    <div>
                                        <h2>Create Proma Invoice [{creationMode.toUpperCase()}]</h2>
                                        <div className="im-modal-subtitle">Informational estimate — does not affect stock or warranties</div>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="im-modal-close"><X size={18} /></button>
                            </div>

                            <form onSubmit={submitPromaInvoice} className="im-form">
                                <div className="im-section">
                                    <h4>1. Client & Project</h4>
                                    <div className="im-form-row im-form-row-2">
                                        <div>
                                            <label className="im-label">Client</label>
                                            <select value={form.clientRef} onChange={e => handleClientSelectChange(e.target.value)} className="im-select-input">
                                                <option value="">Manual / walk-in client</option>
                                                {clients.map(c => (
                                                    <option key={c._id} value={c._id}>
                                                        {c.clientType === 'Organization' ? c.firstName : `${c.firstName} ${c.lastName || ''}`} ({c.clientId})
                                                    </option>
                                                ))}
                                                <option disabled>────────────────────</option>
                                                <option value={NEW_CLIENT_OPTION}>+ Add New Client...</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="im-label">Project (optional)</label>
                                            <select value={form.projectId} onChange={e => handleProjectSelectChange(e.target.value)} className="im-select-input">
                                                <option value="">None</option>
                                                {filteredProjectsForClient.map(p => (
                                                    <option key={p._id} value={p._id}>{p.name} ({p.projectId})</option>
                                                ))}
                                                <option disabled>────────────────────</option>
                                                <option value={NEW_PROJECT_OPTION}>+ Add New Project...</option>
                                            </select>
                                        </div>
                                    </div>

                                    {!form.clientRef && (
                                        <div className="im-form-row im-form-row-3" style={{ marginTop: '1rem' }}>
                                            <div>
                                                <label className="im-label">Title</label>
                                                <select value={form.manualClientDetails.title} onChange={e => setForm({ ...form, manualClientDetails: { ...form.manualClientDetails, title: e.target.value } })} className="im-select-input">
                                                    <option value="Mr">Mr.</option>
                                                    <option value="Mrs">Mrs.</option>
                                                    <option value="Miss">Miss</option>
                                                    <option value="Ms">Ms.</option>
                                                    <option value="Organization">Organization</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="im-label">Name / Organization</label>
                                                <input required value={form.manualClientDetails.name} onChange={e => setForm({ ...form, manualClientDetails: { ...form.manualClientDetails, name: e.target.value } })} className="im-input" />
                                            </div>
                                            <div>
                                                <label className="im-label">Contact</label>
                                                <input value={form.manualClientDetails.telephoneNumber} onChange={e => setForm({ ...form, manualClientDetails: { ...form.manualClientDetails, telephoneNumber: e.target.value } })} className="im-input" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="im-section">
                                    <h4>2. Payment & Delivery</h4>
                                    <div className="im-form-row im-form-row-3">
                                        <div>
                                            <label className="im-label">Payment Method</label>
                                            <select value={form.paymentMethod} onChange={e => {
                                                const val = e.target.value;
                                                setForm({ ...form, paymentMethod: val, status: val === 'cash' ? 'Paid' : form.status });
                                            }} className="im-select-input">
                                                <option value="cash">Cash</option>
                                                <option value="cheque">Cheque</option>
                                                <option value="bank_transfer">Bank Transfer</option>
                                                <option value="credit">Credit</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="im-label">Document Date</label>
                                            <input type="date" value={form.invoiceDate} onChange={e => setForm({ ...form, invoiceDate: e.target.value })} className="im-input" />
                                        </div>
                                        <div>
                                            <label className="im-label">Customer PO</label>
                                            <input value={form.customerPO} onChange={e => setForm({ ...form, customerPO: e.target.value })} className="im-input" placeholder="Optional" />
                                        </div>
                                    </div>
                                    {form.paymentMethod === 'credit' && (
                                        <div className="im-form-row im-form-row-2" style={{ marginTop: '1rem' }}>
                                            <div>
                                                <label className="im-label">Credit Duration</label>
                                                <input type="number" min="0" value={form.creditPeriod.duration} onChange={e => setForm({ ...form, creditPeriod: { ...form.creditPeriod, duration: parseInt(e.target.value, 10) || 0 } })} className="im-input" />
                                            </div>
                                            <div>
                                                <label className="im-label">Unit</label>
                                                <select value={form.creditPeriod.unit} onChange={e => setForm({ ...form, creditPeriod: { ...form.creditPeriod, unit: e.target.value } })} className="im-select-input">
                                                    <option value="days">Days</option>
                                                    <option value="weeks">Weeks</option>
                                                    <option value="months">Months</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                    <div style={{ marginTop: '1rem' }}>
                                        <label className="im-label">Delivery Address</label>
                                        <input value={form.deliveryAddress} onChange={e => setForm({ ...form, deliveryAddress: e.target.value })} className="im-input" placeholder="Optional" />
                                    </div>
                                </div>

                                <div className="im-section">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ margin: 0 }}>3. Line Items</h4>
                                        <button type="button" onClick={handleAddItem} className="im-btn im-btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}><Plus size={14} /> Add Item</button>
                                    </div>

                                    {form.items.map((item, idx) => (
                                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: creationMode === 'automatic' ? '2fr 80px 120px 120px 40px' : '2fr 80px 120px 120px 40px', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'end' }}>
                                            {creationMode === 'automatic' ? (
                                                <select value={item.productRef} onChange={e => updateItem(idx, 'productRef', e.target.value)} className="im-select-input" required>
                                                    <option value="" disabled>Select product...</option>
                                                    {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.productId})</option>)}
                                                </select>
                                            ) : (
                                                <input placeholder="Item description" value={item.manualName} onChange={e => updateItem(idx, 'manualName', e.target.value)} className="im-input" required />
                                            )}
                                            <input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)} className="im-input" />
                                            <PriceInput value={item.unitPrice} onChange={v => updateItem(idx, 'unitPrice', v)} disabled={creationMode === 'automatic' && !!item.productRef} style={{ ...inputStyle, padding: '0.7rem 0.95rem 0.7rem 2rem', textAlign: 'right' }} required />
                                            <div style={{ fontWeight: 800, textAlign: 'right', padding: '0.7rem 0' }}>{sym} {(item.lineTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                                            <button type="button" onClick={() => removeItem(idx)} style={{ background: '#fee2e2', border: 'none', borderRadius: '8px', color: '#dc2626', cursor: 'pointer', height: '40px' }}><X size={16} /></button>
                                        </div>
                                    ))}

                                    {form.items.length === 0 && (
                                        <div className="im-empty" style={{ padding: '1.5rem' }}>Add at least one line item.</div>
                                    )}
                                </div>

                                {/* Discounts */}
                                <div className="im-section">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ margin: 0 }}>4. Discounts</h4>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem' }}>
                                            <input type="checkbox" checked={applyDiscountMode} onChange={e => setApplyDiscountMode(e.target.checked)} />
                                            Apply discount
                                        </label>
                                    </div>
                                    {applyDiscountMode && (
                                        <>
                                            {(businessData?.discountProfiles || []).map((profile, i) => {
                                                const applied = form.appliedDiscounts.some(d => d.name === profile.name);
                                                return (
                                                    <div key={i} className={`im-discount-row${applied ? ' applied' : ''}${form.subTotal < (profile.minBillAmount || 0) ? ' disabled' : ''}`}>
                                                        <input type="checkbox" checked={applied} disabled={form.subTotal < (profile.minBillAmount || 0)}
                                                            onChange={e => {
                                                                let discounts = [...form.appliedDiscounts];
                                                                if (e.target.checked) {
                                                                    discounts.push({ name: profile.name, type: profile.type, value: profile.value, amount: 0 });
                                                                } else {
                                                                    discounts = discounts.filter(d => d.name !== profile.name);
                                                                }
                                                                setForm(prev => calculateTotals({ ...prev, appliedDiscounts: discounts }));
                                                            }} />
                                                        <span style={{ flex: 1, fontWeight: 700, fontSize: '0.85rem' }}>{profile.name} ({profile.type === 'percentage' ? profile.value + '%' : sym + profile.value})</span>
                                                    </div>
                                                );
                                            })}
                                            <div className="im-discount-row">
                                                <select value={customDiscount.type} onChange={e => setCustomDiscount({ ...customDiscount, type: e.target.value })} className="im-select-input" style={{ width: '120px' }}>
                                                    <option value="percentage">%</option>
                                                    <option value="fixed">Fixed</option>
                                                </select>
                                                <input type="number" min="0" value={customDiscount.value} onChange={e => setCustomDiscount({ ...customDiscount, value: parseFloat(e.target.value) || 0 })} className="im-input" style={{ width: '100px' }} />
                                                <button type="button" onClick={() => {
                                                    if (customDiscount.value <= 0) return;
                                                    const discounts = [...form.appliedDiscounts, { name: 'Custom', ...customDiscount, amount: 0 }];
                                                    setForm(prev => calculateTotals({ ...prev, appliedDiscounts: discounts }));
                                                }} className="im-btn im-btn-outline" style={{ padding: '6px 12px' }}>Add</button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Tax */}
                                <div className="im-section">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                                        <input type="checkbox" checked={form.hasTax} onChange={handleToggleTax} />
                                        Apply taxes
                                    </label>
                                    {form.hasTax && form.appliedTaxes.map((tax, i) => (
                                        <div key={i} style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                                            {tax.name}: {tax.type === 'percentage' ? `${tax.value}%` : `${sym}${tax.value}`} → {sym} {(tax.amount || 0).toFixed(2)}
                                        </div>
                                    ))}
                                </div>

                                {form.paymentMethod !== 'cash' && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label className="im-label">Initial Status</label>
                                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="im-select-input" style={{ maxWidth: '200px' }}>
                                            <option value="Unpaid">Unpaid</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Paid">Paid</option>
                                        </select>
                                    </div>
                                )}

                                <div className="im-total-bar">
                                    <div className="im-total-label">Final Total</div>
                                    <div className="im-total-value">{sym} {form.finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                                </div>

                                <button type="submit" disabled={isSubmitting} className="im-btn im-btn-success im-btn-full">
                                    {isSubmitting ? <RefreshCw size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                                    {isSubmitting ? 'Creating...' : 'Create Proma Invoice'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* VIEW / PRINT */}
            <AnimatePresence>
                {viewDoc && (
                    <div className="im-overlay" style={{ zIndex: 1100 }}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '900px', maxHeight: '95vh', overflow: 'auto', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', position: 'sticky', top: 0, background: '#fff', zIndex: 2, paddingBottom: '0.5rem' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontWeight: 900 }}>{viewDoc.promaInvoiceNumber}</h2>
                                    <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>Proma Invoice preview</p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button type="button" onClick={handlePrint} className="im-btn im-btn-primary"><Printer size={16} /> A4 Print</button>
                                    <button type="button" onClick={() => setViewDoc(null)} className="im-modal-close"><X size={18} /></button>
                                </div>
                            </div>
                            <PromainvoiceTemplate ref={printRef} promaInvoice={viewDoc} business={businessData} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* STATUS MODAL */}
            <AnimatePresence>
                {isStatusModalOpen && (
                    <div className="im-overlay">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="im-modal im-modal-sm">
                            <h2 className="im-confirm-title">Update Status</h2>
                            <p className="im-confirm-msg">{selectedForStatus?.promaInvoiceNumber}</p>
                            <form onSubmit={handleUpdateStatus} className="im-form">
                                <select value={statusForm.status} onChange={e => setStatusForm({ ...statusForm, status: e.target.value })} className="im-select-input">
                                    <option value="Unpaid">Unpaid</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Paid">Paid</option>
                                </select>
                                <input value={statusForm.note} onChange={e => setStatusForm({ ...statusForm, note: e.target.value })} placeholder="Optional note" className="im-input" />
                                <div className="im-confirm-actions">
                                    <button type="button" onClick={() => setIsStatusModalOpen(false)} className="im-abort-btn">Cancel</button>
                                    <button type="submit" disabled={isSubmitting} className="im-btn im-btn-primary" style={{ justifyContent: 'center' }}>Save</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* CANCEL MODAL */}
            <AnimatePresence>
                {cancelModalOpen && (
                    <div className="im-overlay">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="im-modal im-modal-sm">
                            <div className="im-confirm-icon"><AlertTriangle size={40} color="#f59e0b" /></div>
                            <h2 className="im-confirm-title">Cancel Proma Invoice</h2>
                            <p className="im-confirm-msg">{docToCancel?.promaInvoiceNumber} — this does not restore stock or affect warranties.</p>
                            <textarea value={cancelNote} onChange={e => setCancelNote(e.target.value)} placeholder="Reason for cancellation..." className="im-input" rows={3} style={{ marginBottom: '1rem' }} />
                            <div className="im-confirm-actions">
                                <button type="button" onClick={() => setCancelModalOpen(false)} className="im-abort-btn">Back</button>
                                <button type="button" onClick={confirmCancel} disabled={isSubmitting} className="im-confirm-danger-btn">Cancel Document</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* DELETE MODAL (admin) */}
            <AnimatePresence>
                {deleteModalOpen && (
                    <div className="im-overlay">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="im-modal im-modal-sm">
                            <div className="im-confirm-icon"><Trash2 size={40} color="#dc2626" /></div>
                            <h2 className="im-confirm-title">Delete Permanently</h2>
                            <p className="im-confirm-msg">Remove {docToDelete?.promaInvoiceNumber} from the database? This cannot be undone.</p>
                            <div className="im-confirm-actions">
                                <button type="button" onClick={() => setDeleteModalOpen(false)} className="im-abort-btn">Back</button>
                                <button type="button" onClick={confirmDelete} disabled={isSubmitting} className="im-confirm-danger-btn">Delete</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* STATUS HISTORY */}
            <AnimatePresence>
                {historyDoc && (
                    <div className="im-overlay">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="im-modal im-modal-md">
                            <div className="im-modal-header">
                                <h2>Status History — {historyDoc.promaInvoiceNumber}</h2>
                                <button type="button" onClick={() => setHistoryDoc(null)} className="im-modal-close"><X size={18} /></button>
                            </div>
                            {(historyDoc.statusHistory || []).slice().reverse().map((entry, i) => (
                                <div key={i} style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
                                    <div style={{ fontWeight: 800 }}>{entry.status}</div>
                                    {entry.note && <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{entry.note}</div>}
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                        {entry.editedBy ? `${entry.editedBy.firstName || ''} ${entry.editedBy.lastName || ''}` : 'System'} · {new Date(entry.editedAt).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* NEW CLIENT */}
            <AnimatePresence>
                {isNewClientModalOpen && (
                    <div className="im-overlay" style={{ zIndex: 1200 }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="im-modal im-modal-md">
                            <div className="im-modal-header">
                                <h2>Add Client</h2>
                                <button type="button" onClick={() => setIsNewClientModalOpen(false)} className="im-modal-close"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleCreateClient} className="im-form">
                                <div className="im-form-row im-form-row-2">
                                    <input required placeholder="First name / Org name" value={newClientForm.firstName} onChange={e => setNewClientForm({ ...newClientForm, firstName: e.target.value })} className="im-input" />
                                    <input placeholder="Last name" value={newClientForm.lastName} onChange={e => setNewClientForm({ ...newClientForm, lastName: e.target.value })} className="im-input" />
                                </div>
                                <input placeholder="Telephone" value={newClientForm.telephoneNumber} onChange={e => setNewClientForm({ ...newClientForm, telephoneNumber: e.target.value })} className="im-input" />
                                <input placeholder="Address" value={newClientForm.address} onChange={e => setNewClientForm({ ...newClientForm, address: e.target.value })} className="im-input" />
                                <button type="submit" disabled={isSubmitting} className="im-btn im-btn-primary im-btn-full">Create Client</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* NEW PROJECT */}
            <AnimatePresence>
                {isNewProjectModalOpen && (
                    <div className="im-overlay" style={{ zIndex: 1200 }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="im-modal im-modal-md">
                            <div className="im-modal-header">
                                <h2>Add Project</h2>
                                <button type="button" onClick={() => setIsNewProjectModalOpen(false)} className="im-modal-close"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleCreateProject} className="im-form">
                                <input required placeholder="Project name" value={newProjectForm.name} onChange={e => setNewProjectForm({ ...newProjectForm, name: e.target.value })} className="im-input" />
                                <input placeholder="Location" value={newProjectForm.location} onChange={e => setNewProjectForm({ ...newProjectForm, location: e.target.value })} className="im-input" />
                                <button type="submit" disabled={isSubmitting} className="im-btn im-btn-primary im-btn-full">Create Project</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PromainvoiceManagemnt;
