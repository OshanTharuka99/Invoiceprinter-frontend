import React from 'react';

const InvoiceTemplate = React.forwardRef(({ invoice, business }, ref) => {
    if (!invoice || !business) return null;

    const b = business;
    const inv = invoice;

    const currencySymbol = inv.currency === 'primary'
        ? (b.primaryCurrency?.symbol || 'Rs.')
        : (b.secondaryCurrency?.symbol || '$');

    const fmt = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const money = (n) =>
        parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const discountTotal = inv.discountTotal || (inv.appliedDiscounts || []).reduce((sum, d) => sum + (d.amount || 0), 0);

    const getClient = () => {
        if (inv.clientRef) {
            const c = inv.clientRef;
            const isOrg = c.clientType === 'Organization';
            return {
                org: isOrg ? c.firstName : '',
                name: isOrg ? '' : `${c.firstName || ''} ${c.lastName || ''}`.trim(),
                address: c.address || '', phone: c.telephoneNumber || '', email: c.emailAddress || ''
            };
        }
        const m = inv.manualClientDetails || {};
        const isOrg = m.title === 'Organization';
        return {
            org: m.organization || (isOrg ? m.name : ''),
            name: isOrg ? '' : `${m.title ? m.title + '. ' : ''}${m.name || ''}`.trim(),
            address: m.address || '', phone: m.telephoneNumber || '', email: m.emailAddress || ''
        };
    };

    const client = getClient();

    const showTerms = b.invoiceTerms && b.invoiceTerms.trim() !== '';
    const showNotes = b.invoiceNotes && b.invoiceNotes.trim() !== '';
    const showVatNo = b.isVatRegistered && b.vatNumber && b.vatNumber.trim() !== '';
    const showBank = !!(b.bankAccountNumber || b.bankName);
    const hasDeliveryAddress = inv.deliveryAddress && inv.deliveryAddress.trim() !== '';

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

    const paymentLabels = {
        cash: 'Cash',
        cheque: 'Cheque',
        bank_transfer: 'Bank Transfer',
        credit: 'Credit'
    };

    return (
        <div ref={ref} data-invoicetemplate style={{
            position: 'relative',
            background: '#fff',
            color: DARK,
            fontFamily: FONT,
            fontSize: '12px',
            lineHeight: '1.6',
            boxSizing: 'border-box',
            width: '210mm',
            minHeight: '297mm',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            padding: '12mm 14mm 14mm 14mm'
        }}>
            {/* WATERMARK */}
            {inv.status === 'Cancelled' && (
                <div style={{
                    position: 'absolute',
                    top: '40%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-30deg)',
                    fontSize: '120px',
                    fontWeight: '900',
                    color: 'rgba(239, 68, 68, 0.12)',
                    textTransform: 'uppercase',
                    letterSpacing: '10px',
                    pointerEvents: 'none',
                    zIndex: 0,
                    whiteSpace: 'nowrap'
                }}>
                    CANCELLED
                </div>
            )}

            {/* HEADER */}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ maxWidth: '52%' }}>
                    {b.quotationLogo
                        ? <img src={b.quotationLogo} alt="Logo"
                            style={{ maxHeight: '75px', maxWidth: '180px', objectFit: 'contain', display: 'block', marginBottom: '8px' }} />
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
                    <div style={{ fontFamily: FONT, fontSize: '28px', fontWeight: '900', color: DARK, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
                        INVOICE
                    </div>
                    <table style={{ marginLeft: 'auto', borderCollapse: 'collapse' }}>
                        <tbody>
                            {[
                                { label: 'Invoice No', value: inv.invoiceNumber, mono: true, large: true },
                                { label: 'Date', value: fmt(inv.invoiceDate || inv.createdAt || new Date()) },
                                { label: 'Payment', value: paymentLabels[inv.paymentMethod] || inv.paymentMethod },
                                inv.paymentMethod === 'credit' && inv.creditPeriod?.duration > 0
                                    ? { label: 'Credit Terms', value: `${inv.creditPeriod.duration} ${inv.creditPeriod.unit}` }
                                    : null,
                                { label: 'Status', value: inv.status || 'Unpaid' }
                            ].filter(Boolean).map(({ label, value, mono, large }) => (
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
            <div style={{ height: '4px', background: DARK, margin: '14px 0 16px' }} />

            {/* BILL TO & DELIVERY ADDRESS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: FONT, fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', color: LIGHT, marginBottom: '7px' }}>
                        Bill To
                    </div>
                    <div style={{ fontFamily: FONT, lineHeight: '1.8' }}>
                        {client.org && <div style={{ fontWeight: '800', fontSize: '14px', color: DARK }}>{client.org}</div>}
                        {client.name && <div style={{ fontWeight: '700', fontSize: client.org ? '12.5px' : '14px', color: DARK }}>{client.name}</div>}
                        {client.address && <div style={{ color: MID, fontSize: '12px' }}>{client.address}</div>}
                        {client.phone && <div style={{ color: MID, fontSize: '12px' }}>Tel: {client.phone}</div>}
                        {client.email && <div style={{ color: MID, fontSize: '12px' }}>Email: {client.email}</div>}
                    </div>
                </div>

                {hasDeliveryAddress && (
                    <div style={{ flex: 1, textAlign: 'right' }}>
                        <div style={{ fontFamily: FONT, fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', color: LIGHT, marginBottom: '7px' }}>
                            Delivery Address
                        </div>
                        <div style={{ fontFamily: FONT, lineHeight: '1.8', color: MID, fontSize: '12px' }}>
                            {inv.deliveryAddress.split('\n').map((line, i) => (
                                <div key={i}>{line}</div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ITEMS TABLE */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                    <tr style={{ background: DARK, color: '#fff' }}>
                        <th style={{ fontFamily: FONT, padding: '9px 10px', textAlign: 'left', fontWeight: '700', fontSize: '11.5px', width: '5%' }}>No</th>
                        <th style={{ fontFamily: FONT, padding: '9px 10px', textAlign: 'left', fontWeight: '700', fontSize: '11.5px', width: '40%' }}>Description</th>
                        <th style={{ fontFamily: FONT, padding: '9px 10px', textAlign: 'center', fontWeight: '700', fontSize: '11.5px', width: '8%' }}>Qty</th>
                        <th style={{ fontFamily: FONT, padding: '9px 10px', textAlign: 'right', fontWeight: '700', fontSize: '11.5px', width: '17%' }}>Unit Price ({currencySymbol})</th>
                        <th style={{ fontFamily: FONT, padding: '9px 10px', textAlign: 'right', fontWeight: '700', fontSize: '11.5px', width: '15%' }}>Amount ({currencySymbol})</th>
                        <th style={{ fontFamily: FONT, padding: '9px 10px', textAlign: 'left', fontWeight: '700', fontSize: '11.5px', width: '15%' }}>Serial No(s)</th>
                    </tr>
                </thead>
                <tbody>
                    {inv.items.map((item, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff', borderBottom: `1px solid ${BORDER}` }}>
                            <td style={{ fontFamily: FONT, padding: '8px 10px', color: LIGHT, fontSize: '12px' }}>{i + 1}</td>
                            <td style={{ fontFamily: FONT, padding: '8px 10px', color: DARK, fontSize: '12px', fontWeight: '600' }}>
                                {item.productRef ? item.productRef.name : item.manualName}
                            </td>
                            <td style={{ fontFamily: FONT, padding: '8px 10px', color: MID, fontSize: '12px', textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ fontFamily: FONT, padding: '8px 10px', color: MID, fontSize: '12px', textAlign: 'right' }}>{money(item.unitPrice)}</td>
                            <td style={{ fontFamily: FONT, padding: '8px 10px', color: DARK, fontSize: '12px', fontWeight: '700', textAlign: 'right' }}>{money(item.lineTotal)}</td>
                            <td style={{ fontFamily: FONT, padding: '8px 10px', color: MID, fontSize: '10px' }}>
                                {item.serialNumbers?.length > 0 ? item.serialNumbers.join(', ') : '—'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* TOTALS */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                <table style={{ width: '360px', borderCollapse: 'collapse', border: `1px solid ${BORDER}` }}>
                    <tbody>
                        <tr>
                            <td style={{ fontFamily: FONT, color: MID, fontWeight: '600', fontSize: '12.5px', padding: '8px 14px', background: '#f8fafc', borderBottom: `1px solid ${BORDER}` }}>Subtotal</td>
                            <td style={{ fontFamily: FONT, color: DARK, fontWeight: '700', fontSize: '12.5px', padding: '8px 14px', background: '#f8fafc', borderBottom: `1px solid ${BORDER}`, textAlign: 'right' }}>{currencySymbol} {money(inv.subTotal)}</td>
                        </tr>
                        {inv.appliedDiscounts?.map((disc, i) => (
                            <tr key={`d-${i}`}>
                                <td style={{ fontFamily: FONT, color: DARK, fontWeight: '600', fontSize: '12.5px', padding: '8px 14px', background: '#f8fafc', borderBottom: `1px solid ${BORDER}` }}>
                                    Discount ({disc.name} {disc.type === 'percentage' ? disc.value + '%' : ''})
                                </td>
                                <td style={{ fontFamily: FONT, color: DARK, fontWeight: '700', fontSize: '12.5px', padding: '8px 14px', background: '#f8fafc', borderBottom: `1px solid ${BORDER}`, textAlign: 'right' }}>− {currencySymbol} {money(disc.amount)}</td>
                            </tr>
                        ))}
                        {inv.hasTax && inv.appliedTaxes?.length > 0 && inv.appliedTaxes.map((tax, i) => (
                            <tr key={`t-${i}`}>
                                <td style={{ fontFamily: FONT, color: DARK, fontWeight: '600', fontSize: '12.5px', padding: '8px 14px', background: '#f8fafc', borderBottom: `1px solid ${BORDER}` }}>
                                    {tax.name} {tax.type === 'percentage' ? `(${tax.value}%)` : ''}
                                </td>
                                <td style={{ fontFamily: FONT, color: DARK, fontWeight: '700', fontSize: '12.5px', padding: '8px 14px', background: '#f8fafc', borderBottom: `1px solid ${BORDER}`, textAlign: 'right' }}>+ {currencySymbol} {money(tax.amount)}</td>
                            </tr>
                        ))}
                        <tr>
                            <td style={{ fontFamily: FONT, color: '#fff', fontWeight: '900', fontSize: '13.5px', padding: '12px 14px', background: DARK }}>Total Amount</td>
                            <td style={{ fontFamily: FONT, color: '#fff', fontWeight: '900', fontSize: '14.5px', padding: '12px 14px', background: DARK, textAlign: 'right' }}>{currencySymbol} {money(inv.finalTotal)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* DIVIDER */}
            <div style={{ height: '4px', background: DARK, margin: '14px 0 16px' }} />

            {/* TERMS */}
            {showTerms && (
                <div style={{ marginBottom: '14px', paddingBottom: '14px' }}>
                    <div style={{ ...sectionTitle, fontFamily: FONT }}>Terms & Conditions</div>
                    <div style={{ fontFamily: FONT, fontSize: '11.5px', color: MID, lineHeight: '1.75', whiteSpace: 'pre-wrap' }}>
                        {b.invoiceTerms}
                    </div>
                </div>
            )}

            {/* NOTES */}
            {showNotes && (
                <div style={{ marginBottom: '14px', paddingBottom: '14px' }}>
                    <div style={{ ...sectionTitle, fontFamily: FONT }}>Notes</div>
                    <div style={{ fontFamily: FONT, fontSize: '11.5px', color: MID, lineHeight: '1.75', whiteSpace: 'pre-wrap' }}>
                        {b.invoiceNotes}
                    </div>
                </div>
            )}

            {/* BANK DETAILS */}
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
                </div>
            )}

            {/* AUTHORIZED SIGNATURES */}
            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', paddingTop: '20px' }}>
                <div style={{ textAlign: 'center', width: '200px' }}>
                    <div style={{ borderBottom: `1px solid ${BORDER}`, marginBottom: '8px', height: '50px' }}></div>
                    <div style={{ fontFamily: FONT, fontSize: '10px', fontWeight: '700', color: MID, textTransform: 'uppercase' }}>Authorized Signature</div>
                </div>
                <div style={{ textAlign: 'center', width: '200px' }}>
                    <div style={{ borderBottom: `1px solid ${BORDER}`, marginBottom: '8px', height: '50px' }}></div>
                    <div style={{ fontFamily: FONT, fontSize: '10px', fontWeight: '700', color: MID, textTransform: 'uppercase' }}>Received By</div>
                </div>
            </div>

            {/* FOOTER */}
            <div className="invoice-print-footer" style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', background: '#fff' }}>
                <div style={{ fontFamily: FONT, fontSize: '10px', color: LIGHT, fontStyle: 'italic' }}>
                    <span className="page-number-target"></span>
                </div>
                <div style={{ fontFamily: FONT, fontSize: '10px', color: LIGHT, textAlign: 'right' }}>
                    {b.businessName} &nbsp;|&nbsp; {fmt(inv.createdAt || new Date())}
                </div>
            </div>

            {/* PRINT CSS */}
            <style>{`
                .invoice-print-footer { marginTop: auto !important; }

                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 14mm 15mm 20mm 15mm;
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        color-adjust: exact;
                    }
                    div[data-invoicetemplate] {
                        padding: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        position: relative !important;
                    }
                    * { box-shadow: none !important; }
                    tr { page-break-inside: avoid; }

                    .invoice-print-footer {
                        position: fixed !important;
                        bottom: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        padding-bottom: 2mm !important;
                        background: white !important;
                        z-index: 10;
                    }

                    .page-number-target::before {
                        counter-increment: page;
                        content: "Page " counter(page);
                    }
                }
            `}</style>
        </div>
    );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;