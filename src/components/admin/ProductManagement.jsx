import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Tag, Plus, X, Edit3, Trash2, CheckCircle, RefreshCw, FolderTree, FilePlus, Search, AlertTriangle } from 'lucide-react';
import api from '../../api';

const ProductManagement = ({ currentUser, showToast }) => {
    const [activeTab, setActiveTab] = useState('products');
    
    // DATA
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [businessData, setBusinessData] = useState(null);
    const [loading, setLoading] = useState(false);

    // FILTERS
    const [categorySearch, setCategorySearch] = useState('');
    const [productCatFilter, setProductCatFilter] = useState('');

    // CONFIRMATION MODAL
    const [confirmAction, setConfirmAction] = useState(null);

    // MODALS
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [isProdModalOpen, setIsProdModalOpen] = useState(false);

    // FORMS
    const [editingCat, setEditingCat] = useState(null);
    const [catForm, setCatForm] = useState({ name: '', code: '', parentCategory: '' });

    const [editingProd, setEditingProd] = useState(null);
    const [prodForm, setProdForm] = useState({ name: '', category: '', price: '', currencyType: 'primary', isTaxIncluded: false, quantity: 0 });

    // INLINE CATEGORY
    const [isInlineCategory, setIsInlineCategory] = useState(false);
    const [inlineCatForm, setInlineCatForm] = useState({ name: '', code: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catRes, prodRes, bizRes] = await Promise.all([
                api.get('/products/categories'),
                api.get('/products'),
                api.get('/business')
            ]);
            setCategories(catRes.data.data || []);
            setProducts(prodRes.data.data || []);
            if (bizRes.data?.data?.details) {
                setBusinessData(bizRes.data.data.details);
            }
        } catch (error) {
            showToast?.('Error loading product data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const hasAccess = ['root', 'admin'].includes(currentUser?.role);

    // CATEGORY HANDLERS
    const openCatModal = (cat = null) => {
        if (cat) {
            setEditingCat(cat);
            setCatForm({ name: cat.name, code: cat.code, parentCategory: cat.parentCategory?._id || '' });
        } else {
            setEditingCat(null);
            setCatForm({ name: '', code: '', parentCategory: '' });
        }
        setIsCatModalOpen(true);
    };

    const saveCategory = async (e, inline = false) => {
        if (e) e.preventDefault();
        try {
            if (inline) {
                const res = await api.post('/products/categories', { name: inlineCatForm.name, code: inlineCatForm.code });
                showToast?.('Inline category created', 'success');
                fetchData();
                return res.data.data;
            }

            if (editingCat) {
                await api.put(`/products/categories/${editingCat._id}`, { ...catForm, parentCategory: catForm.parentCategory || null });
                showToast?.('Category updated successfully', 'success');
            } else {
                await api.post('/products/categories', { ...catForm, parentCategory: catForm.parentCategory || null });
                showToast?.('Category created successfully', 'success');
            }
            
            setIsCatModalOpen(false);
            setCatForm({ name: '', code: '', parentCategory: '' });
            fetchData();
        } catch (error) {
            showToast?.(error.response?.data?.message || 'Error saving category', 'error');
            return null;
        }
    };

    const deleteCategory = async (id) => {
        setConfirmAction({
            message: "Are you sure you want to permanently delete this category? This action cannot be undone.",
            onConfirm: async () => {
                try {
                    await api.delete(`/products/categories/${id}`);
                    showToast?.('Category deleted', 'success');
                    fetchData();
                } catch (error) {
                    showToast?.(error.response?.data?.message || 'Error deleting category', 'error');
                }
            }
        });
    };

    // PRODUCT HANDLERS
    const openProdModal = (prod = null) => {
        if (prod) {
            setEditingProd(prod);
            setProdForm({
                name: prod.name,
                category: prod.category?._id || '',
                price: prod.price,
                currencyType: prod.currencyType || 'primary',
                isTaxIncluded: prod.isTaxIncluded || false,
                quantity: prod.quantity || 0
            });
        } else {
            setEditingProd(null);
            setProdForm({ name: '', category: '', price: '', currencyType: 'primary', isTaxIncluded: false, quantity: 0 });
        }
        setIsInlineCategory(false);
        setInlineCatForm({ name: '', code: '' });
        setIsProdModalOpen(true);
    };

    const saveProduct = async (e) => {
        e.preventDefault();
        try {
            let finalCategoryId = prodForm.category;

            if (isInlineCategory) {
                if (!inlineCatForm.name || !inlineCatForm.code) {
                    return showToast?.('Please fill out inline category details', 'error');
                }
                const newCat = await saveCategory(null, true);
                if (!newCat) return;
                finalCategoryId = newCat._id;
            } else if (!finalCategoryId) {
                return showToast?.('Please select a category', 'error');
            }

            const payload = { ...prodForm, category: finalCategoryId };

            if (editingProd) {
                await api.put(`/products/${editingProd._id}`, payload);
                showToast?.('Product updated successfully', 'success');
            } else {
                await api.post('/products', payload);
                showToast?.('Product added successfully', 'success');
            }
            setIsProdModalOpen(false);
            fetchData();
        } catch (error) {
            showToast?.(error.response?.data?.message || 'Error saving product', 'error');
        }
    };

    const deleteProduct = async (id) => {
        setConfirmAction({
            message: "Are you sure you want to delete this product from the database?",
            onConfirm: async () => {
                try {
                    await api.delete(`/products/${id}`);
                    showToast?.('Product deleted successfully', 'success');
                    fetchData();
                } catch (error) {
                    showToast?.('Error deleting product', 'error');
                }
            }
        });
    };

    // UTILS & STYLES
    const getCurrencySymbol = (type) => {
        if (!businessData) return '';
        return type === 'primary' ? businessData.primaryCurrency?.symbol : businessData.secondaryCurrency?.symbol;
    };
    const getCurrencyCode = (type) => {
        if (!businessData) return '';
        return type === 'primary' ? businessData.primaryCurrency?.code : businessData.secondaryCurrency?.code;
    };

    const formatPriceString = (val) => {
        if (val === '' || val === undefined || val === null) return '';
        const parts = val.toString().split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join('.');
    };

    const handlePriceChange = (e) => {
        let val = e.target.value.replace(/,/g, '');
        if (val === '' || /^\d*\.?\d*$/.test(val)) {
            setProdForm({...prodForm, price: val});
        }
    };

    const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()) || c.code.toLowerCase().includes(categorySearch.toLowerCase()));
    const filteredProducts = products.filter(p => productCatFilter === '' || p.category?._id === productCatFilter);

    const cardStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
    const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#64748b', marginBottom: '0.6rem', textTransform: 'uppercase' };
    const inputStyle = { width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '0.9rem 1.25rem', color: '#0f172a', outline: 'none', fontWeight: 600, boxSizing: 'border-box' };
    const btnStyle = { background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '6px', borderRadius: '16px', marginBottom: '2.5rem', width: 'fit-content' }}>
                <motion.button whileTap={{ scale: 0.95 }} title="View Products" onClick={() => setActiveTab('products')} style={{ padding: '0.8rem 1.5rem', border: 'none', background: activeTab === 'products' ? '#0f172a' : 'transparent', color: activeTab === 'products' ? '#fff' : '#64748b', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', transition: '0.3s' }}>Products Catalog</motion.button>
                <motion.button whileTap={{ scale: 0.95 }} title="View Categories" onClick={() => setActiveTab('categories')} style={{ padding: '0.8rem 1.5rem', border: 'none', background: activeTab === 'categories' ? '#0f172a' : 'transparent', color: activeTab === 'categories' ? '#fff' : '#64748b', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', transition: '0.3s' }}>Categories</motion.button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><RefreshCw className="animate-spin" color="#64748b" /></div>
            ) : (
                <AnimatePresence mode="wait">
                    {activeTab === 'categories' ? (
                        <motion.div key="cat" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                            <div style={{ ...cardStyle }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><div style={{ background: '#3b82f615', color: '#3b82f6', padding: '10px', borderRadius: '12px' }}><FolderTree size={24} /></div> <h3 style={{ margin: 0, fontWeight: 900 }}>Category Structure</h3></div>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        <div style={{ position: 'relative' }}>
                                            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                            <input type="text" placeholder="Search categories..." value={categorySearch} onChange={e => setCategorySearch(e.target.value)} style={{ padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', width: 220, outline: 'none', fontFamily: "'Outfit', sans-serif" }} />
                                        </div>
                                        {hasAccess && <motion.button whileTap={{ scale: 0.95 }} title="Create a new category" onClick={() => openCatModal()} style={btnStyle}><Plus size={18} /> New Category</motion.button>}
                                    </div>
                                </div>

                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                            <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Name</th>
                                            <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Code</th>
                                            <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Parent Category</th>
                                            {hasAccess && <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCategories.map(c => (
                                            <tr key={c._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '1rem', fontWeight: 700, color: '#0f172a' }}>{c.name}</td>
                                                <td style={{ padding: '1rem' }}><span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem', color: '#64748b' }}>{c.code}</span></td>
                                                <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>{c.parentCategory?.name || '-'}</td>
                                                {hasAccess && (
                                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                            <motion.button whileTap={{ scale: 0.9 }} title="Edit Category" onClick={() => openCatModal(c)} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}><Edit3 size={16} /></motion.button>
                                                            <motion.button whileTap={{ scale: 0.9 }} title="Delete Category" onClick={() => deleteCategory(c._id)} style={{ background: '#fff1f2', color: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={16} /></motion.button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                        {filteredCategories.length === 0 && <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No categories found matching your criteria.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="prod" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                            <div style={{ ...cardStyle }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><div style={{ background: '#10b98115', color: '#10b981', padding: '10px', borderRadius: '12px' }}><Package size={24} /></div> <h3 style={{ margin: 0, fontWeight: 900 }}>Product Directory</h3></div>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        <select title="Filter by Category" value={productCatFilter} onChange={e => setProductCatFilter(e.target.value)} style={{ padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', color: '#64748b', fontWeight: 600 }}>
                                            <option value="">All Categories</option>
                                            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                        </select>
                                        {hasAccess && <motion.button whileTap={{ scale: 0.95 }} title="Add a new product" onClick={() => openProdModal()} style={btnStyle}><FilePlus size={18} /> Add Product</motion.button>}
                                    </div>
                                </div>

                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                            <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Product ID</th>
                                            <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Product Name</th>
                                            <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Category</th>
                                            <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Price</th>
                                            <th style={{ padding: '1rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>Stock</th>
                                            {hasAccess && <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.map(p => (
                                            <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '1rem', fontWeight: 800, color: '#3b82f6', fontSize: '0.9rem' }}>{p.productId}</td>
                                                <td style={{ padding: '1rem', fontWeight: 700, color: '#0f172a' }}>{p.name}</td>
                                                <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>{p.category?.name}</td>
                                                <td style={{ padding: '1rem', fontWeight: 800, color: '#0f172a' }}>
                                                    {getCurrencySymbol(p.currencyType)} {p.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td style={{ padding: '1rem', fontWeight: 700 }}>
                                                    {p.quantity > 0 ? (
                                                        <span style={{ color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>In Stock ({p.quantity})</span>
                                                    ) : (
                                                        <span style={{ color: '#dc2626', background: '#fef2f2', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Out of Stock</span>
                                                    )}
                                                </td>
                                                {hasAccess && (
                                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                            <motion.button whileTap={{ scale: 0.9 }} title="Edit Product" onClick={() => openProdModal(p)} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}><Edit3 size={16} /></motion.button>
                                                            <motion.button whileTap={{ scale: 0.9 }} title="Delete Product" onClick={() => deleteProduct(p._id)} style={{ background: '#fff1f2', color: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={16} /></motion.button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                        {filteredProducts.length === 0 && <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No products found.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* CONFIRMATION MODAL */}
            <AnimatePresence>
                {confirmAction && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: 400, textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                            <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem', margin: '0 auto' }} />
                            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}>Are you sure?</h3>
                            <p style={{ color: '#64748b', marginTop: '0.8rem', marginBottom: '2rem', lineHeight: '1.5' }}>{confirmAction.message}</p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setConfirmAction(null)} style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 700, color: '#0f172a' }}>Cancel</motion.button>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => { confirmAction.onConfirm(); setConfirmAction(null); }} style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Yes, Delete</motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* CATEGORY MODAL */}
            {isCatModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: 400, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <h2 style={{ margin: 0, fontWeight: 900 }}>{editingCat ? 'Edit Category' : 'New Category'}</h2>
                            <motion.button whileTap={{ scale: 0.9 }} title="Close" onClick={() => setIsCatModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></motion.button>
                        </div>
                        <form onSubmit={(e) => saveCategory(e, false)}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={labelStyle}>Category Name</label>
                                <input value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} required style={inputStyle} placeholder="e.g. Electric Generators" />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={labelStyle}>Short Code <span style={{ color: '#94a3b8', fontWeight: 500, textTransform: 'none' }}>(ex: ELEC)</span></label>
                                <input value={catForm.code} onChange={e => setCatForm({...catForm, code: e.target.value.toUpperCase()})} required maxLength={10} style={inputStyle} placeholder="ELEC" />
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={labelStyle}>Parent Category (Optional)</label>
                                <select value={catForm.parentCategory} onChange={e => setCatForm({...catForm, parentCategory: e.target.value})} style={inputStyle}>
                                    <option value="">-- None (Main Category) --</option>
                                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <motion.button whileTap={{ scale: 0.98 }} title="Save Category" type="submit" style={{ ...btnStyle, width: '100%', justifyContent: 'center' }}>{editingCat ? 'Update Category' : 'Save Category'}</motion.button>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* PRODUCT MODAL */}
            {isProdModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: 500, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <h2 style={{ margin: 0, fontWeight: 900 }}>{editingProd ? 'Edit Product' : 'Add New Product'}</h2>
                            <motion.button whileTap={{ scale: 0.9 }} title="Close" onClick={() => setIsProdModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></motion.button>
                        </div>
                        <form onSubmit={saveProduct}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={labelStyle}>Product Name / Brand & Model</label>
                                <input value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} required style={inputStyle} placeholder="e.g. Yamaha EF2000iSv2" />
                            </div>
                            
                            <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <label style={{...labelStyle, marginBottom: 0}}>Category Selection</label>
                                    {!isInlineCategory ? (
                                        <button type="button" title="Create a new category immediately" onClick={() => setIsInlineCategory(true)} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Plus size={14}/> Create New</button>
                                    ) : (
                                        <button type="button" title="Cancel creating a new category" onClick={() => setIsInlineCategory(false)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><X size={14}/> Cancel</button>
                                    )}
                                </div>
                                
                                {!isInlineCategory ? (
                                    <select value={prodForm.category} onChange={e => setProdForm({...prodForm, category: e.target.value})} required style={{...inputStyle, background: '#fff'}} title="Select existing category">
                                        <option value="" disabled>Select an existing category...</option>
                                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.8rem' }}>
                                        <input value={inlineCatForm.name} onChange={e => setInlineCatForm({...inlineCatForm, name: e.target.value})} required style={{...inputStyle, background: '#fff', padding: '0.7rem 1rem'}} placeholder="New Category Name" title="Enter new category name" />
                                        <input value={inlineCatForm.code} onChange={e => setInlineCatForm({...inlineCatForm, code: e.target.value.toUpperCase()})} required maxLength={10} style={{...inputStyle, background: '#fff', padding: '0.7rem 1rem'}} placeholder="Code (e.g. ELEC)" title="Enter a short unique code for this category" />
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={labelStyle}>Price</label>
                                    <input type="text" value={formatPriceString(prodForm.price)} onChange={handlePriceChange} required style={inputStyle} placeholder="0.00" title="Enter product price" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Quantity in Stock</label>
                                    <input type="number" min="0" value={prodForm.quantity} onChange={e => setProdForm({...prodForm, quantity: e.target.value})} required style={inputStyle} placeholder="0" title="Enter quantity available" />
                                </div>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={labelStyle}>Currency Processing</label>
                                <select value={prodForm.currencyType} onChange={e => setProdForm({...prodForm, currencyType: e.target.value})} required style={inputStyle} title="Select currency type">
                                    <option value="primary">Primary Base ({getCurrencyCode('primary')})</option>
                                    <option value="secondary">Secondary Layer ({getCurrencyCode('secondary')})</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <input type="checkbox" id="taxInc" checked={prodForm.isTaxIncluded} onChange={e => setProdForm({...prodForm, isTaxIncluded: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#0f172a' }} title="Toggle if tax is included" />
                                <label htmlFor="taxInc" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }} title="Toggle if tax is included">Price is inclusive of taxes</label>
                            </div>
                            <motion.button whileTap={{ scale: 0.98 }} title="Save Product details" type="submit" style={{ ...btnStyle, width: '100%', justifyContent: 'center', padding: '1rem' }}>
                                {editingProd ? 'Update Product Details' : 'Add New Product'}
                            </motion.button>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default ProductManagement;
