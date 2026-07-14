/**
 * Open a print window using the same A4 stylesheet as Invoice Engine.
 * @param {HTMLElement | null} contentEl - element whose innerHTML is printed
 * @param {string} fileName - document title / suggested PDF name
 */
export function openA4PrintWindow(contentEl, fileName = 'Document') {
    if (!contentEl) return;
    const safeTitle = String(fileName || 'Document').replace(/[<>:"/\\|?*]/g, '_');
    const windowPrint = window.open('', '', 'left=0,top=0,width=900,height=1100,toolbar=0,scrollbars=1,status=0');
    if (!windowPrint) return;

    windowPrint.document.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>${safeTitle}</title>
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
                    @media print {
                        @page { size: A4 portrait; margin: 14mm 15mm 14mm 15mm; }
                        body { margin: 0 !important; padding: 0 !important; }
                        div { padding: 0 !important; }
                        * { box-shadow: none !important; }
                        tr { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>${contentEl.innerHTML}</body>
        </html>
    `);
    windowPrint.document.close();
    windowPrint.focus();
    setTimeout(() => {
        windowPrint.print();
        windowPrint.close();
    }, 400);
}

export function buildPrintFileName(docNumber, partyName, dateValue) {
    const id = docNumber || 'DOC';
    const client = String(partyName || 'Client')
        .replace(/[^a-zA-Z0-9_\-]/g, '_')
        .replace(/_+/g, '_');
    const dateStr = new Date(dateValue || Date.now()).toISOString().slice(0, 10);
    return `${id}_${client}_${dateStr}`;
}
