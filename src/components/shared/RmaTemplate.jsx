import React from 'react';

const RmaTemplate = React.forwardRef(({ rma, business }, ref) => {
    if (!rma || !business) return null;

    const b = business;
    const FONT = "'Arial', 'Helvetica Neue', sans-serif";
    const DARK = '#0f172a';
    const MID = '#475569';
    const BORDER = '#e2e8f0';
    const TITLE_COLOR = b.rmaTitleColor || '#c2410c';
    const DIVIDER_COLOR = b.rmaDividerColor || '#c2410c';
    const PAGE_W = b.pageWidth || 210;
    const PAGE_H = b.pageHeight || 297;

    const fmt = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const customerName = rma.customerDetails?.name
        || (rma.clientRef ? `${rma.clientRef.firstName || ''} ${rma.clientRef.lastName || ''}`.trim() : '—');
    const preparedBy = rma.createdBy
        ? `${rma.createdBy.firstName || ''} ${rma.createdBy.lastName || ''}`.trim()
        : '—';
    const assignees = (rma.assignees || [])
        .map((u) => `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username)
        .filter(Boolean);
    const underWarrantyLabel = rma.replacement?.replaced
        ? (rma.replacement.newWarrantyPeriod ? 'Under Warranty (New Device)' : 'Warranty N/A')
        : (rma.underWarranty ? 'Under Warranty' : 'Out of Warranty / No Warranty');

    const docTerms = (rma.terms && rma.terms.trim()) ? rma.terms.trim() : (b.rmaTerms || '');
    const docNotes = (rma.notes && rma.notes.trim()) ? rma.notes.trim() : (b.rmaNotes || '');

    return (
        <div ref={ref} data-rmatemplate style={{
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
            padding: '14mm 15mm',
            position: 'relative',
        }}>
            {rma.status === 'Cancelled' && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-30deg)',
                    fontSize: '120px', fontWeight: 900,
                    color: 'rgba(239, 68, 68, 0.12)',
                    textTransform: 'uppercase', letterSpacing: '10px',
                    pointerEvents: 'none', zIndex: 0, whiteSpace: 'nowrap',
                }}>
                    CANCELLED
                </div>
            )}

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ maxWidth: '55%' }}>
                    {b.quotationLogo
                        ? <img src={b.quotationLogo} alt="Logo" style={{ maxHeight: '70px', maxWidth: '170px', objectFit: 'contain', marginBottom: '8px' }} />
                        : <div style={{ fontSize: '18px', fontWeight: 900, marginBottom: '6px' }}>{b.businessName}</div>}
                    <div style={{ color: MID, fontSize: '11px', lineHeight: 1.7 }}>
                        {b.businessName && <div>{b.businessName}</div>}
                        {b.address && <div>{b.address}</div>}
                        {b.phoneNumber && <div>Tel: {b.phoneNumber}</div>}
                        {b.email && <div>Email: {b.email}</div>}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '26px', fontWeight: 900, color: TITLE_COLOR, letterSpacing: '1px' }}>RMA NOTE</div>
                    <div style={{ marginTop: '8px', fontWeight: 800 }}>{rma.jobNumber}</div>
                    <div style={{ color: MID, fontSize: '11px' }}>Date: {fmt(rma.createdAt)}</div>
                    <div style={{
                        marginTop: '8px', display: 'inline-block', padding: '3px 10px', borderRadius: '999px',
                        background: rma.underWarranty || rma.replacement?.newWarrantyPeriod ? '#d1fae5' : '#fee2e2',
                        color: rma.underWarranty || rma.replacement?.newWarrantyPeriod ? '#047857' : '#b91c1c',
                        fontWeight: 800, fontSize: '10px',
                    }}>
                        {underWarrantyLabel}
                    </div>
                </div>
            </div>

            <div style={{ height: '3px', background: DIVIDER_COLOR, margin: '14px 0', position: 'relative', zIndex: 1 }} />

            <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div style={{ border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: TITLE_COLOR, textTransform: 'uppercase', marginBottom: '6px' }}>Customer</div>
                    <div style={{ fontWeight: 800 }}>{customerName}</div>
                    <div style={{ color: MID }}>{rma.customerDetails?.telephoneNumber || rma.clientRef?.telephoneNumber || '—'}</div>
                    <div style={{ color: MID }}>{rma.customerDetails?.emailAddress || rma.clientRef?.emailAddress || '—'}</div>
                    {(rma.customerDetails?.address || rma.clientRef?.address) && (
                        <div style={{ color: MID }}>{rma.customerDetails?.address || rma.clientRef?.address}</div>
                    )}
                </div>
                <div style={{ border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: TITLE_COLOR, textTransform: 'uppercase', marginBottom: '6px' }}>Project / Supplier</div>
                    <div><strong>Project:</strong> {rma.projectDetails?.name || rma.projectRef?.name || '—'}</div>
                    <div style={{ color: MID }}>{rma.projectDetails?.location || rma.projectRef?.location || ''}</div>
                    <div style={{ marginTop: '6px' }}><strong>Supplier:</strong> {rma.supplierDetails?.name || rma.supplierRef?.name || '—'}</div>
                    <div style={{ color: MID }}>{rma.supplierDetails?.telephoneNumber || rma.supplierRef?.telephoneNumber || ''}</div>
                </div>
            </div>

            <div style={{ position: 'relative', zIndex: 1, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 12px', marginBottom: '14px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: TITLE_COLOR, textTransform: 'uppercase', marginBottom: '6px' }}>Device</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <div><div style={{ color: MID, fontSize: '10px' }}>Product</div><div style={{ fontWeight: 700 }}>{rma.productName || rma.productRef?.name || '—'}</div></div>
                    <div><div style={{ color: MID, fontSize: '10px' }}>Serial</div><div style={{ fontWeight: 700, fontFamily: 'monospace' }}>{rma.serialNumber}</div></div>
                    <div><div style={{ color: MID, fontSize: '10px' }}>Invoice / DN</div><div style={{ fontWeight: 700 }}>{rma.invoiceNumber || '—'}</div></div>
                </div>
                {rma.replacement?.replaced && (
                    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: `1px dashed ${BORDER}` }}>
                        <div style={{ fontWeight: 800, color: '#047857' }}>Replaced Device</div>
                        <div>New SN: <strong style={{ fontFamily: 'monospace' }}>{rma.replacement.newSerialNumber}</strong></div>
                        <div>Warranty Period: <strong>{rma.replacement.newWarrantyPeriod || '—'}</strong></div>
                        <div>Source: <strong>{rma.replacement.source === 'stock' ? 'Shop Stock' : 'Supplier'}</strong></div>
                    </div>
                )}
            </div>

            <div style={{ position: 'relative', zIndex: 1, marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: TITLE_COLOR, textTransform: 'uppercase', marginBottom: '4px' }}>Reported Fault</div>
                <div style={{ border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 12px', minHeight: '40px' }}>{rma.faultComment || '—'}</div>
            </div>

            {rma.diagnosis && (
                <div style={{ position: 'relative', zIndex: 1, marginBottom: '12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: TITLE_COLOR, textTransform: 'uppercase', marginBottom: '4px' }}>Fault Diagnosis</div>
                    <div style={{ border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 12px' }}>{rma.diagnosis}</div>
                </div>
            )}

            <div style={{ position: 'relative', zIndex: 1, marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: TITLE_COLOR, textTransform: 'uppercase', marginBottom: '4px' }}>Assigned Users</div>
                <div>{assignees.length ? assignees.join(', ') : '—'}</div>
            </div>

            {(rma.statusHistory || []).length > 0 && (
                <div style={{ position: 'relative', zIndex: 1, marginBottom: '12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: TITLE_COLOR, textTransform: 'uppercase', marginBottom: '6px' }}>Status Log</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ textAlign: 'left', padding: '6px', border: `1px solid ${BORDER}` }}>Date</th>
                                <th style={{ textAlign: 'left', padding: '6px', border: `1px solid ${BORDER}` }}>Status</th>
                                <th style={{ textAlign: 'left', padding: '6px', border: `1px solid ${BORDER}` }}>By</th>
                                <th style={{ textAlign: 'left', padding: '6px', border: `1px solid ${BORDER}` }}>Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rma.statusHistory.map((h, idx) => (
                                <tr key={idx}>
                                    <td style={{ padding: '6px', border: `1px solid ${BORDER}` }}>{fmt(h.editedAt)}</td>
                                    <td style={{ padding: '6px', border: `1px solid ${BORDER}` }}>{h.status}</td>
                                    <td style={{ padding: '6px', border: `1px solid ${BORDER}` }}>
                                        {h.editedBy ? `${h.editedBy.firstName || ''} ${h.editedBy.lastName || ''}`.trim() : '—'}
                                    </td>
                                    <td style={{ padding: '6px', border: `1px solid ${BORDER}` }}>{h.note || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {(docTerms || docNotes) && (
                <div style={{ position: 'relative', zIndex: 1, marginBottom: '16px', fontSize: '11px', color: MID }}>
                    {docTerms && <div><strong>Terms:</strong> {docTerms}</div>}
                    {docNotes && <div style={{ marginTop: '4px' }}><strong>Notes:</strong> {docNotes}</div>}
                </div>
            )}

            <div style={{ flex: 1 }} />

            <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '20px' }}>
                <div>
                    <div style={{ borderBottom: `1px solid ${DARK}`, height: '40px', marginBottom: '6px' }} />
                    <div style={{ fontWeight: 800 }}>Prepared By</div>
                    <div>{preparedBy}</div>
                    <div style={{ color: MID, fontSize: '11px' }}>Organization staff</div>
                </div>
                <div>
                    <div style={{ borderBottom: `1px solid ${DARK}`, height: '40px', marginBottom: '6px' }} />
                    <div style={{ fontWeight: 800 }}>Customer Signature</div>
                    <div>{rma.customerSignature?.customerName || customerName}</div>
                    <div style={{ color: MID, fontSize: '11px' }}>
                        ID: {rma.customerSignature?.idCardNumber || rma.customerDetails?.idCardNumber || '____________________'}
                    </div>
                    <div style={{ color: MID, fontSize: '11px' }}>
                        Destination: {rma.customerSignature?.destination || rma.customerDetails?.destination || '____________________'}
                    </div>
                </div>
            </div>
        </div>
    );
});

RmaTemplate.displayName = 'RmaTemplate';
export default RmaTemplate;
