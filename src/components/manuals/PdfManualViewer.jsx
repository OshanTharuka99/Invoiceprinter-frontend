import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ExternalLink, Download, X } from 'lucide-react';
import '../../styles/print-preview.css';

const PdfManualViewer = ({ open, onClose, src, title = 'User Manual' }) => {
    if (!open) return null;

    return (
        <div className="app-print-overlay" style={{ zIndex: 1400 }}>
            <div className="app-print-shell" style={{ maxWidth: '210mm', height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
                <div className="app-print-toolbar" style={{ marginBottom: '0.75rem' }}>
                    <span style={{
                        background: '#eef2ff', color: '#3730a3', fontSize: '0.8rem', fontWeight: 800,
                        padding: '8px 14px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    }}>
                        <FileText size={15} /> {title}
                    </span>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        className="app-print-btn"
                        style={{ background: '#2563eb' }}
                        onClick={() => { const a = document.createElement('a'); a.href = src; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.click(); }}
                    >
                        <ExternalLink size={18} /> Open in new tab
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        className="app-print-btn"
                        style={{ background: '#8b5cf6' }}
                        onClick={() => { const a = document.createElement('a'); a.href = src; a.download = 'User-Manual.pdf'; a.click(); }}
                    >
                        <Download size={18} /> Download PDF
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={onClose} className="app-print-close">
                        <X size={20} />
                    </motion.button>
                </div>
                <div className="app-print-doc" style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', background: '#525659' }}>
                    <iframe
                        src={src}
                        title={title}
                        style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default PdfManualViewer;