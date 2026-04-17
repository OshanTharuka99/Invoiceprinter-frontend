import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Building2, Phone, MapPin, Coins, Receipt, Tag, Save, 
    Edit3, CheckCircle, PlusCircle, MinusCircle, AlertCircle,
    Check, RefreshCw, Hash, Mail, Globe, Landmark, DollarSign, ChevronDown, Settings2, Shield
} from 'lucide-react';
import api from '../../api';

/**
 * GENERAL SETTINGS - COMPREHENSIVE REFINED
 * ----------------------------------------
 * Fixed: Syntax errors and restored full fiscal management.
 */
const BusinessSettings = ({ currentUser, showToast }) => {
    const [activeSubTab, setActiveSubTab] = useState('business');
    const [businessData, setBusinessData] = useState({
        businessName: '', businessType: 'Owner', registrationNumber: '',
        address: '', phoneNumber: '', email: '', fax: '',
        country: 'Sri Lanka', city: '',
        primaryCurrency: { code: 'LKR', symbol: 'Rs.' },
        secondaryCurrency: { code: 'USD', symbol: '$' },
        isVatRegistered: false, vatNumber: '', vatPercentage: 18,
        otherTaxes: [], discountProfiles: []
    });

    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const fetchDetails = async () => {
        try {
            const res = await api.get('/business');
            if (res.data.data.details) setBusinessData(res.data.data.details);
        } catch (err) { showToast('Sync failed', 'error'); }
    };

    useEffect(() => { fetchDetails(); }, []);

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (currentUser.role !== 'root') return showToast('Operation Denied: Root clearance required', 'error');
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

    // UI Styles
    const cardStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '2.5rem', marginBottom: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
    const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#64748b', marginBottom: '0.6rem', textTransform: 'uppercase' };
    const inputStyle = (editing) => ({
        width: '100%', background: editing ? '#fff' : '#f8fafc', border: editing ? '2px solid #0f172a' : '1.5px solid #e2e8f0',
        borderRadius: '12px', padding: '0.9rem 1.25rem', color: editing ? '#0f172a' : '#64748b', transition: 'all 0.2s', outline: 'none', fontWeight: 700
    });
    const btnGradient = (color1, color2) => ({ background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`, color: '#fff', border: 'none', borderRadius: '16px', padding: '0.9rem 1.5rem', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem' });

    const subTabButtonStyle = (id) => ({
        padding: '0.8rem 1.5rem', border: 'none', background: activeSubTab === id ? '#0f172a' : 'transparent',
        color: activeSubTab === id ? '#fff' : '#64748b', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', transition: '0.3s', fontSize: '0.9rem'
    });

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            
            <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '6px', borderRadius: '16px', marginBottom: '3rem', width: 'fit-content' }}>
                <button onClick={() => {setActiveSubTab('business'); setIsEditMode(false);}} style={subTabButtonStyle('business')}>Business Settings</button>
                <button onClick={() => {setActiveSubTab('others'); setIsEditMode(false);}} style={subTabButtonStyle('others')}>Other Settings</button>
            </div>

            <AnimatePresence mode="wait">
                {activeSubTab === 'business' ? (
                    <motion.div key="business" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                        
                        {/* HEADER */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3.5rem', gap: '2rem' }}>
                            <div style={{ borderLeft: '4px solid #0f172a', paddingLeft: '1.5rem' }}>
                                <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500, margin: 0, lineHeight: '1.6', maxWidth: '600px' }}>
                                    Manage your organization's core identity, official communication channels, and fiscal parameters.
                                </p>
                            </div>
                            
                            {currentUser.role === 'root' && (
                                <button onClick={isEditMode ? handleSave : () => setIsEditMode(true)} disabled={isSaving} style={isEditMode ? btnGradient('#10b981', '#059669') : btnGradient('#0f172a', '#1e293b')}>
                                    {isSaving ? <RefreshCw className="animate-spin" size={18} /> : (isEditMode ? <CheckCircle size={18} /> : <Edit3 size={18} />)}
                                    {isEditMode ? 'SAVE CONFIGURATION' : 'EDIT BUSINESS DETAILS'}
                                </button>
                            )}
                        </div>

                        {/* 1. IDENTITY */}
                        <div style={cardStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}><div style={{ background: '#6366f115', color: '#6366f1', padding: '10px', borderRadius: '12px' }}><Building2 size={24} /></div> <h3 style={{ margin: 0, fontWeight: 900 }}>Organization Identity</h3></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                                <div><label style={labelStyle}>Business Name</label><input value={businessData.businessName} onChange={e => setBusinessData({...businessData, businessName: e.target.value})} disabled={!isEditMode} style={inputStyle(isEditMode)} /></div>
                                <div><label style={labelStyle}>Business Type</label><select value={businessData.businessType} onChange={e => setBusinessData({...businessData, businessType: e.target.value})} disabled={!isEditMode} style={inputStyle(isEditMode)}>{["Owner", "Partnership", "Private Limited", "Public Limited", "NGO"].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                <div><label style={labelStyle}>Registry Key</label><input value={businessData.registrationNumber} onChange={e => setBusinessData({...businessData, registrationNumber: e.target.value})} disabled={!isEditMode} style={inputStyle(isEditMode)} /></div>
                            </div>
                        </div>

                        {/* 2. COMMUNICATION */}
                        <div style={cardStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}><div style={{ background: '#3b82f615', color: '#3b82f6', padding: '10px', borderRadius: '12px' }}><Phone size={24} /></div> <h3 style={{ margin: 0, fontWeight: 900 }}>Communication Hub</h3></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                                <div><label style={labelStyle}>Official Email</label><input value={businessData.email} onChange={e => setBusinessData({...businessData, email: e.target.value})} disabled={!isEditMode} style={inputStyle(isEditMode)} /></div>
                                <div><label style={labelStyle}>Contact Hotline</label><input value={businessData.phoneNumber} onChange={e => setBusinessData({...businessData, phoneNumber: e.target.value})} disabled={!isEditMode} style={inputStyle(isEditMode)} /></div>
                                <div><label style={labelStyle}>Fax Number</label><input value={businessData.fax} onChange={e => setBusinessData({...businessData, fax: e.target.value})} disabled={!isEditMode} style={inputStyle(isEditMode)} /></div>
                            </div>
                        </div>

                        {/* 3. LOCATION */}
                        <div style={cardStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}><div style={{ background: '#10b98115', color: '#10b981', padding: '10px', borderRadius: '12px' }}><MapPin size={24} /></div> <h3 style={{ margin: 0, fontWeight: 900 }}>Operational Location</h3></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1.5rem' }}>
                                <div style={{ gridColumn: 'span 3' }}><label style={labelStyle}>Full Physical Address</label><textarea value={businessData.address} onChange={e => setBusinessData({...businessData, address: e.target.value})} disabled={!isEditMode} style={{ ...inputStyle(isEditMode), height: 80, resize: 'none' }} /></div>
                                <div><label style={labelStyle}>City</label><input value={businessData.city} onChange={e => setBusinessData({...businessData, city: e.target.value})} disabled={!isEditMode} style={inputStyle(isEditMode)} /></div>
                                <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Country Protocol</label><select value={businessData.country} onChange={e => setBusinessData({...businessData, country: e.target.value})} disabled={!isEditMode} style={inputStyle(isEditMode)}>{["Sri Lanka", "United States", "United Kingdom", "India", "UAE"].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                            </div>
                        </div>

                        {/* 4. FISCAL CURRENCY */}
                        <div style={cardStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}><div style={{ background: '#f59e0b15', color: '#f59e0b', padding: '10px', borderRadius: '12px' }}><Coins size={24} /></div> <h3 style={{ margin: 0, fontWeight: 900 }}>Fiscal Currency</h3></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div><label style={labelStyle}>Primary Ledger</label><select value={businessData.primaryCurrency?.code} onChange={e => handleCurrencyChange('primaryCurrency', e.target.value)} disabled={!isEditMode} style={inputStyle(isEditMode)}>{["LKR", "USD", "EUR", "GBP", "INR", "AED"].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                <div><label style={labelStyle}>Secondary Ledger</label><select value={businessData.secondaryCurrency?.code} onChange={e => handleCurrencyChange('secondaryCurrency', e.target.value)} disabled={!isEditMode} style={inputStyle(isEditMode)}>{["LKR", "USD", "EUR", "GBP", "INR", "AED"].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                            </div>
                        </div>

                        {/* 5. FISCAL TAXES */}
                        <div style={cardStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}><div style={{ background: '#ef444415', color: '#ef4444', padding: '10px', borderRadius: '12px' }}><Receipt size={24} /></div> <h3 style={{ margin: 0, fontWeight: 900 }}>Fiscal Taxes</h3></div>
                            
                            <div style={{ background: businessData.isVatRegistered ? '#0f172a' : '#f8fafc', padding: '2.5rem', borderRadius: '24px', transition: '0.3s', marginBottom: '2.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', color: businessData.isVatRegistered ? '#fff' : '#0f172a', marginBottom: businessData.isVatRegistered ? '2rem' : 0 }}>
                                    <div><div style={{ fontWeight: 950, fontSize: '1.25rem' }}>VAT REGISTRATION</div><p style={{ opacity: 0.6, fontSize: '0.85rem', marginTop: '0.25rem' }}>{businessData.isVatRegistered ? 'Corporate VAT protocols active' : 'VAT protocols inactive'}</p></div>
                                    <button onClick={() => isEditMode && setBusinessData({...businessData, isVatRegistered: !businessData.isVatRegistered})} disabled={!isEditMode} style={{ width: 64, height: 32, borderRadius: '32px', background: businessData.isVatRegistered ? '#10b981' : '#cbd5e1', border: 'none', position: 'relative', cursor: isEditMode ? 'pointer' : 'not-allowed' }}>
                                        <div style={{ width: 24, height: 24, background: '#fff', borderRadius: '50%', position: 'absolute', top: 4, left: businessData.isVatRegistered ? 36 : 4, transition: '0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                                    </button>
                                </div>
                                {businessData.isVatRegistered && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                                        <div><label style={{ ...labelStyle, color: '#94a3b8' }}>VAT Number</label><input value={businessData.vatNumber} onChange={e => setBusinessData({...businessData, vatNumber: e.target.value})} disabled={!isEditMode} style={{ ...inputStyle(isEditMode), background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} /></div>
                                        <div><label style={{ ...labelStyle, color: '#94a3b8' }}>VAT Rate (%)</label><input type="number" value={businessData.vatPercentage} onChange={e => setBusinessData({...businessData, vatPercentage: e.target.value})} disabled={!isEditMode} style={{ ...inputStyle(isEditMode), background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} /></div>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* 6. SUPPLEMENTARY TAXES */}
                        <div style={cardStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><div style={{ background: '#ef444415', color: '#ef4444', padding: '10px', borderRadius: '12px' }}><Receipt size={24} /></div> <h3 style={{ margin: 0, fontWeight: 900 }}>Supplementary Taxes</h3></div>
                                {isEditMode && <button onClick={() => setBusinessData({...businessData, otherTaxes: [...businessData.otherTaxes, {name:'', type:'percentage', value:0}]})} style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.7rem 1.25rem', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}>+ Add Tax</button>}
                            </div>
                            {businessData.otherTaxes.map((tax, i) => (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 50px', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '16px', border: '1px solid #f1f5f9', alignItems: 'end', marginBottom: '1rem' }}>
                                    <div><label style={labelStyle}>Tax Entity</label><input value={tax.name} onChange={e => {const up = [...businessData.otherTaxes]; up[i].name=e.target.value; setBusinessData({...businessData, otherTaxes: up})}} disabled={!isEditMode} style={inputStyle(isEditMode)} /></div>
                                    <div><label style={labelStyle}>Unit</label><select value={tax.type} onChange={e => {const up = [...businessData.otherTaxes]; up[i].type=e.target.value; setBusinessData({...businessData, otherTaxes: up})}} disabled={!isEditMode} style={inputStyle(isEditMode)}><option value="percentage">%</option><option value="fixed">Fixed</option></select></div>
                                    <div><label style={labelStyle}>Rate/Amt</label><input type="number" value={tax.value} onChange={e => {const up = [...businessData.otherTaxes]; up[i].value=e.target.value; setBusinessData({...businessData, otherTaxes: up})}} disabled={!isEditMode} style={inputStyle(isEditMode)} /></div>
                                    {isEditMode && <button onClick={() => {const up = businessData.otherTaxes.filter((_,idx)=>idx!==i); setBusinessData({...businessData, otherTaxes: up})}} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '10px' }}><MinusCircle size={22}/></button>}
                                </div>
                            ))}
                        </div>

                        {/* 7. PROMOTIONAL YIELDS (Discounts) */}
                        <div style={cardStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><div style={{ background: '#10b98115', color: '#10b981', padding: '10px', borderRadius: '12px' }}><Tag size={24} /></div> <h3 style={{ margin: 0, fontWeight: 900 }}>Promotional Yields</h3></div>
                                {isEditMode && <button onClick={() => setBusinessData({...businessData, discountProfiles: [...businessData.discountProfiles, {name:'', type:'percentage', value:0, minBillAmount:0}]})} style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.7rem 1.25rem', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}>+ Add Profile</button>}
                            </div>
                            {businessData.discountProfiles.map((disc, i) => (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr 50px', gap: '1rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '20px', border: '1px solid #f1f5f9', alignItems: 'end', marginBottom: '1.5rem' }}>
                                    <div><label style={labelStyle}>Profile Name</label><input value={disc.name} onChange={e => {const up=[...businessData.discountProfiles]; up[i].name=e.target.value; setBusinessData({...businessData, discountProfiles: up})}} disabled={!isEditMode} style={inputStyle(isEditMode)} /></div>
                                    <div><label style={labelStyle}>Rule Type</label><select value={disc.type} onChange={e => {const up=[...businessData.discountProfiles]; up[i].type=e.target.value; setBusinessData({...businessData, discountProfiles: up})}} disabled={!isEditMode} style={inputStyle(isEditMode)}><option value="percentage">%</option><option value="fixed">Fixed</option></select></div>
                                    <div><label style={labelStyle}>Value</label><input type="number" value={disc.value} onChange={e => {const up=[...businessData.discountProfiles]; up[i].value=e.target.value; setBusinessData({...businessData, discountProfiles: up})}} disabled={!isEditMode} style={inputStyle(isEditMode)} /></div>
                                    <div><label style={labelStyle}>Threshold</label><input type="number" value={disc.minBillAmount} onChange={e => {const up=[...businessData.discountProfiles]; up[i].minBillAmount=e.target.value; setBusinessData({...businessData, discountProfiles: up})}} disabled={!isEditMode} style={inputStyle(isEditMode)} /></div>
                                    {isEditMode && <button onClick={() => {const up=businessData.discountProfiles.filter((_,idx)=>idx!==i); setBusinessData({...businessData, discountProfiles: up})}} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '10px' }}><MinusCircle size={22}/></button>}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="others" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                        <div style={cardStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}><div style={{ background: '#f8fafc', color: '#0f172a', padding: '10px', borderRadius: '12px' }}><Settings2 size={24} /></div> <h3 style={{ margin: 0, fontWeight: 900 }}>Additional Protocols</h3></div>
                            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#94a3b8' }}>
                                <Shield size={48} style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
                                <p style={{ fontWeight: 700 }}>Supplementary configuration module under implementation.</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default BusinessSettings;
