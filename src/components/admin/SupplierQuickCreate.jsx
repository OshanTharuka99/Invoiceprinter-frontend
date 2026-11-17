import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Truck, X } from 'lucide-react';
import api from '../../api';
import useSubmitGuard from '../../utils/useSubmitGuard';

const emptyForm = () => ({
    name: '',
    telephoneNumber: '',
    emailAddress: '',
    address: '',
    bankDetails: { accountNumber: '', accountName: '', bankName: '', branch: '' },
});

const fieldStyle = {
    width: '100%', padding: '9px 11px', border: '1px solid #cbd5e1', borderRadius: 8,
    fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff',
};

const labelStyle = { display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: 5 };

const SupplierQuickCreate = () => {
    const [form, setForm] = useState(emptyForm);
    const { isSubmitting, runGuarded } = useSubmitGuard();

    const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
    const updateBank = (key, value) => setForm(prev => ({
        ...prev,
        bankDetails: { ...prev.bankDetails, [key]: value },
    }));

    const save = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return toast.error('Supplier name is required');
        await runGuarded(async () => {
            try {
                const res = await api.post('/suppliers', form);
                const supplier = res.data.data;
                window.opener?.postMessage(
                    { type: 'invoiprint:supplier-created', supplier },
                    window.location.origin
                );
                toast.success(`Supplier ${supplier.name} created`);
                setTimeout(() => window.close(), 250);
            } catch (err) {
                toast.error(err.response?.data?.message || 'Unable to create supplier');
            }
        });
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: 24, fontFamily: "'Outfit', sans-serif" }}>
            <div style={{ maxWidth: 560, margin: '0 auto', background: '#fff', borderRadius: 14, boxShadow: '0 10px 30px rgba(15,23,42,0.08)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Truck size={19} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>New Supplier</h2>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Adds the supplier and returns to the stock form</div>
                        </div>
                    </div>
                    <button type="button" onClick={() => window.close()} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, padding: 7, cursor: 'pointer', color: '#475569' }}>
                        <X size={17} />
                    </button>
                </div>

                <form onSubmit={save} style={{ padding: 22, display: 'grid', gap: 14 }}>
                    <div>
                        <label style={labelStyle}>Supplier Name *</label>
                        <input style={fieldStyle} value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Metro Supplies" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={labelStyle}>Telephone</label>
                            <input style={fieldStyle} value={form.telephoneNumber} onChange={e => update('telephoneNumber', e.target.value)} placeholder="077 000 0000" />
                        </div>
                        <div>
                            <label style={labelStyle}>Email</label>
                            <input style={fieldStyle} type="email" value={form.emailAddress} onChange={e => update('emailAddress', e.target.value)} placeholder="supplier@example.com" />
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Address</label>
                        <textarea style={{ ...fieldStyle, minHeight: 70, resize: 'vertical' }} value={form.address} onChange={e => update('address', e.target.value)} placeholder="Street, city" />
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#0f172a', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bank Details (optional)</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label style={labelStyle}>Account Number</label>
                                <input style={fieldStyle} value={form.bankDetails.accountNumber} onChange={e => updateBank('accountNumber', e.target.value)} />
                            </div>
                            <div>
                                <label style={labelStyle}>Account Name</label>
                                <input style={fieldStyle} value={form.bankDetails.accountName} onChange={e => updateBank('accountName', e.target.value)} />
                            </div>
                            <div>
                                <label style={labelStyle}>Bank Name</label>
                                <input style={fieldStyle} value={form.bankDetails.bankName} onChange={e => updateBank('bankName', e.target.value)} />
                            </div>
                            <div>
                                <label style={labelStyle}>Branch</label>
                                <input style={fieldStyle} value={form.bankDetails.branch} onChange={e => updateBank('branch', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={isSubmitting} style={{ marginTop: 4, padding: '11px 14px', border: 'none', borderRadius: 9, background: '#2563eb', color: '#fff', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}>
                        {isSubmitting ? 'Saving...' : 'Create Supplier'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SupplierQuickCreate;
