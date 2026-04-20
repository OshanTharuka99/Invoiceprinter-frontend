import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle, XCircle, RefreshCw, UserCheck, FileText, Users } from 'lucide-react';
import api from '../../api';

const ApprovalsDashboard = ({ showToast }) => {
    const [activeTab, setActiveTab] = useState('clients'); // 'clients' or 'quotations'
    const [clientRequests, setClientRequests] = useState([]);
    const [quotationRequests, setQuotationRequests] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'clients') {
                const res = await api.get('/clients/requests');
                setClientRequests(res.data.data);
            } else {
                const res = await api.get('/quotations/delete-requests');
                setQuotationRequests(res.data.data);
            }
        } catch (error) {
            showToast?.('Failed to load pending requests', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [activeTab]);

    const handleClientAction = async (id, action) => {
        try {
            await api.put(`/clients/requests/${id}/${action}`);
            showToast?.(`Edit securely ${action}d`, 'success');
            fetchData();
        } catch (error) {
            showToast?.(`Failed to ${action} transaction`, 'error');
        }
    };

    const handleQuotationAction = async (id, action) => {
        try {
            await api.put(`/quotations/delete-requests/${id}/${action}`);
            showToast?.(`Quotation Deletion ${action}d`, 'success');
            fetchData();
        } catch (error) {
            showToast?.(`Failed to ${action} transaction`, 'error');
        }
    };

    const cardStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => setActiveTab('clients')} style={{ background: activeTab === 'clients' ? '#0f172a' : '#fff', color: activeTab === 'clients' ? '#fff' : '#64748b', border: activeTab === 'clients' ? 'none' : '1px solid #e2e8f0', padding: '0.8rem 1.5rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}>
                    <Users size={18} /> Client Mutations
                </button>
                <button onClick={() => setActiveTab('quotations')} style={{ background: activeTab === 'quotations' ? '#0f172a' : '#fff', color: activeTab === 'quotations' ? '#fff' : '#64748b', border: activeTab === 'quotations' ? 'none' : '1px solid #e2e8f0', padding: '0.8rem 1.5rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}>
                    <FileText size={18} /> Quotation Deletions
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><RefreshCw className="animate-spin" color="#64748b" /></div>
            ) : (
                <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
                        <div style={{ background: '#f43f5e15', color: '#f43f5e', padding: '10px', borderRadius: '12px' }}><ShieldAlert size={24} /></div> 
                        <div>
                            <h3 style={{ margin: 0, fontWeight: 900 }}>Security Sandbox</h3>
                            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>Approve or reject data mutations pushed by standard accounts.</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {activeTab === 'clients' && (
                            clientRequests.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '16px' }}>No pending client mutation requests in queue.</div>
                            ) : (
                                clientRequests.map(req => (
                                    <div key={req._id} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', background: '#f8fafc' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div>
                                                <h4 style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Target: {req.client?.firstName} {req.client?.lastName} ({req.client?.clientId})</h4>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                                                    <UserCheck size={14} /> Submitted by: {req.requestedBy?.firstName} {req.requestedBy?.lastName}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.8rem' }}>
                                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleClientAction(req._id, 'reject')} style={{ background: '#fff', border: '1px solid #f43f5e', color: '#f43f5e', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}><XCircle size={16} /> Reject</motion.button>
                                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleClientAction(req._id, 'approve')} style={{ background: '#10b981', border: 'none', color: '#fff', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle size={16} /> Approve Override</motion.button>
                                            </div>
                                        </div>
                                        <div style={{ background: '#fff', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0' }}>
                                            <h5 style={{ margin: '0 0 0.8rem 0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>Proposed Field Changes:</h5>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                                {Object.entries(req.proposedChanges).map(([key, value]) => (
                                                    <div key={key} style={{ fontSize: '0.85rem' }}>
                                                        <span style={{ fontWeight: 800, color: '#0f172a' }}>{key}:</span> <span style={{ color: '#3b82f6', fontWeight: 600 }}>{value || 'NULL'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )
                        )}

                        {activeTab === 'quotations' && (
                            quotationRequests.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '16px' }}>No pending quotation deletion requests.</div>
                            ) : (
                                quotationRequests.map(req => (
                                    <div key={req._id} style={{ border: '2px solid #fee2e2', borderRadius: '16px', padding: '1.5rem', background: '#fef2f2' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div>
                                                <h4 style={{ margin: 0, fontWeight: 800, color: '#991b1b' }}>Deletion Request: {req.quotation?.quotationId}</h4>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.8rem', color: '#b91c1c', fontWeight: 600 }}>
                                                    <UserCheck size={14} /> Requested by: {req.requestedBy?.firstName} {req.requestedBy?.lastName}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.8rem' }}>
                                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleQuotationAction(req._id, 'reject')} style={{ background: '#fff', border: '1px solid #ef4444', color: '#ef4444', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}><XCircle size={16} /> Keep Quotation</motion.button>
                                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleQuotationAction(req._id, 'approve')} style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle size={16} /> Approve Permanent Deletion</motion.button>
                                            </div>
                                        </div>
                                        <div style={{ background: '#fff', borderRadius: '12px', padding: '1rem', border: '1px solid #fecaca' }}>
                                            <h5 style={{ margin: '0 0 0.8rem 0', color: '#991b1b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Provided Reason for Deletion:</h5>
                                            <p style={{ margin: 0, fontWeight: 600, color: '#450a0a', fontSize: '0.9rem' }}>"{req.reason}"</p>
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApprovalsDashboard;
