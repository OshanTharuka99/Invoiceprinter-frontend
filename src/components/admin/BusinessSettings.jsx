import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Phone, MapPin, Coins, Receipt, Tag, Save,
    Edit3, CheckCircle, PlusCircle, MinusCircle, AlertCircle,
    Check, RefreshCw, Hash, Mail, Globe, Landmark, DollarSign,
    ChevronDown, Settings2, Shield, Award, Type, Minus, Store, X
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

    const handleCancel = () => {
        setIsEditMode(false);
        fetchDetails();
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

    const inpCls = isEditMode ? 'bs2-inp bs2-inp--edit' : 'bs2-inp bs2-inp--view';
    const isRoot = currentUser.role === 'root' || currentUser.role === 'admin';

    const EditBtn = () => isEditMode ? null : (
        <button onClick={() => setIsEditMode(true)} className="bs2-card-edit" title="Edit section">
            <Edit3 size={16} />
        </button>
    );

    const SaveCancelBtns = () => isEditMode ? (
        <div className="bs2-card-actions">
            <button onClick={handleCancel} className="bs2-action-btn bs2-action-btn--cancel" title="Cancel">
                <X size={16} />
            </button>
            <button onClick={handleSave} disabled={isSaving} className="bs2-action-btn bs2-action-btn--save" title="Save changes">
                {isSaving ? <RefreshCw className="spin" size={16} /> : <Check size={16} />}
            </button>
        </div>
    ) : null;

    const ColorPicker = ({ label, value, onChange, disabled, icon: Icon }) => (
        <div>
            <label>{label}</label>
            <div className={`bs2-cp ${disabled ? 'bs2-cp--disabled' : ''}`}>
                <div className="bs2-cp-swatch" style={{ background: value }} />
                <span className="bs2-cp-hex">{value}</span>
                {!disabled && (
                    <input type="color" value={value} onChange={e => onChange(e.target.value)} className="bs2-cp-input" />
                )}
            </div>
        </div>
    );

    const ColorPreview = ({ titleColor, dividerColor, title }) => (
        <div className="bs2-cprev">
            <div className="bs2-cprev-title" style={{ color: titleColor }}>{title}</div>
            <div className="bs2-cprev-divider" style={{ background: dividerColor }} />
            <div className="bs2-cprev-body">
                <div className="bs2-cprev-line" />
                <div className="bs2-cprev-line short" />
            </div>
        </div>
    );

    return (
        <div className="bs2">

            <div className="bs2-tabs">
                <button onClick={() => setActiveSubTab('business')} className={`bs2-tab${activeSubTab === 'business' ? ' active' : ''}`}>
                    <Building2 size={16} />Business Settings
                </button>
                <button onClick={() => setActiveSubTab('quotation')} className={`bs2-tab${activeSubTab === 'quotation' ? ' active' : ''}`}>
                    <Receipt size={16} />Document Format
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeSubTab === 'business' ? (
                    <motion.div key="business" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                        <div className="bs2-cards">

                            {/* Logo */}
                            <div className="bs2-card">
                                <div className="bs2-card-head">
                                    <div className="bs2-card-head-left">
                                        <span className="bs2-icon" style={{ background: '#6366f115', color: '#6366f1' }}><Award size={20} /></span>
                                        <h3>Organization Logo</h3>
                                    </div>
                                    {isRoot && <><EditBtn /><SaveCancelBtns /></>}
                                </div>
                                <div className="bs2-card-body">
                                    <div className="bs2-logo-row">
                                        <div className="bs2-logo-box">
                                            {businessData.quotationLogo ? (
                                                <img src={businessData.quotationLogo} alt="Logo" />
                                            ) : (
                                                <div className="bs2-logo-empty">
                                                    <PlusCircle size={32} />
                                                    <span>Empty</span>
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
                                                }} className="bs2-logo-input" title="Upload new logo" />
                                            )}
                                        </div>
                                        <p className="bs2-logo-hint">
                                            Upload a high-quality logo. This logo will be cleanly embedded into all dynamically generated PDF quotations.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Identity */}
                            <div className="bs2-card">
                                <div className="bs2-card-head">
                                    <div className="bs2-card-head-left">
                                        <span className="bs2-icon" style={{ background: '#6366f115', color: '#6366f1' }}><Building2 size={20} /></span>
                                        <h3>Organization Identity</h3>
                                    </div>
                                    {isRoot && <><EditBtn /><SaveCancelBtns /></>}
                                </div>
                                <div className="bs2-card-body">
                                    <div className="bs2-grid bs2-grid-3">
                                        <div><label>Business Name</label><input value={businessData.businessName} onChange={e => setBusinessData({ ...businessData, businessName: e.target.value })} disabled={!isEditMode} className={inpCls} /></div>
                                        <div><label>Business Type</label><select value={businessData.businessType} onChange={e => setBusinessData({ ...businessData, businessType: e.target.value })} disabled={!isEditMode} className={inpCls}>{["Owner", "Partnership", "Private Limited", "Public Limited", "NGO"].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                        <div><label>Registry Key</label><input value={businessData.registrationNumber} onChange={e => setBusinessData({ ...businessData, registrationNumber: e.target.value })} disabled={!isEditMode} className={inpCls} /></div>
                                    </div>
                                </div>
                            </div>

                            {/* Communication */}
                            <div className="bs2-card">
                                <div className="bs2-card-head">
                                    <div className="bs2-card-head-left">
                                        <span className="bs2-icon" style={{ background: '#3b82f615', color: '#3b82f6' }}><Phone size={20} /></span>
                                        <h3>Communication Hub</h3>
                                    </div>
                                    {isRoot && <><EditBtn /><SaveCancelBtns /></>}
                                </div>
                                <div className="bs2-card-body">
                                    <div className="bs2-grid bs2-grid-3">
                                        <div><label>Official Email</label><input value={businessData.email} onChange={e => setBusinessData({ ...businessData, email: e.target.value })} disabled={!isEditMode} className={inpCls} /></div>
                                        <div><label>Contact Hotline</label><input value={businessData.phoneNumber} onChange={e => setBusinessData({ ...businessData, phoneNumber: e.target.value })} disabled={!isEditMode} className={inpCls} /></div>
                                        <div><label>Fax Number</label><input value={businessData.fax} onChange={e => setBusinessData({ ...businessData, fax: e.target.value })} disabled={!isEditMode} className={inpCls} /></div>
                                    </div>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="bs2-card">
                                <div className="bs2-card-head">
                                    <div className="bs2-card-head-left">
                                        <span className="bs2-icon" style={{ background: '#10b98115', color: '#10b981' }}><MapPin size={20} /></span>
                                        <h3>Operational Location</h3>
                                    </div>
                                    {isRoot && <><EditBtn /><SaveCancelBtns /></>}
                                </div>
                                <div className="bs2-card-body">
                                    <div className="bs2-grid bs2-grid-loc">
                                        <div className="bs2-span-3"><label>Full Physical Address</label><textarea value={businessData.address} onChange={e => setBusinessData({ ...businessData, address: e.target.value })} disabled={!isEditMode} className={`${inpCls} bs2-ta`} /></div>
                                        <div><label>City</label><input value={businessData.city} onChange={e => setBusinessData({ ...businessData, city: e.target.value })} disabled={!isEditMode} className={inpCls} /></div>
                                        <div className="bs2-span-2"><label>Country Protocol</label><select value={businessData.country} onChange={e => setBusinessData({ ...businessData, country: e.target.value })} disabled={!isEditMode} className={inpCls}>{["Sri Lanka", "United States", "United Kingdom", "India", "UAE"].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                    </div>
                                </div>
                            </div>

                            {/* Bank Details */}
                            <div className="bs2-card">
                                <div className="bs2-card-head">
                                    <div className="bs2-card-head-left">
                                        <span className="bs2-icon" style={{ background: '#3b82f615', color: '#7D1501' }}><Landmark size={20} /></span>
                                        <h3>Bank Details</h3>
                                    </div>
                                    {isRoot && <><EditBtn /><SaveCancelBtns /></>}
                                </div>
                                <div className="bs2-card-body">
                                    <div className="bs2-grid bs2-grid-4">
                                        <div><label>Bank Account Number</label><input value={businessData.bankAccountNumber} onChange={e => setBusinessData({ ...businessData, bankAccountNumber: e.target.value })} disabled={!isEditMode} className={inpCls} /></div>
                                        <div><label>Bank Account Name</label><input value={businessData.bankAccountName} onChange={e => setBusinessData({ ...businessData, bankAccountName: e.target.value })} disabled={!isEditMode} className={inpCls} /></div>
                                        <div><label>Bank Name</label><input value={businessData.bankName} onChange={e => setBusinessData({ ...businessData, bankName: e.target.value })} disabled={!isEditMode} className={inpCls} /></div>
                                        <div><label>Branch Name</label><input value={businessData.branchName} onChange={e => setBusinessData({ ...businessData, branchName: e.target.value })} disabled={!isEditMode} className={inpCls} /></div>
                                    </div>
                                </div>
                            </div>

                            {/* Currency */}
                            <div className="bs2-card">
                                <div className="bs2-card-head">
                                    <div className="bs2-card-head-left">
                                        <span className="bs2-icon" style={{ background: '#f59e0b15', color: '#f59e0b' }}><Coins size={20} /></span>
                                        <h3>Currency Settings</h3>
                                    </div>
                                    {isRoot && <><EditBtn /><SaveCancelBtns /></>}
                                </div>
                                <div className="bs2-card-body">
                                    <div className="bs2-grid bs2-grid-2">
                                        <div><label>Primary Currency</label><select value={businessData.primaryCurrency?.code} onChange={e => handleCurrencyChange('primaryCurrency', e.target.value)} disabled={!isEditMode} className={inpCls}>{["LKR", "USD", "EUR", "GBP", "INR", "AED"].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                        <div><label>Secondary Currency</label><select value={businessData.secondaryCurrency?.code} onChange={e => handleCurrencyChange('secondaryCurrency', e.target.value)} disabled={!isEditMode} className={inpCls}>{["LKR", "USD", "EUR", "GBP", "INR", "AED"].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                    </div>
                                </div>
                            </div>

                            {/* VAT */}
                            <div className="bs2-card">
                                <div className="bs2-card-head">
                                    <div className="bs2-card-head-left">
                                        <span className="bs2-icon" style={{ background: '#ef444415', color: '#ef4444' }}><Receipt size={20} /></span>
                                        <h3>Fiscal Taxes</h3>
                                    </div>
                                    {isRoot && <><EditBtn /><SaveCancelBtns /></>}
                                </div>
                                <div className="bs2-card-body">
                                    <div className="bs2-vat-toggle-row">
                                        <div>
                                            <div className="bs2-vat-title">VAT REGISTRATION</div>
                                            <p className="bs2-vat-status">{businessData.isVatRegistered ? 'Corporate VAT protocols active' : 'VAT protocols inactive'}</p>
                                        </div>
                                        <button onClick={() => isEditMode && setBusinessData({ ...businessData, isVatRegistered: !businessData.isVatRegistered })} disabled={!isEditMode} className={`bs2-toggle${businessData.isVatRegistered ? ' bs2-toggle--on' : ''}`}>
                                            <div className={`bs2-toggle-knob${businessData.isVatRegistered ? ' bs2-toggle-knob--on' : ''}`} />
                                        </button>
                                    </div>
                                    {businessData.isVatRegistered && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bs2-vat-fields">
                                            <div className="bs2-grid bs2-grid-2">
                                                <div><label>VAT Number</label><input value={businessData.vatNumber} onChange={e => setBusinessData({ ...businessData, vatNumber: e.target.value })} disabled={!isEditMode} className={inpCls} /></div>
                                                <div><label>VAT Rate (%)</label><input type="number" value={businessData.vatPercentage} onChange={e => setBusinessData({ ...businessData, vatPercentage: e.target.value })} disabled={!isEditMode} className={inpCls} /></div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Supplementary Taxes */}
                            <div className="bs2-card">
                                <div className="bs2-card-head">
                                    <div className="bs2-card-head-left">
                                        <span className="bs2-icon" style={{ background: '#ef444415', color: '#ef4444' }}><Receipt size={20} /></span>
                                        <h3>Supplementary Taxes</h3>
                                    </div>
                                    <div className="bs2-card-head-right">
                                        {isEditMode && <button onClick={() => setBusinessData({ ...businessData, otherTaxes: [...businessData.otherTaxes, { name: '', type: 'percentage', value: 0 }] })} className="bs2-add-btn">+ Add Tax</button>}
                                        {isRoot && <><EditBtn /><SaveCancelBtns /></>}
                                    </div>
                                </div>
                                <div className="bs2-card-body">
                                    <div className="bs2-dynamic-list">
                                        {businessData.otherTaxes.length === 0 ? (
                                            <div className="bs2-empty">No supplementary taxes configured</div>
                                        ) : businessData.otherTaxes.map((tax, i) => (
                                            <div key={i} className="bs2-dynamic-row">
                                                <div><label>Tax Entity</label><input value={tax.name} onChange={e => { const up = [...businessData.otherTaxes]; up[i].name = e.target.value; setBusinessData({ ...businessData, otherTaxes: up }) }} disabled={!isEditMode} className={inpCls} /></div>
                                                <div><label>Unit</label><select value={tax.type} onChange={e => { const up = [...businessData.otherTaxes]; up[i].type = e.target.value; setBusinessData({ ...businessData, otherTaxes: up }) }} disabled={!isEditMode} className={inpCls}><option value="percentage">%</option><option value="fixed">Fixed</option></select></div>
                                                <div><label>Rate / Amt</label><input type="number" value={tax.value} onChange={e => { const up = [...businessData.otherTaxes]; up[i].value = e.target.value; setBusinessData({ ...businessData, otherTaxes: up }) }} disabled={!isEditMode} className={inpCls} /></div>
                                                {isEditMode && <button onClick={() => { const up = businessData.otherTaxes.filter((_, idx) => idx !== i); setBusinessData({ ...businessData, otherTaxes: up }) }} className="bs2-remove"><MinusCircle size={22} /></button>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Discounts */}
                            <div className="bs2-card">
                                <div className="bs2-card-head">
                                    <div className="bs2-card-head-left">
                                        <span className="bs2-icon" style={{ background: '#10b98115', color: '#10b981' }}><Tag size={20} /></span>
                                        <h3>Promotional Yields</h3>
                                    </div>
                                    <div className="bs2-card-head-right">
                                        {isEditMode && <button onClick={() => setBusinessData({ ...businessData, discountProfiles: [...businessData.discountProfiles, { name: '', type: 'percentage', value: 0, minBillAmount: 0 }] })} className="bs2-add-btn">+ Add Profile</button>}
                                        {isRoot && <><EditBtn /><SaveCancelBtns /></>}
                                    </div>
                                </div>
                                <div className="bs2-card-body">
                                    <div className="bs2-dynamic-list">
                                        {businessData.discountProfiles.length === 0 ? (
                                            <div className="bs2-empty">No discount profiles configured</div>
                                        ) : businessData.discountProfiles.map((disc, i) => (
                                            <div key={i} className="bs2-dynamic-row bs2-dynamic-row--4">
                                                <div><label>Profile Name</label><input value={disc.name} onChange={e => { const up = [...businessData.discountProfiles]; up[i].name = e.target.value; setBusinessData({ ...businessData, discountProfiles: up }) }} disabled={!isEditMode} className={inpCls} /></div>
                                                <div><label>Rule Type</label><select value={disc.type} onChange={e => { const up = [...businessData.discountProfiles]; up[i].type = e.target.value; setBusinessData({ ...businessData, discountProfiles: up }) }} disabled={!isEditMode} className={inpCls}><option value="percentage">%</option><option value="fixed">Fixed</option></select></div>
                                                <div><label>Value</label><input type="number" value={disc.value} onChange={e => { const up = [...businessData.discountProfiles]; up[i].value = e.target.value; setBusinessData({ ...businessData, discountProfiles: up }) }} disabled={!isEditMode} className={inpCls} /></div>
                                                <div><label>Threshold</label><input type="number" value={disc.minBillAmount} onChange={e => { const up = [...businessData.discountProfiles]; up[i].minBillAmount = e.target.value; setBusinessData({ ...businessData, discountProfiles: up }) }} disabled={!isEditMode} className={inpCls} /></div>
                                                {isEditMode && <button onClick={() => { const up = businessData.discountProfiles.filter((_, idx) => idx !== i); setBusinessData({ ...businessData, discountProfiles: up }) }} className="bs2-remove"><MinusCircle size={22} /></button>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Stores - moved into business tab */}
                            <div className="bs2-card">
                                <div className="bs2-card-head">
                                    <div className="bs2-card-head-left">
                                        <span className="bs2-icon" style={{ background: '#3b82f615', color: '#3b82f6' }}><Store size={20} /></span>
                                        <h3>Store Locations</h3>
                                    </div>
                                    <div className="bs2-card-head-right">
                                        {isEditMode && <button onClick={() => setBusinessData({ ...businessData, stores: [...(businessData.stores || []), { name: '', address: '', phoneNumber: '' }] })} className="bs2-add-btn">+ Add Store</button>}
                                        {isRoot && <><EditBtn /><SaveCancelBtns /></>}
                                    </div>
                                </div>
                                <div className="bs2-card-body">
                                    {(!businessData.stores || businessData.stores.length === 0) ? (
                                        <div className="bs2-empty">No managed stores added. Deliveries will default to the Main Organization Address.</div>
                                    ) : (
                                        <div className="bs2-stores">
                                            {businessData.stores.map((store, i) => (
                                                <div key={i} className="bs2-store">
                                                    <div className="bs2-store-avatar"><Store size={18} /></div>
                                                    <div><label>Name</label><input value={store.name} onChange={e => { const up = [...businessData.stores]; up[i].name = e.target.value; setBusinessData({ ...businessData, stores: up }) }} disabled={!isEditMode} className={inpCls} placeholder="e.g. Central Store" /></div>
                                                    <div><label>Address</label><input value={store.address} onChange={e => { const up = [...businessData.stores]; up[i].address = e.target.value; setBusinessData({ ...businessData, stores: up }) }} disabled={!isEditMode} className={inpCls} placeholder="e.g. 123 Storage Rd, Colombo" /></div>
                                                    <div><label>Telephone</label><input value={store.phoneNumber} onChange={e => { const up = [...businessData.stores]; up[i].phoneNumber = e.target.value; setBusinessData({ ...businessData, stores: up }) }} disabled={!isEditMode} className={inpCls} placeholder="e.g. +94112345678" /></div>
                                                    {isEditMode && <button onClick={() => { const up = businessData.stores.filter((_, idx) => idx !== i); setBusinessData({ ...businessData, stores: up }) }} className="bs2-remove"><MinusCircle size={22} /></button>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="quotation" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                        <div className="bs2-cards">

                            {/* Quotation */}
                            <div className="bs2-card">
                                <div className="bs2-card-head">
                                    <div className="bs2-card-head-left">
                                        <span className="bs2-icon" style={{ background: '#0ea5e915', color: '#0ea5e9' }}><Receipt size={20} /></span>
                                        <h3>Quotation Settings</h3>
                                    </div>
                                    <ColorPreview titleColor={businessData.quotationTitleColor} dividerColor={businessData.quotationDividerColor} title="QUOTATION" />
                                    {isRoot && <><EditBtn /><SaveCancelBtns /></>}
                                </div>
                                <div className="bs2-card-body">
                                    <div className="bs2-doc-grid">
                                        <div className="bs2-doc-left">
                                            <div className="bs2-grid bs2-grid-2">
                                                <div><label>Prefix</label><input value={businessData.quotationPrefix} onChange={e => setBusinessData({ ...businessData, quotationPrefix: e.target.value })} disabled={!isEditMode} className={inpCls} placeholder="e.g. QN" /></div>
                                                <div><label>Digits</label><input type="number" min="2" max="10" value={businessData.quotationDigits} onChange={e => setBusinessData({ ...businessData, quotationDigits: parseInt(e.target.value) || 5 })} disabled={!isEditMode} className={inpCls} placeholder="5" /></div>
                                            </div>
                                            <div className="bs2-grid bs2-grid-2" style={{ marginTop: '0.75rem' }}>
                                                <ColorPicker label="Title Color" value={businessData.quotationTitleColor} onChange={v => setBusinessData({ ...businessData, quotationTitleColor: v })} disabled={!isEditMode} icon={Type} />
                                                <ColorPicker label="Divider Color" value={businessData.quotationDividerColor} onChange={v => setBusinessData({ ...businessData, quotationDividerColor: v })} disabled={!isEditMode} icon={Minus} />
                                            </div>
                                        </div>
                                        <div className="bs2-doc-right">
                                            <div><label>Quotation Terms & Conditions</label><textarea value={businessData.quotationTerms} onChange={e => setBusinessData({ ...businessData, quotationTerms: e.target.value })} disabled={!isEditMode} className={`${inpCls} bs2-ta`} placeholder="Enter standard terms..." /></div>
                                            <div><label>Default Quotation Notes</label><textarea value={businessData.quotationNotes} onChange={e => setBusinessData({ ...businessData, quotationNotes: e.target.value })} disabled={!isEditMode} className={`${inpCls} bs2-ta`} placeholder="Enter default notes..." /></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Purchase Order */}
                            <div className="bs2-card">
                                <div className="bs2-card-head">
                                    <div className="bs2-card-head-left">
                                        <span className="bs2-icon" style={{ background: '#0ea5e915', color: '#e9af0e' }}><Receipt size={20} /></span>
                                        <h3>Purchase Order Settings</h3>
                                    </div>
                                    <ColorPreview titleColor={businessData.purchaseOrderTitleColor} dividerColor={businessData.purchaseOrderDividerColor} title="PURCHASE ORDER" />
                                    {isRoot && <><EditBtn /><SaveCancelBtns /></>}
                                </div>
                                <div className="bs2-card-body">
                                    <div className="bs2-doc-grid">
                                        <div className="bs2-doc-left">
                                            <div className="bs2-grid bs2-grid-2">
                                                <div><label>Prefix</label><input value={businessData.purchaseOrderPrefix} onChange={e => setBusinessData({ ...businessData, purchaseOrderPrefix: e.target.value })} disabled={!isEditMode} className={inpCls} placeholder="e.g. PO" /></div>
                                                <div><label>Digits</label><input type="number" min="2" max="10" value={businessData.purchaseOrderDigits} onChange={e => setBusinessData({ ...businessData, purchaseOrderDigits: parseInt(e.target.value) || 5 })} disabled={!isEditMode} className={inpCls} placeholder="5" /></div>
                                            </div>
                                            <div className="bs2-grid bs2-grid-2" style={{ marginTop: '0.75rem' }}>
                                                <ColorPicker label="Title Color" value={businessData.purchaseOrderTitleColor} onChange={v => setBusinessData({ ...businessData, purchaseOrderTitleColor: v })} disabled={!isEditMode} icon={Type} />
                                                <ColorPicker label="Divider Color" value={businessData.purchaseOrderDividerColor} onChange={v => setBusinessData({ ...businessData, purchaseOrderDividerColor: v })} disabled={!isEditMode} icon={Minus} />
                                            </div>
                                        </div>
                                        <div className="bs2-doc-right">
                                            <div><label>Purchase Order Terms & Conditions</label><textarea value={businessData.purchaseOrderTerms} onChange={e => setBusinessData({ ...businessData, purchaseOrderTerms: e.target.value })} disabled={!isEditMode} className={`${inpCls} bs2-ta`} placeholder="Enter standard terms..." /></div>
                                            <div><label>Default Purchase Order Notes</label><textarea value={businessData.purchaseOrderNotes} onChange={e => setBusinessData({ ...businessData, purchaseOrderNotes: e.target.value })} disabled={!isEditMode} className={`${inpCls} bs2-ta`} placeholder="Enter default notes..." /></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Invoice */}
                            <div className="bs2-card">
                                <div className="bs2-card-head">
                                    <div className="bs2-card-head-left">
                                        <span className="bs2-icon" style={{ background: '#0ea5e915', color: '#e92f0e' }}><Receipt size={20} /></span>
                                        <h3>Invoice Settings</h3>
                                    </div>
                                    <ColorPreview titleColor={businessData.invoiceTitleColor} dividerColor={businessData.invoiceDividerColor} title="INVOICE" />
                                    {isRoot && <><EditBtn /><SaveCancelBtns /></>}
                                </div>
                                <div className="bs2-card-body">
                                    <div className="bs2-doc-grid">
                                        <div className="bs2-doc-left">
                                            <div className="bs2-grid bs2-grid-2">
                                                <div><label>Prefix</label><input value={businessData.invoicePrefix} onChange={e => setBusinessData({ ...businessData, invoicePrefix: e.target.value })} disabled={!isEditMode} className={inpCls} placeholder="e.g. INV" /></div>
                                                <div><label>Digits</label><input type="number" min="2" max="10" value={businessData.invoiceDigits} onChange={e => setBusinessData({ ...businessData, invoiceDigits: parseInt(e.target.value) || 5 })} disabled={!isEditMode} className={inpCls} placeholder="5" /></div>
                                            </div>
                                            <div className="bs2-grid bs2-grid-2" style={{ marginTop: '0.75rem' }}>
                                                <ColorPicker label="Title Color" value={businessData.invoiceTitleColor} onChange={v => setBusinessData({ ...businessData, invoiceTitleColor: v })} disabled={!isEditMode} icon={Type} />
                                                <ColorPicker label="Divider Color" value={businessData.invoiceDividerColor} onChange={v => setBusinessData({ ...businessData, invoiceDividerColor: v })} disabled={!isEditMode} icon={Minus} />
                                            </div>
                                        </div>
                                        <div className="bs2-doc-right">
                                            <div><label>Invoice Terms & Conditions</label><textarea value={businessData.invoiceTerms} onChange={e => setBusinessData({ ...businessData, invoiceTerms: e.target.value })} disabled={!isEditMode} className={`${inpCls} bs2-ta`} placeholder="Enter standard terms..." /></div>
                                            <div><label>Default Invoice Notes</label><textarea value={businessData.invoiceNotes} onChange={e => setBusinessData({ ...businessData, invoiceNotes: e.target.value })} disabled={!isEditMode} className={`${inpCls} bs2-ta`} placeholder="Enter default notes..." /></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default BusinessSettings;
