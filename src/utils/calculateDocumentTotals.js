const isVatTax = (tax) => (tax.name || '').trim().toUpperCase() === 'VAT';

const isSsclTax = (tax) => (tax.name || '').trim().toUpperCase().includes('SSCL');

const calcTaxAmount = (tax, base) =>
    tax.type === 'percentage' ? (base * Number(tax.value)) / 100 : Number(tax.value);

/**
 * SSCL is calculated on the taxable base (subtotal − discounts).
 * VAT is calculated on taxable base + SSCL amount (compound).
 * Other non-VAT taxes remain on the taxable base only.
 */
export const calculateDocumentTotals = (currentForm) => {
    const subTotal = currentForm.subTotal || 0;
    const discountTotal = (currentForm.appliedDiscounts || []).reduce(
        (sum, d) => sum + (d.amount || 0),
        0
    );
    const taxableBase = subTotal - discountTotal;

    if (!currentForm.hasTax || !currentForm.appliedTaxes?.length) {
        return {
            ...currentForm,
            discountTotal,
            appliedTaxes: currentForm.appliedTaxes || [],
            taxTotal: 0,
            finalTotal: taxableBase,
        };
    }

    const amounts = new Map();
    let ssclAmount = 0;

    for (const tax of currentForm.appliedTaxes) {
        if (isVatTax(tax)) continue;
        const amount = calcTaxAmount(tax, taxableBase);
        amounts.set(tax, amount);
        if (isSsclTax(tax)) ssclAmount += amount;
    }

    const vatBase = taxableBase + ssclAmount;

    for (const tax of currentForm.appliedTaxes) {
        if (!isVatTax(tax)) continue;
        amounts.set(tax, calcTaxAmount(tax, vatBase));
    }

    const updatedTaxes = currentForm.appliedTaxes.map((tax) => ({
        ...tax,
        amount: amounts.get(tax) ?? 0,
    }));
    const taxTotal = updatedTaxes.reduce((sum, t) => sum + (t.amount || 0), 0);
    const finalTotal = taxableBase + taxTotal;

    return { ...currentForm, discountTotal, appliedTaxes: updatedTaxes, taxTotal, finalTotal };
};
