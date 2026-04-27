import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Search, RefreshCw } from 'lucide-react';
import api from '../../api';

const UserProductCatalog = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]); // added categories state
    const [businessData, setBusinessData] = useState(null);
    const [loading, setLoading] = useState(false);

    // FILTERS
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [prodRes, bizRes, catRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/business'),
                    api.get('/products/categories')
                ]);
                setProducts(prodRes.data.data || []);
                setCategories(catRes.data.data || []);
                if (bizRes.data?.data?.details) {
                    setBusinessData(bizRes.data.data.details);
                }
            } catch (error) {
                console.error("Failed to load products");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getCurrencySymbol = (type) => {
        if (!businessData) return '';
        return type === 'primary' ? businessData.primaryCurrency?.symbol : businessData.secondaryCurrency?.symbol;
    };

    const filteredProducts = products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.productId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCat = categoryFilter === '' || p.category?._id === categoryFilter;
        return matchSearch && matchCat;
    });

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 800, color: '#0f172a' }}>Product Catalog</h1>
                    <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>Browse all available products and services.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <select title="Filter by Category" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', color: '#64748b', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} title="Search Products" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input type="text" placeholder="Search by name or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', width: 280, outline: 'none', fontFamily: "'Outfit', sans-serif" }} />
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><RefreshCw className="animate-spin" color="#64748b" /></div>
            ) : (
                <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                                <th style={{ padding: '1.25rem', color: '#64748b', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>ID</th>
                                <th style={{ padding: '1.25rem', color: '#64748b', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Product Name</th>
                                <th style={{ padding: '1.25rem', color: '#64748b', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Category</th>
                                <th style={{ padding: '1.25rem', color: '#64748b', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Stock Status</th>
                                <th style={{ padding: '1.25rem', color: '#64748b', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(p => (
                                <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '1.25rem', fontWeight: 800, color: '#3b82f6', fontSize: '0.9rem' }}>{p.productId}</td>
                                    <td style={{ padding: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{p.name}</td>
                                    <td style={{ padding: '1.25rem', color: '#64748b', fontSize: '0.9rem' }}>{p.category?.name}</td>
                                    <td style={{ padding: '1.25rem', fontWeight: 700 }}>
                                        {p.quantity > 0 ? (
                                            <span style={{ color: '#059669', background: '#ecfdf5', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem' }}>In Stock</span>
                                        ) : (
                                            <span style={{ color: '#dc2626', background: '#fef2f2', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem' }}>Out of Stock</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                                        {getCurrencySymbol(p.currencyType)} {p.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        {p.isTaxIncluded && <span style={{ fontSize: '0.65rem', background: '#f1f5f9', color: '#94a3b8', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>INC. TAX</span>}
                                    </td>
                                </tr>
                            ))}
                            {filteredProducts.length === 0 && <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>No products found matching your search.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
        </motion.div>
    );
};

export default UserProductCatalog;
