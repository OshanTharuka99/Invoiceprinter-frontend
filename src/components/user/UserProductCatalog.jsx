import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Search, RefreshCw, Layers, CheckCircle2, AlertTriangle } from 'lucide-react';
import api from '../../api';
import '../../styles/modern-table.css';

const UserProductCatalog = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [businessData, setBusinessData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

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
        } catch {
            console.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const getCurrencySymbol = (type) => {
        if (!businessData) return '';
        return type === 'primary' ? businessData.primaryCurrency?.symbol : businessData.secondaryCurrency?.symbol;
    };

    const filteredProducts = products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.productId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCat = categoryFilter === '' || p.category?._id === categoryFilter;
        return matchSearch && matchCat;
    });

    const inStockCount = products.filter(p => p.quantity > 0).length;
    const outOfStockCount = products.filter(p => p.quantity === 0).length;

    return (
        <div className="pm-root">
            <div className="pm-stats">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pm-stat-card blue">
                    <div className="pm-stat-icon blue"><Package size={22} /></div>
                    <div className="pm-stat-body">
                        <div className="pm-stat-value">{products.length}</div>
                        <div className="pm-stat-label">Total Products</div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="pm-stat-card green">
                    <div className="pm-stat-icon green"><CheckCircle2 size={22} /></div>
                    <div className="pm-stat-body">
                        <div className="pm-stat-value">{inStockCount}</div>
                        <div className="pm-stat-label">In Stock</div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="pm-stat-card indigo">
                    <div className="pm-stat-icon indigo"><Layers size={22} /></div>
                    <div className="pm-stat-body">
                        <div className="pm-stat-value">{categories.length}</div>
                        <div className="pm-stat-label">Categories</div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="pm-stat-card red">
                    <div className="pm-stat-icon red"><AlertTriangle size={22} /></div>
                    <div className="pm-stat-body">
                        <div className="pm-stat-value">{outOfStockCount}</div>
                        <div className="pm-stat-label">Out of Stock</div>
                    </div>
                </motion.div>
            </div>

            <div className="pm-card">
                <div className="pm-card-header">
                    <div className="pm-card-title">
                        <div className="pm-card-icon green"><Package size={22} /></div>
                        <div>
                            <h3>Product Catalog</h3>
                            <div className="pm-card-subtitle">Browse all available products and services.</div>
                        </div>
                    </div>
                    <div className="pm-card-actions">
                        <select title="Filter by Category" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="pm-filter-select">
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                        <div className="pm-search-wrap">
                            <Search size={14} className="pm-search-icon" />
                            <input type="text" placeholder="Search by name or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pm-search-input" />
                        </div>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={fetchData} className="pm-btn pm-btn-outline"><RefreshCw size={16} /></motion.button>
                    </div>
                </div>

                {loading ? (
                    <div className="pm-loading"><RefreshCw className="animate-spin" size={20} /> Loading...</div>
                ) : (
                    <div className="modern-table-card">
                        <div className="modern-table-scroll">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Product Name</th>
                                        <th>Category</th>
                                        <th>Stock Status</th>
                                        <th>Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map(p => (
                                        <tr key={p._id}>
                                            <td><span className="modern-table-cell-subtitle blue">{p.productId}</span></td>
                                            <td><span className="modern-table-cell-title">{p.name}</span></td>
                                            <td><span className="modern-table-cell-info muted">{p.category?.name}</span></td>
                                            <td>
                                                {p.quantity > 0 ? (
                                                    <span className="modern-table-status paid">In Stock</span>
                                                ) : (
                                                    <span className="modern-table-status unpaid">Out of Stock</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="modern-table-cell-value">
                                                    {getCurrencySymbol(p.currencyType)} {p.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                                {p.isTaxIncluded && <span className="modern-table-badge gray" style={{ marginLeft: '6px' }}>INC. TAX</span>}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredProducts.length === 0 && <tr><td colSpan="5" className="modern-table-empty">No products found matching your search.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProductCatalog;
