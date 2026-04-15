import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../api';
import {
    Users, UserPlus, Trash2, ShieldCheck, LogOut, Search,
    RefreshCw, LayoutDashboard, FileText, Settings,
    ChevronRight, Activity, Bell, X, Check, AlertCircle,
    TrendingUp, Shield, Crown, Edit3, Filter, Eye, EyeOff,
    CheckCircle2, ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';

const AdminPortal = () => {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        toast.success(`Logging out...`);
        logout();
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
    const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
    const [roleConfirmModal, setRoleConfirmModal] = useState(false);
    
    // Form States
    const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', password: '', designation: '', role: 'user', sex: 'male', telephoneNumber: '' });
    const [editingUser, setEditingUser] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);
    const [userToPromote, setUserToPromote] = useState(null);
    const [typedConfirmName, setTypedConfirmName] = useState('');
    
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

    const openDeleteModal = (targetUser) => {
        const isAdmin = user.role === 'admin';
        if (isAdmin && (targetUser.role === 'admin' || targetUser.role === 'root')) {
            showToast('Admins cannot delete other admins or root.', 'error');
            return;
        }
        if (targetUser._id === user._id) {
            showToast('You cannot delete your own account.', 'error');
            return;
        }

        setUserToDelete(targetUser);
        setTypedConfirmName('');
        setDeleteConfirmModal(true);
    };

    const handleDelete = async () => {
        if (!userToDelete || typedConfirmName !== userToDelete.firstName) return;

        try {
            await api.delete(`/users/${userToDelete._id}`);
            setUsers(users.filter(u => u._id !== userToDelete._id));
            setDeleteConfirmModal(false);
            setUserToDelete(null);
            showToast('User permanently deleted');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete user', 'error');
        }
    };

    const openRoleConfirmModal = (targetUser) => {
        const targetIsRoot = targetUser.role === 'root';
        const targetIsAdmin = targetUser.role === 'admin';
        const nextRole = targetIsAdmin ? 'user' : 'admin';

        if (user.role === 'admin') {
            if (targetIsRoot) { showToast('Admins cannot modify root.', 'error'); return; }
            if (targetIsAdmin && nextRole === 'user') { showToast('Admins cannot demote admins.', 'error'); return; }
        }
        if (targetIsRoot) { showToast('Root protected.', 'error'); return; }

        setUserToPromote(targetUser);
        setRoleConfirmModal(true);
    };

    const handleRoleUpdate = async () => {
        if (!userToPromote) return;
        const newRole = userToPromote.role === 'admin' ? 'user' : 'admin';

        try {
            await api.patch(`/users/${userToPromote._id}/role`, { role: newRole });
            setUsers(users.map(u => u._id === userToPromote._id ? { ...u, role: newRole } : u));
            setRoleConfirmModal(false);
            setUserToPromote(null);
            showToast(`Permission updated to ${newRole.toUpperCase()}`);
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
            setShowAddPass(false); 
            showToast('User created successfully');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to create user', 'error');
        }
    };

    const openEditModal = (userToEdit) => {
        setEditingUser({ ...userToEdit, password: '' });
        setShowEditPass(false); 
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
        fontFamily: "'Outfit', sans-serif", transition: 'border-color 0.1s, box-shadow 0.1s', boxSizing: 'border-box'
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
        transition: 'transform 0.1s, background 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
    };

    const secondaryButtonStyle = {
        background: '#fff', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '14px',
        padding: '1rem 1.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '1.05rem',
        fontFamily: "'Outfit', sans-serif", transition: 'transform 0.1s, border-color 0.1s'
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Outfit', sans-serif", color: '#0f172a' }}>

            {/* Sidebar */}
            <motion.aside animate={{ width: sidebarOpen ? 280 : 80 }} transition={{ duration: 0.2 }} style={{ background: '#08090a', color: '#fff', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', flexShrink: 0, boxShadow: '4px 0 24px rgba(0,0,0,0.08)' }}>
                <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 44, height: 44, background: '#fff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={24} color="#08090a" /></div>
                    {sidebarOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>InvoPrint</div>
                        <div style={{ fontSize: '0.75rem', color: '#4b5563', fontWeight: 700, letterSpacing: '0.1em' }}>{user?.role === 'root' ? 'ROOT ACCESS' : 'ADMIN CONSOLE'}</div>
                    </motion.div>}
                </div>
                <nav style={{ padding: '1.5rem 0.75rem', flex: 1 }}>
                    {navItems.map((item) => (
                        <motion.button whileTap={{ scale: 0.97 }} key={item.id} onClick={() => setActiveNav(item.id)} title={item.label} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem 1rem', borderRadius: '12px', marginBottom: '0.4rem', border: 'none', cursor: 'pointer', background: activeNav === item.id ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeNav === item.id ? '#fff' : '#4b5563', fontFamily: "'Outfit', sans-serif", fontSize: '1.05rem', fontWeight: activeNav === item.id ? 700 : 500, transition: 'background 0.1s' }}>
                            <item.icon size={20} />
                            {sidebarOpen && <span>{item.label}</span>}
                        </motion.button>
                    ))}
                </nav>
            </motion.aside>

            <div style={{ flex: 1, overflow: 'auto' }}>
                <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(241,245,249,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #e2e8f0', padding: '0 2.5rem', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle Sidebar" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 10px', cursor: 'pointer', color: '#64748b' }}><LayoutDashboard size={18} /></button>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>User Management</h2>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setAddUserModal(true)} title="Create New Account" style={{ ...primaryButtonStyle, padding: '0.65rem 1.5rem', fontSize: '0.95rem' }}>
                        <UserPlus size={18} /> Add User
                    </motion.button>
                </header>

                <main style={{ padding: '3rem 2.5rem', maxWidth: 1440, margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                        {stats.map((stat, i) => (
                            <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
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
                                <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem 1.25rem 0.75rem 3rem', color: '#0f172a', outline: 'none', fontSize: '1.05rem', width: 340, fontFamily: "'Outfit', sans-serif" }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Filter size={18} color="#64748b" />
                                    <select value={roleFilter} title="Filter by Role" onChange={e => setRoleFilter(e.target.value)} style={filterSelectStyle}><option value="all">All Roles</option><option value="user">Users</option><option value="admin">Admins</option><option value="root">Root</option></select>
                                    <select value={designationFilter} title="Filter by Designation" onChange={e => setDesignationFilter(e.target.value)} style={filterSelectStyle}><option value="all">All Designations</option>{uniqueDesignations.map(d => <option key={d} value={d}>{d}</option>)}</select>
                                    <select value={sexFilter} title="Filter by Gender" onChange={e => setSexFilter(e.target.value)} style={filterSelectStyle}><option value="all">All Genders</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select>
                                </div>
                                <div style={{ width: '1px', height: '32px', background: '#e2e8f0' }}></div>
                                <button onClick={fetchUsers} title="Refresh Table" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer' }}><RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /></button>
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1.05rem' }}>
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
                                                <tr key={u._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }}>
                                                    <td style={{ padding: '1.25rem 2rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                                            <div style={{ width: 44, height: 44, background: isTargetRoot ? '#fffbeb' : '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, color: isTargetRoot ? '#d97706' : '#64748b' }}>
                                                                {isTargetRoot ? <Crown size={20} /> : (u.firstName?.[0] + (u.lastName?.[0] || ''))}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>{u.firstName} {u.lastName}</div>
                                                                <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{u.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1.25rem 2rem', color: '#64748b', fontWeight: 600 }}>{u.designation || '—'}</td>
                                                    <td style={{ padding: '1.25rem 2rem' }}>
                                                        <span style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800, background: isTargetRoot ? '#fffbeb' : isTargetAdmin ? '#0f172a' : '#f1f5f9', color: isTargetRoot ? '#b45309' : isTargetAdmin ? '#fff' : '#64748b', letterSpacing: '0.05em' }}>{u.role.toUpperCase()}</span>
                                                    </td>
                                                    <td style={{ padding: '1.25rem 2rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.4)' }}></div>
                                                            <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>Active</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.875rem' }}>
                                                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEditModal(u)} title="Edit Employee Details" disabled={!canManage} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px', cursor: canManage ? 'pointer' : 'not-allowed', opacity: canManage ? 1 : 0.3 }}><Edit3 size={18} /></motion.button>
                                                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => openRoleConfirmModal(u)} title={u.role === 'admin' ? "Demote to User" : "Promote to Admin"} disabled={!canManage} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px', cursor: canManage ? 'pointer' : 'not-allowed', opacity: canManage ? 1 : 0.3 }}><ShieldCheck size={18} /></motion.button>
                                                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => openDeleteModal(u)} title="Delete Employee Account" disabled={!canDelete} style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '10px', padding: '8px', cursor: canDelete ? 'pointer' : 'not-allowed', opacity: canDelete ? 1 : 0.3, color: '#ef4444' }}><Trash2 size={18} /></motion.button>
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

            {/* Role Confirmation Modal */}
            <AnimatePresence mode="wait">
                {roleConfirmModal && userToPromote && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={() => setRoleConfirmModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
                        <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} transition={{ duration: 0.15 }} onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '32px', padding: '3.5rem', width: '100%', maxWidth: 520, boxShadow: '0 40px 80px rgba(0,0,0,0.3)', textAlign: 'center' }}>
                            <div style={{ width: 80, height: 80, background: '#f1f5f9', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                                <ShieldCheck size={40} color="#0f172a" />
                            </div>
                            <h2 style={{ margin: '0 0 1rem', color: '#0f172a', fontSize: '2rem', fontWeight: 800 }}>Update Permissions?</h2>
                            <p style={{ color: '#64748b', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                                You are about to {userToPromote.role === 'admin' ? <strong style={{color:'#ef4444'}}>demote</strong> : <strong style={{color:'#10b981'}}>promote</strong>} <strong>{userToPromote.firstName} {userToPromote.lastName}</strong>. 
                                <br/>Their access level will change to <strong>{userToPromote.role === 'admin' ? 'USER' : 'ADMIN'}</strong>.
                            </p>
                            
                            <div style={{ display: 'flex', gap: '1.25rem' }}>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={handleRoleUpdate} style={primaryButtonStyle}>
                                    Confirm Change
                                </motion.button>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setRoleConfirmModal(false)} style={{ ...secondaryButtonStyle, flex: 1 }}>
                                    Cancel
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal (Already exists, ensures Tooltips and consistency) */}
            <AnimatePresence mode="wait">
                {deleteConfirmModal && userToDelete && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={() => setDeleteConfirmModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
                        <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} transition={{ duration: 0.15 }} onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '32px', padding: '3.5rem', width: '100%', maxWidth: 520, boxShadow: '0 40px 80px rgba(0,0,0,0.3)', textAlign: 'center' }}>
                            <div style={{ width: 80, height: 80, background: '#fef2f2', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                                <AlertCircle size={40} color="#ef4444" />
                            </div>
                            <h2 style={{ margin: '0 0 1rem', color: '#0f172a', fontSize: '2rem', fontWeight: 800 }}>Permanent Deletion</h2>
                            <p style={{ color: '#64748b', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                                This action <span style={{ color: '#ef4444', fontWeight: 700 }}>cannot be undone</span>. All data for <strong>{userToDelete.firstName}</strong> will be lost.
                            </p>
                            
                            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
                                <label style={{ ...labelStyle, color: '#475569', marginBottom: '0.75rem', textAlign: 'left' }}>Type name to confirm: <span style={{ color: '#0f172a', fontWeight: 900 }}>{userToDelete.firstName}</span></label>
                                <input type="text" autoFocus placeholder={userToDelete.firstName} value={typedConfirmName} onChange={e => setTypedConfirmName(e.target.value)} style={{ ...inputStyle, textAlign: 'center', fontWeight: 800 }} />
                            </div>

                            <div style={{ display: 'flex', gap: '1.25rem' }}>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={handleDelete} disabled={typedConfirmName !== userToDelete.firstName} style={{ ...primaryButtonStyle, flex: 2, background: typedConfirmName === userToDelete.firstName ? '#ef4444' : '#f1f5f9', color: typedConfirmName === userToDelete.firstName ? '#fff' : '#94a3b8' }}>Confirm Deletion</motion.button>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setDeleteConfirmModal(false)} style={{ ...secondaryButtonStyle, flex: 1 }}>Cancel</motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Other modals (Add/Edit) remain unchanged logic-wise but now benefit from snappy response */}
            {/* Add User Modal */}
            <AnimatePresence mode="wait">
                {addUserModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={() => setAddUserModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} transition={{ duration: 0.15 }} onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '32px', padding: '3rem', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 60px rgba(0,0,0,0.2)' }}>
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
                                            {showAddPass ? <EyeOff size={20} /> : <Eye size={20} />}
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
                                    <motion.button whileTap={{ scale: 0.95 }} type="submit" style={primaryButtonStyle}>Assign & Create</motion.button>
                                    <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={() => setAddUserModal(false)} style={secondaryButtonStyle}>Cancel</motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit User Modal */}
            <AnimatePresence mode="wait">
                {editUserModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={() => setEditUserModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} transition={{ duration: 0.15 }} onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '32px', padding: '3rem', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 60px rgba(0,0,0,0.2)' }}>
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
                                            {showEditPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1.25rem', marginTop: '1.5rem' }}>
                                    <motion.button whileTap={{ scale: 0.95 }} type="submit" style={primaryButtonStyle}>Save Changes</motion.button>
                                    <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={() => setEditUserModal(false)} style={secondaryButtonStyle}>Cancel</motion.button>
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
