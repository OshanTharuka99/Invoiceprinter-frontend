import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, Eye, EyeOff, RefreshCw, Check, X, ShieldAlert } from 'lucide-react';
import api from '../api';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

/**
 * FORCE PASSWORD CHANGE - ONE SHOT EDITION
 * ---------------------------------------
 * Compact layout to fit single viewport without scrolling.
 */
const ForcePasswordChange = () => {
    const { setUser } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const policy = {
        length: newPassword.length >= 8,
        uppercase: /[A-Z]/.test(newPassword),
        number: /[0-9]/.test(newPassword),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
    };
    const isPolicyValid = Object.values(policy).every(Boolean);

    const showToast = (message, type = 'success') => {
        toast(message, {
            duration: 3500,
            icon: type === 'success' ? '✅' : '🔴',
            style: { background: '#0f172a', color: '#f8fafc', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 20px', fontSize: '0.9rem', fontFamily: "'Outfit', sans-serif", fontWeight: '700' },
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isPolicyValid) return showToast('Policy requirements missing.', 'error');
        if (newPassword !== confirmPassword) return showToast('Passwords mismatch.', 'error');
        setIsLoading(true);
        try {
            const res = await api.post('/users/change-password', { newPassword });
            
            // SYNC SESSION STATE: Critical for successful redirection
            if (res.data.data?.user) {
                const updatedUser = res.data.data.user;
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
            }

            showToast('Security updated. Redirecting...', 'success');
            setTimeout(() => navigate('/dashboard'), 1500);
        } catch (err) { 
            const msg = err.response?.data?.message || 'Update rejection. Check policy.';
            showToast(msg, 'error'); 
        } finally {
            setIsLoading(false);
        }
    };

    const PolicyItem = ({ label, met }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: met ? '#10b981' : '#94a3b8', transition: 'all 0.2s', fontSize: '0.75rem', fontWeight: 800 }}>
            {met ? <Check size={12} strokeWidth={4} /> : <X size={12} strokeWidth={4} />}
            <span>{label}</span>
        </div>
    );

    return (
        <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08090a', fontFamily: "'Outfit', sans-serif", overflow: 'hidden' }}>
            <Toaster position="top-right" />
            
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={{ width: '100%', maxWidth: '440px', background: '#fff', borderRadius: '32px', padding: '2.5rem', boxShadow: '0 40px 100px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: 50, height: 50, background: '#f8fafc', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldAlert size={24} color="#6366f1" /></div>
                    <div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 950, letterSpacing: '-1px', margin: 0, color: '#0f172a' }}>Security Renewal</h2>
                        <p style={{ color: '#64748b', margin: '0.4rem 0 0', fontWeight: 500, fontSize: '0.85rem', lineHeight: '1.5' }}>As this is your first login, please update your password to ensure the security of your account and the portal protocol.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* New Password */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>New Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '0.9rem 1rem 0.9rem 2.75rem', fontSize: '1rem', outline: 'none', fontWeight: 700, transition: '0.2s', boxSizing: 'border-box' }} required />
                            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>{showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
                            <PolicyItem label="8+ Chars" met={policy.length} />
                            <PolicyItem label="A-Z Case" met={policy.uppercase} />
                            <PolicyItem label="Numbers" met={policy.number} />
                            <PolicyItem label="Special (@#)" met={policy.special} />
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Confirm Password</label>
                        <div style={{ position: 'relative' }}>
                            <ShieldCheck size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ width: '100%', background: '#f8fafc', border: (confirmPassword && newPassword !== confirmPassword) ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0', borderRadius: '14px', padding: '0.9rem 1rem 0.9rem 2.75rem', fontSize: '1rem', outline: 'none', fontWeight: 700, transition: '0.2s', boxSizing: 'border-box' }} required />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                        </div>
                    </div>

                    <button type="submit" disabled={isLoading || !isPolicyValid} style={{ width: '100%', background: isPolicyValid ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : '#e2e8f0', color: isPolicyValid ? '#fff' : '#94a3b8', border: 'none', borderRadius: '14px', padding: '1rem', fontSize: '1rem', fontWeight: 900, cursor: isPolicyValid ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '0.5rem', transition: '0.3s' }}>
                        {isLoading ? <RefreshCw size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
                        {isLoading ? 'UPDATING...' : 'FINALIZE SECURITY'}
                    </button>
                    
                    <p style={{ color: '#cbd5e1', fontSize: '0.65rem', textAlign: 'center', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Infrastructure Protection Active</p>
                </form>
            </motion.div>
        </div>
    );
};

export default ForcePasswordChange;
