const SYMBOL_STYLE = ['$', '€', '£', '₹', 'د.إ'];

// Currency identifier: show the symbol (e.g. "$") when the configured symbol is a
// symbol character, otherwise show the code (e.g. "LKR", "EUR").
export const currencyLabel = (cur, fallback = 'LKR') => {
    const symbol = cur?.symbol;
    if (SYMBOL_STYLE.includes(symbol)) return symbol;
    return cur?.code || symbol || fallback;
};

export const formatNumber = (n) =>
    (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtAmount = (n, cur, fallback = 'LKR') =>
    `${currencyLabel(cur, fallback)} ${formatNumber(n)}`;