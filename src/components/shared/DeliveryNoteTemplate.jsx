import React from 'react';

const DeliveryNoteTemplate = React.forwardRef(({ deliveryNote, business }, ref) => {
    if (!deliveryNote || !business) return null;

    const b = business;
    const dn = deliveryNote;

    const fmt = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const getClient = () => {
        if (dn.clientRef) {
            const c = dn.clientRef;
            const isOrg = c.clientType === 'Organization';
            return {
                org: isOrg ? c.firstName : '',
                name: isOrg ? '' : `${c.firstName || ''} ${c.lastName || ''}`.trim(),
                address: c.address || '', phone: c.telephoneNumber || '', email: c.emailAddress || ''
            };
        }
        const m = dn.manualClientDetails || {};
        const isOrg = m.title === 'Organization';
        return {
            org: m.organization || (isOrg ? m.name : ''),
            name: isOrg ? '' : `${m.title ? m.title + '. ' : ''}${m.name || ''}`.trim(),
            address: m.address || '', phone: m.telephoneNumber || '', email: m.emailAddress || ''
        };
    };

    const client = getClient();

    const FONT = "'Arial', 'Helvetica Neue', sans-serif";
    const DARK = '#0f172a';
    const MID = '#475569';
    const LIGHT = '#94a3b8';
    const BORDER = '#e2e8f0';
    const TITLE_COLOR = b.deliveryNoteTitleColor || '#8b5cf6';
    const DIVIDER_COLOR = b.deliveryNoteDividerColor || '#8b5cf6';
    const PAGE_W = b.pageWidth || 210;
    const PAGE_H = b.pageHeight || 297;

    const sectionTitle = {
        fontSize: '10px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: DARK,
        borderBottom: `1.5px solid ${BORDER}`,
        paddingBottom: '5px',
        marginBottom: '8px'
    };

    const showTerms = dn.terms && dn.terms.trim() !== '';
    const showNotes = dn.notes && dn.notes.trim() !== '';
    const showVatNo = b.isVatRegistered && b.vatNumber && b.vatNumber.trim() !== '';

    return (
        <div ref={ref} data-dntemplate style={{
            background: '#fff',
            color: DARK,
            fontFamily: FONT,
            fontSize: '12px',
            lineHeight: '1.6',
            boxSizing: 'border-box',
            width: `${PAGE_W}mm`,
            minHeight: `${PAGE_H}mm`,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            padding: '12mm 14mm 14mm 14mm'
        }}>

            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ maxWidth: '52%' }}>
                    {b.quotationLogo
                        ? <img src={b.quotationLogo} alt="Logo" style={{ maxHeight: '75px', maxWidth: '180px', objectFit: 'contain', display: 'block', marginBottom: '8px' }} />
                        : <div style={{ fontFamily: FONT, fontSize: '20px', fontWeight: '900', color: DARK, marginBottom: '6px' }}>{b.businessName}</div>
                    }
                    <div style={{ fontFamily: FONT, color: MID, fontSize: '11.5px', lineHeight: '1.75' }}>
                        {b.businessName && <div>{b.businessName}</div>}
                        {b.address && <div>{b.address}</div>}
                        {b.phoneNumber && <div>Tel: {b.phoneNumber}</div>}
                        {b.email && <div>Email: {b.email}</div>}
                        {showVatNo && <div style={{ color: DARK, fontWeight: '700', marginTop: '4px' }}>TAX ID : {b.vatNumber}</div>}
                    </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: FONT, fontSize: '28px', fontWeight: '900', color: TITLE_COLOR, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
                        Delivery Note
                    </div>
                    <table style={{ marginLeft: 'auto', borderCollapse: 'collapse' }}>
                        <tbody>
                            {[
                                { label: 'Delivery Note No', value: dn.deliveryNoteNumber, mono: true, large: true },
                                { label: 'Date', value: fmt(dn.createdAt || new Date()) },
                                { label: 'Prepared By', value: `${dn.createdBy?.firstName || ''} ${dn.createdBy?.lastName || ''}`.trim() }
                            ].map(({ label, value, mono, large }) => (
                                <tr key={label}>
                                    <td style={{ fontFamily: FONT, padding: '3px 10px 3px 0', color: LIGHT, fontWeight: '600', fontSize: '11px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                        {label}:
                                    </td>
                                    <td style={{
                                        fontFamily: mono ? 'monospace' : FONT,
                                        padding: '3px 0',
                                        color: DARK,
                                        fontWeight: large ? '800' : '700',
                                        fontSize: large ? '13px' : '12px'
                                    }}>
                                        {value}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DIVIDER */}
            <div style={{ height: '4px', background: DIVIDER_COLOR, margin: '14px 0 16px' }} />

            {/* CLIENT & DELIVERY ADDRESS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: FONT, fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', color: LIGHT, marginBottom: '7px' }}>
                        Deliver To
                    </div>
                    <div style={{ fontFamily: FONT, lineHeight: '1.8' }}>
                        {client.org && <div style={{ fontWeight: '800', fontSize: '14px', color: DARK }}>{client.org}</div>}
                        {client.name && <div style={{ fontWeight: '700', fontSize: client.org ? '12.5px' : '14px', color: DARK }}>{client.name}</div>}
                        {client.address && <div style={{ color: MID, fontSize: '12px' }}>{client.address}</div>}
                        {client.phone && <div style={{ color: MID, fontSize: '12px' }}>Tel: {client.phone}</div>}
                        {client.email && <div style={{ color: MID, fontSize: '12px' }}>Email: {client.email}</div>}
                    </div>
                </div>

                {dn.deliveryAddress && (
                    <div style={{ flex: 1, textAlign: 'right' }}>
                        <div style={{ fontFamily: FONT, fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', color: LIGHT, marginBottom: '7px' }}>
                            Delivery Address
                        </div>
                        <div style={{ fontFamily: FONT, lineHeight: '1.8', color: MID, fontSize: '12px' }}>
                            {dn.deliveryAddress.split('\n').map((line, i) => (
                                <div key={i}>{line}</div>
                            ))}
                        </div>
                        {dn.deliveryType === 'Store' && dn.selectedStoreRef && (
                            <div style={{ fontFamily: FONT, fontSize: '11px', color: LIGHT, marginTop: '4px', fontStyle: 'italic' }}>
                                Store: {dn.selectedStoreRef}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ITEMS TABLE */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                    <tr style={{ background: DIVIDER_COLOR, color: '#fff' }}>
                        <th style={{ fontFamily: FONT, padding: '9px 10px', textAlign: 'left', fontWeight: '700', fontSize: '11.5px', width: '5%' }}>No</th>
                        <th style={{ fontFamily: FONT, padding: '9px 10px', textAlign: 'left', fontWeight: '700', fontSize: '11.5px', width: '50%' }}>Description</th>
                        <th style={{ fontFamily: FONT, padding: '9px 10px', textAlign: 'center', fontWeight: '700', fontSize: '11.5px', width: '10%' }}>Qty</th>
                        <th style={{ fontFamily: FONT, padding: '9px 10px', textAlign: 'left', fontWeight: '700', fontSize: '11.5px', width: '35%' }}>Serial Numbers</th>
                    </tr>
                </thead>
                <tbody>
                    {dn.items.map((item, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff', borderBottom: `1px solid ${BORDER}` }}>
                            <td style={{ fontFamily: FONT, padding: '8px 10px', color: LIGHT, fontSize: '12px' }}>{i + 1}</td>
                            <td style={{ fontFamily: FONT, padding: '8px 10px', color: DARK, fontSize: '12px', fontWeight: '600' }}>
                                {item.productRef ? item.productRef.name : item.manualName}
                            </td>
                            <td style={{ fontFamily: FONT, padding: '8px 10px', color: MID, fontSize: '12px', textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ fontFamily: FONT, padding: '8px 10px', color: MID, fontSize: '12px' }}>
                                {item.serialNumbers && item.serialNumbers.length > 0
                                    ? item.serialNumbers.map((sn, si) => (
                                        <span key={si} style={{
                                            display: 'inline-block',
                                            background: '#f1f5f9',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontFamily: 'monospace',
                                            margin: '2px 4px 2px 0',
                                            color: DARK
                                        }}>
                                            {sn}
                                        </span>
                                    ))
                                    : <span style={{ color: LIGHT, fontStyle: 'italic' }}>—</span>
                                }
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* DIVIDER */}
            <div style={{ height: '4px', background: DIVIDER_COLOR, margin: '14px 0 16px' }} />

            {/* TERMS */}
            {showTerms && (
                <div style={{ marginBottom: '14px', paddingBottom: '14px' }}>
                    <div style={{ ...sectionTitle, fontFamily: FONT }}>Delivery Terms</div>
                    <div style={{ fontFamily: FONT, fontSize: '11.5px', color: MID, lineHeight: '1.75', whiteSpace: 'pre-wrap' }}>
                        {dn.terms}
                    </div>
                </div>
            )}

            {/* NOTES */}
            {showNotes && (
                <div style={{ marginBottom: '14px', paddingBottom: '14px' }}>
                    <div style={{ ...sectionTitle, fontFamily: FONT }}>Notes</div>
                    <div style={{ fontFamily: FONT, fontSize: '11.5px', color: MID, lineHeight: '1.75', whiteSpace: 'pre-wrap' }}>
                        {dn.notes}
                    </div>
                </div>
            )}

            {/* FOOTER */}
            <div className="delivery-print-footer" style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', background: '#fff' }}>
                <div style={{ fontFamily: FONT, fontSize: '10px', color: LIGHT, fontStyle: 'italic' }}>
                    <span className="page-number-target"></span>
                </div>
                <div style={{ fontFamily: FONT, fontSize: '10px', color: LIGHT, textAlign: 'right' }}>
                    {b.businessName} &nbsp;|&nbsp; {fmt(dn.createdAt || new Date())}
                </div>
            </div>

            {/* PRINT CSS */}
            <style>{`
                @media print {
                    @page { size: ${PAGE_W}mm ${PAGE_H}mm portrait; margin: 14mm 15mm 20mm 15mm; }
                    body { margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
                    div[data-dntemplate] { padding: 0 !important; width: 100% !important; margin: 0 !important; position: relative !important; }
                    * { box-shadow: none !important; }
                    tr { page-break-inside: avoid; }
                    .delivery-print-footer { position: fixed !important; bottom: 0 !important; left: 0 !important; width: 100% !important; padding-bottom: 2mm !important; background: white !important; z-index: 10; }
                    .page-number-target::before { counter-increment: page; content: "Page " counter(page); }
                }
            `}</style>
        </div>
    );
});

DeliveryNoteTemplate.displayName = 'DeliveryNoteTemplate';

export default DeliveryNoteTemplate;
