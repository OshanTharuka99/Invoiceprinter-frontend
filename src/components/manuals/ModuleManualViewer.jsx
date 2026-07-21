import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Printer, X } from 'lucide-react';
import { openA4PrintWindow } from '../../utils/printDocument';
import '../../styles/print-preview.css';

const ManualDocument = React.forwardRef(({ title, accent = '#0f172a', business, overview, sections = [] }, ref) => {
    const b = business || {};
    const FONT = "'Arial', 'Helvetica Neue', sans-serif";
    const DARK = '#0f172a';
    const MID = '#475569';
    const LIGHT = '#64748b';
    const BORDER = '#e2e8f0';
    const PAGE_W = 210;

    const Section = ({ num, title: secTitle, children }) => (
        <div style={{ marginBottom: '18px', pageBreakInside: 'avoid' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{
                    background: accent, color: '#fff', fontWeight: 800, fontSize: '11px',
                    width: '24px', height: '24px', borderRadius: '6px', display: 'inline-flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{num}</span>
                <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: DARK }}>{secTitle}</h2>
            </div>
            <div style={{ paddingLeft: '34px', color: MID, fontSize: '11.5px', lineHeight: 1.75 }}>{children}</div>
        </div>
    );

    const renderBlocks = (blocks = []) => blocks.map((block, i) => {
        if (block.type === 'p') {
            return <p key={i} style={{ margin: '0 0 8px' }}>{block.text}</p>;
        }
        if (block.type === 'step') {
            return (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 800, color: accent, minWidth: '18px' }}>{block.n}.</span>
                    <span>{block.text}</span>
                </div>
            );
        }
        return (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                <span style={{ color: accent }}>•</span>
                <span>{block.text}</span>
            </div>
        );
    });

    return (
        <div ref={ref} data-modulemanual style={{
            background: '#fff', color: DARK, fontFamily: FONT, fontSize: '12px', lineHeight: 1.6,
            boxSizing: 'border-box', width: `${PAGE_W}mm`, margin: '0 auto', padding: '14mm 16mm 16mm 16mm',
        }}>
            <div style={{ borderBottom: `3px solid ${accent}`, paddingBottom: '12px', marginBottom: '20px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: LIGHT, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '6px' }}>
                    User Manual
                </div>
                <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: accent, letterSpacing: '0.5px' }}>
                    {title}
                </h1>
                <div style={{ marginTop: '6px', fontSize: '11px', color: MID }}>
                    {b.businessName || 'InvoPrint System'} &nbsp;|&nbsp; Version 1.0 &nbsp;|&nbsp; {new Date().toLocaleDateString('en-GB')}
                </div>
            </div>

            {overview && (
                <div style={{
                    background: `${accent}12`, border: `1px solid ${accent}44`, borderRadius: '8px',
                    padding: '12px 14px', marginBottom: '20px',
                }}>
                    <strong style={{ color: accent }}>Overview</strong>
                    <p style={{ margin: '6px 0 0', color: MID, fontSize: '11.5px', lineHeight: 1.7 }}>{overview}</p>
                </div>
            )}

            {sections.map((sec, idx) => (
                <Section key={sec.title || idx} num={idx + 1} title={sec.title}>
                    {renderBlocks(sec.blocks)}
                </Section>
            ))}

            <div style={{
                marginTop: '28px', paddingTop: '14px', borderTop: `1px solid ${BORDER}`,
                fontSize: '10.5px', color: LIGHT, textAlign: 'center',
            }}>
                End of User Manual — {b.businessName || 'InvoPrint'} — Use A4 Print / PDF to save this guide
            </div>
        </div>
    );
});

ManualDocument.displayName = 'ManualDocument';

export function ManualButton({ onClick, className = 'pm-btn pm-btn-outline' }) {
    return (
        <motion.button whileTap={{ scale: 0.95 }} type="button" className={className} onClick={onClick}>
            <BookOpen size={16} /> User Manual
        </motion.button>
    );
}

export default function ModuleManualViewer({
    open,
    onClose,
    title,
    accent,
    overview,
    sections,
    business,
    fileName,
}) {
    const printRef = useRef();
    if (!open) return null;

    const handlePrint = () => {
        openA4PrintWindow(
            printRef.current,
            fileName || `${String(title || 'User_Manual').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`,
        );
    };

    return (
        <div className="app-print-overlay" style={{ zIndex: 1400 }}>
            <div className="app-print-shell" style={{ maxWidth: '210mm' }}>
                <div className="app-print-toolbar">
                    <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={handlePrint} className="app-print-btn">
                        <Printer size={18} /> A4 Print / PDF
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={onClose} className="app-print-close">
                        <X size={20} />
                    </motion.button>
                </div>
                <div className="app-print-doc" ref={printRef}>
                    <ManualDocument
                        title={title}
                        accent={accent}
                        business={business}
                        overview={overview}
                        sections={sections}
                    />
                </div>
            </div>
        </div>
    );
}
