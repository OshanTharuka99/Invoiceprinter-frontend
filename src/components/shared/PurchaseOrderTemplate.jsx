import React from 'react';

const PurchaseOrderTemplate = React.forwardRef(({ po, business }, ref) => {
    if (!po || !business) return null;

    const b = business;
    const p = po;

    /* ── Helpers ── */
    const currencySymbol = p.currency === 'primary'
        ? (b.primaryCurrency?.symbol || 'Rs.')
        : (b.secondaryCurrency?.symbol || '$');

    const fmt = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const money = (n) =>
        parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const getSupplier = () => {
        if (p.supplierRef) {
            const s = p.supplierRef;
            return {
                name: s.name || '',
                address: s.address || '',
                phone: s.telephoneNumber || '',
                email: s.emailAddress || '',
                bankDetails: s.bankDetails || {}
            };
        }
        return { name: 'N/A', address: '', phone: '', email: '', bankDetails: {} };
    };

    const supplier = getSupplier();

    /* ── Visibility flags ── */
    const showTerms = p.terms && p.terms.trim() !== '';
    const showNotes = p.notes && p.notes.trim() !== '';
    const showVatNo = b.isVatRegistered && b.vatNumber && b.vatNumber.trim() !== '';
    const hasDeliveryAddress = p.deliveryAddress && p.deliveryAddress.trim() !== '';
    const showSupplierBank = supplier.bankDetails?.accountNumber || supplier.bankDetails?.bankName;

    /* ── Shared style tokens ── */
    const FONT = "'Arial', 'Helvetica Neue', sans-serif";
    const DARK = '#0f172a';
    const MID = '#475569';
    const LIGHT = '#94a3b8';
    const BORDER = '#e2e8f0';
    const PO_TITLE_COLOR = b.purchaseOrderTitleColor || '#0284c7';
    const PO_DIVIDER_COLOR = b.purchaseOrderDividerColor || '#0284c7';
    const PAGE_W = b.pageWidth || 210;
    const PAGE_H = b.pageHeight || 297;

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
        <div ref={ref} data-potemplate style={{
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

            {/* ── HEADER ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

                {/* Left: logo / company */}
                <div style={{ maxWidth: '52%' }}>
                    {b.quotationLogo
                        ? <img src={b.quotationLogo} alt="Logo"
                            style={{ maxHeight: '75px', maxWidth: '180px', objectFit: 'contain', display: 'block', marginBottom: '8px' }} />
                        : <div style={{ fontFamily: FONT, fontSize: '20px', fontWeight: '900', color: DARK, marginBottom: '6px' }}>{b.businessName}</div>
                    }
                    <div style={{ fontFamily: FONT, color: MID, fontSize: '11.5px', lineHeight: '1.75' }}>
                        {b.businessName && <div style={{ fontWeight: '700' }}>{b.businessName}</div>}
                        {b.address && <div>{b.address}</div>}
                        {b.phoneNumber && <div>Tel: {b.phoneNumber}</div>}
                        {b.email && <div>Email: {b.email}</div>}
                        {showVatNo && <div style={{ color: DARK, fontWeight: '700', marginTop: '4px' }}>TAX ID : {b.vatNumber}</div>}
                    </div>
                </div>

                {/* Right: PURCHASE ORDER title + meta */}
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: FONT, fontSize: '26px', fontWeight: '900', color: PO_TITLE_COLOR, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
                        PURCHASE ORDER
                    </div>
                    <table style={{ marginLeft: 'auto', borderCollapse: 'collapse' }}>
                        <tbody>
                            {[
                                { label: 'PO Number', value: p.poNumber, mono: true, large: true },
                                { label: 'PO Date', value: fmt(p.poDate || p.createdAt) },
                                { label: 'Supplier Quote #', value: p.supplierQuotationNumber, mono: true },
                                { label: 'Prepared By', value: `${p.createdBy?.firstName || ''} ${p.createdBy?.lastName || ''}`.trim() }
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
            <div style={{ height: '4px', background: PO_DIVIDER_COLOR, margin: '14px 0 16px' }} />

            {/* ── SUPPLIER & DELIVERY ADDRESS ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: FONT, fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', color: LIGHT, marginBottom: '7px' }}>
                        Supplier Vendor
                    </div>
                    <div style={{ fontFamily: FONT, lineHeight: '1.8' }}>
                        {supplier.name && <div style={{ fontWeight: '800', fontSize: '14px', color: DARK }}>{supplier.name}</div>}
                        {supplier.address && <div style={{ color: MID, fontSize: '12px' }}>{supplier.address}</div>}
                        {supplier.phone && <div style={{ color: MID, fontSize: '12px' }}>Tel: {supplier.phone}</div>}
                        {supplier.email && <div style={{ color: MID, fontSize: '12px' }}>Email: {supplier.email}</div>}
                    </div>
                </div>

                {hasDeliveryAddress && (
                    <div style={{ flex: 1, textAlign: 'right' }}>
                        <div style={{ fontFamily: FONT, fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', color: LIGHT, marginBottom: '7px' }}>
                            Delivery Destination
                        </div>
                        <div style={{ fontFamily: FONT, lineHeight: '1.8', color: MID, fontSize: '12px' }}>
                            {p.deliveryAddress.split('\n').map((line, i) => (
                                <div key={i}>{line}</div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── ITEMS TABLE ── */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                    <tr style={{ background: PO_DIVIDER_COLOR, color: '#fff' }}>
                        <th style={{ fontFamily: FONT, padding: '9px 10px', textAlign: 'left', fontWeight: '700', fontSize: '11.5px', width: '5%' }}>No</th>
                        <th style={{ fontFamily: FONT, padding: '9px 10px', textAlign: 'left', fontWeight: '700', fontSize: '11.5px', width: '47%' }}>Description</th>
                        <th style={{ fontFamily: FONT, padding: '9px 10px', textAlign: 'center', fontWeight: '700', fontSize: '11.5px', width: '10%' }}>Qty</th>
                        <th style={{ fontFamily: FONT, padding: '9px 10px', textAlign: 'right', fontWeight: '700', fontSize: '11.5px', width: '19%' }}>Unit Price ({currencySymbol})</th>
                        <th style={{ fontFamily: FONT, padding: '9px 10px', textAlign: 'right', fontWeight: '700', fontSize: '11.5px', width: '19%' }}>Amount ({currencySymbol})</th>
                    </tr>
                </thead>
                <tbody>
                    {p.items.map((item, i) => (
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
                <table style={{ width: '360px', borderCollapse: 'collapse', border: `1px solid ${BORDER}` }}>
                    <tbody>
                        <tr>
                            <td style={{ fontFamily: FONT, color: MID, fontWeight: '600', fontSize: '12.5px', padding: '8px 14px', background: '#f8fafc', borderBottom: `1px solid ${BORDER}` }}>Subtotal</td>
                            <td style={{ fontFamily: FONT, color: DARK, fontWeight: '700', fontSize: '12.5px', padding: '8px 14px', background: '#f8fafc', borderBottom: `1px solid ${BORDER}`, textAlign: 'right' }}>{currencySymbol} {money(p.subTotal)}</td>
                        </tr>
                        {p.appliedDiscounts?.map((disc, i) => (
                            <tr key={`d-${i}`}>
                                <td style={{ fontFamily: FONT, color: DARK, fontWeight: '600', fontSize: '12.5px', padding: '8px 14px', background: '#f8fafc', borderBottom: `1px solid ${BORDER}` }}>
                                    Discount ({disc.name} {disc.type === 'percentage' ? disc.value + '%' : ''})
                                </td>
                                <td style={{ fontFamily: FONT, color: DARK, fontWeight: '700', fontSize: '12.5px', padding: '8px 14px', background: '#f8fafc', borderBottom: `1px solid ${BORDER}`, textAlign: 'right' }}>− {currencySymbol} {money(disc.amount)}</td>
                            </tr>
                        ))}
                        {p.hasTax && p.appliedTaxes?.length > 0 && p.appliedTaxes.map((tax, i) => (
                            <tr key={`t-${i}`}>
                                <td style={{ fontFamily: FONT, color: DARK, fontWeight: '600', fontSize: '12.5px', padding: '8px 14px', background: '#f8fafc', borderBottom: `1px solid ${BORDER}` }}>
                                    {tax.name} {tax.type === 'percentage' ? `(${tax.value}%)` : ''}
                                </td>
                                <td style={{ fontFamily: FONT, color: DARK, fontWeight: '700', fontSize: '12.5px', padding: '8px 14px', background: '#f8fafc', borderBottom: `1px solid ${BORDER}`, textAlign: 'right' }}>+ {currencySymbol} {money(tax.amount)}</td>
                            </tr>
                        ))}
                        <tr>
                            <td style={{ fontFamily: FONT, color: '#fff', fontWeight: '900', fontSize: '13.5px', padding: '12px 14px', background: PO_DIVIDER_COLOR }}>Total PO Sum</td>
                            <td style={{ fontFamily: FONT, color: '#fff', fontWeight: '900', fontSize: '14.5px', padding: '12px 14px', background: PO_DIVIDER_COLOR, textAlign: 'right' }}>{currencySymbol} {money(p.finalTotal)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* ── DIVIDER ── */}
            <div style={{ height: '4px', background: PO_DIVIDER_COLOR, margin: '14px 0 16px' }} />

            {/* ── TERMS & CONDITIONS ── */}
            {showTerms && (
                <div style={{ marginBottom: '14px', paddingBottom: '14px' }}>
                    <div style={{ ...sectionTitle, fontFamily: FONT }}>Terms &amp; Conditions</div>
                    <div style={{ fontFamily: FONT, fontSize: '11px', color: MID, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                        {p.terms}
                    </div>
                </div>
            )}

            {/* ── NOTE ── */}
            {showNotes && (
                <div style={{ marginBottom: '14px', paddingBottom: '14px' }}>
                    <div style={{ ...sectionTitle, fontFamily: FONT }}>Instructions &amp; Notes</div>
                    <div style={{ fontFamily: FONT, fontSize: '11px', color: MID, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                        {p.notes}
                    </div>
                </div>
            )}

            {/* ── SUPPLIER REMITTANCE INFO ── */}
            {showSupplierBank && (
                <div style={{ marginBottom: '18px' }}>
                    <div style={{ ...sectionTitle, fontFamily: FONT }}>Supplier Remittance Bank Details</div>
                    <div style={{ fontFamily: FONT, fontSize: '11.5px', lineHeight: '1.8', color: DARK }}>
                        {supplier.bankDetails.accountNumber && (
                            <div><span style={{ color: MID, fontWeight: '600', display: 'inline-block', width: '120px' }}>Account No:</span> <strong>{supplier.bankDetails.accountNumber}</strong></div>
                        )}
                        {supplier.bankDetails.accountName && (
                            <div><span style={{ color: MID, fontWeight: '600', display: 'inline-block', width: '120px' }}>Account Name:</span> <strong>{supplier.bankDetails.accountName}</strong></div>
                        )}
                        {supplier.bankDetails.bankName && (
                            <div><span style={{ color: MID, fontWeight: '600', display: 'inline-block', width: '120px' }}>Bank:</span> <strong>{supplier.bankDetails.bankName}</strong></div>
                        )}
                        {supplier.bankDetails.branch && (
                            <div><span style={{ color: MID, fontWeight: '600', display: 'inline-block', width: '120px' }}>Branch:</span> <strong>{supplier.bankDetails.branch}</strong></div>
                        )}
                    </div>
                </div>
            )}

            <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                <p style={{ color: MID, fontStyle: 'italic', fontFamily: FONT, fontSize: '11px', fontWeight: 'bold' }}>This is an authorized corporate purchase order and is computer-generated.</p>
            </div>

            {/* ── FOOTER ── */}
            <div className="po-print-footer" style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', background: '#fff' }}>
                <div style={{ fontFamily: FONT, fontSize: '10px', color: LIGHT, fontStyle: 'italic' }}>
                    <span className="po-page-number-target"></span>
                </div>
                <div style={{ fontFamily: FONT, fontSize: '10px', color: LIGHT, textAlign: 'right' }}>
                    {b.businessName} &nbsp;|&nbsp; PO Date: {fmt(p.poDate || p.createdAt)}
                </div>
            </div>

            {/* ── PRINT CSS ── */}
            <style>{`
                .po-print-footer { marginTop: auto !important; }

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
                    div[data-potemplate] {
                        padding: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        position: relative !important;
                    }
                    * { box-shadow: none !important; }
                    tr { page-break-inside: avoid; }
                    
                    .po-print-footer {
                        position: fixed !important;
                        bottom: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        padding-bottom: 2mm !important;
                        background: white !important;
                        z-index: 10;
                    }

                    .po-page-number-target::before {
                        counter-increment: page;
                        content: "Page " counter(page);
                    }
                }
            `}</style>
        </div>
    );
});

PurchaseOrderTemplate.displayName = 'PurchaseOrderTemplate';

export default PurchaseOrderTemplate;
