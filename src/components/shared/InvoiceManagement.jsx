import React from 'react';

const InvoiceManagement = ({ currentUser, showToast }) => {
    return (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ width: 64, height: 64, background: '#f8fafc', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '24px' }}>📄</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', fontFamily: "'Outfit', sans-serif" }}>Invoice Engine</h2>
            <p style={{ color: '#64748b', fontSize: '1rem', fontFamily: "'Outfit', sans-serif" }}>This module is currently being synchronized for functional parity. Check back soon.</p>
        </div>
    );
};

export default InvoiceManagement;
