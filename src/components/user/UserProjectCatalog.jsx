import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, RefreshCw, Briefcase, ChevronRight } from 'lucide-react';
import api from '../../api';

const UserProjectCatalog = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/projects');
            setProjects(res.data.data);
        } catch (error) {
            console.error("Failed database read");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const filtered = projects.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.projectId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const cardStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><RefreshCw className="animate-spin" color="#64748b" /></div>
            ) : (
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 800, color: '#0f172a' }}>Global Portfolios</h1>
                            <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>Read-only view of assigned project blueprints. Escalation required for structural modification.</p>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} title="Secure Lookup" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input type="text" placeholder="Lookup Blueprint..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', width: 280, outline: 'none', fontFamily: "'Outfit', sans-serif" }} />
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Node Identifier</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Blueprint Name</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Origin Client</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Lifecycle Tracker</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => (
                                <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '1rem', fontWeight: 800, color: '#f59e0b', fontSize: '0.9rem' }}>{p.projectId}</td>
                                    <td style={{ padding: '1rem', fontWeight: 700, color: '#0f172a' }}>{p.name}</td>
                                    <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>{p.client?.firstName} {p.client?.lastName}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#059669', fontWeight: 700 }}>
                                        {p.startDate ? `Active Since: ${new Date(p.startDate).toLocaleDateString()}` : 'Awaiting Kickoff Protocol'}
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Zero records match current matrix.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default UserProjectCatalog;
