import React, { useState, useRef, useEffect } from 'react';
import './PriceInput.css';

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

const DECIMAL_PATTERN = /^\d*\.?\d{0,2}$/;

const PriceInput = ({
    value,
    onChange,
    disabled,
    style,
    placeholder,
    required,
    className,
    debounceMs = 500,
}) => {
    const [displayText, setDisplayText] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const ref = useRef(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        if (!isFocused) {
            setDisplayText(formatNumberWithCommas(value));
        }
    }, [value, isFocused]);

    useEffect(() => () => clearTimeout(debounceRef.current), []);

    const notifyChange = (raw) => {
        if (raw === '' || raw === '.') {
            onChange(0);
            return;
        }
        const parsed = parseFloat(raw);
        if (!isNaN(parsed)) onChange(parsed);
    };

    const handleChange = (e) => {
        const raw = e.target.value.replace(/,/g, '');
        if (raw !== '' && !DECIMAL_PATTERN.test(raw)) return;

        setDisplayText(raw);

        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => notifyChange(raw), debounceMs);
    };

    const handleFocus = () => {
        setIsFocused(true);
        const num = Number(value);
        const raw = !value && value !== 0 ? '' : (num === 0 ? '' : String(value).replace(/,/g, ''));
        setDisplayText(raw);

        requestAnimationFrame(() => {
            const el = ref.current;
            if (!el) return;
            const pos = el.value.length;
            el.setSelectionRange(pos, pos);
        });
    };

    const handleBlur = () => {
        setIsFocused(false);
        clearTimeout(debounceRef.current);

        const raw = displayText.replace(/,/g, '');
        notifyChange(raw);

        const parsed = parseNumberFromCommas(raw);
        setDisplayText(formatNumberWithCommas(parsed));
    };

    return (
        <input
            ref={ref}
            type="text"
            inputMode="decimal"
            className={`price-input ${className || ''}`.trim()}
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
