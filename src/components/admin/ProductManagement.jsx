import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { Package, Plus, X, Edit2, Trash2, RefreshCw, FolderTree, Search,
  AlertTriangle, FileText, BarChart3, ShieldCheck, Hash, FileSpreadsheet,
  MapPin, DollarSign, Tag, Layers, Truck, CalendarClock } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../api';
import useSubmitGuard from '../../utils/useSubmitGuard';
import PriceInput from '../../utils/PriceInput';
import './ProductManagement.css';
import '../../styles/modern-table.css';

const FV = { initial:{opacity:0,y:8}, animate:{opacity:1,y:0}, exit:{opacity:0,y:-8} };
const FM = { initial:{scale:0.95,opacity:0}, animate:{scale:1,opacity:1}, exit:{scale:0.95,opacity:0} };
const EMPTY_PROD = { name:'', category:'', price:'', currencyType:'primary', isTaxIncluded:false, description:'', warrantyPeriod:'' };
const EMPTY_STOCK = { location:'', buyingPrice:'', quantity:'', warrantyPeriod:'', notes:'', supplierRef:'', supplierInvoiceNumber:'', supplierDeliveryNumber:'', acquisitionType:'cash', creditPeriod:'', advanceAmount:'' };
const STOCK_LOCATIONS = ['Showroom', 'Warehouse A', 'Warehouse B', 'Store Room', 'Main Store'];
const MODIFY_REASONS = {
  stock: ['Stock Level Correction', 'Damaged / Broken Stock', 'Data Entry Error', 'Incorrect Serial Number', 'Stock Location Correction', 'Supplier Return'],
  product: ['Correction of Name / Code', 'Pricing Update', 'Description Update', 'Warranty Period Change', 'Tax Settings Change', 'Category Reorganization'],
  category: ['Correction of Name / Code', 'Category Reorganization', 'Data Entry Error']
};

