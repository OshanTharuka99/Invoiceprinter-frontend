/** Shared user-manual content per module. Displayed one-by-one inside each screen. */

const b = (text) => ({ type: 'bullet', text });
const s = (n, text) => ({ type: 'step', n, text });

export const MODULE_MANUALS = {
    invoice: {
        title: 'Invoice Engine',
        accent: '#0f172a',
        overview: 'Create, edit, cancel, and print customer invoices. Supports automatic (registry) and manual item entry, taxes, discounts, delivery-note / quotation conversion, and status tracking.',
        sections: [
            {
                title: 'Access',
                blocks: [
                    b('Admin portal and User portal both provide Invoice Engine.'),
                    b('Users typically manage invoices they create; Admin/Root can manage all invoices.'),
                ],
            },
            {
                title: 'Create an Invoice',
                blocks: [
                    s(1, 'Click Create / New Invoice.'),
                    s(2, 'Choose Automatic (products from catalog) or Manual client/items as required.'),
                    s(3, 'Select client & project (or enter walk-in details).'),
                    s(4, 'Add line items, quantities, prices, and serial numbers when stock is serial-tracked.'),
                    s(5, 'If the customer already paid an advance, tick the advance checkbox and enter the amount — it is deducted from the balance due on the invoice and printout.'),
                    s(6, 'Apply discounts/taxes, set payment method, then Save.'),
                    s(7, 'Use A4 Print / PDF on the preview to print or save the invoice.'),
                ],
            },
            {
                title: 'Status, Edit & Cancel',
                blocks: [
                    b('Update payment status from the invoice actions (credit invoices).'),
                    b('Edit is limited by business rules (e.g. age / role). Root may have broader edit rights.'),
                    b('Cancel requires a reason and is logged in status history.'),
                    b('Active vs Closed tabs separate live invoices from cancelled ones.'),
                ],
            },
        ],
    },

    proma_invoice: {
        title: 'Proma Invoice',
        accent: '#4f46e5',
        overview: 'Create proforma / estimate-style documents for customers. Supports automatic (catalog) and manual line items with taxes and discounts. Proma invoices are informational only — they do not deduct stock or register warranties.',
        sections: [
            {
                title: 'Access',
                blocks: [
                    b('Available in Admin portal and User portal under Proma Invoice.'),
                    b('All authenticated users can create and view proma invoices.'),
                    b('Manual creation mode is restricted to Admin and Root (same as Invoice Engine).'),
                ],
            },
            {
                title: 'Create a Proma Invoice',
                blocks: [
                    s(1, 'Open Proma Invoice → Automatic or Manual.'),
                    s(2, 'Select a client from the directory or enter manual customer details.'),
                    s(3, 'Optionally link a project — not required.'),
                    s(4, 'Add line items (product picker for automatic, free-text for manual), quantities, and prices.'),
                    s(5, 'No serial numbers are collected — this is an estimate document only.'),
                    s(6, 'Set payment method, discounts/taxes, then Save and print with A4 Print.'),
                ],
            },
            {
                title: 'Stock & Warranty',
                blocks: [
                    b('Creating a proma invoice does NOT reduce product quantity or StockEntry records.'),
                    b('Cancelling a proma invoice does NOT restore stock.'),
                    b('No warranty records are created or updated.'),
                    b('Use Invoice Engine when you need stock deduction and serial/warranty tracking.'),
                ],
            },
            {
                title: 'Status & Cancel',
                blocks: [
                    b('Payment status can be updated (except cash, which is always Paid).'),
                    b('Cancel with a note — status becomes Cancelled; no inventory side effects.'),
                    b('Admin/Root can permanently delete records from the database.'),
                    b('Active and Cancelled tabs filter the list.'),
                ],
            },
        ],
    },

    quotation: {
        title: 'Quotation Engine',
        accent: '#b45309',
        overview: 'Prepare customer quotations with catalog or manual items, then convert approved quotations into invoices or keep them for follow-up.',
        sections: [
            {
                title: 'Create a Quotation',
                blocks: [
                    s(1, 'Open Quotation Engine → Create.'),
                    s(2, 'Select client/project or enter manual customer details.'),
                    s(3, 'Add products, quantities, and prices.'),
                    s(4, 'Set validity / terms, then Save.'),
                    s(5, 'Print the quotation with A4 Print / PDF.'),
                ],
            },
            {
                title: 'Lifecycle',
                blocks: [
                    b('Statuses include Draft, Sent, Approved, Rejected, Cancelled.'),
                    b('Use Update Status / history to track changes with notes.'),
                    b('Approved quotations can be used when creating invoices where the flow supports it.'),
                    b('Cancel/edit follows the same reason + history pattern as other documents.'),
                ],
            },
        ],
    },

    purchase_order: {
        title: 'Purchase Orders',
        accent: '#4338ca',
        overview: 'Order goods from suppliers with line items, taxes/discounts, and printable PO documents.',
        sections: [
            {
                title: 'Create a PO',
                blocks: [
                    s(1, 'Open Purchase Orders → Create.'),
                    s(2, 'Select supplier and enter supplier quotation number / delivery address.'),
                    s(3, 'Add products and quantities/prices.'),
                    s(4, 'Review totals, save, then print with A4 Print / PDF.'),
                ],
            },
            {
                title: 'Status & Control',
                blocks: [
                    b('Statuses: Draft, Sent, Approved, Rejected, Completed, Cancelled.'),
                    b('Admin/Root control approvals and deletions as configured.'),
                    b('Use Active / Closed tabs to find live vs cancelled POs.'),
                ],
            },
        ],
    },

    delivery_note: {
        title: 'Delivery Notes',
        accent: '#0369a1',
        overview: 'Issue delivery notes for goods dispatched to customers, optionally linked to invoices/quotations, with serial assignment when needed.',
        sections: [
            {
                title: 'Create a Delivery Note',
                blocks: [
                    s(1, 'Open Delivery Notes → Create.'),
                    s(2, 'Select client/project and products.'),
                    s(3, 'Assign available serials for serial-tracked items.'),
                    s(4, 'Save and print the delivery note PDF.'),
                ],
            },
            {
                title: 'Tips',
                blocks: [
                    b('Stock serials are loaded per product — pick only available numbers.'),
                    b('Delivery notes may later feed invoices or sales returns.'),
                    b('Cancel/edit uses reason + history when enabled.'),
                ],
            },
        ],
    },

    goods_return: {
        title: 'Goods Return Notes',
        accent: '#7c2d12',
        overview: 'Return goods to suppliers (vendor returns). Restores inventory correctly and prints a return notice.',
        sections: [
            {
                title: 'Process a Goods Return',
                blocks: [
                    s(1, 'Open Goods Return Notes → Create.'),
                    s(2, 'Load the related purchase / source document when prompted.'),
                    s(3, 'Select items and quantities being returned to the supplier.'),
                    s(4, 'Enter reason and process the return.'),
                    s(5, 'Print the Goods Return notice with A4 Print / PDF.'),
                ],
            },
            {
                title: 'Permissions',
                blocks: [
                    b('Usually Admin / Root only.'),
                    b('Stock and serial handling follows the same inventory rules as other stock movements.'),
                ],
            },
        ],
    },

    products: {
        title: 'Product Catalog & Stock',
        accent: '#047857',
        overview: 'Manage categories, products, stock receipts, serial-tracked inventory, supplier credit periods, and automatic purchase expenses. Users may request edits; Admin/Root approve sensitive changes.',
        sections: [
            {
                title: 'Products & Categories',
                blocks: [
                    s(1, 'Create categories with codes used to build product IDs.'),
                    s(2, 'Add products with price, warranty period, and tax settings.'),
                    s(3, 'Open a product → Add Stock to receive inventory.'),
                ],
            },
            {
                title: 'Receive Stock',
                blocks: [
                    s(1, 'Enter location, buying price, quantity, and serial numbers for serial-tracked products.'),
                    s(2, 'Supplier Invoice # is mandatory — it becomes the bill number on the automatic expense.'),
                    s(3, 'Use + New Supplier if the supplier is not in the list; the new supplier is selected automatically.'),
                    s(4, 'Choose Stock Obtained By: Full cash, Credit, or Advance payment.'),
                ],
            },
            {
                title: 'Credit Period & Due Dates',
                blocks: [
                    s(1, 'For Credit or Advance, enter a period such as "30 days", "2 weeks", "2 months", or "1 year" — there is no calendar picker.'),
                    s(2, 'The due date is calculated from the stock date and is shown on the batch card.'),
                    s(3, 'Admins and Root receive an alert 7 days before the due date; overdue entries remain visible.'),
                    b('Advance amount must be greater than zero and less than the total stock value.'),
                    b('Advance entries pay part now and keep the balance on credit with the same period/due date.'),
                ],
            },
            {
                title: 'Automatic Expenses',
                blocks: [
                    b('Full cash creates an expense for the full stock value.'),
                    b('Advance creates an expense for the advance only; the credit balance is settled later from Vendor Intranet → Credit.'),
                    b('Pure credit creates no expense until it is paid from Vendor Intranet → Credit.'),
                    b('Changing the payment mode on a stock entry updates or voids the linked expense automatically.'),
                ],
            },
            {
                title: 'Stock & Approvals',
                blocks: [
                    b('Serial products require unique serial numbers on receipt.'),
                    b('Non-admin users may submit inventory edit requests for approval.'),
                    b('Admin/Root can edit stock entries directly and process approval queues.'),
                    b('Paid-off credit batches no longer appear in credit alerts.'),
                ],
            },
        ],
    },

    clients: {
        title: 'Client Directory',
        accent: '#4f46e5',
        overview: 'Maintain customer records used across quotations, invoices, delivery notes, and projects.',
        sections: [
            {
                title: 'Manage Clients',
                blocks: [
                    s(1, 'Open Clients → Add Client.'),
                    s(2, 'Enter name, organization, contacts, and address.'),
                    s(3, 'Save — the client becomes selectable in sales documents.'),
                ],
            },
            {
                title: 'Edits',
                blocks: [
                    b('Users may request client edits; Admin/Root approve or edit directly.'),
                    b('Search and filters help locate clients quickly in large lists.'),
                ],
            },
        ],
    },

    projects: {
        title: 'Project Portfolio',
        accent: '#0284c7',
        overview: 'Track customer projects/locations linked to warranties, RMA jobs, and invoices.',
        sections: [
            {
                title: 'Create & Use Projects',
                blocks: [
                    s(1, 'Open Projects → Create (Admin/Root) or browse the catalog (User).'),
                    s(2, 'Enter project ID/name and location.'),
                    s(3, 'Select the project when creating invoices, quotations, or warranties.'),
                ],
            },
        ],
    },

    suppliers: {
        title: 'Vendor Intranet (Suppliers)',
        accent: '#0f766e',
        overview: 'Store supplier contacts and bank details, review outstanding supplier credit, settle balances, and generate payment expenses.',
        sections: [
            {
                title: 'Manage Suppliers',
                blocks: [
                    s(1, 'Open Vendor Intranet → Add Supplier.'),
                    s(2, 'Enter name, phone, email, address, and bank details (bank, branch, account name, account number).'),
                    s(3, 'Use the supplier when adding stock or creating purchase orders.'),
                    b('From Add Stock you can also click + New Supplier; the popup saves the supplier and selects it in the stock form.'),
                ],
            },
            {
                title: 'Credit Tab',
                blocks: [
                    b('Open Vendor Intranet → Credit. Only suppliers with outstanding credit are listed.'),
                    b('The row shows the supplier, total outstanding credit, number of credit batches, and the oldest due date.'),
                    s(1, 'Click the scroll icon at the right of a supplier row.'),
                    s(2, 'Details open directly under that row.'),
                    s(3, 'Review the credited products, amounts, credit periods, due dates, and the supplier bank information.'),
                ],
            },
            {
                title: 'Pay Supplier Credit',
                blocks: [
                    s(1, 'In the expanded supplier row, enter the Amount to pay — it cannot exceed the supplier total credit.'),
                    s(2, 'Choose Payment Method: Cash, Cheque, or Bank Transfer.'),
                    s(3, 'For Cheque, enter the Cheque Number.'),
                    s(4, 'Add an Additional Note if required.'),
                    s(5, 'Click Pay.'),
                    b('Payment is applied to the oldest due credit batches first and the supplier outstanding credit is reduced immediately.'),
                    b('An Expense is auto-generated for the payment, with the note and the supplier invoice number(s) as the bill number.'),
                    b('If the supplier has no bank details, the expanded panel shows "Bank details not set".'),
                ],
            },
        ],
    },

    warranty: {
        title: 'Warranty Management',
        accent: '#be123c',
        overview: 'Track product warranties by serial number, invoice, client, and project. Status can be active or expired.',
        sections: [
            {
                title: 'Working with Warranties',
                blocks: [
                    b('Warranties are often created automatically from invoiced serial devices.'),
                    b('Search by serial, invoice, or client.'),
                    b('Admin/Root can update status or serial corrections when needed.'),
                    b('RMA lookup uses this warranty registry to decide under-warranty service.'),
                ],
            },
        ],
    },

    users: {
        title: 'User Management',
        accent: '#1e293b',
        overview: 'Admin/Root manage staff accounts, roles (user / admin / root), and access to modules.',
        sections: [
            {
                title: 'Accounts & Roles',
                blocks: [
                    s(1, 'Open User Management → Add User.'),
                    s(2, 'Set name, email, username, password, and role.'),
                    s(3, 'Use role rules: Admin cannot promote to Root; Root is the highest level.'),
                    b('Disable or delete users carefully — Active sessions may need re-login.'),
                ],
            },
        ],
    },

    business: {
        title: 'General Settings (Business)',
        accent: '#334155',
        overview: 'Configure company profile, document prefixes, print colors, tax defaults, and module terms used on PDFs.',
        sections: [
            {
                title: 'What to Configure',
                blocks: [
                    b('Business name, address, phone, email, logos.'),
                    b('Invoice / Quotation / PO / DN / Return / RMA prefixes and digit lengths.'),
                    b('Default terms and notes for printable documents.'),
                    b('Title and divider colors for each document type.'),
                    b('Only Admin/Root can save business settings.'),
                ],
            },
        ],
    },

    approvals: {
        title: 'Security Approvals',
        accent: '#b45309',
        overview: 'Review pending requests such as inventory edits or document delete/edit approvals before they affect live data.',
        sections: [
            {
                title: 'How to Approve',
                blocks: [
                    s(1, 'Open Security Approvals from the Admin sidebar.'),
                    s(2, 'Inspect each request details and reason.'),
                    s(3, 'Approve or Reject — the requester is notified.'),
                    b('Process queues regularly so staff workflows are not blocked.'),
                ],
            },
        ],
    },

    dashboard: {
        title: 'Dashboard',
        accent: '#0f172a',
        overview: 'The dashboard shows live counts and financial summaries without loading every full document list.',
        sections: [
            {
                title: 'Reading the Dashboard',
                blocks: [
                    b('Admin dashboard supports Daily / Monthly / Yearly invoice periods.'),
                    b('User dashboard shows your invoices, quotations, POs, and RMA mix.'),
                    b('RMA status charts reflect Open through Cancelled jobs.'),
                    b('Use module menus for day-to-day create/edit work — dashboard is for overview.'),
                ],
            },
        ],
    },

    settings: {
        title: 'Account Settings',
        accent: '#475569',
        overview: 'Update your profile details and password for the signed-in account.',
        sections: [
            {
                title: 'Profile',
                blocks: [
                    s(1, 'Open Settings.'),
                    s(2, 'Update name/contact fields allowed for your role.'),
                    s(3, 'Change password when required and save.'),
                    b('If login fails after a password change, sign in again with the new password.'),
                ],
            },
        ],
    },

    sales_return: {
        title: 'Sales Return Notes',
        accent: '#b91c1c',
        overview: 'Process customer product returns against invoices or delivery notes, restore stock, and print return notices as PDF.',
        sections: [
            {
                title: 'Access & Permissions',
                blocks: [
                    b('Admin and Root can access Sales Return Notes.'),
                    b('Navigate via sidebar → Sales Return Notes.'),
                ],
            },
            {
                title: 'Create a Sales Return',
                blocks: [
                    s(1, 'Click Create.'),
                    s(2, 'Choose source: Invoice or Delivery Note.'),
                    s(3, 'Enter the document number and click Load.'),
                    s(4, 'Tick items to return and set quantities.'),
                    s(5, 'Select Return Stock Location.'),
                    s(6, 'Add reason / terms / notes as needed.'),
                    s(7, 'Click Process Return, then A4 Print / PDF.'),
                ],
            },
            {
                title: 'Validity Window',
                blocks: [
                    b('Returns must fall within the configured days/months from the original invoice date (Business Settings).'),
                    b('Expired windows block Admin unless Root enables a special override where allowed.'),
                    b('Use Active / Closed tabs and history for cancelled returns.'),
                ],
            },
        ],
    },

    rma: {
        title: 'RMA Process',
        accent: '#c2410c',
        overview: 'End-to-end faulty device service: serial lookup, warranty check, assign staff, status updates, device replacement, and printable RMA Report (Job Number).',
        sections: [
            {
                title: 'Create a Job',
                blocks: [
                    s(1, 'Click New RMA.'),
                    s(2, 'Enter serial → Check Warranty.'),
                    s(3, 'Confirm customer, project, and supplier autofill (edit if needed). Destination is optional.'),
                    s(4, 'Assign one or more organization users.'),
                    s(5, 'Enter Device Faulty Comment → Create RMA.'),
                    b('Job Number is generated automatically (prefix from Business Settings). Assignees are notified.'),
                ],
            },
            {
                title: 'Update Status',
                blocks: [
                    s(1, 'Open the job → Update Status.'),
                    s(2, 'Choose status and enter a comment.'),
                    s(3, 'Enter Fault diagnosis (required to Resolve or Close).'),
                    s(4, 'Optionally open Replace Device from this panel.'),
                    s(5, 'Click Update Status once (no separate Post / Save Diagnosis buttons).'),
                ],
            },
            {
                title: 'Replace Device & Print',
                blocks: [
                    b('Replace from shop stock or supplier serial. Set warranty period or N/A.'),
                    b('Old serial moves to Faulty Stock (Admin/Root).'),
                    b('Customer Sign needs name + ID; destination is optional.'),
                    b('A4 Print / PDF prints the RMA Report (no supplier block on the report).'),
                    b('Jobs open ≥ 1 month notify assignees and Root.'),
                ],
            },
        ],
    },

    cash_receipt: {
        title: 'Cash Receipts',
        accent: '#0f172a',
        overview: 'Record money collected from customers as cash, bank transfer, or cheque, and print a professional one-page A4 cash receipt. Link the receipt to a project, quotation, and invoice for full traceability.',
        sections: [
            {
                title: 'Access',
                blocks: [
                    b('Available in the Admin portal under Cash Receipts.'),
                    b('Admin and Root can create, view, and void cash receipts.'),
                ],
            },
            {
                title: 'Create a Cash Receipt',
                blocks: [
                    s(1, 'Open Cash Receipts → Create Receipt.'),
                    s(2, 'Choose Select Client (uses the client directory) or Manual Entry for a walk-in customer.'),
                    s(3, 'Select the Project, Quotation No (optional), and Invoice No (optional). Use N/A when not linked.'),
                    s(4, 'Enter the Amount Received. The amount in words is generated automatically.'),
                    s(5, 'Select the Payment Method: Cash, Bank, or Cheque.'),
                    s(6, 'If Cheque is selected, enter the Cheque No (shown on the receipt).'),
                    s(7, 'Add a Purpose of Payment note describing what the money is for.'),
                    s(8, 'Save, then use A4 Print / PDF to print or save the receipt.'),
                ],
            },
            {
                title: 'Linking Documents',
                blocks: [
                    b('Project, Quotation, and Invoice lists are filtered by the selected client — pick the right one for the payment.'),
                    b('Quotation and invoice numbers print in their own sections on the receipt.'),
                    b('Receipt numbers are generated automatically from the prefix / digits configured in General Settings → Document Format.'),
                ],
            },
            {
                title: 'Void a Receipt',
                blocks: [
                    s(1, 'Open the receipt from the list.'),
                    s(2, 'Choose Void from the receipt actions.'),
                    s(3, 'Enter a Void Note (reason).'),
                    s(4, 'Save — the receipt shows a VOID watermark and keeps the note on printouts.'),
                    b('Voided receipts stay visible on the list for audit and cannot be silently deleted.'),
                ],
            },
            {
                title: 'Document Format',
                blocks: [
                    b('Customize title/divider colors, logo, terminology, and number prefix/digits in General Settings → Document Format → Cash Receipt Settings.'),
                    b('If no separate cash receipt logo is uploaded, the organization logo is used.'),
                ],
            },
        ],
    },

    expenses: {
        title: 'Expenses',
        accent: '#dc2626',
        overview: 'Record outgoing payments by purpose and category, print expense vouchers with a mandatory bill number, generate reports, and review automatically created stock/supplier payments. Admin and Root only.',
        sections: [
            {
                title: 'Access',
                blocks: [
                    b('Admin and Root only — Expenses is not available in the User portal.'),
                    b('Open it from the Admin sidebar → Expenses.'),
                ],
            },
            {
                title: 'Manage categories in Business Settings',
                blocks: [
                    s(1, 'Open General Settings → Business Settings.'),
                    s(2, 'Add or rename the expense categories used when recording payments.'),
                    s(3, 'Return to Expenses — the updated categories appear in the picker.'),
                ],
            },
            {
                title: 'Record an expense',
                blocks: [
                    s(1, 'Click Create / New Expense.'),
                    s(2, 'Select the purpose: Project, Office, or Asset purchase.'),
                    s(3, 'For Project expenses, select the related project — a project expense must be linked to a project.'),
                    s(4, 'Enter Paid To and the mandatory Bill Number (bill / invoice reference).'),
                    s(5, 'Choose a category and enter the amount and date.'),
                    s(6, 'Select the payment method: Cash, Cheque, or Bank Transfer; enter the cheque number for cheque payments.'),
                    s(7, 'Save the expense.'),
                ],
            },
            {
                title: 'Print expense voucher',
                blocks: [
                    b('Open a saved expense and use A4 Print / PDF to print or save the voucher.'),
                    b('The voucher always shows the Bill No, along with purpose, category, linked project (when applicable), amount, and payment method.'),
                    b('The expense report also includes a Bill No column.'),
                ],
            },
            {
                title: 'Automatic payment expenses',
                blocks: [
                    b('Full-cash stock receipts create an expense for the full amount; advance receipts create one for the advance.'),
                    b('Supplier credit payments made in Vendor Intranet → Credit also create an expense with the payment note.'),
                    b('For stock-related expenses the bill number comes from the mandatory supplier invoice number.'),
                ],
            },
            {
                title: 'Generate Base/Project/Daily–Yearly reports',
                blocks: [
                    b('Use the report scope (Base or Project) and period filters (Daily / Monthly / Yearly).'),
                    s(1, 'Open the report view from Expenses.'),
                    s(2, 'Choose Base (all expenses) or Project (project-linked expenses only).'),
                    s(3, 'Pick Daily, Monthly, or Yearly and preview, print, or export the report.'),
                ],
            },
            {
                title: 'Read expense cards on Dashboard',
                blocks: [
                    b('The Admin dashboard KPI strip shows Total Expenses and Net Cash Flow (Revenue − Expenses).'),
                    b('Expense Analytics summarizes spending by purpose, payment method (outflow), and top categories for the selected period.'),
                    b('Expense figures are outgoing payments, separate from the Cash Receipts board.'),
                ],
            },
            {
                title: 'Edit window & void',
                blocks: [
                    b('Expenses can be edited only within the allowed edit window; older records become read-only.'),
                    b('Void an expense with a reason rather than deleting it — voided records stay visible for audit.'),
                ],
            },
        ],
    },
};

export function getModuleManual(id) {
    return MODULE_MANUALS[id] || null;
}
