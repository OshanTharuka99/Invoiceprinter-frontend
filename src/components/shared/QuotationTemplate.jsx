import React from 'react';

const QuotationTemplate = React.forwardRef(({ quotation, business }, ref) => {
    if (!quotation || !business) return null;

    const b = business;
    const q = quotation;

    const formatDate = (d) => new Date(d).toLocaleDateString('en-GB');

    return (
        <div ref={ref} style={{
            background: '#ffffff',
            color: '#000',
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            padding: '40px',
            boxSizing: 'border-box',
            width: '210mm',
            minHeight: '297mm', // A4 proportion
            margin: '0 auto',
            position: 'relative'
        }}>
            {/* Header section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '20px', marginBottom: '30px' }}>
                <div style={{ maxWidth: '300px' }}>
                    {b.quotationLogo ? (
                        <img src={b.quotationLogo} alt="Business Logo" style={{ maxHeight: '80px', maxWidth: '250px', objectFit: 'contain', marginBottom: '15px' }} />
                    ) : (
                        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', color: '#0f172a', fontWeight: '900' }}>{b.businessName}</h1>
                    )}
                    <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
                        {b.address && <div>{b.address}</div>}
                        {b.city && <div>{b.city}, {b.country}</div>}
                        <div style={{ marginTop: '5px' }}>
                            {b.phoneNumber && <span>Tel: {b.phoneNumber} <br /></span>}
                            {b.email && <span>Email: {b.email}</span>}
                        </div>
                    </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '36px', fontWeight: '900', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '15px' }}>
                        QUOTATION
                    </div>
                    <table style={{ marginLeft: 'auto', fontSize: '13px', borderCollapse: 'collapse' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '4px 10px', fontWeight: 'bold', color: '#64748b', textAlign: 'right' }}>Quotation No:</td>
                                <td style={{ padding: '4px 10px', fontWeight: 'bold', color: '#0f172a' }}>{q.quotationId}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '4px 10px', fontWeight: 'bold', color: '#64748b', textAlign: 'right' }}>Date:</td>
                                <td style={{ padding: '4px 10px', color: '#0f172a' }}>{formatDate(q.createdAt || new Date())}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '4px 10px', fontWeight: 'bold', color: '#64748b', textAlign: 'right' }}>Method:</td>
                                <td style={{ padding: '4px 10px', color: '#0f172a', textTransform: 'capitalize' }}>{q.creationMethod}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Client Section */}
            <div style={{ marginBottom: '30px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', background: '#f1f5f9', padding: '5px 10px', display: 'inline-block', marginBottom: '10px' }}>
                    QUOTATION FOR:
                </div>
                <div style={{ fontSize: '14px', lineHeight: '1.5', paddingLeft: '10px', borderLeft: '3px solid #e2e8f0' }}>
                    {q.clientRef ? (
                        <>
                            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{q.clientRef.firstName} {q.clientRef.lastName}</div>
                            {q.clientRef.address && <div>{q.clientRef.address}</div>}
                            {q.clientRef.telephoneNumber && <div>Ph: {q.clientRef.telephoneNumber}</div>}
                            {q.clientRef.emailAddress && <div>Email: {q.clientRef.emailAddress}</div>}
                        </>
                    ) : (
                        <>
                            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{q.manualClientDetails?.name || 'Unknown Client'}</div>
                            {q.manualClientDetails?.address && <div>{q.manualClientDetails.address}</div>}
                            {q.manualClientDetails?.telephoneNumber && <div>Ph: {q.manualClientDetails.telephoneNumber}</div>}
                            {q.manualClientDetails?.emailAddress && <div>Email: {q.manualClientDetails.emailAddress}</div>}
                        </>
                    )}
                </div>
            </div>

            {/* Line Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '13px' }}>
                <thead>
                    <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', width: '5%' }}>#</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', width: '45%' }}>Description</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', width: '15%' }}>Qty</th>
                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', width: '15%' }}>Unit Price</th>
                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', width: '20%' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {q.items.map((item, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #e2e8f0', background: index % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
                            <td style={{ padding: '12px' }}>{index + 1}</td>
                            <td style={{ padding: '12px', fontWeight: 'bold', color: '#0f172a' }}>
                                {item.productRef ? item.productRef.name : item.manualName}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                                {parseFloat(item.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                                {parseFloat(item.lineTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals Section */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
                <div style={{ width: '350px' }}>
                    <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '8px', color: '#64748b', fontWeight: 'bold' }}>Subtotal</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
                                    {parseFloat(q.subTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                            
                            {q.hasDiscount && (
                                <tr style={{ color: '#059669' }}>
                                    <td style={{ padding: '8px', fontWeight: 'bold' }}>
                                        Discount {q.discountType === 'percentage' && `(${q.discountValue}%)`}
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
                                        - {q.discountType === 'fixed' ? parseFloat(q.discountValue).toLocaleString('en-US', { minimumFractionDigits: 2 }) : parseFloat((q.subTotal * q.discountValue) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            )}

                            {q.hasTax && (
                                <tr style={{ color: '#dc2626' }}>
                                    <td style={{ padding: '8px', fontWeight: 'bold' }}>
                                        {q.taxName} Tax ({q.taxPercentage}%)
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
                                        + {parseFloat(((q.hasDiscount && q.discountType === 'percentage' ? q.subTotal - (q.subTotal * q.discountValue / 100) : q.hasDiscount && q.discountType === 'fixed' ? q.subTotal - q.discountValue : q.subTotal) * q.taxPercentage) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            )}

                            <tr style={{ background: '#f1f5f9', borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a' }}>
                                <td style={{ padding: '12px 8px', fontWeight: '900', fontSize: '18px', color: '#0f172a' }}>Total Amount</td>
                                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '900', fontSize: '18px', color: '#0f172a' }}>
                                    {q.currency === 'primary' ? b.primaryCurrency?.symbol || 'Rs.' : b.secondaryCurrency?.symbol || '$'} {parseFloat(q.finalTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer / Meta Data attached to the bottom */}
            <div style={{ position: 'absolute', bottom: '40px', left: '40px', right: '40px' }}>
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '15px', color: '#64748b', fontSize: '11px', lineHeight: '1.6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <strong>Terms & Conditions:</strong><br />
                            1. This quotation is valid for 30 days from the date of issue.<br />
                            2. Errors and omissions excepted (E&OE).
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ marginBottom: '5px' }}><strong>Generated By:</strong></div>
                            <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                {q.createdBy?.firstName} {q.createdBy?.lastName}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Print specific CSS hidden in normal view but active during window.print */}
            <style>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
});

export default QuotationTemplate;
