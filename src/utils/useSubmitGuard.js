import { useCallback, useRef, useState } from 'react';

/**
 * Prevents duplicate form submissions while an async action is in progress.
 */
export default function useSubmitGuard() {
    const submittingRef = useRef(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const runGuarded = useCallback(async (task) => {
        if (submittingRef.current) return false;
        submittingRef.current = true;
        setIsSubmitting(true);
        try {
            await task();
            return true;
        } finally {
            submittingRef.current = false;
            setIsSubmitting(false);
        }
    }, []);

    return { isSubmitting, runGuarded, submittingRef };
}
