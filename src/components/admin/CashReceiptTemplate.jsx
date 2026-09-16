import React from 'react';

const CashReceiptTemplate = React.forwardRef(({ receipt, business, docNos = {} }, ref) => {
    if (!receipt || !business) return null;

    const b = business;
    const r = receipt;

    const currencySymbol = (() => {
        const s = b.primaryCurrency?.symbol;
        const c = b.primaryCurrency?.code;
        if (['$', '€', '£', '₹', 'د.إ'].includes(s)) return s;
        return c || 'LKR';
    })();

    const fmt = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const money = (n) =>
        parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const numberToWords = (num) => {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const two = (n) => n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        const three = (n) => {
            const h = Math.floor(n / 100);
            const rest = n % 100;
            return (h ? ones[h] + ' Hundred' + (rest ? ' ' : '') : '') + (rest ? two(rest) : '');
        };
        if (!num) return 'Zero';
        const scales = ['', ' Thousand', ' Million', ' Billion'];
        let words = '';
        let n = Math.floor(Math.abs(num));
        let i = 0;
        while (n > 0) {
            const part = n % 1000;
            if (part) words = three(part) + scales[i] + (words ? ' ' + words : '');
            n = Math.floor(n / 1000);
            i++;
        }
        return words;
    };

    const amountInWords = (n) => {
        const rupees = Math.floor(Number(n) || 0);
        const cents = Math.round(((Number(n) || 0) - rupees) * 100);
        let out = `Rupees ${numberToWords(rupees)} Only`;
        if (cents > 0) out = `Rupees ${numberToWords(rupees)} and Cents ${numberToWords(cents)} Only`;
        return out;
    };

    const getClient = () => {
        if (r.clientRef) {
            const c = r.clientRef;
            const isOrg = c.clientType === 'Organization';
            return {
                org: isOrg ? c.firstName : (c.organization || ''),
                name: isOrg ? '' : `${c.firstName || ''} ${c.lastName || ''}`.trim(),
                address: c.address || '', phone: c.telephoneNumber || ''
            };
        }
        const m = r.manualClientDetails || {};
        return {
            org: m.organization || '',
            name: m.name || '',
            address: m.address || '',
            phone: m.telephoneNumber || ''
        };
    };

    const client = getClient();
    const isVoid = r.status === 'void';
    const qNo = r.quotationRef?.quotationId || docNos.qt;
    const iNo = r.invoiceRef?.invoiceNumber || docNos.inv;

    const FONT = "'Arial', 'Helvetica Neue', sans-serif";
    const DARK = '#0f172a';
    const MID = '#334155';
    const MUTED = '#64748b';
    const BORDER = '#cbd5e1';
    const TITLE_COLOR = b.cashReceiptTitleColor || b.quotationTitleColor || DARK;
    const DIVIDER_COLOR = b.cashReceiptDividerColor || b.quotationDividerColor || DARK;
    const PAGE_W = b.pageWidth || 210;
    const PAGE_H = b.pageHeight || 297;

    const labelTd = {
        fontFamily: FONT,
        fontSize: '8.5px',
        fontWeight: '700',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: MUTED,
        padding: '0 0 3px 0',
        verticalAlign: 'bottom'
    };

    const valueTd = {
        fontFamily: FONT,
        fontSize: '12px',
        fontWeight: '700',
        color: DARK,
        padding: '0',
        verticalAlign: 'top'
    };

    return (
        <div ref={ref} data-crtemplate style={{
            position: 'relative',
            background: '#fff',
            color: DARK,
            fontFamily: FONT,
            fontSize: '11px',
            lineHeight: '1.45',
            boxSizing: 'border-box',
            width: `${PAGE_W}mm`,
            height: `${PAGE_H}mm`,
            maxHeight: `${PAGE_H}mm`,
            overflow: 'hidden',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            padding: '10mm 12mm 10mm 12mm'
        }}>

            {isVoid && (
                <div style={{
                    position: 'absolute',
                    top: '42%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-28deg)',
                    fontSize: '96px',
                    fontWeight: '900',
                    color: 'rgba(185, 28, 28, 0.1)',
                    textTransform: 'uppercase',
                    letterSpacing: '12px',
                    pointerEvents: 'none',
                    zIndex: 0,
                    whiteSpace: 'nowrap'
                }}>
                    VOID
                </div>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse', position: 'relative', zIndex: 1 }}>
                <tbody>
                    <tr>
                        <td style={{ verticalAlign: 'top', width: '58%', padding: '0 10px 0 0' }}>
                            {b.cashReceiptLogo
                                ? <img src={b.cashReceiptLogo} alt="Logo"
                                    style={{ maxHeight: '52px', maxWidth: '160px', objectFit: 'contain', display: 'block', marginBottom: '6px' }} />
                                : (b.quotationLogo
                                    ? <img src={b.quotationLogo} alt="Logo"
                                        style={{ maxHeight: '52px', maxWidth: '160px', objectFit: 'contain', display: 'block', marginBottom: '6px' }} />
                                    : <div style={{ fontFamily: FONT, fontSize: '18px', fontWeight: '800', color: DARK, marginBottom: '4px' }}>{b.businessName}</div>
                                )
                            }
                            <div style={{ fontFamily: FONT, color: MID, fontSize: '10px', lineHeight: '1.55' }}>
                                {b.businessName && <div style={{ fontWeight: '700', color: DARK, fontSize: '11px' }}>{b.businessName}</div>}
                                {b.address && <div>{b.address}</div>}
                                {(b.phoneNumber || b.email) && (
                                    <div>
                                        {b.phoneNumber ? `Tel: ${b.phoneNumber}` : ''}
                                        {b.phoneNumber && b.email ? '  ·  ' : ''}
                                        {b.email ? `Email: ${b.email}` : ''}
                                    </div>
                                )}
                                {b.isVatRegistered && b.vatNumber && (
                                    <div style={{ color: DARK, fontWeight: '700', marginTop: '2px' }}>TAX ID : {b.vatNumber}</div>
                                )}
                            </div>
                        </td>
                        <td style={{ verticalAlign: 'top', textAlign: 'right', padding: '0' }}>
                            <div style={{
                                fontFamily: FONT,
                                fontSize: '22px',
                                fontWeight: '800',
                                color: TITLE_COLOR,
                                letterSpacing: '1.5px',
                                textTransform: 'uppercase',
                                lineHeight: 1.1,
                                marginBottom: '8px'
                            }}>
{
                                        r.receiptType === 'advance' ? 'Advance Receipt' : 'Cash Receipt'
                                    }
                                </div>
                            <table style={{ marginLeft: 'auto', borderCollapse: 'collapse', minWidth: '210px' }}>
                                <tbody>
                                    <tr>
                                        <td style={{
                                            fontFamily: FONT, fontSize: '9px', fontWeight: '700', letterSpacing: '0.08em',
                                            textTransform: 'uppercase', color: MUTED, textAlign: 'left',
                                            padding: '7px 10px', border: `1px solid ${BORDER}`, background: '#f8fafc', width: '42%'
                                        }}>Receipt No</td>
                                        <td style={{
                                            fontFamily: 'ui-monospace, Consolas, monospace', fontSize: '12px', fontWeight: '800',
                                            color: DARK, textAlign: 'right', padding: '7px 10px',
                                            border: `1px solid ${BORDER}`, borderLeft: 'none'
                                        }}>{r.receiptNumber}</td>
                                    </tr>
                                    <tr>
                                        <td style={{
                                            fontFamily: FONT, fontSize: '9px', fontWeight: '700', letterSpacing: '0.08em',
                                            textTransform: 'uppercase', color: MUTED, textAlign: 'left',
                                            padding: '7px 10px', border: `1px solid ${BORDER}`, borderTop: 'none', background: '#f8fafc'
                                        }}>Date</td>
                                        <td style={{
                                            fontFamily: FONT, fontSize: '12px', fontWeight: '700',
                                            color: DARK, textAlign: 'right', padding: '7px 10px',
                                            border: `1px solid ${BORDER}`, borderTop: 'none', borderLeft: 'none'
                                        }}>{fmt(r.receiptDate || r.createdAt)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div style={{ height: '3px', background: DIVIDER_COLOR, margin: '10px 0 12px' }} />

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                <tbody>
                    <tr>
                        <td style={{ ...labelTd, width: '58%', paddingRight: '14px' }}>Received From</td>
                        <td style={{ ...labelTd, width: '42%' }}>References</td>
                    </tr>
                    <tr>
                        <td style={{ verticalAlign: 'top', paddingRight: '14px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    <tr>
                                        <td style={{
                                            border: `1px solid ${BORDER}`,
                                            borderLeft: `3px solid ${DIVIDER_COLOR}`,
                                            padding: '9px 12px',
                                            background: '#f8fafc'
                                        }}>
                                            {client.org && <div style={{ fontWeight: '800', fontSize: '13px', color: DARK }}>{client.org}</div>}
                                            {(client.name || (!client.org && !r.clientRef)) && (
                                                <div style={{ fontWeight: '700', fontSize: client.org ? '11.5px' : '13px', color: DARK }}>
                                                    {client.name || 'Walk-in Customer'}
                                                </div>
                                            )}
                                            {client.address && <div style={{ color: MID, fontSize: '10.5px', marginTop: '3px' }}>{client.address}</div>}
                                            {client.phone && <div style={{ color: MID, fontSize: '10.5px' }}>Tel: {client.phone}</div>}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                        <td style={{ verticalAlign: 'top' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    {[
                                        { label: 'Project', value: r.projectRef ? `${r.projectRef.name}${r.projectRef.projectId ? ` (${r.projectRef.projectId})` : ''}` : 'N/A' },
                                        { label: 'Quotation No', value: qNo || 'N/A' },
                                        { label: 'Invoice No', value: iNo || 'N/A' }
                                    ].map((row, idx) => (
                                        <tr key={row.label}>
                                            <td style={{
                                                fontFamily: FONT, fontSize: '9px', fontWeight: '700', color: MUTED,
                                                textTransform: 'uppercase', letterSpacing: '0.06em',
                                                padding: '6px 8px', width: '38%',
                                                border: `1px solid ${BORDER}`,
                                                borderTop: idx === 0 ? `1px solid ${BORDER}` : 'none',
                                                background: '#f8fafc'
                                            }}>{row.label}</td>
                                            <td style={{
                                                ...valueTd, fontSize: '11px', padding: '6px 8px',
                                                border: `1px solid ${BORDER}`,
                                                borderLeft: 'none',
                                                borderTop: idx === 0 ? `1px solid ${BORDER}` : 'none'
                                            }}>{row.value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                <tbody>
                    <tr>
                        <td style={{
                            fontFamily: FONT, fontSize: '9px', fontWeight: '700', letterSpacing: '0.12em',
                            textTransform: 'uppercase', color: '#fff', padding: '8px 14px',
                            background: DIVIDER_COLOR, width: '38%', verticalAlign: 'middle'
                        }}>
                            Amount Received ({currencySymbol})
                        </td>
                        <td style={{
                            fontFamily: FONT, fontSize: '22px', fontWeight: '800', letterSpacing: '0.02em',
                            color: isVoid ? '#991b1b' : TITLE_COLOR, textAlign: 'right',
                            padding: '8px 14px', background: isVoid ? '#fef2f2' : '#f8fafc',
                            border: `1px solid ${BORDER}`, borderLeft: 'none', whiteSpace: 'nowrap', verticalAlign: 'middle'
                        }}>
                            {currencySymbol} {money(r.amountReceived)}
                        </td>
                    </tr>
                    <tr>
                        <td style={{
                            fontFamily: FONT, fontSize: '9px', fontWeight: '700', letterSpacing: '0.12em',
                            textTransform: 'uppercase', color: MUTED, padding: '8px 14px',
                            background: '#fff', border: `1px solid ${BORDER}`, borderTop: 'none', verticalAlign: 'top'
                        }}>
                            Amount In Words
                        </td>
                        <td style={{
                            fontFamily: FONT, fontSize: '11.5px', fontWeight: '700', fontStyle: 'italic',
                            color: DARK, textAlign: 'right', padding: '8px 14px',
                            background: '#fff', border: `1px solid ${BORDER}`, borderTop: 'none', borderLeft: 'none'
                        }}>
                            {amountInWords(r.amountReceived)}
                        </td>
                    </tr>
                </tbody>
            </table>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                <tbody>
                    <tr>
                        <td style={{
                            fontFamily: FONT, fontSize: '9px', fontWeight: '700', letterSpacing: '0.12em',
                            textTransform: 'uppercase', color: MUTED, padding: '8px 14px', width: '28%',
                            border: `1px solid ${BORDER}`, background: '#f8fafc', verticalAlign: 'middle'
                        }}>
                            Payment Method
                        </td>
                        <td style={{
                            fontFamily: FONT, fontSize: '12px', fontWeight: '700', color: DARK,
                            padding: '8px 14px', border: `1px solid ${BORDER}`, borderLeft: 'none'
                        }}>
                            <span style={{ marginRight: '22px' }}>{r.paymentMethod === 'cash' ? '☑' : '☐'} Cash</span>
                            <span style={{ marginRight: '22px' }}>{r.paymentMethod === 'bank_transfer' ? '☑' : '☐'} Bank</span>
                            <span>{r.paymentMethod === 'cheque' ? '☑' : '☐'} Cheque</span>
                            {r.paymentMethod === 'cheque' && (
                                <span style={{ float: 'right', color: MID, fontWeight: '600' }}>
                                    Cheque No: <strong style={{ color: DARK }}>{r.chequeNumber || '—'}</strong>
                                </span>
                            )}
                        </td>
                    </tr>
                </tbody>
            </table>

            {r.description && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                    <tbody>
                        <tr>
                            <td style={{
                                fontFamily: FONT, fontSize: '9px', fontWeight: '700', letterSpacing: '0.12em',
                                textTransform: 'uppercase', color: MUTED, padding: '8px 14px',
                                border: `1px solid ${BORDER}`, background: '#f8fafc'
                            }}>
                                Purpose of Payment
                            </td>
                        </tr>
                        <tr>
                            <td style={{
                                fontFamily: FONT, fontSize: '11.5px', color: MID, lineHeight: '1.55',
                                whiteSpace: 'pre-wrap', padding: '8px 14px',
                                border: `1px solid ${BORDER}`, borderTop: 'none'
                            }}>
                                {r.description}
                            </td>
                        </tr>
                    </tbody>
                </table>
            )}

            {isVoid && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                    <tbody>
                        <tr>
                            <td style={{
                                fontFamily: FONT, fontSize: '9px', fontWeight: '700', letterSpacing: '0.12em',
                                textTransform: 'uppercase', color: '#991b1b', padding: '8px 14px',
                                border: '1px solid #fecaca', background: '#fef2f2'
                            }}>
                                Void Note
                            </td>
                        </tr>
                        <tr>
                            <td style={{
                                fontFamily: FONT, fontSize: '11.5px', color: '#7f1d1d', lineHeight: '1.55',
                                padding: '8px 14px', border: '1px solid #fecaca', borderTop: 'none', background: '#fff7f7'
                            }}>
                                {r.voidNote || 'This receipt has been voided without a recorded reason.'}
                            </td>
                        </tr>
                    </tbody>
                </table>
            )}

            {(b.cashReceiptTerms || b.cashReceiptNotes) && (
                <>
                    {b.cashReceiptTerms && (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                            <tbody>
                                <tr>
                                    <td style={{
                                        fontFamily: FONT, fontSize: '9px', fontWeight: '700', letterSpacing: '0.12em',
                                        textTransform: 'uppercase', color: MUTED, padding: '8px 14px',
                                        border: `1px solid ${BORDER}`, background: '#f8fafc'
                                    }}>
                                        Terms & Conditions
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{
                                        fontFamily: FONT, fontSize: '11px', color: MID, lineHeight: '1.55',
                                        whiteSpace: 'pre-wrap', padding: '8px 14px',
                                        border: `1px solid ${BORDER}`, borderTop: 'none'
                                    }}>
                                        {b.cashReceiptTerms}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                    {b.cashReceiptNotes && (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                            <tbody>
                                <tr>
                                    <td style={{
                                        fontFamily: FONT, fontSize: '9px', fontWeight: '700', letterSpacing: '0.12em',
                                        textTransform: 'uppercase', color: MUTED, padding: '8px 14px',
                                        border: `1px solid ${BORDER}`, background: '#f8fafc'
                                    }}>
                                        Notes
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{
                                        fontFamily: FONT, fontSize: '11px', color: MID, lineHeight: '1.55',
                                        whiteSpace: 'pre-wrap', padding: '8px 14px',
                                        border: `1px solid ${BORDER}`, borderTop: 'none'
                                    }}>
                                        {b.cashReceiptNotes}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                </>
            )}

            <div style={{ flex: 1 }} />

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
                <tbody>
                    <tr>
                        <td style={{ width: '50%', padding: '0' }} />
                        <td style={{ width: '50%', padding: '0', textAlign: 'center' }}>
                            <div style={{ height: '36px' }} />
                            <div style={{ borderTop: `1px solid ${DARK}`, width: '80%', margin: '0 auto', paddingTop: '6px' }}>
                                <span style={{ fontFamily: FONT, color: MUTED, fontWeight: '700', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                                    Authorized Signature
                                </span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <table className="creceipt-print-footer" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '14px' }}>
                <tbody>
                    <tr>
                        <td style={{
                            fontFamily: FONT, fontSize: '9px', color: MUTED, fontStyle: 'italic',
                            padding: '8px 0 0', borderTop: `1px solid ${BORDER}`
                        }}>
                            <span className="page-number-target"></span>
                        </td>
                        <td style={{
                            fontFamily: FONT, fontSize: '9px', color: MUTED, textAlign: 'right',
                            padding: '8px 0 0', borderTop: `1px solid ${BORDER}`
                        }}>
                            {b.businessName} &nbsp;|&nbsp; {fmt(r.receiptDate || r.createdAt)}
                        </td>
                    </tr>
                </tbody>
            </table>

            <style>{`
                @media print {
                    @page {
                        size: ${PAGE_W}mm ${PAGE_H}mm portrait;
                        margin: 10mm 12mm 10mm 12mm;
                    }
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        height: auto !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        color-adjust: exact;
                    }
                    div[data-crtemplate] {
                        width: 100% !important;
                        height: auto !important;
                        max-height: none !important;
                        min-height: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                    }
                    * { box-shadow: none !important; }
                    tr, table { page-break-inside: avoid; }
                    .creceipt-print-footer {
                        page-break-inside: avoid;
                    }
                    .page-number-target::before {
                        content: "Page 1 of 1";
                    }
                }
            `}</style>
        </div>
    );
});

CashReceiptTemplate.displayName = 'CashReceiptTemplate';

export default CashReceiptTemplate;
