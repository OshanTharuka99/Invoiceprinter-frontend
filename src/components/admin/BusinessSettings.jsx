import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Phone, MapPin, Coins, Receipt, Tag, Save,
    Edit3, CheckCircle, PlusCircle, MinusCircle, AlertCircle,
    Check, RefreshCw, Hash, Mail, Globe, Landmark, DollarSign, ChevronDown, Settings2, Shield, Award, Type, Minus, FileText
} from 'lucide-react';
import api from '../../api';
import './BusinessSettings.css';

const BusinessSettings = ({ currentUser, showToast }) => {
    const [activeSubTab, setActiveSubTab] = useState('business');
    const [businessData, setBusinessData] = useState({
        businessName: '', businessType: 'Owner', registrationNumber: '',
        address: '', phoneNumber: '', email: '', fax: '',
        country: 'Sri Lanka', city: '',
        primaryCurrency: { code: 'LKR', symbol: 'Rs.' },
        secondaryCurrency: { code: 'USD', symbol: '$' },
        isVatRegistered: false, vatNumber: '', vatPercentage: 18,
        otherTaxes: [],
        discountProfiles: [
            { name: 'Summer Sale', type: 'percentage', value: 10, minBillAmount: 10000 },
            { name: 'Test Profile', type: 'fixed', value: 500, minBillAmount: 0 }
        ],
        quotationPrefix: 'QN', quotationDigits: 5,
        quotationTitleColor: '#0f172a', quotationDividerColor: '#0f172a',
        invoicePrefix: 'INV', invoiceDigits: 5,
        invoiceTitleColor: '#0f172a', invoiceDividerColor: '#0f172a',
        purchaseOrderPrefix: 'PO', purchaseOrderDigits: 5,
        purchaseOrderTitleColor: '#0284c7', purchaseOrderDividerColor: '#0284c7',
        pageSizePreset: 'A4', pageWidth: 210, pageHeight: 297, iconColor: '#3b82f6',
        quotationTerms: 'Standard terms and conditions apply.', quotationNotes: '',
        invoiceTerms: 'Standard invoice terms and conditions apply.', invoiceNotes: '',
        purchaseOrderTerms: 'Standard purchase order terms and conditions apply.', purchaseOrderNotes: '',
        stores: []
    });

    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const fetchDetails = async () => {
        try {
            const res = await api.get('/business');
            if (res.data.data.details) {
                const details = res.data.data.details;
                setBusinessData({
                    ...details,
                    invoiceTerms: details.invoiceTerms || 'Standard invoice terms and conditions apply.',
                    invoiceNotes: details.invoiceNotes || '',
                    purchaseOrderTerms: details.purchaseOrderTerms || 'Standard purchase order terms and conditions apply.',
                    purchaseOrderNotes: details.purchaseOrderNotes || '',
                    stores: details.stores || []
                });
            }
        } catch (err) { showToast('Sync failed', 'error'); }
    };

    useEffect(() => { fetchDetails(); }, []);

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (currentUser.role !== 'root' && currentUser.role !== 'admin') return showToast('Operation Denied: Admin clearance required', 'error');
        setIsSaving(true);
        try {
            await api.patch('/business', businessData);
            showToast('Global configurations stored');
            setIsEditMode(false);
        } catch (err) { showToast('Storage failure', 'error'); }
        finally { setIsSaving(false); }
    };

    const handleCurrencyChange = (type, code) => {
        const sel = [
            { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs.' },
            { code: 'USD', name: 'US Dollar', symbol: '$' },
            { code: 'EUR', name: 'Euro', symbol: '€' },
            { code: 'GBP', name: 'British Pound', symbol: '£' },
            { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
            { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' }
        ].find(c => c.code === code);
        if (sel) setBusinessData({ ...businessData, [type]: { code: sel.code, symbol: sel.symbol } });
    };

    const inputClass = isEditMode ? 'bs-input bs-input--edit' : 'bs-input bs-input--view';
    const isRoot = currentUser.role === 'root' || currentUser.role === 'admin';

    const ColorPicker = ({ label, value, onChange, disabled, icon: Icon }) => (
        <div className="bs-color-group">
            <label className="bs-label">{label}</label>
            <div className={`bs-color-picker ${disabled ? 'bs-color-picker--disabled' : ''}`}>
                <div className="bs-color-swatch" style={{ background: value }}>
                    {Icon && <Icon size={14} color={value === '#ffffff' ? '#94a3b8' : '#fff'} />}
                </div>
                <span className="bs-color-hex">{value}</span>
                {!disabled && (
                    <input
                        type="color"
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        className="bs-color-input-hidden"
                    />
                )}
            </div>
        </div>
    );

    const ColorPreview = ({ titleColor, dividerColor, title, borderColor }) => (
        <div className="bs-color-preview" style={{ borderColor: borderColor || '#e2e8f0' }}>
            <div className="bs-color-preview-title" style={{ color: titleColor }}>
                {title}
            </div>
            <div className="bs-color-preview-divider" style={{ background: dividerColor }} />
            <div className="bs-color-preview-body">
                <div className="bs-color-preview-line" style={{ background: '#f1f5f9' }} />
                <div className="bs-color-preview-line short" style={{ background: '#f1f5f9' }} />
            </div>
        </div>
    );

    return (
        <div className="bs-root">

            <div className="bs-subtab-bar">
                <button onClick={() => { setActiveSubTab('business'); setIsEditMode(false); }} className={`bs-subtab-btn${activeSubTab === 'business' ? ' bs-subtab-btn--active' : ''}`}>Business Settings</button>
                <button onClick={() => { setActiveSubTab('quotation'); setIsEditMode(false); }} className={`bs-subtab-btn${activeSubTab === 'quotation' ? ' bs-subtab-btn--active' : ''}`}>Document Format Settings</button>
            </div>

            <AnimatePresence mode="wait">
                {activeSubTab === 'business' ? (
                    <motion.div key="business" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>

                        {/* HEADER */}
                        <div className="bs-header">
                            <div className="bs-header-accent">
                                <p className="bs-header-desc">
                                    Manage your organization's core identity, official communication channels, and fiscal parameters.
                                </p>
                            </div>
                            {isRoot && (
                                <button onClick={isEditMode ? handleSave : () => setIsEditMode(true)} disabled={isSaving} className={`bs-header-btn${isEditMode ? ' bs-header-btn--save' : ' bs-header-btn--edit'}`}>
                                    {isSaving ? <RefreshCw className="animate-spin" size={18} /> : (isEditMode ? <CheckCircle size={18} /> : <Edit3 size={18} />)}
                                    {isEditMode ? 'SAVE CONFIGURATION' : 'EDIT BUSINESS DETAILS'}
                                </button>
                            )}
                        </div>

                        {/* 1. Logo */}
                        <div className="bs-card">
                            <div>
                                <div className="bs-card-header"><div className="bs-card-icon" style={{ background: '#6366f115', color: '#000' }}><Award size={24} /></div> <h3 className="bs-card-title">Organization Logo</h3></div>
                                <div className="bs-logo-row">
                                    <div className="bs-logo-box">
                                        {businessData.quotationLogo ? (
                                            <img src={businessData.quotationLogo} alt="Quotation Logo" />
                                        ) : (
                                            <div className="bs-logo-empty">
                                                <PlusCircle size={32} />
                                                <span className="bs-logo-empty-text">Empty</span>
                                            </div>
                                        )}
                                        {isEditMode && (
                                            <input type="file" accept="image/*" onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => setBusinessData({ ...businessData, quotationLogo: reader.result });
                                                    reader.readAsDataURL(file);
                                                }
                                            }} className="bs-logo-input" title="Upload new logo" />
                                        )}
                                    </div>
                                    <div className="bs-logo-info">
                                        <p>Upload a high-quality logo. This logo will be cleanly embedded into all dynamically generated PDF quotations. Click the area on the left to select an image.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. IDENTITY */}
                        <div className="bs-card">
                            <div className="bs-card-header"><div className="bs-card-icon" style={{ background: '#6366f115', color: '#6366f1' }}><Building2 size={24} /></div> <h3 className="bs-card-title">Organization Identity</h3></div>
                            <div className="bs-form-row-3">
                                <div className="bs-form-group"><label className="bs-label">Business Name</label><input value={businessData.businessName} onChange={e => setBusinessData({ ...businessData, businessName: e.target.value })} disabled={!isEditMode} className={inputClass} /></div>
                                <div className="bs-form-group"><label className="bs-label">Business Type</label><select value={businessData.businessType} onChange={e => setBusinessData({ ...businessData, businessType: e.target.value })} disabled={!isEditMode} className={inputClass}>{["Owner", "Partnership", "Private Limited", "Public Limited", "NGO"].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                <div className="bs-form-group"><label className="bs-label">Registry Key</label><input value={businessData.registrationNumber} onChange={e => setBusinessData({ ...businessData, registrationNumber: e.target.value })} disabled={!isEditMode} className={inputClass} /></div>
                            </div>
                        </div>

                        {/* 3. COMMUNICATION */}
                        <div className="bs-card">
                            <div className="bs-card-header"><div className="bs-card-icon" style={{ background: '#3b82f615', color: '#3b82f6' }}><Phone size={24} /></div> <h3 className="bs-card-title">Communication Hub</h3></div>
                            <div className="bs-form-row-3">
                                <div className="bs-form-group"><label className="bs-label">Official Email</label><input value={businessData.email} onChange={e => setBusinessData({ ...businessData, email: e.target.value })} disabled={!isEditMode} className={inputClass} /></div>
                                <div className="bs-form-group"><label className="bs-label">Contact Hotline</label><input value={businessData.phoneNumber} onChange={e => setBusinessData({ ...businessData, phoneNumber: e.target.value })} disabled={!isEditMode} className={inputClass} /></div>
                                <div className="bs-form-group"><label className="bs-label">Fax Number</label><input value={businessData.fax} onChange={e => setBusinessData({ ...businessData, fax: e.target.value })} disabled={!isEditMode} className={inputClass} /></div>
                            </div>
                        </div>

                        {/* 4. LOCATION */}
                        <div className="bs-card">
                            <div className="bs-card-header"><div className="bs-card-icon" style={{ background: '#10b98115', color: '#10b981' }}><MapPin size={24} /></div> <h3 className="bs-card-title">Operational Location</h3></div>
                            <div className="bs-form-row-mixed">
                                <div className="bs-form-row-span3"><label className="bs-label">Full Physical Address</label><textarea value={businessData.address} onChange={e => setBusinessData({ ...businessData, address: e.target.value })} disabled={!isEditMode} className={`${inputClass} bs-textarea-lg`} /></div>
                                <div><label className="bs-label">City</label><input value={businessData.city} onChange={e => setBusinessData({ ...businessData, city: e.target.value })} disabled={!isEditMode} className={inputClass} /></div>
                                <div className="bs-form-row-span2"><label className="bs-label">Country Protocol</label><select value={businessData.country} onChange={e => setBusinessData({ ...businessData, country: e.target.value })} disabled={!isEditMode} className={inputClass}>{["Sri Lanka", "United States", "United Kingdom", "India", "UAE"].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                            </div>
                        </div>

                        {/* 5. BANK DETAILS */}
                        <div className="bs-card">
                            <div className="bs-card-header"><div className="bs-card-icon" style={{ background: '#3b82f615', color: '#7D1501' }}><Landmark size={24} /></div> <h3 className="bs-card-title">Bank Details</h3></div>
                            <div className="bs-form-row-3">
                                <div className="bs-form-group"><label className="bs-label">Bank Account Number</label><input value={businessData.bankAccountNumber} onChange={e => setBusinessData({ ...businessData, bankAccountNumber: e.target.value })} disabled={!isEditMode} className={inputClass} /></div>
                                <div className="bs-form-group"><label className="bs-label">Bank Account Name</label><input value={businessData.bankAccountName} onChange={e => setBusinessData({ ...businessData, bankAccountName: e.target.value })} disabled={!isEditMode} className={inputClass} /></div>
                                <div className="bs-form-group"><label className="bs-label">Bank Name</label><input value={businessData.bankName} onChange={e => setBusinessData({ ...businessData, bankName: e.target.value })} disabled={!isEditMode} className={inputClass} /></div>
                                <div className="bs-form-group"><label className="bs-label">Branch Name</label><input value={businessData.branchName} onChange={e => setBusinessData({ ...businessData, branchName: e.target.value })} disabled={!isEditMode} className={inputClass} /></div>
                            </div>
                        </div>

                        {/* 6. FISCAL CURRENCY */}
                        <div className="bs-card">
                            <div className="bs-card-header"><div className="bs-card-icon" style={{ background: '#f59e0b15', color: '#f59e0b' }}><Coins size={24} /></div> <h3 className="bs-card-title">Currency Settings</h3></div>
                            <div className="bs-form-row-2">
                                <div className="bs-form-group"><label className="bs-label">Primary Currency</label><select value={businessData.primaryCurrency?.code} onChange={e => handleCurrencyChange('primaryCurrency', e.target.value)} disabled={!isEditMode} className={inputClass}>{["LKR", "USD", "EUR", "GBP", "INR", "AED"].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                <div className="bs-form-group"><label className="bs-label">Secondary Currency</label><select value={businessData.secondaryCurrency?.code} onChange={e => handleCurrencyChange('secondaryCurrency', e.target.value)} disabled={!isEditMode} className={inputClass}>{["LKR", "USD", "EUR", "GBP", "INR", "AED"].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                            </div>
                        </div>

                        {/* 7. FISCAL TAXES */}
                        <div className="bs-card">
                            <div className="bs-card-header"><div className="bs-card-icon" style={{ background: '#ef444415', color: '#ef4444' }}><Receipt size={24} /></div> <h3 className="bs-card-title">Fiscal Taxes</h3></div>

                            <div className={`bs-vat-card${businessData.isVatRegistered ? ' bs-vat-card--active' : ' bs-vat-card--inactive'}`}>
                                <div className="bs-vat-header">
                                    <div>
                                        <div className="bs-vat-title">VAT REGISTRATION</div>
                                        <p className="bs-vat-status">{businessData.isVatRegistered ? 'Corporate VAT protocols active' : 'VAT protocols inactive'}</p>
                                    </div>
                                    <button onClick={() => isEditMode && setBusinessData({ ...businessData, isVatRegistered: !businessData.isVatRegistered })} disabled={!isEditMode} className={`bs-vat-toggle${businessData.isVatRegistered ? ' bs-vat-toggle--on' : ' bs-vat-toggle--off'}${isEditMode ? ' bs-vat-toggle--editable' : ''}`}>
                                        <div className={`bs-vat-toggle-knob${businessData.isVatRegistered ? ' bs-vat-toggle-knob--on' : ' bs-vat-toggle-knob--off'}`} />
                                    </button>
                                </div>
                                {businessData.isVatRegistered && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bs-vat-fields">
                                        <div><label className="bs-label bs-label-light">VAT Number</label><input value={businessData.vatNumber} onChange={e => setBusinessData({ ...businessData, vatNumber: e.target.value })} disabled={!isEditMode} className={`bs-input bs-input--dark ${isEditMode ? '' : 'bs-input--view'}`} /></div>
                                        <div><label className="bs-label bs-label-light">VAT Rate (%)</label><input type="number" value={businessData.vatPercentage} onChange={e => setBusinessData({ ...businessData, vatPercentage: e.target.value })} disabled={!isEditMode} className={`bs-input bs-input--dark ${isEditMode ? '' : 'bs-input--view'}`} /></div>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* 8. SUPPLEMENTARY TAXES */}
                        <div className="bs-card">
                            <div className="bs-dynamic-header">
                                <div className="bs-card-header"><div className="bs-card-icon" style={{ background: '#ef444415', color: '#ef4444' }}><Receipt size={24} /></div> <h3 className="bs-card-title">Supplementary Taxes</h3></div>
                                {isEditMode && <button onClick={() => setBusinessData({ ...businessData, otherTaxes: [...businessData.otherTaxes, { name: '', type: 'percentage', value: 0 }] })} className="bs-add-btn">+ Add Tax</button>}
                            </div>
                            {businessData.otherTaxes.map((tax, i) => (
                                <div key={i} className="bs-dynamic-row bs-dynamic-row--tax">
                                    <div><label className="bs-label">Tax Entity</label><input value={tax.name} onChange={e => { const up = [...businessData.otherTaxes]; up[i].name = e.target.value; setBusinessData({ ...businessData, otherTaxes: up }) }} disabled={!isEditMode} className={inputClass} /></div>
                                    <div><label className="bs-label">Unit</label><select value={tax.type} onChange={e => { const up = [...businessData.otherTaxes]; up[i].type = e.target.value; setBusinessData({ ...businessData, otherTaxes: up }) }} disabled={!isEditMode} className={inputClass}><option value="percentage">%</option><option value="fixed">Fixed</option></select></div>
                                    <div><label className="bs-label">Rate/Amt</label><input type="number" value={tax.value} onChange={e => { const up = [...businessData.otherTaxes]; up[i].value = e.target.value; setBusinessData({ ...businessData, otherTaxes: up }) }} disabled={!isEditMode} className={inputClass} /></div>
                                    {isEditMode && <button onClick={() => { const up = businessData.otherTaxes.filter((_, idx) => idx !== i); setBusinessData({ ...businessData, otherTaxes: up }) }} className="bs-remove-btn"><MinusCircle size={22} /></button>}
                                </div>
                            ))}
                        </div>

                        {/* 9. PROMOTIONAL YIELDS */}
                        <div className="bs-card">
                            <div className="bs-dynamic-header">
                                <div className="bs-card-header"><div className="bs-card-icon" style={{ background: '#10b98115', color: '#10b981' }}><Tag size={24} /></div> <h3 className="bs-card-title">Promotional Yields</h3></div>
                                {isEditMode && <button onClick={() => setBusinessData({ ...businessData, discountProfiles: [...businessData.discountProfiles, { name: '', type: 'percentage', value: 0, minBillAmount: 0 }] })} className="bs-add-btn">+ Add Profile</button>}
                            </div>
                            {businessData.discountProfiles.map((disc, i) => (
                                <div key={i} className="bs-dynamic-row bs-dynamic-row--discount">
                                    <div><label className="bs-label">Profile Name</label><input value={disc.name} onChange={e => { const up = [...businessData.discountProfiles]; up[i].name = e.target.value; setBusinessData({ ...businessData, discountProfiles: up }) }} disabled={!isEditMode} className={inputClass} /></div>
                                    <div><label className="bs-label">Rule Type</label><select value={disc.type} onChange={e => { const up = [...businessData.discountProfiles]; up[i].type = e.target.value; setBusinessData({ ...businessData, discountProfiles: up }) }} disabled={!isEditMode} className={inputClass}><option value="percentage">%</option><option value="fixed">Fixed</option></select></div>
                                    <div><label className="bs-label">Value</label><input type="number" value={disc.value} onChange={e => { const up = [...businessData.discountProfiles]; up[i].value = e.target.value; setBusinessData({ ...businessData, discountProfiles: up }) }} disabled={!isEditMode} className={inputClass} /></div>
                                    <div><label className="bs-label">Threshold</label><input type="number" value={disc.minBillAmount} onChange={e => { const up = [...businessData.discountProfiles]; up[i].minBillAmount = e.target.value; setBusinessData({ ...businessData, discountProfiles: up }) }} disabled={!isEditMode} className={inputClass} /></div>
                                    {isEditMode && <button onClick={() => { const up = businessData.discountProfiles.filter((_, idx) => idx !== i); setBusinessData({ ...businessData, discountProfiles: up }) }} className="bs-remove-btn"><MinusCircle size={22} /></button>}
                                </div>
                            ))}
                        </div>

                        {/* 10. STORE LOCATIONS */}
                        <div className="bs-card">
                            <div className="bs-dynamic-header">
                                <div className="bs-card-header">
                                    <div className="bs-card-icon" style={{ background: '#f59e0b15', color: '#f59e0b' }}><Building2 size={24} /></div>
                                    <h3 className="bs-card-title">Store Locations</h3>
                                </div>
                                {isEditMode && (
                                    <button onClick={() => setBusinessData({ ...businessData, stores: [...(businessData.stores || []), { name: '', address: '', phoneNumber: '' }] })} className="bs-add-btn">+ Add Store</button>
                                )}
                            </div>
                            {(!businessData.stores || businessData.stores.length === 0) ? (
                                <div className="bs-empty-state">
                                    No store locations added. Deliveries will default to the main business address.
                                </div>
                            ) : (
                                <div className="bs-stores-list">
                                    {businessData.stores.map((store, i) => (
                                        <div key={i} className="bs-store-card">
                                            <div className="bs-store-card-left">
                                                <div className="bs-store-avatar"><MapPin size={18} /></div>
                                                <div className="bs-store-fields">
                                                    <input value={store.name} onChange={e => { const up = [...businessData.stores]; up[i].name = e.target.value; setBusinessData({ ...businessData, stores: up }) }} disabled={!isEditMode} className={inputClass} placeholder="Store name" />
                                                    <input value={store.address} onChange={e => { const up = [...businessData.stores]; up[i].address = e.target.value; setBusinessData({ ...businessData, stores: up }) }} disabled={!isEditMode} className={inputClass} placeholder="Address" />
                                                    <input value={store.phoneNumber} onChange={e => { const up = [...businessData.stores]; up[i].phoneNumber = e.target.value; setBusinessData({ ...businessData, stores: up }) }} disabled={!isEditMode} className={inputClass} placeholder="Phone" />
                                                </div>
                                            </div>
                                            {isEditMode && (
                                                <button onClick={() => { const up = businessData.stores.filter((_, idx) => idx !== i); setBusinessData({ ...businessData, stores: up }) }} className="bs-remove-btn"><MinusCircle size={22} /></button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : activeSubTab === 'quotation' ? (
                    <motion.div key="quotation" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>

                        <div className="bs-header">
                            <div className="bs-header-accent">
                                <p className="bs-header-desc">
                                    Configure document number formats (prefix & digit length) and color themes for each document type.
                                </p>
                            </div>
                            {isRoot && (
                                <button onClick={isEditMode ? handleSave : () => setIsEditMode(true)} disabled={isSaving} className={`bs-header-btn${isEditMode ? ' bs-header-btn--save' : ' bs-header-btn--edit'}`}>
                                    {isSaving ? <RefreshCw className="animate-spin" size={18} /> : (isEditMode ? <CheckCircle size={18} /> : <Edit3 size={18} />)}
                                    {isEditMode ? 'SAVE ALL FORMATS' : 'EDIT FORMATS'}
                                </button>
                            )}
                        </div>

                        {/* Quotation Settings */}
                        <div className="bs-card">
                            <div className="bs-card-header">
                                <div className="bs-card-icon" style={{ background: '#0ea5e915', color: '#0ea5e9' }}><Receipt size={24} /></div>
                                <h3 className="bs-card-title">Quotation Settings</h3>
                                <ColorPreview titleColor={businessData.quotationTitleColor} dividerColor={businessData.quotationDividerColor} title="QUOTATION" />
                            </div>
                            <div className="bs-doc-format-grid">
                                <div className="bs-doc-left">
                                    <div className="bs-form-row-2">
                                        <div className="bs-form-group"><label className="bs-label">Prefix</label><input value={businessData.quotationPrefix} onChange={e => setBusinessData({ ...businessData, quotationPrefix: e.target.value })} disabled={!isEditMode} className={inputClass} placeholder="e.g. QN" /></div>
                                        <div className="bs-form-group"><label className="bs-label">Digits</label><input type="number" min="2" max="10" value={businessData.quotationDigits} onChange={e => setBusinessData({ ...businessData, quotationDigits: parseInt(e.target.value) || 5 })} disabled={!isEditMode} className={inputClass} placeholder="5" /></div>
                                    </div>
                                    <div className="bs-form-row-2" style={{ marginTop: '1rem' }}>
                                        <ColorPicker label="Title Color" value={businessData.quotationTitleColor} onChange={v => setBusinessData({ ...businessData, quotationTitleColor: v })} disabled={!isEditMode} icon={Type} />
                                        <ColorPicker label="Divider Color" value={businessData.quotationDividerColor} onChange={v => setBusinessData({ ...businessData, quotationDividerColor: v })} disabled={!isEditMode} icon={Minus} />
                                    </div>
                                </div>
                                <div className="bs-doc-right">
                                    <div className="bs-doc-form">
                                        <div><label className="bs-label">Quotation Terms & Conditions</label><textarea value={businessData.quotationTerms} onChange={e => setBusinessData({ ...businessData, quotationTerms: e.target.value })} disabled={!isEditMode} className={`${inputClass} bs-textarea-lg`} placeholder="Enter standard terms..." /></div>
                                        <div><label className="bs-label">Default Quotation Notes</label><textarea value={businessData.quotationNotes} onChange={e => setBusinessData({ ...businessData, quotationNotes: e.target.value })} disabled={!isEditMode} className={`${inputClass} bs-textarea`} placeholder="Enter default notes..." /></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Purchase Order Settings */}
                        <div className="bs-card">
                            <div className="bs-card-header">
                                <div className="bs-card-icon" style={{ background: '#0ea5e915', color: '#e9af0eff' }}><Receipt size={24} /></div>
                                <h3 className="bs-card-title">Purchase Order Settings</h3>
                                <ColorPreview titleColor={businessData.purchaseOrderTitleColor} dividerColor={businessData.purchaseOrderDividerColor} title="PURCHASE ORDER" />
                            </div>
                            <div className="bs-doc-format-grid">
                                <div className="bs-doc-left">
                                    <div className="bs-form-row-2">
                                        <div className="bs-form-group"><label className="bs-label">Prefix</label><input value={businessData.purchaseOrderPrefix} onChange={e => setBusinessData({ ...businessData, purchaseOrderPrefix: e.target.value })} disabled={!isEditMode} className={inputClass} placeholder="e.g. PO" /></div>
                                        <div className="bs-form-group"><label className="bs-label">Digits</label><input type="number" min="2" max="10" value={businessData.purchaseOrderDigits} onChange={e => setBusinessData({ ...businessData, purchaseOrderDigits: parseInt(e.target.value) || 5 })} disabled={!isEditMode} className={inputClass} placeholder="5" /></div>
                                    </div>
                                    <div className="bs-form-row-2" style={{ marginTop: '1rem' }}>
                                        <ColorPicker label="Title Color" value={businessData.purchaseOrderTitleColor} onChange={v => setBusinessData({ ...businessData, purchaseOrderTitleColor: v })} disabled={!isEditMode} icon={Type} />
                                        <ColorPicker label="Divider Color" value={businessData.purchaseOrderDividerColor} onChange={v => setBusinessData({ ...businessData, purchaseOrderDividerColor: v })} disabled={!isEditMode} icon={Minus} />
                                    </div>
                                </div>
                                <div className="bs-doc-right">
                                    <div className="bs-doc-form">
                                        <div><label className="bs-label">Purchase Order Terms & Conditions</label><textarea value={businessData.purchaseOrderTerms} onChange={e => setBusinessData({ ...businessData, purchaseOrderTerms: e.target.value })} disabled={!isEditMode} className={`${inputClass} bs-textarea-lg`} placeholder="Enter standard terms..." /></div>
                                        <div><label className="bs-label">Default Purchase Order Notes</label><textarea value={businessData.purchaseOrderNotes} onChange={e => setBusinessData({ ...businessData, purchaseOrderNotes: e.target.value })} disabled={!isEditMode} className={`${inputClass} bs-textarea`} placeholder="Enter default notes..." /></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Invoice Settings */}
                        <div className="bs-card">
                            <div className="bs-card-header">
                                <div className="bs-card-icon" style={{ background: '#0ea5e915', color: '#e92f0e' }}><Receipt size={24} /></div>
                                <h3 className="bs-card-title">Invoice Settings</h3>
                                <ColorPreview titleColor={businessData.invoiceTitleColor} dividerColor={businessData.invoiceDividerColor} title="INVOICE" />
                            </div>
                            <div className="bs-doc-format-grid">
                                <div className="bs-doc-left">
                                    <div className="bs-form-row-2">
                                        <div className="bs-form-group"><label className="bs-label">Prefix</label><input value={businessData.invoicePrefix} onChange={e => setBusinessData({ ...businessData, invoicePrefix: e.target.value })} disabled={!isEditMode} className={inputClass} placeholder="e.g. INV" /></div>
                                        <div className="bs-form-group"><label className="bs-label">Digits</label><input type="number" min="2" max="10" value={businessData.invoiceDigits} onChange={e => setBusinessData({ ...businessData, invoiceDigits: parseInt(e.target.value) || 5 })} disabled={!isEditMode} className={inputClass} placeholder="5" /></div>
                                    </div>
                                    <div className="bs-form-row-2" style={{ marginTop: '1rem' }}>
                                        <ColorPicker label="Title Color" value={businessData.invoiceTitleColor} onChange={v => setBusinessData({ ...businessData, invoiceTitleColor: v })} disabled={!isEditMode} icon={Type} />
                                        <ColorPicker label="Divider Color" value={businessData.invoiceDividerColor} onChange={v => setBusinessData({ ...businessData, invoiceDividerColor: v })} disabled={!isEditMode} icon={Minus} />
                                    </div>
                                </div>
                                <div className="bs-doc-right">
                                    <div className="bs-doc-form">
                                        <div><label className="bs-label">Invoice Terms & Conditions</label><textarea value={businessData.invoiceTerms} onChange={e => setBusinessData({ ...businessData, invoiceTerms: e.target.value })} disabled={!isEditMode} className={`${inputClass} bs-textarea-lg`} placeholder="Enter standard terms..." /></div>
                                        <div><label className="bs-label">Default Invoice Notes</label><textarea value={businessData.invoiceNotes} onChange={e => setBusinessData({ ...businessData, invoiceNotes: e.target.value })} disabled={!isEditMode} className={`${inputClass} bs-textarea`} placeholder="Enter default notes..." /></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Page Size Settings */}
                        <div className="bs-card">
                            <div className="bs-card-header">
                                <div className="bs-card-icon" style={{ background: '#8b5cf615', color: '#8b5cf6' }}><FileText size={24} /></div>
                                <h3 className="bs-card-title">Print Page Size</h3>
                            </div>
                            <div className="bs-form-row-3">
                                <div className="bs-form-group">
                                    <label className="bs-label">Paper Size</label>
                                    <select value={businessData.pageSizePreset} onChange={e => {
                                        const sizes = { A4: [210, 297], A3: [297, 420], A5: [148, 210], Letter: [216, 279], Legal: [216, 356] };
                                        const dims = sizes[e.target.value];
                                        setBusinessData({ ...businessData, pageSizePreset: e.target.value, pageWidth: dims?.[0] || 210, pageHeight: dims?.[1] || 297 });
                                    }} disabled={!isEditMode} className={inputClass}>
                                        <option value="A4">A4 (210 × 297 mm)</option>
                                        <option value="A3">A3 (297 × 420 mm)</option>
                                        <option value="A5">A5 (148 × 210 mm)</option>
                                        <option value="Letter">Letter (216 × 279 mm)</option>
                                        <option value="Legal">Legal (216 × 356 mm)</option>
                                        <option value="Custom">Custom</option>
                                    </select>
                                </div>
                                <div className="bs-form-group">
                                    <label className="bs-label">Width (mm)</label>
                                    <input type="number" min="50" max="1000" value={businessData.pageWidth} onChange={e => { setBusinessData({ ...businessData, pageWidth: parseInt(e.target.value) || 210, pageSizePreset: 'Custom' })}} disabled={!isEditMode || businessData.pageSizePreset !== 'Custom'} className={inputClass} />
                                </div>
                                <div className="bs-form-group">
                                    <label className="bs-label">Height (mm)</label>
                                    <input type="number" min="50" max="1000" value={businessData.pageHeight} onChange={e => { setBusinessData({ ...businessData, pageHeight: parseInt(e.target.value) || 297, pageSizePreset: 'Custom' })}} disabled={!isEditMode || businessData.pageSizePreset !== 'Custom'} className={inputClass} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

        </div>
    );
};

export default BusinessSettings;
