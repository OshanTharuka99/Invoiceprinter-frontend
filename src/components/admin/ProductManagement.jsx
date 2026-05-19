import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, X, Edit2, Trash2, RefreshCw, FolderTree, Search,
  AlertTriangle, FileText, BarChart3, ShieldCheck, Hash, FileSpreadsheet,
  MapPin, DollarSign, Tag, Layers } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../api';
import PriceInput from '../../utils/PriceInput';
import './ProductManagement.css';
import '../../styles/modern-table.css';

const FV = { initial:{opacity:0,y:8}, animate:{opacity:1,y:0}, exit:{opacity:0,y:-8} };
const FM = { initial:{scale:0.95,opacity:0}, animate:{scale:1,opacity:1}, exit:{scale:0.95,opacity:0} };
const EMPTY_PROD = { name:'', category:'', price:'', currencyType:'primary', isTaxIncluded:false, description:'', warrantyPeriod:'' };
const EMPTY_STOCK = { location:'', buyingPrice:'', quantity:'', warrantyPeriod:'', notes:'' };

const ProductManagement = ({ currentUser, showToast }) => {
  const [activeTab, setActiveTab] = useState('products');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [businessData, setBusinessData] = useState(null);
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cr, pr, br] = await Promise.all([
        api.get('/products/categories'),
        api.get('/products'),
        api.get('/business')
      ]);
      setCategories(cr.data.data || []);
      setProducts(pr.data.data || []);
      if (br.data?.data?.details) setBusinessData(br.data.data.details);
    } catch { showToast?.('Error loading data', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const fetchStockEntries = async (pid) => {
    setStockLoading(true);
    try {
      const res = await api.get(`/products/${pid}/stock`);
      setStockEntries(res.data.data || []);
    } catch { setStockEntries([]); }
    finally { setStockLoading(false); }
  };
  const openView = (p) => { setViewProd(p); fetchStockEntries(p._id); };

  // ── Category CRUD ─────────────────────────────────────────────────────────
  const openCatModal = (c = null) => {
    setEditCat(c);
    setCatForm(c ? { name:c.name, code:c.code, parentCategory:c.parentCategory?._id||'' }
                 : { name:'', code:'', parentCategory:'' });
    setCatModal(true);
  };
  const saveCat = async (e, inline = false) => {
    if (e) e.preventDefault();
    try {
      if (inline) {
        const res = await api.post('/products/categories', { name:inlineCatForm.name, code:inlineCatForm.code });
        showToast?.('Category created', 'success');
        fetchData();
        return res.data.data;
      }
      if (editCat) await api.put(`/products/categories/${editCat._id}`, { ...catForm, parentCategory:catForm.parentCategory||null });
      else await api.post('/products/categories', { ...catForm, parentCategory:catForm.parentCategory||null });
      showToast?.(editCat ? 'Category updated' : 'Category created', 'success');
      setCatModal(false); fetchData();
    } catch(err) { showToast?.(err.response?.data?.message || 'Error', 'error'); return null; }
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
    try {
      let catId = prodForm.category;
      if (inlineCat) {
        if (!inlineCatForm.name || !inlineCatForm.code) return showToast?.('Fill category name & code','error');
        const nc = await saveCat(null, true);
        if (!nc) return;
        catId = nc._id;
      } else if (!catId) return showToast?.('Select a category','error');
      const payload = { ...prodForm, category:catId };
      if (editProd) await api.put(`/products/${editProd._id}`, payload);
      else await api.post('/products', payload);
      showToast?.(editProd ? 'Product updated' : 'Product created', 'success');
      setProdModal(false); fetchData();
    } catch(err) { showToast?.(err.response?.data?.message||'Error','error'); }
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
    setStockProd(p); setStockForm(EMPTY_STOCK);
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
    if (useSerials && serials.length > 0 && serials.length !== qty)
      return showToast?.(`Serial count (${serials.length}) must match quantity (${qty})`,'error');
    try {
      await api.post(`/products/${stockProd._id}/stock`, {
        ...stockForm, quantity:qty,
        serialNumbers: useSerials ? serials : [],
      });
      showToast?.('Stock entry saved successfully','success');
      setStockModal(false); fetchData();
    } catch(err) { showToast?.(err.response?.data?.message||'Error','error'); }
  };

  const sym = (t) => businessData ? (t==='primary' ? businessData.primaryCurrency?.symbol||'' : businessData.secondaryCurrency?.symbol||'') : '';
  const filtCats = categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()) || c.code.toLowerCase().includes(catSearch.toLowerCase()));
  const filtProds = products.filter(p => {
    const matchCat = !catFilter || p.category?._id === catFilter;
    const matchQ = p.name.toLowerCase().includes(prodSearch.toLowerCase()) || p.productId.toLowerCase().includes(prodSearch.toLowerCase());
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
      <div className="pm-tabs">
        {[['products','Products'],['categories','Categories']].map(([key,label]) => (
          <button key={key} className={`pm-tab-btn ${activeTab===key?'active':''}`} onClick={()=>setActiveTab(key)}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div className="pm-loading"><RefreshCw className="animate-spin" size={20}/> Loading...</div>
      ) : (
        <AnimatePresence mode="wait">
          {/* CATEGORIES TAB */}
          {activeTab==='categories' ? (
            <motion.div key="cat" {...FV}>
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
                    {isAdmin && <button className="pm-btn pm-btn-primary" onClick={()=>openCatModal()}><Plus size={16}/>New Category</button>}
                  </div>
                </div>
                <div className="pm-table-wrap modern-table-card">
                  <table className="pm-table modern-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Code</th>
                        <th>Parent</th>
                        {isAdmin&&<th className="text-center" style={{width:'150px'}}>Actions</th>}
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
                            {isAdmin&&<td><div className="pm-table-actions modern-table-actions">
                              <button className="pm-btn pm-btn-edit modern-table-action edit" onClick={()=>openCatModal(c)}><Edit2 size={14} /></button>
                              <button className="pm-btn pm-btn-danger modern-table-action delete" onClick={()=>deleteCat(c._id)}><Trash2 size={14} /></button>
                            </div></td>}
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          ) : (
            /* PRODUCTS TAB */
            <motion.div key="prod" {...FV}>
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
                    {isAdmin && <button className="pm-btn pm-btn-primary" onClick={()=>openProdModal()}><Plus size={16}/>Add Product</button>}
                  </div>
                </div>
                <div className="pm-table-wrap modern-table-card">
                  <table className="pm-table modern-table">
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
                          const initials = p.name.split(' ').slice(0,2).map(w=>w[0]?.toUpperCase()||'').join('');
                          const color = avatarColor(p.name);
                          return (
                          <tr key={p._id}>
                            <td>
                              <div style={{display:'flex',alignItems:'center',gap:'0.875rem'}}>
                                <div className="pm-prod-avatar" style={{background:`${color}18`,color,padding:'10px',borderRadius:'12px',fontWeight:700,fontSize:'0.85rem'}}>{initials}</div>
                                <div>
                                  <div className="pm-prod-name" style={{fontWeight:700,fontSize:'0.9rem',color:'#0f172a'}}>{p.name}</div>
                                  {p.warrantyPeriod&&<div className="pm-prod-warranty" style={{fontSize:'0.7rem',color:'#64748b',marginTop:'0.15rem'}}>🛡 {p.warrantyPeriod}</div>}
                                </div>
                              </div>
                            </td>
                            <td style={{color:'var(--pm-t2)',fontWeight:600,fontSize:'0.85rem'}}>{p.category?.name}</td>
                            <td className="text-right">
                              <div style={{fontWeight:800,color:'#0f172a',fontSize:'0.9rem'}}>{sym(p.currencyType)} {p.price.toLocaleString(undefined,{minimumFractionDigits:2})}</div>
                              {p.isTaxIncluded&&<div style={{fontSize:'0.65rem',color:'#10b981',fontWeight:700,marginTop:'0.15rem'}}>Incl. Tax</div>}
                            </td>
                            <td className="text-center">
                              <span className={`pm-badge ${p.quantity>9?'pm-badge-in':p.quantity>0?'pm-badge-low':'pm-badge-out'}`}>
                                {p.quantity>0?`${p.quantity} units`:'Out of Stock'}
                              </span>
                            </td>
                            <td>
                              <div className="pm-table-actions modern-table-actions">
                                <button className="pm-btn pm-btn-view modern-table-action view" onClick={()=>openView(p)}><FileText size={14} /></button>
                                <button className="pm-btn pm-btn-stock modern-table-action stock" onClick={()=>openStockModal(p)}><Plus size={14} /></button>
                                {isAdmin&&<>
                                  <button className="pm-btn pm-btn-edit modern-table-action edit" onClick={()=>openProdModal(p)}><Edit2 size={14} /></button>
                                  <button className="pm-btn pm-btn-danger modern-table-action delete" onClick={()=>deleteProd(p._id)}><Trash2 size={14} /></button>
                                </>}
                              </div>
                            </td>
                          </tr>
                        )})
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ── VIEW MODAL ── */}
      <AnimatePresence>
        {viewProd && (
          <div className="pm-overlay" onClick={()=>setViewProd(null)}>
            <motion.div {...FM} className="pm-modal pm-modal-lg" onClick={e=>e.stopPropagation()}>
              <div className="pm-modal-header">
                <div className="pm-modal-title-row">
                  <div className="pm-card-icon green"><Package size={20}/></div>
                  <div><h2>{viewProd.name}</h2><div className="pm-modal-subtitle">{viewProd.productId} · {viewProd.category?.name}</div></div>
                </div>
                <button className="pm-modal-close" onClick={()=>setViewProd(null)}><X size={18}/></button>
              </div>
              <div className="pm-detail-grid">
                <div className="pm-detail-item"><div className="pm-detail-label">Selling Price</div><div className="pm-detail-value large">{sym(viewProd.currencyType)} {viewProd.price.toLocaleString(undefined,{minimumFractionDigits:2})}</div></div>
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
                        </div>
                        <div className="pm-entry-meta">
                          <span><Hash size={12}/> Qty: {e.quantity}</span>
                          {e.location&&<span><MapPin size={12}/> {e.location}</span>}
                          {e.buyingPrice>0&&<span><DollarSign size={12}/> Buy: {e.buyingPrice.toLocaleString(undefined,{minimumFractionDigits:2})}</span>}
                          {e.warrantyPeriod&&<span><ShieldCheck size={12}/> {e.warrantyPeriod}</span>}
                          {e.addedBy&&<span><Tag size={12}/> {e.addedBy.name||e.addedBy.username}</span>}
                        </div>
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
                <button className="pm-btn pm-btn-stock pm-btn-full" onClick={()=>{setViewProd(null);openStockModal(viewProd);}}><Plus size={15}/>Add Stock</button>
                <button className="pm-btn pm-btn-outline pm-btn-full" onClick={()=>setViewProd(null)}>Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── STOCK MODAL ── */}
      <AnimatePresence>
        {stockModal && (
          <div className="pm-overlay" onClick={()=>setStockModal(false)}>
            <motion.div {...FM} className="pm-modal pm-modal-md" onClick={e=>e.stopPropagation()}>
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
                  <div><label className="pm-label">Stock Location</label><input className="pm-input" value={stockForm.location} onChange={e=>setStockForm({...stockForm,location:e.target.value})} placeholder="e.g. Shelf A-3, Warehouse B"/></div>
                  <div><label className="pm-label">Buying Price / Unit</label><PriceInput value={parseFloat(stockForm.buyingPrice) || 0} onChange={v => setStockForm({...stockForm, buyingPrice: v.toString()})} className="pm-input" placeholder="0.00" /></div>
                </div>
                <div><label className="pm-label">Notes <span className="pm-label-optional">(optional)</span></label><textarea className="pm-input pm-textarea" value={stockForm.notes} onChange={e=>setStockForm({...stockForm,notes:e.target.value})} placeholder="Supplier name, invoice #, purchase order..."/></div>
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
                <button type="submit" className="pm-btn pm-btn-success pm-btn-full">Save Stock Entry</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CATEGORY MODAL ── */}
      <AnimatePresence>
        {catModal && (
          <div className="pm-overlay" onClick={()=>setCatModal(false)}>
            <motion.div {...FM} className="pm-modal pm-modal-sm" onClick={e=>e.stopPropagation()}>
              <div className="pm-modal-header">
                <div className="pm-modal-title-row"><div className="pm-card-icon blue"><FolderTree size={18}/></div><h2>{editCat?'Edit':'New'} Category</h2></div>
                <button className="pm-modal-close" onClick={()=>setCatModal(false)}><X size={18}/></button>
              </div>
              <form className="pm-form" onSubmit={e=>saveCat(e,false)}>
                <div><label className="pm-label">Category Name *</label><input className="pm-input" required value={catForm.name} onChange={e=>setCatForm({...catForm,name:e.target.value})} placeholder="e.g. Laptops"/></div>
                <div><label className="pm-label">Short Code *</label><input className="pm-input" required value={catForm.code} onChange={e=>setCatForm({...catForm,code:e.target.value.toUpperCase()})} placeholder="e.g. LAP"/></div>
                <div><label className="pm-label">Parent Category</label>
                  <select className="pm-input pm-select-input" value={catForm.parentCategory} onChange={e=>setCatForm({...catForm,parentCategory:e.target.value})}>
                    <option value="">— None (top-level) —</option>
                    {categories.filter(c=>!editCat||c._id!==editCat._id).map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="pm-btn pm-btn-success pm-btn-full">Save Category</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PRODUCT MODAL ── */}
      <AnimatePresence>
        {prodModal && (
          <div className="pm-overlay" onClick={()=>setProdModal(false)}>
            <motion.div {...FM} className="pm-modal pm-modal-md" onClick={e=>e.stopPropagation()}>
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
                      <input className="pm-input" placeholder="Code (e.g. LAP)" value={inlineCatForm.code} onChange={e=>setInlineCatForm({...inlineCatForm,code:e.target.value.toUpperCase()})}/>
                    </div>
                  ) : (
                    <select className="pm-input pm-select-input" style={{marginTop:'0.75rem'}} value={prodForm.category} onChange={e=>setProdForm({...prodForm,category:e.target.value})}>
                      <option value="" disabled>Select category...</option>
                      {categories.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  )}
                </div>
                <div className="pm-form-row pm-form-row-2">
                  <div><label className="pm-label">Selling Price *</label><PriceInput value={parseFloat(prodForm.price) || 0} onChange={v => setProdForm({...prodForm, price: v.toString()})} className="pm-input" required placeholder="0.00" /></div>
                  <div><label className="pm-label">Currency</label>
                    <select className="pm-input pm-select-input" value={prodForm.currencyType} onChange={e=>setProdForm({...prodForm,currencyType:e.target.value})}>
                      <option value="primary">Primary</option>
                      <option value="secondary">Secondary</option>
                    </select>
                  </div>
                </div>
                <div><label className="pm-label">Default Warranty Period</label><input className="pm-input" value={prodForm.warrantyPeriod} onChange={e=>setProdForm({...prodForm,warrantyPeriod:e.target.value})} placeholder="e.g. 1 year, 24 months"/></div>
                <div><label className="pm-label">Description <span className="pm-label-optional">(optional)</span></label><textarea className="pm-input pm-textarea" value={prodForm.description} onChange={e=>setProdForm({...prodForm,description:e.target.value})} placeholder="Product description, specs, notes..."/></div>
                <div className="pm-checkbox-row"><input type="checkbox" id="taxInc" checked={prodForm.isTaxIncluded} onChange={e=>setProdForm({...prodForm,isTaxIncluded:e.target.checked})}/><label htmlFor="taxInc">Selling price includes tax</label></div>
                <button type="submit" className="pm-btn pm-btn-success pm-btn-full">Save Product</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CONFIRM DIALOG ── */}
      <AnimatePresence>
        {confirm && (
          <div className="pm-overlay">
            <motion.div {...FM} className="pm-modal pm-modal-sm">
              <div className="pm-confirm-icon"><AlertTriangle size={56} color="#ef4444"/></div>
              <h3 className="pm-confirm-title">Are you sure?</h3>
              <p className="pm-confirm-msg">{confirm.msg}</p>
              <div className="pm-confirm-actions">
                <button className="pm-btn-abort" onClick={()=>setConfirm(null)}>Cancel</button>
                <button className="pm-btn-confirm-danger" onClick={()=>{confirm.onConfirm();setConfirm(null);}}>Yes, Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
export default ProductManagement;
