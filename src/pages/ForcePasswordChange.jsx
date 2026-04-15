import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';
import { Lock, ShieldCheck, ArrowRight, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';

const ForcePasswordChange = () => {
    const { user, setUser } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Visibility states
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (newPassword === currentPassword) {
            toast.error("New password must be different from the current password!", {
                icon: '⚠️',
                style: { background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match!");
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/users/change-password', { currentPassword, newPassword });
            
            const updatedUser = { ...user, forcePasswordChange: false };
            localStorage.setItem('user', JSON.stringify(updatedUser)); 
            setUser(updatedUser);

            toast.success("Security update complete! Welcome to your terminal. 🛡️", {
                duration: 4000,
                style: { background: '#0f172a', color: '#fff', borderRadius: '14px' }
            });

            setTimeout(() => {
                if (updatedUser.role === 'admin' || updatedUser.role === 'root') navigate('/admin/dashboard');
                else navigate('/dashboard');
            }, 1500);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update password.", {
                style: { background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' }
            });
            setIsLoading(false);
        }
    };

    const inputWrapperStyle = { position: 'relative', width: '100%' };
    const inputStyle = {
        width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px',
        padding: '1rem 3.5rem 1rem 3.5rem', fontSize: '1.05rem', color: '#0f172a', outline: 'none',
        transition: 'all 0.2s', fontFamily: "'Outfit', sans-serif", boxSizing: 'border-box'
    };
    const iconLeftStyle = { position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' };
    const iconRightStyle = { position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' };

    return (
        <div style={{ minHeight: '100vh', background: '#08090a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: "'Outfit', sans-serif" }}>
            {/* Background elements */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '64px 64px', pointerEvents: 'none' }} />

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 1 }}>
                <div style={{ background: '#fff', borderRadius: '40px', padding: '4rem', boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}>
                    
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <div style={{ width: 80, height: 80, background: '#f1f5f9', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                            <KeyRound size={40} color="#0f172a" />
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.04em', margin: '0 0 0.85rem' }}>Update Credentials</h2>
                        <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>Your account was recently managed. Please set a new private password.</p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Current Password</label>
                            <div style={inputWrapperStyle}>
                                <Lock size={20} style={iconLeftStyle} />
                                <input type={showCurrent ? 'text' : 'password'} required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" style={inputStyle} onFocus={e => e.target.style.borderColor = '#0f172a'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                                <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={iconRightStyle}>
                                    {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>New Private Password</label>
                            <div style={inputWrapperStyle}>
                                <Lock size={20} style={iconLeftStyle} />
                                <input type={showNew ? 'text' : 'password'} required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" style={inputStyle} onFocus={e => e.target.style.borderColor = '#0f172a'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                                <button type="button" onClick={() => setShowNew(!showNew)} style={iconRightStyle}>
                                    {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Confirm Identity</label>
                            <div style={inputWrapperStyle}>
                                <Lock size={20} style={iconLeftStyle} />
                                <input type={showConfirm ? 'text' : 'password'} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" style={inputStyle} onFocus={e => e.target.style.borderColor = '#0f172a'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={iconRightStyle}>
                                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading} style={{ 
                            background: '#0f172a', color: '#fff', border: 'none', borderRadius: '18px', padding: '1.25rem', marginTop: '1.5rem',
                            cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                            boxShadow: '0 12px 32px rgba(15,23,42,0.25)', transition: 'all 0.3s'
                        }}
                            onMouseEnter={e => { if(!isLoading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#1e293b'; } }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = '#0f172a'; }}
                        >
                            {isLoading ? <Loader2 size={26} className="animate-spin" /> : <><span>Unlock Application</span> <ArrowRight size={22} /></>}
                        </button>
                    </form>

                    <div style={{ marginTop: '3rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>
                        <ShieldCheck size={18} />
                        <span>Identity Protected by InvoPrint SSL</span>
                    </div>
                </div>
            </motion.div>
            <style>{`.animate-spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default ForcePasswordChange;
