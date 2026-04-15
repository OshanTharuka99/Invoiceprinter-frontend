import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../api';
import {
    Users, UserPlus, Trash2, ShieldCheck, LogOut, Search,
    RefreshCw, LayoutDashboard, FileText, Settings,
    ChevronRight, Activity, Bell, X, Check, AlertCircle,
    TrendingUp, Shield, Crown, Edit3, Filter, Eye, EyeOff
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
                    fontSize: '1rem',
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: '600',
                },
            }
        );
        setTimeout(() => logout(), 1200);
    };

    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [sexFilter, setSexFilter] = useState('all');
    const [designationFilter, setDesignationFilter] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [activeNav, setActiveNav] = useState('users');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    
    // Modals
    const [addUserModal, setAddUserModal] = useState(false);
    const [editUserModal, setEditUserModal] = useState(false);
    
    // Form States
    const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', password: '', designation: '', role: 'user', sex: 'male', telephoneNumber: '' });
    const [editingUser, setEditingUser] = useState(null);
    
    // Password Visibility
    const [showAddPass, setShowAddPass] = useState(false);
    const [showEditPass, setShowEditPass] = useState(false);

    const showToast = (message, type = 'success') => {
        if (type === 'success') toast.success(message);
        else toast.error(message);
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

    const uniqueDesignations = [...new Set(users.map(u => u.designation).filter(Boolean))].sort();

    const handleDelete = async (targetUser) => {
        const isAdmin = user.role === 'admin';
        if (isAdmin && (targetUser.role === 'admin' || targetUser.role === 'root')) {
            showToast('Admins cannot delete other admins or root.', 'error');
            return;
        }
        if (targetUser._id === user._id) {
            showToast('You cannot delete your own account.', 'error');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete ${targetUser.firstName}?`)) return;
        try {
            await api.delete(`/users/${targetUser._id}`);
            setUsers(users.filter(u => u._id !== targetUser._id));
            showToast('User deleted successfully');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete user', 'error');
        }
    };

    const handleRoleUpdate = async (targetUser) => {
        const targetIsRoot = targetUser.role === 'root';
        const targetIsAdmin = targetUser.role === 'admin';
        const newRole = targetIsAdmin ? 'user' : 'admin';

        if (user.role === 'admin') {
            if (targetIsRoot) { showToast('Admins cannot modify root.', 'error'); return; }
            if (targetIsAdmin && newRole === 'user') { showToast('Admins cannot demote admins.', 'error'); return; }
        }
        if (targetIsRoot) { showToast('Root protected.', 'error'); return; }

        try {
            await api.patch(`/users/${targetUser._id}/role`, { role: newRole });
            setUsers(users.map(u => u._id === targetUser._id ? { ...u, role: newRole } : u));
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
            setNewUser({ firstName: '', lastName: '', email: '', password: '', designation: '', role: 'user', sex: 'male', telephoneNumber: '' });
            setShowAddPass(false); // Reset visibility
            showToast('User created successfully');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to create user', 'error');
        }
    };

    const openEditModal = (userToEdit) => {
        setEditingUser({ ...userToEdit, password: '' });
        setShowEditPass(false); // Reset visibility
        setEditUserModal(true);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            const updateData = { ...editingUser };
            if (!updateData.password) delete updateData.password;

            const res = await api.patch(`/users/${editingUser._id}`, updateData);
            setUsers(users.map(u => u._id === editingUser._id ? res.data.data.user : u));
            setEditUserModal(false);
            showToast('User updated successfully');
        } catch (err) {
            showToast(err.response?.data?.message || 'Update failed', 'error');
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            u.lastName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        const matchesSex = sexFilter === 'all' || u.sex === sexFilter;
        const matchesDesignation = designationFilter === 'all' || u.designation === designationFilter;
        return matchesSearch && matchesRole && matchesSex && matchesDesignation;
    });

    const stats = [
        { label: 'Total Users', value: users.length, icon: Users, sub: 'Registered accounts' },
        { label: 'Management', value: users.filter(u => u.role === 'admin' || u.role === 'root').length, icon: Shield, sub: 'Admins & Root' },
        { label: 'Active Now', value: users.length, icon: Activity, sub: 'Online sessions' },
        { label: 'Invoices', value: '—', icon: FileText, sub: 'System data' },
    ];

    const navItems = [
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'invoices', label: 'All Invoices', icon: FileText },
        { id: 'analytics', label: 'Analytics', icon: TrendingUp },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    const inputStyle = {
        width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px',
        padding: '0.85rem 1.25rem', color: '#0f172a', outline: 'none', fontSize: '1rem',
        fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s ease', boxSizing: 'border-box'
    };

    const filterSelectStyle = {
        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px',
        padding: '0.6rem 1rem', color: '#0f172a', outline: 'none', fontSize: '0.95rem',
        fontFamily: "'Outfit', sans-serif", cursor: 'pointer', minWidth: '140px'
    };

    const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' };

    const primaryButtonStyle = {
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#fff', border: 'none', borderRadius: '14px', padding: '1rem 1.5rem',
        cursor: 'pointer', fontWeight: 700, fontSize: '1.05rem', fontFamily: "'Outfit', sans-serif",
        letterSpacing: '0.02em', boxShadow: '0 4px 12px rgba(15,23,42,0.15)',
        transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
    };

    const secondaryButtonStyle = {
        background: '#fff', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '14px',
        padding: '1rem 1.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '1.05rem',
        fontFamily: "'Outfit', sans-serif", transition: 'all 0.3s ease'
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Outfit', sans-serif", color: '#0f172a' }}>

            {/* Sidebar */}
            <motion.aside animate={{ width: sidebarOpen ? 280 : 80 }} transition={{ duration: 0.3 }} style={{ background: '#08090a', color: '#fff', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', flexShrink: 0, boxShadow: '4px 0 24px rgba(0,0,0,0.08)' }}>
                <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 44, height: 44, background: '#fff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={24} color="#08090a" /></div>
                    {sidebarOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>InvoPrint</div>
                        <div style={{ fontSize: '0.75rem', color: '#4b5563', fontWeight: 700, letterSpacing: '0.1em' }}>{user?.role === 'root' ? 'ROOT ACCESS' : 'ADMIN CONSOLE'}</div>
                    </motion.div>}
                </div>
                <nav style={{ padding: '1.5rem 0.75rem', flex: 1 }}>
                    {navItems.map((item) => (
                        <button key={item.id} onClick={() => setActiveNav(item.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem 1rem', borderRadius: '12px', marginBottom: '0.4rem', border: 'none', cursor: 'pointer', background: activeNav === item.id ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeNav === item.id ? '#fff' : '#4b5563', fontFamily: "'Outfit', sans-serif", fontSize: '1.05rem', fontWeight: activeNav === item.id ? 700 : 500, transition: 'all 0.2s' }}>
                            <item.icon size={20} />
                            {sidebarOpen && <span>{item.label}</span>}
                        </button>
                    ))}
                </nav>
                <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem' }}>
                        <div style={{ width: 44, height: 44, background: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 800, color: '#08090a' }}>{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
                        {sidebarOpen && <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{user?.firstName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#4b5563', textTransform: 'uppercase', fontWeight: 600 }}>{user?.role}</div>
                        </div>}
                        {sidebarOpen && <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563' }}><LogOut size={18} /></button>}
                    </div>
                </div>
            </motion.aside>

            <div style={{ flex: 1, overflow: 'auto' }}>
                <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(241,245,249,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #e2e8f0', padding: '0 2.5rem', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 10px', cursor: 'pointer', color: '#64748b' }}><LayoutDashboard size={18} /></button>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>User Management</h2>
                    </div>
                    <button onClick={() => setAddUserModal(true)} 
                        style={{ ...primaryButtonStyle, padding: '0.65rem 1.5rem', fontSize: '0.95rem' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(15,23,42,0.25)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.15)'; }}
                    >
                        <UserPlus size={18} /> Add User
                    </button>
                </header>

                <main style={{ padding: '3rem 2.5rem', maxWidth: 1440, margin: '0 auto' }}>
                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                        {stats.map((stat, i) => (
                            <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</span>
                                    <stat.icon size={20} color="#64748b" />
                                </div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{stat.value}</div>
                                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>{stat.sub}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <div style={{ padding: '1.75rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem 1.25rem 0.75rem 3rem', color: '#0f172a', outline: 'none', fontSize: '1rem', width: 320, fontFamily: "'Outfit', sans-serif" }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Filter size={18} color="#64748b" />
                                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={filterSelectStyle}><option value="all">All Roles</option><option value="user">Users</option><option value="admin">Admins</option><option value="root">Root</option></select>
                                    <select value={designationFilter} onChange={e => setDesignationFilter(e.target.value)} style={filterSelectStyle}><option value="all">All Designations</option>{uniqueDesignations.map(d => <option key={d} value={d}>{d}</option>)}</select>
                                    <select value={sexFilter} onChange={e => setSexFilter(e.target.value)} style={filterSelectStyle}><option value="all">All Genders</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select>
                                </div>
                                <div style={{ width: '1px', height: '32px', background: '#e2e8f0' }}></div>
                                <button onClick={fetchUsers} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer' }}><RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /></button>
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                                        {['User', 'Designation', 'Role', 'Status', 'Actions'].map((h, i) => (
                                            <th key={i} style={{ padding: '1.25rem 2rem', textAlign: i === 4 ? 'right' : 'left', color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {!isLoading && filteredUsers.map((u) => {
                                            const isTargetRoot = u.role === 'root';
                                            const isTargetAdmin = u.role === 'admin';
                                            let canManage = true;
                                            if (user.role === 'admin' && (isTargetAdmin || isTargetRoot)) canManage = false;
                                            if (isTargetRoot) canManage = false; 
                                            const canDelete = canManage && u._id !== user._id;

                                            return (
                                                <tr key={u._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                                    <td style={{ padding: '1.25rem 2rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                                            <div style={{ width: 44, height: 44, background: isTargetRoot ? '#fffbeb' : '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, color: isTargetRoot ? '#d97706' : '#64748b' }}>
                                                                {isTargetRoot ? <Crown size={20} /> : (u.firstName?.[0] + (u.lastName?.[0] || ''))}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.05rem' }}>{u.firstName} {u.lastName}</div>
                                                                <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{u.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1.25rem 2rem', color: '#64748b', fontWeight: 500 }}>{u.designation || '—'}</td>
                                                    <td style={{ padding: '1.25rem 2rem' }}>
                                                        <span style={{ padding: '4px 12px', borderRadius: '7px', fontSize: '0.8rem', fontWeight: 800, background: isTargetRoot ? '#fffbeb' : isTargetAdmin ? '#0f172a' : '#f1f5f9', color: isTargetRoot ? '#b45309' : isTargetAdmin ? '#fff' : '#64748b', letterSpacing: '0.05em' }}>{u.role.toUpperCase()}</span>
                                                    </td>
                                                    <td style={{ padding: '1.25rem 2rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.4)' }}></div>
                                                            <span style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 500 }}>Active</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                                            <button onClick={() => openEditModal(u)} disabled={!canManage} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px', cursor: canManage ? 'pointer' : 'not-allowed', opacity: canManage ? 1 : 0.3 }}><Edit3 size={16} /></button>
                                                            <button onClick={() => handleRoleUpdate(u)} disabled={!canManage} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px', cursor: canManage ? 'pointer' : 'not-allowed', opacity: canManage ? 1 : 0.3 }}><ShieldCheck size={16} /></button>
                                                            <button onClick={() => handleDelete(u)} disabled={!canDelete} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px', cursor: canDelete ? 'pointer' : 'not-allowed', opacity: canDelete ? 1 : 0.3 }}><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {/* Add User Modal */}
            <AnimatePresence>
                {addUserModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAddUserModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '32px', padding: '3rem', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 60px rgba(0,0,0,0.2)' }}>
                            <div style={{ marginBottom: '2.5rem' }}>
                                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Create Account</h2>
                            </div>
                            <form onSubmit={handleAddUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div style={{ gridColumn: 'span 1' }}> <label style={labelStyle}>First Name</label> <input type="text" placeholder="John" value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} style={inputStyle} required /> </div>
                                <div style={{ gridColumn: 'span 1' }}> <label style={labelStyle}>Last Name</label> <input type="text" placeholder="Doe" value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} style={inputStyle} required /> </div>
                                <div style={{ gridColumn: 'span 2' }}> <label style={labelStyle}>Email Address</label> <input type="email" placeholder="john@example.com" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} style={inputStyle} required /> </div>
                                <div style={{ gridColumn: 'span 2' }}> 
                                    <label style={labelStyle}>Temporary Password</label> 
                                    <div style={{ position: 'relative' }}>
                                        <input type={showAddPass ? 'text' : 'password'} placeholder="••••••••" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} style={inputStyle} required /> 
                                        <button type="button" onClick={() => setShowAddPass(!showAddPass)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                            {showAddPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div style={{ gridColumn: 'span 1' }}> <label style={labelStyle}>Designation</label> <input type="text" placeholder="Manager" value={newUser.designation} onChange={e => setNewUser({...newUser, designation: e.target.value})} style={inputStyle} required /> </div>
                                <div style={{ gridColumn: 'span 1' }}> <label style={labelStyle}>Phone Number</label> <input type="text" placeholder="077 XXXXXXX" value={newUser.telephoneNumber} onChange={e => setNewUser({...newUser, telephoneNumber: e.target.value})} style={inputStyle} /> </div>
                                <div style={{ gridColumn: 'span 1' }}> 
                                    <label style={labelStyle}>Gender</label> 
                                    <select value={newUser.sex} onChange={e => setNewUser({...newUser, sex: e.target.value})} style={inputStyle}>
                                        <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                                    </select>
                                </div>
                                <div style={{ gridColumn: 'span 1' }}> 
                                    <label style={labelStyle}>Access Level</label> 
                                    <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} style={inputStyle}>
                                        <option value="user">User</option><option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1.25rem', marginTop: '1.5rem' }}>
                                    <button type="submit" style={primaryButtonStyle}>Assign & Create</button>
                                    <button type="button" onClick={() => setAddUserModal(false)} style={secondaryButtonStyle}>Cancel</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit User Modal */}
            <AnimatePresence>
                {editUserModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditUserModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '32px', padding: '3rem', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 60px rgba(0,0,0,0.2)' }}>
                            <div style={{ marginBottom: '2.5rem' }}>
                                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Edit Profile</h2>
                            </div>
                            <form onSubmit={handleUpdateUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div style={{ gridColumn: 'span 1' }}> <label style={labelStyle}>First Name</label> <input type="text" value={editingUser.firstName} onChange={e => setEditingUser({...editingUser, firstName: e.target.value})} style={inputStyle} required /> </div>
                                <div style={{ gridColumn: 'span 1' }}> <label style={labelStyle}>Last Name</label> <input type="text" value={editingUser.lastName} onChange={e => setEditingUser({...editingUser, lastName: e.target.value})} style={inputStyle} required /> </div>
                                <div style={{ gridColumn: 'span 2' }}> <label style={labelStyle}>Email Address</label> <input type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} style={inputStyle} required /> </div>
                                <div style={{ gridColumn: 'span 1' }}> <label style={labelStyle}>Designation</label> <input type="text" value={editingUser.designation} onChange={e => setEditingUser({...editingUser, designation: e.target.value})} style={inputStyle} required /> </div>
                                <div style={{ gridColumn: 'span 1' }}> <label style={labelStyle}>Phone Number</label> <input type="text" value={editingUser.telephoneNumber || ''} onChange={e => setEditingUser({...editingUser, telephoneNumber: e.target.value})} style={inputStyle} /> </div>
                                <div style={{ gridColumn: 'span 2' }}> 
                                    <label style={labelStyle}>Sex</label> 
                                    <select value={editingUser.sex} onChange={e => setEditingUser({...editingUser, sex: e.target.value})} style={inputStyle}>
                                        <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                                    </select>
                                </div>
                                <div style={{ gridColumn: 'span 2', border: '1px dashed #e2e8f0', borderRadius: '16px', padding: '1.5rem', background: '#f8fafc' }}>
                                    <label style={{ ...labelStyle, color: '#0f172a' }}>Update Password (Optional)</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type={showEditPass ? 'text' : 'password'} placeholder="New Secure Password" value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} style={{ ...inputStyle, background: '#fff' }} />
                                        <button type="button" onClick={() => setShowEditPass(!showEditPass)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                            {showEditPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1.25rem', marginTop: '1.5rem' }}>
                                    <button type="submit" style={primaryButtonStyle}>Save Changes</button>
                                    <button type="button" onClick={() => setEditUserModal(false)} style={secondaryButtonStyle}>Cancel</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminPortal;
