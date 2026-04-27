import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, X, Edit2, Trash2, RefreshCw, FolderTree, FilePlus, Search, AlertTriangle, FileText, Tag, BarChart3, Info } from 'lucide-react';
import api from '../../api';

const ProductManagement = ({ currentUser, showToast }) => {
    const [activeTab, setActiveTab] = useState('products');
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [businessData, setBusinessData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');
    const [productCatFilter, setProductCatFilter] = useState('');
    const [confirmAction, setConfirmAction] = useState(null);
    const [viewProduct, setViewProduct] = useState(null);

    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [isProdModalOpen, setIsProdModalOpen] = useState(false);
    const [editingCat, setEditingCat] = useState(null);
    const [catForm, setCatForm] = useState({ name: '', code: '', parentCategory: '' });
    const [editingProd, setEditingProd] = useState(null);
    const [prodForm, setProdForm] = useState({ name: '', category: '', price: '', currencyType: 'primary', isTaxIncluded: false, quantity: 0 });
    const [isInlineCategory, setIsInlineCategory] = useState(false);
    const [inlineCatForm, setInlineCatForm] = useState({ name: '', code: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catRes, prodRes, bizRes] = await Promise.all([api.get('/products/categories'), api.get('/products'), api.get('/business')]);
            setCategories(catRes.data.data || []);
            setProducts(prodRes.data.data || []);
            if (bizRes.data?.data?.details) setBusinessData(bizRes.data.data.details);
        } catch (error) { showToast?.('Error loading metadata', 'error'); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const hasAccess = ['root', 'admin'].includes(currentUser?.role);

    const openCatModal = (cat = null) => {
        if (cat) { setEditingCat(cat); setCatForm({ name: cat.name, code: cat.code, parentCategory: cat.parentCategory?._id || '' }); }
        else { setEditingCat(null); setCatForm({ name: '', code: '', parentCategory: '' }); }
        setIsCatModalOpen(true);
    };

    const saveCategory = async (e, inline = false) => {
        if (e) e.preventDefault();
        try {
            if (inline) {
                const res = await api.post('/products/categories', { name: inlineCatForm.name, code: inlineCatForm.code });
                showToast?.('Module category defined', 'success');
                fetchData();
                return res.data.data;
            }
            if (editingCat) { await api.put(`/products/categories/${editingCat._id}`, { ...catForm, parentCategory: catForm.parentCategory || null }); showToast?.('Archival synchronized', 'success'); }
            else { await api.post('/products/categories', { ...catForm, parentCategory: catForm.parentCategory || null }); showToast?.('Definition established', 'success'); }
            setIsCatModalOpen(false);
            fetchData();
        } catch (error) { showToast?.(error.response?.data?.message || 'Archival failure', 'error'); return null; }
    };

    const deleteCategory = async (id) => {
        setConfirmAction({
            message: "Permanently terminate this category definition? Associated indices may become orphaned.",
            onConfirm: async () => {
                try { await api.delete(`/products/categories/${id}`); showToast?.('Definition eliminated', 'success'); fetchData(); }
                catch (error) { showToast?.(error.response?.data?.message || 'Elimination failure', 'error'); }
            }
        });
    };

    const openProdModal = (prod = null) => {
        if (prod) { setEditingProd(prod); setProdForm({ name: prod.name, category: prod.category?._id || '', price: prod.price, currencyType: prod.currencyType || 'primary', isTaxIncluded: prod.isTaxIncluded || false, quantity: prod.quantity || 0 }); }
        else { setEditingProd(null); setProdForm({ name: '', category: '', price: '', currencyType: 'primary', isTaxIncluded: false, quantity: 0 }); }
        setIsInlineCategory(false);
        setIsProdModalOpen(true);
    };

    const saveProduct = async (e) => {
        e.preventDefault();
        try {
            let finalCategoryId = prodForm.category;
            if (isInlineCategory) {
                if (!inlineCatForm.name || !inlineCatForm.code) return showToast?.('Inline definitions incomplete', 'error');
                const newCat = await saveCategory(null, true);
                if (!newCat) return;
                finalCategoryId = newCat._id;
            } else if (!finalCategoryId) return showToast?.('Module indexing required', 'error');
            const payload = { ...prodForm, category: finalCategoryId };
            if (editingProd) { await api.put(`/products/${editingProd._id}`, payload); showToast?.('Module synchronized', 'success'); }
            else { await api.post('/products', payload); showToast?.('Entry archived', 'success'); }
            setIsProdModalOpen(false);
            fetchData();
        } catch (error) { showToast?.(error.response?.data?.message || 'Transmission failure', 'error'); }
    };

    const deleteProduct = async (id) => {
        setConfirmAction({
            message: "Verify command to eliminate module from master catalog.",
            onConfirm: async () => { try { await api.delete(`/products/${id}`); showToast?.('Module eliminated', 'success'); fetchData(); } catch (error) { showToast?.('Operation failure', 'error'); } }
        });
    };

    const getCurrencySymbol = (type) => businessData ? (type === 'primary' ? businessData.primaryCurrency?.symbol : businessData.secondaryCurrency?.symbol) : '';

    const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()) || c.code.toLowerCase().includes(categorySearch.toLowerCase()));
    const filteredProducts = products.filter(p => productCatFilter === '' || p.category?._id === productCatFilter);

    const cardStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
    const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#64748b', marginBottom: '0.6rem', textTransform: 'uppercase' };
    const inputStyle = { width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '0.8rem 1.25rem', color: '#0f172a', outline: 'none', fontWeight: 600, boxSizing: 'border-box' };

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '6px', borderRadius: '16px', marginBottom: '2.5rem', width: 'fit-content' }}>
                <motion.button whileTap={{ scale: 0.95 }} title="Navigate to Master Catalog Index" onClick={() => setActiveTab('products')} style={{ padding: '0.8rem 1.5rem', border: 'none', background: activeTab === 'products' ? '#0f172a' : 'transparent', color: activeTab === 'products' ? '#fff' : '#64748b', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>Catalog</motion.button>
                <motion.button whileTap={{ scale: 0.95 }} title="Navigate to Structural Categories" onClick={() => setActiveTab('categories')} style={{ padding: '0.8rem 1.5rem', border: 'none', background: activeTab === 'categories' ? '#0f172a' : 'transparent', color: activeTab === 'categories' ? '#fff' : '#64748b', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>Categories</motion.button>
            </div>

            {loading ? ( <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><RefreshCw className="animate-spin" color="#64748b" /></div> ) : (
                <AnimatePresence mode="wait">
                    {activeTab === 'categories' ? (
                        <motion.div key="cat" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                            <div style={cardStyle}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><div style={{ background: '#3b82f615', color: '#3b82f6', padding: '10px', borderRadius: '12px' }}><FolderTree size={24} /></div> <h3 style={{ margin: 0, fontWeight: 900 }}>Structural Nodes</h3></div>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        <div style={{ position: 'relative' }}>
                                            <Search size={16} title="Filter search results" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                            <input type="text" title="Enter search parameters" placeholder="Search categories..." value={categorySearch} onChange={e => setCategorySearch(e.target.value)} style={{ padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', width: 220, outline: 'none' }} />
                                        </div>
                                        {hasAccess && <motion.button whileTap={{ scale: 0.95 }} title="Define new structural node" onClick={() => openCatModal()} style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={18} /> New Category</motion.button>}
                                    </div>
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                            <th style={{ padding: '1.25rem 1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>Name</th>
                                            <th style={{ padding: '1.25rem 1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>Code</th>
                                            <th style={{ padding: '1.25rem 1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>Parent Node</th>
                                            {hasAccess && <th style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>Management</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCategories.map(c => (
                                            <tr key={c._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                                <td style={{ padding: '1.25rem 1rem', fontWeight: 700 }}>{c.name}</td>
                                                <td style={{ padding: '1.25rem 1rem' }}><span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '0.7rem', color: '#64748b' }}>{c.code}</span></td>
                                                <td style={{ padding: '1.25rem 1rem', color: '#64748b', fontWeight: 600 }}>{c.parentCategory?.name || '-- Direct --'}</td>
                                                {hasAccess && (
                                                    <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                                            <motion.button whileTap={{ scale: 0.9 }} title="Modify Node Configuration" onClick={() => openCatModal(c)} style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight: 800, color: '#2563eb', display: 'flex', gap: '0.4rem', fontSize: '0.7rem' }}><Edit2 size={12} /> Edit</motion.button>
                                                            <motion.button whileTap={{ scale: 0.9 }} title="Initiate Elimination Sequence" onClick={() => deleteCategory(c._id)} style={{ background: '#fff1f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight: 800, color: '#ef4444', fontSize: '0.7rem' }}>Delete</motion.button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="prod" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                            <div style={cardStyle}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><div style={{ background: '#10b98115', color: '#10b981', padding: '10px', borderRadius: '12px' }}><Package size={24} /></div> <h3 style={{ margin: 0, fontWeight: 900 }}>Master Inventory</h3></div>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        <select title="Filter nodes by structural category" value={productCatFilter} onChange={e => setProductCatFilter(e.target.value)} style={{ padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', color: '#64748b', fontWeight: 800, background: '#f8fafc' }}>
                                            <option value="">All Structural Categories</option>
                                            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                        </select>
                                        {hasAccess && <motion.button whileTap={{ scale: 0.95 }} title="Archive new module entry" onClick={() => openProdModal()} style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={18} /> Add Module</motion.button>}
                                    </div>
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                            <th style={{ padding: '1.25rem 1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>Product ID</th>
                                            <th style={{ padding: '1.25rem 1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>Module Name</th>
                                            <th style={{ padding: '1.25rem 1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>Indexing</th>
                                            <th style={{ padding: '1.25rem 1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>Price Unit</th>
                                            <th style={{ padding: '1.25rem 1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>Availability</th>
                                            <th style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>Management</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.map(p => (
                                            <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                                <td style={{ padding: '1.25rem 1rem', fontWeight: 800, color: '#3b82f6', fontSize: '0.8rem' }}>{p.productId}</td>
                                                <td style={{ padding: '1.25rem 1rem', fontWeight: 700 }}>{p.name}</td>
                                                <td style={{ padding: '1.25rem 1rem', color: '#64748b', fontWeight: 600 }}>{p.category?.name}</td>
                                                <td style={{ padding: '1.25rem 1rem', fontWeight: 800, color: '#0f172a' }}>{getCurrencySymbol(p.currencyType)} {p.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td style={{ padding: '1.25rem 1rem' }}>
                                                   <span style={{ color: p.quantity > 0 ? '#059669' : '#dc2626', background: p.quantity > 0 ? '#ecfdf5' : '#fef2f2', padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, border: `1px solid ${p.quantity > 0 ? '#d1fae5' : '#fee2e2'}` }}>{p.quantity > 0 ? `ACTIVE STOCK: ${p.quantity}` : 'DEPLETED'}</span>
                                                </td>
                                                <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                                        <motion.button whileTap={{ scale: 0.9 }} title="View Module Specifications" onClick={() => setViewProduct(p)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight: 800, color: '#0f172a', display: 'flex', gap: '0.4rem', fontSize: '0.7rem' }}><FileText size={12} /> View</motion.button>
                                                        {hasAccess && (
                                                            <>
                                                              <motion.button whileTap={{ scale: 0.9 }} title="Modify Module Registry" onClick={() => openProdModal(p)} style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight: 800, color: '#2563eb', display: 'flex', gap: '0.4rem', fontSize: '0.7rem' }}><Edit2 size={12} /> Edit</motion.button>
                                                              <motion.button whileTap={{ scale: 0.9 }} title="Initiate Elimination Sequence" onClick={() => deleteProduct(p._id)} style={{ background: '#fff1f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight: 800, color: '#ef4444', fontSize: '0.7rem' }}>Delete</motion.button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* VIEW MODAL */}
            <AnimatePresence>
                {viewProduct && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#fff', borderRadius: '32px', padding: '3rem', width: '100%', maxWidth: 500, boxShadow: '0 50px 100px -20px rgba(0,0,0,0.4)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ background: '#10b98115', color: '#10b981', padding: '12px', borderRadius: '15px' }}><Package size={24} /></div>
                                    <div>
                                        <h3 style={{ margin: 0, fontWeight: 900 }}>{viewProduct.name}</h3>
                                        <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 800 }}>ID: {viewProduct.productId}</span>
                                    </div>
                                </div>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setViewProduct(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={20}/></motion.button>
                            </div>
                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                                        <Tag size={18} color="#64748b"/>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b' }}>MAPPING</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{viewProduct.category?.name || 'Unindexed'}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                                        <BarChart3 size={18} color="#64748b"/>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b' }}>STOCK CAPACITY</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 800, color: viewProduct.quantity > 0 ? '#10b981' : '#ef4444' }}>{viewProduct.quantity} Modules Available</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <Info size={18} color="#64748b"/>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b' }}>UNIT VALUATION</div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>{getCurrencySymbol(viewProduct.currencyType)} {viewProduct.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                            {viewProduct.isTaxIncluded && <div style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 800 }}>INCLUSIVE OF REGULATORY TAX</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <motion.button whileTap={{ scale: 0.98 }} onClick={() => setViewProduct(null)} style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '14px', width: '100%', padding: '1.1rem', fontWeight: 800, cursor: 'pointer', marginTop: '2.5rem' }}>Close Inspector</motion.button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODALS (Already updated) */}
            <AnimatePresence>
                {isCatModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#fff', borderRadius: '32px', padding: '3rem', width: '100%', maxWidth: 450, boxShadow: '0 50px 100px -20px rgba(0,0,0,0.3)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                                <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem' }}>{editingCat ? 'Sync Node' : 'Register Node'}</h2>
                                <motion.button whileTap={{ scale: 0.8 }} title="Close Modal" onClick={() => setIsCatModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={24} /></motion.button>
                            </div>
                            <form onSubmit={(e) => saveCategory(e, false)}>
                                <div style={{ marginBottom: '1.5rem' }}><label style={labelStyle}>Designation Name</label><input title="Enter unique category designation" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} required style={inputStyle} /></div>
                                <div style={{ marginBottom: '1.5rem' }}><label style={labelStyle}>Short ID Code</label><input title="Unique identifier code (e.g. ELEC)" value={catForm.code} onChange={e => setCatForm({...catForm, code: e.target.value.toUpperCase()})} required style={inputStyle} /></div>
                                <div style={{ marginBottom: '2rem' }}><label style={labelStyle}>Parent Hierarchy</label><select title="Select hierarchical parent node" value={catForm.parentCategory} onChange={e => setCatForm({...catForm, parentCategory: e.target.value})} style={inputStyle}><option value="">-- Master Node --</option>{categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
                                <motion.button whileTap={{ scale: 0.98 }} title="Commit node to database" type="submit" style={{ ...inputStyle, background: '#10b981', color: '#fff', border: 'none', justifyContent: 'center', padding: '1rem' }}>COMMIT SYNCHRONIZATION</motion.button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isProdModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#fff', borderRadius: '32px', padding: '3rem', width: '100%', maxWidth: 550, boxShadow: '0 50px 100px -20px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                                <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem' }}>{editingProd ? 'Sync Module' : 'Archive Module'}</h2>
                                <motion.button whileTap={{ scale: 0.8 }} title="Close Modal" onClick={() => setIsProdModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={24} /></motion.button>
                            </div>
                            <form onSubmit={saveProduct}>
                                <div style={{ marginBottom: '1.5rem' }}><label style={labelStyle}>Module Designation</label><input title="Enter brand/model designation" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} required style={inputStyle} /></div>
                                <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}><label style={{...labelStyle, marginBottom:0}}>Structural Mapping</label><button type="button" title="Establish new structural node" onClick={() => setIsInlineCategory(!isInlineCategory)} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer' }}>{isInlineCategory ? 'CANCEL' : '+ DEFINE NEW'}</button></div>
                                    {isInlineCategory ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                            <input title="New node designation" placeholder="Name" value={inlineCatForm.name} onChange={e => setInlineCatForm({...inlineCatForm, name: e.target.value})} style={{...inputStyle, background: '#fff'}} />
                                            <input title="New node short ID" placeholder="Code" value={inlineCatForm.code} onChange={e => setInlineCatForm({...inlineCatForm, code: e.target.value.toUpperCase()})} style={{...inputStyle, background: '#fff'}} />
                                        </div>
                                    ) : (
                                        <select title="Map module to existing index" value={prodForm.category} onChange={e => setProdForm({...prodForm, category: e.target.value})} style={{...inputStyle, background: '#fff'}}><option value="" disabled>Select structural index...</option>{categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select>
                                    )}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div><label style={labelStyle}>Unit Valuation</label><input title="Set monetary unit value" type="number" step="0.01" value={prodForm.price} onChange={e => setProdForm({...prodForm, price: e.target.value})} required style={inputStyle} /></div>
                                    <div><label style={labelStyle}>Stock Allocation</label><input title="Define available quantity units" type="number" value={prodForm.quantity} onChange={e => setProdForm({...prodForm, quantity: e.target.value})} required style={inputStyle} /></div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2.5rem' }}><input title="Toggle regulatory tax compliance" type="checkbox" id="taxInc" checked={prodForm.isTaxIncluded} onChange={e => setProdForm({...prodForm, isTaxIncluded: e.target.checked})} style={{ width: 18, height: 18 }} /><label htmlFor="taxInc" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569', cursor: 'pointer' }}>Valuation includes active regulatory tax</label></div>
                                <motion.button whileTap={{ scale: 0.98 }} title="Commit module configuration" type="submit" style={{ ...inputStyle, background: '#10b981', color: '#fff', border: 'none', justifyContent: 'center', padding: '1.25rem', fontSize: '1rem' }}>EXECUTE ARCHIVAL</motion.button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

             <AnimatePresence>
                {confirmAction && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#fff', borderRadius: '32px', padding: '3rem', width: '100%', maxWidth: 450, textAlign: 'center', boxShadow: '0 50px 100px -20px rgba(0,0,0,0.4)' }}>
                            <AlertTriangle size={64} color="#ef4444" style={{ marginBottom: '1.5rem', margin: '0 auto' }} />
                            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', color: '#0f172a' }}>Authorize Elimination?</h3>
                            <p style={{ color: '#64748b', marginTop: '1rem', marginBottom: '2.5rem', fontWeight: 600 }}>{confirmAction.message}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}><motion.button whileTap={{ scale: 0.95 }} title="Abort Protocol" onClick={() => setConfirmAction(null)} style={{ padding: '1rem', borderRadius: '16px', border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 800 }}>Abort</motion.button><motion.button whileTap={{ scale: 0.95 }} title="Execute De-Authorization" onClick={() => { confirmAction.onConfirm(); setConfirmAction(null); }} style={{ padding: '1rem', borderRadius: '16px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 800 }}>Confirm</motion.button></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductManagement;
