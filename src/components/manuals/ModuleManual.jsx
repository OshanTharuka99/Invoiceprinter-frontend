import React, { useEffect, useState } from 'react';
import api from '../../api';
import ModuleManualViewer, { ManualButton } from './ModuleManualViewer';
import { getModuleManual } from './manualCatalog';

/**
 * Drop-in User Manual for any management screen.
 * Shows the guide for this module only (one-by-one), with A4 Print / PDF.
 */
export default function ModuleManual({ moduleId, business: businessProp, buttonClassName }) {
    const [open, setOpen] = useState(false);
    const [business, setBusiness] = useState(businessProp || null);
    const manual = getModuleManual(moduleId);

    useEffect(() => {
        if (businessProp) setBusiness(businessProp);
    }, [businessProp]);

    useEffect(() => {
        if (!open || business || businessProp) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await api.get('/business');
                if (!cancelled) setBusiness(res.data?.data?.details || null);
            } catch {
                /* header still works without business */
            }
        })();
        return () => { cancelled = true; };
    }, [open, business, businessProp]);

    if (!manual) return null;

    return (
        <>
            <ManualButton className={buttonClassName} onClick={() => setOpen(true)} />
            <ModuleManualViewer
                open={open}
                onClose={() => setOpen(false)}
                title={manual.title}
                accent={manual.accent}
                overview={manual.overview}
                sections={manual.sections}
                business={business}
                fileName={`User_Manual_${moduleId}`}
            />
        </>
    );
}

export { ManualButton, ModuleManualViewer, getModuleManual };
