import React from 'react';

const SalesReturnUserManual = React.forwardRef(({ business }, ref) => {
    const b = business || {};
    const validityDuration = b.salesReturnValidityDuration ?? 30;
    const validityUnit = b.salesReturnValidityUnit || 'days';
    const prefix = b.salesReturnPrefix || 'SRN';

    const FONT = "'Arial', 'Helvetica Neue', sans-serif";
    const DARK = '#0f172a';
    const MID = '#475569';
    const LIGHT = '#64748b';
    const BORDER = '#e2e8f0';
    const ACCENT = '#b91c1c';
    const PAGE_W = 210;

    const Section = ({ num, title, children }) => (
        <div style={{ marginBottom: '18px', pageBreakInside: 'avoid' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{
                    background: ACCENT, color: '#fff', fontWeight: 800, fontSize: '11px',
                    width: '24px', height: '24px', borderRadius: '6px', display: 'inline-flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{num}</span>
                <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: DARK }}>{title}</h2>
            </div>
            <div style={{ paddingLeft: '34px', color: MID, fontSize: '11.5px', lineHeight: 1.75 }}>{children}</div>
        </div>
    );

    const Step = ({ n, children }) => (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontWeight: 800, color: ACCENT, minWidth: '18px' }}>{n}.</span>
            <span>{children}</span>
        </div>
    );

    const Bullet = ({ children }) => (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
            <span style={{ color: ACCENT }}>•</span>
            <span>{children}</span>
        </div>
    );

    return (
        <div ref={ref} data-salesreturnmanual style={{
            background: '#fff',
            color: DARK,
            fontFamily: FONT,
            fontSize: '12px',
            lineHeight: 1.6,
            boxSizing: 'border-box',
            width: `${PAGE_W}mm`,
            margin: '0 auto',
            padding: '14mm 16mm 16mm 16mm',
        }}>
            <div style={{ borderBottom: `3px solid ${ACCENT}`, paddingBottom: '12px', marginBottom: '20px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: LIGHT, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '6px' }}>
                    User Manual
                </div>
                <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: ACCENT, letterSpacing: '0.5px' }}>
                    Sales Return Notes Module
                </h1>
                <div style={{ marginTop: '6px', fontSize: '11px', color: MID }}>
                    {b.businessName || 'Invoice Printer System'} &nbsp;|&nbsp; Version 1.0 &nbsp;|&nbsp; {new Date().toLocaleDateString('en-GB')}
                </div>
            </div>

            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 14px', marginBottom: '20px' }}>
                <strong style={{ color: ACCENT }}>Overview</strong>
                <p style={{ margin: '6px 0 0', color: MID, fontSize: '11.5px', lineHeight: 1.7 }}>
                    The Sales Return Notes module allows authorized staff to process product returns against original
                    <strong> Invoices</strong> or <strong>Delivery Notes</strong>. The system automatically restores stock to inventory,
                    generates a numbered return notice (e.g. {prefix}00001), and allows you to preview, print, or save the notice as a PDF document.
                </p>
            </div>

            <Section num="1" title="Access & Permissions">
                <Bullet>Only <strong>Admin</strong> and <strong>Super Admin (Root)</strong> users can access the Sales Return tab.</Bullet>
                <Bullet>Standard users (User role) do not see this module in the sidebar.</Bullet>
                <Bullet>Navigate to: Sidebar → <strong>Sales Return Notes</strong></Bullet>
            </Section>

            <Section num="2" title="Creating a Sales Return">
                <Step n="1">Open the Sales Return Notes tab and click the <strong>Create</strong> button.</Step>
                <Step n="2">Select the source type: <strong>Invoice</strong> or <strong>Delivery Note</strong>.</Step>
                <Step n="3">Enter the document number and click <strong>Load</strong>.</Step>
                <Step n="4">Customer details and the item list are filled automatically. Tick the items to return and enter the return quantity for each.</Step>
                <Step n="5">Select a <strong>Return Stock Location</strong> — the store or warehouse where returned stock will be restored.</Step>
                <Step n="6">Enter a <strong>Reason</strong> (optional) — an internal note explaining why the return is being processed.</Step>
                <Step n="7">Edit <strong>Return Terms</strong> and <strong>Return Notes</strong> as needed. These appear on the printed notice PDF. Default text is loaded from Business Settings and can be changed per return.</Step>
                <Step n="8">Click <strong>Process Return</strong> to complete. The button shows <em>Processing...</em> while saving and prevents duplicate submissions.</Step>
            </Section>

            <Section num="3" title="Return Validity Period">
                <Bullet>Returns are permitted within <strong>{validityDuration} {validityUnit}</strong> calculated from the original invoice date.</Bullet>
                <Bullet>The validity period can be configured by Admin or Root under <strong>Business Settings → Documents → Sales Return</strong>.</Bullet>
                <Bullet>When the return window is still open, a green banner is displayed showing the expiry date and remaining days.</Bullet>
                <Bullet>When the window has expired, an orange warning is shown. <strong>Admin</strong> users cannot process the return.</Bullet>
                <Bullet>Only <strong>Super Admin (Root)</strong> can enable the <em>Special Requirement override</em> checkbox to process an expired return.</Bullet>
                <Bullet><strong>Cancelled invoices</strong> cannot be loaded or used for returns.</Bullet>
            </Section>

            <Section num="4" title="Stock Restoration">
                <Bullet>When a return is processed, a <strong>new stock batch</strong> is created for each returned product. Stock is not merged into an existing batch.</Bullet>
                <Bullet>Batch reference format: <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px' }}>PRODUCTID-SRN-###</code></Bullet>
                <Bullet>Buy price and warranty period are inherited from the original sale data where available.</Bullet>
                <Bullet>If serial numbers were sold, those serials are restored to inventory with the returned stock.</Bullet>
            </Section>

            <Section num="5" title="Viewing Processed Returns">
                <Bullet>The <strong>Processed Returns</strong> table lists all completed sales return notes.</Bullet>
                <Bullet>Use the search box to filter by return number, source document, or customer name.</Bullet>
                <Bullet><strong>Eye icon</strong> — opens a full preview of the return notice.</Bullet>
                <Bullet><strong>Printer icon</strong> — opens the print dialog to print or save as PDF.</Bullet>
                <Bullet><strong>Refresh</strong> button — reloads the returns list from the server.</Bullet>
            </Section>

            <Section num="6" title="Printing & Saving as PDF">
                <p style={{ margin: '0 0 8px' }}>There are two ways to generate a Sales Return Notice PDF:</p>
                <Step n="A">In the Processed Returns table, click the <strong>Printer icon</strong> on the desired row.</Step>
                <Step n="B">Open the preview modal (Eye icon) and click <strong>A4 Print / PDF</strong>.</Step>
                <p style={{ margin: '10px 0 6px' }}>In the print dialog:</p>
                <Bullet>Set Destination to <strong>Save as PDF</strong> (or Microsoft Print to PDF).</Bullet>
                <Bullet>Set Layout to <strong>Portrait</strong> and Paper size to <strong>A4</strong>.</Bullet>
                <Bullet>Suggested file name format: <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px' }}>{prefix}00001_CustomerName_2026-07-07</code></Bullet>
                <p style={{ margin: '10px 0 0', fontSize: '11px', color: LIGHT }}>
                    The notice includes your business logo, customer details, returned items, return amount, terms, notes, and signature blocks.
                </p>
            </Section>

            <Section num="7" title="Downloading This User Manual as PDF">
                <Step n="1">On the Sales Return Notes screen, click the <strong>User Manual</strong> button in the header.</Step>
                <Step n="2">Review the manual in the preview window.</Step>
                <Step n="3">Click <strong>Download PDF</strong>.</Step>
                <Step n="4">In the print dialog, select <strong>Save as PDF</strong> and save the file.</Step>
            </Section>

            <Section num="8" title="Business Settings (Admin Only)">
                <p style={{ margin: '0 0 6px' }}>Admin or Super Admin → <strong>Business Settings → Documents → Sales Return</strong>:</p>
                <Bullet><strong>Prefix & Digits</strong> — controls the return number format (e.g. {prefix}00001)</Bullet>
                <Bullet><strong>Title & Divider Colors</strong> — sets the colors used on the printed notice</Bullet>
                <Bullet><strong>Validity Duration & Unit</strong> — sets how long after the invoice date returns are allowed</Bullet>
                <Bullet><strong>Default Terms & Notes</strong> — default text auto-filled when creating a new return</Bullet>
            </Section>

            <Section num="9" title="Common Errors & Solutions">
                <div style={{ border: `1px solid ${BORDER}`, borderRadius: '8px', overflow: 'hidden', fontSize: '11px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `1px solid ${BORDER}`, color: DARK }}>Error Message</th>
                                <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `1px solid ${BORDER}`, color: DARK }}>Solution</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                ['Source lookup failed', 'Verify the invoice or delivery note number is correct. The invoice must not be cancelled.'],
                                ['Return window expired', 'Process the return within the allowed validity period, or ask a Super Admin to use the special override.'],
                                ['Select at least one item', 'Tick at least one item and set its return quantity to greater than zero.'],
                                ['Cannot load cancelled invoice', 'Cancelled invoices cannot be returned. Use an active invoice instead.'],
                                ['Processing... does not complete', 'Check your network connection and refresh the page. The system blocks duplicate submissions.'],
                            ].map(([msg, sol], i) => (
                                <tr key={i} style={{ background: i % 2 ? '#fff' : '#fafafa' }}>
                                    <td style={{ padding: '7px 10px', borderBottom: `1px solid ${BORDER}`, fontWeight: 600, color: DARK, verticalAlign: 'top' }}>{msg}</td>
                                    <td style={{ padding: '7px 10px', borderBottom: `1px solid ${BORDER}`, color: MID, verticalAlign: 'top' }}>{sol}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Section>

            <div style={{ marginTop: '24px', paddingTop: '12px', borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: LIGHT }}>
                <span>Sales Return Notes — User Manual</span>
                <span>{b.businessName || 'Invoice Printer'} &copy; {new Date().getFullYear()}</span>
            </div>
        </div>
    );
});

SalesReturnUserManual.displayName = 'SalesReturnUserManual';

export default SalesReturnUserManual;
