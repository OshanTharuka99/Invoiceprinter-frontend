import React from 'react';

const QuotationTemplate2 = React.forwardRef(({ quotation, business }, ref) => {
    if (!quotation || !business) return null;

    const b = business;
    const q = quotation;

    const currencySymbol = q.currency === 'primary'
        ? (b.primaryCurrency?.symbol || 'Rs.')
        : (b.secondaryCurrency?.symbol || '$');

    const currencyCode = q.currency === 'primary'
        ? (b.primaryCurrency?.code || 'LKR')
        : (b.secondaryCurrency?.code || 'USD');

    const fmt = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const money = (n) =>
        parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

    const showTerms = b.quotationTerms && b.quotationTerms.trim() !== '';
    const showNotes = b.quotationNotes && b.quotationNotes.trim() !== '';
    const showBusinessTin = b.businessTinNumber && b.businessTinNumber.trim() !== '';
    const showValidDate = !!q.validDate;
    const showBank = !!(b.bankAccountNumber || b.bankName);

    const FONT = "'Arial', 'Helvetica Neue', sans-serif";
    const PAGE_W = b.pageWidth || 210;
    const PAGE_H = b.pageHeight || 297;

    // Helper function to convert numeric totals to English Words
    const numberToWords = (num) => {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

        if (num === 0) return 'Zero';

        const numStr = num.toFixed(2);
        const parts = numStr.split('.');
        const integerPart = parseInt(parts[0], 10);
        const decimalPart = parseInt(parts[1], 10);

        const convertSection = (n) => {
            let str = '';
            if (n >= 100) {
                str += ones[Math.floor(n / 100)] + ' Hundred ';
                n %= 100;
            }
            if (n >= 20) {
                str += tens[Math.floor(n / 10)] + ' ';
                n %= 10;
            }
            if (n > 0) {
                str += ones[n] + ' ';
            }
            return str.trim();
        };

        let result = '';
        let scaleIndex = 0;
        let tempNum = integerPart;

        if (integerPart === 0) {
            result = 'Zero';
        } else {
            while (tempNum > 0) {
                const section = tempNum % 1000;
                if (section > 0) {
                    const sectionStr = convertSection(section);
                    result = sectionStr + ' ' + (scales[scaleIndex] ? scales[scaleIndex] + ' ' : '') + result;
                }
                tempNum = Math.floor(tempNum / 1000);
                scaleIndex++;
            }
        }

        result = result.trim();

        if (decimalPart > 0) {
            const dOnes = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
            const firstDigit = Math.floor(decimalPart / 10);
            const secondDigit = decimalPart % 10;
            result += ' point ' + dOnes[firstDigit] + ' ' + dOnes[secondDigit];
        } else {
            result += ' point Zero Zero';
        }

        return result;
    };

    const amountColumnHeader = q.hasTax
        ? `Amount Excluding VAT (${currencySymbol})`
        : `Amount (${currencySymbol})`;

    return (
        <div ref={ref} data-qtemplate style={{
            position: 'relative',
            background: '#fff',
            color: '#000',
            fontFamily: FONT,
            fontSize: '11px',
            lineHeight: '1.5',
            boxSizing: 'border-box',
            width: `${PAGE_W}mm`,
            minHeight: `${PAGE_H}mm`,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            padding: '12mm 14mm 14mm 14mm'
        }}>
            {/* WATERMARK */}
            {q.status === 'Cancelled' && (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div>
                    {b.quotationLogo
                        ? <img src={b.quotationLogo} alt="Logo"
                            style={{ maxHeight: '60px', maxWidth: '180px', objectFit: 'contain', display: 'block' }} />
                        : <div style={{ fontSize: '20px', fontWeight: '900', color: '#000' }}>{b.businessName}</div>
                    }
                </div>
                <div style={{ fontSize: '24px', fontWeight: '900', textTransform: 'uppercase', color: '#000', letterSpacing: '1px' }}>
                    QUOTATION
                </div>
            </div>

            {/* BOXED INFORMATION GRID */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '10.5px', marginBottom: '15px' }}>
                <tbody>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                        <td style={{ width: '50%', borderRight: '1px solid #000', padding: '6px 8px', verticalAlign: 'top' }}>
                            <strong>Date of Quotation:</strong> {fmt(q.createdAt || new Date())}
                        </td>
                        <td style={{ width: '50%', padding: '6px 8px', verticalAlign: 'top' }}>
                            <strong>Quotation No:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{q.quotationId}</span>
                        </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                        <td style={{ borderRight: '1px solid #000', padding: '6px 8px', verticalAlign: 'top', lineHeight: '1.5' }}>
                            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', textDecoration: 'underline' }}>Supplier Details</div>
                            <strong>Name:</strong> {b.businessName}<br />
                            <strong>Address:</strong> {b.address}<br />
                            {b.phoneNumber && <><strong>Tel:</strong> {b.phoneNumber}<br /></>}
                            {b.email && <><strong>Email:</strong> {b.email}<br /></>}
                            {showBusinessTin && <><strong>Supplier's TIN:</strong> {b.businessTinNumber}<br /></>}
                            {b.registrationNumber && <><strong>Supplier's BRC:</strong> {b.registrationNumber}<br /></>}
                        </td>
                        <td style={{ padding: '6px 8px', verticalAlign: 'top', lineHeight: '1.5' }}>
                            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', textDecoration: 'underline' }}>Client Details</div>
                            <strong>Name:</strong> {client.org || client.name}<br />
                            {client.address && <><strong>Address:</strong> {client.address}<br /></>}
                            {client.phone && <><strong>Tel:</strong> {client.phone}<br /></>}
                            {client.email && <><strong>Email:</strong> {client.email}<br /></>}
                            {q.clientRef?.clientId && <><strong>Client ID:</strong> {q.clientRef.clientId}<br /></>}
                        </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                        <td style={{ borderRight: '1px solid #000', padding: '6px 8px', verticalAlign: 'top' }}>
                            <strong>Valid Until:</strong> {showValidDate ? fmt(q.validDate) : '—'}
                        </td>
                        <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                            <strong>Delivery Address:</strong> {q.deliveryAddress ? q.deliveryAddress.replace(/\n/g, ', ') : (b.city ? `${b.city}, ${b.country}` : b.country)}
                        </td>
                    </tr>
                    <tr>
                        <td style={{ borderRight: '1px solid #000', padding: '6px 8px', verticalAlign: 'top', lineHeight: '1.5' }}>
                            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px', textDecoration: 'underline' }}>Prepared By</div>
                            <div>{`${q.createdBy?.firstName || ''} ${q.createdBy?.lastName || ''}`.trim() || 'System'}</div>
                        </td>
                        <td style={{ padding: '6px 8px', verticalAlign: 'top', lineHeight: '1.5' }}>
                            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px', textDecoration: 'underline' }}>General Details</div>
                            <strong>Currency:</strong> {currencyCode}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* MAIN ITEMS TABLE */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '10.5px', marginBottom: '15px' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #000', background: '#f8fafc' }}>
                        <th style={{ borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'left', fontWeight: 'bold', width: '15%' }}>Reference</th>
                        <th style={{ borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'left', fontWeight: 'bold', width: '50%' }}>Description of Goods or Services</th>
                        <th style={{ borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold', width: '10%' }}>Quantity</th>
                        <th style={{ borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', width: '12%' }}>Unit Price</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', width: '13%' }}>{amountColumnHeader}</th>
                    </tr>
                </thead>
                <tbody>
                    {q.items.map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #000' }}>
                            <td style={{ borderRight: '1px solid #000', padding: '6px 8px', verticalAlign: 'top', fontFamily: 'monospace' }}>
                                {item.productRef ? (item.productRef.productId || '—') : '—'}
                            </td>
                            <td style={{ borderRight: '1px solid #000', padding: '6px 8px', verticalAlign: 'top', lineHeight: '1.4' }}>
                                <div style={{ fontWeight: 'bold' }}>
                                    {item.productRef ? item.productRef.name : item.manualName}
                                </div>
                                {item.productRef?.description && (
                                    <div style={{ fontSize: '9.5px', color: '#444', marginTop: '2px' }}>
                                        {item.productRef.description}
                                    </div>
                                )}
                            </td>
                            <td style={{ borderRight: '1px solid #000', padding: '6px 8px', verticalAlign: 'top', textAlign: 'center' }}>
                                {parseFloat(item.quantity || 0).toFixed(2)}
                            </td>
                            <td style={{ borderRight: '1px solid #000', padding: '6px 8px', verticalAlign: 'top', textAlign: 'right' }}>
                                {money(item.unitPrice)}
                            </td>
                            <td style={{ padding: '6px 8px', verticalAlign: 'top', textAlign: 'right' }}>
                                {money(item.lineTotal)}
                            </td>
                        </tr>
                    ))}

                    {/* TOTALS ROWS */}
                    <tr style={{ borderBottom: '1px solid #000' }}>
                        <td colSpan="4" style={{ borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                            Subtotal:
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                            {money(q.subTotal)}
                        </td>
                    </tr>

                    {q.appliedDiscounts?.map((disc, idx) => (
                        <tr key={`disc-${idx}`} style={{ borderBottom: '1px solid #000' }}>
                            <td colSpan="4" style={{ borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                                Discount ({disc.name} {disc.type === 'percentage' ? `${disc.value}%` : ''}):
                            </td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                                − {money(disc.amount)}
                            </td>
                        </tr>
                    ))}

                    {q.hasTax && q.appliedTaxes?.length > 0 && q.appliedTaxes.map((tax, idx) => (
                        <tr key={`tax-${idx}`} style={{ borderBottom: '1px solid #000' }}>
                            <td colSpan="4" style={{ borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                                {tax.name} {tax.type === 'percentage' ? `(${tax.value}%)` : ''}::
                            </td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                                + {money(tax.amount)}
                            </td>
                        </tr>
                    ))}

                    <tr style={{ borderBottom: '1px solid #000' }}>
                        <td colSpan="4" style={{ borderRight: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold', fontSize: '11.5px' }}>
                            Total Amount:
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', fontSize: '11.5px' }}>
                            {currencySymbol} {money(q.finalTotal)}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* AMOUNT IN WORDS */}
            <div style={{ fontSize: '11px', marginBottom: '12px', lineHeight: '1.4' }}>
                <strong>Total Amount in words :</strong> {numberToWords(q.finalTotal)}
            </div>

            {/* BANK DETAILS */}
            {showBank && (
                <div style={{ border: '1px solid #000', padding: '8px', fontSize: '10.5px', marginBottom: '15px', lineHeight: '1.5' }}>
                    <strong>Bank Details for Transfer:</strong>
                    <div style={{ marginTop: '4px' }}>
                        <div><strong>Bank:</strong> {b.bankName} — Account No: <strong>{b.bankAccountNumber}</strong> {b.branchName && `(Branch: ${b.branchName})`}</div>
                        <div><strong>Account Name:</strong> {b.bankAccountName || b.businessName}</div>
                    </div>
                </div>
            )}

            {/* TERMS AND NOTES */}
            {showTerms && (
                <div style={{ marginBottom: '10px', fontSize: '10px' }}>
                    <div style={{ fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px', textTransform: 'uppercase' }}>General Terms &amp; Conditions</div>
                    <div style={{ whiteSpace: 'pre-wrap', color: '#333' }}>{b.quotationTerms}</div>
                </div>
            )}
            {showNotes && (
                <div style={{ marginBottom: '10px', fontSize: '10px' }}>
                    <div style={{ fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px', textTransform: 'uppercase' }}>Note</div>
                    <div style={{ whiteSpace: 'pre-wrap', color: '#333' }}>{b.quotationNotes}</div>
                </div>
            )}

            <div style={{ marginTop: '20px', padding: '8px 0', fontSize: '11px', fontWeight: 'bold', fontStyle: 'italic', borderTop: '1px dashed #000' }}>
                This is a computer generated document and does not require a signature.
            </div>

            {/* FOOTER */}
            <div className="quotation-print-footer" style={{ borderTop: '1px solid #000', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', background: '#fff' }}>
                <div style={{ fontSize: '9px', color: '#555', fontStyle: 'italic' }}>
                    <span className="page-number-target"></span>
                </div>
                <div style={{ fontSize: '9px', color: '#555', textAlign: 'right' }}>
                    {b.businessName} &nbsp;|&nbsp; {fmt(q.createdAt || new Date())}
                </div>
            </div>

            {/* PRINT CSS */}
            <style>{`
                .quotation-print-footer { marginTop: auto !important; }

                @media print {
                    @page {
                        size: ${PAGE_W}mm ${PAGE_H}mm portrait;
                        margin: 14mm 15mm 20mm 15mm;
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
                        margin: 0 !important;
                        position: relative !important;
                    }
                    * { box-shadow: none !important; }
                    tr { page-break-inside: avoid; }

                    .quotation-print-footer {
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

QuotationTemplate2.displayName = 'QuotationTemplate2';

export default QuotationTemplate2;
