import React from 'react';

const InvoiceTemplate2 = React.forwardRef(({ invoice, business }, ref) => {
    if (!invoice || !business) return null;

    const b = business;
    const inv = invoice;

    const currencySymbol = inv.currency === 'primary'
        ? (b.primaryCurrency?.symbol || 'Rs.')
        : (b.secondaryCurrency?.symbol || '$');

    const currencyCode = inv.currency === 'primary'
        ? (b.primaryCurrency?.code || 'LKR')
        : (b.secondaryCurrency?.code || 'USD');

    const fmt = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const money = (n) =>
        parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

    const FONT = "'Arial', 'Helvetica Neue', sans-serif";
    const PAGE_W = b.pageWidth || 210;
    const PAGE_H = b.pageHeight || 297;

    const paymentLabels = {
        cash: 'Cash',
        cheque: 'Cheque',
        bank_transfer: 'Bank Transfer',
        credit: 'Credit'
    };

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

    const amountColumnHeader = inv.hasTax
        ? `Amount Excluding VAT (${currencySymbol})`
        : `Amount (${currencySymbol})`;

    return (
        <div ref={ref} data-invoicetemplate style={{
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div>
                    {b.quotationLogo
                        ? <img src={b.quotationLogo} alt="Logo"
                            style={{ maxHeight: '60px', maxWidth: '180px', objectFit: 'contain', display: 'block' }} />
                        : <div style={{ fontSize: '20px', fontWeight: '900', color: '#000' }}>{b.businessName}</div>
                    }
                </div>
                <div style={{ fontSize: '24px', fontWeight: '900', textTransform: 'uppercase', color: '#000', letterSpacing: '1px' }}>
                    {b.isVatRegistered ? 'TAX INVOICE' : 'INVOICE'}
                </div>
            </div>

            {/* BOXED INFORMATION GRID */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '10.5px', marginBottom: '15px' }}>
                <tbody>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                        <td style={{ width: '50%', borderRight: '1px solid #000', padding: '6px 8px', verticalAlign: 'top' }}>
                            <strong>Date of Invoice:</strong> {fmt(inv.invoiceDate || inv.createdAt || new Date())}
                        </td>
                        <td style={{ width: '50%', padding: '6px 8px', verticalAlign: 'top' }}>
                            <strong>{b.isVatRegistered ? 'Tax Invoice No:' : 'Invoice No:'}</strong> <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{inv.invoiceNumber}</span>
                        </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                        <td style={{ borderRight: '1px solid #000', padding: '6px 8px', verticalAlign: 'top', lineHeight: '1.5' }}>
                            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', textDecoration: 'underline' }}>S Details</div>
                            <strong>Name:</strong> {b.businessName}<br />
                            <strong>Address:</strong> {b.address}<br />
                            {b.phoneNumber && <><strong>Tel:</strong> {b.phoneNumber}<br /></>}
                            {b.email && <><strong>Email:</strong> {b.email}<br /></>}
                            {showVatNo && <><strong>Supplier's TIN:</strong> {b.vatNumber}<br /></>}
                            {b.registrationNumber && <><strong>Supplier's BRC:</strong> {b.registrationNumber}<br /></>}
                        </td>
                        <td style={{ padding: '6px 8px', verticalAlign: 'top', lineHeight: '1.5' }}>
                            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', textDecoration: 'underline' }}>Purchaser Details</div>
                            <strong>Name:</strong> {client.org || client.name}<br />
                            {client.address && <><strong>Address:</strong> {client.address}<br /></>}
                            {client.phone && <><strong>Tel:</strong> {client.phone}<br /></>}
                            {client.email && <><strong>Email:</strong> {client.email}<br /></>}
                            {inv.clientRef?.clientId && <><strong>Purchaser's ID:</strong> {inv.clientRef.clientId}<br /></>}
                        </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                        <td style={{ borderRight: '1px solid #000', padding: '6px 8px', verticalAlign: 'top' }}>
                            <strong>Date of Delivery:</strong> {fmt(inv.invoiceDate || inv.createdAt || new Date())}
                        </td>
                        <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                            <strong>Place of Supply:</strong> {inv.deliveryAddress ? inv.deliveryAddress.replace(/\n/g, ', ') : (b.city ? `${b.city}, ${b.country}` : b.country)}
                        </td>
                    </tr>
                    <tr>
                        <td style={{ borderRight: '1px solid #000', padding: '6px 8px', verticalAlign: 'top', lineHeight: '1.5' }}>
                            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px', textDecoration: 'underline' }}>Additional Information</div>
                            {inv.customerPO && <div><strong>Customer PO No:</strong> {inv.customerPO}</div>}
                            {inv.deliveryNoteRef && (
                                <div><strong>Delivery Note:</strong> {typeof inv.deliveryNoteRef === 'object' ? (inv.deliveryNoteRef.deliveryNoteNumber || 'DN') : inv.deliveryNoteRef}</div>
                            )}
                            {!inv.customerPO && !inv.deliveryNoteRef && <div>No additional info.</div>}
                        </td>
                        <td style={{ padding: '6px 8px', verticalAlign: 'top', lineHeight: '1.5' }}>
                            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px', textDecoration: 'underline' }}>Payment Details</div>
                            <strong>Payment Method:</strong> {paymentLabels[inv.paymentMethod] || inv.paymentMethod}<br />
                            {inv.paymentMethod === 'credit' && inv.creditPeriod?.duration > 0 && (
                                <><strong>Credit Terms:</strong> {inv.creditPeriod.duration} {inv.creditPeriod.unit}<br /></>
                            )}
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
                    {inv.items.map((item, i) => (
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
                                {item.serialNumbers?.length > 0 && (
                                    <div style={{ fontSize: '9.5px', fontWeight: 'bold', color: '#111', marginTop: '4px', borderTop: '1px dashed #ccc', paddingTop: '2px' }}>
                                        {item.serialNumbers.join(', ')}
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
                            Total Value of Supply:
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                            {money(inv.subTotal)}
                        </td>
                    </tr>

                    {inv.appliedDiscounts?.map((disc, idx) => (
                        <tr key={`disc-${idx}`} style={{ borderBottom: '1px solid #000' }}>
                            <td colSpan="4" style={{ borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                                Discount ({disc.name} {disc.type === 'percentage' ? `${disc.value}%` : ''}):
                            </td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                                − {money(disc.amount)}
                            </td>
                        </tr>
                    ))}

                    {inv.hasTax && inv.appliedTaxes?.length > 0 && inv.appliedTaxes.map((tax, idx) => (
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
                            {currencySymbol} {money(inv.finalTotal)}
                        </td>
                    </tr>

                    {inv.hasAdvancePayment && inv.advanceAmount > 0 && (
                        <>
                            <tr style={{ borderBottom: '1px solid #000' }}>
                                <td colSpan="4" style={{ borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                                    Advance Paid:
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                                    − {money(inv.advanceAmount)}
                                </td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #000' }}>
                                <td colSpan="4" style={{ borderRight: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold', fontSize: '11.5px' }}>
                                    Balance Due:
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', fontSize: '11.5px' }}>
                                    {currencySymbol} {money(inv.balanceDue ?? (inv.finalTotal - inv.advanceAmount))}
                                </td>
                            </tr>
                        </>
                    )}
                </tbody>
            </table>

            {/* AMOUNT IN WORDS */}
            <div style={{ fontSize: '11px', marginBottom: '12px', lineHeight: '1.4' }}>
                <strong>Total Amount in words :</strong> {numberToWords(inv.finalTotal)}
            </div>

            {/* MODE OF PAYMENT / BANK DETAILS */}
            <div style={{ border: '1px solid #000', padding: '8px', fontSize: '10.5px', marginBottom: '15px', lineHeight: '1.5' }}>
                <strong>Mode of Payment:</strong>
                <div style={{ marginTop: '4px' }}>
                    {showBank ? (
                        <>
                            <div><strong>Bank Transfer / Deposit:</strong> {b.bankName} — Account No: <strong>{b.bankAccountNumber}</strong> {b.branchName && `(Branch: ${b.branchName})`}</div>
                            <div><strong>Account Name:</strong> {b.bankAccountName || b.businessName}</div>
                        </>
                    ) : (
                        <div><strong>Payment Method:</strong> {paymentLabels[inv.paymentMethod] || inv.paymentMethod}</div>
                    )}
                    {b.bankAccountName && (
                        <div style={{ marginTop: '2px' }}><strong>Cheque Payment:</strong> All Cheques should be drawn in favor of '{b.bankAccountName}'</div>
                    )}
                </div>
            </div>

            {/* TERMS AND NOTES */}
            {showTerms && (
                <div style={{ marginBottom: '10px', fontSize: '10px' }}>
                    <div style={{ fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px', textTransform: 'uppercase' }}>Terms & Conditions</div>
                    <div style={{ whiteSpace: 'pre-wrap', color: '#333' }}>{b.invoiceTerms}</div>
                </div>
            )}
            {showNotes && (
                <div style={{ marginBottom: '10px', fontSize: '10px' }}>
                    <div style={{ fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px', textTransform: 'uppercase' }}>Notes</div>
                    <div style={{ whiteSpace: 'pre-wrap', color: '#333' }}>{b.invoiceNotes}</div>
                </div>
            )}

            {/* AUTHORIZED SIGNATURES */}
            <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ textAlign: 'center', width: '200px' }}>
                    <div style={{ borderBottom: '1px solid #000', marginBottom: '8px', height: '40px' }}></div>
                    <div style={{ fontSize: '9.5px', fontWeight: 'bold', textTransform: 'uppercase' }}>Authorized Signature</div>
                </div>
                <div style={{ textAlign: 'center', width: '200px' }}>
                    <div style={{ borderBottom: '1px solid #000', marginBottom: '8px', height: '40px' }}></div>
                    <div style={{ fontSize: '9.5px', fontWeight: 'bold', textTransform: 'uppercase' }}>Received By</div>
                    <div style={{ marginTop: '12px', textAlign: 'left', fontSize: '9.5px', lineHeight: '1.8' }}>
                        <div>Name : .........................................</div>
                        <div>ID : ...............................................</div>
                        <div>Designation : ...............................</div>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div className="invoice-print-footer" style={{ borderTop: '1px solid #000', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                <div style={{ fontSize: '9px', color: '#555', fontStyle: 'italic' }}>
                    <span className="page-number-target"></span>
                </div>
                <div style={{ fontSize: '9px', color: '#555', textAlign: 'right' }}>
                    {b.businessName} &nbsp;|&nbsp; {fmt(inv.createdAt || new Date())}
                </div>
            </div>

            {/* PRINT CSS */}
            <style>{`
                .invoice-print-footer { marginTop: auto !important; }

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

InvoiceTemplate2.displayName = 'InvoiceTemplate2';

export default InvoiceTemplate2;
