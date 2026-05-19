import React, { useState, useRef, useEffect } from 'react';

export const formatNumberWithCommas = (value) => {
    if (value === '' || value === null || value === undefined) return '';
    const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const parseNumberFromCommas = (str) => {
    if (!str || str === '') return 0;
    const cleaned = str.replace(/,/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
};

const PriceInput = ({ value, onChange, disabled, style, placeholder, required, className }) => {
    const [displayText, setDisplayText] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!isFocused) {
            setDisplayText(formatNumberWithCommas(value));
        }
    }, [value, isFocused]);

    const handleChange = (e) => {
        const raw = e.target.value.replace(/,/g, '');
        if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
            setDisplayText(raw);
            const parsed = raw === '' ? 0 : parseFloat(raw);
            if (!isNaN(parsed)) onChange(parsed);
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
        const raw = value !== null && value !== undefined && value !== '' ? value.toString() : '';
        setDisplayText(raw);
        setTimeout(() => ref.current?.select(), 0);
    };

    const handleBlur = () => {
        setIsFocused(false);
        setDisplayText(formatNumberWithCommas(value));
    };

    return (
        <input
            ref={ref}
            type="text"
            inputMode="decimal"
            className={className}
            value={displayText}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            style={style}
            placeholder={placeholder || '0.00'}
            required={required}
            autoComplete="off"
        />
    );
};

export default PriceInput;
