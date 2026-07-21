import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RefreshCw, Search, Plus, X, Printer, Wrench, FileSearch,
    UserPlus, MessageSquare, Replace, Shield, Trash2, Clock,
} from 'lucide-react';
import api from '../../api';
import useSubmitGuard from '../../utils/useSubmitGuard';
import { openA4PrintWindow, buildPrintFileName } from '../../utils/printDocument';
import '../../styles/modern-table.css';
import '../../styles/print-preview.css';
import RmaTemplate from './RmaTemplate';

const inputStyle = {
    width: '100%', background: '#f9fafb', border: '1.5px solid #e2e8f0', borderRadius: '10px',
    padding: '0.7rem 0.95rem', color: '#0f172a', fontSize: '0.875rem', fontWeight: 600,
    outline: 'none', boxSizing: 'border-box',
};
const labelStyle = {
    fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase',
    letterSpacing: '0.06em', marginBottom: '0.35rem', display: 'block',
};

const STATUS_OPTIONS = ['Open', 'In Progress', 'Awaiting Supplier', 'Resolved', 'Closed', 'Cancelled'];

const RmaManagement = ({ currentUser, showToast }) => {
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'root';
    const { isSubmitting, runGuarded } = useSubmitGuard();
    const printRef = useRef();

    const [jobs, setJobs] = useState([]);
    const [users, setUsers] = useState([]);
    const [businessData, setBusinessData] = useState(null);
    const [faultyDevices, setFaultyDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Active');
    const [viewTab, setViewTab] = useState('jobs'); // jobs | faulty

    const [createOpen, setCreateOpen] = useState(false);
    const [lookupSerial, setLookupSerial] = useState('');
    const [lookupData, setLookupData] = useState(null);
    const [lookupLoading, setLookupLoading] = useState(false);

    const [customerDetails, setCustomerDetails] = useState({
        name: '', telephoneNumber: '', emailAddress: '', idCardNumber: '', destination: '', address: '',
    });
    const [projectDetails, setProjectDetails] = useState({ projectId: '', name: '', location: '' });
    const [supplierDetails, setSupplierDetails] = useState({
        name: '', telephoneNumber: '', emailAddress: '', address: '',
    });
    const [selectedAssignees, setSelectedAssignees] = useState([]);
    const [faultComment, setFaultComment] = useState('');

    const [viewRma, setViewRma] = useState(null);
    const [statusOpen, setStatusOpen] = useState(false);
    const [statusNote, setStatusNote] = useState('');
    const [statusValue, setStatusValue] = useState('In Progress');
    const [diagnosis, setDiagnosis] = useState('');

    const [replaceOpen, setReplaceOpen] = useState(false);
    const [replaceForm, setReplaceForm] = useState({
        source: 'stock', newSerialNumber: '', newWarrantyPeriod: '', warrantyNa: false,
    });

    const [signOpen, setSignOpen] = useState(false);
    const [signForm, setSignForm] = useState({ customerName: '', idCardNumber: '', destination: '' });

    const [assignOpen, setAssignOpen] = useState(false);
    const [extraAssignees, setExtraAssignees] = useState([]);

    const [removeFaulty, setRemoveFaulty] = useState(null);
    const [removeNote, setRemoveNote] = useState('');
    const [detailLoading, setDetailLoading] = useState(false);

    const fetchAll = async ({ quiet = false } = {}) => {
        if (!quiet) setLoading(true);
        try {
            const reqs = [
                api.get('/rma?light=true'),
                api.get('/rma/users'),
                api.get('/business'),
            ];
            if (isAdmin) reqs.push(api.get('/rma/faulty'));
            const results = await Promise.all(reqs);
            setJobs(results[0].data.data || []);
            setUsers(results[1].data.data || []);
            setBusinessData(results[2].data?.data?.details || null);
            if (isAdmin) setFaultyDevices(results[3]?.data?.data || []);
        } catch (err) {
            showToast?.(err.response?.data?.message || 'Failed to load RMA data', 'error');
        } finally {
            if (!quiet) setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const filteredJobs = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return jobs.filter((j) => {
            // Closed tab = jobs that have ended (Resolved / Closed / Cancelled)
            const isEnded = j.status === 'Cancelled' || j.status === 'Closed' || j.status === 'Resolved';
            const matchesTab = activeTab === 'Active' ? !isEnded : isEnded;
            if (!matchesTab) return false;
            const customerName = j.customerDetails?.name
                || (j.clientRef ? `${j.clientRef.firstName || ''} ${j.clientRef.lastName || ''}`.trim() : '')
                || '';
            const productName = j.productName || j.productRef?.name || '';
            return (
                (j.jobNumber || '').toLowerCase().includes(term)
                || (j.serialNumber || '').toLowerCase().includes(term)
                || customerName.toLowerCase().includes(term)
                || productName.toLowerCase().includes(term)
            );
        });
    }, [jobs, searchTerm, activeTab]);

    const handleLookup = async () => {
        if (!lookupSerial.trim()) return showToast?.('Enter serial number', 'error');
        setLookupLoading(true);
        try {
            const res = await api.get(`/rma/lookup/${encodeURIComponent(lookupSerial.trim())}`);
            const data = res.data.data;
            setLookupData(data);

            const c = data.client;
            setCustomerDetails({
                name: c
                    ? (c._manual ? (c.firstName || '') : `${c.firstName || ''} ${c.lastName || ''}`.trim())
                    : '',
                telephoneNumber: c?.telephoneNumber || c?.whatsappNumber || '',
                emailAddress: c?.emailAddress || '',
                idCardNumber: '',
                destination: data.project?.location || '',
                address: c?.address || '',
            });
            setProjectDetails({
                projectId: data.project?.projectId || '',
                name: data.project?.name || '',
                location: data.project?.location || '',
            });
            setSupplierDetails({
                name: data.supplier?.name || '',
                telephoneNumber: data.supplier?.telephoneNumber || '',
                emailAddress: data.supplier?.emailAddress || '',
                address: data.supplier?.address || '',
            });

            if (data.openRma) {
                showToast?.(`Open RMA exists: ${data.openRma.jobNumber}`, 'error');
            } else {
                showToast?.(
                    data.warrantyFound
                        ? (data.underWarranty ? 'Under warranty' : 'Warranty found but expired / inactive')
                        : 'No warranty record for this serial',
                    data.underWarranty ? 'success' : 'error',
                );
            }
        } catch (err) {
            setLookupData(null);
            showToast?.(err.response?.data?.message || 'Lookup failed', 'error');
        } finally {
            setLookupLoading(false);
        }
    };

    const toggleAssignee = (id, list, setter) => {
        const sid = String(id);
        if (list.includes(sid)) setter(list.filter((x) => x !== sid));
        else setter([...list, sid]);
    };

    const submitCreate = async () => {
        if (!lookupData) return showToast?.('Lookup serial first', 'error');
        if (!faultComment.trim()) return showToast?.('Fault comment is required', 'error');
        if (selectedAssignees.length === 0) return showToast?.('Assign at least one user', 'error');

        await runGuarded(async () => {
            try {
                const payload = {
                    serialNumber: lookupData.serialNumber,
                    productRef: lookupData.product?._id || null,
                    warrantyRef: lookupData.warranty?._id || null,
                    underWarranty: !!lookupData.underWarranty,
                    warrantyPeriod: lookupData.warranty?.warrantyPeriod || '',
                    warrantyStartDate: lookupData.warranty?.startDate || null,
                    warrantyExpiryDate: lookupData.warranty?.expiryDate || null,
                    invoiceRef: lookupData.invoiceRef || null,
                    invoiceNumber: lookupData.invoiceNumber || '',
                    clientRef: lookupData.client && !lookupData.client._manual ? lookupData.client._id : null,
                    customerDetails,
                    projectRef: lookupData.project?._id || null,
                    projectDetails,
                    supplierRef: lookupData.supplier?._id || null,
                    supplierDetails,
                    assignees: selectedAssignees,
                    faultComment,
                    terms: businessData?.rmaTerms || '',
                    notes: businessData?.rmaNotes || '',
                };
                const res = await api.post('/rma', payload);
                showToast?.(`RMA ${res.data.data.jobNumber} created`, 'success');
                setCreateOpen(false);
                resetCreate();
                fetchAll();
                setViewRma(res.data.data);
            } catch (err) {
                showToast?.(err.response?.data?.message || 'Failed to create RMA', 'error');
            }
        });
    };

    const resetCreate = () => {
        setLookupSerial('');
        setLookupData(null);
        setCustomerDetails({ name: '', telephoneNumber: '', emailAddress: '', idCardNumber: '', destination: '', address: '' });
        setProjectDetails({ projectId: '', name: '', location: '' });
        setSupplierDetails({ name: '', telephoneNumber: '', emailAddress: '', address: '' });
        setSelectedAssignees([]);
        setFaultComment('');
    };

    const handlePrint = () => {
        if (!viewRma) return;
        openA4PrintWindow(
            printRef.current,
            buildPrintFileName(viewRma.jobNumber, viewRma.customerDetails?.name || 'Customer', viewRma.createdAt),
        );
    };

    const submitStatus = async () => {
        if (!viewRma) return;
        if (!statusNote.trim()) return showToast?.('Status comment is required', 'error');
        if (['Resolved', 'Closed'].includes(statusValue) && !(diagnosis.trim() || viewRma.diagnosis || viewRma.faultComment)) {
            return showToast?.('Fault diagnosis is required to resolve or close this RMA', 'error');
        }
        await runGuarded(async () => {
            try {
                const res = await api.post(`/rma/${viewRma._id}/status`, {
                    status: statusValue,
                    note: statusNote.trim(),
                    diagnosis: diagnosis.trim() || undefined,
                });
                setViewRma(res.data.data);
                setStatusNote('');
                setStatusOpen(false);
                showToast?.('Status updated', 'success');
                fetchAll({ quiet: true });
            } catch (err) {
                showToast?.(err.response?.data?.message || 'Status update failed', 'error');
            }
        });
    };

    const submitReplace = async () => {
        if (!viewRma) return;
        if (!replaceForm.newSerialNumber.trim()) return showToast?.('New serial is required', 'error');
        await runGuarded(async () => {
            try {
                const payload = {
                    source: replaceForm.source,
                    newSerialNumber: replaceForm.newSerialNumber.trim(),
                    newWarrantyPeriod: replaceForm.warrantyNa ? 'N/A' : replaceForm.newWarrantyPeriod.trim(),
                };
                const res = await api.put(`/rma/${viewRma._id}/replace`, payload);
                setViewRma(res.data.data);
                setReplaceOpen(false);
                showToast?.('Device replaced', 'success');
                fetchAll({ quiet: true });
            } catch (err) {
                showToast?.(err.response?.data?.message || 'Replace failed', 'error');
            }
        });
    };

    const submitSign = async () => {
        if (!viewRma) return;
        if (!signForm.customerName.trim() || !signForm.idCardNumber.trim()) {
            return showToast?.('Customer name and ID card are required', 'error');
        }
        await runGuarded(async () => {
            try {
                const res = await api.put(`/rma/${viewRma._id}/signature`, {
                    customerName: signForm.customerName.trim(),
                    idCardNumber: signForm.idCardNumber.trim(),
                    destination: signForm.destination.trim(),
                });
                setViewRma(res.data.data);
                setSignOpen(false);
                showToast?.('Signature details saved — ready to print', 'success');
                fetchAll({ quiet: true });
            } catch (err) {
                showToast?.(err.response?.data?.message || 'Failed to save signature', 'error');
            }
        });
    };

    const submitAssign = async () => {
        if (!viewRma) return;
        if (extraAssignees.length === 0) return showToast?.('Select users to assign', 'error');
        await runGuarded(async () => {
            try {
                const res = await api.put(`/rma/${viewRma._id}/assignees`, { assignees: extraAssignees });
                setViewRma(res.data.data);
                setAssignOpen(false);
                setExtraAssignees([]);
                showToast?.('Users assigned & notified', 'success');
                fetchAll({ quiet: true });
            } catch (err) {
                showToast?.(err.response?.data?.message || 'Assign failed', 'error');
            }
        });
    };

    const submitRemoveFaulty = async () => {
        if (!removeFaulty) return;
        if (!removeNote.trim()) return showToast?.('Removal note is required', 'error');
        await runGuarded(async () => {
            try {
                await api.delete(`/rma/faulty/${removeFaulty._id}`, { data: { note: removeNote.trim() } });
                showToast?.('Faulty device removed as loss', 'success');
                setRemoveFaulty(null);
                setRemoveNote('');
                fetchAll({ quiet: true });
            } catch (err) {
                showToast?.(err.response?.data?.message || 'Remove failed', 'error');
            }
        });
    };

    const applyDetailState = (job) => {
        setStatusValue(job.status === 'Open' ? 'In Progress' : (job.status || 'In Progress'));
        setDiagnosis(job.diagnosis || '');
        setStatusNote('');
        setSignForm({
            customerName: job.customerSignature?.customerName || job.customerDetails?.name || '',
            idCardNumber: job.customerSignature?.idCardNumber || job.customerDetails?.idCardNumber || '',
            destination: job.customerSignature?.destination || job.customerDetails?.destination || '',
        });
    };

    const openStatus = (e) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        if (!viewRma || detailLoading) return;
        applyDetailState(viewRma);
        setStatusOpen(true);
    };

    const openReplace = async (e) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        if (!viewRma || detailLoading) return;
        setReplaceForm({
            source: 'stock',
            newSerialNumber: '',
            newWarrantyPeriod: viewRma.productRef?.warrantyPeriod || '',
            warrantyNa: false,
        });
        setReplaceOpen(true);
        try {
            const res = await api.get(`/rma/lookup/${encodeURIComponent(viewRma.serialNumber)}`);
            setLookupData(res.data.data);
        } catch {
            /* optional */
        }
    };

    const openDetail = async (job) => {
        if (!job?._id) return;
        setStatusOpen(false);
        setReplaceOpen(false);
        setAssignOpen(false);
        setSignOpen(false);
        setDetailLoading(true);
        setViewRma(job);
        applyDetailState(job);

        try {
            let biz = businessData;
            if (!biz) {
                const bRes = await api.get('/business');
                biz = bRes.data?.data?.details || null;
                if (biz) setBusinessData(biz);
            }

            const res = await api.get(`/rma/${job._id}`);
            const full = res.data?.data;
            if (!full) throw new Error('RMA job not found');
            setViewRma(full);
            applyDetailState(full);
        } catch (err) {
            showToast?.(err.response?.data?.message || err.message || 'Failed to open RMA', 'error');
            setViewRma(null);
        } finally {
            setDetailLoading(false);
        }
    };

    const closeDetail = () => {
        setViewRma(null);
        setStatusOpen(false);
        setReplaceOpen(false);
        setAssignOpen(false);
        setSignOpen(false);
        setDetailLoading(false);
    };

    return (
        <div className="pm-root">
            <div className="pm-card">
                <div className="pm-card-header">
                    <div className="pm-card-title">
                        <div className="pm-card-icon amber"><Wrench size={22} /></div>
                        <div>
                            <h3>RMA Process</h3>
                            <div className="pm-card-subtitle">Serial lookup → assign → update status / replace → print RMA report</div>
                        </div>
                    </div>
                    <div className="pm-card-actions">
                        <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 12 }}>
                            <button type="button" onClick={() => setViewTab('jobs')} style={{ padding: '6px 12px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', background: viewTab === 'jobs' ? '#fff' : 'transparent' }}>Jobs</button>
                            {isAdmin && (
                                <button type="button" onClick={() => setViewTab('faulty')} style={{ padding: '6px 12px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', background: viewTab === 'faulty' ? '#fff' : 'transparent' }}>Faulty Stock</button>
                            )}
                        </div>
                        <div className="pm-search-wrap">
                            <Search size={14} className="pm-search-icon" />
                            <input className="pm-search-input" placeholder="Search job / serial / customer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        {viewTab === 'jobs' && (
                            <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 12 }}>
                                <button type="button" onClick={() => setActiveTab('Active')} style={{ padding: '6px 12px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', background: activeTab === 'Active' ? '#fff' : 'transparent' }}>Active</button>
                                <button type="button" onClick={() => setActiveTab('Cancelled')} style={{ padding: '6px 12px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', color: activeTab === 'Cancelled' ? '#ef4444' : '#64748b', background: activeTab === 'Cancelled' ? '#fff' : 'transparent' }}>Closed</button>
                            </div>
                        )}
                        <motion.button whileTap={{ scale: 0.95 }} type="button" className="pm-btn pm-btn-primary" onClick={() => { resetCreate(); setCreateOpen(true); }}>
                            <Plus size={16} /> New RMA
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.95 }} type="button" className="pm-btn pm-btn-outline" onClick={fetchAll}>
                            <RefreshCw size={16} />
                        </motion.button>
                    </div>
                </div>

                {loading ? (
                    <div className="pm-loading"><RefreshCw className="animate-spin" size={20} /> Loading...</div>
                ) : viewTab === 'faulty' ? (
                    <div className="modern-table-card">
                        <div className="modern-table-scroll">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Serial</th>
                                        <th>Product</th>
                                        <th>RMA</th>
                                        <th>Price (Loss)</th>
                                        <th>Faulty Since</th>
                                        <th>Auto Remove</th>
                                        <th>Status</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {faultyDevices.map((d) => (
                                        <tr key={d._id}>
                                            <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{d.serialNumber}</td>
                                            <td>{d.productName || d.productRef?.name || '—'}</td>
                                            <td>{d.jobNumber || '—'}</td>
                                            <td>Rs. {Number(d.buyingPrice || 0).toLocaleString()}</td>
                                            <td>{d.faultySince ? new Date(d.faultySince).toLocaleDateString() : '—'}</td>
                                            <td>{d.autoRemoveAt ? new Date(d.autoRemoveAt).toLocaleDateString() : '—'}</td>
                                            <td>
                                                <span className={`modern-table-status ${d.status === 'faulty' ? 'pending' : 'cancelled'}`}>{d.status}</span>
                                            </td>
                                            <td className="text-center">
                                                {d.status === 'faulty' && (
                                                    <button type="button" className="modern-table-action delete" title="Remove as loss" onClick={() => { setRemoveFaulty(d); setRemoveNote(''); }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {faultyDevices.length === 0 && (
                                        <tr><td colSpan="8" className="modern-table-empty">No faulty devices</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="modern-table-card">
                        <div className="modern-table-scroll">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Job #</th>
                                        <th>Serial</th>
                                        <th>Customer</th>
                                        <th>Product</th>
                                        <th>Warranty</th>
                                        <th>Status</th>
                                        <th>Assignees</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredJobs.map((j) => (
                                        <tr key={j._id}>
                                            <td style={{ fontWeight: 800, color: '#c2410c' }}>{j.jobNumber}</td>
                                            <td style={{ fontFamily: 'monospace' }}>{j.serialNumber}</td>
                                            <td>{j.customerDetails?.name || (j.clientRef ? `${j.clientRef.firstName || ''} ${j.clientRef.lastName || ''}`.trim() : '') || '—'}</td>
                                            <td>{j.productName || j.productRef?.name || '—'}</td>
                                            <td>
                                                <span className={`modern-table-status ${
                                                    j.replacement?.replaced
                                                        ? (j.replacement.newWarrantyPeriod && j.replacement.newWarrantyPeriod.toUpperCase() !== 'N/A' ? 'active' : 'cancelled')
                                                        : (j.underWarranty ? 'active' : 'cancelled')
                                                }`}>
                                                    {j.replacement?.replaced
                                                        ? (j.replacement.newWarrantyPeriod && j.replacement.newWarrantyPeriod.toUpperCase() !== 'N/A' ? 'New under warranty' : 'Replaced (N/A)')
                                                        : (j.underWarranty ? 'Under warranty' : 'No / Expired')}
                                                </span>
                                            </td>
                                            <td><span className="modern-table-status pending">{j.status}</span></td>
                                            <td style={{ fontSize: '0.75rem' }}>
                                                {(j.assignees || []).map((u) => u.firstName || u.username).join(', ') || '—'}
                                            </td>
                                            <td className="text-center">
                                                <div className="modern-table-actions" style={{ justifyContent: 'center' }}>
                                                    <button type="button" className="modern-table-action view" title="Open / Print" onClick={() => openDetail(j)}>
                                                        <Printer size={14} />
                                                    </button>
                                                    <button type="button" className="modern-table-action history" title="Timeline" onClick={() => openDetail(j)}>
                                                        <Clock size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredJobs.length === 0 && (
                                        <tr><td colSpan="8" className="modern-table-empty">No RMA jobs found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* CREATE RMA */}
            <AnimatePresence>
                {createOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1200, overflowY: 'auto', padding: '1.5rem' }}>
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#f8fafc', borderRadius: 20, maxWidth: 860, margin: '0 auto', padding: '1.5rem', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                                <h2 style={{ margin: 0, fontWeight: 900 }}>Create RMA Job</h2>
                                <button type="button" className="pm-btn pm-btn-outline" onClick={() => setCreateOpen(false)}><X size={16} /></button>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>1. Serial Number</label>
                                    <input style={inputStyle} value={lookupSerial} onChange={(e) => setLookupSerial(e.target.value.toUpperCase())} placeholder="Type device serial..." />
                                </div>
                                <motion.button whileTap={{ scale: 0.95 }} type="button" className="pm-btn pm-btn-primary" style={{ alignSelf: 'flex-end' }} onClick={handleLookup} disabled={lookupLoading}>
                                    <FileSearch size={16} /> {lookupLoading ? 'Checking...' : 'Check Warranty'}
                                </motion.button>
                            </div>

                            {lookupData && (
                                <>
                                    <div style={{
                                        padding: '0.85rem 1rem', borderRadius: 12, marginBottom: '1rem',
                                        background: lookupData.underWarranty ? '#ecfdf5' : '#fef2f2',
                                        border: `1px solid ${lookupData.underWarranty ? '#a7f3d0' : '#fecaca'}`,
                                        fontWeight: 700,
                                    }}>
                                        <Shield size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                        {lookupData.warrantyFound
                                            ? (lookupData.underWarranty
                                                ? `Under warranty — ${lookupData.warranty?.warrantyPeriod || ''} (exp ${lookupData.warranty?.expiryDate ? new Date(lookupData.warranty.expiryDate).toLocaleDateString() : '—'})`
                                                : 'Warranty record found but NOT active / expired')
                                            : 'No warranty found for this serial'}
                                        {lookupData.product && <div style={{ fontWeight: 600, marginTop: 4 }}>Product: {lookupData.product.name}</div>}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                                        <div>
                                            <label style={labelStyle}>Customer Name</label>
                                            <input style={inputStyle} value={customerDetails.name} onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Telephone</label>
                                            <input style={inputStyle} value={customerDetails.telephoneNumber} onChange={(e) => setCustomerDetails({ ...customerDetails, telephoneNumber: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Email</label>
                                            <input style={inputStyle} value={customerDetails.emailAddress} onChange={(e) => setCustomerDetails({ ...customerDetails, emailAddress: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Destination (optional)</label>
                                            <input style={inputStyle} value={customerDetails.destination} onChange={(e) => setCustomerDetails({ ...customerDetails, destination: e.target.value })} placeholder="Leave empty if not needed" />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Project</label>
                                            <input style={inputStyle} value={projectDetails.name} onChange={(e) => setProjectDetails({ ...projectDetails, name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Project Location</label>
                                            <input style={inputStyle} value={projectDetails.location} onChange={(e) => setProjectDetails({ ...projectDetails, location: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Supplier</label>
                                            <input style={inputStyle} value={supplierDetails.name} onChange={(e) => setSupplierDetails({ ...supplierDetails, name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Supplier Phone</label>
                                            <input style={inputStyle} value={supplierDetails.telephoneNumber} onChange={(e) => setSupplierDetails({ ...supplierDetails, telephoneNumber: e.target.value })} />
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={labelStyle}>Assign Organization Users (multiple)</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: 140, overflowY: 'auto', padding: '0.5rem', background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                            {users.map((u) => {
                                                const id = String(u._id);
                                                const active = selectedAssignees.includes(id);
                                                return (
                                                    <button
                                                        key={id}
                                                        type="button"
                                                        onClick={() => toggleAssignee(id, selectedAssignees, setSelectedAssignees)}
                                                        style={{
                                                            border: active ? '1.5px solid #0f172a' : '1px solid #e2e8f0',
                                                            background: active ? '#0f172a' : '#f8fafc',
                                                            color: active ? '#fff' : '#334155',
                                                            borderRadius: 999, padding: '4px 10px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                                                        }}
                                                    >
                                                        {u.firstName} {u.lastName} ({u.role})
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={labelStyle}>Device Faulty Comment</label>
                                        <textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} value={faultComment} onChange={(e) => setFaultComment(e.target.value)} placeholder="What is wrong with the device?" />
                                    </div>

                                    <motion.button whileTap={{ scale: isSubmitting ? 1 : 0.98 }} type="button" className="pm-btn pm-btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={isSubmitting} onClick={submitCreate}>
                                        {isSubmitting ? 'Creating...' : 'Create RMA (auto job number + notify assignees)'}
                                    </motion.button>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* DETAIL / PRINT */}
            {viewRma && (
                <div
                    className="app-print-overlay"
                    style={{ zIndex: 1200 }}
                    onClick={(e) => { if (e.target === e.currentTarget) closeDetail(); }}
                >
                    <div className="app-print-shell" style={{ maxWidth: '920px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="app-print-toolbar" style={{ flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'flex-start' }}>
                            <motion.button whileTap={{ scale: 0.95 }} type="button" className="app-print-btn" onClick={handlePrint} disabled={detailLoading || !businessData}>
                                <Printer size={18} /> A4 Print / PDF
                            </motion.button>
                            <button type="button" className="pm-btn pm-btn-primary" onClick={openStatus} disabled={detailLoading} style={{ background: '#0f172a', color: '#fff', border: 'none' }}>
                                <MessageSquare size={15} /> Update Status
                            </button>
                            <button type="button" className="pm-btn pm-btn-outline" onClick={openReplace} disabled={detailLoading || !!viewRma.replacement?.replaced} style={{ background: '#fff', color: '#0f172a', border: '1.5px solid #e2e8f0' }}>
                                <Replace size={15} /> Replace Device
                            </button>
                            <button type="button" className="pm-btn pm-btn-outline" onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!detailLoading) setAssignOpen(true); }} disabled={detailLoading} style={{ background: '#fff', color: '#0f172a', border: '1.5px solid #e2e8f0' }}>
                                <UserPlus size={15} /> Assign
                            </button>
                            <button type="button" className="pm-btn pm-btn-outline" onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!detailLoading) setSignOpen(true); }} disabled={detailLoading} style={{ background: '#fff', color: '#0f172a', border: '1.5px solid #e2e8f0' }}>
                                <Shield size={15} /> Customer Sign
                            </button>
                            <motion.button whileTap={{ scale: 0.95 }} type="button" className="app-print-close" onClick={closeDetail} style={{ marginLeft: 'auto' }}>
                                <X size={20} />
                            </motion.button>
                        </div>

                        {detailLoading ? (
                            <div style={{ background: '#fff', borderRadius: 16, padding: '3rem', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>
                                Loading RMA report...
                            </div>
                        ) : !businessData ? (
                            <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', textAlign: 'center', color: '#b91c1c', fontWeight: 700 }}>
                                Business settings not loaded. Close and reopen, or refresh the page.
                            </div>
                        ) : (
                            <div className="app-print-doc" ref={printRef}>
                                <RmaTemplate rma={viewRma} business={businessData} />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* UPDATE STATUS */}
            {statusOpen && viewRma && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 520 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>Update Status</h3>
                            <button type="button" className="pm-btn pm-btn-outline" onClick={() => setStatusOpen(false)}><X size={16} /></button>
                        </div>
                        <p style={{ margin: '0 0 1rem', color: '#64748b', fontSize: '0.85rem' }}>
                            Job Number: <strong style={{ color: '#0f172a' }}>{viewRma.jobNumber}</strong>
                        </p>
                        <label style={labelStyle}>Status</label>
                        <select style={{ ...inputStyle, marginBottom: '0.75rem' }} value={statusValue} onChange={(e) => setStatusValue(e.target.value)}>
                            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <label style={labelStyle}>Comment</label>
                        <input style={{ ...inputStyle, marginBottom: '0.75rem' }} value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="e.g. In-house check done / sent to supplier" />
                        <label style={labelStyle}>
                            Fault diagnosis {['Resolved', 'Closed'].includes(statusValue) ? '(required to end RMA)' : '(optional)'}
                        </label>
                        <textarea
                            style={{ ...inputStyle, minHeight: 80, resize: 'vertical', marginBottom: '0.85rem' }}
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                            placeholder="Record the fault / cause before closing the job"
                        />
                        {!viewRma.replacement?.replaced && (
                            <button
                                type="button"
                                className="pm-btn pm-btn-outline"
                                style={{ width: '100%', justifyContent: 'center', marginBottom: '0.85rem' }}
                                onClick={() => { setStatusOpen(false); openReplace(); }}
                            >
                                <Replace size={15} /> Replace Device
                            </button>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="button" className="pm-btn pm-btn-outline" style={{ flex: 1, background: '#fff', color: '#0f172a', border: '1.5px solid #e2e8f0' }} onClick={() => setStatusOpen(false)}>Cancel</button>
                            <button type="button" className="pm-btn pm-btn-primary" style={{ flex: 1, background: '#0f172a', color: '#fff', border: 'none' }} onClick={submitStatus} disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Update Status'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REPLACE MODAL */}
            {replaceOpen && viewRma && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 480 }}>
                        <h3 style={{ marginTop: 0 }}>Replace Device</h3>
                        <label style={labelStyle}>Source</label>
                        <select style={{ ...inputStyle, marginBottom: '0.75rem' }} value={replaceForm.source} onChange={(e) => setReplaceForm({ ...replaceForm, source: e.target.value })}>
                            <option value="stock">From shop stock</option>
                            <option value="supplier">Supplier new device</option>
                        </select>
                        <label style={labelStyle}>New Serial Number</label>
                        {replaceForm.source === 'stock' && lookupData?.availableSerials?.length ? (
                            <select style={{ ...inputStyle, marginBottom: '0.75rem' }} value={replaceForm.newSerialNumber} onChange={(e) => setReplaceForm({ ...replaceForm, newSerialNumber: e.target.value })}>
                                <option value="">Select from stock...</option>
                                {(lookupData?.availableSerials || []).map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        ) : (
                            <input style={{ ...inputStyle, marginBottom: '0.75rem' }} value={replaceForm.newSerialNumber} onChange={(e) => setReplaceForm({ ...replaceForm, newSerialNumber: e.target.value.toUpperCase() })} />
                        )}
                        {replaceForm.source === 'stock' && (
                            <input style={{ ...inputStyle, marginBottom: '0.75rem' }} placeholder="Or type stock serial..." value={replaceForm.newSerialNumber} onChange={(e) => setReplaceForm({ ...replaceForm, newSerialNumber: e.target.value.toUpperCase() })} />
                        )}
                        <label style={labelStyle}>New Warranty Period</label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <button
                                type="button"
                                className="pm-btn pm-btn-outline"
                                style={{
                                    flex: 1,
                                    background: replaceForm.warrantyNa ? '#0f172a' : undefined,
                                    color: replaceForm.warrantyNa ? '#fff' : undefined,
                                    borderColor: replaceForm.warrantyNa ? '#0f172a' : undefined,
                                }}
                                onClick={() => setReplaceForm({ ...replaceForm, warrantyNa: true, newWarrantyPeriod: 'N/A' })}
                            >
                                N/A
                            </button>
                            <button
                                type="button"
                                className="pm-btn pm-btn-outline"
                                style={{
                                    flex: 1,
                                    background: !replaceForm.warrantyNa ? '#0f172a' : undefined,
                                    color: !replaceForm.warrantyNa ? '#fff' : undefined,
                                    borderColor: !replaceForm.warrantyNa ? '#0f172a' : undefined,
                                }}
                                onClick={() => setReplaceForm({
                                    ...replaceForm,
                                    warrantyNa: false,
                                    newWarrantyPeriod: replaceForm.newWarrantyPeriod === 'N/A' ? (viewRma.productRef?.warrantyPeriod || '') : replaceForm.newWarrantyPeriod,
                                })}
                            >
                                Set Period
                            </button>
                        </div>
                        {!replaceForm.warrantyNa && (
                            <input
                                style={{ ...inputStyle, marginBottom: '1rem' }}
                                placeholder="e.g. 1 year"
                                value={replaceForm.newWarrantyPeriod}
                                onChange={(e) => setReplaceForm({ ...replaceForm, newWarrantyPeriod: e.target.value, warrantyNa: false })}
                            />
                        )}
                        {replaceForm.warrantyNa && <div style={{ marginBottom: '1rem', color: '#64748b', fontSize: '0.85rem' }}>Warranty set to N/A — no new warranty record will be created.</div>}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="button" className="pm-btn pm-btn-outline" style={{ flex: 1 }} onClick={() => setReplaceOpen(false)}>Cancel</button>
                            <button type="button" className="pm-btn pm-btn-primary" style={{ flex: 1 }} onClick={submitReplace} disabled={isSubmitting}>Replace</button>
                        </div>
                    </div>
                </div>
            )}

            {/* SIGNATURE MODAL */}
            {signOpen && viewRma && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 460 }}>
                        <h3 style={{ marginTop: 0 }}>Customer Signature Details</h3>
                        <label style={labelStyle}>Customer Name</label>
                        <input style={{ ...inputStyle, marginBottom: '0.75rem' }} value={signForm.customerName} onChange={(e) => setSignForm({ ...signForm, customerName: e.target.value })} />
                        <label style={labelStyle}>ID Card Number</label>
                        <input style={{ ...inputStyle, marginBottom: '0.75rem' }} value={signForm.idCardNumber} onChange={(e) => setSignForm({ ...signForm, idCardNumber: e.target.value })} />
                        <label style={labelStyle}>Destination (optional)</label>
                        <input style={{ ...inputStyle, marginBottom: '1rem' }} value={signForm.destination} onChange={(e) => setSignForm({ ...signForm, destination: e.target.value })} placeholder="Leave empty if not needed" />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="button" className="pm-btn pm-btn-outline" style={{ flex: 1 }} onClick={() => setSignOpen(false)}>Cancel</button>
                            <button type="button" className="pm-btn pm-btn-primary" style={{ flex: 1 }} onClick={submitSign} disabled={isSubmitting}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ASSIGN MORE */}
            {assignOpen && viewRma && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 480 }}>
                        <h3 style={{ marginTop: 0 }}>Assign More Users</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                            {users.map((u) => {
                                const id = String(u._id);
                                const already = (viewRma.assignees || []).some((a) => String(a._id || a) === id);
                                const active = extraAssignees.includes(id);
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        disabled={already}
                                        onClick={() => toggleAssignee(id, extraAssignees, setExtraAssignees)}
                                        style={{
                                            border: active ? '1.5px solid #0f172a' : '1px solid #e2e8f0',
                                            background: already ? '#e2e8f0' : (active ? '#0f172a' : '#f8fafc'),
                                            color: active ? '#fff' : '#334155',
                                            borderRadius: 999, padding: '4px 10px', fontWeight: 700, fontSize: '0.75rem',
                                            cursor: already ? 'not-allowed' : 'pointer', opacity: already ? 0.6 : 1,
                                        }}
                                    >
                                        {u.firstName} {u.lastName}{already ? ' ✓' : ''}
                                    </button>
                                );
                            })}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="button" className="pm-btn pm-btn-outline" style={{ flex: 1 }} onClick={() => setAssignOpen(false)}>Cancel</button>
                            <button type="button" className="pm-btn pm-btn-primary" style={{ flex: 1 }} onClick={submitAssign} disabled={isSubmitting}>Assign & Notify</button>
                        </div>
                    </div>
                </div>
            )}

            {/* REMOVE FAULTY */}
            {removeFaulty && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 440 }}>
                        <h3 style={{ marginTop: 0, color: '#b91c1c' }}>Remove Faulty Device as Loss</h3>
                        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                            Serial <strong>{removeFaulty.serialNumber}</strong> will be removed. Price Rs. {Number(removeFaulty.buyingPrice || 0).toLocaleString()} counts as loss.
                            Devices older than 6 months also auto-remove.
                        </p>
                        <textarea style={{ ...inputStyle, minHeight: 90, marginBottom: '1rem' }} placeholder="Removal note (required)..." value={removeNote} onChange={(e) => setRemoveNote(e.target.value)} />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="button" className="pm-btn pm-btn-outline" style={{ flex: 1 }} onClick={() => setRemoveFaulty(null)}>Cancel</button>
                            <button type="button" className="pm-btn pm-btn-primary" style={{ flex: 1, background: '#dc2626' }} onClick={submitRemoveFaulty} disabled={isSubmitting}>Remove</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default RmaManagement;
