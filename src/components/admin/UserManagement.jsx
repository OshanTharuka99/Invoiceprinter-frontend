import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, UserPlus, Trash2, ShieldCheck, Search, RefreshCw,
    Filter, Edit3, Crown, Shield, Activity, AlertCircle,
    CheckCircle, MinusCircle, User, LayoutDashboard, FileText,
    TrendingUp, Mail, Phone, ChevronRight, Eye, EyeOff, ShieldAlert
} from 'lucide-react';
import api from '../../api';

/**
 * USER MANAGEMENT - COMPREHENSIVE EDITION
 * ---------------------------------------
 * Fixed: Added Gender (Sex) filter alongside Role and Designation.
 */
const UserManagement = ({ currentUser, showToast }) => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [sexFilter, setSexFilter] = useState('all'); // State restored
    const [designationFilter, setDesignationFilter] = useState('all');

    const [addUserModal, setAddUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);
    const [userToPromote, setUserToPromote] = useState(null);
    const [typedConfirmName, setTypedConfirmName] = useState('');

    const [newUser, setNewUser] = useState({
        firstName: '', lastName: '', email: '', password: '',
        designation: '', role: 'user', sex: 'male', telephoneNumber: ''
    });

    const [showAddPass, setShowAddPass] = useState(false);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/users');
            setUsers(res.data.data.users);
        } catch (err) { showToast('Sync failed', 'error'); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchUsers(); }, []);

    const uniqueDesignations = [...new Set(users.map(u => u.designation).filter(Boolean))].sort();

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/users', newUser);
            setUsers([...users, res.data.data.user]);
            setAddUserModal(false);
            setNewUser({ firstName: '', lastName: '', email: '', password: '', designation: '', role: 'user', sex: 'male', telephoneNumber: '' });
            showToast('New personnel authenticated');
        } catch (err) { showToast(err.response?.data?.message || 'Creation failed', 'error'); }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            const upData = { ...editingUser };
            if (!upData.password) delete upData.password;
            const res = await api.patch(`/users/${editingUser._id}`, upData);
            setUsers(users.map(u => u._id === editingUser._id ? res.data.data.user : u));
            setEditingUser(null);
            showToast('Identity updated');
        } catch (err) { showToast('Update rejected by server', 'error'); }
    };

    const handleDelete = async () => {
        if (!userToDelete || typedConfirmName.toLowerCase() !== userToDelete.firstName.toLowerCase()) return;
        try {
            await api.delete(`/users/${userToDelete._id}`);
            setUsers(users.filter(u => u._id !== userToDelete._id));
            setUserToDelete(null);
            showToast('Personnel record terminated');
        } catch (err) { showToast('Security rejection', 'error'); }
    };

    const handleRoleUpdate = async () => {
        if (!userToPromote) return;
        const target = userToPromote;
        const nextRole = target.role === 'admin' ? 'user' : 'admin';
        try {
            await api.patch(`/users/${target._id}/role`, { role: nextRole });
            setUsers(users.map(u => u._id === target._id ? { ...u, role: nextRole } : u));
            showToast(`Clearance updated: ${nextRole.toUpperCase()}`);
            setUserToPromote(null);
        } catch (err) {
            showToast('Permission denied', 'error');
            setUserToPromote(null);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = (u.firstName + u.lastName + u.email).toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        const matchesSex = sexFilter === 'all' || u.sex === sexFilter;
        const matchesDesignation = designationFilter === 'all' || u.designation === designationFilter;
        return matchesSearch && matchesRole && matchesSex && matchesDesignation;
    });

    const inputStyle = { width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem 1.25rem', color: '#0f172a', outline: 'none', fontSize: '1rem', transition: 'all 0.2s ease', fontWeight: 600 };
    const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' };
    const btnGradient = { background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', border: 'none', borderRadius: '14px', padding: '1rem 1.5rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {[
                    { label: 'Total Users', value: users.length, icon: Users, color: '#6366f1' },
                    { label: 'Admin Users', value: users.filter(u => u.role !== 'user').length, icon: Shield, color: '#3b82f6' },
                    { label: 'Operational', value: users.length, icon: Activity, color: '#22c55e' }
                ].map((stat, i) => (
                    <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{stat.label}</span>
                            <div style={{ background: stat.color + '10', color: stat.color, padding: '10px', borderRadius: '12px' }}><stat.icon size={22} /></div>
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a' }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ padding: '2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div style={{ position: 'relative', width: 320 }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input type="text" placeholder="Search team..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...inputStyle, paddingLeft: '3rem' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ background: '#f8fafc', padding: '0.6rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
                            <option value="all">All Roles</option><option value="user">Users</option><option value="admin">Admins</option>
                        </select>
                        <select value={sexFilter} onChange={e => setSexFilter(e.target.value)} style={{ background: '#f8fafc', padding: '0.6rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
                            <option value="all">All Genders</option><option value="male">Male</option><option value="female">Female</option>
                        </select>
                        <select value={designationFilter} onChange={e => setDesignationFilter(e.target.value)} style={{ background: '#f8fafc', padding: '0.6rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
                            <option value="all">Positions</option>{uniqueDesignations.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <button onClick={() => setAddUserModal(true)} style={btnGradient}><UserPlus size={18} /> Add</button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                                <th style={{ padding: '1.25rem 2.5rem', textAlign: 'left', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>Personnel</th>
                                <th style={{ padding: '1.25rem 2.5rem', textAlign: 'left', color: '#64748b', fontSize: '0.8rem' }}>Position</th>
                                <th style={{ padding: '1.25rem 2.5rem', textAlign: 'left', color: '#64748b', fontSize: '0.8rem' }}>Status</th>
                                <th style={{ padding: '1.25rem 2.5rem', textAlign: 'right', color: '#64748b', fontSize: '0.8rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((u) => {
                                const isTargetRoot = u.role === 'root';
                                const isTargetAdmin = u.role === 'admin';
                                const canManage = currentUser.role === 'root' || (currentUser.role === 'admin' && !isTargetRoot && !isTargetAdmin);
                                const canDelete = canManage && u._id !== currentUser._id;

                                return (
                                    <tr key={u._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '1.25rem 2.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                                <div style={{ width: 44, height: 44, background: isTargetRoot ? '#fffbeb' : '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: isTargetRoot ? '#b45309' : '#0f172a' }}>
                                                    {isTargetRoot ? <Crown size={22} /> : (u.firstName?.[0].toUpperCase() + (u.lastName?.[0].toUpperCase() || ''))}
                                                </div>
                                                <div><div style={{ fontWeight: 800, color: '#0f172a' }}>{u.firstName} {u.lastName}</div><div style={{ color: '#64748b', fontSize: '0.85rem' }}>{u.email}</div></div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 2.5rem', fontWeight: 700, color: '#475569' }}>{u.designation || '—'}</td>
                                        <td style={{ padding: '1.25rem 2.5rem' }}><span style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900, background: isTargetRoot ? '#fffbeb' : isTargetAdmin ? '#0f172a' : '#f1f5f9', color: isTargetRoot ? '#b45309' : isTargetAdmin ? '#fff' : '#64748b' }}>{u.role.toUpperCase()}</span></td>
                                        <td style={{ padding: '1.25rem 2.5rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                                <button onClick={() => setEditingUser({ ...u, password: '' })} disabled={!canManage} style={{ background: 'none', border: 'none', cursor: canManage ? 'pointer' : 'not-allowed', opacity: canManage ? 1 : 0.3 }}><Edit3 size={18} color="#64748b" /></button>
                                                <button onClick={() => setUserToPromote(u)} disabled={!canManage} style={{ background: 'none', border: 'none', cursor: canManage ? 'pointer' : 'not-allowed', opacity: canManage ? 1 : 0.3 }}><ShieldCheck size={18} color="#6366f1" /></button>
                                                <button onClick={() => { setUserToDelete(u); setTypedConfirmName(''); }} disabled={!canDelete} style={{ background: 'none', border: 'none', cursor: canDelete ? 'pointer' : 'not-allowed', opacity: canDelete ? 1 : 0.3 }}><Trash2 size={18} color="#ef4444" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {/* ADD USER MODAL */}
                {addUserModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ background: '#fff', borderRadius: '32px', padding: '3rem', width: '100%', maxWidth: 580 }}>
                            <h2 style={{ fontSize: '2rem', fontWeight: 950, marginBottom: '2.5rem' }}>Add User</h2>
                            <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div><label style={labelStyle}>First Name</label><input value={newUser.firstName} onChange={e => setNewUser({ ...newUser, firstName: e.target.value })} style={inputStyle} required /></div>
                                <div><label style={labelStyle}>Last Name</label><input value={newUser.lastName} onChange={e => setNewUser({ ...newUser, lastName: e.target.value })} style={inputStyle} required /></div>
                                <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Email</label><input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} style={inputStyle} required /></div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={labelStyle}>Temporary Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type={showAddPass ? 'text' : 'password'} value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} style={inputStyle} required />
                                        <button type="button" onClick={() => setShowAddPass(!showAddPass)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none' }}>{showAddPass ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                    </div>
                                </div>
                                <div><label style={labelStyle}>Position</label><input value={newUser.designation} onChange={e => setNewUser({ ...newUser, designation: e.target.value })} style={inputStyle} required /></div>
                                <div><label style={labelStyle}>Gender</label><select value={newUser.sex} onChange={e => setNewUser({ ...newUser, sex: e.target.value })} style={inputStyle}><option value="male">Male</option><option value="female">Female</option></select></div>
                                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <button type="submit" style={{ ...btnGradient, flex: 2 }}>Add User</button>
                                    <button onClick={() => setAddUserModal(false)} type="button" style={{ background: '#f1f5f9', border: 'none', borderRadius: '14px', flex: 1, fontWeight: 800 }}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}

                {/* EDIT USER MODAL */}
                {editingUser && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ background: '#fff', borderRadius: '32px', padding: '3rem', width: '100%', maxWidth: 580 }}>
                            <h2 style={{ fontSize: '2rem', fontWeight: 950, marginBottom: '2.5rem' }}>Update Profile</h2>
                            <form onSubmit={handleUpdateUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div><label style={labelStyle}>First Name</label><input value={editingUser.firstName} onChange={e => setEditingUser({ ...editingUser, firstName: e.target.value })} style={inputStyle} required /></div>
                                <div><label style={labelStyle}>Last Name</label><input value={editingUser.lastName} onChange={e => setEditingUser({ ...editingUser, lastName: e.target.value })} style={inputStyle} required /></div>
                                <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Email ID</label><input type="email" value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} style={inputStyle} required /></div>
                                <div><label style={labelStyle}>Position</label><input value={editingUser.designation} onChange={e => setEditingUser({ ...editingUser, designation: e.target.value })} style={inputStyle} required /></div>
                                <div><label style={labelStyle}>Gender</label><select value={editingUser.sex} onChange={e => setEditingUser({ ...editingUser, sex: e.target.value })} style={inputStyle}><option value="male">Male</option><option value="female">Female</option></select></div>
                                <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Phone</label><input value={editingUser.telephoneNumber} onChange={e => setEditingUser({ ...editingUser, telephoneNumber: e.target.value })} style={inputStyle} /></div>
                                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <button type="submit" style={{ ...btnGradient, flex: 2 }}>Update Registry</button>
                                    <button onClick={() => setEditingUser(null)} type="button" style={{ background: '#f1f5f9', border: 'none', borderRadius: '14px', flex: 1, fontWeight: 800 }}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}

                {/* PROMOTION CONFIRM */}
                {userToPromote && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ background: '#fff', borderRadius: '32px', padding: '3rem', width: '100%', maxWidth: 450, textAlign: 'center' }}>
                            <div style={{ width: 64, height: 64, background: '#e0e7ff', color: '#6366f1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}><ShieldAlert size={32} /></div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Clearance Mutation?</h3>
                            <p style={{ color: '#64748b', marginBottom: '2rem' }}>Are you sure you want to change the clearance for <strong>{userToPromote.firstName}</strong> to <strong>{userToPromote.role === 'admin' ? 'USER' : 'ADMIN'}</strong>?</p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={handleRoleUpdate} style={{ flex: 1.5, background: '#6366f1', color: '#fff', border: 'none', borderRadius: '14px', padding: '1rem', fontWeight: 900, cursor: 'pointer' }}>OK, CHANGE</button>
                                <button onClick={() => setUserToPromote(null)} style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: '14px', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* DELETE CONFIRM */}
                {userToDelete && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ background: '#fff', borderRadius: '32px', padding: '3rem', width: '100%', maxWidth: 450, textAlign: 'center' }}>
                            <div style={{ width: 64, height: 64, background: '#fee2e2', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}><AlertCircle size={32} /></div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Terminate Personnel?</h3>
                            <p style={{ color: '#64748b', marginBottom: '2rem' }}>To verify termination of <strong>{userToDelete.firstName}</strong>, type their name:</p>
                            <input value={typedConfirmName} onChange={e => setTypedConfirmName(e.target.value)} placeholder="Type name here" style={{ ...inputStyle, textAlign: 'center', marginBottom: '1.5rem' }} />
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={handleDelete} disabled={typedConfirmName.toLowerCase() !== userToDelete.firstName.toLowerCase()} style={{ flex: 1.5, background: typedConfirmName.toLowerCase() === userToDelete.firstName.toLowerCase() ? '#ef4444' : '#fee2e2', color: '#fff', border: 'none', borderRadius: '14px', padding: '1rem', fontWeight: 900, cursor: 'pointer' }}>CONFIRM DELETION</button>
                                <button onClick={() => setUserToDelete(null)} style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: '14px', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default UserManagement;
