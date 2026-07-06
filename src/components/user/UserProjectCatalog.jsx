import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, RefreshCw, Briefcase, FolderKanban, CheckCircle2 } from 'lucide-react';
import api from '../../api';
import '../../styles/modern-table.css';

const UserProjectCatalog = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/projects');
            setProjects(res.data.data);
        } catch {
            console.error('Failed database read');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const filtered = projects.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.projectId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCount = projects.filter(p => p.startDate && new Date(p.startDate) <= new Date()).length;

    return (
        <div className="pm-root">
            <div className="pm-stats">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pm-stat-card indigo">
                    <div className="pm-stat-icon indigo"><FolderKanban size={22} /></div>
                    <div className="pm-stat-body">
                        <div className="pm-stat-value">{projects.length}</div>
                        <div className="pm-stat-label">Total Projects</div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="pm-stat-card green">
                    <div className="pm-stat-icon green"><CheckCircle2 size={22} /></div>
                    <div className="pm-stat-body">
                        <div className="pm-stat-value">{activeCount}</div>
                        <div className="pm-stat-label">Active</div>
                    </div>
                </motion.div>
            </div>

            <div className="pm-card">
                <div className="pm-card-header">
                    <div className="pm-card-title">
                        <div className="pm-card-icon indigo"><Briefcase size={22} /></div>
                        <div>
                            <h3>Global Portfolios</h3>
                            <div className="pm-card-subtitle">Read-only view of assigned project blueprints.</div>
                        </div>
                    </div>
                    <div className="pm-card-actions">
                        <div className="pm-search-wrap">
                            <Search size={14} className="pm-search-icon" />
                            <input type="text" placeholder="Lookup blueprint..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pm-search-input" />
                        </div>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={fetchData} className="pm-btn pm-btn-outline"><RefreshCw size={16} /></motion.button>
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
                                        <th>Node Identifier</th>
                                        <th>Blueprint Name</th>
                                        <th>Origin Client</th>
                                        <th>Lifecycle Tracker</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(p => (
                                        <tr key={p._id}>
                                            <td><span className="modern-table-cell-subtitle amber">{p.projectId}</span></td>
                                            <td><span className="modern-table-cell-title">{p.name}</span></td>
                                            <td><span className="modern-table-cell-info muted">{p.client?.firstName} {p.client?.lastName}</span></td>
                                            <td><span className="modern-table-cell-value green" style={{ fontSize: '0.8rem' }}>
                                                {p.startDate ? `Active Since: ${new Date(p.startDate).toLocaleDateString()}` : 'Awaiting Kickoff Protocol'}
                                            </span></td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && <tr><td colSpan="4" className="modern-table-empty">Zero records match current matrix.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProjectCatalog;
