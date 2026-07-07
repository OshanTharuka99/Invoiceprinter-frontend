import React from 'react';

const SalesReturnTemplate = React.forwardRef(({ salesReturn, business }, ref) => {
    if (!salesReturn || !business) return null;

    const b = business;
    const sr = salesReturn;
    const currencySymbol = b.primaryCurrency?.symbol || 'Rs.';

    const fmt = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const money = (n) => parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const clientName = sr.clientRef
        ? `${sr.clientRef.firstName || ''} ${sr.clientRef.lastName || ''}`.trim()
        : sr.manualClientDetails?.organization || sr.manualClientDetails?.name || '—';

    const preparedBy = sr.createdBy
        ? `${sr.createdBy.firstName || ''} ${sr.createdBy.lastName || ''}`.trim()
        : '—';

    const docTerms = (sr.terms && sr.terms.trim()) ? sr.terms.trim() : (b.salesReturnTerms || '');
    const docNotes = (sr.notes && sr.notes.trim()) ? sr.notes.trim() : (b.salesReturnNotes || '');
    const showTerms = !!docTerms;
    const showNotes = !!docNotes;

    const FONT = "'Arial', 'Helvetica Neue', sans-serif";
    const DARK = '#0f172a';
    const MID = '#475569';
    const LIGHT = '#94a3b8';
    const BORDER = '#e2e8f0';
    const TITLE_COLOR = b.salesReturnTitleColor || '#b91c1c';
    const DIVIDER_COLOR = b.salesReturnDividerColor || '#b91c1c';
    const PAGE_W = b.pageWidth || 210;
    const PAGE_H = b.pageHeight || 297;

    return (
        <div ref={ref} data-salesreturntemplate style={{
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
            padding: '12mm 14mm 14mm 14mm',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ maxWidth: '52%' }}>
                    {b.quotationLogo
                        ? <img src={b.quotationLogo} alt="Logo" style={{ maxHeight: '75px', maxWidth: '180px', objectFit: 'contain', display: 'block', marginBottom: '8px' }} />
                        : <div style={{ fontFamily: FONT, fontSize: '20px', fontWeight: '900', color: DARK, marginBottom: '6px' }}>{b.businessName}</div>
                    }
                    <div style={{ color: MID, fontSize: '11.5px', lineHeight: '1.75' }}>
                        {b.businessName && <div>{b.businessName}</div>}
                        {b.address && <div>{b.address}</div>}
                        {b.phoneNumber && <div>Tel: {b.phoneNumber}</div>}
                        {b.email && <div>Email: {b.email}</div>}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: TITLE_COLOR, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
                        SALES RETURN NOTE
                    </div>
                    <table style={{ marginLeft: 'auto', borderCollapse: 'collapse' }}>
                        <tbody>
                            <tr><td style={{ padding: '3px 10px 3px 0', color: LIGHT, fontWeight: '600', fontSize: '11px', textAlign: 'right' }}>Return No:</td><td style={{ fontFamily: 'monospace', fontWeight: '800' }}>{sr.returnNumber}</td></tr>
                            <tr><td style={{ padding: '3px 10px 3px 0', color: LIGHT, fontWeight: '600', fontSize: '11px', textAlign: 'right' }}>Date:</td><td style={{ fontWeight: '700' }}>{fmt(sr.returnDate || sr.createdAt)}</td></tr>
                            <tr><td style={{ padding: '3px 10px 3px 0', color: LIGHT, fontWeight: '600', fontSize: '11px', textAlign: 'right' }}>Source:</td><td style={{ fontWeight: '700' }}>{sr.sourceNumber || '—'}</td></tr>
                            <tr><td style={{ padding: '3px 10px 3px 0', color: LIGHT, fontWeight: '600', fontSize: '11px', textAlign: 'right' }}>Payment:</td><td style={{ fontWeight: '700' }}>{sr.paymentMethodAtSale || '—'}</td></tr>
                            <tr><td style={{ padding: '3px 10px 3px 0', color: LIGHT, fontWeight: '600', fontSize: '11px', textAlign: 'right' }}>Prepared By:</td><td style={{ fontWeight: '700' }}>{preparedBy}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ height: '4px', background: DIVIDER_COLOR, margin: '14px 0 16px' }} />

            <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', color: LIGHT, marginBottom: '7px' }}>Customer</div>
                <div style={{ color: DARK, fontWeight: '700' }}>{clientName}</div>
                {(sr.clientRef?.address || sr.manualClientDetails?.address) && <div style={{ color: MID }}>{sr.clientRef?.address || sr.manualClientDetails?.address}</div>}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                    <tr style={{ background: DIVIDER_COLOR, color: '#fff' }}>
                        <th style={{ padding: '9px 10px', textAlign: 'left', fontWeight: '700', fontSize: '11.5px', width: '5%' }}>No</th>
                        <th style={{ padding: '9px 10px', textAlign: 'left', fontWeight: '700', fontSize: '11.5px', width: '45%' }}>Description</th>
                        <th style={{ padding: '9px 10px', textAlign: 'center', fontWeight: '700', fontSize: '11.5px', width: '10%' }}>Qty</th>
                        <th style={{ padding: '9px 10px', textAlign: 'right', fontWeight: '700', fontSize: '11.5px', width: '20%' }}>Unit Price</th>
                        <th style={{ padding: '9px 10px', textAlign: 'right', fontWeight: '700', fontSize: '11.5px', width: '20%' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {(sr.items || []).map((item, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff', borderBottom: `1px solid ${BORDER}` }}>
                            <td style={{ padding: '8px 10px', color: LIGHT }}>{i + 1}</td>
                            <td style={{ padding: '8px 10px', color: DARK, fontWeight: '600' }}>
                                {item.productRef?.name || item.manualName || 'Item'}
                                {item.serialNumbers?.length > 0 && (
                                    <div style={{ color: MID, fontSize: '10px', marginTop: '2px' }}>Serials: {item.serialNumbers.join(', ')}</div>
                                )}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', color: MID }}>{item.quantity}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', color: MID }}>{money(item.unitPrice)}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', color: DARK, fontWeight: '700' }}>{money(item.lineTotal)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                <table style={{ width: '340px', borderCollapse: 'collapse', border: `1px solid ${BORDER}` }}>
                    <tbody>
                        <tr>
                            <td style={{ color: '#fff', fontWeight: '900', fontSize: '13.5px', padding: '12px 14px', background: DIVIDER_COLOR }}>Return Amount</td>
                            <td style={{ color: '#fff', fontWeight: '900', fontSize: '14.5px', padding: '12px 14px', background: DIVIDER_COLOR, textAlign: 'right' }}>{currencySymbol} {money(sr.returnAmount)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {(sr.returnStockLocation || sr.reason) && (
                <div style={{ marginBottom: '18px' }}>
                    {sr.returnStockLocation && <div style={{ color: MID }}><strong style={{ color: DARK }}>Return Stock Location:</strong> {sr.returnStockLocation}</div>}
                    {sr.reason && <div style={{ color: MID, whiteSpace: 'pre-wrap' }}><strong style={{ color: DARK }}>Reason:</strong> {sr.reason}</div>}
                </div>
            )}

            {(showTerms || showNotes) && (
                <div style={{ marginBottom: '14px' }}>
                    {showTerms && <div style={{ color: MID, whiteSpace: 'pre-wrap', marginBottom: '8px' }}><strong style={{ color: DARK }}>Terms:</strong> {docTerms}</div>}
                    {showNotes && <div style={{ color: MID, whiteSpace: 'pre-wrap' }}><strong style={{ color: DARK }}>Notes:</strong> {docNotes}</div>}
                </div>
            )}

            {/* SIGNATURES */}
            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', gap: '1rem', paddingTop: '20px' }}>
                <div style={{ textAlign: 'center', flex: 1, maxWidth: '200px' }}>
                    <div style={{ borderBottom: `1px solid ${BORDER}`, marginBottom: '8px', minHeight: '50px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '4px' }}>
                        <span style={{ fontFamily: FONT, fontSize: '12px', fontWeight: '700', color: DARK }}>{preparedBy}</span>
                    </div>
                    <div style={{ fontFamily: FONT, fontSize: '10px', fontWeight: '900', color: MID, textTransform: 'uppercase' }}>Prepared By</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1, maxWidth: '200px' }}>
                    <div style={{ borderBottom: `1px solid ${BORDER}`, marginBottom: '8px', height: '50px' }} />
                    <div style={{ fontFamily: FONT, fontSize: '10px', fontWeight: '900', color: MID, textTransform: 'uppercase' }}>Checked By</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1, maxWidth: '200px' }}>
                    <div style={{ borderBottom: `1px solid ${BORDER}`, marginBottom: '8px', height: '50px' }} />
                    <div style={{ fontFamily: FONT, fontSize: '10px', fontWeight: '900', color: MID, textTransform: 'uppercase' }}>Authorized By</div>
                </div>
            </div>

            <div className="sales-return-print-footer" style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', background: '#fff' }}>
                <div style={{ fontSize: '10px', color: LIGHT, fontStyle: 'italic' }}><span className="page-number-target"></span></div>
                <div style={{ fontSize: '10px', color: LIGHT, textAlign: 'right' }}>{b.businessName} | {fmt(sr.createdAt || new Date())}</div>
            </div>
        </div>
    );
});

SalesReturnTemplate.displayName = 'SalesReturnTemplate';

export default SalesReturnTemplate;
