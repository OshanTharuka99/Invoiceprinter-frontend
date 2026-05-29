import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, UserPlus, Trash2, ShieldCheck, Search, RefreshCw,
    Filter, Edit3, Crown, Shield, Activity, AlertCircle,
    CheckCircle, MinusCircle, User, LayoutDashboard, FileText,
    TrendingUp, Mail, Phone, ChevronRight, Eye, EyeOff, ShieldAlert,
    Lock, Check, X
} from 'lucide-react';
import api from '../../api';
import './UserManagement.css';
import '../../styles/modern-table.css';

const UserManagement = ({ currentUser, showToast }) => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [sexFilter, setSexFilter] = useState('all');
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
    const [editPassword, setEditPassword] = useState('');
    const [showEditPass, setShowEditPass] = useState(false);

    const editPolicy = {
        length: editPassword.length >= 8,
        uppercase: /[A-Z]/.test(editPassword),
        number: /[0-9]/.test(editPassword),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(editPassword)
    };
    const isEditPolicyValid = Object.values(editPolicy).every(Boolean);

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
            const upData = { ...editingUser, password: editPassword || undefined };
            if (!upData.password) delete upData.password;
            const res = await api.patch(`/users/${editingUser._id}`, upData);
            setUsers(users.map(u => u._id === editingUser._id ? res.data.data.user : u));
            setEditingUser(null);
            setEditPassword('');
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

    return (
        <div className="user-management">
            {/* Stats Grid */}
            <div className="user-stats-grid">
                {[
                    { label: 'Total Users', value: users.length, icon: Users, color: '#6366f1' },
                    { label: 'Admin Users', value: users.filter(u => u.role !== 'user').length, icon: Shield, color: '#3b82f6' },
                    { label: 'Operational', value: users.length, icon: Activity, color: '#22c55e' }
                ].map((stat, i) => (
                    <div key={i} className="user-stat-card">
                        <div className="user-stat-header">
                            <span className="user-stat-label">{stat.label}</span>
                            <div className="user-stat-icon" style={{ background: stat.color + '10', color: stat.color }}>
                                <stat.icon size={22} />
                            </div>
                        </div>
                        <div className="user-stat-value">{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Table Container */}
            <div className="user-table-container">
                {/* Controls */}
                <div className="user-table-controls">
                    <div className="user-search-wrapper">
                        <Search size={18} className="user-search-icon" />
                        <input
                            type="text"
                            placeholder="Search team..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="user-search-input"
                        />
                    </div>
                    <div className="user-filters">
                        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="user-filter-select">
                            <option value="all">All Roles</option>
                            <option value="user">Users</option>
                            <option value="admin">Admins</option>
                        </select>
                        <select value={sexFilter} onChange={e => setSexFilter(e.target.value)} className="user-filter-select">
                            <option value="all">All Genders</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                        <select value={designationFilter} onChange={e => setDesignationFilter(e.target.value)} className="user-filter-select">
                            <option value="all">Positions</option>
                            {uniqueDesignations.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <button onClick={() => setAddUserModal(true)} className="user-add-btn">
                            <UserPlus size={18} /> Add
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="user-table-wrapper modern-table-card">
                    <table className="user-table modern-table">
                        <thead className="user-table-head">
                            <tr>
                                <th className="user-table-th">Personnel</th>
                                <th className="user-table-th">Position</th>
                                <th className="user-table-th">Contact</th>
                                <th className="user-table-th text-center">Status</th>
                                <th className="user-table-th text-center" style={{ width: '180px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((u) => {
                                const isTargetRoot = u.role === 'root';
                                const isTargetAdmin = u.role === 'admin';
                                const canManage = currentUser.role === 'root' || (currentUser.role === 'admin' && !isTargetRoot && !isTargetAdmin);
                                const canDelete = canManage && u._id !== currentUser._id;

                                return (
                                    <tr key={u._id} className="user-table-row">
                                        <td className="user-table-td">
                                            <div className="user-table-cell-user modern-table-cell-primary">
                                                <div className={`user-avatar ${u.profilePicture ? 'user-avatar-img-wrap' : isTargetRoot ? 'user-avatar-root' : 'user-avatar-user'}`}>
                                                    {u.profilePicture ? (
                                                        <img src={u.profilePicture} alt="" className="user-avatar-img" />
                                                    ) : isTargetRoot ? (
                                                        <Crown size={20} />
                                                    ) : (
                                                        u.firstName?.[0].toUpperCase() + (u.lastName?.[0].toUpperCase() || '')
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="user-name">{u.firstName} {u.lastName}</div>
                                                    <div className="user-email">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="user-designation">
                                            <span>{u.designation || '—'}</span>
                                        </td>
                                        <td>
                                            {u.telephoneNumber ? (
                                                <div className="modern-table-cell-info">
                                                    <Phone size={14} color="#94a3b8" />
                                                    <span>{u.telephoneNumber}</span>
                                                </div>
                                            ) : <span className="modern-table-cell-info muted">—</span>}
                                        </td>
                                        <td className="user-table-td text-center">
                                            <span className={`user-role-badge ${isTargetRoot ? 'user-role-root' : isTargetAdmin ? 'user-role-admin' : 'user-role-user'}`}>
                                                {u.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="user-table-actions">
                                            <div className="user-actions-wrapper modern-table-actions">
                                                <button onClick={() => { setEditingUser({ ...u, password: '' }); setEditPassword(''); }} disabled={!canManage} className={`user-action-btn user-edit-btn modern-table-action edit ${!canManage ? 'disabled' : ''}`}><Edit3 size={14} /></button>
                                                <button onClick={() => setUserToPromote(u)} disabled={!canManage} className={`user-action-btn user-promote-btn modern-table-action promote ${!canManage ? 'disabled' : ''}`}><ShieldCheck size={14} /></button>
                                                <button onClick={() => { setUserToDelete(u); setTypedConfirmName(''); }} disabled={!canDelete} className={`user-action-btn user-delete-btn modern-table-action delete ${!canDelete ? 'disabled' : ''}`}><Trash2 size={14} /></button>
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
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="user-modal-overlay">
                        <div className="user-modal">
                            <h2 className="user-modal-title">Add User</h2>
                            <form onSubmit={handleCreateUser} className="user-form">
                                <div>
                                    <label className="user-label">First Name</label>
                                    <input
                                        value={newUser.firstName}
                                        onChange={e => setNewUser({ ...newUser, firstName: e.target.value })}
                                        className="user-input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="user-label">Last Name</label>
                                    <input
                                        value={newUser.lastName}
                                        onChange={e => setNewUser({ ...newUser, lastName: e.target.value })}
                                        className="user-input"
                                        required
                                    />
                                </div>
                                <div className="user-form-full">
                                    <label className="user-label">Email</label>
                                    <input
                                        type="email"
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                        className="user-input"
                                        required
                                    />
                                </div>
                                <div className="user-form-full">
                                    <label className="user-label">Temporary Password</label>
                                    <div className="user-password-wrapper">
                                        <input
                                            type={showAddPass ? 'text' : 'password'}
                                            value={newUser.password}
                                            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                            className="user-input"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowAddPass(!showAddPass)}
                                            className="user-password-toggle"
                                        >
                                            {showAddPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="user-label">Position</label>
                                    <input
                                        value={newUser.designation}
                                        onChange={e => setNewUser({ ...newUser, designation: e.target.value })}
                                        className="user-input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="user-label">Gender</label>
                                    <select
                                        value={newUser.sex}
                                        onChange={e => setNewUser({ ...newUser, sex: e.target.value })}
                                        className="user-select"
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                                <div className="user-form-actions">
                                    <button type="submit" className="user-submit-btn">Add User</button>
                                    <button type="button" onClick={() => setAddUserModal(false)} className="user-cancel-btn">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}

                {/* EDIT USER MODAL */}
                {editingUser && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="user-modal-overlay">
                        <div className="user-modal">
                            <h2 className="user-modal-title">Update Profile</h2>
                            <form onSubmit={handleUpdateUser} className="user-form">
                                <div>
                                    <label className="user-label">First Name</label>
                                    <input
                                        value={editingUser.firstName}
                                        onChange={e => setEditingUser({ ...editingUser, firstName: e.target.value })}
                                        className="user-input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="user-label">Last Name</label>
                                    <input
                                        value={editingUser.lastName}
                                        onChange={e => setEditingUser({ ...editingUser, lastName: e.target.value })}
                                        className="user-input"
                                        required
                                    />
                                </div>
                                <div className="user-form-full">
                                    <label className="user-label">Email ID</label>
                                    <input
                                        type="email"
                                        value={editingUser.email}
                                        onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                                        className="user-input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="user-label">Position</label>
                                    <input
                                        value={editingUser.designation}
                                        onChange={e => setEditingUser({ ...editingUser, designation: e.target.value })}
                                        className="user-input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="user-label">Gender</label>
                                    <select
                                        value={editingUser.sex}
                                        onChange={e => setEditingUser({ ...editingUser, sex: e.target.value })}
                                        className="user-select"
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                                <div className="user-form-full">
                                    <label className="user-label">Phone</label>
                                    <input
                                        value={editingUser.telephoneNumber}
                                        onChange={e => setEditingUser({ ...editingUser, telephoneNumber: e.target.value })}
                                        className="user-input"
                                    />
                                </div>
                                {editingUser._id !== currentUser._id && (
                                    <div className="user-form-full" style={{borderTop:'1px solid #e2e8f0',paddingTop:'1rem',marginTop:'0.5rem'}}>
                                        <label className="user-label" style={{display:'flex',alignItems:'center',gap:'0.4rem'}}>
                                            <Lock size={13} /> New Password <span style={{fontWeight:400,color:'#94a3b8',fontSize:'0.72rem'}}>(leave blank to keep current)</span>
                                        </label>
                                        <div style={{position:'relative'}}>
                                            <input
                                                type={showEditPass ? 'text' : 'password'}
                                                value={editPassword}
                                                onChange={e => setEditPassword(e.target.value)}
                                                className="user-input"
                                                placeholder="Set new password"
                                                style={{paddingRight:'2.5rem'}}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowEditPass(!showEditPass)}
                                                style={{position:'absolute',right:'0.5rem',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#94a3b8',padding:'4px'}}
                                            >
                                                {showEditPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        {editPassword.length > 0 && (
                                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.3rem',marginTop:'0.5rem',background:'#f8fafc',padding:'0.5rem',borderRadius:'8px'}}>
                                                {[
                                                    {label:'8+ Chars', met: editPassword.length >= 8},
                                                    {label:'Uppercase', met: /[A-Z]/.test(editPassword)},
                                                    {label:'Number', met: /[0-9]/.test(editPassword)},
                                                    {label:'Special (@#)', met: /[!@#$%^&*(),.?":{}|<>]/.test(editPassword)},
                                                ].map((item,i)=>(
                                                    <div key={i} style={{display:'flex',alignItems:'center',gap:'0.3rem',fontSize:'0.7rem',fontWeight:700,color:item.met?'#10b981':'#94a3b8'}}>
                                                        {item.met ? <Check size={11} strokeWidth={4} /> : <X size={11} strokeWidth={4} />}
                                                        {item.label}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {editPassword.length > 0 && isEditPolicyValid && (
                                            <div style={{marginTop:'0.5rem',padding:'0.5rem',background:'#f0fdf4',borderRadius:'8px',fontSize:'0.72rem',fontWeight:600,color:'#15803d',display:'flex',alignItems:'center',gap:'0.3rem'}}>
                                                <ShieldCheck size={12} /> User will be required to change this password on next login
                                            </div>
                                        )}
                                    </div>
                                )}
                                {editingUser._id === currentUser._id && (
                                    <div className="user-form-full" style={{borderTop:'1px solid #e2e8f0',paddingTop:'1rem',marginTop:'0.5rem',textAlign:'center'}}>
                                        <p style={{fontSize:'0.78rem',color:'#94a3b8',fontWeight:600}}>Use <strong>Settings → Change Password</strong> to update your own password.</p>
                                    </div>
                                )}
                                <div className="user-form-actions">
                                    <button type="submit" className="user-submit-btn">Update Registry</button>
                                    <button type="button" onClick={() => { setEditingUser(null); setEditPassword(''); }} className="user-cancel-btn">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}

                {/* PROMOTION CONFIRM */}
                {userToPromote && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="user-modal-overlay">
                        <div className="user-confirm-modal">
                            <div className="user-confirm-icon user-confirm-icon-promote">
                                <ShieldAlert size={32} />
                            </div>
                            <h3 className="user-confirm-title">Clearance Mutation?</h3>
                            <p className="user-confirm-text">
                                Are you sure you want to change the clearance for <strong>{userToPromote.firstName}</strong> to <strong>{userToPromote.role === 'admin' ? 'USER' : 'ADMIN'}</strong>?
                            </p>
                            <div className="user-confirm-actions">
                                <button onClick={handleRoleUpdate} className="user-confirm-btn user-confirm-btn-promote">
                                    OK, CHANGE
                                </button>
                                <button onClick={() => setUserToPromote(null)} className="user-cancel-confirm-btn">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* DELETE CONFIRM */}
                {userToDelete && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="user-modal-overlay">
                        <div className="user-confirm-modal">
                            <div className="user-confirm-icon user-confirm-icon-delete">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="user-confirm-title">Terminate Personnel?</h3>
                            <p className="user-confirm-text">
                                To verify termination of <strong>{userToDelete.firstName}</strong>, type their name:
                            </p>
                            <input
                                value={typedConfirmName}
                                onChange={e => setTypedConfirmName(e.target.value)}
                                placeholder="Type name here"
                                className="user-confirm-input"
                            />
                            <div className="user-confirm-actions">
                                <button
                                    onClick={handleDelete}
                                    disabled={typedConfirmName.toLowerCase() !== userToDelete.firstName.toLowerCase()}
                                    className="user-confirm-btn user-confirm-btn-delete"
                                >
                                    CONFIRM DELETION
                                </button>
                                <button onClick={() => setUserToDelete(null)} className="user-cancel-confirm-btn">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserManagement;
