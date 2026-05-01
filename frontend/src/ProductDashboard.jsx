import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Package, Plus, Trash2, Edit2, Loader2, Save, X, ArrowLeft } from 'lucide-react';
import './ProductDashboard.css';

const API_GATEWAY = 'http://localhost:5000';

// Helper to decode JWT token
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

export default function ProductDashboard() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(location.state?.defaultCategory || '');
  const [extraFieldsList, setExtraFieldsList] = useState([]);
  const [showExtraFields, setShowExtraFields] = useState(false);

  // 1. Get vendor ID from Token
  const token = localStorage.getItem('vendorToken');
  const vendorInfo = token ? parseJwt(token) : null;
  const vendorId = vendorInfo?.id;

  // Helper for auth headers
  const getAuthHeaders = () => {
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // 2. Fetch Vendor Products
  const fetchProducts = async () => {
    if (!vendorId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_GATEWAY}/products/vendor/${vendorId}`, getAuthHeaders());
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [vendorId]);

  // 3. Handle Add Product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    let parsedExtraFields = {};
    if (showExtraFields) {
      extraFieldsList.forEach(f => {
        if (f.key.trim()) {
          parsedExtraFields[f.key.trim()] = f.value.trim();
        }
      });
    }

    try {
      const productData = {
        vendorId,
        name,
        price: parseFloat(price),
        category,
        ...parsedExtraFields
      };

      const res = await axios.post(`${API_GATEWAY}/products`, productData, getAuthHeaders());
      if (res.data.success) {
        // Reset form and refresh list
        setName('');
        setPrice('');
        setCategory('');
        setExtraFieldsList([]);
        setShowExtraFields(false);
        fetchProducts();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Handle Delete Product (Placeholder for now, assuming DELETE route exists)
  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await axios.delete(`${API_GATEWAY}/products/${productId}`, getAuthHeaders());
      fetchProducts();
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  if (!vendorId) {
    return <div className="product-dashboard-empty">Please log in to manage products.</div>;
  }

  return (
    <div className="product-dashboard">
      <div className="dashboard-header">
        <div style={{ width: '100%', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => navigate('/dashboard', { state: { returnToShopId: location.state?.shopId } })}
            style={{ background: 'white', color: '#6366f1', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          >
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
        </div>
        <div className="header-icon">
          <Package size={24} color="white" />
        </div>
        <h2>Product Management</h2>
        <p>Add, edit, and manage your inventory</p>
      </div>

      {error && <div className="dashboard-error">{error}</div>}

      <div className="dashboard-grid">
        
        {/* ADD PRODUCT FORM */}
        <section className="form-section">
          <h3><Plus size={18}/> Add New Product</h3>
          <form onSubmit={handleAddProduct} className="product-form">
            <div className="form-group">
              <label>Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                placeholder="e.g. Wireless Mouse"
              />
            </div>
            
            <div className="form-group">
              <label>Price ($)</label>
              <input 
                type="number" 
                step="0.01" 
                value={price} 
                onChange={(e) => setPrice(e.target.value)} 
                required 
                placeholder="29.99"
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <input 
                type="text" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                required 
                placeholder="Electronics"
              />
            </div>

            <div className="form-group">
              {!showExtraFields ? (
                <button type="button" onClick={() => { setShowExtraFields(true); setExtraFieldsList([{ key: '', value: '' }]); }} style={{ background: 'none', border: '1px dashed #cbd5e1', padding: '0.75rem', cursor: 'pointer', borderRadius: '6px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', fontWeight: '500' }}>
                  <Plus size={16} style={{ marginRight: '5px' }} /> Add other fields
                </button>
              ) : (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ margin: 0, fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>Extra Attributes</label>
                    <button type="button" onClick={() => { setShowExtraFields(false); setExtraFieldsList([]); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500' }}>Remove All</button>
                  </div>
                  {extraFieldsList.map((field, index) => (
                    <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <input 
                        type="text" 
                        placeholder="e.g. Color" 
                        value={field.key} 
                        onChange={(e) => {
                          const newList = [...extraFieldsList];
                          newList[index].key = e.target.value;
                          setExtraFieldsList(newList);
                        }} 
                        style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                      />
                      <input 
                        type="text" 
                        placeholder="e.g. Red" 
                        value={field.value} 
                        onChange={(e) => {
                          const newList = [...extraFieldsList];
                          newList[index].value = e.target.value;
                          setExtraFieldsList(newList);
                        }} 
                        style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                      />
                      {extraFieldsList.length > 1 && (
                        <button type="button" onClick={() => {
                          const newList = extraFieldsList.filter((_, i) => i !== index);
                          setExtraFieldsList(newList);
                        }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 0.5rem' }}><Trash2 size={16}/></button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setExtraFieldsList([...extraFieldsList, { key: '', value: '' }])} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', marginTop: '0.5rem', fontWeight: '500' }}>
                    <Plus size={14} style={{ marginRight: '4px' }} /> Add another field
                  </button>
                </div>
              )}
            </div>

            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </button>
          </form>
        </section>

        {/* PRODUCT LIST */}
        <section className="list-section">
          <h3>Your Inventory</h3>
          
          {isLoading ? (
            <div className="loading-state">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <Package size={48} className="empty-icon" />
              <p>No products found.</p>
              <span>Use the form to add your first product!</span>
            </div>
          ) : (
            <div className="product-list">
              {products.map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-info">
                    <h4>{product.name}</h4>
                    <span className="product-category">{product.category}</span>
                    <span className="product-price">${parseFloat(product.price).toFixed(2)}</span>
                  </div>
                  <div className="product-actions">
                    <button className="btn-icon text-blue" title="Edit" onClick={() => alert('Edit not implemented yet')}>
                      <Edit2 size={18} />
                    </button>
                    <button className="btn-icon text-red" title="Delete" onClick={() => handleDelete(product.id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
