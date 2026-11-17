import React from 'react';

const ExpenseVoucherTemplate = React.forwardRef(({ expense, business }, ref) => {
    if (!expense || !business) return null;

    const b = business;
    const e = expense;

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

    const purposeLabel = (p) => ({
        project: 'Project',
        office: 'Day-to-day office',
        asset: 'Asset purchase'
    }[p] || p || '—');

    const methodLabel = (m) => ({
        cash: 'Cash',
        cheque: 'Cheque',
        bank_transfer: 'Bank Transfer'
    }[m] || m || 'Cash');

    const projectName = () => {
        const p = e.projectRef;
        if (!p) return '';
        const c = p.client || p.clientRef;
        const client = c ? ([c.firstName, c.lastName].filter(Boolean).join(' ') || c.organization || '') : '';
        return client ? `${p.name} — ${client}` : p.name;
    };

    const preparedBy = () => {
        const u = e.createdBy;
        if (!u) return '—';
        return [u.firstName, u.lastName].filter(Boolean).join(' ') || '—';
    };

    const isVoid = e.status === 'void';
    const logo = b.expenseLogo || b.cashReceiptLogo || b.quotationLogo;

    const FONT = "'Arial', 'Helvetica Neue', sans-serif";
    const DARK = '#0f172a';
    const MID = '#334155';
    const MUTED = '#64748b';
    const BORDER = '#cbd5e1';
    const TITLE_COLOR = b.expenseTitleColor || DARK;
    const DIVIDER_COLOR = b.expenseDividerColor || DARK;
    const PAGE_W = b.pageWidth || 210;
    const PAGE_H = b.pageHeight || 297;

    const labelTd = {
        fontFamily: FONT,
        fontSize: '8.5px',
        fontWeight: '700',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: MUTED,
        padding: '7px 10px',
        background: '#f8fafc',
        border: `1px solid ${BORDER}`,
        verticalAlign: 'middle',
        width: '26%'
    };

    const valueTd = {
        fontFamily: FONT,
        fontSize: '11.5px',
        fontWeight: '700',
        color: DARK,
        padding: '7px 10px',
        border: `1px solid ${BORDER}`,
        borderLeft: 'none',
        verticalAlign: 'middle'
    };

    const fields = [
        { label: 'Paid To', value: e.paidTo || '—' },
        { label: 'Bill No', value: e.billNumber || '—' },
        { label: 'Category', value: e.categoryName || '—' },
        { label: 'Purpose', value: purposeLabel(e.purpose) }
    ];

    if (projectName()) fields.push({ label: 'Project', value: projectName() });
    fields.push({ label: 'Payment Method', value: methodLabel(e.paymentMethod) });
    if (e.paymentMethod === 'cheque') fields.push({ label: 'Cheque No', value: e.chequeNumber || '—' });

    return (
        <div ref={ref} data-expensevoucher style={{
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
                            {logo
                                ? <img src={logo} alt="Logo" style={{ maxHeight: '52px', maxWidth: '160px', objectFit: 'contain', display: 'block', marginBottom: '6px' }} />
                                : <div style={{ fontFamily: FONT, fontSize: '18px', fontWeight: '800', color: DARK, marginBottom: '4px' }}>{b.businessName}</div>
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
                                {b.vatNumber && <div style={{ color: DARK, fontWeight: '700', marginTop: '2px' }}>VAT / TIN : {b.vatNumber}</div>}
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
                                Expense Voucher
                            </div>
                            <table style={{ marginLeft: 'auto', borderCollapse: 'collapse', minWidth: '210px' }}>
                                <tbody>
                                    <tr>
                                        <td style={{
                                            fontFamily: FONT, fontSize: '9px', fontWeight: '700', letterSpacing: '0.08em',
                                            textTransform: 'uppercase', color: MUTED, textAlign: 'left',
                                            padding: '7px 10px', border: `1px solid ${BORDER}`, background: '#f8fafc', width: '42%'
                                        }}>Expense No</td>
                                        <td style={{
                                            fontFamily: 'ui-monospace, Consolas, monospace', fontSize: '12px', fontWeight: '800',
                                            color: DARK, textAlign: 'right', padding: '7px 10px',
                                            border: `1px solid ${BORDER}`, borderLeft: 'none'
                                        }}>{e.expenseNumber}</td>
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
                                        }}>{fmt(e.expenseDate || e.createdAt)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div style={{ height: '3px', background: DIVIDER_COLOR, margin: '10px 0 12px' }} />

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', position: 'relative', zIndex: 1 }}>
                <tbody>
                    <tr>
                        <td style={{
                            fontFamily: FONT, fontSize: '9px', fontWeight: '700', letterSpacing: '0.12em',
                            textTransform: 'uppercase', color: MUTED, padding: '0 0 5px 0'
                        }}>
                            Expense Details
                        </td>
                    </tr>
                    {fields.map((row) => (
                        <tr key={row.label}>
                            <td style={{ ...labelTd, borderTop: 'none' }}>{row.label}</td>
                            <td style={{ ...valueTd, borderTop: 'none' }}>{row.value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', position: 'relative', zIndex: 1 }}>
                <tbody>
                    <tr>
                        <td style={{
                            fontFamily: FONT, fontSize: '9px', fontWeight: '700', letterSpacing: '0.12em',
                            textTransform: 'uppercase', color: '#fff', padding: '8px 14px',
                            background: DIVIDER_COLOR, width: '38%', verticalAlign: 'middle'
                        }}>
                            Amount Paid ({currencySymbol})
                        </td>
                        <td style={{
                            fontFamily: FONT, fontSize: '22px', fontWeight: '800', letterSpacing: '0.02em',
                            color: isVoid ? '#991b1b' : TITLE_COLOR, textAlign: 'right',
                            padding: '8px 14px', background: isVoid ? '#fef2f2' : '#f8fafc',
                            border: `1px solid ${BORDER}`, borderLeft: 'none', whiteSpace: 'nowrap', verticalAlign: 'middle'
                        }}>
                            {currencySymbol} {money(e.amount)}
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
                            {amountInWords(e.amount)}
                        </td>
                    </tr>
                </tbody>
            </table>

            {e.notes && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', position: 'relative', zIndex: 1 }}>
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
                                fontFamily: FONT, fontSize: '11.5px', color: MID, lineHeight: '1.55',
                                whiteSpace: 'pre-wrap', padding: '8px 14px',
                                border: `1px solid ${BORDER}`, borderTop: 'none'
                            }}>
                                {e.notes}
                            </td>
                        </tr>
                    </tbody>
                </table>
            )}

            {isVoid && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', position: 'relative', zIndex: 1 }}>
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
                                {e.voidNote || 'This expense has been voided without a recorded reason.'}
                            </td>
                        </tr>
                    </tbody>
                </table>
            )}

            {b.expenseTerms && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', position: 'relative', zIndex: 1 }}>
                    <tbody>
                        <tr>
                            <td style={{
                                fontFamily: FONT, fontSize: '9px', fontWeight: '700', letterSpacing: '0.12em',
                                textTransform: 'uppercase', color: MUTED, padding: '8px 14px',
                                border: `1px solid ${BORDER}`, background: '#f8fafc'
                            }}>
                                Terms &amp; Conditions
                            </td>
                        </tr>
                        <tr>
                            <td style={{
                                fontFamily: FONT, fontSize: '11px', color: MID, lineHeight: '1.55',
                                whiteSpace: 'pre-wrap', padding: '8px 14px',
                                border: `1px solid ${BORDER}`, borderTop: 'none'
                            }}>
                                {b.expenseTerms}
                            </td>
                        </tr>
                    </tbody>
                </table>
            )}

            <div style={{ flex: 1 }} />

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px', position: 'relative', zIndex: 1 }}>
                <tbody>
                    <tr>
                        <td style={{ width: '50%', padding: '0', textAlign: 'center' }}>
                            <div style={{ borderTop: `1px solid ${DARK}`, width: '80%', margin: '0 auto', paddingTop: '6px' }}>
                                <div style={{ fontFamily: FONT, fontSize: '11px', fontWeight: '700', color: DARK }}>{preparedBy()}</div>
                                <span style={{ fontFamily: FONT, color: MUTED, fontWeight: '700', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                                    Prepared By
                                </span>
                            </div>
                        </td>
                        <td style={{ width: '50%', padding: '0', textAlign: 'center' }}>
                            <div style={{ height: '18px' }} />
                            <div style={{ borderTop: `1px solid ${DARK}`, width: '80%', margin: '0 auto', paddingTop: '6px' }}>
                                <span style={{ fontFamily: FONT, color: MUTED, fontWeight: '700', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                                    Authorized Signature
                                </span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <table className="eexpense-print-footer" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '14px' }}>
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
                            {b.businessName} &nbsp;|&nbsp; {fmt(e.expenseDate || e.createdAt)}
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
                    div[data-expensevoucher] {
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
                    .eexpense-print-footer { page-break-inside: avoid; }
                    .page-number-target::before {
                        content: "Page 1 of 1";
                    }
                }
            `}</style>
        </div>
    );
});

ExpenseVoucherTemplate.displayName = 'ExpenseVoucherTemplate';

export default ExpenseVoucherTemplate;
