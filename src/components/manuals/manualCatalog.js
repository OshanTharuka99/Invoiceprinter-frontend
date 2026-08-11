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
        overview: 'Manage categories, products, stock entries, and serial-tracked inventory. Users may request edits; Admin/Root approve sensitive changes.',
        sections: [
            {
                title: 'Products & Categories',
                blocks: [
                    s(1, 'Create categories with codes used to build product IDs.'),
                    s(2, 'Add products with price, warranty period, and tax settings.'),
                    s(3, 'Open a product → Add Stock to receive inventory (location, buying price, serials).'),
                ],
            },
            {
                title: 'Stock & Approvals',
                blocks: [
                    b('Serial products require unique serial numbers on receipt.'),
                    b('Non-admin users may submit inventory edit requests for approval.'),
                    b('Admin/Root can edit stock entries directly and process approval queues.'),
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
        overview: 'Store supplier contacts used in purchase orders, stock receipts, and RMA supplier flows.',
        sections: [
            {
                title: 'Manage Suppliers',
                blocks: [
                    s(1, 'Open Vendor Intranet → Add Supplier.'),
                    s(2, 'Enter name, phone, email, and address.'),
                    s(3, 'Use the supplier when adding stock or creating purchase orders.'),
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
};

export function getModuleManual(id) {
    return MODULE_MANUALS[id] || null;
}
