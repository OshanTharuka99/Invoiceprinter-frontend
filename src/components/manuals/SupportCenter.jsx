import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    LifeBuoy, FileText, ScrollText, Package, Truck, Undo2, RotateCcw,
    Wrench, Users, Briefcase, Shield, ShieldCheck, Settings, LayoutDashboard,
    Search, ChevronRight, BookOpen,
} from 'lucide-react';
import api from '../../api';
import { MODULE_MANUALS } from './manualCatalog';
import ModuleManualViewer from './ModuleManualViewer';
import './SupportCenter.css';

const MANUAL_META = [
    { id: 'dashboard', label: 'Dashboard', blurb: 'KPIs, periods, and status charts', icon: LayoutDashboard, roles: ['all'] },
    { id: 'invoice', label: 'Invoice Engine', blurb: 'Create, edit, cancel, and print invoices', icon: FileText, roles: ['all'] },
    { id: 'proma_invoice', label: 'Proma Invoice', blurb: 'Proforma estimates — no stock or warranty', icon: ScrollText, roles: ['all'] },
    { id: 'quotation', label: 'Quotation Engine', blurb: 'Quotes, approval status, convert flow', icon: ScrollText, roles: ['all'] },
    { id: 'purchase_order', label: 'Purchase Orders', blurb: 'Supplier orders and PO printouts', icon: Package, roles: ['admin', 'root'] },
    { id: 'delivery_note', label: 'Delivery Notes', blurb: 'Dispatch notes and serial assignment', icon: Truck, roles: ['admin', 'root'] },
    { id: 'sales_return', label: 'Sales Return Notes', blurb: 'Customer returns and stock restore', icon: Undo2, roles: ['admin', 'root'] },
    { id: 'goods_return', label: 'Goods Return Notes', blurb: 'Supplier returns and loss control', icon: RotateCcw, roles: ['admin', 'root'] },
    { id: 'rma', label: 'RMA Process', blurb: 'Faulty devices, replace, RMA report', icon: Wrench, roles: ['all'] },
    { id: 'products', label: 'Product Catalog', blurb: 'Categories, stock, serial inventory', icon: Package, roles: ['all'] },
    { id: 'clients', label: 'Client Directory', blurb: 'Customer records and edit approvals', icon: Users, roles: ['all'] },
    { id: 'projects', label: 'Project Portfolio', blurb: 'Projects / sites linked to sales', icon: Briefcase, roles: ['all'] },
    { id: 'suppliers', label: 'Vendor Intranet', blurb: 'Supplier contacts for POs & stock', icon: Truck, roles: ['admin', 'root'] },
    { id: 'warranty', label: 'Warranty Management', blurb: 'Serial warranties and coverage', icon: Shield, roles: ['all'] },
    { id: 'users', label: 'User Management', blurb: 'Staff accounts and roles', icon: ShieldCheck, roles: ['admin', 'root'] },
    { id: 'business', label: 'General Settings', blurb: 'Company profile, prefixes, colors', icon: Settings, roles: ['admin', 'root'] },
    { id: 'approvals', label: 'Security Approvals', blurb: 'Pending edit and delete requests', icon: ShieldCheck, roles: ['admin', 'root'] },
    { id: 'settings', label: 'Account Settings', blurb: 'Your profile and password', icon: Settings, roles: ['all'] },
];

const SupportCenter = ({ currentUser }) => {
    const role = currentUser?.role || 'user';
    const [search, setSearch] = useState('');
    const [activeId, setActiveId] = useState(null);
    const [business, setBusiness] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await api.get('/business');
                if (!cancelled) setBusiness(res.data?.data?.details || null);
            } catch {
                /* optional for manual header */
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const guides = useMemo(() => {
        const term = search.trim().toLowerCase();
        return MANUAL_META.filter((item) => {
            const allowed = item.roles.includes('all') || item.roles.includes(role);
            if (!allowed || !MODULE_MANUALS[item.id]) return false;
            if (!term) return true;
            return (
                item.label.toLowerCase().includes(term)
                || item.blurb.toLowerCase().includes(term)
                || (MODULE_MANUALS[item.id].overview || '').toLowerCase().includes(term)
            );
        });
    }, [role, search]);

    const activeManual = activeId ? MODULE_MANUALS[activeId] : null;
    const activeMeta = activeId ? MANUAL_META.find((m) => m.id === activeId) : null;

    return (
        <div className="support-root">
            <header className="support-hero">
                <div className="support-hero-copy">
                    <div className="support-eyebrow">
                        <LifeBuoy size={14} />
                        Support
                    </div>
                    <h1 className="support-title">User manuals</h1>
                    <p className="support-sub">
                        Open one guide at a time, read on screen, then save or print as PDF with A4 Print.
                    </p>
                </div>
                <div className="support-search">
                    <Search size={16} className="support-search-icon" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search a module guide..."
                        aria-label="Search manuals"
                    />
                </div>
            </header>

            <div className="support-grid">
                {guides.map((item, i) => {
                    const Icon = item.icon;
                    const accent = MODULE_MANUALS[item.id]?.accent || '#0f172a';
                    return (
                        <motion.button
                            key={item.id}
                            type="button"
                            className="support-card"
                            style={{ '--support-accent': accent }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(i * 0.03, 0.35) }}
                            onClick={() => setActiveId(item.id)}
                        >
                            <div className="support-card-icon">
                                <Icon size={20} />
                            </div>
                            <div className="support-card-body">
                                <div className="support-card-title">{item.label}</div>
                                <div className="support-card-blurb">{item.blurb}</div>
                            </div>
                            <span className="support-card-cta">
                                <BookOpen size={14} />
                                Open
                                <ChevronRight size={14} />
                            </span>
                        </motion.button>
                    );
                })}
            </div>

            {guides.length === 0 && (
                <div className="support-empty">No manuals match your search.</div>
            )}

            <ModuleManualViewer
                open={!!activeManual}
                onClose={() => setActiveId(null)}
                title={activeManual?.title || activeMeta?.label}
                accent={activeManual?.accent}
                overview={activeManual?.overview}
                sections={activeManual?.sections}
                business={business}
                fileName={`User_Manual_${activeId || 'guide'}`}
            />
        </div>
    );
};

export default SupportCenter;
