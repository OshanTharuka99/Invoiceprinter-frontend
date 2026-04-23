import React from 'react';

const QuotationTemplate = React.forwardRef(({ quotation, business }, ref) => {
    if (!quotation || !business) return null;

    const b = business;
    const q = quotation;

    const currencySymbol = q.currency === 'primary'
        ? (b.primaryCurrency?.symbol || 'Rs.')
        : (b.secondaryCurrency?.symbol || '$');

    const formatDate = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatMoney = (n) =>
        parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Discount amount calculation
    const discountAmount = q.hasDiscount
        ? q.discountType === 'percentage'
            ? (q.subTotal * q.discountValue) / 100
            : parseFloat(q.discountValue)
        : 0;

    // Taxable base (after discount)
    const taxableBase = q.subTotal - discountAmount;

    // Tax amount calculation
    const taxAmount = q.hasTax ? (taxableBase * q.taxPercentage) / 100 : 0;

    // Client display helpers
    const getClientBlock = () => {
        if (q.clientRef) {
            const c = q.clientRef;
            const isOrg = c.clientType === 'Organization';
            return {
                org: isOrg ? c.firstName : '',
                name: isOrg ? '' : `${c.firstName || ''} ${c.lastName || ''}`.trim(),
                address: c.address || '',
                phone: c.telephoneNumber || '',
                email: c.emailAddress || ''
            };
        }
        const m = q.manualClientDetails || {};
        const isOrg = m.title === 'Organization';
        return {
            org: m.organization || (isOrg ? m.name : ''),
            name: isOrg ? '' : `${m.title ? m.title + '. ' : ''}${m.name || ''}`.trim(),
            address: m.address || '',
            phone: m.telephoneNumber || '',
            email: m.emailAddress || ''
        };
    };

    const client = getClientBlock();

    const showTerms = b.quotationTerms && b.quotationTerms.trim() !== '';
    const showNotes = b.quotationNotes && b.quotationNotes.trim() !== '';
    const showVatNo = b.isVatRegistered && b.vatNumber && b.vatNumber.trim() !== '';
    const showValidDate = q.validDate;

    /* ─── inline styles ─── */
    const page = {
        background: '#ffffff',
        color: '#111827',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        fontSize: '12px',
        lineHeight: '1.5',
        padding: '14mm 15mm 18mm 15mm',
        boxSizing: 'border-box',
        width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        position: 'relative'
    };

    const dividerTop = {
        borderBottom: '2.5px solid #0f172a',
        paddingBottom: '16px',
        marginBottom: '22px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    };

    const labelSmall = {
        fontWeight: '700',
        color: '#6b7280',
        textAlign: 'right',
        padding: '3px 8px',
        whiteSpace: 'nowrap'
    };

    const valueCell = {
        padding: '3px 8px',
        color: '#111827',
        fontWeight: '600'
    };

    const sectionLabel = {
        fontSize: '10px',
        fontWeight: '900',
        color: '#0f172a',
        background: '#f1f5f9',
        display: 'inline-block',
        padding: '4px 10px',
        marginBottom: '10px',
        letterSpacing: '0.08em',
        borderLeft: '3px solid #0f172a'
    };

    const thStyle = (align = 'left') => ({
        padding: '10px 12px',
        textAlign: align,
        fontWeight: '700',
        fontSize: '11px',
        borderBottom: '1px solid rgba(255,255,255,0.2)'
    });

    const tdStyle = (align = 'left', bold = false) => ({
        padding: '9px 12px',
        textAlign: align,
        fontWeight: bold ? '700' : '400',
        color: bold ? '#111827' : '#374151',
        borderBottom: '1px solid #f3f4f6'
    });

    return (
        <div ref={ref} style={page}>

            {/* ══════════════════════════════════════════════════════════
                HEADER  —  Business Identity  +  Quotation Meta
            ══════════════════════════════════════════════════════════ */}
            <div style={dividerTop}>

                {/* Left — Company letterhead */}
                <div style={{ maxWidth: '55%' }}>
                    {b.quotationLogo && (
                        <img
                            src={b.quotationLogo}
                            alt="Company Logo"
                            style={{ maxHeight: '72px', maxWidth: '200px', objectFit: 'contain', display: 'block', marginBottom: '10px' }}
                        />
                    )}

                    <div style={{ fontWeight: '900', fontSize: '15px', color: '#0f172a', marginBottom: '6px' }}>
                        {b.businessName}
                    </div>

                    <div style={{ color: '#4b5563', lineHeight: '1.65', fontSize: '11.5px' }}>
                        {b.address && <div>{b.address}</div>}
                        {b.phoneNumber && <div>Tel: {b.phoneNumber}</div>}
                        {b.email && <div>Email: {b.email}</div>}
                        {showVatNo && (
                            <div style={{ marginTop: '5px', fontWeight: '700', color: '#0f172a' }}>
                                VAT Reg. No: {b.vatNumber}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right — Quotation identity block */}
                <div style={{ textAlign: 'right' }}>
                    <div style={{
                        fontSize: '32px', fontWeight: '900', color: '#e2e8f0',
                        textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '14px'
                    }}>
                        QUOTATION
                    </div>

                    <table style={{ marginLeft: 'auto', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <tbody>
                            <tr>
                                <td style={labelSmall}>Quotation No:</td>
                                <td style={{ ...valueCell, fontWeight: '800', color: '#0f172a', fontFamily: 'monospace', fontSize: '13px' }}>
                                    {q.quotationId}
                                </td>
                            </tr>
                            <tr>
                                <td style={labelSmall}>Date:</td>
                                <td style={valueCell}>{formatDate(q.createdAt || new Date())}</td>
                            </tr>
                            {showValidDate && (
                                <tr>
                                    <td style={labelSmall}>Valid Until:</td>
                                    <td style={{ ...valueCell, color: '#0f172a', fontWeight: '700' }}>
                                        {formatDate(q.validDate)}
                                    </td>
                                </tr>
                            )}
                            <tr>
                                <td style={labelSmall}>Generated By:</td>
                                <td style={{ ...valueCell, fontWeight: '800', color: '#0f172a', fontFamily: 'monospace', fontSize: '13px' }}>
                                    {q.createdBy?.firstName} {q.createdBy?.lastName}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
                BILL TO  —  Client details
            ══════════════════════════════════════════════════════════ */}
            <div style={{ marginBottom: '24px' }}>
                <div style={sectionLabel}>BILL TO</div>
                <div style={{ paddingLeft: '12px', lineHeight: '1.7', fontSize: '12.5px' }}>
                    {client.org && (
                        <div style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a' }}>
                            {client.org}
                        </div>
                    )}
                    {client.name && (
                        <div style={{ fontWeight: '700', fontSize: client.org ? '12.5px' : '14px', color: '#0f172a' }}>
                            {client.name}
                        </div>
                    )}
                    {client.address && <div style={{ color: '#4b5563' }}>{client.address}</div>}
                    {client.phone && <div style={{ color: '#4b5563' }}>Tel: {client.phone}</div>}
                    {client.email && <div style={{ color: '#4b5563' }}>Email: {client.email}</div>}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
                LINE ITEMS TABLE
            ══════════════════════════════════════════════════════════ */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '26px', fontSize: '12px' }}>
                <thead>
                    <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                        <th style={{ ...thStyle('left'), width: '5%' }}>#</th>
                        <th style={{ ...thStyle('left'), width: '45%' }}>Description</th>
                        <th style={{ ...thStyle('center'), width: '12%' }}>Qty</th>
                        <th style={{ ...thStyle('right'), width: '19%' }}>Unit Price ({currencySymbol})</th>
                        <th style={{ ...thStyle('right'), width: '19%' }}>Amount ({currencySymbol})</th>
                    </tr>
                </thead>
                <tbody>
                    {q.items.map((item, index) => (
                        <tr key={index} style={{ background: index % 2 === 0 ? '#f9fafb' : '#ffffff' }}>
                            <td style={tdStyle('left')}>{index + 1}</td>
                            <td style={{ ...tdStyle('left', true), color: '#111827' }}>
                                {item.productRef ? item.productRef.name : item.manualName}
                            </td>
                            <td style={tdStyle('center')}>{item.quantity}</td>
                            <td style={tdStyle('right')}>
                                {formatMoney(item.unitPrice)}
                            </td>
                            <td style={{ ...tdStyle('right', true) }}>
                                {formatMoney(item.lineTotal)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* ══════════════════════════════════════════════════════════
                TOTALS  —  right-aligned summary block
            ══════════════════════════════════════════════════════════ */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
                <div style={{ width: '340px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <tbody>
                            {/* Subtotal */}
                            <tr>
                                <td style={{ padding: '7px 10px', color: '#6b7280', fontWeight: '600', borderBottom: '1px solid #f3f4f6' }}>
                                    Subtotal
                                </td>
                                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: '700', borderBottom: '1px solid #f3f4f6' }}>
                                    {currencySymbol} {formatMoney(q.subTotal)}
                                </td>
                            </tr>

                            {/* Discount */}
                            {q.hasDiscount && discountAmount > 0 && (
                                <tr>
                                    <td style={{ padding: '7px 10px', color: '#059669', fontWeight: '600', borderBottom: '1px solid #f3f4f6' }}>
                                        Discount {q.discountType === 'percentage' ? `(${q.discountValue}%)` : '(Fixed)'}
                                    </td>
                                    <td style={{ padding: '7px 10px', textAlign: 'right', color: '#059669', fontWeight: '700', borderBottom: '1px solid #f3f4f6' }}>
                                        − {currencySymbol} {formatMoney(discountAmount)}
                                    </td>
                                </tr>
                            )}

                            {/* Tax */}
                            {q.hasTax && (
                                <tr>
                                    <td style={{ padding: '7px 10px', color: '#dc2626', fontWeight: '600', borderBottom: '1px solid #f3f4f6' }}>
                                        {q.taxName} ({q.taxPercentage}%)
                                    </td>
                                    <td style={{ padding: '7px 10px', textAlign: 'right', color: '#dc2626', fontWeight: '700', borderBottom: '1px solid #f3f4f6' }}>
                                        + {currencySymbol} {formatMoney(taxAmount)}
                                    </td>
                                </tr>
                            )}

                            {/* Final Total */}
                            <tr style={{ background: '#0f172a' }}>
                                <td style={{ padding: '13px 10px', fontWeight: '900', fontSize: '15px', color: '#ffffff' }}>
                                    Total Amount
                                </td>
                                <td style={{ padding: '13px 10px', textAlign: 'right', fontWeight: '900', fontSize: '16px', color: '#ffffff' }}>
                                    {currencySymbol} {formatMoney(q.finalTotal)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
                GENERAL TERMS & CONDITIONS
            ══════════════════════════════════════════════════════════ */}
            {showTerms && (
                <div style={{
                    marginBottom: '18px',
                    padding: '14px 16px',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px'
                }}>
                    <div style={{
                        fontWeight: '900', fontSize: '11px', textTransform: 'uppercase',
                        letterSpacing: '0.1em', color: '#0f172a', marginBottom: '8px',
                        borderBottom: '1.5px solid #e5e7eb', paddingBottom: '6px'
                    }}>
                        GENERAL TERMS &amp; CONDITIONS
                    </div>
                    <div style={{
                        fontSize: '11px', color: '#374151', lineHeight: '1.7',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {b.quotationTerms}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                NOTE
            ══════════════════════════════════════════════════════════ */}
            {showNotes && (
                <div style={{
                    marginBottom: '28px',
                    padding: '12px 16px',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderLeft: '4px solid #f59e0b',
                    borderRadius: '4px'
                }}>
                    <div style={{
                        fontWeight: '900', fontSize: '11px', textTransform: 'uppercase',
                        letterSpacing: '0.1em', color: '#92400e', marginBottom: '6px'
                    }}>
                        NOTE:
                    </div>
                    <div style={{ fontSize: '11px', color: '#78350f', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                        {b.quotationNotes}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                Computer Generated Signature
            ══════════════════════════════════════════════════════════ */}
            <div style={{
                fontWeight: '900', fontSize: '11px', textTransform: 'sentence',
                letterSpacing: '0.1em', color: '#0f172a', marginBottom: '6px'
            }}>
                This is a computer-generated invoice and does not require a signature
            </div>

            {/* ══════════════════════════════════════════════════════════
                PRINT CSS
            ══════════════════════════════════════════════════════════ */}
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        color-adjust: exact;
                    }
                    * {
                        box-shadow: none !important;
                    }
                    tr {
                        page-break-inside: avoid;
                    }
                }
            `}</style>
        </div>
    );
});

QuotationTemplate.displayName = 'QuotationTemplate';

export default QuotationTemplate;
