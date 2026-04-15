import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Printer,
    Mail,
    Lock,
    Loader2,
    ArrowRight,
    ShieldCheck,
    Eye,
    EyeOff,
    CheckCircle,
} from 'lucide-react';

const TRUST_BADGES = ['End-to-end Encryption', '99.9% Uptime', 'ISO Certified'];

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const loggedUser = await login(email, password);
            toast.success(
                `Welcome back, ${loggedUser.firstName}! 👋`,
                {
                    duration: 3000,
                    style: {
                        background: '#0f172a',
                        color: '#f8fafc',
                        borderRadius: '14px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '14px 20px',
                        fontSize: '0.9rem',
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: '600',
                    },
                    iconTheme: { primary: '#22c55e', secondary: '#0f172a' },
                }
            );
            setTimeout(() => {
                if (loggedUser.forcePasswordChange) {
                    navigate('/force-password-change');
                } else if (loggedUser.role === 'admin' || loggedUser.role === 'root') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/dashboard');
                }
            }, 1000);
        } catch (err) {
            toast.error(
                err.response?.data?.message || 'Incorrect email or password.',
                {
                    duration: 4000,
                    style: {
                        background: '#fff1f2',
                        color: '#be123c',
                        borderRadius: '14px',
                        border: '1px solid #fecdd3',
                        padding: '14px 20px',
                        fontSize: '0.875rem',
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: '600',
                    },
                    iconTheme: { primary: '#e11d48', secondary: '#fff1f2' },
                }
            );
            setIsLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Outfit', sans-serif" }}>

            {/* ── LEFT PANEL: Deep Black Brand Side ──────────── */}
            <div style={{
                width: '45%', background: '#08090a', padding: '4rem',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                position: 'relative', overflow: 'hidden', color: '#fff',
                flexShrink: 0
            }}
                className="login-left-panel"
            >
                {/* Subtle grid texture */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
                    backgroundSize: '56px 56px', pointerEvents: 'none'
                }} />
                {/* Bottom glow orb */}
                <div style={{
                    position: 'absolute', bottom: '-20%', left: '-20%',
                    width: '70%', height: '70%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }} />

                {/* Logo */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: 48, height: 48, background: '#fff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 32px rgba(255,255,255,0.08)' }}>
                        <Printer size={26} color="#08090a" />
                    </div>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.04em', textTransform: 'uppercase' }}>
                        Invo<span style={{ color: '#6b7280', fontStyle: 'italic' }}>Print</span>
                    </span>
                </motion.div>

                {/* Hero text */}
                <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                    style={{ position: 'relative', zIndex: 1 }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#4b5563', marginBottom: '1.5rem', margin: '0 0 1.5rem' }}>
                        Enterprise Billing Platform
                    </p>
                    <h1 style={{ fontSize: 'clamp(3rem, 4.5vw, 5rem)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.04em', margin: '0 0 1.75rem' }}>
                        Intelligence<br />
                        behind every<br />
                        <span style={{ color: '#4b5563' }}>transaction.</span>
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '1.05rem', lineHeight: 1.75, maxWidth: 360, fontWeight: 400, margin: 0 }}>
                        The most sophisticated billing platform ever built for high-growth enterprises.
                    </p>
                </motion.div>

                {/* Trust badges */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                    style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {TRUST_BADGES.map((badge, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                <CheckCircle size={14} color="#4b5563" />
                                <span style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4b5563' }}>{badge}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* ── RIGHT PANEL: Clean White Form Side ──────────── */}
            <div style={{
                flex: 1, background: '#f8fafc',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '3rem 2rem'
            }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35 }}
                    style={{ width: '100%', maxWidth: 480 }}
                >
                    {/* Card */}
                    <div style={{
                        background: '#ffffff', borderRadius: '40px',
                        padding: '3.5rem', border: '1px solid #e2e8f0',
                        boxShadow: '0 32px 64px -16px rgba(0,0,0,0.06)'
                    }}>
                        {/* Greeting */}
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h2 style={{ fontSize: '2.75rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#0f172a', margin: '0 0 0.625rem', fontFamily: "'Montserrat', sans-serif" }}>
                                Hello again.
                            </h2>
                            <p style={{ color: '#64748b', fontSize: '1rem', margin: 0, fontWeight: 400 }}>
                                Please enter your credentials to continue.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            {/* Email */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', fontFamily: "'Montserrat', sans-serif", letterSpacing: '-0.01em' }}>
                                    Email Address
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '1.125rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input
                                        type="email" required value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="you@company.com"
                                        style={{
                                            width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0',
                                            borderRadius: '14px', padding: '0.9rem 1rem 0.9rem 3rem',
                                            fontSize: '0.95rem', color: '#0f172a', outline: 'none',
                                            fontFamily: "'Outfit', sans-serif", boxSizing: 'border-box',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(15,23,42,0.06)'; }}
                                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', fontFamily: "'Montserrat', sans-serif", letterSpacing: '-0.01em' }}>
                                        Password
                                    </label>
                                    <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '0.8rem', fontFamily: "'Outfit', sans-serif", fontWeight: 600, padding: 0, transition: 'color 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.color = '#0f172a'}
                                        onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
                                        Forgot?
                                    </button>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '1.125rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input
                                        type={showPassword ? 'text' : 'password'} required value={password}
                                        onChange={e => setPassword(e.target.value)} placeholder="••••••••••"
                                        style={{
                                            width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0',
                                            borderRadius: '14px', padding: '0.9rem 3rem 0.9rem 3rem',
                                            fontSize: '1rem', color: '#0f172a', outline: 'none',
                                            fontFamily: "'Outfit', sans-serif", boxSizing: 'border-box',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(15,23,42,0.06)'; }}
                                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        style={{ position: 'absolute', right: '1.125rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 0, transition: 'color 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.color = '#0f172a'}
                                        onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>




                            {/* Submit */}
                            <button type="submit" disabled={isLoading}
                                style={{
                                    width: '100%', background: '#0f172a', color: '#fff', border: 'none',
                                    borderRadius: '14px', padding: '1.1rem', cursor: isLoading ? 'not-allowed' : 'pointer',
                                    fontWeight: 700, fontSize: '1rem', fontFamily: "'Outfit', sans-serif",
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem',
                                    transition: 'all 0.25s ease', opacity: isLoading ? 0.7 : 1,
                                    boxShadow: '0 8px 24px rgba(15,23,42,0.18)'
                                }}
                                onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 32px rgba(15,23,42,0.2)'; } }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.18)'; }}
                            >
                                {isLoading
                                    ? <Loader2 size={22} style={{ animation: 'spin 0.8s linear infinite' }} />
                                    : <><span>Sign In to Terminal</span><ArrowRight size={20} /></>
                                }
                            </button>
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        </form>

                        {/* Security badge */}
                        <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.82rem', fontWeight: 500 }}>
                            <ShieldCheck size={15} />
                            <span>Enterprise SSL Security</span>
                        </div>
                    </div>

                    <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#94a3b8', fontWeight: 500 }}>
                        New to InvoPrint?{' '}
                        <span style={{ color: '#0f172a', fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                            Contact your Administrator
                        </span>
                    </p>
                </motion.div>
            </div>

            {/* Responsive: hide left panel on small screens */}
            <style>{`
                @media (max-width: 1023px) { .login-left-panel { display: none !important; } }
            `}</style>
        </div>
    );
};

export default Login;
