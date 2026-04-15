import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../api';
import {
    Users, UserPlus, Trash2, ShieldCheck, LogOut, Search,
    RefreshCw, LayoutDashboard, FileText, Settings,
    ChevronRight, Activity, Bell, X, Check, AlertCircle,
    TrendingUp, Shield, MoreHorizontal
} from 'lucide-react';

const AdminPortal = () => {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        toast(
            `Goodbye, ${user?.firstName}! See you soon. 👋`,
            {
                duration: 3000,
                icon: '🔒',
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
            }
        );
        setTimeout(() => logout(), 1200);
    };
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [activeNav, setActiveNav] = useState('users');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [toast, setToast] = useState(null);
    const [addUserModal, setAddUserModal] = useState(false);
    const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', password: '', designation: '', role: 'user' });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/users');
            setUsers(res.data.data.users);
        } catch (err) {
            showToast('Failed to fetch users', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.delete(`/users/${id}`);
            setUsers(users.filter(u => u._id !== id));
            showToast('User deleted successfully');
        } catch (err) {
            showToast('Failed to delete user', 'error');
        }
    };

    const handleRoleUpdate = async (id, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        try {
            await api.patch(`/users/${id}/role`, { role: newRole });
            setUsers(users.map(u => u._id === id ? { ...u, role: newRole } : u));
            showToast(`Role updated to ${newRole.toUpperCase()}`);
        } catch (err) {
            showToast('Failed to update role', 'error');
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/users', newUser);
            setUsers([...users, res.data.data.user]);
            setAddUserModal(false);
            setNewUser({ firstName: '', lastName: '', email: '', password: '', designation: '', role: 'user' });
            showToast('New user created successfully');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to create user', 'error');
        }
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.lastName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = [
        { label: 'Total Users', value: users.length, icon: Users, sub: 'Registered accounts' },
        { label: 'Admins', value: users.filter(u => u.role === 'admin').length, icon: Shield, sub: 'With full access' },
        { label: 'Active Now', value: users.length, icon: Activity, sub: 'Online sessions' },
        { label: 'Invoices', value: '—', icon: FileText, sub: 'Across all users' },
    ];

    const navItems = [
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'invoices', label: 'All Invoices', icon: FileText },
        { id: 'analytics', label: 'Analytics', icon: TrendingUp },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    const inputStyle = {
        width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px',
        padding: '0.7rem 1rem', color: '#0f172a', outline: 'none', fontSize: '0.875rem',
        fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s ease', boxSizing: 'border-box'
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Outfit', sans-serif", color: '#0f172a' }}>

            {/* ── Toast ─────────────────────────────── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        style={{
                            position: 'fixed', top: '1.5rem', left: '50%', zIndex: 9999,
                            background: '#fff', border: `1px solid ${toast.type === 'error' ? '#fecdd3' : '#d1fae5'}`,
                            color: toast.type === 'error' ? '#e11d48' : '#059669',
                            padding: '0.875rem 1.5rem', borderRadius: '14px',
                            display: 'flex', alignItems: 'center', gap: '0.6rem',
                            fontSize: '0.875rem', fontWeight: 600,
                            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                        }}
                    >
                        {toast.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Sidebar ───────────────────────────── */}
            <motion.aside
                animate={{ width: sidebarOpen ? 256 : 68 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                style={{
                    background: '#08090a', color: '#fff',
                    display: 'flex', flexDirection: 'column',
                    position: 'sticky', top: 0, height: '100vh',
                    overflow: 'hidden', flexShrink: 0,
                    boxShadow: '4px 0 24px rgba(0,0,0,0.08)'
                }}
            >
                {/* Brand */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div style={{ width: 40, height: 40, background: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ShieldCheck size={22} color="#08090a" />
                    </div>
                    {sidebarOpen && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                            <div style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '-0.02em' }}>InvoPrint</div>
                            <div style={{ fontSize: '0.68rem', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Admin Console</div>
                        </motion.div>
                    )}
                </div>

                {/* Nav Items */}
                <nav style={{ padding: '1rem 0.625rem', flex: 1 }}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = activeNav === item.id;
                        return (
                            <button key={item.id} onClick={() => setActiveNav(item.id)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center',
                                    gap: '0.75rem', padding: '0.7rem 0.875rem', borderRadius: '10px',
                                    marginBottom: '0.2rem', border: 'none', cursor: 'pointer',
                                    background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    color: active ? '#fff' : '#4b5563',
                                    fontFamily: "'Outfit', sans-serif", fontSize: '0.875rem',
                                    fontWeight: active ? 600 : 400, transition: 'all 0.2s ease', textAlign: 'left'
                                }}
                                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#9ca3af'; } }}
                                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4b5563'; } }}
                            >
                                <Icon size={17} style={{ flexShrink: 0 }} />
                                {sidebarOpen && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>{item.label}</motion.span>}
                                {active && sidebarOpen && <ChevronRight size={13} style={{ marginLeft: 'auto', opacity: 0.4 }} />}
                            </button>
                        );
                    })}
                </nav>

                {/* User profile at bottom */}
                <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem' }}>
                        <div style={{ width: 36, height: 36, background: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700, color: '#08090a', flexShrink: 0 }}>
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                        {sidebarOpen && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.firstName} {user?.lastName}</div>
                                <div style={{ fontSize: '0.7rem', color: '#4b5563', fontWeight: 500 }}>ADMIN</div>
                            </motion.div>
                        )}
                        {sidebarOpen && (
                            <button onClick={handleLogout}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', padding: '4px', borderRadius: '6px', display: 'flex', transition: 'color 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}
                                title="Sign Out"
                            >
                                <LogOut size={15} />
                            </button>
                        )}
                    </div>
                </div>
            </motion.aside>

            {/* ── Main Area ─────────────────────────── */}
            <div style={{ flex: 1, overflow: 'auto' }}>

                {/* Top Bar */}
                <header style={{
                    position: 'sticky', top: 0, zIndex: 10,
                    background: 'rgba(241,245,249,0.85)', backdropFilter: 'blur(16px)',
                    borderBottom: '1px solid #e2e8f0',
                    padding: '0 2rem', height: 64,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => setSidebarOpen(!sidebarOpen)}
                            style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 8px', cursor: 'pointer', color: '#64748b', display: 'flex', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'all 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = '#0f172a'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                        >
                            <LayoutDashboard size={15} />
                        </button>
                        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.82rem' }}>
                            <span style={{ color: '#94a3b8' }}>Admin Console</span>
                            <span style={{ color: '#cbd5e1', margin: '0 0.25rem' }}>/</span>
                            <span style={{ color: '#0f172a', fontWeight: 600 }}>User Management</span>
                        </nav>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <button style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 8px', cursor: 'pointer', color: '#64748b', display: 'flex', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                            <Bell size={15} />
                            <span style={{ position: 'absolute', top: 5, right: 5, width: 6, height: 6, background: '#0f172a', borderRadius: '50%', border: '1.5px solid #f1f5f9' }}></span>
                        </button>
                        <button onClick={() => setAddUserModal(true)}
                            style={{
                                background: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px',
                                padding: '0.55rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, fontFamily: "'Outfit', sans-serif",
                                transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(15,23,42,0.2)'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.transform = 'none'; }}
                        >
                            <UserPlus size={15} /> Add User
                        </button>
                    </div>
                </header>

                <main style={{ padding: '2.5rem 2rem', maxWidth: 1280, margin: '0 auto' }}>

                    {/* Page Title */}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
                        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, color: '#0f172a' }}>User Management</h1>
                        <p style={{ color: '#64748b', marginTop: '0.35rem', fontSize: '0.9rem', margin: '0.35rem 0 0' }}>{users.length} registered accounts across the system</p>
                    </motion.div>

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        {stats.map((stat, i) => {
                            const Icon = stat.icon;
                            return (
                                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                                    style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'all 0.2s ease', cursor: 'default' }}
                                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none'; }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{stat.label}</span>
                                        <div style={{ width: 34, height: 34, background: '#f1f5f9', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Icon size={16} color="#64748b" />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#0f172a' }}>{stat.value}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem' }}>{stat.sub}</div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* User Table Card */}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

                        {/* Controls */}
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input type="text" placeholder="Search users..." value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.55rem 1rem 0.55rem 2.5rem', color: '#0f172a', outline: 'none', fontSize: '0.875rem', width: 260, fontFamily: "'Outfit', sans-serif", transition: 'border-color 0.2s' }}
                                    onFocus={e => e.target.style.borderColor = '#0f172a'}
                                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{filteredUsers.length} results</span>
                                <button onClick={fetchUsers}
                                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 8px', cursor: 'pointer', color: '#64748b', display: 'flex', transition: 'all 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = '#0f172a'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                                >
                                    <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                                        {['User', 'Designation', 'Role', 'Status', 'Actions'].map((h, i) => (
                                            <th key={i} style={{ padding: '0.75rem 1.5rem', textAlign: i === 4 ? 'right' : 'left', color: '#94a3b8', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {isLoading ? (
                                            [1, 2, 3, 4].map(i => (
                                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    {[1, 2, 3, 4, 5].map(j => (
                                                        <td key={j} style={{ padding: '1rem 1.5rem' }}>
                                                            <div style={{ height: 14, background: '#f1f5f9', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }}></div>
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))
                                        ) : filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                                                    <Users size={28} style={{ margin: '0 auto 0.875rem', display: 'block', opacity: 0.3 }} />
                                                    No users found matching your search.
                                                </td>
                                            </tr>
                                        ) : filteredUsers.map((u, idx) => (
                                            <motion.tr key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                                                style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s', cursor: 'default' }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <td style={{ padding: '0.875rem 1.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                                                        <div style={{
                                                            width: 36, height: 36,
                                                            background: u._id === user._id ? '#0f172a' : '#f1f5f9',
                                                            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '0.72rem', fontWeight: 700,
                                                            color: u._id === user._id ? '#fff' : '#64748b',
                                                            flexShrink: 0
                                                        }}>
                                                            {u.firstName?.[0]}{u.lastName?.[0]}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>
                                                                {u.firstName} {u.lastName}
                                                                {u._id === user._id && <span style={{ fontSize: '0.68rem', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '1px 7px', borderRadius: '5px', color: '#64748b', marginLeft: 6 }}>You</span>}
                                                            </div>
                                                            <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '1px' }}>{u.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.875rem 1.5rem', color: '#64748b', fontSize: '0.85rem' }}>{u.designation || '—'}</td>
                                                <td style={{ padding: '0.875rem 1.5rem' }}>
                                                    <span style={{
                                                        padding: '3px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em',
                                                        background: u.role === 'admin' ? '#0f172a' : '#f1f5f9',
                                                        color: u.role === 'admin' ? '#fff' : '#64748b',
                                                        border: '1px solid transparent'
                                                    }}>
                                                        {u.role === 'admin' ? 'ADMIN' : 'USER'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.875rem 1.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.5)' }}></div>
                                                        <span style={{ color: '#64748b', fontSize: '0.82rem' }}>Active</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.875rem 1.5rem', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.375rem' }}>
                                                        <button onClick={() => handleRoleUpdate(u._id, u.role)}
                                                            title={u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                                                            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 8px', cursor: 'pointer', color: '#64748b', display: 'flex', transition: 'all 0.2s' }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#0f172a'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                                        ><ShieldCheck size={14} /></button>
                                                        <button onClick={() => handleDelete(u._id)}
                                                            disabled={u._id === user?._id}
                                                            title="Delete User"
                                                            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 8px', cursor: u._id === user?._id ? 'not-allowed' : 'pointer', color: '#64748b', display: 'flex', transition: 'all 0.2s', opacity: u._id === user?._id ? 0.35 : 1 }}
                                                            onMouseEnter={e => { if (u._id !== user?._id) { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.color = '#e11d48'; e.currentTarget.style.borderColor = '#fecdd3'; } }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                                        ><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </main>
            </div>

            {/* ── Add User Modal ─────────────────────── */}
            <AnimatePresence>
                {addUserModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={e => { if (e.target === e.currentTarget) setAddUserModal(false); }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                        <motion.div initial={{ scale: 0.96, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 12 }}
                            style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '28px', padding: '2.5rem', width: '100%', maxWidth: 460, boxShadow: '0 32px 64px rgba(0,0,0,0.15)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a' }}>Add New User</h2>
                                    <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>Create a new system account</p>
                                </div>
                                <button onClick={() => setAddUserModal(false)}
                                    style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 8px', cursor: 'pointer', color: '#64748b', display: 'flex', transition: 'all 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                                ><X size={16} /></button>
                            </div>
                            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {[
                                    { label: 'First Name', key: 'firstName', type: 'text', placeholder: 'John' },
                                    { label: 'Last Name', key: 'lastName', type: 'text', placeholder: 'Doe' },
                                    { label: 'Email', key: 'email', type: 'email', placeholder: 'john@company.com' },
                                    { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
                                    { label: 'Designation', key: 'designation', type: 'text', placeholder: 'e.g. Sales Manager' },
                                ].map(({ label, key, type, placeholder }) => (
                                    <div key={key}>
                                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
                                        <input type={type} required placeholder={placeholder} value={newUser[key]} onChange={e => setNewUser({ ...newUser, [key]: e.target.value })}
                                            style={inputStyle}
                                            onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(15,23,42,0.06)'; }}
                                            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                                        />
                                    </div>
                                ))}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Role</label>
                                    <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                        style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <button type="submit"
                                    style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.9rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Outfit', sans-serif", marginTop: '0.5rem', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(15,23,42,0.2)' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.transform = 'none'; }}
                                >
                                    Create Account
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminPortal;