const ProductManagement = ({ currentUser, showToast }) => {
  const [activeTab, setActiveTab] = useState('products');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [businessData, setBusinessData] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [prodSearch, setProdSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [viewProd, setViewProd] = useState(null);
  const [stockEntries, setStockEntries] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [catModal, setCatModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [catForm, setCatForm] = useState({ name:'', code:'', parentCategory:'' });
  const [prodModal, setProdModal] = useState(false);
  const [editProd, setEditProd] = useState(null);
  const [prodForm, setProdForm] = useState(EMPTY_PROD);
  const [inlineCat, setInlineCat] = useState(false);
  const [inlineCatForm, setInlineCatForm] = useState({ name:'', code:'' });
  const [stockModal, setStockModal] = useState(false);
  const [stockProd, setStockProd] = useState(null);
  const [stockForm, setStockForm] = useState(EMPTY_STOCK);
  const [useSerials, setUseSerials] = useState(false);
  const [serials, setSerials] = useState([]);
  const [serialInput, setSerialInput] = useState('');
  const [existingStockSerials, setExistingStockSerials] = useState([]);
  const excelRef = useRef(null);
  const isAdmin = ['root','admin'].includes(currentUser?.role);

  // Edit Batch Modal
  const [editBatchModal, setEditBatchModal] = useState(null);
  const [editBatchForm, setEditBatchForm] = useState({ location: '', buyingPrice: '', quantity: '', notes: '', supplierInvoiceNumber: '', acquisitionType: 'cash', creditPeriod: '', advanceAmount: '' });
  const [editBatchReason, setEditBatchReason] = useState('');
  const [editBatchSerials, setEditBatchSerials] = useState([]);
  const [editBatchSerialInput, setEditBatchSerialInput] = useState('');
  const [editBatchAvailableSerials, setEditBatchAvailableSerials] = useState([]);
  const [editBatchUseSerials, setEditBatchUseSerials] = useState(false);

  // Edit Request (standard user flow)
  const [editReqModal, setEditReqModal] = useState(null);
  const [editReqReason, setEditReqReason] = useState('');
  const { isSubmitting, runGuarded } = useSubmitGuard();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cr, pr] = await Promise.all([
        api.get('/products/categories'),
        api.get('/products'),
      ]);
      setCategories(cr.data.data || []);
      setProducts(pr.data.data || []);
      api.get('/business').then((br) => {
        if (br.data?.data?.details) setBusinessData(br.data.data.details);
      }).catch(() => {});
      api.get('/suppliers').then((sr) => {
        setSuppliers(sr.data?.data || []);
      }).catch(() => setSuppliers([]));
    } catch (err) {
      console.error('Product data load failed:', err);
      showToast?.('Error loading data', 'error');
    }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const onSupplierCreated = async (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'invoiprint:supplier-created') return;
      const supplier = event.data.supplier;
      if (!supplier) return;
      setSuppliers(prev => [...prev.filter(s => s._id !== supplier._id), supplier]);
      setStockForm(prev => ({ ...prev, supplierRef: supplier._id }));
      try {
        const res = await api.get('/suppliers');
        setSuppliers(res.data.data || []);
      } catch (err) { console.error('Supplier refresh failed:', err); }
      showToast?.(`Supplier ${supplier.name} added`, 'success');
    };
    window.addEventListener('message', onSupplierCreated);
    return () => window.removeEventListener('message', onSupplierCreated);
  }, [showToast]);

  const fetchStockEntries = async (pid) => {
    setStockLoading(true);
    try {
      const res = await api.get(`/products/${pid}/stock`);
      setStockEntries((res.data.data || []).filter((e) => Number(e.quantity || 0) > 0));
    } catch { setStockEntries([]); }
    finally { setStockLoading(false); }
  };
  const openSupplierPopup = () => {
    const popup = window.open('/supplier-new', 'invoiprint-supplier', 'width=680,height=760');
    if (!popup) showToast?.('Allow pop-ups to create a new supplier','error');
  };

  const openView = (p) => { setViewProd(p); fetchStockEntries(p._id); };

  // ── Category CRUD ─────────────────────────────────────────────────────────
  const openCatModal = (c = null) => {
    setEditCat(c);
    setCatForm(c ? { name:c.name, code:c.code, parentCategory:c.parentCategory?._id||'' }
                 : { name:'', code:'', parentCategory:'' });
    setCatModal(true);
  };
  const submitEditRequest = async (type, targetId, targetName, proposedChanges) => {
    if (!editReqReason.trim()) { showToast?.('Please select a reason for modification', 'error'); return; }
    await runGuarded(async () => {
      try {
        await api.post('/products/inventory-requests', { type, targetId, targetName, proposedChanges, reason: editReqReason });
        showToast?.('Edit request submitted for approval', 'success');
        setEditReqModal(null); setEditReqReason(''); setCatModal(false); setProdModal(false); fetchData();
      } catch(err) { showToast?.(err.response?.data?.message || 'Failed to submit request', 'error'); }
    });
  };

  const saveCat = async (e, inline = false) => {
    if (e) e.preventDefault();
    const run = async () => {
      if (inline) {
        const res = await api.post('/products/categories', { name:inlineCatForm.name });
        showToast?.('Category created', 'success');
        fetchData();
        return res.data.data;
      }
      if (editCat) {
        if (isAdmin) {
          await api.put(`/products/categories/${editCat._id}`, { ...catForm, parentCategory:catForm.parentCategory||null });
          showToast?.('Category updated', 'success');
          setCatModal(false); fetchData();
        } else {
          setEditReqModal({ type: 'Category', targetId: editCat._id, targetName: catForm.name, proposedChanges: catForm });
          setEditReqReason('');
        }
      } else {
        await api.post('/products/categories', { ...catForm, parentCategory:catForm.parentCategory||null });
        showToast?.('Category created', 'success');
        setCatModal(false); fetchData();
      }
    };
    if (inline) {
      try {
        return await run();
      } catch(err) {
        showToast?.(err.response?.data?.message || 'Error', 'error');
        return null;
      }
    }
    await runGuarded(async () => {
      try {
        await run();
      } catch(err) { showToast?.(err.response?.data?.message || 'Error', 'error'); }
    });
  };
  const deleteCat = (id) => setConfirm({
    msg: 'Delete this category? Products assigned to it may be affected.',
    onConfirm: async () => {
      try { await api.delete(`/products/categories/${id}`); showToast?.('Category deleted','success'); fetchData(); }
      catch(e) { showToast?.(e.response?.data?.message||'Error','error'); }
    }
  });

  // ── Product CRUD ──────────────────────────────────────────────────────────
  const openProdModal = (p = null) => {
    setEditProd(p);
    setProdForm(p ? { name:p.name, category:p.category?._id||'', price:p.price,
      currencyType:p.currencyType||'primary', isTaxIncluded:p.isTaxIncluded||false,
      description:p.description||'', warrantyPeriod:p.warrantyPeriod||'' } : EMPTY_PROD);
    setInlineCat(false); setInlineCatForm({ name:'', code:'' });
    setProdModal(true);
  };
  const saveProd = async (e) => {
    e.preventDefault();
    await runGuarded(async () => {
      try {
        let catId = prodForm.category;
        if (inlineCat) {
          if (!inlineCatForm.name) return showToast?.('Fill category name','error');
          const nc = await saveCat(null, true);
          if (!nc) return;
          catId = nc._id;
        } else if (!catId) return showToast?.('Select a category','error');
        const payload = { ...prodForm, category:catId };
        if (editProd) {
          if (isAdmin) {
            await api.put(`/products/${editProd._id}`, payload);
            showToast?.('Product updated', 'success');
            setProdModal(false); fetchData();
          } else {
            setEditReqModal({ type: 'Product', targetId: editProd._id, targetName: prodForm.name, proposedChanges: payload });
            setEditReqReason('');
          }
        } else {
          await api.post('/products', payload);
          showToast?.('Product created', 'success');
          setProdModal(false); fetchData();
        }
      } catch(err) { showToast?.(err.response?.data?.message||'Error','error'); }
    });
  };
  const deleteProd = (id) => setConfirm({
    msg: 'Permanently delete this product and all its stock records?',
    onConfirm: async () => {
      try { await api.delete(`/products/${id}`); showToast?.('Product deleted','success'); fetchData(); }
      catch { showToast?.('Error deleting product','error'); }
    }
  });

  // ── Stock Entry ───────────────────────────────────────────────────────────
  const openStockModal = async (p) => {
    setStockProd(p); setStockForm({ ...EMPTY_STOCK, warrantyPeriod: p.warrantyPeriod || '' });
    setSerials([]); setSerialInput(''); setUseSerials(false); setExistingStockSerials([]);
    // Pre-load existing serials for this product to enable duplicate detection
    try {
      const res = await api.get(`/products/${p._id}/stock`);
      const allSerials = (res.data.data || []).flatMap(e => e.serialNumbers || []);
      setExistingStockSerials(allSerials.map(s => s.toUpperCase()));
    } catch { setExistingStockSerials([]); }
    setStockModal(true);
  };
  const addSerial = () => {
    const v = serialInput.trim().toUpperCase();
    if (!v) return;
    if (serials.includes(v)) return showToast?.(`Serial "${v}" already in the current list`, 'error');
    if (existingStockSerials.includes(v)) return showToast?.(`Serial "${v}" already exists in stock for this product`, 'error');
    setSerials(prev => [...prev, v]); setSerialInput('');
  };
  const removeSerial = (i) => setSerials(prev => prev.filter((_,idx) => idx !== i));
  const handleExcel = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type:'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header:1 });
        const extracted = rows.map(r => String(r[0]||'').trim().toUpperCase()).filter(Boolean);
        const unique = [...new Set(extracted)];
        setSerials(prev => {
          const merged = [...new Set([...prev, ...unique])];
          showToast?.(`Imported ${unique.length} serials (${merged.length} total)`, 'success');
          return merged;
        });
      } catch { showToast?.('Failed to parse file','error'); }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };
  const saveStock = async (e) => {
    e.preventDefault();
    if (!stockProd) return;
    const qty = parseInt(stockForm.quantity, 10);
    if (isNaN(qty) || qty < 1) return showToast?.('Enter a valid quantity','error');
    if (!stockForm.supplierInvoiceNumber.trim()) return showToast?.('Supplier invoice number is required','error');
    if (useSerials && serials.length > 0 && serials.length !== qty)
      return showToast?.(`Serial count (${serials.length}) must match quantity (${qty})`,'error');
    if (stockForm.acquisitionType === 'credit' && !validCreditPeriod(stockForm.creditPeriod))
      return showToast?.('Enter a period like "30 days" or "2 months"','error');
    if (stockForm.acquisitionType === 'advance') {
      const advance = Number(stockForm.advanceAmount);
      if (isNaN(advance) || advance <= 0 || advance >= stockTotal(stockForm))
        return showToast?.('Advance amount must be greater than zero and less than the total stock value','error');
      if (!validCreditPeriod(stockForm.creditPeriod))
        return showToast?.('Enter a period like "30 days" or "2 months"','error');
    }
    await runGuarded(async () => {
      try {
        await api.post(`/products/${stockProd._id}/stock`, {
          ...stockForm,
          quantity: qty,
          supplierRef: stockForm.supplierRef || null,
          serialNumbers: useSerials ? serials : [],
          creditPeriod: stockForm.acquisitionType === 'cash' ? '' : stockForm.creditPeriod,
          advanceAmount: stockForm.acquisitionType === 'advance' ? Number(stockForm.advanceAmount) : 0,
        });
        showToast?.(stockForm.acquisitionType === 'credit' ? 'Stock entry saved successfully' : 'Stock entry saved — payment expense created','success');
        setStockModal(false); fetchData();
      } catch(err) { showToast?.(err.response?.data?.message||'Error','error'); }
    });
  };

  const sym = (t) => businessData ? (t==='primary' ? businessData.primaryCurrency?.symbol||'' : businessData.secondaryCurrency?.symbol||'') : '';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—';
  const stockTotal = (form) => parseInt(form.quantity,10) > 0 ? parseInt(form.quantity,10) * (parseFloat(form.buyingPrice)||0) : 0;
  const validCreditPeriod = (value) => /^\s*\d+\s*(day|days|week|weeks|month|months|year|years)\s*$/i.test(String(value || ''));
  const validAdvanceInput = (raw, total) => {
    if (raw === '') return true;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) {
      showToast?.('Enter a valid advance amount','error');
      return false;
    }
    if (value >= total) {
      showToast?.('Advance must be less than the total stock value','error');
      return false;
    }
    return true;
  };
  const dueStyle = (d) => {
    if (!d) return { color: '#64748b', fontWeight: 700 };
    const diff = new Date(d).getTime() - Date.now();
    return { color: diff < 0 ? '#dc2626' : diff <= 7 * 86400000 ? '#b45309' : '#64748b', fontWeight: 700 };
  };
  const filtCats = categories.filter(c => String(c.name || '').toLowerCase().includes(catSearch.toLowerCase()) || String(c.code || '').toLowerCase().includes(catSearch.toLowerCase()));
  const filtProds = products.filter(p => {
    const matchCat = !catFilter || p.category?._id === catFilter;
    const matchQ = String(p.name || '').toLowerCase().includes(prodSearch.toLowerCase()) || String(p.productId || '').toLowerCase().includes(prodSearch.toLowerCase());
    return matchCat && matchQ;
  });

  const inStock   = products.filter(p => p.quantity > 0).length;
  const outOfStock = products.filter(p => p.quantity === 0).length;
  const AVATAR_COLORS = ['#4f46e5','#059669','#dc2626','#d97706','#0891b2','#7c3aed','#be185d'];
  const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0)||0) % AVATAR_COLORS.length];

  return (
    <div className="pm-root">
      {/* Stats Bar */}
      <div className="pm-stats">
        <div className="pm-stat-card blue">
          <div className="pm-stat-icon blue"><Package size={22}/></div>
          <div className="pm-stat-body">
            <div className="pm-stat-value">{products.length}</div>
            <div className="pm-stat-label">Total Products</div>
          </div>
        </div>
        <div className="pm-stat-card green">
          <div className="pm-stat-icon green"><BarChart3 size={22}/></div>
          <div className="pm-stat-body">
            <div className="pm-stat-value">{inStock}</div>
            <div className="pm-stat-label">In Stock</div>
          </div>
        </div>
        <div className="pm-stat-card red">
          <div className="pm-stat-icon red"><AlertTriangle size={22}/></div>
          <div className="pm-stat-body">
            <div className="pm-stat-value">{outOfStock}</div>
            <div className="pm-stat-label">Out of Stock</div>
          </div>
        </div>
        <div className="pm-stat-card indigo">
          <div className="pm-stat-icon indigo"><Layers size={22}/></div>
          <div className="pm-stat-body">
            <div className="pm-stat-value">{categories.length}</div>
            <div className="pm-stat-label">Categories</div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="pm-tabs">
          {[['products','Products'],['categories','Categories']].map(([key,label]) => (
            <button key={key} className={`pm-tab-btn ${activeTab===key?'active':''}`} onClick={()=>setActiveTab(key)}>{label}</button>
          ))}
        </div>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}>
            <RefreshCw className="animate-spin" size={14}/> Refreshing...
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
          {/* CATEGORIES TAB */}
          {activeTab==='categories' ? (
            <Motion.div key="cat" {...FV}>
              <div className="pm-card">
                <div className="pm-card-header">
                  <div className="pm-card-title">
                    <div className="pm-card-icon blue"><FolderTree size={22}/></div>
                    <h3>Categories</h3>
                  </div>
                  <div className="pm-card-actions">
                    <div className="pm-search-wrap">
                      <Search size={14} className="pm-search-icon"/>
                      <input className="pm-search-input" placeholder="Search categories..." value={catSearch} onChange={e=>setCatSearch(e.target.value)}/>
                    </div>
                    <button className="pm-btn pm-btn-primary" onClick={()=>openCatModal()}><Plus size={16}/>New Category</button>
                  </div>
                </div>
                <div className="modern-table-card">
                  <div className="modern-table-scroll">
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Code</th>
                        <th>Parent</th>
                        <th className="text-center" style={{width:'150px'}}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtCats.length===0
                        ? <tr><td colSpan={4} className="pm-empty modern-table-empty">No categories found</td></tr>
                        : filtCats.map(c=>(
                          <tr key={c._id}>
                            <td style={{fontWeight:700, color:'#0f172a', fontSize:'0.9rem'}}>{c.name}</td>
                            <td><span className="pm-badge pm-badge-code">{c.code}</span></td>
                            <td style={{color:'var(--pm-text-2)',fontWeight:600}}>{c.parentCategory?.name||'—'}</td>
                            <td><div className="modern-table-actions">
                              <button className="pm-btn pm-btn-edit modern-table-action edit" onClick={()=>openCatModal(c)}><Edit2 size={14} /></button>
                              {isAdmin&&<button className="pm-btn pm-btn-danger modern-table-action delete" onClick={()=>deleteCat(c._id)}><Trash2 size={14} /></button>}
                            </div></td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>
            </Motion.div>
          ) : (
            /* PRODUCTS TAB */
            <Motion.div key="prod" {...FV}>
              <div className="pm-card">
                <div className="pm-card-header">
                  <div className="pm-card-title">
                    <div className="pm-card-icon green"><Package size={22}/></div>
                    <h3>Product Catalog</h3>
                  </div>
                  <div className="pm-card-actions">
                    <div className="pm-search-wrap">
                      <Search size={14} className="pm-search-icon"/>
                      <input className="pm-search-input" placeholder="Search products..." value={prodSearch} onChange={e=>setProdSearch(e.target.value)}/>
                    </div>
                    <select className="pm-select" value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
                      <option value="">All Categories</option>
                      {categories.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                    <button className="pm-btn pm-btn-primary" onClick={()=>openProdModal()}><Plus size={16}/>Add Product</button>
                  </div>
                </div>
                <div className="modern-table-card">
                  <div className="modern-table-scroll">
                  <table className="modern-table">
                    <thead><tr>
                      <th>Product</th><th>Category</th>
                      <th className="text-right">Price</th><th className="text-center">Stock</th><th className="text-center" style={{width:'220px'}}>Actions</th>
                    </tr></thead>
                    <tbody>
                      {filtProds.length===0
                        ? <tr><td colSpan={5}>
                            <div className="pm-empty modern-table-empty">
                              No products found
                            </div>
                          </td></tr>
                        : filtProds.map(p=>{
                          const initials = String(p.name || '').split(' ').slice(0,2).map(w=>w[0]?.toUpperCase()||'').join('');
                          const color = avatarColor(p.name);
                          return (
                          <tr key={p._id}>
                            <td>
                              <div style={{display:'flex',alignItems:'center',gap:'0.875rem'}}>
                                <div className="pm-prod-avatar" style={{background:`${color}18`,color,padding:'10px',borderRadius:'12px',fontWeight:700,fontSize:'0.85rem'}}>{initials}</div>
                                <div>
                                  <div className="pm-prod-name" style={{fontWeight:700,fontSize:'0.9rem',color:'#0f172a'}}>{p.name || 'Unnamed product'}</div>
                                  {p.warrantyPeriod&&<div className="pm-prod-warranty" style={{fontSize:'0.7rem',color:'#64748b',marginTop:'0.15rem'}}>🛡 {p.warrantyPeriod}</div>}
                                </div>
                              </div>
                            </td>
                            <td style={{color:'var(--pm-t2)',fontWeight:600,fontSize:'0.85rem'}}>{p.category?.name}</td>
                            <td className="text-right">
                              <div style={{fontWeight:800,color:'#0f172a',fontSize:'0.9rem'}}>{sym(p.currencyType)} {Number(p.price || 0).toLocaleString(undefined,{minimumFractionDigits:2})}</div>
                              {p.isTaxIncluded&&<div style={{fontSize:'0.65rem',color:'#10b981',fontWeight:700,marginTop:'0.15rem'}}>Incl. Tax</div>}
                            </td>
                            <td className="text-center">
                              <span className={`pm-badge ${p.quantity>9?'pm-badge-in':p.quantity>0?'pm-badge-low':'pm-badge-out'}`}>
                                {p.quantity>0?`${p.quantity} units`:'Out of Stock'}
                              </span>
                            </td>
                            <td>
                              <div className="modern-table-actions">
                                <button type="button" className="modern-table-action view" title="View" onClick={()=>openView(p)}><FileText size={15} strokeWidth={2.25} /></button>
                                <button type="button" className="modern-table-action stock" title="Add Stock" onClick={()=>openStockModal(p)}><Plus size={16} color="#047857" strokeWidth={2.75} /></button>
                                <button type="button" className="modern-table-action edit" title="Edit" onClick={()=>openProdModal(p)}><Edit2 size={15} strokeWidth={2.25} /></button>
                                {isAdmin&&<button type="button" className="modern-table-action delete" title="Delete" onClick={()=>deleteProd(p._id)}><Trash2 size={15} strokeWidth={2.25} /></button>}
                              </div>
                            </td>
                          </tr>
                        )})
                      }
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>
            </Motion.div>
          )}
      </AnimatePresence>

      {/* ── VIEW MODAL ── */}
      <AnimatePresence>
        {viewProd && (
          <div className="pm-overlay" onClick={()=>setViewProd(null)}>
            <Motion.div {...FM} className="pm-modal pm-modal-lg" onClick={e=>e.stopPropagation()}>
              <div className="pm-modal-header">
                <div className="pm-modal-title-row">
                  <div className="pm-card-icon green"><Package size={20}/></div>
                  <div><h2>{viewProd.name}</h2><div className="pm-modal-subtitle">{viewProd.productId} · {viewProd.category?.name}</div></div>
                </div>
                <button className="pm-modal-close" onClick={()=>setViewProd(null)}><X size={18}/></button>
              </div>
              <div className="pm-detail-grid">
                <div className="pm-detail-item"><div className="pm-detail-label">Selling Price</div><div className="pm-detail-value large">{sym(viewProd.currencyType)} {Number(viewProd.price || 0).toLocaleString(undefined,{minimumFractionDigits:2})}</div></div>
                <div className="pm-detail-item"><div className="pm-detail-label">Stock Qty</div><div className={`pm-detail-value large ${viewProd.quantity>0?'success':'danger'}`}>{viewProd.quantity} units</div></div>
                <div className="pm-detail-item"><div className="pm-detail-label">Tax Included</div><div className="pm-detail-value">{viewProd.isTaxIncluded?'Yes':'No'}</div></div>
                <div className="pm-detail-item"><div className="pm-detail-label">Default Warranty</div><div className="pm-detail-value">{viewProd.warrantyPeriod||'—'}</div></div>
                {viewProd.description&&<div className="pm-detail-item" style={{gridColumn:'1/-1'}}><div className="pm-detail-label">Description</div><div className="pm-detail-value">{viewProd.description}</div></div>}
              </div>
              <div className="pm-section-label"><BarChart3 size={13}/>Stock Batches</div>
              {stockLoading ? (
                <div className="pm-loading"><RefreshCw className="animate-spin" size={16}/> Loading...</div>
              ) : (
                <div className="pm-entries-list">
                  {stockEntries.length===0 ? <div className="pm-empty">No stock entries yet. Use "Add Stock" to add inventory.</div>
                    : stockEntries.map(e=>(
                      <div key={e._id} className="pm-entry-card">
                        <div className="pm-entry-card-header">
                          <span className="pm-entry-batch">{e.batchRef}</span>
                          <span className="pm-entry-date">{new Date(e.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</span>
                          <button
                            className="pm-btn pm-btn-edit modern-table-action edit"
                            style={{marginLeft:'auto',padding:'4px 10px',fontSize:'0.75rem'}}
                            onClick={async () => {
                              setEditBatchModal(e);
                              setEditBatchForm({ location: e.location||'', buyingPrice: e.buyingPrice?.toString()||'', quantity: e.quantity?.toString()||'', notes: e.notes||'', supplierInvoiceNumber: e.supplierInvoiceNumber || '', acquisitionType: e.acquisitionType||'cash', creditPeriod: e.creditPeriod || '', advanceAmount: e.advanceAmount ? e.advanceAmount.toString() : '' });
                              setEditBatchSerials(e.serialNumbers ? [...e.serialNumbers] : []);
                              setEditBatchSerialInput('');
                              setEditBatchUseSerials(e.hasSerialNumbers);
                              setEditBatchReason('');
                              // Load available serials from OTHER stock entries for this product
                              try {
                                const res = await api.get(`/products/${viewProd._id}/stock`);
                                const allSerials = (res.data.data || []).flatMap(ent => ent.serialNumbers || []);
                                const currentUpper = (e.serialNumbers || []).map(s => s.toUpperCase());
                                const avail = [...new Set(allSerials.filter(s => !currentUpper.includes(s.toUpperCase())))];
                                setEditBatchAvailableSerials(avail);
                              } catch { setEditBatchAvailableSerials([]); }
                            }}
                            title="Edit Batch"
                          ><Edit2 size={12}/> Edit Batch</button>
                        </div>
                        <div className="pm-entry-meta">
                          <span><Hash size={12}/> Qty: {e.quantity}</span>
                          {e.location&&<span><MapPin size={12}/> {e.location}</span>}
                          {e.buyingPrice>0&&<span><DollarSign size={12}/> Buy: {e.buyingPrice.toLocaleString(undefined,{minimumFractionDigits:2})}</span>}
                          {e.acquisitionType === 'cash' && (
                            <span style={{ color: '#047857', fontWeight: 700 }}>
                              <DollarSign size={12}/> Full cash paid{(e.expenseRef?.expenseNumber || e.expenseNumber) && ` · Exp: ${e.expenseRef?.expenseNumber || e.expenseNumber}`}
                            </span>
                          )}
                          {e.acquisitionType === 'advance' && (
                            <span style={{ color: '#047857', fontWeight: 700 }}>
                              <DollarSign size={12}/> Advance: {Number(e.advanceAmount || 0).toLocaleString(undefined,{minimumFractionDigits:2})}{(e.expenseRef?.expenseNumber || e.expenseNumber) && ` · Exp: ${e.expenseRef?.expenseNumber || e.expenseNumber}`}
                            </span>
                          )}
                          {(e.acquisitionType === 'credit' || e.acquisitionType === 'advance') && (
                            <span style={dueStyle(e.creditDueDate)}>
                              <CalendarClock size={12}/> Credit: {Number(e.creditAmount ?? (e.quantity * (e.buyingPrice || 0))).toLocaleString(undefined,{minimumFractionDigits:2})}{e.creditPeriod ? ` · ${e.creditPeriod}` : ''} · due {fmtDate(e.creditDueDate)}
                            </span>
                          )}
                          {e.warrantyPeriod&&<span><ShieldCheck size={12}/> {e.warrantyPeriod}</span>}
                          {e.addedBy&&<span><Tag size={12}/> {e.addedBy.name||e.addedBy.username}</span>}
                        </div>
                        {(e.supplierRef || e.supplierInvoiceNumber || e.supplierDeliveryNumber) && (
                          <div className="pm-entry-meta" style={{ marginTop: 4 }}>
                            {e.supplierRef && <span><Truck size={12}/> {e.supplierRef.name || e.supplierRef.supplierId}</span>}
                            {e.supplierInvoiceNumber && <span><FileText size={12}/> Inv: {e.supplierInvoiceNumber}</span>}
                            {e.supplierDeliveryNumber && (
                              <span><FileText size={12}/> DN: {e.supplierDeliveryNumber === 'N/A' ? 'N/A' : e.supplierDeliveryNumber}</span>
                            )}
                          </div>
                        )}
                        {e.notes&&<div style={{fontSize:'0.78rem',color:'var(--pm-text-2)',marginTop:4,fontStyle:'italic'}}>{e.notes}</div>}
                        {e.serialNumbers?.length>0&&(
                          <div className="pm-entry-serials">
                            {e.serialNumbers.map((s,i)=><span key={i} className="pm-entry-serial-chip">{s}</span>)}
                          </div>
                        )}
                      </div>
                    ))
                  }
                </div>
              )}
              <div style={{marginTop:'1.5rem',display:'flex',gap:'0.75rem'}}>
                <button className="pm-btn pm-btn-stock pm-btn-full" onClick={()=>{setViewProd(null);openStockModal(viewProd);}}><Plus size={15} strokeWidth={2.5}/>Add Stock</button>
                <button className="pm-btn pm-btn-outline pm-btn-full" onClick={()=>setViewProd(null)}>Close</button>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── STOCK MODAL ── */}
      <AnimatePresence>
        {stockModal && (
          <div className="pm-overlay" onClick={()=>setStockModal(false)}>
            <Motion.div {...FM} className="pm-modal pm-modal-md" onClick={e=>e.stopPropagation()}>
              <div className="pm-modal-header">
                <div className="pm-modal-title-row">
                  <div className="pm-card-icon green"><Plus size={18}/></div>
                  <div><h2>Add Stock Entry</h2><div className="pm-modal-subtitle">{stockProd?.name} · {stockProd?.productId}</div></div>
                </div>
                <button className="pm-modal-close" onClick={()=>setStockModal(false)}><X size={18}/></button>
              </div>
              <form className="pm-form" onSubmit={saveStock}>
                <div className="pm-form-row pm-form-row-2">
                  <div><label className="pm-label">Quantity *</label><input className="pm-input" type="number" min="1" required value={stockForm.quantity} onChange={e=>setStockForm({...stockForm,quantity:e.target.value})} placeholder="e.g. 10"/></div>
                  <div><label className="pm-label">Warranty Period</label><input className="pm-input" value={stockForm.warrantyPeriod} onChange={e=>setStockForm({...stockForm,warrantyPeriod:e.target.value})} placeholder="e.g. 12 months"/></div>
                </div>
                <div className="pm-form-row pm-form-row-2">
                  <div><label className="pm-label">Stock Location</label>
                    <select className="pm-input pm-select-input" value={stockForm.location} onChange={e=>setStockForm({...stockForm,location:e.target.value})}>
                      <option value="">— Select Location —</option>
                      {(businessData?.stores?.length ? businessData.stores.map(s => s.name).filter(Boolean) : STOCK_LOCATIONS).map(loc=><option key={loc} value={loc}>{loc}</option>)}
                    </select>
                  </div>
                  <div><label className="pm-label">Buying Price / Unit</label><PriceInput value={parseFloat(stockForm.buyingPrice) || 0} onChange={v => setStockForm({...stockForm, buyingPrice: v.toString()})} className="pm-input" placeholder="0.00" /></div>
                </div>
                <div className="pm-form-row pm-form-row-2">
                  <div>
                    <label className="pm-label">Stock Obtained By *</label>
                    <select className="pm-input pm-select-input" value={stockForm.acquisitionType} onChange={e=>{const t=e.target.value;setStockForm({...stockForm,acquisitionType:t,creditPeriod:t==='cash'?'':stockForm.creditPeriod,advanceAmount:t==='advance'?stockForm.advanceAmount:''});}}>
                      <option value="cash">Full cash — pay all now</option>
                      <option value="credit">Credit — pay later</option>
                      <option value="advance">Advance payment — part now, rest on credit</option>
                    </select>
                  </div>
                  {stockForm.acquisitionType !== 'cash' ? (
                    <div>
                      <label className="pm-label">Credit Period *</label>
                      <input className="pm-input" list="creditPeriodOptions" required value={stockForm.creditPeriod} onChange={e=>setStockForm({...stockForm,creditPeriod:e.target.value})} placeholder="e.g. 30 days" />
                      <datalist id="creditPeriodOptions">
                        <option value="7 days" />
                        <option value="14 days" />
                        <option value="30 days" />
                        <option value="1 month" />
                        <option value="2 months" />
                        <option value="3 months" />
                        <option value="1 year" />
                      </datalist>
                    </div>
                  ) : <div />}
                </div>
                {stockForm.acquisitionType === 'advance' && (
                  <div className="pm-form-row pm-form-row-2" style={{ marginTop: 0 }}>
                    <div>
                      <label className="pm-label">Advance Amount *</label>
                      <input className="pm-input" type="number" min="0" step="0.01" max={stockTotal(stockForm)} required value={stockForm.advanceAmount} onChange={e=>{const v=e.target.value;if(validAdvanceInput(v,stockTotal(stockForm)))setStockForm({...stockForm,advanceAmount:v});}} placeholder="0.00" />
                    </div>
                    <div style={{ fontSize:'0.75rem', color:'#b45309', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'8px 10px', alignSelf:'end' }}>
                      Advance: {(parseFloat(stockForm.advanceAmount)||0).toLocaleString(undefined,{minimumFractionDigits:2})} · Credit balance: {(stockTotal(stockForm)-(parseFloat(stockForm.advanceAmount)||0)).toLocaleString(undefined,{minimumFractionDigits:2})}
                    </div>
                  </div>
                )}
                {stockForm.acquisitionType === 'cash' && (
                  <div style={{ fontSize:'0.75rem', color:'#047857', background:'#ecfdf5', border:'1px solid #a7f3d0', borderRadius:8, padding:'8px 10px', marginTop:-4 }}>
                    Full amount {stockTotal(stockForm).toLocaleString(undefined,{minimumFractionDigits:2})} to be paid now — a payment expense will be created automatically.
                  </div>
                )}
                {(stockForm.acquisitionType === 'credit' || stockForm.acquisitionType === 'advance') && (
                  <div style={{ fontSize:'0.75rem', color:'#b45309', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'8px 10px', marginTop:-4 }}>
                    A due date is calculated from this period; an alert appears 7 days before it.
                  </div>
                )}
                <div className="pm-form-row pm-form-row-2">
                  <div>
                    <label className="pm-label">Supplier <span className="pm-label-optional">(optional)</span></label>
                    <div style={{ display:'flex', gap:8, alignItems:'stretch' }}>
                      <select className="pm-input pm-select-input" style={{ flex:1 }} value={stockForm.supplierRef} onChange={e=>setStockForm({...stockForm,supplierRef:e.target.value})}>
                        <option value="">— Select Supplier —</option>
                        {suppliers.map(s => <option key={s._id} value={s._id}>{s.name} ({s.supplierId})</option>)}
                      </select>
                      <button type="button" className="pm-btn pm-btn-primary" onClick={openSupplierPopup} style={{ padding:'8px 10px', fontSize:'0.75rem', whiteSpace:'nowrap' }}>+ New Supplier</button>
                    </div>
                  </div>
                  <div>
                    <label className="pm-label">Supplier Invoice # *</label>
                    <input className="pm-input" required value={stockForm.supplierInvoiceNumber} onChange={e=>setStockForm({...stockForm,supplierInvoiceNumber:e.target.value.toUpperCase()})} placeholder="e.g. SUP-INV-001"/>
                  </div>
                </div>
                <div>
                  <label className="pm-label">Supplier Delivery Note #</label>
                  <div className="pm-form-row pm-form-row-2" style={{ marginTop: 0 }}>
                    <select
                      className="pm-input pm-select-input"
                      value={stockForm.supplierDeliveryNumber === 'N/A' ? 'N/A' : 'CUSTOM'}
                      onChange={(e) => {
                        if (e.target.value === 'N/A') {
                          setStockForm({ ...stockForm, supplierDeliveryNumber: 'N/A' });
                        } else {
                          setStockForm({
                            ...stockForm,
                            supplierDeliveryNumber: stockForm.supplierDeliveryNumber === 'N/A' ? '' : stockForm.supplierDeliveryNumber,
                          });
                        }
                      }}
                    >
                      <option value="CUSTOM">Enter delivery note number</option>
                      <option value="N/A">N/A (invoice only — no DN)</option>
                    </select>
                    <input
                      className="pm-input"
                      value={stockForm.supplierDeliveryNumber === 'N/A' ? '' : stockForm.supplierDeliveryNumber}
                      onChange={(e) => setStockForm({ ...stockForm, supplierDeliveryNumber: e.target.value.toUpperCase() })}
                      placeholder="e.g. SUP-DN-001"
                      disabled={stockForm.supplierDeliveryNumber === 'N/A'}
                      style={stockForm.supplierDeliveryNumber === 'N/A' ? { opacity: 0.55, background: '#f8fafc' } : undefined}
                    />
                  </div>
                  {stockForm.supplierDeliveryNumber === 'N/A' && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 6, fontWeight: 600 }}>
                      No supplier delivery note — goods received against invoice only.
                    </div>
                  )}
                </div>
                <div><label className="pm-label">Notes <span className="pm-label-optional">(optional)</span></label><textarea className="pm-input pm-textarea" value={stockForm.notes} onChange={e=>setStockForm({...stockForm,notes:e.target.value})} placeholder="Additional notes..."/></div>
                <div className="pm-serial-section">
                  <div className="pm-serial-toggle-row">
                    <input type="checkbox" id="useSerial" checked={useSerials} onChange={e=>{setUseSerials(e.target.checked);if(!e.target.checked)setSerials([]);}} style={{width:17,height:17,accentColor:'#6366f1',cursor:'pointer'}}/>
                    <label htmlFor="useSerial" style={{fontWeight:700,fontSize:'0.88rem',color:'var(--pm-text-2)',cursor:'pointer'}}>Track Serial Numbers for this batch</label>
                  </div>
                  {useSerials&&(<>
                    <div className="pm-serial-input-row">
                      <input className="pm-input" value={serialInput} onChange={e=>setSerialInput(e.target.value.toUpperCase())} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addSerial();}}} placeholder="Type serial number & press Enter or Add"/>
                      <button type="button" className="pm-btn pm-btn-primary" onClick={addSerial}>Add</button>
                    </div>
                    <div className="pm-upload-zone" onClick={()=>excelRef.current?.click()}>
                      <FileSpreadsheet size={18}/><span>Import from Excel / CSV</span><span className="pm-upload-hint">Column A = Serial Numbers</span>
                    </div>
                    <input ref={excelRef} type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}} onChange={handleExcel}/>
                    {serials.length>0&&(
                      <>
                        <div className="pm-chips">
                          {serials.map((s,i)=>{
                            const isDuplicate = existingStockSerials.includes(s.toUpperCase());
                            return (
                              <span key={i} className="pm-chip" style={isDuplicate ? { background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' } : {}}>
                                {isDuplicate && <span title="Already in stock" style={{ marginRight: '0.2rem' }}>⚠</span>}{s}
                                <button type="button" className="pm-chip-remove" onClick={()=>removeSerial(i)}>×</button>
                              </span>
                            );
                          })}
                        </div>
                        <div className={`pm-serial-info ${stockForm.quantity&&serials.length!==parseInt(stockForm.quantity)?'pm-serial-warn':'pm-serial-ok'}`}>
                          {serials.length} serial{serials.length!==1?'s':''} entered
                          {stockForm.quantity&&serials.length!==parseInt(stockForm.quantity)
                            ?` — must match quantity (${stockForm.quantity})` : ' ✓'}
                        </div>
                      </>
                    )}
                  </>)}
                </div>
                <button type="submit" className="pm-btn pm-btn-success pm-btn-full" disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Save Stock Entry'}</button>
              </form>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CATEGORY MODAL ── */}
      <AnimatePresence>
        {catModal && (
          <div className="pm-overlay" onClick={()=>setCatModal(false)}>
            <Motion.div {...FM} className="pm-modal pm-modal-sm" onClick={e=>e.stopPropagation()}>
              <div className="pm-modal-header">
                <div className="pm-modal-title-row"><div className="pm-card-icon blue"><FolderTree size={18}/></div><h2>{editCat?'Edit':'New'} Category</h2></div>
                <button className="pm-modal-close" onClick={()=>setCatModal(false)}><X size={18}/></button>
              </div>
              <form className="pm-form" onSubmit={e=>saveCat(e,false)}>
                <div><label className="pm-label">Category Name *</label><input className="pm-input" required value={catForm.name} onChange={e=>setCatForm({...catForm,name:e.target.value})} placeholder="e.g. Laptops"/></div>
                <div><label className="pm-label">{editCat ? 'Short Code' : 'Short Code (auto-generated)'}</label><input className="pm-input" disabled value={catForm.code} onChange={e=>setCatForm({...catForm,code:e.target.value.toUpperCase()})} placeholder={editCat ? 'e.g. LAP' : 'Auto: ORG/CAT/00001'}/></div>
                <div><label className="pm-label">Parent Category</label>
                  <select className="pm-input pm-select-input" value={catForm.parentCategory} onChange={e=>setCatForm({...catForm,parentCategory:e.target.value})}>
                    <option value="">— None (top-level) —</option>
                    {categories.filter(c=>!editCat||c._id!==editCat._id).map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="pm-btn pm-btn-success pm-btn-full" disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Save Category'}</button>
              </form>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PRODUCT MODAL ── */}
      <AnimatePresence>
        {prodModal && (
          <div className="pm-overlay" onClick={()=>setProdModal(false)}>
            <Motion.div {...FM} className="pm-modal pm-modal-md" onClick={e=>e.stopPropagation()}>
              <div className="pm-modal-header">
                <div className="pm-modal-title-row"><div className="pm-card-icon green"><Package size={18}/></div><h2>{editProd?'Edit':'New'} Product</h2></div>
                <button className="pm-modal-close" onClick={()=>setProdModal(false)}><X size={18}/></button>
              </div>
              <form className="pm-form" onSubmit={saveProd}>
                <div><label className="pm-label">Product Name / Model *</label><input className="pm-input" required value={prodForm.name} onChange={e=>setProdForm({...prodForm,name:e.target.value})} placeholder="e.g. HP Laptop 15s-eq2144AU"/></div>
                <div className="pm-inline-cat">
                  <div className="pm-inline-cat-header">
                    <label className="pm-label" style={{marginBottom:0}}>Category *</label>
                    <button type="button" className="pm-link-btn" onClick={()=>{setInlineCat(!inlineCat);setInlineCatForm({name:'',code:''});}}>{inlineCat?'← Select existing':'+ Create new'}</button>
                  </div>
                  {inlineCat ? (
                    <div className="pm-form-row pm-form-row-2" style={{marginTop:'0.75rem'}}>
                      <input className="pm-input" placeholder="Category name" value={inlineCatForm.name} onChange={e=>setInlineCatForm({...inlineCatForm,name:e.target.value})}/>
                      <input className="pm-input" placeholder="Code auto-generated" value={inlineCatForm.code} disabled onChange={()=>{}}/>
                    </div>
                  ) : (
                    <select className="pm-input pm-select-input" style={{marginTop:'0.75rem'}} value={prodForm.category} onChange={e=>setProdForm({...prodForm,category:e.target.value})}>
                      <option value="" disabled>Select category...</option>
                      {categories.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  )}
                </div>
                <div className="pm-form-row pm-form-row-2">
                  <div><label className="pm-label">Selling Price *{sym(prodForm.currencyType) ? ` (${sym(prodForm.currencyType)})` : ''}</label><PriceInput value={parseFloat(prodForm.price) || 0} onChange={v => setProdForm({...prodForm, price: v.toString()})} className="pm-input" required placeholder="0.00" /></div>
                  <div><label className="pm-label">Currency</label>
                    <select className="pm-input pm-select-input" value={prodForm.currencyType} onChange={e=>setProdForm({...prodForm,currencyType:e.target.value})}>
                      <option value="primary">Primary{sym('primary') ? ` (${sym('primary')})` : ''}</option>
                      <option value="secondary">Secondary{sym('secondary') ? ` (${sym('secondary')})` : ''}</option>
                    </select>
                  </div>
                </div>
                <div><label className="pm-label">Default Warranty Period</label><input className="pm-input" value={prodForm.warrantyPeriod} onChange={e=>setProdForm({...prodForm,warrantyPeriod:e.target.value})} placeholder="e.g. 1 year, 24 months"/></div>
                <div><label className="pm-label">Description <span className="pm-label-optional">(optional)</span></label><textarea className="pm-input pm-textarea" value={prodForm.description} onChange={e=>setProdForm({...prodForm,description:e.target.value})} placeholder="Product description, specs, notes..."/></div>
                <div className="pm-checkbox-row"><input type="checkbox" id="taxInc" checked={prodForm.isTaxIncluded} onChange={e=>setProdForm({...prodForm,isTaxIncluded:e.target.checked})}/><label htmlFor="taxInc">Selling price includes tax</label></div>
                <button type="submit" className="pm-btn pm-btn-success pm-btn-full" disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Save Product'}</button>
              </form>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── EDIT BATCH MODAL ── */}
      <AnimatePresence>
        {editBatchModal && (
          <div className="pm-overlay" onClick={()=>setEditBatchModal(null)}>
            <Motion.div {...FM} className="pm-modal pm-modal-md" onClick={e=>e.stopPropagation()}>
              <div className="pm-modal-header">
                <div className="pm-modal-title-row">
                  <div className="pm-card-icon green"><Edit2 size={18}/></div>
                  <div><h2>Edit Stock Batch</h2><div className="pm-modal-subtitle">{editBatchModal.batchRef}</div></div>
                </div>
                <button className="pm-modal-close" onClick={()=>setEditBatchModal(null)}><X size={18}/></button>
              </div>
              <form className="pm-form" onSubmit={async (e) => {
                e.preventDefault();
                if (!editBatchReason) return showToast?.('Please select a reason for modification', 'error');
                if (!editBatchForm.supplierInvoiceNumber.trim()) return showToast?.('Supplier invoice number is required','error');
                const changes = {};
                if (editBatchForm.location !== (editBatchModal.location||'')) changes.location = editBatchForm.location;
                if (parseFloat(editBatchForm.buyingPrice||0) !== (editBatchModal.buyingPrice||0)) changes.buyingPrice = parseFloat(editBatchForm.buyingPrice||0);
                if (parseInt(editBatchForm.quantity||0) !== editBatchModal.quantity) changes.quantity = parseInt(editBatchForm.quantity||0);
                if (editBatchForm.notes !== (editBatchModal.notes||'')) changes.notes = editBatchForm.notes;
                const supplierInvoice = editBatchForm.supplierInvoiceNumber.trim().toUpperCase();
                if (supplierInvoice !== (editBatchModal.supplierInvoiceNumber||'')) changes.supplierInvoiceNumber = supplierInvoice;
                const creditType = editBatchForm.acquisitionType || 'cash';
                const creditPeriod = creditType === 'cash' ? '' : editBatchForm.creditPeriod;
                if ((creditType === 'credit' || creditType === 'advance') && !validCreditPeriod(creditPeriod)) return showToast?.('Enter a period like "30 days" or "2 months"','error');
                let advanceValue = 0;
                if (creditType === 'advance') {
                  advanceValue = Number(editBatchForm.advanceAmount);
                  if (isNaN(advanceValue) || advanceValue <= 0 || advanceValue >= stockTotal(editBatchForm))
                    return showToast?.('Advance amount must be greater than zero and less than the total stock value','error');
                }
                if (creditType !== (editBatchModal.acquisitionType||'cash')) changes.acquisitionType = creditType;
                if (creditPeriod !== (editBatchModal.creditPeriod || '')) changes.creditPeriod = creditPeriod;
                const origAdvance = Number(editBatchModal.advanceAmount || 0);
                if (advanceValue !== origAdvance) changes.advanceAmount = advanceValue;
                if (editBatchUseSerials) {
                  const origSerials = (editBatchModal.serialNumbers || []).map(s => s.toUpperCase()).sort();
                  const newSerials = editBatchSerials.map(s => s.toUpperCase()).sort();
                  if (JSON.stringify(origSerials) !== JSON.stringify(newSerials)) {
                    changes.serialNumbers = editBatchSerials.map(s => s.toUpperCase());
                    changes.hasSerialNumbers = editBatchSerials.length > 0;
                  }
                }
                if (Object.keys(changes).length === 0) return showToast?.('No changes detected', 'error');
                await runGuarded(async () => {
                  try {
                    if (isAdmin) {
                      await api.patch(`/products/${editBatchModal.product}/stock/${editBatchModal._id}`, { ...changes, reason: editBatchReason });
                      showToast?.('Stock batch updated', 'success');
                      setEditBatchModal(null); fetchStockEntries(viewProd._id);
                    } else {
                      const product = products.find(p => p._id === editBatchModal.product);
                      await api.post('/products/inventory-requests', {
                        type: 'StockEntry', targetId: editBatchModal._id,
                        targetName: `${product?.name || ''} - ${editBatchModal.batchRef}`,
                        proposedChanges: changes, reason: editBatchReason
                      });
                      showToast?.('Edit request submitted for approval', 'success');
                      setEditBatchModal(null);
                    }
                  } catch(err) { showToast?.(err.response?.data?.message||'Error','error'); }
                });
              }}>
                <div className="pm-form-row pm-form-row-2">
                  <div><label className="pm-label">Quantity</label><input className="pm-input" type="number" min="1" value={editBatchForm.quantity} onChange={e=>setEditBatchForm({...editBatchForm,quantity:e.target.value})}/></div>
                  <div><label className="pm-label">Buying Price / Unit</label><PriceInput value={parseFloat(editBatchForm.buyingPrice) || 0} onChange={v => setEditBatchForm({...editBatchForm, buyingPrice: v.toString()})} className="pm-input" /></div>
                </div>
                <div><label className="pm-label">Stock Location</label>
                  <select className="pm-input pm-select-input" value={editBatchForm.location} onChange={e=>setEditBatchForm({...editBatchForm,location:e.target.value})}>
                    <option value="">— Select Location —</option>
                    {STOCK_LOCATIONS.map(loc=><option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
                <div className="pm-form-row pm-form-row-2">
                  <div>
                    <label className="pm-label">Stock Obtained By</label>
                    <select className="pm-input pm-select-input" value={editBatchForm.acquisitionType} onChange={e=>{const t=e.target.value;setEditBatchForm({...editBatchForm,acquisitionType:t,creditPeriod:t==='cash'?'':editBatchForm.creditPeriod,advanceAmount:t==='advance'?editBatchForm.advanceAmount:''});}}>
                      <option value="cash">Full cash — pay all now</option>
                      <option value="credit">Credit — pay later</option>
                      <option value="advance">Advance payment — part now, rest on credit</option>
                    </select>
                  </div>
                  {editBatchForm.acquisitionType !== 'cash' ? (
                    <div>
                      <label className="pm-label">Credit Period</label>
                      <input className="pm-input" list="editCreditPeriodOptions" value={editBatchForm.creditPeriod} onChange={e=>setEditBatchForm({...editBatchForm,creditPeriod:e.target.value})} placeholder="e.g. 30 days" />
                      <datalist id="editCreditPeriodOptions">
                        <option value="7 days" />
                        <option value="14 days" />
                        <option value="30 days" />
                        <option value="1 month" />
                        <option value="2 months" />
                        <option value="3 months" />
                        <option value="1 year" />
                      </datalist>
                    </div>
                  ) : <div />}
                </div>
                {editBatchForm.acquisitionType === 'advance' && (
                  <div className="pm-form-row pm-form-row-2" style={{ marginTop: 0 }}>
                    <div>
                      <label className="pm-label">Advance Amount</label>
                      <input className="pm-input" type="number" min="0" step="0.01" max={stockTotal(editBatchForm)} value={editBatchForm.advanceAmount} onChange={e=>{const v=e.target.value;if(validAdvanceInput(v,stockTotal(editBatchForm)))setEditBatchForm({...editBatchForm,advanceAmount:v});}} placeholder="0.00" />
                    </div>
                    <div style={{ fontSize:'0.75rem', color:'#b45309', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'8px 10px', alignSelf:'end' }}>
                      Remaining credit: {(stockTotal(editBatchForm)-(parseFloat(editBatchForm.advanceAmount)||0)).toLocaleString(undefined,{minimumFractionDigits:2})}
                    </div>
                  </div>
                )}
                {editBatchForm.acquisitionType === 'credit' && (
                  <div style={{ fontSize:'0.75rem', color:'#b45309', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'8px 10px', marginTop:-4 }}>
                    Full amount on credit: {stockTotal(editBatchForm).toLocaleString(undefined,{minimumFractionDigits:2})}
                  </div>
                )}
                <div style={{ fontSize:'0.75rem', color:'#64748b', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, padding:'8px 10px' }}>
                  Changing the payment mode updates the linked expense.
                </div>
                <div><label className="pm-label">Supplier Invoice # *</label><input className="pm-input" required value={editBatchForm.supplierInvoiceNumber} onChange={e=>setEditBatchForm({...editBatchForm,supplierInvoiceNumber:e.target.value.toUpperCase()})} placeholder="e.g. SUP-INV-001"/></div>
                <div><label className="pm-label">Notes</label><textarea className="pm-input pm-textarea" value={editBatchForm.notes} onChange={e=>setEditBatchForm({...editBatchForm,notes:e.target.value})}/></div>
                <div className="pm-serial-section">
                  <div className="pm-serial-toggle-row">
                    <input type="checkbox" id="editBatchUseSerial" checked={editBatchUseSerials} onChange={e=>{setEditBatchUseSerials(e.target.checked);if(!e.target.checked)setEditBatchSerials([]);}} style={{width:17,height:17,accentColor:'#6366f1',cursor:'pointer'}}/>
                    <label htmlFor="editBatchUseSerial" style={{fontWeight:700,fontSize:'0.88rem',color:'var(--pm-text-2)',cursor:'pointer'}}>Edit Serial Numbers</label>
                  </div>
                  {editBatchUseSerials && (
                    <>
                      {/* Available serials from other batches */}
                      {editBatchAvailableSerials.length > 0 && (
                        <div style={{marginBottom:'0.5rem'}}>
                          <label className="pm-label" style={{fontSize:'0.65rem',marginBottom:'0.3rem'}}>Available Serials in Catalog — click to add</label>
                          <div className="pm-chips" style={{gap:'0.3rem'}}>
                            {editBatchAvailableSerials.map((s,i)=>{
                              const alreadyInBatch = editBatchSerials.map(x=>x.toUpperCase()).includes(s.toUpperCase());
                              return alreadyInBatch ? null : (
                                <span key={i} className="pm-chip" style={{cursor:'pointer',background:'#e0e7ff',color:'#4338ca',border:'1px solid #c7d2fe'}}
                                  onClick={() => {
                                    setEditBatchSerials(prev => [...prev, s]);
                                    setEditBatchAvailableSerials(prev => prev.filter(a => a.toUpperCase() !== s.toUpperCase()));
                                  }}
                                >+ {s}</span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {/* Current / edited serials */}
                      <div className="pm-serial-input-row">
                        <input className="pm-input" value={editBatchSerialInput}
                          onChange={e=>setEditBatchSerialInput(e.target.value.toUpperCase())}
                          onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();const v=editBatchSerialInput.trim().toUpperCase();if(v&&!editBatchSerials.map(x=>x.toUpperCase()).includes(v)){setEditBatchSerials(prev=>[...prev,v]);setEditBatchAvailableSerials(prev=>prev.filter(a=>a.toUpperCase()!==v));}setEditBatchSerialInput('');}}}
                          placeholder="Type serial & press Enter"/>
                        <button type="button" className="pm-btn pm-btn-primary" onClick={()=>{const v=editBatchSerialInput.trim().toUpperCase();if(v&&!editBatchSerials.map(x=>x.toUpperCase()).includes(v)){setEditBatchSerials(prev=>[...prev,v]);setEditBatchAvailableSerials(prev=>prev.filter(a=>a.toUpperCase()!==v));}setEditBatchSerialInput('');}}>Add</button>
                      </div>
                      {editBatchSerials.length > 0 && (
                        <>
                          <div className="pm-chips">
                            {editBatchSerials.map((s,i)=>(
                              <span key={i} className="pm-chip" style={{background:'#e0e7ff',color:'#4338ca',border:'1px solid #c7d2fe'}}>
                                {s}
                                <button type="button" className="pm-chip-remove" onClick={()=>{
                                  setEditBatchSerials(prev=>prev.filter((_,idx)=>idx!==i));
                                  setEditBatchAvailableSerials(prev=>[...prev,s]);
                                }}>×</button>
                              </span>
                            ))}
                          </div>
                          <div className={`pm-serial-info ${editBatchForm.quantity&&editBatchSerials.length!==parseInt(editBatchForm.quantity)?'pm-serial-warn':'pm-serial-ok'}`}>
                            {editBatchSerials.length} serial{editBatchSerials.length!==1?'s':''}
                            {editBatchForm.quantity&&editBatchSerials.length!==parseInt(editBatchForm.quantity)
                              ?` — must match quantity (${editBatchForm.quantity})`:' ✓'}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
                <div><label className="pm-label">Reason for Modification *</label>
                  <select className="pm-input pm-select-input" required value={editBatchReason} onChange={e=>setEditBatchReason(e.target.value)}>
                    <option value="">— Select Reason —</option>
                    {MODIFY_REASONS.stock.map(r=><option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <button type="submit" className="pm-btn pm-btn-success pm-btn-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : (isAdmin ? 'Save Changes' : 'Submit for Approval')}
                </button>
              </form>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── EDIT REQUEST REASON MODAL (standard users) ── */}
      <AnimatePresence>
        {editReqModal && (
          <div className="pm-overlay" onClick={()=>{setEditReqModal(null);setEditReqReason('');}}>
            <Motion.div {...FM} className="pm-modal pm-modal-sm" onClick={e=>e.stopPropagation()}>
              <div className="pm-modal-header">
                <div className="pm-modal-title-row">
                  <div className="pm-card-icon amber"><AlertTriangle size={18}/></div>
                  <h2>Request {editReqModal.type} Edit</h2>
                </div>
                <button className="pm-modal-close" onClick={()=>{setEditReqModal(null);setEditReqReason('');}}><X size={18}/></button>
              </div>
              <div className="pm-form" style={{padding:'1rem 1.5rem 1.5rem'}}>
                <p style={{fontSize:'0.85rem',color:'var(--pm-text-2)',marginBottom:'1rem'}}>
                  Your changes to <strong>{editReqModal.targetName}</strong> will be submitted for admin approval.
                </p>
                <div><label className="pm-label">Reason for Modification *</label>
                  <select className="pm-input pm-select-input" required value={editReqReason} onChange={e=>setEditReqReason(e.target.value)}>
                    <option value="">— Select Reason —</option>
                    {(MODIFY_REASONS[editReqModal.type === 'StockEntry' ? 'stock' : editReqModal.type === 'Product' ? 'product' : 'category']||[]).map(r=>(
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="pm-confirm-actions" style={{marginTop:'1.5rem'}}>
                  <button className="pm-btn-abort" onClick={()=>{setEditReqModal(null);setEditReqReason('');}}>Cancel</button>
                  <button className="pm-btn-confirm-danger" onClick={()=>submitEditRequest(editReqModal.type, editReqModal.targetId, editReqModal.targetName, editReqModal.proposedChanges)} disabled={isSubmitting} style={{background:'var(--pm-indigo)',color:'#fff'}}>
                    {isSubmitting ? 'Processing...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CONFIRM DIALOG ── */}
      <AnimatePresence>
        {confirm && (
          <div className="pm-overlay">
            <Motion.div {...FM} className="pm-modal pm-modal-sm">
              <div className="pm-confirm-icon"><AlertTriangle size={56} color="#ef4444"/></div>
              <h3 className="pm-confirm-title">Are you sure?</h3>
              <p className="pm-confirm-msg">{confirm.msg}</p>
              <div className="pm-confirm-actions">
                <button className="pm-btn-abort" onClick={()=>setConfirm(null)}>Cancel</button>
                <button className="pm-btn-confirm-danger" onClick={()=>{confirm.onConfirm();setConfirm(null);}}>Yes, Delete</button>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
export default ProductManagement;
