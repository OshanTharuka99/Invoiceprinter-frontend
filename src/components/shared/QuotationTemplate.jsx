import React from 'react';

const QuotationTemplate = React.forwardRef(({ quotation, business }, ref) => {
    if (!quotation || !business) return null;

    const b = business;
    const q = quotation;

    /* ── Helpers ── */
    const currencySymbol = q.currency === 'primary'
        ? (b.primaryCurrency?.symbol || 'Rs.')
        : (b.secondaryCurrency?.symbol || '$');

    const fmt = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const money = (n) =>
        parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    /* ── Calculations ── */
    const discountTotal = q.discountTotal || (q.appliedDiscounts || []).reduce((sum, d) => sum + (d.amount || 0), 0);

    /* ── Client block ── */
    const getClient = () => {
        if (q.clientRef) {
            const c = q.clientRef;
            const isOrg = c.clientType === 'Organization';
            return {
                org: isOrg ? c.firstName : '',
                name: isOrg ? '' : `${c.firstName || ''} ${c.lastName || ''}`.trim(),
                address: c.address || '', phone: c.telephoneNumber || '', email: c.emailAddress || ''
            };
        }
        const m = q.manualClientDetails || {};
        const isOrg = m.title === 'Organization';
        return {
            org: m.organization || (isOrg ? m.name : ''),
            name: isOrg ? '' : `${m.title ? m.title + '. ' : ''}${m.name || ''}`.trim(),
            address: m.address || '', phone: m.telephoneNumber || '', email: m.emailAddress || ''
        };
    };

    const client = getClient();

    /* ── Visibility flags ── */
    const showTerms = b.quotationTerms && b.quotationTerms.trim() !== '';
    const showNotes = b.quotationNotes && b.quotationNotes.trim() !== '';
    const showVatNo = b.isVatRegistered && b.vatNumber && b.vatNumber.trim() !== '';
    const showValidDate = !!q.validDate;
    const showBank = !!(b.bankAccountNumber || b.bankName);

    /* ── Shared style tokens ── */
    const FONT = "'Arial', 'Helvetica Neue', sans-serif";
    const DARK = '#0f172a';
    const MID = '#475569';
    const LIGHT = '#94a3b8';
    const BORDER = '#e2e8f0';

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

    /* ── Render ── */
    return (
        <div ref={ref} style={{
            background: '#fff',
            color: DARK,
            fontFamily: FONT,
            fontSize: '12px',
            lineHeight: '1.6',
            boxSizing: 'border-box',
            width: '210mm',
            minHeight: '297mm',
            margin: '0 auto',
            /* padding handled by @page margin in print; for screen preview we add padding: */
            padding: '12mm 14mm 14mm 14mm'
        }}>

            {/* ── HEADER ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

                {/* Left: logo / company */}
                <div style={{ maxWidth: '52%' }}>
                    {b.quotationLogo
                        ? <img src={b.quotationLogo} alt="Logo"
                            style={{ maxHeight: '75px', maxWidth: '180px', objectFit: 'contain', display: 'block', marginBottom: '8px' }} />
                        : <div style={{ fontFamily: FONT, fontSize: '20px', fontWeight: '900', color: DARK, marginBottom: '6px' }}>{b.businessName}</div>
                    }
                    {b.quotationLogo && (
                        <div style={{ fontFamily: FONT, fontSize: '14px', fontWeight: '800', color: DARK, marginBottom: '5px' }}>{b.businessName}</div>
                    )}
                    <div style={{ fontFamily: FONT, color: MID, fontSize: '11.5px', lineHeight: '1.75' }}>
                        {b.address && <div>{b.address}</div>}
                        {b.phoneNumber && <div>Tel: {b.phoneNumber}</div>}
                        {b.email && <div>Email: {b.email}</div>}
                        {showVatNo && <div style={{ color: DARK, fontWeight: '700', marginTop: '4px' }}>TAX ID : {b.vatNumber}</div>}
                    </div>
                </div>

                {/* Right: QUOTATION title + meta */}
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: FONT, fontSize: '28px', fontWeight: '900', color: DARK, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
                        QUOTATION
                    </div>
                    <table style={{ marginLeft: 'auto', borderCollapse: 'collapse' }}>
                        <tbody>
                            {[
                                { label: 'Quotation No', value: q.quotationId, mono: true, large: true },
                                { label: 'Date', value: fmt(q.createdAt || new Date()) },
                                ...(showValidDate ? [{ label: 'Valid Until', value: fmt(q.validDate) }] : []),
                                { label: 'Prepared By', value: `${q.createdBy?.firstName || ''} ${q.createdBy?.lastName || ''}`.trim() }
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

            {/* ── DIVIDER ── */}
            <div style={{ height: '4px', background: DARK, margin: '14px 0 16px' }} />

            {/* ── BILL TO ── */}
            <div style={{ marginBottom: '18px' }}>
                <div style={{ fontFamily: FONT, fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', color: LIGHT, marginBottom: '7px' }}>
                    Quotation For
                </div>
                <div style={{ fontFamily: FONT, lineHeight: '1.8' }}>
                    {client.org && <div style={{ fontWeight: '800', fontSize: '14px', color: DARK }}>{client.org}</div>}
                    {client.name && <div style={{ fontWeight: '700', fontSize: client.org ? '12.5px' : '14px', color: DARK }}>{client.name}</div>}
                    {client.address && <div style={{ color: MID, fontSize: '12px' }}>{client.address}</div>}
                    {client.phone && <div style={{ color: MID, fontSize: '12px' }}>Tel: {client.phone}</div>}
                    {client.email && <div style={{ color: MID, fontSize: '12px' }}>Email: {client.email}</div>}
                </div>
            </div>

            {/* ── ITEMS TABLE ── */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                    <tr style={{ background: DARK, color: '#fff' }}>
                        <th style={{ fontFamily: FONT, padding: '9px 10px', textAlign: 'left', fontWeight: '700', fontSize: '11.5px', width: '5%' }}>No</th>
                        <th style={{ fontFamily: FONT, padding: '9px 10px', textAlign: 'left', fontWeight: '700', fontSize: '11.5px', width: '47%' }}>Description</th>
                        <th style={{ fontFamily: FONT, padding: '9px 10px', textAlign: 'center', fontWeight: '700', fontSize: '11.5px', width: '10%' }}>Qty</th>
                        <th style={{ fontFamily: FONT, padding: '9px 10px', textAlign: 'right', fontWeight: '700', fontSize: '11.5px', width: '19%' }}>Unit Price ({currencySymbol})</th>
                        <th style={{ fontFamily: FONT, padding: '9px 10px', textAlign: 'right', fontWeight: '700', fontSize: '11.5px', width: '19%' }}>Amount ({currencySymbol})</th>
                    </tr>
                </thead>
                <tbody>
                    {q.items.map((item, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff', borderBottom: `1px solid ${BORDER}` }}>
                            <td style={{ fontFamily: FONT, padding: '8px 10px', color: LIGHT, fontSize: '12px' }}>{i + 1}</td>
                            <td style={{ fontFamily: FONT, padding: '8px 10px', color: DARK, fontSize: '12px', fontWeight: '600' }}>
                                {item.productRef ? item.productRef.name : item.manualName}
                            </td>
                            <td style={{ fontFamily: FONT, padding: '8px 10px', color: MID, fontSize: '12px', textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ fontFamily: FONT, padding: '8px 10px', color: MID, fontSize: '12px', textAlign: 'right' }}>{money(item.unitPrice)}</td>
                            <td style={{ fontFamily: FONT, padding: '8px 10px', color: DARK, fontSize: '12px', fontWeight: '700', textAlign: 'right' }}>{money(item.lineTotal)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* ── TOTALS ── */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                <div style={{ width: '310px', border: `1px solid ${BORDER}`, borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 14px', background: '#f8fafc', borderBottom: `1px solid ${BORDER}` }}>
                        <span style={{ fontFamily: FONT, color: MID, fontWeight: '600', fontSize: '12.5px' }}>Subtotal</span>
                        <span style={{ fontFamily: FONT, color: DARK, fontWeight: '700', fontSize: '12.5px' }}>{currencySymbol} {money(q.subTotal)}</span>
                    </div>

                    {/* Multiple Discounts */}
                    {q.appliedDiscounts?.map((disc, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 14px', background: '#f8fafc', borderBottom: `1px solid ${BORDER}` }}>
                            <span style={{ fontFamily: FONT, color: '#000000ff', fontWeight: '600', fontSize: '12.5px' }}>
                                {disc.name} ({disc.type === 'percentage' ? disc.value + '%' : ''})
                            </span>
                            <span style={{ fontFamily: FONT, color: '#000000ff', fontWeight: '700', fontSize: '12.5px' }}>− {currencySymbol} {money(disc.amount)}</span>
                        </div>
                    ))}

                    {/* Multiple Taxes Array Support */}
                    {q.hasTax && q.appliedTaxes?.length > 0 && q.appliedTaxes.map((tax, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 14px', background: '#f8fafc', borderBottom: `1px solid ${BORDER}` }}>
                            <span style={{ fontFamily: FONT, color: '#000000ff', fontWeight: '600', fontSize: '12.5px' }}>
                                {tax.name} {tax.type === 'percentage' ? `(${tax.value}%)` : ''}
                            </span>
                            <span style={{ fontFamily: FONT, color: '#000000ff', fontWeight: '700', fontSize: '12.5px' }}>+ {currencySymbol} {money(tax.amount)}</span>
                        </div>
                    ))}

                    {/* Legacy Single Tax Support */}
                    {q.hasTax && (!q.appliedTaxes || q.appliedTaxes.length === 0) && q.taxPercentage > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 14px', background: '#f8fafc', borderBottom: `1px solid ${BORDER}` }}>
                            <span style={{ fontFamily: FONT, color: '#000000ff', fontWeight: '600', fontSize: '12.5px' }}>{q.taxName || 'VAT'} ({q.taxPercentage}%)</span>
                            <span style={{ fontFamily: FONT, color: '#000000ff', fontWeight: '700', fontSize: '12.5px' }}>+ {currencySymbol} {money(((q.subTotal - (q.discountTotal || 0)) * q.taxPercentage) / 100)}</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', background: DARK }}>
                        <span style={{ fontFamily: FONT, color: '#fff', fontWeight: '900', fontSize: '13.5px' }}>Total Amount</span>
                        <span style={{ fontFamily: FONT, color: '#fff', fontWeight: '900', fontSize: '14.5px' }}>{currencySymbol} {money(q.finalTotal)}</span>
                    </div>
                </div>
            </div>

            {/* ── DIVIDER ── */}
            <div style={{ height: '4px', background: DARK, margin: '14px 0 16px' }} />

            {/* ── GENERAL TERMS & CONDITIONS ── */}
            {showTerms && (
                <div style={{ marginBottom: '14px', paddingBottom: '14px' }}>
                    <div style={{ ...sectionTitle, fontFamily: FONT }}>General Terms &amp; Conditions</div>
                    <div style={{ fontFamily: FONT, fontSize: '11.5px', color: MID, lineHeight: '1.75', whiteSpace: 'pre-wrap' }}>
                        {b.quotationTerms}
                    </div>
                </div>
            )}

            {/* ── NOTE ── */}
            {showNotes && (
                <div style={{ marginBottom: '14px', paddingBottom: '14px', }}>
                    <div style={{ ...sectionTitle, fontFamily: FONT }}>Note</div>
                    <div style={{ fontFamily: FONT, fontSize: '11.5px', color: MID, lineHeight: '1.75', whiteSpace: 'pre-wrap' }}>
                        {b.quotationNotes}
                    </div>
                </div>
            )}

            {/* ── BANK DETAILS ── */}
            {showBank && (
                <div style={{ marginBottom: '18px' }}>
                    <div style={{ ...sectionTitle, fontFamily: FONT }}>Bank Details for Transfer</div>
                    <div style={{ fontFamily: FONT, fontSize: '12px', lineHeight: '1.85', color: DARK }}>
                        {b.bankAccountNumber && (
                            <div><span style={{ color: MID, fontWeight: '600', display: 'inline-block', width: '120px' }}>Account No:</span> <strong>{b.bankAccountNumber}</strong></div>
                        )}
                        {b.bankAccountName && (
                            <div><span style={{ color: MID, fontWeight: '600', display: 'inline-block', width: '120px' }}>Account Name:</span> <strong>{b.bankAccountName}</strong></div>
                        )}
                        {b.bankName && (
                            <div><span style={{ color: MID, fontWeight: '600', display: 'inline-block', width: '120px' }}>Bank:</span> <strong>{b.bankName}</strong></div>
                        )}
                        {b.branchName && (
                            <div><span style={{ color: MID, fontWeight: '600', display: 'inline-block', width: '120px' }}>Branch:</span> <strong>{b.branchName}</strong></div>
                        )}
                    </div>
                    <br />
                    <div><p style={{ color: MID, fontWeight: '600', display: 'inline-block', fontStyle: 'italic', fontFamily: FONT, fontWeight: 'bold', color: '#000000ff' }}>This is a computer generated document and does not require a signature.</p></div>
                </div>


            )}

            {/* ── FOOTER ── */}
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: FONT, fontSize: '10px', color: LIGHT, fontStyle: 'italic' }}>

                </div>
                <div style={{ fontFamily: FONT, fontSize: '10px', color: LIGHT, textAlign: 'right' }}>
                    {b.businessName} &nbsp;|&nbsp; {fmt(q.createdAt || new Date())}
                </div>
            </div>

            {/* ── PRINT CSS ── */}
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 14mm 15mm 14mm 15mm;
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        color-adjust: exact;
                    }
                    div[data-qtemplate] {
                        padding: 0 !important;
                        width: 100% !important;
                    }
                    * { box-shadow: none !important; }
                    tr { page-break-inside: avoid; }
                }
            `}</style>
        </div>
    );
});

QuotationTemplate.displayName = 'QuotationTemplate';

export default QuotationTemplate;
