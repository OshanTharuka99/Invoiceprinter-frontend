import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { ShieldAlert, CheckCircle, XCircle, RefreshCw, UserCheck, FileText, Users } from 'lucide-react';
import api from '../../api';
import './ApprovalsDashboard.css';

const ApprovalsDashboard = ({ showToast }) => {
    const [activeTab, setActiveTab] = useState('clients');
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
        } catch {
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
        } catch {
            showToast?.(`Failed to ${action} transaction`, 'error');
        }
    };

    const handleQuotationAction = async (id, action) => {
        try {
            await api.put(`/quotations/delete-requests/${id}/${action}`);
            showToast?.(`Quotation Deletion ${action}d`, 'success');
            fetchData();
        } catch {
            showToast?.(`Failed to ${action} transaction`, 'error');
        }
    };

    return (
        <div className="adb-root">
            <div className="adb-tabs">
                <button
                    onClick={() => setActiveTab('clients')}
                    className={`adb-tab ${activeTab === 'clients' ? 'adb-tab--active' : 'adb-tab--inactive'}`}
                >
                    <Users size={18} /> Client Mutations
                </button>
                <button
                    onClick={() => setActiveTab('quotations')}
                    className={`adb-tab ${activeTab === 'quotations' ? 'adb-tab--active' : 'adb-tab--inactive'}`}
                >
                    <FileText size={18} /> Quotation Deletions
                </button>
            </div>

            {loading ? (
                <div className="adb-loading"><div className="adb-spinner" /></div>
            ) : (
                <div className="adb-card">
                    <div className="adb-card-head">
                        <div className="adb-card-icon"><ShieldAlert size={24} /></div>
                        <div>
                            <h3 className="adb-card-title">Security Sandbox</h3>
                            <p className="adb-card-desc">Approve or reject data mutations pushed by standard accounts.</p>
                        </div>
                    </div>

                    <div className="adb-requests">
                        {activeTab === 'clients' && (
                            clientRequests.length === 0 ? (
                                <div className="adb-empty">No pending client mutation requests in queue.</div>
                            ) : (
                                clientRequests.map((req, i) => (
                                    <motion.div
                                        key={req._id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="adb-req"
                                    >
                                        <div className="adb-req-top">
                                            <div>
                                                <h4 className="adb-req-target">
                                                    Target: {req.client?.firstName} {req.client?.lastName} ({req.client?.clientId})
                                                </h4>
                                                <div className="adb-req-submitter">
                                                    <UserCheck size={14} /> Submitted by: {req.requestedBy?.firstName} {req.requestedBy?.lastName}
                                                </div>
                                            </div>
                                            <div className="adb-req-actions">
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleClientAction(req._id, 'reject')}
                                                    className="adb-btn adb-btn--reject"
                                                >
                                                    <XCircle size={16} /> Reject
                                                </motion.button>
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleClientAction(req._id, 'approve')}
                                                    className="adb-btn adb-btn--approve"
                                                >
                                                    <CheckCircle size={16} /> Approve Override
                                                </motion.button>
                                            </div>
                                        </div>
                                        <div className="adb-changes">
                                            <h5 className="adb-changes-title">Proposed Field Changes:</h5>
                                            <div className="adb-changes-grid">
                                                {Object.entries(req.proposedChanges).map(([key, value]) => (
                                                    <div key={key} className="adb-changes-item">
                                                        <span className="adb-changes-key">{key}:</span>{' '}
                                                        <span className="adb-changes-val">{value || 'NULL'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )
                        )}

                        {activeTab === 'quotations' && (
                            quotationRequests.length === 0 ? (
                                <div className="adb-empty">No pending quotation deletion requests.</div>
                            ) : (
                                quotationRequests.map((req, i) => (
                                    <motion.div
                                        key={req._id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="adb-req adb-req--danger"
                                    >
                                        <div className="adb-req-top">
                                            <div>
                                                <h4 className="adb-req-target adb-req-target--danger">
                                                    Deletion Request: {req.quotation?.quotationId}
                                                </h4>
                                                <div className="adb-req-submitter adb-req-submitter--danger">
                                                    <UserCheck size={14} /> Requested by: {req.requestedBy?.firstName} {req.requestedBy?.lastName}
                                                </div>
                                            </div>
                                            <div className="adb-req-actions">
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleQuotationAction(req._id, 'reject')}
                                                    className="adb-btn adb-btn--outline-danger"
                                                >
                                                    <XCircle size={16} /> Keep Quotation
                                                </motion.button>
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleQuotationAction(req._id, 'approve')}
                                                    className="adb-btn adb-btn--danger"
                                                >
                                                    <CheckCircle size={16} /> Approve Permanent Deletion
                                                </motion.button>
                                            </div>
                                        </div>
                                        <div className="adb-reason">
                                            <h5 className="adb-reason-title">Provided Reason for Deletion:</h5>
                                            <p className="adb-reason-text">"{req.reason}"</p>
                                        </div>
                                    </motion.div>
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
