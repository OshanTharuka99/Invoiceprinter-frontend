import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Camera, Lock, Save, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import api from '../../api';
import useSubmitGuard from '../../utils/useSubmitGuard';
import './UserSettings.css';

const STOCK_LOCATIONS = ['Showroom', 'Warehouse A', 'Warehouse B', 'Store Room', 'Main Store'];

const UserSettings = ({ currentUser, showToast, onUserUpdate }) => {
    const [form, setForm] = useState({
        firstName: currentUser?.firstName || '',
        lastName: currentUser?.lastName || '',
        designation: currentUser?.designation || '',
        sex: currentUser?.sex || 'male',
        telephoneNumber: currentUser?.telephoneNumber || '',
        profilePicture: currentUser?.profilePicture || null,
    });
    const [previewImg, setPreviewImg] = useState(currentUser?.profilePicture || null);
    const { isSubmitting: profileSubmitting, runGuarded: runProfileGuarded } = useSubmitGuard();
    const { isSubmitting: pwSubmitting, runGuarded: runPwGuarded } = useSubmitGuard();

    // Password change state
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

    const fileInputRef = useRef(null);

    const initials = `${form.firstName?.[0] || ''}${form.lastName?.[0] || ''}`.toUpperCase();

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            showToast?.('Image must be under 2MB', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewImg(reader.result);
            setForm(prev => ({ ...prev, profilePicture: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleRemovePicture = () => {
        setPreviewImg(null);
        setForm(prev => ({ ...prev, profilePicture: null }));
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        await runProfileGuarded(async () => {
            try {
                const res = await api.patch('/users/update-me', form);
                showToast?.('Profile updated successfully', 'success');
                onUserUpdate?.(res.data.data.user);
            } catch (err) {
                showToast?.(err.response?.data?.message || 'Update failed', 'error');
            }
        });
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (pwForm.newPassword !== pwForm.confirmPassword) {
            showToast?.('New passwords do not match', 'error');
            return;
        }
        if (pwForm.newPassword.length < 6) {
            showToast?.('Password must be at least 6 characters', 'error');
            return;
        }
        await runPwGuarded(async () => {
            try {
                await api.post('/users/change-password', {
                    currentPassword: pwForm.currentPassword,
                    newPassword: pwForm.newPassword,
                });
                showToast?.('Password changed successfully', 'success');
                setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } catch (err) {
                showToast?.(err.response?.data?.message || 'Password change failed', 'error');
            }
        });
    };

    return (
        <div className="us-root">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            </div>
            {/* PROFILE CARD */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="us-card">
                <div className="us-card-header">
                    <div className="us-card-icon"><User size={20} /></div>
                    <div>
                        <h3 className="us-card-title">Profile Settings</h3>
                        <p className="us-card-desc">Update your personal information and avatar</p>
                    </div>
                </div>

                <form onSubmit={handleSaveProfile} className="us-form">
                    {/* Avatar */}
                    <div className="us-avatar-section">
                        <div className="us-avatar-wrap">
                            {previewImg ? (
                                <img src={previewImg} alt="avatar" className="us-avatar-img" />
                            ) : (
                                <div className="us-avatar-initials">{initials || '?'}</div>
                            )}
                            <button type="button" className="us-avatar-btn" onClick={() => fileInputRef.current?.click()}>
                                <Camera size={14} />
                            </button>
                        </div>
                        <div className="us-avatar-info">
                            <div className="us-avatar-name">{form.firstName} {form.lastName}</div>
                            <div className="us-avatar-role">{currentUser?.role?.toUpperCase()} · {form.designation}</div>
                            <div className="us-avatar-actions">
                                <button type="button" className="us-link-btn" onClick={() => fileInputRef.current?.click()}>Upload photo</button>
                                {previewImg && <button type="button" className="us-link-btn us-link-btn--danger" onClick={handleRemovePicture}>Remove</button>}
                            </div>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                    </div>

                    {/* Fields */}
                    <div className="us-grid">
                        <div className="us-field">
                            <label className="us-label">First Name</label>
                            <input className="us-input" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} required />
                        </div>
                        <div className="us-field">
                            <label className="us-label">Last Name</label>
                            <input className="us-input" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} required />
                        </div>
                        <div className="us-field us-field--full">
                            <label className="us-label">Email Address <span className="us-badge-locked">Locked</span></label>
                            <div className="us-input-wrap">
                                <input className="us-input us-input--locked" value={currentUser?.email || ''} readOnly tabIndex={-1} />
                                <AlertCircle size={14} className="us-input-icon" />
                            </div>
                            <span className="us-hint">Email cannot be changed. Contact your administrator.</span>
                        </div>
                        <div className="us-field">
                            <label className="us-label">Designation / Position</label>
                            <input className="us-input" value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} />
                        </div>
                        <div className="us-field">
                            <label className="us-label">Telephone</label>
                            <input className="us-input" value={form.telephoneNumber} onChange={e => setForm(p => ({ ...p, telephoneNumber: e.target.value }))} />
                        </div>
                        <div className="us-field">
                            <label className="us-label">Gender</label>
                            <select className="us-select" value={form.sex} onChange={e => setForm(p => ({ ...p, sex: e.target.value }))}>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="us-form-actions">
                        <motion.button type="submit" className="us-btn-primary" disabled={profileSubmitting} whileTap={{ scale: 0.97 }}>
                            <Save size={16} /> {profileSubmitting ? 'Processing...' : 'Save Profile'}
                        </motion.button>
                    </div>
                </form>
            </motion.div>

            {/* PASSWORD CARD */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="us-card">
                <div className="us-card-header">
                    <div className="us-card-icon us-card-icon--amber"><Lock size={20} /></div>
                    <div>
                        <h3 className="us-card-title">Change Password</h3>
                        <p className="us-card-desc">Use a strong password you don't use elsewhere</p>
                    </div>
                </div>

                <form onSubmit={handleChangePassword} className="us-form">
                    <div className="us-grid us-grid--single">
                        {[
                            { key: 'currentPassword', label: 'Current Password' },
                            { key: 'newPassword', label: 'New Password' },
                            { key: 'confirmPassword', label: 'Confirm New Password' },
                        ].map(({ key, label }) => (
                            <div key={key} className="us-field">
                                <label className="us-label">{label}</label>
                                <div className="us-input-wrap">
                                    <input
                                        className="us-input"
                                        type={showPw[key.replace('Password', '').toLowerCase() || 'current'] ? 'text' : 'password'}
                                        value={pwForm[key]}
                                        onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                                        required
                                    />
                                    <button type="button" className="us-pw-toggle" onClick={() => {
                                        const k = key === 'currentPassword' ? 'current' : key === 'newPassword' ? 'new' : 'confirm';
                                        setShowPw(p => ({ ...p, [k]: !p[k] }));
                                    }}>
                                        {showPw[key === 'currentPassword' ? 'current' : key === 'newPassword' ? 'new' : 'confirm'] ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="us-form-actions">
                        <motion.button type="submit" className="us-btn-amber" disabled={pwSubmitting} whileTap={{ scale: 0.97 }}>
                            <CheckCircle size={16} /> {pwSubmitting ? 'Processing...' : 'Update Password'}
                        </motion.button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default UserSettings;
