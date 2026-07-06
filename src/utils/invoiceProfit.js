/**
 * Gross profit = (subTotal − discounts) − sum(unitCost × quantity)
 * Selling price comes from line unitPrice; buy price from stock unitCost snapshot.
 */
export const computeInvoiceProfit = (invoice) => {
    const items = invoice?.items || [];
    const totalCost = items.reduce(
        (sum, item) => sum + (Number(item.unitCost) || 0) * (Number(item.quantity) || 0),
        0
    );
    const revenue = (Number(invoice?.subTotal) || 0) - (Number(invoice?.discountTotal) || 0);
    const profit = revenue - totalCost;
    const margin = revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0;
    return { totalCost, revenue, profit, margin };
};

export const sumInvoicesProfit = (invoices, { statusFilter } = {}) => {
    const filtered = statusFilter
        ? invoices.filter((inv) => inv.status === statusFilter)
        : invoices.filter((inv) => inv.status !== 'Cancelled');

    return filtered.reduce(
        (acc, inv) => {
            const { totalCost, revenue, profit } = computeInvoiceProfit(inv);
            return {
                totalCost: acc.totalCost + totalCost,
                totalRevenue: acc.totalRevenue + revenue,
                totalProfit: acc.totalProfit + profit,
            };
        },
        { totalCost: 0, totalRevenue: 0, totalProfit: 0 }
    );
};
