import React from 'react';

const ExpenseReportTemplate = React.forwardRef(({ report, business }, ref) => {
    if (!report || !business) return null;

    const b = business;
    const r = report;

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

    const periodLabel = (p) => ({
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        yearly: 'Yearly'
    }[p] || p || '—');

    const labelOf = (row) => row?.name || row?.label || row?.category || row?.purpose
        || row?.paymentMethod || row?._id || '—';

    const amountOf = (row) => row?.total ?? row?.amount ?? row?.value ?? 0;

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

    const th = {
        fontFamily: FONT,
        fontSize: '8.5px',
        fontWeight: '800',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: '#fff',
        background: DIVIDER_COLOR,
        padding: '7px 8px',
        border: `1px solid ${BORDER}`,
        textAlign: 'left',
        whiteSpace: 'nowrap'
    };

    const td = {
        fontFamily: FONT,
        fontSize: '10px',
        fontWeight: '600',
        color: MID,
        padding: '6px 8px',
        border: `1px solid ${BORDER}`,
        verticalAlign: 'middle'
    };

    const breakdown = r.breakdown || {};
    const rows = Array.isArray(r.rows) ? r.rows : [];
    const clientName = r.project?.clientName || '';

    const renderBreakdown = (title, items) => (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
            <tbody>
                <tr>
                    <td style={{
                        fontFamily: FONT, fontSize: '9px', fontWeight: '800', letterSpacing: '0.12em',
                        textTransform: 'uppercase', color: MUTED, padding: '6px 10px',
                        background: '#f8fafc', border: `1px solid ${BORDER}`
                    }}>
                        {title}
                    </td>
                </tr>
                <tr>
                    <td style={{ padding: '0', border: `1px solid ${BORDER}`, borderTop: 'none' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={th}>{title}</th>
                                    <th style={{ ...th, textAlign: 'center', width: '70px' }}>Count</th>
                                    <th style={{ ...th, textAlign: 'right', width: '120px' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(Array.isArray(items) ? items : []).map((item, idx) => (
                                    <tr key={`${title}-${idx}`}>
                                        <td style={td}>{labelOf(item)}</td>
                                        <td style={{ ...td, textAlign: 'center' }}>{item.count ?? 0}</td>
                                        <td style={{ ...td, textAlign: 'right', fontWeight: '800', color: DARK }}>
                                            {currencySymbol} {money(amountOf(item))}
                                        </td>
                                    </tr>
                                ))}
                                {(!Array.isArray(items) || items.length === 0) && (
                                    <tr>
                                        <td style={{ ...td, textAlign: 'center', color: MUTED }} colSpan={3}>No data</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </td>
                </tr>
            </tbody>
        </table>
    );

    return (
        <div ref={ref} data-expensereport style={{
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

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                                fontFamily: FONT, fontSize: '20px', fontWeight: '800', color: TITLE_COLOR,
                                letterSpacing: '1.2px', textTransform: 'uppercase', lineHeight: 1.15, marginBottom: '6px'
                            }}>
                                {r.title || 'Expense Report'}
                            </div>
                            <div style={{ fontFamily: FONT, fontSize: '10px', fontWeight: '700', color: MID, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                {periodLabel(r.period)} Report
                            </div>
                            <div style={{ fontFamily: FONT, fontSize: '10px', color: MUTED, marginTop: '4px' }}>
                                {fmt(r.dateRange?.start)} — {fmt(r.dateRange?.end)}
                            </div>
                            {r.project?.name && (
                                <div style={{ fontFamily: FONT, fontSize: '10.5px', fontWeight: '700', color: DARK, marginTop: '4px' }}>
                                    {r.project.name}{clientName ? ` — ${clientName}` : ''}
                                </div>
                            )}
                        </td>
                    </tr>
                </tbody>
            </table>

            <div style={{ height: '3px', background: DIVIDER_COLOR, margin: '10px 0 12px' }} />

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                <tbody>
                    <tr>
                        <td style={{
                            fontFamily: FONT, fontSize: '9px', fontWeight: '800', letterSpacing: '0.12em',
                            textTransform: 'uppercase', color: '#fff', padding: '8px 14px',
                            background: DIVIDER_COLOR, width: '55%', verticalAlign: 'middle'
                        }}>
                            Total Expense
                        </td>
                        <td style={{
                            fontFamily: FONT, fontSize: '24px', fontWeight: '800', color: TITLE_COLOR,
                            textAlign: 'right', padding: '8px 14px', background: '#f8fafc',
                            border: `1px solid ${BORDER}`, borderLeft: 'none', whiteSpace: 'nowrap', verticalAlign: 'middle'
                        }}>
                            {currencySymbol} {money(r.total)}
                        </td>
                    </tr>
                    <tr>
                        <td style={{
                            fontFamily: FONT, fontSize: '9px', fontWeight: '700', letterSpacing: '0.12em',
                            textTransform: 'uppercase', color: MUTED, padding: '7px 14px',
                            background: '#fff', border: `1px solid ${BORDER}`, borderTop: 'none'
                        }}>
                            Number of Expenses
                        </td>
                        <td style={{
                            fontFamily: FONT, fontSize: '12px', fontWeight: '800', color: DARK, textAlign: 'right',
                            padding: '7px 14px', background: '#fff', border: `1px solid ${BORDER}`, borderTop: 'none', borderLeft: 'none'
                        }}>
                            {r.count ?? 0}
                        </td>
                    </tr>
                </tbody>
            </table>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                <thead>
                    <tr>
                        <th style={{ ...th, width: '80px' }}>Date</th>
                        <th style={{ ...th, width: '100px' }}>No</th>
                        <th style={{ ...th, width: '120px' }}>Bill No</th>
                        <th style={{ ...th, width: '120px' }}>Category</th>
                        <th style={th}>Paid To</th>
                        <th style={{ ...th, width: '110px' }}>Purpose</th>
                        <th style={{ ...th, width: '100px' }}>Method</th>
                        <th style={{ ...th, width: '100px', textAlign: 'right' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, idx) => (
                        <tr key={`${row._id || row.expenseNumber || 'row'}-${idx}`}>
                            <td style={td}>{fmt(row.expenseDate || row.date || row.createdAt)}</td>
                            <td style={{ ...td, fontFamily: 'ui-monospace, Consolas, monospace', fontWeight: '700' }}>
                                {row.expenseNumber || row.no || '—'}
                            </td>
                            <td style={{ ...td, fontFamily: 'ui-monospace, Consolas, monospace' }}>{row.billNumber || '—'}</td>
                            <td style={td}>{row.categoryName || row.category || '—'}</td>
                            <td style={td}>{row.paidTo || row.name || '—'}</td>
                            <td style={td}>{purposeLabel(row.purpose)}</td>
                            <td style={td}>{methodLabel(row.paymentMethod)}</td>
                            <td style={{ ...td, textAlign: 'right', fontWeight: '800', color: DARK }}>
                                {currencySymbol} {money(row.amount ?? row.total)}
                            </td>
                        </tr>
                    ))}
                    {rows.length === 0 && (
                        <tr>
                            <td style={{ ...td, textAlign: 'center', color: MUTED }} colSpan={8}>No expenses for this period</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {renderBreakdown('Category', breakdown.category)}
            {renderBreakdown('Purpose', breakdown.purpose)}
            {renderBreakdown('Payment Method', breakdown.paymentMethod)}

            {(b.expenseNotes || b.expenseTerms) && (
                <>
                    {b.expenseNotes && (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
                            <tbody>
                                <tr>
                                    <td style={{
                                        fontFamily: FONT, fontSize: '9px', fontWeight: '800', letterSpacing: '0.12em',
                                        textTransform: 'uppercase', color: MUTED, padding: '7px 12px',
                                        border: `1px solid ${BORDER}`, background: '#f8fafc'
                                    }}>
                                        Notes
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{
                                        fontFamily: FONT, fontSize: '10.5px', color: MID, lineHeight: '1.55',
                                        whiteSpace: 'pre-wrap', padding: '7px 12px',
                                        border: `1px solid ${BORDER}`, borderTop: 'none'
                                    }}>
                                        {b.expenseNotes}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                    {b.expenseTerms && (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
                            <tbody>
                                <tr>
                                    <td style={{
                                        fontFamily: FONT, fontSize: '9px', fontWeight: '800', letterSpacing: '0.12em',
                                        textTransform: 'uppercase', color: MUTED, padding: '7px 12px',
                                        border: `1px solid ${BORDER}`, background: '#f8fafc'
                                    }}>
                                        Terms &amp; Conditions
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{
                                        fontFamily: FONT, fontSize: '10.5px', color: MID, lineHeight: '1.55',
                                        whiteSpace: 'pre-wrap', padding: '7px 12px',
                                        border: `1px solid ${BORDER}`, borderTop: 'none'
                                    }}>
                                        {b.expenseTerms}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                </>
            )}

            <div style={{ flex: 1 }} />

            <table className="eexpense-report-print-footer" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
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
                            {b.businessName} &nbsp;|&nbsp; {periodLabel(r.period)} &nbsp;|&nbsp; {fmt(r.dateRange?.start)}
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
                    div[data-expensereport] {
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
                    .eexpense-report-print-footer { page-break-inside: avoid; }
                    .page-number-target::before {
                        content: "Page 1 of 1";
                    }
                }
            `}</style>
        </div>
    );
});

ExpenseReportTemplate.displayName = 'ExpenseReportTemplate';

export default ExpenseReportTemplate;
