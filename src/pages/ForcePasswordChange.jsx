import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
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

    const [focusField, setFocusField] = useState(null);
    const [hoverBtn, setHoverBtn] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isPolicyValid) return showToast('Policy requirements missing.', 'error');
        if (newPassword !== confirmPassword) return showToast('Passwords mismatch.', 'error');
        setIsLoading(true);
        try {
            const res = await api.post('/users/change-password', { newPassword });
            
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
        <motion.div
            animate={{ color: met ? '#10b981' : '#94a3b8', scale: met ? 1.02 : 1 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', fontWeight: 800 }}
        >
            {met ? <Check size={12} strokeWidth={4} /> : <X size={12} strokeWidth={4} />}
            <span>{label}</span>
        </motion.div>
    );

    const inputBase = (field) => ({
        width: '100%',
        background: focusField === field ? '#fff' : '#f8fafc',
        border: confirmPassword && field === 'confirm' && newPassword !== confirmPassword
            ? '1.5px solid #ef4444'
            : focusField === field
                ? '1.5px solid #dc2626'
                : '1.5px solid #e2e8f0',
        borderRadius: '14px',
        padding: '0.9rem 1rem 0.9rem 2.75rem',
        fontSize: '1rem',
        outline: 'none',
        fontWeight: 700,
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        boxSizing: 'border-box',
        boxShadow: focusField === field ? '0 0 0 4px rgba(220,38,38,0.08)' : 'none'
    });

    return (
        <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08090a', fontFamily: "'Outfit', sans-serif", overflow: 'hidden', position: 'relative' }}>
            <motion.div
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', top: '-20%', right: '-10%', width: '50%', height: '80%', background: 'radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 70%)', pointerEvents: 'none' }}
            />
            <motion.div
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '50%', height: '80%', background: 'radial-gradient(circle, rgba(220,38,38,0.06) 0%, transparent 70%)', pointerEvents: 'none' }}
            />
            <Toaster position="top-right" />
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.4,0,0.2,1] }}
                style={{
                    width: '100%', maxWidth: '440px', background: '#fff', borderRadius: '32px',
                    padding: '2.5rem', boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
                    display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', zIndex: 1
                }}
            >
                <motion.div
                    initial={{ x: -12, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}
                >
                    <motion.div
                        animate={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        style={{ width: 50, height: 50, background: '#fef2f2', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    >
                        <ShieldAlert size={24} color="#dc2626" />
                    </motion.div>
                    <div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 950, letterSpacing: '-1px', margin: 0, color: '#0f172a' }}>Security Renewal</h2>
                        <p style={{ color: '#64748b', margin: '0.4rem 0 0', fontWeight: 500, fontSize: '0.85rem', lineHeight: '1.5' }}>
                            As this is your first login, please update your password to ensure account security.
                        </p>
                    </div>
                </motion.div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.25 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                    >
                        <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>New Password</label>
                        <div style={{ position: 'relative' }}>
                            <motion.div
                                animate={{ color: focusField === 'newPass' ? '#dc2626' : '#94a3b8' }}
                                style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                            >
                                <Lock size={16} />
                            </motion.div>
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                onFocus={() => setFocusField('newPass')}
                                onBlur={() => setFocusField(null)}
                                style={inputBase('newPass')}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                style={{
                                    position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
                                    padding: '4px', borderRadius: '6px', transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none'; }}
                            >
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        
                        <motion.div
                            animate={{ borderColor: isPolicyValid ? '#d1fae5' : '#f1f5f9' }}
                            style={{
                                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem',
                                background: '#f8fafc', padding: '0.75rem', borderRadius: '14px',
                                border: '1px solid #f1f5f9', transition: 'border-color 0.3s'
                            }}
                        >
                            <PolicyItem label="8+ Chars" met={policy.length} />
                            <PolicyItem label="A-Z Case" met={policy.uppercase} />
                            <PolicyItem label="Numbers" met={policy.number} />
                            <PolicyItem label="Special (@#)" met={policy.special} />
                        </motion.div>
                    </motion.div>

                    <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                    >
                        <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Confirm Password</label>
                        <div style={{ position: 'relative' }}>
                            <motion.div
                                animate={{ color: focusField === 'confirm' ? '#dc2626' : '#94a3b8' }}
                                style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                            >
                                <ShieldCheck size={16} />
                            </motion.div>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                onFocus={() => setFocusField('confirm')}
                                onBlur={() => setFocusField(null)}
                                style={inputBase('confirm')}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={{
                                    position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
                                    padding: '4px', borderRadius: '6px', transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none'; }}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <AnimatePresence>
                            {confirmPassword && newPassword !== confirmPassword && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                >
                                    <X size={11} strokeWidth={4} /> Passwords do not match
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.35 }}
                    >
                        <motion.button
                            type="submit"
                            disabled={isLoading || !isPolicyValid}
                            onMouseEnter={() => setHoverBtn(true)}
                            onMouseLeave={() => setHoverBtn(false)}
                            animate={{
                                scale: hoverBtn && isPolicyValid && !isLoading ? 1.01 : 1,
                                background: isPolicyValid
                                    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
                                    : '#e2e8f0'
                            }}
                            transition={{ duration: 0.2 }}
                            style={{
                                width: '100%', color: isPolicyValid ? '#fff' : '#94a3b8',
                                border: 'none', borderRadius: '14px', padding: '1rem',
                                fontSize: '1rem', fontWeight: 900,
                                cursor: isPolicyValid ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '0.75rem', marginTop: '0.5rem',
                                boxShadow: isPolicyValid && !isLoading ? '0 8px 24px rgba(15,23,42,0.25)' : 'none'
                            }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isLoading ? (
                                <RefreshCw size={20} className="spin" />
                            ) : (
                                <ShieldCheck size={20} />
                            )}
                            {isLoading ? 'UPDATING...' : 'FINALIZE SECURITY'}
                        </motion.button>
                    </motion.div>
                    
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        style={{ color: '#cbd5e1', fontSize: '0.6rem', textAlign: 'center', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0 }}
                    >
                        Infrastructure Protection Active
                    </motion.p>
                </form>
            </motion.div>
        </div>
    );
};

export default ForcePasswordChange;
