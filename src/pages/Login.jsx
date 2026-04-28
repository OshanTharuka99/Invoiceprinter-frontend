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
import './login.css';

const TRUST_BADGES = ['SOC 2 Type II Certified', '99.99% Uptime SLA', 'Bank-Grade Encryption'];

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
        <div className="login-container">
            {/* ── LEFT PANEL: Deep Black Brand Side ──────────── */}
            <div className="login-left-panel">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="login-logo"
                >
                    <div className="login-logo-icon">
                        <Printer size={26} color="#08090a" />
                    </div>
                    <span className="login-logo-text">
                        Invo<span className="login-logo-text-highlight">Print</span>
                    </span>
                </motion.div>

                {/* Hero text */}
                <motion.div
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="login-hero"
                >
                    <p className="login-hero-badge">
                        Enterprise Financial Infrastructure
                    </p>
                    <h1 className="login-hero-title">
                        Precision<br />
                        behind every<br />
                        <span className="login-hero-title-muted">transaction.</span>
                    </h1>
                    <p className="login-hero-description">
                        Trusted by industry leaders for mission-critical billing operations.
                    </p>
                </motion.div>

                {/* Trust badges */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="login-trust"
                >
                    <div className="login-trust-list">
                        {TRUST_BADGES.map((badge, i) => (
                            <div key={i} className="login-trust-item">
                                <CheckCircle size={14} color="#4b5563" />
                                <span className="login-trust-text">{badge}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* ── RIGHT PANEL: Clean White Form Side ──────────── */}
            <div className="login-right-panel">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35 }}
                    className="login-form-wrapper"
                >
                    {/* Card */}
                    <div className="login-card">
                        {/* Greeting */}
                        <div className="login-greeting">
                            <h2 className="login-greeting-title">
                                Hello again.
                            </h2>
                            <p className="login-greeting-subtitle">
                                Please enter your credentials to continue.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="login-form">
                            {/* Email */}
                            <div className="login-input-group">
                                <label className="login-label">
                                    Email Address
                                </label>
                                <div className="login-input-wrapper">
                                    <Mail size={18} className="login-input-icon" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="you@company.com"
                                        className="login-input"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="login-input-group">
                                <div className="login-label-row">
                                    <label className="login-label">
                                        Password
                                    </label>
                                    <button
                                        type="button"
                                        className="login-forgot-btn"
                                    >
                                        Forgot?
                                    </button>
                                </div>
                                <div className="login-input-wrapper">
                                    <Lock size={18} className="login-input-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••••"
                                        className="login-input login-input-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="login-password-toggle"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="login-submit-btn"
                            >
                                {isLoading
                                    ? <Loader2 size={22} className="login-spinner" />
                                    : <><span>Sign In to Terminal</span><ArrowRight size={20} /></>
                                }
                            </button>
                        </form>

                        {/* Security badge */}
                        <div className="login-security">
                            <ShieldCheck size={15} />
                            <span>Enterprise SSL Security</span>
                        </div>
                    </div>

                    <p className="login-footer">
                        New to InvoPrint?{' '}
                        <span className="login-footer-link">
                            Contact your Administrator
                        </span>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
